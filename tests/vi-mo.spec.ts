import { test, expect } from '@playwright/test';
import { ViMoPage, MACRO_TABS, macroTable } from '../pages/ViMoPage';
import { useReadOnlySafetyNet } from '../pages/ReadOnlySafetyNet';

/**
 * Màn "Vĩ mô" (/vi-mo). Testcase: testcases/vi-mo.md.
 * Chạy trên localhost:8080 (nhánh preprod, backend PRODUCTION) — màn chỉ đọc; `useReadOnlySafetyNet` huỷ mọi request ghi
 * tới *.kfsp.vn / *.vietpointer.vn và assert không có request nào bị huỷ ngoài dự kiến.
 *
 * Chạy: npx playwright test tests/vi-mo.spec.ts --project=chromium --workers=2
 */
test.use({ viewport: { width: 1600, height: 900 } });
test.setTimeout(90_000);
useReadOnlySafetyNet(test);

const PERIODS = ['T01 2026', 'T02 2026', 'T03 2026'];

// =====================================================================================================================
test.describe('Điều hướng & Tổng quan', () => {
  test('TC_VIMO_01: Menu "Phân tích cơ bản › Vĩ mô" mở trang /vi-mo', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.open();
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const nav = page.locator('.c-header-nav-items');
    await nav.getByRole('link', { name: 'Phân tích cơ bản' }).first().hover();
    const item = page.getByRole('link', { name: 'Vĩ mô', exact: true });
    await item.waitFor({ state: 'visible' });
    await item.click();
    await expect(page).toHaveURL(/\/vi-mo$/);
    await expect(p.overviewTitle).toBeVisible({ timeout: 20_000 });
  });

  test('TC_VIMO_02: Giao diện Tổng quan — tiêu đề, 6 chỉ số nổi bật, không có thanh tab, có tuyên bố trách nhiệm', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openReady();
    await expect(p.overviewTitle).toHaveText(/^TỔNG QUAN TÌNH HÌNH KINH TẾ \d{1,2} THÁNG ĐẦU NĂM \d{4}$/);
    await expect(p.viewDetailLink).toBeVisible();
    await expect(p.bubbles).toHaveCount(6);
    const contents = await p.bubbles.evaluateAll((els) => els.map((e) => e.getAttribute('data-content') || ''));
    expect(contents[3]).toMatch(/tỷ USD$/);
    for (const i of [0, 1, 2, 4, 5]) expect(contents[i]).toMatch(/^[+-]?\d+(\.\d+)?%$/);
    await expect(p.tabs).toHaveCount(0);
    await expect(p.selects).toHaveCount(0);
    await expect(p.disclaimer).toBeVisible();
  });

  test('TC_VIMO_03: Tổng quan có đủ 9 khối theo thứ tự', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openReady();
    const titles = (await p.overview.locator('.overlay-box').allInnerTexts()).map((s) => s.trim());
    expect(titles).toEqual(['Tổng thu nhập GDP', 'Sản xuất công nghiệp IIP', 'Bán lẻ và dịch vụ', 'Cán cân thương mại',
      'Đầu tư', 'Khách quốc tế', 'Vận tải', 'Doanh nghiệp', 'Chỉ số giá']);
    await expect(p.overviewSection('Đầu tư')).toContainText('Ngân sách nhà nước');
    await expect(p.overviewSection('Đầu tư')).toContainText('FDI');
    await expect(p.overviewSection('Khách quốc tế')).toContainText('Châu Á');
    await expect(p.overviewSection('Doanh nghiệp')).toContainText('Đăng ký mới');
  });

  test('TC_VIMO_04: Định dạng 6 chỉ số nổi bật theo dữ liệu API (dấu +/-, cán cân đổi triệu → tỷ USD)', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockOverview((d) => ({
      ...d,
      tong_quan: { gdp: 7.5, iip: -1.2, ban_le_dich_vu: 0, can_can_thuong_mai: 23456.789, fdi: 10, cpi: 3.21 },
    }));
    await p.openReady();
    await expect.poll(() => p.bubbles.evaluateAll((els) => els.map((e) => e.getAttribute('data-content'))))
      .toEqual(['+7.5%', '-1.2%', '0%', '+23.46 tỷ USD', '+10%', '+3.21%']);
  });

  test('TC_VIMO_05: Tiêu đề lấy tháng/năm từ kỳ mới nhất của Cán cân thương mại', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockOverview((d) => ({
      ...d, can_can_thuong_mai: { ...d.can_can_thuong_mai, thoigian: ['T7 2031', ...d.can_can_thuong_mai.thoigian.slice(1)] },
    }));
    await p.openReady();
    await expect(p.overviewTitle).toHaveText('TỔNG QUAN TÌNH HÌNH KINH TẾ 7 THÁNG ĐẦU NĂM 2031');
  });

  test('TC_VIMO_06: Khối Vận tải — chuyển "Hành khách" ↔ "Hàng hóa" đổi số liệu', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openReady();
    const box = p.overviewSection('Vận tải');
    const units = () => box.locator('.unit').allInnerTexts();
    await expect.poll(async () => (await units()).join('|')).toMatch(/hành khách/i);
    await box.getByRole('button', { name: 'Hàng hóa' }).click();
    await expect.poll(async () => (await units()).join('|')).not.toMatch(/hành khách/i);
    await expect(box.getByRole('button', { name: 'Hàng hóa' })).toHaveCSS('color', 'rgb(255, 255, 255)');
    await box.getByRole('button', { name: 'Hành khách' }).click();
    await expect.poll(async () => (await units()).join('|')).toMatch(/hành khách/i);
  });

  test('TC_VIMO_07: API Tổng quan lỗi 500 — trang không vỡ, khung + tuyên bố trách nhiệm vẫn hiển thị', async ({ page }) => {
    const p = new ViMoPage(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await p.mockOverview(500);
    await p.open();
    await expect(p.overview).toBeVisible({ timeout: 20_000 });
    await expect(p.viewDetailLink).toBeVisible();
    await expect(p.overviewTitle).toHaveText(/^TỔNG QUAN TÌNH HÌNH KINH TẾ\s+THÁNG ĐẦU NĂM\s*$/);
    await expect(p.disclaimer).toBeVisible();
    await expect(page).toHaveURL(/\/vi-mo$/);
    expect(errors).toEqual([]);
  });
});

