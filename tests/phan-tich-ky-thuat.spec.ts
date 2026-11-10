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

// (10/11/2026: ghi chú dưới đây LỖI THỜI — ghi setting bị chặn + bố cục cố định theo test nên chạy song song được, đã bỏ mode 'serial'.)
// ⚠️ AN TOÀN DỮ LIỆU — chạy file này (và 2 file `-bieu-do.spec.ts`/`-thong-tin.spec.ts`) BẮT BUỘC kèm
// `--workers=1` khi chạy chung nhiều describe block/nhiều file cùng lúc. Layout đa biểu đồ (tab nào đang mở) là
// setting lưu SERVER-SIDE DÙNG CHUNG cho tài khoản test (xem ghi chú an toàn dữ liệu ở đầu TechnicalChartPage.ts
// và testcases/phan-tich-ky-thuat.md). Đã xác nhận qua automation thật: để nhiều describe block/file cùng thêm/
// xóa tab chạy SONG SONG (mặc định `fullyParallel: true`, 3 worker) khiến 2+ test cùng thêm/xóa tab gần như đồng
// thời trên CÙNG tài khoản — lần "save" (debounce) cuối cùng thắng có thể ghi đè mất tab của test khác, để lại
// tab rác tồn đọng hoặc khiến assertion của test khác sai (đã đo được tài khoản có dư tới 10 tab dù baseline chỉ
// 5, trước khi phát hiện + sửa nguyên nhân này). CỐ Ý KHÔNG dùng `test.describe.configure({ mode: 'serial' })`
// Ở CẤP FILE — mode 'serial' của Playwright tự động SKIP toàn bộ test còn lại trong nhóm ngay khi 1 test fail
// (fail-fast), che mất kết quả thật của các test độc lập phía sau; dùng `--workers=1` khi chạy đạt cùng mục tiêu
// (không có 2 test chạy đồng thời) mà KHÔNG có tác dụng phụ fail-fast này. Xem TRACKER.md mục "Phân tích kỹ
// thuật" để biết chi tiết.

test.describe('Phân tích kỹ thuật — Truy cập & Tổng quan', () => {
  test('TC_PTKT_01: Overview màn hình khi đã đăng nhập', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    await expect(ta.chartTabButtons.first()).toBeVisible();
    const count = await ta.chartTabCount();
    expect(count, 'Phải có ít nhất 1 tab biểu đồ').toBeGreaterThan(0);
    await expect(ta.activeChartFrame.locator('body')).toBeVisible({ timeout: 20000 });
    await expect(ta.borderTab('Thông tin')).toBeVisible();
    expect(errors, 'Không có lỗi JS khi tải trang').toEqual([]);
  });

  test('TC_PTKT_02: Chặn truy cập khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/phan-tich-ky-thuat');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('TC_PTKT_03: Điều hướng vào màn từ menu header', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // 10/11/2026: mục menu header đổi tên "Phân tích kỹ thuật" → "Biểu đồ" (mainMenu.js).
    await page.getByRole('link', { name: 'Biểu đồ', exact: true }).first().click();
    await page.waitForURL(/\/phan-tich-ky-thuat/);
    const ta = new TechnicalChartPage(page);
    await expect(ta.chartTabButtons.first()).toBeVisible();
  });
});

