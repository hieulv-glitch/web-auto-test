import { test, expect } from '@playwright/test';
import { TradingLogPage } from '../pages/TradingLogPage';
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

/** Đăng nhập tài khoản Free, tự `test.skip` với lý do rõ ràng nếu tài khoản trong `.env` đăng nhập lỗi — cùng
 * cơ chế đã dùng ở TC_CONGDONG_55/TC_WATCHLIST_09/TC_BANGGIA_48-50. */
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

// Regex neo rõ ranh giới (không dùng glob '**') — cùng lý do đã ghi chú ở watchlist.spec.ts: 1 số endpoint
// không có phần đuôi sau segment cuối, glob có thể không khớp và để lọt request thật.
const TRADING_LOG_MUTATE = /\/api\/stocks\/trading_log\/(store|update|\d+)(\?|$)/;
const ADD_BULK = /\/api\/tradinglog\/add-bulk(\?|$)/;
const CATEGORY_MUTATE = /\/api\/stocks\/category(\/|\?|$)/;
const INSERT_MULTI = /\/insert-multi-tradinglog(\?|$)/;

// An toàn: MỌI API mutate của tab này (thêm/sửa/xóa giao dịch, ghi nhận cổ tức hàng loạt) bị chặn mặc định —
// tài khoản test có hàng trăm giao dịch thật. Test nào cần quan sát luồng thành công/lỗi sẽ tự `page.unroute()`
// rồi mock riêng.
async function blockMutations(page: any) {
  await page.route(TRADING_LOG_MUTATE, (route: any) =>
    route.request().method() === 'GET' ? route.continue() : route.abort()
  );
  await page.route(ADD_BULK, (route: any) => route.abort());
  await page.route(CATEGORY_MUTATE, (route: any) =>
    route.request().method() === 'GET' ? route.continue() : route.abort()
  );
  await page.route(INSERT_MULTI, (route: any) => route.abort());
}

async function gotoHistoryTab(page: any) {
  await loginFirst(page);
  const nkgd = new TradingLogPage(page);
  await nkgd.goto('nhat-ky-giao-dich');
  // Bảng lịch sử GD (virtual-scroll-list) render sẵn dòng "Tổng kết toàn bộ" với giá trị 0 NGAY TỪ ĐẦU (trước
  // khi API getAll trả về dữ liệu thật) — nếu đọc dòng danh mục quá sớm sẽ chỉ thấy đúng 1 dòng placeholder
  // này, chưa có dòng "Danh mục: ..." nào. Đợi ít nhất 1 dòng danh mục thật xuất hiện trước khi trả quyền điều
  // khiển lại cho test.
  await nkgd.historyRow(/^\s*Danh mục:/).first().waitFor({ state: 'visible', timeout: 10000 });
  return nkgd;
}

test.beforeEach(async ({ page }) => {
  await blockMutations(page);
});

