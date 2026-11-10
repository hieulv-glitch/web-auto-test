import { test, expect, Page } from '@playwright/test';
import { BangGiaPage } from '../pages/BangGiaPage';
import { BangGiaGhimPage } from '../pages/BangGiaGhimPage';
import { LoginPage } from '../pages/LoginPage';
import type { Prev2Account } from '../pages/Prev2Session';

/**
 * AN TOÀN DỮ LIỆU (cập nhật 10/11/2026): chạy trên BASE_URL = localhost:8080 nhưng gọi backend PRODUCTION, tài khoản
 * test dùng chung. Mọi test (trừ TC_01/02) mở bảng giá qua `BangGiaGhimPage.open()` (= `Prev2Session` + máy chủ
 * setting giả): `/getusersettings` trả trạng thái bảng giá về "Toàn bộ", `/updateusersettings|/delusersettings` bị
 * huỷ (đổi sàn/ngành/watchlist/bộ lọc KHÔNG còn ghi lên tài khoản), mọi request không phải GET khác tới *.kfsp.vn bị
 * huỷ và ghi vào `blocked`. Sau mỗi test assert `blocked` rỗng (trừ nhật ký hoạt động đã giả lập thành công).
 */
const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;

let blockedWrites: string[] | undefined;
test.afterEach(async () => {
  if (blockedWrites) expect(blockedWrites.filter((b) => !/activitylog/.test(b)), 'request ghi lọt lưới an toàn').toEqual([]);
  blockedWrites = undefined;
});

/** Lưới an toàn cho test KHÔNG đi qua `BangGiaGhimPage.open()` (TC_01/02 đăng nhập bằng form): chỉ cho đăng nhập đi
 * qua, giả lập ghi phiên bản Dashboard, huỷ ghi setting và mọi request ghi khác. */
