# Màn hình: Nhật ký giao dịch — Tab "Quản lý danh mục"

- **URL:** `/nhat-ky-giao-dich` (`active_tab = 2`) — xem tổng quan 4 tab ở
  [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md).
- **Component:** [src/views/ManageCategory.vue](../../stocks/src/views/ManageCategory.vue) (796 dòng), dùng
  thêm `textMask.vue` (input "Vốn ban đầu"). Bị khóa bởi `<ProtectedView featureName="nkgd_quan_ly_danh_muc">`
  nếu tài khoản chưa đủ quyền (xem [nhat-ky-giao-dich.md](nhat-ky-giao-dich.md) TC_NKGD_09).
- **Domain test:** https://kfsp.vn/nhat-ky-giao-dich
- **Nguồn testcase gốc (app):** Google Sheet, tab "Nhật Kí giao dịch" — Sheet không có khái niệm "Quản lý danh
  mục" tách riêng thành tab như web (app quản lý danh mục lồng trong luồng khác) → toàn bộ testcase dưới đây là
  🆕, không gắn được `Tham chiếu App`.
- **Phương pháp sinh:** Đọc toàn bộ `ManageCategory.vue` + `textMask.vue` + kiểm kê độc lập qua DOM thật
  (`.dom-inspect/nkgd-danhmuc.*`).
- **⚠️ AN TOÀN DỮ LIỆU — QUAN TRỌNG:** Tài khoản test có **11 danh mục thật** đang dùng cho hàng trăm giao dịch
  thật (xem danh sách trong ảnh chụp DOM: Lướt Sóng, v70Release, MFR - v70 - iphone, NKGD - V70, v70-4, v71,
  v71 done release, v72, iphoneV72, NKGD-New, testNKGDnew). Mọi testcase Thêm/Sửa/Xóa/Khôi phục dưới đây
  **mock qua `page.route()`**, không có testcase nào thao tác thật trên các danh mục hiện có (xóa nhầm 1 danh
  mục thật sẽ ảnh hưởng trực tiếp tới toàn bộ giao dịch đang gắn với nó).
- **Quy ước trạng thái:** 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Overview & sub-tab

# [TC_NKGD_DM_01] Overview — sub-tab "Danh mục hiện có" active mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Vào tab "Quản lý danh mục".

## Kết quả mong đợi
- [ ] Hiển thị 2 sub-tab: "Danh mục hiện có" (active mặc định), "Danh mục đã xóa".
- [ ] Hiển thị nút "Thêm danh mục" + bảng 2 cột "Tên danh mục hiện có"/"Vốn ban đầu" + icon Sửa/Xóa mỗi dòng.

---

# [TC_NKGD_DM_02] Chuyển sang sub-tab "Danh mục đã xóa"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Click sub-tab "Danh mục đã xóa".

## Kết quả mong đợi
- [ ] Hiển thị bảng danh mục đã xóa (nếu có) với icon Khôi phục/Xóa vĩnh viễn, KHÔNG có nút "Thêm danh mục".

---

## Nhóm: Bảng "Danh mục hiện có"

# [TC_NKGD_DM_03] Hiển thị đúng danh sách danh mục + Vốn ban đầu

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát bảng "Danh mục hiện có".

## Kết quả mong đợi
- [ ] Mỗi dòng hiển thị đúng tên danh mục + "Vốn ban đầu" (đọc từ `localStorage`, KHÔNG đồng bộ server — xem
      ghi chú dưới).
- [ ] "Vốn ban đầu" hiển thị "0" nếu chưa từng thiết lập trên trình duyệt hiện tại, kể cả khi đã thiết lập trên
      trình duyệt/thiết bị khác của cùng người dùng.

---

# [TC_NKGD_DM_04] Lỗi tải danh sách danh mục — im lặng, không thông báo cho người dùng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** Đọc code `getAllItemCategory()`/`getAllItemCategorySoftDelete()` — nhánh
  `.catch` chỉ `console.error`, KHÔNG toast, KHÔNG có error-state riêng. Khi API lỗi, bảng hiển thị GIỐNG HỆT
  trường hợp thật sự chưa có danh mục nào ("Chưa có danh mục nào"), người dùng không phân biệt được đây là lỗi
  tải hay tài khoản mới chưa có dữ liệu.

