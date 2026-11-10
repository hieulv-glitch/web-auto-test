import { test, expect } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { ChartTemplateLinkPage, tpl, Template, LinkSync, IFRAME } from '../pages/ChartTemplateLinkPage';

/**
 * Biểu đồ: Lưu mẫu chỉ báo + Liên kết thẻ theo kiểu đồng bộ — testcases/bieu-do-mau-chi-bao-lien-ket.md.
 * Chạy trên `PREV2_BASE_URL` (kfsp.vn = preprod mới nhất). Đọc/ghi mẫu chỉ báo đi qua máy chủ giả, ghi bố cục bị chặn
 * (xem đầu pages/ChartTemplateLinkPage.ts).
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(150_000);

const MA21 = { ten: 'Moving Average', thong_so: { length: 21 }, chung_khung_gia: true };
const RSI7 = { ten: 'Relative Strength Index', thong_so: { length: 7 } };

let p: ChartTemplateLinkPage;
test.beforeEach(({ page }) => { p = new ChartTemplateLinkPage(page); });
test.afterEach(() => {
  expect(p.blockedWrites2, 'không được có lệnh ghi nào khác tới máy chủ thật').toEqual([]);
});

async function openOne(opts: { templates?: Template[] | string; account?: 'paid' | 'free' } = {}) {
  await p.openTpl({ layout: { frames: [[{ symbol: 'VNM' }]] }, ...opts });
  await p.waitChartsReady();
}
/** 2 khung VNM | HPG cùng nhóm Cam với kiểu đồng bộ `sync` (undefined = nhóm cũ chưa có link_sync). */
async function openLinked(sync?: LinkSync, intervals: [string, string] = ['1D', '1D'], settle = true) {
  await p.openTpl({
    layout: { frames: [[{ symbol: 'VNM', interval: intervals[0], link: 'link-1' }], [{ symbol: 'HPG', interval: intervals[1], link: 'link-1' }]] },
    linkSync: sync ? { 'link-1': sync } : undefined,
  });
  await p.waitChartsReady();
  // Biểu đồ chỉ coi là "nạp xong" 3,5 giây sau khi dựng (ReactChartTA is_loaded) — đổi chỉ báo trước đó không đồng bộ (TC_34).
  if (settle) await p.browserPage.waitForTimeout(4000);
}
async function saveAs(name: string) {
  await p.openTemplateMenu();
  await p.templateSaveRow().click();
  await expect(p.dialogTitle).toHaveText('Lưu mẫu chỉ báo');
  await p.nameInput.fill(name);
  await p.dialogBtn('Lưu').click();
}
async function dragChart(i: number, dx: number) {
  const box = (await p.browserPage.locator(IFRAME).nth(i).boundingBox())!;
  await p.browserPage.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4);
  await p.browserPage.mouse.down();
  await p.browserPage.mouse.move(box.x + box.width * 0.5 + dx, box.y + box.height * 0.4, { steps: 15 });
  await p.browserPage.mouse.up();
}

