import { Page, Locator, Route, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account, SettingItem } from './Prev2Session';

/**
 * Thông báo trên web `stocks` (tính năng mới trên `preprod`, merge 15–26/10/2026):
 * - Trang `/trung-tam-thong-bao` (`views/notificationCenter/index.vue`): bật/tắt 7 loại, "Tất cả cài đặt", Cơ hội tiềm
 *   năng (phạm vi + công tắc AI Mua/Bán, Mẫu hình), Cảnh báo (theo mã / Bộ lọc), Tin tức & Sự kiện, Cộng đồng,
 *   "Lịch sử thông báo" (`NotificationHistory.vue` + `utils/notificationHistory.js`).
 * - Chuông trên header (`containers/TheHeaderDropdownNotify.vue`) + popup "Bản tin thị trường" (iframe
 *   `public/bulletin-preview/market_summary_bulletin.html`) + hình thu nhỏ KFSP AI (`TheContainer.vue`, `NewAINews.vue`).
 * - Hộp "Tạo cảnh báo cho mã" (`multiLayoutChart/TabAlert/alertPerStock.vue`) — page object riêng ở `AlertPerStockBox`.
 *
 * ⚠️ AN TOÀN DỮ LIỆU — prev2 gọi backend PRODUCTION (xem `Prev2Session`):
 * - Mọi API thông báo/cảnh báo được thay bằng `FakeNotifyServer` trong bộ nhớ (đọc lẫn ghi): dữ liệu do test chọn, mọi
 *   lệnh ghi chỉ được GHI LẠI ở `writes` để assert, không request nào tới máy chủ thật.
 * - Lưới an toàn (`guard`): mọi request KHÔNG phải GET tới host ngoài prev2 mà máy chủ giả không xử lý đều bị chặn và ghi ở
 *   `blocked` (trừ đăng nhập, socket.io). GET có tác dụng ghi (`updateReadNotify`, `update-read-*`) cũng bị chặn.
 */

// ================= Dữ liệu =================
export type StockAlert = {
  id: number;
  condition_key: string;
  type_condition: string;
  sub_condition_key: string;
  condition_value: string | null;
  stockcode: string;
  is_active: number;
  frequency: number;
  key_join: string;
  condition_label: string;
};

/** Nhãn mẫu máy chủ trả kèm (giống `TabAlert/alertPer.json`). */
export const COND_LABELS: Record<string, string> = {
  COND_PRICE_UP: 'Giá tăng lên chạm một mức giá cố định',
  COND_PRICE_DOWN: 'Giá giảm xuống một mức giá cố định',
  COND_PCHANGE_INC: 'Giá tăng liên tục nhiều phiên',
  COND_PCHANGE_DEC: 'Giá giảm liên tục nhiều phiên',
  COND_VOLS_SAV10_LT: 'Khối lượng vượt KLTB 10 ngày',
  COND_VOLS_SAV20_LT: 'Khối lượng vượt KLTB 20 ngày',
  COND_VOLS_SAV50_LT: 'Khối lượng vượt KLTB 50 ngày',
  COND_SMA_SMA20_UP: 'Giá cắt lên đường SMA20',
  COND_SMA_SMA200_UP: 'Giá cắt lên đường SMA200',
  COND_SMA_SMA50_DOWN: 'Giá cắt xuống đường SMA50',
  financial_report: 'Báo cáo tài chính',
  cash_dividend: 'Cổ tức tiền',
};

let alertSeq = 50_000;
export function stockAlert(stockcode: string, key: string, value: number | null = null,
  opts: { frequency?: 0 | 1; active?: 0 | 1; id?: number } = {}): StockAlert {
  const type = key.startsWith('COND_') ? key.replace(/^(COND_[A-Z]+)_.*$/, '$1') : 'COND_EVENT';
  return {
    id: opts.id ?? alertSeq++,
    condition_key: key,
    type_condition: type,
    sub_condition_key: '',
    condition_value: value === null ? null : String(value),
    stockcode,
    is_active: opts.active ?? 1,
    frequency: opts.frequency ?? 1,
    key_join: `${stockcode}~${key}`,
    condition_label: COND_LABELS[key] ?? key,
  };
}

