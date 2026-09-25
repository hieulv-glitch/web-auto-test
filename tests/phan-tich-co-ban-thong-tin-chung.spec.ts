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

/** Reset lại mã VNM qua ô search — dùng cho các test đổi mã CK giữa chừng (không qua `goto()`), để không ảnh
 * hưởng test khác chạy song song (tài khoản test dùng chung, `final_mack` lưu server-side). */
async function resetToVNM(page: any, fa: FaAnalysisPage) {
  await fa.searchInput.fill('VNM');
  await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().waitFor({ state: 'visible' });
  await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().click();
}

test.describe('Phân tích cơ bản — Thông tin chung — Cột trái (Left.vue)', () => {
  test('TC_PTCB_TTC_01: Overview cột trái khi vào tab mặc định', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });

    await expect(fa.stockNameHeader).toContainText('(VNM)');
    await expect(fa.stockNameHeader).toContainText('HOSE');
    await expect(fa.watchlistStarIcon).toBeVisible();
    await expect(fa.alertBellIcon).toBeVisible();
    await expect(fa.addTransactionIcon).toBeVisible();
    await expect(fa.candleChartContainer).toBeVisible();
    await expect(fa.candleTimeframeButton('1m')).toHaveClass(/active/);
    await expect(fa.companyInfoTable).toBeVisible();
    await expect(fa.companyInfoRows.first()).toBeVisible();
  });

  test('TC_PTCB_TTC_02: Bảng "Thông tin chung" hiển thị đủ field công ty', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.companyInfoRows.first()).toBeVisible();

    const labels = [
      'Mã',
      'Tên công ty',
      'Trang web',
      'Sàn niêm yết',
      'Địa chỉ trụ sở',
      'Vốn điều lệ',
      'Vốn hóa thị trường',
      'Số lượng nhân sự',
      'Mã ngành ICB',
      'Tên ngành ICB',
      'Cấp ngành ICB',
      'Số lượng cổ phiếu',
      'FreeFloat',
      'EPS điều chỉnh',
      'BVPS điều chỉnh',
    ];
    for (const label of labels) {
      const row = fa.companyInfoRowByLabel(label);
      await expect(row, `Dòng "${label}" phải tồn tại`).toHaveCount(1);
      const cells = row.locator('td');
      await expect(cells.nth(1), `Dòng "${label}" phải có giá trị`).not.toHaveText('');
    }
    await expect(fa.companyInfoRowByLabel('Trang web').locator('a')).toHaveAttribute('target', '_blank');
  });

  test('TC_PTCB_TTC_03: 3 dòng bổ sung Beta/Mức độ biến động/Lợi nhuận kỳ vọng (CAPM) từ socket riêng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.companyInfoRows.first()).toBeVisible();

    const rows = fa.companyInfoRows;
    const count = await rows.count();
    await expect(rows.nth(count - 3)).toContainText('Beta');
    await expect(rows.nth(count - 2)).toContainText('Mức độ biến động');
    await expect(rows.nth(count - 2)).toContainText('%');
    await expect(rows.nth(count - 1)).toContainText('Lợi nhuận kỳ vọng (CAPM)');
    await expect(rows.nth(count - 1)).toContainText('%');
  });

  test('TC_PTCB_TTC_04: Biểu đồ nến — đổi khung thời gian (1d/1m/3m/6m/1y/3y/5y)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await fa.waitForCandleChartReady();

    for (const label of ['3m', '1y', '5y', '1d']) {
      await fa.clickCandleTimeframe(label);
      await page.waitForTimeout(400);
      await expect(fa.candleTimeframeButton(label)).toHaveClass(/active/);
      // `.active` là class trên CHÍNH div khung thời gian (không phải phần tử con) — dùng CSS combinator
      // `> div.active` để đếm đúng, không dùng `.locator('.active')` (tìm descendant, luôn 0 vì class nằm trên
      // chính div đang xét).
      await expect(page.locator('.custom-timeframe-selector > div.active')).toHaveCount(1);
    }
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_05: Icon đổi loại biểu đồ (nến/đường/vùng/cột) chuyển đúng thứ tự', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await fa.waitForCandleChartReady();

    await expect(fa.chartTypeIconImg).toHaveAttribute('src', /candle/);
    const expectedOrder = ['line', 'area', 'bar', 'candle'];
    for (const expected of expectedOrder) {
      await fa.chartTypeToggleIcon.click();
      await page.waitForTimeout(200);
      await expect(fa.chartTypeIconImg).toHaveAttribute('src', new RegExp(expected));
    }
  });

  test('TC_PTCB_TTC_06: Icon chỉ báo kỹ thuật (fx) mở dropdown danh sách indicator', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await fa.waitForCandleChartReady();

    await fa.indicatorFxToggle.click();
    await expect(fa.indicatorDropdownList).toBeVisible();
    await expect(fa.indicatorOptions).toHaveCount(11);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await fa.indicatorOption('RSI').click();
    await page.waitForTimeout(300);
    await expect(fa.indicatorDropdownList).toBeHidden();
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_07: Click icon watchlist (star) mở dropdown "Chọn watchlist"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.watchlistStarIcon).toBeVisible();

    await fa.watchlistStarIcon.click();
    await expect(fa.watchlistDropdownText('VNM')).toBeVisible();
  });

  test('TC_PTCB_TTC_08: Click icon "Tạo cảnh báo" mở modal "Tạo cảnh báo"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.alertBellIcon).toBeVisible();

    await fa.alertBellIcon.click();
    await expect(fa.alertModal).toBeVisible();
  });

  test('TC_PTCB_TTC_09: Icon "Thêm giao dịch" chỉ hiện với mã loại cổ phiếu, click mở modal "Thêm giao dịch"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.addTransactionIcon).toBeVisible();

    await fa.addTransactionIcon.click();
    await expect(fa.quickTransactionModal).toBeVisible();
  });

  test.describe('Free', () => {
    test.describe.configure({ mode: 'serial' });

    test('TC_PTCB_TTC_10: Free — click icon "Tạo cảnh báo"/"Thêm giao dịch" mở modal nâng cấp gói thay vì modal thật', async ({ page }) => {
      test.setTimeout(60000);
      await loginFreeOrSkip(page);
      const fa = new FaAnalysisPage(page);
      await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
      await expect(fa.alertBellIcon).toBeVisible({ timeout: 20000 });

      await fa.alertBellIcon.click();
      await expect(fa.membershipModal).toBeVisible();
      await expect(fa.alertModal).toHaveCount(0);

      // Modal "Thông báo" dùng class `modal-hide-header-footer` (ẩn cả header lẫn nút đóng "×") — không có
      // điểm vào UI để đóng lại (đã đo thật: Escape KHÔNG đóng được). Tải lại trang để reset trạng thái modal
      // trước khi thử icon thứ 2, thay vì cố đóng modal đang mở.
      await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
      const hasAddTransactionIcon = await fa.addTransactionIcon.count();
      if (hasAddTransactionIcon > 0) {
        await fa.addTransactionIcon.click();
        await expect(fa.membershipModal).toBeVisible();
        await expect(fa.quickTransactionModal).toHaveCount(0);
      }
    });
  });

  test('TC_PTCB_TTC_11: Đổi mã CK qua search cập nhật đúng candlestick + bảng "Thông tin chung" theo mã mới', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.companyInfoRows.first()).toBeVisible();
    await page.waitForTimeout(2500); // chờ list_mack nạp lần đầu (tránh gợi ý rỗng giả)

    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(1500);

    await expect(fa.stockNameHeader).toContainText('(HPG)');
    await expect(fa.companyInfoRowByLabel('Mã').locator('td').nth(1)).toHaveText('HPG');

    await resetToVNM(page, fa);
  });

  test('TC_PTCB_TTC_12: [Phát hiện] Deep-link mã ngân hàng — header/Sàn niêm yết trống tạm thời rồi tự phục hồi', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'thong-tin-chung' });

    // Bước 2 (đo ngay sau khi DOM tải xong): trạng thái không xác định (có thể rỗng hoặc chưa đúng) — không
    // assert cứng, chỉ mang tính quan sát/tài liệu hoá (xem phát hiện #0 trong testcases/*.md).

    // Bước 3: chờ vài giây, header phải TỰ PHỤC HỒI đúng — không cần đổi mã CK thủ công.
    await expect(fa.stockNameHeader).toContainText('(VCB)', { timeout: 8000 });
    await expect(fa.stockNameHeader).toContainText('HOSE', { timeout: 8000 });
    await expect(fa.stockNameHeader).toContainText('Ngân hàng TMCP Ngoại thương Việt Nam');
  });

  test('TC_PTCB_TTC_13: Deep-link mã ngân hàng (VCB) không phát sinh lỗi console', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'thong-tin-chung' });
    await page.waitForTimeout(5000);

    expect(pageErrors).toEqual([]);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Thanh 7 sub-tab (Right.vue)', () => {
  test('TC_PTCB_TTC_14: Hiển thị đủ 7 sub-tab, "Thông tin tài chính" active mặc định', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible();

    const names = ['Thông tin tài chính', 'Hồ sơ', 'Cổ đông', 'Thông tin giao dịch', 'Sự kiện', 'Nước ngoài', 'Tự doanh'];
    const tabs = fa.ttcSubTabList.locator('.nav-link');
    await expect(tabs).toHaveCount(7);
    for (let i = 0; i < names.length; i++) {
      await expect(tabs.nth(i)).toHaveText(names[i]);
    }
    await expect(fa.ttcSubTab('Thông tin tài chính')).toHaveClass(/active/);
  });

  test('TC_PTCB_TTC_15: Click lần lượt qua 6 sub-tab còn lại — chuyển đúng, nội dung tồn tại', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    const names = ['Hồ sơ', 'Cổ đông', 'Thông tin giao dịch', 'Sự kiện', 'Nước ngoài', 'Tự doanh'];
    for (const name of names) {
      await fa.clickTtcSubTab(name);
      await expect(fa.ttcSubTab(name), `Sub-tab "${name}" phải active`).toHaveClass(/active/);
      // Nội dung "Thông tin tài chính" (bảng snapshot) phải KHÔNG còn — component unmount khi đổi sub-tab.
      await expect(fa.financialSnapshotGroupHeaderRows, `Chuyển sang "${name}" phải rời khỏi nội dung "Thông tin tài chính"`).toHaveCount(0);
    }
    // Quay lại mặc định để không ảnh hưởng test khác.
    await fa.clickTtcSubTab('Thông tin tài chính');
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_PTCB_TTC_16: Click nhanh liên tục qua 7 sub-tab không lỗi console', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const names = ['Hồ sơ', 'Cổ đông', 'Thông tin giao dịch', 'Sự kiện', 'Nước ngoài', 'Tự doanh', 'Thông tin tài chính'];
    for (let round = 0; round < 2; round++) {
      for (const name of names) {
        await fa.clickTtcSubTab(name);
        await page.waitForTimeout(150);
      }
    }
    await expect(fa.ttcSubTab('Thông tin tài chính')).toHaveClass(/active/);
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_17: Đổi mã CK giữ nguyên sub-tab đang chọn', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickTtcSubTab('Cổ đông');
    await expect(fa.ttcSubTab('Cổ đông')).toHaveClass(/active/);
    await page.waitForTimeout(2500);

    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(1500);

    await expect(fa.ttcSubTab('Cổ đông'), 'Vẫn ở sub-tab "Cổ đông" sau khi đổi mã CK').toHaveClass(/active/);

    await resetToVNM(page, fa);
  });

  test('TC_PTCB_TTC_18: Chuyển sub-tab KHÔNG đổi URL — F5 quay về sub-tab mặc định', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    const urlBefore = page.url();
    await fa.clickTtcSubTab('Sự kiện');
    await expect(fa.ttcSubTab('Sự kiện')).toHaveClass(/active/);
    expect(page.url()).toBe(urlBefore);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await fa.mainTabList.waitFor({ state: 'visible' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 15000 });
    await expect(fa.ttcSubTab('Thông tin tài chính')).toHaveClass(/active/);
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Sub-tab mặc định "Thông tin tài chính"', () => {
  test('TC_PTCB_TTC_19: Cấu trúc bảng snapshot đúng — cột Thông tin/Đơn vị/4 quý + 3 nhóm dòng tiêu đề màu đỏ', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    const headerCells = fa.financialSnapshotRows.first().locator('td');
    await expect(headerCells).toHaveCount(6);
    await expect(headerCells.nth(1)).toHaveText('Đơn vị');

    await expect(fa.financialSnapshotGroupHeaderRows).toHaveCount(3);
    await expect(fa.financialSnapshotGroupHeaderRows.nth(0)).toContainText('Tài sản');
    await expect(fa.financialSnapshotGroupHeaderRows.nth(1)).toContainText('Kết quả kinh doanh');
    await expect(fa.financialSnapshotGroupHeaderRows.nth(2)).toContainText('Chỉ số tài chính');
    for (let i = 0; i < 3; i++) {
      const cells = fa.financialSnapshotGroupHeaderRows.nth(i).locator('td');
      for (let c = 2; c < 6; c++) {
        await expect(cells.nth(c)).toHaveText('');
      }
    }

    const sampleRow = fa.financialSnapshotRowByLabel('Tổng cộng tài sản (Q)');
    await expect(sampleRow.locator('td').nth(2)).not.toHaveText('');
  });

  test('TC_PTCB_TTC_20: 3 biểu đồ bên phải hiển thị (mã thường): Doanh thu/LN ròng, Tổng tài sản/Tổng nợ, P/B P/E', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await expect(fa.economicCharts).toHaveCount(3, { timeout: 10000 });
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TTC_21: Mã ngân hàng (VCB) — bảng + 3 biểu đồ khác cấu trúc (ChartEconomicByBank)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await expect(fa.financialSnapshotRowByLabel('Cho vay khách hàng (Q)')).toBeVisible();
    await expect(fa.economicCharts).toHaveCount(3, { timeout: 10000 });
  });

  test('TC_PTCB_TTC_22: Bảng snapshot KHÔNG có cấu trúc cây thu gọn/mở rộng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    const caretIcons = await fa.financialSnapshotTable.locator('svg[data-icon^="caret"]').count();
    expect(caretIcons, 'Không có icon caret nào — bảng phẳng, không phân cấp').toBe(0);

    const rowsBefore = await fa.financialSnapshotRows.count();
    await fa.financialSnapshotGroupHeaderRows.first().locator('td').first().click();
    await page.waitForTimeout(300);
    const rowsAfter = await fa.financialSnapshotRows.count();
    expect(rowsAfter, 'Click vào dòng tiêu đề nhóm không có tác dụng ẩn/hiện gì').toBe(rowsBefore);
  });

  test('TC_PTCB_TTC_23: Free — sub-tab "Thông tin tài chính" KHÔNG bị khoá gói hội viên', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 20000 });

    await expect(fa.protectedView).toHaveCount(0);
    await expect(fa.economicCharts).toHaveCount(3, { timeout: 10000 });
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Gate cấp widget (features_disabled) cho 6 sub-tab còn lại', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC_PTCB_TTC_24: Free — "Hồ sơ"/"Cổ đông"/"Sự kiện" KHÔNG bị khoá', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    for (const name of ['Hồ sơ', 'Cổ đông', 'Sự kiện']) {
      await fa.clickTtcSubTab(name);
      await expect(fa.ttcSubTab(name)).toHaveClass(/active/);
      await expect(fa.protectedView, `Sub-tab "${name}" không được có ProtectedView`).toHaveCount(0);
    }
  });

  test('TC_PTCB_TTC_25: Free — "Thông tin giao dịch"/"Nước ngoài"/"Tự doanh" BỊ khoá ProtectedView (nội dung chính) — "Nước ngoài"/"Tự doanh" còn bị khoá CẢ panel biểu đồ phụ trợ', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    // "Thông tin giao dịch" (`fa_giao_dich_noi_bo` có trong `features_disabled`) — CHỈ nội dung chính (`CCol
    // xl="9"`) bị khoá. Panel biểu đồ phụ trợ riêng (`ChartAnalysis`, key `fa_co_dong_va_gd_co_dong_bieu_do`)
    // KHÔNG có trong `features_disabled` của tài khoản Free hiện tại nên vẫn hiển thị bình thường — xem
    // TC_PTCB_TTC_26 (đính chính lại giả định ban đầu "cột phải không bao giờ bị gate").
    await fa.clickTtcSubTab('Thông tin giao dịch');
    await expect(fa.ttcSubTab('Thông tin giao dịch')).toHaveClass(/active/);
    await expect(fa.protectedView.first(), 'Sub-tab "Thông tin giao dịch" phải bị ProtectedView khoá').toBeVisible({ timeout: 10000 });
    await expect(fa.protectedView, 'Chỉ 1 ProtectedView (nội dung chính) — panel biểu đồ phụ trợ không bị khoá riêng').toHaveCount(1);

    // "Nước ngoài" (`fa_nuoc_ngoai`) VÀ panel biểu đồ riêng của nó (`ChartForeignTransaction`, key riêng
    // `fa_nuoc_ngoai_bieu_do`) CÙNG có trong `features_disabled` — 2 ProtectedView độc lập cùng hiện đồng thời.
    await fa.clickTtcSubTab('Nước ngoài');
    await expect(fa.ttcSubTab('Nước ngoài')).toHaveClass(/active/);
    await expect(fa.protectedView.first(), 'Sub-tab "Nước ngoài" phải bị ProtectedView khoá').toBeVisible({ timeout: 10000 });
    await expect(fa.protectedView, 'Cả nội dung chính lẫn panel biểu đồ phụ trợ đều bị khoá (2 ProtectedView độc lập)').toHaveCount(2);

    // "Tự doanh" (`fa_tu_doanh`) VÀ panel riêng (`ChartProprietaryTransaction`, key `fa_tu_doanh_bieu_do`) —
    // cùng pattern với "Nước ngoài".
    await fa.clickTtcSubTab('Tự doanh');
    await expect(fa.ttcSubTab('Tự doanh')).toHaveClass(/active/);
    await expect(fa.protectedView.first(), 'Sub-tab "Tự doanh" phải bị ProtectedView khoá').toBeVisible({ timeout: 10000 });
    await expect(fa.protectedView, 'Cả nội dung chính lẫn panel biểu đồ phụ trợ đều bị khoá (2 ProtectedView độc lập)').toHaveCount(2);
  });

  test('TC_PTCB_TTC_26: Free — [Đính chính] panel biểu đồ phụ trợ có gate RIÊNG, độc lập với nội dung chính — minh chứng qua "Thông tin giao dịch"', async ({ page }) => {
    // ⚠️ ĐÍNH CHÍNH so với dự kiến ban đầu ("cột phải không bao giờ bị gate"): đo thật xác nhận `ChartAnalysis`/
    // `ChartForeignTransaction`/`ChartProprietaryTransaction`/`ChartEvents` (biểu đồ phụ trợ `CCol xl="3"`) MỖI
    // component đều có `<ProtectedView>` RIÊNG với feature key RIÊNG (`fa_co_dong_va_gd_co_dong_bieu_do`/
    // `fa_nuoc_ngoai_bieu_do`/`fa_tu_doanh_bieu_do`/`fa_bieu_do_co_tuc`), ĐỘC LẬP với feature key của nội dung
    // chính `CCol xl="9"`. Với tài khoản Free hiện tại, "Nước ngoài"/"Tự doanh" bị khoá CẢ 2 cấp (xem
    // TC_PTCB_TTC_25) nên không minh hoạ được tính ĐỘC LẬP giữa 2 gate — dùng "Thông tin giao dịch" thay thế:
    // `fa_giao_dich_noi_bo` (nội dung chính) CÓ trong `features_disabled`, nhưng
    // `fa_co_dong_va_gd_co_dong_bieu_do` (panel `ChartAnalysis`, dùng chung cho cả "Cổ đông" lẫn "Thông tin
    // giao dịch") KHÔNG có — minh chứng đúng pattern "gate không bọc toàn bộ widget" đã ghi nhận ở tab "Tài
    // chính doanh nghiệp".
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.ttcSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickTtcSubTab('Thông tin giao dịch');
    await expect(fa.protectedView).toBeVisible({ timeout: 10000 });
    await expect(fa.protectedView, 'Chỉ nội dung chính bị khoá (1 ProtectedView), panel biểu đồ phụ trợ không bị gate riêng ở sub-tab này').toHaveCount(1);
    await expect(fa.rightSidePanel.locator('canvas').first(), 'Cột phải nhỏ (ChartAnalysis) vẫn hiển thị bình thường dù nội dung chính đã bị khoá').toBeVisible({ timeout: 10000 });
  });
});

test.describe('Phân tích cơ bản — Thông tin chung — Responsive', () => {
  test('TC_PTCB_TTC_27: Responsive viewport mobile/tablet', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'thong-tin-chung' });
    await expect(fa.financialSnapshotRows.first()).toBeVisible({ timeout: 15000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.companyInfoTable).toBeVisible();
    await expect(fa.ttcSubTabList).toBeVisible();
    await expect(fa.financialSnapshotRows.first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.companyInfoTable).toBeVisible();
    await expect(fa.ttcSubTabList).toBeVisible();
    await expect(fa.financialSnapshotRows.first()).toBeVisible();
  });
});
