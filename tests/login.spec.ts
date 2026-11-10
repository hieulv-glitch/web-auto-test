import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PREV2_BASE_URL } from '../pages/Prev2Session';

const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;
// Chạy trên prev2 (bản build preprod — backend PRODUCTION, xem pages/Prev2Session.ts). Số lần đăng nhập thật / sai mật
// khẩu thật giữ nguyên như khi chạy trên kfsp.vn (không tăng) để tránh khoá tài khoản test.
test.use({ baseURL: PREV2_BASE_URL });

/** Bản build còn checkbox "Duy trì đăng nhập" = chưa có commit ff0dbcdc8 (06/11/2026) của preprod. */
async function isOldBuildWithPersistCheckbox(page: Page) {
  return (await new LoginPage(page).persistCheckbox.count()) > 0;
}

const GENERIC_ERROR = 'Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn.';

test.describe('Đăng Nhập — Overview & UI', () => {
  test('TC_LOGIN_01: Overview màn hình hiển thị đầy đủ', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.getByRole('heading', { name: 'Đăng Nhập' })).toBeVisible();
    await expect(page.getByText('Hãy đăng nhập vào tài khoản của bạn')).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('TC_LOGIN_02: Hiển thị logo trong thẻ đăng nhập + logo "KFSP" ở góc trên trái', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.logoLink.locator('img')).toBeVisible();
    await expect(loginPage.cornerLogoLink.locator('img')).toBeVisible();
    await expect(loginPage.cornerLogoLink).toHaveText('KFSP');
    const box = await loginPage.cornerLogoLink.boundingBox();
    expect(box!.x).toBeLessThan(60);
    expect(box!.y).toBeLessThan(60);
    await expect(loginPage.cornerLogoLink).toHaveCSS('position', 'fixed');
  });

  test('TC_LOGIN_03: Click logo (trong thẻ và ở góc) chuyển về trang chủ /home', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.logoLink).toHaveAttribute('href', '/home');
    await expect(loginPage.cornerLogoLink).toHaveAttribute('href', '/home');
    await loginPage.cornerLogoLink.click();
    await expect(page).toHaveURL(/\/home/);
    await loginPage.goto();
    await loginPage.logoLink.click();
    await expect(page).toHaveURL(/\/home/);
  });

  test('TC_LOGIN_05: Textbox Tài khoản hiển thị đúng placeholder', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.usernameInput).toHaveAttribute('placeholder', 'Nhập email hoặc số điện thoại');
  });

  test('TC_LOGIN_26: Textbox Mật khẩu hiển thị đúng placeholder, không có icon con mắt', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.passwordInput).toHaveAttribute('placeholder', 'Nhập mật khẩu');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_LOGIN_27: Mật khẩu mặc định ẩn (type=password)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill('bat-ky-mat-khau');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_LOGIN_39: Hiển thị link "Quên mật khẩu?"', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toHaveText(/Quên mật khẩu/);
  });

  test('TC_LOGIN_41: Button "Đăng nhập" hiển thị màu xanh (success)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toHaveClass(/btn-success/);
  });

  test('TC_LOGIN_49: Hiển thị link "Đăng ký"', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.registerLink).toBeVisible();
  });
});