// =====================================================================================================================
test.describe('Chi tiết — thanh tab & ô chọn', () => {
  test('TC_VIMO_08: "Xem chi tiết" → tab GDP: 13 tab đúng thứ tự, mô tả GDP, 3 ô chọn mặc định, gọi API đúng tham số', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    expect((await p.tabs.allInnerTexts()).map((s) => s.trim())).toEqual([...MACRO_TABS]);
    await expect(p.activeTab).toHaveText('GDP');
    await expect(p.descriptionTitle).toContainText('GDP - Gross Domestic Product');
    await expect(p.selects).toHaveCount(3);
    expect(await p.optionsOf(0)).toEqual(['GDP danh nghĩa', 'GDP thực']);
    expect(await p.optionsOf(1)).toEqual(['Quý', 'Lũy kế (từ đầu năm)']);
    expect(await p.optionsOf(2)).toEqual(['Giá trị']);
    await expect(p.selects.nth(0)).toHaveValue('gdphh');
    await expect(p.selects.nth(1)).toHaveValue('quarter');
    expect(p.lastCall()).toEqual({ type: 'gdp', kieu_baocao: 'quarter', kieu_dulieu: 'value', typeTab: 'gdphh' });
    await expect(page).toHaveURL(/\/vi-mo$/);
  });

  test('TC_VIMO_09: Bảng chi tiết — cột Chỉ tiêu/Đơn vị + các kỳ, dòng đầu có đơn vị được chọn sẵn, ghi chú GSO', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    const heads = (await p.headerCells.allInnerTexts()).map((s) => s.trim());
    expect(heads.slice(0, 2)).toEqual(['Chỉ tiêu', 'Đơn vị']);
    expect(heads.length).toBeGreaterThan(4);
    for (const h of heads.slice(2)) expect(h).toMatch(/^T\d{1,2} \d{4}$/);
    await expect(p.rows.first().locator('td').first()).toHaveText(/TỔNG SỐ/);
    await expect(p.highlightedRows()).toHaveCount(1);
    await expect(p.highlightedRows().first()).toContainText('TỔNG SỐ');
    await expect(p.chartBox.locator('canvas').first()).toBeVisible();
    await expect(p.gsoNote).toBeVisible();
  });

  test('TC_VIMO_10: GDP — đổi "GDP thực" gọi typeTab=gdpss và mở thêm lựa chọn "Tăng trưởng"', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.selects.nth(0).selectOption('gdpss');
    await expect.poll(() => p.lastCall()?.typeTab).toBe('gdpss');
    await expect.poll(() => p.optionsOf(2)).toEqual(['Giá trị', 'Tăng trưởng']);
    await p.selects.nth(2).selectOption('growth');
    await expect.poll(() => p.lastCall()).toEqual({ type: 'gdp', kieu_baocao: 'quarter', kieu_dulieu: 'growth', typeTab: 'gdpss' });
    await expect(p.rows.first()).toBeVisible();
  });

  test('TC_VIMO_11: GDP — đổi kỳ "Lũy kế (từ đầu năm)" gọi kieu_baocao=cumulative', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.selects.nth(1).selectOption('cumulative');
    await expect.poll(() => p.lastCall()?.kieu_baocao).toBe('cumulative');
    await expect(p.rows.first()).toBeVisible();
  });

  test('TC_VIMO_12: Tab IIP — 1 ô kỳ (Tháng/Lũy kế), không có ô dữ liệu, gọi kieu_dulieu=growth', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.clickTab('IIP');
    await expect(p.activeTab).toHaveText('IIP');
    await expect(p.descriptionTitle).toContainText('IIP - Index of Industrial');
    await expect(p.selects).toHaveCount(1);
    expect(await p.optionsOf(0)).toEqual(['Tháng', 'Lũy kế (từ đầu năm)']);
    await expect.poll(() => p.lastCall()).toEqual({ type: 'iip', kieu_baocao: 'month', kieu_dulieu: 'growth', typeTab: '' });
  });

  test('TC_VIMO_13: Tab Xuất - Nhập khẩu — 3 ô chọn; đổi "Nhập khẩu" gọi typeTab=nhap_khau', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.clickTab('Xuất - Nhập khẩu');
    await expect(p.descriptionTitle).toContainText('XUẤT - NHẬP KHẨU');
    await expect(p.selects).toHaveCount(3);
    expect(await p.optionsOf(0)).toEqual(['Xuất khẩu', 'Nhập khẩu']);
    expect(await p.optionsOf(1)).toEqual(['Tháng', 'Lũy kế (từ đầu năm)']);
    expect(await p.optionsOf(2)).toEqual(['Giá trị', 'Tăng trưởng']);
    await expect.poll(() => p.lastCall()?.typeTab).toBe('xuat_khau');
    await p.selects.nth(0).selectOption('nhap_khau');
    await expect.poll(() => p.lastCall()).toEqual({ type: 'xuat_nhap_khau', kieu_baocao: 'month', kieu_dulieu: 'value', typeTab: 'nhap_khau' });
  });

  test('TC_VIMO_14: Tab Vận tải — đổi "Hàng hóa" gọi typeTab=hang_hoa', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.clickTab('Vận tải');
    await expect(p.descriptionTitle).toContainText('VẬN TẢI');
    expect(await p.optionsOf(0)).toEqual(['Hành khách', 'Hàng hóa']);
    await p.selects.nth(0).selectOption('hang_hoa');
    await expect.poll(() => p.lastCall()?.typeTab).toBe('hang_hoa');
    await expect(p.rows.first()).toBeVisible();
  });

  test('TC_VIMO_15: Tab Tín dụng — kỳ Tháng/Năm + Giá trị/Tăng trưởng; đổi "Năm" gọi kieu_baocao=year', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.clickTab('Tín dụng');
    await expect(p.descriptionTitle).toContainText('TÍN DỤNG');
    expect(await p.optionsOf(0)).toEqual(['Tháng', 'Năm']);
    expect(await p.optionsOf(1)).toEqual(['Giá trị', 'Tăng trưởng']);
    await p.selects.nth(0).selectOption('year');
    await expect.poll(() => p.lastCall()?.kieu_baocao).toBe('year');
    // Tín dụng không có dòng "Số liệu ước tính tại từng tháng theo GSO".
    await expect(p.gsoNote).toHaveCount(0);
  });

  test('TC_VIMO_16: Tab FDI và Dân số - Lao động — không có ô chọn, kỳ mặc định cumulative / year', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.clickTab('FDI');
    await expect(p.descriptionTitle).toContainText('FDI - Foreign Direct');
    await expect(p.selects).toHaveCount(0);
    await expect.poll(() => p.lastCall()).toEqual({ type: 'fdi', kieu_baocao: 'cumulative', kieu_dulieu: 'value', typeTab: '' });
    await p.clickTab('Dân số - Lao động');
    await expect(p.descriptionTitle).toContainText('DÂN SỐ - LAO ĐỘNG');
    await expect(p.selects).toHaveCount(0);
    await expect.poll(() => p.lastCall()).toEqual({ type: 'dan_so_lao_dong', kieu_baocao: 'year', kieu_dulieu: 'value', typeTab: '' });
    await expect.poll(async () => (await p.headerCells.allInnerTexts()).map((s) => s.trim()).slice(2).every((h) => /^\d{4}$/.test(h))).toBe(true);
  });

  test('TC_VIMO_17: Các tab còn lại hiển thị đúng mô tả + có bảng (Bán lẻ, CPI, Đầu tư NSNN, Chỉ tiêu DN, Du lịch)', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    const map: [Parameters<ViMoPage['clickTab']>[0], string, string][] = [
      ['Bán lẻ và Dịch vụ', 'BÁN LẺ VÀ DỊCH VỤ', 'ban_le'],
      ['CPI', 'CPI - Consumer Price', 'cpi'],
      ['Đầu tư NSNN', 'ĐẦU TƯ NGÂN SÁCH NHÀ NƯỚC', 'von_dau_tu'],
      ['Chỉ tiêu doanh nghiệp', 'CHỈ TIÊU DOANH NGHIỆP', 'chi_tieu_doanh_nghiep'],
      ['Du lịch', 'DU LỊCH', 'du_lich'],
    ];
    for (const [tab, title, type] of map) {
      await p.clickTab(tab);
      await expect(p.activeTab).toHaveText(tab);
      await expect(p.descriptionTitle).toContainText(title);
      await expect.poll(() => p.lastCall()?.type).toBe(type);
      await expect(p.rows.first()).toBeVisible();
    }
  });

  test('TC_VIMO_18: Bấm tab "Tổng quan" quay lại trang tổng quan, thanh tab biến mất', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.clickTab('Tổng quan');
    await expect(p.overviewTitle).toBeVisible();
    await expect(p.tabs).toHaveCount(0);
    await expect(p.table).toHaveCount(0);
  });

  test('TC_VIMO_19: F5 khi đang ở tab chi tiết → quay về Tổng quan (tab không lưu trên URL)', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.clickTab('CPI');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(p.overviewTitle).toBeVisible({ timeout: 20_000 });
    await expect(p.tabs).toHaveCount(0);
  });
});

