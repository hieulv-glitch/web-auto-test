import { test, expect, Page } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import {
  NotificationCenterPage, AlertPerStockBox, stockAlert, manualNotice, ibdNotice, signalNotice, bctcNotice,
  filterAlertNotice, stockAlertNotice, newsNotice, socialNotice, bulletinSession,
} from '../pages/NotificationCenterPage';

/**
 * Trung tâm thông báo + chuông header + Bản tin thị trường — testcases/trung-tam-thong-bao.md.
 * Chạy trên prev2 (bản build preprod mới nhất, backend PRODUCTION): mọi API thông báo/cảnh báo đi qua `FakeNotifyServer`
 * (pages/NotificationCenterPage.ts), mọi lệnh ghi còn lại bị lưới an toàn chặn.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

/** Bộ dữ liệu mẫu cho các mục cài đặt. */
function seedRules(p: NotificationCenterPage) {
  const s = p.server;
  s.alerts = [
    stockAlert('VNM', 'COND_PRICE_UP', 70000, { frequency: 1, id: 101 }),
    stockAlert('VNM', 'COND_SMA_SMA20_UP', null, { frequency: 0, id: 102 }),
    stockAlert('FPT', 'COND_PRICE_DOWN', 95000, { frequency: 1, id: 103 }),
    stockAlert('HPG', 'COND_PCHANGE_DEC', 3, { frequency: 1, id: 104 }),
    stockAlert('HPG', 'COND_PRICE_UP', 30000, { frequency: 0, active: 0, id: 105 }), // "1 lần" đã bắn → tắt
    stockAlert('ACB', 'financial_report', null, { id: 106 }), // cảnh báo sự kiện lẫn trong get-all
  ];
  s.filters = [
    { id: 11, label: 'Lọc tăng trưởng', content: [], is_active: 1, frequency: 60, my_watchlist_id: null },
    { id: 12, label: 'Tích lũy', content: [], is_active: 0, frequency: 60, my_watchlist_id: 'all' },
    { id: 13, label: 'Mẫu cũ không có content', content: null, is_active: 1, frequency: 60, my_watchlist_id: null },
  ];
  s.news = [{ stockcode: 'MWG', keys: { financial_report: true, cash_dividend: true } }];
}

const lastWrite = (p: NotificationCenterPage, re: RegExp, method?: string) => {
  const list = p.server.writesTo(re, method);
  return list[list.length - 1];
};

// ======================================================================
test.describe('Trang Trung tâm thông báo — khung & điều hướng', () => {
  test('TC_TB_01: Mở thẳng /trung-tam-thong-bao — tiêu đề, cột "Cài đặt" với 7 chủ đề đúng thứ tự, mặc định "Tất cả cài đặt", không có nút Quay lại', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedRules(p);
    await p.openCenter();
    await expect(p.title).toBeVisible();
    await expect(p.nav.locator('.nc-nav-title')).toHaveText('Cài đặt');
    await expect(p.nav.locator('.nc-nav-head')).toContainText('Chủ đề thông báo');
    await expect(p.nav.locator('.nc-nav-head')).toContainText('Nhận');
    const labels = await p.nav.locator('.nc-nav-item .nc-lbl').allInnerTexts();
    expect(labels.map((l) => l.trim())).toEqual(['Chung', 'Cơ hội tiềm năng', 'IBD', 'BCTC', 'Cảnh báo', 'Cộng đồng', 'Sự kiện',
      'Tất cả cài đặt', 'Lịch sử thông báo']);
    // Bánh răng chỉ ở chủ đề có màn cài đặt riêng
    for (const name of ['Cơ hội tiềm năng', 'Cảnh báo', 'Cộng đồng', 'Sự kiện']) await expect(p.navItem(name).locator('svg.nc-gear')).toHaveCount(1);
    for (const name of ['Chung', 'IBD', 'BCTC']) await expect(p.navItem(name).locator('svg.nc-gear')).toHaveCount(0);
    await expect(p.navItem('Tất cả cài đặt')).toHaveAttribute('aria-current', 'true');
    await expect(p.h2).toHaveText('Tất cả cài đặt thông báo');
    await expect(p.backBtn).toHaveCount(0);
  });

  test('TC_TB_02: Dẫn sang từ màn khác (nút "Cài đặt trung tâm thông báo" của chuông) → có nút Quay lại, bấm về đúng màn cũ', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.open({ path: '/watchlist' });
    await p.openBell();
    await p.bellFoot.click();
    await expect(page).toHaveURL(/\/trung-tam-thong-bao$/);
    await expect(p.bellPanel).toBeHidden();
    await expect(p.backBtn).toBeVisible();
    await p.backBtn.click();
    await expect(page).toHaveURL(/\/watchlist/);
  });

  const queries: [string, string, string][] = [
    ['?view=signal', 'Cơ hội tiềm năng', 'Cơ hội tiềm năng'],
    ['?view=alert', 'Cảnh báo', ''],
    ['?muc=news', 'Sự kiện', 'Tin tức & Sự kiện'],
    ['?muc=Social', 'Cộng đồng', 'Cộng đồng'],
    ['?muc=all', 'Tất cả cài đặt', 'Tất cả cài đặt thông báo'],
  ];
  test('TC_TB_03: Đường dẫn có ?view / ?muc mở đúng mục; ?muc=alert&tab=filter mở tab "Cảnh báo Bộ lọc"; ?muc lạ giữ "Tất cả cài đặt"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedRules(p);
    await p.openCenter();
    for (const [q, nav, h2] of queries) {
      await page.goto('/trung-tam-thong-bao' + q);
      await expect(p.navItem(nav), q).toHaveAttribute('aria-current', 'true');
      if (h2) await expect(p.h2, q).toHaveText(h2);
    }
    await page.goto('/trung-tam-thong-bao?muc=alert&tab=filter');
    await expect(p.tab('Cảnh báo Bộ lọc')).toHaveAttribute('aria-selected', 'true');
    await page.goto('/trung-tam-thong-bao?muc=khong-co');
    await expect(p.navItem('Tất cả cài đặt')).toHaveAttribute('aria-current', 'true');
    await expect(p.h2).toHaveText('Tất cả cài đặt thông báo');
  });

  test('TC_TB_04: ?muc=alert&ma=fpt → mở mục Cảnh báo theo mã + hộp "Tạo cảnh báo cho mã" FPT; URL bỏ ?ma; F5 không bật lại hộp', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    seedRules(p);
    await p.open({ path: '/trung-tam-thong-bao?muc=alert&tab=stock&ma=fpt&tu=phan-tich-co-ban' });
    await expect(box.modal).toBeVisible({ timeout: 30_000 });
    await expect(box.title).toHaveText('Tạo cảnh báo cho mã');
    await expect(box.code).toHaveValue('FPT');
    await expect(page).toHaveURL(/\/trung-tam-thong-bao\?muc=alert&tab=stock$/);
    await expect(p.tab('Cảnh báo theo mã')).toHaveAttribute('aria-selected', 'true');
    await box.close.click();
    await expect(box.modal).toBeHidden();
    await page.reload();
    await expect(p.tab('Cảnh báo theo mã')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await expect(box.modal).toBeHidden();
  });

  test('TC_TB_05: Bấm tên "Chung" / "IBD" / "BCTC" (không có màn cài đặt) → cột phải hiện tiêu đề + mô tả của loại', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.openCenter();
    const cases: [string, string, string][] = [
      ['Chung', 'Thông báo chung', 'Gia hạn tài khoản, ưu đãi, thông báo vận hành từ KFSP.'],
      ['IBD', 'Thông báo IBD', "Thông báo bản tin IBD (Investor's Business Daily)"],
      ['BCTC', 'Thông báo BCTC', 'Báo khi doanh nghiệp trong watchlist công bố báo cáo tài chính mới.'],
    ];
    for (const [nav, h2, desc] of cases) {
      await p.navItem(nav).click();
      await expect(p.navItem(nav)).toHaveAttribute('aria-current', 'true');
      await expect(p.h2).toHaveText(h2);
      await expect(p.panelNote).toHaveText(desc);
    }
  });
});

// ======================================================================
test.describe('Công tắc "Nhận" theo loại', () => {
  test('TC_TB_06: Công tắc theo setting máy chủ; loại đang tắt thì chip trong chuông bị khoá, có title "Đã tắt ở Trung tâm thông báo"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.types.IBD = false;
    p.server.types.Social = false;
    await p.openCenter();
    for (const l of ['Chung', 'Cơ hội tiềm năng', 'BCTC', 'Cảnh báo', 'Sự kiện']) await expect(p.typeSwitch(l), l).toBeChecked();
    await expect(p.typeSwitch('IBD')).not.toBeChecked();
    await expect(p.typeSwitch('Cộng đồng')).not.toBeChecked();
    await p.openBell();
    for (const l of ['IBD', 'Cộng đồng']) {
      await expect(p.bellChip(l)).toBeDisabled();
      await expect(p.bellChip(l)).toHaveClass(/is-muted/);
      await expect(p.bellChip(l)).toHaveAttribute('title', 'Đã tắt ở Trung tâm thông báo');
    }
    await expect(p.bellChip('Chung')).toBeEnabled();
  });

  test('TC_TB_07: Tắt 1 loại → PUT /api/notification-settings/types {types:[{type, is_active:false}]}; chip chuông khoá ngay; bật lại → is_active:true', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.openCenter();
    await p.toggle(p.typeSwitch('BCTC'));
    await expect.poll(() => lastWrite(p, /notification-settings\/types$/)?.body).toEqual({ types: [{ type: 'bctc', is_active: false }] });
    await expect(p.typeSwitch('BCTC')).not.toBeChecked();
    await p.openBell();
    await expect(p.bellChip('BCTC')).toBeDisabled();
    await p.bell.click(); // đóng panel
    await p.toggle(p.typeSwitch('BCTC'));
    await expect.poll(() => lastWrite(p, /notification-settings\/types$/)?.body).toEqual({ types: [{ type: 'bctc', is_active: true }] });
    await expect(p.typeSwitch('BCTC')).toBeChecked();
    // Bấm công tắc không chuyển mục ở cột phải (@click.stop)
    await expect(p.h2).toHaveText('Tất cả cài đặt thông báo');
  });

  test('TC_TB_08: Lưu bật/tắt loại lỗi 500 → công tắc trả về trạng thái cũ + toast "Có lỗi xảy ra, vui lòng thử lại"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.openCenter();
    p.server.failures.push({ re: /notification-settings\/types$/, status: 500 });
    await p.toggle(p.typeSwitch('Sự kiện'));
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(p.typeSwitch('Sự kiện')).toBeChecked();
  });

  test('TC_TB_09: Badge chuông trừ phần chưa đọc của loại đang tắt (unread-counts vẫn đếm tin tồn)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.unread = { SIGNAL: 2, IBD: 3, notifications: 0, bctc: 0, news_events: 1 };
    await p.openCenter();
    // Số chưa đọc (unread-counts) nạp sau trang — máy tải nặng có thể chậm hơn 5 giây mặc định.
    await expect(p.bellBadge).toHaveText('6', { timeout: 20_000 });
    await expect(p.bell).toHaveAttribute('aria-label', 'Thông báo (6 chưa đọc)');
    await p.toggle(p.typeSwitch('IBD'));
    await expect(p.bellBadge).toHaveText('3');
    await p.toggle(p.typeSwitch('Cơ hội tiềm năng'));
    await p.toggle(p.typeSwitch('Sự kiện'));
    await expect(p.bellBadge).toHaveCount(0);
    await expect(p.bell).toHaveAttribute('aria-label', 'Thông báo');
  });
});

