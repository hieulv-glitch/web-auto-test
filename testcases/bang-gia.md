# Màn hình: Bảng giá

> **🔴 CẬP NHẬT LỚN 2026-09-22 — Nhánh UI mới (đo trên `http://localhost:8080`, chưa lên production):** Bảng
> giá đang được redesign sâu, RIÊNG so với đợt đổi UI production cùng ngày (segment-control buttons, gỡ cột
> Ngành/Sàn CK — xem các ghi chú "Cập nhật 2026-09-22" rải rác bên dưới, đó là bản ĐANG CHẠY TRÊN PRODUCTION).
> Nhánh local này đi XA HƠN NỮA:
> - **Toolbar sàn/Phái sinh** → gộp chung 1 dropdown DUY NHẤT "Danh sách sàn" (`.pb-board-toggle`), không còn
>   nút rời cho từng sàn; "Phái sinh" giờ là 1 item trong chính dropdown này.
> - **Ngành/Watchlist/Tín hiệu M/B/Bộ lọc** → gộp vào 1 nút "Bộ lọc" overflow (`.pb-overflow-filters-toggle`),
>   mở ra 1 panel 3 dòng (Ngành / Watchlist / "Tín hiệu & bộ lọc" gộp cặp) — các dropdown con bên trong vẫn
>   dùng ĐÚNG y component cũ, chỉ đổi vị trí lồng.
> - **Panel border phải chỉ còn 6 tab** (không phải 8) — "Bài viết" và "Chatbot" đã bị GỠ BỎ HOÀN TOÀN. Đây
>   thực ra giải thích luôn nghi vấn flaky cũ (6/8 vs 8/8 tab tuỳ lần chạy, xem TC_BANGGIA_03) — không phải lỗi
>   render ngẫu nhiên, 2 tab đó giờ không tồn tại trên nhánh mới.
> - **Công tắc dark/light riêng cho bảng giá đã bị GỠ BỎ hoàn toàn** (không phải đổi vị trí) — chỉ còn công tắc
>   theme toàn site. `TC_BANGGIA_20` đã bị xoá khỏi bộ testcase (không giữ N/A, theo đúng quy ước dự án).
> - Nút "Mở rộng"/"Thu gọn" đổi Ý NGHĨA: trước đây toggle mini-chart RIÊNG trong mỗi index card (card luôn
>   hiện); giờ ẩn/hiện CẢ DẢI 5 index card cùng lúc. Mặc định tải trang dải đang HIỆN, nút hiện "Thu gọn".
> - 2 tính năng MỚI hoàn toàn, chưa có tiền lệ: nút "Bảng tự lướt xuống" (auto-scroll) và nút "Ẩn/hiện các cột"
>   — nút sau đang có NGHI VẤN BUG THẬT: click vào lại mở nhầm modal "Chi tiết sự kiện" (không liên quan), đã
>   thử đóng overflow panel trước khi click vẫn tái hiện — cần dev xác nhận, chưa viết testcase chính thức cho
>   tính năng này (xem `test.fixme` `TC_BANGGIA_53`).
> - Đã xác nhận qua automation thật: TOÀN BỘ cơ chế lọc (sàn/Phái sinh/Ngành/Watchlist/Tín hiệu M/B/Bộ lọc cá
>   nhân) vẫn hoạt động ĐÚNG sau redesign — chỉ đổi vỏ UI, không đổi logic lọc dữ liệu.
> - ⚠️ Trong lúc kiểm thử đợt này, phát hiện tài khoản test có thể rơi vào trạng thái dropdown sàn hiển thị nhãn
>   rỗng "Sàn" (không phải tên sàn cụ thể) kèm bảng dữ liệu trống hoàn toàn, sau nhiều lần đổi qua lại
>   sàn/Phái sinh/bộ lọc liên tục trong thời gian ngắn — nghi ngờ 1 tổ hợp state server-side (`type_list`/
>   `type_board`/`current_category_id`) bị lưu không nhất quán, PHỤC HỒI ĐƯỢC bằng cách mở lại dropdown sàn và
>   chọn "Toàn bộ" thủ công. Chưa xác định chắc chắn đây là bug thật hay chỉ do test tự động thao tác quá nhanh
>   dồn dập trong ngày — cần dev xác nhận nếu người dùng thật cũng gặp lại.

- **URL:** `/bang-gia` (route con của `/`, `TheContainer`, yêu cầu đăng nhập — `meta.requiresUser`).
- **Component:** [src/views/ibd/index.vue](../../stocks/src/views/ibd/index.vue) →
  [src/views/ibd/reactLayoutIBD.js](../../stocks/src/views/ibd/reactLayoutIBD.js) (React, dùng thư viện
  `flexlayout-react` để dựng 1 "workstation" dạng tabset kéo-thả/resize) với `props.type = "price-board"`.
  - Vùng nội dung chính (tabset giữa, chỉ có đúng 1 tab "Bảng giá", không có thanh tab vì
    `tabSetEnableTabStrip: false` trong `DEFAULT_GLOBAL_LAYOUT`) render
    [src/views/ibd/wrapperLayout.vue](../../stocks/src/views/ibd/wrapperLayout.vue) →
    (vì `type == 'price-board'`) [src/views/ibd/stock/liveBoard/index.vue](../../stocks/src/views/ibd/stock/liveBoard/index.vue)
    → [src/views/ibd/stock/liveBoard/wrapperLayout.js](../../stocks/src/views/ibd/stock/liveBoard/wrapperLayout.js)
    (React, class `WrapperLayout`) — đây là bảng giá thời gian thực thật sự, nội dung chính của màn hình.
  - Vùng border phải (`DEFAULT_BORDER_LAYOUT`, rộng 350px, `enableClose: false`, `enableDrag: false` cho mọi
    tab con) gồm 8 tab dọc cố định: IBD, Thông tin, Bài viết, Watchlist, Cảnh báo, Ghi chú, Cộng đồng, Chatbot.
  - Bố cục (layout JSON của flexlayout) được lưu/khôi phục qua `localStorage` key **`ibd_layout`**
    (`onModelChange` → `localStorage.setItem`, `loadLayout()` đọc lại khi mount).
- **Domain test:** https://kfsp.vn/bang-gia
- **Nguồn testcase gốc (app):** Google Sheet, tab "Bảng Giá" (86 dòng). App là 1 màn hình mobile hoàn toàn khác
  kiến trúc (bottom nav, 3 tab lớn Cổ phiếu/Phái sinh/Quốc tế, vuốt để chuyển tab, bottom sheet chọn
  Watchlist/Ngành, floating button...). Web là 1 workstation desktop dạng flexlayout (kéo-thả/resize panel,
  toolbar dropdown nổi, bảng ảo hoá `react-window`) — kiến trúc khác hẳn, chỉ dùng Sheet để tham khảo **văn
  phong** viết testcase (cách đặt Test View Point, mức chi tiết Kết quả mong đợi, các khía cạnh hay kiểm tra:
  hiển thị cột, sort, click mã, ghim, chọn watchlist/ngành...) — không dùng để giới hạn số lượng/nội dung
  testcase. Vài case tương ứng khái niệm chung (sort cột, ghim mã, chọn watchlist/ngành, click mã) gắn được
  `Tham chiếu App`; phần lớn còn lại là 🆕 vì web có nhiều tính năng/luồng riêng (flexlayout, socket real-time,
  Phái sinh HĐTL, Tín hiệu M/B, Bộ lọc KFSP...) mà app không có.
- **Nguyên tắc phạm vi (theo quyết định người dùng, cùng tinh thần với
  [dashboard.md](dashboard.md)/[dashboard-panel-phai.md](dashboard-panel-phai.md)):**
  1. **Khung layout tổng thể** (flexlayout: mở/thu gọn panel phải, resize, lưu/khôi phục `ibd_layout`, route
     guard) — test ở mức shell, không đi sâu vào từng widget con.
  2. **Toàn bộ nội dung bảng giá thời gian thực** (`LiveBoard`/`wrapperLayout.js` trong `stock/liveBoard/`) —
     đây là **nội dung chính, riêng biệt của màn hình này**, không nơi nào khác trong bộ testcase test tới, nên
     được test sâu nhất (toolbar lọc, header/sort, từng dòng mã, ghim, kéo-thả, chỉ số thị trường, Phái sinh...).
  3. **8 tab border phải** dùng các component trong `src/views/multiLayoutChart/` (`TabWatchlist`, `TabAlert`,
     `TabNote`, `TabNews`, `ReactTabInfo.vue`, `TabCommunity/feed.vue`, `TabCommunity/chatbot.vue`) +
     `dashboard_bk/analysisIBD.vue` cho tab "IBD". **Đã xác nhận qua đọc code (grep toàn bộ `src/`) đây là các
     component KHÁC HẲN** với `dashboard/board/tabs/{IBD,Watchlist,Alert,NoteV2,Social}.vue` đã test ở
     [dashboard-panel-phai.md](dashboard-panel-phai.md) (những file đó chỉ được dùng bởi
     `dashboard/reactLayoutDashboard.js`, tức Dashboard V3 — bản đang chạy mặc định). Các component
     `multiLayoutChart/Tab*` ở `/bang-gia` được dùng chung với `dashboard/reactLayoutDashboard.js` **bản V2 cũ**
     (không phải bản mặc định) và với `multiLayoutChart/reactMultiLayoutChart.js` — tức là **CHƯA từng được
     test ở bất kỳ file testcase nào khác trong bộ này**. Vì vậy nhóm E dưới đây viết testcase xác nhận mức độ
     vừa phải cho từng tab (hiển thị đúng, 1 tương tác chính) — không lặp lại chi tiết CRUD đầy đủ đã có ở
     [watchlist.md](watchlist.md) (trang `/watchlist` dùng `WatchListPage.vue`, cũng là component khác) hay
     [cong-dong.md](cong-dong.md) (riêng tab "Cộng đồng" ở đây dùng **đúng** component `Feed.vue`/`Post.vue` của
     `/cong-dong` với prop `rightTab={true}` — hành vi khác biệt khi `rightTab=true` đã được ghi nhận đầy đủ ở
     [dashboard-panel-phai.md](dashboard-panel-phai.md) TC_DASHBOARD_PP_16/17, nên ở đây chỉ xác nhận lại ngắn
     gọn, không lặp lại).
