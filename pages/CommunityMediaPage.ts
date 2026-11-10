import { Page, Locator, Route, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Cộng đồng — video nhúng / ảnh không cắt trong bài + cột phải mới (tính năng mới trên `preprod`):
 * - `thanh/community-media` (merge 26/10/2026): `TabCommunity/components/VideoEmbed.vue` (link YouTube / TikTok / Facebook /
 *   Instagram / Vimeo phát ngay trong bài: poster trước, bấm mới tải player; tự dừng khi cuộn khỏi màn),
 *   `components/PreviewPost.vue` (thẻ xem trước link qua `/api/stocks/community/link-preview`), `gridImage.vue` (ảnh không
 *   cắt — mỗi ảnh một slide trên nền mờ của chính nó, khung theo tỉ lệ ảnh đầu, cao nhất 4:5; nhiều ảnh có bộ đếm + nút ‹ ›;
 *   bấm ảnh mở xem lớn).
 * - Cột phải `src/views/homepage/communityRail/` (làm lại 20–21/10/2026): Thị trường hôm nay, Watchlist của bạn, Danh mục
 *   của bạn, Sự kiện 30 ngày tới, Mã được nhắc nhiều hôm nay; biểu đồ nhỏ `src/components/MiniPriceChart.vue`.
 *
 * ⚠️ AN TOÀN DỮ LIỆU (kfsp.vn gọi backend production): dòng tin (`get-post-by-page`), bài ghim, link-preview và toàn bộ dữ
 * liệu cột phải (chỉ số, watchlist, nhật ký giao dịch, sự kiện, tin AI, mã của người dùng) đều là dữ liệu GIẢ dựng trong
 * test; ảnh/poster/player video là tài nguyên giả (không tải YouTube/TikTok thật). Giá live + biểu đồ trong ngày (socket
 * `getlive` / `getintradayohlc`) được trả từ dữ liệu giả bằng cách bọc `window.socket_send.emit`. Mọi request không phải GET
 * tới `*.kfsp.vn` (trừ đăng nhập, socket.io) bị huỷ và ghi ở `blocked` — đăng bài / thích / bình luận không thể lọt ra.
 */
export type FakePost = {
  id: number;
  content: string;
  images?: string[];
  video_poster?: string;
};
export type LinkMeta = { url: string; title?: string; description?: string; images?: string[]; siteName?: string };
export type LiveQuote = { price: number; change: number; cl: string; vol?: number };
export type TradeLog = { mack: string; loai_giao_dich: string; khoi_luong: number; gia_thuc_hien: number; phi?: number; danh_muc: number };
export type RailData = {
  indexes?: Record<string, { lastprice: number; change: number; perchange: number }>;
  watchlists?: { id: number; name: string; macks: string[] }[];
  categories?: { id: number; name: string }[];
  logs?: TradeLog[];
  userCodes?: string[];
  events?: { stockcode: string; eventid: number; name: string; note: string; title: string; content?: string; fileurl?: string; date: string }[];
  news?: { stockcodes: string[] }[];
  /** Giá live theo mã (đơn vị giá: đồng; change: nghìn đồng). */
  live?: Record<string, LiveQuote>;
  /** Giá đóng cửa từng phút trong phiên theo mã: [[giờ VN dạng "HH:MM", giá]] — giá cùng đơn vị socket trả (đồng / điểm). */
  intraday?: Record<string, [string, number][]>;
};

/** Ảnh giả: URL mang kích thước, vd `img(800, 400, 'a')`. */
export const IMG_HOST = 'https://autotest-img.kfsp.invalid';
export function img(w: number, h: number, tag = 'x'): string { return `${IMG_HOST}/${tag}-w${w}h${h}.svg`; }

function svg(w: number, h: number, color = '#7b3aec'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${color}"/></svg>`;
}
const PLAYER_HTML = '<!doctype html><html><body style="margin:0;background:#000;color:#fff">player<script>window.__msgs=[];window.addEventListener("message",function(e){window.__msgs.push(String(e.data))});</script></body></html>';

export type MediaOpenOptions = {
  account?: Prev2Account;
  path?: string;
  posts?: FakePost[];
  previews?: Record<string, LinkMeta | null>;
  /** Poster maxresdefault của YouTube trả ảnh xám 120×90 (YouTube làm vậy khi video không có bản maxres). */
  youtubeMaxresMissing?: boolean;
  rail?: RailData;
};

export class CommunityMediaPage extends BasePage {
  readonly session: Prev2Session;
  readonly blocked: string[] = [];
  readonly previewCalls: string[] = [];
  readonly playerLoads: string[] = [];
  readonly pageErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
  }

  get browserPage(): Page { return this.page; }

  async open(opts: MediaOpenOptions = {}) {
    const { account = 'paid', path = '/cong-dong/moi-nhat', posts = [], previews = {}, youtubeMaxresMissing = false, rail = {} } = opts;
    const page = this.page;

    // Lưới an toàn — đăng ký TRƯỚC (route đăng ký sau được hỏi trước).
    await page.route((u) => /(^|\.)(kfsp\.vn|vietpointer\.vn)$/.test(u.hostname), async (route) => {
      const r = route.request();
      if (r.method() === 'GET' || r.method() === 'OPTIONS' || /socket\.io|\/api\/login(\?|$)/.test(r.url())) return route.fallback();
      this.blocked.push(`${r.method()} ${r.url().split('?')[0]}`);
      if (/\/api\/activitylog\//.test(r.url())) return route.fulfill({ json: { success: true } });
      return route.abort();
    });

    // ---- Dòng tin ----
    let template: Record<string, unknown> | null = null;
    await page.route(/\/api\/stocks\/community\/post\/get-post-by-page/, async (route) => {
      const url = new URL(route.request().url());
      if (!template) {
        try {
          const res = await route.fetch();
          const list = await res.json();
          template = Array.isArray(list) && list[0] ? list[0] : {};
        } catch { template = {}; }
      }
      if (url.searchParams.get('last_post')) return route.fulfill({ json: [] });
      const t = template!;
      return route.fulfill({
        json: posts.map((p) => ({
          ...t, id: p.id, content: p.content, images: p.images || [], video_poster: p.video_poster || '',
          macks: [], hashtags: [], tags: [], trend: null, likes_count: 0, is_liked: false, comments_count: 0,
          comments: [], list_comment: [], is_pin: 0,
        })),
      });
    });
    await page.route(/\/api\/stocks\/community\/post\/pinned/, (route) => route.fulfill({ json: { code: 200, message: 'success', data: [], success: true } }));
    await page.route(/\/api\/stocks\/community\/link-preview/, (route) => {
      const target = new URL(route.request().url()).searchParams.get('url') || '';
      this.previewCalls.push(target);
      const meta = previews[target];
      if (!meta) return route.fulfill({ json: { success: false } });
      return route.fulfill({ json: { success: true, data: { description: '', images: [], siteName: '', title: '', ...meta } } });
    });

    // ---- Ảnh / poster / player giả ----
    await page.route((u) => u.href.startsWith(IMG_HOST), (route) => {
      const m = route.request().url().match(/w(\d+)h(\d+)\.svg/);
      return route.fulfill({ contentType: 'image/svg+xml', body: svg(Number(m?.[1] || 100), Number(m?.[2] || 100)) });
    });
    await page.route(/i\.ytimg\.com\/vi\//, (route) => {
      const u = route.request().url();
      if (/maxresdefault/.test(u)) return route.fulfill({ contentType: 'image/svg+xml', body: youtubeMaxresMissing ? svg(120, 90, '#888') : svg(1280, 720, '#c00') });
      if (/oar2/.test(u)) return route.fulfill({ contentType: 'image/svg+xml', body: svg(1080, 1920, '#0a0') });
      return route.fulfill({ contentType: 'image/svg+xml', body: svg(480, 360, '#00c') });
    });
    await page.route(/(youtube-nocookie\.com\/embed|tiktok\.com\/player|facebook\.com\/plugins\/video|instagram\.com\/reel\/[^/]+\/embed|player\.vimeo\.com\/video)/, (route) => {
      this.playerLoads.push(route.request().url());
      return route.fulfill({ contentType: 'text/html', body: PLAYER_HTML });
    });

    // ---- Cột phải ----
    const json = (data: unknown) => (route: Route) => route.fulfill({ json: data });
    await page.route(/\/api\/guest\/home\/get-data-index-live/, json(rail.indexes ?? {}));
    await page.route(/\/api\/watchlist\/mack-by-my-watchlist\/grouped/, json(rail.watchlists ?? []));
    await page.route(/\/api\/tradinglog\/category\/get-all/, json(rail.categories ?? []));
    await page.route(/\/api\/tradinglog\/getAll/, json({ list_data_item: (rail.logs ?? []).map((l, i) => ({ id: 900000 + i, phi: 0, ...l })) }));
    await page.route(/\/news\/user-stockcodes/, json(rail.userCodes ?? []));
    await page.route(/\/api\/events\?/, json((rail.events ?? []).map((e) => ({ catid: 1, eventtypeid: 1, channelid: null, companyname: '', exchange: 'HOSE', fileurl: '', content: '', ...e, gdkhq: e.date, ngay_gdkhq: e.date, date: e.date }))));
    const todayVN = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
    await page.route(/\/news\/news-summary/, json({ news_list: (rail.news ?? []).map((n, i) => ({ _id: 'n' + i, title: 't', content: 'c', category: 'x', created_at: `${todayVN}T09:00:00+07:00`, ...n })) }));

    // Socket giá: bọc emit của window.socket_send ngay khi layout gán nó.
    await page.addInitScript(({ live, intraday }) => {
      const w = window as unknown as Record<string, unknown>;
      let sock: { emit: (...a: unknown[]) => unknown } | undefined;
      const wrap = (s: { emit: (...a: unknown[]) => unknown }) => {
        const orig = s.emit.bind(s);
        s.emit = (event: unknown, ...args: unknown[]) => {
          const cb = args[args.length - 1];
          if (event === 'getlive' && typeof cb === 'function') {
            const codes = (args[0] as string[]).filter((c) => live[c]);
            setTimeout(() => (cb as (r: unknown) => void)({
              stockcode: codes, lastprice: codes.map((c) => live[c].price), change: codes.map((c) => Math.abs(live[c].change)),
              cl: codes.map((c) => live[c].cl), totalvol: codes.map((c) => live[c].vol ?? 1000),
            }), 50);
            return s;
          }
          if (event === 'getintradayohlc' && typeof cb === 'function') {
            const code = args[0] as string;
            const pts = intraday[code] || [];
            const day = Math.floor((Date.now() + 7 * 3600_000) / 86400_000) * 86400;
            const t = pts.map(([hm]) => { const [h, m] = hm.split(':').map(Number); return day + h * 3600 + m * 60 - 7 * 3600; });
            setTimeout(() => (cb as (r: unknown) => void)({ stockcode: code, c: pts.map((p) => p[1]), t }), 50);
            return s;
          }
          return orig(event, ...args);
        };
      };
      Object.defineProperty(w, 'socket_send', {
        configurable: true,
        get: () => sock,
        set: (v) => { sock = v as typeof sock; if (sock && typeof sock.emit === 'function') wrap(sock); },
      });
    }, { live: rail.live ?? {}, intraday: rail.intraday ?? {} });

    await this.session.open({ account, path });
  }

  // ================= Bài viết =================
  /** Khối bài chứa nội dung có đoạn chữ `marker`. */
  post(marker: string): Locator {
    return this.page.locator('.content-post').filter({ hasText: marker }).first()
      .locator('xpath=ancestor::*[.//*[contains(@class,"info-interact")]][1]');
  }
  carousel(post: Locator): Locator { return post.locator('.lb-carousel'); }
  slides(post: Locator): Locator { return post.locator('.lb-slide'); }
  counter(post: Locator): Locator { return post.locator('.lb-counter'); }
  navNext(post: Locator): Locator { return post.locator('.lb-nav-next'); }
  navPrev(post: Locator): Locator { return post.locator('.lb-nav-prev'); }
  get viewer(): Locator { return this.page.locator('.lb-modal'); }
  video(post: Locator): Locator { return post.locator('.ve'); }
  previewCard(post: Locator): Locator { return post.locator('.preview-card'); }

  async waitFeed(marker: string) {
    await expect(this.page.locator('.content-post').filter({ hasText: marker }).first()).toBeVisible({ timeout: 45_000 });
  }

  // ================= Cột phải =================
  get rail(): Locator { return this.page.locator('.community-rail').first(); }
  card(title: string | RegExp): Locator {
    return this.rail.locator('.rail-card').filter({ has: this.page.locator('.rail-title', { hasText: title }) });
  }
  rows(card: Locator): Locator { return card.locator('.rail-table-row'); }
  rowByCode(card: Locator, code: string): Locator {
    return this.rows(card).filter({ has: this.page.locator('.rail-table-code', { hasText: new RegExp(`^${code}$`) }) });
  }
}
