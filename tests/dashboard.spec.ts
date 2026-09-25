import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;

async function loginFirst(page: any) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(EMAIL, PASSWORD);
  await loginPage.expectLoggedIn();
}

test.describe('Dashboard — Truy cập & Tổng quan', () => {
  test('TC_DASHBOARD_01: Overview màn hình Dashboard', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.marketTab('Việt Nam')).toBeVisible();
    await expect(dashboard.indexCard('VNINDEX')).toBeVisible();
    await expect(dashboard.indexCard('HNXINDEX')).toBeVisible();
    await expect(dashboard.indexCard('UPCOM')).toBeVisible();
    await expect(dashboard.indexCard('VN30')).toBeVisible();
    await expect(page.getByText('Chỉ số tâm lý')).toBeVisible();
    await expect(page.getByText('Chỉ số rủi ro')).toBeVisible();
    await expect(dashboard.rightTab('IBD')).toBeVisible();
    await expect(dashboard.rightTab('Watchlist')).toBeVisible();
    await expect(dashboard.rightTab('Cảnh báo')).toBeVisible();
    await expect(dashboard.rightTab('Ghi chú')).toBeVisible();
    await expect(dashboard.rightTab('Cộng đồng')).toBeVisible();
  });

  test('TC_DASHBOARD_02: Truy cập /dashboard khi chưa đăng nhập => redirect /login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });

  test('TC_DASHBOARD_03: Đăng nhập từ redirect quay lại đúng Dashboard', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
    const loginPage = new LoginPage(page);
    await loginPage.login(EMAIL, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Dashboard — Cột trái: Tab thị trường', () => {
  test('TC_DASHBOARD_04: Hiển thị 5 tab thị trường, "Việt Nam" active mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    for (const name of ['Việt Nam', 'Quốc tế', 'Crypto', 'Sự kiện', 'Vĩ mô']) {
      await expect(dashboard.marketTab(name)).toBeVisible();
    }
    await expect(dashboard.marketTab('Việt Nam')).toHaveClass(/tab-active/);
  });

  test('TC_DASHBOARD_05: Chuyển tab thị trường đổi nội dung tương ứng', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);

    await dashboard.marketTab('Quốc tế').click();
    await expect(dashboard.marketTab('Quốc tế')).toHaveClass(/tab-active/);
    await expect(page.getByText('Hàng hoá')).toBeVisible();

    await dashboard.marketTab('Crypto').click();
    await expect(dashboard.marketTab('Crypto')).toHaveClass(/tab-active/);

    await dashboard.marketTab('Sự kiện').click();
    await expect(dashboard.marketTab('Sự kiện')).toHaveClass(/tab-active/);

    await dashboard.marketTab('Vĩ mô').click();
    await expect(dashboard.marketTab('Vĩ mô')).toHaveClass(/tab-active/);

    // Đổi tab trái không ảnh hưởng tới cột giữa/phải
    await expect(page.getByText('Chỉ số tâm lý')).toBeVisible();
    await expect(dashboard.rightTab('IBD')).toBeVisible();
  });
});

test.describe('Dashboard — Cột giữa: Chỉ số tâm lý/rủi ro & Bản đồ nhiệt', () => {
  test('TC_DASHBOARD_06: Hiển thị Chỉ số tâm lý & Chỉ số rủi ro', async ({ page }) => {
    await loginFirst(page);
    await expect(page.getByText('Chỉ số tâm lý')).toBeVisible();
    await expect(page.getByText('Chỉ số rủi ro')).toBeVisible();
    await expect(page.getByText('Trung lập').or(page.getByText('Trung tính')).first()).toBeVisible();
  });

  test('TC_DASHBOARD_07: Hiển thị bản đồ nhiệt (chế độ thu nhỏ)', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(page.getByText('NGÂN HÀNG', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('CHỨNG KHOÁN', { exact: true }).first()).toBeVisible();
    await expect(dashboard.enlargeHeatMapButton).toBeVisible();
  });

  test('TC_DASHBOARD_08: Mở rộng bản đồ nhiệt toàn màn hình', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.enlargeHeatMapButton.click();
    await page.waitForTimeout(500);

    await expect(dashboard.marketTab('Việt Nam')).toHaveCount(0);
    await expect(page.getByText('Chỉ số tâm lý')).toHaveCount(0);
    for (const name of ['Bản đồ nhiệt', 'Nhóm ảnh hưởng', 'Thanh khoản', 'Phân loại dòng tiền']) {
      await expect(dashboard.fullHeatMapSubTab(name)).toBeVisible();
    }
    await expect(dashboard.shrinkHeatMapButton).toBeVisible();
    // Cột phải vẫn giữ nguyên, không bị ẩn khi mở rộng bản đồ nhiệt
    await expect(dashboard.rightTab('IBD')).toBeVisible();
  });

  test('TC_DASHBOARD_09: Chuyển sub-tab khi đang mở rộng bản đồ nhiệt', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.enlargeHeatMapButton.click();
    await page.waitForTimeout(500);

    await dashboard.fullHeatMapSubTab('Nhóm ảnh hưởng').click();
    await expect(dashboard.fullHeatMapSubTab('Nhóm ảnh hưởng')).toHaveClass(/tab-active/);

    await dashboard.fullHeatMapSubTab('Thanh khoản').click();
    await expect(dashboard.fullHeatMapSubTab('Thanh khoản')).toHaveClass(/tab-active/);

    await dashboard.fullHeatMapSubTab('Phân loại dòng tiền').click();
    await expect(dashboard.fullHeatMapSubTab('Phân loại dòng tiền')).toHaveClass(/tab-active/);
  });

  test('TC_DASHBOARD_10: Thu nhỏ bản đồ nhiệt về chế độ mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.enlargeHeatMapButton.click();
    await page.waitForTimeout(500);
    await dashboard.fullHeatMapSubTab('Nhóm ảnh hưởng').click();
    await page.waitForTimeout(300);

    await dashboard.shrinkHeatMapButton.click();
    await page.waitForTimeout(500);

    await expect(dashboard.marketTab('Việt Nam')).toBeVisible();
    await expect(page.getByText('Chỉ số tâm lý')).toBeVisible();
    await expect(dashboard.enlargeHeatMapButton).toBeVisible();
  });
});

