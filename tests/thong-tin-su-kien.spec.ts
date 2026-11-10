import { test, expect, Page } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { ThongTinSuKienPage, FakeTtskApi, TtskOpenOptions, report, doc, news } from '../pages/ThongTinSuKienPage';

/**
 * Màn "Thông tin và sự kiện" (/thong-tin-su-kien) + cửa sổ "Báo cáo phân tích" + ô nổi khi rê chuột.
 * Testcase: testcases/thong-tin-su-kien.md. Chạy trên prev2 (preprod mới nhất, backend production — chỉ đọc dữ liệu;
 * setting `final_mack` khi chọn mã bị `Prev2Session` chặn).
 *
 * Phần lớn test dùng `FakeTtskApi` (dữ liệu cố định, mã trong tiêu đề được thay bằng mã đang hỏi) để assert chính xác
 * số lượng / lọc ngày / phân trang / lỗi. TC_TTSK_05 + TC_TTSK_50 dùng dữ liệu thật.
 *
 * Chạy: npx playwright test tests/thong-tin-su-kien.spec.ts --project=chromium --workers=2
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

const Y = new Date().getFullYear();
const pad = (n: number) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const vn = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

const SUM_101 = 'Doanh thu tăng 12,1% lên 13.754 tỷ đồng. Chỉ số EV/EBITDA giữ ở mức 9,5 lần! Lợi nhuận Q3 đạt 2.723 tỷ đồng.';

/** Bộ dữ liệu chuẩn: 7 báo cáo, 6 + 3 + 4 tài liệu, 7 bài viết. */
function seed(api: FakeTtskApi) {
  api.reports = [
    report(101, `${Y}-01-05`, { source: 'VCBS', title: 'TST - Khó để cạnh tranh', recommendation: 'TRUNG LẬP', target_price: '51585', summary: SUM_101 }),
    report(102, `${Y}-01-04`, { source: 'MIRAE', title: 'TST - CNTT dẫn dắt', recommendation: 'MUA', target_price: '76363', upside_percent: '15.2%', summary: 'Câu một. Câu hai.' }),
    report(103, `${Y}-01-03`, { source: 'NHSV', title: 'TST - Vững vàng vượt khó' }),
    report(104, `${Y}-01-02`, { source: 'BSC', title: 'TST - Rủi ro tăng', recommendation: 'BÁN', target_price: '20000', summary: 'Rủi ro tăng.' }),
    report(105, `${Y - 1}-12-15`, { source: 'SSI', title: 'Báo cáo ngành công nghệ', recommendation: 'MUA,MUA', target_price: '30000,30000', summary: 'Ngành tốt.' }),
    report(106, `${Y - 1}-06-01`, { source: 'VND', title: 'Báo cáo chiến lược', recommendation: 'MUA,BÁN', target_price: '30000,45000', summary: 'Chiến lược.' }),
    report(107, `${Y - 2}-01-10`, { source: 'HSC', title: 'Báo cáo cũ', summary: 'Báo cáo cũ có tóm tắt.' }),
  ];
  // Cố ý xáo thứ tự để kiểm tra trang tự xếp mới nhất lên đầu.
  api.docs['3'] = [
    doc('3', `Bản cáo bạch niêm yết (CN/${Y - 2})`, `CN/${Y - 2}`),
    doc('3', `Bản điều lệ (CN/${Y})`, `CN/${Y}`),
    doc('3', `Báo cáo thường niên năm ${Y - 4} (CN/${Y - 4})`, `CN/${Y - 4}`, null),
    doc('3', `Báo cáo thường niên năm ${Y - 1} (CN/${Y - 1})`, `CN/${Y - 1}`),
    doc('3', `Tài liệu khác (CN/${Y - 3})`, `CN/${Y - 3}`),
    doc('3', `Quy chế quản trị nội bộ (CN/${Y - 1})`, `CN/${Y - 1}`),
  ];
  api.docs['4'] = [
    doc('4', 'Nghị quyết HĐQT về tăng vốn', `${Y - 2}`),
    doc('4', `Nghị quyết Hội đồng Quản trị (02-01-${Y})`, `02-01-${Y}`),
    doc('4', `Nghị quyết ĐHĐCĐ thường niên năm ${Y - 1}`, `20-04-${Y - 1}`),
  ];
  api.docs['5'] = [
    doc('5', `Báo cáo quản trị quý 2 năm ${Y - 1}`, `${Y - 1}`),
    doc('5', `Báo cáo tình hình quản trị công ty (02-01-${Y})`, `02-01-${Y}`),
    doc('5', `Báo cáo quản trị 6 tháng đầu năm ${Y - 2}`, `${Y - 2}`),
    doc('5', `Báo cáo tình hình quản trị công ty (30-07-${Y - 1})`, `30-07-${Y - 1}`),
  ];
  api.news = Array.from({ length: 7 }, (_, i) => news(201 + i, `${Y}-01-0${8 - i} 17:1${i}:00`, `TST: Bài viết số ${i + 1}`));
}

async function openReady(page: Page, setup?: (api: FakeTtskApi) => void, opts: TtskOpenOptions = {}) {
  const p = new ThongTinSuKienPage(page);
  seed(p.api);
  setup?.(p.api);
  await p.open(opts);
  await p.waitLoaded();
  return p;
}

const lastCall = (p: ThongTinSuKienPage, re: RegExp) => { const c = p.api.calls(re); return c[c.length - 1]?.q; };
const LIST = /\/api\/report-analysis$/;
const DETAIL = /\/api\/report-analysis\/\d+$/;
const DOCS = /get-document$/;
const NEWS = /get-list-news$/;
const COUNT = /get-count-page-news$/;

