import { test, expect } from '@playwright/test';
import { TradingLogPage } from '../pages/TradingLogPage';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;

async function loginFirst(page: any) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(EMAIL, PASSWORD);
  await loginPage.expectLoggedIn();
}

const CATEGORY_MUTATE = /\/api\/stocks\/category(\/|\?|$)/;
const CATEGORY_RESTORE = /\/api\/stocks\/category\/restore(\?|$)/;

// An toàn: tài khoản test có 11 danh mục thật đang dùng cho hàng trăm giao dịch. Mọi API mutate của
// ManageCategory.vue bị chặn mặc định.
async function blockMutations(page: any) {
  await page.route(CATEGORY_MUTATE, (route: any) =>
    route.request().method() === 'GET' ? route.continue() : route.abort()
  );
}

async function gotoCategoryTab(page: any) {
  await loginFirst(page);
  const nkgd = new TradingLogPage(page);
  await nkgd.goto();
  await nkgd.gotoMainTab('Quản lý danh mục');
  return nkgd;
}

test.beforeEach(async ({ page }) => {
  await blockMutations(page);
});

test.describe('Quản lý danh mục — Overview & sub-tab', () => {
  test('TC_NKGD_DM_01: Overview — sub-tab "Danh mục hiện có" active mặc định', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await expect(nkgd.categorySubTab('Danh mục hiện có')).toHaveClass(/active/);
    await expect(nkgd.addCategoryButton).toBeVisible();
    await expect(nkgd.categoryTable).toBeVisible();
  });

  test('TC_NKGD_DM_02: Chuyển sang sub-tab "Danh mục đã xóa"', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.categorySubTab('Danh mục đã xóa').click();
    await page.waitForTimeout(300);
    await expect(nkgd.categorySubTab('Danh mục đã xóa')).toHaveClass(/active/);
    await expect(nkgd.addCategoryButton).toHaveCount(0);
  });
});

test.describe('Quản lý danh mục — Bảng "Danh mục hiện có"', () => {
  test('TC_NKGD_DM_03: Hiển thị đúng danh sách danh mục + Vốn ban đầu', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await expect(nkgd.categoryTable.getByRole('columnheader', { name: /Tên danh mục/ })).toBeVisible();
    await expect(nkgd.categoryTable.getByRole('columnheader', { name: 'Vốn ban đầu' })).toBeVisible();
    await expect(nkgd.categoryTable.getByRole('row').nth(1)).toBeVisible();
  });

  test('TC_NKGD_DM_04: Lỗi tải danh sách danh mục — im lặng, không thông báo', async ({ page }) => {
    await page.route(/\/api\/tradinglog\/category\/get-all/, (route: any) => route.fulfill({ status: 500, body: 'error' }));
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    const nkgd = await gotoCategoryTab(page);
    await page.waitForTimeout(500);
    await expect(nkgd.categoryTable).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Quản lý danh mục — Thêm danh mục mới', () => {
  test('TC_NKGD_DM_05: Mở modal "Thêm mới danh mục"', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.addCategoryButton.click();
    await expect(nkgd.categoryAddModal).toBeVisible();
    await expect(nkgd.categoryNameInput).toHaveValue('');
  });

  test('TC_NKGD_DM_06: Validate tên danh mục rỗng', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.addCategoryButton.click();
    await expect(nkgd.categoryAddModal).toBeVisible();
    let storeCalled = false;
    await page.route(/\/api\/stocks\/category\/store/, (route: any) => {
      storeCalled = true;
      return route.abort();
    });
    await nkgd.categorySaveButton.click();
    await expect(page.getByText('Tên danh mục không được để trống')).toBeVisible();
    expect(storeCalled).toBe(false);
  });

  test('TC_NKGD_DM_07: Tên danh mục chỉ chứa khoảng trắng — được chấp nhận (bug tiềm ẩn)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.addCategoryButton.click();
    await expect(nkgd.categoryAddModal).toBeVisible();

    let storeCalled = false;
    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'POST') {
        storeCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 999999, name: '   ' }) });
      }
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categoryNameInput.fill('   ');
    await nkgd.categorySaveButton.click();
    await page.waitForTimeout(500);
    // Hành vi thật đo được: KHÔNG có toast "không được để trống" — request được gửi (bug thiếu .trim()).
    console.log(`[TC_NKGD_DM_07] Request POST /category/store được gửi với tên toàn khoảng trắng: ${storeCalled}`);
  });

  test('TC_NKGD_DM_08: Thêm danh mục thành công (mock)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.addCategoryButton.click();
    await expect(nkgd.categoryAddModal).toBeVisible();

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 999999, name: '[TEST-AUTOMATION]' }) });
      }
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categoryNameInput.fill('[TEST-AUTOMATION]');
    await nkgd.categorySaveButton.click();
    await expect(page.getByText('Đã thêm mới danh mục')).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_DM_09: Thêm danh mục trùng tên (mock lỗi 422)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.addCategoryButton.click();
    await expect(nkgd.categoryAddModal).toBeVisible();

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'POST') return route.fulfill({ status: 422, body: 'Unprocessable Entity' });
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categoryNameInput.fill('Lướt Sóng');
    await nkgd.categorySaveButton.click();
    await expect(page.getByText(/đã tồn tại/)).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_DM_10: Thêm danh mục khi mất mạng — bug crash tiềm ẩn', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.addCategoryButton.click();
    await expect(nkgd.categoryAddModal).toBeVisible();

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) =>
      route.request().method() === 'GET' ? route.continue() : route.abort()
    );

    await nkgd.categoryNameInput.fill('[TEST-AUTOMATION-OFFLINE]');
    await nkgd.categorySaveButton.click();
    await page.waitForTimeout(1000);
    console.log(`[TC_NKGD_DM_10] pageerror ghi nhận khi thêm danh mục lúc mất mạng: ${JSON.stringify(errors)}`);
  });
});

