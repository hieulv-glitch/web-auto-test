# Màn hình: Toàn cảnh thị trường — Ngành

- **URL:** `/nganh` — 1 trong 3 màn con của menu header "Toàn cảnh thị trường" (cùng `/bo-loc` = "Bộ lọc cổ
  phiếu" và `/suc-manh-dong-tien` = "Sức mạnh dòng tiền", 2 tài liệu riêng
  [toan-canh-thi-truong-bo-loc.md](toan-canh-thi-truong-bo-loc.md)/
  [toan-canh-thi-truong-suc-manh-dong-tien.md](toan-canh-thi-truong-suc-manh-dong-tien.md)). Cả 3 route dùng
  chung component với 3 giá trị prop `type` khác nhau ("department"/"stock"/"rrg") — tài liệu này CHỈ đào sâu
  nội dung riêng của `type="department"`.
- **Component:** [ibd/index.vue](../../stocks/src/views/ibd/index.vue) →
  [ibd/reactLayoutIBD.js](../../stocks/src/views/ibd/reactLayoutIBD.js) (khung flexlayout-react, dùng chung mọi
  route IBD) → [ibd/wrapperLayout.vue](../../stocks/src/views/ibd/wrapperLayout.vue) (chọn nhánh UI theo
  `type`) → **nội dung riêng "Ngành"**: [ibd/nganh/index.vue](../../stocks/src/views/ibd/nganh/index.vue) (2 tab
  "Tổng quan"/"Luân chuyển dòng tiền ngành") +
  [ibd/nganh/overview/tableNganh.vue](../../stocks/src/views/ibd/nganh/overview/tableNganh.vue) +
  [ibd/nganh/overview/rowItem.vue](../../stocks/src/views/ibd/nganh/overview/rowItem.vue) +
  [ibd/nganh/cashflow/tableLuanChuyen.vue](../../stocks/src/views/ibd/nganh/cashflow/tableLuanChuyen.vue) +
  [ibd/nganh/cashflow/rowItem.vue](../../stocks/src/views/ibd/nganh/cashflow/rowItem.vue).
- **Domain test:** https://kfsp.vn/nganh
- **Nguồn testcase gốc (app):** Không áp dụng — đã đọc tab "Thị Trường" trong Google Sheet nhưng toàn bộ nội
  dung tab đó nói về Dashboard chỉ số (VNINDEX: biểu đồ giá trong ngày, thanh khoản, tác động chỉ số, top cổ
  phiếu...), KHÔNG có testcase nào cho khái niệm "luân chuyển dòng tiền/RRG theo ngành" mà web có. Toàn bộ 🆕.
- **Phương pháp sinh:** Đọc source code + kiểm kê độc lập, xác nhận lại nhiều hành vi bằng Playwright thật
  (click sort, click badge, click tên ngành, hover tooltip) thay vì chỉ đọc code rồi đoán.
- **Quy ước trạng thái:** 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.
- **Phạm vi:**
  - Panel border phải ("IBD KungfuStocksPro" — Nhịp đập TT/Nỗ lực - Kết quả/Sức khỏe TT, 8 tab dọc IBD/Thông
    tin/Bài viết/Watchlist/Cảnh báo/Ghi chú/Cộng đồng/Chatbot) là hạ tầng flexlayout **dùng chung mọi route
    IBD**, đã test đầy đủ ở [bang-gia.md](bang-gia.md) Nhóm E (TC_BANGGIA_40-47) — **không lặp lại** ở đây.
  - Click "Tên ngành" điều hướng sang `/bo-loc?...` — chỉ verify URL đích đúng (hành vi xuất phát từ chính màn
    Ngành), **không** đi sâu nội dung `/bo-loc` (thuộc phạm vi tài liệu riêng của route đó).
  - Không đi sâu tính đúng nghiệp vụ của dữ liệu tài chính (điểm RS, % thay đổi thật...) — đó là domain riêng,
    không phải mục tiêu UI/E2E test.

---

## Nhóm A: Điều hướng menu header "Toàn cảnh thị trường"

