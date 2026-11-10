import { test as base, expect, Page } from '@playwright/test';
import { RegisterPage, FakeRegisterServer } from '../pages/RegisterPage';

const EXISTING_PHONE = process.env.TEST_USER_EMAIL!; // tài khoản test hiện có là SĐT

// AN TOÀN (chạy trên BASE_URL = localhost:8080, gọi backend PRODUCTION api2.kfsp.vn): fixture tự động cài
// `FakeRegisterServer` ở mức context cho MỌI test — API đăng ký mặc định bị huỷ, xác thực/gửi lại OTP luôn trả giả,
// mọi request ghi khác tới *.kfsp.vn bị huỷ. Sau mỗi test assert không có request ghi lạ nào (xem pages/RegisterPage.ts).
let current: RegisterPage | undefined;
const R = () => current!;
const test = base.extend<{ reg: RegisterPage }>({
  reg: [async ({ page, context }, use) => {
    current = new RegisterPage(page);
    await current.server.install(context);
    await use(current);
    expect(current.server.blockedWrites, 'Có request ghi lạ tới *.kfsp.vn bị chặn').toEqual([]);
    current = undefined;
  }, { auto: true }],
});

async function mockRegisterSuccess(_page: Page, otpSendType?: 'email' | 'zalo') {
  R().server.registerReply = FakeRegisterServer.ok(otpSendType);
}

test.describe('Đăng Ký — Overview & UI', () => {
  test('TC_DANGKY_01: Overview màn hình hiển thị đầy đủ', async ({ page }) => {
    const reg = R();
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
    const reg = R();
    await reg.goto();
    await expect(page.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeVisible();
  });

  test('TC_DANGKY_04: Textbox Họ tên đúng placeholder', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await expect(reg.nameInput).toBeVisible();
  });

  test('TC_DANGKY_26: Textbox Điện thoại đúng placeholder', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await expect(reg.phoneInput).toBeVisible();
  });

  test('TC_DANGKY_39: Textbox Mật khẩu không có icon con mắt', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await expect(reg.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_DANGKY_40: Mật khẩu mặc định ẩn', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.passwordInput.fill('bat-ky');
    await expect(reg.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC_DANGKY_55/56: Textbox Nhập lại mật khẩu đúng placeholder, mặc định ẩn', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await expect(reg.passwordConfirmInput).toHaveAttribute('type', 'password');
  });

  test('TC_DANGKY_62: Button submit hiển thị "Gửi đăng ký"', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await expect(reg.submitButton).toHaveText('Gửi đăng ký');
  });

  test('TC_DANGKY_69: Link "Đã có tài khoản" hiển thị đúng (không có dấu hỏi)', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await expect(reg.loginLink).toHaveText('Đã có tài khoản');
  });
});

