import { Page, Locator, Route, Request, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2OpenOptions } from './Prev2Session';

/**
 * Màn "Thông tin và sự kiện" (`/thong-tin-su-kien`, menu Thị Trường) — tính năng mới trên `preprod` của `stocks`:
 * `src/views/faAnalysis/ThongTinSuKien.vue` (trang), `ModalBaoCaoPhanTich.vue` (cửa sổ một báo cáo phân tích),
 * `TooltipBaoCao.vue` (ô nổi khi rê chuột vào dòng), `PhanTrang.vue` (thanh phân trang), `SearchStockCode.vue` (ô mã).
 * Môi trường: prev2 (bản build preprod mới nhất, backend PRODUCTION — xem `Prev2Session`).
 *
 * Màn này CHỈ ĐỌC dữ liệu (không có API ghi). Lần ghi duy nhất là setting `final_mack` khi chọn mã ở ô tìm kiếm —
 * `Prev2Session` chặn `/updateusersettings` nên không đổi mã mặc định của tài khoản thật.
 *
 * API (host `api2.kfsp.vn`):
 * - Báo cáo phân tích: `GET /api/report-analysis?mack&from_date&to_date&page&item_per_page` (máy chủ lọc ngày + phân
 *   trang, trả `{data,total}`), chi tiết `GET /api/report-analysis/<id>` (thêm `link`, `summary`).
 * - Tài liệu doanh nghiệp: `GET /api/stocks/document/get-document?mack&year=*&type=3|4|5` (lọc ngày + phân trang ở
 *   trình duyệt).
 * - Bài viết: `GET /api/stocks/news/get-list-news`, `get-count-page-news`, `get-content-news`.
 *
 * `FakeTtskApi` thay cả 3 nhóm bằng dữ liệu cố định để assert chính xác (số lượng, phân trang, lọc ngày, lỗi).
 * Spec nào cần dữ liệu thật thì không cài (`install`) máy chủ giả.
 */

export type Report = {
  id: number; title: string; recommendation: string | null; target_price: string | null; date: string; source: string;
  upside_percent?: string | null; link?: string | null; summary?: string | null;
};
export type Doc = { id: string; mack: string; fullname: string; link: string | null; year: string; type: string };
export type News = { id: number; mack: string; title: string; date: string };
export type FailMode = 'ok' | '500' | 'abort' | 'slow';

export function report(id: number, date: string, opts: Partial<Report> = {}): Report {
  return {
    id, title: `Báo cáo ${id}`, recommendation: null, target_price: null, date, source: 'SSI',
    link: `https://kfsp.vn/kungfu_files/BCPhanTich/TEST/${id}.pdf`, summary: null, ...opts,
  };
}
export function doc(type: '3' | '4' | '5', fullname: string, year: string, link: string | null = `https://kfsp.vn/doc/${encodeURIComponent(fullname)}.pdf`): Doc {
  return { id: String(Math.floor(Math.random() * 1e9)), mack: 'TST', fullname, link, year, type };
}
export function news(id: number, date: string, title = `Bài viết ${id}`): News {
  return { id, mack: 'TST', title, date };
}

/** Request đã nhận, kèm query đã tách (bỏ token). */
export type Seen = { path: string; q: Record<string, string> };

export class FakeTtskApi {
  reports: Report[] = [];
  /** Chi tiết theo id (mặc định lấy từ `reports`). */
  details = new Map<number, Partial<Report>>();
  docs: Record<string, Doc[]> = { 3: [], 4: [], 5: [] };
  news: News[] = [];
  /** null = đếm đúng số bài; số khác = máy chủ đếm sai (vd đếm thừa như ghi chú trong code). */
  newsCount: number | null = null;
  newsContent = '<p>Nội dung bài viết giả lập</p>';

  listMode: FailMode = 'ok';
  detailMode: FailMode = 'ok';
  docMode: FailMode = 'ok';
  newsMode: FailMode = 'ok';
  contentMode: FailMode = 'ok';
  /** Độ trễ (ms) cho chế độ 'slow'. */
  slowMs = 4000;
  /** Độ trễ theo mã (mô phỏng phản hồi của mã cũ về muộn). */
  delayByCode: Record<string, number> = {};