- **Phương pháp sinh:** Đọc source code (router, `index.vue`, `reactLayoutIBD.js`, `wrapperLayout.vue`, toàn bộ
  `stock/liveBoard/` — `wrapperLayout.js`, `rowItem.js`, `headerLiveBoard.js`, `listBoard.js`, `dropdownBoard.js`,
  `dropdownWatchlist.js`, `DropdownDepartment.vue`, `KfspDropdown.vue`, `popupWatchlist.vue`, `search.vue`,
  `listIndexInfo.js`, `itemIndexInfo.js`, `derivativesHistory.vue`, `customScrollbar.js`, `textBlink.js` — và
  phần đầu các file border tab `multiLayoutChart/Tab*`) + kiểm kê độc lập trên DOM thật
  (`scripts/inspect-dom.ts`) + đo hành vi thật bằng 1 script Playwright tạm (đã xoá sau khi dùng) cho các điểm
  không chắc chắn từ code: modal biểu đồ có đóng bằng Escape không, click dòng vs click mã có hành vi khác nhau
  không, click lại tab border đang active có thu gọn không, ghim/bỏ ghim có hoạt động đúng không, tài khoản Free
  có bị giới hạn gì trên chính `LiveBoard` không.
- **Quy ước trạng thái:**
  - ✅ Áp dụng — testcase adapt từ app, đã/có thể tự động hoá bằng Playwright.
  - 🆕 Testcase mới — phát sinh riêng cho web.
  - ⚠️ Cần xác nhận thêm — chưa đủ điều kiện kiểm chứng thực tế.

---

## Nhóm A: Truy cập & khung layout tổng thể (flexlayout shell)

# [TC_BANGGIA_01] Truy cập `/bang-gia` khi chưa đăng nhập

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Router guard (`meta.requiresUser`) redirect đúng tới
  `https://kfsp.vn/login?redirect=%2Fbang-gia`, giống cơ chế đã verify ở TC_DASHBOARD_02.

## Các bước thực hiện
1. Đảm bảo chưa đăng nhập (xoá `localStorage`/cookie).
2. Truy cập trực tiếp URL `/bang-gia`.

## Kết quả mong đợi
- [ ] Tự động chuyển hướng tới `/login?redirect=%2Fbang-gia`, không hiển thị nội dung Bảng giá.

---

# [TC_BANGGIA_02] Đăng nhập từ redirect quay lại đúng `/bang-gia`

- **Trạng thái:** 🆕

## Các bước thực hiện
1. Từ trạng thái chưa đăng nhập, truy cập `/bang-gia` (bị redirect sang `/login?redirect=%2Fbang-gia`).
2. Đăng nhập thành công.

## Kết quả mong đợi
- [ ] Sau đăng nhập, quay lại đúng `/bang-gia` (không phải `/dashboard` mặc định).

---

# [TC_BANGGIA_03] Overview màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Tham chiếu App:** TC_1 (Overview màn Bảng giá — chỉ tương ứng ý tưởng, layout hoàn toàn khác)
- **Cập nhật 2026-09-22 (nhánh UI mới) — GIẢI ĐÁP nghi vấn bug cũ:** panel border phải giờ CHỈ CÒN 6 TAB (không
  phải 8) — **"Bài viết" và "Chatbot" đã bị gỡ bỏ HOÀN TOÀN** khỏi `DEFAULT_BORDER_LAYOUT`. Điều này giải thích
  luôn nghi vấn flaky cũ mô tả bên dưới (6/8 vs 8/8 tab tuỳ lần chạy): không phải lỗi mount ngẫu nhiên như từng
  nghi ngờ — 2 tab đó đơn giản là không còn tồn tại trên nhánh này. Đã bỏ cơ chế retry/reload trong code test
  (không cần thiết nữa, số tab giờ ổn định 6/6 mọi lần).
- **Ghi chú lịch sử (bản UI TRƯỚC nhánh này, vẫn đúng trên production tại thời điểm ghi):** Qua nhiều lần chạy
  automation, đôi khi (không phải mọi lần) chỉ 6/8 tab border hiển thị — thiếu đúng 2 tab "Bài viết" và
  "Chatbot". Đã xác nhận KHÔNG phải do component mount chậm (đã thử chờ/poll liên tục 15 giây, số lượng vẫn đứng
  yên ở 6) — tải lại trang (F5) đôi khi khắc phục được, đôi khi vẫn thiếu. Chưa rõ nguyên nhân gốc tại thời điểm
  đó — nay đã có lời giải thích hợp lý ở "Cập nhật 2026-09-22" phía trên.

## Các bước thực hiện
1. Đăng nhập, vào `/bang-gia`.

## Kết quả mong đợi
- [ ] Không có thanh tab phía trên nội dung chính (chỉ 1 tab "Bảng giá" và `tabSetEnableTabStrip: false` nên
      không hiện thanh tab) — vào thẳng nội dung bảng giá thời gian thực.
- [ ] Panel border phải hiển thị **6** tab dọc theo đúng thứ tự: IBD, Thông tin, Watchlist, Cảnh báo, Ghi chú,
      Cộng đồng.
- [ ] Tab "IBD" active mặc định, hiển thị nội dung "Tổng quan thị trường chung".
- [ ] Không bị tràn/vỡ layout.

---

# [TC_BANGGIA_04] Bố cục lưu vào `localStorage` key `ibd_layout`

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Sau khi tải trang, `localStorage.getItem('ibd_layout')` tồn tại và parse được JSON hợp
  lệ, `borders[0].selected` phản ánh đúng tab border đang active (0 = "IBD").

## Các bước thực hiện
1. Vào `/bang-gia`, đợi tải xong.
2. Đọc `localStorage.ibd_layout`.

## Kết quả mong đợi
- [ ] Key `ibd_layout` tồn tại, là JSON hợp lệ chứa cấu trúc `global`/`borders`/`layout` của flexlayout.

---

# [TC_BANGGIA_05] Thu gọn panel phải khi click lại đúng tab đang active

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Từ trạng thái tab "Thông tin" đang active (`.flexlayout__border_button--selected`),
  click lại đúng tab đó → không còn tab nào giữ class `--selected` (giống cơ chế toggle đã ghi nhận ở
  TC_DASHBOARD_13, đây là hành vi mặc định của thư viện `flexlayout-react` khi click lại tab border đang chọn).

## Các bước thực hiện
1. Click 1 tab dọc bất kỳ (VD "Thông tin") để active.
2. Click lại đúng tab "Thông tin" đó lần nữa.

## Kết quả mong đợi
- [ ] Panel phải thu gọn (không còn tab nào active), nội dung panel ẩn đi.

---

# [TC_BANGGIA_06] Mở lại panel phải từ trạng thái thu gọn

- **Trạng thái:** 🆕

## Các bước thực hiện
1. Từ trạng thái đã thu gọn (TC_BANGGIA_05), click vào 1 tab dọc bất kỳ.

## Kết quả mong đợi
- [ ] Panel phải mở rộng trở lại, hiển thị đúng nội dung tab vừa click, tab đó chuyển active.

---

# [TC_BANGGIA_07] Kéo giãn độ rộng panel phải

- **Trạng thái:** 🆕 — **⚠️ Cần xác nhận thêm**
- **Ghi chú:** Panel border phải có thanh kéo riêng của `flexlayout-react` (class `.flexlayout__border_sizer`)
  nằm ở cạnh trái border. Chưa đo được bằng automation việc kéo có làm đổi `size` trong `ibd_layout` hay không
  (khác cơ chế `resizer-vertical` + `localStorage.resize` đã verify ở Dashboard — đây là 1 hệ thống layout
  khác, `flexlayout-react`, tự lưu qua `onModelChange`).

## Các bước thực hiện
1. Kéo thanh `.flexlayout__border_sizer` sang trái để mở rộng panel phải.

## Kết quả mong đợi
- [ ] Panel phải đổi độ rộng theo thao tác kéo, `ibd_layout` trong `localStorage` cập nhật `size` mới của node
      border.

---

# [TC_BANGGIA_08] Tab border không thể đóng/kéo-thả ra ngoài

- **Trạng thái:** 🆕 — **Đã verify qua đọc code**
- **Ghi chú:** Toàn bộ 8 tab con trong `DEFAULT_BORDER_LAYOUT` được khai báo `enableClose: false`,
  `enableDrag: false` — khác với Dashboard (nơi các tab panel phải cũng không lộ nút đóng nhưng dùng cơ chế
  khác). Xác nhận qua DOM: không có icon "x" trên bất kỳ tab dọc nào.

## Các bước thực hiện
1. Quan sát từng tab dọc bên phải.
2. Thử kéo 1 tab dọc (VD "Cảnh báo") ra vùng khác.

## Kết quả mong đợi
- [ ] Không có icon đóng (×) trên tab.
- [ ] Không kéo-thả được tab ra vị trí khác (layout giữ nguyên).

---

# [TC_BANGGIA_09] Tab chính "Bảng giá" không hiển thị thanh tab, không thể đóng/kéo

- **Trạng thái:** 🆕 — **Đã verify qua đọc code + thực tế**
- **Ghi chú:** `DEFAULT_GLOBAL_LAYOUT.tabSetEnableTabStrip = false` áp dụng cho toàn bộ tabset ở vùng giữa (khác
  border) — vì tabset giữa chỉ có đúng 1 tab "Bảng giá", người dùng không có cách nào qua UI để đóng/kéo/thêm
  tab mới ở vùng nội dung chính.

## Các bước thực hiện
1. Quan sát vùng nội dung chính (bảng giá) — không có thanh tab phía trên.

## Kết quả mong đợi
- [ ] Không hiển thị thanh tab nào phía trên bảng giá; nội dung chiếm toàn bộ chiều cao vùng giữa.

---

## Nhóm B: Toolbar lọc bảng giá

