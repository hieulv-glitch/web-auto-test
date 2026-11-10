import { Page, Locator, FrameLocator, Route, expect } from '@playwright/test';
import { TaReplayLayoutPage, buildLayout, LayoutSpec } from './TaReplayLayoutPage';

/**
 * Trang Biểu đồ (`/phan-tich-ky-thuat`) — 2 tính năng mới trên `preprod` của `stocks`:
 * 1. **Mẫu chỉ báo** (merge `hieu-update/Bieudo-LuuChibao` ~02/11/2026): nút "Mẫu chỉ báo" trên thanh trên cùng của biểu đồ
 *    (`src/utils/chartIndicatorTemplateMenu.js`, menu nằm TRONG iframe TradingView), hộp đặt tên / ghi đè / đổi tên / xoá
 *    (`multiLayoutChart/IndicatorTemplateDialog.vue`, ngoài iframe), lưu ở cài đặt tài khoản khoá `ta_indicator_templates`
 *    (`src/utils/chartIndicatorTemplates.js`).
 * 2. **Liên kết thẻ — kiểu đồng bộ** (03–04/11/2026): mỗi nhóm chọn đồng bộ Mã cổ phiếu / Khung thời gian / Chỉ báo / Trỏ chuột
 *    (`tabLinks.js` LINK_SYNC_KINDS, lưu `config.link_sync` của mọi thẻ trong nhóm), hộp "Đồng bộ giữa các thẻ" khi Tạo nhóm
 *    mới, nút "Chọn đồng bộ" ở bảng Bố cục; "Trỏ chuột" = kéo / thu phóng một thẻ thì thẻ cùng nhóm cùng khung hiện đúng đoạn
 *    thời gian đó (`src/utils/chartLinkedRange.js`, `ReactChartTA.vue` watchLinkedRange/applyLinkedRange).
 *
 * ⚠️ AN TOÀN DỮ LIỆU (backend production): mẫu chỉ báo và bố cục đều lưu qua `/updateusersettings`.
 * - `FakeTemplateStore`: đọc riêng khoá mẫu (`/getusersettings?keys=ta_indicator_templates`) và ghi khoá mẫu đều đi qua máy
 *   chủ giả trong bộ nhớ (chọn được kiểu trả lời ok / chậm / 500 / mất mạng). Ghi các khoá khác (bố cục…) bị huỷ như
 *   `Prev2Session`, body ghi lại ở `otherWrites`.
 * - `/getusersettings` lúc mở trang được sửa: bố cục cố định của test (kèm `link_sync` nếu có), đã xem hướng dẫn Biểu đồ + thẻ
 *   giới thiệu cảnh báo giá, danh sách mẫu ban đầu do test chọn.
 * - Lưới an toàn: mọi request không phải GET khác tới `*.kfsp.vn/api/` bị huỷ (ghi ở `blockedWrites2`); riêng
 *   `/api/activitylog/create` (nhật ký đổi mã) trả thành công giả.
 */
export const TEMPLATES_KEY = 'ta_indicator_templates';

export type ChiBao = { ten: string; thong_so?: Record<string, unknown>; kieu?: Record<string, unknown>; chung_khung_gia?: boolean; an?: boolean };
export type Template = { id: string; ten: string; chi_bao: ChiBao[] };
export type SaveMode = 'ok' | 'slow' | '500' | 'abort';
export type LinkSync = { symbol?: boolean; interval?: boolean; studies?: boolean; range?: boolean; crosshair?: boolean };

export function tpl(ten: string, chi_bao: ChiBao[], id = `autotest-${ten.replace(/\W+/g, '').toLowerCase() || 'x'}`): Template {
  return { id, ten, chi_bao };
}

export class FakeTemplateStore {
  /** Danh sách mẫu "trên máy chủ" (giá trị thô có thể là chuỗi bất kỳ để giả dữ liệu hỏng). */
  raw = '[]';
  mode: SaveMode = 'ok';
  /** Mỗi lần ghi khoá mẫu: mảng mẫu web gửi lên. */
  readonly writes: Template[][] = [];
  /** Số lần web đọc riêng khoá mẫu từ máy chủ. */
  reads = 0;

  get templates(): Template[] { try { return JSON.parse(this.raw); } catch { return []; } }
  set templates(list: Template[]) { this.raw = JSON.stringify(list); }

  async handleRead(route: Route) {
    this.reads++;
    await route.fulfill({ json: [{ key: TEMPLATES_KEY, value: this.raw }] });
  }

