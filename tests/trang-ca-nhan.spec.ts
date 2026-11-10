import { test, expect, Page, Browser } from '@playwright/test';
import { ProfilePage, fakeProfile, dayOffset, dayLabel, refLog } from '../pages/ProfilePage';
import { PREV2_BASE_URL } from '../pages/Prev2Session';

/**
 * Trang cá nhân + Đổi mật khẩu — testcases/trang-ca-nhan.md. Chạy trên prev2 (bản build preprod mới nhất):
 *   npx playwright test tests/trang-ca-nhan.spec.ts --project=chromium --workers=2
 * ⚠️ prev2 gọi backend production: mọi API của trang đi qua `FakeProfileServer`, mọi lệnh ghi khác bị huỷ —
 * xem đầu pages/ProfilePage.ts. Không test nào được gửi đổi mật khẩu / cập nhật hồ sơ / đổi ảnh thật.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1440, height: 900 } });
test.setTimeout(120_000);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sau mỗi test: không có lệnh ghi nào lọt tới 3 endpoint nguy hiểm mà không qua máy chủ giả (máy chủ giả luôn chặn). */
let current: ProfilePage | undefined;
test.afterEach(async () => {
  if (!current) return;
  for (const w of current.server.blockedWrites) {
    expect(w, 'lệnh ghi lạ bị chặn').not.toMatch(/passwd|update-info|chavatar/);
  }
  current = undefined;
});
function newProfile(page: Page) {
  current = new ProfilePage(page);
  return current;
}

/** Ảnh PNG `w`×`h` vẽ bằng canvas của trang (không cần file mẫu). */
async function pngBuffer(page: Page, w: number, h: number): Promise<Buffer> {
  const b64 = await page.evaluate(([w, h]) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#7b3aec'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.fillRect(w / 4, h / 4, w / 2, h / 2);
    return c.toDataURL('image/png').split(',')[1];
  }, [w, h]);
  return Buffer.from(b64, 'base64');
}

/** Chiều rộng/cao ảnh JPEG nằm trong body multipart (đọc marker SOF0/SOF2). */
function jpegSize(body: Buffer): { w: number; h: number } | null {
  for (let i = 0; i < body.length - 9; i++) {
    if (body[i] === 0xff && (body[i + 1] === 0xc0 || body[i + 1] === 0xc2)) {
      return { h: body.readUInt16BE(i + 5), w: body.readUInt16BE(i + 7) };
    }
  }
  return null;
}