  readonly seen: Seen[] = [];
  /** Mã của lần gọi danh sách gần nhất — API chi tiết không có mã trong query, dùng mã này để thay "TST" như máy chủ thật. */
  private lastCode = '';

  count(re: RegExp) { return this.seen.filter((s) => re.test(s.path)).length; }
  calls(re: RegExp) { return this.seen.filter((s) => re.test(s.path)); }

  async install(page: Page) {
    const handle = async (route: Route, req: Request, mode: FailMode, body: () => unknown, isJson = true) => {
      const u = new URL(req.url());
      const q: Record<string, string> = {};
      u.searchParams.forEach((v, k) => { if (k !== 'token') q[k] = v; });
      this.seen.push({ path: u.pathname, q });
      const delay = this.delayByCode[q.mack] ?? (mode === 'slow' ? this.slowMs : 0);
      if (delay) await new Promise((r) => setTimeout(r, delay));
      if (mode === 'abort') return route.abort().catch(() => {});
      if (mode === '500') return route.fulfill({ status: 500, json: { message: 'Lỗi giả lập' } }).catch(() => {});
      const data = body();
      return (isJson ? route.fulfill({ json: data }) : route.fulfill({ contentType: 'text/html', body: String(data) })).catch(() => {});
    };
    await page.route(/\/api\/report-analysis(\?|$)/, (route, req) => handle(route, req, this.listMode, () => {
      const q = new URL(req.url()).searchParams;
      const from = q.get('from_date') || '', to = q.get('to_date') || '';
      const page = Number(q.get('page') || 1), per = Number(q.get('item_per_page') || 20);
      const rows = this.reports
        .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
        .sort((a, b) => b.date.localeCompare(a.date));
      const code = q.get("mack") || "";
      this.lastCode = code;
      const data = rows.slice((page - 1) * per, page * per)
        .map(({ id, title, recommendation, target_price, date, source }) => ({ id, title: title.replace("TST", code), recommendation, target_price, date, source }));
      return { data, total: rows.length, page, item_per_page: per };
    }));
    await page.route(/\/api\/report-analysis\/\d+/, (route, req) => handle(route, req, this.detailMode, () => {
      const id = Number(new URL(req.url()).pathname.split('/').pop());
      const base = this.reports.find((r) => r.id === id) || report(id, '2026-01-01');
      return { ...base, title: base.title.replace('TST', this.lastCode), stockcode: this.lastCode, ...(this.details.get(id) || {}) };
    }));
    await page.route(/\/api\/stocks\/document\/get-document/, (route, req) => handle(route, req, this.docMode, () => {
      const q = new URL(req.url()).searchParams;
      const code = q.get('mack') || '';
      return (this.docs[q.get('type') || '3'] || []).map((d) => ({ ...d, mack: code, fullname: d.fullname.replace('TST', code) }));
    }));
    await page.route(/\/api\/stocks\/news\/get-count-page-news/, (route, req) => handle(route, req, this.newsMode, () => this.newsCount ?? this.news.length));
    await page.route(/\/api\/stocks\/news\/get-list-news/, (route, req) => handle(route, req, this.newsMode, () => {
      const q = new URL(req.url()).searchParams;
      const page = Number(q.get('page') || 1), per = Number(q.get('item_per_page') || 20);
      const code = q.get('mack') || '';
      return this.news.slice((page - 1) * per, page * per).map((n) => ({ ...n, mack: code, title: n.title.replace('TST', code) }));
    }));
    await page.route(/\/api\/stocks\/news\/get-content-news/, (route, req) => handle(route, req, this.contentMode, () => this.newsContent, false));
  }
}

export type TtskOpenOptions = Omit<Prev2OpenOptions, 'path'> & {
  /** Mã đưa vào `?mack=` (mặc định FPT); null = không có query (trang dùng mã đang xem / mã đã lưu). */
  mack?: string | null;
  /** Mở trang khác trước (vd `/dashboard` để đi vào bằng menu) — khi đó không chờ trang Thông tin và sự kiện. */
  startPath?: string;
  /** Query thêm, vd `nhom=bao-cao-phan-tich`. */
  extraQuery?: string;
  /** Cài máy chủ giả (mặc định true). */
  fake?: boolean;
  /** `window.open` bị trình duyệt chặn (trả null). */
  popupBlocked?: boolean;
};