// =====================================================================================================================
test.describe('Điều hướng & giao diện chung', () => {
  test('TC_TTSK_01: Menu "Thị Trường" → "Thông tin và Sự Kiện" mở trang; tiêu đề "Thị Trường" được tô sáng', async ({ page }) => {
    const p = new ThongTinSuKienPage(page);
    seed(p.api);
    await p.open({ startPath: '/dashboard' });
    const nav = page.locator('.c-header-nav-items');
    await nav.getByRole('link', { name: 'Thị Trường' }).first().hover();
    const item = page.getByRole('link', { name: 'Thông tin và Sự Kiện', exact: true });
    await item.waitFor({ state: 'visible' });
    await item.click();
    await expect(page).toHaveURL(/\/thong-tin-su-kien/);
    await expect(p.root).toBeVisible({ timeout: 30000 });
    await expect(nav.getByRole('link', { name: 'Thị Trường' }).locator('div').first()).toHaveClass(/active-tab-overview/);
  });

  test('TC_TTSK_02: Giao diện ban đầu — ô mã, tên công ty, khoảng ngày trống, 4 nút lọc nhanh, 5 tab, mặc định tab Báo cáo phân tích', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.searchInput).toHaveValue('FPT');
    await expect(p.codeTitle).toHaveText('FPT');
    await expect(p.companyName).not.toBeEmpty();
    await expect(p.fromDate).toHaveValue('');
    await expect(p.toDate).toHaveValue('');
    await expect(p.clearDates).toHaveCount(0);
    await expect(p.chipGroup.getByRole('button')).toHaveText(['Mới nhất', `Năm ${Y}`, `Năm ${Y - 1}`, 'Tất cả']);
    await expect(p.chip('Mới nhất')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.tabs.locator('span:not(.tt-dem)')).toHaveText(['Báo cáo phân tích', 'Bản cáo bạch & BCTN', 'Nghị quyết', 'Báo cáo quản trị', 'Bài viết']);
    await expect(p.tab('Báo cáo phân tích')).toHaveAttribute('aria-selected', 'true');
    await expect(p.headers).toHaveText(['Ngày', 'Nguồn', 'Tên báo cáo']);
    // Cột "Tệp" đang tạm ẩn (hien_cot_tep: false)
    await expect(p.root.locator('th', { hasText: 'Tệp' })).toHaveCount(0);
  });

  test('TC_TTSK_03: Mặc định "Mới nhất" — mỗi tab tối đa 5 mục, không lọc ngày, không có thanh phân trang', async ({ page }) => {
    const p = await openReady(page);
    expect(lastCall(p, LIST)).toEqual({ mack: 'FPT', from_date: '', to_date: '', page: '1', item_per_page: '5' });
    expect(lastCall(p, NEWS)).toMatchObject({ mack: 'FPT', from_date: '', to_date: '', page: '1', item_per_page: '5' });
    expect(p.api.count(COUNT)).toBe(0); // "Mới nhất" không đếm tổng bài viết
    expect(p.api.calls(DOCS).map((c) => c.q.type).sort()).toEqual(['3', '4', '5']);
    expect(p.api.calls(DOCS).every((c) => c.q.year === '*' && c.q.mack === 'FPT')).toBe(true);
    await expect(p.tabCount('Báo cáo phân tích')).toHaveText('5');
    await expect(p.tabCount('Bản cáo bạch & BCTN')).toHaveText('5');
    await expect(p.tabCount('Nghị quyết')).toHaveText('3');
    await expect(p.tabCount('Báo cáo quản trị')).toHaveText('4');
    await expect(p.tabCount('Bài viết')).toHaveText('5');
    await expect(p.rows).toHaveCount(5);
    await expect(p.pager).toHaveCount(0);
  });

  test('TC_TTSK_04: ?mack= trên URL thắng mã đã lưu (final_mack); không có ?mack= thì mở mã đã lưu; chữ thường tự viết hoa', async ({ page, browser }) => {
    const saved = (items: { key: string; value: string }[]) => [...items.filter((i) => i.key !== 'final_mack'),
      { key: 'final_mack', value: JSON.stringify({ mack: 'VNM', type_mack: 'HOSE', description_mack: 'Sữa Việt Nam', department: '' }) }];
    const p = await openReady(page, undefined, { mack: 'fpt', patchSettings: saved });
    await expect(p.codeTitle).toHaveText('FPT');
    await page.waitForTimeout(1500);
    expect(p.api.calls(LIST).map((c) => c.q.mack)).toEqual(['FPT']); // 1 lượt duy nhất, không bắn 2 lượt
    await expect(p.rows.first()).toContainText('FPT -');

    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const page2 = await ctx.newPage();
    const p2 = await openReady(page2, undefined, { mack: null, patchSettings: saved });
    await expect(p2.codeTitle).toHaveText('VNM');
    await expect.poll(() => lastCall(p2, LIST)?.mack).toBe('VNM');
    await expect(p2.rows.first()).toContainText('VNM -');
    await ctx.close();
  });

  test('TC_TTSK_05: Dữ liệu thật (FPT) — đủ 5 tab có số, ngày đúng định dạng, nguồn không rỗng', async ({ page }) => {
    const p = new ThongTinSuKienPage(page);
    await p.open({ fake: false });
    await p.waitLoaded();
    for (const t of ['Báo cáo phân tích', 'Bản cáo bạch & BCTN', 'Nghị quyết', 'Báo cáo quản trị', 'Bài viết']) {
      await expect(p.tabCount(t)).toHaveText(/^[0-5]$/);
    }
    const n = await p.rows.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(5);
    for (const cells of await p.rows.evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent!.trim())))) {
      expect(cells[0]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(cells[1]).not.toBe('');
      expect(cells[2]).not.toBe('');
    }
    await p.tab('Bài viết').click();
    await expect(p.rows.first().locator('td').nth(0)).toHaveText('FPT');
    await expect(p.rows.first().locator('td').nth(1)).toHaveText(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(p.pageErrors).toEqual([]);
  });

  test('TC_TTSK_06: Trang vừa khít cửa sổ (không cuộn trang); màn 390px không tràn ngang, thanh tab tự cuộn ngang', async ({ page }) => {
    const p = await openReady(page, (api) => { api.reports = Array.from({ length: 40 }, (_, i) => report(500 + i, `${Y - 1}-0${(i % 9) + 1}-10`)); });
    await p.chip('Tất cả').click();
    await expect(p.rows).toHaveCount(20);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
    // bảng tự cuộn bên trong khung
    expect(await p.root.locator('.tt-bang-cuon:visible').evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const bar = p.root.locator('.tt-chuyen-hang');
    expect(await bar.evaluate((el) => el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX !== 'hidden')).toBe(true);
    await expect(p.rows.first()).toBeVisible();
  });
});

