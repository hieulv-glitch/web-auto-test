import { BrowserContext, Page, Route, expect, test as baseTest } from '@playwright/test';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * ⚠️ AN TOÀN DỮ LIỆU cho các spec CŨ chạy trên BASE_URL (localhost:8080, nhánh preprod) — backend PRODUCTION
 * (thêm 10/11/2026, cùng mẫu `FaSafetyNet` trong FaAnalysisPage.ts). Dùng cho Bộ lọc, Ngành, Phân tích kỹ thuật.
 * - Đăng nhập: `safeLogin()` = `Prev2Session` (cache phiên, abort `/updateusersettings|delusersettings` và ghi vào
 *   `session.settingWrites`) → đổi bộ lọc/sàn/bố cục biểu đồ KHÔNG còn lưu vào tài khoản test.
 * - Lưới mức context: mọi request KHÔNG phải GET/HEAD/OPTIONS tới *.kfsp.vn / *.vietpointer.vn /
 *   *.kungfustockspro.live bị HUỶ + ghi vào `blocked`; `useLegacySafetyNet(test, extra)` assert `blocked` rỗng ở
 *   `afterEach`. Mock `page.route` của spec được hỏi TRƯỚC lưới (route page thắng route context).
 */
export type ReadOnlyRule = { pattern: RegExp; reason: string };

export const COMMON_READ_ONLY: ReadOnlyRule[] = [
  { pattern: /\/api\/login(\?|$)/, reason: 'tạo phiên đăng nhập (LoginPage khi chưa có phiên cache)' },
  { pattern: /socket\.io/, reason: 'kênh giá realtime (long-polling POST)' },
];

export class LegacySafetyNet {
  static readonly HOST = /(^|\.)(kfsp\.vn|vietpointer\.vn|kungfustockspro\.live)$/;
  readonly blocked: string[] = [];

  constructor(private readonly readOnly: ReadOnlyRule[]) {}

  async install(context: BrowserContext) {
    await context.route((u) => LegacySafetyNet.HOST.test(u.hostname), (route) => this.handle(route));
  }

  private async handle(route: Route) {
    const r = route.request();
    const m = r.method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.fallback();
    if (this.readOnly.some((x) => x.pattern.test(r.url()))) return route.fallback();
    // Nhật ký xem trang (app tự ghi) → trả thành công giả, không tới server, không tính là lọt.
    if (/\/api\/activitylog\//.test(r.url())) return route.fulfill({ json: { success: true } });
    // Ghi setting khi spec không qua `Prev2Session` (vd đăng nhập bằng form) → huỷ, không tính là lọt.
    if (/\/(updateusersettings|delusersettings)(\?|$)/.test(r.url())) return route.abort();
    this.blocked.push(`${m} ${r.url().split('?')[0]}`);
    return route.abort();
  }
}

/** Cài lưới cho cả file spec. `extra`: POST chỉ đọc riêng của màn (mỗi mục ghi lý do). */
export function useLegacySafetyNet(t: typeof baseTest, extra: ReadOnlyRule[] = []): () => LegacySafetyNet {
  let net = new LegacySafetyNet([...COMMON_READ_ONLY, ...extra]);
  t.beforeEach(async ({ context }) => {
    net = new LegacySafetyNet([...COMMON_READ_ONLY, ...extra]);
    await net.install(context);
  });
  t.afterEach(async () => {
    expect(net.blocked, 'Có request ghi tới production chưa được giả lập (đã bị huỷ)').toEqual([]);
  });
  return () => net;
}

/** Đăng nhập bằng phiên cache `Prev2Session` rồi mở `path` (mặc định `/`). Trả về session để đọc `settingWrites`. */
export async function safeLogin(page: Page, account: Prev2Account = 'paid', path = '/'): Promise<Prev2Session> {
  const session = new Prev2Session(page);
  await session.open({ account, path });
  return session;
}

/** Cột phải mặc định của trang PTKT (`DEFAULT_BORDER_LAYOUT` trong reactMultiLayoutChart.js, preprod 10/11/2026 — đã bỏ
 * "Cảnh báo"/"Cộng đồng"). */
const TA_BORDERS = [
  { name: 'AI Chart', component: 'tab-ai', className: 'kfsp-ai-tab' },
  { name: 'Thông tin', component: 'tab-info' },
  { name: 'Watchlist', component: 'tab-watchlist' },
  { name: 'Ghi chú', component: 'tab-note' },
];

/** Bố cục `layout_multi_ta` cố định: 1 khung, các thẻ `symbols` (thẻ đầu đang mở), cột phải mặc định. */
export function buildTaLayout(symbols: string[]): string {
  return JSON.stringify({
    global: { splitterSize: 4, splitterExtra: 4, borderEnableDrop: false, tabCloseType: 1 },
    borders: [{
      type: 'border', barSize: 32, size: 350, minSize: 350, location: 'right', selected: 1,
      children: TA_BORDERS.map((b, i) => ({ type: 'tab', id: `#legacy-border-${i}`, enableClose: false, enableDrag: false, ...b })),
    }],
    layout: {
      type: 'row', id: '#legacy-root',
      children: [{
        type: 'tabset', id: '#legacy-frame-0', weight: 100, selected: 0, active: true,
        children: symbols.map((s, i) => ({
          type: 'tab', id: `#legacy-tab-${i}`, name: `${s} 1D`, component: 'chartTA',
          config: { symbol: s, interval: '1D', is_changed_name: false, link: 'link-6' },
        })),
      }],
    },
  });
}

/** Đăng nhập + mở `/phan-tich-ky-thuat` với bố cục CỐ ĐỊNH (thay bố cục thật của tài khoản — lúc chạy 10/11/2026 là
 * 4 khung, làm khung đang active hẹp, thanh công cụ TradingView co lại và `.border-active` trỏ nhầm khung). Trả phí:
 * 1 khung 2 thẻ ACB + HPG; Free: 1 khung 1 thẻ ACB. Cờ hướng dẫn lần đầu đặt "đã xem". */
export async function safeLoginTa(page: Page, account: Prev2Account = 'paid'): Promise<Prev2Session> {
  const layout = buildTaLayout(account === 'free' ? ['ACB'] : ['ACB', 'HPG']);
  const session = new Prev2Session(page);
  await session.open({
    account, path: '/phan-tich-ky-thuat',
    patchSettings: (all) => {
      const items = all.filter((i) => !['layout_multi_ta', 'layout_multi_ta_free', 'ta_onboarding_seen'].includes(i.key)
        && !/^chartTASaved_/.test(i.key));
      items.push({ key: 'layout_multi_ta', value: layout }, { key: 'layout_multi_ta_free', value: layout },
        { key: 'ta_onboarding_seen', value: '1' });
      return items;
    },
    clearKeysAfterLogin: ['layout_multi_ta', 'layout_multi_ta_free', 'ta_onboarding_seen'],
  });
  return session;
}
