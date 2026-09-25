/**
 * Đọc DOM thật của 1 trang trên web (screenshot + accessibility snapshot),
 * dùng làm input để viết/cập nhật testcase & Playwright locator cho đúng thực tế
 * thay vì đoán từ source code.
 *
 * Cách dùng:
 *   npx tsx scripts/inspect-dom.ts <route> [--name <slug>] [--login] [--click "<text>"...] [--fill "<label>=<value>"...]
 *
 * Ví dụ:
 *   npx tsx scripts/inspect-dom.ts /login --name login-initial
 *   npx tsx scripts/inspect-dom.ts /dashboard --name dashboard-overview --login
 *   npx tsx scripts/inspect-dom.ts /watchlist --name watchlist-add-modal --login --click "Thêm mã"
 *
 * Output: in ra JSON { screenshot, ariaSnapshot } là đường dẫn 2 file trong .dom-inspect/
 * (đã .gitignore) — dùng tool Read để xem ảnh + đọc file .aria.txt.
 */
import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';

dotenv.config();

const BASE_URL = process.env.BASE_URL!;
const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;
const OUT_DIR = path.resolve(__dirname, '../.dom-inspect');

function parseArgs(argv: string[]) {
  const route = argv[0];
  if (!route || route.startsWith('--')) {
    throw new Error('Thiếu route. Ví dụ: npx tsx scripts/inspect-dom.ts /login --name login-initial');
  }
  let name = route.replace(/^\//, '').replace(/\//g, '-') || 'root';
  const clicks: string[] = [];
  const fills: { label: string; value: string }[] = [];
  let login = false;

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--name') {
      name = argv[++i];
    } else if (arg === '--login') {
      login = true;
    } else if (arg === '--click') {
      clicks.push(argv[++i]);
    } else if (arg === '--fill') {
      const raw = argv[++i];
      const idx = raw.indexOf('=');
      if (idx === -1) throw new Error(`--fill phải có dạng "label=value", nhận được: ${raw}`);
      fills.push({ label: raw.slice(0, idx), value: raw.slice(idx + 1) });
    }
  }
  return { route, name, clicks, fills, login };
}

async function resolveClickTarget(page: import('@playwright/test').Page, text: string) {
  const byButton = page.getByRole('button', { name: text, exact: false });
  if (await byButton.count()) return byButton.first();
  const byLink = page.getByRole('link', { name: text, exact: false });
  if (await byLink.count()) return byLink.first();
  const byText = page.getByText(text, { exact: false });
  if (await byText.count()) return byText.first();
  throw new Error(`Không tìm thấy phần tử để click với text: "${text}"`);
}

async function resolveFillTarget(page: import('@playwright/test').Page, label: string) {
  const byPlaceholder = page.getByPlaceholder(label, { exact: false });
  if (await byPlaceholder.count()) return byPlaceholder.first();
  const byLabel = page.getByLabel(label, { exact: false });
  if (await byLabel.count()) return byLabel.first();
  const byRole = page.getByRole('textbox', { name: label, exact: false });
  if (await byRole.count()) return byRole.first();
  throw new Error(`Không tìm thấy input để fill với label: "${label}"`);
}

async function main() {
  const { route, name, clicks, fills, login } = parseArgs(process.argv.slice(2));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  if (login) {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, PASSWORD);
    await loginPage.expectLoggedIn();
  }

  await page.goto(route, { waitUntil: 'networkidle' });

  for (const label of clicks) {
    const target = await resolveClickTarget(page, label);
    await target.click();
    await page.waitForTimeout(500);
  }
  for (const { label, value } of fills) {
    const target = await resolveFillTarget(page, label);
    await target.fill(value);
  }

  const screenshotPath = path.join(OUT_DIR, `${name}.png`);
  const ariaPath = path.join(OUT_DIR, `${name}.aria.txt`);

  await page.screenshot({ path: screenshotPath, fullPage: true });
  const ariaSnapshot = await page.locator('body').ariaSnapshot();
  fs.writeFileSync(ariaPath, ariaSnapshot, 'utf-8');

  await browser.close();

  console.log(JSON.stringify({ url: BASE_URL.replace(/\/$/, '') + route, screenshot: screenshotPath, ariaSnapshot: ariaPath }, null, 2));
}

main().catch((err) => {
  console.error('LỖI:', err.message);
  process.exit(1);
});
