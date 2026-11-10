import { test, expect, Locator } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { TradingLogPage, CAT, NkOpenOptions } from '../pages/TradingLogPage';

/**
 * NKGD — tab "Danh mục" (testcases/nhat-ky-giao-dich-danh-muc.md). prev2 + máy chủ giả: mọi API danh mục là giả,
 * request ghi khác bị huỷ (`afterEach` kiểm tra `blocked` rỗng), ghi setting bị chặn.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let nk: TradingLogPage;
test.beforeEach(async ({ page }) => { nk = new TradingLogPage(page); });
test.afterEach(async () => { expect(nk.server.blocked, 'request ghi lọt tới máy chủ thật').toEqual([]); });

async function openTab(opts: NkOpenOptions = {}) {
  await nk.open({ tab: 4, ...opts });
  await expect(nk.dmAddBtn).toBeVisible({ timeout: 30000 });
  await nk.waitData();
}
const nameInput = (m: Locator) => m.locator('.mc-form input:not([type="checkbox"])').first();
const capitalInput = (m: Locator) => m.locator('.mc-form input:not([type="checkbox"])').nth(1);
const manualTick = (m: Locator) => m.getByRole('checkbox', { name: 'Nhập giá vốn' });
const catWrites = () => nk.server.writesTo(/\/stocks\/category\//);
/** Lần ghi setting `capital_allocation_data_save` gần nhất (đã bị chặn), dạng object. */
const lastCapitalWrite = () => {
  const w = nk.settingWrites.filter((s) => s.key === 'capital_allocation_data_save').pop();
  return w ? JSON.parse(String(w.value)) : null;
};
async function openAdd(name?: string) {
  await nk.dmAddBtn.click();
  await expect(nk.dmAddModal).toBeVisible();
  if (name !== undefined) await nameInput(nk.dmAddModal).fill(name);
}

test.describe('Tổng quan & bảng danh mục', () => {
  test('TC_NKGD_DM_01: Hàng đầu (đếm + 2 nút), bảng xếp theo tên, mỗi dòng có Sửa/Xóa, có hàng Tổng', async () => {
    await openTab();
    await expect(nk.dmCount).toHaveText('3 danh mục');
    await expect(nk.dmDeletedBtn).toHaveText(/Danh mục đã xóa \(1\)/);
    await expect(nk.dmTable.locator('thead th')).toHaveText(['Tên danh mục', 'Vốn ban đầu', '']);
    await expect(nk.dmTable.locator('tbody td.mc-ten')).toHaveText(['Cổ tức', 'Dài hạn', 'Lướt sóng']);
    for (const name of ['Cổ tức', 'Dài hạn', 'Lướt sóng']) {
      await expect(nk.dmRow(name).getByRole('button', { name: 'Sửa' })).toBeVisible();
      await expect(nk.dmRow(name).getByRole('button', { name: 'Xóa' })).toBeVisible();
    }
    await expect(nk.dmTable.locator('tfoot td').first()).toHaveText('Tổng');
  });

  test('TC_NKGD_DM_02: Vốn tự nhập, vốn tự động (có tooltip) và hàng Tổng = tổng các dòng', async () => {
    await openTab();
    const cell = (name: string) => nk.dmRow(name).locator('td.num');
    await expect(cell('Dài hạn')).toHaveText('500,000,000');
    await expect(cell('Dài hạn')).not.toHaveAttribute('title', /.+/);
    const num = async (l: Locator) => Number((await l.innerText()).replace(/,/g, ''));
    for (const name of ['Cổ tức', 'Lướt sóng']) {
      await expect(cell(name)).toHaveAttribute('title', /^Giá vốn tự động: bằng tổng chi/);
      await expect.poll(() => num(cell(name)), { timeout: 15000 }).toBeGreaterThan(0);
    }
    const sum = (await num(cell('Cổ tức'))) + (await num(cell('Dài hạn'))) + (await num(cell('Lướt sóng')));
    expect(await num(nk.dmTable.locator('tfoot td.num'))).toBe(sum);
  });

  test('TC_NKGD_DM_03: Không có danh mục nào → "0 danh mục", "Chưa có danh mục nào", không có hàng Tổng', async () => {
    await openTab({ data: (d) => { d.categories = []; d.logs = []; } });
    await expect(nk.dmCount).toHaveText('0 danh mục');
    await expect(nk.dmTable.locator('td.mc-trong')).toHaveText('Chưa có danh mục nào');
    await expect(nk.dmTable.locator('tfoot')).toHaveCount(0);
  });
});