async function anonymousGoto(browser: Browser, path: string): Promise<string> {
  const ctx = await browser.newContext({ baseURL: PREV2_BASE_URL });
  const page = await ctx.newPage();
  await page.route(/^https:\/\/(api2|users)\.kfsp\.vn\//, (r) => (r.request().method() === 'GET' ? r.fallback() : r.abort()));
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  const url = page.url();
  await ctx.close();
  return url;
}

// =====================================================================================================
test.describe('Trang cá nhân — hiển thị & điều hướng', () => {
  test('TC_PROFILE_01: Mở "Thông tin người dùng" từ menu tài khoản trên header → /profile', async ({ page }) => {
    const p = newProfile(page);
    await p.open({ path: '/trung-tam-thong-bao' });
    await p.openAccountMenu();
    await expect(p.accountMenuItem('Thông tin người dùng')).toBeVisible();
    await p.accountMenuItem('Thông tin người dùng').click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(p.identityCard).toBeVisible();
    await expect(p.planCard).toBeVisible();
    await expect(p.infoTitle).toBeVisible();
    await expect(p.changePasswordLink).toBeVisible();
  });

  test('TC_PROFILE_02: Chưa đăng nhập mở /profile → chuyển về trang đăng nhập', async ({ browser }) => {
    expect(await anonymousGoto(browser, '/profile')).toMatch(/\/login/);
  });

  test('TC_PROFILE_03: Thẻ danh tính — ảnh đại diện, tên, huy hiệu gói, email', async ({ page }) => {
    const p = newProfile(page);
    await p.openProfile();
    const avatar = await page.evaluate(() => localStorage.getItem('avatar'));
    if (avatar) await expect(p.avatarImg).toHaveAttribute('src', avatar);
    await expect(p.avatarButton).toBeVisible();
    await expect(p.avatarButton).toBeEnabled();
    await expect(p.displayName).toHaveText('Nhà đầu tư Test');
    await expect(p.badge).toBeVisible();
    await expect(p.identityEmail).toHaveText('autotest@example.com');
  });

  test('TC_PROFILE_04: Chưa có ảnh → chữ cái đầu của tên; chưa đặt tên → "Chưa đặt tên" + chữ cái đầu email', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ name: 'bình an' });
    await p.openProfile();
    await page.evaluate(() => localStorage.removeItem('avatar'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(p.avatarInitial).toHaveText('B');
    await expect(p.avatarImg).toHaveCount(0);

    p.server.profile = fakeProfile({ name: '', email: 'zed@example.com' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(p.displayName).toHaveText('Chưa đặt tên');
    await expect(p.avatarInitial).toHaveText('Z');
    await expect(p.rowValue('Tên')).toHaveText('Chưa cập nhật');
  });

  test('TC_PROFILE_05: Thẻ "Thông tin cá nhân" ở chế độ xem — 5 dòng nhãn/giá trị, không có ô nhập', async ({ page }) => {
    const p = newProfile(page);
    await p.openProfile();
    await expect(p.rowValue('Tên')).toHaveText('Nhà đầu tư Test');
    await expect(p.rowValue('Điện thoại')).toHaveText('0900000001');
    await expect(p.rowValue('Email')).toHaveText('autotest@example.com');
    await expect(p.rowValue('Địa chỉ')).toHaveText('Hà Nội');
    await expect(p.rowValue('Mã giới thiệu')).toContainText('AUTO01');
    await expect(p.copyButton).toHaveAttribute('aria-label', 'Sao chép mã giới thiệu');
    await expect(p.infoCard.locator('input')).toHaveCount(0);
    await expect(p.editButton).toBeVisible();
    await expect(p.saveButton).toHaveCount(0);
    await expect(p.changePasswordLink).toHaveAttribute('href', '/change_password');
  });

  test('TC_PROFILE_06: Trường trống hiện "Chưa cập nhật"; không có mã giới thiệu thì ẩn dòng đó', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ phone: '', address: '', personal_reference_code: '' });
    await p.openProfile();
    await expect(p.rowValue('Điện thoại')).toHaveText('Chưa cập nhật');
    await expect(p.rowValue('Điện thoại')).toHaveClass(/pf-trong/);
    await expect(p.rowValue('Địa chỉ')).toHaveText('Chưa cập nhật');
    await expect(p.row('Mã giới thiệu')).toHaveCount(0);
  });

  test('TC_PROFILE_07: Dữ liệu thật của tài khoản trả phí — email đúng định dạng ở 2 chỗ, thẻ gói có số ngày + mốc ngày', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = null; // đọc /edit thật (chỉ đọc)
    await p.openProfile();
    // Tài khoản đăng nhập bằng SĐT (TEST_USER_EMAIL là số điện thoại) → chỉ kiểm tra định dạng, không ghi dữ liệu thật vào test.
    await expect(p.identityEmail).toHaveText(EMAIL_RE);
    await expect(p.rowValue('Email')).toHaveText((await p.identityEmail.innerText()).trim());
    await expect(p.planName).not.toBeEmpty();
    await expect(p.planButton).toHaveText(/Gia hạn \/ Nâng cấp/);
    await expect(p.planDays).toHaveText(/^\d+$/);
    await expect(p.planDates.last()).toHaveText(/^\d{2}\/\d{2}\/\d{4}$/);
    await expect(p.planBar).toHaveAttribute('aria-label', /^Đã dùng \d{1,3}% thời gian gói$/);
  });
});

