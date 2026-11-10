import { test, expect as baseExpect, Page } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;

/** Đăng nhập prev2 bằng phiên đã cache (Prev2Session) rồi vào /dashboard. */
async function loginFirst(page: Page) {
  await new DashboardPage(page).open();
}

test.use({ baseURL: PREV2_BASE_URL });
// prev2 (backend production) đổ dữ liệu thị trường qua socket — lúc tải nặng chậm hơn hẳn mốc 5 giây mặc định.
const expect = baseExpect.configure({ timeout: 15_000 });
test.describe.configure({ timeout: 90_000 });

test.describe('Dashboard/Tab thị trường — Việt Nam: 5 sub-tab', () => {
  test('TC_DASHBOARD_TT_01: Hiển thị 5 sub-tab, "Diễn biến" active mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.panelSubTab('Diễn biến')).toHaveClass(/active/);
    for (const name of ['Top', 'NN & TD', 'Độ rộng TT', 'Định giá']) {
      await expect(dashboard.panelSubTab(name)).toBeVisible();
    }
  });

  test('TC_DASHBOARD_TT_02: Chuyển sub-tab "Việt Nam"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);

    // Từ 20/10/2026 biểu đồ "Ảnh hưởng thị trường" nằm ở sub-tab Diễn biến (trước ở Top).
    const affectTitle = page.locator('.header-chart-title, .board-chart-wrapper p', { hasText: 'Ảnh hưởng thị trường' });
    await expect(affectTitle).toBeVisible();

    await dashboard.panelSubTab('Top').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Top')).toHaveClass(/active/);
    await expect(page.locator('.top-stock-title', { hasText: 'Top khối lượng' })).toBeVisible();
    await expect(affectTitle).toHaveCount(0);

    await dashboard.panelSubTab('NN & TD').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('NN & TD')).toHaveClass(/active/);

    await dashboard.panelSubTab('Độ rộng TT').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Độ rộng TT')).toHaveClass(/active/);

    await dashboard.panelSubTab('Định giá').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Định giá')).toHaveClass(/active/);

    await dashboard.panelSubTab('Diễn biến').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Diễn biến')).toHaveClass(/active/);
    await expect(affectTitle).toBeVisible();
  });

  test('TC_DASHBOARD_TT_03: Đổi chỉ số đang chọn áp dụng cho toàn bộ sub-tab đang xem', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.panelSubTab('Top').click();
    await page.waitForTimeout(500);

    await dashboard.indexCard('HNXINDEX').click();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.top-stock-title', { hasText: 'Top khối lượng' })).toBeVisible();
  });
});

test.describe('Dashboard/Tab thị trường — Quốc tế', () => {
  test('TC_DASHBOARD_TT_04: Hiển thị 5 sub-tab thị trường quốc tế', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Quốc tế').click();
    await page.waitForTimeout(600);

    await expect(dashboard.panelSubTab('Chỉ số')).toHaveClass(/active/);
    for (const name of ['Cổ phiếu', 'Tiền tệ', 'Hàng hoá', 'Trái phiếu']) {
      await expect(dashboard.panelSubTab(name)).toBeVisible();
    }
    await expect(dashboard.marketDisplayToggleIcon).toBeVisible();
  });

  test('TC_DASHBOARD_TT_05: Chuyển đổi kiểu hiển thị (danh sách <-> thẻ)', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Quốc tế').click();
    await page.waitForTimeout(600);

    await expect(page.locator('.v3-crypto-list-container')).toBeVisible();

    await dashboard.marketDisplayToggleIcon.click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.v3-crypto-list-container')).toHaveCount(0);

    await dashboard.marketDisplayToggleIcon.click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.v3-crypto-list-container')).toBeVisible();
  });

  test('TC_DASHBOARD_TT_06: Click 1 dòng mở modal Trading Chart, không điều hướng rời trang', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Quốc tế').click();
    await page.waitForTimeout(600);

    // Danh sách đổ dữ liệu qua socket real-time — có thể chậm hơn bình thường khi máy đang chạy nhiều
    // worker Playwright song song cùng lúc, nên chờ rộng rãi hơn mốc thời gian UI thông thường.
    await dashboard.marketRowItems.first().waitFor({ state: 'visible', timeout: 30000 });
    await dashboard.marketRowItems.first().click();
    await page.waitForTimeout(800);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('iframe[title="Financial Chart"]')).toBeVisible();

    await dashboard.visibleModalCloseButton.first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('iframe[title="Financial Chart"]')).toHaveCount(0);
  });
});