  /** Trả true nếu đã xử lý (body có khoá mẫu). */
  async handleWrite(route: Route, listitem: { key: string; value: string }[]): Promise<boolean> {
    const item = listitem.find((i) => i.key === TEMPLATES_KEY);
    if (!item) return false;
    let list: Template[] = [];
    try { list = JSON.parse(item.value); } catch { /* */ }
    this.writes.push(list);
    if (this.mode === 'abort') { await route.abort(); return true; }
    if (this.mode === '500') { await route.fulfill({ status: 500, json: { message: 'Server Error' } }); return true; }
    if (this.mode === 'slow') await new Promise((r) => setTimeout(r, 2500));
    this.raw = item.value;
    await route.fulfill({ json: { status: true } });
    return true;
  }
}

export type TplOpenOptions = {
  account?: 'paid' | 'free';
  layout?: LayoutSpec;
  /** link_sync gán cho mọi thẻ của nhóm (theo id nhóm `link-1`…). Không có → nhóm "cũ" chưa có link_sync. */
  linkSync?: Record<string, LinkSync>;
  /** Mẫu đã lưu trên máy chủ lúc mở trang (mảng hoặc chuỗi thô). */
  templates?: Template[] | string;
};

export const IFRAME = '.ta-chart-layout .TVChartContainer iframe';

