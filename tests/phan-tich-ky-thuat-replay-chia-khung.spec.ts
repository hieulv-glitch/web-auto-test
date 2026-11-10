import { test, expect, Page } from '@playwright/test';
import {
  TaReplayLayoutPage, LAYOUT_1_FRAME, LAYOUT_2_FRAMES, LayoutSpec, OpenOptions, prev2Account,
} from '../pages/TaReplayLayoutPage';

// Phân tích kỹ thuật — Replay & Chia khung (tính năng mới, mới có trên prev2). Tài liệu:
// testcases/phan-tich-ky-thuat-replay-chia-khung.md.
//
// AN TOÀN DỮ LIỆU: `TaReplayLayoutPage.open()` chặn mọi lệnh ghi setting (`/updateusersettings`, `/delusersettings`)
// và thay bố cục thật của tài khoản bằng bố cục cố định của từng test (xem ghi chú đầu POM). Không test nào ghi lên
// tài khoản, nên file này chạy song song được, không cần `--workers=1` như các spec PTKT cũ.
//
// HIỆU NĂNG prev2: server preview yếu — 3 worker (mặc định) làm trang chậm tới mức biểu đồ không kịp nạp, trang
// login trắng (đã gặp 17/65 case fail giả). Chạy `--workers=2`:
//   npx playwright test tests/phan-tich-ky-thuat-replay-chia-khung.spec.ts --project=chromium --workers=2

const PREV2_URL = process.env.PREV2_BASE_URL ?? 'https://prev2.vietpointer.vn';

test.use({ baseURL: PREV2_URL, viewport: { width: 1600, height: 900 } });
test.describe.configure({ timeout: 150_000 });

/** 2 khung, 4 thẻ: VNM (mở) + FPT | HPG (mở) + MBB. */
const LAYOUT_2x2_TABS: LayoutSpec = {
  frames: [[{ symbol: 'VNM' }, { symbol: 'FPT' }], [{ symbol: 'HPG' }, { symbol: 'MBB' }]],
};

/** Ngày YYYY-MM-DD theo giờ Việt Nam, lùi `daysBack` ngày — cùng công thức `vnDateStr` trong `ChartReplayBar.vue`. */
function vnDate(daysBack: number): string {
  return new Date(Date.now() - daysBack * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10);
}

/** "dd/mm/yyyy" (ô ngày đang chiếu) → mili giây. */
function parseVn(text: string | null): number {
  const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(text ?? '');
  if (!m) throw new Error(`Không đọc được ngày từ "${text}"`);
  return Date.UTC(+m[3], +m[2] - 1, +m[1]);
}
const DAY = 86400_000;

async function openPaid(page: Page, opts: OpenOptions = {}) {
  const ta = new TaReplayLayoutPage(page);
  await ta.open({ account: 'paid', ...opts });
  return ta;
}

async function openFree(page: Page, opts: OpenOptions = {}) {
  const { email, password } = prev2Account('free');
  test.skip(!email || !password, 'Chưa cấu hình tài khoản Free prev2 trong .env');
  const ta = new TaReplayLayoutPage(page);
  await ta.open({ account: 'free', ...opts });
  return ta;
}

