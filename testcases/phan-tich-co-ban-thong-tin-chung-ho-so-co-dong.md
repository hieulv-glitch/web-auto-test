# Màn hình: Phân tích cơ bản — Tab "Thông tin chung" — Sub-tab "Hồ sơ" + "Cổ đông"

**Cập nhật 10/11/2026:** chạy lại trên localhost:8080 (nhánh `preprod`, backend PRODUCTION). Đăng nhập chuyển sang
`FaAnalysisPage.login()` (phiên cache `Prev2Session`, chặn ghi setting) + lưới `FaSafetyNet`; bỏ bước reset về VNM
cuối test. Toàn bộ 22 case pass, không sửa/xoá/fixme case nào.

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=thong-tin-chung`, sau đó click sub-tab con "Hồ sơ" hoặc "Cổ đông"
  (bên trong thanh 7 sub-tab của `Right.vue`) — KHÔNG có query param riêng cho sub-tab con, xác nhận qua đọc
  source (`Right.vue data(): type_tab` là state cục bộ, không đọc `$route.query`) + DOM thật.
- **Component:**
  [stocks/src/views/faAnalysis/Common/Right.vue](../../stocks/src/views/faAnalysis/Common/Right.vue) (shell điều
  hướng 7 sub-tab, đã phủ ở tài liệu 1/4) render:
  - Sub-tab **"Hồ sơ"** (`type_tab == 'profile'`): `CCol xl="9"` = 
    [Profile.vue](../../stocks/src/views/faAnalysis/Common/Profile.vue) (2 sub-tab con tự viết tay "Lịch sử"/
    "Ngành nghề", KHÔNG phải "Thông tin chung" collapsible như app) — `CCol xl="3"` =
    [LeaderShip.vue](../../stocks/src/views/faAnalysis/Common/LeaderShip.vue) (panel "BAN LÃNH ĐẠO", click 1
    lãnh đạo mở modal chi tiết).
  - Sub-tab **"Cổ đông"** (`type_tab == 'share_holder'`): `CCol xl="9"` =
    [TableShareHolder.vue](../../stocks/src/views/faAnalysis/Common/TableShareHolder.vue) (bảng phẳng "Cổ đông
    lớn", KHÔNG có 2 sub-tab con "Cổ đông lớn"/"Lịch sử giao dịch" như app) — `CCol xl="3"` =
    [ChartAnalysis.vue](../../stocks/src/views/faAnalysis/Common/ChartAnalysis.vue) (2 biểu đồ donut "Tổng
    quan"/"Cổ đông lớn", DÙNG CHUNG component này với sub-tab "Thông tin giao dịch").
  - Cả 2 sub-tab đọc dữ liệu từ **CÙNG API** `GET /api/stocks/common-info` (`info_update()` trong
    `Common/index.vue`, gọi 1 lần lúc `created()` + lại mỗi khi đổi mã CK) — KHÔNG có API riêng, KHÔNG đọc
    `store.state.list_mack_company` (an toàn 100% khỏi race condition đã ghi nhận ở tab "So sánh"/"Biểu đồ", chỉ
    trường "Sàn niêm yết" ở bảng công ty bên trái đọc state đó, đã ghi nhận ở tài liệu 1/4).
- **⚠️ Tài liệu này là 2/4 tài liệu con của tab "Thông tin chung"** (tab này quá lớn nên chia làm 4 lượt sinh
  testcase). Đọc trước
  [phan-tich-co-ban-thong-tin-chung.md](phan-tich-co-ban-thong-tin-chung.md) (1/4 — khung/shell + sub-tab mặc
  định "Thông tin tài chính", ĐẶC BIỆT mục "Phát hiện đáng chú ý" #1/#1b về 2 cơ chế gate độc lập cấp sub-tab).
  2 tài liệu còn lại (sẽ sinh sau):
  - `phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md` — sub-tab "Thông tin giao dịch" + "Sự kiện".
  - `phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md` — sub-tab "Nước ngoài" + "Tự doanh".
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Đối chiếu với Sheet "Phân Tích FA(Cổ Phiếu)" (đã dump sẵn) — TC ID 222-246 ("Tab
  Hồ sơ") và TC ID 265-284 ("Tab Cổ đông"). Web khác app khá nhiều về cấu trúc: app "Hồ sơ" có section "Thông
  tin chung" (collapsible) RIÊNG + 3 sub-tab "Ban lãnh đạo"/"Ngành nghề"/"Lịch sử"; web KHÔNG có section "Thông
  tin chung" riêng cho sub-tab này (bảng "Thông tin chung" là CHUNG cho toàn màn, ở cột trái `Left.vue`, đã phủ
  ở TC_PTCB_TTC_02) và chỉ có 2 sub-tab con "Lịch sử"/"Ngành nghề" (không có "Ban lãnh đạo" — panel lãnh đạo
  LUÔN hiển thị cố định bên phải, không phải 1 trong 3 sub-tab). App "Cổ đông" có donut + 2 sub-tab "Cổ đông
  lớn"/"Lịch sử giao dịch"; web CHỈ có bảng "Cổ đông lớn" (không có "Lịch sử giao dịch" — đã xác nhận qua đọc
  `Common/index.vue`/`Right.vue`, không có component nào tương ứng) + 2 donut riêng.
- **Quy ước trạng thái:** giống `phan-tich-co-ban.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng web) ·
  ⚠️ Cần xác nhận thêm.