async function guardWrites(page: Page) {
  const blocked: string[] = [];
  blockedWrites = blocked;
  await page.route((u) => /(^|\.)kfsp\.vn$/.test(u.hostname), async (route) => {
    const r = route.request();
    if (r.method() === 'GET' || r.method() === 'OPTIONS' || /socket\.io|\/api\/login(\?|$)/.test(r.url())) return route.fallback();
    if (/\/save-user-dashboard-preference(\?|$)/.test(r.url())) return route.fulfill({ json: { success: true } });
    if (/\/(updateusersettings|delusersettings)(\?|$)/.test(r.url())) return route.abort();
    blocked.push(`${r.method()} ${r.url().split('?')[0]}`);
    if (/\/api\/activitylog\//.test(r.url())) return route.fulfill({ json: { success: true } });
    return route.abort();
  });
}

/** Đóng modal "Chọn dịch vụ" (bảng giá gói hội viên) nếu nó đang bật.
 *
 * `TheContainer.vue` bật modal này qua `CModal :show.sync="$store.state.isShowModalPackage"` — với tài khoản
 * Free nó tự hiện ngay sau khi đăng nhập/vào trang, **backdrop che toàn màn** nên MỌI click sau đó đều bị chặn,
 * gây timeout rất khó hiểu (đã gặp thật: TC_BANGGIA_49 timeout 32s dù trước đó chạy pass — modal chỉ thỉnh
 * thoảng mới bật nên lỗi trông như flaky).
 *
 * Không chờ/không fail nếu modal không có — chỉ kiểm tra nhanh rồi bỏ qua. */
async function dismissPackageModalIfShown(page: any) {
  const modal = page.locator('.modal.show, .modal.d-block').filter({ hasText: 'Chọn dịch vụ' });
  if ((await modal.count()) === 0) return;
  await modal.locator('button.close').first().click().catch(() => {});
  await modal.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/** Mở /bang-gia đã đăng nhập (`paid` = TEST_USER_*, `free` = FREE_USER_*), qua máy chủ setting giả.
 * Cập nhật 10/11/2026: KHÔNG còn bước "ép về Toàn bộ / bỏ lọc ngành" bằng thao tác UI (thao tác đó ghi setting thật
 * lên tài khoản dùng chung) — `/getusersettings` giả đã trả sẵn sàn "Toàn bộ", ngành "Tất cả", không bộ lọc. */
async function openBangGia(page: Page, account: Prev2Account = 'paid'): Promise<BangGiaPage> {
  const bangGia = new BangGiaGhimPage(page);
  blockedWrites = bangGia.blocked;
  await bangGia.open({ account });
  await dismissPackageModalIfShown(page);
  await bangGia.columnHeader('Mã').waitFor({ state: 'visible', timeout: 10000 });
  return bangGia;
}

test.describe('Bảng giá / Nhóm A — Khung layout tổng thể', () => {
  test('TC_BANGGIA_01: Truy cập /bang-gia khi chưa đăng nhập', async ({ page }) => {
    await guardWrites(page);
    await page.context().clearCookies();
    await page.goto('/bang-gia');
    await page.waitForURL(/\/login\?redirect=%2Fbang-gia/);
    expect(page.url()).toContain('/login?redirect=%2Fbang-gia');
  });

  test('TC_BANGGIA_02: Đăng nhập từ redirect quay lại đúng /bang-gia', async ({ page }) => {
    await guardWrites(page);
    await page.context().clearCookies();
    await page.goto('/bang-gia');
    await page.waitForURL(/\/login\?redirect=%2Fbang-gia/);

    const loginPage = new LoginPage(page);
    await loginPage.login(EMAIL, PASSWORD);
    await page.waitForURL(/\/bang-gia/);
    expect(page.url()).toContain('/bang-gia');
  });

  test('TC_BANGGIA_03: Overview màn hình khi đã đăng nhập', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await expect(bangGia.mainContent).toBeVisible();
    // Cập nhật 10/11/2026: panel phải chỉ còn 4 tab — "Cảnh báo" và "Cộng đồng" bị gỡ khỏi `DEFAULT_BORDER_LAYOUT`
    // (commit 3ee23420d "Menu", 12/10/2026; trước đó 22/09 đã gỡ "Bài viết"/"Chatbot").
    const texts = await bangGia.borderButtons.allTextContents();
    expect(texts).toEqual(['IBD', 'Thông tin', 'Watchlist', 'Ghi chú']);
    await expect(bangGia.activeBorderButton).toHaveText('IBD');
    await expect(page.getByText('Tổng quan thị trường chung')).toBeVisible();
  });

  test('TC_BANGGIA_04: Bố cục lưu vào localStorage key ibd_layout', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Quan trọng: `onModelChange` (ghi vào localStorage) của flexlayout-react CHỈ được gọi khi model layout
    // thực sự đổi (chọn tab border, resize, kéo-thả...) — KHÔNG tự ghi ngay khi trang vừa tải xong (lúc đó chỉ
    // gọi `loadLayout()` đọc vào, không ghi ra). Vì vậy phải tạo 1 thay đổi layout trước (click 1 tab border)
    // rồi mới kiểm tra key này tồn tại — nếu kiểm tra ngay sau khi vào trang mà CHƯA từng tương tác, key hoàn
    // toàn có thể chưa tồn tại (đã verify thực tế: đúng vậy).
    await bangGia.borderTab('Thông tin').click();
    await page.waitForTimeout(500);

    const ibdLayout = await page.evaluate(() => localStorage.getItem('ibd_layout'));
    expect(ibdLayout).toBeTruthy();
    const parsed = JSON.parse(ibdLayout!);
    expect(parsed).toHaveProperty('global');
    expect(parsed).toHaveProperty('borders');
    expect(parsed).toHaveProperty('layout');
  });

  test('TC_BANGGIA_05: Thu gọn panel phải khi click lại đúng tab đang active', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await bangGia.borderTab('Thông tin').click();
    await page.waitForTimeout(500);
    await expect(bangGia.activeBorderButton).toHaveText('Thông tin');

    await bangGia.borderTab('Thông tin').click();
    await page.waitForTimeout(500);
    await expect(bangGia.activeBorderButton).toHaveCount(0);
  });

  test('TC_BANGGIA_06: Mở lại panel phải từ trạng thái thu gọn', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Tab "IBD" đã active sẵn mặc định — click 1 lần để thu gọn (giống TC_BANGGIA_05).
    await bangGia.borderTab('IBD').click();
    await page.waitForTimeout(400);
    await expect(bangGia.activeBorderButton).toHaveCount(0);

    // Cập nhật 10/11/2026: tab "Cảnh báo" đã bị gỡ khỏi panel phải → mở lại bằng tab "Ghi chú".
    await bangGia.borderTab('Ghi chú').click();
    await page.waitForTimeout(500);
    await expect(bangGia.activeBorderButton).toHaveText('Ghi chú');
  });

  test.fixme('TC_BANGGIA_07: Kéo giãn độ rộng panel phải', async () => {
    // ⚠️ Cần xác nhận thêm: chưa đo được việc kéo `.flexlayout__border_sizer` có cập nhật đúng `size` trong
    // localStorage.ibd_layout hay không — cần thử nghiệm thêm cách giả lập mouse drag ổn định cho control
    // riêng của flexlayout-react (khác cơ chế resizer-vertical đã dùng ở Dashboard).
  });

  test('TC_BANGGIA_08: Tab border không có nút đóng, không kéo-thả được', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Cập nhật 10/11/2026: tab "Cảnh báo" không còn → locator cũ không khớp gì nên assertion `toHaveCount(0)` pass
    // rỗng. Đổi sang kiểm tra cả 4 tab đang có (đảm bảo tab tồn tại trước khi kiểm tra không có nút đóng).
    await expect(bangGia.borderButtons).toHaveCount(4);
    await expect(bangGia.borderTab('Ghi chú')).toBeVisible();
    await expect(bangGia.borderButtons.locator('svg, .flexlayout__border_button_trailing')).toHaveCount(0);
  });

  test('TC_BANGGIA_09: Tab chính "Bảng giá" không hiển thị thanh tab', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await expect(page.locator('.flexlayout__tab_button')).toHaveCount(0);
  });
});

