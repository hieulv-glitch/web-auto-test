import { test, expect } from '@playwright/test';
import { FaAnalysisPage } from '../pages/FaAnalysisPage';
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

/** Cùng cơ chế đã dùng ở các file khác trong dự án: tự `test.skip` nếu tài khoản Free trong `.env` đăng nhập
 * lỗi, để không fail giả khi thiếu cấu hình. */
async function loginFreeOrSkip(page: any) {
  test.skip(!FREE_EMAIL || !FREE_PASSWORD, 'Chưa cấu hình FREE_USER_EMAIL/FREE_USER_PASSWORD trong .env');
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(FREE_EMAIL!, FREE_PASSWORD!);
  const loginFailed = await loginPage.errorAlert
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(loginFailed, 'Tài khoản Free trong .env đăng nhập thất bại — kiểm tra lại FREE_USER_EMAIL/FREE_USER_PASSWORD.');
  await loginPage.expectLoggedIn();
}

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Tổng quan tab', () => {
  test('TC_PTCB_BVPT_01: Overview — 3 khu vực hiển thị đồng thời (không phải sub-tab)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });

    await expect(fa.newsFromDateInput).toBeVisible({ timeout: 15000 });
    await expect(fa.newsToDateInput).toBeVisible();
    await expect(fa.newsSearchBtn).toBeVisible();
    await expect(fa.newsCardHeader).toBeVisible();
    await expect(fa.reportAnalysisTable).toBeVisible();
    await expect(fa.reportRawTable).toBeVisible();

    // Cả 3 khu vực có dữ liệu đồng thời, không cần thao tác chuyển tab nào.
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 10000 });
    await expect(fa.reportAnalysisRows.first()).toBeVisible();
    await expect(fa.reportRawRows.first()).toBeVisible();
  });

  test('TC_PTCB_BVPT_02: Sub-tab "Sự kiện" không tồn tại trên UI dù component đã có sẵn', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    const suKienCount = await fa.newsCardHeader.getByText('Sự kiện').count();
    expect(suKienCount, 'KHÔNG có text "Sự kiện" trong khu vực card "Bài viết"').toBe(0);
    const headerLinks = fa.newsCardHeader.locator('.nav-link');
    expect(await headerLinks.count(), 'Chỉ đúng 1 tab tĩnh "Bài viết"').toBe(1);
    await expect(headerLinks.first()).toHaveText('Bài viết');
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Bộ lọc ngày', () => {
  test('TC_PTCB_BVPT_03: Mặc định = hôm nay nhưng CHƯA áp dụng lọc cho tới khi bấm "Tìm kiếm"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    const today = new Date().toISOString().substr(0, 10);
    await expect(fa.newsFromDateInput).toHaveValue(today);
    await expect(fa.newsToDateInput).toHaveValue(today);

    // Danh sách hiện đầy đủ nhiều item với ngày khác nhau (không bị giới hạn chỉ "hôm nay").
    const itemCount = await fa.newsItems.count();
    expect(itemCount, 'List Bài viết phải có nhiều item, không bị lọc theo hôm nay').toBeGreaterThan(1);
    const raRowCount = await fa.reportAnalysisRows.count();
    expect(raRowCount).toBeGreaterThan(1);
  });

  test('TC_PTCB_BVPT_04: "Tìm kiếm" khoảng ngày tương lai — 3 khu vực phản hồi khác nhau', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    let newsListReq = '';
    page.on('request', (req) => {
      if (req.url().includes('/api/stocks/news/get-list-news')) newsListReq = req.url();
    });

    await fa.newsFromDateInput.fill('2099-01-01');
    await fa.newsToDateInput.fill('2099-01-02');
    await fa.newsSearchBtn.click();
    await page.waitForTimeout(2500);

    expect(newsListReq, 'API get-list-news phải gọi lại với from_date/to_date mới').toContain('from_date=2099-01-01');
    expect(newsListReq).toContain('to_date=2099-01-02');

    await expect(fa.newsEmptyText).toBeVisible();
    const raEmptyText = fa.reportAnalysisTable.getByText('Không có dữ liệu');
    await expect(raEmptyText).toBeVisible();
    // BCTC gốc: KHÔNG có thông báo nào, chỉ 1 dòng bảng trống.
    const rrRowCount = await fa.reportRawRows.count();
    expect(rrRowCount).toBeLessThanOrEqual(1);
    const rrText = await fa.reportRawTable.locator('tbody').innerText();
    expect(rrText.trim()).toBe('');
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Khu vực "Bài viết"', () => {
  test('TC_PTCB_BVPT_05: Hiển thị đúng cấu trúc list bài viết + badge "Mới" đúng logic động', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    const firstItem = fa.newsItems.first();
    const dateSpan = firstItem.locator('span').last();
    const dateText = (await dateSpan.innerText()).trim();
    expect(dateText, 'Ngày giờ phải đúng định dạng DD/MM/YYYY HH:mm').toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);

    const [datePart, timePart] = dateText.split(' ');
    const [d, m, y] = datePart.split('/').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    const itemDate = new Date(y, m - 1, d, hh, mm);
    const diffDays = Math.round((Date.now() - itemDate.getTime()) / 8.64e7);
    const expectedBadge = diffDays < 3;

    const hasBadge = (await firstItem.locator('.badge').count()) > 0;
    expect(hasBadge, `Badge "Mới" phải khớp logic < 3 ngày (đo được diffDays=${diffDays})`).toBe(expectedBadge);
  });

  test('TC_PTCB_BVPT_06: Click 1 bài viết mở modal "Chi tiết bài viết" hiển thị đủ nội dung', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    await fa.newsItems.first().click();
    await expect(fa.newsModal).toBeVisible({ timeout: 10000 });
    await expect(fa.newsModalCloseBtn).toBeVisible();
    await page.waitForTimeout(1500);
    const contentLen = (await fa.newsModalContent.innerHTML()).length;
    expect(contentLen, 'Nội dung bài viết phải render đầy đủ, không rỗng').toBeGreaterThan(0);
  });

  test('TC_PTCB_BVPT_07: Đóng modal "Chi tiết bài viết" bằng nút "×"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    await fa.newsItems.first().click();
    await expect(fa.newsModal).toBeVisible({ timeout: 10000 });
    await fa.newsModalCloseBtn.click();
    await expect(fa.newsModal).toBeHidden();
  });

  test('TC_PTCB_BVPT_08: Phân trang list "Bài viết"', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    const page2Link = fa.newsAnalysisTab.getByRole('link', { name: 'Go to page 2' });
    const hasPage2 = (await page2Link.count()) > 0;
    test.skip(!hasPage2, 'Không đủ dữ liệu để có trang 2 lúc chạy test');

    const firstItemTitleBefore = await fa.newsItems.first().innerText();
    let pageReq = '';
    page.on('request', (req) => {
      if (req.url().includes('/api/stocks/news/get-list-news')) pageReq = req.url();
    });
    await page2Link.first().click();
    await page.waitForTimeout(1500);

    expect(pageReq, 'Request phải gửi kèm page=2').toContain('page=2');
    const firstItemTitleAfter = await fa.newsItems.first().innerText();
    expect(firstItemTitleAfter, 'Item đầu trang 2 phải khác trang 1').not.toBe(firstItemTitleBefore);
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Khu vực "Báo cáo phân tích"', () => {
  test('TC_PTCB_BVPT_09: Hiển thị đúng cấu trúc bảng Báo cáo phân tích', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.reportAnalysisRows.first()).toBeVisible({ timeout: 15000 });

    const headerCells = fa.reportAnalysisTable.locator('thead th');
    await expect(headerCells).toHaveCount(4);
    await expect(headerCells.nth(0)).toHaveText('Ngày');
    await expect(headerCells.nth(1)).toHaveText('Nguồn');
    await expect(headerCells.nth(2)).toHaveText('Tên báo cáo');
    await expect(headerCells.nth(3)).toHaveText('File');

    const firstDateCell = await fa.reportAnalysisRows.first().locator('td').first().innerText();
    expect(firstDateCell).toMatch(/^\d{2}-\d{2}-\d{4}$/);
  });

  test('TC_PTCB_BVPT_10: Click icon "File" tải file PDF báo cáo phân tích thật', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.reportAnalysisRows.first()).toBeVisible({ timeout: 15000 });

    const downloadUrl = await fa.clickFileIconAndCaptureDownloadUrl(fa.reportAnalysisFileIcon(0));
    expect(downloadUrl, 'Phải bắt được sự kiện download với URL .pdf').not.toBeNull();
    expect(downloadUrl).toMatch(/\.pdf(\?|$)/i);
  });

  test('TC_PTCB_BVPT_11: Phân trang bảng "Báo cáo phân tích" (client-side, không gọi lại API)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.reportAnalysisRows.first()).toBeVisible({ timeout: 15000 });

    const page2Link = fa.reportAnalysisTable.getByRole('link', { name: 'Go to page 2' });
    const hasPage2 = (await page2Link.count()) > 0;
    test.skip(!hasPage2, 'Không đủ dữ liệu để có trang 2 lúc chạy test');

    const firstRowBefore = await fa.reportAnalysisRows.first().innerText();
    let newReq = false;
    const listener = (req: any) => {
      if (req.url().includes('/api/stocks/report_analysis/get-report')) newReq = true;
    };
    page.on('request', listener);
    await page2Link.first().click();
    await page.waitForTimeout(800);
    page.off('request', listener);

    expect(newReq, 'Phân trang client-side KHÔNG được gọi lại API').toBe(false);
    const firstRowAfter = await fa.reportAnalysisRows.first().innerText();
    expect(firstRowAfter).not.toBe(firstRowBefore);
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Khu vực "BCTC gốc" (4 sub-tab)', () => {
  test('TC_PTCB_BVPT_12: Hiển thị đúng 4 sub-tab, "BCTC gốc" active mặc định', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.reportRawRows.first()).toBeVisible({ timeout: 15000 });

    const tabNames = ['BCTC gốc', 'Bản cáo bạch & BCTN', 'Nghị quyết', 'Báo cáo quản trị'];
    for (const name of tabNames) {
      await expect(fa.reportRawSubTab(name)).toBeVisible();
    }
    await expect(fa.reportRawSubTab('BCTC gốc')).toHaveClass(/active/);

    const headerCells = fa.reportRawTable.locator('thead th');
    await expect(headerCells).toHaveCount(3);
    await expect(headerCells.nth(0)).toHaveText('Mã CK');
    await expect(headerCells.nth(1)).toHaveText('Tên tài liệu');
    await expect(headerCells.nth(2)).toHaveText('File');
  });

  test('TC_PTCB_BVPT_13: Click từng sub-tab gọi đúng API với tham số type tương ứng', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.reportRawRows.first()).toBeVisible({ timeout: 15000 });

    const subTabMap: Record<string, string> = {
      'Bản cáo bạch & BCTN': '3',
      'Nghị quyết': '4',
      'Báo cáo quản trị': '5',
      'BCTC gốc': '1',
    };
    for (const [tabName, expectedType] of Object.entries(subTabMap)) {
      let capturedUrl = '';
      const listener = (req: any) => {
        if (req.url().includes('/api/stocks/document/get-document')) capturedUrl = req.url();
      };
      page.on('request', listener);
      await fa.clickReportRawSubTab(tabName);
      await page.waitForTimeout(1200);
      page.off('request', listener);
      expect(capturedUrl, `Sub-tab "${tabName}" phải gọi type=${expectedType}`).toContain(`type=${expectedType}`);
    }
  });

  test('TC_PTCB_BVPT_14: Click icon "File" tải file PDF BCTC thật', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.reportRawRows.first()).toBeVisible({ timeout: 15000 });

    const downloadUrl = await fa.clickFileIconAndCaptureDownloadUrl(fa.reportRawFileIcon(0));
    expect(downloadUrl, 'Phải bắt được sự kiện download với URL .pdf').not.toBeNull();
    expect(downloadUrl).toMatch(/\.pdf(\?|$)/i);
  });

  test('TC_PTCB_BVPT_15: Phân trang bảng "BCTC gốc" (client-side, không gọi lại API)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.reportRawRows.first()).toBeVisible({ timeout: 15000 });

    const page2Link = fa.reportRawTable.getByRole('link', { name: 'Go to page 2' });
    const hasPage2 = (await page2Link.count()) > 0;
    test.skip(!hasPage2, 'Không đủ dữ liệu để có trang 2 lúc chạy test');

    const firstRowBefore = await fa.reportRawRows.first().innerText();
    let newReq = false;
    const listener = (req: any) => {
      if (req.url().includes('/api/stocks/document/get-document')) newReq = true;
    };
    page.on('request', listener);
    await page2Link.first().click();
    await page.waitForTimeout(800);
    page.off('request', listener);

    expect(newReq, 'Phân trang client-side KHÔNG được gọi lại API').toBe(false);
    const firstRowAfter = await fa.reportRawRows.first().innerText();
    expect(firstRowAfter).not.toBe(firstRowBefore);
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Đổi mã CK / Loading / Lỗi mạng', () => {
  test('TC_PTCB_BVPT_16: Đổi mã CK tự động tải lại cả 3 khu vực theo mã mới', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2500); // chờ list_mack nạp lần đầu (tránh gợi ý rỗng giả)

    let newsReq = '';
    let reportReq = '';
    let documentReq = '';
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/stocks/news/get-list-news')) newsReq = url;
      if (url.includes('/api/stocks/report_analysis/get-report')) reportReq = url;
      if (url.includes('/api/stocks/document/get-document')) documentReq = url;
    });

    await fa.searchInput.fill('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(2000);

    expect(newsReq, 'get-list-news phải gọi lại với mack=HPG').toContain('mack=HPG');
    expect(reportReq, 'get-report phải gọi lại với mack=HPG').toContain('mack=HPG');
    expect(documentReq, 'get-document phải gọi lại với mack=HPG').toContain('mack=HPG');

    // Reset lại VNM để không ảnh hưởng test khác chạy song song.
    await fa.searchInput.fill('VNM');
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().waitFor({ state: 'visible' });
    await fa.searchSuggestions.filter({ hasText: 'VNM' }).first().click();
  });

  test('TC_PTCB_BVPT_17: Không có UI loading (spinner/che màn) ở cả 3 khu vực khi tải chậm', async ({ page }) => {
    await loginFirst(page);
    await page.route(/\/api\/stocks\/news\/get-list-news/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    await page.route(/\/api\/stocks\/report_analysis\/get-report/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    await page.route(/\/api\/stocks\/document\/get-document/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsFromDateInput).toBeVisible({ timeout: 15000 });

    // Ngay sau khi vào (trước khi API resolve): không có spinner nào.
    const spinnerCount = await fa.newsAnalysisTab.getByRole('status').count();
    expect(spinnerCount, 'Không có CSpinner/role=status nào trong lúc chờ API').toBe(0);

    await expect(fa.newsItems.first()).toBeVisible({ timeout: 8000 });
  });

  test('TC_PTCB_BVPT_18: Lỗi mạng cả 3 API không crash, tự về trạng thái rỗng đúng thiết kế', async ({ page }) => {
    await loginFirst(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.route(/\/api\/stocks\/news\/get-list-news/, (route) => route.abort());
    await page.route(/\/api\/stocks\/news\/get-count-page-news/, (route) => route.abort());
    await page.route(/\/api\/stocks\/report_analysis\/get-report/, (route) => route.abort());
    await page.route(/\/api\/stocks\/document\/get-document/, (route) => route.abort());

    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await page.waitForTimeout(4000);

    expect(pageErrors).toEqual([]);
    await expect(fa.newsEmptyText).toBeVisible();
    await expect(fa.reportAnalysisTable.getByText('Không có dữ liệu')).toBeVisible();
    const rrText = await fa.reportRawTable.locator('tbody').innerText();
    expect(rrText.trim()).toBe('');
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Giới hạn theo gói hội viên (Free)', () => {
  test('TC_PTCB_BVPT_19: Free — hiện ProtectedView che toàn bộ tab (xác nhận lại TC_PTCB_17)', async ({ page }) => {
    test.setTimeout(60000);
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });

    await expect(fa.protectedView).toBeVisible({ timeout: 20000 });
    await expect(fa.newsFromDateInput).toHaveCount(0);
    await expect(fa.reportAnalysisTable).toHaveCount(0);
    await expect(fa.reportRawTable).toHaveCount(0);
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Dark mode', () => {
  test('TC_PTCB_BVPT_20: Chuyển dark mode không crash, nội dung vẫn hiển thị đầy đủ', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.locator('input[type="checkbox"]').first().click({ force: true });
    await page.waitForTimeout(1000);

    expect(pageErrors).toEqual([]);
    await expect(fa.newsItems.first()).toBeVisible();
    await expect(fa.reportAnalysisRows.first()).toBeVisible();
    await expect(fa.reportRawRows.first()).toBeVisible();
  });
});

test.describe('Phân tích cơ bản — Bài viết & Phân tích — Responsive', () => {
  test('TC_PTCB_BVPT_21: Responsive viewport mobile/tablet — 2 cột xếp chồng dọc', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'VNM', tabQuery: 'tin-tuc' });
    await expect(fa.newsItems.first()).toBeVisible({ timeout: 15000 });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.newsItems.first()).toBeVisible();
    await expect(fa.reportAnalysisRows.first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.newsItems.first()).toBeVisible();
    await expect(fa.reportRawRows.first()).toBeVisible();
  });
});