// =====================================================================================================================
test.describe('Ô tìm mã', () => {
  test('TC_TTSK_07: Gõ mã → tối đa 5 gợi ý (mã + tên công ty); bấm chọn → đổi mã, tải lại cả 5 tab, lưu final_mack', async ({ page }) => {
    const p = await openReady(page);
    await p.typeCode('VN');
    await expect(p.suggestions.first()).toBeVisible();
    const n = await p.suggestions.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(5);
    await expect(p.suggestions.first().locator('.search-stockcode_item--companyname')).not.toBeEmpty();
    await p.typeCode('VNM');
    await p.suggestions.filter({ has: page.locator('.search-stockcode_item--code', { hasText: /^\s*VNM\s*$/ }) }).click();
    await expect(p.suggestions).toHaveCount(0);
    await expect(p.codeTitle).toHaveText('VNM');
    await expect(p.companyName).toContainText(/Sữa Việt Nam/i);
    await expect(p.rows.first()).toContainText('VNM -');
    expect(lastCall(p, LIST)!.mack).toBe('VNM');
    expect(p.api.calls(DOCS).filter((c) => c.q.mack === 'VNM')).toHaveLength(3);
    expect(lastCall(p, NEWS)!.mack).toBe('VNM');
    await expect.poll(() => p.session.settingWrites.some((w) => w.key === 'final_mack' && JSON.parse(String(w.value)).mack === 'VNM'),
      { timeout: 10000 }).toBe(true);
  });

  test('TC_TTSK_08: Bàn phím — ↓ rồi Enter chọn gợi ý thứ 2; Esc đóng danh sách gợi ý', async ({ page }) => {
    const p = await openReady(page);
    await p.typeCode('HP');
    await expect(p.suggestions.nth(1)).toBeVisible();
    const second = (await p.suggestions.nth(1).locator('.search-stockcode_item--code').innerText()).trim();
    await p.searchInput.press('ArrowDown');
    await expect(p.suggestions.nth(1)).toHaveClass(/active/);
    await p.searchInput.press('Enter');
    await expect(p.codeTitle).toHaveText(second);
    await expect(p.searchInput).toHaveValue(second);

    await p.typeCode('MW');
    await expect(p.suggestions.first()).toBeVisible();
    await p.searchInput.press('Escape');
    await expect(p.suggestions).toHaveCount(0);
    await expect(p.codeTitle).toHaveText(second);
  });

  test('TC_TTSK_09: Tìm theo tên công ty không dấu ("sua viet nam") ra VNM', async ({ page }) => {
    const p = await openReady(page);
    await p.typeCode('sua viet nam');
    await expect(p.suggestions.locator('.search-stockcode_item--code', { hasText: /^\s*VNM\s*$/ })).toBeVisible();
  });

  test('TC_TTSK_10: Bấm ra ngoài ô tìm kiếm → đóng gợi ý, giữ nguyên mã đang xem', async ({ page }) => {
    const p = await openReady(page);
    await p.typeCode('VN');
    await expect(p.suggestions.first()).toBeVisible();
    await p.root.locator('.tt-the').click({ position: { x: 600, y: 600 } });
    await expect(p.suggestions).toHaveCount(0);
    await expect(p.codeTitle).toHaveText('FPT');
  });
});

