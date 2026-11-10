# Màn hình: Phân tích cơ bản — Tab "So sánh"

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=so-sanh` (khuyến nghị dùng query, xem ghi chú an toàn bên dưới).
- **Component:** [stocks/src/views/faAnalysis/Compare/index.vue](../../stocks/src/views/faAnalysis/Compare/index.vue)
  (`name: "Compare"`), mount trong shell [index.vue](../../stocks/src/views/faAnalysis/index.vue) khi
  `active_tab['compare']` bật (chỉ mount 1 lần, `v-if`, sau đó chỉ toggle `v-show`).
- **Domain test:** `PREV2_BASE_URL` (từ 09/11/2026 = https://kfsp.vn, bản preprod mới nhất, backend production), đăng nhập qua `Prev2Session` (`TEST_USER_*` / `FREE_USER_*`).
- **Mức xác nhận:** đã chạy pass trên **kfsp.vn** ngày 09/11/2026. kfsp.vn đã được xác minh là bản preprod mới nhất, deploy 06/11 lúc 10:30 GMT. Spec dùng `PREV2_BASE_URL=https://kfsp.vn` trong `.env`; backend là production, như mọi lần. Kết quả: 26 pass + 1 fixme (TC_15). TC_21 tăng thời gian chờ nhãn "Đang chọn" lên 30 giây: sau "Nạp" cả tab hiện spinner tới khi API so sánh thật trả về.
- **Cập nhật 09/11/2026 (Nhánh B):** preprod chỉ đổi nhỏ ở tab này (nút bo tròn, API chuyển NestJS, focus sẵn ô nhập mã khi mở modal "Thêm mã", thanh cuộn ngang phía trên bảng dính đỉnh + đồng bộ cuộn). **Toast thành công đã tắt toàn app** (`main.js`, 12/10/2026) → TC_19/TC_22 không còn chờ toast. Thêm TC_27, TC_28.
- **Nguồn testcase gốc (app):** Google Sheet, tab "Phân Tích FA(Cổ Phiếu)", các dòng TC ID 169-190 ("Tab So
  sánh"). Sheet chỉ dùng tham khảo văn phong/không bỏ sót khía cạnh — độ phủ thật sự do tự kiểm kê source code
  (`Compare/index.vue` đầy đủ `data()`/`computed`/`methods`/mọi API) + DOM thật (`inspect-dom.ts` +
  script Playwright tạm thời đo network/socket) quyết định. Web KHÔNG có khái niệm "app" 1-1: web thêm hẳn tính
  năng "Lưu mẫu"/"Mở mẫu" (lưu danh sách so sánh có tên, gọi API riêng `save_compare/*`) mà Sheet app không hề
  nhắc tới.
- **Quy ước trạng thái:** giống `phan-tich-co-ban.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng web) ·
  ⚠️ Cần xác nhận thêm.
- **⚠️ AN TOÀN DỮ LIỆU — API mutate của tab này:** `POST .../save_compare/store` (lưu mẫu mới), `PUT
  .../save_compare/update` (cập nhật mẫu), `DELETE .../save_compare/destroy` (xoá mẫu) đều ghi dữ liệu THẬT vào
  tài khoản test DÙNG CHUNG. Mọi testcase động tới các API này đều mock qua `page.route()` (`route.abort()` mặc
  định hoặc `route.fulfill()` giả lập thành công khi cần quan sát UI) — KHÔNG có request mutate thật nào lọt ra
  production trong toàn bộ file spec này. `GET .../save_compare/get-templates` và `GET .../api/stocks/compare`
  chỉ đọc dữ liệu, an toàn để gọi thật.
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md) — mọi test đổi "mã CK đang xem" (kể cả thao tác BẮT BUỘC ở
  TC_PTCB_SS_02/03 bên dưới để lách bug race condition) đều là thao tác XEM (không mutate), an toàn cho tài
  khoản chung, nhưng có thể ảnh hưởng tới `final_mack` mà test khác đang kỳ vọng nếu chạy song song — các test
  trong file này chọn lại đúng `VNM` (mã trung tính, không đổi sang mã khác trừ khi testcase yêu cầu) để giảm
  nhiễu.

## ⚠️ Phát hiện đáng chú ý — BUG THẬT (đọc trước khi viết/chạy bất kỳ test nào của tab này)

**[BUG] Deep-link/full-reload thẳng vào `?tab=so-sanh` khiến bảng dữ liệu so sánh TRỐNG VĨNH VIỄN trong suốt
session đó** — xác nhận 100% qua automation (đo bằng script Playwright tạm thời theo dõi network + websocket
frame, xem chi tiết TC_PTCB_SS_02). Tóm tắt cơ chế:

1. `Compare.created()` gọi `getAll()` NGAY LẬP TỨC lúc component mount. `getAll()` đọc ĐỒNG BỘ
   `store.state.list_mack_company.hasOwnProperty(store.state.mack)` để tính `type_mack` (`"nonbank"` |
   `"bank"` | `"stock"` | `"insurance"`), rồi set `store.state.type_mack = type`.
2. `store.state.list_mack_company` (VÀ `list_mack`, `data_eod`) chỉ được nạp dữ liệu thật BẤT ĐỒNG BỘ, qua
   `TheContainer.getAllMack()` (socket `"getallstockcode"`, gọi 1 lần trong `created()` của `TheContainer`).
3. Khi vào trang bằng 1 lượt tải trang đầy đủ (full page load — CHÍNH XÁC pattern `page.goto()`/`fa.goto()` mà
   TOÀN BỘ các test hiện có trong dự án dùng để deep-link), `TheContainer` và `Compare` mount GẦN NHƯ ĐỒNG THỜI
   → `list_mack_company` CHẮC CHẮN còn rỗng lúc bước 1 chạy → `type_mack` bị set cứng thành `""`.
4. `computed: items_table` trong `Compare/index.vue` chỉ trả dữ liệu khi `type_mack` khớp ĐÚNG 1 trong 4 giá trị
   trên (đọc từ `compareJson.json`); không có nhánh `else` — nếu `type_mack === ""`, `items_table` trả về `[]`
   **MÃI MÃI cho tới hết session**, vì `type_mack` không có bất kỳ cơ chế tính lại nào khác ngoài việc gọi lại
   `getAll()`.
5. `getAll()` CHỈ được gọi lại khi: (a) đổi mã CK (qua `watch: "$store.state.mack"` → `mackChange()`), hoặc (b)
   bấm nút "Lưu" trong modal "Thêm mã". Vì vậy bảng dữ liệu (phần thân `<tbody>`) **trống hoàn toàn** — header
   cột (`fields_table`, phụ thuộc API REST `/api/stocks/compare` riêng, không phụ thuộc socket) vẫn hiển thị
   bình thường, khiến bug này DỄ BỊ BỎ SÓT nếu chỉ nhìn header.
6. **Đã đo xác nhận: chờ tới 30+ giây KHÔNG tự phục hồi.** Cách DUY NHẤT phục hồi trong cùng session: đổi mã CK
   qua ô search (khi đó `list_mack_company` chắc chắn đã nạp xong) — xem TC_PTCB_SS_03 và
   `FaAnalysisPage.waitForCompareDataReady()`.
7. **Khuyến nghị báo dev:** thêm nhánh `else` gán giá trị mặc định hợp lý cho `items` trong `items_table`
   computed, HOẶC (tốt hơn) đổi `getAll()` thành watch/computed phản ứng với `list_mack_company` thay vì đọc nó
   1 lần đồng bộ lúc `created()`.

Vì bug này, MỌI testcase bên dưới cần bảng CÓ dữ liệu thật đều gọi `fa.waitForCompareDataReady()` (helper mới
trong `FaAnalysisPage`) ngay sau `fa.goto({..., tabQuery: 'so-sanh'})` — đây KHÔNG phải "che bug" mà là bước bắt
buộc để tách biệt bug đã ghi nhận riêng (TC_PTCB_SS_02) khỏi các testcase khác đang kiểm tra tính năng CHỨC NĂNG
của bảng (nếu không tách, mọi test khác sẽ fail giả vì bảng luôn trống).

---

## Nhóm: Tổng quan tab So sánh

# [TC_PTCB_SS_01] Overview tab So sánh (sau khi bảng đã có dữ liệu)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 169, 170 (Sheet)
- **Khác biệt so với app:** App liệt kê 4 cột mặc định "Thông tin, CHỈ SỐ NGÀNH, BVH, MIG". Web có **5 cột mặc
  định** (Thông tin, Đơn vị, Biểu đồ, Chỉ số ngành) + N cột mã (mặc định mã đang xem + 4 mã gợi ý cùng
  ngành/nhóm do server trả về, không cố định giống MIG của app). Web còn có thêm 2 nút "Mở mẫu"/"Lưu mẫu" mà
  Sheet app không nhắc tới (tính năng lưu danh sách so sánh riêng của web).

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=so-sanh`.
2. Gọi `waitForCompareDataReady()` (đổi mã CK về VNM qua search để lách bug TC_PTCB_SS_02).

## Kết quả mong đợi
- [ ] Hiển thị 3 nút: "Mở mẫu", "Lưu mẫu", "Thêm mã" (nền tím) ở góc trên.
- [ ] Header bảng gồm 4 cột cố định: "Thông tin", "Đơn vị", "Biểu đồ", "Chỉ số ngành", theo sau là cột mã đang
      xem (VNM) + các mã so sánh mặc định server trả về.
- [ ] `<tbody>` có dữ liệu thật: dòng đầu "Cập nhật đến" (kèm quý/năm mỗi mã), tiếp theo các dòng nhóm chỉ tiêu
      với header màu đỏ (VD "Định giá", "Doanh thu và lợi nhuận", "Chỉ tiêu Hiệu quả", "Chỉ tiêu Thanh toán"),
      mỗi nhóm có nhiều dòng chỉ tiêu con (VD "Giá thị trường (D)", "PE (D)", "ROE (TTM)"...) với giá trị số +
      icon biểu đồ sparkline nhỏ ở cột "Biểu đồ".

---

# [TC_PTCB_SS_02] ⚠️ [BUG] Deep-link thẳng vào tab So sánh khiến bảng dữ liệu trống vĩnh viễn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, PHÁT HIỆN BUG THẬT: Pass (test xác nhận đúng
  hành vi lỗi)**
