import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Trang "Nhật ký giao dịch" (`/nhat-ky-giao-dich`, component `TradingLog` — stocks/src/views/tradingLog/index.vue).
 * 4 tab chính dùng `<CTabs>` (CoreUI): "Tài sản" · "Nhật ký giao dịch" · "Quản lý danh mục" · "Phân bổ vốn".
 *
 * 1 Page Object DÙNG CHUNG cho cả 4 tab (giống pattern `DashboardPage`) — locator/method nhóm theo comment
 * cho từng tab để dễ tra cứu, thay vì tách 4 class riêng.
 *
 * Ghi chú cấu trúc DOM quan trọng (đọc từ source + xác nhận qua `.dom-inspect/*.aria.txt`):
 * - CTabs top-level render `<ul class="nav nav-tabs"><a href="#" class="nav-link">` (CoreUI `CTab`) → mỗi tab
 *   chính có role thật là `link` (có href="#"), luôn là `.nav-tabs` ĐẦU TIÊN trong DOM (CTabs render nav trước
 *   nội dung, không phụ thuộc tab con nào đang active).
 * - Sub-tab tự viết tay (Lịch sử giao dịch/Thống kê phân tích trong `tabTradingHistory.vue`; Danh mục hiện có/
 *   Danh mục đã xóa trong `ManageCategory.vue`) dùng `<a class="nav-link" @click=...>` KHÔNG có `href` → KHÔNG
 *   có role `link`, chỉ là text thường trong `.nav-tabs` — phải phân biệt bằng class/text, không dùng
 *   `getByRole('link', ...)`.
 * - Mọi modal CoreUI (`CModal`/`CModalBase`) dùng chung class `.modal.show.d-block`, không unmount khi đóng
 *   (chỉ ẩn bằng CSS) — luôn lọc `:visible` (pattern đã dùng ở Dashboard/Watchlist) rồi phân biệt bằng tiêu đề
 *   (`hasText`).
 * - Chỉ 1 trong 4 tab được mount tại 1 thời điểm (`v-else-if`) nên không lo đụng độ locator giữa các tab, kể
 *   cả khi 2 tab dùng chung tên modal (VD "Xem giao dịch" xuất hiện cả ở tab Tài sản lẫn tab Nhật ký giao dịch,
 *   nhưng là 2 component/modal độc lập, không bao giờ cùng tồn tại trong DOM).
 */
export class TradingLogPage extends BasePage {
  // ================= Khung/shell dùng chung =================
  readonly mainTabList: Locator;
  readonly anyOpenModal: Locator;

  constructor(page: Page) {
    super(page);
    // QUAN TRỌNG: KHÔNG dùng `.nav.nav-tabs` không scope — `TheHeaderDropdownNotify.vue` (dropdown chuông
    // thông báo trên header, dùng chung MỌI trang) cũng render sẵn 1 `<ul class="... nav nav-tabs ...">` ẩn
    // trong DOM (chỉ hiện khi mở dropdown), đứng TRƯỚC nội dung trang trong cây DOM → `.first()` không scope
    // sẽ luôn khớp nhầm phần tử ẩn này thay vì thanh tab thật của trang (đã xác nhận qua chạy thật, timeout
    // "resolved to hidden" liên tục). Luôn scope trong `.tradingLog-component` (class root của `index.vue`).
    this.mainTabList = page.locator('.tradingLog-component .nav.nav-tabs').first();
    this.anyOpenModal = page.locator('.modal.show.d-block:visible');
  }