// =====================================================================================================
test.describe('Trang cá nhân — thẻ gói', () => {
  test('TC_PROFILE_08: Gói trả phí còn hạn — tên gói, "Gia hạn / Nâng cấp", số ngày còn lại, thanh % đã dùng, 2 mốc ngày', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ activate_date: dayOffset(-30), expiry_date: dayOffset(70) });
    await p.openProfile();
    await expect(p.planName).toHaveText('Hội viên Bạc');
    await expect(p.planButton).toHaveText('Gia hạn / Nâng cấp');
    await expect(p.planLabel).toHaveText('Thời gian còn lại');
    await expect(p.planDays).toHaveText('70');
    await expect(p.planCard.locator('.pf-goi-so-don-vi')).toHaveText('ngày');
    await expect(p.planBar).toHaveAttribute('aria-label', 'Đã dùng 30% thời gian gói');
    await expect(p.planBarFill).toHaveAttribute('style', /width: 30%/);
    await expect(p.planDates).toHaveText([dayLabel(-30), dayLabel(70)]);
  });

  test('TC_PROFILE_09: Tài khoản dùng thử — thẻ ghi "Dùng thử" (không ghi tên gói), nút "Nâng cấp gói"', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ status: 'Trial', plan_name: 'Hội viên Vàng', activate_date: dayOffset(-2), expiry_date: dayOffset(5) });
    await p.openProfile();
    await expect(p.planName).toHaveText('Dùng thử');
    await expect(p.planButton).toHaveText('Nâng cấp gói');
    await expect(p.planDays).toHaveText('5');
  });

  test('TC_PROFILE_10: Gói đã hết hạn — "Hết hạn", thanh đầy 100%, nút "Nâng cấp gói"', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ activate_date: dayOffset(-40), expiry_date: dayOffset(-3) });
    await p.openProfile();
    await expect(p.planBigText).toHaveText('Hết hạn');
    await expect(p.planBar).toHaveAttribute('aria-label', 'Đã dùng 100% thời gian gói');
    await expect(p.planButton).toHaveText('Nâng cấp gói');
    await expect(p.planDates.last()).toHaveText(dayLabel(-3));
  });

  test('TC_PROFILE_11: Gói hết hạn trong hôm nay — "Hết hạn hôm nay", vẫn là "Gia hạn / Nâng cấp"', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ activate_date: dayOffset(-30), expiry_date: dayOffset(0).replace('10:00:00', '23:59:00') });
    await p.openProfile();
    await expect(p.planBigText).toHaveText('Hết hạn hôm nay');
    await expect(p.planButton).toHaveText('Gia hạn / Nâng cấp');
  });

  test('TC_PROFILE_12: Gói vĩnh viễn (forever = 2) — "Không giới hạn", không nút, không thanh thời gian', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ forever: 2, plan_name: 'Hội viên Kim Cương' });
    await p.openProfile();
    await expect(p.planName).toHaveText('Hội viên Kim Cương');
    await expect(p.planBigText).toHaveText('Không giới hạn');
    await expect(p.planButton).toHaveCount(0);
    await expect(p.planBar).toHaveCount(0);
  });

  test('TC_PROFILE_13: Tài khoản miễn phí (không có ngày hết hạn) — "Hội viên Miễn phí", "Gói hiện tại · Miễn phí", không thanh', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = fakeProfile({ plan_name: '', status: 'Free', activate_date: null, expiry_date: null });
    await p.openProfile();
    await expect(p.planName).toHaveText('Hội viên Miễn phí');
    await expect(p.planLabel).toHaveText('Gói hiện tại');
    await expect(p.planBigText).toHaveText('Miễn phí');
    await expect(p.planButton).toHaveText('Nâng cấp gói');
    await expect(p.planBar).toHaveCount(0);
    await expect(p.badge).toHaveCount(0);
  });

  test('TC_PROFILE_14: Bấm nút trên thẻ gói → mở popup "Chọn dịch vụ"', async ({ page }) => {
    const p = newProfile(page);
    await p.openProfile();
    await p.planButton.click();
    await expect(p.packageModal).toBeVisible();
  });

  test('TC_PROFILE_15: Tài khoản Free thật — thẻ gói có nút "Nâng cấp gói", không có "Gia hạn"', async ({ page }) => {
    const p = newProfile(page);
    p.server.profile = null; // đọc /edit thật
    await p.openProfile({ account: 'free' });
    await expect(p.identityEmail).toHaveText(EMAIL_RE);
    await expect(p.planButton).toHaveText('Nâng cấp gói');
    await expect(p.planName).toHaveText(/Hội viên Miễn phí|Dùng thử/);
  });
});

