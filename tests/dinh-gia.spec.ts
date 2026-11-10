import { test, expect, Page } from '@playwright/test';
import { useFaSafetyNet } from '../pages/FaAnalysisPage';
import { DinhGiaPage, FakeDgApi, DgOpenOptions, BASE_MARGIN, money, calc } from '../pages/DinhGiaPage';

/**
 * Màn "Định giá" (/dinh-gia, component MarginSafety). Testcase: testcases/dinh-gia.md.
 * Chạy trên BASE_URL (localhost:8080 = nhánh preprod, backend PRODUCTION). Đăng nhập qua `Prev2Session`.
 * Số liệu đầu vào giả lập bằng `FakeDgApi` (EPS 4.000, tăng trưởng 10%, P/E tương lai 15…) để tính lại kết quả
 * chính xác; giá hiện tại là giá thật qua socket. Mẫu định giá (lưu / sửa tên / xoá) LUÔN giả lập — không ghi thật.
 * TC_DINHGIA_01 dùng dữ liệu thật; TC_DINHGIA_14 dùng tài khoản Free.
 *
 * Chạy: npx playwright test tests/dinh-gia.spec.ts --project=chromium --workers=2
 */
test.use({ viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);
useFaSafetyNet(test);

const TPL_CONTENT = {
  mack: 'FPT', input_eps_ttm: 5000, input_ty_le_tang_truong_tuong_lai: 12, input_thoi_gian_dau_tu: 5, input_pe_tuong_lai: 18,
  input_ty_le_sinh_loi_toi_thieu: 12, input_bien_an_toan: 40, input_fcf_tren_moi_co_phieu: '3000', input_fcf_ttm: 3000000,
  input_thoi_gian_muon_hoan_von_fcf: '8', input_thoi_gian_muon_hoan_von_eps: '8', data_filter_type_safe_zone: 'mos',
};

function seed(api: FakeDgApi) {
  api.templates = [
    { id: 901, label: 'Mẫu FPT tăng trưởng', content: JSON.stringify(TPL_CONTENT) },
    { id: 902, label: 'Mẫu thận trọng', content: JSON.stringify({ ...TPL_CONTENT, input_bien_an_toan: 60 }) },
  ];
}

async function openReady(page: Page, setup?: (api: FakeDgApi) => void, opts: DgOpenOptions = {}) {
  const p = new DinhGiaPage(page);
  seed(p.api);
  setup?.(p.api);
  await p.open(opts);
  return p;
}

/** Giá hiện tại web đang dùng (ô "Giá cổ phiếu hiện tại", socket thật) — chờ tới khi khác 0. */
async function livePrice(p: DinhGiaPage): Promise<number> {
  await expect(p.result('Giá cổ phiếu hiện tại')).not.toHaveText('0', { timeout: 30000 });
  return Number((await p.result('Giá cổ phiếu hiện tại').innerText()).replace(/,/g, ''));
}

const BASE = { eps: 4000, g: 10, years: 3, pe: 15, r: 15, mos: 50, fcfps: 2000 };

// =====================================================================================================================
test.describe('Điều hướng & hiển thị', () => {
  test('TC_DINHGIA_01: Menu "Phân tích cơ bản" → "Định giá" mở trang, dữ liệu thật đổ vào ô nhập và kết quả', async ({ page }) => {
    const p = new DinhGiaPage(page);
    await p.open({ mock: false, startPath: '/dashboard' });
    const nav = page.locator('.c-header-nav-items');
    await nav.getByRole('link', { name: 'Phân tích cơ bản' }).first().hover();
    const item = page.getByRole('link', { name: 'Định giá', exact: true });
    await item.waitFor({ state: 'visible' });
    await item.click();
    await expect(page).toHaveURL(/\/dinh-gia$/);
    await p.waitLoaded();
    expect(await p.currentMack()).toMatch(/^[A-Z0-9]{3,}$/);
    await expect(p.result('Giá trị hiện tại')).not.toHaveText('0');
    await expect(nav.getByRole('link', { name: 'Phân tích cơ bản' }).locator('div').first()).toHaveClass(/active-tab-overview/);
  });

  test('TC_DINHGIA_02: Bố cục — 3 nút Lưu/Khôi phục/Mở mẫu, 15 dòng thông số, "Kết quả tính toán" có biểu đồ, tuyên bố trách nhiệm', async ({ page }) => {
    const p = await openReady(page);
    await expect(p.saveBtn).toContainText('Lưu');
    await expect(p.resetBtn).toBeVisible();
    await expect(p.openTplBtn).toBeVisible();
    for (const label of ['Mã CK', 'EPS TTM (PV)', 'Tỷ lệ tăng trưởng tương lai', 'Thời gian đầu tư', 'EPS tương lai', 'P/E tương lai',
      'Giá trị tương lai', 'Tỷ lệ sinh lời tối thiểu', 'Tỷ lệ FCF', 'FCF/s', 'Số lượng cổ phiếu', 'FCF TTM', 'OCF TTM', 'CAPEX TTM']) {
      await expect(p.row(label), label).toBeVisible();
    }
    await expect(p.zoneSelect.locator('option')).toHaveText(['MOS', 'FCF', 'EPS']);
    await expect(page.getByText('Kết quả tính toán', { exact: true })).toBeVisible();
    await expect(page.getByText('KẾT QUẢ', { exact: true })).toBeVisible();
    await expect(page.getByText('THỐNG KÊ NHANH', { exact: true })).toBeVisible();
    await expect(p.chart).toBeVisible();
    await expect(page.getByText('Tuyên bố trách nhiệm/Disclaimer')).toBeVisible();
    await expect(page.getByText(/Không nên định giá các doanh nghiệp có tính chu kỳ/)).toBeVisible();
  });

  test('TC_DINHGIA_03: Số liệu mặc định lấy từ API — ô nhập + ô tính sẵn (chỉ đọc)', async ({ page }) => {
    const p = await openReady(page);
    const mack = await p.currentMack();
    expect(p.api.marginCalls).toContain(mack);
    expect(p.api.defaultCalls).toContain(mack);
    await expect(p.input('EPS TTM (PV)')).toHaveValue('4000');
    await expect(p.input('Tỷ lệ tăng trưởng tương lai')).toHaveValue('10');
    await expect(p.input('Thời gian đầu tư')).toHaveValue('3');
    await expect(p.input('P/E tương lai')).toHaveValue('15');
    await expect(p.input('Tỷ lệ sinh lời tối thiểu')).toHaveValue('15');
    await expect(p.input('FCF/s')).toHaveValue('2000.00');
    await expect(p.zoneSelect).toHaveValue('mos');
    await expect(p.zoneInput).toHaveValue('50');
    // Ô xám: placeholder là số đã tính, chỉ đọc.
    const c = calc({ ...BASE, price: 0 });
    for (const [label, v] of [['EPS tương lai', money(c.epsFuture, 0, 0)], ['Giá trị tương lai', money(c.fvFuture, 0, 0)], ['Tỷ lệ FCF', '0.5'],
      ['Số lượng cổ phiếu', '1,000'], ['FCF TTM', '2,000,000'], ['OCF TTM', '3,000,000'], ['CAPEX TTM', '-1,000,000']] as const) {
      await expect(p.input(label), label).toHaveAttribute('placeholder', v);
      await expect(p.input(label), label).toHaveAttribute('readonly', /.*/);
    }
  });

  test('TC_DINHGIA_04: KẾT QUẢ + 2 ô vùng tính đúng công thức (PV, biên an toàn 50%, MOS yield, vùng đỏ = 1,2 × giá trị hiện tại)', async ({ page }) => {
    const p = await openReady(page);
    const c = calc({ ...BASE, price: 0 });
    await expect(p.result('Giá trị hiện tại')).toHaveText(money(c.pv));
    await expect(p.resultLabel(/^\s*Giá biên an toàn 50%\s*$/)).toBeVisible();
    await expect(p.result(/^\s*Giá biên an toàn/)).toHaveText(money(c.safe));
    await expect(p.result('Tỷ suất biên an toàn (MOS yield)')).toHaveText(`${money(c.mosYield)}%`);
    await expect(p.result('Giá tại năm muốn hoàn vốn theo FCF/s')).toHaveText(money(c.atYearFcf));
    await expect(p.result('Giá tại năm muốn hoàn vốn theo EPS')).toHaveText(money(c.atYearEps));
    await expect(p.greenZone).toHaveText(money(c.safe));
    await expect(p.redZone).toHaveText(money(c.red));
  });
});

// =====================================================================================================================
test.describe('Nhập liệu & tính lại', () => {
  test('TC_DINHGIA_06: Sửa EPS TTM → ô tính sẵn và KẾT QUẢ tính lại', async ({ page }) => {
    const p = await openReady(page);
    await p.input('EPS TTM (PV)').fill('5000');
    const c = calc({ ...BASE, eps: 5000, price: 0 });
    await expect(p.input('EPS tương lai')).toHaveAttribute('placeholder', money(c.epsFuture, 0, 0));
    await expect(p.result('Giá trị hiện tại')).toHaveText(money(c.pv));
    await expect(p.greenZone).toHaveText(money(c.safe));
    await expect(p.input('Tỷ lệ FCF')).toHaveAttribute('placeholder', '0.4');
  });

  test('TC_DINHGIA_07: Vùng an toàn theo FCF → ô số năm hoàn vốn (mặc định 8), vùng xanh = giá tại năm muốn hoàn vốn theo FCF/s', async ({ page }) => {
    const p = await openReady(page);
    await p.zoneSelect.selectOption('fcf');
    await expect(p.zoneInput).toHaveValue('8');
    const c = calc({ ...BASE, price: 0 });
    await expect(p.greenZone).toHaveText(money(c.atYearFcf));
    await p.zoneInput.fill('5');
    await expect(p.greenZone).toHaveText(money(calc({ ...BASE, price: 0, yFcf: 5 }).atYearFcf));
    // Vùng đỏ không phụ thuộc cách xác định vùng an toàn.
    await expect(p.redZone).toHaveText(money(c.red));
  });

  test('TC_DINHGIA_08: "Khôi phục" → các ô về số mặc định của mã, kết quả tính lại', async ({ page }) => {
    const p = await openReady(page);
    await p.input('EPS TTM (PV)').fill('9999');
    await p.input('Thời gian đầu tư').fill('7');
    await p.zoneInput.fill('20');
    await p.resetBtn.click();
    await expect(p.input('EPS TTM (PV)')).toHaveValue('4000');
    await expect(p.input('Thời gian đầu tư')).toHaveValue('3');
    await expect(p.zoneInput).toHaveValue('50');
    await expect(p.result('Giá trị hiện tại')).toHaveText(money(calc({ ...BASE, price: 0 }).pv));
  });

  test('TC_DINHGIA_09: Đổi mã ở ô "Mã CK" (chọn gợi ý) → gọi lại API cho mã mới, số liệu đổi theo', async ({ page }) => {
    const p = await openReady(page, (api) => {
      api.margin.SSI = { ...BASE_MARGIN, eps_ttm: 2500, bvps: 18000 };
      api.defaults.SSI = { pe_tuong_lai: 12, ty_le_tang_truong_tuong_lai: 6 };
    });
    test.skip((await p.currentMack()) === 'SSI', 'mã mặc định của tài khoản trùng mã thử');
    await p.chooseMack('SSI');
    await expect(p.mackInput).toHaveValue('SSI');
    await expect.poll(() => p.api.marginCalls).toContain('SSI');
    await expect(p.input('EPS TTM (PV)')).toHaveValue('2500');
    await expect(p.input('P/E tương lai')).toHaveValue('12');
    await expect(p.result(/^\s*BVPS\s*$/)).toHaveText('18,000');
  });
});

// =====================================================================================================================
test.describe('Mẫu định giá (giả lập, không ghi thật)', () => {
  test('TC_DINHGIA_10: "Mở mẫu" → danh sách mẫu đã lưu (Tên · Sửa tên · Xoá), ô tìm kiếm lọc theo tên', async ({ page }) => {
    const p = await openReady(page);
    await p.openTplBtn.click();
    await expect(p.listModal).toBeVisible();
    await expect(p.listModal.locator('tbody tr')).toHaveCount(2);
    await expect(p.tplRow('Mẫu FPT tăng trưởng')).toContainText('Sửa tên');
    await expect(p.tplRow('Mẫu FPT tăng trưởng')).toContainText('Xoá');
    await p.listModal.locator('input').first().fill('thận');
    await expect(p.listModal.locator('tbody tr')).toHaveCount(1);
    await expect(p.listModal.locator('tbody tr')).toContainText('Mẫu thận trọng');
    await p.listModal.getByRole('button', { name: 'Đóng' }).click();
    await expect(p.listModal).toHaveCount(0);
  });

  test('TC_DINHGIA_11: Chọn 1 mẫu → nạp mã + mọi thông số của mẫu, hiện "Đang chọn mẫu: …"; bấm X bỏ chọn', async ({ page }) => {
    const p = await openReady(page);
    await p.openTplBtn.click();
    await p.tplRow('Mẫu FPT tăng trưởng').locator('.model_label').click();
    await expect(p.listModal).toHaveCount(0);
    await expect(p.selectedTpl).toHaveText('Đang chọn mẫu: Mẫu FPT tăng trưởng');
    await expect(p.mackInput).toHaveValue('FPT');
    await expect(p.input('EPS TTM (PV)')).toHaveValue('5000');
    await expect(p.input('Thời gian đầu tư')).toHaveValue('5');
    await expect(p.input('P/E tương lai')).toHaveValue('18');
    await expect(p.zoneInput).toHaveValue('40');
    await expect(p.resultLabel(/^\s*Giá biên an toàn 40%\s*$/)).toBeVisible();
    await p.deselectTpl.click();
    await expect(p.selectedTpl).toHaveCount(0);
  });

  test('TC_DINHGIA_12: Lưu mẫu mới với mã mặc định (không đổi mã) → gửi đúng tên + toàn bộ thông số, mẫu thành mẫu đang chọn', async ({ page }) => {
    const p = await openReady(page);
    await livePrice(p);
    const mack = await p.currentMack();
    await p.saveBtn.click();
    await p.addModal.getByPlaceholder('Nhập tên mẫu').fill('Mẫu autotest');
    await p.addModal.getByRole('button', { name: 'Lưu' }).click();
    await expect.poll(() => p.api.stores.length, { message: 'web không gửi lệnh lưu mẫu' }).toBe(1);
    expect(p.api.stores[0].label).toBe('Mẫu autotest');
    expect(JSON.parse(p.api.stores[0].content as string)).toMatchObject({ mack, input_eps_ttm: 4000, input_bien_an_toan: 50, data_filter_type_safe_zone: 'mos' });
    await expect(p.addModal).toHaveCount(0);
    await expect(p.selectedTpl).toHaveText('Đang chọn mẫu: Mẫu autotest');
  });

  test('TC_DINHGIA_13: Xoá mẫu → hỏi "Bạn có muốn xóa không?", đồng ý → gửi DELETE, mẫu biến mất', async ({ page }) => {
    const p = await openReady(page);
    await p.openTplBtn.click();
    await p.tplRow('Mẫu FPT tăng trưởng').getByText('Xoá').click();
    await expect(p.deleteModal).toBeVisible();
    await p.deleteModal.getByRole('button', { name: 'Xóa' }).click();
    await expect.poll(() => p.api.deletes).toEqual(['901']);
    await expect(p.deleteModal).toHaveCount(0);
    await expect(p.tplRow('Mẫu FPT tăng trưởng')).toHaveCount(0);
    await expect(p.listModal.locator('tbody tr')).toHaveCount(1);
  });
});

// =====================================================================================================================
test.describe('Phân quyền & lỗi API', () => {
  test('TC_DINHGIA_14: Tài khoản Free → ảnh mờ "nâng cấp" (ProtectedView), không có ô nhập, không gọi API định giá', async ({ page }) => {
    const p = new DinhGiaPage(page);
    seed(p.api);
    await p.open({ account: 'free', wait: false });
    await expect(page).toHaveURL(/\/dinh-gia/);
    await expect(p.blurred).toBeVisible({ timeout: 45000 });
    await expect(page.locator('input[placeholder="Nhập mã CK"]:visible')).toHaveCount(0);
    await expect(page.getByText('Kết quả tính toán', { exact: true })).toHaveCount(0);
    expect(p.api.marginCalls).toHaveLength(0);
  });

  test('TC_DINHGIA_15: API số liệu lỗi 500 → hộp tải tự đóng, ô nhập về 0, trang không treo', async ({ page }) => {
    const p = await openReady(page, (api) => { api.marginMode = '500'; }, { wait: false });
    await expect(p.mackInput).toBeVisible({ timeout: 45000 });
    await expect(p.loadingModal).toBeHidden({ timeout: 30000 });
    await expect(p.input('EPS TTM (PV)')).toHaveValue('0');
    await expect(p.result('Giá trị hiện tại')).toHaveText('0');
  });
});