// =====================================================================================================
test.describe('Mẫu chỉ báo — menu', () => {
  test('TC_BDLK_01: Nút "Mẫu chỉ báo" trên thanh biểu đồ; chưa có mẫu → menu chỉ có dòng "Lưu chỉ báo thành mẫu…"', async () => {
    await openOne({ templates: [] });
    await expect(p.templateButton()).toHaveAttribute('title', 'Lưu bộ chỉ báo thành mẫu, áp mẫu vào biểu đồ');
    await p.openTemplateMenu();
    await expect(p.templateMenu().locator('.custom-dropdown-menu-item')).toHaveText(['Lưu chỉ báo thành mẫu…']);
    await expect(p.templateMenu().locator('.custom-dropdown-menu-sep')).toHaveCount(0);
  });

  test('TC_BDLK_02: Có mẫu → đường kẻ + mỗi mẫu một dòng xếp theo tên, có nút "Đổi tên" và "Xoá"; mở menu đọc lại danh sách từ máy chủ', async () => {
    await openOne({ templates: [tpl('Bộ MA', [MA21]), tpl('a RSI', [RSI7]), tpl('Chỉ báo C', [RSI7])] });
    // Sau khi mở trang, máy chủ có thêm 1 mẫu (lưu từ tab khác / app) → menu phải hiện ra.
    p.store.templates = [...p.store.templates, tpl('Từ app', [RSI7])];
    await p.openTemplateMenu();
    await expect.poll(() => p.templateNames()).toEqual(['a RSI', 'Bộ MA', 'Chỉ báo C', 'Từ app']);
    expect(p.store.reads).toBeGreaterThan(0);
    await expect(p.templateMenu().locator('.custom-dropdown-menu-sep')).toHaveCount(1);
    const row = p.templateRow('Bộ MA');
    await expect(row.locator('.custom-template-icon[title="Đổi tên"]')).toHaveCount(1);
    await expect(row.locator('.custom-template-icon[title="Xoá"]')).toHaveCount(1);
  });

  test('TC_BDLK_03: Bấm ra ngoài menu → menu đóng; bấm nút lần nữa → mở lại', async () => {
    await openOne({ templates: [tpl('Bộ MA', [MA21])] });
    await p.openTemplateMenu();
    const box = (await p.browserPage.locator(IFRAME).first().boundingBox())!;
    await p.browserPage.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.6);
    await expect(p.templateMenu()).toHaveCount(0);
    await p.openTemplateMenu();
    await expect.poll(() => p.templateNames()).toEqual(['Bộ MA']);
  });

  test('TC_BDLK_04: Biểu đồ không có chỉ báo → "Lưu chỉ báo thành mẫu…" báo lỗi, không mở hộp, không ghi', async () => {
    await openOne();
    await p.chartApi(0, 'chart.removeAllStudies(); return 1;');
    await expect.poll(() => p.studies(0)).toEqual([]);
    await p.openTemplateMenu();
    await p.templateSaveRow().click();
    await expect(p.toastError.filter({ hasText: 'Biểu đồ này chưa có chỉ báo nào để lưu' })).toBeVisible();
    await expect(p.templateMenu()).toHaveCount(0);
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes).toEqual([]);
  });

  test('TC_BDLK_05: Tài khoản Free không có nút "Mẫu chỉ báo"', async () => {
    await openOne({ account: 'free' });
    await expect(p.frameAt(0).locator('[data-name="legend-source-item"]').first()).toBeVisible();
    await expect(p.templateButton()).toHaveCount(0);
  });
});

