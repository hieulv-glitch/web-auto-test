import { test, expect, Page } from '@playwright/test';
import { BacktestPage, OpenOptions, Seed, preAccount } from '../pages/BacktestPage';
import { PREV2_BASE_URL } from '../pages/Prev2Session';

// Backtest chiến lược (`/backtest-chien-luoc`) — đã lên preprod/production (giao diện làm lại 19–21/10/2026). Chạy trên
// `PREV2_BASE_URL` (09/11/2026 = https://kfsp.vn), đăng nhập qua `Prev2Session`.
// Tài liệu: testcases/backtest-chien-luoc.md.
//
// AN TOÀN DỮ LIỆU: `BacktestPage.open()` thay API lịch sử `/api/backtest/run` bằng máy chủ giả trong bộ nhớ (chạy,
// ghim, xoá lịch sử đều không chạm tài khoản thật) và chặn `/updateusersettings` (ô tìm mã lưu mã đang chọn). Nến
// giá vẫn lấy thật qua socket nên số liệu đổi theo ngày — test chỉ assert cấu trúc, định dạng, hành vi.
//
// Chạy: npx playwright test tests/backtest-chien-luoc.spec.ts --project=chromium --workers=2


test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.describe.configure({ timeout: 150_000 });

/** Phần trăm có dấu 2 chữ số thập phân như trang hiển thị (dấu trừ là "−" U+2212). */
const PCT = /^[+−]?\d[\d,]*\.\d{2}%$/;
const DATE = /^\d{2}\/\d{2}\/\d{4}$/;

async function openBt(page: Page, opts: OpenOptions & { seeds?: Seed[] } = {}): Promise<BacktestPage> {
  const bt = new BacktestPage(page, opts.seeds ?? []);
  await bt.open(opts);
  return bt;
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

/** dd/mm/yyyy của hôm nay lùi `years` năm, theo giờ trình duyệt (moment ở trang dùng giờ máy). */
function vnDate(yearsBack = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsBack);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// =====================================================================================================
test.describe('Truy cập & điều hướng', () => {
  test('TC_BACKTEST_01: Menu Cơ hội có mục "Backtest chiến lược" nhãn Beta, bấm vào mở đúng trang', async ({ page }) => {
    const bt = await openBt(page);
    await page.goto('/dashboard');
    const coHoi = page.locator('.c-header-nav-items').filter({ has: page.getByRole('link', { name: 'Cơ hội' }) });
    await coHoi.hover();
    const item = coHoi.locator('.sub-menu-item').filter({ hasText: 'Backtest chiến lược' });
    await expect(item).toBeVisible();
    await expect(item.locator('.beta-label')).toHaveText('Beta');
    // 3 mục con theo đúng thứ tự mainMenu.js
    await expect(coHoi.locator('.sub-menu-item')).toHaveText([/Bộ lọc cổ phiếu/, /Cơ hội tiềm năng/, /Backtest chiến lược\s*Beta/]);
    await item.click();
    await expect(page).toHaveURL(/\/backtest-chien-luoc$/);
    await expect(bt.runBtn).toBeVisible({ timeout: 30000 });
  });

  test('TC_BACKTEST_02: Đang ở trang Backtest thì tiêu đề "Cơ hội" trên thanh menu được tô sáng', async ({ page }) => {
    await openBt(page);
    const title = page.locator('.c-header-nav-items').getByRole('link', { name: 'Cơ hội' }).locator('div').first();
    await expect(title).toHaveClass(/active-tab-overview/);
    await expect(page.locator('.c-header-nav-items').getByRole('link', { name: 'Thị Trường' }).locator('div').first())
      .not.toHaveClass(/active-tab-overview/);
  });

  test('TC_BACKTEST_03: Chưa đăng nhập vào thẳng URL → chuyển về trang đăng nhập', async ({ page }) => {
    await page.goto('/backtest-chien-luoc');
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });

  test('TC_BACKTEST_04: Nút robot KFSP AI bị ẩn trên trang Backtest, rời trang thì hiện lại', async ({ page }) => {
    await openBt(page);
    await expect(page.locator('body')).toHaveClass(/bt-hide-robot/);
    await page.getByRole('link', { name: 'Watchlist' }).first().click();
    await expect(page).toHaveURL(/\/watchlist/);
    await expect(page.locator('body')).not.toHaveClass(/bt-hide-robot/);
  });

  test('TC_BACKTEST_05: Tài khoản Free vào được trang và chạy được Backtest (không bị khoá)', async ({ page }) => {
    const { email, password } = preAccount('free');
    test.skip(!email || !password, 'Chưa cấu hình tài khoản Free trong .env');
    const bt = await openBt(page, { account: 'free' });
    await expect(page.locator('.blurred-image')).toHaveCount(0);
    await bt.runToResult();
    await expect(bt.kpis).toHaveCount(4);
    test.info().annotations.push({ type: 'Hành vi đo được', description: 'Free dùng đầy đủ tính năng — cần PO xác nhận có chủ đích (menu không có hideForFree, route không gate gói).' });
  });
});

// =====================================================================================================
test.describe('Trạng thái ban đầu', () => {
  test('TC_BACKTEST_06: Bố cục ban đầu — cột Thiết lập bên trái, khung chờ xám bên phải', async ({ page }) => {
    const bt = await openBt(page);
    await expect(bt.sidebar.locator('.bt-phead').first()).toContainText('Thiết lập chạy Backtest');
    await expect(bt.sidebar.locator('.bt-tl-label')).toHaveText(['Mã', 'Chiến lược chạy', 'Thời gian chạy', 'Số tiền mỗi lần mua']);
    // Từ 19/10/2026 cột trái là 2 thẻ rời: Thiết lập + Lịch sử
    await expect(bt.sidebar.locator('section.bt-scard')).toHaveCount(1);
    await expect(bt.sidebar.locator('section.bt-hcard')).toHaveCount(1);
    await expect(bt.runBtn).toBeEnabled();
    await expect(bt.placeholder).toBeVisible();
    await expect(bt.placeholder).not.toHaveClass(/bt-ph-overlay/);
    await expect(bt.placeholder.locator('.bt-ph-kpi')).toHaveCount(4);
    await expect(bt.resultHeader).toHaveCount(0);
    await expect(bt.errorBox).toHaveCount(0);
  });

  test('TC_BACKTEST_07: Giá trị mặc định — Chiến lược KFSP, 1 năm, Số tiền mỗi lần mua 100,000,000 đ', async ({ page }) => {
    const bt = await openBt(page);
    await expect(bt.strategyChips).toHaveCount(1);
    await expect(bt.strategyChips.first()).toContainText('1. Chiến lược KFSP');
    await expect(bt.periodSelect).toHaveValue('1');
    await expect(bt.periodSelect.locator('option')).toHaveText(['1 năm', '3 năm', '5 năm', 'Tuỳ chỉnh']);
    await expect(bt.dateInput('Từ ngày')).toHaveCount(0);
    // Ô chọn cách tính (Số cổ phiếu cố định / Toàn bộ tiền đang có) đã bỏ ngày 16/10/2026
    await expect(bt.sidebar.locator('select.bt-bar-source')).toHaveCount(0);
    await expect(bt.sizeInput).toHaveValue('100,000,000');
    await expect(bt.sizeUnit).toHaveText('đ');
  });

  test('TC_BACKTEST_08: Ô Mã hiện mã đang chọn của web + tên công ty bên dưới', async ({ page }) => {
    const bt = await openBt(page);
    await expect(bt.symbolInput).toHaveValue(/^[A-Z0-9]{3,}$/);
    await expect(bt.companyName).toBeVisible();
    await expect(bt.companyName).not.toHaveText('');
  });

  test('TC_BACKTEST_09: Lịch sử trống — "Chưa có lượt chạy nào.", không có số đếm, không có nút xoá', async ({ page }) => {
    const bt = await openBt(page);
    await expect(bt.historyHeader).toContainText('Lịch sử các lần chạy');
    await expect(bt.historyEmpty).toBeVisible();
    await expect(bt.historyCount).toHaveCount(0);
    await expect(bt.historyClearBtn).toHaveCount(0);
    expect(bt.server.callsOf('GET').length).toBeGreaterThanOrEqual(1);
  });
});

// =====================================================================================================
test.describe('Ô Mã', () => {
  test('TC_BACKTEST_10: Gõ mã → gợi ý (tối đa 5 dòng), chọn → ô hiện mã, tên công ty đổi theo', async ({ page }) => {
    const bt = await openBt(page);
    const before = await bt.companyName.textContent();
    await bt.symbolInput.click();
    await bt.symbolInput.fill('FP');
    await expect(bt.symbolSuggestions.first()).toBeVisible();
    expect(await bt.symbolSuggestions.count()).toBeLessThanOrEqual(5);
    await bt.selectSymbol('FPT');
    await expect(bt.companyName).toContainText(/FPT/i);
    expect(await bt.companyName.textContent()).not.toBe(before);
  });

  test('TC_BACKTEST_11: Vào ô Mã → bôi đen cả mã, gõ là thay thế', async ({ page }) => {
    const bt = await openBt(page);
    const code = await bt.symbolInput.inputValue();
    const selection = () => bt.symbolInput.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]);
    // Vào ô bằng bàn phím: `onStockFocus` chọn hết chữ
    await bt.symbolInput.focus();
    expect(await selection()).toEqual([0, code.length]);
    await page.keyboard.type('FP');
    await expect(bt.symbolInput).toHaveValue('FP');
    // Bấm chuột: ghi lại hành vi đo được (lần đo đầu 15/10/2026 ra [3,3] — mouseup đặt lại con trỏ; lần sau ra [0,3])
    await page.keyboard.press('Escape');
    await bt.sidebar.locator('.bt-tl-label', { hasText: 'Thời gian chạy' }).click();
    await bt.symbolInput.click();
    test.info().annotations.push({ type: 'Hành vi đo được', description: `Bấm chuột vào ô Mã: selection = [${await selection()}]` });
  });

  test('TC_BACKTEST_12: Gõ dở rồi rời ô không chọn gợi ý → ô trả lại mã đang chọn', async ({ page }) => {
    const bt = await openBt(page);
    const code = await bt.symbolInput.inputValue();
    await bt.symbolInput.click();
    await bt.symbolInput.fill('XYZ');
    await bt.sidebar.locator('.bt-tl-label', { hasText: 'Thời gian chạy' }).click();
    await expect(bt.symbolInput).toHaveValue(code);
    await expect(bt.symbolSuggestions).toHaveCount(0);
  });

  test('TC_BACKTEST_13: Lượt chạy dùng đúng mã vừa chọn', async ({ page }) => {
    const bt = await openBt(page);
    await bt.selectSymbol('HPG');
    await bt.periodSelect.selectOption('1');
    await bt.runToResult();
    await expect(bt.runSymbol).toHaveText('HPG');
    expect(bt.server.saved[0].symbols).toEqual(['HPG']);
    // Ô tìm mã lưu mã đã chọn qua setting tài khoản — đã bị chặn, không ghi thật
    await expect.poll(() => bt.blockedSettingWrites.length, { timeout: 5000 }).toBeGreaterThan(0);
  });
});

