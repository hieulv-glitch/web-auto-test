import { Page, Locator, expect, BrowserContext, Route, test as baseTest } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Màn "Cơ hội tiềm năng" (`/co-hoi-tiem-nang`, menu "Cơ hội") — component `IBD` với `type: "opportunity"`
 * (stocks/src/views/ibd/wrapperLayout.vue) → `OpportunitySegment.vue` + `OpportunityTable.vue` +
 * `OpportunityAiDetail.vue` / `OpportunityPatternDetail.vue` + `rules.js` (src/views/filterCanslim/opportunity/).
 *
 * Nguồn dữ liệu (host `api2.kfsp.vn`, đọc source 10/11/2026):
 * - `GET  /api/stocks/bot-opportunity-ranking?token&sortBy=recent` → nhóm "AI Mua/Bán" (mã bot đang nắm & đang lãi).
 * - `POST /api/stock-signals/patterns/search` (CHỈ ĐỌC — tìm mẫu hình, body `{status, patterns, endDateFrom,
 *   endDateTo, entryGate}`) → các nhóm mẫu hình đáy ("Hai đáy", "Vai đầu vai ngược"); nhóm rỗng bị ẩn khỏi dải tab.
 * - VN-INDEX ở chân bảng: socket `getliveindex` mỗi 30s. Sàn + ngành (tab mẫu hình) tra `store.list_mack_company`.
 * Màn KHÔNG có API ghi; lần ghi duy nhất là nhật ký sử dụng `/api/activitylog/create` (lưới trả giả thành công).
 *
 * `FakeOppApi` thay 2 API trên bằng dữ liệu cố định để assert chính xác (thứ tự, định dạng, lọc, lỗi). Test nào cần
 * dữ liệu thật thì mở với `mock: false`.
 *
 * ⚠️ AN TOÀN DỮ LIỆU: localhost:8080 gọi backend PRODUCTION. `OppSafetyNet` (mức context) HUỶ mọi request không phải
 * GET/HEAD/OPTIONS tới *.kfsp.vn / *.vietpointer.vn / *.kungfustockspro.live và ghi vào `blocked` (assert rỗng ở
 * `afterEach`), trừ danh sách trắng `READ_ONLY` (mỗi mục ghi lý do).
 */
export class OppSafetyNet {
  static readonly HOST = /(^|\.)(kfsp\.vn|vietpointer\.vn|kungfustockspro\.live)$/;
  static readonly READ_ONLY: { pattern: RegExp; reason: string }[] = [
    { pattern: /\/api\/login(\?|$)/, reason: 'tạo phiên đăng nhập (LoginPage khi chưa có phiên cache)' },
    { pattern: /socket\.io/, reason: 'kênh giá realtime (long-polling POST)' },
    { pattern: /\/api\/stock-signals\/patterns\/search(\?|$)/, reason: 'tìm mẫu hình — POST nhưng chỉ đọc (OpportunitySegment.fetchPatterns)' },
  ];
  readonly blocked: string[] = [];

  async install(context: BrowserContext) {
    await context.route((u) => OppSafetyNet.HOST.test(u.hostname), (route) => this.handle(route));
  }

  private async handle(route: Route) {
    const r = route.request();
    const m = r.method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.fallback();
    if (OppSafetyNet.READ_ONLY.some((x) => x.pattern.test(r.url()))) return route.fallback();
    if (/\/api\/activitylog\//.test(r.url())) return route.fulfill({ json: { success: true } });
    this.blocked.push(`${m} ${r.url().split('?')[0]}`);
    return route.abort();
  }
}

export function useOppSafetyNet(t: typeof baseTest): () => OppSafetyNet {
  let net = new OppSafetyNet();
  t.beforeEach(async ({ context }) => {
    net = new OppSafetyNet();
    await net.install(context);
  });
  t.afterEach(async () => {
    expect(net.blocked, 'Có request ghi tới production chưa được giả lập (đã bị huỷ)').toEqual([]);
  });
  return () => net;
}

// ================= Dữ liệu giả =================
export type Lot = [date: string, price: number, pnl: number | null];
export function ranked(mack: string, nganh: string, pct: number, giaVon: number, ngayMo: string, lots: Lot[]) {
  return {
    mack, nganh, hieu_suat_percent: pct, so_vi_the: lots.length, gia_von: giaVon, ngay_mo: ngayMo,
    lots: lots.map(([date, price, pnl], i) => ({ index: i + 1, date, price, pnl })),
  };
}
export type HitOpts = {
  status?: 'forming' | 'potential_break' | 'confirmed'; neckline: number; cancel: number; target: number; current: number;
  h: number; patternDay: string; points?: { date: string; label: string; price: number }[];
};
export function hit(stock: string, pattern: string, o: HitOpts) {
  return { stock, pattern, timeframe: 'D', bullish: true, status: o.status ?? 'forming', ...o, points: o.points ?? [] };
}

export type ApiMode = 'ok' | '500' | 'slow';

export class FakeOppApi {
  ranking: unknown[] = [];
  patterns: unknown[] = [];
  rankingMode: ApiMode = 'ok';
  patternsMode: ApiMode = 'ok';
  slowMs = 4000;
  readonly rankingCalls: string[] = [];
  readonly patternBodies: Record<string, unknown>[] = [];

