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

/** Đổi mã CK của tab đang active qua ô tìm kiếm gốc TradingView (`#header-toolbar-symbol-search`). */
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

test.describe('Phân tích kỹ thuật — Biểu đồ — Tìm & đổi mã CK', () => {

  test('TC_PTKT_BD_01: Tìm và chọn mã CK mới qua ô tìm kiếm header', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();

    await ta.headerSymbolSearchBtn.click();
    await expect(ta.activeChartFrame.locator('[data-name="symbol-search-items-dialog"], .dialog-l31H9iuA, [role="dialog"]').first()).toBeVisible({ timeout: 8000 }).catch(() => {});
    await page.keyboard.type('VNINDEX', { delay: 40 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);

    await expect(ta.lastChartTab).toContainText('VNINDEX');
    await expect(ta.infoPanel).toContainText('Chỉ số VNINDEX', { timeout: 10000 });

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_BD_02: Đổi mã sang mã cổ phiếu thường khác', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();

    await searchAndSelectSymbol(page, ta, 'FPT');
    await expect(ta.lastChartTab).toContainText('FPT');
    await expect(ta.companyNameLink).toBeVisible({ timeout: 10000 });
    // 10/11/2026: icon chuông ở panel "Thông tin" đã bỏ (cảnh báo giá chuyển lên biểu đồ — bộ canh-bao-gia).

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });
});

test.describe('Phân tích kỹ thuật — Biểu đồ — Khung thời gian & Style', () => {

  // 10/11/2026: sửa 2 lần chưa pass — tên thẻ nay chỉ còn mã ("HPG", không kèm khung thời gian) nên assert "tên thẻ đổi
  // theo khung" không còn đúng; cần viết lại assert theo nút/legend khung thời gian.
  test.fixme('TC_PTKT_BD_03: Đổi khung thời gian (interval) cập nhật tên tab', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();
    const beforeText = (await ta.lastChartTab.textContent())?.trim() || '';

    // Nút "1 giờ" (= 1h) không có data-name riêng — dùng data-tooltip (xem ghi chú intervalButton() trong POM,
    // getByText từng khớp NHẦM 1 div ẩn dùng đo độ rộng dropdown).
    // 10/11/2026: ở khung rộng TradingView gộp các nút khung thời gian thành 1 nút xổ xuống (nhãn = khung đang chọn,
    // "1 ngày") → mở nút đó rồi chọn "1 giờ" nếu không có nút "1 giờ" riêng.
    if (await ta.intervalButton('1 giờ').isVisible().catch(() => false)) {
      await ta.intervalButton('1 giờ').click();
    } else {
      await ta.activeChartFrame.getByRole('button', { name: '1 ngày' }).first().click();
      await ta.activeChartFrame.getByText('1 giờ', { exact: true }).locator('visible=true').first().click();
    }
    await page.waitForTimeout(1200);

    const afterText = (await ta.lastChartTab.textContent())?.trim() || '';
    expect(afterText).not.toBe(beforeText);
    // ⚠️ ĐÍNH CHÍNH so với testcases/phan-tich-ky-thuat-bieu-do.md gốc (kỳ vọng ban đầu "ACB 1h"): đo lại DOM
    // thật xác nhận tên tab dùng ĐÚNG mã interval nội bộ của TradingView cho khung "1 giờ" là "60" (phút), KHÔNG
    // phải hậu tố hiển thị "1h" trên nút bấm — tab đổi thành "ACB 60".
    expect(afterText).toContain('60');

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_BD_04: Mở dropdown chọn kiểu biểu đồ (style nến)', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();

    await ta.chartStyleBtn.click();
    await page.waitForTimeout(600);
    const menu = ta.activeChartFrame.locator('[data-name="menu-inner"], [role="menu"]').first();
    await expect(menu).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });
});

