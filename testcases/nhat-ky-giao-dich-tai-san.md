# Màn hình: Nhật ký giao dịch — Tab "Tài sản"

- **URL:** `/nhat-ky-giao-dich` (tab mặc định, `active_tab = 0`) — xem tổng quan 4 tab ở
  [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** [src/views/tradingLog/estate.vue](../../stocks/src/views/tradingLog/estate.vue) (2196 dòng),
  dùng thêm `multiSelectBox.vue`, `textMask.vue`, `chartTradingHistory.vue` (biểu đồ trong modal Xem giao dịch).
- **Domain test:** https://kfsp.vn/nhat-ky-giao-dich
- **Nguồn testcase gốc (app):** Google Sheet, tab "Nhật Kí giao dịch", nhóm "Tab Tài sản" (TC 11 trở đi). Cấu
  trúc tổng thể tương đồng (filter danh mục, tổng kết, toggle Tổng quan/CP nắm giữ, biểu đồ donut, biểu đồ hiệu
  suất) nhưng chi tiết field/cột bảng khác nhau đáng kể giữa app và web (web có nhiều cột số liệu hơn, có tương
  tác mua/bán nhanh mà Sheet không mô tả) → phần lớn testcase dưới đây là 🆕, chỉ vài case tổng quan gắn được
  `Tham chiếu App`.
- **Phương pháp sinh:** Đọc toàn bộ `estate.vue` + kiểm kê độc lập qua DOM thật (`.dom-inspect/nkgd-tai-san.*`).
- **⚠️ An toàn dữ liệu:** Tài khoản test có danh mục/giao dịch thật trị giá lớn. `estate.vue` **không gọi REST
  API mutate nào trực tiếp** — chỉ đọc dữ liệu qua props (cha `index.vue` đã fetch) + Vuex store. Riêng hành
  động "Sửa vốn ban đầu" (`saveEdit`) chỉ ghi vào `localStorage`/Vuex **cục bộ trên trình duyệt**, KHÔNG gọi API
  server nào — an toàn để test thật trong context Playwright cô lập (không ảnh hưởng dữ liệu server thật). Thao
  tác "Mua thêm"/"Bán" mở modal thêm giao dịch nhanh của `index.vue` (`is_show_form_quick_add`) — modal này GỌI
  API mutate thật khi bấm "Lưu" nên mọi test liên quan **chỉ dừng ở bước mở modal quan sát prefill, không bấm
  Lưu thật** (hoặc mock nếu cần verify submit).
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Overview & Filter danh mục

# [TC_NKGD_TS_01] Overview tab Tài sản

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC 11 (Sheet)

## Các bước thực hiện
1. Vào tab "Tài sản" (mặc định khi vào trang).

## Kết quả mong đợi
- [ ] Hiển thị filter "Danh mục" (multiselect, mặc định "Nhấn để chọn" — chưa lọc gì, hiển thị toàn bộ).
- [ ] Hiển thị "Tổng giá trị danh mục ban đầu", "Tổng giá trị danh mục hiện tại", "Tăng trưởng danh mục" (giá
      trị + %).
- [ ] Hiển thị khối "Thống kê tài sản" (donut chart + dropdown Cổ phiếu/Ngành + dropdown Giá vốn DM/GT thị
      trường + checkbox "Tiền mặt").
- [ ] Hiển thị khối "Hiệu suất danh mục" (tab Tháng/Quý + biểu đồ cột).
- [ ] Hiển thị bảng "Thống kê lãi lỗ" với nút "Xuất File Excel", đơn vị "nghìn đồng".
- [ ] Hiển thị section "Bài viết liên quan" bên dưới.

---

# [TC_NKGD_TS_02] Lọc theo 1 danh mục

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mở dropdown "Danh mục", chọn 1 danh mục cụ thể (VD "NKGD - V70").

## Kết quả mong đợi
- [ ] Bảng "Thống kê lãi lỗ" chỉ còn dòng "Tổng kết toàn bộ" + đúng 1 nhóm danh mục vừa chọn.
- [ ] Tổng giá trị danh mục ban đầu/hiện tại/tăng trưởng cập nhật theo đúng phạm vi đã lọc.

---

# [TC_NKGD_TS_03] Lọc theo nhiều danh mục cùng lúc

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở dropdown "Danh mục", chọn từ 2 danh mục trở lên (multiselect).

## Kết quả mong đợi
- [ ] Chip/tag hiển thị đúng số danh mục đã chọn ("+N mục được chọn").
- [ ] Bảng chỉ hiển thị đúng các nhóm danh mục đã chọn.

---

# [TC_NKGD_TS_04] Bỏ chọn toàn bộ filter — quay về hiển thị tất cả

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Từ trạng thái đã lọc (TC_NKGD_TS_02), bỏ chọn lại danh mục đã chọn (click dấu x trên chip).

## Kết quả mong đợi
- [ ] Bảng quay về hiển thị đầy đủ mọi danh mục như ban đầu.

---

## Nhóm: Khối "Thống kê tài sản" (donut chart)

# [TC_NKGD_TS_05] Đổi loại thống kê Cổ phiếu / Ngành

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Ghi chú:** Đọc code xác nhận: đổi `value_type_mack` reset `value_type_value` về mặc định `"capital_price"`
  (watcher trong `estate.vue`).

## Các bước thực hiện
1. Đổi dropdown đầu tiên từ "Cổ phiếu" sang "Ngành".

## Kết quả mong đợi
- [ ] Donut chart vẽ lại theo nhóm Ngành thay vì từng mã CK riêng lẻ, chú thích bên phải đổi tương ứng.

---

# [TC_NKGD_TS_06] Đổi loại giá trị Giá vốn DM / GT thị trường

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Đổi dropdown thứ 2 từ "Giá vốn DM" sang "GT thị trường".

## Kết quả mong đợi
- [ ] Donut chart cập nhật tỷ trọng theo giá trị thị trường hiện tại thay vì giá vốn đầu tư.

---

# [TC_NKGD_TS_07] Checkbox "Tiền mặt" hiện thêm tùy chọn phụ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Ghi chú:** Code: checkbox "Tiền mặt + tính lãi lỗ" chỉ hiện khi checkbox "Tiền mặt" đã bật; cả 2 checkbox
  chỉ hiện khi `value_type_value != 'number_mack'`.

## Các bước thực hiện
1. Tick checkbox "Tiền mặt".

## Kết quả mong đợi
- [ ] Xuất hiện thêm checkbox "Tiền mặt + tính lãi lỗ".
- [ ] Donut chart cập nhật thêm phần "Tiền mặt" vào tỷ trọng.

---

## Nhóm: Khối "Hiệu suất danh mục"

# [TC_NKGD_TS_08] Chuyển đổi biểu đồ hiệu suất Tháng / Quý

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click tab "Quý" (mặc định "Tháng" đang active).

## Kết quả mong đợi
- [ ] Biểu đồ cột hiệu suất đổi trục thời gian sang theo quý, tab "Quý" chuyển active.

---

## Nhóm: Bảng "Thống kê lãi lỗ"

# [TC_NKGD_TS_09] Hiển thị đủ cột + dòng "Tổng kết toàn bộ"

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát bảng "Thống kê lãi lỗ".

## Kết quả mong đợi
- [ ] Đủ cột: Mã CK, Ngành, KL tồn, Giá trung bình, Giá, Tổng giá trị đầu tư, Tổng giá trị hiện tại, Lãi/lỗ hôm
      nay, Lãi/Lỗ lũy kế (nghìn đồng + %).
- [ ] Dòng "Tổng kết toàn bộ" luôn ở đầu bảng, tổng đúng bằng tổng các danh mục bên dưới.

---

# [TC_NKGD_TS_10] Mỗi danh mục có dòng header riêng kèm Vốn ban đầu/Tiền mặt

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát các dòng "Danh mục: <tên>" trong bảng.

## Kết quả mong đợi
- [ ] Mỗi dòng danh mục hiển thị "Vốn ban đầu: X", icon sửa (bút chì), "Tiền mặt: Y", cùng tổng giá trị đầu
      tư/hiện tại/lãi-lỗ của riêng danh mục đó.
- [ ] Các dòng mã CK con nằm ngay dưới đúng danh mục cha tương ứng.

---

# [TC_NKGD_TS_11] Sắp xếp bảng theo cột

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click header cột "Mã CK".

## Kết quả mong đợi
- [ ] Bảng sắp xếp lại (asc/desc theo mỗi lần click), không lỗi/crash, dữ liệu vẫn đúng.

---

# [TC_NKGD_TS_12] Click vào dòng giao dịch (ngoài ô Mã CK) mở modal "Xem giao dịch" (read-only)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation, mô tả lại đúng theo hành vi thật (khác giả định ban
  đầu)**
