# Màn hình: Thông tin và sự kiện (tính năng mới) + cửa sổ "Báo cáo phân tích"

- **URL:** `/thong-tin-su-kien` (menu **Thị Trường › Thông tin và Sự Kiện**), nhận query `?mack=<mã>` và
  `?nhom=bao-cao-phan-tich` (nút "Xem mọi báo cáo của <mã>" ở chuông thông báo dẫn tới đây).
- **Phạm vi:** trang tài liệu / báo cáo / bài viết của **một mã**: ô tìm mã, khoảng ngày + 4 nút lọc nhanh, thanh 5 tab
  có ô số (Báo cáo phân tích · Bản cáo bạch & BCTN · Nghị quyết · Báo cáo quản trị · Bài viết), bảng + thanh phân trang
  dùng chung, ô nổi khi rê chuột vào dòng, cửa sổ "Báo cáo phân tích" (khuyến nghị, giá mục tiêu, tóm tắt AI), cửa sổ
  nội dung bài viết.
- **Ngoài phạm vi:** dòng "<mã>: Báo cáo phân tích mới" trong chuông thông báo và nút "Xem mọi báo cáo của <mã>" của cửa
  sổ báo cáo khi mở từ chuông (`utils/analystReportAlerts.js`) — thuộc nhóm "Thông báo".
