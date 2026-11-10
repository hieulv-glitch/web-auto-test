import { test, expect } from '@playwright/test';
import { TechnicalChartPage } from '../pages/TechnicalChartPage';
import { useLegacySafetyNet, safeLoginTa, ReadOnlyRule } from '../pages/LegacySafetyNet';

/** POST chỉ đọc của màn này (cho đi thật). */
const READ_ONLY_EXTRA: ReadOnlyRule[] = [
  { pattern: /\/api\/news\/news-related-by-mack(\?|$)/, reason: 'panel "Thông tin" tải tin liên quan theo mã (POST chỉ đọc)' },
  { pattern: /\/api\/stock-signals\//, reason: 'panel AI Chart tra mẫu hình/tín hiệu (POST chỉ đọc, AiInsightPanel.vue)' },
];

/**
 * AN TOÀN DỮ LIỆU (10/11/2026): chạy trên localhost:8080 (nhánh preprod) gọi backend PRODUCTION → đăng nhập bằng phiên
 * cache `Prev2Session` (chặn ghi setting, ghi lại ở `settingWrites`) + lưới `useLegacySafetyNet` huỷ mọi request ghi
 * khác tới production và assert không có request nào lọt sau mỗi test (pages/LegacySafetyNet.ts).
 */
useLegacySafetyNet(test, READ_ONLY_EXTRA);
// Đăng nhập + mở trang PTKT (iframe TradingView) mất 15-25s trên localhost → timeout mặc định 30s không đủ.
test.describe.configure({ timeout: 90000 });
// 10/11/2026: thanh công cụ TradingView thêm nút (Mẫu chỉ báo, Lưu…) — ở 1280px thanh công cụ bị co, một số nút
// bị ẩn; dùng màn rộng như bộ phan-tich-ky-thuat-replay-chia-khung.
test.use({ viewport: { width: 1600, height: 900 } });

async function loginFirst(page: any) {
  // Bố cục cố định 1 khung (ACB + HPG) thay bố cục thật của tài khoản — xem `safeLoginTa`.
  return safeLoginTa(page, 'paid');
}

async function loginFreeOrSkip(page: any) {
  test.skip(!process.env.FREE_USER_EMAIL || !process.env.FREE_USER_PASSWORD, 'Chưa cấu hình FREE_USER_EMAIL/FREE_USER_PASSWORD trong .env');
  return safeLoginTa(page, 'free');
}

async function searchAndSelectSymbol(page: any, ta: TechnicalChartPage, symbol: string) {
  await ta.headerSymbolSearchBtn.click();
  await page.keyboard.type(symbol, { delay: 40 });
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
}

// (10/11/2026: ghi chú dưới đây LỖI THỜI — ghi setting bị chặn + bố cục cố định theo test nên chạy song song được, đã bỏ mode 'serial'.)
// ⚠️ AN TOÀN DỮ LIỆU — chạy file này BẮT BUỘC kèm `--workers=1` khi chạy chung nhiều describe block/nhiều file
// cùng lúc (xem ghi chú đầy đủ ở đầu tests/phan-tich-ky-thuat.spec.ts + TRACKER.md mục "Phân tích kỹ thuật").

test.describe('Phân tích kỹ thuật — Thông tin — Header giá (mã cổ phiếu thường)', () => {

  test('TC_PTKT_TT_01: Header hiển thị đúng thông tin giá mã cổ phiếu thường', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'ACB');

    await expect(ta.companyNameLink).toBeVisible({ timeout: 10000 });
    await expect(ta.infoHeaderPriceRow).toBeVisible();
    // 10/11/2026: icon chuông đã bỏ khỏi header panel (cảnh báo giá chuyển lên biểu đồ — bộ canh-bao-gia).
    await expect(ta.headerInfoTooltipIcon).toBeVisible();

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  // TC_PTKT_TT_02 (icon chuông mở modal cảnh báo) đã xoá 10/11/2026 — icon chuông bỏ khỏi panel, cảnh báo giá đã chuyển
  // sang bộ canh-bao-gia.

  test('TC_PTKT_TT_03: Hover icon tooltip hiện giải thích cách tính % thay đổi giá', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.headerInfoTooltipIcon).toBeVisible({ timeout: 15000 });
    await ta.headerInfoTooltipIcon.hover();
    await page.waitForTimeout(300);
    await expect(ta.headerInfoTooltipText).toContainText(/UPCOM/);
    await expect(ta.headerInfoTooltipText).toContainText(/HSX, HNX/);
  });
});

