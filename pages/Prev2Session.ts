import { Page, Route } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from './LoginPage';

/**
 * Đăng nhập prev2 (https://prev2.vietpointer.vn — bản build preprod mới nhất của `stocks`) + cache phiên, dùng chung cho
 * mọi spec chạy trên prev2.
 *
 * ⚠️ prev2 gọi **backend production** (`api2.kfsp.vn`, `users.kfsp.vn`, đo ngày 09/11/2026) → tài khoản là tài khoản
 * kfsp.vn thật: `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí). Hệ quả:
 * - `/updateusersettings` + `/delusersettings` luôn bị chặn (abort); body bị chặn ghi lại ở `settingWrites` để assert
 *   "định ghi gì". Web gom setting 1 giây rồi mới gửi (`SaveSettingDebouncer` trong store.js) → assert bằng `expect.poll`.
 * - Mọi API ghi khác (tạo/sửa/xoá dữ liệu, đổi mật khẩu, đăng bài…) spec phải tự giả lập hoặc chặn bằng `page.route`.
 *
 * Phiên lưu ở `.auth/prev2-session-<account>.json` (đã gitignore), chỉ giữ khoá đăng nhập (AUTH_KEYS). 1 worker đăng nhập, worker
 * khác chờ rồi dùng chung — đăng nhập song song nhiều lần làm prev2 quá tải, và tài khoản Free chỉ giữ 1 phiên.
 */
export type Prev2Account = 'paid' | 'free';
export type SettingItem = { key: string; value: string };
type SessionItem = { name: string; value: string };

export const PREV2_BASE_URL = process.env.PREV2_BASE_URL ?? 'https://prev2.vietpointer.vn';

const SESSION_TTL_MS = 6 * 3600_000;
const AUTH_KEYS = ['api_token', 'user_id', 'user_name', 'user_status', 'roles', 'clan', 'avatar', 'expires_in', 'features_disabled', 'last-daily-login-date'];

export function prev2Account(kind: Prev2Account): { email?: string; password?: string } {
  return kind === 'paid'
    ? { email: process.env.TEST_USER_EMAIL, password: process.env.TEST_USER_PASSWORD }
    : { email: process.env.FREE_USER_EMAIL, password: process.env.FREE_USER_PASSWORD };
}

const sessionFile = (kind: Prev2Account) => path.join(__dirname, '..', '.auth', `prev2-session-${kind}.json`);

function readSession(kind: Prev2Account, email: string): SessionItem[] | null {
  try {
    const data = JSON.parse(fs.readFileSync(sessionFile(kind), 'utf8'));
    return data.email === email && Date.now() - data.savedAt < SESSION_TTL_MS ? data.items : null;
  } catch { return null; }
}

