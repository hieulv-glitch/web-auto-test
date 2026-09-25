# Màn hình: Phân tích kỹ thuật — Panel "Thông tin"

- **URL:** `/phan-tich-ky-thuat` — tài liệu con của [phan-tich-ky-thuat.md](phan-tich-ky-thuat.md).
- **Component:** panel phải mục "Thông tin" render `TabInfo` (`ReactTabInfo.vue`) → chọn 1 trong 2 nhánh theo
  `is_index` (mã thuộc `["VNINDEX","HNXINDEX","UPCOMINDEX","VN30","HNX30","VN100"]`):
  - **Stockcode** (mã cổ phiếu thường):
    [Orderboard/Stockcode/index.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Stockcode/index.vue) (83KB)
    + [HeaderInfo.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Stockcode/HeaderInfo.vue) +
    [CommonInfo.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Stockcode/CommonInfo.vue) (34KB) +
    [ForeignTransaction.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Stockcode/ForeignTransaction.vue)
    + [PropTransaction.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Stockcode/PropTransaction.vue).
  - **Indexcode** (6 mã chỉ số ở trên):
    [Orderboard/Indexcode/index.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Indexcode/index.vue) +
    [CommonInfoIndex.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Indexcode/CommonInfoIndex.vue) +
    [ForeignTransactionIndex.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Indexcode/ForeignTransactionIndex.vue)
    + [PropTransactionIndex.vue](../../stocks/src/views/multiLayoutChart/Orderboard/Indexcode/PropTransactionIndex.vue).
- **Phạm vi:** tab con "Thông tin" của panel phải, CẢ 2 nhánh Stockcode/Indexcode. **KHÔNG** chi tiết hoá 3 tab
  con còn lại của nhánh Stockcode ("Sổ lệnh"/"Cung cầu"/"Bài viết") — chỉ 1 testcase verify điều hướng đổi tab
  đúng, không verify nội dung bên trong.
- **⚠️ Kiến trúc khác nhau ĐÁNG KỂ giữa 2 nhánh** (không phải chỉ khác vài field, mà khác cả CƠ CHẾ):
  - Stockcode có 4 tab ngoài ("Thông tin"/"Sổ lệnh"/"Cung cầu"/"Bài viết") + bên trong tab "Thông tin" còn có
    toggle nội bộ "Tổng quan"/"NN & TD" (2 cấp tab). Indexcode chỉ có 2 tab ngoài ("Thông tin"/"NN & TD"), KHÔNG
    có toggle nội bộ nào (chỉ 1 cấp tab).
  - Gate tài khoản Free cho nội dung "NN & TD": Stockcode dùng biến `isAccountFree` (boolean) trực tiếp trong
    `CommonInfo.vue`, hiện `<ProtectedView :url="...">` (ảnh PNG TĨNH thiết kế sẵn). Indexcode dùng cơ chế
    `features_disabled['ta_nn_td']` (giống các màn Phân tích cơ bản khác) ở CẤP TAB NGOÀI
    (`Orderboard/Indexcode/index.vue`), hiện `<ProtectedView :featureName="...">` (ảnh blur từ server). **2 cơ
    chế gate hoàn toàn độc lập, không dùng chung logic.**
  - Header giá: Stockcode có component riêng `HeaderInfo.vue` (tên công ty dạng LINK, board:mã dạng LINK, icon
    chuông đặt cảnh báo, icon tooltip giải thích % thay đổi giá). Indexcode KHÔNG có component riêng — render
    trực tiếp trong `index.vue`, chỉ có text "Chỉ số {mã}" + giá, KHÔNG link, KHÔNG bell, KHÔNG tooltip.
  - Chỉ Indexcode có khối "Định giá" (so sánh P/E hoặc P/B với điểm chỉ số theo thời gian, kèm dải độ lệch
    chuẩn) — khái niệm này không áp dụng cho mã cổ phiếu thường.
