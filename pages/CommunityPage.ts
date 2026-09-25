import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CommunityPage extends BasePage {
  readonly tabAiUpdate: Locator;
  readonly tabMoiNhat: Locator;
  readonly tabQuanTam: Locator;
  readonly tabPhoBien: Locator;
  readonly loginBanner: Locator;
  readonly loginBannerButton: Locator;
  readonly blockedModalText: Locator;
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

  constructor(page: Page) {
    super(page);
    this.tabAiUpdate = page.locator('.button-type-feed', { hasText: 'AI Cập Nhật' });
    this.tabMoiNhat = page.locator('.button-type-feed', { hasText: 'Mới nhất' });
    this.tabQuanTam = page.locator('.button-type-feed', { hasText: 'Quan tâm' });
    this.tabPhoBien = page.locator('.button-type-feed', { hasText: 'Phổ biến' });
    this.loginBanner = page.getByText('Bạn cần đăng nhập để tham gia thảo luận');
    this.loginBannerButton = page.locator('.btn-login');
    this.blockedModalText = page.getByText('Bạn cần đăng nhập để sử dụng chức năng này');
    this.searchInput = page.getByPlaceholder('Nhập từ khóa tìm kiếm');
    this.hotKeywordsSidebar = page.locator('.top-hashtag-categories');
    this.hotKeywordsList = page.locator('.top-hashtag-categories .item-categories');
    this.composeBoxCollapsed = page.getByPlaceholder('Bạn có nhận định gì muốn chia sẻ?');
    this.openModal = page.locator('.modal.show.d-block');
    // Editor rich-text (Quill) — contenteditable, KHÔNG có thuộc tính placeholder chuẩn.
    this.composeModalTextarea = this.openModal.locator('.ql-editor');
    this.composeModalSubmitButton = this.openModal.getByText('Đăng bài ngay', { exact: true });
    this.firstPost = page.locator('.wrapper-item').first();
    this.profileCard = page.locator('.menu-feed-card:visible');
    this.suggestionsSidebarHeading = page.getByRole('heading', { name: 'Gợi ý', exact: true });
  }

  stockCodeInput(): Locator {
    return this.openModal.getByPlaceholder('Chọn mã chứng khoán');
  }

  hashtagInput(): Locator {
    return this.openModal.getByPlaceholder('Thêm hashtag');
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
    return this.profileCard.locator('li', { hasText: 'Đang theo dõi' });
  }

  /** Nút Theo dõi/Đang theo dõi trong list Follower/Following (ItemUser.vue) — dùng để UNFOLLOW. */
  followButtonInList(userName: string): Locator {
    return this.page.locator('.button-interact-name', { hasText: userName })
      .locator('xpath=following-sibling::div[contains(@class,"button-interact")]').first();
  }

  /** Nút Theo dõi trong sidebar "Gợi ý" (userSuggestions.vue) — danh sách này XOAY VÒNG NGẪU NHIÊN, không đảm bảo
   * chứa đúng người cần tìm — chỉ dùng khi biết chắc người đó đang hiển thị, KHÔNG dùng để phục hồi trạng thái. */
  sidebarSuggestionFollowButton(userName: string): Locator {
    return this.page.locator('.user-item', { hasText: userName }).locator('.button-interact').first();
  }

  /** Cách đáng tin cậy để follow lại 1 tác giả cụ thể: bấm vào tên họ trên 1 bài viết có thật của họ trong
   * feed (nếu đang hiển thị) để vào trang cá nhân, rồi bấm nút Theo dõi ở đó — không phụ thuộc sidebar gợi ý
   * ngẫu nhiên. Trả về true nếu follow thành công. */
  async followAuthorViaProfile(authorName: string): Promise<boolean> {
    const authorLink = this.page.locator('.font-name', { hasText: authorName }).first();
    if (!(await authorLink.count())) return false;
    await authorLink.click();
    await this.page.waitForLoadState('networkidle');
    const followBtn = this.page.locator('.button-type-feed', { hasText: 'Theo dõi' }).first();
    const text = (await followBtn.textContent().catch(() => null))?.trim();
    if (text === 'Theo dõi') {
      await followBtn.click();
      await this.page.waitForTimeout(600);
      return true;
    }
    return text === 'Đang theo dõi'; // đã follow sẵn từ trước, coi như thành công
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
