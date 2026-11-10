import { Page, Locator, Route, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Màn Watchlist (`/watchlist` → `src/views/watchlist/WatchListPage.vue`) — chạy trên prev2 (bản preprod mới nhất).
 *
 * ⚠️ prev2 gọi BACKEND PRODUCTION, tài khoản test là tài khoản thật dùng chung → danh sách watchlist + mã trong từng
 * watchlist do `FakeWatchlistServer` (trong bộ nhớ) trả về, mọi thao tác thêm/xoá mã, tạo/sửa/xoá/sắp xếp watchlist chỉ
 * sửa máy chủ giả. Dữ liệu thị trường của từng mã (giá socket, điểm Canslim/4M `by-mack`, số CP lưu hành, `/api/filter`)
 * vẫn đọc thật — dùng mã thật (FPT, VNM, ACB…). Mọi request không phải GET khác tới `*.kfsp.vn/api/` (ghi chú
 * `user-note`, …) bị huỷ và ghi lại ở `blockedWrites` — trừ vài POST chỉ-đọc (`READ_ONLY_POST`).
 */

export type FakeList = { id: number; name: string; macks: string[] };
export type FakeMode = 'ok' | '500' | 'slow' | 'exist';

/** POST chỉ đọc dữ liệu (không ghi gì lên máy chủ) — được đi qua. */
const READ_ONLY_POST = /\/api\/login(\?|$)|\/getusersettings|\/canslim-fourm\/by-mack|\/count-stock-by-mack|\/api\/filter(\?|$)|\/api\/news\/news-related-by-mack|socket\.io/;

export class FakeWatchlistServer {
  lists: FakeList[] = [];
  private nextListId = 910000;
  private nextItemId = 990000;
  private itemIds = new Map<string, number>();
  /** Chế độ trả lời cho từng loại ghi. */
  modes: { addMack: FakeMode; deleteMack: FakeMode; create: FakeMode; update: FakeMode; deleteList: FakeMode; sort: FakeMode } =
    { addMack: 'ok', deleteMack: 'ok', create: 'ok', update: 'ok', deleteList: 'ok', sort: 'ok' };
  /** Trả lỗi 500 cho các GET danh sách. */
  readFails = { category: false, macks: false };
  /** `/api/filter` (dữ liệu bổ sung của bảng) trả 500. */
  filterFails = false;
  /** Ghi đè ô dữ liệu `/api/filter` theo mã: `{ FPT: { website: 'fpt.com.vn' } }`. */
  filterOverrides: Record<string, Record<string, unknown>> = {};
  /** Trì hoãn (ms) GET mã của watchlist — để quan sát lúc đang tải. */
  macksDelayMs = 0;
  readonly writes: { method: string; path: string; body: Record<string, unknown> }[] = [];
  readonly blockedWrites: string[] = [];

  seed(lists: { name: string; macks: string[] }[]) {
    this.lists = lists.map((l) => ({ id: this.nextListId++, name: l.name, macks: [...l.macks] }));
  }

  list(name: string) {
    const l = this.lists.find((x) => x.name === name);
    if (!l) throw new Error(`Không có watchlist giả "${name}"`);
    return l;
  }

  private itemId(listId: number, mack: string) {
    const k = `${listId}:${mack}`;
    if (!this.itemIds.has(k)) this.itemIds.set(k, this.nextItemId++);
    return this.itemIds.get(k)!;
  }

  private async reply(route: Route, mode: FakeMode, okJson: unknown) {
    if (mode === 'slow') await new Promise((r) => setTimeout(r, 2500));
    if (mode === '500') return route.fulfill({ status: 500, json: { message: 'error' } });
    if (mode === 'exist') return route.fulfill({ status: 400, json: { error_code: 'watch_list_mack_exist' } });
    return route.fulfill({ status: 200, json: okJson });
  }

  async install(page: Page) {
    // 1) Lưới an toàn: mọi request ghi tới API *.kfsp.vn bị huỷ (đăng ký TRƯỚC → các route cụ thể bên dưới thắng).
    await page.route(/^https:\/\/[^/]*kfsp\.vn\/api\//, async (route) => {
      const r = route.request();
      if (r.method() === 'GET' || READ_ONLY_POST.test(r.url())) return route.fallback();
      this.blockedWrites.push(`${r.method()} ${new URL(r.url()).pathname}`);
      return route.abort();
    });

    // 2) /api/filter: watchlistId của danh sách giả không có trên máy chủ → hỏi "all" rồi chỉ giữ mã của danh sách giả.
    await page.route(/\/api\/filter(\?|$)/, async (route) => {
      if (this.filterFails) return route.fulfill({ status: 500, body: 'error' });
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* */ }
      const fake = this.lists.find((l) => String(l.id) === String(body.watchlistId));
      if (!fake) return route.fallback();
      let res: Awaited<ReturnType<Route['fetch']>>;
      try {
        res = await route.fetch({ postData: JSON.stringify({ ...body, watchlistId: 'all' }) });
      } catch {
        // Test đã kết thúc (trang đóng) khi request còn bay → bỏ qua, không để lỗi lọt ra thành "did not run".
        return route.abort().catch(() => { /* trang đã đóng */ });
      }
      const data = await res.json().catch(() => null) as Record<string, unknown[]> | null;
      if (!data || !Array.isArray(data.mack)) return route.fulfill({ response: res }).catch(() => { /* trang đã đóng */ });
      const keep = data.mack.map((m, i) => (fake.macks.includes(String(m)) ? i : -1)).filter((i) => i >= 0);
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) out[k] = Array.isArray(v) && v.length === data.mack.length ? keep.map((i) => v[i]) : v;
      // Ghi đè từng ô theo mã (dữ liệu thật đổi theo ngày — vd website FPT có lúc rỗng).
      const macks = out.mack as unknown[];
      for (const [mack, fields] of Object.entries(this.filterOverrides)) {
        const idx = macks.findIndex((m) => String(m) === mack);
        if (idx < 0) continue;
        for (const [k, v] of Object.entries(fields)) if (Array.isArray(out[k])) (out[k] as unknown[])[idx] = v;
      }
      return route.fulfill({ response: res, json: out }).catch(() => { /* trang đã đóng */ });
    });

    // 3) Danh mục ở dropdown: giữ mục thật không phải watchlist (Nhật ký GD, Khác), thay watchlist bằng danh sách giả.
    await page.route(/\/api\/stocks\/ta_watchlist\/get-list-category(\?|$)/, async (route) => {
      if (this.readFails.category) return route.fulfill({ status: 500, body: 'error' });
      let real: { id: string; name: string; readonly?: boolean }[] = [];
      try { const res = await route.fetch(); real = await res.json(); } catch { /* */ }
      const others = (Array.isArray(real) ? real : []).filter((c) => !String(c.id).startsWith('watchlist_'));
      return route.fulfill({ json: [...this.lists.map((l) => ({ name: l.name, id: `watchlist_${l.id}`, readonly: false })), ...others] }).catch(() => { /* trang đã đóng */ });
    });

    await page.route(/\/api\/watchlist\/all-my-watchlist(\?|$)/, (route) => route.fulfill({
      json: { list_data_category: this.lists.map((l) => ({ id: l.id, name: l.name, receive_signal: 0, note: null })), list_data_category_sorted: null },
    }));

    await page.route(/\/api\/watchlist\/mack-by-my-watchlist\/(\d+)/, async (route) => {
      if (this.macksDelayMs) await new Promise((r) => setTimeout(r, this.macksDelayMs));
      if (this.readFails.macks) return route.fulfill({ status: 500, body: 'error' });
      const id = Number(/mack-by-my-watchlist\/(\d+)/.exec(route.request().url())![1]);
      const l = this.lists.find((x) => x.id === id);
      return route.fulfill({ json: (l?.macks || []).map((mack) => ({ id: this.itemId(id, mack), mack, user_id: 1, my_watchlist_id: id, note: null })) });
    });

    // 4) Ghi: thêm/xoá mã.
    await page.route(/\/api\/watchlist(\/\d+)?(\?|$)/, async (route) => {
      const r = route.request();
      const body = this.body(route);
      if (r.method() === 'POST') {
        this.writes.push({ method: 'POST', path: '/api/watchlist', body });
        const l = this.lists.find((x) => String(x.id) === String(body.my_watchlist_id));
        const mack = String(body.mack || '');
        if (this.modes.addMack === 'ok' && l && l.macks.includes(mack)) return this.reply(route, 'exist', null);
        if (['ok', 'slow'].includes(this.modes.addMack) && l) l.macks.push(mack);
        return this.reply(route, this.modes.addMack, { success: true });
      }
      if (r.method() === 'DELETE') {
        const itemId = Number(/\/api\/watchlist\/(\d+)/.exec(r.url())?.[1]);
        this.writes.push({ method: 'DELETE', path: `/api/watchlist/${itemId}`, body: {} });
        if (['ok', 'slow'].includes(this.modes.deleteMack)) {
          for (const [k, v] of this.itemIds) {
            if (v !== itemId) continue;
            const [listId, mack] = k.split(':');
            const l = this.lists.find((x) => x.id === Number(listId));
            if (l) l.macks = l.macks.filter((m) => m !== mack);
          }
        }
        return this.reply(route, this.modes.deleteMack, { success: true });
      }
      return route.fallback();
    });

    // 5) Ghi: tạo/sửa/xoá watchlist.
    await page.route(/\/api\/my-watchlist(\/\d*)?(\?|$)/, async (route) => {
      const r = route.request();
      const body = this.body(route);
      const id = Number(/\/api\/my-watchlist\/(\d+)/.exec(r.url())?.[1]);
      if (r.method() === 'GET') return route.fallback();
      this.writes.push({ method: r.method(), path: new URL(r.url()).pathname, body });
      if (r.method() === 'POST') {
        const ok = ['ok', 'slow'].includes(this.modes.create);
        const created = { id: this.nextListId++, name: String(body.name), macks: [] as string[] };
        if (ok) this.lists.push(created);
        return this.reply(route, this.modes.create, { id: created.id });
      }
      if (r.method() === 'PUT') {
        if (['ok', 'slow'].includes(this.modes.update)) { const l = this.lists.find((x) => x.id === id); if (l) l.name = String(body.name); }
        return this.reply(route, this.modes.update, { success: true });
      }
      if (r.method() === 'DELETE') {
        if (['ok', 'slow'].includes(this.modes.deleteList)) this.lists = this.lists.filter((x) => x.id !== id);
        return this.reply(route, this.modes.deleteList, { success: true });
      }
      return route.fallback();
    });

    await page.route(/\/api\/sort-my-watchlist(\?|$)/, async (route) => {
      const body = this.body(route);
      this.writes.push({ method: 'POST', path: '/api/sort-my-watchlist', body });
      return this.reply(route, this.modes.sort, { success: true });
    });
  }

  private body(route: Route): Record<string, unknown> {
    try {
      const b = JSON.parse(route.request().postData() || '{}');
      delete b.token;
      return b;
    } catch { return {}; }
  }

  writesOf(method: string, pathRe: RegExp) {
    return this.writes.filter((w) => w.method === method && pathRe.test(w.path));
  }
}