test.describe('Bảng giá / Nhóm B — Toolbar lọc', () => {
  test('TC_BANGGIA_10: Hiển thị đầy đủ toolbar lọc mặc định', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await expect(bangGia.searchInput).toBeVisible();
    // Cập nhật 2026-09-22 (nhánh UI mới): sàn/Phái sinh gộp chung 1 dropdown "Danh sách sàn" — mở ra để xác
    // nhận đủ 7 mục, thay vì 7 nút rời như trước.
    await expect(bangGia.boardDropdownToggle).toHaveText('Toàn bộ');
    await bangGia.boardDropdownToggle.click();
    await page.waitForTimeout(400);
    for (const name of ['Toàn bộ', 'HOSE', 'VN30', 'VN100', 'HNX', 'UPCOM', 'Phái sinh']) {
      await expect(bangGia.boardMenuItem(name)).toBeVisible();
    }
    await page.keyboard.press('Escape');

    // Ngành/Watchlist/Tín hiệu M/B/Bộ lọc giờ gộp sau nút overflow "Bộ lọc" — mở ra để xác nhận đủ.
    await bangGia.openFiltersOverflow();
    await expect(bangGia.departmentDropdown).toBeVisible();
    await expect(bangGia.watchlistDropdown).toBeVisible();
    await expect(bangGia.signalDropdown).toBeVisible();
    await expect(bangGia.filterDropdown).toBeVisible();
  });

  test('TC_BANGGIA_11: Chuyển đổi giữa các sàn', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Cập nhật 2026-09-22 (nhánh UI mới): sàn giờ chọn qua 1 dropdown DUY NHẤT "Danh sách sàn"
    // (`boardDropdownToggle`/`selectBoard()`), không còn 7 nút rời. Cột "Sàn CK"/"Ngành" vẫn không tồn tại ở
    // bất kỳ trạng thái sàn nào (đã xác nhận qua DOM thật) — không còn assertion nào liên quan 2 cột đó.
    await bangGia.selectBoard('HOSE');
    await expect(bangGia.boardDropdownToggle).toHaveText('HOSE');
    const codesHOSE = await bangGia.visibleStockCodes();
    expect(codesHOSE.length).toBeGreaterThan(0);

    await bangGia.selectBoard('VN30');
    await expect(bangGia.boardDropdownToggle).toHaveText('VN30');

    // Xác nhận danh sách mã THẬT SỰ đổi theo sàn (không chỉ đổi nhãn dropdown) — so 2 sàn không giao nhau
    // (HNX/UPCOM) để chắc chắn không trùng do trùng lặp ngẫu nhiên giữa các sàn lớn.
    await bangGia.selectBoard('HNX');
    await expect(bangGia.boardDropdownToggle).toHaveText('HNX');
    const codesHNX = await bangGia.visibleStockCodes();
    expect(codesHNX.length).toBeGreaterThan(0);
    expect(codesHNX.some(code => codesHOSE.includes(code))).toBe(false);

    await bangGia.selectBoard('UPCOM');
    await expect(bangGia.boardDropdownToggle).toHaveText('UPCOM');
    const codesUPCOM = await bangGia.visibleStockCodes();
    expect(codesUPCOM.length).toBeGreaterThan(0);
    expect(codesUPCOM.some(code => codesHOSE.includes(code) || codesHNX.includes(code))).toBe(false);

    await bangGia.selectBoard('Toàn bộ');
    await expect(bangGia.boardDropdownToggle).toHaveText('Toàn bộ');
  });

  test('TC_BANGGIA_12: Chuyển sang "Phái sinh"', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Cập nhật 2026-09-22: "Phái sinh" giờ là 1 mục trong dropdown "Danh sách sàn", không phải nút riêng.
    await bangGia.selectBoard('Phái sinh');

    await expect(bangGia.mainContent.getByText('Bảng giá HĐTL', { exact: true })).toBeVisible();
    await expect(bangGia.mainContent.getByText('Thống kê HĐTL', { exact: true })).toBeVisible();
    await expect(bangGia.columnHeader('Ngày đáo')).toBeVisible();
    await expect(bangGia.footerNote).toContainText('Giá x 100.000 VNĐ. Khối lượng x 1HĐ');

    // Xác nhận danh sách mã THẬT SỰ đổi sang mã hợp đồng tương lai (không phải danh sách cổ phiếu cũ còn sót).
    const codesPS = await bangGia.visibleStockCodes();
    expect(codesPS.length).toBeGreaterThan(0);
    expect(codesPS.every(code => /^(VN30F|VN100F|41I1|41I2)/.test(code))).toBe(true);
  });

  test('TC_BANGGIA_13: "Phái sinh" > sub-tab "Thống kê HĐTL"', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await bangGia.selectBoard('Phái sinh');
    await bangGia.mainContent.getByText('Thống kê HĐTL', { exact: true }).click();
    await page.waitForTimeout(1000);

    await expect(bangGia.mainContent.getByText('Chọn HĐ')).toBeVisible();
    await expect(bangGia.mainContent.getByText('Ngày đáo hạn:')).toBeVisible();
  });

  test('TC_BANGGIA_14: Dropdown "Ngành" lọc theo ngành', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Cập nhật 2026-09-22: dropdown "Ngành" giờ nằm trong panel "Bộ lọc" overflow, phải mở panel trước.
    await bangGia.openFiltersOverflow();
    await bangGia.departmentDropdown.hover();
    await page.waitForTimeout(400);
    const items = bangGia.departmentDropdown.locator('.dropdown-menu .dropdown-item');
    await expect(items.first()).toHaveText('Tất cả');
    const count = await items.count();
    test.skip(count < 2, 'Không có dữ liệu ngành để chọn.');

    const target = (await items.nth(1).textContent())?.trim();
    await items.nth(1).click();
    await page.waitForTimeout(800);

    // Cập nhật 2026-09-22: chọn xong 1 ngành làm panel "Bộ lọc" overflow tự ĐÓNG lại — phải mở lại panel (và
    // hover lại dropdown Ngành) trước khi đọc nhãn `.selected`, nếu không toàn bộ nội dung panel (kể cả
    // dropdown Ngành) không còn trong DOM để tìm thấy.
    await bangGia.openFiltersOverflow();
    await bangGia.departmentDropdown.hover();
    await page.waitForTimeout(300);
    // Scope riêng vào toggle header (`.dropdown-toggles`) — mở hover lên, CẢ toggle label LẪN đúng 1 dropdown
    // item cũng mang class `.selected` cùng lúc, dùng `.selected` trần sẽ bị strict-mode violation (2 khớp).
    await expect(bangGia.departmentDropdown.locator('.dropdown-toggles .selected')).toHaveText(target!);
  });

  test('TC_BANGGIA_15: Dropdown "Watchlist" đổi danh sách theo watchlist đã chọn', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Baseline: danh sách mã ở "Toàn bộ" TRƯỚC khi chọn watchlist, để so sánh danh sách có thật sự đổi không.
    const codesBefore = await bangGia.visibleStockCodes();

    // Cập nhật 2026-09-22: dropdown "Watchlist" giờ nằm trong panel "Bộ lọc" overflow, phải mở panel trước.
    await bangGia.openFiltersOverflow();
    await bangGia.watchlistDropdown.click();
    await page.waitForTimeout(400);
    await expect(bangGia.watchlistDropdown.getByText('Danh sách Watchlist', { exact: true })).toBeVisible();

    const items = bangGia.watchlistDropdown.locator('.dropdown-menu-full-width .dropdown-item');
    const count = await items.count();
    test.skip(count === 0, 'Tài khoản test hiện không có watchlist nào.');

    await items.first().click();
    await page.waitForTimeout(800);

    // Xác nhận danh sách mã THẬT SỰ đổi theo watchlist đã chọn (không đứng yên như danh sách "Toàn bộ").
    const codesAfter = await bangGia.visibleStockCodes();
    expect(codesAfter.length).toBeGreaterThan(0);
    expect(codesAfter).not.toEqual(codesBefore);
  });

  // TC_BANGGIA_16/17 (modal "Thêm mã CK vào watchlist") đã XOÁ 2026-09-22: dev đã GỠ HẲN nút "Thêm mã" khỏi màn
  // Bảng giá từ 2026-09-16 — xem comment trong `dropdownWatchlist.js` (~dòng 153): "Bỏ nút 'Thêm mã'
  // (popupWatchlist.vue) hiện ra khi đang chọn một watchlist - 2026-09-16. Thêm mã vào watchlist làm ở màn
  // /watchlist." Đã kiểm chứng bằng automation: chọn watchlist xong, mở panel "Bộ lọc" vẫn KHÔNG có nút này.
  // Chức năng thêm mã vào watchlist nay thuộc phạm vi màn /watchlist (testcases/watchlist.md).

  test('TC_BANGGIA_18: Dropdown "Tín hiệu M/B"', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const codesBefore = await bangGia.visibleStockCodes();

    // Cập nhật 2026-09-22: dropdown "Tín hiệu M/B" giờ nằm trong panel "Bộ lọc" overflow, phải mở panel trước.
    await bangGia.openFiltersOverflow();
    await bangGia.signalDropdown.hover();
    await page.waitForTimeout(500);

    // Chỉ 1 nhóm ("Tín hiệu mua bán") nên PatternSelector không render thanh tab, item hiện thẳng.
    const items = bangGia.signalDropdown.locator('.base-menu-container .base-item .label');
    await expect(items.filter({ hasText: 'Tiềm năng mua hôm nay' })).toBeVisible();
    await expect(items.filter({ hasText: 'Tiềm năng bán hôm nay' })).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('get-macks-by-filter') && res.request().method() === 'GET'),
      items.filter({ hasText: 'Tiềm năng mua hôm nay' }).click(),
    ]);
    expect(response.status()).toBe(200);
    const body = await response.json();
    const macksFromApi: string[] = body?.data || [];
    await page.waitForTimeout(800);

    // Xác nhận danh sách mã THẬT SỰ đổi theo tín hiệu đã chọn — gọi đúng API rồi hiển thị đúng danh sách mã
    // trả về (không đứng yên như danh sách "Toàn bộ" trước đó). Dùng dữ liệu thị trường thật, không mock — số
    // lượng mã "tiềm năng mua hôm nay" phụ thuộc thị trường thật của đúng ngày chạy test, có thể bằng 0 vào 1
    // số ngày, nên so trực tiếp với số liệu API trả về thay vì hard-code phải > 0.
    const codesAfter = await bangGia.visibleStockCodes();
    test.skip(macksFromApi.length === 0, 'API get-macks-by-filter trả về 0 mã "tiềm năng mua hôm nay" vào đúng lúc chạy test (dữ liệu thị trường thật của ngày hôm nay) — không có gì để so sánh.');
    expect(codesAfter.length).toBeGreaterThan(0);
    expect(codesAfter).not.toEqual(codesBefore);
    expect(codesAfter.every(code => macksFromApi.includes(code))).toBe(true);
  });

  test('TC_BANGGIA_19: Dropdown "Bộ lọc" (bộ lọc cá nhân KFSP)', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const codesBefore = await bangGia.visibleStockCodes();

    // Cập nhật 2026-09-22: dropdown "Bộ lọc" giờ nằm trong panel "Bộ lọc" overflow, phải mở panel trước.
    await bangGia.openFiltersOverflow();
    await bangGia.filterDropdown.hover();
    await page.waitForTimeout(500);
    // Không có lỗi JS khi mở.
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.waitForTimeout(300);
    expect(pageErrors).toEqual([]);

    // Nhóm "Của bạn" active mặc định (activeIndex: 0 trong PatternSelector.vue).
    const items = bangGia.filterDropdown.locator('.base-menu-container .base-item .label');
    // Cập nhật 10/11/2026: danh sách bộ lọc tải bằng API (`my-filter-group-and-example`) khi panel vừa mở — chờ tối đa
    // 10 giây thay vì đếm ngay (lượt chạy 10/11 từng skip nhầm vì API production trả chậm).
    await items.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const count = await items.count();
    test.skip(count === 0, 'Tài khoản test hiện không có bộ lọc cá nhân nào đã lưu (nhóm "Của bạn" rỗng).');

    await items.first().click();
    await page.waitForTimeout(1200);

    // Xác nhận danh sách mã THẬT SỰ đổi theo bộ lọc đã chọn — gọi đúng API get-macks-by-filter rồi hiển thị
    // đúng danh sách mã trả về (không đứng yên như danh sách "Toàn bộ" trước đó).
    const codesAfter = await bangGia.visibleStockCodes();
    expect(codesAfter.length).toBeGreaterThan(0);
    expect(codesAfter).not.toEqual(codesBefore);
  });

  test('TC_BANGGIA_21: Toggle "Thu gọn"/"Mở rộng" dải index card', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Cập nhật 2026-09-22 (nhánh UI mới): tính năng đổi hẳn — trước đây toggle MINI-CHART riêng bên trong mỗi
    // index card (card luôn hiện); giờ nút này ẩn/hiện CẢ DẢI 5 index card cùng lúc để nhường chỗ cho bảng.
    // Mặc định tải trang: dải đang HIỆN (5 card), nút hiện "Thu gọn" — KHÔNG phải "Mở rộng" như hành vi cũ.
    await expect(bangGia.indexCards).toHaveCount(5);
    await expect(bangGia.expandChartButton).toHaveText('Thu gọn');

    await bangGia.expandChartButton.click();
    await page.waitForTimeout(500);
    await expect(bangGia.indexCards).toHaveCount(0);
    await expect(bangGia.expandChartButton).toHaveText('Mở rộng');

    await bangGia.expandChartButton.click();
    await page.waitForTimeout(500);
    await expect(bangGia.indexCards).toHaveCount(5);
    await expect(bangGia.expandChartButton).toHaveText('Thu gọn');
  });

  test('TC_BANGGIA_22: Tìm kiếm mã hợp lệ', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const firstCode = (await bangGia.codeLinkOf(bangGia.mainRows.first()).textContent())?.trim();
    test.skip(!firstCode, 'Không lấy được mã CK đầu tiên để tìm kiếm.');

    await bangGia.searchInput.fill(firstCode!.slice(0, 2));
    await page.waitForTimeout(500);
    await expect(bangGia.searchSuggestions.first()).toBeVisible();

    await bangGia.searchSuggestions.first().click();
    await page.waitForTimeout(800);
    await expect(bangGia.searchInput).toHaveValue('');
  });

  test('TC_BANGGIA_23: Tìm kiếm mã không tồn tại', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await bangGia.searchInput.fill('ZZZ999');
    await page.waitForTimeout(500);
    await expect(bangGia.searchSuggestions).toHaveCount(0);
  });
});