// =====================================================================================================
test.describe('Chiến lược chạy & bảng chọn chiến lược', () => {
  test('TC_BACKTEST_14: Bảng chọn hiện đủ 15 chiến lược, chiến lược đang chạy được đánh dấu', async ({ page }) => {
    const bt = await openBt(page);
    await bt.openPicker();
    await expect(bt.picker).toContainText('Chọn chiến lược cho lượt chạy');
    await expect(bt.pickerCount).toHaveText('15 chiến lược');
    await expect(bt.pickerItems).toHaveCount(15);
    await expect(bt.pickerItems.first()).toHaveText('Chiến lược KFSP');
    await expect(bt.pickerItem('Chiến lược KFSP')).toHaveAttribute('aria-pressed', 'true');
    await expect(bt.pickerItem('Chandelier Exit')).toHaveAttribute('aria-pressed', 'false');
  });

  test('TC_BACKTEST_15: Chọn thêm chiến lược → thêm thẻ đánh số tiếp, bảng vẫn mở để chọn tiếp', async ({ page }) => {
    const bt = await openBt(page);
    await bt.openPicker();
    await bt.pickerItem('RSI quá bán, quá mua').click();
    await bt.pickerItem('Kênh SSL').click();
    await expect(bt.picker).toBeVisible();
    await expect(bt.pickerItem('Kênh SSL')).toHaveAttribute('aria-pressed', 'true');
    await expect(bt.strategyChips).toHaveText([/1\. Chiến lược KFSP/, /2\. RSI quá bán, quá mua/, /3\. Kênh SSL/]);
  });

  test('TC_BACKTEST_16: Bấm lại chiến lược đang chọn trong bảng → bỏ khỏi lượt chạy', async ({ page }) => {
    const bt = await openBt(page);
    await bt.openPicker();
    await bt.pickerItem('Kênh SSL').click();
    await bt.pickerItem('Chiến lược KFSP').click();
    await expect(bt.pickerItem('Chiến lược KFSP')).toHaveAttribute('aria-pressed', 'false');
    await expect(bt.strategyChips).toHaveText([/1\. Kênh SSL/]);
  });

  test('TC_BACKTEST_17: Nút × trên thẻ bỏ chiến lược, các thẻ còn lại đánh số lại', async ({ page }) => {
    const bt = await openBt(page);
    await bt.addStrategies('Chandelier Exit', 'Kênh SSL');
    await bt.chipRemove('Chiến lược KFSP').click();
    await expect(bt.strategyChips).toHaveText([/1\. Chandelier Exit/, /2\. Kênh SSL/]);
  });

  test('TC_BACKTEST_18: Ô tìm lọc theo tên, không phân biệt dấu/hoa thường', async ({ page }) => {
    const bt = await openBt(page);
    await bt.openPicker();
    await bt.pickerSearch.fill('rsi');
    await expect(bt.pickerItems).toHaveText(['RSI quá bán, quá mua']);
    await bt.pickerSearch.fill('cat duong');
    await expect(bt.pickerItems).toHaveText([
      'Đường trung bình nhanh cắt đường trung bình chậm', 'Giá cắt đường trung bình', 'MACD cắt đường tín hiệu',
    ]);
    await bt.pickerSearch.fill('');
    await expect(bt.pickerItems).toHaveCount(15);
  });

  test('TC_BACKTEST_19: Tìm không khớp → câu báo không có chiến lược nào', async ({ page }) => {
    const bt = await openBt(page);
    await bt.openPicker();
    await bt.pickerSearch.fill('khongcochienluocnay');
    await expect(bt.pickerEmpty).toHaveText('Không có chiến lược nào khớp chữ Bạn tìm.');
    await expect(bt.pickerItems).toHaveCount(0);
  });

  test('TC_BACKTEST_20: Đóng bảng chọn bằng nút ×, phím Esc (ở ô tìm) và bấm ra nền ngoài', async ({ page }) => {
    const bt = await openBt(page);
    await bt.openPicker();
    await bt.pickerClose.click();
    await expect(bt.picker).toBeHidden();

    await bt.openPicker();
    await bt.pickerSearch.click();
    await page.keyboard.press('Escape');
    await expect(bt.picker).toBeHidden();

    await bt.openPicker();
    await bt.pickerBackdrop.click({ position: { x: 10, y: 10 } });
    await expect(bt.picker).toBeHidden();
    await expect(bt.strategyChips).toHaveCount(1);
  });

  test('TC_BACKTEST_21: 🐞 BUG — mở lại bảng chọn: chữ tìm cũ không được xoá, ô tìm không tự focus (lỗi JS applySearch.cancel)', async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);
    const bt = await openBt(page);
    await bt.openPicker();
    await bt.pickerSearch.fill('rsi');
    await expect(bt.pickerItems).toHaveCount(1);
    await bt.pickerClose.click();
    await bt.openPicker();
    // Kỳ vọng theo code (watcher `open`): ô tìm rỗng, đủ 15 dòng, ô tìm được focus.
    // Hành vi thật đo được: watcher ném TypeError ngay dòng đầu (`this.applySearch.cancel` — method debounce bị Vue
    // bind lại nên mất `.cancel`), các dòng xoá chữ + focus không chạy.
    const value = await bt.pickerSearch.inputValue();
    const focused = await bt.pickerSearch.evaluate((el) => el === document.activeElement);
    const hasCancelError = consoleErrors.some((e) => /applySearch\.cancel is not a function/.test(e));
    test.info().annotations.push({
      type: 'Hành vi đo được',
      description: `Ô tìm khi mở lại = "${value}", focus = ${focused}, lỗi console applySearch.cancel = ${hasCancelError}`,
    });
    expect(hasCancelError, 'lỗi JS applySearch.cancel khi mở bảng chọn').toBe(true);
    expect(value, 'chữ tìm cũ vẫn còn khi mở lại').toBe('rsi');
    expect(focused).toBe(false);
  });
});