  /** `tabQuery` map đúng giá trị query duy nhất được `index.vue` (mounted) hỗ trợ deep-link:
   * `?tab=nhat-ky-giao-dich` → mở thẳng tab "Nhật ký giao dịch" (active_tab = 1). Không có query nào khác
   * được xử lý cho 3 tab còn lại (đọc từ code, không phải đoán). Kiểu tham số để `string` (thay vì literal
   * union) để tương thích chữ ký `goto(path: string, ...)` của `BasePage` khi override. */
  async goto(tabQuery?: string) {
    // KHÔNG chờ 'networkidle' — trang này có polling/socket nền liên tục (giá realtime, EOD...) nên
    // 'networkidle' không bao giờ resolve trong timeout mặc định (đã xác nhận qua chạy thật, cùng lý do đã
    // ghi chú ở watchlist.spec.ts). Chờ đúng phần tử chắc chắn xuất hiện khi trang tải xong: thanh 4 tab chính.
    await super.goto(tabQuery ? `/nhat-ky-giao-dich?tab=${tabQuery}` : '/nhat-ky-giao-dich', { waitUntil: 'domcontentloaded' });
    await this.mainTabList.waitFor({ state: 'visible' });
  }

  /** Tab chính: "Tài sản" | "Nhật ký giao dịch" | "Quản lý danh mục" | "Phân bổ vốn". */
  mainTab(name: string): Locator {
    return this.mainTabList.getByRole('link', { name, exact: true });
  }

  async gotoMainTab(name: string) {
    await this.mainTab(name).click();
  }

  /** Modal đang mở (bất kỳ tab nào), lọc theo text xuất hiện trong tiêu đề/nội dung. */
  modal(titleText: string): Locator {
    return this.anyOpenModal.filter({ hasText: titleText });
  }

  get modalCloseButton(): Locator {
    // CModalBase dùng icon "x" tự vẽ (không có accessible name); CModal thường dùng nút "Close"/"Hủy"/"Đóng".
    return this.anyOpenModal.locator('.icon-close, button.close');
  }

  // ================= Tab "Tài sản" (estate.vue) =================
  get assetCategoryFilter(): Locator {
    // MultiSelectBox (vue-multiselect) — combobox với textbox tìm kiếm bên trong.
    return this.page.getByRole('combobox').filter({ hasText: 'Nhấn để chọn' }).first();
  }

  /** Vùng thật sự cần click để MỞ dropdown vue-multiselect (`.multiselect__tags`) — click trực tiếp vào role
   * combobox tổng đôi khi không trigger đúng handler mở dropdown của thư viện (`multiSelectBox.vue` bọc trong
   * `.multi-select-box`). */
  get assetCategoryFilterToggle(): Locator {
    return this.page.locator('.multi-select-box .multiselect__tags').first();
  }

  get assetOverviewText(): Locator {
    return this.page.getByText('Tổng giá trị danh mục ban đầu:', { exact: false });
  }

  get assetTypeSelect(): Locator {
    // Dropdown "Cổ phiếu"/"Ngành".
    return this.page.locator('select').filter({ has: this.page.locator('option', { hasText: 'Cổ phiếu' }) });
  }

  get assetValueTypeSelect(): Locator {
    // Dropdown "Giá vốn DM"/"GT thị trường".
    return this.page.locator('select').filter({ has: this.page.locator('option', { hasText: 'Giá vốn DM' }) });
  }

  get assetCashCheckbox(): Locator {
    // Markup thật: `<span><input type="checkbox" v-model="record_money" /> Tiền mặt</span>` — checkbox là CON
    // (không phải sibling) của `<span>` mà `getByText(exact)` khớp tới.
    return this.page.getByText('Tiền mặt', { exact: true }).locator('input[type="checkbox"]');
  }

  /** Tab "Tháng"/"Quý" của khối "Hiệu suất danh mục" (nav-link tự viết, không có href). */
  assetPerformancePeriodTab(label: 'Tháng' | 'Quý'): Locator {
    return this.page.locator('.tradingLog-component .nav-tabs .nav-link', { hasText: label });
  }

  get assetExportExcelButton(): Locator {
    return this.page.getByRole('button', { name: 'Xuất File Excel' });
  }

