# Màn hình: Nhật ký giao dịch — Tab "Giao dịch" (+ phiếu lệnh Mua/Bán, modal Thêm/Sửa/Chi tiết/Xóa)

- **URL:** `/nhat-ky-giao-dich`, tab thứ 2 "Giao dịch" (`active_tab = 1`, deep-link `?tab=nhat-ky-giao-dich`) — khung ở
  [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** `tradingLog/tabTradingHistory.vue` (khoá gói `nkgd_lich_su_giao_dich`) → `tradingHistory.vue` +
  `itemTableTradingHistory.vue`; phiếu lệnh, modal "Thêm giao dịch" (Nhập nâng cao), "Sửa giao dịch", "Chi tiết giao dịch",
  "Xóa dữ liệu" nằm ở `index.vue`; nhập hàng loạt `components/MultiAddTransactionForm.vue`; đối soát cổ tức `utils/dividendSync.js`
  + `components/DividendEventConfirmModal.vue`.
- **Môi trường:** https://kfsp.vn (production — đã ngang preprod mới nhất, deploy 06/11/2026 10:30 GMT; spec đọc `PREV2_BASE_URL` trong .env, hiện trỏ kfsp.vn) + `Prev2Session` + máy chủ giả `NkgdFakeServer` (11 giao dịch giả: Mua 7, Bán 2, Cổ tức 2; 3 danh mục).
- **Cập nhật 09/11/2026 — viết lại theo giao diện mới (nhánh B).** Khác bản 20/08:
  - Tab đổi tên "Nhật ký giao dịch" → **"Giao dịch"**; bỏ 2 sub-tab — "Thống kê phân tích" thành tab riêng
    ([nhat-ky-giao-dich-phan-tich.md](nhat-ky-giao-dich-phan-tich.md), thay TC_NKGD_LS_45–49 cũ).
  - Nút "Thêm giao dịch" → 2 nút **"Mua"/"Bán"** mở **phiếu lệnh nhanh** (mã, danh mục, ngày, giá, khối lượng, ghi chú, phí %,
    Giá trị/Phí/Tổng chi|thu, "Xác nhận mua|bán", "Nhập nâng cao"). Modal "Thêm giao dịch" cũ chỉ mở qua "Nhập nâng cao", bỏ tab
    "Cổ tức & quyền" (TC_LS_31 cũ xoá).
  - Dòng cổ tức/quyền (GDKHQ) do backend tự đồng bộ: menu "..." chỉ còn **"Xóa"**, không sửa được nữa → TC_LS_38/39 cũ (fixme
    sửa cổ tức) **xoá**. Sau thêm/sửa/xoá, web gọi đối soát `sync-after-transactions`; có thay đổi thì hiện modal "Đã cập nhật
    sự kiện quyền" (thay modal "Thông báo" cũ).
  - Bấm dòng → modal "Chi tiết giao dịch" (thay "Xem giao dịch"). Danh mục > 20 giao dịch có "Tải thêm N giao dịch".
  - Bug cũ TC_LS_44 (mất `this` trong `.catch` khi xoá) **đã được sửa** (arrow function) → xoá dạng bug, thay bằng TC_LS_42.
- **Toast thành công đã bị tắt toàn app** (`main.js`, 12/10/2026) — "Đã thêm mới giao dịch…", "Đã cập nhật…", "Đã xóa…" không
  hiện. Chỉ còn toast lỗi.
- **⚠️ An toàn dữ liệu:** `/api/tradinglog/store`, `/api/tradinglog/add-bulk`, `PUT /api/stocks/trading_log/update`,
  `DELETE /api/stocks/trading_log/{id}`, `/api/dividend-auto-record/sync-after-transactions` đều vào máy chủ giả; ghi khác bị huỷ.
  (Pattern chặn của spec 20/08 — `/api/stocks/trading_log/store` — KHÔNG còn khớp endpoint mới `/api/tradinglog/store`: spec cũ
  chạy trên preprod sẽ ghi thật. Đã thay toàn bộ.)
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Bảng giao dịch

# [TC_NKGD_LS_01] Overview tab Giao dịch
- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** nút Mua/Bán thay "Thêm giao dịch"; nhãn đếm Mua/Bán/Cổ tức trên dòng tổng kết + danh mục.

## Các bước thực hiện
1. Mở tab "Giao dịch".

## Kết quả mong đợi
- [ ] Nút "Mua", "Bán", "Lọc giao dịch", "Xuất Excel".
- [ ] Cột: Mã CK, Ngày giao dịch, Loại giao dịch, Giá thực hiện (đồng), Khối lượng, Phí (đồng), Lãi/lỗ đã thực hiện (đồng), Ghi chú.
- [ ] Dòng "Tổng kết toàn bộ" "Mua 7 Bán 2 Cổ tức 2"; dòng "Danh mục: Cổ tức / Dài hạn / Lướt sóng" (Dài hạn "Mua 3 Bán 1 Cổ tức 1"),
      mặc định đang gập (không dòng giao dịch nào).

---

# [TC_NKGD_LS_02] Mở/gập 1 danh mục
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Bấm "Danh mục: Dài hạn"; bấm lần 2.

## Kết quả mong đợi
- [ ] Hiện 5 giao dịch, ngày mới nhất trước; bấm lần 2 gập lại.

---

# [TC_NKGD_LS_03] Gập/mở tất cả danh mục
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Bấm nút mũi tên đầu bảng 2 lần.

## Kết quả mong đợi
- [ ] Lần 1 mở hết (11 giao dịch); lần 2 gập hết.

---

# [TC_NKGD_LS_04] Hiển thị 1 dòng giao dịch
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở "Dài hạn", đọc dòng Bán FPT, dòng cổ tức VNM, dòng Mua FPT 48.

## Kết quả mong đợi
- [ ] Bán: giá `56,000` (đồng), phí `33,600 (0.15%)`, lãi/lỗ `+2,600,000`.
- [ ] Cổ tức: nhãn "Cổ tức", ghi chú "Trả cổ tức bằng tiền, 1,500 đồng/CP". Mua FPT 48: ghi chú "Mua tích luỹ".

---

# [TC_NKGD_LS_05] Bánh răng "Chọn thêm cột hiển thị"
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Bấm bánh răng, tích "Giá mục tiêu 1"; F5.

## Kết quả mong đợi
- [ ] 9 cột tuỳ chọn: Ghi chú, Thiết lập, Sai lầm, Giá mục tiêu 1–3, Giá cắt lỗ 1–3.
- [ ] Cột "Giá mục tiêu 1" hiện; lưu localStorage `field_table_trading_history_more_v2`; sau F5 vẫn hiện.

---

# [TC_NKGD_LS_06] Sắp xếp theo "Ngày giao dịch"
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Mở "Dài hạn", bấm tiêu đề "Ngày giao dịch".

## Kết quả mong đợi
- [ ] Thứ tự ngày trong danh mục đảo chiều.

---

# [TC_NKGD_LS_07] "Tải thêm" khi danh mục > 20 giao dịch
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Danh mục "Lướt sóng" có 25 giao dịch; mở; bấm "Tải thêm 5 giao dịch".

## Kết quả mong đợi
- [ ] Ban đầu 20 dòng; sau khi bấm đủ 25.

---

# [TC_NKGD_LS_08] Xuất Excel
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Bấm "Xuất Excel".

## Kết quả mong đợi
- [ ] Tải file "Nhật ký giao dịch.xlsx".

---

## Nhóm: Lọc giao dịch

# [TC_NKGD_LS_09] Modal "Lọc giao dịch" — mặc định
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Xem theo = Khoảng thời gian; Thời gian = Toàn bộ (13 lựa chọn); Loại lệnh: Toàn bộ/Mua/Bán; Mã CK và Danh mục "Nhấn để
      chọn"; Thiết lập và Sai lầm "Chọn thẻ tags"; nút "Đóng", "Lọc".

---

# [TC_NKGD_LS_10] Lọc Loại lệnh = Bán
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Tổng kết "Mua 0 Bán 2 Cổ tức 0".

---

# [TC_NKGD_LS_11] Lọc Mã CK = HPG
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Tổng kết "Mua 1 Bán 1 Cổ tức 0".

---

# [TC_NKGD_LS_12] Lọc Danh mục = Cổ tức
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Tổng kết "Mua 1 Bán 0 Cổ tức 1".

---

# [TC_NKGD_LS_13] Lọc Thời gian = 1 tháng
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Chỉ giao dịch trong 30 ngày: "Mua 2 Bán 2 Cổ tức 0" (cổ tức VNM ghi đúng 30 ngày trước nằm ngoài mốc now − 30×24h).

---

# [TC_NKGD_LS_14] Tùy chọn — Từ ngày > Đến ngày
- **Trạng thái:** 🆕 Testcase mới (giữ TC_LS_15 cũ)
- **Ghi chú:** toast gọi bên trong `.filter()` cho từng giao dịch (có `$toast.clear()` trước nên chỉ thấy 1).

## Kết quả mong đợi
- [ ] Toast lỗi "Bạn cần nhập thời gian Từ ngày phải bé hơn Đến ngày"; bảng rỗng (Mua 0 Bán 0 Cổ tức 0).

---

# [TC_NKGD_LS_15] "Đóng" không áp dụng
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Chọn "Bán" rồi "Đóng" → bảng giữ "Mua 7 Bán 2 Cổ tức 2".

---

# [TC_NKGD_LS_16] Ô "Thiết lập" mở popup chọn thẻ
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Popup "Chọn thẻ Setup" mở chồng; đóng bằng X, modal lọc vẫn mở.

---

## Nhóm: Phiếu lệnh Mua/Bán

# [TC_NKGD_LS_17] Phiếu "Mua" từ thanh công cụ
- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Nút Mua được chọn; ô chọn mã rỗng; danh mục (Cổ tức, Dài hạn, Lướt sóng); ngày hôm nay; phí 0.15; "Tổng chi 0 đ"; nút
      "Xác nhận mua"; placeholder ghi chú "Lý do vào lệnh..."; "Nhập nâng cao" + "Thêm setup, sai lầm, giá mục tiêu, cắt lỗ...".

---

# [TC_NKGD_LS_18] Giá trị / Phí / Tổng chi
- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Giá 50 (nghìn) × 1.000 cp: Giá trị `50,000,000 đ`, Phí `75,000 đ`, Tổng chi `50,075,000 đ`.

---

# [TC_NKGD_LS_19] Chọn mã → giá tự điền
- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Ô giá điền giá khớp hiện tại (> 0) qua socket `getlive`.

---

# [TC_NKGD_LS_20] Phiếu "Bán" — khối lượng tự điền
- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Danh mục "Lướt sóng" + mã SSI → khối lượng `1,000`; nút Bán chọn; "Tổng thu"; "Xác nhận bán".

---

# [TC_NKGD_LS_21] Để trống → toast lỗi; giá 0 bị từ chối
- **Trạng thái:** ⚠️ Cần xác nhận thêm (✅ phần validate có từ bản cũ TC_LS_20/21)
- **Kết quả đo được:** giá mặc định `0` bị coi là không hợp lệ (`0 == ""` là true trong JS) trong khi thông báo ghi "Giá thực
  hiện phải lớn hơn hoặc bằng 0" → mâu thuẫn; cần xác nhận cho phép giá 0 hay không.

## Kết quả mong đợi
- [ ] Toast "Mã CK không hợp lệ", "Khối lượng phải lớn hơn 0", "Giá thực hiện phải lớn hơn hoặc bằng 0"; không gửi; phiếu vẫn mở.

---

# [TC_NKGD_LS_22] Ngày tương lai
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Toast "Ngày giao dịch phải bé hơn hoặc bằng ngày hiện tại!"; không gửi.

---

# [TC_NKGD_LS_23] Ngày thứ 7
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Toast "Không thể thực hiện giao dịch vào ngày này. Vui lòng chọn một ngày làm việc khác…"; giá, danh mục, nút xác nhận bị
      khoá; chọn lại ngày làm việc thì mở khoá.

---

# [TC_NKGD_LS_24] Bán vượt số đang nắm
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Toast "Khối lượng bán phải bé hơn hoặc bằng số lượng mua!"; không gửi.

---

# [TC_NKGD_LS_25] Xác nhận mua thành công
- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Kết quả mong đợi
- [ ] 1 `POST /api/tradinglog/store` đúng mã, loại, danh mục, ngày, giá, phí, ghi chú; 1 lượt đối soát cổ tức đúng
      `{ items: [{ danh_muc, mack, ngay_giao_dich }] }`; phiếu đóng, không toast; "Dài hạn" thành "Mua 4".

---

# [TC_NKGD_LS_26] Lỗi 500 khi mua
- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại"; phiếu vẫn mở.

---

# [TC_NKGD_LS_27] Bấm đúp "Xác nhận mua" gửi 2 lệnh
- **Trạng thái:** 🆕 Testcase mới — 🐞 bug (giữ TC_LS_28 cũ, chưa sửa)
- **Kết quả đo được:** 09/11 trên kfsp.vn (và trước đó trên prev2 bản preprod) bấm đúp gửi 2 `POST /api/tradinglog/store` + 2 lượt đối soát.

## Kết quả mong đợi (đo được)
- [ ] Đúng 2 lệnh POST. Mong đợi đúng: chỉ 1 (khoá nút khi đang gửi).

---

# [TC_NKGD_LS_28] Phí được nhớ
- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Đổi phí 0.2 → localStorage `trading_log_last_fee_percent = "0.2"`; mở phiếu mới vẫn 0.2.

---

# [TC_NKGD_LS_29] Đóng phiếu lệnh
- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Bấm ra nền: KHÔNG đóng (`closeOnBackdrop=false`). Esc, nút X, "Hủy": đều đóng; không gửi gì.

---

# [TC_NKGD_LS_30] Chọn mã → lỗi JS trong callback giá
- **Trạng thái:** 🆕 Testcase mới — 🐞 bug nghi vấn (mới)
- **Nguyên nhân:** `onStockcodeFormAddChange` → `socket_send.emit("getlive", [mã], res => res["lastprice"][0] / 1000)`, không kiểm
  tra `res.lastprice` → khi socket trả gói không có `lastprice` thì ném `TypeError: Cannot read properties of undefined (reading
  '0')` (đo được mỗi lần chọn mã trên kfsp.vn 09/11, giá vẫn được điền ở lượt trả lời khác). Không thấy trên giao diện, chỉ ở console.

## Kết quả mong đợi (đo được)
- [ ] Trang phát sinh lỗi JS trên. Mong đợi đúng: không lỗi.

---

## Nhóm: Nhập nâng cao

# [TC_NKGD_LS_31] "Nhập nâng cao" giữ dữ liệu phiếu
- **Trạng thái:** ✅ Áp dụng (thay TC_LS_19 cũ)

## Kết quả mong đợi
- [ ] Phiếu đóng, modal "Thêm giao dịch" mở với tab Giao dịch / Nhập đơn lẻ / Nhập hàng loạt; Loại = Bán, Mã CK = SSI; có 3 ô
      Giá mục tiêu + 3 ô Giá cắt lỗ.

---

# [TC_NKGD_LS_32] Giá mục tiêu trùng nhau
- **Trạng thái:** ✅ Áp dụng (giữ TC_LS_25 cũ)

## Kết quả mong đợi
- [ ] Toast "Giá mục tiêu 1 phải khác giá mục tiêu 2 và 3!"; không gửi.

---

# [TC_NKGD_LS_33] Nhập hàng loạt — thêm/xoá dòng, dòng trống
- **Trạng thái:** ✅ Áp dụng (thay TC_LS_32/33 cũ)

## Kết quả mong đợi
- [ ] "+ Thêm giao dịch khác" thêm 1 dòng; "Xóa dòng" bớt 1; "Lưu" với dòng trống → toast lỗi, không gọi `add-bulk`.

---

## Nhóm: Sửa / Chi tiết / Xoá

# [TC_NKGD_LS_34] Menu "..." theo loại dòng
- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Mua/Bán: "Sửa", "Xóa". Cổ tức: chỉ "Xóa".

---

# [TC_NKGD_LS_35] Modal "Sửa giao dịch" điền sẵn
- **Trạng thái:** ✅ Áp dụng (giữ TC_LS_34 cũ)

## Kết quả mong đợi
- [ ] Loại Mua, danh mục Dài hạn, Mã CK FPT (khoá), ngày đúng, khối lượng 1,000, giá 48, phí 0.15, ghi chú "Mua tích luỹ"; khối
      "Biểu đồ giá mục tiêu - cắt lỗ".

---

# [TC_NKGD_LS_36] Sửa thành công
- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Kết quả mong đợi
- [ ] `PUT …/trading_log/update` có giá 47, ghi chú mới; 1 lượt đối soát; modal đóng, không toast; bảng có dòng 47,000.

---

# [TC_NKGD_LS_37] Sửa lỗi 422 — modal tự đóng
- **Trạng thái:** ✅ Áp dụng — 🐞 (giữ TC_LS_36/37 cũ)

## Kết quả mong đợi (đo được)
- [ ] Toast "Giao dịch không hợp lệ! Vui lòng thử lại."; modal ĐÓNG (người dùng mất chỉnh sửa vừa nhập).

---

# [TC_NKGD_LS_38] Sửa lỗi 500 — modal tự đóng
- **Trạng thái:** ✅ Áp dụng — 🐞 (giữ TC_LS_37 cũ)

## Kết quả mong đợi (đo được)
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại"; modal đóng.

---

# [TC_NKGD_LS_39] Modal "Chi tiết giao dịch"
- **Trạng thái:** ✅ Áp dụng (thay TC_LS_40 "Xem giao dịch")

## Kết quả mong đợi
- [ ] Bấm dòng → modal chỉ xem có FPT + "Biểu đồ giá mục tiêu - cắt lỗ", không có "Lưu"; "Đóng" đóng.

---

# [TC_NKGD_LS_40] Xoá lệnh bán thành công
- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Kết quả mong đợi
- [ ] Modal "Xóa dữ liệu" "Bạn có chắc chắn không?" → "Xóa": `DELETE /api/stocks/trading_log/{id}`, 1 lượt đối soát; không toast;
      "Dài hạn" thành "Bán 0".

---

# [TC_NKGD_LS_41] Không cho xoá lệnh mua đã bán hết
- **Trạng thái:** ✅ Áp dụng (giữ TC_LS_43 cũ)
- **Ghi chú:** điều kiện viết `item.khoi_luong > khoi_luong_ton > 0` (so sánh nối chuỗi), thực chất = `khoi_luong > ton`.

## Kết quả mong đợi
- [ ] HPG mua (đã bán hết): toast "Không thể xóa giao dịch này!", không mở xác nhận, không gửi.

---

# [TC_NKGD_LS_42] Xoá lỗi 500
- **Trạng thái:** 🆕 Testcase mới (thay TC_LS_44 cũ — bug mất `this` đã sửa)

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại"; modal đóng; dòng còn.

---

# [TC_NKGD_LS_43] Modal "Đã cập nhật sự kiện quyền" sau khi thêm lệnh
- **Trạng thái:** 🆕 Testcase mới (thay modal "Thông báo" cũ)

## Kết quả mong đợi
- [ ] Đối soát trả có thay đổi → modal "Tài sản có thay đổi, hệ thống đã cập nhật lại sự kiện quyền:" với VNM — danh mục: Dài
      hạn + tên sự kiện; nhật ký được nạp lại; "Đóng" đóng modal.

---

## Nhóm: Phân quyền

# [TC_NKGD_LS_44] Free — tab Giao dịch bị khoá
- **Trạng thái:** 🆕 Testcase mới (thay TC_LS_03 cũ)

## Kết quả mong đợi
- [ ] ProtectedView (`.blurred-image`), không có Mua/Lọc.

---

## Tổng hợp trạng thái (44 testcase)

Tự động hoá: [tests/nhat-ky-giao-dich-nhat-ky.spec.ts](../tests/nhat-ky-giao-dich-nhat-ky.spec.ts).

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 28 | LS_01–03, 05, 06, 08–13, 15, 16, 22–26, 31–33, 35–41 |
| 🆕 Mới (riêng web) | 15 | LS_04, 07, 14, 17–20, 27–30, 34, 42–44 |
| ⚠️ Cần xác nhận thêm | 1 | LS_21 |

**Phát hiện đáng chú ý:**
1. 🐞 **LS_27** bấm đúp gửi 2 lệnh (chưa sửa từ 20/08).
2. 🐞 **LS_37/38** sửa lỗi thì modal tự đóng, mất chỉnh sửa (chưa sửa).
3. 🐞 **LS_30 (mới)** lỗi JS trong callback socket `getlive` khi chọn mã.
4. ⚠️ **LS_21** giá 0 bị từ chối trái với thông báo "≥ 0".
5. ✅ Bug TC_LS_44 cũ (mất `this` khi xoá lỗi) đã được sửa.
6. ⚠️ An toàn: pattern chặn ghi của spec 20/08 không khớp endpoint NestJS mới — đã thay bằng máy chủ giả + lưới an toàn.