// =====================================================================================================
test.describe('Thời gian chạy', () => {
  test('TC_BACKTEST_22: Chọn 1 năm → lượt chạy từ đúng 1 năm trước tới hôm nay', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('1');
    await bt.runToResult();
    await expect(bt.runRange).toContainText(`${vnDate(1)} – ${vnDate(0)}`);
    expect(bt.server.saved[0].from_date).toBe(vnDate(1));
    expect(bt.server.saved[0].to_date).toBe(vnDate(0));
  });

  test('TC_BACKTEST_23: Chọn Tuỳ chỉnh → hiện 2 ô Từ ngày / Tới ngày, giữ 2 ngày đang có, có nút lịch', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('custom');
    await expect(bt.dateInput('Từ ngày')).toHaveValue(vnDate(1)); // kỳ mặc định 1 năm (từ 16/10/2026)
    await expect(bt.dateInput('Tới ngày')).toHaveValue(vnDate(0));
    await expect(bt.dateField('Từ ngày').getByTitle('Chọn trên lịch')).toBeVisible();
    await expect(bt.dateField('Tới ngày').getByTitle('Chọn trên lịch')).toBeVisible();
    await expect(bt.dateInput('Từ ngày')).toHaveAttribute('maxlength', '10');
  });

  test('TC_BACKTEST_24: Ô ngày chỉ nhận chữ số và tự chèn dấu "/"', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('custom');
    const input = bt.dateInput('Từ ngày');
    await input.fill('');
    await input.pressSequentially('01a02b2024');
    await expect(input).toHaveValue('01/02/2024');
    await input.fill('');
    await input.pressSequentially('0102');
    await expect(input).toHaveValue('01/02');
    await expect(bt.dateField('Từ ngày').locator('.bt-date')).toHaveClass(/sai/);
  });

  test('TC_BACKTEST_25: 🐞 Ngày chưa đủ (01/02) → ô viền đỏ nhưng bấm Chạy vẫn chạy, tự hiểu là 01/02 năm nay', async ({ page }) => {
    const bt = await openBt(page);
    const year = new Date().getFullYear();
    await bt.setCustomPeriod('01/02', vnDate(0));
    await expect(bt.dateField('Từ ngày').locator('.bt-date')).toHaveClass(/sai/);
    await expect(bt.dateField('Tới ngày').locator('.bt-date')).not.toHaveClass(/sai/);
    await bt.runAndWait();
    // Kỳ vọng: báo "Khoảng thời gian chưa dùng được." như các ngày sai khác. Thực tế: `checkRunInput` dùng
    // moment(..., 'DD/MM/YYYY') KHÔNG strict nên "01/02" hợp lệ (= 01/02 năm nay), trong khi ô lại dùng isoOf strict → đỏ.
    const ran = await bt.resultHeader.count();
    test.info().annotations.push({
      type: 'Hành vi đo được',
      description: ran ? `Không báo lỗi, đã chạy kỳ "${await bt.runRange.textContent()}"` : `Báo lỗi: ${await bt.errorBox.textContent()}`,
    });
    await expect(bt.errorBox).toHaveCount(0);
    await expect(bt.runRange).toContainText(`01/02/${year} – ${vnDate(0)}`);
    expect(bt.server.saved[0].from_date).toBe(`01/02/${year}`);
  });

  test('TC_BACKTEST_84: Ngày sai định dạng (chưa có năm hợp lệ, vd "01/13/2025") → báo "Khoảng thời gian chưa dùng được."', async ({ page }) => {
    const bt = await openBt(page);
    await bt.setCustomPeriod('01/13/2025', vnDate(0));
    await expect(bt.dateField('Từ ngày').locator('.bt-date')).toHaveClass(/sai/);
    await bt.runBtn.click();
    await expect(bt.errorRow('Chuyện gì')).toContainText('Khoảng thời gian chưa dùng được.');
    await expect(bt.errorRow('Vì sao')).toContainText('Ngày phải ghi theo dạng ngày/tháng/năm, và ngày đầu phải trước ngày cuối.');
    await expect(bt.errorRow('Làm gì tiếp')).toContainText('Sửa lại hai ô Từ ngày và Tới ngày.');
    expect(bt.server.saved).toHaveLength(0);
  });

  test('TC_BACKTEST_26: Từ ngày sau Tới ngày (hoặc bằng nhau) → báo lỗi khoảng thời gian', async ({ page }) => {
    const bt = await openBt(page);
    await bt.setCustomPeriod('01/06/2025', '01/01/2025');
    await bt.runBtn.click();
    await expect(bt.errorRow('Chuyện gì')).toContainText('Khoảng thời gian chưa dùng được.');
    await bt.setCustomPeriod('01/06/2025', '01/06/2025');
    await bt.runBtn.click();
    await expect(bt.errorRow('Chuyện gì')).toContainText('Khoảng thời gian chưa dùng được.');
    await expect(bt.resultHeader).toHaveCount(0);
  });

  test('TC_BACKTEST_27: Ngày không tồn tại (31/02/2025) → ô viền đỏ', async ({ page }) => {
    const bt = await openBt(page);
    await bt.setCustomPeriod('31/02/2025', vnDate(0));
    await expect(bt.dateField('Từ ngày').locator('.bt-date')).toHaveClass(/sai/);
    await bt.runBtn.click();
    test.info().annotations.push({
      type: 'Hành vi đo được',
      description: `Bấm Chạy với 31/02/2025: ${(await bt.errorBox.count()) ? 'báo lỗi khoảng thời gian' : 'KHÔNG báo lỗi'}`,
    });
    await expect(bt.errorRow('Chuyện gì')).toContainText('Khoảng thời gian chưa dùng được.');
  });

  test('TC_BACKTEST_28: Chọn lại số năm sau khi Tuỳ chỉnh → ẩn 2 ô ngày, kỳ tính lại từ hôm nay', async ({ page }) => {
    const bt = await openBt(page);
    await bt.setCustomPeriod('01/01/2020', '01/01/2021');
    await bt.periodSelect.selectOption('3');
    await expect(bt.dateInput('Từ ngày')).toHaveCount(0);
    await bt.periodSelect.selectOption('custom');
    await expect(bt.dateInput('Từ ngày')).toHaveValue(vnDate(3));
    await expect(bt.dateInput('Tới ngày')).toHaveValue(vnDate(0));
  });

  test('TC_BACKTEST_29: Chọn ngày bằng lịch → ô ngày điền dd/mm/yyyy', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('custom');
    const native = bt.dateField('Từ ngày').locator('input[type="date"]');
    await expect(native).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    await native.evaluate((el: HTMLInputElement) => { el.value = '2023-03-15'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    await expect(bt.dateInput('Từ ngày')).toHaveValue('15/03/2023');
  });

  test('TC_BACKTEST_30: Kỳ không có dữ liệu giá → báo "Không có dữ liệu giá cho mã …"', async ({ page }) => {
    const bt = await openBt(page);
    const code = await bt.symbolInput.inputValue();
    await bt.setCustomPeriod('01/01/1995', '01/01/1996');
    await bt.runAndWait();
    await expect(bt.errorRow('Chuyện gì')).toContainText(`Không có dữ liệu giá cho mã ${code}.`);
    await expect(bt.errorRow('Làm gì tiếp')).toContainText('Kiểm lại mã đã gõ đúng chưa, hoặc chọn khoảng thời gian gần đây hơn.');
    await expect(bt.resultHeader).toHaveCount(0);
    expect(bt.server.saved).toHaveLength(0);
  });
});

// =====================================================================================================
test.describe('Số tiền mỗi lần mua', () => {
  // TC_BACKTEST_31 (đổi cách tính Số tiền / Số cổ phiếu / Toàn bộ tiền) đã xoá: ô chọn cách tính bỏ ngày 16/10/2026.
  test('TC_BACKTEST_32: Nhập số → tự định dạng; nhập chữ / số 0 → giữ số cũ', async ({ page }) => {
    const bt = await openBt(page);
    await bt.sizeInput.fill('50000000');
    await bt.sizeInput.press('Tab');
    await expect(bt.sizeInput).toHaveValue('50,000,000');
    await bt.sizeInput.fill('abc');
    await bt.sizeInput.press('Tab');
    await expect(bt.sizeInput).toHaveValue('50,000,000');
    await bt.sizeInput.fill('0');
    await bt.sizeInput.press('Tab');
    await expect(bt.sizeInput).toHaveValue('50,000,000');
    await bt.sizeInput.fill('2.000.000');
    await bt.sizeInput.press('Tab');
    await expect(bt.sizeInput).toHaveValue('2,000,000');
  });

  test('TC_BACKTEST_33: Số tiền đã nhập được áp vào lượt chạy (bản chụp chiến lược gửi lưu)', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('1');
    await bt.sizeInput.fill('50000000');
    await bt.sizeInput.press('Tab');
    await bt.runToResult();
    const snap = bt.server.saved[0].strategies[0].snapshot;
    expect(snap.buy.size).toEqual({ mode: 'fixed_amount', numValue: 50_000_000 });
    test.info().annotations.push({ type: 'Vốn lượt chạy', description: `capital gửi lưu = ${bt.server.saved[0].capital}` });
  });
});