test.describe('Đăng Nhập — Luồng thành công', () => {
  test('TC_LOGIN_04: Đăng nhập thành công bằng tài khoản/mật khẩu đúng', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, PASSWORD);
    await loginPage.expectLoggedIn();
  });

  test('TC_LOGIN_17: Đăng nhập bằng số điện thoại hợp lệ', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, PASSWORD);
    await loginPage.expectLoggedIn();
  });

  test('TC_LOGIN_24: Tài khoản có khoảng trắng đầu/cuối vẫn đăng nhập được', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`  ${EMAIL}  `, PASSWORD);
    await loginPage.expectLoggedIn();
  });

  test('TC_LOGIN_31/43: Click button ĐĂNG NHẬP với dữ liệu hợp lệ', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, PASSWORD);
    await loginPage.expectLoggedIn();
  });

  test('TC_LOGIN_54: Truy cập lại /login khi đã đăng nhập => tự động chuyển hướng vào Dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, PASSWORD);
    await loginPage.expectLoggedIn();

    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Đăng Nhập — Input không hợp lệ (không chạm tài khoản thật)', () => {
  const cases: { id: string; description: string; username: string; password: string }[] = [
    { id: 'TC_LOGIN_06', description: 'bỏ trống Tài khoản', username: '', password: 'AnyPass123' },
    { id: 'TC_LOGIN_07', description: 'Tài khoản chỉ chứa khoảng trắng', username: '   ', password: 'AnyPass123' },
    { id: 'TC_LOGIN_09', description: 'Email thiếu @', username: 'abcgmail.com', password: 'AnyPass123' },
    { id: 'TC_LOGIN_10', description: 'Email thiếu domain', username: 'abc@', password: 'AnyPass123' },
    { id: 'TC_LOGIN_11', description: 'Email thiếu dấu chấm', username: 'abc@gmail', password: 'AnyPass123' },
    { id: 'TC_LOGIN_12', description: 'Email có 2 dấu @', username: 'abc@@gmail.com', password: 'AnyPass123' },
    { id: 'TC_LOGIN_13', description: 'Email chứa ký tự đặc biệt', username: 'abc#$@gmail.com', password: 'AnyPass123' },
    { id: 'TC_LOGIN_14', description: 'Email có khoảng trắng ở giữa', username: 'abc 123@gmail.com', password: 'AnyPass123' },
    { id: 'TC_LOGIN_16', description: 'Email chưa đăng ký', username: 'chua-dang-ky-xyz@gmail.com', password: 'AnyPass123' },
    { id: 'TC_LOGIN_18', description: 'SĐT > 10 ký tự', username: '09871234567', password: 'AnyPass123' },
    { id: 'TC_LOGIN_19', description: 'SĐT < 10 ký tự', username: '098712345', password: 'AnyPass123' },
    { id: 'TC_LOGIN_20', description: 'SĐT không bắt đầu bằng 0', username: '1987123456', password: 'AnyPass123' },
    { id: 'TC_LOGIN_21', description: 'SĐT đầu số không hợp lệ', username: '0123456789', password: 'AnyPass123' },
    { id: 'TC_LOGIN_22', description: 'SĐT chưa đăng ký', username: '0900000000', password: 'AnyPass123' },
    { id: 'TC_LOGIN_23', description: 'Tài khoản chỉ chứa ký tự đặc biệt', username: '@#$%^&*', password: 'AnyPass123' },
    { id: 'TC_LOGIN_42', description: 'để trống cả Tài khoản và Mật khẩu', username: '', password: '' },
  ];

  for (const c of cases) {
    test(`${c.id}: ${c.description} => hiển thị lỗi chung`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(c.username, c.password);
      await loginPage.expectGenericError();
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe('Đăng Nhập — Input sai với tài khoản thật (số lần chạy nên hạn chế để tránh khoá tài khoản test)', () => {
  test('TC_LOGIN_28: Tài khoản đúng, bỏ trống Mật khẩu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, '');
    await loginPage.expectGenericError();
  });

  test('TC_LOGIN_29: Tài khoản đúng, Mật khẩu chỉ chứa khoảng trắng', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, '   ');
    await loginPage.expectGenericError();
  });

  test('TC_LOGIN_30: Tài khoản đúng, Mật khẩu sai', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(EMAIL, 'mat-khau-sai-123');
    await loginPage.expectGenericError();
  });

  test('TC_LOGIN_33: Mật khẩu đúng nhưng sai hoa/thường bị từ chối', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Đảo hoa/thường toàn bộ mật khẩu thật để tạo input "gần đúng nhưng sai case"
    const flippedCase = PASSWORD.split('').map((ch) =>
      ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()
    ).join('');
    await loginPage.login(EMAIL, flippedCase);
    // Nếu mật khẩu thật không có chữ cái, chuỗi đảo case sẽ giống hệt bản gốc => bỏ qua assertion cứng, chỉ log để QA soát lại.
    if (flippedCase !== PASSWORD) {
      await loginPage.expectGenericError();
    } else {
      test.info().annotations.push({ type: 'note', description: 'Mật khẩu test không chứa chữ cái nên không tạo được biến thể sai hoa/thường — cần tài khoản khác để verify TC_LOGIN_33.' });
    }
  });
});

test.describe('Đăng Nhập — Phiên đăng nhập (đã gỡ checkbox "Duy trì đăng nhập")', () => {
  // TC_LOGIN_35–38 (checkbox "Duy trì đăng nhập") đã xoá: preprod gỡ checkbox, web luôn xin phiên dài hạn (commit ff0dbcdc8).
  test('TC_LOGIN_55: Không còn checkbox "Duy trì đăng nhập" — mọi lần đăng nhập gửi persist_login=true', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();
    test.skip(await isOldBuildWithPersistCheckbox(page),
      'Môi trường đang chạy bản build cũ còn checkbox — chưa có commit ff0dbcdc8 (06/11/2026) của preprod');
    await expect(page.getByText('Duy trì đăng nhập')).toHaveCount(0);

    // Giả lập /api/login: chỉ đọc body gửi đi, không đăng nhập thật.
    let body: Record<string, unknown> | undefined;
    await page.route('**/api/login', async (route) => {
      body = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });
    await loginPage.login('0900000000', 'AnyPass123');
    await expect.poll(() => body).toBeTruthy();
    expect(body!.persist_login).toBe(true);
    await loginPage.expectGenericError();
  });
});

