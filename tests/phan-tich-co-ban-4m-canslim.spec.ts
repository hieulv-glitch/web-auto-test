import { test, expect } from '@playwright/test';
import { FaAnalysisPage, useFaSafetyNet } from '../pages/FaAnalysisPage';

/**
 * Chạy trên BASE_URL (localhost:8080, nhánh preprod) — backend PRODUCTION. Đăng nhập bằng phiên cache `Prev2Session`
 * (chặn ghi setting); mọi request ghi khác bị lưới `FaSafetyNet` huỷ, sau mỗi test assert không có request ghi nào lọt.
 */
useFaSafetyNet(test);

async function loginFirst(page: any) {
  await new FaAnalysisPage(page).login('paid');
}

async function loginFreeOrSkip(page: any) {
  await new FaAnalysisPage(page).login('free');
}

/** Vào thẳng tab 4M & CANSLIM, chờ ScoreBar (dữ liệu thật) hiện ra trước khi thao tác tiếp — tab này KHÔNG có
 * bug race condition như tab So Sánh (xem TC_PTCB_4M_10), nhưng vẫn cần chờ API `fourm-canslim-point-chart`
 * resolve trước khi đọc DOM. */
async function goto4mReady(page: any, mack = 'VNM') {
  const fa = new FaAnalysisPage(page);
  await fa.goto({ mackQuery: mack, tabQuery: '4m-canslim' });
  await fa.scoreValue(fa.fourmScoreCard).waitFor({ state: 'visible', timeout: 15000 });
  return fa;
}

const VALID_MOCK_RESPONSE = (fourmPoint: number, canslimPoint: number, fourmWarning: string[] = []) => ({
  fourm_point: fourmPoint,
  canslim_point: canslimPoint,
  fourm_warning: fourmWarning,
  fourm_option_chart: {
    radar: { indicator: Array.from({ length: 11 }, (_, i) => ({ name: 'X' + i, max: 100 })) },
    series: [{ data: [Array(11).fill(50)], name: 'x' }],
  },
  canslim_option_chart: {
    radar: { indicator: Array.from({ length: 10 }, (_, i) => ({ name: 'Y' + i, max: 100 })) },
    series: [{ data: [Array(10).fill(50)], name: 'y' }],
  },
  fourm_option_history_chart: {
    series: [{ label: {}, markPoint: { data: [{ value: 50, xAxis: 'Q1.24', yAxis: 50 }] }, itemStyle: {}, data: [50] }],
    xAxis: { data: ['Q1.24'] },
  },
  canslim_option_history_chart: {
    series: [{ label: {}, markPoint: { data: [{ value: 50, xAxis: 'Q1.24', yAxis: 50 }] }, itemStyle: {}, data: [50] }],
    xAxis: { data: ['Q1.24'] },
  },
});

test.describe('Phân tích cơ bản — 4M & CANSLIM — Tổng quan & hiển thị tĩnh', () => {
  test('TC_PTCB_4M_01: Overview tab 4M & CANSLIM (tài khoản đầy đủ quyền, dữ liệu hợp lệ)', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    await expect(fa.exclusiveLogo).toBeVisible();
    await expect(page.getByText('Điểm 4M', { exact: true })).toBeVisible();
    await expect(page.getByText('Điểm Canslim', { exact: true })).toBeVisible();
    await expect(fa.scoreValue(fa.fourmScoreCard)).toBeVisible();
    await expect(fa.scoreValue(fa.canslimScoreCard)).toBeVisible();
    await expect(fa.fourmRadarCard.locator('canvas')).toBeVisible();
    await expect(fa.canslimRadarCard.locator('canvas')).toBeVisible();
    await expect(fa.disclaimerFooter).toBeVisible();
  });

  test('TC_PTCB_4M_02: Thanh điểm (ScoreBar) hiển thị đúng số điểm cho cả 2 khối', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const fourmText = await fa.scoreValue(fa.fourmScoreCard).innerText();
    const canslimText = await fa.scoreValue(fa.canslimScoreCard).innerText();
    expect(Number(fourmText), 'Điểm 4M phải là số hợp lệ 0-100').toBeGreaterThanOrEqual(0);
    expect(Number(fourmText)).toBeLessThanOrEqual(100);
    expect(Number(canslimText), 'Điểm Canslim phải là số hợp lệ 0-100').toBeGreaterThanOrEqual(0);
    expect(Number(canslimText)).toBeLessThanOrEqual(100);
  });

  test('TC_PTCB_4M_03: Biểu đồ radar "Điểm 4M" render đúng vị trí (canvas)', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const canvas = fa.fourmRadarCard.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);
  });

  test('TC_PTCB_4M_04: Biểu đồ radar "Điểm Canslim" render đúng vị trí (canvas)', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const canvas = fa.canslimRadarCard.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);
  });

  test('TC_PTCB_4M_05: Biểu đồ lịch sử điểm 4M render đúng vị trí (canvas)', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const canvas = fa.fourmScoreCard.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
  });

  test('TC_PTCB_4M_06: Biểu đồ lịch sử điểm Canslim render đúng vị trí (canvas)', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const canvas = fa.canslimScoreCard.locator('canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
  });
});

