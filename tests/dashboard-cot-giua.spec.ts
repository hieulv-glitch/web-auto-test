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

test.describe('Dashboard/Cột giữa — Bản đồ nhiệt: Bộ lọc', () => {
  test('TC_DASHBOARD_CG_01: Hiển thị 3 dropdown lọc mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.heatMapDropdown('Khối lượng GD')).toBeVisible();
    await expect(dashboard.heatMapDropdown('Tất cả')).toBeVisible();
    await expect(dashboard.heatMapDropdown('Cổ phiếu')).toBeVisible();
    await expect(dashboard.heatMapFilterIcon).toBeVisible();
    await expect(dashboard.heatMapResetFilterIcon).toBeVisible();
    await expect(dashboard.enlargeHeatMapButton).toBeVisible();
  });

  test('TC_DASHBOARD_CG_02: Đổi "Giá trị" sang GDNN tự khoá "Phân loại" về Ngành', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapDropdown('Khối lượng GD').click();
    await dashboard.heatMapDropdownOption('GDNN').click();
    await page.waitForTimeout(3000); // đợi treemap ổn định (đã ghi nhận độ trễ render ~1-2s khi đổi bố cục)

    await expect(dashboard.heatMapDropdown('GDNN')).toBeVisible();
    await expect(dashboard.heatMapDropdown('Ngành')).toBeVisible();
    await expect(page.getByText('Dữ liệu được tính tại ngày')).toBeVisible();
  });

  test('TC_DASHBOARD_CG_03: Đổi "Giá trị" về Giá trị GD/Vốn hóa quay lại treemap thường', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapDropdown('Khối lượng GD').click();
    await dashboard.heatMapDropdownOption('GDNN').click();
    await page.waitForTimeout(1000);

    await dashboard.heatMapDropdown('GDNN').click();
    await dashboard.heatMapDropdownOption('Vốn hóa').click();
    await page.waitForTimeout(1000);

    await expect(dashboard.heatMapDropdown('Vốn hóa')).toBeVisible();
    await expect(page.getByText(/^MUA/)).toHaveCount(0);
  });

  test('TC_DASHBOARD_CG_04: Đổi dropdown "Sàn"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapDropdown('Tất cả').click();
    await dashboard.heatMapDropdownOption('HSX').click();
    await page.waitForTimeout(500);
    await expect(dashboard.heatMapDropdown('HSX')).toBeVisible();
  });

  test('TC_DASHBOARD_CG_05: Đổi dropdown "Phân loại" (Cổ phiếu <-> Ngành)', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapDropdown('Cổ phiếu').click();
    await dashboard.heatMapDropdownOption('Ngành').click();
    await page.waitForTimeout(2000); // đợi ổn định render (đã ghi nhận độ trễ ngắn)
    await expect(dashboard.heatMapDropdown('Ngành')).toBeVisible();
    await expect(page.getByText('NGÂN HÀNG', { exact: true }).first()).toBeVisible();

    await dashboard.heatMapDropdown('Ngành').click();
    await dashboard.heatMapDropdownOption('Cổ phiếu').click();
    await page.waitForTimeout(1000);
    await expect(dashboard.heatMapDropdown('Cổ phiếu')).toBeVisible();
  });

  test('TC_DASHBOARD_CG_06: Mở modal "Bộ lọc bản đồ nhiệt"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapFilterIcon.click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Bộ lọc bản đồ nhiệt')).toBeVisible();
    await expect(dashboard.heatMapFilterModal.getByText('Sàn')).toBeVisible();
    await expect(dashboard.heatMapFilterModal.getByText('Ngành')).toBeVisible();
    await expect(dashboard.heatMapFilterModal.getByText('Watchlist')).toBeVisible();
    await expect(dashboard.heatMapFilterModal.getByText('Thời gian')).toBeVisible();
  });

  test('TC_DASHBOARD_CG_07: Đóng modal bộ lọc', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapFilterIcon.click();
    await page.waitForTimeout(300);
    await dashboard.heatMapFilterModalCloseButton.click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Bộ lọc bản đồ nhiệt')).toBeHidden();
  });

  test('TC_DASHBOARD_CG_08: Đặt lại bộ lọc (icon reset)', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapDropdown('Khối lượng GD').click();
    await dashboard.heatMapDropdownOption('GDNN').click();
    await page.waitForTimeout(1000);
    await expect(dashboard.heatMapDropdown('Ngành')).toBeVisible();

    await dashboard.heatMapResetFilterIcon.click();
    await page.waitForTimeout(500);

    await expect(dashboard.heatMapDropdown('Khối lượng GD')).toBeVisible();
    await expect(dashboard.heatMapDropdown('Cổ phiếu')).toBeVisible();
    await expect(dashboard.heatMapDropdown('Tất cả')).toBeVisible();
  });

  test('TC_DASHBOARD_CG_09: Bộ lọc KHÔNG được lưu lại sau khi tải lại trang', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.heatMapDropdown('Cổ phiếu').click();
    await dashboard.heatMapDropdownOption('Ngành').click();
    await page.waitForTimeout(1500);
    await expect(dashboard.heatMapDropdown('Ngành')).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await expect(dashboard.heatMapDropdown('Cổ phiếu')).toBeVisible();
  });
});

test.describe('Dashboard/Cột giữa — Bản đồ nhiệt: Hiển thị dữ liệu', () => {
  test('TC_DASHBOARD_CG_10: Hiển thị treemap mặc định theo ngành/mã', async ({ page }) => {
    await loginFirst(page);
    await expect(page.getByText('NGÂN HÀNG', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('CHỨNG KHOÁN', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('BẤT ĐỘNG SẢN', { exact: true }).first()).toBeVisible();
  });
});

test.describe('Dashboard/Cột giữa — Chỉ số tâm lý & rủi ro', () => {
  test('TC_DASHBOARD_CG_11: Hiển thị Chỉ số tâm lý', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.psychoIndexBox.getByText('Hôm qua:')).toBeVisible();
    await expect(dashboard.psychoIndexBox.getByText('Tuần trước:')).toBeVisible();
  });

  test('TC_DASHBOARD_CG_12: Hiển thị Chỉ số rủi ro', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.riskIndexBox.getByText('Hôm qua:')).toBeVisible();
    await expect(dashboard.riskIndexBox.getByText('Tuần trước:')).toBeVisible();
  });

  test('TC_DASHBOARD_CG_13: Chỉ số tâm lý/rủi ro không có tương tác click', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.psychoIndexBox.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboard.psychoIndexBox).toBeVisible();
  });
});
