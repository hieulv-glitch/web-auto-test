import { test, expect, Page } from '@playwright/test';
import { PREV2_BASE_URL } from '../pages/Prev2Session';
import { CommunityMediaPage, FakePost, LinkMeta, RailData, img } from '../pages/CommunityMediaPage';

/**
 * Cộng đồng — video nhúng / ảnh không cắt trong bài + cột phải mới (testcases/cong-dong-media-cot-phai.md).
 * Chạy trên kfsp.vn (= preprod mới nhất). Dòng tin, link-preview, ảnh/player, dữ liệu cột phải và giá socket đều là dữ liệu
 * giả — xem đầu pages/CommunityMediaPage.ts. Bộ cũ testcases/cong-dong.md không đụng tới.
 */
test.use({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
test.setTimeout(120_000);

/** aspect-ratio inline của slide (trình duyệt chuẩn hoá "2" thành "2 / 1"). */
const ratioOf = (l: import("@playwright/test").Locator) => l.evaluate((e) => { const [a, b = "1"] = (e as HTMLElement).style.aspectRatio.split("/"); return Number((Number(a) / Number(b)).toFixed(3)); });

let current: CommunityMediaPage | undefined;
async function openPage(page: Page, opts: Parameters<CommunityMediaPage['open']>[0] = {}) {
  current = new CommunityMediaPage(page);
  await current.open(opts);
  return current;
}
test.afterEach(async () => {
  if (current) expect(current.blocked.filter((b) => !/activitylog/.test(b)), 'request ghi lọt lưới').toEqual([]);
  current = undefined;
});

// ======================================================================
// Dữ liệu bài viết giả
// ======================================================================
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s';
const SHORTS = 'https://youtube.com/shorts/abcdefghijk';
const TIKTOK = 'https://www.tiktok.com/@kfsp_vn/video/7704877644793302290';
const FB = 'https://www.facebook.com/kfsp/videos/123456789';
const IG = 'https://www.instagram.com/reel/AbC123xyz/';
const VIMEO = 'https://vimeo.com/76979871';
const LINK = 'https://example.com/bai-viet-gia';
const LINK_BAD = 'https://example.org/khong-co-xem-truoc';

const POSTS: FakePost[] = [
  { id: 990001, content: '<p>AUTOTEST một ảnh ngang</p>', images: [img(800, 400, 'a')] },
  { id: 990002, content: '<p>AUTOTEST ảnh dọc</p>', images: [img(400, 1000, 'b')] },
  { id: 990003, content: `<p>AUTOTEST ba ảnh ${YT}</p>`, images: [img(1600, 900, 'c1'), img(450, 800, 'c2'), img(600, 600, 'c3')] },
  { id: 990004, content: `<p>AUTOTEST youtube xem ${YT}</p>` },
  { id: 990005, content: `<p>AUTOTEST shorts ${SHORTS}</p>` },
  { id: 990006, content: `<p>AUTOTEST tiktok ${TIKTOK}</p>`, video_poster: img(720, 1280, 'tt') },
  { id: 990007, content: `<p>AUTOTEST facebook ${FB}</p>` },
  { id: 990008, content: `<p>AUTOTEST instagram ${IG}</p>` },
  { id: 990009, content: `<p>AUTOTEST vimeo ${VIMEO}</p>` },
  { id: 990010, content: `<p>AUTOTEST link thường ${LINK}</p>` },
  { id: 990011, content: `<p>AUTOTEST link lỗi ${LINK_BAD}</p>` },
];
const PREVIEWS: Record<string, LinkMeta> = {
  [YT]: { url: YT, title: 'Video YT giả', siteName: 'YouTube' },
  [LINK]: { url: LINK, title: 'Bài báo giả', description: 'Mô tả giả của bài báo', images: [img(600, 300, 'pv')], siteName: 'Example' },
};

async function openFeed(page: Page, extra: Parameters<CommunityMediaPage['open']>[0] = {}) {
  const p = await openPage(page, { posts: POSTS, previews: PREVIEWS, ...extra });
  await p.waitFeed('AUTOTEST một ảnh ngang');
  return p;
}

// ======================================================================
test.describe('Ảnh trong bài — không cắt, carousel, xem lớn', () => {
  test('TC_CDMEDIA_01: Bài 1 ảnh ngang → 1 slide khung theo tỉ lệ ảnh, ảnh nằm trọn trên nền mờ của chính nó, không bộ đếm/nút', async ({ page }) => {
    const p = await openFeed(page);
    const post = p.post('AUTOTEST một ảnh ngang');
    await expect(p.slides(post)).toHaveCount(1);
    await expect(p.counter(post)).toHaveCount(0);
    await expect(p.navNext(post)).toHaveCount(0);
    const slide = p.slides(post).first();
    await expect.poll(() => ratioOf(slide)).toBe(2);
    await expect(slide.locator('.lb-slide-img')).toHaveAttribute('src', img(800, 400, 'a'));
    expect(await slide.locator('.lb-slide-blur').getAttribute('style')).toContain(img(800, 400, 'a'));
    // Ảnh không bị cắt: khung hiện đủ ảnh (ảnh nằm trọn trong slide).
    const [s, i] = [await slide.boundingBox(), await slide.locator('.lb-slide-img').boundingBox()];
    expect(i!.width).toBeLessThanOrEqual(s!.width + 1);
    expect(i!.height).toBeLessThanOrEqual(s!.height + 1);
  });

  test('TC_CDMEDIA_02: Ảnh dọc cao hơn 4:5 → khung bị chặn ở 4:5, ảnh vẫn hiện trọn', async ({ page }) => {
    const p = await openFeed(page);
    const slide = p.slides(p.post('AUTOTEST ảnh dọc')).first();
    await expect.poll(() => ratioOf(slide)).toBe(0.8);
    const [s, i] = [await slide.boundingBox(), await slide.locator('.lb-slide-img').boundingBox()];
    expect(i!.height).toBeLessThanOrEqual(s!.height + 1);
    // Ảnh 2:5 trong khung 4:5: thẻ img chiếm trọn khung nhưng vẽ ảnh kiểu contain → hai bên lộ nền mờ, không cắt ảnh.
    expect(await slide.locator('.lb-slide-img').evaluate((e) => getComputedStyle(e).objectFit)).toBe('contain');
  });

  test('TC_CDMEDIA_03: Nhiều ảnh → bộ đếm 1/3, nút › ‹ chuyển slide; khung theo ảnh đầu; bài có ảnh thì không nhúng video', async ({ page }) => {
    const p = await openFeed(page);
    const post = p.post('AUTOTEST ba ảnh');
    await expect(p.slides(post)).toHaveCount(3);
    await expect(p.carousel(post)).toHaveClass(/lb-multi/);
    await expect.poll(() => ratioOf(p.slides(post).first())).toBe(Number((16 / 9).toFixed(3)));
    await expect(p.counter(post)).toHaveText('1/3');
    await expect(p.navPrev(post)).toHaveCount(0);
    await p.navNext(post).click();
    await expect(p.counter(post)).toHaveText('2/3');
    await expect(p.navPrev(post)).toBeVisible();
    await p.navNext(post).click();
    await expect(p.counter(post)).toHaveText('3/3');
    await expect(p.navNext(post)).toHaveCount(0);
    await p.navPrev(post).click();
    await expect(p.counter(post)).toHaveText('2/3');
    // Có ảnh thì bỏ qua link video trong nội dung.
    await expect(p.video(post)).toHaveCount(0);
    await expect(p.previewCard(post)).toHaveCount(0);
  });

  test('TC_CDMEDIA_04: Bấm ảnh → xem lớn đúng ảnh; ←/→ chuyển vòng; Esc và nút × đóng', async ({ page }) => {
    const p = await openFeed(page);
    const post = p.post('AUTOTEST ba ảnh');
    await p.slides(post).first().click();
    const big = post.locator('.lb-modal-img img');
    await expect(post.locator('.lb-modal')).toBeVisible();
    await expect(big).toHaveAttribute('src', img(1600, 900, 'c1'));
    await page.keyboard.press('ArrowRight');
    await expect(big).toHaveAttribute('src', img(450, 800, 'c2'));
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(big).toHaveAttribute('src', img(600, 600, 'c3')); // vòng về ảnh cuối
    await page.keyboard.press('Escape');
    await expect(post.locator('.lb-modal')).toHaveCount(0);
    await p.slides(post).first().click();
    await expect(post.locator('.lb-modal')).toBeVisible();
    await post.locator('.lb-modal-close').click();
    await expect(post.locator('.lb-modal')).toHaveCount(0);
  });
});

// ======================================================================
test.describe('Video nhúng trong bài', () => {
  test('TC_CDMEDIA_05: Link YouTube → poster + nút phát + nhãn + tiêu đề từ link-preview + "Xem trên YouTube"; chưa tải player trước khi bấm', async ({ page }) => {
    const p = await openFeed(page);
    const post = p.post('AUTOTEST youtube');
    const ve = p.video(post);
    await expect(ve).toBeVisible();
    await expect(ve.locator('.ve-poster')).toHaveAttribute('src', 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    await expect(ve.getByRole('button', { name: 'Phát video YouTube' })).toBeVisible();
    await expect(ve.locator('.ve-badge')).toHaveText('YouTube');
    await expect(ve.locator('.ve-title')).toHaveText('Video YT giả');
    const src = ve.locator('.ve-source');
    await expect(src).toHaveText('Xem trên YouTube');
    await expect(src).toHaveAttribute('href', YT);
    await expect(src).toHaveAttribute('target', '_blank');
    await expect(ve.locator('iframe')).toHaveCount(0);
    expect(p.playerLoads).toEqual([]);
    expect(p.previewCalls).toContain(YT);
    await expect(ve.locator('.ve-frame')).not.toHaveClass(/ve-vertical/);
  });

  test('TC_CDMEDIA_06: Bấm phát → player youtube-nocookie tự phát, đúng giây bắt đầu (t=1m30s → start=90); "Tải lại video" tải lại khung player', async ({ page }) => {
    const p = await openFeed(page);
    const ve = p.video(p.post('AUTOTEST youtube'));
    await ve.getByRole('button', { name: 'Phát video YouTube' }).click();
    const frame = ve.locator('iframe');
    await expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1&enablejsapi=1&start=90');
    await expect(frame).toHaveAttribute('title', 'Video YT giả');
    await expect(ve.locator('.ve-poster')).toHaveCount(0);
    await expect.poll(() => p.playerLoads.length).toBe(1);
    await ve.getByRole('button', { name: 'Tải lại video' }).click();
    await expect.poll(() => p.playerLoads.length).toBe(2);
    await expect(ve.locator('iframe')).toHaveCount(1);
  });

  test('TC_CDMEDIA_07: YouTube không có ảnh maxres (trả ảnh xám 120×90) → poster tự chuyển sang hqdefault', async ({ page }) => {
    const p = await openFeed(page, { youtubeMaxresMissing: true });
    const poster = p.video(p.post('AUTOTEST youtube')).locator('.ve-poster');
    await expect(poster).toHaveAttribute('src', 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  test('TC_CDMEDIA_08: YouTube Shorts → khung dọc, poster dọc oar2.jpg', async ({ page }) => {
    const p = await openFeed(page);
    const ve = p.video(p.post('AUTOTEST shorts'));
    await expect(ve.locator('.ve-frame')).toHaveClass(/ve-vertical/);
    await expect(ve.locator('.ve-poster')).toHaveAttribute('src', 'https://i.ytimg.com/vi/abcdefghijk/oar2.jpg');
    await ve.getByRole('button', { name: 'Phát video YouTube' }).click();
    await expect(ve.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/abcdefghijk\?autoplay=1/);
  });

  test('TC_CDMEDIA_09: TikTok → poster lấy video_poster của bài, khung dọc; phát bằng player TikTok (autoplay, rel=0)', async ({ page }) => {
    const p = await openFeed(page);
    const ve = p.video(p.post('AUTOTEST tiktok'));
    await expect(ve.locator('.ve-frame')).toHaveClass(/ve-vertical/);
    await expect(ve.locator('.ve-poster')).toHaveAttribute('src', img(720, 1280, 'tt'));
    await expect(ve.locator('.ve-badge')).toHaveText('TikTok');
    await ve.getByRole('button', { name: 'Phát video TikTok' }).click();
    await expect(ve.locator('iframe')).toHaveAttribute('src', 'https://www.tiktok.com/player/v1/7704877644793302290?autoplay=1&description=1&music_info=1&rel=0');
  });

  test('TC_CDMEDIA_10: Facebook / Instagram / Vimeo → nhận đúng nền tảng và player nhúng', async ({ page }) => {
    const p = await openFeed(page);
    const cases: [string, string, RegExp, boolean][] = [
      ['AUTOTEST facebook', 'Facebook', /^https:\/\/www\.facebook\.com\/plugins\/video\.php\?href=https%3A%2F%2Fwww\.facebook\.com%2Fkfsp%2Fvideos%2F123456789&show_text=false&autoplay=1$/, false],
      ['AUTOTEST instagram', 'Instagram', /^https:\/\/www\.instagram\.com\/reel\/AbC123xyz\/embed$/, true],
      ['AUTOTEST vimeo', 'Vimeo', /^https:\/\/player\.vimeo\.com\/video\/76979871\?autoplay=1$/, false],
    ];
    for (const [marker, label, embed, vertical] of cases) {
      const ve = p.video(p.post(marker));
      await ve.scrollIntoViewIfNeeded();
      await expect(ve.locator('.ve-badge'), marker).toHaveText(label);
      await expect(ve.locator('.ve-source')).toHaveText(`Xem trên ${label}`);
      if (vertical) await expect(ve.locator('.ve-frame')).toHaveClass(/ve-vertical/);
      else await expect(ve.locator('.ve-frame')).not.toHaveClass(/ve-vertical/);
      // Không có poster (link-preview không trả ảnh) → ô chữ tên nền tảng.
      await expect(ve.locator('.ve-poster-empty')).toHaveText(label);
      await ve.getByRole('button', { name: `Phát video ${label}` }).click();
      await expect(ve.locator('iframe')).toHaveAttribute('src', embed);
    }
  });

  test('TC_CDMEDIA_11: Link thường → thẻ xem trước (ảnh, tiêu đề, mô tả, trang); bấm → mở link ở tab mới', async ({ page }) => {
    const p = await openFeed(page);
    const card = p.previewCard(p.post('AUTOTEST link thường'));
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('.title')).toHaveText('Bài báo giả');
    await expect(card.locator('.description')).toHaveText('Mô tả giả của bài báo');
    await expect(card.locator('.site')).toHaveText('Example');
    await expect(card.locator('img.thumbnail')).toHaveAttribute('src', img(600, 300, 'pv'));
    await page.evaluate(() => { (window as unknown as { __opened: unknown[] }).__opened = []; window.open = ((...a: unknown[]) => { (window as unknown as { __opened: unknown[] }).__opened.push(a); return null; }) as typeof window.open; });
    await card.click();
    expect(await page.evaluate(() => (window as unknown as { __opened: unknown[] }).__opened)).toEqual([[LINK, '_blank']]);
  });

  test('TC_CDMEDIA_12: link-preview không trả dữ liệu → link thường không có thẻ; link video vẫn nhúng được (không tiêu đề)', async ({ page }) => {
    const p = await openFeed(page, { previews: {} });
    const bad = p.post('AUTOTEST link lỗi');
    await bad.scrollIntoViewIfNeeded();
    await expect.poll(() => p.previewCalls).toContain(LINK_BAD);
    await expect(p.previewCard(bad)).toHaveCount(0);
    await expect(p.video(bad)).toHaveCount(0);
    const ve = p.video(p.post('AUTOTEST youtube'));
    await expect(ve.locator('.ve-poster')).toHaveAttribute('src', /maxresdefault/);
    await expect(ve.locator('.ve-title')).toHaveCount(0);
    expect(p.pageErrors).toEqual([]);
  });

  test('TC_CDMEDIA_13: TikTok đang phát cuộn khỏi màn → gỡ player, hiện lại poster; cuộn về → phát lại', async ({ page }) => {
    const p = await openFeed(page);
    const ve = p.video(p.post('AUTOTEST tiktok'));
    await ve.scrollIntoViewIfNeeded();
    await ve.getByRole('button', { name: 'Phát video TikTok' }).click();
    await expect(ve.locator('iframe')).toHaveCount(1);
    await page.locator('.content-post').filter({ hasText: 'AUTOTEST link lỗi' }).first().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 1500);
    await expect(ve.locator('iframe')).toHaveCount(0);
    await expect(ve.locator('.ve-poster')).toHaveCount(1); // poster quay lại (khung đang ở ngoài màn)
    await ve.scrollIntoViewIfNeeded();
    await expect(ve.locator('iframe')).toHaveCount(1);
  });

  test('TC_CDMEDIA_14: YouTube đang phát cuộn khỏi màn → gửi lệnh pauseVideo cho player (giữ vị trí, không gỡ khung)', async ({ page }) => {
    const p = await openFeed(page);
    const ve = p.video(p.post('AUTOTEST youtube'));
    await ve.scrollIntoViewIfNeeded();
    await ve.getByRole('button', { name: 'Phát video YouTube' }).click();
    await expect(ve.locator('iframe')).toHaveCount(1);
    const playerFrame = () => page.frames().find((f) => /youtube-nocookie/.test(f.url()));
    await expect.poll(() => !!playerFrame()).toBe(true);
    await page.locator('.content-post').filter({ hasText: 'AUTOTEST link lỗi' }).first().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 1500);
    await expect.poll(async () => (await playerFrame()!.evaluate(() => (window as unknown as { __msgs: string[] }).__msgs)).join('|')).toContain('pauseVideo');
    await expect(ve.locator('iframe')).toHaveCount(1);
    await ve.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await playerFrame()!.evaluate(() => (window as unknown as { __msgs: string[] }).__msgs)).join('|')).toContain('playVideo');
  });
});

// ======================================================================
// Cột phải
// ======================================================================
const RAIL: RailData = {
  indexes: {
    VNINDEX: { lastprice: 1735.41, change: 21.09, perchange: 1.23 },
    HNXINDEX: { lastprice: 256.94, change: -1.7, perchange: -0.66 },
    UPCOMINDEX: { lastprice: 121.63, change: 0, perchange: 0 },
  },
  watchlists: [
    { id: 1, name: 'WL Một', macks: ['FPT', 'VNM', 'HPG', 'MBB', 'SSI', 'TCB'] },
    { id: 2, name: 'WL Hai', macks: ['FPT', 'ACB'] },
  ],
  categories: [{ id: 11, name: 'DM Chính' }, { id: 12, name: 'DM Phụ' }, { id: 13, name: 'DM Đã bán' }],
  logs: [
    { mack: 'FPT', loai_giao_dich: 'mua', khoi_luong: 1000, gia_thuc_hien: 100, danh_muc: 11 },
    { mack: 'FPT', loai_giao_dich: 'mua', khoi_luong: 1000, gia_thuc_hien: 120, danh_muc: 11 },
    { mack: 'VNM', loai_giao_dich: 'mua', khoi_luong: 100, gia_thuc_hien: 50, danh_muc: 11 },
    { mack: 'VNM', loai_giao_dich: 'ban', khoi_luong: 100, gia_thuc_hien: 55, danh_muc: 11 },
    { mack: 'HPG', loai_giao_dich: 'mua', khoi_luong: 500, gia_thuc_hien: 30, danh_muc: 12 },
    { mack: 'MBB', loai_giao_dich: 'mua', khoi_luong: 200, gia_thuc_hien: 20, danh_muc: 13 },
    { mack: 'MBB', loai_giao_dich: 'ban', khoi_luong: 200, gia_thuc_hien: 22, danh_muc: 13 },
  ],
  userCodes: ['FPT', 'VNM', 'HPG'],
  events: [
    { stockcode: 'FPT', eventid: 1, name: 'Trả cổ tức', note: 'Tiền mặt 2.000đ', title: 'FPT: Trả cổ tức tiền mặt', content: 'Nội dung sự kiện FPT', fileurl: 'https://example.com/fpt.pdf', date: '2026-11-25' },
    { stockcode: 'VNM', eventid: 2, name: 'ĐHCĐ', note: 'Họp bất thường', title: 'VNM: ĐHCĐ bất thường', date: '2026-11-15' },
    { stockcode: 'ACB', eventid: 3, name: 'Thưởng CP', note: 'Không phải mã của bạn', title: 'ACB', date: '2026-11-12' },
    { stockcode: 'HPG', eventid: 4, name: 'Phát hành', note: 'Phát hành thêm', title: 'HPG: phát hành', date: '2026-11-20' },
    { stockcode: 'FPT', eventid: 5, name: 'GDKHQ', note: 'Ngày giao dịch không hưởng quyền', title: 'FPT: GDKHQ', date: '2026-12-01' },
  ],
  news: [
    { stockcodes: ['FPT'] }, { stockcodes: ['FPT', 'VNM'] }, { stockcodes: ['VNM'] }, { stockcodes: ['HPG'] },
    { stockcodes: ['SSI', 'FPT'] }, { stockcodes: ['A', 'B', 'C', 'D', 'E', 'F'] }, { stockcodes: ['TCB'] }, { stockcodes: ['MBB'] },
  ],
  live: {
    FPT: { price: 121000, change: 1, cl: 'i', vol: 5000 },
    VNM: { price: 55000, change: 0, cl: 'e', vol: 2000 },
    HPG: { price: 27000, change: 0.5, cl: 'd', vol: 3000 },
    MBB: { price: 22000, change: 0.3, cl: 'i', vol: 100 },
    SSI: { price: 30000, change: 0.2, cl: 'd', vol: 100 },
    TCB: { price: 25000, change: 0, cl: 'e', vol: 0 },
    ACB: { price: 24000, change: 0.4, cl: 'i', vol: 100 },
  },
  intraday: {
    VNINDEX: [['09:15', 1715], ['10:00', 1725], ['11:00', 1735.41]],
    FPT: [['09:15', 120], ['10:00', 121]].map(([t, v]) => [t as string, (v as number) * 1000]) as [string, number][],
  },
};

test.describe('Cột phải', () => {
  test('TC_CDMEDIA_15: Đã đăng nhập → cột phải đủ 5 thẻ theo đúng thứ tự; thẻ Watchlist và Danh mục ghi "Chỉ bạn xem được"', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    await expect(p.rail).toBeVisible({ timeout: 45_000 });
    await expect.poll(() => p.rail.locator('.rail-title').allInnerTexts().then((a) => a.map((s) => s.trim()))).toEqual([
      'Thị trường hôm nay', 'Watchlist của bạn', 'Danh mục của bạn', 'Sự kiện 30 ngày tới', 'Mã được nhắc nhiều hôm nay',
    ]);
    await expect(p.card('Watchlist của bạn').locator('.private-note')).toHaveText('Chỉ bạn xem được');
    await expect(p.card('Danh mục của bạn').locator('.private-note')).toHaveText('Chỉ bạn xem được');
    await expect(p.card('Thị trường hôm nay').locator('.private-note')).toHaveCount(0);
  });

  test('TC_CDMEDIA_16: Thị trường hôm nay → 3 chỉ số, điểm "1,735.41", thay đổi "+21.09 (+1.23%)", màu tăng/giảm/đứng; có biểu đồ nhỏ khi có dữ liệu phút', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    const card = p.card('Thị trường hôm nay');
    await expect(p.rows(card)).toHaveCount(3);
    const row = (code: string) => p.rowByCode(card, code);
    await expect(row('VN-Index').locator('.rail-table-sub')).toHaveText('HOSE');
    await expect(row('VN-Index').locator('.rail-table-main')).toHaveText('1,735.41');
    await expect(row('VN-Index').locator('.rail-table-minor')).toHaveText('+21.09 (+1.23%)');
    await expect(row('VN-Index').locator('.rail-cell--num')).toHaveClass(/rail-up/);
    await expect(row('HNX-Index').locator('.rail-table-minor')).toHaveText('-1.70 (-0.66%)');
    await expect(row('HNX-Index').locator('.rail-cell--num')).toHaveClass(/rail-down/);
    await expect(row('UPCoM-Index').locator('.rail-cell--num')).toHaveClass(/rail-ref/);
    await expect(row('VN-Index').locator('.mini-price-chart svg .mini-price-chart-line--up')).toHaveCount(1);
    // Không có dữ liệu phút → khung biểu đồ trống (không vẽ gì).
    await expect(row('UPCoM-Index').locator('.mini-price-chart svg')).toHaveCount(0);
  });

  test('TC_CDMEDIA_17: Watchlist của bạn → tổng/tăng/đứng/giảm, tối đa 5 dòng + "Xem cả N mã"/"Thu gọn"; chọn 1 watchlist; tiêu đề sang /watchlist', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    const card = p.card('Watchlist của bạn');
    // 7 mã khác nhau (FPT trùng ở 2 watchlist): FPT, MBB, ACB tăng; VNM, TCB đứng; HPG, SSI giảm.
    await expect(card.locator('.rail-summary-text')).toContainText('Tổng 7 mã', { timeout: 30_000 });
    await expect(card.locator('.rail-summary-count')).toHaveText(/3 tăng\s*2 đứng\s*2 giảm/);
    await expect(card.locator('.rail-breadth-up')).toHaveAttribute('style', /width: 42\.85/);
    await expect(p.rows(card)).toHaveCount(5);
    await card.getByRole('button', { name: 'Xem cả 7 mã' }).click();
    await expect(p.rows(card)).toHaveCount(7);
    await card.getByRole('button', { name: 'Thu gọn' }).click();
    await expect(p.rows(card)).toHaveCount(5);
    await expect(p.rowByCode(card, 'FPT').locator('.rail-table-main')).toHaveText('121.00');
    await expect(p.rowByCode(card, 'FPT').locator('.rail-table-minor')).toHaveText('+1.00 (+0.83%)');
    await expect(card.locator('a.rail-title-link')).toHaveAttribute('href', '/watchlist');
    // Chọn watchlist "WL Hai" → còn 2 mã.
    await card.locator('.ms-select').click();
    await page.getByText('WL Hai', { exact: true }).last().click();
    await expect(card.locator('.rail-summary-text')).toContainText('Tổng 2 mã');
    await expect(p.rows(card)).toHaveCount(2);
  });

  test('TC_CDMEDIA_18: Bấm một mã ở Watchlist / Danh mục / Mã được nhắc nhiều → lọc dòng tin theo mã (/cong-dong?ma=MÃ)', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    const wl = p.card('Watchlist của bạn');
    await p.rowByCode(wl, 'VNM').click();
    await expect(page).toHaveURL(/\/cong-dong\?ma=VNM$/);
    const mm = p.card('Mã được nhắc nhiều hôm nay');
    await p.rowByCode(mm, 'HPG').click();
    await expect(page).toHaveURL(/\/cong-dong\?ma=HPG$/);
  });

  test('TC_CDMEDIA_19: Không có watchlist nào → lời nhắc thêm mã + link "Tạo watchlist"', async ({ page }) => {
    const p = await openPage(page, { rail: { ...RAIL, watchlists: [] } });
    const card = p.card('Watchlist của bạn');
    await expect(card.locator('.rail-state')).toContainText('Thêm mã bạn quan tâm để xem bài viết về mã đó.', { timeout: 30_000 });
    await expect(card.getByRole('link', { name: 'Tạo watchlist' })).toHaveAttribute('href', '/watchlist');
    await expect(card.locator('.ms-select')).toHaveCount(0);
  });

  test('TC_CDMEDIA_20: Danh mục của bạn → lãi/lỗ chưa thực hiện tính theo nhật ký (tổng + từng danh mục); danh mục gập sẵn, bấm mở; danh mục đã bán hết bị bỏ', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    const card = p.card('Danh mục của bạn');
    // FPT: giá TB 110, giữ 2.000 CP, giá 121 → lãi 22.000 nghìn; HPG: TB 30, 500 CP, giá 27 → lỗ 1.500 nghìn.
    // Tổng 20.500 nghìn trên giá vốn 235.000 nghìn = +8.72%. VNM đã bán hết, DM Đã bán không còn mã → bỏ.
    const groups = card.locator('button.pf-group');
    await expect(groups).toHaveCount(2, { timeout: 30_000 });
    await expect(groups.nth(0).locator('.pf-group-name')).toHaveText('DM Chính');
    await expect(groups.nth(0).locator('.rail-table-sub')).toHaveText('1 mã');
    await expect(groups.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(card.locator('.rail-summary-count')).toContainText('8.72');
    await expect(card.locator('.rail-summary-count')).toHaveClass(/rail-up/);
    await expect(groups.nth(1).locator('.rail-cell--num')).toHaveClass(/rail-down/);
    await expect(groups.nth(1).locator('.rail-table-minor')).toContainText('10.00');
    await expect(card.locator('.pf-cols')).toHaveCount(0);
    await groups.nth(0).click();
    await expect(groups.nth(0)).toHaveAttribute('aria-expanded', 'true');
    const fpt = p.rowByCode(card, 'FPT');
    await expect(fpt).toHaveAttribute('title', 'FPT - đang giữ 2,000 cổ phiếu');
    await expect(fpt.locator('.rail-cell--num .rail-table-minor')).toContainText('10.00');
    await expect(fpt.locator('.rail-cell--num')).toHaveClass(/rail-up/);
    await expect(p.rowByCode(card, 'VNM')).toHaveCount(0);
    await groups.nth(0).click();
    await expect(card.locator('.pf-cols')).toHaveCount(0);
    await expect(card.locator('a.rail-title-link')).toHaveAttribute('href', '/nhat-ky-giao-dich');
  });

  test('TC_CDMEDIA_21: Chỉ 1 danh mục còn giữ mã → luôn mở; không danh mục nào còn mã → ẩn cả thẻ', async ({ page, browser }) => {
    const p = await openPage(page, { rail: { ...RAIL, categories: [{ id: 12, name: 'DM Phụ' }] } });
    const card = p.card('Danh mục của bạn');
    await expect(card.locator('button.pf-group')).toHaveAttribute('aria-expanded', 'true', { timeout: 30_000 });
    await expect(p.rowByCode(card, 'HPG')).toBeVisible();
    await card.locator('button.pf-group').click();
    await expect(p.rowByCode(card, 'HPG')).toBeVisible();

    const ctx = await browser.newContext({ baseURL: PREV2_BASE_URL, viewport: { width: 1600, height: 900 } });
    const page2 = await ctx.newPage();
    const p2 = new CommunityMediaPage(page2);
    await p2.open({ rail: { ...RAIL, categories: [{ id: 13, name: 'DM Đã bán' }] } });
    await expect(p2.card('Mã được nhắc nhiều hôm nay')).toBeVisible({ timeout: 30_000 });
    await expect(p2.card('Watchlist của bạn').locator('.rail-summary')).toBeVisible();
    await expect(p2.card('Danh mục của bạn')).toHaveCount(0);
    expect(p2.blocked.filter((b) => !/activitylog/.test(b))).toEqual([]);
    await ctx.close();
  });

  test('TC_CDMEDIA_22: Sự kiện 30 ngày tới → chỉ mã của người dùng, sắp theo ngày, 3 dòng + "Xem tất cả"; bấm → popup chi tiết', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    const card = p.card('Sự kiện 30 ngày tới');
    await expect(p.rows(card)).toHaveCount(3, { timeout: 30_000 });
    await expect(card.locator('.ue-date')).toHaveText(['15/11', '20/11', '25/11']);
    await expect(card.locator('.rail-table-code')).toHaveText(['VNM', 'HPG', 'FPT']);
    await expect(card).not.toContainText('ACB');
    await card.getByRole('button', { name: 'Xem tất cả' }).click();
    await expect(p.rows(card)).toHaveCount(4);
    await card.getByRole('button', { name: 'Thu gọn' }).click();
    await p.rows(card).filter({ hasText: 'FPT' }).first().click();
    const modal = page.locator('.modal.show').filter({ hasText: 'Chi tiết sự kiện' });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('FPT: Trả cổ tức tiền mặt');
    await expect(modal).toContainText('Nội dung sự kiện FPT');
    await expect(modal.getByRole('link', { name: 'Xem văn bản gốc' })).toHaveAttribute('href', 'https://example.com/fpt.pdf');
    await modal.getByRole('button', { name: 'Đóng' }).click();
    await expect(modal).toHaveCount(0);
  });

  test('TC_CDMEDIA_23: Mã được nhắc nhiều hôm nay → top theo số tin AI hôm nay (tin gắn > 5 mã không tính), kèm giá', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    const card = p.card('Mã được nhắc nhiều hôm nay');
    // FPT 3, VNM 2, HPG 1, MBB 1, SSI 1, TCB 1 → top 5 sắp theo số tin rồi theo mã.
    await expect(card.locator('.rail-table-code')).toHaveText(['FPT', 'VNM', 'HPG', 'MBB', 'SSI'], { timeout: 30_000 });
    await expect(p.rowByCode(card, 'FPT').locator('.rail-table-sub')).toHaveText('3 bài viết');
    await expect(p.rowByCode(card, 'FPT').locator('.rail-table-main')).toHaveText('121.00');
    await expect(card).not.toContainText(/^A$/);
    await expect(p.rowByCode(card, 'FPT')).toHaveAttribute('title', 'Xem bài viết về FPT');
  });

  test('TC_CDMEDIA_24: Biểu đồ nhỏ — mã chưa khớp lệnh (khối lượng 0) chỉ vẽ đường tham chiếu; mã có giá phút vẽ đường giá', async ({ page }) => {
    const p = await openPage(page, { rail: RAIL });
    const card = p.card('Watchlist của bạn');
    await card.getByRole('button', { name: 'Xem cả 7 mã' }).click({ timeout: 30_000 });
    const tcb = p.rowByCode(card, 'TCB').locator('.mini-price-chart');
    await expect(tcb.locator('svg line.mini-price-chart-ref')).toHaveCount(1);
    await expect(tcb.locator('svg path.mini-price-chart-line')).toHaveCount(0);
    const fpt = p.rowByCode(card, 'FPT').locator('.mini-price-chart');
    await expect(fpt.locator('svg path.mini-price-chart-line--up')).toHaveCount(1);
    await expect(fpt.locator('svg line.mini-price-chart-ref')).toHaveCount(1);
  });

  test('TC_CDMEDIA_25: 🐞 Tài khoản Free vào thẳng /cong-dong vẫn thấy "Sự kiện 30 ngày tới"; đi từ trang khác trong app thì thẻ bị ẩn', async ({ page }) => {
    // Thẻ ẩn theo `$store.state.isAccountFree` (UpcomingEvents.vue), nhưng cờ này chỉ được TheContainer (layout của app) bật
    // qua `get-limit-components2`; trang Cộng đồng dùng CommunityLayout không gọi → vào thẳng trang thì cờ vẫn false.
    const p = await openPage(page, { account: 'free', rail: RAIL });
    const store = () => page.evaluate(() => {
      type VueEl = Element & { __vue__?: { $store?: { state: { isAccountFree: boolean } } } };
      const el = Array.from(document.querySelectorAll('body *')).find((e) => (e as VueEl).__vue__?.$store) as VueEl | undefined;
      return el ? el.__vue__!.$store!.state.isAccountFree : null;
    });
    await expect(p.card('Mã được nhắc nhiều hôm nay')).toBeVisible({ timeout: 45_000 });
    await expect(p.card('Sự kiện 30 ngày tới')).toBeVisible();
    expect(await store()).toBe(false);
    // Vào Dashboard (layout app → bật cờ Free) rồi bấm menu "Cộng đồng".
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect.poll(store, { timeout: 30_000 }).toBe(true);
    await page.getByRole('link', { name: 'Cộng đồng', exact: true }).first().click();
    await expect(p.card('Mã được nhắc nhiều hôm nay')).toBeVisible({ timeout: 30_000 });
    await expect(p.card('Thị trường hôm nay')).toBeVisible();
    await expect(p.card('Watchlist của bạn')).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(p.card('Sự kiện 30 ngày tới')).toHaveCount(0);
  });

  test('TC_CDMEDIA_26: Màn hẹp hơn 1200px → ẩn cột phải', async ({ page }) => {
    await page.setViewportSize({ width: 1150, height: 900 });
    const p = await openPage(page, { rail: RAIL });
    await expect(page.locator('.content-post, .feed, .community').first()).toBeAttached({ timeout: 45_000 });
    await page.waitForTimeout(2000);
    await expect(p.rail).toBeHidden();
  });
});