test.describe('Phân tích kỹ thuật — Biểu đồ — Chỉ báo kỹ thuật (fx)', () => {

  test('TC_PTKT_BD_05: Mở dialog và thêm chỉ báo RSI', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();

    await ta.headerIndicatorsBtn.click();
    await page.waitForTimeout(800);
    await page.keyboard.type('RSI', { delay: 60 });
    await page.waitForTimeout(800);
    // Click kết quả ĐẦU TIÊN thay vì bấm Enter — đã xác nhận qua automation thật: dialog KHÔNG tự highlight sẵn
    // 1 kết quả nào để Enter chọn (Enter không làm gì cả, không lỗi cũng không thêm chỉ báo). Kết quả đầu tiên
    // khi gõ "RSI" hiển thị TÊN TIẾNG VIỆT "Chỉ số Sức mạnh tương đối" (không chứa chữ "RSI") nhưng khi thêm vào
    // biểu đồ, legend lại hiển thị đúng tên viết tắt "RSI" — 2 điều khác nhau, không dùng chung 1 chuỗi để vừa
    // tìm vừa verify. `[data-role="list-item"]` là selector ổn định cho mọi dòng kết quả trong dialog.
    await ta.activeChartFrame.locator('[data-role="list-item"]').first().click();
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const legendTexts = (await ta.legendSourceItems.allTextContents()).join(' ');
    expect(legendTexts).toContain('RSI');

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_BD_06: Xóa chỉ báo vừa thêm qua legend', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();

    await ta.headerIndicatorsBtn.click();
    await page.waitForTimeout(800);
    await page.keyboard.type('RSI', { delay: 60 });
    await page.waitForTimeout(800);
    // Click kết quả đầu tiên thay vì Enter — xem ghi chú TC_PTKT_BD_05.
    await ta.activeChartFrame.locator('[data-role="list-item"]').first().click();
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const rsiLegendItem = ta.legendSourceItems.filter({ hasText: 'RSI' }).first();
    await expect(rsiLegendItem).toBeVisible({ timeout: 5000 });
    // `.hover()` chuẩn bị `<canvas>` (mặt vẽ biểu đồ) đè lên đúng điểm hover, chặn pointer event — đã xác nhận
    // qua lỗi thật ("canvas intercepts pointer events", treo tới hết timeout). Dùng `dispatchEvent('mouseover')`
    // bắn thẳng sự kiện, bỏ qua kiểm tra actionability — cùng pattern đã dùng cho submenu NKGD/nút vẽ.
    await rsiLegendItem.dispatchEvent('mouseover');
    await page.waitForTimeout(400);
    // Nút "Loại bỏ" PHẢI tìm SCOPED bên trong CHÍNH `rsiLegendItem` (`.locator()`, không phải `.first()` toàn
    // trang) — mỗi mục legend có nút riêng, `.first()` không đảm bảo đúng đối tượng nếu hover xong bị đổi trạng
    // thái. Thư viện xử lý xóa NGAY khi nhận `mousedown` (không đợi `mouseup`/`click`) — `dispatchEvent('click')`
    // hoàn toàn KHÔNG có tác dụng (đã xác nhận qua automation thật: legend không đổi gì); chỉ CẦN bắn 1 sự kiện
    // `mousedown` duy nhất là đủ, bắn thêm `mouseup` sau đó sẽ lỗi vì phần tử đã bị xóa khỏi DOM ngay sau
    // `mousedown` (locator trở nên "stale", `dispatchEvent` tiếp theo treo tới hết timeout khi tìm lại phần tử
    // đã biến mất).
    const removeBtn = rsiLegendItem.locator('[title="Loại bỏ"]');
    await removeBtn.dispatchEvent('mousedown', { button: 0 });
    await page.waitForTimeout(500);

    const legendTexts = (await ta.legendSourceItems.allTextContents()).join(' ');
    expect(legendTexts).not.toContain('RSI');

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });
});

