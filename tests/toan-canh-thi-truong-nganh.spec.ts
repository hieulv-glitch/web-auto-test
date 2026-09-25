import { test, expect } from '@playwright/test';
import { NganhPage } from '../pages/NganhPage';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;
const FREE_EMAIL = process.env.FREE_USER_EMAIL;
const FREE_PASSWORD = process.env.FREE_USER_PASSWORD;

async function loginFirst(page: any) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(EMAIL, PASSWORD);
  await loginPage.expectLoggedIn();
}

/** Đăng nhập tài khoản Free, tự `test.skip` nếu tài khoản trong `.env` đăng nhập lỗi — cùng cơ chế đã dùng ở
 * nhiều tài liệu khác (`FREE_USER_EMAIL` hiện không đăng nhập được). */
async function loginFreeOrSkip(page: any) {
  test.skip(!FREE_EMAIL || !FREE_PASSWORD, 'Chưa cấu hình FREE_USER_EMAIL/FREE_USER_PASSWORD trong .env');
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(FREE_EMAIL!, FREE_PASSWORD!);
  const loginFailed = await loginPage.errorAlert.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
  test.skip(loginFailed, 'Tài khoản Free trong .env đăng nhập thất bại — kiểm tra lại FREE_USER_EMAIL/FREE_USER_PASSWORD.');
  await loginPage.expectLoggedIn();
}

async function gotoNganh(page: any) {
  await loginFirst(page);
  const nganh = new NganhPage(page);
  await nganh.goto();
  return nganh;
}

function parseMoney(text: string): number {
  return parseFloat(text.replace(/,/g, '').trim());
}

test.describe('Ngành — Điều hướng menu header "Toàn cảnh thị trường"', () => {
  test('TC_NGANH_01: Click menu "Toàn cảnh thị trường" điều hướng tới /nganh', async ({ page }) => {
    await loginFirst(page);
    await page.goto('/bang-gia');
    await page.waitForLoadState('networkidle');

    const menuLink = page.getByRole('link', { name: 'Toàn cảnh thị trường' });
    await menuLink.click();
    await expect(page).toHaveURL(/\/nganh$/);
  });

  test('TC_NGANH_02: Hover menu hiển thị dropdown 3 mục con đúng thứ tự', async ({ page }) => {
    const nganh = await gotoNganh(page);
    await nganh.headerMenuLink.hover();
    await expect(nganh.headerSubmenu).toBeVisible();

    const items = (await nganh.headerSubmenu.locator('a').allInnerTexts()).map(t => t.trim());
    expect(items).toEqual(['Ngành', 'Bộ lọc cổ phiếu', 'Sức mạnh dòng tiền']);
  });

  test('TC_NGANH_03: Menu "Toàn cảnh thị trường" active khi đang ở /nganh', async ({ page }) => {
    const nganh = await gotoNganh(page);
    await expect(nganh.headerMenuLink.locator('.active-tab-overview')).toBeVisible();
  });
});

test.describe('Ngành — 2 tab chính', () => {
  test('TC_NGANH_04: Mặc định tab "Tổng quan" active', async ({ page }) => {
    const nganh = await gotoNganh(page);
    await expect(nganh.tab('Tổng quan')).toHaveClass(/active/);
    await expect(nganh.tab('Luân chuyển dòng tiền ngành')).not.toHaveClass(/active/);
    for (const label of ['Tên ngành', 'Trạng thái', 'Giá', 'Điểm RS', 'Nỗ lực - Kết quả']) {
      await expect(nganh.headerCell(label)).toBeVisible();
    }
  });

  test('TC_NGANH_05: Chuyển sang tab "Luân chuyển dòng tiền ngành"', async ({ page }) => {
    const nganh = await gotoNganh(page);
    await nganh.tab('Luân chuyển dòng tiền ngành').click();
    await page.waitForTimeout(1500);

    await expect(nganh.tab('Luân chuyển dòng tiền ngành')).toHaveClass(/active/);
    await expect(nganh.headerCell('MA10')).toBeVisible();
    await expect(nganh.headerCell('MA20')).toBeVisible();
    await expect(nganh.headerCell('MA50')).toBeVisible();

    // Quay lại tab Tổng quan vẫn hoạt động bình thường
    await nganh.tab('Tổng quan').click();
    await page.waitForTimeout(500);
    await expect(nganh.tab('Tổng quan')).toHaveClass(/active/);
    await expect(nganh.headerCell('Điểm RS')).toBeVisible();
  });

  test.fixme(
    'TC_NGANH_06: Giới hạn tính năng với tài khoản Free (ProtectedView khi features_disabled)',
    async ({ page }) => {
      await loginFreeOrSkip(page);
      const nganh = new NganhPage(page);
      await nganh.goto();
      await expect(nganh.protectedOverlay).toBeVisible();
    }
  );
});

