import { test, expect, Page } from '@playwright/test';
import { WatchlistPage, DEFAULT_LISTS } from '../pages/WatchlistPage';
import { PREV2_BASE_URL } from '../pages/Prev2Session';

/**
 * Watchlist — chạy trên prev2 (bản preprod mới nhất). Danh sách watchlist + mã do `FakeWatchlistServer` trả về
 * (tài khoản test là tài khoản production thật) — mọi thao tác ghi chỉ sửa máy chủ giả; xem `pages/WatchlistPage.ts`.
 * Bộ mặc định: "Auto A" (FPT, VNM, HPG), "Auto B" (ACB, MBB), "Auto Rỗng" (0 mã).
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

const MANY = ['FPT', 'VNM', 'HPG', 'ACB', 'MBB', 'SSI', 'VIC', 'VHM', 'TCB', 'MWG', 'GAS', 'VCB', 'BID', 'CTG', 'POW', 'DGC'];
const toast = (page: Page, text: string | RegExp) => page.locator('.Vue-Toastification__toast').filter({ hasText: text });
/** Từ 12/10/2026 web tắt mọi toast thành công (`Vue.prototype.$toast.success = () => {}` trong main.js) — thao tác
 * thành công không hiện gì, chỉ kiểm tra trạng thái. */
async function expectNoSuccessToast(page: Page) {
  await page.waitForTimeout(500);
  await expect(page.locator('.Vue-Toastification__toast--success')).toHaveCount(0);
}

let wl: WatchlistPage;
test.afterEach(async () => {
  // Lưới an toàn: không request ghi nào tới máy chủ thật ngoài các route đã giả lập.
  expect(wl?.server.blockedWrites ?? [], 'Có request ghi bị chặn ngoài dự kiến').toEqual([]);
});

test.describe('Watchlist — Truy cập & bố cục', () => {
  test('TC_WATCHLIST_01: Chặn truy cập khi chưa đăng nhập', async ({ page }) => {
    wl = new WatchlistPage(page);
    await page.goto('/watchlist');
    await page.waitForURL(/\/login/);
  });

  test('TC_WATCHLIST_02: Tổng quan màn hình khi đã đăng nhập', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await expect(wl.pickerLabel).toHaveText('Auto A');
    await expect(wl.addButton).toBeVisible();
    await expect(page.getByPlaceholder('Chọn mã CK')).toHaveCount(0);
    await expect(wl.tableTabs).toBeVisible();
    expect(await wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG']);
    await expect(wl.rightPanelTabs).toHaveText(['Ghi chú', 'Bài viết']);
    await expect(wl.notesTab).toHaveClass(/active/);
    await expect(wl.addNoteButton).toBeVisible();
    expect(await wl.leftRatio()).toBeCloseTo(0.7, 2);
  });

  test('TC_WATCHLIST_03: Kéo thanh chia cột đổi tỷ lệ trong giới hạn 50%–72%', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.dragResizeTo(0.6);
    expect(await wl.leftRatio()).toBeCloseTo(0.6, 1);
    await wl.dragResizeTo(0.3);
    expect(await wl.leftRatio(), 'Kéo cột trái dưới 50% → giữ nguyên').toBeGreaterThanOrEqual(0.5);
    await wl.dragResizeTo(0.95);
    expect(await wl.leftRatio(), 'Kéo cột phải dưới 28% → giữ nguyên').toBeLessThanOrEqual(0.721);
  });

  test('TC_WATCHLIST_04: Tỷ lệ đã kéo KHÔNG được lưu khi rời trang rồi quay lại', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.dragResizeTo(0.55);
    expect(await wl.leftRatio()).toBeCloseTo(0.55, 1);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.goto('/watchlist', { waitUntil: 'domcontentloaded' });
    await wl.waitReady();
    expect(await wl.leftRatio()).toBeCloseTo(0.7, 2);
  });

  test('TC_WATCHLIST_05: Nút "Đặt lại bố cục mặc định" đưa 2 cột về 70/30', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.dragResizeTo(0.55);
    await wl.resetLayoutButton.click();
    await expect.poll(() => wl.leftRatio()).toBeCloseTo(0.7, 2);
    await expect(wl.notesTab).toHaveClass(/active/);
  });

  test('TC_WATCHLIST_06: Màn hình hẹp (< 768px) — 2 cột xếp dọc, ẩn thanh chia cột', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(wl.resizeHandle).toBeHidden();
    const l = (await wl.leftColumn.boundingBox())!;
    const r = (await wl.rightColumn.boundingBox())!;
    expect(r.y, 'Cột phải nằm dưới cột trái').toBeGreaterThanOrEqual(l.y + l.height - 1);
    expect(l.height).toBeLessThanOrEqual(812 * 0.4 + 1);
  });

  test('TC_WATCHLIST_07: Nút Back trình duyệt rời trang (không đóng modal tại chỗ)', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.goto('/watchlist', { waitUntil: 'domcontentloaded' });
    await wl.waitReady();
    await wl.openManageModal();
    await page.goBack();
    await expect(page).not.toHaveURL(/\/watchlist/);
  });
});

