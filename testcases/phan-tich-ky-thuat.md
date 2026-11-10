# Màn hình: Phân tích kỹ thuật — Khung/Shell

- **URL:** `/phan-tich-ky-thuat` (route con của `/`, yêu cầu đăng nhập — `meta.requiresUser: true`, xác nhận qua
  `stocks/src/router/index.js` dòng ~674).
- **Component:** [src/views/multiLayoutChart/index.vue](../../stocks/src/views/multiLayoutChart/index.vue) render
  [reactMultiLayoutChart.js](../../stocks/src/views/multiLayoutChart/reactMultiLayoutChart.js) — component
  **React** (không phải Vue thuần) dùng thư viện `flexlayout-react` để quản lý layout đa biểu đồ (nhiều tab, chia
  nhiều khung hình cùng lúc) + TradingView Charting Library (`public/js_ver_28_3/charting_library`) nhúng qua
  `<iframe>` cho từng tab biểu đồ.
- **Domain test:** https://kfsp.vn/phan-tich-ky-thuat
- **Nguồn testcase gốc (app):** Google Sheet, tab **"Biểu đồ"** (101 dòng) — chỉ dùng để học văn phong, KHÔNG phải
  checklist. App (mobile) có kiến trúc **hoàn toàn khác web**: 1 biểu đồ full-screen tại 1 thời điểm + floating
  menu (Watchlist/Ghi chú/Xoay màn hình/Quay lại) chỉ có ở mobile. Web dùng layout đa tab/đa khung (FlexLayout) +
  menu dọc cố định bên phải ("AI Chart"/"Thông tin"/"Watchlist"/"Cảnh báo"/"Ghi chú"/"Cộng đồng") — độ phủ testcase
  dưới đây do tự kiểm kê source code + DOM thật quyết định, không map 1-1 theo Sheet.
- **Phạm vi đã chốt với người dùng:** tài liệu này + 2 tài liệu con chỉ phủ **"Biểu đồ" + panel "Thông tin"**:
  - `phan-tich-ky-thuat.md` (tài liệu này) — khung/shell: load trang, quản lý nhiều tab/khung biểu đồ, menu dọc
    phải (chỉ nhắc tới, không chi tiết), điều hướng, dark mode, responsive.
  - [phan-tich-ky-thuat-bieu-do.md](phan-tich-ky-thuat-bieu-do.md) — chi tiết khu vực biểu đồ: tìm/đổi mã,
    timeframe, style nến, chỉ báo (fx), toolbar vẽ trái, preset khoảng thời gian, 2 nút tự viết "Biểu đồ ▾"/
    "NKGD ▾", lưu cấu hình.
  - [phan-tich-ky-thuat-replay-chia-khung.md](phan-tich-ky-thuat-replay-chia-khung.md) — tính năng mới (hiện chỉ
    có trên prev2): Replay, nút Bố cục/chia khung, kéo thanh chia, Liên kết thẻ, Hướng dẫn lần đầu.
  - [phan-tich-ky-thuat-thong-tin.md](phan-tich-ky-thuat-thong-tin.md) — chi tiết tab "Thông tin" của panel phải,
    2 nhánh Stockcode (`Orderboard/Stockcode`) và Indexcode (`Orderboard/Indexcode`).
  - **KHÔNG** viết testcase chi tiết cho: tab "Sổ lệnh"/"Cung cầu"/"Bài viết" của panel phải, và toàn bộ nội dung
    4 mục menu dọc còn lại ("AI Chart"/"Watchlist"/"Cảnh báo"/"Ghi chú"/"Cộng đồng") — chỉ verify điều hướng/mở
    đúng, không verify nội dung bên trong.
- **Phương pháp sinh:** đọc `index.vue` + `reactMultiLayoutChart.js` (toàn bộ logic FlexLayout: thêm/xóa/đổi tên
  tab, giới hạn theo gói hội viên, liên kết đồng bộ mã giữa tab, lưu/khôi phục layout) + kiểm thử trực tiếp bằng
  Playwright (thêm/xóa tab thật, đổi mã sang mã chỉ số, mở 2 dropdown tự viết, F5 kiểm tra lưu cấu hình).
