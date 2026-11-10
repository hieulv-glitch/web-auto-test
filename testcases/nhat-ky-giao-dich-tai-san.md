# Màn hình: Nhật ký giao dịch — Tab "Tài sản"

- **URL:** `/nhat-ky-giao-dich`, tab đầu "Tài sản" (`active_tab = 0`) — khung ở [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** `stocks/src/views/tradingLog/estate.vue` (bản preprod 03/11/2026) + `components/RealizedByPeriodChart.vue`,
  `TooltipCoCau.vue`, `ChiTietGiaoDich.vue`, `DividendEventConfirmModal.vue`; phiếu lệnh Mua/Bán nằm ở `index.vue`.
- **Môi trường:** https://kfsp.vn (production — đã ngang preprod mới nhất, deploy 06/11/2026 10:30 GMT; spec đọc `PREV2_BASE_URL` trong .env, hiện trỏ kfsp.vn) + `Prev2Session` + máy chủ giả `NkgdFakeServer`. Nhật ký giả: Dài hạn (FPT mua 1.000 + 500, bán 400; VNM
  mua 2.000 + cổ tức tiền), Lướt sóng (HPG mua rồi bán hết, MBB, SSI), Cổ tức (FPT mua + thưởng cổ phiếu). Lãi/lỗ đã thực hiện
  = 2.600.000 + 8.800.000 = 11.400.000 đ. Giá hiện tại là giá thật của kfsp.vn → chỉ assert cấu trúc và quan hệ giữa các số.
- **Cập nhật 09/11/2026 — viết lại theo giao diện mới (nhánh B).** Khác bản 20/08: thanh chọn danh mục tự viết (tick nhiều,
  nhãn "Tất cả danh mục" / "n/N danh mục" / "Chưa chọn danh mục"); thẻ **"Tài sản ròng (NAV)"** + đồ thị 2 chế độ ("Lãi/lỗ đã
  thực hiện" theo Tháng/Quý, "Hiệu suất NAV" so VN-Index) với 5 khoảng thời gian; khối **"Phân tích danh mục"** gập được (Cơ cấu
  danh mục tròn/thanh theo Mã/Ngành + Đóng góp lãi/lỗ chưa thực hiện); bảng **"Danh mục đầu tư"** gộp theo Danh mục/Ngành, mỗi
  mã có nút **Mua/Bán** (phiếu lệnh nhanh); bấm dòng mở **modal chi tiết vị thế** (lịch sử lệnh của mã, dải GDKHQ chưa ghi).
  Bỏ: dropdown "Cổ phiếu/Ngành" + "Giá vốn DM/GT thị trường", checkbox "Tiền mặt", bảng "Thống kê lãi lỗ", modal "Xem giao
  dịch" cũ, "Bài viết liên quan" → các TC_NKGD_TS_05–07, 09–10, 12, 20, 21 cũ xoá/viết lại.
- **Toast thành công đã bị tắt toàn app** (`main.js`, 12/10/2026). Chỉ còn toast lỗi.
- **⚠️ An toàn dữ liệu:** đối soát cổ tức (`/api/dividend-auto-record/sync-after-transactions`, kể cả lượt `dry_run`) đi qua máy
  chủ giả; vốn ban đầu lưu setting `capital_allocation_data_save` (bị chặn).
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Tổng quan & chọn danh mục

# [TC_NKGD_TS_01] Overview tab Tài sản
- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC 11 (Sheet)
- **Cập nhật:** bố cục mới.

## Các bước thực hiện
1. Mở tab "Tài sản".

## Kết quả mong đợi
- [ ] Thanh "Danh mục" = "Tất cả danh mục".
- [ ] Thẻ "Tài sản ròng (NAV)": ô tích "Tính lãi/lỗ đã thực hiện" (đã tích), số NAV dạng `x,xxx đ`, thay đổi "hôm nay"; dòng Vốn ban
      đầu / Giá trị thị trường / Giá trị margin; 3 ô Lãi/lỗ chưa thực hiện / Lãi/lỗ đã thực hiện / Tiền mặt còn lại.