test.describe('Watchlist — Chọn & chuyển watchlist', () => {
  test('TC_WATCHLIST_08: Dropdown chọn watchlist — 3 nhóm, danh sách, dấu ✓ ở mục đang chọn, "Quản lý watchlist"', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openDropdown();
    await expect(wl.dropdownMenu.locator('.option_tab-item')).toHaveText(['Watchlist', 'Nhật ký GD', 'Khác']);
    await expect(wl.dropdownTab('Watchlist')).toHaveClass(/selected/);
    await expect(wl.dropdownMenu.getByRole('menuitem')).toHaveText(DEFAULT_LISTS.map((l) => l.name));
    await expect(wl.dropdownItem('Auto A').locator('svg')).toBeVisible();
    await expect(wl.dropdownItem('Auto B').locator('svg')).toHaveCount(0);
    await expect(wl.manageLink).toBeVisible();
  });

  test('TC_WATCHLIST_09: Tài khoản Free — chỉ có nhóm "Watchlist" (không có thanh nhóm), không có "Quản lý watchlist"', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open({ account: 'free' });
    await wl.openDropdown();
    await expect(wl.dropdownMenu.locator('.option_tab-item')).toHaveCount(0);
    await expect(wl.dropdownMenu.getByRole('menuitem')).toHaveText(DEFAULT_LISTS.map((l) => l.name));
    await expect(wl.manageLink).toHaveCount(0);
  });

  test('TC_WATCHLIST_10: Chọn watchlist khác → tên + bảng đổi theo, dropdown đóng', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.selectList('Auto B');
    await expect(wl.dropdownMenu).toBeHidden();
    await expect.poll(() => wl.macksInTable()).toEqual(['ACB', 'MBB']);
  });

  test('TC_WATCHLIST_11: "Quản lý watchlist" chỉ hiện ở nhóm Watchlist; bấm → mở modal Quản lý Watchlist', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openDropdown();
    await wl.dropdownTab('Nhật ký GD').click();
    await expect(wl.manageLink).toHaveCount(0);
    await wl.dropdownTab('Khác').click();
    await expect(wl.manageLink).toHaveCount(0);
    await wl.dropdownTab('Watchlist').click();
    await wl.manageLink.click();
    await expect(wl.manageModal).toBeVisible();
  });
});