# [TC_BANGGIA_10] Hiển thị đầy đủ toolbar lọc mặc định

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế trên nhánh UI mới: Pass**
- **Tham chiếu App:** TC_3, TC_9 (khái niệm tab lọc sàn/danh mục — cách triển khai khác hẳn)
- **Cập nhật 2026-09-22 (nhánh UI mới) — đổi cấu trúc toolbar hoàn toàn:**
  1. 7 nút sàn/Phái sinh rời (Toàn bộ/HOSE/VN30/VN100/HNX/UPCOM/Phái sinh) → gộp chung **1 dropdown DUY NHẤT**
     "Danh sách sàn" (nhãn hiện đúng lựa chọn đang chọn, VD "Toàn bộ").
  2. Dropdown "Ngành"/"Watchlist"/"Tín hiệu M/B"/"Bộ lọc" → gộp vào **1 nút "Bộ lọc" overflow**, mở ra 1 panel
     3 dòng (Ngành / Watchlist / "Tín hiệu & bộ lọc" gộp cặp).
  3. Công tắc dark/light riêng cho bảng giá → **đã bị gỡ bỏ hoàn toàn** (không phải đổi vị trí).
  4. Thêm 2 nút mới: "Bảng tự lướt xuống" (auto-scroll) và "Ẩn/hiện các cột" (xem TC_BANGGIA_53, nghi vấn bug).
  5. Nút "Mở rộng"/"Thu gọn" đổi ý nghĩa — xem TC_BANGGIA_21.

## Các bước thực hiện
1. Quan sát toolbar phía trên bảng dữ liệu.
2. Mở dropdown "Danh sách sàn".
3. Mở panel "Bộ lọc" overflow.

## Kết quả mong đợi
- [ ] Dòng 1: ô "Tìm kiếm Mã CK", dropdown "Danh sách sàn" (nhãn "Toàn bộ" mặc định), nút "Bộ lọc" overflow;
      góc phải có nút "Bảng tự lướt xuống", nút "Thu gọn"/"Mở rộng", nút "Ẩn/hiện các cột".
- [ ] Dropdown "Danh sách sàn" mở ra đủ 7 mục: Toàn bộ, HOSE, VN30, VN100, HNX, UPCOM, Phái sinh.
- [ ] Panel "Bộ lọc" overflow mở ra đủ 3 dòng: Ngành, Watchlist, "Tín hiệu & bộ lọc" (chứa cả 2 dropdown "Tín
      hiệu M/B" và "Bộ lọc" cá nhân).

---

# [TC_BANGGIA_11] Chuyển đổi giữa các sàn (Toàn bộ/HOSE/VN30/VN100/HNX/UPCOM)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Tham chiếu App:** TC_11-16 (Theo dõi/HSX/VN30/HNX/UPCOM/Năng động — tên & danh sách sàn khác nhưng cùng ý
  tưởng lọc theo sàn)
- **Cập nhật 2026-09-22 (nhánh UI mới, đổi LẦN 2 sâu hơn):** sau đợt đổi sang "segment control" (`<button
  class="segment-item">`, ghi nhận trước đó — bản ĐANG CHẠY TRÊN PRODUCTION), nhánh local này đổi tiếp: **cả 7
  sàn/Phái sinh gộp vào 1 dropdown DUY NHẤT "Danh sách sàn"** (`.pb-board-toggle`, nhãn hiện tên sàn đang chọn),
  không còn 7 nút rời. Cột "Sàn CK" vẫn không tồn tại ở bất kỳ trạng thái sàn nào (như đã ghi nhận trước).
  **Đã đo lại bằng automation thật (đăng nhập mới, mở dropdown, chọn từng sàn):** danh sách mã THẬT SỰ đổi đúng
  theo sàn đã chọn (HOSE/HNX/UPCOM cho ra 3 tập mã hoàn toàn không giao nhau) — phần lọc dữ liệu vẫn hoạt động
  đúng, chỉ đổi vỏ UI.
- **⚠️ Lưu ý vận hành:** trong lúc đo, có lúc tài khoản test rơi vào trạng thái dropdown hiện nhãn rỗng "Sàn"
  (không phải tên sàn cụ thể) kèm bảng trống hoàn toàn, sau khi đổi qua lại sàn/Phái sinh/bộ lọc liên tục nhiều
  lần trong thời gian ngắn — phục hồi được bằng cách mở lại dropdown, chọn "Toàn bộ" thủ công. Xem cảnh báo đầy
  đủ ở đầu file.

## Các bước thực hiện
1. Mở dropdown "Danh sách sàn".
2. Chọn lần lượt "HOSE", "VN30", "VN100", "HNX", "UPCOM", rồi quay lại "Toàn bộ" (mỗi lần đều phải mở lại
   dropdown trước khi chọn mục tiếp theo).

## Kết quả mong đợi
- [ ] Mỗi lần chọn, nhãn dropdown đổi đúng theo sàn vừa chọn, danh sách mã trong bảng đổi tương ứng đúng
      sàn/rổ đã chọn (đã verify: mã ở HOSE/HNX/UPCOM không trùng nhau).
- [ ] ~~Cột "Sàn CK" hiển thị lại khi chọn "Toàn bộ"~~ — không còn áp dụng, cột này đã bị gỡ bỏ khỏi UI.

---

# [TC_BANGGIA_12] Chuyển sang "Phái sinh"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Cập nhật 2026-09-22 (nhánh UI mới):** "Phái sinh" giờ là 1 mục trong dropdown "Danh sách sàn" (xem
  TC_BANGGIA_10/11), không phải nút riêng trên toolbar.

## Các bước thực hiện
1. Mở dropdown "Danh sách sàn", chọn "Phái sinh".

## Kết quả mong đợi
- [ ] Hiện 2 sub-tab "Bảng giá HĐTL" (active mặc định)/"Thống kê HĐTL".
- [ ] Bảng đổi cột: hiện thêm "Ngày đáo hạn", "Độ lệch", "KL mở (OI)".
- [ ] Danh sách mã đổi sang các mã hợp đồng tương lai (VD `VN30F...`, `41I1...`) — đã verify: mọi mã hiển thị
      đều khớp pattern `VN30F`/`VN100F`/`41I1`/`41I2`.
- [ ] Dòng chú thích cuối bảng đổi thành "Giá x 100.000 VNĐ. Khối lượng x 1HĐ".

---

# [TC_BANGGIA_13] "Phái sinh" > sub-tab "Thống kê HĐTL"

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế trên nhánh UI mới: Pass**

## Các bước thực hiện
1. Mở dropdown "Danh sách sàn", chọn "Phái sinh", click sub-tab "Thống kê HĐTL".

## Kết quả mong đợi
- [ ] Hiện dropdown "Chọn HĐ" (danh sách mã hợp đồng) + nhãn "Ngày đáo hạn".
- [ ] Bảng lịch sử giao dịch hiện ra: cột Ngày GD/Mã HĐ/Tham chiếu/O/H/L/C/+-/%+-/Tổng KLGD/OI + 2 nhóm "Tự
      doanh"/"Nước ngoài" (mỗi nhóm: KL Mua/KL Bán/Tổng KLGD/KLGD Ròng/Lũy tiến/tỷ lệ %), có thể click header để
      sort.
- [ ] Đổi mã HĐ trong dropdown → bảng tải lại đúng dữ liệu của mã mới chọn.

---

# [TC_BANGGIA_14] Dropdown "Ngành" lọc theo ngành

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế trên nhánh UI mới: Pass**
- **Tham chiếu App:** khái niệm lọc theo ngành trong bottom sheet "Danh sách theo dõi" (TC_32-35), cách triển
  khai khác (đây là dropdown lưới 2 cột hover-mở, không phải bottom sheet)
- **Cập nhật 2026-09-22 (nhánh UI mới):** dropdown "Ngành" giờ nằm trong panel "Bộ lọc" overflow (mở bằng nút
  "Bộ lọc" cuối toolbar) thay vì hiện thẳng trên toolbar — bản thân dropdown/logic lọc KHÔNG đổi.

## Các bước thực hiện
1. Click nút "Bộ lọc" (overflow) trên toolbar để mở panel.
2. Hover/click dropdown "Ngành".
3. Chọn 1 ngành bất kỳ trong danh sách.

## Kết quả mong đợi
- [ ] Dropdown mở dạng lưới 2 cột, mục đầu tiên "Tất cả".
- [ ] Chọn 1 ngành → bảng lọc còn lại đúng các mã thuộc ngành đó (kết hợp với sàn đang chọn hiện tại), tên ngành
      đã chọn hiển thị nổi bật trên toggler dropdown.
- [ ] Lựa chọn được lưu vào `localStorage.price_board_department_selected`, giữ nguyên sau khi tải lại trang.

---

# [TC_BANGGIA_15] Dropdown "Watchlist" đổi danh sách theo watchlist đã chọn

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế trên nhánh UI mới: Pass**
- **Tham chiếu App:** TC_32-35 (chọn Watchlist trong bottom sheet "Danh sách theo dõi")
- **Cập nhật 2026-09-22 (nhánh UI mới):** dropdown "Watchlist" giờ nằm trong panel "Bộ lọc" overflow (mở bằng
  nút "Bộ lọc" ở cuối toolbar) thay vì hiện thẳng trên toolbar — bản thân dropdown/logic lọc KHÔNG đổi.

## Các bước thực hiện
1. Click nút "Bộ lọc" (overflow) trên toolbar để mở panel.
2. Click dropdown "Watchlist".
3. Chọn 1 watchlist trong danh sách "Danh sách Watchlist".

## Kết quả mong đợi
- [ ] Dropdown hiển thị đúng danh sách watchlist của tài khoản, tên watchlist đang chọn (nếu có) in đậm/highlight
      bằng dấu tick.
- [ ] Chọn 1 watchlist → bảng đổi sang đúng các mã trong watchlist đó, nút "Thêm mã" xuất hiện cạnh dropdown
      (chỉ khi category thuộc nhóm "watchlist_...", KHÔNG hiện với "Nhật ký GD"/"Khác").

---

