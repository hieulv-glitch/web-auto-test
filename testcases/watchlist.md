# Màn hình: Watchlist (Danh mục theo dõi)

- **URL:** `/watchlist` (cần đăng nhập — `meta.requiresUser`; chưa đăng nhập bị chuyển sang `/login`).
- **Component (preprod):** `src/views/watchlist/WatchListPage.vue` (2 cột chia theo TỈ LỆ %, kéo được) →
  - `components/WatchListHeader.vue`: ô chọn watchlist + nút **"Thêm mã"** (thay ô "Chọn mã CK" cũ);
  - `components/WatchListLeft.vue`: 9 tab cột + bảng;
  - `components/WatchListRight.vue`: thanh dọc Ghi chú/Bài viết, nhớ thẻ đang mở;
  - `ManagerWatchListModal.vue` → `CreateUpdateWatchListModal.vue`.
- **Môi trường test:** prev2 (https://prev2.vietpointer.vn, bản preprod mới nhất, gọi **backend production**). Đăng nhập
  qua `Prev2Session` bằng `TEST_USER_*` (trả phí) / `FREE_USER_*` (miễn phí).
- **Nguồn:** Nhánh B (cập nhật) của skill `gen-web-testcase` ngày 09/11/2026, dựa trên tài liệu cũ (19/08/2026) + đọc lại
  source `origin/preprod` + DOM thật. Không đọc lại Google Sheet.
- **Mức xác nhận:** đã chạy pass trên **kfsp.vn** ngày 09/11/2026. kfsp.vn đã được xác minh là bản preprod mới nhất, deploy 06/11 lúc 10:30 GMT. Spec dùng `PREV2_BASE_URL=https://kfsp.vn` trong `.env`; backend là production, như mọi lần. Kết quả: 58 pass + 1 fixme (TC_49). TC_16 nay giả lập ô website vì dữ liệu thật của FPT không còn website.

## ⚠️ Đọc trước khi dùng tài liệu này

1. **Toast thành công đã tắt toàn app** từ 12/10/2026 (`main.js`: `Vue.prototype.$toast.success = () => {}`). Các thao
   tác sau thành công thì **không hiện gì**, test chỉ kiểm tra trạng thái:
   - thêm/xoá mã;
   - tạo/sửa/xoá watchlist.

   Toast lỗi vẫn còn.
2. **Dữ liệu watchlist là giả** (`FakeWatchlistServer` trong [pages/WatchlistPage.ts](../pages/WatchlistPage.ts)). Tài
   khoản test là tài khoản thật dùng chung và danh sách watchlist thật thay đổi liên tục. Bộ mặc định:
   - "Auto A": FPT, VNM, HPG;
   - "Auto B": ACB, MBB;
   - "Auto Rỗng": 0 mã.

   Máy chủ giả trả danh mục, mã của từng watchlist, và xử lý thêm/xoá mã, tạo/sửa/xoá/sắp xếp watchlist. Dữ liệu thị
   trường của từng mã vẫn đọc thật:
   - giá qua socket;
   - `canslim-fourm/by-mack`, `count-stock-by-mack`;
   - `/api/filter` (hỏi `watchlistId=all` rồi lọc theo mã của danh sách giả);
   - Bài viết `news-related-by-mack`;
   - danh mục "Nhật ký GD" / "Khác" thật.
3. **Lưới an toàn:** mọi request không phải GET tới `*.kfsp.vn/api/` mà không có route giả lập đều bị huỷ. `afterEach`
   kiểm tra danh sách bị huỷ rỗng, tức không request ghi nào lọt ra máy chủ thật. Dữ liệu thị trường realtime không
   được assert giá trị cụ thể.
4. API đã chuyển sang NestJS (`$apiAdressNest`). `canslim-fourm/by-mack` và `count-stock-by-mack` đổi từ GET sang POST,
   nhưng vẫn chỉ đọc.

## Quy ước trạng thái

✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm (hành vi đo được, nghi không đúng ý đồ)

---

## Nhóm A: Truy cập & bố cục

# [TC_WATCHLIST_01] Chặn truy cập khi chưa đăng nhập

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Chưa đăng nhập vào `/watchlist` → bị chuyển sang `/login`.

---

# [TC_WATCHLIST_02] Tổng quan màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** ô "Chọn mã CK" thay bằng nút "Thêm mã". Cột phải là thanh dọc 2 thẻ.

## Kết quả mong đợi
- [ ] Trái:
  - ô chọn watchlist (tên "Auto A");
  - nút "Thêm mã", không còn ô "Chọn mã CK";
  - 9 tab;
  - bảng có FPT, VNM, HPG.
- [ ] Phải:
  - thẻ "Ghi chú" (đang mở) + "Bài viết";
  - nút "Thêm ghi chú mới".
- [ ] Cột trái chiếm 70% bề ngang khung.

---

# [TC_WATCHLIST_03] Kéo thanh chia cột trong giới hạn 50%–72%

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật (09/11):** bề rộng tính theo tỉ lệ % (trước là pixel). Kéo vượt giới hạn thì giữ nguyên
  (`MIN_LEFT_RATIO 0.5`, `MIN_RIGHT_RATIO 0.28`).

## Kết quả mong đợi
- [ ] Kéo tới 60% → cột trái ≈ 60%.
- [ ] Kéo tới 30% → cột trái không dưới 50%.
- [ ] Kéo tới 95% → cột trái không quá 72%.

---

# [TC_WATCHLIST_04] Tỷ lệ đã kéo không được lưu khi rời trang

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Kéo về 55%, sang `/dashboard` rồi quay lại → cột trái về 70%.

---

# [TC_WATCHLIST_05] Nút "Đặt lại bố cục mặc định"

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật (09/11):** nút giờ là `role="button"` + `aria-label` (trước là `title`). Bấm khi cột phải đang đóng thì mở
  lại thẻ Ghi chú (xem TC_57).

## Kết quả mong đợi
- [ ] Kéo về 55% → bấm nút → 2 cột về 70/30, thẻ Ghi chú đang mở.

---

# [TC_WATCHLIST_06] Màn hình hẹp (< 768px)

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Ở 375×812:
  - thanh chia cột ẩn;
  - cột phải nằm dưới cột trái;
  - cột trái cao tối đa 40vh.

---

# [TC_WATCHLIST_07] Nút Back trình duyệt rời trang

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Mở modal Quản lý Watchlist, bấm Back → rời `/watchlist` (không chỉ đóng modal). Ghi nhận là điểm UX.

---

## Nhóm B: Chọn & chuyển watchlist

# [TC_WATCHLIST_08] Dropdown chọn watchlist

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Bấm ô chọn → menu có:
  - 3 nhóm "Watchlist / Nhật ký GD / Khác", "Watchlist" đang chọn;
  - danh sách Auto A / Auto B / Auto Rỗng, dấu ✓ ở mục đang chọn;
  - link "Quản lý watchlist".

---

# [TC_WATCHLIST_09] Tài khoản Free chỉ có nhóm Watchlist

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** trước là ⚠️ (chưa có tài khoản Free đăng nhập được). Nay đã tự động hoá bằng `FREE_USER_*`.

## Kết quả mong đợi
- [ ] Free: không có thanh 3 nhóm, vẫn thấy danh sách watchlist, không có "Quản lý watchlist".

---

# [TC_WATCHLIST_10] Chọn watchlist khác

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Chọn "Auto B" → tên đổi, dropdown đóng, bảng còn ACB, MBB.

---

# [TC_WATCHLIST_11] "Quản lý watchlist" chỉ ở nhóm Watchlist

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Ở nhóm "Nhật ký GD" / "Khác" không có link. Về nhóm "Watchlist" → bấm link → mở modal Quản lý Watchlist.

---

## Nhóm C: Bảng dữ liệu

# [TC_WATCHLIST_12] 9 tab bảng

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Đủ 9 tab theo đúng thứ tự, "Tổng quát" đang chọn: Tổng quát, Thông tin chung, Định giá, Cơ bản, Biến động giá, Phạm
  vi giá, Thanh khoản, Chỉ báo kỹ thuật, KFSP.

---

# [TC_WATCHLIST_13] Chuyển tab đổi bộ cột

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Sang "Định giá" → hết cột "Điểm Canslim", URL vẫn `/watchlist`, danh sách mã giữ nguyên.

---

# [TC_WATCHLIST_14] Sắp xếp theo cột "Mã CK"

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** assert thứ tự thật nhờ dữ liệu cố định (trước chỉ kiểm tra "không lỗi").

## Kết quả mong đợi
- [ ] Bấm lần 1 → FPT, HPG, VNM.
- [ ] Bấm lần 2 → VNM, HPG, FPT.

---

# [TC_WATCHLIST_15] Bấm mã CK mở modal biểu đồ

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Bấm "VNM" → mở modal biểu đồ dùng chung.

---

# [TC_WATCHLIST_16] Cột "Website" (tab Thông tin chung)

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật (09/11):** trước là `fixme` (chưa rõ cột ở tab nào). Nay đã xác định nằm ở tab "Thông tin chung".

- **Ghi chú (09/11, chạy trên kfsp.vn):** dữ liệu thật của FPT lúc chạy không có website → test giả lập ô `website`
  của `/api/filter` cho cả 3 nhánh của `checkURL()`.

## Kết quả mong đợi
- [ ] Mỗi dòng có link "Truy cập >" mở tab mới (`target="_blank"`).
- [ ] `fpt.com.vn` (thiếu giao thức) → `href="http://fpt.com.vn"`.
- [ ] `https://www.vinamilk.com.vn` → giữ nguyên.
- [ ] Website rỗng/null → link "Truy cập >" **vẫn hiện** với `href=""` (bấm vào mở lại chính trang ở tab mới).
  Đây là điểm trải nghiệm nhỏ: nên ẩn link hoặc hiện "—" khi không có website.

---

# [TC_WATCHLIST_17] `/api/filter` lỗi → bảng vẫn hiện mã

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] `/api/filter` trả 500:
  - bảng vẫn có FPT, VNM, HPG;
  - toast "Có lỗi xảy ra. Vui lòng thử lại sau!";
  - không lỗi JS.

