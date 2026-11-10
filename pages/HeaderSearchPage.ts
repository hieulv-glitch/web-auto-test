import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Ô "Tìm mã chứng khoán" trên header (tính năng mới trên `preprod` của `stocks`, 03–04/11/2026):
 * `src/containers/TheHeaderSearchStock.vue` — gõ mã/tên (không dấu cũng được, `timMaCoPhieu` trong function_global.js),
 * tối đa 5 dòng, phím ↑/↓/Enter/Esc, chọn mã → mở modal biểu đồ nhanh dùng chung của TheContainer (`moDoThiMa`), ô trống
 * thì hiện "Mã gần đây" (localStorage `kfsp_header_search_recent`). Ô ẩn khi cửa sổ ≤ 1140px (`.d-1130-down-none`).
 *
 * Môi trường: `PREV2_BASE_URL` (đang trỏ kfsp.vn — production = preprod mới nhất). Backend production nên:
 * - Lưới an toàn huỷ mọi request không phải GET tới `*.kfsp.vn/api/` (ghi lại ở `blockedWrites`); riêng
 *   `/api/activitylog/create` (app tự ghi nhật ký "đổi mã" mỗi lần biểu đồ đổi mã) trả thành công giả, ghi ở `activityLogs`.
 * - Ghi setting + lựa chọn Dashboard do `Prev2Session` chặn/giả lập.
 * Ô tìm mã không có API ghi nào: mã gần đây chỉ lưu ở localStorage trình duyệt.
 */
export const RECENT_KEY = 'kfsp_header_search_recent';
export const MODAL = '.modal.show';
export const MODAL_CHART_IFRAME = '.modal.show .TVChartContainer iframe';

export type HeaderSearchOpenOptions = {
  account?: Prev2Account;
  path?: string;
  /** Giá trị thô ghi vào localStorage `kfsp_header_search_recent` trước khi mở trang (chuỗi = ghi nguyên văn). */
  recent?: string[] | string | null;
};

