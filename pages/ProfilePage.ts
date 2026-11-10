import { Page, Locator, Route, Request } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Trang cá nhân (`/profile`, `src/views/users/Profile.vue`) + Đổi mật khẩu (`/change_password`,
 * `src/views/users/ChangePassword.vue`) — giao diện làm lại trên `preprod` (commit "Trang cá nhân và đổi mật khẩu: làm lại
 * giao diện theo thiết kế app"). Chạy trên prev2 (bản build preprod mới nhất) — xem `Prev2Session`.
 *
 * ⚠️ AN TOÀN DỮ LIỆU — prev2 gọi backend PRODUCTION, tài khoản là tài khoản thật dùng chung:
 * - `FakeProfileServer` chiếm MỌI request tới `api2.kfsp.vn` / `users.kfsp.vn` của trang:
 *   - `GET /api/users/{id}/edit` (thông tin tài khoản): trả hồ sơ giả (mặc định) hoặc đọc thật nếu `profile = null`.
 *   - `GET /api/user-logs/reference` (nhật ký giới thiệu): trả nhật ký giả.
 *   - `GET /api/user-logs/alert-reference` (đánh dấu ĐÃ XEM nhật ký — tuy là GET nhưng là lệnh ghi): giả lập, không tới máy chủ.
 *   - `POST /api/users/update-info`, `POST /api/users/{id}/passwd`, `POST /api/users/{id}/chavatar`: giả lập theo `mode`
 *     (mặc định `abort`), ghi body lại để assert.
 *   - MỌI request không phải GET còn lại tới 2 host trên (trừ `/api/login`) bị huỷ và ghi vào `blockedWrites`
 *     (vd `/api/logout`). Riêng `save-user-dashboard-preference` (app tự gửi mỗi lần vào trang) được trả thành công
 *     giả — không tới máy chủ, và không bật toast lỗi che các toast cần kiểm tra.
 * - Setting (`/updateusersettings`, `/delusersettings`) bị chặn sẵn trong `Prev2Session`.
 */
export type ApiMode = 'ok' | 'slow' | '500' | '422' | 'abort';

export type FakeProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan_name: string;
  status: string;
  forever: number;
  activate_date: string | null;
  expiry_date: string | null;
  personal_reference_code: string;
  telegram_username: string;
  avatar?: string | null;
};

export type RefLog = { status: string; log_type: string; log: string };

/** Hồ sơ giả mặc định: Hội viên Bạc, kích hoạt 30 ngày trước, còn 70 ngày. */
export function fakeProfile(over: Partial<FakeProfile> = {}): FakeProfile {
  return {
    id: 999001,
    name: 'Nhà đầu tư Test',
    email: 'autotest@example.com',
    phone: '0900000001',
    address: 'Hà Nội',
    plan_name: 'Hội viên Bạc',
    status: 'Paid',
    forever: 1,
    activate_date: dayOffset(-30),
    expiry_date: dayOffset(70),
    personal_reference_code: 'AUTO01',
    telegram_username: 'tg_autotest',
    ...over,
  };
}

