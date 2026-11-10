import { test, expect, Page } from '@playwright/test';
import { PriceAlertPage, priceAlert, TA_IFRAME, MODAL_IFRAME, PTCB_IFRAME } from '../pages/PriceAlertPage';

/**
 * Cảnh báo giá trên biểu đồ — testcases/canh-bao-gia.md. Chạy trên prev2 (bản build preprod mới nhất):
 *   npx playwright test tests/canh-bao-gia.spec.ts --project=chromium --workers=2
 * Mọi API cảnh báo đi qua máy chủ giả, mọi lệnh ghi setting bị chặn — xem đầu pages/PriceAlertPage.ts.
 */
const PREV2_URL = process.env.PREV2_BASE_URL ?? 'https://prev2.vietpointer.vn';
test.use({ baseURL: PREV2_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(150_000);

/** Bước giá HOSE mà web dùng khi làm tròn giá ở menu chuột phải (`roundToPriceStep`). */
const stepOf = (dong: number) => (dong < 10000 ? 10 : dong < 50000 ? 50 : 100);
const num = (s: string) => Number(s.replace(/[^\d]/g, ''));
/** Giá (đồng) trong chữ "Tạo cảnh báo VNM tại 60,800". */
const priceInRow = (row: string) => num(row.split(' tại ')[1]);

/** Mở Biểu đồ VNM với 2 cảnh báo giả nằm trong vùng nhìn thấy (trên: tăng lên tới, dưới: giảm xuống tới, lặp lại). */
async function chartWithTwoLines(page: Page, extra: Parameters<PriceAlertPage['openChart']>[0] = {}) {
  const p = new PriceAlertPage(page);
  await p.openChart(extra);
  const { high, low } = await p.pricesInView();
  p.server.seed([priceAlert('VNM', true, high), priceAlert('VNM', false, low, { repeat: true })]);
  await p.bumpAlertSaved();
  await p.waitLinesStable(2);
  return { p, high, low };
}

const fmt = (dong: number) => dong.toLocaleString('en-US');

// =====================================================================================================
test.describe('Menu chuột phải — tạo cảnh báo (trang Biểu đồ)', () => {
  test('TC_CBG_01: Dòng "Tạo cảnh báo <mã> tại <giá>" đứng đầu menu chuột phải, đúng mã đang xem', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const { high } = await p.pricesInView();
    await p.rightClickAt(await p.pointAtPrice(high / 1000));
    await expect(p.tvMenuCreateRow()).toBeVisible();
    const lines = (await p.tvMenu().innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    expect(lines[0]).toMatch(/^Tạo cảnh báo VNM tại [\d,]+$/);
    // Các dòng gốc của TradingView vẫn còn ngay sau dòng cảnh báo.
    expect(lines).toEqual(expect.arrayContaining([expect.stringMatching(/^Sao chép giá/), 'Cài đặt…']));
    await page.keyboard.press('Escape');
  });

  test('TC_CBG_02: Giá trong dòng menu được làm tròn theo bước giá của mã (100đ / 50đ / 10đ)', async ({ page }) => {
    const p = new PriceAlertPage(page);
    // VNM (~57.000đ → bước 100) và HQC (< 10.000đ → bước 10) trong 2 khung cạnh nhau.
    await p.openChart({ layout: { frames: [[{ symbol: 'VNM' }], [{ symbol: 'HQC' }]] } });
    const iframes = page.locator(TA_IFRAME);
    await expect(iframes).toHaveCount(2);
    for (const idx of [0, 1]) {
      const sel = `${TA_IFRAME} >> nth=${idx}`;
      const box = (await iframes.nth(idx).boundingBox())!;
      const frame = page.frameLocator(TA_IFRAME).nth(idx);
      await expect(frame.locator('[data-name="legend-source-item"]').first()).toBeVisible({ timeout: 60000 });
      await page.waitForTimeout(1500);
      // Điểm bấm cố định có thể trúng nến / dấu mua-bán NKGD của tài khoản thật / khung khối lượng — các chỗ đó mở menu
      // khác, không có dòng cảnh báo. Thử lần lượt nhiều điểm trong vùng giá, cần đủ 2 mẫu giá.
      const row = frame.locator('[data-name="menu-inner"]').getByText(/^Tạo cảnh báo [A-Z]+ tại [\d,]+$/);
      const values: number[] = [];
      for (const [rx, ry] of [[0.45, 0.25], [0.45, 0.4], [0.3, 0.3], [0.6, 0.45], [0.35, 0.2], [0.55, 0.35]]) {
        if (values.length >= 2) break;
        await page.mouse.click(box.x + box.width * rx, box.y + box.height * ry, { button: 'right' });
        const shown = await row.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false);
        if (shown) values.push(priceInRow(await row.innerText()));
        await page.keyboard.press('Escape');
        await expect(frame.locator('[data-name="menu-inner"]')).toBeHidden();
      }
      expect(values.length, `${sel}: số điểm bấm ra dòng tạo cảnh báo`).toBeGreaterThanOrEqual(2);
      for (const value of values) expect(value % stepOf(value), `${sel} ${value}`).toBe(0);
    }
  });

  test('TC_CBG_04: Bấm dòng menu ở trên giá hiện tại → hộp "Tạo cảnh báo giá" điền sẵn giá đó, chiều "Giá tăng lên tới"', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const r = await p.visibleRange();
    const rowText = await p.openCreateFromMenu(r.to - (r.to - r.from) * 0.08);
    await expect(p.boxTitle).toHaveText('Tạo cảnh báo giá');
    await expect(p.boxStock).toHaveText('VNM');
    expect(await p.boxValue()).toBe(priceInRow(rowText));
    await expect(p.boxLast).toBeVisible();
    expect(await p.boxDirection()).toBe('up');
  });

  test('TC_CBG_05: Bấm dòng menu ở dưới giá hiện tại → chiều tự chọn "Giá giảm xuống tới"', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const r = await p.visibleRange();
    await p.openCreateFromMenu(r.from + (r.to - r.from) * 0.08);
    await expect(p.boxLast).toBeVisible();
    await expect.poll(() => p.boxDirection()).toBe('down');
  });

  test('TC_CBG_06: Biểu đồ chỉ số (VNINDEX) không có dòng tạo cảnh báo và không đọc cảnh báo', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ layout: { frames: [[{ symbol: 'VNINDEX' }]] } });
    expect(await p.chartSymbol()).toBe('VNINDEX');
    const r = await p.visibleRange();
    await p.rightClickAt(await p.pointAtPrice((r.from + r.to) / 2));
    await expect(p.tvMenu()).toBeVisible();
    await expect(p.tvMenu()).not.toContainText('Tạo cảnh báo');
    expect(p.server.reads).not.toContain('VNINDEX');
    await page.keyboard.press('Escape');
  });
});

