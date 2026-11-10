# Màn hình: Phân tích cơ bản — Tab "BCTC gốc"

- **URL:** `/phan-tich-co-ban?mack=<mã>&tab=tin-tuc` (giá trị `tab` vẫn là `tin-tuc` như tab cũ).
- **Component (preprod):** `src/views/faAnalysis/NewsAndAnalysis/index.vue` (bộ lọc ngày + tự đo chiều cao bảng) →
  `NewsAndAnalysis/ReportRaw.vue` (bảng BCTC gốc, `GET /api/stocks/document/get-document?type=1&year=*&mack=`).
- **Môi trường test:** prev2 (https://prev2.vietpointer.vn, bản preprod mới nhất, gọi backend production). Đăng nhập qua
  `Prev2Session`, tài khoản `TEST_USER_*` / `FREE_USER_*`.
- **Thay thế:** tài liệu cũ `testcases/phan-tich-co-ban-bai-viet-phan-tich.md` (21 TC `TC_PTCB_BVPT_xx`, đã xoá).
  Trên preprod tab "Bài viết & Phân tích" đổi tên thành **"BCTC gốc"** và chỉ còn bảng BCTC gốc. Phần còn lại đã chuyển
  sang `/thong-tin-su-kien` (bộ test `testcases/thong-tin-su-kien.md`, không viết trùng ở đây):
  - Bài viết (`News.vue`);
  - Báo cáo phân tích (`ReportAnalysis.vue`);
  - 3 thẻ con Bản cáo bạch & BCTN / Nghị quyết / Báo cáo quản trị (type 3/4/5).
- **An toàn dữ liệu:** tab chỉ đọc, không có API ghi. Dữ liệu:
  - TC_02 và TC_12 đọc thật;
  - các test khác giả lập `get-document` bằng 20 BCTC cố định (5 năm 2022–2026 × 4 quý, thứ tự trộn), link PDF giả
    `files.example.invalid`, nên không tải file thật.
- **Mức xác nhận:** đã chạy pass trên **kfsp.vn** ngày 09/11/2026. kfsp.vn đã được xác minh là bản preprod mới nhất, deploy 06/11 lúc 10:30 GMT. Spec dùng `PREV2_BASE_URL=https://kfsp.vn` trong `.env`; backend là production, như mọi lần. Kết quả: 18/18 pass.
- **Code:** [tests/phan-tich-co-ban-bctc-goc.spec.ts](../tests/phan-tich-co-ban-bctc-goc.spec.ts), POM
  [pages/BctcGocPage.ts](../pages/BctcGocPage.ts).

## Quy ước trạng thái

✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm (hành vi đo được, nghi không đúng ý đồ)

---

## Nhóm: Tổng quan

# [TC_PTCB_BCTC_01] Thanh tab có "BCTC gốc" thay "Bài viết & Phân tích"

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** thay TC_PTCB_BVPT_01 (tab cũ hiện đồng thời Bài viết + Báo cáo phân tích + BCTC gốc).

## Các bước thực hiện
1. Đăng nhập, mở `/phan-tich-co-ban?mack=VNM&tab=tin-tuc`.

## Kết quả mong đợi
- [ ] Thanh tab PTCB có đúng 6 tab: Thông tin chung, Tài chính doanh nghiệp, 4M & CANSLIM, Biểu đồ, So sánh, BCTC gốc.
- [ ] Tab "BCTC gốc" đang chọn, không còn chữ "Bài viết & Phân tích".

---

# [TC_PTCB_BCTC_02] Giao diện tab (dữ liệu thật)

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** gộp TC_PTCB_BVPT_03 (bộ lọc ngày) + TC_PTCB_BVPT_12 (bảng BCTC gốc). Bỏ 4 thẻ con của bảng và khu
  "Bài viết", "Báo cáo phân tích".

## Kết quả mong đợi
- [ ] Bộ lọc: "Từ ngày:" và "Đến ngày:" (ô ngày, mặc định hôm nay), nút "Tìm kiếm".
- [ ] Bảng 3 cột: Mã CK, Tên tài liệu, File. Dòng đầu là BCTC của VNM.
- [ ] Không còn các thẻ con "Bản cáo bạch & BCTN", "Nghị quyết", "Báo cáo quản trị", cũng không còn khu "Báo cáo phân tích".

---

# [TC_PTCB_BCTC_03] Gọi API đúng 1 lần, type=1

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** thay TC_PTCB_BVPT_13 (bấm từng thẻ con gọi type 1/3/4/5). Nay chỉ còn type 1.

## Kết quả mong đợi
- [ ] Mở tab → đúng 1 request `get-document` với `type=1`, `year=*`, `mack=VNM`.

---

# [TC_PTCB_BCTC_04] Mặc định hiện mọi BCTC, sắp xếp mới nhất trước, 15 dòng/trang

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Chưa bấm "Tìm kiếm" thì không lọc gì.
- [ ] Thứ tự: năm giảm dần, trong cùng năm thì quý giảm dần (quý 4 → quý 1).
- [ ] Trang 1 có 15 dòng.

---

## Nhóm: Lọc theo ngày

# [TC_PTCB_BCTC_05] Lọc theo khoảng ngày (lọc theo NĂM)

- **Trạng thái:** ✅ Áp dụng
- **Ghi chú:** `ReportRaw` chỉ so sánh **năm** của BCTC với năm của Từ ngày / Đến ngày (`item.year >= from.year &&
  <= to.year`). Ngày/tháng cụ thể bị bỏ qua. Lọc ở trình duyệt, không gọi lại API.

## Các bước thực hiện
1. Từ ngày 15/06/2023, Đến ngày 01/02/2024, bấm "Tìm kiếm".

## Kết quả mong đợi
- [ ] Còn đúng 8 BCTC của năm 2024 và 2023 (kể cả quý 1/2023, nằm trước 15/06/2023), vẫn theo thứ tự mới nhất trước.
- [ ] Không có request `get-document` mới.

---

# [TC_PTCB_BCTC_06] Bộ lọc chỉ áp dụng khi bấm "Tìm kiếm"

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Đổi 2 ô ngày thành năm 2025 → bảng chưa đổi (15 dòng).
- [ ] Bấm "Tìm kiếm" → còn 4 BCTC năm 2025.

---

# [TC_PTCB_BCTC_07] Từ ngày = Đến ngày → không lọc

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** `ReportRaw` chỉ lọc khi `from_date != to_date`. Chọn đúng 1 ngày (vd 05/05/2024) thì bộ lọc bị bỏ
  qua và bảng hiện lại mọi năm. Người dùng chọn "1 ngày" sẽ thấy dữ liệu không liên quan. Cần dev xác nhận có cố ý
  không (mặc định cả 2 ô cùng là hôm nay nên có thể dùng điều kiện này để nhận biết "chưa lọc").

## Kết quả mong đợi (theo hành vi hiện tại)
- [ ] Lọc năm 2025 (4 dòng), rồi tìm 05/05/2024 → 05/05/2024 → bảng về 15 dòng như mặc định.

---

# [TC_PTCB_BCTC_08] Khoảng ngày không có BCTC → bảng trống

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Cập nhật:** thay TC_PTCB_BVPT_04.
- **Kết quả đo được:** khi rỗng bảng không có dòng chữ nào (`no-items-view` là một `<p>` trống), người dùng không biết
  là "không có dữ liệu" hay "đang tải".

## Kết quả mong đợi
- [ ] Tìm 2030 → 2031: 0 dòng, `tbody` không có chữ, thanh phân trang không hiện.

---

## Nhóm: Tệp & phân trang

# [TC_PTCB_BCTC_09] Bấm icon File mở link PDF ở tab mới

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PTCB_BVPT_14. Test thay `window.open` để bắt URL, không tải file thật.

## Kết quả mong đợi
- [ ] Bấm icon File ở dòng 2 → `window.open` được gọi đúng 1 lần với link PDF của BCTC quý 3/2026.

---

# [TC_PTCB_BCTC_10] Phân trang

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PTCB_BVPT_15.

## Kết quả mong đợi
- [ ] 20 BCTC → hiện thanh phân trang (class `custom-pagination`).
- [ ] Bấm trang 2 → 5 dòng còn lại (năm 2022).

---

# [TC_PTCB_BCTC_11] Bảng cao kín tới đáy màn hình

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `NewsAndAnalysis/index.vue` → `doChieuCao()`: chiều cao khung cuộn = `max(240, innerHeight − mép trên −
  66px)` (chừa thanh phân trang + lề đáy), đo lại khi đổi cỡ cửa sổ. Trước đây khung cố định nửa màn hình.

## Kết quả mong đợi
- [ ] Ở 1600×900 và sau khi đổi sang 1600×1100, chiều cao `.table-responsive` khớp công thức trên (sai số < 2px).

---

## Nhóm: Đổi mã / lỗi / tải chậm

# [TC_PTCB_BCTC_12] Đổi mã CK → tải lại theo mã mới

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PTCB_BVPT_16 (cũ tải lại cả 3 khu, nay chỉ 1 bảng).

## Kết quả mong đợi
- [ ] Chọn FPT ở ô tìm mã của PTCB → có request `get-document` với `mack=FPT`, dòng đầu bảng là FPT.

---

# [TC_PTCB_BCTC_13] Lỗi 500 / mất mạng không crash

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PTCB_BVPT_18.

## Kết quả mong đợi
- [ ] `get-document` trả 500 hoặc bị huỷ → bảng trống, không toast, không lỗi JS (`pageerror`).

---

# [TC_PTCB_BCTC_14] Tải chậm không có trạng thái đang tải

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Cập nhật:** thay TC_PTCB_BVPT_17. `is_loading` vẫn không được dùng trong template.

## Kết quả mong đợi (theo hành vi hiện tại)
- [ ] API chậm 12 giây → bảng trống, không spinner, rồi hiện 15 dòng khi có dữ liệu.

---

# [TC_PTCB_BCTC_15] 🐞 Lỗi JS "reading 'classList'" mỗi lần mở tab

- **Trạng thái:** 🆕 Testcase mới (bug đo được)
- **Kết quả đo được:** console báo `TypeError: Cannot read properties of null (reading 'classList')` ngay khi mở tab.
- **Nguyên nhân:** watcher `list_document_computed` trong `ReportRaw.vue` có `immediate: true`, nên chạy lúc `created()`
  khi bảng chưa được vẽ. `document.querySelector('.report-raw nav[aria-label="pagination"]')` trả `null`, rồi
  `paginationNav.classList.remove(...)` ném lỗi. Bảng vẫn hiện bình thường sau đó (Vue nuốt lỗi watcher).
  Cùng kiểu lỗi với Watchlist rỗng (TC_WATCHLIST_19).

## Kết quả mong đợi (theo hành vi hiện tại)
- [ ] Bảng hiện đủ dữ liệu, console có lỗi `reading 'classList'`.

---

## Nhóm: Phân quyền & hiển thị

# [TC_PTCB_BCTC_16] Tài khoản Free bị khoá tab

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PTCB_BVPT_19. Feature `fa_tai_lieu`. Khoá đúng là `ProtectedView`, hiện ảnh `.blurred-image`.

## Kết quả mong đợi
- [ ] Free → `.faAnalysis-page .blurred-image` hiện, không có bảng, không có nút "Tìm kiếm", không gọi `get-document`.

---

# [TC_PTCB_BCTC_17] Chế độ tối

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PTCB_BVPT_20.

## Kết quả mong đợi
- [ ] Bật chế độ tối (công tắc trên header) → `.c-app` có `c-dark-theme`, bảng vẫn 15 dòng, không lỗi JS.

---

# [TC_PTCB_BCTC_18] Màn hình hẹp

- **Trạng thái:** ✅ Áp dụng
- **Cập nhật:** thay TC_PTCB_BVPT_21 (không còn 2 cột để xếp dọc).

## Kết quả mong đợi
- [ ] Ở 375×812 và 768×1024, nút "Tìm kiếm" và bảng vẫn hiện. Lọc năm 2025 vẫn còn đúng 4 dòng.

---

## Tổng hợp trạng thái (18 testcase)

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 11 | 02, 04, 05, 06, 09, 10, 12, 13, 16, 17, 18 |
| 🆕 Testcase mới | 3 | 01, 03, 11 |
| 🆕 Bug đo được | 1 | 15 |
| ⚠️ Cần xác nhận thêm | 3 | 07, 08, 14 |

Không có `test.fixme`.

**TC cũ đã bỏ (không còn trên UI):**
- TC_PTCB_BVPT_02: thẻ con "Sự kiện" là dead code.
- TC_PTCB_BVPT_05 đến 08: khu Bài viết.
- TC_PTCB_BVPT_09 đến 11: khu Báo cáo phân tích.

Các nội dung này đã chuyển sang `/thong-tin-su-kien` và đã có test ở `testcases/thong-tin-su-kien.md`.

## Phát hiện đáng chú ý

1. 🐞 **TC_15:** lỗi JS `reading 'classList'` mỗi lần mở tab (watcher `immediate` chạy trước khi bảng được vẽ).
2. ⚠️ **TC_07:** chọn Từ ngày = Đến ngày thì bộ lọc bị bỏ qua.
3. ⚠️ **TC_05:** lọc theo năm, không theo ngày: chọn 15/06/2023 vẫn ra BCTC quý 1/2023.
4. ⚠️ **TC_08, TC_14:** bảng rỗng không có chữ báo, đang tải không có spinner, hai trạng thái trông giống hệt nhau.