/** Ngày cách hôm nay `n` ngày, dạng `YYYY-MM-DD HH:mm:ss` như backend trả. */
export function dayOffset(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} 10:00:00`;
}
/** `DD/MM/YYYY` của ngày cách hôm nay `n` ngày — đúng định dạng thẻ gói hiển thị. */
export function dayLabel(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function refLog(type: 'reference_success' | 'active_reference_success', date: string, who: string, discount: number, status = 'New'): RefLog {
  const log = type === 'reference_success' ? { date, new_user: who, discount } : { date, referencer: who, discount };
  return { status, log_type: type, log: JSON.stringify(log) };
}

const API_HOST = /^https:\/\/(api2|users)\.kfsp\.vn\//;

export class FakeProfileServer {
  /** `null` → `GET /edit` đọc thật từ production (chỉ đọc). */
  profile: FakeProfile | null = fakeProfile();
  referenceLogs: RefLog[] = [];
  editMode: 'ok' | '500' = 'ok';
  referenceMode: 'ok' | '500' = 'ok';
  updateMode: ApiMode = 'abort';
  passwdMode: ApiMode = 'abort';
  avatarMode: ApiMode = 'abort';
  /** Body JSON trả kèm khi mode là '422' / '500' (vd `{ errors: { phone: ['…'] } }` hoặc `{ message: '…' }`). */
  errorBody: unknown = {};
  /** Đường dẫn ảnh giả trả về khi đổi ảnh thành công. */
  avatarPath = '/autotest/avatar.jpg';

  readonly updates: Record<string, unknown>[] = [];
  readonly passwds: Record<string, unknown>[] = [];
  readonly avatarUploads: { contentType: string; body: Buffer }[] = [];
  alertReferenceCalls = 0;
  readonly blockedWrites: string[] = [];

  async install(page: Page) {
    await page.route(API_HOST, (route) => this.handle(route));
  }

  private async reply(route: Route, mode: ApiMode, okJson: unknown) {
    if (mode === 'abort') return route.abort();
    if (mode === 'slow') await new Promise((r) => setTimeout(r, 2500));
    if (mode === '500') return route.fulfill({ status: 500, json: this.errorBody });
    if (mode === '422') return route.fulfill({ status: 422, json: this.errorBody });
    return route.fulfill({ json: okJson });
  }

  private async handle(route: Route) {
    const req: Request = route.request();
    const url = req.url();
    const method = req.method();
    const short = url.replace(/\?.*/, '');

    if (method === 'GET' && /\/api\/users\/\d+\/edit/.test(url)) {
      if (this.editMode === '500') return route.fulfill({ status: 500, json: {} });
      if (!this.profile) return route.fallback();
      return route.fulfill({ json: { ...this.profile, avatar: this.profile.avatar ?? null } });
    }
    if (/\/api\/user-logs\/alert-reference/.test(url)) {
      this.alertReferenceCalls++;
      return route.fulfill({ json: { success: true } });
    }
    if (method === 'GET' && /\/api\/user-logs\/reference(\?|$)/.test(url)) {
      if (this.referenceMode === '500') return route.fulfill({ status: 500, json: {} });
      return route.fulfill({ json: { log: this.referenceLogs } });
    }
    if (method === 'POST' && /\/api\/users\/update-info/.test(url)) {
      const body = safeJson(req.postData());
      this.updates.push(body);
      if (this.updateMode === 'ok' || this.updateMode === 'slow') {
        if (this.profile) {
          for (const k of ['name', 'phone', 'address'] as const) if (typeof body[k] === 'string') this.profile[k] = body[k] as string;
        }
      }
      return this.reply(route, this.updateMode, { success: true });
    }
    if (method === 'POST' && /\/api\/users\/\d+\/passwd/.test(url)) {
      this.passwds.push(safeJson(req.postData()));
      return this.reply(route, this.passwdMode, { success: true });
    }
    if (method === 'POST' && /\/api\/users\/\d+\/chavatar/.test(url)) {
      this.avatarUploads.push({ contentType: req.headers()['content-type'] || '', body: req.postDataBuffer() ?? Buffer.alloc(0) });
      if ((this.avatarMode === 'ok' || this.avatarMode === 'slow') && this.profile) this.profile.avatar = this.avatarPath;
      return this.reply(route, this.avatarMode, { storedPath: this.avatarPath });
    }
    if (/save-user-dashboard-preference/.test(url)) {
      // App tự ghi phiên bản Dashboard (cũ/mới) mỗi lần vào trang (userDashboardPreference.mixin.js). Không cho tới
      // production, nhưng trả thành công — huỷ thì app bật toast "Lỗi cập nhật người dùng version dashboard".
      this.blockedWrites.push(`${method} ${short}`);
      return route.fulfill({ json: { success: true } });
    }
    if (method !== 'GET' && !/\/api\/login(\?|$)/.test(url)) {
      this.blockedWrites.push(`${method} ${short}`);
      return route.abort();
    }
    return route.fallback();
  }
}

function safeJson(s: string | null): Record<string, unknown> {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

export type ProfileOpenOptions = {
  account?: Prev2Account;
  path?: string;
};

export class ProfilePage extends BasePage {
  readonly server = new FakeProfileServer();
  readonly session: Prev2Session;
  readonly pageErrors: string[] = [];

  constructor(page: Page) {
    super(page);
    this.session = new Prev2Session(page);
    page.on('pageerror', (e) => this.pageErrors.push(e.message));
  }

  /** Cài máy chủ giả rồi đăng nhập prev2 và mở `path` (mặc định `/profile`). Chỉnh `server` TRƯỚC khi gọi. */
  async open(opts: ProfileOpenOptions = {}) {
    const { account = 'paid', path = '/profile' } = opts;
    await this.server.install(this.page);
    await this.session.open({ account, path });
  }

  async openProfile(opts: ProfileOpenOptions = {}) {
    await this.open({ ...opts, path: '/profile' });
    await this.nameRow.waitFor({ state: 'visible', timeout: 30000 });
  }

  async openChangePassword(opts: ProfileOpenOptions = {}) {
    await this.open({ ...opts, path: '/change_password' });
    await this.cpCurrent.waitFor({ state: 'visible', timeout: 30000 });
  }

  // ================= Trang cá nhân =================
  get root(): Locator { return this.page.locator('.pf-page'); }
  get identityCard(): Locator { return this.page.locator('.pf-ho-so'); }
  get avatarImg(): Locator { return this.identityCard.getByRole('img', { name: 'Ảnh đại diện' }); }
  get avatarInitial(): Locator { return this.identityCard.locator('.pf-anh-chu'); }
  get avatarButton(): Locator { return this.page.getByRole('button', { name: 'Đổi ảnh đại diện' }); }
  get avatarInput(): Locator { return this.identityCard.locator('input[type="file"]'); }
  get avatarBox(): Locator { return this.identityCard.locator('.pf-anh'); }
  get displayName(): Locator { return this.identityCard.locator('.pf-ten'); }
  get badge(): Locator { return this.identityCard.locator('.pf-huy-hieu'); }
  get identityEmail(): Locator { return this.identityCard.locator('.pf-email'); }

  get planCard(): Locator { return this.page.locator('section.pf-goi'); }
  get planName(): Locator { return this.planCard.locator('.pf-goi-vien'); }
  get planButton(): Locator { return this.planCard.locator('.pf-goi-nut'); }
  get planLabel(): Locator { return this.planCard.locator('.pf-goi-nhan'); }
  get planBigText(): Locator { return this.planCard.locator('.pf-goi-chu-lon'); }
  get planDays(): Locator { return this.planCard.locator('.pf-goi-so-lon'); }
  get planBar(): Locator { return this.planCard.locator('.pf-goi-thanh'); }
  get planBarFill(): Locator { return this.planCard.locator('.pf-goi-thanh-chay'); }
  get planDates(): Locator { return this.planCard.locator('.pf-goi-moc span'); }

  get infoCard(): Locator { return this.page.locator('form.pf-thong-tin'); }
  get infoTitle(): Locator { return this.infoCard.getByRole('heading', { name: 'Thông tin cá nhân' }); }
  get editButton(): Locator { return this.page.getByRole('button', { name: 'Chỉnh sửa thông tin cá nhân' }); }
  /** Dòng "nhãn - giá trị" theo nhãn (Tên, Điện thoại, Email, Địa chỉ, Mã giới thiệu). */
  row(label: string): Locator {
    return this.infoCard.locator('.pf-dong').filter({ has: this.page.locator('.pf-dong-nhan', { hasText: new RegExp(`^\\s*${label}\\s*$`) }) });
  }
  rowValue(label: string): Locator { return this.row(label).locator('.pf-dong-gia-tri'); }
  rowError(label: string): Locator { return this.row(label).locator('.pf-loi'); }
  get nameRow(): Locator { return this.row('Tên'); }
  get nameInput(): Locator { return this.page.locator('#pf-name'); }
  get phoneInput(): Locator { return this.page.locator('#pf-phone'); }
  get addressInput(): Locator { return this.page.locator('#pf-address'); }
  get copyButton(): Locator { return this.row('Mã giới thiệu').locator('.pf-nut-chep'); }
  get cancelButton(): Locator { return this.infoCard.getByRole('button', { name: 'Huỷ' }); }
  get saveButton(): Locator { return this.page.locator('#saveProfileUser'); }
  get changePasswordLink(): Locator { return this.page.getByRole('link', { name: 'Đổi mật khẩu' }); }

  get refModal(): Locator { return this.page.locator('.pf-modal-gioi-thieu .modal-content'); }
  get refModalItems(): Locator { return this.refModal.locator('.pf-nhat-ky li'); }
  get refModalMore(): Locator { return this.refModal.locator('.pf-xem-them'); }
  get refModalClose(): Locator { return this.refModal.getByRole('button', { name: 'Đóng' }); }

  get packageModal(): Locator { return this.page.getByRole('dialog').filter({ hasText: 'Chọn dịch vụ' }); }
  get toastError(): Locator { return this.page.locator('.Vue-Toastification__toast--error'); }
  get anyToast(): Locator { return this.page.locator('.Vue-Toastification__toast'); }

  // ================= Header — menu tài khoản =================
  get headerAvatar(): Locator { return this.page.locator('header .c-avatar-img'); }
  async openAccountMenu() {
    await this.page.locator('header .image-container').click();
    await this.accountMenuName.waitFor({ state: 'visible' });
  }
  get accountMenuName(): Locator { return this.page.locator('.dropdown-menu.show .dropdown-header strong'); }
  accountMenuItem(text: string): Locator { return this.page.locator('.dropdown-menu.show .dropdown-item', { hasText: text }); }

  // ================= Đổi mật khẩu =================
  get cpCard(): Locator { return this.page.locator('form.cp-the'); }
  get cpTitle(): Locator { return this.cpCard.getByRole('heading', { name: 'Đổi mật khẩu' }); }
  get cpBack(): Locator { return this.cpCard.getByRole('button', { name: 'Quay lại' }); }
  get cpCurrent(): Locator { return this.page.locator('#cp-mk-cu'); }
  get cpNew(): Locator { return this.page.locator('#cp-mk-moi'); }
  get cpConfirm(): Locator { return this.page.locator('#cp-mk-xn'); }
  cpEye(label: 'mật khẩu hiện tại' | 'mật khẩu mới' | 'xác nhận mật khẩu mới'): Locator {
    return this.cpCard.getByRole('button', { name: new RegExp(`^(Hiện|Ẩn) ${label}$`) });
  }
  cpError(input: Locator): Locator { return input.locator('xpath=ancestor::div[contains(@class,"pf-dong-nhap")]').locator('.pf-loi'); }
  get cpCancel(): Locator { return this.cpCard.getByRole('button', { name: 'Huỷ' }); }
  get cpSubmit(): Locator { return this.page.locator('#saveChangePass'); }

  async fillPasswords(cur: string, neu: string, confirm: string) {
    await this.cpCurrent.fill(cur);
    await this.cpNew.fill(neu);
    await this.cpConfirm.fill(confirm);
  }
}
