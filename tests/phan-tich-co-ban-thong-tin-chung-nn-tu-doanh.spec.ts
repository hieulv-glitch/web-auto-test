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

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab "Nước ngoài" (TableForeignTransaction.vue + ChartForeignTransaction.vue)', () => {
  test('TC_PTCB_TTC_NNTD_01: Overview + cấu trúc bảng khi click sub-tab "Nước ngoài"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.ttcSubTab('Nước ngoài')).toHaveClass(/active/);

    const headerRows = fa.foreignTransactionTable.locator('thead tr');
    await expect(headerRows).toHaveCount(2);
    await expect(headerRows.first()).toContainText('Mua');
    await expect(headerRows.first()).toContainText('Bán');
    await expect(headerRows.first()).toContainText('KLGD ròng');
    await expect(headerRows.first()).toContainText('GTGD ròng');
    await expect(headerRows.first()).toContainText('Room còn lại');
    await expect(headerRows.first()).toContainText('Đang sở hữu');
    await expect(headerRows.nth(1)).toContainText('Khối lượng');
    await expect(headerRows.nth(1)).toContainText('Giá trị');

    const headerCellsRow2 = headerRows.nth(1).locator('th');
    await expect(headerCellsRow2).toHaveCount(4);
    await expect(fa.foreignTransactionRows.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC_PTCB_TTC_NNTD_02: Định dạng dữ liệu — màu giá theo %, dấu phẩy nghìn, % sở hữu', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.foreignTransactionRows.first()).toBeVisible({ timeout: 10000 });

    const firstRowCells = fa.foreignTransactionRows.first().locator('td');
    // Cột "Giá" (index 1) có class màu theo % thay đổi.
    await expect(firstRowCells.nth(1)).toHaveClass(/text-(up|down|no)change/);
    // Cột "Đang sở hữu" (cột cuối, index 9) có hậu tố "%".
    await expect(firstRowCells.nth(9)).toHaveText(/%$/);

    const cellTexts = await firstRowCells.allTextContents();
    const hasThousandsComma = cellTexts.some((t) => /\d{1,3}(,\d{3})+/.test(t));
    expect(hasThousandsComma, 'Ít nhất 1 cột số phải có dấu phẩy ngăn cách hàng nghìn').toBe(true);
  });

  test('TC_PTCB_TTC_NNTD_03: Panel bên phải — 2 biểu đồ "GDNN mua ròng 20 phiên" + "Tổng quan"', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Nước ngoài');

    await expect(fa.gdnnChartLabel).toBeVisible();
    await expect(fa.tongQuanLabel).toBeVisible();
    await expect(fa.rightSidePanel.locator('canvas')).toHaveCount(2, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_NNTD_04: Phân trang bảng — click trang 2 gọi lại API đúng trang, dữ liệu đổi', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.foreignTransactionRows.first()).toBeVisible({ timeout: 10000 });
    const firstRowTextBefore = await fa.foreignTransactionRows.first().textContent();

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('get-list-foreign-transaction')) requests.push(req.url());
    });
    await fa.paginationPageLink(2).click();
    await page.waitForTimeout(2000);

    expect(requests.some((u) => u.includes('page=2')), 'Phải gọi lại API với page=2').toBe(true);
    const firstRowTextAfter = await fa.foreignTransactionRows.first().textContent();
    expect(firstRowTextAfter).not.toEqual(firstRowTextBefore);
  });

  test('TC_PTCB_TTC_NNTD_05: Đổi mã CK — bảng + panel cập nhật đúng theo mã mới', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.foreignTransactionRows.first()).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2500);
    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2500);

    await expect(fa.ttcSubTab('Nước ngoài')).toHaveClass(/active/);
    await expect(fa.foreignTransactionRows.first()).toBeVisible({ timeout: 10000 });
    await expect(fa.rightSidePanel.locator('canvas')).toHaveCount(2, { timeout: 10000 });

    await resetToVNM(page, fa);
  });

  test('TC_PTCB_TTC_NNTD_06: [Phát hiện, cross-ref] Mã ETF — donut "Tổng quan" không crash dù dữ liệu NaN', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'E1VFVN30', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Nước ngoài');

    // Phần "không crash" là phần DUY NHẤT assert được bằng code — nội dung NaN% chỉ xác nhận qua ảnh chụp thủ
    // công (ECharts CanvasRenderer, không có DOM text thật để getByText tìm được — cùng giới hạn kỹ thuật đã
    // ghi ở tài liệu 2/4, TC_PTCB_TTC_HSCD_16).
    await expect(fa.rightSidePanel.locator('canvas')).toHaveCount(2, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
    await page.screenshot({ path: 'test-results/nntd-etf-nan-donut.png' });
  });

  test('TC_PTCB_TTC_NNTD_07: [Phát hiện] Bảng rỗng (mock API) — KHÔNG có thông báo "Không có dữ liệu"', async ({ page }) => {
    await loginFirst(page);
    // Mock RIÊNG API chỉ-đọc get-list-foreign-transaction trả về mảng rỗng — an toàn tuyệt đối.
    await page.route('**/get-list-foreign-transaction**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Nước ngoài');
    await page.waitForTimeout(2000);

    await expect(fa.foreignTransactionRows).toHaveCount(0);
    await expect(fa.eventsNoDataText).toHaveCount(0);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab "Tự doanh" (TableProprietaryTransaction.vue + ChartProprietaryTransaction.vue — tự fetch riêng)', () => {
  test('TC_PTCB_TTC_NNTD_08: Overview + cấu trúc bảng khi click sub-tab "Tự doanh" — TỰ gọi API riêng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('proprietary-trading')) requests.push(req.url());
    });
    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.ttcSubTab('Tự doanh')).toHaveClass(/active/);
    await expect(fa.proprietaryTransactionRows.first()).toBeVisible({ timeout: 10000 });

    expect(requests.some((u) => u.includes('/api/proprietary-trading/paginate') && u.includes('stockcode=VNM'))).toBe(true);

    const headerRows = fa.proprietaryTransactionTable.locator('thead tr');
    await expect(headerRows).toHaveCount(2);
    await expect(headerRows.first()).toContainText('Mua');
    await expect(headerRows.first()).toContainText('Bán');
    await expect(headerRows.first()).toContainText('KLGD ròng');
    await expect(headerRows.first()).toContainText('GTGD ròng');
    // KHÁC "Nước ngoài" — KHÔNG có cột "Room còn lại"/"Đang sở hữu".
    await expect(headerRows.first()).not.toContainText('Room còn lại');
    await expect(headerRows.first()).not.toContainText('Đang sở hữu');
  });

  test('TC_PTCB_TTC_NNTD_09: Panel bên phải — 1 biểu đồ "GDTD mua ròng 20 phiên", API riêng khác bảng', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const requests: string[] = [];
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    page.on('request', (req) => {
      if (req.url().includes('proprietary-trading')) requests.push(req.url());
    });
    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.gdtdChartLabel).toBeVisible({ timeout: 10000 });

    // API biểu đồ KHÔNG có tham số phân trang, endpoint riêng khác bảng (`/paginate`).
    const chartRequest = requests.find((u) => u.includes('stockcode=VNM') && !u.includes('/paginate'));
    expect(chartRequest, 'Phải có request /api/proprietary-trading (không phân trang) cho biểu đồ').toBeTruthy();

    await expect(fa.rightSidePanel.locator('canvas')).toHaveCount(1, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_NNTD_10: Phân trang bảng "Tự doanh" — tự chứa, KHÔNG qua Right.vue/Common/index.vue', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.proprietaryTransactionRows.first()).toBeVisible({ timeout: 10000 });
    const firstRowTextBefore = await fa.proprietaryTransactionRows.first().textContent();

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/proprietary-trading/paginate')) requests.push(req.url());
    });
    await fa.paginationPageLink(2).click();
    await page.waitForTimeout(2000);

    expect(requests.some((u) => u.includes('page=2')), 'Phải gọi lại /paginate với page=2').toBe(true);
    const firstRowTextAfter = await fa.proprietaryTransactionRows.first().textContent();
    expect(firstRowTextAfter).not.toEqual(firstRowTextBefore);
  });

  test('TC_PTCB_TTC_NNTD_11: Đổi mã CK — bảng + biểu đồ TỰ cập nhật qua watch $store.state.mack riêng', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.proprietaryTransactionRows.first()).toBeVisible({ timeout: 10000 });

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('proprietary-trading')) requests.push(req.url());
    });
    await page.waitForTimeout(2500);
    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2500);

    expect(requests.some((u) => u.includes('/api/proprietary-trading/paginate') && u.includes('stockcode=HPG'))).toBe(true);
    expect(requests.some((u) => u.includes('/api/proprietary-trading?') && u.includes('stockcode=HPG'))).toBe(true);
    await expect(fa.proprietaryTransactionRows.first()).toBeVisible({ timeout: 10000 });
    await expect(fa.rightSidePanel.locator('canvas')).toHaveCount(1, { timeout: 10000 });

    await resetToVNM(page, fa);
  });

  test('TC_PTCB_TTC_NNTD_12: [Phát hiện] Bảng rỗng (mock API) — KHÔNG có thông báo "Không có dữ liệu"', async ({ page }) => {
    await loginFirst(page);
    // Mock RIÊNG API chỉ-đọc proprietary-trading/paginate — an toàn tuyệt đối.
    await page.route('**/api/proprietary-trading/paginate**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], last_page: 1 }),
    }));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Tự doanh');
    await page.waitForTimeout(2000);

    await expect(fa.proprietaryTransactionRows).toHaveCount(0);
    await expect(fa.eventsNoDataText).toHaveCount(0);
  });
});

