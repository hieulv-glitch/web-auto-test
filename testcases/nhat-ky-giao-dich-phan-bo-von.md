# Màn hình: Nhật ký giao dịch — Tab "Phân bổ vốn"

- **URL:** `/nhat-ky-giao-dich`, tab thứ 4 "Phân bổ vốn" (`active_tab = 3`) — khung ở [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** `stocks/src/views/CapitalAllocation.vue` (bản preprod 03/11/2026).
- **Môi trường:** https://kfsp.vn (production — đã ngang preprod mới nhất, deploy 06/11/2026 10:30 GMT; spec đọc `PREV2_BASE_URL` trong .env, hiện trỏ kfsp.vn) + `Prev2Session` + máy chủ giả `NkgdFakeServer`. Dữ liệu giả: "Dài hạn" vốn 500.000.000 đ, % cắt lỗ
  tối đa 2, % cắt lỗ deal 10; "Cổ tức", "Lướt sóng" chưa cấu hình.
- **Cập nhật 09/11/2026 — viết lại theo giao diện mới (nhánh B).** Khác bản 20/08:
  - Bố cục mới: hàng đầu = ô chọn danh mục (dropdown tự viết, xếp theo tên) + dải 3 số "Vốn ban đầu" (có **bút chì sửa
    tại chỗ**), "Lãi/lỗ đã thực hiện", "Vốn khả dụng"; 2 khung "Thiết lập deal tiếp theo" và bảng "Trạng thái danh mục"
    (Hiện tại / Khi có deal tiếp theo + chênh lệch); "Biểu đồ cơ cấu" dạng vòng kèm bảng chú thích, gập/mở được.
  - **Bỏ** ô nhập "Vốn ban đầu" dạng form và checkbox "Ghi nhận lời lỗ của danh mục vào vốn khả dụng" (TC_NKGD_PBV_07 cũ
    xoá) — vốn khả dụng giờ luôn = vốn + lãi/lỗ đã thực hiện.
  - Bỏ 3 nút gập riêng lẻ (TC_PBV_12 cũ) — chỉ còn 1 nút gập biểu đồ cơ cấu.
  - Cấu hình lưu localStorage `capital_allocation_data_save` ngay + setting `saveSetting` gom 3 giây (`_.debounce`).
- **Toast thành công đã bị tắt toàn app** (`main.js`, 12/10/2026): "Đã lưu vốn ban đầu" không hiện; chỉ còn toast lỗi.
- **⚠️ An toàn dữ liệu:** tab không gọi API ghi riêng; ghi setting bị `Prev2Session` chặn (`settingWrites`).
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Tổng quan & chọn danh mục

# [TC_NKGD_PBV_01] Overview tab Phân bổ vốn

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** bố cục mới (xem đầu file).

## Các bước thực hiện
1. Mở tab "Phân bổ vốn" (chưa từng chọn danh mục).

## Kết quả mong đợi
- [ ] Ô chọn danh mục hiện danh mục đầu tiên theo tên ("Cổ tức").
- [ ] Dải 3 số "Vốn ban đầu" (có bút chì "Sửa vốn ban đầu"), "Lãi/lỗ đã thực hiện", "Vốn khả dụng".
- [ ] Khối "Thiết lập deal tiếp theo": "% Cắt lỗ tối đa trên tổng tài sản" (placeholder 2), "Giá trị cắt lỗ tối đa trên
      tổng tài sản", "% Cắt lỗ trên deal tiếp theo" (placeholder 10), "Phân bổ vốn cho deal tiếp theo", "Tiền mặt", "Margin".
- [ ] Bảng "Trạng thái danh mục | Hiện tại | Khi có deal tiếp theo" với 4 dòng: Giá vốn chứng khoán của danh mục, Số tiền
      khả dụng của danh mục, Margin đang sử dụng, Tỷ lệ Margin/Vốn khả dụng.
- [ ] Khối "Biểu đồ cơ cấu" đang mở (bảng chú thích "Thành phần" chỉ hiện khi danh mục có dữ liệu — xem PBV_16).

---

# [TC_NKGD_PBV_02] Chọn danh mục — nạp đúng cấu hình đã lưu của danh mục đó

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** dropdown mới, danh sách xếp theo tên, bấm ra ngoài thì đóng.

## Các bước thực hiện
1. Mở ô chọn danh mục; bấm ra ngoài. Chọn "Dài hạn". Chọn "Lướt sóng".

## Kết quả mong đợi
- [ ] Danh sách: Cổ tức, Dài hạn, Lướt sóng; bấm ra ngoài thì danh sách đóng.
- [ ] "Dài hạn": vốn `500,000,000 đ`, % cắt lỗ tối đa `2`, % deal `10`.
- [ ] "Lướt sóng" (chưa cấu hình): vốn `0 đ`, % = `0`.

---

# [TC_NKGD_PBV_03] Tài khoản chưa có danh mục nào

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** thay TC_PBV_09 cũ (crash tiềm ẩn) — đo lại trên bản mới: không lỗi.

## Các bước thực hiện
1. Máy chủ trả 0 danh mục, mở tab.

## Kết quả mong đợi
- [ ] Không lỗi JS; vốn `0 đ`, "Phân bổ vốn cho deal tiếp theo" `0 đ`.

---

## Nhóm: Tính toán deal tiếp theo

# [TC_NKGD_PBV_04] Công thức cắt lỗ tối đa, phân bổ vốn, vốn khả dụng

- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Chọn "Dài hạn" (vốn 500 triệu, 2%, 10%).

## Kết quả mong đợi
- [ ] Giá trị cắt lỗ tối đa = 500.000.000 × 2% = `10,000,000 đ`.
- [ ] Phân bổ vốn cho deal tiếp theo = 10.000.000 ÷ 10% = `100,000,000 đ`.
- [ ] Vốn khả dụng = vốn ban đầu + lãi/lỗ đã thực hiện của danh mục (số ở ô "Lãi/lỗ đã thực hiện").

---

# [TC_NKGD_PBV_05] Đổi % → tính lại ngay

- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. "Dài hạn": % cắt lỗ tối đa = 5; rồi % deal = 20.

## Kết quả mong đợi
- [ ] Cắt lỗ tối đa `25,000,000 đ`, phân bổ `250,000,000 đ`; sau khi % deal = 20 → phân bổ `125,000,000 đ`.

---

# [TC_NKGD_PBV_06] Phân bổ vượt số tiền khả dụng → cảnh báo màu + có margin

- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. "Dài hạn": % cắt lỗ tối đa = 50 (phân bổ 2,5 tỷ > tiền khả dụng).

## Kết quả mong đợi
- [ ] "Phân bổ vốn cho deal tiếp theo" = `2,500,000,000 đ`, tô màu cảnh báo (`warning-text-color`); trước đó không tô.
- [ ] Dòng "Margin" > 0.

---

# [TC_NKGD_PBV_07] % trống hoặc 0 → viền đỏ, số tính ra = 0

- **Trạng thái:** 🆕 Testcase mới (thay TC_PBV_02/03/04 cũ)
- **Ghi chú:** bản 20/08 để fixme vì `is-invalid` không ổn định (2 `v-model` trùng trên cùng ô). Bản mới vẫn còn 2
  `v-model` trùng nhưng có `watch` gọi `$touch()` mỗi khi giá trị đổi → đo lại ổn định.

## Các bước thực hiện
1. "Dài hạn": % cắt lỗ tối đa = 0 (rời ô); % deal = trống (rời ô).

## Kết quả mong đợi
- [ ] Ô viền đỏ (`is-invalid`); cắt lỗ tối đa `0 đ`; phân bổ `0 đ`.

---

# [TC_NKGD_PBV_08] Bảng trạng thái — cột "Khi có deal tiếp theo" + chênh lệch

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay 2 khối "Trạng thái hiện tại"/"khi có deal" cũ bằng 1 bảng 3 cột.

## Các bước thực hiện
1. Chọn "Dài hạn" (phân bổ 100 triệu).

## Kết quả mong đợi
- [ ] Dòng "Giá vốn chứng khoán của danh mục": cột sau = hiện tại + 100.000.000, chênh lệch `+100,000,000`.

---

## Nhóm: Sửa vốn ban đầu (bút chì)

# [TC_NKGD_PBV_09] Bút chì → sửa tại chỗ, Enter lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. "Dài hạn": bấm bút chì, nhập `600000000`, nhấn Enter.

## Kết quả mong đợi
- [ ] Bấm bút chì: ô nhập được focus, có sẵn `500,000,000`, toàn bộ chữ được chọn.
- [ ] Enter: không hiện toast (thành công im lặng); vốn `600,000,000 đ`; cắt lỗ tối đa tính lại `12,000,000 đ`.

---

# [TC_NKGD_PBV_10] Esc hoặc bấm ra ngoài → huỷ sửa

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm bút chì, nhập số khác, nhấn Esc. Lặp lại, bấm ra ngoài ô.

## Kết quả mong đợi
- [ ] Vốn giữ `500,000,000 đ`, không có toast.

---

# [TC_NKGD_PBV_11] Vốn không hợp lệ (số âm, chữ)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm bút chì, nhập `-5` (lần 2: `abc`), nhấn Enter.

## Kết quả mong đợi
- [ ] Toast lỗi "Vốn ban đầu phải là số không âm"; vẫn ở chế độ sửa (ô nhập còn hiện).

---

# [TC_NKGD_PBV_12] Enter khi không đổi số → chỉ thoát chế độ sửa

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm bút chì, nhấn Enter ngay.

## Kết quả mong đợi
- [ ] Thoát chế độ sửa, vốn giữ nguyên, không có toast.

---

## Nhóm: Lưu cấu hình

# [TC_NKGD_PBV_13] Lưu localStorage ngay, setting gom ~3 giây

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PBV_10/11 cũ (auto-save không ổn định / lỗi im lặng). Bản mới: `watch data_save` ghi localStorage
  ngay và gọi `saveAllData` (`_.debounce` 3 giây) → `saveSetting`. Đo lại: ổn định.

## Các bước thực hiện
1. "Dài hạn": % cắt lỗ tối đa = 3, % deal = 8 (liên tiếp).

## Kết quả mong đợi
- [ ] localStorage `capital_allocation_data_save` cập nhật ngay `phan_tram_cutloss_toi_da: "3"`.
- [ ] Ngay sau đó chưa gửi setting; sau ~3 giây gửi đúng 1 lần `capital_allocation_data_save` chứa cả `3` và `8`.
- **Ghi chú:** trong ~1 giây đầu sau khi tab nạp cấu hình (`is_first_set_data`, `setTimeout 1000`), thay đổi KHÔNG được ghi
  (localStorage lẫn setting) và cũng không được ghi lại sau đó nếu không sửa thêm — người dùng thật khó gặp, ghi nhận để dev biết.

---

# [TC_NKGD_PBV_14] Cấu hình riêng từng danh mục

- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. "Dài hạn": % cắt lỗ tối đa = 4; chọn "Lướt sóng"; chọn lại "Dài hạn".

## Kết quả mong đợi
- [ ] "Lướt sóng" hiện `0`; quay lại "Dài hạn" vẫn `4`.

---

## Nhóm: Biểu đồ cơ cấu

# [TC_NKGD_PBV_15] Gập/mở biểu đồ cơ cấu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm nút mũi tên ở "Biểu đồ cơ cấu" 2 lần.

## Kết quả mong đợi
- [ ] Lần 1: `aria-expanded="false"`, nhãn "Mở biểu đồ cơ cấu", vùng biểu đồ ẩn. Lần 2: mở lại.

---

# [TC_NKGD_PBV_16] Chú thích cơ cấu và thanh Vốn khả dụng/Margin

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "Dài hạn", đọc bảng chú thích và thanh tỷ lệ dưới biểu đồ.

## Kết quả mong đợi
- [ ] Tổng cột "Tỷ trọng" = 100%; giữa vòng ghi "Tổng".
- [ ] Thanh dưới: "Vốn khả dụng x%" + "Margin y%", x + y = 100.

---

# [TC_NKGD_PBV_17] Mở thẳng tab Phân bổ vốn khi setting chưa tải xong — cấu hình không nạp

- **Trạng thái:** 🆕 Testcase mới — 🐞 bug mới
- **Nguyên nhân:** `getDataCategory()` chỉ gọi `loadDataFromLocalStorage()` khi `store.state.is_getting_data_saved` đã là false;
  nếu danh sách danh mục về TRƯỚC setting người dùng (`/getusersettings`) thì không bao giờ nạp lại (không có watcher). Từ khi
  NKGD nhớ tab (`trading_log_view_state`), F5 khi đang ở tab Phân bổ vốn là mở thẳng tab này → dễ gặp.

## Các bước thực hiện
1. Đặt tab nhớ = Phân bổ vốn, mở `/nhat-ky-giao-dich` (danh mục về trước setting); chọn "Dài hạn".

## Kết quả mong đợi (đo được)
- [ ] Ô chọn danh mục RỖNG, "Vốn ban đầu" `0 đ`; chọn "Dài hạn" vẫn `0 đ`, % = `0` (đúng ra 500,000,000 đ và 2).
- [ ] Mong đợi đúng (cần dev sửa): nạp lại cấu hình khi setting tải xong (watch `is_getting_data_saved`).

---

## Tổng hợp trạng thái (17 testcase, 18 test vì TC_11 chạy 2 giá trị)

Tự động hoá: [tests/nhat-ky-giao-dich-phan-bo-von.spec.ts](../tests/nhat-ky-giao-dich-phan-bo-von.spec.ts).

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 8 | PBV_01, 02, 04, 05, 06, 08, 13, 14 |
| 🆕 Mới (riêng web) | 9 | PBV_03, 07, 09, 10, 11, 12, 15, 16, 17 |
| ⚠️ Cần xác nhận thêm | 0 | |

**Đối chiếu bản 20/08 (16 TC, 3 fixme):** 01, 05, 06, 08 giữ (sửa theo bố cục mới); 02/03/04 (validate, 2 fixme) → PBV_07 (đã
tự động hoá ổn định); 07 (checkbox ghi nhận lời lỗ) xoá — tính năng bỏ; 09 → 03; 10/11 (auto-save, 1 fixme) → 13; 12 (3 nút gập)
→ 15; 13/14 → 08 + 16; 15/16 (empty/lỗi tải) gộp vào 03.

**Phát hiện đáng chú ý:**
- 🐞 **PBV_17 (mới):** mở thẳng tab (F5 khi đang ở tab) mà danh mục về trước setting → cấu hình phân bổ vốn không nạp.
- 3 fixme cũ (TC_PBV_02, 04, 10) không còn cần — hành vi đo lại ổn định trên bản mới. Ô % vẫn
có 2 `v-model` trùng (`v-model.lazy` + `v-model`) — nên đề nghị dev bỏ 1 cái cho sạch, dù hiện không gây lỗi quan sát được.
