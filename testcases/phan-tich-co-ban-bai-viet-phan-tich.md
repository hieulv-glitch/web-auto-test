# Màn hình: Phân tích cơ bản — Tab "Bài viết & Phân tích"

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=tin-tuc` (LƯU Ý: giá trị `tab` query cho tab này là `"tin-tuc"`,
  KHÔNG phải `"bai-viet-phan-tich"` — xem `option_tab` trong
  [faAnalysis/index.vue](../../stocks/src/views/faAnalysis/index.vue): `{ label: "Bài viết & Phân tích", value:
  "news_analysis", tab: "tin-tuc" }`).
- **Component:** [NewsAndAnalysis/index.vue](../../stocks/src/views/faAnalysis/NewsAndAnalysis/index.vue)
  (`name: "NewsTab"`) — 1 `<CCard>` gồm bộ lọc ngày (trên cùng) + `<CRow>` 2 cột:
  - Cột trái (`lg="6"`): [NewsEvent/index.vue](../../stocks/src/views/faAnalysis/NewsAndAnalysis/NewsEvent/index.vue)
    → chỉ render [News.vue](../../stocks/src/views/faAnalysis/NewsAndAnalysis/NewsEvent/News.vue) ("Bài viết").
  - Cột phải (`lg="6"`, xếp dọc):
    [ReportAnalysis.vue](../../stocks/src/views/faAnalysis/NewsAndAnalysis/ReportAnalysis.vue) ("Báo cáo phân
    tích") + [ReportRaw.vue](../../stocks/src/views/faAnalysis/NewsAndAnalysis/ReportRaw.vue) ("BCTC gốc", có 4
    sub-tab riêng bên trong).
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Google Sheet, tab "Phân Tích FA(Cổ Phiếu)", dòng TC ID 285-319 ("Tab Bài viết &
  Phân tích"). **⚠️ KHÁC BIỆT KIẾN TRÚC HOÀN TOÀN so với app** — đã xác nhận qua đọc source + đo DOM thật (xem
  mục "Phát hiện đáng chú ý" #0 bên dưới): app có 3 SUB-TAB riêng biệt (Bài viết/BCTC gốc/Phân tích, chỉ 1 tab
  active tại 1 thời điểm); web hiển thị ĐỒNG THỜI CẢ 3 loại nội dung cùng lúc trên 1 màn hình (không phải
  sub-tab). Sheet app chỉ dùng tham khảo văn phong, không map được 1-1 — độ phủ testcase dưới đây do tự kiểm kê
  source code (`NewsAndAnalysis/index.vue`, `ReportAnalysis.vue`, `ReportRaw.vue`, `NewsEvent/index.vue`,
  `NewsEvent/News.vue`, `NewsEvent/Events.vue` đầy đủ) + DOM thật + nhiều script Playwright tạm thời đo
  network/DOM quyết định.
- **Quy ước trạng thái:** giống các tab khác — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng web) · ⚠️ Cần
  xác nhận thêm.
- **An toàn dữ liệu:** Tab này KHÔNG có API mutate nào — `GET /api/stocks/news/get-list-news`,
  `GET /api/stocks/news/get-count-page-news`, `GET /api/stocks/news/get-content-news`,
  `GET /api/stocks/report_analysis/get-report`, `GET /api/stocks/document/get-document` đều chỉ ĐỌC — an toàn
  gọi API thật cho mọi testcase. Click icon "File" mở file PDF thật qua `window.open()` → Chromium xử lý như
  **download** (không phải điều hướng trang) — testcase chỉ bắt sự kiện `download` để xác nhận đúng URL `.pdf`,
  **KHÔNG gọi `download.saveAs()`** nên không có file nào thực sự được lưu xuống máy chạy test.
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Test đổi mã CK trong file này reset lại đúng `VNM` sau khi xong.
- **Gate cấp shell:** Tab này CÓ gate cấp shell (`featureName` trả `"fa_tai_lieu"`) — ĐÃ XÁC NHẬN tài khoản Free
  hiện tại (`FREE_USER_EMAIL`) bị khoá thật ở tab này (xem TC_PTCB_17 trong `phan-tich-co-ban.md` — đây là tab
  DUY NHẤT trong 3 tab "Biểu đồ"/"So sánh"/"Bài viết & Phân tích" thực sự bị khoá với tài khoản Free này).
  TC_PTCB_BVPT_20 bên dưới xác nhận lại đúng hành vi này cho riêng tab con này.

## Phát hiện đáng chú ý — đọc trước khi dùng lại giả định ban đầu (đề bài gốc)

**#0. [ĐÍNH CHÍNH] Web KHÔNG có 3 sub-tab như app — hiển thị đồng thời cả 3 loại nội dung trên 1 màn hình, không
phải điều hướng qua lại.** App (Sheet TC 285-289) có 3 sub-tab riêng "Bài viết"/"BCTC gốc"/"Phân tích", click đổi
tab mới đổi nội dung hiển thị. Web đo DOM thật (`.dom-inspect/ptcb-bvpt-initial.png`) xác nhận: **KHÔNG có cơ chế
sub-tab nào ở cấp `NewsAndAnalysis/index.vue`** — layout cố định 2 cột, cột trái luôn hiện "Bài viết", cột phải
luôn hiện ĐỒNG THỜI "Báo cáo phân tích" (khớp tên sub-tab "Phân tích" của app) VÀ "BCTC gốc" (khớp tên sub-tab
"BCTC gốc" của app) xếp chồng dọc — người dùng cuộn để xem hết, không cần click chuyển đổi. 2 file component
`ReportAnalysis.vue`/`ReportRaw.vue` map đúng 2/3 sub-tab app như dự đoán trong đề bài, nhưng KHÔNG map bằng cơ
chế tab mà bằng vị trí cố định trên layout.

**#1. [PHÁT HIỆN] Sub-tab "Sự kiện" tồn tại đầy đủ trong code (`NewsEvent/Events.vue`, component hoàn chỉnh có
API/list/modal/pagination riêng) nhưng KHÔNG THỂ TRUY CẬP được trên UI — dead code.**
[NewsEvent/index.vue](../../stocks/src/views/faAnalysis/NewsAndAnalysis/NewsEvent/index.vue) có sẵn
`data.option_tab = [{label: "Bài viết", value: "news"}, {label: "Sự kiện", value: "events"}]` VÀ import
`Events` component, nhưng **template KHÔNG loop qua `option_tab`** — chỉ render tĩnh 1 `<li>` duy nhất
`"Bài viết"` (không có `@click`, không có class active động), và `<CCardBody>` chỉ render CỨNG `<News>`, không
bao giờ render `<Events>`. Xác nhận qua DOM thật: đếm text "Sự kiện" trong vùng tab này = 0 (2 lần xuất hiện đo
được trên toàn trang đều thuộc `TheHeaderDropdownNotify.vue` — dropdown thông báo global ở header, hoàn toàn
KHÔNG liên quan tab này, cùng pattern "phần tử ẩn toàn cục" đã ghi chú ở đầu `pages/FaAnalysisPage.ts`). Không
có cách nào (click/URL) để người dùng xem được nội dung "Sự kiện" trên web dù backend/component đã sẵn sàng.

**#2. [PHÁT HIỆN] "BCTC gốc" dùng 4 TAB riêng biệt trên web, KHÔNG PHẢI 1 dropdown filter như app.** App (Sheet
TC 302-305) mô tả 1 dropdown "Chọn tất cả ▼" filter loại BCTC (Tất cả/BCTC năm/BCTC quý/BCTC bán niên/Soát
xét/Kiểm toán). Web (`ReportRaw.vue`) dùng 4 tab con độc lập, MỖI tab gọi lại API riêng với `type` khác nhau (xem
TC_PTCB_BVPT_15): "BCTC gốc" (`type=1`, mặc định active) · "Bản cáo bạch & BCTN" (`type=3`) · "Nghị quyết"
(`type=4`) · "Báo cáo quản trị" (`type=5`) — xác nhận qua đo network thật (đúng 100% tham số `type` khớp tab
click).

**#3. [PHÁT HIỆN] Cơ chế lọc theo ngày KHÁC NHAU giữa 3 khu vực — chỉ "Bài viết" gọi lại API, "Báo cáo phân
tích"/"BCTC gốc" lọc client-side trên dữ liệu đã tải sẵn.** Xác nhận qua đo network thật (chọn khoảng ngày tương
lai không có dữ liệu, bấm "Tìm kiếm"): CHỈ `GET .../news/get-list-news` được gọi LẠI với đúng
`from_date`/`to_date` mới (server-side filter, `News.vue` có `watch: from_date/to_date` gọi lại API). "Báo cáo
phân tích"/"BCTC gốc" KHÔNG gọi lại API nào — chỉ filter lại mảng đã có sẵn trong bộ nhớ bằng computed
(`list_document_filtered`/`list_document_computed`, so sánh `item.date`/`item.year` với khoảng ngày). Vì
`ReportRaw` filter theo THEO NĂM (`item.year >= from.getFullYear() && item.year <= to.getFullYear()`, không phải
theo ngày chính xác như 2 khu vực còn lại) nên độ chính xác lọc THEO NGÀY của "BCTC gốc" thô hơn hẳn 2 khu vực
kia — 1 báo cáo có `year` nằm trong khoảng năm được chọn vẫn hiện dù ngày cụ thể nằm ngoài khoảng, miễn năm khớp.

**#4. [PHÁT HIỆN] "BCTC gốc" hiển thị TRỐNG HOÀN TOÀN không có bất kỳ thông báo nào khi không có dữ liệu — khác
"Bài viết"/"Báo cáo phân tích" đều có text "Không có dữ liệu".** `ReportRaw.vue` template
`#no-items-view><p class="text-center h5"></p>` — đoạn `<p>` HOÀN TOÀN RỖNG (không có text bên trong), trong khi
`News.vue` có `<div>Không có dữ liệu</div>` và `ReportAnalysis.vue` có
`<p class="text-center h5 mb-0">Không có dữ liệu</p>`. Xác nhận qua automation (mock/filter ra 0 kết quả): 2 khu
vực đầu hiện đúng text "Không có dữ liệu", khu vực "BCTC gốc" chỉ hiện 1 dòng bảng trống hoàn toàn không chữ —
không có gợi ý nào cho người dùng biết vì sao trống (lỗi mạng hay thực sự không có dữ liệu).