// =====================================================================================================================
test.describe('Chi tiết — bảng & biểu đồ (dữ liệu giả lập)', () => {
  test('TC_VIMO_20: Định dạng bảng — kỳ "T01" → "T1", số có dấu phẩy nghìn, đơn vị "%" trừ 100, ô 0/rỗng để trống', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockByType((q) => macroTable(PERIODS, [
      ['Tổng mức bán lẻ', 'Tỷ đồng', 1234567.891, 0, null],
      ['Tăng trưởng', '%', 105.5, 98.25, 100],
      ['Nhóm hàng hoá', '', 1, 2, 3],
    ]));
    await p.openDetail();
    expect((await p.headerCells.allInnerTexts()).map((s) => s.trim())).toEqual(['Chỉ tiêu', 'Đơn vị', 'T1 2026', 'T2 2026', 'T3 2026']);
    const cells = async (i: number) => (await p.rows.nth(i).locator('td').allInnerTexts()).map((s) => s.trim());
    expect(await cells(0)).toEqual(['Tổng mức bán lẻ', 'Tỷ đồng', '1,234,567.89', '', '']);
    expect(await cells(1)).toEqual(['Tăng trưởng', '%', '5.5', '-1.75', '']);
    // Dòng không có đơn vị là dòng tiêu đề nhóm → không hiện giá trị.
    expect(await cells(2)).toEqual(['Nhóm hàng hoá', '', '', '', '']);
  });

  test('TC_VIMO_21: Tab Tín dụng — giá trị "%" giữ nguyên, không trừ 100', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockByType((q) => macroTable(PERIODS, q.type === 'tin_dung'
      ? [['Tăng trưởng tín dụng', '%', 12.5, 13, 14.25]]
      : [['TỔNG SỐ', 'Tỷ đồng', 1, 2, 3]]));
    await p.openDetail();
    await p.clickTab('Tín dụng');
    await expect(p.rows.first()).toContainText('Tăng trưởng tín dụng');
    expect((await p.rows.first().locator('td').allInnerTexts()).map((s) => s.trim())).toEqual(['Tăng trưởng tín dụng', '%', '12.5', '13', '14.25']);
  });

  test('TC_VIMO_22: Tab FDI — "Vốn thực hiện" lên đầu, dòng "Tổng" đổi tên "Vốn đăng ký" đứng thứ hai', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockByType((q) => macroTable(PERIODS, q.type === 'fdi'
      ? [['Tổng', 'Triệu USD', 100, 200, 300], ['Cấp mới', 'Triệu USD', 50, 60, 70], ['Vốn thực hiện', 'Triệu USD', 10, 20, 30]]
      : [['TỔNG SỐ', 'Tỷ đồng', 1, 2, 3]]));
    await p.openDetail();
    await p.clickTab('FDI');
    await expect(p.rows.first()).toContainText('Vốn thực hiện');
    const firstCol = (await p.table.locator('tbody tr td:first-child').allInnerTexts()).map((s) => s.trim());
    expect(firstCol).toEqual(['Vốn thực hiện', 'Vốn đăng ký', 'Cấp mới']);
    await expect(p.highlightedRows()).toHaveCount(1);
    await expect(p.highlightedRows()).toContainText('Vốn thực hiện');
  });

  test('TC_VIMO_23: Bấm dòng chỉ tiêu → thêm vào biểu đồ (tô sáng); bấm lại → bỏ; dòng cuối cùng không bỏ được', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockByType(() => macroTable(PERIODS, [
      ['Nhóm A', '', null, null, null],
      ['Chỉ tiêu 1', 'Tỷ đồng', 10, 20, 30],
      ['Chỉ tiêu 2', '%', 101, 102, 103],
      ['Chỉ tiêu 3', 'Tỷ đồng', 5, 6, 7],
    ]));
    await p.openDetail();
    // Dòng đầu tiên CÓ đơn vị được chọn sẵn (bỏ qua dòng tiêu đề nhóm).
    await expect(p.highlightedRows()).toHaveCount(1);
    await expect(p.highlightedRows()).toContainText('Chỉ tiêu 1');
    await p.rowByIndicator('Chỉ tiêu 2').locator('td').first().click();
    await p.rowByIndicator('Chỉ tiêu 3').locator('td').nth(2).click();
    await expect(p.highlightedRows()).toHaveCount(3);
    await p.rowByIndicator('Chỉ tiêu 1').locator('td').first().click();
    await expect(p.highlightedRows()).toHaveCount(2);
    await expect(p.rowByIndicator('Chỉ tiêu 1')).not.toHaveAttribute('style', /kfsp-hover-item-color/);
    // Dòng tiêu đề nhóm (không đơn vị) không chọn được.
    await p.rowByIndicator('Nhóm A').locator('td').first().click();
    await expect(p.highlightedRows()).toHaveCount(2);
    await p.rowByIndicator('Chỉ tiêu 2').locator('td').first().click();
    await expect(p.highlightedRows()).toHaveCount(1);
    // Chỉ còn 1 chỉ tiêu trên biểu đồ → bấm không bỏ được.
    await p.rowByIndicator('Chỉ tiêu 3').locator('td').first().click();
    await expect(p.highlightedRows()).toHaveCount(1);
    await expect(p.highlightedRows()).toContainText('Chỉ tiêu 3');
  });

  test('TC_VIMO_24: Thu gọn / mở lại khung "Biểu đồ"', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await expect(p.chartBox).toBeVisible();
    await p.chartToggle.click();
    await expect(p.chartBox).toBeHidden();
    await expect(p.rows.first()).toBeVisible();
    await p.chartToggle.click();
    await expect(p.chartBox).toBeVisible();
  });

  test('TC_VIMO_25: Nút phóng to biểu đồ mở cửa sổ lớn; bấm nền để đóng', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.openDetail();
    await p.chartExpandButton.click();
    await expect(p.chartModal).toBeVisible();
    await expect(p.chartModal.locator('.modal-xl')).toHaveCount(1);
    await expect(p.chartModal.locator('canvas').first()).toBeVisible();
    await p.chartModal.click({ position: { x: 10, y: 10 } });
    await expect(p.chartModal).toHaveCount(0);
  });
});