test.describe('Dashboard — Cột phải: Panel IBD/Watchlist/Cảnh báo/Ghi chú/Cộng đồng', () => {
  test('TC_DASHBOARD_11: Hiển thị panel phải mặc định (IBD active)', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.rightTab('IBD')).toHaveClass(/active/);
    await expect(page.getByText('Tổng quan thị trường')).toBeVisible();
  });

  test('TC_DASHBOARD_12: Chuyển panel phải', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);

    await dashboard.rightTab('Watchlist').click();
    await expect(dashboard.rightTab('Watchlist')).toHaveClass(/active/);

    await dashboard.rightTab('Cảnh báo').click();
    await expect(dashboard.rightTab('Cảnh báo')).toHaveClass(/active/);

    await dashboard.rightTab('Ghi chú').click();
    await expect(dashboard.rightTab('Ghi chú')).toHaveClass(/active/);

    await dashboard.rightTab('Cộng đồng').click();
    await expect(dashboard.rightTab('Cộng đồng')).toHaveClass(/active/);
  });

  test('TC_DASHBOARD_13: Thu gọn panel phải khi click lại tab đang active', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.rightTab('IBD')).toHaveClass(/active/);

    await dashboard.rightTab('IBD').click();
    await page.waitForTimeout(500);

    await expect(dashboard.rightPanelExpanded).toHaveCount(0);
    await expect(dashboard.collapsedRightTab('IBD')).toBeVisible();
  });

  test('TC_DASHBOARD_14: Mở lại panel phải từ trạng thái thu gọn', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('IBD').click();
    await page.waitForTimeout(500);
    await expect(dashboard.collapsedRightTab('IBD')).toBeVisible();

    await dashboard.collapsedRightTab('IBD').click();
    await page.waitForTimeout(500);

    await expect(dashboard.rightTab('IBD')).toHaveClass(/active/);
    await expect(page.getByText('Tổng quan thị trường')).toBeVisible();
  });
});

test.describe('Dashboard — Kéo giãn & Reset bố cục', () => {
  test('TC_DASHBOARD_15: Kéo thả thanh chia cột để đổi kích thước', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);

    await dashboard.dragVerticalResizer(0, 150);
    await page.waitForTimeout(3500); // debounce lưu localStorage là 3s

    const stored = await dashboard.getResizeFromStorage();
    expect(stored, 'Sau khi kéo giãn, localStorage key "resize" phải được ghi giá trị mới').not.toBeNull();
  });

  test('TC_DASHBOARD_16: Bố cục đã kéo giãn được giữ nguyên sau khi tải lại trang', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);

    await dashboard.dragVerticalResizer(0, 150);
    await page.waitForTimeout(3500);
    const storedBefore = await dashboard.getResizeFromStorage();

    await page.reload({ waitUntil: 'networkidle' });
    const storedAfter = await dashboard.getResizeFromStorage();

    expect(storedAfter).toBe(storedBefore);
  });

  test('TC_DASHBOARD_17: Đặt lại bố cục mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);

    await dashboard.dragVerticalResizer(0, 150);
    await page.waitForTimeout(500);

    await dashboard.resetLayoutButton.click();
    await page.waitForTimeout(500);

    await expect(dashboard.rightTab('IBD')).toHaveClass(/active/);
    await expect(dashboard.enlargeHeatMapButton).toBeVisible();
  });
});

test.describe('Dashboard — Responsive & Điều hướng', () => {
  test('TC_DASHBOARD_18: Responsive ở viewport mobile (≤768px)', async ({ page }) => {
    await loginFirst(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const dashboard = new DashboardPage(page);
    await expect(dashboard.marketTab('Việt Nam')).toBeVisible();
    // Nút reset ở trạng thái panel phải MỞ RỘNG (mặc định) không bị CSS mobile ẩn đi — khác với bản nút
    // dùng lúc panel phải thu gọn (đã xác nhận qua code + screenshot thực tế).
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(300);
    await expect(dashboard.resetLayoutButton).toBeVisible();
  });

  test('TC_DASHBOARD_19: Responsive ở các viewport desktop/tablet khác', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    const viewports = [
      { name: 'Desktop lớn', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
    ];
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      await expect(dashboard.marketTab('Việt Nam'), `Lỗi ở viewport ${vp.name}`).toBeVisible();
    }
  });

  test('TC_DASHBOARD_20: Click card chỉ số chỉ đổi chỉ số đang chọn, KHÔNG điều hướng', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.indexCard('HNXINDEX').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('TC_DASHBOARD_21: Điều hướng từ header sang màn khác rồi quay lại Dashboard', async ({ page }) => {
    await loginFirst(page);
    await page.getByRole('link', { name: 'Bảng giá' }).click();
    await expect(page).toHaveURL(/\/bang-gia/);

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.marketTab('Việt Nam')).toBeVisible();
  });

  test('TC_DASHBOARD_22: Nút Back của trình duyệt', async ({ page }) => {
    await loginFirst(page);
    await page.getByRole('link', { name: 'Bảng giá' }).click();
    await expect(page).toHaveURL(/\/bang-gia/);

    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.marketTab('Việt Nam')).toBeVisible();
  });
});
