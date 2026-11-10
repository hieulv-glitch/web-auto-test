import { Page, Locator, FrameLocator, Route, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account, prev2Account } from './Prev2Session';
import { buildLayout, LayoutSpec } from './TaReplayLayoutPage';

/**
 * Cảnh báo giá trên biểu đồ (tính năng mới trên `preprod` của `stocks`, merge 16–20/10/2026):
 * `src/utils/chartPriceAlerts.js` (đường cảnh báo, dòng "Tạo cảnh báo … tại …" của menu chuột phải, bấm đường để sửa),
 * `TabAlert/PriceAlertQuick.vue` (hộp Tạo/Sửa cảnh báo giá), `ChartAlertIntro.vue` (thẻ giới thiệu lần đầu),
 * `utils/chartDisplayMenu.js` (tick "Cảnh báo giá" trong nút "Biểu đồ"), `TabAlert/PriceAlertBell.vue` (chuông cạnh
 * Kế hoạch giá ở NKGD). Môi trường: prev2 (https://prev2.vietpointer.vn) — bản build đang chạy code preprod mới nhất.
 *
 * ⚠️ prev2 hiện gọi **backend production** (`api2.kfsp.vn`, `users.kfsp.vn`, đo ngày 09/11/2026) → tài khoản test là
 * tài khoản kfsp.vn (`TEST_USER_*` trả phí, `FREE_USER_*` miễn phí). Tài khoản `PREV2_USER_*_Free` cũ không đăng
 * nhập được nữa.
 *
 * ⚠️ AN TOÀN DỮ LIỆU — cảnh báo giá lưu trên máy chủ theo tài khoản THẬT (production):
 * - Mọi API `/api/stocks/user-alert/*` được thay bằng `FakeAlertServer` trong bộ nhớ: tạo/sửa/xoá trong test không
 *   chạm cảnh báo thật của tài khoản, và mỗi test tự chọn cảnh báo ban đầu.
 * - `/updateusersettings` + `/delusersettings` bị chặn (abort) — tick "Cảnh báo giá", cờ "đã xem giới thiệu", bố cục
 *   PTKT… chỉ đổi trên trình duyệt. Body bị chặn được ghi lại ở `settingWrites` để assert "định ghi gì". Setting
 *   được web gom 1 giây rồi mới gửi (`SaveSettingDebouncer` trong store.js) → assert bằng `expect.poll`.
 * - `/getusersettings` được sửa response: bố cục PTKT cố định (1 khung VNM), `ta_onboarding_seen=1`, còn
 *   `chart_alert_intro_seen` / `tradingview.show_price_alerts` / `darkMode` do test chọn.
 */

export type AlertRecord = {
  id: number;
  condition_key: 'COND_PRICE_UP' | 'COND_PRICE_DOWN' | string;
  type_condition: string;
  sub_condition_key: string;
  condition_value: string;
  stockcode: string;
  is_active: number;
  frequency: number;
  key_join: string;
  condition_label: string;
};

const LABEL_UP = 'Giá tăng lên chạm một mức giá cố định';
const LABEL_DOWN = 'Giá giảm xuống một mức giá cố định';

/** Tạo 1 bản ghi cảnh báo giá đúng định dạng máy chủ thật trả về (chụp từ `get-all` ngày 09/11/2026). */
export function priceAlert(stockcode: string, up: boolean, value: number, opts: { repeat?: boolean; active?: boolean; id?: number } = {}): AlertRecord {
  const key = up ? 'COND_PRICE_UP' : 'COND_PRICE_DOWN';
  return {
    id: opts.id ?? 0,
    condition_key: key,
    type_condition: 'COND_PRICE',
    sub_condition_key: '',
    condition_value: String(value),
    stockcode,
    is_active: opts.active === false ? 0 : 1,
    frequency: opts.repeat ? 1 : 0,
    key_join: `${stockcode}~${key}`,
    condition_label: up ? LABEL_UP : LABEL_DOWN,
  };
}

