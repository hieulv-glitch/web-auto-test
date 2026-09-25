# Màn hình: Phân tích kỹ thuật — Khu vực Biểu đồ

- **URL:** `/phan-tich-ky-thuat` — tài liệu con của [phan-tich-ky-thuat.md](phan-tich-ky-thuat.md) (đọc tài liệu
  đó trước để biết bối cảnh route/component/an toàn dữ liệu chung).
- **Component:** [ReactChartTA.vue](../../stocks/src/views/multiLayoutChart/ReactChartTA.vue) (32KB) — wrapper Vue
  quanh **TradingView Charting Library** (`public/js_ver_28_3/charting_library`), nhúng qua `<iframe>` riêng cho
  MỖI tab biểu đồ. Toàn bộ toolbar/canvas/drawing tool nằm TRONG iframe này.
- **Phạm vi:** chi tiết khu vực biểu đồ của TAB ĐANG ACTIVE — tìm/đổi mã, khung thời gian, kiểu nến, chỉ báo kỹ
  thuật (fx), toolbar vẽ trái, 2 dropdown tự viết "Biểu đồ ▾"/"NKGD ▾", preset khoảng thời gian dưới biểu đồ,
  lưu cấu hình, giới hạn theo gói hội viên. **Việc quản lý NHIỀU tab/khung** (thêm/xóa/liên kết màu) đã có ở
  [phan-tich-ky-thuat.md](phan-tich-ky-thuat.md).
- **⚠️ Giới hạn kỹ thuật quan trọng:** nội dung vẽ THẬT trên canvas (nến, đường chỉ báo, hình vẽ tay) **KHÔNG thể
  assert bằng locator/text thông thường** — TradingView Charting Library render bằng `<canvas>` thuần, không có
  DOM cho từng nến/đường vẽ. Testcase dưới đây CHỈ verify được qua: (1) trạng thái/tồn tại của các nút toolbar
  (`data-name`, class active/inactive), (2) nội dung TEXT thật trong DOM của legend (`[data-name="legend-source-
  item"]` — tên chỉ báo HIỂN THỊ DẠNG TEXT, không phải canvas), (3) popup/dropdown mở đúng nội dung, (4) tab
  panel "Thông tin" đồng bộ đúng mã sau khi đổi. KHÔNG viết assertion giả cho việc "đã vẽ đúng vị trí" trên canvas.
- **Nguồn:** đọc `ReactChartTA.vue` toàn bộ (bao gồm 2 nút tự viết `tvWidget.createButton()`: "Biểu đồ ▾"/"NKGD
  ▾", nút "Tải lại Biểu đồ" chỉ cho `moderator`) + đo DOM thật bên trong iframe (dump toàn bộ `data-name`/`title`
  của header toolbar, legend, toolbar vẽ trái, preset khoảng thời gian — TradingView Charting Library dùng
  `data-name` ổn định cho hầu hết control).
- **Quy ước trạng thái:** giống [phan-tich-ky-thuat.md](phan-tich-ky-thuat.md).

---

## Nhóm: Tìm & đổi mã CK

# [TC_PTKT_BD_01] Tìm và chọn mã CK mới qua ô tìm kiếm header

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng "kính lúp tìm mã" trong Sheet
- **Ghi chú:** Ô tìm kiếm (`#header-toolbar-symbol-search`, icon 🔍 + tên mã) là widget GỐC của TradingView
  Charting Library (KHÔNG phải input Vue tự viết) — click mở overlay tìm kiếm, gõ mã rồi Enter/click kết quả để
  đổi mã cho ĐÚNG tab đang active.

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới (dùng để test, không đụng tab có sẵn).
2. Click ô tìm kiếm mã ở góc trái toolbar trên.
3. Gõ "VNINDEX", nhấn Enter.

## Kết quả mong đợi
- [ ] Overlay tìm kiếm mở ra khi click.
- [ ] Sau khi chọn, tên tab đổi thành "VNINDEX 1D" (hoặc khung thời gian hiện tại), biểu đồ hiển thị dữ liệu mã
      mới.
- [ ] Panel phải "Thông tin" tự đồng bộ hiển thị "Chỉ số VNINDEX" (xem chi tiết ở
      [phan-tich-ky-thuat-thong-tin.md](phan-tich-ky-thuat-thong-tin.md)).