- [ ] Đồ thị: "Lãi/lỗ đã thực hiện" + "Tháng" + "3 tháng" đang chọn; 5 khoảng 1 tháng, 3 tháng, 6 tháng, 1 năm, Tất cả.
- [ ] "Phân tích danh mục" đang mở, có "Cơ cấu danh mục" và "Đóng góp lãi/lỗ chưa thực hiện".
- [ ] "Danh mục đầu tư": gộp theo "Danh mục", nút "Xuất Excel", 9 cột Mã → Tỷ trọng.

---

# [TC_NKGD_TS_02] Bảng Danh mục đầu tư
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Đọc bảng "Danh mục đầu tư".

## Kết quả mong đợi
- [ ] Dòng đầu "Tổng" tỷ trọng 100.00%; nhóm danh mục xếp theo tên: Cổ tức, Dài hạn, Lướt sóng.
- [ ] Chỉ mã đang nắm (FPT ×2 danh mục, VNM, MBB, SSI); HPG đã bán hết không hiện.
- [ ] Dòng "Dài hạn" ghi "Vốn ban đầu 500.0 tr"; "Lướt sóng" ghi "Vốn (tự động)".

---

# [TC_NKGD_TS_03] Bỏ tick 1 danh mục khi đang "Tất cả"
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Mở thanh "Danh mục", bỏ tick "Dài hạn".

## Kết quả mong đợi
- [ ] Danh sách: Tất cả danh mục, Cổ tức, Dài hạn, Lướt sóng — ban đầu tick hết.
- [ ] Nhãn "2/3 danh mục"; "Tất cả danh mục" và "Dài hạn" bỏ tick; bảng chỉ còn Cổ tức, Lướt sóng.

---

# [TC_NKGD_TS_04] Bỏ tick "Tất cả" rồi chọn riêng 1 danh mục
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Bỏ tick "Tất cả danh mục"; tick "Lướt sóng"; tick lại "Tất cả danh mục".

## Kết quả mong đợi
- [ ] "Chưa chọn danh mục", mọi ô bỏ tick, bảng "Chưa nắm giữ mã nào trong danh mục".
- [ ] Tick "Lướt sóng" → nhãn "Lướt sóng", bảng chỉ Lướt sóng. Tick "Tất cả" → "Tất cả danh mục".

---

# [TC_NKGD_TS_05] Không có danh mục
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả 0 danh mục, 0 giao dịch.

## Kết quả mong đợi
- [ ] Không có thanh chọn danh mục; bảng "Chưa nắm giữ mã nào trong danh mục"; "Chưa có mã nào đang nắm giữ".

---

## Nhóm: Thẻ NAV & đồ thị

# [TC_NKGD_TS_06] Ô tích "Tính lãi/lỗ đã thực hiện"
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bỏ tick "Tính lãi/lỗ đã thực hiện"; F5.

## Kết quả mong đợi
- [ ] Ô "Lãi/lỗ đã thực hiện" = +11,400,000 đ; bỏ tick → NAV giảm đúng 11.400.000.
- [ ] localStorage `estate_co_cau_tien_mat_lai_lo = "0"`; sau F5 ô vẫn bỏ tick.

---

# [TC_NKGD_TS_07] Ô "Lãi/lỗ đã thực hiện" dẫn sang tab Giao dịch
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm ô "Lãi/lỗ đã thực hiện" (tooltip "Xem tab Giao dịch").

## Kết quả mong đợi
- [ ] Tab "Giao dịch" active.

---

# [TC_NKGD_TS_08] Đổi chế độ đồ thị
- **Trạng thái:** 🆕 Testcase mới (thay TC_TS_08 Tháng/Quý cũ)

## Các bước thực hiện
1. Bấm "Quý"; bấm "Hiệu suất NAV"; bấm lại "Lãi/lỗ đã thực hiện".

## Kết quả mong đợi
- [ ] "Quý" được chọn. "Hiệu suất NAV": nhóm "Độ dài một cột" ẩn, hiện đồ thị NAV hoặc "Chưa đủ dữ liệu để tính hiệu suất".
- [ ] Quay lại "Lãi/lỗ đã thực hiện": nhóm "Độ dài một cột" hiện lại.

---

# [TC_NKGD_TS_09] Khoảng thời gian đồ thị được nhớ
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "1 năm"; F5.

## Kết quả mong đợi
- [ ] "1 năm" được chọn, "3 tháng" bỏ chọn; localStorage `estate_chart_range_days = "365"`; sau F5 vẫn "1 năm".

---

## Nhóm: Phân tích danh mục