- **⚠️ Phát hiện đáng chú ý (bug thật):** xem phân tích đầy đủ ở đầu tài liệu. Tóm tắt: `page.goto()` thẳng vào
  `/phan-tich-co-ban?mack=VNM&tab=so-sanh` (1 lượt tải trang, không qua điều hướng SPA) khiến `Compare.getAll()`
  tính `type_mack = ""` do đọc `list_mack_company` trước khi nó kịp nạp — bảng `<tbody>` trống hoàn toàn, header
  cột vẫn hiển thị bình thường (dễ gây nhầm "trang tải xong, chỉ chưa có mã nào để so sánh"). Đã đo xác nhận chờ
  30 giây KHÔNG tự phục hồi.

## Các bước thực hiện
1. Đăng nhập, điều hướng thẳng `/phan-tich-co-ban?mack=VNM&tab=so-sanh` (1 lượt `page.goto`, KHÔNG thao tác gì
   thêm).
2. Chờ 20 giây.

## Kết quả mong đợi (hành vi THẬT — bug)
- [ ] Header bảng (`thead`) hiển thị bình thường (4 cột cố định + cột mã).
- [ ] `<tbody>` HOÀN TOÀN TRỐNG (0 dòng) dù đã chờ 20 giây — không tự phục hồi.