- **Nguồn:** đọc đầy đủ các file trên + đo DOM thật (đổi mã sang VNINDEX ngay trên biểu đồ, quan sát panel phải
  chuyển nhánh, đối chiếu field-by-field với `CommonInfo.vue`/`CommonInfoIndex.vue`).
- **Quy ước trạng thái:** giống [phan-tich-ky-thuat.md](phan-tich-ky-thuat.md).

---

## Nhóm: Header giá — mã cổ phiếu thường (Stockcode)

# [TC_PTKT_TT_01] Header hiển thị đúng thông tin giá mã cổ phiếu thường

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng "thông tin mã + màu giá" trong Sheet
- **Ghi chú:** Chỉ mã CÓ ĐỘ DÀI 3 KÝ TỰ (`mack.length === 3`, phân biệt với mã phái sinh dài hơn như VN30F1M)
  mới có link tên công ty + link board:mã + icon chuông.

## Các bước thực hiện
1. Đổi mã CK đang xem (tab biểu đồ active) sang 1 mã cổ phiếu thường (VD "ACB").
2. Quan sát header panel "Thông tin".

## Kết quả mong đợi
- [ ] Tên công ty hiển thị dạng link (mở `/phan-tich-co-ban?mack=ACB` ở tab mới khi click).
- [ ] Giá hiển thị kèm màu theo chiều tăng/giảm/tham chiếu.
- [ ] Dòng "HOSE: ACB" (hoặc sàn tương ứng) cũng là link tới cùng URL.
- [ ] Icon chuông (đặt cảnh báo) hiển thị cạnh dòng board:mã.
- [ ] % thay đổi hiển thị kèm icon tooltip (ⓘ).

---

# [TC_PTKT_TT_02] Click icon chuông mở đúng modal theo gói hội viên

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `showModalAlert()` trong `HeaderInfo.vue`: tài khoản Free → `store.state.isShowModalPackage =
  true` (modal mời nâng cấp); tài khoản thường → `store.state.isShowModalAlert = true` kèm
  `store.state.mackAlert = mack` (modal đặt cảnh báo giá — đã có chi tiết ở 1 màn khác, ở đây chỉ verify MỞ
  đúng, không chi tiết nội dung).

## Các bước thực hiện
1. Với tài khoản chính, click icon chuông ở header panel "Thông tin".
2. Đăng nhập tài khoản Free, lặp lại.

## Kết quả mong đợi
- [ ] Tài khoản chính: modal đặt cảnh báo giá mở ra.
- [ ] Tài khoản Free: modal mời nâng cấp gói hội viên mở ra (KHÔNG phải modal đặt cảnh báo).

---

# [TC_PTKT_TT_03] Hover icon tooltip (ⓘ) hiện giải thích cách tính % thay đổi giá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Tooltip CSS thuần (`:hover`), nội dung TĨNH giải thích khác biệt cách tính % giữa sàn UPCOM và
  HSX/HNX — không phụ thuộc mã đang xem.

## Các bước thực hiện
1. Hover vào icon (ⓘ) cạnh % thay đổi giá ở header panel "Thông tin".

## Kết quả mong đợi
- [ ] Tooltip hiện nội dung giải thích UPCOM/HSX/HNX tính % theo cách khác nhau.

---

## Nhóm: Header giá — mã chỉ số (Indexcode)

# [TC_PTKT_TT_04] Header hiển thị đúng cho mã chỉ số — KHÔNG có link/bell/tooltip

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Khác biệt so với mã cổ phiếu thường:** không có `HeaderInfo.vue` riêng — render trực tiếp trong
  `Indexcode/index.vue`, chỉ text tĩnh "Chỉ số {mã}" + dòng mã + giá, KHÔNG phải link, KHÔNG có icon chuông/
  tooltip.

## Các bước thực hiện
1. Đổi mã CK đang xem sang "VNINDEX".
2. Quan sát header panel "Thông tin".

## Kết quả mong đợi
- [ ] Hiển thị đúng "Chỉ số VNINDEX" + giá + % thay đổi.
- [ ] KHÔNG có link tới `/phan-tich-co-ban`, KHÔNG có icon chuông, KHÔNG có icon tooltip (ⓘ).

