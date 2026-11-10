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

test.describe('Dashboard/Panel phải — IBD', () => {
  test('TC_DASHBOARD_PP_01: Hiển thị 3 sub-tab của IBD', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await expect(dashboard.panelSubTab('Nhịp đập TT')).toBeVisible();
    await expect(dashboard.panelSubTab('Nỗ lực kết quả')).toBeVisible();
    await expect(dashboard.panelSubTab('Sức khỏe TT')).toBeVisible();
    await expect(page.getByText('Tổng quan thị trường')).toBeVisible();
  });

  test('TC_DASHBOARD_PP_02: Chuyển sub-tab IBD', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);

    await dashboard.panelSubTab('Nỗ lực kết quả').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Nỗ lực kết quả')).toHaveClass(/active/);

    await dashboard.panelSubTab('Sức khỏe TT').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Sức khỏe TT')).toHaveClass(/active/);

    await dashboard.panelSubTab('Nhịp đập TT').click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Nhịp đập TT')).toHaveClass(/active/);
    await expect(page.getByText('Tổng quan thị trường')).toBeVisible();
  });
});

test.describe('Dashboard/Panel phải — Watchlist', () => {
  test('TC_DASHBOARD_PP_03: Hiển thị header Watchlist mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Watchlist').click();
    await page.waitForTimeout(600);

    await expect(dashboard.watchlistCategoryDropdown).toBeVisible();
    await expect(dashboard.watchlistCreateButton).toBeVisible();
    await expect(dashboard.panelSubTab('Danh sách')).toHaveClass(/active/);
    await expect(dashboard.panelSubTab('Bài viết liên quan')).toBeVisible();
    await expect(page.getByText(/^Tổng/)).toBeVisible();
  });

  test('TC_DASHBOARD_PP_04: Mở dropdown chọn watchlist', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Watchlist').click();
    await page.waitForTimeout(600);

    await dashboard.watchlistCategoryDropdown.click();
    await page.waitForTimeout(400);

    await expect(page.locator('.v3-dropdown-content').getByText('Watchlist', { exact: true }).first()).toBeVisible();
    await expect(page.locator('.v3-dropdown-content').getByText('Nhật ký GD', { exact: true })).toBeVisible();
    await expect(page.locator('.v3-dropdown-content').getByText('Khác', { exact: true })).toBeVisible();
    await expect(page.locator('.v3-dropdown-watchlist-close-text')).toBeVisible();
  });

  test('TC_DASHBOARD_PP_05: Chọn 1 watchlist khác trong dropdown', async ({ page }) => {
    // Lưu ý: `current_category_id` được lưu server-side (store.commit('saveSetting', ...)) nên phải chủ động
    // chuyển VỀ đúng lựa chọn ban đầu sau khi test xong, tránh làm đổi vĩnh viễn watchlist mặc định của tài
    // khoản test.
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Watchlist').click();
    await page.waitForTimeout(600);
    const originalLabel = (await dashboard.watchlistCategoryDropdown.locator('span').first().textContent())?.trim();

    await dashboard.watchlistCategoryDropdown.click();
    await page.waitForTimeout(400);
    const options = page.locator('.v3-option-wrapper .v3-option-item');
    const optionCount = await options.count();
    test.skip(optionCount < 2, 'Tài khoản test cần ít nhất 2 watchlist để verify việc chuyển đổi.');

    // Chọn option ĐẦU TIÊN không trùng với lựa chọn đang active (đang active có class selected-v3-row-item-option
    // gắn thẳng lên chính phần tử, không phải phần tử con, nên phải lọc bằng CSS :not() thay vì hasNot)
    const notSelected = page.locator('.v3-option-wrapper .v3-option-item:not(.selected-v3-row-item-option)').first();
    const targetLabel = (await notSelected.textContent())?.trim();
    await notSelected.click();
    await page.waitForTimeout(600);
    const newLabel = (await dashboard.watchlistCategoryDropdown.locator('span').first().textContent())?.trim();
    expect(newLabel).toBe(targetLabel);
    expect(newLabel).not.toBe(originalLabel);

    // Khôi phục lại watchlist ban đầu
    await dashboard.watchlistCategoryDropdown.click();
    await page.waitForTimeout(400);
    await page.locator('.v3-option-wrapper .v3-option-item', { hasText: originalLabel! }).first().click();
    await page.waitForTimeout(600);
    const restoredLabel = (await dashboard.watchlistCategoryDropdown.locator('span').first().textContent())?.trim();
    expect(restoredLabel, 'Phải khôi phục đúng watchlist ban đầu để không làm sai lệch trạng thái tài khoản test').toBe(originalLabel);
  });

  test('TC_DASHBOARD_PP_06: Chuyển sub-tab "Bài viết liên quan"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Watchlist').click();
    await page.waitForTimeout(600);

    await dashboard.panelSubTab('Bài viết liên quan').click();
    await page.waitForTimeout(800);
    await expect(dashboard.panelSubTab('Bài viết liên quan')).toHaveClass(/active/);
  });

  test('TC_DASHBOARD_PP_07: Mở modal "Thêm mới Watchlist", Escape không đóng được, đóng bằng icon "x"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Watchlist').click();
    await page.waitForTimeout(600);

    await dashboard.watchlistCreateButton.click();
    await page.waitForTimeout(500);
    const visibleModal = page.locator('.modal.show, .modal.d-block').first();
    const modalTitle = visibleModal.getByText('Thêm mới Watchlist', { exact: true });
    await expect(modalTitle).toBeVisible();
    await expect(visibleModal.getByPlaceholder('Nhập tên Watchlist')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await expect(modalTitle, 'Escape không đóng được modal CModal ở đây (đã ghi nhận trong doc)').toBeVisible();

    await visibleModal.getByText('×', { exact: true }).click();
    await page.waitForTimeout(400);
    await expect(modalTitle).toBeHidden();
  });

  test('TC_DASHBOARD_PP_08: Mở dropdown sắp xếp danh sách watchlist', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Watchlist').click();
    await page.waitForTimeout(600);

    await dashboard.watchlistSortIcon.click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Sắp xếp theo mã A-Z')).toBeVisible();
    await expect(page.getByText('Tùy chọn', { exact: true })).toBeVisible();
  });
});

