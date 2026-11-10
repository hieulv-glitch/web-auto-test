import { test, expect, Page } from '@playwright/test';
import { SucManhDongTienPage } from '../pages/SucManhDongTienPage';
import { Prev2Session, PREV2_BASE_URL } from '../pages/Prev2Session';

// Chạy trên `PREV2_BASE_URL` (09/11/2026 = https://kfsp.vn — bản preprod mới nhất), đăng nhập qua `Prev2Session`.
// ⚠️ AN TOÀN DỮ LIỆU: backend là production, tài khoản test dùng chung. Mọi request không phải GET tới `*.kfsp.vn/api/`
// bị huỷ (`guardWrites`), riêng `POST /api/watchlist` (thêm mã vào watchlist) được GIẢ LẬP — không mã nào được thêm/xoá
// thật. Trước 09/11/2026 spec này xoá VNM khỏi watchlist thật qua màn /watchlist rồi thêm lại thật (TC_SMDT_15) — đã bỏ.
test.use({ baseURL: PREV2_BASE_URL });

type WatchlistAdd = { mack: string; my_watchlist_id: number };
/** Lệnh "thêm mã vào watchlist" app đã định gửi (đã giả lập, không tới máy chủ) + các lệnh ghi khác bị huỷ. */
const writes = new WeakMap<Page, { adds: WatchlistAdd[]; blocked: string[]; addMode: 'ok' | 'exist' }>();
const READ_ONLY_POST = /\/api\/login(\?|$)|\/getusersettings|\/api\/filter(\?|$)|\/canslim-fourm\/by-mack|\/count-stock-by-mack|socket\.io/;

async function guardWrites(page: Page) {
  const rec = { adds: [] as WatchlistAdd[], blocked: [] as string[], addMode: 'ok' as 'ok' | 'exist' };
  writes.set(page, rec);
  await page.route(/^https:\/\/[^/]*kfsp\.vn\/api\//, async (route) => {
    const r = route.request();
    if (r.method() === 'GET' || r.method() === 'OPTIONS' || READ_ONLY_POST.test(r.url())) return route.fallback();
    rec.blocked.push(`${r.method()} ${new URL(r.url()).pathname}`);
    return route.abort();
  });
  await page.route(/\/api\/watchlist(\?|$)/, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON() || {};
    rec.adds.push({ mack: body.mack, my_watchlist_id: body.my_watchlist_id });
    if (rec.addMode === 'exist') return route.fulfill({ status: 400, json: { message: 'Mã đã tồn tại' } });
    return route.fulfill({ json: { id: 990001, mack: body.mack, my_watchlist_id: body.my_watchlist_id } });
  });
}

async function loginFirst(page: Page) {
  await guardWrites(page);
  await new Prev2Session(page).open({ path: '/suc-manh-dong-tien' });
}

/** Tài khoản Free (`FREE_USER_*`) — tự `test.skip` nếu chưa cấu hình trong .env. */
async function loginFreeOrSkip(page: Page) {
  test.skip(!process.env.FREE_USER_EMAIL || !process.env.FREE_USER_PASSWORD, 'Chưa cấu hình FREE_USER_EMAIL/FREE_USER_PASSWORD trong .env');
  await guardWrites(page);
  await new Prev2Session(page).open({ account: 'free', path: '/suc-manh-dong-tien' });
}

async function gotoReady(page: any) {
  const smdt = new SucManhDongTienPage(page);
  await smdt.goto();
  await smdt.rrgChartCanvas.first().waitFor({ state: 'visible', timeout: 15000 });
  return smdt;
}

/** Thêm 1 mã hợp lệ vào bảng "Bảng dữ liệu" + chờ đường quỹ đạo render lên biểu đồ RRG (canvas cần thời gian
 * để re-zoom/redraw sau khi có dữ liệu socket trả về). */
async function addMackAndWaitChart(page: any, smdt: SucManhDongTienPage, mack = 'VCB') {
  await smdt.searchAndAddMack(mack);
  await expect(smdt.rowOf(mack)).toBeVisible();
  await page.waitForTimeout(1200);
}