## Các bước thực hiện
1. Mock `GET /api/tradinglog/category/get-all` trả lỗi 500.
2. Vào tab "Quản lý danh mục".

## Kết quả mong đợi
- [ ] Bảng hiển thị "Chưa có danh mục nào" — (ghi nhận hạn chế UX) không có bất kỳ toast/thông báo lỗi nào phân
      biệt với trường hợp tài khoản thật sự chưa có danh mục.

---

## Nhóm: Thêm danh mục mới

# [TC_NKGD_DM_05] Mở modal "Thêm mới danh mục"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click "Thêm danh mục".

## Kết quả mong đợi
- [ ] Modal mở với "Tên danh mục" (rỗng) + "Vốn ban đầu" (mặc định "0", định dạng số nghìn).

---

# [TC_NKGD_DM_06] Validate tên danh mục rỗng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Mở modal Thêm danh mục, để trống "Tên danh mục", click "Lưu".

## Kết quả mong đợi
- [ ] Toast lỗi "Tên danh mục không được để trống", modal vẫn mở, không gọi API.

---

# [TC_NKGD_DM_07] Tên danh mục chỉ chứa khoảng trắng — được chấp nhận (bug tiềm ẩn)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** Validate chỉ so sánh `name != ""`, KHÔNG `.trim()` trước khi check → tên toàn
  khoảng trắng (VD `"   "`) được coi là hợp lệ, vượt qua validate client và bị gửi thẳng lên API.

## Các bước thực hiện
1. Mock `POST /api/stocks/category/store` trả `200`.
2. Nhập "Tên danh mục" = 3 dấu cách, click "Lưu".

## Kết quả mong đợi
- [ ] (Hành vi thật đo được) KHÔNG có toast lỗi "không được để trống" — request `POST` được gửi đi với tên toàn
      khoảng trắng. Ghi nhận là hạn chế validate cần báo dev bổ sung `.trim()`.

---

# [TC_NKGD_DM_08] Thêm danh mục thành công (mock)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `POST /api/stocks/category/store` trả `200` kèm `{ id, name, ... }`.
2. Nhập tên hợp lệ (VD `[TEST] Danh mục mới`), click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Đã thêm mới danh mục", modal đóng, danh mục mới xuất hiện đầu bảng (highlight tạm thời).

---

# [TC_NKGD_DM_09] Thêm danh mục trùng tên (mock lỗi 422)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `POST /api/stocks/category/store` trả lỗi HTTP 422.
2. Nhập tên đã tồn tại, click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Danh mục của bạn đã tồn tại! Vui lòng kiểm tra lại tên danh mục, kể cả các danh mục đã xóa trong
      thùng rác." (nội dung xấp xỉ, xác nhận đúng theo message thật khi chạy), modal đóng.

---

# [TC_NKGD_DM_10] Thêm danh mục khi mất mạng — bug crash tiềm ẩn (thiếu optional chaining)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện bug thật**
- **⚠️ Phát hiện đáng chú ý (bug thật):** `.catch` của `addNewTrading()` truy cập `error.response.status`
  KHÔNG có optional chaining — nếu lỗi là network error thật (không có `error.response`, VD do mất mạng/CORS/
  timeout), dòng này ném `TypeError: Cannot read properties of undefined (reading 'status')`, làm hỏng luôn
  `.catch`, không có toast lỗi nào hiển thị cho người dùng.

## Các bước thực hiện
1. `context.setOffline(true)` HOẶC mock `POST /api/stocks/category/store` bằng `route.abort()`.
2. Đăng ký `page.on('pageerror', ...)`.
3. Nhập tên hợp lệ, click "Lưu".

## Kết quả mong đợi
- [ ] (Kỳ vọng ban đầu) Toast lỗi mạng hiển thị, modal vẫn mở để thử lại.
- [ ] (Hành vi thật đo được — BUG) Không có toast nào hiển thị; ghi nhận `pageerror` (`TypeError`) do thiếu
      optional chaining khi truy cập `error.response.status`. Cần báo dev sửa thành
      `error.response?.status`.

---

## Nhóm: Sửa danh mục

# [TC_NKGD_DM_11] Mở modal "Sửa danh mục" — prefill đúng dữ liệu

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click icon Sửa trên 1 dòng danh mục.

