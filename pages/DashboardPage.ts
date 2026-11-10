import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

export class DashboardPage extends BasePage {
  readonly session: Prev2Session;
  readonly marketTabWrapper: Locator;
  readonly rightPanelExpanded: Locator;
  readonly rightPanelCollapsed: Locator;
  readonly enlargeHeatMapButton: Locator;
  readonly shrinkHeatMapButton: Locator;
  readonly resetLayoutButton: Locator;
  readonly verticalResizers: Locator;
  readonly indexCards: Locator;
  readonly heatMapHeader: Locator;
  readonly heatMapFilterIcon: Locator;
  readonly heatMapResetFilterIcon: Locator;
  readonly heatMapFilterModal: Locator;
  readonly heatMapFilterModalCloseButton: Locator;
  readonly psychoIndexBox: Locator;
  readonly riskIndexBox: Locator;
  readonly panelIbdSubTabs: Locator;
  readonly watchlistPanelHeader: Locator;
  readonly watchlistCategoryDropdown: Locator;
  readonly watchlistCreateButton: Locator;
  readonly watchlistSortIcon: Locator;
  readonly alertPanel: Locator;
  readonly notePanel: Locator;
  readonly socialPanel: Locator;
  readonly marketDisplayToggleIcon: Locator;
  readonly cryptoOverview: Locator;
  readonly marketRowItems: Locator;
  readonly visibleModalCloseButton: Locator;
  readonly viMoLink: Locator;

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    this.marketTabWrapper = page.locator('.column .tab-wrapper').first();
    this.rightPanelExpanded = page.locator('.right-tab-item');
    this.rightPanelCollapsed = page.locator('.v3-dashboard-menu-right-tab-item');
    this.enlargeHeatMapButton = page.locator('[title="Phóng to"]');
    this.shrinkHeatMapButton = page.locator('[title="Thu nhỏ"]');
    // Từ 10/2026 nút là `div[role=button][aria-label]` (trước dùng `title`). Chỉ 1 bản render tại 1 thời điểm:
    // `.btn-reset-resize-expend` (cột phải đang mở) hoặc `.btn-reset-resize` (cột phải thu gọn).
    this.resetLayoutButton = page.getByRole('button', { name: 'Đặt lại bố cục mặc định' });
    this.verticalResizers = page.locator('.resizer-vertical');
    this.indexCards = page.locator('.board-item');
    this.heatMapHeader = page.locator('.header-heat-map');
    this.heatMapFilterIcon = this.heatMapHeader.locator('[title="Lọc tùy chỉnh"]');
    this.heatMapResetFilterIcon = this.heatMapHeader.locator('[title="Đặt lại bộ lọc"]');
    this.heatMapFilterModal = page.locator('.v3-filter-heatmap-container');
    this.heatMapFilterModalCloseButton = page.locator('.v3-filter-heatmap-close-button');
    this.psychoIndexBox = page.locator('.psycho-container', { hasText: 'Chỉ số tâm lý' });
    this.riskIndexBox = page.locator('.psycho-container', { hasText: 'Chỉ số rủi ro' });
    this.panelIbdSubTabs = page.locator('.right-tab-content, .box-infor').last();
    this.watchlistPanelHeader = page.locator('.v3-watchlist-header');
    this.watchlistCategoryDropdown = this.watchlistPanelHeader.locator('.week-selector');
    this.watchlistCreateButton = page.locator('.v3-watchlist-add-new-btn');
    this.watchlistSortIcon = page.locator('.v3-watchlist-icon-box').last();
    this.alertPanel = page.locator('.v3-alert-header').locator('xpath=..');
    this.notePanel = page.locator('.note-container');
    this.socialPanel = page.locator('.community');
    this.marketDisplayToggleIcon = page.locator('.v3-crypto-card-toggle');
    this.cryptoOverview = page.locator('.v3-crypto-root .overview');
    // Foreign.vue (tab Quốc tế) dùng class `.crypto-row-item-container`, Crypto.vue (tab Crypto) dùng
    // `.top-stock-row` — cả 2 đều gọi chung `showModalTradingChart(...)` khi click.
    this.marketRowItems = page.locator('.crypto-row-item-container, .top-stock-row');
    // Modal Trading Chart (và các CModal khác) không unmount khi đóng, chỉ ẩn bằng CSS — luôn dùng
    // `button.close:visible` để chỉ thao tác đúng bản đang thật sự hiển thị trên màn hình.
    this.visibleModalCloseButton = page.locator('button.close:visible');
    // Link "Xem trang vĩ mô" bên trong tab Vĩ mô của Dashboard — scope theo `.marco-chart-item` đầu tiên (mục
    // GDP) để không đụng hàng với link "Vĩ mô" ở sidebar/menu header (cũng trỏ `/vi-mo`).
    this.viMoLink = page.locator('.marco-chart-item').first().locator('a[href="/vi-mo"]');
  }

  /** Đăng nhập prev2 (cache phiên, chặn ghi setting — xem Prev2Session) rồi vào /dashboard, chờ tab thị trường hiện. */
  async open(account: Prev2Account = 'paid') {
    await this.session.open({ account, path: '/dashboard' });
    // Production lúc nhiều phiên test chạy song song có lần > 30 giây mới dựng xong Dashboard.
    await this.marketTab('Việt Nam').waitFor({ timeout: 60_000 });
  }

  async goto() {
    await super.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /** Tab thị trường bên cột trái: "Việt Nam" | "Quốc tế" | "Crypto" | "Sự kiện" | "Vĩ mô". */
  marketTab(name: string): Locator {
    return this.marketTabWrapper.locator('.tab', { hasText: name });
  }

  /** Sub-tab khi bản đồ nhiệt đang ở chế độ mở rộng toàn màn hình (cột trái đã ẩn lúc này nên không đụng
   * hàng với market tab). */
  fullHeatMapSubTab(name: string): Locator {
    return this.page.locator('.tab', { hasText: name });
  }

  /** Tab dọc panel phải (khi đang mở rộng): "IBD" | "Watchlist" | "Ghi chú" (tab "Cảnh báo"/"Cộng đồng" đã gỡ 12/10/2026). */
  rightTab(name: string): Locator {
    return this.rightPanelExpanded.filter({ hasText: name });
  }

  /** Tab dọc panel phải (khi đang thu gọn). */
  collapsedRightTab(name: string): Locator {
    return this.rightPanelCollapsed.filter({ hasText: name });
  }

  indexCard(code: string): Locator {
    return this.indexCards.filter({ hasText: code });
  }

  /** Dropdown lọc bản đồ nhiệt (chế độ thu nhỏ): "Giá trị" | "Sàn" | "Phân loại", chọn theo nhãn hiện tại. */
  heatMapDropdown(currentLabel: string): Locator {
    return this.heatMapHeader.locator('.week-selector', { hasText: currentLabel });
  }

  /** Option trong dropdown lọc bản đồ nhiệt đang mở (dropdown render ở `body`, không lồng trong header). */
  heatMapDropdownOption(label: string): Locator {
    return this.page.locator('.v3-option-item', { hasText: label }).first();
  }

  /** Sub-tab bên trong panel phải (IBD/Alert/Watchlist/Social đều dùng chung pattern `.tabs > .tab-wrapper >
   * .tab`) — không đụng hàng với market tab bên cột trái vì market tab-wrapper không lồng trong `.tabs`.
   * Dùng `:visible` vì 1 số widget (VD Alert.vue) render sẵn 1 bản sao ẩn của cùng cấu trúc tab bên trong
   * modal "Tạo mới" chưa mở (CModal giữ nguyên trong DOM, chỉ ẩn bằng CSS, không unmount) — đã xác nhận qua
   * đọc code, không phải bug. Truyền `within` để scope thêm khi cần. */
  panelSubTab(name: string, within?: Locator): Locator {
    return (within ?? this.page).locator('.tabs .tab:visible', { hasText: name });
  }

  /** Tab lọc trong panel Ghi chú, dùng component `TabsBase.vue` riêng (`.tabs-wrapper > .tab-item`). */
  noteFilterTab(name: string): Locator {
    return this.page.locator('.tabs-wrapper .tab-item', { hasText: name });
  }

  /** Menu tài khoản (avatar góc phải header) → công tắc "Dashboard mới (beta)". */
  accountMenuToggle(): Locator {
    return this.page.locator('.c-header-nav-items .c-avatar, .c-header .c-avatar').first();
  }

  dashboardV3Switch(): Locator {
    return this.page.locator('.dropdown-item', { hasText: 'Dashboard mới (beta)' }).locator('input[type=checkbox]');
  }

  /** Đọc bản lưu bố cục `localStorage.resize` dạng object. */
  async getResizeState(): Promise<Record<string, unknown> | null> {
    return this.page.evaluate(() => { try { return JSON.parse(localStorage.getItem('resize') || 'null'); } catch { return null; } });
  }

  async getResizeFromStorage() {
    return this.page.evaluate(() => localStorage.getItem('resize'));
  }

  /** Kéo thanh chia dọc giữa 2 cột theo `deltaX` px. `index`: 0 = giữa cột A/B, cuối cùng = giữa cột B/C. */
  async dragVerticalResizer(index: number, deltaX: number) {
    const resizer = this.verticalResizers.nth(index);
    const box = await resizer.boundingBox();
    if (!box) throw new Error('Không tìm thấy thanh chia (resizer) để kéo.');
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2, { steps: 10 });
    await this.page.mouse.up();
  }
}
