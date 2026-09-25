# Màn hình: Phân tích cơ bản — Khung/Shell (6 tab)

- **URL:** `/phan-tich-co-ban/:macks*` (route con của `/`, yêu cầu đăng nhập — `meta.requiresUser: true`, xác
  nhận qua `stocks/src/router/index.js` dòng ~664).
- **Component:** [src/views/faAnalysis/index.vue](../../stocks/src/views/faAnalysis/index.vue) (`name:
  "FAAnalysis"`) — 6 tab tự viết tay (KHÔNG dùng CoreUI `<CTabs>`): "Thông tin chung" · "Tài chính doanh
  nghiệp" · "4M & CANSLIM" · "Biểu đồ" · "So sánh" · "Bài viết & Phân tích".
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Google Sheet, tab **"Phân Tích FA(Cổ Phiếu)"** (305 dòng). App (mobile) có
  **10 tab con** (Giao dịch, Báo cáo TC, Chỉ tiêu TC, Biểu đồ, So sánh, 4M & Canslim, Hồ sơ, Sự kiện, Cổ đông,
  Bài viết & Phân tích) — kiến trúc **khác hẳn web** (chỉ 6 tab cấp ngoài): web gộp "Báo cáo TC" + "Chỉ tiêu
  TC" của app vào 1 tab "Tài chính doanh nghiệp"; gộp "Giao dịch" (trừ biểu đồ nến) + "Hồ sơ" + "Sự kiện" + "Cổ
  đông" + thêm 1 sub-tab "Thông tin tài chính"/"Nước ngoài"/"Tự doanh" hoàn toàn mới vào 1 tab "Thông tin
  chung" (7 sub-tab riêng, xem tài liệu con). Phần overview/chuyển tab trong Sheet chỉ dùng để tham khảo văn
  phong — độ phủ testcase khung/shell dưới đây do tự kiểm kê source code + DOM thật quyết định (nguyên tắc đã
  áp dụng cho Nhật Ký GD).
- **Phạm vi:** Tài liệu này CHỈ kiểm thử **khung/shell** của trang (ô tìm kiếm mã CK, 6 tab chính, deep-link URL,
  badge "BCTC Mới", giới hạn theo gói hội viên ở cấp tab, responsive). Nội dung **bên trong** từng tab có tài
  liệu riêng (sẽ bổ sung ở các lượt sinh sau):
  - `phan-tich-co-ban-thong-tin-chung*.md` — tab "Thông tin chung" (7 sub-tab: Thông tin tài chính, Hồ sơ, Cổ
    đông, Thông tin giao dịch, Sự kiện, Nước ngoài, Tự doanh).
  - `phan-tich-co-ban-tai-chinh-doanh-nghiep.md` — tab "Tài chính doanh nghiệp" (BS/CF/IS/TM + Chỉ số tài
    chính).
  - `phan-tich-co-ban-4m-canslim.md` — tab "4M & CANSLIM".
  - `phan-tich-co-ban-bieu-do.md` — tab "Biểu đồ".
  - `phan-tich-co-ban-so-sanh.md` — tab "So sánh".
  - `phan-tich-co-ban-bai-viet-phan-tich.md` — tab "Bài viết & Phân tích".
- **Phương pháp sinh:** Đọc source code (`index.vue`, `SearchStockCode.vue`, `ProtectedView.vue`,
  `TheContainer.vue` phần đồng bộ setting) + kiểm thử trực tiếp trên môi trường thật bằng Playwright (chuyển
  tab, deep-link qua path/query, F5, mock API `getusersettings`/`get-limit-components2` để cô lập khỏi state
  tài khoản dùng chung).
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** "mã CK đang xem" (`final_mack`) là 1
  setting lưu **server-side theo tài khoản** (đồng bộ qua API `getusersettings`/`updateusersettings`), KHÔNG
  phải state riêng theo browser context — mọi test đổi mã CK (qua `?mack=` hoặc chọn gợi ý tìm kiếm) đều ảnh
  hưởng tới CÁC TEST KHÁC chạy sau/song song trên cùng tài khoản. Test nào cần 1 giá trị `final_mack` xác định
  (TC_PTCB_08) phải mock hẳn API thay vì dựa vào điều hướng thật.