// =====================================================================================================
test.describe('Hộp "Tạo cảnh báo giá"', () => {
  test('TC_CBG_07: Giao diện hộp tạo cảnh báo và ô giá được focus sẵn', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await expect(page.getByRole('dialog', { name: 'Tạo cảnh báo giá' })).toBeVisible();
    await expect(p.boxClose).toHaveAttribute('title', 'Đóng (Esc)');
    await expect(p.boxStock).toHaveText('VNM');
    await expect(p.boxLast).toHaveText(/^\s*\d+\.\d{2}\s+[+-]?\d+\.\d{2}%\s*$/);
    // Màu theo giá so với tham chiếu: tăng → xanh (upchange/ceilchange), giảm → đỏ (downchange/floorchange).
    const pct = Number((await p.boxLast.innerText()).trim().split(/\s+/)[1].replace('%', ''));
    if (pct > 0) await expect(p.boxLast).toHaveClass(/text-(up|ceil)change/);
    if (pct < 0) await expect(p.boxLast).toHaveClass(/text-(down|floor)change/);
    await expect(p.boxUp).toBeVisible();
    await expect(p.boxDown).toBeVisible();
    await expect(p.box.locator('.paq-unit')).toHaveText('đ');
    await expect(p.boxRepeat).toHaveAttribute('aria-checked', 'false');
    await expect(p.boxSaveNext).toBeEnabled();
    await expect(p.boxCreate).toBeEnabled();
    await expect(p.boxSave).toHaveCount(0);
    await expect(p.boxDelete).toHaveCount(0);
    await expect(p.boxPrice).toBeFocused();
  });

  test('TC_CBG_08: Ô giá chỉ nhận chữ số và tự thêm dấu phẩy hàng nghìn', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await p.typePrice('12a3b4,5.6x7');
    await expect(p.boxPrice).toHaveValue('1,234,567');
    await p.typePrice('abc!@#');
    await expect(p.boxPrice).toHaveValue('');
  });

  test('TC_CBG_09: Ô giá dài tối đa 13 ký tự (10 chữ số đã có dấu phẩy)', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await expect(p.boxPrice).toHaveAttribute('maxlength', '13');
    await p.typePrice('123456789012345');
    expect((await p.boxPrice.inputValue()).length).toBeLessThanOrEqual(13);
    await expect(p.boxPrice).toHaveValue('1,234,567,890');
  });

  test('TC_CBG_10: Ô giá trống hoặc bằng 0 → hai nút lưu bị khoá', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await p.typePrice('');
    await expect(p.boxCreate).toBeDisabled();
    await expect(p.boxSaveNext).toBeDisabled();
    await p.typePrice('0');
    await expect(p.boxPrice).toHaveValue('');
    await expect(p.boxCreate).toBeDisabled();
    await p.boxPrice.press('Enter');
    await expect(p.box).toBeVisible();
    expect(p.server.updates).toHaveLength(0);
    await p.typePrice('5');
    await expect(p.boxCreate).toBeEnabled();
  });

  test('TC_CBG_11: Chưa chọn chiều bằng tay thì chiều đổi theo giá gõ so với giá hiện tại', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await expect(p.boxLast).toBeVisible();
    const last = Math.round(Number((await p.boxLast.innerText()).split(/\s/)[0]) * 1000);
    await p.typePrice(String(last + 5000));
    expect(await p.boxDirection()).toBe('up');
    await p.typePrice(String(last - 5000));
    expect(await p.boxDirection()).toBe('down');
  });

  test('TC_CBG_12: Đã chọn chiều bằng tay thì gõ giá không làm đổi chiều nữa', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await expect(p.boxLast).toBeVisible();
    const last = Math.round(Number((await p.boxLast.innerText()).split(/\s/)[0]) * 1000);
    await p.boxDown.click();
    expect(await p.boxDirection()).toBe('down');
    await expect(p.boxPrice).toBeFocused();
    await p.typePrice(String(last + 5000));
    expect(await p.boxDirection()).toBe('down');
  });

  test('TC_CBG_13: Công tắc "Lặp lại" bật/tắt', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await p.boxRepeat.click();
    await expect(p.boxRepeat).toHaveAttribute('aria-checked', 'true');
    await p.boxRepeat.click();
    await expect(p.boxRepeat).toHaveAttribute('aria-checked', 'false');
  });

  test('TC_CBG_14: Tạo cảnh báo → gửi 1 yêu cầu đúng nội dung, hộp đóng, đường mới hiện trên biểu đồ', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const { high } = await p.pricesInView();
    await p.openCreateFromMenu();
    await p.typePrice(String(high));
    await p.boxUp.click();
    await p.boxCreate.click();
    await expect(p.box).toBeHidden();
    expect(p.server.updates).toHaveLength(1);
    expect(p.server.updates[0]).toEqual({
      user_alerts: [{
        stockcode: 'VNM', condition_key: 'COND_PRICE_UP', condition_label: 'Giá tăng lên chạm một mức giá cố định',
        type_condition: 'COND_PRICE', condition_value: high, is_active: 1, frequency: 0,
      }],
      old_user_alerts: [],
    });
    await expect.poll(() => p.alertLines()).toEqual([
      expect.objectContaining({ text: `Cảnh báo: tăng lên tới ${fmt(high)}`, price: high / 1000 }),
    ]);
  });

  test('TC_CBG_15: Bật "Lặp lại" + chiều giảm → gửi frequency 1, condition COND_PRICE_DOWN', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const { low } = await p.pricesInView();
    await p.openCreateFromMenu();
    await p.typePrice(String(low));
    await p.boxDown.click();
    await p.boxRepeat.click();
    await p.boxCreate.click();
    await expect(p.box).toBeHidden();
    expect(p.server.updates[0].user_alerts[0]).toMatchObject({
      condition_key: 'COND_PRICE_DOWN', condition_label: 'Giá giảm xuống một mức giá cố định', frequency: 1, condition_value: low,
    });
    await expect.poll(() => p.alertLineTexts()).toEqual([`Cảnh báo: giảm xuống tới ${fmt(low)}`]);
  });

  test('TC_CBG_16: Nhấn Enter trong ô giá = bấm "Tạo cảnh báo"', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await p.boxPrice.press('Enter');
    await expect(p.box).toBeHidden();
    expect(p.server.updates).toHaveLength(1);
  });

  test('TC_CBG_17: "Lưu & tạo tiếp" → lưu, hộp vẫn mở với giá hiện tại, chiều về "tăng", Lặp lại giữ nguyên', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const { low } = await p.pricesInView();
    await p.openCreateFromMenu();
    await expect(p.boxLast).toBeVisible();
    const last = Math.round(Number((await p.boxLast.innerText()).split(/\s/)[0]) * 1000);
    await p.typePrice(String(low));
    await p.boxDown.click();
    await p.boxRepeat.click();
    await p.boxSaveNext.click();
    await expect.poll(() => p.server.alerts.length).toBe(1);
    await expect(p.box).toBeVisible();
    await expect(p.boxTitle).toHaveText('Tạo cảnh báo giá');
    await expect.poll(() => p.boxValue()).toBe(last);
    expect(await p.boxDirection()).toBe('up');
    await expect(p.boxRepeat).toHaveAttribute('aria-checked', 'true');
    await expect(p.boxPrice).toBeFocused();
    await expect.poll(() => p.alertLineTexts()).toEqual([`Cảnh báo: giảm xuống tới ${fmt(low)}`]);
  });

  test('TC_CBG_18: Bấm đúp "Tạo cảnh báo" chỉ gửi 1 yêu cầu', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await p.boxCreate.dblclick();
    await expect(p.box).toBeHidden();
    await page.waitForTimeout(1000);
    expect(p.server.updates).toHaveLength(1);
  });

  test('TC_CBG_19: Trong lúc đang lưu (máy chủ chậm) các nút bị khoá', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    p.server.mode = 'slow';
    await p.boxSaveNext.click();
    await expect(p.boxSaveNext).toBeDisabled();
    await expect(p.boxCreate).toBeDisabled();
    await expect(p.boxCreate).toBeEnabled({ timeout: 10000 });
    expect(p.server.updates).toHaveLength(1);
  });

  for (const [id, mode, expected] of [
    ['TC_CBG_20', '500', 'Có lỗi xảy ra, vui lòng thử lại'],
    ['TC_CBG_21', 'abort', 'Có lỗi xảy ra, vui lòng thử lại'],
    ['TC_CBG_22', '422', 'Thông báo lỗi giả từ máy chủ'],
    ['TC_CBG_23', '400', 'Thông báo lỗi giả từ máy chủ'],
  ] as const) {
    const label = { '500': 'Máy chủ lỗi 500', abort: 'Mất mạng', '422': 'Lỗi 422 có trường error', '400': 'Lỗi 400 có trường message' }[mode];
    test(`${id}: ${label} → toast "${expected}", hộp vẫn mở, giữ giá đã gõ, không vẽ đường`, async ({ page }) => {
      const p = new PriceAlertPage(page);
      await p.openChart();
      await p.openCreateFromMenu();
      await p.typePrice('77777');
      p.server.mode = mode;
      await p.boxCreate.click();
      await expect(p.toastError).toContainText(expected);
      await expect(p.box).toBeVisible();
      await expect(p.boxPrice).toHaveValue('77,777');
      await expect(p.boxCreate).toBeEnabled();
      expect(await p.alertLines()).toEqual([]);
    });
  }

  test('TC_CBG_24: Đóng hộp bằng nút ×, phím Esc, bấm nền tối — không gửi gì; bấm trong hộp không đóng', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await p.openCreateFromMenu();
    await p.box.locator('.paq-body').click({ position: { x: 5, y: 5 } });
    await expect(p.box).toBeVisible();
    await p.boxClose.click();
    await expect(p.box).toBeHidden();

    await p.openCreateFromMenu();
    await page.keyboard.press('Escape');
    await expect(p.box).toBeHidden();

    await p.openCreateFromMenu();
    await p.boxOverlay.click({ position: { x: 20, y: 20 } });
    await expect(p.box).toBeHidden();
    expect(p.server.updates).toHaveLength(0);
  });

  test('TC_CBG_25: Mở lại hộp sau khi đóng → trạng thái mới (không giữ giá đã gõ, Lặp lại tắt)', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const first = await p.openCreateFromMenu();
    await p.typePrice('99999');
    await p.boxRepeat.click();
    await p.boxClose.click();
    const second = await p.openCreateFromMenu();
    expect(await p.boxValue()).toBe(priceInRow(second));
    expect(priceInRow(second)).toBe(priceInRow(first));
    await expect(p.boxRepeat).toHaveAttribute('aria-checked', 'false');
  });
});

