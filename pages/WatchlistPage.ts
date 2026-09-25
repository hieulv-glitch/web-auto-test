import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class WatchlistPage extends BasePage {
  readonly watchlistSelectorToggler: Locator;
  readonly watchlistDropdownMenu: Locator;
  readonly manageWatchlistLink: Locator;
  readonly addMackInput: Locator;
  readonly signalToggle: Locator;
  readonly tableTabs: Locator;
  readonly table: Locator;
  readonly resetLayoutButton: Locator;
  readonly resizeHandle: Locator;
  /** Modal CoreUI đang thực sự mở — có thể có nhiều dialog xếp chồng (VD modal Quản lý +
   * modal Tạo/Sửa cùng lúc), nên khi cần modal TRÊN CÙNG phải dùng `.last()` ở nơi gọi. */
  readonly openModals: Locator;
  readonly manageModal: Locator;
  readonly createUpdateModal: Locator;
  readonly deleteStockConfirmModal: Locator;
  readonly deleteWholeListConfirmModal: Locator;
  readonly rightPanelTabs: Locator;
  readonly notesTabButton: Locator;
  readonly postsTabButton: Locator;
  readonly noteMackFilterLabel: Locator;
  readonly noEmptyNotesHeading: Locator;
  readonly addNoteButton: Locator;

  constructor(page: Page) {
    super(page);
    // Toggler thật của dropdown (`.form-control` bên trong CDropdown#toggler), KHÁC với menu popup
    // (class `dropdown-watchlist-menu` do `addMenuClasses` gắn vào) — 2 phần tử riêng biệt trong DOM.
    this.watchlistDropdownMenu = page.locator('.dropdown-watchlist-menu');
    this.watchlistSelectorToggler = page.locator('.header .form-control').first();
    this.manageWatchlistLink = this.watchlistDropdownMenu.locator('.manager-watchlist');
    this.addMackInput = page.getByPlaceholder('Chọn mã CK');
    // SwitchIconBase — chỉ 1 instance trên màn khi input mã đang hiện.
    this.signalToggle = page.locator('.base-icon-switch');
    this.tableTabs = page.locator('.menu-nav-tab');
    this.table = page.locator('.datatable-watchlist');
    this.resetLayoutButton = page.getByTitle('Đặt lại bố cục mặc định');
    this.resizeHandle = page.locator('.resize');
    this.openModals = page.locator('.modal.show.d-block');
    this.manageModal = page.locator('.modal.show.d-block', { hasText: 'Quản lý Watchlist' });
    // Modal Tạo/Sửa Watchlist dùng chung tiêu đề kết thúc bằng "Watchlist" như modal Quản lý —
    // phân biệt bằng nút "Lưu" (chỉ modal Tạo/Sửa mới có).
    this.createUpdateModal = page.locator('.modal.show.d-block').filter({ hasText: 'Lưu' });
    this.deleteStockConfirmModal = page.locator('.modal.show.d-block', { hasText: 'Xóa dữ liệu' });
    this.deleteWholeListConfirmModal = page.locator('.modal.show.d-block', { hasText: 'Những mã thuộc Watchlist này' });
    this.rightPanelTabs = page.locator('.tabs-menu .tab-item');
    this.notesTabButton = this.rightPanelTabs.filter({ hasText: 'Ghi chú' });
    this.postsTabButton = this.rightPanelTabs.filter({ hasText: 'Bài viết' });
    this.noteMackFilterLabel = page.getByText('Mã CK:', { exact: true });
    this.noEmptyNotesHeading = page.getByRole('heading', { name: 'Không có ghi chú nào' });
    this.addNoteButton = page.getByText('Thêm ghi chú mới', { exact: true });
  }

  async goto() {
    await super.goto('/watchlist');
    await this.page.waitForLoadState('networkidle');
  }

  tableTab(label: string): Locator {
    return this.tableTabs.getByText(label, { exact: true });
  }

  tableRow(mack: string): Locator {
    return this.table.locator('tr', { hasText: mack }).first();
  }

  deleteIconOf(mack: string): Locator {
    return this.tableRow(mack).locator('[data-title="Xóa"]');
  }

  noteIconOf(mack: string): Locator {
    return this.tableRow(mack).locator('[data-title="Xem ghi chú"]');
  }

  mackLinkOf(mack: string): Locator {
    return this.tableRow(mack).getByRole('link', { name: mack, exact: true });
  }

  async openWatchlistDropdown() {
    await this.watchlistSelectorToggler.click();
    await this.watchlistDropdownMenu.waitFor({ state: 'visible' });
  }

  watchlistOptionInDropdown(name: string): Locator {
    return this.watchlistDropdownMenu.getByText(name, { exact: true });
  }

  async openManageWatchlistModal() {
    await this.openWatchlistDropdown();
    await this.manageWatchlistLink.click();
    await this.manageModal.waitFor({ state: 'visible' });
  }

  manageModalItem(name: string): Locator {
    return this.manageModal.locator('.watchlist-item', { hasText: name });
  }

  editIconOf(watchlistName: string): Locator {
    return this.manageModalItem(watchlistName).locator('[data-title="Sửa"]');
  }

  deleteWatchlistIconOf(watchlistName: string): Locator {
    return this.manageModalItem(watchlistName).locator('[data-title="Xóa"]');
  }

  get addWatchlistButton(): Locator {
    return this.manageModal.getByRole('button', { name: 'Thêm watchlist' });
  }

  get manageModalCloseButton(): Locator {
    return this.manageModal.getByRole('button', { name: 'Close' });
  }

  get createUpdateNameInput(): Locator {
    return this.createUpdateModal.getByRole('textbox').first();
  }

  get createUpdateSaveButton(): Locator {
    return this.createUpdateModal.getByRole('button', { name: 'Lưu' });
  }

  get createUpdateCancelButton(): Locator {
    return this.createUpdateModal.getByRole('button', { name: 'Hủy' });
  }

  get createUpdateHeading(): Locator {
    return this.createUpdateModal.getByRole('heading');
  }

  get moderatorNotifyCheckbox(): Locator {
    return this.manageModal.getByRole('checkbox');
  }
}