- **Quy ước trạng thái:**
  - ✅ Áp dụng — testcase adapt từ app, có thể/đã tự động hoá bằng Playwright.
  - 🆕 Testcase mới — phát sinh riêng cho web, app không có (hoặc khác kiến trúc không map được).
  - ⚠️ Cần xác nhận thêm — chưa đủ điều kiện kiểm chứng thực tế.

---

## Nhóm: Truy cập & Tổng quan

# [TC_PTCB_01] Overview màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 1, 8 (Sheet "Phân Tích FA(Cổ Phiếu)")
- **Khác biệt so với app:** App có icon search/mã CP + icon đổi mã ⇄ + icon star (yêu thích) + icon chuông
  (thông báo) trên header, và 10 tab con. Web dùng 1 ô input "Mã CK" (gõ trực tiếp, không cần icon riêng để mở
  popup đổi mã), KHÔNG có icon star/chuông ở khu vực này (đọc từ `index.vue`, xác nhận qua DOM thật — web
  không có khái niệm "yêu thích mã CK" ở màn này), và chỉ 6 tab (kiến trúc gộp khác app, xem đầu tài liệu).

## Các bước thực hiện
1. Đăng nhập thành công, điều hướng tới `/phan-tich-co-ban?mack=VNM`.

## Kết quả mong đợi
- [ ] Ô tìm kiếm "Mã CK" hiển thị đúng mã đang xem (VNM).
- [ ] Hiển thị đủ 6 tab đúng thứ tự: "Thông tin chung", "Tài chính doanh nghiệp", "4M & CANSLIM", "Biểu đồ",
      "So sánh", "Bài viết & Phân tích".
- [ ] Tab "Thông tin chung" active mặc định.
- [ ] Không tràn/vỡ layout ở viewport desktop chuẩn (1280x800+).

---

# [TC_PTCB_02] Chặn truy cập khi chưa đăng nhập

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Truy cập thẳng `/phan-tich-co-ban` khi chưa đăng nhập → router guard (`meta.requiresUser`)
  redirect sang `/login`, không render nội dung trang.

## Các bước thực hiện
1. Đảm bảo chưa đăng nhập.
2. Truy cập trực tiếp URL `/phan-tich-co-ban`.

## Kết quả mong đợi
- [ ] Tự động chuyển hướng sang `/login`, không hiển thị nội dung trang Phân tích cơ bản.

---

## Nhóm: Ô tìm kiếm mã CK

# [TC_PTCB_03] Gõ mã hợp lệ hiện gợi ý, chọn gợi ý đổi mã đang xem

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 3, 5 (Sheet)
- **Ghi chú:** `searchMack()` (`SearchStockCode.vue`) lọc trực tiếp trên `store.state.list_mack` (danh sách
  toàn bộ mã CK nạp từ API sau khi trang mount) — cần chờ danh sách này nạp xong trước khi gõ, nếu không gợi ý
  sẽ rỗng giả (đã gặp flaky lúc viết test, xử lý bằng cách chờ thêm sau khi trang tải).

## Các bước thực hiện
1. Gõ "HPG" vào ô "Mã CK".
2. Chọn gợi ý "HPG" trong danh sách xổ xuống.

## Kết quả mong đợi
- [ ] Danh sách gợi ý hiện đúng mã HPG (kèm tên công ty).
- [ ] Sau khi chọn, ô search hiển thị "HPG", toàn bộ nội dung trang refresh theo mã mới (header hiển thị
      "(HPG)").

---

# [TC_PTCB_04] Gõ tên công ty không dấu vẫn ra gợi ý

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `searchMack()` có fallback tìm theo `ten_cong_ty` sau khi bỏ dấu (`normalize("NFD")` +
  strip combining marks) nếu tìm theo mã CK không đủ 5 kết quả — xác nhận đúng qua test gõ "hoa phat" ra gợi ý
  "HPG" (Tập đoàn Hòa Phát).