test.describe('Dashboard/Tab thị trường — Crypto', () => {
  test('TC_DASHBOARD_TT_07: Hiển thị tổng quan Crypto', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Crypto').click();
    await page.waitForTimeout(600);

    await expect(page.getByText('Vốn hóa TT')).toBeVisible();
    await expect(page.getByText('Tỷ lệ vốn hóa')).toBeVisible();
    await expect(dashboard.marketRowItems.first()).toBeVisible();
  });

  test('TC_DASHBOARD_TT_08: Click khối tổng quan Crypto mở /crypto ở tab mới', async ({ page, context }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Crypto').click();
    await page.waitForTimeout(600);

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      dashboard.cryptoOverview.click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/crypto');
    await expect(page).toHaveURL(/\/dashboard$/);
    await newPage.close();
  });

  test('TC_DASHBOARD_TT_09: Click 1 dòng coin mở modal Trading Chart', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Crypto').click();
    await page.waitForTimeout(600);

    await dashboard.marketRowItems.first().click();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('iframe[title="Financial Chart"]')).toBeVisible();

    await dashboard.visibleModalCloseButton.first().click({ force: true });
    await page.waitForTimeout(500);
  });
});

test.describe('Dashboard/Tab thị trường — Sự kiện', () => {
  test('TC_DASHBOARD_TT_10: Hiển thị 2 sub-tab Quốc tế/Cổ phiếu', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Sự kiện').click();
    await page.waitForTimeout(600);

    await expect(dashboard.panelSubTab('Quốc tế')).toHaveClass(/active/);
    await expect(dashboard.panelSubTab('Cổ phiếu')).toBeVisible();
    await expect(page.getByText('Các quốc gia')).toBeVisible();
  });

  test('TC_DASHBOARD_TT_11: Chuyển sang sub-tab "Cổ phiếu"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Sự kiện').click();
    await page.waitForTimeout(600);

    await dashboard.panelSubTab('Cổ phiếu').click();
    await page.waitForTimeout(600);
    await expect(dashboard.panelSubTab('Cổ phiếu')).toHaveClass(/active/);
  });
});

test.describe('Dashboard/Tab thị trường — Vĩ mô', () => {
  test('TC_DASHBOARD_TT_12: Hiển thị đầy đủ các section vĩ mô', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Vĩ mô').click();
    await page.waitForTimeout(800);

    for (const title of ['GDP', 'Công nghiệp', 'Thương mại', 'Xuất nhập khẩu', 'Đầu tư', 'CPI']) {
      await expect(page.locator('.v3-marco-chart-title', { hasText: title })).toBeVisible();
    }
    await expect(dashboard.viMoLink).toBeVisible();
  });

  test('TC_DASHBOARD_TT_13: Click icon mũi tên chuyển sang trang Vĩ mô đầy đủ', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.marketTab('Vĩ mô').click();
    await page.waitForTimeout(800);

    await dashboard.viMoLink.click();
    await expect(page).toHaveURL(/\/vi-mo/);
  });

  test('TC_DASHBOARD_TT_14: Tài khoản Free — tab Vĩ mô: GDP hiện dữ liệu, 5 mục còn lại khoá "Nâng cấp ngay"', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open('free');
    await dashboard.marketTab('Vĩ mô').click();
    const item = (title: string) => page.locator('.marco-chart-item')
      .filter({ has: page.locator('.v3-marco-chart-title', { hasText: new RegExp(`^${title}$`) }) });

    await expect(item('GDP')).toBeVisible();
    await expect(item('GDP').locator('.free-user-img-wrapper')).toHaveCount(0);
    await expect(item('GDP').locator('canvas').first()).toBeVisible({ timeout: 15_000 });
    for (const title of ['Công nghiệp', 'Thương mại', 'Xuất nhập khẩu', 'Đầu tư', 'CPI']) {
      await expect(item(title).locator('.free-user-img-wrapper'), title).toBeVisible();
      await expect(item(title), title).toContainText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này');
      await expect(item(title).locator('canvas'), title).toHaveCount(0);
    }
    // "Nâng cấp ngay" mở bảng chọn gói (store.isShowModalPackage).
    await item('CPI').getByText('Nâng cấp ngay').click();
    await expect(page.locator('.modal.show', { hasText: 'Chọn dịch vụ' })).toBeVisible();
  });
});
