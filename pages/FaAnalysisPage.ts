import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Trang "Phân tích cơ bản" (`/phan-tich-co-ban/:macks*`, component `FAAnalysis` —
 * stocks/src/views/faAnalysis/index.vue). 6 tab chính tự viết tay (KHÔNG dùng CoreUI `<CTabs>`, khác
 * `TradingLogPage`): "Thông tin chung" · "Tài chính doanh nghiệp" · "4M & CANSLIM" · "Biểu đồ" · "So sánh" ·
 * "Bài viết & Phân tích".
 *
 * 1 Page Object DÙNG CHUNG cho khung/shell + toàn bộ 6 tab (giống pattern `TradingLogPage`) — locator/method
 * nhóm theo comment cho từng tab để dễ tra cứu, thay vì tách nhiều class riêng. Các lượt sinh testcase sau cho
 * từng tab con (Thông tin chung, Tài chính doanh nghiệp...) sẽ BỔ SUNG thêm section vào cuối file này, không
 * tạo POM riêng.
 *
 * Ghi chú cấu trúc quan trọng (đọc từ source + xác nhận qua `.dom-inspect/*.aria.txt`):
 * - Chỉ 1 `<ProtectedView>` DUY NHẤT ở CẤP NGOÀI CÙNG (`v-if="disable_featureName"`) thay thế TOÀN BỘ vùng nội
 *   dung 6 tab khi tab đang active bị khóa gói hội viên — KHÁC hẳn `TradingLogPage` (nơi mỗi pane có
 *   `ProtectedView` riêng, cả 3 pane luôn mounted). Ở đây `computed: featureName()` chỉ trả khác `null` cho 3
 *   tab "Biểu đồ"/"So sánh"/"Bài viết & Phân tích"; 3 tab còn lại ("Thông tin chung"/"Tài chính doanh nghiệp"/
 *   "4M & CANSLIM") KHÔNG BAO GIỜ bị khóa ở cấp tab chính này. Không cần lọc `:visible` khi đếm `ProtectedView`
 *   ở màn này (khác NKGD).
 * - Click đổi tab CHỈ set data cục bộ (`type_tab`, `active_tab[value]`, `query_tab`) — KHÔNG gọi
 *   `router.push`/đổi query string (giống `TradingLogPage`) → F5 giữa lúc đang ở tab khác "Thông tin chung" sẽ
 *   mất tab đang xem, quay về mặc định (trừ khi đã vào bằng `?tab=...` từ đầu, xem `goto()`).
 * - Ô tìm kiếm mã CK (`SearchStockCode.vue`) dùng `placeholder="Mã CK"` — KHÁC placeholder "Tìm kiếm Mã CK" của
 *   Bảng Giá (`BangGiaPage`), không dùng chung locator.
 */
export class FaAnalysisPage extends BasePage {
  // ================= Khung/shell dùng chung =================
  readonly mainTabList: Locator;
  readonly searchInput: Locator;
  readonly searchSuggestions: Locator;
  readonly protectedView: Locator;

  constructor(page: Page) {
    super(page);
    // Scope trong `main` để tránh đụng `<ul class="nav nav-tabs">` ẩn của dropdown thông báo header (cùng vấn
    // đề đã ghi chú ở TradingLogPage) — 6 tab render trong `<ul class="nav nav-tabs">` đầu tiên bên trong
    // `CCardHeader` của `faAnalysis-page`.
    this.mainTabList = page.locator('.faAnalysis-page ul.nav.nav-tabs').first();
    // QUAN TRỌNG: `page.getByPlaceholder('Mã CK')` KHÔNG scope sẽ khớp strict-mode violation (2 phần tử) — có
    // 1 input "Mã CK" THỨ HAI luôn tồn tại ẩn trong DOM ở MỌI trang (đã xác nhận qua debug: ancestor hoàn toàn
    // khác `.faAnalysis-page`, có `data-v-77f679ba`), nhiều khả năng thuộc modal biểu đồ toàn site
    // (`store.state.isShowModalTradingChart`, khai báo global trong `TheContainer.vue`, không unmount khi ẩn —
    // cùng pattern đã ghi ở `TradingLogPage.stockChartModal`). Luôn scope trong `mainTabList` (ô search thật của
    // trang này nằm ngay trong `<ul class="nav nav-tabs">`, xem `index.vue` dòng 4-7).
    this.searchInput = this.mainTabList.getByPlaceholder('Mã CK');
    this.searchSuggestions = page.locator('.search-stockcode_item');
    this.protectedView = page.locator('.faAnalysis-page .image-container .blurred-image');
  }

  /** `tabQuery` map đúng 6 giá trị `mounted()`/`created()` hỗ trợ deep-link qua `?tab=`: `thong-tin-chung` |
   * `tai-chinh-doanh-nghiep` | `4m-canslim` | `bieu-do` | `so-sanh` | `tin-tuc`. `mackPath` (nếu truyền) gắn vào
   * path `:macks*` (VD `/phan-tich-co-ban/VNM`) thay vì query `?mack=`. */
  async goto(options?: { tabQuery?: string; mackPath?: string; mackQuery?: string }) {
    const base = `/phan-tich-co-ban${options?.mackPath ? `/${options.mackPath}` : ''}`;
    const params = new URLSearchParams();
    if (options?.tabQuery) params.set('tab', options.tabQuery);
    if (options?.mackQuery) params.set('mack', options.mackQuery);
    const qs = params.toString();
    // KHÔNG chờ 'networkidle' — trang có polling giá realtime + biểu đồ TradingView (iframe) liên tục, giống
    // lý do đã ghi ở TradingLogPage/watchlist.spec.ts.
    await super.goto(qs ? `${base}?${qs}` : base, { waitUntil: 'domcontentloaded' });
    await this.mainTabList.waitFor({ state: 'visible' });
  }

  /** Tab chính: "Thông tin chung" | "Tài chính doanh nghiệp" | "4M & CANSLIM" | "Biểu đồ" | "So sánh" |
   * "Bài viết & Phân tích". Nav-link tự viết (không có `href`) → không dùng `getByRole('link')`. */
  mainTab(name: string): Locator {
    return this.mainTabList.locator('.nav-link', { hasText: name });
  }

  async gotoMainTab(name: string) {
    await this.mainTab(name).click();
  }

  get badgeNewFinanceReport(): Locator {
    return this.page.getByText(/^BCTC Mới/);
  }

  get stockNameHeader(): Locator {
    // Paragraph "<Tên công ty> (<Mã>) - <Sàn>" render trong Left.vue (tab Thông tin chung), dùng chung cho mọi
    // tab vì luôn nằm ở cột trái cố định — nhưng CHỈ tồn tại khi đang ở tab "Thông tin chung" (Left.vue chỉ
    // mount trong Common). Dùng `searchInput` (luôn có mặt ở mọi tab) để verify mã đang chọn ở các tab khác.
    return this.page.locator('.faAnalysis-page').getByText(/\(.+\) - (HOSE|HNX|UPCOM)/).first();
  }

  // ================= Tab "So sánh" (Compare/index.vue) =================
  // ⚠️ BUG THẬT đã xác nhận qua automation (xem TC_PTCB_SS_02 trong testcases/phan-tich-co-ban-so-sanh.md):
  // deep-link thẳng vào `?tab=so-sanh` (page.goto/reload đầy đủ, giống fa.goto()) khiến bảng dữ liệu so sánh
  // TRỐNG VĨNH VIỄN trong suốt session đó — race condition giữa `Compare.created()->getAll()` (đọc
  // `store.state.list_mack_company` ĐỒNG BỘ để tính `type_mack`) và `TheContainer.getAllMack()` (socket
  // "getallstockcode", nạp `list_mack_company` BẤT ĐỒNG BỘ). Khi component Compare mount gần như đồng thời với
  // TheContainer (trường hợp full page load), `list_mack_company` luôn RỖNG lúc `getAll()` đọc nó →
  // `type_mack` bị set cứng thành `""` → `items_table` computed không khớp bất kỳ nhánh
  // `nonbank`/`bank`/`stock`/`insurance` nào trong `compareJson.json` → trả về `[]` MÃI MÃI (không tự phục hồi
  // dù chờ bao lâu, vì `type_mack` không có cơ chế tính lại trừ khi đổi mã CK). CÁCH DUY NHẤT phục hồi trong
  // cùng session: đổi mã CK qua ô search (trigger `watch: "$store.state.mack"` → `mackChange()` → `getAll()`
  // gọi lại ĐÚNG lúc `list_mack_company` đã nạp xong). Mọi test cần bảng CÓ dữ liệu thật phải gọi
  // `waitForCompareDataReady()` bên dưới sau `goto()` — KHÔNG chỉ chờ timeout dài hơn (đã xác nhận chờ 30s+
  // vẫn không tự phục hồi).
  /** Bảng so sánh (`table.custom-compare` trong `TableScroll` component). */
  get compareTable(): Locator {
    return this.page.locator('table.custom-compare');
  }

  get compareTableRows(): Locator {
    return this.compareTable.locator('tbody tr');
  }

  get compareTableHeaderCells(): Locator {
    return this.compareTable.locator('thead th');
  }

  get btnMoMau(): Locator {
    return this.page.getByRole('button', { name: 'Mở mẫu' });
  }

  get btnLuuMau(): Locator {
    return this.page.getByRole('button', { name: 'Lưu mẫu' });
  }

  get btnThemMa(): Locator {
    return this.page.getByRole('button', { name: 'Thêm mã' });
  }

  /** Dòng "Đang chọn: <tên mẫu>" — chỉ hiện khi 1 mẫu đã lưu đang được nạp (`selected_item.id != -1`, qua nút
   * "Nạp" trong modal "Mở mẫu"). */
  get selectedTemplateLabel(): Locator {
    return this.page.getByText(/^Đang chọn:/);
  }

  get btnBoChonTemplate(): Locator {
    return this.page.getByText('Bỏ chọn', { exact: true });
  }

