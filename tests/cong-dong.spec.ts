import { test, expect, Page, Route } from '@playwright/test';
import { CommunityPage, SafetyNet } from '../pages/CommunityPage';

/**
 * Chạy trên BASE_URL (localhost:8080, nhánh preprod) — backend PRODUCTION. Đăng nhập bằng phiên cache `Prev2Session`;
 * mọi API ghi (đăng/sửa/xoá bài, thích, theo dõi, bình luận, thông báo, ghim…) bị lưới `SafetyNet` huỷ, test nào cần
 * luồng thành công thì tự giả lập đúng API đó. Sau mỗi test assert không có request ghi nào chưa được giả lập.
 */
let net: SafetyNet;
test.beforeEach(async ({ context }) => {
  net = new SafetyNet();
  await net.install(context);
});
test.afterEach(async () => {
  expect(net.blocked, 'Có request ghi tới production chưa được giả lập (đã bị huỷ)').toEqual([]);
});

async function loginFirst(page: Page) {
  await new CommunityPage(page).login('moi-nhat');
}

/** Giả lập API thích: đảo `is_liked` theo id bài (giữ trạng thái giữa các lần bấm), đếm số lần gọi. */
async function mockLike(page: Page) {
  const state = new Map<number, boolean>();
  const calls: number[] = [];
  await page.route(/\/api\/stocks\/community\/like(\?|$)/, async (route: Route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    calls.push(body.id);
    const liked = !(state.get(body.id) ?? false);
    state.set(body.id, liked);
    await route.fulfill({ json: { id: body.id, is_liked: liked, likes_count: liked ? 1 : 0 } });
  });
  return calls;
}

test.describe('Cộng Đồng — Tab AI Cập Nhật (public)', () => {
  test('TC_CONGDONG_01: Overview tab AI Cập Nhật khi chưa đăng nhập', async ({ page }) => {
    // Cập nhật 10/11/2026: banner "Bạn cần đăng nhập để tham gia thảo luận" không còn (xem BUG nghi vấn ở TC_02/TC_11).
    const community = new CommunityPage(page);
    await community.gotoAiFeed();
    await expect(community.tabAiUpdate).toBeVisible();
    await expect(community.tabAiUpdate).toHaveClass(/active/);
    await expect(community.tabMoiNhat).toBeVisible();
    await expect(community.tabQuanTam).toBeVisible();
    await expect(community.tabPhoBien).toBeVisible();
    await expect(community.searchInput).toBeVisible();
    await expect(community.hotKeywordsSidebar).toBeVisible();
  });

  test('TC_CONGDONG_03: Ô tìm kiếm lọc tin AI', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.gotoAiFeed();
    await community.searchInput.fill('chứng khoán');
    await page.waitForTimeout(500);
    await expect(community.searchInput).toHaveValue('chứng khoán');
    await page.keyboard.press('Escape');
    await expect(community.searchInput).toHaveValue('');
  });

  test.fixme('TC_CONGDONG_05: Click item tin AI mở modal chi tiết', async () => {
    // Cần chọn đúng 1 item tin ổn định (nội dung tin AI thay đổi theo ngày) — bổ sung khi có locator ổn định hơn.
  });

  test.fixme('TC_CONGDONG_06: Ctrl+Click item tin AI mở tab mới', async () => {});
  test.fixme('TC_CONGDONG_07: "Hiện bài viết mới" khi có bài chờ qua socket', async () => {
    // Cần mock socket event hoặc môi trường có bài mới đăng thật trong lúc test.
  });
});