## Các bước thực hiện
1. Gõ "hoa phat" (không dấu, không viết hoa) vào ô "Mã CK".

## Kết quả mong đợi
- [ ] Gợi ý "HPG" (Hòa Phát) vẫn xuất hiện dù gõ tên công ty không dấu.

---

# [TC_PTCB_05] Gõ mã không tồn tại không ra gợi ý nào

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Gõ 1 chuỗi chắc chắn không phải mã/tên công ty nào ("ZZZZZZ999") vào ô "Mã CK".

## Kết quả mong đợi
- [ ] Không có gợi ý nào hiển thị.

---

# [TC_PTCB_06] Nhấn Enter khi có gợi ý đang chọn sẽ chọn mã đó

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** liên quan TC 3 (Sheet)
- **Ghi chú:** `enter()` chọn `suggestions[current]` — `current` mặc định là 0 (gợi ý đầu tiên) nếu chưa dùng
  phím mũi tên lên/xuống.

## Các bước thực hiện
1. Gõ "HPG" vào ô "Mã CK", chờ gợi ý hiện.
2. Nhấn Enter (không click chuột vào gợi ý).

## Kết quả mong đợi
- [ ] Mã CK đang xem đổi thành "HPG" giống như khi click chọn gợi ý.

---

# [TC_PTCB_07] Đổi mã CK giữ nguyên tab đang xem

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `watch: "$store.state.mack"` trong `index.vue` reset TẤT CẢ `active_tab` về `false` rồi bật lại
  ĐÚNG `active_tab[type_tab]` hiện tại (không phải luôn reset về tab "Thông tin chung") — đổi mã CK ở bất kỳ
  tab nào cũng giữ nguyên tab đang xem, chỉ refresh dữ liệu theo mã mới.

## Các bước thực hiện
1. Chuyển sang tab "So sánh".
2. Gõ và chọn 1 mã CK khác (HPG) qua ô tìm kiếm.

## Kết quả mong đợi
- [ ] Sau khi đổi mã, vẫn đang ở tab "So sánh" (không tự động quay về "Thông tin chung").

---

## Nhóm: Deep-link qua URL

# [TC_PTCB_08] ⚠️ [BUG] Deep-link qua path param `/phan-tich-co-ban/<mack>` KHÔNG load đúng mã

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, PHÁT HIỆN BUG THẬT: Pass (test xác nhận đúng
  hành vi lỗi)**
- **⚠️ Phát hiện đáng chú ý (bug thật):** Deep-link qua path param (VD `/phan-tich-co-ban/HPG`, KHÔNG kèm
  `?mack=`) **không load đúng mã trong URL** nếu tài khoản đã có `final_mack` lưu từ trước (mã CK xem gần
  nhất) — bị ghi đè về mã cũ thay vì mã trong URL. Nguyên nhân (đọc từ `TheContainer.vue`): `mounted()` gọi
  `getDataSaveSettings()` → API `getusersettings` → `.then()` gọi `setDataToLocalStorage(res.data)`, hàm này
  (1) ghi MỌI key server trả về (kể cả `"final_mack"`) vào `localStorage` qua vòng lặp generic (dòng ~1344),
  RỒI (2) **NGAY SAU ĐÓ** (dòng ~1380) đọc lại `localStorage.final_mack` và **ghi đè** `store.state.mack` —
  điều kiện `if (!this.$route.query.mack && ...)` chỉ kiểm tra **query**, hoàn toàn không biết tới `:macks*`
  (path param). `FAAnalysis.created()` CÓ đọc `this.macks` và set đúng mã ban đầu, nhưng bị `TheContainer`
  ghi đè lại ngay sau đó. **Kết quả đo được:** xác nhận 100% qua automation (mock response API `getusersettings`
  trả `final_mack = VNM` rồi truy cập `/phan-tich-co-ban/HPG` → hiển thị "VNM", không phải "HPG").
- **Khuyến nghị:** Dùng `?mack=<mack>` (query param) cho MỌI liên kết sâu (deep-link) trỏ tới màn này thay vì
  path param — query hoạt động đúng 100% (xem TC_PTCB_09) vì nằm trong điều kiện kiểm tra của
  `TheContainer.vue`.