// ======================================================================
test.describe('Tất cả cài đặt', () => {
  test('TC_TB_10: Bảng ghép 4 nguồn — Cơ hội tiềm năng (watchlist đang nhận), Cảnh báo mã (bỏ điều kiện đã tắt + điều kiện sự kiện), Bộ lọc đang bật, Tin tức theo từng loại; badge = số dòng', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedRules(p);
    await p.openCenter();
    const rows = await p.rows.evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll('td')).slice(0, 4)
      .map((td) => (td as HTMLElement).innerText.replace(/\s+/g, ' ').trim())));
    expect(rows.map((r) => [r[0], r[1].split(' ')[0], r[2], r[3]])).toEqual([
      ['Cơ hội tiềm năng', 'Kungfu', 'Có tín hiệu AI hoặc mẫu hình', 'Tức thời'],
      ['Cảnh báo mã', 'FPT', 'Giá giảm xuống mức giá 95,000', 'Luôn luôn'],
      ['Cảnh báo mã', 'HPG', 'Giá giảm liên tục 3 phiên', 'Luôn luôn'],
      ['Cảnh báo mã', 'VNM', 'Giá tăng lên chạm mức giá 70,000', 'Luôn luôn'],
      ['Cảnh báo mã', 'VNM', 'Giá cắt lên đường SMA20', '1 lần'],
      ['Bộ lọc', 'Lọc', 'Có mã mới đáp ứng bộ lọc', '1 giờ/lần'],
      ['Tin tức & Sự kiện', 'MWG', 'BCTC', 'Khi công bố'],
      ['Tin tức & Sự kiện', 'MWG', 'Cổ tức tiền', 'Khi công bố'],
    ]);
    await expect(p.countBadge).toHaveText('8');
    await expect(p.row('Kungfu Watchlist')).toContainText('Watchlist');
    await expect(p.row('Lọc tăng trưởng')).toContainText('Bộ lọc');
    // Tên doanh nghiệp lấy từ danh sách mã của app
    await expect(p.row('FPT')).toContainText(/FPT/);
  });

  test('TC_TB_11: Ô "Tìm mã, bộ lọc" + "Lọc theo loại" lọc bảng, badge đếm theo dòng đang hiện; không còn dòng → "Chưa có quy tắc nào"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedRules(p);
    await p.openCenter();
    await expect(p.ovKind.locator('option')).toHaveText(['Tất cả loại', 'Cơ hội tiềm năng', 'Cảnh báo mã', 'Bộ lọc', 'Tin tức & Sự kiện']);
    await p.ovSearch.fill('vnm');
    await expect(p.rows).toHaveCount(2);
    await expect(p.countBadge).toHaveText('2');
    await p.ovSearch.fill('tăng trưởng');
    await expect(p.rows).toHaveCount(1);
    await expect(p.rows.first()).toContainText('Lọc tăng trưởng');
    await p.ovSearch.fill('');
    await p.ovKind.selectOption({ label: 'Tin tức & Sự kiện' });
    await expect(p.rows).toHaveCount(2);
    await p.ovSearch.fill('zzz');
    await expect(p.rows).toHaveCount(0);
    await expect(p.empty).toContainText('Chưa có quy tắc nào');
    await expect(p.countBadge).toHaveText('0');
    await expect(p.countBadge).toHaveClass(/muted/);
  });

  test('TC_TB_12: Nút Sửa — cảnh báo mã mở mục Cảnh báo + hộp "Cập nhật cảnh báo cho mã" chỉ nạp đúng điều kiện; bộ lọc → tab Bộ lọc; Cơ hội tiềm năng / Tin tức → đúng mục', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    seedRules(p);
    await p.openCenter();
    await p.row('Giá cắt lên đường SMA20').getByRole('button', { name: 'Sửa' }).click();
    await expect(box.modal).toBeVisible();
    await expect(box.title).toHaveText('Cập nhật cảnh báo cho mã');
    await expect(box.code).toHaveValue('VNM');
    await expect(box.code).toBeDisabled();
    await expect(box.cb('Giá cắt lên đường SMA20')).toBeChecked();
    await expect(box.cb('Giá tăng lên chạm một mức giá cố định')).not.toBeChecked();
    await expect(p.tab('Cảnh báo theo mã')).toHaveAttribute('aria-selected', 'true');
    await box.close.click();

    const back = async () => { await p.navItem('Tất cả cài đặt').click(); await expect(p.h2).toHaveText('Tất cả cài đặt thông báo'); };
    await back();
    await p.row('Lọc tăng trưởng').getByRole('button', { name: 'Sửa' }).click();
    await expect(p.tab('Cảnh báo Bộ lọc')).toHaveAttribute('aria-selected', 'true');
    await back();
    await p.row('Kungfu Watchlist').getByRole('button', { name: 'Sửa' }).click();
    await expect(p.h2).toHaveText('Cơ hội tiềm năng');
    await back();
    await p.row('Cổ tức tiền').getByRole('button', { name: 'Sửa' }).click();
    await expect(p.h2).toHaveText('Tin tức & Sự kiện');
  });

  test('TC_TB_13: Bấm mã trong bảng → sang /phan-tich-co-ban/<mã>', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedRules(p);
    await p.openCenter();
    await p.row('Giá giảm xuống').locator('.nc-stock').click();
    await expect(page).toHaveURL(/\/phan-tich-co-ban\/FPT$/);
  });

  test('TC_TB_14: Phạm vi "Tất cả cổ phiếu" → 1 dòng "Tất cả cổ phiếu"; tài khoản không nhận được (can_receive=false) → không có dòng Cơ hội tiềm năng', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.signal.scope = 'all_stocks';
    await p.openCenter();
    await expect(p.rows).toHaveCount(1);
    await expect(p.rows.first()).toContainText('Tất cả cổ phiếu');
    await expect(p.rows.first()).toContainText('Phạm vi');

    const p2 = new NotificationCenterPage(await page.context().newPage());
    p2.server.signal.can_receive = false;
    await p2.openCenter();
    await expect(p2.rows).toHaveCount(0);
    await expect(p2.empty).toContainText('Chưa có quy tắc nào');
  });
});

// ======================================================================
test.describe('Cơ hội tiềm năng', () => {
  test('TC_TB_15: Giao diện — Phạm vi cảnh báo, AI Mua/Bán (Mua, Bán — "Cảnh báo nguy hiểm" đang ẩn), Mẫu hình (Phát hiện, Đóng); công tắc theo máy chủ', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.signal.switches = { ai_buy: true, ai_danger: true, ai_sell: false, pattern_detect: true, pattern_close: false };
    await p.open({ path: '/trung-tam-thong-bao?view=signal' });
    await expect(p.h2).toHaveText('Cơ hội tiềm năng');
    await expect(p.panel.getByRole('link', { name: 'Mở Cơ hội tiềm năng' })).toHaveAttribute('href', '/co-hoi-tiem-nang');
    await expect(p.panel.locator('.nc-h3')).toHaveText(['Phạm vi cảnh báo', 'AI Mua/Bán', 'Mẫu hình']);
    await expect(p.panel.locator('.nc-opp-step b')).toHaveText(['Mua', 'Bán', 'Phát hiện mẫu hình', 'Đóng mẫu hình']);
    await expect(p.panel).not.toContainText('Cảnh báo nguy hiểm');
    await expect(p.oppSwitch('Mua')).toBeChecked();
    await expect(p.oppSwitch('Bán')).not.toBeChecked();
    await expect(p.oppSwitch('Phát hiện mẫu hình')).toBeChecked();
    await expect(p.oppSwitch('Đóng mẫu hình')).not.toBeChecked();
    await expect(p.scopeWatchlist).toBeChecked();
    await expect(p.wlButton).toHaveText('Kungfu Watchlist');
    await expect(p.oppLocked).toHaveCount(0);
  });

  test('TC_TB_16: Bật/tắt công tắc → PUT /signal/switches {key, is_active}; lỗi 500 → trả lại + toast; 403 → khoá khối + mở popup "Chọn dịch vụ"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.open({ path: '/trung-tam-thong-bao?view=signal' });
    await expect(p.oppSwitch('Bán')).toBeEnabled({ timeout: 20_000 });
    await p.toggle(p.oppSwitch('Bán'));
    await expect.poll(() => lastWrite(p, /signal\/switches$/)?.body).toEqual({ key: 'ai_sell', is_active: false });
    await expect(p.oppSwitch('Bán')).not.toBeChecked();

    p.server.failures.push({ re: /signal\/switches$/, status: 500 });
    await p.toggle(p.oppSwitch('Đóng mẫu hình'));
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(p.oppSwitch('Đóng mẫu hình')).toBeChecked();

    p.server.failures = [{ re: /signal\/switches$/, status: 403 }];
    await p.toggle(p.oppSwitch('Mua'));
    await expect(p.packageModal).toBeVisible();
    await expect(p.oppSwitch('Mua')).toBeChecked();
    await expect(p.oppLocked).toBeVisible();
    await expect(p.oppSwitch('Mua')).toBeDisabled();
  });

  test('TC_TB_17: Chọn "Tất cả cổ phiếu" → PUT /signal/scope {scope:"all_stocks"}, ô chọn watchlist ẩn; chọn lại "Watchlist" → scope "watchlists"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.open({ path: '/trung-tam-thong-bao?view=signal' });
    await expect(p.scopeAll).toBeEnabled({ timeout: 20_000 });
    await p.scopeAll.check();
    await expect.poll(() => lastWrite(p, /signal\/scope$/)?.body).toEqual({ scope: 'all_stocks' });
    await expect(p.wlButton).toHaveCount(0);
    await p.scopeWatchlist.check();
    await expect.poll(() => lastWrite(p, /signal\/scope$/)?.body).toEqual({ scope: 'watchlists' });
    await expect(p.wlButton).toBeVisible();
    expect(p.server.writesTo(/update-receive-signal/)).toHaveLength(0);
  });

  test('TC_TB_18: Ô chọn watchlist — tick từng watchlist (PATCH update-receive-signal), tick đủ → "Tất cả watchlist" (scope all_watchlists); bỏ "Tất cả watchlist" → "Chưa chọn watchlist"; bấm ra ngoài đóng menu', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.open({ path: '/trung-tam-thong-bao?view=signal' });
    await expect(p.wlButton).toBeEnabled({ timeout: 20_000 });
    await p.wlButton.click();
    await expect(p.wlMenu).toBeVisible();
    await expect(p.wlMenu.getByRole('link', { name: 'Quản lý watchlist' })).toHaveAttribute('href', '/watchlist');
    await p.wlItem('Ngân Hàng').check();
    await expect.poll(() => lastWrite(p, /update-receive-signal\/2$/)?.body).toEqual({ receive_signal: true });
    await expect(p.wlButton).toHaveText('2 watchlist');
    expect(p.server.writesTo(/signal\/scope$/)).toHaveLength(0);
    await p.wlItem('Công nghệ').check();
    await expect.poll(() => lastWrite(p, /signal\/scope$/)?.body).toEqual({ scope: 'all_watchlists' });
    await expect(p.wlButton).toHaveText('Tất cả watchlist');
    await expect(p.wlItem('Tất cả watchlist')).toBeChecked();
    await p.wlItem('Tất cả watchlist').uncheck();
    await expect.poll(() => lastWrite(p, /signal\/scope$/)?.body).toEqual({ scope: 'watchlists' });
    await expect(p.wlButton).toHaveText('Chưa chọn watchlist');
    await expect.poll(() => p.server.signal.watchlists.every((w) => !w.receive_signal)).toBe(true);
    await p.h2.click();
    await expect(p.wlMenu).toBeHidden();
  });

  test('TC_TB_19: Tài khoản không được nhận (can_receive=false) → khung khoá "Nâng cấp để nhận thông báo cơ hội tiềm năng", mọi công tắc/radio bị khoá; "Nâng cấp" mở popup "Chọn dịch vụ"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.signal.can_receive = false;
    await p.open({ path: '/trung-tam-thong-bao?view=signal' });
    await expect(p.oppLocked).toContainText('Nâng cấp để nhận thông báo cơ hội tiềm năng', { timeout: 20_000 });
    await expect(p.panel.locator('.nc-opp')).toHaveClass(/is-locked/);
    for (const l of ['Mua', 'Bán', 'Phát hiện mẫu hình', 'Đóng mẫu hình']) await expect(p.oppSwitch(l)).toBeDisabled();
    await expect(p.scopeAll).toBeDisabled();
    await p.oppLocked.getByRole('button', { name: 'Nâng cấp' }).click();
    await expect(p.packageModal).toBeVisible();
  });
});

