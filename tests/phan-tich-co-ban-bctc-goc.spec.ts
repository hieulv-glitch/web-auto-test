import { test, expect } from '@playwright/test';
import { BctcGocPage } from '../pages/BctcGocPage';
import { FaAnalysisPage } from '../pages/FaAnalysisPage';
import { PREV2_BASE_URL } from '../pages/Prev2Session';

/**
 * PTCB — tab "BCTC gốc" (thay tab "Bài viết & Phân tích" cũ). Chạy trên prev2 (preprod mới nhất). Tab chỉ đọc; trừ
 * TC_02/TC_14 dùng dữ liệu thật, các test dùng 20 BCTC giả cố định (`fakeDocs`, 5 năm × 4 quý) để assert thứ tự,
 * lọc năm, phân trang.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(90_000);

/** Thứ tự web sắp xếp: năm giảm dần, trong năm quý giảm dần. */
const SORTED = ['2026', '2025', '2024', '2023', '2022'].flatMap((y) => ['quý 4', 'quý 3', 'quý 2', 'quý 1'].map((q) => `Báo cáo tài chính Hợp nhất ${q} năm ${y}`));

test.describe('PTCB — BCTC gốc — Tổng quan', () => {
  test('TC_PTCB_BCTC_01: Thanh tab PTCB có "BCTC gốc" (thay "Bài viết & Phân tích"); ?tab=tin-tuc mở đúng tab này', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.mainTabs).toHaveText(['Thông tin chung', 'Tài chính doanh nghiệp', '4M & CANSLIM', 'Biểu đồ', 'So sánh', 'BCTC gốc']);
    await expect(p.mainTab('BCTC gốc')).toHaveClass(/active/);
    await expect(page.getByText('Bài viết & Phân tích')).toHaveCount(0);
  });

  test('TC_PTCB_BCTC_02: Giao diện — bộ lọc Từ ngày / Đến ngày (mặc định hôm nay) + "Tìm kiếm" + bảng Mã CK / Tên tài liệu / File (dữ liệu thật)', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open({ docs: null });
    const today = await page.evaluate(() => new Date(Date.now()).toISOString().substr(0, 10));
    await expect(page.getByText('Từ ngày:', { exact: true })).toBeVisible();
    await expect(page.getByText('Đến ngày:', { exact: true })).toBeVisible();
    await expect(p.fromDate).toHaveValue(today);
    await expect(p.toDate).toHaveValue(today);
    await expect(p.searchButton).toBeVisible();
    await expect(p.headers).toHaveText(['Mã CK', 'Tên tài liệu', 'File']);
    await expect(p.rows.first()).toBeVisible({ timeout: 20000 });
    await expect(p.rows.first().locator('td').first()).toHaveText('VNM');
    await expect(p.rows.first().locator('td').nth(1)).toContainText('Báo cáo tài chính');
    // Không còn 4 thẻ con (Bản cáo bạch & BCTN / Nghị quyết / Báo cáo quản trị) và không còn khu Bài viết / Báo cáo phân tích.
    for (const gone of ['Bản cáo bạch & BCTN', 'Nghị quyết', 'Báo cáo quản trị', 'Báo cáo phân tích']) {
      await expect(page.locator('.faAnalysis-page, .c-main').first().getByText(gone, { exact: true })).toHaveCount(0);
    }
  });

  test('TC_PTCB_BCTC_03: Chỉ gọi get-document 1 lần với type=1, year=*, mack đang xem', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.rows.first()).toBeVisible();
    await page.waitForTimeout(1000);
    expect(p.documentRequests).toHaveLength(1);
    expect(p.documentRequests[0].get('type')).toBe('1');
    expect(p.documentRequests[0].get('year')).toBe('*');
    expect(p.documentRequests[0].get('mack')).toBe('VNM');
  });

  test('TC_PTCB_BCTC_04: Mặc định hiện mọi BCTC, sắp xếp năm giảm dần rồi quý giảm dần; 15 dòng/trang', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.rows).toHaveCount(15);
    expect(await p.names()).toEqual(SORTED.slice(0, 15));
  });
});