- **Khác biệt so với giả định ban đầu:** Toàn bộ `<tr>` của 1 dòng giao dịch có `@click="showPopup(item)"` (mở
  "Xem giao dịch") — NHƯNG riêng ô đầu tiên (chứa link mã CK) có `@click="showPopupChartTA($event, ...)"` RIÊNG
  kèm `e.stopPropagation()` (đọc `estate.vue` dòng ~479-489), chặn không cho sự kiện nổi bọt lên `<tr>`. Do đó
  **click đúng vào mã CK KHÔNG mở "Xem giao dịch"** — phải click vào 1 ô KHÁC trong dòng (VD ô "Ngành", ô duy
  nhất không có handler click riêng) mới mở đúng modal này. Xem thêm TC_NKGD_TS_12b (hành vi thật khi click mã
  CK).
- **Ghi chú:** Modal "Xem giao dịch" này là bản RIÊNG của `estate.vue` (state `is_show_popup`/`form_view` cục
  bộ), khác với modal "Xem giao dịch" của tab "Nhật ký giao dịch" (thuộc `index.vue`) dù trùng tên — 2 modal độc
  lập, không bao giờ cùng tồn tại trong DOM vì chỉ 1 tab được mount tại 1 thời điểm.

## Các bước thực hiện
1. Click vào ô "Ngành" (hoặc bất kỳ ô nào KHÔNG phải Mã CK/KL tồn) của 1 dòng giao dịch bất kỳ.