/** Bộ danh sách giả mặc định: A (3 mã), B (2 mã), Rỗng (0 mã). */
export const DEFAULT_LISTS = [
  { name: 'Auto A', macks: ['FPT', 'VNM', 'HPG'] },
  { name: 'Auto B', macks: ['ACB', 'MBB'] },
  { name: 'Auto Rỗng', macks: [] },
];

export type WatchlistOpenOptions = {
  account?: Prev2Account;
  lists?: { name: string; macks: string[] }[];
  /** Giá trị localStorage đặt trước khi vào trang (vd `watchlist_right_tab`). */
  storage?: Record<string, string>;
};

export class WatchlistPage extends BasePage {
  readonly server = new FakeWatchlistServer();
  readonly session: Prev2Session;
  readonly pageErrors: string[] = [];
  readonly consoleErrors: string[] = [];

  // Header
  readonly picker: Locator;
  readonly pickerLabel: Locator;
  readonly dropdownMenu: Locator;
  readonly manageLink: Locator;
  readonly addButton: Locator;
  readonly addPopover: Locator;
  readonly addPopoverTitle: Locator;
  readonly addInput: Locator;
  // Bảng
  readonly tableTabs: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  // Bố cục
  readonly leftColumn: Locator;
  readonly rightColumn: Locator;
  readonly resizeHandle: Locator;
  readonly resetLayoutButton: Locator;
  readonly rightPanelTabs: Locator;
  readonly notesTab: Locator;
  readonly postsTab: Locator;
  readonly rightContent: Locator;
  // Ghi chú
  readonly noteMackFilter: Locator;
  readonly addNoteButton: Locator;
  // Modal
  readonly manageModal: Locator;
  readonly createUpdateModal: Locator;
  readonly deleteStockConfirmModal: Locator;
  readonly deleteWholeListConfirmModal: Locator;
  readonly toastSuccess: Locator;
  readonly toastError: Locator;

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') this.consoleErrors.push(m.text()); });