test.describe('Thêm danh mục', () => {
  test('TC_NKGD_DM_04: Modal Thêm — ô tên rỗng, "Nhập giá vốn" chưa tích, tích thì hiện ô vốn + ghi chú', async () => {
    await openTab();
    await openAdd();
    const m = nk.dmAddModal;
    await expect(m.locator('.mc-label')).toHaveText('Tên danh mục');
    await expect(nameInput(m)).toHaveValue('');
    await expect(manualTick(m)).not.toBeChecked();
    await expect(capitalInput(m)).toHaveCount(0);
    await expect(m.getByRole('button', { name: 'Thêm danh mục' })).toBeVisible();
    await expect(m.getByRole('button', { name: 'Hủy' })).toBeVisible();
    await manualTick(m).check();
    await expect(capitalInput(m)).toBeVisible();
    await expect(m.locator('.mc-note')).toContainText('Vốn giữ nguyên số đã nhập');
    await manualTick(m).uncheck();
    await expect(capitalInput(m)).toHaveCount(0);
  });

  test('TC_NKGD_DM_05: Tên rỗng → toast lỗi + viền đỏ, không gọi API', async () => {
    await openTab();
    await openAdd('');
    await nk.dmAddModal.getByRole('button', { name: 'Thêm danh mục' }).click();
    await expect(nk.toastError.filter({ hasText: 'Tên danh mục không được để trống' })).toBeVisible();
    await expect(nameInput(nk.dmAddModal)).toHaveClass(/is-invalid/);
    await expect(nk.dmAddModal).toBeVisible();
    expect(catWrites()).toEqual([]);
  });

  test('TC_NKGD_DM_07: Tích "Nhập giá vốn" mà vốn 0 → "Vốn ban đầu phải lớn hơn 0", không gọi API', async () => {
    await openTab();
    await openAdd('Tăng trưởng');
    await manualTick(nk.dmAddModal).check();
    await nk.dmAddModal.getByRole('button', { name: 'Thêm danh mục' }).click();
    await expect(nk.toastError.filter({ hasText: 'Vốn ban đầu phải lớn hơn 0' })).toBeVisible();
    await expect(nk.dmAddModal).toBeVisible();
    expect(catWrites()).toEqual([]);
  });

  test('TC_NKGD_DM_08: Thêm danh mục vốn tự động thành công', async () => {
    await openTab();
    await openAdd('Tăng trưởng');
    await nk.dmAddModal.getByRole('button', { name: 'Thêm danh mục' }).click();
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Đã thêm mới danh mục') nhưng không hiện gì
    expect(catWrites()).toHaveLength(1);
    expect(catWrites()[0]).toMatchObject({ method: 'POST', path: expect.stringMatching(/category\/store$/), body: { name: 'Tăng trưởng' } });
    await expect(nk.dmAddModal).toBeHidden();
    await expect(nk.dmCount).toHaveText('4 danh mục');
    await expect(nk.dmRow('Tăng trưởng')).toBeVisible();
  });

  test('TC_NKGD_DM_09: Thêm danh mục có nhập giá vốn → dòng hiện vốn, web định ghi setting vốn', async () => {
    await openTab();
    await openAdd('Tăng trưởng');
    await manualTick(nk.dmAddModal).check();
    await nk.fillMoney(capitalInput(nk.dmAddModal), '300000000');
    await nk.dmAddModal.getByRole('button', { name: 'Thêm danh mục' }).click();
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Đã thêm mới danh mục') nhưng không hiện gì
    await expect(nk.dmRow('Tăng trưởng').locator('td.num')).toHaveText('300,000,000');
    const created = nk.server.data.categories.find((c) => c.name === 'Tăng trưởng')!;
    await expect.poll(() => lastCapitalWrite()?.[String(created.id)]?.tong_tai_san).toBe('300000000');
  });

  test('TC_NKGD_DM_10: Trùng tên (422) → toast "Danh mục của bạn đã tồn tại!…", modal đóng, danh sách không đổi', async () => {
    await openTab();
    nk.server.mode.catStore = '422';
    await openAdd('Dài hạn');
    await nk.dmAddModal.getByRole('button', { name: 'Thêm danh mục' }).click();
    await expect(nk.toastError.filter({ hasText: 'Danh mục của bạn đã tồn tại! Vui lòng kiểm tra lại các danh mục hiện có và các danh mục đã xóa trong thùng rác.' })).toBeVisible();
    await expect(nk.dmAddModal).toBeHidden();
    await expect(nk.dmCount).toHaveText('3 danh mục');
  });

  test('TC_NKGD_DM_11: Lỗi 500 → toast "Có lỗi xảy ra, vui lòng thử lại", modal đóng', async () => {
    await openTab();
    nk.server.mode.catStore = '500';
    await openAdd('Tăng trưởng');
    await nk.dmAddModal.getByRole('button', { name: 'Thêm danh mục' }).click();
    await expect(nk.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' })).toBeVisible();
    await expect(nk.dmAddModal).toBeHidden();
    await expect(nk.dmCount).toHaveText('3 danh mục');
  });

  test('TC_NKGD_DM_14: "Hủy" và nút X đóng modal, không lưu; mở lại ô tên rỗng', async () => {
    await openTab();
    await openAdd('Tạm');
    await nk.dmAddModal.getByRole('button', { name: 'Hủy' }).click();
    await expect(nk.dmAddModal).toBeHidden();
    await openAdd();
    await expect(nameInput(nk.dmAddModal)).toHaveValue('');
    await nameInput(nk.dmAddModal).fill('Tạm 2');
    await nk.dmAddModal.getByRole('button', { name: 'Đóng cửa sổ' }).click();
    await expect(nk.dmAddModal).toBeHidden();
    expect(catWrites()).toEqual([]);
    await expect(nk.dmCount).toHaveText('3 danh mục');
  });

  test('TC_NKGD_DM_15: Danh mục vừa thêm có trong ô "Danh mục" của phiếu lệnh tab Giao dịch', async () => {
    await openTab();
    await openAdd('Tăng trưởng');
    await nk.dmAddModal.getByRole('button', { name: 'Thêm danh mục' }).click();
    await expect(nk.dmRow('Tăng trưởng')).toBeVisible();
    await nk.gotoTab('Giao dịch');
    await nk.thMua.click();
    await expect(nk.ticketCategory.locator('option')).toContainText(['Tăng trưởng']);
  });
});

test.describe('Sửa danh mục', () => {
  test('TC_NKGD_DM_16: Modal Sửa điền sẵn — "Dài hạn" tích "Nhập giá vốn" 500,000,000; "Lướt sóng" không tích', async () => {
    await openTab();
    await nk.dmRow('Dài hạn').getByRole('button', { name: 'Sửa' }).click();
    const m = nk.dmEditModal;
    await expect(nameInput(m)).toHaveValue('Dài hạn');
    await expect(manualTick(m)).toBeChecked();
    await expect(capitalInput(m)).toHaveValue('500,000,000');
    await expect(m.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
    await m.getByRole('button', { name: 'Hủy' }).click();
    await nk.dmRow('Lướt sóng').getByRole('button', { name: 'Sửa' }).click();
    await expect(nameInput(m)).toHaveValue('Lướt sóng');
    await expect(manualTick(m)).not.toBeChecked();
    await expect(capitalInput(m)).toHaveCount(0);
  });

  test('TC_NKGD_DM_17: Chỉ đổi vốn → không gọi API, toast "Đã cập nhật giao dịch", dòng cập nhật, định ghi setting', async () => {
    await openTab();
    await nk.dmRow('Dài hạn').getByRole('button', { name: 'Sửa' }).click();
    await nk.fillMoney(capitalInput(nk.dmEditModal), '600000000');
    await nk.dmEditModal.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Đã cập nhật giao dịch') nhưng không hiện gì
    await expect(nk.dmEditModal).toBeHidden();
    await expect(nk.dmRow('Dài hạn').locator('td.num')).toHaveText('600,000,000');
    expect(catWrites()).toEqual([]);
    await expect.poll(() => lastCapitalWrite()?.[String(CAT.DAI_HAN)]?.tong_tai_san).toBe('600000000');
  });

  test('TC_NKGD_DM_18: Đổi tên thành công → PUT {id, name}, toast, dòng đổi tên', async () => {
    await openTab();
    await nk.dmRow('Lướt sóng').getByRole('button', { name: 'Sửa' }).click();
    await nameInput(nk.dmEditModal).fill('Lướt sóng T+');
    await nk.dmEditModal.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Đã cập nhật giao dịch') nhưng không hiện gì
    expect(catWrites()).toHaveLength(1);
    expect(catWrites()[0]).toMatchObject({ method: 'PUT', path: expect.stringMatching(/category\/update$/), body: { id: CAT.LUOT_SONG, name: 'Lướt sóng T+' } });
    await expect(nk.dmRow('Lướt sóng T+')).toBeVisible();
    await expect(nk.dmRow('Lướt sóng')).toHaveCount(0);
  });

  test('TC_NKGD_DM_19: Đổi tên trùng → "Tên danh mục đã tồn tại!…", modal đóng, tên cũ giữ nguyên', async () => {
    await openTab();
    nk.server.mode.catUpdate = '422';
    await nk.dmRow('Lướt sóng').getByRole('button', { name: 'Sửa' }).click();
    await nameInput(nk.dmEditModal).fill('Dài hạn');
    await nk.dmEditModal.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(nk.toastError.filter({ hasText: 'Tên danh mục đã tồn tại! Vui lòng nhập tên danh mục mới' })).toBeVisible();
    await expect(nk.dmEditModal).toBeHidden();
    await expect(nk.dmRow('Lướt sóng')).toBeVisible();
  });

  test('TC_NKGD_DM_20: Sửa với tên rỗng → toast lỗi, modal vẫn mở, không gọi API', async () => {
    await openTab();
    await nk.dmRow('Lướt sóng').getByRole('button', { name: 'Sửa' }).click();
    await nameInput(nk.dmEditModal).fill('');
    await nk.dmEditModal.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(nk.toastError.filter({ hasText: 'Tên danh mục không được để trống' })).toBeVisible();
    await expect(nk.dmEditModal).toBeVisible();
    expect(catWrites()).toEqual([]);
  });
});

test.describe('Thùng rác', () => {
  test('TC_NKGD_DM_21: Xoá vào thùng rác → DELETE, toast, dòng biến mất, đếm cập nhật', async () => {
    await openTab();
    await nk.dmRow('Lướt sóng').getByRole('button', { name: 'Xóa' }).click();
    await expect(nk.dmSoftDeleteModal).toContainText('Di chuyển vào thùng rác. Bạn có chắc chắn không?');
    await nk.dmSoftDeleteModal.getByRole('button', { name: 'Di chuyển vào thùng rác' }).click();
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Di chuyển vào thùng rác thành công') nhưng không hiện gì
    expect(catWrites()).toEqual([expect.objectContaining({ method: 'DELETE', path: expect.stringMatching(new RegExp(`/api/stocks/category/${CAT.LUOT_SONG}$`)) })]);
    await expect(nk.dmSoftDeleteModal).toBeHidden();
    await expect(nk.dmRow('Lướt sóng')).toHaveCount(0);
    await expect(nk.dmCount).toHaveText('2 danh mục');
    await expect(nk.dmDeletedBtn).toHaveText(/Danh mục đã xóa \(2\)/);
  });

  test('TC_NKGD_DM_22: Xoá vào thùng rác lỗi 500 → toast lỗi, modal đóng, dòng còn', async () => {
    await openTab();
    nk.server.mode.catDelete = '500';
    await nk.dmRow('Lướt sóng').getByRole('button', { name: 'Xóa' }).click();
    await nk.dmSoftDeleteModal.getByRole('button', { name: 'Di chuyển vào thùng rác' }).click();
    await expect(nk.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' })).toBeVisible();
    await expect(nk.dmSoftDeleteModal).toBeHidden();
    await expect(nk.dmRow('Lướt sóng')).toBeVisible();
  });

  test('TC_NKGD_DM_23: Modal "Danh mục đã xóa" — có mục thì có Khôi phục/Xóa vĩnh viễn; rỗng thì thông báo trống', async ({ page }) => {
    await openTab();
    await nk.dmDeletedBtn.click();
    const row = nk.dmDeletedModal.locator('.mc-dong', { hasText: 'Danh mục cũ' });
    await expect(row).toBeVisible();
    await expect(row.getByRole('button', { name: 'Khôi phục' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Xóa vĩnh viễn' })).toBeVisible();
    // Thùng rác rỗng (trang mới, dữ liệu giả khác)
    const nk2 = new TradingLogPage(await page.context().newPage());
    await nk2.open({ tab: 4, data: (d) => { d.softDeleted = []; } });
    await expect(nk2.dmDeletedBtn).toHaveText(/^\s*Danh mục đã xóa\s*$/, { timeout: 30000 });
    await nk2.dmDeletedBtn.click();
    await expect(nk2.dmDeletedModal).toContainText('Chưa có danh mục nào bị xóa.');
    expect(nk2.server.blocked).toEqual([]);
  });

  test('TC_NKGD_DM_24: Khôi phục chạy ngay (không hỏi lại) → POST restore, toast, dòng về bảng', async () => {
    await openTab();
    await nk.dmDeletedBtn.click();
    await nk.dmDeletedModal.locator('.mc-dong', { hasText: 'Danh mục cũ' }).getByRole('button', { name: 'Khôi phục' }).click();
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Khôi phục thành công danh mục Danh mục cũ') nhưng không hiện gì
    expect(catWrites()).toEqual([expect.objectContaining({ method: 'POST', path: expect.stringMatching(/category\/restore$/), body: { id: 970009 } })]);
    await expect(nk.dmDeletedModal).toContainText('Chưa có danh mục nào bị xóa.');
    await expect(nk.dmRow('Danh mục cũ')).toBeAttached();
    await expect(nk.dmCount).toHaveText('4 danh mục');
  });

  test('TC_NKGD_DM_25: Xoá vĩnh viễn → modal xác nhận → DELETE force-delete, toast, thùng rác rỗng', async () => {
    await openTab();
    await nk.dmDeletedBtn.click();
    await nk.dmDeletedModal.locator('.mc-dong', { hasText: 'Danh mục cũ' }).getByRole('button', { name: 'Xóa vĩnh viễn' }).click();
    await expect(nk.dmForceDeleteModal).toContainText('Danh mục sẽ bị xóa vĩnh viễn. Bạn có chắc chắn không?');
    expect(catWrites()).toEqual([]);
    await nk.dmForceDeleteModal.getByRole('button', { name: 'Xóa vĩnh viễn' }).click();
    await nk.expectSilentSuccess(); // app tắt toast thành công (main.js 12/10/2026) — code gọi $toast.success('Xóa thành công Danh mục cũ') nhưng không hiện gì
    expect(catWrites()).toEqual([expect.objectContaining({ method: 'DELETE', path: expect.stringMatching(/category\/force-delete\/970009$/) })]);
    await expect(nk.dmForceDeleteModal).toBeHidden();
    await expect(nk.dmDeletedModal).toContainText('Chưa có danh mục nào bị xóa.');
  });

  test('TC_NKGD_DM_26: Xoá vĩnh viễn lỗi → toast lỗi, modal xác nhận VẪN mở, mục vẫn trong thùng rác', async () => {
    await openTab();
    nk.server.mode.catForce = '500';
    await nk.dmDeletedBtn.click();
    await nk.dmDeletedModal.locator('.mc-dong', { hasText: 'Danh mục cũ' }).getByRole('button', { name: 'Xóa vĩnh viễn' }).click();
    await nk.dmForceDeleteModal.getByRole('button', { name: 'Xóa vĩnh viễn' }).click();
    await expect(nk.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' })).toBeVisible();
    await expect(nk.dmForceDeleteModal).toBeVisible();
    await expect(nk.dmDeletedModal.locator('.mc-dong', { hasText: 'Danh mục cũ' })).toBeAttached();
  });
});