# [TC_NKGD_TS_10] Gập "Phân tích danh mục"
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm nút gập; F5; bấm mở.

## Kết quả mong đợi
- [ ] Nhãn nút đổi "Thu gọn…" → "Mở phân tích danh mục", vùng ẩn, `estate_mo_muc_gop = "0"`; sau F5 vẫn gập; bấm mở hiện lại.

---

# [TC_NKGD_TS_11] Cơ cấu theo Mã / Ngành
- **Trạng thái:** ✅ Áp dụng (thay TC_TS_05 "Cổ phiếu/Ngành" cũ)

## Các bước thực hiện
1. Đọc chú thích cơ cấu; bấm "Ngành".

## Kết quả mong đợi
- [ ] Cột đầu "Mã", có dòng "Tiền mặt", tổng tỷ trọng = 100%. "Ngành": cột đầu "Ngành", không còn dòng mã.

---

# [TC_NKGD_TS_12] Kiểu biểu đồ cơ cấu "Thanh ngang"
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Thanh ngang".

## Kết quả mong đợi
- [ ] Hiện thanh ngang thay biểu đồ tròn; `estate_kieu_co_cau = "thanh"`.

---

# [TC_NKGD_TS_13] Đóng góp lãi/lỗ chưa thực hiện
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đọc khối "Đóng góp lãi/lỗ chưa thực hiện".

## Kết quả mong đợi
- [ ] Tiêu đề "Mã · Danh mục", trục "Lỗ ← 0 → Lãi"; 5 dòng (mỗi mã đang nắm theo danh mục, FPT có 2 dòng Cổ tức + Dài hạn); có "Tổng".

---

## Nhóm: Bảng Danh mục đầu tư

# [TC_NKGD_TS_14] Gộp dòng theo Ngành
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Ngành" ở "Gộp dòng của bảng".

## Kết quả mong đợi
- [ ] Dòng nhóm thành tên ngành; không còn nút "Sửa vốn ban đầu".

---

# [TC_NKGD_TS_15] Gập/mở danh mục trong bảng
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm tên "Dài hạn"; bấm nút "Thu gọn tất cả danh mục" 2 lần.

## Kết quả mong đợi
- [ ] "Dài hạn" gập (VNM ẩn, MBB vẫn hiện); nút tất cả gập hết rồi mở lại đủ 5 mã.

---

# [TC_NKGD_TS_16] Sắp xếp theo cột
- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Bấm tiêu đề "Khối lượng" 2 lần.

## Kết quả mong đợi
- [ ] Thứ tự khối lượng đổi chiều.

---

# [TC_NKGD_TS_17] Xuất Excel
- **Trạng thái:** ✅ Áp dụng
- **Ghi chú:** code đặt tên `Lãi/lỗ Nhật ký giao dịch.xlsx` — dấu "/" không hợp lệ trong tên file nên trình duyệt đổi (Chromium: "_").
  Đề nghị dev đổi tên không có "/".

## Các bước thực hiện
1. Bấm "Xuất Excel".

## Kết quả mong đợi
- [ ] Tải file "Lãi?lỗ Nhật ký giao dịch.xlsx" (ký tự giữa do trình duyệt thay).

---

# [TC_NKGD_TS_18] Mua/Bán từ dòng mã
- **Trạng thái:** ✅ Áp dụng (thay TC_TS_18/19 cũ)

## Các bước thực hiện
1. Bấm "Mua" ở dòng VNM; Hủy; bấm "Bán".

## Kết quả mong đợi
- [ ] Phiếu lệnh: mã "VNM" (chữ cố định), danh mục "Dài hạn", nút Mua chọn. Bán: khối lượng điền sẵn 2,000.

---

# [TC_NKGD_TS_19] Bấm mã CK → modal biểu đồ của mã
- **Trạng thái:** 🆕 Testcase mới (giữ TC_TS_12b cũ)

## Các bước thực hiện
1. Bấm link "MBB".

## Kết quả mong đợi
- [ ] Mở modal biểu đồ/chi tiết mã dùng chung toàn site; không mở modal chi tiết vị thế.

---

## Nhóm: Chi tiết vị thế của mã

# [TC_NKGD_TS_20] Modal chi tiết vị thế
- **Trạng thái:** 🆕 Testcase mới (thay TC_TS_12 "Xem giao dịch" cũ)