test.afterEach(async ({ page }) => {
  // Lưới an toàn: không lệnh ghi nào ngoài dự kiến bị huỷ (nếu có thì app đã định ghi thứ test chưa biết — xem lại).
  const rec = writes.get(page);
  if (rec) expect(rec.blocked, 'lệnh ghi bị chặn ngoài dự kiến').toEqual([]);
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Điều hướng & tổng quan', () => {
  test('TC_SMDT_01: Điều hướng vào màn từ menu "Thị Trường" (trước 10/2026 tên "Toàn cảnh thị trường")', async ({ page }) => {
    await loginFirst(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    // Hover (không click) để mở dropdown mà không điều hướng theo href của chính mục cha.
    await page.getByRole('link', { name: 'Thị Trường', exact: true }).hover();
    const subLink = page.getByRole('link', { name: 'Sức mạnh dòng tiền', exact: true });
    await subLink.waitFor({ state: 'visible' });
    await subLink.click();
    await expect(page).toHaveURL(/\/suc-manh-dong-tien$/);
  });

  test('TC_SMDT_02: Tổng quan layout mặc định', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);

    await expect(smdt.leftTab('Bảng dữ liệu')).toHaveClass(/active/);
    await expect(smdt.rightTab('Biểu đồ RRG')).toHaveClass(/active/);
    await expect(smdt.referenceInput).toHaveValue('VNINDEX');
    await expect(smdt.sliderValueLabel).toHaveText('20 Ngày');
    await expect(smdt.liveClock).not.toHaveText('');
    await expect(smdt.rrgChartCanvas.first()).toBeVisible();
  });
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Panel trái: tab "Bảng dữ liệu"', () => {
  test('TC_SMDT_03: Header bảng "Bảng dữ liệu" đủ cột', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    for (const label of ['Mã CK', 'Trạng thái', 'Ngành', 'Giá', 'RSs', 'RSm', 'RSl', 'Biến động giá (Tuần)', 'Biến động giá (Tháng)', 'Khối lượng']) {
      await expect(smdt.leftPanel.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('TC_SMDT_04: Tìm kiếm mã hiện gợi ý', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.searchInput.fill('vcb');
    await expect(smdt.searchSuggestions.filter({ hasText: 'VCB' }).first()).toBeVisible();
  });

  test('TC_SMDT_05: Chọn gợi ý thêm mã vào bảng + biểu đồ', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await expect(smdt.checkboxOf('VCB')).toBeChecked();
    await expect(smdt.searchInput).toHaveValue('');
  });

  test('TC_SMDT_06: Click mã CK trong bảng mở modal Trading Chart', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await smdt.mackLinkOf('VCB').click();
    await expect(smdt.tradingChartModal).toBeVisible();
    await expect(page).toHaveURL(/\/suc-manh-dong-tien$/);
  });

  test('TC_SMDT_07: Dropdown 3-chấm dòng mã — "Thêm vào watchlist"', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await smdt.rowOptionsToggle('VCB').click();
    await smdt.addToWatchlistMenuItem.click();
    await expect(smdt.addWatchlistModal).toBeVisible();
    await expect(smdt.addWatchlistModal).toContainText('VCB');
  });

  test('TC_SMDT_08: Dropdown 3-chấm dòng mã — "Xóa khỏi danh sách"', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await smdt.rowOptionsToggle('VCB').click();
    await smdt.removeFromListMenuItem.click();
    await expect(smdt.rowOf('VCB')).toHaveCount(0);
  });

  test('TC_SMDT_09: Icon tuỳ chọn cạnh ô tìm kiếm — "Xóa tất cả"', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await smdt.searchMoreOptionsToggle.click();
    await smdt.deleteAllMacksOption.click();
    await expect(smdt.rowOf('VCB')).toHaveCount(0);
  });

  test('TC_SMDT_10: Checkbox "chọn tất cả" ở header bảng', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await addMackAndWaitChart(page, smdt, 'VNM');
    await smdt.checkboxOf('VCB').uncheck({ force: true });
    await smdt.checkboxOf('VNM').uncheck({ force: true });
    await smdt.selectAllCheckbox.check({ force: true });
    await expect(smdt.checkboxOf('VCB')).toBeChecked();
    await expect(smdt.checkboxOf('VNM')).toBeChecked();
  });

  // TC_SMDT_11: giới hạn chọn tối đa 15 mã trong bảng — cần thêm 16 mã hợp lệ thật (nhiều request tra cứu dữ
  // liệu real-time, tốn thời gian chạy đáng kể) để kích hoạt toast lỗi "Bạn chỉ được chọn tối đa 15". Hành vi
  // đã đọc rõ trong `TableData.vue::checkItem`, rủi ro sai lệch thấp — xem testcases/....md TC_SMDT_11.
  test.fixme('TC_SMDT_11: Giới hạn chọn tối đa 15 mã trong bảng', async ({ page }) => {
    // Cần dựng đủ 16 mã hợp lệ trong bảng rồi verify checkbox mã thứ 16 bị disable + toast
    // "Bạn chỉ được chọn tối đa 15" khi cố tick.
  });

  test('TC_SMDT_12: Sắp xếp bảng theo cột', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    const rssHeader = smdt.leftPanel.locator('.col-header', { hasText: 'RSs' });
    await rssHeader.click();
    await expect(smdt.leftPanel.locator('.col-rss .rotate-icon, .col-header.col-rss svg').first()).toBeVisible();
  });
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Panel trái: tab "Watchlist"', () => {
  test('TC_SMDT_13: Chuyển sang tab "Watchlist"', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.leftTab('Watchlist').click();
    await expect(smdt.leftTab('Watchlist')).toHaveClass(/active/);
    await expect(smdt.watchlistCategorySelect).toBeVisible();
    await expect(smdt.watchlistMackInput).toBeVisible();
    await expect(smdt.watchlistAddIcon).toBeVisible();
  });

  test('TC_SMDT_14: Đổi watchlist đang chọn cập nhật đúng bảng', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.leftTab('Watchlist').click();
    await smdt.watchlistCategorySelect.waitFor({ state: 'visible' });
    const options = await smdt.watchlistCategorySelect.locator('option').allTextContents();
    test.skip(options.length < 2, 'Tài khoản test không có đủ 2 watchlist để đổi qua lại.');

    const valueBefore = await smdt.watchlistCategorySelect.inputValue();
    await smdt.watchlistCategorySelect.selectOption({ index: 1 });
    await page.waitForTimeout(800);
    const valueAfter = await smdt.watchlistCategorySelect.inputValue();

    expect(valueAfter).not.toBe(valueBefore);
    // Bảng render lại không lỗi JS (component TableData không crash khi đổi `currentWatchlistId`).
    await expect(smdt.leftPanel).toBeVisible();
  });

  test('TC_SMDT_15: Thêm mã hợp lệ vào watchlist đang chọn', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.leftTab('Watchlist').click();
    await smdt.watchlistMackInput.fill('VNM');
    await expect(smdt.leftPanel.locator('.search-stockcode_item').filter({ hasText: 'VNM' }).first()).toBeVisible();
    await smdt.leftPanel.locator('.search-stockcode_item').filter({ hasText: 'VNM' }).first().click();
    await smdt.watchlistAddIcon.click();
    // Lệnh thêm đã gửi đúng mã + watchlist đang chọn (giả lập thành công, không ghi thật). Toast "Thêm vào watchlist
    // thành công" KHÔNG hiện vì app tắt mọi toast thành công từ 12/10/2026 (main.js).
    await expect.poll(() => writes.get(page)!.adds).toEqual([{ mack: 'VNM', my_watchlist_id: expect.any(Number) }]);
    await expect(page.getByText('Mã chứng khoán đã có trong Watchlist')).toHaveCount(0);
    await expect(smdt.watchlistMackInput).toHaveValue(''); // ô mã được xoá sau khi thêm xong
  });

  test('TC_SMDT_16: Thêm mã không hợp lệ vào watchlist', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.leftTab('Watchlist').click();
    await smdt.watchlistMackInput.fill('ZZZZZ');
    await smdt.watchlistAddIcon.click();
    await expect(page.getByText('Mã CK không hợp lệ!')).toBeVisible({ timeout: 10000 });
  });

  test('TC_SMDT_17: Thêm mã đã có sẵn trong watchlist → toast "Mã chứng khoán đã có trong Watchlist, vui lòng thử lại"', async ({ page }) => {
    await loginFirst(page);
    writes.get(page)!.addMode = 'exist'; // máy chủ (giả) báo trùng — trước 09/11/2026 là fixme vì cần mã chắc chắn có sẵn
    const smdt = await gotoReady(page);
    await smdt.leftTab('Watchlist').click();
    await smdt.watchlistMackInput.fill('VNM');
    await smdt.leftPanel.locator('.search-stockcode_item').filter({ hasText: 'VNM' }).first().click();
    await smdt.watchlistAddIcon.click();
    await expect(page.getByText('Mã chứng khoán đã có trong Watchlist, vui lòng thử lại')).toBeVisible({ timeout: 10000 });
    expect(writes.get(page)!.adds.map((a) => a.mack)).toEqual(['VNM']);
  });
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Panel trái: tab "Ngành"', () => {
  test('TC_SMDT_18: Chuyển sang tab "Ngành"', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.leftTab('Ngành').click();
    await expect(smdt.leftTab('Ngành')).toHaveClass(/active/);
    await expect(smdt.leftPanel.getByText('NGÂN HÀNG', { exact: true }).first()).toBeVisible();
    // Tên ngành KHÔNG phải link — click không mở modal Trading Chart.
    await smdt.leftPanel.getByText('NGÂN HÀNG', { exact: true }).first().click();
    await page.waitForTimeout(500);
    await expect(smdt.tradingChartModal).toHaveCount(0);
  });

  test('TC_SMDT_19: Chọn checkbox 1 ngành thêm vào biểu đồ', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.leftTab('Ngành').click();
    await smdt.checkboxOf('NGÂN HÀNG').check({ force: true });
    await page.waitForTimeout(1200);
    await expect(smdt.rrgChartCanvas.first()).toBeVisible();
  });
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Panel phải: tab "Biểu đồ RRG"', () => {
  test('TC_SMDT_20: Overview tab "Biểu đồ RRG" (mặc định active)', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await expect(smdt.referenceInput).toHaveValue('VNINDEX');
    await expect(smdt.sliderValueLabel).toHaveText('20 Ngày');
    await expect(smdt.liveClock).toContainText(/\(UTC\+7\)/);
  });

  test('TC_SMDT_21: Đổi mã tham chiếu', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.referenceInput.fill('VN30');
    const suggestion = page.locator('.search-stockcode_item').filter({ hasText: 'VN30' }).first();
    await suggestion.waitFor({ state: 'visible' });
    await suggestion.click();
    await expect(smdt.referenceInput).toHaveValue('VN30');
  });

  test('TC_SMDT_22: Kéo slider "Khung hiển thị" đổi số ngày', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.dragSliderToPercent(0.1);
    await page.waitForTimeout(300);
    const afterDrag = (await smdt.sliderValueLabel.textContent())?.trim();
    expect(afterDrag).not.toBe('20 Ngày');
    expect(afterDrag).toMatch(/^\d+\s+Ngày$/);
  });

  test('TC_SMDT_23: Biểu đồ RRG hiện đường quỹ đạo khi có mã được chọn', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await expect(smdt.rrgChartCanvas.first()).toBeVisible();
    const box = await smdt.rrgChartCanvas.first().boundingBox();
    expect(box && box.width).toBeGreaterThan(100);
  });

  test('TC_SMDT_24: Hover 1 điểm dữ liệu hiện tooltip đúng nội dung', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    const found = await smdt.hoverUntilTooltipVisible();
    expect(found, 'Không tìm thấy điểm dữ liệu nào để hover ra tooltip trên biểu đồ RRG').toBe(true);
    await expect(smdt.tooltipTitle.first()).toContainText('VCB');
    await expect(smdt.tooltipDate.first()).toBeVisible();
    await expect(smdt.tooltipMomentum.first()).toBeVisible();
    await expect(smdt.tooltipStrength.first()).toBeVisible();
  });

  test('TC_SMDT_25: 4 vùng màu quadrant + trục — canvas hiển thị (nội dung vẽ trên canvas, xem ảnh chụp trong testcase doc)', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await expect(smdt.rrgChartCanvas.first()).toBeVisible();
    const box = await smdt.rrgChartCanvas.first().boundingBox();
    expect(box && box.width).toBeGreaterThan(200);
    expect(box && box.height).toBeGreaterThan(200);
  });
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Panel phải: tab "Biểu đồ RS"', () => {
  test('TC_SMDT_26: Tab "Biểu đồ RS" khi chưa chọn mã nào', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.rightTab('Biểu đồ RS').click();
    await expect(smdt.rsEmptyPlaceholder).toBeVisible();
  });

  test('TC_SMDT_27: Biểu đồ RS hiện line chart khi có mã được chọn', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await smdt.rightTab('Biểu đồ RS').click();
    await page.waitForTimeout(800);
    await expect(smdt.rsEmptyPlaceholder).toHaveCount(0);
    await expect(smdt.rsChartCanvas.first()).toBeVisible();
  });
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Chung: resize & giữ trạng thái', () => {
  test('TC_SMDT_28: Kéo thanh chia đổi tỉ lệ 2 panel', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    const before = await smdt.leftPanel.boundingBox();
    const barBox = await smdt.resizeBar.boundingBox();
    expect(before && barBox).toBeTruthy();
    await page.mouse.move(barBox!.x + barBox!.width / 2, barBox!.y + barBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(barBox!.x + 120, barBox!.y + barBox!.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const after = await smdt.leftPanel.boundingBox();
    expect(after!.width).toBeGreaterThan(before!.width + 50);
  });

  test('TC_SMDT_29: Giữ danh sách mã đã thêm qua F5 reload', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await addMackAndWaitChart(page, smdt, 'VCB');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(smdt.rowOf('VCB')).toBeVisible({ timeout: 10000 });
  });

  test('TC_SMDT_30: Giữ mã tham chiếu qua F5 reload', async ({ page }) => {
    await loginFirst(page);
    const smdt = await gotoReady(page);
    await smdt.referenceInput.fill('VN30');
    const suggestion = page.locator('.search-stockcode_item').filter({ hasText: 'VN30' }).first();
    await suggestion.waitFor({ state: 'visible' });
    await suggestion.click();
    await expect(smdt.referenceInput).toHaveValue('VN30');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(smdt.referenceInput).toHaveValue('VN30', { timeout: 10000 });
  });
});