export type Watchlist = { id: number; name: string; receive_signal: boolean };
export type SignalSettings = {
  scope: 'all_stocks' | 'all_watchlists' | 'watchlists';
  can_receive: boolean;
  watchlists: Watchlist[];
  switches: Record<string, boolean>;
};
export type SavedFilter = { id: number; label: string; content: unknown[] | null; is_active: number | boolean; frequency: number | string; my_watchlist_id: string | null };
export type NewsRow = { stockcode: string; keys: Partial<Record<string, boolean>> };
export const EVENT_KEYS = ['financial_report', 'cash_dividend', 'stock_dividend', 'additional_issuance', 'business_related_news'];

type ManualItem = { id: number; type: string; title: string; content: string; created_at: string; read: number };
type SignalItem = { id: number; type: 'SIGNAL'; title: null; content: string; signal_type: string; created_at: string; read: number };
type BctcItem = { id: number; data: string; group: number; is_new: number; read_at: string | null; created_at: string };
type AlertNotice = { id: number; condition_key: string; stockcode: string | null; content: string; created_at: string };
type NewsNotice = { id: string; stockcode: string; title: string; sent_at: string; type: string; label: string; event_id: number; is_new: boolean; date: string };
type SocialItem = { ids: number[]; post_id: number; name: string[]; content: string; type: string; read: boolean; created_at: string };

// ---- Hàm tạo dòng thông báo ----
let noticeSeq = 90_000;
export function manualNotice(title: string, opts: { read?: 0 | 1; type?: string; created_at?: string; content?: string; id?: number } = {}): ManualItem {
  return { id: opts.id ?? noticeSeq++, type: opts.type ?? 'MANUAL', title, content: opts.content ?? `<p>Nội dung: ${title}</p>`,
    created_at: opts.created_at ?? '2026-11-06 15:01:00', read: opts.read ?? 0 };
}
export function ibdNotice(title: string, opts: { read?: 0 | 1; id?: number } = {}): ManualItem {
  return { id: opts.id ?? noticeSeq++, type: 'IBDV3', title, created_at: '2026-11-06 08:00:00', read: opts.read ?? 0,
    content: JSON.stringify({ list_main_content: [{ title: 'Tổng quan thị trường chung', content: '<p>- Xu hướng Sideway</p>' }] }) };
}
/** content của 1 thông báo SIGNAL (kfsp_api docs/SIGNAL_NOTIFICATIONS.md). */
export function signalNotice(content: Record<string, unknown>, opts: { read?: 0 | 1; id?: number; created_at?: string } = {}): SignalItem {
  return { id: opts.id ?? noticeSeq++, type: 'SIGNAL', title: null, content: JSON.stringify(content),
    signal_type: String(content.signal_type ?? ''), created_at: opts.created_at ?? String(content.time ?? '2026-11-04 14:53:07'), read: opts.read ?? 0 };
}
export function bctcNotice(group: number, stockcode: string, opts: { read?: boolean; quarter?: string; year?: string } = {}): BctcItem {
  return { id: noticeSeq++, group, is_new: 1, read_at: opts.read === false ? null : '2026-11-05T01:39:03.237Z', created_at: '2026-11-02T08:40:38.595Z',
    data: JSON.stringify({ finance: { stockcode, company_name: 'CTCP ' + stockcode, quarter: opts.quarter ?? '3', year: opts.year ?? '2026' }, news: {}, user: {} }) };
}
export function filterAlertNotice(label: string, codes: string[], opts: { id?: number; time?: number } = {}): AlertNotice {
  return { id: opts.id ?? noticeSeq++, condition_key: 'COND_FILTER', stockcode: null, created_at: '2026-11-09 11:00:00',
    content: JSON.stringify({ id: '3794', type: 'COND_FILTER', time: opts.time ?? Date.parse('2026-11-09T04:00:00Z'), new_macks: codes, label }) };
}
export function stockAlertNotice(content: Record<string, unknown>, opts: { id?: number } = {}): AlertNotice {
  return { id: opts.id ?? noticeSeq++, condition_key: String(content.type), stockcode: String(content.stockcode), created_at: '2026-11-09 09:15:11',
    content: JSON.stringify({ time: '2026-11-09T02:15:11.566Z', ...content }) };
}
export function newsNotice(stockcode: string, type: string, label: string, title: string, opts: { is_new?: boolean; date?: string; id?: string } = {}): NewsNotice {
  return { id: opts.id ?? 'ev' + noticeSeq++, stockcode, title, sent_at: '2026-10-29T02:00:01.469Z', type, label, event_id: 227775,
    is_new: opts.is_new ?? false, date: opts.date ?? '30/10/2026' };
}
export function socialNotice(post_id: number, content: string, opts: { read?: boolean; type?: string; ids?: number[] } = {}): SocialItem {
  return { ids: opts.ids ?? [noticeSeq++], post_id, name: ['Ai đó'], content, type: opts.type ?? 'like', read: opts.read ?? true,
    created_at: '2026-09-25 17:51:32' };
}