    this.picker = page.locator('.wl-pick-toggler');
    this.pickerLabel = this.picker.locator('.kfsp-text-color');
    this.dropdownMenu = page.locator('.dropdown-watchlist-menu');
    this.manageLink = this.dropdownMenu.locator('.manager-watchlist');
    this.addButton = page.getByRole('button', { name: 'Thêm mã' });
    this.addPopover = page.locator('.wl-add-pop');
    this.addPopoverTitle = this.addPopover.locator('.wl-add-title');
    this.addInput = this.addPopover.getByPlaceholder('Nhập mã hoặc tên công ty');

    this.tableTabs = page.locator('.menu-nav-tab');
    this.table = page.locator('.datatable-watchlist');
    this.rows = this.table.locator('tbody tr');

    this.leftColumn = page.locator('.watchlist-left');
    this.rightColumn = page.locator('.watchlist-right');
    this.resizeHandle = page.locator('.watchlist-page > .resize');
    this.resetLayoutButton = page.getByRole('button', { name: 'Đặt lại bố cục mặc định' });
    this.rightPanelTabs = page.locator('.watchlist-right .tabs-menu .tab-item');
    this.notesTab = this.rightPanelTabs.filter({ hasText: 'Ghi chú' });
    this.postsTab = this.rightPanelTabs.filter({ hasText: 'Bài viết' });
    this.rightContent = page.locator('.watchlist-right .tabs-content');

