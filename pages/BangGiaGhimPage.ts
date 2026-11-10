import { Page, Locator, Route, expect } from '@playwright/test';
import { BangGiaPage } from './BangGiaPage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Bảng giá — ẩn/hiện cột kéo + ghim và đồng bộ mã ghim với app (tính năng mới trên `preprod`):
 * - `feat/show-hide-pin-bang-gia` (13/10/2026, commit f5545a114): cột nút kéo đổi vị trí + nút ghim ở đầu dòng mặc định
 *   THU GỌN; mũi tên ở góc ô tiêu đề "Mã" (`.price-board-action-toggle`, aria-label "Mở cột sắp xếp, ghim") mở cột ra,
 *   mũi tên chuyển sang ô tiêu đề của chính cột đó ("Thu cột sắp xếp, ghim"). Trạng thái mở/thu chỉ nằm trong state
 *   React (`is_edit_rows`), không lưu.
 * - `fix/ghim_banggia` (26/10/2026, commit f4c471b93): mã ghim lưu ở setting `price_board_obj_pinned` dùng chung với app
 *   mobile → web KHÔNG ghi nguyên khối nữa mà đọc-gộp-ghi: `GET /getusersettings?keys=price_board_obj_pinned` rồi chỉ áp
 *   đúng các thao tác ghim/bỏ ghim vừa làm (`pinned_ops`), `POST /updateusersettings`. Đọc lại mã ghim mỗi khi tab trình
 *   duyệt hiện lại (`visibilitychange`) và sau khi nạp danh sách watchlist.
 *   Source: `src/views/ibd/stock/liveBoard/{wrapperLayout.js,headerLiveBoard.js,rowItem.js,index.vue}`.
 *
 * ⚠️ AN TOÀN DỮ LIỆU (kfsp.vn gọi backend production, tài khoản thật dùng chung):
 * - `/getusersettings` bị thay response: các khoá trạng thái bảng giá (`price_board_type_list/_type_board/
 *   _current_category_id/_department_selected/_trading_signal_or_filter_selected`) đặt về "Toàn bộ", và
 *   `price_board_obj_pinned` lấy từ `remotePinned` — kho mã ghim GIẢ đóng vai "bản trên máy chủ" (app mobile có thể đã
 *   đổi). Request `?keys=price_board_obj_pinned` được trả hẳn từ kho giả (đếm ở `pinnedReads`, đổi lỗi bằng
 *   `pinnedReadMode`).
 * - `/updateusersettings`: lượt ghi `price_board_obj_pinned` → cập nhật kho giả, trả thành công giả (ghi lại ở
 *   `pinnedWrites`); mọi khoá khác → huỷ (`Prev2Session.settingWrites`). `/delusersettings` → huỷ.
 * - Lưới an toàn: mọi request không phải GET tới `*.kfsp.vn` khác (trừ đăng nhập, socket.io) bị huỷ và ghi ở `blocked`.
 */
export type PinnedMap = Record<string, string[]>;
export type FakeMode = 'ok' | '500' | 'abort';

const STATE_KEYS = ['price_board_type_list', 'price_board_type_board', 'price_board_current_category_id',
  'price_board_department_selected', 'price_board_trading_signal_or_filter_selected', 'price_board_obj_pinned'];

export type GhimOpenOptions = {
  account?: Prev2Account;
  /** Mã ghim ban đầu trên "máy chủ" (mặc định không ghim gì). */
  pinned?: PinnedMap;
  /** Sàn mở sẵn (mặc định "all" = Toàn bộ). */
  board?: string;
};