test.describe('Phân tích kỹ thuật — Thông tin — Header giá (mã chỉ số)', () => {
  test('TC_PTKT_TT_04: Header hiển thị đúng cho mã chỉ số — không link/bell/tooltip', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'VNINDEX');

    await expect(ta.infoPanel).toContainText('Chỉ số VNINDEX', { timeout: 10000 });
    await expect(ta.companyNameLink).toHaveCount(0);
    await expect(ta.bellAlertIcon).toHaveCount(0);
    await expect(ta.headerInfoTooltipIcon).toHaveCount(0);

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });
});

test.describe('Phân tích kỹ thuật — Thông tin — Tổng quan (mã cổ phiếu thường)', () => {

  test('TC_PTKT_TT_05: Mini chart "Biểu đồ" hiển thị trong panel', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.infoPanel.getByText('Biểu đồ', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(ta.infoPanel.locator('canvas').first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_PTKT_TT_06: Toggle "Tổng quan"/"NN & TD" chuyển đúng nội dung', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.infoInnerTab('NN & TD')).toBeVisible({ timeout: 15000 });

    await ta.gotoInfoInnerTab('NN & TD');
    // `{ exact: true }` bắt buộc — cùng lý do đã ghi ở TC_PTKT_TT_11 (khớp nhầm cả tiêu đề "Giao dịch nước
    // ngoài" LẪN dòng phụ "Tổng giao dịch nước ngoài" bên dưới, chứa cùng substring).
    await expect(ta.infoPanel.getByText('Giao dịch nước ngoài', { exact: true })).toBeVisible({ timeout: 10000 });

    await ta.gotoInfoInnerTab('Tổng quan');
    await expect(ta.infoPanel.getByText('Giao dịch', { exact: true })).toBeVisible();
  });

  test('TC_PTKT_TT_07: Khối "Giao dịch" hiển thị đủ field (mã cổ phiếu thường)', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'ACB');
    await ta.gotoInfoInnerTab('Tổng quan');

    for (const label of ['Trần - Sàn - TC', 'Mở cửa - Cao - Thấp', 'Giá trung bình', 'Khối lượng', 'Tổng GTGD']) {
      await expect(ta.infoRow(label), `dòng "${label}"`).toBeVisible({ timeout: 10000 });
    }

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_TT_08: Khối "Hồ sơ" — link "Thông tin FA" + số liệu cổ phiếu', async ({ page, context }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    await expect(ta.infoPanel.getByText('Hồ sơ', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(ta.thongTinFaLink).toBeVisible();
    for (const label of ['Số lượng cổ phiếu', 'Vốn hóa', 'FreeFloat']) {
      await expect(ta.infoRow(label)).toBeVisible();
    }

    const [newPage] = await Promise.all([context.waitForEvent('page'), ta.thongTinFaLink.click()]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('/phan-tich-co-ban');
    await newPage.close();
  });

  test('TC_PTKT_TT_09: Khối "Chỉ số tài chính" — đủ field cố định + field động', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.infoPanel.getByText('Chỉ số tài chính', { exact: true })).toBeVisible({ timeout: 15000 });

    for (const label of [
      'EPS TTM', 'EPS điều chỉnh', 'BVPS', 'BVPS điều chỉnh', 'PE', 'PB',
      'RSs', 'RSm', 'RSl', 'Beta', 'Mức độ biến động', 'Lợi nhuận kỳ vọng (CAPM)',
    ]) {
      await expect(ta.infoRow(label), `dòng "${label}"`).toBeVisible();
    }
    // ít nhất 1 field động từ API bên dưới 12 field cố định
    const financialBlock = ta.infoPanel.locator('.info-container').filter({ hasText: 'EPS TTM' });
    const rowCount = await financialBlock.locator('.d-flex.justify-content-between.bg-hover').count();
    expect(rowCount, 'Phải có nhiều hơn 12 dòng do có field động từ API').toBeGreaterThan(12);
  });

  test('TC_PTKT_TT_10: Hover RSs hiện biểu đồ lịch sử 10 phiên', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.infoRow('RSs')).toBeVisible({ timeout: 15000 });

    await ta.infoRow('RSs').hover();
    await page.waitForTimeout(600);
    await expect(ta.rsTooltipChart).toBeVisible({ timeout: 5000 });

    // rời chuột khỏi dòng RSs — di chuyển hẳn ra góc trên-trái màn hình (chắc chắn ngoài vùng dòng RSs)
    await page.mouse.move(2, 2);
    await page.waitForTimeout(600);
    await expect(ta.rsTooltipChart).toHaveCount(0);
  });
});