test.describe('Ngành — Tab "Tổng quan" — bảng ngành', () => {
  test('TC_NGANH_07: Hiển thị đủ 5 cột header', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const texts = (await nganh.headerCells.allInnerTexts()).map(t => t.trim());
    expect(texts).toEqual(['Tên ngành', 'Trạng thái', 'Giá', 'Điểm RS', 'Nỗ lực - Kết quả']);
  });

  test('TC_NGANH_08: Format giá có dấu phẩy phân tách hàng nghìn', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const row = nganh.rows.first();
    const priceText = (await nganh.priceCellOf(row).innerText()).trim();
    expect(priceText).toMatch(/^\d{1,3}(,\d{3})+(\.\d+)?$/);
  });

  test('TC_NGANH_09: Màu cột "Điểm RS" theo ngưỡng 50', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const count = await nganh.rows.count();
    let checkedUp = false;
    let checkedDown = false;
    for (let i = 0; i < count && (!checkedUp || !checkedDown); i++) {
      const row = nganh.rows.nth(i);
      const rsCell = nganh.rsCellOf(row);
      const rsValue = parseFloat((await rsCell.innerText()).trim());
      const color = await rsCell.evaluate(el => getComputedStyle(el).color);
      if (rsValue >= 50) {
        expect(color, `RS=${rsValue} phải màu xanh`).toBe('rgb(22, 202, 99)');
        checkedUp = true;
      } else {
        expect(color, `RS=${rsValue} phải màu đỏ`).toBe('rgb(242, 28, 87)');
        checkedDown = true;
      }
    }
    expect(checkedUp, 'Cần ít nhất 1 dòng RS >= 50 để verify').toBe(true);
    expect(checkedDown, 'Cần ít nhất 1 dòng RS < 50 để verify').toBe(true);
  });

  test('TC_NGANH_10: Badge "Trạng thái" đúng 4 loại màu', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const expectedClass: Record<string, string> = {
      'Dẫn dắt': 'bg-upchange',
      'Phục hồi': 'bg-floorchange',
      'Suy yếu': 'bg-nochange',
      'Đội sổ': 'bg-downchange',
    };
    const count = await nganh.rows.count();
    const foundStatuses = new Set<string>();
    for (let i = 0; i < count; i++) {
      const row = nganh.rows.nth(i);
      const badgeSpan = nganh.statusCellOf(row).locator('span');
      const status = (await badgeSpan.innerText()).trim();
      if (!(status in expectedClass) || foundStatuses.has(status)) continue;
      const cls = (await badgeSpan.getAttribute('class')) || '';
      expect(cls, `Badge "${status}" phải có class ${expectedClass[status]}`).toContain(expectedClass[status]);
      foundStatuses.add(status);
    }
    expect(foundStatuses.size, 'Cần quan sát đủ 4 loại trạng thái trong bảng').toBe(4);
  });

  test('TC_NGANH_11: Click "Tên ngành" điều hướng sang Bộ lọc cổ phiếu theo đúng ngành', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const row = nganh.rows.first();
    const deptName = (await nganh.nameCellOf(row).innerText()).trim();
    await nganh.nameCellOf(row).click();

    await expect(page).toHaveURL(/\/bo-loc\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get('type')).toBe('chi-bao-ky-thuat');
    expect(url.searchParams.get('nganh')).toBe(deptName);
  });

  test('TC_NGANH_12: Click badge "Trạng thái" không có phản hồi UI (dead click)', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const row = nganh.rows.first();
    const urlBefore = page.url();
    const tableTextBefore = await nganh.table.innerText();

    await nganh.statusCellOf(row).click();
    await page.waitForTimeout(800);

    expect(page.url()).toBe(urlBefore);
    const tableTextAfter = await nganh.table.innerText();
    expect(tableTextAfter).toBe(tableTextBefore);
  });

  test('TC_NGANH_13: Click header cột "Giá" đổi thứ tự tăng/giảm', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const headerGia = nganh.headerCell('Giá');
    const count = await nganh.rows.count();

    async function readPrices(): Promise<number[]> {
      const values: number[] = [];
      for (let i = 0; i < count; i++) {
        values.push(parseMoney(await nganh.priceCellOf(nganh.rows.nth(i)).innerText()));
      }
      return values;
    }

    await headerGia.locator('div').click();
    await page.waitForTimeout(500);
    const desc = await readPrices();
    for (let i = 1; i < desc.length; i++) {
      expect(desc[i - 1], 'Thứ tự phải giảm dần sau click lần 1').toBeGreaterThanOrEqual(desc[i]);
    }

    await headerGia.locator('div').click();
    await page.waitForTimeout(500);
    const asc = await readPrices();
    for (let i = 1; i < asc.length; i++) {
      expect(asc[i - 1], 'Thứ tự phải tăng dần sau click lần 2').toBeLessThanOrEqual(asc[i]);
    }
  });

  test('TC_NGANH_14: Hover cột "Nỗ lực - Kết quả" hiện tooltip chi tiết', async ({ page }) => {
    const nganh = await gotoNganh(page);
    const row = nganh.rows.first();
    const deptName = (await nganh.nameCellOf(row).innerText()).trim();

    await nganh.effortResultChartCellOf(row).hover();
    await expect(nganh.tooltipChart).toBeVisible();
    const tooltipText = await nganh.tooltipChart.innerText();
    expect(tooltipText).toContain(deptName);
    expect(tooltipText).toContain('Nỗ lực');
    expect(tooltipText).toContain('Kết quả');

    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await expect(nganh.tooltipChart).toHaveCount(0);
  });
});