---

# [TC_WATCHLIST_58] Watchlist trên 14 mã có phân trang

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Watchlist 16 mã:
  - trang 1 có 14 dòng;
  - thanh phân trang `custom-pagination`;
  - trang 2 có 2 mã còn lại.

---

# [TC_WATCHLIST_59] Dòng tiêu đề bảng dính khi cuộn

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `thead th { position: sticky }` + mở `overflow` của 2 khung bọc (commit 10/2026).

## Kết quả mong đợi
- [ ] Cửa sổ thấp 600px, watchlist 16 mã, cuộn khung bảng 300px → tiêu đề "Mã CK" giữ nguyên vị trí (lệch < 2px).

---

# [TC_WATCHLIST_60] Điểm Canslim / 4M dạng viên màu

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `ScorePill` thay `StrengthBar`. Mức màu:
  - < 40 `weak` (đỏ);
  - < 60 `medium` (cam);
  - < 80 `good` (xanh nhạt);
  - ≥ 80 `strong` (xanh đậm).

## Kết quả mong đợi
- [ ] Dòng FPT có 2 viên `.score-pill`, class mức màu đúng với điểm.

---

## Nhóm D: Xoá mã

# [TC_WATCHLIST_21] Icon Xoá → modal xác nhận

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Bấm icon Xoá dòng VNM:
  - modal "Xóa dữ liệu" hiện "Bạn có chắc chắn không?" với nút "Đóng" / "Xóa";
  - chưa gửi DELETE.