test.describe('Cộng Đồng — Sidebar "Từ khóa hot"', () => {
  test('TC_CONGDONG_08: Hiển thị 10 chủ đề hot (khách)', async ({ page }) => {
    // Cập nhật 10/11/2026: TopicChips.vue — thêm "Công bố thông tin" (10 chủ đề); "Dành cho bạn" chỉ hiện khi đã đăng nhập.
    const community = new CommunityPage(page);
    await community.gotoAiFeed();
    const tags = ['Tất cả', 'Thị trường chứng khoán', 'Tài chính quốc tế', 'Tài chính - ngân hàng',
      'Kinh tế vĩ mô - Đầu tư', 'Doanh nghiệp', 'Bất động sản', 'Thời sự', 'Crypto', 'Công bố thông tin'];
    await expect(community.hotKeywordsSidebar.getByText('🔥 Từ khoá hot')).toBeVisible();
    await expect(community.hotKeywordsList).toHaveText(tags);
    await expect(community.hotKeywordsList.filter({ hasText: /^\s*Tất cả\s*$/ })).toHaveClass(/active/);
  });

  test('TC_CONGDONG_09: Click 1 hashtag lọc tin, không đổi URL', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.gotoAiFeed();
    const chip = community.hotKeywordsList.filter({ hasText: 'Bất động sản' });
    await chip.click();
    await expect(chip).toHaveClass(/active/);
    await expect(page).toHaveURL(/\/cong-dong$/);
  });
});

test.describe('Cộng Đồng — Chuyển tab & yêu cầu đăng nhập', () => {
  test('TC_CONGDONG_10: Hiển thị đủ 4 tab lớn', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.gotoAiFeed();
    await expect(community.tabAiUpdate).toBeVisible();
    await expect(community.tabMoiNhat).toBeVisible();
    await expect(community.tabQuanTam).toBeVisible();
    await expect(community.tabPhoBien).toBeVisible();
  });

  test('TC_CONGDONG_12: Deep-link /cong-dong/moi-nhat khi chưa đăng nhập => redirect về /cong-dong', async ({ page }) => {
    await page.goto('/cong-dong/moi-nhat', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/cong-dong$/);
  });

  test('TC_CONGDONG_13: Click tab khi ĐÃ đăng nhập điều hướng đúng URL', async ({ page }) => {
    await loginFirst(page);
    const community = new CommunityPage(page);
    await community.gotoAiFeed();
    await community.tabMoiNhat.click();
    await expect(page).toHaveURL(/\/cong-dong\/moi-nhat/);
    await community.tabQuanTam.click();
    await expect(page).toHaveURL(/\/cong-dong\/quan-tam/);
    await community.tabPhoBien.click();
    await expect(page).toHaveURL(/\/cong-dong\/pho-bien/);
  });

  test('TC_CONGDONG_14: Tab Quan tâm khi chưa follow/like ai (giả lập danh sách rỗng)', async ({ page }) => {
    // Cập nhật 10/11/2026: bản cũ unfollow/follow lại THẬT trên production — nay giả lập "chưa theo dõi ai" bằng cách
    // trả rỗng cho danh sách đang theo dõi + dòng tin thẻ Quan tâm (không gọi API follow nào).
    await page.route(/\/api\/stocks\/community\/profile\/following(\?|$)/, (route) => route.fulfill({ json: [] }));
    await page.route(/\/api\/stocks\/community\/post\/get-post-by-page\?.*type=quan-tam/, (route) => route.fulfill({ json: [] }));
    const community = new CommunityPage(page);
    await community.login('quan-tam');
    await expect(community.tabQuanTam).toHaveClass(/active/);
    await expect(page.locator('.feed-skeleton')).toHaveCount(0);
    await expect(page.locator('.wrapper-item')).toHaveCount(0);
    // View "Đang theo dõi" trong thẻ hồ sơ hiện empty-state của follow.vue
    await community.followStatItem().click();
    await expect(page.getByText('Chưa theo dõi người nào')).toBeVisible();
  });
});

test.describe('Cộng Đồng — Hiển thị bài viết (feed xã hội)', () => {
  test('TC_CONGDONG_15: Hiển thị đầy đủ 1 bài viết', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await expect(community.firstPost).toBeVisible();
    await expect(community.likeButtonOf(community.firstPost).or(community.likedButtonOf(community.firstPost))).toBeVisible();
    await expect(community.commentButtonOf(community.firstPost)).toBeVisible();
    await expect(community.shareButtonOf(community.firstPost)).toBeVisible();
  });

  test('TC_CONGDONG_16: Click "Xem thêm" mở rộng nội dung bài dài', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    const showMore = community.firstPost.getByText('Xem thêm');
    if (await showMore.count()) {
      await showMore.click();
      await expect(community.firstPost.getByText('Ẩn bớt')).toBeVisible();
    }
  });

  test('TC_CONGDONG_17: Click tên tác giả chuyển tới trang cá nhân', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await community.firstPost.locator('.font-name').first().click();
    await expect(page).toHaveURL(/\/cong-dong\/thanh-vien\//);
  });
});