// =====================================================================================================
test.describe('Đường cảnh báo trên biểu đồ', () => {
  test('TC_CBG_26: Mỗi cảnh báo giá đang bật = 1 đường cam nét đứt đúng mức giá; bỏ qua cảnh báo tắt, loại khác, mã khác', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    const { high, low } = await p.pricesInView();
    p.server.seed([
      priceAlert('VNM', true, high),
      priceAlert('VNM', false, low, { repeat: true }),
      priceAlert('VNM', true, high + 500, { active: false }),
      { ...priceAlert('VNM', false, 3), type_condition: 'COND_PCHANGE', condition_key: 'COND_PCHANGE_DEC', condition_label: 'Giá giảm liên tục nhiều phiên' },
      priceAlert('FPT', true, high),
    ]);
    // Tải lại trang: đường được vẽ ngay khi biểu đồ mở (không cần thao tác gì).
    await page.reload({ waitUntil: 'domcontentloaded' });
    await p.waitChartReady();
    await expect.poll(() => p.alertLines().then((l) => l.length)).toBe(2);
    const lines = await p.alertLines();
    expect(lines.map((l) => [l.text, l.price]).sort()).toEqual([
      [`Cảnh báo: giảm xuống tới ${fmt(low)}`, low / 1000],
      [`Cảnh báo: tăng lên tới ${fmt(high)}`, high / 1000],
    ].sort());
    for (const l of lines) {
      expect(l.color.toUpperCase()).toBe('#F57C00');
      expect(l.showLabel).toBe(false);
    }
    const styles = await p.chartApi<number[]>(TA_IFRAME, `const c = api.activeChart();
      return c.getAllShapes().map(s => c.getShapeById(s.id).getProperties().linestyle);`);
    expect(styles).toEqual([2, 2]);
  });

  test('TC_CBG_27: Rê chuột lại gần đường thì hiện điều kiện, rời ra thì ẩn', async ({ page }) => {
    const { p, high } = await chartWithTwoLines(page);
    const pt = await p.pointAtPrice(high / 1000);
    await page.mouse.move(pt.x, pt.y - 60);
    await page.mouse.move(pt.x, pt.y, { steps: 6 });
    await expect.poll(async () => (await p.alertLines()).filter((l) => l.showLabel).map((l) => l.text))
      .toEqual([`Cảnh báo: tăng lên tới ${fmt(high)}`]);
    await page.mouse.move(pt.x, pt.y - 60, { steps: 6 });
    await expect.poll(async () => (await p.alertLines()).filter((l) => l.showLabel).length).toBe(0);
  });

  test('TC_CBG_28: Bấm chuột trái vào đường → hộp "Sửa cảnh báo giá" đúng giá, chiều, Lặp lại; có nút Xoá + Lưu', async ({ page }) => {
    const { p, low } = await chartWithTwoLines(page);
    const pt = await p.pointAtPrice(low / 1000);
    await page.mouse.click(pt.x, pt.y);
    await expect(p.box).toBeVisible();
    await expect(p.boxTitle).toHaveText('Sửa cảnh báo giá');
    await expect(p.boxPrice).toHaveValue(fmt(low));
    expect(await p.boxDirection()).toBe('down');
    await expect(p.boxRepeat).toHaveAttribute('aria-checked', 'true');
    await expect(p.boxDelete).toBeEnabled();
    await expect(p.boxSave).toBeEnabled();
    await expect(p.boxCreate).toHaveCount(0);
    await expect(p.boxSaveNext).toHaveCount(0);
  });

  test('TC_CBG_29: Chuột phải vào đường → mở thẳng hộp sửa (không hiện menu gốc của TradingView)', async ({ page }) => {
    const { p, high } = await chartWithTwoLines(page);
    await p.rightClickAt(await p.pointAtPrice(high / 1000));
    await expect(p.box).toBeVisible();
    await expect(p.boxTitle).toHaveText('Sửa cảnh báo giá');
    await expect(p.boxPrice).toHaveValue(fmt(high));
    expect(await p.boxDirection()).toBe('up');
    await expect(p.tvMenu()).toBeHidden();
  });

  test('TC_CBG_30: Sửa giá rồi Lưu → gửi bản mới + bản cũ, đường dời sang giá mới', async ({ page }) => {
    const { p, high, low } = await chartWithTwoLines(page);
    const old = p.server.forCode('VNM').find((a) => a.condition_key === 'COND_PRICE_UP')!;
    const pt = await p.pointAtPrice(high / 1000);
    await page.mouse.click(pt.x, pt.y);
    await expect(p.boxTitle).toHaveText('Sửa cảnh báo giá');
    const moved = high + 300;
    await p.typePrice(String(moved));
    await p.boxSave.click();
    await expect(p.box).toBeHidden();
    expect(p.server.updates).toHaveLength(1);
    expect(p.server.updates[0].user_alerts).toEqual([expect.objectContaining({ condition_key: 'COND_PRICE_UP', condition_value: moved, frequency: 0 })]);
    expect(p.server.updates[0].old_user_alerts).toEqual([{ ...old, stockcode: 'VNM' }]);
    await expect.poll(() => p.alertLineTexts()).toEqual([
      `Cảnh báo: giảm xuống tới ${fmt(low)}`, `Cảnh báo: tăng lên tới ${fmt(moved)}`,
    ].sort());
  });

  test('TC_CBG_31: Xoá trong hộp sửa → gửi danh sách mới rỗng + bản cũ, đường biến mất', async ({ page }) => {
    const { p, high, low } = await chartWithTwoLines(page);
    const old = p.server.forCode('VNM').find((a) => a.condition_key === 'COND_PRICE_DOWN')!;
    const pt = await p.pointAtPrice(low / 1000);
    await page.mouse.click(pt.x, pt.y);
    await expect(p.boxTitle).toHaveText('Sửa cảnh báo giá');
    await p.boxDelete.click();
    await expect(p.box).toBeHidden();
    expect(p.server.updates).toEqual([{ user_alerts: [], old_user_alerts: [{ ...old, stockcode: 'VNM' }] }]);
    await expect.poll(() => p.alertLineTexts()).toEqual([`Cảnh báo: tăng lên tới ${fmt(high)}`]);
  });

  test('TC_CBG_33: Đổi mã trên biểu đồ → đường của mã cũ mất, đường của mã mới hiện', async ({ page }) => {
    const { p } = await chartWithTwoLines(page);
    p.server.seed([...p.server.alerts, priceAlert('FPT', true, 1000), priceAlert('FPT', false, 999000)]);
    const frame = p.frame();
    await frame.locator('#header-toolbar-symbol-search:visible').first().click();
    await page.keyboard.type('FPT', { delay: 40 });
    await page.waitForTimeout(1200);
    await page.keyboard.press('Enter');
    await expect.poll(() => p.chartSymbol(), { timeout: 30000 }).toBe('FPT');
    await expect.poll(() => p.alertLineTexts(), { timeout: 20000 }).toEqual([
      'Cảnh báo: giảm xuống tới 999,000', 'Cảnh báo: tăng lên tới 1,000',
    ]);
    expect(p.server.reads).toContain('FPT');
  });

  test('TC_CBG_34: Đọc cảnh báo bị lỗi (GET 500) → biểu đồ vẫn dùng bình thường, không vẽ đường, không lỗi JS', async ({ page }) => {
    const p = new PriceAlertPage(page);
    p.server.readFails = true;
    await p.openChart({ alerts: [priceAlert('VNM', true, 60000)] });
    await page.waitForTimeout(2000);
    expect(await p.alertLines()).toEqual([]);
    expect(p.pageErrors.filter((e) => /alert|condition/i.test(e))).toEqual([]);
    await p.openCreateFromMenu();
    await expect(p.boxTitle).toHaveText('Tạo cảnh báo giá');
  });
});