---

# [TC_WATCHLIST_22] "Đóng" không xoá

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Bấm "Đóng" → modal đóng, VNM vẫn còn, không gửi DELETE.

---

# [TC_WATCHLIST_23] Xác nhận xoá mã

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** bỏ toast "Xóa dữ liệu thành công" (đã tắt toàn app).

## Kết quả mong đợi
- [ ] Bấm "Xóa":
  - gửi đúng 1 `DELETE /api/watchlist/:id`;
  - modal đóng;
  - bảng còn FPT, HPG;
  - không có toast thành công.

---

# [TC_WATCHLIST_24] Xoá mã lỗi máy chủ

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] DELETE trả 500 → toast "Có lỗi xảy ra, vui lòng thử lại", VNM vẫn còn.

---

## Nhóm E: Thêm mã (nút "Thêm mã")

# [TC_WATCHLIST_25] Gõ chuỗi không khớp mã nào

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** trước là ⚠️/fixme ("Mã CK không hợp lệ!" không tái tạo được). Hộp nhập `SingleSelectBase` chỉ
  cho chọn gợi ý, nên nhánh "Mã CK không hợp lệ!" của `addNewWatchlist` không đến được bằng UI. Testcase đổi sang kiểm
  tra hành vi thật.

## Kết quả mong đợi
- [ ] Gõ "ZZZZQ":
  - hiện "Không có dữ liệu";
  - Enter không gửi POST;
  - không toast.