# [TC_BANGGIA_18] Dropdown "Tín hiệu M/B"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation với dữ liệu thật (không mock): Pass**
- **Cập nhật 2026-09-22:** trước đây để `test.fixme` vì định mock API để không phụ thuộc dữ liệu thị trường
  thật — theo yêu cầu người dùng, đổi sang dùng thẳng dữ liệu thật + tài khoản test thật, không mock. Đã verify:
  chọn "Tiềm năng mua hôm nay" → gọi đúng `GET /api/filter/get-macks-by-filter` (200) → bảng đổi đúng, MỌI mã
  hiển thị đều nằm trong đúng tập mã API trả về (so khớp trực tiếp, không chỉ "có đổi"). Vì phụ thuộc dữ liệu
  thị trường thật của đúng ngày chạy test, số lượng mã "tiềm năng mua hôm nay" có thể bằng 0 vào 1 số ngày/thời
  điểm — test tự `skip` rõ lý do trong trường hợp đó, không coi là fail.

- **Cập nhật thêm 2026-09-22 (nhánh UI mới):** dropdown "Tín hiệu M/B" giờ nằm trong panel "Bộ lọc" overflow
  (mở bằng nút "Bộ lọc" cuối toolbar), gộp cùng dòng với dropdown "Bộ lọc" cá nhân KFSP (label chung "Tín hiệu &
  bộ lọc") — bản thân dropdown/logic lọc KHÔNG đổi.

## Các bước thực hiện
1. Click nút "Bộ lọc" (overflow) trên toolbar để mở panel.
2. Click dropdown "Tín hiệu M/B".
3. Chọn "Tiềm năng mua hôm nay" (hoặc "Tiềm năng bán hôm nay").

## Kết quả mong đợi
- [ ] Gọi API `GET /api/filter/get-macks-by-filter`, nhãn dropdown đổi thành tên tuỳ chọn vừa chọn.
- [ ] Bảng đổi sang danh sách mã trả về từ API (kết hợp lọc theo ngành đang chọn nếu có) — đã verify: mọi mã
      hiển thị đều thuộc đúng tập mã API trả về.

---

# [TC_BANGGIA_19] Dropdown "Bộ lọc" (bộ lọc cá nhân KFSP)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Cập nhật 2026-09-22:** tài khoản test hiện có sẵn 2 bộ lọc cá nhân đã lưu ở nhóm "Của bạn" (`Loc_ma_tiem_nang`,
  `test_loc`) — trước đây test chỉ mở dropdown và kiểm tra không lỗi JS, KHÔNG hề chọn 1 bộ lọc để xem bảng có
  lọc đúng không (đúng lỗ hổng người dùng phát hiện, giống pattern đã sửa ở TC_BANGGIA_11/12/15). Đã đo lại bằng
  automation thật: chọn `Loc_ma_tiem_nang` → gọi đúng `GET /api/filter/get-macks-by-filter?...&type=my_filter`
  (200, trả về danh sách mã thật) → bảng đổi CHÍNH XÁC theo đúng danh sách mã trả về từ API — lọc hoạt động
  đúng. Đã cập nhật code test để thật sự click chọn 1 bộ lọc và so sánh danh sách mã trước/sau (`test.skip` nếu
  tài khoản không có bộ lọc cá nhân nào).
- **⚠️ Lưu ý khi viết thêm test cho dropdown này (hoặc "Tín hiệu M/B"):** nhãn hiển thị của dropdown (`filterMenuTitle`)
  đổi thành tên bộ lọc vừa chọn thay vì giữ nguyên "Bộ lọc" — nếu cần thao tác lại trên chính dropdown này SAU
  KHI đã chọn 1 bộ lọc trong cùng 1 test, KHÔNG dùng lại locator định vị theo text "Bộ lọc" (sẽ không còn khớp).
- **Ghi chú:** Nội dung dropdown phụ thuộc API `GET /api/filter/pricing-table/my-filter-group-and-example`,
  gồm 2 nhóm/tab: "Của bạn" (bộ lọc tự tạo, active mặc định) và "KFSP" (bộ lọc chuẩn của hệ thống, chưa test).
- **Cập nhật thêm 2026-09-22 (nhánh UI mới):** dropdown "Bộ lọc" giờ nằm trong panel "Bộ lọc" overflow (mở bằng
  nút "Bộ lọc" cuối toolbar), gộp cùng dòng với dropdown "Tín hiệu M/B" — bản thân dropdown/logic lọc KHÔNG đổi.

## Các bước thực hiện
1. Click nút "Bộ lọc" (overflow) trên toolbar để mở panel.
2. Click dropdown "Bộ lọc" (bên trong panel).
3. Chọn 1 bộ lọc trong nhóm "Của bạn".

## Kết quả mong đợi
- [ ] Dropdown mở ra, hiển thị nhóm bộ lọc cá nhân đã lưu của tài khoản (nếu có) hoặc trạng thái rỗng hợp lệ,
      không lỗi JS.
- [ ] Chọn 1 bộ lọc → gọi đúng API `GET /api/filter/get-macks-by-filter` với `type=my_filter`, bảng đổi sang
      đúng danh sách mã trả về từ API (đã verify: danh sách thật sự đổi so với "Toàn bộ").

---

# [TC_BANGGIA_21] Toggle "Thu gọn"/"Mở rộng" dải index card

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Cập nhật 2026-09-22 (nhánh UI mới, đổi cả tính năng lẫn code):** trước đây nút này toggle MINI-CHART riêng
  bên trong mỗi index card (5 card luôn hiện, chỉ ẩn/hiện biểu đồ nhỏ). Giờ nút ẩn/hiện **CẢ DẢI 5 index card
  cùng lúc** (nhường chỗ cho bảng dữ liệu) — title đổi "Gập dải chỉ số, xem toàn bảng giá" ⇄ "Hiện lại dải chỉ
  số". Mặc định tải trang: dải đang HIỆN (5 card), nút hiện chữ "Thu gọn" — KHÔNG phải "Mở rộng" như hành vi cũ
  (điểm gây fail cho code test cũ, đã sửa lại đúng default mới).
- **Kết quả đo được:** Click "Thu gọn" → 5 index card biến mất hoàn toàn, nút đổi thành "Mở rộng"; click lại
  "Mở rộng" → 5 card hiện lại đầy đủ, nút quay về "Thu gọn".

## Các bước thực hiện
1. Quan sát trạng thái mặc định: 5 index card hiện, nút hiện "Thu gọn".
2. Click nút "Thu gọn".
3. Click lại nút (giờ là "Mở rộng").

## Kết quả mong đợi
- [ ] Bước 2: cả 5 index card ẩn đi, nút đổi thành "Mở rộng".
- [ ] Bước 3: cả 5 index card hiện lại, nút đổi về "Thu gọn". Không ảnh hưởng danh sách mã bên dưới.

---

# [TC_BANGGIA_53] Nút "Ẩn/hiện các cột" — nghi vấn bug thật

- **Trạng thái:** 🆕 Testcase mới — **⚠️ Cần xác nhận thêm, nghi vấn bug thật**
- **Ghi chú:** Tính năng mới hoàn toàn trên nhánh UI này, chưa từng có ở bản trước. Click nút "Ẩn/hiện các cột"
  (icon 3 chấm dọc, cạnh nút "Thu gọn") lẽ ra phải mở dialog chọn cột hiển thị — nhưng đo được thực tế mở NHẦM
  modal **"Chi tiết sự kiện"** (nội dung hoàn toàn không liên quan, có vẻ thuộc 1 tính năng lịch sự kiện khác
  của hệ thống) — đã thử đóng panel "Bộ lọc" overflow trước khi click (loại trừ khả năng do overlay chồng lấp)
  vẫn tái hiện y hệt. Chưa viết test chính thức cho tính năng "ẩn/hiện cột" vì chưa rõ hành vi ĐÚNG thật sự là
  gì — cần dev xác nhận trước khi viết testcase mô tả hành vi mong đợi.

## Các bước thực hiện
1. Click nút "Ẩn/hiện các cột" trên toolbar.

## Kết quả mong đợi
- [ ] ⚠️ CHƯA XÁC ĐỊNH — hiện tại đang mở nhầm modal "Chi tiết sự kiện", nghi vấn bug thật.

---

# [TC_BANGGIA_22] Tìm kiếm mã hợp lệ

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** không có ô tìm kiếm tương ứng trong Sheet cho màn Bảng giá — 🆕 theo hướng chức năng chung
  của web

## Các bước thực hiện
1. Gõ 1 mã CK hợp lệ đang có trong bảng vào ô "Tìm kiếm Mã CK".
2. Chọn từ danh sách gợi ý (hoặc nhấn Enter).

## Kết quả mong đợi
- [ ] Hiện danh sách gợi ý tối đa 5 mã khớp (mã + tên công ty).
- [ ] Chọn 1 mã → bảng tự cuộn tới đúng dòng mã đó, dòng được flash highlight màu vàng nhạt trong ~1 giây.
- [ ] Ô tìm kiếm tự xoá nội dung sau khi chọn.

---

# [TC_BANGGIA_23] Tìm kiếm mã không tồn tại

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Gõ 1 chuỗi không khớp mã CK nào (VD "ZZZ999") vào ô tìm kiếm.

## Kết quả mong đợi
- [ ] Không hiện danh sách gợi ý, không có lỗi JS, có thể tiếp tục gõ/xoá bình thường.

---

## Nhóm C: Chỉ số thị trường (5 index card đầu trang)

# [TC_BANGGIA_24] Hiển thị 5 index card

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát hàng card chỉ số phía trên toolbar lọc.

## Kết quả mong đợi
- [ ] Hiển thị đủ 5 card theo thứ tự: VNINDEX, HNXINDEX, UPCOMINDEX, VN30, VN100.
- [ ] Mỗi card: giá hiện tại, mức thay đổi + % thay đổi, tổng KL khớp, tổng giá trị (tỷ), dòng "Tăng giảm" với 3
      số (tăng/đứng giá/giảm).

---

# [TC_BANGGIA_25] Click 1 index card mở modal biểu đồ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Khác biệt so với app:** app có concept "chuyển sang màn Thị trường tương ứng" (điều hướng); ở đây web chỉ mở
  modal biểu đồ tại chỗ, KHÔNG điều hướng rời trang (giống hành vi đã ghi nhận ở TC_DASHBOARD_20 cho card chỉ
  số Dashboard).

## Các bước thực hiện
1. Click vào tên 1 index (VD "VNINDEX").

## Kết quả mong đợi
- [ ] Mở modal biểu đồ của chỉ số đó, không điều hướng rời khỏi `/bang-gia`.

---