---

# [TC_PTCB_SS_03] Đổi mã CK giúp bảng tự phục hồi sau bug TC_PTCB_SS_02

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Xác nhận cơ chế phục hồi DUY NHẤT của bug trên — đổi mã CK (dù đổi VỀ ĐÚNG mã đang xem) qua ô
  search trigger `watch: "$store.state.mack"` → `mackChange()` → gọi lại `getAll()`, lúc này
  `list_mack_company` đã chắc chắn nạp xong (vì phải gõ + có gợi ý hiện ra mới chọn được, tức `list_mack` —
  nạp cùng lúc với `list_mack_company` trong `TheContainer.getAllMack()` — đã sẵn sàng). Đây là cơ sở của
  `FaAnalysisPage.waitForCompareDataReady()` dùng xuyên suốt các testcase khác trong file này.

## Các bước thực hiện
1. Deep-link thẳng vào tab So sánh (lặp lại TC_PTCB_SS_02, xác nhận bảng trống).
2. Gõ "VNM" vào ô search, chọn gợi ý "VNM".

## Kết quả mong đợi
- [ ] Sau bước 2, `<tbody>` có dữ liệu thật (số dòng > 0) trong vòng vài giây.

---

## Nhóm: Bảng dữ liệu so sánh

# [TC_PTCB_SS_04] Click tên mã ở header mở modal biểu đồ TradingView dùng chung toàn site

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `showModalTradingChart(mack)` set `store.state.mackTradingChart`/`isShowModalTradingChart = true`
  — modal biểu đồ TOÀN SITE (đã ghi chú trong `FaAnalysisPage.searchInput`, cùng cơ chế input "Mã CK" ẩn thứ 2
  luôn tồn tại trong DOM). Test chỉ verify modal MỞ ĐƯỢC, không đi sâu nội dung modal (ngoài phạm vi tab này).

## Các bước thực hiện
1. Chuẩn bị bảng có dữ liệu (`waitForCompareDataReady`).
2. Click tên mã "VNM" ở header bảng.

## Kết quả mong đợi
- [ ] 1 modal mới xuất hiện (chứa nội dung liên quan biểu đồ), không lỗi console.

---