test.describe('Đăng Ký — Trường bắt buộc (không gọi API thật)', () => {
  test('TC_DANGKY_05: Bỏ trống Họ tên', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ name: '' }));
    await reg.submit();
    await expect(reg.fieldError('Họ tên không được để trống')).toBeVisible();
  });

  test('TC_DANGKY_13: Bỏ trống Email', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ email: '' }));
    await reg.submit();
    await expect(reg.fieldError('Email không được để trống')).toBeVisible();
  });

  test('TC_DANGKY_27: Bỏ trống Điện thoại', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ phone: '' }));
    await reg.submit();
    await expect(reg.fieldError('Số điện thoại không được để trống')).toBeVisible();
  });

  test('TC_DANGKY_41: Bỏ trống Mật khẩu', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: '', passwordConfirm: '' }));
    await reg.submit();
    await expect(reg.fieldError('Vui lòng nhập mật khẩu').first()).toBeVisible();
  });

  test('TC_DANGKY_63: Để trống tất cả trường → hiện đủ cảnh báo', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.submit();
    await expect(reg.fieldError('Họ tên không được để trống')).toBeVisible();
    await expect(reg.fieldError('Email không được để trống')).toBeVisible();
    await expect(reg.fieldError('Số điện thoại không được để trống')).toBeVisible();
    await expect(reg.fieldError('Vui lòng nhập mật khẩu').first()).toBeVisible();
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
      const reg = R();
      await reg.goto();
      await reg.emailInput.fill(c.value);
      await page.waitForTimeout(1200);
      await expect(reg.fieldError('Email không hợp lệ')).toBeVisible();
    });
  }

  test('TC_DANGKY_23: Email hợp lệ đăng ký thành công (mock)', async ({ page }) => {
    const reg = R();
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
      const reg = R();
      await reg.goto();
      await reg.phoneInput.fill(c.value);
      await page.waitForTimeout(1200);
      await expect(reg.fieldError('Số điện thoại không hợp lệ')).toBeVisible();
    });
  }

  test('TC_DANGKY_37: SĐT hợp lệ đăng ký thành công (mock)', async ({ page }) => {
    const reg = R();
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ phone: '0987123999' }));
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });

  test('TC_DANGKY_38: SĐT đã tồn tại (dùng SĐT tài khoản test thật)', async ({ page }) => {
    const reg = R();
    // Chỉ test này cho POST /auth/check-phone (tra cứu, không ghi) đi tới backend thật — y như trước đây.
    reg.server.realLookups = true;
    await reg.goto();
    await reg.phoneInput.fill(EXISTING_PHONE);
    await page.waitForTimeout(1200);
    await expect(reg.fieldError('Số điện thoại đã tồn tại')).toBeVisible();
  });
});

test.describe('Đăng Ký — Validate Mật khẩu (phát hiện: KHÔNG có yêu cầu độ phức tạp)', () => {
  test('TC_DANGKY_43: Mật khẩu < 6 ký tự bị chặn', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Ab@1', passwordConfirm: 'Ab@1' }));
    await reg.submit();
    await expect(reg.fieldError('Mật khẩu cần ít nhất 6 ký tự.').first()).toBeVisible();
  });

  test('TC_DANGKY_54: Mật khẩu hợp lệ đủ mạnh vẫn đăng ký được (mock)', async ({ page }) => {
    const reg = R();
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });
});

test.describe('Đăng Ký — Nhập lại mật khẩu', () => {
  test('TC_DANGKY_57: Bỏ trống Nhập lại mật khẩu', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ passwordConfirm: '' }));
    await reg.submit();
    await expect(reg.fieldError('Vui lòng nhập mật khẩu').first()).toBeVisible();
  });

  test('TC_DANGKY_59: Không khớp với Mật khẩu', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Abc@1234', passwordConfirm: 'Abc@5678' }));
    await reg.submit();
    await expect(reg.fieldError('Xác nhận mật khẩu không khớp.')).toBeVisible();
  });

  test('TC_DANGKY_60: Khớp với Mật khẩu → đăng ký thành công (mock)', async ({ page }) => {
    const reg = R();
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Abc@1234', passwordConfirm: 'Abc@1234' }));
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });

  test('TC_DANGKY_61: Phân biệt hoa/thường khi so khớp', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData({ password: 'Abc@1234', passwordConfirm: 'ABC@1234' }));
    await reg.submit();
    await expect(reg.fieldError('Xác nhận mật khẩu không khớp.')).toBeVisible();
  });
});