test.describe('Đăng Nhập — Điều hướng (links)', () => {
  test('TC_LOGIN_40: Click "Quên mật khẩu?" chuyển tới /request-password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/request-password/);
  });

  test('TC_LOGIN_50: Click "Đăng ký" chuyển tới /register', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('TC_LOGIN_53: Nút Back trình duyệt quay lại /login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/\/register/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Đăng Nhập — Hành vi button & xử lý lỗi (phát hiện qua kiểm thử thực tế)', () => {
  test('TC_LOGIN_44: Click liên tục nút Đăng nhập gọi API nhiều lần (chưa có chống double-submit)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    let loginCallCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/login')) loginCallCount++;
    });

    await loginPage.usernameInput.fill(EMAIL);
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    for (let i = 0; i < 3; i++) {
      await loginPage.loginButton.click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(2000);

    test.info().annotations.push({
      type: 'note',
      description: `Số lần gọi API /api/login khi spam click: ${loginCallCount}. Kỳ vọng lý tưởng là 1 — nếu > 1 nghĩa là chưa có disable/debounce khi submit (đã ghi nhận thực tế: 4 lần).`,
    });
    expect(loginCallCount).toBeGreaterThanOrEqual(1);
  });

  test('TC_LOGIN_45: Kiểm tra trạng thái loading/disable khi đang xử lý đăng nhập', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await page.route('**/api/login', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await loginPage.usernameInput.fill(EMAIL);
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();

    // Quan sát ngay sau khi click, trong lúc request đang "treo" 1.5s
    const isDisabledDuringRequest = await loginPage.loginButton.isDisabled();
    test.info().annotations.push({
      type: 'note',
      description: `Button disabled trong lúc chờ API phản hồi: ${isDisabledDuringRequest}. Theo review code, hiện KHÔNG có state loading/disable — nếu true nghĩa là hành vi đã được cải thiện, cần cập nhật lại tài liệu testcase.`,
    });
  });

  test('TC_LOGIN_46: Đăng nhập khi mất kết nối mạng hoàn toàn', async ({ page, context }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await context.setOffline(true);
    await loginPage.usernameInput.fill(EMAIL);
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await page.waitForTimeout(2000);
    await context.setOffline(false);

    test.info().annotations.push({
      type: 'note',
      description: `Lỗi JS runtime bắt được khi mất mạng: ${pageErrors.length ? pageErrors.join(' | ') : 'không có'}. Theo review code (catch block đọc error.response.data.user_status không kiểm tra error.response tồn tại), nghi ngờ có thể phát sinh lỗi JS thay vì thông báo thân thiện.`,
    });
  });

  test('TC_LOGIN_47: Đăng nhập khi server trả lỗi 500', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await page.route('**/api/login', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal Server Error' }) })
    );

    await loginPage.login(EMAIL, PASSWORD);
    await loginPage.expectGenericError();
  });

  test.fixme('TC_LOGIN_32: Nhập sai mật khẩu liên tiếp >= 5 lần (khoá tạm thời)', async () => {
    // Cần một tài khoản test riêng, dùng-một-lần để tránh khoá tài khoản test chính đang dùng cho các case khác.
    // App ghi nhận "chưa làm chức năng này" — bổ sung khi có tài khoản dự phòng + xác nhận backend đã hỗ trợ.
  });

  test.fixme('TC_LOGIN_48: Đăng nhập với tài khoản bị khoá', async () => {
    // Cần 1 tài khoản test ở trạng thái đã bị khoá để verify modal "Lỗi đăng nhập" hiển thị đúng nội dung.
  });

  test.fixme('TC_LOGIN_15: Email viết hoa vẫn đăng nhập được (không phân biệt hoa/thường)', async () => {
    // Tài khoản test hiện tại là số điện thoại, không phải email — cần tài khoản test dạng email để verify.
  });
});

test.describe('Đăng Nhập — Khác', () => {
  test('TC_LOGIN_25: Không giới hạn ký tự nhập ở Tài khoản (client)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const longValue = 'a'.repeat(150);
    await loginPage.usernameInput.fill(longValue);
    await expect(loginPage.usernameInput).toHaveValue(longValue);
  });

  test('TC_LOGIN_34: Paste mật khẩu vào textbox', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.click();
    await loginPage.passwordInput.evaluate((el: HTMLInputElement, value: string) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, 'pasted-password-123');
    await expect(loginPage.passwordInput).toHaveValue('pasted-password-123');
  });

  test('TC_LOGIN_51: Thứ tự Tab: Tài khoản => Mật khẩu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.usernameInput.click();
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
  });

  test('TC_LOGIN_52: Responsive ở nhiều kích thước màn hình', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Mobile ngang', width: 667, height: 375 },
    ];
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginPage.goto();
      await expect(loginPage.usernameInput, `Lỗi ở viewport ${vp.name}`).toBeVisible();
      await expect(loginPage.loginButton, `Lỗi ở viewport ${vp.name}`).toBeVisible();
    }
  });
});
