import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['./tests/helpers/result-reporter.ts'],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Chỉ chạy Chromium — theo quyết định của người dùng, không cần test Firefox/WebKit.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