export class ThongTinSuKienPage extends BasePage {
  readonly api = new FakeTtskApi();
  readonly session: Prev2Session;
  readonly pageErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
  }

  async open(opts: TtskOpenOptions = {}) {
    const { mack = 'FPT', extraQuery, fake = true, popupBlocked = false, startPath, ...rest } = opts;
    if (fake) await this.api.install(this.page);
    // window.open: ghi lại URL thay vì mở tab thật (link PDF → Chromium tải file).
    await this.page.addInitScript((blocked) => {
      const w = window as unknown as { __opened: string[] };
      w.__opened = [];
      window.open = ((url?: string | URL) => {
        w.__opened.push(String(url));
        return blocked ? null : ({ focus() { /* */ } } as unknown as Window);
      }) as typeof window.open;
    }, popupBlocked);
    const q = [mack ? `mack=${mack}` : '', extraQuery || ''].filter(Boolean).join('&');
    await this.session.open({ ...rest, path: startPath ?? `/thong-tin-su-kien${q ? '?' + q : ''}` });
    if (!startPath) await expect(this.root).toBeVisible({ timeout: 30000 });
  }

  /** URL đã truyền vào `window.open`. */
  opened(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { __opened: string[] }).__opened || []);
  }

  // ===== Đầu trang =====
  get root(): Locator { return this.page.locator('.tt'); }
  get searchInput(): Locator { return this.root.getByPlaceholder('Mã CK'); }
  get suggestions(): Locator { return this.root.locator('.search-stockcode.show .search-stockcode_item'); }
  get codeTitle(): Locator { return this.root.locator('.tt-ma-dong b'); }
  get companyName(): Locator { return this.root.locator('.tt-ma-ten'); }
  get fromDate(): Locator { return this.root.getByLabel('Từ ngày'); }
  get toDate(): Locator { return this.root.getByLabel('Đến ngày'); }
  get clearDates(): Locator { return this.root.getByRole('button', { name: 'Xoá khoảng ngày' }); }
  get chipGroup(): Locator { return this.root.getByRole('group', { name: 'Lọc nhanh theo khoảng thời gian' }); }
  chip(label: string | RegExp): Locator { return this.chipGroup.getByRole('button', { name: label }); }
  get emptyState(): Locator { return this.root.locator('.tt-trong'); }

  // ===== Tab =====
  get tabs(): Locator { return this.root.getByRole('tab'); }
  tab(label: string): Locator { return this.root.getByRole('tab').filter({ hasText: label }); }
  tabCount(label: string): Locator { return this.tab(label).locator('.tt-dem'); }

  // ===== Bảng đang hiện =====
  get table(): Locator { return this.root.locator('.tt-bang-cuon:visible table'); }
  get headers(): Locator { return this.table.locator('thead th'); }
  get rows(): Locator { return this.table.locator('tbody tr.tt-hang-bam'); }
  get skeletonRows(): Locator { return this.table.locator('tbody tr.tt-hang-xuong'); }
  get emptyRow(): Locator { return this.table.locator('tbody td.tt-o-trong'); }
  row(text: string | RegExp): Locator { return this.rows.filter({ hasText: text }); }

  // ===== Phân trang =====
  get pager(): Locator { return this.root.getByRole('navigation', { name: 'Phân trang' }); }
  get pagerPrev(): Locator { return this.pager.getByRole('button', { name: 'Trang trước' }); }
  get pagerNext(): Locator { return this.pager.getByRole('button', { name: 'Trang sau' }); }
  pagerPage(n: number): Locator { return this.pager.getByRole('button', { name: String(n), exact: true }); }
  /** Dãy ô của thanh phân trang, vd ["1","2","3","…","10"]. */
  async pagerCells(): Promise<string[]> {
    return (await this.pager.locator('.pt-nut, .pt-luoc').allInnerTexts()).map((t) => t.trim());
  }

  // ===== Ô nổi =====
  get tip(): Locator { return this.root.locator('.bc-tip'); }
  get tipKicker(): Locator { return this.tip.locator('.bc-tip-kicker'); }
  get tipTitle(): Locator { return this.tip.locator('.bc-tip-ten'); }
  get tipRec(): Locator { return this.tip.locator('.bc-tip-kn'); }
  get tipSummary(): Locator { return this.tip.locator('.bc-tip-tom-tat li'); }

  // ===== Cửa sổ báo cáo phân tích =====
  get reportModal(): Locator { return this.page.locator('.modal.show .arm-modal'); }
  get rmKicker(): Locator { return this.reportModal.locator('.arm-kicker'); }
  get rmCode(): Locator { return this.reportModal.locator('.arm-code'); }
  get rmTitle(): Locator { return this.reportModal.locator('.arm-title'); }
  get rmRec(): Locator { return this.reportModal.locator('.arm-rec'); }
  get rmSource(): Locator { return this.reportModal.getByRole('link', { name: 'Xem tài liệu gốc' }); }
  get rmAllReports(): Locator { return this.reportModal.getByRole('button', { name: /Xem mọi báo cáo của/ }); }
  get rmBody(): Locator { return this.reportModal.locator('.arm-body'); }
  get rmPoints(): Locator { return this.reportModal.locator('.arm-points li:not(.arm-cho)'); }
  get rmSkeleton(): Locator { return this.reportModal.locator('.arm-points li.arm-cho'); }
  get rmError(): Locator { return this.reportModal.locator('.arm-trong'); }
  get rmRetry(): Locator { return this.reportModal.getByRole('button', { name: 'Thử lại' }); }
  get rmClose(): Locator { return this.reportModal.getByRole('button', { name: 'Đóng' }); }

  // ===== Cửa sổ bài viết =====
  get newsModal(): Locator { return this.page.locator('.modal.show').filter({ has: this.page.locator('.tt-noi-dung') }); }
  get newsModalTitle(): Locator { return this.newsModal.locator('.modal-title'); }
  get newsModalBody(): Locator { return this.newsModal.locator('.tt-noi-dung'); }

  /** Chờ mọi bảng hết khung chờ và các ô số trên tab đã hiện. */
  async waitLoaded() {
    await expect(this.tab('Báo cáo phân tích').locator('.tt-dem')).toBeVisible({ timeout: 30000 });
    await expect(this.tab('Bài viết').locator('.tt-dem')).toBeVisible({ timeout: 30000 });
    await expect(this.tab('Báo cáo quản trị').locator('.tt-dem')).toBeVisible({ timeout: 30000 });
    await expect(this.skeletonRows).toHaveCount(0, { timeout: 30000 });
  }

  /** Gõ vào ô "Mã CK" — chờ danh sách mã của store (`list_mack`, nạp lúc vào app) có dữ liệu trước, vì gợi ý lọc từ đó. */
  async typeCode(text: string) {
    await expect.poll(() => this.page.evaluate(() => {
      type VueEl = Element & { __vue__?: { $store?: { state: { list_mack?: unknown[] } } } };
      const el = Array.from(document.querySelectorAll('.c-app, body *')).find((e) => (e as VueEl).__vue__?.$store) as VueEl | undefined;
      return el?.__vue__?.$store?.state.list_mack?.length || 0;
    }), { timeout: 30000 }).toBeGreaterThan(0);
    await this.searchInput.fill(text);
  }

  /** Đổi mã qua Vue store giống các nút "đổi mã" khác của app (không ghi setting). */
  async setStoreCode(code: string) {
    await this.page.evaluate((c) => {
      type VueEl = Element & { __vue__?: { $store?: { state: { mack: string } } } };
      const el = Array.from(document.querySelectorAll('.c-app, body *')).find((e) => (e as VueEl).__vue__?.$store) as VueEl;
      el.__vue__!.$store!.state.mack = c;
    }, code);
  }

  /** Điều hướng trong app (không tải lại trang) bằng router của Vue. */
  async routerPush(url: string) {
    await this.page.evaluate((u) => {
      type VueEl = Element & { __vue__?: { $router?: { push: (u: string) => Promise<unknown> } } };
      const el = Array.from(document.querySelectorAll('.c-app, body *')).find((e) => (e as VueEl).__vue__?.$router) as VueEl;
      return el.__vue__!.$router!.push(u).then(() => undefined, () => undefined);
    }, url);
  }
}