- **⚠️ AN TOÀN DỮ LIỆU:** Toàn bộ API trong phạm vi 2 sub-tab này CHỈ ĐỌC (`common-info`, `common-info/shareholder`
  — modal chi tiết lãnh đạo). Không có action mutate nào (không thêm/sửa/xoá cổ đông/lãnh đạo qua UI).
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Test đổi mã CK trong file này dùng `?mack=` (query, không dùng
  path param) và luôn reset về VNM ở cuối test đổi mã.

## Phát hiện đáng chú ý — đọc trước khi viết/chạy test

**#1, #2:** đã xoá 10/11/2026 (bug donut "Tổng quan" của tài khoản Free / mã ETF và bảng "Cổ đông lớn" trống không
thông báo — user chấp nhận, xoá TC_PTCB_TTC_HSCD_14/16/17).

**#3. Sub-tab con "Ngành nghề"/"Lịch sử" (state cục bộ của `Profile.vue`) KHÔNG bị reset khi đổi mã CK — khác
hẳn hành vi "trống lại từ đầu" thường thấy ở các bảng dữ liệu khác trong màn này.** `Right.vue` chỉ
`v-if="type_tab == 'profile'"` cho `<Profile>` — component này KHÔNG bị unmount/remount khi đổi mã CK (chỉ đổi
props `lich_su`/`nganh_nghe`, Vue reactivity tự cập nhật nội dung mà không phá huỷ component), nên `data():
type_tab` cục bộ của `Profile.vue` (khác `type_tab` của `Right.vue`, 2 biến cùng tên nhưng 2 component khác
nhau) giữ nguyên giá trị đã chọn ("Ngành nghề") qua lần đổi mã CK — cùng tinh thần với phát hiện #2 ở tài liệu
1/4 (sub-tab chính không bị reset khi đổi mã CK) nhưng ở đây là cấp SUB-TAB CON, sâu hơn 1 bậc. Xem
TC_PTCB_TTC_HSCD_05.