## Kết quả mong đợi
- [ ] Mở modal "Xem giao dịch" hiển thị đúng thông tin giao dịch (Loại GD, Danh mục, Mã CK, Ngày, Khối lượng,
      Giá, Phí, tags Thiết lập/Sai lầm) — mọi field đều **disabled** (chỉ xem).
- [ ] Nếu giao dịch có phát sinh cổ tức (`co_tuc = true`), hiện thêm nav-tab "Giao dịch"/"Cổ tức & quyền".
- [ ] Đóng modal bằng nút "Đóng" hoạt động đúng, không lưu thay đổi gì (vì mọi field readonly).

---

# [TC_NKGD_TS_12b] Click vào Mã CK mở modal biểu đồ/chi tiết mã CK (dùng chung toàn site)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click vào link mã CK (VD "1. BID*") gọi `showPopupChartTA()` → mở modal biểu đồ/chi tiết
  mã CK dùng CHUNG toàn site (`store.state.isShowModalTradingChart`, cùng cơ chế modal khi click mã CK ở
  Dashboard/Watchlist/Bảng giá) — biểu đồ nến, sổ lệnh, tab "Thông tin/Số lệnh/Cung cầu/Bài viết", nút "Thêm
  giao dịch" riêng, KHÔNG liên quan gì tới modal "Xem giao dịch" (TC_NKGD_TS_12).

## Các bước thực hiện
1. Click vào link mã CK (VD "1. BID*") trong bảng "Thống kê lãi lỗ".

## Kết quả mong đợi
- [ ] Mở modal biểu đồ/chi tiết mã CK (không phải modal "Xem giao dịch"), hiển thị đúng mã CK vừa click, có
      biểu đồ nến + panel thông tin bên phải.

---

# [TC_NKGD_TS_13] "Xuất File Excel" luôn bấm được

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Đọc code xác nhận nút không có điều kiện disable nào (kể cả khi `isLoading` hoặc bảng rỗng).

## Các bước thực hiện
1. Click "Xuất File Excel".

## Kết quả mong đợi
- [ ] Không có lỗi JS phát sinh, trình duyệt kích hoạt tải file (không cần assert nội dung file).

---

# [TC_NKGD_TS_14] Empty state khi chưa có giao dịch nào trong phạm vi lọc

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Lọc theo 1 danh mục chưa từng có giao dịch nào (nếu có sẵn trên tài khoản test) hoặc lọc kết hợp nhiều điều
   kiện khiến kết quả rỗng.

## Kết quả mong đợi
- [ ] Bảng hiển thị dòng "Chưa có giao dịch nào" (colspan toàn bảng), không crash.

---

## Nhóm: Sửa vốn ban đầu (client-side, không gọi API server)

# [TC_NKGD_TS_15] Mở modal "Sửa danh mục" — tên danh mục bị khóa

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Khác biệt so với app:** Tiêu đề modal "Sửa danh mục" nhưng field "Tên danh mục" luôn `disabled` — thực chất
  chỉ sửa được "Vốn ban đầu", có thể gây hiểu lầm về phạm vi chỉnh sửa.