## Các bước thực hiện
1. Mock API `getusersettings` trả về `final_mack = { mack: "VNM" }`.
2. Truy cập `/phan-tich-co-ban/HPG` (path param, không có `?mack=`).

## Kết quả mong đợi (hành vi THẬT — bug)
- [ ] Ô tìm kiếm hiển thị "VNM" (mã cũ bị ghi đè), KHÔNG phải "HPG" (mã trong URL).

---

# [TC_PTCB_09] Truy cập `?mack=<mack>` load đúng mã theo query param

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Query `?mack=` được xử lý ở CẢ `FAAnalysis.created()` (`if (this.$route.query.mack) {...}`,
  chạy SAU nhánh path param nên có độ ưu tiên cao hơn nếu cả 2 cùng có mặt) LẪN điều kiện chặn ghi đè của
  `TheContainer.vue` (xem TC_PTCB_08) — 2 cơ chế bảo vệ CÙNG hoạt động đúng khiến query param là cách deep-link
  duy nhất ổn định 100%.

## Các bước thực hiện
1. Truy cập `/phan-tich-co-ban?mack=HPG`.

## Kết quả mong đợi
- [ ] Ô tìm kiếm hiển thị đúng "HPG".

---

# [TC_PTCB_10] Truy cập `?tab=<tab>` mở đúng tab tương ứng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `created()` đọc `this.$route.query.tab`, so khớp với `tab` field trong `option_tab` (VD
  `so-sanh` → tab "So sánh") — chỉ 6 giá trị hợp lệ tương ứng 6 tab: `thong-tin-chung`, `tai-chinh-doanh-nghiep`,
  `4m-canslim`, `bieu-do`, `so-sanh`, `tin-tuc`.

## Các bước thực hiện
1. Truy cập `/phan-tich-co-ban/VNM?tab=so-sanh`.

## Kết quả mong đợi
- [ ] Tab "So sánh" active ngay từ đầu, không phải "Thông tin chung".

---

## Nhóm: Chuyển 6 tab chính

# [TC_PTCB_11] Chuyển qua lại lần lượt cả 6 tab

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 10 (Sheet, "Check click chuyển tab")

## Các bước thực hiện
1. Click lần lượt qua cả 6 tab: Thông tin chung → Tài chính doanh nghiệp → 4M & CANSLIM → Biểu đồ → So sánh →
   Bài viết & Phân tích.

## Kết quả mong đợi
- [ ] Mỗi lần click, đúng 1 tab active (nền tím, xem class `active-bg-tab`), nội dung đổi đúng loại dữ liệu
      tương ứng.

---

# [TC_PTCB_12] Click tab nhanh liên tục không lỗi console/crash

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 12 (Sheet, "Check click tab nhanh liên tục")

## Các bước thực hiện
1. Click nhanh qua lại cả 6 tab, lặp lại 2 vòng liên tiếp (không chờ giữa các lần click).

## Kết quả mong đợi
- [ ] Tab cuối cùng được click hiển thị đúng, không có lỗi JS (`pageerror`) phát sinh trong suốt quá trình.

---

# [TC_PTCB_13] Chuyển tab KHÔNG cập nhật URL — F5 quay về tab mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** Click chuyển tab (`li v-for` trong `index.vue`) chỉ set `type_tab`/`active_tab`/
  `query_tab` (data cục bộ) — KHÔNG gọi `router.push`/cập nhật query string. Do đó F5 giữa lúc đang ở tab khác
  "Thông tin chung" sẽ LUÔN mất tab đang xem, quay về mặc định — CÙNG PATTERN đã ghi nhận ở Nhật Ký GD
  (`TC_NKGD_06`). Đây là hành vi thật của code (không phải bug ngẫu nhiên), có thể gây khó chịu UX.

## Các bước thực hiện
1. Từ tab "Thông tin chung" mặc định, chuyển sang tab "So sánh".
2. Tải lại trang (F5) mà không đổi URL.