# [TC_BANGGIA_26] Màu sắc theo chiều tăng/giảm/đứng giá của index card

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_25 (quy ước màu tăng/giảm/đứng giá/trần/sàn — cùng bộ màu chuẩn của hệ thống)

## Các bước thực hiện
1. Quan sát màu chữ giá/% thay đổi của từng index đang tăng và đang giảm.

## Kết quả mong đợi
- [ ] Chỉ số tăng: màu xanh lá. Chỉ số giảm: màu đỏ. Đứng giá: màu vàng — khớp quy ước màu chung toàn hệ thống.

---

## Nhóm D: Bảng dữ liệu mã CK (header + từng dòng)

> **✅ Cập nhật 2026-09-22 (UI đã đổi, đã re-verify xong):** đã xác nhận qua DOM thật + automation cột **"Ngành"
> và "Sàn CK"** đã bị **gỡ bỏ hoàn toàn** khỏi header bảng (`.price-board-header-row`) ở MỌI trạng thái sàn —
> header còn: (rỗng — action), Mã, TC, Trần, Sàn (giá sàn), Tổng KL, nhóm Bên mua/Khớp lệnh/Bên bán, Cao, Thấp,
> Giá TB, Mua/Bán (ĐTNN). Dòng mã (TC_BANGGIA_31) cũng không còn hiển thị "ngành viết hoa nhỏ bên dưới mã" —
> tên công ty đầy đủ giờ chỉ còn ở tooltip `title` của ô mã. TC_BANGGIA_27/30/31/33/41 dưới đây đã được cập
> nhật lại nội dung + code khớp thay đổi này.

# [TC_BANGGIA_27] Header bảng hiển thị đầy đủ cột

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Tham chiếu App:** TC_18 (header cột Mã/Giá/%/KL — web có nhiều cột chi tiết hơn hẳn)
- **Cập nhật 2026-09-22:** bỏ 2 assertion "Ngành"/"Sàn CK" (cột đã gỡ bỏ, xem cảnh báo đầu Nhóm D).

## Các bước thực hiện
1. Quan sát header bảng ở chế độ "Toàn bộ" (Cổ phiếu).

## Kết quả mong đợi
- [ ] Đủ cột theo đúng nhóm: Mã, TC, Trần, Sàn, Tổng KL, nhóm "Bên mua" (Giá 3/KL 3/Giá 2/KL 2/Giá 1/KL 1),
      nhóm "Khớp lệnh" (Giá/KL/+/-/%), nhóm "Bên bán" (Giá 1/KL 1/Giá 2/KL 2/Giá 3/KL 3), Cao, Thấp, Giá TB,
      cột "Mua"/"Bán" (ĐTNN).
- [ ] Các nhãn nhóm float ("Bên mua"/"Khớp lệnh"/"Bên bán") canh đúng vị trí phía trên nhóm cột con.

---

# [TC_BANGGIA_28] Click header để sắp xếp (sort)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation, phát hiện 2 điểm đáng chú ý**
- **Tham chiếu App:** TC_19-22 (sort theo Mã CK/Giá/%/KL — web sort được thêm nhiều cột khác: Ngành, Sàn, TC,
  Trần, Sàn, Tổng KL, Cao, Thấp, Giá TB...)
- **Kết quả đo được:**
  1. Danh sách mặc định (chưa từng click sort) đã hiển thị theo thứ tự **trông giống** tăng dần theo Mã (đúng
     với state khởi tạo `column_sort: "stockcode"`, `type_sort: "asc"`), NHƯNG đây chỉ là thứ tự nguyên bản mà
     API `getdatainitpriceboard` trả về — **không hẳn là kết quả thật của thuật toán sort toàn cục** (VD: danh
     sách gốc không có mã bắt đầu bằng ký tự đặc biệt như "^MU" ở đầu, trong khi sort thật theo `localeCompare`
     lại xếp các mã dạng đó lên đầu — xem chi tiết ở TC_BANGGIA_29). Vì đang là cột "Mã", click "Mã" LẦN ĐẦU
     TIÊN thực chất là click vào đúng cột đang active trong state, nên ĐẢO CHIỀU ngay sang giảm dần (Z→A) thay
     vì "bắt đầu lại từ tăng dần" như mọi cột khác chưa từng được chọn — khớp code `sortData()` (so sánh
     `prevState.column_sort == column`), không phải bug.
  2. Sau khi click, việc sort chạy trên TOÀN BỘ dữ liệu (không chỉ các dòng đang hiển thị).

## Các bước thực hiện
1. Quan sát thứ tự mã mặc định (10 dòng đầu đã theo thứ tự tăng dần theo Mã).
2. Click header "Mã" (cột đang là cột sort mặc định trong state) → đảo sang giảm dần.

## Kết quả mong đợi
- [ ] Bước 1: 10 dòng đầu đã theo đúng thứ tự tăng dần (mỗi mã ≤ mã kế tiếp theo `localeCompare`).
- [ ] Bước 2: danh sách đảo thành giảm dần (mỗi mã ≥ mã kế tiếp), icon mũi tên đổi hướng, khác hẳn thứ tự ở
      bước 1.

---

# [TC_BANGGIA_29] Click lại cùng cột đảo chiều sort

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation, phát hiện đáng chú ý**
- **Phát hiện đáng chú ý:** Click "Mã" 2 lần liên tiếp (asc→desc→asc) cho ra đúng danh sách tăng dần CHUẨN theo
  `localeCompare` (VD bắt đầu bằng "^MU", "A32", "AAA"...), nhưng danh sách này **KHÔNG trùng khớp y hệt** với
  danh sách gốc lúc mới vào trang (trước khi từng click sort lần nào) — vì danh sách gốc chỉ là thứ tự nguyên
  bản server trả về (trông giống tăng dần nhưng thực chất không phải kết quả của thuật toán sort thật, xem
  TC_BANGGIA_28). Đây là điểm khác biệt tinh tế giữa "trạng thái *label* mặc định là asc" và "danh sách *thực
  sự* đã qua sort asc" — không phải bug (dữ liệu vẫn đúng, chỉ là 2 khái niệm "asc" khác nhau về nguồn gốc),
  nhưng đáng lưu ý nếu có yêu cầu đồng bộ 2 trạng thái này.

## Các bước thực hiện
1. Click header "Mã" lần 1 (từ baseline mặc định → đảo sang giảm dần, xem TC_BANGGIA_28).
2. Click lại header "Mã" lần 2.

## Kết quả mong đợi
- [ ] Sau lần click thứ 2, danh sách quay lại đúng thứ tự tăng dần chuẩn (A→Z theo `localeCompare`, mỗi mã ≤
      mã kế tiếp), icon mũi tên đổi hướng tương ứng — có thể KHÔNG trùng y hệt danh sách gốc lúc mới vào trang
      (xem phần "Phát hiện đáng chú ý" ở trên).

---

# [TC_BANGGIA_30] Icon "‹"/"›" đổi cột "Mua"/"Bán" ⇄ "Room"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Cập nhật 2026-09-22:** id `priceboard-foreign-start`/`-end` không còn trên header "Mua"/"Bán" (locator cũ
  không còn khớp) — đổi sang dùng thuộc tính `data-grp="foreign"` (vẫn tồn tại, xác nhận qua DOM thật).
- **Ghi chú:** Đây chính là cặp icon "‹ ›" ở 2 đầu nhóm cột "ĐTNN" — Sheet app mô tả icon này ở cạnh cột "%"
  (TC_23) nhưng trên web thực tế nó nằm ở header "Mua"/"Bán" và chuyển đổi hiển thị 2 cột riêng
  (Mua/Bán khối lượng nước ngoài) sang 1 cột gộp "Room" (room còn lại), không liên quan cột "%".

## Các bước thực hiện
1. Click icon "›" ở góc phải header "Bán" (hoặc icon "‹" ở góc trái header "Mua").

## Kết quả mong đợi
- [ ] Bảng đổi từ 2 cột "Mua"/"Bán" (khối lượng mua/bán của NĐT nước ngoài) sang 1 cột "Room" (room còn lại),
      và ngược lại khi bấm lại.

---

# [TC_BANGGIA_31] Hiển thị đầy đủ 1 dòng mã

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Tham chiếu App:** TC_24 (icon ghim, mã + ngành, biểu đồ mini, Giá/%/KL — web không có biểu đồ mini trong
  từng dòng, thay bằng đầy đủ 3 bước giá mua/bán)
- **Cập nhật 2026-09-22:** "ngành viết hoa nhỏ bên dưới mã" đã bị gỡ khỏi dòng — tên công ty đầy đủ giờ CHỈ còn
  ở tooltip `title` của ô mã (hover mới thấy), không còn hiển thị chữ trực tiếp trên dòng.

## Các bước thực hiện
1. Quan sát 1 dòng mã bất kỳ (VD SHB).

## Kết quả mong đợi
- [ ] Cột action: icon kéo-thả (⋮⋮, chỉ hiện khi dòng KHÔNG ghim) + icon ghim (📌).
- [ ] Mã CK dạng link đậm, tooltip `title` chứa tên đầy đủ công ty.
- [ ] Đủ giá TC/Trần/Sàn (tô màu cố định tím/xanh dương/vàng bất kể dữ liệu), Tổng KL, 3 bước giá mua/bán kèm
      KL, giá khớp/KL/+-/%, Cao/Thấp/Giá TB, Mua/Bán (hoặc Room) khối ngoại.

---

# [TC_BANGGIA_32] Màu sắc theo trạng thái giá của từng dòng

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_25 (quy ước màu Giảm=đỏ/Tăng=xanh/Đứng giá=vàng/Trần=tím/Sàn=xanh dương)

## Các bước thực hiện
1. Quan sát màu giá khớp lệnh của các dòng đang tăng/giảm/đứng giá/trần/sàn.

## Kết quả mong đợi
- [ ] Đúng quy ước: tăng=xanh lá, giảm=đỏ, đứng giá(tham chiếu)=vàng, trần=tím, sàn=xanh dương — khớp
      `getClassTextColorFromCL`.

---

# [TC_BANGGIA_33] Click vào dòng (ngoài mã) chỉ đổi mã đang chọn, KHÔNG mở modal

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên nhánh UI mới: Pass**
- **Cập nhật 2026-09-22:** cột "Ngành" (`.nganh`) đã bị gỡ khỏi dòng — đổi sang click cột giá "TC" thay thế,
  vẫn là 1 vùng "ngoài mã" hợp lệ.