export const BULLETIN_FIXTURE = path.join(__dirname, '..', 'tests', 'fixtures', 'notification', 'market-bulletin-2026-11-06.json');
export function bulletinSession(date = '2026-11-06'): Record<string, unknown> {
  return { ...JSON.parse(fs.readFileSync(BULLETIN_FIXTURE, 'utf8')), date };
}

export type Write = { method: string; path: string; query: Record<string, string>; body: unknown };
export type Failure = { re: RegExp; status: number; method?: string; body?: unknown; delayMs?: number };

/**
 * Máy chủ giả trong bộ nhớ cho mọi API mà khu Thông báo dùng. Mặc định: 7 loại đang bật, không thông báo, không quy tắc.
 * Test tự gán các mảng/đối tượng rồi mới `open()`.
 */
export class FakeNotifyServer {
  types: Record<string, boolean> = { notifications: true, SIGNAL: true, IBD: true, bctc: true, ALERT: true, Social: true, news_events: true };
  signal: SignalSettings = {
    scope: 'watchlists', can_receive: true,
    watchlists: [{ id: 1, name: 'Kungfu Watchlist', receive_signal: true }, { id: 2, name: 'Ngân Hàng', receive_signal: false },
      { id: 3, name: 'Công nghệ', receive_signal: false }],
    switches: { ai_buy: true, ai_danger: false, ai_sell: true, pattern_detect: true, pattern_close: true },
  };
  alerts: StockAlert[] = [];
  filters: SavedFilter[] = [];
  news: NewsRow[] = [];
  mutedPosts: { id: number; title: string; created_at: string }[] = [];
  /** Thông báo theo loại (khoá đúng `type` mà web gửi lên get-notifications-by-type). */
  lists: { notifications: ManualItem[]; IBDV3: ManualItem[]; bctc: BctcItem[]; ALERT: AlertNotice[]; news_events: NewsNotice[] } =
    { notifications: [], IBDV3: [], bctc: [], ALERT: [], news_events: [] };
  signals: SignalItem[] = [];
  social: SocialItem[] = [];
  unread: Record<string, number> = { SIGNAL: 0, IBD: 0, notifications: 0, bctc: 0, news_events: 0 };
  /** Bản tin thị trường theo ngày ("latest" cho phiên gần nhất); thiếu ngày → 404. */
  bulletins: Record<string, Record<string, unknown>> = {};
  /** Nội dung sự kiện (`/get-content-event`). */
  eventContent = '<p>Nội dung sự kiện</p>';

  readonly writes: Write[] = [];
  readonly reads: string[] = [];
  /** Request bị lưới an toàn chặn (method + url). */
  readonly blocked: string[] = [];
  /** Lỗi/độ trễ giả lập, áp cho request khớp đầu tiên. */
  failures: Failure[] = [];

  private nextId = 700_000;

  writesTo(re: RegExp, method?: string): Write[] {
    return this.writes.filter((w) => re.test(w.path) && (!method || w.method === method));
  }

  /** Lưới an toàn: đăng ký TRƯỚC mọi route khác (route đăng ký sau được hỏi trước). */
  async guard(page: Page) {
    await page.route(/.*/, async (route) => {
      const r = route.request();
      const url = new URL(r.url());
      const isPrev2Static = /vietpointer\.vn$/.test(url.hostname) && !/^\/api\//.test(url.pathname);
      if (isPrev2Static || /socket\.io/.test(url.pathname)) return route.fallback();
      const readLike = r.method() === 'GET' && !/updateReadNotify|update-read|delete|remove/i.test(url.pathname);
      if (readLike || /login|signin/i.test(url.pathname)) return route.fallback();
      this.blocked.push(`${r.method()} ${url.origin}${url.pathname}`);
      // Lưu tuỳ chọn dashboard lúc vào trang: trả "thành công" giả (không gửi đi) để web khỏi bật toast lỗi riêng.
      if (/user-dashboard-preference\/save/.test(url.pathname)) return route.fulfill({ status: 200, json: { success: true } });
      return route.abort();
    });
  }