  get assetTable(): Locator {
    return this.page.getByRole('table').filter({ has: this.page.getByRole('columnheader', { name: 'KL tồn' }) });
  }

  /** Dòng header 1 danh mục trong bảng "Thống kê lãi lỗ" (VD "Danh mục: Lướt Sóng ..."). */
  assetCategoryHeaderRow(categoryName: string): Locator {
    return this.assetTable.getByRole('row', { name: new RegExp(`^Danh mục: ${categoryName}\\b`) });
  }

  /** Icon "Sửa vốn ban đầu" cạnh tên danh mục — mở modal "Sửa danh mục" (thực chất chỉ sửa Vốn ban đầu). */
  assetEditCategoryIcon(categoryName: string): Locator {
    return this.assetCategoryHeaderRow(categoryName).locator('img, svg').first();
  }

  /** Link mã CK trong 1 dòng giao dịch (VD "1. BID*") — QUAN TRỌNG: click vào chính link/ô này KHÔNG mở modal
   * "Xem giao dịch" — ô đầu tiên của dòng có `@click="showPopupChartTA($event, ...)"` riêng kèm
   * `e.stopPropagation()` (xác nhận qua đọc `estate.vue` dòng ~479-489), chặn không cho sự kiện click nổi lên
   * `<tr @click="showPopup(item)">` của cả dòng — nên click vào mã CK thay vào đó mở modal BIỂU ĐỒ/CHI TIẾT MÃ
   * CK toàn site (`store.state.isShowModalTradingChart`), một tính năng HOÀN TOÀN KHÁC. Dùng locator này khi
   * cố ý muốn test hành vi mở biểu đồ; dùng `assetTransactionRowOtherCell` khi muốn mở "Xem giao dịch". */
  assetStockLink(mack: string): Locator {
    return this.assetTable.getByRole('link', { name: new RegExp(`^\\d+\\.\\s*${mack}\\*?$`) });
  }

  /** 1 dòng giao dịch bất kỳ trong bảng (không phải dòng tiêu đề danh mục) — dùng regex số thứ tự đầu dòng để
   * phân biệt (VD "1. BID*"). */
  get assetFirstTransactionRow(): Locator {
    return this.assetTable.getByRole('row', { name: /^\d+\.\s*[A-Z]{3}/ });
  }

  /** Ô "Ngành" của 1 dòng giao dịch — KHÔNG có handler `@click.stop` riêng (khác ô Mã CK/KL tồn), click vào
   * đây sẽ nổi bọt lên `<tr>` và mở đúng modal "Xem giao dịch". */
  get assetTransactionRowNganhCell(): Locator {
    return this.assetFirstTransactionRow.first().getByRole('cell').nth(1);
  }

  get assetEditCategoryModal(): Locator {
    return this.modal('Sửa danh mục');
  }

  get assetViewTransactionModal(): Locator {
    return this.modal('Xem giao dịch');
  }

  /** Modal biểu đồ/chi tiết mã CK dùng chung toàn site (`store.state.isShowModalTradingChart`, khai báo ở
   * `TheContainer.vue`) — mở khi click link mã CK trong bảng Tài sản (xem ghi chú ở `assetStockLink`). VẪN LÀ
   * CoreUI `CModal` (`.modal.show.d-block`), chỉ ẩn header/footer mặc định (class `modal-hide-header-footer`).
   * KHÔNG dùng text "Tải lại Biểu đồ" để nhận diện — phần biểu đồ nến (`TradingChart`) render trong 1
   * `<iframe>` (`blob:` URL) TÁCH BIỆT khỏi document chính, `page.getByText()`/`hasText` không truy cập được
   * nội dung bên trong iframe đó. Dùng text "Watchlist" (nút trong panel `TabInfo`, nằm ngoài iframe) để nhận
   * diện thay thế — dùng "Hồ sơ" (heading cố định trong panel `TabInfo`) thay vì "Watchlist" vì nút
   * "Watchlist" click ra 1 modal chọn watchlist CHỒNG lên (cũng chứa chữ "Watchlist"), gây strict-mode
   * violation nếu lọc theo "Watchlist". */
  get stockChartModal(): Locator {
    return this.anyOpenModal.filter({ hasText: 'Hồ sơ' });
  }