## Các bước thực hiện
1. Bấm ô khối lượng ở dòng VNM; lọc "Cổ tức & quyền".

## Kết quả mong đợi
- [ ] Đầu modal "VNM"; "Giá trị đang giữ", "Khối lượng khả dụng"; "Lịch sử lệnh mã này" có lọc Tất cả / Mua bán / Cổ tức & quyền;
      bảng Loại lệnh / Ngày giao dịch / Khối lượng / Giá (nghìn đồng); 2 lệnh → lọc cổ tức còn 1; chân có Mua/Bán.
- [ ] Gửi 1 lượt đối soát CHỈ ĐỌC `{ items: [{ danh_muc, mack: "VNM" }], dry_run: true }`; không có dải GDKHQ khi không thiếu.

---

# [TC_NKGD_TS_21] Chi tiết 1 lệnh và quay lại
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Trong modal, bấm 1 lệnh; bấm "Quay lại trang của mã".

## Kết quả mong đợi
- [ ] Tiêu đề "Chi tiết giao dịch", chân không còn Mua/Bán; quay lại tiêu đề "VNM".

---

# [TC_NKGD_TS_22] Mua từ chân modal chi tiết
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở chi tiết SSI, bấm "Mua".

## Kết quả mong đợi
- [ ] Phiếu lệnh mã "SSI", danh mục "Lướt sóng".

---

# [TC_NKGD_TS_23] Dải "giao dịch không hưởng quyền" + Cập nhật
- **Trạng thái:** 🆕 Testcase mới (giả lập máy chủ)

## Các bước thực hiện
1. Đối soát dry-run trả có sự kiện thiếu; mở chi tiết VNM; bấm "Cập nhật".

## Kết quả mong đợi
- [ ] Dải "Có giao dịch không hưởng quyền của mã này chưa được cập nhật" + tên sự kiện.
- [ ] "Cập nhật" gửi lượt `dry_run: false`; hiện modal "Đã cập nhật sự kiện quyền" có VNM.

---

# [TC_NKGD_TS_24] Cập nhật sự kiện quyền lỗi
- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Như TS_23, nhưng lượt ghi trả 500.

## Kết quả mong đợi
- [ ] Toast lỗi "Không cập nhật được, vui lòng thử lại".

---

## Nhóm: Sửa vốn ban đầu

# [TC_NKGD_TS_25] Sửa vốn ban đầu từ dòng danh mục
- **Trạng thái:** ✅ Áp dụng (thay TC_TS_15/16 cũ)

## Các bước thực hiện
1. Bấm "Sửa vốn ban đầu" ở "Dài hạn", nhập 600000000, "Lưu".

## Kết quả mong đợi
- [ ] Modal "Sửa danh mục": tên "Dài hạn" bị khoá, "Nhập giá vốn" đã tích, ô vốn 500,000,000.
- [ ] Lưu: modal đóng, không toast, dòng "Vốn ban đầu 600.0 tr"; định ghi setting `capital_allocation_data_save` 600000000.

---

# [TC_NKGD_TS_26] Vốn 0 khi tích "Nhập giá vốn"; Hủy
- **Trạng thái:** ✅ Áp dụng (thay TC_TS_17 cũ)

## Các bước thực hiện
1. "Sửa vốn ban đầu" ở "Lướt sóng" (chưa tích), tích, Lưu với 0; Hủy.

## Kết quả mong đợi
- [ ] Toast lỗi "Vốn ban đầu phải lớn hơn 0", modal vẫn mở; Hủy đóng, dòng vẫn "Vốn (tự động)".

---

## Tổng hợp trạng thái (26 testcase)

Tự động hoá: [tests/nhat-ky-giao-dich-tai-san.spec.ts](../tests/nhat-ky-giao-dich-tai-san.spec.ts).

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 10 | TS_01–04, 11, 16, 17, 18, 25, 26 |
| 🆕 Mới (riêng web) | 16 | TS_05–10, 12–15, 19–24 |
| ⚠️ Cần xác nhận thêm | 0 | |

**Phát hiện đáng chú ý:** tên file Excel chứa "/" (TS_17). Bug cũ TC_TS_16 (crash `tong_tai_san` thiếu optional chaining) và
TC_TS_21 (modal Xem giao dịch mất mạng) không còn tương ứng — các luồng đó đã viết lại.
