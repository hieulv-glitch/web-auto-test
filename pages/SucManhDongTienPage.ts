import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object cho màn "Sức mạnh dòng tiền" (`/suc-manh-dong-tien`), 1 trong 3 màn con của menu
 * "Toàn cảnh thị trường". Route này bị đăng ký TRÙNG PATH 2 lần trong `stocks/src/router/index.js`
 * (lần 1 dòng ~523: `IBD` với `props: { type: "rrg" }` — ĐÂY LÀ COMPONENT THẬT SỰ RENDER, xác nhận qua
 * DOM live; lần 2 dòng ~682: `RRGChart` — route CHẾT, không bao giờ khớp vì Vue Router ưu tiên route đăng ký
 * trước). `IBD` (type="rrg") delegate sang `WrapperLayout.vue` rồi render thẳng
 * `stocks/src/views/rrg/RRG.vue` — cùng 1 file `RRG.vue` mà route chết cũng trỏ tới, nên nội dung UI không đổi,
 * chỉ khác đường vào (route chết không dùng `WrapperLayout` bọc ngoài).
 *
 * Layout 2 panel chia đôi màn hình:
 * - `#left_panel` (~40%): 3 tab "Bảng dữ liệu" / "Watchlist" / "Ngành", mỗi tab 1 bảng dữ liệu riêng.
 * - `#right_panel` (~60%): 2 tab "Biểu đồ RRG" / "Biểu đồ RS".
 * Giữa 2 panel có `#resize_bar` kéo được để đổi tỉ lệ.
 */
export class SucManhDongTienPage extends BasePage {
  readonly leftPanel: Locator;
  readonly rightPanel: Locator;
  readonly resizeBar: Locator;
  readonly searchInput: Locator;
  readonly searchSuggestions: Locator;
  readonly searchMoreOptionsToggle: Locator;
  readonly deleteAllMacksOption: Locator;
  readonly selectAllCheckbox: Locator;
  readonly watchlistCategorySelect: Locator;
  readonly watchlistMackInput: Locator;
  readonly watchlistAddIcon: Locator;
  readonly addWatchlistModal: Locator;
  /** Modal biểu đồ/chi tiết mã CK dùng chung toàn site (`store.state.isShowModalTradingChart`), mở khi click
   * link mã CK trong bảng. Cùng pattern nhận diện đã dùng ở `TradingLogPage.stockChartModal` — lọc theo text
   * "Hồ sơ" (heading cố định trong panel `TabInfo`) vì nội dung biểu đồ nến nằm trong `<iframe>` tách biệt. */
  readonly tradingChartModal: Locator;
  readonly referenceInput: Locator;
  readonly sliderContainer: Locator;
  readonly sliderKnob: Locator;
  readonly sliderValueLabel: Locator;
  readonly rrgChartCanvas: Locator;
  readonly rsChartCanvas: Locator;
  readonly rsEmptyPlaceholder: Locator;
  readonly liveClock: Locator;
  readonly tooltipTitle: Locator;
  readonly tooltipDate: Locator;
  readonly tooltipMomentum: Locator;
  readonly tooltipStrength: Locator;
  readonly protectedViews: Locator;

