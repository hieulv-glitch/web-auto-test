import { test, expect, Page } from '@playwright/test';
import { CoHoiTiemNangPage, FakeOppApi, ChtnOpenOptions, useOppSafetyNet, ranked, hit } from '../pages/CoHoiTiemNangPage';

/**
 * Màn "Cơ hội tiềm năng" (/co-hoi-tiem-nang). Testcase: testcases/co-hoi-tiem-nang.md.
 * Chạy trên BASE_URL (localhost:8080 = nhánh preprod, backend PRODUCTION). Đăng nhập qua `Prev2Session`.
 * Phần lớn test dùng `FakeOppApi` (dữ liệu cố định); TC_CHTN_01 + TC_CHTN_30 dùng dữ liệu thật,
 * TC_CHTN_31 dùng tài khoản Free (dữ liệu thật, máy chủ đã ẩn mã).
 *
 * Chạy: npx playwright test tests/co-hoi-tiem-nang.spec.ts --project=chromium --workers=2
 */
test.use({ viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);
useOppSafetyNet(test);

const pad = (n: number) => String(n).padStart(2, '0');
const ddmmyy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
function daysSince(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  return Math.max(0, Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(y, m - 1, d).getTime()) / 864e5));
}
function yearAgo() {
  const n = new Date();
  const today = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return { today, from: d.toISOString().slice(0, 10) };
}

/** 5 mã AI theo thứ tự backend ("recent"); 4 mẫu Hai đáy + 1 Vai đầu vai ngược + 1 mẫu không có tab (Ba đáy). */
function seed(api: FakeOppApi) {
  api.ranking = [
    // Lệnh mua cố ý không theo thứ tự ngày → "Mua gần nhất" phải là 20/10/26, không phải phần tử cuối.
    ranked('FPT', 'CÔNG NGHỆ', 8.5, 100000, '2026-10-01', [['2026-10-01', 95000, 14.2], ['2026-10-20', 100000, 8.5], ['2026-10-10', 105000, 3.3]]),
    ranked('HPG', 'THÉP', 2.1, 25000, '2026-11-03', [['2026-11-03', 25000, 2.1]]),
    ranked('SHS', 'CHỨNG KHOÁN', 12.3, 13000, '2026-09-15', [['2026-09-15', 12500, 16.8], ['2026-10-02', 13500, 8.1]]),
    ranked('VCB', 'NGÂN HÀNG', 0.5, 60000, '2026-10-25', [['2026-10-25', 59000, 2.2], ['2026-10-28', 61000, -1.1]]),
    ranked('ACV', 'HÀNG KHÔNG', 5.0, 90000, '2026-10-05', [['2026-10-05', 90000, 5.0]]),
  ];
  api.patterns = [
    hit('PVS', 'Hai đáy', { neckline: 40000, cancel: 35000, target: 46000, current: 36000, h: 15, patternDay: '2026-10-20' }),
    hit('DGC', 'Hai đáy', {
      neckline: 100000, cancel: 85000, target: 115000, current: 97000, h: 15, patternDay: '2026-10-25',
      points: [{ date: '2026-09-01', label: 'Đáy 1', price: 85000 }, { date: '2026-09-20', label: 'Đỉnh giữa', price: 100000 }, { date: '2026-10-25', label: 'Đáy 2', price: 86000 }],
    }),
    hit('MWG', 'Hai đáy', { status: 'confirmed', neckline: 60000, cancel: 50000, target: 70000, current: 63000, h: 16.7, patternDay: '2026-10-30' }),
    hit('GEX', 'Hai đáy', { status: 'potential_break', neckline: 20000, cancel: 17000, target: 23000, current: 19500, h: 15, patternDay: '2026-11-02' }),
    hit('VHM', 'Vai đầu vai ngược', { neckline: 50000, cancel: 42000, target: 58000, current: 48000, h: 16, patternDay: '2026-11-05' }),
    hit('NVL', 'Ba đáy', { neckline: 15000, cancel: 12000, target: 18000, current: 14000, h: 20, patternDay: '2026-11-01' }),
  ];
}

async function openReady(page: Page, setup?: (api: FakeOppApi) => void, opts: ChtnOpenOptions = {}) {
  const p = new CoHoiTiemNangPage(page);
  seed(p.api);
  setup?.(p.api);
  await p.open(opts);
  return p;
}

