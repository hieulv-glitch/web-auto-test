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

test.describe('Dashboard/Panel phải — Cảnh báo', () => {
  test('TC_DASHBOARD_PP_09: Hiển thị header Cảnh báo mặc định', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cảnh báo').click();
    await page.waitForTimeout(600);

    await expect(dashboard.panelSubTab('Cổ phiếu', dashboard.alertPanel)).toHaveClass(/active/);
    await expect(dashboard.panelSubTab('Bộ lọc', dashboard.alertPanel)).toBeVisible();
    await expect(dashboard.alertPanel.locator('.v3-alert-input')).toBeVisible();
    await expect(dashboard.alertPanel.getByText('Lịch sử', { exact: true })).toBeVisible();
    await expect(dashboard.alertPanel.locator('.v3-alert-table-header')).toContainText('Mã CK');
    await expect(dashboard.alertPanel.locator('.v3-alert-table-header')).toContainText('Sửa/Xóa');
  });

  test('TC_DASHBOARD_PP_10: Chuyển sub-tab "Bộ lọc"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cảnh báo').click();
    await page.waitForTimeout(600);

    await dashboard.panelSubTab('Bộ lọc', dashboard.alertPanel).click();
    await page.waitForTimeout(500);
    await expect(dashboard.panelSubTab('Bộ lọc', dashboard.alertPanel)).toHaveClass(/active/);
    // Ghi nhận: thanh tìm kiếm/Lịch sử vẫn hiển thị ở tab "Bộ lọc" (chỉ nút Tạo mới/xóa hàng loạt mới ẩn theo
    // code `v-if="activeTab === 0"`) — khác giả định ban đầu, đã sửa lại theo hành vi thực tế.
    await expect(dashboard.alertPanel.locator('.v3-alert-input')).toBeVisible();
    await expect(page.getByText('Tạo mới', { exact: true })).toHaveCount(0);
  });

  test('TC_DASHBOARD_PP_11: Tìm kiếm lọc danh sách cảnh báo', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cảnh báo').click();
    await page.waitForTimeout(600);

    const firstStock = page.locator('.v3-alert-stock').first();
    const count = await firstStock.count();
    test.skip(count === 0, 'Tài khoản test hiện không có cảnh báo cổ phiếu nào để verify tìm kiếm.');

    const keyword = (await firstStock.textContent())?.trim() ?? '';
    await dashboard.alertPanel.locator('.v3-alert-input').fill(keyword);
    await page.waitForTimeout(500);
    const rows = page.locator('.v3-alert-row');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i).locator('.v3-alert-stock')).toContainText(keyword);
    }
  });

  test('TC_DASHBOARD_PP_12: Chọn nhiều dòng hiện icon xóa hàng loạt', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cảnh báo').click();
    await page.waitForTimeout(600);

    const checkboxes = page.locator('.v3-alert-row input[type="checkbox"]');
    const count = await checkboxes.count();
    test.skip(count === 0, 'Tài khoản test hiện không có cảnh báo cổ phiếu nào để verify chọn nhiều dòng.');

    await checkboxes.first().check();
    await page.waitForTimeout(300);
    await expect(page.locator('.v3-alert-badge')).toHaveText('1');
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

test.describe('Dashboard/Panel phải — Cộng đồng', () => {
  test('TC_DASHBOARD_PP_16: Hiển thị 3 tab, KHÔNG có tab "AI Cập Nhật"', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cộng đồng').click();
    await page.waitForTimeout(800);

    await expect(dashboard.panelSubTab('Mới nhất')).toHaveClass(/active/);
    await expect(dashboard.panelSubTab('Quan tâm')).toBeVisible();
    await expect(dashboard.panelSubTab('Phổ biến')).toBeVisible();
    await expect(dashboard.panelSubTab('AI Cập Nhật')).toHaveCount(0);
  });

  test('TC_DASHBOARD_PP_17: KHÔNG hiển thị thanh soạn bài (compose box)', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cộng đồng').click();
    await page.waitForTimeout(800);

    await expect(page.getByPlaceholder('Bạn có nhận định gì muốn chia sẻ?')).toHaveCount(0);
  });

  test('TC_DASHBOARD_PP_18: Bài viết hiển thị đủ nút tương tác', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cộng đồng').click();
    await page.waitForTimeout(800);

    const firstPost = dashboard.socialPanel.locator('.list-item-wrapper > *').first();
    await expect(firstPost).toBeVisible();
    await expect(dashboard.socialPanel.getByText('Bình luận').first()).toBeVisible();
    await expect(dashboard.socialPanel.getByText('Chia sẻ').first()).toBeVisible();
  });

  test('TC_DASHBOARD_PP_19: Chuyển tab Quan tâm/Phổ biến trong panel', async ({ page }) => {
    await loginFirst(page);
    const dashboard = new DashboardPage(page);
    await dashboard.rightTab('Cộng đồng').click();
    await page.waitForTimeout(800);

    await dashboard.panelSubTab('Quan tâm').click();
    await page.waitForTimeout(600);
    await expect(dashboard.panelSubTab('Quan tâm')).toHaveClass(/active/);

    await dashboard.panelSubTab('Phổ biến').click();
    await page.waitForTimeout(600);
    await expect(dashboard.panelSubTab('Phổ biến')).toHaveClass(/active/);
  });
});