- **Kết quả đo được:** Click vào vùng dòng (cột giá "TC") của 1 mã → KHÔNG có modal nào mở ra; tab border
  "Thông tin" (nếu xem sau đó) đổi sang hiển thị sổ lệnh đúng mã vừa click.

## Các bước thực hiện
1. Click vào 1 dòng mã ở vùng KHÔNG phải chữ mã CK (VD cột giá "TC").
2. Sau đó chuyển sang tab border "Thông tin".

## Kết quả mong đợi
- [ ] Không mở modal biểu đồ.
- [ ] Tab "Thông tin" hiển thị đúng sổ lệnh của mã vừa click.

---

# [TC_BANGGIA_34] Click text mã CK mở ĐỒNG THỜI modal biểu đồ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện hành vi kép**
- **Kết quả đo được:** Thẻ `<a>` chứa text mã CK nằm lồng trong `<div>` dòng (có `onClick` riêng) mà không gọi
  `stopPropagation()` → click vào đúng chữ mã CK kích hoạt CẢ HAI: (1) `showChart` mở modal biểu đồ của mã đó,
  VÀ (2) sự kiện click của dòng cha vẫn nổi bọt lên, cũng cập nhật mã đang chọn cho tab "Thông tin" — khác với
  click vào vùng khác của dòng (TC_BANGGIA_33) chỉ kích hoạt (2).

## Các bước thực hiện
1. Click trực tiếp vào chữ mã CK (VD "SHB") ở đầu dòng.

## Kết quả mong đợi
- [ ] Mở modal biểu đồ đúng mã vừa click.
- [ ] Tab "Thông tin" (kiểm tra sau khi đóng modal) cũng đã đổi sang đúng mã đó.

---

# [TC_BANGGIA_35] Modal biểu đồ không đóng được bằng phím Escape

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện hành vi giống bug đã ghi nhận**
- **Kết quả đo được:** Sau khi mở modal biểu đồ (TC_BANGGIA_34), nhấn Escape — modal (`CModal` CoreUI, class
  `modal-hide-header-footer`) **vẫn còn hiển thị**, giống hệt hành vi đã ghi nhận ở modal "Thêm mới Watchlist"
  của Dashboard (TC_DASHBOARD_PP_07) — không phải bug chặn luồng (vẫn đóng được bằng icon riêng của modal) nhưng
  là điểm UX nhất quán giữa các `CModal` trong hệ thống, nên báo dev nếu muốn Escape hoạt động.

## Các bước thực hiện
1. Mở modal biểu đồ (click 1 mã CK).
2. Nhấn phím Escape.
3. Đóng modal bằng icon đóng riêng của modal.

## Kết quả mong đợi
- [ ] Escape không đóng được modal (ghi nhận, không chặn luồng).
- [ ] Đóng bằng icon riêng thành công.

---

# [TC_BANGGIA_36] Ghim / bỏ ghim 1 mã

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC_30 (click icon ghim — app mô tả "tùy business", web xác nhận rõ: ghim lên khu vực cố
  định đầu bảng)
- **Kết quả đo được:** Click icon ghim ở 1 dòng trong danh sách chính → dòng chuyển sang khu vực ghim cố định
  (`#priceboard-pinned`, luôn hiển thị phía trên, không cuộn theo danh sách chính) — icon đổi tooltip thành
  "Nhấn để bỏ ghim"; click lại → dòng quay về đúng vị trí trong danh sách chính (icon kéo-thả xuất hiện lại).

## Các bước thực hiện
1. Click icon ghim (📌) ở 1 dòng bất kỳ trong danh sách chính.
2. Cuộn danh sách chính xuống — quan sát dòng vừa ghim.
3. Click lại icon ghim (giờ có tooltip "Nhấn để bỏ ghim") ở khu vực ghim.

## Kết quả mong đợi
- [ ] Dòng chuyển lên khu vực ghim, đứng yên khi cuộn danh sách chính.
- [ ] Bỏ ghim → dòng biến mất khỏi khu vực ghim, xuất hiện lại trong danh sách chính.

---

# [TC_BANGGIA_38] Cuộn ngang đồng bộ header + khu ghim + danh sách chính

- **Trạng thái:** 🆕 Testcase mới — **Đã verify qua đọc code**
- **Ghi chú:** 3 vùng (`#priceboard-header`, `#priceboard-pinned`, danh sách chính trong `#priceboard-list-item`)
  đồng bộ `scrollLeft` qua nhau bằng JS thủ công (`onScrollHeader`/`onScrollPinned`/`onScroll` của
  `CustomScrollbar`).

## Các bước thực hiện
1. Cuộn ngang danh sách chính (kéo thanh cuộn ngang hoặc Shift+wheel).

## Kết quả mong đợi
- [ ] Header cột và khu vực ghim (nếu có mã ghim) cuộn ngang theo đúng cùng vị trí, không bị lệch cột.

---

# [TC_BANGGIA_39] Dòng chú thích đơn vị giá/khối lượng cuối bảng

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát dòng cuối bảng ở chế độ "Toàn bộ" (Cổ phiếu).
2. Chuyển sang "Phái sinh", quan sát lại dòng cuối bảng.

## Kết quả mong đợi
- [ ] Cổ phiếu: "Giá x 1000 VNĐ. Khối lượng x 1CP".
- [ ] Phái sinh: "Giá x 100.000 VNĐ. Khối lượng x 1HĐ".

---

## Nhóm E: Panel border phải (component riêng — chưa test ở file nào khác)

# [TC_BANGGIA_40] Tab "IBD" (mặc định)

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Nội dung tương tự tab IBD ở Dashboard (đã test kỹ ở
  [dashboard-panel-phai.md](dashboard-panel-phai.md) TC_DASHBOARD_PP_01/02) nhưng dùng component KHÁC
  (`dashboard_bk/analysisIBD.vue` thay vì `dashboard/board/tabs/IBD.vue`) — chỉ xác nhận hiển thị đúng, không
  lặp lại chi tiết từng sub-tab.

## Các bước thực hiện
1. Quan sát tab "IBD" (mặc định active).

## Kết quả mong đợi
- [ ] Hiển thị 3 sub-tab: "Nhịp đập TT" (active mặc định), "Nỗ lực - Kết quả", "Sức khỏe TT".
- [ ] Nội dung mặc định "Tổng quan thị trường chung" (MA10/MA20/MA50, Tâm lý, Rủi ro, xu hướng, Ngày phân phối).

---

# [TC_BANGGIA_43] Tab "Watchlist" (border) — component riêng, khác `/watchlist` và khác panel Dashboard

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế, phát hiện đáng chú ý**
- **Phát hiện đáng chú ý:** Component `TabWatchlist` được gọi với prop **`page="dashboard"` cố định** trong
  `reactLayoutIBD.js` (`factory()`), dù đang chạy trong ngữ cảnh `/bang-gia` chứ không phải Dashboard — cần xác
  nhận với dev đây có phải chủ đích (component tự dùng chung `page` để phân biệt hành vi hiển thị) hay là sao
  chép nhầm khi tách code từ Dashboard, vì có thể ảnh hưởng tới 1 số nhánh hiển thị điều kiện theo `page` bên
  trong `TabWatchlist` (chưa đọc sâu toàn bộ 1299 dòng của component để xác định chính xác nhánh nào bị ảnh
  hưởng — nằm ngoài phạm vi sinh lần này).

## Các bước thực hiện
1. Chuyển sang tab border "Watchlist".

## Kết quả mong đợi
- [ ] Hiển thị dropdown chọn watchlist + icon lọc + tab "Danh sách", danh sách mã trong watchlist đang chọn của
      tài khoản.
- [ ] Không lỗi JS dù `page="dashboard"` cố định.

---

# [TC_BANGGIA_44] Tab "Cảnh báo" (border)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Chuyển sang tab border "Cảnh báo".

## Kết quả mong đợi
- [ ] Hiển thị danh sách cảnh báo cổ phiếu của tài khoản (hoặc trạng thái rỗng hợp lệ), không lỗi JS.

---

# [TC_BANGGIA_45] Tab "Ghi chú" (border)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Chuyển sang tab border "Ghi chú".

## Kết quả mong đợi
- [ ] Hiển thị icon "Thêm mới ghi chú", tiêu đề "KungFuStocksPro Note", ô tìm kiếm, danh sách ghi chú (hoặc
      trạng thái rỗng).

---

# [TC_BANGGIA_46] Tab "Cộng đồng" (border) — dùng đúng component `/cong-dong` với `rightTab=true`

- **Trạng thái:** 🆕 — **Đã verify thực tế, khớp hành vi đã ghi nhận ở Dashboard**
- **Ghi chú:** Đây là component `Feed.vue`/`Post.vue` GIỐNG HỆT `/cong-dong` (không phải wrapper riêng như
  Dashboard's `Social.vue`), chỉ truyền `rightTab={true}` — hành vi khi `rightTab=true` (ẩn tab "AI Cập Nhật",
  ẩn thanh soạn bài) đã được test đầy đủ ở [dashboard-panel-phai.md](dashboard-panel-phai.md)
  TC_DASHBOARD_PP_16/17 — ở đây chỉ xác nhận lại ngắn gọn.

## Các bước thực hiện
1. Chuyển sang tab border "Cộng đồng".

## Kết quả mong đợi
- [ ] Hiển thị đúng 3 tab: "Mới nhất" (active mặc định), "Quan tâm", "Phổ biến" — KHÔNG có tab "AI Cập Nhật".
- [ ] KHÔNG hiển thị thanh soạn bài "Bạn có nhận định gì muốn chia sẻ?".

---

## Nhóm F: Tài khoản Free vs tài khoản đầy đủ

