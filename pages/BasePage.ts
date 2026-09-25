import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string, options?: Parameters<Page['goto']>[1]) {
    await this.page.goto(path, options);
  }
}