## Kết quả mong đợi
- [ ] URL không có thay đổi khi chuyển tab (vẫn `/phan-tich-co-ban/<mack>`, không thêm query).
- [ ] Sau F5, trang quay về tab mặc định "Thông tin chung" (không giữ tab "So sánh" đã chọn trước đó).

---

# [TC_PTCB_14] Nút Back trình duyệt điều hướng rời khỏi trang

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Vì chuyển tab không đổi URL/lịch sử trình duyệt (xem TC_PTCB_13), nút Back **không** có khái
  niệm "quay lại tab trước" trong phạm vi trang này — luôn điều hướng khỏi hẳn `/phan-tich-co-ban` về trang
  trước đó trong lịch sử duyệt web.

## Các bước thực hiện
1. Từ trang khác (Dashboard), điều hướng sang `/phan-tich-co-ban`.
2. Chuyển sang tab "So sánh".
3. Bấm nút Back của trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng trang trước đó (Dashboard), không phải quay lại tab đã xem trước trong cùng trang.

---

## Nhóm: Badge "BCTC Mới"

# [TC_PTCB_15] Click badge "BCTC Mới" điều hướng sang danh sách BCTC mới

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **Đã viết test, tự `test.skip` khi badge không hiển thị (phụ thuộc dữ
  liệu thật)**
- **Ghi chú:** Badge chỉ hiển thị khi API `check-quarter` trả `status == 1` cho mã đang xem VÀ tài khoản không
  phải gói Free (`!isAccountFree`) — phụ thuộc dữ liệu quý báo cáo tài chính thật tại thời điểm chạy test, nên
  test tự `skip` với lý do rõ ràng nếu badge không xuất hiện cho mã VNM lúc đó (không coi là fail).
  `gotoListBCTC()` điều hướng nội bộ (`router.push`) tới `/bctc-new-list`.

## Các bước thực hiện
1. Nếu badge "BCTC Mới - Qx Yyyy ✓" hiển thị ở góc phải thanh tab, click vào badge.

## Kết quả mong đợi
- [ ] Điều hướng sang `/bctc-new-list`.

---

## Nhóm: Giới hạn theo gói hội viên