/** Ghi lại lỗi JS của trang để assert "không crash". */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Cột nút công cụ', () => {
  // Từ 07/10/2026 (commit "Biểu đồ: đưa Replay, Bố cục, AI Chart lên thanh đầu trang"): cửa sổ rộng ≥ 1130 thì Replay, Bố
  // cục, AI nằm trên thanh đầu trang (sau nút ⓘ Hướng dẫn); hẹp hơn thì về cột nút tròn ở mép phải. Nút "Mở rộng/Thu gọn
  // công cụ" đã bỏ → TC_PTKT_RP_02/03/04 đã xoá.
  test('TC_PTKT_RP_01: Thanh đầu trang có 3 nút Replay, Bố cục, AI (sau nút Hướng dẫn)', async ({ page }) => {
    const ta = await openPaid(page);
    const slot = page.locator('#ta-header-tools');
    await expect(slot.locator('.ta-tools.ta-head-tools')).toBeVisible();
    await expect(ta.replayFab).toBeVisible();
    await expect(slot.locator('.ta-replay-fab:not(.ta-layout-fab)')).toHaveCount(1);
    await expect(ta.replayFab).toHaveAttribute('aria-label', 'Mở Replay');
    await expect(ta.replayFab).toHaveAttribute('data-tip', 'Mở Replay');
    await expect(ta.layoutFab).toBeVisible();
    await expect(ta.layoutFab).toHaveAttribute('data-tip', 'Bố cục');
    await expect(ta.aiBtn).toBeVisible();
    await expect(ta.aiBtn).toHaveText('AI');
    // Nút nằm ngay sau nút ⓘ Hướng dẫn
    const order = await page.evaluate(() => {
      const guide = document.querySelector('[aria-label="Hướng dẫn"]');
      const tools = document.getElementById('ta-header-tools');
      return guide && tools ? !!(guide.compareDocumentPosition(tools) & Node.DOCUMENT_POSITION_FOLLOWING) : null;
    });
    expect(order).toBe(true);
    await expect(page.getByRole('button', { name: 'Mở rộng/Thu gọn công cụ' })).toHaveCount(0);
  });

  test('TC_PTKT_RP_05: Nút công cụ chỉ có ở trang Biểu đồ (Phân tích kỹ thuật)', async ({ page }) => {
    const ta = await openPaid(page);
    await expect(ta.replayFab).toBeVisible();
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await expect(page.getByRole('button', { name: 'Mở Replay' })).toHaveCount(0);
    await expect(ta.layoutFab).toHaveCount(0);
    await expect(ta.aiBtn).toHaveCount(0);
    // Chỗ chờ trên thanh đầu trang vẫn có nhưng trống, không chiếm chỗ
    await expect(page.locator('#ta-header-tools')).toBeEmpty();
  });

  test('TC_PTKT_RP_65: Nút AI trên thanh đầu trang mở / đóng tab AI Chart ở thanh tab dọc', async ({ page }) => {
    const ta = await openPaid(page);
    await ta.waitChartsReady();
    await expect(ta.aiBtn).toHaveAttribute('aria-label', 'Mở AI Chart');
    await expect(ta.aiBtn).toHaveAttribute('aria-pressed', 'false');
    await ta.aiBtn.click();
    await expect(ta.aiBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(ta.aiBtn).toHaveAttribute('aria-label', 'Đóng AI Chart');
    await expect(page.locator('.flexlayout__border_button--selected').filter({ hasText: 'AI Chart' })).toHaveCount(1);
    await ta.aiBtn.click();
    await expect(ta.aiBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.flexlayout__border_button--selected').filter({ hasText: 'AI Chart' })).toHaveCount(0);
  });

  test.describe(() => {
    test.use({ viewport: { width: 1100, height: 800 } });
    test('TC_PTKT_RP_66: Cửa sổ hẹp dưới 1130 → Replay, Bố cục về cột nút tròn ở mép phải, không có nút AI', async ({ page }) => {
      const ta = await openPaid(page);
      await expect(ta.replayFab).toBeVisible();
      await expect(page.locator('#ta-header-tools .ta-tools')).toHaveCount(0);
      await expect(page.locator('.ta-chart-layout > .ta-tools')).toHaveCount(1);
      await expect(ta.layoutFab).toBeVisible();
      await expect(ta.aiBtn).toHaveCount(0); // ở cột mép phải đã có nút trợ lý AI riêng
      await ta.replayFab.click();
      await expect(ta.replayBar).toBeVisible();
    });
  });
});

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Replay: thanh điều khiển', () => {
  test('TC_PTKT_RP_06: Mở thanh Replay bằng nút tròn', async ({ page }) => {
    const ta = await openPaid(page);
    await ta.openReplay();
    await expect(ta.replayGrip).toBeVisible();
    await expect(ta.replayDate).toBeVisible();
    await expect(ta.replayPlay).toBeVisible();
    await expect(ta.replayStep).toBeVisible();
    await expect(ta.replayLive).toBeVisible();
    await expect(ta.replaySpeedBtn).toBeVisible();
    await expect(ta.replaySelBtn).toBeVisible();
    await expect(ta.replayClose).toBeVisible();
    await expect(ta.replayFab).toHaveAttribute('aria-label', 'Đóng Replay');
  });

  test('TC_PTKT_RP_07: Giá trị mặc định của thanh Replay', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.openReplay();
    // Chấp nhận lệch 1 ngày nếu test chạy đúng lúc qua nửa đêm giờ VN.
    expect([vnDate(90), vnDate(91)]).toContain(await ta.replayDate.inputValue());
    expect([vnDate(1), vnDate(2)]).toContain(await ta.replayDate.getAttribute('max'));
    await expect(ta.replaySpeedBtn).toHaveText(/^\s*20x\s*$/);
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 2\/3/);
    await expect(ta.replayPlay).toBeEnabled();
    await expect(ta.replayStep).toBeDisabled();
    await expect(ta.replayLive).toBeDisabled();
    await expect(ta.replayStatus).toHaveCount(0);
  });

  test('TC_PTKT_RP_08: Danh sách tốc độ: 6 mức kèm mô tả theo khung thời gian', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.openReplay();
    await ta.replaySpeedBtn.click();
    const options = ta.replaySpeedList.getByRole('option');
    await expect(options).toHaveCount(6);
    const expected = [1, 5, 10, 20, 50, 200];
    for (let i = 0; i < expected.length; i++) {
      await expect(options.nth(i).locator('.ta-replay-speed-x')).toHaveText(`${expected[i]}x`);
      await expect(options.nth(i).locator('.ta-replay-speed-desc')).toHaveText(`${expected[i]} ngày/giây`);
    }
    await expect(ta.replaySpeedList.getByRole('option', { selected: true })).toContainText('20x');
  });

  test('TC_PTKT_RP_09: Chọn tốc độ khác cập nhật nút và đóng danh sách', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.openReplay();
    await ta.replaySpeedBtn.click();
    await ta.replaySpeedList.getByRole('option', { name: /^5x/ }).click();
    await expect(ta.replaySpeedBtn).toHaveText(/^\s*5x\s*$/);
    await expect(ta.replaySpeedList).toHaveCount(0);
  });

  test('TC_PTKT_RP_10: Chạy Replay: hiện ngày đang chiếu, nến tiến dần', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    const start = Date.parse(`${await ta.replayDate.inputValue()}T00:00:00Z`);
    await ta.startReplay();
    await expect(ta.replayPlay).toHaveAttribute('aria-label', 'Dừng', { timeout: 15000 });
    const first = parseVn(await ta.replayStatus.textContent());
    expect(first).toBeGreaterThanOrEqual(start);
    await page.waitForTimeout(2000);
    const later = parseVn(await ta.replayStatus.textContent());
    expect(later, 'Sau 2 giây ở 20x ngày đang chiếu phải muộn hơn').toBeGreaterThan(first);
  });

  test('TC_PTKT_RP_11: Dừng giữ nguyên mốc; "Tiến 1 nến" tiến đúng 1 phiên', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.startReplay();
    await expect(ta.replayPlay).toHaveAttribute('aria-label', 'Dừng', { timeout: 15000 });
    await page.waitForTimeout(500);
    await ta.replayPlay.click();
    await expect(ta.replayPlay).toHaveAttribute('aria-label', 'Chạy');
    const paused = await ta.replayStatus.textContent();
    await page.waitForTimeout(3000);
    await expect(ta.replayStatus).toHaveText(paused!);
    await expect(ta.replayStep).toBeEnabled();

    await ta.replayStep.click();
    await expect(ta.replayStatus).not.toHaveText(paused!);
    const diff = parseVn(await ta.replayStatus.textContent()) - parseVn(paused);
    expect(diff).toBeGreaterThan(0);
    expect(diff, 'Tiến 1 nến chỉ sang phiên kế tiếp').toBeLessThanOrEqual(7 * DAY);
  });

  test('TC_PTKT_RP_12: Tốc độ quyết định số nến mỗi giây', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    const startIso = vnDate(200);

    const runFor = async (speed: string) => {
      await ta.replaySpeedBtn.click();
      await ta.replaySpeedList.getByRole('option', { name: new RegExp(`^${speed}x`) }).click();
      await ta.setReplayDate(startIso);
      await ta.startReplay();
      await expect(ta.replayPlay).toHaveAttribute('aria-label', 'Dừng', { timeout: 15000 });
      const from = parseVn(await ta.replayStatus.textContent());
      await page.waitForTimeout(3000);
      await ta.replayPlay.click();
      const to = parseVn(await ta.replayStatus.textContent());
      await ta.replayLive.click();
      await expect(ta.replayStatus).toHaveCount(0);
      return (to - from) / DAY;
    };
    const slow = await runFor('1');
    const fast = await runFor('20');
    expect(slow, '1x trong 3 giây chỉ tiến vài phiên').toBeLessThanOrEqual(10);
    expect(fast, '20x trong 3 giây tiến nhiều hơn hẳn').toBeGreaterThanOrEqual(30);
  });

  test('TC_PTKT_RP_13: Chạy tới nến mới nhất thì tự dừng', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.setReplayDate(vnDate(7));
    await ta.replayPlay.click();
    await expect(ta.replayPlay).toHaveAttribute('aria-label', 'Đã tới nến mới nhất', { timeout: 20000 });
    await expect(ta.replayPlay).toBeDisabled();
    await expect(ta.replayStep).toBeDisabled();
    await expect(ta.replayLive).toBeEnabled();
  });

  test('TC_PTKT_RP_14: Đổi ngày bắt đầu khi đang chiếu', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.startReplay();
    await expect(ta.replayPlay).toHaveAttribute('aria-label', 'Dừng', { timeout: 15000 });
    await ta.setReplayDate('2026-05-04');
    await expect(ta.replayStatus).toHaveText('04/05/2026', { timeout: 15000 });
    await expect(ta.replayPlay).toHaveAttribute('aria-label', 'Chạy');
  });

  test('TC_PTKT_RP_15: "Về hiện tại" thoát chiếu lại nhưng giữ thanh mở', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.startReplay();
    await expect(ta.replayLive).toBeEnabled({ timeout: 15000 });
    await ta.replayLive.click();
    await expect(ta.replayStatus).toHaveCount(0);
    await expect(ta.replayBar).toBeVisible();
    await expect(ta.replayLive).toBeDisabled();
    await expect(ta.replayStep).toBeDisabled();
  });

  test('TC_PTKT_RP_16: Nút ✕ đóng hẳn thanh Replay', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.startReplay();
    await ta.replayClose.click();
    await expect(ta.replayBar).toHaveCount(0);
    await expect(ta.replayFab).toHaveAttribute('aria-label', 'Mở Replay');
  });

  test('TC_PTKT_RP_17: Bấm lại nút tròn để đóng Replay', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.openReplay();
    await ta.replayFab.click();
    await expect(ta.replayBar).toHaveCount(0);
    await expect(ta.replayFab).toHaveAttribute('aria-label', 'Mở Replay');
  });

  test('TC_PTKT_RP_18: Kéo thanh Replay bằng tay nắm', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.openReplay();
    const before = (await ta.replayBar.boundingBox())!;
    const g = (await ta.replayGrip.boundingBox())!;
    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
    await page.mouse.down();
    await page.mouse.move(g.x - 300, g.y - 300, { steps: 10 });
    await page.mouse.up();
    const after = (await ta.replayBar.boundingBox())!;
    expect(before.x - after.x).toBeGreaterThan(250);
    expect(before.y - after.y).toBeGreaterThan(250);
  });

  test('TC_PTKT_RP_19: Mất mạng khi đang Replay không làm hỏng trang', async ({ page, context }) => {
    const errors = collectErrors(page);
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await context.setOffline(true);
    try {
      await ta.setReplayDate('2019-01-02');
      await ta.replayPlay.click();
      await page.waitForTimeout(5000);
      await expect(ta.replayBar).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
    await ta.replayClose.click();
    await expect(ta.replayBar).toHaveCount(0);
    expect(errors, 'Không có lỗi JS khi mất mạng').toEqual([]);
  });
});

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Replay: chọn biểu đồ chiếu lại', () => {
  test('TC_PTKT_RP_20: Bảng "Biểu đồ: n/m" hiển thị đúng khung và thẻ', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.replaySelBtn.click();
    const panel = ta.replaySelPanel;
    await expect(panel.getByText('Chọn nhanh')).toBeVisible();
    await expect(panel.getByLabel('Các thẻ đang hiện')).toBeChecked();
    await expect(panel.getByLabel('Tất cả thẻ')).not.toBeChecked();
    await expect(panel.getByLabel('Chỉ ô đang chọn')).not.toBeChecked();
    await expect(panel.locator('.ta-replay-frame-row')).toHaveText(['Khung 1', 'Khung 2']);
    const row = (name: string) => panel.locator('.ta-replay-tab-row', { hasText: name });
    await expect(row('VNM')).toContainText('đang hiện');
    await expect(row('FPT')).toContainText('chưa mở');
    await expect(row('HPG')).toContainText('đang hiện');
  });

  test('TC_PTKT_RP_21: Các lựa chọn nhanh đổi số thẻ chiếu', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2x2_TABS });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.replaySelBtn.click();
    await ta.replaySelPanel.getByLabel('Chỉ ô đang chọn').check();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 1\/4/);
    await ta.replaySelPanel.getByLabel('Tất cả thẻ').check();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 4\/4/);
    await ta.replaySelPanel.getByLabel('Các thẻ đang hiện').check();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 2\/4/);
  });

  test('TC_PTKT_RP_22: Bỏ tick 1 thẻ chuyển sang "Tự chọn", khung tick một phần', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2x2_TABS });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.replaySelBtn.click();
    await ta.replaySelPanel.getByLabel('Tất cả thẻ').check();
    await ta.replaySelPanel.locator('.ta-replay-tab-row', { hasText: 'MBB' }).locator('input').uncheck();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 3\/4/);
    await expect(ta.replaySelPanel.getByText('Tự chọn')).toBeVisible();
    const frame2 = ta.replaySelPanel.locator('.ta-replay-frame-row', { hasText: 'Khung 2' }).locator('input');
    expect(await frame2.evaluate((e: any) => e.indeterminate)).toBe(true);
  });

  test('TC_PTKT_RP_23: Tick khung chọn hết thẻ của khung đó', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2x2_TABS });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.replaySelBtn.click();
    await ta.replaySelPanel.getByLabel('Chỉ ô đang chọn').check();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 1\/4/);
    await ta.replaySelPanel.locator('.ta-replay-frame-row', { hasText: 'Khung 2' }).locator('input').check();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 3\/4/);
    for (const name of ['HPG', 'MBB']) {
      await expect(ta.replaySelPanel.locator('.ta-replay-tab-row', { hasText: name }).locator('input')).toBeChecked();
    }
  });

  test('TC_PTKT_RP_24: Lựa chọn thẻ chiếu lại được nhớ sau khi tải lại', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2x2_TABS });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.replaySelBtn.click();
    await ta.replaySelPanel.getByLabel('Tất cả thẻ').check();
    await ta.replaySelPanel.locator('.ta-replay-tab-row', { hasText: 'MBB' }).locator('input').uncheck();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 3\/4/);
    const saved = await page.evaluate(() => localStorage.getItem('ta_replay_selection'));
    expect(saved).toContain('"mode":"custom"');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await ta.chartTabs.first().waitFor({ timeout: 30000 });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.replaySelBtn.click();
    await expect(ta.replaySelBtn).toHaveText(/Biểu đồ: 3\/4/);
    await expect(ta.replaySpeedBtn).toHaveText(/^\s*20x\s*$/);
  });

  // Mốc của từng ô chỉ vẽ trên canvas TradingView trong iframe — không đọc được ngày nến cuối từng ô qua DOM.
  test.fixme('TC_PTKT_RP_25: Nhiều ô chiếu cùng mốc; ô bị che và ô chưa mở vào lượt chiếu', async () => {});

  test('TC_PTKT_RP_26: Bấm ra ngoài đóng bảng chọn biểu đồ', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.replaySelBtn.click();
    await expect(ta.replaySelPanel).toBeVisible();
    // Bấm vào nội dung panel Thông tin (Vue). Bấm vào nút dọc "Thông tin" của flexlayout KHÔNG đóng bảng — xem mục Phát hiện trong .md.
    await page.getByText('Giao dịch', { exact: true }).click();
    await expect(ta.replaySelPanel).toHaveCount(0);
  });
});

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Bố cục: chia khung', () => {
  test('TC_PTKT_RP_27: Bảng Bố cục hiển thị đủ 21 cách chia', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.openLayoutPanel();
    await expect(ta.layoutPanel.getByText('Bố cục trang')).toBeVisible();
    for (let n = 1; n <= 6; n++) await expect(ta.layoutPanel.getByText(`${n} khung`, { exact: true })).toBeVisible();
    await expect(ta.layoutPresetButtons).toHaveCount(21);
    await expect(ta.layoutPreset('Lưới 2 cột, 2 hàng')).toBeVisible();
    await expect(ta.layoutPreset('1 lớn và 5 nhỏ')).toBeVisible();
    await expect(ta.layoutPresetActive).toHaveCount(1);
    await expect(ta.layoutPresetActive).toHaveAttribute('aria-label', '2 khung cạnh nhau');
    await expect(ta.layoutPanel.locator('.ta-layout-item:disabled')).toHaveCount(0);
    await expect(ta.resetLayoutBtn).toBeVisible();
    await expect(ta.layoutPanel.locator('.ta-layout-title', { hasText: 'Liên kết thẻ' })).toBeVisible();
    await expect(ta.createLinkGroupBtn).toBeVisible();
  });

  test('TC_PTKT_RP_28: Đóng bảng Bố cục bằng Esc, bấm lại nút, bấm ra ngoài', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.openLayoutPanel();
    await page.keyboard.press('Escape');
    await expect(ta.layoutPanel).toHaveCount(0);

    await ta.openLayoutPanel();
    await ta.layoutFab.click();
    await expect(ta.layoutPanel).toHaveCount(0);

    await ta.openLayoutPanel();
    await page.locator('.flexlayout__border_button', { hasText: 'Thông tin' }).click();
    await expect(ta.layoutPanel).toHaveCount(0);
  });

  test('TC_PTKT_RP_29: Chọn "3 cột": giữ mọi thẻ, thêm thẻ cho khung mới, chia đều', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.openLayoutPanel();
    await ta.layoutPreset('3 cột').click();
    await expect(ta.tabsets).toHaveCount(3);
    await expect(ta.layoutPanel).toHaveCount(0);
    await expect(ta.chartTabs).toHaveText(['VNM', 'FPT', 'HPG', 'VNM']);
    const rects = await ta.tabsetRects();
    expect(new Set(rects.map((r) => r[1])).size, 'Cùng một hàng').toBe(1);
    const widths = rects.map((r) => r[2]);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(2);
  });

  test('TC_PTKT_RP_30: Chọn "1 khung": thẻ của các khung dồn vào 1 khung', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.openLayoutPanel();
    await ta.layoutPreset('1 khung').click();
    await expect(ta.tabsets).toHaveCount(1);
    await expect(ta.chartTabs).toHaveText(['VNM', 'FPT', 'HPG']);
  });

  test('TC_PTKT_RP_31: "2 khung trên dưới" xếp dọc', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.openLayoutPanel();
    await ta.layoutPreset('2 khung trên dưới').click();
    await expect(ta.tabsets).toHaveCount(2);
    const [a, b] = await ta.tabsetRects();
    expect(a[0]).toBe(b[0]);
    expect(b[1]).toBeGreaterThan(a[1] + a[3] - 5);
    await ta.openLayoutPanel();
    await expect(ta.layoutPresetActive).toHaveAttribute('aria-label', '2 khung trên dưới');
  });

  test('TC_PTKT_RP_32: Đủ 21 cách chia đều cho đúng số khung', async ({ page }) => {
    test.setTimeout(300_000);
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.openLayoutPanel();
    const presets = await ta.layoutPanel.locator('.ta-layout-row').evaluateAll((rows) => rows.map((r) => ({
      n: parseInt(r.querySelector('.ta-layout-label')!.textContent!, 10),
      names: Array.from(r.querySelectorAll('.ta-layout-item')).map((b: any) => b.getAttribute('aria-label')!),
    })));
    await page.keyboard.press('Escape');
    expect(presets.reduce((s, g) => s + g.names.length, 0)).toBe(21);
    for (const g of presets) {
      for (const name of g.names) {
        await ta.openLayoutPanel();
        await ta.layoutPreset(name).click();
        await expect(ta.tabsets, `Cách chia "${name}"`).toHaveCount(g.n);
        await ta.openLayoutPanel();
        await expect(ta.layoutPresetActive, `Cách chia "${name}" được tô`).toHaveAttribute('aria-label', name);
        await page.keyboard.press('Escape');
      }
    }
  });

  test('TC_PTKT_RP_33: "Đặt lại bố cục" chia đều cỡ các khung', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.openLayoutPanel();
    await ta.layoutPreset('3 cột').click();
    await expect(ta.tabsets).toHaveCount(3);
    await ta.dragBy(ta.splitters.first(), 150, 0);
    let w = (await ta.tabsetRects()).map((r) => r[2]);
    expect(w[0] - w[1]).toBeGreaterThan(100);

    await ta.openLayoutPanel();
    await ta.resetLayoutBtn.click();
    await expect(ta.layoutPanel).toHaveCount(0);
    await expect.poll(async () => {
      w = (await ta.tabsetRects()).map((r) => r[2]);
      return Math.max(...w) - Math.min(...w);
    }).toBeLessThanOrEqual(2);
    await expect(ta.tabsets).toHaveCount(3);
    await expect(ta.chartTabs).toHaveCount(4);
  });

  test('TC_PTKT_RP_34: Đổi bố cục khi đang Replay thì thoát Replay', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.startReplay();
    await ta.openLayoutPanel();
    await ta.layoutPreset('2 khung cạnh nhau').click();
    await expect(ta.tabsets).toHaveCount(2);
    await expect(ta.replayBar).toHaveCount(0);
    await expect(ta.replayFab).toHaveAttribute('aria-label', 'Mở Replay');
  });

  test('TC_PTKT_RP_35: Đổi bố cục gửi lệnh lưu bố cục theo tài khoản', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    const before = ta.blockedWrites.length;
    await ta.openLayoutPanel();
    await ta.layoutPreset('3 cột').click();
    await expect.poll(() => ta.blockedWrites.slice(before).filter((w) => w.includes('layout_multi_ta')).length,
      { timeout: 15000 }).toBeGreaterThan(0);
    const last = ta.blockedWrites.slice(before).filter((w) => w.includes('layout_multi_ta')).pop()!;
    const value = JSON.parse(JSON.parse(last).listitem.find((i: any) => i.key === 'layout_multi_ta').value);
    let tabsets = 0;
    const visit = (n: any) => { if (n.type === 'tabset') tabsets++; (n.children || []).forEach(visit); };
    visit(value.layout);
    expect(tabsets).toBe(3);
  });
});

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Kéo thanh chia khung', () => {
  test('TC_PTKT_RP_36: Kéo thanh chia đổi cỡ 2 khung', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    const [a0, b0] = await ta.tabsetRects();
    await ta.dragBy(ta.splitters.first(), 150, 0);
    const [a1, b1] = await ta.tabsetRects();
    expect(a1[2] - a0[2]).toBeGreaterThan(120);
    expect(b0[2] - b1[2]).toBeGreaterThan(120);
  });

  async function openGrid(page: Page) {
    const ta = await openPaid(page, { layout: { frames: [[{ symbol: 'VNM' }], [{ symbol: 'FPT' }]] } });
    await ta.waitChartsReady();
    await ta.openLayoutPanel();
    await ta.layoutPreset('Lưới 2 cột, 2 hàng').click();
    await expect(ta.tabsets).toHaveCount(4);
    await page.waitForTimeout(1500);
    return ta;
  }
  /** Chiều cao khung trên của cột trái / cột phải (khung có y nhỏ nhất ở mỗi x). */
  async function topHeights(ta: TaReplayLayoutPage) {
    const rects = await ta.tabsetRects();
    const xs = [...new Set(rects.map((r) => r[0]))].sort((a, b) => a - b);
    return xs.map((x) => rects.filter((r) => r[0] === x).sort((a, b) => a[1] - b[1])[0][3]);
  }
  const leftHorz = (ta: TaReplayLayoutPage) => ta.tabsets.page().locator('.ta-chart-layout .flexlayout__splitter_horz').first();

  test('TC_PTKT_RP_37: Thanh chung: rê chuột hiện vạch dài, kéo thì các đoạn cùng dời', async ({ page }) => {
    const ta = await openGrid(page);
    const [l0, r0] = await topHeights(ta);
    expect(l0).toBe(r0);
    const s = (await leftHorz(ta).boundingBox())!;
    await page.mouse.move(s.x + 50, s.y + s.height / 2);
    const line = page.locator('.ta-split-line');
    await expect(line).toHaveCount(1);
    expect((await line.boundingBox())!.width, 'Vạch chung dài hết 2 cột').toBeGreaterThan(s.width * 1.8);

    await ta.dragBy(leftHorz(ta), 0, 60);
    const [l1, r1] = await topHeights(ta);
    expect(l1 - l0).toBeGreaterThan(40);
    expect(r1).toBe(l1);
  });

  test('TC_PTKT_RP_38: Giữ Alt kéo riêng một đoạn', async ({ page }) => {
    const ta = await openGrid(page);
    const [l0, r0] = await topHeights(ta);
    await ta.dragBy(leftHorz(ta), 0, 40, true);
    const [l1, r1] = await topHeights(ta);
    expect(l1 - l0).toBeGreaterThan(25);
    expect(r1).toBe(r0);
  });

  test('TC_PTKT_RP_39: Hút thẳng hàng khi thả gần thanh khác (≤ 8px)', async ({ page }) => {
    const ta = await openGrid(page);
    await ta.dragBy(leftHorz(ta), 0, 40, true);
    const [l1, r1] = await topHeights(ta);
    expect(l1 - r1).toBeGreaterThan(25);
    // Kéo ngược lại sao cho còn cách thanh cột phải vài px → phải hút về đúng hàng.
    await ta.dragBy(leftHorz(ta), 0, -(l1 - r1 - 5), true);
    const [l2, r2] = await topHeights(ta);
    expect(l2).toBe(r2);
  });
});

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Liên kết thẻ', () => {
  test('TC_PTKT_RP_40: Giữ Ctrl bấm 1 thẻ: bật thanh chọn thẻ', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    await ta.ctrlClickTab('FPT');
    await expect(ta.tabMark('FPT')).toHaveClass(/ta-tab-picked/);
    await expect(ta.tab('FPT')).not.toHaveClass(/--selected/);
    await expect(ta.linkBar).toContainText('Đã chọn 1 thẻ');
    await expect(ta.linkBar).toContainText('Chọn thêm 1 thẻ để tạo nhóm liên kết');
    await expect(ta.linkBar.getByRole('button', { name: 'Huỷ' })).toBeVisible();
  });

  test('TC_PTKT_RP_41: Tạo nhóm liên kết từ 2 thẻ', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    await ta.ctrlClickTab('VNM');
    await ta.ctrlClickTab('FPT');
    await expect(ta.linkBar).toContainText('Đã chọn 2 thẻ');
    // Từ 04/11/2026: "Tạo nhóm mới" mở hộp "Đồng bộ giữa các thẻ" (mặc định tích khung thời gian + chỉ báo), bấm "Tạo nhóm"
    await ta.linkBarAction('Tạo nhóm mới').click();
    await expect(ta.linkCreateMenu).toContainText('Đồng bộ giữa các thẻ');
    await expect(ta.linkCreateMenu.locator('input[type=checkbox]:checked')).toHaveCount(2);
    await ta.linkCreateMenu.getByRole('button', { name: 'Tạo nhóm', exact: true }).click();
    await expect(ta.linkBar).toHaveCount(0);
    expect(await ta.tabLinks()).toEqual(['link-1', 'link-1', 'link-6']);
    await expect(ta.tab('VNM').locator('.ta-tab-dot')).toBeVisible();
    // Trước 07/10/2026 dấu thẻ có title "Liên kết với <thẻ kia>". Nay thay bằng hộp gợi ý khi rê chuột (TabLinkHint.vue), và
    // từ 03/11/2026 thẻ đã liên kết không ghi tên nhóm — hộp chỉ còn dòng hướng dẫn giữ phím để thêm/bớt thẻ.
    await expect(ta.tabMark('VNM')).toHaveAttribute('data-ta-link', 'link-1');
    await expect(ta.tabMark('FPT')).toHaveAttribute('data-ta-link', 'link-1');
    await ta.tab('VNM').hover();
    const hint = page.locator('.ta-tab-hint');
    await expect(hint).toBeVisible({ timeout: 5000 });
    await expect(hint.locator('.ta-tab-hint-title')).toHaveCount(0);
    await expect(hint).toContainText(/Giữ .+ hoặc Shift/);
    await expect(ta.tab('HPG').locator('.ta-tab-dot')).toHaveCount(0);
  });

  test('TC_PTKT_RP_42: Thẻ cùng nhóm KHÔNG đổi mã theo nhau nữa (từ 03/11/2026 nhóm đồng bộ khung thời gian + chỉ báo)', async ({ page }) => {
    // Nhóm không có `link_sync` (tạo trước 04/11/2026) mặc định đồng bộ khung thời gian + chỉ báo, mã từng thẻ giữ nguyên
    // (commit 768f7af99, c1fff0ab4). Chi tiết các kiểu đồng bộ thuộc bộ test "Liên kết thẻ theo khoảng thời gian" (nhóm 6).
    const ta = await openPaid(page, {
      layout: { frames: [[{ symbol: 'VNM', link: 'link-1' }], [{ symbol: 'HPG', link: 'link-1' }]] },
    });
    await ta.waitChartsReady();
    await ta.changeActiveSymbol('FPT');
    await expect(ta.chartTabs.first()).toHaveText('FPT', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await expect(ta.chartTabs).toHaveText(['FPT', 'HPG']);
  });

  test('TC_PTKT_RP_43: Thẻ không liên kết không đổi mã theo', async ({ page }) => {
    const ta = await openPaid(page, { layout: { frames: [[{ symbol: 'VNM' }], [{ symbol: 'HPG' }]] } });
    await ta.waitChartsReady();
    await ta.changeActiveSymbol('FPT');
    await expect(ta.chartTabs.first()).toHaveText('FPT', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await expect(ta.chartTabs.nth(1)).toHaveText('HPG');
  });

  test('TC_PTKT_RP_44: Huỷ hoặc Esc bỏ chọn thẻ', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    await ta.ctrlClickTab('FPT');
    await ta.linkBar.getByRole('button', { name: 'Huỷ' }).click();
    await expect(ta.linkBar).toHaveCount(0);
    await expect(page.locator('.ta-tab-picked')).toHaveCount(0);

    await ta.ctrlClickTab('FPT');
    await expect(ta.linkBar).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(ta.linkBar).toHaveCount(0);
    await expect(page.locator('.ta-tab-picked')).toHaveCount(0);
    expect(await ta.tabLinks()).toEqual(['link-6', 'link-6', 'link-6']);
  });

  const TWO_GROUPS: LayoutSpec = {
    frames: [
      [{ symbol: 'VNM', link: 'link-1' }, { symbol: 'FPT', link: 'link-1' }],
      [{ symbol: 'HPG', link: 'link-2' }, { symbol: 'MBB', link: 'link-2' }],
    ],
  };

  test('TC_PTKT_RP_45: Bảng Bố cục liệt kê nhóm; ✕ xoá 1 thẻ khỏi nhóm, nhóm còn 1 thẻ vẫn giữ', async ({ page }) => {
    const ta = await openPaid(page, { layout: TWO_GROUPS });
    await ta.waitChartsReady();
    await ta.openLayoutPanel();
    await expect(ta.linkGroupRows).toHaveCount(2);
    await expect(ta.linkGroupRows.nth(0).locator('.ta-link-chip-name')).toHaveText(['VNM', 'FPT']);
    await expect(ta.linkGroupRows.nth(1).locator('.ta-link-chip-name')).toHaveText(['HPG', 'MBB']);
    await expect(ta.linkGroupRows.nth(0).getByRole('button', { name: 'Thêm thẻ' })).toBeVisible();

    await ta.layoutPanel.getByRole('button', { name: 'Xoá FPT khỏi nhóm' }).click();
    await expect(ta.linkGroupRows).toHaveCount(2);
    await expect(ta.linkGroupRows.nth(0).locator('.ta-link-chip-name')).toHaveText(['VNM']);
    expect(await ta.tabLinks()).toEqual(['link-1', 'link-6', 'link-2', 'link-2']);
  });

  test('TC_PTKT_RP_46: Xoá nhóm liên kết', async ({ page }) => {
    const ta = await openPaid(page, { layout: TWO_GROUPS });
    await ta.waitChartsReady();
    await ta.openLayoutPanel();
    await ta.linkGroupRows.nth(1).getByRole('button', { name: 'Xoá nhóm liên kết' }).click();
    await expect(ta.linkGroupRows).toHaveCount(1);
    expect(await ta.tabLinks()).toEqual(['link-1', 'link-1', 'link-6', 'link-6']);
    await expect(ta.tab('HPG').locator('.ta-tab-dot')).toHaveCount(0);
  });

  test('TC_PTKT_RP_47: "+ Thêm thẻ" vào một nhóm có sẵn', async ({ page }) => {
    const ta = await openPaid(page, {
      layout: { frames: [[{ symbol: 'VNM', link: 'link-1' }, { symbol: 'FPT', link: 'link-1' }], [{ symbol: 'HPG' }]] },
    });
    await ta.waitChartsReady();
    await ta.openLayoutPanel();
    await ta.linkGroupRows.first().getByRole('button', { name: 'Thêm thẻ' }).click();
    await expect(ta.layoutPanel).toHaveCount(0);
    await expect(page.locator('.ta-tab-check')).toHaveCount(3);
    await expect(ta.linkBar).toContainText('Chọn thẻ để thêm vào nhóm');
    await expect(ta.linkBar).toContainText('Cam');

    await ta.tab('HPG').click();
    await expect(ta.linkBar).toContainText('Đã chọn 1 thẻ');
    await ta.linkBarAction('Thêm').click();
    expect(await ta.tabLinks()).toEqual(['link-1', 'link-1', 'link-1']);
  });

  test('TC_PTKT_RP_48: "Tạo nhóm liên kết" bật chế độ chọn thẻ không cần giữ phím', async ({ page }) => {
    const ta = await openPaid(page, { layout: LAYOUT_2_FRAMES });
    await ta.waitChartsReady();
    await ta.openLayoutPanel();
    await ta.createLinkGroupBtn.click();
    await expect(ta.layoutPanel).toHaveCount(0);
    await expect(page.locator('.ta-tab-check')).toHaveCount(3);
    await expect(ta.linkBar).toContainText('Đã chọn 0 thẻ');

    await ta.tab('FPT').click();
    await ta.tab('HPG').click();
    await ta.createLinkGroupFromBar();
    expect(await ta.tabLinks()).toEqual(['link-6', 'link-1', 'link-1']);
  });

  test('TC_PTKT_RP_49: Thanh chọn thẻ: "Thêm vào nhóm ▾" và "Xoá khỏi nhóm"', async ({ page }) => {
    const ta = await openPaid(page, {
      layout: {
        frames: [
          [{ symbol: 'VNM', link: 'link-1' }, { symbol: 'FPT' }],
          [{ symbol: 'HPG', link: 'link-1' }, { symbol: 'MBB' }],
        ],
      },
    });
    await ta.waitChartsReady();
    await ta.ctrlClickTab('VNM');
    await ta.ctrlClickTab('MBB');
    for (const name of ['Tạo nhóm mới', 'Thêm vào nhóm', 'Xoá khỏi nhóm', 'Huỷ']) {
      await expect(ta.linkBar.getByRole('button', { name })).toBeVisible();
    }
    await ta.linkBar.getByRole('button', { name: 'Thêm vào nhóm' }).click();
    const item = page.locator('.ta-link-menu-item');
    await expect(item).toHaveCount(1);
    await expect(item).toContainText('Nhóm Cam');
    await expect(item).toContainText('VNM, HPG');
    await item.click();
    expect(await ta.tabLinks()).toEqual(['link-1', 'link-6', 'link-1', 'link-1']);

    await ta.ctrlClickTab('VNM');
    await expect(ta.linkBarAction('Xoá khỏi nhóm')).toBeVisible();
    await expect(ta.linkBarAction('Tạo nhóm mới')).toHaveCount(0);
    await expect(ta.linkBar.getByRole('button', { name: 'Thêm vào nhóm' })).toHaveCount(0);
    await ta.linkBarAction('Xoá khỏi nhóm').click();
    expect(await ta.tabLinks()).toEqual(['link-6', 'link-6', 'link-1', 'link-1']);
  });

  test('TC_PTKT_RP_50: Đã dùng đủ 5 màu nhóm thì không tạo được nhóm mới', async ({ page }) => {
    const syms = ['VNM', 'FPT', 'HPG', 'MBB', 'VIB', 'SHB', 'CTG', 'BID', 'TCB', 'ACB'];
    const tabs = syms.map((s, i) => ({ symbol: s, link: `link-${Math.floor(i / 2) + 1}` }));
    const ta = await openPaid(page, {
      // 4 khung × 3 thẻ, 2 thẻ chưa liên kết đứng ĐẦU khung để luôn nhìn thấy (7 thẻ/khung thì thẻ cuối bị thư viện ẩn vào menu tràn, Ctrl+click không tới được).
      layout: { frames: [[{ symbol: 'SSI' }, ...tabs.slice(0, 2)], [{ symbol: 'VND' }, ...tabs.slice(2, 4)], tabs.slice(4, 7), tabs.slice(7)] },
    });
    // Không chờ biểu đồ nạp: 4 khung cùng nạp trên prev2 có khi khung cuối quay vòng >60s; case này chỉ thao tác thanh thẻ.
    await expect(ta.chartTabs).toHaveCount(12);
    await ta.ctrlClickTab('SSI');
    await ta.ctrlClickTab('VND');
    await expect(ta.linkBar).toContainText('Đã chọn 2 thẻ');
    await expect(ta.linkBarAction('Tạo nhóm mới')).toHaveCount(0);
    await expect(ta.linkBar.getByRole('button', { name: 'Thêm vào nhóm' })).toBeVisible();
  });
});

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Hướng dẫn lần đầu', () => {
  const STEPS = ['Chọn bố cục', 'Liên kết thẻ', 'Replay', 'Ngày bắt đầu', 'Chạy, tiến 1 nến, Về hiện tại', 'Biểu đồ chiếu lại'];

  test('TC_PTKT_RP_51: Hướng dẫn tự hiện khi tài khoản chưa xem', async ({ page }) => {
    const ta = await openPaid(page, { onboardingSeen: false });
    await expect(ta.onboardingCard).toBeVisible({ timeout: 45000 });
    await expect(ta.onboardingCount).toHaveText('Bước 1/6');
    await expect(ta.onboardingTitle).toHaveText('Chọn bố cục');
    await expect(ta.onboardingBtn('Quay lại')).toBeDisabled();
    await expect(ta.onboardingBtn('Bỏ qua')).toBeVisible();
    await expect(ta.onboardingBtn('Tiếp')).toBeVisible();
  });

  test('TC_PTKT_RP_52: Đi hết 6 bước; bước 4–6 tự mở thanh Replay; "Xong" đóng cả hai', async ({ page }) => {
    const ta = await openPaid(page, { onboardingSeen: false });
    await expect(ta.onboardingCard).toBeVisible({ timeout: 45000 });
    for (let i = 0; i < STEPS.length; i++) {
      await expect(ta.onboardingCount).toHaveText(`Bước ${i + 1}/6`);
      await expect(ta.onboardingTitle).toHaveText(STEPS[i]);
      if (i < 3) await expect(ta.replayBar).toHaveCount(0);
      else await expect(ta.replayBar).toBeVisible();
      if (i < STEPS.length - 1) await ta.onboardingBtn('Tiếp').click();
    }
    await ta.onboardingBtn('Xong').click();
    await expect(ta.onboardingCard).toHaveCount(0);
    await expect(ta.replayBar).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('ta_onboarding_seen'))).toBe('1');
  });

  test('TC_PTKT_RP_53: "Quay lại" và phím mũi tên chuyển bước', async ({ page }) => {
    const ta = await openPaid(page, { onboardingSeen: false });
    await expect(ta.onboardingCard).toBeVisible({ timeout: 45000 });
    await ta.onboardingBtn('Tiếp').click();
    await expect(ta.onboardingCount).toHaveText('Bước 2/6');
    await ta.onboardingBtn('Quay lại').click();
    await expect(ta.onboardingCount).toHaveText('Bước 1/6');
    await page.keyboard.press('ArrowRight');
    await expect(ta.onboardingCount).toHaveText('Bước 2/6');
    await page.keyboard.press('ArrowLeft');
    await expect(ta.onboardingCount).toHaveText('Bước 1/6');
  });

  for (const how of ['Bỏ qua', 'Esc'] as const) {
    test(`TC_PTKT_RP_54: "Bỏ qua" hoặc Esc tắt hướng dẫn và ghi đã xem — ${how}`, async ({ page }) => {
      const ta = await openPaid(page, { onboardingSeen: false });
      await expect(ta.onboardingCard).toBeVisible({ timeout: 45000 });
      if (how === 'Bỏ qua') await ta.onboardingBtn('Bỏ qua').click();
      else await page.keyboard.press('Escape');
      await expect(ta.onboardingCard).toHaveCount(0);
      expect(await page.evaluate(() => localStorage.getItem('ta_onboarding_seen'))).toBe('1');
    });
  }

  test('TC_PTKT_RP_55: Đã xem hướng dẫn thì không tự hiện', async ({ page }) => {
    const ta = await openPaid(page, { onboardingSeen: true });
    await ta.waitChartsReady();
    await page.waitForTimeout(8000);
    await expect(ta.onboardingCard).toHaveCount(0);
  });

  // TC_PTKT_RP_56 (hướng dẫn tự mở cột nút đang thu gọn) đã xoá: nút Mở rộng/Thu gọn công cụ bỏ từ 07/10/2026.
});