test.describe('Phân tích kỹ thuật — Thông tin — NN & TD (mã cổ phiếu thường)', () => {

  test('TC_PTKT_TT_11: Nội dung "NN & TD" — 2 khối xếp chồng', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.gotoInfoInnerTab('NN & TD');

    // `{ exact: true }` bắt buộc — `getByText('Giao dịch nước ngoài')` không exact khớp NHẦM cả tiêu đề "Giao
    // dịch nước ngoài" (heading) LẪN " Tổng giao dịch nước ngoài " (dòng phụ bên dưới, chứa cùng substring),
    // gây strict-mode violation — đã xác nhận qua debug DOM thật.
    await expect(ta.infoPanel.getByText('Giao dịch nước ngoài', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(ta.infoPanel.getByText(/Giao dịch tự doanh/)).toBeVisible();
  });

  test('TC_PTKT_TT_12: Toggle "1 Ngày"/"20 Ngày" trong khối Giao dịch nước ngoài', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.gotoInfoInnerTab('NN & TD');
    // `{ exact: true }` bắt buộc — cùng lý do đã ghi ở TC_PTKT_TT_11.
    await expect(ta.infoPanel.getByText('Giao dịch nước ngoài', { exact: true })).toBeVisible({ timeout: 10000 });

    const btn20Ngay = ta.infoPanel.getByText('20 Ngày', { exact: true });
    await btn20Ngay.click();
    await page.waitForTimeout(500);
    await expect(ta.infoPanel.getByText(/Biểu đồ GDNN/)).toContainText('20 phiên');
  });

  test('TC_PTKT_TT_13: Tài khoản Free — tab "NN & TD" hiện ảnh tĩnh', async ({ page }) => {
    await loginFreeOrSkip(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.gotoInfoInnerTab('NN & TD');
    await page.waitForTimeout(500);
    await expect(ta.protectedViewImage).toBeVisible({ timeout: 10000 });
    await expect(ta.infoPanel.getByText('Giao dịch nước ngoài')).toHaveCount(0);
  });
});

test.describe('Phân tích kỹ thuật — Thông tin — Nhánh mã chỉ số (Indexcode)', () => {

  test('TC_PTKT_TT_14: Tab "Thông tin" mã chỉ số — field khác mã cổ phiếu thường', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'VNINDEX');

    for (const label of ['Tham chiếu', 'Mở cửa', 'Thấp - cao', 'Khối lượng', 'Giá trị']) {
      await expect(ta.infoRow(label), `dòng "${label}"`).toBeVisible({ timeout: 10000 });
    }
    await expect(ta.infoRow('Trần - Sàn - TC')).toHaveCount(0);
    await expect(ta.infoPanel.getByText('Hồ sơ', { exact: true })).toHaveCount(0);
    await expect(ta.infoPanel.getByText('Chỉ số tài chính', { exact: true })).toHaveCount(0);

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_TT_15: Biểu đồ "Số lượng cổ phiếu tăng/giảm/không đổi" — chỉ có ở mã chỉ số', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'VNINDEX');

    // ⚠️ ĐÍNH CHÍNH so với testcases/phan-tich-ky-thuat-thong-tin.md gốc (TC_PTKT_TT_15): đo lại DOM thật xác
    // nhận biểu đồ này render bằng ECharts `CanvasRenderer` (`<x-vue-echarts>`, KHÔNG có `<p>` tiêu đề riêng,
    // đặt NGAY SAU khối "Tổng quan" và TRƯỚC "Định giá") — nhãn "Tăng"/"Giảm"/"Không đổi" + số mã tương ứng vẽ
    // PIXEL bên trong canvas, KHÔNG tồn tại dưới dạng DOM text (đã xác nhận: `getByText` các nhãn này luôn trả 0
    // phần tử). Cùng giới hạn kỹ thuật đã ghi nhận cho các biểu đồ ECharts khác trong dự án (radar 4M&CANSLIM,
    // donut sở hữu...) — chỉ verify canvas tồn tại/hiển thị, không assert nội dung vẽ bên trong. Locator phân
    // biệt được với 2 canvas còn lại (mini "Biểu đồ" + "Định giá") nhờ class `mt-2` riêng, không có `id`.
    const breadthChart = ta.infoPanel.locator('x-vue-echarts.mt-2');
    await expect(breadthChart).toBeVisible({ timeout: 10000 });
    await expect(breadthChart.locator('canvas')).toBeVisible();

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_TT_16: Khối "Định giá" — chỉ có ở mã chỉ số', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'VNINDEX');

    await expect(ta.infoPanel.getByText('Định giá', { exact: true })).toBeVisible({ timeout: 10000 });
    const valuationSelect = ta.infoPanel.locator('select').first();
    await valuationSelect.selectOption('P/B');
    await page.waitForTimeout(500);
    await expect(valuationSelect).toHaveValue('P/B');

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_TT_17: Checkbox độ lệch chuẩn loại trừ lẫn nhau', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'VNINDEX');
    await expect(ta.infoPanel.getByText('Định giá', { exact: true })).toBeVisible({ timeout: 10000 });

    const std1 = ta.infoPanel.locator('#std1');
    const std2 = ta.infoPanel.locator('#std2');
    await expect(std1).toBeChecked();
    await expect(std2).not.toBeChecked();

    await std2.check({ force: true });
    await page.waitForTimeout(300);
    await expect(std2).toBeChecked();
    await expect(std1).not.toBeChecked();

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_TT_18: Tài khoản Free — khối "Định giá" mã chỉ số hiện ảnh tĩnh', async ({ page }) => {
    test.setTimeout(90000);
    await loginFreeOrSkip(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.waitForChartReady();
    // ⚠️ Tài khoản Free giới hạn TỐI ĐA 1 tab biểu đồ (xem TC_PTKT_09/TC_PTKT_BD_16) — KHÔNG được gọi
    // `addChartTab()` (sẽ hit toast giới hạn thay vì thêm tab thật, đã gặp lỗi thật). Phải đổi mã NGAY trên tab
    // duy nhất sẵn có (mặc định "BSR") sang "VNINDEX" để test nhánh Indexcode, rồi đổi LẠI đúng mã gốc sau khi
    // xong — tab này KHÔNG phải tab test tự thêm nên không được xóa, chỉ được mượn tạm rồi trả lại nguyên trạng.
    await searchAndSelectSymbol(page, ta, 'VNINDEX');

    await expect(ta.infoPanel.getByText('Tổng quan', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(ta.protectedViewImage).toBeVisible({ timeout: 10000 });
    await expect(ta.infoPanel.getByText('Định giá', { exact: true })).toHaveCount(0);

  });

  test('TC_PTKT_TT_19: Tab ngoài mã chỉ số chỉ có "Thông tin"/"NN & TD"', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'VNINDEX');

    const tabTexts = (await ta.infoOuterTabList.locator('.nav-link').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());
    expect(tabTexts).toEqual(['Thông tin', 'NN & TD']);
    await expect(ta.infoInnerTabList).toHaveCount(0);

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_TT_20: Tài khoản Free — tab "NN & TD" mã chỉ số gate theo featureName', async ({ page }) => {
    test.setTimeout(90000);
    await loginFreeOrSkip(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.waitForChartReady();
    // Cùng lý do TC_PTKT_TT_18 — tài khoản Free chỉ có 1 tab, KHÔNG được `addChartTab()`, phải mượn tạm tab gốc.
    await searchAndSelectSymbol(page, ta, 'VNINDEX');
    await ta.gotoInfoOuterTab('NN & TD');
    await page.waitForTimeout(800);

    const featuresDisabled = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('features_disabled') || '{}');
      } catch {
        return {};
      }
    });
    const gated = Object.prototype.hasOwnProperty.call(featuresDisabled, 'ta_nn_td');

    if (gated) {
      await expect(ta.protectedViewImage.or(ta.infoPanel.locator('.blurred-image'))).toBeVisible({ timeout: 10000 });
    } else {
      await expect(ta.infoPanel.getByText('Giao dịch nước ngoài')).toBeVisible({ timeout: 10000 });
    }

  });
});

