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

// An toàn: CapitalAllocation.vue không có API mutate chuyên biệt, nhưng auto-save ngầm lên
// "user settings" dùng chung toàn app — luôn chặn để không ghi đè cấu hình thật của tài khoản test.
async function blockMutations(page: any) {
  await page.route('**/updateusersettings**', (route: any) => route.abort());
}

async function gotoAllocationTab(page: any) {
  await loginFirst(page);
  const nkgd = new TradingLogPage(page);
  await nkgd.goto();
  await nkgd.gotoMainTab('Phân bổ vốn');
  await page.waitForTimeout(500);
  return nkgd;
}

test.beforeEach(async ({ page }) => {
  await blockMutations(page);
});

test.describe('Phân bổ vốn — Overview & tính toán', () => {
  test('TC_NKGD_PBV_01: Overview tab Phân bổ vốn', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    await expect(page.getByText('Phân bố vốn theo % cắt lỗ trên tài sản')).toBeVisible();
    await expect(page.getByText('Trạng thái danh mục hiện tại')).toBeVisible();
    await expect(page.getByText('Deal tiếp theo', { exact: true })).toBeVisible();
    await expect(page.getByText('Trạng thái danh mục khi có deal tiếp theo')).toBeVisible();
    await expect(nkgd.allocationCategorySelect).toBeVisible();
  });

  // Đo qua automation 2 lần chạy liên tiếp cho kết quả TRÁI NGƯỢC nhau (lần 1: is-invalid không bao giờ xuất
  // hiện; lần 2: is-invalid CÓ xuất hiện) dù các bước thao tác giống hệt nhau — hành vi không ổn định
  // (non-deterministic), nghi ngờ do input có 2 directive v-model.lazy + v-model trùng lặp trên cùng thẻ
  // (dòng 33+37 CapitalAllocation.vue) khiến thời điểm watcher tong_tai_san() gọi $touch() phụ thuộc race
  // condition. Không assert 1 chiều cụ thể vì sẽ tạo test flaky giả — đánh dấu fixme, xem chi tiết trong
  // testcases/nhat-ky-giao-dich-phan-bo-von.md.
  test.fixme(
    'TC_NKGD_PBV_02: Validate "Vốn ban đầu" — is-invalid xuất hiện KHÔNG ổn định giữa các lần chạy (nghi bug race condition)',
    async () => {}
  );

  test('TC_NKGD_PBV_03: "% Cắt lỗ tối đa trên tổng tài sản" không có giới hạn trên', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    await nkgd.allocationMaxCutlossPercentInput.fill('500');
    await nkgd.allocationMaxCutlossPercentInput.blur();
    await page.waitForTimeout(300);
    await expect(nkgd.allocationMaxCutlossPercentInput).not.toHaveClass(/is-invalid/);
  });

  // Đo qua automation 3 lần chạy: 2 lần đầu is-invalid không bao giờ xuất hiện dù field rỗng thật (không có
  // v-money nên loại trừ khả năng do làm tròn), lần 3 lại CÓ xuất hiện — cùng pattern không ổn định với
  // TC_NKGD_PBV_02 (nghi cùng nguyên nhân gốc: 2 v-model trùng lặp trên input, dòng 106+112
  // CapitalAllocation.vue). Không assert 1 chiều cụ thể — đánh dấu fixme, xem chi tiết trong
  // testcases/nhat-ky-giao-dich-phan-bo-von.md.
  test.fixme(
    'TC_NKGD_PBV_04: "% Cắt lỗ trên deal tiếp theo" — is-invalid xuất hiện KHÔNG ổn định giữa các lần chạy (nghi bug race condition)',
    async () => {}
  );

  test('TC_NKGD_PBV_05: Tự tính "Giá trị cắt lỗ tối đa" & "Phân bổ vốn cho deal tiếp theo"', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    await nkgd.allocationInitialCapitalInput.fill('100000000');
    await nkgd.allocationInitialCapitalInput.blur();
    await nkgd.allocationMaxCutlossPercentInput.fill('10');
    await nkgd.allocationMaxCutlossPercentInput.blur();
    await nkgd.allocationDealCutlossPercentInput.fill('2');
    await nkgd.allocationDealCutlossPercentInput.blur();
    await page.waitForTimeout(500);

    const maxCutlossValue = (await nkgd.allocationMaxCutlossValue.inputValue()).replace(/,/g, '');
    expect(Number(maxCutlossValue)).toBeGreaterThan(0);
    const resultValue = (await nkgd.allocationResultValue.inputValue()).replace(/,/g, '');
    expect(Number(resultValue)).toBeGreaterThan(0);
  });

  test('TC_NKGD_PBV_06: Cảnh báo khi Phân bổ vốn cho deal tiếp theo vượt quá vốn khả dụng', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    // Nhập giá trị cực lớn để gần như chắc chắn vượt vốn khả dụng hiện có của danh mục.
    await nkgd.allocationInitialCapitalInput.fill('999999999999');
    await nkgd.allocationInitialCapitalInput.blur();
    await nkgd.allocationMaxCutlossPercentInput.fill('90');
    await nkgd.allocationMaxCutlossPercentInput.blur();
    await nkgd.allocationDealCutlossPercentInput.fill('1');
    await nkgd.allocationDealCutlossPercentInput.blur();
    await page.waitForTimeout(500);
    await expect(nkgd.allocationResultValue).toHaveClass(/is-invalid/);
  });

  test('TC_NKGD_PBV_07: Checkbox "Ghi nhận lời lỗ của danh mục vào vốn khả dụng"', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    await nkgd.allocationRecordProfitLossCheckbox.check({ force: true });
    await page.waitForTimeout(300);
    await expect(nkgd.allocationRecordProfitLossCheckbox).toBeChecked();
    await nkgd.allocationRecordProfitLossCheckbox.uncheck({ force: true });
    await expect(nkgd.allocationRecordProfitLossCheckbox).not.toBeChecked();
  });
});