**#5. [PHÁT HIỆN] Cả 3 khu vực (Bài viết/Báo cáo phân tích/BCTC gốc) KHÔNG có bất kỳ UI loading nào (spinner/che
màn) — khác hẳn các tab "Biểu đồ"/"4M & CANSLIM" đã sinh trước đó.** Đọc kỹ `News.vue`/`ReportAnalysis.vue`/
`ReportRaw.vue`: cả 3 đều có biến `is_loading` trong `data()` nhưng KHÔNG ĐƯỢC DÙNG trong `<template>` (không có
`CElementCover`/`CSpinner`/`v-if="is_loading"` nào) — biến này chỉ tồn tại như 1 flag nội bộ (riêng `News.vue`
dùng để chặn gọi API chồng lấn: `if (this.is_loading) return;` ở đầu `getListNews()`). Người dùng KHÔNG có phản
hồi trực quan nào trong lúc chờ API — list chỉ đột ngột trống rồi đầy lại (do `list_news = []`/`list_document =
[]` reset ngay khi bắt đầu fetch).

## Nhóm: Tổng quan tab

# [TC_PTCB_BVPT_01] Overview tab — 3 khu vực hiển thị đồng thời (không phải sub-tab)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 285, 286 (Sheet) — chỉ tham khảo văn phong, xem đính chính #0 ở trên về khác biệt kiến
  trúc.
