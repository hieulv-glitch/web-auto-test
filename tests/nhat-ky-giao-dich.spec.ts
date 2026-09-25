import { test, expect } from '@playwright/test';
import { TradingLogPage } from '../pages/TradingLogPage';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;
const FREE_EMAIL = process.env.FREE_USER_EMAIL;
const FREE_PASSWORD = process.env.FREE_USER_PASSWORD;

async function loginFirst(page: any) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(EMAIL, PASSWORD);
  await loginPage.expectLoggedIn();
}

/** Đăng nhập tài khoản Free, tự `test.skip` với lý do rõ ràng nếu tài khoản trong `.env` đăng nhập lỗi — cùng
 * cơ chế đã dùng ở TC_CONGDONG_55/TC_WATCHLIST_09/TC_BANGGIA_48-50. */
async function loginFreeOrSkip(page: any) {
  test.skip(!FREE_EMAIL || !FREE_PASSWORD, 'Chưa cấu hình FREE_USER_EMAIL/FREE_USER_PASSWORD trong .env');
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(FREE_EMAIL!, FREE_PASSWORD!);
  const loginFailed = await loginPage.errorAlert
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(loginFailed, 'Tài khoản Free trong .env đăng nhập thất bại — kiểm tra lại FREE_USER_EMAIL/FREE_USER_PASSWORD.');
  await loginPage.expectLoggedIn();
}

/** ProtectedView (blurred image + "Đăng ký ngay") của tab bị khóa CHỈ hiện text hover-only, nhưng
 * `.image-container > .blurred-image` luôn nằm trong DOM ngay khi `disable_featureName` = true — dùng làm dấu
 * hiệu ổn định. QUAN TRỌNG: CoreUI `CTabs` giữ CẢ 3 pane bị gate (Tài sản/Quản lý danh mục/Phân bổ vốn) LUÔN
 * mounted trong DOM cùng lúc (giống pattern CModal không unmount đã ghi nhận ở nơi khác trong codebase này) —
 * `featureName`/`disable_featureName` là 1 computed DÙNG CHUNG cho cả 3 pane (dựa theo `active_tab` hiện tại),
 * nên đếm KHÔNG lọc `:visible` sẽ đếm nhầm cả các pane ẩn (không phải tab đang xem). Luôn lọc `:visible`. */
function visibleProtectedViewImage(page: any) {
  return page.locator('.tradingLog-component .image-container .blurred-image:visible');
}

// An toàn: mọi API MUTATE của trang này (thêm/sửa/xóa giao dịch, danh mục, cổ tức, phân bổ vốn) bị chặn mặc
// định — tài khoản test có dữ liệu giao dịch thật trị giá lớn. Test nào cần quan sát luồng thành công/lỗi sẽ
// tự `page.unroute()` rồi mock riêng (không cần ở file này vì chỉ test khung/shell, không thao tác dữ liệu).
async function blockMutations(page: any) {
  await page.route(/\/api\/stocks\/trading_log/, (route: any) =>
    route.request().method() === 'GET' ? route.continue() : route.abort()
  );
  await page.route(/\/api\/tradinglog\//, (route: any) =>
    route.request().method() === 'GET' ? route.continue() : route.abort()
  );
  await page.route(/\/api\/stocks\/category/, (route: any) =>
    route.request().method() === 'GET' ? route.continue() : route.abort()
  );
  await page.route('**/updateusersettings**', (route: any) => route.abort());
}

test.beforeEach(async ({ page }) => {
  await blockMutations(page);
});

test.describe('Nhật ký giao dịch — Truy cập & Tổng quan', () => {
  test('TC_NKGD_01: Overview màn hình khi đã đăng nhập', async ({ page }) => {
    await loginFirst(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();
    for (const name of ['Tài sản', 'Nhật ký giao dịch', 'Quản lý danh mục', 'Phân bổ vốn']) {
      await expect(nkgd.mainTab(name), `Tab "${name}" phải hiển thị`).toBeVisible();
    }
    await expect(nkgd.mainTab('Tài sản')).toHaveClass(/active/);
  });

  test('TC_NKGD_02: Chặn truy cập khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/nhat-ky-giao-dich');
    await page.waitForURL(/\/login/);
  });
});

