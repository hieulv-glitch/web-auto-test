import { Page, Locator, Route, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from './BasePage';
import { Prev2Session, prev2Account } from './Prev2Session';

/**
 * Trang "Backtest chiến lược" (`/backtest-chien-luoc`, menu Cơ hội › Backtest chiến lược, nhãn Beta). Nguồn: nhánh
 * `thanh/backtest-simplify` của `stocks` — `src/views/backtest/index.vue` + `StrategyPicker.vue`, `DealList.vue`,
 * `TradeReplay.vue`, `ChartSettings.vue`, `ChartToggle.vue`, `engine/runStore.js` (nay đã lên preprod/production). Môi trường:
 * `PREV2_BASE_URL` (09/11/2026 = https://kfsp.vn, backend production), đăng nhập qua `Prev2Session` (tài khoản TEST_USER_* hoặc FREE_USER_*).
 *
 * ⚠️ AN TOÀN DỮ LIỆU: lịch sử các lần chạy nằm trên máy chủ theo tài khoản (`/api/backtest/run`: GET danh sách,
 * GET `/:id`, POST lưu lượt, PATCH `/:id/pin`, DELETE `/:id`). `open()` thay toàn bộ API này bằng 1 máy chủ giả
 * trong bộ nhớ (`FakeBacktestServer`), nên chạy/ghim/xoá lịch sử trong test KHÔNG chạm tới tài khoản thật, và mỗi
 * test bắt đầu từ đúng lịch sử nó chọn (`seeds`). Riêng `history: 'real'` cho đọc lịch sử thật (chỉ GET), mọi lệnh
 * ghi vẫn bị chặn. Ô tìm mã (`SearchStockCode`) lưu mã đang chọn qua `/updateusersettings` — cũng bị chặn.
 * Nến giá vẫn lấy thật qua socket (`getsymbolinfo` + `gethistory`), nên số liệu đổi theo ngày: test chỉ assert cấu
 * trúc/định dạng, không assert con số cụ thể.
 */

const FIXTURE_DIR = path.join(__dirname, '..', 'tests', 'fixtures', 'backtest');
const BACKTEST_API = /\/api\/backtest\/run(\/|\?|$)/;

type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Lượt mẫu lấy từ máy chủ thật (đã chụp 15/10/2026): 1 chiến lược (MBB, Chandelier Exit, 3 năm) và 4 chiến lược
 * (CTD, 5 năm). `purged` là bản sao lượt MBB đã bị máy chủ dọn tầng 2 (chỉ còn tóm tắt). */
export type Seed = 'mbb' | 'ctd4' | 'purged';

function loadSeed(seed: Seed): Json {
  const file = seed === 'ctd4' ? 'run-ctd-4-chien-luoc.json' : 'run-mbb-1-chien-luoc.json';
  const run = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8'));
  if (seed === 'purged') {
    run.tier2_purged = true;
    run.manifest_hash = 'autotest-purged';
    run.from_date = '15/10/2024';
  }
  return run;
}

export type FailOn = Partial<Record<'list' | 'detail' | 'save' | 'pin' | 'delete', number>>;

/** Máy chủ lịch sử giả: giữ các lượt (khuôn đủ như `GET /run/:id`), trả đúng khuôn như máy chủ thật. */
export class FakeBacktestServer {
  runs: Json[] = [];
  readonly calls: { method: string; url: string; body?: Json }[] = [];
  fail: FailOn = {};
  /** Trễ (ms) trước khi trả lời `GET /run/:id` — để kịp thấy dải "Đang lấy chi tiết lượt chạy…". */
  detailDelayMs = 0;
  /** Trễ (ms) trước khi trả lời POST lưu lượt. Mặc định 400ms ≈ máy chủ thật: trả lời NGAY (0ms) thì trang dính lỗi
   * đua `openRun` ↔ `adoptServerId` và không mở lượt vừa chạy (xem TC_BACKTEST_83). */
  saveDelayMs = 400;

  constructor(seeds: Seed[]) {
    seeds.forEach((s, i) => this.runs.push({ ...loadSeed(s), id: seeds.length - i }));
  }

  get saved(): Json[] { return this.calls.filter((c) => c.method === 'POST').map((c) => c.body); }
  callsOf(method: string): { method: string; url: string; body?: Json }[] { return this.calls.filter((c) => c.method === method); }

  private preview(r: Json): Json {
    return {
      ...r,
      strategies: r.strategies.map((s: Json) => ({ strategy_key: s.strategy_key, strategy_no: s.strategy_no, title: s.title })),
      rows: r.rows.map((x: Json) => ({ ...x, equity: null, trades: [] })),
    };
  }

  async handle(route: Route) {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());
    let body: Json;
    try { body = req.postDataJSON(); } catch { body = undefined; }
    this.calls.push({ method, url: url.pathname, body });
    const m = /\/run\/(\d+)(\/pin)?$/.exec(url.pathname);
    const id = m ? Number(m[1]) : null;
    const failWith = (k: keyof FailOn) => this.fail[k] ? route.fulfill({ status: this.fail[k]!, json: { message: 'autotest' } }) : null;

    if (method === 'GET' && id === null) {
      if (this.fail.list) return failWith('list');
      const limit = Number(url.searchParams.get('limit') || 50);
      return route.fulfill({ json: this.runs.slice(0, limit).map((r) => this.preview(r)) });
    }
    if (method === 'GET') {
      if (this.detailDelayMs) await new Promise((r) => setTimeout(r, this.detailDelayMs));
      if (this.fail.detail) return failWith('detail');
      const run = this.runs.find((r) => r.id === id);
      if (!run) return route.fulfill({ status: 404, json: { message: 'not found' } });
      const out = run.tier2_purged ? { ...run, rows: run.rows.map((x: Json) => ({ ...x, equity: null, trades: [] })) } : run;
      return route.fulfill({ json: out });
    }
    if (method === 'POST') {
      if (this.saveDelayMs) await new Promise((r) => setTimeout(r, this.saveDelayMs));
      if (this.fail.save) return failWith('save');
      const dup = this.runs.find((r) => r.manifest_hash === body.manifest_hash);
      if (dup) { dup.ran_at = body.ran_at; return route.fulfill({ status: 200, json: { id: dup.id, duplicated: true } }); }
      const newId = Math.max(0, ...this.runs.map((r) => r.id)) + 1;
      this.runs.unshift({ ...body, id: newId, pinned: false, tier2_purged: false });
      return route.fulfill({ status: 201, json: { id: newId } });
    }
    if (method === 'PATCH') {
      if (this.fail.pin) return failWith('pin');
      const run = this.runs.find((r) => r.id === id);
      if (run) run.pinned = !!body?.pinned;
      return route.fulfill({ json: { id, pinned: !!body?.pinned } });
    }
    if (method === 'DELETE') {
      if (this.fail.delete) return failWith('delete');
      this.runs = this.runs.filter((r) => r.id !== id);
      return route.fulfill({ status: 200, body: '' });
    }
    return route.abort();
  }
}

