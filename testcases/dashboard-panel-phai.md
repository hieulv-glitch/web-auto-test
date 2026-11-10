# Màn hình: Dashboard — Panel phải (IBD / Watchlist / Ghi chú)

- **URL:** `/dashboard` (cùng route với [dashboard.md](dashboard.md), tài liệu này đào sâu nội dung 5 tab của
  panel phải mà tài liệu khung/shell chỉ test việc chuyển đổi giữa các tab, không đi vào nội dung bên trong).
- **Component:** [board/tabs/IBD.vue](../../stocks/src/views/dashboard/board/tabs/IBD.vue) +
  [board/tabs/Watchlist.vue](../../stocks/src/views/dashboard/board/tabs/Watchlist.vue) (**khác hẳn**
  `views/watchlist/WatchListPage.vue` đã có ở [watchlist.md](watchlist.md) — đây là widget rút gọn riêng cho
  Dashboard) + [board/tabs/NoteV2.vue](../../stocks/src/views/dashboard/board/tabs/NoteV2.vue).
- **Domain test:** https://kfsp.vn/dashboard (qua `PREV2_BASE_URL` + `Prev2Session`; production = preprod mới nhất từ 06/11/2026)
- **Cập nhật 09/11/2026 (nhánh B):** preprod gỡ tab "Cảnh báo" và "Cộng đồng" khỏi cột phải ở mọi màn (12/10/2026,
  commit 4346c85dd; `Alert.vue`, `Social.vue`, `PostItem.vue` đã xoá khỏi code) → **xoá TC_DASHBOARD_PP_09–12 (Cảnh
  báo) và PP_16–19 (Cộng đồng)**, giữ nguyên số của các TC còn lại. Tab Watchlist/Ghi chú giờ là component dùng
  chung với thanh bên phải của /do-thi, /bang-gia, /bo-loc, /nganh, /suc-manh-dong-tien. Thêm PP_20 (tài khoản Free).
- **Nguồn testcase gốc (app):** Không áp dụng — app không có khái niệm panel bên cạnh Dashboard như thế này.
  Toàn bộ 🆕.
- **Phương pháp sinh:** Đọc source code + kiểm kê độc lập bằng Playwright thật.
- **Quy ước trạng thái:** 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.
- **Nguyên tắc phạm vi:** Vì Watchlist-panel và Cộng đồng-panel dùng lại phần lớn logic/component đã có testcase
  chi tiết riêng ([watchlist.md](watchlist.md) cho trang chuẩn, [cong-dong.md](cong-dong.md) cho feed cộng
  đồng), tài liệu này **không lặp lại** các luồng CRUD/tương tác đã verify ở đó — chỉ test phần khung UI đặc thù
  của panel (dropdown, tab, mở/đóng modal, khác biệt so với bản đầy đủ).

- **Xác minh trên UI thật (09/11/2026):** chạy trên **https://kfsp.vn** (biến `PREV2_BASE_URL` trong `.env`; production đã là
  bản preprod mới nhất, deploy 06/11/2026 10:30 GMT) — 4 spec Dashboard pass 2 lần liên tiếp (`--workers=2`). Trước đó prev2
  bị deploy đè bằng nhánh `feat/ibd_tobao` lúc 07:40 GMT nên không dùng làm môi trường xác nhận.
---

## Nhóm: IBD (panel mặc định)

# [TC_DASHBOARD_PP_01] Hiển thị 3 sub-tab của IBD

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát panel phải ở trạng thái mặc định (tab "IBD").

## Kết quả mong đợi
- [ ] Hiển thị 3 sub-tab: "Nhịp đập TT" (active mặc định), "Nỗ lực kết quả", "Sức khỏe TT".
- [ ] Nội dung mặc định hiển thị "Tổng quan thị trường" (MA10/MA20/MA50, Tâm lý, Rủi ro, nhận định xu hướng,
      "Ngày phân phối").

---

