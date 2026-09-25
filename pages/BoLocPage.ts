import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Page Object cho `/bo-loc` ("Bộ lọc cổ phiếu"). Component thật sự đứng sau route này là
 * `src/views/filterCanslim/index.vue` (Vue thuần, KHÔNG phải React `flexlayout` như `/bang-gia`) — vẫn dùng
 * `.flexlayout__tab` để scope vùng nội dung chính (tránh đụng hàng với panel border phải "IBD" cùng render
 * trong 1 `.flexlayout__tab` khác), theo đúng pattern đã dùng ở `BangGiaPage`. */
export class BoLocPage extends BasePage {
  /** Neo theo input "Nhập mã chứng khoán" (`SearchFilterStrockCode.vue`, `maxlength=3`), placeholder này chỉ
   * tồn tại trong vùng nội dung chính của `/bo-loc`. */
  readonly mainContent: Locator;

  // --- Thanh mẫu KFSP công khai (FilterTemplate.vue) ---
  readonly templateExploreMoreLink: Locator;

  // --- Dropdown mẫu lọc cá nhân đã lưu (FilterDropdown.vue) ---
  readonly presetDropdownToggle: Locator;
  readonly presetDropdownMenu: Locator;
  readonly presetDropdownItems: Locator;
  readonly presetCreateNewButton: Locator;
  /** Nút "Quản lý" bên trong dropdown mẫu lọc — PHẢI dùng class `.managaer-filter` (đúng chính tả trong source,
   * xem `FilterDropdown.vue`), KHÔNG dùng `getByText("Quản lý")` vì trang còn 1 mục menu ẩn khác trùng chuỗi con
   * ("Quản lý liên hệ") gây nhầm lẫn khi chọn phần tử. */
  readonly presetManageButton: Locator;

  // --- 4 nút hành động (Lưu / Tạo bản sao / Tùy chỉnh tiêu chí / Reset giá trị) ---
  readonly saveButton: Locator;
  readonly duplicateButton: Locator;
  readonly customizeCriteriaButton: Locator;
  readonly resetValuesButton: Locator;

  // --- Input Mã CK (SearchFilterStrockCode.vue) ---
  readonly stockCodeInput: Locator;
  readonly stockCodeSuggestions: Locator;

  // --- Kết quả lọc + hành động ---
  readonly resultCountText: Locator;
  readonly refreshResultButton: Locator;
  readonly alertBellButton: Locator;
  readonly exportExcelButton: Locator;

  // --- Bảng kết quả ---
  readonly columnTabsBar: Locator;
  readonly tableRows: Locator;
  readonly emptyDataMessage: Locator;
  readonly paginationNav: Locator;

  // --- Modal "Tùy chỉnh tiêu chí" (`.pick_criterias_modal`) ---
  readonly customModal: Locator;
  readonly customModalTabs: Locator;
  readonly customModalSelectedChips: Locator;
  readonly customModalToggleSelectAllButton: Locator;
  readonly customModalCancelButton: Locator;
  readonly customModalSaveButton: Locator;

  // --- Modal "Tạo bản sao mẫu lọc" ---
  readonly duplicateModal: Locator;
  readonly duplicateModalNameInput: Locator;
  readonly duplicateModalCancelButton: Locator;
  readonly duplicateModalSaveButton: Locator;

  // --- Modal chi tiết mã CK (mở khi click 1 mã trong bảng) ---
  readonly stockDetailModal: Locator;
  readonly stockDetailModalCloseButton: Locator;

  // --- Panel border phải (giống flexlayout của /bang-gia, chỉ 6 tab ở màn này) ---
  readonly borderButtons: Locator;
  readonly activeBorderButton: Locator;