// =====================================================================================================================
test.describe('Lọc theo thời gian', () => {
  test(`TC_TTSK_11: Nút "Năm <năm nay>" → điền 01/01 → hôm nay, gọi API theo khoảng ngày, 20 dòng/trang, hiện nút xoá`, async ({ page }) => {
    const p = await openReady(page);
    await p.chip(`Năm ${Y}`).click();
    await expect(p.chip(`Năm ${Y}`)).toHaveAttribute('aria-pressed', 'true');
    await expect(p.chip('Mới nhất')).toHaveAttribute('aria-pressed', 'false');
    await expect(p.fromDate).toHaveValue(`${Y}-01-01`);
    await expect(p.toDate).toHaveValue(TODAY);
    await expect(p.clearDates).toBeVisible();
    await expect.poll(() => lastCall(p, LIST)).toEqual({ mack: 'FPT', from_date: `${Y}-01-01`, to_date: TODAY, page: '1', item_per_page: '20' });
    await expect.poll(() => lastCall(p, COUNT)).toMatchObject({ from_date: `${Y}-01-01`, to_date: TODAY });
    await expect(p.rows).toHaveCount(4); // 101–104
    await expect(p.tabCount('Báo cáo phân tích')).toHaveText('4');
  });

  test(`TC_TTSK_12: Nút "Năm <năm trước>" → 01/01 → 31/12 năm trước; tài liệu lọc ngay trên trình duyệt, không gọi lại API tài liệu`, async ({ page }) => {
    const p = await openReady(page);
    const docCalls = p.api.count(DOCS);
    await p.chip(`Năm ${Y - 1}`).click();
    await expect(p.fromDate).toHaveValue(`${Y - 1}-01-01`);
    await expect(p.toDate).toHaveValue(`${Y - 1}-12-31`);
    await expect(p.rows).toHaveText([/Báo cáo ngành công nghệ/, /Báo cáo chiến lược/]);
    await expect(p.tabCount('Bản cáo bạch & BCTN')).toHaveText('2'); // thường niên + quy chế (lọc theo năm)
    await expect(p.tabCount('Nghị quyết')).toHaveText('1'); // lọc theo ngày ký 20/04
    await expect(p.tabCount('Báo cáo quản trị')).toHaveText('2'); // (30-07) theo ngày trong tên + quý 2 theo ngày cuối quý
    expect(p.api.count(DOCS)).toBe(docCalls);
  });

  test('TC_TTSK_13: Nút "Tất cả" → khoảng ngày trống, không giới hạn 5 mục, 20 dòng/trang, không có nút xoá', async ({ page }) => {
    const p = await openReady(page);
    await p.chip('Tất cả').click();
    await expect(p.fromDate).toHaveValue('');
    await expect(p.toDate).toHaveValue('');
    await expect(p.clearDates).toHaveCount(0);
    await expect.poll(() => lastCall(p, LIST)).toEqual({ mack: 'FPT', from_date: '', to_date: '', page: '1', item_per_page: '20' });
    await expect(p.rows).toHaveCount(7);
    await expect(p.tabCount('Bản cáo bạch & BCTN')).toHaveText('6');
    await expect(p.tabCount('Bài viết')).toHaveText('7');
    expect(p.api.count(COUNT)).toBeGreaterThan(0);
  });

  test('TC_TTSK_14: Nhập tay khoảng ngày → áp dụng ngay (không có nút Tìm kiếm), không nút lọc nhanh nào được chọn', async ({ page }) => {
    const p = await openReady(page);
    await p.fromDate.fill(`${Y - 1}-03-01`);
    await expect.poll(() => lastCall(p, LIST)).toMatchObject({ from_date: `${Y - 1}-03-01`, to_date: '', item_per_page: '20' });
    await p.toDate.fill(`${Y - 1}-12-31`);
    await expect.poll(() => lastCall(p, LIST)).toMatchObject({ from_date: `${Y - 1}-03-01`, to_date: `${Y - 1}-12-31` });
    await expect(p.rows).toHaveText([/Báo cáo ngành công nghệ/, /Báo cáo chiến lược/]);
    for (const b of await p.chipGroup.getByRole('button').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
    await expect(p.root.getByRole('button', { name: /Tìm kiếm/ })).toHaveCount(0);
  });

  test('TC_TTSK_15: "Từ ngày" sau "Đến ngày" → tự hoán đổi hai đầu rồi mới gọi API', async ({ page }) => {
    const p = await openReady(page);
    await p.toDate.fill(`${Y - 1}-03-01`);
    await p.fromDate.fill(`${Y - 1}-09-30`);
    await expect(p.fromDate).toHaveValue(`${Y - 1}-03-01`);
    await expect(p.toDate).toHaveValue(`${Y - 1}-09-30`);
    await expect.poll(() => lastCall(p, LIST)).toMatchObject({ from_date: `${Y - 1}-03-01`, to_date: `${Y - 1}-09-30` });
    expect(p.api.calls(LIST).some((c) => c.q.from_date > c.q.to_date && c.q.to_date !== '')).toBe(false);
  });

  test('TC_TTSK_16: Năm chưa gõ đủ (< 1990, vd 0202) → chưa áp dụng, không gọi API', async ({ page }) => {
    const p = await openReady(page);
    const before = p.api.count(LIST);
    await p.fromDate.fill('0202-01-01');
    await page.waitForTimeout(1500);
    expect(p.api.count(LIST)).toBe(before);
    await expect(p.chip('Mới nhất')).toHaveAttribute('aria-pressed', 'true');
  });

  test('TC_TTSK_17: Nút "Xoá khoảng ngày" → trống hai ô và về "Tất cả" (không phải "Mới nhất")', async ({ page }) => {
    const p = await openReady(page);
    await p.chip(`Năm ${Y}`).click();
    await expect(p.clearDates).toBeVisible();
    await p.clearDates.click();
    await expect(p.fromDate).toHaveValue('');
    await expect(p.toDate).toHaveValue('');
    await expect(p.chip('Tất cả')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.chip('Mới nhất')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => lastCall(p, LIST)).toMatchObject({ from_date: '', to_date: '', item_per_page: '20' });
    await expect(p.rows).toHaveCount(7);
  });

  test('TC_TTSK_19: Lọc tài liệu theo ngày — nghị quyết theo ngày ký, BCQT theo ngày trong tên / cuối quý / 30-06 bán niên', async ({ page }) => {
    const p = await openReady(page);
    await p.fromDate.fill(`${Y - 1}-04-01`);
    await p.toDate.fill(`${Y - 1}-06-30`);
    await p.tab('Nghị quyết').click();
    await expect(p.rows).toHaveText([new RegExp(`ĐHĐCĐ thường niên năm ${Y - 1}`)]);
    await p.tab('Báo cáo quản trị').click();
    // quý 2 → 30/06 (trong khoảng); (30-07) → 30/07 (ngoài khoảng)
    await expect(p.rows).toHaveText([new RegExp(`quý 2 năm ${Y - 1}`)]);
    await p.tab('Bản cáo bạch & BCTN').click();
    // tài liệu chỉ có năm → lọc theo năm
    await expect(p.rows).toHaveCount(2);
  });
});

// =====================================================================================================================
test.describe('Tab & bảng dữ liệu', () => {
  test('TC_TTSK_20: Mỗi tab — được chọn, đúng cột, chỉ một bảng hiện', async ({ page }) => {
    const p = await openReady(page);
    const cols: Record<string, string[]> = {
      'Bản cáo bạch & BCTN': ['Tên tài liệu / Văn kiện', 'Loại', 'Năm'],
      'Nghị quyết': ['Nội dung nghị quyết', 'Ngày ký'],
      'Báo cáo quản trị': ['Tên báo cáo quản trị', 'Kỳ báo cáo'],
      'Bài viết': ['Mã', 'Ngày', 'Bài viết'],
      'Báo cáo phân tích': ['Ngày', 'Nguồn', 'Tên báo cáo'],
    };
    for (const [t, h] of Object.entries(cols)) {
      await p.tab(t).click();
      await expect(p.tab(t)).toHaveAttribute('aria-selected', 'true');
      await expect(p.tabs.and(page.locator('[aria-selected="true"]'))).toHaveCount(1);
      await expect(p.root.locator('.tt-bang-cuon:visible')).toHaveCount(1);
      await expect(p.headers).toHaveText(h);
    }
  });

  test('TC_TTSK_21: Bản cáo bạch & BCTN — tên bỏ "(CN/yyyy)", Loại tách từ tên, cột Năm, xếp mới nhất lên đầu', async ({ page }) => {
    const p = await openReady(page);
    await p.chip('Tất cả').click();
    await p.tab('Bản cáo bạch & BCTN').click();
    const all = await p.table.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent!.trim())));
    expect(all).toEqual([
      ['Bản điều lệ', 'Điều lệ', `Năm ${Y}`],
      [`Báo cáo thường niên năm ${Y - 1}`, 'Thường niên', `Năm ${Y - 1}`],
      ['Quy chế quản trị nội bộ', 'Quy chế', `Năm ${Y - 1}`],
      ['Bản cáo bạch niêm yết', 'Cáo bạch', `Năm ${Y - 2}`],
      ['Tài liệu khác', 'Khác', `Năm ${Y - 3}`],
      [`Báo cáo thường niên năm ${Y - 4}`, 'Thường niên', `Năm ${Y - 4}`],
    ]);
  });

  test('TC_TTSK_22: Nghị quyết — không có cột Loại, Ngày ký dd/mm/yyyy (không có ngày thì "Năm yyyy")', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Nghị quyết').click();
    const all = await p.table.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent!.trim())));
    expect(all).toEqual([
      [`Nghị quyết Hội đồng Quản trị (02-01-${Y})`, `02/01/${Y}`],
      [`Nghị quyết ĐHĐCĐ thường niên năm ${Y - 1}`, `20/04/${Y - 1}`],
      ['Nghị quyết HĐQT về tăng vốn', `Năm ${Y - 2}`],
    ]);
  });

  test('TC_TTSK_23: Báo cáo quản trị — kỳ "Quý n/yyyy", "Bán niên yyyy", còn lại "Năm yyyy"', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Báo cáo quản trị').click();
    const all = await p.table.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent!.trim())));
    expect(all).toEqual([
      [`Báo cáo tình hình quản trị công ty (02-01-${Y})`, `Năm ${Y}`],
      [`Báo cáo tình hình quản trị công ty (30-07-${Y - 1})`, `Năm ${Y - 1}`],
      [`Báo cáo quản trị quý 2 năm ${Y - 1}`, `Quý 2/${Y - 1}`],
      [`Báo cáo quản trị 6 tháng đầu năm ${Y - 2}`, `Bán niên ${Y - 2}`],
    ]);
  });

  test('TC_TTSK_24: Bấm dòng tài liệu → mở tệp ở tab mới; tên là link target=_blank; tài liệu không có tệp thì không bấm được', async ({ page }) => {
    const p = await openReady(page);
    await p.chip('Tất cả').click();
    await p.tab('Bản cáo bạch & BCTN').click();
    const first = p.row('Bản điều lệ');
    const link = p.api.docs['3'].find((d) => d.fullname.startsWith('Bản điều lệ'))!.link!;
    await expect(first.getByRole('link')).toHaveAttribute('href', link);
    await expect(first.getByRole('link')).toHaveAttribute('target', '_blank');
    await first.locator('td.tt-mo').click();
    await expect.poll(() => p.opened()).toEqual([link]);

    const noFile = p.table.locator('tbody tr', { hasText: `Báo cáo thường niên năm ${Y - 4}` });
    await expect(noFile).not.toHaveClass(/tt-hang-bam/);
    await expect(noFile.getByRole('link')).toHaveCount(0);
    await noFile.locator('td').first().click();
    await page.waitForTimeout(500);
    expect(await p.opened()).toEqual([link]);
  });

  test('TC_TTSK_25: Bài viết — cột Mã là mã đang xem, ngày "dd/mm/yyyy hh:mm", xếp như API trả', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Bài viết').click();
    await expect(p.rows).toHaveCount(5);
    const first = await p.rows.first().locator('td').allInnerTexts();
    expect(first.map((s) => s.trim())).toEqual(['FPT', `08/01/${Y} 17:10`, 'FPT: Bài viết số 1']);
  });

  test('TC_TTSK_26: Bấm bài viết → cửa sổ tiêu đề = tên bài, "Đang tải nội dung" rồi hiện nội dung; đóng bằng ×', async ({ page }) => {
    const p = await openReady(page, (api) => { api.contentMode = 'slow'; api.slowMs = 2500; });
    await p.tab('Bài viết').click();
    await p.row('Bài viết số 2').click();
    await expect(p.newsModal).toBeVisible();
    await expect(p.newsModalTitle).toHaveText('FPT: Bài viết số 2');
    await expect(p.newsModalBody).toHaveText('Đang tải nội dung');
    await expect(p.newsModalBody).toHaveText('Nội dung bài viết giả lập', { timeout: 10000 });
    expect(lastCall(p, /get-content-news$/)).toMatchObject({ mack: 'FPT', id: '202' });
    await p.newsModal.getByRole('button', { name: 'Close' }).click();
    await expect(p.newsModal).toHaveCount(0);
  });

  test('TC_TTSK_27: Lỗi tải nội dung bài viết (500 / mất mạng) → "Không lấy được nội dung", không văng lỗi', async ({ page }) => {
    const p = await openReady(page, (api) => { api.contentMode = '500'; });
    await p.tab('Bài viết').click();
    await p.rows.first().click();
    await expect(p.newsModalBody).toHaveText('Không lấy được nội dung');
    await p.newsModal.getByRole('button', { name: 'Close' }).click();
    p.api.contentMode = 'abort';
    await p.rows.nth(1).click();
    await expect(p.newsModalBody).toHaveText('Không lấy được nội dung');
    expect(p.pageErrors).toEqual([]);
  });

  test('TC_TTSK_28: Đang tải → dòng khung chờ trong bảng, ô số trên tab ẩn; tải xong ô số hiện', async ({ page }) => {
    const p = new ThongTinSuKienPage(page);
    seed(p.api);
    p.api.listMode = 'slow'; p.api.docMode = 'slow'; p.api.newsMode = 'slow'; p.api.slowMs = 7000;
    await p.open();
    await expect(p.skeletonRows).toHaveCount(5);
    await expect(p.tab('Báo cáo phân tích').locator('.tt-dem')).toHaveCount(0);
    await p.tab('Bài viết').click();
    await expect(p.skeletonRows).toHaveCount(8);
    await p.tab('Nghị quyết').click();
    await expect(p.skeletonRows).toHaveCount(3);
    await expect(p.tabCount('Nghị quyết')).toHaveText('3', { timeout: 15000 });
    await expect(p.skeletonRows).toHaveCount(0);
    await expect(p.tabCount('Báo cáo phân tích')).toHaveText('5', { timeout: 15000 });
  });

  test('TC_TTSK_29: Không có dữ liệu → mỗi tab hiện câu "Không có … trong khoảng đã chọn", ô số 0', async ({ page }) => {
    const p = await openReady(page, (api) => { api.reports = []; api.docs = { 3: [], 4: [], 5: [] }; api.news = []; });
    const msg: Record<string, string> = {
      'Báo cáo phân tích': 'Không có báo cáo trong khoảng đã chọn',
      'Bản cáo bạch & BCTN': 'Không có tài liệu trong khoảng đã chọn',
      'Nghị quyết': 'Không có nghị quyết trong khoảng đã chọn',
      'Báo cáo quản trị': 'Không có báo cáo trong khoảng đã chọn',
      'Bài viết': 'Không có bài viết trong khoảng đã chọn',
    };
    for (const [t, m] of Object.entries(msg)) {
      await p.tab(t).click();
      await expect(p.emptyRow).toHaveText(m);
      await expect(p.tabCount(t)).toHaveText('0');
    }
  });

  test('TC_TTSK_31: Đổi mã liên tiếp — phản hồi của mã cũ về muộn bị bỏ, bảng giữ dữ liệu mã mới nhất', async ({ page }) => {
    const p = await openReady(page);
    p.api.delayByCode = { VNM: 5000 };
    await p.setStoreCode('VNM');
    await page.waitForTimeout(300);
    await p.setStoreCode('HPG');
    await expect(p.codeTitle).toHaveText('HPG');
    await expect(p.rows.first()).toContainText('HPG -');
    await page.waitForTimeout(6000); // phản hồi VNM về sau
    await expect(p.rows.first()).toContainText('HPG -');
    await p.tab('Bản cáo bạch & BCTN').click();
    await expect(p.rows.first()).toBeVisible();
    await p.tab('Bài viết').click();
    await expect(p.rows.first()).toContainText('HPG: Bài viết');
    await expect(p.rows.first().locator('td').first()).toHaveText('HPG');
  });
});