// =====================================================================================================
test.describe('Nút "Biểu đồ" — tick "Cảnh báo giá"', () => {
  test('TC_CBG_35: Menu "Biểu đồ" có dòng "Cảnh báo giá" (sau "Sự kiện", trước đường kẻ), tick sẵn; nút có tooltip', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart();
    await expect(p.displayMenuButton()).toHaveAttribute('title', 'Tuỳ chọn hiển thị: sự kiện, cổ đông lớn, cảnh báo giá, nhật ký giao dịch');
    await p.displayMenuButton().click();
    await expect(p.displayMenu()).toBeVisible();
    const order = await p.displayMenu().locator(':scope > div').evaluateAll((els) =>
      els.map((e) => (e.classList.contains('custom-dropdown-menu-sep') ? '---' : (e.firstChild?.textContent || '').trim())));
    expect(order.slice(0, 4)).toEqual(['GD cổ đông lớn', 'Sự kiện', 'Cảnh báo giá', '---']);
    await expect(p.displayMenuRow('Cảnh báo giá').locator('input[type=checkbox]')).toBeChecked();
  });

  test('TC_CBG_36: Bỏ tick → đường ẩn + ghi setting false; tick lại → đường hiện lại + ghi setting true; menu vẫn mở', async ({ page }) => {
    const { p } = await chartWithTwoLines(page);
    await p.displayMenuButton().click();
    const row = p.displayMenuRow('Cảnh báo giá');
    await row.click();
    await expect(row.locator('input')).not.toBeChecked();
    await expect(p.displayMenu()).toBeVisible();
    await expect.poll(() => p.alertLines().then((l) => l.length)).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem('tradingview.show_price_alerts'))).toBe('false');
    await expect.poll(() => p.settingWrites).toContainEqual({ key: 'tradingview.show_price_alerts', value: false });
    await row.click();
    await expect(row.locator('input')).toBeChecked();
    await expect.poll(() => p.alertLines().then((l) => l.length)).toBe(2);
    await expect.poll(() => p.settingWrites).toContainEqual({ key: 'tradingview.show_price_alerts', value: true });
  });

  test('TC_CBG_37: Setting đang tắt → mở trang không vẽ đường, không đọc cảnh báo, menu bỏ tick; tạo mới cũng không vẽ', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ showLines: false, alerts: [priceAlert('VNM', true, 60000)] });
    await page.waitForTimeout(2000);
    expect(await p.alertLines()).toEqual([]);
    expect(p.server.reads).not.toContain('VNM');
    await p.displayMenuButton().click();
    await expect(p.displayMenuRow('Cảnh báo giá').locator('input')).not.toBeChecked();
    await page.keyboard.press('Escape');
    await p.frame().locator('body').click({ position: { x: 5, y: 300 } });
    await p.openCreateFromMenu();
    await p.boxCreate.click();
    await expect(p.box).toBeHidden();
    await page.waitForTimeout(1500);
    expect(await p.alertLines()).toEqual([]);
  });
});