const AI_DEFAULT = ['FPT', 'HPG', 'SHS', 'VCB', 'ACV'];

// =====================================================================================================================
test.describe('Điều hướng & hiển thị', () => {
  test('TC_CHTN_01: Menu "Cơ hội" → "Cơ hội tiềm năng" mở trang, dữ liệu thật hiển thị, menu "Cơ hội" được tô sáng', async ({ page }) => {
    const p = new CoHoiTiemNangPage(page);
    await p.open({ mock: false, wait: false, startPath: '/dashboard' });
    const nav = page.locator('.c-header-nav-items');
    await nav.getByRole('link', { name: 'Cơ hội' }).first().hover();
    const item = page.getByRole('link', { name: 'Cơ hội tiềm năng', exact: true });
    await item.waitFor({ state: 'visible' });
    await item.click();
    await expect(page).toHaveURL(/\/co-hoi-tiem-nang$/);
    await p.waitReady();
    await expect(p.tab('AI Mua/Bán')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.rows.first()).toBeVisible({ timeout: 30000 });
    const n = await p.rows.count();
    await expect(p.footer).toContainText(`${n} mã`);
    await expect(nav.getByRole('link', { name: 'Cơ hội' }).locator('div').first()).toHaveClass(/active-tab-overview/);
  });

  test('TC_CHTN_02: Đang tải → skeleton "AI đang tìm cơ hội cho bạn…" rồi mới hiện bảng', async ({ page }) => {
    const p = await openReady(page, (api) => { api.rankingMode = 'slow'; api.patternsMode = 'slow'; }, { wait: false });
    await expect(p.loading).toBeVisible({ timeout: 30000 });
    await expect(p.loading).toContainText('AI đang tìm cơ hội cho bạn…');
    await expect(p.head).toHaveCount(0);
    await p.waitReady();
    await expect(p.loading).toHaveCount(0);
    await expect(p.rows).toHaveCount(5);
  });

  test('TC_CHTN_03: Dải nhóm — AI Mua/Bán đứng đầu và được chọn, chỉ hiện nhóm mẫu hình có kết quả, rê chuột xem mô tả', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.groupTabs).toHaveText(['AI Mua/Bán', 'Hai đáy', 'Vai đầu vai ngược']);
    await expect(p.tab('AI Mua/Bán')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.tab('AI Mua/Bán')).toHaveAttribute('title', /KFSP AI đã vào lệnh và đang lãi/);
    await expect(p.tab('Hai đáy')).toHaveAttribute('title', /mẫu Hai đáy/);
    // Mẫu "Ba đáy" không có tab → bị bỏ qua; tài khoản trả phí không thấy nhãn Free/Pro.
    await expect(p.groupTabs.filter({ hasText: 'Ba đáy' })).toHaveCount(0);
    await expect(p.root.locator('.opp-plan')).toHaveCount(0);
    await expect(p.hint).toHaveCount(0);
  });

  test('TC_CHTN_04: Nhóm mẫu hình không có kết quả bị ẩn khỏi dải nhóm', async ({ page }) => {
    const p = await openReady(page, (api) => { api.patterns = (api.patterns as { pattern: string }[]).filter((x) => x.pattern !== 'Vai đầu vai ngược'); });
    await expect(p.groupTabs).toHaveText(['AI Mua/Bán', 'Hai đáy']);
  });

  test('TC_CHTN_05: Bảng AI Mua/Bán — đủ cột, thứ tự backend, số liệu định dạng đúng', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.headers).toHaveText(['STT', 'Mã CK', 'Ngành', 'Giá vốn', 'Hiện tại', 'Lãi/lỗ', 'Lệnh mua', 'Mua gần nhất']);
    await expect(p.codes).toHaveText(AI_DEFAULT);
    await expect(p.ranks).toHaveText(['1', '2', '3', '4', '5']);
    const fpt = p.cells(p.rowOf('FPT'));
    await expect(fpt.nth(1)).toHaveText(/FPT\s*HOSE/);
    await expect(fpt.nth(2)).toHaveText('CÔNG NGHỆ');
    await expect(fpt.nth(3)).toHaveText('100.00');
    await expect(fpt.nth(4)).toHaveText('108.50');
    await expect(fpt.nth(5)).toHaveText('+8.5%');
    await expect(fpt.nth(6)).toHaveText('3');
    await expect(fpt.nth(7)).toHaveText('20/10/26');
    await expect(p.cells(p.rowOf('SHS')).nth(1)).toHaveText(/SHS\s*HNX/);
    await expect(p.cells(p.rowOf('ACV')).nth(1)).toHaveText(/ACV\s*UPCOM/);
  });

  test('TC_CHTN_06: Chân bảng — số mã, VN-INDEX, đơn vị "Giá x 1000 VNĐ"', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.footer).toContainText('5 mã');
    await expect(p.footer).toContainText('Giá x 1000 VNĐ');
    await expect(p.footer).toContainText(/VN-INDEX\s*[\d,]+\.\d{2}/, { timeout: 40000 });
  });

  test('TC_CHTN_07: Mặc định chọn dòng đầu — panel chi tiết vị thế AI', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.rows.first()).toHaveAttribute('aria-selected', 'true');
    await expect(p.rows.first()).toHaveClass(/is-selected/);
    await expect(p.detail).toHaveAttribute('aria-label', 'Chi tiết vị thế');
    await expect(p.detailMack).toHaveText('FPT');
    await expect(p.detail.locator('.opp-detail__company')).not.toBeEmpty();
    await expect(p.detailMeta).toContainText(`Mở 01/10/26 · ${daysSince('2026-10-01')} ngày`);
    await expect(p.detailMeta).toContainText('+8.50 /cp');
    await expect(p.detailPnl).toHaveText('+8.5%');
    await expect(p.detailChartSec.locator('h4')).toHaveText('Điểm mua trên biểu đồ');
    const lots = p.detailSection('Lịch sử lệnh mua').locator('tbody tr');
    await expect(lots).toHaveCount(3);
    await expect(lots.nth(0).locator('td')).toHaveText(['Mua #1', '01/10/26', '95.00', '+14.2%']);
    await expect(lots.nth(2).locator('td')).toHaveText(['Mua #3', '10/10/26', '105.00', '+3.3%']);
  });

  test('TC_CHTN_08: Bấm một dòng → dòng được chọn, panel đổi sang mã đó', async ({ page }) => {
    const p = await openReady(page);
    await p.rowOf('SHS').click();
    await expect(p.rowOf('SHS')).toHaveAttribute('aria-selected', 'true');
    await expect(p.rows.first()).toHaveAttribute('aria-selected', 'false');
    await expect(p.detailMack).toHaveText('SHS');
    await expect(p.detailPnl).toHaveText('+12.3%');
    await expect(p.detailSection('Lịch sử lệnh mua').locator('tbody tr')).toHaveCount(2);
  });

  test('TC_CHTN_09: Chọn dòng bằng bàn phím (Tab tới dòng + Enter / Space)', async ({ page }) => {
    const p = await openReady(page);
    await p.rowOf('VCB').focus();
    await page.keyboard.press('Enter');
    await expect(p.detailMack).toHaveText('VCB');
    await p.rowOf('ACV').focus();
    await page.keyboard.press('Space');
    await expect(p.detailMack).toHaveText('ACV');
  });
});

