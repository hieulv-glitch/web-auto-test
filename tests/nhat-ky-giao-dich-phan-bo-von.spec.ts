import { test, expect } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { TradingLogPage, CAT, NkOpenOptions } from '../pages/TradingLogPage';

/**
 * NKGD — tab "Phân bổ vốn" (testcases/nhat-ky-giao-dich-phan-bo-von.md). prev2 + máy chủ giả. Cấu hình phân bổ vốn lưu
 * ở setting `capital_allocation_data_save` (bị `Prev2Session` chặn, ghi lại ở `settingWrites`).
 * Dữ liệu giả: "Dài hạn" vốn 500.000.000 đ, % cắt lỗ tối đa 2, % cắt lỗ deal 10; "Cổ tức"/"Lướt sóng" chưa cấu hình.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let nk: TradingLogPage;
test.beforeEach(async ({ page }) => { nk = new TradingLogPage(page); });
test.afterEach(async () => { expect(nk.server.blocked, 'request ghi lọt tới máy chủ thật').toEqual([]); });

const MAX_CUT = '% Cắt lỗ tối đa trên tổng tài sản';
const DEAL_CUT = '% Cắt lỗ trên deal tiếp theo';
/** Vào tab Phân bổ vốn SAU khi app tải xong setting (như người dùng đi từ tab khác sang). Mở thẳng tab khi setting còn đang
 * tải dính bug race — xem TC_NKGD_PBV_17. */
async function openTab(opts: NkOpenOptions = {}, hasCategory = true) {
  await nk.open({ tab: 0, ...opts });
  await nk.waitData();
  await nk.waitSettingsLoaded();
  await nk.gotoTab('Phân bổ vốn');
  await expect(nk.pane.getByText('Thiết lập deal tiếp theo')).toBeVisible({ timeout: 30000 });
  if (hasCategory) await expect(nk.caPickerBtn).not.toHaveText('', { timeout: 15000 });
  // Component bỏ qua mọi thay đổi trong ~1 giây đầu sau khi nạp (`is_first_set_data`, setTimeout 1000) — chờ qua cửa sổ đó.
  await nk.root.page().waitForTimeout(1200);
}
async function pick(name: string) {
  await nk.caPickerBtn.click();
  await nk.caPickerItem(name).click();
  await expect(nk.caPickerBtn).toHaveText(name);
}
async function setPercent(label: typeof MAX_CUT | typeof DEAL_CUT, value: string) {
  await nk.caInput(label).fill(value);
  await nk.caInput(label).blur();
}
const savedCapital = () => {
  const w = nk.settingWrites.filter((s) => s.key === 'capital_allocation_data_save').pop();
  return w ? JSON.parse(String(w.value)) : null;
};