## Các bước thực hiện
1. Click icon sửa (bút chì) cạnh 1 dòng "Danh mục: ...".

## Kết quả mong đợi
- [ ] Mở modal "Sửa danh mục" với field "Tên danh mục" (disabled, đã điền sẵn đúng tên) + "Vốn ban đầu"
      (editable, định dạng số nghìn).

---

# [TC_NKGD_TS_16] Sửa "Vốn ban đầu" và lưu

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện BUG THẬT (đã xác nhận qua stack
  trace thật, không còn là nghi vấn)**
- **⚠️ Phát hiện đáng chú ý (bug thật, đã xác nhận):** `saveEdit()` gọi
  `loadDataFromLocalStorage(this.data_update_von.id, this.data_update_von.vonbandau)` TRƯỚC khi gọi
  `this.$toast.success("Đã cập nhật giao dịch")`. Bên trong, dòng
  `data_save_temp[id].tong_tai_san = String(von_ban_dau)` KHÔNG có optional chaining — nếu danh mục đang sửa
  chưa từng có entry trong `capital_allocation_data_save` (dữ liệu này đồng bộ 2 chiều với server qua cơ chế
  "user settings" dùng chung, KHÔNG chỉ là `localStorage` thuần trình duyệt — xác nhận qua chạy thật trên browser
  context HOÀN TOÀN MỚI, không có `localStorage` cũ, vẫn crash), dòng này ném:
  ```
  TypeError: Cannot read properties of undefined (reading 'tong_tai_san')
    at loadDataFromLocalStorage
    at saveEdit
  ```
  Vì exception này ném RA TRƯỚC dòng gọi toast, `this.$toast.success(...)` và `this.showModalEdit = false`
  (dòng ngay sau) đều KHÔNG BAO GIỜ chạy tới → người dùng bấm "Lưu" nhưng KHÔNG có bất kỳ phản hồi nào (không
  toast thành công, không toast lỗi, modal vẫn mở y nguyên) — trải nghiệm giống hệt app bị treo/không phản hồi.
  Đã tái hiện ổn định với danh mục đầu tiên ("Lướt Sóng") của tài khoản test qua Playwright thật.
- **Ghi chú:** Dù crash, xác nhận `saveEdit()` KHÔNG gọi API POST/PUT/DELETE nào — hành động này (khi không
  crash) hoàn toàn client-side.

## Các bước thực hiện
1. Mở modal Sửa danh mục của 1 danh mục bất kỳ.
2. Sửa "Vốn ban đầu" thành 1 giá trị mới.
3. Click "Lưu".

## Kết quả mong đợi
- [ ] (Kỳ vọng đúng) Toast "Đã cập nhật giao dịch" hiển thị, modal đóng, giá trị "Vốn ban đầu" trên bảng cập
      nhật đúng.
- [ ] (Hành vi thật đo được — BUG, với danh mục chưa có entry trong `capital_allocation_data_save`) Không có
      toast nào hiển thị, modal KHÔNG đóng, console ghi nhận `TypeError` — cần báo dev sửa
      `data_save_temp[id]?.tong_tai_san` (thêm optional chaining) và cân nhắc khởi tạo entry mới cho `id` chưa
      tồn tại thay vì giả định nó luôn có sẵn.
- [ ] Dù thành công hay crash, không có request POST/PUT/DELETE nào được gửi lên server.

---

# [TC_NKGD_TS_17] Nút "Hủy" đóng modal không lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở modal Sửa danh mục, đổi "Vốn ban đầu".
2. Click "Hủy".

## Kết quả mong đợi
- [ ] Modal đóng, giá trị "Vốn ban đầu" hiển thị trên bảng KHÔNG đổi.

---

## Nhóm: Mua/Bán nhanh từ bảng Tài sản

# [TC_NKGD_TS_18] Tooltip "Mua thêm"/"Bán" xuất hiện khi click icon "+"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Click icon "+" cạnh cột "KL tồn" của 1 dòng mã CK.

## Kết quả mong đợi
- [ ] Hiện tooltip 2 dòng: "Mua thêm" (chấm xanh), "Bán" (chấm đỏ).

---

# [TC_NKGD_TS_19] Click "Mua thêm"/"Bán" mở modal thêm giao dịch nhanh, prefill đúng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **⚠️ Lưu ý an toàn:** Chỉ verify modal mở đúng + prefill đúng mã CK/danh mục/loại GD — KHÔNG bấm "Lưu" (gọi
  API `POST /api/stocks/trading_log/store` thật, tạo giao dịch thật trên tài khoản test).