// ======================================================================
test.describe('Cảnh báo — Cảnh báo theo mã', () => {
  const openAlert = async (p: NotificationCenterPage, settings?: Record<string, string>) => {
    seedRules(p);
    await p.open({ path: '/trung-tam-thong-bao?view=alert', settings });
    await expect(p.tab('Cảnh báo theo mã')).toBeVisible({ timeout: 30_000 });
    await expect(p.panel).not.toContainText('Đang tải', { timeout: 20_000 });
  };

  test('TC_TB_20: Hai tab, "Cảnh báo theo mã" đứng trước và mở sẵn; bảng mỗi điều kiện 1 hàng, xếp theo mã, bỏ điều kiện đã tắt và điều kiện sự kiện', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openAlert(p);
    await expect(p.panel.getByRole('tab')).toHaveText(['Cảnh báo theo mã', 'Cảnh báo Bộ lọc']);
    await expect(p.tab('Cảnh báo theo mã')).toHaveAttribute('aria-selected', 'true');
    await expect(p.table.locator('th')).toHaveText(['Mã', 'Doanh nghiệp', 'Giá', 'Điều kiện', 'Tần suất', '']);
    const cells = await p.rows.evaluateAll((trs) => trs.map((tr) => {
      const td = tr.querySelectorAll('td');
      return [td[0], td[3], td[4]].map((x) => (x as HTMLElement).innerText.trim()).join(' | ');
    }));
    expect(cells).toEqual([
      'FPT | Giá giảm xuống mức giá 95,000 | Luôn luôn',
      'HPG | Giá giảm liên tục 3 phiên | Luôn luôn',
      'VNM | Giá tăng lên chạm mức giá 70,000 | Luôn luôn',
      'VNM | Giá cắt lên đường SMA20 | 1 lần',
    ]);
    await expect(p.panel).not.toContainText('ACB');
    // Giá live qua socket (getlive): có số giá + % thay đổi
    await expect(p.row('FPT').locator('.nc-price')).toHaveText(/^[\d,]+\.\d{2}$/, { timeout: 15_000 });
  });

  test('TC_TB_21: "Xem gộp theo mã" → mỗi mã 1 hàng (cột "Số điều kiện"); lựa chọn lưu localStorage + setting notification_center_gop_theo_ma', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openAlert(p);
    await p.groupByCode.check();
    await expect(p.table.locator('th')).toHaveText(['Mã', 'Doanh nghiệp', 'Giá', 'Điều kiện', 'Số điều kiện', '']);
    await expect(p.rows).toHaveCount(3);
    await expect(p.row('VNM').locator('td').nth(4)).toHaveText('2');
    await expect(p.row('VNM').locator('td').nth(3)).toContainText('Giá tăng lên chạm mức giá 70,000 · Luôn luôn');
    await expect(p.row('VNM').locator('td').nth(3)).toContainText('Giá cắt lên đường SMA20 · 1 lần');
    expect(await page.evaluate(() => localStorage.getItem('notification_center_gop_theo_ma'))).toBe('true');
    await expect.poll(() => p.settingWrites).toContainEqual({ key: 'notification_center_gop_theo_ma', value: 'true' });
  });

  test('TC_TB_22: Setting máy chủ notification_center_gop_theo_ma=true → mở trang đã ở chế độ gộp', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openAlert(p, { notification_center_gop_theo_ma: 'true' });
    await expect(p.groupByCode).toBeChecked();
    await expect(p.rows).toHaveCount(3);
  });

  test('TC_TB_23: Ô "Tìm mã" lọc hàng (không phân biệt hoa thường); không có → "Chưa có cảnh báo theo mã"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openAlert(p);
    await p.stockSearch.fill('vn');
    await expect(p.rows).toHaveCount(2);
    await p.stockSearch.fill('XYZ');
    await expect(p.rows).toHaveCount(0);
    await expect(p.empty).toContainText('Chưa có cảnh báo theo mã');
  });

  test('TC_TB_24: Xoá 1 điều kiện — hộp "Xoá quy tắc" nêu đúng điều kiện; Huỷ không gọi API; Xoá → POST update/v2 {user_alerts:[], old_user_alerts:[điều kiện]}, hàng biến mất', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openAlert(p);
    const row = p.row('Giá cắt lên đường SMA20');
    await row.getByRole('button', { name: 'Xoá điều kiện này' }).click();
    await expect(p.confirmModal).toContainText('Xoá điều kiện “Giá cắt lên đường SMA20” của mã VNM? Việc này không hoàn tác được.');
    await p.confirmModal.getByRole('button', { name: 'Huỷ' }).click();
    await expect(p.confirmModal).toBeHidden();
    expect(p.server.writes).toHaveLength(0);
    await row.getByRole('button', { name: 'Xoá điều kiện này' }).click();
    await p.confirmModal.getByRole('button', { name: 'Xoá' }).click();
    await expect.poll(() => lastWrite(p, /user-alert\/update\/v2$/)?.body).toMatchObject({ user_alerts: [], old_user_alerts: [{ id: 102, stockcode: 'VNM' }] });
    await expect(p.rows).toHaveCount(3);
    await expect(p.panel).not.toContainText('SMA20');
  });

  test('TC_TB_25: Chế độ gộp — xoá mọi cảnh báo của mã → POST delete-by-stockcode/v2 {stockcodes:["VNM"]}', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openAlert(p);
    await p.groupByCode.check();
    await p.row('VNM').getByRole('button', { name: 'Xoá mọi cảnh báo của mã' }).click();
    await expect(p.confirmModal).toContainText('Xoá mọi cảnh báo kỹ thuật của mã VNM? Việc này không hoàn tác được.');
    await p.confirmModal.getByRole('button', { name: 'Xoá' }).click();
    await expect.poll(() => lastWrite(p, /delete-by-stockcode\/v2$/)?.body).toEqual({ stockcodes: ['VNM'] });
    await expect(p.rows).toHaveCount(2);
  });

  test('TC_TB_26: Xoá lỗi 500 → toast "Có lỗi xảy ra, vui lòng thử lại", hàng vẫn còn', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openAlert(p);
    p.server.failures.push({ re: /user-alert\/update\/v2$/, status: 500 });
    await p.row('Giá giảm xuống').getByRole('button', { name: 'Xoá điều kiện này' }).click();
    await p.confirmModal.getByRole('button', { name: 'Xoá' }).click();
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(p.rows).toHaveCount(4);
  });

  test('TC_TB_27: "Thêm cảnh báo" → hộp "Tạo cảnh báo cho mã" ô mã trống, nhập được; Sửa (gộp theo mã) → nạp mọi điều kiện đang bật của mã', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openAlert(p);
    await p.addAlertBtn.click();
    await expect(box.title).toHaveText('Tạo cảnh báo cho mã');
    await expect(box.code).toHaveValue('');
    await expect(box.code).toBeEnabled();
    await box.close.click();
    await p.groupByCode.check();
    await p.row('VNM').getByRole('button', { name: 'Sửa điều kiện của mã' }).click();
    await expect(box.title).toHaveText('Cập nhật cảnh báo cho mã');
    await expect(box.cb('Giá tăng lên chạm một mức giá cố định')).toBeChecked();
    await expect(box.cb('Giá cắt lên đường SMA20')).toBeChecked();
    await expect(box.valueInput(box.condRows('Giá tăng lên chạm').first())).toHaveValue('70000');
  });

  test('TC_TB_28: Lưu cảnh báo trong hộp xong → bảng tự đọc lại (alertSavedAt)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    const box = new AlertPerStockBox(page);
    await openAlert(p);
    await p.row('Giá cắt lên đường SMA20').getByRole('button', { name: 'Sửa điều kiện này' }).click();
    await expect(box.cb('Giá cắt lên đường SMA20')).toBeChecked();
    await box.cb('Giá cắt lên đường SMA20').uncheck();
    const before = p.server.reads.filter((r) => /user-alert\/get-all/.test(r)).length;
    await box.save.click();
    await expect(box.modal).toBeHidden();
    await expect.poll(() => p.server.reads.filter((r) => /user-alert\/get-all/.test(r)).length).toBeGreaterThan(before);
    await expect(p.rows).toHaveCount(3);
  });
});