  constructor(page: Page) {
    super(page);
    this.leftPanel = page.locator('#left_panel');
    this.rightPanel = page.locator('#right_panel');
    this.resizeBar = page.locator('#resize_bar');

    // Tab "Bảng dữ liệu"
    this.searchInput = page.getByPlaceholder('Nhập tên mã cổ phiếu để thêm vào danh sách');
    this.searchSuggestions = this.leftPanel.locator('.search-stockcode_item');
    this.searchMoreOptionsToggle = this.leftPanel.locator('.btn-more-option');
    this.deleteAllMacksOption = page.getByText('Xóa tất cả', { exact: true });
    this.selectAllCheckbox = this.leftPanel.locator('.col-checkbox input[type="checkbox"]').first();

    // Tab "Watchlist"
    this.watchlistCategorySelect = this.leftPanel.getByRole('combobox');
    this.watchlistMackInput = this.leftPanel.getByPlaceholder('Mã CK');
    this.watchlistAddIcon = this.leftPanel.locator('.icon-add-stock');
    // Component dropdown này giữ 1 instance ẩn luôn tồn tại trong DOM ngoài instance vừa mở (cùng pattern
    // CModal ở TradingLogPage/FaAnalysisPage) → luôn lọc `:visible`.
    this.addWatchlistModal = page.locator('.watch-list-dropdown-container:visible');
    this.tradingChartModal = page.locator('.modal.show.d-block:visible').filter({ hasText: 'Hồ sơ' });

    // Panel phải — điều khiển chung cho cả 2 tab biểu đồ
    // MackReferences.vue không đặt placeholder/label — chỉ phân biệt được bằng class riêng, scoped vào
    // #right_panel vì lớp "btn-search-stockcode" bị dùng trùng tên ở cả input thêm mã watchlist bên trái.
    this.referenceInput = this.rightPanel.locator('.btn-search-stockcode input');
    this.sliderContainer = this.rightPanel.locator('.range-slider');
    this.sliderKnob = this.rightPanel.locator('.range-slider-knob');
    // KHÔNG neo ^...$ — Vue render khoảng trắng giữa 2 mustache khác chuỗi match tuyệt đối, chỉ cần chứa đúng
    // cụm "<số> Ngày/Tuần/Tháng" là đủ phân biệt với các <p> khác trong panel phải.
    this.sliderValueLabel = this.rightPanel.locator('p').filter({ hasText: /\d+\s+(Ngày|Tuần|Tháng)/ });
    this.liveClock = page.locator('#rrg-time');

    // Tab "Biểu đồ RRG" / "Biểu đồ RS"
    this.rrgChartCanvas = this.rightPanel.locator('.chart-container canvas');
    this.rsChartCanvas = this.rightPanel.locator('canvas');
    this.rsEmptyPlaceholder = page.getByText('Hiện chưa có mã nào, hãy chọn thêm mã ở bên trái để hiển thị biểu đồ');

    // Tooltip RRG (render thật ra DOM bởi ECharts, KHÔNG phải vẽ trên canvas — đã verify bằng automation).
    this.tooltipTitle = page.locator('.tooltip-title');
    // "Ngày:"/"Đà:"/"Sức mạnh:" render là text node trần nằm chung container với tiêu đề/badge khác, không phải
    // 1 element text riêng — regex neo ^ (match từ đầu toàn bộ text nối của element) không khớp được, phải dùng
    // substring match (exact:false) như đã verify thủ công.
    this.tooltipDate = page.getByText('Ngày:', { exact: false });
    this.tooltipMomentum = page.getByText('Đà:', { exact: false });
    this.tooltipStrength = page.getByText('Sức mạnh:', { exact: false });

    // Paywall (tài khoản Free) — mỗi bảng/biểu đồ có 1 `<ProtectedView>` riêng khi bị khoá.
    this.protectedViews = page.locator('.image-container');
  }

  async goto() {
    await super.goto('/suc-manh-dong-tien');
    await this.page.waitForLoadState('networkidle');
  }

  leftTab(name: 'Bảng dữ liệu' | 'Watchlist' | 'Ngành'): Locator {
    return this.leftPanel.locator('a.nav-link').filter({ hasText: name });
  }

  rightTab(name: 'Biểu đồ RRG' | 'Biểu đồ RS'): Locator {
    return this.rightPanel.locator('a.nav-link').filter({ hasText: name });
  }

  /** 1 dòng trong bảng đang active ở panel trái (VirtualList ở tab Bảng dữ liệu/Watchlist, table thường ở tab Ngành). */
  rowOf(mackOrNganh: string): Locator {
    return this.leftPanel.locator('.list-item-wrapper, tbody tr').filter({ hasText: mackOrNganh });
  }