// Gộp TOÀN BỘ 4 test dùng tài khoản Free của file này (TC_13/14/15/16) vào 1 describe `mode: 'serial'` DUY
// NHẤT — tránh 2+ worker cùng đăng nhập đồng thời 1 tài khoản Free dùng chung (cùng bài học đã rút ra và áp
// dụng ở tài liệu 2/4, 3/4: chạy song song với nhiều describe Free riêng lẻ từng gây `test.skip` giả do đăng
// nhập tranh chấp).
test.describe('Phân tích cơ bản — Thông tin chung — Nước ngoài/Tự doanh — Free (chạy tuần tự, tránh xung đột đăng nhập đồng thời)', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC_PTCB_TTC_NNTD_13: Free — "Nước ngoài" bị khoá CẢ 2 cấp (fa_nuoc_ngoai + fa_nuoc_ngoai_bieu_do)', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.ttcSubTab('Nước ngoài')).toHaveClass(/active/);
    await expect(fa.protectedView, 'Đúng 2 ProtectedView (nội dung chính + panel biểu đồ đều bị khoá)').toHaveCount(2);
  });

  test('TC_PTCB_TTC_NNTD_14: Free — "Tự doanh" bị khoá CẢ 2 cấp (fa_tu_doanh + fa_tu_doanh_bieu_do)', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.ttcSubTab('Tự doanh')).toHaveClass(/active/);
    await expect(fa.protectedView, 'Đúng 2 ProtectedView (nội dung chính + panel biểu đồ đều bị khoá)').toHaveCount(2);
  });

  test('TC_PTCB_TTC_NNTD_15: [Phát hiện, cross-ref] Free — "Nước ngoài" KHÔNG lãng phí request nào (gate đối xứng)', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    const requests: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('get-list-foreign-transaction') || u.includes('get-count-page-foreign-transaction') || u.includes('/api/foreign-trading')) {
        requests.push(u);
      }
    });

    await fa.clickTtcSubTab('Nước ngoài');
    await page.waitForTimeout(2500);
    expect(requests, 'KHÔNG có request nào tới 3 API nguồn dữ liệu "Nước ngoài" khi vào sub-tab').toEqual([]);

    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2500);
    expect(requests, 'KHÔNG có request nào tới 3 API nguồn dữ liệu "Nước ngoài" sau khi đổi mã CK').toEqual([]);

    await resetToVNM(page, fa);
  });

  test('TC_PTCB_TTC_NNTD_16: [Phát hiện MỚI] Free — "Tự doanh": biểu đồ VẪN lãng phí gọi API dù bị khoá, bảng thì KHÔNG', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    const paginateRequests: string[] = [];
    const chartRequests: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('/api/proprietary-trading/paginate')) paginateRequests.push(u);
      else if (u.includes('/api/proprietary-trading')) chartRequests.push(u);
    });

    await fa.clickTtcSubTab('Tự doanh');
    await page.waitForTimeout(2500);
    expect(paginateRequests, 'Bảng (CCol xl=9) bị chặn mount hoàn toàn — KHÔNG được gọi /paginate').toEqual([]);
    expect(chartRequests.length, 'Biểu đồ (CCol xl=3) VẪN mount và gọi API dù bị ProtectedView khoá').toBeGreaterThan(0);

    chartRequests.length = 0;
    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2500);
    expect(paginateRequests, 'Bảng vẫn KHÔNG được gọi /paginate sau khi đổi mã CK').toEqual([]);
    expect(chartRequests.some((u) => u.includes('stockcode=HPG')), 'Biểu đồ vẫn lãng phí gọi API sau khi đổi mã CK').toBe(true);

    await resetToVNM(page, fa);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Nước ngoài/Tự doanh — Tương tác chung + Xác nhận phạm vi', () => {
  test('TC_PTCB_TTC_NNTD_17: Chuyển qua lại "Nước ngoài" ↔ "Tự doanh" nhiều lần không lỗi console', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    for (let round = 0; round < 2; round++) {
      await fa.clickTtcSubTab('Nước ngoài');
      await page.waitForTimeout(200);
      await fa.clickTtcSubTab('Tự doanh');
      await page.waitForTimeout(200);
    }
    await expect(fa.ttcSubTab('Tự doanh')).toHaveClass(/active/);
    await expect(fa.proprietaryTransactionRows.first()).toBeVisible({ timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_NNTD_18: [Xác nhận phạm vi] Không có donut "Tổng quan"/"Cổ đông lớn" (ChartAnalysis.vue) lọt vào 2 sub-tab này', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.rightSidePanel).toBeVisible();
    await expect(fa.rightSidePanel).not.toContainText('Cổ đông lớn');

    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.rightSidePanel).toBeVisible();
    await expect(fa.rightSidePanel).not.toContainText('Cổ đông lớn');
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Nước ngoài/Tự doanh — Responsive', () => {
  test('TC_PTCB_TTC_NNTD_19: Responsive viewport mobile/tablet cho cả 2 sub-tab', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.foreignTransactionRows.first()).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.foreignTransactionTable).toBeVisible();
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.foreignTransactionTable).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.proprietaryTransactionRows.first()).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.proprietaryTransactionTable).toBeVisible();
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.proprietaryTransactionTable).toBeVisible();
  });
});
