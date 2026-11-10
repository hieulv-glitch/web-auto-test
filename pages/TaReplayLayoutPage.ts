import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, prev2Account } from './Prev2Session';

/**
 * Phần MỚI của trang "Phân tích kỹ thuật" (`/phan-tich-ky-thuat`): Replay, nút Bố cục (chia khung + Đặt lại bố cục),
 * Liên kết thẻ, cột nút thu gọn/mở rộng, hướng dẫn lần đầu. Nguồn: nhánh `thanh/replay-phan-tich-ky-thuat` của
 * `stocks` — `ChartReplayBar.vue`, `ChartLayoutPicker.vue`, `TaOnboarding.vue`, `tabLinks.js`, `index.vue`,
 * `reactMultiLayoutChart.js` (nay đã lên preprod/production). Môi trường: `PREV2_BASE_URL` (09/11/2026 = https://kfsp.vn),
 * đăng nhập qua `Prev2Session` (tài khoản TEST_USER_* hoặc FREE_USER_*, backend production).
 *
 * ⚠️ AN TOÀN DỮ LIỆU — khác hẳn cách làm của `TechnicalChartPage` (phải chờ debounce rồi dọn tab):
 * Mọi thứ tính năng này lưu theo tài khoản (bố cục `layout_multi_ta`, cờ `ta_onboarding_seen`, liên kết thẻ nằm
 * trong bố cục) đều đi qua 2 API `/updateusersettings` và `/delusersettings`. `open()` CHẶN (abort) cả 2 API này
 * cho MỌI test, nên chia khung/liên kết thẻ/đóng hướng dẫn... chỉ đổi trên trình duyệt, KHÔNG ghi gì lên tài
 * khoản. Đồng thời `open()` sửa response `/getusersettings` để thay bố cục đã lưu bằng 1 bố cục cố định do test
 * chọn (`layout`) — test không phụ thuộc bố cục thật của tài khoản (lúc khảo sát là 5 khung, 16 thẻ) và không
 * bao giờ đọc/ghi thẻ thật của người dùng. Các khoá chỉ lưu theo trình duyệt (`ta_tools_collapsed`,
 * `ta_replay_selection`) nằm trong localStorage của context riêng từng test, tự mất khi test kết thúc.
 */

export type TabSpec = { symbol: string; interval?: string; link?: string };
export type LayoutSpec = { frames: TabSpec[][]; vertical?: boolean; selected?: number[] };


const BORDERS = [
  { name: 'AI Chart', component: 'tab-ai', className: 'kfsp-ai-tab' },
  { name: 'Thông tin', component: 'tab-info' },
  { name: 'Watchlist', component: 'tab-watchlist' },
  { name: 'Cảnh báo', component: 'tab-alert' },
  { name: 'Ghi chú', component: 'tab-note' },
  { name: 'Cộng đồng', component: 'tab-community' },
];

/** Dựng chuỗi JSON `layout_multi_ta` (định dạng flexlayout-react đọc từ `/getusersettings` thật) cho 1 hàng
 * khung ngang (hoặc dọc nếu `vertical`). Mỗi khung là 1 tabset; id thẻ đặt cố định `#autotest-<khung>-<thẻ>`. */
export function buildLayout(spec: LayoutSpec): string {
  let n = 0;
  const tabsets = spec.frames.map((tabs, fi) => ({
    type: 'tabset',
    id: `#autotest-frame-${fi}`,
    weight: 100 / spec.frames.length,
    selected: spec.selected?.[fi] ?? 0,
    ...(fi === 0 ? { active: true } : {}),
    children: tabs.map((t, ti) => ({
      type: 'tab',
      id: `#autotest-${fi}-${ti}-${n++}`,
      name: `${t.symbol} ${t.interval ?? '1D'}`,
      component: 'chartTA',
      config: { symbol: t.symbol, interval: t.interval ?? '1D', is_changed_name: false, link: t.link ?? 'link-6' },
    })),
  }));
  return JSON.stringify({
    global: { splitterSize: 4, splitterExtra: 4, borderEnableDrop: false, ...(spec.vertical ? { rootOrientationVertical: true } : {}) },
    borders: [{
      type: 'border', barSize: 32, size: 350, minSize: 350, location: 'right',
      children: BORDERS.map((b, i) => ({ type: 'tab', id: `#autotest-border-${i}`, enableClose: false, enableDrag: false, ...b })),
    }],
    layout: { type: 'row', id: '#autotest-root', children: tabsets },
  });
}