  async install(page: Page) {
    await page.route(/\/api\/stocks\/bot-opportunity-ranking(\?|$)/, async (route) => {
      this.rankingCalls.push(route.request().url());
      await this.reply(route, this.rankingMode, this.ranking);
    });
    await page.route(/\/api\/stock-signals\/patterns\/search(\?|$)/, async (route) => {
      try { this.patternBodies.push(route.request().postDataJSON()); } catch { /* */ }
      await this.reply(route, this.patternsMode, this.patterns);
    });
  }

  private async reply(route: Route, mode: ApiMode, data: unknown[]) {
    if (mode === '500') return route.fulfill({ status: 500, json: { message: 'Internal Server Error' } });
    if (mode === 'slow') await new Promise((r) => setTimeout(r, this.slowMs));
    return route.fulfill({ json: data });
  }
}

/** `startPath`: mở trang khác trước (vd `/dashboard` để đi vào bằng menu) — khi đó không chờ màn Cơ hội. */
export type ChtnOpenOptions = { account?: Prev2Account; query?: string; mock?: boolean; wait?: boolean; startPath?: string };

export class CoHoiTiemNangPage extends BasePage {
  readonly api = new FakeOppApi();
  session!: Prev2Session;

  constructor(page: Page) { super(page); }

  async open(opts: ChtnOpenOptions = {}) {
    const { account = 'paid', query = '', mock = true, wait = true, startPath } = opts;
    if (mock) await this.api.install(this.page);
    this.session = new Prev2Session(this.page);
    await this.session.open({ account, path: startPath ?? `/co-hoi-tiem-nang${query}` });
    if (wait && !startPath) await this.waitReady();
  }

  /** Chờ thanh công cụ hiện (hết skeleton "AI đang tìm cơ hội"). */
  async waitReady() {
    await expect(this.head).toBeVisible({ timeout: 45000 });
  }

  get root(): Locator { return this.page.locator('.opp-segment'); }
  get loading(): Locator { return this.page.locator('.opp-loading'); }
  get head(): Locator { return this.page.locator('.opp-head'); }
  get groupTabs(): Locator { return this.page.getByRole('group', { name: 'Nhóm cơ hội' }).getByRole('button'); }
  tab(name: string): Locator { return this.page.getByRole('group', { name: 'Nhóm cơ hội' }).getByRole('button', { name }); }
  get search(): Locator { return this.page.getByPlaceholder('Tìm mã cổ phiếu…'); }
  get clearSearch(): Locator { return this.page.getByRole('button', { name: 'Xoá tìm kiếm' }); }
  get exchangeGroup(): Locator { return this.page.getByRole('group', { name: 'Sàn' }); }
  exchange(name: string): Locator { return this.exchangeGroup.getByRole('button', { name, exact: true }); }
  get industry(): Locator { return this.page.getByRole('combobox', { name: 'Ngành' }); }
  get statusGroup(): Locator { return this.page.getByRole('group', { name: 'Trạng thái mẫu hình' }); }
  status(name: string): Locator { return this.statusGroup.getByRole('button', { name, exact: true }); }
  get notifyLink(): Locator { return this.page.getByRole('link', { name: 'Quản lý thông báo' }); }
  get hint(): Locator { return this.page.locator('.opp-hint'); }

  get table(): Locator { return this.page.locator('.opp-table'); }
  get headers(): Locator { return this.table.locator('thead th'); }
  sortBtn(label: string): Locator { return this.table.locator('thead').getByRole('button', { name: label, exact: true }); }
  get rows(): Locator { return this.table.locator('tbody tr.opp-row'); }
  get codes(): Locator { return this.rows.locator('.opp-code-text'); }
  get ranks(): Locator { return this.rows.locator('td.c-rank'); }
  rowOf(mack: string): Locator { return this.rows.filter({ has: this.page.locator('.opp-code-text', { hasText: new RegExp(`^${mack}$`) }) }); }
  cells(row: Locator): Locator { return row.locator('td'); }

  get footer(): Locator { return this.page.locator('.opp-note'); }
  get msg(): Locator { return this.page.locator('.opp-frame .opp-msg'); }
  get retry(): Locator { return this.msg.getByRole('button', { name: 'Thử lại' }); }
  get clearFilters(): Locator { return this.msg.getByRole('button', { name: 'Bỏ lọc' }); }

  get detail(): Locator { return this.page.locator('aside.opp-detail'); }
  get detailMack(): Locator { return this.detail.locator('.opp-detail__mack'); }
  get detailPnl(): Locator { return this.detail.locator('.opp-detail__pnl'); }
  get detailMeta(): Locator { return this.detail.locator('.opp-detail__meta'); }
  get detailChartBtn(): Locator { return this.detail.getByRole('button', { name: 'Xem biểu đồ' }); }
  get detailChartSec(): Locator { return this.detail.locator('.opp-detail__sec--chart'); }
  get detailLotRows(): Locator { return this.detail.locator('table.opp-lots tbody tr'); }
  detailSection(title: string): Locator { return this.detail.locator('.opp-detail__sec').filter({ has: this.page.locator('h4', { hasText: title }) }); }

  get packageModal(): Locator { return this.page.locator('.modal.show, .modal.d-block').filter({ hasText: 'Chọn dịch vụ' }); }

  /** Popup "Chọn dịch vụ" có thể tự bật khi vào bằng tài khoản Free — đóng để khỏi che màn. */
  async dismissPackageModalIfShown() {
    const modal = this.packageModal.first();
    await this.page.waitForTimeout(1500);
    if (await modal.isVisible().catch(() => false)) {
      await modal.locator('button.close').first().click();
      await expect(modal).toBeHidden();
    }
  }
}