// =====================================================================================================
test.describe('Mẫu chỉ báo — lưu', () => {
  test('TC_BDLK_06: Hộp "Lưu mẫu chỉ báo": ô "Tên mẫu" focus sẵn, tối đa 40 ký tự; Huỷ đóng hộp, không ghi', async () => {
    await openOne();
    await p.openTemplateMenu();
    await p.templateSaveRow().click();
    await expect(p.dialogTitle).toHaveText('Lưu mẫu chỉ báo');
    await expect(p.dialog.locator('.itd-label')).toHaveText('Tên mẫu');
    await expect(p.nameInput).toBeFocused();
    await expect(p.nameInput).toHaveValue('');
    await expect(p.nameInput).toHaveAttribute('maxlength', '40');
    await p.nameInput.pressSequentially('y'.repeat(45));
    await expect(p.nameInput).toHaveValue('y'.repeat(40));
    await p.dialogBtn('Huỷ').click();
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes).toEqual([]);
  });

  test('TC_BDLK_07: Tên trống / chỉ khoảng trắng → "Nhập tên mẫu", không ghi; gõ lại thì lỗi mất', async () => {
    await openOne();
    await p.openTemplateMenu();
    await p.templateSaveRow().click();
    await p.dialogBtn('Lưu').click();
    await expect(p.nameError).toHaveText('Nhập tên mẫu');
    await expect(p.nameInput).toHaveClass(/itd-input-loi/);
    await p.nameInput.fill('   ');
    await p.nameInput.press('Enter');
    await expect(p.nameError).toHaveText('Nhập tên mẫu');
    await p.nameInput.pressSequentially('a');
    await expect(p.nameError).toHaveCount(0);
    expect(p.store.writes).toEqual([]);
  });

  test('TC_BDLK_08: Lưu thành công — tên gọn khoảng trắng, ghi 1 lần cả danh sách (mẫu cũ + mẫu mới), hộp đóng, menu có mẫu mới', async () => {
    await openOne({ templates: [tpl('Bộ MA', [MA21])] });
    await saveAs('  Mẫu   của tôi  ');
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes.length).toBe(1);
    const list = p.store.writes[0];
    expect(list.map((t) => t.ten)).toEqual(['Bộ MA', 'Mẫu của tôi']);
    expect(list[0]).toEqual(tpl('Bộ MA', [MA21]));
    expect(list[1].id).toMatch(/^[a-z0-9]{8,}$/);
    expect(list[1].chi_bao.map((c) => c.ten)).toEqual(['Volume']);
    await p.openTemplateMenu();
    await expect.poll(() => p.templateNames()).toEqual(['Bộ MA', 'Mẫu của tôi']);
  });

  test('TC_BDLK_09: Nội dung mẫu — chỉ báo theo thứ tự, thông số khác mặc định, chỉ báo trên khung giá, chỉ báo đang ẩn; không ghi ô mã của thẻ', async () => {
    await openOne();
    await p.chartApi(0, `chart.removeAllStudies();
      return chart.createStudy('Moving Average', true, false, { length: 21 }).then(() =>
        chart.createStudy('Relative Strength Index', false, false, { length: 7 })).then((id) => { chart.getStudyById(id).setVisible(false); return 1; });`);
    await expect.poll(() => p.studies(0)).toEqual(['Moving Average', 'Relative Strength Index']);
    await saveAs('Kiểm tra nội dung');
    await expect.poll(() => p.store.writes.length).toBe(1);
    const chi = p.store.writes[0][0].chi_bao;
    expect(chi.map((c) => c.ten)).toEqual(['Moving Average', 'Relative Strength Index']);
    expect(chi[0].thong_so).toEqual({ length: 21 });
    expect(chi[0].chung_khung_gia).toBe(true);
    expect(chi[0].an).toBeUndefined();
    expect(chi[1].thong_so).toEqual({ length: 7 });
    expect(chi[1].an).toBe(true);
    expect(chi[1].chung_khung_gia).toBeUndefined();
    // Ô "symbol" của Moving Average đang mang mã VNM của thẻ → không được ghi (áp sang mã khác sẽ ra MA của VNM).
    expect(JSON.stringify(chi)).not.toContain('VNM');
  });

  test('TC_BDLK_10: Trùng tên (khác hoa thường, khoảng trắng) → hộp "Ghi đè mẫu chỉ báo"; Ghi đè thay bộ chỉ báo, giữ id', async () => {
    await openOne({ templates: [tpl('Bộ MA', [MA21])] });
    await saveAs('  bộ   ma ');
    await expect(p.dialogTitle).toHaveText('Ghi đè mẫu chỉ báo');
    await expect(p.dialog.locator('.modal-body')).toHaveText('Mẫu "bộ   ma" đã có. Ghi đè bằng bộ chỉ báo của biểu đồ này?');
    expect(p.store.writes).toEqual([]);
    await p.dialogBtn('Ghi đè').click();
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes.length).toBe(1);
    const list = p.store.writes[0];
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(tpl('Bộ MA', []).id);
    expect(list[0].ten).toBe('bộ ma');
    expect(list[0].chi_bao.map((c) => c.ten)).toEqual(['Volume']);
  });

  test('TC_BDLK_11: Đã đủ 20 mẫu → lưu tên mới báo lỗi trong hộp, không ghi; trùng tên mẫu có sẵn vẫn ghi đè được', async () => {
    const twenty = Array.from({ length: 20 }, (_, i) => tpl(`Mẫu ${String(i + 1).padStart(2, '0')}`, [RSI7]));
    await openOne({ templates: twenty });
    await saveAs('Mẫu mới');
    await expect(p.nameError).toHaveText('Đã đủ 20 mẫu. Xoá bớt một mẫu hoặc lưu đè lên mẫu có sẵn');
    await expect(p.dialog).toBeVisible();
    expect(p.store.writes).toEqual([]);
    await p.nameInput.fill('Mẫu 05');
    await p.dialogBtn('Lưu').click();
    await p.dialogBtn('Ghi đè').click();
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes.length).toBe(1);
    expect(p.store.writes[0].length).toBe(20);
  });

  for (const [mode, msg] of [['500', 'Không lưu được mẫu chỉ báo (lỗi 500)'], ['abort', 'Không lưu được mẫu chỉ báo, kiểm tra kết nối mạng']] as const) {
    test(`TC_BDLK_12${mode === '500' ? 'a' : 'b'}: Lưu lỗi (${mode === '500' ? 'máy chủ 500' : 'mất mạng'}) → báo "${msg}", hộp giữ nguyên, bấm Lưu lại được`, async () => {
      await openOne();
      p.store.mode = mode;
      await saveAs('Mẫu lỗi');
      await expect(p.toastError.filter({ hasText: msg })).toBeVisible();
      await expect(p.dialog).toBeVisible();
      await expect(p.nameInput).toHaveValue('Mẫu lỗi');
      await expect(p.dialogBtn('Lưu')).toBeEnabled();
      p.store.mode = 'ok';
      await p.dialogBtn('Lưu').click();
      await expect(p.dialog).toBeHidden();
      expect(p.store.templates.map((t) => t.ten)).toEqual(['Mẫu lỗi']);
    });
  }

  test('TC_BDLK_13: Đang lưu (máy chủ chậm) → nút Lưu khoá; bấm đúp + Enter chỉ ghi 1 lần', async () => {
    await openOne();
    p.store.mode = 'slow';
    await p.openTemplateMenu();
    await p.templateSaveRow().click();
    await p.nameInput.fill('Chậm');
    await p.dialogBtn('Lưu').dblclick();
    await p.nameInput.press('Enter').catch(() => { /* hộp có thể đã đóng */ });
    await expect(p.dialogBtn('Lưu')).toBeDisabled();
    await expect(p.dialog).toBeHidden({ timeout: 10_000 });
    expect(p.store.writes.length).toBe(1);
  });

  test('TC_BDLK_14: Lưu đọc lại danh sách trên máy chủ trước khi ghi — mẫu vừa thêm ở nơi khác không bị mất', async () => {
    await openOne({ templates: [tpl('Bộ MA', [MA21])] });
    await p.openTemplateMenu();
    await p.templateSaveRow().click();
    // Trong lúc hộp đang mở, một tab khác / app lưu thêm mẫu "Từ app".
    p.store.templates = [...p.store.templates, tpl('Từ app', [RSI7])];
    await p.nameInput.fill('Mẫu mới');
    await p.dialogBtn('Lưu').click();
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes[0].map((t) => t.ten)).toEqual(['Bộ MA', 'Từ app', 'Mẫu mới']);
  });
});