// =====================================================================================================
test.describe('Chạy Backtest', () => {
  test('TC_BACKTEST_34: Chạy 1 chiến lược — tiến độ theo phiên, nút đổi thành Dừng, xong có kết quả + lượt mới', async ({ page }) => {
    const errors = collectErrors(page);
    const bt = await openBt(page);
    const code = await bt.symbolInput.inputValue();
    await bt.periodSelect.selectOption('5'); // kỳ dài để kịp thấy tiến độ (1 năm chạy xong < 1 giây)
    await bt.runBtn.click();
    await expect(bt.stopBtn).toBeVisible();
    await expect(bt.stopBtn).toHaveText('Dừng');
    await expect(bt.progress).toContainText(/Đang đi qua \d{2}\/\d{2}\/\d{4} · phiên [\d,]+\/[\d,]+ · \d+ deal, \d+ lần mua đã đóng/, { timeout: 30000 });
    await expect(page.locator('.bt-progress-bar i')).toBeVisible();
    await expect(bt.runBtn).toBeVisible({ timeout: 120000 });
    await expect(bt.runBtn).toHaveText('Chạy Backtest');
    await expect(bt.progress).toHaveCount(0);
    await expect(bt.runSymbol).toHaveText(code);
    await expect(bt.runStrategy).toHaveText('Chiến lược KFSP');
    await expect(bt.runRange).toHaveText(new RegExp(`^Lượt #1 · ${vnDate(5)} – ${vnDate(0)} · chạy lúc \\d{2}:\\d{2} \\d{2}/\\d{2}/\\d{4}$`));
    await expect(bt.historyItems).toHaveCount(1);
    await expect(bt.historyCount).toHaveText('1/100');
    await expect(bt.historyCount).toHaveAttribute('title', 'Giữ 100 lượt gần nhất, lượt cũ hơn tự xoá');
    await expect(bt.historyItem(1)).toHaveClass(/\bon\b/);
    expect(bt.server.saved).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test('TC_BACKTEST_35: Chạy nhiều chiến lược — tiến độ đếm theo chiến lược, kết quả có bảng so sánh', async ({ page }) => {
    const bt = await openBt(page);
    const code = await bt.symbolInput.inputValue();
    await bt.periodSelect.selectOption('5');
    await bt.addStrategies('RSI quá bán, quá mua', 'Kênh SSL');
    await bt.runBtn.click();
    await expect(bt.progress).toContainText(new RegExp(`Đang chạy mã ${code}`));
    await expect(bt.runBtn).toBeVisible({ timeout: 120000 });
    await expect(bt.runStrategy).toHaveText('3 chiến lược');
    await expect(bt.runRange).toContainText(`${vnDate(5)} – ${vnDate(0)}`);
    await expect(bt.resultRows).toHaveCount(3);
    await expect(bt.historyItem(1).locator('.bt-hist-name')).toHaveText('3 chiến lược');
    // Lượt nhiều chiến lược: dòng "Tốt nhất: <tên>" (hoặc "Không khớp lệnh nào trong kỳ" khi không chiến lược nào có lệnh)
    await expect(bt.historyItem(1).locator('.bt-hist-best, .bt-hist-none').first()).toHaveText(/^(Tốt nhất: .+|Không khớp lệnh nào trong kỳ)$/);
    expect(bt.server.saved[0].strategies.map((s: { title: string }) => s.title))
      .toEqual(['Chiến lược KFSP', 'RSI quá bán, quá mua', 'Kênh SSL']);
  });

  test('TC_BACKTEST_36: Bấm Dừng khi đang chạy → không ra kết quả, không báo lỗi, không lưu lượt', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('5');
    await bt.addStrategies('RSI quá bán, quá mua', 'Kênh SSL'); // nhiều chiến lược → chạy lâu hơn, kịp bấm Dừng
    await bt.runBtn.click();
    await bt.stopBtn.click();
    await expect(bt.runBtn).toBeVisible({ timeout: 30000 });
    await expect(bt.resultHeader).toHaveCount(0);
    await expect(bt.errorBox).toHaveCount(0);
    await expect(bt.historyEmpty).toBeVisible();
    await page.waitForTimeout(1500);
    expect(bt.server.saved).toHaveLength(0);
  });

  test('TC_BACKTEST_37: Bỏ hết chiến lược rồi bấm Chạy → báo "Chưa có chiến lược nào để chạy."', async ({ page }) => {
    const bt = await openBt(page);
    await bt.chipRemove('Chiến lược KFSP').click();
    await expect(bt.strategyChips).toHaveCount(0);
    await bt.runBtn.click();
    await expect(bt.errorRow('Chuyện gì')).toContainText('Chưa có chiến lược nào để chạy.');
    await expect(bt.errorRow('Vì sao')).toContainText('Dòng Chiến lược chạy đang trống.');
    await expect(bt.errorRow('Làm gì tiếp')).toContainText('Bấm + Thêm chiến lược ở khung THIẾT LẬP CHẠY BACKTEST.');
    // Sửa xong chạy lại thì lỗi cũ biến mất
    await bt.addStrategies('Chiến lược KFSP');
    await bt.periodSelect.selectOption('1');
    await bt.runToResult();
    await expect(bt.errorBox).toHaveCount(0);
  });

  test('TC_BACKTEST_38: Chạy lại y hệt thiết lập cũ → không thêm lượt mới, mở lại lượt cũ (không toast)', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('1');
    await bt.runToResult();
    await expect(bt.historyItems).toHaveCount(1);
    await bt.runAndWait();
    await expect.poll(() => bt.server.saved.length).toBe(2);
    await expect(bt.historyItems).toHaveCount(1);
    await expect(bt.resultHeader).toContainText('Lượt #1');
    // Lượt trùng vẫn gửi lên máy chủ (máy chủ khử trùng theo manifest_hash, trả lại id cũ) — không còn toast báo trùng
    expect(bt.server.saved[1].manifest_hash).toBe(bt.server.saved[0].manifest_hash);
    expect(bt.server.runs).toHaveLength(1);
    await expect(bt.toast).toHaveCount(0);
    // Đổi 1 thiết lập (số tiền) → là lượt mới
    await bt.sizeInput.fill('50000000');
    await bt.sizeInput.press('Tab');
    await bt.runAndWait();
    await expect(bt.historyItems).toHaveCount(2);
    await expect(bt.resultHeader).toContainText('Lượt #2');
  });

  test('TC_BACKTEST_39: Lưu lượt lên máy chủ lỗi 500 → kết quả vẫn hiện + toast cảnh báo', async ({ page }) => {
    const bt = await openBt(page);
    bt.server.fail.save = 500;
    await bt.periodSelect.selectOption('1');
    await bt.runToResult();
    await expect(bt.kpis).toHaveCount(4);
    await expect(bt.toastWith('Chưa lưu được lượt chạy lên tài khoản, tải lại trang là mất (mã 500)')).toBeVisible();
    await expect(bt.historyItems).toHaveCount(1);
    // Lượt chưa có id máy chủ → không có nút xoá lượt
    await expect(bt.deleteBtn(1)).toHaveCount(0);
  });

  test('TC_BACKTEST_40: Mất kết nối nguồn giá → báo "Chưa lấy được dữ liệu giá."', async ({ page }) => {
    const bt = await openBt(page);
    await page.evaluate(() => { (window as unknown as { socket_send?: unknown }).socket_send = undefined; });
    await bt.runBtn.click();
    await expect(bt.errorRow('Chuyện gì')).toContainText('Chưa lấy được dữ liệu giá.');
    await expect(bt.errorRow('Vì sao')).toContainText('Trang chưa kết nối được tới nguồn dữ liệu giá.');
    await expect(bt.errorRow('Làm gì tiếp')).toContainText('Tải lại trang rồi bấm Chạy Backtest lần nữa.');
    await expect(bt.runBtn).toBeVisible();
  });

  test('TC_BACKTEST_41: Double-click nút Chạy Backtest → không bao giờ tạo 2 lượt', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('1');
    await bt.runBtn.dblclick();
    await expect(bt.runBtn).toBeVisible({ timeout: 120000 });
    await page.waitForTimeout(2000);
    const results = await bt.resultHeader.count();
    test.info().annotations.push({
      type: 'Hành vi đo được',
      description: `Sau double-click: ${bt.server.saved.length} lượt gửi lưu, ${results ? 'CÓ' : 'KHÔNG có'} kết quả, ${await bt.historyItems.count()} lượt trong lịch sử`,
    });
    // Nút Chạy và nút Dừng cùng 1 chỗ: cú bấm thứ 2 hoặc trúng "Dừng" (lượt dừng im lặng), hoặc — khi kỳ ngắn chạy xong
    // trước cú bấm thứ 2 — chạy lại y hệt (khử trùng). Cả 2 trường hợp đều không được đẻ ra 2 lượt.
    expect(await bt.historyItems.count()).toBeLessThanOrEqual(1);
    expect(bt.server.runs.length).toBeLessThanOrEqual(1);
    await expect(bt.errorBox).toHaveCount(0);
  });

  test('TC_BACKTEST_42: Rời trang khi đang chạy → lượt dừng, không lưu gì lên máy chủ', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('5');
    await bt.addStrategies('RSI quá bán, quá mua', 'Kênh SSL');
    await bt.runBtn.click();
    await expect(bt.stopBtn).toBeVisible();
    await page.getByRole('link', { name: 'Watchlist' }).first().click();
    await expect(page).toHaveURL(/\/watchlist/);
    await page.waitForTimeout(5000);
    expect(bt.server.saved).toHaveLength(0);
  });

  test('TC_BACKTEST_43: Chế độ dữ liệu mẫu (?demo=1) — có nhãn cảnh báo, chạy ra kết quả bằng nến giả', async ({ page }) => {
    const bt = await openBt(page, { query: '?demo=1' });
    await expect(bt.demoTag).toBeVisible();
    await bt.runToResult();
    await expect(bt.kpis).toHaveCount(4);
    test.info().annotations.push({
      type: 'Hành vi đo được',
      description: `Lượt chạy trên DỮ LIỆU MẪU vẫn gửi lưu lên lịch sử tài khoản: ${bt.server.saved.length} lệnh POST`,
    });
  });

  test('TC_BACKTEST_44: Lượt đã chạy vẫn còn trong lịch sử sau khi tải lại trang (F5)', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('1');
    await bt.runToResult();
    await expect(bt.deleteBtn(1)).toBeAttached(); // đã nhận id máy chủ (nút xoá chỉ có ở lượt có id máy chủ)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(bt.historyItems).toHaveCount(1, { timeout: 30000 });
    await expect(bt.historyItem(1)).toContainText('Chiến lược KFSP');
    // Sau F5 chưa mở lượt nào: khung chờ, chưa có kết quả
    await expect(bt.resultHeader).toHaveCount(0);
    await bt.openHistory(1);
    await expect(bt.kpis).toHaveCount(4);
  });
});