# [TC_PTCB_16] Tab "Thông tin chung"/"Tài chính doanh nghiệp" không bị khóa theo gói hội viên

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `computed: featureName()` trong `index.vue` chỉ trả khác `null` cho 3 tab "Biểu đồ"/"So sánh"/
  "Bài viết & Phân tích" — 3 tab còn lại ("Thông tin chung"/"Tài chính doanh nghiệp"/"4M & CANSLIM") LUÔN có
  `featureName = null` → `disable_featureName` (`store.state.features_disabled.hasOwnProperty(null)`) LUÔN
  `false`, KHÔNG BAO GIỜ bị `<ProtectedView>` cấp shell che, bất kể gói hội viên. Test này CHỈ verify "Thông
  tin chung"/"Tài chính doanh nghiệp" — KHÔNG gồm "4M & CANSLIM" dù cùng `featureName = null` ở cấp shell, vì
  đo thật phát hiện tab "4M & CANSLIM" CÓ 1 `ProtectedView` RIÊNG, độc lập với gate cấp shell — component
  `FourmAndCanslim` tự kiểm tra `features_disabled.hasOwnProperty("fa_4m_cansslim")` và bọc TOÀN BỘ nội dung
  (không phải chỉ 2 biểu đồ radar — xem đính chính chi tiết + lý do sửa lại ghi chú này ở mục "Phát hiện đáng
  chú ý" cuối file). Chi tiết đầy đủ: [phan-tich-co-ban-4m-canslim.md](phan-tich-co-ban-4m-canslim.md)
  TC_PTCB_4M_16/17.

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`).
2. Click lần lượt tab "Thông tin chung", "Tài chính doanh nghiệp".

## Kết quả mong đợi
- [ ] Mỗi tab hiển thị đúng nội dung, KHÔNG hiển thị `ProtectedView` (màn mờ "Bạn cần nâng cấp gói hội viên...").

---

# [TC_PTCB_17] Tab "Bài viết & Phân tích" hiện `ProtectedView` với tài khoản Free hiện tại

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật, phát hiện đáng chú ý:
  Pass**
- **⚠️ Phát hiện đáng chú ý (khác giả định ban đầu, cùng pattern đã ghi nhận ở Bảng Giá TC_BANGGIA_49/50 và
  Nhật Ký GD TC_NKGD_09):** Đọc code, cả 3 tab "Biểu đồ"/"So sánh"/"Bài viết & Phân tích" đều CÓ cơ chế gate
  đúng (`featureName` trả về `fa_bieu_do_tc_*`/`fa_so_sanh`/`fa_tai_lieu`). Nhưng đo thật
  `localStorage.features_disabled` của tài khoản Free hiện tại (`FREE_USER_EMAIL` trong `.env`) chỉ có các key:
  `fa_4m_cansslim`, `fa_cttc`, `fa_giao_dich_noi_bo`, `fa_nuoc_ngoai`, `fa_nuoc_ngoai_bieu_do`, `fa_tai_lieu`,
  `fa_tu_doanh`, `fa_tu_doanh_bieu_do` — **KHÔNG có** `fa_so_sanh` hay `fa_bieu_do_tc_bank`/
  `fa_bieu_do_tc_nonbank_stock_insurance`. Kết quả: CHỈ tab "Bài viết & Phân tích" thực sự bị khóa với tài
  khoản Free hiện tại ở cấp shell; "Biểu đồ" và "So sánh" hiển thị bình thường dù code hỗ trợ khóa cả 2.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click lần lượt tab "Biểu đồ", "So sánh", "Bài viết & Phân tích".

## Kết quả mong đợi (hành vi THẬT đo được, tài khoản Free hiện tại)
- [ ] Tab "Biểu đồ": hiển thị bình thường, KHÔNG có `ProtectedView`.
- [ ] Tab "So sánh": hiển thị bình thường, KHÔNG có `ProtectedView`.
- [ ] Tab "Bài viết & Phân tích": hiện đúng 1 `ProtectedView` (màn mờ "Bạn cần nâng cấp gói hội viên...").

---

## Nhóm: Responsive

# [TC_PTCB_18] Responsive viewport mobile/tablet

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024), quan sát 6 tab chính.

## Kết quả mong đợi
- [ ] 6 tab vẫn hiển thị đầy đủ (có thể cuộn ngang thanh tab nếu không đủ chỗ), không vỡ layout nghiêm trọng.

---

## Tổng hợp trạng thái (18 testcase — chỉ phạm vi khung/shell)

Đã tự động hoá bằng Playwright: [tests/phan-tich-co-ban.spec.ts](../tests/phan-tich-co-ban.spec.ts)
(POM: [pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 4 | TC_PTCB_01, 03, 06, 11, 12 |
| 🆕 Mới (riêng web) | 12 | TC_PTCB_02, 04, 05, 07, 08, 09, 10, 13, 14, 16, 17, 18 |
| ⚠️ Cần xác nhận thêm | 1 | TC_PTCB_15 (tự skip khi không có badge, phụ thuộc dữ liệu quý báo cáo thật) |

**Phát hiện đáng chú ý cần theo dõi:**
1. **[BUG] Deep-link qua path param `/phan-tich-co-ban/<mack>` bị ghi đè bởi `final_mack` từ `getusersettings`**
   (TC_PTCB_08) — xác nhận 100% qua automation (mock API). Route hỗ trợ cả path param (`:macks*`) lẫn query
   (`?mack=`) nhưng CHỈ query được `TheContainer.vue` xử lý đúng khi có `final_mack` đã lưu — khuyến nghị dùng
   query cho mọi liên kết sâu, hoặc báo dev sửa điều kiện ở `TheContainer.vue` dòng ~1382 để cũng loại trừ khi
   có path param.
2. **Chuyển tab không cập nhật URL** (TC_PTCB_13) — F5 giữa lúc đang ở tab khác "Thông tin chung" sẽ mất tab
   đang xem, quay về mặc định. Cùng pattern đã ghi nhận ở Nhật Ký GD (`TC_NKGD_06`).
3. **Feature-gating hoạt động ở NHIỀU CẤP khác nhau trong cùng 1 trang** — cấp shell (`index.vue`, 3/6 tab: Biểu
   đồ/So sánh/Bài viết & Phân tích) VÀ cấp widget con riêng của 1 số tab không hề bị khóa ở cấp shell (VD "4M &
   CANSLIM" — xem ghi chú TC_PTCB_16). Khi sinh testcase cho từng tab con, PHẢI kiểm tra lại gating ở đúng cấp
   widget, không giả định dựa theo `featureName` cấp shell.
4. **Dữ liệu `features_disabled` thật của tài khoản Free dùng chung hiện chỉ khóa 1 phần tính năng `fa_*`**
   (TC_PTCB_17) — KHÔNG khóa "Biểu đồ"/"So sánh" dù code hỗ trợ, dù `fa_4m_cansslim` (gating con của "4M &
   CANSLIM") LẠI có trong danh sách khóa. Cùng pattern đã ghi nhận nhiều lần ở các màn khác (Bảng Giá, Nhật Ký
   GD) — LUÔN đo thật `localStorage.features_disabled` thay vì suy đoán từ code khi viết testcase liên quan
   gói hội viên cho các tab con.
5. **"Mã CK đang xem" (`final_mack`) là setting server-side theo TÀI KHOẢN**, không phải theo browser
   session — mọi test ở màn này (và các màn khác dùng chung tài khoản test) có khả năng ảnh hưởng lẫn nhau khi
   chạy song song. Test nào cần giá trị xác định phải mock API thay vì dựa vào điều hướng thật (xem
   TC_PTCB_08).
6. **Không có icon "yêu thích" (star)/thông báo (chuông) riêng cho mã CK ở màn này trên web** — khác app (có
   cả 2 icon trên header). Xác nhận qua đọc `index.vue` + DOM thật, không phải thiếu sót khi kiểm kê.
7. **⚠️ ĐÍNH CHÍNH (2026-08-20, phát hiện khi sinh testcase riêng cho tab "4M & CANSLIM"):** ghi chú gốc ở mục
   3 phía trên (TC_PTCB_16) từng mô tả gate riêng của tab "4M & CANSLIM" là "chỉ 2 biểu đồ radar bị mờ, phần
   thang điểm + lịch sử vẫn hiển thị bình thường" — đo lại bằng automation thật (kiểm tra DOM/network, không
   chỉ nhìn ảnh chụp) xác nhận SAI: `<ProtectedView v-if="disable_featureName">` trong `FourmAndCanslim.vue`
   bọc **TOÀN BỘ** component ở cấp ngoài cùng (`.chart-wrapper` đo được 0 phần tử khi bị gate), API tính điểm
   thật KHÔNG được gọi. `ProtectedView` chỉ render 1 `<img>` mockup TĨNH được thiết kế sẵn trông giống layout
   thật (có số điểm mẫu + biểu đồ mẫu, đã "mờ" sẵn 2 vùng radar ngay trong nội dung ảnh) — dễ nhầm là "phần
   không-radar vẫn hiển thị thật" nếu chỉ xem ảnh chụp màn hình bề ngoài mà không kiểm tra DOM. Chi tiết đầy đủ:
   [phan-tich-co-ban-4m-canslim.md](phan-tich-co-ban-4m-canslim.md) TC_PTCB_4M_16/17. Bài học: khi 1 phát hiện
   dựa trên ảnh chụp màn hình (không phải đọc DOM/network trực tiếp), cần ghi rõ đó là suy luận từ ảnh để lượt
   sau biết cần xác minh lại kỹ hơn.

**Ngoài phạm vi lần sinh này:** nội dung chi tiết bên trong từng tab (6 tab, trong đó "Thông tin chung" còn có
7 sub-tab riêng) — xem danh sách tài liệu con sẽ sinh ở các lượt sau, liệt kê ở đầu file.
