import { Page, Locator, Route } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Màn "Danh sách mã có BCTC mới" (`/bctc-new-list`, menu Phân tích cơ bản › Cập nhật BCTC mới — ẩn với Free; cũng mở
 * từ menu tài khoản và nút "BCTC Mới" ở Phân tích cơ bản) — `stocks/src/views/BctcNewList.vue`.
 *
 * - API (GET, api2.kfsp.vn): `/api/stocks/filter-bctc-new?type=bs&thoigian=quarter|year&year&quarter&myWatchListId` →
 *   `{success, data: {bctc_news: [...], statistical}}`. Gọi lại khi đổi Kỳ BCTC hoặc Watchlist; lọc Mã CK / Sàn / Ngành
 *   làm ở trình duyệt.
 * - Kỳ mặc định = quý trước (Q1 → Q4 năm trước); "Thời gian" hiện `Q<n> <năm>` hoặc `<năm − 1>` khi chọn Năm.
 * - Bảng CDataTable 20 dòng/trang, có sắp xếp theo cột; bấm mã → modal biểu đồ dùng chung toàn site.
 */
export const BCTC_API = /\/api\/stocks\/filter-bctc-new(\?|$)/;

export type BctcItem = Record<string, string | number | null>;

export function bctcItem(mack: string, san: string, nganh: string, v: Partial<BctcItem> = {}): BctcItem {
  return {
    mack, ten: `Công ty ${mack}`, san, nganh,
    doanh_thu_thuan_quarter: 1234.567, tang_truong_doanh_thu_thuan_quarter: 12.345,
    loi_nhuan_sau_thue_quarter: 100, tang_truong_loi_nhuan_sau_thue_quarter: -5.5,
    eps_quarter: 1500, eps_ttm: 6000.4, pe_day: 10.25,
    doanh_thu_thuan_year: 5000, tang_truong_doanh_thu_thuan_year: 0,
    loi_nhuan_sau_thue_year: 400, tang_truong_loi_nhuan_sau_thue_year: 3, eps_year: 5800,
    ...v,
  };
}

export class BctcMoiPage extends BasePage {
  readonly title: Locator;
  readonly periodSelect: Locator;
  readonly mackInput: Locator;
  readonly suggestions: Locator;
  readonly exchangeSelect: Locator;
  readonly industrySelect: Locator;
  readonly watchlistSelect: Locator;
  readonly timeLabel: Locator;
  readonly countLabel: Locator;
  readonly table: Locator;
  readonly headerCells: Locator;
  readonly dataRows: Locator;
  readonly pagination: Locator;
  readonly tradingChartModal: Locator;
  /** Query (bỏ token) của mọi lần gọi API danh sách. */
  readonly calls: Record<string, string>[] = [];

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Danh sách các mã có BCTC mới' });
    const filter = (label: string) => page.locator('main div.d-flex', { has: page.locator('p.label-text', { hasText: new RegExp(`^${label}$`) }) }).last();
    this.periodSelect = filter('Kỳ BCTC').locator('select');
    this.mackInput = filter('Mã CK').getByPlaceholder('Nhập mã chứng khoán');
    this.suggestions = filter('Mã CK').locator('.search-stockcode_item');
    this.exchangeSelect = filter('Sàn').locator('select');
    this.industrySelect = filter('Ngành').locator('select');
    this.watchlistSelect = filter('Watchlist').locator('select');
    this.timeLabel = page.locator('main p.label-text-custom', { hasText: 'Thời gian:' });
    this.countLabel = page.locator('main p.label-text-custom', { hasText: 'SL CP có báo cáo:' });
    this.table = page.locator('main .border-table-td table');
    this.headerCells = this.table.locator('thead tr').first().locator('th');
    this.dataRows = this.table.locator('tbody tr', { has: page.locator('td.mack') });
    this.pagination = page.locator('main nav[aria-label="pagination"]');
    this.tradingChartModal = page.locator('.modal.show.d-block').filter({ has: page.locator('.modal-xxxl') });

    page.on('request', (r) => {
      if (!BCTC_API.test(r.url())) return;
      const q: Record<string, string> = {};
      new URL(r.url()).searchParams.forEach((v, k) => { if (k !== 'token') q[k] = v; });
      this.calls.push(q);
    });
  }

  async open(account: Prev2Account = 'paid', path = '/bctc-new-list') {
    await new Prev2Session(this.page).open({ account, path });
  }

  /** Mở trang, chờ API danh sách trả về và bảng hết trạng thái tải. */
  async openReady(account: Prev2Account = 'paid') {
    const res = this.page.waitForResponse(BCTC_API, { timeout: 30_000 });
    await this.open(account);
    await res;
    await this.title.waitFor();
    await this.page.locator('main .border-table-td .spinner-border').waitFor({ state: 'detached' }).catch(() => {});
  }

  /** Giả lập API danh sách: mảng dòng hoặc mã lỗi HTTP. */
  async mockList(body: BctcItem[] | number | ((q: URLSearchParams) => BctcItem[])) {
    await this.page.route(BCTC_API, (route: Route) => {
      if (typeof body === 'number') return route.fulfill({ status: body, json: { message: 'Lỗi giả lập' } });
      const items = typeof body === 'function' ? body(new URL(route.request().url()).searchParams) : body;
      return route.fulfill({ json: { success: true, data: { bctc_news: items, statistical: null } } });
    });
  }

  lastCall() { return this.calls[this.calls.length - 1]; }

  async headers(): Promise<string[]> {
    return (await this.headerCells.allInnerTexts()).map((s) => s.replace(/\s+/g, ' ').trim());
  }

  async column(col: number): Promise<string[]> {
    return (await this.dataRows.locator(`td:nth-child(${col + 1})`).allInnerTexts()).map((s) => s.trim());
  }

  async cells(i: number): Promise<string[]> {
    return (await this.dataRows.nth(i).locator('td').allInnerTexts()).map((s) => s.trim());
  }

  headerCell(name: string): Locator {
    return this.headerCells.filter({ hasText: name });
  }
}