test.describe('Tổng quan & chọn danh mục', () => {
  test('TC_NKGD_PBV_01: Overview — chọn danh mục, dải 3 số, khối thiết lập, bảng trạng thái, biểu đồ cơ cấu', async () => {
    await openTab();
    await expect(nk.caPickerBtn).toHaveText('Cổ tức');
    for (const label of ['Vốn ban đầu', 'Lãi/lỗ đã thực hiện', 'Vốn khả dụng'] as const) await expect(nk.caSummary(label)).toBeVisible();
    await expect(nk.caPencil).toHaveAttribute('title', 'Sửa vốn ban đầu');
    for (const label of [MAX_CUT, 'Giá trị cắt lỗ tối đa trên tổng tài sản', DEAL_CUT, 'Phân bổ vốn cho deal tiếp theo', 'Tiền mặt', 'Margin']) {
      await expect(nk.caRow(label).first()).toBeVisible();
    }
    await expect(nk.caInput(MAX_CUT)).toHaveAttribute('placeholder', '2');
    await expect(nk.caInput(DEAL_CUT)).toHaveAttribute('placeholder', '10');
    await expect(nk.caStatusTable.locator('thead th')).toHaveText(['Trạng thái danh mục', 'Hiện tại', 'Khi có deal tiếp theo']);
    await expect(nk.caStatusTable.locator('tbody tr td:first-child')).toHaveText(['Giá vốn chứng khoán của danh mục',
      'Số tiền khả dụng của danh mục', 'Margin đang sử dụng', 'Tỷ lệ Margin/Vốn khả dụng']);
    await expect(nk.caChartToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nk.pane.locator('.ca-khung-bieu-do .ca-khung-tieu-de')).toContainText('Biểu đồ cơ cấu');
  });

  test('TC_NKGD_PBV_02: Danh sách danh mục xếp theo tên; chọn "Dài hạn" nạp đúng cấu hình đã lưu; bấm ra ngoài đóng danh sách', async ({ page }) => {
    await openTab();
    await nk.caPickerBtn.click();
    await expect(nk.pane.locator('.ca-chon-danh-muc .category-picker-item')).toHaveText(['Cổ tức', 'Dài hạn', 'Lướt sóng']);
    await page.mouse.click(1200, 700);
    await expect(nk.pane.locator('.ca-chon-danh-muc .category-picker-menu')).toHaveCount(0);
    await pick('Dài hạn');
    await expect(nk.caCapitalText).toHaveText('500,000,000 đ');
    await expect(nk.caInput(MAX_CUT)).toHaveValue('2');
    await expect(nk.caInput(DEAL_CUT)).toHaveValue('10');
    await pick('Lướt sóng');
    await expect(nk.caCapitalText).toHaveText('0 đ');
    await expect(nk.caInput(MAX_CUT)).toHaveValue('0');
  });

  test('TC_NKGD_PBV_03: Không có danh mục nào — trang không lỗi JS, các số = 0', async () => {
    await openTab({ data: (d) => { d.categories = []; d.logs = []; d.capital = {}; } }, false);
    await expect(nk.caCapitalText).toHaveText('0 đ');
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).toHaveText('0 đ');
    expect(nk.pageErrors).toEqual([]);
  });
});

test.describe('Tính toán deal tiếp theo', () => {
  test('TC_NKGD_PBV_04: "Dài hạn" — cắt lỗ tối đa = vốn × %, phân bổ = cắt lỗ ÷ % deal; vốn khả dụng = vốn + lãi/lỗ đã thực hiện', async () => {
    await openTab();
    await pick('Dài hạn');
    await expect(nk.caValue('Giá trị cắt lỗ tối đa trên tổng tài sản')).toHaveText('10,000,000 đ');
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).toHaveText('100,000,000 đ');
    const realized = Number((await nk.caSummary('Lãi/lỗ đã thực hiện').locator('.ca-tom-tat-so').innerText()).replace(/[^\d−-]/g, '').replace('−', '-'));
    await expect(nk.caSummary('Vốn khả dụng').locator('.ca-tom-tat-so')).toHaveText(`${(500_000_000 + realized).toLocaleString('en')} đ`);
  });

  test('TC_NKGD_PBV_05: Đổi % → tính lại ngay', async () => {
    await openTab();
    await pick('Dài hạn');
    await setPercent(MAX_CUT, '5');
    await expect(nk.caValue('Giá trị cắt lỗ tối đa trên tổng tài sản')).toHaveText('25,000,000 đ');
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).toHaveText('250,000,000 đ');
    await setPercent(DEAL_CUT, '20');
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).toHaveText('125,000,000 đ');
  });

  test('TC_NKGD_PBV_06: Phân bổ vượt số tiền khả dụng → số phân bổ tô màu cảnh báo, có margin', async () => {
    await openTab();
    await pick('Dài hạn');
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).not.toHaveClass(/warning-text-color/);
    await setPercent(MAX_CUT, '50');
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).toHaveText('2,500,000,000 đ');
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).toHaveClass(/warning-text-color/);
    await expect(nk.caRow('Margin').locator('.ca-gia-tri-tu-dong')).not.toHaveText(/^0 đ/);
  });

  test('TC_NKGD_PBV_07: % để trống hoặc 0 → ô viền đỏ; số tính ra = 0', async () => {
    await openTab();
    await pick('Dài hạn');
    await setPercent(MAX_CUT, '0');
    await expect(nk.caInput(MAX_CUT)).toHaveClass(/is-invalid/);
    await expect(nk.caValue('Giá trị cắt lỗ tối đa trên tổng tài sản')).toHaveText('0 đ');
    await setPercent(DEAL_CUT, '');
    await expect(nk.caInput(DEAL_CUT)).toHaveClass(/is-invalid/);
    await expect(nk.caValue('Phân bổ vốn cho deal tiếp theo')).toHaveText('0 đ');
  });

  test('TC_NKGD_PBV_08: Bảng trạng thái — cột "Khi có deal tiếp theo" cộng thêm số phân bổ, có chênh lệch', async () => {
    await openTab();
    await pick('Dài hạn');
    const row = nk.caStatusRow('Giá vốn chứng khoán của danh mục');
    const now = Number((await row.locator('td').nth(1).innerText()).replace(/,/g, ''));
    await expect(row.locator('.pbv-so-sau')).toHaveText((now + 100_000_000).toLocaleString('en'));
    await expect(row.locator('.pbv-chenh-lech')).toHaveText('+100,000,000');
  });
});