## Các bước thực hiện
1. Từ tooltip (TC_NKGD_TS_18), click "Mua thêm".

## Kết quả mong đợi
- [ ] Mở modal "Giao dịch Mua" (`CModal` riêng, không phải modal "Thêm giao dịch" đầy đủ của tab Nhật ký giao
      dịch) với "Mã <mã CK>" hiển thị sẵn, Danh mục đã chọn đúng danh mục của dòng vừa click, Loại giao dịch =
      "Mua".
- [ ] Field "Khối lượng" tự động focus.

---

## Nhóm: Bài viết liên quan & Lỗi mạng

# [TC_NKGD_TS_20] Hiển thị "Bài viết liên quan" theo mã trong danh mục

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Cuộn xuống cuối tab Tài sản.

## Kết quả mong đợi
- [ ] Hiển thị danh sách bài viết/công bố thông tin liên quan tới các mã CK đang có trong danh mục (component
      `NewsRelatedWatchlist`).

---

# [TC_NKGD_TS_21] Modal "Xem giao dịch" không crash khi mất mạng lúc tải biểu đồ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Biểu đồ giá mục tiêu/cắt lỗ trong modal lấy dữ liệu qua `window.socket_send.emit("gethistory",
  ...)` (callback qua socket.io, không phải REST API/axios) — không có cơ chế timeout/error UI, nên khi mất kết
  nối, biểu đồ chỉ trống mãi mãi mà không có thông báo lỗi (đã xác nhận qua đọc code, không phải bug crash).

## Các bước thực hiện
1. `context.setOffline(true)` (hoặc chặn kết nối socket) trước khi mở modal Xem giao dịch.
2. Click vào ô "Ngành" của 1 dòng giao dịch để mở đúng modal "Xem giao dịch" (click mã CK sẽ mở nhầm modal biểu
   đồ toàn site — xem TC_NKGD_TS_12/TC_NKGD_TS_12b).

## Kết quả mong đợi
- [ ] Modal vẫn mở, không có lỗi JS/crash trang.
- [ ] Biểu đồ giá mục tiêu - cắt lỗ hiển thị trống (không có dữ liệu), không có thông báo lỗi nào — ghi nhận là
      hạn chế UX (thiếu timeout/error state), không chặn tiến độ.

---

## Tổng hợp trạng thái (22 testcase)

Đã tự động hoá bằng Playwright: [tests/nhat-ky-giao-dich-tai-san.spec.ts](../tests/nhat-ky-giao-dich-tai-san.spec.ts)
(POM dùng chung: [pages/TradingLogPage.ts](../pages/TradingLogPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 8 | TC_TS_01, 05, 06, 08, 09, 10, 11, 12 |
| 🆕 Mới (riêng web) | 14 | Còn lại (bao gồm TC_TS_12b mới) |
| ⚠️ Cần xác nhận thêm | 0 | |

**Phát hiện đáng chú ý:**
1. **BUG THẬT ĐÃ XÁC NHẬN (TC_NKGD_TS_16):** Sửa "Vốn ban đầu" của 1 danh mục KHÔNG có entry sẵn trong
   `capital_allocation_data_save` (dữ liệu đồng bộ server qua "user settings") làm `saveEdit()` crash
   `TypeError: Cannot read properties of undefined (reading 'tong_tai_san')` NGAY TRƯỚC dòng gọi toast thành
   công — người dùng bấm "Lưu" nhưng không có phản hồi gì (modal treo, không toast). Đã tái hiện ổn định bằng
   Playwright thật (kể cả trên browser context hoàn toàn mới).
2. Sửa "Vốn ban đầu" (khi không crash) hoàn toàn client-side, không gọi API server nào.
3. **Khác biệt hành vi quan trọng (TC_NKGD_TS_12/12b):** Click vào Mã CK trong bảng "Thống kê lãi lỗ" KHÔNG mở
   modal "Xem giao dịch" như giả định ban đầu — ô Mã CK có `@click.stop` riêng mở modal biểu đồ/chi tiết mã CK
   dùng chung toàn site thay vào đó. Phải click vào ô khác (VD "Ngành") trong dòng mới mở đúng "Xem giao dịch".
4. Biểu đồ trong modal "Xem giao dịch" dùng socket.io (không phải REST) để lấy lịch sử giá — không có
   timeout/error state khi mất kết nối, chart treo trống vĩnh viễn không báo lỗi.