// =====================================================================================================
test.describe('Mẫu chỉ báo — áp, đổi tên, xoá', () => {
  test('TC_BDLK_15: Bấm tên mẫu → THAY toàn bộ chỉ báo của biểu đồ bằng bộ của mẫu, đúng thông số; menu đóng, không ghi mẫu', async () => {
    await openOne({ templates: [tpl('MA + RSI', [MA21, RSI7])] });
    expect(await p.studies(0)).toEqual(['Volume']);
    await p.openTemplateMenu();
    await p.templateRow('MA + RSI').locator('.custom-template-name').click();
    await expect(p.templateMenu()).toHaveCount(0);
    await expect.poll(() => p.studies(0)).toEqual(['Moving Average', 'Relative Strength Index']);
    expect((await p.studyInputs(0, 'Moving Average'))!.length).toBe(21);
    expect((await p.studyInputs(0, 'Relative Strength Index'))!.length).toBe(7);
    expect(p.store.writes).toEqual([]);
  });

  test('TC_BDLK_16: Mẫu có chỉ báo không dựng được → báo "Không dựng lại được 1/2 chỉ báo…", chỉ báo còn lại vẫn dựng', async () => {
    await openOne({ templates: [tpl('Hỏng một phần', [MA21, { ten: 'Chỉ báo không tồn tại' }])] });
    await p.openTemplateMenu();
    await p.templateRow('Hỏng một phần').locator('.custom-template-name').click();
    await expect(p.toastError.filter({ hasText: 'Không dựng lại được 1/2 chỉ báo của mẫu "Hỏng một phần"' })).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => p.studies(0)).toEqual(['Moving Average']);
  });

  test('TC_BDLK_17: Đổi tên — hộp "Đổi tên mẫu chỉ báo" điền sẵn tên cũ; lưu thì giữ id + bộ chỉ báo, menu hiện tên mới', async () => {
    const a = tpl('Bộ MA', [MA21]);
    await openOne({ templates: [a, tpl('RSI', [RSI7])] });
    await p.openTemplateMenu();
    await p.templateRow('Bộ MA').locator('.custom-template-icon[title="Đổi tên"]').click();
    await expect(p.dialogTitle).toHaveText('Đổi tên mẫu chỉ báo');
    await expect(p.nameInput).toHaveValue('Bộ MA');
    await expect(p.nameInput).toBeFocused();
    await p.nameInput.fill('Đường MA 21');
    await p.nameInput.press('Enter');
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes.length).toBe(1);
    expect(p.store.writes[0]).toContainEqual({ ...a, ten: 'Đường MA 21' });
    await p.openTemplateMenu();
    await expect.poll(() => p.templateNames()).toEqual(['Đường MA 21', 'RSI']);
  });

  test('TC_BDLK_18: Đổi tên trùng mẫu khác → "Đã có mẫu khác trùng tên này", không ghi; trùng chính nó (khác hoa thường) thì được', async () => {
    await openOne({ templates: [tpl('Bộ MA', [MA21]), tpl('RSI', [RSI7])] });
    await p.openTemplateMenu();
    await p.templateRow('Bộ MA').locator('.custom-template-icon[title="Đổi tên"]').click();
    await p.nameInput.fill('rsi');
    await p.dialogBtn('Lưu').click();
    await expect(p.nameError).toHaveText('Đã có mẫu khác trùng tên này');
    expect(p.store.writes).toEqual([]);
    await p.nameInput.fill('BỘ MA');
    await p.dialogBtn('Lưu').click();
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes[0].map((t) => t.ten)).toEqual(['BỘ MA', 'RSI']);
  });

  test('TC_BDLK_19: Xoá — hộp "Xoá mẫu chỉ báo" hỏi lại; Huỷ không xoá; Xoá ghi danh sách không còn mẫu đó', async () => {
    await openOne({ templates: [tpl('Bộ MA', [MA21]), tpl('RSI', [RSI7])] });
    await p.openTemplateMenu();
    await p.templateRow('RSI').locator('.custom-template-icon[title="Xoá"]').click();
    await expect(p.dialogTitle).toHaveText('Xoá mẫu chỉ báo');
    await expect(p.dialog.locator('.modal-body')).toHaveText('Xoá mẫu "RSI"?');
    await expect(p.nameInput).toHaveCount(0);
    await p.dialogBtn('Huỷ').click();
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes).toEqual([]);
    await p.openTemplateMenu();
    await p.templateRow('RSI').locator('.custom-template-icon[title="Xoá"]').click();
    await p.dialogBtn('Xoá').click();
    await expect(p.dialog).toBeHidden();
    expect(p.store.writes[0].map((t) => t.ten)).toEqual(['Bộ MA']);
    await p.openTemplateMenu();
    await expect.poll(() => p.templateNames()).toEqual(['Bộ MA']);
  });

  test('TC_BDLK_20: Dữ liệu mẫu hỏng (không phải JSON / thiếu bộ chỉ báo / bộ rỗng) → menu bỏ qua mẫu hỏng, không lỗi JS', async () => {
    const raw = JSON.stringify([tpl('Tốt', [RSI7]), { id: 'x1', ten: 'Thiếu chi_bao' }, tpl('Rỗng', []), { ten: 'Thiếu id', chi_bao: [RSI7] }, 5, null]);
    await openOne({ templates: raw });
    await p.openTemplateMenu();
    await expect.poll(() => p.templateNames()).toEqual(['Tốt']);
    await p.browserPage.keyboard.press('Escape');
    p.store.raw = '{không phải json';
    await p.templateButton().click();
    await p.templateButton().click();
    await expect(p.templateMenu()).toBeVisible();
    await expect.poll(() => p.templateNames()).toEqual([]);
    expect(p.pageErrors).toEqual([]);
  });
});