// =====================================================================================================
test.describe('PTKT Replay & Chia khung — Tài khoản miễn phí', () => {
  test('TC_PTKT_RP_57: Bố cục đã lưu nhiều khung bị thu về 1 khung, có nút mời nâng cấp', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_2_FRAMES });
    await expect(ta.tabsets).toHaveCount(1, { timeout: 15000 });
    await expect(ta.chartTabs).toHaveText(['VNM']);
    await expect(ta.freeUpgradeBtn).toHaveText('Nâng cấp gói để mở bố cục và thẻ đã lưu.');
    await ta.freeUpgradeBtn.click();
    await expect(ta.packageModal).toBeVisible();
  });

  test('TC_PTKT_RP_58: Free với bố cục 1 khung không có nút mời nâng cấp', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await expect(ta.freeUpgradeBtn).toHaveCount(0);
  });

  test('TC_PTKT_RP_59: Dấu + thêm thẻ: chú thích Pro, bấm mở popup, không thêm thẻ', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.addTabBtn.hover();
    const tip = page.locator('.ta-add-tip');
    await expect(tip.locator('.ta-pro-badge')).toHaveText('Pro');
    await expect(tip).toContainText('Thêm thẻ đồ thị mới. Nâng cấp gói để mở lên tới 15 thẻ đồ thị');
    await ta.addTabBtn.click();
    await expect(ta.packageModal).toBeVisible();
    await expect(ta.chartTabs).toHaveCount(1);
  });

  test('TC_PTKT_RP_60: Bảng Bố cục khoá cách chia từ 2 khung, Đặt lại bố cục, Tạo nhóm liên kết', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openLayoutPanel();
    await expect(ta.layoutPresetButtons).toHaveCount(21);
    await expect(ta.layoutPanel.locator('.ta-layout-item.locked')).toHaveCount(20);
    await expect(ta.layoutPanel.locator('.ta-lock')).toHaveCount(22);
    await expect(ta.layoutPreset('1 khung')).not.toHaveClass(/locked/);
    await expect(ta.layoutPanel.locator('.ta-layout-item:disabled')).toHaveCount(0);

    await ta.layoutPreset('3 cột').click();
    await expect(ta.packageModal).toBeVisible();
    await ta.closePackageModal();
    await expect(ta.tabsets).toHaveCount(1);

    await ta.openLayoutPanel();
    await ta.resetLayoutBtn.click();
    await expect(ta.packageModal).toBeVisible();
    await ta.closePackageModal();

    await ta.openLayoutPanel();
    await ta.createLinkGroupBtn.click();
    await expect(ta.packageModal).toBeVisible();
    await expect(page.locator('.ta-tab-check')).toHaveCount(0);
  });

  test('TC_PTKT_RP_61: Free: giữ Ctrl bấm thẻ không chọn thẻ để liên kết', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.ctrlClickTab('VNM');
    await page.waitForTimeout(500);
    await expect(page.locator('.ta-tab-picked')).toHaveCount(0);
    await expect(ta.linkBar).toHaveCount(0);
  });

  test('TC_PTKT_RP_62: Free: thanh Replay không có nút "Biểu đồ", ô ngày có chú thích mời nâng cấp', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await expect(ta.replaySelBtn).toHaveCount(0);
    await expect(ta.replaySpeedBtn).toHaveText(/^\s*20x\s*$/);
    await expect(ta.replayBar.locator('.ta-tip', { has: ta.replayDate }))
      .toHaveAttribute('data-tip', 'Nâng cấp để mở rộng thời điểm bắt đầu.');
  });

  test('TC_PTKT_RP_63: Free: chọn ngày cũ hơn 1 năm bị kéo về ngày sớm nhất và mở popup', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_1_FRAME });
    await ta.waitChartsReady();
    await ta.openReplay();
    await ta.setReplayDate('2020-01-02');
    expect([vnDate(365), vnDate(366)]).toContain(await ta.replayDate.inputValue());
    await expect(ta.packageModal).toBeVisible();
    await ta.closePackageModal();

    const recent = vnDate(60);
    await ta.setReplayDate(recent);
    await expect(ta.replayDate).toHaveValue(recent);
    await page.waitForTimeout(800);
    await expect(ta.packageModal).toBeHidden();
  });

  test('TC_PTKT_RP_64: Free: hướng dẫn lần đầu chỉ có 4 bước', async ({ page }) => {
    const ta = await openFree(page, { layout: LAYOUT_1_FRAME, onboardingSeen: false });
    await expect(ta.onboardingCard).toBeVisible({ timeout: 45000 });
    const steps = ['Chọn bố cục', 'Replay', 'Ngày bắt đầu', 'Chạy, tiến 1 nến, Về hiện tại'];
    for (let i = 0; i < steps.length; i++) {
      await expect(ta.onboardingCount).toHaveText(`Bước ${i + 1}/4`);
      await expect(ta.onboardingTitle).toHaveText(steps[i]);
      if (i < steps.length - 1) await ta.onboardingBtn('Tiếp').click();
    }
    await expect(ta.onboardingBtn('Xong')).toBeVisible();
  });
});