test.describe('Quản lý danh mục — Sửa danh mục', () => {
  async function openEditFirstCategory(page: any, nkgd: TradingLogPage) {
    // Đợi bảng thật sự tải xong dữ liệu trước khi đọc tên — nếu đọc quá sớm có thể bắt phải dòng placeholder
    // "Chưa có danh mục nào" (bảng hiện dòng này trong lúc chờ API get-all trả về), dù click (Playwright tự
    // đợi actionability) vẫn luôn nhắm đúng dòng thật sau khi tải xong.
    const firstRow = nkgd.categoryTable.getByRole('row').nth(1);
    await expect(firstRow.getByRole('cell').first()).not.toHaveText('Chưa có danh mục nào', { timeout: 10000 });
    const name = (await firstRow.getByRole('cell').first().textContent())?.trim() || '';
    await firstRow.locator('img, svg, button').first().click();
    return name;
  }

  test('TC_NKGD_DM_11: Mở modal "Sửa danh mục" — prefill đúng dữ liệu', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    const name = await openEditFirstCategory(page, nkgd);
    await expect(nkgd.categoryNameInput).toHaveValue(name);
  });

  test('TC_NKGD_DM_12: Chỉ sửa "Vốn ban đầu" — KHÔNG gọi API update', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await openEditFirstCategory(page, nkgd);

    let putCalled = false;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && /\/api\/stocks\/category\/update/.test(req.url())) putCalled = true;
    });

    const capitalInput = nkgd.categoryInitialCapitalInput;
    await capitalInput.fill('54321');
    await nkgd.categorySaveButton.click();
    await expect(page.getByText(/Đã cập nhật/)).toBeVisible({ timeout: 10000 });
    expect(putCalled, 'Chỉ sửa Vốn ban đầu KHÔNG được gọi API PUT /category/update').toBe(false);
  });

  test('TC_NKGD_DM_13: Đổi tên danh mục — có gọi API (mock thành công)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await openEditFirstCategory(page, nkgd);

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'PUT') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categoryNameInput.fill('[TEST-AUTOMATION] Đổi tên');
    await nkgd.categorySaveButton.click();
    await expect(page.getByText(/Đã cập nhật/)).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_DM_14: Đổi tên trùng với danh mục khác (mock lỗi)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await openEditFirstCategory(page, nkgd);

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Already name' }) });
      }
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categoryNameInput.fill('v70Release');
    await nkgd.categorySaveButton.click();
    await expect(page.getByText(/đã tồn tại/)).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_DM_21: Nút "Hủy" đóng modal không lưu', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await openEditFirstCategory(page, nkgd);
    await nkgd.categoryCancelButton.click();
    await expect(nkgd.categoryNameInput).toHaveCount(0);
  });
});