// =====================================================================================================
test.describe('Lịch sử các lần chạy', () => {
  test('TC_BACKTEST_45: Mỗi thẻ lượt hiện ô mã, tên chiến lược, kỳ chạy + độ dài, 4 số tóm tắt; tiêu đề có số đếm n/100', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    await expect(bt.historyCount).toHaveText('2/100');
    const one = bt.historyItem(2);
    await expect(one.locator('.bt-hist-sym')).toHaveText('MBB');
    await expect(one.locator('.bt-hist-name')).toHaveText('Chandelier Exit');
    await expect(one.locator('.bt-hist-meta')).toHaveText('15/10/2023 – 15/10/2026 · 3 năm');
    // Thẻ không còn ghi số lượt + giờ chạy (bỏ 19/10/2026)
    await expect(one).not.toContainText('Lượt #');
    await expect(one.locator('.bt-hist-stats dt')).toHaveText(['Lãi lỗ', 'Mua và giữ', 'Lệnh thắng', 'Sụt giảm']);
    await expect(one.locator('.bt-hist-stats dd')).toHaveText(['+38.15%', '+113.19%', '6/10', '−16.50%']);
    await expect(one.locator('.bt-hist-stats dd').first()).toHaveClass(/up/);
    await expect(one.locator('.bt-hist-stats dd').last()).toHaveClass(/down/);
    await expect(one.locator('.bt-hist-best')).toHaveCount(0);
    const many = bt.historyItem(1);
    await expect(many.locator('.bt-hist-sym')).toHaveText('CTD');
    await expect(many.locator('.bt-hist-name')).toHaveText('4 chiến lược');
    await expect(many.locator('.bt-hist-meta')).toHaveText('14/10/2021 – 14/10/2026 · 5 năm');
    await expect(many.locator('.bt-hist-best')).toHaveText('Tốt nhất: RSI quá bán, quá mua');
    // Lượt nhiều chiến lược: 4 số là của chiến lược tốt nhất
    await expect(many.locator('.bt-hist-stats dd')).toHaveText(['+144.16%', '+37.97%', '5/6', '−34.31%']);
  });

  test('TC_BACKTEST_46: Bấm 1 lượt → thẻ sáng lên, mở kết quả, chỉ gọi lấy chi tiết 1 lần', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    await bt.openHistory(2);
    await expect(bt.historyItem(2)).toHaveClass(/\bon\b/);
    await expect(bt.historyItem(1)).not.toHaveClass(/\bon\b/);
    await expect(bt.runSymbol).toHaveText('MBB');
    await expect(bt.runStrategy).toHaveText('Chandelier Exit');
    await expect(bt.runRange).toHaveText(/^Lượt #2 · 15\/10\/2023 – 15\/10\/2026 · chạy lúc \d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/);
    await bt.openHistory(1);
    await bt.openHistory(2);
    const detailCalls = bt.server.calls.filter((c) => c.method === 'GET' && /\/run\/\d+$/.test(c.url));
    expect(detailCalls.map((c) => c.url.split('/').pop())).toEqual(['2', '1']);
  });

  test('TC_BACKTEST_47: Đang lấy chi tiết lượt → dải "Đang lấy chi tiết lượt chạy…"', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    bt.server.detailDelayMs = 3000;
    await bt.historyItem(1).click();
    await expect(page.getByText('Đang lấy chi tiết lượt chạy…')).toBeVisible();
    await expect(page.getByText('Các con số tóm tắt đã có, chi tiết từng lệnh và đường vốn đang được tải.')).toBeVisible();
    await expect(page.getByText('Đang lấy chi tiết lượt chạy…')).toBeHidden({ timeout: 15000 });
    await expect(bt.dealRows.first()).toBeVisible({ timeout: 30000 });
  });

  test('TC_BACKTEST_48: Lấy chi tiết lượt lỗi 500 → toast báo lỗi', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    bt.server.fail.detail = 500;
    await bt.historyItem(1).click();
    await expect(bt.toastWith('Chưa lấy được chi tiết lượt chạy (mã 500)')).toBeVisible();
    await expect(page.getByText('Đang lấy chi tiết lượt chạy…')).toBeHidden();
  });

  test('TC_BACKTEST_49: Lấy danh sách lịch sử lỗi 500 → toast báo lỗi, lịch sử trống', async ({ page }) => {
    const bt = new BacktestPage(page, ['mbb']);
    bt.server.fail.list = 500;
    await bt.open();
    await expect(bt.toastWith('Chưa lấy được lịch sử các lần chạy (mã 500)')).toBeVisible();
    await expect(bt.historyEmpty).toBeVisible();
  });

  // TC_BACKTEST_50/51 (ghim / bỏ ghim lượt) đã xoá: nút ghim không còn trên giao diện preprod.

  test('TC_BACKTEST_52: Xoá toàn bộ lịch sử — hộp hỏi lại của trang; Huỷ thì không xoá', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    let nativeDialog = false;
    page.on('dialog', (d) => { nativeDialog = true; d.dismiss(); });
    await bt.historyClearBtn.click();
    const dlg = bt.confirmDialog;
    await expect(dlg).toBeVisible();
    await expect(dlg).toHaveAttribute('aria-label', 'Xoá toàn bộ lịch sử?');
    await expect(dlg.locator('.cd-body')).toHaveText('Mọi lần chạy sẽ bị xoá khỏi tài khoản của bạn và không khôi phục lại được.');
    await expect(dlg.getByRole('button', { name: 'Huỷ' })).toBeFocused(); // con trỏ mặc định ở Huỷ: Enter không xoá nhầm
    await dlg.getByRole('button', { name: 'Huỷ' }).click();
    await expect(dlg).toBeHidden();
    // Esc / nút × cũng là Huỷ
    await bt.historyClearBtn.click();
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    await bt.historyClearBtn.click();
    await dlg.getByRole('button', { name: 'Đóng' }).click();
    await expect(dlg).toBeHidden();
    expect(nativeDialog, 'không còn dùng window.confirm').toBe(false);
    await expect(bt.historyItems).toHaveCount(2);
    expect(bt.server.callsOf('DELETE')).toHaveLength(0);
  });

  test('TC_BACKTEST_53: Xoá toàn bộ lịch sử — "Xoá toàn bộ" thì xoá từng lượt, danh sách trống, kết quả về khung chờ', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    await bt.openHistory(2);
    await bt.historyClearBtn.click();
    await bt.confirmDialog.getByRole('button', { name: 'Xoá toàn bộ' }).click();
    await expect(bt.historyEmpty).toBeVisible();
    await expect(bt.historyClearBtn).toHaveCount(0);
    await expect(bt.historyCount).toHaveCount(0);
    expect(bt.server.callsOf('DELETE').map((c) => c.url).sort()).toEqual(['/api/backtest/run/1', '/api/backtest/run/2']);
    expect(bt.server.runs).toHaveLength(0);
    await expect(bt.resultHeader).toHaveCount(0);
    await expect(bt.placeholder).not.toHaveClass(/bt-ph-overlay/);
  });

  test('TC_BACKTEST_54: Xoá lịch sử lỗi 500 → toast báo lỗi, danh sách nạp lại đúng như máy chủ', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    bt.server.fail.delete = 500;
    await bt.historyClearBtn.click();
    await bt.confirmDialog.getByRole('button', { name: 'Xoá toàn bộ' }).click();
    await expect(bt.toastWith('Chưa xoá hết được lịch sử (mã 500)')).toBeVisible();
    await expect(bt.historyItems).toHaveCount(2);
  });

  // TC_BACKTEST_55 (bấm tiêu đề "Lịch sử các lần chạy" để thu gọn) đã xoá: thẻ Lịch sử luôn mở từ 15/10/2026.

  test('TC_BACKTEST_56: 🐞 Lượt đã bị dọn chi tiết → KHÔNG còn dải "Lượt này chỉ còn phần tóm tắt.", màn hình báo như lượt không có lệnh / không có giá', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['purged'] });
    await bt.openHistory(1);
    // Số tóm tắt (tầng 1) vẫn còn
    await expect(bt.kpi('Tổng lãi lỗ').locator('.bt-kpi-v')).toHaveText('+38.15%');
    await expect(bt.tocItems).toHaveText(['1Lãi lỗ', '2Chi tiết giao dịch']);
    // Kỳ vọng theo chính chú thích trong code (`combineSummaries`, index.vue): hiện dải cảnh báo "Lượt này chỉ còn phần
    // tóm tắt" để người dùng không lẫn "đã bị dọn" với "không có lệnh / không có giá". Đo 09/11/2026 trên preprod: dải này
    // không còn được vẽ ở template, thay vào đó trang hiện các câu của trường hợp KHÔNG có dữ liệu:
    await expect(page.getByText('Lượt này chỉ còn phần tóm tắt.')).toHaveCount(0);
    await expect(bt.kpi('Tỷ lệ thắng').locator('.bt-kpi-chip')).toHaveText('0/0 lệnh');
    await expect(bt.kpi('Lãi lỗ đậm nhất').locator('.bt-kpi-chip')).toHaveText('Chưa có lệnh nào đã bán');
    await expect(bt.section('bt-sec-giaodich')).toContainText('Không có dữ liệu giá cho mã MBB trong khoảng thời gian đã chọn.');
    await expect(bt.section('bt-sec-giaodich')).toContainText('Chưa có deal nào trong phạm vi này.');
  });

  test('TC_BACKTEST_85: Nút thùng rác trên thẻ → xoá ngay 1 lượt (không hỏi lại); đang xem lượt đó thì mở lượt kế bên', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    await bt.openHistory(2); // MBB
    await bt.historyItem(2).hover();
    await expect(bt.deleteBtn(2)).toBeVisible();
    await bt.deleteBtn(2).click();
    await expect(bt.confirmDialog).toHaveCount(0);
    await expect(bt.historyItems).toHaveCount(1);
    await expect(bt.historyCount).toHaveText('1/100');
    expect(bt.server.callsOf('DELETE').map((c) => c.url)).toEqual(['/api/backtest/run/2']);
    // Lượt đang xem bị xoá → tự mở lượt kế bên (CTD), bấm xoá không làm mở lượt bị xoá
    await expect(bt.runSymbol).toHaveText('CTD', { timeout: 30000 });
    await expect(bt.historyItem(1)).toHaveClass(/\bon\b/);
    // Xoá nốt lượt cuối → về khung chờ
    await bt.historyItem(1).hover();
    await bt.deleteBtn(1).click();
    await expect(bt.historyEmpty).toBeVisible();
    await expect(bt.resultHeader).toHaveCount(0);
  });

  test('TC_BACKTEST_86: Xoá 1 lượt lỗi 500 → lượt trả về đúng chỗ cũ + toast "Chưa xoá được lượt chạy (mã 500)"', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    bt.server.fail.delete = 500;
    await bt.historyItem(2).hover();
    await bt.deleteBtn(2).click();
    await expect(bt.toastWith('Chưa xoá được lượt chạy (mã 500)')).toBeVisible();
    await expect(bt.historyItems).toHaveCount(2);
    await expect(bt.historyItem(2).locator('.bt-hist-sym')).toHaveText('MBB');
    await expect(bt.historyItems.first().locator('.bt-hist-sym')).toHaveText('MBB');
  });
});

