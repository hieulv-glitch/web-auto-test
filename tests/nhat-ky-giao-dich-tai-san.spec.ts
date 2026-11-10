import { test, expect } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { TradingLogPage, NkOpenOptions, CAT, nkDay } from '../pages/TradingLogPage';

/**
 * NKGD — tab "Tài sản" (testcases/nhat-ky-giao-dich-tai-san.md). prev2 + máy chủ giả: nhật ký giả (Dài hạn: FPT, VNM;
 * Lướt sóng: MBB, SSI (HPG đã bán hết); Cổ tức: FPT). Giá hiện tại lấy từ dữ liệu giá thật của prev2 nên chỉ assert cấu trúc
 * và quan hệ giữa các số, không assert số tuyệt đối phụ thuộc giá.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let nk: TradingLogPage;
test.beforeEach(async ({ page }) => { nk = new TradingLogPage(page); });
test.afterEach(async () => { expect(nk.server.blocked, 'request ghi lọt tới máy chủ thật').toEqual([]); });

async function openTab(opts: NkOpenOptions = {}) {
  await nk.open({ tab: 0, ...opts });
  await expect(nk.tsNavValue).toBeVisible({ timeout: 30000 });
  await nk.waitData();
  // Bảng chỉ dựng khi đã có cả giá EOD (`data_eod`) — chờ có dòng mã trước khi thao tác lọc/sắp xếp.
  if ((nk.server.data.logs.length ?? 0) > 0) await expect(nk.tsPortfolioTable.locator('.stock-code').first()).toBeVisible({ timeout: 30000 });
}
const money = (t: string) => Number(t.replace(/[^\d−-]/g, '').replace('−', '-'));
const categoryLabels = () => nk.tsPortfolioTable.locator('.category-name').allInnerTexts();
const stockCodes = () => nk.tsPortfolioTable.locator('.stock-code').allInnerTexts();
const syncWrites = () => nk.server.writesTo(/sync-after-transactions$/);

test.describe('Tổng quan & chọn danh mục', () => {
  test('TC_NKGD_TS_01: Overview — chọn danh mục, thẻ NAV, đồ thị, Phân tích danh mục, bảng Danh mục đầu tư', async () => {
    await openTab();
    await expect(nk.tsPickerBtn).toHaveText('Tất cả danh mục');
    await expect(nk.pane.getByRole('heading', { name: 'Tài sản ròng (NAV)' })).toBeVisible();
    await expect(nk.tsCountRealized).toBeChecked();
    await expect(nk.tsNavValue).toHaveText(/^\s*[\d,]+\s*đ\s*$/);
    await expect(nk.pane.locator('.nav-thay-doi-nhan')).toHaveText('hôm nay');
    for (const l of ['Vốn ban đầu', 'Giá trị thị trường', 'Giá trị margin'] as const) await expect(nk.tsStat(l)).toHaveText(/đ$/);
    for (const l of ['Lãi/lỗ chưa thực hiện', 'Lãi/lỗ đã thực hiện', 'Tiền mặt còn lại'] as const) await expect(nk.tsSmall(l)).toBeVisible();
    await expect(nk.tsSeg('Kiểu hiển thị của khối đồ thị', 'Lãi/lỗ đã thực hiện')).toHaveAttribute('aria-pressed', 'true');
    await expect(nk.tsSeg('Độ dài một cột', 'Tháng')).toHaveAttribute('aria-pressed', 'true');
    await expect(nk.tsSeg('Khoảng thời gian của đồ thị', '3 tháng')).toHaveAttribute('aria-pressed', 'true');
    await expect(nk.tsGroup('Khoảng thời gian của đồ thị').getByRole('button')).toHaveText(['1 tháng', '3 tháng', '6 tháng', '1 năm', 'Tất cả']);
    await expect(nk.pane.getByRole('heading', { name: 'Phân tích danh mục' })).toBeVisible();
    await expect(nk.tsAnalysisToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nk.pane.getByText('Cơ cấu danh mục', { exact: true })).toBeVisible();
    await expect(nk.pane.getByText('Đóng góp lãi/lỗ chưa thực hiện', { exact: true })).toBeVisible();
    await expect(nk.tsSeg('Gộp dòng của bảng', 'Danh mục')).toHaveAttribute('aria-pressed', 'true');
    await expect(nk.tsExportBtn).toBeVisible();
    await expect(nk.tsPortfolioTable.getByRole('columnheader')).toHaveText(['Mã', 'Khối lượng', 'Giá vốn (đồng)', 'Giá hiện tại (đồng)',
      'Tổng giá vốn (đồng)', 'Giá trị thị trường (đồng)', 'Lãi/lỗ chưa thực hiện (đồng)', 'Lãi/lỗ hôm nay (đồng)', 'Tỷ trọng', '']);
  });

  test('TC_NKGD_TS_02: Bảng Danh mục đầu tư — hàng Tổng 100%, danh mục xếp theo tên, mã đang nắm (HPG đã bán hết không hiện)', async () => {
    await openTab();
    await expect(nk.tsPortfolioTable.locator('tbody tr').first()).toContainText('Tổng');
    await expect(nk.tsPortfolioTable.locator('tbody tr').first()).toContainText('100.00%');
    expect(await categoryLabels()).toEqual(['Cổ tức', 'Dài hạn', 'Lướt sóng']);
    expect((await stockCodes()).map((c) => c.replace('*', '').trim()).sort()).toEqual(['FPT', 'FPT', 'MBB', 'SSI', 'VNM']);
    await expect(nk.tsCategoryRow('Dài hạn')).toContainText(/Vốn ban đầu\s*500\.0 tr/);
    await expect(nk.tsCategoryRow('Lướt sóng')).toContainText('Vốn (tự động)');
  });

  test('TC_NKGD_TS_03: Chọn danh mục — đang "Tất cả", bỏ tick "Dài hạn" → "2/3 danh mục", bảng bỏ Dài hạn', async () => {
    await openTab();
    await nk.tsPickerBtn.click();
    await expect(nk.tsPickerMenu.locator('label')).toHaveText(['Tất cả danh mục', 'Cổ tức', 'Dài hạn', 'Lướt sóng']);
    for (const l of ['Tất cả danh mục', 'Cổ tức', 'Dài hạn', 'Lướt sóng']) await expect(nk.tsPickerItem(l)).toBeChecked();
    await nk.tsPickerItem('Dài hạn').click();
    await expect(nk.tsPickerBtn).toHaveText('2/3 danh mục');
    await expect(nk.tsPickerItem('Dài hạn')).not.toBeChecked();
    await expect(nk.tsPickerItem('Tất cả danh mục')).not.toBeChecked();
    await expect.poll(categoryLabels).toEqual(['Cổ tức', 'Lướt sóng']);
  });

  test('TC_NKGD_TS_04: Bỏ tick "Tất cả danh mục" → "Chưa chọn danh mục", bảng trống; tick 1 danh mục → chỉ danh mục đó', async () => {
    await openTab();
    await nk.tsPickerBtn.click();
    await nk.tsPickerItem('Tất cả danh mục').click();
    await expect(nk.tsPickerBtn).toHaveText('Chưa chọn danh mục');
    for (const l of ['Cổ tức', 'Dài hạn', 'Lướt sóng']) await expect(nk.tsPickerItem(l)).not.toBeChecked();
    await expect(nk.tsPortfolioTable).toContainText('Chưa nắm giữ mã nào trong danh mục');
    await nk.tsPickerItem('Lướt sóng').click();
    await expect(nk.tsPickerBtn).toHaveText('Lướt sóng');
    await expect.poll(categoryLabels, { timeout: 15000 }).toEqual(['Lướt sóng']);
    await nk.tsPickerItem('Tất cả danh mục').click();
    await expect(nk.tsPickerBtn).toHaveText('Tất cả danh mục');
  });

  test('TC_NKGD_TS_05: Không có danh mục nào → không hiện thanh chọn danh mục, bảng "Chưa nắm giữ mã nào"', async () => {
    await openTab({ data: (d) => { d.categories = []; d.logs = []; d.capital = {}; } });
    await expect(nk.pane.locator('.category-bar')).toHaveCount(0);
    await expect(nk.tsPortfolioTable).toContainText('Chưa nắm giữ mã nào trong danh mục');
    await expect(nk.pane.getByText('Chưa có mã nào đang nắm giữ')).toBeVisible();
  });
});

test.describe('Thẻ NAV & đồ thị', () => {
  test('TC_NKGD_TS_06: Bỏ tick "Tính lãi/lỗ đã thực hiện" → NAV giảm đúng bằng lãi/lỗ đã thực hiện; nhớ qua F5', async ({ page }) => {
    await openTab();
    await expect.poll(async () => money(await nk.tsNavValue.innerText()), { timeout: 15000 }).toBeGreaterThan(0);
    const navOn = money(await nk.tsNavValue.innerText());
    const realized = money(await nk.tsSmall('Lãi/lỗ đã thực hiện').locator('.o-nho-so').innerText());
    expect(realized).toBe(11_400_000);
    await nk.tsCountRealized.uncheck();
    await expect.poll(async () => money(await nk.tsNavValue.innerText())).toBe(navOn - realized);
    expect(await nk.ls('estate_co_cau_tien_mat_lai_lo')).toBe('0');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await nk.waitTabsOrRetry();
    await expect(nk.tsCountRealized).not.toBeChecked({ timeout: 20000 });
  });

  test('TC_NKGD_TS_07: Bấm ô "Lãi/lỗ đã thực hiện" → sang tab "Giao dịch"', async () => {
    await openTab();
    await nk.tsSmall('Lãi/lỗ đã thực hiện').click();
    await expect(nk.tab('Giao dịch')).toHaveClass(/active/);
    await expect(nk.thFilterBtn).toBeVisible();
  });

  test('TC_NKGD_TS_08: "Hiệu suất NAV" ẩn nhóm "Độ dài một cột"; quay lại "Lãi/lỗ đã thực hiện" hiện lại; Tháng/Quý đổi được', async () => {
    await openTab();
    await nk.tsSeg('Độ dài một cột', 'Quý').click();
    await expect(nk.tsSeg('Độ dài một cột', 'Quý')).toHaveAttribute('aria-pressed', 'true');
    await nk.tsSeg('Kiểu hiển thị của khối đồ thị', 'Hiệu suất NAV').click();
    await expect(nk.tsSeg('Kiểu hiển thị của khối đồ thị', 'Hiệu suất NAV')).toHaveAttribute('aria-pressed', 'true');
    await expect(nk.tsGroup('Độ dài một cột')).toHaveCount(0);
    await expect(nk.pane.locator('.do-thi-trong, .nav-chu-giai').first()).toBeVisible({ timeout: 20000 });
    await nk.tsSeg('Kiểu hiển thị của khối đồ thị', 'Lãi/lỗ đã thực hiện').click();
    await expect(nk.tsGroup('Độ dài một cột')).toBeVisible();
  });

  test('TC_NKGD_TS_09: Khoảng thời gian "1 năm" — được chọn, lưu localStorage, giữ qua F5', async ({ page }) => {
    await openTab();
    await nk.tsSeg('Khoảng thời gian của đồ thị', '1 năm').click();
    await expect(nk.tsSeg('Khoảng thời gian của đồ thị', '1 năm')).toHaveAttribute('aria-pressed', 'true');
    await expect(nk.tsSeg('Khoảng thời gian của đồ thị', '3 tháng')).toHaveAttribute('aria-pressed', 'false');
    expect(await nk.ls('estate_chart_range_days')).toBe('365');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await nk.waitTabsOrRetry();
    await expect(nk.tsSeg('Khoảng thời gian của đồ thị', '1 năm')).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });
  });
});

test.describe('Phân tích danh mục', () => {
  test('TC_NKGD_TS_10: Thu gọn "Phân tích danh mục" — nhãn nút đổi, vùng ẩn, nhớ qua F5', async ({ page }) => {
    await openTab();
    await expect(nk.tsAnalysisToggle).toHaveAttribute('aria-label', 'Thu gọn phân tích danh mục');
    await nk.tsAnalysisToggle.click();
    await expect(nk.tsAnalysisToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nk.tsAnalysisToggle).toHaveAttribute('aria-label', 'Mở phân tích danh mục');
    await expect(nk.tsAnalysisArea).toBeHidden();
    expect(await nk.ls('estate_mo_muc_gop')).toBe('0');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await nk.waitTabsOrRetry();
    await expect(nk.tsAnalysisToggle).toHaveAttribute('aria-expanded', 'false', { timeout: 20000 });
    await nk.tsAnalysisToggle.click();
    await expect(nk.tsAnalysisArea).toBeVisible();
  });

  test('TC_NKGD_TS_11: Cơ cấu theo "Mã" rồi "Ngành" — chú thích đổi cột và tên; tổng tỷ trọng 100%', async () => {
    await openTab();
    const legendRows = nk.pane.locator('.co-cau-tron-chu .co-cau-chu-dong:not(.co-cau-chu-tieu-de)');
    await expect(nk.pane.locator('.co-cau-chu-tieu-de span').first()).toHaveText('Mã');
    await expect(legendRows.filter({ hasText: 'Tiền mặt' })).toHaveCount(1);
    const pct = async () => (await legendRows.locator('span:last-child').allInnerTexts()).reduce((a, t) => a + parseFloat(t), 0);
    expect(Math.abs((await pct()) - 100)).toBeLessThan(0.05);
    await nk.tsSeg('Xé nhỏ cổ phiếu theo', 'Ngành').click();
    await expect(nk.pane.locator('.co-cau-chu-tieu-de span').first()).toHaveText('Ngành');
    await expect(legendRows.filter({ hasText: /^\s*(FPT|VNM|MBB|SSI)\b/ })).toHaveCount(0);
  });

  test('TC_NKGD_TS_12: Kiểu biểu đồ "Thanh ngang" — đổi sang thanh, lưu localStorage', async () => {
    await openTab();
    await expect(nk.tsSeg('Kiểu biểu đồ cơ cấu danh mục', 'Biểu đồ tròn')).toHaveAttribute('aria-pressed', 'true');
    await nk.tsSeg('Kiểu biểu đồ cơ cấu danh mục', 'Thanh ngang').click();
    await expect(nk.pane.locator('.co-cau-bar')).toBeVisible();
    await expect(nk.pane.locator('.co-cau-tron')).toHaveCount(0);
    expect(await nk.ls('estate_kieu_co_cau')).toBe('thanh');
  });

  test('TC_NKGD_TS_13: "Đóng góp lãi/lỗ chưa thực hiện" — mỗi mã đang nắm 1 dòng kèm danh mục, trục Lỗ ← 0 → Lãi, có Tổng', async () => {
    await openTab();
    const rows = nk.pane.locator('.dong-gop-dong:not(.dong-gop-tieu-de)');
    await expect(nk.pane.locator('.dong-gop-tieu-de')).toContainText(['Mã · Danh mục']);
    await expect(nk.pane.locator('.dong-gop-truc-nhan')).toHaveText('Lỗ ← 0 → Lãi');
    await expect(rows).toHaveCount(5);
    expect((await rows.filter({ hasText: 'FPT' }).locator('.dong-gop-dm').allInnerTexts()).map((t) => t.trim()).sort()).toEqual(['Cổ tức', 'Dài hạn']);
    await expect(nk.pane.locator('.dong-gop-tong')).toContainText('Tổng');
  });
});

test.describe('Bảng Danh mục đầu tư', () => {
  test('TC_NKGD_TS_14: Gộp theo "Ngành" — dòng nhóm là ngành, không có nút "Sửa vốn ban đầu"', async () => {
    await openTab();
    await expect(nk.tsPortfolioTable.getByTitle('Sửa vốn ban đầu').first()).toBeVisible();
    await nk.tsSeg('Gộp dòng của bảng', 'Ngành').click();
    await expect.poll(categoryLabels).not.toEqual(['Cổ tức', 'Dài hạn', 'Lướt sóng']);
    await expect(nk.tsPortfolioTable.getByTitle('Sửa vốn ban đầu')).toHaveCount(0);
  });

  test('TC_NKGD_TS_15: Gập 1 danh mục; nút "Thu gọn/Mở tất cả danh mục"', async () => {
    await openTab();
    await nk.tsCategoryRow('Dài hạn').getByRole('button', { name: 'Dài hạn' }).click();
    await expect(nk.tsStockRow('VNM')).toHaveCount(0);
    await expect(nk.tsStockRow('MBB')).toBeVisible();
    const all = nk.tsPortfolioTable.getByRole('button', { name: /(Thu gọn|Mở) tất cả danh mục/ });
    await all.click();
    await expect(nk.tsPortfolioTable.locator('.stock-code')).toHaveCount(0);
    await all.click();
    await expect.poll(async () => (await stockCodes()).length).toBe(5);
  });

  test('TC_NKGD_TS_16: Bấm tiêu đề "Khối lượng" sắp xếp mã trong từng danh mục', async () => {
    await openTab();
    const vol = async () => (await nk.tsPortfolioTable.locator('tbody tr', { has: nk.root.page().locator('.stock-code') }).locator('td:nth-child(2)').allInnerTexts()).map((t) => Number(t.replace(/,/g, '')));
    await nk.tsPortfolioTable.getByRole('columnheader', { name: 'Khối lượng' }).click();
    const a = await vol();
    await nk.tsPortfolioTable.getByRole('columnheader', { name: 'Khối lượng' }).click();
    await expect.poll(vol).not.toEqual(a);
  });

  test('TC_NKGD_TS_17: "Xuất Excel" tải file lãi/lỗ (tên có dấu "/" bị trình duyệt đổi thành "_")', async ({ page }) => {
    await openTab();
    const [download] = await Promise.all([page.waitForEvent('download'), nk.tsExportBtn.click()]);
    expect(download.suggestedFilename()).toMatch(/^Lãi.lỗ Nhật ký giao dịch\.xlsx$/);
  });

  test('TC_NKGD_TS_18: Nút "Mua"/"Bán" ở dòng mã → phiếu lệnh điền sẵn mã + danh mục; Bán điền khối lượng đang nắm', async () => {
    await openTab();
    await nk.tsStockRow('VNM').getByRole('button', { name: 'Mua' }).click();
    await expect(nk.ticket).toBeVisible();
    await expect(nk.ticketStockText).toHaveText('VNM');
    await expect(nk.ticketCategory.locator('option:checked')).toHaveText('Dài hạn');
    await expect(nk.ticketSide('Mua')).toHaveClass(/is-buy/);
    await nk.ticketCancel.click();
    await nk.tsStockRow('VNM').getByRole('button', { name: 'Bán' }).click();
    await expect(nk.ticketSide('Bán')).toHaveClass(/is-sell/);
    await expect(nk.ticketVolume).toHaveValue('2,000');
  });

  test('TC_NKGD_TS_19: Bấm mã CK → mở modal biểu đồ của mã (dùng chung toàn site), không mở chi tiết vị thế', async ({ page }) => {
    await openTab();
    await nk.tsStockRow('MBB').getByRole('link', { name: 'MBB' }).click();
    await expect(page.locator('.modal.show:visible').filter({ hasText: 'MBB' }).first()).toBeVisible({ timeout: 15000 });
    await expect(nk.tsDetailModal).toHaveCount(0);
  });
});

test.describe('Chi tiết vị thế của mã', () => {
  test('TC_NKGD_TS_20: Bấm dòng mã → modal chi tiết: giá trị/khối lượng, lịch sử lệnh có bộ lọc, Mua/Bán ở chân; đối soát cổ tức chỉ đọc', async () => {
    await openTab();
    await nk.tsStockRow('VNM').locator('td').nth(1).click();
    const m = nk.tsDetailModal;
    await expect(m).toBeVisible();
    await expect(m.locator('.xm-dau-ma')).toHaveText('VNM');
    await expect(m).toContainText('Giá trị đang giữ');
    await expect(m).toContainText('Khối lượng khả dụng');
    await expect(m.locator('.xm-muc-ten')).toContainText('Lịch sử lệnh mã này');
    await expect(m.getByRole('group', { name: 'Lọc lịch sử lệnh' }).getByRole('button')).toHaveText(['Tất cả', 'Mua bán', 'Cổ tức & quyền']);
    await expect(m.locator('table thead th')).toHaveText(['Loại lệnh', 'Ngày giao dịch', 'Khối lượng', 'Giá (nghìn đồng)', '']);
    await expect(m.locator('table tbody tr')).toHaveCount(2);
    await m.getByRole('group', { name: 'Lọc lịch sử lệnh' }).getByRole('button', { name: 'Cổ tức & quyền' }).click();
    await expect(m.locator('table tbody tr')).toHaveCount(1);
    await expect(m.getByRole('button', { name: 'Mua', exact: true })).toBeVisible();
    await expect(m.getByRole('button', { name: 'Bán', exact: true })).toBeVisible();
    await expect.poll(() => syncWrites().length).toBe(1);
    expect(syncWrites()[0].body).toEqual({ items: [{ danh_muc: CAT.DAI_HAN, mack: 'VNM' }], dry_run: true });
    await expect(m.locator('.xm-gdkhq')).toHaveCount(0);
  });

  test('TC_NKGD_TS_21: Chi tiết 1 lệnh trong lịch sử → màn "Chi tiết giao dịch", nút "Quay lại trang của mã"', async () => {
    await openTab();
    await nk.tsStockRow('VNM').locator('td').nth(1).click();
    const m = nk.tsDetailModal;
    await m.locator('table tbody tr').first().click();
    await expect(m.locator('.xm-dau-ma')).toHaveText('Chi tiết giao dịch');
    await expect(m.getByRole('button', { name: 'Mua', exact: true })).toHaveCount(0);
    await m.getByRole('button', { name: 'Quay lại trang của mã' }).click();
    await expect(m.locator('.xm-dau-ma')).toHaveText('VNM');
  });

  test('TC_NKGD_TS_22: Nút "Mua" ở chân modal chi tiết → phiếu lệnh của đúng mã', async () => {
    await openTab();
    await nk.tsStockRow('SSI').locator('td').nth(1).click();
    await nk.tsDetailModal.getByRole('button', { name: 'Mua', exact: true }).click();
    await expect(nk.ticket).toBeVisible();
    await expect(nk.ticketStockText).toHaveText('SSI');
    await expect(nk.ticketCategory.locator('option:checked')).toHaveText('Lướt sóng');
  });

  test('TC_NKGD_TS_23: Có sự kiện quyền chưa ghi → dải cảnh báo; "Cập nhật" ghi (dry_run=false), hiện modal kết quả', async () => {
    const group = { danh_muc: CAT.DAI_HAN, mack: 'VNM', events: [{ eventid: 7, date: nkDay(3), note: 'Trả cổ tức bằng tiền', type: 'tien_mat', ratio: 0.1 }] };
    nk.server.syncDryRun = { has_pending: true, inserted: 0, removed: 0, groups: [group] };
    nk.server.syncApply = { has_pending: true, inserted: 1, removed: 0, groups: [group] };
    await openTab();
    await nk.tsStockRow('VNM').locator('td').nth(1).click();
    const banner = nk.tsDetailModal.locator('.xm-gdkhq');
    await expect(banner).toContainText('Có giao dịch không hưởng quyền của mã này chưa được cập nhật');
    await expect(banner).toContainText('Trả cổ tức bằng tiền');
    await banner.getByRole('button', { name: 'Cập nhật' }).click();
    await expect(nk.dividendModal).toBeVisible();
    await expect(nk.dividendModal).toContainText('VNM');
    expect(syncWrites().map((w) => w.body.dry_run)).toEqual([true, false]);
  });

  test('TC_NKGD_TS_24: "Cập nhật" sự kiện quyền lỗi → toast "Không cập nhật được, vui lòng thử lại"', async () => {
    const group = { danh_muc: CAT.DAI_HAN, mack: 'VNM', events: [{ eventid: 7, date: nkDay(3), note: 'Trả cổ tức bằng tiền', type: 'tien_mat', ratio: 0.1 }] };
    nk.server.syncDryRun = { has_pending: true, inserted: 0, removed: 0, groups: [group] };
    await openTab();
    await nk.tsStockRow('VNM').locator('td').nth(1).click();
    nk.server.mode.sync = '500';
    await nk.tsDetailModal.locator('.xm-gdkhq').getByRole('button', { name: 'Cập nhật' }).click();
    await expect(nk.toastError.filter({ hasText: 'Không cập nhật được, vui lòng thử lại' })).toBeVisible();
  });
});

test.describe('Sửa vốn ban đầu', () => {
  test('TC_NKGD_TS_25: Bút chì ở dòng "Dài hạn" → "Sửa danh mục" (tên khoá); lưu 600 triệu → dòng cập nhật, định ghi setting', async () => {
    await openTab();
    await nk.tsCategoryRow('Dài hạn').getByTitle('Sửa vốn ban đầu').click();
    const m = nk.tsEditCapitalModal;
    await expect(m).toBeVisible();
    await expect(m.locator('input').first()).toHaveValue('Dài hạn');
    await expect(m.locator('input').first()).toBeDisabled();
    await expect(m.getByRole('checkbox', { name: 'Nhập giá vốn' })).toBeChecked();
    const capital = m.locator('.mc-form input:not([type="checkbox"])').nth(1);
    await expect(capital).toHaveValue('500,000,000');
    await nk.fillMoney(capital, '600000000');
    await m.locator('#saveEditCategory').click();
    await expect(m).toBeHidden();
    await expect(nk.tsCategoryRow('Dài hạn')).toContainText(/Vốn ban đầu\s*600\.0 tr/);
    await expect.poll(() => {
      const w = nk.settingWrites.filter((s) => s.key === 'capital_allocation_data_save').pop();
      return w ? JSON.parse(String(w.value))[String(CAT.DAI_HAN)]?.tong_tai_san : null;
    }).toBe('600000000');
    await nk.expectSilentSuccess();
  });

  test('TC_NKGD_TS_26: Tích "Nhập giá vốn" với vốn 0 → "Vốn ban đầu phải lớn hơn 0"; "Hủy" không lưu', async () => {
    await openTab();
    await nk.tsCategoryRow('Lướt sóng').getByTitle('Sửa vốn ban đầu').click();
    const m = nk.tsEditCapitalModal;
    await expect(m.getByRole('checkbox', { name: 'Nhập giá vốn' })).not.toBeChecked();
    await m.getByRole('checkbox', { name: 'Nhập giá vốn' }).check();
    await m.locator('#saveEditCategory').click();
    await expect(nk.toastError.filter({ hasText: 'Vốn ban đầu phải lớn hơn 0' })).toBeVisible();
    await expect(m).toBeVisible();
    await m.getByRole('button', { name: 'Hủy' }).click();
    await expect(m).toBeHidden();
    await expect(nk.tsCategoryRow('Lướt sóng')).toContainText('Vốn (tự động)');
  });
});