# [TC_PTCB_SS_05] Giới hạn 6 dòng + block nâng cấp gói hội viên với tài khoản Free

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **⚠️ Phát hiện đáng chú ý:** Gate này dùng cờ `$store.state.isAccountFree` (boolean đơn giản: tài khoản có
  phải gói Free hay không) — **HOÀN TOÀN ĐỘC LẬP** với cơ chế `features_disabled['fa_so_sanh']` cấp shell mà
  `phan-tich-co-ban.md` (TC_PTCB_17) đã đo xác nhận KHÔNG khoá tab "So sánh" cho tài khoản Free hiện tại. Kết
  quả: dù tab "So sánh" KHÔNG bị `ProtectedView` che ở cấp shell, tài khoản Free VẪN LUÔN bị giới hạn hiển thị
  tối đa 6 dòng dữ liệu (`items_table.slice(0, 6)`) + 1 dòng cuối hiện block "Bạn cần nâng cấp gói hội viên để
  sử dụng chức năng này" + nút "Nâng cấp ngay" (`UpdateRequire` component, `feature="fa_so_sanh"`) — cùng
  pattern gating "nhiều cấp trong 1 trang" đã ghi nhận ở "4M & CANSLIM" (TC_PTCB_16).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Vào tab "So sánh", chuẩn bị bảng có dữ liệu (`waitForCompareDataReady`).

## Kết quả mong đợi
- [ ] `<tbody>` có tối đa 7 `<tr>`: 6 dòng dữ liệu + 1 dòng chứa block "Bạn cần nâng cấp gói hội viên..." + nút
      "Nâng cấp ngay".

---

## Nhóm: Modal "Thêm mã" (Nhập dữ liệu)

# [TC_PTCB_SS_06] Mở modal "Thêm mã" hiển thị đúng cấu trúc

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 171, 172 (Sheet)
- **Khác biệt so với app:** App mô tả popup tên "Thêm mã chứng khoán". Web đặt tên modal là **"Nhập dữ liệu"**
  (khác hẳn tên nút mở nó — "Thêm mã" — và khác tên app dùng). Ghi chú của app ở TC 171 ("thêm mã thành công rồi
  nhưng không hiển thị ngoài danh sách") khá giống hành vi web quan sát được (xem TC_PTCB_SS_13): web YÊU CẦU
  bấm "Lưu" trong modal mới áp dụng mã mới thêm lên bảng chính — chọn gợi ý xong KHÔNG tự cập nhật bảng ngay.

## Các bước thực hiện
1. Click nút "Thêm mã".

## Kết quả mong đợi
- [ ] Modal "Nhập dữ liệu" hiện ra, gồm: input "Mã chứng khoán" (placeholder "Thêm mã vào danh sách"), tiêu đề
      "Danh sách mã", danh sách các mã hiện có (dòng đầu = mã đang xem, không có icon xoá; các dòng sau = mã đã
      thêm, có icon xoá "✕"), ghi chú "*Lưu ý: Khi so sánh các mã khác ngành hệ thống sẽ không hiển thị chỉ số
      ngành của mã đang xem", 2 nút footer "Đóng"/"Lưu".

---

# [TC_PTCB_SS_07] Gõ mã trong modal hiện đúng gợi ý

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 173 (Sheet)

## Các bước thực hiện
1. Mở modal "Thêm mã".
2. Gõ "fpt" vào ô search.

## Kết quả mong đợi
- [ ] Danh sách gợi ý hiện mã "FPT" kèm tên công ty.

---

# [TC_PTCB_SS_08] Gõ mã không tồn tại trong modal không ra gợi ý nào

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 176, 179 (Sheet)

## Các bước thực hiện
1. Mở modal "Thêm mã".
2. Gõ "ZZZZZZ999" vào ô search.

## Kết quả mong đợi
- [ ] Không có gợi ý nào hiển thị.

---

# [TC_PTCB_SS_09] Chọn gợi ý thêm mã vào "Danh sách mã"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 174 (Sheet)
- **Khác biệt so với app:** App kỳ vọng "Mã FPT được thêm vào bảng so sánh" NGAY. Web chỉ thêm vào "Danh sách
  mã" TRONG MODAL (`myArray`, chưa gọi lại API) — phải bấm "Lưu" (xem TC_PTCB_SS_13) mới áp dụng lên bảng
  chính, khớp đúng ghi chú của app ở TC 171 về hành vi tương tự.

## Các bước thực hiện
1. Mở modal "Thêm mã", gõ "fpt", chọn gợi ý "FPT".

## Kết quả mong đợi
- [ ] "Danh sách mã" trong modal có thêm dòng "FPT".
- [ ] Ô input tự xoá về rỗng sau khi chọn.

---

# [TC_PTCB_SS_10] Không cho thêm trùng mã đã có trong Danh sách mã

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `suggestionClick()`/`enter()` đều có bước kiểm tra `resultSearch` (so khớp mã đang xem + từng mã
  trong `myArray`) trước khi `push` — chọn lại 1 mã đã có trong danh sách (kể cả mã đang xem) sẽ KHÔNG thêm
  trùng dòng.

## Các bước thực hiện
1. Mở modal "Thêm mã".
2. Gõ đúng mã đang xem (VNM) và chọn gợi ý VNM.

## Kết quả mong đợi
- [ ] "Danh sách mã" KHÔNG xuất hiện dòng "VNM" thứ 2 (chỉ còn đúng 1 dòng VNM — dòng mã đang xem có sẵn).

---

# [TC_PTCB_SS_11] Xoá mã khỏi Danh sách mã bằng icon "✕"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 175 (Sheet)

## Các bước thực hiện
1. Mở modal "Thêm mã".
2. Click icon "✕" cạnh 1 mã đã thêm (không phải mã đang xem).

## Kết quả mong đợi
- [ ] Mã đó biến mất khỏi "Danh sách mã".

---

# [TC_PTCB_SS_12] Mã đang xem trong Danh sách mã không có icon xoá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Template tách riêng dòng mã đang xem (`CListGroupItem` đứng ngoài `<draggable>`, ô cuối
  `<td>` rỗng không `@click`) khỏi các dòng `myArray` (trong `<draggable>`, ô cuối có icon `cilXCircle`
  `@click="removeAt(index)"`) — không thể xoá hay kéo-thả sắp xếp lại mã đang xem.

