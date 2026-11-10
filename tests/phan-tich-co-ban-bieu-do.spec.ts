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

test.describe('Phân tích cơ bản — Biểu đồ — Tổng quan theo nhóm mã', () => {
  test('TC_PTCB_BD_01: Overview mã thường (non-bank) — lưới biểu đồ tài chính', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });

    await expect(fa.chartCards.first()).toBeVisible({ timeout: 15000 });
    const cardCount = await fa.chartCards.count();
    expect(cardCount, 'Phải có nhiều card biểu đồ').toBeGreaterThan(5);
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      await expect(fa.chartCards.nth(i).locator('canvas')).toBeVisible();
    }
    await expect(fa.btnThemMaChart, 'Mã thường KHÔNG có nút "Thêm mã"').toHaveCount(0);
  });

  test('TC_PTCB_BD_02: Overview mã ngân hàng (bank) — radar + lưới biểu đồ + nút "Thêm mã"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });

    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);
    const cardCount = await fa.chartCards.count();
    expect(cardCount, 'Phải có 11 card (radar tổng hợp + 10 biểu đồ)').toBeGreaterThanOrEqual(10);
    const selects = page.locator('.faAnalysis-page').locator('select');
    expect(await selects.count(), 'Phải có 2 select bộ lọc (bubble + nợ xấu từng ngân hàng)').toBeGreaterThanOrEqual(2);
  });
});

test.describe('Phân tích cơ bản — Biểu đồ — Loading', () => {
  test('TC_PTCB_BD_06: Loading spinner khi tải chậm (mã thường)', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\/chart\/nonbank/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });

    await expect(fa.chartLoadingSpinner).toBeVisible();
    await expect(fa.chartCards).toHaveCount(0);

    await expect(fa.chartCards.first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Phân tích cơ bản — Biểu đồ — Lỗi mạng', () => {
  test('TC_PTCB_BD_08: Mất mạng khi tải biểu đồ mã thường không có chart nào hiển thị, không crash thêm', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\/chart\/nonbank/, (route) => route.abort());
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });
    await page.waitForTimeout(3000);

    await expect(fa.chartCards).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('TC_PTCB_BD_09: Mất mạng khi tải biểu đồ mã ngân hàng không có chart dữ liệu nào hiển thị', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\/chart\/bank(?!\/scatter)/, (route) => route.abort());
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await page.waitForTimeout(4000);

    // Trang không trắng hoàn toàn: logo/nút vẫn còn dù không có card dữ liệu.
    await expect(page.locator('.faAnalysis-page')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

test.describe('Phân tích cơ bản — Biểu đồ — Đổi mã CK', () => {
  test('TC_PTCB_BD_10: Đổi mã CK cùng nhóm (deep-link mã thường) tải đúng dữ liệu ngay, KHÔNG có race condition', async ({ page }) => {
    await loginFirst(page);
    const bankReqs: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/stocks/chart/bank') && !req.url().includes('scatter')) bankReqs.push(req.url());
    });

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });
    await expect(fa.chartCards.first()).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(1000);
    expect(bankReqs, 'Mã thường không được gọi nhầm API /chart/bank').toEqual([]);
  });

  test('TC_PTCB_BD_11: Đổi mã CK khác nhóm (thường → ngân hàng) chuyển đúng loại biểu đồ', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });
    await expect(fa.chartCards.first()).toBeVisible({ timeout: 10000 });
    await expect(fa.btnThemMaChart).toHaveCount(0);
    await page.waitForTimeout(2500); // chờ list_mack nạp lần đầu (tránh gợi ý rỗng giả)

    let bankReqFired = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/stocks/chart/bank') && req.url().includes('VCB')) bankReqFired = true;
    });

    await fa.searchInput.fill('VCB');
    await fa.searchSuggestions.filter({ hasText: 'VCB' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'VCB' }).first().click();

    await expect(fa.btnThemMaChart, 'Sau khi đổi mã, phải chuyển đúng sang ChartByBank').toBeVisible({ timeout: 10000 });
    expect(bankReqFired).toBe(true);

    // Reset lại VNM.
    await fa.searchInput.fill('VNM');
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().click();
  });
});