test.describe('Phân tích kỹ thuật — Quản lý nhiều tab biểu đồ', () => {
  // Layout đa biểu đồ lưu server-side DÙNG CHUNG cho tài khoản test — chạy TUẦN TỰ để tránh 2 test cùng
  // thêm/xóa tab song song ghi đè lẫn nhau (xem ghi chú an toàn dữ liệu ở đầu testcases/phan-tich-ky-thuat.md).

  test('TC_PTKT_04: Thêm 1 tab biểu đồ mới qua nút "+"', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    // `.flexlayout__tab_button` chứa icon/span lồng nhau → `textContent` có nhiều khoảng trắng/newline thừa,
    // chuẩn hoá về 1 dòng trước khi so sánh.
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    const before = (await ta.chartTabTexts()).map(norm);
    await ta.addChartTab();
    const after = (await ta.chartTabTexts()).map(norm);
    expect(after.length).toBe(before.length + 1);
    // Tên tab mới copy đúng mã/interval của tab cuối cùng trước đó
    expect(after[after.length - 1]).toBe(before[before.length - 1]);

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_05: Chuyển đổi qua lại giữa các tab biểu đồ đồng bộ panel "Thông tin"', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    await ta.addChartTab();
    // Đổi mã tab mới sang VNINDEX để có tín hiệu rõ ràng phân biệt được panel đã đồng bộ
    await ta.headerSymbolSearchBtn.click();
    await page.keyboard.type('VNINDEX', { delay: 40 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await expect(ta.infoPanel).toContainText('VNINDEX', { timeout: 10000 });

    // Chuyển sang tab đầu tiên (mã khác) — dùng `clickChartTab()` (dispatchEvent mousedown/mouseup) thay vì
    // `.click()` chuẩn: tab đầu dãy có thể bị `flexlayout-react` clip ra ngoài vùng nhìn thấy ngay sau khi tab
    // cuối (vừa thêm) trở thành active (xem ghi chú `clickChartTab()` trong POM).
    await ta.clickChartTab(ta.chartTabButtons.first());
    await page.waitForTimeout(1000);
    await expect(ta.infoPanel).not.toContainText('Chỉ số VNINDEX');

    // Quay lại tab VNINDEX vừa thêm (cuối danh sách)
    await ta.clickChartTab(ta.lastChartTab);
    await page.waitForTimeout(1000);
    await expect(ta.infoPanel).toContainText('Chỉ số VNINDEX');

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test('TC_PTKT_06: Đóng tab — modal xác nhận, bấm "Đóng" để hủy', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    const beforeCount = await ta.chartTabCount();

    // 10/11/2026: modal chỉ hiện với thẻ có nội dung hoặc chưa tải lần nào → đóng thẻ HPG gốc (chưa mở) của bố cục cố định.
    // KHÔNG thêm thẻ trước: thẻ mới chép thẻ cuối (HPG) nên nạp luôn dữ liệu HPG → đóng HPG không còn hỏi.
    await ta.closeIconOf(ta.chartTabButtons.filter({ hasText: 'HPG' }).first()).click();
    await expect(ta.deleteConfirmModal).toBeVisible();
    await expect(ta.deleteConfirmModal).toContainText('Đóng đồ thị');
    await expect(ta.deleteConfirmModal).toContainText('Không hỏi lại hôm nay');
    await expect(ta.deleteConfirmCheckbox).not.toBeChecked();

    await ta.deleteConfirmCloseBtn.click();
    await expect(ta.deleteConfirmModal).toBeHidden();
    expect(await ta.chartTabCount()).toBe(beforeCount);
  });

  test('TC_PTKT_07: Đóng tab — xác nhận "Xóa" thành công, không tick "Không hỏi lại hôm nay"', async ({ page }) => {
    test.setTimeout(60000);
    const session = await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    const beforeCount = await ta.chartTabCount();
    // 10/11/2026: modal chỉ hiện với thẻ có nội dung hoặc chưa hiện lần nào → đóng thẻ HPG gốc (chưa mở).
    const hpg = ta.chartTabButtons.filter({ hasText: 'HPG' }).first();
    await ta.closeIconOf(hpg).click();
    await expect(ta.deleteConfirmModal).toBeVisible();
    await ta.deleteConfirmDeleteBtn.click();
    await expect(ta.chartTabButtons).toHaveCount(beforeCount - 1);

    // 10/11/2026: tài khoản đã có sẵn setting cũ `doNotRemindToday` (app chép vào localStorage khi tải setting) → kiểm không
    // bị đặt thành HÔM NAY và app không định ghi khoá này.
    const today = new Date().toISOString().split('T')[0];
    const doNotRemind = await page.evaluate(() => localStorage.getItem('doNotRemindToday'));
    expect(doNotRemind, 'Không tick checkbox nên key này không được đặt thành hôm nay').not.toBe(today);
    expect(session.settingWrites.filter((w) => w.key === 'doNotRemindToday')).toEqual([]);
  });

  test('TC_PTKT_08: Checkbox "Không hỏi lại hôm nay" hiển thị đúng, không kích hoạt thật', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    // 10/11/2026: modal chỉ hiện với thẻ có nội dung hoặc chưa tải lần nào → đóng thẻ HPG gốc (chưa mở), không thêm thẻ trước.
    await ta.closeIconOf(ta.chartTabButtons.filter({ hasText: 'HPG' }).first()).click();
    await expect(ta.deleteConfirmModal).toBeVisible();
    await expect(ta.deleteConfirmCheckbox).toBeVisible();
    await expect(ta.deleteConfirmCheckbox).not.toBeChecked();
    // Đóng modal KHÔNG xóa để tránh mọi rủi ro với checkbox, rồi dọn dẹp qua flow xóa chuẩn riêng
    await ta.deleteConfirmCloseBtn.click();
    await expect(ta.deleteConfirmModal).toBeHidden();
  });

  test('TC_PTKT_09: Giới hạn số tab biểu đồ tối đa — tài khoản Free', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    const before = await ta.chartTabCount();
    expect(before, 'Tài khoản Free mặc định chỉ có tối đa 1 tab').toBeLessThanOrEqual(1);

    await ta.addChartTabBtn.click();
    // 10/11/2026: tài khoản Free không còn toast "tối đa 1 tab" mà mở popup chọn gói (`store.state.isShowModalPackage`,
    // reactMultiLayoutChart.js).
    await expect(page.getByRole('dialog').filter({ hasText: 'Chọn dịch vụ' })).toBeVisible({ timeout: 8000 });
    expect(await ta.chartTabCount()).toBe(before);
  });

  test('TC_PTKT_10: Đổi tên tab giữ nguyên khi đổi mã CK khác', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    await ta.addChartTab();
    const customName = 'Ghi chú của tôi';
    await ta.lastChartTab.dblclick();
    // input rename thường thay thế trực tiếp nội dung tab, dùng bàn phím để nhập tên mới
    await page.keyboard.press('Control+A');
    await page.keyboard.type(customName);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await expect(ta.lastChartTab).toContainText(customName);

    // đổi mã CK
    await ta.headerSymbolSearchBtn.click();
    await page.keyboard.type('HPG', { delay: 40 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await expect(ta.lastChartTab).toContainText(customName);

    await ta.deleteLastChartTab(true);
    await ta.waitForLayoutSaved();
  });

  test.fixme(
    'TC_PTKT_11: Liên kết đồng bộ mã giữa các tab (chấm tròn màu)',
    async () => {
      // Chưa tìm được cách giả lập ổn định sự kiện `mouseenter` để mở popper chọn màu liên kết
      // (`mouseEnterFunction` trong reactMultiLayoutChart.js dùng listener DOM thuần gắn thủ công vào phần tử
      // popper tạo động, không phải Vue/React state chuẩn) — cần thử nghiệm thêm `dispatchEvent('mouseenter')`
      // với timing khác, hoặc xác nhận cách kích hoạt ổn định trước khi tự động hoá đầy đủ. Xem
      // testcases/phan-tich-ky-thuat.md TC_PTKT_11.
    }
  );

  test('TC_PTKT_12: Lưu cấu hình sau khi tải lại trang (F5)', async ({ page }) => {
    test.setTimeout(60000);
    const session = await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    await ta.addChartTab();
    await ta.headerSymbolSearchBtn.click();
    await page.keyboard.type('VNINDEX', { delay: 40 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    const beforeCount = await ta.chartTabCount();
    // 10/11/2026: ghi setting bị chặn (an toàn dữ liệu) → không F5 kiểm lại được; assert bố cục app ĐỊNH lưu
    // (`layout_multi_ta`) có đủ số thẻ và thẻ VNINDEX.
    await expect.poll(() => {
      const w = [...session.settingWrites].reverse().find((x) => x.key === 'layout_multi_ta');
      if (!w) return null;
      const json = String(w.value);
      return { tabs: (json.match(/"component":"chartTA"/g) || []).length, vnindex: json.includes('VNINDEX') };
    }, { timeout: 15000 }).toEqual({ tabs: beforeCount, vnindex: true });
  });
});

test.describe('Phân tích kỹ thuật — Menu dọc phải (chỉ verify điều hướng)', () => {
  test('TC_PTKT_13: Chuyển đổi giữa các mục menu dọc phải', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    // 10/11/2026: cột phải bỏ mục "Cảnh báo" (đã chuyển sang canh-bao-gia) và "Cộng đồng" (DEFAULT_BORDER_LAYOUT).
    for (const name of ['Watchlist', 'Ghi chú', 'AI Chart']) {
      await ta.gotoBorderTab(name);
      await page.waitForTimeout(500);
      await expect(ta.borderTab(name)).toHaveClass(/--selected/);
    }
    await ta.gotoBorderTab('Thông tin');
    await expect(ta.borderTab('Thông tin')).toHaveClass(/--selected/);
    await expect(ta.infoPanel).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Phân tích kỹ thuật — Điều hướng', () => {
  test('TC_PTKT_14: Nút Back trình duyệt điều hướng rời khỏi trang', async ({ page }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.goto('/phan-tich-ky-thuat', { waitUntil: 'domcontentloaded' });
    await page.goBack();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('TC_PTKT_15: Click "Thông tin FA" điều hướng sang Phân tích cơ bản', async ({ page, context }) => {
    test.setTimeout(90000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await expect(ta.thongTinFaLink).toBeVisible({ timeout: 15000 });

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      ta.thongTinFaLink.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('/phan-tich-co-ban');
    await newPage.close();
  });
});

test.describe('Phân tích kỹ thuật — Dark mode & Responsive', () => {
  test('TC_PTKT_16: Bật/tắt Dark mode đổi theme toàn bộ màn hình', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();

    // Toggle theme = `.c-switch-input` (checkbox, `v-model="$store.state.darkMode"` trong `ButtonChangeTheme.vue`)
    // — class `c-dark-theme` được gắn vào `.c-app` (TheContainer.vue), KHÔNG phải <body>/<html>.
    // 10/11/2026: `click({ force: true })` vào input không đổi theme (input nằm dưới `.c-switch-slider`) → bấm nhãn.
    const darkToggle = page.locator('header label.c-switch, .c-header label.c-switch').first();
    const wasDark = await page.locator('.c-app').first().evaluate((el) => el.classList.contains('c-dark-theme'));
    if (wasDark) { await darkToggle.click(); await page.waitForTimeout(1000); }
    await darkToggle.click();
    await page.waitForTimeout(1500);
    const isDark = await page.locator('.c-app').first().evaluate((el) => el.classList.contains('c-dark-theme'));
    expect(isDark).toBeTruthy();
    await expect(ta.infoPanel).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('TC_PTKT_17: Responsive viewport tablet', async ({ page }) => {
    // Trang có nhiều socket/kết nối realtime + iframe TradingView nặng — tearing down context đôi khi vượt quá
    // timeout mặc định 30s dù bản thân test đã pass hết assertion, đã gặp thật khi viết test.
    test.setTimeout(60000);
    await loginFirst(page);
    const ta = new TechnicalChartPage(page);
    await ta.goto();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(ta.chartTabButtons.first()).toBeVisible();
    await expect(ta.infoPanel).toBeVisible();
  });
});