  get assetQuickAddModal(): Locator {
    // CModal title động: "Giao dịch Mua"/"Giao dịch Bán" (form_add.type).
    // Không neo `^` — tiêu đề "Giao dịch Mua"/"Giao dịch Bán" không chắc luôn là ký tự ĐẦU TIÊN trong toàn bộ
    // innerText của modal (có thể có text ẩn/icon đứng trước trong DOM).
    return this.anyOpenModal.filter({ hasText: /Giao dịch (Mua|Bán)/ });
  }

  // ================= Tab "Nhật ký giao dịch" (tabTradingHistory.vue) =================
  /** Sub-tab "Lịch sử giao dịch" | "Thống kê phân tích" (nav-link tự viết, không có href). */
  historySubTab(label: 'Lịch sử giao dịch' | 'Thống kê phân tích'): Locator {
    return this.page.locator('.tradingLog-component .nav-tabs .nav-link', { hasText: label });
  }

  get filterTransactionButton(): Locator {
    return this.page.getByRole('button', { name: 'Lọc giao dịch' });
  }

  get addTransactionButton(): Locator {
    return this.page.getByRole('button', { name: 'Thêm giao dịch' });
  }

  get historyExportExcelButton(): Locator {
    return this.page.getByRole('button', { name: 'Xuất File Excel' });
  }

  get historyTable(): Locator {
    // LƯU Ý: class `.trading-log`/`.table-wrapper` chỉ thuộc `MultiAddTransactionForm.vue` (bảng "Nhập hàng
    // loạt" trong modal Thêm giao dịch) — bảng "Lịch sử giao dịch" thật dùng class riêng
    // `.table-trading-history-body` (virtual-scroll-list, xác nhận qua đọc `tradingHistory.vue`).
    return this.page.locator('.table-trading-history-body');
  }

  /** Dòng tiêu đề 1 danh mục trong bảng lịch sử GD (VD "Danh mục: NKGD - V70 ..."), click để mở/đóng collapse.
   * QUAN TRỌNG: PHẢI dùng `historyRow()` (scope `.item-table-trading-history-wrapper`) chứ không phải
   * `page.getByText()` trần — modal "Lọc giao dịch" (`tradingHistory.vue` dòng ~294) có field label
   * `<div class="flex-1">Danh mục:</div>` TRÙNG PATTERN, luôn tồn tại ẩn trong DOM (CModal không unmount) và
   * đứng TRƯỚC bảng trong document order → `page.getByText(/^Danh mục:/).first()` sẽ khớp NHẦM field label ẩn
   * đó thay vì dòng danh mục thật đang hiển thị (đã xác nhận qua chạy thật, lỗi "element is not visible").
   * Regex bắt đầu bằng `^\s*` (không phải `^`) vì `textContent()` thật của dòng có 1 khoảng trắng đứng đầu
   * (text node trống giữa các `<div>` con) — neo `^` chặt sẽ không khớp gì cả (đã xác nhận qua chạy thật). */
  historyCategoryRow(categoryName: string): Locator {
    return this.historyRow(new RegExp(`^\\s*Danh mục: ${categoryName}\\b`)).first();
  }

  /** 1 dòng giao dịch (hoặc dòng tiêu đề danh mục) trong bảng lịch sử GD — QUAN TRỌNG: bảng KHÔNG dùng
   * `<table>/<tr>` thật (virtual-scroll-list dạng div) — mọi dòng đều có chung class
   * `.item-table-trading-history-wrapper` (xác nhận qua đọc `itemTableTradingHistory.vue`), tuyệt đối không
   * dùng locator CSS `tr`/`td` cho bảng này. */
  historyRow(matchText: string | RegExp): Locator {
    return this.page.locator('.item-table-trading-history-wrapper').filter({ hasText: matchText });
  }