**#4. Click 1 dòng trong bảng "Cổ đông lớn" (`TableShareHolder.vue`) KHÔNG có hành động gì — khác hẳn click 1
lãnh đạo trong panel "BAN LÃNH ĐẠO" (`LeaderShip.vue`) mở modal chi tiết.** Đọc source xác nhận:
`TableShareHolder.vue` render `<tr>` thuần, không có `@click`/`shareholderDetail()` nào gắn vào — trong khi
`LeaderShip.vue` mỗi `.item` có `@click="shareholderDetail(item)"` gọi `GET
/api/stocks/common-info/shareholder`. Đây là điểm khác biệt kiến trúc thật giữa 2 danh sách trông tương tự
nhau, không phải thiếu sót khi viết testcase. Xem TC_PTCB_TTC_HSCD_13.

**#5. [XÁC NHẬN AN TOÀN] Verify ĐẦY ĐỦ 2 cấp gate `features_disabled` cho sub-tab "Cổ đông" theo đúng bài học
rút ra từ tài liệu 1/4 (phát hiện #1b) — với tài khoản Free hiện tại, CẢ 2 CẤP đều KHÔNG khoá.** `Right.vue`
(`CCol xl="9"`, key `fa_co_dong`) và `ChartAnalysis.vue` (`CCol xl="3"`, key
`fa_co_dong_va_gd_co_dong_bieu_do`) là 2 `<ProtectedView>` ĐỘC LẬP — đo thật `features_disabled` của tài khoản
Free hiện tại KHÔNG chứa cả 2 key này, nên "Cổ đông" hiển thị bình thường ở CẢ 2 CẤP (0 `ProtectedView`). Test
verify RIÊNG từng cấp (không gộp chung như 1 phép đếm tổng) để không lặp lại sai lầm giả định 1 cấp đã ghi nhận
ở tài liệu 1/4. Xem TC_PTCB_TTC_HSCD_18/19. "Hồ sơ" không có case riêng trong `computed: featureName()` của
`Right.vue` (`profile` không match switch nào) nên `CCol xl="9"` LUÔN `null`; `LeaderShip.vue` cũng không có
`<ProtectedView>` nào trong code — 2 cấp gate của "Hồ sơ" vì vậy KHÔNG THỂ bị khoá qua cơ chế `features_disabled`
trong bất kỳ trường hợp nào (khác "Cổ đông"), xem TC_PTCB_TTC_HSCD_10.

---

## Nhóm: Sub-tab "Hồ sơ" — 2 sub-tab con "Lịch sử"/"Ngành nghề" (`Profile.vue`)

# [TC_PTCB_TTC_HSCD_01] Overview khi click sub-tab "Hồ sơ"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 222, 230 (Sheet) — **Khác biệt so với app:** app có section "Thông tin chung"
  collapsible RIÊNG cho tab này; web KHÔNG có (bảng "Thông tin chung" dùng chung cho cả màn, ở cột trái, đã phủ
  TC_PTCB_TTC_02). App có 3 sub-tab con "Ban lãnh đạo"/"Ngành nghề"/"Lịch sử"; web chỉ có 2 sub-tab con "Lịch
  sử"/"Ngành nghề" — "Ban lãnh đạo" là panel CỐ ĐỊNH bên phải, không phải 1 trong các sub-tab.

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=thong-tin-chung`.
2. Click sub-tab "Hồ sơ".

## Kết quả mong đợi
- [ ] Bên trái (`CCol xl="9"`): 2 sub-tab con "Lịch sử"/"Ngành nghề", "Lịch sử" active mặc định (in hoa qua CSS
      `text-transform: uppercase`, text DOM thật là "Lịch sử"/"Ngành nghề" không dấu hoa), bên dưới là đoạn text
      lịch sử hình thành công ty.
- [ ] Bên phải (`CCol xl="3"`): panel "BAN LÃNH ĐẠO" — list các thành viên ban lãnh đạo (avatar + tên + chức vụ).

---

# [TC_PTCB_TTC_HSCD_02] Nội dung "Lịch sử" hiển thị đúng text từ API

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 240, 241 (Sheet)
- **Ghi chú:** `lich_su` lấy từ `d.lich_su` (API `common-info`), đã `trim()`/xoá `\r`/`\t`/dòng trống liên tiếp ở
  `Common/index.vue info_update()` trước khi truyền xuống.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_HSCD_01, quan sát nội dung sub-tab "Lịch sử" (mặc định active).

## Kết quả mong đợi
- [ ] Hiển thị đoạn text lịch sử hình thành công ty (không rỗng, chứa mốc thời gian dạng "Năm .../Ngày .../
      Tháng ...").

---

# [TC_PTCB_TTC_HSCD_03] Click "Ngành nghề" chuyển đúng, nội dung khác "Lịch sử"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 231, 238 (Sheet)

## Các bước thực hiện
1. Click "Ngành nghề".

## Kết quả mong đợi
- [ ] Sub-tab "Ngành nghề" active (class `active`), "Lịch sử" không còn active.
- [ ] Nội dung đổi khác — hiển thị danh sách ngành nghề kinh doanh (`nganh_nghe`, mỗi dòng cách nhau bằng xuống
      dòng, KHÔNG có bullet/số thứ tự thật trong DOM — hiệu ứng "line" chỉ do CSS `repeating-linear-gradient`
      nền sọc, không phải danh sách `<li>`).

---

# [TC_PTCB_TTC_HSCD_04] Click lại "Lịch sử" quay về đúng nội dung ban đầu

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 233 (Sheet)

## Các bước thực hiện
1. Từ TC_PTCB_TTC_HSCD_03 (đang ở "Ngành nghề"), click lại "Lịch sử".

## Kết quả mong đợi
- [ ] Sub-tab "Lịch sử" active trở lại, nội dung quay về đoạn text lịch sử công ty (giống TC_PTCB_TTC_HSCD_02).

---

# [TC_PTCB_TTC_HSCD_05] 🆕 [Phát hiện] Đổi mã CK khi đang ở "Ngành nghề" — KHÔNG tự reset về "Lịch sử"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #3 đầu tài liệu. `Profile.vue` không bị unmount khi đổi mã CK (chỉ
  đổi props), nên `type_tab` cục bộ của nó giữ nguyên lựa chọn "Ngành nghề" — khác hành vi "dữ liệu load lại từ
  đầu" quen thuộc của các bảng khác trong màn hình.

## Các bước thực hiện
1. Click "Hồ sơ", click "Ngành nghề" (xác nhận active).
2. Đổi mã CK qua ô tìm kiếm sang "HPG".

## Kết quả mong đợi
- [ ] Sau khi đổi mã, vẫn đang ở sub-tab con "Ngành nghề" (KHÔNG tự động quay về "Lịch sử") — nội dung cập nhật
      đúng theo ngành nghề của HPG.

---

## Nhóm: Panel "BAN LÃNH ĐẠO" (`LeaderShip.vue`)

# [TC_PTCB_TTC_HSCD_06] Panel "BAN LÃNH ĐẠO" hiển thị đúng field mỗi thành viên

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 234, 235 (Sheet)
- **Ghi chú:** `chuc_vu_hien_tai` là JSON string được parse lấy `[0].vi_tri` (`Common/index.vue info_update()`)
  — nếu parse lỗi (JSON không hợp lệ/rỗng) fallback về chuỗi rỗng, không throw.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_HSCD_01, quan sát panel "BAN LÃNH ĐẠO" bên phải.

## Kết quả mong đợi
- [ ] Có ít nhất 1 thành viên, mỗi dòng hiển thị: icon avatar mặc định (SVG, không phải ảnh thật), tên (đậm),
      chức vụ hiện tại (dòng dưới).
- [ ] Danh sách cuộn được (`custom-scrollbar`, `height: calc(100vh - 190px)`) nếu nhiều thành viên.

---

# [TC_PTCB_TTC_HSCD_07] Click 1 lãnh đạo ít dữ liệu — modal chỉ hiện các section có data

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** liên quan TC 234 (Sheet, mô tả chung "icon › bên phải" ngụ ý có thể mở chi tiết) —
  **Khác biệt so với app:** app không mô tả rõ nội dung modal chi tiết.
- **Ghi chú:** `shareholderDetail(item)` gọi `GET /api/stocks/common-info/shareholder?ma_co_dong=...` — mỗi
  section (`v-if="xxx != ''"`) trong modal chỉ hiện khi mảng dữ liệu tương ứng không rỗng. Với lãnh đạo có ít dữ
  liệu công khai (VD "Lê Hoàng Minh"), phần lớn field trong bảng "Thông tin chung" rỗng nhưng section vẫn hiện
  (mảng `thong_tin` trả về có 1 dòng, chỉ thiếu giá trị cụ thể).

## Các bước thực hiện
1. Click vào 1 lãnh đạo có ít thông tin công khai (VD "Lê Hoàng Minh").

## Kết quả mong đợi
- [ ] Modal "Thông tin chi tiết" (`role="dialog"`) hiện ra, có header với title + nút đóng "×" (click được —
      KHÁC modal "Thông báo" nâng cấp gói ở tài liệu 1/4, modal này KHÔNG bị ẩn header/nút đóng dù cùng khai báo
      class `modal-hide-header-footer`).
- [ ] Có đúng 2 section: "Thông tin chung" (bảng 6 cột: Tên/Năm sinh/Số CMND/Cư trú/Trình độ/Nơi sinh) và "Chức
      vụ hiện tại" (bảng 3 cột: Vị trí/Tổ chức/Thời gian bổ nhiệm) — các section khác ("Cổ phiếu đang nắm giữ",
      "Cổ phiếu đại diện sở hữu", "Cá nhân có liên quan", "Tổ chức có liên quan", "Quá trình công tác") KHÔNG
      hiện (không có dữ liệu).

---

# [TC_PTCB_TTC_HSCD_08] Click 1 lãnh đạo đủ dữ liệu — modal hiện nhiều section hơn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** So sánh với TC_PTCB_TTC_HSCD_07 để xác nhận các section là ĐỘNG (tuỳ dữ liệu từng người), không
  phải cố định.

## Các bước thực hiện
1. Click vào 1 lãnh đạo có nắm giữ cổ phiếu/đại diện sở hữu (VD "Mai Kiều Liên").

## Kết quả mong đợi
- [ ] Section "Thông tin chung" có đủ dữ liệu (năm sinh, số CMND, nơi sinh...).
- [ ] Section "Chức vụ hiện tại" có NHIỀU dòng (nắm nhiều vị trí ở nhiều tổ chức khác nhau).
- [ ] Xuất hiện THÊM section "Cổ phiếu đang nắm giữ" (bảng 5 cột: Mã CP/Số lượng/Tỉ lệ/Tính đến ngày/Giá trị (tỷ
      VNĐ)) — không hiện ở TC_PTCB_TTC_HSCD_07.

---

# [TC_PTCB_TTC_HSCD_09] Đóng modal chi tiết lãnh đạo bằng nút "×"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mở modal chi tiết 1 lãnh đạo bất kỳ.
2. Click nút "×".

## Kết quả mong đợi
- [ ] Modal đóng lại (không còn trong DOM/không visible).

---

# [TC_PTCB_TTC_HSCD_10] Free — sub-tab "Hồ sơ" KHÔNG bị khoá gói hội viên ở CẢ nội dung chính lẫn panel lãnh đạo

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #5. `Right.vue computed: featureName()` không có case cho `'profile'` (rơi vào
  `default: return null`) — `CCol xl="9"` (Profile) không thể bị khoá qua `features_disabled`. `LeaderShip.vue`
  cũng KHÔNG import/dùng `<ProtectedView>` ở bất kỳ đâu trong code — `CCol xl="3"` (panel lãnh đạo) về mặt code
  KHÔNG THỂ bị khoá qua cơ chế này (khác "Cổ đông", nơi CẢ 2 cấp đều CÓ khả năng bị khoá dù tài khoản hiện tại
  chưa bị khoá — xem TC_PTCB_TTC_HSCD_18/19).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Hồ sơ".

## Kết quả mong đợi
- [ ] Cả nội dung chính (2 sub-tab con "Lịch sử"/"Ngành nghề") lẫn panel "BAN LÃNH ĐẠO" hiển thị bình thường,
      KHÔNG có `ProtectedView` nào che (0 `ProtectedView` trên toàn trang).

---

## Nhóm: Sub-tab "Cổ đông" — Bảng "Cổ đông lớn" (`TableShareHolder.vue`)

# [TC_PTCB_TTC_HSCD_11] Overview khi click sub-tab "Cổ đông"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 265, 270 (Sheet) — **Khác biệt so với app:** app có 2 sub-tab con "Cổ đông lớn"/"Lịch
  sử giao dịch" bên dưới donut; web CHỈ có bảng "Cổ đông lớn" (không có "Lịch sử giao dịch" — không tồn tại
  trên web, đã xác nhận qua đọc source, KHÔNG viết testcase cho tính năng này vì không có trên web).

## Các bước thực hiện
1. Từ tab "Thông tin chung", click sub-tab "Cổ đông".

## Kết quả mong đợi
- [ ] Bên trái (`CCol xl="9"`): bảng "Cổ đông lớn" với 4 cột "Ngày"/"Tên"/"Số lượng cổ phiếu"/"Tỷ lệ sở hữu".
- [ ] Bên phải (`CCol xl="3"`): panel "Tổng quan" (donut cơ cấu sở hữu) + "Cổ đông lớn" (donut top cổ đông).

---

# [TC_PTCB_TTC_HSCD_12] Bảng "Cổ đông lớn" hiển thị đủ cột + dữ liệu thật

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 273, 274 (Sheet) — **Khác biệt so với app:** app hiển thị dạng card (avatar + 3 dòng
  info dọc); web hiển thị dạng BẢNG (4 cột ngang) — cùng dữ liệu, khác cách trình bày.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_HSCD_11, quan sát các dòng trong bảng.

## Kết quả mong đợi
- [ ] Có ít nhất 1 dòng dữ liệu, mỗi dòng có đủ giá trị thật ở cả 4 cột (Ngày dạng `MM-YYYY`, Tên tổ chức/cá
      nhân, Số lượng cổ phiếu có dấu phẩy ngăn cách hàng nghìn, Tỷ lệ sở hữu có hậu tố "%").

---

# [TC_PTCB_TTC_HSCD_13] 🆕 [Phát hiện] Click vào 1 dòng cổ đông KHÔNG có hành động gì

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #4 đầu tài liệu — khác hẳn hành vi click 1 lãnh đạo ở sub-tab "Hồ
  sơ" (mở modal chi tiết).

## Các bước thực hiện
1. Click vào 1 dòng bất kỳ trong bảng "Cổ đông lớn".

## Kết quả mong đợi
- [ ] Không có modal/điều hướng/thay đổi UI nào xảy ra sau khi click.

---

## Nhóm: Panel "Tổng quan" (`ChartAnalysis.vue`)

# [TC_PTCB_TTC_HSCD_15] 2 donut "Tổng quan"/"Cổ đông lớn" hiển thị đúng, không lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 266, 267 (Sheet) — donut "Tổng quan" (Nhà nước/Nước ngoài/Khác) khớp app. Donut "Cổ
  đông lớn" là tính năng RIÊNG của web, app không có.
- **Ghi chú:** `data_co_dong_lon` lọc CHỈ cổ đông có `ty_le_so_huu >= 3.9` — donut "Cổ đông lớn" thường có ÍT
  mục hơn hẳn số dòng trong bảng bên trái (VD mã VNM: bảng có 16 dòng nhưng donut chỉ 2 mục thoả điều kiện).
  Dùng `CanvasRenderer` — không assert được text legend/tooltip qua DOM, chỉ verify canvas tồn tại.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_HSCD_11 (mã VNM), quan sát panel bên phải.

## Kết quả mong đợi
- [ ] Nhãn "Tổng quan" + "Cổ đông lớn" hiển thị đúng thứ tự (Tổng quan ở trên).
- [ ] Có đúng 2 `<canvas>` (1 cho mỗi donut), không lỗi console.

---

## Nhóm: Gate cấp widget (`features_disabled`) cho sub-tab "Cổ đông" — verify CẢ 2 CẤP

# [TC_PTCB_TTC_HSCD_18] Free — nội dung chính "Cổ đông" (`CCol xl="9"`, key `fa_co_dong`) KHÔNG bị khoá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #5 — `features_disabled` của tài khoản Free hiện tại KHÔNG chứa `fa_co_dong`.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Cổ đông".

## Kết quả mong đợi
- [ ] Bảng "Cổ đông lớn" (nội dung chính, `CCol xl="9"`) hiển thị bình thường, KHÔNG có `ProtectedView` che vùng
      này.

---

# [TC_PTCB_TTC_HSCD_19] Free — panel biểu đồ "Cổ đông" (`CCol xl="3"`, key `fa_co_dong_va_gd_co_dong_bieu_do`)
  KHÔNG bị khoá — verify RIÊNG, xác nhận 2 cấp độc lập

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #5 — verify TÁCH RIÊNG khỏi TC_PTCB_TTC_HSCD_18 (không gộp đếm tổng
  `ProtectedView` toàn trang) để không lặp lại sai lầm giả định 1 cấp đã ghi nhận ở tài liệu 1/4 (phát hiện
  #1b). Key `fa_co_dong_va_gd_co_dong_bieu_do` DÙNG CHUNG với panel biểu đồ của sub-tab "Thông tin giao dịch"
  (`ChartAnalysis.vue` dùng chung cho cả 2 sub-tab).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Cổ đông".

## Kết quả mong đợi
- [ ] Panel bên phải (2 donut "Tổng quan"/"Cổ đông lớn", `CCol xl="3"`) hiển thị bình thường, KHÔNG có
      `ProtectedView` che vùng này — verify BẰNG locator scope RIÊNG trong panel này (không dùng số đếm
      `ProtectedView` toàn trang).
- [ ] Tổng số `ProtectedView` trên toàn trang = 0 (xác nhận CẢ 2 cấp cùng không bị khoá, khớp
      TC_PTCB_TTC_HSCD_18).

---

## Nhóm: Tương tác chung

# [TC_PTCB_TTC_HSCD_20] Chuyển qua lại "Hồ sơ" ↔ "Cổ đông" nhiều lần không lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click "Hồ sơ" → "Cổ đông" → "Hồ sơ" → "Cổ đông", lặp lại 2 vòng liên tiếp.

## Kết quả mong đợi
- [ ] Sau vòng cuối, nội dung sub-tab đang active hiển thị đúng, không có lỗi JS console (`pageerror`) phát
      sinh trong suốt quá trình.

---

# [TC_PTCB_TTC_HSCD_21] Đổi mã CK khi đang ở "Cổ đông" — bảng + donut cập nhật đúng theo mã mới

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, XÁC NHẬN KHÔNG có race condition: Pass**
- **Ghi chú:** Khác tab "So sánh"/"Biểu đồ" (đọc `store.state.list_mack_company`, nạp bất đồng bộ qua socket) —
  dữ liệu sub-tab này đến từ CÙNG API `common-info` với bảng "Thông tin chung" cột trái, gọi lại đồng bộ đúng
  lúc `watch: stockcode` trigger, không có race condition nào được ghi nhận.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_HSCD_11 (mã VNM), đổi mã CK qua ô tìm kiếm sang "HPG".

## Kết quả mong đợi
- [ ] Bảng "Cổ đông lớn" cập nhật đúng dữ liệu cổ đông của HPG (khác VNM).
- [ ] 2 donut vẫn hiển thị đúng 2 `<canvas>`, không lỗi console.

---

## Nhóm: Responsive

# [TC_PTCB_TTC_HSCD_22] Responsive viewport mobile/tablet cho cả 2 sub-tab

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị sub-tab "Hồ sơ" đã tải xong dữ liệu, thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024).
2. Lặp lại với sub-tab "Cổ đông".

## Kết quả mong đợi
- [ ] Cả 2 sub-tab vẫn hiển thị được (có thể xếp chồng dọc/cuộn ngang), không vỡ layout nghiêm trọng ở cả 2
      kích thước.

---

## Tổng hợp trạng thái (19 testcase — phạm vi sub-tab "Hồ sơ" + "Cổ đông")

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.spec.ts](../tests/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.spec.ts)
(POM: section "Tab Thông tin chung — Sub-tab Hồ sơ + Cổ đông" ở cuối
[pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 5 | TC_PTCB_TTC_HSCD_03, 04, 06, 09, 12 |
| 🆕 Mới (riêng web) | 14 | TC_PTCB_TTC_HSCD_01, 02, 05, 07, 08, 10, 11, 13, 15, 18, 19, 20, 21, 22 |
| ⚠️ Cần xác nhận thêm | 0 | — |

Không có `test.fixme` nào trong file spec này — toàn bộ 19 testcase đều tự động hoá và pass được.

**Cập nhật 10/11/2026:** xoá TC_PTCB_TTC_HSCD_14, TC_PTCB_TTC_HSCD_16, TC_PTCB_TTC_HSCD_17 (bug được user chấp nhận).

**Phát hiện đáng chú ý cần theo dõi:**
1. **Sub-tab con "Ngành nghề"/"Lịch sử" không bị reset khi đổi mã CK** — do `Profile.vue` không unmount khi đổi
   mã CK (chỉ đổi props). Cùng tinh thần "state không bị reset" đã ghi nhận nhiều lần trong màn hình này, nhưng
   ở đây là cấp sub-tab CON (sâu hơn 1 bậc so với các phát hiện trước). Xem phát hiện #3, TC_PTCB_TTC_HSCD_05.
2. **Click 1 dòng cổ đông trong bảng "Cổ đông lớn" không có hành động gì — khác click 1 lãnh đạo (mở modal chi
   tiết)** — khác biệt kiến trúc thật giữa `TableShareHolder.vue` (không có `@click`) và `LeaderShip.vue` (có
   `shareholderDetail()`). Xem phát hiện #4, TC_PTCB_TTC_HSCD_13.
3. **[XÁC NHẬN AN TOÀN] Verify đầy đủ 2 cấp gate `features_disabled` cho "Cổ đông"** theo đúng bài học từ tài
   liệu 1/4 — tài khoản Free hiện tại KHÔNG bị khoá ở CẢ 2 CẤP (`fa_co_dong` cho nội dung chính,
   `fa_co_dong_va_gd_co_dong_bieu_do` cho panel biểu đồ), verify TÁCH RIÊNG từng cấp thay vì gộp chung. "Hồ sơ"
   về mặt code KHÔNG THỂ bị khoá qua cơ chế này ở cả 2 cấp (không có case/`ProtectedView` nào tương ứng). Xem
   phát hiện #5, TC_PTCB_TTC_HSCD_10/18/19.
4. **Không có API mutate nào trong phạm vi 2 sub-tab này** — toàn bộ chỉ đọc (`common-info`,
   `common-info/shareholder`), an toàn tuyệt đối cho tài khoản test dùng chung.

**Ngoài phạm vi lần sinh này:** nội dung chi tiết sub-tab "Thông tin giao dịch"/"Sự kiện" và "Nước ngoài"/"Tự
doanh" — xem 2 tài liệu con còn lại liệt kê ở đầu file, sẽ sinh ở các lượt sau.
