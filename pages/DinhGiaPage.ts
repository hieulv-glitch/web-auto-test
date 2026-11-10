import { Page, Locator, expect, Route } from '@playwright/test';
import { BasePage } from './BasePage';
import { Prev2Session, Prev2Account } from './Prev2Session';

/**
 * Màn "Định giá" (`/dinh-gia`, menu "Phân tích cơ bản" → "Định giá") — component `MarginSafety`
 * (stocks/src/views/pages/MarginSafety.vue). Công cụ định giá theo biên an toàn: cột trái là ô nhập (mã CK + các
 * thông số, ô xám là ô tính sẵn chỉ đọc), cột phải là biểu đồ giá + "KẾT QUẢ" + "THỐNG KÊ NHANH" + 2 ô vùng an toàn /
 * báo động. Tài khoản thiếu quyền (`features_disabled.dinh_gia`) chỉ thấy ảnh mờ `ProtectedView`.
 *
 * API (host `api2.kfsp.vn`, đọc source 10/11/2026):
 * - Đọc: `GET /api/stocks/margin_safety?mack` (EPS TTM, số CP, OCF/CAPEX TTM, BVPS, P/E thấp–cao),
 *   `GET /api/valuation/default-value?stockcode` (tăng trưởng, P/E tương lai), `GET /api/stocks/margin_safety/get-all`
 *   (danh sách mẫu đã lưu). Giá hiện tại + chuỗi giá đóng cửa qua socket (`getlive`, `geteodbydate`).
 * - GHI (mẫu định giá của tài khoản thật — LUÔN giả lập trong spec): `POST /api/stocks/margin_safety/store`,
 *   `PUT /api/stocks/margin_safety/update`, `DELETE /api/stocks/margin_safety/:id`.
 * - Đổi mã ở ô "Mã CK" → setting `final_mack` (chỉ khi chọn bằng Enter) — `Prev2Session` chặn.
 * Lưới an toàn: dùng `useFaSafetyNet` (pages/FaAnalysisPage.ts) — Định giá thuộc nhóm Phân tích cơ bản.
 *
 * `FakeDgApi` thay 3 API đọc + 3 API ghi bằng dữ liệu cố định; API đọc trả đúng mã được hỏi (web bỏ qua phản hồi
 * khác mã đang chọn).
 */
export type MarginData = {
  eps_ttm: number; so_luong_co_phieu: number; ocf_ttm: number; capex_ttm: number; bvps: number; tang_truong_bvps: number;
  pe_cao_nhat: number; pe_thap_nhat: number; ty_le_tang_truong_tuong_lai?: number;
};
export type DefaultValue = { pe_tuong_lai: number | null; ty_le_tang_truong_tuong_lai: number };
export type Template = { id: number; label: string; content: string };
export type Mode = 'ok' | '500' | 'slow';

export const BASE_MARGIN: MarginData = {
  eps_ttm: 4000, so_luong_co_phieu: 1000, ocf_ttm: 3000000, capex_ttm: -1000000, bvps: 20000, tang_truong_bvps: 12.5,
  pe_cao_nhat: 20.5, pe_thap_nhat: 8.25,
};
export const BASE_DEFAULT: DefaultValue = { pe_tuong_lai: 15, ty_le_tang_truong_tuong_lai: 10 };

export class FakeDgApi {
  margin: Record<string, MarginData> = {};
  defaults: Record<string, DefaultValue> = {};
  templates: Template[] = [];
  marginMode: Mode = 'ok';
  listMode: Mode = 'ok';
  slowMs = 4000;
  readonly marginCalls: string[] = [];
  readonly defaultCalls: string[] = [];
  readonly stores: Record<string, unknown>[] = [];
  readonly updates: Record<string, unknown>[] = [];
  readonly deletes: string[] = [];

