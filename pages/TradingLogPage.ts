import { Page, Locator, Route, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Trang "Nhật ký giao dịch" (`/nhat-ky-giao-dich`, `stocks/src/views/tradingLog/index.vue`) — giao diện làm lại trên
 * `preprod` (commit 187608c20 ngày 03/11/2026 "đổi giao diện cả năm tab", cùng loạt commit 07/10–05/11).
 * 5 tab (`<CTabs>` CoreUI, mỗi tab là `<a href="#" class="nav-link">` → role `link`):
 *   0 "Tài sản" (estate.vue) · 1 "Giao dịch" (tabTradingHistory/tradingHistory.vue) · 2 "Phân tích giao dịch"
 *   (analysis.vue) · 3 "Phân bổ vốn" (CapitalAllocation.vue) · 4 "Danh mục" (ManageCategory.vue).
 * Tab đang chọn được NHỚ trong localStorage `trading_log_view_state` (tradingLogViewState.js); deep-link
 * `?tab=nhat-ky-giao-dich` thắng bản nhớ và mở tab "Giao dịch".
 *
 * Môi trường: `PREV2_BASE_URL` (từ 09/11/2026 = https://kfsp.vn, đã ngang preprod mới nhất) — gọi **backend production**, tài khoản kfsp.vn thật (TEST_USER_* /
 * FREE_USER_*), xem `Prev2Session`.
 *
 * ⚠️ AN TOÀN DỮ LIỆU — tài khoản test có nhật ký giao dịch THẬT:
 * - Toàn bộ API đọc/ghi của NKGD được thay bằng `NkgdFakeServer` (dữ liệu giả cố định trong bộ nhớ): mọi test chạy
 *   trên cùng một bộ danh mục/giao dịch giả, không đọc cũng không ghi nhật ký thật.
 * - Lưới an toàn: MỌI request không phải GET tới `*.kfsp.vn` (trừ đăng nhập, socket.io) mà máy chủ giả không xử lý
 *   đều bị huỷ và ghi vào `blocked` — kể cả endpoint chưa biết. Spec kiểm tra `blocked` rỗng sau mỗi test.
 * - Ghi setting (`capital_allocation_data_save`, `tradingview.tradinglog_setting`…) bị `Prev2Session` chặn; body ghi
 *   lại ở `settingWrites`.
 */

// ===================================================================================================================
// Dữ liệu giả
// ===================================================================================================================
export type NkType = 'mua' | 'ban' | 'tien_mat' | 'co_phieu' | 'phat_hanh';
export type NkLog = {
  id: number; mack: string; ngay_giao_dich: string; loai_giao_dich: NkType; khoi_luong: number; gia_thuc_hien: number;
  phi: number; danh_muc: number; lai_lo_da_thuc_hien: number;
  target_price_1: number; target_price_2: number; target_price_3: number;
  stop_loss_price_1: number; stop_loss_price_2: number; stop_loss_price_3: number;
  setup: string; mistake: string; chu_thich: string; so_ngay_nam_giu: number; percent_cutloss: number;
};
export type NkCategory = { id: number; name: string };

/** Ngày giao dịch cách hôm nay `daysAgo` ngày, lùi về thứ 6 gần nhất nếu rơi vào cuối tuần — "YYYY-MM-DD 00:00:00". */
export function nkDate(daysAgo: number): string {
  const d = new Date(Date.now() + 7 * 3600_000 - daysAgo * 86400_000);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10) + ' 00:00:00';
}
/** Ngày làm việc gần nhất trước hôm nay `daysAgo` ngày, dạng "YYYY-MM-DD" (cho ô `type=date`). */
export const nkDay = (daysAgo = 1) => nkDate(daysAgo).slice(0, 10);
/** Thứ 7 gần nhất trong quá khứ, "YYYY-MM-DD". */
export function lastSaturday(): string {
  const d = new Date(Date.now() + 7 * 3600_000 - 86400_000);
  while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

let seq = 980000;
export function nkLog(p: Partial<NkLog> & Pick<NkLog, 'mack' | 'loai_giao_dich' | 'danh_muc'>): NkLog {
  return {
    id: seq++, ngay_giao_dich: nkDate(10), khoi_luong: 1000, gia_thuc_hien: 50, phi: 0.15, lai_lo_da_thuc_hien: 0,
    target_price_1: 0, target_price_2: 0, target_price_3: 0, stop_loss_price_1: 0, stop_loss_price_2: 0, stop_loss_price_3: 0,
    setup: '[]', mistake: '[]', chu_thich: '', so_ngay_nam_giu: 0, percent_cutloss: 0, ...p,
  };
}

/** 3 danh mục giả. "Dài hạn" tự nhập vốn 500 triệu; 2 danh mục còn lại chạy vốn tự động. */
export const CAT = { DAI_HAN: 970001, LUOT_SONG: 970002, CO_TUC: 970003 } as const;
export const CAT_NAME: Record<number, string> = { [CAT.DAI_HAN]: 'Dài hạn', [CAT.LUOT_SONG]: 'Lướt sóng', [CAT.CO_TUC]: 'Cổ tức' };
export const DAI_HAN_VON = 500_000_000;

export type NkData = { categories: NkCategory[]; logs: NkLog[]; softDeleted: NkCategory[]; riskIndex: number;
  tradingStyle: { stock_trader: number; stock_businessman: number; value_investor: number };
  /** `capital_allocation_data_save`: vốn tự nhập (đồng, chuỗi) + cấu hình Phân bổ vốn theo id danh mục. */
  capital: Record<string, { tong_tai_san: string; phan_tram_cutloss_toi_da: string; phan_tram_muc_giam_gia_tu_mua: string }> };

/** Bộ dữ liệu chuẩn: Dài hạn (FPT mua 2 lần + bán 1 phần, VNM mua, cổ tức tiền VNM), Lướt sóng (HPG mua rồi bán hết có
 * lãi, MBB mua, SSI mua), Cổ tức (thưởng cổ phiếu FPT + quyền mua). */
export function defaultNkData(): NkData {
  const D = CAT.DAI_HAN, L = CAT.LUOT_SONG, C = CAT.CO_TUC;
  return {
    categories: [{ id: D, name: CAT_NAME[D] }, { id: L, name: CAT_NAME[L] }, { id: C, name: CAT_NAME[C] }],
    softDeleted: [{ id: 970009, name: 'Danh mục cũ' }],
    riskIndex: 0.5,
    tradingStyle: { stock_trader: 0.6, stock_businessman: 0.3, value_investor: 0.1 },
    capital: { [D]: { tong_tai_san: String(DAI_HAN_VON), phan_tram_cutloss_toi_da: '2', phan_tram_muc_giam_gia_tu_mua: '10' } },
    logs: [
      nkLog({ mack: 'FPT', loai_giao_dich: 'mua', danh_muc: D, ngay_giao_dich: nkDate(120), khoi_luong: 1000, gia_thuc_hien: 48, chu_thich: 'Mua tích luỹ', target_price_1: 60, stop_loss_price_1: 44, setup: '["Breakout"]' }),
      nkLog({ mack: 'FPT', loai_giao_dich: 'mua', danh_muc: D, ngay_giao_dich: nkDate(60), khoi_luong: 500, gia_thuc_hien: 52 }),
      nkLog({ mack: 'FPT', loai_giao_dich: 'ban', danh_muc: D, ngay_giao_dich: nkDate(20), khoi_luong: 400, gia_thuc_hien: 56, lai_lo_da_thuc_hien: 2_600 }),
      nkLog({ mack: 'VNM', loai_giao_dich: 'mua', danh_muc: D, ngay_giao_dich: nkDate(90), khoi_luong: 2000, gia_thuc_hien: 60 }),
      nkLog({ mack: 'VNM', loai_giao_dich: 'tien_mat', danh_muc: D, ngay_giao_dich: nkDate(30), khoi_luong: 2000, gia_thuc_hien: 1, phi: 0.15, chu_thich: 'Trả cổ tức bằng tiền, 1,500 đồng/CP' }),
      nkLog({ mack: 'HPG', loai_giao_dich: 'mua', danh_muc: L, ngay_giao_dich: nkDate(45), khoi_luong: 3000, gia_thuc_hien: 25 }),
      nkLog({ mack: 'HPG', loai_giao_dich: 'ban', danh_muc: L, ngay_giao_dich: nkDate(15), khoi_luong: 3000, gia_thuc_hien: 28, lai_lo_da_thuc_hien: 8_800, mistake: '["Bán sớm"]' }),
      nkLog({ mack: 'MBB', loai_giao_dich: 'mua', danh_muc: L, ngay_giao_dich: nkDate(12), khoi_luong: 1500, gia_thuc_hien: 20 }),
      nkLog({ mack: 'SSI', loai_giao_dich: 'mua', danh_muc: L, ngay_giao_dich: nkDate(5), khoi_luong: 1000, gia_thuc_hien: 21 }),
      nkLog({ mack: 'FPT', loai_giao_dich: 'mua', danh_muc: C, ngay_giao_dich: nkDate(200), khoi_luong: 500, gia_thuc_hien: 45 }),
      nkLog({ mack: 'FPT', loai_giao_dich: 'co_phieu', danh_muc: C, ngay_giao_dich: nkDate(100), khoi_luong: 500, gia_thuc_hien: 0, phi: 0.2, chu_thich: 'Thưởng cổ phiếu, tỷ lệ 5:1' }),
    ],
  };
}

export type NkMode = 'ok' | 'slow' | '500' | '422' | 'abort';
export type NkWrite = { method: string; path: string; body: any };
type SyncResult = { groups: unknown[]; inserted: number; removed: number; has_pending: boolean };
const EMPTY_SYNC: SyncResult = { groups: [], inserted: 0, removed: 0, has_pending: false };

export class NkgdFakeServer {
  data: NkData = defaultNkData();
  /** Request ghi đã nhận (máy chủ giả xử lý, KHÔNG tới production). */
  readonly writes: NkWrite[] = [];
  /** Request ghi không ai xử lý → bị lưới an toàn huỷ. Phải rỗng ở cuối mỗi test. */
  readonly blocked: string[] = [];
  /** Số lần đọc từng endpoint (khoá: 'getAll', 'categories', 'softDeleted', 'mackList', 'risk'). */
  readonly reads: Record<string, number> = {};
  mode: Record<'store' | 'update' | 'delete' | 'bulk' | 'catStore' | 'catUpdate' | 'catDelete' | 'catRestore' | 'catForce' | 'sync', NkMode> =
    { store: 'ok', update: 'ok', delete: 'ok', bulk: 'ok', catStore: 'ok', catUpdate: 'ok', catDelete: 'ok', catRestore: 'ok', catForce: 'ok', sync: 'ok' };
  /** Endpoint đọc trả 500 (khoá như `reads`). */
  readonly readFails = new Set<string>();
  /** Kết quả đối soát cổ tức cho lượt `dry_run` (mở chi tiết mã ở tab Tài sản) và lượt ghi (sau thêm/sửa/xoá, "Cập nhật"). */
  syncDryRun: SyncResult = { ...EMPTY_SYNC };
  syncApply: SyncResult = { ...EMPTY_SYNC };
  private nextId = 990000;

  writesTo(re: RegExp) { return this.writes.filter((w) => re.test(w.path)); }

  private listMack() { return [...new Set(this.data.logs.map((l) => l.mack))].map((mack) => ({ mack })); }
  private allPayload() { return { list_data_item: this.data.logs, list_data_mack: this.listMack(), trading_style: this.data.tradingStyle }; }

  async install(page: Page) {
    // Lưới an toàn — đăng ký TRƯỚC (route đăng ký sau được ưu tiên): request ghi lọt qua mọi máy chủ giả rơi vào đây.
    await page.route((u) => /(^|\.)(kfsp\.vn|vietpointer\.vn)$/.test(u.hostname), async (route) => {
      const r = route.request();
      if (r.method() === 'GET' || r.method() === 'OPTIONS' || /socket\.io|\/api\/login(\?|$)/.test(r.url())) return route.fallback();
      this.blocked.push(`${r.method()} ${r.url().split('?')[0]}`);
      return route.abort();
    });
    await page.route(/\/api\/(tradinglog|stocks\/trading_log|stocks\/category|dividend-auto-record)\//, (route) => this.handle(route));
  }

  private async reply(route: Route, mode: NkMode, json: unknown, status422: unknown = { message: 'invalid' }) {
    if (mode === 'abort') return route.abort();
    if (mode === '500') return route.fulfill({ status: 500, json: { message: 'Server Error' } });
    if (mode === '422') return route.fulfill({ status: 422, json: status422 });
    if (mode === 'slow') await new Promise((r) => setTimeout(r, 2500));
    return route.fulfill({ json });
  }

  private async handle(route: Route) {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());
    const p = url.pathname;
    let body: any = {};
    try { body = JSON.parse(req.postData() || '{}'); } catch { /* không phải JSON */ }
    if (body && typeof body === 'object') delete body.token;
    const read = async (key: string, json: unknown) => {
      this.reads[key] = (this.reads[key] || 0) + 1;
      if (this.readFails.has(key)) return route.fulfill({ status: 500, json: { message: 'Server Error' } });
      return route.fulfill({ json });
    };

    if (method === 'GET') {
      if (/\/tradinglog\/getAll$/.test(p)) return read('getAll', this.allPayload());
      if (/\/(tradinglog|stocks)\/category\/get-all$/.test(p)) return read('categories', this.data.categories);
      if (/\/stocks\/category\/all-soft-delete$/.test(p)) return read('softDeleted', this.data.softDeleted);
      if (/get-list-mack-by-tradinglog$/.test(p)) {
        const map: Record<string, string[]> = {};
        for (const c of this.data.categories) {
          const codes = [...new Set(this.data.logs.filter((l) => l.danh_muc === c.id).map((l) => l.mack))].sort();
          if (codes.length) map[`${c.name}_${c.id}`] = codes;
        }
        return read('mackList', { list_data_mack: map });
      }
      if (/get-risk-aversion-index$/.test(p)) return read('risk', this.data.riskIndex);
      // GET khác trong nhóm này: chưa giả lập → trả rỗng thay vì đọc dữ liệu thật.
      return route.fulfill({ json: [] });
    }

    this.writes.push({ method, path: p, body });
    if (/\/tradinglog\/store$/.test(p)) {
      if (this.mode.store === 'ok' || this.mode.store === 'slow') {
        this.data.logs.unshift(nkLog({ id: this.nextId++, mack: String(body.mack), loai_giao_dich: body.loai_giao_dich,
          danh_muc: Number(body.danh_muc), ngay_giao_dich: `${body.ngay_giao_dich} 00:00:00`,
          khoi_luong: Number(String(body.khoi_luong).replace(/,/g, '')), gia_thuc_hien: Number(body.gia_thuc_hien),
          phi: Number(body.phi), chu_thich: body.chu_thich || '' }));
      }
      return this.reply(route, this.mode.store, this.allPayload());
    }
    if (/\/tradinglog\/add-bulk$/.test(p)) return this.reply(route, this.mode.bulk, this.allPayload());
    if (/\/stocks\/trading_log\/update$/.test(p)) {
      if (this.mode.update === 'ok' || this.mode.update === 'slow') {
        const log = this.data.logs.find((l) => l.id === Number(body.id));
        if (log) Object.assign(log, { ngay_giao_dich: `${body.ngay_giao_dich} 00:00:00`, loai_giao_dich: body.loai_giao_dich,
          khoi_luong: Number(String(body.khoi_luong).replace(/,/g, '')), gia_thuc_hien: Number(body.gia_thuc_hien),
          phi: Number(body.phi), danh_muc: Number(body.danh_muc), chu_thich: body.chu_thich || '' });
      }
      return this.reply(route, this.mode.update, this.allPayload());
    }
    const delLog = p.match(/\/stocks\/trading_log\/(\d+)$/);
    if (delLog && method === 'DELETE') {
      if (this.mode.delete === 'ok') this.data.logs = this.data.logs.filter((l) => l.id !== Number(delLog[1]));
      return this.reply(route, this.mode.delete, this.allPayload());
    }
    if (/\/dividend-auto-record\/sync-after-transactions$/.test(p)) {
      return this.reply(route, this.mode.sync, body.dry_run ? this.syncDryRun : this.syncApply);
    }
    if (/\/stocks\/category\/store$/.test(p)) {
      const cat = { id: this.nextId++, name: String(body.name) };
      if (this.mode.catStore === 'ok') this.data.categories.push(cat);
      return this.reply(route, this.mode.catStore, cat);
    }
    if (/\/stocks\/category\/update$/.test(p)) {
      const cat = this.data.categories.find((c) => c.id === Number(body.id));
      if (cat && this.mode.catUpdate === 'ok') cat.name = String(body.name);
      return this.reply(route, this.mode.catUpdate, { id: Number(body.id), name: String(body.name) }, { error: 'Already name' });
    }
    if (/\/stocks\/category\/restore$/.test(p)) return this.reply(route, this.mode.catRestore, { success: true });
    if (/\/stocks\/category\/force-delete\/\d+$/.test(p)) return this.reply(route, this.mode.catForce, { success: true });
    if (/\/stocks\/category\/\d+$/.test(p) && method === 'DELETE') return this.reply(route, this.mode.catDelete, { success: true });
    // Ghi chưa biết trong nhóm NKGD → huỷ, ghi vào blocked.
    this.blocked.push(`${method} ${p}`);
    return route.abort();
  }
}

// ===================================================================================================================
// Page Object
// ===================================================================================================================
/** Escape ký tự đặc biệt khi đưa tên (vd "Lướt sóng T+") vào RegExp. */
export const reEsc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const NK_TABS = ['Tài sản', 'Giao dịch', 'Phân tích giao dịch', 'Phân bổ vốn', 'Danh mục'] as const;
export type NkTab = typeof NK_TABS[number];

export type NkOpenOptions = {
  account?: Prev2Account;
  /** Tab được nhớ sẵn trong `trading_log_view_state` trước khi mở trang (mặc định 0 = Tài sản). `null` = không đặt. */
  tab?: number | null;
  /** Query thêm vào URL (vd `tab=nhat-ky-giao-dich`). */
  query?: string;
  /** Sửa dữ liệu giả trước khi mở trang. */
  data?: (d: NkData) => void;
  /** Khoá localStorage đặt sẵn (1 lần mỗi phiên tab, F5 không đặt lại). */
  local?: Record<string, string>;
  /** Có chờ thanh tab hiện không (mặc định có). */
  waitTabs?: boolean;
};

export class TradingLogPage extends BasePage {
  readonly server = new NkgdFakeServer();
  readonly session: Prev2Session;
  readonly settingWrites: { key: string; value: unknown }[];
  readonly pageErrors: string[] = [];
  readonly root: Locator;
  readonly tabBar: Locator;
  readonly anyModal: Locator;
  readonly toastSuccess: Locator;
  readonly toastError: Locator;

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    this.settingWrites = this.session.settingWrites;
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
    this.root = page.locator('.tradingLog-component');
    // Không dùng `.nav-tabs` trần: dropdown chuông header cũng có 1 `.nav-tabs` ẩn đứng trước trong DOM.
    this.tabBar = this.root.locator('ul.nkgd-tabs').first();
    this.anyModal = page.locator('.modal.show:visible');
    this.toastSuccess = page.locator('.Vue-Toastification__toast--success');
    this.toastError = page.locator('.Vue-Toastification__toast--error');
  }

  async open(opts: NkOpenOptions = {}) {
    const { account = 'paid', tab = 0, query, data, local = {}, waitTabs = true } = opts;
    if (data) data(this.server.data);
    await this.server.install(this.page);
    const capital = JSON.stringify(this.server.data.capital);
    const seed: Record<string, string> = { capital_allocation_data_save: capital, ...local };
    if (tab !== null) seed.trading_log_view_state = JSON.stringify({ active_tab: tab });
    // Đặt 1 lần mỗi phiên tab: F5 trong test phải thấy đúng thứ app tự ghi.
    await this.page.addInitScript((items) => {
      try {
        if (sessionStorage.getItem('__nkgd_seeded')) return;
        ['field_table_trading_history_more_v2', 'estate_mo_muc_gop', 'estate_kieu_co_cau', 'estate_co_cau_tien_mat_lai_lo',
          'estate_chart_range_days', 'trading_log_last_fee_percent', 'capital_allocation_input'].forEach((k) => localStorage.removeItem(k));
        Object.entries(items).forEach(([k, v]) => localStorage.setItem(k, v as string));
        sessionStorage.setItem('__nkgd_seeded', '1');
      } catch { /* */ }
    }, seed);
    const own = ['capital_allocation_data_save', 'capital_allocation_input', 'field_table_trading_history_more_v2'];
    await this.session.open({
      account,
      path: '/nhat-ky-giao-dich' + (query ? `?${query}` : ''),
      patchSettings: (items) => [...items.filter((i) => !own.includes(i.key)), { key: 'capital_allocation_data_save', value: capital }],
      clearKeysAfterLogin: Object.keys(seed),
    });
    if (waitTabs) await this.waitTabsOrRetry();
  }

  /** Chờ thanh tab; prev2 thỉnh thoảng trả trang lỗi nginx 5xx khi quá tải → tải lại tối đa 3 lần. */
  async waitTabsOrRetry() {
    for (let i = 0; ; i++) {
      try { await expect(this.tabBar).toBeVisible({ timeout: 30000 }); return; } catch (e) {
        const body = await this.page.locator('body').innerText().catch(() => '');
        if (i >= 3 || !/(500|502|503|504) .*(Error|Gateway|Unavailable)|nginx/i.test(body)) throw e;
        await this.page.waitForTimeout(3000);
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
    }
  }

  /** App tắt mọi toast thành công (`main.js`: `$toast.success = () => {}`, 12/10/2026) → thao tác thành công không
   * hiện toast nào. Gọi SAU khi đã chờ kết quả thao tác. */
  async expectSilentSuccess() {
    await this.page.waitForTimeout(300);
    await expect(this.page.locator('.Vue-Toastification__toast')).toHaveCount(0);
  }

  /** Nhập số vào ô tiền `TextMask` (directive v-money): v-money dời con trỏ về cuối khi focus nên `fill()` bị nối vào sau giá
   * trị cũ → focus, chọn hết, xoá, gõ như người dùng. */
  async fillMoney(input: Locator, value: string) {
    await input.click();
    await this.page.waitForTimeout(100);
    await input.press('Control+A');
    await input.press('Backspace');
    await input.pressSequentially(value);
  }

  // ---------------- Khung ----------------
  tab(name: NkTab): Locator { return this.tabBar.getByRole('link', { name, exact: true }); }
  /** Tên tab đang active. */
  async activeTab(): Promise<string> { return (await this.tabBar.locator('.nav-link.active').innerText()).trim(); }
  async gotoTab(name: NkTab) { await this.tab(name).click(); await expect(this.tab(name)).toHaveClass(/active/); }
  /** Pane đang hiện (CTabs giữ mọi pane trong DOM, chỉ pane active hiện). */
  get pane(): Locator { return this.root.locator('.tab-pane.active'); }
  get protectedView(): Locator { return this.pane.locator('.blurred-image'); }
  modal(title: string | RegExp): Locator { return this.anyModal.filter({ has: this.page.locator('.modal-title, .nkgd-modal-tieu-de', { hasText: title }) }); }
  /** Chờ dữ liệu giả đã nạp (getAll + danh mục). */
  async waitData() { await expect.poll(() => (this.server.reads.getAll || 0) > 0 && (this.server.reads.categories || 0) > 0, { timeout: 20000 }).toBe(true); }
  /** Chờ app tải xong setting người dùng (`store.state.is_getting_data_saved` = false, TheContainer.getDataSaveSettings). */
  async waitSettingsLoaded() {
    await expect.poll(() => this.page.evaluate(() => {
      type V = Element & { __vue__?: { $store?: { state: { is_getting_data_saved: boolean } } } };
      const el = Array.from(document.querySelectorAll('.c-app, body *')).find((e) => (e as V).__vue__?.$store) as V | undefined;
      return el ? el.__vue__!.$store!.state.is_getting_data_saved : null;
    }), { timeout: 30000 }).toBe(false);
  }
  /** localStorage của trang. */
  ls(key: string) { return this.page.evaluate((k) => localStorage.getItem(k), key); }

  // ---------------- Phiếu lệnh nhanh (Mua/Bán) — dùng chung tab Tài sản + Giao dịch ----------------
  get ticket(): Locator { return this.page.locator('.order-ticket:visible'); }
  ticketSide(side: 'Mua' | 'Bán'): Locator { return this.ticket.locator('.ot-side-btn', { hasText: side }); }
  ticketField(label: 'Mã đầu tư' | 'Danh mục' | 'Ngày giao dịch' | 'Giá (nghìn đồng)' | 'Khối lượng' | 'Ghi chú (tuỳ chọn)'): Locator {
    return this.ticket.locator(`xpath=.//div[contains(@class,"ot-label")][normalize-space()="${label}"]/following-sibling::*[1]`);
  }
  get ticketStockInput(): Locator { return this.ticketField('Mã đầu tư').locator('input'); }
  get ticketStockText(): Locator { return this.ticket.locator('.ot-stock'); }
  get ticketCategory(): Locator { return this.ticketField('Danh mục').locator('select'); }
  get ticketDate(): Locator { return this.ticketField('Ngày giao dịch').locator('input'); }
  get ticketPrice(): Locator { return this.ticketField('Giá (nghìn đồng)').locator('input'); }
  get ticketVolume(): Locator { return this.ticketField('Khối lượng').locator('input'); }
  get ticketNote(): Locator { return this.ticket.locator('textarea'); }
  get ticketFee(): Locator { return this.ticket.locator('.ot-fee-input'); }
  ticketSummary(label: 'Giá trị' | 'Tổng chi' | 'Tổng thu' | 'Phí'): Locator {
    return this.ticket.locator('.ot-row', { hasText: label }).locator('b');
  }
  get ticketSubmit(): Locator { return this.ticket.locator('.ot-submit'); }
  get ticketCancel(): Locator { return this.ticket.locator('.ot-cancel'); }
  get ticketClose(): Locator { return this.page.locator('.ot-head:visible button'); }
  get ticketAdvanced(): Locator { return this.ticket.getByText('Nhập nâng cao'); }
  /** Đặt ngày giao dịch của phiếu (ô date + sự kiện change như người dùng chọn). */
  async setTicketDate(day: string) {
    await this.ticketDate.fill(day);
    await this.ticketDate.dispatchEvent('change');
  }
  /** Chọn mã trong ô "Mã đầu tư" (DropdownSearch) của phiếu mở từ thanh công cụ. */
  async pickTicketStock(code: string) {
    // Danh sách gợi ý dựng từ danh sách mã của store (tải muộn) → gõ lại nếu gợi ý chưa hiện.
    const item = this.ticket.locator('.search-stockcode_item', { hasText: new RegExp(`^\\s*${code}\\b`) }).first();
    for (let i = 0; i < 4; i++) {
      await this.ticketStockInput.fill('');
      await this.ticketStockInput.pressSequentially(code, { delay: 50 });
      if (await item.isVisible({ timeout: 5000 }).catch(() => false)) break;
    }
    await item.click();
  }



  // ---------------- Modal "Thêm giao dịch" (Nhập nâng cao) ----------------
  get addModal(): Locator { return this.page.locator('.nkgd-add-modal').filter({ has: this.page.locator('.modal-title', { hasText: 'Thêm giao dịch' }) }).locator('.modal-content').first(); }
  addModalField(label: string): Locator {
    return this.addModal.locator(`xpath=.//div[contains(@class,"flex-1")][normalize-space()="${label}"]/following-sibling::*[1]`).first();
  }

  // ---------------- Tab "Giao dịch" ----------------
  get thMua(): Locator { return this.pane.getByRole('button', { name: 'Mua', exact: true }); }
  get thBan(): Locator { return this.pane.getByRole('button', { name: 'Bán', exact: true }); }
  get thFilterBtn(): Locator { return this.pane.getByRole('button', { name: 'Lọc giao dịch' }); }
  get thExportBtn(): Locator { return this.pane.getByRole('button', { name: 'Xuất Excel' }); }
  get thHeader(): Locator { return this.pane.locator('.table-trading-history-header'); }
  thHeaderCell(label: string | RegExp): Locator { return this.thHeader.locator('.bg-header', { hasText: label }).first(); }
  get thCollapseAll(): Locator { return this.thHeader.locator('button').first(); }
  get thRows(): Locator { return this.pane.locator('.item-table-trading-history-wrapper'); }
  get thSummaryRow(): Locator { return this.thRows.filter({ hasText: 'Tổng kết toàn bộ' }); }
  thCategoryRow(name: string): Locator { return this.pane.locator('.th-dong-tong-ket').filter({ has: this.page.locator('.th-ten-danh-muc', { hasText: new RegExp(`^\\s*Danh mục: ${reEsc(name)}\\s*$`) }) }); }
  get thTradeRows(): Locator { return this.pane.locator('.th-dong-giao-dich'); }
  thTradeRow(mack: string): Locator { return this.thTradeRows.filter({ has: this.page.locator('.th-cot-mack a, .th-cot-mack .c-link, .th-cot-mack', { hasText: new RegExp(`^\\s*${mack}\\s*$`) }) }); }
  thRowMenu(row: Locator): Locator { return row.locator('.th-row-menu-btn'); }
  get thMenuItems(): Locator { return this.pane.locator('.dropdown-menu.show .dropdown-item'); }
  get thSettingsBtn(): Locator { return this.pane.locator('.th-col-settings'); }
  get filterModal(): Locator { return this.modal('Lọc giao dịch'); }
  filterField(label: string): Locator {
    return this.filterModal.locator(`xpath=.//div[contains(@class,"flex-1")][normalize-space()="${label}:"]/following-sibling::*[1]`).first();
  }
  get editModal(): Locator { return this.modal('Sửa giao dịch'); }
  editField(label: string): Locator {
    return this.editModal.locator(`xpath=.//span[contains(@class,"nkgd-form-nhan")][normalize-space()="${label}"]/following-sibling::*[1]`);
  }
  get viewModal(): Locator { return this.modal('Chi tiết giao dịch'); }
  get deleteModal(): Locator { return this.modal('Xóa dữ liệu').filter({ hasText: 'Bạn có chắc chắn không?' }); }
  get dividendModal(): Locator { return this.modal('Đã cập nhật sự kiện quyền'); }

  // ---------------- Tab "Tài sản" ----------------
  get tsPickerBtn(): Locator { return this.pane.locator('.category-bar .category-picker-toggle'); }
  get tsPickerMenu(): Locator { return this.pane.locator('.category-bar .category-picker-menu'); }
  tsPickerItem(label: string): Locator { return this.tsPickerMenu.locator('label.category-picker-item', { hasText: new RegExp(`^\\s*${reEsc(label)}\\s*$`) }).locator('input'); }
  get tsNavCard(): Locator { return this.pane.locator('.khung-tong-quan'); }
  get tsNavValue(): Locator { return this.pane.locator('.nav-so'); }
  get tsCountRealized(): Locator { return this.pane.getByRole('checkbox', { name: 'Tính lãi/lỗ đã thực hiện' }); }
  tsStat(label: 'Vốn ban đầu' | 'Giá trị thị trường' | 'Giá trị margin'): Locator {
    return this.pane.locator('.nav-can-doi-dong', { has: this.page.locator('dt', { hasText: label }) }).locator('dd');
  }
  tsSmall(label: 'Lãi/lỗ chưa thực hiện' | 'Lãi/lỗ đã thực hiện' | 'Tiền mặt còn lại'): Locator {
    return this.pane.locator('.o-nho', { has: this.page.locator('.stat-label', { hasText: label }) });
  }
  tsGroup(name: string): Locator { return this.pane.getByRole('group', { name }); }
  tsSeg(group: string, label: string): Locator { return this.tsGroup(group).getByRole('button', { name: label, exact: true }); }
  get tsAnalysisToggle(): Locator { return this.pane.locator('.muc-nut-gap'); }
  get tsAnalysisArea(): Locator { return this.pane.locator('#vung-co-cau-dong-gop'); }
  get tsPortfolioTable(): Locator { return this.pane.getByRole('table').filter({ has: this.page.getByRole('columnheader', { name: 'Tỷ trọng' }) }); }
  tsCategoryRow(name: string): Locator { return this.tsPortfolioTable.locator('tr', { has: this.page.locator('.category-name', { hasText: new RegExp(`^\\s*${reEsc(name)}\\s*$`) }) }); }
  tsStockRow(mack: string): Locator { return this.tsPortfolioTable.locator('tbody tr', { has: this.page.locator('.stock-code', { hasText: new RegExp(`^\\s*${mack}\\b`) }) }); }
  get tsExportBtn(): Locator { return this.pane.getByRole('button', { name: 'Xuất Excel' }); }
  get tsDetailModal(): Locator { return this.page.locator('.modal.show:visible').filter({ has: this.page.locator('.xm, .xm-dau') }); }
  get tsEditCapitalModal(): Locator { return this.modal('Sửa danh mục'); }

  // ---------------- Tab "Phân tích giao dịch" ----------------
  ptFilter(label: 'Xem theo' | 'Thời gian' | 'Từ ngày' | 'Đến ngày' | 'Danh mục'): Locator {
    return this.pane.locator('.pcr-o-loc', { has: this.page.locator('.pcr-nhan', { hasText: new RegExp(`^${reEsc(label)}$`) }) });
  }
  get ptStyleToggle(): Locator { return this.pane.getByText('Phong cách và rủi ro'); }
  get ptStyleArea(): Locator { return this.pane.locator('.pcr-area'); }
  get ptProfitBy(): Locator { return this.pane.locator('select').filter({ has: this.page.locator('option', { hasText: 'Lợi nhuận theo cổ phiếu' }) }); }
  get ptTable(): Locator { return this.pane.locator('table').filter({ has: this.page.locator('th', { hasText: 'Lợi nhuận' }) }); }
  get ptExportBtn(): Locator { return this.pane.getByRole('button', { name: 'Xuất Excel' }); }
  get ptHistoryModal(): Locator { return this.modal('Lịch sử giao dịch'); }

  // ---------------- Tab "Phân bổ vốn" ----------------
  get caPickerBtn(): Locator { return this.pane.locator('.ca-chon-danh-muc .category-picker-toggle'); }
  caPickerItem(label: string): Locator { return this.pane.locator('.ca-chon-danh-muc .category-picker-item', { hasText: new RegExp(`^\\s*${reEsc(label)}\\s*$`) }); }
  caSummary(label: 'Vốn ban đầu' | 'Lãi/lỗ đã thực hiện' | 'Vốn khả dụng'): Locator {
    return this.pane.locator('.ca-tom-tat-o', { has: this.page.locator('.ca-tom-tat-nhan', { hasText: label }) });
  }
  get caCapitalText(): Locator { return this.caSummary('Vốn ban đầu').locator('.ca-o-von:not(.ca-an) .ca-tom-tat-so'); }
  get caPencil(): Locator { return this.pane.locator('.ca-nut-but-chi'); }
  get caCapitalInput(): Locator { return this.pane.locator('.ca-o-nhap-von'); }
  caRow(label: string): Locator { return this.pane.locator('.ca-dong', { has: this.page.locator('.ca-nhan', { hasText: label }) }); }
  caInput(label: '% Cắt lỗ tối đa trên tổng tài sản' | '% Cắt lỗ trên deal tiếp theo'): Locator { return this.caRow(label).locator('input'); }
  caValue(label: string): Locator { return this.caRow(label).locator('.ca-gia-tri-tu-dong').first(); }
  get caStatusTable(): Locator { return this.pane.locator('table.table-pbv'); }
  caStatusRow(label: string): Locator { return this.caStatusTable.locator('tbody tr', { has: this.page.locator('td', { hasText: label }) }); }
  get caChartToggle(): Locator { return this.pane.locator('.ca-nut-gap'); }

  // ---------------- Tab "Danh mục" ----------------
  get dmCount(): Locator { return this.pane.locator('.mc-dem'); }
  get dmDeletedBtn(): Locator { return this.pane.getByRole('button', { name: /^Danh mục đã xóa/ }); }
  get dmAddBtn(): Locator { return this.pane.locator('button.mc-nut-them'); }
  get dmTable(): Locator { return this.pane.locator('table.table-danh-muc-hien-co'); }
  dmRow(name: string): Locator { return this.dmTable.locator('tbody tr', { has: this.page.locator('td.mc-ten', { hasText: new RegExp(`^\\s*${reEsc(name)}\\s*$`) }) }); }
  get dmAddModal(): Locator { return this.modal('Thêm mới danh mục'); }
  get dmEditModal(): Locator { return this.modal('Sửa danh mục'); }
  get dmDeletedModal(): Locator { return this.modal('Danh mục đã xóa'); }
  get dmSoftDeleteModal(): Locator { return this.modal('Xóa dữ liệu').filter({ hasText: 'Di chuyển vào thùng rác' }); }
  get dmForceDeleteModal(): Locator { return this.modal('Xóa dữ liệu').filter({ hasText: 'xóa vĩnh viễn' }); }
}