// ---- Tài khoản + đăng nhập: dùng chung `Prev2Session` (pages/Prev2Session.ts — kfsp.vn/prev2, TEST_USER_*/FREE_USER_*) ----
/** Giữ tên cũ cho spec. */
export const preAccount = prev2Account;

export type OpenOptions = {
  account?: 'paid' | 'free';
  /** Lịch sử ban đầu do máy chủ giả trả về (mặc định rỗng). */
  seeds?: Seed[];
  /** 'real' → đọc lịch sử thật của tài khoản (chỉ GET), mọi lệnh ghi bị chặn. */
  history?: 'fake' | 'real';
  /** Query thêm vào URL, vd `?demo=1`. */
  query?: string;
  /** Giá trị khởi tạo `localStorage.bt_sidebar_collapsed` ('1' thu gọn); null không đặt. */
  sidebarCollapsed?: '0' | '1' | null;
};

export class BacktestPage extends BasePage {
  readonly server: FakeBacktestServer;
  readonly session: Prev2Session;
  /** Các lệnh ghi setting đã bị chặn (ô tìm mã lưu `final_mack`), dạng JSON từng `listitem`. */
  get blockedSettingWrites(): string[] { return this.session.settingWrites.map((w) => JSON.stringify(w)); }
  /** Lệnh ghi lên API backtest thật đã bị chặn khi `history: 'real'`. */
  readonly blockedBacktestWrites: string[] = [];

  constructor(page: Page, seeds: Seed[] = []) {
    super(page);
    this.server = new FakeBacktestServer(seeds);
    this.session = new Prev2Session(page);
  }

