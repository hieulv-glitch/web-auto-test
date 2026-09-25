# Màn hình: Nhật ký giao dịch — Tab "Phân bổ vốn"

- **URL:** `/nhat-ky-giao-dich` (`active_tab = 3`) — xem tổng quan 4 tab ở
  [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** [src/views/CapitalAllocation.vue](../../stocks/src/views/CapitalAllocation.vue) (1869 dòng),
  dùng `CustomEChart` (pie chart). Bị khóa bởi `<ProtectedView featureName="nkgd_phan_bo_von">` nếu tài khoản
  chưa đủ quyền (xem [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md) TC_NKGD_09). Chỉ mount khi thực sự click vào
  tab này (`v-else-if`, lazy).
- **Domain test:** https://kfsp.vn/nhat-ky-giao-dich
- **Nguồn testcase gốc (app):** Google Sheet, tab "Nhật Kí giao dịch" — app có nhắc "Phân bổ vốn" nhưng không
  mô tả chi tiết công thức tính (% cắt lỗ trên tài sản). Toàn bộ testcase dưới đây do tự kiểm kê source code
  web, hầu hết 🆕.
- **Phương pháp sinh:** Đọc toàn bộ `CapitalAllocation.vue` + `src/views/charts/CustomEchart.vue` + `src/store.js`
  (đoạn mutation `saveSetting` dùng chung) + kiểm kê độc lập qua DOM thật (`.dom-inspect/nkgd-phanbovon.*`).
- **⚠️ AN TOÀN DỮ LIỆU — QUAN TRỌNG:** Tab này KHÔNG có API lưu "phân bổ vốn" chuyên biệt, nhưng có cơ chế
  **auto-save ngầm lên server** (debounce ~3.2 giây sau khi ngừng gõ) qua mutation Vuex `saveSetting` dùng
  chung toàn app → `POST {saveSettingAPI}/updateusersettings`. Vì đây là API "cài đặt người dùng" dùng chung
  (không phải endpoint riêng của phân bổ vốn), testcase liên quan tới auto-save **mock/chặn** request này để
  không ghi đè `capital_allocation_data_save` thật của tài khoản test.
- **Quy ước trạng thái:** 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Overview & tính toán

# [TC_NKGD_PBV_01] Overview tab Phân bổ vốn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Vào tab "Phân bổ vốn".

## Kết quả mong đợi
- [ ] Hiển thị 4 khối: "Phân bổ vốn theo % cắt lỗ trên tài sản" (form nhập), "Trạng thái danh mục hiện tại"
      (bảng số liệu + pie chart), "Deal tiếp theo" (giá vốn + pie chart), "Trạng thái danh mục khi có deal tiếp
      theo" (bảng mô phỏng + pie chart).
- [ ] Dropdown "Danh mục" mặc định chọn 1 danh mục có sẵn.

---

# [TC_NKGD_PBV_02] Validate "Vốn ban đầu" required + phải > 0

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **`test.fixme` (đo qua automation 2 lần, kết quả KHÔNG ổn định)**
- **⚠️ Phát hiện đáng chú ý (nghi bug race condition, đo qua automation):** Chạy đúng cùng 1 kịch bản thao tác
  (xóa trắng qua bàn phím Ctrl+A + Backspace, Tab để blur) ở 2 lần chạy độc lập cho 2 kết quả TRÁI NGƯỢC: lần 1
  field KHÔNG BAO GIỜ hiện `is-invalid` dù giá trị luôn `"0"` (v-money tự làm tròn field trống về `"0"`, vốn
  không hợp lệ theo `greaterThanZero`); lần 2 field CÓ hiện `is-invalid` đúng như kỳ vọng. Vì hành vi không lặp
  lại ổn định, KHÔNG assert 1 chiều cụ thể (sẽ tạo test flaky giả) — đánh dấu `test.fixme`. Nguyên nhân nghi
  ngờ: input có 2 directive `v-model.lazy="tong_tai_san"` VÀ `v-model="tong_tai_san"` cùng lúc trên 1 thẻ
  (trùng lặp, dòng 33 + 37 của `CapitalAllocation.vue`) — hành vi biên dịch của Vue 2 với v-model trùng lặp
  không xác định rõ ràng, khiến thời điểm watcher `tong_tai_san() { this.$v.tong_tai_san.$touch(); }` (cần
  thiết để kích hoạt `$error`) chạy hay không có thể phụ thuộc race condition giữa 2 directive.
- **Cần gì để verify:** Xác nhận từ dev về việc có đúng 2 `v-model` trùng lặp trên field này là lỗi copy-paste
  hay có chủ đích; sau khi dev xác nhận/sửa, chạy lại nhiều lần để kiểm tra độ ổn định trước khi bỏ `fixme`.

## Các bước thực hiện
1. Xóa trắng "Vốn ban đầu" qua bàn phím (Ctrl+A + Backspace), Tab để blur.

## Kết quả mong đợi
- [ ] (Kỳ vọng theo code validators) Field chuyển trạng thái lỗi (validate `required` + `greaterThanZero`), ổn
      định qua nhiều lần thử.
- [ ] (Hành vi thật đo được) `is-invalid` xuất hiện KHÔNG ổn định giữa các lần chạy — có lần không bao giờ xuất
      hiện dù giá trị luôn "0".

---

# [TC_NKGD_PBV_03] "% Cắt lỗ tối đa trên tổng tài sản" — required, > 0, KHÔNG có giới hạn trên

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** Dù tên biến validator là `maxValue`, thực chất chỉ kiểm tra `> 0` — KHÔNG có giới
  hạn trên nào dù đây là field phần trăm. Nhập 500% hoặc lớn hơn vẫn được coi là hợp lệ.

## Các bước thực hiện
1. Nhập "% Cắt lỗ tối đa trên tổng tài sản" = `500`.

## Kết quả mong đợi
- [ ] (Hành vi thật đo được) Field KHÔNG báo lỗi dù giá trị vô lý về mặt nghiệp vụ (>100%). "Giá trị cắt lỗ tối
      đa trên tổng tài sản" vẫn tính ra số liệu tương ứng (có thể lớn hơn cả Vốn ban đầu) mà không có cảnh báo
      nào khác ngoài field liên quan tới "vượt quá số tiền khả dụng" (TC_NKGD_PBV_06).

---

# [TC_NKGD_PBV_04] "% Cắt lỗ trên deal tiếp theo" — required, > 0

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **`test.fixme` (đo qua automation 3 lần, kết quả KHÔNG ổn định)**
- **⚠️ Phát hiện đáng chú ý (nghi bug race condition, đo qua automation):** Field này KHÔNG có `v-money` (chấp
  nhận xóa trắng thật, không tự làm tròn về "0") nên xác nhận rõ ràng: dù giá trị thực sự rỗng (`inputValue()`
  trả về chuỗi rỗng) — 2 lần chạy đầu field KHÔNG BAO GIỜ hiện `is-invalid`, nhưng lần chạy thứ 3 (cùng hệt kịch
  bản) field LẠI hiện `is-invalid` đúng như kỳ vọng. Cùng pattern không ổn định với TC_NKGD_PBV_02 — cùng nghi
  ngờ nguyên nhân: field này cũng có 2 directive `v-model.lazy` + `v-model` trùng lặp trên cùng input (dòng 106
  + 112 của `CapitalAllocation.vue`), có thể gây race condition ở thời điểm watcher gọi `$touch()`.
- **Cần gì để verify:** Cùng điều kiện với TC_NKGD_PBV_02 — xác nhận từ dev về 2 `v-model` trùng lặp.

## Các bước thực hiện
1. Xóa trắng "% Cắt lỗ trên deal tiếp theo" (qua bàn phím, xác nhận field thực sự rỗng), blur.

## Kết quả mong đợi
- [ ] (Kỳ vọng theo code validators) Field báo lỗi `is-invalid`, "Kết quả — Phân bổ vốn cho deal tiếp theo"
      (readonly) không tính ra giá trị hợp lệ, ổn định qua nhiều lần thử.
- [ ] (Hành vi thật đo được) `is-invalid` xuất hiện KHÔNG ổn định giữa các lần chạy dù giá trị rỗng thật.

---

# [TC_NKGD_PBV_05] Tự tính "Giá trị cắt lỗ tối đa" & "Phân bổ vốn cho deal tiếp theo"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Nhập đủ 3 field: Vốn ban đầu = `100,000,000`, % Cắt lỗ tối đa = `10`, % Cắt lỗ trên deal tiếp theo = `2`.

## Kết quả mong đợi
- [ ] "Giá trị cắt lỗ tối đa trên tổng tài sản" tự cập nhật = 10% × 100,000,000 = 10,000,000 (readonly).
- [ ] "Phân bổ vốn cho deal tiếp theo" tự cập nhật theo đúng công thức (10,000,000 / 2% = 500,000,000 hoặc
      công thức tương đương — xác nhận đúng con số thật khi chạy, không hard-code công thức suy đoán).

---

# [TC_NKGD_PBV_06] Cảnh báo khi Phân bổ vốn cho deal tiếp theo vượt quá vốn khả dụng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Nhập giá trị khiến "Phân bổ vốn cho deal tiếp theo" tính ra lớn hơn "Vốn khả dụng" hiện có của danh mục.

## Kết quả mong đợi
- [ ] Field "Phân bổ vốn cho deal tiếp theo" chuyển style `is-invalid` (viền đỏ).

---

# [TC_NKGD_PBV_07] Checkbox "Ghi nhận lời lỗ của danh mục vào vốn khả dụng"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Tick/bỏ tick checkbox "Ghi nhận lời lỗ của danh mục vào vốn khả dụng".

## Kết quả mong đợi
- [ ] "Vốn khả dụng" và các số liệu phụ thuộc (margin, tỷ lệ...) trong khối "Trạng thái danh mục hiện tại" thay
      đổi tương ứng theo trạng thái checkbox.

---

## Nhóm: Đổi danh mục — cấu hình riêng theo từng danh mục

# [TC_NKGD_PBV_08] Đổi Danh mục — tải lại đúng cấu hình đã lưu riêng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Ghi chú:** Mỗi danh mục lưu cấu hình phân bổ vốn (Vốn ban đầu, % cắt lỗ, checkbox) độc lập trong
  `data_save`, khoá theo id danh mục.
- **Ghi chú test:** phải chọn tường minh danh mục A trước khi sửa giá trị (không giả định danh mục đang active
  mặc định trùng với option đầu tiên trong dropdown) — sửa lỗi giả định sai trong lúc viết test, không phải bug
  sản phẩm. Cũng phải xóa qua bàn phím (Ctrl+A + Backspace) rồi gõ giá trị mới thay vì dùng `.fill()` trực
  tiếp — đã xác nhận `.fill('123456')` khi field đang có sẵn giá trị thật ("54,321") cho ra chuỗi nối
  "54321123456" thay vì thay thế hoàn toàn (do tương tác giữa `v-money` và cách Playwright `.fill()` ghi đè DOM
  value trực tiếp, không phải bug sản phẩm — người dùng gõ tay bình thường không gặp vấn đề này).

## Các bước thực hiện
1. Nhập giá trị khác biệt cho danh mục A.
2. Đổi dropdown Danh mục sang danh mục B (chưa từng thiết lập).
3. Đổi lại về danh mục A.

## Kết quả mong đợi
- [ ] Danh mục B hiển thị giá trị mặc định ("0", "0", "0", checkbox tắt).
- [ ] Quay lại danh mục A vẫn giữ đúng giá trị đã nhập trước đó (không bị mất/lẫn giữa các danh mục).

---

# [TC_NKGD_PBV_09] Crash tiềm ẩn khi tài khoản chưa có danh mục nào

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Đọc code `loadDataFromLocalStorage()` — nếu `option_filter_category` rỗng (API `/category/get-all`
  trả mảng rỗng, tài khoản chưa từng tạo danh mục), dòng
  `this.data_filter_category = this.option_filter_category[0].value` sẽ ném `TypeError` vì
  `option_filter_category[0]` là `undefined` (thiếu guard, khác với 1 nhánh khác trong cùng hàm ĐÃ có guard
  tương tự).
- **Cần gì để verify:** Tài khoản test hiện tại luôn có sẵn ≥ 1 danh mục — không tái tạo được điều kiện "0 danh
  mục" một cách an toàn (không được xóa hết danh mục thật của tài khoản test dùng chung). Có thể verify bằng
  cách mock `GET /api/stocks/category/get-all` trả `[]` — xem spec.

## Các bước thực hiện
1. Mock `GET /api/stocks/category/get-all` trả mảng rỗng `[]`.
2. Vào tab "Phân bổ vốn".
3. Theo dõi `page.on('pageerror', ...)`.

## Kết quả mong đợi
- [ ] (Kỳ vọng đúng) Trang hiển thị trạng thái rỗng hợp lý (VD dropdown Danh mục trống, form vô hiệu), không
      crash.
- [ ] (Cần xác nhận) Có ghi nhận `pageerror` (`TypeError`) hay không khi `option_filter_category` rỗng.

---

## Nhóm: Auto-save ngầm lên server

# [TC_NKGD_PBV_10] Đổi giá trị form → auto-save lên server — gửi request KHÔNG ổn định (nghi bug thật)

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **`test.fixme` (đo qua automation nhiều lần, kết quả KHÔNG ổn định)**
- **Ghi chú thiết kế (theo code):** Debounce 2 lớp: computed `input_value` (có side-effect gán
  `data_save[category] = {...}`) được `watch({deep:true})`, watcher `data_save` gọi `saveAllData()` (debounce
  3000ms qua lodash), rồi mutation Vuex `saveSetting` debounce thêm 200ms trước khi `POST updateusersettings`
  thật (tổng ~3.2 giây).
- **⚠️ Phát hiện đáng chú ý (nghi bug reactivity, đo qua automation):** Chạy cùng kịch bản (đổi "Vốn ban đầu",
  chờ 8 giây — dài hơn nhiều mốc debounce lý thuyết ~3.2 giây, kể cả chờ thêm 2 giây sau khi vào tab để loại
  trừ khả năng cờ `is_active_save_data` còn `false` lúc mount) ở nhiều lần chạy độc lập cho kết quả TRÁI NGƯỢC:
  có lần hoàn toàn KHÔNG có request `updateusersettings` nào được gửi; có lần request được gửi đúng như thiết
  kế. Vì không lặp lại ổn định, KHÔNG assert 1 chiều cụ thể — đánh dấu `test.fixme`. Nguyên nhân nghi ngờ: đọc
  code, `data_save[this.data_filter_category] = {...}` gán trực tiếp bằng object property assignment (không
  dùng `Vue.set`/`this.$set`) — nếu key ứng với danh mục đang chọn CHƯA từng tồn tại sẵn trong `data_save`
  (chưa reactive, VD danh mục lần đầu dùng tính năng này), Vue 2 sẽ không track được mutation này nên watcher
  `deep:true` trên `data_save` không kích hoạt → auto-save không chạy cho danh mục đó; ngược lại nếu key đã tồn
  tại sẵn (đã từng lưu trước đó) thì watcher hoạt động bình thường. Kết quả phụ thuộc trạng thái lưu trữ của
  danh mục đang active tại thời điểm chạy — không kiểm soát ổn định được trên tài khoản test dùng chung.
- **Cần gì để verify:** Xác nhận từ dev cơ chế gán `data_save[category]` có nên dùng `Vue.set` hay không; sau
  đó cần 1 danh mục XÁC ĐỊNH chưa từng lưu "Phân bổ vốn" trước đó (để tái tạo nhánh lỗi ổn định) và 1 danh mục
  XÁC ĐỊNH đã từng lưu (để tái tạo nhánh hoạt động đúng), thay vì phụ thuộc danh mục mặc định hiện tại.

## Các bước thực hiện
1. Theo dõi mọi request khớp `updateusersettings` (mock trả `200`, không để lọt request thật).
2. Chờ 2 giây sau khi đăng nhập (đảm bảo API cài đặt người dùng lúc mount app đã load xong).
3. Đổi "Vốn ban đầu", chờ 8 giây không thao tác gì thêm.

## Kết quả mong đợi
- [ ] (Kỳ vọng theo thiết kế) Ghi nhận đúng 1 request `POST` gửi `listitem` chứa key
      `capital_allocation_data_save` với giá trị mới sau ~3.2 giây, ổn định qua nhiều lần thử.
- [ ] (Hành vi thật đo được) Việc request có được gửi hay không KHÔNG ổn định giữa các lần chạy.

---

# [TC_NKGD_PBV_11] Auto-save lỗi mạng — hoàn toàn im lặng, không thông báo

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `POST .../updateusersettings` trả lỗi 500.
2. Đổi giá trị form, chờ > 3.5 giây.

## Kết quả mong đợi
- [ ] Không có toast lỗi nào hiển thị cho người dùng (ghi nhận hạn chế UX, không phải bug crash) — người dùng
      không biết thay đổi của mình có được lưu lên server hay không.

---

## Nhóm: Các khối hiển thị & collapse

# [TC_NKGD_PBV_12] 3 icon toggle collapse (Deal tiếp theo / Trạng thái sau deal)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click lần lượt: "Trong đó:" (khối Deal tiếp theo), "Giá vốn chứng khoán của danh mục" và "- Giá vốn chứng
   khoán deal tiếp theo" (khối Trạng thái sau deal) — cả 3 mặc định đang mở sẵn.

## Kết quả mong đợi
- [ ] Mỗi lần click, đúng khối con tương ứng thu gọn/mở rộng, không ảnh hưởng các khối khác.

---

# [TC_NKGD_PBV_13] Khối "Trạng thái danh mục hiện tại" — đủ số liệu + pie chart

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát khối "Trạng thái danh mục hiện tại" với 1 danh mục có sẵn giao dịch thật.

## Kết quả mong đợi
- [ ] Hiển thị đủ: Vốn ban đầu, Lãi lỗ đã thực hiện, Vốn khả dụng, Giá vốn chứng khoán, Số tiền khả dụng, Tổng
      giá trị đầu tư, Margin đang sử dụng, Tỷ lệ Margin/Vốn khả dụng, Tỷ lệ Margin/Giá vốn chứng khoán.
- [ ] Pie chart hiển thị tương ứng tỷ trọng (không rỗng nếu danh mục đã có giao dịch).

---

# [TC_NKGD_PBV_14] Khối "Trạng thái danh mục khi có deal tiếp theo" — mô phỏng SAU deal

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Nhập đủ 3 field chính, quan sát khối "Trạng thái danh mục khi có deal tiếp theo".

## Kết quả mong đợi
- [ ] Số liệu trong khối này khác với khối "Trạng thái danh mục hiện tại" (đã cộng thêm ảnh hưởng của deal mô
      phỏng), có collapse lồng 2 cấp (Giá vốn chứng khoán của danh mục → Giá vốn chứng khoán deal tiếp theo →
      Tiền mặt/Margin).

---

## Nhóm: Empty state & lỗi tải dữ liệu

# [TC_NKGD_PBV_15] Empty state khi danh mục chưa đủ dữ liệu giao dịch

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn 1 danh mục chưa có (hoặc rất ít) giao dịch.

## Kết quả mong đợi
- [ ] Pie chart fallback về trạng thái mặc định (100% "Tiền" hoặc rỗng hợp lệ), không crash, không hiển thị số
      liệu vô lý (NaN/undefined).

---

# [TC_NKGD_PBV_16] Lỗi tải danh sách danh mục — im lặng, không toast

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `GET /api/stocks/category/get-all` trả lỗi 500.
2. Vào tab "Phân bổ vốn".

## Kết quả mong đợi
- [ ] Không crash, dropdown "Danh mục" rỗng, mọi giá trị derived = 0/rỗng, không có toast/thông báo lỗi nào cho
      người dùng (ghi nhận hạn chế UX, giống pattern lỗi im lặng ở các tab khác của trang này).

---

## Tổng hợp trạng thái (16 testcase)

Đã tự động hoá bằng Playwright: [tests/nhat-ky-giao-dich-phan-bo-von.spec.ts](../tests/nhat-ky-giao-dich-phan-bo-von.spec.ts)
(POM dùng chung: [pages/TradingLogPage.ts](../pages/TradingLogPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 12 | |
| ⚠️ Cần xác nhận thêm | 4 | TC_NKGD_PBV_02, TC_NKGD_PBV_04, TC_NKGD_PBV_09, TC_NKGD_PBV_10 — xem "Phát hiện đáng chú ý" bên dưới |

**Phát hiện đáng chú ý (nghi bug thật, ưu tiên báo dev):**
1. **TC_NKGD_PBV_02 & TC_NKGD_PBV_04:** Cả 3 field nhập của form ("Vốn ban đầu", "% Cắt lỗ tối đa trên tổng tài
   sản", "% Cắt lỗ trên deal tiếp theo") đều có 2 directive `v-model.lazy="x"` VÀ `v-model="x"` trùng lặp trên
   cùng 1 thẻ `<input>` trong `CapitalAllocation.vue`. Hệ quả đo được: style `is-invalid` khi field không hợp
   lệ hoạt động KHÔNG ổn định giữa các lần chạy — cả TC_NKGD_PBV_02 ("Vốn ban đầu") và TC_NKGD_PBV_04 ("% Cắt
   lỗ trên deal tiếp theo") đều cho kết quả trái ngược nhau (có lúc is-invalid không bao giờ xuất hiện, có lúc
   xuất hiện đúng) qua nhiều lần chạy cùng 1 kịch bản thao tác — nghi ngờ do race condition từ 2 v-model trùng
   lặp.
2. **TC_NKGD_PBV_10:** Auto-save ngầm lên server (`updateusersettings`) khi đổi giá trị form hoạt động KHÔNG ổn
   định — có lần hoàn toàn không gửi request dù chờ vượt xa mốc debounce lý thuyết ~3.2 giây, có lần gửi đúng
   thiết kế. Nghi vấn nguyên nhân: `data_save[category] = {...}` gán key mới không qua `Vue.set` nên không được
   Vue 2 theo dõi reactive nếu danh mục đó chưa từng có dữ liệu lưu trước đó, khiến watcher `deep:true` trên
   `data_save` không kích hoạt. Hệ quả tiềm ẩn: thay đổi cấu hình phân bổ vốn có thể không đồng bộ lên server
   cho một số danh mục, chỉ tồn tại trên `localStorage` của máy/trình duyệt hiện tại.
3. **TC_NKGD_PBV_03:** Field % cắt lỗ không có giới hạn trên (dù tên hàm validator gợi ý `maxValue`) — có thể
   nhập giá trị phần trăm vô lý (>100%) mà không bị chặn.
4. **TC_NKGD_PBV_09:** Nghi vấn crash `TypeError` khi tài khoản 0 danh mục — thiếu guard tại 1 nhánh của
   `loadDataFromLocalStorage()`, trong khi 1 nhánh khác cùng hàm đã có guard tương tự (bất nhất trong code).
5. Toàn bộ dữ liệu "phân bổ vốn" là MÔ PHỎNG client-side, không có bảng/API lưu trữ chuyên biệt — chỉ đồng bộ
   lên server qua cơ chế "user settings" dùng chung, không có phản hồi thành công/thất bại nào cho người dùng
   biết (và trên thực tế, theo phát hiện #2, có thể không đồng bộ được ổn định).
6. Component dùng `v-else-if` (lazy mount) — mỗi lần rời rồi quay lại tab đều gọi lại API `get-all` từ đầu,
   không cache giữa các lần chuyển tab.
