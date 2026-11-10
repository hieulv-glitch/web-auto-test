# Màn hình: Nhật ký giao dịch — Tab "Phân tích giao dịch"

- **URL:** `/nhat-ky-giao-dich`, tab thứ 3 "Phân tích giao dịch" (`active_tab = 2`) — khung ở [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** `stocks/src/views/tradingLog/analysis.vue` (bản preprod 03/11/2026). Gói hội viên: feature
  `nkgd_thong_ke_giao_dich` (Free bị khoá — TC_NKGD_09).
- **Môi trường:** https://kfsp.vn (production — đã ngang preprod mới nhất, deploy 06/11/2026 10:30 GMT; spec đọc `PREV2_BASE_URL` trong .env, hiện trỏ kfsp.vn) + `Prev2Session` + máy chủ giả `NkgdFakeServer` (11 giao dịch giả / 5 mã FPT, VNM, HPG, MBB, SSI / 3
  danh mục; `trading_style` = 0,6 / 0,3 / 0,1; chỉ số rủi ro giả). Tab chỉ đọc, không có thao tác ghi.
- **File mới 09/11/2026 (nhánh B):** trước đây là sub-tab "Thống kê phân tích" trong tab "Nhật ký giao dịch" (TC_NKGD_LS_45–49
  của [nhat-ky-giao-dich-nhat-ky.md](nhat-ky-giao-dich-nhat-ky.md) bản 20/08). Giờ là tab chính với giao diện mới:
  - Thanh lọc riêng ("Xem theo", "Thời gian"/"Từ ngày–Đến ngày", "Danh mục").
  - "Phong cách và rủi ro" thành nút gập (mặc định thu gọn), bên trong chia đôi: thanh % 3 phong cách + thang 3 mức rủi ro
    (thay radar chart cũ).
  - Đồ thị lợi nhuận có ô chọn "Lợi nhuận theo…", phóng to/thu nhỏ, "Xuất Excel"; bảng "Chi tiết theo …" tiêu đề 2 tầng.
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Tổng quan

# [TC_NKGD_PT_01] Overview tab Phân tích giao dịch

- **Trạng thái:** 🆕 Testcase mới (thay TC_NKGD_LS_45 cũ)

## Các bước thực hiện
1. Mở tab "Phân tích giao dịch".

## Kết quả mong đợi
- [ ] Thanh lọc: "Xem theo" = "Khoảng thời gian" (2 lựa chọn: Khoảng thời gian, Tùy chọn); "Thời gian" = "Toàn bộ" (13 lựa
      chọn, cuối là "12 tháng gần nhất"); "Danh mục" = "Nhấn để chọn".
- [ ] Nút "Phong cách và rủi ro" đang thu gọn (`aria-expanded="false"`), khối bên trong chưa hiện.
- [ ] Ô "Lợi nhuận theo cổ phiếu" (7 lựa chọn: ngày, tháng, quý, năm, ngành, cổ phiếu, sàn), "Đơn vị: nghìn đồng", nút "Thu
      nhỏ"/"Phóng to", "Xuất Excel", chú thích "Lãi ròng"/"Lỗ ròng".
- [ ] Bảng tiêu đề tầng 1: Mã, Lợi nhuận, Hiệu suất tương đối, Hiệu suất tuyệt đối, Lệnh mua, Lệnh bán.

---

# [TC_NKGD_PT_02] Bảng "Chi tiết theo mã"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đọc bảng "Chi tiết theo mã".

## Kết quả mong đợi
- [ ] Mỗi mã 1 dòng: FPT, HPG, MBB, SSI, VNM; nhãn đếm "5 mã".
- [ ] Tiêu đề tầng 2 có 15 cột chỉ tiêu, bắt đầu bằng "Lợi nhuận gộp".

---

## Nhóm: Phong cách và rủi ro

# [TC_NKGD_PT_03] Mở khối "Phong cách và rủi ro"

- **Trạng thái:** 🆕 Testcase mới (thay TC_NKGD_LS_45 phần radar/rủi ro)

## Các bước thực hiện
1. Bấm "Phong cách và rủi ro"; bấm lần 2.

## Kết quả mong đợi
- [ ] Lần 1: mở; "Phong cách chính" = "Nhà kinh doanh cổ phiếu"; 3 thanh "Nhà kinh doanh cổ phiếu" 60%, "Nhà giao dịch cổ
      phiếu" 30%, "Nhà đầu tư giá trị" 10% (thanh lớn nhất được đánh dấu).
- [ ] Chỉ số rủi ro 0,5 (< 1) → mức "Lo ngại rủi ro" được tô, đoạn mô tả nhắc "Lo ngại rủi ro".
- [ ] Lần 2: thu gọn lại.

---

# [TC_NKGD_PT_04] Mức rủi ro theo chỉ số = 1 và > 1

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chỉ số rủi ro = 1, mở khối. Lặp lại với chỉ số = 2.

## Kết quả mong đợi
- [ ] = 1 → "Thờ ơ với rủi ro"; = 2 → "Ưa thích rủi ro" (mức được tô + mô tả tương ứng).

---

# [TC_NKGD_PT_05] API chỉ số rủi ro lỗi

- **Trạng thái:** 🆕 Testcase mới (giữ từ TC_NKGD_LS_49 cũ)
- **Ghi chú:** lỗi chỉ `console.error`, chỉ số giữ mặc định 0 → người dùng thấy "Lo ngại rủi ro" như kết quả thật, không
  phân biệt được với lỗi (hạn chế UX, không crash).