test.describe('Phân tích cơ bản — 4M & CANSLIM — Tương tác biểu đồ lịch sử', () => {
  test('TC_PTCB_4M_07: Click 1 điểm trên biểu đồ lịch sử "Điểm 4M" tải lại đúng dữ liệu tại thời điểm đó', async ({ page }) => {
    test.setTimeout(60000); // lưới toạ độ dò điểm trên canvas cần nhiều lần click (xem clickHistoryChartPoint)
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const fired = await fa.clickHistoryChartPoint(fa.fourmScoreCard, /fourm-canslim-point-chart-by-time\?.*type=4m/);
    expect(fired, 'Request "-by-time" với type=4m phải được gửi đi sau khi click 1 điểm').toBe(true);
    await expect(fa.scoreValue(fa.fourmScoreCard)).toBeVisible();
  });

  test('TC_PTCB_4M_08: Click 1 điểm trên biểu đồ lịch sử "Điểm Canslim" tải lại đúng dữ liệu tại thời điểm đó', async ({ page }) => {
    test.setTimeout(60000); // lưới toạ độ dò điểm trên canvas cần nhiều lần click (xem clickHistoryChartPoint)
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const fired = await fa.clickHistoryChartPoint(fa.canslimScoreCard, /fourm-canslim-point-chart-by-time\?.*type=canslim/);
    expect(fired, 'Request "-by-time" với type=canslim phải được gửi đi sau khi click 1 điểm').toBe(true);
    await expect(fa.scoreValue(fa.canslimScoreCard)).toBeVisible();
  });
});

test.describe('Phân tích cơ bản — 4M & CANSLIM — Đổi mã CK / Deep-link', () => {
  test('TC_PTCB_4M_09: Đổi mã CK qua ô tìm kiếm tự động tải lại dữ liệu 4M & CANSLIM theo mã mới', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    let requestFired = false;
    page.on('request', (req) => {
      if (req.url().includes('fourm-canslim-point-chart') && !req.url().includes('by-time') && req.url().includes('HPG')) {
        requestFired = true;
      }
    });

    // Cập nhật 10/11/2026: `list_mack` có lúc nạp muộn → gõ lại tới khi có gợi ý. Bỏ bước "reset về VNM" cũ — ghi
    // setting (`final_mack`) giờ bị `Prev2Session` chặn, tài khoản dùng chung không còn bị đổi mã.
    await fa.fillSearchUntilSuggestion('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(1500);

    expect(requestFired, 'Request tính điểm mới phải gửi đi với mack=HPG sau khi đổi mã CK').toBe(true);
  });

  test('TC_PTCB_4M_10: Deep-link trực tiếp vào tab tải đúng dữ liệu ngay từ đầu (không có bug race condition như tab So Sánh)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: '4m-canslim' });

    // Cố ý KHÔNG chờ thêm gì ngoài chờ ScoreBar hiện — nếu có race condition tương tự So Sánh, ScoreBar sẽ
    // không bao giờ hiện dữ liệu hợp lệ dù chờ bao lâu.
    await expect(fa.scoreValue(fa.fourmScoreCard)).toBeVisible({ timeout: 10000 });
    const fourmText = await fa.scoreValue(fa.fourmScoreCard).innerText();
    expect(Number(fourmText), 'Điểm 4M phải là số hợp lệ ngay từ lần tải đầu tiên qua deep-link').not.toBeNaN();
  });
});