  constructor(page: Page) {
    super(page);
    this.mainContent = page.locator('.flexlayout__tab').filter({ has: page.getByPlaceholder('Nhập mã chứng khoán') });

    this.templateExploreMoreLink = this.mainContent.getByText('Khám phá hơn', { exact: false });

    this.presetDropdownToggle = this.mainContent.locator('.filter-container .filter');
    this.presetDropdownMenu = this.mainContent.locator('.dropdown-filter');
    this.presetDropdownItems = this.presetDropdownMenu.locator('.item-dropdown');
    this.presetCreateNewButton = this.presetDropdownMenu.locator('.filter-create');
    this.presetManageButton = this.presetDropdownMenu.locator('.managaer-filter');

    this.saveButton = this.mainContent.locator('.save-change-container');
    this.duplicateButton = this.mainContent.locator('.button-container', { hasText: 'Tạo bản sao' });
    this.customizeCriteriaButton = this.mainContent.locator('.button-container', { hasText: 'Tùy chỉnh tiêu chí' });
    this.resetValuesButton = this.mainContent.locator('.button-container', { hasText: 'Reset giá trị' });

    this.stockCodeInput = this.mainContent.getByPlaceholder('Nhập mã chứng khoán');
    this.stockCodeSuggestions = this.mainContent.locator('.search-stockcode_item');

    this.resultCountText = this.mainContent.locator('.res-filter p');
    // "Kết quả lọc: N mã" nằm trong 1 div cha cùng 2 nút icon-only (refresh, bell) — cả 2 dùng chung class
    // `.button-container` (component `Button.vue` dùng chung cho mọi icon-button của màn này), phân biệt bằng
    // vị trí thứ tự trong DOM (refresh luôn đứng trước bell — xem `filterCanslim/index.vue` dòng 148-160).
    const resultActionsContainer = this.resultCountText.locator('xpath=ancestor::div[contains(@class,"flex_align_center_gap")]/div[1]');
    this.refreshResultButton = resultActionsContainer.locator('.button-container').nth(0);
    this.alertBellButton = resultActionsContainer.locator('.button-container').nth(1);
    this.exportExcelButton = this.mainContent.getByRole('button', { name: 'Xuất File Excel' });

    this.columnTabsBar = this.mainContent.locator('ul.menu-nav-tab');
    this.tableRows = this.mainContent.locator('table.table-row-all tbody tr');
    this.emptyDataMessage = this.mainContent.getByText('Không có dữ liệu');
    this.paginationNav = this.mainContent.locator('nav[aria-label="pagination"], ul.pagination').first();

    // Xác nhận qua accessibility snapshot thật: modal này có role="dialog", các "tab" nhóm tiêu chí (Thông tin
    // chung/Cơ bản/Kỹ thuật/KFSP) render dạng `link` (KHÔNG phải role="tab" chuẩn) bên trong 1 `list`.
    this.customModal = page.getByRole('dialog').filter({ hasText: 'Thêm điều kiện vào bộ lọc' });
    this.customModalTabs = this.customModal.getByRole('list').first().getByRole('link');
    this.customModalSelectedChips = this.customModal.locator('.drag_item');
    this.customModalToggleSelectAllButton = this.customModal.getByRole('button', { name: /Chọn tất cả|Bỏ chọn tất cả/ });
    this.customModalCancelButton = this.customModal.getByRole('button', { name: 'Huỷ' });
    this.customModalSaveButton = this.customModal.locator('.save_button');

    // Cả 2 modal dưới đây (CModalBase / CModal của CoreUI) render đúng role="dialog" — dùng role thay vì đoán
    // class CSS (đã xác nhận qua accessibility snapshot thật, `.dom-inspect/*.aria.txt`).
    this.duplicateModal = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Tạo bản sao mẫu lọc' }) });
    this.duplicateModalNameInput = this.duplicateModal.locator('input[type="text"]');
    this.duplicateModalCancelButton = this.duplicateModal.getByRole('button', { name: 'Huỷ' });
    this.duplicateModalSaveButton = this.duplicateModal.getByRole('button', { name: 'Lưu' });

    this.stockDetailModal = page.getByRole('dialog').filter({ hasText: 'Thêm giao dịch' });
    this.stockDetailModalCloseButton = this.stockDetailModal.getByRole('button', { name: 'Close' });

    this.borderButtons = page.locator('.flexlayout__border_button');
    this.activeBorderButton = page.locator('.flexlayout__border_button--selected');
  }

  async goto() {
    await super.goto('/bo-loc');
    await this.page.waitForLoadState('networkidle');
  }

  /** Chip mẫu KFSP công khai trên thanh cuộn ngang đầu trang, lọc theo tên (VD "Golden Cross"). */
  templateChip(name: string): Locator {
    return this.mainContent.getByText(name, { exact: false }).first();
  }

  /** Card nhóm tiêu chí đang hiển thị trực tiếp trên trang (VD "Thông tin chung", "Cơ bản", "Kỹ thuật", "KFSP").
   *
   * Đọc đúng `filterCanslim/index.vue` dòng 30-52: `.collapse_header` là CON TRỰC TIẾP (không phải hậu duệ sâu
   * hơn) của `.card-wrapper`. Cố tình dùng CSS `:has(> .collapse_header:has-text(...))` (bắt buộc quan hệ con
   * trực tiếp) thay vì API `filter({ has })` mặc định (chỉ yêu cầu hậu duệ ở BẤT KỲ độ sâu nào) — đã đo được
   * qua test thật rằng `filter({has})` thỉnh thoảng khớp NHẦM vào 1 phần tử `.card-wrapper` rộng hơn dự kiến
   * (chứa NHIỀU nhóm tiêu chí khác làm hậu duệ, không chỉ đúng 1 nhóm cần tìm) tại 1 số thời điểm không cố định,
   * khiến các locator con (`.filter_options_item`, `.tag`) đếm lố sang cả nhóm khác. Ràng buộc quan hệ CON TRỰC
   * TIẾP loại trừ hẳn khả năng khớp nhầm này theo đúng cấu trúc DOM thật, không chỉ giảm xác suất bằng
   * `.first()`. */
  criteriaGroupCard(groupTitle: string): Locator {
    return this.mainContent.locator(`.card-wrapper:has(> .collapse_header:has-text("${groupTitle}"))`).first();
  }