// =====================================================================================================================
test.describe('Sắp xếp', () => {
  test('TC_CHTN_10: Bấm "Lãi/lỗ" → lãi cao xuống thấp; bấm lần nữa → về thứ tự mặc định', async ({ page }) => {
    const p = await openReady(page);
    const th = p.table.locator('thead th', { hasText: 'Lãi/lỗ' });
    await expect(th).toHaveAttribute('aria-sort', 'none');
    await p.sortBtn('Lãi/lỗ').click();
    await expect(p.codes).toHaveText(['SHS', 'FPT', 'ACV', 'HPG', 'VCB']);
    await expect(th).toHaveAttribute('aria-sort', 'descending');
    await expect(th).toHaveClass(/is-sorted/);
    // STT là vị trí sau khi sắp.
    await expect(p.ranks).toHaveText(['1', '2', '3', '4', '5']);
    await p.sortBtn('Lãi/lỗ').click();
    await expect(p.codes).toHaveText(AI_DEFAULT);
    await expect(th).toHaveAttribute('aria-sort', 'none');
  });

  test('TC_CHTN_11: Sắp theo "Ngành" (A → Z) và "Giá vốn" (lớn → bé); cột STT, Mã CK, Mua gần nhất không sắp được', async ({ page }) => {
    const p = await openReady(page);
    await p.sortBtn('Ngành').click();
    await expect(p.codes).toHaveText(['SHS', 'FPT', 'ACV', 'VCB', 'HPG']);
    await expect(p.table.locator('thead th', { hasText: 'Ngành' })).toHaveAttribute('aria-sort', 'ascending');
    await p.sortBtn('Giá vốn').click();
    await expect(p.codes).toHaveText(['FPT', 'ACV', 'VCB', 'HPG', 'SHS']);
    await expect(p.table.locator('thead th', { hasText: 'Ngành' })).toHaveAttribute('aria-sort', 'none');
    for (const label of ['STT', 'Mã CK', 'Mua gần nhất']) {
      await expect(p.table.locator('thead th', { hasText: label }).getByRole('button')).toHaveCount(0);
    }
  });

  test('TC_CHTN_12: Đổi sắp xếp → panel chi tiết quay về mã đầu tiên của danh sách mới', async ({ page }) => {
    const p = await openReady(page);
    await p.rowOf('VCB').click();
    await expect(p.detailMack).toHaveText('VCB');
    await p.sortBtn('Lãi/lỗ').click();
    await expect(p.detailMack).toHaveText('SHS');
    await expect(p.rows.first()).toHaveAttribute('aria-selected', 'true');
  });
});