  async install(page: Page) {
    await page.route(/\/api\/stocks\/margin_safety(\?|$)/, async (route) => {
      const mack = new URL(route.request().url()).searchParams.get('mack') || '';
      this.marginCalls.push(mack);
      if (this.marginMode === '500') return route.fulfill({ status: 500, json: { message: 'error' } });
      if (this.marginMode === 'slow') await new Promise((r) => setTimeout(r, this.slowMs));
      return route.fulfill({ json: { mack, ...(this.margin[mack] ?? BASE_MARGIN) } });
    });
    await page.route(/\/api\/valuation\/default-value(\?|$)/, async (route) => {
      const mack = new URL(route.request().url()).searchParams.get('stockcode') || '';
      this.defaultCalls.push(mack);
      if (this.marginMode === '500') return route.fulfill({ status: 500, json: { message: 'error' } });
      return route.fulfill({ json: { stockcode: mack, ...(this.defaults[mack] ?? BASE_DEFAULT) } });
    });
    await page.route(/\/api\/stocks\/margin_safety\/get-all(\?|$)/, async (route) => {
      if (this.listMode === '500') return route.fulfill({ status: 500, json: { message: 'error' } });
      return route.fulfill({ json: this.templates });
    });
    await page.route(/\/api\/stocks\/margin_safety\/store(\?|$)/, async (route) => this.write(route, 'store'));
    await page.route(/\/api\/stocks\/margin_safety\/update(\?|$)/, async (route) => this.write(route, 'update'));
    await page.route(/\/api\/stocks\/margin_safety\/\d+(\?|$)/, async (route) => this.write(route, 'delete'));
  }

  private async write(route: Route, kind: 'store' | 'update' | 'delete') {
    const r = route.request();
    if (kind === 'delete') {
      if (r.method() !== 'DELETE') return route.fallback();
      this.deletes.push(new URL(r.url()).pathname.split('/').pop() || '');
      return route.fulfill({ json: { success: true } });
    }
    let body: Record<string, unknown> = {};
    try { body = r.postDataJSON(); } catch { /* */ }
    delete body.token;
    if (kind === 'store') {
      this.stores.push(body);
      return route.fulfill({ json: { id: 9001, label: body.label } });
    }
    this.updates.push(body);
    return route.fulfill({ json: { id: body.id, label: body.label, content: body.content } });
  }
}

export type DgOpenOptions = { account?: Prev2Account; mock?: boolean; wait?: boolean; startPath?: string };

export class DinhGiaPage extends BasePage {
  readonly api = new FakeDgApi();
  session!: Prev2Session;

  constructor(page: Page) { super(page); }

  async open(opts: DgOpenOptions = {}) {
    const { account = 'paid', mock = true, wait = true, startPath } = opts;
    if (mock) await this.api.install(this.page);
    this.session = new Prev2Session(this.page);
    await this.session.open({ account, path: startPath ?? '/dinh-gia' });
    if (wait && !startPath) await this.waitLoaded();
  }

  /** Chờ ô nhập hiện + hộp "Đang tải dữ liệu" đóng + số liệu mặc định đã đổ vào (EPS TTM khác "0"). */
  async waitLoaded() {
    await expect(this.mackInput).toBeVisible({ timeout: 45000 });
    await expect(this.loadingModal).toBeHidden({ timeout: 30000 });
    await expect(this.input('EPS TTM (PV)')).not.toHaveValue('0', { timeout: 30000 });
  }

  /** Mã đang chọn (đọc từ ô "Mã CK"). */
  async currentMack(): Promise<string> { return (await this.mackInput.inputValue()).trim(); }

  get mackInput(): Locator { return this.page.locator('input[placeholder="Nhập mã CK"]:visible'); }
  get suggestions(): Locator { return this.page.locator('.search-stockcode_item:visible'); }
  /** Hàng "nhãn — ô nhập" của cột trái (khớp đúng nhãn). */
  row(label: string): Locator {
    return this.page.locator(`xpath=//div[contains(@class,"justify-content-between")][div[normalize-space()="${label}"]]`).first();
  }
  input(label: string): Locator { return this.row(label).locator('input'); }
  feedback(label: string): Locator { return this.row(label).locator('.invalid-feedback'); }
  get zoneSelect(): Locator { return this.page.getByRole('combobox', { name: 'Xác định Vùng An toàn theo:' }); }
  /** Ô nhập cạnh ô chọn "Xác định Vùng An toàn theo" (biên an toàn % / số năm hoàn vốn). */
  get zoneInput(): Locator { return this.zoneSelect.locator('xpath=ancestor::div[contains(@class,"justify-content-between")][1]').locator('input'); }
  get zoneFeedback(): Locator { return this.zoneSelect.locator('xpath=ancestor::div[contains(@class,"justify-content-between")][1]').locator('.invalid-feedback'); }