  async install(page: Page) {
    const re = /\/(notification\/|api\/notification-settings|api\/stocks\/user-alert\/|api\/filter\/(save_filter_group|notification|update-frequency)|api\/news-event-alerts|api\/stocks\/community\/(muted-posts|update-notify|post\/list-social-history|post\/social-history)|api\/notifications\/updateReadNotify|api\/watchlist\/update-receive-signal|api\/market-bulletin\/|api\/stock-signals\/|get-content-event)/;
    await page.route(re, (route) => this.handle(route));
  }

  private async handle(route: Route) {
    const r = route.request();
    const url = new URL(r.url());
    const p = url.pathname;
    const method = r.method();
    const query = Object.fromEntries(url.searchParams.entries());
    delete query.token;
    let body: unknown = undefined;
    try { body = r.postDataJSON(); } catch { body = r.postData(); }
    if (body && typeof body === 'object' && 'token' in (body as object)) { body = { ...(body as object) }; delete (body as Record<string, unknown>).token; }

    const fail = this.failures.find((f) => f.re.test(p) && (!f.method || f.method === method));
    if (fail?.delayMs) await new Promise((res) => setTimeout(res, fail.delayMs));
    const isWrite = method !== 'GET' || /updateReadNotify|update-read/.test(p);
    if (isWrite) this.writes.push({ method, path: p, query, body });
    else this.reads.push(p + (url.search ? '?' + new URLSearchParams(query).toString() : ''));
    if (fail && fail.status === 0) return route.abort();
    if (fail && (fail.status >= 400 || fail.body !== undefined)) {
      return route.fulfill({ status: fail.status, json: fail.body ?? { message: 'Lỗi giả lập' } });
    }
    const json = (data: unknown) => route.fulfill({ status: 200, json: data });
    const ok = (data: unknown) => json({ code: 200, message: 'success', data, success: true });
    const b = (body || {}) as Record<string, any>;

    // ---- Cài đặt loại ----
    if (p.endsWith('/api/notification-settings') && method === 'GET') return ok(this.settingsPayload());
    if (p.endsWith('/api/notification-settings/types')) {
      for (const t of b.types || []) this.types[t.type] = !!t.is_active;
      return ok(this.settingsPayload());
    }
    if (p.endsWith('/api/notification-settings/signal') && method === 'GET') return ok(this.signal);
    if (p.endsWith('/api/notification-settings/signal/switches')) {
      this.signal.switches[b.key] = !!b.is_active;
      return ok(this.signal.switches);
    }
    if (p.endsWith('/api/notification-settings/signal/scope')) {
      this.signal.scope = b.scope;
      return ok(this.signal);
    }
    if (/\/api\/watchlist\/update-receive-signal\/(\d+)$/.test(p)) {
      const id = Number(p.split('/').pop());
      const w = this.signal.watchlists.find((x) => x.id === id);
      if (w) w.receive_signal = !!b.receive_signal;
      return json({ success: true });
    }
    // ---- Cảnh báo theo mã ----
    if (p.endsWith('/api/stocks/user-alert/get-all')) return json(this.alerts);
    if (p.endsWith('/api/stocks/user-alert/get-by-stockcode/v2')) return json(this.alerts.filter((a) => a.stockcode === query.stockcode));
    if (p.endsWith('/api/stocks/user-alert/update/v2')) {
      // Bản ghi cũ từ bảng TTTB có id; từ hộp alertPerStock thì KHÔNG (dựng lại từ alertPer.json) → khớp theo mã + điều kiện + giá trị.
      const same = (x: StockAlert, o: Partial<StockAlert>) => (o.id != null ? x.id === o.id
        : x.stockcode === o.stockcode && x.condition_key === o.condition_key
          && (x.condition_value == null ? o.condition_value == null : Number(x.condition_value) === Number(o.condition_value)));
      this.alerts = this.alerts.filter((x) => !(b.old_user_alerts || []).some((o: Partial<StockAlert>) => same(x, o)));
      for (const a of b.user_alerts || []) {
        this.alerts.push({ ...stockAlert(a.stockcode, a.condition_key, a.condition_value == null ? null : Number(a.condition_value),
          { frequency: a.frequency ? 1 : 0, id: this.nextId++ }) });
      }
      return json({ success: true });
    }
    if (p.endsWith('/api/stocks/user-alert/delete-by-stockcode/v2')) {
      const codes: string[] = b.stockcodes || [];
      this.alerts = this.alerts.filter((a) => !codes.includes(a.stockcode));
      return json({ success: true });
    }
    // ---- Bộ lọc ----
    if (p.endsWith('/api/filter/save_filter_group')) return json(this.filters);
    if (p.endsWith('/api/filter/notification')) {
      const f = this.filters.find((x) => x.id === b.id);
      if (f) f.is_active = b.is_active ? 1 : 0;
      return json({ success: true });
    }
    if (p.endsWith('/api/filter/update-frequency')) {
      this.filters.forEach((f) => (f.frequency = b.frequency));
      return json({ success: true });
    }
    // ---- Tin tức & sự kiện ----
    if (p.endsWith('/api/news-event-alerts/get-all')) {
      return ok(this.news.map((n, i) => ({ id: 900 + i, stockcode: n.stockcode,
        alert_key: JSON.stringify(EVENT_KEYS.map((k) => ({ key: k, is_active: !!n.keys[k] }))) })));
    }
    if (p.endsWith('/api/news-event-alerts') && method === 'POST') {
      const row = this.news.find((n) => n.stockcode === b.stockcode);
      const keys = Object.fromEntries((b.items || []).map((i: { key: string; is_active: boolean }) => [i.key, i.is_active]));
      if (row) row.keys = keys; else this.news.push({ stockcode: b.stockcode, keys });
      return ok(null);
    }
    if (p.endsWith('/api/news-event-alerts') && method === 'DELETE') {
      this.news = this.news.filter((n) => !(b.stockcodes || []).includes(n.stockcode));
      return ok(null);
    }
    // ---- Cộng đồng ----
    if (p.endsWith('/api/stocks/community/muted-posts')) return ok(this.mutedPosts);
    if (p.endsWith('/api/stocks/community/update-notify')) {
      this.mutedPosts = this.mutedPosts.filter((x) => x.id !== b.postId);
      return json({ success: true });
    }
    if (p.endsWith('/api/stocks/community/post/list-social-history')) return json(this.social);
    if (p.endsWith('/api/stocks/community/post/social-history') && method === 'DELETE') {
      const ids: number[] = b.ids || [];
      const before = this.social.length;
      this.social = this.social.filter((s) => !s.ids.some((i) => ids.includes(i)));
      return json({ deleted: true, count: before - this.social.length });
    }
    if (p.endsWith('/api/notifications/updateReadNotify')) return json({ success: true });
    // ---- Danh sách thông báo ----
    if (p.endsWith('/notification/unread-counts')) return json(this.unread);
    if (p.endsWith('/notification/get-notifications-by-type')) return json(this.page(query.type, query.last_id, Number(query.item_per_page || 40)));
    if (p.endsWith('/notification/signal')) return json(this.pageById(this.signals, query.last_id, Number(query.item_per_page || 40)));
    if (p.endsWith('/notification/signal/read')) {
      this.signals.forEach((s) => { if (!b.id || s.id === b.id) s.read = 1; });
      return json({ success: true });
    }
    if (p.endsWith('/notification/updateReadNotify')) return json({ success: true });
    if (p.endsWith('/notification/update-read-news-events-notify')) return json({ success: true });
    if (p.endsWith('/notification/delete-notifications')) {
      const ids: unknown[] = b.ids || [];
      const key = b.type as keyof FakeNotifyServer['lists'];
      if (this.lists[key]) (this.lists[key] as Array<{ id: unknown; group?: unknown }>) =
        (this.lists[key] as Array<{ id: unknown; group?: unknown }>).filter((x) => !ids.includes(key === 'bctc' ? x.group : x.id));
      if (b.type === 'SIGNAL') this.signals = this.signals.filter((x) => !ids.includes(x.id));
      return json({ success: true });
    }
    // ---- Bản tin ----
    const mb = /\/api\/market-bulletin\/([^/]+)$/.exec(p);
    if (mb) {
      const s = this.bulletins[mb[1]];
      return s ? json(s) : route.fulfill({ status: 404, json: { message: 'Not Found' } });
    }
    // ---- Biểu đồ tín hiệu (đọc, nhưng là POST) ----
    if (/\/api\/stock-signals\//.test(p)) return json([]);
    if (p.endsWith('/get-content-event')) return json(this.eventContent);
    return route.fallback();
  }

  private settingsPayload() {
    return { types: Object.entries(this.types).map(([type, is_active]) => ({ type, is_active })), is_paused: false, paused_until: null };
  }

  private pageById<T extends { id: number }>(list: T[], lastId: string | undefined, per: number): T[] {
    const sorted = [...list].sort((a, b) => b.id - a.id);
    const from = lastId && isFinite(Number(lastId)) ? sorted.filter((x) => x.id < Number(lastId)) : sorted;
    return from.slice(0, per);
  }

  private page(type: string, lastId: string | undefined, per: number): unknown[] {
    switch (type) {
      case 'notifications': return this.pageById(this.lists.notifications, lastId, per);
      case 'IBDV3': return this.pageById(this.lists.IBDV3, lastId, per);
      case 'ALERT': return [...this.lists.ALERT].sort((a, b) => b.id - a.id);
      case 'news_events': return this.lists.news_events.slice(0, per);
      case 'bctc': {
        const sorted = [...this.lists.bctc].sort((a, b) => b.group - a.group || b.id - a.id);
        return (lastId && isFinite(Number(lastId)) ? sorted.filter((x) => x.group < Number(lastId)) : sorted).slice(0, per);
      }
      default: return [];
    }
  }
}

// ================= Page object =================
export type NotifyOpenOptions = {
  account?: Prev2Account;
  path?: string;
  /** false → để web tự gọi bản tin "latest" lúc vào trang (hình thu nhỏ KFSP AI). */
  bulletinSeen?: boolean;
  /** Ghi đè vài setting người dùng (vd `notification_center_gop_theo_ma`). */
  settings?: Record<string, string>;
};

export class NotificationCenterPage extends BasePage {
  get pw(): Page { return this.page; }
  readonly server = new FakeNotifyServer();
  readonly session: Prev2Session;
  readonly pageErrors: string[] = [];
  readonly consoleErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') this.consoleErrors.push(m.text()); });
  }