- [ ] **Dọn dẹp:** xóa lại tab đã thêm.

---

# [TC_PTKT_BD_02] Đổi mã sang mã cổ phiếu thường khác

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới.
2. Đổi mã sang 1 mã cổ phiếu thường (VD "FPT") qua ô tìm kiếm.

## Kết quả mong đợi
- [ ] Tên tab đổi đúng theo mã mới.
- [ ] Panel phải "Thông tin" hiển thị đúng nhánh Stockcode (header có tên công ty + link + icon chuông).
- [ ] **Dọn dẹp:** xóa lại tab đã thêm.

---

## Nhóm: Khung thời gian & Kiểu biểu đồ

# [TC_PTKT_BD_03] Đổi khung thời gian (interval) cập nhật tên tab

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng nhóm nút "D" (timeframe) trong Sheet
- **Ghi chú:** `handleOnIntervalChanged()` chỉ tự đổi tên tab nếu `is_changed_name = false` (chưa đổi tên tay —
  xem TC_PTKT_10 trong tài liệu shell).
- **⚠️ ĐÍNH CHÍNH (đo lại DOM thật):** tên tab dùng ĐÚNG mã interval NỘI BỘ của TradingView, không phải nhãn hiển
  thị trên nút bấm — khung "1 giờ" có nhãn nút "1h" nhưng mã interval nội bộ là "60" (phút), tab đổi thành
  "ACB 60" chứ KHÔNG phải "ACB 1h".

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới.
2. Đổi khung thời gian từ "D" sang "1 giờ" (click nút interval trong toolbar).

## Kết quả mong đợi
- [ ] Biểu đồ tải lại dữ liệu theo khung thời gian mới.
- [ ] Tên tab đổi đúng hậu tố theo mã interval nội bộ (VD "ACB 60" cho khung "1 giờ", thay vì "ACB D").
- [ ] **Dọn dẹp:** xóa lại tab đã thêm.

---

# [TC_PTKT_BD_04] Mở dropdown chọn kiểu biểu đồ (style nến)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** Widget gốc TradingView, icon kiểu nến trên toolbar trên. Chỉ verify dropdown MỞ đúng danh sách
  kiểu biểu đồ (Nến/Nến rỗng/Đường/Vùng...) — việc CHỌN 1 kiểu có đổi đúng canvas hay không thuộc giới hạn không
  assert được (xem đầu tài liệu).

## Các bước thực hiện
1. Click icon kiểu biểu đồ (cạnh nút timeframe) trên toolbar trên của tab đang active.

## Kết quả mong đợi
- [ ] Dropdown mở ra với danh sách các kiểu biểu đồ.

---

## Nhóm: Chỉ báo kỹ thuật (fx)

# [TC_PTKT_BD_05] Mở dialog tìm & thêm chỉ báo kỹ thuật

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng icon "fx" trong Sheet
- **Ghi chú:** `[data-name="open-indicators-dialog"]` mở dialog gốc TradingView. Sau khi thêm, tên chỉ báo xuất
  hiện dạng TEXT thật trong legend góc trên-trái biểu đồ (`[data-name="legend-source-item"]`) — đây là điểm DUY
  NHẤT của tính năng chỉ báo assert được ổn định bằng Playwright (nội dung đường vẽ trên canvas thì không).
- **⚠️ Kỹ thuật thao tác quan trọng (đo lại qua automation thật):** dialog KHÔNG tự highlight sẵn 1 kết quả nào
  để phím Enter chọn — bấm Enter sau khi gõ "RSI" KHÔNG thêm được chỉ báo nào (không lỗi, chỉ im lặng không làm
  gì). PHẢI click trực tiếp vào dòng kết quả (`[data-role="list-item"]`, ổn định bất kể ngôn ngữ hiển thị). Kết
  quả ĐẦU TIÊN khi gõ "RSI" hiển thị tên tiếng Việt "Chỉ số Sức mạnh tương đối" (KHÔNG chứa chữ "RSI") nhưng khi
  đã thêm vào biểu đồ, legend lại hiển thị đúng tên viết tắt "RSI" — 2 chuỗi khác nhau, không dùng chung để vừa
  tìm kết quả vừa verify legend.

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới.
2. Click icon "fx" (mở dialog chỉ báo).
3. Gõ tìm "RSI", chọn kết quả đầu tiên để thêm.