test.describe('Sửa vốn ban đầu (bút chì)', () => {
  test('TC_NKGD_PBV_09: Bút chì → ô nhập có sẵn số, được chọn; Enter lưu → toast, số + phép tính cập nhật', async ({ page }) => {
    await openTab();
    await pick('Dài hạn');
    await nk.caPencil.click();
    await expect(nk.caCapitalInput).toBeFocused();
    await expect(nk.caCapitalInput).toHaveValue('500,000,000');
    expect(await page.evaluate(() => { const i = document.activeElement as HTMLInputElement; return i.selectionEnd! - i.selectionStart!; })).toBe('500,000,000'.length);
    await nk.caCapitalInput.fill('600000000');
    await nk.caCapitalInput.press('Enter');
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Đã lưu vốn ban đầu') nhưng không hiện gì
    await expect(nk.caCapitalText).toHaveText('600,000,000 đ');
    await expect(nk.caValue('Giá trị cắt lỗ tối đa trên tổng tài sản')).toHaveText('12,000,000 đ');
  });

  test('TC_NKGD_PBV_10: Esc hoặc bấm ra ngoài → huỷ, giữ số cũ, không toast', async () => {
    await openTab();
    await pick('Dài hạn');
    await nk.caPencil.click();
    await nk.caCapitalInput.fill('1');
    await nk.caCapitalInput.press('Escape');
    await expect(nk.caCapitalText).toHaveText('500,000,000 đ');
    await nk.caPencil.click();
    await nk.caCapitalInput.fill('2');
    await nk.pane.getByText('Thiết lập deal tiếp theo').click();
    await expect(nk.caCapitalText).toHaveText('500,000,000 đ');
    await expect(nk.toastSuccess).toHaveCount(0);
  });

  for (const bad of ['-5', 'abc']) {
    test(`TC_NKGD_PBV_11: Vốn không hợp lệ "${bad}" + Enter → "Vốn ban đầu phải là số không âm", vẫn ở chế độ sửa`, async () => {
      await openTab();
      await pick('Dài hạn');
      await nk.caPencil.click();
      await nk.caCapitalInput.fill(bad);
      await nk.caCapitalInput.press('Enter');
      await expect(nk.toastError.filter({ hasText: 'Vốn ban đầu phải là số không âm' })).toBeVisible();
      await expect(nk.caCapitalInput).toBeVisible();
    });
  }

  test('TC_NKGD_PBV_12: Enter khi không đổi số → chỉ thoát chế độ sửa, không toast', async () => {
    await openTab();
    await pick('Dài hạn');
    await nk.caPencil.click();
    await nk.caCapitalInput.press('Enter');
    await expect(nk.caCapitalText).toHaveText('500,000,000 đ');
    await expect(nk.toastSuccess).toHaveCount(0);
  });
});