  // ================= Chuẩn bị =================
  async open(opts: OpenOptions = {}) {
    const { account = 'paid', history = 'fake', query = '', sidebarCollapsed = '0' } = opts;
    if (opts.seeds) this.server.runs = new FakeBacktestServer(opts.seeds).runs;
    await this.page.route(BACKTEST_API, async (route) => {
      if (history === 'fake') return this.server.handle(route);
      if (route.request().method() === 'GET') return route.continue();
      this.blockedBacktestWrites.push(route.request().method() + ' ' + route.request().url());
      return route.abort();
    });
    if (sidebarCollapsed !== null) {
      await this.page.addInitScript((v) => {
        try { if (sessionStorage.getItem('__bt_sidebar_seeded')) return; localStorage.setItem('bt_sidebar_collapsed', v); sessionStorage.setItem('__bt_sidebar_seeded', '1'); } catch { /* */ }
      }, sidebarCollapsed);
    }
    // Đăng nhập (dùng lại phiên đã cache) + chặn ghi setting (ô tìm mã lưu `final_mack`).
    await this.session.open({ account, path: '/backtest-chien-luoc' + query });
    await this.pageReady.waitFor({ state: 'visible', timeout: 60000 });
    await this.afterOpen();
  }

  private async afterOpen() {
    await this.dismissPackageModalIfShown();
    // Chờ lịch sử nạp xong (dòng "Đang lấy lịch sử…" biến mất) và socket giá sẵn sàng.
    await expect(this.page.getByText('Đang lấy lịch sử các lần chạy…')).toBeHidden({ timeout: 30000 });
    // Danh sách mã của web đã nạp (tên công ty dưới ô Mã hiện) — trước đó ô tìm mã chưa có gợi ý nào.
    await expect(this.companyName).toBeAttached({ timeout: 30000 }); // attached: cột thiết lập có thể đang thu gọn
    await this.page.waitForFunction(() => !!(window as unknown as { socket_send?: unknown }).socket_send, null, { timeout: 30000 });
  }

  /** Popup "Chọn dịch vụ" bật sau khi đăng nhập tài khoản Free — che cả trang, phải đóng. */
  async dismissPackageModalIfShown() {
    const modal = this.page.locator('.modal.show, .modal.d-block').filter({ hasText: 'Chọn dịch vụ' });
    if (await modal.first().isVisible().catch(() => false)) {
      await modal.first().locator('button.close').first().click();
      await expect(modal.first()).toBeHidden();
    }
  }

  /** Cột thiết lập hoặc cột nút thu gọn — 1 trong 2 luôn hiện khi trang đã dựng (nút Chạy ẩn khi đang thu gọn). */
  get pageReady(): Locator { return this.page.locator('.bt-side:visible').first(); }

  // ================= Cột thiết lập =================
  get sidebar(): Locator { return this.page.locator('.bt-side-bt'); }
  get rail(): Locator { return this.page.locator('.bt-side-rail'); }
  get collapseBtn(): Locator { return this.page.getByRole('button', { name: 'Thu gọn thiết lập' }); }
  get expandBtn(): Locator { return this.page.getByRole('button', { name: 'Mở thiết lập' }); }
  railBtn(name: 'Mã' | 'Chiến lược chạy' | 'Thời gian chạy' | 'Số tiền mỗi lần mua' | 'Lịch sử các lần chạy'): Locator {
    return this.rail.getByRole('button', { name, exact: true });
  }
  settingCell(label: string): Locator { return this.sidebar.locator('.bt-tl-cell').filter({ has: this.page.locator('.bt-tl-label', { hasText: label }) }); }

  get symbolInput(): Locator { return this.page.locator('.bt-stock').getByPlaceholder('Mã CK'); }
  get symbolSuggestions(): Locator { return this.page.locator('.bt-stock .search-stockcode_item'); }
  get companyName(): Locator { return this.page.locator('.bt-stock-name'); }

  get strategyChips(): Locator { return this.page.locator('.bt-strat-chip'); }
  chip(name: string): Locator { return this.strategyChips.filter({ hasText: name }); }
  chipRemove(name: string): Locator { return this.chip(name).getByTitle('Bỏ chiến lược này khỏi lượt chạy'); }
  get addStrategyBtn(): Locator { return this.page.getByRole('button', { name: '+ Thêm chiến lược' }); }

  get periodSelect(): Locator { return this.page.getByRole('combobox', { name: 'Thời gian chạy' }); }
  dateField(caption: 'Từ ngày' | 'Tới ngày'): Locator { return this.page.locator('.bt-field-date').filter({ hasText: caption }); }
  dateInput(caption: 'Từ ngày' | 'Tới ngày'): Locator { return this.dateField(caption).getByPlaceholder('dd/mm/yyyy'); }

  /** "Số tiền mỗi lần mua" (trước 16/10/2026 là "Quy mô một deal" có ô chọn cách tính — nay chỉ còn số tiền cố định). */
  get sizeInput(): Locator { return this.page.getByRole('textbox', { name: 'Số tiền mỗi lần mua' }); }
  get sizeUnit(): Locator { return this.page.locator('.bt-unit-input span'); }

