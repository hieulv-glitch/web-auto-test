import { test, expect } from '@playwright/test';
import { FaAnalysisPage } from '../pages/FaAnalysisPage';
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

/** Cùng cơ chế đã dùng ở các file khác trong dự án: tự `test.skip` nếu tài khoản Free trong `.env` đăng nhập
 * lỗi, để không fail giả khi thiếu cấu hình. */
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

/** Vào thẳng tab So sánh + áp dụng workaround race condition (xem TC_PTCB_SS_02/03 và ghi chú
 * `FaAnalysisPage.waitForCompareDataReady`) để bảng CÓ dữ liệu thật, dùng cho MỌI test kiểm tra tính năng
 * (không phải test đang kiểm tra chính bug đó). */
async function gotoSoSanhReady(page: any, mack = 'VNM') {
  const fa = new FaAnalysisPage(page);
  await fa.goto({ mackQuery: mack, tabQuery: 'so-sanh' });
  await fa.waitForCompareDataReady(mack);
  return fa;
}

/** Chặn mọi API mutate của tab So sánh mặc định — `route.abort()` trừ khi 1 test cụ thể tự đăng ký lại
 * `page.route()` với cùng pattern SAU handler này (Playwright ưu tiên handler đăng ký SAU CÙNG) để
 * `route.fulfill()` giả lập thành công khi cần quan sát UI. Không có request mutate thật nào lọt ra
 * production trong toàn bộ file này. */
test.beforeEach(async ({ page }) => {
  await page.route(/\/api\/stocks\/save_compare\/(store|update|destroy)/, (route) => route.abort());
});

test.describe('Phân tích cơ bản — So sánh — Tổng quan & bug race condition', () => {
  test('TC_PTCB_SS_01: Overview tab So sánh (sau khi bảng đã có dữ liệu)', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await expect(fa.btnMoMau).toBeVisible();
    await expect(fa.btnLuuMau).toBeVisible();
    await expect(fa.btnThemMa).toBeVisible();
    for (const col of ['Thông tin', 'Đơn vị', 'Biểu đồ', 'Chỉ số ngành', 'VNM']) {
      await expect(fa.compareTableHeaderCells.filter({ hasText: col }), `Cột "${col}" phải hiển thị`).toBeVisible();
    }
    const rowCount = await fa.compareTableRows.count();
    expect(rowCount, 'Bảng phải có dữ liệu thật').toBeGreaterThan(0);
    await expect(fa.compareTableRows.first()).toContainText('Cập nhật đến');
  });

  // ⚠️ BUG THẬT đo được qua automation — xem phân tích đầy đủ ở đầu testcases/phan-tich-co-ban-so-sanh.md và
  // ghi chú trong FaAnalysisPage. Deep-link (1 lượt page.goto đầy đủ, giống mọi test khác trong dự án) thẳng
  // vào tab So sánh khiến `Compare.getAll()` tính `type_mack = ""` (đọc `list_mack_company` trước khi
  // TheContainer.getAllMack() kịp nạp) → `items_table` trả về [] MÃI MÃI. Test cố ý KHÔNG dùng
  // `waitForCompareDataReady()` ở đây để quan sát đúng hành vi lỗi gốc.
  test('TC_PTCB_SS_02: [BUG] Deep-link thẳng vào tab So sánh khiến bảng dữ liệu trống vĩnh viễn', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });

    await page.waitForTimeout(20000);

    for (const col of ['Thông tin', 'Đơn vị', 'VNM']) {
      await expect(fa.compareTableHeaderCells.filter({ hasText: col }), `Header cột "${col}" vẫn hiển thị bình thường`).toBeVisible();
    }
    await expect(
      fa.compareTableRows,
      'Hành vi thật (bug): <tbody> trống hoàn toàn dù đã chờ 20 giây, KHÔNG tự phục hồi'
    ).toHaveCount(0);
  });

  test('TC_PTCB_SS_03: Đổi mã CK giúp bảng tự phục hồi sau bug TC_PTCB_SS_02', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });
    await page.waitForTimeout(5000);
    await expect(fa.compareTableRows, 'Xác nhận lại bug trước khi test cơ chế phục hồi').toHaveCount(0);

    await fa.searchInput.fill('VNM');
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().click();

    await expect(fa.compareTableRows.first(), 'Bảng phải tự phục hồi sau khi đổi mã CK qua search').toBeVisible({ timeout: 15000 });
    const rowCount = await fa.compareTableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