# [TC_NGANH_01] Click menu "Toàn cảnh thị trường" điều hướng tới `/nganh`

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Từ 1 trang khác (`/bang-gia`), click trực tiếp vào label "Toàn cảnh thị trường" (không
  cần mở dropdown) điều hướng thẳng tới `/nganh` — đúng theo `<CHeaderNavLink to="/nganh">` bao cả label lẫn
  icon caret.

## Các bước thực hiện
1. Từ `/bang-gia`, click vào text "Toàn cảnh thị trường" trên thanh menu header.

## Kết quả mong đợi
- [ ] URL đổi thành `/nganh`.

---

# [TC_NGANH_02] Hover menu hiển thị dropdown 3 mục con đúng thứ tự

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Hover vào menu "Toàn cảnh thị trường".

## Kết quả mong đợi
- [ ] Hiển thị dropdown 3 mục theo đúng thứ tự: "Ngành", "Bộ lọc cổ phiếu", "Sức mạnh dòng tiền".

---

# [TC_NGANH_03] Menu "Toàn cảnh thị trường" ở trạng thái active khi đang ở `/nganh`

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Theo code, class `active-tab-overview` được áp dụng khi `$route.path` là 1 trong 3 route
  `/nganh`/`/bo-loc`/`/suc-manh-dong-tien` — testcase này chỉ verify tại `/nganh` (phạm vi tài liệu), 2 route
  còn lại xem tài liệu tương ứng.

## Các bước thực hiện
1. Vào `/nganh`, quan sát menu header "Toàn cảnh thị trường".

## Kết quả mong đợi
- [ ] Label "Toàn cảnh thị trường" có style active (class `active-tab-overview`).

---

## Nhóm B: 2 tab chính "Tổng quan" / "Luân chuyển dòng tiền ngành"

# [TC_NGANH_04] Mặc định tab "Tổng quan" active

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Vào `/nganh` lần đầu (chưa thao tác gì).

## Kết quả mong đợi
- [ ] Tab "Tổng quan" active mặc định, hiển thị bảng danh sách ngành (5 cột: Tên ngành/Trạng thái/Giá/Điểm RS/
      Nỗ lực - Kết quả).
- [ ] Tab "Luân chuyển dòng tiền ngành" hiển thị nhưng không active.

---

# [TC_NGANH_05] Chuyển sang tab "Luân chuyển dòng tiền ngành"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click tab "Luân chuyển dòng tiền ngành".

## Kết quả mong đợi
- [ ] Tab "Luân chuyển dòng tiền ngành" chuyển active, nội dung đổi sang bảng luân chuyển dòng tiền (cột Tên
      ngành + biểu đồ sparkline + nhiều cột ngày + MA10/MA20/MA50).
- [ ] Không lỗi JS, không mất dữ liệu tab "Tổng quan" nếu quay lại.

---

