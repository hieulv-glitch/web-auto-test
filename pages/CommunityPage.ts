import { Page, Locator, BrowserContext, Route } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * ⚠️ AN TOÀN DỮ LIỆU: localhost:8080 (nhánh preprod) gọi backend PRODUCTION (`$apiAdressNest` = https://api2.kfsp.vn,
 * NestJS từ commit 1db8b5534). API ghi của màn Cộng đồng (đọc từ source 10/11/2026):
 *   POST   /api/stocks/community/post/store          đăng bài (addNewPost.vue)
 *   PUT    /api/stocks/community/post/update         sửa bài (post.vue, PinnedPost.vue)
 *   DELETE /api/stocks/community/post/:id            xoá bài
 *   POST   /api/stocks/community/update-notify       tắt/bật thông báo bài
 *   PATCH  /api/stocks/community/post/pin|un-pin/:id ghim / bỏ ghim
 *   POST   /api/stocks/community/like                thích bài / bình luận
 *   POST   /api/stocks/community/follow              theo dõi / bỏ theo dõi (post.vue, follow.vue, menuFeedCard.vue, userSuggestions.vue)
 *   POST   /api/stocks/community/comment/store|edit|delete   bình luận
 * `SafetyNet` (cài ở mức context → phủ cả tab mới): mọi request KHÔNG phải GET/HEAD/OPTIONS tới *.kfsp.vn /
 * *.vietpointer.vn / *.kungfustockspro.live đều bị HUỶ và ghi vào `blocked` (spec assert rỗng sau mỗi test), trừ:
 *   - `/api/login` (tạo phiên đăng nhập, không đổi dữ liệu) và `socket.io` (kênh giá realtime, long-polling POST);
 *   - `/api/activitylog/*` (app tự ghi nhật ký xem trang) → trả giả thành công, không tới server.
 * Test nào cần quan sát luồng ghi thành công thì tự `page.route` giả lập đúng API đó (route đăng ký sau được hỏi trước).
 */
export class SafetyNet {
  static readonly HOST = /(^|\.)(kfsp\.vn|vietpointer\.vn|kungfustockspro\.live)$/;
  readonly blocked: string[] = [];

  async install(context: BrowserContext) {
    await context.route((u) => SafetyNet.HOST.test(u.hostname), (route) => this.handle(route));
  }

  private async handle(route: Route) {
    const r = route.request();
    const m = r.method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.fallback();
    if (/socket\.io|\/api\/login(\?|$)/.test(r.url())) return route.fallback();
    if (/\/api\/activitylog\//.test(r.url())) return route.fulfill({ json: { success: true } });
    this.blocked.push(`${m} ${r.url().split('?')[0]}`);
    return route.abort();
  }
}

export class CommunityPage extends BasePage {
  readonly tabAiUpdate: Locator;
  readonly tabMoiNhat: Locator;
  readonly tabQuanTam: Locator;
  readonly tabPhoBien: Locator;
  readonly searchInput: Locator;
  readonly hotKeywordsSidebar: Locator;
  readonly composeBoxCollapsed: Locator;
  /** Modal CoreUI đang thực sự mở (class `.modal.show.d-block`) — mỗi bài viết trong feed có sẵn 1 modal
   * sửa bài ẩn dùng chung cấu trúc DOM, nên PHẢI scope qua modal này để tránh khớp nhầm phần tử ẩn. */
  readonly openModal: Locator;
  readonly composeModalTextarea: Locator;
  readonly composeModalSubmitButton: Locator;
  readonly firstPost: Locator;
  readonly hotKeywordsList: Locator;
  readonly profileCard: Locator;
  readonly suggestionsSidebarHeading: Locator;
  readonly suggestionRows: Locator;