test.describe('Quản lý danh mục — Xóa & Thùng rác', () => {
  test('TC_NKGD_DM_15: Icon Xóa mở modal xác nhận "Di chuyển vào thùng rác"', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    const firstRow = nkgd.categoryTable.getByRole('row').nth(1);
    await firstRow.locator('img, svg, button').last().click();
    await expect(nkgd.categorySoftDeleteModal).toBeVisible();
  });

  test('TC_NKGD_DM_16: Xác nhận xóa (soft-delete) thành công (mock)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    const firstRow = nkgd.categoryTable.getByRole('row').nth(1);
    await firstRow.locator('img, svg, button').last().click();
    await expect(nkgd.categorySoftDeleteModal).toBeVisible();

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categorySoftDeleteConfirmButton.click();
    await expect(page.getByText('Di chuyển vào thùng rác thành công')).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_DM_17: Khôi phục danh mục từ thùng rác — chạy ngay, không có modal xác nhận (mock)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.categorySubTab('Danh mục đã xóa').click();
    await page.waitForTimeout(300);
    const rows = nkgd.categoryTable.getByRole('row');
    const count = await rows.count();
    test.skip(count < 2, 'Không có danh mục nào trong thùng rác để test khôi phục');

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'POST' && /restore/.test(route.request().url())) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    const firstDeletedRow = rows.nth(1);
    await firstDeletedRow.locator('img, svg, button').first().click();
    await expect(page.getByText(/Khôi phục thành công/)).toBeVisible({ timeout: 10000 });
    await expect(nkgd.anyOpenModal).toHaveCount(0);
  });

  test('TC_NKGD_DM_18: Xóa vĩnh viễn — modal xác nhận riêng, chỉ 1 bước', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.categorySubTab('Danh mục đã xóa').click();
    await page.waitForTimeout(300);
    const rows = nkgd.categoryTable.getByRole('row');
    const count = await rows.count();
    test.skip(count < 2, 'Không có danh mục nào trong thùng rác để test xóa vĩnh viễn');

    await rows.nth(1).locator('img, svg, button').last().click();
    await expect(nkgd.categoryForceDeleteModal).toBeVisible();
    await expect(nkgd.categoryForceDeleteModal.getByRole('textbox')).toHaveCount(0);
  });

  test('TC_NKGD_DM_19: Xác nhận xóa vĩnh viễn thành công (mock)', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.categorySubTab('Danh mục đã xóa').click();
    await page.waitForTimeout(300);
    const rows = nkgd.categoryTable.getByRole('row');
    const count = await rows.count();
    test.skip(count < 2, 'Không có danh mục nào trong thùng rác để test xóa vĩnh viễn');

    await rows.nth(1).locator('img, svg, button').last().click();
    await expect(nkgd.categoryForceDeleteModal).toBeVisible();

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categoryForceDeleteConfirmButton.click();
    await expect(page.getByText(/Xóa thành công/)).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_DM_20: Xóa vĩnh viễn lỗi — modal KHÔNG tự đóng', async ({ page }) => {
    const nkgd = await gotoCategoryTab(page);
    await nkgd.categorySubTab('Danh mục đã xóa').click();
    await page.waitForTimeout(300);
    const rows = nkgd.categoryTable.getByRole('row');
    const count = await rows.count();
    test.skip(count < 2, 'Không có danh mục nào trong thùng rác để test xóa vĩnh viễn lỗi');

    await rows.nth(1).locator('img, svg, button').last().click();
    await expect(nkgd.categoryForceDeleteModal).toBeVisible();

    await page.unroute(CATEGORY_MUTATE);
    await page.route(CATEGORY_MUTATE, (route: any) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 500, body: 'error' });
      return route.request().method() === 'GET' ? route.continue() : route.abort();
    });

    await nkgd.categoryForceDeleteConfirmButton.click();
    await page.waitForTimeout(800);
    await expect(nkgd.categoryForceDeleteModal, 'Modal Xóa vĩnh viễn KHÔNG tự đóng khi lỗi').toBeVisible();
  });
});
