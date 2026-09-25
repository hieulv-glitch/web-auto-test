import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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
    this.logoLink = page.locator('a[href="/"]').first();
    this.otpModalTitle = page.getByText(/Nhập mã OTP/);
    // 6 ô OTP không có tên/label riêng để phân biệt (chỉ khác vị trí) — dùng .nth() là lựa chọn hợp lý duy nhất ở đây.
    this.otpInputs = page.locator('.otp-wrapper input');
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