// =====================================================================================================================
test.describe('Lọc', () => {
  test('TC_CHTN_13: Tìm theo mã (không phân biệt hoa thường) — STT giữ theo danh sách gốc, chân bảng "x / tổng mã", nút xoá', async ({ page }) => {
    const p = await openReady(page);
    await p.search.fill('hp');
    await expect(p.codes).toHaveText(['HPG']);
    await expect(p.ranks).toHaveText(['2']);
    await expect(p.footer).toContainText(/1\s*\/ 5\s*mã/);
    await expect(p.detailMack).toHaveText('HPG');
    await p.clearSearch.click();
    await expect(p.search).toHaveValue('');
    await expect(p.codes).toHaveText(AI_DEFAULT);
    await expect(p.clearSearch).toHaveCount(0);
  });

  test('TC_CHTN_14: Tìm mã không có → "Không có mã nào khớp bộ lọc." + nút "Bỏ lọc" trả lại danh sách', async ({ page }) => {
    const p = await openReady(page);
    await p.search.fill('ZZZ');
    await expect(p.msg).toContainText('Không có mã nào khớp bộ lọc.');
    await expect(p.rows).toHaveCount(0);
    await expect(p.detail).toHaveCount(0);
    await expect(p.footer).toContainText(/0\s*\/ 5\s*mã/);
    await p.clearFilters.click();
    await expect(p.codes).toHaveText(AI_DEFAULT);
    await expect(p.search).toHaveValue('');
  });

  test('TC_CHTN_15: Lọc theo sàn HNX / UPCOM / Tất cả', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.exchangeGroup.getByRole('button')).toHaveText(['Tất cả', 'HOSE', 'HNX', 'UPCOM']);
    await expect(p.exchange('Tất cả')).toHaveAttribute('aria-pressed', 'true');
    await p.exchange('HNX').click();
    await expect(p.exchange('HNX')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.codes).toHaveText(['SHS']);
    await p.exchange('UPCOM').click();
    await expect(p.codes).toHaveText(['ACV']);
    await p.exchange('HOSE').click();
    await expect(p.codes).toHaveText(['FPT', 'HPG', 'VCB']);
    await p.exchange('Tất cả').click();
    await expect(p.rows).toHaveCount(5);
  });

  test('TC_CHTN_16: Lọc theo ngành — danh sách ngành lấy từ chính nhóm đang xem, xếp A → Z', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.industry.locator('option')).toHaveText(['Tất cả ngành', 'CHỨNG KHOÁN', 'CÔNG NGHỆ', 'HÀNG KHÔNG', 'NGÂN HÀNG', 'THÉP']);
    await p.industry.selectOption('NGÂN HÀNG');
    await expect(p.codes).toHaveText(['VCB']);
    await expect(p.detailMack).toHaveText('VCB');
    await p.industry.selectOption('ALL');
    await expect(p.rows).toHaveCount(5);
  });

  test('TC_CHTN_17: Kết hợp sàn + ngành không có mã → thông báo rỗng, "Bỏ lọc" đưa mọi bộ lọc về mặc định', async ({ page }) => {
    const p = await openReady(page);
    await p.exchange('HNX').click();
    await p.industry.selectOption('THÉP');
    await expect(p.msg).toContainText('Không có mã nào khớp bộ lọc.');
    await p.clearFilters.click();
    await expect(p.exchange('Tất cả')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.industry).toHaveValue('ALL');
    await expect(p.rows).toHaveCount(5);
  });
});