// =====================================================================================================
test.describe('Kết quả — tổng quan & mục lục', () => {
  test('TC_BACKTEST_57: Thẻ đầu trang — mã + tên chiến lược, dòng Lượt/kỳ/giờ chạy, 4 thẻ số, hàng tab 4 mục', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    await expect(bt.runSymbol).toHaveText('MBB');
    await expect(bt.runStrategy).toHaveText('Chandelier Exit');
    await expect(bt.runRange).toHaveText(/^Lượt #1 · 15\/10\/2023 – 15\/10\/2026 · chạy lúc \d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/);
    await expect(bt.kpis.locator('.bt-kpi-k')).toHaveText(['Tổng lãi lỗ', 'Sụt giảm vốn sâu nhất', 'Tỷ lệ thắng', 'Lãi lỗ đậm nhất']);
    await expect(bt.kpi('Tổng lãi lỗ').locator('.bt-kpi-v')).toHaveText('+38.15%');
    await expect(bt.kpi('Tổng lãi lỗ').locator('.bt-kpi-chip')).toHaveText(/^Mua và nắm giữ [+−]?\d[\d,]*\.\d{2}%$/);
    await expect(bt.kpi('Sụt giảm vốn sâu nhất').locator('.bt-kpi-v')).toHaveText('−16.50%');
    await expect(bt.kpi('Sụt giảm vốn sâu nhất').locator('.bt-kpi-chip')).toHaveText(/^Mua và nắm giữ −\d[\d,]*\.\d{2}%$/);
    await expect(bt.kpi('Tỷ lệ thắng').locator('.bt-kpi-v')).toHaveText('60.00%');
    await expect(bt.kpi('Tỷ lệ thắng').locator('.bt-kpi-chip')).toHaveText('6/10 lệnh');
    await expect(bt.kpi('Lãi lỗ đậm nhất').locator('.bt-kpi-two > span:not(.bt-kpi-sep)')).toHaveText([PCT, PCT]);
    await expect(bt.tocItems).toHaveText(['1Lãi lỗ', '2Rủi ro', '3Tỷ lệ thắng', '4Chi tiết giao dịch']);
    await expect(bt.placeholder).toHaveClass(/bt-ph-overlay/);
  });

  test('TC_BACKTEST_58: Màu số lãi/lỗ — lãi màu xanh (up), lỗ màu đỏ (down)', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    await expect(bt.kpi('Tổng lãi lỗ').locator('.bt-kpi-v')).toHaveClass(/up/);
    await expect(bt.kpi('Sụt giảm vốn sâu nhất').locator('.bt-kpi-v')).toHaveClass(/down/);
    const hits = bt.kpi('Lãi lỗ đậm nhất').locator('.bt-kpi-two > span:not(.bt-kpi-sep)');
    await expect(hits.first()).toHaveClass(/up/);
    await expect(hits.first()).toHaveText(PCT);
    await expect(hits.last()).toHaveClass(/down/);
  });

  test('TC_BACKTEST_59: Bấm tab mục lục → cuộn tới mục đó, tab sáng lên', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    await expect(bt.tocItem('Lãi lỗ')).toHaveClass(/\bon\b/);
    await expect(bt.tocItem('Lãi lỗ')).toHaveAttribute('aria-current', 'true');
    await bt.tocItem('Chi tiết giao dịch').click();
    await expect(bt.tocItem('Chi tiết giao dịch')).toHaveClass(/\bon\b/, { timeout: 10000 });
    await expect(bt.tocItem('Lãi lỗ')).not.toHaveClass(/\bon\b/);
    await expect.poll(() => bt.resultScrollTop()).toBeGreaterThan(0);
    await bt.tocItem('Lãi lỗ').click();
    await expect(bt.tocItem('Lãi lỗ')).toHaveClass(/\bon\b/, { timeout: 10000 });
  });

  test('TC_BACKTEST_60: 4 thẻ số chỉ để đọc — bấm không cuộn, không đổi mục (từ 21/10/2026)', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    for (const card of ['Sụt giảm vốn sâu nhất', 'Tỷ lệ thắng', 'Lãi lỗ đậm nhất', 'Tổng lãi lỗ']) {
      await bt.kpi(card).click();
      await page.waitForTimeout(600);
      await expect(bt.tocItem('Lãi lỗ')).toHaveClass(/\bon\b/);
      expect(await bt.resultScrollTop()).toBe(0);
    }
    // Không có dấu "›" dẫn đi, không nhận focus bàn phím
    await expect(bt.kpis.filter({ hasText: '›' })).toHaveCount(0);
    expect(await bt.kpis.first().getAttribute('tabindex')).toBeNull();
  });

  // TC_BACKTEST_61 (bấm số lãi trong ô "Lãi lỗ đậm nhất" để mở biểu đồ tới deal) đã xoá: thẻ số chỉ để đọc từ 21/10/2026.

  test('TC_BACKTEST_62: Lượt 1 chiến lược — không có ô lọc chiến lược, không có bảng so sánh, không có hộp chú thích thẻ số', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    await expect(bt.strategyFilter).toHaveCount(0);
    await expect(bt.resultTable).toHaveCount(0);
    await expect(bt.tableViewToggle).toHaveCount(0);
    await expect(bt.section('bt-sec-lailo')).toContainText('Lãi lỗ theo tháng');
    await expect(bt.kpis.locator('.bt-kpi-tip')).toHaveCount(0);
  });

  test('TC_BACKTEST_63: Đổi sang lượt khác → kết quả cuộn về đầu, bỏ bộ lọc chiến lược', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb', 'ctd4'] });
    await bt.openHistory(1);
    await bt.strategyFilter.selectOption({ index: 2 });
    await bt.tocItem('Chi tiết giao dịch').click();
    await expect.poll(() => bt.resultScrollTop()).toBeGreaterThan(0);
    await bt.openHistory(2);
    await expect.poll(() => bt.resultScrollTop()).toBe(0);
    await bt.openHistory(1);
    await expect(bt.strategyFilter).toHaveValue('');
  });
});

