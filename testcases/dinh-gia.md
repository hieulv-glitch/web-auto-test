# Màn hình: Định giá

- **URL:** `/dinh-gia` (menu "Phân tích cơ bản" → "Định giá"). Component `MarginSafety`
  (`src/views/pages/MarginSafety.vue`): cột trái là ô nhập (Mã CK + thông số; ô xám là ô tính sẵn, chỉ đọc), cột phải
  "Kết quả tính toán" = biểu đồ giá + "KẾT QUẢ" + "THỐNG KÊ NHANH" + ô "Vùng an toàn (xanh)" / "Vùng báo động (đỏ)".
- **API:** đọc `GET /api/stocks/margin_safety?mack`, `GET /api/valuation/default-value?stockcode`,
  `GET /api/stocks/margin_safety/get-all` (mẫu đã lưu); giá hiện tại + giá đóng cửa qua socket. Ghi (mẫu định giá):
  `POST …/margin_safety/store`, `PUT …/margin_safety/update`, `DELETE …/margin_safety/:id`.
- **Domain test:** localhost:8080 (nhánh `preprod`, backend PRODUCTION), viewport 1600×900. Spec: `tests/dinh-gia.spec.ts`,
  Page Object: `pages/DinhGiaPage.ts`.
- **Dữ liệu:** số liệu đầu vào giả lập (`FakeDgApi`, trả đúng mã đang hỏi): EPS TTM 4.000, số CP 1.000, OCF 3.000.000,
  CAPEX −1.000.000, BVPS 20.000, tăng trưởng BVPS 12,5, P/E thấp–cao 8,25–20,5; tăng trưởng tương lai 10%, P/E tương lai
  15. Giá hiện tại là giá thật (socket). 2 mẫu giả: "Mẫu FPT tăng trưởng" (FPT, EPS 5.000, 5 năm, P/E 18, biên 40%) và
  "Mẫu thận trọng". Kết quả mong đợi tính lại bằng đúng công thức của web (`calc()` trong Page Object).
- **Nguồn:** không đọc Google Sheet (yêu cầu viết nhanh, ~15 case) → toàn bộ là 🆕.

**⚠️ An toàn dữ liệu:** lưu / sửa tên / xoá mẫu LUÔN giả lập — không chạm mẫu thật của tài khoản. Lưới `useFaSafetyNet`
huỷ mọi request không phải GET tới `*.kfsp.vn` và fail test nếu có; `Prev2Session` chặn ghi setting (`final_mack`).

| Trạng thái | Ý nghĩa |
|---|---|
| 🆕 Testcase mới | Chỉ web có |
| 🐞 Nghi vấn bug | Hành vi sai, giữ `test.fixme` chờ dev |

---

## Nhóm: Điều hướng & hiển thị

# [TC_DINHGIA_01] Vào từ menu "Phân tích cơ bản" → "Định giá"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập (trả phí), đứng ở `/dashboard`. Rê chuột "Phân tích cơ bản", bấm "Định giá".

## Kết quả mong đợi
- [ ] URL `/dinh-gia`; ô "Mã CK" có mã mặc định của tài khoản; EPS TTM đã đổ số (dữ liệu thật); "Giá trị hiện tại" ≠ 0.
- [ ] Mục menu "Phân tích cơ bản" được tô sáng.

---

# [TC_DINHGIA_02] Bố cục trang

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Nút "Lưu", "Khôi phục", "Mở mẫu".
- [ ] Đủ dòng: Mã CK, EPS TTM (PV), Tỷ lệ tăng trưởng tương lai, Thời gian đầu tư, EPS tương lai, P/E tương lai, Giá trị
  tương lai, Tỷ lệ sinh lời tối thiểu, Tỷ lệ FCF, FCF/s, Số lượng cổ phiếu, FCF TTM, OCF TTM, CAPEX TTM; ô chọn "Xác định
  Vùng An toàn theo:" (MOS / FCF / EPS).
- [ ] "Kết quả tính toán" có biểu đồ; khối "KẾT QUẢ", "THỐNG KÊ NHANH"; phần "Tuyên bố trách nhiệm/Disclaimer".

---

# [TC_DINHGIA_03] Số liệu mặc định lấy từ API

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] 2 API đọc được gọi với mã đang chọn.
- [ ] Ô nhập: EPS 4000 · tăng trưởng 10 · thời gian đầu tư 3 · P/E tương lai 15 · sinh lời tối thiểu 15 · FCF/s 2000.00
  (= FCF TTM / số CP) · vùng an toàn theo MOS, biên 50.
- [ ] Ô xám chỉ đọc: EPS tương lai 5,324 · Giá trị tương lai 79,860 · Tỷ lệ FCF 0.5 · Số lượng CP 1,000 · FCF TTM 2,000,000
  (= OCF + CAPEX) · OCF 3,000,000 · CAPEX -1,000,000.

