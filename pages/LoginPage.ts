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
  readonly errorAlert: Locator;
  readonly errorModal: Locator;
  readonly errorModalCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByPlaceholder('Nhập email hoặc số điện thoại');
    this.passwordInput = page.getByPlaceholder('Nhập mật khẩu');
    this.loginButton = page.locator('#btn-login');
    this.persistCheckbox = page.getByLabel('Duy trì đăng nhập');
    this.forgotPasswordLink = page.locator('a[href="/request-password"]');
    this.registerLink = page.locator('a[href="/register"]');
    this.logoLink = page.locator('a[href="/home/#trang-chu"]');
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
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText('Tài khoản hoặc mật khẩu không đúng');
  }
}