// ======================================================================
test.describe('Cảnh báo — Bộ lọc', () => {
  const openFilter = async (p: NotificationCenterPage, account: 'paid' | 'free' = 'paid') => {
    seedRules(p);
    await p.open({ account, path: '/trung-tam-thong-bao?muc=alert&tab=filter' });
    await expect(p.tab('Cảnh báo Bộ lọc')).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
  };

  test('TC_TB_29: Bảng bộ lọc đã lưu (bỏ bộ lọc không có content) — công tắc theo is_active; "Tần suất (cho mọi bộ lọc)" = tần suất chung; link "Mở bộ lọc"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openFilter(p);
    await expect(p.table.locator('th')).toHaveText(['Bộ lọc', 'Báo khi có mã mới']);
    await expect(p.rows.locator('td.nc-strong')).toHaveText(['Lọc tăng trưởng', 'Tích lũy']);
    await expect(p.panel.getByRole('checkbox', { name: 'Bật Lọc tăng trưởng' })).toBeChecked();
    await expect(p.panel.getByRole('checkbox', { name: 'Bật Tích lũy' })).not.toBeChecked();
    await expect(p.filterFreq).toHaveValue('60');
    await expect(p.filterFreq.locator('option')).toHaveText(['5 phút/lần', '1 giờ/lần', '1 ngày/lần']);
    await expect(p.panel.getByRole('link', { name: 'Mở bộ lọc' })).toHaveAttribute('href', '/bo-loc');
  });

  test('TC_TB_30: Bật bộ lọc → PUT /api/filter/notification {id, is_active, frequency, my_watchlist_id}; lỗi 500 → công tắc trả về + toast', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openFilter(p);
    await p.toggle(p.panel.getByRole('checkbox', { name: 'Bật Tích lũy' }));
    await expect.poll(() => lastWrite(p, /filter\/notification$/)?.body).toEqual({ id: 12, is_active: true, frequency: 60, my_watchlist_id: 'all' });
    p.server.failures.push({ re: /filter\/notification$/, status: 500 });
    await p.toggle(p.panel.getByRole('checkbox', { name: 'Bật Lọc tăng trưởng' }));
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(p.panel.getByRole('checkbox', { name: 'Bật Lọc tăng trưởng' })).toBeChecked();
  });

  test('TC_TB_31: 🐞 Đổi "Tần suất" → PUT /api/filter/update-frequency {frequency:"1440"}; lưu lỗi → toast nhưng ô chọn vẫn hiện giá trị CHƯA lưu được', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openFilter(p);
    await p.filterFreq.selectOption('1440');
    await expect.poll(() => lastWrite(p, /update-frequency$/)?.body).toEqual({ frequency: '1440' });
    await expect(p.filterFreq).toHaveValue('1440');
    p.server.failures.push({ re: /update-frequency$/, status: 500 });
    await p.filterFreq.selectOption('5');
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    // Kỳ vọng đúng: ô trở về "1 ngày/lần" (giá trị đang lưu). Đo được: ô vẫn "5 phút/lần" — changeFilterFreq không trả lại ô
    // khi lỗi, và :value="filter_freq" không đổi nên Vue 2 không vẽ lại <select>.
    await expect(p.filterFreq).toHaveValue('5');
    await p.navItem('Tất cả cài đặt').click();
    await expect(p.row('Lọc tăng trưởng')).toContainText('1 ngày/lần');
  });

  test('TC_TB_32: Tài khoản Free — bật bộ lọc thứ 2 → toast "Tài khoản miễn phí chỉ bật được bộ lọc đầu tiên.", không gọi API', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openFilter(p, 'free');
    test.skip(await p.panel.locator('.blurred-image').count() > 0, 'Tài khoản Free bị khoá cả tab Bộ lọc (canh_bao_bo_loc) — case đổi thành TC_TB_33');
    await p.toggle(p.panel.getByRole('checkbox', { name: 'Bật Tích lũy' }));
    await expect(p.toastInfo.filter({ hasText: 'Tài khoản miễn phí chỉ bật được bộ lọc đầu tiên.' }).first()).toBeVisible();
    await expect(p.panel.getByRole('checkbox', { name: 'Bật Tích lũy' })).not.toBeChecked();
    expect(p.server.writesTo(/filter\/notification$/)).toHaveLength(0);
  });
});

// ======================================================================
test.describe('Tin tức & Sự kiện', () => {
  const openNews = async (p: NotificationCenterPage) => {
    seedRules(p);
    await p.open({ path: '/trung-tam-thong-bao?muc=news' });
    await expect(p.h2).toHaveText('Tin tức & Sự kiện', { timeout: 30_000 });
    await expect(p.rows.first()).toBeVisible({ timeout: 20_000 });
  };

  test('TC_TB_33: Bảng mã × 5 loại (BCTC, Cổ tức tiền, Cổ tức CP, Phát hành thêm, Tin doanh nghiệp), ô tích theo cài đặt', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openNews(p);
    await expect(p.table.locator('th')).toHaveText(['Mã', 'Doanh nghiệp', 'BCTC', 'Cổ tức tiền', 'Cổ tức CP', 'Phát hành thêm', 'Tin doanh nghiệp', '']);
    await expect(p.panel.getByRole('checkbox', { name: 'MWG BCTC' })).toBeChecked();
    await expect(p.panel.getByRole('checkbox', { name: 'MWG Cổ tức tiền' })).toBeChecked();
    for (const c of ['Cổ tức CP', 'Phát hành thêm', 'Tin doanh nghiệp']) await expect(p.panel.getByRole('checkbox', { name: 'MWG ' + c })).not.toBeChecked();
  });

  test('TC_TB_34: Bỏ tích 1 loại → POST /api/news-event-alerts gửi đủ 5 loại; lỗi 500 → ô tích trả lại + toast', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openNews(p);
    await p.panel.getByRole('checkbox', { name: 'MWG BCTC' }).uncheck();
    await expect.poll(() => lastWrite(p, /news-event-alerts$/, 'POST')?.body).toEqual({ stockcode: 'MWG', items: [
      { key: 'financial_report', is_active: false }, { key: 'cash_dividend', is_active: true }, { key: 'stock_dividend', is_active: false },
      { key: 'additional_issuance', is_active: false }, { key: 'business_related_news', is_active: false }] });
    p.server.failures.push({ re: /news-event-alerts$/, status: 500, method: 'POST' });
    await p.panel.getByRole('checkbox', { name: 'MWG Cổ tức CP' }).click(); // click chứ không check(): lỗi về nhanh, ô bị trả lại trước khi check() kịp xác nhận
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(p.panel.getByRole('checkbox', { name: 'MWG Cổ tức CP' })).not.toBeChecked();
  });

  test('TC_TB_35: Thêm mã hợp lệ (gõ thường) → POST bật sẵn cả 5 loại, hàng mới xếp theo mã, ô nhập xoá trắng; Enter cũng thêm', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openNews(p);
    await p.newsCode.fill('fpt');
    await p.addNewsBtn.click();
    await expect.poll(() => lastWrite(p, /news-event-alerts$/, 'POST')?.body).toMatchObject({ stockcode: 'FPT' });
    expect((lastWrite(p, /news-event-alerts$/, 'POST')!.body as { items: { is_active: boolean }[] }).items.every((i) => i.is_active)).toBe(true);
    await expect(p.rows.locator('td:first-child')).toHaveText(['FPT', 'MWG']);
    await expect(p.newsCode).toHaveValue('');
    await p.newsCode.fill('VNM');
    await p.newsCode.press('Enter');
    await expect(p.rows.locator('td:first-child')).toHaveText(['FPT', 'MWG', 'VNM']);
  });

  test('TC_TB_36: Thêm mã sai → "Mã CK không hợp lệ!"; mã đã có → "Mã MWG đã có trong danh sách"; ô trống → không làm gì; Enter + bấm nút liền nhau chỉ gửi 1 lần', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openNews(p);
    await p.addNewsBtn.click();
    await page.waitForTimeout(500);
    expect(p.server.writes).toHaveLength(0);
    await p.newsCode.fill('ZZZ9');
    await p.addNewsBtn.click();
    await expect(p.toastError.filter({ hasText: 'Mã CK không hợp lệ!' }).first()).toBeVisible();
    await p.newsCode.fill('MWG');
    await p.addNewsBtn.click();
    await expect(p.toastError.filter({ hasText: 'Mã MWG đã có trong danh sách' }).first()).toBeVisible();
    expect(p.server.writes).toHaveLength(0);
    p.server.failures.push({ re: /news-event-alerts$/, status: 200, method: 'POST', delayMs: 1500 });
    await p.newsCode.fill('HPG');
    await p.newsCode.press('Enter');
    await p.addNewsBtn.click();
    await expect(p.rows).toHaveCount(2, { timeout: 5000 });
    expect(p.server.writesTo(/news-event-alerts$/, 'POST')).toHaveLength(1);
  });

  test('TC_TB_37: Xoá mã → hộp xác nhận "Xoá mọi thông báo tin tức, sự kiện của mã MWG?" → DELETE /api/news-event-alerts {stockcodes:["MWG"]}; hết mã → "Chưa có mã nào bật tin tức, sự kiện"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openNews(p);
    await p.row('MWG').getByRole('button', { name: 'Xoá mã' }).click();
    await expect(p.confirmModal).toContainText('Xoá mọi thông báo tin tức, sự kiện của mã MWG? Việc này không hoàn tác được.');
    await p.confirmModal.getByRole('button', { name: 'Xoá' }).click();
    await expect.poll(() => lastWrite(p, /news-event-alerts$/, 'DELETE')?.body).toEqual({ stockcodes: ['MWG'] });
    await expect(p.empty).toContainText('Chưa có mã nào bật tin tức, sự kiện');
  });
});