test.describe('Phân tích cơ bản — So sánh — Bảng dữ liệu', () => {
  test('TC_PTCB_SS_04: Click tên mã ở header mở modal biểu đồ TradingView dùng chung toàn site', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await fa.compareColumnHeader('VNM').click();
    await page.waitForTimeout(600);

    await expect(page.getByRole('dialog')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('TC_PTCB_SS_05: Giới hạn 6 dòng + block nâng cấp gói hội viên với tài khoản Free', async ({ page }) => {
    await loginFreeOrSkip(page);
    const fa = await gotoSoSanhReady(page);

    const rowCount = await fa.compareTableRows.count();
    expect(rowCount, 'Tối đa 6 dòng dữ liệu + 1 dòng UpdateRequire').toBeLessThanOrEqual(7);
    await expect(fa.freeUpgradeBlock).toHaveCount(1);
    // Scope trong freeUpgradeBlock — có 1 banner nâng cấp KHÁC (câu hơi khác, kết thúc bằng dấu chấm) tồn tại
    // ở nơi khác trong DOM trang này gây strict-mode violation nếu search toàn `page`.
    await expect(fa.freeUpgradeBlock.getByText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này')).toBeVisible();
  });
});

test.describe('Phân tích cơ bản — So sánh — Modal "Thêm mã"', () => {
  test('TC_PTCB_SS_06: Mở modal "Thêm mã" hiển thị đúng cấu trúc', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await expect(fa.addMackModal).toBeVisible();
    await expect(fa.addMackModal.getByRole('heading', { name: 'Nhập dữ liệu' })).toBeVisible();
    await expect(fa.addMackModalInput).toBeVisible();
    await expect(fa.addMackModal.getByText('Danh sách mã')).toBeVisible();
    await expect(fa.addMackModalListRows.filter({ hasText: 'VNM' })).toBeVisible();
    await expect(fa.addMackModal.getByText(/khác ngành hệ thống sẽ không hiển thị/)).toBeVisible();
    await expect(fa.addMackModalCloseBtn).toBeVisible();
    await expect(fa.addMackModalSaveBtn).toBeVisible();
  });

  test('TC_PTCB_SS_07: Gõ mã trong modal hiện đúng gợi ý', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('fpt');
    await expect(fa.addMackModalSuggestions.filter({ hasText: 'FPT' }).first()).toBeVisible();
  });

  test('TC_PTCB_SS_08: Gõ mã không tồn tại trong modal không ra gợi ý nào', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('ZZZZZZ999');
    await page.waitForTimeout(400);
    await expect(fa.addMackModalSuggestions).toHaveCount(0);
  });

  test('TC_PTCB_SS_09: Chọn gợi ý thêm mã vào "Danh sách mã"', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('fpt');
    await fa.addMackModalSuggestions.filter({ hasText: 'FPT' }).first().click();

    await expect(fa.addMackModalListRows.filter({ hasText: 'FPT' })).toBeVisible();
    await expect(fa.addMackModalInput).toHaveValue('');
  });

  test('TC_PTCB_SS_10: Không cho thêm trùng mã đã có trong Danh sách mã', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('vnm');
    await expect(fa.addMackModalSuggestions.filter({ hasText: 'VNM' }).first()).toBeVisible();
    await fa.addMackModalSuggestions.filter({ hasText: 'VNM' }).first().click();

    await expect(fa.addMackModalListRows.filter({ hasText: 'VNM' }), 'Không được thêm trùng mã đang xem').toHaveCount(1);
  });

  test('TC_PTCB_SS_11: Xoá mã khỏi Danh sách mã bằng icon "✕"', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('fpt');
    await fa.addMackModalSuggestions.filter({ hasText: 'FPT' }).first().click();
    await expect(fa.addMackModalListRows.filter({ hasText: 'FPT' })).toBeVisible();

    await fa.addMackModalRemoveIcon('FPT').click();
    await expect(fa.addMackModalListRows.filter({ hasText: 'FPT' })).toHaveCount(0);
  });

  test('TC_PTCB_SS_12: Mã đang xem trong Danh sách mã không có icon xoá (khác mã đã thêm)', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('fpt');
    await fa.addMackModalSuggestions.filter({ hasText: 'FPT' }).first().click();

    const currentMackRow = fa.addMackModalListRows.filter({ hasText: 'VNM' });
    const addedMackRow = fa.addMackModalListRows.filter({ hasText: 'FPT' });
    const currentHandleCount = await currentMackRow.locator('.handle').count();
    const addedHandleCount = await addedMackRow.locator('.handle').count();
    expect(
      addedHandleCount,
      'Dòng mã đã thêm (FPT) phải có nhiều icon ".handle" hơn dòng mã đang xem (VNM) — icon xoá thêm vào cuối'
    ).toBeGreaterThan(currentHandleCount);
  });

  test('TC_PTCB_SS_13: Nhấn "Lưu" trong modal áp dụng đúng danh sách mã mới vào bảng chính', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);
    await expect(fa.compareTableHeaderCells.filter({ hasText: 'Biểu đồ' })).toBeVisible();

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('fpt');
    await fa.addMackModalSuggestions.filter({ hasText: 'FPT' }).first().click();
    await fa.addMackModalSaveBtn.click();
    await page.waitForTimeout(2500);

    await expect(fa.addMackModal).toHaveCount(0);
    await expect(fa.compareTableHeaderCells.filter({ hasText: 'FPT' })).toBeVisible();
    await expect(
      fa.compareTableHeaderCells.filter({ hasText: 'Biểu đồ' }),
      'FPT (công nghệ) khác ngành VNM (thực phẩm) → cột "Biểu đồ" phải ẩn'
    ).toHaveCount(0);
    await expect(fa.compareTableHeaderCells.filter({ hasText: 'Chỉ số ngành' })).toHaveCount(0);
  });

  test('TC_PTCB_SS_14: [Phát hiện] "Đóng" (không Lưu) vẫn giữ thay đổi khi mở lại modal', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('fpt');
    await fa.addMackModalSuggestions.filter({ hasText: 'FPT' }).first().click();
    await fa.addMackModalCloseBtn.click();
    await expect(fa.addMackModal).toHaveCount(0);

    await expect(fa.compareTableHeaderCells.filter({ hasText: 'FPT' }), 'Bảng chính KHÔNG đổi vì chưa bấm Lưu').toHaveCount(0);

    await fa.btnThemMa.click();
    await expect(
      fa.addMackModalListRows.filter({ hasText: 'FPT' }),
      'Hành vi thật: "Đóng" không huỷ thay đổi — FPT vẫn còn trong Danh sách mã khi mở lại modal'
    ).toBeVisible();
  });

  // ⚠️ `test.fixme`: vuedraggable/Sortable.js không dùng chuẩn HTML5 Drag & Drop API — Playwright mô phỏng bằng
  // mouse.down/move/up cần nhiều bước nhỏ (steps) để trigger đúng sự kiện của thư viện này, chưa thử nghiệm đủ
  // để đảm bảo ổn định (cùng pattern đã ghi nhận ở TC_BANGGIA_37 — kéo-thả bảng giá). Xem TRACKER.md.
  test.fixme('TC_PTCB_SS_15: Kéo-thả sắp xếp lại thứ tự mã trong Danh sách mã', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);
    await fa.btnThemMa.click();
    await fa.addMackModalInput.fill('fpt');
    await fa.addMackModalSuggestions.filter({ hasText: 'FPT' }).first().click();
    // TODO: mô phỏng kéo-thả dòng FPT lên trên dòng khác trong `<draggable>` (vuedraggable/Sortable.js) và xác
    // nhận thứ tự trong `addMackModalListRows` đổi đúng theo thao tác kéo.
  });
});