// =====================================================================================================
test.describe('Thẻ giới thiệu lần đầu', () => {
  const STEPS = [
    ['Chuột phải để tạo cảnh báo', 'Chuột phải vào mức giá muốn báo, rồi bấm chuột trái vào dòng Tạo cảnh báo.'],
    ['Mỗi cảnh báo là một đường cam', 'Đường nét đứt màu cam. Chỉ cần rê chuột lại gần, không bấm, để xem điều kiện.'],
    ['Bấm chuột trái vào đường để sửa', 'Mở hộp để đổi giá hoặc xoá. Cảnh báo 1 lần báo xong thì đường tự mất.'],
    ['Ẩn hoặc hiện các đường', 'Bấm chuột trái vào nút Biểu đồ trên đầu đồ thị, bỏ tích Cảnh báo giá để ẩn.'],
  ];

  test('TC_CBG_38: Tài khoản trả phí chưa xem → thẻ hiện trong góc trên phải biểu đồ, bước 1/4', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ introSeen: false });
    await expect(p.intro).toBeVisible({ timeout: 20000 });
    await expect(p.intro).toHaveAttribute('role', 'dialog');
    await expect(p.intro.locator('.cai-badge')).toHaveText('Mới');
    await expect(p.intro.locator('.cai-head-text')).toHaveText('Cảnh báo giá trên biểu đồ');
    await expect(p.introTitle).toHaveText(STEPS[0][0]);
    await expect(p.introText).toHaveText(STEPS[0][1]);
    await expect(p.introCount).toHaveText('1/4');
    await expect(p.intro.locator('svg.cai-ill')).toContainText('Tạo cảnh báo VNM tại 128,500');
    await expect(p.introBtn('Quay lại')).toHaveCount(0);
    // Thẻ nằm trong khung biểu đồ, góc trên bên phải; không làm tối trang.
    const card = (await p.intro.boundingBox())!;
    const chart = (await page.locator(TA_IFRAME).boundingBox())!;
    expect(card.x).toBeGreaterThan(chart.x + chart.width / 2);
    expect(card.x + card.width).toBeLessThanOrEqual(chart.x + chart.width);
    expect(card.y).toBeGreaterThanOrEqual(chart.y);
    expect(card.y).toBeLessThan(chart.y + chart.height / 2);
    await expect(p.introFrame).toHaveCount(0);
  });

  test('TC_CBG_39: Tiếp / Quay lại / bấm chấm đi đúng 4 bước; bước cuối có "Xong" + "Tạo cảnh báo VNM"', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ introSeen: false });
    await expect(p.intro).toBeVisible({ timeout: 20000 });
    for (let i = 0; i < 4; i++) {
      await expect(p.introTitle).toHaveText(STEPS[i][0]);
      await expect(p.introText).toHaveText(STEPS[i][1]);
      await expect(p.introCount).toHaveText(`${i + 1}/4`);
      await expect(p.introDots.nth(i)).toHaveAttribute('aria-current', 'step');
      if (i < 3) await p.introBtn('Tiếp').click();
    }
    await expect(p.introBtn('Tiếp')).toHaveCount(0);
    await expect(p.introBtn('Bỏ qua')).toHaveCount(0);
    await expect(p.introBtn('Xong')).toBeVisible();
    await expect(p.introBtn('Tạo cảnh báo VNM')).toBeVisible();
    await p.introDots.nth(1).click();
    await expect(p.introCount).toHaveText('2/4');
    await p.introBtn('Quay lại').click();
    await expect(p.introCount).toHaveText('1/4');
    await expect(p.introDots).toHaveCount(4);
    await expect(p.introDots.nth(2)).toHaveAttribute('aria-label', `Bước 3: ${STEPS[2][0]}`);
  });

  test('TC_CBG_40: "Bỏ qua" → thẻ đóng, ghi cờ đã xem; tải lại trang không hiện lại', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ introSeen: false });
    await expect(p.intro).toBeVisible({ timeout: 20000 });
    await p.introBtn('Bỏ qua').click();
    await expect(p.intro).toBeHidden();
    await expect.poll(() => p.settingWrites).toContainEqual({ key: 'chart_alert_intro_seen', value: '1' });
    expect(await page.evaluate(() => localStorage.getItem('chart_alert_intro_seen'))).toBe('1');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await p.waitChartReady();
    await page.waitForTimeout(4000);
    await expect(p.intro).toBeHidden();
  });

  test('TC_CBG_41: Phím Esc, nút × và nút "Xong" đều đóng thẻ và tính là đã xem', async ({ page, browser }) => {
    for (const how of ['esc', 'x', 'xong'] as const) {
      // Mỗi cách 1 context riêng: cờ "đã xem" nằm trong localStorage, dùng chung giữa các tab cùng context.
      const tab = how === 'esc' ? page : await (await browser.newContext({ baseURL: PREV2_URL, viewport: { width: 1600, height: 900 } })).newPage();
      const p = new PriceAlertPage(tab);
      await p.openChart({ introSeen: false });
      await expect(p.intro).toBeVisible({ timeout: 20000 });
      if (how === 'esc') await tab.keyboard.press('Escape');
      if (how === 'x') await p.intro.getByRole('button', { name: 'Đóng' }).click();
      if (how === 'xong') {
        for (let i = 0; i < 3; i++) await p.introBtn('Tiếp').click();
        await p.introBtn('Xong').click();
      }
      await expect(p.intro, how).toBeHidden();
      await expect.poll(() => p.settingWrites, { message: how }).toContainEqual({ key: 'chart_alert_intro_seen', value: '1' });
    }
  });

  test('TC_CBG_43: Đã xem rồi (cờ trong setting) → thẻ không hiện', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ introSeen: true });
    await page.waitForTimeout(5000);
    await expect(p.intro).toHaveCount(0);
  });

  test('TC_CBG_44: Biểu đồ nhỏ không có nút "Biểu đồ" (Cơ hội tiềm năng) → thẻ 3 bước, đặt cạnh biểu đồ, có viền khung', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.open({ introSeen: false, path: '/co-hoi-tiem-nang' });
    await expect(p.intro).toBeVisible({ timeout: 30000 });
    await expect(p.introCount).toHaveText('1/3');
    await expect(p.introDots).toHaveCount(3);
    await expect(p.introFrame).toBeVisible();
    const chart = (await page.locator('.opp-chart__box .tv-lightweight-charts').first().boundingBox())!;
    const card = (await p.intro.boundingBox())!;
    const overlaps = card.x < chart.x + chart.width && card.x + card.width > chart.x && card.y < chart.y + chart.height && card.y + card.height > chart.y;
    expect(overlaps).toBe(false);
    for (let i = 0; i < 2; i++) await p.introBtn('Tiếp').click();
    await expect(p.introTitle).toHaveText(STEPS[2][0]);
    await expect(p.introBtn('Xong')).toBeVisible();
  });
});