test.describe('Phân bổ vốn — Đổi danh mục', () => {
  test('TC_NKGD_PBV_08: Đổi Danh mục — tải lại đúng cấu hình riêng', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    const options = await nkgd.allocationCategorySelect.locator('option').allTextContents();
    test.skip(options.length < 2, 'Cần ít nhất 2 danh mục để test đổi qua lại');

    const firstCategory = options[0];
    const secondCategory = options[1];
    // Chọn tường minh firstCategory trước khi sửa — KHÔNG giả định danh mục đang active mặc định trùng với
    // options[0] (dropdown mặc định có thể đang ở danh mục khác thứ tự đầu tiên trong list).
    await nkgd.allocationCategorySelect.selectOption({ label: firstCategory });
    await page.waitForTimeout(400);
    // Xóa qua bàn phím trước khi gõ giá trị mới — field có v-money, .fill() ghi đè trực tiếp DOM value có thể
    // bị v-money nối chuỗi thay vì thay thế (đã xác nhận qua automation: fill('123456') khi field đang có sẵn
    // "54,321" cho ra "54321123456" thay vì "123456").
    await nkgd.allocationInitialCapitalInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await nkgd.allocationInitialCapitalInput.type('123456');
    await nkgd.allocationInitialCapitalInput.blur();

    await nkgd.allocationCategorySelect.selectOption({ label: secondCategory });
    await page.waitForTimeout(400);
    await nkgd.allocationCategorySelect.selectOption({ label: firstCategory });
    await page.waitForTimeout(400);
    const value = (await nkgd.allocationInitialCapitalInput.inputValue()).replace(/,/g, '');
    expect(value).toBe('123456');
  });

  test('TC_NKGD_PBV_09: Mock 0 danh mục — kiểm tra crash tiềm ẩn', async ({ page }) => {
    await page.route(/\/api\/stocks\/category\/get-all/, (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await gotoAllocationTab(page);
    await page.waitForTimeout(800);
    console.log(`[TC_NKGD_PBV_09] pageerror ghi nhận khi 0 danh mục: ${JSON.stringify(errors)}`);
  });
});

test.describe('Phân bổ vốn — Auto-save ngầm', () => {
  // Đo qua automation nhiều lần cho kết quả KHÔNG ổn định: có lần chờ 8s (dài hơn hẳn debounce lý thuyết
  // ~3.2s) mà auto-save không hề gửi request; có lần cùng kịch bản lại gửi đúng như thiết kế. Nghi ngờ nguyên
  // nhân: `data_save[category] = {...}` (CapitalAllocation.vue) gán trực tiếp property mới không qua
  // `Vue.set`/`this.$set` — nếu category đang chọn CHƯA có sẵn key reactive trong `data_save` (chưa từng lưu
  // trên server), watcher `deep:true` không phát hiện được mutation này nên auto-save không chạy; nếu key đã
  // tồn tại sẵn (đã từng lưu trước đó) thì watcher vẫn hoạt động bình thường — phụ thuộc trạng thái dữ liệu
  // của danh mục đang active tại thời điểm chạy, không kiểm soát được ổn định trên tài khoản test dùng chung.
  // Không assert 1 chiều cụ thể vì sẽ tạo test flaky giả — đánh dấu fixme, xem chi tiết trong
  // testcases/nhat-ky-giao-dich-phan-bo-von.md.
  test.fixme(
    'TC_NKGD_PBV_10: Đổi giá trị form → auto-save gửi request KHÔNG ổn định giữa các lần chạy (nghi bug reactivity Vue 2 theo trạng thái danh mục)',
    async () => {}
  );

  test('TC_NKGD_PBV_11: Auto-save lỗi mạng — hoàn toàn im lặng, không toast', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    await page.unroute('**/updateusersettings**');
    await page.route('**/updateusersettings**', (route: any) => route.fulfill({ status: 500, body: 'error' }));

    await nkgd.allocationInitialCapitalInput.fill('888888');
    await nkgd.allocationInitialCapitalInput.blur();
    await page.waitForTimeout(4000);

    await expect(page.getByText('Có lỗi xảy ra', { exact: false })).toHaveCount(0);
  });
});

