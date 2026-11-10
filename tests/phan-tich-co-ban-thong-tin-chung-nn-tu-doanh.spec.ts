import { test, expect } from '@playwright/test';
import { FaAnalysisPage, useFaSafetyNet } from '../pages/FaAnalysisPage';

/**
 * Cập nhật 10/11/2026: chạy trên BASE_URL (localhost:8080, nhánh preprod) — backend PRODUCTION. Đăng nhập bằng phiên
 * cache `Prev2Session` qua `fa.login` (chặn ghi setting → đổi mã CK giữa test KHÔNG còn đổi "mã đang xem" của tài
 * khoản dùng chung, nên bỏ bước reset về VNM cuối test); mọi request ghi khác bị lưới `FaSafetyNet` huỷ.
 */
useFaSafetyNet(test);

async function loginFirst(page: any) {
  await new FaAnalysisPage(page).login('paid');
}

async function loginFreeOrSkip(page: any) {
  await new FaAnalysisPage(page).login('free');
}

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab "Nước ngoài" (TableForeignTransaction.vue + ChartForeignTransaction.vue)', () => {
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