// =====================================================================================================
test.describe('Liên kết thẻ — chọn kiểu đồng bộ', () => {
  test('TC_BDLK_21: "Tạo nhóm mới" mở hộp "Đồng bộ giữa các thẻ" 4 ô, mặc định Khung thời gian + Chỉ báo; bỏ hết thì nút "Tạo nhóm" khoá', async () => {
    await p.openTpl({ layout: { frames: [[{ symbol: 'VNM' }], [{ symbol: 'HPG' }]] } });
    await p.waitChartsReady();
    await p.ctrlClickTab('VNM');
    await p.ctrlClickTab('HPG');
    await p.linkBarAction('Tạo nhóm mới').click();
    await expect(p.linkCreateMenu.locator('.ta-link-create-title')).toHaveText('Đồng bộ giữa các thẻ');
    await expect(p.createSyncRows).toHaveText(['Mã cổ phiếu', 'Khung thời gian', 'Chỉ báo', 'Trỏ chuột']);
    for (const [label, on] of [['Mã cổ phiếu', false], ['Khung thời gian', true], ['Chỉ báo', true], ['Trỏ chuột', false]] as const) {
      if (on) await expect(p.createSyncBox(label), label).toBeChecked(); else await expect(p.createSyncBox(label), label).not.toBeChecked();
    }
    await p.createSyncBox('Khung thời gian').uncheck();
    await p.createSyncBox('Chỉ báo').uncheck();
    await expect(p.createOk).toBeDisabled();
    await p.createSyncBox('Trỏ chuột').check();
    await expect(p.createOk).toBeEnabled();
  });

  test('TC_BDLK_22: Tạo nhóm với kiểu đã chọn → kiểu đồng bộ lưu vào mọi thẻ của nhóm (link_sync trong bố cục)', async () => {
    await p.openTpl({ layout: { frames: [[{ symbol: 'VNM' }], [{ symbol: 'HPG' }]] } });
    await p.waitChartsReady();
    await p.ctrlClickTab('VNM');
    await p.ctrlClickTab('HPG');
    await p.linkBarAction('Tạo nhóm mới').click();
    await p.createSyncBox('Mã cổ phiếu').check();
    await p.createSyncBox('Chỉ báo').uncheck();
    await p.createSyncBox('Trỏ chuột').check();
    await p.createOk.click();
    await expect(p.linkBar).toBeHidden();
    await expect.poll(() => p.tabLinks()).toEqual(['link-1', 'link-1']);
    await expect.poll(() => p.lastLayoutTabs().map((t) => [t.config.symbol, t.config.link, t.config.link_sync])).toEqual([
      ['VNM', 'link-1', { symbol: true, interval: true, studies: false, range: true }],
      ['HPG', 'link-1', { symbol: true, interval: true, studies: false, range: true }],
    ]);
  });
});