// =====================================================================================================================
test.describe('Lỗi API & dữ liệu rỗng', () => {
  test('TC_VIMO_26: API chi tiết lỗi 500 — không có bảng, thanh tab + ô chọn + mô tả vẫn dùng được', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockByType(() => 500);
    await p.openReady();
    await p.viewDetailLink.click();
    await expect(p.activeTab).toHaveText('GDP');
    await expect(p.selects).toHaveCount(3);
    await page.waitForTimeout(1500);
    await expect(p.table).toHaveCount(0);
    await p.clickTab('CPI');
    await expect(p.activeTab).toHaveText('CPI');
  });

  test('TC_VIMO_27: API chi tiết chỉ có hàng tiêu đề (không có chỉ tiêu) — không hiển thị bảng', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.mockByType(() => macroTable(PERIODS, []));
    await p.openReady();
    await p.viewDetailLink.click();
    await expect(p.activeTab).toHaveText('GDP');
    await page.waitForTimeout(1500);
    await expect(p.table).toHaveCount(0);
  });
});

// =====================================================================================================================
test.describe('Phân quyền', () => {
  test('TC_VIMO_29: Tài khoản Free — cả trang bị khoá (ảnh mờ "vi_mo"), không gọi API dữ liệu vĩ mô', async ({ page }) => {
    const p = new ViMoPage(page);
    await p.open('free');
    await expect(p.protectedView).toBeVisible({ timeout: 20_000 });
    await expect(p.protectedView).toHaveAttribute('src', /vi_mo/);
    await expect(p.overview).toHaveCount(0);
    // Lớp chữ + nút hiện đè giữa ảnh → rê chuột ở góc khung để không bị che.
    await page.locator('main .image-container').hover({ position: { x: 20, y: 20 } });
    const box = page.locator('main .image-container');
    await expect(box.getByText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này.')).toBeVisible();
    await expect(box.getByRole('button', { name: 'Đăng ký ngay' })).toBeVisible();
    expect(p.overviewCalls).toBe(0);
  });
});