// =====================================================================================================================
test.describe('Phân trang', () => {
  const many = (n: number) => (api: FakeTtskApi) => {
    api.reports = Array.from({ length: n }, (_, i) => report(1000 + i, `${Y - 1}-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`, { title: `TST - Báo cáo ${1000 + i}` }));
  };

  test('TC_TTSK_32: Báo cáo phân tích 45 mục — 3 trang; ‹ khoá ở trang đầu, › khoá ở trang cuối; sang trang gọi page=n, ô số giữ 45', async ({ page }) => {
    const p = await openReady(page, many(45));
    await expect(p.pager).toHaveCount(0); // "Mới nhất" không phân trang
    await p.chip('Tất cả').click();
    await expect(p.pager).toBeVisible();
    expect(await p.pagerCells()).toEqual(['1', '2', '3']);
    await expect(p.pagerPrev).toBeDisabled();
    await expect(p.pagerPage(1)).toHaveAttribute('aria-current', 'page');
    await expect(p.tabCount('Báo cáo phân tích')).toHaveText('45');
    await p.pagerPage(2).click();
    await expect.poll(() => lastCall(p, LIST)).toMatchObject({ page: '2', item_per_page: '20' });
    await expect(p.pagerPage(2)).toHaveAttribute('aria-current', 'page');
    await expect(p.tabCount('Báo cáo phân tích')).toHaveText('45');
    // Nút › bị robot KFSP AI che → bấm bằng bàn phím
    await p.pagerNext.focus();
    await page.keyboard.press('Enter');
    await expect(p.rows).toHaveCount(5);
    await expect(p.pagerNext).toBeDisabled();
    // Đổi bộ lọc → quay về trang 1
    await p.chip(`Năm ${Y - 1}`).click();
    await expect.poll(() => lastCall(p, LIST)).toMatchObject({ page: '1', from_date: `${Y - 1}-01-01` });
    await expect(p.pagerPage(1)).toHaveAttribute('aria-current', 'page');
  });

  test('TC_TTSK_33: 10 trang — dãy ô rút gọn "…": trang 1, 4, 5, 10', async ({ page }) => {
    const p = await openReady(page, many(200));
    await p.chip('Tất cả').click();
    await expect(p.pager).toBeVisible();
    expect(await p.pagerCells()).toEqual(['1', '2', '3', '4', '…', '10']);
    await p.pagerPage(4).click();
    await expect(p.pagerPage(4)).toHaveAttribute('aria-current', 'page');
    expect(await p.pagerCells()).toEqual(['1', '2', '3', '4', '5', '…', '10']);
    await p.pagerPage(5).click();
    await expect(p.pagerPage(5)).toHaveAttribute('aria-current', 'page');
    expect(await p.pagerCells()).toEqual(['1', '…', '4', '5', '6', '…', '10']);
    await p.pagerPage(10).click();
    await expect(p.pagerPage(10)).toHaveAttribute('aria-current', 'page');
    expect(await p.pagerCells()).toEqual(['1', '…', '7', '8', '9', '10']);
  });

  test('TC_TTSK_34: Tài liệu 25 mục — phân trang ngay trên trình duyệt (không gọi API); đổi tab tài liệu → về trang 1', async ({ page }) => {
    const p = await openReady(page, (api) => {
      api.docs['3'] = Array.from({ length: 25 }, (_, i) => doc('3', `Báo cáo thường niên năm ${2000 + i} (CN/${2000 + i})`, `CN/${2000 + i}`));
    });
    await p.chip('Tất cả').click();
    await p.tab('Bản cáo bạch & BCTN').click();
    await expect(p.rows).toHaveCount(20);
    expect(await p.pagerCells()).toEqual(['1', '2']);
    const docCalls = p.api.count(DOCS);
    await p.pagerPage(2).click();
    await expect(p.rows).toHaveCount(5);
    await expect(p.rows.first()).toContainText('năm 2004');
    expect(p.api.count(DOCS)).toBe(docCalls);
    await p.tab('Nghị quyết').click();
    await p.tab('Bản cáo bạch & BCTN').click();
    await expect(p.pagerPage(1)).toHaveAttribute('aria-current', 'page');
    await expect(p.rows).toHaveCount(20);
  });

  test('TC_TTSK_35: Bài viết — máy chủ đếm thừa (65 nhưng chỉ có 45 bài) → bấm trang rỗng tự lùi về trang cuối có bài', async ({ page }) => {
    const p = await openReady(page, (api) => {
      api.news = Array.from({ length: 45 }, (_, i) => news(3000 + i, `${Y - 1}-05-10 09:00:00`, `TST: Tin ${i + 1}`));
      api.newsCount = 65;
    });
    await p.chip('Tất cả').click();
    await p.tab('Bài viết').click();
    await expect(p.tabCount('Bài viết')).toHaveText('65');
    expect(await p.pagerCells()).toEqual(['1', '2', '3', '4']);
    await p.pagerPage(4).click();
    await expect(p.pagerPage(3)).toHaveAttribute('aria-current', 'page');
    await expect(p.rows).toHaveCount(5);
    expect(await p.pagerCells()).toEqual(['1', '2', '3']);
    // trang 4 rỗng → tổng tạm = 3×20 = 60 → về trang 3; trang 3 về 5 bài (< 20) → tổng chốt = 2×20 + 5 = 45
    await expect(p.tabCount('Bài viết')).toHaveText('45');
  });
});