  /** Icon "..." (3 chấm dọc, `CIcon name="cilOptions"` class `.btn-action`) trên 1 dòng giao dịch — mở dropdown
   * Sửa/Xóa. `index` (0-based) để phân biệt nhiều dòng cùng mã trong cùng danh mục. */
  historyRowOptionsIcon(mack: string, index = 0): Locator {
    return this.historyRow(mack).locator('.btn-action').nth(index);
  }

  get historyFilterModal(): Locator {
    return this.modal('Lọc giao dịch');
  }

  get filterApplyButton(): Locator {
    return this.historyFilterModal.getByRole('button', { name: 'Lọc', exact: true });
  }

  get filterCloseButton(): Locator {
    return this.historyFilterModal.getByRole('button', { name: 'Đóng' });
  }

  /** Nhãn field trong modal Lọc giao dịch LUÔN có dấu `:` ở cuối (VD "Mã CK:", "Danh mục:", "Loại lệnh:") —
   * xác nhận qua đọc `tradingHistory.vue` dòng ~234-331, không dùng `{ exact: true }` với text KHÔNG có dấu
   * `:` (sẽ không khớp). */
  filterFieldLabel(label: string): Locator {
    return this.historyFilterModal.getByText(`${label}:`, { exact: true });
  }

  /** Vùng cần click để MỞ dropdown vue-multiselect (Mã CK/Danh mục) trong modal Lọc giao dịch — click trực
   * tiếp vào combobox tổng đôi khi không trigger đúng handler mở, giống `assetCategoryFilterToggle`.
   * `label`: "Mã CK" hoặc "Danh mục" (không có dấu `:`). */
  filterMultiSelectToggle(label: string): Locator {
    return this.filterFieldLabel(label).locator('xpath=following::div[contains(@class,"multiselect__tags")][1]');
  }

  /** Modal "Thêm giao dịch" (dùng `CModalBase`, size xl, 2 tab con "Giao dịch"/"Cổ tức & quyền"). */
  get addModal(): Locator {
    return this.modal('Thêm giao dịch');
  }

  addModalTab(label: 'Giao dịch' | 'Cổ tức & quyền'): Locator {
    return this.addModal.locator('.nav-link', { hasText: label });
  }

  addModalEntryModeTab(label: 'Nhập đơn lẻ' | 'Nhập hàng loạt'): Locator {
    return this.addModal.locator('.nav-link', { hasText: label });
  }

  /** Label text ở chế độ "Nhập đơn lẻ" (VD "Mã CK", "Khối lượng"...) BỊ TRÙNG với tên cột trong bảng
   * `MultiAddTransactionForm` (chế độ "Nhập hàng loạt") — bảng đó luôn tồn tại trong DOM, chỉ ẩn bằng
   * `v-show` khi không active, nên đứng TRƯỚC field thật trong document order và làm sai lệch mọi xpath
   * `following::` nếu không lọc visibility trước. Luôn `.and(page.locator(':visible'))` trên phần TEXT trước
   * khi tìm `following::`. */
  private visibleText(container: Locator, text: string, exact = true): Locator {
    return container.getByText(text, { exact }).and(this.page.locator(':visible'));
  }

  get addModalTypeSelect(): Locator {
    return this.visibleText(this.addModal, 'Loại giao dịch').locator('xpath=following::select[1]').first();
  }

  get addModalCategorySelect(): Locator {
    return this.visibleText(this.addModal, 'Danh mục').locator('xpath=following::select[1]').first();
  }

  get addModalDateInput(): Locator {
    return this.addModal.locator('input[type="date"]:visible').first();
  }

  get addModalStockcodeInput(): Locator {
    return this.addModal.locator('.btn-search-stockcode input:visible').first();
  }