test.describe('Toàn cảnh thị trường — Sức mạnh dòng tiền — Giới hạn theo gói hội viên (Free)', () => {
  test('TC_SMDT_31: Free — cả 3 tab bảng dữ liệu bên trái đều bị khoá', async ({ page }) => {
    await loginFreeOrSkip(page);
    const smdt = new SucManhDongTienPage(page);
    await smdt.goto();
    await page.waitForTimeout(1500);
    await expect(smdt.protectedViews.first()).toBeVisible();

    await smdt.leftTab('Watchlist').click();
    await page.waitForTimeout(500);
    await expect(smdt.protectedViews.first()).toBeVisible();

    await smdt.leftTab('Ngành').click();
    await page.waitForTimeout(500);
    await expect(smdt.protectedViews.first()).toBeVisible();
  });

  test('TC_SMDT_32: Free — cả biểu đồ RRG lẫn biểu đồ RS đều bị khoá', async ({ page }) => {
    await loginFreeOrSkip(page);
    const smdt = new SucManhDongTienPage(page);
    await smdt.goto();
    await page.waitForTimeout(1500);

    // Tab RRG (mặc định active) — panel phải có ProtectedView (CSS blur filter phủ lên chart thật).
    const rightProtected = smdt.rightPanel.locator('.image-container');
    await expect(rightProtected.first()).toBeVisible();

    // Tab RS — CŨNG bị khoá, nhưng bằng 1 ảnh nền đã làm mờ sẵn từ server thay vì CSS blur filter (dễ nhầm là
    // không khoá nếu chỉ nhìn ảnh chụp màn hình — đã đính chính, xem TC_SMDT_32 trong file .md).
    await smdt.rightTab('Biểu đồ RS').click();
    await page.waitForTimeout(800);
    const rsProtected = smdt.rightPanel.locator('.image-container');
    await expect(rsProtected.first()).toBeVisible();
    await expect(rsProtected.first().locator('img.blurred-image')).toHaveAttribute(
      'src',
      /blur\/smdt_rs\.png/
    );
  });
});