test.describe('PTCB — BCTC gốc — Lọc theo ngày', () => {
  test('TC_PTCB_BCTC_05: Tìm kiếm 01/01/2023 → 31/12/2024 → chỉ còn BCTC năm 2023–2024 (lọc theo NĂM)', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await p.search('2023-06-15', '2024-02-01');
    await expect(p.rows).toHaveCount(8);
    expect(await p.names()).toEqual(SORTED.filter((n) => /năm (2024|2023)$/.test(n)));
    expect(p.documentRequests, 'Lọc ở trình duyệt, không gọi lại API').toHaveLength(1);
  });

  test('TC_PTCB_BCTC_06: Đổi ngày mà CHƯA bấm "Tìm kiếm" → bảng chưa lọc', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await p.fromDate.fill('2025-01-01');
    await p.toDate.fill('2025-12-31');
    await page.waitForTimeout(500);
    await expect(p.rows).toHaveCount(15);
    await p.searchButton.click();
    await expect(p.rows).toHaveCount(4);
  });

  test('TC_PTCB_BCTC_07: ⚠️ Từ ngày = Đến ngày → KHÔNG lọc gì (hiện mọi năm)', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await p.search('2025-01-01', '2025-12-31');
    await expect(p.rows).toHaveCount(4);
    await p.search('2024-05-05', '2024-05-05');
    // Measured: ReportRaw chỉ lọc khi from_date != to_date — chọn đúng 1 ngày thì bộ lọc bị bỏ qua.
    await expect(p.rows).toHaveCount(15);
    expect(await p.names()).toEqual(SORTED.slice(0, 15));
  });

  test('TC_PTCB_BCTC_08: ⚠️ Khoảng ngày không có BCTC → bảng trống, không có dòng chữ báo "không có dữ liệu", ẩn phân trang', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await p.search('2030-01-01', '2031-12-31');
    await expect(p.rows).toHaveCount(0);
    await expect(p.table.locator('tbody')).toHaveText(/^\s*$/);
    await expect(p.pagination).not.toHaveClass(/custom-pagination/);
  });
});

test.describe('PTCB — BCTC gốc — Tệp & phân trang', () => {
  test('TC_PTCB_BCTC_09: Bấm icon File → mở đúng link PDF ở tab mới (window.open)', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await p.stubWindowOpen();
    await p.rows.nth(1).locator('td').last().click();
    expect(await p.openedUrls()).toEqual(['https://files.example.invalid/VNM_2026_quý3.pdf']);
  });

  test('TC_PTCB_BCTC_10: > 15 BCTC → thanh phân trang; trang 2 hiện 5 dòng còn lại', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.pagination).toHaveClass(/custom-pagination/);
    await p.pagination.locator('.page-item:not(.disabled) .page-link', { hasText: /^\s*2\s*$/ }).first().click();
    await expect(p.rows).toHaveCount(5);
    expect(await p.names()).toEqual(SORTED.slice(15));
  });

  test('TC_PTCB_BCTC_11: Bảng cao kín tới đáy màn hình (chừa thanh phân trang), co giãn theo cửa sổ', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.rows.first()).toBeVisible();
    const box = p.table.locator('.table-responsive');
    const check = async () => box.evaluate((k) => {
      const h = parseFloat((k as HTMLElement).style.height);
      return Math.abs(h - Math.max(240, window.innerHeight - k.getBoundingClientRect().top - 66));
    });
    await expect.poll(check).toBeLessThan(2);
    await page.setViewportSize({ width: 1600, height: 1100 });
    await expect.poll(check).toBeLessThan(2);
  });
});

