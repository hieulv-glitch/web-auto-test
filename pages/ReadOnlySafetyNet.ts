import { BrowserContext, Route, expect, test as baseTest } from '@playwright/test';

/**
 * Lưới an toàn cho các màn CHỈ ĐỌC chạy trên localhost:8080 (nhánh preprod, gọi backend PRODUCTION) — chép từ
 * `FaSafetyNet` (pages/FaAnalysisPage.ts) / `SafetyNet` (pages/CommunityPage.ts), dùng chung cho Vĩ mô, Bảng giá crypto,
 * Danh sách mã có BCTC mới.
 *
 * Cài ở mức context (phủ cả tab mới; `page.route` của spec được hỏi TRƯỚC nên mock trong spec vẫn thắng): mọi request
 * KHÔNG phải GET/HEAD/OPTIONS tới *.kfsp.vn / *.vietpointer.vn / *.kungfustockspro.live bị HUỶ + ghi vào `blocked`;
 * `useReadOnlySafetyNet(test)` cài lưới ở `beforeEach` và assert `blocked` rỗng ở `afterEach`.
 * Không đụng tới host khác (Binance, Google Analytics…) và websocket — chỉ chặn ghi tới hệ thống KFSP.
 */
export class ReadOnlySafetyNet {
  static readonly HOST = /(^|\.)(kfsp\.vn|vietpointer\.vn|kungfustockspro\.live)$/;
  /** Request không phải GET vẫn cho đi thật — chỉ đọc/không đổi dữ liệu. */
  static readonly READ_ONLY: { pattern: RegExp; reason: string }[] = [
    { pattern: /\/api\/login(\?|$)/, reason: 'tạo phiên đăng nhập (LoginPage khi chưa có phiên cache)' },
    { pattern: /socket\.io/, reason: 'kênh giá realtime (long-polling POST)' },
  ];
  readonly blocked: string[] = [];

  async install(context: BrowserContext) {
    await context.route((u) => ReadOnlySafetyNet.HOST.test(u.hostname), (route) => this.handle(route));
  }

  private async handle(route: Route) {
    const r = route.request();
    const m = r.method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.fallback();
    if (ReadOnlySafetyNet.READ_ONLY.some((x) => x.pattern.test(r.url()))) return route.fallback();
    // Nhật ký xem trang (app tự ghi) → trả thành công giả, không tới server, không tính là lọt.
    if (/\/api\/activitylog\//.test(r.url())) return route.fulfill({ json: { success: true } });
    this.blocked.push(`${m} ${r.url().split('?')[0]}`);
    return route.abort();
  }
}

/** Cài `ReadOnlySafetyNet` cho cả file spec: `const net = useReadOnlySafetyNet(test);` rồi `net()` trong test nếu cần đọc. */
export function useReadOnlySafetyNet(t: typeof baseTest): () => ReadOnlySafetyNet {
  let net = new ReadOnlySafetyNet();
  t.beforeEach(async ({ context }) => {
    net = new ReadOnlySafetyNet();
    await net.install(context);
  });
  t.afterEach(async () => {
    expect(net.blocked, 'Có request ghi tới production chưa được giả lập (đã bị huỷ)').toEqual([]);
  });
  return () => net;
}
