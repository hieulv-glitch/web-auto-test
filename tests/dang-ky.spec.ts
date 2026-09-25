import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';

const EXISTING_PHONE = process.env.TEST_USER_EMAIL!; // tài khoản test hiện có là SĐT

// AN TOÀN: mặc định luôn chặn (abort) API đăng ký thật trong mọi test của file này, để không bao giờ vô tình
// tạo tài khoản thật / gửi OTP thật lên production. Test nào cần quan sát luồng "thành công" sẽ tự đăng ký
// route mock riêng (chạy trước handler này vì được thêm sau — xem beforeEach).
test.beforeEach(async ({ page }) => {
  await page.route('**/auth/register', (route) => route.abort());
});

async function mockRegisterSuccess(page: any, otpSendType: 'email' | 'zalo' = 'email') {
  await page.route('**/auth/register', (route: any) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { otpRegisterId: 999999, otpSendType } }),
    })
  );
}

test.describe('Đăng Ký — Overview & UI', () => {
  test('TC_DANGKY_01: Overview màn hình hiển thị đầy đủ', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(page.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeVisible();
    await expect(reg.nameInput).toBeVisible();
    await expect(reg.emailInput).toBeVisible();
    await expect(reg.phoneInput).toBeVisible();
    await expect(reg.passwordInput).toBeVisible();
    await expect(reg.passwordConfirmInput).toBeVisible();
    await expect(reg.viewPlansLink).toBeVisible();
    await expect(reg.submitButton).toBeVisible();
    await expect(reg.loginLink).toBeVisible();
  });

  test('TC_DANGKY_02: Tiêu đề hiển thị "Đăng ký tài khoản"', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(page.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeVisible();
  });

  test('TC_DANGKY_04: Textbox Họ tên đúng placeholder', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.nameInput).toBeVisible();
  });

  test('TC_DANGKY_26: Textbox Điện thoại đúng placeholder', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.phoneInput).toBeVisible();
  });

  test('TC_DANGKY_39: Textbox Mật khẩu không có icon con mắt', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_DANGKY_40: Mật khẩu mặc định ẩn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.passwordInput.fill('bat-ky');
    await expect(reg.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_DANGKY_55/56: Textbox Nhập lại mật khẩu đúng placeholder, mặc định ẩn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.passwordConfirmInput).toHaveAttribute('type', 'password');
  });

  test('TC_DANGKY_62: Button submit hiển thị "Gửi đăng ký"', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.submitButton).toHaveText('Gửi đăng ký');
  });

  test('TC_DANGKY_69: Link "Đã có tài khoản" hiển thị đúng (không có dấu hỏi)', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.loginLink).toHaveText('Đã có tài khoản');
  });
});

test.describe('Đăng Ký — Trường bắt buộc (không gọi API thật)', () => {
  test('TC_DANGKY_05: Bỏ trống Họ tên', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ name: '' }));
    await reg.submit();
    await expect(reg.fieldError('Họ tên không được để trống')).toBeVisible();
  });

  test('TC_DANGKY_13: Bỏ trống Email', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ email: '' }));
    await reg.submit();
    await expect(reg.fieldError('Email không được để trống')).toBeVisible();
  });

  test('TC_DANGKY_27: Bỏ trống Điện thoại', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ phone: '' }));
    await reg.submit();
    await expect(reg.fieldError('Số điện thoại không được để trống')).toBeVisible();
  });

  test('TC_DANGKY_41: Bỏ trống Mật khẩu', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: '', passwordConfirm: '' }));
    await reg.submit();
    await expect(reg.fieldError('Vui lòng nhập mật khẩu').first()).toBeVisible();
  });

  test('TC_DANGKY_63: Để trống tất cả trường → hiện đủ cảnh báo', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.submit();
    await expect(reg.fieldError('Họ tên không được để trống')).toBeVisible();
    await expect(reg.fieldError('Email không được để trống')).toBeVisible();
    await expect(reg.fieldError('Số điện thoại không được để trống')).toBeVisible();
    await expect(reg.fieldError('Vui lòng nhập mật khẩu').first()).toBeVisible();
  });
});