// =====================================================================================================
test.describe('Liên kết thẻ — đồng bộ khi dùng', () => {
  test('TC_BDLK_23: Đồng bộ khung thời gian — đổi khung thẻ VNM sang 1W → thẻ HPG cũng 1W, mã giữ nguyên', async () => {
    await openLinked({ symbol: false, interval: true, studies: false, range: false });
    await p.chartApi(0, 'chart.setResolution("1W"); return 1;');
    await expect.poll(() => p.resolution(1), { timeout: 20_000 }).toBe('1W');
    expect(await p.symbol(1)).toBe('HPG');
    await expect.poll(() => p.lastLayoutTabs().map((t) => t.config.interval)).toEqual(['1W', '1W']);
  });

  test('TC_BDLK_24: Đồng bộ chỉ báo — thêm RSI(7) ở thẻ VNM → thẻ HPG có cùng bộ chỉ báo, cùng thông số', async () => {
    await openLinked({ symbol: false, interval: false, studies: true, range: false });
    await p.chartApi(0, 'return chart.createStudy("Relative Strength Index", false, false, { length: 7 }).then(() => 1);');
    await expect.poll(() => p.studies(1), { timeout: 20_000 }).toEqual(['Volume', 'Relative Strength Index']);
    expect((await p.studyInputs(1, 'Relative Strength Index'))!.length).toBe(7);
    // Xoá ở thẻ HPG → thẻ VNM cũng mất (đồng bộ hai chiều).
    await p.chartApi(1, 'const s = chart.getAllStudies().find(x => x.name === "Relative Strength Index"); chart.removeEntity(s.id); return 1;');
    await expect.poll(() => p.studies(0), { timeout: 20_000 }).toEqual(['Volume']);
  });

  test('TC_BDLK_25: Đồng bộ mã — đổi mã thẻ VNM sang FPT → thẻ HPG cũng thành FPT (tên thẻ đổi theo)', async () => {
    await openLinked({ symbol: true, interval: false, studies: false, range: false });
    await p.chartApi(0, 'chart.setSymbol("FPT"); return 1;');
    await expect.poll(() => p.symbol(1), { timeout: 20_000 }).toBe('FPT');
    await expect(p.chartTabs).toHaveText(['FPT', 'FPT']);
  });

  test('TC_BDLK_26: Kiểu không bật thì không đồng bộ — nhóm chỉ bật Mã: đổi khung, thêm chỉ báo ở thẻ VNM không lan sang HPG', async () => {
    await openLinked({ symbol: true, interval: false, studies: false, range: false });
    await p.chartApi(0, 'chart.setResolution("1W"); return chart.createStudy("Relative Strength Index", false, false, { length: 7 }).then(() => 1);');
    await expect.poll(() => p.studies(0)).toEqual(['Volume', 'Relative Strength Index']);
    await p.browserPage.waitForTimeout(3000);
    expect(await p.resolution(1)).toBe('1D');
    expect(await p.studies(1)).toEqual(['Volume']);
    expect(await p.symbol(1)).toBe('HPG');
  });

  test('TC_BDLK_27: Trỏ chuột — kéo ngang / thu phóng thẻ VNM → thẻ HPG cùng khung hiện đúng đoạn thời gian đó', async ({ page }) => {
    await openLinked({ symbol: false, interval: false, studies: false, range: true });
    const before = await p.visibleRange(1);
    await dragChart(0, 400);
    await expect.poll(async () => (await p.visibleRange(1)).to, { timeout: 15_000 }).toBe((await p.visibleRange(0)).to);
    expect((await p.visibleRange(1)).to).toBeLessThan(before.to);
    const box = (await page.locator(IFRAME).nth(0).boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4);
    await page.mouse.wheel(0, -400);
    await expect.poll(async () => JSON.stringify(await p.visibleRange(1)), { timeout: 15_000 }).toBe(JSON.stringify(await p.visibleRange(0)));
  });

  test('TC_BDLK_28: Trỏ chuột chỉ áp cho thẻ cùng khung — thẻ HPG khung 1W không đổi đoạn khi kéo thẻ VNM khung 1D', async () => {
    await openLinked({ symbol: false, interval: false, studies: false, range: true }, ['1D', '1W']);
    const before = await p.visibleRange(1);
    await dragChart(0, 400);
    await p.browserPage.waitForTimeout(3000);
    expect((await p.visibleRange(0)).to).not.toBe(before.to);
    expect(await p.visibleRange(1)).toEqual(before);
  });
});