> **⚠️ BẮT BUỘC khi viết test tài khoản Free (mọi màn, không riêng Bảng giá) — modal "Chọn dịch vụ" chặn click:**
> `TheContainer.vue` bật `CModal title="Chọn dịch vụ"` qua `$store.state.isShowModalPackage`. Với tài khoản
> Free, modal này **tự bật ngay sau khi đăng nhập** (đã đo xác nhận 2026-09-22), backdrop che toàn màn nên MỌI
> click sau đó bị chặn → test timeout ~30s với thông báo rất khó hiểu (không hề nhắc tới modal). Vì modal chỉ
> bật theo phiên/thời điểm nên lỗi trông y như flaky: cùng 1 test lúc pass lúc timeout.
> **Cách xử lý:** sau khi đăng nhập Free (và sau khi vào trang), gọi helper `dismissPackageModalIfShown(page)`
> trong `tests/bang-gia.spec.ts` — tìm `.modal.show, .modal.d-block` có text "Chọn dịch vụ" rồi click
> `button.close`. Đã kiểm chứng: đóng xong click lại bình thường. Nút "Đăng ký ngay" trong `ProtectedView`
> cũng mở đúng modal này (`store.state.isShowModalPackage = true`) — dùng được để chủ động tái hiện khi debug.

# [TC_BANGGIA_48] Tài khoản Free xem đầy đủ bảng giá thời gian thực (không bị giới hạn)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (tài khoản Free thật): Pass**
- **Kết quả đo được:** Đọc code xác nhận `isAccountFree` **KHÔNG được truyền** vào `LiveBoard` (chỉ truyền cho
  `TableNganh`/`FilterCanslim`/`RRG` ở `ibd/wrapperLayout.vue` khi `type` khác `"price-board"`) — đã verify
  bằng automation với `FREE_USER_EMAIL=levanhieu250204_test@gmail.com`: bảng giá chính ở `/bang-gia` hiển thị
  đầy đủ, không có giới hạn nào cho tài khoản Free, đúng như dự đoán từ code.

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free.
2. Vào `/bang-gia`, quan sát toàn bộ bảng dữ liệu, toolbar, cột.

## Kết quả mong đợi
- [ ] Hiển thị đầy đủ mọi cột/dòng/toolbar giống hệt tài khoản đầy đủ, không có `ProtectedView`/khoá tính năng
      nào trên chính bảng giá.

---