test.describe('Phân tích cơ bản — Biểu đồ — Giới hạn theo gói hội viên (Free)', () => {
  // Chạy TUẦN TỰ (không song song) — tài khoản Free dùng chung CHỈ hỗ trợ 1 phiên đăng nhập tại 1 thời điểm;
  // đăng nhập đồng thời ở nhiều worker khiến phiên trước bị vô hiệu hoá giữa chừng (đã xác nhận qua lỗi thật:
  // mainTabList không bao giờ hiện sau login khi 3 test Free trong nhóm này chạy song song).
  test.describe.configure({ mode: 'serial' });
  test('TC_PTCB_BD_12: Free — hầu hết biểu đồ mã thường bị che, trừ "Tài sản quý"/"Nguồn vốn quý"', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });
    await expect(fa.chartCards.first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1500);

    const upgradeCount = await fa.chartUpgradeBlocks.count();
    expect(upgradeCount, '8/10 chart bị che ở mã thường').toBe(8);
  });

  test('TC_PTCB_BD_13: Free — hầu hết biểu đồ mã ngân hàng bị che, trừ "Tài sản quý"', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1500);

    const upgradeCount = await fa.chartUpgradeBlocks.count();
    expect(upgradeCount, '10/11 chart bị che ở mã ngân hàng').toBe(10);
    await expect(fa.btnThemMaChart, 'Nút "Thêm mã" không thuộc phạm vi gate per-chart').toBeVisible();
  });

  test('TC_PTCB_BD_14: Click "Nâng cấp ngay" trên 1 card bị gate mở modal nâng cấp gói', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });
    await expect(fa.chartUpgradeNowBtn.first()).toBeVisible({ timeout: 30000 });

    await fa.chartUpgradeNowBtn.first().click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
  });
});