// =====================================================================================================
test.describe('Kết quả — lượt nhiều chiến lược', () => {
  test('TC_BACKTEST_64: Bảng so sánh — đủ cột, mỗi chiến lược 1 dòng, mặc định xếp Tổng lãi lỗ giảm dần', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    await expect(bt.resultTable.locator('thead th')).toHaveText([
      /^\s*Chiến lược$/, /^\s*Vốn$/, /^\s*Tổng lãi lỗ\s*▼$/, /^\s*Mua và nắm giữ$/, /^\s*Sụt giảm vốn sâu nhất$/, /^\s*Tỷ lệ thắng$/,
      /^\s*Lãi\/Lỗ$/, /^\s*Deal$/, /^\s*Lệnh$/, /^\s*Lãi lỗ mỗi năm$/,
    ]);
    await expect(bt.resultRows).toHaveCount(4);
    // Lượt mẫu chụp 15/10/2026 nên chiến lược 1 còn mang tên cũ "Mẫu KFSP" (tên lưu trong lượt, không đổi theo bản mới)
    await expect(bt.resultRows.locator('td:first-child')).toHaveText([
      /4\.\s*RSI quá bán, quá mua/, /2\.\s*Đường trung bình nhanh cắt đường trung bình chậm/, /3\.\s*Giá cắt đường trung bình/, /1\.\s*Mẫu KFSP/,
    ]);
    await expect(bt.resultRows.first().locator('td').nth(1)).toHaveText('100.0 tr');
    await expect(bt.resultRows.first().locator('td').nth(1)).toHaveAttribute('title', /100,000,000/);
    await expect(bt.resultRows.first().locator('td').nth(5)).toHaveText(/\d+\.\d{2}%\s*\d+\/\d+ lệnh/);
    await expect(bt.resultRows.first().locator('td').nth(6)).toHaveText(/\d+\.\d{2} lần/);
  });

  test('TC_BACKTEST_65: Bấm tiêu đề cột → sắp xếp theo cột đó, bấm lại đảo chiều', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    const firstNames = () => bt.resultRows.locator('td:first-child').allTextContents();
    await bt.resultHeaderCell('Chiến lược').click();
    await expect(bt.resultHeaderCell('Chiến lược')).toHaveText(/▲/);
    expect((await firstNames()).map((t) => t.trim().slice(0, 2))).toEqual(['1.', '2.', '3.', '4.']);
    await bt.resultHeaderCell('Chiến lược').click();
    await expect(bt.resultHeaderCell('Chiến lược')).toHaveText(/▼/);
    expect((await firstNames()).map((t) => t.trim().slice(0, 2))).toEqual(['4.', '3.', '2.', '1.']);
    await bt.resultHeaderCell('Lệnh').click();
    const counts = (await bt.resultRows.locator('td:nth-child(9)').allTextContents()).map(Number);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    await expect(bt.resultHeaderCell('Tổng lãi lỗ')).not.toHaveText(/[▲▼]/);
  });

  test('TC_BACKTEST_66: Rê chuột tiêu đề "Lãi/Lỗ" → hiện chú thích cột', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    await bt.resultHeaderCell('Lãi/Lỗ').hover();
    await expect(bt.floatTip).toHaveText('Lãi trung bình / lỗ trung bình của các lệnh đã bán.');
    await expect(bt.floatTip).toBeVisible();
    await bt.resultHeaderCell('Vốn').hover();
    await expect(bt.floatTip).toHaveCount(0);
  });

  test('TC_BACKTEST_67: Bấm 1 dòng bảng → lọc theo chiến lược đó; chọn "Tất cả chiến lược" → bỏ lọc', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    await expect(bt.strategyFilter.locator('option')).toHaveText([
      'Tất cả chiến lược', 'Mẫu KFSP', 'Đường trung bình nhanh cắt đường trung bình chậm', 'Giá cắt đường trung bình', 'RSI quá bán, quá mua',
    ]);
    const allTotal = await bt.kpi('Tổng lãi lỗ').locator('.bt-kpi-v').textContent();
    await bt.resultRows.filter({ hasText: 'RSI quá bán, quá mua' }).click();
    await expect(bt.strategyFilter).toHaveClass(/\bon\b/);
    await expect(bt.strategyFilter.locator('option:checked')).toHaveText('RSI quá bán, quá mua');
    await expect(bt.resultTable).toHaveCount(0); // còn 1 chiến lược thì không còn bảng so sánh
    await expect(bt.kpi('Tổng lãi lỗ').locator('.bt-kpi-v')).toHaveText('+144.16%');
    await bt.strategyFilter.selectOption('');
    await expect(bt.strategyFilter).not.toHaveClass(/\bon\b/);
    await expect(bt.kpi('Tổng lãi lỗ').locator('.bt-kpi-v')).toHaveText(allTotal!);
    await expect(bt.resultRows).toHaveCount(4);
  });

  test('TC_BACKTEST_68: Nút Biểu đồ / Bảng ở tiêu đề mục Lãi lỗ — mặc định Bảng, đổi được, nhớ lựa chọn sau F5', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    const btn = (n: 'Biểu đồ' | 'Bảng') => bt.tableViewToggle.getByRole('button', { name: n });
    await expect(btn('Bảng')).toHaveAttribute('aria-pressed', 'true');
    await btn('Biểu đồ').click();
    await expect(btn('Biểu đồ')).toHaveAttribute('aria-pressed', 'true');
    await expect(bt.resultTable).toHaveCount(0);
    await expect(bt.section('bt-sec-lailo')).toContainText('Tổng lãi lỗ và Mua và nắm giữ');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bt_chart_view') || '{}')['bang-ket-qua'])).toBe('chart');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await bt.openHistory(1);
    await expect(bt.section('bt-sec-lailo')).toContainText('Tổng lãi lỗ và Mua và nắm giữ');
    await btn('Bảng').click();
    await expect(bt.resultRows).toHaveCount(4);
  });

  test('TC_BACKTEST_69: Thẻ số khi nhiều chiến lược — rê chuột "Sụt giảm" / "Lãi lỗ đậm nhất" hiện hộp ghi chiến lược của con số', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    await expect(bt.kpi('Tỷ lệ thắng').locator('.bt-kpi-chip')).toHaveText(/^\d+\/\d+ lệnh$/);
    const dd = bt.kpi('Sụt giảm vốn sâu nhất');
    await expect(dd).toHaveClass(/has-tip/);
    await expect(dd.locator('.bt-kpi-tip')).toBeHidden();
    await dd.hover();
    await expect(dd.locator('.bt-kpi-tip')).toBeVisible();
    await expect(dd.locator('.bt-kpi-tip-h')).toHaveText('Sụt giảm vốn sâu nhất');
    await expect(dd.locator('.bt-kpi-tip-r')).toHaveText([/^\d\. .+−\d+\.\d{2}%$/]);
    const order = bt.kpi('Lãi lỗ đậm nhất');
    await order.hover();
    await expect(order.locator('.bt-kpi-tip-h')).toHaveText('Lãi lỗ đậm nhất');
    await expect(order.locator('.bt-kpi-tip-r')).toHaveText([/^\d\. .+\+\d+\.\d{2}%$/, /^\d\. .+−\d+\.\d{2}%$/]);
  });

  test('TC_BACKTEST_70: Cột "Lãi lỗ mỗi năm" không có khi kỳ chạy chỉ 1 năm', async ({ page }) => {
    const bt = await openBt(page);
    await bt.periodSelect.selectOption('1');
    await bt.addStrategies('Kênh SSL');
    await bt.runToResult();
    await expect(bt.resultRows).toHaveCount(2);
    await expect(bt.resultHeaderCell('Lãi lỗ mỗi năm')).toHaveCount(0);
    await expect(bt.resultTable.locator('thead th')).toHaveCount(9);
  });
});

// =====================================================================================================
test.describe('Chi tiết giao dịch', () => {
  test('TC_BACKTEST_71: Mặc định mở Replay; chuyển "Biểu đồ" thì hiện nút Thiết lập biểu đồ', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    await expect(bt.chartViewBtns).toHaveText(['Replay', 'Biểu đồ'], { timeout: 30000 });
    await expect(bt.chartViewBtn('Replay')).toHaveAttribute('aria-pressed', 'true');
    await expect(bt.replay).toBeVisible();
    await expect(bt.chartWho).toHaveText('MBB');
    await expect(bt.chartSettingsBtn).toHaveCount(0);
    await bt.chartViewBtn('Biểu đồ').click();
    await expect(bt.chartViewBtn('Biểu đồ')).toHaveAttribute('aria-pressed', 'true');
    await expect(bt.replay).toHaveCount(0);
    await expect(bt.chartSettingsBtn).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xem hết kỳ' })).toHaveCount(0);
  });

  test('TC_BACKTEST_72: Thiết lập biểu đồ — đổi TradingView ↔ Biểu đồ nến, ô "Chỉ báo dưới khung giá" phụ thuộc ô chỉ báo', async ({ page }) => {
    // Cần chiến lược có đường chỉ báo (Mẫu KFSP — tên cũ của "Chiến lược KFSP" trong lượt mẫu chụp 15/10/2026: MA10/20/50)
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    await bt.strategyFilter.selectOption({ label: 'Mẫu KFSP' });
    await expect(bt.chartWho).toContainText('Mẫu KFSP', { timeout: 30000 });
    await bt.chartViewBtn('Biểu đồ').click();
    await bt.chartSettingsBtn.click();
    const pop = bt.chartSettingsPop;
    await expect(pop).toBeVisible();
    const kind = pop.getByRole('group', { name: 'Loại biểu đồ' });
    await expect(kind.getByRole('button', { name: 'TradingView' })).toHaveAttribute('aria-pressed', 'true');
    await expect(pop.getByLabel('Điểm mua bán')).toBeChecked();
    await expect(pop.getByLabel('Đường nối lệnh, màu theo lãi lỗ')).toBeChecked();
    const ind = pop.getByLabel('Đường chỉ báo của chiến lược');
    const lower = pop.getByLabel('Chỉ báo dưới khung giá');
    await expect(ind).toBeChecked();
    await expect(lower).not.toBeChecked();
    await ind.uncheck();
    await expect(lower).toBeDisabled();
    await ind.check();
    await expect(lower).toBeEnabled();
    await kind.getByRole('button', { name: 'Biểu đồ nến' }).click();
    await expect(kind.getByRole('button', { name: 'Biểu đồ nến' })).toHaveAttribute('aria-pressed', 'true');
    await expect(pop.getByLabel('Điểm mua bán')).toHaveCount(0);
    // Bấm ra ngoài thì đóng
    await bt.chartWho.click();
    await expect(pop).toBeHidden();
  });

  test('TC_BACKTEST_73: Thanh Replay — nút chạy/dừng, 5 tốc độ, Toàn cảnh/Tập trung, Đường giá/Biểu đồ nến, thiết lập chiếu lại', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    const rp = bt.replay;
    await expect(rp).toBeVisible({ timeout: 30000 });
    const speed = rp.getByRole('combobox', { name: 'Tốc độ chiếu lại' });
    await expect(speed.locator('option')).toHaveText(['1 giây = 1 ngày', '1 giây = 1 tuần', '1 giây = 1 tháng', '1 giây = 1 quý', '1 giây = 1 năm']);
    await expect(speed).toHaveValue('month');
    await expect(rp.locator('.rp-date')).toHaveText(DATE);
    const play = rp.locator('.rp-play');
    await expect(play).toHaveAttribute('title', 'Chiếu lại');
    await play.click();
    await expect(play).toHaveAttribute('title', 'Dừng');
    await expect(play).toHaveText('❚❚');
    await play.click();
    await expect(play).toHaveText('▶');
    const view = rp.getByRole('group', { name: 'Khung nhìn khi chiếu lại' });
    await expect(view.getByRole('button', { name: 'Toàn cảnh' })).toHaveAttribute('aria-pressed', 'true');
    await view.getByRole('button', { name: 'Tập trung' }).click();
    await expect(view.getByRole('button', { name: 'Tập trung' })).toHaveAttribute('aria-pressed', 'true');
    const kind = rp.getByRole('group', { name: 'Loại biểu đồ khi chiếu lại' });
    await kind.getByRole('button', { name: 'Biểu đồ nến' }).click();
    await expect(kind.getByRole('button', { name: 'Biểu đồ nến' })).toHaveAttribute('aria-pressed', 'true');
    await rp.getByRole('button', { name: 'Thiết lập chiếu lại' }).click();
    const setup = page.getByRole('dialog', { name: 'Thiết lập chiếu lại' });
    await expect(setup.getByLabel('Tốc độ đều')).toBeChecked();
    await expect(setup).toContainText('Chậm lại khi có deal (chậm 4 lần)');
  });

  test('TC_BACKTEST_74: Thanh kéo Replay — kéo tới phiên khác thì ngày đổi theo', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    const rp = bt.replay;
    const end = await rp.locator('.rp-date').textContent();
    await rp.locator('.rp-scrub').evaluate((el: HTMLInputElement) => { el.value = '10'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(rp.locator('.rp-date')).not.toHaveText(end!);
    await rp.getByTitle('Chiếu lại từ đầu').click();
    await expect(rp.locator('.rp-date')).toHaveText(DATE);
  });

  test('TC_BACKTEST_75: Bảng deal — số deal/lệnh, sắp xếp, mở 1 deal / mở tất cả; không còn cột Ghi chú', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    await expect(bt.dealCount).toHaveText(/^\d+ deal, 10 lệnh$/);
    const nDeals = Number((await bt.dealCount.textContent())!.split(' ')[0]);
    await expect(bt.dealRows).toHaveCount(nDeals);
    // Cột Ghi chú (lý do mua/bán) bỏ ngày 16/10/2026; ô đầu tiêu đề chứa nút "Mở tất cả"
    await expect(bt.dealList.locator('thead th')).toHaveText(['Deal', 'Ngày', 'Giá', 'KL', 'Lãi lỗ', 'Số phiên']);
    await expect(bt.dealSort).toHaveValue('newest');
    const firstNewest = await bt.dealRows.first().locator('.dl-code').textContent();
    await bt.dealSort.selectOption('oldest');
    await expect(bt.dealRows.first().locator('.dl-code')).toHaveText(/^Deal 1(Đang mở)?$/);
    await bt.dealSort.selectOption('newest');
    await expect(bt.dealRows.first().locator('.dl-code')).toHaveText(firstNewest!);
    await expect(bt.dealLines).toHaveCount(0);
    await bt.dealRows.first().click();
    await expect(bt.dealRows.first()).toHaveClass(/is-open/);
    await expect(bt.dealLines.first()).toBeVisible();
    await bt.dealList.getByRole('button', { name: 'Mở tất cả' }).click();
    expect(await bt.dealLines.count()).toBeGreaterThanOrEqual(nDeals * 2);
    await bt.dealList.getByRole('button', { name: 'Thu gọn tất cả' }).click();
    await expect(bt.dealLines).toHaveCount(0);
  });

  test('TC_BACKTEST_76: Bảng deal — sắp "Lãi nhất", ô "Hiện cảnh báo bán" thêm dòng cảnh báo; deal chưa bán có nhãn "Đang mở"', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'] });
    await bt.openHistory(1);
    await bt.dealSort.selectOption('profit');
    const pnls = await bt.dealRows.locator('td:nth-child(5) > div:first-child').allTextContents();
    const num = (s: string) => Number(s.replace(/[^\d−+-]/g, '').replace('−', '-'));
    expect(pnls.map(num)).toEqual([...pnls.map(num)].sort((a, b) => b - a));
    await bt.dealList.getByRole('button', { name: 'Mở tất cả' }).click();
    const before = await bt.dealLines.count();
    await bt.dealList.getByLabel('Hiện cảnh báo bán').check();
    await expect.poll(() => bt.dealLines.count()).toBeGreaterThanOrEqual(before);
    test.info().annotations.push({ type: 'Hiện cảnh báo bán', description: `Số dòng con: ${before} → ${await bt.dealLines.count()}` });
    // Deal chưa bán (nếu có) mang nhãn "Đang mở" và khoảng ngày "… tới nay"
    const open = bt.dealRows.filter({ has: page.locator('.dl-tag', { hasText: 'Đang mở' }) });
    for (let i = 0; i < await open.count(); i++) await expect(open.nth(i)).toContainText('tới nay');
  });

  test('TC_BACKTEST_77: Lượt nhiều chiến lược — bảng deal có ô chọn chiến lược và cột Chiến lược', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    const sel = bt.dealList.locator('select.dl-select').first();
    await expect(sel.locator('option').first()).toHaveText(/^Tất cả chiến lược \(\d+ deal\)$/);
    await expect(bt.dealList.locator('thead th')).toHaveText(['Deal', 'Chiến lược', 'Ngày', 'Giá', 'KL', 'Lãi lỗ', 'Số phiên']);
    await sel.selectOption({ label: 'RSI quá bán, quá mua' });
    await expect(bt.dealCount).toHaveText('6 deal, 6 lệnh');
    await expect(bt.chartWho).toContainText('CTD · ');
  });
});