async function acquireLoginOrWait(kind: Prev2Account, email: string): Promise<SessionItem[] | null> {
  const lock = sessionFile(kind) + '.lock';
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  try { if (Date.now() - fs.statSync(lock).mtimeMs > 120_000) fs.unlinkSync(lock); } catch { /* chưa có khoá */ }
  try { fs.closeSync(fs.openSync(lock, 'wx')); return null; } catch { /* worker khác đang đăng nhập */ }
  for (let i = 0; i < 120; i++) {
    const s = readSession(kind, email);
    if (s) return s;
    if (!fs.existsSync(lock)) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return readSession(kind, email);
}

export type Prev2OpenOptions = {
  account?: Prev2Account;
  /** Trang mở sau khi đăng nhập (mặc định `/`). */
  path?: string;
  /** Sửa danh sách setting trả về từ `/getusersettings` (vd bơm bố cục, cờ "đã xem"). */
  patchSettings?: (items: SettingItem[]) => SettingItem[];
  /** Khoá localStorage cần xoá sau một lần đăng nhập MỚI (đăng nhập xong app chép setting thật vào localStorage). */
  clearKeysAfterLogin?: string[];
  /** `false` → không bỏ qua popup "Bản tin thị trường" (mặc định đánh dấu đã xem để popup không che màn). */
  bulletinSeen?: boolean;
};

export class Prev2Session {
  /** `listitem` của mọi lần ghi setting đã bị chặn, theo thứ tự. */
  readonly settingWrites: { key: string; value: unknown }[] = [];
  /** Body thô của mọi lần gọi `/delusersettings` đã bị chặn. */
  readonly settingDeletes: unknown[] = [];
  /** `version` ("new"/"old") của mọi lần app định ghi lựa chọn Dashboard (đã giả lập thành công, không tới máy chủ). */
  readonly dashboardPreferenceWrites: string[] = [];

  constructor(private readonly page: Page) {}

  async open(opts: Prev2OpenOptions = {}) {
    const { account = 'paid', path: target = '/', patchSettings, clearKeysAfterLogin = [], bulletinSeen = true } = opts;
    const { email, password } = prev2Account(account);
    if (!email || !password) throw new Error(`Thiếu tài khoản ${account} trong .env (TEST_USER_* / FREE_USER_*)`);

    await this.page.route(/\/(updateusersettings|delusersettings)(\?|$)/, async (route) => {
      try {
        const body = JSON.parse(route.request().postData() || '{}');
        if (/delusersettings/.test(route.request().url())) this.settingDeletes.push(body);
        for (const item of body.listitem || []) this.settingWrites.push(item);
      } catch { /* không phải JSON */ }
      await route.abort();
    });
    // App tự ghi phiên bản Dashboard (cũ/mới) mỗi lần vào trang (userDashboardPreference.mixin.js) → không cho tới
    // production, nhưng trả thành công (huỷ thì app bật toast "Lỗi cập nhật người dùng version dashboard" ở mọi màn).
    await this.page.route(/\/save-user-dashboard-preference(\?|$)/, async (route) => {
      try { this.dashboardPreferenceWrites.push(JSON.parse(route.request().postData() || '{}').version); } catch { /* */ }
      await route.fulfill({ json: { success: true } });
    });
    if (patchSettings) {
      await this.page.route(/\/getusersettings(\?|$)/, async (route) => {
        let res: Awaited<ReturnType<Route['fetch']>> | undefined;
        for (let i = 0; i < 3 && !res; i++) {
          try { res = await route.fetch(); } catch (e) { if (i === 2) throw e; await new Promise((r) => setTimeout(r, 1000)); }
        }
        let items: SettingItem[] = [];
        try { items = await res!.json(); } catch { /* giữ mảng rỗng */ }
        await route.fulfill({ response: res!, json: patchSettings(Array.isArray(items) ? items : []) });
      });
    }
    if (bulletinSeen) {
      // Hình thu nhỏ/popup "Bản tin thị trường" chào 1 lần mỗi phiên: localStorage `kfsp_market_bulletin_seen` = ngày
      // (YYYY-MM-DD giờ VN). Bằng hôm nay → web không gọi `/api/market-bulletin/latest` lúc vào trang
      // (`daChaoBanTinHomNay` trong function_global.js).
      await this.page.addInitScript(() => {
        try { localStorage.setItem('kfsp_market_bulletin_seen', new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)); } catch { /* */ }
      });
    }

    const session = readSession(account, email) ?? await acquireLoginOrWait(account, email);
    if (session) {
      await this.page.addInitScript((items) => {
        try {
          if (sessionStorage.getItem('__autotest_seeded')) return;
          items.forEach((i) => localStorage.setItem(i.name, i.value));
          sessionStorage.setItem('__autotest_seeded', '1');
        } catch { /* */ }
      }, session);
      await this.page.goto(target, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(1500);
      if (!/\/login/.test(this.page.url())) return;
      try { fs.unlinkSync(sessionFile(account)); } catch { /* phiên hết hạn */ }
    }
    const login = new LoginPage(this.page);
    try {
      await login.goto();
      await login.login(email, password);
      await login.expectLoggedIn();
      const items: SessionItem[] = await this.page.evaluate((keys) => keys
        .filter((k) => localStorage.getItem(k) !== null)
        .map((k) => ({ name: k, value: localStorage.getItem(k) || '' })), AUTH_KEYS);
      fs.mkdirSync(path.dirname(sessionFile(account)), { recursive: true });
      fs.writeFileSync(sessionFile(account), JSON.stringify({ email, savedAt: Date.now(), items }));
    } finally {
      try { fs.unlinkSync(sessionFile(account) + '.lock'); } catch { /* */ }
    }
    if (clearKeysAfterLogin.length) {
      await this.page.evaluate((keys) => keys.forEach((k) => localStorage.removeItem(k)), clearKeysAfterLogin);
    }
    await this.page.goto(target, { waitUntil: 'domcontentloaded' });
  }
}