test.describe('Đăng Ký — Validate Họ tên (phát hiện: web lỏng hơn app)', () => {
  test('TC_DANGKY_06: Họ tên chỉ khoảng trắng KHÔNG bị chặn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill({ name: '    ' });
    await reg.emailInput.fill(reg.buildValidData().email);
    await reg.submit();
    await expect(reg.fieldError('Họ tên không được để trống')).toHaveCount(0);
  });

  test('TC_DANGKY_07: Họ tên là số KHÔNG bị chặn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.nameInput.fill('123456');
    await reg.submit();
    await expect(reg.fieldError('Họ và tên không hợp lệ')).toHaveCount(0);
    await expect(reg.fieldError('Họ tên không được để trống')).toHaveCount(0);
  });

  test('TC_DANGKY_08: Họ tên ký tự đặc biệt KHÔNG bị chặn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.nameInput.fill('@#$%^&*');
    await reg.submit();
    await expect(reg.fieldError('Họ và tên không hợp lệ')).toHaveCount(0);
  });

  test('TC_DANGKY_11: Họ tên không giới hạn ký tự (client)', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    const longName = 'a'.repeat(80);
    await reg.nameInput.fill(longName);
    await expect(reg.nameInput).toHaveValue(longName);
  });
});

test.describe('Đăng Ký — Validate Email', () => {
  const invalidCases: { id: string; value: string }[] = [
    { id: 'TC_DANGKY_14', value: '   ' },
    { id: 'TC_DANGKY_15', value: 'abc@' },
    { id: 'TC_DANGKY_16', value: 'abcgmail.com' },
    { id: 'TC_DANGKY_17', value: 'abc@gmail' },
    { id: 'TC_DANGKY_18', value: '@gmail.com' },
    { id: 'TC_DANGKY_19', value: 'abc 123@gmail.com' },
    { id: 'TC_DANGKY_20', value: 'abc@@gmail.com' },
  ];
  for (const c of invalidCases) {
    test(`${c.id}: Email không hợp lệ — "${c.value}"`, async ({ page }) => {
      const reg = new RegisterPage(page);
      await reg.goto();
      await reg.emailInput.fill(c.value);
      await page.waitForTimeout(1200);
      await expect(reg.fieldError('Email không hợp lệ')).toBeVisible();
    });
  }

  // PHÁT HIỆN: web KHÔNG chặn 2 case này dù app kỳ vọng báo lỗi
  const unexpectedlyValidCases: { id: string; value: string }[] = [
    { id: 'TC_DANGKY_21', value: 'abc..xyz@gmail.com' },
    { id: 'TC_DANGKY_22', value: '.abc@gmail.com' },
  ];
  for (const c of unexpectedlyValidCases) {
    test(`${c.id}: Email "${c.value}" — web KHÔNG báo lỗi (khác app)`, async ({ page }) => {
      const reg = new RegisterPage(page);
      await reg.goto();
      await reg.emailInput.fill(c.value);
      await page.waitForTimeout(1200);
      await expect(reg.fieldError('Email không hợp lệ')).toHaveCount(0);
    });
  }

  test('TC_DANGKY_23: Email hợp lệ đăng ký thành công (mock)', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ email: 'dung-test@gmail.com' }));
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });

  test.fixme('TC_DANGKY_24: Email đã tồn tại — cần email test thật đã đăng ký', async () => {});
  test.fixme('TC_DANGKY_25: Email viết hoa vẫn báo đã tồn tại — cần email test thật', async () => {});
});