---

# [TC_DINHGIA_04] KẾT QUẢ + 2 ô vùng

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Giá trị hiện tại = PV(15%, 3 năm, Giá trị tương lai) ≈ 52,509.25; "Giá biên an toàn 50%" = 50% giá trị đó;
  MOS yield = EPS / giá biên an toàn.
- [ ] Giá tại năm muốn hoàn vốn theo FCF/s và theo EPS (8 năm) đúng công thức cộng dồn.
- [ ] Vùng an toàn (xanh) = giá biên an toàn; Vùng báo động (đỏ) = 1,2 × giá trị hiện tại.

---

## Nhóm: Nhập liệu & tính lại

# [TC_DINHGIA_06] Sửa EPS TTM → tính lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đổi EPS TTM thành 5000.

## Kết quả mong đợi
- [ ] EPS tương lai, Giá trị hiện tại, Vùng an toàn tính lại theo EPS mới; Tỷ lệ FCF = 0.4.

---

# [TC_DINHGIA_07] Vùng an toàn theo FCF

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "FCF" ở "Xác định Vùng An toàn theo:". 2. Đổi số năm thành 5.

## Kết quả mong đợi
- [ ] Ô bên cạnh thành số năm hoàn vốn, mặc định 8; Vùng an toàn (xanh) = "Giá tại năm muốn hoàn vốn theo FCF/s".
- [ ] Đổi 5 năm → vùng xanh tính lại; Vùng báo động (đỏ) không đổi.

---

# [TC_DINHGIA_08] "Khôi phục"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Sửa EPS 9999, thời gian đầu tư 7, biên an toàn 20. Bấm "Khôi phục".

## Kết quả mong đợi
- [ ] Các ô về mặc định (4000 / 3 / 50), Giá trị hiện tại tính lại như TC_04.

---

# [TC_DINHGIA_09] Đổi mã ở ô "Mã CK"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "SSI", bấm gợi ý SSI.

## Kết quả mong đợi
- [ ] API số liệu gọi lại với SSI; ô nhập đổi theo số của SSI (EPS 2500, P/E tương lai 12, BVPS 18,000).

---

## Nhóm: Mẫu định giá (giả lập)

# [TC_DINHGIA_10] "Mở mẫu" — danh sách mẫu đã lưu

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Hộp "Danh sách đã lưu" có 2 mẫu, mỗi dòng có "Sửa tên", "Xoá"; ô tìm kiếm "thận" → còn "Mẫu thận trọng".
- [ ] "Đóng" → hộp đóng.

---

# [TC_DINHGIA_11] Chọn 1 mẫu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở mẫu, bấm "Mẫu FPT tăng trưởng". 2. Bấm X cạnh "Đang chọn mẫu".

## Kết quả mong đợi
- [ ] Hộp đóng; "Đang chọn mẫu: Mẫu FPT tăng trưởng"; ô Mã CK = FPT, EPS 5000, thời gian đầu tư 5, P/E 18, biên 40
  ("Giá biên an toàn 40%").
- [ ] Bấm X → hết dòng "Đang chọn mẫu".

---

# [TC_DINHGIA_12] Lưu mẫu mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chưa chọn mẫu, bấm "Lưu" → hộp "Thêm mẫu mới". Nhập "Mẫu autotest", bấm "Lưu".

## Kết quả mong đợi
- [ ] Gửi 1 lệnh lưu (giả lập) có `label` = "Mẫu autotest", `content` chứa mã đang chọn + toàn bộ thông số (EPS 4000,
  biên 50, MOS).
- [ ] Hộp đóng; "Đang chọn mẫu: Mẫu autotest".

---

# [TC_DINHGIA_13] Xoá mẫu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở mẫu, bấm "Xoá" ở "Mẫu FPT tăng trưởng", đồng ý "Xóa".

## Kết quả mong đợi
- [ ] Hỏi "Bạn có muốn xóa không?"; gửi DELETE id 901 (giả lập); mẫu biến mất, còn 1 mẫu.

---

## Nhóm: Phân quyền & lỗi API

# [TC_DINHGIA_14] Tài khoản Free

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Màn bị khoá bằng ảnh mờ `ProtectedView` (`.blurred-image`, `features_disabled.dinh_gia`); không có ô nhập, không có
  "Kết quả tính toán"; không gọi API định giá.

---

# [TC_DINHGIA_15] API số liệu lỗi 500

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Hộp "Đang tải dữ liệu, vui lòng chờ" tự đóng (không treo); EPS TTM = 0, Giá trị hiện tại = 0.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 14 |
| **Tổng** | **14** |

**Cập nhật 10/11/2026:** xoá TC_DINHGIA_05 (`test.fixme`) (bug được user chấp nhận). 15 → 14 TC.