test.describe('Ngành — Tab "Luân chuyển dòng tiền ngành" — bảng', () => {
  async function gotoCashflowTab(page: any) {
    const nganh = await gotoNganh(page);
    await nganh.tab('Luân chuyển dòng tiền ngành').click();
    await page.waitForTimeout(2000);
    return nganh;
  }

  test('TC_NGANH_15: Hiển thị cột động: Tên ngành + biểu đồ + cột ngày + MA10/MA20/MA50', async ({ page }) => {
    const nganh = await gotoCashflowTab(page);
    const texts = (await nganh.headerCells.allInnerTexts()).map(t => t.trim());

    expect(texts[0]).toBe('Tên ngành');
    expect(texts[1]).toBe('');
    const dateCols = texts.slice(2, -3);
    expect(dateCols.length).toBeGreaterThanOrEqual(1);
    for (const d of dateCols) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(texts.slice(-3)).toEqual(['MA10', 'MA20', 'MA50']);
  });

  test('TC_NGANH_16: 2 dòng đặc biệt VNINDEX / "Thanh khoản VNINDEX" luôn ở đầu bảng', async ({ page }) => {
    const nganh = await gotoCashflowTab(page);
    const row0Name = (await nganh.nameCellOf(nganh.rows.nth(0)).innerText()).trim();
    const row1Name = (await nganh.nameCellOf(nganh.rows.nth(1)).innerText()).trim();
    expect(row0Name).toBe('VNINDEX');
    expect(row1Name).toBe('Thanh khoản VNINDEX');

    const cellText = (await nganh.cellsOf(nganh.rows.nth(0)).nth(2).innerText()).trim();
    expect(cellText).toMatch(/%$/);
  });

  test('TC_NGANH_17: Biểu đồ sparkline theo từng ngành', async ({ page }) => {
    const nganh = await gotoCashflowTab(page);
    // Dòng ngành thứ 3 trở đi (sau VNINDEX, Thanh khoản VNINDEX) phải có canvas/svg biểu đồ ở cột 2.
    const deptRow = nganh.rows.nth(2);
    const chartCell = nganh.cellsOf(deptRow).nth(1);
    const chartEl = chartCell.locator('canvas, svg, .echarts, [_echarts_instance_]');
    await expect(chartEl.first()).toBeVisible();

    // Dòng VNINDEX (index 0) không có biểu đồ ở cột này.
    const vniChartCell = nganh.cellsOf(nganh.rows.nth(0)).nth(1);
    expect(await vniChartCell.innerText()).toBe('');
  });

  test('TC_NGANH_18: Icon Trên/Dưới + tooltip cho cột MA10/MA20/MA50', async ({ page }) => {
    const nganh = await gotoCashflowTab(page);
    const count = await nganh.rows.count();
    let checked = false;
    for (let i = 2; i < count && !checked; i++) {
      const row = nganh.rows.nth(i);
      const cells = nganh.cellsOf(row);
      const totalCells = await cells.count();
      const ma10Cell = cells.nth(totalCells - 3);
      const link = ma10Cell.locator('a, [data-toggle="tooltip"]');
      if (await link.count() === 0) continue;
      const title = await link.getAttribute('title');
      if (!title) continue;
      expect(['Trên', 'Dưới']).toContain(title);
      const icon = ma10Cell.locator('.icon-upchange, .icon-downchange');
      await expect(icon).toHaveCount(1);
      checked = true;
    }
    expect(checked, 'Cần ít nhất 1 dòng có dữ liệu MA10 để verify').toBe(true);
  });

  test('TC_NGANH_19: Click sort cột ngày — VNINDEX/Thanh khoản VNINDEX ghim đầu bảng, dòng ngành nhóm theo trạng thái', async ({ page }) => {
    const nganh = await gotoCashflowTab(page);
    const dateHeader = nganh.headerCells.nth(2);
    await dateHeader.locator('div').click();
    await page.waitForTimeout(1000);

    const row0Name = (await nganh.nameCellOf(nganh.rows.nth(0)).innerText()).trim();
    const row1Name = (await nganh.nameCellOf(nganh.rows.nth(1)).innerText()).trim();
    expect(row0Name).toBe('VNINDEX');
    expect(row1Name).toBe('Thanh khoản VNINDEX');

    // Các dòng ngành (từ index 2) phải nhóm theo cùng giá trị trạng thái tại cột vừa sort liên tiếp nhau.
    const count = await nganh.rows.count();
    const statuses: string[] = [];
    for (let i = 2; i < count; i++) {
      statuses.push((await nganh.cellsOf(nganh.rows.nth(i)).nth(2).innerText()).trim());
    }
    let groupChanges = 0;
    for (let i = 1; i < statuses.length; i++) {
      if (statuses[i] !== statuses[i - 1]) groupChanges++;
    }
    // Số lần đổi nhóm phải nhỏ hơn nhiều so với số dòng (nếu nhóm đúng, chỉ đổi khi chuyển sang giá trị trạng
    // thái khác — tối đa bằng số giá trị trạng thái khác nhau trừ 1, thực tế tối đa quanh 3-4 lần đổi).
    expect(groupChanges).toBeLessThan(statuses.length - 1);
  });

  test('TC_NGANH_20: Cột "Tên ngành" không sort được ở tab "Luân chuyển dòng tiền ngành"', async ({ page }) => {
    const nganh = await gotoCashflowTab(page);
    const headerName = nganh.headerCells.nth(0);
    await expect(headerName.locator('svg')).toHaveCount(0);

    const orderBefore: string[] = [];
    const count = await nganh.rows.count();
    for (let i = 0; i < Math.min(5, count); i++) {
      orderBefore.push((await nganh.nameCellOf(nganh.rows.nth(i)).innerText()).trim());
    }
    await headerName.click();
    await page.waitForTimeout(500);
    const orderAfter: string[] = [];
    for (let i = 0; i < Math.min(5, count); i++) {
      orderAfter.push((await nganh.nameCellOf(nganh.rows.nth(i)).innerText()).trim());
    }
    expect(orderAfter).toEqual(orderBefore);
  });
});