# [TC_DASHBOARD_PP_02] Chuyển sub-tab IBD

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click "Nỗ lực kết quả" → đổi nội dung sang bảng % thay đổi theo ngành kèm dropdown "1
  ngày"/"Ngành". Click "Sức khỏe TT" → đổi nội dung khác tương ứng. Cả 2 sub-tab đều hiển thị đúng, không lỗi.

## Các bước thực hiện
1. Click lần lượt "Nỗ lực kết quả", "Sức khỏe TT", rồi quay lại "Nhịp đập TT".

## Kết quả mong đợi
- [ ] Mỗi lần click, sub-tab được chọn chuyển active, nội dung đổi đúng loại dữ liệu tương ứng.

---

## Nhóm: Watchlist (panel phải — khác `/watchlist`)

# [TC_DASHBOARD_PP_03] Hiển thị header Watchlist mặc định

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Chuyển sang tab dọc "Watchlist".

## Kết quả mong đợi
- [ ] Hiển thị dropdown tên watchlist đang chọn (mặc định watchlist đầu tiên của tài khoản), nút "Tạo mới".
- [ ] Bên dưới có 2 sub-tab "Danh sách" / "Bài viết liên quan", mặc định ở "Danh sách".
- [ ] Danh sách hiển thị tổng số mã + thống kê tăng/giảm/đứng giá (thanh progress bar), từng mã kèm ngành, giá,
      % thay đổi.

---

# [TC_DASHBOARD_PP_04] Mở dropdown chọn watchlist

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click vào dropdown tên watchlist đang chọn.

## Kết quả mong đợi
- [ ] Mở dropdown gồm 3 tab loại ("Watchlist"/"Nhật ký GD"/"Khác") + danh sách watchlist theo loại đang chọn +
      nút "Đóng" ở cuối.
- [ ] Watchlist đang chọn được highlight trong danh sách.

---

# [TC_DASHBOARD_PP_05] Chọn 1 watchlist khác trong dropdown

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Mở dropdown watchlist.
2. Click chọn 1 watchlist khác trong danh sách.

## Kết quả mong đợi
- [ ] Dropdown đóng lại, tên watchlist ở header đổi đúng, danh sách mã bên dưới cập nhật theo watchlist mới
      chọn.

---

# [TC_DASHBOARD_PP_06] Chuyển sub-tab "Bài viết liên quan"

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click sub-tab "Bài viết liên quan".

## Kết quả mong đợi
- [ ] Hiển thị danh sách bài viết liên quan tới các mã trong watchlist đang chọn (tiêu đề, thời gian, badge
      "Mới" nếu bài đăng gần đây), hoặc trạng thái rỗng nếu watchlist không có mã/không có bài liên quan.

---

# [TC_DASHBOARD_PP_07] Mở modal "Thêm mới Watchlist"

- **Trạng thái:** 🆕 — **Đã verify bằng automation, phát hiện hành vi Escape**
- **Kết quả đo được:** Click "Tạo mới" → mở modal "Thêm mới Watchlist" (input "Nhập tên Watchlist" + nút "Thêm
  mới"). Nhấn phím **Escape KHÔNG đóng được modal** (CModal của CoreUI ở đây không bind sự kiện đóng qua phím
  Escape) — phải đóng bằng icon "×" ở góc phải tiêu đề modal.

## Các bước thực hiện
1. Click nút "Tạo mới" cạnh dropdown watchlist.
2. Thử nhấn Escape.
3. Click icon "×" trên modal.

## Kết quả mong đợi
- [ ] Modal mở đúng với input + nút "Thêm mới".
- [ ] Escape không có tác dụng đóng modal (ghi nhận, không phải bug chặn luồng — vẫn đóng được bằng "×").
- [ ] Click "×" đóng modal thành công, không tạo watchlist mới nào.

---

# [TC_DASHBOARD_PP_08] Mở dropdown sắp xếp danh sách watchlist

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click icon sắp xếp (cạnh nút "+") trong khối "Danh sách".

