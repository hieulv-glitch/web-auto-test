import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Page Object cho route `/nganh` ("Ngành", 1 trong 3 màn con của menu header "Toàn cảnh thị trường", cùng
 * `/bo-loc` và `/suc-manh-dong-tien`). Cả 3 route dùng chung component `stocks/src/views/ibd/index.vue`
 * (`reactLayoutIBD` — kiến trúc flexlayout-react) + `wrapperLayout.vue`, chỉ khác nhau ở prop `type` truyền
 * vào (`"department"` cho `/nganh`) quyết định nhánh UI nào được render bên trong ô tabset chính.
 *
 * Panel border phải ("IBD KungfuStocksPro" — Nhịp đập TT/Nỗ lực - Kết quả/Sức khỏe TT, cùng 8 tab dọc IBD/
 * Thông tin/Bài viết/Watchlist/Cảnh báo/Ghi chú/Cộng đồng/Chatbot) là hạ tầng flexlayout DÙNG CHUNG cho mọi
 * route IBD (`/bang-gia`, `/bo-loc`, `/nganh`, `/suc-manh-dong-tien`) — đã được test đầy đủ ở
 * [bang-gia.md](../testcases/bang-gia.md) (Nhóm E, TC_BANGGIA_40-47), KHÔNG lặp lại ở đây. */
export class NganhPage extends BasePage {
  /** Khối `.flexlayout__tab` chứa nội dung riêng của "Ngành" — dùng text tab con "Luân chuyển dòng tiền ngành"
   * (chỉ xuất hiện trong nội dung chính, không có trong panel border phải) làm mỏ neo để scope MỌI locator của
   * vùng nội dung chính, tránh đụng hàng với panel border phải (dùng chung nhiều class Bootstrap như
   * `.nav-tabs`, `table`...). */
  readonly mainContent: Locator;
  readonly table: Locator;
  readonly headerCells: Locator;
  readonly rows: Locator;
  readonly tooltipChart: Locator;
  readonly protectedOverlay: Locator;

  readonly headerMenuLink: Locator;
  /** Dropdown con của menu header "Toàn cảnh thị trường" — lọc theo text "Sức mạnh dòng tiền" vì đây là link
   * chỉ xuất hiện đúng 1 lần trong toàn bộ header (khác các dropdown menu khác dùng chung class
   * `.menu-child-items`). */
  readonly headerSubmenu: Locator;

  constructor(page: Page) {
    super(page);
    this.mainContent = page.locator('.flexlayout__tab').filter({ hasText: 'Luân chuyển dòng tiền ngành' });
    this.table = this.mainContent.locator('table');
    this.headerCells = this.table.locator('thead th');
    this.rows = this.table.locator('tbody tr');
    this.tooltipChart = page.locator('#tooltip-chart');
    this.protectedOverlay = this.mainContent.locator('.register-content-center');

    // Cập nhật 10/11/2026: menu header "Toàn cảnh thị trường" đã bỏ — "Ngành" giờ là mục con của "Thị Trường"
    // (src/containers/mainMenu.js), cùng "Bảng giá chứng khoán"/"Bảng giá crypto"/"Sức mạnh dòng tiền"/"Thông tin và Sự Kiện".
    this.headerMenuLink = page.getByRole('link', { name: 'Thị Trường', exact: true }).first();
    this.headerSubmenu = page.locator('.menu-child-items').filter({ hasText: 'Sức mạnh dòng tiền' });
  }

  async goto() {
    await super.goto('/nganh');
    await this.rows.first().waitFor({ state: 'visible', timeout: 20000 });
  }

  /** Tab chính "Tổng quan" | "Luân chuyển dòng tiền ngành". */
  tab(name: string): Locator {
    return this.mainContent.locator('ul.nav-tabs .nav-link', { hasText: name });
  }

  headerCell(label: string): Locator {
    return this.headerCells.filter({ hasText: label });
  }

  /** 1 dòng trong bảng, lọc theo đúng tên ngành (cột đầu tiên, chữ đậm) — dùng `exact` để tránh khớp nhầm
   * (VD "VNINDEX" so với "Thanh khoản VNINDEX"). */
  rowByName(name: string): Locator {
    return this.rows.filter({ has: this.page.locator('td strong', { hasText: name, exact: true } as any) });
  }

  cellsOf(row: Locator): Locator {
    return row.locator('td');
  }

  /** Cột 0 (Tên ngành) — cả 2 tab đều dùng đúng cột này để điều hướng/định danh dòng. */
  nameCellOf(row: Locator): Locator {
    return this.cellsOf(row).nth(0);
  }

  /** Cột 1 (Trạng thái, chỉ tab "Tổng quan"). */
  statusCellOf(row: Locator): Locator {
    return this.cellsOf(row).nth(1);
  }

  /** Cột 2 (Giá, chỉ tab "Tổng quan"). */
  priceCellOf(row: Locator): Locator {
    return this.cellsOf(row).nth(2);
  }

  /** Cột 3 (Điểm RS, chỉ tab "Tổng quan"). */
  rsCellOf(row: Locator): Locator {
    return this.cellsOf(row).nth(3);
  }

  /** Cột 4 (biểu đồ Nỗ lực - Kết quả, chỉ tab "Tổng quan"). */
  effortResultChartCellOf(row: Locator): Locator {
    return this.cellsOf(row).nth(4);
  }

  submenuLink(name: string): Locator {
    return this.headerSubmenu.locator('a', { hasText: name });
  }
}