test.describe('Phân tích cơ bản — So sánh — "Lưu mẫu" / "Mở mẫu"', () => {
  test('TC_PTCB_SS_16: Click "Lưu mẫu" lần đầu (chưa chọn mẫu nào) mở modal "Thêm mẫu mới"', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnLuuMau.click();
    await expect(fa.addTemplateModal).toBeVisible();
    await expect(fa.addTemplateNameInput).toBeVisible();
  });

  test('TC_PTCB_SS_17: "Thêm mẫu mới" — để trống tên báo lỗi', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    let storeCalled = false;
    await page.route(/save_compare\/store/, (route) => {
      storeCalled = true;
      route.abort();
    });

    await fa.btnLuuMau.click();
    await fa.addTemplateSubmitBtn.click();

    await expect(page.getByText('Bạn cần nhập nội dung')).toBeVisible();
    await expect(fa.addTemplateModal, 'Modal không đóng khi lỗi validate').toBeVisible();
    expect(storeCalled, 'Không được gọi API khi tên rỗng').toBe(false);
  });

  test('TC_PTCB_SS_18: "Thêm mẫu mới" — tên trùng báo lỗi', async ({ page }) => {
    await loginFirst(page);
    // Mock get-templates TRƯỚC khi goto() — getList() chỉ chạy 1 lần trong created().
    await page.route(/save_compare\/get-templates/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, label: 'Mẫu test A', list_mack: JSON.stringify([{ mack: 'VNM' }]) }]),
      })
    );
    let storeCalled = false;
    await page.route(/save_compare\/store/, (route) => {
      storeCalled = true;
      route.abort();
    });
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });
    await fa.waitForCompareDataReady('VNM');

    await fa.btnLuuMau.click();
    await fa.addTemplateNameInput.fill('Mẫu test A');
    await fa.addTemplateSubmitBtn.click();

    await expect(page.getByText('Tên mẫu đã tồn tại!')).toBeVisible();
    expect(storeCalled, 'Không được gọi API khi tên trùng').toBe(false);
  });

  test('TC_PTCB_SS_19: Lưu mẫu mới thành công (mock API, không ghi dữ liệu thật)', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await page.route(/save_compare\/store/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 999, label: '[TEST] Mẫu tạm', list_mack: JSON.stringify([{ mack: 'VNM' }]) }),
      })
    );

    await fa.btnLuuMau.click();
    await fa.addTemplateNameInput.fill('[TEST] Mẫu tạm');
    await fa.addTemplateSubmitBtn.click();

    await expect(page.getByText('Thêm mẫu mới thành công')).toBeVisible();
    await expect(fa.addTemplateModal).toHaveCount(0);
    await expect(fa.selectedTemplateLabel).toContainText('[TEST] Mẫu tạm');
    await expect(fa.btnBoChonTemplate).toBeVisible();
  });

  test('TC_PTCB_SS_20: Click "Mở mẫu" — trạng thái rỗng thật (tài khoản test hiện chưa có mẫu nào)', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await fa.btnMoMau.click();
    await expect(fa.openTemplateModal).toBeVisible();
    await expect(fa.openTemplateModal.getByText('Không có dữ liệu')).toBeVisible();
  });

  test('TC_PTCB_SS_21: "Mở mẫu" hiển thị danh sách mẫu đã lưu + "Nạp" tải mẫu', async ({ page }) => {
    await loginFirst(page);
    await page.route(/save_compare\/get-templates/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 501, label: 'Mẫu giả B', list_mack: JSON.stringify([{ mack: 'VNM' }, { mack: 'FPT' }]) },
        ]),
      })
    );
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });
    await fa.waitForCompareDataReady('VNM');

    await fa.btnMoMau.click();
    await expect(fa.openTemplateModal.getByText('Mẫu giả B')).toBeVisible();
    await fa.openTemplateModal.getByRole('button', { name: 'Nạp' }).click();

    await expect(fa.openTemplateModal).toHaveCount(0);
    await expect(fa.selectedTemplateLabel).toContainText('Mẫu giả B');
  });

  test('TC_PTCB_SS_22: Xoá mẫu trong "Mở mẫu" — modal xác nhận + gọi API xoá (mock)', async ({ page }) => {
    await loginFirst(page);
    await page.route(/save_compare\/get-templates/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 777, label: 'Mẫu giả C', list_mack: JSON.stringify([{ mack: 'VNM' }]) }]),
      })
    );
    let destroyCalled = false;
    await page.route(/save_compare\/destroy/, (route) => {
      destroyCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });
    await fa.waitForCompareDataReady('VNM');

    await fa.btnMoMau.click();
    await fa.openTemplateModal.getByRole('button', { name: 'Xóa' }).click();

    await expect(fa.deleteTemplateConfirmModal).toBeVisible();
    await expect(fa.deleteTemplateConfirmModal.getByText('Bạn có muốn xóa không?')).toBeVisible();
    await fa.deleteTemplateConfirmModal.getByRole('button', { name: 'Xóa' }).click();

    await expect(page.getByText('Đã xóa thành công')).toBeVisible();
    expect(destroyCalled, 'API xoá (mock) phải được gọi').toBe(true);
    await expect(fa.openTemplateModal.getByText('Mẫu giả C')).toHaveCount(0);
  });
});