/** Bố cục mặc định cho test: 2 khung cạnh nhau — khung 1 có 2 thẻ (VNM đang mở, FPT bị che), khung 2 có HPG. */
export const LAYOUT_2_FRAMES: LayoutSpec = {
  frames: [[{ symbol: 'VNM' }, { symbol: 'FPT' }], [{ symbol: 'HPG' }]],
};
export const LAYOUT_1_FRAME: LayoutSpec = { frames: [[{ symbol: 'VNM' }]] };

export type OpenOptions = {
  account?: 'paid' | 'free';
  layout?: LayoutSpec;
  /** false → bỏ cờ `ta_onboarding_seen` khỏi setting tài khoản để giả lập người dùng mới (hướng dẫn tự hiện). */
  onboardingSeen?: boolean;
  /** Giá trị khởi tạo `localStorage.ta_tools_collapsed`: '0' mở cột nút (mặc định), '1' thu gọn, null không đặt. */
  toolsCollapsed?: '0' | '1' | null;
};

/** Tài khoản: dùng chung `Prev2Session` (TEST_USER_* trả phí, FREE_USER_* miễn phí — `PREV2_USER_*` cũ không còn đăng nhập
 * được từ khi prev2 gọi backend production, 09/11/2026). Giữ tên export cũ cho spec. */
export { prev2Account };