---

## Nhóm: Tab "Thông tin" → "Tổng quan" (Stockcode)

# [TC_PTKT_TT_05] Mini chart "Biểu đồ" hiển thị trong panel

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** Biểu đồ ECharts nhỏ trong ngày (`option_chart_price_vol`), CanvasRenderer — chỉ verify canvas tồn
  tại/hiển thị, không assert nội dung vẽ bên trong.

## Các bước thực hiện
1. Ở panel "Thông tin" (mã cổ phiếu thường), quan sát khu vực "Biểu đồ" ngay dưới header.

## Kết quả mong đợi
- [ ] Tiêu đề "Biểu đồ" + `<canvas>` hiển thị, có kích thước hợp lý (không sập chiều cao về 0).

---

# [TC_PTKT_TT_06] Toggle "Tổng quan"/"NN & TD" chuyển đúng nội dung

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** Toggle nội bộ CHỈ tồn tại ở nhánh Stockcode (`CommonInfo.vue`, `type_tab: 'overview' |
  'foreign_prop_transaction'`) — Indexcode không có toggle này (xem TC_PTKT_TT_19).

## Các bước thực hiện
1. Ở tab "Thông tin" (mã cổ phiếu thường), click "NN & TD".
2. Click lại "Tổng quan".

## Kết quả mong đợi
- [ ] Sau bước 1, nội dung đổi sang khối giao dịch nước ngoài/tự doanh (xem TC_PTKT_TT_11).
- [ ] Sau bước 2, nội dung quay lại đúng khối "Giao dịch"/"Chỉ số tài chính".

---

# [TC_PTKT_TT_07] Khối "Giao dịch" hiển thị đủ field (mã cổ phiếu thường)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng thông tin trần/sàn/tham chiếu trong Sheet

## Các bước thực hiện
1. Ở tab "Thông tin" → "Tổng quan" (mã cổ phiếu thường 3 ký tự, VD "ACB"), quan sát khối "Giao dịch".

## Kết quả mong đợi
- [ ] Đủ 5 dòng: "Trần - Sàn - TC", "Mở cửa - Cao - Thấp", "Giá trung bình", "Khối lượng" (đơn vị "CP"), "Tổng
      GTGD" (đơn vị "tỷ VNĐ").

---

# [TC_PTKT_TT_08] Khối "Hồ sơ" — link "Thông tin FA" + số liệu cổ phiếu

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** Tiêu đề "Hồ sơ" + link "Thông tin FA" CHỈ hiện khi `current_selected_index === 1 && !isAccountFree`
  (mặc định `current_selected_index = 1` với mã thường) — khối số liệu "Số lượng cổ phiếu/Vốn hóa/FreeFloat" bên
  dưới thì hiện ĐỘC LẬP (chỉ cần `mack.length === 3`), **kể cả khi tiêu đề "Hồ sơ" bị ẩn với tài khoản Free** (xem
  "Phát hiện đáng chú ý").

## Các bước thực hiện
1. Ở tab "Thông tin" → "Tổng quan" (mã cổ phiếu thường), quan sát khối dưới "Giao dịch".

## Kết quả mong đợi
- [ ] Tiêu đề "Hồ sơ" + link "Thông tin FA" hiển thị (tài khoản không Free).
- [ ] 3 dòng "Số lượng cổ phiếu", "Vốn hóa" (tỷ VNĐ), "FreeFloat" (%) hiển thị đúng.
- [ ] Click "Thông tin FA" mở tab mới `/phan-tich-co-ban?mack=<mã>` (xem TC_PTKT_15 ở tài liệu shell).

---

