import { test, expect } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { TradingLogPage, NkOpenOptions } from '../pages/TradingLogPage';

/**
 * NKGD — tab "Phân tích giao dịch" (testcases/nhat-ky-giao-dich-phan-tich.md). prev2 + máy chủ giả (nhật ký giả 11 giao
 * dịch / 5 mã / 3 danh mục, chỉ số rủi ro giả). Tab này chỉ đọc — không có thao tác ghi.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let nk: TradingLogPage;
test.beforeEach(async ({ page }) => { nk = new TradingLogPage(page); });
test.afterEach(async () => { expect(nk.server.blocked, 'request ghi lọt tới máy chủ thật').toEqual([]); });

async function openTab(opts: NkOpenOptions = {}) {
  await nk.open({ tab: 2, ...opts });
  await expect(nk.ptStyleToggle).toBeVisible({ timeout: 30000 });
  await nk.waitData();
  await expect(nk.ptTable.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
}
const select = (label: 'Xem theo' | 'Thời gian') => nk.ptFilter(label).locator('select');
const countLabel = () => nk.pane.locator('.pt-the-tieu-de, span', { hasText: /^\d+ (mã|tháng|ngày|quý|năm|ngành|sàn)$/ }).first();
const codes = () => nk.ptTable.locator('tbody tr .stock-code').allInnerTexts();
const subHeaders = () => nk.ptTable.locator('thead tr.border-top th');

test.describe('Tổng quan', () => {
  test('TC_NKGD_PT_01: Overview — thanh lọc, nút "Phong cách và rủi ro" (thu gọn), đồ thị + bảng chi tiết theo mã', async () => {
    await openTab();
    await expect(select('Xem theo')).toHaveValue('khoang_thoi_gian');
    await expect(select('Xem theo').locator('option')).toHaveText(['Khoảng thời gian', 'Tùy chọn']);
    await expect(select('Thời gian').locator('option:checked')).toHaveText('Toàn bộ');
    await expect(select('Thời gian').locator('option')).toHaveCount(13);
    await expect(select('Thời gian').locator('option').nth(12)).toHaveText('12 tháng gần nhất');
    await expect(nk.ptFilter('Danh mục')).toContainText('Nhấn để chọn');
    await expect(nk.pane.getByRole('button', { name: 'Phong cách và rủi ro' })).toHaveAttribute('aria-expanded', 'false');
    await expect(nk.ptStyleArea).toHaveCount(0);
    await expect(nk.ptProfitBy.locator('option:checked')).toHaveText('Lợi nhuận theo cổ phiếu');
    await expect(nk.ptProfitBy.locator('option')).toHaveText(['Lợi nhuận theo ngày', 'Lợi nhuận theo tháng', 'Lợi nhuận theo quý',
      'Lợi nhuận theo năm', 'Lợi nhuận theo ngành', 'Lợi nhuận theo cổ phiếu', 'Lợi nhuận theo sàn']);
    await expect(nk.pane.getByText('Đơn vị: nghìn đồng')).toBeVisible();
    await expect(nk.pane.getByTitle('Thu nhỏ')).toBeVisible();
    await expect(nk.pane.getByTitle('Phóng to')).toBeVisible();
    await expect(nk.ptExportBtn).toBeVisible();
    await expect(nk.pane.getByText('Lãi ròng', { exact: true })).toBeVisible();
    await expect(nk.pane.getByText('Lỗ ròng', { exact: true })).toBeVisible();
    await expect(nk.ptTable.locator('thead tr').first().locator('th.pt-het-nhom, th.text-center'))
      .toHaveText(['Mã', 'Lợi nhuận', 'Hiệu suất tương đối', 'Hiệu suất tuyệt đối', 'Lệnh mua', 'Lệnh bán']);
  });

  test('TC_NKGD_PT_02: Bảng "Chi tiết theo mã" — mỗi mã 1 dòng, đếm số mã, 15 cột chỉ tiêu', async () => {
    await openTab();
    await expect(nk.pane.getByText('Chi tiết theo mã')).toBeVisible();
    expect((await codes()).sort()).toEqual(['FPT', 'HPG', 'MBB', 'SSI', 'VNM']);
    await expect(nk.pane.getByText('5 mã', { exact: true })).toBeVisible();
    await expect(subHeaders()).toHaveCount(15);
    await expect(subHeaders().first()).toHaveText('Lợi nhuận gộp');
  });
});

test.describe('Phong cách và rủi ro', () => {
  test('TC_NKGD_PT_03: Mở khối — phong cách chính + 3 thanh % theo trading_style; mức rủi ro "Lo ngại rủi ro" (chỉ số < 1)', async () => {
    await openTab();
    await nk.pane.getByRole('button', { name: 'Phong cách và rủi ro' }).click();
    await expect(nk.pane.getByRole('button', { name: 'Phong cách và rủi ro' })).toHaveAttribute('aria-expanded', 'true');
    await expect(nk.ptStyleArea.locator('.pcr-chinh b')).toHaveText('Nhà kinh doanh cổ phiếu');
    await expect(nk.ptStyleArea.locator('.pcr-thanh-nhan')).toHaveText(['Nhà kinh doanh cổ phiếu', 'Nhà giao dịch cổ phiếu', 'Nhà đầu tư giá trị']);
    await expect(nk.ptStyleArea.locator('.pcr-thanh-dong.is-chinh .pcr-thanh-nhan')).toHaveText('Nhà kinh doanh cổ phiếu');
    const pct = (await nk.ptStyleArea.locator('.pcr-thanh-so').allInnerTexts()).map((t) => parseFloat(t));
    expect(pct).toEqual([60, 30, 10]);
    await expect(nk.ptStyleArea.locator('.pcr-thang-nhan span.active')).toHaveText('Lo ngại rủi ro');
    await expect(nk.ptStyleArea.locator('.pcr-mo-ta')).toContainText('"Lo ngại rủi ro"');
    await nk.pane.getByRole('button', { name: 'Phong cách và rủi ro' }).click();
    await expect(nk.ptStyleArea).toHaveCount(0);
  });

  for (const [index, label] of [[1, 'Thờ ơ với rủi ro'], [2, 'Ưa thích rủi ro']] as const) {
    test(`TC_NKGD_PT_04: Chỉ số rủi ro = ${index} → mức "${label}"`, async () => {
      await openTab({ data: (d) => { d.riskIndex = index; } });
      await nk.pane.getByRole('button', { name: 'Phong cách và rủi ro' }).click();
      await expect(nk.ptStyleArea.locator('.pcr-thang-nhan span.active')).toHaveText(label);
      await expect(nk.ptStyleArea.locator('.pcr-mo-ta')).toContainText(`"${label}"`);
    });
  }

  test('TC_NKGD_PT_05: API chỉ số rủi ro lỗi → không lỗi JS, không thông báo, hiện mức mặc định "Lo ngại rủi ro"', async () => {
    nk.server.readFails.add('risk');
    await openTab();
    await nk.pane.getByRole('button', { name: 'Phong cách và rủi ro' }).click();
    await expect(nk.ptStyleArea.locator('.pcr-thang-nhan span.active')).toHaveText('Lo ngại rủi ro');
    await expect(nk.toastError).toHaveCount(0);
    expect(nk.pageErrors).toEqual([]);
  });

  test('TC_NKGD_PT_06: Không có trading_style → phong cách chính "-", không thanh nào được đánh dấu', async () => {
    await openTab({ data: (d) => { d.tradingStyle = { stock_trader: 0, stock_businessman: 0, value_investor: 0 }; } });
    await nk.pane.getByRole('button', { name: 'Phong cách và rủi ro' }).click();
    await expect(nk.ptStyleArea.locator('.pcr-chinh b')).toHaveText('-');
    await expect(nk.ptStyleArea.locator('.pcr-thanh-dong.is-chinh')).toHaveCount(0);
  });
});

test.describe('Lọc & nhóm lợi nhuận', () => {
  test('TC_NKGD_PT_07: Đổi "Lợi nhuận theo tháng" → tiêu đề "Chi tiết theo tháng", cột đầu "Tháng"', async () => {
    await openTab();
    await nk.ptProfitBy.selectOption({ label: 'Lợi nhuận theo tháng' });
    await expect(nk.pane.getByText('Chi tiết theo tháng')).toBeVisible();
    await expect(nk.ptTable.locator('thead tr').first().locator('th').nth(1)).toContainText('Tháng');
    await nk.ptProfitBy.selectOption({ label: 'Lợi nhuận theo ngành' });
    await expect(nk.pane.getByText('Chi tiết theo ngành')).toBeVisible();
  });

  test('TC_NKGD_PT_08: Thời gian "1 tháng gần nhất" → chỉ còn mã có giao dịch trong 30 ngày', async () => {
    await openTab();
    await select('Thời gian').selectOption({ label: '1 tháng gần nhất' });
    await expect.poll(async () => (await codes()).sort()).toEqual(['FPT', 'HPG', 'MBB', 'SSI']);
  });

  test('TC_NKGD_PT_09: "Tùy chọn" → hiện Từ ngày/Đến ngày; Từ > Đến → toast lỗi, bảng rỗng', async () => {
    await openTab();
    await select('Xem theo').selectOption('tuy_chon');
    await expect(nk.ptFilter('Thời gian')).toHaveCount(0);
    const from = nk.ptFilter('Từ ngày').locator('input');
    const to = nk.ptFilter('Đến ngày').locator('input');
    await expect(from).toBeVisible();
    await expect(to).toBeVisible();
    await to.fill('2026-01-01');
    await from.fill('2026-06-01');
    await expect(nk.toastError.filter({ hasText: 'Bạn cần nhập thời gian Từ ngày phải bé hơn Đến ngày' }).first()).toBeVisible();
    await expect(nk.ptTable.locator('tbody tr')).toHaveCount(0);
  });

  test('TC_NKGD_PT_10: Lọc danh mục "Lướt sóng" → chỉ HPG, MBB, SSI', async () => {
    await openTab();
    await nk.ptFilter('Danh mục').locator('.multiselect__tags').click();
    await nk.ptFilter('Danh mục').locator('.multiselect__option', { hasText: 'Lướt sóng' }).click();
    await expect.poll(async () => (await codes()).sort()).toEqual(['HPG', 'MBB', 'SSI']);
    await expect(nk.pane.getByText('3 mã', { exact: true })).toBeVisible();
  });
});

test.describe('Đồ thị & bảng', () => {
  test('TC_NKGD_PT_11: Phóng to đổi % zoom; Thu nhỏ trả về mức cũ; đang nhỏ nhất thì Thu nhỏ không đổi', async () => {
    await openTab();
    const zoomText = nk.pane.locator('text=/^\\d+%$/').first();
    const before = await zoomText.innerText();
    await nk.pane.getByTitle('Thu nhỏ').click();
    await expect(zoomText).toHaveText(before);
    await nk.pane.getByTitle('Phóng to').click();
    await expect(zoomText).not.toHaveText(before);
    await nk.pane.getByTitle('Thu nhỏ').click();
    await expect(zoomText).toHaveText(before);
  });

  test('TC_NKGD_PT_12: Bấm tiêu đề cột "Mã" đổi chiều sắp xếp', async () => {
    await openTab();
    const first = await codes();
    await nk.ptTable.locator('thead tr').first().locator('th').nth(1).click();
    await expect.poll(codes).not.toEqual(first);
    await expect.poll(async () => (await codes()).join()).toBe([...first].reverse().join());
  });

  test('TC_NKGD_PT_13: Bấm 1 dòng → modal "Lịch sử giao dịch" chỉ có giao dịch của mã đó; đóng bằng X', async () => {
    await openTab();
    await nk.ptTable.locator('tbody tr', { has: nk.root.page().locator('.stock-code', { hasText: /^HPG$/ }) }).click();
    await expect(nk.ptHistoryModal).toBeVisible();
    const rows = nk.ptHistoryModal.locator('.th-dong-tong-ket');
    await expect(rows.first()).toBeVisible();
    await rows.filter({ hasText: 'Lướt sóng' }).click();
    const trades = nk.ptHistoryModal.locator('.th-dong-giao-dich');
    await expect(trades).toHaveCount(2);
    for (const t of await trades.allInnerTexts()) expect(t).toMatch(/^\s*HPG/);
    await nk.ptHistoryModal.getByRole('button', { name: 'Đóng cửa sổ' }).click();
    await expect(nk.ptHistoryModal).toBeHidden();
  });

  test('TC_NKGD_PT_14: "Xuất Excel" tải file "Thống kê lợi nhuận.xlsx"', async ({ page }) => {
    await openTab();
    const [download] = await Promise.all([page.waitForEvent('download'), nk.ptExportBtn.click()]);
    expect(download.suggestedFilename()).toBe('Thống kê lợi nhuận.xlsx');
  });
});
