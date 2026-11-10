import { test, expect } from '@playwright/test';
import { FaAnalysisPage, useFaSafetyNet } from '../pages/FaAnalysisPage';

/**
 * Chạy trên BASE_URL (localhost:8080, nhánh preprod) — backend PRODUCTION. Đăng nhập bằng phiên cache `Prev2Session`
 * (chặn ghi setting → "mã CK đang xem" `final_mack` của tài khoản dùng chung KHÔNG còn bị test đổi); mọi request ghi
 * khác bị lưới `FaSafetyNet` huỷ, sau mỗi test assert không có request ghi nào lọt.
 */
useFaSafetyNet(test);

const MAIN_TABS = ['Thông tin chung', 'Tài chính doanh nghiệp', '4M & CANSLIM', 'Biểu đồ', 'So sánh', 'BCTC gốc'];

async function loginFirst(page: any) {
  await new FaAnalysisPage(page).login('paid');
}

async function loginFreeOrSkip(page: any) {
  await new FaAnalysisPage(page).login('free');
}

test.describe('Phân tích cơ bản — Truy cập & Tổng quan', () => {
  test('TC_PTCB_01: Overview màn hình khi đã đăng nhập', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    // Dùng `mackQuery` (KHÔNG phải `mackPath`) — tài khoản test dùng CHUNG cho mọi test trong file này, "mã CK
    // đang xem" là 1 setting lưu SERVER-SIDE theo tài khoản (đồng bộ qua `getusersettings`/`updateusersettings`,
    // xem `TheContainer.vue`), không phải state riêng theo browser context. `mackPath` có bug thật bị
    // localStorage `final_mack` ghi đè (xem TC_PTCB_08) — dùng nó ở đây sẽ khiến test này flaky theo tiến trình
    // của CÁC TEST KHÁC chạy song song (3 worker), không liên quan gì tới mục đích của TC_PTCB_01 (chỉ kiểm tra
    // layout tổng thể). `mackQuery` được code xử lý ổn định 100% bất kể tài khoản đã xem mã nào trước đó.
    await fa.goto({ mackQuery: 'VNM' });

    await expect(fa.searchInput).toHaveValue('VNM');
    for (const name of MAIN_TABS) {
      await expect(fa.mainTab(name), `Tab "${name}" phải hiển thị`).toBeVisible();
    }
    await expect(fa.mainTab('Thông tin chung')).toHaveClass(/active-bg-tab/);
  });

  test('TC_PTCB_02: Chặn truy cập khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/phan-tich-co-ban');
    await page.waitForURL(/\/login/);
  });
});

// `searchMack()` (SearchStockCode.vue) lọc trên `store.state.list_mack` — danh sách toàn bộ mã CK nạp từ API
// SAU khi trang mount, KHÔNG có trong DOM ngay khi `mainTabList` đã visible (`goto()` chỉ chờ tab bar, không
// chờ list này). Gõ search ngay sau `goto()` có xác suất chạy trước khi `list_mack` kịp nạp → gợi ý rỗng giả
// (đã xác nhận flaky qua chạy lại nhiều lần: cùng 1 test lúc pass lúc fail dù thao tác giống hệt nhau). Luôn
// chờ thêm sau `goto()` trước khi thao tác ô tìm kiếm.
async function gotoAndWaitSearchReady(page: any, fa: FaAnalysisPage, mackPath = 'VNM') {
  await fa.goto({ mackPath });
  await page.waitForTimeout(1200);
}

test.describe('Phân tích cơ bản — Ô tìm kiếm mã CK', () => {
  test('TC_PTCB_03: Gõ mã hợp lệ hiện gợi ý, chọn gợi ý đổi mã đang xem', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await gotoAndWaitSearchReady(page, fa);

    await fa.searchInput.fill('HPG');
    await expect(fa.searchSuggestions.first()).toBeVisible();
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();

    await expect(fa.searchInput).toHaveValue('HPG');
    await expect(page.getByText(/\(HPG\)/)).toBeVisible();
  });

  test('TC_PTCB_04: Gõ tên công ty không dấu vẫn ra gợi ý', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await gotoAndWaitSearchReady(page, fa);

    await fa.searchInput.fill('hoa phat');
    await expect(fa.searchSuggestions.filter({ hasText: 'HPG' }).first()).toBeVisible();
  });

  test('TC_PTCB_05: Gõ mã không tồn tại không ra gợi ý nào', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await gotoAndWaitSearchReady(page, fa);

    await fa.searchInput.fill('ZZZZZZ999');
    await page.waitForTimeout(300);
    await expect(fa.searchSuggestions).toHaveCount(0);
  });

  test('TC_PTCB_06: Nhấn Enter khi có gợi ý đang chọn sẽ chọn mã đó', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await gotoAndWaitSearchReady(page, fa);

    await fa.searchInput.fill('HPG');
    await expect(fa.searchSuggestions.first()).toBeVisible();
    await fa.searchInput.press('Enter');

    await expect(fa.searchInput).toHaveValue('HPG');
  });

  test('TC_PTCB_07: Đổi mã CK giữ nguyên tab đang xem (không reset về "Thông tin chung")', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await gotoAndWaitSearchReady(page, fa);
    await fa.gotoMainTab('So sánh');
    await expect(fa.mainTab('So sánh')).toHaveClass(/active-bg-tab/);

    // Cập nhật 10/11/2026: `list_mack` (socket) có lúc nạp chậm hơn 1,2s cố định → gõ lại tới khi có gợi ý.
    await fa.fillSearchUntilSuggestion('HPG');
    await fa.searchSuggestions.filter({ hasText: 'HPG' }).first().click();
    await page.waitForTimeout(300);

    await expect(fa.mainTab('So sánh'), 'Đổi mã không được reset tab đang xem').toHaveClass(/active-bg-tab/);
  });
});