  checkboxOf(mackOrNganh: string): Locator {
    return this.rowOf(mackOrNganh).getByRole('checkbox');
  }

  mackLinkOf(mack: string): Locator {
    return this.rowOf(mack).getByRole('link', { name: mack, exact: true });
  }

  /** Icon 3-chấm dọc mở dropdown "Thêm vào watchlist" / "Xóa khỏi danh sách" của 1 dòng (chỉ có ở tab Bảng dữ liệu). */
  rowOptionsToggle(mack: string): Locator {
    return this.rowOf(mack).locator('.dropdown-watchlist-item');
  }

  get addToWatchlistMenuItem(): Locator {
    return this.page.getByText('Thêm vào watchlist', { exact: true });
  }

  get removeFromListMenuItem(): Locator {
    return this.page.getByText('Xóa khỏi danh sách', { exact: true });
  }

  async searchAndAddMack(mack: string) {
    await this.searchInput.fill(mack);
    await this.searchSuggestions.first().waitFor({ state: 'visible' });
    await this.searchSuggestions.first().click();
  }

  /** Kéo knob của range-slider (1-50 ngày) sang trái/phải theo % chiều rộng track (0..1). */
  async dragSliderToPercent(percent: number) {
    const box = await this.sliderContainer.boundingBox();
    if (!box) throw new Error('Không lấy được vị trí slider');
    const targetX = box.x + box.width * Math.min(Math.max(percent, 0), 1);
    const targetY = box.y + box.height / 2;
    const knobBox = await this.sliderKnob.boundingBox();
    const startX = knobBox ? knobBox.x + knobBox.width / 2 : box.x;
    const startY = knobBox ? knobBox.y + knobBox.height / 2 : targetY;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, targetY, { steps: 10 });
    await this.page.mouse.up();
  }

  /** Hover 1 điểm trên canvas RRG theo toạ độ tuyệt đối trong page để kích hoạt tooltip ECharts.
   * Cần 2 bước di chuyển (rời khỏi rồi tới) để ECharts nhận đúng sự kiện mousemove trên canvas. */
  async hoverChartPoint(x: number, y: number) {
    await this.page.mouse.move(x - 20, y - 20);
    await this.page.mouse.move(x, y, { steps: 10 });
    await this.page.mouse.move(x + 1, y + 1, { steps: 2 });
  }

  /**
   * Quét lưới toạ độ trên canvas RRG để tìm và hover đúng 1 điểm dữ liệu (đường quỹ đạo), rồi verify tooltip
   * (`.tooltip-title`) xuất hiện. KHÔNG dùng toạ độ cố định — vị trí điểm phụ thuộc dữ liệu real-time thật của
   * mã đang chọn, đổi mỗi ngày, nên phải dò thay vì hard-code. Trả về `true` nếu tìm thấy trong `maxCols x
   * maxRows` lần thử.
   */
  async hoverUntilTooltipVisible(maxCols = 10, maxRows = 8): Promise<boolean> {
    const box = await this.rrgChartCanvas.first().boundingBox();
    if (!box) return false;
    let lastX = box.x;
    let lastY = box.y;
    for (let r = 1; r < maxRows; r++) {
      for (let c = 1; c < maxCols; c++) {
        const x = box.x + (box.width * c) / maxCols;
        const y = box.y + (box.height * r) / maxRows;
        // ECharts chỉ nhận diện đúng hover khi có chuỗi sự kiện mousemove thật (nhiều bước), 1 cú "nhảy" toạ độ
        // đơn lẻ không kích hoạt tooltip — đã xác nhận qua thử nghiệm thủ công trước khi viết spec này.
        await this.page.mouse.move(lastX, lastY);
        await this.page.mouse.move(x, y, { steps: 5 });
        lastX = x;
        lastY = y;
        if (await this.tooltipTitle.first().isVisible().catch(() => false)) return true;
      }
    }
    return false;
  }
}