## Kết quả mong đợi
- [ ] Dialog tìm chỉ báo mở ra, gõ "RSI" lọc đúng kết quả liên quan.
- [ ] Sau khi thêm, legend biểu đồ xuất hiện thêm 1 mục chứa text "RSI".
- [ ] **Dọn dẹp:** xóa lại tab đã thêm (xóa cả tab sẽ xóa luôn chỉ báo vừa thêm, không cần xóa riêng).

---

# [TC_PTKT_BD_06] Xóa chỉ báo vừa thêm qua legend

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** Hover vào mục chỉ báo trong legend hiện nút "Loại bỏ" (title xác nhận qua DOM thật).

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới, thêm chỉ báo "RSI" (như TC_PTKT_BD_05).
2. Hover vào mục "RSI" trong legend, click nút "Loại bỏ".

## Kết quả mong đợi
- [ ] Mục "RSI" biến mất khỏi legend.
- [ ] **Dọn dẹp:** xóa lại tab đã thêm.

---

## Nhóm: 2 dropdown tự viết ("Biểu đồ ▾" / "NKGD ▾")

# [TC_PTKT_BD_07] Dropdown "Biểu đồ ▾" — toggle ẩn/hiện sự kiện & giao dịch cổ đông lớn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Nút tự viết bằng `tvWidget.createButton()` (KHÔNG phải TradingView gốc), CHỈ hiện với tài khoản
  KHÔNG Free (`!store.state.isAccountFree`, xem TC_PTKT_BD_15). Menu có đúng 2 mục, label đổi "Ẩn"⇄"Hiện" theo
  trạng thái hiện tại (`datafeed._supports_marks`/`_supports_timescale_marks`), lưu vào
  `localStorage`/`store.saveSetting` khi click.

## Các bước thực hiện
1. Ở tab biểu đồ đang active, click nút "Biểu đồ ▾".
2. Quan sát 2 mục menu, click mục đầu tiên.

## Kết quả mong đợi
- [ ] Menu hiện đúng 2 mục: "Ẩn/Hiện giao dịch cổ đông lớn" và "Ẩn/Hiện sự kiện" (label thực tế bắt đầu bằng
      "Ẩn" nếu đang hiện mặc định).
- [ ] Sau khi click 1 mục, label của mục đó đổi ngược lại (Ẩn ⇄ Hiện), menu tự đóng.

---

# [TC_PTKT_BD_08] Dropdown "NKGD ▾" — submenu chọn loại giao dịch

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** 3 mục: "Ẩn/Hiện lịch sử giao dịch", "Chọn danh mục »" (submenu load từ API
  `/api/stocks/category/get-all`), "Chọn loại giao dịch »" (submenu 3 checkbox Mua/Bán/Cổ tức-Quyền, lưu vào
  `tradingview.tradinglog_setting`).

## Các bước thực hiện
1. Click nút "NKGD ▾".
2. Hover vào "Chọn loại giao dịch »".

## Kết quả mong đợi
- [ ] Menu chính hiện đúng 3 mục.
- [ ] Hover mở submenu hiện đúng 3 checkbox: "Mua", "Bán", "Cổ tức/Quyền" (mặc định đều tick).

---

# [TC_PTKT_BD_09] Nút "Tải lại Biểu đồ" — chỉ hiện với tài khoản moderator

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `isModerator` đọc từ `localStorage.roles` (chứa `"moderator"`). Tài khoản test chính
  (`TEST_USER_EMAIL`) CÓ role này (đã xác nhận nút hiển thị qua DOM thật). Tài khoản Free dùng để đối chứng KHÔNG
  có nút này.

## Các bước thực hiện
1. Với tài khoản chính (`TEST_USER_EMAIL`), quan sát toolbar trên của tab biểu đồ.
2. Đăng nhập tài khoản Free, quan sát lại toolbar.

## Kết quả mong đợi
- [ ] Tài khoản chính: nút "Tải lại Biểu đồ" hiển thị.
- [ ] Tài khoản Free: nút "Tải lại Biểu đồ" KHÔNG hiển thị (đồng thời cả 2 nút "Biểu đồ ▾"/"NKGD ▾" cũng ẩn — xem
      TC_PTKT_BD_15).