test.describe('Bảng giá / Nhóm C — Chỉ số thị trường', () => {
  test('TC_BANGGIA_24: Hiển thị 5 index card', async ({ page }) => {
    const bangGia = await openBangGia(page);

    for (const code of ['VNINDEX', 'HNXINDEX', 'UPCOMINDEX', 'VN30', 'VN100']) {
      await expect(bangGia.mainContent.getByRole('link', { name: code })).toBeVisible();
    }
  });

  test('TC_BANGGIA_25: Click 1 index card mở modal biểu đồ', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await bangGia.mainContent.getByRole('link', { name: 'VNINDEX' }).click();
    await page.waitForTimeout(700);
    await expect(page.locator('.modal.show, .modal.d-block').first()).toBeVisible();
    expect(page.url()).toContain('/bang-gia');
  });

  test('TC_BANGGIA_26: Màu sắc theo chiều tăng/giảm/đứng giá của index card', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const card = bangGia.mainContent.getByRole('link', { name: 'VNINDEX' }).locator('xpath=ancestor::div[contains(@class,"card")][1]');
    await expect(card).toBeVisible();
    // Chỉ verify có gán 1 trong các class màu chuẩn của hệ thống (up/down/nochange) cho giá/%% (không cố định
    // chiều cụ thể vì giá trị thị trường thay đổi liên tục). Dùng selector đúng 3 class màu — tránh khớp nhầm
    // phần tử khác trong card có class chứa "text-" nhưng không liên quan màu (VD "text-nowrap" trên link mã).
    const colorEl = card.locator('.text-upchange, .text-downchange, .text-nochange').first();
    await expect(colorEl).toBeVisible();
  });
});

