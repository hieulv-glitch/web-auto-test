import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * PTCB — tab "BCTC gốc" (`/phan-tich-co-ban?mack=<mã>&tab=tin-tuc`, trước 11/2026 là "Bài viết & Phân tích").
 * Source preprod: `src/views/faAnalysis/NewsAndAnalysis/index.vue` (bộ lọc ngày + đo chiều cao bảng) và
 * `NewsAndAnalysis/ReportRaw.vue` (bảng BCTC gốc, `GET /api/stocks/document/get-document?type=1&year=*`).
 * Bài viết / Báo cáo phân tích / tài liệu type 3-4-5 đã chuyển sang `/thong-tin-su-kien` (testcases/thong-tin-su-kien.md).
 * Tab chỉ đọc — không có API ghi.
 */
export type BctcDoc = { id?: string; mack: string; fullname: string; link: string; year: string; type?: string };

/** 20 BCTC giả (thứ tự trộn) — 2 trang (15/trang). */
export function fakeDocs(mack = 'VNM'): BctcDoc[] {
  const docs: BctcDoc[] = [];
  let id = 1;
  for (const year of ['2022', '2026', '2024', '2025', '2023']) {
    for (const q of ['quý 2', 'quý 4', 'quý 1', 'quý 3']) {
      docs.push({ id: String(id++), mack, fullname: `Báo cáo tài chính Hợp nhất ${q} năm ${year} `, link: `https://files.example.invalid/${mack}_${year}_${q.replace(' ', '')}.pdf`, year, type: '1' });
    }
  }
  return docs;
}

export class BctcGocPage extends BasePage {
  readonly session: Prev2Session;
  readonly pageErrors: string[] = [];
  readonly consoleErrors: string[] = [];
  /** Tham số các lần gọi `get-document`. */
  readonly documentRequests: URLSearchParams[] = [];
  readonly mainTabs: Locator;
  readonly fromDate: Locator;
  readonly toDate: Locator;
  readonly searchButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly headers: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') this.consoleErrors.push(m.text()); });
    page.on('request', (r) => { if (/\/document\/get-document/.test(r.url())) this.documentRequests.push(new URL(r.url()).searchParams); });
    this.mainTabs = page.locator('.faAnalysis-page ul.nav.nav-tabs').first().locator('.nav-link').filter({ hasText: /\S/ });
    const filter = page.locator('.card-body', { has: page.getByRole('button', { name: 'Tìm kiếm' }) }).last();
    this.fromDate = filter.locator('input[type="date"]').nth(0);
    this.toDate = filter.locator('input[type="date"]').nth(1);
    this.searchButton = filter.getByRole('button', { name: 'Tìm kiếm' });
    this.table = page.locator('.report-raw');
    // Bảng rỗng vẫn có 1 dòng placeholder (1 ô gộp chứa <p> trống) → chỉ đếm dòng có đủ cột.
    this.rows = this.table.locator('tbody tr').filter({ has: page.locator('td:nth-child(3)') });
    this.headers = this.table.locator('thead th');
    this.pagination = this.table.locator('nav[aria-label="pagination"]');
  }

  /** Giả lập `get-document` (null = dùng dữ liệu thật; 'error' = 500; 'abort' = mất mạng). */
  async mockDocuments(docs: BctcDoc[] | 'error' | 'abort' | null, delayMs = 0) {
    if (docs === null) return;
    await this.page.route(/\/api\/stocks\/document\/get-document/, async (route) => {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      if (docs === 'abort') return route.abort();
      if (docs === 'error') return route.fulfill({ status: 500, body: 'error' });
      const mack = new URL(route.request().url()).searchParams.get('mack') || 'VNM';
      return route.fulfill({ json: docs.map((d) => ({ ...d, mack })) });
    });
  }

  async open(opts: { account?: Prev2Account; mack?: string; docs?: BctcDoc[] | 'error' | 'abort' | null; delayMs?: number } = {}) {
    const { account = 'paid', mack = 'VNM', docs = fakeDocs(), delayMs = 0 } = opts;
    await this.mockDocuments(docs, delayMs);
    await this.session.open({ account, path: `/phan-tich-co-ban?mack=${mack}&tab=tin-tuc` });
    await expect(this.mainTab('BCTC gốc')).toBeVisible({ timeout: 30000 });
  }

  mainTab(name: string): Locator {
    return this.mainTabs.filter({ hasText: name });
  }

  async names(): Promise<string[]> {
    return (await this.rows.locator('td:nth-child(2)').allInnerTexts()).map((t) => t.trim());
  }

  async search(from: string, to: string) {
    await this.fromDate.fill(from);
    await this.toDate.fill(to);
    await this.searchButton.click();
  }

  /** Thay `window.open` để bắt URL file (bấm icon File mở PDF ở tab mới). */
  async stubWindowOpen() {
    await this.page.evaluate(() => {
      (window as unknown as { __opened: string[] }).__opened = [];
      window.open = ((url?: string | URL) => { (window as unknown as { __opened: string[] }).__opened.push(String(url)); return { focus() { /* */ } } as Window; }) as typeof window.open;
    });
  }

  async openedUrls(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { __opened?: string[] }).__opened || []);
  }
}