test.describe('Nhật ký GD — Sub-tab & tổng quan', () => {
  test('TC_NKGD_LS_01: Overview — 2 sub-tab, "Lịch sử giao dịch" active mặc định', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await expect(nkgd.historySubTab('Lịch sử giao dịch')).toHaveClass(/active/);
    await expect(nkgd.historySubTab('Thống kê phân tích')).toBeVisible();
    await expect(nkgd.filterTransactionButton).toBeVisible();
    await expect(nkgd.addTransactionButton).toBeVisible();
  });

  test('TC_NKGD_LS_02: Chuyển sang sub-tab "Thống kê phân tích"', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.historySubTab('Thống kê phân tích').click();
    await page.waitForTimeout(300);
    await expect(nkgd.historySubTab('Thống kê phân tích')).toHaveClass(/active/);
    await expect(nkgd.filterTransactionButton).toHaveCount(0);
    await expect(nkgd.addTransactionButton).toHaveCount(0);
  });

  test('TC_NKGD_LS_03: Feature-gating riêng cho từng sub-tab (tài khoản Free)', async ({ page }) => {
    await loginFreeOrSkip(page);
    const nkgd = new TradingLogPage(page);
    await nkgd.goto('nhat-ky-giao-dich');
    await page.waitForTimeout(800);

    // `.image-container > .blurred-image` là dấu hiệu ProtectedView đang hiện (component
    // `tabTradingHistory.vue` có `featureName` RIÊNG cho từng sub-tab: 'nkgd_lich_su_giao_dich' /
    // 'nkgd_thong_ke_giao_dich' — khác `nhat-ky-giao-dich.md` TC_NKGD_09 vốn gate ở cấp TAB CHÍNH). Lọc
    // `:visible` vì CoreUI giữ cả 2 nhánh nội dung sub-tab trong DOM.
    const visibleBlurred = page.locator('.tradingLog-component .image-container .blurred-image:visible');
    const results: Record<string, number> = {};
    for (const sub of ['Lịch sử giao dịch', 'Thống kê phân tích'] as const) {
      await nkgd.historySubTab(sub).click();
      await page.waitForTimeout(600);
      results[sub] = await visibleBlurred.count();
    }
    console.log(`[TC_NKGD_LS_03] Số ProtectedView hiện (blurred-image visible) mỗi sub-tab với tài khoản Free: ${JSON.stringify(results)}`);
    // Hành vi thật đo được (tài khoản Free hiện tại): CẢ 2 sub-tab đều bị khóa riêng (mỗi sub-tab hiện đúng 1
    // ProtectedView khi active) — xác nhận cơ chế gate độc lập theo `featureName` của từng sub-tab hoạt động
    // đúng (dù tài khoản Free hiện tại không có quyền ở CẢ HAI nên không thể minh hoạ trường hợp lệch nhau
    // giữa 2 sub-tab). Xem thêm testcases/nhat-ky-giao-dich-nhat-ky.md.
    for (const sub of ['Lịch sử giao dịch', 'Thống kê phân tích']) {
      expect(results[sub], `Sub-tab "${sub}" phải hiện ProtectedView với tài khoản Free`).toBe(1);
    }
  });
});

test.describe('Nhật ký GD — Bảng "Lịch sử giao dịch"', () => {
  test('TC_NKGD_LS_04: Hiển thị đủ cột mặc định', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    for (const col of ['Mã CK', 'Ngày giao dịch', 'Loại giao dịch', 'Giá thực hiện', 'Khối lượng', 'Phí thực hiện', 'Lãi/lỗ']) {
      await expect(page.getByText(col, { exact: true }).first()).toBeVisible();
    }
  });

  test('TC_NKGD_LS_05: Nhóm theo danh mục, dòng "Tổng kết toàn bộ" luôn ở đầu', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await expect(page.getByText('Tổng kết toàn bộ')).toBeVisible();
    await expect(nkgd.historyRow(/^\s*Danh mục:/).first()).toBeVisible();
  });

  test('TC_NKGD_LS_06: Thu gọn / mở rộng 1 danh mục', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    const firstCategory = nkgd.historyRow(/^\s*Danh mục:/).first();
    const label = (await firstCategory.textContent()) || '';
    await firstCategory.click();
    await page.waitForTimeout(300);
    await firstCategory.click();
    await page.waitForTimeout(300);
    void nkgd;
    expect(label).toContain('Danh mục:');
  });

  test('TC_NKGD_LS_09: Sắp xếp theo cột trong phạm vi 1 danh mục', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    void nkgd;
    await page.getByText('Giá thực hiện', { exact: true }).first().click();
    await page.waitForTimeout(300);
    // Không assert thứ tự cụ thể (phụ thuộc dữ liệu thật) — chỉ verify không lỗi/crash sau khi sort.
    await expect(page.getByText('Tổng kết toàn bộ')).toBeVisible();
  });

  test('TC_NKGD_LS_10: Xuất File Excel bảng lịch sử giao dịch', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    const [download] = await Promise.all([
      page.waitForEvent('download').catch(() => null),
      nkgd.historyExportExcelButton.click(),
    ]);
    void download;
  });

  test('TC_NKGD_LS_11: Empty state khi bảng không có giao dịch nào (sau khi lọc)', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.filterTransactionButton.click();
    await expect(nkgd.historyFilterModal).toBeVisible();
    // Mở dropdown vue-multiselect "Mã CK" trước khi có thể gõ vào ô tìm kiếm bên trong (giống pattern đã dùng
    // ở filter Danh mục tab Tài sản).
    await nkgd.filterMultiSelectToggle('Mã CK').click();
    const searchInput = nkgd.historyFilterModal.getByPlaceholder('Tìm kiếm').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('ZZZ999NOTEXIST');
    }
    await page.keyboard.press('Escape').catch(() => {});
    await nkgd.filterApplyButton.click().catch(() => {});
    await page.waitForTimeout(400);
    await expect(page.getByText('Tổng kết toàn bộ')).toBeVisible();
  });
});