// =====================================================================================================
test.describe('Liên kết thẻ — bảng Bố cục', () => {
  const TWO_GROUPS = {
    frames: [[{ symbol: 'VNM', link: 'link-1' }, { symbol: 'FPT', link: 'link-2' }], [{ symbol: 'HPG', link: 'link-1' }, { symbol: 'MBB', link: 'link-2' }]],
  };

  test('TC_BDLK_29: Mỗi nhóm có nút "Chọn đồng bộ" cạnh nút xoá; bấm mở ô chọn đúng kiểu của nhóm, mỗi lần một nhóm, bấm lại thì đóng', async () => {
    await p.openTpl({ layout: TWO_GROUPS, linkSync: { 'link-1': { symbol: true, interval: false, studies: false, range: true } } });
    await p.openLayoutPanel();
    const cam = p.groupSyncToggle('Cam');
    const xanh = p.groupSyncToggle('Xanh ngọc');
    await expect(cam).toHaveAttribute('aria-expanded', 'false');
    await expect(p.groupSyncPanel('Cam')).toHaveCount(0);
    await cam.click();
    await expect(cam).toHaveAttribute('aria-expanded', 'true');
    await expect(p.groupSyncPanel('Cam').locator('label')).toHaveText(['Mã cổ phiếu', 'Khung thời gian', 'Chỉ báo', 'Trỏ chuột']);
    const checked = await p.groupSyncPanel('Cam').locator('input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked));
    expect(checked).toEqual([true, false, false, true]);
    await xanh.click();
    await expect(p.groupSyncPanel('Cam')).toHaveCount(0);
    await expect(p.groupSyncPanel('Xanh ngọc')).toBeVisible();
    await xanh.click();
    await expect(p.groupSyncPanel('Xanh ngọc')).toHaveCount(0);
  });

  test('TC_BDLK_30: Ô đang tích cuối cùng bị khoá — nhóm phải đồng bộ ít nhất một thứ', async () => {
    await p.openTpl({ layout: TWO_GROUPS, linkSync: { 'link-1': { symbol: false, interval: true, studies: false, range: false } } });
    await p.openLayoutPanel();
    await p.groupSyncToggle('Cam').click();
    await expect(p.groupSyncBox('Cam', 'Khung thời gian')).toBeChecked();
    await expect(p.groupSyncBox('Cam', 'Khung thời gian')).toBeDisabled();
    for (const l of ['Mã cổ phiếu', 'Chỉ báo', 'Trỏ chuột']) await expect(p.groupSyncBox('Cam', l), l).toBeEnabled();
    await p.groupSyncBox('Cam', 'Chỉ báo').check();
    await expect(p.groupSyncBox('Cam', 'Khung thời gian')).toBeEnabled();
  });

  test('TC_BDLK_31: Sửa đồng bộ ở bảng Bố cục → áp ngay cho cả nhóm (bật Mã cổ phiếu → đổi mã lan sang, bố cục ghi kiểu mới)', async () => {
    await openLinked({ symbol: false, interval: true, studies: true, range: false });
    await p.openLayoutPanel();
    await p.groupSyncToggle('Cam').click();
    await p.groupSyncBox('Cam', 'Mã cổ phiếu').check();
    await expect.poll(() => p.lastLayoutTabs().map((t) => t.config.link_sync)).toEqual([
      { symbol: true, interval: true, studies: true, range: false },
      { symbol: true, interval: true, studies: true, range: false },
    ]);
    await p.browserPage.keyboard.press('Escape');
    await p.chartApi(0, 'chart.setSymbol("SSI"); return 1;');
    await expect.poll(() => p.symbol(1), { timeout: 20_000 }).toBe('SSI');
  });

  test('TC_BDLK_32: Nhóm tạo trước 04/11 (chưa có kiểu đồng bộ) đọc là Khung thời gian + Chỉ báo; nhóm có khoá cũ "crosshair" đọc là Trỏ chuột', async () => {
    await p.openTpl({ layout: TWO_GROUPS, linkSync: { 'link-2': { crosshair: true } } });
    await p.openLayoutPanel();
    const state = async (g: string) => {
      await p.groupSyncToggle(g).click();
      return p.groupSyncPanel(g).locator('input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked));
    };
    expect(await state('Cam')).toEqual([false, true, true, false]);
    expect(await state('Xanh ngọc')).toEqual([false, true, true, true]);
  });

  test('TC_BDLK_33: Hộp ⓘ "Cách dùng liên kết thẻ" mô tả 4 kiểu đồng bộ và bước chọn kiểu khi tạo nhóm', async () => {
    await p.openTpl({ layout: TWO_GROUPS });
    await p.openLayoutPanel();
    const help = p.layoutPanel.getByRole('button', { name: 'Cách dùng liên kết thẻ' });
    await help.hover();
    const box = p.browserPage.locator('#ta-link-help-box');
    await expect(box).toBeVisible();
    await expect(box).toContainText('đồng bộ những gì bạn chọn cho nhóm: mã cổ phiếu, khung thời gian, chỉ báo, trỏ chuột');
    await expect(box).toContainText('kéo hay thu phóng một thẻ thì các thẻ cùng khung thời gian hiện đúng đoạn đó');
    await expect(box).toContainText('chọn những gì cần đồng bộ rồi bấm Tạo nhóm');
  });

  test('TC_BDLK_34: ⚠️ Thêm chỉ báo trong 3,5 giây đầu sau khi biểu đồ dựng xong → không đồng bộ sang thẻ cùng nhóm cho tới lần đổi chỉ báo kế tiếp', async () => {
    await p.openTpl({
      layout: { frames: [[{ symbol: 'VNM', link: 'link-1' }], [{ symbol: 'HPG', link: 'link-1' }]] },
      linkSync: { 'link-1': { symbol: false, interval: false, studies: true, range: false } },
    });
    // Không chờ thêm sau khi biểu đồ hiện: thêm RSI ngay (người dùng thao tác nhanh).
    await expect(p.frameAt(0).locator('[data-name="legend-source-item"]').first()).toBeVisible({ timeout: 60000 });
    await expect(p.frameAt(1).locator('[data-name="legend-source-item"]').first()).toBeVisible({ timeout: 60000 });
    await p.chartApi(0, 'return chart.createStudy("Relative Strength Index", false, false, { length: 7 }).then(() => 1);');
    await expect.poll(() => p.studies(0)).toEqual(['Volume', 'Relative Strength Index']);
    await p.browserPage.waitForTimeout(6000);
    expect(await p.studies(1)).toEqual(['Volume']);
    // Lần đổi kế tiếp (sau khi đã nạp xong) mới gửi cả bộ, gồm RSI thêm lúc trước.
    await p.chartApi(0, 'return chart.createStudy("Moving Average", true, false, { length: 21 }).then(() => 1);');
    await expect.poll(async () => (await p.studies(1)).sort(), { timeout: 20_000 }).toEqual(['Moving Average', 'Relative Strength Index', 'Volume']);
  });
});