---

# [TC_WATCHLIST_26] Thêm mã hợp lệ

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):**
  - thao tác qua hộp "Thêm mã";
  - toast thành công cũ "Thêm vào watchlist thành công" (nay là "Đã thêm X vào <watchlist>") không còn hiện vì toast
    thành công đã tắt.

## Kết quả mong đợi
- [ ] Chọn ACB:
  - đúng 1 POST `/api/watchlist` `{mack: "ACB", my_watchlist_id: <id Auto A>}`;
  - bảng thêm ACB ở cuối;
  - không có toast thành công.

---

# [TC_WATCHLIST_27] Thêm mã đã có

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** câu toast đổi thành "<MÃ> đã có trong <watchlist>".

## Kết quả mong đợi
- [ ] Chọn FPT → toast lỗi **"FPT đã có trong Auto A"**, bảng không đổi.

---

# [TC_WATCHLIST_28] Thêm mã lỗi máy chủ

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] POST trả 500 → toast "Có lỗi xảy ra, vui lòng thử lại", bảng không đổi.

---

# [TC_WATCHLIST_29] Vòng đời: tạo → chọn → thêm mã → xoá watchlist

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** trước chạy trên **dữ liệu thật** (tạo watchlist `[TEST-AUTOMATION]` rồi dọn dẹp). Nay prev2 ghi
  thẳng vào production nên chuyển hoàn toàn sang máy chủ giả.

## Kết quả mong đợi
- [ ] Tạo "Auto Mới" → có trong modal.
- [ ] Chọn "Auto Mới" → bảng "No items".
- [ ] Thêm ACB → bảng có ACB.
- [ ] Xoá "Auto Mới" → biến mất, danh sách giả về như ban đầu.

---

# [TC_WATCHLIST_50] Hộp "Thêm mã": mở / đóng

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Bấm "Thêm mã":
  - hộp "Thêm mã vào Auto A" mở;
  - ô "Nhập mã hoặc tên công ty" được focus;
  - `aria-expanded="true"`.
- [ ] Bấm lại nút → đóng (`aria-expanded="false"`).
- [ ] Mở lại rồi bấm ra ngoài → đóng.

---

# [TC_WATCHLIST_51] Esc đóng hộp "Thêm mã"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Gõ "FP", nhấn Esc → hộp đóng. Mở lại → ô trống.

---

# [TC_WATCHLIST_52] Gợi ý trong hộp "Thêm mã"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Gõ "ngân hàng" → sau 300ms (debounce) có đúng 5 gợi ý dạng "MÃ - Tên công ty", tên đều chứa "ngân hàng".
- [ ] Gõ "VNM" → có gợi ý VNM.

---

# [TC_WATCHLIST_53] Thêm xong hộp vẫn mở để thêm tiếp

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Thêm ACB → hộp vẫn mở, ô trống.
- [ ] Thêm tiếp MBB → bảng có FPT, VNM, HPG, ACB, MBB.

---

# [TC_WATCHLIST_54] Đổi watchlist khi hộp đang mở

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Hộp đang mở, chọn "Auto B" → hộp đóng. Mở lại → tiêu đề "Thêm mã vào Auto B".

---

# [TC_WATCHLIST_55] Danh mục chỉ đọc (Nhật ký GD / Khác)

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Chọn danh mục đầu tiên của nhóm "Nhật ký GD", rồi của nhóm "Khác" (dữ liệu thật): không có nút "Thêm mã", bảng có
  dữ liệu nhưng không có icon Xoá.

---

## Nhóm F: Modal "Quản lý Watchlist"