- **Quy ước trạng thái:**
  - ✅ Áp dụng — testcase adapt từ app, có thể/đã tự động hoá bằng Playwright.
  - 🆕 Testcase mới — phát sinh riêng cho web, app không có (kiến trúc web hoàn toàn khác).
  - ⚠️ Cần xác nhận thêm — chưa đủ điều kiện kiểm chứng thực tế hoặc cố ý không kích hoạt thật (rủi ro dữ liệu).

**⚠️ AN TOÀN DỮ LIỆU — ĐỌC TRƯỚC KHI CHẠY/SỬA BẤT KỲ TEST NÀO CỦA MÀN NÀY:** layout đa biểu đồ (tab nào đang mở,
mã/interval từng tab) là setting lưu **server-side theo tài khoản** (`store.commit("saveSetting", ...)`, debounce
3000ms rồi mới gửi API — xem ghi chú đầy đủ trong [pages/TechnicalChartPage.ts](../pages/TechnicalChartPage.ts)),
KHÔNG phải state riêng theo browser context. Test thêm tab PHẢI xóa lại đúng tab đã thêm VÀ đợi đủ debounce
(`waitForLayoutSaved()`) trước khi kết thúc, nếu không sẽ để lại tab rác ảnh hưởng các lần chạy sau. Đã xác nhận
qua automation thật: đóng browser ngay sau khi xóa tab (không đợi debounce) khiến việc xóa KHÔNG được lưu —
lần load sau tab "đã xóa" quay trở lại.

---

## Nhóm: Truy cập & Tổng quan

# [TC_PTKT_01] Overview màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** liên quan TC tổng quan (Sheet "Biểu đồ")
- **Khác biệt so với app:** App hiển thị 1 biểu đồ full-screen tại 1 thời điểm. Web hiển thị đồng thời: (1) dãy
  tab biểu đồ phía trên (mỗi tab 1 mã/khung thời gian riêng) + nút "+" thêm tab, (2) khu vực biểu đồ chính của tab
  đang active, (3) panel phải cố định với 6 mục menu dọc ("AI Chart"/"Thông tin"/"Watchlist"/"Cảnh báo"/"Ghi chú"/
  "Cộng đồng"), mặc định mở "Thông tin".

## Các bước thực hiện
1. Đăng nhập thành công, điều hướng tới `/phan-tich-ky-thuat`.

## Kết quả mong đợi
- [ ] Ít nhất 1 tab biểu đồ hiển thị trên dãy tab (layout đã lưu trước đó của tài khoản, hoặc mặc định BSR 1D nếu
      tài khoản chưa từng lưu layout).
- [ ] Khu vực biểu đồ chính của tab active hiển thị đúng (nến/toolbar TradingView).
- [ ] Panel phải hiển thị đủ 6 mục dọc cố định, "Thông tin" active mặc định (khi tài khoản chưa từng đổi tab
      phải).
- [ ] Không có lỗi JS (`pageerror`) phát sinh trong lúc tải trang.

---

# [TC_PTKT_02] Chặn truy cập khi chưa đăng nhập

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Truy cập thẳng `/phan-tich-ky-thuat` khi chưa đăng nhập → router guard
  (`meta.requiresUser`) redirect sang `/login`, không render nội dung trang.

## Các bước thực hiện
1. Đảm bảo chưa đăng nhập.
2. Truy cập trực tiếp URL `/phan-tich-ky-thuat`.

## Kết quả mong đợi
- [ ] Tự động chuyển hướng sang `/login`, không hiển thị nội dung trang Phân tích kỹ thuật.

---

# [TC_PTKT_03] Điều hướng vào màn từ menu header

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Link "Phân tích kỹ thuật" luôn hiển thị cố định trên header chính (xác nhận qua
  `.aria.txt`), không cần chọn mã CK trước như 1 số màn khác (Phân tích cơ bản/Bảng giá).

## Các bước thực hiện
1. Từ Dashboard, click menu "Phân tích kỹ thuật" trên header.