export class ChartTemplateLinkPage extends TaReplayLayoutPage {
  readonly store = new FakeTemplateStore();
  readonly otherWrites: { key: string; value: string }[] = [];
  readonly blockedWrites2: string[] = [];
  readonly pageErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
  }

  /** Page của Playwright (BasePage giữ `page` ở dạng protected). */
  get browserPage(): Page { return this.page; }

  async openTpl(opts: TplOpenOptions = {}) {
    const { account = 'paid', layout = { frames: [[{ symbol: 'VNM' }]] }, linkSync, templates = [] } = opts;
    this.store.raw = typeof templates === 'string' ? templates : JSON.stringify(templates);
    let layoutJson = buildLayout(layout);
    if (linkSync) {
      const obj = JSON.parse(layoutJson);
      for (const ts of obj.layout.children) for (const t of ts.children) {
        const s = linkSync[t.config.link];
        if (s) t.config.link_sync = s;
      }
      layoutJson = JSON.stringify(obj);
    }
    // Lưới an toàn — đăng ký TRƯỚC (route đăng ký sau được hỏi trước).
    await this.page.route(/^https:\/\/[^/]*kfsp\.vn\/api\//, async (route) => {
      const r = route.request();
      if (r.method() === 'GET' || r.method() === 'OPTIONS' || /\/api\/login(\?|$)/.test(r.url())) return route.fallback();
      if (/\/api\/activitylog\/create/.test(r.url())) return route.fulfill({ json: { success: true } });
      this.blockedWrites2.push(`${r.method()} ${r.url().split('?')[0]}`);
      return route.abort();
    });
    await this.session.open({
      account, path: '/phan-tich-ky-thuat',
      patchSettings: (all) => {
        const own = ['layout_multi_ta', 'layout_multi_ta_free', 'ta_onboarding_seen', 'chart_alert_intro_seen', TEMPLATES_KEY];
        const items = all.filter((i) => !own.includes(i.key));
        items.push({ key: 'layout_multi_ta', value: layoutJson }, { key: 'layout_multi_ta_free', value: layoutJson },
          { key: 'ta_onboarding_seen', value: '1' }, { key: 'chart_alert_intro_seen', value: '1' },
          { key: TEMPLATES_KEY, value: this.store.raw });
        return items;
      },
      clearKeysAfterLogin: ['layout_multi_ta', 'layout_multi_ta_free', 'ta_onboarding_seen', TEMPLATES_KEY],
    });
    // Sau khi Prev2Session cài route của nó: đọc/ghi riêng khoá mẫu đi qua máy chủ giả (route sau được hỏi trước).
    await this.page.route(/\/getusersettings\?.*keys=ta_indicator_templates/, (route) => this.store.handleRead(route));
    await this.page.route(/\/updateusersettings(\?|$)/, async (route) => {
      let listitem: { key: string; value: string }[] = [];
      try { listitem = JSON.parse(route.request().postData() || '{}').listitem || []; } catch { /* */ }
      if (await this.store.handleWrite(route, listitem)) return;
      this.otherWrites.push(...listitem);
      await route.abort();
    });
    await this.chartTabs.first().waitFor({ state: 'visible', timeout: 60000 });
  }

  /** Bố cục mới nhất web định ghi (đã chặn), đọc lại config từng thẻ. */
  lastLayoutTabs(): { name: string; config: Record<string, unknown> }[] {
    const w = [...this.otherWrites].reverse().find((i) => i.key === 'layout_multi_ta');
    if (!w) return [];
    const obj = JSON.parse(w.value);
    const out: { name: string; config: Record<string, unknown> }[] = [];
    const walk = (n: { type?: string; name?: string; config?: Record<string, unknown>; children?: unknown[] }) => {
      if (n.type === 'tab' && n.config && (n.config as { symbol?: string }).symbol) out.push({ name: n.name || '', config: n.config });
      for (const c of (n.children || []) as typeof n[]) walk(c);
    };
    walk(obj.layout);
    return out;
  }

  // ================= Biểu đồ trong iframe =================
  frameAt(i = 0): FrameLocator { return this.page.frameLocator(IFRAME).nth(i); }

  /** Chạy `body` với `chart = tradingViewApi.activeChart()` của iframe thứ i (đang hiện). */
  async chartApi<T>(i: number, body: string, arg?: unknown): Promise<T> {
    return this.page.evaluate(([sel, idx, code, a]) => {
      const frames = Array.from(document.querySelectorAll(sel as string)).filter((e) => (e as HTMLElement).offsetParent) as HTMLIFrameElement[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = (frames[idx as number].contentWindow as any).tradingViewApi;
      // eslint-disable-next-line no-new-func
      return new Function('api', 'chart', 'arg', code as string)(api, api.activeChart(), a);
    }, [IFRAME, i, body, arg] as const) as Promise<T>;
  }

  /** Tên các chỉ báo đang có trên biểu đồ thứ i (theo thứ tự getAllStudies). */
  studies(i = 0): Promise<string[]> { return this.chartApi<string[]>(i, 'return chart.getAllStudies().map(s => s.name);'); }
  /** Giá trị input của chỉ báo tên `name` trên biểu đồ i. */
  studyInputs(i: number, name: string): Promise<Record<string, unknown> | null> {
    return this.chartApi(i, `const s = chart.getAllStudies().find(x => x.name === arg); if (!s) return null;
      const o = {}; chart.getStudyById(s.id).getInputValues().forEach(v => { o[v.id] = v.value; }); return o;`, name);
  }
  symbol(i = 0): Promise<string> { return this.chartApi<string>(i, 'return String(chart.symbol()).split(":").pop();'); }
  resolution(i = 0): Promise<string> { return this.chartApi<string>(i, 'return chart.resolution();'); }
  visibleRange(i = 0): Promise<{ from: number; to: number }> { return this.chartApi(i, 'const r = chart.getVisibleRange(); return { from: r.from, to: r.to };'); }

  // ================= Mẫu chỉ báo =================
  templateButton(i = 0): Locator { return this.frameAt(i).locator('.custom-button-wrapper', { hasText: 'Mẫu chỉ báo' }); }
  templateMenu(i = 0): Locator { return this.frameAt(i).locator('.custom-template-menu'); }
  templateSaveRow(i = 0): Locator { return this.templateMenu(i).locator('.custom-dropdown-menu-item', { hasText: 'Lưu chỉ báo thành mẫu…' }); }
  templateRows(i = 0): Locator { return this.templateMenu(i).locator('.custom-template-row'); }
  templateRow(name: string, i = 0): Locator {
    return this.templateRows(i).filter({ has: this.frameAt(i).locator('.custom-template-name', { hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) });
  }
  async templateNames(i = 0): Promise<string[]> { return this.templateRows(i).locator('.custom-template-name').allInnerTexts(); }
  async openTemplateMenu(i = 0) {
    await this.templateButton(i).click();
    await expect(this.templateMenu(i)).toBeVisible();
  }

  get dialog(): Locator { return this.page.locator('.itd-modal .modal'); }
  get dialogTitle(): Locator { return this.page.locator('.itd-modal .modal-title'); }
  get dialogBody(): Locator { return this.page.locator('.itd-modal .modal-body'); }
  get nameInput(): Locator { return this.page.locator('#itd-name'); }
  get nameError(): Locator { return this.page.locator('.itd-loi'); }
  dialogBtn(name: 'Huỷ' | 'Lưu' | 'Ghi đè' | 'Xoá'): Locator {
    return this.page.locator('.itd-modal .itd-actions').getByRole('button', { name, exact: true });
  }
  get toastError(): Locator { return this.page.locator('.Vue-Toastification__toast--error'); }

  // ================= Liên kết thẻ — kiểu đồng bộ =================
  get createSyncRows(): Locator { return this.linkCreateMenu.locator('.ta-link-create-row'); }
  createSyncBox(label: string): Locator { return this.createSyncRows.filter({ hasText: label }).locator('input[type=checkbox]'); }
  get createOk(): Locator { return this.linkCreateMenu.getByRole('button', { name: 'Tạo nhóm', exact: true }); }
  groupSyncToggle(groupName: string): Locator { return this.layoutPanel.getByRole('button', { name: `Chọn đồng bộ của nhóm ${groupName}` }); }
  groupSyncPanel(groupName: string): Locator { return this.layoutPanel.getByRole('group', { name: `Đồng bộ của nhóm ${groupName}` }); }
  groupSyncBox(groupName: string, label: string): Locator {
    return this.groupSyncPanel(groupName).locator('label.ta-link-check', { hasText: label }).locator('input[type=checkbox]');
  }
}
