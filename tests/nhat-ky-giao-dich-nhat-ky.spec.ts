import { test, expect, Page } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { TradingLogPage, NkOpenOptions, CAT, nkLog, nkDate, nkDay, lastSaturday } from '../pages/TradingLogPage';

/**
 * NKGD — tab "Giao dịch" + phiếu lệnh Mua/Bán + modal Thêm/Sửa/Chi tiết/Xóa giao dịch
 * (testcases/nhat-ky-giao-dich-nhat-ky.md). prev2 + máy chủ giả: thêm/sửa/xoá giao dịch, nhập hàng loạt và đối soát cổ
 * tức đều đi vào `NkgdFakeServer`; request ghi khác bị huỷ (`afterEach` kiểm tra `blocked` rỗng).
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let nk: TradingLogPage;
test.beforeEach(async ({ page }) => { nk = new TradingLogPage(page); });
test.afterEach(async () => { expect(nk.server.blocked, 'request ghi lọt tới máy chủ thật').toEqual([]); });

async function openTab(opts: NkOpenOptions = {}, firstCategory = 'Dài hạn') {
  await nk.open({ tab: 1, ...opts });
  await expect(nk.thFilterBtn).toBeVisible({ timeout: 30000 });
  await nk.waitData();
  await expect(nk.thCategoryRow(firstCategory)).toBeVisible({ timeout: 15000 });
}
const tradeWrites = () => nk.server.writesTo(/\/(tradinglog\/(store|add-bulk)|stocks\/trading_log\/)/);
const syncWrites = () => nk.server.writesTo(/sync-after-transactions$/);
const errorToast = (text: string) => nk.toastError.filter({ hasText: text }).first();
/** Mở phiếu Mua từ thanh công cụ, chọn mã, đặt ngày làm việc gần nhất, nhập giá + khối lượng. */
async function fillBuyTicket(code = 'VNM', price = '50', volume = '1000', category = 'Dài hạn') {
  await nk.thMua.click();
  await expect(nk.ticket).toBeVisible();
  await nk.pickTicketStock(code);
  await nk.ticketCategory.selectOption({ label: category });
  await nk.setTicketDate(nkDay(1));
  await expect(nk.ticketSubmit).toBeEnabled();
  await nk.ticketPrice.fill(price);
  await nk.fillMoney(nk.ticketVolume, volume);
}
async function rowMenu(row: ReturnType<TradingLogPage['thTradeRow']>, item?: 'Sửa' | 'Xóa') {
  await nk.thRowMenu(row).click();
  await expect(nk.thMenuItems.first()).toBeVisible();
  if (item) await nk.thMenuItems.filter({ hasText: item }).click();
}
const daiHanRow = (text: string) => nk.thTradeRows.filter({ hasText: text }).first();
async function expand(name = 'Dài hạn') { await nk.thCategoryRow(name).click(); await expect(nk.thTradeRows.first()).toBeVisible(); }