test.describe('Watchlist — Bảng dữ liệu chính', () => {
  test('TC_WATCHLIST_12: Hiển thị đủ 9 tab bảng, "Tổng quát" chọn sẵn', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await expect(wl.tableTabs.locator('.nav-tab-item')).toHaveText(['Tổng quát', 'Thông tin chung', 'Định giá', 'Cơ bản', 'Biến động giá',
      'Phạm vi giá', 'Thanh khoản', 'Chỉ báo kỹ thuật', 'KFSP'].map((t) => new RegExp(`^\\s*${t}\\s*$`)));
    await expect(wl.tableTab('Tổng quát')).toHaveClass(/active/);
  });

  test('TC_WATCHLIST_13: Chuyển tab đổi bộ cột, không đổi URL, giữ danh sách mã', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await expect(page.getByRole('columnheader', { name: 'Điểm Canslim' })).toBeVisible();
    await wl.tableTab('Định giá').locator('.nav-tab-link').click();
    await expect(wl.tableTab('Định giá')).toHaveClass(/active/);
    await expect(page.getByRole('columnheader', { name: 'Điểm Canslim' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/watchlist$/);
    expect(await wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG']);
  });

  test('TC_WATCHLIST_14: Bấm tiêu đề "Mã CK" sắp xếp tăng, bấm lần 2 sắp xếp giảm', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    const header = page.getByRole('columnheader', { name: 'Mã CK' });
    await header.click();
    await expect.poll(() => wl.macksInTable()).toEqual(['FPT', 'HPG', 'VNM']);
    await header.click();
    await expect.poll(() => wl.macksInTable()).toEqual(['VNM', 'HPG', 'FPT']);
  });

  test('TC_WATCHLIST_15: Bấm mã CK mở modal biểu đồ của đúng mã', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.row('VNM').getByRole('link', { name: 'VNM', exact: true }).click();
    await expect(page.locator('.modal.show.d-block').first()).toBeVisible({ timeout: 15000 });
  });

  test('TC_WATCHLIST_16: Cột "Website" (tab Thông tin chung) — link mở tab mới, tự thêm http:// khi thiếu giao thức', async ({ page }) => {
    wl = new WatchlistPage(page);
    // Dữ liệu cố định cho 3 nhánh của checkURL(): thiếu giao thức / đã có giao thức / rỗng.
    wl.server.filterOverrides = {
      FPT: { website: 'fpt.com.vn' }, VNM: { website: 'https://www.vinamilk.com.vn' }, HPG: { website: null },
    };
    await wl.open();
    await wl.tableTab('Thông tin chung').locator('.nav-tab-link').click();
    await expect(page.getByRole('columnheader', { name: 'Website' })).toBeVisible();
    const link = (m: string) => wl.row(m).getByRole('link', { name: 'Truy cập >' });
    await expect(link('FPT')).toHaveAttribute('target', '_blank');
    await expect(link('FPT')).toHaveAttribute('href', 'http://fpt.com.vn');
    await expect(link('VNM')).toHaveAttribute('href', 'https://www.vinamilk.com.vn');
    // Không có website: link "Truy cập >" vẫn hiện nhưng href rỗng (bấm vào mở lại chính trang trong tab mới).
    await expect(link('HPG')).toBeVisible();
    await expect(link('HPG')).toHaveAttribute('href', '');
  });

  test('TC_WATCHLIST_17: API bổ sung dữ liệu (/api/filter) lỗi → bảng vẫn hiện các mã + toast lỗi', async ({ page }) => {
    wl = new WatchlistPage(page);
    await page.route(/\/api\/filter(\?|$)/, (route) => route.fulfill({ status: 500, body: 'error' }));
    wl.server.filterFails = true;
    await wl.open();
    expect(await wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG']);
    await expect(toast(page, 'Có lỗi xảy ra. Vui lòng thử lại sau!').first()).toBeVisible();
    expect(wl.pageErrors).toEqual([]);
  });

  test('TC_WATCHLIST_58: Watchlist > 14 mã — 14 dòng mỗi trang + thanh phân trang; trang 2 có phần còn lại', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open({ lists: [{ name: 'Auto Nhiều', macks: MANY }] });
    await expect(wl.rows).toHaveCount(14);
    const pag = page.locator('nav[aria-label="pagination"]');
    await expect(pag).toHaveClass(/custom-pagination/);
    await pag.locator('.page-item:not(.disabled) .page-link', { hasText: /^\s*2\s*$/ }).first().click();
    await expect.poll(() => wl.macksInTable()).toEqual(MANY.slice(14));
  });

  test('TC_WATCHLIST_59: Dòng tiêu đề bảng dính trên cùng khi cuộn danh sách mã', async ({ page }) => {
    wl = new WatchlistPage(page);
    await page.setViewportSize({ width: 1600, height: 600 });
    await wl.open({ lists: [{ name: 'Auto Nhiều', macks: MANY }] });
    const th = page.getByRole('columnheader', { name: 'Mã CK' });
    const before = (await th.boundingBox())!.y;
    await wl.leftColumn.locator('.content').evaluate((el) => { el.scrollTop = 300; });
    await page.waitForTimeout(300);
    expect(await wl.leftColumn.locator('.content').evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(Math.abs((await th.boundingBox())!.y - before)).toBeLessThan(2);
  });

  test('TC_WATCHLIST_60: Điểm Canslim / 4M hiện dạng viên màu theo mức điểm (<40 đỏ, <60 cam, <80 xanh nhạt, ≥80 xanh đậm)', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    const pills = wl.row('FPT').locator('.score-pill');
    await expect(pills).toHaveCount(2);
    for (const pill of await pills.all()) {
      const score = Number(await pill.innerText());
      const level = score < 40 ? 'weak' : score < 60 ? 'medium' : score < 80 ? 'good' : 'strong';
      await expect(pill).toHaveClass(new RegExp(`score-pill--${level}`));
    }
  });
});