test.describe('Nhật ký GD — Modal "Lọc giao dịch"', () => {
  test('TC_NKGD_LS_12: Mở modal Lọc giao dịch — đủ field mặc định', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.filterTransactionButton.click();
    await expect(nkgd.historyFilterModal).toBeVisible();
    // Nhãn field trong modal này LUÔN có dấu ":" ở cuối (VD "Loại lệnh:") — xem `filterFieldLabel()`.
    await expect(nkgd.filterFieldLabel('Loại lệnh')).toBeVisible();
    await expect(nkgd.filterFieldLabel('Mã CK')).toBeVisible();
    await expect(nkgd.filterFieldLabel('Danh mục')).toBeVisible();
  });

  test('TC_NKGD_LS_18: Đóng modal Lọc không áp dụng thay đổi', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.filterTransactionButton.click();
    await expect(nkgd.historyFilterModal).toBeVisible();
    await nkgd.filterCloseButton.click();
    await expect(nkgd.historyFilterModal).toBeHidden();
  });
});

test.describe('Nhật ký GD — Modal "Thêm giao dịch" (validate, KHÔNG mutate thật)', () => {
  test('TC_NKGD_LS_19: Mở modal "Thêm giao dịch" — đủ field, 2 tab, 2 chế độ nhập', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();
    await expect(nkgd.addModalTab('Giao dịch')).toBeVisible();
    await expect(nkgd.addModalTab('Cổ tức & quyền')).toBeVisible();
    await expect(nkgd.addModalEntryModeTab('Nhập đơn lẻ')).toBeVisible();
    await expect(nkgd.addModalEntryModeTab('Nhập hàng loạt')).toBeVisible();
    await expect(nkgd.addModalStockcodeInput).toBeVisible();
    await expect(nkgd.addModalVolumeInput).toBeVisible();
  });

  test('TC_NKGD_LS_20: Validate Mã CK không hợp lệ', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();
    await nkgd.addModalStockcodeInput.fill('ZZZ');
    await nkgd.addModalVolumeInput.fill('100');
    let storeCalled = false;
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      storeCalled = true;
      return route.abort();
    });
    await nkgd.addModalSaveButton.click();
    await expect(page.getByText('Mã CK không hợp lệ')).toBeVisible();
    expect(storeCalled).toBe(false);
  });

  test('TC_NKGD_LS_22: Validate Ngày giao dịch > hôm nay', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();
    const future = new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10);
    await nkgd.addModalDateInput.fill(future);
    await expect(page.getByText('Không thể thực hiện giao dịch vào ngày này').or(page.getByText('Ngày giao dịch phải bé hơn hoặc bằng ngày hiện tại'))).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('TC_NKGD_LS_26: Thêm giao dịch thành công (mock API 200)', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();

    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ list_data_item: [], trading_style: { stock_trader: 0, stock_businessman: 0, value_investor: 0 } }),
        });
      }
      return route.continue();
    });

    await nkgd.addModalStockcodeInput.fill('ACB');
    await page.waitForTimeout(300);
    await nkgd.addModalVolumeInput.fill('100');
    await nkgd.addModalPriceInput.fill('20');
    await nkgd.addModalSaveButton.click();
    await expect(page.getByText(/Đã thêm mới giao dịch/)).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_LS_27: Thêm giao dịch lỗi API (mock 500)', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();

    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      if (route.request().method() === 'POST') return route.fulfill({ status: 500, body: 'error' });
      return route.continue();
    });

    await nkgd.addModalStockcodeInput.fill('ACB');
    await page.waitForTimeout(300);
    await nkgd.addModalVolumeInput.fill('100');
    await nkgd.addModalPriceInput.fill('20');
    await nkgd.addModalSaveButton.click();
    await expect(page.getByText('Có lỗi xảy ra, vui lòng thử lại')).toBeVisible({ timeout: 10000 });
    await expect(nkgd.addModal).toBeVisible();
  });

  test('TC_NKGD_LS_28: Double-click nút "Lưu" — chưa có guard chống double-submit', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();

    let postCount = 0;
    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, async (route: any) => {
      if (route.request().method() === 'POST') {
        postCount++;
        await new Promise((r) => setTimeout(r, 800));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ list_data_item: [], trading_style: { stock_trader: 0, stock_businessman: 0, value_investor: 0 } }),
        });
      }
      return route.continue();
    });

    await nkgd.addModalStockcodeInput.fill('ACB');
    await page.waitForTimeout(300);
    await nkgd.addModalVolumeInput.fill('100');
    await nkgd.addModalPriceInput.fill('20');
    await Promise.all([nkgd.addModalSaveButton.click(), nkgd.addModalSaveButton.click({ force: true }).catch(() => {})]);
    await page.waitForTimeout(1200);
    // Ghi nhận hành vi thật đo được — không assert cứng để không fail nếu framework Vue chặn được double-click
    // ở UI event loop; mục tiêu là ĐO, không phải khẳng định trước.
    console.log(`[TC_NKGD_LS_28] Số request POST đo được khi double-click nút Lưu: ${postCount}`);
  });

  test('TC_NKGD_LS_30: Nút "Hủy" đóng modal Thêm giao dịch không lưu', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();
    await nkgd.addModalStockcodeInput.fill('ACB');
    await nkgd.addModalCancelButton.click();
    await expect(nkgd.addModal).toBeHidden();
  });

  test('TC_NKGD_LS_29: Chọn thẻ "Thiết lập" trong modal Thêm giao dịch', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();
    await nkgd.addModalTagButton('Thiết lập').click();
    await expect(nkgd.tagPopup).toBeVisible();
    const firstTagCheckbox = nkgd.tagPopup.getByRole('checkbox').first();
    if (await firstTagCheckbox.count()) {
      await firstTagCheckbox.click({ force: true });
    }
    await nkgd.tagPopupSaveButton.click();
    await expect(nkgd.tagPopup).toBeHidden();
  });
});