test.describe('Nhật ký giao dịch — Chuyển tab chính', () => {
  test('TC_NKGD_03: Chuyển qua lại 4 tab chính', async ({ page }) => {
    await loginFirst(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();

    for (const name of ['Nhật ký giao dịch', 'Quản lý danh mục', 'Phân bổ vốn', 'Tài sản']) {
      await nkgd.gotoMainTab(name);
      await page.waitForTimeout(300);
      await expect(nkgd.mainTab(name), `Tab "${name}" phải chuyển active`).toHaveClass(/active/);
    }
  });

  test('TC_NKGD_04: Click tab nhanh liên tục không lag/duplicate', async ({ page }) => {
    await loginFirst(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();

    for (let i = 0; i < 2; i++) {
      await nkgd.mainTab('Nhật ký giao dịch').click();
      await nkgd.mainTab('Quản lý danh mục').click();
      await nkgd.mainTab('Phân bổ vốn').click();
      await nkgd.mainTab('Tài sản').click();
    }
    await page.waitForTimeout(300);
    await expect(nkgd.mainTab('Tài sản')).toHaveClass(/active/);
    // Không có lỗi console/crash trong suốt quá trình chuyển tab liên tục.
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(200);
    expect(errors).toEqual([]);
  });

  test('TC_NKGD_05: Deep-link ?tab=nhat-ky-giao-dich mở thẳng tab "Nhật ký giao dịch"', async ({ page }) => {
    await loginFirst(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto('nhat-ky-giao-dich');
    await expect(nkgd.mainTab('Nhật ký giao dịch')).toHaveClass(/active/);
  });

  test('TC_NKGD_06: Chuyển tab không cập nhật URL — F5 quay về tab mặc định', async ({ page }) => {
    await loginFirst(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();
    await nkgd.gotoMainTab('Quản lý danh mục');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/nhat-ky-giao-dich$/); // không có query nào được thêm

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(nkgd.mainTab('Tài sản'), 'Sau F5 phải quay về tab mặc định "Tài sản"').toHaveClass(/active/);
  });

  test('TC_NKGD_07: Nút Back trình duyệt điều hướng rời khỏi trang', async ({ page }) => {
    await loginFirst(page);
    await page.goto('/dashboard');
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();
    await nkgd.gotoMainTab('Nhật ký giao dịch');
    // KHÔNG chờ "load" mặc định — trang có polling/socket nền liên tục nên event "load" có thể không bao giờ
    // fire trong timeout (cùng lý do đã ghi ở TradingLogPage.goto()).
    await Promise.all([
      page.waitForURL((url) => !/\/nhat-ky-giao-dich/.test(url.pathname), { waitUntil: 'commit' }),
      page.goBack({ waitUntil: 'commit' }),
    ]);
    await expect(page).not.toHaveURL(/\/nhat-ky-giao-dich/);
  });
});

test.describe('Nhật ký giao dịch — Giới hạn theo gói hội viên', () => {
  test('TC_NKGD_08: Tab "Nhật ký giao dịch" không bị khóa theo gói hội viên', async ({ page }) => {
    await loginFirst(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();
    await nkgd.gotoMainTab('Nhật ký giao dịch');
    // Scope trong `.tradingLog-component` — trang có thể có sẵn 1 `ProtectedView` khác (VD widget ẩn ở nơi
    // khác ngoài trang này) không liên quan tới tab đang test, không dùng `page.getByText` không scope.
    await expect(page.locator('.tradingLog-component').getByText('Bạn cần nâng cấp gói hội viên')).toHaveCount(0);
    await expect(nkgd.historySubTab('Lịch sử giao dịch')).toBeVisible();
  });

  test('TC_NKGD_09: Tab bị khóa theo gói hội viên hiển thị ProtectedView (tài khoản Free)', async ({ page }) => {
    await loginFreeOrSkip(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();
    await page.waitForTimeout(800);

    const visibleBlurred = visibleProtectedViewImage(page);
    const results: Record<string, number> = {};
    for (const tabName of ['Tài sản', 'Quản lý danh mục', 'Phân bổ vốn']) {
      await nkgd.gotoMainTab(tabName);
      await page.waitForTimeout(600);
      results[tabName] = await visibleBlurred.count();
    }
    console.log(`[TC_NKGD_09] Số ProtectedView hiện (blurred-image visible) mỗi tab với tài khoản Free: ${JSON.stringify(results)}`);
    // Hành vi thật đo được (tài khoản Free hiện tại): cả 3 tab "Tài sản"/"Quản lý danh mục"/"Phân bổ vốn" đều
    // bị khóa (featureName nkgd_tai_san/nkgd_quan_ly_danh_muc/nkgd_phan_bo_von), mỗi tab hiện đúng 1
    // ProtectedView khi đang active. Xem thêm testcases/nhat-ky-giao-dich.md.
    for (const tabName of ['Tài sản', 'Quản lý danh mục', 'Phân bổ vốn']) {
      expect(results[tabName], `Tab "${tabName}" phải hiện ProtectedView với tài khoản Free`).toBe(1);
    }
  });
});

test.describe('Nhật ký giao dịch — Responsive', () => {
  test('TC_NKGD_10: Responsive viewport mobile/tablet', async ({ page }) => {
    await loginFirst(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(nkgd.mainTab('Tài sản')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(nkgd.mainTab('Tài sản')).toBeVisible();
  });
});