export class HeaderSearchPage extends BasePage {
  readonly session: Prev2Session;
  readonly blockedWrites: string[] = [];
  readonly activityLogs: unknown[] = [];
  readonly pageErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
  }

  /** Page của Playwright (BasePage giữ `page` ở dạng protected). */
  get browserPage(): Page { return this.page; }

  async open(opts: HeaderSearchOpenOptions = {}) {
    const { account = 'paid', path = '/dashboard', recent } = opts;
    // Lưới an toàn đăng ký TRƯỚC (route đăng ký sau — của Prev2Session — được hỏi trước).
    await this.page.route(/^https:\/\/[^/]*kfsp\.vn\/api\//, async (route) => {
      const r = route.request();
      if (r.method() === 'GET' || r.method() === 'OPTIONS' || /\/api\/login(\?|$)/.test(r.url())) return route.fallback();
      if (/\/api\/activitylog\/create/.test(r.url())) {
        try { this.activityLogs.push(JSON.parse(r.postData() || '{}')); } catch { this.activityLogs.push(r.postData()); }
        return route.fulfill({ json: { success: true } });
      }
      this.blockedWrites.push(`${r.method()} ${r.url().split('?')[0]}`);
      return route.abort();
    });
    if (recent !== undefined) {
      // Chỉ ghi 1 lần ở khung trang chính: init script cũng chạy trong iframe TradingView (cùng origin) và sẽ ghi đè lại
      // danh sách mà web vừa cập nhật.
      const raw = recent === null ? null : typeof recent === 'string' ? recent : JSON.stringify(recent);
      await this.page.addInitScript(([key, value]) => {
        try {
          if (window.top !== window || sessionStorage.getItem('__autotest_recent_seeded')) return;
          if (value === null) localStorage.removeItem(key as string); else localStorage.setItem(key as string, value as string);
          sessionStorage.setItem('__autotest_recent_seeded', '1');
        } catch { /* */ }
      }, [RECENT_KEY, raw] as const);
    }
    await this.session.open({ account, path });
    await expect(this.input).toBeVisible({ timeout: 30_000 });
    await this.waitStockList();
  }

  /** Danh sách mã (`store.state.list_mack`) nạp qua socket sau khi trang mở — gõ trước lúc đó sẽ ra "Không tìm thấy". */
  async waitStockList() {
    await expect.poll(() => this.page.evaluate(() => {
      type VueEl = Element & { __vue__?: { $store?: { state: { list_mack: unknown } } } };
      const el = Array.from(document.querySelectorAll('.c-app, body *')).find((e) => (e as VueEl).__vue__?.$store) as VueEl | undefined;
      const list = el?.__vue__?.$store?.state.list_mack;
      return Array.isArray(list) ? list.length : 0;
    }), { timeout: 30_000 }).toBeGreaterThan(100);
  }

  // ---------------- Ô nhập + hộp gợi ý ----------------
  get input(): Locator { return this.page.getByPlaceholder('Tìm mã chứng khoán'); }
  get wrapper(): Locator { return this.page.locator('.header-search'); }
  get magnifier(): Locator { return this.page.locator('.header-search svg'); }
  get dropdown(): Locator { return this.page.locator('.header-search-dropdown'); }
  get dropdownTitle(): Locator { return this.dropdown.locator('.header-search-title'); }
  get items(): Locator { return this.dropdown.locator('.header-search-item'); }
  get activeItem(): Locator { return this.dropdown.locator('.header-search-item.active'); }
  get empty(): Locator { return this.dropdown.locator('.header-search-empty'); }
  item(code: string): Locator {
    // Chữ của ô mã = "<mã><sàn>" kèm khoảng trắng đầu dòng của template → so theo nút chữ đầu tiên.
    return this.items.filter({ has: this.page.locator('.header-search-code', { hasText: new RegExp('^\\s*' + code + '\\s*(HOSE|HNX|UPCOM)?\\s*$') }) });
  }

  /** Mã của từng dòng đang hiện (bỏ nhãn sàn). */
  async codes(): Promise<string[]> {
    return this.items.locator('.header-search-code').evaluateAll((els) =>
      els.map((e) => (e.firstChild?.textContent || '').trim()));
  }
  async activeCode(): Promise<string> {
    return (await this.activeItem.locator('.header-search-code').evaluate((e) => e.firstChild?.textContent || '')).trim();
  }

  /** Gõ từ khoá rồi chờ hộp ổn định (danh sách dừng thay đổi). */
  async type(text: string) {
    await this.input.click();
    await this.input.fill(text);
    if (!text.trim()) return;
    await expect(this.dropdown).toBeVisible();
    let last = '';
    await expect.poll(async () => {
      const now = (await this.dropdown.innerText().catch(() => '')).trim();
      const stable = now !== '' && now === last;
      last = now;
      return stable;
    }, { intervals: [300] }).toBe(true);
  }

  async recentStorage(): Promise<unknown> {
    return this.page.evaluate((k) => {
      const raw = localStorage.getItem(k);
      try { return raw === null ? null : JSON.parse(raw); } catch { return raw; }
    }, RECENT_KEY);
  }

  // ---------------- Modal biểu đồ nhanh ----------------
  get modal(): Locator { return this.page.locator(MODAL); }
  get modalTitle(): Locator { return this.modal.locator('.modal-title'); }
  get modalClose(): Locator { return this.modal.locator('button.close'); }
  get modalWatchlistBtn(): Locator { return this.modal.locator('.btn-add-to-watchlist', { hasText: 'Watchlist' }); }
  get modalAddTradeBtn(): Locator { return this.modal.locator('.btn-add-to-watchlist', { hasText: 'Thêm giao dịch' }); }

  /** Mã đang mở của biểu đồ TradingView trong modal (chờ tới khi iframe sẵn sàng). */
  async modalChartSymbol(): Promise<string | null> {
    let sym: string | null = null;
    await expect.poll(async () => {
      sym = await this.page.evaluate((sel) => {
        const f = document.querySelector(sel) as HTMLIFrameElement | null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const s = (f?.contentWindow as any)?.tradingViewApi?.activeChart()?.symbol();
          return s ? String(s).split(':').pop() ?? null : null;
        } catch { return null; }
      }, MODAL_CHART_IFRAME);
      return sym;
    }, { timeout: 60_000 }).not.toBeNull();
    return sym;
  }
}