// =====================================================================================================================
test.describe('Ô nổi khi rê chuột', () => {
  test('TC_TTSK_36: Rê chuột dòng báo cáo — mã · nguồn · ngày, tên, khuyến nghị + giá mục tiêu, tóm tắt tách từng câu', async ({ page }) => {
    const p = await openReady(page);
    await p.row('Khó để cạnh tranh').hover();
    await expect(p.tip).toBeVisible();
    await expect(p.tipKicker).toHaveText(new RegExp(`FPT\\s*VCBS\\s*·\\s*${vn(`${Y}-01-05`)}`));
    await expect(p.tipTitle).toHaveText('FPT - Khó để cạnh tranh');
    await expect(p.tipRec).toContainText('TRUNG LẬP');
    await expect(p.tipRec).toContainText(/Giá mục tiêu\s*51,585/);
    await expect(p.tipRec).toHaveClass(/tone-hold/);
    // tách câu ở dấu . ! ; nhưng giữ nguyên "13.754", "EV/EBITDA", "12,1%"
    await expect(p.tipSummary).toHaveText(['Doanh thu tăng 12,1% lên 13.754 tỷ đồng.', 'Chỉ số EV/EBITDA giữ ở mức 9,5 lần!', 'Lợi nhuận Q3 đạt 2.723 tỷ đồng.']);
  });

  test('TC_TTSK_37: Rê chuột dòng tài liệu — dòng đầu "loại · kỳ" (nghị quyết ghi "Ngày ký"), không khuyến nghị / tóm tắt', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Bản cáo bạch & BCTN').click();
    await p.row('Bản điều lệ').hover();
    await expect(p.tipKicker).toHaveText(new RegExp(`FPT\\s*Điều lệ\\s*·\\s*Năm ${Y}`));
    await expect(p.tipTitle).toHaveText('Bản điều lệ');
    await expect(p.tipRec).toHaveCount(0);
    await expect(p.tipSummary).toHaveCount(0);
    await p.tab('Nghị quyết').click();
    await p.row('(02-01-').hover();
    await expect(p.tipKicker).toHaveText(new RegExp(`FPT\\s*Nghị quyết\\s*·\\s*Ngày ký 02/01/${Y}`));
    await p.row('tăng vốn').hover();
    await expect(p.tipKicker).toHaveText(new RegExp(`Nghị quyết\\s*·\\s*Năm ${Y - 2}$`));
  });

  test('TC_TTSK_38: Rời chuột khỏi dòng → ô nổi ẩn; bấm mở báo cáo → ô nổi ẩn', async ({ page }) => {
    const p = await openReady(page);
    await p.row('Khó để cạnh tranh').hover();
    await expect(p.tip).toBeVisible();
    await page.mouse.move(800, 860);
    await expect(p.tip).toHaveCount(0);
    await p.row('Khó để cạnh tranh').hover();
    await expect(p.tip).toBeVisible();
    await p.row('Khó để cạnh tranh').click();
    await expect(p.reportModal).toBeVisible();
    await expect(p.tip).toHaveCount(0);
  });

  test('TC_TTSK_39: Chi tiết các báo cáo của trang được nạp trước lúc rảnh; rê chuột không gọi lại API chi tiết', async ({ page }) => {
    const p = await openReady(page);
    await expect.poll(() => new Set(p.api.calls(DETAIL).map((c) => c.path.split('/').pop())).size, { timeout: 15000 }).toBe(5);
    await page.waitForTimeout(800);
    const before = p.api.count(DETAIL);
    await p.row('Khó để cạnh tranh').hover();
    await expect(p.tipSummary).toHaveCount(3);
    await p.row('CNTT dẫn dắt').hover();
    await expect(p.tipSummary).toHaveCount(2);
    expect(p.api.count(DETAIL)).toBe(before);
  });

  test('TC_TTSK_40: Khuyến nghị — MUA xanh, BÁN đỏ, TRUNG LẬP trung tính; nhiều mã giống nhau ("MUA,MUA") lấy 1, khác nhau thì bỏ', async ({ page }) => {
    const p = await openReady(page);
    await p.chip('Tất cả').click();
    await expect(p.rows).toHaveCount(7);
    const cases: [string, RegExp | null, string | null][] = [
      ['CNTT dẫn dắt', /tone-buy/, 'MUA'],
      ['Rủi ro tăng', /tone-sell/, 'BÁN'],
      ['Khó để cạnh tranh', /tone-hold/, 'TRUNG LẬP'],
      ['Báo cáo ngành công nghệ', /tone-buy/, 'MUA'],
      ['Báo cáo chiến lược', null, null],
    ];
    for (const [row, tone, label] of cases) {
      await p.row(row).hover();
      await expect(p.tipTitle).toContainText(row);
      if (tone) {
        await expect(p.tipRec).toHaveClass(tone);
        await expect(p.tipRec.locator('.bc-tip-kn-nhan')).toHaveText(label!);
      } else {
        await expect(p.tipRec).toHaveCount(0);
      }
    }
    await p.row('Báo cáo ngành công nghệ').hover();
    await expect(p.tipRec).toContainText(/Giá mục tiêu\s*30,000/);
  });
});