## Các bước thực hiện
1. Mở modal "Thêm mã".
2. Quan sát dòng đầu tiên (mã đang xem).

## Kết quả mong đợi
- [ ] Dòng mã đang xem KHÔNG có icon xoá "✕" (khác các dòng mã đã thêm bên dưới).

---

# [TC_PTCB_SS_13] Nhấn "Lưu" trong modal áp dụng đúng danh sách mã mới vào bảng chính

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** liên quan TC 174 (Sheet)
- **Ghi chú:** Nút "Lưu" trong modal gọi `getAll()` (GET `/api/stocks/compare` với `mack[]` = mã đang xem + toàn
  bộ `myArray` hiện tại) — API đọc, AN TOÀN để gọi thật, không cần mock.

## Các bước thực hiện
1. Mở modal "Thêm mã", thêm mã "FPT" (khác ngành với VNM).
2. Click "Lưu".

## Kết quả mong đợi
- [ ] Modal đóng lại, bảng chính refresh — do FPT khác ngành với VNM, 2 cột "Biểu đồ"/"Chỉ số ngành" biến mất
      khỏi header (xem thêm ghi chú `is_diff_department` trong `items_table`/`fields_table`).

---

# [TC_PTCB_SS_14] ⚠️ Nhấn "Đóng" (không Lưu) vẫn giữ nguyên thay đổi Danh sách mã khi mở lại modal

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **Tham chiếu App:** TC 177 (Sheet) — **khác biệt hành vi:** app chỉ mô tả "Popup đóng lại, về bảng so sánh",
  không đề cập việc dữ liệu có được giữ lại hay không.
- **⚠️ Phát hiện đáng chú ý:** `myArray` (danh sách mã đang chỉnh trong modal) là 1 data property SỐNG của toàn
  component `Compare`, KHÔNG bị reset khi đóng modal qua nút "Đóng" (`warningModal = false` — chỉ ẩn modal,
  không revert `myArray`). Vì vậy: thêm 1 mã trong modal rồi bấm "Đóng" (không "Lưu") → bảng chính KHÔNG đổi
  (đúng như mong đợi, vì chưa gọi lại `getAll()`) — NHƯNG mở lại modal "Thêm mã" lần sau, mã vừa thêm VẪN CÒN
  trong "Danh sách mã" (không bị revert). Đây là hành vi thật của code (không phải bug ngẫu nhiên), nhưng có
  thể gây nhầm lẫn cho người dùng nghĩ rằng "Đóng" = huỷ thao tác.

## Các bước thực hiện
1. Mở modal "Thêm mã", thêm mã "FPT".
2. Click "Đóng" (KHÔNG click "Lưu").
3. Mở lại modal "Thêm mã".

## Kết quả mong đợi
- [ ] Sau bước 2: bảng chính ở header KHÔNG có cột "FPT" (chưa áp dụng).
- [ ] Sau bước 3: "Danh sách mã" trong modal VẪN CÒN "FPT" (thay đổi không bị huỷ dù đã "Đóng" không "Lưu").

---

# [TC_PTCB_SS_15] Kéo-thả sắp xếp lại thứ tự mã trong Danh sách mã

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **`test.fixme`, chưa tự động hoá**
- **Lý do chưa tự động hoá:** Danh sách dùng `vuedraggable` (HTML5-based, không phải chuẩn HTML5 Drag & Drop
  API) — Playwright hỗ trợ hạn chế với cơ chế kéo-thả bằng `mousedown`/`mousemove`/`mouseup` mô phỏng của thư
  viện này (khác `dispatchEvent` cho HTML5 DnD chuẩn), cùng pattern đã ghi nhận ở TC_BANGGIA_37 (kéo-thả bảng
  giá). Cần thêm thời gian thử nghiệm `mouse.move` với nhiều bước nhỏ (steps) để trigger đúng sự kiện của
  `vuedraggable`/Sortable.js.

