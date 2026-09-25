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

/** Reset lại mã VNM qua ô search — dùng cho các test đổi mã CK giữa chừng, để không ảnh hưởng test khác chạy
 * song song (tài khoản test dùng chung, `final_mack` lưu server-side). */
async function resetToVNM(page: any, fa: FaAnalysisPage) {
  await fa.searchInput.fill('VNM');
  await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().waitFor({ state: 'visible' });
  await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().click();
}

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab "Hồ sơ" (Profile.vue + LeaderShip.vue)', () => {
  test('TC_PTCB_TTC_HSCD_01: Overview khi click sub-tab "Hồ sơ"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickTtcSubTab('Hồ sơ');
    await expect(fa.ttcSubTab('Hồ sơ')).toHaveClass(/active/);

    await expect(fa.profileSubTab('Lịch sử')).toHaveClass(/active/);
    await expect(fa.profileSubTab('Ngành nghề')).not.toHaveClass(/active/);
    await expect(fa.profileContent).not.toHaveText('');
    await expect(fa.leaderShipPanel).toContainText('BAN LÃNH ĐẠO');
    await expect(fa.leaderShipItems.first()).toBeVisible();
  });

  test('TC_PTCB_TTC_HSCD_02: Nội dung "Lịch sử" hiển thị đúng text từ API', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');

    await expect(fa.profileSubTab('Lịch sử')).toHaveClass(/active/);
    const text = await fa.profileContent.textContent();
    expect(text?.trim().length, 'Nội dung "Lịch sử" phải không rỗng').toBeGreaterThan(0);
    expect(text, 'Nội dung phải chứa mốc thời gian dạng "Năm..."').toMatch(/Năm \d{4}|Ngày \d{1,2}\/\d{1,2}\/\d{4}/);
  });

  test('TC_PTCB_TTC_HSCD_03: Click "Ngành nghề" chuyển đúng, nội dung khác "Lịch sử"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');
    await expect(fa.profileSubTab('Lịch sử')).toHaveClass(/active/);
    const lichSuText = await fa.profileContent.textContent();

    await fa.clickProfileSubTab('Ngành nghề');
    await expect(fa.profileSubTab('Ngành nghề')).toHaveClass(/active/);
    await expect(fa.profileSubTab('Lịch sử')).not.toHaveClass(/active/);
    const nganhNgheText = await fa.profileContent.textContent();
    expect(nganhNgheText).not.toEqual(lichSuText);
    expect(nganhNgheText?.trim().length).toBeGreaterThan(0);
  });

  test('TC_PTCB_TTC_HSCD_04: Click lại "Lịch sử" quay về đúng nội dung ban đầu', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');
    const lichSuTextBefore = await fa.profileContent.textContent();

    await fa.clickProfileSubTab('Ngành nghề');
    await expect(fa.profileSubTab('Ngành nghề')).toHaveClass(/active/);
    await fa.clickProfileSubTab('Lịch sử');

    await expect(fa.profileSubTab('Lịch sử')).toHaveClass(/active/);
    const lichSuTextAfter = await fa.profileContent.textContent();
    expect(lichSuTextAfter).toEqual(lichSuTextBefore);
  });

  test('TC_PTCB_TTC_HSCD_05: [Phát hiện] Đổi mã CK khi đang ở "Ngành nghề" — KHÔNG tự reset về "Lịch sử"', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');
    await fa.clickProfileSubTab('Ngành nghề');
    await expect(fa.profileSubTab('Ngành nghề')).toHaveClass(/active/);

    await page.waitForTimeout(2500);
    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(1500);

    await expect(fa.profileSubTab('Ngành nghề'), 'Vẫn ở "Ngành nghề" sau khi đổi mã CK (không tự reset)').toHaveClass(/active/);
    await expect(fa.profileContent).not.toHaveText('');

    await resetToVNM(page, fa);
  });

  test('TC_PTCB_TTC_HSCD_06: Panel "BAN LÃNH ĐẠO" hiển thị đúng field mỗi thành viên', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');

    const count = await fa.leaderShipItems.count();
    expect(count, 'Phải có ít nhất 1 thành viên ban lãnh đạo').toBeGreaterThan(0);
    const firstItem = fa.leaderShipItems.first();
    await expect(firstItem.locator('svg')).toBeVisible();
    const text = await firstItem.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('TC_PTCB_TTC_HSCD_07: Click 1 lãnh đạo ít dữ liệu — modal chỉ hiện các section có data', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');
    await expect(fa.leaderShipItems.first()).toBeVisible();

    await fa.clickLeaderShipItem('Lê Hoàng Minh');
    await expect(fa.leaderDetailModal).toBeVisible({ timeout: 10000 });
    await expect(fa.leaderDetailModal.locator('button.close')).toBeVisible();

    await expect(fa.leaderDetailModalSection('Thông tin chung')).toBeVisible();
    await expect(fa.leaderDetailModalSection('Chức vụ hiện tại')).toBeVisible();
    await expect(fa.leaderDetailModalSection('Cổ phiếu đang nắm giữ')).toHaveCount(0);
    await expect(fa.leaderDetailModalSection('Cổ phiếu đại diện sở hữu')).toHaveCount(0);

    await fa.leaderDetailModalCloseBtn.click();
    await expect(fa.leaderDetailModal).toHaveCount(0);
  });

  test('TC_PTCB_TTC_HSCD_08: Click 1 lãnh đạo đủ dữ liệu — modal hiện nhiều section hơn', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');
    await expect(fa.leaderShipItems.first()).toBeVisible();

    await fa.clickLeaderShipItem('Mai Kiều Liên');
    await expect(fa.leaderDetailModal).toBeVisible({ timeout: 10000 });

    await expect(fa.leaderDetailModalSection('Thông tin chung')).toBeVisible();
    const chucVuRows = fa.leaderDetailModal
      .locator('table')
      .filter({ has: page.getByRole('columnheader', { name: 'Tổ chức' }) })
      .locator('tbody tr');
    await expect(chucVuRows.first()).toBeVisible();
    const chucVuCount = await chucVuRows.count();
    expect(chucVuCount, 'Mai Kiều Liên phải có nhiều chức vụ ở nhiều tổ chức').toBeGreaterThan(1);

    await expect(fa.leaderDetailModalSection('Cổ phiếu đang nắm giữ')).toBeVisible();
    await fa.leaderDetailModalCloseBtn.click();
  });

  test('TC_PTCB_TTC_HSCD_09: Đóng modal chi tiết lãnh đạo bằng nút "×"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');
    await expect(fa.leaderShipItems.first()).toBeVisible();

    await fa.leaderShipItems.first().click();
    await expect(fa.leaderDetailModal).toBeVisible({ timeout: 10000 });
    await fa.leaderDetailModalCloseBtn.click();
    await expect(fa.leaderDetailModal).toHaveCount(0);
  });

});

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab "Cổ đông" (TableShareHolder.vue + ChartAnalysis.vue)', () => {
  test('TC_PTCB_TTC_HSCD_11: Overview khi click sub-tab "Cổ đông"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickTtcSubTab('Cổ đông');
    await expect(fa.ttcSubTab('Cổ đông')).toHaveClass(/active/);

    const headerCells = fa.shareHolderTable.locator('thead th');
    await expect(headerCells).toHaveCount(4);
    await expect(headerCells.nth(0)).toHaveText('Ngày');
    await expect(headerCells.nth(1)).toHaveText('Tên');
    await expect(headerCells.nth(2)).toHaveText('Số lượng cổ phiếu');
    await expect(headerCells.nth(3)).toHaveText('Tỷ lệ sở hữu');

    await expect(fa.tongQuanLabel).toBeVisible();
    await expect(fa.coDongLonChartLabel).toBeVisible();
  });

  test('TC_PTCB_TTC_HSCD_12: Bảng "Cổ đông lớn" hiển thị đủ cột + dữ liệu thật', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Cổ đông');
    await expect(fa.shareHolderRows.first()).toBeVisible({ timeout: 10000 });

    const firstRow = fa.shareHolderRows.first();
    const cells = firstRow.locator('td');
    await expect(cells).toHaveCount(4);
    await expect(cells.nth(0)).toHaveText(/\d{2}-\d{4}/);
    await expect(cells.nth(1)).not.toHaveText('');
    await expect(cells.nth(2)).toHaveText(/[\d,]+/);
    await expect(cells.nth(3)).toHaveText(/%/);
  });

  test('TC_PTCB_TTC_HSCD_13: [Phát hiện] Click vào 1 dòng cổ đông KHÔNG có hành động gì', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Cổ đông');
    await expect(fa.shareHolderRows.first()).toBeVisible({ timeout: 10000 });

    const urlBefore = page.url();
    await fa.shareHolderRows.first().click();
    await page.waitForTimeout(500);

    expect(page.url()).toBe(urlBefore);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('TC_PTCB_TTC_HSCD_14: [Phát hiện] Mã ETF — bảng "Cổ đông lớn" trống hoàn toàn, KHÔNG có thông báo', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'E1VFVN30', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Cổ đông');
    await page.waitForTimeout(2000);

    await expect(fa.shareHolderRows).toHaveCount(0);
    await expect(page.getByText('Không có dữ liệu')).toHaveCount(0);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Panel "Tổng quan" (donut, ChartAnalysis.vue)', () => {
  test('TC_PTCB_TTC_HSCD_15: 2 donut "Tổng quan"/"Cổ đông lớn" hiển thị đúng, không lỗi console', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Cổ đông');

    await expect(fa.tongQuanLabel).toBeVisible();
    await expect(fa.coDongLonChartLabel).toBeVisible();
    await expect(fa.shareHolderCharts).toHaveCount(2, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_HSCD_16: [Phát hiện bug] Mã ETF — donut "Tổng quan" vẫn render, không crash console (phần NaN% chỉ xác nhận qua ảnh chụp thủ công)', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'E1VFVN30', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Cổ đông');

    // Phần automation-verifiable: canvas vẫn render dù dữ liệu NaN, không crash JS. Nội dung "NaN%" trên legend
    // là canvas-drawn (ECharts CanvasRenderer) nên KHÔNG assert được text — đã xác nhận qua ảnh chụp thủ công,
    // xem testcases/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md phát hiện #2.
    await expect(fa.shareHolderCharts).toHaveCount(2, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

});

// Gộp TOÀN BỘ 4 test dùng tài khoản Free của file này (TC_10/17/18/19) vào 1 describe `mode: 'serial'` DUY
// NHẤT — tránh 2+ worker cùng đăng nhập đồng thời 1 tài khoản Free dùng chung (đã đo thật: chạy song song với
// nhiều describe Free riêng lẻ từng gây `test.skip` giả do `errorAlert` thoáng qua khi 2 phiên đăng nhập cùng
// lúc tranh chấp — không phải do sub-tab "Hồ sơ"/"Cổ đông" có vấn đề, tự hồi phục hoàn toàn khi chạy tuần tự).
test.describe('Phân tích cơ bản — Thông tin chung — Hồ sơ/Cổ đông — Free (chạy tuần tự, tránh xung đột đăng nhập đồng thời)', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC_PTCB_TTC_HSCD_10: Free — sub-tab "Hồ sơ" KHÔNG bị khoá gói hội viên ở CẢ nội dung chính lẫn panel lãnh đạo', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Hồ sơ');
    await expect(fa.ttcSubTab('Hồ sơ')).toHaveClass(/active/);
    await expect(fa.protectedView, 'Sub-tab "Hồ sơ" không được có ProtectedView nào (cả nội dung chính lẫn panel lãnh đạo)').toHaveCount(0);
    await expect(fa.profileSubTabItems.first()).toBeVisible();
    await expect(fa.leaderShipItems.first()).toBeVisible();
  });

  test('TC_PTCB_TTC_HSCD_17: [Phát hiện bug] Free — API nguồn dữ liệu "Nước ngoài" của donut không bao giờ được gọi', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const foreignTradingRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('foreign-trading')) foreignTradingRequests.push(req.url());
    });
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Cổ đông');
    await page.waitForTimeout(3000);

    expect(foreignTradingRequests.length, 'Tài khoản Free KHÔNG được gọi API /api/foreign-trading (nguồn dữ liệu "Nước ngoài" của donut)').toBe(0);
  });

  test('TC_PTCB_TTC_HSCD_18: Free — nội dung chính "Cổ đông" (CCol xl=9, key fa_co_dong) KHÔNG bị khoá', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Cổ đông');
    await expect(fa.ttcSubTab('Cổ đông')).toHaveClass(/active/);
    await expect(fa.shareHolderTable, 'Bảng "Cổ đông lớn" (nội dung chính) phải hiển thị bình thường').toBeVisible({ timeout: 10000 });
  });

  test('TC_PTCB_TTC_HSCD_19: Free — panel biểu đồ "Cổ đông" (CCol xl=3, key fa_co_dong_va_gd_co_dong_bieu_do) KHÔNG bị khoá — verify RIÊNG, xác nhận 2 cấp độc lập', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Cổ đông');
    // Verify RIÊNG trong scope panel bên phải (không gộp đếm ProtectedView toàn trang) — đúng bài học rút ra
    // từ tài liệu 1/4 (phát hiện #1b): verify TÁCH RIÊNG từng cấp gate.
    const widgetProtectedView = fa.rightSidePanel.locator('.image-container .blurred-image');
    await expect(widgetProtectedView, 'Panel biểu đồ phụ trợ (CCol xl=3) không được có ProtectedView riêng').toHaveCount(0);
    await expect(fa.shareHolderCharts, 'Panel biểu đồ phải render bình thường').toHaveCount(2, { timeout: 10000 });

    // Xác nhận tổng thể: CẢ 2 cấp cùng không bị khoá (khớp TC_PTCB_TTC_HSCD_18).
    await expect(fa.protectedView).toHaveCount(0);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Hồ sơ/Cổ đông — Tương tác chung', () => {
  test('TC_PTCB_TTC_HSCD_20: Chuyển qua lại "Hồ sơ" ↔ "Cổ đông" nhiều lần không lỗi console', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    for (let round = 0; round < 2; round++) {
      await fa.clickTtcSubTab('Hồ sơ');
      await page.waitForTimeout(200);
      await fa.clickTtcSubTab('Cổ đông');
      await page.waitForTimeout(200);
    }
    await expect(fa.ttcSubTab('Cổ đông')).toHaveClass(/active/);
    await expect(fa.shareHolderTable).toBeVisible({ timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_HSCD_21: Đổi mã CK khi đang ở "Cổ đông" — bảng + donut cập nhật đúng theo mã mới', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Cổ đông');
    await expect(fa.shareHolderRows.first()).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2500);
    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2000);

    await expect(fa.ttcSubTab('Cổ đông')).toHaveClass(/active/);
    await expect(fa.shareHolderRows.first()).toBeVisible({ timeout: 10000 });
    await expect(fa.shareHolderCharts).toHaveCount(2, { timeout: 10000 });

    await resetToVNM(page, fa);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Hồ sơ/Cổ đông — Responsive', () => {
  test('TC_PTCB_TTC_HSCD_22: Responsive viewport mobile/tablet cho cả 2 sub-tab', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Hồ sơ');
    await expect(fa.leaderShipItems.first()).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.profileSubTabItems.first()).toBeVisible();
    await expect(fa.leaderShipPanel).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.profileSubTabItems.first()).toBeVisible();
    await expect(fa.leaderShipPanel).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await fa.clickTtcSubTab('Cổ đông');
    await expect(fa.shareHolderTable).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.shareHolderTable).toBeVisible();
    await expect(fa.tongQuanLabel).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.shareHolderTable).toBeVisible();
    await expect(fa.tongQuanLabel).toBeVisible();
  });
});