// =====================================================================================================
test.describe('Các biểu đồ khác', () => {
  test('TC_CBG_45: Modal biểu đồ nhanh (ô "Tìm mã chứng khoán" trên header): có đường, dòng tạo cảnh báo, tick "Cảnh báo giá"', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.open({ path: '/dashboard', alerts: [] });
    const search = page.getByPlaceholder('Tìm mã chứng khoán');
    await search.click();
    await search.fill('FPT');
    await page.waitForTimeout(1500);
    await search.press('Enter');
    await p.waitChartReady(MODAL_IFRAME);
    expect(await p.chartSymbol(MODAL_IFRAME)).toBe('FPT');
    const { high } = await p.pricesInView(MODAL_IFRAME);
    p.server.seed([priceAlert('FPT', true, high)]);
    await p.bumpAlertSaved();
    await expect.poll(() => p.alertLineTexts(MODAL_IFRAME)).toEqual([`Cảnh báo: tăng lên tới ${fmt(high)}`]);
    // Chuột phải ở vùng không có đường (gần đáy khung giá) — chuột phải trúng đường thì mở hộp sửa (TC_29).
    const r = await p.visibleRange(MODAL_IFRAME);
    const rowText = await p.openCreateFromMenu(r.from + (r.to - r.from) * 0.15, MODAL_IFRAME);
    expect(rowText).toMatch(/^Tạo cảnh báo FPT tại /);
    await expect(p.boxStock).toHaveText('FPT');
    // Hộp cảnh báo nổi trên modal biểu đồ.
    await expect(p.boxCreate).toBeEnabled();
    await p.boxClose.click();
    await p.displayMenuButton(MODAL_IFRAME).click();
    await expect(p.displayMenuRow('Cảnh báo giá', MODAL_IFRAME).locator('input')).toBeChecked();
  });

  test('TC_CBG_46: PTCB — biểu đồ giá: có đường cảnh báo; chuột phải chỉ hiện menu nhỏ 1 dòng "Tạo cảnh báo"', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.open({ path: '/phan-tich-co-ban' });
    await p.waitChartReady(PTCB_IFRAME);
    // PTCB mở mã gần nhất của tài khoản — test dùng đúng mã đang hiện trên biểu đồ.
    const mack = await p.chartSymbol(PTCB_IFRAME);
    expect(mack).toMatch(/^[A-Z0-9]{3}$/);
    const { high, low } = await p.pricesInView(PTCB_IFRAME);
    p.server.seed([priceAlert(mack, true, high), priceAlert(mack, false, low)]);
    await p.bumpAlertSaved();
    await expect.poll(() => p.alertLineTexts(PTCB_IFRAME)).toEqual([
      `Cảnh báo: giảm xuống tới ${fmt(low)}`, `Cảnh báo: tăng lên tới ${fmt(high)}`,
    ]);
    const r = await p.visibleRange(PTCB_IFRAME);
    await p.rightClickAt(await p.pointAtPrice((r.from + r.to) / 2, PTCB_IFRAME));
    await expect(p.smallMenu).toBeVisible();
    await expect(p.smallMenuItems).toHaveCount(1);
    await expect(p.smallMenuItems.first()).toHaveText(new RegExp(`^Tạo cảnh báo ${mack} tại [\\d,]+$`));
    await expect(p.smallMenuItems.first().locator('svg')).toHaveCount(1);
    await expect(p.tvMenu(PTCB_IFRAME)).toHaveCount(0);
    const text = await p.smallMenuItems.first().innerText();
    await p.smallMenuItems.first().click();
    await expect(p.smallMenu).toBeHidden();
    await expect(p.box).toBeVisible();
    expect(await p.boxValue()).toBe(priceInRow(text));
  });

  test('TC_CBG_47: Menu nhỏ đóng khi bấm Esc hoặc bấm ra ngoài', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.open({ path: '/phan-tich-co-ban' });
    await p.waitChartReady(PTCB_IFRAME);
    const r = await p.visibleRange(PTCB_IFRAME);
    const pt = await p.pointAtPrice((r.from + r.to) / 2, PTCB_IFRAME);
    await p.rightClickAt(pt);
    await expect(p.smallMenu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(p.smallMenu).toBeHidden();
    await p.rightClickAt(pt);
    await expect(p.smallMenu).toBeVisible();
    await page.mouse.click(5, 450);
    await expect(p.smallMenu).toBeHidden();
    await expect(p.box).toBeHidden();
  });

  test('TC_CBG_48: Cơ hội tiềm năng — chuột phải biểu đồ "Điểm mua" → menu nhỏ "Tạo cảnh báo <mã> tại <giá>" → hộp với giá đó', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.open({ path: '/co-hoi-tiem-nang' });
    const chart = page.locator('.opp-chart__box .tv-lightweight-charts').first();
    await expect(chart).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);
    const mack = (await page.locator('.opp-chart__box').locator('xpath=ancestor::*[contains(@class,"opp")][1]').innerText()).match(/\b[A-Z]{3}\b/)?.[0];
    const b = (await chart.boundingBox())!;
    await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.35, { button: 'right' });
    await expect(p.smallMenuItems).toHaveCount(1);
    const text = await p.smallMenuItems.first().innerText();
    expect(text).toMatch(/^Tạo cảnh báo [A-Z]{3} tại [\d,]+$/);
    if (mack) expect(text).toContain(`Tạo cảnh báo ${mack} tại`);
    const value = priceInRow(text);
    expect(value % stepOf(value)).toBe(0);
    await p.smallMenuItems.first().click();
    await expect(p.box).toBeVisible();
    expect(await p.boxValue()).toBe(value);
  });

  test('TC_CBG_49: Cơ hội tiềm năng — tạo cảnh báo rồi chuột phải lại đúng chỗ → menu nhỏ "Sửa cảnh báo giá" → hộp sửa', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.open({ path: '/co-hoi-tiem-nang' });
    const chart = page.locator('.opp-chart__box .tv-lightweight-charts').first();
    await expect(chart).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);
    const b = (await chart.boundingBox())!;
    const pt = { x: b.x + b.width * 0.4, y: b.y + b.height * 0.35 };
    await p.rightClickAt(pt);
    const text = await p.smallMenuItems.first().innerText();
    await p.smallMenuItems.first().click();
    await p.boxCreate.click();
    await expect(p.box).toBeHidden();
    await expect.poll(() => p.server.alerts.length).toBe(1);
    await page.waitForTimeout(1500);
    await p.rightClickAt(pt);
    await expect(p.smallMenuItems).toHaveText(['Sửa cảnh báo giá']);
    await expect(p.smallMenuItems.first().locator('svg')).toHaveCount(0);
    await p.smallMenuItems.first().click();
    await expect(p.boxTitle).toHaveText('Sửa cảnh báo giá');
    expect(await p.boxValue()).toBe(priceInRow(text));
  });

  test('TC_CBG_50: NKGD Tài sản — chi tiết lệnh có Kế hoạch giá: chuông cạnh từng mức → hộp tạo cảnh báo với đúng mức giá', async ({ page }) => {
    // Bơm Giá mục tiêu 1 / Giá cắt lỗ 1 vào MỌI lệnh mua đọc về (chỉ sửa response đọc, không ghi gì).
    await page.route(/\/api\/tradinglog\/getAll/, async (route) => {
      const res = await route.fetch();
      const json = await res.json();
      for (const log of json.list_data_item || []) {
        if (log.loai_giao_dich === 'mua' && log.mack?.length === 3) {
          log.target_price_1 = Math.round(log.gia_thuc_hien * 1.2 * 100) / 100;
          log.stop_loss_price_1 = Math.round(log.gia_thuc_hien * 0.9 * 100) / 100;
        }
      }
      await route.fulfill({ response: res, json });
    });
    const p = new PriceAlertPage(page);
    await p.open({ path: '/nhat-ky-giao-dich' });
    const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Mua' }) }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await row.getByRole('cell').nth(2).click();
    const detailBtn = page.getByRole('button', { name: /^Xem chi tiết lệnh / }).first();
    await expect(detailBtn).toBeVisible({ timeout: 15000 });
    // Mở lệnh mua đầu tiên trong danh sách.
    const buyRow = page.locator('tr').filter({ has: page.locator('.xm-loai') }).filter({ hasText: /Mua/ }).first();
    await buyRow.getByRole('button', { name: /^Xem chi tiết lệnh / }).click();
    await expect(page.getByText('Kế hoạch giá', { exact: false })).toBeVisible();
    const bells = page.locator('.ctgd-price-cell').getByRole('button', { name: 'Tạo cảnh báo giá' });
    await expect(bells).toHaveCount(2);
    const target = await page.locator('.ctgd-price-cell').first().locator('b').innerText();
    await bells.first().click();
    await expect(p.box).toBeVisible();
    await expect(p.boxTitle).toHaveText('Tạo cảnh báo giá');
    const expected = Math.round(Number(target.replace(/,/g, '')) * 1000 / 10) * 10;
    expect(await p.boxValue()).toBe(expected);
    await expect.poll(() => p.boxDirection()).toBe('up');
  });
});