## Kết quả mong đợi
- [ ] Điều hướng đúng sang `/phan-tich-ky-thuat`, hiển thị layout biểu đồ đã lưu của tài khoản.

---

## Nhóm: Quản lý nhiều tab biểu đồ

# [TC_PTKT_04] Thêm 1 tab biểu đồ mới qua nút "+"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `onAddFromTabSetButton()` copy mã (`symbol`)/khung thời gian (`interval`) từ tab CUỐI CÙNG hiện có
  trong tabset, đặt tên tab mới dạng `"<mã> <interval>"`, đồng thời copy luôn chỉ báo/annotation đã lưu của tab
  nguồn (`data_chart_ta_saved`) sang tab mới.

## Các bước thực hiện
1. Đếm số tab biểu đồ hiện có.
2. Click nút "+" ở cuối dãy tab.

## Kết quả mong đợi
- [ ] Số tab tăng thêm đúng 1, tab mới trở thành tab active.
- [ ] Tên tab mới trùng với mã/khung thời gian của tab cuối cùng trước đó.
- [ ] **Dọn dẹp:** xóa lại tab vừa thêm (xem TC_PTKT_07) trước khi test kết thúc.

---

# [TC_PTKT_05] Chuyển đổi qua lại giữa các tab biểu đồ

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** liên quan luồng chuyển mã xem trong Sheet

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới (mã khác biệt, VD đổi sang "VNINDEX" qua ô tìm kiếm — xem
   [phan-tich-ky-thuat-bieu-do.md](phan-tich-ky-thuat-bieu-do.md) TC_PTKT_BD_03).
2. Click quay lại tab biểu đồ đầu tiên.

## Kết quả mong đợi
- [ ] Tab được click trở thành active (class `flexlayout__tab_button--selected`/`border-active` đổi đúng).
- [ ] Panel phải "Thông tin" tự đồng bộ nội dung theo mã của tab vừa active (không cần thao tác thêm).
- [ ] **Dọn dẹp:** xóa lại tab đã thêm ở bước 1.

---

# [TC_PTKT_06] Đóng tab — modal xác nhận, bấm "Đóng" để hủy

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Modal "Xóa đồ thị" (`index.vue`) hiện ra khi bấm nút "x" trên tab (trừ khi
  `localStorage.doNotRemindToday` đã set đúng ngày hôm nay — xem TC_PTKT_08). Bấm "Đóng" chỉ ẩn modal, KHÔNG dispatch
  sự kiện xóa.

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới.
2. Bấm nút "x" trên tab vừa thêm.
3. Ở modal "Xóa đồ thị", bấm "Đóng".

## Kết quả mong đợi
- [ ] Modal hiển thị đúng tiêu đề "Xóa đồ thị" + nội dung cảnh báo mất công cụ vẽ + checkbox "Không hỏi lại hôm
      nay" (chưa tick) + 2 nút "Đóng"/"Xóa".
- [ ] Sau khi bấm "Đóng", modal đóng lại, tab KHÔNG bị xóa (số tab không đổi).
- [ ] **Dọn dẹp:** xóa lại tab đã thêm ở bước 1 (theo TC_PTKT_07).

---

# [TC_PTKT_07] Đóng tab — xác nhận "Xóa"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới.
2. Bấm nút "x" trên tab vừa thêm → modal "Xóa đồ thị" hiện ra.
3. KHÔNG tick "Không hỏi lại hôm nay", bấm "Xóa".
4. Đợi debounce lưu layout (~6 giây) trước khi kết thúc test.

## Kết quả mong đợi
- [ ] Tab bị xóa khỏi dãy tab, số tab quay về đúng số ban đầu.
- [ ] `localStorage.doNotRemindToday` KHÔNG bị set (do không tick checkbox).
- [ ] Tải lại trang bằng phiên hoàn toàn mới (session khác) vẫn thấy đúng số tab đã xóa (xác nhận thay đổi lưu
      server-side thành công) — **đã đo thật, xem mục "Phát hiện đáng chú ý"**.

---