  /** Modal "Nhập dữ liệu" (nút "Thêm mã" mở) — CoreUI `CModal` render `role="dialog"` + heading text làm
   * `title`. Lọc theo heading để tránh đụng modal biểu đồ toàn site (cũng `role="dialog"`) hoặc 2 modal khác
   * của tab này ("Danh sách đã lưu", "Thêm mẫu mới", "Thông báo" xác nhận xoá). */
  get addMackModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Nhập dữ liệu' }) });
  }

  get openTemplateModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Danh sách đã lưu' }) });
  }

  get addTemplateModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Thêm mẫu mới' }) });
  }

  get deleteTemplateConfirmModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Thông báo' }) });
  }

  /** Input search trong modal "Nhập dữ liệu" — placeholder riêng, khác `searchInput` cấp shell. */
  get addMackModalInput(): Locator {
    return this.addMackModal.getByPlaceholder('Thêm mã vào danh sách');
  }

  /** Gợi ý mã khi gõ trong modal "Nhập dữ liệu" — CÙNG class `.search-stockcode_item` với gợi ý ô search cấp
   * shell, nên LUÔN scope trong `addMackModal` (modal chỉ 1 cái mở tại 1 thời điểm nên không cần lo đụng độ
   * với ô search shell nếu đã đóng modal trước khi thao tác ô đó). */
  get addMackModalSuggestions(): Locator {
    return this.addMackModal.locator('.search-stockcode_item');
  }

  /** Mỗi dòng trong "Danh sách mã" (mã đang xem + các mã đã thêm) render là `<CListGroupItem href="#">`
   * (role "link"). Dòng ĐẦU (mã đang xem, `$store.state.mack`) không nằm trong `<draggable>` nên KHÔNG có icon
   * xoá — chỉ các dòng sau (từ `myArray`) mới xoá được. */
  get addMackModalListRows(): Locator {
    return this.addMackModal.getByRole('link');
  }

  addMackModalRemoveIcon(mack: string): Locator {
    return this.addMackModalListRows.filter({ hasText: mack }).locator('.handle').last();
  }

  get addMackModalCloseBtn(): Locator {
    return this.addMackModal.getByRole('button', { name: 'Đóng', exact: true });
  }

  get addMackModalSaveBtn(): Locator {
    return this.addMackModal.getByRole('button', { name: 'Lưu', exact: true });
  }

  get openTemplateModalRows(): Locator {
    return this.openTemplateModal.locator('table tbody tr');
  }

  get addTemplateNameInput(): Locator {
    return this.addTemplateModal.getByPlaceholder('Nhập tên mẫu');
  }

  get addTemplateSubmitBtn(): Locator {
    return this.addTemplateModal.getByRole('button', { name: 'Thêm mới' });
  }

  /** `UpdateRequire` widget-level gate — CHỈ render khi `$store.state.isAccountFree` (cờ boolean riêng, KHÁC
   * hẳn `features_disabled['fa_so_sanh']` cấp shell mà TC_PTCB_17 đã đo là KHÔNG khoá tab này). Vì vậy tài
   * khoản Free vẫn luôn bị giới hạn 6 dòng + hiện block nâng cấp ở tab này, bất kể `features_disabled` có
   * chứa `fa_so_sanh` hay không — cùng pattern gating "nhiều cấp" đã ghi nhận ở "4M & CANSLIM" (TC_PTCB_16). */
  get freeUpgradeBlock(): Locator {
    return this.page.locator('.free-user-img-wrapper');
  }

  /** Click tên mã ở header bảng so sánh (VD "VNM") mở modal biểu đồ TradingView DÙNG CHUNG toàn site
   * (`store.state.isShowModalTradingChart = true`) — CÙNG modal chứa input "Mã CK" ẩn thứ 2 đã ghi chú ở
   * `searchInput` phía trên. Không thuộc phạm vi POM của tab này (modal global), chỉ verify nó MỞ ĐƯỢC. */
  compareColumnHeader(mack: string): Locator {
    return this.compareTableHeaderCells.filter({ hasText: mack });
  }

  /** Khắc phục race condition TC_PTCB_SS_02 (xem ghi chú phía trên): đổi mã CK về ĐÚNG mã đang xem qua ô
   * search để trigger lại `Compare.mackChange()` SAU KHI `list_mack_company` chắc chắn đã nạp xong (đã gõ +
   * chọn gợi ý thành công 1 lần → `list_mack` chắc chắn có dữ liệu → `list_mack_company` cũng vậy, set cùng
   * lúc trong `getAllMack()`). Gọi hàm này SAU `fa.goto({..., tabQuery: 'so-sanh'})` cho MỌI test cần bảng có
   * dữ liệu thật — KHÔNG dùng `waitForTimeout` dài thay thế (đã xác nhận tự chờ 30s+ KHÔNG tự phục hồi). */
  async waitForCompareDataReady(mack = 'VNM') {
    await this.page.waitForTimeout(2500); // chờ list_mack nạp lần đầu (tránh gợi ý rỗng giả, cùng lý do gotoAndWaitSearchReady ở spec shell)
    await this.searchInput.fill(mack);
    await this.searchSuggestions.filter({ hasText: mack }).first().waitFor({ state: 'visible' });
    await this.searchSuggestions.filter({ hasText: mack }).first().click();
    await this.compareTableRows.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  // ================= Tab "4M & CANSLIM" (FourmAndCanslim.vue) =================
  // ⚠️ ĐÍNH CHÍNH quan trọng so với ghi chú cũ ở TC_PTCB_16 (testcases/phan-tich-co-ban.md) và
  // TC_PTCB_17 (tests/phan-tich-co-ban.spec.ts): ghi chú cũ mô tả gating của tab này là "CHỈ 2 biểu đồ RADAR bị
  // mờ, phần thang điểm + biểu đồ lịch sử vẫn hiển thị bình thường". Đã ĐO LẠI THẬT bằng automation (tài khoản
  // Free) và xác nhận mô tả đó SAI — đọc kỹ `FourmAndCanslim.vue` dòng 1-2: `<ProtectedView
  // featureName="fa_4m_cansslim" v-if="disable_featureName" /><div v-else>...</div>` — khi `disable_featureName`
  // true (feature `fa_4m_cansslim` có trong `features_disabled`), TOÀN BỘ nội dung tab (`.chart-wrapper`, đếm
  // được 0 phần tử) bị thay thế bởi ĐÚNG 1 `<ProtectedView>`. `ProtectedView` chỉ render input DUY NHẤT 1
  // `<img>` (`src` = URL `blur_img` tĩnh từ `features_disabled['fa_4m_cansslim']`, VD
  // `https://api2.kfsp.vn/public/blur/fa_4m_cansslim.png`) — ảnh MOCKUP TĨNH được thiết kế trông giống layout
  // thật (có số điểm mẫu + biểu đồ mẫu, tự bản thân ảnh đã "mờ" sẵn 2 vùng radar), KHÔNG PHẢI dữ liệu thật render
  // bằng Vue/echarts (`getFourmAndCanslim()` có `if (this.disable_featureName) return;` — API tính điểm THẬT SỰ
  // KHÔNG được gọi). Vì vậy nhìn ảnh chụp màn hình dễ nhầm "chỉ 2 radar bị mờ" — phải kiểm tra DOM/network mới
  // phát hiện đúng: toàn bộ là 1 ảnh tĩnh. Xem `testcases/phan-tich-co-ban-4m-canslim.md` mục "Phát hiện đáng
  // chú ý" để biết chi tiết đầy đủ + khuyến nghị cập nhật lại ghi chú cũ.
  /** Card chứa tiêu đề "Điểm 4M": badge/ScoreBar điểm + biểu đồ lịch sử điểm theo quý (1 trong 2 `.chart_item`
   * của `.chart_container` ĐẦU TIÊN). */
  get fourmScoreCard(): Locator {
    return this.page.locator('.chart_container').nth(0).locator('.chart_item').nth(0);
  }

  /** Card radar "Điểm 4M" (`.chart_item` THỨ HAI của `.chart_container` đầu tiên — không có tiêu đề riêng, chỉ
   * chứa `CustomEChart` dạng radar). */
  get fourmRadarCard(): Locator {
    return this.page.locator('.chart_container').nth(0).locator('.chart_item').nth(1);
  }

  get canslimScoreCard(): Locator {
    return this.page.locator('.chart_container').nth(1).locator('.chart_item').nth(0);
  }

  get canslimRadarCard(): Locator {
    return this.page.locator('.chart_container').nth(1).locator('.chart_item').nth(1);
  }

  /** Số điểm hiển thị trong `ScoreBar` (`.score-tooltip`, khi điểm hợp lệ) — rỗng nếu đang ở trạng thái N/A
   * (badge `CBadge` `.center-content` thay thế thay vì `ScoreBar`). */
  scoreValue(card: Locator): Locator {
    return card.locator('.score-tooltip');
  }

  /** Badge đỏ "N/A" thay cho `ScoreBar` khi điểm không hợp lệ (`fourm_point`/`canslim_point == 'N/A'`, gồm cả
   * trường hợp lỗi mạng — catch không set lại điểm nên vẫn giữ giá trị mặc định "N/A"). */
  naBadge(card: Locator): Locator {
    return card.locator('.center-content').getByText('N/A');
  }

  /** Banner đỏ "Không đủ dữ liệu để chấm điểm" — CHỈ hiện khi `is_show_explain` true (thực chất chỉ phụ thuộc
   * `fourm_point == 'N/A'` do biểu thức `canslim_point < 'N/A'` trong code luôn `false`, xem ghi chú trong
   * `testcases/phan-tich-co-ban-4m-canslim.md`). Banner này và banner cảnh báo (`warningBanner`) dùng chung
   * `v-if`/`v-else-if` — KHÔNG BAO GIỜ cùng hiện 1 lúc, dù `warning` có dữ liệu.
   */
  get notEnoughDataBanner(): Locator {
    return this.page.getByText('Không đủ dữ liệu để chấm điểm');
  }

  /** Banner cảnh báo "Mã <mack> có N cảnh báo" (icon + text, `v-else-if="warning.length"` — chỉ hiện khi banner
   * "Không đủ dữ liệu" ở TRÊN không hiện). Hover để lộ `warningTooltip` (thuần CSS `:hover`, không phải Vue
   * state). */
  get warningBanner(): Locator {
    return this.page.locator('.warning_container');
  }

  get warningTooltip(): Locator {
    return this.page.locator('.warning_tooltip');
  }

  /** Logo "KungFuStocksPro Exclusive" — LUÔN hiển thị (không phụ thuộc `is_loading`/gói hội viên), chỉ ảnh
   * (`<img>`, không có text DOM thật — "KungFuStocksPro Exclusive" là chữ VẼ SẴN trong file ảnh, không dùng
   * `getByText` được). */
  get exclusiveLogo(): Locator {
    return this.page.locator('.p-logo278 img');
  }

  get disclaimerFooter(): Locator {
    return this.page.locator('.footer-alert');
  }

  /** Click vào 1 điểm dữ liệu trên biểu đồ lịch sử (echarts `CanvasRenderer` — không có DOM element riêng cho
   * từng điểm, phải click vào toạ độ PIXEL match đúng điểm trên `<canvas>`). Thử lần lượt nhiều toạ độ tương đối
   * (% chiều rộng/cao của `scoreCard`, ước lượng từ ảnh chụp DOM thật — 9 điểm trải x≈10-90%, y điểm dao động
   * quanh 60-78% chiều cao card do biên độ giá trị điểm thay đổi) cho tới khi request
   * `fourm-canslim-point-chart-by-time`/tương ứng được gửi đi — xác nhận đã click trúng 1 điểm bất kỳ (không cần
   * đúng điểm cụ thể, chỉ cần trigger đúng tính năng "xem điểm tại thời điểm khác"). Trả về `true` nếu bắt được
   * request trong thời gian chờ, `false` nếu thử hết các toạ độ mà không trúng điểm nào. */
  async clickHistoryChartPoint(scoreCard: Locator, urlPattern: RegExp): Promise<boolean> {
    // BẮT BUỘC scroll vào giữa viewport trước khi đo `boundingBox()` — khối "Điểm Canslim" nằm DƯỚI khối "Điểm
    // 4M" nên thường nằm ngoài viewport mặc định (720px cao) lúc mới `goto()`; `page.mouse.click()` gửi toạ độ
    // VIEWPORT thô (không tự cuộn như `locator.click()`), nên click "trúng" toạ độ nằm ngoài vùng nhìn thấy sẽ
    // luôn thất bại âm thầm (đã xác nhận qua debug: card Canslim ở y~618-1002 nhưng viewport chỉ cao 720px).
    await scoreCard.scrollIntoViewIfNeeded();
    const box = await scoreCard.boundingBox();
    if (!box) return false;
    let requestFired = false;
    const listener = (req: import('@playwright/test').Request) => {
      if (urlPattern.test(req.url())) requestFired = true;
    };
    this.page.on('request', listener);
    // Lưới toạ độ tương đối phủ rộng cả trục X (9-11 mốc quanh vị trí 9 quý hiển thị) lẫn Y (biên độ điểm dao
    // động mạnh giữa các mã/loại điểm, VD Canslim quan sát được từ ~18 tới ~80) — ước lượng từ nhiều ảnh chụp
    // DOM thật khác nhau (4M lẫn Canslim). Cố ý dùng delay ngắn (80ms/lần) để tổng thời gian nằm trong ngưỡng an
    // toàn của timeout test riêng (xem `test.setTimeout(60000)` ở các test dùng hàm này).
    const xFractions = [0.11, 0.18, 0.26, 0.33, 0.4, 0.47, 0.54, 0.62, 0.69, 0.76, 0.84, 0.9];
    const yFractions = [0.35, 0.42, 0.48, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
    outer: for (const yf of yFractions) {
      for (const xf of xFractions) {
        if (requestFired) break outer;
        await this.page.mouse.click(box.x + box.width * xf, box.y + box.height * yf);
        await this.page.waitForTimeout(80);
      }
    }
    await this.page.waitForTimeout(500);
    this.page.off('request', listener);
    return requestFired;
  }

  // ================= Tab "Biểu đồ" (ChartByNonBank.vue / ChartByBank.vue) =================
  // Shell `index.vue` chọn 1 trong 2 component KHÁC NHAU tuỳ nhóm mã (`nhom_stockcode`, computed đọc
  // `store.state.list_mack_company[stockcode]?.nhom`): `ChartByNonBank` cho mã thường/BĐS/bảo hiểm, `ChartByBank`
  // CHỈ cho mã ngân hàng. CẢ 2 component là lưới nhiều biểu đồ ECharts (doanh thu/lợi nhuận, hiệu suất, ROA/ROE,
  // định giá... cho mã thường; radar tổng hợp + 10 biểu đồ tài chính ngân hàng riêng cho mã NH) — HOÀN TOÀN
  // KHÔNG PHẢI TradingView candlestick như suy đoán ban đầu (đã đọc source + đo DOM thật xác nhận, xem
  // testcases/phan-tich-co-ban-bieu-do.md mục "Phát hiện đáng chú ý" #0).
  //
  // ⚠️ BUG THẬT #1 (race condition, xem TC_PTCB_BD_03): `nhom_stockcode` là `undefined` lúc `index.vue` mount
  // (state `list_mack_company` nạp bất đồng bộ qua socket `TheContainer.getAllMack()`, cùng cơ chế gây bug tab So
  // Sánh). Template dùng `v-if="nhom_stockcode != 'bank'"` cho `ChartByNonBank` — fallback AN TOÀN cho mã thường
  // (`undefined != 'bank'` luôn `true`) nhưng khiến MÃ NGÂN HÀNG (VD VCB) luôn mount NHẦM `ChartByNonBank` trước
  // (gọi sai API `.../chart/nonbank?mack=VCB`, đo được trả về **500**), rồi mới tự chuyển đúng sang `ChartByBank`
  // khi `nhom_stockcode` resolve (computed REACTIVE nên tự phục hồi, KHÔNG cần thao tác thủ công như bug tab So
  // Sánh) — vẫn tốn 1 request lãng phí + lỗi 500 mỗi lần deep-link/F5/đổi mã CK sang mã ngân hàng.
  // ⚠️ BUG THẬT #2 (xem TC_PTCB_BD_04/05): `ChartByBank.data()` chỉ khởi tạo 4/11 key của `options_bank`
  // (`hqttm`/`ldrq`/`tnttm`/`tsq`) nhưng template đọc `options_bank['pe_pb'].series.length`/`['llr'].series.length`
  // NGAY LẦN RENDER ĐẦU TIÊN (trước khi API `/chart/bank` resolve) → phát sinh ĐÚNG 2 `TypeError: Cannot read
  // properties of undefined (reading 'series')` MỖI LẦN `ChartByBank` MOUNT MỚI — đã xác nhận 100% tái hiện qua
  // automation ở CẢ deep-link/F5 LẪN đổi mã CK qua search (SPA, không reload) — không phải lỗi ngẫu nhiên/chỉ khi
  // mất mạng. Trang vẫn tự hồi phục hiển thị đúng sau khi API resolve (không trống vĩnh viễn như bug So Sánh),
  // nhưng lỗi console vẫn phát sinh thật mỗi lần — khuyến nghị báo dev khởi tạo đủ toàn bộ 11 key trong `data()`.
  // ⚠️ Giới hạn kỹ thuật (giống 4M & CANSLIM, xem `testcases/phan-tich-co-ban-4m-canslim.md` TC_PTCB_4M_03): mọi
  // biểu đồ đều dùng `CanvasRenderer` — nhãn trục/tooltip/toolbox KHÔNG PHẢI text DOM, không assert được nội dung
  // bên trong bằng `getByText()`, chỉ verify được canvas tồn tại/kích thước hợp lý.

  /** Wrapper DUY NHẤT bao `ChartByNonBank`/`ChartByBank` trong `index.vue` (`div.card-header.p-0.pt-4`,
   * `v-if="active_tab['chart']"`) — dùng để scope MỌI locator bên dưới, tránh đụng độ với các tab khác (VD nút
   * "Thêm mã" cũng tồn tại ở tab So Sánh với modal khác cấu trúc). */
  get chartTabContainer(): Locator {
    return this.page.locator('.faAnalysis-page .card-header.p-0.pt-4');
  }

  /** Mỗi `<CCard>` trong lưới biểu đồ (bao gồm cả card đang bị `UpdateRequire` che nếu tài khoản Free). */
  get chartCards(): Locator {
    return this.chartTabContainer.locator('.card');
  }

  get chartLoadingSpinner(): Locator {
    return this.chartTabContainer.getByRole('status');
  }

  /** Chỉ `ChartByBank` (mã ngân hàng) có nút này — `ChartByNonBank` (mã thường) KHÔNG có. */
  get btnThemMaChart(): Locator {
    return this.chartTabContainer.getByRole('button', { name: 'Thêm mã' });
  }

  /** Text "Bạn cần nâng cấp gói hội viên..." của `UpdateRequire` — đếm số card đang bị gate per-widget (KHÁC
   * hẳn gate cấp shell `disable_featureName`, xem TC_PTCB_17 trong `phan-tich-co-ban.md`: tài khoản Free hiện
   * tại KHÔNG bị khoá cấp shell, nhưng vẫn bị gate per-chart ở đây, cùng pattern đã ghi nhận ở "So sánh"/"4M &
   * CANSLIM"). */
  get chartUpgradeBlocks(): Locator {
    return this.chartTabContainer.getByText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này');
  }

  /** `UpdateRequire.vue` render "Nâng cấp ngay" trong 1 `<div class="free-user-upgrade-button" @click="...">`
   * (KHÔNG PHẢI `<button>`, không có `role="button"`) — phải dùng `getByText()`, không dùng `getByRole('button')`. */
  get chartUpgradeNowBtn(): Locator {
    return this.chartTabContainer.getByText('Nâng cấp ngay', { exact: true });
  }

  /** Logo "KungFuStocksPro Exclusive" — CHỈ `ChartByBank` có (`.p-logo-slim`), `ChartByNonBank` không có logo
   * riêng nào (chỉ có watermark mờ VẼ TRONG canvas từng chart, không phải DOM). */
  get chartBankLogo(): Locator {
    return this.chartTabContainer.locator('.p-logo-img-slim');
  }

  /** Modal "Thêm mã" của `ChartByBank` — heading "Nhập dữ liệu" GIỐNG hệt modal "Thêm mã" của tab So Sánh
   * (`addMackModal`) nhưng cấu trúc bên trong KHÁC (có thêm Quý/Năm) — an toàn dùng chung selector vì 2 tab
   * không bao giờ cùng mount modal 1 lúc (`v-show`/`v-if` theo tab). */
  get chartAddMackModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Nhập dữ liệu' }) });
  }

  get chartAddMackModalInput(): Locator {
    return this.chartAddMackModal.getByPlaceholder('Mã CK');
  }

  get chartAddMackModalSuggestions(): Locator {
    return this.chartAddMackModal.locator('.search-stockcode_item');
  }

  get chartAddMackModalQuarterSelect(): Locator {
    return this.chartAddMackModal.getByLabel('Quý');
  }

  get chartAddMackModalYearInput(): Locator {
    return this.chartAddMackModal.getByLabel('Năm');
  }

  /** Mỗi dòng trong "Danh sách mã" (mã đang xem + mã đã thêm) — `<a href="#">` (role "link"), giống cấu trúc
   * modal So Sánh. Dòng ĐẦU (mã đang xem, ngoài `<draggable>`) không có icon xoá. */
  get chartAddMackModalListRows(): Locator {
    return this.chartAddMackModal.getByRole('link');
  }

  chartAddMackModalRemoveIcon(mack: string): Locator {
    return this.chartAddMackModalListRows.filter({ hasText: mack }).locator('.handle').last();
  }

  get chartAddMackModalCloseBtn(): Locator {
    return this.chartAddMackModal.getByRole('button', { name: 'Đóng', exact: true });
  }

  get chartAddMackModalSaveBtn(): Locator {
    return this.chartAddMackModal.getByRole('button', { name: 'Lưu', exact: true });
  }

  // ================= Tab "Bài viết & Phân tích" (NewsAndAnalysis/index.vue) =================
  // ⚠️ ĐÍNH CHÍNH kiến trúc quan trọng (xem testcases/phan-tich-co-ban-bai-viet-phan-tich.md mục "Phát hiện đáng
  // chú ý" #0): tab này KHÔNG có 3 sub-tab điều hướng như app (Bài viết/BCTC gốc/Phân tích) — layout CỐ ĐỊNH,
  // hiển thị ĐỒNG THỜI cả 3 loại nội dung trên 1 màn hình: cột trái luôn là "Bài viết" (NewsEvent/News.vue), cột
  // phải xếp dọc "Báo cáo phân tích" (ReportAnalysis.vue) + "BCTC gốc" (ReportRaw.vue, có 4 sub-tab RIÊNG bên
  // trong nó — "BCTC gốc"/"Bản cáo bạch & BCTN"/"Nghị quyết"/"Báo cáo quản trị", type=1/3/4/5).
  // ⚠️ Sub-tab "Sự kiện" (`NewsEvent/Events.vue`) là DEAD CODE — component đầy đủ chức năng nhưng
  // `NewsEvent/index.vue` không loop qua `option_tab` trong template nên không có cách nào truy cập qua UI.
  // ⚠️ Click icon "File" (cả 2 bảng "Báo cáo phân tích"/"BCTC gốc") mở file PDF qua `window.open()` — Chromium xử
  // lý như DOWNLOAD (sự kiện `download`), KHÔNG PHẢI điều hướng trang mới (`page`/`popup` event trả URL rỗng) —
  // luôn bắt bằng `page.waitForEvent('download')`, không dùng `waitForEvent('popup')`.
  // ⚠️ Cả 3 khu vực (News/ReportAnalysis/ReportRaw) đều có biến `is_loading` nhưng KHÔNG dùng trong template —
  // KHÔNG có spinner/CElementCover nào hiển thị khi tải chậm (khác tab Biểu đồ/4M & CANSLIM).

  /** Root `<CCard>` của cả tab (`NewsAndAnalysis/index.vue`) — không có class riêng nên scope bằng text "Từ
   * ngày:" duy nhất trên toàn trang, tránh đụng các phần tử ẩn toàn cục khác (xem ghi chú `searchInput`). */
  get newsAnalysisTab(): Locator {
    return this.page.locator('.faAnalysis-page .card', { hasText: 'Từ ngày:' }).first();
  }

  get newsFromDateInput(): Locator {
    return this.newsAnalysisTab.locator('input[type="date"]').first();
  }

  get newsToDateInput(): Locator {
    return this.newsAnalysisTab.locator('input[type="date"]').nth(1);
  }

  get newsSearchBtn(): Locator {
    return this.newsAnalysisTab.getByRole('button', { name: 'Tìm kiếm' });
  }

  /** Header tab tĩnh của card "Bài viết" (cột trái) — CHỈ 1 `<li>` "Bài viết", không loop/click được (xem ghi
   * chú "Sự kiện" dead code ở đầu section). */
  get newsCardHeader(): Locator {
    return this.newsAnalysisTab.locator('.nav.nav-tabs').filter({ hasText: 'Bài viết' }).filter({ hasNotText: 'Phân tích' });
  }

  /** Mỗi item bài viết render là `<CLink class="cursor-pointer">` (role "link", trong `<a>`) — KHÁC
   * `.cursor-pointer` của icon "File" trong 2 bảng bên phải (đó là `<td>`, không phải `<a>`), nên dùng tag `a`
   * để phân biệt. */
  get newsItems(): Locator {
    return this.newsAnalysisTab.locator('a.cursor-pointer');
  }

  get newsModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Chi tiết bài viết' }) });
  }

  get newsModalCloseBtn(): Locator {
    return this.newsModal.locator('button.close');
  }

  get newsModalContent(): Locator {
    return this.newsModal.locator('.content-new-details');
  }

  /** Scope RIÊNG trong khu vực list "Bài viết" (`.custom-scrollbar.pl-2` — wrapper `News.vue`) — KHÔNG dùng
   * `newsAnalysisTab.getByText(...)` trực tiếp vì `ReportAnalysis.vue` cũng có text "Không có dữ liệu" riêng
   * (2 nơi cùng lúc gây strict-mode violation khi cả 2 đều rỗng). */
  get newsEmptyText(): Locator {
    return this.newsAnalysisTab.locator('.custom-scrollbar.pl-2').getByText('Không có dữ liệu');
  }

  get newsPagination(): Locator {
    return this.newsAnalysisTab.locator('.news-pagination');
  }

  /** Bảng "Báo cáo phân tích" — class `.report-analysis` là selector ổn định nhất (đặt trực tiếp trên
   * `CDataTable`, không có phần tử ẩn trùng tên nào khác trên trang). */
  get reportAnalysisTable(): Locator {
    return this.page.locator('.report-analysis');
  }

  get reportAnalysisRows(): Locator {
    return this.reportAnalysisTable.locator('tbody tr');
  }

  /** Icon "File" luôn là `<td>` cuối cùng của mỗi dòng (cột "File"), có `@click="goto_link(item.link)"`. */
  reportAnalysisFileIcon(rowIndex = 0): Locator {
    return this.reportAnalysisRows.nth(rowIndex).locator('td').last();
  }

  /** Bảng "BCTC gốc" — class `.report-raw` đặt trực tiếp trên `CDataTable`, KHÔNG phải ancestor của
   * `ul.nav-tabs` 4 sub-tab (2 phần tử là anh em trong cùng `<CCard>`) — dùng `reportRawSubTabs` riêng để thao
   * tác 4 sub-tab. */
  get reportRawTable(): Locator {
    return this.page.locator('.report-raw');
  }

  get reportRawRows(): Locator {
    return this.reportRawTable.locator('tbody tr');
  }

  reportRawFileIcon(rowIndex = 0): Locator {
    return this.reportRawRows.nth(rowIndex).locator('td').last();
  }

  /** 4 sub-tab của "BCTC gốc": "BCTC gốc" (mặc định active, `type=1`) · "Bản cáo bạch & BCTN" (`type=3`) ·
   * "Nghị quyết" (`type=4`) · "Báo cáo quản trị" (`type=5`). Lọc theo text "BCTC gốc" để xác định đúng
   * `ul.nav-tabs` duy nhất chứa cả 4 tab này trên trang. */
  get reportRawSubTabs(): Locator {
    return this.newsAnalysisTab.locator('.nav.nav-tabs').filter({ hasText: 'BCTC gốc' });
  }

  reportRawSubTab(name: string): Locator {
    return this.reportRawSubTabs.locator('.nav-link', { hasText: name });
  }

  async clickReportRawSubTab(name: string) {
    await this.reportRawSubTab(name).click();
  }

  /** Click icon "File" và bắt sự kiện `download` (KHÔNG lưu file — không gọi `saveAs()`) — Chromium xử lý URL
   * PDF trực tiếp qua `window.open()` như tải file, không phải điều hướng/mở tab mới thông thường. Trả về URL
   * file đã tải, hoặc `null` nếu không có sự kiện `download` nào trong thời gian chờ. */
  async clickFileIconAndCaptureDownloadUrl(fileIcon: Locator, timeout = 8000): Promise<string | null> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout }).catch(() => null),
      fileIcon.click(),
    ]);
    return download ? download.url() : null;
  }

  // ================= Tab "Tài chính doanh nghiệp" (BusinessFinance/index.vue) =================
  // 5 sub-report con: "Bảng cân đối kế toán" (BS.vue, value "bs") · "Kết quả kinh doanh" (IS.vue, "is") ·
  // "Lưu chuyển tiền tệ" (CF.vue, "cf") · "Thuyết minh" (TM.vue, "tm") · "Chỉ tiêu tài chính"
  // (FinancialRatios.vue, "financial_ratios"). 4 component ĐẦU (BS/IS/CF/TM) CÙNG cấu trúc/hành vi
  // (template + script gần như giống hệt nhau, chỉ khác `type`/JSON tra cứu), riêng FinancialRatios khác hẳn:
  // gọi API RIÊNG (`/api/stocks/financial-ratios`, không phải `/api/stocks?type=...`), có thêm cột "Đơn vị",
  // KHÔNG có cấu trúc cây thu gọn/mở rộng (không `is_parent`/`checkHideShow` trong template — render phẳng
  // toàn bộ `financial_ratios_items`), và dùng select Quý/Năm/TTM RIÊNG (`type_time_financial_ratios`) thay vì
  // select Quý/Năm dùng chung của 4 sub-report kia (`type_time_bctc`) — 2 state ĐỘC LẬP hoàn toàn trong
  // `BusinessFinance/index.vue`.
  //
  // ⚠️ "Thuyết minh" (TM) là SUB-TAB NỘI BỘ — ẨN HOÀN TOÀN với tài khoản KHÔNG có role "coworker" trong
  // `localStorage.roles` (đọc `BusinessFinance/index.vue` `data()`: chỉ push { label: "Thuyết minh", value: "tm" }
  // vào `option_tab` khi `roles.indexOf("coworker") >= 0`). Đây là gate HOÀN TOÀN ĐỘC LẬP với gói hội viên
  // (Free/VIP) — đo thật xác nhận: tài khoản Free hiện tại (không có role coworker) chỉ thấy 4 sub-tab (không
  // có "Thuyết minh"), trong khi `TEST_USER_EMAIL` (có role coworker) thấy đủ 5. KHÁC hẳn mọi pattern gating
  // theo `features_disabled`/`isAccountFree` đã ghi nhận ở các tab khác — đây là 1 kiểu gate thứ 3 (theo ROLE,
  // không phải theo GÓI).
  //
  // ⚠️ Gating theo gói hội viên ở CẤP SUB-TAB (`disable_featureName` trong `BusinessFinance/index.vue`,
  // `<ProtectedView v-if="disable_featureName">` bọc TOÀN BỘ vùng nội dung — thanh sub-tab + 2 select VẪN hiển
  // thị bình thường, chỉ vùng bảng bên dưới bị thay bằng `ProtectedView`): `featureName` tính theo
  // `type_tab` hiện tại — "bs"→`fa_cdkt`, "is"→`fa_kqkd`, "cf"→`fa_lctt`, "financial_ratios"→`fa_cttc`,
  // "tm"→KHÔNG có case riêng nên luôn `null` (không bao giờ bị khoá). Đo thật `features_disabled` của tài
  // khoản Free hiện tại: CHỈ có `fa_cttc` (KHÔNG có `fa_cdkt`/`fa_kqkd`/`fa_lctt`) → CHỈ "Chỉ tiêu tài chính"
  // bị khoá, 3 sub-tab BS/IS/CF hiển thị bình thường — cùng pattern "gating nhiều cấp" đã ghi nhận ở các tab
  // khác, nhưng ở đây cấp độ chi tiết hơn: khoá theo TỪNG SUB-TAB thay vì cả tab lớn hoặc cả widget.
  //
  // ⚠️ Tài khoản Free CÒN bị ép mặc định + khoá đổi đơn vị/kỳ (watch `$store.state.isAccountFree` immediate
  // trong `BusinessFinance/index.vue`): `type_money` ép về `"bilion"` (Tỷ đồng), `type_time_bctc` ép về
  // `"year"` (Năm), và CẢ 2 `CSelect` (đơn vị + Quý/Năm/TTM, mọi sub-tab) đều `:disabled="isAccountFree"` —
  // ĐỘC LẬP với gate `disable_featureName` phía trên (áp dụng cho MỌI sub-tab kể cả BS/IS/CF không bị khoá).
  //
  // ⚠️ KHÔNG có race condition giống tab "Biểu đồ"/"So sánh": nhóm mã (nonbank/bank/stock/insurance) được xác
  // định HOÀN TOÀN từ `response.data[0]` của CHÍNH API `/api/stocks`/`/api/stocks/financial-ratios` (server trả
  // về), KHÔNG đọc `store.state.list_mack_company` (state nạp bất đồng bộ qua socket) ở bất kỳ đâu trong 5
  // component con — deep-link thẳng vào mã ngân hàng an toàn 100%, không cần thao tác gì thêm để "sửa" dữ liệu.
  //
  // ⚠️ KHÔNG có caching client-side: mỗi lần chuyển sub-tab, component con bị UNMOUNT (v-if, không phải
  // v-show) rồi MOUNT LẠI từ đầu → `created()` LUÔN gọi lại API, kể cả quay lại đúng sub-tab đã xem trước đó.

  /** Thanh 5 sub-tab con — CÙNG class `ul.nav.nav-tabs` với `mainTabList` (6 tab chính) nên PHẢI lọc theo text
   * để phân biệt, không dùng `.first()`/index cố định (thứ tự DOM phụ thuộc tab nào mount trước). */
  get bfSubTabList(): Locator {
    return this.page.locator('.faAnalysis-page ul.nav.nav-tabs').filter({ hasText: 'Bảng cân đối kế toán' });
  }

  bfSubTab(name: string): Locator {
    return this.bfSubTabList.locator('.nav-link', { hasText: name });
  }

  async clickBfSubTab(name: string) {
    await this.bfSubTab(name).click();
  }

  /** Select đơn vị tiền tệ "Triệu đồng"/"Tỷ đồng" — lọc theo option để không phụ thuộc thứ tự DOM. Ẩn ở
   * sub-tab "Chỉ tiêu tài chính" (`v-if="type_tab != 'financial_ratios'"`). */
  get bfMoneySelect(): Locator {
    return this.page
      .locator('.faAnalysis-page select')
      .filter({ has: this.page.locator('option', { hasText: 'Triệu đồng' }) });
  }

  /** Select "Quý"/"Năm" DÙNG CHUNG cho BS/IS/CF/TM (`type_time_bctc`) — phân biệt với select 3 lựa chọn của
   * "Chỉ tiêu tài chính" bằng cách loại trừ option "TTM". */
  get bfTimeSelect(): Locator {
    return this.page
      .locator('.faAnalysis-page select')
      .filter({ has: this.page.locator('option', { hasText: 'Quý' }) })
      .filter({ hasNot: this.page.locator('option', { hasText: 'TTM' }) });
  }

  /** Select "Quý"/"Năm"/"TTM" RIÊNG của sub-tab "Chỉ tiêu tài chính" (`type_time_financial_ratios`) — state
   * ĐỘC LẬP hoàn toàn với `bfTimeSelect`. */
  get bfTimeSelectFinancialRatios(): Locator {
    return this.page
      .locator('.faAnalysis-page select')
      .filter({ has: this.page.locator('option', { hasText: 'TTM' }) });
  }

  /** Bảng dữ liệu đang active — CHỈ 1 trong 5 bảng con mount tại 1 thời điểm (`v-if` theo `type_tab`), an toàn
   * dùng `.first()`. */
  get bfTable(): Locator {
    return this.page.locator('.faAnalysis-page .table-scroll table').first();
  }

  /** Wrapper `<div class="table-scroll table-bs|table-is|table-cf|table-tm|table-financial_ratios">` — class
   * định danh loại bảng đang active nằm ở DIV NÀY (không phải trên `<table>` — `bfTable` luôn có cùng 1 bộ class
   * cố định do `table-scroll` component sinh ra, KHÔNG phân biệt được sub-report). Dùng locator này để assert
   * đúng sub-report đang hiển thị. */
  get bfTableWrapper(): Locator {
    return this.page.locator('.faAnalysis-page .table-scroll').first();
  }

  get bfTableHeaderCells(): Locator {
    return this.bfTable.locator('thead th');
  }

  get bfTableRows(): Locator {
    return this.bfTable.locator('tbody tr');
  }

  bfTableRowByText(text: string): Locator {
    return this.bfTableRows.filter({ hasText: text });
  }

  /** Click vào phần tử có thể thu gọn/mở rộng của 1 dòng cha (khớp `is_parent`/`is_root`) — handler `@click`
   * gắn trên `div.d-flex.align-items-center` bên trong `<td>` ĐẦU TIÊN (cột "Thông tin"), không phải cả `<td>`.
   * CHỈ áp dụng cho BS/IS/CF/TM — "Chỉ tiêu tài chính" không có cấu trúc cây nên không có phần tử này. */
  bfRowToggleHandle(text: string): Locator {
    return this.bfTableRowByText(text).locator('td').first().locator('div').first();
  }

  async toggleBfRow(text: string) {
    await this.bfRowToggleHandle(text).click();
  }

  /** Loading spinner (`<Loading />`, thay thế toàn bộ bảng — `v-if="!is_loading"` trên `table-scroll`,
   * `v-else` render `<Loading />` — dùng chung `role="status"` với các tab khác trong dự án). */
  get bfLoadingSpinner(): Locator {
    return this.page.locator('.faAnalysis-page').getByRole('status');
  }

  /** `ProtectedView` cấp SUB-TAB (`disable_featureName` trong `BusinessFinance/index.vue`) — TÁI SỬ DỤNG
   * locator `protectedView` (`.faAnalysis-page .image-container .blurred-image`) đã khai báo ở khung/shell vì
   * cùng class CSS (`ProtectedView.vue` dùng chung). Bọc TOÀN BỘ vùng bảng (không bọc thanh sub-tab/select). */
  /** Text "Bạn cần nâng cấp gói hội viên..." + nút "Đăng ký ngay" của `ProtectedView` — CHỈ xuất hiện trong DOM
   * sau khi `mouseover` vào `.image-container` (`isButtonVisible`, ẩn mặc định, KHÔNG phải `UpdateRequire` của
   * các tab khác vốn luôn hiện sẵn). Phải `hover()` trước khi assert visible. */
  get bfProtectedViewRegisterText(): Locator {
    return this.page.locator('.faAnalysis-page .register-content-center');
  }

  get bfProtectedViewRegisterBtn(): Locator {
    return this.page.getByRole('button', { name: 'Đăng ký ngay' });
  }

  /** `ProtectedView.vue` toggle `isButtonVisible` bằng `@mouseover`/`@mouseleave` trên `.image-container`
   * (phần tử cha của `.blurred-image`) — SAU KHI hiện, `.register-content-center` định vị `position:absolute;
   * top:50%;left:50%` đè NGAY TRÊN chính giữa ảnh, khiến `locator.hover()` chuẩn (có kiểm tra actionability lặp
   * lại) treo vô hạn vì phần tử "topmost" tại toạ độ đó đổi liên tục giữa ảnh và nút. Dùng `dispatchEvent` để
   * trigger thẳng sự kiện `mouseover`, bỏ qua kiểm tra actionability. */
  async hoverBfProtectedView() {
    await this.protectedView.dispatchEvent('mouseover');
  }

  // ================= Tab "Thông tin chung" — Shell + Sub-tab "Thông tin tài chính" (Common/index.vue) =================
  // Shell 2 cột: cột trái `Left.vue` (biểu đồ nến TradingView + bảng "Thông tin chung" công ty, LUÔN hiển thị
  // bất kể sub-tab nào ở cột phải đang active) + cột phải `Right.vue` (thanh 7 sub-tab + nội dung tương ứng).
  // Xem testcases/phan-tich-co-ban-thong-tin-chung.md — tài liệu này CHỈ phủ khung/shell + sub-tab mặc định
  // "Thông tin tài chính" (`FinancialInfo.vue` + `ChartEconomicInfo.vue`); 6 sub-tab còn lại sẽ có POM riêng bổ
  // sung ở các lượt sinh testcase sau (xem đầu file `.md`).
  //
  // ⚠️ Gate cấp WIDGET riêng của `Right.vue` (`features_disabled`, ĐỘC LẬP với gate cấp shell/tab chính) — áp
  // dụng cho 5/7 sub-tab (share_holder→fa_co_dong, transaction_info→fa_giao_dich_noi_bo,
  // foreign_transaction→fa_nuoc_ngoai, proprietary_transaction→fa_tu_doanh, event→fa_su_kien), "Thông tin tài
  // chính"/"Hồ sơ" KHÔNG BAO GIỜ bị khoá qua cơ chế này (`featureName` luôn `null`). `<ProtectedView>` chỉ bọc
  // `CCol xl="9"` (nội dung chính bên trái của `Right.vue`) — `CCol xl="3"` (biểu đồ phụ trợ) KHÔNG bị gate,
  // nhận diện qua style riêng `calc(100vh - 144px)` (xem `rightSidePanel` bên dưới). Dùng lại `protectedView`
  // đã khai báo ở khung/shell (cùng class CSS `ProtectedView.vue`).
  // ⚠️ 2 icon "Tạo cảnh báo"/"Thêm giao dịch" ở `Left.vue` gate theo `isAccountFree` (KHÁC hẳn `features_disabled`
  // ở trên) — mở modal "Thông báo" (`membershipModal`) thay vì modal thật.
  // ⚠️ Sub-tab tự viết tay (`type_tab`, data cục bộ của `Right.vue`) — KHÔNG đổi URL khi chuyển, F5 quay về mặc
  // định "Thông tin tài chính". Đổi mã CK KHÔNG ảnh hưởng sub-tab đang chọn (state độc lập với `Common/index.vue`).

  /** Paragraph "<Tên công ty> (<Mã>) - <Sàn>" (`stockNameHeader` khai báo ở khung/shell) → lấy `div.mb-2` bao
   * ngoài (chứa cả tên công ty + hàng giá/3 icon) làm mốc, vì `.mb-2` không có class riêng biệt để scope trực
   * tiếp. */
  get leftPanelHeader(): Locator {
    return this.stockNameHeader.locator('..');
  }

  /** Hàng `.d-flex` chứa giá + 3 icon (watchlist/"Tạo cảnh báo"/"Thêm giao dịch") — phần tử `.d-flex` DUY NHẤT
   * trong `leftPanelHeader` (xem `Left.vue` dòng 7-96). */
  get leftPriceRow(): Locator {
    return this.leftPanelHeader.locator('.d-flex').first();
  }

  /** 3 icon SVG hardcode kích thước riêng trong `Left.vue` — dùng `width`/`height` làm định danh ổn định
   * (KHÔNG có class/id riêng nào khác để phân biệt): watchlist (star) 21x24, "Tạo cảnh báo" (chuông) 22x24,
   * "Thêm giao dịch" 22x22. Click vào `<svg>` vẫn trigger đúng handler của `<div>` cha (sự kiện click bubble
   * lên DOM bình thường, không phụ thuộc biên giới component Vue). */
  get watchlistStarIcon(): Locator {
    return this.leftPriceRow.locator('svg[width="21"][height="24"]');
  }

  get alertBellIcon(): Locator {
    return this.leftPriceRow.locator('svg[width="22"][height="24"]');
  }

  /** CHỈ tồn tại khi `isStock` true (mã loại cổ phiếu, tra `store.state.list_mack_all`) — xem TC_PTCB_TTC_09. */
  get addTransactionIcon(): Locator {
    return this.leftPriceRow.locator('svg[width="22"][height="22"]');
  }

  /** Dropdown "Chọn watchlist để đưa <mack> vào theo dõi" (`AddWatchListDropdown.vue`) mở khi click
   * `watchlistStarIcon` — CHỈ verify text mở đúng, KHÔNG thao tác thêm (an toàn dữ liệu, xem đầu tài liệu). */
  watchlistDropdownText(mack: string): Locator {
    return this.page.getByText(`Chọn watchlist để đưa ${mack} vào theo dõi`);
  }

  /** Modal "Tạo cảnh báo" TOÀN SITE (`TheContainer.vue`, `isShowModalAlert`). */
  get alertModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Tạo cảnh báo' }) });
  }

  /** Modal "Thêm giao dịch" TOÀN SITE (`TheContainer.vue`, `isShowQuickTransactionFormModal`) — CÙNG heading
   * text với `TradingLogPage.addModal` (modal khác, cấu trúc khác) nhưng không bao giờ mở đồng thời cả 2. */
  get quickTransactionModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Thêm giao dịch' }) });
  }

  /** Modal "Thông báo" nâng cấp gói (`isShowModalMembership`, text "Chức năng dành riêng cho hội viên") — lọc
   * thêm theo text để không đụng các modal "Thông báo" khác (VD xác nhận xoá ở tab So Sánh) dù hiếm khi mở
   * đồng thời. */
  get membershipModal(): Locator {
    return this.page
      .getByRole('dialog')
      .filter({ has: this.page.getByRole('heading', { name: 'Thông báo' }) })
      .filter({ hasText: 'Chức năng dành riêng cho hội viên' });
  }

  /** Biểu đồ nến TradingView (`ChartTradingViewEvents.vue`, `:id="containerId"` mặc định `tv_chart_container`). */
  get candleChartContainer(): Locator {
    return this.page.locator('#tv_chart_container');
  }

  /** Thanh khung thời gian "1d 1m 3m 6m 1y 3y 5y" (`.custom-timeframe-selector > div`, class `active` trên mục
   * đang chọn). Nhãn không trùng lặp lẫn nhau (không mục nào là chuỗi con của mục khác) nên lọc `hasText` không
   * cần `exact`. */
  get candleTimeframeButtons(): Locator {
    return this.page.locator('.custom-timeframe-selector > div');
  }

  candleTimeframeButton(label: string): Locator {
    return this.candleTimeframeButtons.filter({ hasText: label });
  }

  async clickCandleTimeframe(label: string) {
    await this.candleTimeframeButton(label).click();
  }

  /** `setCustomTimeRange()`/`handleChangeTypeChart()` đều gọi `this.tvWidget.activeChart()` — nếu click quá
   * sớm (trước khi `tvWidget.onChartReady()` callback của thư viện TradingView charting_library resolve),
   * lệnh gọi này THROW âm thầm trong handler `@click`, khiến state không đổi (không set được `active`) mà
   * KHÔNG phát sinh `pageerror` bắt được (lỗi xảy ra bên trong Vue event handler). Widget tự set
   * `timeFrameSeclected = '1m'` (mặc định) NGAY BÊN TRONG `onChartReady()` — dùng đó làm tín hiệu "đã sẵn
   * sàng" đáng tin cậy hơn nhiều so với chỉ chờ `candleChartContainer` (chỉ xác nhận `<div>` container tồn
   * tại, không xác nhận thư viện bên thứ 3 đã init xong). Gọi hàm này TRƯỚC khi thao tác khung thời gian/icon
   * đổi loại biểu đồ/indicator. */
  async waitForCandleChartReady() {
    await expect(this.candleTimeframeButton('1m')).toHaveClass(/active/, { timeout: 20000 });
  }

  /** Icon đổi loại biểu đồ (`.chart-type-toggle`, chứa `IconChartType` — `<img>` xoay vòng `src` theo thứ tự
   * `candle → line → area → bar → candle`, `chartType: [1, 2, 3, 0]`). */
  get chartTypeToggleIcon(): Locator {
    return this.page.locator('.chart-type-toggle');
  }

  get chartTypeIconImg(): Locator {
    return this.chartTypeToggleIcon.locator('img');
  }

  /** Icon "fx" (`.dropdown-togglee`) mở dropdown 11 chỉ báo kỹ thuật cố định (`.dropdown-list .option-item`). */
  get indicatorFxToggle(): Locator {
    return this.page.locator('.dropdown-togglee');
  }

  get indicatorDropdownList(): Locator {
    return this.page.locator('.dropdown-list');
  }

  get indicatorOptions(): Locator {
    return this.indicatorDropdownList.locator('.option-item');
  }

  indicatorOption(label: string): Locator {
    return this.indicatorOptions.filter({ hasText: label });
  }

  /** Bảng "Thông tin chung" công ty (cột trái, LUÔN mount) — wrapper `.table-common-info` là class DUY NHẤT
   * dùng bởi bảng này trong toàn bộ trang (xem `Left.vue` dòng 104). */
  get companyInfoTable(): Locator {
    return this.page.locator('.table-common-info table');
  }

  get companyInfoRows(): Locator {
    return this.companyInfoTable.locator('tbody tr');
  }

  /** So khớp CHÍNH XÁC nhãn ở cột đầu (không dùng `hasText` substring thô trên cả dòng) — cần thiết vì "Mã" là
   * chuỗi con của "Mã ngành ICB" (2 dòng riêng biệt trong bảng), dùng substring sẽ khớp nhầm cả 2 dòng. */
  companyInfoRowByLabel(label: string): Locator {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.companyInfoRows.filter({ has: this.page.getByText(new RegExp(`^\\s*${escaped}\\s*$`)) });
  }

  /** Thanh 7 sub-tab của `Right.vue` — CÙNG class `ul.nav.nav-tabs` với `mainTabList`/`bfSubTabList` nên lọc
   * theo text "Thông tin tài chính" (nhãn sub-tab mặc định, không trùng bất kỳ tab/sub-tab nào khác trên trang)
   * để phân biệt. */
  get ttcSubTabList(): Locator {
    return this.page.locator('.faAnalysis-page ul.nav.nav-tabs').filter({ hasText: 'Thông tin tài chính' });
  }

  ttcSubTab(name: string): Locator {
    return this.ttcSubTabList.locator('.nav-link', { hasText: name });
  }

  async clickTtcSubTab(name: string) {
    await this.ttcSubTab(name).click();
  }

  /** Bảng snapshot "Thông tin tài chính" (`FinancialInfo.vue`, `table.table-row-stripped`) — bảng THỨ 2 với
   * class này trên trang (bảng thứ 1 luôn là `companyInfoTable`, mount TRƯỚC trong DOM vì `Left.vue` (`CCol
   * xl="3"`) nằm trước `Right.vue` (`CCol xl="9"`) trong `Common/index.vue`). CHỈ đúng khi sub-tab đang active
   * là "Thông tin tài chính" (mặc định) — các sub-tab khác unmount component này (`v-if`). */
  get financialSnapshotTable(): Locator {
    return this.page.locator('.faAnalysis-page table.table-row-stripped').nth(1);
  }

  get financialSnapshotRows(): Locator {
    return this.financialSnapshotTable.locator('tbody tr');
  }

  financialSnapshotRowByLabel(label: string): Locator {
    return this.financialSnapshotRows.filter({ hasText: label });
  }

  /** 3 dòng tiêu đề nhóm màu đỏ ("Tài sản"/"Kết quả kinh doanh"/"Chỉ số tài chính") — nhận diện qua `<td>` có
   * `style` chứa "red" (`item.color === 'red'` trong `Common/index.vue getDataChart()`, khiến `gia_tri_x` luôn
   * rỗng cho các dòng này). */
  get financialSnapshotGroupHeaderRows(): Locator {
    return this.financialSnapshotRows.filter({ has: this.page.locator('td[style*="red"]') });
  }

  /** `CCol xl="3"` của `Right.vue` (biểu đồ phụ trợ: `ChartEconomicInfo`/`ChartAnalysis`/
   * `ChartForeignTransaction`/... tuỳ sub-tab) — nhận diện qua style riêng `height: calc(100vh - 144px)`. LƯU
   * Ý: trình duyệt CHUẨN HOÁ lại biểu thức `calc()` khi serialize (đảo thứ tự toán hạng thành
   * `calc(-144px + 100vh)`), nên KHÔNG match chuỗi gốc trong source — dùng `[style*="144px"]` (chỉ xuất hiện ở
   * đúng 1 phần tử này trong toàn bộ `Common/index.vue`/`Left.vue`) để tránh phụ thuộc cách trình duyệt sắp xếp
   * lại `calc()`. ⚠️ Panel này có thể VẪN BỊ `ProtectedView` gate — mỗi component biểu đồ con
   * (`ChartAnalysis`/`ChartForeignTransaction`/`ChartProprietaryTransaction`/`ChartEvents`) có `ProtectedView`
   * RIÊNG với feature key RIÊNG (`fa_co_dong_va_gd_co_dong_bieu_do`/`fa_nuoc_ngoai_bieu_do`/
   * `fa_tu_doanh_bieu_do`/`fa_bieu_do_co_tuc`), ĐỘC LẬP với feature key của `CCol xl="9"`
   * (`fa_co_dong`/`fa_giao_dich_noi_bo`/`fa_nuoc_ngoai`/`fa_tu_doanh`/`fa_su_kien`) — xem TC_PTCB_TTC_25/26 và
   * mục "Phát hiện đáng chú ý" trong `testcases/phan-tich-co-ban-thong-tin-chung.md` (đã đính chính so với giả
   * định ban đầu "cột phải không bao giờ bị gate"). */
  get rightSidePanel(): Locator {
    return this.page.locator('[style*="144px"]');
  }

  /** 3 `<canvas>` biểu đồ của sub-tab "Thông tin tài chính" (`ChartEconomicInfo`/`ChartEconomicByBank`, dùng
   * `CanvasRenderer` — không assert được text legend/tooltip bên trong, chỉ verify canvas tồn tại). */
  get economicCharts(): Locator {
    return this.rightSidePanel.locator('canvas');
  }

  // ================= Tab "Thông tin chung" — Sub-tab "Hồ sơ" + "Cổ đông" =================
  // Xem testcases/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md — 2/4 tài liệu con của tab "Thông tin
  // chung". Cả 2 sub-tab đọc dữ liệu từ CÙNG API `common-info` với bảng "Thông tin chung" cột trái (KHÔNG đọc
  // `store.state.list_mack_company` ở bất kỳ đâu trong `Profile.vue`/`LeaderShip.vue`/`TableShareHolder.vue`/
  // `ChartAnalysis.vue`) — AN TOÀN 100% khỏi race condition đã ghi nhận ở tab "So sánh"/"Biểu đồ".
  //
  // ⚠️ [BUG dữ liệu] Free — donut "Tổng quan" (Cơ cấu sở hữu) ở "Cổ đông" hiển thị SAI/THIẾU phần "Nước ngoài"
  // VĨNH VIỄN: `Common/index.vue created()` bọc `getListForeignTransaction(true)` (nguồn
  // `so_huu_nuoc_ngoai_final`) trong `if (!isAccountFree)` — tài khoản Free KHÔNG BAO GIỜ gọi API
  // `/api/foreign-trading` (đo network xác nhận: tài khoản trả phí gọi đúng 1 lần, Free gọi 0 lần). Hậu quả
  // (donut hiện "Nước ngoài: %" rỗng + "Khác" bị cộng sai) CHỈ xác nhận được qua ảnh chụp — legend vẽ bằng
  // ECharts `CanvasRenderer`, không phải DOM text thật (`getByText` xác nhận 0 kết quả dù thấy rõ trên ảnh).
  //
  // ⚠️ [BUG hiển thị] Mã không phải cổ phiếu thường (VD ETF `E1VFVN30`): field `so_huu_nha_nuoc` không hợp lệ
  // trong response `common-info` → donut "Tổng quan" hiện "NaN%" cho 2/3 phần (chỉ xác nhận qua ảnh chụp, cùng
  // giới hạn canvas ở trên). Đồng thời `cong_ty_co_dong_items` trả về rỗng → bảng "Cổ đông lớn"
  // (`TableShareHolder.vue`) render 0 dòng, KHÔNG có bất kỳ text "Không có dữ liệu" nào (khác `Events.vue` đã
  // có sẵn `#no-items-view`) — DOM-assertable, dùng `shareHolderRows` để verify.
  //
  // ⚠️ `Profile.vue` (sub-tab "Hồ sơ") KHÔNG bị unmount khi đổi mã CK (chỉ đổi props) — `type_tab` cục bộ của
  // nó (chọn "Lịch sử"/"Ngành nghề") KHÔNG bị reset, khác hành vi "load lại từ đầu" quen thuộc của các bảng
  // khác trong màn hình.
  //
  // ⚠️ Click 1 dòng trong `TableShareHolder.vue` KHÔNG có hành động gì (không có `@click` trong template) —
  // KHÁC hẳn click 1 lãnh đạo trong `LeaderShip.vue` (có `@click="shareholderDetail(item)"` mở modal chi tiết
  // qua `GET common-info/shareholder`).
  //
  // ⚠️ Gate `features_disabled` cho "Cổ đông" có 2 CẤP ĐỘC LẬP (cùng pattern đã ghi nhận ở tài liệu 1/4, phát
  // hiện #1b): `Right.vue` (`CCol xl="9"`, key `fa_co_dong`) và `ChartAnalysis.vue` (`CCol xl="3"`, key
  // `fa_co_dong_va_gd_co_dong_bieu_do`, DÙNG CHUNG với sub-tab "Thông tin giao dịch"). "Hồ sơ" KHÔNG THỂ bị
  // khoá qua cơ chế này ở CẢ 2 cấp — `Right.vue computed: featureName()` không có case cho `'profile'` (luôn
  // `null`), và `LeaderShip.vue` không import/dùng `<ProtectedView>` ở bất kỳ đâu trong code.

  /** 2 sub-tab con "Lịch sử"/"Ngành nghề" của `Profile.vue` (class `.tab-item`, CÙNG class với `Events.vue`
   * nhưng KHÔNG BAO GIỜ mount đồng thời — `Right.vue` chỉ `v-if` 1 trong 7 sub-tab tại 1 thời điểm — nên scope
   * trong `.faAnalysis-page` là đủ an toàn, không cần lọc thêm). */
  get profileSubTabItems(): Locator {
    return this.page.locator('.faAnalysis-page .tab-item');
  }

  profileSubTab(name: string): Locator {
    return this.profileSubTabItems.filter({ hasText: name });
  }

  async clickProfileSubTab(name: string) {
    await this.profileSubTab(name).click();
  }

  /** Đoạn text nội dung "Lịch sử"/"Ngành nghề" (`Profile.vue`, class `.description`) — đổi nội dung tuỳ
   * `type_tab` cục bộ đang chọn, không đổi locator. */
  get profileContent(): Locator {
    return this.page.locator('.faAnalysis-page .description');
  }

  /** Panel "BAN LÃNH ĐẠO" (`LeaderShip.vue`, root class `.profile` — KHÔNG trùng component `Profile.vue`, chỉ
   * trùng tên class CSS tình cờ). Mỗi thành viên là `.item` con trong đó. */
  get leaderShipPanel(): Locator {
    return this.page.locator('.faAnalysis-page .profile');
  }

  get leaderShipItems(): Locator {
    return this.leaderShipPanel.locator('.item');
  }

  leaderShipItem(name: string): Locator {
    return this.leaderShipItems.filter({ hasText: name });
  }

  async clickLeaderShipItem(name: string) {
    await this.leaderShipItem(name).click();
  }

  /** Modal "Thông tin chi tiết" (click 1 lãnh đạo) — CÓ header + nút đóng "×" hoạt động bình thường, dù cùng
   * khai báo class `modal-hide-header-footer` với modal "Thông báo" nâng cấp gói (modal đó thật sự ẩn
   * header/nút đóng, modal này thì KHÔNG — đã xác nhận qua evaluate DOM thật). */
  get leaderDetailModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Thông tin chi tiết' }) });
  }

  get leaderDetailModalCloseBtn(): Locator {
    return this.leaderDetailModal.locator('button.close');
  }

  /** 1 trong 7 section động của modal (chỉ hiện khi mảng dữ liệu tương ứng không rỗng): "Thông tin chung" ·
   * "Chức vụ hiện tại" · "Cổ phiếu đang nắm giữ" · "Cổ phiếu đại diện sở hữu" · "Cá nhân có liên quan" · "Tổ
   * chức có liên quan" · "Quá trình công tác". */
  leaderDetailModalSection(title: string): Locator {
    return this.leaderDetailModal.getByText(title, { exact: true });
  }

  /** Bảng "Cổ đông lớn" (`TableShareHolder.vue`, `table.table-row-stripped` THỨ 2 trên trang khi đang ở
   * sub-tab "Cổ đông" — bảng thứ 1 luôn là `companyInfoTable` ở cột trái, cùng pattern đã dùng cho
   * `financialSnapshotTable`). */
  get shareHolderTable(): Locator {
    return this.page.locator('.faAnalysis-page table.table-row-stripped').nth(1);
  }

  get shareHolderRows(): Locator {
    return this.shareHolderTable.locator('tbody tr');
  }

  /** 2 `<canvas>` donut "Tổng quan" (cơ cấu sở hữu) + "Cổ đông lớn" (`ChartAnalysis.vue`, trong `rightSidePanel`
   * đã khai báo ở section "Thông tin tài chính" — DÙNG CHUNG component này với sub-tab "Thông tin giao dịch"). */
  get shareHolderCharts(): Locator {
    return this.rightSidePanel.locator('canvas');
  }

  get tongQuanLabel(): Locator {
    return this.rightSidePanel.getByText('Tổng quan', { exact: true });
  }

  get coDongLonChartLabel(): Locator {
    return this.rightSidePanel.getByText('Cổ đông lớn', { exact: true });
  }

  // ================= Tab "Thông tin chung" — Sub-tab "Thông tin giao dịch" + "Sự kiện" =================
  // Xem testcases/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md — 3/4 tài liệu con của tab "Thông tin
  // chung".
  //
  // ⚠️ [ĐÍNH CHÍNH] `ChartPriceEvents.vue`/`ChartTradingViewEvents.vue` (biểu đồ nến + modal phóng to P/E-P/B)
  // KHÔNG thuộc sub-tab "Sự kiện" — 2 file này chỉ được `Left.vue` render (đã phủ đủ ở tài liệu 1/4,
  // `candleChartContainer`/`candleTimeframeButtons` ở trên). `Right.vue` cho `type_tab == 'event'` CHỈ render
  // `Events.vue` (`CCol xl="9"`) + `ChartEvents.vue` (`CCol xl="3"`).
  //
  // ⚠️ Panel bên phải "Thông tin giao dịch" tái sử dụng Y HỆT `ChartAnalysis.vue` của "Cổ đông" (donut cơ cấu sở
  // hữu, KHÔNG liên quan giao dịch nội bộ) — dùng lại `rightSidePanel`/`tongQuanLabel`/`coDongLonChartLabel` đã
  // khai báo ở section "Hồ sơ + Cổ đông" phía trên, không khai báo locator riêng.
  //
  // ⚠️ [BUG] Free — đổi mã CK khi đang ở "Sự kiện" KHÔNG gọi lại `GET /get-list-event` (`Common/index.vue
  // watch: stockcode()` bọc lệnh gọi trong `if (!isAccountFree)`, trong khi `created()` gọi KHÔNG điều kiện) —
  // bảng "Sự kiện" giữ nguyên dữ liệu mã CŨ sau khi đổi mã, không cảnh báo. Khác `ProtectedView`/
  // `features_disabled` — sub-tab này KHÔNG bị khoá gói hội viên nên càng dễ khiến người dùng Free tin nhầm dữ
  // liệu đang đúng mã.
  //
  // ⚠️ Cột ngày `TableInfoTransaction.vue` hiển thị RAW `YYYY-MM-DD` (method `formatDate()` định dạng lại
  // `DD-MM-YYYY` tồn tại trong code nhưng KHÔNG được gọi ở template — dead code).
  //
  // ⚠️ Mã không có giao dịch nội bộ (ETF) — bảng "Thông tin giao dịch" trống hoàn toàn, KHÔNG có thông báo, cùng
  // pattern `TableShareHolder.vue` (tài liệu 2/4). Sub-tab con của `Events.vue` KHÔNG bị reset khi đổi mã CK,
  // cùng pattern `Profile.vue` (tài liệu 2/4).
  //
  // ⚠️ Gate `features_disabled` 2 cấp độc lập (tài liệu 1/4, phát hiện #1b): "Thông tin giao dịch" — `Right.vue`
  // (key `fa_giao_dich_noi_bo`) BỊ khoá với tài khoản Free hiện tại, `ChartAnalysis.vue` (key
  // `fa_co_dong_va_gd_co_dong_bieu_do`, DÙNG CHUNG với "Cổ đông") KHÔNG bị khoá — ví dụ minh hoạ CHÍNH đã dùng ở
  // TC_PTCB_TTC_26 (tài liệu 1/4). "Sự kiện" — `Right.vue` (key `fa_su_kien`) và `ChartEvents.vue` (key
  // `fa_bieu_do_co_tuc`) đều KHÔNG bị khoá với tài khoản Free hiện tại.

  /** Bảng "Thông tin giao dịch" (giao dịch nội bộ, `TableInfoTransaction.vue`, `table.table-row-stripped` THỨ 2
   * trên trang khi đang ở sub-tab này — cùng pattern `financialSnapshotTable`/`shareHolderTable`). 2 hàng
   * header (nhóm cột "Người liên quan"/"Đăng ký"/"Kết quả" ở hàng 1, cột con ở hàng 2). */
  get insiderTradingTable(): Locator {
    return this.page.locator('.faAnalysis-page table.table-row-stripped').nth(1);
  }

  get insiderTradingRows(): Locator {
    return this.insiderTradingTable.locator('tbody tr');
  }

  /** Bảng sự kiện (`Events.vue`, `CDataTable add-table-classes="table-row-stripped"` → cũng render
   * `table.table-row-stripped` THỨ 2 trên trang khi đang ở sub-tab "Sự kiện", cùng pattern trên). 4 cột
   * STT/Mã CK/Ngày/Nội dung. Có sẵn slot `#no-items-view` ("Không có dữ liệu") — KHÁC
   * `insiderTradingTable`/`shareHolderTable` (không xử lý rỗng). */
  get eventsTable(): Locator {
    return this.page.locator('.faAnalysis-page table.table-row-stripped').nth(1);
  }

  get eventsRows(): Locator {
    return this.eventsTable.locator('tbody tr');
  }

  get eventsNoDataText(): Locator {
    return this.page.getByText('Không có dữ liệu', { exact: true });
  }

  /** 3 sub-tab con "Niêm yết"/"Cổ tức, thưởng và phát hành thêm"/"Đại hội cổ đông" của `Events.vue` — class
   * `.tab-item`, CÙNG class CSS với 2 sub-tab con "Lịch sử"/"Ngành nghề" của `Profile.vue`
   * (`profileSubTabItems` ở section "Hồ sơ + Cổ đông" phía trên) nhưng KHÔNG BAO GIỜ mount đồng thời (chỉ 1
   * trong 7 sub-tab chính active tại 1 thời điểm) — khai báo alias riêng cho rõ ngữ nghĩa khi đọc spec. */
  get eventsSubTabItems(): Locator {
    return this.page.locator('.faAnalysis-page .tab-item');
  }

  eventsSubTab(name: string): Locator {
    return this.eventsSubTabItems.filter({ hasText: name });
  }

  async clickEventsSubTab(name: string) {
    await this.eventsSubTab(name).click();
  }

  /** Modal "Chi tiết sự kiện" (click 1 dòng trong `eventsTable`, `Events.vue isShowModal`). */
  get eventDetailModal(): Locator {
    return this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Chi tiết sự kiện' }) });
  }

  get eventDetailModalCloseBtn(): Locator {
    return this.eventDetailModal.locator('button.close');
  }

  /** 2 `<canvas>` biểu đồ cột "Cổ tức bằng tiền"/"Cổ tức bằng cổ phiếu" (`ChartEvents.vue`, trong
   * `rightSidePanel` đã khai báo ở section "Thông tin tài chính" phía trên). */
  get eventsCharts(): Locator {
    return this.rightSidePanel.locator('canvas');
  }

  get coTucBangTienLabel(): Locator {
    return this.rightSidePanel.getByText('Cổ tức bằng tiền', { exact: true });
  }

  get coTucBangCoPhieuLabel(): Locator {
    return this.rightSidePanel.getByText('Cổ tức bằng cổ phiếu', { exact: true });
  }

  // ================= Tab "Thông tin chung" — Sub-tab "Nước ngoài" + "Tự doanh" =================
  // Xem testcases/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md — 4/4 (LƯỢT CUỐI) tài liệu con của tab
  // "Thông tin chung".
  //
  // ⚠️ [Kiến trúc] "Nước ngoài" (`TableForeignTransaction.vue`/`ChartForeignTransaction.vue`) KHÔNG tự gọi API
  // — nhận toàn bộ dữ liệu qua props từ `Common/index.vue` (bị gate `isAccountFree` ĐỐI XỨNG ở cả `created()`
  // lẫn `watch: stockcode()` — KHÔNG lặp lại pattern "bất đối xứng" đã ghi ở tài liệu 2/4/3/4, nhưng CHÍNH LÀ
  // nguồn gốc bug donut "Tổng quan" đã ghi nhận ở tài liệu 2/4). "Tự doanh"
  // (`TableProprietaryTransaction.vue`/`ChartProprietaryTransaction.vue`) NGƯỢC LẠI — mỗi component TỰ gọi API
  // RIÊNG (`/api/proprietary-trading/paginate` cho bảng, `/api/proprietary-trading` không phân trang cho biểu
  // đồ), không có check `isAccountFree` nào — hoàn toàn đối xứng, không có bug ẩn dữ liệu sai/thiếu.
  //
  // ⚠️ [Phát hiện MỚI] Free — biểu đồ "Tự doanh" (`CCol xl="3"`) VẪN mount + gọi API lãng phí dù bị
  // `ProtectedView` khoá (chỉ tự gate BÊN TRONG chính nó, `Right.vue` không kiểm tra gate ở cấp `CCol xl="3"`)
  // — khác bảng "Tự doanh" (`CCol xl="9"`), bị `Right.vue` chặn mount HOÀN TOÀN qua `<template v-else>` của
  // gate cấp `CCol xl="9"` nên không lãng phí. Lãng phí network, không phải bug hiển thị sai dữ liệu.
  //
  // ⚠️ Mã ETF tái hiện bug NaN% ở donut "Tổng quan" panel "Nước ngoài" (cùng root cause tài liệu 2/4, dùng
  // chung prop `chartdata_co_cau_so_huu` với `ChartAnalysis.vue`) — chỉ xác nhận qua ảnh chụp (ECharts canvas).
  //
  // ⚠️ Cả 2 bảng không xử lý mảng rỗng (không có "Không có dữ liệu"), cùng pattern các bảng khác trong màn hình.
  //
  // ⚠️ Gate `features_disabled` — "Nước ngoài" VÀ "Tự doanh" là 2 sub-tab DUY NHẤT trong tab "Thông tin chung"
  // bị khoá CẢ 2 CẤP CÙNG LÚC (`CCol xl="9"` + `CCol xl="3"`) với tài khoản Free hiện tại.

  /** Bảng "Nước ngoài" (`TableForeignTransaction.vue`, `table.table-row-stripped` THỨ 2 trên trang khi đang ở
   * sub-tab này — cùng pattern các bảng khác). 2 hàng header (nhóm "Mua"/"Bán" colspan 2 ở hàng 1). LƯU Ý: class
   * CSS `table-foreign-transaction` bị dùng CHUNG cho CẢ bảng "Tự doanh" (copy-paste, vô hại vì style giống
   * nhau) — không dùng class này để phân biệt 2 bảng, luôn dựa vào sub-tab đang active. */
  get foreignTransactionTable(): Locator {
    return this.page.locator('.faAnalysis-page table.table-row-stripped').nth(1);
  }

  get foreignTransactionRows(): Locator {
    return this.foreignTransactionTable.locator('tbody tr');
  }

  /** Bảng "Tự doanh" (`TableProprietaryTransaction.vue`) — CÙNG locator pattern `nth(1)` (chỉ 1 trong 7 sub-tab
   * mount tại 1 thời điểm nên không xung đột với `foreignTransactionTable`). Component TỰ gọi API riêng
   * (`/api/proprietary-trading/paginate`), KHÔNG nhận props từ `Right.vue` — khác `foreignTransactionTable`. */
  get proprietaryTransactionTable(): Locator {
    return this.page.locator('.faAnalysis-page table.table-row-stripped').nth(1);
  }

  get proprietaryTransactionRows(): Locator {
    return this.proprietaryTransactionTable.locator('tbody tr');
  }

  /** Nhãn biểu đồ cột "GDNN mua ròng 20 phiên" (`ChartForeignTransaction.vue`, trong `rightSidePanel` đã khai
   * báo ở section "Thông tin tài chính"). */
  get gdnnChartLabel(): Locator {
    return this.rightSidePanel.getByText('Biểu đồ GDNN mua ròng 20 phiên', { exact: true });
  }

  /** Nhãn biểu đồ cột "GDTD mua ròng 20 phiên" (`ChartProprietaryTransaction.vue`) — CHỈ 1 biểu đồ trong panel
   * này (khác "Nước ngoài" có 2: bar + donut "Tổng quan", vì "Tự doanh" không có khái niệm cơ cấu sở hữu). */
  get gdtdChartLabel(): Locator {
    return this.rightSidePanel.getByText('Biểu đồ GDTD mua ròng 20 phiên', { exact: true });
  }

  /** Link phân trang CoreUI `CPagination` (`nav[aria-label="pagination"]`, dùng chung cấu trúc cho CẢ bảng
   * "Nước ngoài" LẪN "Tự doanh" — chỉ 1 trong 2 mount tại 1 thời điểm). */
  paginationPageLink(pageNumber: number): Locator {
    return this.page.getByRole('navigation', { name: 'pagination' }).getByRole('link', { name: `Go to page ${pageNumber}` });
  }
}