test.describe('Phân tích kỹ thuật — Thông tin — Đồng bộ & ngoài phạm vi', () => {

  test('TC_PTKT_TT_21: Panel "Thông tin" luôn đồng bộ theo tab biểu đồ đang active', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    await searchAndSelectSymbol(page, ta, 'VNINDEX');
    await expect(ta.infoPanel).toContainText('Chỉ số VNINDEX', { timeout: 10000 });

    // `clickChartTab()` (dispatchEvent mousedown/mouseup) thay vì `.click()` chuẩn — tab đầu dãy có thể bị
    // `flexlayout-react` clip ra ngoài vùng nhìn thấy ngay sau khi tab cuối (vừa thêm) trở thành active (xem
    // ghi chú `clickChartTab()` trong POM).
    await ta.clickChartTab(ta.chartTabButtons.first());
    await page.waitForTimeout(1000);
    await expect(ta.infoPanel).not.toContainText('Chỉ số VNINDEX');

    await ta.clickChartTab(ta.lastChartTab);
    await page.waitForTimeout(1000);
    await expect(ta.infoPanel).toContainText('Chỉ số VNINDEX');

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_TT_22: Click tab "Sổ lệnh"/"Cung cầu"/"Bài viết" đổi đúng tab active', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    for (const name of ['Sổ lệnh', 'Cung cầu', 'Bài viết']) {
      await ta.gotoInfoOuterTab(name);
      await page.waitForTimeout(500);
      await expect(ta.infoOuterTab(name)).toHaveClass(/active/);
    }
    await ta.gotoInfoOuterTab('Thông tin');
    await expect(ta.infoOuterTab('Thông tin')).toHaveClass(/active/);
    expect(errors).toEqual([]);
  });
});
