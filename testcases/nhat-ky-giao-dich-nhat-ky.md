# Màn hình: Nhật ký giao dịch — Tab "Nhật ký giao dịch"

- **URL:** `/nhat-ky-giao-dich` (`active_tab = 1`, hoặc deep-link `?tab=nhat-ky-giao-dich`) — xem tổng quan 4 tab
  ở [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** [tabTradingHistory.vue](../../stocks/src/views/tradingLog/tabTradingHistory.vue) (2 sub-tab:
  "Lịch sử giao dịch" → [tradingHistory.vue](../../stocks/src/views/tradingLog/tradingHistory.vue) +
  [itemTableTradingHistory.vue](../../stocks/src/views/tradingLog/itemTableTradingHistory.vue); "Thống kê phân
  tích" → [analysis.vue](../../stocks/src/views/tradingLog/analysis.vue)). Toàn bộ modal Thêm/Sửa/Xem/Xóa giao
  dịch + modal cổ tức tự động + popup chọn tags nằm trong component cha
  [index.vue](../../stocks/src/views/tradingLog/index.vue) (không phải trong
  `components/UpdateNoteTradingLogModal.vue` — file đó chỉ dùng cho panel Ghi chú ở Dashboard, kiến trúc/nội
  dung tương tự nhưng là 2 component độc lập).
- **Domain test:** https://kfsp.vn/nhat-ky-giao-dich
- **Nguồn testcase gốc (app):** Google Sheet, tab "Nhật Kí giao dịch" (144 dòng), nhóm liên quan tới "Nhật ký GD"
  (thêm/sửa/xóa giao dịch, lọc, xem chi tiết). Cấu trúc chung tương đồng nhưng web có nhiều khác biệt lớn: 2
  sub-tab "Lịch sử giao dịch"/"Thống kê phân tích" mà app không tách riêng, chế độ "Nhập hàng loạt" chỉ web mới
  có, cơ chế phát hiện cổ tức tự động (modal "Thông báo") chỉ web mới có → phần lớn testcase dưới đây là 🆕.
- **Phương pháp sinh:** Đọc toàn bộ `index.vue`, `tabTradingHistory.vue`, `tradingHistory.vue`,
  `itemTableTradingHistory.vue`, `analysis.vue`, `dropdownSearch.vue`, `listTags.vue`, `popupSelectTag.vue`,
  `textMask.vue`, `chartTradingHistory.vue`, `components/MultiAddTransactionForm.vue`,
  `mixins/BlockInvalidTransactionDateMixin.js` + kiểm kê độc lập qua DOM thật (`.dom-inspect/nkgd-lichsu*`,
  `nkgd-modal-them.*`).
- **⚠️ AN TOÀN DỮ LIỆU — QUAN TRỌNG:** Tab này có RẤT NHIỀU thao tác mutate dữ liệu thật (thêm/sửa/xóa giao
  dịch, tự động ghi nhận cổ tức). Mọi testcase POST/PUT/DELETE dưới đây **mặc định mock qua `page.route()`**
  (`route.fulfill()` giả lập thành công/lỗi hoặc `route.abort()`), KHÔNG có testcase nào để request mutate thật
  lọt qua production. Field "Ghi chú"/giá mục tiêu-cắt lỗ trong modal Sửa là những field DUY NHẤT có thể an
  toàn thao tác thật nếu cần (không ảnh hưởng số lượng/giá trị giao dịch), nhưng lần sinh này vẫn ưu tiên mock
  toàn bộ để nhất quán và an toàn tuyệt đối.
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Sub-tab & tổng quan

# [TC_NKGD_LS_01] Overview — 2 sub-tab, "Lịch sử giao dịch" active mặc định

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Vào tab "Nhật ký giao dịch".

## Kết quả mong đợi
- [ ] Hiển thị 2 sub-tab: "Lịch sử giao dịch" (active mặc định), "Thống kê phân tích".
- [ ] Sub-tab "Lịch sử giao dịch" hiển thị: nút "Lọc giao dịch", "Thêm giao dịch", "Xuất File Excel", bảng danh
      sách giao dịch nhóm theo danh mục.

---

# [TC_NKGD_LS_02] Chuyển sang sub-tab "Thống kê phân tích"

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click sub-tab "Thống kê phân tích".

## Kết quả mong đợi
- [ ] Hiển thị radar chart "Phong cách giao dịch", widget "Mức điểm rủi ro phù hợp", bảng + biểu đồ cột "Lợi
      nhuận theo...".
- [ ] Nút "Lọc giao dịch"/"Thêm giao dịch" KHÔNG hiển thị ở sub-tab này (chỉ dành riêng cho "Lịch sử giao dịch").

---

# [TC_NKGD_LS_03] Feature-gating riêng cho từng sub-tab

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `tabTradingHistory.vue` có `featureName` RIÊNG cho từng sub-tab: `'nkgd_lich_su_giao_dich'`
  (Lịch sử GD), `'nkgd_thong_ke_giao_dich'` (Thống kê phân tích) — độc lập với feature-gating cấp tab chính đã
  nêu ở [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md) TC_NKGD_09.
- **Kết quả đo được (tài khoản Free hiện tại):** CẢ 2 sub-tab đều hiển thị đúng `ProtectedView`
  (`.image-container > .blurred-image` visible) khi active — xác nhận cơ chế gate độc lập theo `featureName`
  của từng sub-tab hoạt động đúng. Tài khoản Free hiện tại không có quyền ở CẢ HAI sub-tab nên chưa minh hoạ
  được trường hợp lệch nhau (1 sub-tab mở, 1 sub-tab khóa) — nhưng đã xác nhận code dùng 2 `featureName` khác
  nhau (`nkgd_lich_su_giao_dich`/`nkgd_thong_ke_giao_dich`), không phải 1 gate dùng chung.

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`).
2. Vào tab "Nhật ký giao dịch", thử chuyển qua từng sub-tab.

## Kết quả mong đợi
- [ ] Sub-tab bị khóa hiển thị đúng 1 `ProtectedView` khi active — xác nhận đúng cho cả 2 sub-tab với tài khoản
      Free hiện tại.

---

## Nhóm: Bảng "Lịch sử giao dịch" — hiển thị, nhóm, sắp xếp

# [TC_NKGD_LS_04] Hiển thị đủ cột mặc định

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát bảng ở sub-tab "Lịch sử giao dịch".

## Kết quả mong đợi
- [ ] Cột mặc định: Mã CK, Ngày giao dịch, Loại giao dịch, Giá thực hiện, Khối lượng, Phí thực hiện, Lãi/lỗ,
      Ghi chú (đều sort được trừ Ghi chú).
- [ ] Đơn vị "nghìn đồng" hiển thị cạnh nút Xuất Excel.

---

# [TC_NKGD_LS_05] Nhóm theo danh mục, dòng "Tổng kết toàn bộ" luôn ở đầu

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát cấu trúc bảng: dòng tổng + các dòng "Danh mục: <tên>".

## Kết quả mong đợi
- [ ] Dòng "Tổng kết toàn bộ" hiển thị tổng Mua/Bán/Phí/Lãi-lỗ của TẤT CẢ danh mục, luôn hiển thị bất kể trạng
      thái thu gọn.
- [ ] Mỗi danh mục có 1 dòng tiêu đề riêng với tổng Mua/Bán/Phí/Lãi-lỗ của riêng danh mục đó.

---

# [TC_NKGD_LS_06] Thu gọn / mở rộng 1 danh mục

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click vào dòng "Danh mục: NKGD - V70" (hoặc 1 danh mục có sẵn giao dịch).

## Kết quả mong đợi
- [ ] Danh sách giao dịch con của danh mục đó mở rộng/thu gọn tương ứng mỗi lần click.

---

# [TC_NKGD_LS_07] Icon thu gọn/mở rộng TẤT CẢ danh mục

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Click icon collapse-all ở góc trái header bảng.

## Kết quả mong đợi
- [ ] Toàn bộ danh mục thu gọn hoặc mở rộng đồng loạt theo 1 lần click (đảo trạng thái `is_collapse_all`).

---

# [TC_NKGD_LS_08] Bật/tắt cột phụ qua icon bánh răng, lưu `localStorage`

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Trạng thái các checkbox cột phụ (Ghi chú, Thiết lập, Sai lầm, Giá mục tiêu 1-3, Giá cắt
  lỗ 1-3) được lưu vào `localStorage["field_table_trading_history_more"]`, giữ nguyên sau F5 reload.

## Các bước thực hiện
1. Click icon bánh răng (⚙) ở góc phải header bảng.
2. Tick thêm cột "Giá mục tiêu 1".
3. F5 reload trang, quay lại sub-tab "Lịch sử giao dịch".

## Kết quả mong đợi
- [ ] Cột "Giá mục tiêu 1" xuất hiện thêm trong bảng ngay sau khi tick.
- [ ] Sau F5, cột "Giá mục tiêu 1" vẫn hiển thị (không mất lựa chọn).

---

# [TC_NKGD_LS_09] Sắp xếp theo cột — chỉ áp dụng TRONG PHẠM VI 1 danh mục

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Ghi chú:** Đọc code xác nhận `sortData()` sort riêng từng nhóm danh mục, KHÔNG sort xuyên toàn bảng — khác
  với hành vi sort thông thường (1 bảng phẳng) mà người dùng có thể kỳ vọng.

## Các bước thực hiện
1. Click header cột "Giá thực hiện" khi đang có ≥ 2 danh mục mở rộng.

## Kết quả mong đợi
- [ ] Giao dịch trong MỖI danh mục được sắp xếp lại riêng theo giá trị cột đó, thứ tự các danh mục (nhóm)
      không đổi.

---

# [TC_NKGD_LS_10] Xuất File Excel bảng lịch sử giao dịch

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click "Xuất File Excel".

## Kết quả mong đợi
- [ ] Trình duyệt kích hoạt tải file `Nhật ký giao dịch.xlsx`, không có lỗi JS.

---

# [TC_NKGD_LS_11] Empty state khi bảng không có giao dịch nào (sau khi lọc)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** Đọc code + xác nhận qua DOM — khi kết quả lọc rỗng, bảng KHÔNG có bất kỳ thông
  báo "Không có dữ liệu"/"Chưa có giao dịch nào" nào — chỉ còn dòng "Tổng kết toàn bộ" với mọi số liệu = 0,
  không có danh mục nào bên dưới. Có thể gây hiểu lầm là trang đang lỗi/tải chậm thay vì đã lọc ra kết quả
  rỗng.

## Các bước thực hiện
1. Mở modal "Lọc giao dịch", lọc theo 1 mã CK chắc chắn không tồn tại trong lịch sử GD (hoặc khoảng ngày trong
   tương lai không có giao dịch).
2. Áp dụng lọc.

## Kết quả mong đợi
- [ ] Bảng chỉ còn dòng "Tổng kết toàn bộ" (= 0), không có nhóm danh mục nào, không crash.
- [ ] (Ghi nhận hạn chế UX) Không có thông báo rõ ràng "Không tìm thấy giao dịch phù hợp bộ lọc".

---

## Nhóm: Modal "Lọc giao dịch"

# [TC_NKGD_LS_12] Mở modal Lọc giao dịch — đủ field mặc định

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click "Lọc giao dịch".

## Kết quả mong đợi
- [ ] Hiển thị: "Xem theo" (Khoảng thời gian/Tùy chọn), "Loại lệnh" (Toàn bộ/Mua/Bán), "Mã CK" (multiselect),
      "Danh mục" (multiselect), "Thiết lập"/"Sai lầm" (chọn thẻ tags).
- [ ] Mặc định "Xem theo" = "Khoảng thời gian", "Thời gian" = "Toàn bộ".

---

# [TC_NKGD_LS_13] Lọc theo N tháng gần nhất

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mở modal Lọc, đổi "Thời gian" từ "Toàn bộ" sang "1 tháng gần nhất".
2. Click "Lọc".

## Kết quả mong đợi
- [ ] Bảng chỉ còn giao dịch có ngày GD trong vòng ~30 ngày gần nhất (`date >= now - 30 ngày`).

---

# [TC_NKGD_LS_14] Lọc theo khoảng ngày tùy chọn (Từ ngày - Đến ngày)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Đổi "Xem theo" sang "Tùy chọn".
2. Chọn "Từ ngày"/"Đến ngày" cụ thể, bấm "Lọc".

## Kết quả mong đợi
- [ ] Bảng chỉ còn giao dịch trong đúng khoảng ngày đã chọn (bao gồm 2 đầu mút).

---

# [TC_NKGD_LS_15] "Từ ngày" > "Đến ngày" — không bị chặn, kết quả rỗng, toast lỗi có thể lặp

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện bug**
- **⚠️ Phát hiện đáng chú ý (bug thật):** Đọc code `tradingHistory.vue`/`analysis.vue` — khi "Từ ngày" >
  "Đến ngày", `this.$toast.error(...)` được gọi **bên trong callback của `.filter()`** chạy trên từng phần tử
  `trading_logs`, KHÔNG phải 1 lần duy nhất. Với tài khoản có nhiều giao dịch (100+), toast lỗi có thể xuất
  hiện lặp lại rất nhiều lần liên tiếp. UI cũng KHÔNG chặn việc lưu bộ lọc không hợp lệ này (không có validate
  trước khi bấm "Lọc").

## Các bước thực hiện
1. Đổi "Xem theo" sang "Tùy chọn".
2. Chọn "Từ ngày" SAU "Đến ngày" (VD Từ ngày = hôm nay, Đến ngày = hôm qua).
3. Click "Lọc".

## Kết quả mong đợi
- [ ] Modal cho phép lọc (không có nút bị disable/chặn submit).
- [ ] Kết quả bảng rỗng (không giao dịch nào thỏa `from <= date <= to` vì khoảng không hợp lệ).
- [ ] (Bug ghi nhận) Toast lỗi có thể xuất hiện nhiều lần bất thường thay vì đúng 1 lần — nên báo dev cân nhắc
      thêm validate chặn submit hoặc gọi toast ngoài vòng lặp.

---

# [TC_NKGD_LS_16] Lọc theo Loại lệnh / Mã CK / Danh mục

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Mở modal Lọc, chọn "Loại lệnh" = "Mua", chọn 1-2 Mã CK, chọn 1-2 Danh mục, bấm "Lọc".

## Kết quả mong đợi
- [ ] Bảng chỉ còn đúng giao dịch Mua, thuộc đúng mã CK và danh mục đã chọn (kết hợp AND).

---

# [TC_NKGD_LS_17] Lọc theo thẻ "Thiết lập"/"Sai lầm"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở modal Lọc, click "Chọn thẻ tags" cạnh "Thiết lập", chọn 1 vài thẻ, "Lưu".
2. Bấm "Lọc" ở modal Lọc giao dịch.

## Kết quả mong đợi
- [ ] Nút hiển thị "+N thẻ được chọn" sau khi chọn.
- [ ] Bảng chỉ còn giao dịch có gắn đúng thẻ setup đã chọn.

---

# [TC_NKGD_LS_18] Đóng modal Lọc không áp dụng thay đổi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở modal Lọc, đổi vài field.
2. Click "Đóng" (không bấm "Lọc").

## Kết quả mong đợi
- [ ] Bảng KHÔNG thay đổi theo field vừa sửa (filter chỉ áp dụng thật khi bấm "Lọc", theo đúng cơ chế
      `filter_form_modal` tách biệt `filter_form`).

---

## Nhóm: Modal "Thêm giao dịch" — validate (KHÔNG mutate thật)

# [TC_NKGD_LS_19] Mở modal "Thêm giao dịch" — đủ field, 2 tab, 2 chế độ nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click "Thêm giao dịch".

## Kết quả mong đợi
- [ ] Modal "Thêm giao dịch" mở, 2 nav-tab con: "Giao dịch" (active mặc định), "Cổ tức & quyền".
- [ ] Trong tab "Giao dịch": 2 chế độ "Nhập đơn lẻ" (active mặc định)/"Nhập hàng loạt".
- [ ] Chế độ "Nhập đơn lẻ" hiển thị đủ field: Loại GD (mặc định Mua), Danh mục (mặc định danh mục đầu), Ngày GD
      (mặc định hôm nay), Mã CK, Khối lượng, Giá thực hiện, Phí (mặc định 0.15), nút "Chọn thẻ tags" cho Thiết
      lập/Sai lầm, biểu đồ "Giá mục tiêu - cắt lỗ" (trống vì chưa nhập Mã CK), 6 ô Giá mục tiêu/cắt lỗ 1-3, Ghi
      chú.

---

# [TC_NKGD_LS_20] Validate Mã CK không hợp lệ

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Ghi chú:** Validate dựa vào `$store.state.data_eod.hasOwnProperty(mack)` — mã CK phải tồn tại trong danh
  sách EOD đang tải trên client, không gọi API riêng để check.

## Các bước thực hiện
1. Mở modal Thêm giao dịch, nhập Mã CK không tồn tại (VD "ZZZ" hoặc để trống).
2. Điền đủ các field còn lại hợp lệ, click "Lưu".

## Kết quả mong đợi
- [ ] Toast lỗi "Mã CK không hợp lệ", KHÔNG gọi API `POST /api/stocks/trading_log/store`, modal vẫn mở.

---

# [TC_NKGD_LS_21] Validate Khối lượng ≤ 0

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Nhập Mã CK hợp lệ, Khối lượng = 0.
2. Click "Lưu".

## Kết quả mong đợi
- [ ] Toast lỗi "Khối lượng phải lớn hơn 0", không gọi API.

---

# [TC_NKGD_LS_22] Validate Ngày giao dịch > hôm nay

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Điền đủ field hợp lệ, chọn Ngày giao dịch là ngày trong tương lai.
2. Click "Lưu".

## Kết quả mong đợi
- [ ] Toast lỗi "Ngày giao dịch phải bé hơn hoặc bằng ngày hiện tại!", không gọi API.

---

# [TC_NKGD_LS_23] Validate ngày giao dịch rơi vào cuối tuần/ngày lễ — khóa toàn bộ field liên quan

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Ghi chú:** `BlockInvalidTransactionDateMixin` check cuối tuần (Thứ 7/CN) + danh sách ngày lễ dương lịch cố
  định (01-01, 30-04, 01-05, 02-09). Khi `isInvalidTransactionDate = true`, toast lỗi hiện ngay khi đổi ngày VÀ
  hầu hết field khác trong form (Danh mục, Khối lượng, Giá, Phí, nút chọn tags, nút "Lưu") đều bị khóa
  (`:disabled="isInvalidTransactionDate"`).

## Các bước thực hiện
1. Mở modal Thêm giao dịch, đổi "Ngày giao dịch" thành 1 ngày Chủ nhật bất kỳ (hoặc 01/01 nếu trong khoảng cho
   phép chọn).

## Kết quả mong đợi
- [ ] Toast lỗi "Không thể thực hiện giao dịch vào ngày này...".
- [ ] Các field Danh mục/Khối lượng/Giá/Phí/nút chọn tags/nút "Lưu" chuyển sang trạng thái disabled.

---

# [TC_NKGD_LS_24] Validate Bán vượt quá khối lượng tồn

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Chọn Loại GD = "Bán", nhập Mã CK đang có khối lượng tồn thấp trong danh mục đã chọn (hoặc = 0), nhập Khối
   lượng lớn hơn khối lượng tồn thực tế.
2. Click "Lưu".

## Kết quả mong đợi
- [ ] Toast lỗi "Khối lượng bán phải bé hơn hoặc bằng số lượng mua!", không gọi API.

---

# [TC_NKGD_LS_25] Validate giá mục tiêu/cắt lỗ trùng lặp trong cùng nhóm

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Điền đủ field hợp lệ, nhập Giá mục tiêu 1 = Giá mục tiêu 2 (cùng 1 giá trị khác 0).
2. Click "Lưu".

## Kết quả mong đợi
- [ ] Toast lỗi "Giá mục tiêu 1 phải khác giá mục tiêu 2 và 3!", không gọi API.

---

# [TC_NKGD_LS_26] Thêm giao dịch thành công (mock API 200)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `POST /api/stocks/trading_log/store` trả `200` kèm `list_data_item`/`trading_style` giả lập.
2. Điền đủ field hợp lệ, click "Lưu".

## Kết quả mong đợi
- [ ] Toast thành công có nội dung chi tiết (loại GD, khối lượng, mã, giá, phí).
- [ ] Bảng lịch sử GD cập nhật theo dữ liệu mock trả về.

---

# [TC_NKGD_LS_27] Thêm giao dịch lỗi API (mock 500)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `POST /api/stocks/trading_log/store` trả lỗi 500.
2. Điền đủ field hợp lệ, click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại", modal vẫn mở (không tự đóng khi lỗi).

---

# [TC_NKGD_LS_28] Double-click nút "Lưu" — chưa có guard chống double-submit

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** Đọc code xác nhận không có cờ `isSaving`/disable nút khi đang chờ response.

## Các bước thực hiện
1. Mock API thêm giao dịch trả về sau 1-2 giây (delay), đếm số request qua `page.on('request')`.
2. Điền đủ field hợp lệ, double-click thật nhanh vào nút "Lưu".

## Kết quả mong đợi
- [ ] (Ghi nhận hành vi thật đo được) Có thể ghi nhận ≥ 2 request `POST` được gửi — xác nhận thiếu guard chống
      double-submit, nên báo dev cân nhắc bổ sung.

---

# [TC_NKGD_LS_29] Chọn thẻ "Thiết lập"/"Sai lầm" trong modal Thêm giao dịch

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click "Chọn thẻ tags" cạnh "Thiết lập".
2. Chọn 2-3 thẻ ở các nhóm khác nhau (Tín hiệu kỹ thuật/Chỉ tiêu tài chính), click "Lưu" trong popup.

## Kết quả mong đợi
- [ ] Popup đóng, các thẻ đã chọn hiển thị dưới dạng chip màu (xanh cho Thiết lập, đỏ cho Sai lầm) ngay trong
      form Thêm giao dịch, có thể click "x" trên từng chip để bỏ chọn nhanh.

---

# [TC_NKGD_LS_30] Nút "Hủy" đóng modal Thêm giao dịch không lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Điền vài field trong modal Thêm giao dịch.
2. Click "Hủy".

## Kết quả mong đợi
- [ ] Modal đóng, không có request nào được gửi.

---

# [TC_NKGD_LS_31] Tab "Cổ tức & quyền" — cảnh báo mã không thuộc danh mục / ngày không trùng sự kiện

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Trong modal Thêm giao dịch, chuyển sang tab "Cổ tức & quyền".
2. Nhập 1 Mã CK KHÔNG có trong danh mục đang chọn.
3. Nhập 1 Ngày giao dịch không trùng với bất kỳ sự kiện cổ tức/quyền nào đã ghi nhận cho mã đó.

## Kết quả mong đợi
- [ ] Hiển thị cảnh báo đỏ "Mã chứng khoán này không có trong danh mục hiện tại, vui lòng chọn lại!" và field
      "Ngày giao dịch" bị khóa khi cảnh báo mã đang hiện.
- [ ] Khi mã hợp lệ nhưng ngày không trùng sự kiện, hiển thị cảnh báo "Ngày giao dịch bạn nhập không trùng
      trong cơ sở dữ liệu!".

---

# [TC_NKGD_LS_32] Chế độ "Nhập hàng loạt" — thêm/xóa dòng, validate từng dòng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Trong modal Thêm giao dịch (tab "Giao dịch"), chuyển sang "Nhập hàng loạt".
2. Click "+ Thêm giao dịch khác" 2 lần (tổng 3 dòng).
3. Xóa 1 dòng bằng icon thùng rác.
4. Để trống Mã CK ở 1 dòng, click "Lưu" (submitData).

## Kết quả mong đợi
- [ ] Thêm/xóa dòng hoạt động đúng; luôn giữ tối thiểu 1 dòng (không cho xóa dòng cuối cùng).
- [ ] Toast lỗi "Vui lòng nhập mã CK" khi có dòng thiếu Mã CK, KHÔNG gọi API `add-bulk`.

---

# [TC_NKGD_LS_33] "Nhập hàng loạt" — submit thành công (mock)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `POST {NestAPI}/api/tradinglog/add-bulk` trả `{ success: true }`.
2. Điền đủ 1 dòng hợp lệ, click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Thêm mới giao dịch thành công!", modal đóng, bảng lịch sử GD được yêu cầu tải lại
      (`get-data-trading-log` event).

---

## Nhóm: Modal "Sửa giao dịch"

# [TC_NKGD_LS_34] Mở modal Sửa — giao dịch Mua/Bán thường

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Ghi chú:** Đọc trực tiếp template `index.vue` (KHÔNG dựa vào `UpdateNoteTradingLogModal.vue`) — CHỈ field
  "Mã CK" bị khóa cứng (`disabled`); Loại GD, Danh mục, Ngày GD, Khối lượng, Giá, Phí, tags Thiết lập/Sai lầm,
  6 ô giá mục tiêu/cắt lỗ, Ghi chú đều **sửa được**.

## Các bước thực hiện
1. Click icon "..." trên 1 dòng giao dịch Mua/Bán thường → "Sửa".

## Kết quả mong đợi
- [ ] Modal "Sửa giao dịch" mở, prefill đúng dữ liệu hiện có, field "Mã CK" disabled, các field còn lại
      editable.

---

# [TC_NKGD_LS_35] Sửa giao dịch thường thành công (mock)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `PUT /api/stocks/trading_log/update` trả `200`.
2. Mở modal Sửa, đổi Ghi chú, click nút "Lưu" (`#editTradingLog`).

## Kết quả mong đợi
- [ ] Toast thành công chi tiết, modal đóng.

---

# [TC_NKGD_LS_36] Sửa giao dịch lỗi 422 → thông báo riêng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `PUT /api/stocks/trading_log/update` trả lỗi có chứa "422" trong message.
2. Click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Giao dịch không hợp lệ! Vui lòng thử lại." (khác với thông báo lỗi chung), modal đóng.

---

# [TC_NKGD_LS_37] Sửa giao dịch lỗi mạng/500 — modal vẫn tự đóng dù lỗi

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** Đọc code `saveFormEdit()` (nhánh giao dịch thường) — CẢ 2 nhánh lỗi (422 và lỗi
  chung) đều set `this.is_show_form_edit = false` TRƯỚC/TRONG lúc hiện toast lỗi → modal luôn tự đóng dù request
  thất bại, người dùng mất toàn bộ thay đổi vừa nhập, không có cách "thử lại ngay" mà phải mở lại từ đầu.

## Các bước thực hiện
1. Mock `PUT /api/stocks/trading_log/update` trả lỗi 500 (không chứa "422").
2. Sửa vài field, click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại".
- [ ] (Ghi nhận hành vi thật) Modal tự đóng ngay cả khi request thất bại — nên báo dev cân nhắc giữ modal mở để
      người dùng có thể sửa lại/thử lại ngay.

---

# [TC_NKGD_LS_38] Mở modal Sửa — giao dịch Cổ tức/Quyền

- **Trạng thái:** ⚠️ Cần xác nhận thêm — mô tả field editable/disabled đọc trực tiếp từ source `index.vue`
  (đáng tin cậy), nhưng CHƯA verify được bằng automation vì chưa xác định chắc chắn tài khoản test có sẵn giao
  dịch Cổ tức/Quyền ổn định (không đổi qua các lần chạy) để làm target — xem `test.fixme` trong spec.
- **Ghi chú:** Ngược lại với GD thường — CHỈ "Mã CK" (DropdownSearch) và Khối lượng/Slcp KHÔNG bị khóa; Loại
  GD, Danh mục, Ngày GD, giá/tỷ lệ/tổng giá trị, Ghi chú đều **disabled**.

## Các bước thực hiện
1. Click icon "..." trên 1 dòng giao dịch Cổ tức/Quyền (nếu tài khoản test có sẵn) → "Sửa".

## Kết quả mong đợi
- [ ] Modal mở với "Mã CK" và trường khối lượng/Slcp editable, các field còn lại disabled.

---

# [TC_NKGD_LS_39] Đổi Loại giao dịch trong modal Sửa cổ tức — reset lại field liên quan

- **Trạng thái:** ⚠️ Cần xác nhận thêm — cùng lý do phụ thuộc dữ liệu ở TC_NKGD_LS_38 (cần mở được modal Sửa
  cổ tức trước) — xem `test.fixme` trong spec.
- **Ghi chú:** Watcher `form_edit.type` gọi `handleFormEditType()` khi loại GD đổi khác `currentFormType` ban
  đầu — reset giá/phí/tỷ lệ/tổng giá trị về 0 và tải lại danh sách sự kiện theo `channelid` tương ứng.

## Các bước thực hiện
1. Mở modal Sửa 1 giao dịch Cổ tức tiền mặt, đổi Loại giao dịch sang "Cổ tức cổ phiếu".

## Kết quả mong đợi
- [ ] Các field Giá/Phí/Tỷ lệ/Tổng giá trị reset về 0, nhãn field đổi đúng theo loại mới ("Slcp hưởng cổ
      tức"...).

---

## Nhóm: Modal "Xem giao dịch"

# [TC_NKGD_LS_40] Mở modal Xem — mọi field readonly, đúng dữ liệu

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click trực tiếp vào 1 dòng giao dịch (không qua icon "...", vì mục "Xem" trong menu "..." đã bị comment out
   trong code — chỉ còn "Sửa"/"Xóa").

## Kết quả mong đợi
- [ ] Modal "Xem giao dịch" mở, mọi field disabled, dữ liệu khớp đúng dòng vừa click.
- [ ] Đóng bằng nút "Đóng" hoạt động đúng.

---

## Nhóm: Xóa giao dịch

# [TC_NKGD_LS_41] Icon "..." → "Xóa" mở modal xác nhận

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click icon "..." trên 1 dòng giao dịch → "Xóa".

## Kết quả mong đợi
- [ ] Modal "Xóa dữ liệu" (size sm) mở, nội dung "Bạn có chắc chắn không?", nút "Hủy"/"Xóa".

---

# [TC_NKGD_LS_42] Xác nhận xóa thành công (mock)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `DELETE /api/stocks/trading_log/{id}` trả `200`.
2. Mở modal xóa 1 giao dịch, click "Xóa" (`#delteTradingLog`).

## Kết quả mong đợi
- [ ] Toast "Đã xóa giao dịch thành công", modal đóng, bảng cập nhật theo dữ liệu mock trả về.

---

# [TC_NKGD_LS_43] Chặn xóa giao dịch "Mua" khi khối lượng đã bán vượt tồn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass** (ban đầu đánh dấu ⚠️/`test.fixme` vì lo
  ngại cần dữ liệu biên riêng, sau đó phát hiện dòng "Mua" ĐẦU TIÊN của danh mục "Lướt Sóng" trên chính tài
  khoản test hiện có đã tái hiện đúng tình huống này một cách ổn định — không cần dữ liệu setup thêm, đã
  chuyển thành testcase tự động hoá đầy đủ)
- **Ghi chú:** `showFormDelete()` có điều kiện `item.khoi_luong > khoi_luong_ton > 0` (chained comparison — về
  mặt kết quả tương đương `item.khoi_luong > khoi_luong_ton`, không phải bug logic dù cách viết dễ gây hiểu
  nhầm) để chặn xóa giao dịch Mua nếu xóa sẽ khiến khối lượng tồn âm.

## Các bước thực hiện
1. Chọn 1 giao dịch "Mua" mà việc xóa sẽ khiến tổng khối lượng tồn của mã đó trong danh mục bị âm (đã có giao
   dịch Bán sau đó dựa vào đúng số lượng mua này).
2. Click icon "..." → "Xóa".

## Kết quả mong đợi
- [ ] Modal xác nhận KHÔNG mở, thay vào đó hiện toast lỗi "Không thể xóa giao dịch này!".

---

# [TC_NKGD_LS_44] Xóa giao dịch lỗi API — bug mất `this` trong `.catch`

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện bug thật**
- **⚠️ Phát hiện đáng chú ý (bug thật, đã xác nhận đúng thông điệp lỗi thật):** Đọc code `deleteTrading()` —
  nhánh `.catch(function(error) {...})` dùng `function` thường (không phải arrow function), nên bên trong
  `this` KHÔNG còn trỏ tới Vue instance. Đã đo được CHÍNH XÁC lỗi ném ra qua `page.on('pageerror', ...)`:
  ```
  TypeError: Cannot set properties of undefined (setting 'is_show_form_delete')
  ```
  (ném ngay tại dòng `this.is_show_form_delete = false;` — dòng NÀY chạy trước dòng gọi `this.$toast.error(...)`
  nên toast lỗi KHÔNG BAO GIỜ được gọi tới, không phải do `$toast` bị lỗi).

## Các bước thực hiện
1. Mock `DELETE /api/stocks/trading_log/{id}` trả lỗi 500.
2. Đăng ký listener `page.on('pageerror', ...)`.
3. Mở modal xóa 1 giao dịch, click "Xóa".

## Kết quả mong đợi
- [ ] (Kỳ vọng ban đầu) Toast lỗi "Có lỗi xảy ra, vui lòng thử lại" hiển thị, modal vẫn mở lại để thử lại.
- [ ] (Hành vi thật đo được — BUG) Không có toast lỗi nào hiển thị; thay vào đó ghi nhận 1 `pageerror`
      (`TypeError: Cannot set properties of undefined (setting 'is_show_form_delete')`). Modal xác nhận xóa vẫn
      hiển thị mở (vì dòng set `false` chính là dòng gây lỗi, không chạy xong). Cần báo dev sửa (đổi
      `function(error)` thành arrow function `(error) => {...}`).

---

## Nhóm: Sub-tab "Thống kê phân tích"

# [TC_NKGD_LS_45] Overview — radar chart, mức điểm rủi ro, bảng lợi nhuận

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Vào sub-tab "Thống kê phân tích".

## Kết quả mong đợi
- [ ] Radar chart "Phong cách giao dịch" với 3 trục (Nhà kinh doanh CP/Nhà giao dịch CP/Nhà đầu tư giá trị).
- [ ] Widget "Mức điểm rủi ro phù hợp" (thanh gradient + mũi tên).
- [ ] Bảng + biểu đồ cột "Lợi nhuận theo Mã CK" (mặc định), dropdown đổi tiêu chí nhóm, dropdown "Xem theo",
      multiselect "Danh mục", điều khiển zoom.

---

# [TC_NKGD_LS_46] Đổi tiêu chí "Lợi nhuận theo..."

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Đổi dropdown "Lợi nhuận theo..." sang "Ngành" rồi "Tháng".

## Kết quả mong đợi
- [ ] Bảng/biểu đồ nhóm lại đúng theo tiêu chí mới, nhãn cột/trục X đổi tương ứng.

---

# [TC_NKGD_LS_47] Click cột biểu đồ mở popup "Lịch sử giao dịch" con

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click vào 1 cột trên biểu đồ "Lợi nhuận".

## Kết quả mong đợi
- [ ] Mở popup hiển thị đúng danh sách giao dịch thuộc nhóm (mã CK/ngành/tháng...) vừa click, dùng lại component
      bảng lịch sử GD nhưng ẩn nút "Lọc giao dịch"/"Thêm giao dịch"/menu "..." trên từng dòng.
- [ ] Click vào 1 dòng giao dịch trong popup này VẪN mở được modal "Xem giao dịch" dù không thấy nút/menu riêng
      cho hành động đó (đã xác nhận qua đọc code `onClickRow` không phụ thuộc `component_name`).

---

# [TC_NKGD_LS_48] Bug: Xuất File Excel làm hỏng vĩnh viễn `fields_table`, thêm cột "Mã CK" thừa (chỉ lộ ra ở lần re-render kế tiếp)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện bug thật nghiêm trọng, đã xác định
  chính xác cơ chế (khác giả thuyết ban đầu)**
- **⚠️ Phát hiện đáng chú ý (bug thật, đã xác nhận cơ chế chính xác):** `analysis.vue` định nghĩa CẢ
  `fields_table` LẪN `schema` là 2 `computed` KHÔNG phụ thuộc bất kỳ reactive data nào → Vue chỉ evaluate MỖI
  CÁI đúng 1 LẦN DUY NHẤT trong toàn vòng đời component rồi cache mãi mãi (kể cả gọi lại getter nhiều lần sau
  đó, Vue trả thẳng giá trị cache, KHÔNG chạy lại thân hàm). `schema` (chỉ được truy cập khi bấm "Xuất File
  Excel") gọi `this.fields_table.unshift({value: "identify", label: "Mã CK"})` — MUTATE trực tiếp mảng đã
  cache của `fields_table`. Vì mảng trả về từ computed KHÔNG phải reactive array được Vue theo dõi
  (`unshift` không kích hoạt render lại), bấm "Xuất File Excel" bao nhiêu lần cũng CHỈ mutate được đúng 1 LẦN
  DUY NHẤT (evaluate đầu tiên của `schema`) — 2 lần bấm sau không lặp lại thêm bug. Và ngay sau export, bảng
  trên màn hình VẪN hiển thị đúng — mảng đã hỏng trong bộ nhớ nhưng chưa được đọc lại. Chỉ khi có 1 tương tác
  KHÁC buộc Vue re-render bảng (VD click sắp xếp 1 cột — đổi state reactive thật `key_sort`/`type_sort`), cột
  "Mã CK" thừa mới XUẤT HIỆN trên header hàng 2 của bảng — và luôn đúng 1 cột thừa, không nhân theo số lần bấm
  xuất Excel.

## Các bước thực hiện
1. Ở sub-tab "Thống kê phân tích", đếm số cột "Mã CK" ở hàng header thứ 2 của bảng "Lợi nhuận" (baseline = 0).
2. Click "Xuất File Excel" 3 lần liên tiếp (không cần đợi file tải xong giữa các lần).
3. Đếm lại ngay sau export (chưa có tương tác nào khác).
4. Click sắp xếp 1 cột bất kỳ trong bảng (buộc re-render).
5. Đếm lại lần cuối.

## Kết quả mong đợi
- [ ] (Kỳ vọng đúng) Số cột "Mã CK" thừa luôn = 0, bất kể xuất Excel bao nhiêu lần.
- [ ] (Hành vi thật đo được — BUG) Ngay sau export vẫn = 0 (chưa lộ). Sau khi ép re-render (click sắp xếp),
      xuất hiện ĐÚNG 1 cột "Mã CK" thừa (không phải 3, dù đã export 3 lần) — xác nhận bug side-effect ẩn trong
      computed, chỉ lộ ra gián tiếp qua tương tác không liên quan. Cần báo dev sửa: không nên mutate mảng trả
      về từ 1 computed khác, nên tính `schema` bằng bản sao mới (`[...this.fields_table]` hoặc
      `{value: "identify", label: "Mã CK"}, ...this.fields_table]`) thay vì `unshift` trực tiếp lên
      `this.fields_table`.

---

# [TC_NKGD_LS_49] `get-risk-aversion-index` lỗi mạng — không crash, không có cảnh báo

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Lỗi API chỉ `console.error`, `risk_aversion_index` giữ giá trị mặc định 0 — widget vẫn hiển thị
  bình thường như đã tính xong, không có cách nào phân biệt "đang lỗi" với "kết quả thật là mức thấp nhất". Ghi
  nhận là hạn chế UX, không phải crash.

## Các bước thực hiện
1. Mock `GET .../api/stocks/trading_log/get-risk-aversion-index` trả lỗi 500.
2. Vào sub-tab "Thống kê phân tích".

## Kết quả mong đợi
- [ ] Trang không crash, widget "Mức điểm rủi ro phù hợp" vẫn hiển thị (với giá trị mặc định), không có toast
      lỗi nào cho người dùng biết dữ liệu chưa tải được.

---

## Tổng hợp trạng thái (49 testcase)

Đã tự động hoá bằng Playwright: [tests/nhat-ky-giao-dich-nhat-ky.spec.ts](../tests/nhat-ky-giao-dich-nhat-ky.spec.ts)
(POM dùng chung: [pages/TradingLogPage.ts](../pages/TradingLogPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 20 | |
| 🆕 Mới (riêng web) | 27 | bao gồm TC_NKGD_LS_43 và TC_NKGD_LS_03 (đã chuyển từ ⚠️ sang tự động hoá đầy đủ) |
| ⚠️ Cần xác nhận thêm | 2 | TC_NKGD_LS_38/39 (cần giao dịch Cổ tức/Quyền ổn định) |

**Phát hiện đáng chú ý (bug thật, ưu tiên báo dev):**
1. **TC_NKGD_LS_48 — nghiêm trọng nhất và tinh vi nhất:** `analysis.vue` có CẢ `fields_table` LẪN `schema` là
   computed không có dependency reactive → mỗi cái chỉ evaluate ĐÚNG 1 LẦN trong vòng đời component rồi cache
   mãi mãi. `schema` (chạy khi bấm "Xuất File Excel") mutate trực tiếp mảng cache của `fields_table`
   (`unshift`) — do mảng trả về từ computed không phải reactive array, việc mutate KHÔNG kích hoạt re-render
   ngay, nên bảng trên màn hình vẫn đúng ngay sau khi export. Bug chỉ LỘ RA khi có 1 tương tác khác (không liên
   quan) buộc Vue re-render bảng (VD click sắp xếp cột) — lúc đó xuất hiện ĐÚNG 1 cột "Mã CK" thừa vĩnh viễn,
   bất kể đã bấm xuất Excel bao nhiêu lần trước đó.
2. **TC_NKGD_LS_44:** `deleteTrading()` dùng `.catch(function(error){...})` (không phải arrow function) → mất
   `this`, ném đúng `TypeError: Cannot set properties of undefined (setting 'is_show_form_delete')` thay vì
   hiển thị toast lỗi xóa giao dịch cho người dùng.
3. **TC_NKGD_LS_37:** `saveFormEdit()` luôn đóng modal Sửa dù request thất bại (cả nhánh lỗi 422 lẫn lỗi
   chung), người dùng mất toàn bộ thay đổi vừa nhập.
4. **TC_NKGD_LS_15:** Toast lỗi "Từ ngày > Đến ngày" bị gọi bên trong `.filter()` callback, có thể lặp lại hàng
   chục/hàng trăm lần với tài khoản nhiều giao dịch.
5. **TC_NKGD_LS_28:** Không có guard chống double-submit ở nút "Lưu" trong mọi modal Thêm/Sửa giao dịch (đo
   được 2 request POST khi double-click).
6. **TC_NKGD_LS_43:** Xóa giao dịch "Mua" gốc của 1 chuỗi giao dịch phụ thuộc (đã có Bán/Cổ tức dựa vào) bị
   chặn đúng như thiết kế, không phải bug — nhưng cần lưu ý khi viết test khác trong tab này: dòng "Mua" ĐẦU
   TIÊN của danh mục "Lướt Sóng" (tài khoản test) LUÔN rơi vào trường hợp này, không dùng được để test xóa
   thành công — phải chọn dòng "Bán" thay thế (xem cách `openDeleteOnFirstRow` trong spec).
7. Modal "Sửa giao dịch" có 2 bộ field editable HOÀN TOÀN KHÁC NHAU tùy loại giao dịch (thường vs cổ tức/quyền)
   — dễ viết nhầm test nếu không phân biệt rõ 2 trường hợp.
8. Bảng "Lịch sử giao dịch" (virtual-scroll-list, KHÔNG dùng `<table>` thật) render mọi dòng (kể cả dòng "Tổng
   kết toàn bộ") với 1 khoảng trắng ở ĐẦU `textContent` — locator dựa vào regex neo `^` phải luôn cho phép
   `\s*` ở đầu, nếu không sẽ không khớp được gì dù dữ liệu hiển thị đúng trên màn hình.