export class TaReplayLayoutPage extends BasePage {
  readonly session: Prev2Session;

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
  }

  /** Body (dạng `{"listitem":[…]}` như request thật) của mọi lần ghi setting đã bị chặn — để assert "đã định ghi gì". */
  get blockedWrites(): string[] { return this.session.settingWrites.map((w) => JSON.stringify({ listitem: [w] })); }

  // ================= Chuẩn bị =================
  async open(opts: OpenOptions = {}) {
    const { account = 'paid', layout = LAYOUT_2_FRAMES, onboardingSeen = true, toolsCollapsed = '0' } = opts;
    const layoutJson = buildLayout(layout);
    if (toolsCollapsed !== null) {
      await this.page.addInitScript((v) => {
        try { if (localStorage.getItem('ta_tools_collapsed') === null) localStorage.setItem('ta_tools_collapsed', v); } catch { /* */ }
      }, toolsCollapsed);
    }
    // Đăng nhập (dùng lại phiên cache) + chặn ghi setting + thay bố cục đã lưu bằng bố cục cố định của test.
    await this.session.open({
      account, path: '/phan-tich-ky-thuat',
      patchSettings: (all) => {
        const items = all.filter((i) => i.key !== 'layout_multi_ta' && i.key !== 'layout_multi_ta_free'
          && (onboardingSeen || i.key !== 'ta_onboarding_seen'));
        items.push({ key: 'layout_multi_ta', value: layoutJson }, { key: 'layout_multi_ta_free', value: layoutJson });
        if (onboardingSeen && !items.some((i) => i.key === 'ta_onboarding_seen')) items.push({ key: 'ta_onboarding_seen', value: '1' });
        return items;
      },
      // Đăng nhập xong app chép setting thật (bố cục, cờ hướng dẫn) vào localStorage — bỏ để test tự quyết.
      clearKeysAfterLogin: ['layout_multi_ta', 'layout_multi_ta_free', 'ta_onboarding_seen'],
    });
    await this.chartTabs.first().waitFor({ state: 'visible', timeout: 60000 });
  }

  /** Chờ MỌI khung đang hiện dựng xong biểu đồ TradingView (legend của mã đã hiện trong iframe). Chỉ chờ iframe
   * xuất hiện là chưa đủ — đã gặp khi chạy song song: bấm Chạy/tốc độ/đổi mã lúc biểu đồ chưa sẵn sàng thì trang
   * bỏ qua lặng lẽ (Replay chỉ nhận ô có `tvWidget` + `replayFeed`), test treo tới hết timeout. */
  async waitChartsReady() {
    const frames = this.page.locator('.TVChartContainer iframe:visible');
    await expect(frames.first()).toBeAttached({ timeout: 45000 });
    const n = await frames.count();
    for (let i = 0; i < n; i++) {
      await expect(frames.nth(i).contentFrame().locator('[data-name="legend-source-item"]').first())
        .toBeVisible({ timeout: 60000 });
    }
    await this.page.waitForTimeout(1500);
  }

  // ================= Khung / thẻ =================
  get chartTabs(): Locator { return this.page.locator('.flexlayout__tab_button'); }
  get tabsets(): Locator { return this.page.locator('.ta-chart-layout .flexlayout__tabset'); }
  tab(name: string): Locator { return this.chartTabs.filter({ hasText: name }); }
  tabMark(name: string): Locator { return this.tab(name).locator('[data-ta-tab]'); }
  get splitters(): Locator { return this.page.locator('.ta-chart-layout .flexlayout__splitter:not(.flexlayout__splitter_border)'); }
  get addTabBtn(): Locator { return this.page.locator('.btn-add-chart').first(); }
  get freeUpgradeBtn(): Locator { return this.page.locator('.ta-free-upgrade'); }
  get packageModal(): Locator { return this.page.getByRole('dialog').filter({ hasText: 'Chọn dịch vụ' }); }

  /** Đóng popup "Chọn dịch vụ" bằng nút × ở góc (Esc không ổn định: lúc đóng lúc không tuỳ phần tử đang focus). */
  async closePackageModal() {
    await this.packageModal.locator('button.close').first().click();
    await expect(this.packageModal).toBeHidden();
  }

  /** `data-ta-link` của mọi thẻ biểu đồ theo thứ tự trên trang (`link-1`…`link-5`, `link-6` = không liên kết). */
  async tabLinks(): Promise<string[]> {
    return this.page.locator('[data-ta-tab]').evaluateAll((els) => els.map((e) => e.getAttribute('data-ta-link') || ''));
  }

  /** [x, y, width, height] (làm tròn) của từng khung theo thứ tự DOM. */
  async tabsetRects(): Promise<number[][]> {
    return this.tabsets.evaluateAll((els) => els.map((e) => {
      const r = e.getBoundingClientRect();
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
    }));
  }

  /** Kéo bằng chuột thật từ giữa phần tử theo (dx, dy); `alt` giữ phím Alt suốt lúc kéo. */
  async dragBy(target: Locator, dx: number, dy: number, alt = false) {
    const b = (await target.boundingBox())!;
    const x = b.x + Math.min(50, b.width / 2);
    const y = b.y + Math.min(50, b.height / 2);
    if (alt) await this.page.keyboard.down('Alt');
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + dx, y + dy, { steps: 10 });
    await this.page.mouse.up();
    if (alt) await this.page.keyboard.up('Alt');
    await this.page.waitForTimeout(600);
  }

  // ================= Nút công cụ (Replay, Bố cục, AI) =================
  /** Khung `.ta-tools`: cửa sổ ≥ 1130 thì nằm trên thanh đầu trang (`#ta-header-tools`), hẹp hơn thì ở cột mép phải. */
  get replayFab(): Locator { return this.page.locator('.ta-tools .ta-replay-fab:not(.ta-layout-fab)'); }
  /** Nút "AI" mở/đóng tab AI Chart — chỉ có khi nút công cụ nằm trên thanh đầu trang (từ 07/10/2026). */
  get aiBtn(): Locator { return this.page.locator('.ta-tools .ta-head-ai'); }
  get layoutFab(): Locator { return this.page.getByRole('button', { name: 'Bố cục', exact: true }); }

  // ================= Thanh Replay =================
  get replayBar(): Locator { return this.page.locator('.ta-replay'); }
  get replayDate(): Locator { return this.page.getByLabel('Ngày bắt đầu chiếu lại'); }
  get replayPlay(): Locator { return this.page.locator('.ta-replay-play'); }
  get replayStep(): Locator { return this.page.getByRole('button', { name: 'Tiến 1 nến' }); }
  get replayLive(): Locator { return this.page.getByRole('button', { name: 'Về hiện tại' }); }
  get replaySpeedBtn(): Locator { return this.page.locator('.ta-replay-speedbtn'); }
  get replaySpeedList(): Locator { return this.page.getByRole('listbox', { name: 'Tốc độ chiếu lại' }); }
  get replayStatus(): Locator { return this.page.locator('.ta-replay-status'); }
  get replaySelBtn(): Locator { return this.page.getByRole('button', { name: 'Chọn khung và thẻ biểu đồ' }); }
  get replaySelPanel(): Locator { return this.page.getByRole('dialog', { name: 'Chọn biểu đồ chiếu lại' }); }
  get replayClose(): Locator { return this.page.getByRole('button', { name: 'Đóng Replay' }).and(this.page.locator('.ta-replay-close')); }
  get replayGrip(): Locator { return this.page.locator('.ta-replay-grip'); }

  async openReplay() {
    await this.waitChartsReady();
    await this.replayFab.click();
    await expect(this.replayBar).toBeVisible();
  }

  /** Đặt ngày bắt đầu (YYYY-MM-DD) — ô `type=date`, `fill` bắn sự kiện input/change như người dùng chọn lịch. */
  async setReplayDate(iso: string) {
    await this.replayDate.fill(iso);
    await this.replayDate.dispatchEvent('change');
  }

  /** Bấm Chạy rồi chờ biểu đồ nạp xong nến để nút Tiến 1 nến bật (READY_FALLBACK_MS 4s trong mã). */
  async startReplay() {
    await this.replayPlay.click();
    await expect(this.replayStatus).toBeVisible({ timeout: 15000 });
  }

  /** Đổi mã CK của khung đang chọn qua ô tìm kiếm gốc TradingView (cùng cách với `phan-tich-ky-thuat-bieu-do`). */
  async changeActiveSymbol(symbol: string) {
    const frame = this.page.frameLocator('.border-active .TVChartContainer iframe');
    await frame.locator('#header-toolbar-symbol-search:visible').first().click();
    await this.page.keyboard.type(symbol, { delay: 40 });
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  // ================= Bảng Bố cục =================
  get layoutPanel(): Locator { return this.page.locator('.ta-layout-panel'); }
  layoutPreset(name: string): Locator { return this.layoutPanel.getByRole('button', { name, exact: true }); }
  get layoutPresetButtons(): Locator { return this.layoutPanel.locator('.ta-layout-item'); }
  get layoutPresetActive(): Locator { return this.layoutPanel.locator('.ta-layout-item.on'); }
  get resetLayoutBtn(): Locator { return this.layoutPanel.getByRole('button', { name: 'Đặt lại bố cục' }); }
  get createLinkGroupBtn(): Locator { return this.layoutPanel.getByRole('button', { name: 'Tạo nhóm liên kết' }); }
  get linkGroupRows(): Locator { return this.layoutPanel.locator('.ta-link-group'); }

  async openLayoutPanel() {
    await this.layoutFab.click();
    await expect(this.layoutPanel).toBeVisible();
  }

  // ================= Liên kết thẻ =================
  get linkBar(): Locator { return this.page.locator('.ta-link-bar'); }
  linkBarAction(name: string): Locator { return this.linkBar.getByRole('button', { name, exact: true }); }
  /** Hộp "Đồng bộ giữa các thẻ" mở từ nút "Tạo nhóm mới" (từ 04/11/2026). */
  get linkCreateMenu(): Locator { return this.linkBar.locator('.ta-link-create'); }
  /** "Tạo nhóm mới" → hộp chọn kiểu đồng bộ (mặc định tích khung thời gian + chỉ báo) → "Tạo nhóm". */
  async createLinkGroupFromBar() {
    await this.linkBarAction('Tạo nhóm mới').click();
    await expect(this.linkCreateMenu).toBeVisible();
    await this.linkCreateMenu.getByRole('button', { name: 'Tạo nhóm', exact: true }).click();
  }

  /** Giữ Ctrl bấm thẻ: `tabLinks.js` bắt `mousedown` (pha capture) có `ctrlKey` — dùng click thật có modifier. */
  async ctrlClickTab(name: string) {
    await this.tab(name).click({ modifiers: ['Control'] });
  }

  // ================= Hướng dẫn lần đầu =================
  get onboardingCard(): Locator { return this.page.locator('.ta-ob-card'); }
  get onboardingCount(): Locator { return this.page.locator('.ta-ob-count'); }
  get onboardingTitle(): Locator { return this.page.locator('.ta-ob-title'); }
  onboardingBtn(name: 'Bỏ qua' | 'Quay lại' | 'Tiếp' | 'Xong'): Locator {
    return this.onboardingCard.getByRole('button', { name, exact: true });
  }
}