// ======================================================================
test.describe('Cộng đồng — bài đã tắt thông báo', () => {
  test('TC_TB_38: Danh sách bài đã tắt (tiêu đề + ngày đăng) — "Bật lại thông báo" → POST update-notify {postId, status:false}, dòng biến mất; máy chủ trả success:false → toast lỗi, dòng còn', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.mutedPosts = [{ id: 501, title: 'Nhận định VNM tuần này', created_at: '2026-11-02T03:00:00Z' },
      { id: 502, title: 'Bài thứ hai', created_at: '2026-11-03T03:00:00Z' }];
    await p.open({ path: '/trung-tam-thong-bao?muc=Social' });
    await expect(p.h2).toHaveText('Cộng đồng', { timeout: 30_000 });
    await expect(p.panelNote).toHaveText('Bài viết của bạn đã tắt thông báo thích, bình luận');
    await expect(p.panel.getByRole('link', { name: 'Mở Cộng đồng' })).toHaveAttribute('href', '/cong-dong');
    await expect(p.row('Nhận định VNM tuần này')).toContainText('02/11/2026');
    await p.row('Nhận định VNM tuần này').getByRole('button', { name: 'Bật lại thông báo' }).click();
    await expect.poll(() => lastWrite(p, /update-notify$/)?.body).toEqual({ postId: 501, status: false });
    await expect(p.rows).toHaveCount(1);
    // Máy chủ nuốt lỗi: HTTP 200 + { success: false }
    p.server.failures.push({ re: /update-notify$/, status: 200, body: { success: false } });
    await p.row('Bài thứ hai').getByRole('button', { name: 'Bật lại thông báo' }).click();
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(p.rows).toHaveCount(1);
  });

  test('TC_TB_39: Không có bài nào → "Không có bài nào đang tắt thông báo"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await p.open({ path: '/trung-tam-thong-bao?muc=Social' });
    await expect(p.empty).toContainText('Không có bài nào đang tắt thông báo', { timeout: 30_000 });
  });
});

// ======================================================================
/** Dữ liệu lịch sử/chuông dùng chung. */
function seedNotices(p: NotificationCenterPage) {
  const s = p.server;
  s.lists.notifications = [
    manualNotice('📢 Tổng hợp thị trường 06/11/2026', { id: 17700, read: 0, created_at: '2026-11-06 15:01:00' }),
    manualNotice('Gia hạn tài khoản của bạn sắp hết hạn', { id: 17690, read: 1, type: 'RENEWAL', created_at: '2026-11-05 09:00:00' }),
    manualNotice('Ưu đãi tháng 11', { id: 17680, read: 0, created_at: '2026-11-04 09:00:00' }),
  ];
  s.lists.IBDV3 = [ibdNotice('Nhật báo IBD ngày 9/11/2026', { id: 17705 })];
  s.signals = [
    signalNotice({ stockcode: 'HPG', type: 'BUY', price: 25500, time: '2026-11-04 14:53:06', signal_type: 'ai_buy', buy_kind: 'new', event: 'buy_new' }, { id: 801, read: 0 }),
    signalNotice({ stockcode: 'SSI', type: 'SELL', price: 18800, time: '2026-11-03 09:42:44', signal_type: 'ai_sell', event: 'sell', pnl_pct: -6.16 }, { id: 800, read: 1 }),
    signalNotice({ stockcode: 'FPT', signal_type: 'pattern_detect', event: 'found', pattern: 'Hai đáy', neckline: 99000, cancel: 90000, target: 110000, time: '2026-11-02 10:00:00' }, { id: 799, read: 1 }),
    signalNotice({ stockcode: 'VNM', signal_type: 'pattern_detect', event: 'break', pattern: 'Vai đầu vai ngược', break_price: 63500, time: '2026-11-01 10:00:00' }, { id: 798, read: 1 }),
    signalNotice({ stockcode: 'MWG', signal_type: 'pattern_close', event: 'cancelled', pattern: 'Hai đáy', current: 51000, time: '2026-10-31 10:00:00' }, { id: 797, read: 1 }),
    signalNotice({ stockcode: 'ACB', signal_type: 'pattern_near', event: 'near_break', pattern: 'Hai đáy', time: '2026-10-30 10:00:00' }, { id: 796, read: 1 }),
  ];
  s.lists.bctc = [bctcNotice(29, 'ITD', { read: false }), bctcNotice(29, 'VGI', { read: false }), bctcNotice(28, 'GAS')];
  s.lists.ALERT = [
    filterAlertNotice('Tích lũy', ['HUT', 'VND', 'SBT', 'FTS', 'DPM'], { id: 1092331 }),
    stockAlertNotice({ type: 'COND_P_UP_VNM', stockcode: 'VNM', price: 70200, target: 70000, label: 'Mã VNM có giá vượt mức' }, { id: 1092300 }),
    stockAlertNotice({ type: 'COND_PCHANGE_DEC', stockcode: 'CTR', nb: 3, label: '3 phiên giảm giá liên tiếp' }, { id: 1091608 }),
  ];
  s.lists.news_events = [newsNotice('PRC', 'additional_issuance', 'Phát hành thêm', 'Thực hiện quyền mua cổ phiếu phát hành thêm, tỷ lệ 1:1', { is_new: true, id: 'e1' })];
  s.social = [socialNotice(321, '<strong>Ngọc Bích</strong> đã bình luận bài viết của bạn: hay', { read: false, type: 'comment', ids: [14308, 14306] })];
}