# [TC_BANGGIA_49] Tài khoản Free — tab "Ghi chú" BỊ KHOÁ

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Cập nhật 2026-09-22 (ĐẢO NGƯỢC kỳ vọng so với bản ghi 2026-08-20):** người dùng xác nhận kỳ vọng nghiệp vụ
  đúng là **tài khoản Free PHẢI bị khoá** tab "Ghi chú". Đo lại bằng automation trên nhánh UI mới: đúng như
  vậy — `ProtectedView featureName="ghi_chu"` ĐANG hiện (ảnh mờ + thông điệp nâng cấp). Bản ghi cũ ("KHÔNG bị
  khoá", đo 2026-08-20) nay đã lỗi thời — nhiều khả năng do cấu hình `features_disabled` phía server của tài
  khoản Free đã được chỉnh lại, hoặc nhánh mới sửa lại gate.
- **⚠️ Bài học về assertion cũ (quan trọng, tránh lặp lại ở màn khác):** 2 assertion cũ đều KHÔNG đủ sức phân
  biệt trạng thái khoá:
  1. `getByText(/Nâng cấp/i)` — chữ "Bạn cần nâng cấp gói hội viên…" và nút "Đăng ký ngay" trong
     `ProtectedView.vue` **chỉ render khi hover** (`isButtonVisible` mặc định `false`), nên lúc bị khoá mà
     không hover thì vẫn đếm được 0 → tưởng nhầm là "không khoá".
  2. `getByText('KungFuStocksPro Note')` — dòng tiêu đề này nằm ở header NGOÀI vùng bị gate
     (`TabNote/index.vue` dòng 18, gate bắt đầu dòng 31) nên **luôn hiển thị ở cả 2 trạng thái**.
  Cách nhận biết đúng: ảnh mờ `.image-container .blurred-image` của `ProtectedView` (chỉ tồn tại khi bị khoá).
  Khi hover để lộ thông điệp, phải dùng `hover({ force: true })` vì overlay `.register-content-center` bung ra
  ĐÈ LÊN chính tấm ảnh, khiến Playwright coi là "bị che" và retry tới timeout.

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free.
2. Chuyển sang tab border "Ghi chú".
3. Rê chuột vào vùng nội dung bị khoá.

## Kết quả mong đợi
- [ ] Nội dung tab "Ghi chú" bị che bằng `ProtectedView` (ảnh mờ), KHÔNG xem được ghi chú.
- [ ] Khi hover: hiện thông điệp "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này." + nút "Đăng ký ngay".

---

# [TC_BANGGIA_50] Tài khoản Free — "Phái sinh" > "Thống kê HĐTL" BỊ KHOÁ

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Cập nhật 2026-09-22 (ĐẢO NGƯỢC kỳ vọng so với bản ghi 2026-08-20):** người dùng xác nhận tài khoản Free
  **không xem được** "Thống kê HĐTL". Đo lại trên nhánh UI mới: đúng — `ProtectedView
  featureName="bang_gia_thong_ke_hdtl"` ĐANG hiện. Cùng nguyên nhân/bài học assertion như TC_BANGGIA_49.

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free.
2. Vào "Phái sinh" > "Thống kê HĐTL".
3. Rê chuột vào vùng nội dung bị khoá.

## Kết quả mong đợi
- [ ] Bảng lịch sử HĐTL bị che bằng `ProtectedView` (ảnh mờ), KHÔNG xem được dữ liệu.
- [ ] Khi hover: hiện thông điệp "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này." + nút "Đăng ký ngay".

---

## Nhóm G: Responsive & điều hướng trình duyệt

# [TC_BANGGIA_51] Responsive ở viewport hẹp (≤630px)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify qua đọc code**
- **Ghi chú:** Ngưỡng `is_mobile_device` (`ResizeObserver`, width ≤ 630px) khác ngưỡng CSS thường (768px) —
  dưới ngưỡng này, `DropdownBoard` chuyển từ dạng thanh nav ngang (`renderFloatList`) sang 1 dropdown gọn
  (`renderDopdownList`); `DropdownDepartment`/`DropdownWatchlist`/`KfspDropdown` chuyển xuống dòng riêng bên
  dưới thay vì cùng hàng.

## Các bước thực hiện
1. Thu nhỏ viewport xuống ≤630px chiều rộng (trong khung chứa bảng giá).

## Kết quả mong đợi
- [ ] Toolbar chuyển sang dạng dropdown gọn thay vì dãy nút ngang, không tràn/vỡ layout.

---

# [TC_BANGGIA_52] Nút Back trình duyệt

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Từ `/bang-gia`, điều hướng sang 1 màn khác (VD `/dashboard`).
2. Bấm nút Back của trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng `/bang-gia`, hiển thị lại đầy đủ layout (bố cục khôi phục từ `ibd_layout` đã lưu).

---

## Tổng hợp trạng thái (46 testcase)

Đã tự động hoá bằng Playwright: [tests/bang-gia.spec.ts](../tests/bang-gia.spec.ts)
(POM: [pages/BangGiaPage.ts](../pages/BangGiaPage.ts)).

**Cập nhật 2026-09-22 (nhánh UI mới):** tổng số đổi **52 → 46**. Đã xoá 7 case (theo quy ước: tính năng không
còn trên UI thì xoá hẳn, không giữ N/A) và thêm 1:
| Case đã xoá | Lý do |
|---|---|
| `TC_BANGGIA_20` | Công tắc dark/light riêng cho bảng giá đã bị gỡ khỏi UI |
| `TC_BANGGIA_42`, `TC_BANGGIA_47` | Tab border "Bài viết"/"Chatbot" đã bị gỡ khỏi panel phải |
| `TC_BANGGIA_16`, `TC_BANGGIA_17` | Nút "Thêm mã" (modal thêm mã vào watchlist) đã bị dev GỠ khỏi màn Bảng giá từ 2026-09-16 (comment trong `dropdownWatchlist.js` ~dòng 153: "Thêm mã vào watchlist làm ở màn /watchlist") — chức năng nay thuộc phạm vi [watchlist.md](watchlist.md) |
| `TC_BANGGIA_37` | Kéo-thả đổi vị trí dòng — người dùng xác nhận chưa có chức năng này |
| `TC_BANGGIA_41` | Tab "Thông tin" (sổ lệnh mã đang chọn) — người dùng yêu cầu bỏ |
| **Case đã thêm** | |
| `TC_BANGGIA_53` | Nghi vấn bug nút "Ẩn/hiện các cột" (`test.fixme`, chờ dev xác nhận hành vi đúng) |

**Trạng thái chạy automation (nhánh UI mới, đo bằng `--workers=1` trên `http://localhost:8080` — chưa merge lên
production):**
- **43/46 có code tự động hoá** (không `test.fixme`) — đã fix xong toàn bộ locator/hành vi vỡ do 2 đợt đổi UI
  liên tiếp trong ngày 2026-09-22 (segment-control → dropdown gộp sàn + overflow filter panel).
- **3/46 `test.fixme`** — `TC_BANGGIA_07` (giả lập kéo resize border), `TC_BANGGIA_38` (đo `scrollLeft` 3 vùng),
  `TC_BANGGIA_53` (chờ dev xác nhận bug) — xem bảng trong [TRACKER.md](../TRACKER.md).
- Tab "Bài viết"/"Chatbot" không còn tồn tại trên nhánh này → nghi vấn flaky cũ của TC_BANGGIA_03/42/47 (mục
  "Phát hiện đáng chú ý" #1 bên dưới) coi như đã được GIẢI ĐÁP (2 tab đơn giản không còn render vì không còn
  tồn tại) — TC_BANGGIA_03 giữ lại (đổi expect 6 tab), TC_BANGGIA_42/47 đã xoá.

**Cập nhật 2026-09-22 (ĐẢO NGƯỢC kết luận cũ về phân quyền Free):** ~~tính năng "Ghi chú" và "Phái sinh >
Thống kê HĐTL" KHÔNG bị khoá cho tài khoản Free~~ — kết luận ghi ngày 2026-08-20 nay **đã sai/lỗi thời**. Theo
xác nhận kỳ vọng nghiệp vụ từ người dùng + đo lại bằng automation trên nhánh UI mới: **cả 2 tính năng đều BỊ
KHOÁ đúng như thiết kế** với tài khoản Free (`ProtectedView` hiện ảnh mờ + thông điệp nâng cấp). TC_BANGGIA_49/50
đã được viết lại theo kỳ vọng đúng và **pass**. Lý do bản ghi cũ sai gồm 2 phần: (1) cấu hình
`features_disabled` phía server của tài khoản Free nhiều khả năng đã được chỉnh lại từ 2026-08-20 tới nay;
(2) quan trọng hơn — **2 assertion cũ vốn không đủ sức phát hiện trạng thái khoá** (dựa vào chữ "Nâng cấp" chỉ
hiện khi hover, và chữ "KungFuStocksPro Note" nằm ngoài vùng bị gate nên luôn hiện) → test cũ "pass" nhưng
pass sai. Xem phân tích đầy đủ ở TC_BANGGIA_49.

**Phát hiện đáng chú ý:**
1. **✅ ĐÃ GIẢI ĐÁP trên nhánh UI mới 2026-09-22 (nghi vấn bug lịch sử, giữ lại làm tư liệu):** tab border
   **"Bài viết"** và **"Chatbot"** trên nhánh này đã bị GỠ BỎ HOÀN TOÀN khỏi `DEFAULT_BORDER_LAYOUT` — không
   còn tình trạng "đôi khi không render" nữa vì 2 tab đó không còn tồn tại (panel border giờ ổn định 6/6 mọi
   lần). Ghi chú lịch sử bên dưới mô tả hành vi quan sát được TRÊN BẢN UI TRƯỚC nhánh này (vẫn có thể còn đúng
   trên production tại thời điểm ghi) — giữ lại để đối chiếu nếu vấn đề tái xuất hiện dưới dạng khác.
   Ban đầu, ảnh hưởng TC_BANGGIA_03/42/47 (2 case sau đã bị xoá khỏi bộ testcase theo đúng thay đổi UI). Đã loại
   trừ khả năng do component mount chậm (chờ/poll 15 giây liên tục trên cùng 1
   lần tải vẫn đứng yên ở 6/8, không tự tăng lên 8) — có vẻ 1 lần tải nào đó bị lỗi (nghi vấn: 1 chunk JS lazy-
   load của 2 component nặng nhất (`TabNews` 733 dòng, `Chatbot` 941 dòng) load thất bại nhưng không có cơ chế
   retry/fallback/error-boundary, khiến tab biến mất im lặng thay vì báo lỗi cho người dùng) — nhưng đây chỉ là
   giả thuyết, **cần dev xác nhận trực tiếp trên hệ thống log/monitoring thật**, vì không tái hiện được theo ý
   muốn (có lúc 8/8 tab hiện đủ nhiều lần liên tiếp, có lúc 6/8 nhiều lần liên tiếp trong cùng 1 lượt chạy
   test, đổi giữa các lượt `npx playwright test` khác nhau). Test đã được viết để KHÔNG che giấu vấn đề này
   (fail rõ ràng kèm thông báo trỏ về đúng phát hiện này) thay vì tự động thử lại cho tới khi pass.
2. **Modal biểu đồ (`showModalChart`, CoreUI `CModal`) không đóng được bằng phím Escape** (TC_BANGGIA_35) —
   cùng dạng với bug/UX-gap đã ghi nhận ở modal "Thêm mới Watchlist" của Dashboard (TC_DASHBOARD_PP_07). Có vẻ
   là vấn đề chung của mọi `CModal` dùng class `modal-hide-header-footer` trong hệ thống — đáng báo dev xử lý ở
   mức component chung thay vì từng nơi.
3. **Click vào text mã CK kích hoạt đồng thời 2 hành vi** (mở modal biểu đồ + đổi mã đang chọn cho tab "Thông
   tin") do thiếu `stopPropagation()`, trong khi click vùng khác của dòng chỉ đổi mã đang chọn — hành vi có vẻ
   chủ đích nhưng nên xác nhận lại với dev vì không có tài liệu nào mô tả rõ 2 hành vi khác nhau này.
4. **`TabWatchlist` (tab border "Watchlist") nhận prop `page="dashboard"` cố định** dù đang chạy ở `/bang-gia`
   (TC_BANGGIA_43) — nghi vấn copy-paste khi tách code, cần dev xác nhận có ảnh hưởng gì tới nhánh hiển thị điều
   kiện theo `page` bên trong component hay không (function nằm ngoài phạm vi đọc sâu của lần sinh này).
5. **8 tab border phải dùng bộ component hoàn toàn khác** với panel phải của Dashboard V3 đang chạy mặc định
   (dùng lại từ Dashboard V2/`multiLayoutChart` cũ) — nghĩa là đây là lần đầu tiên các component này
   (`TabWatchlist`, `TabAlert`, `TabNote`, `TabNews`, `ReactTabInfo`, `Chatbot`) được đưa vào bộ testcase.
6. ~~Cột "Sàn CK" tự ẩn khi lọc theo 1 sàn cụ thể (chỉ hiện ở "Toàn bộ")~~ — **đã lỗi thời:** trên nhánh UI mới
   2026-09-22, cột "Sàn CK" (và "Ngành") đã bị gỡ bỏ HOÀN TOÀN khỏi mọi trạng thái sàn, không còn hành vi
   ẩn/hiện có điều kiện này nữa.
7. **[ĐÃ ĐÍNH CHÍNH 2026-09-22] Phân quyền tài khoản Free — kết luận cũ SAI, nay đã sửa:** bản ghi ngày
   2026-08-20 từng kết luận "Ghi chú" và "Phái sinh > Thống kê HĐTL" **KHÔNG** bị khoá với tài khoản Free. Nay
   xác nhận **cả 2 tính năng ĐỀU BỊ KHOÁ đúng thiết kế** (`ProtectedView` hiện ảnh mờ + thông điệp nâng cấp) —
   đo lại bằng automation, TC_BANGGIA_49/50 viết lại theo kỳ vọng đúng và pass. **Nguyên nhân kết luận cũ
   sai — bài học quan trọng cho mọi màn có `ProtectedView`:** 2 assertion cũ không đủ sức phát hiện trạng thái
   khoá, nên test "pass" nhưng pass sai:
   - Bắt chữ "Nâng cấp"/"Đăng ký ngay": các phần tử này trong `ProtectedView.vue` **chỉ render khi hover**
     (`isButtonVisible` mặc định `false`) → không hover thì luôn đếm được 0, kể cả lúc đang bị khoá.
   - Bắt text tiêu đề của tab (VD "KungFuStocksPro Note"): tiêu đề nằm ở header **ngoài** vùng bị gate nên luôn
     hiển thị ở cả 2 trạng thái.
   → Cách đúng: kiểm tra ảnh mờ `.image-container .blurred-image` (chỉ tồn tại khi `ProtectedView` render). Nếu
   muốn kiểm tra thêm thông điệp nâng cấp thì phải `hover({ force: true })` vì overlay bung ra đè lên chính
   tấm ảnh. **Khuyến nghị:** rà lại các testcase phân quyền Free ở những màn khác (đang dùng cùng kiểu assertion
   "đếm chữ Nâng cấp") — rất có thể cũng đang pass sai.
8. **`localStorage.ibd_layout` KHÔNG được ghi ngay khi vào trang** — `onModelChange` (hàm ghi key này) của
   `flexlayout-react` chỉ được gọi khi model layout thực sự đổi (chọn tab border, resize...), không tự chạy
   lúc mount. Đã verify bằng automation: kiểm tra key này ngay sau khi tải trang (chưa tương tác gì) cho kết
   quả `null`; phải click 1 tab border trước thì key mới xuất hiện (TC_BANGGIA_04).
9. **Danh sách mã mặc định lúc mới vào trang KHÔNG phải là kết quả thật của thuật toán sort** dù state khởi
   tạo ghi `column_sort:"stockcode", type_sort:"asc"` — đó chỉ là thứ tự nguyên bản mảng `stockcode` mà API
   `getdatainitpriceboard` trả về (trông giống tăng dần với phần lớn dữ liệu nhưng không xử lý đúng các mã có
   ký tự đặc biệt như "^MU" ở đầu bảng chữ cái). Chỉ sau khi người dùng CHỦ ĐỘNG click sort, thuật toán
   `localeCompare` thật mới chạy trên toàn bộ dữ liệu (TC_BANGGIA_28/29) — 2 khái niệm "asc" (label mặc định
   vs. kết quả sort thật) không hoàn toàn tương đương, đáng lưu ý nếu có yêu cầu đồng bộ.
10. **[NGHI VẤN BUG THẬT, MỚI 2026-09-22] Nút "Ẩn/hiện các cột" mở nhầm modal "Chi tiết sự kiện"** — xem chi
    tiết đầy đủ ở TC_BANGGIA_53. Đã loại trừ khả năng do overlay panel "Bộ lọc" còn mở chồng lấp (đã thử đóng
    panel trước khi click, vẫn tái hiện y hệt) — nghi vấn nhầm lẫn ref/id modal dùng chung giữa 2 tính năng
    không liên quan trong codebase.
11. **[NGHI VẤN, MỚI 2026-09-22] Tài khoản test có thể rơi vào trạng thái "kẹt" sau nhiều lần đổi sàn/Phái
    sinh/bộ lọc liên tục trong thời gian ngắn** — dropdown "Danh sách sàn" hiện nhãn rỗng "Sàn" (không phải tên
    sàn cụ thể nào) kèm bảng dữ liệu trống hoàn toàn, dù tải lại trang nhiều lần vẫn giữ nguyên trạng thái này.
    Phục hồi được bằng cách mở dropdown và chọn "Toàn bộ" thủ công (không cần đăng nhập lại). Nghi ngờ 1 tổ hợp
    state server-side (`type_list`/`type_board`/`current_category_id`, lưu qua `saveMultiSettings`) bị ghi
    không nhất quán khi nhiều request đổi state gối lên nhau quá nhanh — CHƯA xác định chắc chắn đây là bug thật
    ảnh hưởng người dùng thường (thao tác tay khó nhanh bằng automation) hay chỉ là rủi ro riêng khi test tự
    động thao tác dồn dập — cần dev xác nhận nếu muốn loại trừ hẳn khả năng người dùng thật gặp phải.