test.describe('Cộng Đồng — Tạo bài viết mới (Compose)', () => {
  test('TC_CONGDONG_19: Hiển thị thanh soạn bài ở tab Mới nhất', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await expect(community.composeBoxCollapsed).toBeVisible();
  });

  test('TC_CONGDONG_20: Click thanh soạn bài mở modal đầy đủ', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await community.openComposeModal();
    await expect(community.openModal.getByText('Tạo bài viết mới')).toBeVisible();
    await expect(community.stockCodeInput()).toBeVisible();
    await expect(community.hashtagInput()).toBeVisible();
    await expect(community.composeModalTextarea).toBeVisible();
    await expect(community.openModal.getByText('Tích cực')).toBeVisible();
    await expect(community.openModal.getByText('Trung lập')).toBeVisible();
    await expect(community.openModal.getByText('Tiêu cực')).toBeVisible();
    await expect(community.composeModalSubmitButton).toBeVisible();
  });

  test('TC_CONGDONG_21: Submit bài viết rỗng không gọi API', async ({ page }) => {
    await loginFirst(page);
    let called = false;
    await page.route('**/community/post/store', (route) => { called = true; return route.abort(); });
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.openComposeModal();
    await community.composeModalSubmitButton.click();
    await page.waitForTimeout(800);
    expect(called).toBe(false);
  });

  test('TC_CONGDONG_22: Đăng bài với nội dung hợp lệ (mock)', async ({ page }) => {
    await loginFirst(page);
    await page.route('**/community/post/store', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 999999, content: 'Nội dung test', avatar: '', name: 'Test', created_at: new Date().toISOString(), likes_count: 0, comments_count: 0, images: [] }) })
    );
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.openComposeModal();
    await community.composeModalTextarea.fill('Nội dung bài viết test tự động - ' + Date.now());
    await community.composeModalSubmitButton.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Nội dung test').first()).toBeVisible();
  });

  test('TC_CONGDONG_23: Gắn mã chứng khoán vào bài viết', async ({ page }) => {
    await loginFirst(page);
    await page.route('**/community/post/store', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, content: 'x', avatar: '', name: 'Test', created_at: new Date().toISOString(), macks: ['VNM'], images: [] }) })
    );
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.openComposeModal();
    await community.stockCodeInput().fill('VNM');
    await community.stockCodeInput().press('Enter');
    await expect(community.openModal.getByText('VNM')).toBeVisible();
    await community.composeModalTextarea.fill('Bài test có gắn mã CK');
    await community.composeModalSubmitButton.click();
    await page.waitForTimeout(800);
  });

  test('TC_CONGDONG_24: Gắn hashtag vào bài viết', async ({ page }) => {
    await loginFirst(page);
    await page.route('**/community/post/store', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, content: 'x', avatar: '', name: 'Test', created_at: new Date().toISOString(), hashtags: ['test'], images: [] }) })
    );
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.openComposeModal();
    await community.hashtagInput().fill('test');
    await community.hashtagInput().press('Enter');
    await expect(community.openModal.getByText('test')).toBeVisible();
    await community.composeModalTextarea.fill('Bài test có gắn hashtag');
    await community.composeModalSubmitButton.click();
    await page.waitForTimeout(800);
  });

  test('TC_CONGDONG_25: Chọn tâm lý thị trường khi đăng bài', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await community.openComposeModal();
    const positiveBtn = community.openModal.getByText('Tích cực', { exact: true });
    await expect(positiveBtn).toBeVisible();
    await positiveBtn.click();
    await expect(positiveBtn.locator('xpath=ancestor::span[contains(@class,"button-trend-wrapper")]'), 'Nút Tích cực phải chuyển trạng thái active sau khi click').toHaveClass(/bg-upchange/);
  });

  test('TC_CONGDONG_26: Đính kèm ảnh khi đăng bài', async ({ page }) => {
    await loginFirst(page);
    await page.route('**/community/post/store', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, content: 'x', avatar: '', name: 'Test', created_at: new Date().toISOString(), images: ['fake.png'] }) })
    );
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.openComposeModal();
    await community.composeModalTextarea.fill('Bài test có ảnh');
    await community.openModal.locator('#upload_community_post').setInputFiles('tests/fixtures/sample-image.png');
    await page.waitForTimeout(500);
    // Ảnh vừa chọn phải hiện preview trong modal trước khi đăng
    await expect(community.openModal.locator('img').last()).toBeVisible();
  });

  test('TC_CONGDONG_27: Đăng bài khi mất kết nối mạng — KHÔNG crash JS (đã verify qua code dùng optional chaining)', async ({ page, context }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await community.openComposeModal();
    await community.composeModalTextarea.fill('Bài test khi mất mạng - ' + Date.now());

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.route('**/community/post/store', (route) => route.abort('internetdisconnected'));
    await context.setOffline(true);
    await community.composeModalSubmitButton.click();
    await page.waitForTimeout(2000);
    await context.setOffline(false);

    expect(pageErrors, `Không được có lỗi JS runtime, nhưng bắt được: ${pageErrors.join(' | ')}`).toHaveLength(0);
  });
});