export class BangGiaGhimPage extends BangGiaPage {
  readonly session: Prev2Session;
  /** Bản `price_board_obj_pinned` trên "máy chủ" (giả). */
  remotePinned: PinnedMap = {};
  pinnedReads = 0;
  pinnedReadMode: FakeMode = 'ok';
  pinnedWriteMode: FakeMode = 'ok';
  /** Giá trị `price_board_obj_pinned` của mọi lần web định ghi (kể cả lần bị giả lỗi). */
  readonly pinnedWrites: PinnedMap[] = [];
  /** Request ghi lọt lưới an toàn (đã huỷ). */
  readonly blocked: string[] = [];
  readonly pageErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
  }

  get browserPage(): Page { return this.page; }

  async open(opts: GhimOpenOptions = {}) {
    const { account = 'paid', pinned = {}, board = 'all' } = opts;
    this.remotePinned = JSON.parse(JSON.stringify(pinned));

    // Lưới an toàn — đăng ký TRƯỚC (route đăng ký sau được hỏi trước).
    await this.page.route((u) => /(^|\.)kfsp\.vn$/.test(u.hostname), async (route) => {
      const r = route.request();
      if (r.method() === 'GET' || r.method() === 'OPTIONS' || /socket\.io|\/api\/login(\?|$)/.test(r.url())) return route.fallback();
      // POST chỉ đọc (trang Watchlist dùng khi điều hướng qua lại — TC_BGGHIM_20; tab "Watchlist" ở panel phải tải
      // tin tức liên quan bằng `news/news-related-by-mack` — TC_BANGGIA_43).
      if (/\/api\/(filter|watchlist\/canslim-fourm\/by-mack|stocks\/count-stock-by-mack|news\/news-related-by-mack)(\?|$)/.test(r.url())) return route.fallback();
      this.blocked.push(`${r.method()} ${r.url().split('?')[0]}`);
      // Nhật ký hoạt động (mở modal biểu đồ…) — trả thành công giả để web khỏi báo lỗi.
      if (/\/api\/activitylog\//.test(r.url())) return route.fulfill({ json: { success: true } });
      return route.abort();
    });
    await this.page.route(/\/getusersettings(\?|$)/, (route) => this.handleGetSettings(route, board));
    await this.session.open({ account, path: '/bang-gia', clearKeysAfterLogin: STATE_KEYS });
    // Sau session.open (route của Prev2Session đăng ký trước → route này được hỏi trước).
    await this.page.route(/\/updateusersettings(\?|$)/, (route) => this.handleUpdateSettings(route));
    await this.waitBoardReady();
  }

  private async handleGetSettings(route: Route, board: string) {
    const url = new URL(route.request().url());
    if (url.searchParams.get('keys') === 'price_board_obj_pinned') {
      this.pinnedReads++;
      if (this.pinnedReadMode === 'abort') return route.abort();
      if (this.pinnedReadMode === '500') return route.fulfill({ status: 500, json: { message: 'Server Error' } });
      return route.fulfill({ json: [{ key: 'price_board_obj_pinned', value: JSON.stringify(this.remotePinned) }] });
    }
    let res: Awaited<ReturnType<Route['fetch']>> | undefined;
    for (let i = 0; i < 3 && !res; i++) {
      try { res = await route.fetch(); } catch (e) { if (i === 2) throw e; await new Promise((r) => setTimeout(r, 1000)); }
    }
    let items: { key: string; value: string }[] = [];
    try { items = await res!.json(); } catch { /* giữ mảng rỗng */ }
    if (!Array.isArray(items)) items = [];
    items = items.filter((i) => !STATE_KEYS.includes(i.key) && !/^price_board_obj_order_/.test(i.key));
    items.push(
      { key: 'price_board_type_list', value: 'board' },
      { key: 'price_board_type_board', value: board },
      { key: 'price_board_current_category_id', value: '' },
      { key: 'price_board_department_selected', value: 'Tất cả' },
      { key: 'price_board_trading_signal_or_filter_selected', value: 'null' },
      { key: 'price_board_obj_pinned', value: JSON.stringify(this.remotePinned) },
    );
    await route.fulfill({ response: res!, json: items });
  }

  private async handleUpdateSettings(route: Route) {
    let body: { listitem?: { key: string; value: string }[] } = {};
    try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* */ }
    const item = (body.listitem || []).find((i) => i.key === 'price_board_obj_pinned');
    if (!item) return route.fallback(); // khoá khác → Prev2Session huỷ + ghi lại
    let value: PinnedMap = {};
    try { value = JSON.parse(item.value); } catch { /* */ }
    this.pinnedWrites.push(value);
    if (this.pinnedWriteMode === 'abort') return route.abort();
    if (this.pinnedWriteMode === '500') return route.fulfill({ status: 500, json: { message: 'Server Error' } });
    this.remotePinned = value;
    return route.fulfill({ json: { success: true } });
  }

  /** Chờ bảng có dòng + bỏ popup "Chọn dịch vụ" nếu có. */
  async waitBoardReady() {
    await expect(this.mainRows.first()).toBeVisible({ timeout: 45_000 });
    const modal = this.page.locator('.modal.show').filter({ hasText: 'Chọn dịch vụ' });
    if (await modal.count()) {
      await modal.locator('button.close').first().click().catch(() => {});
      await modal.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }

  // ================= Locator =================
  get actionToggle(): Locator { return this.headerRow.locator('.price-board-action-toggle'); }
  get actionTip(): Locator { return this.page.locator('.price-board-action-tip'); }
  get codeHeader(): Locator { return this.headerRow.locator('.header-col.code, .header-col.code_ps').first(); }
  get actionHeader(): Locator { return this.headerRow.locator('.header-col.action'); }
  rowByCode(code: string, area: Locator = this.mainRows): Locator {
    return area.filter({ has: this.page.locator('.price-board-col.code a, .price-board-col.code_ps a', { hasText: new RegExp(`^${code}$`) }) });
  }
  codeOf(row: Locator): Locator { return row.locator('.price-board-col.code a, .price-board-col.code_ps a').first(); }
  dragIconOf(row: Locator): Locator { return row.locator('[title="Kéo để thay đổi vị trí"]'); }

  async mainCodes(): Promise<string[]> {
    return this.mainRows.locator('.price-board-col.code a, .price-board-col.code_ps a').allInnerTexts().then((a) => a.map((s) => s.trim()));
  }
  async pinnedCodes(): Promise<string[]> {
    return this.pinnedRows.locator('.price-board-col.code a, .price-board-col.code_ps a').allInnerTexts().then((a) => a.map((s) => s.trim()));
  }

  async openActionCol() {
    if ((await this.actionToggle.getAttribute('aria-expanded')) !== 'true') await this.actionToggle.click();
    await expect(this.actionToggle).toHaveAttribute('aria-expanded', 'true');
  }

  /** Bấm ghim/bỏ ghim của một dòng (cột kéo + ghim phải đang mở). */
  async togglePin(row: Locator) {
    await row.locator('[title="Nhấn để ghim lên đầu"], [title="Nhấn để bỏ ghim"]').first().click();
  }

  /** Giả lập "tab trình duyệt hiện lại" — web đọc lại mã ghim (onVisibilityChangePinned). */
  async fireTabVisible() {
    await this.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  }

  /** Độ rộng tối thiểu (style minWidth) của hàng tiêu đề, px. */
  async headerMinWidth(): Promise<number> {
    return this.headerRow.evaluate((el) => parseFloat((el as HTMLElement).style.minWidth || '0'));
  }

  /** Khoá ghim của sàn đang xem trong localStorage. */
  async localPinned(): Promise<PinnedMap> {
    return this.page.evaluate(() => { try { return JSON.parse(localStorage.getItem('price_board_obj_pinned') || '{}'); } catch { return {}; } });
  }
}