test.describe('Phân tích cơ bản — Deep-link qua URL', () => {
  test('TC_PTCB_09: Truy cập ?mack=<mack> load đúng mã theo query param', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackQuery: 'HPG' });
    await expect(fa.searchInput).toHaveValue('HPG');
  });

  test('TC_PTCB_10: Truy cập ?tab=<tab> mở đúng tab tương ứng', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM', tabQuery: 'so-sanh' });
    await expect(fa.mainTab('So sánh')).toHaveClass(/active-bg-tab/);
  });
});

test.describe('Phân tích cơ bản — Chuyển 6 tab chính', () => {
  test('TC_PTCB_11: Chuyển qua lại lần lượt cả 6 tab', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });

    for (const name of MAIN_TABS) {
      await fa.gotoMainTab(name);
      await page.waitForTimeout(300);
      await expect(fa.mainTab(name), `Tab "${name}" phải chuyển active`).toHaveClass(/active-bg-tab/);
    }
  });

  test('TC_PTCB_12: Click tab nhanh liên tục không lỗi console/crash', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    for (let i = 0; i < 2; i++) {
      for (const name of MAIN_TABS) {
        await fa.mainTab(name).click();
      }
    }
    await page.waitForTimeout(300);
    await expect(fa.mainTab('BCTC gốc')).toHaveClass(/active-bg-tab/);
    expect(errors).toEqual([]);
  });

  test('TC_PTCB_13: Chuyển tab KHÔNG cập nhật URL — F5 quay về tab mặc định', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });
    await fa.gotoMainTab('So sánh');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/phan-tich-co-ban\/VNM$/);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await fa.mainTabList.waitFor({ state: 'visible' });
    await expect(fa.mainTab('Thông tin chung'), 'Sau F5 phải quay về tab mặc định "Thông tin chung"').toHaveClass(/active-bg-tab/);
  });

  test('TC_PTCB_14: Nút Back trình duyệt điều hướng rời khỏi trang', async ({ page }) => {
    await loginFirst(page);
    await page.goto('/dashboard');
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });
    await fa.gotoMainTab('So sánh');

    await Promise.all([
      page.waitForURL((url) => !/\/phan-tich-co-ban/.test(url.pathname), { waitUntil: 'commit' }),
      page.goBack({ waitUntil: 'commit' }),
    ]);
    await expect(page).not.toHaveURL(/\/phan-tich-co-ban/);
  });
});

test.describe('Phân tích cơ bản — Badge "BCTC Mới"', () => {
  test('TC_PTCB_15: Click badge "BCTC Mới" điều hướng sang /bctc-new-list (nếu badge hiển thị)', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });

    const badgeVisible = await fa.badgeNewFinanceReport.isVisible().catch(() => false);
    test.skip(!badgeVisible, 'Badge "BCTC Mới" không hiển thị cho mã VNM tại thời điểm chạy test (phụ thuộc dữ liệu quý báo cáo thật).');

    await fa.badgeNewFinanceReport.click();
    await page.waitForURL(/\/bctc-new-list/);
  });
});