# [TC_PTKT_TT_09] Khối "Chỉ số tài chính" — đủ field cố định + field động từ API

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** Ngoài 12 field cố định, còn có DANH SÁCH ĐỘNG nạp từ API `/api/stocks/orderboard`
  (`data_common_info`, chỉ gọi khi `mack.length == 3`) — field thực tế do server quyết định (đã quan sát DOM
  thật gồm "Địa chỉ trụ sở"/"Số lượng nhân sự"/"Mã ngành ICB"/"Tên ngành ICB"/"Cấp ngành ICB"/"Vốn điều lệ"/
  "ROAA"/"ROEA"/"NIM" cho mã ACB — KHÔNG hard-code danh sách này trong test vì có thể khác theo từng mã, chỉ
  verify khối container không rỗng).

## Các bước thực hiện
1. Ở tab "Thông tin" → "Tổng quan" (mã cổ phiếu thường), quan sát khối "Chỉ số tài chính".

## Kết quả mong đợi
- [ ] Đủ 12 field cố định: EPS TTM, EPS điều chỉnh, BVPS, BVPS điều chỉnh, PE, PB, RSs, RSm, RSl, Beta, Mức độ
      biến động, Lợi nhuận kỳ vọng (CAPM).
- [ ] Có thêm ít nhất 1 dòng dữ liệu động phía dưới (field do API trả về, không cố định trong code).

---

# [TC_PTKT_TT_10] Hover RSs/RSm/RSl hiện biểu đồ lịch sử 10 phiên

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `mouseOverRs()` tạo `<div id="rs-tooltip-chart">` gắn vào `<body>`, gọi socket
  `getRslast10days` để vẽ chart nhỏ. `mouseleave` tự xóa div này.

## Các bước thực hiện
1. Hover vào dòng "RSs" trong khối "Chỉ số tài chính".

## Kết quả mong đợi
- [ ] `#rs-tooltip-chart` xuất hiện trong DOM với nội dung biểu đồ.
- [ ] Rời chuột khỏi dòng "RSs", `#rs-tooltip-chart` biến mất khỏi DOM.

---

## Nhóm: Tab "Thông tin" → "NN & TD" (Stockcode)

# [TC_PTKT_TT_11] Nội dung "NN & TD" — 2 khối xếp chồng, không phải toggle riêng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **⚠️ Khác giả định ban đầu:** đây KHÔNG phải 1 toggle "Nước ngoài"/"Tự doanh" như tên "NN & TD" gợi ý — cả 2
  khối "Giao dịch nước ngoài" (`ForeignTransaction.vue`) VÀ "Giao dịch tự doanh" (`PropTransaction.vue`) cùng
  hiển thị ĐỒNG THỜI, xếp chồng theo chiều dọc (đọc code `CommonInfo.vue` dòng 419-427: cả 2 component cùng
  `v-if="type_tab == 'foreign_prop_transaction'"`, không có điều kiện loại trừ nhau).

## Các bước thực hiện
1. Ở tab "Thông tin" (mã cổ phiếu thường), click "NN & TD".