// =====================================================================================================================
test.describe('Cửa sổ "Báo cáo phân tích"', () => {
  test('TC_TTSK_41: Báo cáo có tóm tắt → cửa sổ: mã · "Báo cáo phân tích" · nguồn · ngày, "Xem tài liệu gốc", Khuyến nghị + giá + tiềm năng, Tóm tắt', async ({ page }) => {
    const p = await openReady(page);
    await p.row('CNTT dẫn dắt').click();
    await expect(p.reportModal).toBeVisible();
    await expect(p.rmCode).toHaveText('FPT');
    await expect(p.rmKicker).toContainText(new RegExp(`Báo cáo phân tích\\s*·\\s*MIRAE\\s*·\\s*${vn(`${Y}-01-04`)}`));
    await expect(p.rmSource).toHaveAttribute('href', 'https://kfsp.vn/kungfu_files/BCPhanTich/TEST/102.pdf');
    await expect(p.rmSource).toHaveAttribute('target', '_blank');
    await expect(p.rmTitle).toHaveText('Khuyến nghị');
    await expect(p.rmRec).toHaveClass(/tone-buy/);
    await expect(p.rmRec).toHaveAttribute('title', 'FPT - CNTT dẫn dắt');
    await expect(p.rmRec.locator('.arm-rec-tag')).toHaveText('MUA');
    await expect(p.rmRec).toContainText(/Giá mục tiêu\s*76,363/);
    await expect(p.rmRec.locator('.arm-rec-up')).toHaveText(/\+?15[.,]2\s*%/);
    await expect(p.rmBody.locator('.arm-h6')).toHaveText(/Tóm tắt/i);
    await expect(p.rmPoints).toHaveText(['Câu một.', 'Câu hai.']);
    // Nút "Xem mọi báo cáo của <mã>" chỉ có khi mở từ chuông
    await expect(p.rmAllReports).toHaveCount(0);
  });

  test('TC_TTSK_42: Báo cáo không có khuyến nghị → tiêu đề là tên báo cáo, không có khối khuyến nghị', async ({ page }) => {
    const p = await openReady(page);
    await p.chip('Tất cả').click();
    await p.row('Báo cáo cũ').click();
    await expect(p.rmTitle).toHaveText('Báo cáo cũ');
    await expect(p.rmRec).toHaveCount(0);
    await expect(p.rmPoints).toHaveText(['Báo cáo cũ có tóm tắt.']);
  });

  test('TC_TTSK_43: Báo cáo chưa có tóm tắt nhưng có PDF → mở thẳng PDF ở tab mới, không mở cửa sổ', async ({ page }) => {
    const p = await openReady(page);
    await p.row('Vững vàng vượt khó').click();
    await expect.poll(() => p.opened()).toEqual(['https://kfsp.vn/kungfu_files/BCPhanTich/TEST/103.pdf']);
    await page.waitForTimeout(800);
    await expect(p.reportModal).toHaveCount(0);
  });

  test('TC_TTSK_44: Chưa có tóm tắt + trình duyệt chặn popup → lùi về cửa sổ chỉ có phần đầu (không có "Tóm tắt") kèm "Xem tài liệu gốc"', async ({ page }) => {
    const p = await openReady(page, undefined, { popupBlocked: true });
    await p.row('Vững vàng vượt khó').click();
    await expect(p.reportModal).toBeVisible();
    await expect(p.rmTitle).toHaveText('FPT - Vững vàng vượt khó');
    await expect(p.rmSource).toHaveAttribute('href', 'https://kfsp.vn/kungfu_files/BCPhanTich/TEST/103.pdf');
    await expect(p.rmBody).toHaveCount(0);
    await expect(p.reportModal).toHaveClass(/arm-khong-than/);
  });

  test('TC_TTSK_45: Lỗi API chi tiết → "Không lấy được tóm tắt (lỗi 500 / mạng)." + "Thử lại" → lần sau thành công hiện tóm tắt', async ({ page }) => {
    const p = await openReady(page, (api) => { api.detailMode = '500'; });
    await p.row('Khó để cạnh tranh').click();
    await expect(p.reportModal).toBeVisible();
    await expect(p.rmError).toContainText('Không lấy được tóm tắt (lỗi 500).');
    p.api.detailMode = 'abort';
    await p.rmRetry.click();
    await expect(p.rmError).toContainText('Không lấy được tóm tắt (lỗi mạng).');
    p.api.detailMode = 'ok';
    await p.rmRetry.click();
    await expect(p.rmPoints).toHaveCount(3);
    await expect(p.rmTitle).toHaveText('Khuyến nghị');
    expect(p.pageErrors).toEqual([]);
  });
});