- **Thay thế màn cũ:** trên `preprod`, tab "Bài viết & Phân tích" của **Phân tích cơ bản** đổi tên thành **"BCTC gốc"**
  và chỉ còn bảng BCTC gốc (`NewsAndAnalysis/index.vue`: "Bài viết, báo cáo phân tích và các loại tài liệu khác đã chuyển
  sang trang Thông tin và sự kiện"). Các testcase `TC_PTCB_BVPT_*` về Bài viết / Báo cáo phân tích / 3 loại tài liệu
  (type 3, 4, 5) ở [phan-tich-co-ban-bai-viet-phan-tich.md](phan-tich-co-ban-bai-viet-phan-tich.md) sẽ lỗi thời khi
  preprod lên production — file đó **chưa sửa** (cập nhật theo nhánh B của skill khi chạy lại màn PTCB).
- **Môi trường test:** https://prev2.vietpointer.vn — bản build `origin/preprod` mới nhất, gọi **backend production**
  (`api2.kfsp.vn`). Tài khoản `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí). Đăng nhập + cache phiên qua
  `pages/Prev2Session.ts`.
- **Component** (nhánh `origin/preprod` của `stocks`, commit gần nhất 05/11/2026 "Chuyển api laravel sang nestjs"):
  `src/views/faAnalysis/ThongTinSuKien.vue`, `ModalBaoCaoPhanTich.vue`, `TooltipBaoCao.vue`, `PhanTrang.vue`,
  `SearchStockCode.vue`; hàm `layDanhSachBaoCao` / `layChiTietBaoCao` / `napTruocChiTietBaoCao` / `khuyenNghiBaoCao` /
  `tachCauTomTat` trong `src/function_global.js`.
- **Code test:** [tests/thong-tin-su-kien.spec.ts](../tests/thong-tin-su-kien.spec.ts), Page Object
  [pages/ThongTinSuKienPage.ts](../pages/ThongTinSuKienPage.ts). Chạy: `npx playwright test tests/thong-tin-su-kien.spec.ts
  --project=chromium --workers=2` (~2–4 phút).
- **Phương pháp sinh:** tính năng chỉ web có, không có tab tương ứng trong Google Sheet app — văn phong theo
  [canh-bao-gia.md](canh-bao-gia.md). Testcase do kiểm kê source preprod + đo bằng Playwright thật trên prev2 (dữ liệu
  thật FPT, tài khoản Free, màn 390px, Esc / bấm nền, lỗi API).
- **Quy ước trạng thái:**
  - 🆕 Testcase mới: đã tự động hoá.
  - ⚠️ Cần xác nhận thêm: bug / hành vi cần dev xác nhận (test ghi lại hành vi đo được).

**AN TOÀN DỮ LIỆU:** màn này chỉ **đọc** (không có API ghi). Lần ghi duy nhất là setting `final_mack` khi chọn mã ở ô tìm
kiếm — `/updateusersettings` bị chặn nên mã mặc định của tài khoản thật không đổi (body bị chặn được ghi lại để assert).
Phần lớn test thay 3 nhóm API bằng **máy chủ giả** (`FakeTtskApi`) để có dữ liệu cố định: `GET /api/report-analysis`
(lọc ngày + phân trang như máy chủ thật), `GET /api/report-analysis/<id>`, `GET /api/stocks/document/get-document`,
`GET /api/stocks/news/get-list-news | get-count-page-news | get-content-news`; mã trong tiêu đề được thay bằng mã đang hỏi.
`window.open` được thay bằng hàm ghi lại URL (link PDF trên Chromium sẽ tải file). TC_05 và TC_48 dùng dữ liệu thật.

**Dữ liệu giả lập chuẩn** (năm `Y` = năm hiện tại): 7 báo cáo phân tích (4 trong năm `Y`, 2 năm `Y-1`, 1 năm `Y-2`; có đủ
loại khuyến nghị MUA / BÁN / TRUNG LẬP / "MUA,MUA" / "MUA,BÁN" / không có; 1 báo cáo chưa có tóm tắt), 6 tài liệu "Bản
cáo bạch & BCTN" (xáo thứ tự, 1 cái không có tệp), 3 nghị quyết, 4 báo cáo quản trị, 7 bài viết.

---

## Nhóm: Điều hướng & giao diện chung

# [TC_TTSK_01] Vào trang từ menu "Thị Trường › Thông tin và Sự Kiện"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập, vào `/dashboard`.
2. Rê chuột vào "Thị Trường" trên thanh menu, bấm "Thông tin và Sự Kiện".

## Kết quả mong đợi
- [ ] Chuyển sang `/thong-tin-su-kien`, trang hiện đầy đủ.
- [ ] Tiêu đề "Thị Trường" trên thanh menu được tô sáng (`/thong-tin-su-kien` nằm trong `activePaths` của menu).

# [TC_TTSK_02] Giao diện ban đầu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào `/thong-tin-su-kien?mack=FPT`.

## Kết quả mong đợi
- [ ] Đầu trang: ô "Mã CK" có sẵn `FPT`, bên cạnh là mã in đậm + tên công ty.
- [ ] Hai ô "Từ ngày" / "Đến ngày" trống, chưa có nút "Xoá khoảng ngày".
- [ ] 4 nút lọc nhanh theo thứ tự: "Mới nhất" (đang chọn) · "Năm <năm nay>" · "Năm <năm trước>" · "Tất cả".
- [ ] Thanh tab theo thứ tự: Báo cáo phân tích · Bản cáo bạch & BCTN · Nghị quyết · Báo cáo quản trị · Bài viết; tab
  "Báo cáo phân tích" đang chọn, bảng có cột Ngày · Nguồn · Tên báo cáo.
- [ ] Không có cột "Tệp" (đang tạm ẩn, `hien_cot_tep: false`).

# [TC_TTSK_03] Mặc định "Mới nhất": mỗi tab tối đa 5 mục, không lọc ngày, không phân trang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Dữ liệu: 7 báo cáo, 6 / 3 / 4 tài liệu, 7 bài viết. Vào trang.

## Kết quả mong đợi
- [ ] Gọi `report-analysis` với `from_date=''`, `to_date=''`, `page=1`, `item_per_page=5`; bài viết `item_per_page=5`, không
  gọi `get-count-page-news`; tài liệu gọi đủ `type=3,4,5`, `year=*`.
- [ ] Ô số trên tab: 5 · 5 · 3 · 4 · 5 (cắt còn 5 mục mới nhất mỗi tab).
- [ ] Không có thanh phân trang.

# [TC_TTSK_04] `?mack=` trên URL thắng mã đã lưu; không có `?mack=` thì mở mã đã lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Setting `final_mack` = VNM. Vào `/thong-tin-su-kien?mack=fpt` (chữ thường).
2. Ở trình duyệt khác, vào `/thong-tin-su-kien` (không query).

## Kết quả mong đợi
- [ ] Bước 1: trang hiện **FPT** (tự viết hoa), API danh sách báo cáo chỉ gọi **1 lượt** với FPT (không bắn 2 lượt).
- [ ] Bước 2: trang hiện **VNM** (mã đã lưu), dữ liệu là của VNM.

# [TC_TTSK_05] Dữ liệu thật (FPT)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Không giả lập API. Vào trang với FPT.

## Kết quả mong đợi
- [ ] Cả 5 tab có ô số 0–5; tab Báo cáo phân tích có 1–5 dòng, cột Ngày dạng `dd/mm/yyyy`, Nguồn và Tên không rỗng.
- [ ] Tab Bài viết: cột Mã = FPT, cột Ngày dạng `dd/mm/yyyy hh:mm`. Không có lỗi JS.

# [TC_TTSK_06] Trang vừa khít cửa sổ; màn hẹp không tràn ngang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. 40 báo cáo, chọn "Tất cả" (20 dòng) ở cửa sổ 1600×900.
2. Thu cửa sổ còn 390×844.

## Kết quả mong đợi
- [ ] Cửa sổ trình duyệt không cuộn dọc (trang cao đúng phần còn lại), bảng tự cuộn bên trong khung.
- [ ] Ở 390px: trang không tràn ngang, thanh tab cuộn ngang được, bảng vẫn hiện.

---

## Nhóm: Ô tìm mã

# [TC_TTSK_07] Gõ mã → gợi ý; bấm chọn → đổi mã, tải lại cả 5 tab, lưu mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "VN" vào ô "Mã CK", rồi gõ "VNM" và bấm gợi ý VNM.

## Kết quả mong đợi
- [ ] Danh sách gợi ý tối đa 5 dòng, mỗi dòng có mã + tên công ty.
- [ ] Chọn xong: gợi ý đóng, đầu trang hiện VNM + "…Sữa Việt Nam", cả báo cáo / 3 loại tài liệu / bài viết gọi lại với
  `mack=VNM`.
- [ ] Web gửi setting `final_mack` = VNM (bị chặn trong test).

# [TC_TTSK_08] Chọn gợi ý bằng bàn phím; Esc đóng gợi ý

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "HP", ấn ↓ rồi Enter.
2. Gõ "MW", ấn Esc.

## Kết quả mong đợi
- [ ] ↓ tô sáng gợi ý thứ 2, Enter chọn đúng mã đó (ô và đầu trang đều đổi).
- [ ] Esc đóng danh sách gợi ý, mã đang xem không đổi.

# [TC_TTSK_09] Tìm theo tên công ty không dấu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "sua viet nam".

## Kết quả mong đợi
- [ ] Có gợi ý VNM.

# [TC_TTSK_10] Bấm ra ngoài ô tìm kiếm đóng gợi ý

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "VN", bấm vào vùng bảng.

## Kết quả mong đợi
- [ ] Gợi ý đóng, mã đang xem vẫn là FPT.

---

## Nhóm: Lọc theo thời gian

# [TC_TTSK_11] Nút "Năm <năm nay>"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Năm <năm nay>".

## Kết quả mong đợi
- [ ] Nút được chọn, "Mới nhất" bỏ chọn; ô ngày = 01/01/<năm nay> → hôm nay; hiện nút "Xoá khoảng ngày".
- [ ] Gọi `report-analysis` với đúng khoảng ngày, `page=1`, `item_per_page=20`; bộ đếm bài viết gửi cùng khoảng.
- [ ] Bảng còn 4 báo cáo của năm nay, ô số 4.

# [TC_TTSK_12] Nút "Năm <năm trước>" — tài liệu lọc ngay trên trình duyệt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Năm <năm trước>".

## Kết quả mong đợi
- [ ] Ô ngày = 01/01 → 31/12 năm trước; bảng còn 2 báo cáo của năm trước.
- [ ] Ô số: Bản cáo bạch & BCTN 2 (lọc theo năm), Nghị quyết 1 (theo ngày ký), Báo cáo quản trị 2 (theo ngày trong tên /
  ngày cuối quý).
- [ ] Không gọi lại API tài liệu.

# [TC_TTSK_13] Nút "Tất cả"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Tất cả".

## Kết quả mong đợi
- [ ] Hai ô ngày trống, không có nút xoá; gọi `report-analysis` với khoảng rỗng, `item_per_page=20`.
- [ ] Hiện đủ 7 báo cáo, ô số tài liệu 6, bài viết 7 (có gọi bộ đếm bài viết).

# [TC_TTSK_14] Nhập tay khoảng ngày → áp dụng ngay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhập "Từ ngày" 01/03/<năm trước>, rồi "Đến ngày" 31/12/<năm trước>.

## Kết quả mong đợi
- [ ] Mỗi lần đổi ngày gọi API ngay (không có nút "Tìm kiếm"), lần cuối với đúng hai đầu.
- [ ] Không nút lọc nhanh nào được chọn; bảng còn 2 báo cáo trong khoảng.

# [TC_TTSK_15] "Từ ngày" sau "Đến ngày" → tự hoán đổi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhập "Đến ngày" 01/03, rồi "Từ ngày" 30/09 (cùng năm).

## Kết quả mong đợi
- [ ] Hai ô tự đổi chỗ: Từ 01/03 → Đến 30/09; API nhận khoảng đúng chiều, không lượt nào gửi khoảng ngược.

# [TC_TTSK_16] Năm chưa gõ đủ thì chưa áp dụng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đặt "Từ ngày" = 01/01/0202 (nhịp trung gian khi gõ tay năm 2026).

## Kết quả mong đợi
- [ ] Không gọi API, "Mới nhất" vẫn được chọn.

# [TC_TTSK_17] Nút "Xoá khoảng ngày" về "Tất cả"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Năm <năm nay>", rồi bấm nút × "Xoá khoảng ngày".

## Kết quả mong đợi
- [ ] Hai ô trống, nút **"Tất cả"** được chọn (không quay về "Mới nhất"), bảng hiện đủ 7 báo cáo, 20 dòng/trang.

# [TC_TTSK_18] Chọn đúng 1 ngày: tab Bài viết không lọc

- **Trạng thái:** ⚠️ Cần xác nhận thêm (🐞 nghi vấn)
- **Kết quả đo được:** `khoangNgay()` gửi khoảng **rỗng** cho API bài viết khi Từ = Đến ("như News.vue — API hiểu là
  không lọc"), trong khi API báo cáo vẫn lọc đúng ngày. Người dùng chọn 1 ngày thì tab Bài viết (cả ô số) hiện bài viết của
  **mọi thời gian**.

## Các bước thực hiện
1. Nhập Từ = Đến = 05/01/<năm nay>.

## Kết quả mong đợi
- [ ] Báo cáo phân tích gửi `from_date = to_date = <ngày đó>`, bảng còn 1 báo cáo.
- [ ] Bài viết và bộ đếm bài viết gửi `from_date=''`, `to_date=''` (hành vi hiện tại — cần dev xác nhận có đúng ý không).

# [TC_TTSK_19] Lọc tài liệu theo ngày

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhập khoảng 01/04 → 30/06 năm trước, xem lần lượt Nghị quyết, Báo cáo quản trị, Bản cáo bạch & BCTN.

## Kết quả mong đợi
- [ ] Nghị quyết: chỉ còn nghị quyết ký 20/04.
- [ ] Báo cáo quản trị: chỉ còn "quý 2" (ngày cuối quý 30/06); bản "(30-07-…)" bị loại theo ngày trong tên.
- [ ] Bản cáo bạch & BCTN (chỉ có năm): còn 2 tài liệu của năm đó.

---

## Nhóm: Tab & bảng dữ liệu

# [TC_TTSK_20] Mỗi tab đúng cột, chỉ một bảng hiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm lần lượt từng tab.

## Kết quả mong đợi
- [ ] Tab được chọn (`aria-selected`), chỉ 1 tab được chọn và 1 bảng hiện.
- [ ] Cột: Bản cáo bạch & BCTN = Tên tài liệu / Văn kiện · Loại · Năm; Nghị quyết = Nội dung nghị quyết · Ngày ký; Báo cáo
  quản trị = Tên báo cáo quản trị · Kỳ báo cáo; Bài viết = Mã · Ngày · Bài viết; Báo cáo phân tích = Ngày · Nguồn · Tên
  báo cáo.

# [TC_TTSK_21] Bản cáo bạch & BCTN — tên, loại, năm, thứ tự

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. "Tất cả", tab Bản cáo bạch & BCTN (dữ liệu cố ý xáo thứ tự).

## Kết quả mong đợi
- [ ] Tên bỏ đuôi "(CN/yyyy)"; Loại tách từ tên: Điều lệ / Thường niên / Quy chế / Cáo bạch / Khác; cột Năm "Năm yyyy".
- [ ] Xếp mới nhất lên đầu.

# [TC_TTSK_22] Nghị quyết — Ngày ký

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Không có cột Loại; ngày ký dạng `dd/mm/yyyy`; nghị quyết không có ngày ký hiện "Năm yyyy"; mới nhất lên đầu.

# [TC_TTSK_23] Báo cáo quản trị — Kỳ báo cáo

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] "…quý 2 năm yyyy" → "Quý 2/yyyy"; "…6 tháng…" → "Bán niên yyyy"; còn lại "Năm yyyy".
- [ ] Thứ tự: năm giảm dần, trong năm: cả năm → quý 4 → quý 3 → bán niên → quý 2 → quý 1.

# [TC_TTSK_24] Mở tệp tài liệu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. "Tất cả", tab Bản cáo bạch & BCTN, bấm vào dòng "Bản điều lệ"; bấm dòng tài liệu không có tệp.

## Kết quả mong đợi
- [ ] Tên là link tới tệp, `target=_blank`; bấm dòng mở tệp ở tab mới (`window.open`).
- [ ] Tài liệu không có tệp: dòng không bấm được (không có kiểu con trỏ / link), bấm không mở gì.

# [TC_TTSK_25] Bài viết — cột Mã, Ngày giờ

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Cột Mã = mã đang xem; Ngày dạng `dd/mm/yyyy hh:mm`; giữ thứ tự API trả.

# [TC_TTSK_26] Xem nội dung bài viết

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. API nội dung chậm 2,5 giây. Bấm bài viết thứ 2; đóng bằng ×.

## Kết quả mong đợi
- [ ] Cửa sổ có tiêu đề = tên bài, hiện "Đang tải nội dung" rồi hiện nội dung HTML; gọi `get-content-news` với `mack`, `id`.
- [ ] Bấm × đóng cửa sổ.

# [TC_TTSK_27] Lỗi tải nội dung bài viết

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] 500 và mất mạng đều hiện "Không lấy được nội dung", không có lỗi JS.

# [TC_TTSK_28] Trạng thái đang tải

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mọi API danh sách chậm 7 giây. Vào trang, chuyển qua vài tab.

## Kết quả mong đợi
- [ ] Bảng hiện dòng khung chờ (Báo cáo 5 dòng, Bài viết 8 dòng, tài liệu 3 dòng), ô số trên tab ẩn.
- [ ] Tải xong: khung chờ biến mất, ô số hiện.

# [TC_TTSK_29] Không có dữ liệu

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Mỗi tab hiện đúng câu: "Không có báo cáo / tài liệu / nghị quyết / báo cáo / bài viết trong khoảng đã chọn", ô số 0.

# [TC_TTSK_30] Lỗi API danh sách

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Báo cáo 500, tài liệu mất mạng, bài viết 500, chi tiết 500.

## Kết quả mong đợi
- [ ] Mọi tab về trạng thái rỗng, ô số 0, không có lỗi JS (không có thông báo lỗi riêng — giống "không có dữ liệu").

# [TC_TTSK_31] Đổi mã liên tiếp — bỏ phản hồi muộn của mã cũ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Phản hồi của VNM chậm 5 giây. Đổi sang VNM rồi ngay sau đó sang HPG; chờ phản hồi VNM về.

## Kết quả mong đợi
- [ ] Đầu trang và mọi tab giữ dữ liệu HPG, không bị phản hồi VNM về muộn ghi đè.

---

## Nhóm: Phân trang

# [TC_TTSK_32] Báo cáo phân tích nhiều trang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. 45 báo cáo. Ở "Mới nhất", rồi bấm "Tất cả", sang trang 2, trang sau (3), rồi bấm "Năm <năm trước>".

## Kết quả mong đợi
- [ ] "Mới nhất" không có thanh phân trang. "Tất cả": thanh "‹ 1 2 3 ›", ‹ bị khoá ở trang 1, ô số 45.
- [ ] Sang trang gọi `page=n` (máy chủ phân trang), ô số vẫn 45 (không nháy); trang 3 có 5 dòng, › bị khoá.
- [ ] Đổi bộ lọc quay về trang 1.

# [TC_TTSK_33] Dãy số trang rút gọn

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] 10 trang: trang 1 → "1 2 3 4 … 10"; trang 4 → "1 2 3 4 5 … 10"; trang 5 → "1 … 4 5 6 … 10"; trang 10 → "1 … 7 8 9 10".

# [TC_TTSK_34] Tài liệu phân trang trên trình duyệt

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] 25 tài liệu → 20 + 5 dòng, sang trang không gọi API; đổi sang tab tài liệu khác rồi quay lại → về trang 1.

# [TC_TTSK_35] Bộ đếm bài viết đếm thừa

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bộ đếm trả 65, danh sách chỉ có 45 bài. "Tất cả", tab Bài viết, bấm trang 4.

## Kết quả mong đợi
- [ ] Ban đầu 4 trang, ô số 65. Trang 4 rỗng → tự lùi về trang 3 (5 bài), thanh còn 3 trang, ô số sửa thành 45 (tổng tính lại từ trang cuối).

---

## Nhóm: Ô nổi khi rê chuột

# [TC_TTSK_36] Ô nổi của dòng báo cáo

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Dòng đầu: mã · nguồn · ngày; tên báo cáo; khuyến nghị + "Giá mục tiêu 51,585"; tóm tắt mỗi câu một dòng — tách ở
  `. ! ;` nhưng giữ nguyên "13.754", "12,1%", "EV/EBITDA".

# [TC_TTSK_37] Ô nổi của dòng tài liệu

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Bản cáo bạch: "FPT Điều lệ · Năm yyyy". Nghị quyết: "FPT Nghị quyết · Ngày ký dd/mm/yyyy" (không có ngày ký thì
  "Năm yyyy", không có chữ "Ngày ký"). Không có khuyến nghị / tóm tắt.

# [TC_TTSK_38] Ô nổi đóng khi rời dòng / khi mở báo cáo

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Đưa chuột ra khỏi dòng → ô nổi ẩn. Bấm dòng mở cửa sổ báo cáo → ô nổi ẩn.

# [TC_TTSK_39] Nạp trước chi tiết báo cáo

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Sau khi danh sách về, web tự gọi API chi tiết cho đủ 5 báo cáo đang hiện (lúc trình duyệt rảnh); rê chuột vào dòng
  hiện ngay tóm tắt, không gọi lại API chi tiết.

# [TC_TTSK_40] Màu và cách gộp khuyến nghị

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] MUA → `tone-buy`, BÁN → `tone-sell`, TRUNG LẬP → `tone-hold`.
- [ ] Báo cáo nhiều mã: "MUA,MUA" / "30000,30000" → hiện MUA, 30,000; "MUA,BÁN" + giá khác nhau → không hiện khuyến nghị.

---

## Nhóm: Cửa sổ "Báo cáo phân tích"

# [TC_TTSK_41] Cửa sổ báo cáo có tóm tắt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm báo cáo MIRAE (MUA, giá mục tiêu 76.363, tiềm năng 15,2%).

## Kết quả mong đợi
- [ ] Đầu cửa sổ: chip mã FPT · "Báo cáo phân tích" · MIRAE · ngày; link "Xem tài liệu gốc" tới PDF (`target=_blank`).
- [ ] Tiêu đề "Khuyến nghị", khối màu xanh: MUA · Giá mục tiêu 76,363 · +15.2%; rê chuột vào khối hiện tên báo cáo.
- [ ] Phần "Tóm tắt" mỗi câu một thẻ. Không có nút "Xem mọi báo cáo của FPT" (chỉ có khi mở từ chuông).

# [TC_TTSK_42] Báo cáo không có khuyến nghị

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Tiêu đề là tên báo cáo, không có khối khuyến nghị, vẫn có tóm tắt.

# [TC_TTSK_43] Báo cáo chưa có tóm tắt → mở thẳng PDF

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] `window.open(<link PDF>)`, không mở cửa sổ báo cáo.

# [TC_TTSK_44] Chưa có tóm tắt + trình duyệt chặn popup

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Lùi về cửa sổ báo cáo chỉ có phần đầu (tên báo cáo + "Xem tài liệu gốc"), không có phần "Tóm tắt".

# [TC_TTSK_45] Lỗi API chi tiết → Thử lại

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] 500 → "Không lấy được tóm tắt (lỗi 500)." + nút "Thử lại"; mất mạng → "(lỗi mạng)".
- [ ] Bấm "Thử lại" khi API đã ổn → hiện tóm tắt + khuyến nghị. Không có lỗi JS.

# [TC_TTSK_46] Đóng cửa sổ báo cáo

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** phím **Esc không đóng** cửa sổ (CModal của CoreUI không bắt phím Esc — giống các modal CoreUI khác
  của app, nhưng khác thói quen chung của cửa sổ nổi). Nút × và bấm ra nền đóng được.

## Kết quả mong đợi
- [ ] Đóng được bằng nút × và bấm ra nền.
- [ ] (Đo được — test assert) Ấn Esc cửa sổ vẫn mở.

# [TC_TTSK_47] Bấm báo cáo khi chi tiết chưa về

- **Trạng thái:** ⚠️ Cần xác nhận thêm (trải nghiệm)
- **Kết quả đo được:** `moBaoCao` **chờ API chi tiết trả về rồi mới mở cửa sổ** (để quyết định mở PDF hay mở cửa sổ). Mạng
  chậm thì bấm dòng không có phản hồi gì (không khung chờ, không con trỏ chờ) cho tới khi API về. Khung chờ 4 dòng trong
  cửa sổ thực tế không bao giờ hiện khi mở từ trang này.

## Các bước thực hiện
1. API chi tiết chậm 4 giây. Bấm ngay báo cáo thứ 4.

## Kết quả mong đợi
- [ ] Sau 1,2 giây chưa có cửa sổ; cửa sổ mở khi API về, có sẵn tóm tắt.

---

## Nhóm: Phân quyền & điều hướng trong app

# [TC_TTSK_48] Tài khoản Free

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Free vào được trang, xem đủ dữ liệu thật, rê chuột có ô nổi; không bị khoá (không có `.blurred-image` /
  ProtectedView). API `report-analysis` trả 200 cho tài khoản Free.

# [TC_TTSK_49] Đổi query ngay trên trang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đang ở tab Bài viết, điều hướng trong app tới `?mack=VNM&nhom=bao-cao-phan-tich` (đúng việc nút "Xem mọi báo cáo" của
   chuông làm).

## Kết quả mong đợi
- [ ] Chuyển về tab Báo cáo phân tích, đổi sang VNM, không tải lại trang.

# [TC_TTSK_50] Chưa có mã đang xem

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** bình thường store luôn có mã (mặc định / đã lưu), test đưa store về rỗng để kiểm tra nhánh này.

## Kết quả mong đợi
- [ ] Hiện "Chưa chọn mã cổ phiếu" + "Nhập mã ở ô tìm kiếm phía trên để xem tài liệu, báo cáo và sự kiện của doanh
  nghiệp", ẩn thanh tab, không gọi API.

# [TC_TTSK_51] Robot KFSP AI che nút "Trang sau"

- **Trạng thái:** ⚠️ Cần xác nhận thêm (🐞 bug)
- **Kết quả đo được:** thanh phân trang canh phải sát đáy khung; nút robot KFSP AI cố định ở góc dưới phải (50×50px) nằm
  đè lên nút › "Trang sau" ở cả 1366×768, 1600×900, 1920×1080 — `elementFromPoint` ở giữa nút trả về robot. Bấm chuột
  vào › là bấm trúng robot (mở chat AI) thay vì sang trang; chỉ sang trang được bằng bàn phím hoặc bấm số trang.
  Trang Backtest đã có cách ẩn robot riêng (`bt-hide-robot`), trang này chưa có.

## Các bước thực hiện
1. 45 báo cáo, bấm "Tất cả" để có thanh phân trang; đo phần tử nằm trên cùng ở tâm nút › tại 3 kích thước cửa sổ.

## Kết quả mong đợi
- [ ] (Đúng) Nút › bấm được bằng chuột.
- [ ] (Đo được — test assert) Tâm nút › bị robot che ở cả 3 kích thước.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 47 |
| ⚠️ Cần xác nhận thêm | 4 (🐞 TC_51 · 🐞 nghi vấn TC_18 · trải nghiệm TC_46 Esc, TC_47) |
| **Tổng** | **51** |

Cả 51 case chạy tự động (pass 2 lần liên tiếp với `--workers=2`), không có `test.fixme`. Case 🐞 assert đúng hành vi đo được, nên khi dev sửa thì test sẽ fail —
lúc đó đổi assert về hành vi đúng.

## Phát hiện đáng chú ý

1. **🐞 Robot KFSP AI che nút › "Trang sau"** (TC_51) ở mọi kích thước cửa sổ thường gặp — bấm chuột vào › mở chat AI
   thay vì sang trang.
2. **🐞 nghi vấn — chọn đúng 1 ngày thì tab Bài viết không lọc** (TC_18): `khoangNgay()` gửi khoảng rỗng khi Từ = Đến
   (chép hành vi của `News.vue` cũ), trong khi tab Báo cáo phân tích lọc đúng ngày → hai tab cùng bộ lọc cho kết quả
   không nhất quán.
3. **Bấm báo cáo khi mạng chậm không có phản hồi** (TC_47): trang chờ API chi tiết rồi mới mở cửa sổ; bình thường không
   thấy vì chi tiết đã được nạp trước (TC_39).
4. **Tab PTCB "Bài viết & Phân tích" đã thành "BCTC gốc"** trên preprod — nội dung chuyển sang trang này; testcase
   `TC_PTCB_BVPT_*` cần cập nhật khi chạy lại màn PTCB.
5. Tài khoản Free xem được toàn bộ trang (không có ProtectedView) — cần xác nhận đây là chủ đích kinh doanh.
6. Cửa sổ báo cáo không đóng bằng phím Esc (TC_46) — chỉ × hoặc bấm nền.
7. Lỗi API danh sách không có thông báo riêng, hiện y như "không có dữ liệu" (TC_30).
8. Không có ?mack= thì trang tải 1 lượt theo mã mặc định rồi tải lại lượt nữa khi setting `final_mack` về (TC_04, bước 2).
