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

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab "Thông tin giao dịch" (TableInfoTransaction.vue + ChartAnalysis.vue)', () => {
  test('TC_PTCB_TTC_GDSK_01: Overview + cấu trúc bảng khi click sub-tab "Thông tin giao dịch"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickTtcSubTab('Thông tin giao dịch');
    await expect(fa.ttcSubTab('Thông tin giao dịch')).toHaveClass(/active/);

    const headerRows = fa.insiderTradingTable.locator('thead tr');
    await expect(headerRows).toHaveCount(2);
    await expect(headerRows.first()).toContainText('Người liên quan');
    await expect(headerRows.first()).toContainText('Đăng ký');
    await expect(headerRows.first()).toContainText('Kết quả');
    await expect(headerRows.nth(1)).toContainText('Ngày bắt đầu');
    await expect(headerRows.nth(1)).toContainText('Ngày kết thúc');
    await expect(headerRows.nth(1)).toContainText('Ngày thực hiện');
    await expect(fa.insiderTradingRows.first()).toBeVisible({ timeout: 10000 });

    await expect(fa.tongQuanLabel).toBeVisible();
    await expect(fa.coDongLonChartLabel).toBeVisible();
  });

  test('TC_PTCB_TTC_GDSK_03: [Phát hiện] Panel bên phải tái sử dụng ChartAnalysis.vue — nội dung KHÔNG liên quan giao dịch nội bộ', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Thông tin giao dịch');

    await expect(fa.tongQuanLabel).toBeVisible();
    await expect(fa.coDongLonChartLabel).toBeVisible();
    await expect(fa.rightSidePanel).not.toContainText('giao dịch nội bộ');
    await expect(fa.rightSidePanel.locator('canvas')).toHaveCount(2, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_GDSK_05: Đổi mã CK — bảng + panel cập nhật đúng theo mã mới', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Thông tin giao dịch');
    await expect(fa.insiderTradingRows.first()).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2500);
    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2000);

    await expect(fa.ttcSubTab('Thông tin giao dịch')).toHaveClass(/active/);
    await expect(fa.rightSidePanel.locator('canvas')).toHaveCount(2, { timeout: 10000 });

  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab "Sự kiện" — Bảng + 3 sub-tab con (Events.vue)', () => {
  test('TC_PTCB_TTC_GDSK_06: Overview khi click sub-tab "Sự kiện" — 3 sub-tab con, "Niêm yết" active mặc định', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickTtcSubTab('Sự kiện');
    await expect(fa.ttcSubTab('Sự kiện')).toHaveClass(/active/);

    await expect(fa.eventsSubTab('Niêm yết')).toHaveClass(/active/);
    await expect(fa.eventsSubTab('Cổ tức, thưởng và phát hành thêm')).not.toHaveClass(/active/);
    await expect(fa.eventsSubTab('Đại hội cổ đông')).not.toHaveClass(/active/);

    const headerCells = fa.eventsTable.locator('thead th');
    await expect(headerCells).toHaveCount(4);
    await expect(headerCells.nth(0)).toHaveText('STT');
    await expect(headerCells.nth(1)).toHaveText('Mã CK');
    await expect(headerCells.nth(2)).toHaveText('Ngày');
    await expect(headerCells.nth(3)).toHaveText('Nội dung');
    // Cập nhật 10/11/2026: `get-list-event` của VNM hiện chỉ còn 1 sự kiện loại "Cổ tức" (Niêm yết/ĐHĐCĐ rỗng) → dùng nhóm "Cổ tức".
    await fa.clickEventsSubTab('Cổ tức, thưởng và phát hành thêm');
    await expect(fa.eventsRows.first().locator('td').nth(2)).toHaveText(/\d{2}-\d{2}-\d{4}/, { timeout: 10000 });

    await expect(fa.coTucBangTienLabel).toBeVisible();
    await expect(fa.coTucBangCoPhieuLabel).toBeVisible();
  });

  test('TC_PTCB_TTC_GDSK_07: Click "Cổ tức, thưởng và phát hành thêm" — list đổi đúng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');
    await expect(fa.eventsRows.first()).toBeVisible({ timeout: 10000 });

    await fa.clickEventsSubTab('Cổ tức, thưởng và phát hành thêm');
    await expect(fa.eventsSubTab('Cổ tức, thưởng và phát hành thêm')).toHaveClass(/active/);
    await expect(fa.eventsSubTab('Niêm yết')).not.toHaveClass(/active/);
    await expect(fa.eventsRows.first()).toBeVisible({ timeout: 10000 });
    await expect(fa.eventsRows.first()).toContainText(/cổ tức|Thưởng/i);
  });

  test('TC_PTCB_TTC_GDSK_09: Click lại "Niêm yết" — quay về đúng nội dung ban đầu', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');
    const niemYetTextBefore = await fa.eventsRows.first().textContent();

    await fa.clickEventsSubTab('Đại hội cổ đông');
    await expect(fa.eventsSubTab('Đại hội cổ đông')).toHaveClass(/active/);
    await fa.clickEventsSubTab('Niêm yết');

    await expect(fa.eventsSubTab('Niêm yết')).toHaveClass(/active/);
    const niemYetTextAfter = await fa.eventsRows.first().textContent();
    expect(niemYetTextAfter).toEqual(niemYetTextBefore);
  });

  test('TC_PTCB_TTC_GDSK_10: Click 1 dòng sự kiện — mở modal "Chi tiết sự kiện" hiển thị nội dung HTML', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');
    // Cập nhật 10/11/2026: `get-list-event` của VNM hiện chỉ còn 1 sự kiện loại "Cổ tức" (Niêm yết/ĐHĐCĐ rỗng) → dùng nhóm "Cổ tức".
    await fa.clickEventsSubTab('Cổ tức, thưởng và phát hành thêm');
    await expect(fa.eventsRows.first().locator('td').nth(2)).toBeVisible({ timeout: 10000 });

    await fa.eventsRows.first().click();
    await expect(fa.eventDetailModal).toBeVisible({ timeout: 10000 });
    await expect(fa.eventDetailModalCloseBtn).toBeVisible();
    await page.waitForTimeout(1000);
    const modalText = await fa.eventDetailModal.textContent();
    expect(modalText?.trim().length, 'Nội dung modal chi tiết sự kiện phải không rỗng').toBeGreaterThan(20);
  });

  test('TC_PTCB_TTC_GDSK_11: Đóng modal "Chi tiết sự kiện" bằng nút "×"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');
    // Cập nhật 10/11/2026: `get-list-event` của VNM hiện chỉ còn 1 sự kiện loại "Cổ tức" (Niêm yết/ĐHĐCĐ rỗng) → dùng nhóm "Cổ tức".
    await fa.clickEventsSubTab('Cổ tức, thưởng và phát hành thêm');
    await expect(fa.eventsRows.first().locator('td').nth(2)).toBeVisible({ timeout: 10000 });

    await fa.eventsRows.first().click();
    await expect(fa.eventDetailModal).toBeVisible({ timeout: 10000 });
    await fa.eventDetailModalCloseBtn.click();
    await expect(fa.eventDetailModal).toHaveCount(0);
  });

  test('TC_PTCB_TTC_GDSK_12: Bảng rỗng (mock API get-list-event) — hiển thị "Không có dữ liệu" đúng #no-items-view', async ({ page }) => {
    await loginFirst(page);
    // Mock RIÊNG API chỉ-đọc get-list-event trả về mảng rỗng — an toàn tuyệt đối, không mutate dữ liệu thật.
    await page.route('**/get-list-event**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');

    // CoreUI `<CDataTable>` render slot `#no-items-view` NHƯ 1 DÒNG `<tr>` (colspan toàn bộ cột) NẰM NGAY
    // TRONG `tbody`, không phải phần tử tách biệt ngoài bảng — nên `eventsRows` (đếm `tbody tr`) vẫn đếm ra 1
    // (chính dòng "Không có dữ liệu" đó), KHÔNG phải 0. Verify đúng: còn đúng 1 "dòng" (dòng thông báo), và
    // dòng đó chứa text "Không có dữ liệu".
    await expect(fa.eventsNoDataText).toBeVisible({ timeout: 10000 });
    await expect(fa.eventsRows).toHaveCount(1);
    await expect(fa.eventsRows.first()).toContainText('Không có dữ liệu');
  });

  test('TC_PTCB_TTC_GDSK_13: [Phát hiện] Sub-tab con KHÔNG reset khi đổi mã CK', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');
    await fa.clickEventsSubTab('Cổ tức, thưởng và phát hành thêm');
    await expect(fa.eventsSubTab('Cổ tức, thưởng và phát hành thêm')).toHaveClass(/active/);

    await page.waitForTimeout(2500);
    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2000);

    await expect(
      fa.eventsSubTab('Cổ tức, thưởng và phát hành thêm'),
      'Vẫn ở "Cổ tức, thưởng và phát hành thêm" sau khi đổi mã CK (không tự reset)'
    ).toHaveClass(/active/);

  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Panel biểu đồ "Sự kiện" (ChartEvents.vue)', () => {
  test('TC_PTCB_TTC_GDSK_14: 2 biểu đồ cột "Cổ tức bằng tiền"/"Cổ tức bằng cổ phiếu" hiển thị đúng, không lỗi console', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');

    await expect(fa.coTucBangTienLabel).toBeVisible();
    await expect(fa.coTucBangCoPhieuLabel).toBeVisible();
    await expect(fa.eventsCharts).toHaveCount(2, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Xác nhận phạm vi sub-tab "Sự kiện"', () => {
  test('TC_PTCB_TTC_GDSK_15: [Xác nhận phạm vi] Sub-tab "Sự kiện" KHÔNG chứa biểu đồ nến TradingView/modal phóng to P/E-P/B', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Sự kiện');
    await expect(fa.eventsRows.first()).toBeVisible({ timeout: 10000 });

    // Biểu đồ nến (#tv_chart_container) chỉ thuộc Left.vue, LUÔN hiển thị bất kể sub-tab — phải đúng 1 trên
    // trang, KHÔNG có thêm 1 instance thứ 2 nào phát sinh khi ở sub-tab "Sự kiện".
    await expect(page.locator('#tv_chart_container')).toHaveCount(1);
  });
});