# [TC_PTKT_08] Checkbox "Không hỏi lại hôm nay" hiển thị đúng trong modal xóa

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **chỉ verify hiển thị, KHÔNG kích hoạt thật**
- **Ghi chú:** Cố ý KHÔNG tick + xác nhận checkbox này trong bộ test tự động, vì hành vi lưu
  `localStorage.doNotRemindToday` + `saveSetting` ảnh hưởng **MỌI lần xóa tab khác trong cùng ngày** của tài
  khoản dùng chung (kể cả ở phiên/test khác chạy sau) — đúng theo cảnh báo rủi ro đã thống nhất với người dùng.
  Nếu cần xác nhận hành vi lưu thật, nên làm thủ công 1 lần và tự dọn `localStorage.removeItem('doNotRemindToday')`
  ngay sau đó, không đưa vào bộ test tự động chạy lặp lại.

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới, bấm "x" mở modal "Xóa đồ thị".
2. Quan sát checkbox "Không hỏi lại hôm nay".

## Kết quả mong đợi
- [ ] Checkbox hiển thị, mặc định KHÔNG tick.
- [ ] **Dọn dẹp:** đóng modal bằng "Đóng" (không xóa thật ở case này), sau đó xóa tab qua TC_PTKT_07 pattern.

---

# [TC_PTKT_09] Giới hạn số tab biểu đồ tối đa — tài khoản Free

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `max_count_chart_ta` = 1 cho tài khoản Free (`store.state.isAccountFree`), 15 cho tài khoản thường,
  30 cho `moderator` (đọc `localStorage.roles`). Vượt giới hạn → `showToast(message_max_count_chart_ta)`, KHÔNG
  thêm tab mới (`onAddFromTabSetButton` chỉ toast, không gọi `addTabToTabSet`).

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`), vào `/phan-tich-ky-thuat` (mặc định đã có
   sẵn 1 tab).
2. Click nút "+" thêm tab.

## Kết quả mong đợi
- [ ] Toast "Bạn đã mở tối đa 1 tab" hiển thị, số tab KHÔNG tăng thêm.

---

# [TC_PTKT_10] Đổi tên tab giữ nguyên khi đổi mã CK khác

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `onAction()` xử lý sự kiện `FlexLayout_RenameTab` — so sánh text mới với nhãn mặc định
  `"<mã> <interval>"`, set `is_changed_name = true` nếu khác. `handleOnSymbolChanged()`/`handleOnIntervalChanged()`
  chỉ tự đổi lại tên tab theo mã/khung thời gian mới khi `is_changed_name = false`.

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới.
2. Double-click vào tên tab, đổi tên thành "Ghi chú của tôi", nhấn Enter.
3. Đổi mã CK của tab này sang mã khác (qua ô tìm kiếm trong biểu đồ).

## Kết quả mong đợi
- [ ] Sau bước 2, tên tab hiển thị đúng "Ghi chú của tôi".
- [ ] Sau bước 3, tên tab VẪN giữ "Ghi chú của tôi" (không tự động đổi lại theo mã mới).
- [ ] **Dọn dẹp:** xóa lại tab đã thêm.

---

# [TC_PTKT_11] ⚠️ Liên kết đồng bộ mã giữa các tab (chấm tròn màu)

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Mỗi tab biểu đồ có 1 chấm tròn màu ở đầu tên tab (`onRenderTab` trong `reactMultiLayoutChart.js`).
  Hover chuột vào chấm tròn (`mouseEnterFunction`) hiện popper 6 màu để chọn nhóm liên kết; khi 2+ tab CÙNG màu
  (khác màu mặc định xám `link-6`), đổi mã ở 1 tab sẽ tự đổi mã các tab cùng nhóm màu (`handleOnSymbolChanged()`).
  Chưa xác nhận được cách giả lập ổn định sự kiện `mouseenter` để mở popper (JS thuần, không phải Vue/React state
  chuẩn) bằng Playwright trong thời gian khảo sát — cần thử nghiệm thêm `dispatchEvent('mouseenter')` hoặc
  `hover()` với timing khác trước khi tự động hoá đầy đủ.

## Các bước thực hiện (dự kiến)
1. Thêm 2 tab biểu đồ mới.
2. Hover vào chấm tròn màu của tab 1, chọn 1 màu khác xám mặc định.
3. Lặp lại cho tab 2, chọn CÙNG màu.
4. Đổi mã CK ở tab 1.

## Kết quả mong đợi (dự kiến)
- [ ] Tab 2 (cùng màu) tự đổi mã theo tab 1.
- [ ] **Dọn dẹp:** xóa lại 2 tab đã thêm.

---

# [TC_PTKT_12] Lưu cấu hình sau khi tải lại trang (F5)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** tương ứng nhóm "lưu cấu hình" trong Sheet (app: indicator/annotation/timeframe giữ khi
  thoát-mở lại)

## Các bước thực hiện
1. Thêm 1 tab biểu đồ mới, đổi mã CK sang mã khác biệt (VD "VNINDEX").
2. Đợi debounce lưu layout (~6 giây).
3. Tải lại trang (F5).

## Kết quả mong đợi
- [ ] Sau F5, tab vừa thêm vẫn còn, đúng mã đã đổi.
- [ ] **Dọn dẹp:** xóa lại tab đã thêm, đợi debounce trước khi kết thúc test.

---

## Nhóm: Menu dọc phải (chỉ verify điều hướng, KHÔNG chi tiết nội dung — ngoài phạm vi)

# [TC_PTKT_13] Chuyển đổi giữa các mục menu dọc phải

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Panel phải là 1 `border` FlexLayout riêng, 6 tab cố định (`enableClose: false`, `enableDrag:
  false`): "AI Chart"/"Thông tin"/"Watchlist"/"Cảnh báo"/"Ghi chú"/"Cộng đồng". **Không viết testcase chi tiết**
  cho nội dung 5 mục ngoài "Thông tin" (đã chốt phạm vi) — mã nguồn còn định nghĩa thêm mục "Chatbot" thứ 7
  nhưng **không xuất hiện trên tài khoản test hiện tại** (xem "Phát hiện đáng chú ý").

## Các bước thực hiện
1. Click lần lượt "Watchlist", "Cảnh báo", "Ghi chú", "Cộng đồng", "AI Chart".
2. Click lại "Thông tin".

## Kết quả mong đợi
- [ ] Mỗi lần click, đúng 1 mục active, nội dung panel phải đổi tương ứng (không lỗi JS).
- [ ] Quay lại "Thông tin" hiển thị đúng nội dung mã CK đang xem (không mất trạng thái).

---

## Nhóm: Điều hướng

# [TC_PTKT_14] Nút Back trình duyệt điều hướng rời khỏi trang

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Từ Dashboard, điều hướng sang `/phan-tich-ky-thuat`.
2. Bấm nút Back của trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng Dashboard.

---

# [TC_PTKT_15] Click "Thông tin FA" trong panel phải điều hướng sang Phân tích cơ bản

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Link mở **tab mới** (`target="_blank"`) trỏ `/phan-tich-co-ban?mack=<mã>` — chỉ verify điều hướng
  đúng URL, nội dung trang đích đã có testcase riêng ở `testcases/phan-tich-co-ban*.md`.

## Các bước thực hiện
1. Ở panel phải, tab "Thông tin", mục "Hồ sơ", click link "Thông tin FA".

## Kết quả mong đợi
- [ ] Mở tab mới, URL đúng `/phan-tich-co-ban?mack=<mã đang xem>`.

---

## Nhóm: Dark mode & Responsive

# [TC_PTKT_16] Bật/tắt Dark mode đổi theme toàn bộ màn hình

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Ghi chú:** `ReactChartTA.vue` có `watch: themeChart` riêng — khi đổi dark mode, TradingView widget tự
  `save()` → `changeTheme()` → `load()` lại state cũ, áp `override_config_dark`/`override_config_light`
  (`paneProperties.background`...). Không assert được màu nền canvas trực tiếp (rendering pixel), chỉ verify
  class/theme tổng thể của trang đổi đúng + biểu đồ không crash/mất dữ liệu sau khi đổi.

## Các bước thực hiện
1. Ở `/phan-tich-ky-thuat`, bật Dark mode (toggle trên header).
2. Quan sát toàn trang, sau đó tắt lại Light mode.

## Kết quả mong đợi
- [ ] `<html>`/`<body>` (hoặc container tương ứng) có class dark mode tương ứng sau khi bật.
- [ ] Không có lỗi JS phát sinh trong lúc đổi theme; tab biểu đồ/panel phải vẫn hiển thị đúng dữ liệu sau khi đổi
      (không bị trắng/mất nội dung).

---

# [TC_PTKT_17] Responsive viewport nhỏ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Màn hình thiết kế chủ yếu cho desktop (FlexLayout đa khung không tối ưu mobile) — **XOÁ hẳn** các
  mục mobile-only của app (pinch zoom gesture, floating menu Watchlist/Ghi chú/Xoay/Quay lại, xoay màn hình,
  VoiceOver, Back thiết bị, app background/foreground) theo đúng quy tắc đã chốt, KHÔNG giữ dưới dạng N/A.

## Các bước thực hiện
1. Thu nhỏ viewport xuống tablet (768x1024).

## Kết quả mong đợi
- [ ] Layout co giãn theo, dãy tab/panel phải vẫn thao tác được (có thể cuộn ngang nếu không đủ chỗ), không vỡ
      nghiêm trọng.

---

## Tổng hợp trạng thái (17 testcase — chỉ phạm vi khung/shell)

Đã tự động hoá bằng Playwright: [tests/phan-tich-ky-thuat.spec.ts](../tests/phan-tich-ky-thuat.spec.ts)
(POM: [pages/TechnicalChartPage.ts](../pages/TechnicalChartPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 4 | TC_PTKT_01, 05, 12, 16 |
| 🆕 Mới (riêng web) | 11 | TC_PTKT_02, 03, 04, 06, 07, 09, 10, 13, 14, 15, 17 |
| ⚠️ Cần xác nhận thêm | 2 | TC_PTKT_08 (cố ý không kích hoạt thật), TC_PTKT_11 (chưa ổn định cách giả lập hover popper màu) |

**Phát hiện đáng chú ý:**
1. **Lưu layout có ĐỘ TRỄ 2 lớp debounce, dễ gây "dọn dẹp giả" nếu không biết:** lớp 1 debounce 3000ms trong
   chính component (`TIME_LIMIT_DEBOUNCE_SAVE_LAYOUT`), lớp 2 là hàng đợi lưu server riêng
   (`getSettingSaver(...).enqueue()` trong `store.js`). Đã xác nhận qua automation thật: đóng browser/kết thúc
   context ngay sau khi xóa 1 tab (không đợi) khiến việc xóa **KHÔNG được lưu server-side** — phiên tiếp theo tab
   "đã xóa" xuất hiện trở lại. Đã sửa bằng cách đợi 6 giây (`waitForLayoutSaved()`) trước khi đóng context ở mọi
   test thêm/xóa tab, xác nhận lại bằng 1 phiên browser HOÀN TOÀN MỚI thấy đúng trạng thái đã lưu.
2. **Mục menu dọc phải "Chatbot"** được định nghĩa trong code (`DEFAULT_BORDER_LAYOUT`) nhưng **KHÔNG xuất hiện**
   trên tài khoản test hiện tại (chỉ thấy 6/7 mục qua DOM thật) — nhiều khả năng do layout đã lưu từ trước khi
   tính năng "Chatbot" được thêm vào code, và cơ chế tải layout (`loadLayout()`) ưu tiên dùng layout ĐÃ LƯU thay vì
   default mới khi tài khoản đã có layout cũ, nên KHÔNG tự bổ sung mục border mới vào layout cũ. Không thuộc phạm
   vi chi tiết hoá (menu dọc phải), chỉ ghi nhận như 1 khác biệt đáng chú ý.
3. **Route `/phan-tich-ky-thuat` không nhận query `?mack=`/path param** như `/phan-tich-co-ban` — mã CK đang xem
   hoàn toàn do layout đã lưu (tab nào active) quyết định, không có cơ chế deep-link theo mã riêng cho màn này
   (đọc `index.vue`/`reactMultiLayoutChart.js`, không có logic đọc `$route.query`).