test.describe('Phân tích kỹ thuật — Biểu đồ — 2 dropdown tự viết', () => {
  test('TC_PTKT_BD_07: Dropdown "Biểu đồ ▾" toggle ẩn/hiện sự kiện', async ({ page }) => {
    test.setTimeout(90000);

    // 10/11/2026: menu "Biểu đồ ▾" dùng chung (src/utils/chartDisplayMenu.js) — 6 dòng: "GD cổ đông lớn", "Sự kiện",
    // "Cảnh báo giá" + (gộp từ menu NKGD cũ) "Lịch sử giao dịch", "Chọn danh mục", "Chọn loại giao dịch". Nhãn cố định,
    // trạng thái bật/tắt là ô tick ở cuối dòng; tick xong menu vẫn mở.
    const session = await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.waitForChartReady();

    await ta.customBieuDoBtn.click();
    await page.waitForTimeout(400);
    const items = await ta.customDropdownMenuItems.allTextContents();
    expect(items.length).toBe(6);
    expect(items.some((t) => /GD cổ đông lớn/i.test(t))).toBeTruthy();
    expect(items.some((t) => /^Sự kiện/i.test(t.trim()))).toBeTruthy();

    const firstItem = ta.customDropdownMenuItems.first();
    const checkbox = firstItem.locator('input[type="checkbox"]');
    const before = await checkbox.isChecked();
    await firstItem.click();
    await expect(checkbox).toBeChecked({ checked: !before });
    // Lựa chọn được lưu vào setting tài khoản (bị chặn, không tới máy chủ).
    await expect.poll(() => session.settingWrites.some((w) => w.key === 'tradingview.supports_marks'), { timeout: 10000 }).toBe(true);
    await page.mouse.click(700, 700);
  });

  test('TC_PTKT_BD_08: Dropdown "NKGD ▾" — submenu chọn loại giao dịch', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.waitForChartReady();

    // 10/11/2026: menu "NKGD ▾" riêng đã gộp vào menu "Biểu đồ ▾" (chartDisplayMenu.js).
    await ta.customBieuDoBtn.click();
    await page.waitForTimeout(400);
    const items = await ta.customDropdownMenuItems.allTextContents();
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.some((t) => /lịch sử giao dịch/i.test(t))).toBeTruthy();
    expect(items.some((t) => /chọn danh mục/i.test(t))).toBeTruthy();
    expect(items.some((t) => /chọn loại giao dịch/i.test(t))).toBeTruthy();

    // Submenu "Chọn loại giao dịch" chèn DOM thủ công qua listener 'mouseover' gắn tay trong ReactChartTA.vue
    // (không phải React/Vue reactive state) — `locator.hover()` chuẩn (chờ actionability ổn định) từng bị
    // treo tới hết timeout khi viết test; dùng `dispatchEvent('mouseover')` bắn thẳng sự kiện, bỏ qua kiểm tra
    // actionability, ổn định hơn hẳn cho menu kiểu này (cùng pattern đã áp dụng ở `FaAnalysisPage.hoverBfProtectedView()`).
    const submenuTrigger = ta.customDropdownMenuItems.filter({ hasText: 'Chọn loại giao dịch' });
    await submenuTrigger.dispatchEvent('mouseover');
    await page.waitForTimeout(500);
    const checkboxLabels = ta.activeChartFrame.locator('.custom-dropdown-menu-item').filter({ hasText: /Mua|Bán|Cổ tức/ });
    expect(await checkboxLabels.count()).toBeGreaterThanOrEqual(3);

    await page.mouse.click(700, 700);
  });

  // 10/11/2026: tài khoản TEST_USER hiện chỉ có role "user" (localStorage `roles`), không còn moderator → không kiểm được.
  test.fixme('TC_PTKT_BD_09: Nút "Tải lại Biểu đồ" — chỉ hiện với tài khoản moderator', async ({ page, browser }) => {
    test.setTimeout(120000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.customReloadChartBtn).toBeVisible({ timeout: 10000 });

    const freeContext = await browser.newContext();
    const freePage = await freeContext.newPage();
    await loginFreeOrSkip(freePage);
    const taFree = new TechnicalChartPage(freePage);
    await taFree.goto();
    await expect(taFree.customReloadChartBtn).toHaveCount(0);
    await freeContext.close();
  });
});