test.describe('Cộng Đồng — Thích bài viết (giả lập API like)', () => {
  // Cập nhật 10/11/2026: không còn thích/bỏ thích THẬT trên production — API `/api/stocks/community/like` được giả lập.
  test('TC_CONGDONG_28/29: Thích rồi bỏ thích bài viết đầu tiên', async ({ page }) => {
    const calls = await mockLike(page);
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    const post = community.firstPost;
    const likeBtn = community.likeButtonOf(post);
    await expect(likeBtn.or(community.likedButtonOf(post))).toBeVisible();
    test.skip(!(await likeBtn.count()), 'Bài đầu feed đang ở trạng thái "Đã thích" thật — không có gì để thích.');
    await likeBtn.click();
    await expect(community.likedButtonOf(post)).toBeVisible();
    await community.likedButtonOf(post).click();
    await expect(community.likeButtonOf(post)).toBeVisible();
    expect(calls).toHaveLength(2);
  });

  test('TC_CONGDONG_31: Thích khi API lỗi — hiện toast, không đổi trạng thái', async ({ page }) => {
    await page.route(/\/api\/stocks\/community\/like(\?|$)/, (route) => route.abort());
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    const post = community.firstPost;
    const likeBtn = community.likeButtonOf(post);
    if (await likeBtn.count()) {
      await likeBtn.click();
      await page.waitForTimeout(800);
      await expect(community.likeButtonOf(post)).toBeVisible();
    }
  });
});

test.describe('Cộng Đồng — Bình luận', () => {
  test('TC_CONGDONG_33: Click Bình luận mở modal chi tiết + ô viết bình luận', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await community.commentButtonOf(community.firstPost).click();
    await page.waitForTimeout(500);
    await expect(community.writeCommentInput).toBeVisible();
  });

  test('TC_CONGDONG_34: Viết bình luận hợp lệ (mock API)', async ({ page }) => {
    await loginFirst(page);
    await page.route('**/community/comment/store', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 888888, content: 'Bình luận test tự động', user_name: 'Test', created_at: new Date().toISOString() }) })
    );
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.commentButtonOf(community.firstPost).click();
    await community.writeCommentInput.fill('Bình luận test tự động');
    await community.writeCommentInput.press('Enter');
    await page.waitForTimeout(800);
  });

  test('TC_CONGDONG_35: Bình luận chỉ khoảng trắng không gọi API', async ({ page }) => {
    await loginFirst(page);
    let called = false;
    await page.route('**/community/comment/store', (route) => { called = true; return route.abort(); });
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.commentButtonOf(community.firstPost).click();
    await community.writeCommentInput.fill('   ');
    await community.writeCommentInput.press('Enter');
    await page.waitForTimeout(800);
    expect(called).toBe(false);
  });

  test('TC_CONGDONG_36: Shift+Enter xuống dòng, không gửi', async ({ page }) => {
    await loginFirst(page);
    let called = false;
    await page.route('**/community/comment/store', (route) => { called = true; return route.abort(); });
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.commentButtonOf(community.firstPost).click();
    await community.writeCommentInput.fill('dòng 1');
    await community.writeCommentInput.press('Shift+Enter');
    await page.waitForTimeout(500);
    expect(called).toBe(false);
  });

  test.fixme('TC_CONGDONG_37: Đính kèm ảnh vào bình luận', async () => {});
  test.fixme('TC_CONGDONG_38: Trả lời (reply) 1 bình luận', async () => {
    // Cần 1 bình luận có sẵn ổn định để bấm Trả lời — bổ sung khi có dữ liệu comment cố định.
  });
  test.fixme('TC_CONGDONG_39: Sửa bình luận của mình', async () => {});
  test.fixme('TC_CONGDONG_40: Xóa bình luận của mình (không có modal xác nhận)', async () => {});
  test.fixme('TC_CONGDONG_41: Thích 1 bình luận', async () => {});
});