// =====================================================================================================================
test.describe('Nhóm mẫu hình', () => {
  test('TC_CHTN_18: Đổi sang "Hai đáy" — bộ cột mẫu hình, bộ lọc trạng thái, thứ tự Thành công → Chờ xác nhận → Nguy cơ huỷ', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.statusGroup).toHaveCount(0);
    await p.tab('Hai đáy').click();
    await expect(p.tab('Hai đáy')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.headers).toHaveText(['STT', 'Mã CK', 'Ngành', 'Trạng thái', 'Giá hiện tại', 'Tới vùng break', 'Trên vùng huỷ', 'LN mục tiêu', 'LN còn lại', 'Phát hiện']);
    await expect(p.statusGroup.getByRole('button')).toHaveText(['Tất cả', 'Chờ xác nhận', 'Nguy cơ huỷ', 'Thành công']);
    // Trong cùng nhóm trạng thái: LN còn lại cao lên trước (DGC 18,6% > GEX 17,9%).
    await expect(p.codes).toHaveText(['MWG', 'DGC', 'GEX', 'PVS']);
    await expect(p.rows.locator('.opp-state')).toHaveText(['Thành công', 'Chờ xác nhận', 'Chờ xác nhận', 'Nguy cơ huỷ']);
    await expect(p.footer).toContainText('4 mã');
  });

  test('TC_CHTN_19: Dòng mẫu hình — giá hiện tại, % tới vùng break / trên vùng huỷ, LN mục tiêu, LN còn lại, ngày phát hiện', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Hai đáy').click();
    const dgc = p.cells(p.rowOf('DGC'));
    await expect(dgc.nth(4)).toHaveText('97.00');
    await expect(dgc.nth(5)).toHaveText(fmtPct((97000 - 100000) / 100000 * 100));
    await expect(dgc.nth(5)).toHaveClass(/fw/); // chờ xác nhận → ô "Tới vùng break" in đậm
    await expect(dgc.nth(6)).toHaveText(fmtPct((97000 - 85000) / 85000 * 100));
    await expect(dgc.nth(7)).toHaveText('+15.0%');
    await expect(dgc.nth(8)).toHaveText(fmtPct((115000 - 97000) / 97000 * 100));
    await expect(dgc.nth(9)).toHaveText('25/10/26');
    // Nguy cơ huỷ → ô "Trên vùng huỷ" in đậm.
    await expect(p.cells(p.rowOf('PVS')).nth(6)).toHaveClass(/fw/);
  });

  test('TC_CHTN_20: Lọc trạng thái "Nguy cơ huỷ" / "Thành công"', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Hai đáy').click();
    await p.status('Nguy cơ huỷ').click();
    await expect(p.status('Nguy cơ huỷ')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.codes).toHaveText(['PVS']);
    await expect(p.ranks).toHaveText(['4']);
    await p.status('Thành công').click();
    await expect(p.codes).toHaveText(['MWG']);
    await p.status('Chờ xác nhận').click();
    await expect(p.codes).toHaveText(['DGC', 'GEX']);
  });

  test('TC_CHTN_21: Panel chi tiết mẫu hình — 3 mốc giá + khoảng cách, các điểm của mẫu, "phát hiện N ngày trước"', async ({ page }) => {
    const p = await openReady(page);
    await p.tab('Hai đáy').click();
    await p.rowOf('DGC').click();
    await expect(p.detail).toHaveAttribute('aria-label', 'Chi tiết mẫu hình');
    await expect(p.detailMack).toHaveText('DGC');
    await expect(p.detail.locator('.opp-detail__title .opp-state')).toHaveText('Chờ xác nhận');
    await expect(p.detailMeta).toContainText(`Hai đáy · phát hiện ${daysSince('2026-10-25')} ngày trước`);
    await expect(p.detailPnl).toHaveText(fmtPct((115000 - 97000) / 97000 * 100));
    await expect(p.detailChartSec.locator('h4')).toHaveText('Mẫu hình trên biểu đồ');
    const levels = p.detail.locator('.opp-detail__sec').filter({ hasText: 'Giá mục tiêu' }).locator('tbody tr');
    await expect(levels.nth(0).locator('td')).toHaveText(['Giá mục tiêu', '115.00', fmtPct((115 / 97 - 1) * 100)]);
    await expect(levels.nth(1).locator('td')).toHaveText(['Vùng break', '100.00', fmtPct((100 / 97 - 1) * 100)]);
    await expect(levels.nth(2).locator('td')).toHaveText(['Vùng huỷ', '85.00', fmtPct((85 / 97 - 1) * 100)]);
    const pts = p.detailSection('Các điểm của mẫu hình').locator('tbody tr');
    await expect(pts).toHaveCount(3);
    await expect(pts.nth(1).locator('td')).toHaveText(['Đỉnh giữa', '20/09/26', '100.00']);
  });

  test('TC_CHTN_22: Đổi nhóm → bỏ sắp xếp đang chọn; ngành không còn trong nhóm mới → về "Tất cả ngành"', async ({ page }) => {
    const p = await openReady(page);
    await p.sortBtn('Lãi/lỗ').click();
    await p.industry.selectOption('HÀNG KHÔNG');
    await expect(p.codes).toHaveText(['ACV']);
    await p.tab('Hai đáy').click();
    await expect(p.industry).toHaveValue('ALL');
    await expect(p.rows).toHaveCount(4);
    await p.tab('AI Mua/Bán').click();
    await expect(p.codes).toHaveText(AI_DEFAULT);
    await expect(p.table.locator('thead th', { hasText: 'Lãi/lỗ' })).toHaveAttribute('aria-sort', 'none');
  });

  test('TC_CHTN_23: Mở sẵn nhóm qua URL `?g=default_pattern_vai_day`; `g` trỏ tới nhóm rỗng → về nhóm đầu', async ({ page }) => {
    const p = await openReady(page, undefined, { query: '?g=default_pattern_vai_day' });
    await expect(p.tab('Vai đầu vai ngược')).toHaveAttribute('aria-pressed', 'true');
    await expect(p.codes).toHaveText(['VHM']);
    const p2 = new CoHoiTiemNangPage(page);
    await page.goto('/co-hoi-tiem-nang?g=khong_ton_tai', { waitUntil: 'domcontentloaded' });
    await p2.waitReady();
    await expect(p2.tab('AI Mua/Bán')).toHaveAttribute('aria-pressed', 'true');
  });

  test('TC_CHTN_24: Request tìm mẫu hình gửi đúng tham số (mẫu đáy, 3 trạng thái, 1 năm gần nhất, entryGate)', async ({ page }) => {
    const p = await openReady(page);
    await expect.poll(() => p.api.patternBodies.length).toBeGreaterThan(0);
    const { today, from } = yearAgo();
    expect(p.api.patternBodies[0]).toEqual({
      status: ['forming', 'potential_break', 'confirmed'], patterns: ['Hai đáy', 'Vai đầu vai ngược'],
      endDateFrom: from, endDateTo: today, entryGate: true,
    });
    expect(p.api.rankingCalls[0]).toMatch(/sortBy=recent/);
    // Đổi nhóm qua lại không gọi lại API (cache trong phiên).
    await p.tab('Hai đáy').click();
    await p.tab('AI Mua/Bán').click();
    await expect(p.rows).toHaveCount(5);
    expect(p.api.rankingCalls.length).toBe(1);
    expect(p.api.patternBodies.length).toBe(1);
  });
});