---

## Nhóm: Toolbar vẽ trái

# [TC_PTKT_BD_10] Toolbar vẽ hiển thị đủ các nhóm công cụ

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng thanh công cụ vẽ trong Sheet (line/horizontal/fibonacci/text/emoji/thước đo/
  zoom/magnet/khóa/ẩn-hiện/xóa)
- **Ghi chú:** Đọc `data-name` thật từ DOM: 8 nhóm icon vẽ (`linetool-group-cursors` · `-trend-line` ·
  `-gann-and-fibonacci` · `-patterns` · `-prediction-and-measurement` · `-geometric-shapes` · `-annotation` ·
  `-font-icons`) + 8 tiện ích riêng lẻ (`measure` · `zoom` · `magnet-button` · `lockAllDrawings` · `hide-all` ·
  `removeAllDrawingTools` · `showObjectsTree` · `toolbar-drawing-toggle-button`).

## Các bước thực hiện
1. Quan sát toolbar dọc bên trái của tab biểu đồ đang active.

## Kết quả mong đợi
- [ ] Đủ 8 nhóm icon vẽ + các tiện ích liệt kê ở trên đều tồn tại và hiển thị.

---

# [TC_PTKT_BD_11] Chọn công cụ vẽ (Trend Line) chuyển trạng thái active

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** Chỉ verify TRẠNG THÁI icon (class active/inactive khi được chọn) — hành vi vẽ thật trên canvas
  (click-drag tạo đường) KHÔNG assert được, xem giới hạn kỹ thuật đầu tài liệu.

## Các bước thực hiện
1. Click nhóm icon "Trend Line".
2. Click lại icon "Cursor" (mũi tên) để hủy chọn.

## Kết quả mong đợi
- [ ] Sau bước 1, icon "Trend Line" chuyển sang trạng thái active (class khác trước khi click).
- [ ] Sau bước 2, icon "Cursor" active, "Trend Line" trở lại inactive.

---

# [TC_PTKT_BD_12] Nút "Xóa tất cả công cụ vẽ" không lỗi khi chưa vẽ gì

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Ở 1 tab biểu đồ chưa có hình vẽ nào, click icon thùng rác "Xóa tất cả công cụ vẽ".

## Kết quả mong đợi
- [ ] Không có lỗi JS phát sinh (`pageerror`), biểu đồ vẫn hiển thị bình thường.

---

## Nhóm: Thanh công cụ dưới biểu đồ (preset thời gian, tỷ lệ trục)

# [TC_PTKT_BD_13] Click preset khoảng thời gian đổi phạm vi hiển thị

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng nhóm nút phạm vi (5 Năm/1 Năm/6 Tháng/1 Tháng/1 Tuần/1 Ngày) trong Sheet
- **Ghi chú:** `data-name` thật: `date-range-tab-60M` ("5 Năm") · `-12M` ("1 Năm") · `-6M` ("6 Tháng") · `-1M`
  ("1 Tháng") · `-1W` ("1 Tuần") · `-1D` ("1 Ngày") — label tùy biến qua `time_frames` (`ReactChartTA.vue`), KHÁC
  key chuẩn TradingView.

## Các bước thực hiện
1. Click lần lượt "1 Tháng", "1 Tuần", "1 Ngày" ở thanh dưới biểu đồ.

## Kết quả mong đợi
- [ ] Mỗi lần click, nút tương ứng chuyển trạng thái active, biểu đồ tự động điều chỉnh phạm vi hiển thị (không
      lỗi JS).

---

# [TC_PTKT_BD_14] Toggle %/log/tự động (trục giá)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng "Auto/Log scale" trong Sheet

## Các bước thực hiện
1. Click nút "%" (percentage), quan sát trạng thái.
2. Click nút "log" (logarithm), quan sát trạng thái.
3. Click nút "tự động" (auto scale).

## Kết quả mong đợi
- [ ] Mỗi nút chuyển trạng thái active khi được bật, có thể tắt lại bằng cách click lần nữa.

---

## Nhóm: Lưu cấu hình & Real-time

