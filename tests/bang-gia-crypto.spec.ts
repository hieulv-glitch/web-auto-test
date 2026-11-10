import { test, expect } from '@playwright/test';
import { BangGiaCryptoPage, LIST_API, TOTAL_API, num } from '../pages/BangGiaCryptoPage';
import { useReadOnlySafetyNet } from '../pages/ReadOnlySafetyNet';

/**
 * Màn "Bảng giá crypto" (/crypto). Testcase: testcases/bang-gia-crypto.md.
 * localhost:8080 (nhánh preprod, backend PRODUCTION) — màn chỉ đọc; `useReadOnlySafetyNet` huỷ mọi request ghi tới
 * hệ thống KFSP (không chặn GET / websocket / host ngoài). Giá realtime về qua socket ta.kfsp.vn.
 *
 * Chạy: npx playwright test tests/bang-gia-crypto.spec.ts --project=chromium --workers=2
 */
test.use({ viewport: { width: 1600, height: 900 } });
test.setTimeout(90_000);
useReadOnlySafetyNet(test);

const HEADERS = ['#', 'Tiền ảo', 'Giá', '1h', '24h', '7D', 'KLGD 24h', 'Vốn hóa TT', '7 ngày qua'];
const PCT = /^-?\d{1,3}(,\d{3})*\.\d{2}%$/;
const USD = /^\$\d{1,3}(,\d{3})*(\.\d+)?$/;