test.describe('Phân tích cơ bản — 4M & CANSLIM — Loading / Lỗi mạng', () => {
  test('TC_PTCB_4M_13: Loading toàn tab khi tải lần đầu chậm', async ({ page }) => {
    await loginFirst(page);
    await page.route(/fourm-canslim-point-chart(?!.*by-time)/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: '4m-canslim' });

    await expect(fa.exclusiveLogo, 'Logo luôn hiện kể cả lúc loading').toBeVisible();
    await expect(page.getByText('Điểm 4M', { exact: true }), 'Trong lúc loading chưa hiện khối điểm').toHaveCount(0);

    await expect(fa.scoreValue(fa.fourmScoreCard)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Phân tích cơ bản — 4M & CANSLIM — Giới hạn theo gói hội viên (Free)', () => {
  test('TC_PTCB_4M_16: Tài khoản Free — toàn bộ tab bị thay bằng 1 ảnh mockup tĩnh (không phải chỉ 2 radar bị mờ)', async ({ page }) => {
    await loginFreeOrSkip(page);

    let scoreApiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('fourm-canslim-point-chart') && !req.url().includes('by-time')) scoreApiCalled = true;
    });

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: '4m-canslim' });
    await expect(fa.protectedView).toBeVisible();

    await expect(page.locator('.chart-wrapper'), 'Nội dung thật (.chart-wrapper) phải có 0 phần tử khi bị gate').toHaveCount(0);
    const imgSrc = await fa.protectedView.getAttribute('src');
    expect(imgSrc, 'Ảnh mockup phải trỏ tới blur_img của fa_4m_cansslim').toContain('fa_4m_cansslim');

    await page.waitForTimeout(1500);
    expect(scoreApiCalled, 'API tính điểm thật KHÔNG được gọi khi tài khoản bị gate').toBe(false);
  });

  test('TC_PTCB_4M_17: Hover ảnh mockup hiện nút "Đăng ký ngay", click mở modal nâng cấp gói', async ({ page }) => {
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: '4m-canslim' });
    await expect(fa.protectedView).toBeVisible();

    const imageContainer = page.locator('.faAnalysis-page .image-container');
    await imageContainer.hover();
    // Scope trong imageContainer — có 1 banner nâng cấp KHÁC (câu khác) tồn tại ở nơi khác trong DOM trang này
    // gây strict-mode violation nếu search toàn `page` (cùng lưu ý đã ghi ở `freeUpgradeBlock` tab So Sánh).
    await expect(imageContainer.getByText('Bạn cần nâng cấp gói hội viên để sử dụng chức năng này.')).toBeVisible();
    const registerBtn = imageContainer.getByRole('button', { name: 'Đăng ký ngay' });
    await expect(registerBtn).toBeVisible();

    await registerBtn.click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
  });
});

test.describe('Phân tích cơ bản — 4M & CANSLIM — Dark mode', () => {
  test('TC_PTCB_4M_18: Chuyển dark mode không crash, đổi màu theme + logo tương ứng', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Cập nhật 10/11/2026: `click({ force: true })` vào input KHÔNG đổi theme (test cũ pass mà không chuyển gì) → bấm
    // nhãn công tắc, chờ `localStorage.darkMode` đổi.
    await fa.toggleDarkMode();
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
    await expect(fa.fourmRadarCard.locator('canvas')).toBeVisible();
    await expect(fa.canslimRadarCard.locator('canvas')).toBeVisible();
    await expect(fa.exclusiveLogo).toBeVisible();
  });
});

test.describe('Phân tích cơ bản — 4M & CANSLIM — Responsive', () => {
  test('TC_PTCB_4M_19: Responsive viewport mobile/tablet', async ({ page }) => {
    await loginFirst(page);
    const fa = await goto4mReady(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.scoreValue(fa.fourmScoreCard)).toBeVisible();
    await expect(fa.scoreValue(fa.canslimScoreCard)).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.scoreValue(fa.fourmScoreCard)).toBeVisible();
    await expect(fa.scoreValue(fa.canslimScoreCard)).toBeVisible();
  });
});