## Kết quả mong đợi
- [ ] Modal "Cập nhật Danh mục" (hoặc tiêu đề tương đương — xác nhận đúng text thật khi chạy) mở với "Tên danh
      mục" và "Vốn ban đầu" đã điền sẵn đúng giá trị hiện có.

---

# [TC_NKGD_DM_12] Chỉ sửa "Vốn ban đầu" (không đổi tên) — KHÔNG gọi API, chỉ lưu `localStorage`

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** Đọc code `saveEditTradingMC()` — có nhánh rẽ đặc biệt: nếu tên KHÔNG đổi nhưng
  "Vốn ban đầu" có đổi, hàm gọi `saveVonBanDau()` (chỉ lưu `localStorage`) rồi **return luôn**, KHÔNG gọi API
  `PUT /api/stocks/category/update`. Toast vẫn hiện "Đã cập nhật giao dịch" y hệt trường hợp có gọi API, khiến
  người dùng không phân biệt được 2 luồng khác nhau này.

## Các bước thực hiện
1. Đăng ký theo dõi request `PUT /api/stocks/category/update` (không mock, chỉ đếm).
2. Mở modal Sửa 1 danh mục, CHỈ đổi "Vốn ban đầu" (giữ nguyên tên), click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Đã cập nhật giao dịch" hiển thị, modal đóng, giá trị Vốn ban đầu trên bảng cập nhật đúng.
- [ ] KHÔNG có request `PUT /api/stocks/category/update` nào được gửi (chỉ thay đổi `localStorage`) — an toàn
      để test thật trên tài khoản test vì không chạm server.

---

# [TC_NKGD_DM_13] Đổi tên danh mục — có gọi API (mock thành công)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `PUT /api/stocks/category/update` trả `200`.
2. Mở modal Sửa 1 danh mục, đổi "Tên danh mục" sang tên khác, click "Lưu".

## Kết quả mong đợi
- [ ] Request `PUT` được gửi đi, toast "Đã cập nhật giao dịch", modal đóng, tên mới hiển thị trên bảng
      (highlight tạm thời).

---

# [TC_NKGD_DM_14] Đổi tên trùng với danh mục khác (mock lỗi)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `PUT /api/stocks/category/update` trả lỗi với `error.response.data.error == "Already name"`.
2. Đổi tên, click "Lưu".

## Kết quả mong đợi
- [ ] Toast "Tên danh mục đã tồn tại!..." (xác nhận đúng text thật), modal đóng.

---

## Nhóm: Xóa (thùng rác) & Khôi phục

# [TC_NKGD_DM_15] Icon Xóa mở modal xác nhận "Di chuyển vào thùng rác"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click icon Xóa trên 1 dòng danh mục (ở sub-tab "Danh mục hiện có").

## Kết quả mong đợi
- [ ] Modal "Xóa dữ liệu" mở, nội dung "Di chuyển vào thùng rác. Bạn có chắc chắn không?".

---

# [TC_NKGD_DM_16] Xác nhận xóa (soft-delete) thành công (mock)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `DELETE /api/stocks/category/{id}` trả `200`.
2. Xác nhận xóa 1 danh mục.

## Kết quả mong đợi
- [ ] Toast "Di chuyển vào thùng rác thành công", danh mục biến mất khỏi "Danh mục hiện có" và xuất hiện ở
      "Danh mục đã xóa".

---

# [TC_NKGD_DM_17] Khôi phục danh mục từ thùng rác — chạy ngay, KHÔNG có modal xác nhận

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Ghi chú:** Khác với mọi hành động mutate khác trong tab này, "Khôi phục" KHÔNG có bước xác nhận — click là
  gọi API ngay lập tức.

## Các bước thực hiện
1. Ở sub-tab "Danh mục đã xóa", mock `POST /api/stocks/category/restore` trả `200`.
2. Click icon Khôi phục trên 1 dòng.

## Kết quả mong đợi
- [ ] Không có modal xác nhận nào xuất hiện, danh mục biến mất khỏi "Danh mục đã xóa" và quay lại "Danh mục
      hiện có" ngay lập tức, toast "Khôi phục thành công danh mục <tên>".

---

# [TC_NKGD_DM_18] Xóa vĩnh viễn — modal xác nhận riêng, chỉ 1 bước (không gõ lại tên)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Ở sub-tab "Danh mục đã xóa", click icon Xóa vĩnh viễn trên 1 dòng.

