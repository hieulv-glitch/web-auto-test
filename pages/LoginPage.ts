import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly persistCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly logoLink: Locator;
  readonly cornerLogoLink: Locator;
  readonly errorAlert: Locator;
  readonly errorModal: Locator;
  readonly errorModalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByPlaceholder('Nhập email hoặc số điện thoại');
    this.passwordInput = page.getByPlaceholder('Nhập mật khẩu');
    this.loginButton = page.locator('#btn-login');
    // Checkbox "Duy trì đăng nhập" đã bị gỡ trên preprod (commit ff0dbcdc8, 06/11/2026 — web luôn gửi
    // `persist_login: true`). Giữ locator để nhận biết bản build cũ còn checkbox; `login()` không chạm vào nó.
    this.persistCheckbox = page.getByLabel('Duy trì đăng nhập');
    this.forgotPasswordLink = page.locator('a[href="/request-password"]');
    this.registerLink = page.locator('a[href="/register"]');
    // Logo trong thẻ đăng nhập (`.p-avatar`). Từ 07/10/2026 trỏ `/home` (trước là `/home/#trang-chu`).
    this.logoLink = page.locator('.p-avatar a');
    // Logo "KFSP" cố định ở góc trên trái (thêm 07/10/2026, giống thanh menu trang chủ).
    this.cornerLogoLink = page.locator('a.login-corner-logo');
    this.errorAlert = page.getByRole('alert');
    this.errorModal = page.locator('.modal-error-login');
    this.errorModalCloseButton = page.locator('.modal-error-login .close-button');
  }

  async goto() {
    await super.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoggedIn() {
    await this.page.waitForURL(/\/dashboard/);
  }

  async expectGenericError() {
    // Thông báo hiện sau khi /api/login trả lỗi — backend (production) lúc tải nặng trả lời >5 giây.
    await expect(this.errorAlert).toBeVisible({ timeout: 15_000 });
    await expect(this.errorAlert).toContainText('Tài khoản hoặc mật khẩu không đúng');
  }
}