test.describe('Bảng giá / Nhóm D — Bảng dữ liệu mã CK', () => {
  test('TC_BANGGIA_27: Header bảng hiển thị đầy đủ cột', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Cập nhật 2026-09-22 (nhánh UI mới): cột "Ngành" và "Sàn CK" đã bị GỠ BỎ hoàn toàn khỏi header (xác nhận
    // qua DOM thật) — không còn 2 assertion cũ cho 2 cột này.
    for (const label of ['Mã', 'TC', 'Trần', 'Tổng KL', 'Cao', 'Thấp', 'Giá TB']) {
      await expect(bangGia.columnHeader(label)).toBeVisible();
    }
    await expect(bangGia.headerRow.getByText('Sàn', { exact: true })).toBeVisible();
    await expect(bangGia.headerRow.getByText('Bên mua', { exact: true })).toBeVisible();
    await expect(bangGia.headerRow.getByText('Khớp lệnh', { exact: true })).toBeVisible();
    await expect(bangGia.headerRow.getByText('Bên bán', { exact: true })).toBeVisible();
    await expect(bangGia.headerRow.getByText('Mua', { exact: true })).toBeVisible();
    await expect(bangGia.headerRow.getByText('Bán', { exact: true })).toBeVisible();
  });

  /** So sánh 2 mã CK — PHẢI dùng `localeCompare` giống hệt code thật (`a.localeCompare(b)` trong
   * `sortData()`), KHÔNG dùng so sánh chuỗi `<`/`>` thuần UTF-16: đã phát hiện thực tế có mã bắt đầu bằng ký
   * tự đặc biệt (VD "^MU") mà collation của `localeCompare` xếp TRƯỚC "A..." trong khi so sánh UTF-16 thuần
   * lại xếp SAU — nếu dùng sai phép so sánh, test tự báo sai dù app hoàn toàn đúng. */
  function compareCode(a: string | undefined | null, b: string | undefined | null): number {
    return (a || '').localeCompare(b || '');
  }

  /** Kiểm tra 1 mảng đã sắp xếp đơn điệu theo đúng chiều — LƯU Ý QUAN TRỌNG: không được so khớp mảng con (VD
   * 10 dòng đầu hiển thị) với "đảo ngược của 10 dòng đầu TRƯỚC khi sort", vì đảo ngược của N phần tử NHỎ NHẤT
   * (đầu danh sách asc) KHÔNG bằng N phần tử LỚN NHẤT (đầu danh sách desc) trừ khi N bằng đúng tổng số dòng —
   * đây chính là lỗi ban đầu khi viết test này. Chỉ nên verify tính đơn điệu (monotonic) của mẫu đang thấy. */
  function expectMonotonic(codes: (string | undefined | null)[], direction: 'asc' | 'desc') {
    for (let i = 1; i < codes.length; i++) {
      const cmp = compareCode(codes[i - 1], codes[i]);
      if (direction === 'asc') {
        expect(cmp, `"${codes[i - 1]}" phải <= "${codes[i]}" khi sort tăng dần`).toBeLessThanOrEqual(0);
      } else {
        expect(cmp, `"${codes[i - 1]}" phải >= "${codes[i]}" khi sort giảm dần`).toBeGreaterThanOrEqual(0);
      }
    }
  }

  async function firstCodes(bangGia: BangGiaPage) {
    return bangGia.mainRows.evaluateAll((rows) => rows.slice(0, 10).map((r) => r.querySelector('a')?.textContent?.trim()));
  }

  test('TC_BANGGIA_28: Click header để sắp xếp (sort)', async ({ page }) => {
    const bangGia = await openBangGia(page);

    // Trạng thái mặc định của board đã là sort theo Mã tăng dần (column_sort:"stockcode", type_sort:"asc"
    // trong state khởi tạo) — verify trước để làm rõ baseline.
    const codesBefore = await firstCodes(bangGia);
    expectMonotonic(codesBefore, 'asc');

    // Vì "Mã" đã là cột đang sort mặc định, click lần ĐẦU TIÊN vào chính cột đó sẽ ĐẢO CHIỀU (asc → desc) —
    // sort lại TOÀN BỘ danh sách theo chiều giảm dần (Z→A), không phải chỉ đảo ngược 10 dòng đang thấy.
    await bangGia.columnHeader('Mã').click();
    await page.waitForTimeout(700);
    const codesAfterFirstClick = await firstCodes(bangGia);
    expectMonotonic(codesAfterFirstClick, 'desc');
    expect(codesAfterFirstClick).not.toEqual(codesBefore);
  });

  test('TC_BANGGIA_29: Click lại cùng cột đảo chiều sort', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const originalAsc = await firstCodes(bangGia);
    expectMonotonic(originalAsc, 'asc');

    await bangGia.columnHeader('Mã').click(); // asc → desc (xem giải thích ở TC_BANGGIA_28)
    await page.waitForTimeout(700);
    const desc = await firstCodes(bangGia);
    expectMonotonic(desc, 'desc');

    await bangGia.columnHeader('Mã').click(); // desc → asc
    await page.waitForTimeout(700);
    const ascAgain = await firstCodes(bangGia);
    expectMonotonic(ascAgain, 'asc');
    // KHÔNG so `ascAgain` === `originalAsc`: đã phát hiện qua automation, danh sách BAN ĐẦU (raw, trước khi
    // user từng click sort) không phải lúc nào cũng là kết quả CHÍNH XÁC của thuật toán sort toàn cục — dù
    // state mặc định ghi `column_sort:"stockcode", type_sort:"asc"` (chỉ dùng để hiển thị đúng icon mũi tên),
    // danh sách gốc thực chất theo đúng thứ tự mảng `stockcode` server trả về trong `getdatainitpriceboard`,
    // có thể khác thứ tự bảng chữ cái chuẩn (VD baseline thực tế không có mã "^MU" ở đầu như khi sort thật).
    // Chỉ cột mốc bảng chữ cái ASC sau khi đã CHỦ ĐỘNG click mới đảm bảo đúng chuẩn toàn cục.
  });

  test('TC_BANGGIA_30: Icon "‹"/"›" đổi cột "Mua"/"Bán" ⇄ "Room"', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await expect(bangGia.headerRow.getByText('Mua', { exact: true })).toBeVisible();
    await expect(bangGia.headerRow.getByText('Bán', { exact: true })).toBeVisible();

    await bangGia.foreignColumnToggleIcon().click();
    await page.waitForTimeout(500);
    await expect(bangGia.headerRow.getByText('Room', { exact: true })).toBeVisible();
    await expect(bangGia.headerRow.getByText('Mua', { exact: true })).toHaveCount(0);

    await bangGia.foreignColumnToggleIcon().click();
    await page.waitForTimeout(500);
    await expect(bangGia.headerRow.getByText('Mua', { exact: true })).toBeVisible();
  });

  test('TC_BANGGIA_31: Hiển thị đầy đủ 1 dòng mã', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const row = bangGia.mainRows.first();
    await expect(bangGia.codeLinkOf(row)).toBeVisible();
    // Cập nhật 10/11/2026: cột kéo + ghim mặc định THU GỌN (commit f5545a114, 13/10) — dòng không còn icon ghim
    // cho tới khi mở cột bằng mũi tên ở tiêu đề "Mã" (đã phủ ở bang-gia-ghim TC_BGGHIM_01/03).
    await expect(bangGia.pinIconOf(row)).toHaveCount(0);
    // Cập nhật 2026-09-22 (nhánh UI mới): "ngành viết hoa nhỏ dưới mã" (`.nganh`) đã bị gỡ khỏi dòng — tên công
    // ty đầy đủ giờ chỉ còn ở tooltip `title` của ô mã (không hiển thị chữ trực tiếp trên dòng nữa).
    await expect(row.locator('.price-board-col.code')).toHaveAttribute('title', /.+/);
    await expect(row.locator('.price-board-col.price').first()).toBeVisible();
  });

  test('TC_BANGGIA_32: Màu sắc theo trạng thái giá của từng dòng', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const refCell = bangGia.mainRows.first().locator('.price.text-live-board-nochange').first();
    await expect(refCell).toBeVisible();
    const ceilCell = bangGia.mainRows.first().locator('.price.text-live-board-ceilchange').first();
    await expect(ceilCell).toBeVisible();
  });

  test('TC_BANGGIA_33: Click vào dòng (ngoài mã) chỉ đổi mã đang chọn, KHÔNG mở modal', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const row = bangGia.mainRows.first();
    const code = (await bangGia.codeLinkOf(row).textContent())?.trim();
    // Cập nhật 2026-09-22: cột "Ngành" (`.nganh`) đã bị gỡ khỏi dòng — click vào cột giá "TC" thay thế, vẫn là
    // 1 vùng "ngoài mã" hợp lệ để verify hành vi không mở modal.
    await row.locator('.price-board-col.price').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.modal.show, .modal.d-block')).toHaveCount(0);

    await bangGia.borderTab('Thông tin').click();
    await page.waitForTimeout(800);
    await expect(bangGia.borderContent()).toContainText(code!);
  });

  test('TC_BANGGIA_34: Click text mã CK mở đồng thời modal biểu đồ', async ({ page }) => {
    const bangGia = await openBangGia(page);

    const row = bangGia.mainRows.first();
    const code = (await bangGia.codeLinkOf(row).textContent())?.trim();
    await bangGia.codeLinkOf(row).click();
    await page.waitForTimeout(700);
    await expect(page.locator('.modal.show, .modal.d-block').first()).toBeVisible();
  });

  // TC_BANGGIA_36 (ghim / bỏ ghim 1 mã) đã XOÁ 10/11/2026: cột kéo + ghim giờ mặc định thu gọn, mở bằng mũi tên ở
  // tiêu đề "Mã" (commit f5545a114, 13/10) và lưu đọc-gộp-ghi đồng bộ app (f4c471b93) — toàn bộ luồng ghim/bỏ ghim
  // đã phủ ở tests/bang-gia-ghim.spec.ts (TC_BGGHIM_03/08/10/11).

  // TC_BANGGIA_37 (kéo-thả đổi vị trí 1 dòng) đã XOÁ 2026-09-22 theo xác nhận của người dùng: chức năng này
  // chưa có trên web.

  test.fixme('TC_BANGGIA_38: Cuộn ngang đồng bộ header + khu ghim + danh sách chính', async () => {
    // Cần đo scrollLeft của 3 vùng sau khi cuộn ngang danh sách chính — để sau, ưu tiên thấp vì đã xác nhận
    // đúng qua đọc code (onScrollHeader/onScrollPinned dùng chung 1 cơ chế đã verify tương tự ở Dashboard).
  });

  test('TC_BANGGIA_39: Dòng chú thích đơn vị giá/khối lượng cuối bảng', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await expect(bangGia.footerNote).toContainText('Giá x 1000 VNĐ. Khối lượng x 1CP');

    await bangGia.selectBoard('Phái sinh');
    await expect(bangGia.footerNote).toContainText('Giá x 100.000 VNĐ. Khối lượng x 1HĐ');
  });
});