test.describe('Phân bổ vốn — Các khối hiển thị', () => {
  test('TC_NKGD_PBV_12: 3 icon toggle collapse', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    void nkgd;
    const toggle = page.getByText('Trong đó:', { exact: false }).first();
    if (await toggle.count()) {
      await toggle.click();
      await page.waitForTimeout(300);
      await toggle.click();
    }
  });

  test('TC_NKGD_PBV_13: Khối "Trạng thái danh mục hiện tại" — đủ số liệu', async ({ page }) => {
    await gotoAllocationTab(page);
    for (const label of ['Vốn ban đầu', 'Vốn khả dụng', 'Giá vốn chứng khoán của danh mục', 'Margin đang sử dụng']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test('TC_NKGD_PBV_14: Khối "Trạng thái danh mục khi có deal tiếp theo" — mô phỏng SAU deal', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    await nkgd.allocationInitialCapitalInput.fill('100000000');
    await nkgd.allocationInitialCapitalInput.blur();
    await nkgd.allocationMaxCutlossPercentInput.fill('10');
    await nkgd.allocationMaxCutlossPercentInput.blur();
    await nkgd.allocationDealCutlossPercentInput.fill('2');
    await nkgd.allocationDealCutlossPercentInput.blur();
    await page.waitForTimeout(500);
    await expect(page.getByText('Trạng thái danh mục khi có deal tiếp theo')).toBeVisible();
    // Chỉ verify khối này tồn tại + hiển thị số liệu hợp lệ (không NaN/undefined) — không so sánh chính xác với
    // khối "hiện tại" vì phụ thuộc dữ liệu thật thay đổi theo thời gian.
    await expect(page.getByText('undefined', { exact: false })).toHaveCount(0);
    await expect(page.getByText('NaN', { exact: false })).toHaveCount(0);
  });
});

test.describe('Phân bổ vốn — Empty state & lỗi tải dữ liệu', () => {
  test('TC_NKGD_PBV_15: Empty state khi danh mục chưa đủ dữ liệu giao dịch', async ({ page }) => {
    const nkgd = await gotoAllocationTab(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    const options = await nkgd.allocationCategorySelect.locator('option').allTextContents();
    // Thử qua từng danh mục có sẵn — không giả định trước danh mục nào rỗng, chỉ verify không crash/NaN.
    for (const opt of options.slice(0, 3)) {
      await nkgd.allocationCategorySelect.selectOption({ label: opt });
      await page.waitForTimeout(400);
    }
    expect(errors).toEqual([]);
  });

  test('TC_NKGD_PBV_16: Lỗi tải danh sách danh mục — im lặng, không toast', async ({ page }) => {
    await page.route(/\/api\/stocks\/category\/get-all/, (route: any) => route.fulfill({ status: 500, body: 'error' }));
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    const nkgd = await gotoAllocationTab(page);
    await page.waitForTimeout(500);
    void nkgd;
    await expect(page.getByText('Có lỗi xảy ra', { exact: false })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