// =====================================================================================================
test.describe('Trang cá nhân — sửa thông tin', () => {
  test('TC_PROFILE_16: Bấm bút chì → ô nhập Tên/Điện thoại/Địa chỉ, Email và Mã giới thiệu chỉ đọc, focus ô Tên', async ({ page }) => {
    const p = newProfile(page);
    await p.openProfile();
    await p.editButton.click();
    await expect(p.nameInput).toBeFocused();
    await expect(p.nameInput).toHaveValue('Nhà đầu tư Test');
    await expect(p.nameInput).toHaveAttribute('placeholder', 'Nhập tên hiển thị');
    await expect(p.phoneInput).toHaveValue('0900000001');
    await expect(p.phoneInput).toHaveAttribute('type', 'tel');
    await expect(p.phoneInput).toHaveAttribute('placeholder', 'Nhập số điện thoại');
    await expect(p.addressInput).toHaveValue('Hà Nội');
    await expect(p.addressInput).toHaveAttribute('placeholder', 'Nhập địa chỉ');
    await expect(p.row('Email').locator('input')).toHaveCount(0);
    await expect(p.row('Mã giới thiệu').locator('input')).toHaveCount(0);
    await expect(p.editButton).toHaveCount(0);
    await expect(p.changePasswordLink).toHaveCount(0);
    await expect(p.cancelButton).toBeEnabled();
    await expect(p.saveButton).toHaveText('Lưu thay đổi');
    await expect(p.saveButton).toBeDisabled();
  });

  test('TC_PROFILE_17: "Lưu thay đổi" chỉ bật khi có thay đổi thật — thêm khoảng trắng đầu/cuối hoặc sửa rồi trả lại như cũ thì vẫn tắt', async ({ page }) => {
    const p = newProfile(page);
    await p.openProfile();
    await p.editButton.click();
    await p.nameInput.fill('  Nhà đầu tư Test   ');
    await expect(p.saveButton).toBeDisabled();
    await p.phoneInput.fill('0900000002');
    await expect(p.saveButton).toBeEnabled();
    await p.phoneInput.fill('0900000001');
    await expect(p.saveButton).toBeDisabled();
    await p.addressInput.fill('Hà Nội 2');
    await expect(p.saveButton).toBeEnabled();
  });

  test('TC_PROFILE_18: Lưu thành công → gửi đúng body (đã trim, giữ telegram), về chế độ xem với giá trị mới, không toast, tên trên header cập nhật', async ({ page }) => {
    const p = newProfile(page);
    p.server.updateMode = 'ok';
    await p.openProfile();
    await p.editButton.click();
    await p.nameInput.fill('  Tên Mới  ');
    await p.phoneInput.fill(' 0911222333 ');
    await p.addressInput.fill('TP. Hồ Chí Minh ');
    await p.saveButton.click();
    await expect(p.editButton).toBeVisible();
    expect(p.server.updates).toHaveLength(1);
    expect(p.server.updates[0]).toEqual({
      _method: 'POST', name: 'Tên Mới', phone: '0911222333', address: 'TP. Hồ Chí Minh', telegram_username: 'tg_autotest',
    });
    await expect(p.rowValue('Tên')).toHaveText('Tên Mới');
    await expect(p.rowValue('Điện thoại')).toHaveText('0911222333');
    await expect(p.rowValue('Địa chỉ')).toHaveText('TP. Hồ Chí Minh');
    await expect(p.changePasswordLink).toBeVisible();
    await expect(p.anyToast).toHaveCount(0);
    await p.openAccountMenu();
    await expect(p.accountMenuName).toHaveText('Tên Mới');
  });

  test('TC_PROFILE_19: Nhấn Enter trong ô nhập → lưu như bấm "Lưu thay đổi"', async ({ page }) => {
    const p = newProfile(page);
    p.server.updateMode = 'ok';
    await p.openProfile();
    await p.editButton.click();
    await p.addressInput.fill('Đà Nẵng');
    await p.addressInput.press('Enter');
    await expect(p.editButton).toBeVisible();
    expect(p.server.updates.map((u) => u.address)).toEqual(['Đà Nẵng']);
  });

  test('TC_PROFILE_20: "Huỷ" → trả lại giá trị cũ, thoát chế độ sửa, không gọi API', async ({ page }) => {
    const p = newProfile(page);
    await p.openProfile();
    await p.editButton.click();
    await p.nameInput.fill('Tên tạm');
    await p.phoneInput.fill('');
    await p.cancelButton.click();
    await expect(p.editButton).toBeVisible();
    await expect(p.rowValue('Tên')).toHaveText('Nhà đầu tư Test');
    await expect(p.rowValue('Điện thoại')).toHaveText('0900000001');
    expect(p.server.updates).toHaveLength(0);
    await p.editButton.click();
    await expect(p.nameInput).toHaveValue('Nhà đầu tư Test');
  });

  test('TC_PROFILE_21: Lỗi 422 theo trường → lỗi đỏ dưới đúng ô + toast "kiểm tra lại các ô báo lỗi"; gõ lại ô đó thì lỗi tắt; Huỷ xoá hết lỗi', async ({ page }) => {
    const p = newProfile(page);
    p.server.updateMode = '422';
    p.server.errorBody = { message: 'The given data was invalid.', errors: { phone: ['Số điện thoại không hợp lệ.'], name: ['Tên quá dài.'] } };
    await p.openProfile();
    await p.editButton.click();
    await p.phoneInput.fill('12');
    await p.saveButton.click();
    await expect(p.toastError).toContainText('Chưa lưu được thông tin, kiểm tra lại các ô báo lỗi.');
    await expect(p.rowError('Điện thoại')).toHaveText('Số điện thoại không hợp lệ.');
    await expect(p.rowError('Tên')).toHaveText('Tên quá dài.');
    await expect(p.phoneInput).toHaveClass(/pf-o-loi/);
    await expect(p.rowError('Địa chỉ')).toHaveCount(0);
    await expect(p.phoneInput).toHaveValue('12');
    await p.phoneInput.type('3');
    await expect(p.rowError('Điện thoại')).toHaveCount(0);
    await expect(p.rowError('Tên')).toHaveText('Tên quá dài.');
    await p.cancelButton.click();
    await p.editButton.click();
    await expect(p.rowError('Tên')).toHaveCount(0);
  });

  for (const mode of ['500', 'abort'] as const) {
    test(`TC_PROFILE_22: Lỗi máy chủ / mất mạng khi lưu → toast "vui lòng thử lại", giữ chế độ sửa và giá trị đã nhập [${mode === '500' ? '500' : 'mất mạng'}]`, async ({ page }) => {
      const p = newProfile(page);
      p.server.updateMode = mode;
      await p.openProfile();
      await p.editButton.click();
      await p.nameInput.fill('Tên chưa lưu');
      await p.saveButton.click();
      await expect(p.toastError).toContainText('Chưa lưu được thông tin, vui lòng thử lại.');
      await expect(p.nameInput).toHaveValue('Tên chưa lưu');
      await expect(p.saveButton).toBeEnabled();
      await expect(p.saveButton).toHaveText('Lưu thay đổi');
    });
  }

  test('TC_PROFILE_23: Đang lưu (máy chủ chậm) → "Đang lưu…", 2 nút khoá; bấm đúp chỉ gửi 1 lần', async ({ page }) => {
    const p = newProfile(page);
    p.server.updateMode = 'slow';
    await p.openProfile();
    await p.editButton.click();
    await p.nameInput.fill('Tên chậm');
    await p.saveButton.dblclick();
    await expect(p.saveButton).toHaveText('Đang lưu…');
    await expect(p.saveButton).toBeDisabled();
    await expect(p.cancelButton).toBeDisabled();
    await p.nameInput.press('Enter');
    await expect(p.editButton).toBeVisible({ timeout: 10000 });
    expect(p.server.updates).toHaveLength(1);
  });
});