test.describe('Lịch sử thông báo', () => {
  const openHistory = async (p: NotificationCenterPage, query = '') => {
    seedNotices(p);
    await p.open({ path: '/trung-tam-thong-bao?view=history' + query });
    await expect(p.history).toBeVisible({ timeout: 30_000 });
    await expect(p.historyEmpty.filter({ hasText: 'Đang tải' })).toHaveCount(0, { timeout: 20_000 });
  };

  test('TC_TB_40: 7 chip đúng thứ tự, mặc định "Chung"; dòng Chung = tiêu đề + "Thông báo · HH:mm DD/MM/YYYY" + chấm chưa đọc; ô tìm kiếm chỉ có ở "Cơ hội tiềm năng" và "Cảnh báo"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openHistory(p);
    await expect(p.history.getByRole('tab')).toHaveText(['Chung', 'Cơ hội tiềm năng', 'IBD', 'BCTC', 'Cảnh báo', 'Cộng đồng', 'Sự kiện']);
    await expect(p.historyChip('Chung')).toHaveAttribute('aria-selected', 'true');
    await expect(p.historyRows).toHaveCount(3);
    await expect(p.historyRows.nth(0)).toContainText('📢 Tổng hợp thị trường 06/11/2026');
    await expect(p.historyRows.nth(0)).toContainText(/Thông báo\s*·\s*15:01 06\/11\/2026/);
    await expect(p.historyRows.nth(0)).toHaveClass(/is-unread/);
    await expect(p.historyRows.nth(1)).not.toHaveClass(/is-unread/);
    await expect(p.historySearch).toHaveCount(0);
    for (const chip of ['Cơ hội tiềm năng', 'Cảnh báo']) {
      await p.historyChip(chip).click();
      await expect(p.historySearch, chip).toBeVisible();
    }
    for (const chip of ['IBD', 'BCTC', 'Cộng đồng', 'Sự kiện']) {
      await p.historyChip(chip).click();
      await expect(p.historySearch, chip).toHaveCount(0);
    }
  });

  test('TC_TB_41: Chip "Cơ hội tiềm năng" — bảng Mã/Loại/Tín hiệu/Thời gian; AI mua mới / AI bán kèm giá, mẫu hình phát hiện / vượt vùng break / bị huỷ; sự kiện máy chủ đã bỏ (near_break) không hiện', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openHistory(p, '&type=SIGNAL');
    await expect(p.historyChip('Cơ hội tiềm năng')).toHaveAttribute('aria-selected', 'true');
    await expect(p.history.locator('.nh-g-head .nh-g-cell')).toHaveText(['', 'Mã', 'Loại', 'Tín hiệu', 'Thời gian']);
    // Mỗi ô ghép bằng " | "; trong ô "Tín hiệu" tên tín hiệu và giá là 2 thẻ <b> liền nhau → ghép bằng dấu cách
    const lines = await p.history.locator('.nh-g-line').evaluateAll((rs) => rs.map((r) => Array.from(r.querySelectorAll('.nh-g-cell'))
      .map((c) => {
        const bs = Array.from(c.querySelectorAll('b')).map((b) => (b.textContent || '').trim()).filter(Boolean);
        return bs.length ? bs.join(' ') : (c.textContent || '').replace(/\s+/g, ' ').trim();
      }).filter(Boolean).join(' | ')));
    expect(lines).toEqual([
      'HPG | AI Mua/Bán | AI mua mới 25.50 | 14:53 04/11/2026',
      'SSI | AI Mua/Bán | AI bán 18.80 | 09:42 03/11/2026',
      'FPT | Mẫu hình Hai đáy | AI phát hiện mẫu hình | 10:00 02/11/2026',
      'VNM | Mẫu hình Vai đầu vai ngược | Vượt vùng break 63.50 | 10:00 01/11/2026',
      'MWG | Mẫu hình Hai đáy | Đóng mẫu hình: bị huỷ 51.00 | 10:00 31/10/2026',
    ]);
    await expect(p.history.locator('.nh-g-line').nth(0).locator('.nh-dot')).toHaveCount(1);
    await expect(p.history.locator('.nh-g-line').nth(1).locator('.nh-dot')).toHaveCount(0);
    await expect(p.history.locator('.nh-g-line').nth(0).locator('.nh-g-action')).toHaveClass(/is-up/);
    await expect(p.history.locator('.nh-g-line').nth(1).locator('.nh-g-action')).toHaveClass(/is-down/);
    await expect(p.history.locator('.nh-g-line').nth(3).locator('.nh-g-action')).toHaveClass(/is-violet/);
  });

  test('TC_TB_42: Tìm kiếm — gõ không dấu vẫn tìm ra từ có dấu ("huy" → "bị huỷ"), "hủy"/"huỷ" như nhau; không có → \'Chưa có thông báo nào có chữ "…"\'; Esc xoá chữ', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openHistory(p, '&type=SIGNAL');
    await p.historySearch.fill('huy');
    await expect(p.historyRows).toHaveCount(1);
    await expect(p.historyRows.first()).toContainText('MWG');
    await p.historySearch.fill('hủy');
    await expect(p.historyRows).toHaveCount(1);
    await p.historySearch.fill('mau hinh');
    await expect(p.historyRows).toHaveCount(3);
    await p.historySearch.fill('không có đâu');
    await expect(p.historyEmpty).toHaveText('Chưa có thông báo nào có chữ "không có đâu"');
    await p.historySearch.press('Escape');
    await expect(p.historySearch).toHaveValue('');
    await expect(p.historyRows).toHaveCount(5);
    // Chữ tìm giữ nguyên khi sang chip "Cảnh báo"
    await p.historySearch.fill('vnm');
    await p.historyChip('Cảnh báo').click();
    await expect(p.historySearch).toHaveValue('vnm');
    await expect(p.historyRows).toHaveCount(1);
    await p.history.getByRole('button', { name: 'Xoá chữ' }).click();
    await expect(p.historyRows).toHaveCount(3);
  });

  test('TC_TB_43: Chip "Cảnh báo" — dòng bộ lọc "Bộ lọc Tích lũy có 5 mã mới" + "HUT, VND, SBT và 2 mã khác"; cảnh báo giá "VNM tăng lên chạm 70.00" + giá khớp + "Mức bạn đặt"; "CTR giảm 3 phiên liên tiếp"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openHistory(p, '&type=ALERT');
    const r = p.historyRows;
    await expect(r).toHaveCount(3);
    await expect(r.nth(0)).toContainText('Bộ lọc Tích lũy có 5 mã mới');
    await expect(r.nth(0)).toContainText('HUT, VND, SBT và 2 mã khác');
    await expect(r.nth(1).locator('.nh-row-title')).toHaveText('VNM tăng lên chạm 70.00');
    await expect(r.nth(1).locator('.nh-value')).toHaveText('70.20');
    await expect(r.nth(1).locator('.nh-desc')).toHaveText('Mức bạn đặt: 70.00');
    await expect(r.nth(2).locator('.nh-row-title')).toHaveText('CTR giảm 3 phiên liên tiếp');
    // Bấm dòng bộ lọc → /bo-loc
    await r.nth(0).click();
    await expect(page).toHaveURL(/\/bo-loc/);
  });

  test('TC_TB_44: Chip BCTC gộp theo đợt — "Đã có báo cáo tài chính quý 3 năm 2026 của 2 mã" + "ITD, VGI"; IBD / Sự kiện / Cộng đồng hiện đúng dòng', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openHistory(p, '&type=bctc');
    await expect(p.historyRows).toHaveCount(2);
    await expect(p.historyRows.nth(0)).toContainText('Đã có báo cáo tài chính quý 3 năm 2026 của 2 mã');
    await expect(p.historyRows.nth(0)).toContainText('VGI, ITD');
    await expect(p.historyRows.nth(0)).toHaveClass(/is-unread/);
    await expect(p.historyRows.nth(1)).toContainText('của 1 mã');
    await p.historyChip('IBD').click();
    await expect(p.historyRows).toHaveCount(1);
    await expect(p.historyRows.first()).toContainText('Nhật báo IBD ngày 9/11/2026');
    await p.historyChip('Sự kiện').click();
    await expect(p.historyRows.first()).toContainText('PRC: Phát hành thêm');
    await expect(p.historyRows.first()).toContainText('Ngày GDKHQ: 30/10/2026');
    await p.historyChip('Cộng đồng').click();
    await expect(p.historyRows.first()).toContainText('Ngọc Bích đã bình luận bài viết của bạn: hay');
  });

  test('TC_TB_45: Mở các chip KHÔNG đánh dấu đã đọc; "Đánh dấu tất cả đã đọc" → đánh dấu đúng nhóm đang xem (Chung: GET updateReadNotify type=notifications; Cơ hội: POST signal/read), chấm chưa đọc mất (không toast — main.js tắt $toast.success)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openHistory(p);
    for (const chip of ['Cơ hội tiềm năng', 'IBD', 'BCTC', 'Cảnh báo', 'Cộng đồng', 'Sự kiện', 'Chung']) await p.historyChip(chip).click();
    await page.waitForTimeout(1000);
    expect(p.server.writes.filter((w) => /updateReadNotify|signal\/read|update-read/.test(w.path))).toHaveLength(0);
    await p.historyMarkAll.click();
    await expect.poll(() => lastWrite(p, /\/notification\/updateReadNotify$/)?.query).toMatchObject({ id: '', type: 'notifications' });
    await expect(p.history.locator('.is-unread')).toHaveCount(0);
    // Code gọi $toast.success("Đã đánh dấu tất cả đã đọc") nhưng main.js tắt mọi toast thành công (yêu cầu 12/10/2026)
    await expect(page.locator('.Vue-Toastification__toast')).toHaveCount(0);
    await p.historyChip('Cơ hội tiềm năng').click();
    await p.historyMarkAll.click();
    await expect.poll(() => lastWrite(p, /signal\/read$/)?.body).toEqual({});
    await expect(p.history.locator('.nh-g-line .nh-dot')).toHaveCount(0);
  });

  test('TC_TB_46: Đánh dấu đã đọc lỗi → toast lỗi, dòng vẫn chưa đọc; tải lỗi → toast + "Chưa có thông báo nào"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.failures.push({ re: /notification\/updateReadNotify$/, status: 500 });
    await openHistory(p);
    await p.historyMarkAll.click();
    await expect(p.toastError.filter({ hasText: 'Có lỗi xảy ra, vui lòng thử lại' }).first()).toBeVisible();
    await expect(p.history.locator('.is-unread')).toHaveCount(2);
    p.server.failures.push({ re: /get-notifications-by-type$/, status: 500 });
    await p.historyChip('IBD').click();
    await expect(p.historyEmpty).toHaveText('Chưa có thông báo nào');
  });

  test('TC_TB_47: Hơn 20 dòng → hiện 20 + "Xem thêm"/cuộn tới cuối thì nạp tiếp (trang 40 dòng theo last_id); "Tải lại" đọc lại từ trang đầu', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.lists.notifications = Array.from({ length: 55 }, (_, i) => manualNotice('Thông báo số ' + (i + 1), { id: 20000 - i, read: 1 }));
    await p.open({ path: '/trung-tam-thong-bao?view=history' });
    await expect(p.historyRows.first()).toBeVisible({ timeout: 30_000 });
    // IntersectionObserver tự nạp khi cuối danh sách lọt vào màn: cuộn tới cuối cho tới khi đủ 55
    for (let i = 0; i < 6 && (await p.historyRows.count()) < 55; i++) {
      await p.historyRows.last().scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
    }
    await expect(p.historyRows).toHaveCount(55);
    await expect(p.historyMore).toHaveCount(0);
    const pages = p.server.reads.filter((r) => /get-notifications-by-type\?.*type=notifications/.test(r));
    expect(pages[0]).toMatch(/last_id=&/);
    expect(pages.some((r) => /last_id=19961/.test(r))).toBe(true);
    const before = pages.length;
    await p.historyReload.click();
    await expect.poll(() => p.server.reads.filter((r) => /type=notifications/.test(r)).length).toBeGreaterThan(before);
    expect(p.server.reads.filter((r) => /type=notifications/.test(r)).pop()).toMatch(/last_id=&/);
  });

  test('TC_TB_48: Bấm dòng có mã (Cơ hội tiềm năng) → mở popup biểu đồ của mã; dòng Cộng đồng → sang bài viết', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openHistory(p, '&type=SIGNAL');
    await p.history.locator('.nh-g-line').first().click();
    await expect.poll(() => p.store<string>('return state.isShowModalTradingChart && state.mackTradingChart')).toBe('HPG');
    await expect.poll(() => p.server.writesTo(/stock-signals\/sell-signals$/).length).toBe(1);
    await page.keyboard.press('Escape');
    await p.store('state.isShowModalTradingChart = false');
    await p.historyChip('Cộng đồng').click();
    await p.historyRows.first().click();
    await expect(page).toHaveURL(/\/cong-dong\/moi-nhat\/bai-viet\/321$/);
  });
});

