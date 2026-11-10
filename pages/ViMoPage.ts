import { Page, Locator, Route } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Màn "Vĩ mô" (`/vi-mo`, menu Phân tích cơ bản › Vĩ mô) — `stocks/src/views/macro/index.vue` (khung + thanh tab +
 * ô chọn), `tongQuan.vue` (trang Tổng quan dạng infographic), `detail_table.vue` (mô tả chỉ tiêu + biểu đồ + bảng),
 * `*_description.vue` (khung mô tả bên trái mỗi tab).
 *
 * Ghi chú cấu trúc (đọc source preprod + DOM thật 10/11/2026):
 * - Vào trang luôn ở "Tổng quan" và KHÔNG có thanh tab (thanh tab chỉ render khi `value_type_menu != 'tong_quan'`);
 *   cách duy nhất sang chi tiết là link "Xem chi tiết" (→ tab GDP). Từ chi tiết bấm tab "Tổng quan" để quay lại.
 * - Đổi tab chỉ đổi data cục bộ, KHÔNG đổi URL → F5 luôn về Tổng quan.
 * - API (host api2.kfsp.vn, chỉ GET): Tổng quan `GET /api/stocks/get-data-macro`; chi tiết
 *   `GET /api/stocks/get-data-macro-by-type?type&kieu_baocao&kieu_dulieu&typeTab` — trả mảng 2 chiều: hàng 0 = ["Chỉ
 *   tiêu","Đơn vị", kỳ...], các hàng sau = [tên, đơn vị, giá trị...]. Đơn vị "%" bị trừ 100 khi hiển thị (trừ tab Tín
 *   dụng). Mỗi lần đổi tab, 3 watcher cùng gọi API (gọi trùng 2–3 lần — không phải lỗi hiển thị).
 * - Free: `features_disabled.vi_mo` → cả trang thay bằng `<ProtectedView featureName="vi_mo">` (ảnh `.blurred-image`).
 */
export const MACRO_TABS = [
  'Tổng quan', 'GDP', 'IIP', 'Bán lẻ và Dịch vụ', 'CPI', 'Xuất - Nhập khẩu', 'Đầu tư NSNN', 'FDI', 'Tín dụng',
  'Chỉ tiêu doanh nghiệp', 'Vận tải', 'Du lịch', 'Dân số - Lao động',
] as const;
export type MacroTab = typeof MACRO_TABS[number];

export const OVERVIEW_API = /\/api\/stocks\/get-data-macro(\?|$)/;
export const BY_TYPE_API = /\/api\/stocks\/get-data-macro-by-type(\?|$)/;

/** Query (bỏ token) của 1 lần gọi API chi tiết. */
export type ByTypeQuery = { type: string; kieu_baocao: string; kieu_dulieu: string; typeTab: string };

export class ViMoPage extends BasePage {
  // Tổng quan
  readonly overview: Locator;
  readonly overviewTitle: Locator;
  readonly viewDetailLink: Locator;
  readonly bubbles: Locator;
  readonly overviewSection: (title: string) => Locator;
  // Chi tiết
  readonly tabs: Locator;
  readonly activeTab: Locator;
  readonly selects: Locator;
  readonly description: Locator;
  readonly descriptionTitle: Locator;
  readonly table: Locator;
  readonly headerCells: Locator;
  readonly rows: Locator;
  readonly chartToggle: Locator;
  readonly chartBox: Locator;
  readonly chartExpandButton: Locator;
  readonly chartModal: Locator;
  readonly gsoNote: Locator;
  readonly disclaimer: Locator;
  readonly protectedView: Locator;

  /** Mọi lần gọi API chi tiết (đã nhận ở trình duyệt), theo thứ tự. */
  readonly byTypeCalls: ByTypeQuery[] = [];
  overviewCalls = 0;