test.describe('Watchlist — Xoá mã khỏi watchlist', () => {
  test('TC_WATCHLIST_21: Bấm icon Xoá → modal "Xóa dữ liệu" hỏi xác nhận, chưa xoá', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.row('VNM').locator('[data-title="Xóa"]').click();
    await expect(wl.deleteStockConfirmModal).toBeVisible();
    await expect(wl.deleteStockConfirmModal.getByText('Bạn có chắc chắn không?')).toBeVisible();
    await expect(wl.deleteStockConfirmModal.getByRole('button', { name: 'Đóng' })).toBeVisible();
    await expect(wl.deleteStockConfirmModal.getByRole('button', { name: 'Xóa', exact: true })).toBeVisible();
    expect(wl.server.writesOf('DELETE', /\/api\/watchlist\//)).toHaveLength(0);
  });

  test('TC_WATCHLIST_22: "Đóng" ở modal xác nhận → không xoá, mã vẫn còn', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.row('VNM').locator('[data-title="Xóa"]').click();
    await wl.deleteStockConfirmModal.getByRole('button', { name: 'Đóng' }).click();
    await expect(wl.deleteStockConfirmModal).toBeHidden();
    expect(await wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG']);
    expect(wl.server.writesOf('DELETE', /\/api\/watchlist\//)).toHaveLength(0);
  });

  test('TC_WATCHLIST_23: Xác nhận xoá → DELETE /api/watchlist/:id, toast thành công, dòng biến mất', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.row('VNM').locator('[data-title="Xóa"]').click();
    await wl.deleteStockConfirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expectNoSuccessToast(page); // 'Xóa dữ liệu thành công' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect(wl.deleteStockConfirmModal).toBeHidden();
    await expect.poll(() => wl.macksInTable()).toEqual(['FPT', 'HPG']);
    expect(wl.server.writesOf('DELETE', /\/api\/watchlist\/\d+/)).toHaveLength(1);
  });

  test('TC_WATCHLIST_24: Xoá mã lỗi máy chủ → toast lỗi, mã vẫn còn', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    wl.server.modes.deleteMack = '500';
    await wl.row('VNM').locator('[data-title="Xóa"]').click();
    await wl.deleteStockConfirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(toast(page, 'Có lỗi xảy ra, vui lòng thử lại')).toBeVisible();
    expect(await wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG']);
  });
});

test.describe('Watchlist — Thêm mã (nút "Thêm mã")', () => {
  test('TC_WATCHLIST_25: Gõ chuỗi không khớp mã nào → "Không có dữ liệu", Enter không gửi gì', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addButton.click();
    await wl.addInput.fill('ZZZZQ');
    await expect(wl.addPopover.getByText('Không có dữ liệu')).toBeVisible();
    await wl.addInput.press('Enter');
    await page.waitForTimeout(500);
    expect(wl.server.writesOf('POST', /^\/api\/watchlist$/)).toHaveLength(0);
    await expect(toast(page, /Mã CK không hợp lệ|Đã thêm/)).toHaveCount(0);
  });

  test('TC_WATCHLIST_26: Chọn mã hợp lệ → POST /api/watchlist, toast "Đã thêm ACB vào Auto A", mã xuất hiện trong bảng', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addMack('ACB');
    await expectNoSuccessToast(page); // 'Đã thêm ACB vào Auto A' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect.poll(() => wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG', 'ACB']);
    const posts = wl.server.writesOf('POST', /^\/api\/watchlist$/);
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toMatchObject({ mack: 'ACB', my_watchlist_id: String(wl.server.list('Auto A').id) });
  });

  test('TC_WATCHLIST_27: Thêm mã đã có → toast "FPT đã có trong Auto A"', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addMack('FPT');
    await expect(toast(page, 'FPT đã có trong Auto A')).toBeVisible();
    expect(await wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG']);
  });

  test('TC_WATCHLIST_28: Thêm mã lỗi máy chủ → toast lỗi chung, bảng không đổi', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    wl.server.modes.addMack = '500';
    await wl.addMack('ACB');
    await expect(toast(page, 'Có lỗi xảy ra, vui lòng thử lại')).toBeVisible();
    expect(await wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG']);
  });

  test('TC_WATCHLIST_29: Vòng đời: tạo watchlist mới → chọn → thêm mã → xoá watchlist (máy chủ giả)', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.addWatchlistButton.click();
    await wl.nameInput.fill('Auto Mới');
    await wl.saveButton.click();
    await expectNoSuccessToast(page); // 'Thêm Watchlist thành công' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect(wl.manageItem('Auto Mới')).toBeVisible();
    await wl.manageCloseButton.click();
    await expect(wl.manageModal).toBeHidden();

    await wl.selectList('Auto Mới');
    await expect(wl.table.getByText('No items')).toBeVisible();
    await wl.addMack('ACB');
    await expectNoSuccessToast(page); // 'Đã thêm ACB vào Auto Mới' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect.poll(() => wl.macksInTable()).toEqual(['ACB']);

    await wl.openManageModal();
    await wl.manageItem('Auto Mới').locator('[data-title="Xóa"]').click();
    await wl.deleteWholeListConfirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expectNoSuccessToast(page); // 'Đã xóa Watchlist thành công' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect(wl.manageItem('Auto Mới')).toHaveCount(0);
    expect(wl.server.lists.map((l) => l.name)).toEqual(DEFAULT_LISTS.map((l) => l.name));
  });

  test('TC_WATCHLIST_50: Bấm "Thêm mã" → hộp "Thêm mã vào <watchlist>", ô nhập focus sẵn; bấm lại nút / bấm ra ngoài → đóng', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addButton.click();
    await expect(wl.addPopover).toBeVisible();
    await expect(wl.addPopoverTitle).toHaveText('Thêm mã vào Auto A');
    await expect(wl.addInput).toBeFocused();
    await expect(wl.addButton).toHaveAttribute('aria-expanded', 'true');
    await wl.addButton.click();
    await expect(wl.addPopover).toBeHidden();
    await expect(wl.addButton).toHaveAttribute('aria-expanded', 'false');
    await wl.addButton.click();
    await expect(wl.addPopover).toBeVisible();
    await page.mouse.click(800, 800);
    await expect(wl.addPopover).toBeHidden();
  });

  test('TC_WATCHLIST_51: Nhấn Esc trong ô nhập → đóng hộp "Thêm mã"', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addButton.click();
    await wl.addInput.fill('FP');
    await wl.addInput.press('Escape');
    await expect(wl.addPopover).toBeHidden();
    // Mở lại → ô nhập trống.
    await wl.addButton.click();
    await expect(wl.addInput).toHaveValue('');
  });

  test('TC_WATCHLIST_52: Gợi ý tối đa 5 dòng dạng "MÃ - Tên công ty", lọc theo mã hoặc tên công ty', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addButton.click();
    await wl.addInput.fill('ngân hàng');
    await expect.poll(async () => (await wl.addOptions.allInnerTexts()).every((t) => /^[A-Z0-9]{3,} - .*ngân hàng/i.test(t.trim())),
      { message: 'Sau 300ms (debounce) chỉ còn gợi ý có "ngân hàng" trong tên' }).toBe(true);
    await expect(wl.addOptions).toHaveCount(5);
    await wl.addInput.fill('VNM');
    await expect(wl.addOption('VNM')).toBeVisible();
  });

  test('TC_WATCHLIST_53: Thêm xong hộp vẫn mở, ô nhập trống để thêm tiếp mã khác', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addMack('ACB');
    await expectNoSuccessToast(page); // 'Đã thêm ACB vào Auto A' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect(wl.addPopover).toBeVisible();
    await expect(wl.addInput).toHaveValue('');
    await wl.addMack('MBB');
    await expectNoSuccessToast(page); // 'Đã thêm MBB vào Auto A' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect.poll(() => wl.macksInTable()).toEqual(['FPT', 'VNM', 'HPG', 'ACB', 'MBB']);
  });

  test('TC_WATCHLIST_54: Đang mở hộp "Thêm mã" mà chọn watchlist khác → hộp đóng, tiêu đề đổi theo khi mở lại', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.addButton.click();
    await expect(wl.addPopover).toBeVisible();
    await wl.selectList('Auto B');
    await expect(wl.addPopover).toBeHidden();
    await wl.addButton.click();
    await expect(wl.addPopoverTitle).toHaveText('Thêm mã vào Auto B');
  });

  test('TC_WATCHLIST_55: Danh mục chỉ-đọc (Nhật ký GD / Khác) — không có nút "Thêm mã", không có icon Xoá', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    for (const tab of ['Nhật ký GD', 'Khác'] as const) {
      await wl.openDropdown();
      await wl.dropdownTab(tab).click();
      const first = wl.dropdownMenu.getByRole('menuitem').first();
      const name = (await first.innerText()).trim();
      await first.click();
      await expect(wl.pickerLabel).toHaveText(name);
      await expect(wl.addButton, tab).toHaveCount(0);
      await expect(wl.rows.first()).toBeVisible({ timeout: 20000 });
      await expect(wl.table.locator('[data-title="Xóa"]'), tab).toHaveCount(0);
    }
  });
});