- **Khác biệt so với app:** App có 3 sub-tab điều hướng (chỉ 1 hiện tại 1 thời điểm). Web hiển thị CỐ ĐỊNH,
  ĐỒNG THỜI cả 3 khu vực trên 1 màn hình: bộ lọc ngày (trên cùng) → cột trái "Bài viết" (list tin tức) → cột
  phải xếp dọc "Báo cáo phân tích" (bảng) + "BCTC gốc" (bảng, có 4 sub-tab riêng bên trong).

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=tin-tuc`.

## Kết quả mong đợi
- [ ] Hiển thị đủ: 2 ô lọc ngày "Từ ngày"/"Đến ngày" + nút "Tìm kiếm" ở trên cùng.
- [ ] Cột trái: card "Bài viết" với list tin tức (title + ngày giờ).
- [ ] Cột phải: card "Báo cáo phân tích" (bảng Ngày/Nguồn/Tên báo cáo/File) NGAY TRÊN card "BCTC gốc" (bảng
      Mã CK/Tên tài liệu/File, có 4 sub-tab con).
- [ ] Cả 3 khu vực đều có dữ liệu hiển thị đồng thời (không cần thao tác chuyển tab nào).

---

# [TC_PTCB_BVPT_02] Sub-tab "Sự kiện" không tồn tại trên UI dù component đã có sẵn đầy đủ chức năng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phân tích đầy đủ ở mục #1 đầu tài liệu. `NewsEvent/index.vue` có sẵn
  `option_tab` chứa cả "Bài viết"/"Sự kiện" và import component `Events` đầy đủ chức năng, nhưng template chỉ
  render TĨNH 1 `<li>` "Bài viết" (không loop qua `option_tab`, không có `@click`) — "Sự kiện" hoàn toàn KHÔNG
  hiển thị, không có cách nào truy cập qua UI.

## Các bước thực hiện
1. Vào tab "Bài viết & Phân tích".
2. Đếm số lượng text "Sự kiện" xuất hiện TRONG khu vực card "Bài viết" (cột trái).

## Kết quả mong đợi
- [ ] Card bên trái CHỈ có đúng 1 tab tĩnh "Bài viết" (không active/inactive styling động, không click được để
      đổi nội dung).
- [ ] KHÔNG có text "Sự kiện" nào xuất hiện trong khu vực card "Bài viết".

---

## Nhóm: Bộ lọc ngày (Từ ngày/Đến ngày/Tìm kiếm)

# [TC_PTCB_BVPT_03] Hiển thị đúng 2 ô lọc ngày, mặc định = hôm nay, CHƯA áp dụng lọc cho tới khi bấm "Tìm kiếm"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `from_date`/`to_date` (giá trị hiển thị trong input) mặc định = ngày hiện tại, nhưng
  `from_date_lazy`/`to_date_lazy` (giá trị THẬT truyền xuống 3 component con để lọc) khởi tạo RỖNG (`""`) — cả 3
  component con chỉ lọc khi `from_date != "" && to_date != "" && from_date != to_date`, nên mặc định KHÔNG có
  lọc nào được áp dụng dù input hiển thị sẵn ngày hôm nay.

## Các bước thực hiện
1. Vào tab "Bài viết & Phân tích" lần đầu (chưa bấm "Tìm kiếm").

## Kết quả mong đợi
- [ ] Input "Từ ngày"/"Đến ngày" hiển thị đúng ngày hiện tại (định dạng `YYYY-MM-DD` của `<input type="date">`).
- [ ] List "Bài viết"/"Báo cáo phân tích"/"BCTC gốc" hiển thị ĐẦY ĐỦ dữ liệu (nhiều ngày khác nhau), KHÔNG bị
      giới hạn chỉ còn dữ liệu của riêng "hôm nay".

---

# [TC_PTCB_BVPT_04] Bấm "Tìm kiếm" với khoảng ngày tương lai (không có dữ liệu) — 3 khu vực phản hồi khác nhau

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (đo network + DOM thật): Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phân tích đầy đủ ở mục #3/#4 đầu tài liệu. Chỉ "Bài viết" gọi LẠI API
  `get-list-news` với đúng `from_date`/`to_date` mới (server-side). "Báo cáo phân tích"/"BCTC gốc" lọc
  client-side, KHÔNG gọi lại API nào. Khi rỗng: "Bài viết" + "Báo cáo phân tích" hiện text "Không có dữ liệu";
  "BCTC gốc" hiện 1 dòng bảng HOÀN TOÀN TRỐNG, không có thông báo nào.

## Các bước thực hiện
1. Đổi "Từ ngày" = "2099-01-01", "Đến ngày" = "2099-01-02" (khoảng tương lai chắc chắn không có dữ liệu).
2. Bấm nút "Tìm kiếm", theo dõi network + DOM.

## Kết quả mong đợi
- [ ] Request `GET .../news/get-list-news` được gửi lại với đúng `from_date=2099-01-01&to_date=2099-01-02`.
- [ ] Card "Bài viết" hiện text "Không có dữ liệu".
- [ ] Card "Báo cáo phân tích" hiện text "Không có dữ liệu" (bảng lọc còn 0 dòng dữ liệu thật).
- [ ] Card "BCTC gốc" (sub-tab đang active) hiện bảng KHÔNG có dòng dữ liệu nào, và KHÔNG có text thông báo nào
      (khác 2 khu vực còn lại).

---

## Nhóm: Khu vực "Bài viết" (News.vue)

# [TC_PTCB_BVPT_05] Hiển thị đúng cấu trúc list bài viết

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 296, 297 (Sheet)
- **Khác biệt so với app:** App có ảnh thumbnail bên trái mỗi card. Web (`ItemNews.vue`) CHỈ hiển thị text (tiêu
  đề + ngày giờ dạng `DD/MM/YYYY HH:mm`), KHÔNG có ảnh thumbnail nào trong list (dù API trả về field `image`,
  component không render nó ở đây — chỉ dùng ở nơi khác trong code).

## Các bước thực hiện
1. Quan sát card "Bài viết".

## Kết quả mong đợi
- [ ] Mỗi item hiện: tiêu đề bài viết (đậm, có thể nhiều dòng) + ngày giờ định dạng `DD/MM/YYYY HH:mm`.
- [ ] Badge "Mới" (nếu có) chỉ xuất hiện ở các bài đăng trong vòng < 3 ngày gần nhất — verify động theo dữ liệu
      thật lúc chạy test (không hard-code).

---

# [TC_PTCB_BVPT_06] Click vào 1 bài viết mở modal "Chi tiết bài viết" hiển thị đủ nội dung

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 299 (Sheet) — khác biệt: app chuyển MÀN HÌNH chi tiết riêng, web mở MODAL cùng trang
  (`isShowModal = true` + gọi `GET .../news/get-content-news`).
- **Ghi chú:** Modal có class `modal-hide-header-footer` nhưng thực tế đo DOM thật vẫn hiện ĐẦY ĐỦ header (tiêu
  đề "Chi tiết bài viết" + nút đóng "×") — class này KHÔNG ẩn header ở component này (khác 1 số modal
  "Chi tiết sự kiện" dùng chung tên class ở nơi khác trong code, có CSS scoped riêng ẩn phần footer).

## Các bước thực hiện
1. Click vào 1 bài viết bất kỳ trong list "Bài viết".

## Kết quả mong đợi
- [ ] Modal "Chi tiết bài viết" mở ra, có nút đóng "×" ở góc phải header.
- [ ] Nội dung bài viết (`v-html`) render đầy đủ, không rỗng.

---

# [TC_PTCB_BVPT_07] Đóng modal "Chi tiết bài viết" bằng nút "×"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mở modal "Chi tiết bài viết" (click 1 bài viết).
2. Click nút "×".

## Kết quả mong đợi
- [ ] Modal đóng lại hoàn toàn.

---

# [TC_PTCB_BVPT_08] Phân trang list "Bài viết"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `CPagination` gọi lại `GET .../news/get-list-news` với `page` mới qua `watch: current_page`.

## Các bước thực hiện
1. Card "Bài viết" có nhiều hơn 1 trang (quan sát số trang ở thanh phân trang).
2. Click trang "2".

## Kết quả mong đợi
- [ ] Request `GET .../news/get-list-news` được gửi lại với `page=2`.
- [ ] List hiển thị bộ bài viết khác trang 1 (không trùng item đầu tiên).

---

## Nhóm: Khu vực "Báo cáo phân tích" (ReportAnalysis.vue)

# [TC_PTCB_BVPT_09] Hiển thị đúng cấu trúc bảng Báo cáo phân tích

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 315 (Sheet, sub-tab "Phân tích")

## Các bước thực hiện
1. Quan sát bảng "Báo cáo phân tích".

## Kết quả mong đợi
- [ ] Bảng có đủ 4 cột: "Ngày" (định dạng `DD-MM-YYYY`), "Nguồn", "Tên báo cáo", "File" (icon).

---

# [TC_PTCB_BVPT_10] Click icon "File" tải file PDF báo cáo phân tích thật

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (bắt sự kiện `download`, KHÔNG lưu file): Pass**
- **Ghi chú:** `goto_link(link)` gọi `window.open(link, "_blank")` — Chromium xử lý URL PDF trực tiếp như
  **download** (không phải điều hướng trang mới, `page`/`popup` event trả về URL rỗng) — phải bắt sự kiện
  `download` của Playwright để verify đúng, không dùng `waitForEvent('popup')`.

## Các bước thực hiện
1. Click icon "File" ở dòng đầu tiên bảng "Báo cáo phân tích", bắt sự kiện `download`.

## Kết quả mong đợi
- [ ] Sự kiện `download` phát sinh với URL chứa `.pdf` (có thể kèm query string, VD `?ver=<hash>`).

---

# [TC_PTCB_BVPT_11] Phân trang bảng "Báo cáo phân tích"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Phân trang CLIENT-SIDE (`CDataTable :items-per-page="15"`, toàn bộ dữ liệu đã tải sẵn 1 lần qua
  `getListDocument()`) — click trang khác KHÔNG gọi lại API.

## Các bước thực hiện
1. Bảng "Báo cáo phân tích" có nhiều hơn 1 trang.
2. Click trang "2".

## Kết quả mong đợi
- [ ] Dữ liệu hiển thị đổi sang bộ dòng khác (không trùng trang 1), KHÔNG có request API mới nào được gửi.

---

## Nhóm: Khu vực "BCTC gốc" (ReportRaw.vue, 4 sub-tab)

# [TC_PTCB_BVPT_12] Hiển thị đúng 4 sub-tab, "BCTC gốc" active mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Khác biệt so với app:** xem đính chính #2 đầu tài liệu — app dùng 1 dropdown filter loại BCTC, web dùng
  4 TAB độc lập: "BCTC gốc" (active mặc định), "Bản cáo bạch & BCTN", "Nghị quyết", "Báo cáo quản trị".

## Các bước thực hiện
1. Quan sát khu vực "BCTC gốc" (dưới "Báo cáo phân tích").

## Kết quả mong đợi
- [ ] Hiện đủ 4 tab: "BCTC gốc", "Bản cáo bạch & BCTN", "Nghị quyết", "Báo cáo quản trị".
- [ ] Tab "BCTC gốc" active mặc định (có style active), bảng hiện dữ liệu tương ứng.
- [ ] Bảng có đủ 3 cột: "Mã CK", "Tên tài liệu", "File" (icon).

---

# [TC_PTCB_BVPT_13] Click từng sub-tab gọi đúng API với tham số `type` tương ứng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (đo network thật): Pass**
- **Kết quả đo được:** Click lần lượt 4 tab, mỗi lần request `GET .../document/get-document` được gửi với đúng
  `type` khớp tab: "BCTC gốc" → `type=1`, "Bản cáo bạch & BCTN" → `type=3`, "Nghị quyết" → `type=4`,
  "Báo cáo quản trị" → `type=5` (xác nhận đúng 100%, không có `type=2` — nhiều khả năng do backend không cấp
  loại tài liệu này, không phải lỗi test).

## Các bước thực hiện
1. Click lần lượt 4 sub-tab: "Bản cáo bạch & BCTN" → "Nghị quyết" → "Báo cáo quản trị" → "BCTC gốc", theo dõi
   network sau mỗi lần click.

## Kết quả mong đợi
- [ ] Mỗi lần click, request `GET .../document/get-document` gửi đúng `type` tương ứng ở trên.
- [ ] Bảng cập nhật lại dữ liệu theo đúng sub-tab đang active.

---

# [TC_PTCB_BVPT_14] Click icon "File" tải file PDF BCTC thật

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (bắt sự kiện `download`, KHÔNG lưu file): Pass**
- **Ghi chú:** Cùng cơ chế `goto_link()` như TC_PTCB_BVPT_10.

## Các bước thực hiện
1. Click icon "File" ở dòng đầu tiên bảng "BCTC gốc" (sub-tab "BCTC gốc" mặc định), bắt sự kiện `download`.

## Kết quả mong đợi
- [ ] Sự kiện `download` phát sinh với URL chứa `.pdf` (có thể kèm query string, VD `?ver=<hash>`).

---

# [TC_PTCB_BVPT_15] Phân trang bảng "BCTC gốc"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Cùng cơ chế phân trang client-side như "Báo cáo phân tích" (TC_PTCB_BVPT_11).

## Các bước thực hiện
1. Bảng "BCTC gốc" có nhiều hơn 1 trang.
2. Click trang "2".

## Kết quả mong đợi
- [ ] Dữ liệu hiển thị đổi sang bộ dòng khác, KHÔNG có request API mới nào được gửi.

---

## Nhóm: Đổi mã CK / Loading / Lỗi mạng

# [TC_PTCB_BVPT_16] Đổi mã CK qua ô tìm kiếm tự động tải lại cả 3 khu vực theo mã mới

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Cả 3 component con đều có `watch: "$store.state.mack"` gọi lại API tương ứng
  (`News.getListNews()`/`ReportAnalysis.getListDocument()`/`ReportRaw.mackChange()`).

## Các bước thực hiện
1. Đang ở tab "Bài viết & Phân tích" với mã VNM.
2. Gõ và chọn mã khác (HPG) qua ô tìm kiếm "Mã CK".

## Kết quả mong đợi
- [ ] Cả 3 request (`get-list-news`, `get-report`, `get-document`) được gửi lại với `mack=HPG`.

---

# [TC_PTCB_BVPT_17] Không có UI loading (spinner/che màn) ở cả 3 khu vực khi tải chậm

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phân tích đầy đủ ở mục #5 đầu tài liệu — biến `is_loading` tồn tại nhưng
  KHÔNG được dùng trong template của cả 3 component, khác hẳn tab "Biểu đồ"/"4M & CANSLIM" (có `CElementCover` +
  `CSpinner` rõ ràng).

## Các bước thực hiện
1. Mock cả 3 API (`get-list-news`, `get-report`, `get-document`) delay 3 giây.
2. Vào tab "Bài viết & Phân tích", quan sát ngay sau khi vào (trước khi API resolve).

## Kết quả mong đợi
- [ ] KHÔNG có spinner/`CElementCover` nào hiển thị ở cả 3 khu vực trong lúc chờ — chỉ đơn giản là list/bảng
      rỗng cho tới khi dữ liệu về.

---

# [TC_PTCB_BVPT_18] Lỗi mạng cả 3 API không crash, tự về trạng thái rỗng đúng như thiết kế mỗi khu vực

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Cả 3 `.catch()` chỉ `console.error(err)` + reset mảng dữ liệu về rỗng, không toast lỗi nào — cùng
  pattern "nuốt lỗi âm thầm" đã ghi nhận ở tab So Sánh/4M & CANSLIM.

## Các bước thực hiện
1. Chặn cả 3 API (`get-list-news`, `get-count-page-news`, `get-report`, `get-document`) bằng `route.abort()`.
2. Vào tab "Bài viết & Phân tích".

## Kết quả mong đợi
- [ ] Không có lỗi JS console (`pageerror`) nào phát sinh.
- [ ] Card "Bài viết" + "Báo cáo phân tích" hiện text "Không có dữ liệu".
- [ ] Card "BCTC gốc" hiện bảng trống hoàn toàn, không có text thông báo nào (xem phát hiện #4).

---

## Nhóm: Giới hạn theo gói hội viên (Free) — gate cấp shell

# [TC_PTCB_BVPT_19] Tài khoản Free: hiện `ProtectedView` che toàn bộ tab (xác nhận lại TC_PTCB_17)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Gate này nằm ở CẤP SHELL (`index.vue`, `featureName` trả `"fa_tai_lieu"`), KHÔNG PHẢI gate riêng
  của `NewsAndAnalysis` — đã xác nhận `fa_tai_lieu` CÓ trong `features_disabled` của tài khoản Free hiện tại
  (xem TC_PTCB_17 trong `phan-tich-co-ban.md`). Testcase này xác nhận lại đúng hành vi riêng cho tab con này
  (không suy đoán lại từ đầu).

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`).
2. Click tab "Bài viết & Phân tích".