// =====================================================================================================
test.describe('Tài khoản Free', () => {
  test('TC_CBG_51: Free — không vẽ đường, không đọc cảnh báo, không hiện thẻ giới thiệu', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ account: 'free', introSeen: false, alerts: [priceAlert('VNM', true, 60000)] });
    await page.waitForTimeout(5000);
    expect(await p.alertLines()).toEqual([]);
    expect(p.server.reads).toEqual([]);
    await expect(p.intro).toHaveCount(0);
  });

  test('TC_CBG_52: Free — menu chuột phải vẫn có dòng tạo cảnh báo; bấm vào → popup "Chọn dịch vụ", không mở hộp', async ({ page }) => {
    const p = new PriceAlertPage(page);
    await p.openChart({ account: 'free' });
    await p.rightClickAt(await p.pointAtPrice((await p.pricesInView()).high / 1000));
    await expect(p.tvMenuCreateRow()).toBeVisible();
    await p.tvMenuCreateRow().click();
    await expect(p.packageModal).toBeVisible();
    await expect(p.box).toBeHidden();
  });
});

// =====================================================================================================
test.describe('Chưa tự động hoá', () => {
  test.fixme('TC_CBG_53: Cảnh báo 1 lần báo xong thì đường của nó tự mất khỏi biểu đồ', async () => {
    // Cần máy chủ thật bắn sự kiện socket `updatealert` khi giá chạm mức (TheContainer.vue → updateStatusAlertPrice →
    // alertFiredAt). Không giả lập được socket của production trong test; tạo cảnh báo thật để chờ bắn thì ghi lên
    // tài khoản thật.
  });

  test.fixme('TC_CBG_54: Biểu đồ nhỏ trong khung chat AI có đường cảnh báo và menu nhỏ "Tạo cảnh báo"', async () => {
    // ReactSmallChartTA.vue chỉ hiện khi trợ lý AI trả lời kèm biểu đồ — nội dung do AI quyết định, không chủ động
    // dựng được ổn định trong test.
  });
});