// =====================================================================================================
test.describe('Trang cá nhân — ảnh đại diện & mã giới thiệu', () => {
  test('TC_PROFILE_25: Đổi ảnh thành công → ảnh được thu về rộng 600px dạng JPEG, gửi 1 lần; ảnh ở trang và header đổi theo', async ({ page }) => {
    const p = newProfile(page);
    p.server.avatarMode = 'ok';
    await p.openProfile();
    await expect(p.avatarInput).toHaveAttribute('accept', 'image/*');
    const png = await pngBuffer(page, 1200, 800);
    await p.avatarInput.setInputFiles({ name: 'anh.png', mimeType: 'image/png', buffer: png });
    await expect.poll(() => p.server.avatarUploads.length).toBe(1);
    const up = p.server.avatarUploads[0];
    expect(up.contentType).toMatch(/multipart\/form-data/);
    expect(up.body.toString('latin1')).toMatch(/name="file"; filename="anh\.png"[\s\S]*Content-Type: image\/jpeg/);
    expect(jpegSize(up.body)).toEqual({ w: 600, h: 400 });
    await expect.poll(() => page.evaluate(() => localStorage.getItem('avatar'))).toBe('/autotest/avatar.jpg');
    await expect(p.avatarImg).toHaveAttribute('src', '/autotest/avatar.jpg');
    await expect(p.headerAvatar).toHaveAttribute('src', '/autotest/avatar.jpg');
    await expect(p.toastError).toHaveCount(0);
  });

  test('TC_PROFILE_26: Đổi ảnh lỗi → toast "Không tải được ảnh đại diện, vui lòng thử lại.", ảnh cũ giữ nguyên', async ({ page }) => {
    const p = newProfile(page);
    p.server.avatarMode = '500';
    await p.openProfile();
    const before = await page.evaluate(() => localStorage.getItem('avatar'));
    await p.avatarInput.setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: await pngBuffer(page, 200, 200) });
    await expect(p.toastError).toContainText('Không tải được ảnh đại diện, vui lòng thử lại.');
    expect(await page.evaluate(() => localStorage.getItem('avatar'))).toBe(before);
    await expect(p.avatarButton).toBeEnabled();
  });

  test('TC_PROFILE_27: Đang tải ảnh → nút đổi ảnh bị khoá + trạng thái đang tải; xong thì mở lại', async ({ page }) => {
    const p = newProfile(page);
    p.server.avatarMode = 'slow';
    await p.openProfile();
    await p.avatarInput.setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: await pngBuffer(page, 200, 200) });
    await expect(p.avatarButton).toBeDisabled();
    await expect(p.avatarBox).toHaveClass(/pf-anh-dang-tai/);
    await expect(p.avatarButton).toBeEnabled({ timeout: 10000 });
    await expect(p.avatarBox).not.toHaveClass(/pf-anh-dang-tai/);
  });

  test('TC_PROFILE_28: Sao chép mã giới thiệu → clipboard có mã, nút đổi sang "Đã chép" rồi tự trở lại', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: PREV2_BASE_URL });
    const p = newProfile(page);
    await p.openProfile();
    await p.copyButton.click();
    await expect(p.copyButton).toHaveAttribute('aria-label', 'Đã chép mã giới thiệu');
    await expect(p.copyButton).toHaveAttribute('title', 'Đã chép');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('AUTO01');
    await expect(p.copyButton).toHaveAttribute('aria-label', 'Sao chép mã giới thiệu', { timeout: 4000 });
  });

  test('TC_PROFILE_29: Trình duyệt chặn clipboard → toast "Không sao chép được, hãy bôi đen mã và chép thủ công."', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
    });
    const p = newProfile(page);
    await p.openProfile();
    await p.copyButton.click();
    await expect(p.toastError).toContainText('Không sao chép được, hãy bôi đen mã và chép thủ công.');
    await expect(p.copyButton).toHaveAttribute('aria-label', 'Sao chép mã giới thiệu');
  });
});

