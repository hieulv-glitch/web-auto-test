# Màn hình: Nhật ký giao dịch — Tab "Danh mục"

- **URL:** `/nhat-ky-giao-dich`, tab thứ 5 "Danh mục" (`active_tab = 4`) — xem khung ở [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** `stocks/src/views/ManageCategory.vue` (bản preprod 03/11/2026).
- **Môi trường:** https://kfsp.vn (production — đã ngang preprod mới nhất, deploy 06/11/2026 10:30 GMT; spec đọc `PREV2_BASE_URL` trong .env, hiện trỏ kfsp.vn) — `Prev2Session` + máy chủ giả `NkgdFakeServer`
  (`pages/TradingLogPage.ts`). Dữ liệu giả: 3 danh mục "Cổ tức", "Dài hạn" (tự nhập vốn 500.000.000 đ), "Lướt sóng"
  + 1 danh mục trong thùng rác "Danh mục cũ".
- **Cập nhật 09/11/2026 — viết lại theo giao diện mới (nhánh B).** Khác bản 19/08:
  - Tab đổi tên "Quản lý danh mục" → **"Danh mục"**, chuyển xuống cuối.
  - Bỏ 2 sub-tab "Danh mục hiện có"/"Danh mục đã xóa": giờ là hàng đầu "N danh mục" + nút **"Danh mục đã xóa (n)"**
    (mở modal danh sách) + nút **"+ Thêm danh mục"**; bảng có hàng **"Tổng"**.
  - Form Thêm/Sửa có ô tích **"Nhập giá vốn"**: không tích = vốn tự động (lưu 0); tích = bắt buộc > 0. Cột "Vốn ban đầu"
    hiện vốn tự nhập, hoặc vốn tự động (= tổng chi mua số cổ phiếu đang nắm) kèm tooltip.
  - Vốn ban đầu lưu ở setting `capital_allocation_data_save` (localStorage + `saveSetting`), không gọi API danh mục.
- **Toast thành công đã bị tắt toàn app** (`main.js`: `$toast.success = () => {}`, yêu cầu 12/10/2026): code vẫn gọi
  `$toast.success("Đã thêm mới danh mục")`… nhưng không hiện gì — thao tác thành công được kiểm bằng kết quả (bảng, request,
  setting) và việc KHÔNG có toast nào. Chỉ còn toast lỗi.
- **⚠️ An toàn dữ liệu:** mọi API danh mục (`/api/stocks/category/store|update|restore|force-delete/{id}|{id}`) đi qua
  máy chủ giả; ghi setting bị chặn (`settingWrites`).
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Tổng quan & bảng danh mục

# [TC_NKGD_DM_01] Overview tab Danh mục

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** bố cục mới (hàng đầu + bảng trong thẻ + hàng Tổng), thay overview 2 sub-tab cũ.

## Các bước thực hiện
1. Mở tab "Danh mục".

## Kết quả mong đợi
- [ ] Hàng đầu: "3 danh mục", nút "Danh mục đã xóa (1)", nút "Thêm danh mục".
- [ ] Bảng có cột "Tên danh mục", "Vốn ban đầu"; 3 dòng xếp theo tên tiếng Việt: Cổ tức, Dài hạn, Lướt sóng; mỗi dòng
      có nút "Sửa" và "Xóa"; cuối bảng có hàng "Tổng".

---

# [TC_NKGD_DM_02] Cột "Vốn ban đầu": vốn tự nhập, vốn tự động và hàng Tổng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở tab "Danh mục", đọc cột "Vốn ban đầu".

## Kết quả mong đợi
- [ ] "Dài hạn" (tự nhập) = `500,000,000`, không có tooltip vốn tự động.
- [ ] "Cổ tức", "Lướt sóng" (vốn tự động) hiện số > 0 và có tooltip "Giá vốn tự động: bằng tổng chi (giá trị + phí) của
      cổ phiếu đang nắm…".
- [ ] Hàng "Tổng" = tổng 3 số đang hiện.

---

# [TC_NKGD_DM_03] Không có danh mục nào

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả danh sách danh mục rỗng, mở tab "Danh mục".

## Kết quả mong đợi
- [ ] "0 danh mục", bảng hiện "Chưa có danh mục nào", không có hàng "Tổng".

---

## Nhóm: Thêm danh mục

# [TC_NKGD_DM_04] Mở modal "Thêm mới danh mục"

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** form mới có ô tích "Nhập giá vốn" (mặc định không tích, không có ô nhập vốn).

## Các bước thực hiện
1. Bấm "Thêm danh mục".

## Kết quả mong đợi
- [ ] Modal "Thêm mới danh mục": nhãn "Tên danh mục" + ô nhập rỗng, ô tích "Nhập giá vốn" chưa tích, KHÔNG có ô nhập vốn,
      nút "Thêm danh mục" và "Hủy".
- [ ] Tích "Nhập giá vốn" → hiện ô nhập vốn + ghi chú "(Vốn giữ nguyên số đã nhập…)"; bỏ tích → ô nhập ẩn lại.

---

# [TC_NKGD_DM_05] Tên danh mục rỗng

- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Mở modal Thêm, để trống tên, bấm "Thêm danh mục".

## Kết quả mong đợi
- [ ] Toast lỗi "Tên danh mục không được để trống", ô tên viền đỏ (`is-invalid`), modal vẫn mở, không gọi API.

---

# [TC_NKGD_DM_07] Tích "Nhập giá vốn" mà vốn = 0

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhập tên hợp lệ, tích "Nhập giá vốn", để vốn 0, bấm "Thêm danh mục".

## Kết quả mong đợi
- [ ] Toast lỗi "Vốn ban đầu phải lớn hơn 0", modal vẫn mở, không gọi API.

---

# [TC_NKGD_DM_08] Thêm danh mục vốn tự động thành công

- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Các bước thực hiện
1. Nhập tên "Tăng trưởng", không tích "Nhập giá vốn", bấm "Thêm danh mục".

## Kết quả mong đợi
- [ ] Gửi đúng 1 `POST …/category/store` với `{ name: "Tăng trưởng" }`.
- [ ] Không hiện toast (thành công im lặng), modal đóng, "4 danh mục", dòng "Tăng trưởng" xuất hiện.

---

# [TC_NKGD_DM_09] Thêm danh mục có nhập giá vốn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhập tên "Tăng trưởng", tích "Nhập giá vốn", nhập `300000000`, bấm "Thêm danh mục".

## Kết quả mong đợi
- [ ] Dòng mới hiện vốn `300,000,000`.
- [ ] Web định ghi setting `capital_allocation_data_save` có `tong_tai_san: "300000000"` cho id danh mục mới (bị chặn
      trong test).

---

# [TC_NKGD_DM_10] Thêm danh mục trùng tên (máy chủ trả 422)

- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Các bước thực hiện
1. Máy chủ trả 422, thêm danh mục "Dài hạn".

## Kết quả mong đợi
- [ ] Toast "Danh mục của bạn đã tồn tại! Vui lòng kiểm tra lại các danh mục hiện có và các danh mục đã xóa trong thùng
      rác.", modal đóng, danh sách không đổi.

---

# [TC_NKGD_DM_11] Thêm danh mục lỗi 500

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả 500, thêm danh mục.

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại", modal đóng, danh sách không đổi.

---

# [TC_NKGD_DM_14] Đóng modal Thêm bằng "Hủy"/nút X không lưu

- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Nhập tên, bấm "Hủy". Mở lại, nhập tên, bấm X.

## Kết quả mong đợi
- [ ] Modal đóng, không gọi API, danh sách không đổi; mở lại thì ô tên rỗng.

---

# [TC_NKGD_DM_15] Danh mục vừa thêm có trong phiếu lệnh của tab Giao dịch

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** rời tab Danh mục → `handleChangeCategories` cập nhật danh sách danh mục của cả trang.

## Các bước thực hiện
1. Thêm danh mục "Tăng trưởng" (thành công), chuyển sang tab "Giao dịch", bấm "Mua".

## Kết quả mong đợi
- [ ] Ô "Danh mục" của phiếu lệnh có lựa chọn "Tăng trưởng".

---

## Nhóm: Sửa danh mục

# [TC_NKGD_DM_16] Mở modal "Sửa danh mục" — điền sẵn đúng dữ liệu

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** ô tích "Nhập giá vốn" tích sẵn khi danh mục đang tự nhập vốn > 0.

## Các bước thực hiện
1. Bấm "Sửa" ở dòng "Dài hạn"; đóng; bấm "Sửa" ở dòng "Lướt sóng".

## Kết quả mong đợi
- [ ] "Dài hạn": tên "Dài hạn", "Nhập giá vốn" đã tích, ô vốn = `500,000,000`, nút "Lưu thay đổi".
- [ ] "Lướt sóng": "Nhập giá vốn" chưa tích, không có ô vốn.

---

# [TC_NKGD_DM_17] Chỉ đổi vốn ban đầu — không gọi API, chỉ lưu setting

- **Trạng thái:** ✅ Áp dụng

## Các bước thực hiện
1. Sửa "Dài hạn": đổi vốn thành `600000000`, giữ tên, bấm "Lưu thay đổi".

## Kết quả mong đợi
- [ ] Không gọi `PUT …/category/update`; không hiện toast (thành công im lặng); modal đóng; dòng "Dài hạn" hiện `600,000,000`.
- [ ] Web định ghi setting `capital_allocation_data_save` với `tong_tai_san: "600000000"` cho "Dài hạn".

---

# [TC_NKGD_DM_18] Đổi tên danh mục thành công

- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Các bước thực hiện
1. Sửa "Lướt sóng" → tên "Lướt sóng T+", bấm "Lưu thay đổi".

## Kết quả mong đợi
- [ ] Gửi `PUT …/category/update` với `{ id, name: "Lướt sóng T+" }`; không hiện toast (thành công im lặng); dòng đổi tên.

---

# [TC_NKGD_DM_19] Đổi tên trùng danh mục khác

- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Các bước thực hiện
1. Máy chủ trả lỗi `{ error: "Already name" }`; đổi tên "Lướt sóng" thành "Dài hạn".

## Kết quả mong đợi
- [ ] Toast "Tên danh mục đã tồn tại! Vui lòng nhập tên danh mục mới", modal đóng, tên cũ giữ nguyên.

---

# [TC_NKGD_DM_20] Sửa với tên rỗng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Sửa "Lướt sóng", xoá hết tên, bấm "Lưu thay đổi".

## Kết quả mong đợi
- [ ] Toast "Tên danh mục không được để trống", modal vẫn mở, không gọi API.

---

## Nhóm: Thùng rác

# [TC_NKGD_DM_21] Xoá danh mục vào thùng rác

- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Các bước thực hiện
1. Bấm "Xóa" ở dòng "Lướt sóng" → modal "Xóa dữ liệu" "Di chuyển vào thùng rác. Bạn có chắc chắn không?" → bấm
   "Di chuyển vào thùng rác".

## Kết quả mong đợi
- [ ] Gửi `DELETE /api/stocks/category/{id}`; không hiện toast (thành công im lặng); modal đóng.
- [ ] Dòng biến mất, "2 danh mục", nút "Danh mục đã xóa (2)".

---

# [TC_NKGD_DM_22] Xoá vào thùng rác lỗi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả 500, xoá "Lướt sóng".

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại", modal đóng, dòng vẫn còn.

---

# [TC_NKGD_DM_23] Modal "Danh mục đã xóa"

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** thay sub-tab "Danh mục đã xóa" cũ.

## Các bước thực hiện
1. Bấm "Danh mục đã xóa (1)". Lặp lại khi thùng rác rỗng.

## Kết quả mong đợi
- [ ] Modal "Danh mục đã xóa" liệt kê "Danh mục cũ" kèm nút "Khôi phục" và "Xóa vĩnh viễn".
- [ ] Thùng rác rỗng: nút ghi "Danh mục đã xóa" (không số), modal hiện "Chưa có danh mục nào bị xóa."

---

# [TC_NKGD_DM_24] Khôi phục danh mục — chạy ngay, không hỏi lại

- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Các bước thực hiện
1. Trong modal "Danh mục đã xóa", bấm "Khôi phục" ở "Danh mục cũ".

## Kết quả mong đợi
- [ ] Gửi `POST …/category/restore` với `{ id }`, không có modal xác nhận; không hiện toast (thành công im lặng); dòng rời modal, xuất hiện trong bảng; "4 danh mục".

---

# [TC_NKGD_DM_25] Xoá vĩnh viễn

- **Trạng thái:** ✅ Áp dụng (giả lập máy chủ)

## Các bước thực hiện
1. Bấm "Xóa vĩnh viễn" ở "Danh mục cũ" → modal "Danh mục sẽ bị xóa vĩnh viễn. Bạn có chắc chắn không?" → bấm "Xóa vĩnh viễn".

## Kết quả mong đợi
- [ ] Gửi `DELETE …/category/force-delete/{id}`; không hiện toast (thành công im lặng); modal xác nhận đóng; thùng rác rỗng.

---

# [TC_NKGD_DM_26] Xoá vĩnh viễn lỗi — modal xác nhận không tự đóng

- **Trạng thái:** 🆕 Testcase mới (giữ từ bản cũ TC_NKGD_DM_20)
- **Ghi chú:** `handleForceDelete().catch` không đóng modal, khác các thao tác khác (đều đóng). Cách cư xử không thống nhất,
  ghi nhận để dev quyết định.

## Các bước thực hiện
1. Máy chủ trả 500, xoá vĩnh viễn "Danh mục cũ".

## Kết quả mong đợi (đo được)
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại"; modal xác nhận VẪN mở; "Danh mục cũ" vẫn trong thùng rác.

---

## Tổng hợp trạng thái (23 testcase)

Tự động hoá: [tests/nhat-ky-giao-dich-danh-muc.spec.ts](../tests/nhat-ky-giao-dich-danh-muc.spec.ts).

**Cập nhật 10/11/2026:** xoá TC_NKGD_DM_06, TC_NKGD_DM_12, TC_NKGD_DM_13 (bug được user chấp nhận) — tổng 26 → 23.

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 12 | DM_04, 05, 08, 10, 14, 16, 17, 18, 19, 21, 24, 25 |
| 🆕 Mới (riêng web) | 11 | DM_01, 02, 03, 07, 09, 11, 15, 20, 22, 23, 26 |

**Đối chiếu bản 19/08 (21 TC):** DM_01–02 (2 sub-tab) → DM_01 + DM_23; DM_03 → DM_01/02; DM_04 (lỗi tải im lặng) bỏ (không
còn khác biệt quan sát được); DM_05–10 → DM_04–12; DM_11–14 → DM_16–19; DM_15–20 → DM_21, 24–26; DM_21 → DM_14. Mới: DM_03,
07, 09, 13, 15, 20, 22.

**Phát hiện đáng chú ý:**
1. **DM_26:** xoá vĩnh viễn lỗi thì modal không đóng — khác mọi thao tác khác của tab.