# [TC_WATCHLIST_30] Giao diện modal Quản lý

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** bỏ checkbox "Nhận tất cả thông báo (Dành cho Moderator)" (cài đặt thông báo đã chuyển về Trung
  tâm thông báo, commit 07/10/2026).

## Kết quả mong đợi
- [ ] Có:
  - tiêu đề "Quản lý Watchlist";
  - nút "Thêm watchlist" và ×;
  - 3 dòng, mỗi dòng có ☰, Sửa, Xoá.
- [ ] Không có checkbox nào.

---

# [TC_WATCHLIST_32] Kéo-thả sắp xếp

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** đã tự động hoá thật bằng `dragTo`.

## Kết quả mong đợi
- [ ] Kéo "Auto A" xuống dưới "Auto B":
  - gửi đúng 1 lần `POST /api/sort-my-watchlist` (debounce 300ms);
  - `my_watchlist_sorted` theo thứ tự Auto B, Auto A, Auto Rỗng.

---

# [TC_WATCHLIST_33] Sửa tên watchlist

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** bỏ toast thành công.

## Kết quả mong đợi
- [ ] Sửa "Auto B" thành "Auto B2", Lưu:
  - đúng 1 PUT `{name: "Auto B2"}`;
  - modal có "Auto B2";
  - không có toast thành công.

---

# [TC_WATCHLIST_34] Xoá watchlist

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** bỏ toast thành công.

## Kết quả mong đợi
- [ ] Bấm Xoá "Auto B":
  - hiện modal "Những mã thuộc Watchlist này sẽ bị xóa hết…";
  - bấm Xóa → đúng 1 DELETE, mục biến mất.

---

# [TC_WATCHLIST_35] Sửa / xoá watchlist lỗi máy chủ

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] PUT trả 500 → toast "Có lỗi xảy ra, vui lòng thử lại sau", modal Sửa vẫn mở.
- [ ] DELETE trả 500 → toast "Đã có lỗi xảy ra, vui lòng thử lại sau", "Auto B" vẫn còn.

---

## Nhóm G: Modal Tạo/Sửa watchlist

# [TC_WATCHLIST_36] Modal "Thêm mới Watchlist"

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** bỏ checkbox "Nhận tín hiệu Mua/Bán" (đã chuyển về Trung tâm thông báo; khi sửa, web vẫn gửi lại
  `receive_signal` đang có).

## Kết quả mong đợi
- [ ] Tiêu đề "Thêm mới Watchlist", nhãn "Tên Watchlist", ô trống, nút Hủy / Lưu, không có checkbox.

---

# [TC_WATCHLIST_37] Lưu khi tên trống

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Toast "Tên Watchlist không được để trống", ô có `is-invalid`, modal giữ nguyên, không gửi POST.

---

# [TC_WATCHLIST_38] Tạo watchlist (lỗi rồi thành công)

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** bỏ toast thành công. Body gửi đi có `receive_signal: false`.

## Kết quả mong đợi
- [ ] Lần đầu POST trả 500 → toast "Có lỗi xảy ra, vui lòng thử lại sau", modal vẫn mở.
- [ ] Lưu lại → modal đóng, "Auto Tạo" có trong danh sách.

---

# [TC_WATCHLIST_39] "Hủy" đóng modal không lưu

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Gõ tên, bấm Hủy → modal đóng, không gửi POST, không có mục mới.

---

# [TC_WATCHLIST_40] Mở ở chế độ Sửa

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Tiêu đề "Cập nhật Watchlist", ô tên điền sẵn "Auto A".

---

## Nhóm H: Cột phải — Ghi chú & Bài viết

# [TC_WATCHLIST_41] Icon "Xem ghi chú" lọc ghi chú theo mã

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** bộ lọc "Mã CK:" giờ là ô nhiều thẻ (`MultiSelectBase`). Bấm icon tự mở cột phải nếu đang đóng.

## Kết quả mong đợi
- [ ] Cột phải đang đóng, bấm "Xem ghi chú" dòng VNM:
  - thẻ Ghi chú mở;
  - bộ lọc mở sẵn, ô "Mã CK:" có thẻ "VNM";
  - gửi `GET /api/user-note?…macks[]=VNM`;
  - cột trái về 70%.

---