test.describe('Điều hướng & hiển thị', () => {
  test('TC_CRYPTO_01: Menu "Thị Trường › Bảng giá crypto" mở /crypto; "Thị Trường" được tô sáng', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.open('paid', '/dashboard');
    const nav = page.locator('.c-header-nav-items');
    await nav.getByRole('link', { name: 'Thị Trường' }).first().hover();
    const item = page.getByRole('link', { name: 'Bảng giá crypto', exact: true });
    await item.waitFor({ state: 'visible' });
    await item.click();
    await expect(page).toHaveURL(/\/crypto$/);
    await expect(p.table).toBeVisible({ timeout: 30_000 });
    await expect(nav.getByRole('link', { name: 'Thị Trường' }).locator('div').first()).toHaveClass(/active-tab-overview/);
  });

  test('TC_CRYPTO_02: 3 thẻ đầu trang — Top vốn hóa, Vốn hóa thị trường, Chỉ số tâm lý', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.openReady();
    await expect(p.cards).toHaveCount(3);
    // Top vốn hóa: 3 coin, mỗi coin có tên + (ký hiệu) + "$ <số><đơn vị>".
    const top = p.topCapCard.locator('.market-cap-row-item');
    await expect(top).toHaveCount(3);
    await expect(top.first()).toContainText('Bitcoin');
    await expect(top.first()).toContainText('(BTC)');
    for (const t of await top.allInnerTexts()) expect(t.replace(/\s+/g, ' ')).toMatch(/\(\w+\) \$ [\d.,]+[KMBT]?$/);
    // Vốn hóa thị trường: tỷ trọng Bitcoin + Ethereum + Khác ≈ 100%.
    await expect(p.marketCapCard).toContainText('Bitcoin');
    await expect(p.marketCapCard).toContainText('Khác');
    await expect.poll(async () => {
      const pcts = ((await p.marketCapCard.innerText()).match(/-?\d+(\.\d+)?%(?!\))/g) || []).map((x) => parseFloat(x));
      return pcts.length >= 3 ? Math.round(pcts.slice(-3).reduce((a, b) => a + b, 0)) : 0;
    }).toBe(100);
    // Chỉ số tâm lý: 1 trong 5 nhãn.
    await expect(p.sentimentCard).toContainText(/Sợ hãi tột độ|Sợ hãi|Trung lập|Tham lam tột độ|Tham lam/);
  });

  test('TC_CRYPTO_03: Bảng coin mặc định — 9 cột, 20 dòng, STT 1→20, Bitcoin đứng đầu', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.openReady();
    expect((await p.headerCells.allInnerTexts()).map((s) => s.trim())).toEqual(HEADERS);
    await expect(p.rows).toHaveCount(20);
    expect(await p.column(0)).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1)));
    expect((await p.cells(0))[1]).toBe('Bitcoin BTC');
    expect(p.listPages[0]).toBe('1');
  });

  test('TC_CRYPTO_04: Định dạng dữ liệu — giá "$", biến động "x.xx%" có màu, KLGD/vốn hoá "$", có biểu đồ 7 ngày', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.openReady();
    await expect.poll(async () => (await p.column(2)).filter((s) => USD.test(s)).length, { timeout: 20_000 }).toBe(20);
    for (const col of [3, 4, 5]) {
      const vals = await p.column(col);
      for (const v of vals) expect(v).toMatch(PCT);
    }
    for (const col of [6, 7]) for (const v of await p.column(col)) expect(v).toMatch(/^\$\d{1,3}(,\d{3})*(\.\d{1,2})?$/);
    // Ô % có class màu theo dấu.
    const td = p.rows.first().locator('td').nth(4);
    const v = num(await td.innerText());
    await expect(td).toHaveClass(v > 0 ? /text-upchange/ : v < 0 ? /text-downchange/ : /text-nochange/);
    // Vốn hoá giảm dần theo thứ hạng trên trang 1 (dữ liệu xếp theo vốn hoá).
    const caps = (await p.column(7)).map(num);
    expect(caps[0]).toBeGreaterThanOrEqual(caps[1]);
    await expect.poll(() => p.rows.first().locator('td').nth(8).locator('canvas, svg').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  });

  test('TC_CRYPTO_05: Sắp xếp theo cột "Giá" — bấm 1 lần tăng dần, bấm lần 2 giảm dần', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.openReady();
    await expect.poll(async () => (await p.column(2)).filter((s) => USD.test(s)).length, { timeout: 20_000 }).toBe(20);
    await p.headerCell('Giá').click();
    const asc = (await p.column(2)).map(num);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    await p.headerCell('Giá').click();
    const desc = (await p.column(2)).map(num);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  test('TC_CRYPTO_06: Phân trang — bấm trang 2 gọi API page=2, STT bắt đầu từ 21', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.openReady();
    await expect(p.pagination).toBeVisible();
    await p.pagination.getByText('2', { exact: true }).click();
    await expect.poll(() => p.listPages.includes('2')).toBe(true);
    await expect.poll(async () => (await p.column(0))[0], { timeout: 20_000 }).toBe('21');
    await expect(p.rows).toHaveCount(20);
    // STT đổi ngay khi bấm trang, tên coin đổi khi API trang 2 trả về → chờ.
    await expect.poll(async () => (await p.cells(0))[1], { timeout: 20_000 }).not.toBe('Bitcoin BTC');
  });

  test('TC_CRYPTO_07: Thẻ "Vốn hóa thị trường" → 4 biểu đồ, ẩn bảng; thẻ "Top vốn hóa" → bảng trở lại; thẻ tâm lý không đổi', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.openReady();
    await p.sentimentCard.click();
    await expect(p.table).toBeVisible();
    await p.marketCapCard.click();
    await expect(p.table).toHaveCount(0);
    expect((await p.chartTitles.allInnerTexts()).map((s) => s.trim())).toEqual([
      'Tổng vốn hoá thị trường - Total 1',
      'Tổng vốn hoá thị trường (ngoại trừ Bitcoin) - Total 2',
      'Tổng vốn hoá thị trường (ngoại trừ Bitcoin và Ethereum) - Total 3',
      'Dominance - Tỷ lệ thống trị',
    ]);
    await expect(page.locator('main canvas').first()).toBeVisible();
    await p.topCapCard.click();
    await expect(p.table).toBeVisible();
    await expect(p.chartTitles).toHaveCount(0);
  });

  test('TC_CRYPTO_08: Bấm tên coin → mở cửa sổ biểu đồ của coin đó', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.openReady();
    await p.rows.first().locator('td').nth(1).click();
    await expect(p.tradingChartModal).toBeVisible({ timeout: 15_000 });
    await expect(p.tradingChartModal.locator('.modal-title')).toContainText(/BTC/);
  });
});

test.describe('Lỗi API', () => {
  test('TC_CRYPTO_09: API danh sách coin lỗi 500 — bảng hiện "Không có dữ liệu", trang không vỡ', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.mockStatus(LIST_API, 500);
    await p.open();
    await expect(p.table).toBeVisible({ timeout: 20_000 });
    await expect(p.table).toContainText('Không có dữ liệu');
    await expect(p.cards).toHaveCount(3);
    await expect(p.topCapCard.locator('.market-cap-row-item')).toHaveCount(0);
  });

  test('TC_CRYPTO_10: API tổng số coin lỗi 500 — bảng trang 1 vẫn hiện, không có số trang', async ({ page }) => {
    const p = new BangGiaCryptoPage(page);
    await p.mockStatus(TOTAL_API, 500);
    await p.openReady();
    await expect(p.rows).toHaveCount(20);
    await expect(p.pagination.getByText('2', { exact: true })).toHaveCount(0);
  });
});