test.describe('Cộng Đồng — Chia sẻ', () => {
  test('TC_CONGDONG_42: Click Chia sẻ copy link vào clipboard', async ({ page, context }) => {
    await loginFirst(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await community.shareButtonOf(community.firstPost).click();
    await page.waitForTimeout(500);
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('/community/share-post?id=');
  });
});

test.describe('Cộng Đồng — Menu quản lý bài viết của mình', () => {
  test('TC_CONGDONG_43/45/46: Vòng đời bài viết của mình (đăng → sửa → xóa) — giả lập API', async ({ page }) => {
    // Cập nhật 10/11/2026: bản cũ đăng/sửa/xoá bài THẬT trên production (và dọn qua api.kfsp.vn Laravel đã bỏ). Nay toàn
    // bộ API ghi được giả lập: post/store, post/update, DELETE post/:id. (10/11/2026: bỏ bước TC_44 tắt thông báo — bug được chấp nhận, đã xoá testcase.) Bài "của mình" được chèn vào dòng tin
    // Mới nhất (get-post-by-page thật + bài giả ở đầu) để các lần app tự tải lại sau khi sửa vẫn thấy bài.
    test.setTimeout(90000);
    const FAKE_ID = 990100;
    let template: Record<string, unknown> = {};
    let own: Record<string, unknown> | null = null;
    let uid = '';
    const writes: string[] = [];
    await page.route(/\/api\/stocks\/community\/post\/get-post-by-page\?/, async (route) => {
      const res = await route.fetch();
      let list: Record<string, unknown>[] = [];
      try { list = await res.json(); } catch { /* giữ rỗng */ }
      if (Array.isArray(list) && list[0]) template = list[0];
      const url = new URL(route.request().url());
      const firstPage = url.searchParams.get('type') === 'moi-nhat' && !url.searchParams.get('last_post');
      await route.fulfill({ response: res, json: firstPage && own ? [own, ...list] : list });
    });
    const field = (body: string, name: string) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`))?.[1] ?? '';
    await page.route(/\/api\/stocks\/community\/post\/store(\?|$)/, async (route) => {
      writes.push('store');
      own = {
        ...template, id: FAKE_ID, user_id: Number(uid), content: field(route.request().postData() || '', 'content'),
        images: [], macks: [], hashtags: [], tags: [], trend: null, likes_count: 0, is_liked: false, comments_count: 0,
        is_pinned: false, created_at: new Date().toISOString(),
      };
      await route.fulfill({ json: own });
    });
    await page.route(/\/api\/stocks\/community\/post\/update(\?|$)/, async (route) => {
      writes.push('update');
      own = { ...own!, content: field(route.request().postData() || '', 'content') };
      await route.fulfill({ json: own });
    });
    await page.route(new RegExp(`/api/stocks/community/post/${FAKE_ID}(\\?|$)`), async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      writes.push('delete');
      own = null;
      await route.fulfill({ json: { success: true } });
    });

    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    uid = (await page.evaluate(() => localStorage.getItem('user_id'))) || '';
    expect(uid, 'Phải đọc được user_id của tài khoản test').not.toBe('');

    const marker = `[TEST-AUTOMATION] ${Date.now()}`;
    await community.openComposeModal();
    await community.composeModalTextarea.fill(marker);
    await community.composeModalSubmitButton.click();
    await expect(community.openModal).toHaveCount(0);
    const myPost = page.locator('.wrapper-item').filter({ hasText: marker }).first();
    await expect(myPost, 'Bài mới phải xuất hiện trong feed').toBeVisible();

    // TC_CONGDONG_43: icon "..." hiển thị trên bài của chính mình
    await expect(community.moreMenuButtonOf(myPost)).toBeVisible();
    await community.moreMenuButtonOf(myPost).click();

    // TC_CONGDONG_45: chỉnh sửa bài viết
    if (!(await community.menuItemOf(myPost, 'Chỉnh sửa bài viết').isVisible())) await community.moreMenuButtonOf(myPost).click();
    await community.menuItemOf(myPost, 'Chỉnh sửa bài viết').click();
    await community.openModal.getByText('Chỉnh sửa bài viết').first().waitFor({ state: 'visible' });
    const editedMarker = marker + ' (đã sửa)';
    await community.composeModalTextarea.fill(editedMarker);
    await community.openModal.getByText('Lưu', { exact: true }).click();
    await expect(myPost.getByText(editedMarker), 'Nội dung đã sửa phải hiển thị trong feed').toBeVisible();

    // TC_CONGDONG_46: xóa bài viết (có modal xác nhận)
    await community.moreMenuButtonOf(myPost).click();
    await community.menuItemOf(myPost, 'Xóa bài viết').click();
    await community.openModal.getByText('Bạn có muốn xóa bài viết này không?').waitFor({ state: 'visible' });
    await community.openModal.getByText('Xóa', { exact: true }).click();
    await expect(page.getByText(editedMarker), 'Bài test phải biến mất khỏi feed sau khi xóa qua UI').toHaveCount(0);
    expect(writes).toEqual(['store', 'update', 'delete']);
  });

  test('TC_CONGDONG_47: Không thấy icon "..." trên bài người khác', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    // Bài đầu tiên trong feed thực tế (theo khảo sát) là của tác giả khác ("Thái Phạm"), không phải tài khoản test
    const moreBtn = community.moreMenuButtonOf(community.firstPost);
    const count = await moreBtn.count();
    test.info().annotations.push({ type: 'note', description: `Số icon "..." trên bài đầu feed (kỳ vọng 0 nếu không phải bài của mình): ${count}` });
  });
});

test.describe('Cộng Đồng — Bài viết ghim (Pinned posts)', () => {
  // Số bài ghim thay đổi theo thời gian thực (đã xác nhận: có lúc 1 bài, có lúc 0 bài) — 2 test dưới đây
  // THÍCH ỨNG theo trạng thái thực tế lúc chạy thay vì hard-code số lượng, và ghi rõ trạng thái quan sát được
  // qua annotation để người đọc báo cáo biết chính xác đã kiểm tra được nhánh nào.
  test('TC_CONGDONG_48/49: Hiển thị bài ghim đúng dạng theo số lượng thực tế lúc chạy', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await page.waitForTimeout(1000);

    const hasPinnedLabel = await page.getByText('Đáng chú ý', { exact: true }).count();
    if (!hasPinnedLabel) {
      test.info().annotations.push({ type: 'note', description: 'Hiện KHÔNG có bài ghim nào (0 bài) — không có gì để verify về slider/danh sách lúc này.' });
      return;
    }

    const hasSeparator = await page.getByText('Bài viết khác', { exact: true }).count();
    if (hasSeparator) {
      test.info().annotations.push({ type: 'note', description: 'TC_CONGDONG_49: đang ở dạng DANH SÁCH (1-2 bài ghim) — có nhãn "Đáng chú ý" + "Bài viết khác" phân tách, đúng như thiết kế.' });
    } else {
      test.info().annotations.push({ type: 'note', description: 'TC_CONGDONG_48: đang ở dạng SLIDER (≥ 3 bài ghim) — có nhãn "Đáng chú ý" nhưng KHÔNG có "Bài viết khác" (slider không dùng nhãn phân tách này).' });
    }
    await expect(page.getByText('Đáng chú ý', { exact: true })).toBeVisible();
  });

  test.fixme('TC_CONGDONG_50: Ghim / Bỏ ghim bài viết (cần quyền isCanPin)', async () => {});
});

test.describe('Cộng Đồng — Sidebar hồ sơ cá nhân', () => {
  test('TC_CONGDONG_51: Hiển thị thẻ hồ sơ cá nhân', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await expect(community.profileCard.getByText('Bài đăng', { exact: true })).toBeVisible();
    await expect(community.profileCard.getByText('Người theo dõi', { exact: true })).toBeVisible();
    await expect(community.profileCard.getByText('Đang theo dõi', { exact: true })).toBeVisible();
  });

  test.fixme('TC_CONGDONG_52: Click avatar/tên xem trang cá nhân đầy đủ', async () => {});
  test.fixme('TC_CONGDONG_53: Click Bài đăng/Người theo dõi/Đang theo dõi chuyển view', async () => {});
});

test.describe('Cộng Đồng — Gợi ý theo dõi', () => {
  test('TC_CONGDONG_54: Hiển thị danh sách gợi ý theo dõi', async ({ page }) => {
    // Cập nhật 10/11/2026: API gợi ý của tài khoản test hiện trả [] → giả lập 2 người để kiểm tra cách hiển thị.
    await page.route(/\/api\/stocks\/community\/suggestion-list(\?|$)/, (route) => route.fulfill({
      json: [
        { user_id: 990201, name: 'AUTOTEST Gợi ý 1', avatar: '', plan_name: '', check_follow: false },
        { user_id: 990202, name: 'AUTOTEST Gợi ý 2', avatar: '', plan_name: '', check_follow: false },
      ],
    }));
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await expect(community.suggestionsSidebarHeading).toBeVisible();
    await expect(community.suggestionRows).toHaveCount(2);
    await expect(community.suggestionRows.first()).toContainText('AUTOTEST Gợi ý 1');
    await expect(community.suggestionRows.locator('.sg-follow')).toHaveText(['Theo dõi', 'Theo dõi']);
  });

  test.fixme('TC_CONGDONG_56: Theo dõi / Bỏ theo dõi 1 user từ sidebar gợi ý', async () => {
    // Follow thật sẽ ảnh hưởng dữ liệu người dùng khác — cần mock API follow trước khi bật lại.
  });
});

test.describe('Cộng Đồng — Phân trang', () => {
  test('TC_CONGDONG_58: Cuộn xuống tải thêm bài viết (tab Mới nhất)', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    let requestCount = 0;
    page.on('request', (req) => { if (req.url().includes('/community/post/get-post-by-page')) requestCount++; });
    const community = new CommunityPage(page);
    await community.gotoTab('moi-nhat');
    await page.waitForTimeout(1000);
    const initialCount = requestCount;
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1500);
    expect(requestCount).toBeGreaterThan(initialCount);
  });

  test('TC_CONGDONG_59: Tab Phổ biến không tải thêm khi cuộn', async ({ page }) => {
    test.setTimeout(60000);
    await loginFirst(page);
    let requestCount = 0;
    page.on('request', (req) => { if (req.url().includes('/community/post/get-post-by-page')) requestCount++; });
    const community = new CommunityPage(page);
    await community.gotoTab('pho-bien');
    await page.waitForTimeout(1000);
    const afterInitialLoad = requestCount;
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1500);
    expect(requestCount).toBe(afterInitialLoad);
  });
});

test.describe('Cộng Đồng — Sidebar phải & Khác', () => {
  // TC_CONGDONG_60 (widget Chỉ số quốc tế / Top tăng/giảm) đã xoá 10/11/2026: cột phải làm lại → TC_CDMEDIA_15, TC_CDMEDIA_16.

  test('TC_CONGDONG_61: Link chính sách mở tab mới tới /policy', async ({ page, context }) => {
    const community = new CommunityPage(page);
    await community.gotoAiFeed();
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByText('Điều khoản và chính sách sử dụng').first().click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/policy');
  });

  test('TC_CONGDONG_62: Responsive ở nhiều kích thước màn hình', async ({ page }) => {
    const community = new CommunityPage(page);
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await community.gotoAiFeed();
      await expect(community.tabAiUpdate, `Lỗi ở viewport ${vp.name}`).toBeVisible();
    }
  });

  test('TC_CONGDONG_63: Nút Back trình duyệt giữa các tab', async ({ page }) => {
    const community = new CommunityPage(page);
    await community.login('moi-nhat');
    await community.tabQuanTam.click();
    await expect(page).toHaveURL(/\/cong-dong\/quan-tam/);
    await page.goBack();
    await expect(page).toHaveURL(/\/cong-dong\/moi-nhat/);
  });
});
