# Màn hình: Dashboard — Panel phải (IBD / Watchlist / Cảnh báo / Ghi chú / Cộng đồng)

- **URL:** `/dashboard` (cùng route với [dashboard.md](dashboard.md), tài liệu này đào sâu nội dung 5 tab của
  panel phải mà tài liệu khung/shell chỉ test việc chuyển đổi giữa các tab, không đi vào nội dung bên trong).
- **Component:** [board/tabs/IBD.vue](../../stocks/src/views/dashboard/board/tabs/IBD.vue) +
  [board/tabs/Watchlist.vue](../../stocks/src/views/dashboard/board/tabs/Watchlist.vue) (**khác hẳn**
  `views/watchlist/WatchListPage.vue` đã có ở [watchlist.md](watchlist.md) — đây là widget rút gọn riêng cho
  Dashboard) + [board/tabs/Alert.vue](../../stocks/src/views/dashboard/board/tabs/Alert.vue) +
  [board/tabs/NoteV2.vue](../../stocks/src/views/dashboard/board/tabs/NoteV2.vue) +
  [board/tabs/Social.vue](../../stocks/src/views/dashboard/board/tabs/Social.vue) (**dùng chung** component
  `Post.vue`/`AddNewPost.vue` với trang `/cong-dong` đã có ở [cong-dong.md](cong-dong.md), nhưng chạy ở chế độ
  `rightTab=true` nên UI rút gọn hơn).
- **Domain test:** https://kfsp.vn/dashboard
- **Nguồn testcase gốc (app):** Không áp dụng — app không có khái niệm panel bên cạnh Dashboard như thế này.
  Toàn bộ 🆕.
- **Phương pháp sinh:** Đọc source code + kiểm kê độc lập bằng Playwright thật.
- **Quy ước trạng thái:** 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.
- **Nguyên tắc phạm vi:** Vì Watchlist-panel và Cộng đồng-panel dùng lại phần lớn logic/component đã có testcase
  chi tiết riêng ([watchlist.md](watchlist.md) cho trang chuẩn, [cong-dong.md](cong-dong.md) cho feed cộng
  đồng), tài liệu này **không lặp lại** các luồng CRUD/tương tác đã verify ở đó — chỉ test phần khung UI đặc thù
  của panel (dropdown, tab, mở/đóng modal, khác biệt so với bản đầy đủ).

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

## Nhóm: Cảnh báo (Alert)

# [TC_DASHBOARD_PP_09] Hiển thị header Cảnh báo mặc định

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Chuyển sang tab dọc "Cảnh báo".

## Kết quả mong đợi
- [ ] Hiển thị 2 sub-tab "Cổ phiếu" (active mặc định) / "Bộ lọc".
- [ ] Hiển thị thanh tìm kiếm, nút "Lịch sử", nút "Tạo mới".
- [ ] Bảng danh sách cảnh báo cổ phiếu: cột Chọn/Mã CK/Điều kiện/Sửa-Xóa, mỗi dòng hiển thị mã + số điều kiện
      cảnh báo + icon sửa (bút chì) + icon xóa (dấu X).

---

# [TC_DASHBOARD_PP_10] Chuyển sub-tab "Bộ lọc"

- **Trạng thái:** 🆕 — **Đã verify bằng automation, sửa lại giả định ban đầu**
- **Kết quả đo được:** Đổi sang danh sách nhóm điều kiện lọc cảnh báo. Thanh tìm kiếm và nút "Lịch sử" **vẫn
  hiển thị** ở tab này (không bị ẩn) — theo code, `v-if="activeTab === 0"` chỉ áp dụng cho nút "Tạo mới" và nút
  xóa hàng loạt, KHÔNG áp dụng cho cả khối `.v3-alert-header` như giả định ban đầu khi đọc code.

## Các bước thực hiện
1. Click sub-tab "Bộ lọc".

## Kết quả mong đợi
- [ ] Đổi sang danh sách nhóm điều kiện lọc cảnh báo.
- [ ] Thanh tìm kiếm và nút "Lịch sử" vẫn hiển thị; nút "Tạo mới" (chỉ dành cho tab "Cổ phiếu") không còn hiển
      thị.

---

# [TC_DASHBOARD_PP_11] Tìm kiếm lọc danh sách cảnh báo

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Ở sub-tab "Cổ phiếu", nhập 1 mã CK có trong danh sách cảnh báo vào ô tìm kiếm.

## Kết quả mong đợi
- [ ] Danh sách lọc còn lại đúng (các) dòng khớp từ khóa.

---

# [TC_DASHBOARD_PP_12] Chọn nhiều dòng để xóa hàng loạt

- **Trạng thái:** 🆕 — **⚠️ Cần xác nhận thêm**
- **Ghi chú:** Theo code, tick ít nhất 1 checkbox sẽ hiện icon "xóa hàng loạt" kèm badge số lượng đã chọn
  (`v-if="list_stockcode_delete.length > 0"`). Chưa thực hiện thao tác xóa thật để tránh làm mất dữ liệu cảnh
  báo thật của tài khoản test — chỉ nên verify UI hiện icon, không bấm xác nhận xóa.

## Các bước thực hiện
1. Tick chọn 1-2 checkbox trong bảng cảnh báo.

## Kết quả mong đợi
- [ ] Xuất hiện icon xóa hàng loạt kèm số lượng đã chọn đúng bằng số dòng đã tick.

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

