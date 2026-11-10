import { Page, Locator, Route } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Màn "Bảng giá crypto" (`/crypto`, menu Thị Trường › Bảng giá crypto) — `stocks/src/views/pages/Crypto.vue`.
 *
 * Cấu trúc (source preprod + DOM thật 10/11/2026):
 * - 3 thẻ đầu trang `.header-item`: "🚀 Top vốn hóa" (3 coin vốn hoá lớn nhất), "🔥 Vốn hóa thị trường" (tổng vốn hoá +
 *   thay đổi + tỷ trọng Bitcoin/Ethereum/Khác), "🙂 Chỉ số tâm lý" (đồng hồ + nhãn Sợ hãi tột độ…Tham lam tột độ).
 *   Bấm thẻ 1 → bảng coin, thẻ 2 → 4 biểu đồ Total 1/2/3/Dominance (ẩn bảng), thẻ 3 → không đổi gì.
 * - Bảng `#crypto_table` (CDataTable, 20 dòng/trang, sắp xếp theo cột ở trang hiện tại) + `CPagination`.
 * - API danh sách (GET, api2.kfsp.vn): `/api/crypto/get-list-coin-paging?page&pagesize=20`, `/api/crypto/get-total_coin`.
 *   Giá/biến động/biểu đồ 7 ngày lấy qua socket `ta.kfsp.vn` (emit `getlive`, `getlistchart7dcrypto`,
 *   `getmarketcapproportion`, `getcoinfeargreed`, `getcharttotalcap`) — chỉ đọc. Không có khoá Free trên màn này.
 */
export const LIST_API = /\/api\/crypto\/get-list-coin-paging(\?|$)/;
export const TOTAL_API = /\/api\/crypto\/get-total_coin(\?|$)/;

export class BangGiaCryptoPage extends BasePage {
  readonly cards: Locator;
  readonly topCapCard: Locator;
  readonly marketCapCard: Locator;
  readonly sentimentCard: Locator;
  readonly table: Locator;
  readonly headerCells: Locator;
  readonly rows: Locator;
  readonly pagination: Locator;
  readonly chartTitles: Locator;
  readonly tradingChartModal: Locator;
  /** Số trang `page` của mọi lần gọi API danh sách. */
  readonly listPages: string[] = [];

  constructor(page: Page) {
    super(page);
    this.cards = page.locator('.crypto-header-wrapper .header-item');
    this.topCapCard = this.cards.filter({ hasText: 'Top vốn hóa' });
    this.marketCapCard = this.cards.filter({ hasText: 'Vốn hóa thị trường' });
    this.sentimentCard = this.cards.filter({ hasText: 'Chỉ số tâm lý' });
    this.table = page.locator('#crypto_table');
    this.headerCells = this.table.locator('thead th');
    this.rows = this.table.locator('tbody tr');
    this.pagination = page.locator('main nav[aria-label="pagination"]');
    this.chartTitles = page.locator('.tooltip-custom-crypto p');
    // Modal biểu đồ dùng chung toàn site (TheContainer.vue, size xxxl) — tiêu đề là mã đang xem.
    this.tradingChartModal = page.locator('.modal.show.d-block').filter({ has: page.locator('.modal-xxxl') });

    page.on('request', (r) => {
      if (LIST_API.test(r.url())) this.listPages.push(new URL(r.url()).searchParams.get('page') ?? '');
    });
  }

  async open(account: Prev2Account = 'paid', path = '/crypto') {
    await new Prev2Session(this.page).open({ account, path });
  }

  /** Mở trang và chờ bảng có dòng dữ liệu (giá về qua socket). */
  async openReady() {
    await this.open();
    await this.rows.filter({ has: this.page.locator('td', { hasText: /\$\d/ }) }).first().waitFor({ timeout: 30_000 });
  }

  /** Text các ô của dòng `i`. */
  async cells(i: number): Promise<string[]> {
    return (await this.rows.nth(i).locator('td').allInnerTexts()).map((s) => s.replace(/\s+/g, ' ').trim());
  }

  /** Cột `col` (0-based) của mọi dòng đang hiển thị. */
  async column(col: number): Promise<string[]> {
    return (await this.rows.locator(`td:nth-child(${col + 1})`).allInnerTexts()).map((s) => s.replace(/\s+/g, ' ').trim());
  }

  headerCell(name: string): Locator {
    return this.headerCells.filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });
  }

  async mockStatus(api: RegExp, status: number) {
    await this.page.route(api, (route: Route) => route.fulfill({ status, json: { message: 'Lỗi giả lập' } }));
  }
}

/** "$1,234.5" / "-0.54%" → số. */
export function num(s: string): number {
  return parseFloat(s.replace(/[$,%\s]/g, ''));
}