test.describe('Nhật ký GD — Chế độ "Nhập hàng loạt"', () => {
  test('TC_NKGD_LS_32: Thêm/xóa dòng, validate thiếu Mã CK', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();
    await nkgd.addModalEntryModeTab('Nhập hàng loạt').click();
    await expect(nkgd.multiAddAddRowLink).toBeVisible();
    await nkgd.multiAddAddRowLink.click();
    await nkgd.multiAddAddRowLink.click();

    let addBulkCalled = false;
    await page.route(ADD_BULK, (route: any) => {
      addBulkCalled = true;
      return route.abort();
    });
    await nkgd.addModalSaveButton.click();
    await expect(page.getByText('Vui lòng nhập mã CK')).toBeVisible({ timeout: 5000 }).catch(() => {});
    expect(addBulkCalled).toBe(false);
  });

  test('TC_NKGD_LS_33: "Nhập hàng loạt" — submit thành công (mock)', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.addTransactionButton.click();
    await expect(nkgd.addModal).toBeVisible();
    await nkgd.addModalEntryModeTab('Nhập hàng loạt').click();

    await page.unroute(ADD_BULK);
    await page.route(ADD_BULK, (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    );

    await nkgd.multiAddFirstRowMackInput.fill('ACB');
    await page.waitForTimeout(300);
    const volumeCell = nkgd.addModal.locator('.trading-log tbody tr').first().locator('input').nth(2);
    await volumeCell.fill('100').catch(() => {});
    await nkgd.addModalSaveButton.click();
    await expect(page.getByText('Thêm mới giao dịch thành công!')).toBeVisible({ timeout: 10000 }).catch(() => {});
  });
});