  /** Nút Chạy / Dừng cùng 1 chỗ (biểu tượng SVG thay ký tự ▶ ■ từ 19/10/2026). */
  get runBtn(): Locator { return this.page.locator('.bt-run-btn:not(.stop)'); }
  get stopBtn(): Locator { return this.page.locator('.bt-run-btn.stop'); }
  get demoTag(): Locator { return this.page.getByText('Dữ liệu mẫu, không phải giá thật'); }

  // ================= Lịch sử các lần chạy =================
  get historyHeader(): Locator { return this.page.locator('.bt-phead-ls'); }
  get historyCount(): Locator { return this.page.locator('.bt-ls-count'); }
  get historyClearBtn(): Locator { return this.page.getByTitle('Xoá toàn bộ lịch sử các lần chạy'); }
  get historyItems(): Locator { return this.page.locator('.bt-hist-item'); }
  /** Thẻ của "Lượt #n". Từ 19/10/2026 thẻ không ghi số lượt nữa; số lượt = (số lượt trong danh sách − vị trí), lượt mới
   * nhất ở trên cùng (`runNo` trong index.vue) → lượt #n là thẻ thứ n tính từ DƯỚI lên. */
  historyItem(no: number): Locator { return this.page.locator(`.bt-ls > .bt-hist-item:nth-last-child(${no})`); }
  /** Nút thùng rác xoá 1 lượt (chỉ hiện khi rê chuột, chỉ có ở lượt đã có id máy chủ). */
  deleteBtn(no: number): Locator { return this.historyItem(no).getByRole('button', { name: 'Xoá lượt chạy này' }); }
  /** Hộp hỏi lại của trang (`ConfirmDialog.vue`, thay `window.confirm` từ 15/10/2026). */
  get confirmDialog(): Locator { return this.page.getByRole('alertdialog'); }
  get historyEmpty(): Locator { return this.page.getByText('Chưa có lượt chạy nào.'); }

  // ================= Bảng chọn chiến lược =================
  get picker(): Locator { return this.page.getByRole('dialog', { name: 'Chọn chiến lược' }); }
  get pickerSearch(): Locator { return this.picker.getByPlaceholder('Tìm theo tên, ví dụ cắt lỗ, RSI, mẫu'); }
  get pickerItems(): Locator { return this.picker.locator('.sp-pick'); }
  pickerItem(name: string): Locator { return this.pickerItems.filter({ hasText: name }); }
  get pickerClose(): Locator { return this.picker.locator('.sp-close'); }
  get pickerBackdrop(): Locator { return this.page.locator('.sp-backdrop'); }
  get pickerCount(): Locator { return this.picker.locator('.sp-count'); }
  get pickerEmpty(): Locator { return this.picker.locator('.sp-empty'); }

  async openPicker() {
    await this.addStrategyBtn.click();
    await expect(this.picker).toBeVisible();
  }
  /** Thêm các chiến lược (theo tên) vào lượt chạy rồi đóng bảng chọn. */
  async addStrategies(...names: string[]) {
    await this.openPicker();
    for (const n of names) await this.pickerItem(n).click();
    await this.pickerClose.click();
    await expect(this.picker).toBeHidden();
  }

  // ================= Tiến độ / lỗi =================
  get progress(): Locator { return this.page.locator('.bt-progress-text'); }
  get errorBox(): Locator { return this.page.locator('.bt-error'); }
  errorRow(k: 'Chuyện gì' | 'Vì sao' | 'Làm gì tiếp'): Locator { return this.errorBox.locator('.bt-error-row').filter({ hasText: k }); }
  /** Toast của web (`vue-toastification`). */
  get toast(): Locator { return this.page.locator('.Vue-Toastification__toast'); }
  toastWith(text: string | RegExp): Locator { return this.toast.filter({ hasText: text }); }

