import { test, expect } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { TradingLogPage, NK_TABS } from '../pages/TradingLogPage';

/**
 * NKGD — khung 5 tab (testcases/nhat-ky-giao-dich.md). Chạy trên prev2 (preprod mới nhất, backend production):
 * toàn bộ API NKGD là máy chủ giả, mọi request ghi khác bị huỷ — `afterEach` kiểm tra không có gì lọt ra ngoài.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let nk: TradingLogPage;
test.beforeEach(async ({ page }) => { nk = new TradingLogPage(page); });
test.afterEach(async () => { expect(nk.server.blocked, 'request ghi lọt tới máy chủ thật').toEqual([]); });

/** Nội dung đặc trưng của từng tab (để biết tab đã thật sự đổi). */
const marker = (p: TradingLogPage, tab: typeof NK_TABS[number]) => ({
  'Tài sản': p.pane.getByRole('heading', { name: 'Tài sản ròng (NAV)' }),
  'Giao dịch': p.thFilterBtn,
  'Phân tích giao dịch': p.pane.getByRole('button', { name: 'Phong cách và rủi ro' }),
  'Phân bổ vốn': p.pane.getByText('Thiết lập deal tiếp theo'),
  'Danh mục': p.dmAddBtn,
}[tab]);

test.describe('Truy cập & tổng quan', () => {
  test('TC_NKGD_01: 5 tab đúng thứ tự, "Tài sản" active mặc định', async () => {
    await nk.open({ tab: null });
    await expect(nk.tabBar.getByRole('link')).toHaveText([...NK_TABS]);
    expect(await nk.activeTab()).toBe('Tài sản');
    await expect(marker(nk, 'Tài sản')).toBeVisible({ timeout: 20000 });
  });

  test('TC_NKGD_02: Chưa đăng nhập → chuyển về /login', async ({ page }) => {
    await page.goto('/nhat-ky-giao-dich');
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    await expect(nk.tabBar).toHaveCount(0);
  });
});

test.describe('Chuyển tab', () => {
  test('TC_NKGD_03: Chuyển lần lượt 5 tab — đúng nội dung, không lỗi JS', async () => {
    await nk.open();
    for (const name of [...NK_TABS.slice(1), 'Tài sản' as const]) {
      await nk.gotoTab(name);
      await expect(marker(nk, name)).toBeVisible({ timeout: 20000 });
      expect(await nk.activeTab()).toBe(name);
    }
    expect(nk.pageErrors).toEqual([]);
  });

  test('TC_NKGD_04: Bấm tab nhanh liên tục — dừng đúng tab cuối; chỉ tải lại nhật ký khi rời tab Danh mục', async () => {
    await nk.open();
    await nk.waitData();
    const before = nk.server.reads.getAll;
    for (let round = 0; round < 2; round++) for (const name of NK_TABS) await nk.tab(name).click();
    await expect(nk.tab('Danh mục')).toHaveClass(/active/);
    await expect(marker(nk, 'Danh mục')).toBeVisible();
    // 2 vòng, dừng ở Danh mục → rời tab Danh mục đúng 1 lần (vòng 1 → vòng 2) → nạp lại nhật ký đúng 1 lần.
    await expect.poll(() => nk.server.reads.getAll).toBe(before + 1);
    expect(nk.pageErrors).toEqual([]);
  });

  test('TC_NKGD_05: Deep-link ?tab=nhat-ky-giao-dich mở "Giao dịch", thắng bản nhớ và ghi đè bản nhớ', async () => {
    await nk.open({ tab: 4, query: 'tab=nhat-ky-giao-dich' });
    await expect(nk.tab('Giao dịch')).toHaveClass(/active/);
    await expect(marker(nk, 'Giao dịch')).toBeVisible({ timeout: 20000 });
    expect(JSON.parse((await nk.ls('trading_log_view_state'))!)).toEqual({ active_tab: 1 });
  });

  test('TC_NKGD_06: Tab đang chọn được nhớ — F5 mở lại đúng tab, URL không đổi', async ({ page }) => {
    await nk.open();
    await nk.gotoTab('Danh mục');
    expect(JSON.parse((await nk.ls('trading_log_view_state'))!)).toEqual({ active_tab: 4 });
    expect(new URL(page.url()).search).toBe('');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(nk.tab('Danh mục')).toHaveClass(/active/, { timeout: 30000 });
    await expect(marker(nk, 'Danh mục')).toBeVisible({ timeout: 20000 });
  });

  test('TC_NKGD_07: Nút Back rời khỏi trang (chuyển tab không tạo lịch sử)', async ({ page }) => {
    await nk.open({ waitTabs: false });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.goto('/nhat-ky-giao-dich', { waitUntil: 'domcontentloaded' });
    await expect(nk.tabBar).toBeVisible({ timeout: 30000 });
    await nk.gotoTab('Giao dịch');
    await nk.gotoTab('Phân bổ vốn');
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  for (const [label, value] of [['ngoài khoảng (9)', '{"active_tab":9}'], ['không phải JSON', 'abc{']] as const) {
    test(`TC_NKGD_08: Bản nhớ tab ${label} → về "Tài sản", không trắng trang`, async () => {
      await nk.open({ tab: null, local: { trading_log_view_state: value } });
      expect(await nk.activeTab()).toBe('Tài sản');
      await expect(marker(nk, 'Tài sản')).toBeVisible({ timeout: 20000 });
      expect(nk.pageErrors).toEqual([]);
    });
  }
});

test.describe('Giới hạn theo gói hội viên', () => {
  test('TC_NKGD_09: Free — cả 5 tab hiện ProtectedView, không có nội dung thật', async () => {
    await nk.open({ account: 'free' });
    for (const name of NK_TABS) {
      await nk.tab(name).click();
      await expect(nk.tab(name)).toHaveClass(/active/);
      await expect(nk.protectedView, name).toBeVisible({ timeout: 20000 });
      await expect(marker(nk, name), name).toHaveCount(0);
    }
  });

  test('TC_NKGD_10: Trả phí — không tab nào bị khoá', async () => {
    await nk.open();
    for (const name of NK_TABS) {
      await nk.gotoTab(name);
      await expect(marker(nk, name), name).toBeVisible({ timeout: 20000 });
      await expect(nk.protectedView, name).toHaveCount(0);
    }
  });
});

test.describe('Responsive', () => {
  for (const vp of [{ width: 375, height: 812 }, { width: 768, height: 1024 }]) {
    test(`TC_NKGD_11: ${vp.width}px — 5 tab bấm được, trang không cuộn ngang, NAV hiện đủ`, async ({ page }) => {
      await page.setViewportSize(vp);
      await nk.open();
      await expect(nk.tsNavValue).toBeVisible({ timeout: 20000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      for (const name of NK_TABS) {
        await nk.tab(name).scrollIntoViewIfNeeded();
        await nk.tab(name).click();
        await expect(nk.tab(name)).toHaveClass(/active/);
      }
    });
  }
});