export type SaveMode = 'ok' | 'slow' | '500' | '422' | '400' | 'abort';
export type UpdateBody = { user_alerts: Partial<AlertRecord>[]; old_user_alerts: Partial<AlertRecord>[] };

/** Máy chủ cảnh báo giả trong bộ nhớ (thay `/api/stocks/user-alert/*`). */
export class FakeAlertServer {
  alerts: AlertRecord[] = [];
  /** Body (bỏ token) của mọi POST `update/v2` — kể cả lần trả lỗi. */
  readonly updates: UpdateBody[] = [];
  /** URL của mọi POST user-alert khác (vd `update-status-active-alert`) — bị chặn, chỉ ghi lại. */
  readonly otherWrites: string[] = [];
  /** Mã đã được hỏi qua `get-by-stockcode/v2`, theo thứ tự. */
  readonly reads: string[] = [];
  mode: SaveMode = 'ok';
  /** true → GET đọc cảnh báo trả 500. */
  readFails = false;
  /** Thông báo lỗi trả về ở mode '422' (`error`) / '400' (`message`). */
  errorMessage = 'Thông báo lỗi giả từ máy chủ';
  private nextId = 9000;

  seed(list: AlertRecord[]) {
    this.alerts = list.map((a) => ({ ...a, id: a.id || this.nextId++ }));
  }

  forCode(code: string) {
    return this.alerts.filter((a) => a.stockcode === code);
  }

  async install(page: Page) {
    await page.route(/\/api\/stocks\/user-alert\//, async (route: Route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (req.method() === 'GET') {
        if (this.readFails) return route.fulfill({ status: 500, json: { message: 'Server Error' } });
        if (/get-by-stockcode/.test(url.pathname)) {
          const code = url.searchParams.get('stockcode') || '';
          this.reads.push(code);
          return route.fulfill({ json: this.forCode(code) });
        }
        return route.fulfill({ json: this.alerts });
      }
      if (!/\/update\/v2$/.test(url.pathname)) {
        this.otherWrites.push(url.pathname);
        return route.fulfill({ json: { ok: true } });
      }
      let body: UpdateBody & { token?: string } = { user_alerts: [], old_user_alerts: [] };
      try { body = JSON.parse(req.postData() || '{}'); } catch { /* giữ rỗng */ }
      delete body.token;
      this.updates.push(body);
      if (this.mode === 'abort') return route.abort('internetdisconnected');
      if (this.mode === '500') return route.fulfill({ status: 500, json: { message: 'Server Error' } });
      if (this.mode === '422') return route.fulfill({ status: 422, json: { error: this.errorMessage } });
      if (this.mode === '400') return route.fulfill({ status: 400, json: { message: this.errorMessage } });
      if (this.mode === 'slow') await new Promise((r) => setTimeout(r, 2500));
      this.apply(body);
      return route.fulfill({ json: { status: true } });
    });
  }

  private apply(body: UpdateBody) {
    for (const old of body.old_user_alerts || []) {
      this.alerts = this.alerts.filter((a) => !(old.id ? a.id === old.id
        : a.stockcode === old.stockcode && a.condition_key === old.condition_key && String(a.condition_value) === String(old.condition_value)));
    }
    for (const a of body.user_alerts || []) {
      this.alerts.push({
        ...priceAlert(a.stockcode!, a.condition_key === 'COND_PRICE_UP', Number(a.condition_value)),
        ...(a as AlertRecord),
        condition_value: String(a.condition_value),
        id: this.nextId++,
      });
    }
  }
}

// ---- Đăng nhập prev2 + cache phiên: dùng chung `Prev2Session` (pages/Prev2Session.ts) ----
type Account = Prev2Account;
/** Giữ tên cũ cho spec Cảnh báo giá. */
export const alertAccount = prev2Account;