// =====================================================================================================
test.describe('Trang cá nhân — popup nhật ký giới thiệu', () => {
  test('TC_PROFILE_30: Có nhật ký giới thiệu mới → popup "Thông báo" đúng 2 mẫu câu, bỏ dòng ưu đãi ≥100 và dòng đã xem; đánh dấu đã xem 1 lần; "Đóng" tắt popup', async ({ page }) => {
    const p = newProfile(page);
    p.server.referenceLogs = [
      refLog('reference_success', '01/11/2026', 'Bạn A', 1),
      refLog('active_reference_success', '02/11/2026', 'Bạn B', 2),
      refLog('reference_success', '03/11/2026', 'Bạn C', 100),
      refLog('reference_success', '04/11/2026', 'Bạn D', 1, 'Seen'),
    ];
    await p.openProfile();
    await expect(p.refModal).toBeVisible();
    await expect(p.refModal.locator('.modal-title')).toHaveText('Thông báo');
    await expect(p.refModalItems).toHaveText([
      '01/11/2026: Bạn đã giới thiệu thành công thành viên Bạn A tham gia KungFuStocksPro và nhận thêm 1 tháng sử dụng',
      '02/11/2026: Bạn đã tham gia KungFuStocksPro cùng thành viên Bạn B và nhận thêm 2 tháng sử dụng',
    ]);
    await expect(p.refModalMore).toHaveCount(0);
    await expect.poll(() => p.server.alertReferenceCalls).toBe(1);
    await p.refModalClose.click();
    await expect(p.refModal).toBeHidden();
  });

  test('TC_PROFILE_31: Hơn 3 dòng → hiện 3 dòng + "Xem thêm"; bấm → đủ dòng + "Thu gọn"; bấm lại → về 3 dòng', async ({ page }) => {
    const p = newProfile(page);
    p.server.referenceLogs = [1, 2, 3, 4, 5].map((i) => refLog('reference_success', `0${i}/11/2026`, `Bạn ${i}`, 1));
    await p.openProfile();
    await expect(p.refModalItems).toHaveCount(3);
    await expect(p.refModalMore).toHaveText('Xem thêm');
    await p.refModalMore.click();
    await expect(p.refModalItems).toHaveCount(5);
    await expect(p.refModalMore).toHaveText('Thu gọn');
    await p.refModalMore.click();
    await expect(p.refModalItems).toHaveCount(3);
  });

  test('TC_PROFILE_32: Không có nhật ký mới → không hiện popup, không gọi đánh dấu đã xem', async ({ page }) => {
    const p = newProfile(page);
    p.server.referenceLogs = [refLog('reference_success', '01/11/2026', 'Bạn A', 1, 'Seen')];
    await p.openProfile();
    await page.waitForTimeout(1500);
    await expect(p.refModal).toBeHidden();
    expect(p.server.alertReferenceCalls).toBe(0);
  });
});

