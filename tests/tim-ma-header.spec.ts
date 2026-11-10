import { test, expect } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { HeaderSearchPage, RECENT_KEY } from '../pages/HeaderSearchPage';

/**
 * Ô "Tìm mã chứng khoán" trên header — testcases/tim-ma-header.md.
 * Chạy trên `PREV2_BASE_URL` (kfsp.vn = preprod mới nhất). Ô này không ghi gì lên máy chủ; lưới an toàn của
 * HeaderSearchPage huỷ mọi lệnh ghi khác và mỗi test kiểm tra không có lệnh nào bị huỷ ngoài dự kiến.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let p: HeaderSearchPage;
test.beforeEach(({ page }) => { p = new HeaderSearchPage(page); });
test.afterEach(() => {
  expect(p.blockedWrites, 'không được có lệnh ghi nào tới máy chủ thật').toEqual([]);
});

// =====================================================================================================
test.describe('Hiển thị ô tìm mã', () => {
  test('TC_TIMMA_01: Ô "Tìm mã chứng khoán" có kính lúp, nằm bên phải header trước nút đổi giao diện, có ở mọi trang', async ({ page }) => {
    await p.open({ path: '/dashboard' });
    await expect(p.input).toHaveAttribute('aria-label', 'Tìm mã chứng khoán');
    await expect(p.input).toHaveAttribute('autocomplete', 'off');
    await expect(p.input).toHaveValue('');
    await expect(p.magnifier).toBeVisible();
    // Ô nằm trong cụm nút bên phải header, đứng đầu cụm (trước nút đổi giao diện + chuông + tài khoản).
    const firstInGroup = await page.locator('.header-actions').evaluate((el) => el.firstElementChild?.classList.contains('header-search'));
    expect(firstInGroup).toBe(true);
    for (const path of ['/phan-tich-co-ban', '/phan-tich-ky-thuat']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(p.input, path).toBeVisible({ timeout: 30_000 });
    }
  });

  test('TC_TIMMA_02: Chưa có mã gần đây → bấm vào ô trống không mở hộp gợi ý', async () => {
    await p.open({ recent: null });
    await p.input.click();
    await expect(p.input).toBeFocused();
    await p.browserPage.waitForTimeout(800);
    await expect(p.dropdown).toHaveCount(0);
  });

  test('TC_TIMMA_03: Bấm kính lúp → focus vào ô; phím ↓ khi hộp đang đóng → mở lại hộp', async () => {
    await p.open({ recent: ['VNM', 'FPT'] });
    await p.magnifier.click();
    await expect(p.input).toBeFocused();
    await expect(p.dropdown).toBeVisible();
    await p.input.press('Escape');
    await expect(p.dropdown).toHaveCount(0);
    await p.input.press('ArrowDown');
    await expect(p.dropdown).toBeVisible();
    await expect(p.dropdownTitle).toHaveText('Mã gần đây');
  });
});

// =====================================================================================================
test.describe('Tìm kiếm', () => {
  test('TC_TIMMA_04: Gõ 1 ký tự → chỉ dò theo mã (không dò tên), tối đa 5 dòng; dòng có mã, sàn, tên công ty', async () => {
    await p.open();
    await p.type('f');
    const codes = await p.codes();
    expect(codes.length).toBe(5);
    for (const c of codes) expect(c).toContain('F');
    for (const i of [0, 1, 2, 3, 4]) {
      const row = p.items.nth(i);
      await expect(row.locator('.header-search-san')).toHaveText(/^(HOSE|HNX|UPCOM)$/);
      await expect(row.locator('.header-search-name')).not.toBeEmpty();
    }
    await expect(p.dropdownTitle).toHaveCount(0);
  });

  test('TC_TIMMA_05: Không phân biệt hoa thường; mã trùng hẳn đứng đầu', async () => {
    await p.open();
    await p.type('vnm');
    const lower = await p.codes();
    expect(lower[0]).toBe('VNM');
    await p.type('VNM');
    expect(await p.codes()).toEqual(lower);
  });

  test('TC_TIMMA_06: Khớp mã xếp trước khớp tên — "fpt": FPT đầu, các dòng sau khớp theo tên có chữ FPT', async () => {
    await p.open();
    await p.type('fpt');
    const codes = await p.codes();
    expect(codes[0]).toBe('FPT');
    expect(codes.length).toBe(5);
    for (let i = 1; i < codes.length; i++) {
      if (codes[i].includes('FPT')) continue;
      await expect(p.items.nth(i).locator('.header-search-name')).toContainText('FPT');
    }
  });

  test('TC_TIMMA_07: Tìm theo tên công ty, gõ không dấu hay có dấu đều ra cùng kết quả ("hoa phat" / "Hòa Phát")', async () => {
    await p.open();
    await p.type('hoa phat');
    const noAccent = await p.codes();
    expect(noAccent).toContain('HPG');
    await expect(p.item('HPG').locator('.header-search-name')).toContainText('Hòa Phát');
    await p.type('Hòa Phát');
    expect(await p.codes()).toEqual(noAccent);
  });

  test('TC_TIMMA_08: Chữ "đ" — "dau khi" và "dầu khí" ra cùng kết quả, tên có chữ "Dầu khí"', async () => {
    await p.open();
    await p.type('dầu khí');
    const accent = await p.codes();
    expect(accent.length).toBeGreaterThan(0);
    await expect(p.items.first().locator('.header-search-name')).toContainText(/dầu khí/i);
    await p.type('dau khi');
    expect(await p.codes()).toEqual(accent);
  });

  test('TC_TIMMA_09: Khoảng trắng hai đầu bị bỏ — "  hpg  " ra HPG đầu tiên', async () => {
    await p.open();
    await p.type('  hpg  ');
    expect((await p.codes())[0]).toBe('HPG');
  });

  test('TC_TIMMA_10: Không khớp mã nào → "Không tìm thấy mã phù hợp"; Enter không làm gì, chữ giữ nguyên', async () => {
    await p.open();
    await p.type('qqqqq');
    await expect(p.empty).toHaveText('Không tìm thấy mã phù hợp');
    await expect(p.items).toHaveCount(0);
    await p.input.press('Enter');
    await p.browserPage.waitForTimeout(800);
    await expect(p.modal).toHaveCount(0);
    await expect(p.input).toHaveValue('qqqqq');
  });

  test('TC_TIMMA_11: Chỉ gõ khoảng trắng → không mở hộp gợi ý', async () => {
    await p.open({ recent: null });
    await p.input.click();
    await p.input.fill('   ');
    await p.browserPage.waitForTimeout(800);
    await expect(p.dropdown).toHaveCount(0);
  });

  test('TC_TIMMA_12: Mỗi dòng có giá: giá 2 số lẻ, thay đổi "±x.xx / ±y.yy%" mang dấu khớp màu tăng/giảm', async () => {
    await p.open();
    await p.type('fpt');
    // Giá hỏi qua socket `getlive` — chờ dòng đầu có giá.
    await expect(p.items.first().locator('.header-search-price')).toBeVisible({ timeout: 15_000 });
    const rows = await p.items.evaluateAll((els) => els.map((el) => {
      const right = el.querySelector('.header-search-item-right');
      return right ? {
        cls: right.className,
        price: right.querySelector('.header-search-price')?.textContent?.trim() || '',
        change: right.querySelector('.header-search-change')?.textContent?.replace(/\s+/g, ' ').trim() || '',
      } : null;
    }));
    const priced = rows.filter(Boolean) as { cls: string; price: string; change: string }[];
    expect(priced.length).toBeGreaterThan(0);
    for (const r of priced) {
      expect(r.price).toMatch(/^\d{1,3}(,\d{3})*\.\d{2}$/);
      expect(r.change).toMatch(/^[+-]?\d+(,\d{3})*\.\d{2} \/ [+-]?\d+\.\d{2}%$/);
      if (/text-(upchange|ceilchange)/.test(r.cls)) expect(r.change, r.cls).toMatch(/^\+.* \/ \+/);
      if (/text-(downchange|floorchange)/.test(r.cls)) expect(r.change, r.cls).toMatch(/^-.* \/ -/);
      if (/text-nochange/.test(r.cls)) expect(r.change).toBe('0.00 / 0.00%');
    }
  });
});

// =====================================================================================================
test.describe('Bàn phím và chuột', () => {
  test('TC_TIMMA_13: Dòng đầu sáng sẵn; ↓ chuyển xuống, ↑ ở dòng đầu vòng xuống dòng cuối', async () => {
    await p.open();
    await p.type('vn');
    const codes = await p.codes();
    expect(codes.length).toBe(5);
    expect(await p.activeCode()).toBe(codes[0]);
    await p.input.press('ArrowDown');
    await p.input.press('ArrowDown');
    expect(await p.activeCode()).toBe(codes[2]);
    await p.input.press('ArrowUp');
    await p.input.press('ArrowUp');
    await p.input.press('ArrowUp');
    expect(await p.activeCode()).toBe(codes[4]);
    await p.input.press('ArrowDown');
    expect(await p.activeCode()).toBe(codes[0]);
  });

  test('TC_TIMMA_14: Di chuột lên dòng → dòng đó sáng; Enter chọn đúng dòng đang sáng', async () => {
    await p.open();
    await p.type('fpt');
    const codes = await p.codes();
    await p.items.nth(3).hover();
    expect(await p.activeCode()).toBe(codes[3]);
    await p.input.press('Enter');
    await expect(p.modalTitle).toHaveText(codes[3], { timeout: 30_000 });
  });

  test('TC_TIMMA_15: Esc → xoá chữ và đóng hộp, ô vẫn giữ focus', async () => {
    await p.open();
    await p.type('hpg');
    await p.input.press('Escape');
    await expect(p.input).toHaveValue('');
    await expect(p.dropdown).toHaveCount(0);
    await expect(p.input).toBeFocused();
  });

  test('TC_TIMMA_16: Rời ô (phím Tab) → hộp đóng nhưng chữ còn; bấm lại ô → hộp mở lại đúng kết quả cũ', async () => {
    await p.open();
    await p.type('ssi');
    const before = await p.codes();
    await p.input.press('Tab');
    await expect(p.input).not.toBeFocused();
    await expect(p.dropdown).toHaveCount(0);
    await expect(p.input).toHaveValue('ssi');
    await p.input.click();
    await expect(p.dropdown).toBeVisible();
    expect(await p.codes()).toEqual(before);
  });

  test('TC_TIMMA_17: Đang ở dòng dưới mà gõ tiếp → dòng sáng quay về dòng đầu', async () => {
    await p.open();
    await p.type('vn');
    await p.input.press('ArrowDown');
    await p.input.press('ArrowDown');
    await p.input.press('m');
    await expect.poll(() => p.codes()).toContain('VNM');
    expect(await p.activeCode()).toBe((await p.codes())[0]);
  });
});

// =====================================================================================================
test.describe('Chọn mã → modal biểu đồ nhanh', () => {
  test('TC_TIMMA_18: Enter → modal biểu đồ của mã (tiêu đề, biểu đồ, panel thông tin); ô xoá chữ, đóng hộp, mất focus; không đổi trang', async ({ page }) => {
    await p.open({ path: '/dashboard' });
    await p.type('hpg');
    await p.input.press('Enter');
    await expect(p.modalTitle).toHaveText('HPG', { timeout: 30_000 });
    expect(await p.modalChartSymbol()).toBe('HPG');
    await expect(p.modal).toContainText('CTCP Tập đoàn Hòa Phát');
    await expect(p.modal).toContainText('HOSE: HPG');
    await expect(p.modalWatchlistBtn).toBeVisible();
    await expect(p.modalAddTradeBtn).toBeVisible();
    await expect(p.input).toHaveValue('');
    await expect(p.input).not.toBeFocused();
    await expect(p.dropdown).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/dashboard');
  });

  test('TC_TIMMA_19: Bấm chuột vào một dòng (không phải dòng đầu) → modal của đúng mã đó', async () => {
    await p.open();
    await p.type('fpt');
    const codes = await p.codes();
    await p.items.nth(1).click();
    await expect(p.modalTitle).toHaveText(codes[1], { timeout: 30_000 });
    expect(await p.modalChartSymbol()).toBe(codes[1]);
  });

  test('TC_TIMMA_20: Chọn mã khi đang ở trang Biểu đồ → vẫn ở trang Biểu đồ, modal mở đè lên', async ({ page }) => {
    await p.open({ path: '/phan-tich-ky-thuat' });
    await p.type('mbb');
    await p.input.press('Enter');
    await expect(p.modalTitle).toHaveText('MBB', { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe('/phan-tich-ky-thuat');
  });
});

// =====================================================================================================
test.describe('Mã gần đây', () => {
  test('TC_TIMMA_22: Chọn mã → lưu vào "Mã gần đây"; bấm ô trống hiện tiêu đề "Mã gần đây" với mã đó đầu tiên, kèm tên + giá', async () => {
    await p.open({ recent: null });
    await p.type('vnm');
    await p.input.press('Enter');
    await expect(p.modalTitle).toHaveText('VNM', { timeout: 30_000 });
    await expect.poll(() => p.recentStorage()).toEqual(['VNM']);
    await p.modalClose.click();
    await p.input.click();
    await expect(p.dropdownTitle).toHaveText('Mã gần đây');
    expect(await p.codes()).toEqual(['VNM']);
    await expect(p.item('VNM').locator('.header-search-name')).toHaveText('CTCP Sữa Việt Nam');
    await expect(p.item('VNM').locator('.header-search-price')).toBeVisible({ timeout: 15_000 });
  });

  test('TC_TIMMA_23: Chọn lại mã đã có → lên đầu, không lặp; danh sách giữ tối đa 5 mã (mã cũ nhất bị bỏ)', async () => {
    await p.open({ recent: ['VNM', 'FPT', 'HPG', 'MBB', 'SSI'] });
    await p.type('hpg');
    await p.input.press('Enter');
    await expect(p.modalTitle).toHaveText('HPG', { timeout: 30_000 });
    await expect.poll(() => p.recentStorage()).toEqual(['HPG', 'VNM', 'FPT', 'MBB', 'SSI']);
    await p.modalClose.click();
    await p.type('vic');
    await p.input.press('Enter');
    await expect(p.modalTitle).toHaveText('VIC', { timeout: 30_000 });
    await expect.poll(() => p.recentStorage()).toEqual(['VIC', 'HPG', 'VNM', 'FPT', 'MBB']);
    await p.modalClose.click();
    await p.input.click();
    expect(await p.codes()).toEqual(['VIC', 'HPG', 'VNM', 'FPT', 'MBB']);
  });

  test('TC_TIMMA_25: Dữ liệu "Mã gần đây" hỏng / không phải mảng / lẫn phần tử lạ → không lỗi JS, chỉ giữ phần tử là chuỗi', async ({ browser }) => {
    for (const [raw, expected] of [
      ['{hỏng', null],
      ['{"a":1}', null],
      ['[1, null, "FPT", {"x":1}, "VNM"]', ['FPT', 'VNM']],
    ] as const) {
      const ctx = await browser.newContext({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
      const q = new HeaderSearchPage(await ctx.newPage());
      await q.open({ recent: raw });
      await q.input.click();
      await q.browserPage.waitForTimeout(1000);
      if (expected === null) await expect(q.dropdown, raw).toHaveCount(0);
      else expect(await q.codes(), raw).toEqual(expected);
      expect(q.pageErrors.filter((e) => /header|recent|JSON/i.test(e)), raw).toEqual([]);
      expect(q.blockedWrites).toEqual([]);
      await ctx.close();
    }
  });
});

// =====================================================================================================
test.describe('Phân quyền và màn hình', () => {
  test('TC_TIMMA_26: Tài khoản Free — tìm và mở modal biểu đồ được; modal không có nút "Watchlist" và "Thêm giao dịch"', async () => {
    await p.open({ account: 'free' });
    await p.type('fpt');
    await p.input.press('Enter');
    await expect(p.modalTitle).toHaveText('FPT', { timeout: 30_000 });
    await expect(p.modalWatchlistBtn).toHaveCount(0);
    await expect(p.modalAddTradeBtn).toHaveCount(0);
  });

  test('TC_TIMMA_27: Cửa sổ ≤ 1140px ẩn ô tìm mã; từ 1141px hiện lại; độ rộng co giãn 200–300px', async ({ page }) => {
    await p.open();
    expect(Math.round((await p.wrapper.boundingBox())!.width)).toBe(272); // 17vw của 1600
    await page.setViewportSize({ width: 1920, height: 900 });
    await expect.poll(async () => Math.round((await p.wrapper.boundingBox())!.width)).toBe(300);
    await page.setViewportSize({ width: 1141, height: 900 });
    await expect(p.input).toBeVisible();
    await expect.poll(async () => Math.round((await p.wrapper.boundingBox())!.width)).toBe(200);
    await page.setViewportSize({ width: 1140, height: 900 });
    await expect(p.input).toBeHidden();
  });

  test('TC_TIMMA_28: Hộp gợi ý nằm ngay dưới ô, rộng đúng bằng ô; tên công ty dài xuống dòng, không bị cắt "…"', async () => {
    await p.open();
    await p.type('ngan hang');
    const box = (await p.wrapper.boundingBox())!;
    const dd = (await p.dropdown.boundingBox())!;
    expect(Math.round(dd.width)).toBe(Math.round(box.width));
    expect(dd.y).toBeGreaterThan(box.y + box.height);
    expect(dd.y - (box.y + box.height)).toBeLessThan(12);
    const names = p.items.locator('.header-search-name');
    const overflow = await names.evaluateAll((els) => els.map((e) => {
      const cs = getComputedStyle(e);
      return { ellipsis: cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap', clipped: e.scrollWidth > e.clientWidth };
    }));
    for (const o of overflow) expect(o).toEqual({ ellipsis: false, clipped: false });
  });
});

void RECENT_KEY;