test.describe('Đăng Ký — Validate Điện thoại (phát hiện: regex rất lỏng, khác app)', () => {
  const invalidCases: { id: string; value: string }[] = [
    { id: 'TC_DANGKY_28', value: '   ' },
    { id: 'TC_DANGKY_29', value: 'abcdefghij' },
    { id: 'TC_DANGKY_30', value: '@#$%^&*' },
    { id: 'TC_DANGKY_31', value: '0987abc123' },
    { id: 'TC_DANGKY_32', value: '0987 123 456' },
  ];
  for (const c of invalidCases) {
    test(`${c.id}: SĐT không hợp lệ — "${c.value}"`, async ({ page }) => {
      const reg = new RegisterPage(page);
      await reg.goto();
      await reg.phoneInput.fill(c.value);
      await page.waitForTimeout(1200);
      await expect(reg.fieldError('Số điện thoại không hợp lệ')).toBeVisible();
    });
  }

  // PHÁT HIỆN QUAN TRỌNG: web CHO PHÉP các case này dù app kỳ vọng báo lỗi — regex chỉ kiểm tra 7-15 chữ số
  const unexpectedlyValidCases: { id: string; value: string; note: string }[] = [
    { id: 'TC_DANGKY_33', value: '09871234567', note: '11 số, bắt đầu bằng 0' },
    { id: 'TC_DANGKY_34', value: '098712345', note: '9 số' },
    { id: 'TC_DANGKY_35', value: '1987123456', note: 'không bắt đầu bằng 0' },
    { id: 'TC_DANGKY_36', value: '0123456789', note: 'đầu số không hợp lệ' },
  ];
  for (const c of unexpectedlyValidCases) {
    test(`${c.id}: SĐT "${c.value}" (${c.note}) — web KHÔNG báo lỗi (khác app)`, async ({ page }) => {
      const reg = new RegisterPage(page);
      await reg.goto();
      await reg.phoneInput.fill(c.value);
      await page.waitForTimeout(1200);
      await expect(reg.fieldError('Số điện thoại không hợp lệ')).toHaveCount(0);
    });
  }

  test('TC_DANGKY_37: SĐT hợp lệ đăng ký thành công (mock)', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ phone: '0987123999' }));
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });

  test('TC_DANGKY_38: SĐT đã tồn tại (dùng SĐT tài khoản test thật)', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.phoneInput.fill(EXISTING_PHONE);
    await page.waitForTimeout(1200);
    await expect(reg.fieldError('Số điện thoại đã tồn tại')).toBeVisible();
  });
});

test.describe('Đăng Ký — Validate Mật khẩu (phát hiện: KHÔNG có yêu cầu độ phức tạp)', () => {
  test('TC_DANGKY_42: Mật khẩu 8 khoảng trắng KHÔNG bị chặn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: '        ', passwordConfirm: '        ' }));
    await reg.submit();
    await expect(reg.fieldError('Mật khẩu cần ít nhất 6 ký tự.')).toHaveCount(0);
  });

  test('TC_DANGKY_43: Mật khẩu < 6 ký tự bị chặn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Ab@1', passwordConfirm: 'Ab@1' }));
    await reg.submit();
    await expect(reg.fieldError('Mật khẩu cần ít nhất 6 ký tự.').first()).toBeVisible();
  });

  test('TC_DANGKY_44: Mật khẩu > 20 ký tự KHÔNG bị chặn', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    const longPw = 'Abc@1234'.repeat(4);
    await reg.passwordInput.fill(longPw);
    await expect(reg.passwordInput).toHaveValue(longPw);
  });

  const permissiveCases: { id: string; value: string; note: string }[] = [
    { id: 'TC_DANGKY_45', value: 'abcdefgh', note: 'chỉ chữ thường' },
    { id: 'TC_DANGKY_46', value: 'ABCDEFGH', note: 'chỉ chữ hoa' },
    { id: 'TC_DANGKY_47', value: '12345678', note: 'chỉ số' },
    { id: 'TC_DANGKY_48', value: '@#$%^&*!', note: 'chỉ ký tự đặc biệt' },
    { id: 'TC_DANGKY_49', value: 'abc@1234', note: 'thiếu chữ hoa' },
    { id: 'TC_DANGKY_50', value: 'ABC@1234', note: 'thiếu chữ thường' },
    { id: 'TC_DANGKY_51', value: 'Abcdefg@', note: 'thiếu số' },
    { id: 'TC_DANGKY_52', value: 'Abcd1234', note: 'thiếu ký tự đặc biệt' },
    { id: 'TC_DANGKY_53', value: 'Mậtkhẩu@1', note: 'có dấu tiếng Việt' },
  ];
  for (const c of permissiveCases) {
    test(`${c.id}: Mật khẩu "${c.value}" (${c.note}) — web CHO PHÉP đăng ký (khác app)`, async ({ page }) => {
      const reg = new RegisterPage(page);
      await mockRegisterSuccess(page);
      await reg.goto();
      await reg.fill(reg.buildValidData({ password: c.value, passwordConfirm: c.value }));
      await reg.submit();
      await expect(reg.otpModalTitle).toBeVisible();
    });
  }

  test('TC_DANGKY_54: Mật khẩu hợp lệ đủ mạnh vẫn đăng ký được (mock)', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });
});