# [TC_PTKT_BD_15] Chỉ báo được giữ nguyên sau khi tải lại trang (F5)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng nhóm "lưu cấu hình" trong Sheet
- **Ghi chú:** `onAutoSaveNeeded` lưu state (indicator/annotation) vào `chartTASaved_<id>` qua `store.commit(
  "saveSetting", ...)` — cùng cơ chế debounce 2 lớp đã ghi chú ở tài liệu shell.

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới, thêm chỉ báo "RSI" (TC_PTKT_BD_05).
2. Đợi ~4 giây (auto-save chỉ báo, `auto_save_delay: 0.2` + debounce nội bộ TradingView).
3. Tải lại trang (F5).

## Kết quả mong đợi
- [ ] Sau F5, tab vẫn còn, legend vẫn có "RSI".
- [ ] **Dọn dẹp:** xóa lại tab đã thêm, đợi debounce layout trước khi kết thúc test.

---

## Nhóm: Giới hạn theo gói hội viên (Free)

# [TC_PTKT_BD_16] Tài khoản Free — ẩn 2 dropdown tự viết "Biểu đồ ▾"/"NKGD ▾" + nút "Tải lại Biểu đồ"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Cả 2 nút tự viết CÙNG nằm trong khối `if (!store.state.isAccountFree) { ... }`
  (`ReactChartTA.vue` dòng ~508-655) — tài khoản Free KHÔNG thấy CẢ HAI, không phải chỉ 1 trong 2.

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào `/phan-tich-ky-thuat`.
2. Quan sát toolbar trên của tab biểu đồ.

## Kết quả mong đợi
- [ ] KHÔNG có nút "Biểu đồ ▾", "NKGD ▾", "Tải lại Biểu đồ" trên toolbar.

---

# [TC_PTKT_BD_17] ⚠️ Cập nhật giá real-time trong giờ giao dịch

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Dữ liệu nến/volume cập nhật qua datafeed riêng (`@/assets/js/DataFeed`, subscribe socket) — chỉ
  cập nhật thật trong giờ giao dịch, không chủ động kích hoạt được bằng automation trong thời gian ngắn. Cùng
  pattern đã ghi nhận ở các màn khác (Bảng giá/Watchlist) — không coi là fail nếu không quan sát được thay đổi
  ngoài giờ giao dịch.

## Các bước thực hiện (dự kiến, trong giờ giao dịch)
1. Mở 1 tab biểu đồ mã đang giao dịch, quan sát giá/khối lượng lặp lại sau vài chục giây.

## Kết quả mong đợi (dự kiến)
- [ ] Giá/khối lượng cập nhật theo thời gian thực khi có giao dịch mới khớp.

---

## Tổng hợp trạng thái (17 testcase — chỉ phạm vi khu vực Biểu đồ)

Đã tự động hoá bằng Playwright:
[tests/phan-tich-ky-thuat-bieu-do.spec.ts](../tests/phan-tich-ky-thuat-bieu-do.spec.ts) (POM: section "Khu vực
biểu đồ" trong [pages/TechnicalChartPage.ts](../pages/TechnicalChartPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 11 | TC_PTKT_BD_01, 02, 03, 04, 05, 06, 10, 11, 13, 14, 15 |
| 🆕 Mới (riêng web) | 5 | TC_PTKT_BD_07, 08, 09, 12, 16 |
| ⚠️ Cần xác nhận thêm | 1 | TC_PTKT_BD_17 (phụ thuộc giờ giao dịch thật) |

**Phát hiện đáng chú ý:**
1. **KHÔNG phải mọi phần biểu đồ đều assert được bằng Playwright** — TradingView Charting Library render bằng
   `<canvas>` thuần cho nến/đường chỉ báo/hình vẽ tay; chỉ header toolbar, legend (tên chỉ báo dạng TEXT), preset
   thời gian, toolbar vẽ trái là DOM thật ổn định để assert.
2. **2 nút tự viết "Biểu đồ ▾"/"NKGD ▾" + nút "Tải lại Biểu đồ"** hoàn toàn KHÔNG phải tính năng gốc TradingView
   — được `ReactChartTA.vue` chèn thủ công qua `tvWidget.createButton()`, ẩn/hiện theo `isAccountFree`/
   `isModerator` đọc từ `localStorage`, không liên quan gói hội viên `features_disabled` như các màn khác.