## Các bước thực hiện (dự kiến)
1. Mở modal "Thêm mã" với ≥ 2 mã đã thêm.
2. Kéo 1 dòng mã lên trên dòng khác.

## Kết quả mong đợi (dự kiến)
- [ ] Thứ tự trong "Danh sách mã" đổi theo đúng thao tác kéo-thả.

---

## Nhóm: "Lưu mẫu" / "Mở mẫu" (tính năng riêng của web, không có trong app)

# [TC_PTCB_SS_16] Click "Lưu mẫu" lần đầu (chưa chọn mẫu nào) mở modal "Thêm mẫu mới"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `handleSaveClick()`: nếu `selected_item.id == -1` (mặc định, chưa "Nạp" mẫu nào) → mở modal
  "Thêm mẫu mới" thay vì lưu trực tiếp.

## Các bước thực hiện
1. Click "Lưu mẫu" (chưa từng "Nạp" mẫu nào trước đó).

## Kết quả mong đợi
- [ ] Modal "Thêm mẫu mới" hiện ra với input "Tên mẫu mới" (placeholder "Nhập tên mẫu").

---

# [TC_PTCB_SS_17] "Thêm mẫu mới" — để trống tên báo lỗi

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `addNewRow()` check `value_add_new == ""` → toast lỗi "Bạn cần nhập nội dung", KHÔNG gọi API.

## Các bước thực hiện
1. Mở modal "Thêm mẫu mới", để trống input tên.
2. Click "Thêm mới".

## Kết quả mong đợi
- [ ] Toast lỗi "Bạn cần nhập nội dung" hiện ra, modal KHÔNG đóng, không có request `POST save_compare/store`
      nào được gửi.

---

# [TC_PTCB_SS_18] "Thêm mẫu mới" — tên trùng báo lỗi

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock `get-templates` trả về 1 mẫu tên trước):
  Pass**
- **Ghi chú:** `addNewRow()` loop qua `item_table` (danh sách mẫu đã tải) so khớp `label` trước khi gọi API —
  mock `GET get-templates` trả về sẵn 1 mẫu tên "Mẫu test A" để có dữ liệu ổn định kiểm tra trùng tên (không
  phụ thuộc mẫu thật của tài khoản, vốn đang rỗng).

## Các bước thực hiện
1. Mock `GET .../save_compare/get-templates` trả về 1 mẫu tên "Mẫu test A".
2. Mở modal "Thêm mẫu mới", nhập đúng "Mẫu test A".
3. Click "Thêm mới".

## Kết quả mong đợi
- [ ] Toast lỗi "Tên mẫu đã tồn tại!" hiện ra, không gọi API `store`.

---

# [TC_PTCB_SS_19] Lưu mẫu mới thành công (mock API, không ghi dữ liệu thật)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Mock `POST .../save_compare/store` trả về thành công giả — KHÔNG có request thật nào lọt ra
  production (mọi request khác tới cùng endpoint bị `route.abort()` mặc định trong `beforeEach`).

## Các bước thực hiện
1. Mock `POST .../save_compare/store` trả về `{id, label, list_mack}` giả lập thành công.
2. Mở modal "Thêm mẫu mới", nhập tên hợp lệ ("[TEST] Mẫu tạm").
3. Click "Thêm mới".

## Kết quả mong đợi
- [ ] Modal đóng lại, KHÔNG có toast thành công (đã tắt toàn app từ 12/10/2026 — trước đây hiện "Thêm mẫu mới thành công").
- [ ] Dòng "Đang chọn: [TEST] Mẫu tạm" + link "Bỏ chọn" xuất hiện dưới 3 nút đầu trang.

---

# [TC_PTCB_SS_20] Click "Mở mẫu" — trạng thái rỗng thật (tài khoản test hiện chưa có mẫu nào)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (dữ liệu thật, an toàn — chỉ GET): Pass**
- **Ghi chú:** Test bằng dữ liệu THẬT của tài khoản test — tại thời điểm viết testcase, tài khoản chưa lưu mẫu
  nào (`GET get-templates` trả `[]` thật). An toàn vì chỉ đọc.

## Các bước thực hiện
1. Click "Mở mẫu".

## Kết quả mong đợi
- [ ] Modal "Danh sách đã lưu" hiện ra, bảng có 2 cột "Tên"/"Quản lý", hiển thị "Không có dữ liệu".

---

# [TC_PTCB_SS_21] "Mở mẫu" hiển thị danh sách mẫu đã lưu + "Nạp" tải mẫu

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock `get-templates`): Pass**
- **Ghi chú:** Mock `GET get-templates` trả về 1 mẫu giả (`list_mack` chứa VNM + FPT) để kiểm tra `loadItem()`
  mà không phụ thuộc dữ liệu thật (đang rỗng) của tài khoản.