test.describe('Watchlist — Modal "Quản lý Watchlist"', () => {
  test('TC_WATCHLIST_30: Modal Quản lý — tiêu đề, "Thêm watchlist", ×, mỗi dòng có ☰ + Sửa + Xoá', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await expect(wl.addWatchlistButton).toBeVisible();
    await expect(wl.manageCloseButton).toBeVisible();
    await expect(wl.manageItems).toHaveCount(DEFAULT_LISTS.length);
    for (const l of DEFAULT_LISTS) {
      const item = wl.manageItem(l.name);
      await expect(item.locator('.drag-handle').first()).toBeVisible();
      await expect(item.locator('[data-title="Sửa"]')).toBeVisible();
      await expect(item.locator('[data-title="Xóa"]')).toBeVisible();
    }
    await expect(wl.manageModal.getByRole('checkbox'), 'Checkbox Moderator đã bỏ').toHaveCount(0);
  });

  test('TC_WATCHLIST_32: Kéo-thả đổi thứ tự → POST /api/sort-my-watchlist đúng 1 lần với thứ tự mới', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    // vuedraggable (Sortable.js) dùng HTML5 drag & drop → kéo bằng dragTo.
    const target = wl.manageItem('Auto B');
    const box = (await target.boundingBox())!;
    await wl.manageItem('Auto A').locator('.name').dragTo(target, { targetPosition: { x: 20, y: box.height - 3 } });
    await expect.poll(() => wl.server.writesOf('POST', /sort-my-watchlist/).length).toBe(1);
    await page.waitForTimeout(600);
    expect(wl.server.writesOf('POST', /sort-my-watchlist/)).toHaveLength(1);
    const sorted = wl.server.writesOf('POST', /sort-my-watchlist/)[0].body.my_watchlist_sorted as { name: string }[];
    expect(sorted.map((x) => x.name)).toEqual(['Auto B', 'Auto A', 'Auto Rỗng']);
  });

  test('TC_WATCHLIST_33: Sửa tên watchlist → PUT, toast "Cập nhật Watchlist thành công", tên mới ở modal + dropdown', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.manageItem('Auto B').locator('[data-title="Sửa"]').click();
    await expect(wl.nameInput).toHaveValue('Auto B');
    await wl.nameInput.fill('Auto B2');
    await wl.saveButton.click();
    await expectNoSuccessToast(page); // 'Cập nhật Watchlist thành công' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect(wl.manageItem('Auto B2')).toBeVisible();
    const put = wl.server.writesOf('PUT', /\/api\/my-watchlist\/\d+/);
    expect(put).toHaveLength(1);
    expect(put[0].body).toMatchObject({ name: 'Auto B2' });
  });

  test('TC_WATCHLIST_34: Xoá watchlist → modal cảnh báo "Những mã thuộc Watchlist này sẽ bị xóa hết", xoá xong biến mất', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.manageItem('Auto B').locator('[data-title="Xóa"]').click();
    await expect(wl.deleteWholeListConfirmModal).toBeVisible();
    await wl.deleteWholeListConfirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expectNoSuccessToast(page); // 'Đã xóa Watchlist thành công' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect(wl.manageItem('Auto B')).toHaveCount(0);
    expect(wl.server.writesOf('DELETE', /\/api\/my-watchlist\/\d+/)).toHaveLength(1);
  });

  test('TC_WATCHLIST_35: Sửa / xoá watchlist lỗi máy chủ → toast lỗi, danh sách không đổi', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    wl.server.modes.update = '500';
    wl.server.modes.deleteList = '500';
    await wl.openManageModal();
    await wl.manageItem('Auto B').locator('[data-title="Sửa"]').click();
    await wl.nameInput.fill('Auto B2');
    await wl.saveButton.click();
    await expect(toast(page, 'Có lỗi xảy ra, vui lòng thử lại sau')).toBeVisible();
    await expect(wl.createUpdateModal, 'Lỗi → modal Sửa vẫn mở').toBeVisible();
    await wl.cancelButton.click();
    await wl.manageItem('Auto B').locator('[data-title="Xóa"]').click();
    await wl.deleteWholeListConfirmModal.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(toast(page, 'Đã có lỗi xảy ra, vui lòng thử lại sau')).toBeVisible();
    await expect(wl.manageItem('Auto B')).toBeVisible();
  });
});