// =====================================================================================================================
test.describe('Phân quyền & điều hướng trong app', () => {
  test('TC_TTSK_48: Tài khoản Free — vào được trang, xem đủ dữ liệu thật, không bị khoá (không có ProtectedView)', async ({ page }) => {
    const p = new ThongTinSuKienPage(page);
    await p.open({ account: 'free', fake: false });
    await p.waitLoaded();
    await expect(page).toHaveURL(/\/thong-tin-su-kien/);
    await expect(page.locator('.blurred-image')).toHaveCount(0);
    await expect(p.rows.first()).toBeVisible();
    await p.rows.first().hover();
    await expect(p.tip).toBeVisible();
  });

  test('TC_TTSK_49: Đổi query ngay trên trang (?mack=VNM&nhom=bao-cao-phan-tich, như nút "Xem mọi báo cáo" của chuông) → chuyển tab + đổi mã, không tải lại trang', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Bài viết').click();
    await page.evaluate(() => { (window as unknown as { __marker: number }).__marker = 1; });
    await p.routerPush('/thong-tin-su-kien?mack=VNM&nhom=bao-cao-phan-tich');
    await expect(p.tab('Báo cáo phân tích')).toHaveAttribute('aria-selected', 'true');
    await expect(p.codeTitle).toHaveText('VNM');
    await expect(p.rows.first()).toContainText('VNM -');
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
  });

  test('TC_TTSK_50: Chưa có mã đang xem → "Chưa chọn mã cổ phiếu" + hướng dẫn, ẩn thanh tab, không gọi API', async ({ page }) => {
    const p = await openReady(page);
    const before = p.api.count(LIST);
    await p.setStoreCode('');
    await expect(p.emptyState).toContainText('Chưa chọn mã cổ phiếu');
    await expect(p.emptyState).toContainText('Nhập mã ở ô tìm kiếm phía trên để xem tài liệu, báo cáo và sự kiện của doanh nghiệp');
    await expect(p.tabs).toHaveCount(0);
    await page.waitForTimeout(800);
    expect(p.api.count(LIST)).toBe(before);
  });
});
