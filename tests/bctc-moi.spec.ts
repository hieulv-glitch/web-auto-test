import { test, expect } from '@playwright/test';
import { BctcMoiPage, bctcItem } from '../pages/BctcMoiPage';
import { useReadOnlySafetyNet } from '../pages/ReadOnlySafetyNet';

/**
 * Màn "Danh sách mã có BCTC mới" (/bctc-new-list). Testcase: testcases/bctc-moi.md.
 * localhost:8080 (nhánh preprod, backend PRODUCTION) — màn chỉ đọc; `useReadOnlySafetyNet` huỷ mọi request ghi tới
 * hệ thống KFSP. Phần lớn case dùng API giả lập (`mockList`) để có dữ liệu cố định; TC_02/03/07 dùng dữ liệu thật.
 *
 * Chạy: npx playwright test tests/bctc-moi.spec.ts --project=chromium --workers=2
 */
test.use({ viewport: { width: 1600, height: 900 } });
test.setTimeout(90_000);
useReadOnlySafetyNet(test);

const now = new Date();
const curQ = Math.floor(now.getMonth() / 3) + 1;
const PREV_Q = curQ === 1 ? 4 : curQ - 1;
const YEAR = curQ === 1 ? now.getFullYear() - 1 : now.getFullYear();

const QUARTER_HEADERS = ['Mã', 'Ngành', 'Sàn', 'DT thuần - Q (tỷ)', 'Tăng trưởng DTT - Q (%)', 'LN sau thuế - Q (tỷ)',
  'Tăng trưởng LN sau thuế - Q (%)', 'EPS - Q (VNĐ)', 'EPS - TTM (VNĐ)', 'PE - D (lần)'];
const YEAR_HEADERS = ['Mã', 'Ngành', 'Sàn', 'DT thuần - Y (tỷ)', 'Tăng trưởng DTT - Y (%)', 'LN sau thuế - Y (tỷ)',
  'Tăng trưởng LN sau thuế - Y (%)', 'EPS - Y (VNĐ)', 'PE - D (lần)'];

const SAMPLE = [
  bctcItem('FPT', 'HOSE', 'Công nghệ Thông tin'),
  bctcItem('VNM', 'HOSE', 'Thực phẩm và đồ uống', { tang_truong_doanh_thu_thuan_quarter: 0, pe_day: 15.5 }),
  bctcItem('SHS', 'HNX', 'Dịch vụ tài chính', { pe_day: 8 }),
  bctcItem('BSR', 'UPCOM', 'Dầu khí', { pe_day: 20, doanh_thu_thuan_quarter: null }),
];