  get saveBtn(): Locator { return this.page.locator('.save-change-container'); }
  get resetBtn(): Locator { return this.page.locator('.button-container', { hasText: 'Khôi phục' }); }
  get openTplBtn(): Locator { return this.page.locator('.button-container', { hasText: 'Mở mẫu' }); }
  get selectedTpl(): Locator { return this.page.getByText(/^Đang chọn mẫu:/); }
  get deselectTpl(): Locator { return this.selectedTpl.locator('xpath=following-sibling::div[1]'); }

  /** Giá trị của 1 dòng ở khối "KẾT QUẢ" / "THỐNG KÊ NHANH" (nhãn khớp từ đầu). */
  result(label: string | RegExp): Locator {
    return this.page.locator('.card-body .d-flex.justify-content-between').filter({ has: this.page.locator('div.font-weight-bold', { hasText: label }) }).locator('div.font-weight-bold').nth(1);
  }
  resultLabel(re: RegExp): Locator { return this.page.locator('div.font-weight-bold', { hasText: re }); }
  get greenZone(): Locator { return this.page.locator('p.h5', { hasText: 'Vùng an toàn (xanh)' }).locator('xpath=following-sibling::p[1]'); }
  get redZone(): Locator { return this.page.locator('p.h5', { hasText: 'Vùng báo động (đỏ)' }).locator('xpath=following-sibling::p[1]'); }
  get chart(): Locator { return this.page.locator('.card-body canvas').first(); }

  get loadingModal(): Locator { return this.page.locator('.modal.show').filter({ hasText: 'Đang tải dữ liệu, vui lòng chờ' }); }
  get listModal(): Locator { return this.page.locator('.modal.show').filter({ hasText: 'Danh sách đã lưu' }); }
  get addModal(): Locator { return this.page.locator('.modal.show').filter({ hasText: 'Thêm mẫu mới' }); }
  get deleteModal(): Locator { return this.page.locator('.modal.show').filter({ hasText: 'Bạn có muốn xóa không?' }); }
  tplRow(label: string): Locator { return this.listModal.locator('tbody tr').filter({ hasText: label }); }

  get toastError(): Locator { return this.page.locator('.Vue-Toastification__toast--error'); }
  get blurred(): Locator { return this.page.locator('.blurred-image'); }

  /** Gõ mã rồi bấm đúng gợi ý (chờ danh sách mã của app tải xong). */
  async chooseMack(code: string) {
    await this.mackInput.fill('');
    await this.mackInput.pressSequentially(code, { delay: 60 });
    const item = this.suggestions.filter({ has: this.page.locator('.search-stockcode_item--code', { hasText: new RegExp(`^\\s*${code}\\s*$`) }) }).first();
    await item.waitFor({ state: 'visible', timeout: 20000 });
    await item.click();
  }
}

/** Định dạng số như web (`formatMoney` = `toLocaleString("en", {min, max})`). */
export function money(n: number, min = 0, max = 2): string {
  return n.toLocaleString('en', { minimumFractionDigits: min, maximumFractionDigits: max });
}

/** Tính lại đúng công thức của MarginSafety.vue để so với số web hiển thị. */
export function calc(i: { eps: number; g: number; years: number; pe: number; r: number; mos: number; fcfps: number; price: number; yFcf?: number; yEps?: number }) {
  const epsFuture = i.eps * Math.pow(1 + i.g / 100, i.years);
  const fvFuture = epsFuture * i.pe;
  const pv = fvFuture / Math.pow(1 + i.r / 100, i.years);
  const safe = pv * (1 - i.mos / 100);
  const payback = (start: number) => {
    let nam = 0; let v = start; let sum = start;
    if (!(i.g > 0)) return 0;
    for (;;) { if (sum > i.price) return nam; if (nam > 100) return 0; nam++; v = v * (1 + i.g / 100); sum += v; }
  };
  const atYear = (start: number, target: number) => {
    let nam = 0; let v = start; let sum = 0;
    if (!(i.g > 0)) return 0;
    for (;;) { if (nam === target) return sum; if (nam > 100) return 0; nam++; v = v * (1 + i.g / 100); sum += v; }
  };
  return {
    epsFuture, fvFuture, pv, safe, mosYield: safe !== 0 ? (i.eps / safe) * 100 : 0, red: pv * 1.2,
    paybackFcf: payback(i.fcfps), paybackEps: payback(i.eps),
    atYearFcf: atYear(i.fcfps, i.yFcf ?? 8), atYearEps: atYear(i.eps, i.yEps ?? 8),
  };
}