## Các bước thực hiện
1. Mock `GET .../save_compare/get-templates` trả về 1 mẫu "Mẫu giả B" (`list_mack: [{mack:"VNM"},{mack:"FPT"}]`).
2. Click "Mở mẫu", click "Nạp" ở dòng "Mẫu giả B".

## Kết quả mong đợi
- [ ] Modal đóng lại, "Danh sách mã" (nếu mở lại modal "Thêm mã") phản ánh đúng mẫu đã nạp.
- [ ] Dòng "Đang chọn: Mẫu giả B" xuất hiện.

---

# [TC_PTCB_SS_22] Xoá mẫu trong "Mở mẫu" — có modal xác nhận, gọi API xoá (mock, không đụng dữ liệu thật)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock `get-templates` + `destroy`): Pass**

## Các bước thực hiện
1. Mock `GET get-templates` trả về 1 mẫu "Mẫu giả C"; mock `DELETE .../save_compare/destroy` trả về thành công.
2. Click "Mở mẫu", click "Xóa" ở dòng "Mẫu giả C".

## Kết quả mong đợi
- [ ] Modal "Thông báo" xác nhận ("Bạn có muốn xóa không?") hiện ra trước khi xoá thật.
- [ ] Sau khi xác nhận "Xóa": modal xác nhận đóng, dòng "Mẫu giả C" biến mất khỏi danh sách trong modal, KHÔNG có toast thành công (trước đây "Đã xóa thành công").

---

## Nhóm: Lỗi mạng / trạng thái đặc biệt

# [TC_PTCB_SS_23] Mất mạng khi tải bảng so sánh không crash, nhưng KHÔNG có thông báo lỗi cho người dùng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý (UX gap, không phải crash):** `getAll().catch()` chỉ `console.error(err)` +
  `self.is_loading = false` — KHÔNG gọi `this.$toast.error(...)` như các API khác trong cùng file (VD
  `getList()`, `deleteRowItem()` đều có toast lỗi). Người dùng mất mạng lúc tải bảng so sánh sẽ thấy trang
  ngưng loading nhưng KHÔNG có bất kỳ thông báo nào giải thích vì sao bảng trống — dễ nhầm với bug
  TC_PTCB_SS_02 ở trên (2 nguyên nhân hoàn toàn khác nhau nhưng triệu chứng giống hệt: bảng trống, không lỗi
  hiển thị).

## Các bước thực hiện
1. Chặn `GET .../api/stocks/compare` (`route.abort()`).
2. Vào tab "So sánh".

## Kết quả mong đợi
- [ ] Không có lỗi JS console (`pageerror`).
- [ ] Loading tắt sau vài giây, bảng trống, KHÔNG có toast/thông báo lỗi nào hiển thị cho người dùng.

---

# [TC_PTCB_SS_24] Lỗi 500 khi tải danh sách mẫu đã lưu hiện toast lỗi

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `getList().catch()` CÓ gọi `this.$toast.error("Có lỗi xảy ra, vui lòng thử lại")` — khác
  `getAll()` ở TC_PTCB_SS_23 (thiếu nhất quán giữa các API trong cùng file).

## Các bước thực hiện
1. Mock `GET .../save_compare/get-templates` trả lỗi 500.
2. Tải lại tab "So sánh" (để `getList()` trong `created()` chạy lại) hoặc click "Mở mẫu".

## Kết quả mong đợi
- [ ] Toast lỗi "Có lỗi xảy ra, vui lòng thử lại" hiện ra, không crash console.

---

# [TC_PTCB_SS_25] Loading state hiển thị khi bảng đang tải chậm

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `is_loading` mặc định `true`, hiện component `<Loading />` (chiều cao cố định 400px) thay cho cả
  3 nút + bảng cho tới khi `getAll()` resolve/reject.

## Các bước thực hiện
1. Mock `GET .../api/stocks/compare` delay 3 giây trước khi trả kết quả thật.
2. Vào tab "So sánh", quan sát ngay sau khi vào.

## Kết quả mong đợi
- [ ] Trong lúc chờ: hiển thị loading indicator, KHÔNG hiển thị 3 nút "Mở mẫu"/"Lưu mẫu"/"Thêm mã" hay bảng.
- [ ] Sau khi response về: loading biến mất, 3 nút + bảng hiện ra bình thường.

---

# [TC_PTCB_SS_27] Mở modal "Thêm mã" → ô nhập mã được focus sẵn

- **Trạng thái:** 🆕 Testcase mới (09/11/2026)
- **Ghi chú:** `watch warningModal` → `$nextTick` focus `inputMackInsert` (commit 12/10/2026).

## Kết quả mong đợi
- [ ] Bấm "Thêm mã" → ô "Thêm mã vào danh sách" có focus, gõ "FPT" vào được ngay.
- [ ] Đóng rồi mở lại → vẫn focus.