test.describe('Hiển thị', () => {
  test('TC_BCTCMOI_01: Menu "Phân tích cơ bản › Cập nhật BCTC mới" mở /bctc-new-list', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(SAMPLE);
    await p.open('paid', '/dashboard');
    const nav = page.locator('.c-header-nav-items');
    await nav.getByRole('link', { name: 'Phân tích cơ bản' }).first().hover();
    const item = page.getByRole('link', { name: 'Cập nhật BCTC mới', exact: true });
    await item.waitFor({ state: 'visible' });
    await item.click();
    await expect(page).toHaveURL(/\/bctc-new-list$/);
    await expect(p.title).toBeVisible({ timeout: 20_000 });
  });

  test('TC_BCTCMOI_02: Giao diện ban đầu — tiêu đề, 5 bộ lọc mặc định, kỳ = quý trước, gọi API đúng tham số', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.openReady();
    await expect(p.title).toBeVisible();
    await expect(p.periodSelect).toHaveValue('quarter');
    expect((await p.periodSelect.locator('option').allInnerTexts()).map((s) => s.trim())).toEqual(['Quý', 'Năm']);
    await expect(p.mackInput).toHaveValue('');
    await expect(p.exchangeSelect).toHaveValue('all');
    expect((await p.exchangeSelect.locator('option').allInnerTexts()).map((s) => s.trim())).toEqual(['Tất cả', 'HOSE', 'HNX', 'UPCOM']);
    await expect(p.industrySelect).toHaveValue('all');
    await expect.poll(() => p.industrySelect.locator('option').count()).toBeGreaterThan(5);
    await expect(p.watchlistSelect).toBeVisible();
    await expect(p.timeLabel).toHaveText(`Thời gian: Q${PREV_Q} ${YEAR}`);
    expect(p.calls[0]).toEqual({ type: 'bs', thoigian: 'quarter', year: String(YEAR), quarter: `Q${PREV_Q}`, myWatchListId: 'all' });
  });

  test('TC_BCTCMOI_03: Bảng dữ liệu thật — 10 cột kỳ Quý, có dòng, "SL CP có báo cáo" khớp, tối đa 20 dòng/trang', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.openReady();
    expect(await p.headers()).toEqual(QUARTER_HEADERS);
    const n = Number((await p.countLabel.innerText()).match(/(\d+) mã/)?.[1]);
    expect(n).toBeGreaterThan(0);
    await expect(p.dataRows).toHaveCount(Math.min(n, 20));
    const first = await p.cells(0);
    expect(first[0]).toMatch(/^[A-Z0-9]{3,}$/);
    expect(first[2]).toMatch(/^(HOSE|HNX|UPCOM)$/i);
    for (const c of first.slice(3)) expect(c).toMatch(/^-?[\d,]+(\.\d{1,2})?%?$/);
  });

  test('TC_BCTCMOI_04: Định dạng số — phân cách nghìn, tối đa 2 số lẻ, "%" có màu tăng/giảm/đứng, rỗng → 0', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(SAMPLE);
    await p.openReady();
    await expect(p.countLabel).toHaveText('SL CP có báo cáo: 4 mã');
    expect(await p.cells(0)).toEqual(['FPT', 'Công nghệ Thông tin', 'HOSE', '1,234.57', '12.35%', '100', '-5.5%', '1,500', '6,000.4', '10.25']);
    expect((await p.cells(3))[3]).toBe('0');
    const row0 = p.dataRows.nth(0).locator('td');
    await expect(row0.nth(4).locator('span')).toHaveClass(/text-upchange/);
    await expect(row0.nth(6).locator('span')).toHaveClass(/text-downchange/);
    await expect(p.dataRows.nth(1).locator('td').nth(4).locator('span')).toHaveClass(/text-nochange/);
  });
});