test.describe('Lưu cấu hình', () => {
  test('TC_NKGD_PBV_13: Đổi % → localStorage cập nhật ngay, setting gửi sau ~3 giây (gom lần ghi)', async () => {
    await openTab();
    await pick('Dài hạn');
    await setPercent(MAX_CUT, '3');
    await setPercent(DEAL_CUT, '8');
    await expect.poll(async () => JSON.parse((await nk.ls('capital_allocation_data_save'))!)[String(CAT.DAI_HAN)]?.phan_tram_cutloss_toi_da).toBe('3');
    expect(savedCapital()).toBeNull();
    await expect.poll(() => savedCapital()?.[String(CAT.DAI_HAN)], { timeout: 10000 })
      .toMatchObject({ phan_tram_cutloss_toi_da: '3', phan_tram_muc_giam_gia_tu_mua: '8' });
    expect(nk.settingWrites.filter((s) => s.key === 'capital_allocation_data_save')).toHaveLength(1);
  });

  test('TC_NKGD_PBV_14: Cấu hình riêng từng danh mục — đổi "Dài hạn", sang "Lướt sóng" rồi quay lại vẫn giữ', async () => {
    await openTab();
    await pick('Dài hạn');
    await setPercent(MAX_CUT, '4');
    await pick('Lướt sóng');
    await expect(nk.caInput(MAX_CUT)).toHaveValue('0');
    await pick('Dài hạn');
    await expect(nk.caInput(MAX_CUT)).toHaveValue('4');
  });
});

test.describe('Biểu đồ cơ cấu', () => {
  test('TC_NKGD_PBV_15: Thu gọn/mở biểu đồ cơ cấu bằng nút mũi tên', async () => {
    await openTab();
    await nk.caChartToggle.click();
    await expect(nk.caChartToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nk.caChartToggle).toHaveAttribute('aria-label', 'Mở biểu đồ cơ cấu');
    await expect(nk.pane.locator('.donut-area')).toBeHidden();
    await nk.caChartToggle.click();
    await expect(nk.caChartToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nk.pane.locator('.donut-area')).toBeVisible();
  });

  test('TC_NKGD_PBV_16: Chú thích cơ cấu — tỷ trọng cộng lại 100%, ô giữa ghi "Tổng"; thanh Vốn khả dụng + Margin = 100%', async () => {
    await openTab();
    await pick('Dài hạn');
    const rows = nk.pane.locator('.ca-ct-dong:not(.ca-ct-tieu-de)');
    await expect(rows.first()).toBeVisible();
    const pct = (await rows.locator('.ca-ct-ty-trong').allInnerTexts()).map((t) => parseFloat(t));
    expect(Math.abs(pct.reduce((a, b) => a + b, 0) - 100)).toBeLessThan(0.05);
    await expect(nk.pane.locator('.ca-vong-giua span')).toHaveText('Tổng');
    const legend = (await nk.pane.locator('.ca-chu-giai-muc b').allInnerTexts()).map((t) => parseFloat(t));
    expect(legend).toHaveLength(2);
    expect(Math.abs(legend[0] + legend[1] - 100)).toBeLessThan(0.05);
  });
});

test.describe('Lỗi tải khi mở thẳng tab', () => {
  test('TC_NKGD_PBV_17: 🐞 Mở thẳng tab Phân bổ vốn (tab được nhớ / F5) khi danh mục về trước setting → ô danh mục rỗng, vốn 0, cấu hình không nạp', async () => {
    await nk.open({ tab: 3 });
    await expect(nk.pane.getByText('Thiết lập deal tiếp theo')).toBeVisible({ timeout: 30000 });
    await nk.waitData();
    await nk.waitSettingsLoaded();
    await nk.root.page().waitForTimeout(1500);
    await expect(nk.caPickerBtn).toHaveText('');
    await expect(nk.caCapitalText).toHaveText('0 đ');
    await pick('Dài hạn');
    await expect(nk.caCapitalText).toHaveText('0 đ'); // đúng ra 500,000,000 đ
    await expect(nk.caInput(MAX_CUT)).toHaveValue('0'); // đúng ra 2
  });
});