  constructor(page: Page) {
    super(page);
    // Một hàng tab phẳng `CommunityTabs.vue` (từ 14/09/2026): "AI cập nhật" + 3 thẻ Thảo luận.
    this.tabAiUpdate = page.locator('.cd-main-tab', { hasText: /AI cập nhật/i });
    this.tabMoiNhat = page.locator('.cd-main-tab', { hasText: 'Mới nhất' });
    this.tabQuanTam = page.locator('.cd-main-tab', { hasText: 'Quan tâm' });
    this.tabPhoBien = page.locator('.cd-main-tab', { hasText: 'Phổ biến' });
    this.searchInput = page.getByPlaceholder('Nhập từ khóa tìm kiếm');
    // Ô "🔥 Từ khoá hot" = `TopicChips.vue` (thay topHashTagCategories.vue từ 16/09/2026), mỗi chủ đề là 1 nút `.topic-chip`.
    this.hotKeywordsSidebar = page.locator('.topic-card');
    this.hotKeywordsList = page.locator('.topic-card .topic-chip');
    this.composeBoxCollapsed = page.getByPlaceholder('Bạn có nhận định gì muốn chia sẻ?');
    this.openModal = page.locator('.modal.show.d-block');
    // Editor rich-text (Quill) — contenteditable, KHÔNG có thuộc tính placeholder chuẩn.
    this.composeModalTextarea = this.openModal.locator('.ql-editor');
    this.composeModalSubmitButton = this.openModal.getByText('Đăng bài ngay', { exact: true });
    this.firstPost = page.locator('.wrapper-item').first();
    this.profileCard = page.locator('.menu-feed-card:visible');
    // userSuggestions.vue (làm lại 14/09/2026): tiêu đề là `.sg-title` (không còn thẻ heading), mỗi người gợi ý là `.sg-row`.
    this.suggestionsSidebarHeading = page.locator('.sg-title', { hasText: /^Gợi ý$/ });
    this.suggestionRows = page.locator('.sg-row');
  }

  stockCodeInput(): Locator {
    return this.openModal.getByPlaceholder('Chọn mã chứng khoán');
  }

  hashtagInput(): Locator {
    return this.openModal.getByPlaceholder('Thêm hashtag');
  }

  /** Đăng nhập bằng phiên cache của `Prev2Session` (tự chặn ghi setting) rồi mở thẳng thẻ cần test. */
  async login(tab: 'moi-nhat' | 'quan-tam' | 'pho-bien' = 'moi-nhat', account: Prev2Account = 'paid') {
    await new Prev2Session(this.page).open({ account, path: `/cong-dong/${tab}` });
    await this.page.waitForLoadState('networkidle');
  }

  async gotoAiFeed() {
    await super.goto('/cong-dong');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoTab(tab: 'moi-nhat' | 'quan-tam' | 'pho-bien') {
    await super.goto(`/cong-dong/${tab}`);
    await this.page.waitForLoadState('networkidle');
  }

  likeButtonOf(post: Locator): Locator {
    return post.locator('.button-interact', { hasText: /^Thích$/ });
  }

  likedButtonOf(post: Locator): Locator {
    return post.locator('.button-interact', { hasText: 'Đã thích' });
  }

  commentButtonOf(post: Locator): Locator {
    return post.locator('.button-interact', { hasText: 'Bình luận' });
  }

  shareButtonOf(post: Locator): Locator {
    return post.locator('.button-interact', { hasText: 'Chia sẻ' });
  }

  moreMenuButtonOf(post: Locator): Locator {
    return post.locator('.button-more-action');
  }

  menuItemOf(post: Locator, text: string | RegExp): Locator {
    return post.locator('.item-action', { hasText: text });
  }

  followStatItem(): Locator {
    // menuFeedCard.vue (làm lại 14/09/2026): số liệu là `.mf-stat`, không còn `li`.
    return this.profileCard.locator('.mf-stat', { hasText: 'Đang theo dõi' });
  }

  async openComposeModal() {
    await this.composeBoxCollapsed.waitFor({ state: 'visible' });
    await this.composeBoxCollapsed.click();
    await this.composeModalSubmitButton.waitFor({ state: 'visible' });
  }

  get writeCommentInput(): Locator {
    return this.page.getByPlaceholder('Viết bình luận...');
  }
}