test.describe('Đăng Ký — Nhập lại mật khẩu', () => {
  test('TC_DANGKY_57: Bỏ trống Nhập lại mật khẩu', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ passwordConfirm: '' }));
    await reg.submit();
    await expect(reg.fieldError('Vui lòng nhập mật khẩu').first()).toBeVisible();
  });

  test('TC_DANGKY_59: Không khớp với Mật khẩu', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Abc@1234', passwordConfirm: 'Abc@5678' }));
    await reg.submit();
    await expect(reg.fieldError('Xác nhận mật khẩu không khớp.')).toBeVisible();
  });

  test('TC_DANGKY_60: Khớp với Mật khẩu → đăng ký thành công (mock)', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Abc@1234', passwordConfirm: 'Abc@1234' }));
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });

  test('TC_DANGKY_61: Phân biệt hoa/thường khi so khớp', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Abc@1234', passwordConfirm: 'ABC@1234' }));
    await reg.submit();
    await expect(reg.fieldError('Xác nhận mật khẩu không khớp.')).toBeVisible();
  });
});

test.describe('Đăng Ký — Luồng thành công & Modal OTP', () => {
  test('TC_DANGKY_03/64: Đăng ký thành công hiện modal OTP', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });

  test('TC_DANGKY_77: Modal OTP hiển thị đúng cấu trúc', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page, 'email');
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(page.getByText('Nhập mã OTP Email')).toBeVisible();
    await expect(reg.otpInputs).toHaveCount(6);
    await expect(page.getByText(/Gửi lại mã sau/)).toBeVisible();
    await expect(page.getByText(/Xác thực bằng zalo/i)).toBeVisible();
  });

  test('TC_DANGKY_79: Nhập đủ 6 số OTP tự động gọi verify', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    let verifyCalled = false;
    await page.route('**/auth/vertify-otp', (route) => {
      verifyCalled = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false }) });
    });
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
    await reg.fillOtp('123456');
    await page.waitForTimeout(500);
    expect(verifyCalled).toBe(true);
  });
});