// Gộp TOÀN BỘ 5 test dùng tài khoản Free của file này (TC_16/17/18/19/20) vào 1 describe `mode: 'serial'` DUY
// NHẤT — tránh 2+ worker cùng đăng nhập đồng thời 1 tài khoản Free dùng chung (cùng bài học đã rút ra và áp dụng
// ở tài liệu 2/4: chạy song song với nhiều describe Free riêng lẻ từng gây `test.skip` giả do đăng nhập tranh
// chấp, không phải do bản thân 2 sub-tab có vấn đề).
test.describe('Phân tích cơ bản — Thông tin chung — Giao dịch/Sự kiện — Free (chạy tuần tự, tránh xung đột đăng nhập đồng thời)', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC_PTCB_TTC_GDSK_16: Free — "Thông tin giao dịch" nội dung chính (key fa_giao_dich_noi_bo) BỊ khoá', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Thông tin giao dịch');
    await expect(fa.ttcSubTab('Thông tin giao dịch')).toHaveClass(/active/);
    await expect(fa.protectedView, 'Đúng 1 ProtectedView trên toàn trang (nội dung chính bị khoá)').toHaveCount(1);
  });

  test('TC_PTCB_TTC_GDSK_17: Free — "Thông tin giao dịch" panel biểu đồ (key fa_co_dong_va_gd_co_dong_bieu_do) KHÔNG bị khoá — verify RIÊNG', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Thông tin giao dịch');
    const widgetProtectedView = fa.rightSidePanel.locator('.image-container .blurred-image');
    await expect(widgetProtectedView, 'Panel biểu đồ phụ trợ (CCol xl=3) không được có ProtectedView riêng').toHaveCount(0);
    await expect(fa.rightSidePanel.locator('canvas'), 'Panel biểu đồ phải render bình thường').toHaveCount(2, { timeout: 10000 });
  });

  test('TC_PTCB_TTC_GDSK_18: Free — "Sự kiện" nội dung chính (key fa_su_kien) KHÔNG bị khoá', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Sự kiện');
    await expect(fa.ttcSubTab('Sự kiện')).toHaveClass(/active/);
    await expect(fa.eventsTable, 'Bảng sự kiện (nội dung chính) phải hiển thị bình thường').toBeVisible({ timeout: 10000 });
    await expect(fa.eventsSubTabItems.first()).toBeVisible();
  });

  test('TC_PTCB_TTC_GDSK_19: Free — "Sự kiện" panel biểu đồ (key fa_bieu_do_co_tuc) KHÔNG bị khoá — verify RIÊNG, xác nhận CẢ 2 cấp cùng không khoá', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Sự kiện');
    const widgetProtectedView = fa.rightSidePanel.locator('.image-container .blurred-image');
    await expect(widgetProtectedView, 'Panel ChartEvents (CCol xl=3) không được có ProtectedView riêng').toHaveCount(0);
    await expect(fa.eventsCharts, 'Panel biểu đồ phải render bình thường').toHaveCount(2, { timeout: 10000 });

    // Xác nhận tổng thể: CẢ 2 cấp cùng không bị khoá (khớp TC_PTCB_TTC_GDSK_18).
    await expect(fa.protectedView).toHaveCount(0);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Giao dịch/Sự kiện — Tương tác chung', () => {
  test('TC_PTCB_TTC_GDSK_21: Chuyển qua lại "Thông tin giao dịch" ↔ "Sự kiện" nhiều lần không lỗi console', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    for (let round = 0; round < 2; round++) {
      await fa.clickTtcSubTab('Thông tin giao dịch');
      await page.waitForTimeout(200);
      await fa.clickTtcSubTab('Sự kiện');
      await page.waitForTimeout(200);
    }
    await expect(fa.ttcSubTab('Sự kiện')).toHaveClass(/active/);
    await expect(fa.eventsTable).toBeVisible({ timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Giao dịch/Sự kiện — Responsive', () => {
  test('TC_PTCB_TTC_GDSK_22: Responsive viewport mobile/tablet cho cả 2 sub-tab', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickTtcSubTab('Thông tin giao dịch');
    await expect(fa.insiderTradingRows.first()).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.insiderTradingTable).toBeVisible();
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.insiderTradingTable).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await fa.clickTtcSubTab('Sự kiện');
    await expect(fa.eventsTable).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.eventsTable).toBeVisible();
    await expect(fa.eventsSubTabItems.first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.eventsTable).toBeVisible();
    await expect(fa.eventsSubTabItems.first()).toBeVisible();
  });
});
