import { Page, Locator, FrameLocator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Trang "Phân tích kỹ thuật" (`/phan-tich-ky-thuat`, route con của `/`, `meta.requiresUser: true`) — component
 * `stocks/src/views/multiLayoutChart/index.vue` render `reactMultiLayoutChart.js` (React, dùng thư viện
 * `flexlayout-react` để chia layout đa biểu đồ TradingView Charting Library — `js_ver_28_3/charting_library`).
 *
 * 1 Page Object DÙNG CHUNG cho cả 3 phạm vi (giống pattern `FaAnalysisPage`/`TradingLogPage`), locator nhóm
 * theo comment: (1) khung/shell — quản lý tab biểu đồ + menu dọc phải, (2) khu vực biểu đồ (toolbar TradingView,
 * nằm TRONG `<iframe>` nên phải dùng `page.frameLocator()`), (3) panel "Thông tin" (2 nhánh Stockcode/Indexcode).
 *
 * ⚠️ GHI CHÚ AN TOÀN DỮ LIỆU QUAN TRỌNG (đọc trước khi viết thêm test dùng `addChartTab()`/`deleteLastChartTab()`):
 * - Layout đa biểu đồ (tab nào đang mở, mã/interval từng tab, chỉ báo/annotation đã vẽ) được lưu qua
 *   `store.commit("saveSetting", ...)` → hàng đợi debounce phía component (3000ms, xem
 *   `TIME_LIMIT_DEBOUNCE_SAVE_LAYOUT` trong `reactMultiLayoutChart.js`) RỒI MỚI gửi API lên server (dùng CHUNG
 *   cho tài khoản test, ảnh hưởng các lần chạy test SAU + các file test khác dùng cùng tài khoản). Đã xác nhận
 *   qua automation thật: nếu đóng browser/kết thúc test ngay sau khi thêm/xóa tab mà KHÔNG đợi debounce này
 *   flush, thay đổi KHÔNG được lưu server-side — lần load sau quay lại trạng thái cũ (gây rác tồn đọng khó phát
 *   hiện vì trông như đã dọn xong ở lần chạy đó). MỌI test thêm/xóa tab PHẢI gọi `waitForLayoutSaved()` trước khi
 *   test kết thúc/đóng context.
 * - Test chỉ được thao tác (đổi mã, xóa) trên tab do CHÍNH NÓ thêm — `addChartTab()` luôn thêm tab MỚI vào CUỐI
 *   tabset đang active (copy mã/interval của tab cuối cùng hiện có), nên `lastChartTab` (dùng `.last()`, không
 *   phải `.nth(i)` mù) luôn trỏ đúng tab vừa thêm ngay sau khi gọi `addChartTab()`. KHÔNG xóa/đổi mã tab có sẵn
 *   từ trước khi test bắt đầu.
 * - Modal "Xóa đồ thị" có checkbox "Không hỏi lại hôm nay" (lưu `localStorage.doNotRemindToday` + Vuex
 *   `saveSetting`, ảnh hưởng MỌI lần xóa tab sau đó trong ngày, kể cả ở lần chạy test/phiên khác dùng chung tài
 *   khoản) — `deleteLastChartTab()` KHÔNG BAO GIỜ tick checkbox này.
 */
export class TechnicalChartPage extends BasePage {
  // ================= Khung/shell: quản lý tab biểu đồ =================
  readonly chartTabButtons: Locator;
  readonly addChartTabBtn: Locator;
  readonly deleteConfirmModal: Locator;
  readonly deleteConfirmCheckbox: Locator;
  readonly deleteConfirmCloseBtn: Locator;
  readonly deleteConfirmDeleteBtn: Locator;
  readonly freeLimitToast: Locator;

  constructor(page: Page) {
    super(page);
    // `flexlayout-react` render mỗi tab biểu đồ (và cả các tab border phải) là `.flexlayout__tab_button`, nhưng
    // border tab dùng class RIÊNG `.flexlayout__border_button` (xem `borderTab()`) — 2 tập hợp KHÔNG trùng nhau
    // nên `chartTabButtons` chỉ khớp đúng dãy tab biểu đồ phía trên.
    this.chartTabButtons = page.locator('.flexlayout__tab_button');
    // Có thể có NHIỀU nút "+" nếu người dùng đã chia màn hình thành nhiều khung (mỗi tabset 1 nút riêng) — mặc
    // định dùng nút của tabset ĐẦU TIÊN (`.first()`), đúng layout mặc định (1 khung duy nhất) của mọi test mới.
    this.addChartTabBtn = page.locator('.btn-add-chart').first();
    // Modal "Xóa đồ thị" (`index.vue`) — KHÔNG dùng class `modal-padding` (dùng chung với nhiều modal CoreUI
    // khác luôn tồn tại ẩn trong DOM toàn site, gây strict-mode violation đã xác nhận qua lỗi thật khi viết
    // test: `.modal-padding` khớp 5 phần tử). Cũng KHÔNG lọc theo `.modal-padding` + `hasText` vì CoreUI
    // `CModal` giữ lại 1 bản sao "placeholder" cao 0px tại đúng vị trí template gốc (`.ta-chart-layout`) trong
    // khi nội dung THẬT được portal ra vị trí khác trong DOM khi hiện — `hasText` vẫn khớp bản 0px này (đã xác
    // nhận qua debug: `getBoundingClientRect().height === 0`). Dùng `getByRole('dialog')` + lọc theo heading
    // giống pattern đã dùng ở `FaAnalysisPage` — Playwright resolve đúng bản dialog thật đang hiển thị.
    // Cập nhật 10/11/2026 (preprod): modal đổi tên "Xóa đồ thị" → "Đóng đồ thị", nút "Đóng"/"Xóa" → "Huỷ"/"Xác nhận".
    this.deleteConfirmModal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Đóng đồ thị' }) });
    this.deleteConfirmCheckbox = this.deleteConfirmModal.getByLabel('Không hỏi lại hôm nay');
    this.deleteConfirmCloseBtn = this.deleteConfirmModal.getByRole('button', { name: 'Huỷ' });
    this.deleteConfirmDeleteBtn = this.deleteConfirmModal.getByRole('button', { name: 'Xác nhận' });
    // Toast giới hạn số tab/khung hình (`showToast()` trong `index.vue` → `this.$toast.info(string)`).
    this.freeLimitToast = page.locator('.Vue-Toastification__toast-body');
  }

  async goto() {
    await super.goto('/phan-tich-ky-thuat', { waitUntil: 'domcontentloaded' });
    await this.chartTabButtons.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async chartTabCount(): Promise<number> {
    return this.chartTabButtons.count();
  }

  async chartTabTexts(): Promise<string[]> {
    return this.chartTabButtons.allTextContents();
  }

  /** Tab vừa thêm gần nhất luôn ở CUỐI danh sách (xem ghi chú class-level) — không dùng `.nth(i)` mù giữa các
   * tab trùng tên. */
  get lastChartTab(): Locator {
    return this.chartTabButtons.last();
  }

  get activeChartTab(): Locator {
    return this.page.locator('.flexlayout__tab_button--selected');
  }

  /** Click 1 tab biểu đồ AN TOÀN kể cả khi tab bị `flexlayout-react` clip ra ngoài vùng nhìn thấy. Xác nhận qua
   * debug DOM thật: dãy tab dùng `overflow-x: clip` trên `.flexlayout__tabset_tabbar_inner` (KHÔNG phải
   * `auto`/`scroll`) — đây KHÔNG phải native scroll container nên `scrollLeft`/`scrollIntoViewIfNeeded()` của
   * Playwright không có tác dụng; khi tab cuối (vừa thêm) đang active, các tab đầu dãy có thể có
   * `getBoundingClientRect().x` ÂM (bị clip), khiến `.click()` chuẩn treo tới hết timeout với lỗi "element is
   * outside of the viewport". Đã xác nhận qua automation thật: thư viện lắng nghe `mousedown`/`mouseup` để đổi
   * tab active (KHÔNG phải `click` — `dispatchEvent('click')` đơn thuần KHÔNG đổi được tab), và vẫn hoạt động
   * đúng dù toạ độ tab đang bị clip âm vì `dispatchEvent` bắn thẳng sự kiện DOM, bỏ qua mọi kiểm tra
   * actionability/visibility của Playwright — cùng pattern đã dùng cho submenu "NKGD ▾". */
  async clickChartTab(tab: Locator) {
    await tab.dispatchEvent('mousedown', { button: 0 });
    await this.page.waitForTimeout(150);
    await tab.dispatchEvent('mouseup', { button: 0 });
  }

  closeIconOf(tab: Locator): Locator {
    return tab.locator('.flexlayout__tab_button_trailing');
  }

  async addChartTab() {
    const before = await this.chartTabCount();
    await this.addChartTabBtn.click();
    await expect(this.chartTabButtons).toHaveCount(before + 1, { timeout: 10000 });
  }

  /** Đóng tab CUỐI CÙNG (quy ước: luôn là tab test tự thêm gần nhất) qua modal xác nhận "Xóa đồ thị".
   * `confirm=true` → bấm "Xóa" (checkbox "Không hỏi lại hôm nay" KHÔNG bao giờ bị tick). `confirm=false` → bấm
   * "Đóng" để hủy (tab không bị xóa). */
  async deleteLastChartTab(confirm: boolean = true) {
    await this.deleteChartTab(this.lastChartTab, confirm);
  }

  /** Cập nhật 10/11/2026 (preprod, reactMultiLayoutChart.js FLEX_LAYOUT_DELETE_TAB): modal "Đóng đồ thị" CHỈ hiện khi thẻ có
   * nội dung người dùng thêm (chỉ báo/hình vẽ) hoặc thẻ chưa hiện lần nào; thẻ trống đóng ngay không hỏi. `confirm=false`
   * bắt buộc có modal. */
  async deleteChartTab(tab: Locator, confirm: boolean = true) {
    const before = await this.chartTabCount();
    await this.closeIconOf(tab).click();
    const asked = await this.deleteConfirmModal.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
    if (!asked) {
      expect(confirm, 'Thẻ đóng ngay không hiện modal xác nhận').toBe(true);
      await expect(this.chartTabButtons).toHaveCount(before - 1, { timeout: 10000 });
      return;
    }
    await expect(this.deleteConfirmCheckbox).not.toBeChecked();
    if (confirm) {
      await this.deleteConfirmDeleteBtn.click();
      await expect(this.chartTabButtons).toHaveCount(before - 1, { timeout: 10000 });
    } else {
      await this.deleteConfirmCloseBtn.click();
      await this.deleteConfirmModal.waitFor({ state: 'hidden' });
      await expect(this.chartTabButtons).toHaveCount(before);
    }
  }

  /** Chờ debounce lưu layout (xem ghi chú an toàn dữ liệu ở đầu class) — BẮT BUỘC gọi trước khi test thêm/xóa
   * tab kết thúc, nếu không thay đổi sẽ KHÔNG được lưu server-side (đã xác nhận qua automation thật). */
  async waitForLayoutSaved() {
    await this.page.waitForTimeout(6000);
  }

  // ================= Khung/shell: menu dọc phải (border tabs) =================
  /** "AI Chart" | "Thông tin" | "Watchlist" | "Cảnh báo" | "Ghi chú" | "Cộng đồng" (+ "Chatbot" nếu tài khoản có
   * — xem ghi chú trong testcases/phan-tich-ky-thuat.md về layout đã lưu cũ chưa tự thêm tab mới này). */
  borderTab(name: string): Locator {
    return this.page.locator('.flexlayout__border_button', { hasText: name });
  }

  async gotoBorderTab(name: string) {
    await this.borderTab(name).click();
  }

  get selectedBorderTab(): Locator {
    return this.page.locator('.flexlayout__border_button--selected');
  }

  // ================= Khu vực biểu đồ (TradingView Charting Library, trong <iframe>) =================
  /** iframe của tab biểu đồ ĐANG ACTIVE — `border-active` là class Vue gắn theo `nodeIdActive` (xem
   * `ReactChartTA.vue`). Toàn bộ toolbar/canvas/drawing tool nằm TRONG iframe này, phải dùng `frameLocator`. */
  get activeChartFrame(): FrameLocator {
    return this.page.frameLocator('.border-active .TVChartContainer iframe');
  }

  /** TradingView render TOÀN BỘ header toolbar LẶP LẠI 2-3 LẦN trong cùng iframe (biến thể responsive
   * "withText"/"withoutText" tuỳ độ rộng khả dụng của toolbar). ⚠️ ĐÍNH CHÍNH quan trọng (đo lại qua automation
   * thật, khác ghi chú gốc): các bản KHÔNG hiển thị KHÔNG dùng `display:none` (`offsetParent` vẫn khác `null`,
   * `getComputedStyle().display` vẫn `flex`) mà dùng CSS `visibility: hidden` riêng — nghĩa là `.first()` đơn
   * thuần theo thứ tự DOM KHÔNG đáng tin cậy, có thể trúng đúng bản `visibility:hidden` (đã xác nhận qua lỗi
   * thật: viewport mặc định của Playwright project `chromium` (`devices['Desktop Chrome']`, 1280×720) hẹp hơn
   * viewport dùng lúc debug thủ công ban đầu (1400×900), khiến biến thể "withText" (index 0, luôn đứng đầu DOM)
   * bị ẩn bằng `visibility:hidden` — `.first()` treo tới hết timeout dù đã tăng lên 45s vì bản thân bản đó SẼ
   * KHÔNG BAO GIỜ hiển thị ở viewport hẹp, không phải vấn đề thời gian chờ). Dùng pseudo-class `:visible` của
   * Playwright (lọc đúng theo `visibility`/`display`/kích thước thật, không chỉ theo `offsetParent`) + `.first()`
   * để luôn chọn ĐÚNG bản đang thật sự hiển thị bất kể viewport. */
  get headerSymbolSearchBtn(): Locator {
    return this.activeChartFrame.locator('#header-toolbar-symbol-search:visible').first();
  }

  get headerIndicatorsBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="open-indicators-dialog"]:visible').first();
  }

  get headerSaveLoadMenuBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="save-load-menu"]:visible').first();
  }

  get headerFullscreenBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="header-toolbar-fullscreen"]:visible').first();
  }

  get headerPropertiesBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="header-toolbar-properties"]:visible').first();
  }

  /** Nút timeframe nhanh (1m/5m/15m/1h/D/2D) KHÔNG có `data-name` riêng (chỉ có class hash động) — dùng
   * `data-tooltip` (label tiếng Việt CỐ ĐỊNH: "1 phút"/"5 phút"/"15 phút"/"1 giờ"/"1 ngày"/"2 ngày") ổn định
   * hơn nhiều so với text-based (`getByText('1h')` từng khớp NHẦM 1 `<div class="value-...">` ẩn dùng để đo độ
   * rộng dropdown, không phải nút thật — xác nhận qua debug DOM). Cũng dùng `:visible` (xem ghi chú
   * `headerIndicatorsBtn`) để tránh trúng bản `visibility:hidden` ở viewport hẹp. */
  intervalButton(tooltip: '1 phút' | '5 phút' | '15 phút' | '1 giờ' | '1 ngày' | '2 ngày'): Locator {
    return this.activeChartFrame.locator(`[data-tooltip="${tooltip}"]:visible`).first();
  }

  /** Icon kiểu biểu đồ (nến/đường/vùng...) — không có `data-name` riêng, dùng `data-tooltip="Biểu đồ nến"`
   * (label mặc định khi đang ở kiểu nến, xác nhận qua DOM thật). */
  get chartStyleBtn(): Locator {
    return this.activeChartFrame.locator('[data-tooltip="Biểu đồ nến"]:visible').first();
  }

  /** Chờ iframe TradingView khởi tạo xong header toolbar ổn định — BẮT BUỘC gọi trước khi thao tác bất kỳ
   * control nào trong toolbar ngay sau `goto()`/`addChartTab()`/đổi mã, nếu không click có thể rơi vào lúc
   * widget đang re-mount (đã gặp lỗi thật: nút không "visible"/timeout dù locator đúng).
   * ⚠️ Timeout 45s (không phải 15s) cho bước chờ nút "fx" — đã xác nhận qua automation thật: `goto()` load tài
   * khoản đã có SẴN 5 tab (mỗi tab 1 iframe TradingView riêng), `addChartTab()` thêm tab thứ 6 khiến nhiều iframe
   * TradingView "nặng" cùng khởi tạo gần như đồng thời, làm chậm việc tab MỚI render xong toàn bộ header toolbar
   * (đo qua automation: `[data-name="open-indicators-dialog"]` có lúc xuất hiện trong ~2s, có lúc mất 20-30s+
   * mới xuất hiện trong DOM — biến thiên thật do tải iframe nặng + (khi chạy qua `npx playwright test`, KHÁC
   * script debug thuần) overhead ghi hình `video`/`trace` cấu hình trong `playwright.config.ts`, không phải lỗi
   * logic). 15s/30s từng KHÔNG đủ trong vài lần đo qua `npx playwright test` thật (dù script debug độc lập
   * không bật video/trace luôn thấy nhanh) — nếu vẫn timeout ở 45s tại 1 test cụ thể, ưu tiên nghi ngờ tải chậm
   * bất thường của lần chạy đó (thử chạy lại) trước khi coi là bug logic. */
  async waitForChartReady() {
    await this.activeChartFrame.locator('body').waitFor({ state: 'visible', timeout: 15000 });
    await this.headerIndicatorsBtn.waitFor({ state: 'visible', timeout: 45000 });
    await this.page.waitForTimeout(2000);
  }

  /** Dropdown "Biểu đồ ▾" TỰ VIẾT (không phải TradingView gốc, `tvWidget.createButton()` trong `ReactChartTA.vue`)
   * — chỉ hiện với tài khoản KHÔNG Free. Toggle "Ẩn/Hiện sự kiện, giao dịch cổ đông lớn" + "Ẩn/Hiện sự kiện". */
  get customBieuDoBtn(): Locator {
    return this.activeChartFrame.locator('.custom-button-wrapper', { hasText: 'Biểu đồ' });
  }

  /** Dropdown "NKGD ▾" TỰ VIẾT — toggle hiện/ẩn đánh dấu lịch sử giao dịch trên biểu đồ + submenu "Chọn danh
   * mục"/"Chọn loại giao dịch" (checkbox Mua/Bán/Cổ tức-Quyền). Chỉ hiện với tài khoản KHÔNG Free. */
  get customNkgdBtn(): Locator {
    return this.activeChartFrame.locator('.custom-button-wrapper', { hasText: 'NKGD' });
  }

  /** Nút "Tải lại Biểu đồ" TỰ VIẾT — CHỈ hiện với tài khoản có role `moderator` (`isModerator` trong
   * `ReactChartTA.vue`), gọi lại `initChart()` từ đầu. */
  get customReloadChartBtn(): Locator {
    return this.activeChartFrame.locator('.custom-button-alert', { hasText: 'Tải lại Biểu đồ' });
  }

  get customDropdownMenuItems(): Locator {
    return this.activeChartFrame.locator('.custom-dropdown-menu-item');
  }

  /** 8 nhóm icon toolbar vẽ dọc bên trái: cursors · trend-line · gann-and-fibonacci · patterns ·
   * prediction-and-measurement · geometric-shapes · annotation · font-icons (đọc `data-name` thật từ DOM). */
  drawingToolGroup(name: string): Locator {
    return this.activeChartFrame.locator(`[data-name="linetool-group-${name}"]`);
  }

  /** Trạng thái active THẬT của 1 nhóm công cụ vẽ nằm ở `aria-pressed` trên `<button>` CON bên trong wrapper
   * `[data-name="linetool-group-X"]` (KHÔNG phải class của chính wrapper — đã xác nhận qua debug DOM: wrapper
   * chỉ có class `dropdown-pbhJWNrt undefined` cố định, không đổi khi active/inactive). */
  drawingToolGroupInnerButton(name: string): Locator {
    return this.drawingToolGroup(name).locator('button').first();
  }

  async isDrawingToolGroupActive(name: string): Promise<boolean> {
    const pressed = await this.drawingToolGroupInnerButton(name).getAttribute('aria-pressed');
    return pressed === 'true';
  }

  get measureToolBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="measure"]');
  }

  get zoomToolBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="zoom"]');
  }

  get magnetToolBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="magnet-button"]');
  }

  get lockAllDrawingsBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="lockAllDrawings"]');
  }

  get hideAllDrawingsBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="hide-all"]');
  }

  get removeAllDrawingToolsBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="removeAllDrawingTools"]');
  }

  get showObjectsTreeBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="showObjectsTree"]');
  }

  get legendSourceItems(): Locator {
    return this.activeChartFrame.locator('[data-name="legend-source-item"]');
  }

  /** Preset khoảng thời gian dưới biểu đồ: 60M="5 Năm" · 12M="1 Năm" · 6M="6 Tháng" · 1M="1 Tháng" ·
   * 1W="1 Tuần" · 1D="1 Ngày" (label tuỳ biến qua `time_frames` trong `ReactChartTA.vue`). */
  dateRangeTab(key: '60M' | '12M' | '6M' | '1M' | '1W' | '1D'): Locator {
    return this.activeChartFrame.locator(`[data-name="date-range-tab-${key}"]`);
  }

  get percentageBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="percentage"]');
  }

  get logarithmBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="logarithm"]');
  }

  get autoScaleBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="auto"]');
  }

  get goToDateBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="go-to-date"]');
  }

  get timeZoneMenuBtn(): Locator {
    return this.activeChartFrame.locator('[data-name="time-zone-menu"]');
  }

  // ================= Panel "Thông tin" (Orderboard/Stockcode hoặc Orderboard/Indexcode) =================
  /** Root `<CCard class="p-2 pb-0 mb-0 border-no-radius h-100">` — DÙNG CHUNG class giữa 2 nhánh Stockcode/
   * Indexcode, chỉ mount 1 trong 2 tại 1 thời điểm nên an toàn không cần phân biệt thêm. */
  get infoPanel(): Locator {
    return this.page.locator('.card.p-2.pb-0.mb-0.border-no-radius.h-100');
  }

  /** Tab ngoài của panel: Stockcode có "Thông tin"/"Sổ lệnh"/"Cung cầu"/"Bài viết"; Indexcode chỉ có "Thông
   * tin"/"NN & TD". `:not(.mt-2)` để loại trừ `ul` bên trong (Tổng quan/NN & TD của CommonInfo, xem
   * `infoInnerTab()`) — 2 `ul` dùng CHUNG base class, chỉ khác `.mt-2`. */
  get infoOuterTabList(): Locator {
    return this.infoPanel.locator('ul.custom-padding-tab-item.nav.nav-tabs.nav-justified:not(.mt-2)');
  }

  infoOuterTab(name: string): Locator {
    return this.infoOuterTabList.locator('.nav-link', { hasText: name });
  }

  async gotoInfoOuterTab(name: string) {
    await this.infoOuterTab(name).click();
  }

  /** Toggle "Tổng quan"/"NN & TD" BÊN TRONG tab "Thông tin" — CHỈ tồn tại ở nhánh Stockcode (`CommonInfo.vue`).
   * Nhánh Indexcode KHÔNG có toggle này (2 view đã tách thành 2 tab ngoài "Thông tin"/"NN & TD" luôn). */
  get infoInnerTabList(): Locator {
    return this.infoPanel.locator('ul.custom-padding-tab-item.nav.nav-tabs.nav-justified.mt-2');
  }

  infoInnerTab(name: string): Locator {
    return this.infoInnerTabList.locator('.nav-link', { hasText: name });
  }

  async gotoInfoInnerTab(name: string) {
    await this.infoInnerTab(name).click();
  }

  /** 1 dòng dữ liệu dạng "nhãn - giá trị" dùng CHUNG class `.d-flex.justify-content-between.bg-hover` ở CẢ 2
   * nhánh Stockcode (`CommonInfo.vue`, thường bọc trong `.info-container`) và Indexcode (`CommonInfoIndex.vue`,
   * không bọc `.info-container`) — không scope theo `.info-container` để dùng chung được cho cả 2. */
  infoRow(label: string): Locator {
    return this.infoPanel.locator('.d-flex.justify-content-between.bg-hover', { hasText: label }).first();
  }

  // --- Header giá (chỉ nhánh Stockcode có bell/tooltip/link — Indexcode chỉ có tên "Chỉ số <mack>" + giá) ---
  get infoHeaderPriceRow(): Locator {
    return this.infoPanel.locator('.pt-2.d-flex.justify-content-between').first();
  }

  get bellAlertIcon(): Locator {
    return this.infoPanel.locator('.bell-setting-btn');
  }

  get headerInfoTooltipIcon(): Locator {
    return this.infoPanel.locator('.tooltip-show');
  }

  get headerInfoTooltipText(): Locator {
    return this.infoPanel.locator('.tooltiptext');
  }

  get companyNameLink(): Locator {
    return this.infoPanel.locator('a.company-name');
  }

  get thongTinFaLink(): Locator {
    return this.infoPanel.getByRole('link', { name: 'Thông tin FA' });
  }

  // --- Free-account gating (nhánh Stockcode dùng ProtectedView static PNG, nhánh Indexcode dùng featureName) ---
  get protectedViewImage(): Locator {
    return this.infoPanel.locator('.blurred-image');
  }

  // --- RS hover tooltip (RSs/RSm/RSl) ---
  get rsTooltipChart(): Locator {
    return this.page.locator('#rs-tooltip-chart');
  }

  // ================= Alert modal mở từ icon chuông (ngoài phạm vi chi tiết, chỉ verify mở đúng) =================
  get alertModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByText('Cảnh báo', { exact: false }) });
  }

  get upgradePackageModal(): Locator {
    return this.page.locator('.modal-package, [class*="package"]').first();
  }
}
