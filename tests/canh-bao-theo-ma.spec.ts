import { test, expect } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { NotificationCenterPage, AlertPerStockBox, stockAlert, StockAlert } from '../pages/NotificationCenterPage';

/**
 * Hộp "Tạo cảnh báo cho mã" / "Cập nhật cảnh báo cho mã" (`multiLayoutChart/TabAlert/alertPerStock.vue`, dựng trong
 * TheContainer) — testcases/canh-bao-theo-ma.md. Mở từ Trung tâm thông báo > Cảnh báo > Cảnh báo theo mã.
 * Chạy trên prev2 (backend PRODUCTION): mọi API `/api/stocks/user-alert/*` đi qua `FakeNotifyServer`.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

const GROUP_TITLES = ['Mức giá', 'Biến động', 'Khối lượng', 'Đường trung bình giá'];
const LABELS = [
  'Giá tăng lên chạm một mức giá cố định', 'Giá giảm xuống một mức giá cố định',
  'Giá tăng liên tục nhiều phiên', 'Giá giảm liên tục nhiều phiên',
  'Khối lượng vượt KLTB 10 ngày', 'Khối lượng vượt KLTB 20 ngày', 'Khối lượng vượt KLTB 50 ngày',
  'Giá cắt lên đường SMA10', 'Giá cắt lên đường SMA20', 'Giá cắt lên đường SMA50', 'Giá cắt lên đường SMA100', 'Giá cắt lên đường SMA200',
  'Giá cắt xuống đường SMA10', 'Giá cắt xuống đường SMA20', 'Giá cắt xuống đường SMA50', 'Giá cắt xuống đường SMA100', 'Giá cắt xuống đường SMA200',
];

async function openCenter(p: NotificationCenterPage, alerts: StockAlert[] = []) {
  p.server.alerts = alerts;
  await p.open({ path: '/trung-tam-thong-bao?view=alert' });
  await expect(p.addAlertBtn).toBeVisible({ timeout: 30_000 });
  await expect(p.panel).not.toContainText('Đang tải', { timeout: 20_000 });
}
async function openCreate(p: NotificationCenterPage, box: AlertPerStockBox, alerts: StockAlert[] = []) {
  await openCenter(p, alerts);
  await p.addAlertBtn.click();
  await expect(box.modal).toBeVisible();
}
async function pickCode(box: AlertPerStockBox, code: string) {
  await box.code.fill(code);
  await box.suggestions.filter({ hasText: new RegExp(`^\\s*${code}\\b`) }).first().click();
  await expect(box.code).toHaveValue(code);
}
const updates = (p: NotificationCenterPage) => p.server.writesTo(/user-alert\/update\/v2$/);
type Body = { user_alerts: Record<string, unknown>[]; old_user_alerts: Record<string, unknown>[] };

test.describe('Hộp tạo cảnh báo', () => {
  test('TC_CBM_01: Giao diện hộp tạo — tiêu đề, ô "Mã CK" trống, 4 nhóm điều kiện (17 dòng) đều bỏ chọn, ô giá trị/tần suất bị khoá; nút Đóng, Lưu', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await expect(box.title).toHaveText('Tạo cảnh báo cho mã');
    await expect(box.modal).toContainText('Mã chứng khoán:');
    await expect(box.code).toHaveValue('');
    await expect(box.code).toBeEnabled();
    const heads = await box.groups.evaluateAll((gs) => gs.map((g) => Array.from(g.firstElementChild!.children).map((c) => (c as HTMLElement).innerText.trim())));
    expect(heads).toEqual([
      ['Chọn', 'Mức giá', 'Giá trị', 'Tần suất'], ['Chọn', 'Biến động', 'Giá trị', 'Tần suất'],
      ['Chọn', 'Khối lượng', 'Giá trị', 'Tần suất'], ['Chọn', 'Đường trung bình giá', '', 'Tần suất'],
    ]);
    expect(heads.map((h) => h[1])).toEqual(GROUP_TITLES);
    await expect(box.allRows).toHaveCount(17);
    expect((await box.allRows.locator('.col-md-4.justify-content-start').allInnerTexts()).map((t) => t.trim())).toEqual(LABELS);
    for (const l of LABELS) await expect(box.cb(l), l).not.toBeChecked();
    await expect(box.allRows.locator('input[type="number"]:enabled, select:enabled')).toHaveCount(0);
    await expect(box.allRows.filter({ has: page.locator('.off') }).or(box.modal.locator('.aps-row.off'))).toHaveCount(17);
    await expect(box.close).toBeVisible();
    await expect(box.save).toBeEnabled();
  });

  test('TC_CBM_02: Tuỳ chọn — Tần suất "1 Lần"/"Luôn luôn"; Biến động theo số phiên; Khối lượng theo % KLTB; mặc định 2 phiên / 120%', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    const freq = box.selects(box.condRows('Giá cắt lên đường SMA20')).last();
    await expect(freq.locator('option')).toHaveText(['1 Lần', 'Luôn luôn']);
    const sessions = box.selects(box.condRows('Giá tăng liên tục nhiều phiên')).first();
    expect((await sessions.locator('option').allInnerTexts())[0].trim()).toBe('2 phiên');
    await expect(sessions.locator('option')).toContainText(['2 phiên', '3 phiên']);
    const vol = box.selects(box.condRows('Khối lượng vượt KLTB 20 ngày')).first();
    expect((await vol.locator('option').allInnerTexts()).slice(0, 3).map((t) => t.trim())).toEqual(['120%', '130%', '150%']);
  });

  test('TC_CBM_03: Gõ mã → gợi ý tối đa 5 mã có chứa chữ đã gõ (mã + tên công ty); ↓ + Enter chọn mã đang trỏ; bấm gợi ý chọn mã; tên công ty + giá hiện cạnh ô', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await box.code.fill('hp');
    await expect(box.suggestions.first()).toBeVisible();
    const codes = await box.suggestions.locator('.search-stockcode_item--code').allInnerTexts();
    expect(codes.length).toBeGreaterThan(1);
    expect(codes.length).toBeLessThanOrEqual(5);
    for (const c of codes) expect(c.trim()).toContain('HP');
    await expect(box.suggestions.first()).toHaveClass(/active/);
    await box.code.press('ArrowDown');
    await expect(box.suggestions.nth(1)).toHaveClass(/active/);
    await box.code.press('Enter');
    await expect(box.code).toHaveValue(codes[1].trim());
    await expect(box.suggestions).toHaveCount(0);
    await pickCode(box, 'HPG');
    await expect(box.company).toContainText('Hòa Phát');
    await expect(box.modal.locator('.col-md-7 p.h6')).toHaveText(/^\s*[\d,]+\.\d{2}\s*$/, { timeout: 15_000 });
  });

  test('TC_CBM_04: Có mã → hai ô "Mức giá" điền sẵn giá hiện tại của mã (đồng)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await pickCode(box, 'HPG');
    const last = await expect.poll(() => p.store<number>('return state.data_eod.HPG && Number(state.data_eod.HPG.lastprice)'), { timeout: 15_000 }).toBeGreaterThan(0)
      .then(() => p.store<number>('return Number(state.data_eod.HPG.lastprice)'));
    for (const l of ['Giá tăng lên chạm', 'Giá giảm xuống']) await expect(box.valueInput(box.condRows(l).first())).toHaveValue(String(last));
  });

  test('TC_CBM_05: Lưu khi chưa nhập mã → toast "Bạn cần nhập mã chứng khoán", không gọi API; Lưu khi chưa chọn điều kiện → chỉ đóng hộp, không gọi API, bảng không đọc lại', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await box.cb('Giá cắt lên đường SMA20').check();
    await box.save.click();
    await expect(p.toastError.filter({ hasText: 'Bạn cần nhập mã chứng khoán' }).first()).toBeVisible();
    await expect(box.modal).toBeVisible();
    await box.close.click();
    await p.addAlertBtn.click();
    await pickCode(box, 'VNM');
    const reads = p.server.reads.filter((r) => /get-all/.test(r)).length;
    await box.save.click();
    await expect(box.modal).toBeHidden();
    await page.waitForTimeout(800);
    expect(updates(p)).toHaveLength(0);
    expect(p.server.reads.filter((r) => /get-all/.test(r)).length).toBe(reads);
  });

  test('TC_CBM_06: Tạo 3 điều kiện (giá tăng chạm 30,000 "Luôn luôn", tăng 3 phiên liên tục, cắt lên SMA20) → POST update/v2 đúng 3 điều kiện + old_user_alerts rỗng; hộp đóng (không toast — main.js tắt $toast.success), bảng có 3 hàng mới', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await pickCode(box, 'HPG');
    const up = box.condRows('Giá tăng lên chạm').first();
    await box.cb('Giá tăng lên chạm một mức giá cố định').check();
    await box.valueInput(up).fill('30000');
    await box.selects(up).last().selectOption({ label: 'Luôn luôn' });
    await box.cb('Giá tăng liên tục nhiều phiên').check();
    await box.selects(box.condRows('Giá tăng liên tục nhiều phiên')).first().selectOption({ label: '3 phiên' });
    await box.cb('Giá cắt lên đường SMA20').check();
    await box.save.click();
    await expect(box.modal).toBeHidden();
    // Code gọi $toast.success("Lưu cảnh báo thành công") nhưng main.js tắt mọi toast thành công (yêu cầu 12/10/2026)
    await expect(page.locator('.Vue-Toastification__toast')).toHaveCount(0);
    const body = updates(p)[0].body as Body;
    expect(body.old_user_alerts).toEqual([]);
    expect(body.user_alerts.map((a) => [a.stockcode, a.condition_key, String(a.condition_value), a.frequency, a.is_active])).toEqual([
      ['HPG', 'COND_PRICE_UP', '30000', 1, 1],
      ['HPG', 'COND_PCHANGE_INC', '3', 0, 1],
      ['HPG', 'COND_SMA_SMA20_UP', 'null', 0, 1],
    ]);
    await expect(p.rows).toHaveCount(3);
    await expect(p.row('Giá tăng lên chạm mức giá 30,000')).toContainText('Luôn luôn');
  });

  const errors: [string, number, unknown, string][] = [
    ['422', 422, { error: 'Bạn đã đạt số cảnh báo tối đa' }, 'Bạn đã đạt số cảnh báo tối đa'],
    ['400', 400, { message: 'Giá trị không hợp lệ' }, 'Giá trị không hợp lệ'],
    ['500', 500, { message: 'x' }, 'Có lỗi xảy ra, vui lòng thử lại'],
  ];
  test('TC_CBM_07: Lưu lỗi — 422 hiện error của máy chủ, 400 hiện message, 500 hiện câu chung; hộp vẫn mở, lưu lại được', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await pickCode(box, 'VNM');
    await box.cb('Giá cắt lên đường SMA50').check();
    for (const [name, status, body, msg] of errors) {
      p.server.failures = [{ re: /user-alert\/update\/v2$/, status, body }];
      await box.save.click();
      await expect(p.toastError.filter({ hasText: msg }).first(), name).toBeVisible();
      await expect(box.modal, name).toBeVisible();
    }
    p.server.failures = [];
    await box.save.click();
    await expect(box.modal).toBeHidden();
    expect(updates(p)).toHaveLength(4);
  });

  test('TC_CBM_08: Bấm "Lưu" 3 lần liên tiếp → chỉ gửi 1 request (debounce 500ms)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await pickCode(box, 'VNM');
    await box.cb('Giá cắt lên đường SMA50').check();
    await box.save.click();
    await box.save.click({ force: true }).catch(() => {});
    await box.save.click({ force: true }).catch(() => {});
    await expect(box.modal).toBeHidden();
    await page.waitForTimeout(1000);
    expect(updates(p)).toHaveLength(1);
  });

  test('TC_CBM_09: Đóng hộp rồi mở lại "Thêm cảnh báo" → hộp trắng (không giữ mã, không giữ điều kiện đã chọn)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCreate(p, box);
    await pickCode(box, 'VNM');
    await box.cb('Giá cắt xuống đường SMA50').check();
    await box.close.click();
    await expect(box.modal).toBeHidden();
    await p.addAlertBtn.click();
    await expect(box.code).toHaveValue('');
    await expect(box.cb('Giá cắt xuống đường SMA50')).not.toBeChecked();
    expect(updates(p)).toHaveLength(0);
  });
});

test.describe('Hộp cập nhật cảnh báo', () => {
  const seed = () => [
    stockAlert('VNM', 'COND_PRICE_UP', 70000, { frequency: 1, id: 101 }),
    stockAlert('VNM', 'COND_PRICE_UP', 72000, { frequency: 0, id: 102 }),
    stockAlert('VNM', 'COND_PRICE_UP', 75000, { frequency: 1, id: 103 }),
    stockAlert('VNM', 'COND_SMA_SMA20_UP', null, { frequency: 0, id: 104 }),
    stockAlert('VNM', 'COND_PRICE_DOWN', 60000, { frequency: 1, active: 0, id: 105 }),
  ];

  test('TC_CBM_11: Sửa 1 điều kiện ở bảng → "Cập nhật cảnh báo cho mã", GET get-by-stockcode/v2?stockcode=VNM, ô mã khoá (không có icon tìm), chỉ đúng điều kiện đó được chọn với giá trị + tần suất của nó', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCenter(p, seed());
    await p.row('Giá tăng lên chạm mức giá 72,000').getByRole('button', { name: 'Sửa điều kiện này' }).click();
    await expect(box.title).toHaveText('Cập nhật cảnh báo cho mã');
    await expect(box.code).toHaveValue('VNM');
    await expect(box.code).toBeDisabled();
    await expect(box.modal.locator('.btn-search-stockcode svg')).toHaveCount(0);
    expect(p.server.reads.some((r) => /get-by-stockcode\/v2\?stockcode=VNM/.test(r))).toBe(true);
    const up = box.condRows('Giá tăng lên chạm').first();
    await expect(box.cb('Giá tăng lên chạm một mức giá cố định')).toBeChecked();
    await expect(box.valueInput(up)).toHaveValue('72000');
    await expect(box.selects(up).last()).toHaveValue('0');
    await expect(box.cb('Giá cắt lên đường SMA20')).not.toBeChecked();
    await expect(box.modal.locator('.aps-cb:checked')).toHaveCount(1);
  });

  test('TC_CBM_12: Đổi giá trị rồi Lưu → user_alerts = điều kiện mới, old_user_alerts = điều kiện cũ (khoá + giá trị cũ, không kèm id)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCenter(p, seed());
    await p.row('Giá tăng lên chạm mức giá 72,000').getByRole('button', { name: 'Sửa điều kiện này' }).click();
    const up = box.condRows('Giá tăng lên chạm').first();
    await expect(box.valueInput(up)).toHaveValue('72000');
    await box.valueInput(up).fill('73000');
    await box.valueInput(up).blur();
    await box.save.click();
    await expect(box.modal).toBeHidden();
    const body = updates(p)[0].body as Body;
    expect(body.user_alerts.map((a) => [a.condition_key, String(a.condition_value), a.frequency, a.stockcode])).toEqual([['COND_PRICE_UP', '73000', 0, 'VNM']]);
    expect(body.old_user_alerts.map((a) => [a.id, a.stockcode, a.condition_key, String(a.condition_value)])).toEqual([[undefined, 'VNM', 'COND_PRICE_UP', '72000']]);
    await expect(p.row('Giá tăng lên chạm mức giá 73,000')).toBeVisible();
    await expect(p.row('Giá tăng lên chạm mức giá 72,000')).toHaveCount(0);
  });

  test('TC_CBM_13: Bỏ chọn điều kiện rồi Lưu → user_alerts rỗng, old_user_alerts chứa bản ghi cũ → điều kiện bị gỡ', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCenter(p, seed());
    await p.row('Giá cắt lên đường SMA20').getByRole('button', { name: 'Sửa điều kiện này' }).click();
    await expect(box.cb('Giá cắt lên đường SMA20')).toBeChecked();
    await box.cb('Giá cắt lên đường SMA20').uncheck();
    await box.save.click();
    await expect(box.modal).toBeHidden();
    const body = updates(p)[0].body as Body;
    expect(body.user_alerts).toEqual([]);
    expect(body.old_user_alerts.map((a) => [a.stockcode, a.condition_key])).toEqual([['VNM', 'COND_SMA_SMA20_UP']]);
    await expect(p.row('SMA20')).toHaveCount(0);
  });

  test('TC_CBM_14: Sửa theo mã (Xem gộp theo mã) → nạp mọi điều kiện ĐANG BẬT; nhiều mức của 1 điều kiện thành nhiều dòng, "Luôn luôn" trước, giá cao trước; điều kiện đã tắt không nạp', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCenter(p, seed());
    await p.groupByCode.check();
    await p.row('VNM').getByRole('button', { name: 'Sửa điều kiện của mã' }).click();
    await expect(box.title).toHaveText('Cập nhật cảnh báo cho mã');
    await expect(box.modal.locator('.aps-cb:checked')).toHaveCount(4);
    // 3 dòng "giá tăng lên chạm": nhãn chỉ ở dòng đầu, các dòng sau nhãn rỗng
    const priceGroup = box.groups.nth(0).locator('.aps-row');
    await expect(priceGroup).toHaveCount(4);
    const vals = await priceGroup.evaluateAll((rs) => rs.slice(0, 3).map((r) => [(r.querySelector('input[type=number]') as HTMLInputElement).value,
      (r.querySelectorAll('select')[0] as HTMLSelectElement).value]));
    expect(vals).toEqual([['75000', '1'], ['70000', '1'], ['72000', '0']]);
    await expect(box.cb('Giá giảm xuống một mức giá cố định')).not.toBeChecked();
    await expect(box.cb('Giá cắt lên đường SMA20')).toBeChecked();
  });

  test('TC_CBM_15: Đọc cảnh báo của mã lỗi 500 → toast "Có lỗi xảy ra, vui lòng thử lại", hộp vẫn mở nhưng không điều kiện nào được chọn', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openCenter(p, seed());
    p.server.failures.push({ re: /get-by-stockcode\/v2$/, status: 500 });
    await p.row('Giá cắt lên đường SMA20').getByRole('button', { name: 'Sửa điều kiện này' }).click();
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(box.modal).toBeVisible();
    await expect(box.modal.locator('.aps-cb:checked')).toHaveCount(0);
  });
});