test.describe('Phân tích cơ bản — So sánh — Lỗi mạng / trạng thái đặc biệt', () => {
  test('TC_PTCB_SS_23: Mất mạng khi tải bảng so sánh không crash, nhưng KHÔNG có toast lỗi', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\/compare/, (route) => route.abort());
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });
    await page.waitForTimeout(4000);

    await expect(fa.compareTableRows).toHaveCount(0);
    await expect(
      page.getByText('Có lỗi xảy ra, vui lòng thử lại'),
      'Phát hiện: getAll() nuốt lỗi hoàn toàn, không toast (khác getList()/deleteRowItem() cùng file)'
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('TC_PTCB_SS_24: Lỗi 500 khi tải danh sách mẫu đã lưu hiện toast lỗi', async ({ page }) => {
    await loginFirst(page);
    await page.route(/save_compare\/get-templates/, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal Server Error' }) })
    );
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });
    await page.waitForTimeout(2500);

    await expect(page.getByText('Có lỗi xảy ra, vui lòng thử lại')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('TC_PTCB_SS_25: Loading state hiển thị khi bảng đang tải chậm', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\/compare/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'so-sanh' });
    await page.waitForTimeout(500);
    await expect(fa.btnThemMa, 'Trong lúc loading, 3 nút đầu trang chưa hiện (Compare v-if="!is_loading")').toHaveCount(0);

    await expect(fa.btnThemMa).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Phân tích cơ bản — So sánh — Responsive', () => {
  test('TC_PTCB_SS_26: Responsive viewport mobile/tablet', async ({ page }) => {
    await loginFirst(page);
    const fa = await gotoSoSanhReady(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.btnThemMa).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.btnThemMa).toBeVisible();
  });
});