test.describe('Watchlist — Modal Tạo/Sửa watchlist', () => {
  test('TC_WATCHLIST_36: "Thêm watchlist" → modal "Thêm mới Watchlist": ô tên trống, nút Hủy/Lưu, không còn checkbox tín hiệu', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.addWatchlistButton.click();
    await expect(wl.createUpdateTitle).toHaveText('Thêm mới Watchlist');
    await expect(wl.createUpdateModal.getByText('Tên Watchlist')).toBeVisible();
    await expect(wl.nameInput).toHaveValue('');
    await expect(wl.saveButton).toBeVisible();
    await expect(wl.cancelButton).toBeVisible();
    await expect(wl.createUpdateModal.getByRole('checkbox')).toHaveCount(0);
  });

  test('TC_WATCHLIST_37: Lưu khi tên trống → toast "Tên Watchlist không được để trống", ô đỏ, không gửi, modal giữ nguyên', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.addWatchlistButton.click();
    await wl.saveButton.click();
    await expect(toast(page, 'Tên Watchlist không được để trống')).toBeVisible();
    await expect(wl.nameInput).toHaveClass(/is-invalid/);
    await expect(wl.createUpdateModal).toBeVisible();
    expect(wl.server.writesOf('POST', /\/api\/my-watchlist/)).toHaveLength(0);
  });

  test('TC_WATCHLIST_38: Tạo watchlist — lỗi máy chủ thì modal giữ nguyên; lưu lại thành công thì đóng + có trong danh sách', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.addWatchlistButton.click();
    wl.server.modes.create = '500';
    await wl.nameInput.fill('Auto Tạo');
    await wl.saveButton.click();
    await expect(toast(page, 'Có lỗi xảy ra, vui lòng thử lại sau')).toBeVisible();
    await expect(wl.createUpdateModal).toBeVisible();
    wl.server.modes.create = 'ok';
    await wl.saveButton.click();
    await expectNoSuccessToast(page); // 'Thêm Watchlist thành công' — toast thành công đã tắt toàn app (main.js, 12/10/2026)
    await expect(wl.createUpdateModal).toBeHidden();
    await expect(wl.manageItem('Auto Tạo')).toBeVisible();
    expect(wl.server.writesOf('POST', /\/api\/my-watchlist/).at(-1)!.body).toMatchObject({ name: 'Auto Tạo', receive_signal: false });
  });

  test('TC_WATCHLIST_39: "Hủy" đóng modal, không gửi gì', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.addWatchlistButton.click();
    await wl.nameInput.fill('Auto Hủy');
    await wl.cancelButton.click();
    await expect(wl.createUpdateModal).toBeHidden();
    await expect(wl.manageItem('Auto Hủy')).toHaveCount(0);
    expect(wl.server.writesOf('POST', /\/api\/my-watchlist/)).toHaveLength(0);
  });

  test('TC_WATCHLIST_40: Mở từ icon Sửa → tiêu đề "Cập nhật Watchlist", tên điền sẵn', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.openManageModal();
    await wl.manageItem('Auto A').locator('[data-title="Sửa"]').click();
    await expect(wl.createUpdateTitle).toHaveText('Cập nhật Watchlist');
    await expect(wl.nameInput).toHaveValue('Auto A');
  });
});