## Kết quả mong đợi
- [ ] Khối "Giao dịch nước ngoài" hiển thị (KL Mua/Bán/Mua ròng + GT Mua/Bán/Mua ròng + toggle "1 Ngày"/"20
      Ngày" + biểu đồ).
- [ ] Khối "Giao dịch tự doanh" hiển thị NGAY BÊN DƯỚI, cùng lúc (KHÔNG cần thao tác gì thêm để xem cả 2).

---

# [TC_PTKT_TT_12] Toggle "1 Ngày"/"20 Ngày" trong khối Giao dịch nước ngoài

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Ở khối "Giao dịch nước ngoài" (tab "NN & TD"), click "20 Ngày".

## Kết quả mong đợi
- [ ] Nút "20 Ngày" chuyển active, tiêu đề biểu đồ đổi thành "Biểu đồ GDNN mua ròng 20 phiên".

---

# [TC_PTKT_TT_13] Tài khoản Free — tab "NN & TD" hiện ảnh tĩnh thay vì nội dung thật

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Gate bằng `isAccountFree` TRỰC TIẾP (không qua `features_disabled`), hiện
  `<ProtectedView :url="'/img/v3-dashboard/free_user_.../nn_td.png'">` — ảnh PNG tĩnh, KHÔNG gọi API dữ liệu thật.

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào tab "Thông tin" → "NN & TD" (mã cổ phiếu thường).

## Kết quả mong đợi
- [ ] Hiển thị 1 ảnh tĩnh (`.blurred-image`) thay cho 2 khối "Giao dịch nước ngoài"/"Giao dịch tự doanh" thật.

---

## Nhóm: Nhánh mã chỉ số (Indexcode) — so sánh khác biệt

# [TC_PTKT_TT_14] Tab "Thông tin" mã chỉ số — field khác hẳn mã cổ phiếu thường

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Khác biệt so với mã cổ phiếu thường:** KHÔNG có "Trần - Sàn - TC" (chỉ số không có trần/sàn), KHÔNG có "Giá
  trung bình"/"Tổng GTGD" riêng — thay bằng "Giá trị" (tổng giá trị giao dịch, tỷ đồng).

## Các bước thực hiện
1. Đổi mã CK sang "VNINDEX", ở tab "Thông tin", quan sát khối dữ liệu.

## Kết quả mong đợi
- [ ] Đủ 5 dòng: "Tham chiếu", "Mở cửa", "Thấp - cao", "Khối lượng", "Giá trị".
- [ ] KHÔNG có "Trần - Sàn - TC", KHÔNG có "Hồ sơ"/"Chỉ số tài chính" (khái niệm không áp dụng cho chỉ số).

---

# [TC_PTKT_TT_15] Biểu đồ "Số lượng cổ phiếu tăng/giảm/không đổi" — chỉ có ở mã chỉ số

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **⚠️ ĐÍNH CHÍNH (đo lại DOM thật):** biểu đồ này render bằng ECharts `CanvasRenderer` (`<x-vue-echarts>`, đặt
  ngay sau khối "Tổng quan" và trước "Định giá", KHÔNG có `<p>` tiêu đề riêng) — nhãn "Tăng"/"Giảm"/"Không đổi" +
  số mã tương ứng vẽ PIXEL bên trong `<canvas>`, KHÔNG tồn tại dưới dạng DOM text (`getByText` các nhãn này luôn
  trả 0 phần tử — đã xác nhận qua debug DOM/`innerHTML` thật). Cùng giới hạn kỹ thuật đã ghi nhận cho các biểu đồ
  ECharts khác trong dự án (radar 4M&CANSLIM, donut sở hữu nước ngoài...). Chỉ verify được canvas tồn tại/hiển
  thị, KHÔNG assert được nội dung vẽ bên trong.

## Các bước thực hiện
1. Ở tab "Thông tin" mã "VNINDEX", quan sát biểu đồ cột dưới khối dữ liệu chính.

## Kết quả mong đợi
- [ ] Biểu đồ (`<x-vue-echarts class="... mt-2 ...">`, canvas bên trong) hiển thị đúng vị trí (giữa "Tổng quan" và
      "Định giá"), có kích thước hợp lý (không sập chiều cao về 0) — KHÔNG assert được nội dung "Tăng"/"Giảm"/
      "Không đổi" (canvas thuần, không phải DOM text).

---

# [TC_PTKT_TT_16] Khối "Định giá" — chỉ có ở mã chỉ số

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** So sánh P/E hoặc P/B của chỉ số theo thời gian kèm dải độ lệch chuẩn — khái niệm này KHÔNG tồn
  tại ở panel "Thông tin" của mã cổ phiếu thường.

## Các bước thực hiện
1. Ở tab "Thông tin" mã "VNINDEX" (tài khoản không Free), cuộn xuống khối "Định giá".
2. Đổi select từ "P/E" sang "P/B".

## Kết quả mong đợi
- [ ] Khối "Định giá" hiển thị select "P/E"/"P/B" + 2 checkbox "1 Độ lệch chuẩn"/"2 Độ lệch chuẩn" + biểu đồ.
- [ ] Sau khi đổi select, legend biểu đồ đổi tương ứng "P/B".

---

# [TC_PTKT_TT_17] Checkbox độ lệch chuẩn loại trừ lẫn nhau

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `watch: is_1std/is_2std` — tick 1 ô tự bỏ tick ô còn lại.

## Các bước thực hiện
1. Ở khối "Định giá" (mã chỉ số), tick "2 Độ lệch chuẩn" (mặc định "1 Độ lệch chuẩn" đang tick).

## Kết quả mong đợi
- [ ] "2 Độ lệch chuẩn" được tick, "1 Độ lệch chuẩn" tự động bỏ tick.

---

# [TC_PTKT_TT_18] Tài khoản Free — khối "Định giá" mã chỉ số hiện ảnh tĩnh

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Cùng cơ chế `isAccountFree` + `ProtectedView :url` như TC_PTKT_TT_13, nhưng đây là gate RIÊNG của
  `CommonInfoIndex.vue` (ảnh `dinh_gia_ta.png`) — độc lập với gate "NN & TD" cấp tab ngoài (TC_PTKT_TT_20).

## Các bước thực hiện
1. Đăng nhập tài khoản Free, xem mã "VNINDEX", tab "Thông tin".

## Kết quả mong đợi
- [ ] Khối "Tổng quan" + biểu đồ tăng/giảm vẫn hiển thị bình thường (KHÔNG bị gate).
- [ ] Khối "Định giá" bị thay bằng ảnh tĩnh (`.blurred-image`).

---

# [TC_PTKT_TT_19] Tab ngoài mã chỉ số chỉ có "Thông tin"/"NN & TD", không có toggle nội bộ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Ở panel "Thông tin" mã "VNINDEX", quan sát dãy tab ngoài cùng.

## Kết quả mong đợi
- [ ] Chỉ có đúng 2 tab: "Thông tin", "NN & TD" (KHÔNG có "Sổ lệnh"/"Cung cầu"/"Bài viết").
- [ ] Trong tab "Thông tin" KHÔNG có toggle nội bộ "Tổng quan"/"NN & TD" nào khác (khác cấu trúc 2 tầng của mã
      cổ phiếu thường).

---

# [TC_PTKT_TT_20] Tài khoản Free — tab "NN & TD" mã chỉ số gate theo featureName

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `Orderboard/Indexcode/index.vue`: `featureName` trả `'ta_nn_td'` khi `type_tab == 'foreign_
  transaction'`, gate qua `features_disabled.hasOwnProperty('ta_nn_td')` — CƠ CHẾ KHÁC HẲN gate của mã cổ phiếu
  thường (`isAccountFree` trực tiếp, xem TC_PTKT_TT_13). Nếu tài khoản Free hiện tại KHÔNG có `ta_nn_td` trong
  `features_disabled` thực đo được, test sẽ ghi nhận đúng hành vi ĐO ĐƯỢC (không giả định).

## Các bước thực hiện
1. Đăng nhập tài khoản Free, xem mã "VNINDEX", click tab "NN & TD".
2. Đọc `localStorage.features_disabled` để đối chiếu có/không có key `ta_nn_td`.

## Kết quả mong đợi
- [ ] Nếu `features_disabled` có `ta_nn_td`: hiển thị `ProtectedView` (ảnh blur từ server).
- [ ] Nếu KHÔNG có: hiển thị nội dung "NN & TD" thật (ForeignTransactionIndex + PropTransactionIndex).

---

## Nhóm: Đồng bộ theo tab biểu đồ đang active & ngoài phạm vi

# [TC_PTKT_TT_21] Panel "Thông tin" luôn đồng bộ theo tab biểu đồ đang active

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới, đổi mã sang "VNINDEX".
2. Click tab biểu đồ khác (mã cổ phiếu thường có sẵn).
3. Click lại tab "VNINDEX" vừa thêm.

## Kết quả mong đợi
- [ ] Sau bước 2, panel "Thông tin" hiển thị nhánh Stockcode của mã đó.
- [ ] Sau bước 3, panel "Thông tin" quay lại đúng nhánh Indexcode "Chỉ số VNINDEX".
- [ ] **Dọn dẹp:** xóa lại tab đã thêm.

---

# [TC_PTKT_TT_22] Click tab "Sổ lệnh"/"Cung cầu"/"Bài viết" đổi đúng tab active (ngoài phạm vi chi tiết)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Chỉ verify ĐIỀU HƯỚNG đổi tab đúng — nội dung bên trong 3 tab này KHÔNG thuộc phạm vi chi tiết
  hoá của tài liệu này (đã chốt với người dùng).

## Các bước thực hiện
1. Ở panel "Thông tin" (mã cổ phiếu thường), click lần lượt "Sổ lệnh", "Cung cầu", "Bài viết".

## Kết quả mong đợi
- [ ] Mỗi lần click, đúng 1 tab active, nội dung đổi (không lỗi JS) — không verify chi tiết nội dung từng tab.

---

## Tổng hợp trạng thái (22 testcase — chỉ phạm vi tab "Thông tin")

Đã tự động hoá bằng Playwright:
[tests/phan-tich-ky-thuat-thong-tin.spec.ts](../tests/phan-tich-ky-thuat-thong-tin.spec.ts) (POM: section "Panel
Thông tin" trong [pages/TechnicalChartPage.ts](../pages/TechnicalChartPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 7 | TC_PTKT_TT_01, 05, 06, 07, 08, 09, 21 |
| 🆕 Mới (riêng web) | 15 | TC_PTKT_TT_02, 03, 04, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22 |
| ⚠️ Cần xác nhận thêm | 0 | |

**Phát hiện đáng chú ý:**
1. **"NN & TD" KHÔNG phải toggle loại trừ như tên gợi ý** — mã cổ phiếu thường hiển thị CẢ 2 khối "Giao dịch
   nước ngoài" + "Giao dịch tự doanh" ĐỒNG THỜI khi chọn tab này (TC_PTKT_TT_11).
2. **2 cơ chế gate tài khoản Free hoàn toàn độc lập trong CÙNG 1 panel:** mã cổ phiếu thường gate theo
   `isAccountFree` boolean trực tiếp (ảnh PNG tĩnh thiết kế sẵn); mã chỉ số gate theo `features_disabled['ta_nn_td']`
   (ảnh blur từ server, cùng cơ chế các màn Phân tích cơ bản khác). Khi sửa/thêm test liên quan gói hội viên cho
   panel này, PHẢI phân biệt đúng nhánh, không dùng chung logic.
3. **Tiêu đề "Hồ sơ" bị ẩn với tài khoản Free nhưng dữ liệu bên dưới (Số lượng cổ phiếu/Vốn hóa/FreeFloat) vẫn
   hiển thị bình thường** (TC_PTKT_TT_08) — 2 điều kiện `v-if` độc lập trong cùng `CommonInfo.vue`, dễ gây hiểu
   nhầm khi đọc code nhanh.
4. **Khối "Định giá" (P/E, P/B + độ lệch chuẩn) là khái niệm CHỈ tồn tại ở mã chỉ số** — không có tương đương ở
   panel "Thông tin" của mã cổ phiếu thường (TC_PTKT_TT_16).
5. **[ĐÍNH CHÍNH, lỗi ở chính test ban đầu — không phải bug web]** TC_PTKT_TT_15 ("Số lượng cổ phiếu tăng/giảm/
   không đổi") ban đầu viết test assert nhãn "Tăng"/"Giảm"/"Không đổi" dưới dạng DOM text — SAI, vì biểu đồ này
   render bằng ECharts `CanvasRenderer` (như "Biểu đồ"/"Định giá" cùng panel), mọi nhãn/số liệu vẽ pixel bên
   trong `<canvas>`, không có DOM text tương ứng. Đã sửa lại chỉ verify canvas tồn tại/hiển thị đúng vị trí.