// =====================================================================================================
test.describe('Đổi mật khẩu', () => {
  test('TC_PROFILE_35: Từ trang cá nhân bấm "Đổi mật khẩu" → /change_password, giao diện 3 ô mật khẩu, ô hiện tại được focus, nút gửi tắt', async ({ page }) => {
    const p = newProfile(page);
    await p.openProfile();
    await p.changePasswordLink.click();
    await expect(page).toHaveURL(/\/change_password$/);
    await expect(p.cpTitle).toBeVisible();
    await expect(p.cpBack).toBeVisible();
    await expect(p.cpCurrent).toBeFocused();
    const fields: [typeof p.cpCurrent, string, string, string][] = [
      [p.cpCurrent, 'Mật khẩu hiện tại', 'Nhập mật khẩu hiện tại', 'current-password'],
      [p.cpNew, 'Mật khẩu mới', 'Nhập mật khẩu mới', 'new-password'],
      [p.cpConfirm, 'Xác nhận mật khẩu mới', 'Nhập lại mật khẩu mới', 'new-password'],
    ];
    for (const [input, label, ph, ac] of fields) {
      await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('id', (await input.getAttribute('id'))!);
      await expect(input).toHaveAttribute('type', 'password');
      await expect(input).toHaveAttribute('placeholder', ph);
      await expect(input).toHaveAttribute('autocomplete', ac);
    }
    await expect(p.cpEye('mật khẩu hiện tại')).toHaveAttribute('aria-label', 'Hiện mật khẩu hiện tại');
    await expect(p.cpCancel).toBeEnabled();
    await expect(p.cpSubmit).toHaveText('Đổi mật khẩu');
    await expect(p.cpSubmit).toBeDisabled();
  });

  test('TC_PROFILE_36: Mở "Thay đổi mật khẩu" từ menu tài khoản ở màn khác → "Quay lại" và "Huỷ" đều về đúng màn đó', async ({ page }) => {
    const p = newProfile(page);
    await p.open({ path: '/trung-tam-thong-bao' });
    await p.openAccountMenu();
    await p.accountMenuItem('Thay đổi mật khẩu').click();
    await expect(page).toHaveURL(/\/change_password$/);
    await p.cpBack.click();
    await expect(page).toHaveURL(/\/trung-tam-thong-bao$/);
    await p.openAccountMenu();
    await p.accountMenuItem('Thay đổi mật khẩu').click();
    await expect(p.cpCancel).toBeVisible();
    await p.cpCancel.click();
    await expect(page).toHaveURL(/\/trung-tam-thong-bao$/);
  });

  test('TC_PROFILE_37: Mở thẳng link /change_password (F5) → "Quay lại" và "Huỷ" về trang cá nhân', async ({ page }) => {
    const p = newProfile(page);
    await p.openChangePassword();
    await p.cpBack.click();
    await expect(page).toHaveURL(/\/profile$/);
    await page.goto('/change_password', { waitUntil: 'domcontentloaded' });
    await p.cpCancel.click();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('TC_PROFILE_38: Nút "Đổi mật khẩu" chỉ bật khi đủ cả 3 ô', async ({ page }) => {
    const p = newProfile(page);
    await p.openChangePassword();
    await p.cpCurrent.fill('Cu@12345');
    await expect(p.cpSubmit).toBeDisabled();
    await p.cpNew.fill('Moi@12345');
    await expect(p.cpSubmit).toBeDisabled();
    await p.cpConfirm.fill('Moi@12345');
    await expect(p.cpSubmit).toBeEnabled();
    await p.cpCurrent.fill('');
    await expect(p.cpSubmit).toBeDisabled();
  });

  test('TC_PROFILE_39: Nút mắt hiện/ẩn từng ô độc lập, nhãn nút đổi "Hiện …" ↔ "Ẩn …"', async ({ page }) => {
    const p = newProfile(page);
    await p.openChangePassword();
    await p.fillPasswords('a', 'b', 'c');
    await p.cpEye('mật khẩu mới').click();
    await expect(p.cpNew).toHaveAttribute('type', 'text');
    await expect(p.cpEye('mật khẩu mới')).toHaveAttribute('aria-label', 'Ẩn mật khẩu mới');
    await expect(p.cpCurrent).toHaveAttribute('type', 'password');
    await expect(p.cpConfirm).toHaveAttribute('type', 'password');
    await p.cpEye('mật khẩu mới').click();
    await expect(p.cpNew).toHaveAttribute('type', 'password');
    await expect(p.cpEye('mật khẩu mới')).toHaveAttribute('aria-label', 'Hiện mật khẩu mới');
    await p.cpEye('mật khẩu hiện tại').click();
    await p.cpEye('xác nhận mật khẩu mới').click();
    await expect(p.cpCurrent).toHaveAttribute('type', 'text');
    await expect(p.cpConfirm).toHaveAttribute('type', 'text');
  });

  test('TC_PROFILE_40: Xác nhận không khớp → lỗi "Mật khẩu xác nhận không khớp" dưới ô xác nhận, không gọi API; gõ lại thì lỗi tắt', async ({ page }) => {
    const p = newProfile(page);
    p.server.passwdMode = 'ok';
    await p.openChangePassword();
    await p.fillPasswords('Cu@12345', 'Moi@12345', 'Moi@1234X');
    await p.cpSubmit.click();
    await expect(p.cpError(p.cpConfirm)).toHaveText('Mật khẩu xác nhận không khớp');
    await expect(p.cpConfirm).toHaveClass(/pf-o-loi/);
    await expect(p.cpError(p.cpNew)).toHaveCount(0);
    expect(p.server.passwds).toHaveLength(0);
    await expect(page).toHaveURL(/\/change_password$/);
    // Gõ ở ô khác không xoá lỗi của ô xác nhận; chỉ gõ lại ở chính ô đó mới xoá.
    await p.cpNew.press('End');
    await p.cpNew.press('Backspace');
    await expect(p.cpError(p.cpConfirm)).toHaveText('Mật khẩu xác nhận không khớp');
    await p.cpConfirm.press('End');
    await p.cpConfirm.press('Backspace');
    await expect(p.cpConfirm).toHaveValue('Moi@1234');
    await expect(p.cpError(p.cpConfirm)).toHaveCount(0);
  });

  test('TC_PROFILE_41: Đổi thành công (giả lập) → gửi đúng mật khẩu cũ/mới, về màn trước, không toast', async ({ page }) => {
    const p = newProfile(page);
    p.server.passwdMode = 'ok';
    await p.openProfile();
    await p.changePasswordLink.click();
    await p.fillPasswords('Cu@12345', 'Moi@12345', 'Moi@12345');
    await p.cpSubmit.click();
    await expect(page).toHaveURL(/\/profile$/);
    expect(p.server.passwds).toEqual([{ _method: 'POST', old_password: 'Cu@12345', new_password: 'Moi@12345' }]);
    await expect(p.anyToast).toHaveCount(0);
  });

  test('TC_PROFILE_42: Máy chủ trả lỗi kèm message → toast đúng message đó, ở lại trang, giữ các ô đã nhập', async ({ page }) => {
    const p = newProfile(page);
    p.server.passwdMode = '422';
    p.server.errorBody = { message: 'Mật khẩu hiện tại không đúng' };
    await p.openChangePassword();
    await p.fillPasswords('Sai@123', 'Moi@12345', 'Moi@12345');
    await p.cpSubmit.click();
    await expect(p.toastError).toContainText('Mật khẩu hiện tại không đúng');
    await expect(page).toHaveURL(/\/change_password$/);
    await expect(p.cpCurrent).toHaveValue('Sai@123');
    await expect(p.cpSubmit).toBeEnabled();
  });

  for (const mode of ['500', 'abort'] as const) {
    test(`TC_PROFILE_43: Lỗi không kèm message / mất mạng → toast mặc định "Chưa đổi được mật khẩu, kiểm tra lại mật khẩu hiện tại." [${mode === '500' ? '500' : 'mất mạng'}]`, async ({ page }) => {
      const p = newProfile(page);
      p.server.passwdMode = mode;
      p.server.errorBody = {};
      await p.openChangePassword();
      await p.fillPasswords('Cu@12345', 'Moi@12345', 'Moi@12345');
      await p.cpSubmit.click();
      await expect(p.toastError).toContainText('Chưa đổi được mật khẩu, kiểm tra lại mật khẩu hiện tại.');
      await expect(page).toHaveURL(/\/change_password$/);
    });
  }

  test('TC_PROFILE_44: Đang đổi (máy chủ chậm) → "Đang đổi…", 2 nút khoá; bấm đúp + Enter chỉ gửi 1 lần', async ({ page }) => {
    const p = newProfile(page);
    p.server.passwdMode = 'slow';
    await p.openProfile();
    await p.changePasswordLink.click();
    await p.fillPasswords('Cu@12345', 'Moi@12345', 'Moi@12345');
    await p.cpSubmit.dblclick();
    await expect(p.cpSubmit).toHaveText('Đang đổi…');
    await expect(p.cpSubmit).toBeDisabled();
    await expect(p.cpCancel).toBeDisabled();
    await p.cpConfirm.press('Enter');
    await expect(page).toHaveURL(/\/profile$/, { timeout: 10000 });
    expect(p.server.passwds).toHaveLength(1);
  });

  test('TC_PROFILE_45: Nhấn Enter ở ô xác nhận → gửi như bấm nút', async ({ page }) => {
    const p = newProfile(page);
    p.server.passwdMode = '500';
    await p.openChangePassword();
    await p.fillPasswords('Cu@12345', 'Moi@12345', 'Moi@12345');
    await p.cpConfirm.press('Enter');
    await expect.poll(() => p.server.passwds.length).toBe(1);
  });

  test('TC_PROFILE_47: Chưa đăng nhập mở /change_password → chuyển về trang đăng nhập', async ({ browser }) => {
    expect(await anonymousGoto(browser, '/change_password')).toMatch(/\/login/);
  });
});

// =====================================================================================================
test.describe('Màn hình hẹp', () => {
  test('TC_PROFILE_48: 375px — trang cá nhân và đổi mật khẩu không cuộn ngang; nhãn nằm trên giá trị; 2 nút chia đều chiều ngang', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const p = newProfile(page);
    await p.openProfile();
    const noHScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(await noHScroll()).toBe(true);
    const label = await p.nameRow.locator('.pf-dong-nhan').boundingBox();
    const value = await p.rowValue('Tên').boundingBox();
    expect(value!.y).toBeGreaterThan(label!.y + label!.height - 2);
    await p.editButton.click();
    const c = await p.cancelButton.boundingBox();
    const s = await p.saveButton.boundingBox();
    expect(Math.abs(c!.width - s!.width)).toBeLessThan(4);
    expect(c!.width).toBeGreaterThan(100);

    await p.cancelButton.click();
    await p.changePasswordLink.click();
    await expect(p.cpCurrent).toBeVisible();
    expect(await noHScroll()).toBe(true);
    const cc = await p.cpCancel.boundingBox();
    const cs = await p.cpSubmit.boundingBox();
    expect(Math.abs(cc!.width - cs!.width)).toBeLessThan(4);
  });
});