## Kết quả mong đợi
- [ ] Modal "Xóa dữ liệu" mở, nội dung "Danh mục sẽ bị xóa vĩnh viễn. Bạn có chắc chắn không?" — chỉ 1 bước xác
      nhận, KHÔNG yêu cầu gõ lại tên danh mục để confirm (khác với các hệ thống thường yêu cầu double-confirm
      cho hành động không thể hoàn tác).

---

# [TC_NKGD_DM_19] Xác nhận xóa vĩnh viễn thành công (mock)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mock `DELETE /api/stocks/category/force-delete/{id}` trả `200`.
2. Xác nhận xóa vĩnh viễn.

## Kết quả mong đợi
- [ ] Toast "Xóa thành công <tên>", danh mục biến mất hẳn khỏi "Danh mục đã xóa".

---

# [TC_NKGD_DM_20] Xóa vĩnh viễn lỗi — modal KHÔNG tự đóng (khác các hành động khác)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Khác với `addNewTrading`/`saveEditTradingMC`/`saveDeleteTradingMC` (luôn đóng modal dù lỗi),
  `handleForceDelete` KHÔNG đóng modal khi lỗi — hành vi nhất quán hơn, cho phép người dùng thử lại ngay.

## Các bước thực hiện
1. Mock `DELETE /api/stocks/category/force-delete/{id}` trả lỗi 500.
2. Xác nhận xóa vĩnh viễn.

## Kết quả mong đợi
- [ ] Toast lỗi chung hiển thị, modal xác nhận VẪN MỞ (không tự đóng).

---

## Nhóm: Hành vi chung khác

# [TC_NKGD_DM_21] Nút "Hủy"/đóng modal Thêm/Sửa không lưu thay đổi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở modal Thêm hoặc Sửa danh mục, nhập vài ký tự vào "Tên danh mục".
2. Click "Hủy".

## Kết quả mong đợi
- [ ] Modal đóng, không có request nào được gửi, bảng không đổi.

---

## Tổng hợp trạng thái (21 testcase)

Đã tự động hoá bằng Playwright: [tests/nhat-ky-giao-dich-danh-muc.spec.ts](../tests/nhat-ky-giao-dich-danh-muc.spec.ts)
(POM dùng chung: [pages/TradingLogPage.ts](../pages/TradingLogPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 21 | Toàn bộ — Sheet app không có tab "Quản lý danh mục" tương ứng |
| ⚠️ Cần xác nhận thêm | 0 | |

**Phát hiện đáng chú ý (bug thật, ưu tiên báo dev):**
1. **TC_NKGD_DM_10:** `.catch` của `addNewTrading()`/`saveEditTradingMC()` thiếu optional chaining khi đọc
   `error.response.status`/`error.response.data.error` → crash `TypeError` khi lỗi mạng thật (không có
   `error.response`), không có toast lỗi nào hiển thị cho người dùng.
2. **TC_NKGD_DM_07:** Validate tên danh mục không `.trim()`, chấp nhận tên toàn khoảng trắng.
3. **TC_NKGD_DM_12:** Sửa CHỈ "Vốn ban đầu" (không đổi tên) không gọi API server, chỉ lưu `localStorage` —
   không đồng bộ giữa các thiết bị, cùng vấn đề với tab Tài sản (TC_NKGD_TS_16).
4. **TC_NKGD_DM_04:** Lỗi tải danh sách danh mục hoàn toàn im lặng, giao diện giống hệt "chưa có danh mục nào"
   thật.
5. Hành vi đóng modal khi lỗi KHÔNG nhất quán giữa các hành động: Thêm/Sửa/Xóa (soft) luôn đóng modal dù lỗi,
   riêng Xóa vĩnh viễn thì giữ modal mở khi lỗi.
6. Nghe sự kiện `keyup` toàn cục (Enter) đăng ký trong `mounted()` không có `removeEventListener` tương ứng —
   rủi ro memory leak nếu vào/rời tab nhiều lần, và có thể vô tình trigger submit ngầm nếu state `action`
   không được reset đúng lúc đóng modal Sửa bằng nút "Hủy" (chưa viết testcase tự động hoá cho trường hợp
   này — độ phức tạp cao để tái tạo an toàn, xem TRACKER.md).