  get settingWrites() { return this.session.settingWrites; }

  async open(opts: NotifyOpenOptions = {}) {
    const { account = 'paid', path: target = '/trung-tam-thong-bao', bulletinSeen = true } = opts;
    // Tài khoản thật có thể đang lưu "Xem gộp theo mã" = true → cố định false, test nào cần thì tự đặt.
    const settings: Record<string, string> = { notification_center_gop_theo_ma: 'false', ...(opts.settings || {}) };
    await this.server.guard(this.page);
    await this.server.install(this.page);
    const own = Object.keys(settings);
    await this.session.open({
      account, path: target, bulletinSeen,
      patchSettings: (items: SettingItem[]) => [...items.filter((i) => !own.includes(i.key)),
        ...own.map((key) => ({ key, value: settings[key] }))],
      clearKeysAfterLogin: ['notification_center_gop_theo_ma', 'number_notify_alert'],
    });
    await this.waitStockList();
  }

  /** Chờ danh sách mã của app (`list_mack_company`) nạp xong: hộp cảnh báo, ô thêm mã, tên doanh nghiệp đều dựa vào nó
   * (bấm Sửa trước lúc này thì hộp không nạp cảnh báo của mã). */
  async waitStockList() {
    await expect.poll(() => this.store<number>('return Object.keys(state.list_mack_company || {}).length').catch(() => 0),
      { timeout: 45_000, message: 'danh sách mã chưa nạp' }).toBeGreaterThan(500);
  }