// =====================================================================================================================
test.describe('Trạng thái rỗng / lỗi', () => {
  test('TC_CHTN_25: Nhóm AI rỗng → "Chưa có mã nào trong danh mục AI đang lãi.", không có panel, chân bảng "0 mã"', async ({ page }) => {
    const p = await openReady(page, (api) => { api.ranking = []; });
    await expect(p.msg).toContainText('Chưa có mã nào trong danh mục AI đang lãi.');
    await expect(p.clearFilters).toHaveCount(0);
    await expect(p.detail).toHaveCount(0);
    await expect(p.footer).toContainText('0 mã');
    await expect(p.industry).toHaveCount(0);
  });

  test('TC_CHTN_26: API xếp hạng lỗi 500 → báo lỗi + "Thử lại" nạp lại thành công; nhóm mẫu hình vẫn dùng được', async ({ page }) => {
    const p = await openReady(page, (api) => { api.rankingMode = '500'; });
    await expect(p.msg).toContainText('Không tải được bảng xếp hạng. Thử lại sau.');
    await p.tab('Hai đáy').click();
    await expect(p.rows).toHaveCount(4);
    await p.tab('AI Mua/Bán').click();
    p.api.rankingMode = 'ok';
    await p.retry.click();
    await expect(p.codes).toHaveText(AI_DEFAULT);
    expect(p.api.rankingCalls.length).toBe(2);
  });
});