    this.noteMackFilter = this.rightContent.locator('.multi-select-base', { hasText: 'Mã CK:' }).first();
    this.addNoteButton = this.rightContent.getByText('Thêm ghi chú mới', { exact: true });

    this.manageModal = page.locator('.modal.show', { hasText: 'Quản lý Watchlist' });
    this.createUpdateModal = page.locator('.modal.show').filter({ has: page.getByRole('button', { name: 'Lưu' }) });
    this.deleteStockConfirmModal = page.locator('.modal.show', { hasText: 'Xóa dữ liệu' });
    this.deleteWholeListConfirmModal = page.locator('.modal.show', { hasText: 'Những mã thuộc Watchlist này' });
    this.toastSuccess = page.locator('.Vue-Toastification__toast--success');
    this.toastError = page.locator('.Vue-Toastification__toast--error');
  }

  async open(opts: WatchlistOpenOptions = {}) {
    const { account = 'paid', lists = DEFAULT_LISTS, storage = {} } = opts;
    this.server.seed(lists);
    await this.server.install(this.page);
    if (Object.keys(storage).length) {
      await this.page.addInitScript((s) => {
        try {
          if (sessionStorage.getItem('__wl_storage_seeded')) return;
          Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v));
          sessionStorage.setItem('__wl_storage_seeded', '1');
        } catch { /* */ }
      }, storage);
    }
    await this.session.open({ account, path: '/watchlist' });
    if (!/\/watchlist/.test(this.page.url())) await this.page.goto('/watchlist', { waitUntil: 'domcontentloaded' });
    await this.waitReady();
  }

  // ---- Tương thích ngược cho spec khác (toan-canh-thi-truong-suc-manh-dong-tien.spec.ts): vào /watchlist với
  // dữ liệu THẬT, không cài máy chủ giả. ----
  async goto(path = '/watchlist') {
    await super.goto(path, { waitUntil: 'domcontentloaded' });
    await this.rows.first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => { /* watchlist rỗng */ });
  }
  tableRow(mack: string): Locator { return this.row(mack); }
  deleteIconOf(mack: string): Locator { return this.row(mack).locator('[data-title="Xóa"]'); }

  /** Chờ header có tên watchlist + bảng có đủ số dòng của danh sách đang chọn. */
  async waitReady() {
    await expect(this.pickerLabel).not.toHaveText('', { timeout: 30000 });
    const name = (await this.pickerLabel.textContent())?.trim() || '';
    const fake = this.server.lists.find((l) => l.name === name);
    if (fake && fake.macks.length) await expect(this.rows.filter({ has: this.page.locator('td') })).toHaveCount(Math.min(fake.macks.length, 14), { timeout: 30000 });
  }

  tableTab(label: string): Locator {
    return this.tableTabs.locator('.nav-tab-item', { hasText: label }).filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) });
  }

  row(mack: string): Locator {
    return this.rows.filter({ has: this.page.locator('td').first().filter({ hasText: new RegExp(`^\\s*${mack}\\s*$`) }) });
  }

  async macksInTable(): Promise<string[]> {
    return (await this.rows.locator('td:first-child').allTextContents()).map((t) => t.trim()).filter(Boolean);
  }

  async openDropdown() {
    await this.picker.click();
    await expect(this.dropdownMenu).toBeVisible();
  }

  dropdownTab(label: 'Watchlist' | 'Nhật ký GD' | 'Khác'): Locator {
    return this.dropdownMenu.locator('.option_tab-item', { hasText: label });
  }

  dropdownItem(name: string): Locator {
    return this.dropdownMenu.getByRole('menuitem', { name, exact: true });
  }

  async selectList(name: string) {
    await this.openDropdown();
    await this.dropdownItem(name).click();
    await expect(this.pickerLabel).toHaveText(name);
  }

  async openManageModal() {
    await this.openDropdown();
    await this.manageLink.click();
    await expect(this.manageModal).toBeVisible();
  }

  manageItem(name: string): Locator {
    return this.manageModal.locator('.watchlist-item').filter({ has: this.page.locator('.name', { hasText: new RegExp(`☰\\s*${name}\\s*$`) }) });
  }

  get manageItems(): Locator { return this.manageModal.locator('.watchlist-item'); }
  get addWatchlistButton(): Locator { return this.manageModal.getByRole('button', { name: 'Thêm watchlist' }); }
  get manageCloseButton(): Locator { return this.manageModal.getByRole('button', { name: 'Close' }); }
  get nameInput(): Locator { return this.createUpdateModal.getByRole('textbox').first(); }
  get saveButton(): Locator { return this.createUpdateModal.getByRole('button', { name: 'Lưu' }); }
  get cancelButton(): Locator { return this.createUpdateModal.getByRole('button', { name: 'Hủy' }); }
  get createUpdateTitle(): Locator { return this.createUpdateModal.locator('.modal-title'); }

  /** Mở hộp "Thêm mã", gõ mã rồi chọn đúng gợi ý của mã đó. */
  async addMack(mack: string) {
    if (!(await this.addPopover.isVisible())) await this.addButton.click();
    await this.addInput.fill(mack);
    const option = this.addOption(mack);
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }

  /** Gợi ý trong hộp "Thêm mã" (`SingleSelectBase`: tối đa 5 dòng "MÃ - Tên công ty"). */
  get addOptions(): Locator { return this.addPopover.getByRole('menuitem'); }
  addOption(mack: string): Locator {
    return this.addOptions.filter({ hasText: new RegExp(`^\\s*${mack} - `) }).first();
  }

  /** Bề rộng cột trái theo % khung. */
  async leftRatio(): Promise<number> {
    return this.page.evaluate(() => {
      const c = document.querySelector('.watchlist-page') as HTMLElement;
      const l = document.querySelector('.watchlist-left') as HTMLElement;
      return l.getBoundingClientRect().width / c.getBoundingClientRect().width;
    });
  }

  async dragResizeTo(ratio: number) {
    const page = this.page;
    const c = (await page.locator('.watchlist-page').boundingBox())!;
    const h = (await this.resizeHandle.boundingBox())!;
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(c.x + c.width * ratio, h.y + h.height / 2, { steps: 10 });
    await page.mouse.up();
  }
}