---

# [TC_PTCB_SS_28] Thanh cuộn ngang phía trên bảng

- **Trạng thái:** 🆕 Testcase mới (09/11/2026)
- **Ghi chú:** `scheduleScrollBarTopTable()` ($nextTick + rAF) dựng 1 thanh `.scrollbar-top.custom-scrollbar` (position
  sticky) rộng bằng `scrollWidth` của bảng, đồng bộ cuộn 2 chiều; chỉ dựng lại khi số cột/rỗng↔có dòng đổi
  (`table_shape`), không nhân bản khi giá realtime đổi.

## Kết quả mong đợi
- [ ] Cửa sổ 1000px: có đúng 1 `.scrollbar-top` (sticky, class `custom-scrollbar`), bề rộng ruột ≈ `scrollWidth` của tbody.
- [ ] Cuộn thanh trên sang phải 150px → tbody cuộn theo.

---

## Nhóm: Responsive

# [TC_PTCB_SS_26] Responsive viewport mobile/tablet

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị bảng có dữ liệu.
2. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024).

## Kết quả mong đợi
- [ ] 3 nút đầu trang + bảng vẫn hiển thị được (có thể cuộn ngang bảng), không vỡ layout nghiêm trọng.

---

## Tổng hợp trạng thái (28 testcase)

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-so-sanh.spec.ts](../tests/phan-tich-co-ban-so-sanh.spec.ts) (POM: section "Tab So sánh"
trong [pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 7 | TC_PTCB_SS_01, 06, 07, 08, 09, 11, 13 |
| 🆕 Mới (riêng web) | 20 | TC_PTCB_SS_02, 03, 04, 05, 10, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28 (27, 28 thêm 09/11) |
| ⚠️ Cần xác nhận thêm | 1 | TC_PTCB_SS_15 (`test.fixme` — kéo-thả `vuedraggable`, chưa tìm được cách giả lập ổn định) |

**Phát hiện đáng chú ý cần theo dõi:**
1. **[BUG NGHIÊM TRỌNG] Race condition khiến bảng so sánh trống vĩnh viễn khi deep-link** (TC_PTCB_SS_02) —
   `Compare.getAll()` tính `type_mack` đồng bộ từ `list_mack_company` chưa kịp nạp (nạp bất đồng bộ qua socket
   `TheContainer.getAllMack()`). Ảnh hưởng THẬT tới người dùng cuối: bất kỳ ai bấm F5, mở link trực tiếp, hoặc
   được chia sẻ link `?tab=so-sanh` đều thấy bảng trống hoàn toàn cho tới khi họ tự đổi mã CK — không có gợi ý
   nào trên UI báo họ cần làm vậy. Khuyến nghị sửa: thêm nhánh `else` cho `items_table`, hoặc watch
   `list_mack_company` thay vì đọc 1 lần.
2. **Gating "So sánh" hoạt động ở 2 CẤP ĐỘC LẬP:** cấp shell (`features_disabled['fa_so_sanh']`, đã đo KHÔNG
   khoá tài khoản Free hiện tại — xem TC_PTCB_17) và cấp widget riêng của chính `Compare/index.vue`
   (`$store.state.isAccountFree`, LUÔN giới hạn 6 dòng + hiện `UpdateRequire` bất kể `features_disabled`) —
   TC_PTCB_SS_05. Cùng pattern đã ghi nhận ở "4M & CANSLIM" (TC_PTCB_16).
3. **Nút "Đóng" trong modal "Thêm mã" không huỷ thay đổi đã thao tác** (TC_PTCB_SS_14) — thêm/xoá mã trong
   "Danh sách mã" rồi "Đóng" (không "Lưu") vẫn giữ nguyên state khi mở lại modal, dù bảng chính chưa bị ảnh
   hưởng. Không phải bug nghiêm trọng nhưng có thể gây nhầm lẫn.
4. **Không nhất quán xử lý lỗi mạng giữa các API trong cùng file:** `getAll()` (bảng chính) nuốt lỗi hoàn toàn
   không toast (TC_PTCB_SS_23), trong khi `getList()`/`deleteRowItem()`/`saveRowItem()`/`addNewRow()` đều có
   toast lỗi rõ ràng (TC_PTCB_SS_24) — gây trải nghiệm không đồng nhất khi mất mạng ở các thao tác khác nhau
   trong cùng tab.
5. **`maxRows: 100` khai báo trong `data()` nhưng KHÔNG được dùng ở bất kỳ đâu trong component** — không có cơ
   chế giới hạn số mã có thể thêm vào so sánh (khác kỳ vọng "tùy business giới hạn" ở Sheet app TC 178) — có
   thể là dead code hoặc tính năng dự kiến chưa hoàn thiện, không kết luận là bug vì không rõ có đúng là yêu
   cầu nghiệp vụ hay không.