  /** Mở trang Trung tâm thông báo và chờ 4 nguồn đã tải xong. */
  async openCenter(opts: NotifyOpenOptions = {}) {
    await this.open(opts);
    await expect(this.title).toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator('.nc-panel')).not.toContainText('Đang tải', { timeout: 20_000 });
  }

  /** Chạy hàm trên Vue store của app. */
  async store<T>(fn: string): Promise<T> {
    return this.page.evaluate((body) => {
      type VueEl = Element & { __vue__?: { $store?: { state: Record<string, unknown> } } };
      const el = Array.from(document.querySelectorAll('.c-app, body *')).find((e) => (e as VueEl).__vue__?.$store) as VueEl | undefined;
      if (!el) throw new Error('Không tìm thấy Vue store');
      // eslint-disable-next-line no-new-func
      return new Function('state', body)(el.__vue__!.$store!.state);
    }, fn) as Promise<T>;
  }

  // ================= Trang Trung tâm thông báo =================
  get title(): Locator { return this.page.getByRole('heading', { level: 1, name: 'Trung tâm thông báo' }); }
  get backBtn(): Locator { return this.page.getByRole('button', { name: 'Quay lại' }); }
  get nav(): Locator { return this.page.locator('.nc-groups'); }
  navItem(name: string): Locator {
    return this.nav.locator('.nc-nav-item').filter({ has: this.page.locator('.nc-lbl', { hasText: new RegExp(`^${name}$`) }) });
  }
  typeSwitch(label: string): Locator { return this.page.getByRole('checkbox', { name: 'Nhận thông báo ' + label, exact: true }); }
  get panel(): Locator { return this.page.locator('.nc-panel'); }
  get h2(): Locator { return this.panel.locator('.nc-h2').first(); }
  get panelNote(): Locator { return this.panel.locator('.nc-note'); }
  get table(): Locator { return this.panel.locator('.nc-table table'); }
  get rows(): Locator { return this.panel.locator('.nc-table tbody tr'); }
  get empty(): Locator { return this.panel.locator('.nc-empty'); }
  get countBadge(): Locator { return this.panel.locator('.nc-panel-head .nc-badge'); }
  get ovSearch(): Locator { return this.panel.getByPlaceholder('Tìm mã, bộ lọc'); }
  get ovKind(): Locator { return this.panel.getByLabel('Lọc theo loại'); }
  get confirmModal(): Locator { return this.page.locator('.modal.show').filter({ hasText: 'Xoá quy tắc' }); }
  get toastError(): Locator { return this.page.locator('.Vue-Toastification__toast--error'); }
  get toastSuccess(): Locator { return this.page.locator('.Vue-Toastification__toast--success'); }
  get toastInfo(): Locator { return this.page.locator('.Vue-Toastification__toast--info'); }
  get packageModal(): Locator { return this.page.getByRole('dialog').filter({ hasText: 'Chọn dịch vụ' }); }

  /** Bấm 1 công tắc kiểu `.nc-sw` (ô checkbox trong suốt đè lên thanh trượt). */
  async toggle(input: Locator) {
    await input.evaluate((el: HTMLInputElement) => el.click());
  }

  // ---- Cơ hội tiềm năng ----
  get oppLocked(): Locator { return this.panel.locator('.nc-opp-locked'); }
  get scopeAll(): Locator { return this.panel.getByRole('radio', { name: 'Tất cả cổ phiếu' }); }
  get scopeWatchlist(): Locator { return this.panel.getByRole('radio', { name: 'Watchlist' }); }
  get wlButton(): Locator { return this.panel.locator('.nc-opp-dd-btn'); }
  get wlMenu(): Locator { return this.panel.locator('.nc-opp-dd-menu'); }
  wlItem(name: string): Locator { return this.wlMenu.getByRole('checkbox', { name, exact: true }); }
  oppSwitch(label: string): Locator { return this.panel.locator('.nc-opp-steps').getByRole('checkbox', { name: label, exact: true }); }

  // ---- Cảnh báo ----
  tab(name: string): Locator { return this.panel.getByRole('tab', { name }); }
  get groupByCode(): Locator { return this.panel.getByLabel('Xem gộp theo mã'); }
  get stockSearch(): Locator { return this.panel.getByPlaceholder('Tìm mã'); }
  get addAlertBtn(): Locator { return this.panel.getByRole('button', { name: 'Thêm cảnh báo' }); }
  get filterFreq(): Locator { return this.panel.getByLabel('Tần suất báo bộ lọc'); }
  row(text: string | RegExp): Locator { return this.rows.filter({ hasText: text }); }

  // ---- Tin tức & sự kiện ----
  get newsCode(): Locator { return this.panel.locator('.nc-code-box input'); }
  get addNewsBtn(): Locator { return this.panel.getByRole('button', { name: 'Thêm mã' }); }

  // ================= Lịch sử thông báo =================
  get history(): Locator { return this.page.locator('.nh'); }
  historyChip(name: string): Locator { return this.history.getByRole('tab', { name, exact: true }); }
  get historySearch(): Locator { return this.history.getByPlaceholder('Tìm kiếm thông báo'); }
  get historyRows(): Locator { return this.history.locator('.nh-g-line, .nh-row, .noti-item'); }
  get historyEmpty(): Locator { return this.history.locator('.nh-empty'); }
  get historyMore(): Locator { return this.history.getByRole('button', { name: 'Xem thêm' }); }
  get historyMarkAll(): Locator { return this.history.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }); }
  get historyReload(): Locator { return this.history.getByRole('button', { name: 'Tải lại' }); }

  // ================= Chuông header =================
  get bell(): Locator { return this.page.locator('button.notify-bell'); }
  get bellBadge(): Locator { return this.page.locator('.notify-bell-badge'); }
  get bellPanel(): Locator { return this.page.locator('.notify-panel'); }
  get bellSub(): Locator { return this.bellPanel.locator('.notify-head-sub'); }
  bellChip(name: string): Locator { return this.bellPanel.locator('.notify-chip').filter({ hasText: new RegExp(`^\\s*${name}(\\s|$)`) }); }
  get bellRows(): Locator { return this.bellPanel.locator('.noti-item:visible, .alert-row, .item-social, .event-row'); }
  get bellMarkAll(): Locator { return this.bellPanel.getByTitle('Đánh dấu tất cả thông báo ở mọi tab đã đọc'); }
  get bellMore(): Locator { return this.bellPanel.getByRole('button', { name: 'Xem toàn bộ lịch sử thông báo' }).first(); }
  get bellFoot(): Locator { return this.bellPanel.getByRole('button', { name: 'Cài đặt trung tâm thông báo' }); }
  get noticeModal(): Locator { return this.page.locator('.modal.show').filter({ has: this.page.locator('.modal-content') }).last(); }

  async openBell() {
    await this.bell.click();
    await expect(this.bellPanel).toBeVisible();
  }

  // ================= Bản tin thị trường =================
  get bulletinPop(): Locator { return this.page.locator('.market-bulletin-pop'); }
  get bulletinLoading(): Locator { return this.page.locator('.market-bulletin-state'); }
  bulletinFrame(style: 'a' | 'b' = 'a') { return this.page.frameLocator(`.market-bulletin-frame iframe[data-style="${style}"]`); }
  get bulletinThumb(): Locator { return this.page.locator('.popup .thumb iframe'); }
  get aiPopup(): Locator { return this.page.locator('.popup').filter({ has: this.page.locator('.bubble') }); }

  // ================= Biểu đồ nhanh (modal TradingChart) =================
  get chartModal(): Locator { return this.page.locator('.modal.show').filter({ has: this.page.locator('.TVChartContainer, iframe') }).last(); }
}