test.describe('Watchlist — Cột phải: Ghi chú & Bài viết', () => {
  test('TC_WATCHLIST_41: Icon "Xem ghi chú" trên 1 dòng → cột phải mở tab Ghi chú, bộ lọc mở sẵn với "Mã CK: VNM"', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open({ storage: { watchlist_right_tab: 'closed' } });
    await expect(wl.rightContent).toHaveCount(0);
    const noteReq = page.waitForRequest((r) => /\/api\/user-note\?/.test(r.url()) && /macks(\[\])?=VNM/.test(decodeURIComponent(r.url())));
    await wl.row('VNM').locator('[data-title="Xem ghi chú"]').click();
    await expect(wl.notesTab).toHaveClass(/active/);
    await expect(wl.noteMackFilter.locator('.ti-tag')).toHaveText(['VNM']);
    await noteReq;
    expect(await wl.leftRatio()).toBeCloseTo(0.7, 2);
  });

  test('TC_WATCHLIST_42: Không có ghi chú nào → "Không có ghi chú nào"', async ({ page }) => {
    wl = new WatchlistPage(page);
    await page.route(/\/api\/user-note\?/, (route) => route.fulfill({ json: { success: true, data: { list: [], last_date: null } } }));
    await wl.open();
    await expect(wl.rightContent.getByRole('heading', { name: 'Không có ghi chú nào' })).toBeVisible();
  });

  test('TC_WATCHLIST_43: Tab "Bài viết" — tin công bố của các mã trong watchlist đang chọn', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.postsTab.click();
    await expect(wl.postsTab).toHaveClass(/active/);
    await expect(wl.rightContent).toBeVisible();
    await expect(wl.rightContent.locator('a').first()).toBeVisible({ timeout: 20000 });
  });

  test('TC_WATCHLIST_44: Bấm lại thẻ đang mở → đóng cột phải (cột trái ~97,5%, ẩn thanh chia cột)', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.postsTab.click();
    await expect(wl.postsTab).toHaveClass(/active/);
    await wl.notesTab.click();
    await expect(wl.notesTab).toHaveClass(/active/);
    await wl.notesTab.click();
    await expect(wl.rightPanelTabs.and(page.locator('.active'))).toHaveCount(0);
    await expect(wl.resizeHandle).toBeHidden();
    await expect.poll(() => wl.leftRatio()).toBeGreaterThan(0.95);
  });

  test('TC_WATCHLIST_45: Nút "Thêm ghi chú mới" hiển thị ở tab Ghi chú', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await expect(wl.addNoteButton).toBeVisible();
  });

  test('TC_WATCHLIST_56: Vào lại trang → mở đúng watchlist đã chọn lần trước (nhớ theo tài khoản)', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.selectList('Auto B');
    const key = await page.evaluate(() => `watchlist_selected_option_${localStorage.getItem('user_id')}`);
    expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(`watchlist_${wl.server.list('Auto B').id}`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(wl.pickerLabel).toHaveText('Auto B', { timeout: 30000 });
    await expect.poll(() => wl.macksInTable()).toEqual(['ACB', 'MBB']);
  });

  test('TC_WATCHLIST_57: Đóng cột phải rồi vào lại trang → vẫn đóng; "Đặt lại bố cục" mở lại tab Ghi chú', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open();
    await wl.notesTab.click();
    expect(await page.evaluate(() => localStorage.getItem('watchlist_right_tab'))).toBe('closed');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wl.waitReady();
    await expect(wl.rightContent).toHaveCount(0);
    await expect(wl.resizeHandle).toBeHidden();
    await wl.resetLayoutButton.click();
    await expect(wl.notesTab).toHaveClass(/active/);
    await expect.poll(() => wl.leftRatio()).toBeCloseTo(0.7, 2);
    expect(await page.evaluate(() => localStorage.getItem('watchlist_right_tab'))).toBe('0');
  });
});