## Các bước thực hiện
1. `get-risk-aversion-index` trả 500, mở khối.

## Kết quả mong đợi
- [ ] Không lỗi JS, không toast; hiện mức "Lo ngại rủi ro".

---

# [TC_NKGD_PT_06] Không có dữ liệu phong cách

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. `trading_style` = 0 cả 3, mở khối.

## Kết quả mong đợi
- [ ] "Phong cách chính" = "-", không thanh nào được đánh dấu.

---

## Nhóm: Lọc & nhóm lợi nhuận

# [TC_NKGD_PT_07] Đổi "Lợi nhuận theo…"

- **Trạng thái:** 🆕 Testcase mới (thay TC_NKGD_LS_46 cũ)

## Các bước thực hiện
1. Chọn "Lợi nhuận theo tháng"; rồi "Lợi nhuận theo ngành".

## Kết quả mong đợi
- [ ] Tiêu đề bảng "Chi tiết theo tháng", cột đầu "Tháng"; sau đó "Chi tiết theo ngành".

---

# [TC_NKGD_PT_08] Lọc thời gian "1 tháng gần nhất"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. "Thời gian" = "1 tháng gần nhất".

## Kết quả mong đợi
- [ ] Chỉ còn mã có giao dịch trong 30 ngày: FPT, HPG, MBB, SSI (VNM bị loại).

---

# [TC_NKGD_PT_09] Lọc "Tùy chọn" — Từ ngày > Đến ngày

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. "Xem theo" = "Tùy chọn"; Đến ngày = 01/01/2026; Từ ngày = 01/06/2026.

## Kết quả mong đợi
- [ ] Ô "Thời gian" ẩn, hiện "Từ ngày"/"Đến ngày".
- [ ] Toast lỗi "Bạn cần nhập thời gian Từ ngày phải bé hơn Đến ngày"; bảng rỗng.

---

# [TC_NKGD_PT_10] Lọc danh mục

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. "Danh mục" chọn "Lướt sóng".

## Kết quả mong đợi
- [ ] Chỉ còn HPG, MBB, SSI; nhãn "3 mã".

---

## Nhóm: Đồ thị & bảng

# [TC_NKGD_PT_11] Phóng to / thu nhỏ đồ thị

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Thu nhỏ" (đang ở mức nhỏ nhất); bấm "Phóng to"; bấm "Thu nhỏ".

## Kết quả mong đợi
- [ ] Lần 1 không đổi (đã nhỏ nhất, `zoom = 0`); "Phóng to" đổi %; "Thu nhỏ" trả về mức ban đầu.

---

# [TC_NKGD_PT_12] Sắp xếp bảng theo cột "Mã"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm tiêu đề "Mã".

## Kết quả mong đợi
- [ ] Thứ tự mã đảo ngược.

---

# [TC_NKGD_PT_13] Bấm 1 dòng → modal "Lịch sử giao dịch" của mã đó

- **Trạng thái:** 🆕 Testcase mới (thay TC_NKGD_LS_47 cũ — bấm cột đồ thị)

## Các bước thực hiện
1. Bấm dòng "HPG", mở danh mục "Lướt sóng" trong modal, đóng bằng X.

## Kết quả mong đợi
- [ ] Modal "Lịch sử giao dịch" chỉ có giao dịch HPG (2 lệnh: mua, bán); đóng được bằng X.

---

# [TC_NKGD_PT_14] Xuất Excel

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Xuất Excel".

## Kết quả mong đợi
- [ ] Tải file "Thống kê lợi nhuận.xlsx".

---

# [TC_NKGD_PT_15] Sau khi Xuất Excel, bảng thêm 1 cột "Mã CK" thừa ở lần vẽ lại kế tiếp

- **Trạng thái:** 🆕 Testcase mới — 🐞 bug (giữ từ TC_NKGD_LS_48 cũ, chưa sửa)
- **Nguyên nhân:** computed `schema` gọi `this.fields_table.unshift({value:"identify", label:"Mã CK"})` — `fields_table` là
  computed không có phụ thuộc reactive nên được cache mãi; `unshift` sửa thẳng mảng cache. Màn hình chưa đổi ngay, tới lần
  vẽ lại kế tiếp (vd bấm sắp xếp) mới lộ cột thừa.

## Các bước thực hiện
1. Bấm "Xuất Excel"; rồi bấm tiêu đề "Mã" để bảng vẽ lại.

## Kết quả mong đợi (đo được)
- [ ] Ngay sau xuất: tiêu đề tầng 2 vẫn 15 cột. Sau khi bấm sắp xếp: 16 cột, cột đầu "Mã CK" (thừa).
- [ ] Mong đợi đúng (cần dev sửa): luôn 15 cột.

---

## Tổng hợp trạng thái (15 testcase, 16 test vì TC_04 chạy 2 giá trị)

Tự động hoá: [tests/nhat-ky-giao-dich-phan-tich.spec.ts](../tests/nhat-ky-giao-dich-phan-tich.spec.ts).

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 0 | |
| 🆕 Mới (riêng web) | 15 | PT_01–15 |
| ⚠️ Cần xác nhận thêm | 0 | |

**Phát hiện đáng chú ý:**
1. 🐞 **PT_15** — bug cột "Mã CK" thừa sau Xuất Excel vẫn còn trên giao diện mới.
2. **PT_05** — lỗi API rủi ro bị nuốt, hiện "Lo ngại rủi ro" như kết quả thật.