test.describe('PTCB — BCTC gốc — Đổi mã / lỗi / tải chậm', () => {
  test('TC_PTCB_BCTC_12: Đổi mã CK ở ô tìm của PTCB → gọi lại get-document với mã mới, bảng hiện mã mới', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.rows.first()).toBeVisible();
    const fa = new FaAnalysisPage(page);
    await page.waitForTimeout(2500); // chờ danh sách mã của store nạp (cùng lý do FaAnalysisPage.waitForCompareDataReady)
    await fa.searchInput.fill('FPT');
    await fa.searchSuggestions.filter({ hasText: 'FPT' }).first().click({ timeout: 20000 });
    await expect.poll(() => p.documentRequests.map((r) => r.get('mack'))).toContain('FPT');
    await expect(p.rows.first().locator('td').first()).toHaveText('FPT');
  });

  test('TC_PTCB_BCTC_13: API lỗi 500 / mất mạng → bảng trống, không crash, không toast', async ({ page }) => {
    for (const mode of ['error', 'abort'] as const) {
      const ctxPage = mode === 'error' ? page : await page.context().newPage();
      const p = new BctcGocPage(ctxPage);
      await p.open({ docs: mode });
      await ctxPage.waitForTimeout(2000);
      await expect(p.rows, mode).toHaveCount(0);
      await expect(ctxPage.locator('.Vue-Toastification__toast'), mode).toHaveCount(0);
      expect(p.pageErrors, mode).toEqual([]);
    }
  });

  test('TC_PTCB_BCTC_14: ⚠️ Tải chậm → không có trạng thái đang tải (bảng trống tới khi có dữ liệu)', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open({ delayMs: 12000 });
    await expect(p.rows).toHaveCount(0);
    await expect(p.table.locator('.spinner-border, .c-loading')).toHaveCount(0);
    await expect(p.rows).toHaveCount(15, { timeout: 25000 });
  });

  test('TC_PTCB_BCTC_15: 🐞 Mở tab phát sinh lỗi JS "reading \'classList\'" (watcher phân trang chạy trước khi bảng được vẽ)', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.rows.first()).toBeVisible();
    await expect.poll(() => p.consoleErrors.some((e) => /reading 'classList'/.test(e)),
      { message: 'Bug: ReportRaw watch list_document_computed (immediate) gọi querySelector(.report-raw nav).classList khi chưa mount' }).toBe(true);
  });
});

test.describe('PTCB — BCTC gốc — Phân quyền & hiển thị', () => {
  test('TC_PTCB_BCTC_16: Tài khoản Free → ProtectedView che toàn tab (ảnh mờ `.blurred-image`), không có bảng, không gọi API', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open({ account: 'free' });
    await expect(page.locator('.faAnalysis-page .blurred-image')).toBeVisible({ timeout: 20000 });
    await expect(p.table).toHaveCount(0);
    await expect(p.searchButton).toHaveCount(0);
    expect(p.documentRequests).toHaveLength(0);
  });

  test('TC_PTCB_BCTC_17: Chế độ tối — bảng vẫn hiện đủ, không lỗi JS', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    await expect(p.rows).toHaveCount(15);
    await page.getByRole('banner').locator('label.c-switch').first().click();
    await expect(page.locator('.c-app')).toHaveClass(/c-dark-theme/);
    await expect(p.rows).toHaveCount(15);
    expect(p.pageErrors).toEqual([]);
  });

  test('TC_PTCB_BCTC_18: Màn hình hẹp 375px / 768px — bộ lọc + bảng vẫn hiện, dùng được', async ({ page }) => {
    const p = new BctcGocPage(page);
    await p.open();
    for (const [w, h] of [[375, 812], [768, 1024]]) {
      await page.setViewportSize({ width: w, height: h });
      await expect(p.searchButton).toBeVisible();
      await expect(p.rows.first()).toBeVisible();
    }
    await p.search('2025-01-01', '2025-12-31');
    await expect(p.rows).toHaveCount(4);
  });
});