  constructor(page: Page) {
    super(page);
    this.overview = page.locator('.body-tongquan');
    this.overviewTitle = this.overview.getByText(/^TỔNG QUAN TÌNH HÌNH KINH TẾ/);
    this.viewDetailLink = this.overview.locator('p.hover-link', { hasText: 'Xem chi tiết' });
    this.bubbles = this.overview.locator('.circle-item');
    this.overviewSection = (title: string) => this.overview.locator('.container').filter({
      has: page.locator('.overlay-box', { hasText: title }),
    });

    this.tabs = page.locator('main .horizontal-scroll-arrow_item');
    this.activeTab = page.locator('main .horizontal-scroll-arrow_item.btn-label_active');
    // Ô chọn ở góc phải thanh tab (`.flex-responsive`) — scope để tránh các <select> ẩn của modal cảnh báo toàn site.
    this.selects = page.locator('main .flex-responsive select');
    this.description = page.locator('main .col-xl-3').first();
    this.descriptionTitle = this.description.locator('p.text-center.font-weight-bold').first();
    this.table = page.locator('#custom-macro');
    this.headerCells = this.table.locator('thead th');
    this.rows = this.table.locator('tbody tr');
    this.chartToggle = page.locator('main .cursor-pointer', { has: page.locator('p', { hasText: /^Biểu đồ$/ }) });
    this.chartBox = this.chartToggle.locator('xpath=following-sibling::div[1]');
    this.chartExpandButton = this.chartBox.locator('xpath=./div[last()]');
    this.chartModal = page.locator('.modal.show');
    this.gsoNote = page.getByText('Số liệu ước tính tại từng tháng theo GSO');
    this.disclaimer = page.getByText('Tuyên bố trách nhiệm/Disclaimer:');
    this.protectedView = page.locator('main .image-container .blurred-image');

    page.on('request', (r) => {
      if (OVERVIEW_API.test(r.url())) this.overviewCalls++;
      if (!BY_TYPE_API.test(r.url())) return;
      const q = new URL(r.url()).searchParams;
      this.byTypeCalls.push({
        type: q.get('type') ?? '', kieu_baocao: q.get('kieu_baocao') ?? '', kieu_dulieu: q.get('kieu_dulieu') ?? '',
        typeTab: q.get('typeTab') ?? '',
      });
    });
  }

  /** Đăng nhập bằng phiên cache `Prev2Session` (chặn ghi setting) rồi mở `/vi-mo`. */
  async open(account: Prev2Account = 'paid') {
    await new Prev2Session(this.page).open({ account, path: '/vi-mo' });
  }

  /** Mở trang và chờ Tổng quan có dữ liệu (tiêu đề có số tháng). */
  async openReady() {
    await this.open();
    await this.overviewTitle.waitFor();
    await this.bubbles.first().waitFor();
  }

  /** Từ Tổng quan bấm "Xem chi tiết" → tab GDP, chờ bảng hiện. */
  async openDetail() {
    await this.openReady();
    await this.viewDetailLink.click();
    await this.rows.first().waitFor();
  }

  tab(name: MacroTab): Locator {
    return this.tabs.filter({ hasText: new RegExp(`^\\s*${name.replace(/[-]/g, '\\-')}\\s*$`) });
  }

  async clickTab(name: MacroTab) {
    await this.tab(name).click();
  }

  lastCall(): ByTypeQuery | undefined {
    return this.byTypeCalls[this.byTypeCalls.length - 1];
  }

  /** Text các option của ô chọn thứ `i`. */
  async optionsOf(i: number): Promise<string[]> {
    return (await this.selects.nth(i).locator('option').allInnerTexts()).map((s) => s.trim());
  }

  rowByIndicator(name: string): Locator {
    return this.rows.filter({ has: this.page.locator('td:first-child', { hasText: new RegExp(`^\\s*${name}\\s*$`) }) });
  }

  /** Dòng đang được chọn lên biểu đồ = có nền `--kfsp-hover-item-color` (colorAssign). */
  highlightedRows(): Locator {
    return this.table.locator('tbody tr[style*="kfsp-hover-item-color"]');
  }

  /** Giả lập API chi tiết: `body(query)` trả JSON, hoặc số → mã lỗi HTTP. */
  async mockByType(body: (q: ByTypeQuery) => unknown | number) {
    await this.page.route(BY_TYPE_API, async (route: Route) => {
      const q = new URL(route.request().url()).searchParams;
      const res = body({
        type: q.get('type') ?? '', kieu_baocao: q.get('kieu_baocao') ?? '', kieu_dulieu: q.get('kieu_dulieu') ?? '',
        typeTab: q.get('typeTab') ?? '',
      });
      if (typeof res === 'number') return route.fulfill({ status: res, json: { message: 'Lỗi giả lập' } });
      return route.fulfill({ json: res });
    });
  }

  /** Giả lập API Tổng quan: lấy dữ liệu thật rồi sửa (`patch`), hoặc số → mã lỗi HTTP. */
  async mockOverview(patch: ((data: any) => any) | number) {
    await this.page.route(OVERVIEW_API, async (route: Route) => {
      if (typeof patch === 'number') return route.fulfill({ status: patch, json: { message: 'Lỗi giả lập' } });
      const res = await route.fetch();
      return route.fulfill({ response: res, json: patch(await res.json()) });
    });
  }
}

/** Bảng giả lập cho API chi tiết: `periods` kỳ, `rows` = [tên, đơn vị, ...giá trị]. */
export function macroTable(periods: string[], rows: (string | number | null)[][]): unknown[] {
  return [['Chỉ tiêu', 'Đơn vị', ...periods], ...rows];
}