# [TC_NGANH_06] Giới hạn tính năng với tài khoản Free

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Theo code, cả 2 tab đều bọc `ProtectedView` (component `HoverImage`, hiển thị ảnh mờ + nút "Đăng
  ký ngay") khi `store.state.features_disabled` chứa key `nganh_tong_quan` (tab Tổng quan) hoặc
  `nganh_luan_chuyen_dong_tien` (tab Luân chuyển). Tài khoản test hiện tại không kích hoạt được nhánh Free này
  (`FREE_USER_EMAIL` trong `.env` đăng nhập thất bại — cùng hạn chế đã ghi nhận ở
  [dashboard-tab-thi-truong.md](dashboard-tab-thi-truong.md) TC_DASHBOARD_TT_14 và nhiều tài liệu khác).

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free.
2. Vào `/nganh`, xem lần lượt 2 tab.

## Kết quả mong đợi
- [ ] Cả 2 tab hiển thị ảnh mờ + text "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này." + nút "Đăng ký
      ngay" (mở modal gói cước) thay vì bảng dữ liệu thật.

---

## Nhóm C: Tab "Tổng quan" — bảng ngành

# [TC_NGANH_07] Hiển thị đủ 5 cột header

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Ở tab "Tổng quan" (mặc định), quan sát header bảng.

## Kết quả mong đợi
- [ ] Hiển thị đúng thứ tự 5 cột: "Tên ngành", "Trạng thái", "Giá", "Điểm RS", "Nỗ lực - Kết quả".

---

# [TC_NGANH_08] Format giá có dấu phẩy phân tách hàng nghìn

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát cột "Giá" của 1 dòng bất kỳ.

## Kết quả mong đợi
- [ ] Giá trị lớn hiển thị có dấu phẩy phân tách hàng nghìn (VD `227,339`), không có ký hiệu tiền tệ.

---

# [TC_NGANH_09] Màu cột "Điểm RS" theo ngưỡng 50

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Ghi chú:** Đọc code thấy `td` có class TĨNH `text-upchange` LUÔN có mặt, cộng thêm class ĐỘNG
  (`text-upchange` nếu `rss >= 50`, ngược lại `text-downchange`) — khi `rss < 50`, phần tử có ĐỒNG THỜI cả 2
  class `text-upchange text-downchange`. Đã đo `getComputedStyle(...).color` thực tế bằng Playwright (không chỉ
  đọc `class`, vì `class` không phản ánh đúng màu hiển thị do trùng lặp trên) và xác nhận **màu hiển thị vẫn
  đúng theo nghiệp vụ** (`rss>=50` → xanh `rgb(22, 202, 99)`, `rss<50` → đỏ `rgb(242, 28, 87)`) — class
  `text-downchange` khai báo sau nên thắng specificity, không phải bug hiển thị, chỉ là code hơi dư thừa.

## Các bước thực hiện
1. Đo `getComputedStyle` của ô "Điểm RS" cho nhiều dòng có `Điểm RS >= 50` và `< 50`.

## Kết quả mong đợi
- [ ] `Điểm RS >= 50` → màu chữ xanh (`rgb(22, 202, 99)`).
- [ ] `Điểm RS < 50` → màu chữ đỏ (`rgb(242, 28, 87)`).

---

# [TC_NGANH_10] Badge "Trạng thái" đúng 4 loại màu

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Class đo thực tế khớp đúng code (`getClassColorFromBadge`): "Dẫn dắt" → `bg-upchange`,
  "Phục hồi" → `bg-floorchange`, "Suy yếu" → `bg-nochange`, "Đội sổ" → `bg-downchange`.

## Các bước thực hiện
1. Quan sát/đo class badge "Trạng thái" của các dòng có đủ 4 giá trị khác nhau.

## Kết quả mong đợi
- [ ] Badge có class màu đúng ánh xạ ở trên cho từng giá trị trạng thái tương ứng.

---

# [TC_NGANH_11] Click "Tên ngành" điều hướng sang Bộ lọc cổ phiếu theo đúng ngành

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click tên ngành (VD "NĂNG LƯỢNG") điều hướng đúng tới
  `/bo-loc?type=chi-bao-ky-thuat&nganh=NĂNG%20LƯỢNG` (dùng `router.push` với `query.nganh` = tên ngành vừa
  click) — khớp đúng `gotoFilter()` trong code. Nội dung trang `/bo-loc` không thuộc phạm vi tài liệu này.

## Các bước thực hiện
1. Click vào tên 1 ngành bất kỳ trong cột "Tên ngành".

## Kết quả mong đợi
- [ ] URL đổi thành `/bo-loc` với query `type=chi-bao-ky-thuat` và `nganh=<tên ngành vừa click>`.

---

# [TC_NGANH_12] Click badge "Trạng thái" không có phản hồi UI — phát hiện đáng chú ý

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass (xác nhận hành vi, không phải lỗi JS)**
- **Kết quả đo được:** Click badge "Trạng thái" gọi `gotoRRG(ten_nganh)` (đổi state nội bộ `value_type_menu` +
  `department` trong `wrapperLayout.vue`), nhưng URL **không đổi** (giữ nguyên `/nganh`) và nội dung bảng
  **không đổi** — vì nhánh UI phản ứng với `value_type_menu` (`template v-if="type == 'ibd'"`) chỉ tồn tại khi
  route dùng prop `type="ibd"` (không phải trường hợp của `/nganh`, nơi `type="department"` render trực tiếp
  không qua nhánh đó). Đây gần như chắc chắn là **click chết** (dead click) không có tác dụng gì với người dùng
  cuối trên route `/nganh` — badge trông như 1 link/nút (có `cursor: pointer` kế thừa từ `tbody tr { cursor:
  pointer }`) nhưng bấm vào không có phản hồi nào, có thể gây khó hiểu cho người dùng.

## Các bước thực hiện
1. Ghi lại URL + nội dung bảng hiện tại.
2. Click vào badge "Trạng thái" của 1 dòng bất kỳ.
3. So sánh URL + nội dung bảng trước/sau.

## Kết quả mong đợi
- [ ] URL và nội dung bảng không đổi sau khi click (xác nhận hành vi hiện tại — **không khẳng định đây là thiết
      kế cố ý**, cần dev xác nhận lại có nên vô hiệu hoá `cursor: pointer`/`@click` cho ô này trên route
      `/nganh` hay không).

---

# [TC_NGANH_13] Click header cột sort đổi thứ tự tăng/giảm

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click header "Giá" lần 1 → sắp xếp GIẢM DẦN (227,339 → 15,087); click lần 2 → sắp xếp
  TĂNG DẦN (15,087 → 227,339); icon mũi tên đổi hướng tương ứng (mũi tên xoay khi giảm dần). Cả 5 cột đều khai
  báo `is_sort: true` trong code nên đều sort được (không chỉ riêng cột "Giá").

## Các bước thực hiện
1. Click header "Giá" (lần 1).
2. Đọc toàn bộ giá trị cột "Giá" theo thứ tự dòng, xác nhận giảm dần.
3. Click header "Giá" lần nữa.
4. Đọc lại, xác nhận tăng dần.

## Kết quả mong đợi
- [ ] Sau lần click 1: giá trị cột "Giá" sắp xếp giảm dần từ trên xuống.
- [ ] Sau lần click 2: sắp xếp tăng dần.

---

# [TC_NGANH_14] Hover cột "Nỗ lực - Kết quả" hiện tooltip chi tiết

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Hover vào biểu đồ thanh ở cột "Nỗ lực - Kết quả" tạo 1 `div#tooltip-chart` (DOM tự tạo
  bằng JS thuần, KHÔNG dùng thư viện tooltip chuẩn) hiển thị tên ngành + khối "Nỗ lực" (Trước đó/Hiện tại/%Thay
  đổi/Thay đổi ròng) + khối "Kết quả" (%Thay đổi) + số lượng mã tăng/đứng/giảm của ngành đó. Tooltip biến mất
  hoàn toàn khỏi DOM (không chỉ ẩn) khi rời chuột khỏi ô.

## Các bước thực hiện
1. Hover vào ô biểu đồ "Nỗ lực - Kết quả" của 1 dòng bất kỳ.
2. Đọc nội dung tooltip xuất hiện.
3. Di chuột ra khỏi ô.

## Kết quả mong đợi
- [ ] Tooltip hiển thị đúng tên ngành + đủ 2 khối "Nỗ lực"/"Kết quả" với số liệu.
- [ ] Tooltip biến mất khỏi DOM khi rời chuột.

---

## Nhóm D: Tab "Luân chuyển dòng tiền ngành" — bảng

# [TC_NGANH_15] Hiển thị cột động: Tên ngành + biểu đồ + N cột ngày + MA10/MA20/MA50

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Số cột ngày phụ thuộc dữ liệu server trả về tại thời điểm xem (quan sát được 9 cột ngày ở lần
  test), không cố định — testcase chỉ verify SỰ TỒN TẠI đúng cấu trúc (Tên ngành, cột biểu đồ không tên, ≥1 cột
  ngày dạng `YYYY-MM-DD`, MA10, MA20, MA50), không hard-code số lượng cột ngày.

## Các bước thực hiện
1. Ở tab "Luân chuyển dòng tiền ngành", quan sát header bảng.

## Kết quả mong đợi
- [ ] Cột đầu "Tên ngành", cột kế tiếp không tên (chứa biểu đồ sparkline).
- [ ] Có ít nhất 1 cột dạng ngày `YYYY-MM-DD` (kèm icon sort).
- [ ] 3 cột cuối "MA10", "MA20", "MA50".

---

# [TC_NGANH_16] 2 dòng đặc biệt VNINDEX / "Thanh khoản VNINDEX" luôn ở đầu bảng

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Đây là 2 dòng tham chiếu (không phải ngành thật) được `unshift` vào đầu `data_table` trong code
  — giá trị các cột ngày của 2 dòng này là **% thay đổi giá/thanh khoản VNINDEX** (số), khác với các dòng ngành
  phía dưới thể hiện **trạng thái RRG dạng chữ** (Dẫn dắt/Đội sổ/Phục hồi/Suy yếu) trên từng cột ngày — 2 loại
  dữ liệu khác bản chất cùng nằm chung 1 nhóm cột, xem thêm TC_NGANH_19.

## Các bước thực hiện
1. Quan sát 2 dòng đầu tiên của bảng.

## Kết quả mong đợi
- [ ] Dòng 1: "VNINDEX", các ô cột ngày hiển thị dạng phần trăm (VD `-0.19%`).
- [ ] Dòng 2: "Thanh khoản VNINDEX", các ô cột ngày cũng dạng phần trăm.

---

# [TC_NGANH_17] Biểu đồ sparkline theo từng ngành

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát cột biểu đồ (cột 2, không tên) của các dòng ngành (không phải VNINDEX/Thanh khoản VNINDEX).

## Kết quả mong đợi
- [ ] Mỗi dòng ngành hiển thị 1 biểu đồ đường nhỏ (sparkline) riêng, màu xanh/đỏ/vàng tuỳ xu hướng giá gần
      nhất; 2 dòng VNINDEX/Thanh khoản VNINDEX KHÔNG có biểu đồ ở cột này (ô trống).

---

# [TC_NGANH_18] Icon Trên/Dưới + tooltip cho cột MA10/MA20/MA50

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát các ô cột "MA10"/"MA20"/"MA50" của 1 dòng ngành có dữ liệu.

## Kết quả mong đợi
- [ ] Hiển thị icon: xanh (mũi tên lên) nếu giá đang ở trên đường MA tương ứng, đỏ (mũi tên xuống) nếu dưới.
- [ ] Thuộc tính `title` (tooltip) của icon là "Trên" hoặc "Dưới" tương ứng.

---

# [TC_NGANH_19] Click sort cột ngày — kết quả đo được, cần xác nhận lại thiết kế

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** Click icon sort trên 1 cột ngày (VD "2026-08-11") sắp xếp lại các dòng NGÀNH theo
  **nhóm text trạng thái RRG** ("Dẫn dắt"/"Đội sổ"/"Phục hồi"/"Suy yếu" tại đúng ngày đó, so sánh bằng
  `localeCompare`) — hợp lý vì giá trị thật của ô ở các dòng ngành là chữ trạng thái, không phải số. Tuy nhiên
  2 dòng "VNINDEX"/"Thanh khoản VNINDEX" (giá trị dạng % - số) **luôn đứng nguyên ở vị trí đầu bảng, không tham
  gia sắp xếp cùng nhóm** — vì hàm so sánh trong code (`isNaN(parseFloat(valueA)) && isNaN(parseFloat(valueB))`)
  chỉ xử lý khi CẢ 2 giá trị so sánh đều là chữ; khi so 1 dòng % (số) với 1 dòng chữ, hàm trả về `undefined`
  (JS coi như "không đổi vị trí tương đối", giữ nguyên do `Array.sort` ổn định). Đây là hành vi thật đo được
  bằng automation (không phải suy đoán), nhưng CHƯA RÕ có phải chủ đích thiết kế (2 dòng tham chiếu luôn ghim
  đầu bảng khi sort) hay là tác dụng phụ ngoài ý muốn của cách viết hàm so sánh — cần hỏi lại người phụ trách
  nghiệp vụ.

## Các bước thực hiện
1. Ghi lại thứ tự các dòng.
2. Click icon sort trên 1 cột ngày bất kỳ.
3. So sánh thứ tự trước/sau.

## Kết quả mong đợi
- [ ] 2 dòng "VNINDEX"/"Thanh khoản VNINDEX" vẫn ở đúng vị trí đầu bảng (dòng 1, 2) sau khi sort.
- [ ] Các dòng ngành phía dưới được nhóm lại theo giá trị trạng thái tại cột vừa click (cùng trạng thái đứng
      cạnh nhau).

---

# [TC_NGANH_20] Cột "Tên ngành" không sort được ở tab "Luân chuyển dòng tiền ngành"

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Khác với tab "Tổng quan" (cột "Tên ngành" CÓ sort), ở tab này `fields_table` không khai báo
  `type_sort` cho cột "Tên ngành" nên template render nhánh không click được (`v-if="!item.type_sort"`, không
  có icon mũi tên).

## Các bước thực hiện
1. Quan sát/click header "Tên ngành" ở tab "Luân chuyển dòng tiền ngành".

## Kết quả mong đợi
- [ ] Không có icon mũi tên sort cạnh "Tên ngành"; click vào header không đổi thứ tự dòng.

---

## Nhóm E: Hạ tầng dùng chung

# [TC_NGANH_21] Panel border phải — đã test đầy đủ ở tài liệu khác

- **Trạng thái:** 🆕 — không cần automation riêng, chỉ ghi chú tham chiếu.

## Các bước thực hiện
1. (Không thực hiện riêng — xem [bang-gia.md](bang-gia.md) TC_BANGGIA_40 đến TC_BANGGIA_47.)

## Kết quả mong đợi
- [ ] Panel "IBD KungfuStocksPro" ở `/nganh` hoạt động giống hệt `/bang-gia` (cùng component chia sẻ qua
      `reactLayoutIBD.js`).

---

## Tổng hợp trạng thái (21 testcase)

Đã tự động hoá bằng Playwright: [tests/toan-canh-thi-truong-nganh.spec.ts](../tests/toan-canh-thi-truong-nganh.spec.ts)
(dùng POM [pages/NganhPage.ts](../pages/NganhPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 19 | Đã verify bằng automation hoặc quan sát thực tế trực tiếp |
| ⚠️ Cần xác nhận thêm | 2 | TC_NGANH_06 (cần tài khoản Free hoạt động được), TC_NGANH_19 (hành vi sort đo được thật nhưng chưa rõ có phải chủ đích thiết kế) |

**Phát hiện đáng chú ý:**
1. **TC_NGANH_12 — click chết (dead click):** badge "Trạng thái" trong tab "Tổng quan" trông giống có thể
   click (kế thừa `cursor: pointer` của cả dòng, gọi hàm `gotoRRG`) nhưng trên route `/nganh` hoàn toàn không
   có tác dụng gì (không đổi URL, không đổi nội dung) — do state nó cập nhật (`value_type_menu`) chỉ được dùng
   ở nhánh UI khác (`type == 'ibd'`) không tồn tại trên route này. Có thể gây khó hiểu cho người dùng khi họ cố
   click vào đó mong đợi xem chi tiết RRG.
2. **TC_NGANH_09 — code dư thừa nhưng không gây lỗi hiển thị:** ô "Điểm RS" luôn có class tĩnh `text-upchange`
   cộng thêm class động, khiến khi `rss < 50` phần tử có ĐỒNG THỜI 2 class `text-upchange text-downchange` —
   đã đo màu thực tế bằng `getComputedStyle` và xác nhận vẫn hiển thị đúng màu theo nghiệp vụ (class sau thắng
   specificity), nên đây chỉ là code không gọn gàng, không phải bug người dùng nhìn thấy được.
3. **TC_NGANH_19 — sort cột ngày ở tab "Luân chuyển dòng tiền ngành" chỉ áp dụng cho các dòng NGÀNH (theo text
   trạng thái RRG), 2 dòng tham chiếu VNINDEX/Thanh khoản VNINDEX luôn ghim ở đầu bảng bất kể sort** — hành vi
   nhất quán, đo lặp lại nhiều lần cho kết quả giống nhau, nhưng cần xác nhận với người phụ trách nghiệp vụ đây
   có phải chủ đích hay tác dụng phụ của cách viết hàm so sánh (xem chi tiết ở TC_NGANH_19).
