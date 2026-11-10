import { Page, Locator, BrowserContext, Route } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ⚠️ localhost/preprod gọi backend PRODUCTION (`$apiAdressNest` = https://api2.kfsp.vn). Mọi API đăng ký đi qua
 * máy chủ giả này (cài ở mức context nên phủ cả tab mới):
 *   - POST /auth/register      → mặc định HUỶ (abort); test cần luồng thành công đặt `registerReply`.
 *   - POST /auth/vertify-otp   → luôn trả giả (`verifyReply`), không bao giờ tới server thật.
 *   - POST /auth/resend-otp    → luôn trả giả (`resendReply`), không gửi OTP thật.
 *   - POST /auth/check-email|check-phone (chỉ tra cứu, không ghi) → mặc định trả giả `{exist:false}`; chỉ test nào
 *     đặt `realLookups = true` mới cho đi thật (TC_DANGKY_38 tra SĐT tài khoản test).
 *   - MỌI request không phải GET khác tới *.kfsp.vn → huỷ + ghi vào `blockedWrites` (spec assert rỗng sau mỗi test).
 */
type Reply = 'abort' | { status?: number; json: unknown; delayMs?: number };

export class FakeRegisterServer {
  static readonly HOST = /^https?:\/\/([\w-]+\.)*kfsp\.vn(:\d+)?\//;
  registerReply: Reply = 'abort';
  verifyReply: Reply = { status: 400, json: { success: false, message: 'Mã OTP không đúng' } };
  resendReply: Reply = { json: { success: true } };
  realLookups = false;
  readonly registerBodies: Record<string, unknown>[] = [];
  readonly verifyBodies: Record<string, unknown>[] = [];
  readonly blockedWrites: string[] = [];

  static ok(otpSendType?: 'email' | 'zalo', delayMs = 0): Reply {
    return { json: { success: true, data: { otpRegisterId: 999999, ...(otpSendType ? { otpSendType } : {}) } }, delayMs };
  }

  async install(context: BrowserContext) {
    await context.route(FakeRegisterServer.HOST, (route) => this.handle(route));
  }

  private async reply(route: Route, r: Reply) {
    if (r === 'abort') return route.abort();
    if (r.delayMs) await new Promise((res) => setTimeout(res, r.delayMs));
    return route.fulfill({ status: r.status ?? 200, json: r.json });
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = req.url().replace(/\?.*/, '');
    const method = req.method();
    if (method === 'GET') return route.fallback();
    const body = (() => { try { return JSON.parse(req.postData() || '{}'); } catch { return {}; } })();
    if (/\/auth\/register$/.test(url)) { this.registerBodies.push(body); return this.reply(route, this.registerReply); }
    if (/\/auth\/vertify-otp$/.test(url)) { this.verifyBodies.push(body); return this.reply(route, this.verifyReply); }
    if (/\/auth\/resend-otp$/.test(url)) return this.reply(route, this.resendReply);
    if (/\/auth\/check-(email|phone)$/.test(url)) {
      return this.realLookups ? route.continue() : route.fulfill({ json: { exist: false } });
    }
    this.blockedWrites.push(`${method} ${url}`);
    return route.abort();
  }
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
}

export class RegisterPage extends BasePage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordConfirmInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly viewPlansLink: Locator;
  readonly logoLink: Locator;
  readonly otpModalTitle: Locator;
  readonly otpInputs: Locator;
  readonly otpCloseButton: Locator;
  readonly otpSwitchChannelButton: Locator;
  readonly supportLinks: Locator;
  readonly toastError: Locator;
  readonly server = new FakeRegisterServer();

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByPlaceholder('Họ tên', { exact: true });
    this.emailInput = page.getByPlaceholder('Email', { exact: true });
    this.phoneInput = page.getByPlaceholder('Điện thoại', { exact: true });
    this.passwordInput = page.getByPlaceholder('Mật khẩu', { exact: true });
    this.passwordConfirmInput = page.getByPlaceholder('Nhập lại mật khẩu', { exact: true });
    this.submitButton = page.locator('button[type="submit"]');
    this.loginLink = page.locator('a[href="/login"]');
    this.viewPlansLink = page.getByRole('link', { name: 'Xem chi tiết các gói tại đây' });
    // Logo trong form (07/10/2026 đổi href "/" → "/home").
    this.logoLink = page.locator('.p-avatar > a');
    this.otpModalTitle = page.getByRole('heading', { name: /Nhập mã OTP/ });
    // 6 ô OTP không có tên/label riêng để phân biệt (chỉ khác vị trí) — dùng .nth() là lựa chọn hợp lý duy nhất ở đây.
    this.otpInputs = page.locator('.otp-wrapper input');
    this.otpCloseButton = page.getByRole('button', { name: 'Đóng', exact: true });
    this.otpSwitchChannelButton = page.getByRole('button', { name: /Xác thực bằng/ });
    this.supportLinks = page.locator('.contact-support a');
    this.toastError = page.locator('.Vue-Toastification__toast--error');
  }

  async goto() {
    await super.goto('/register');
  }

  buildValidData(overrides: Partial<RegisterFormData> = {}): RegisterFormData {
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return {
      name: 'Nguyễn Văn Test',
      email: `test-${unique}@example.com`,
      phone: `09${unique.slice(-8)}`,
      password: 'Abc@1234',
      passwordConfirm: 'Abc@1234',
      ...overrides,
    };
  }

  async fill(data: Partial<RegisterFormData>) {
    if (data.name !== undefined) await this.nameInput.fill(data.name);
    if (data.email !== undefined) await this.emailInput.fill(data.email);
    if (data.phone !== undefined) await this.phoneInput.fill(data.phone);
    if (data.password !== undefined) await this.passwordInput.fill(data.password);
    if (data.passwordConfirm !== undefined) await this.passwordConfirmInput.fill(data.passwordConfirm);
  }

  async submit() {
    await this.submitButton.click();
  }

  fieldError(text: string): Locator {
    return this.page.getByText(text, { exact: false });
  }

  async fillOtp(code: string) {
    const digits = code.split('');
    for (let i = 0; i < digits.length && i < 6; i++) {
      await this.otpInputs.nth(i).fill(digits[i]);
    }
  }
}
