import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class BangGiaPage extends BasePage {
  /** Khối `.flexlayout__tab` chứa ô "Tìm kiếm Mã CK" — dùng làm mỏ neo để scope MỌI locator của vùng nội dung
   * chính (bảng giá), tránh đụng hàng với: (1) nội dung panel border phải (cũng render trong 1
   * `.flexlayout__tab` khác), (2) các dropdown/nav chung của header trang (nhiều class dùng chung tên như
   * `.dropdown`, `.dropdown-menu`, `.dropdown-item` với Bootstrap). */
  readonly mainContent: Locator;
  readonly searchInput: Locator;
  readonly searchSuggestions: Locator;
  readonly boardDropdownToggle: Locator;
  readonly boardDropdownMenuItems: Locator;
  readonly filtersOverflowToggle: Locator;
  readonly filtersOverflowPanel: Locator;
  readonly departmentDropdown: Locator;
  readonly watchlistDropdown: Locator;
  readonly signalDropdown: Locator;
  readonly filterDropdown: Locator;
  readonly expandChartButton: Locator;
  readonly autoScrollButton: Locator;
  readonly columnVisibilityButton: Locator;
  readonly indexCards: Locator;
  readonly headerRow: Locator;
  readonly mainListContainer: Locator;
  readonly mainRows: Locator;
  readonly pinnedContainer: Locator;
  readonly pinnedRows: Locator;
  readonly footerNote: Locator;
  readonly derivativeCodeSelect: Locator;
  readonly derivativesHistoryTable: Locator;

  /** Border phải (border-tab bar của flexlayout) — dùng chung cho cả `LiveBoard` lẫn Dashboard cũ, nhưng ở đây
   * scope riêng theo `data-layout-path="/border/right/..."` để chắc chắn không lẫn với border trái/dưới (màn
   * này không dùng border trái/dưới nên thực ra không bắt buộc, nhưng giữ tường minh). */
  readonly borderButtons: Locator;
  readonly activeBorderButton: Locator;
  readonly borderSizer: Locator;

  constructor(page: Page) {
    super(page);
    this.mainContent = page.locator('.flexlayout__tab').filter({ has: page.getByPlaceholder('Tìm kiếm Mã CK') });

    this.searchInput = page.getByPlaceholder('Tìm kiếm Mã CK');
    this.searchSuggestions = page.locator('.search-stockcode_item');

    // Cập nhật 2026-09-22 (nhánh UI mới, đo trên localhost:8080): toolbar đã đổi giao diện LẦN 2, sâu hơn lần
    // trước (segment-item buttons) — giờ:
    // (1) Sàn/Phái sinh gộp chung 1 dropdown DUY NHẤT "Danh sách sàn" (`.pb-board-toggle`), KHÔNG còn button
    //     rời cho từng sàn. "Phái sinh" giờ cũng là 1 item trong chính dropdown này (không phải nút riêng).
    // (2) Ngành/Watchlist/Tín hiệu M/B/Bộ lọc bị gộp vào 1 nút "Bộ lọc" overflow (`.pb-overflow-filters-toggle`)
    //     — PHẢI click mở nút này trước, các dropdown con (`departmentDropdown`/`watchlistDropdown`/
    //     `signalDropdown`/`filterDropdown` bên dưới) mới xuất hiện trong DOM để tương tác tiếp. Bản thân 4
    //     dropdown con vẫn dùng ĐÚNG y component cũ (`DropdownDepartment.vue`/`dropdownWatchlist`/
    //     `PatternSelector.vue`), chỉ đổi vị trí lồng — nên locator bên trong giữ nguyên không đổi.
    // Chỉ trỏ vào phần "header" (nhãn + caret) của dropdown, KHÔNG phải cả khối `.pb-board-toggle` — khối đó
    // còn chứa cả menu "Danh sách sàn" LỒNG BÊN TRONG (dù đang đóng vẫn còn trong DOM), nên nếu trỏ cả khối,
    // `.textContent()`/`toHaveText()` sẽ lẫn cả text của toàn bộ 7 mục trong menu.
    this.boardDropdownToggle = this.mainContent.locator('.pb-board-toggle > div.d-flex.justify-content-between');
    this.boardDropdownMenuItems = this.mainContent.locator('.pb-board-toggle .dropdown-item');
    this.filtersOverflowToggle = this.mainContent.locator('.pb-overflow-filters-toggle');
    this.filtersOverflowPanel = this.mainContent.locator('.pb-overflow-filters-panel');

    // Class "dropdown-toggles" chỉ dùng bởi DropdownDepartment.vue trong toàn bộ codebase — an toàn để scope
    // theo class này mà không cần thêm điều kiện text.
    this.departmentDropdown = this.mainContent.locator('.dropdown').filter({ has: page.locator('.dropdown-toggles') });
    // DropdownWatchlist (liveBoard) render 1 `<div class="... dropdown">` có menu con `.dropdown-menu-full-width`
    // với tiêu đề cố định "Danh sách Watchlist" — dùng tiêu đề đó để phân biệt với dropdown "Danh sách sàn"
    // (`.pb-board-toggle`, cũng dùng chung `.dropdown-menu-full-width` nhưng tiêu đề "Danh sách sàn").
    this.watchlistDropdown = this.mainContent.locator('.dropdown').filter({ has: page.locator('.dropdown-menu-full-width', { hasText: 'Danh sách Watchlist' }) });
    this.signalDropdown = this.mainContent.locator('.base-dropdown').filter({ hasText: 'Tín hiệu M/B' });
    this.filterDropdown = this.mainContent.locator('.base-dropdown').filter({ hasText: 'Bộ lọc' });

    // Nút này giờ thu/mở CẢ DẢI 5 index card cùng lúc (title "Gập dải chỉ số, xem toàn bảng giá" ⇄ "Hiện lại
    // dải chỉ số") — KHÁC hành vi cũ (từng chỉ toggle mini-chart RIÊNG bên trong mỗi card, card vẫn luôn hiện).
    // Mặc định tải trang: dải chỉ số đang HIỆN, nút hiện chữ "Thu gọn" (bấm để thu gọn) — không phải "Mở rộng".
    this.expandChartButton = this.mainContent.locator('.pb-icon-btn-text');
    this.autoScrollButton = this.mainContent.locator('.pb-icon-btn[title="Bảng tự lướt xuống"]');
    this.columnVisibilityButton = this.mainContent.locator('button[title="Ẩn/hiện các cột"]');

    this.indexCards = this.mainContent.locator('.idx-card');

    this.headerRow = page.locator('.price-board-header-row');
    this.mainListContainer = page.locator('#priceboard-list-item');
    // ".price-board-row-item" cũng là tên class của DIV BAO NGOÀI khu vực ghim (luôn tồn tại kể cả khi rỗng) —
    // dùng ".price-board-row" (không có "-item") để chỉ khớp đúng nội dung từng dòng thật sự có dữ liệu.
    this.mainRows = this.mainListContainer.locator('.price-board-row');
    this.pinnedContainer = page.locator('#priceboard-pinned');
    this.pinnedRows = this.pinnedContainer.locator('.price-board-row');

    this.footerNote = this.mainContent.getByText(/^Giá x/);
    this.derivativeCodeSelect = this.mainContent.locator('select');
    this.derivativesHistoryTable = this.mainContent.locator('table.table-row-all');

    this.borderButtons = page.locator('.flexlayout__border_button');
    this.activeBorderButton = page.locator('.flexlayout__border_button--selected');
    this.borderSizer = page.locator('.flexlayout__border_sizer');
  }

  async goto() {
    await super.goto('/bang-gia');
    await this.page.waitForLoadState('networkidle');
  }

  /** 1 mục trong dropdown "Danh sách sàn": "Toàn bộ" | "HOSE" | "VN30" | "VN100" | "HNX" | "UPCOM" |
   * "Phái sinh". Phải `boardDropdownToggle.click()` mở dropdown trước khi dùng. */
  boardMenuItem(name: string): Locator {
    return this.boardDropdownMenuItems.filter({ hasText: name });
  }

  /** Mở dropdown "Danh sách sàn" và chọn 1 sàn/loại — helper gộp cho gọn, tự đợi UI ổn định. */
  async selectBoard(name: string) {
    await this.boardDropdownToggle.click();
    await this.page.waitForTimeout(400);
    await this.boardMenuItem(name).click();
    await this.page.waitForTimeout(1000);
  }

  /** Mở panel "Bộ lọc" overflow (gộp Ngành/Watchlist/Tín hiệu M/B/Bộ lọc) — bắt buộc gọi trước khi tương tác
   * với `departmentDropdown`/`watchlistDropdown`/`signalDropdown`/`filterDropdown`, các dropdown con này chỉ
   * có trong DOM sau khi panel đã mở. Không throw nếu panel đã mở sẵn. */
  async openFiltersOverflow() {
    if (await this.filtersOverflowPanel.count() > 0) return;
    await this.filtersOverflowToggle.click();
    await this.page.waitForTimeout(400);
  }

  /** Tab dọc panel border phải: "IBD" | "Thông tin" | "Watchlist" | "Cảnh báo" | "Ghi chú" | "Cộng đồng".
   * Cập nhật 2026-09-22 (nhánh UI mới): CHỈ còn 6 tab — "Bài viết" và "Chatbot" đã bị gỡ bỏ hoàn toàn khỏi
   * `DEFAULT_BORDER_LAYOUT` (không phải flaky ẩn/hiện như nghi vấn cũ ở TC_BANGGIA_03/42/47 — 2 tab này giờ
   * không tồn tại trên UI nữa, xác nhận qua đếm border tab luôn ra đúng 6 trên nhánh này). */
  borderTab(name: string): Locator {
    return this.borderButtons.filter({ hasText: name });
  }

  /** Nội dung panel border đang mở. LƯU Ý: flexlayout-react giữ NGUYÊN trong DOM container `.flexlayout__tab`
   * của MỌI tab border (8 cái), kể cả khi không active — chỉ 1 cái thực sự hiển thị (`:visible`) tại 1 thời
   * điểm. Dùng `hasNot` placeholder tìm kiếm KHÔNG đủ để phân biệt (mọi border tab đều không chứa ô đó), nên
   * phải lọc thêm theo tính hiển thị thật. */
  borderContent(): Locator {
    return this.page.locator('.flexlayout__tab.flexlayout__tab_border:visible');
  }

  /** Sub-tab bên trong panel border đang mở, VD "Nhịp đập TT", "Danh sách", "Cá nhân"... */
  borderSubTab(name: string): Locator {
    return this.borderContent().getByText(name, { exact: true });
  }

  /** Header cột của bảng (click để sort), VD "Mã", "Ngành", "Tổng KL", "Cao"... — dùng `exact: false` vì text
   * gồm cả icon mũi tên sort nối liền. */
  columnHeader(label: string): Locator {
    return this.headerRow.locator('.price-board-col.header-col', { hasText: label });
  }

  /** 1 dòng mã trong danh sách chính, lọc theo đúng mã CK (link đầu dòng). */
  mainRowByCode(code: string): Locator {
    return this.mainRows.filter({ has: this.page.locator('a', { hasText: code }) });
  }

  pinIconOf(row: Locator): Locator {
    return row.locator('[title="Nhấn để ghim lên đầu"]');
  }

  unpinIconOf(row: Locator): Locator {
    return row.locator('[title="Nhấn để bỏ ghim"]');
  }

  codeLinkOf(row: Locator): Locator {
    return row.locator('a').first();
  }

  /** Danh sách mã CK đang render trong danh sách chính (KHÔNG bao gồm khu ghim) — CHÚ Ý: bảng dùng
   * `react-window` (virtualization), nên đây chỉ là các dòng đang thật sự có trong DOM tại viewport hiện tại
   * (mặc định ~10-15 dòng đầu), KHÔNG phải toàn bộ dữ liệu đã lọc. Vẫn dùng được để so sánh "danh sách có đổi
   * đúng theo bộ lọc không" vì virtualization luôn render từ đầu danh sách (`itemCount`/`itemData` đổi thì
   * viewport hiện tại cũng đổi theo nội dung mới ngay). */
  async visibleStockCodes(): Promise<string[]> {
    const rows = this.mainRows;
    const count = await rows.count();
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await this.codeLinkOf(rows.nth(i)).textContent())?.trim();
      if (text) codes.push(text);
    }
    return codes;
  }

  /** Icon "‹"/"›" đổi cột ĐTNN (Mua/Bán ⇄ Room). Cập nhật 2026-09-22: header Mua/Bán không còn mang id
   * `priceboard-foreign-start`/`-end` (locator cũ không còn khớp) — dùng `[data-grp="foreign"]` (thuộc tính ổn
   * định hơn, xác nhận còn tồn tại qua DOM thật), lấy icon đầu tiên tìm được (click icon nào cũng toggle chung
   * 1 state `is_show_column_froom`). */
  foreignColumnToggleIcon(): Locator {
    return this.headerRow.locator('[data-grp="foreign"] svg').first();
  }
}
