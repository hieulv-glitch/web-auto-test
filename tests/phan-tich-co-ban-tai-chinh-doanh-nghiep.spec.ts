import { test, expect } from '@playwright/test';
import { FaAnalysisPage, useFaSafetyNet } from '../pages/FaAnalysisPage';

/**
 * Chạy trên BASE_URL (localhost:8080, nhánh preprod) — backend PRODUCTION. Đăng nhập bằng phiên cache `Prev2Session`
 * (chặn ghi setting); mọi request ghi khác bị lưới `FaSafetyNet` huỷ, sau mỗi test assert không có request ghi nào lọt.
 */
useFaSafetyNet(test);

async function loginFirst(page: any) {
  await new FaAnalysisPage(page).login('paid');
}

async function loginFreeOrSkip(page: any) {
  await new FaAnalysisPage(page).login('free');
}

function parseNumber(text: string): number {
  return parseInt(text.replace(/[^0-9-]/g, ''), 10);
}

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Tổng quan & chuyển sub-tab', () => {
  test('TC_PTCB_TCDN_01: Overview mặc định (sub-tab "Bảng cân đối kế toán" active)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });

    await expect(fa.bfSubTab('Bảng cân đối kế toán')).toHaveClass(/active/);
    await expect(fa.bfSubTab('Kết quả kinh doanh')).toBeVisible();
    await expect(fa.bfSubTab('Lưu chuyển tiền tệ')).toBeVisible();
    await expect(fa.bfSubTab('Chỉ tiêu tài chính')).toBeVisible();
    await expect(fa.bfMoneySelect).toBeVisible();
    await expect(fa.bfTimeSelect).toBeVisible();
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    await expect(fa.bfTableHeaderCells.first()).toHaveText('Thông tin');
  });

  test('TC_PTCB_TCDN_02: Click "Kết quả kinh doanh" chuyển đúng bảng IS', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickBfSubTab('Kết quả kinh doanh');
    await expect(fa.bfSubTab('Kết quả kinh doanh')).toHaveClass(/active/);
    await expect(fa.bfTableWrapper).toHaveClass(/table-is/);
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_PTCB_TCDN_03: Click "Lưu chuyển tiền tệ" chuyển đúng bảng CF', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickBfSubTab('Lưu chuyển tiền tệ');
    await expect(fa.bfSubTab('Lưu chuyển tiền tệ')).toHaveClass(/active/);
    await expect(fa.bfTableWrapper).toHaveClass(/table-cf/);
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_PTCB_TCDN_04: Click "Thuyết minh" chuyển đúng bảng TM (tài khoản có role coworker)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    const tmTabCount = await fa.bfSubTab('Thuyết minh').count();
    test.skip(tmTabCount === 0, 'Tài khoản test hiện tại không có role "coworker" — sub-tab "Thuyết minh" không hiển thị (xem TC_PTCB_TCDN_33).');

    await fa.clickBfSubTab('Thuyết minh');
    await expect(fa.bfSubTab('Thuyết minh')).toHaveClass(/active/);
    await expect(fa.bfTableWrapper).toHaveClass(/table-tm/);
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_PTCB_TCDN_05: Click "Chỉ tiêu tài chính" chuyển đúng bảng có cột "Đơn vị", chỉ 1 select', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.bfSubTab('Chỉ tiêu tài chính')).toHaveClass(/active/);
    await expect(fa.bfTableWrapper).toHaveClass(/table-financial_ratios/);
    await expect(fa.bfTableHeaderCells.nth(1)).toHaveText('Đơn vị');
    await expect(fa.bfMoneySelect).toHaveCount(0);
    await expect(fa.bfTimeSelectFinancialRatios).toBeVisible();
  });

  test('TC_PTCB_TCDN_06: Chuyển sub-tab nhanh liên tục không lỗi console', async ({ page }) => {
    // 2 vòng x 4 sub-tab, mỗi lần remount lại gọi API với payload BS/CF/IS khá lớn — dưới tải 3 worker song
    // song có thể vượt quá timeout mặc định 30s.
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const names = ['Kết quả kinh doanh', 'Lưu chuyển tiền tệ', 'Chỉ tiêu tài chính', 'Bảng cân đối kế toán'];
    for (let round = 0; round < 2; round++) {
      for (const name of names) {
        await fa.clickBfSubTab(name);
        await page.waitForTimeout(150);
      }
    }
    await expect(fa.bfSubTab('Bảng cân đối kế toán')).toHaveClass(/active/);
    expect(pageErrors).toEqual([]);
  });

  // Cập nhật 10/11/2026: thay hẳn case cũ "Mỗi lần chuyển sub-tab luôn gọi lại API mới (không cache)" — từ commit
  // 815152821 (09/2026) sub-tab đã mở được giữ sống (`v-if` + `v-show`), quay lại KHÔNG gọi lại API (chủ đích của dev,
  // xem comment trong BusinessFinance/index.vue).
  test('TC_PTCB_TCDN_07: Quay lại sub-tab đã xem KHÔNG gọi lại API (sub-tab được giữ sống)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    const bsRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/stocks?') && url.includes('type=bs')) bsRequests.push(url);
    });

    await fa.clickBfSubTab('Kết quả kinh doanh');
    await expect(fa.bfTableWrapper).toHaveClass(/table-is/);
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickBfSubTab('Bảng cân đối kế toán');
    await expect(fa.bfTableWrapper).toHaveClass(/table-bs/);
    await expect(fa.bfTableRows.first(), 'Bảng BS hiện lại ngay (dữ liệu cũ còn giữ)').toBeVisible();
    await page.waitForTimeout(1000);

    expect(bsRequests, 'Quay lại "Bảng cân đối kế toán" không gọi lại API type=bs').toEqual([]);
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Toggle Triệu/Tỷ đồng', () => {
  test('TC_PTCB_TCDN_08: Đổi "Tỷ đồng" chia giá trị hiển thị cho 1000', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    const targetRow = fa.bfTableRowByText('TỔNG CỘNG TÀI SẢN');
    const cellBefore = targetRow.locator('td').nth(1);
    await expect(cellBefore).not.toHaveText('', { timeout: 10000 });
    const valueBefore = parseNumber(await cellBefore.innerText());

    await fa.bfMoneySelect.selectOption({ label: 'Tỷ đồng' });
    await page.waitForTimeout(500);
    const valueAfter = parseNumber(await cellBefore.innerText());

    expect(Math.abs(valueBefore / 1000 - valueAfter), 'Giá trị Tỷ đồng phải xấp xỉ Triệu đồng / 1000').toBeLessThanOrEqual(2);
  });

  test('TC_PTCB_TCDN_09: Chọn "Tỷ đồng" ở BS rồi qua "Kết quả kinh doanh" vẫn giữ "Tỷ đồng"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await fa.bfMoneySelect.selectOption({ label: 'Tỷ đồng' });
    await page.waitForTimeout(300);
    await fa.clickBfSubTab('Kết quả kinh doanh');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await expect(fa.bfMoneySelect).toHaveValue('bilion');
  });

  test('TC_PTCB_TCDN_10: Select Triệu/Tỷ KHÔNG hiển thị ở sub-tab "Chỉ tiêu tài chính"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await expect(fa.bfMoneySelect).toHaveCount(0);
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Toggle Quý/Năm (BS/IS/CF/TM)', () => {
  test('TC_PTCB_TCDN_11: Chuyển "Năm" đổi cột + gọi lại API đúng tham số thoigian=year', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    let capturedUrl = '';
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/stocks?') && url.includes('type=bs')) capturedUrl = url;
    });
    await fa.bfTimeSelect.selectOption({ label: 'Năm' });
    await page.waitForTimeout(1000);

    expect(capturedUrl).toContain('thoigian=year');
  });

  test('TC_PTCB_TCDN_12: Chuyển lại "Quý" gọi lại API đúng tham số thoigian=quarter (không cache)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    await fa.bfTimeSelect.selectOption({ label: 'Năm' });
    await page.waitForTimeout(800);

    let capturedUrl = '';
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/stocks?') && url.includes('type=bs')) capturedUrl = url;
    });
    await fa.bfTimeSelect.selectOption({ label: 'Quý' });
    await page.waitForTimeout(1000);

    expect(capturedUrl).toContain('thoigian=quarter');
  });

  test('TC_PTCB_TCDN_13: Toggle Quý/Năm dùng chung state cho BS/IS/CF/TM', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await fa.bfTimeSelect.selectOption({ label: 'Năm' });
    await page.waitForTimeout(300);
    await fa.clickBfSubTab('Lưu chuyển tiền tệ');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await expect(fa.bfTimeSelect).toHaveValue('year');
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Toggle Quý/Năm/TTM riêng "Chỉ tiêu tài chính"', () => {
  test('TC_PTCB_TCDN_14: Chọn "TTM" gọi API đúng tham số thoigian=ttm', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    let capturedUrl = '';
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/stocks/financial-ratios')) capturedUrl = url;
    });
    await fa.bfTimeSelectFinancialRatios.selectOption({ label: 'TTM' });
    await page.waitForTimeout(1000);

    expect(capturedUrl).toContain('thoigian=ttm');
  });

  test('TC_PTCB_TCDN_15: State Quý/Năm/TTM của "Chỉ tiêu tài chính" ĐỘC LẬP với Quý/Năm của BS/IS/CF/TM', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await fa.bfTimeSelect.selectOption({ label: 'Năm' });
    await page.waitForTimeout(300);
    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await expect(fa.bfTimeSelectFinancialRatios, '"Chỉ tiêu tài chính" phải giữ mặc định "Quý" riêng, không bị ảnh hưởng bởi việc đổi "Năm" ở BS').toHaveValue('quarter');
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Thu gọn/Mở rộng dòng phân cấp', () => {
  test('TC_PTCB_TCDN_16: Click dòng cha ẩn/hiện các dòng con', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    const rowsBefore = await fa.bfTableRows.count();
    await fa.toggleBfRow('A. Tài sản lưu động và đầu tư ngắn hạn');
    await page.waitForTimeout(300);
    const rowsAfterCollapse = await fa.bfTableRows.count();
    expect(rowsAfterCollapse, 'Thu gọn dòng cha phải ẩn bớt các dòng con, giảm tổng số dòng').toBeLessThan(rowsBefore);

    await fa.toggleBfRow('A. Tài sản lưu động và đầu tư ngắn hạn');
    await page.waitForTimeout(300);
    const rowsAfterExpand = await fa.bfTableRows.count();
    expect(rowsAfterExpand, 'Mở lại phải khôi phục đúng số dòng ban đầu').toBe(rowsBefore);
  });

  test('TC_PTCB_TCDN_17: Icon caret đổi hướng đúng theo trạng thái thu gọn/mở rộng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    // Cập nhật 10/11/2026: SVG viết tay trong BS.vue (815152821) — không còn thuộc tính `data-icon`, nhận diện qua class.
    const row = fa.bfTableRowByText('A. Tài sản lưu động và đầu tư ngắn hạn');
    const caret = row.locator('td').first().locator('svg');
    await expect(caret).toHaveClass(/fa-caret-down/); // mặc định mở rộng

    await fa.toggleBfRow('A. Tài sản lưu động và đầu tư ngắn hạn');
    await expect(caret).toHaveClass(/fa-caret-right/);
  });

  test('TC_PTCB_TCDN_18: "Chỉ tiêu tài chính" không có cấu trúc cây thu gọn/mở rộng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    const rowsBefore = await fa.bfTableRows.count();
    const caretIcons = await fa.bfTable.locator('svg[class*="fa-caret"]').count();
    expect(caretIcons, 'Không có icon caret nào — bảng phẳng, không phân cấp').toBe(0);

    await fa.bfTableRows.first().locator('td').first().click();
    await page.waitForTimeout(300);
    const rowsAfter = await fa.bfTableRows.count();
    expect(rowsAfter, 'Click vào dòng không có tác dụng ẩn/hiện gì (không phải cây)').toBe(rowsBefore);
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Nhóm mã CK & KHÔNG có race condition', () => {
  test('TC_PTCB_TCDN_19: Mã ngân hàng (VCB) hiển thị đúng cấu trúc bảng riêng cho ngân hàng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await expect(fa.bfTableRowByText('VII. Cho vay khách hàng'), 'Cấu trúc BS ngân hàng phải có dòng "Cho vay khách hàng" (không có ở BS thường)').toBeVisible();
  });

  test('TC_PTCB_TCDN_20: Deep-link thẳng vào mã ngân hàng KHÔNG có race condition, hiển thị đúng ngay lập tức', async ({ page }) => {
    await loginFirst(page);
    const wrongRequests: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/api/stocks?') && res.url().includes('type=bs') && res.status() >= 400) {
        wrongRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRowByText('TỔNG CỘNG TÀI SẢN')).toBeVisible({ timeout: 15000 });

    expect(wrongRequests, 'Không có request /api/stocks?type=bs nào trả lỗi (khác race condition tab Biểu đồ/So sánh)').toEqual([]);
  });

  test('TC_PTCB_TCDN_21: Đổi mã CK từ thường sang ngân hàng qua search cập nhật đúng, không lỗi console', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2500); // chờ list_mack nạp lần đầu (tránh gợi ý rỗng giả)

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await fa.searchInput.fill('VCB');
    await fa.searchSuggestions.filter({ hasText: 'VCB' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'VCB' }).first().click();
    await expect(fa.bfTableRowByText('VII. Cho vay khách hàng')).toBeVisible({ timeout: 15000 });
    expect(pageErrors).toEqual([]);

    // Reset lại VNM để không ảnh hưởng test khác chạy song song.
    await fa.searchInput.fill('VNM');
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().click();
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Đổi mã CK giữ nguyên sub-tab', () => {
  test('TC_PTCB_TCDN_22: Đổi mã CK không làm mất sub-tab đang xem', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    await fa.clickBfSubTab('Lưu chuyển tiền tệ');
    await expect(fa.bfTableWrapper).toHaveClass(/table-cf/);
    await page.waitForTimeout(2500);

    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(1500);

    await expect(fa.bfSubTab('Lưu chuyển tiền tệ'), 'Vẫn ở sub-tab "Lưu chuyển tiền tệ" sau khi đổi mã CK').toHaveClass(/active/);
    await expect(fa.bfTableWrapper).toHaveClass(/table-cf/);

    // Reset lại VNM.
    await fa.searchInput.fill('VNM');
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().click();
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Loading', () => {
  test('TC_PTCB_TCDN_23: Loading spinner khi API chậm', async ({ page }) => {
    // Payload BS thật của VNM khá lớn (~80 cột quý lịch sử) — cộng thêm 3s delay giả lập, có thể mất hơn
    // 15s để render xong trên môi trường thật, nên nới rộng timeout thay vì coi là lỗi.
    test.setTimeout(60000);
    await loginFirst(page);
    await page.route(/\/api\/stocks\?.*type=bs/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });

    await expect(fa.bfLoadingSpinner).toBeVisible();
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 30000 });
  });

  test('TC_PTCB_TCDN_24: Loading khi chuyển sub-tab lần đầu (mount lại)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await page.route(/\/api\/stocks\?.*type=is/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    await fa.clickBfSubTab('Kết quả kinh doanh');

    await expect(fa.bfLoadingSpinner).toBeVisible();
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Lỗi mạng / dữ liệu rỗng', () => {
  test('TC_PTCB_TCDN_25: Mất mạng khi tải BS không crash, chỉ còn header "Thông tin"', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\?.*type=bs/, (route) => route.abort());
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await page.waitForTimeout(3000);

    await expect(fa.bfTableHeaderCells).toHaveCount(1);
    await expect(fa.bfTableRows).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_TCDN_26: API trả mảng rỗng — bảng trống, không lỗi', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\?.*type=bs/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await page.waitForTimeout(2000);

    await expect(fa.bfTableRows).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Giới hạn theo gói hội viên (Free)', () => {
  // Chạy TUẦN TỰ — tài khoản Free dùng chung chỉ hỗ trợ 1 phiên đăng nhập tại 1 thời điểm (cùng lý do đã ghi ở
  // tab Biểu đồ).
  test.describe.configure({ mode: 'serial' });

  test('TC_PTCB_TCDN_28: Free — "Bảng cân đối kế toán"/"Kết quả kinh doanh"/"Lưu chuyển tiền tệ" KHÔNG bị khoá', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 20000 });
    await expect(fa.protectedView).toHaveCount(0);

    await fa.clickBfSubTab('Kết quả kinh doanh');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    await expect(fa.protectedView).toHaveCount(0);

    await fa.clickBfSubTab('Lưu chuyển tiền tệ');
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    await expect(fa.protectedView).toHaveCount(0);
  });

  test('TC_PTCB_TCDN_29: Free — "Chỉ tiêu tài chính" BỊ khoá (ProtectedView ảnh mờ tĩnh)', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfSubTabList).toBeVisible({ timeout: 20000 });

    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.protectedView).toBeVisible({ timeout: 10000 });
    // Thanh sub-tab + select Quý/Năm/TTM VẪN hiển thị bình thường (chỉ vùng bảng bị che).
    await expect(fa.bfSubTab('Chỉ tiêu tài chính')).toHaveClass(/active/);
    await expect(fa.bfTimeSelectFinancialRatios).toBeVisible();
  });

  test('TC_PTCB_TCDN_30: Free — mặc định "Tỷ đồng"/"Năm", 2 select bị disable', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 20000 });

    await expect(fa.bfMoneySelect).toHaveValue('bilion');
    await expect(fa.bfMoneySelect).toBeDisabled();
    await expect(fa.bfTimeSelect).toHaveValue('year');
    await expect(fa.bfTimeSelect).toBeDisabled();
  });

  test('TC_PTCB_TCDN_31: Free — click "Đăng ký ngay" trên ProtectedView mở modal nâng cấp gói', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfSubTabList).toBeVisible({ timeout: 20000 });
    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.protectedView).toBeVisible({ timeout: 10000 });

    await fa.hoverBfProtectedView();
    await expect(fa.bfProtectedViewRegisterText).toBeVisible();
    await fa.bfProtectedViewRegisterBtn.click();

    await expect(page.getByRole('dialog')).toHaveCount(1);
  });

  test('TC_PTCB_TCDN_32: Free — chuyển từ "Chỉ tiêu tài chính" (bị khoá) quay lại "Bảng cân đối kế toán" phục hồi bình thường', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfSubTabList).toBeVisible({ timeout: 20000 });
    await fa.clickBfSubTab('Chỉ tiêu tài chính');
    await expect(fa.protectedView).toBeVisible({ timeout: 10000 });

    await fa.clickBfSubTab('Bảng cân đối kế toán');
    await expect(fa.protectedView).toHaveCount(0);
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_PTCB_TCDN_33: Free (không role coworker) — "Thuyết minh" ẩn hoàn toàn (khác gate theo gói hội viên)', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfSubTabList).toBeVisible({ timeout: 20000 });

    await expect(fa.bfSubTab('Thuyết minh'), 'Sub-tab "Thuyết minh" ẩn hoàn toàn — gate theo role "coworker", không phải gói hội viên').toHaveCount(0);
    const subTabCount = await fa.bfSubTabList.locator('.nav-link').count();
    expect(subTabCount, 'Chỉ còn 4 sub-tab (thiếu "Thuyết minh")').toBe(4);
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Deep-link & URL', () => {
  test('TC_PTCB_TCDN_34: Deep-link ?tab=tai-chinh-doanh-nghiep mở đúng tab, mặc định sub-tab BS', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });

    await expect(fa.mainTab('Tài chính doanh nghiệp')).toHaveClass(/active-bg-tab/);
    await expect(fa.bfSubTabList).toBeVisible({ timeout: 15000 });
    await expect(fa.bfSubTab('Bảng cân đối kế toán')).toHaveClass(/active/);
  });

  test('TC_PTCB_TCDN_35: Chuyển sub-tab KHÔNG đổi URL, F5 quay về sub-tab mặc định BS', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    const urlBefore = page.url();
    await fa.clickBfSubTab('Lưu chuyển tiền tệ');
    await expect(fa.bfTableWrapper).toHaveClass(/table-cf/);
    expect(page.url()).toBe(urlBefore);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await fa.mainTabList.waitFor({ state: 'visible' });
    await expect(fa.bfSubTabList).toBeVisible({ timeout: 15000 });
    await expect(fa.bfSubTab('Bảng cân đối kế toán')).toHaveClass(/active/);
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Hiệu ứng hover cột', () => {
  test('TC_PTCB_TCDN_36: Hover highlight cột theo quý ở chế độ "Quý", KHÔNG highlight ở "Năm"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    // Cập nhật 10/11/2026: highlight giờ là class `hl-Qn` trên wrapper `.table-bs` + CSS tô các ô `td[data-q="Qn"]`
    // (không còn class `bghover` trên từng ô). Ở "Năm" các ô không có `data-q` → không highlight.
    const bodyCell = fa.bfTableRowByText('TỔNG CỘNG TÀI SẢN').locator('td').nth(1);
    const quarter = await bodyCell.getAttribute('data-q');
    expect(quarter, 'Cột dữ liệu ở chế độ "Quý" phải có data-q = Q1..Q4').toMatch(/^Q[1-4]$/);
    await bodyCell.hover();
    await expect(fa.bfTableWrapper).toHaveClass(new RegExp(`hl-${quarter}`));
    // So trên 1 dòng KHÁC dòng đang rê (dòng đang rê có hiệu ứng hover cả hàng, cùng màu): ô cùng quý được tô, ô quý
    // khác thì không.
    const otherRow = fa.bfTableRowByText('A. Tài sản lưu động và đầu tư ngắn hạn');
    const sameQuarterBg = await otherRow.locator(`td[data-q="${quarter}"]`).first().evaluate((el) => (globalThis as any).getComputedStyle(el).backgroundColor);
    const otherQuarterBg = await otherRow.locator(`td[data-q]:not([data-q="${quarter}"])`).first().evaluate((el) => (globalThis as any).getComputedStyle(el).backgroundColor);
    expect(sameQuarterBg, 'Ô cùng quý ở dòng khác được tô màu khác ô quý khác').not.toBe(otherQuarterBg);

    await fa.bfTimeSelect.selectOption({ label: 'Năm' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });
    const bodyCellYear = fa.bfTableRowByText('TỔNG CỘNG TÀI SẢN').locator('td').nth(1);
    expect(await bodyCellYear.getAttribute('data-q'), 'Chế độ "Năm": ô không có data-q').toBeNull();
    await bodyCellYear.hover();
    await page.waitForTimeout(200);
    await expect(fa.bfTableWrapper, 'Chế độ "Năm" không highlight cột nào').not.toHaveClass(/hl-Q/);
  });
});

test.describe('Phân tích cơ bản — Tài chính doanh nghiệp — Responsive', () => {
  test('TC_PTCB_TCDN_37: Responsive viewport mobile/tablet', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tai-chinh-doanh-nghiep' });
    await expect(fa.bfTableRows.first()).toBeVisible({ timeout: 15000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.bfSubTabList).toBeVisible();
    await expect(fa.bfTableRows.first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.bfSubTabList).toBeVisible();
    await expect(fa.bfTableRows.first()).toBeVisible();
  });
});