## Kết quả mong đợi
- [ ] Hiện đúng 1 `ProtectedView` (màn mờ "Bạn cần nâng cấp gói hội viên..."), KHÔNG hiển thị bộ lọc ngày/list
      "Bài viết"/bảng "Báo cáo phân tích"/"BCTC gốc" nào.

---

## Nhóm: Dark mode

# [TC_PTCB_BVPT_20] Chuyển dark mode không crash, nội dung vẫn hiển thị đầy đủ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Đang ở tab "Bài viết & Phân tích" (light mode mặc định), toggle sang dark mode.

## Kết quả mong đợi
- [ ] Giao diện chuyển nền tối, không có lỗi JS console.
- [ ] Cả 3 khu vực ("Bài viết"/"Báo cáo phân tích"/"BCTC gốc") vẫn hiển thị đầy đủ dữ liệu, không vỡ layout.

---

## Nhóm: Responsive

# [TC_PTCB_BVPT_21] Responsive viewport mobile/tablet — 2 cột xếp chồng dọc

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `CCol lg="6"` (breakpoint 992px) — dưới ngưỡng này cả 2 cột tự động thành full-width, xếp chồng
  dọc thay vì cạnh nhau.

## Các bước thực hiện
1. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024).

## Kết quả mong đợi
- [ ] Card "Bài viết" và cụm "Báo cáo phân tích"/"BCTC gốc" xếp CHỒNG DỌC (không còn cạnh nhau như desktop),
      không vỡ layout nghiêm trọng.