test.describe('Watchlist — Tài khoản Free', () => {
  test('TC_WATCHLIST_46: Free — cột Điểm Canslim, Điểm 4M, Tiềm năng giá hiện "--", không có viên điểm', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open({ account: 'free' });
    const headers = (await wl.table.locator('thead th').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
    const cells = wl.row('FPT').locator('td');
    for (const name of ['Điểm Canslim', 'Điểm 4M', 'Tiềm năng giá (KFSP AI)']) {
      const i = headers.indexOf(name);
      expect(i, name).toBeGreaterThan(-1);
      await expect(cells.nth(i), name).toHaveText('--');
    }
    await expect(wl.table.locator('.score-pill')).toHaveCount(0);
  });

  test('TC_WATCHLIST_61: Free — tab Ghi chú hiện "Bạn cần nâng cấp gói hội viên…" + "Nâng cấp ngay"', async ({ page }) => {
    wl = new WatchlistPage(page);
    await wl.open({ account: 'free' });
    await expect(wl.rightContent.getByText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này')).toBeVisible();
    await expect(wl.rightContent.getByText('Nâng cấp ngay')).toBeVisible();
    await expect(wl.addNoteButton).toHaveCount(0);
  });
});

test.describe('Watchlist — Hành vi chung khác', () => {
  test.fixme('TC_WATCHLIST_49: Giá tự cập nhật qua socket — phụ thuộc phiên giao dịch thật, không assert ổn định được', async () => {});
});