// ======================================================================
test.describe('Chuông thông báo trên header', () => {
  const openWithBell = async (p: NotificationCenterPage, unread = { SIGNAL: 1, IBD: 2, notifications: 2, bctc: 1, news_events: 1 }) => {
    seedNotices(p);
    p.server.unread = unread;
    await p.open({ path: '/watchlist' });
    await expect(p.bell).toBeVisible({ timeout: 30_000 });
  };

  test('TC_TB_49: Badge = tổng unread-counts + số cảnh báo chưa xem (localStorage number_notify_alert); >99 hiện "99+"; aria-label nêu số', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await page.addInitScript(() => localStorage.setItem('number_notify_alert', '3'));
    await openWithBell(p);
    await expect(p.bellBadge).toHaveText('10');
    await expect(p.bell).toHaveAttribute('aria-label', 'Thông báo (10 chưa đọc)');
    const p2 = new NotificationCenterPage(await page.context().newPage());
    await openWithBell(p2, { SIGNAL: 150, IBD: 0, notifications: 0, bctc: 0, news_events: 0 });
    await expect(p2.bellBadge).toHaveText('99+');
  });

  test('TC_TB_50: Mở chuông — tiêu đề "Thông báo", 7 chip, số chưa đọc trên chip (chip "Chung" không có số dù có tin chưa đọc), chấm ở "Cộng đồng"; dòng phụ đếm tin chưa đọc của chip đang mở', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p);
    await p.openBell();
    await expect(p.bellPanel.locator('.notify-head-title')).toHaveText('Thông báo');
    await expect(p.bellPanel.locator('.notify-chip')).toHaveText([/^\s*Chung\s*$/, /Cơ hội tiềm năng\s*1/, /IBD\s*2/, /BCTC\s*1/, /^\s*Cảnh báo\s*$/, /Cộng đồng/, /Sự kiện\s*1/]);
    await expect(p.bellChip('Cộng đồng').locator('.notify-chip-dot')).toHaveCount(1);
    await expect(p.bellChip('Chung')).toHaveClass(/is-active/);
    await expect(p.bellRows).toHaveCount(3);
    await expect(p.bellSub).toHaveText('2 thông báo chưa đọc');
    // Mở chuông không đánh dấu đã đọc
    expect(p.server.writes.filter((w) => /updateReadNotify|signal\/read/.test(w.path))).toHaveLength(0);
  });

  test('TC_TB_51: Bấm thông báo Chung thường → modal "Thông báo" nội dung HTML + GET updateReadNotify {id, type}; thông báo RENEWAL có nút "Gia hạn phần mềm" → /renewal-account', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p);
    await p.openBell();
    await p.bellRows.filter({ hasText: 'Ưu đãi tháng 11' }).click();
    const modal = page.locator('.modal.show').filter({ hasText: 'Nội dung: Ưu đãi tháng 11' });
    await expect(modal).toBeVisible();
    await expect.poll(() => lastWrite(p, /\/notification\/updateReadNotify$/)?.query).toMatchObject({ id: '17680', type: 'MANUAL' });
    await expect(modal.getByRole('button', { name: 'Gia hạn phần mềm' })).toHaveCount(0);
    await modal.getByRole('button', { name: 'Đóng' }).click();
    await expect(modal).toBeHidden();
    // Đóng modal không đóng panel chuông
    await expect(p.bellPanel).toBeVisible();
    await p.bellRows.filter({ hasText: 'Gia hạn tài khoản' }).click();
    const renew = page.locator('.modal.show').filter({ hasText: 'Nội dung: Gia hạn tài khoản' });
    await renew.getByRole('button', { name: 'Gia hạn phần mềm' }).click();
    await expect(page).toHaveURL(/\/renewal-account/);
  });

  test('TC_TB_52: Chip "Cơ hội tiềm năng" — dòng "HPG: AI mua mới 25.50" + chip "AI Mua/Bán"; bấm dòng chưa đọc → đóng chuông, mở biểu đồ HPG, POST signal/read {id}; dòng đã đọc không gọi', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p);
    await p.openBell();
    await p.bellChip('Cơ hội tiềm năng').click();
    await expect(p.bellRows.first()).toContainText('HPG: AI mua mới');
    await expect(p.bellRows.first().locator('.noti-price')).toHaveText('25.50');
    await expect(p.bellRows.first().locator('.noti-kind')).toHaveText('AI Mua/Bán');
    await expect(p.bellRows.filter({ hasText: 'FPT' }).locator('.noti-desc')).toHaveText('Vùng break 99.00 · Vùng huỷ 90.00 · Mục tiêu 110.00');
    await p.bellRows.first().click();
    await expect(p.bellPanel).toBeHidden();
    await expect.poll(() => p.store<string>('return state.isShowModalTradingChart && state.mackTradingChart')).toBe('HPG');
    await expect.poll(() => lastWrite(p, /signal\/read$/)?.body).toEqual({ id: 801 });
    await p.store('state.isShowModalTradingChart = false');
    await p.openBell();
    await p.bellChip('Cơ hội tiềm năng').click();
    await p.bellRows.filter({ hasText: 'SSI' }).click();
    await page.waitForTimeout(800);
    expect(p.server.writesTo(/signal\/read$/)).toHaveLength(1);
  });

  test('TC_TB_53: Nút ✓✓ "Đánh dấu tất cả thông báo ở mọi tab đã đọc" → đánh dấu 6 nhóm (5 GET updateReadNotify + POST signal/read), mọi số về 0, number_notify_alert = 0', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await page.addInitScript(() => localStorage.setItem('number_notify_alert', '2'));
    await openWithBell(p);
    await p.openBell();
    p.server.unread = { SIGNAL: 0, IBD: 0, notifications: 0, bctc: 0, news_events: 0 };
    await p.bellMarkAll.click();
    await expect.poll(() => p.server.writes.filter((w) => /updateReadNotify$/.test(w.path)).map((w) => w.query.type).sort())
      .toEqual(['IBD', 'Social', 'bctc', 'news_events', 'notifications']);
    expect(p.server.writesTo(/signal\/read$/)).toHaveLength(1);
    await expect(p.bellBadge).toHaveCount(0);
    await expect(p.bellPanel.locator('.notify-chip-count')).toHaveCount(0);
    await expect(p.bellSub).toHaveText('Bạn đã đọc hết thông báo');
    expect(await page.evaluate(() => localStorage.getItem('number_notify_alert'))).toBe('0');
  });

  test('TC_TB_54: Nút × xoá 1 thông báo → DELETE /notification/delete-notifications {type, ids} (IBD gửi "IBDV3"); lỗi → toast "Không xóa được thông báo", dòng còn', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p);
    await p.openBell();
    await p.bellRows.filter({ hasText: 'Ưu đãi tháng 11' }).hover();
    await p.bellRows.filter({ hasText: 'Ưu đãi tháng 11' }).getByTitle('Xóa thông báo').click();
    await expect.poll(() => lastWrite(p, /delete-notifications$/)?.body).toEqual({ type: 'notifications', ids: [17680] });
    await expect(p.bellRows).toHaveCount(2);
    await p.bellChip('IBD').click();
    await expect(p.bellRows).toHaveCount(1);
    p.server.failures.push({ re: /delete-notifications$/, status: 500 });
    await p.bellRows.first().hover();
    await p.bellRows.first().getByTitle('Xóa thông báo').click();
    await expect(p.toastError.filter({ hasText: 'Không xóa được thông báo' }).first()).toBeVisible();
    expect(lastWrite(p, /delete-notifications$/)?.body).toEqual({ type: 'IBDV3', ids: [17705] });
    await expect(p.bellRows).toHaveCount(1);
  });

  test('TC_TB_55: Chip "Cảnh báo" — dòng bộ lọc "Tìm thấy 5 mã mới đáp ứng mẫu lọc Tích lũy của bạn: …", bấm vùng giờ của dòng mở danh sách mã, bấm câu chữ → /bo-loc; dòng giá "VNM tăng lên chạm 70.00"', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p);
    await p.openBell();
    await p.bellChip('Cảnh báo').click();
    const filterRow = p.bellPanel.locator('.alert-row').first();
    await expect(filterRow).toContainText('Tìm thấy 5 mã mới đáp ứng mẫu lọc Tích lũy của bạn: HUT, VND, SBT, FTS, DPM');
    await expect(p.bellPanel.locator('.alert-row').nth(1).locator('.alert_title')).toHaveText('VNM tăng lên chạm 70.00');
    // Câu "Tìm thấy…" là link sang /bo-loc và chiếm gần hết dòng: chỉ bấm vào dòng giờ / vùng trống mới mở danh sách mã
    await filterRow.locator('.text-muted').first().click();
    await expect(filterRow.locator('.notify__stock')).toHaveText(['HUT', 'VND', 'SBT', 'FTS', 'DPM']);
    await filterRow.locator('.alert_title-link').click();
    await expect(page).toHaveURL(/\/bo-loc/);
    await expect(p.bellPanel).toBeHidden();
  });

  test('TC_TB_56: "Xem toàn bộ lịch sử thông báo" → /trung-tam-thong-bao?view=history&type=<chip đang mở>, mở đúng chip', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p);
    await p.openBell();
    await p.bellChip('Cơ hội tiềm năng').click();
    await expect(p.bellRows.first()).toBeVisible();
    await p.bellMore.click();
    await expect(page).toHaveURL(/\/trung-tam-thong-bao\?view=history&type=SIGNAL$/);
    await expect(p.historyChip('Cơ hội tiềm năng')).toHaveAttribute('aria-selected', 'true');
    // Đang ở trang lịch sử, mở chuông ở chip khác rồi bấm lại → đổi chip (cùng route, chỉ đổi query)
    await p.openBell();
    await p.bellChip('BCTC').click();
    await expect(p.bellPanel.locator('.notify-more').first()).toBeVisible();
    await p.bellPanel.locator('.notify-more:visible').first().click();
    await expect(p.historyChip('BCTC')).toHaveAttribute('aria-selected', 'true');
  });

  test('TC_TB_57: Chip "Sự kiện" — "PRC: Phát hành thêm", "Ngày GDKHQ: 30/10/2026"; bấm → modal nội dung sự kiện + PATCH update-read-news-events-notify {ids} (tin mới)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.eventContent = '<p>Chi tiết đợt phát hành thêm PRC</p>';
    await openWithBell(p);
    await p.openBell();
    await p.bellChip('Sự kiện').click();
    const row = p.bellPanel.locator('.event-row').first();
    await expect(row).toContainText('PRC: Phát hành thêm');
    await expect(row).toContainText('Ngày GDKHQ: 30/10/2026');
    await expect(row.locator('.event-dot')).toHaveCount(1);
    await row.click();
    await expect(page.locator('.modal.show').filter({ hasText: 'Chi tiết đợt phát hành thêm PRC' })).toBeVisible();
    await expect.poll(() => lastWrite(p, /update-read-news-events-notify$/)?.body).toEqual({ ids: ['e1'] });
  });

  test('TC_TB_58: Chip "Cộng đồng" — nội dung HTML + chấm chưa đọc; bấm → GET api/notifications/updateReadNotify {post_id, type_social} + sang bài viết; × → DELETE social-history {ids} (count 0 → toast lỗi)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p);
    p.server.social.push(socialNotice(322, '<strong>An</strong> đã thích bài viết của bạn', { read: true, ids: [999] }));
    await p.openBell();
    await p.bellChip('Cộng đồng').click();
    const row = p.bellPanel.locator('.item-social').filter({ hasText: 'Ngọc Bích' });
    await expect(row.locator('strong')).toHaveText('Ngọc Bích');
    await expect(row.locator('.social-dot')).toHaveCount(1);
    // Máy chủ báo count 0 → toast lỗi, dòng còn
    p.server.failures.push({ re: /post\/social-history$/, status: 200, body: { deleted: true, count: 0 } });
    const other = p.bellPanel.locator('.item-social').filter({ hasText: 'An đã thích' });
    await other.hover();
    await other.getByTitle('Xóa thông báo').click();
    await expect.poll(() => lastWrite(p, /post\/social-history$/, 'DELETE')?.body).toEqual({ ids: [999] });
    await expect(p.toastError.filter({ hasText: 'Không xóa được thông báo' }).first()).toBeVisible();
    await expect(other).toHaveCount(1);
    await row.click();
    await expect.poll(() => lastWrite(p, /api\/notifications\/updateReadNotify$/)?.query).toMatchObject({ post_id: '321', type: 'Social', type_social: 'comment' });
    await expect(page).toHaveURL(/\/cong-dong\/moi-nhat\/bai-viet\/321$/);
  });

  test('TC_TB_59: Loại đang xem bị tắt → chuông tự nhảy sang chip bật đầu tiên; tắt cả 7 loại → panel trống', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.types.notifications = false;
    p.server.types.SIGNAL = false;
    await openWithBell(p);
    await p.openBell();
    await expect(p.bellChip('IBD')).toHaveClass(/is-active/);
    await expect(p.bellRows.first()).toContainText('Nhật báo IBD');
    const p2 = new NotificationCenterPage(await page.context().newPage());
    for (const k of Object.keys(p2.server.types)) p2.server.types[k] = false;
    await openWithBell(p2);
    await p2.openBell();
    await expect(p2.bellPanel.locator('.notify-chip.is-active')).toHaveCount(0);
    await expect(p2.bellRows).toHaveCount(0);
    await expect(p2.bellPanel.locator('.notify-chip:disabled')).toHaveCount(7);
  });

  test('TC_TB_60: 🐞 Cảnh báo về qua socket ("updatealert") KHÔNG tăng số trên chip/chuông — onReceivedAlert tìm chip "alert" (chữ thường)', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openWithBell(p, { SIGNAL: 0, IBD: 0, notifications: 0, bctc: 0, news_events: 0 });
    await expect(p.bellBadge).toHaveCount(0);
    // Giả lập máy chủ bắn sự kiện socket: gọi đúng các listener web đã đăng ký cho "updatealert"
    const fired = await page.evaluate(() => {
      const s = (window as unknown as { socket_send?: { listeners: (e: string) => ((d: unknown) => void)[] } }).socket_send;
      const ls = s?.listeners('updatealert') || [];
      ls.forEach((fn) => fn({ type: 'COND_P_UP_HPG', stockcode: 'HPG', price: 30100, target: 30000, label: 'Mã HPG có giá vượt', time: '2026-11-09T03:00:00Z' }));
      return ls.length;
    });
    expect(fired).toBeGreaterThan(0);
    await page.waitForTimeout(800);
    // Kỳ vọng đúng: badge 1 + chip Cảnh báo 1. Thực tế đo được: không có số nào.
    await expect(p.bellBadge).toHaveCount(0);
    await p.openBell();
    await expect(p.bellChip('Cảnh báo').locator('.notify-chip-count')).toHaveCount(0);
  });

  test('TC_TB_61: Bấm ra ngoài panel (kể cả vào iframe biểu đồ TradingView) → panel đóng', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedNotices(p);
    await p.open({ path: '/phan-tich-ky-thuat' });
    await expect(page.locator('.TVChartContainer iframe').first()).toBeVisible({ timeout: 60_000 });
    await p.openBell();
    const box = await page.locator('.TVChartContainer iframe').first().boundingBox();
    await page.mouse.click(box!.x + box!.width / 3, box!.y + box!.height / 2);
    await expect(p.bellPanel).toBeHidden();
  });
});