---

## Tổng hợp trạng thái (21 testcase)

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-bai-viet-phan-tich.spec.ts](../tests/phan-tich-co-ban-bai-viet-phan-tich.spec.ts) (POM:
section "Tab Bài viết & Phân tích" ở cuối [pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 3 | TC_PTCB_BVPT_05, 06, 09 |
| 🆕 Mới (riêng web) | 18 | TC_PTCB_BVPT_01-04, 07, 08, 10, 11, 12-21 |
| ⚠️ Cần xác nhận thêm | 0 | — |

**Phát hiện đáng chú ý cần theo dõi:**
1. **[ĐÍNH CHÍNH kiến trúc] Web KHÔNG có 3 sub-tab như app** — hiển thị đồng thời cả 3 loại nội dung (Bài
   viết/Báo cáo phân tích/BCTC gốc) trên 1 màn hình cố định, không cần điều hướng qua lại (TC_PTCB_BVPT_01).
2. **Sub-tab "Sự kiện" là dead code** — component `Events.vue` đầy đủ chức năng (API/list/modal/pagination
   riêng) tồn tại trong codebase nhưng KHÔNG có cách nào truy cập qua UI do `NewsEvent/index.vue` không loop qua
   `option_tab` (TC_PTCB_BVPT_02). Khuyến nghị báo dev xác nhận đây là tính năng dở dang hay cố ý ẩn.
3. **"BCTC gốc" dùng 4 tab riêng, không phải dropdown như app** — mỗi tab gọi API với `type` khác nhau (1/3/4/5,
   không có `type=2`) — TC_PTCB_BVPT_12/13.
4. **Cơ chế lọc ngày không nhất quán giữa 3 khu vực:** chỉ "Bài viết" lọc server-side (gọi lại API); "Báo cáo
   phân tích" lọc client-side theo ngày chính xác; "BCTC gốc" lọc client-side nhưng CHỈ theo NĂM (thô hơn) —
   TC_PTCB_BVPT_04.
5. **"BCTC gốc" không có thông báo "Không có dữ liệu" khi trống** — khác 2 khu vực còn lại, hiện bảng trống
   hoàn toàn không chữ, dễ gây hiểu lầm cho người dùng (lỗi mạng hay thực sự không có dữ liệu) — TC_PTCB_BVPT_04/18.
6. **Không có UI loading (spinner) nào ở cả 3 khu vực** — khác hẳn tab "Biểu đồ"/"4M & CANSLIM" — TC_PTCB_BVPT_17.
7. **Click icon "File" (cả "Báo cáo phân tích" lẫn "BCTC gốc") kích hoạt DOWNLOAD PDF thật qua `window.open()`**
   — Chromium xử lý như tải file (sự kiện `download`), không phải điều hướng trang — quan trọng khi viết
   locator/assertion (KHÔNG dùng `waitForEvent('popup')`) — TC_PTCB_BVPT_10/14.
8. **Gate cấp shell (`fa_tai_lieu`) khoá đúng toàn bộ tab với tài khoản Free hiện tại**, xác nhận lại đúng hành
   vi đã ghi nhận ở TC_PTCB_17 (`phan-tich-co-ban.md`) — TC_PTCB_BVPT_19.