  // ================= Phần kết quả =================
  get resultHeader(): Locator { return this.page.locator('.bt-run-h'); }
  get runRange(): Locator { return this.page.locator('.bt-run-range'); }
  get placeholder(): Locator { return this.page.locator('.bt-ph'); }
  get kpis(): Locator { return this.page.locator('.bt-kpi'); }
  kpi(title: string): Locator { return this.kpis.filter({ hasText: title }); }
  /** Hàng tab mục lục trong thẻ đầu trang (từ 19/10/2026; trước là chip `.bt-toc-item`). */
  get tocItems(): Locator { return this.page.getByRole('navigation', { name: 'Các mục kết quả' }).locator('.bt-tab'); }
  tocItem(title: string): Locator { return this.tocItems.filter({ hasText: title }); }
  section(id: 'bt-sec-lailo' | 'bt-sec-ruiro' | 'bt-sec-thang' | 'bt-sec-giaodich'): Locator { return this.page.locator('#' + id); }
  get strategyFilter(): Locator { return this.page.locator('select.bt-pick-sel'); }
  get resultTable(): Locator { return this.page.locator('.bt-table.bt-scan table'); }
  get resultRows(): Locator { return this.resultTable.locator('tbody tr'); }
  resultHeaderCell(label: string): Locator { return this.resultTable.locator('thead th').filter({ hasText: new RegExp(`^\\s*${label}`) }); }
  /** Nút "Biểu đồ / Bảng" ở tiêu đề mục Lãi lỗ (bảng so sánh chiến lược). */
  get tableViewToggle(): Locator { return this.section('bt-sec-lailo').locator('.bt-sec-h').getByRole('group', { name: 'Xem dạng biểu đồ hay bảng' }); }
  get runSymbol(): Locator { return this.page.locator('.bt-run-sym'); }
  get runStrategy(): Locator { return this.page.locator('.bt-run-strat'); }
  get floatTip(): Locator { return this.page.locator('.bt-float-tip'); }
  get warnBanners(): Locator { return this.page.locator('.bt-cri-err'); }

  // Chi tiết giao dịch
  get chartViewBtns(): Locator { return this.section('bt-sec-giaodich').getByRole('group', { name: 'Cách xem diễn biến giao dịch' }).getByRole('button'); }
  chartViewBtn(name: 'Replay' | 'Biểu đồ'): Locator { return this.chartViewBtns.filter({ hasText: name }); }
  get chartWho(): Locator { return this.page.locator('.bt-chart-who'); }
  get chartSettingsBtn(): Locator { return this.page.getByRole('button', { name: 'Thiết lập biểu đồ' }); }
  get chartSettingsPop(): Locator { return this.page.getByRole('dialog', { name: 'Thiết lập biểu đồ' }); }
  get replay(): Locator { return this.page.locator('.bt-replay'); }
  get dealList(): Locator { return this.page.locator('.dl'); }
  get dealCount(): Locator { return this.page.locator('.dl-count'); }
  get dealRows(): Locator { return this.page.locator('.dl-tr-deal'); }
  get dealLines(): Locator { return this.page.locator('.dl-tr-line'); }
  get dealSort(): Locator { return this.page.getByRole('combobox', { name: 'Sắp xếp deal' }); }

  // ================= Thao tác =================
  /** Chọn mã qua ô tìm kiếm: gõ rồi bấm đúng dòng gợi ý có mã đó. */
  async selectSymbol(code: string) {
    await this.symbolInput.click();
    await this.symbolInput.fill('');
    await this.symbolInput.pressSequentially(code, { delay: 30 });
    await this.symbolSuggestions.filter({ has: this.page.locator('.search-stockcode_item--code', { hasText: new RegExp(`^\\s*${code}\\s*$`) }) }).first().click();
    await expect(this.symbolInput).toHaveValue(code);
  }

  /** Chọn "Tuỳ chỉnh" rồi gõ 2 ngày dạng dd/mm/yyyy. */
  async setCustomPeriod(from: string, to: string) {
    await this.periodSelect.selectOption('custom');
    await this.dateInput('Từ ngày').fill(from);
    await this.dateInput('Tới ngày').fill(to);
  }

  /** Bấm Chạy Backtest và chờ chạy xong (nút Chạy hiện lại). */
  async runAndWait(timeout = 120_000) {
    await this.runBtn.click();
    await expect(this.runBtn).toBeVisible({ timeout });
  }

  /** Bấm Chạy và chờ có kết quả của lượt mới (dòng tên lượt hiện). */
  async runToResult(timeout = 120_000) {
    await this.runAndWait(timeout);
    await expect(this.resultHeader).toBeVisible({ timeout: 30000 });
  }

  /** Mở 1 lượt trong lịch sử và chờ phần kết quả của nó dựng xong. */
  async openHistory(no: number) {
    await this.historyItem(no).click();
    await expect(this.resultHeader).toContainText(`Lượt #${no}`, { timeout: 30000 });
    await expect(this.page.getByText('Đang lấy chi tiết lượt chạy…')).toBeHidden({ timeout: 30000 });
  }

  /** scrollTop của cột kết quả (`.bt-mbody`). */
  async resultScrollTop(): Promise<number> {
    return this.page.locator('.bt-mbody').evaluate((el) => el.scrollTop);
  }
}