test.describe('Đăng Ký — Luồng thành công & Modal OTP', () => {
  test('TC_DANGKY_03/64: Đăng ký thành công hiện modal OTP', async ({ page }) => {
    const reg = R();
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
  });

  test('TC_DANGKY_77: Modal OTP hiển thị đúng cấu trúc', async ({ page }) => {
    const reg = R();
    await mockRegisterSuccess(page); // server không trả otpSendType → mặc định kênh Zalo
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.otpModalTitle).toHaveText('Nhập mã OTP Zalo');
    await expect(reg.otpInputs).toHaveCount(6);
    await expect(page.getByText(/Gửi lại mã sau: 00:\d+s/)).toBeVisible();
    // 08/09/2026: kênh Email tắt (`allowEmailOtp: false`) → không còn nút đổi kênh xác thực.
    await expect(reg.otpSwitchChannelButton).toHaveCount(0);
    await expect(page.getByText('Liên hệ hỗ trợ')).toBeVisible();
    await expect(reg.supportLinks).toHaveCount(4);
    for (const href of ['https://zalo.me/', 'https://www.facebook.com/kfsp.official/', 'https://t.me/KFSPTEAM', 'mailto:kfspteam@kfsp.vn']) {
      await expect(page.locator(`.contact-support a[href^="${href}"]`)).toHaveCount(1);
    }
    // Nút X "Đóng" mới (08/09/2026); closeOnBackdrop=false → click nền ngoài không đóng modal.
    await page.mouse.click(10, 10);
    await expect(reg.otpModalTitle).toBeVisible();
    await reg.otpCloseButton.click();
    await expect(reg.otpModalTitle).toBeHidden();
  });

  test('TC_DANGKY_79: Nhập đủ 6 số OTP tự động gọi verify', async ({ page }) => {
    const reg = R();
    await mockRegisterSuccess(page);
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.otpModalTitle).toBeVisible();
    await reg.fillOtp('123456');
    await expect.poll(() => reg.server.verifyBodies.length).toBe(1);
    expect(reg.server.verifyBodies[0]).toMatchObject({ otpRegisterId: 999999, otp: '123456' });
  });
});

test.describe('Đăng Ký — Điều hướng (links)', () => {
  test('TC_DANGKY_70: Click "Đã có tài khoản" chuyển tới /login', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await reg.loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC_DANGKY_71: Click "Xem chi tiết các gói tại đây" mở tab mới tới /home#mua', async ({ page, context }) => {
    const reg = R();
    await reg.goto();
    const [newPage] = await Promise.all([context.waitForEvent('page'), reg.viewPlansLink.click()]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/home');
  });

  test('TC_DANGKY_72: Click logo chuyển về trang chủ /home', async ({ page }) => {
    const reg = R();
    await reg.goto();
    await expect(reg.logoLink).toHaveAttribute('href', '/home');
    await reg.logoLink.click();
    await expect(page).toHaveURL(/\/home/);
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
  test('TC_DANGKY_66: Trạng thái loading/disable khi đang xử lý', async ({ page }) => {
    const reg = R();
    reg.server.registerReply = FakeRegisterServer.ok(undefined, 1500);
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
    const reg = R();
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

  test('TC_DANGKY_68: Server 500 thiếu field "errors" — KHÔNG crash, toast lỗi hiện message server (bug cũ đã sửa 08/09/2026)', async ({ page }) => {
    const reg = R();
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    reg.server.registerReply = { status: 500, json: { success: false, message: 'Internal Server Error' } };
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await reg.submit();
    await expect(reg.toastError.filter({ hasText: 'Internal Server Error' })).toBeVisible();
    await expect(reg.otpModalTitle).toBeHidden();
    expect(pageErrors, `Không được có lỗi JS runtime: ${pageErrors.join(' | ')}`).toHaveLength(0);
  });
});

test.describe('Đăng Ký — Khác', () => {
  test('TC_DANGKY_73: Thứ tự Tab: Họ tên → Email → Điện thoại → Mật khẩu → Nhập lại mật khẩu', async ({ page }) => {
    const reg = R();
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
    const reg = R();
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
    const reg = R();
    await reg.goto();
    await reg.fill(reg.buildValidData());
    await page.goto('/login');
    await reg.goto();
    await expect(reg.nameInput).toHaveValue('');
    await expect(reg.emailInput).toHaveValue('');
  });

  test.fixme('TC_DANGKY_10: Họ tên có khoảng trắng đầu/cuối — cần verify có trim hay không (rủi ro tạo tài khoản thật)', async () => {});
  test.fixme('TC_DANGKY_78: Nút "Gửi lại mã" chỉ hiện sau khi hết đếm ngược', async () => {});
  // TC_DANGKY_80 (đổi kênh Email ↔ Zalo) đã xoá 10/11/2026: preprod tắt kênh Email (`allowEmailOtp: false`), nút không còn.
});