  get addModalVolumeInput(): Locator {
    return this.visibleText(this.addModal, 'Khối lượng').locator('xpath=following::input[1]').first();
  }

  get addModalPriceInput(): Locator {
    return this.visibleText(this.addModal, 'Giá thực hiện', false).locator('xpath=following::input[1]').first();
  }

  get addModalFeeInput(): Locator {
    return this.visibleText(this.addModal, 'Phí (%)').locator('xpath=following::input[1]').first();
  }

  get addModalNoteTextarea(): Locator {
    // Field "Ghi chú" chế độ đơn lẻ dùng `<CTextarea label="Ghi chú">` (label, KHÔNG phải placeholder) —
    // getByPlaceholder chỉ khớp placeholder="Ghi chú..." của cột Ghi chú trong bảng "Nhập hàng loạt" (ẩn).
    return this.addModal.getByLabel('Ghi chú', { exact: true }).and(this.page.locator(':visible'));
  }

  addModalTagButton(label: 'Thiết lập' | 'Sai lầm'): Locator {
    return this.visibleText(this.addModal, label).locator('xpath=following::button[1]').first();
  }

  get addModalSaveButton(): Locator {
    return this.addModal.getByRole('button', { name: 'Lưu' });
  }

  get addModalCancelButton(): Locator {
    return this.addModal.getByRole('button', { name: 'Hủy' });
  }

  /** Modal "Nhập hàng loạt" — component `MultiAddTransactionForm`. Cột "Mã CK" là cột thứ 5 (sau #, Loại GD,
   * Danh mục, Ngày GD) và dùng `DropdownSearch` (class `.btn-search-stockcode`) — KHÔNG dùng
   * `.locator('input').first()` (sẽ trúng ô input Ngày giao dịch đứng trước). */
  get multiAddFirstRowMackInput(): Locator {
    return this.addModal.locator('.trading-log tbody tr').first().locator('.btn-search-stockcode input');
  }

  get multiAddAddRowLink(): Locator {
    return this.addModal.getByText('+ Thêm giao dịch khác');
  }

  get multiAddDeleteRowIcon(): Locator {
    return this.addModal.locator('.trading-log tbody tr').first().locator('svg, .c-icon').last();
  }

  /** Popup chọn thẻ tags (setup/mistake) — `PopupSelectTag`, mở CHỒNG lên modal Thêm/Sửa giao dịch (2 modal
   * `:visible` cùng lúc) — PHẢI dùng class CSS riêng `.custom-modal-select-tag` (gắn ở `index.vue` cho 4 CModal
   * bọc `PopupSelectTag`) để phân biệt, không dùng `hasText`/`has` chung chung (dễ khớp nhầm modal bên dưới). */
  get tagPopup(): Locator {
    // Class `custom-modal-select-tag` (truyền qua prop `class` cho CModal) không gắn trực tiếp lên chính thẻ
    // `.modal` (xác nhận qua chạy thật — DOM thật không khớp selector này dù popup đã hiển thị đúng). Nhận
    // diện ổn định hơn qua text "Tín hiệu kỹ thuật" — tên tab đầu tiên riêng của `PopupSelectTag.vue`, không
    // trùng với modal Thêm/Sửa giao dịch bên dưới.
    return this.anyOpenModal.filter({ hasText: 'Tín hiệu kỹ thuật' });
  }

  tagPopupTab(label: 'Tín hiệu kỹ thuật' | 'Chỉ tiêu tài chính' | 'Sai lầm'): Locator {
    return this.tagPopup.locator('.nav-link', { hasText: label });
  }

  get tagPopupSaveButton(): Locator {
    return this.tagPopup.getByRole('button', { name: 'Lưu' });
  }

  get tagPopupCancelButton(): Locator {
    return this.tagPopup.getByRole('button', { name: 'Hủy' });
  }