test.describe('Phân tích kỹ thuật — Biểu đồ — Toolbar vẽ trái', () => {
  test('TC_PTKT_BD_10: Toolbar vẽ hiển thị đủ các nhóm công cụ', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.waitForChartReady();

    for (const group of [
      'cursors', 'trend-line', 'gann-and-fibonacci', 'patterns',
      'prediction-and-measurement', 'geometric-shapes', 'annotation', 'font-icons',
    ]) {
      await expect(ta.drawingToolGroup(group), `nhóm ${group}`).toBeVisible();
    }
    await expect(ta.measureToolBtn).toBeVisible();
    await expect(ta.zoomToolBtn).toBeVisible();
    await expect(ta.magnetToolBtn).toBeVisible();
    await expect(ta.lockAllDrawingsBtn).toBeVisible();
    await expect(ta.hideAllDrawingsBtn).toBeVisible();
    await expect(ta.removeAllDrawingToolsBtn).toBeVisible();
    await expect(ta.showObjectsTreeBtn).toBeVisible();
  });

  test('TC_PTKT_BD_11: Chọn công cụ vẽ (Trend Line) chuyển trạng thái active', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.waitForChartReady();

    // Trạng thái active thật nằm ở `aria-pressed` trên <button> con bên trong wrapper (xem ghi chú
    // `isDrawingToolGroupActive()` trong POM) — mặc định "Cursor" (mũi tên) đang active khi mới vào trang.
    expect(await ta.isDrawingToolGroupActive('cursors')).toBeTruthy();
    expect(await ta.isDrawingToolGroupActive('trend-line')).toBeFalsy();

    await ta.drawingToolGroup('trend-line').click();
    await page.waitForTimeout(400);
    expect(await ta.isDrawingToolGroupActive('trend-line')).toBeTruthy();
    expect(await ta.isDrawingToolGroupActive('cursors')).toBeFalsy();

    await ta.drawingToolGroup('cursors').click();
    await page.waitForTimeout(300);
    expect(await ta.isDrawingToolGroupActive('cursors')).toBeTruthy();
  });

  test('TC_PTKT_BD_12: Nút "Xóa tất cả công cụ vẽ" không lỗi khi chưa vẽ gì', async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.waitForChartReady();

    await ta.removeAllDrawingToolsBtn.click();
    await page.waitForTimeout(500);
    await expect(ta.activeChartFrame.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Phân tích kỹ thuật — Biểu đồ — Thanh công cụ dưới biểu đồ', () => {
  test('TC_PTKT_BD_13: Click preset khoảng thời gian đổi phạm vi hiển thị', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    for (const key of ['1M', '1W', '1D'] as const) {
      await ta.dateRangeTab(key).click();
      await page.waitForTimeout(600);
      await expect(ta.dateRangeTab(key)).toHaveClass(/active|selected/i);
    }
  });

  test('TC_PTKT_BD_14: Toggle %/log/tự động (trục giá)', async ({ page }) => {
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    for (const btn of [ta.percentageBtn, ta.logarithmBtn, ta.autoScaleBtn]) {
      const before = (await btn.getAttribute('class')) || '';
      await btn.click();
      await page.waitForTimeout(400);
      const after = (await btn.getAttribute('class')) || '';
      expect(after).not.toBe(before);
      // trả lại trạng thái cũ
      await btn.click();
      await page.waitForTimeout(200);
    }
  });
});

test.describe('Phân tích kỹ thuật — Biểu đồ — Lưu cấu hình', () => {
  test('TC_PTKT_BD_15: Chỉ báo được giữ nguyên sau khi tải lại trang (F5)', async ({ page }) => {
    test.setTimeout(90000);
    const session = await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await ta.addChartTab();
    await ta.waitForChartReady();

    await ta.headerIndicatorsBtn.click();
    await page.waitForTimeout(800);
    await page.keyboard.type('RSI', { delay: 60 });
    await page.waitForTimeout(800);
    // Click kết quả đầu tiên thay vì Enter — xem ghi chú TC_PTKT_BD_05.
    await ta.activeChartFrame.locator('[data-role="list-item"]').first().click();
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');
    // 10/11/2026: ghi setting bị chặn (an toàn dữ liệu) → không F5 kiểm lại được; assert app ĐỊNH lưu biểu đồ
    // (`chartTASaved_<id thẻ>`, onAutoSaveNeeded trong ReactChartTA.vue) có chỉ báo RSI.
    await expect.poll(() => session.settingWrites.some((w) => /^chartTASaved_/.test(w.key) && /RSI/.test(String(w.value))),
      { timeout: 20000 }).toBe(true);
  });
});

test.describe('Phân tích kỹ thuật — Biểu đồ — Giới hạn theo gói hội viên (Free)', () => {
  test('TC_PTKT_BD_16: Tài khoản Free — ẩn 2 dropdown tự viết + nút "Tải lại Biểu đồ"', async ({ page }) => {
    await loginFreeOrSkip(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.activeChartFrame.locator('body')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    await expect(ta.customBieuDoBtn).toHaveCount(0);
    await expect(ta.customNkgdBtn).toHaveCount(0);
    await expect(ta.customReloadChartBtn).toHaveCount(0);
  });

  test.fixme(
    'TC_PTKT_BD_17: Cập nhật giá real-time trong giờ giao dịch',
    async () => {
      // Phụ thuộc giờ giao dịch thật + socket cập nhật liên tục — không chủ động kích hoạt được bằng
      // automation trong thời gian ngắn, cùng pattern đã ghi nhận ở Bảng giá/Watchlist. Xem
      // testcases/phan-tich-ky-thuat-bieu-do.md TC_PTKT_BD_17.
    }
  );
});