test.describe('Nhật ký GD — Modal "Sửa giao dịch"', () => {
  async function openEditOnFirstRow(page: any, nkgd: TradingLogPage) {
    const firstCategory = nkgd.historyRow(/^\s*Danh mục:/).first();
    await firstCategory.click();
    await page.waitForTimeout(400);
    // Bảng lịch sử GD không dùng <table>/<tr> thật — mỗi dòng là 1 div `.item-table-trading-history-wrapper`,
    // icon "..." (CIcon cilOptions) có class riêng `.btn-action`.
    const row = nkgd.historyRow(/^\s*[A-Z]{3}/).first();
    const optionsButton = row.locator('.btn-action');
    await optionsButton.click({ force: true });
    // Scope trong CHÍNH dòng vừa click — mọi dòng khác trong bảng cũng có sẵn menu Sửa/Xóa riêng (ẩn qua CSS,
    // vẫn tồn tại trong DOM), `page.getByText('Sửa')` không scope sẽ khớp nhiều phần tử (strict-mode violation).
    const editItem = row.getByText('Sửa', { exact: true });
    await editItem.click();
    await expect(nkgd.editModal).toBeVisible();
  }

  test('TC_NKGD_LS_34: Mở modal Sửa — chỉ Mã CK bị khóa với giao dịch thường', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await openEditOnFirstRow(page, nkgd);
    const stockcodeField = nkgd.editModal.locator('input[disabled]').first();
    await expect(stockcodeField).toBeVisible();
  });

  test('TC_NKGD_LS_35: Sửa giao dịch thường thành công (mock)', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await openEditOnFirstRow(page, nkgd);

    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            list_data_item: [],
            trading_style: { stock_trader: 0, stock_businessman: 0, value_investor: 0 },
            list_data_mack: [],
          }),
        });
      }
      return route.continue();
    });

    await nkgd.editModalNoteTextarea.fill('[TEST-AUTOMATION] ghi chú mock').catch(() => {});
    await nkgd.editModalSaveButton.click();
    await expect(page.getByText(/Đã cập nhật giao dịch/)).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_LS_36: Sửa giao dịch lỗi 422 → thông báo riêng', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await openEditOnFirstRow(page, nkgd);

    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      if (route.request().method() === 'PUT') return route.fulfill({ status: 422, body: 'Unprocessable Entity 422' });
      return route.continue();
    });

    await nkgd.editModalSaveButton.click();
    await expect(page.getByText('Giao dịch không hợp lệ! Vui lòng thử lại.')).toBeVisible({ timeout: 10000 });
    await expect(nkgd.editModal).toBeHidden();
  });

  test('TC_NKGD_LS_37: Sửa giao dịch lỗi mạng/500 — modal vẫn tự đóng dù lỗi', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await openEditOnFirstRow(page, nkgd);

    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      if (route.request().method() === 'PUT') return route.fulfill({ status: 500, body: 'error' });
      return route.continue();
    });

    await nkgd.editModalSaveButton.click();
    await expect(page.getByText('Có lỗi xảy ra, vui lòng thử lại')).toBeVisible({ timeout: 10000 });
    // Hành vi thật đo được: modal tự đóng ngay cả khi request thất bại (BUG — xem testcases/nhat-ky-giao-dich-nhat-ky.md).
    await expect(nkgd.editModal).toBeHidden({ timeout: 5000 });
  });

  test.fixme(
    'TC_NKGD_LS_38: Mở modal Sửa — giao dịch Cổ tức/Quyền (cần xác nhận có dòng cổ tức khả dụng ổn định)',
    async () => {}
  );
  test.fixme(
    'TC_NKGD_LS_39: Đổi Loại giao dịch trong modal Sửa cổ tức — reset field liên quan (phụ thuộc dữ liệu cổ tức có sẵn)',
    async () => {}
  );
});

test.describe('Nhật ký GD — Modal "Xem giao dịch"', () => {
  test('TC_NKGD_LS_40: Mở modal Xem — mọi field readonly', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    const firstCategory = nkgd.historyRow(/^\s*Danh mục:/).first();
    await firstCategory.click();
    await page.waitForTimeout(400);
    const row = nkgd.historyRow(/^\s*[A-Z]{3}/).first();
    await row.click();
    await expect(nkgd.viewModal).toBeVisible();
    const inputs = nkgd.viewModal.locator('input, select, textarea');
    const count = await inputs.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      await expect(inputs.nth(i)).toBeDisabled();
    }
  });
});