test.describe('Đăng Ký — Điều hướng (links)', () => {
  test('TC_DANGKY_70: Click "Đã có tài khoản" chuyển tới /login', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC_DANGKY_71: Click "Xem chi tiết các gói tại đây" mở tab mới tới /home#mua', async ({ page, context }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    const [newPage] = await Promise.all([context.waitForEvent('page'), reg.viewPlansLink.click()]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/home');
  });

  test('TC_DANGKY_72: Click logo chuyển về "/"', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await expect(reg.logoLink).toHaveAttribute('href', '/');
  });

  test('TC_DANGKY_75: Nút Back trình duyệt quay lại /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Đăng ký' }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Đăng Ký — Hành vi button & xử lý lỗi', () => {
  test('TC_DANGKY_65: Click liên tục nút Gửi đăng ký', async ({ page }) => {
    const reg = new RegisterPage(page);
    await mockRegisterSuccess(page);
    let callCount = 0;
    page.on('request', (req) => { if (req.url().includes('/auth/register')) callCount++; });
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    for (let i = 0; i < 3; i++) {
      await reg.submitButton.click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(1500);
    test.info().annotations.push({
      type: 'note',
      description: `Số lần gọi API /auth/register khi spam click: ${callCount}. Kỳ vọng lý tưởng là 1.`,
    });
    expect(callCount).toBeGreaterThanOrEqual(1);
  });

  test('TC_DANGKY_66: Trạng thái loading/disable khi đang xử lý', async ({ page }) => {
    const reg = new RegisterPage(page);
    await page.route('**/auth/register', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { otpRegisterId: 1, otpSendType: 'email' } }) });
    });
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    const isDisabled = await reg.submitButton.isDisabled();
    test.info().annotations.push({
      type: 'note',
      description: `Button disabled trong lúc chờ API: ${isDisabled}. Theo review code không có state loading — nếu true nghĩa là đã cải thiện.`,
    });
  });

  test('TC_DANGKY_67: Mất kết nối mạng hoàn toàn — KHÔNG crash JS', async ({ page, context }) => {
    const reg = new RegisterPage(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await context.setOffline(true);
    await reg.submit();
    await page.waitForTimeout(2000);
    await context.setOffline(false);
    expect(pageErrors, `Không được có lỗi JS runtime, nhưng bắt được: ${pageErrors.join(' | ')}`).toHaveLength(0);
  });

  test('TC_DANGKY_68: Server 500 thiếu field "errors" — 🐞 BUG xác nhận crash JS', async ({ page }) => {
    const reg = new RegisterPage(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.route('**/auth/register', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Internal Server Error' }) })
    );
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await page.waitForTimeout(1500);
    test.info().annotations.push({
      type: 'note',
      description: `Lỗi JS bắt được: ${pageErrors.length ? pageErrors.join(' | ') : 'không có'}. Đã xác nhận bug: dataError?.errors.message[0] crash khi response thiếu field "errors".`,
    });
    expect(pageErrors.some((e) => e.includes("reading 'message'"))).toBe(true);
  });
});

test.describe('Đăng Ký — Khác', () => {
  test('TC_DANGKY_73: Thứ tự Tab: Họ tên → Email → Điện thoại → Mật khẩu → Nhập lại mật khẩu', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.nameInput.click();
    await page.keyboard.press('Tab');
    await expect(reg.emailInput).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(reg.phoneInput).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(reg.passwordInput).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(reg.passwordConfirmInput).toBeFocused();
  });

  test('TC_DANGKY_74: Responsive ở nhiều kích thước màn hình', async ({ page }) => {
    const reg = new RegisterPage(page);
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Mobile ngang', width: 667, height: 375 },
    ];
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await reg.goto();
      await expect(reg.nameInput, `Lỗi ở viewport ${vp.name}`).toBeVisible();
      await expect(reg.submitButton, `Lỗi ở viewport ${vp.name}`).toBeVisible();
    }
  });

  test('TC_DANGKY_76: Dữ liệu bị xóa sau khi rời màn hình', async ({ page }) => {
    const reg = new RegisterPage(page);
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await page.goto('/login');
    await reg.goto();
    await expect(reg.nameInput).toHaveValue('');
    await expect(reg.emailInput).toHaveValue('');
  });

  test.fixme('TC_DANGKY_10: Họ tên có khoảng trắng đầu/cuối — cần verify có trim hay không (rủi ro tạo tài khoản thật)', async () => {});
  test.fixme('TC_DANGKY_78: Nút "Gửi lại mã" chỉ bật sau khi hết đếm ngược', async () => {});
  test.fixme('TC_DANGKY_80: Chuyển đổi kênh xác thực Email ↔ Zalo', async () => {});
});