// ================= Hộp "Tạo cảnh báo cho mã" (alertPerStock.vue) =================
export class AlertPerStockBox {
  constructor(private readonly page: Page) {}
  get modal(): Locator { return this.page.locator('.modal.show').filter({ has: this.page.locator('.aps') }); }
  get title(): Locator { return this.modal.locator('.modal-title'); }
  get code(): Locator { return this.modal.getByPlaceholder('Mã CK'); }
  get suggestions(): Locator { return this.modal.locator('.search-stockcode_item'); }
  get company(): Locator { return this.modal.locator('.col-md-7 .h6').first(); }
  get groups(): Locator { return this.modal.locator('.pt-2 > .pb-3'); }
  /** Hàng điều kiện theo nhãn (hàng thêm cho mức thứ 2 có nhãn rỗng → dùng `nth`). */
  condRows(label: string): Locator { return this.modal.locator('.aps-row').filter({ hasText: label }); }
  get allRows(): Locator { return this.modal.locator('.aps-row'); }
  cb(label: string): Locator { return this.modal.getByRole('checkbox', { name: 'Chọn điều kiện ' + label, exact: true }); }
  valueInput(row: Locator): Locator { return row.locator('input[type="number"]'); }
  selects(row: Locator): Locator { return row.locator('select'); }
  get save(): Locator { return this.modal.getByRole('button', { name: 'Lưu', exact: true }); }
  get close(): Locator { return this.modal.getByRole('button', { name: 'Đóng', exact: true }); }
}