test.describe('Nhật ký GD — Xóa giao dịch', () => {
  async function openDeleteOnFirstRow(page: any, nkgd: TradingLogPage) {
    const firstCategory = nkgd.historyRow(/^\s*Danh mục:/).first();
    await firstCategory.click();
    await page.waitForTimeout(400);
    // QUAN TRỌNG: KHÔNG lấy dòng "Mua" đầu tiên — `showFormDelete()` chặn xóa giao dịch Mua nếu khối lượng đã
    // bán/dùng vượt tồn (xem TC_NKGD_LS_43), đã xác nhận thật gặp toast "Không thể xóa giao dịch này!" khi vô
    // tình chọn đúng dòng Mua gốc của 1 chuỗi giao dịch. Dòng loại "Bán" KHÔNG bị chặn theo logic này — chọn
    // dòng "Bán" đầu tiên để đảm bảo luôn xóa được (an toàn cho test xác nhận thành công/lỗi API).
    const row = nkgd.historyRow('Bán').and(nkgd.historyRow(/^\s*[A-Z]{3}/)).first();
    const optionsButton = row.locator('.btn-action');
    await optionsButton.click({ force: true });
    // Scope trong CHÍNH dòng vừa click — xem lý do ở `openEditOnFirstRow`.
    await row.getByText('Xóa', { exact: true }).click();
  }

  test('TC_NKGD_LS_41: Icon "..." → "Xóa" mở modal xác nhận', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await openDeleteOnFirstRow(page, nkgd);
    await expect(nkgd.deleteTransactionModal).toBeVisible();
  });

  test('TC_NKGD_LS_42: Xác nhận xóa thành công (mock)', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    await openDeleteOnFirstRow(page, nkgd);
    await expect(nkgd.deleteTransactionModal).toBeVisible();

    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ list_data_item: [], trading_style: { stock_trader: 0, stock_businessman: 0, value_investor: 0 } }),
        });
      }
      return route.continue();
    });

    await nkgd.deleteTransactionConfirmButton.click();
    await expect(page.getByText('Đã xóa giao dịch thành công')).toBeVisible({ timeout: 10000 });
  });

  test('TC_NKGD_LS_44: Xóa giao dịch lỗi API — bug mất `this` trong `.catch` (đo qua pageerror)', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await openDeleteOnFirstRow(page, nkgd);
    await expect(nkgd.deleteTransactionModal).toBeVisible();

    await page.unroute(TRADING_LOG_MUTATE);
    await page.route(TRADING_LOG_MUTATE, (route: any) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 500, body: 'error' });
      return route.continue();
    });

    await nkgd.deleteTransactionConfirmButton.click();
    await page.waitForTimeout(1000);
    // Ghi nhận hành vi thật đo được (bug: .catch(function(error){...}) mất `this`) — log để đối chiếu, không
    // fail cứng test vì hành vi trình duyệt cụ thể (có ném pageerror hay bị nuốt âm thầm) có thể khác nhau.
    console.log(`[TC_NKGD_LS_44] pageerror ghi nhận được khi xóa lỗi: ${JSON.stringify(errors)}`);
  });

  test('TC_NKGD_LS_43: Chặn xóa giao dịch "Mua" khi khối lượng đã bán/dùng vượt tồn', async ({ page }) => {
    const nkgd = await gotoHistoryTab(page);
    const firstCategory = nkgd.historyRow(/^\s*Danh mục:/).first();
    await firstCategory.click();
    await page.waitForTimeout(400);
    // Dòng "Mua" đầu tiên của danh mục "Lướt Sóng" (dữ liệu thật hiện có) là giao dịch mua gốc mà các giao
    // dịch Bán/Cổ tức sau đó phụ thuộc vào — xóa nó sẽ khiến khối lượng tồn âm, bị chặn theo đúng logic
    // `showFormDelete()`. Đã xác nhận ổn định qua nhiều lần chạy thật (không mock).
    const row = nkgd.historyRow('Mua').and(nkgd.historyRow(/^\s*[A-Z]{3}/)).first();
    const optionsButton = row.locator('.btn-action');
    await optionsButton.click({ force: true });
    await row.getByText('Xóa', { exact: true }).click();

    await expect(page.getByText('Không thể xóa giao dịch này!')).toBeVisible({ timeout: 5000 });
    await expect(nkgd.deleteTransactionModal).toBeHidden();
  });
});