test.describe('Bảng giá / Nhóm E — Panel border phải', () => {
  test('TC_BANGGIA_40: Tab "IBD" (mặc định)', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await expect(bangGia.borderSubTab('Nhịp đập TT')).toBeVisible();
    await expect(bangGia.borderSubTab('Sức khỏe TT')).toBeVisible();
    await expect(page.getByText('Tổng quan thị trường chung')).toBeVisible();
  });

  // TC_BANGGIA_41 (tab "Thông tin" — sổ lệnh mã đang chọn) đã XOÁ 2026-09-22 theo yêu cầu của người dùng.

  test('TC_BANGGIA_43: Tab "Watchlist" (border)', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await bangGia.borderTab('Watchlist').click();
    await page.waitForTimeout(1000);
    await expect(bangGia.borderSubTab('Danh sách')).toBeVisible();
  });

  // TC_BANGGIA_44 (tab "Cảnh báo") và TC_BANGGIA_46 (tab "Cộng đồng") đã XOÁ 10/11/2026: 2 tab này bị gỡ khỏi
  // panel phải (`DEFAULT_BORDER_LAYOUT` trong reactLayoutIBD.js, commit 3ee23420d "Menu" 12/10/2026).

  test('TC_BANGGIA_45: Tab "Ghi chú" (border)', async ({ page }) => {
    const bangGia = await openBangGia(page);

    await bangGia.borderTab('Ghi chú').click();
    await page.waitForTimeout(1000);
    // Cập nhật 10/11/2026: tab dùng chung component Ghi chú của Dashboard (`dashboard/board/tabs/NoteV2.vue`, commit
    // 263e3dcfa 13/10) — không còn tiêu đề "KungFuStocksPro Note"; nhận biết bằng thanh lọc + nút thêm ghi chú.
    for (const tab of ['Tất cả', 'Cá nhân', 'Giao dịch']) {
      await expect(bangGia.borderContent().getByText(tab, { exact: true }).first()).toBeVisible();
    }
    await expect(bangGia.borderContent().getByText('Thêm ghi chú mới', { exact: true })).toBeVisible();
  });
});