// =====================================================================================================
test.describe('Thu gọn cột thiết lập', () => {
  test('TC_BACKTEST_78: Thu gọn → còn cột nút biểu tượng; mở lại; trạng thái nhớ sau F5', async ({ page }) => {
    const bt = await openBt(page);
    await bt.collapseBtn.click();
    await expect(bt.sidebar).toBeHidden();
    await expect(bt.rail).toBeVisible();
    await expect(bt.rail.locator('.bt-rail-btn')).toHaveCount(6);
    for (const n of ['Mã', 'Chiến lược chạy', 'Thời gian chạy', 'Số tiền mỗi lần mua', 'Lịch sử các lần chạy'] as const) {
      await expect(bt.railBtn(n)).toHaveAttribute('data-tip', n);
    }
    expect(await page.evaluate(() => localStorage.getItem('bt_sidebar_collapsed'))).toBe('1');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(bt.rail).toBeVisible({ timeout: 30000 });
    await bt.expandBtn.click();
    await expect(bt.sidebar).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('bt_sidebar_collapsed'))).toBe('0');
  });

  test('TC_BACKTEST_79: Bấm nút biểu tượng 1 thiết lập → mở cột thiết lập và nháy viền ô đó', async ({ page }) => {
    const bt = await openBt(page, { sidebarCollapsed: '1' });
    await expect(bt.rail).toBeVisible();
    await bt.railBtn('Số tiền mỗi lần mua').click();
    await expect(bt.sidebar).toBeVisible();
    await expect(bt.settingCell('Số tiền mỗi lần mua')).toHaveClass(/bt-tl-flash/);
    await expect(bt.settingCell('Số tiền mỗi lần mua')).not.toHaveClass(/bt-tl-flash/, { timeout: 3000 });
  });

  test('TC_BACKTEST_80: Nút "Lịch sử các lần chạy" ở cột thu gọn → mở cột thiết lập, nháy viền tiêu đề thẻ Lịch sử', async ({ page }) => {
    const bt = await openBt(page, { seeds: ['mbb'], sidebarCollapsed: '1' });
    await bt.railBtn('Lịch sử các lần chạy').click();
    await expect(bt.sidebar).toBeVisible();
    await expect(bt.historyHeader).toHaveClass(/bt-tl-flash/);
    await expect(bt.historyItems).toBeVisible();
    await expect(bt.historyHeader).not.toHaveClass(/bt-tl-flash/, { timeout: 3000 });
  });
});

// =====================================================================================================
test.describe('Chung', () => {
  test('TC_BACKTEST_81: Đọc lịch sử thật của tài khoản (chỉ đọc) — danh sách và chi tiết lượt mở được', async ({ page }) => {
    const bt = await openBt(page, { history: 'real' });
    // Máy chủ thật chậm khi chạy song song: chờ danh sách dựng xong rồi mới đếm
    await expect.poll(() => bt.historyItems.count(), { timeout: 20000 }).toBeGreaterThan(0).catch(() => undefined);
    await expect(bt.toastWith('Chưa lấy được lịch sử các lần chạy')).toHaveCount(0);
    const n = await bt.historyItems.count();
    test.skip(n === 0, 'Tài khoản chưa có lượt chạy nào trên máy chủ');
    await expect(bt.historyCount).toHaveText(`${n}/100`);
    await bt.openHistory(n); // lượt mới nhất
    await expect(bt.kpis).toHaveCount(4);
    expect(bt.blockedBacktestWrites).toEqual([]);
  });

  test('TC_BACKTEST_83: Máy chủ lưu lượt trả lời ngay lập tức → lượt vừa chạy vẫn được mở ra (bug cũ đã sửa trên preprod)', async ({ page }) => {
    const bt = await openBt(page);
    // Máy chủ trả lời POST ngay lập tức (cũng là chuyện xảy ra khi người dùng chuyển sang tab khác lúc đang chạy:
    // trình duyệt dừng requestAnimationFrame của tab ẩn, còn POST vẫn chạy xong).
    bt.server.saveDelayMs = 0;
    await bt.periodSelect.selectOption('1');
    await bt.runAndWait();
    await expect(bt.historyItems).toHaveCount(1);
    // Trước 19/10/2026: openRun("tmp-1") đặt viewedRunId sau khi adoptServerId đã đổi id → kết quả KHÔNG mở. Nay
    // adoptServerId đổi luôn viewedRunId/renderRunId nên kết quả mở bình thường.
    await expect(bt.resultHeader).toBeVisible({ timeout: 15000 });
    await expect(bt.resultHeader).toContainText('Lượt #1');
    await expect(bt.historyItem(1)).toHaveClass(/\bon\b/);
    await expect(bt.kpis).toHaveCount(4);
  });

  test('TC_BACKTEST_82: Màn hình hẹp 1280px — không tràn ngang, đủ cột thiết lập và nút Chạy', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const bt = await openBt(page, { seeds: ['ctd4'] });
    await bt.openHistory(1);
    await expect(bt.runBtn).toBeInViewport();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