## Nhóm: Cộng đồng (Social panel — khác `/cong-dong`)

# [TC_DASHBOARD_PP_16] Hiển thị 3 tab, KHÔNG có tab "AI Cập Nhật"

- **Trạng thái:** 🆕 — **Đã verify thực tế, khác biệt so với `/cong-dong`**
- **Khác biệt:** Trang `/cong-dong` đầy đủ có 4 tab (AI Cập Nhật/Mới nhất/Quan tâm/Phổ biến — xem
  [cong-dong.md](cong-dong.md) TC_CONGDONG_10). Panel Dashboard **chỉ có 3 tab**: "Mới nhất" (active mặc định),
  "Quan tâm", "Phổ biến" — không có "AI Cập Nhật".

## Các bước thực hiện
1. Chuyển sang tab dọc "Cộng đồng".

## Kết quả mong đợi
- [ ] Hiển thị đúng 3 tab: Mới nhất/Quan tâm/Phổ biến, không có tab AI Cập Nhật.

---

# [TC_DASHBOARD_PP_17] KHÔNG hiển thị thanh soạn bài (compose box)

- **Trạng thái:** 🆕 — **Đã verify qua đọc code + thực tế**
- **Khác biệt:** Component `Social.vue` nhận `rightTab={true}` khi dùng trong Dashboard, và template có
  `<AddNewPost ... v-if="!rightTab"/>` → thanh soạn bài "Bạn có nhận định gì muốn chia sẻ?" (có ở
  [cong-dong.md](cong-dong.md) TC_CONGDONG_19) **không hiển thị** trong panel Dashboard.

## Các bước thực hiện
1. Quan sát đầu panel "Cộng đồng" ở tab "Mới nhất".

## Kết quả mong đợi
- [ ] Không có thanh soạn bài viết mới ở đầu panel.

---

# [TC_DASHBOARD_PP_18] Bài viết hiển thị đủ nút tương tác (dùng chung component đã test)

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Panel dùng chung `Post.vue` với `/cong-dong` → hành vi Thích/Bỏ thích/Bình luận/Chia sẻ/Xem thêm
  đã được test chi tiết & tự động hoá ở [cong-dong.md](cong-dong.md) (TC_CONGDONG_15 trở đi;
  [tests/cong-dong.spec.ts](../tests/cong-dong.spec.ts)) — **không lặp lại ở đây**, chỉ verify các nút này có
  hiển thị đúng trong khung panel hẹp.

## Các bước thực hiện
1. Quan sát 1 bài viết trong panel Cộng đồng.

## Kết quả mong đợi
- [ ] Hiển thị avatar/tên tác giả, nội dung, đủ 3 nút Thích/Bình luận/Chia sẻ, không vỡ layout dù panel hẹp hơn
      nhiều so với feed đầy đủ.

---

# [TC_DASHBOARD_PP_19] Chuyển tab Quan tâm/Phổ biến trong panel

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click tab "Quan tâm", rồi "Phổ biến".

## Kết quả mong đợi
- [ ] Mỗi tab hiển thị đúng danh sách bài viết tương ứng (hoặc empty-state hợp lệ), không lỗi JS, không vỡ
      layout.

---

## Tổng hợp trạng thái (19 testcase)

Đã tự động hoá bằng Playwright: [tests/dashboard-panel-phai.spec.ts](../tests/dashboard-panel-phai.spec.ts)
(mở rộng POM [pages/DashboardPage.ts](../pages/DashboardPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 18 | App không có, hoặc widget khác hẳn app |
| ⚠️ Cần xác nhận thêm | 1 | TC_DASHBOARD_PP_12 — chưa thực hiện xóa hàng loạt thật để tránh mất dữ liệu cảnh báo của tài khoản test |

**Phát hiện đáng chú ý:**
1. Watchlist-panel và Cộng đồng-panel trong Dashboard **dùng lại phần lớn component** với các trang đầy đủ
   (`/watchlist`, `/cong-dong`) đã có testcase riêng — tài liệu này chỉ bổ sung phần khung/khác biệt, tránh
   trùng lặp công sức kiểm thử.
2. Modal "Thêm mới Watchlist" (CModal của CoreUI) **không đóng được bằng phím Escape** — phải dùng đúng icon
   "×". Không phải bug chặn luồng nhưng là điểm UX khác thường có thể báo dev.
3. Panel Cộng đồng ở Dashboard chạy chế độ rút gọn (`rightTab=true`): thiếu tab "AI Cập Nhật" và thanh soạn bài
   so với trang `/cong-dong` đầy đủ — là chủ đích thiết kế (không phải bug).
4. Cả `Watchlist.vue` lẫn `Alert.vue` giữ nguyên nội dung modal "Tạo mới"/"Lịch sử" trong DOM ngay cả khi chưa
   mở (CModal chỉ ẩn bằng CSS, không unmount) — khiến 1 số text/label bên trong modal (VD tab "Cổ phiếu"/"Bộ
   lọc", placeholder "Tìm kiếm", tiêu đề "Lịch sử cảnh báo") xuất hiện trùng lặp trong DOM dù không nhìn thấy
   trên màn hình. Không phải bug, nhưng cần biết để viết locator chính xác (ưu tiên `:visible` hoặc scope theo
   class riêng thay vì text chung chung).
