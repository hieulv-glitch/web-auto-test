import { test, expect } from '@playwright/test';

test('trang chủ tải thành công', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