  /** Modal "Sửa giao dịch" (CModal trong index.vue — KHÁC với `UpdateNoteTradingLogModal.vue` dùng ở panel
   * Ghi chú Dashboard, dù 2 file có nhiều đoạn code tương tự nhau). */
  get editModal(): Locator {
    return this.modal('Sửa giao dịch');
  }

  get editModalSaveButton(): Locator {
    return this.page.locator('#editTradingLog');
  }

  get editModalNoteTextarea(): Locator {
    return this.editModal.getByText('Ghi chú', { exact: true }).locator('xpath=following::textarea[1]').first();
  }

  /** Modal "Xem giao dịch" (read-only, bản của index.vue dùng cho tab Nhật ký giao dịch). */
  get viewModal(): Locator {
    return this.modal('Xem giao dịch');
  }

  get viewModalCloseButton(): Locator {
    return this.viewModal.getByRole('button', { name: 'Đóng' });
  }

  /** Modal xác nhận xóa giao dịch — title "Xóa dữ liệu", nội dung "Bạn có chắc chắn không?". */
  get deleteTransactionModal(): Locator {
    return this.modal('Xóa dữ liệu').filter({ hasText: 'Bạn có chắc chắn không?' });
  }

  get deleteTransactionConfirmButton(): Locator {
    return this.page.locator('#delteTradingLog');
  }

  /** Modal "Thông báo" tự động xuất hiện khi hệ thống phát hiện sự kiện cổ tức/quyền trong danh mục hôm nay
   * ngay sau khi thêm 1 giao dịch mới (computed `stock_events_recorded`, khó tái tạo chủ động — xem ghi chú
   * trong testcases/nhat-ky-giao-dich-nhat-ky.md). */
  get dividendDetectedModal(): Locator {
    return this.modal('Thông báo').filter({ hasText: 'ghi nhận các sự kiện' });
  }

  // ================= Tab "Quản lý danh mục" (ManageCategory.vue) =================
  /** Sub-tab "Danh mục hiện có" | "Danh mục đã xóa" (nav-link tự viết, không có href). */
  categorySubTab(label: 'Danh mục hiện có' | 'Danh mục đã xóa'): Locator {
    return this.page.locator('.tradingLog-component .nav-tabs .nav-link', { hasText: label });
  }

  get addCategoryButton(): Locator {
    return this.page.getByRole('button', { name: 'Thêm danh mục' });
  }

  get categoryTable(): Locator {
    return this.page.getByRole('table');
  }

  categoryRow(name: string): Locator {
    return this.categoryTable.getByRole('row', { name: new RegExp(`^${name}\\b`) });
  }

  categoryEditIcon(name: string): Locator {
    return this.categoryRow(name).locator('img, svg').first();
  }

  categoryDeleteIcon(name: string): Locator {
    return this.categoryRow(name).locator('img, svg').last();
  }

  /** Chỉ dùng ở tab "Danh mục đã xóa": icon Khôi phục (đầu) / Xóa vĩnh viễn (cuối). */
  categoryRestoreIcon(name: string): Locator {
    return this.categoryRow(name).locator('img, svg').first();
  }

  categoryForceDeleteIcon(name: string): Locator {
    return this.categoryRow(name).locator('img, svg').last();
  }

  /** Modal "Thêm mới danh mục" / "Sửa danh mục" (cùng cấu trúc, khác tiêu đề). */
  get categoryAddModal(): Locator {
    return this.modal('Thêm mới danh mục');
  }

  get categoryEditModal(): Locator {
    return this.modal('Cập nhật') /* fallback nếu tiêu đề khác */.or(this.modal('Sửa danh mục'));
  }

  get categoryNameInput(): Locator {
    return this.anyOpenModal.getByRole('textbox').first();
  }

  get categoryInitialCapitalInput(): Locator {
    return this.anyOpenModal.locator('input').nth(1);
  }

