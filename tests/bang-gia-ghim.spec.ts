import { test, expect, Page } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { BangGiaGhimPage } from '../pages/BangGiaGhimPage';

/**
 * Bảng giá — ẩn/hiện cột kéo + ghim, lưu & đồng bộ mã ghim với app (testcases/bang-gia-ghim.md).
 * Chạy trên kfsp.vn (= preprod mới nhất). Mọi lệnh ghi setting đi qua máy chủ giả / bị huỷ — xem đầu
 * pages/BangGiaGhimPage.ts. Bộ cũ testcases/bang-gia.md (TC_BANGGIA_36 ghim/bỏ ghim) không đụng tới.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

let current: BangGiaGhimPage | undefined;
async function openBoard(page: Page, opts: Parameters<BangGiaGhimPage['open']>[0] = {}) {
  current = new BangGiaGhimPage(page);
  await current.open(opts);
  return current;
}

test.afterEach(async () => {
  // Không request ghi nào lọt lưới an toàn (ngoài nhật ký hoạt động đã giả lập).
  if (current) expect(current.blocked.filter((b) => !/activitylog/.test(b)), 'request ghi lọt lưới').toEqual([]);
  current = undefined;
});

const PIN_SAVE_WAIT = 8000; // debounce 2 giây + đọc + ghi

test.describe('Ẩn/hiện cột kéo + ghim', () => {
  test('TC_BGGHIM_01: Mặc định cột kéo + ghim thu gọn, mũi tên mở nằm ở góc ô tiêu đề "Mã"', async ({ page }) => {
    const p = await openBoard(page);
    await expect(p.headerRow).toHaveClass(/no-action-col/);
    await expect(p.actionHeader).toHaveCount(0);
    await expect(page.locator('.price-board-row .price-board-col.action')).toHaveCount(0);
    await expect(p.mainRows.first()).toHaveClass(/no-action-col/);
    await expect(p.actionToggle).toHaveCount(1);
    await expect(p.actionToggle).toHaveClass(/in-code/);
    await expect(p.actionToggle).toHaveAttribute('aria-label', 'Mở cột sắp xếp, ghim');
    await expect(p.actionToggle).toHaveAttribute('aria-expanded', 'false');
    expect(await p.actionToggle.evaluate((e) => (e.parentElement as HTMLElement).className)).toMatch(/header-col code/);
    // Cột Mã dính sát mép trái hàng.
    const [rowBox, codeBox] = [await p.headerRow.boundingBox(), await p.codeHeader.boundingBox()];
    expect(Math.abs(codeBox!.x - rowBox!.x)).toBeLessThanOrEqual(1);
  });

  test('TC_BGGHIM_02: Rê chuột lên mũi tên → chú thích ngay dưới mũi tên; rời chuột → ẩn', async ({ page }) => {
    const p = await openBoard(page);
    await expect(p.actionTip).toHaveCount(0);
    await p.actionToggle.hover();
    await expect(p.actionTip).toBeVisible();
    await expect(p.actionTip).toHaveText('Mở cột sắp xếp, ghim');
    await expect(p.actionTip).toHaveAttribute('role', 'tooltip');
    const [t, a] = [await p.actionTip.boundingBox(), await p.actionToggle.boundingBox()];
    expect(Math.abs(t!.x - a!.x)).toBeLessThanOrEqual(1);
    expect(t!.y).toBeGreaterThan(a!.y + a!.height);
    expect(t!.y - (a!.y + a!.height)).toBeLessThanOrEqual(10);
    await page.mouse.move(800, 700);
    await expect(p.actionTip).toHaveCount(0);
  });

  test('TC_BGGHIM_03: Bấm mũi tên → mở cột: icon kéo + ghim ở dòng thường, chỉ icon bỏ ghim ở dòng ghim; mũi tên sang ô cột mới', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT'] } });
    await p.actionToggle.hover();
    await expect(p.actionTip).toBeVisible();
    await p.actionToggle.click();
    await expect(p.actionTip).toHaveCount(0);
    await expect(p.headerRow).not.toHaveClass(/no-action-col/);
    await expect(p.actionHeader).toHaveCount(1);
    await expect(p.actionToggle).toHaveCount(1);
    await expect(p.actionToggle).toHaveClass(/\bon\b/);
    await expect(p.actionToggle).toHaveAttribute('aria-label', 'Thu cột sắp xếp, ghim');
    await expect(p.actionToggle).toHaveAttribute('aria-expanded', 'true');
    expect(await p.actionToggle.evaluate((e) => (e.parentElement as HTMLElement).className)).toMatch(/header-col action/);
    const row = p.mainRows.first();
    await expect(p.dragIconOf(row)).toBeVisible();
    await expect(row.locator('[title="Nhấn để ghim lên đầu"]')).toBeVisible();
    const pinnedRow = p.pinnedRows.first();
    await expect(pinnedRow.locator('[title="Nhấn để bỏ ghim"]')).toBeVisible();
    await expect(p.dragIconOf(pinnedRow)).toHaveCount(0);
    await page.mouse.move(800, 700);
    await p.actionToggle.hover();
    await expect(p.actionTip).toHaveText('Thu cột sắp xếp, ghim');
  });

  test('TC_BGGHIM_04: Bấm mũi tên lần nữa → thu cột về như mặc định', async ({ page }) => {
    const p = await openBoard(page);
    await p.openActionCol();
    await p.actionToggle.click();
    await expect(p.actionToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(p.actionToggle).toHaveClass(/in-code/);
    await expect(p.headerRow).toHaveClass(/no-action-col/);
    await expect(page.locator('.price-board-row .price-board-col.action')).toHaveCount(0);
  });

  test('TC_BGGHIM_05: Bấm mũi tên không sắp xếp theo Mã; bấm chữ "Mã" vẫn sắp xếp như cũ', async ({ page }) => {
    const p = await openBoard(page);
    const before = (await p.mainCodes()).slice(0, 5);
    await p.actionToggle.click();
    await p.actionToggle.click();
    expect((await p.mainCodes()).slice(0, 5)).toEqual(before);
    // Bấm vào giữa ô "Mã" (không trúng mũi tên ở góc) → đảo thứ tự sắp xếp.
    await p.codeHeader.click({ position: { x: 30, y: 25 } });
    await expect.poll(async () => (await p.mainCodes())[0]).not.toBe(before[0]);
  });

  test('TC_BGGHIM_06: Thu cột thì hàng hẹp đi đúng 40px (bề ngang tối thiểu của tiêu đề + dòng)', async ({ page }) => {
    const p = await openBoard(page);
    const rowMin = () => p.mainRows.first().evaluate((el) => parseFloat((el as HTMLElement).style.minWidth || '0'));
    const closedHeader = await p.headerMinWidth();
    const closedRow = await rowMin();
    await p.openActionCol();
    expect(await p.headerMinWidth()).toBe(closedHeader + 40);
    expect(await rowMin()).toBe(closedRow + 40);
    expect(closedRow).toBe(closedHeader);
  });

  test('TC_BGGHIM_07: Trạng thái mở cột không được nhớ — tải lại trang thì thu gọn lại, không ghi setting nào cho nó', async ({ page }) => {
    const p = await openBoard(page);
    await p.openActionCol();
    await page.waitForTimeout(2500);
    expect(p.session.settingWrites.map((w) => w.key).filter((k) => /edit|action|pin/i.test(k))).toEqual([]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await p.waitBoardReady();
    await expect(p.actionToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(p.headerRow).toHaveClass(/no-action-col/);
  });

  test('TC_BGGHIM_08: Cột thu gọn — khu ghim vẫn hiện mã ghim ở đầu bảng (không có nút bỏ ghim)', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT', 'VNM'] } });
    await expect.poll(() => p.pinnedCodes()).toEqual(['FPT', 'VNM']);
    expect(await p.mainCodes()).not.toContain('FPT');
    await expect(p.pinnedRows.first()).toHaveClass(/no-action-col/);
    await expect(p.pinnedRows.locator('[title="Nhấn để bỏ ghim"]')).toHaveCount(0);
    // Khu ghim nằm trên danh sách thường.
    const [pin, main] = [await p.pinnedRows.first().boundingBox(), await p.mainRows.first().boundingBox()];
    expect(pin!.y).toBeLessThan(main!.y);
  });

  test('TC_BGGHIM_09: Bảng Phái sinh — mũi tên nằm ở ô "Mã" của bảng Phái sinh, mở/thu được', async ({ page }) => {
    const p = await openBoard(page);
    await page.locator('.segment-item', { hasText: /^Phái sinh$/ }).click();
    await expect.poll(() => p.actionToggle.evaluate((e) => (e.parentElement as HTMLElement).className)).toMatch(/header-col code_ps/);
    await expect(p.actionToggle).toHaveAttribute('aria-expanded', 'false');
    await p.actionToggle.click();
    await expect(p.actionToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(p.mainRows.first().locator('[title="Nhấn để ghim lên đầu"]')).toBeVisible();
  });
});

test.describe('Ghim / bỏ ghim — lưu đọc-gộp-ghi', () => {
  test('TC_BGGHIM_10: Ghim 1 mã → lên đầu khu ghim; ~2 giây sau web đọc bản máy chủ rồi ghi price_board_obj_pinned đã gộp', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT', 'VNM'] } });
    await p.openActionCol();
    const code = (await p.mainCodes())[0];
    const reads = p.pinnedReads;
    await p.togglePin(p.mainRows.first());
    await expect.poll(() => p.pinnedCodes()).toEqual([code, 'FPT', 'VNM']);
    expect(await p.mainCodes()).not.toContain(code);
    expect(p.pinnedWrites).toHaveLength(0); // chưa ghi ngay — gom 2 giây
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedReads).toBe(reads + 1);
    expect(p.pinnedWrites[0]).toEqual({ all: [code, 'FPT', 'VNM'] });
    // Các khoá trạng thái bảng giá khác ghi riêng, không mang khoá ghim.
    expect(p.session.settingWrites.map((w) => w.key)).not.toContain('price_board_obj_pinned');
    expect((await p.localPinned()).all).toEqual([code, 'FPT', 'VNM']);
  });

  test('TC_BGGHIM_11: Bỏ ghim → dòng về đầu danh sách thường; bản ghi không còn mã đó', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT', 'VNM'] } });
    await p.openActionCol();
    await p.togglePin(p.rowByCode('VNM', p.pinnedRows));
    await expect.poll(() => p.pinnedCodes()).toEqual(['FPT']);
    expect((await p.mainCodes())[0]).toBe('VNM');
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedWrites[0]).toEqual({ all: ['FPT'] });
  });

  test('TC_BGGHIM_12: Ghim/bỏ ghim liên tiếp trong 2 giây → chỉ 1 lượt đọc + 1 lượt ghi với kết quả cuối', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT'] } });
    await p.openActionCol();
    const [a, b] = (await p.mainCodes()).slice(0, 2);
    const reads = p.pinnedReads;
    await p.togglePin(p.rowByCode(a));
    await expect.poll(() => p.pinnedCodes()).toContain(a);
    await p.togglePin(p.rowByCode(b));
    await expect.poll(() => p.pinnedCodes()).toContain(b);
    await p.togglePin(p.rowByCode(a, p.pinnedRows));
    await expect.poll(() => p.pinnedCodes()).toEqual([b, 'FPT']);
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    await page.waitForTimeout(2500);
    expect(p.pinnedWrites).toHaveLength(1);
    expect(p.pinnedReads).toBe(reads + 1);
    expect(p.pinnedWrites[0]).toEqual({ all: [b, 'FPT'] });
  });

  test('TC_BGGHIM_13: App vừa ghim thêm mã trên máy chủ → web ghim mã khác vẫn giữ mã của app, sau khi lưu mã đó hiện ở khu ghim', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT', 'VNM'] } });
    await p.openActionCol();
    p.remotePinned = { all: ['FPT', 'VNM', 'HPG'] }; // app ghim HPG, web chưa biết
    const code = (await p.mainCodes()).find((c) => c !== 'HPG')!;
    await p.togglePin(p.rowByCode(code));
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedWrites[0]).toEqual({ all: [code, 'FPT', 'VNM', 'HPG'] });
    await expect.poll(() => p.pinnedCodes()).toEqual([code, 'FPT', 'VNM', 'HPG']);
    expect(await p.mainCodes()).not.toContain('HPG');
  });

  test('TC_BGGHIM_14: App vừa bỏ ghim một mã → web ghim mã khác không kéo mã đó trở lại; mã đó rời khu ghim', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT', 'VNM'] } });
    await p.openActionCol();
    p.remotePinned = { all: ['FPT'] }; // app bỏ ghim VNM
    const code = (await p.mainCodes())[0];
    await p.togglePin(p.mainRows.first());
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedWrites[0]).toEqual({ all: [code, 'FPT'] });
    await expect.poll(() => p.pinnedCodes()).toEqual([code, 'FPT']);
    expect((await p.mainCodes())[0]).toBe('VNM'); // mã vừa bị bỏ ghim lên đầu danh sách thường
  });

  test('TC_BGGHIM_15: Mỗi sàn một khoá ghim — ghim ở HOSE chỉ đổi khoá "HOSE", khoá khác giữ nguyên', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT'], VN30: ['MBB'] } });
    await page.locator('.segment-item', { hasText: /^HOSE$/ }).click();
    await expect(page.locator('.segment-item.active')).toHaveText('HOSE');
    await expect.poll(() => p.pinnedCodes()).toEqual([]);
    await p.openActionCol();
    const code = (await p.mainCodes())[0];
    await p.togglePin(p.mainRows.first());
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedWrites[0]).toEqual({ all: ['FPT'], VN30: ['MBB'], HOSE: [code] });
  });

  test('TC_BGGHIM_16: Mã ghim không có trên sàn đang xem bị bỏ qua khi hiển thị nhưng không bị xoá khỏi máy chủ khi ghim mã khác', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT', 'ZZZ9'] } }); // ZZZ9 không phải mã đang giao dịch
    await expect.poll(() => p.pinnedCodes()).toEqual(['FPT']);
    await page.waitForTimeout(3000);
    expect(p.pinnedWrites, 'chỉ mở bảng thì không ghi khoá ghim').toHaveLength(0);
    await p.openActionCol();
    const code = (await p.mainCodes())[0];
    await p.togglePin(p.mainRows.first());
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedWrites[0]).toEqual({ all: [code, 'FPT', 'ZZZ9'] });
  });
});

test.describe('Lưu lỗi & đồng bộ khi tab hiện lại', () => {
  test('TC_BGGHIM_17: Không đọc được bản máy chủ (500) → không ghi (tránh ghi mù); tab hiện lại → lưu lại thành công', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT'] } });
    await p.openActionCol();
    const code = (await p.mainCodes())[0];
    p.pinnedReadMode = '500';
    const reads = p.pinnedReads;
    await p.togglePin(p.mainRows.first());
    await expect.poll(() => p.pinnedReads, { timeout: PIN_SAVE_WAIT }).toBe(reads + 1);
    await page.waitForTimeout(1500);
    expect(p.pinnedWrites).toHaveLength(0);
    expect(await p.pinnedCodes()).toEqual([code, 'FPT']); // thao tác trên web vẫn giữ
    p.pinnedReadMode = 'ok';
    await p.fireTabVisible();
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedWrites[0]).toEqual({ all: [code, 'FPT'] });
    expect(p.pageErrors).toEqual([]);
  });

  for (const mode of ['500', 'abort'] as const) {
    test(`TC_BGGHIM_18: Ghi lỗi (${mode === '500' ? 'máy chủ 500' : 'mất mạng'}) → giữ thao tác; tab hiện lại → ghi lại`, async ({ page }) => {
      const p = await openBoard(page, { pinned: { all: ['FPT'] } });
      await p.openActionCol();
      const code = (await p.mainCodes())[0];
      p.pinnedWriteMode = mode;
      await p.togglePin(p.mainRows.first());
      await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
      expect(p.remotePinned).toEqual({ all: ['FPT'] }); // máy chủ chưa đổi
      expect(await p.pinnedCodes()).toEqual([code, 'FPT']);
      p.pinnedWriteMode = 'ok';
      await p.fireTabVisible();
      await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(2);
      expect(p.pinnedWrites[1]).toEqual({ all: [code, 'FPT'] });
      expect(p.remotePinned).toEqual({ all: [code, 'FPT'] });
    });
  }

  test('TC_BGGHIM_19: Tab hiện lại → đọc lại mã ghim: mã app vừa ghim vào khu ghim, mã app vừa bỏ ghim về đầu danh sách thường; không ghi gì', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT', 'VNM'] } });
    await expect.poll(() => p.pinnedCodes()).toEqual(['FPT', 'VNM']);
    const reads = p.pinnedReads;
    p.remotePinned = { all: ['FPT', 'HPG'] };
    await p.fireTabVisible();
    await expect.poll(() => p.pinnedCodes()).toEqual(['FPT', 'HPG']);
    expect(p.pinnedReads).toBe(reads + 1);
    expect((await p.mainCodes())[0]).toBe('VNM');
    expect((await p.localPinned()).all).toEqual(['FPT', 'HPG']);
    await page.waitForTimeout(3000);
    expect(p.pinnedWrites).toHaveLength(0);
  });

  test('TC_BGGHIM_20: Rời sang trang khác rồi quay lại Bảng giá (điều hướng trong app) → đọc lại mã ghim mới nhất', async ({ page }) => {
    const p = await openBoard(page, { pinned: { all: ['FPT'] } });
    await page.getByRole('link', { name: 'Watchlist', exact: true }).first().click();
    await page.waitForURL(/\/watchlist/);
    p.remotePinned = { all: ['FPT', 'HPG'] };
    const reads = p.pinnedReads;
    await page.getByRole('link', { name: /Thị Trường/ }).first().click();
    await page.waitForURL(/\/bang-gia/);
    await p.waitBoardReady();
    await expect.poll(() => p.pinnedReads, { timeout: 20_000 }).toBeGreaterThan(reads);
    await expect.poll(() => p.pinnedCodes()).toEqual(['FPT', 'HPG']);
  });
});

test.describe('Tài khoản Free', () => {
  test('TC_BGGHIM_21: Free — có mũi tên mở cột, ghim được và lưu theo cùng cơ chế', async ({ page }) => {
    const p = await openBoard(page, { account: 'free' });
    await expect(p.actionToggle).toHaveAttribute('aria-expanded', 'false');
    await p.openActionCol();
    const code = (await p.mainCodes())[0];
    await p.togglePin(p.mainRows.first());
    await expect.poll(() => p.pinnedCodes()).toEqual([code]);
    await expect.poll(() => p.pinnedWrites.length, { timeout: PIN_SAVE_WAIT }).toBe(1);
    expect(p.pinnedWrites[0]).toEqual({ all: [code] });
  });
});