export type AlertOpenOptions = {
  account?: Account;
  /** Trang mở sau khi đăng nhập. */
  path?: string;
  /** Bố cục PTKT bơm vào setting (mặc định 1 khung VNM). */
  layout?: LayoutSpec;
  /** false → bỏ cờ `chart_alert_intro_seen` để thẻ giới thiệu tự hiện (mặc định true = đã xem). */
  introSeen?: boolean;
  /** Giá trị setting `tradingview.show_price_alerts` (mặc định không đặt = đường cảnh báo hiện). */
  showLines?: boolean;
  darkMode?: boolean;
  /** Cảnh báo ban đầu của máy chủ giả. */
  alerts?: AlertRecord[];
};

export const TA_IFRAME = '.ta-chart-layout .TVChartContainer iframe';
export const MODAL_IFRAME = '.modal.show .TVChartContainer iframe';
export const PTCB_IFRAME = '.tv-chart-wrapper iframe';

export class PriceAlertPage extends BasePage {
  readonly server = new FakeAlertServer();
  readonly session: Prev2Session;
  /** `listitem` của mọi lần ghi setting đã bị chặn, theo thứ tự. */
  readonly settingWrites: { key: string; value: unknown }[];
  readonly pageErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    this.settingWrites = this.session.settingWrites;
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
  }

  // ================= Chuẩn bị =================
  async open(opts: AlertOpenOptions = {}) {
    const { account = 'paid', path: target = '/phan-tich-ky-thuat', layout = { frames: [[{ symbol: 'VNM' }]] },
      introSeen = true, showLines, darkMode = false, alerts = [] } = opts;
    this.server.seed(alerts);
    await this.server.install(this.page);
    const layoutJson = buildLayout(layout);
    const own = ['layout_multi_ta', 'layout_multi_ta_free', 'ta_onboarding_seen', 'chart_alert_intro_seen',
      'tradingview.show_price_alerts', 'darkMode'];
    await this.session.open({
      account, path: target,
      patchSettings: (all) => {
        const items = all.filter((i) => !own.includes(i.key));
        items.push({ key: 'layout_multi_ta', value: layoutJson }, { key: 'layout_multi_ta_free', value: layoutJson },
          { key: 'ta_onboarding_seen', value: '1' }, { key: 'darkMode', value: String(darkMode) });
        if (introSeen) items.push({ key: 'chart_alert_intro_seen', value: '1' });
        if (showLines !== undefined) items.push({ key: 'tradingview.show_price_alerts', value: String(showLines) });
        return items;
      },
      // Đăng nhập xong app đã chép setting thật vào localStorage — xoá các khoá test tự quyết trước khi vào trang.
      clearKeysAfterLogin: ['chart_alert_intro_seen', 'tradingview.show_price_alerts'],
    });
  }

  /** Vào trang Biểu đồ và chờ biểu đồ VNM (bố cục mặc định) nạp xong + đường cảnh báo đã vẽ. */
  async openChart(opts: AlertOpenOptions = {}) {
    await this.open({ ...opts, path: '/phan-tich-ky-thuat' });
    await this.waitChartReady(TA_IFRAME);
  }

  /** Bật cờ "vừa lưu cảnh báo" của store (`alertSavedAt`) — đúng việc hộp cảnh báo làm sau khi lưu xong: mọi biểu đồ
   * đang mở đọc lại cảnh báo và vẽ lại đường. Dùng sau khi test đổi dữ liệu máy chủ giả. */
  async bumpAlertSaved() {
    await this.page.evaluate(() => {
      type VueEl = Element & { __vue__?: { $store?: { state: { alertSavedAt: number } } } };
      const el = Array.from(document.querySelectorAll('.c-app, body *')).find((e) => (e as VueEl).__vue__?.$store) as VueEl | undefined;
      if (!el) throw new Error('Không tìm thấy Vue store trên trang');
      el.__vue__!.$store!.state.alertSavedAt = Date.now();
    });
  }

  // ================= Biểu đồ TradingView (trong iframe) =================
  frame(iframeSel = TA_IFRAME): FrameLocator { return this.page.frameLocator(iframeSel).first(); }

  async waitChartReady(iframeSel = TA_IFRAME) {
    await expect(this.frame(iframeSel).locator('[data-name="legend-source-item"]').first()).toBeVisible({ timeout: 60000 });
    await expect.poll(() => this.chartApi(iframeSel, 'return !!api.activeChart().symbolExt()'), { timeout: 30000 }).toBe(true);
    await this.page.waitForTimeout(1500);
  }

  /** Chạy `fn(api)` với `api` = `tradingViewApi` của iframe biểu đồ (API nội bộ thư viện, cùng origin). */
  async chartApi<T = unknown>(iframeSel: string, body: string): Promise<T> {
    return this.page.evaluate(([sel, b]) => {
      const f = Array.from(document.querySelectorAll(sel)).find((e) => (e as HTMLElement).offsetParent) as HTMLIFrameElement | undefined;
      const api = f && (f.contentWindow as unknown as { tradingViewApi?: unknown }).tradingViewApi;
      if (!api) return null;
      // eslint-disable-next-line no-new-func
      return new Function('api', b)(api);
    }, [iframeSel, body] as const) as Promise<T>;
  }

  async chartSymbol(iframeSel = TA_IFRAME): Promise<string> {
    // symbolExt() trả null trong lúc đang đổi mã.
    return (await this.chartApi<string>(iframeSel, 'const s = api.activeChart().symbolExt(); return s ? s.name : ""')) || '';
  }

  /** Các đường cảnh báo đang vẽ: text, giá (nghìn đồng), có đang hiện chữ không, màu, có khoá không. */
  async alertLines(iframeSel = TA_IFRAME): Promise<{ text: string; price: number; showLabel: boolean; color: string; locked: boolean }[]> {
    return (await this.chartApi(iframeSel, `const c = api.activeChart();
      return c.getAllShapes().filter(s => s.name === 'horizontal_line').map(s => {
        const sh = c.getShapeById(s.id); const p = sh.getProperties();
        return { text: p.text, price: sh.getPoints()[0].price, showLabel: !!p.showLabel, color: p.linecolor, locked: !!sh.isSelectionEnabled && !sh.isSelectionEnabled() || !!p.frozen };
      });`)) as never || [];
  }

  /** Chờ tới khi có đúng `count` đường và id của chúng không đổi trong 1,5 giây. Lượt vẽ đầu tiên của biểu đồ chờ nến
   * nạp xong (`dataReady`) nên có thể tới muộn, xoá rồi vẽ lại đường đúng lúc test đang bấm vào đường. */
  async waitLinesStable(count: number, iframeSel = TA_IFRAME) {
    const ids = () => this.chartApi<string[]>(iframeSel, `return api.activeChart().getAllShapes().filter(s => s.name === 'horizontal_line').map(s => s.id).sort();`);
    let prev = '';
    for (let i = 0; i < 20; i++) {
      const now = JSON.stringify(await ids());
      if (now === prev && JSON.parse(now).length === count) return;
      prev = now;
      await this.page.waitForTimeout(1500);
    }
    throw new Error(`Đường cảnh báo chưa ổn định: ${prev}`);
  }

  async alertLineTexts(iframeSel = TA_IFRAME): Promise<string[]> {
    return (await this.alertLines(iframeSel)).map((l) => l.text).sort();
  }

  /** Khoảng giá đang nhìn thấy của khung giá chính (nghìn đồng). */
  async visibleRange(iframeSel = TA_IFRAME): Promise<{ from: number; to: number }> {
    return (await this.chartApi(iframeSel, `const r = api.activeChart().getPanes()[0].getMainSourcePriceScale().getVisiblePriceRange(); return { from: r.from, to: r.to };`)) as never;
  }

  /** Toạ độ trên trang của 1 mức giá (nghìn đồng), ở 45% bề ngang biểu đồ. */
  async pointAtPrice(price: number, iframeSel = TA_IFRAME): Promise<{ x: number; y: number }> {
    const geo = await this.page.evaluate(([sel]) => {
      const f = Array.from(document.querySelectorAll(sel)).find((e) => (e as HTMLElement).offsetParent) as HTMLIFrameElement;
      const pane = f.contentDocument!.querySelector('.chart-markup-table.pane') as HTMLElement;
      const fr = f.getBoundingClientRect();
      const pr = pane.getBoundingClientRect();
      return { left: fr.left, top: fr.top, paneTop: pr.top, paneLeft: pr.left, paneW: pr.width };
    }, [iframeSel] as const);
    const scale = await this.chartApi<{ from: number; to: number; h: number }>(iframeSel,
      `const p = api.activeChart().getPanes()[0]; const r = p.getMainSourcePriceScale().getVisiblePriceRange(); return { from: r.from, to: r.to, h: p.getHeight() };`);
    return {
      x: geo.left + geo.paneLeft + geo.paneW * 0.45,
      y: geo.top + geo.paneTop + ((scale.to - price) / (scale.to - scale.from)) * scale.h,
    };
  }

  /** 2 mức giá tròn 100đ nằm ở 30% và 70% chiều cao khung giá — để tạo cảnh báo giả luôn nằm trong vùng nhìn thấy. */
  async pricesInView(iframeSel = TA_IFRAME): Promise<{ high: number; low: number }> {
    const r = await this.visibleRange(iframeSel);
    const round = (k: number) => Math.round((k * 1000) / 100) * 100;
    return { high: round(r.to - (r.to - r.from) * 0.3), low: round(r.to - (r.to - r.from) * 0.7) };
  }

  async rightClickAt(point: { x: number; y: number }) {
    await this.page.mouse.click(point.x, point.y, { button: 'right' });
  }

  /** Menu chuột phải gốc của TradingView (trong iframe). */
  tvMenu(iframeSel = TA_IFRAME): Locator { return this.frame(iframeSel).locator('[data-name="menu-inner"]'); }
  tvMenuCreateRow(iframeSel = TA_IFRAME): Locator {
    return this.tvMenu(iframeSel).getByText(/^Tạo cảnh báo [A-Z0-9]+ tại [\d,]+$/);
  }
  async tvMenuRows(iframeSel = TA_IFRAME): Promise<string[]> {
    return this.tvMenu(iframeSel).locator('[data-role="menuitem"], [class*="item-"]').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean));
  }

  /** Nút "Biểu đồ ▾" tự viết trên thanh đầu biểu đồ và menu của nó. */
  displayMenuButton(iframeSel = TA_IFRAME): Locator { return this.frame(iframeSel).locator('.custom-button-wrapper:visible').first(); }
  displayMenu(iframeSel = TA_IFRAME): Locator { return this.frame(iframeSel).locator('.custom-dropdown-menu'); }
  displayMenuRow(label: string, iframeSel = TA_IFRAME): Locator {
    return this.displayMenu(iframeSel).locator('.custom-dropdown-menu-item').filter({ hasText: new RegExp(`^${label}$`) });
  }

  // ================= Menu nhỏ (biểu đồ chỉ có dòng cảnh báo: PTCB, Cơ hội tiềm năng) =================
  get smallMenu(): Locator { return this.page.getByRole('menu').and(this.page.locator('.kfsp-chart-menu')); }
  get smallMenuItems(): Locator { return this.smallMenu.getByRole('menuitem'); }

  // ================= Hộp Tạo / Sửa cảnh báo giá =================
  get box(): Locator { return this.page.locator('.paq'); }
  get boxOverlay(): Locator { return this.page.locator('.paq-overlay'); }
  get boxTitle(): Locator { return this.box.locator('.paq-title > span'); }
  get boxClose(): Locator { return this.box.getByRole('button', { name: 'Đóng' }); }
  get boxStock(): Locator { return this.box.locator('.paq-stock b'); }
  get boxLast(): Locator { return this.box.locator('.paq-last'); }
  get boxPrice(): Locator { return this.box.getByLabel('Giá', { exact: true }); }
  get boxUp(): Locator { return this.box.getByRole('button', { name: 'Giá tăng lên tới' }); }
  get boxDown(): Locator { return this.box.getByRole('button', { name: 'Giá giảm xuống tới' }); }
  get boxRepeat(): Locator { return this.box.getByRole('switch', { name: 'Lặp lại' }); }
  get boxCreate(): Locator { return this.box.getByRole('button', { name: 'Tạo cảnh báo', exact: true }); }
  get boxSaveNext(): Locator { return this.box.getByRole('button', { name: 'Lưu & tạo tiếp' }); }
  get boxSave(): Locator { return this.box.getByRole('button', { name: 'Lưu', exact: true }); }
  get boxDelete(): Locator { return this.box.getByRole('button', { name: 'Xoá', exact: true }); }

  /** 'up' | 'down' — nút chiều nào đang bật (lớp `on`). */
  async boxDirection(): Promise<'up' | 'down'> {
    return (await this.boxUp.getAttribute('class'))?.split(/\s+/).includes('on') ? 'up' : 'down';
  }

  /** Giá trong ô, đổi về số (đồng). */
  async boxValue(): Promise<number> {
    return Number((await this.boxPrice.inputValue()).replace(/,/g, '')) || 0;
  }

  /** Mở hộp Tạo cảnh báo từ menu chuột phải của biểu đồ TradingView, tại mức giá `price` (nghìn đồng) hoặc giữa khung. */
  async openCreateFromMenu(price?: number, iframeSel = TA_IFRAME): Promise<string> {
    const point = price !== undefined ? await this.pointAtPrice(price, iframeSel) : await this.pointAtPrice((await this.pricesInView(iframeSel)).high / 1000, iframeSel);
    await this.rightClickAt(point);
    const row = this.tvMenuCreateRow(iframeSel);
    await expect(row).toBeVisible();
    const text = (await row.innerText()).trim();
    await row.click();
    await expect(this.box).toBeVisible();
    return text;
  }

  /** Xoá hết rồi gõ giá mới vào ô (gõ từng phím như người dùng). */
  async typePrice(text: string) {
    await this.boxPrice.click();
    await this.boxPrice.press('Control+A');
    await this.boxPrice.press('Backspace');
    if (text) await this.boxPrice.pressSequentially(text, { delay: 20 });
  }

  // ================= Thẻ giới thiệu lần đầu =================
  get intro(): Locator { return this.page.locator('.cai-card'); }
  get introTitle(): Locator { return this.intro.locator('.cai-title'); }
  get introCount(): Locator { return this.intro.locator('.cai-count'); }
  get introText(): Locator { return this.intro.locator('.cai-text'); }
  get introDots(): Locator { return this.intro.getByRole('group', { name: 'Các bước' }).getByRole('button'); }
  get introFrame(): Locator { return this.page.locator('.cai-frame'); }
  introBtn(name: string | RegExp): Locator { return this.intro.getByRole('button', { name, exact: typeof name === 'string' }); }

  // ================= Modal "Chọn dịch vụ" (tài khoản Free) =================
  get packageModal(): Locator { return this.page.getByRole('dialog').filter({ hasText: 'Chọn dịch vụ' }); }

  // ================= Toast =================
  /** Toast lỗi của web (`vue-toastification`, `this.$toast.error`). */
  get toastError(): Locator { return this.page.locator('.Vue-Toastification__toast--error'); }
}