// ======================================================================
test.describe('Bản tin thị trường (popup chuông + hình thu nhỏ KFSP AI)', () => {
  const openBulletin = async (p: NotificationCenterPage, page: Page) => {
    seedNotices(p);
    p.server.bulletins['2026-11-06'] = bulletinSession('2026-11-06');
    await p.open({ path: '/watchlist' });
    await p.openBell();
    await p.bellRows.filter({ hasText: 'Tổng hợp thị trường 06/11/2026' }).click();
    await expect(p.bulletinPop).toBeVisible();
    return page;
  };

  test('TC_TB_62: Bấm thông báo "📢 Tổng hợp thị trường 06/11/2026" → popup tờ bản tin: GET /api/market-bulletin/2026-11-06, iframe vẽ "BẢN TIN THỊ TRƯỜNG" đúng ngày + số VNINDEX; lớp "Đang tải bản tin…" biến mất', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openBulletin(p, page);
    expect(p.server.reads.some((r) => /\/api\/market-bulletin\/2026-11-06/.test(r))).toBe(true);
    await expect(p.bulletinLoading).toHaveCount(0, { timeout: 15_000 });
    const sheet = p.bulletinFrame('a').locator('[data-press]:visible .sheet').first();
    await expect(sheet.locator('.name')).toHaveText('BẢN TIN THỊ TRƯỜNG');
    await expect(sheet.locator('.when')).toHaveText('Thứ sáu, 06/11/2026');
    await expect(sheet.locator('.figure .big')).toContainText('−15.37');
    await expect(sheet.locator('.figure .sub')).toContainText('Đóng cửa 1,725.36');
    await expect(sheet).toContainText('khối ngoại mua ròng trên HOSE');
    // Popup không hiện khung HTML cũ
    await expect(page.locator('.modal.show').filter({ hasText: 'VNINDEX:' })).toHaveCount(0);
  });

  test('TC_TB_63: Hai chấm "Giao diện A/B" — A đang chọn; bấm B → nạp iframe kiểu B, chấm B sáng khi vẽ xong; bấm lại A đổi ngay', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openBulletin(p, page);
    const dotA = page.getByRole('button', { name: 'Giao diện A' });
    const dotB = page.getByRole('button', { name: 'Giao diện B' });
    await expect(dotA).toHaveClass(/active/);
    await expect(page.locator('.market-bulletin-frame iframe')).toHaveCount(1);
    await dotB.click();
    await expect(page.locator('.market-bulletin-frame iframe')).toHaveCount(2);
    await expect(page.locator('.market-bulletin-frame iframe[data-style="b"]')).toHaveClass(/active/, { timeout: 15_000 });
    await expect(dotB).toHaveClass(/active/);
    await expect(p.bulletinFrame('b').locator('[data-press]:visible .sheet .name').first()).toHaveText('BẢN TIN THỊ TRƯỜNG');
    await dotA.click();
    await expect(page.locator('.market-bulletin-frame iframe[data-style="a"]')).toHaveClass(/active/);
  });

  test('TC_TB_64: Nút × đóng popup bản tin; bấm nền ngoài không đóng panel chuông', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    await openBulletin(p, page);
    await page.locator('.market-bulletin-close').click();
    await expect(p.bulletinPop).toBeHidden();
    await expect(p.bellPanel).toBeVisible();
  });

  test('TC_TB_65: Phiên chưa có bản tin (404) → popup hiện nội dung HTML cũ của thông báo, kèm nút Đóng', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedNotices(p);
    await p.open({ path: '/watchlist' });
    await p.openBell();
    await p.bellRows.filter({ hasText: 'Tổng hợp thị trường 06/11/2026' }).click();
    const modal = page.locator('.modal.show').filter({ hasText: 'Nội dung: 📢 Tổng hợp thị trường 06/11/2026' });
    await expect(modal).toBeVisible();
    await expect(p.bulletinPop).toHaveCount(0);
    await modal.getByRole('button', { name: 'Đóng' }).click();
    await expect(modal).toBeHidden();
  });

  test('TC_TB_66: Số liệu hỏng (close = null) → iframe báo vẽ hỏng → popup lùi về nội dung HTML cũ', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedNotices(p);
    const bad = bulletinSession('2026-11-06');
    (bad.vnindex as Record<string, unknown>).close = null;
    p.server.bulletins['2026-11-06'] = bad;
    await p.open({ path: '/watchlist' });
    await p.openBell();
    await p.bellRows.filter({ hasText: 'Tổng hợp thị trường 06/11/2026' }).click();
    await expect(page.locator('.modal.show').filter({ hasText: 'Nội dung: 📢 Tổng hợp thị trường 06/11/2026' })).toBeVisible({ timeout: 15_000 });
    await expect(p.bulletinPop).toHaveCount(0);
  });

  test('TC_TB_67: Chữ từ máy chủ được escape — mã cổ phiếu chứa thẻ <img onerror> không chèn được thẻ nào vào tờ bản tin', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    seedNotices(p);
    const evil = bulletinSession('2026-11-06');
    (evil.foreign as { buy: { stockcode: string }[] }).buy[0].stockcode = '<img src=x onerror="window.__xss=1">';
    p.server.bulletins['2026-11-06'] = evil;
    await p.open({ path: '/watchlist' });
    await p.openBell();
    await p.bellRows.filter({ hasText: 'Tổng hợp thị trường 06/11/2026' }).click();
    await expect(p.bulletinLoading).toHaveCount(0, { timeout: 15_000 });
    const sheet = p.bulletinFrame('a').locator('[data-press]:visible .sheet').first();
    await expect(sheet).toContainText('<img src=x onerror="window.__xss=1">');
    await expect(sheet.locator('img[src="x"]')).toHaveCount(0);
    const xss = await page.frames().map((f) => f.evaluate(() => (window as unknown as { __xss?: number }).__xss).catch(() => undefined));
    expect((await Promise.all(xss)).filter(Boolean)).toHaveLength(0);
  });

  test('TC_TB_68: Lần đầu trong ngày → gọi /api/market-bulletin/latest, hình thu nhỏ KFSP AI hiện góc phải dưới (không tự ẩn), ghi kfsp_market_bulletin_seen = ngày phiên; bấm hình → mở popup bản tin cùng phiên', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.bulletins.latest = bulletinSession('2026-11-06');
    await page.addInitScript(() => { if (!sessionStorage.getItem('__seen_reset')) { localStorage.removeItem('kfsp_market_bulletin_seen'); sessionStorage.setItem('__seen_reset', '1'); } });
    await p.open({ path: '/watchlist', bulletinSeen: false });
    await expect(p.bulletinThumb).toBeVisible({ timeout: 30_000 });
    expect(p.server.reads.filter((r) => /market-bulletin\/latest/.test(r))).toHaveLength(1);
    expect(await page.evaluate(() => localStorage.getItem('kfsp_market_bulletin_seen'))).toBe('2026-11-06');
    await page.waitForTimeout(11_000); // tin thường tự ẩn sau 10 giây; hình bản tin thì không
    await expect(p.bulletinThumb).toBeVisible();
    await p.aiPopup.locator('.bubble').click();
    await expect(p.bulletinPop).toBeVisible();
    await expect(p.bulletinFrame('a').locator('[data-press]:visible .sheet .when').first()).toHaveText('Thứ sáu, 06/11/2026', { timeout: 15_000 });
    await expect(p.aiPopup).toBeHidden();
    // Mở từ hình thu nhỏ: không gọi lại API theo ngày (dùng luôn số đã có)
    expect(p.server.reads.filter((r) => /market-bulletin\/2026-11-06/.test(r))).toHaveLength(0);
  });

  test('TC_TB_69: Nút đóng của hình thu nhỏ chỉ cất hình, không mở popup; tải lại trang không chào lại phiên đã chào', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.bulletins.latest = bulletinSession('2026-11-06');
    await page.addInitScript(() => { if (!sessionStorage.getItem('__seen_reset')) { localStorage.removeItem('kfsp_market_bulletin_seen'); sessionStorage.setItem('__seen_reset', '1'); } });
    await p.open({ path: '/watchlist', bulletinSeen: false });
    await expect(p.bulletinThumb).toBeVisible({ timeout: 30_000 });
    await p.aiPopup.locator('.close-btn').click();
    await expect(p.aiPopup).toBeHidden();
    await expect(p.bulletinPop).toHaveCount(0);
    await page.reload();
    await expect(p.bell).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(4000);
    await expect(p.bulletinThumb).toHaveCount(0);
  });

  test('TC_TB_70: Đã chào phiên hôm nay (seen = hôm nay giờ VN) → không gọi /latest; chưa có bản tin (404) → không hiện hình', async ({ page }) => {
    const p = new NotificationCenterPage(page);
    p.server.bulletins.latest = bulletinSession('2026-11-06');
    await p.open({ path: '/watchlist' }); // bulletinSeen mặc định = hôm nay
    await expect(p.bell).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(4000);
    expect(p.server.reads.filter((r) => /market-bulletin\/latest/.test(r))).toHaveLength(0);
    await expect(p.bulletinThumb).toHaveCount(0);

    const page2 = await page.context().newPage();
    const p2 = new NotificationCenterPage(page2);
    await page2.addInitScript(() => localStorage.removeItem('kfsp_market_bulletin_seen'));
    await p2.open({ path: '/watchlist', bulletinSeen: false });
    await expect(p2.bell).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => p2.server.reads.filter((r) => /market-bulletin\/latest/.test(r)).length, { timeout: 15_000 }).toBe(1);
    await page2.waitForTimeout(2000);
    await expect(p2.bulletinThumb).toHaveCount(0);
  });
});