test.describe('Bộ lọc & thao tác', () => {
  test('TC_BCTCMOI_05: Kỳ "Năm" — gọi lại API thoigian=year, cột đổi sang "- Y", bỏ "EPS - TTM", Thời gian = năm trước', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(SAMPLE);
    await p.openReady();
    await p.periodSelect.selectOption('year');
    await expect.poll(() => p.lastCall()?.thoigian).toBe('year');
    await expect.poll(() => p.headers()).toEqual(YEAR_HEADERS);
    await expect(p.timeLabel).toHaveText(`Thời gian: ${YEAR - 1}`);
    expect(await p.cells(0)).toEqual(['FPT', 'Công nghệ Thông tin', 'HOSE', '5,000', '0%', '400', '3%', '5,800', '10.25']);
  });

  test('TC_BCTCMOI_06: Lọc Sàn "HNX" — chỉ còn mã sàn HNX, số lượng cập nhật; về "Tất cả" hiện lại đủ', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(SAMPLE);
    await p.openReady();
    const before = p.calls.length;
    await p.exchangeSelect.selectOption('HNX');
    expect(await p.column(0)).toEqual(['SHS']);
    await expect(p.countLabel).toHaveText('SL CP có báo cáo: 1 mã');
    await p.exchangeSelect.selectOption('all');
    await expect(p.dataRows).toHaveCount(4);
    expect(p.calls.length).toBe(before); // lọc ở trình duyệt, không gọi lại API
  });

  test('TC_BCTCMOI_07: Lọc Ngành (dữ liệu thật) — mọi dòng còn lại cùng ngành đã chọn', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.openReady();
    const nganh = (await p.cells(0))[1];
    const value = await p.industrySelect.locator('option').evaluateAll(
      (opts, n) => (opts as HTMLOptionElement[]).find((o) => o.value.toUpperCase() === n.toUpperCase())?.value, nganh);
    expect(value, `Ngành "${nganh}" phải có trong danh sách lọc`).toBeTruthy();
    await p.industrySelect.selectOption(value!);
    const col = await p.column(1);
    expect(col.length).toBeGreaterThan(0);
    for (const c of col) expect(c.toUpperCase()).toBe(nganh.toUpperCase());
    const n = Number((await p.countLabel.innerText()).match(/(\d+) mã/)?.[1]);
    if (col.length < 20) expect(n).toBe(col.length);
    else expect(n).toBeGreaterThanOrEqual(20);
  });

  test('TC_BCTCMOI_08: Lọc Mã CK — chọn gợi ý "VNM" chỉ còn dòng VNM', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(SAMPLE);
    await p.openReady();
    // Store `list_mack` tải muộn → chờ gợi ý xuất hiện.
    await expect(async () => {
      await p.mackInput.fill('');
      await p.mackInput.pressSequentially('VNM');
      await expect(p.suggestions.first()).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });
    await p.suggestions.filter({ hasText: 'VNM' }).first().click();
    await expect.poll(() => p.column(0)).toEqual(['VNM']);
    await expect(p.countLabel).toHaveText('SL CP có báo cáo: 1 mã');
  });

  test('TC_BCTCMOI_09: Phân trang — 25 mã → trang 1 có 20 dòng, trang 2 có 5 dòng', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(Array.from({ length: 25 }, (_, i) => bctcItem(`M${String(i + 1).padStart(2, '0')}`, 'HOSE', 'Ngân hàng')));
    await p.openReady();
    await expect(p.dataRows).toHaveCount(20);
    await expect(p.countLabel).toHaveText('SL CP có báo cáo: 25 mã');
    await p.pagination.getByText('2', { exact: true }).locator('visible=true').first().click();
    await expect(p.dataRows).toHaveCount(5);
    expect((await p.column(0))[0]).toBe('M21');
  });

  test('TC_BCTCMOI_10: Sắp xếp theo cột "PE - D (lần)" — bấm 1 lần tăng dần, lần 2 giảm dần', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(SAMPLE);
    await p.openReady();
    await p.headerCell('PE - D (lần)').click();
    expect(await p.column(0)).toEqual(['SHS', 'FPT', 'VNM', 'BSR']);
    await p.headerCell('PE - D (lần)').click();
    expect(await p.column(0)).toEqual(['BSR', 'VNM', 'FPT', 'SHS']);
  });

  test('TC_BCTCMOI_11: Bấm mã → mở cửa sổ biểu đồ của mã đó', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(SAMPLE);
    await p.openReady();
    await p.dataRows.first().locator('td.mack a').click();
    await expect(p.tradingChartModal).toBeVisible({ timeout: 15_000 });
    await expect(p.tradingChartModal.locator('.modal-title')).toContainText('FPT');
  });
});

test.describe('Lỗi API & phân quyền', () => {
  test('TC_BCTCMOI_12: API danh sách lỗi 500 — bảng trống, "SL CP có báo cáo: 0 mã", bộ lọc vẫn dùng được', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.mockList(500);
    await p.openReady();
    await expect(p.dataRows).toHaveCount(0);
    await expect(p.countLabel).toHaveText('SL CP có báo cáo: 0 mã');
    await p.periodSelect.selectOption('year');
    await expect.poll(() => p.lastCall()?.thoigian).toBe('year');
  });

  test('TC_BCTCMOI_13: Tài khoản Free — menu "Phân tích cơ bản" không có mục "Cập nhật BCTC mới"', async ({ page }) => {
    const p = new BctcMoiPage(page);
    await p.open('free', '/dashboard');
    const nav = page.locator('.c-header-nav-items');
    await nav.getByRole('link', { name: 'Phân tích cơ bản' }).first().hover();
    await expect(page.getByRole('link', { name: 'Vĩ mô', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cập nhật BCTC mới', exact: true })).toHaveCount(0);
  });
});