// =====================================================================================================================
test.describe('Điều hướng ra ngoài', () => {
  test('TC_CHTN_28: "Quản lý thông báo" → mở Trung tâm thông báo, mục cài đặt Cơ hội tiềm năng', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.notifyLink).toHaveAttribute('href', '/trung-tam-thong-bao?view=signal');
    await p.notifyLink.click();
    await expect(page).toHaveURL(/\/trung-tam-thong-bao\?view=signal/);
  });

  test('TC_CHTN_29: Nút "Xem biểu đồ" ở panel → mở modal biểu đồ của đúng mã', async ({ page }) => {
    const p = await openReady(page);
    await p.rowOf('HPG').click();
    await expect(p.detailMack).toHaveText('HPG');
    await p.detailChartBtn.click();
    const modal = page.locator('.modal.show').filter({ has: page.locator('.TVChartContainer, iframe') }).last();
    await expect(modal).toBeVisible({ timeout: 20000 });
    await expect(modal).toContainText('HPG', { timeout: 20000 });
  });
});

// =====================================================================================================================
test.describe('Dữ liệu thật & phân quyền', () => {
  test('TC_CHTN_30: Dữ liệu thật — mỗi dòng có mã, sàn, % lãi; nhóm mẫu hình (nếu có) hiện trạng thái hợp lệ', async ({ page }) => {
    const p = new CoHoiTiemNangPage(page);
    await p.open({ mock: false });
    await expect(p.rows.first()).toBeVisible({ timeout: 30000 });
    const n = await p.rows.count();
    expect(n).toBeGreaterThan(0);
    await expect(p.codes).toHaveCount(n);
    for (const t of await p.table.locator('tbody tr.opp-row td:nth-child(6)').allTextContents()) expect(t).toMatch(/^[+-]\d+\.\d%$/);
    const tabs = await p.groupTabs.allTextContents();
    if (tabs.length > 1) {
      await p.groupTabs.nth(1).click();
      await expect(p.rows.first()).toBeVisible();
      for (const s of await p.rows.locator('.opp-state').allTextContents()) expect(['Thành công', 'Chờ xác nhận', 'Nguy cơ huỷ']).toContain(s.trim());
    }
  });

  test('TC_CHTN_31: Tài khoản Free — nhãn Pro, ẩn ô tìm + lọc sàn, mã/giá làm mờ, không có biểu đồ, "Mở khoá" mở bảng gói', async ({ page }) => {
    const p = new CoHoiTiemNangPage(page);
    await p.open({ mock: false, account: 'free' });
    await p.dismissPackageModalIfShown();
    await expect(page).toHaveURL(/\/co-hoi-tiem-nang/);
    await expect(p.hint).toContainText('Mở khóa toàn bộ cơ hội');
    await expect(p.hint).toContainText('Nâng cấp để xem đầy đủ thông tin & giá mục tiêu');
    await expect(p.groupTabs.first().locator('.opp-plan')).toHaveText('Pro');
    await expect(p.search).toHaveCount(0);
    await expect(p.exchangeGroup).toHaveCount(0);
    await expect(p.rows.first()).toBeVisible({ timeout: 30000 });
    // Mã/sàn/ngành là chữ GIỮ CHỖ làm mờ (không phải dữ liệu thật), giá vốn/hiện tại = "00.00".
    const first = p.cells(p.rows.first());
    await expect(first.nth(1).locator('.opp-lock-num')).toHaveText(['KFS', 'HOSE']);
    await expect(first.nth(1)).toHaveAttribute('title', 'Nâng cấp để xem mã');
    await expect(first.nth(3)).toHaveText('00.00');
    await expect(p.detailChartSec).toHaveCount(0);
    await expect(p.detailMack).toHaveText('KFS');
    await p.hint.getByRole('button', { name: 'Mở khoá' }).click();
    await expect(p.packageModal.first()).toBeVisible({ timeout: 15000 });
  });
});