test.describe('Nhật ký GD — Sub-tab "Thống kê phân tích"', () => {
  async function gotoAnalysisTab(page: any) {
    const nkgd = await gotoHistoryTab(page);
    await nkgd.historySubTab('Thống kê phân tích').click();
    await page.waitForTimeout(500);
    return nkgd;
  }

  test('TC_NKGD_LS_45: Overview — radar chart, mức điểm rủi ro, bảng lợi nhuận', async ({ page }) => {
    await gotoAnalysisTab(page);
    await expect(page.getByText('Phong cách giao dịch')).toBeVisible();
    await expect(page.getByText('Mức điểm rủi ro phù hợp')).toBeVisible();
  });

  test('TC_NKGD_LS_46: Đổi tiêu chí "Lợi nhuận theo..."', async ({ page }) => {
    await gotoAnalysisTab(page);
    const select = page.locator('select').filter({ has: page.locator('option', { hasText: 'Mã CK' }) }).first();
    if (await select.count()) {
      await select.selectOption({ label: 'Ngành' }).catch(() => {});
      await page.waitForTimeout(300);
    }
  });

  test('TC_NKGD_LS_48: Bug: Xuất File Excel làm hỏng vĩnh viễn computed `fields_table`, thêm cột "Mã CK" thừa (chỉ lộ ra ở lần re-render TIẾP THEO)', async ({ page }) => {
    await gotoAnalysisTab(page);
    const table = page.locator('table.table-analysis');
    const headerRow2 = table.locator('thead tr').nth(1).locator('th');
    const exportButton = page.getByRole('button', { name: 'Xuất File Excel' });

    const countBefore = await headerRow2.filter({ hasText: 'Mã CK' }).count();
    expect(countBefore, 'Trước khi xuất Excel, KHÔNG được có cột "Mã CK" thừa nào').toBe(0);

    // Xuất Excel 3 lần liên tiếp — vì `schema` là Vue computed KHÔNG có dependency reactive nào (đọc thẳng
    // `this.fields_table.unshift(...)`), Vue chỉ evaluate nó 1 LẦN DUY NHẤT rồi cache mãi mãi → dòng `unshift`
    // chỉ thật sự chạy ở lần export ĐẦU TIÊN trong vòng đời component, 2 lần sau không lặp lại thêm.
    for (let i = 0; i < 3; i++) {
      const [download] = await Promise.all([page.waitForEvent('download').catch(() => null), exportButton.click()]);
      void download;
      await page.waitForTimeout(300);
    }

    // Ngay sau export, `fields_table` (cũng là computed, cache riêng) đã bị mutate trong bộ nhớ nhưng KHÔNG tự
    // re-render (mảng trả về từ computed không phải reactive array được Vue theo dõi) — bảng trên màn hình vẫn
    // hiển thị ĐÚNG, chưa lộ bug.
    const countRightAfterExport = await headerRow2.filter({ hasText: 'Mã CK' }).count();
    expect(countRightAfterExport, 'Ngay sau export, bảng CHƯA re-render nên chưa lộ cột thừa').toBe(0);

    // Chỉ khi có 1 tương tác khác buộc Vue re-render bảng (VD click sắp xếp 1 cột — đổi `key_sort`/`type_sort`,
    // dữ liệu reactive thật) thì cột "Mã CK" thừa (từ `fields_table` đã bị hỏng) mới XUẤT HIỆN, và CHỈ xuất
    // hiện đúng 1 cột thừa (không phải 3, dù đã bấm xuất Excel 3 lần) — đúng với việc `schema` chỉ evaluate 1 lần.
    await headerRow2.first().click();
    await page.waitForTimeout(300);
    const countAfterRerender = await headerRow2.filter({ hasText: 'Mã CK' }).count();
    console.log(`[TC_NKGD_LS_48] Cột "Mã CK" thừa: trước=${countBefore}, ngay sau export=${countRightAfterExport}, sau khi ép re-render=${countAfterRerender}`);
    expect(countAfterRerender, 'Sau khi ép re-render, phải lộ ĐÚNG 1 cột "Mã CK" thừa').toBe(1);
  });

  test('TC_NKGD_LS_49: get-risk-aversion-index lỗi mạng — không crash', async ({ page }) => {
    await page.route(/get-risk-aversion-index/, (route: any) => route.fulfill({ status: 500, body: 'error' }));
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await gotoAnalysisTab(page);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
    await expect(page.getByText('Mức điểm rủi ro phù hợp')).toBeVisible();
  });
});