  get categorySaveButton(): Locator {
    // "Thêm mới"/"Sửa" dùng 2 CModal riêng biệt cùng tồn tại trong DOM (không unmount khi ẩn) — luôn lọc
    // `:visible` để chỉ khớp đúng 1 nút của modal đang thật sự mở, tránh strict-mode violation (2 phần tử).
    return this.page.locator('#addManageCategory:visible, #saveEditCategory:visible');
  }

  get categoryCancelButton(): Locator {
    return this.anyOpenModal.getByRole('button', { name: 'Hủy' });
  }

  get categorySoftDeleteModal(): Locator {
    return this.modal('thùng rác');
  }

  get categorySoftDeleteConfirmButton(): Locator {
    // BUG nguồn (ghi nhận trong testcases/nhat-ky-giao-dich-danh-muc.md): id="deleteCategory" bị dùng TRÙNG cho
    // cả nút "Di chuyển vào thùng rác" (soft-delete) lẫn nút "Xóa vĩnh viễn" (force-delete) trong
    // `ManageCategory.vue` — CSS id selector đơn thuần trả về 2 phần tử (strict-mode violation), phải scope
    // theo đúng modal + text để phân biệt, không dùng `#deleteCategory` một mình.
    return this.categorySoftDeleteModal.getByRole('button', { name: 'Di chuyển vào thùng rác' });
  }

  get categoryForceDeleteModal(): Locator {
    return this.modal('vĩnh viễn');
  }

  get categoryForceDeleteConfirmButton(): Locator {
    return this.categoryForceDeleteModal.getByRole('button', { name: 'Xóa vĩnh viễn' });
  }

  // ================= Tab "Phân bổ vốn" (CapitalAllocation.vue) =================
  get allocationCategorySelect(): Locator {
    return this.page.getByText('Danh mục', { exact: true }).locator('xpath=following::select[1]').first();
  }

  get allocationInitialCapitalInput(): Locator {
    return this.page.getByText('Vốn ban đầu', { exact: true }).locator('xpath=following::input[1]').first();
  }

  get allocationRecordProfitLossCheckbox(): Locator {
    return this.page.getByText('Ghi nhận lời lỗ của danh mục vào vốn khả dụng').locator('xpath=following::input[@type="checkbox"][1]').first();
  }

  get allocationMaxCutlossPercentInput(): Locator {
    return this.page.getByText('% Cắt lỗ tối đa trên tổng tài sản', { exact: false }).locator('xpath=following::input[1]').first();
  }

  get allocationDealCutlossPercentInput(): Locator {
    return this.page.getByText('% Cắt lỗ trên deal tiếp theo', { exact: false }).locator('xpath=following::input[1]').first();
  }

  get allocationMaxCutlossValue(): Locator {
    return this.page.getByText('Giá trị cắt lỗ tối đa trên tổng tài sản', { exact: false }).locator('xpath=following::input[1]').first();
  }

  get allocationResultValue(): Locator {
    return this.page.getByText('Phân bổ vốn cho deal tiếp theo', { exact: false }).locator('xpath=following::input[1]').first();
  }

  get allocationCurrentStatusBlock(): Locator {
    return this.page.getByText('Trạng thái danh mục hiện tại').locator('xpath=ancestor::*[self::div][1]');
  }

  get allocationNextDealBlock(): Locator {
    return this.page.getByText('Deal tiếp theo', { exact: true }).locator('xpath=ancestor::*[self::div][1]');
  }

  get allocationStatusAfterDealBlock(): Locator {
    return this.page.getByText('Trạng thái danh mục khi có deal tiếp theo').locator('xpath=ancestor::*[self::div][1]');
  }

  /** 3 icon toggle collapse (mũi tên lên/xuống) trong khối Deal tiếp theo / Trạng thái sau deal. */
  allocationCollapseToggle(label: string): Locator {
    return this.page.getByText(label, { exact: false }).first();
  }
}