  /** Badge số tiêu chí (`.tag`) cạnh tên 1 nhóm tiêu chí. Đọc đúng `filterCanslim/index.vue` dòng 33-50: `.tag`
   * là con TRỰC TIẾP của `.collapse_header` (cùng cấp với tên nhóm), KHÔNG nằm sâu trong phần thân card — neo
   * thẳng vào `.collapse_header` (thay vì qua `criteriaGroupCard`) để không bị ăn theo trường hợp
   * `.card-wrapper` khớp rộng hơn dự kiến lúc DOM có nhiều nhóm cùng tồn tại tạm thời (đã đo được qua test thật:
   * `criteriaGroupCard(...).locator('.tag')` có lúc trả về CẢ 4 badge của 4 nhóm khác nhau thay vì đúng 1 nhóm),
   * `.first()` phòng hờ thêm 1 lớp an toàn. */
  criteriaGroupBadge(groupTitle: string): Locator {
    return this.mainContent.locator('.collapse_header').filter({ hasText: groupTitle }).locator('.tag').first();
  }

  /** 1 ô tiêu chí (label + input/select) trong form chính, lọc theo đúng label hiển thị (VD "Vốn hoá TT",
   * "Tăng trưởng DTT (%) - TTM (%)", "SMA20 vs SMA100"). Xem ghi chú quan trọng ở `criteriaGroupCard` về lý do
   * `has` phải dùng `this.page.locator(...)`. */
  criteriaItem(label: string): Locator {
    return this.mainContent.locator('.filter_options_item').filter({ has: this.page.locator('.filter_options_item_label', { hasText: label }) });
  }

  /** Dropdown toán tử so sánh ("Lớn hơn"/"Bé hơn"/"Khoảng") của 1 tiêu chí dạng `range_input`. */
  criteriaComparisonSelect(label: string): Locator {
    return this.criteriaItem(label).locator('select.comparison_select');
  }

  /** Input giá trị đơn (khi toán tử là "Lớn hơn"/"Bé hơn") của 1 tiêu chí dạng `range_input`. */
  criteriaValueInput(label: string): Locator {
    return this.criteriaItem(label).locator('input.custom_field_input');
  }

  /** 2 input min/max (khi toán tử là "Khoảng") của 1 tiêu chí dạng `range_input`. */
  criteriaRangeInputs(label: string): Locator {
    return this.criteriaItem(label).locator('input.custom_field.text-right');
  }

  /** Dropdown lựa chọn (tiêu chí dạng `select`, VD "Hai đáy", "SMA20 vs SMA100", "Watchlist", "Sàn", "Ngành"). */
  criteriaSelect(label: string): Locator {
    return this.criteriaItem(label).locator('select.custom_field:not(.comparison_select)');
  }

  /** Tab nhóm cột kết quả (VD "Tiêu chí đã chọn", "Biến động giá", "KFSP"...). */
  columnTab(label: string): Locator {
    return this.columnTabsBar.locator('.nav-tab-item', { hasText: label });
  }

  /** Header cột bảng kết quả (click để sort), lọc theo text hiển thị (VD "Mã CK", "Ngành"). */
  columnHeader(label: string): Locator {
    return this.mainContent.locator('table.table-row-all thead th', { hasText: label });
  }

  /** 1 dòng kết quả, lọc theo đúng mã CK ở đầu dòng. */
  rowByCode(code: string): Locator {
    return this.tableRows.filter({ has: this.page.locator('a', { hasText: code }) });
  }

  /** Checkbox chọn dòng (đầu mỗi dòng kết quả). */
  rowCheckbox(row: Locator): Locator {
    return row.locator('input[type="checkbox"]');
  }

  /** Checkbox 1 tiêu chí trong modal "Tùy chỉnh tiêu chí" (nhóm không phải "Cơ bản"), lọc theo label. */
  customModalCheckboxByLabel(label: string): Locator {
    return this.customModal.locator('.checkbox_table_item').filter({ has: this.page.locator('.checkbox_table_item-label', { hasText: label }) }).locator('input[type="checkbox"]');
  }

  /** Icon thùng rác trên 1 chip tiêu chí đang chọn (hàng trên đầu modal "Tùy chỉnh tiêu chí"), lọc theo label. */
  customModalChipDeleteIcon(label: string): Locator {
    return this.customModalSelectedChips.filter({ hasText: label }).locator('svg, [class*="trash" i]').last();
  }

  /** Tab dọc panel border phải: "IBD" | "Thông tin" | "Watchlist" | "Cảnh báo" | "Ghi chú" | "Cộng đồng". */
  borderTab(name: string): Locator {
    return this.borderButtons.filter({ hasText: name });
  }
}