## Kết quả mong đợi
- [ ] Mở dropdown 11 tùy chọn sắp xếp (theo mã A-Z/Z-A, theo ngành A-Z/Z-A, theo giá tăng/giảm, theo % tăng/
      giảm, theo vốn hóa lớn/bé, "Tùy chọn" kéo-thả thủ công) kèm nút "Đóng".

---

## Nhóm: Ghi chú (Note)

# [TC_DASHBOARD_PP_13] Hiển thị header Ghi chú mặc định

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Chuyển sang tab dọc "Ghi chú".

## Kết quả mong đợi
- [ ] Hiển thị 3 tab lọc: "Tất cả" (active mặc định), "Cá nhân", "Giao dịch".
- [ ] Hiển thị thanh tìm kiếm + bộ lọc Thời gian ("Tùy chọn"/"7 ngày"/"30 ngày") + Giao dịch (Mua/Bán/Cổ tức-
      Quyền).
- [ ] Danh sách ghi chú hiển thị: ngày, tiêu đề, nội dung rút gọn, mã CK gắn kèm (nếu có).
- [ ] Nút "Thêm ghi chú mới" cố định ở cuối panel.

---

# [TC_DASHBOARD_PP_14] Chuyển tab lọc Ghi chú

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click tab "Cá nhân", rồi "Giao dịch".

## Kết quả mong đợi
- [ ] Mỗi tab lọc lại đúng danh sách ghi chú theo đúng phân loại tương ứng.

---

# [TC_DASHBOARD_PP_15] Mở modal "Thêm ghi chú mới"

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click nút "Thêm ghi chú mới".

## Kết quả mong đợi
- [ ] Mở modal tạo ghi chú mới (không submit gì trong testcase này để tránh tạo dữ liệu thật).

---

## Nhóm: Tài khoản Free

# [TC_DASHBOARD_PP_20] Free — panel Watchlist không có nút "Thêm mới" watchlist

- **Trạng thái:** 🆕 Testcase mới (thêm 09/11/2026)
- **Ghi chú:** `Watchlist.vue` ẩn nút thêm theo `store.state.isAccountFree` (sửa 01/10/2026 "Chỉnh lại mở khoá free user" —
  đọc store trực tiếp vì component còn chạy trong flexlayout React không có `$store`).

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_*`), vào Dashboard, bấm tab dọc "Watchlist", rồi "Ghi chú".

## Kết quả mong đợi
- [ ] Panel Watchlist hiện dropdown chọn watchlist nhưng **không** có nút "Thêm mới" (`.v3-watchlist-add-new-btn`).
- [ ] Tab "Ghi chú" vẫn mở được.

---

## Tổng hợp trạng thái (12 testcase)

Đã tự động hoá bằng Playwright: [tests/dashboard-panel-phai.spec.ts](../tests/dashboard-panel-phai.spec.ts)
(mở rộng POM [pages/DashboardPage.ts](../pages/DashboardPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 12 | PP_01–08, PP_13–15, PP_20. PP_09–12 và PP_16–19 đã xoá 09/11/2026 (tab đã gỡ khỏi web) |

**Phát hiện đáng chú ý:**
1. Watchlist-panel **dùng lại phần lớn component** với trang đầy đủ `/watchlist` đã có testcase riêng — tài liệu này
   chỉ bổ sung phần khung/khác biệt, tránh trùng lặp công sức kiểm thử.
2. Modal "Thêm mới Watchlist" (CModal của CoreUI) **không đóng được bằng phím Escape** — phải dùng đúng icon
   "×". Không phải bug chặn luồng nhưng là điểm UX khác thường có thể báo dev.
3. `Watchlist.vue` giữ nguyên nội dung modal "Tạo mới" trong DOM ngay cả khi chưa mở (CModal chỉ ẩn bằng CSS, không
   unmount) — cần ưu tiên `:visible` hoặc scope theo class riêng khi viết locator.