test.describe('Dashboard/Panel phải — Ghi chú', () => {
  test('TC_DASHBOARD_PP_13: Hiển thị header Ghi chú mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Ghi chú').click();
    await page.waitForTimeout(600);

    await expect(dashboard.noteFilterTab('Tất cả')).toHaveClass(/active/);
    await expect(dashboard.noteFilterTab('Cá nhân')).toBeVisible();
    await expect(dashboard.noteFilterTab('Giao dịch')).toBeVisible();
    await expect(page.getByText('Thêm ghi chú mới')).toBeVisible();
  });

  test('TC_DASHBOARD_PP_14: Chuyển tab lọc Ghi chú', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Ghi chú').click();
    await page.waitForTimeout(600);

    await dashboard.noteFilterTab('Cá nhân').click();
    await page.waitForTimeout(500);
    await expect(dashboard.noteFilterTab('Cá nhân')).toHaveClass(/active/);

    await dashboard.noteFilterTab('Giao dịch').click();
    await page.waitForTimeout(500);
    await expect(dashboard.noteFilterTab('Giao dịch')).toHaveClass(/active/);
  });

  test('TC_DASHBOARD_PP_15: Mở modal "Thêm ghi chú mới"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Ghi chú').click();
    await page.waitForTimeout(600);

    await page.getByText('Thêm ghi chú mới').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.modal.show, .modal.d-block').first()).toBeVisible();
  });
});

test.describe('Dashboard/Panel phải — Tài khoản Free', () => {
  test('TC_DASHBOARD_PP_20: Free — panel Watchlist không có nút "Thêm mới" watchlist; panel Ghi chú vẫn mở được', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open('free');
    await dashboard.rightTab('Watchlist').click();
    await expect(dashboard.watchlistPanelHeader).toBeVisible();
    await expect(dashboard.watchlistCategoryDropdown).toBeVisible();
    await expect(dashboard.watchlistCreateButton).toHaveCount(0);

    await dashboard.rightTab('Ghi chú').click();
    await expect(dashboard.rightTab('Ghi chú')).toHaveClass(/active/);
  });
});