test.describe('Bảng giá / Nhóm F — Tài khoản Free vs đầy đủ', () => {
  test('TC_BANGGIA_48: Tài khoản Free xem đầy đủ bảng giá (không giới hạn)', async ({ page }) => {
    const bangGia = await openBangGia(page, 'free');

    await expect(bangGia.mainRows.first()).toBeVisible();
    await expect(bangGia.headerRow.getByText('Bên mua', { exact: true })).toBeVisible();
  });

  test('TC_BANGGIA_49: Tài khoản Free — tab "Ghi chú" BỊ KHOÁ', async ({ page }) => {
    const bangGia = await openBangGia(page, 'free');

    await bangGia.borderTab('Ghi chú').click();
    await page.waitForTimeout(1000);

    // Kỳ vọng nghiệp vụ (người dùng xác nhận 2026-09-22): tài khoản Free PHẢI bị khoá tab "Ghi chú".
    // Cập nhật 10/11/2026: tab giờ dùng `dashboard/board/tabs/NoteV2.vue` (commit 263e3dcfa) — tài khoản Free render
    // `UpdateRequire` (`.free-user-img-wrapper`, ảnh nền + thông điệp + nút "Nâng cấp ngay" HIỆN SẴN, không cần hover)
    // thay cho `ProtectedView` (ảnh mờ `.blurred-image`, chỉ hiện thông điệp khi hover) của component cũ.
    const lock = bangGia.borderContent().locator('.free-user-img-wrapper');
    await expect(lock).toBeVisible();
    await expect(lock.getByText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này')).toBeVisible();
    await expect(lock.getByText('Nâng cấp ngay', { exact: true })).toBeVisible();
    // Nội dung ghi chú thật KHÔNG render.
    await expect(bangGia.borderContent().getByText('Thêm ghi chú mới', { exact: true })).toHaveCount(0);
  });

  test('TC_BANGGIA_50: Tài khoản Free — "Phái sinh" > "Thống kê HĐTL" BỊ KHOÁ', async ({ page }) => {
    const bangGia = await openBangGia(page, 'free');

    await bangGia.selectBoard('Phái sinh');
    await bangGia.mainContent.getByText('Thống kê HĐTL', { exact: true }).click();
    await page.waitForTimeout(1000);

    // Kỳ vọng nghiệp vụ (người dùng xác nhận 2026-09-22): tài khoản Free KHÔNG xem được "Thống kê HĐTL".
    // Nhận biết trạng thái khoá qua `ProtectedView` (ảnh mờ `.blurred-image`) — KHÔNG dùng text "Nâng cấp"
    // trần như assertion cũ vì chữ đó chỉ hiện khi hover.
    const protectedImage = bangGia.mainContent.locator('.image-container .blurred-image');
    await expect(protectedImage).toBeVisible();

    // `force: true` vì overlay thông điệp nâng cấp bung ra đè lên chính tấm ảnh ngay khi chuột chạm vào.
    await protectedImage.hover({ force: true });
    await expect(bangGia.mainContent.getByText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này.')).toBeVisible();
    await expect(bangGia.mainContent.getByRole('button', { name: 'Đăng ký ngay' })).toBeVisible();
  });
});

test.describe('Bảng giá / Nhóm G — Responsive & điều hướng', () => {
  test('TC_BANGGIA_51: Responsive ở viewport hẹp (≤630px)', async ({ page }) => {
    const bangGia = await openBangGia(page);
    await page.setViewportSize({ width: 600, height: 900 });
    await page.waitForTimeout(1000);

    // Ở chế độ hẹp, DropdownBoard chuyển sang 1 dropdown gọn "Toàn bộ" thay vì dãy nút ngang.
    await expect(bangGia.mainContent.locator('.dropdown').filter({ hasText: 'Toàn bộ' }).first()).toBeVisible();
  });

  test('TC_BANGGIA_52: Nút Back trình duyệt', async ({ page }) => {
    await openBangGia(page);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goBack();
    await page.waitForURL(/\/bang-gia/);
    await expect(page.getByPlaceholder('Tìm kiếm Mã CK')).toBeVisible();
  });
});