test.describe('Phân tích cơ bản — Giới hạn theo gói hội viên', () => {
  // CHỈ verify "Thông tin chung"/"Tài chính doanh nghiệp" ở đây — 2 tab này xác nhận KHÔNG có ProtectedView ở
  // BẤT KỲ cấp nào (cả cấp shell lẫn cấp widget con) với tài khoản Free hiện tại. KHÔNG gộp "4M & CANSLIM" vào
  // đây dù `featureName` cấp shell của nó cũng là `null` giống 2 tab trên — đo thật bằng automation phát hiện
  // tab "4M & CANSLIM" CÓ 1 ProtectedView RIÊNG bọc TOÀN BỘ component (không phải chỉ 2 biểu đồ radar — 1 ghi
  // chú trước đó ở đây từng mô tả sai là "chỉ radar bị mờ", đã đính chính sau khi sinh testcase riêng cho tab
  // này và kiểm tra kỹ DOM/network thật, xem testcases/phan-tich-co-ban.md mục "Phát hiện đáng chú ý" #7) —
  // cơ chế gating RIÊNG của chính component `FourmAndCanslim` (khác cơ chế `disable_featureName` cấp shell của
  // `index.vue`), thuộc phạm vi tài liệu testcase riêng của tab "4M & CANSLIM", không phải phạm vi shell này.
  // `disable_featureName` phụ thuộc `store.state.features_disabled` — giá trị ban đầu đọc ĐỒNG BỘ từ
  // `localStorage.features_disabled` (rỗng `{}` ở context test mới, chưa từng lưu), CHỈ được nạp giá trị THẬT
  // qua API `GET .../auth/get-limit-components2` (gọi trong `TheContainer.mounted()`) SAU khi trang đã render
  // xong — chờ bằng `page.waitForTimeout()` cố định (đã thử 500ms rồi 1200ms) vẫn đo ra kết quả KHÁC NHAU giữa
  // các lần chạy (có lần 0 tab nào bị khóa vì check quá sớm, trước khi API trả về) — phải chờ ĐÚNG response
  // của API này thay vì đoán thời gian.
  // Poll thay vì `page.waitForResponse()`: response API có thể đã resolve TRƯỚC khi gọi hàm này (ngay sau
  // `fa.goto()`), lúc đó `waitForResponse` sẽ chờ mù tới hết timeout vì chỉ bắt được response TƯƠNG LAI. Poll
  // `localStorage.features_disabled` (ghi đồng thời với lúc `TheContainer` cập nhật store, xem
  // `TheContainer.vue` dòng 858) tránh được vấn đề thứ tự này.
  async function waitForFeaturesDisabledLoaded(page: any) {
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('features_disabled')), { timeout: 10000 })
      .not.toBeNull();
    await page.waitForTimeout(300);
  }

  test('TC_PTCB_16: Tab "Thông tin chung"/"Tài chính doanh nghiệp" không bị khóa theo gói hội viên (mọi cấp)', async ({ page }) => {
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });
    await waitForFeaturesDisabledLoaded(page);

    for (const name of ['Thông tin chung', 'Tài chính doanh nghiệp']) {
      await fa.gotoMainTab(name);
      await page.waitForTimeout(300);
      await expect(fa.protectedView, `Tab "${name}" không được hiện ProtectedView`).toHaveCount(0);
    }
  });

  // Kết quả đo được THẬT (ổn định qua nhiều lần chạy, đã đối chiếu trực tiếp `localStorage.features_disabled`
  // của tài khoản Free hiện tại): CHỈ `fa_tai_lieu` (tab "BCTC gốc", trước 11/2026 là "Bài viết & Phân tích") có trong danh sách khóa —
  // `fa_so_sanh` và `fa_bieu_do_tc_*` KHÔNG có, nên 2 tab "So sánh"/"Biểu đồ" KHÔNG bị khóa với tài khoản này
  // dù `index.vue` có code gate đúng cho cả 3 tab (khác giả định ban đầu khi viết testcase — cùng pattern đã
  // ghi nhận ở Bảng Giá TC_BANGGIA_49/50, Nhật Ký GD TC_NKGD_09: dữ liệu `features_disabled` thật của tài
  // khoản Free dùng chung cho dự án hiện chỉ khóa 1 phần tính năng `fa_*`, không phải toàn bộ). Danh sách
  // `fa_*` đầy đủ đo được: `fa_4m_cansslim`, `fa_cttc`, `fa_giao_dich_noi_bo`, `fa_nuoc_ngoai`,
  // `fa_nuoc_ngoai_bieu_do`, `fa_tai_lieu`, `fa_tu_doanh`, `fa_tu_doanh_bieu_do` — không có `fa_so_sanh` hay
  // `fa_bieu_do_tc_bank`/`fa_bieu_do_tc_nonbank_stock_insurance`.
  test('TC_PTCB_17: Chỉ tab "BCTC gốc" hiện ProtectedView với tài khoản Free hiện tại (gate cấp shell)', async ({ page }) => {
    await loginFreeOrSkip(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });
    await waitForFeaturesDisabledLoaded(page);

    const results: Record<string, number> = {};
    for (const name of ['Biểu đồ', 'So sánh', 'BCTC gốc']) {
      await fa.gotoMainTab(name);
      await page.waitForTimeout(500);
      results[name] = await fa.protectedView.count();
    }
    console.log(`[TC_PTCB_17] Số ProtectedView hiện mỗi tab với tài khoản Free: ${JSON.stringify(results)}`);
    expect(results['Biểu đồ'], 'Tab "Biểu đồ" KHÔNG bị khóa với tài khoản Free hiện tại (fa_bieu_do_tc_* không có trong features_disabled)').toBe(0);
    expect(results['So sánh'], 'Tab "So sánh" KHÔNG bị khóa với tài khoản Free hiện tại (fa_so_sanh không có trong features_disabled)').toBe(0);
    expect(results['BCTC gốc'], 'Tab "BCTC gốc" phải hiện ProtectedView (fa_tai_lieu có trong features_disabled)').toBe(1);
  });
});

test.describe('Phân tích cơ bản — Responsive', () => {
  test('TC_PTCB_18: Responsive viewport mobile/tablet', async ({ page }) => {
    await loginFirst(page);
    const fa = new FaAnalysisPage(page);
    await fa.goto({ mackPath: 'VNM' });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fa.mainTab('Thông tin chung')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(fa.mainTab('Thông tin chung')).toBeVisible();
  });
});