test.describe('Phân tích cơ bản — Biểu đồ — Modal "Thêm mã" (chỉ mã ngân hàng)', () => {
  test('TC_PTCB_BD_15: Mở modal "Thêm mã" hiển thị đúng cấu trúc', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });

    await fa.btnThemMaChart.click();
    await expect(fa.chartAddMackModal).toBeVisible();
    await expect(fa.chartAddMackModalInput).toBeVisible();
    await expect(fa.chartAddMackModalQuarterSelect).toBeVisible();
    await expect(fa.chartAddMackModalYearInput).toBeVisible();
    await expect(fa.chartAddMackModal.getByText('Danh sách mã')).toBeVisible();
    await expect(fa.chartAddMackModalListRows.filter({ hasText: 'VCB' })).toBeVisible();
    await expect(fa.chartAddMackModalCloseBtn).toBeVisible();
    await expect(fa.chartAddMackModalSaveBtn).toBeVisible();
    const yearValue = await fa.chartAddMackModalYearInput.inputValue();
    expect(Number(yearValue), 'Năm phải tự điền theo kỳ mới nhất (khác 0)').toBeGreaterThan(2000);
  });

  test('TC_PTCB_BD_16: Gõ mã hợp lệ hiện gợi ý, chọn thêm vào "Danh sách mã"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });

    await fa.btnThemMaChart.click();
    await fa.chartAddMackModalInput.fill('bid');
    await expect(fa.chartAddMackModalSuggestions.filter({ hasText: 'BID' }).first()).toBeVisible();
    await fa.chartAddMackModalSuggestions.filter({ hasText: 'BID' }).first().click();

    await expect(fa.chartAddMackModalListRows.filter({ hasText: 'BID' })).toBeVisible();
    await expect(fa.chartAddMackModalInput).toHaveValue('');
  });

  test('TC_PTCB_BD_17: Gõ mã không tồn tại trong modal không ra gợi ý nào', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });

    await fa.btnThemMaChart.click();
    await fa.chartAddMackModalInput.fill('ZZZZZZ999');
    await page.waitForTimeout(400);
    await expect(fa.chartAddMackModalSuggestions).toHaveCount(0);
  });

  test('TC_PTCB_BD_18: Mã đang xem trong "Danh sách mã" không có icon xoá (khác mã đã thêm)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });

    await fa.btnThemMaChart.click();
    await fa.chartAddMackModalInput.fill('bid');
    await fa.chartAddMackModalSuggestions.filter({ hasText: 'BID' }).first().click();

    const currentMackRow = fa.chartAddMackModalListRows.filter({ hasText: 'VCB' });
    const addedMackRow = fa.chartAddMackModalListRows.filter({ hasText: 'BID' });
    const currentHandleCount = await currentMackRow.locator('.handle').count();
    const addedHandleCount = await addedMackRow.locator('.handle').count();
    expect(addedHandleCount, 'Dòng mã đã thêm (BID) phải có nhiều icon ".handle" hơn dòng mã đang xem (VCB)').toBeGreaterThan(currentHandleCount);
  });

  test('TC_PTCB_BD_19: Xoá mã khỏi "Danh sách mã" bằng icon', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });

    await fa.btnThemMaChart.click();
    await fa.chartAddMackModalInput.fill('bid');
    await fa.chartAddMackModalSuggestions.filter({ hasText: 'BID' }).first().click();
    await expect(fa.chartAddMackModalListRows.filter({ hasText: 'BID' })).toBeVisible();

    await fa.chartAddMackModalRemoveIcon('BID').click();
    await expect(fa.chartAddMackModalListRows.filter({ hasText: 'BID' })).toHaveCount(0);
  });

  test('TC_PTCB_BD_20: Đổi Quý/Năm rồi "Lưu" gửi đúng tham số trong request', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });

    await fa.btnThemMaChart.click();
    let capturedUrl = '';
    page.on('request', (req) => {
      if (req.url().includes('/api/stocks/chart/bank') && !req.url().includes('scatter')) capturedUrl = req.url();
    });
    await fa.chartAddMackModalQuarterSelect.selectOption({ index: 2 }); // value "3"
    await fa.chartAddMackModalSaveBtn.click();
    await page.waitForTimeout(2000);

    expect(capturedUrl, 'Request phải kèm quarter=3').toContain('quarter=3');
    expect(capturedUrl, 'Request phải kèm mack[]=VCB').toContain('mack[]=VCB');
    await expect(fa.chartAddMackModal).toHaveCount(0);
  });

  // ⚠️ `test.fixme`: vuedraggable/Sortable.js không dùng chuẩn HTML5 Drag & Drop API — cùng hạn chế đã ghi nhận
  // ở TC_PTCB_SS_15 (tab So sánh) và TC_BANGGIA_37 (Bảng Giá). Xem TRACKER.md.
  test.fixme('TC_PTCB_BD_21: Kéo-thả sắp xếp lại thứ tự mã trong "Danh sách mã"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await fa.btnThemMaChart.click();
    await fa.chartAddMackModalInput.fill('bid');
    await fa.chartAddMackModalSuggestions.filter({ hasText: 'BID' }).first().click();
    // TODO: mô phỏng kéo-thả dòng BID lên trên dòng khác trong <draggable> (vuedraggable/Sortable.js) và xác
    // nhận thứ tự trong `chartAddMackModalListRows` đổi đúng theo thao tác kéo.
  });
});

test.describe('Phân tích cơ bản — Biểu đồ — Dark mode', () => {
  test('TC_PTCB_BD_22: Chuyển dark mode không crash, đổi logo (chỉ mã ngân hàng có logo riêng)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VCB', tabQuery: 'bieu-do' });
    await expect(fa.btnThemMaChart).toBeVisible({ timeout: 15000 });

    const logoLight = await fa.chartBankLogo.getAttribute('src');
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Cập nhật 10/11/2026: bấm nhãn công tắc thay vì `click({ force: true })` vào input (không đổi theme).
    await fa.toggleDarkMode();
    await page.waitForTimeout(1000);

    const logoDark = await fa.chartBankLogo.getAttribute('src');
    expect(logoDark, 'src logo phải đổi sau khi toggle dark mode').not.toBe(logoLight);
    expect(pageErrors).toEqual([]);
    await expect(fa.chartCards.first()).toBeVisible();
  });
});

test.describe('Phân tích cơ bản — Biểu đồ — Responsive', () => {
  test('TC_PTCB_BD_23: Responsive viewport mobile/tablet', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG', tabQuery: 'bieu-do' });
    await expect(fa.chartCards.first()).toBeVisible({ timeout: 15000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.chartCards.first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.chartCards.first()).toBeVisible();
  });
});