test.describe('Bảng giao dịch', () => {
  test('TC_NKGD_LS_01: Overview — nút Mua/Bán/Lọc/Xuất Excel, tiêu đề cột, dòng Tổng kết + danh mục (đang gập)', async () => {
    await openTab();
    for (const b of [nk.thMua, nk.thBan, nk.thFilterBtn, nk.thExportBtn]) await expect(b).toBeVisible();
    await expect(nk.thHeader.locator('.bg-header[class*="th-cot-"]')).toHaveText(['Mã CK', 'Ngày giao dịch', 'Loại giao dịch', 'Giá thực hiện (đồng)',
      'Khối lượng', 'Phí (đồng)', 'Lãi/lỗ đã thực hiện (đồng)', 'Ghi chú']);
    await expect(nk.thSummaryRow).toContainText(/Mua 7\s*Bán 2\s*Cổ tức 2/);
    await expect(nk.pane.locator('.th-ten-danh-muc')).toHaveText(['Tổng kết toàn bộ', 'Danh mục: Cổ tức', 'Danh mục: Dài hạn', 'Danh mục: Lướt sóng']);
    await expect(nk.thCategoryRow('Dài hạn')).toContainText(/Mua 3\s*Bán 1\s*Cổ tức 1/);
    await expect(nk.thTradeRows).toHaveCount(0);
  });

  test('TC_NKGD_LS_02: Bấm dòng danh mục → mở giao dịch (mới nhất trước); bấm lần 2 → gập', async () => {
    await openTab();
    await expand('Dài hạn');
    await expect(nk.thTradeRows).toHaveCount(5);
    const dates = (await nk.thTradeRows.locator('.th-cot-ngay_giao_dich').allInnerTexts()).map((d) => d.trim().split('/').reverse().join(''));
    expect([...dates].sort().reverse()).toEqual(dates);
    await nk.thCategoryRow('Dài hạn').click();
    await expect(nk.thTradeRows).toHaveCount(0);
  });

  test('TC_NKGD_LS_03: Nút gập/mở tất cả danh mục', async () => {
    await openTab();
    await nk.thCollapseAll.click();
    await expect(nk.thTradeRows).toHaveCount(11);
    await nk.thCollapseAll.click();
    await expect(nk.thTradeRows).toHaveCount(0);
  });

  test('TC_NKGD_LS_04: Dòng giao dịch — nhãn loại, giá theo đồng, phí kèm %, lãi/lỗ có dấu, ghi chú', async () => {
    await openTab();
    await expand('Dài hạn');
    const sell = daiHanRow('Bán');
    await expect(sell.locator('.th-cot-loai_giao_dich')).toHaveText(/Bán/);
    await expect(sell.locator('.th-cot-gia_thuc_hien')).toHaveText('56,000');
    await expect(sell.locator('.th-cot-phi_calc')).toHaveText(/33,600 \(0.15%\)/);
    await expect(sell.locator('.th-cot-lai_lo_da_thuc_hien')).toHaveText('+2,600,000');
    const div = daiHanRow('Cổ tức');
    await expect(div.locator('.th-cot-loai_giao_dich')).toHaveText(/Cổ tức/);
    await expect(div).toContainText('Trả cổ tức bằng tiền, 1,500 đồng/CP');
    await expect(daiHanRow('48,000')).toContainText('Mua tích luỹ');
  });

  test('TC_NKGD_LS_05: Bánh răng "Chọn thêm cột hiển thị" — bật cột "Giá mục tiêu 1", nhớ qua F5', async ({ page }) => {
    await openTab();
    await nk.thSettingsBtn.click();
    const menu = page.locator('.dropdown-menu.show');
    await expect(menu).toContainText('Chọn thêm cột hiển thị');
    await expect(menu.locator('label')).toHaveText(['Ghi chú', 'Thiết lập', 'Sai lầm', 'Giá mục tiêu 1', 'Giá mục tiêu 2',
      'Giá mục tiêu 3', 'Giá cắt lỗ 1', 'Giá cắt lỗ 2', 'Giá cắt lỗ 3']);
    await menu.getByText('Giá mục tiêu 1').click();
    await expect(nk.thHeader.locator('.th-cot-target_price_1')).toBeVisible();
    const saved = JSON.parse((await nk.ls('field_table_trading_history_more_v2'))!);
    expect(saved.find((c: { key: string }) => c.key === 'target_price_1').is_show).toBe(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await nk.waitTabsOrRetry();
    await expect(nk.thHeader.locator('.th-cot-target_price_1')).toBeVisible({ timeout: 20000 });
  });

  test('TC_NKGD_LS_06: Bấm tiêu đề "Ngày giao dịch" đổi chiều sắp xếp trong từng danh mục', async () => {
    await openTab();
    await expand('Dài hạn');
    const read = async () => (await nk.thTradeRows.locator('.th-cot-ngay_giao_dich').allInnerTexts()).map((d) => d.trim().split('/').reverse().join(''));
    const before = await read();
    await nk.thHeaderCell('Ngày giao dịch').click();
    await expect.poll(read).toEqual([...before].reverse());
  });

  test('TC_NKGD_LS_07: Danh mục > 20 giao dịch → hiện 20 + "Tải thêm 5 giao dịch"; bấm → đủ 25', async () => {
    await openTab({ data: (d) => {
      d.logs = Array.from({ length: 25 }, (_, i) => nkLog({ mack: 'MBB', loai_giao_dich: 'mua', danh_muc: CAT.LUOT_SONG, ngay_giao_dich: nkDate(5 + i), khoi_luong: 100 }));
    } }, 'Lướt sóng');
    await expand('Lướt sóng');
    await expect(nk.thTradeRows).toHaveCount(20);
    const more = nk.pane.getByRole('button', { name: 'Tải thêm 5 giao dịch' }).or(nk.pane.getByText('Tải thêm 5 giao dịch'));
    await expect(more.first()).toBeVisible();
    await more.first().click();
    await expect(nk.thTradeRows).toHaveCount(25);
  });

  test('TC_NKGD_LS_08: "Xuất Excel" tải file "Nhật ký giao dịch.xlsx"', async ({ page }) => {
    await openTab();
    const [download] = await Promise.all([page.waitForEvent('download'), nk.thExportBtn.click()]);
    expect(download.suggestedFilename()).toBe('Nhật ký giao dịch.xlsx');
  });
});

test.describe('Lọc giao dịch', () => {
  const select = (label: string) => nk.filterField(label).locator('select');
  async function applyFilter(fn: () => Promise<void>) {
    await nk.thFilterBtn.click();
    await expect(nk.filterModal).toBeVisible();
    await fn();
    await nk.filterModal.getByRole('button', { name: 'Lọc', exact: true }).click();
    await expect(nk.filterModal).toBeHidden();
  }

  test('TC_NKGD_LS_09: Modal "Lọc giao dịch" — đủ ô, giá trị mặc định', async () => {
    await openTab();
    await nk.thFilterBtn.click();
    await expect(select('Xem theo')).toHaveValue('khoang_thoi_gian');
    await expect(select('Thời gian').locator('option:checked')).toHaveText('Toàn bộ');
    await expect(select('Thời gian').locator('option')).toHaveCount(13);
    await expect(select('Loại lệnh').locator('option')).toHaveText(['Toàn bộ', 'Mua', 'Bán']);
    await expect(nk.filterField('Mã CK')).toContainText('Nhấn để chọn');
    await expect(nk.filterField('Danh mục')).toContainText('Nhấn để chọn');
    await expect(nk.filterField('Thiết lập')).toContainText('Chọn thẻ tags');
    await expect(nk.filterField('Sai lầm')).toContainText('Chọn thẻ tags');
    await expect(nk.filterModal.getByRole('button', { name: 'Đóng', exact: true })).toBeVisible();
  });

  test('TC_NKGD_LS_10: Lọc "Loại lệnh = Bán" → chỉ còn lệnh bán', async () => {
    await openTab();
    await applyFilter(() => select('Loại lệnh').selectOption({ label: 'Bán' }).then(() => undefined));
    await expect(nk.thSummaryRow).toContainText(/Mua 0\s*Bán 2\s*Cổ tức 0/);
  });

  test('TC_NKGD_LS_11: Lọc "Mã CK = HPG" → chỉ HPG', async () => {
    await openTab();
    await applyFilter(async () => {
      await nk.filterField('Mã CK').locator('.multiselect__tags').click();
      await nk.filterField('Mã CK').locator('.multiselect__option', { hasText: /^HPG$/ }).click();
    });
    await expect(nk.thSummaryRow).toContainText(/Mua 1\s*Bán 1\s*Cổ tức 0/);
  });

  test('TC_NKGD_LS_12: Lọc "Danh mục = Cổ tức" → chỉ danh mục đó', async () => {
    await openTab();
    await applyFilter(async () => {
      await nk.filterField('Danh mục').locator('.multiselect__tags').click();
      await nk.filterField('Danh mục').locator('.multiselect__option', { hasText: /^Cổ tức$/ }).click();
    });
    await expect(nk.thSummaryRow).toContainText(/Mua 1\s*Bán 0\s*Cổ tức 1/);
  });

  test('TC_NKGD_LS_13: Lọc "Thời gian = 1 tháng" → chỉ giao dịch trong 30 ngày', async () => {
    await openTab();
    await applyFilter(() => select('Thời gian').selectOption({ label: '1 tháng' }).then(() => undefined));
    // Cổ tức VNM ghi 30 ngày trước (lùi về ngày làm việc) → ngoài mốc "1 tháng" (now − 30×24h).
    await expect(nk.thSummaryRow).toContainText(/Mua 2\s*Bán 2\s*Cổ tức 0/);
  });

  test('TC_NKGD_LS_14: "Tùy chọn" Từ ngày > Đến ngày → toast lỗi, bảng rỗng', async () => {
    await openTab();
    await applyFilter(async () => {
      await select('Xem theo').selectOption('tuy_chon');
      await nk.filterField('Từ ngày').locator('input').fill('2026-06-01');
      await nk.filterField('Đến ngày').locator('input').fill('2026-01-01');
    });
    await expect(errorToast('Bạn cần nhập thời gian Từ ngày phải bé hơn Đến ngày')).toBeVisible();
    await expect(nk.thSummaryRow).toContainText(/Mua 0\s*Bán 0\s*Cổ tức 0/);
  });

  test('TC_NKGD_LS_15: Bấm "Đóng" → không áp dụng thay đổi', async () => {
    await openTab();
    await nk.thFilterBtn.click();
    await select('Loại lệnh').selectOption({ label: 'Bán' });
    await nk.filterModal.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(nk.filterModal).toBeHidden();
    await expect(nk.thSummaryRow).toContainText(/Mua 7\s*Bán 2\s*Cổ tức 2/);
  });

  test('TC_NKGD_LS_16: Ô "Thiết lập" mở popup "Chọn thẻ Setup"', async () => {
    await openTab();
    await nk.thFilterBtn.click();
    await nk.filterField('Thiết lập').click();
    await expect(nk.modal('Chọn thẻ Setup')).toBeVisible();
    await nk.modal('Chọn thẻ Setup').getByRole('button', { name: 'Đóng cửa sổ' }).click();
    await expect(nk.modal('Chọn thẻ Setup')).toBeHidden();
    await expect(nk.filterModal).toBeVisible();
  });
});

test.describe('Phiếu lệnh Mua/Bán', () => {
  test('TC_NKGD_LS_17: Nút "Mua" mở phiếu — chọn mã, danh mục, ngày hôm nay, phí 0.15, "Tổng chi", "Xác nhận mua"', async () => {
    await openTab();
    await nk.thMua.click();
    await expect(nk.ticket).toBeVisible();
    await expect(nk.ticketSide('Mua')).toHaveClass(/is-buy/);
    await expect(nk.ticketStockInput).toHaveValue('');
    await expect(nk.ticketCategory.locator('option')).toHaveText(['Cổ tức', 'Dài hạn', 'Lướt sóng']);
    expect(await nk.ticketDate.inputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(nk.ticketFee).toHaveValue('0.15');
    await expect(nk.ticketSummary('Tổng chi')).toHaveText('0 đ');
    await expect(nk.ticketSubmit).toHaveText(/Xác nhận mua/);
    await expect(nk.ticketNote).toHaveAttribute('placeholder', 'Lý do vào lệnh...');
    await expect(nk.ticketAdvanced).toBeVisible();
    await expect(nk.ticket).toContainText('Thêm setup, sai lầm, giá mục tiêu, cắt lỗ...');
  });

  test('TC_NKGD_LS_18: Giá trị / Phí / Tổng chi tính theo đồng (giá nghìn đồng × khối lượng)', async () => {
    await openTab();
    await fillBuyTicket('VNM', '50', '1000');
    await expect(nk.ticketSummary('Giá trị')).toHaveText('50,000,000 đ');
    await expect(nk.ticket.locator('.ot-row').nth(1).locator('b')).toHaveText('75,000 đ');
    await expect(nk.ticketSummary('Tổng chi')).toHaveText('50,075,000 đ');
  });

  test('TC_NKGD_LS_19: Chọn mã → giá tự điền theo giá khớp hiện tại', async () => {
    await openTab();
    await nk.thMua.click();
    await nk.pickTicketStock('VNM');
    await expect.poll(async () => Number(await nk.ticketPrice.inputValue()), { timeout: 10000 }).toBeGreaterThan(0);
  });

  test('TC_NKGD_LS_20: Bán + chọn mã đang nắm → khối lượng tự điền = số đang nắm; "Tổng thu", "Xác nhận bán"', async () => {
    await openTab();
    await nk.thBan.click();
    await nk.ticketCategory.selectOption({ label: 'Lướt sóng' });
    await nk.pickTicketStock('SSI');
    await expect(nk.ticketVolume).toHaveValue('1,000');
    await expect(nk.ticketSide('Bán')).toHaveClass(/is-sell/);
    await expect(nk.ticketSummary('Tổng thu')).toBeVisible();
    await expect(nk.ticketSubmit).toHaveText(/Xác nhận bán/);
  });

  test('TC_NKGD_LS_22: Ngày giao dịch trong tương lai → "Ngày giao dịch phải bé hơn hoặc bằng ngày hiện tại!"', async () => {
    await openTab();
    await fillBuyTicket();
    const future = new Date(Date.now() + 7 * 86400_000);
    while ([0, 6].includes(future.getUTCDay())) future.setUTCDate(future.getUTCDate() + 1);
    await nk.setTicketDate(future.toISOString().slice(0, 10));
    await nk.ticketSubmit.click();
    await expect(errorToast('Ngày giao dịch phải bé hơn hoặc bằng ngày hiện tại!')).toBeVisible();
    expect(tradeWrites()).toEqual([]);
  });

  test('TC_NKGD_LS_23: Ngày thứ 7 → toast "Không thể thực hiện giao dịch vào ngày này…", khoá ô và nút xác nhận', async () => {
    await openTab();
    await nk.thMua.click();
    await nk.setTicketDate(lastSaturday());
    await expect(errorToast('Không thể thực hiện giao dịch vào ngày này. Vui lòng chọn một ngày làm việc khác')).toBeVisible();
    await expect(nk.ticketSubmit).toBeDisabled();
    await expect(nk.ticketPrice).toBeDisabled();
    await expect(nk.ticketCategory).toBeDisabled();
    await nk.setTicketDate(nkDay(1));
    await expect(nk.ticketSubmit).toBeEnabled();
  });

  test('TC_NKGD_LS_24: Bán vượt số đang nắm → "Khối lượng bán phải bé hơn hoặc bằng số lượng mua!"', async () => {
    await openTab();
    await nk.thBan.click();
    await nk.ticketCategory.selectOption({ label: 'Lướt sóng' });
    await nk.pickTicketStock('SSI');
    await nk.setTicketDate(nkDay(1));
    await nk.ticketPrice.fill('20');
    await nk.fillMoney(nk.ticketVolume, '5000');
    await nk.ticketSubmit.click();
    await expect(errorToast('Khối lượng bán phải bé hơn hoặc bằng số lượng mua!')).toBeVisible();
    expect(tradeWrites()).toEqual([]);
  });

  test('TC_NKGD_LS_25: Xác nhận mua thành công → POST đúng dữ liệu, đối soát cổ tức, phiếu đóng im lặng, bảng có lệnh mới', async () => {
    await openTab();
    await fillBuyTicket('VNM', '50', '1000', 'Dài hạn');
    await nk.ticketNote.fill('Mua thử');
    await nk.ticketSubmit.click();
    await expect(nk.ticket).toBeHidden();
    expect(tradeWrites()).toHaveLength(1);
    expect(tradeWrites()[0]).toMatchObject({ method: 'POST', path: expect.stringMatching(/tradinglog\/store$/),
      body: { mack: 'VNM', loai_giao_dich: 'mua', danh_muc: CAT.DAI_HAN, ngay_giao_dich: nkDay(1), gia_thuc_hien: '50', phi: 0.15, chu_thich: 'Mua thử' } });
    expect(String(tradeWrites()[0].body.khoi_luong).replace(/,/g, '')).toBe('1000');
    await expect.poll(() => syncWrites().length).toBe(1);
    expect(syncWrites()[0].body).toEqual({ items: [{ danh_muc: CAT.DAI_HAN, mack: 'VNM', ngay_giao_dich: nkDay(1) }] });
    await nk.expectSilentSuccess();
    await expect(nk.thCategoryRow('Dài hạn')).toContainText(/Mua 4/);
  });

  test('TC_NKGD_LS_26: Lỗi 500 → toast "Có lỗi xảy ra, vui lòng thử lại", phiếu vẫn mở', async () => {
    await openTab();
    nk.server.mode.store = '500';
    await fillBuyTicket();
    await nk.ticketSubmit.click();
    await expect(errorToast('Có lỗi xảy ra, vui lòng thử lại')).toBeVisible();
    await expect(nk.ticket).toBeVisible();
  });

  test('TC_NKGD_LS_28: Phí được nhớ — đổi phí, đóng phiếu, mở lại vẫn giữ', async () => {
    await openTab();
    await nk.thMua.click();
    await nk.ticketFee.fill('0.2');
    await expect.poll(() => nk.ls('trading_log_last_fee_percent')).toBe('0.2');
    await nk.ticketCancel.click();
    await nk.thBan.click();
    await expect(nk.ticketFee).toHaveValue('0.2');
  });

  test('TC_NKGD_LS_29: Đóng phiếu — Esc, nút X, "Hủy" đều đóng; bấm ra nền KHÔNG đóng', async ({ page }) => {
    await openTab();
    await nk.thMua.click();
    await page.mouse.click(30, 450);
    await expect(nk.ticket).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nk.ticket).toBeHidden();
    await nk.thMua.click();
    await nk.ticketClose.click();
    await expect(nk.ticket).toBeHidden();
    await nk.thMua.click();
    await nk.ticketCancel.click();
    await expect(nk.ticket).toBeHidden();
    expect(tradeWrites()).toEqual([]);
  });
});

test.describe('Nhập nâng cao (modal "Thêm giao dịch")', () => {
  test('TC_NKGD_LS_31: "Nhập nâng cao" → đóng phiếu, mở "Thêm giao dịch" giữ nguyên mã/loại đang nhập', async () => {
    await openTab();
    await nk.thBan.click();
    await nk.ticketCategory.selectOption({ label: 'Lướt sóng' });
    await nk.pickTicketStock('SSI');
    await nk.ticketAdvanced.click();
    await expect(nk.ticket).toBeHidden();
    await expect(nk.addModal).toBeVisible();
    await expect(nk.addModal.locator('.nav-link')).toHaveText(['Giao dịch', 'Nhập đơn lẻ', 'Nhập hàng loạt']);
    await expect(nk.addModalField('Loại giao dịch').locator('select')).toHaveValue('ban');
    await expect(nk.addModalField('Mã CK').locator('input')).toHaveValue('SSI');
    for (const l of ['Giá mục tiêu 1', 'Giá mục tiêu 2', 'Giá mục tiêu 3', 'Giá cắt lỗ 1', 'Giá cắt lỗ 2', 'Giá cắt lỗ 3']) {
      await expect(nk.addModal.getByText(l, { exact: true })).toBeVisible();
    }
  });

  test('TC_NKGD_LS_32: Giá mục tiêu trùng nhau → "Giá mục tiêu 1 phải khác giá mục tiêu 2 và 3!", không gửi', async () => {
    await openTab();
    await fillBuyTicket();
    await nk.ticketAdvanced.click();
    const tp = (n: number) => nk.addModal.locator(`xpath=.//div[normalize-space()="Giá mục tiêu ${n}"]/following::input[1]`).first();
    await tp(1).fill('60');
    await tp(2).fill('60');
    await nk.addModal.getByRole('button', { name: 'Lưu' }).click();
    await expect(errorToast('Giá mục tiêu 1 phải khác giá mục tiêu 2 và 3!')).toBeVisible();
    expect(tradeWrites()).toEqual([]);
  });

  test('TC_NKGD_LS_33: "Nhập hàng loạt" — thêm/xoá dòng; gửi khi dòng trống → toast lỗi, không gọi API', async () => {
    await openTab();
    await nk.thMua.click();
    await nk.ticketAdvanced.click();
    await nk.addModal.locator('.nav-link', { hasText: 'Nhập hàng loạt' }).click();
    const rows = nk.addModal.locator('.trading-log tbody tr').filter({ has: nk.root.page().getByRole('button', { name: 'Xóa dòng' }) });
    const n = await rows.count();
    await nk.addModal.getByText('+ Thêm giao dịch khác').click();
    await expect(rows).toHaveCount(n + 1);
    await rows.last().getByRole('button', { name: 'Xóa dòng' }).click();
    await expect(rows).toHaveCount(n);
    await nk.addModal.getByRole('button', { name: 'Lưu' }).click();
    await expect(nk.toastError.first()).toBeVisible();
    expect(tradeWrites()).toEqual([]);
  });
});

test.describe('Sửa / Chi tiết / Xoá giao dịch', () => {
  test('TC_NKGD_LS_34: Menu "..." — lệnh mua/bán có Sửa + Xóa; dòng cổ tức chỉ có Xóa', async () => {
    await openTab();
    await expand('Dài hạn');
    await rowMenu(daiHanRow('48,000'));
    await expect(nk.thMenuItems).toHaveText([/Sửa/, /Xóa/]);
    await nk.root.page().keyboard.press('Escape');
    await nk.thSummaryRow.click();
    await rowMenu(daiHanRow('Cổ tức'));
    await expect(nk.thMenuItems).toHaveText([/Xóa/]);
  });

  test('TC_NKGD_LS_35: Modal "Sửa giao dịch" điền sẵn đúng dữ liệu, Mã CK khoá', async () => {
    await openTab();
    await expand('Dài hạn');
    await rowMenu(daiHanRow('48,000'), 'Sửa');
    await expect(nk.editModal).toBeVisible();
    await expect(nk.editField('Loại giao dịch').locator('select')).toHaveValue('mua');
    await expect(nk.editField('Danh mục').locator('select option:checked')).toHaveText('Dài hạn');
    await expect(nk.editField('Mã CK').locator('input')).toHaveValue('FPT');
    await expect(nk.editField('Mã CK').locator('input')).toBeDisabled();
    await expect(nk.editField('Ngày giao dịch').locator('input')).toHaveValue(nkDate(120).slice(0, 10));
    await expect(nk.editField('Khối lượng').locator('input')).toHaveValue('1,000');
    await expect(nk.editField('Giá thực hiện (nghìn đồng)').locator('input')).toHaveValue('48');
    await expect(nk.editField('Phí (%)').locator('input')).toHaveValue('0.15');
    await expect(nk.editModal.locator('textarea')).toHaveValue('Mua tích luỹ');
    await expect(nk.editModal.getByText('Biểu đồ giá mục tiêu - cắt lỗ')).toBeVisible();
  });

  test('TC_NKGD_LS_36: Sửa thành công → PUT đúng dữ liệu, đối soát cổ tức, modal đóng, bảng cập nhật', async () => {
    await openTab();
    await expand('Dài hạn');
    await rowMenu(daiHanRow('48,000'), 'Sửa');
    await nk.editField('Giá thực hiện (nghìn đồng)').locator('input').fill('47');
    await nk.editModal.locator('textarea').fill('Sửa giá');
    await nk.editModal.getByRole('button', { name: 'Lưu' }).click();
    await expect(nk.editModal).toBeHidden();
    const put = tradeWrites().find((w) => w.method === 'PUT')!;
    expect(put.body).toMatchObject({ mack: 'FPT', loai_giao_dich: 'mua', gia_thuc_hien: '47', chu_thich: 'Sửa giá', danh_muc: CAT.DAI_HAN });
    await expect.poll(() => syncWrites().length).toBe(1);
    await nk.expectSilentSuccess();
    await expect(nk.thTradeRows.filter({ hasText: '47,000' })).toHaveCount(1);
  });

  test('TC_NKGD_LS_39: Bấm vào dòng → modal "Chi tiết giao dịch" (chỉ xem), nút "Đóng"', async () => {
    await openTab();
    await expand('Dài hạn');
    await daiHanRow('48,000').locator('.th-cot-ngay_giao_dich').click();
    await expect(nk.viewModal).toBeVisible();
    await expect(nk.viewModal).toContainText('FPT');
    await expect(nk.viewModal.getByText('Biểu đồ giá mục tiêu - cắt lỗ')).toBeVisible();
    await expect(nk.viewModal.getByRole('button', { name: 'Lưu' })).toHaveCount(0);
    await nk.viewModal.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(nk.viewModal).toBeHidden();
  });

  test('TC_NKGD_LS_40: Xoá lệnh bán → modal xác nhận → DELETE, đối soát cổ tức, dòng biến mất', async () => {
    await openTab();
    await expand('Dài hạn');
    const id = nk.server.data.logs.find((l) => l.mack === 'FPT' && l.loai_giao_dich === 'ban')!.id;
    await rowMenu(daiHanRow('Bán'), 'Xóa');
    await expect(nk.deleteModal).toBeVisible();
    await nk.deleteModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(nk.deleteModal).toBeHidden();
    expect(tradeWrites()).toEqual([expect.objectContaining({ method: 'DELETE', path: expect.stringMatching(new RegExp(`/trading_log/${id}$`)) })]);
    await expect.poll(() => syncWrites().length).toBe(1);
    await nk.expectSilentSuccess();
    await expect(nk.thCategoryRow('Dài hạn')).toContainText(/Bán 0/);
  });

  test('TC_NKGD_LS_41: Xoá lệnh mua đã bán hết → "Không thể xóa giao dịch này!", không mở xác nhận', async () => {
    await openTab();
    await expand('Lướt sóng');
    await rowMenu(nk.thTradeRows.filter({ hasText: 'HPG' }).filter({ hasText: 'Mua' }).first(), 'Xóa');
    await expect(errorToast('Không thể xóa giao dịch này!')).toBeVisible();
    await expect(nk.deleteModal).toBeHidden();
    expect(tradeWrites()).toEqual([]);
  });

  test('TC_NKGD_LS_42: Xoá lỗi 500 → toast "Có lỗi xảy ra, vui lòng thử lại", modal đóng, dòng còn', async () => {
    await openTab();
    nk.server.mode.delete = '500';
    await expand('Dài hạn');
    await rowMenu(daiHanRow('Bán'), 'Xóa');
    await nk.deleteModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(errorToast('Có lỗi xảy ra, vui lòng thử lại')).toBeVisible();
    await expect(nk.deleteModal).toBeHidden();
    await expect(daiHanRow('Bán')).toBeVisible();
  });

  test('TC_NKGD_LS_43: Sau khi thêm lệnh, đối soát có sự kiện quyền → modal "Đã cập nhật sự kiện quyền", nạp lại nhật ký', async () => {
    await openTab();
    nk.server.syncApply = { has_pending: true, inserted: 1, removed: 0, groups: [{ danh_muc: CAT.DAI_HAN, mack: 'VNM',
      events: [{ eventid: 1, date: nkDay(3), note: 'Trả cổ tức bằng tiền', type: 'tien_mat', ratio: 0.1 }] }] };
    const reads = () => nk.server.reads.getAll;
    await fillBuyTicket('VNM', '50', '1000', 'Dài hạn');
    const before = reads();
    await nk.ticketSubmit.click();
    await expect(nk.dividendModal).toBeVisible();
    await expect(nk.dividendModal).toContainText('Tài sản có thay đổi, hệ thống đã cập nhật lại sự kiện quyền:');
    await expect(nk.dividendModal).toContainText('VNM');
    await expect(nk.dividendModal).toContainText('danh mục: Dài hạn');
    await expect(nk.dividendModal).toContainText('Trả cổ tức bằng tiền');
    expect(reads()).toBeGreaterThan(before);
    await nk.dividendModal.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(nk.dividendModal).toBeHidden();
  });
});

test.describe('Phân quyền', () => {
  test('TC_NKGD_LS_44: Free — tab "Giao dịch" hiện ProtectedView, không có nút Mua/Bán/Lọc', async ({ page }: { page: Page }) => {
    await nk.open({ account: 'free', tab: 1 });
    await expect(nk.protectedView).toBeVisible({ timeout: 20000 });
    await expect(nk.thMua).toHaveCount(0);
    await expect(nk.thFilterBtn).toHaveCount(0);
    expect(page.url()).toContain('/nhat-ky-giao-dich');
  });
});