# [TC_WATCHLIST_42] Không có ghi chú nào

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** giả lập `user-note` trả rỗng nên assert chắc chắn (trước chỉ kiểm tra "không crash").

## Kết quả mong đợi
- [ ] Hiện tiêu đề "Không có ghi chú nào".

---

# [TC_WATCHLIST_43] Thẻ "Bài viết"

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Bấm "Bài viết" → thẻ mở, có danh sách tin (link) của các mã trong watchlist đang chọn (`POST
  news-related-by-mack`, chỉ đọc).

---

# [TC_WATCHLIST_44] Bấm lại thẻ đang mở → đóng cột phải

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Không thẻ nào active, thanh chia cột ẩn, cột trái > 95%.

---

# [TC_WATCHLIST_45] Nút "Thêm ghi chú mới"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Nút hiển thị ở thẻ Ghi chú. Không bấm lưu ghi chú (ghi thật vào production).

---

# [TC_WATCHLIST_56] Nhớ watchlist đã chọn

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** khoá localStorage `watchlist_selected_option_<user_id>`, nhớ riêng theo tài khoản.

## Kết quả mong đợi
- [ ] Chọn "Auto B" → khoá lưu `watchlist_<id>`. Tải lại trang → mở thẳng "Auto B" (ACB, MBB).

---

# [TC_WATCHLIST_57] Nhớ trạng thái đóng của cột phải

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** localStorage `watchlist_right_tab` (`0`/`1`/`closed`).

## Kết quả mong đợi
- [ ] Đóng cột phải → lưu `closed`. Tải lại → cột phải vẫn đóng, không có thanh chia cột.
- [ ] Bấm "Đặt lại bố cục" → thẻ Ghi chú mở lại, 70/30, lưu `0`.

---

## Nhóm I: Tài khoản Free

# [TC_WATCHLIST_46] Free — cột điểm hiện "--"

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật (09/11):** trước là ⚠️ (chưa có tài khoản Free). Nay đã tự động hoá.

## Kết quả mong đợi
- [ ] Dòng FPT: "Điểm Canslim", "Điểm 4M", "Tiềm năng giá (KFSP AI)" đều "--", không có viên điểm.

---

# [TC_WATCHLIST_61] Free — thẻ Ghi chú yêu cầu nâng cấp

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Hiện "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này" + "Nâng cấp ngay", không có nút "Thêm ghi chú mới".

---

## Nhóm J: Khác

# [TC_WATCHLIST_49] Giá tự cập nhật qua socket

- **Trạng thái:** 🆕 Testcase mới — `test.fixme`
- **Ghi chú:** phụ thuộc phiên giao dịch thật, không assert ổn định được.

---

## Tổng hợp trạng thái

Tự động hoá: [tests/watchlist.spec.ts](../tests/watchlist.spec.ts), POM [pages/WatchlistPage.ts](../pages/WatchlistPage.ts).

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 33 | 01, 02, 06, 08, 09, 10, 12, 13, 14, 15, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 46 |
| 🆕 Testcase mới | 22 | 03, 04, 05, 07, 11, 16, 40, 44, 45, 49, 50–61 |

Tổng 55 testcase. TC_31 đã xoá (checkbox Moderator không còn). Có 54 test tự động, 1 `fixme` (TC_49).

**Cập nhật 10/11/2026:** xoá TC_WATCHLIST_18, TC_WATCHLIST_19, TC_WATCHLIST_20, TC_WATCHLIST_47, TC_WATCHLIST_48 (bug được user chấp nhận) — tổng 60 → 55.

**Thay đổi so với bản 19/08/2026:**
- Xoá TC_31.
- Sửa TC_02, 03, 05, 09, 14, 16, 19, 20, 23, 25–30, 32–34, 36, 38, 41, 42, 46, 48.
- Thêm TC_50 đến TC_61.
- Chuyển từ kfsp.vn/localhost sang prev2.
- Bỏ thao tác ghi thật (TC_29 cũ tạo watchlist thật).

## 🐞 Phát hiện đáng chú ý

1. **Toast thành công đã tắt toàn app** (`main.js`, 12/10/2026). Mọi spec cũ khác đang chờ toast "…thành công" sẽ fail
   khi chạy trên preprod.
