# Màn hình: Backtest chiến lược (tính năng mới, Beta)

- **URL:** `/backtest-chien-luoc` (yêu cầu đăng nhập — `meta.requiresUser`). Menu: **Cơ hội › Backtest chiến lược**
  (nhãn "Beta").
- **Môi trường test:** `PREV2_BASE_URL` — từ 09/11/2026 là **https://kfsp.vn** (production = preprod mới nhất, deploy
  06/11; prev2 bị deploy đè nhánh khác). Đăng nhập qua `Prev2Session` (`pages/Prev2Session.ts`): `TEST_USER_*` trả
  phí, `FREE_USER_*` miễn phí. Backend là production → mọi lệnh ghi đều giả lập/chặn (xem An toàn dữ liệu).
  (Lần sinh đầu 15/10/2026 chạy trên pre.vietpointer.vn, nhánh `thanh/backtest-simplify`.)
- **Component:** `origin/preprod` của `stocks`: `src/views/backtest/index.vue` (trang), `StrategyPicker.vue`,
  `DealList.vue`, `TradeReplay.vue`, `ChartSettings.vue`, `ChartToggle.vue`, `ConfirmDialog.vue` (hộp hỏi lại),
  `Overview.vue`, `WinStats.vue`, `EquityCurve.vue`, `PerformanceCharts.vue`, `engine/runStore.js` (API lịch sử),
  `engine/presetStrategies.js`, `src/containers/mainMenu.js` + `TheHeader.vue`.
- **Cập nhật 09/11/2026 (Nhánh B):** giao diện làm lại 16–21/10/2026 — kỳ mặc định 1 năm; "Mẫu KFSP" đổi tên "Chiến
  lược KFSP"; "Quy mô một deal" thành "Số tiền mỗi lần mua" (bỏ ô chọn cách tính); nút Chạy/Dừng dùng biểu tượng SVG;
  cột trái tách 2 thẻ rời Thiết lập / Lịch sử; thẻ lượt trong lịch sử bỏ số lượt + giờ chạy, thêm ô mã, kỳ + độ dài, lưới
  4 số, nút thùng rác xoá từng lượt; bỏ nút ghim; lịch sử không thu gọn được nữa; xoá toàn bộ dùng hộp hỏi lại của trang
  (thay `window.confirm`); thẻ đầu kết quả: mã là tiêu đề + tên chiến lược, hàng tab mục lục; 4 thẻ số rời, CHỈ ĐỂ ĐỌC
  (bỏ bấm dẫn tới mục), rê chuột hiện chiến lược của con số khi nhiều chiến lược; bảng deal bỏ cột Ghi chú. Xoá TC_31,
  TC_50, TC_51, TC_55, TC_61; thêm TC_85, TC_86; TC_83 (bug) đã được sửa.
- **Code test:** [tests/backtest-chien-luoc.spec.ts](../tests/backtest-chien-luoc.spec.ts), Page Object
  [pages/BacktestPage.ts](../pages/BacktestPage.ts), dữ liệu mẫu `tests/fixtures/backtest/*.json`.
- **Phương pháp sinh:** app không có màn tương ứng (không có tab Google Sheet nào). Toàn bộ testcase do kiểm kê độc
  lập trên source nhánh + đo bằng Playwright thật trên pre: chạy 1 và nhiều chiến lược, dừng giữa chừng, các nhánh
  lỗi khoảng thời gian / không dữ liệu / mất nguồn giá, API lịch sử lỗi 500, ghim, xoá, double-click, rời trang lúc
  đang chạy, tài khoản Free.
- **Quy ước trạng thái:**
  - 🆕 Testcase mới: tính năng chỉ có trên web, đã tự động hoá.
  - ⚠️ Cần xác nhận thêm: hành vi đã đo được nhưng cần PO/dev xác nhận là đúng ý (test ghi lại hành vi đo được).

**⚠️ AN TOÀN DỮ LIỆU — ĐỌC TRƯỚC KHI SỬA TEST:** lịch sử các lần chạy lưu **trên máy chủ theo tài khoản** qua
`/api/backtest/run` (GET danh sách, GET `/:id`, POST lưu lượt, DELETE `/:id`). `BacktestPage.open()`
thay toàn bộ API này bằng **máy chủ giả trong bộ nhớ** (`FakeBacktestServer`): chạy, xoá lượt, xoá lịch sử trong test không
chạm tài khoản thật, và mỗi test tự chọn lịch sử ban đầu (`seeds`: lượt mẫu MBB 1 chiến lược, CTD 4 chiến lược, lượt đã
bị dọn chi tiết — chụp từ máy chủ thật ngày 15/10/2026). Máy chủ giả trả lời POST sau 400ms cho giống máy chủ thật
(trước 19/10/2026 trả lời ngay thì dính bug ở TC_83 — nay đã sửa). Riêng TC_81 đọc lịch sử thật (chỉ GET, mọi lệnh ghi bị chặn). Ô tìm mã lưu mã đang
chọn qua `/updateusersettings` — cũng bị chặn. **Nến giá vẫn lấy thật** qua socket (`getsymbolinfo` + `gethistory`) nên
số liệu của lượt chạy mới đổi theo ngày: test chỉ assert cấu trúc, định dạng, hành vi; con số cụ thể chỉ assert trên
lượt mẫu (đã đóng băng trong fixture).

---

## Nhóm: Truy cập & điều hướng

# [TC_BACKTEST_01] Menu Cơ hội có mục "Backtest chiến lược" nhãn Beta

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập, vào `/dashboard`.
2. Rê chuột lên "Cơ hội" trên thanh menu, bấm "Backtest chiến lược".

## Kết quả mong đợi
- [ ] Danh sách con theo thứ tự: "Bộ lọc cổ phiếu", "Cơ hội tiềm năng", "Backtest chiến lược" kèm nhãn "Beta".
- [ ] Bấm vào thì mở `/backtest-chien-luoc`, hiện nút "Chạy Backtest".

# [TC_BACKTEST_02] Tiêu đề "Cơ hội" được tô sáng khi đang ở trang Backtest

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào `/backtest-chien-luoc`.

## Kết quả mong đợi
- [ ] Chữ "Cơ hội" trên thanh menu có lớp `active-tab-overview` (màu tím); "Thị Trường" thì không.

# [TC_BACKTEST_03] Chưa đăng nhập vào thẳng URL

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Trình duyệt chưa đăng nhập, mở thẳng `/backtest-chien-luoc`.

## Kết quả mong đợi
- [ ] Bị chuyển về `/login`.

# [TC_BACKTEST_04] Nút robot KFSP AI bị ẩn trên trang Backtest

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào trang Backtest.
2. Bấm menu "Watchlist".

## Kết quả mong đợi
- [ ] Ở trang Backtest: `<body>` có lớp `bt-hide-robot` (ẩn nút robot, hộp chat AI).
- [ ] Rời sang Watchlist: lớp `bt-hide-robot` được gỡ, robot hiện lại.

# [TC_BACKTEST_05] Tài khoản Free vào được trang và chạy được Backtest

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** tài khoản Free dùng đầy đủ tính năng, không có lớp mờ khoá (`.blurred-image`), không có
  nút nâng cấp. Code không có chỗ nào gate theo gói (`mainMenu.js` không đặt `hideForFree`, route chỉ `requiresUser`).
  Cần PO xác nhận Beta mở cho cả Free là chủ đích.

## Các bước thực hiện
1. Đăng nhập tài khoản Free (đóng popup "Chọn dịch vụ" nếu có), vào trang Backtest.
2. Bấm "Chạy Backtest".

## Kết quả mong đợi
- [ ] Trang không bị khoá; chạy xong có 4 ô số kết quả.

---

## Nhóm: Trạng thái ban đầu

# [TC_BACKTEST_06] Bố cục ban đầu

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** cột trái là 2 thẻ rời (Thiết lập / Lịch sử); nhóm thứ 4 đổi tên "Số tiền mỗi lần mua".

## Các bước thực hiện
1. Vào trang với lịch sử trống.

## Kết quả mong đợi
- [ ] Cột trái gồm 2 thẻ rời: thẻ "Thiết lập chạy Backtest" (4 nhóm theo thứ tự: Mã, Chiến lược chạy, Thời gian chạy,
  Số tiền mỗi lần mua; nút "Chạy Backtest" bấm được) và thẻ "Lịch sử các lần chạy".
- [ ] Cột phải là khung chờ xám (4 ô số, hàng chip, 1 biểu đồ đường, 2 biểu đồ cột), không chữ, không số; chưa có
  dòng tên lượt, chưa có hộp lỗi.

# [TC_BACKTEST_07] Giá trị mặc định của thiết lập

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** kỳ mặc định 1 năm (trước 5 năm); "Mẫu KFSP" đổi tên "Chiến lược KFSP"; bỏ ô chọn cách tính quy mô.

## Các bước thực hiện
1. Vào trang.

## Kết quả mong đợi
- [ ] Chiến lược chạy: đúng 1 thẻ "1. Chiến lược KFSP".
- [ ] Thời gian chạy: "1 năm" (lựa chọn: 1 năm, 3 năm, 5 năm, Tuỳ chỉnh); chưa có ô ngày.
- [ ] Số tiền mỗi lần mua: ô số "100,000,000", đơn vị "đ"; không còn ô chọn cách tính.

# [TC_BACKTEST_08] Ô Mã hiện mã đang chọn của web + tên công ty

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào trang.

## Kết quả mong đợi
- [ ] Ô Mã hiện mã đang chọn chung toàn web (`$store.state.mack`, lấy từ setting tài khoản — vd MBB, VIC).
- [ ] Dòng dưới ô ghi tên công ty của mã đó.

# [TC_BACKTEST_09] Lịch sử trống

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào trang với tài khoản chưa có lượt chạy nào.

## Kết quả mong đợi
- [ ] Phần "Lịch sử các lần chạy" ghi "Chưa có lượt chạy nào.", không có số đếm, không có nút × xoá.
- [ ] Trang có gọi `GET /api/backtest/run` để nạp lịch sử.

---

## Nhóm: Ô Mã

# [TC_BACKTEST_10] Gõ mã → gợi ý, chọn → đổi mã + tên công ty

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm ô Mã, gõ "FP".
2. Chọn dòng "FPT".

## Kết quả mong đợi
- [ ] Hiện danh sách gợi ý (tối đa 5 dòng: mã + tên công ty).
- [ ] Ô hiện "FPT", tên công ty dưới ô đổi sang công ty FPT.

# [TC_BACKTEST_11] Vào ô Mã bôi đen cả mã

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được:** vào ô bằng bàn phím (Tab/focus) thì luôn bôi đen cả mã. Bấm chuột thì không ổn định: lần đo
  đầu ra con trỏ ở cuối (`[3,3]` — mouseup ngay sau `select()` đặt lại con trỏ), lần sau ra bôi đen đủ. Test chỉ assert
  phần bàn phím, phần bấm chuột ghi annotation.

## Các bước thực hiện
1. Focus vào ô Mã (Tab), gõ "FP".
2. Rời ô, bấm chuột vào ô Mã.

## Kết quả mong đợi
- [ ] Bước 1: toàn bộ mã được chọn, gõ là thay thế → ô còn "FP".
- [ ] Bước 2: (mong đợi) cả mã được bôi đen như bước 1.

# [TC_BACKTEST_12] Gõ dở rồi rời ô không chọn gợi ý

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm ô Mã, gõ "XYZ".
2. Bấm ra chỗ khác (không chọn gợi ý).

## Kết quả mong đợi
- [ ] Ô trả lại mã đang chọn trước đó; danh sách gợi ý đóng.

# [TC_BACKTEST_13] Lượt chạy dùng đúng mã vừa chọn

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** mã nay là tiêu đề của thẻ đầu kết quả (`.bt-run-sym`).

## Các bước thực hiện
1. Chọn mã HPG, kỳ 1 năm, bấm "Chạy Backtest".

## Kết quả mong đợi
- [ ] Thẻ đầu kết quả có tiêu đề "HPG"; lượt gửi lưu có `symbols = ["HPG"]`.
- [ ] Ô tìm mã có gửi lệnh lưu mã đang chọn (`/updateusersettings`, `final_mack`) — test chặn lệnh này.

---

## Nhóm: Chiến lược chạy & bảng chọn chiến lược

# [TC_BACKTEST_14] Bảng chọn hiện đủ 15 chiến lược

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "+ Thêm chiến lược".

## Kết quả mong đợi
- [ ] Hộp "Chọn chiến lược cho lượt chạy" kèm "15 chiến lược"; 15 dòng, dòng đầu "Chiến lược KFSP" + 14 chiến lược dựng
  sẵn (Đường trung bình nhanh cắt đường trung bình chậm, Giá cắt đường trung bình, RSI quá bán quá mua, Donchian, MACD,
  Bollinger, SuperTrend, Đà tăng giá nhiều phiên, UT Bot, Chandelier Exit, Squeeze Momentum, Kênh SSL, DMI và ADX,
  Vượt đường trung bình kèm khối lượng đột biến).
- [ ] Chiến lược đang có trong lượt được tô tím (`aria-pressed="true"`), các dòng khác `false`.

# [TC_BACKTEST_15] Chọn thêm nhiều chiến lược trong 1 lần mở bảng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở bảng chọn, bấm "RSI quá bán, quá mua", rồi "Kênh SSL".

## Kết quả mong đợi
- [ ] Bảng vẫn mở sau mỗi lần bấm; dòng vừa bấm chuyển tím.
- [ ] Thẻ chiến lược: "1. Chiến lược KFSP", "2. RSI quá bán, quá mua", "3. Kênh SSL".

# [TC_BACKTEST_16] Bấm lại chiến lược đang chọn → bỏ khỏi lượt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở bảng chọn, bấm "Kênh SSL", rồi bấm "Chiến lược KFSP".

## Kết quả mong đợi
- [ ] "Chiến lược KFSP" hết tô tím; còn đúng 1 thẻ "1. Kênh SSL" (đánh số lại).

# [TC_BACKTEST_17] Nút × trên thẻ bỏ chiến lược

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Thêm "Chandelier Exit", "Kênh SSL".
2. Bấm × (title "Bỏ chiến lược này khỏi lượt chạy") trên thẻ Chiến lược KFSP.

## Kết quả mong đợi
- [ ] Còn "1. Chandelier Exit", "2. Kênh SSL".

# [TC_BACKTEST_18] Tìm chiến lược không phân biệt dấu, hoa thường

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở bảng chọn, gõ "rsi"; rồi gõ "cat duong"; rồi xoá trắng ô tìm.

## Kết quả mong đợi
- [ ] "rsi" → chỉ còn "RSI quá bán, quá mua".
- [ ] "cat duong" → 3 dòng: "Đường trung bình nhanh cắt đường trung bình chậm", "Giá cắt đường trung bình",
  "MACD cắt đường tín hiệu".
- [ ] Ô tìm trống → đủ 15 dòng.

# [TC_BACKTEST_19] Tìm không khớp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "khongcochienluocnay".

## Kết quả mong đợi
- [ ] Hiện "Không có chiến lược nào khớp chữ Bạn tìm." (lưu ý: chữ "Bạn" viết hoa giữa câu — lỗi chính tả nhỏ),
  không còn dòng nào.

# [TC_BACKTEST_20] Đóng bảng chọn: nút ×, Esc, bấm nền ngoài

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở bảng, bấm × ở góc.
2. Mở lại, đứng ở ô tìm, bấm Esc.
3. Mở lại, bấm vào nền mờ bên ngoài hộp.

## Kết quả mong đợi
- [ ] Cả 3 cách đều đóng bảng; danh sách chiến lược chạy không đổi.

# [TC_BACKTEST_21] 🐞 Mở lại bảng chọn: chữ tìm cũ không được xoá, ô tìm không tự focus

- **Trạng thái:** ⚠️ Cần xác nhận thêm (bug đo được)
- **Kết quả đo được:** mỗi lần mở bảng, console báo `TypeError: this.applySearch.cancel is not a function`. Nguyên
  nhân: `applySearch` khai trong `methods` bằng `lodash/debounce`, Vue 2 bind lại method nên mất thuộc tính `.cancel`;
  watcher `open` ném lỗi ngay dòng đầu nên các dòng sau (xoá `searchText`/`term`, focus ô tìm) không chạy. Hệ quả: mở
  lại bảng vẫn còn chữ tìm cũ + danh sách đã lọc, ô tìm không tự focus. `beforeDestroy` cũng gọi `.cancel()` nên rời
  trang cũng ném lỗi tương tự.

## Các bước thực hiện
1. Mở bảng chọn, gõ "rsi", đóng bảng.
2. Mở lại bảng chọn.

## Kết quả mong đợi
- [ ] (Theo thiết kế trong code) Ô tìm trống, đủ 15 dòng, con trỏ đứng sẵn ở ô tìm, không lỗi JS.
- [ ] (Thực tế đo được) Ô tìm vẫn "rsi", chỉ 1 dòng, không focus, có lỗi console `applySearch.cancel`.

---

## Nhóm: Thời gian chạy

# [TC_BACKTEST_22] Chọn 1 năm

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "1 năm", bấm Chạy.

## Kết quả mong đợi
- [ ] Dòng kết quả ghi "<ngày hôm nay năm ngoái> – <hôm nay>" (dấu gạch ngang từ 19/10/2026) (dd/mm/yyyy); lượt gửi lưu có `from_date`/`to_date`
  đúng như vậy.

# [TC_BACKTEST_23] Chọn Tuỳ chỉnh

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "Tuỳ chỉnh".

## Kết quả mong đợi
- [ ] Hiện 2 ô "Từ ngày", "Tới ngày", giữ sẵn kỳ đang chọn (kỳ mặc định 1 năm: 1 năm trước → hôm nay), mỗi ô có nút lịch "Chọn trên
  lịch", `maxlength=10`, placeholder "dd/mm/yyyy".

# [TC_BACKTEST_24] Ô ngày chỉ nhận chữ số, tự chèn "/"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở ô Từ ngày gõ từng phím "01a02b2024".
2. Xoá, gõ "0102".

## Kết quả mong đợi
- [ ] Bước 1 → "01/02/2024" (chữ cái bị bỏ).
- [ ] Bước 2 → "01/02", ô viền đỏ (lớp `sai`) vì ngày chưa đủ.

# [TC_BACKTEST_25] 🐞 Ngày chưa đủ (01/02) → ô đỏ nhưng vẫn chạy

- **Trạng thái:** ⚠️ Cần xác nhận thêm (bug đo được)
- **Kết quả đo được:** ô Từ ngày viền đỏ (ô dùng `moment(..., 'DD/MM/YYYY', true)` — strict) nhưng bấm Chạy **không báo
  lỗi** mà chạy luôn kỳ "01/02/<năm nay> – <hôm nay>": `checkRunInput` dùng `moment(...)` **không strict** nên "01/02"
  được hiểu là 01/02 năm hiện tại. Hai chỗ kiểm cùng 1 ô cho 2 kết luận ngược nhau; người dùng gõ dở có thể chạy nhầm kỳ.

## Các bước thực hiện
1. Tuỳ chỉnh, Từ ngày "01/02", Tới ngày hôm nay, bấm Chạy.

## Kết quả mong đợi
- [ ] Ô Từ ngày viền đỏ, ô Tới ngày không.
- [ ] (Đúng ra) Hộp lỗi "Khoảng thời gian chưa dùng được.", không chạy.
- [ ] (Thực tế đo được) Không lỗi, chạy kỳ 01/02/<năm nay> → hôm nay, lượt được gửi lưu với `from_date` đó.

# [TC_BACKTEST_26] Từ ngày sau hoặc bằng Tới ngày

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tuỳ chỉnh 01/06/2025 → 01/01/2025, bấm Chạy.
2. Tuỳ chỉnh 01/06/2025 → 01/06/2025, bấm Chạy.

## Kết quả mong đợi
- [ ] Cả 2 lần báo "Khoảng thời gian chưa dùng được.", không có kết quả.

# [TC_BACKTEST_27] Ngày không tồn tại (31/02/2025)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tuỳ chỉnh, Từ ngày "31/02/2025", bấm Chạy.

## Kết quả mong đợi
- [ ] Ô viền đỏ; bấm Chạy báo "Khoảng thời gian chưa dùng được."

# [TC_BACKTEST_28] Chọn lại số năm sau khi Tuỳ chỉnh

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tuỳ chỉnh 01/01/2020 → 01/01/2021.
2. Chọn "3 năm", rồi chọn lại "Tuỳ chỉnh".

## Kết quả mong đợi
- [ ] Bước 2: 2 ô ngày ẩn; mở lại Tuỳ chỉnh thì 2 ô là "3 năm trước" → hôm nay (ngày tự gõ trước đó bị thay).

# [TC_BACKTEST_29] Chọn ngày bằng lịch

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tuỳ chỉnh, chọn ngày 15/03/2023 trên lịch của ô Từ ngày.

## Kết quả mong đợi
- [ ] Ô Từ ngày hiện "15/03/2023".

# [TC_BACKTEST_30] Kỳ không có dữ liệu giá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tuỳ chỉnh 01/01/1995 → 01/01/1996, bấm Chạy.

## Kết quả mong đợi
- [ ] Hộp lỗi: "Không có dữ liệu giá cho mã <mã>." · "Nguồn dữ liệu không trả về phiên nào trong khoảng thời gian bạn
  chọn." · "Kiểm lại mã đã gõ đúng chưa, hoặc chọn khoảng thời gian gần đây hơn."
- [ ] Không có kết quả, không gửi lưu lượt.

---

## Nhóm: Số tiền mỗi lần mua

> TC_BACKTEST_31 (đổi cách tính Số tiền / Số cổ phiếu / Toàn bộ tiền) đã xoá: ô chọn cách tính bỏ ngày 16/10/2026.

# [TC_BACKTEST_32] Nhập số quy mô

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhập "50000000", Tab. 2. Nhập "abc", Tab. 3. Nhập "0", Tab. 4. Nhập "2.000.000", Tab.

## Kết quả mong đợi
- [ ] 1 → "50,000,000"; 2, 3 → giữ "50,000,000" (chỉ nhận số > 0); 4 → "2,000,000" (bỏ ký tự không phải số).

# [TC_BACKTEST_33] Số tiền mỗi lần mua được áp vào lượt chạy

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** chỉ còn số tiền cố định — đổi dữ liệu thử từ "500 cổ phiếu" sang "50,000,000 đ".

## Các bước thực hiện
1. Kỳ 1 năm, nhập Số tiền mỗi lần mua "50000000", bấm Chạy.

## Kết quả mong đợi
- [ ] Bản chụp chiến lược gửi lưu có `buy.size = { mode: "fixed_amount", numValue: 50000000 }`.

---

## Nhóm: Chạy Backtest

# [TC_BACKTEST_34] Chạy 1 chiến lược

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** kỳ mặc định 1 năm chạy xong < 1 giây nên test chọn 5 năm để kịp thấy tiến độ; thẻ đầu kết quả đổi bố cục; số đếm
  lịch sử dạng "n/100".

## Các bước thực hiện
1. Chọn 5 năm, bấm "Chạy Backtest", theo dõi tới khi xong.

## Kết quả mong đợi
- [ ] Trong lúc chạy: nút đổi thành "Dừng"; thanh tiến độ + dòng "Đang đi qua dd/mm/yyyy · phiên x/y · n deal, m lần
  mua đã đóng".
- [ ] Xong: nút trở lại "Chạy Backtest", hết dòng tiến độ; thẻ đầu kết quả: tiêu đề là mã, cạnh là "Chiến lược KFSP",
  dòng phụ "Lượt #1 · <5 năm trước> – <hôm nay> · chạy lúc HH:mm dd/mm/yyyy".
- [ ] Lịch sử có 1 thẻ đang sáng; số đếm "1/100" (rê chuột: "Giữ 100 lượt gần nhất, lượt cũ hơn tự xoá"); gửi lưu đúng
  1 lượt; không lỗi JS.

# [TC_BACKTEST_35] Chạy nhiều chiến lược

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** thẻ lịch sử nhiều chiến lược ghi "Tốt nhất: <tên>" thay dòng "Tốt nhất … +x%".

## Các bước thực hiện
1. Chọn 5 năm, thêm "RSI quá bán, quá mua", "Kênh SSL" (cùng Chiến lược KFSP = 3 chiến lược), bấm Chạy.

## Kết quả mong đợi
- [ ] Tiến độ ghi "Đang chạy mã <mã> · chiến lược i/3: <tên>".
- [ ] Thẻ đầu kết quả ghi "3 chiến lược"; bảng so sánh có 3 dòng.
- [ ] Thẻ lượt trong lịch sử tên "3 chiến lược" + dòng "Tốt nhất: <tên>" (hoặc "Không khớp lệnh nào trong kỳ").
- [ ] Lượt gửi lưu có 3 chiến lược theo đúng thứ tự: Chiến lược KFSP, RSI quá bán quá mua, Kênh SSL.

# [TC_BACKTEST_36] Bấm Dừng khi đang chạy

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** chạy 5 năm × 3 chiến lược để lượt chạy đủ lâu, kịp bấm Dừng.

## Các bước thực hiện
1. Chọn 5 năm, 3 chiến lược, bấm "Chạy Backtest" rồi bấm ngay "Dừng".

## Kết quả mong đợi
- [ ] Nút trở lại "Chạy Backtest"; không có kết quả, không hộp lỗi, lịch sử vẫn "Chưa có lượt chạy nào."; không gửi lưu.

# [TC_BACKTEST_37] Bỏ hết chiến lược rồi bấm Chạy

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm × trên thẻ Chiến lược KFSP, bấm Chạy.
2. Thêm lại Chiến lược KFSP, kỳ 1 năm, bấm Chạy.

## Kết quả mong đợi
- [ ] Bước 1: hộp lỗi "Chưa có chiến lược nào để chạy." · "Dòng Chiến lược chạy đang trống." · "Bấm + Thêm chiến
  lược ở khung THIẾT LẬP CHẠY BACKTEST."
- [ ] Bước 2: chạy được, hộp lỗi cũ biến mất.

# [TC_BACKTEST_38] Chạy lại y hệt thiết lập cũ

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** không còn toast "Lượt chạy này giống hệt lượt #1, đã mở lại lượt đó." — trang lặng lẽ mở lại lượt cũ; lượt trùng
  vẫn gửi POST (máy chủ khử trùng theo `manifest_hash`, trả lại id cũ).

## Các bước thực hiện
1. Kỳ 1 năm, chạy 1 lần; bấm Chạy lần nữa không đổi gì.
2. Đổi Số tiền mỗi lần mua thành 50,000,000, bấm Chạy.

## Kết quả mong đợi
- [ ] Bước 1: lịch sử vẫn 1 lượt, kết quả "Lượt #1"; POST lần 2 cùng `manifest_hash`; không có toast.
- [ ] Bước 2: thành lượt mới — lịch sử 2 lượt, kết quả "Lượt #2".

# [TC_BACKTEST_39] Lưu lượt lên máy chủ lỗi 500

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** nút ghim không còn — lượt chưa có id máy chủ thì không có nút thùng rác.

## Các bước thực hiện
1. Cho `POST /api/backtest/run` trả 500, chạy 1 năm.

## Kết quả mong đợi
- [ ] Kết quả vẫn hiện (4 thẻ số); toast lỗi "Chưa lưu được lượt chạy lên tài khoản, tải lại trang là mất (mã 500)".
- [ ] Lượt vẫn nằm trong lịch sử nhưng không có nút xoá (chưa có id máy chủ).

# [TC_BACKTEST_40] Mất kết nối nguồn giá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Giả lập socket giá chưa sẵn sàng (`window.socket_send` rỗng), bấm Chạy.

## Kết quả mong đợi
- [ ] Hộp lỗi "Chưa lấy được dữ liệu giá." · "Trang chưa kết nối được tới nguồn dữ liệu giá." · "Tải lại trang rồi
  bấm Chạy Backtest lần nữa."

# [TC_BACKTEST_41] Double-click nút "Chạy Backtest"

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** kỳ 1 năm chạy xong rất nhanh nên cú bấm thứ 2 có khi trúng "Dừng" (lượt dừng im lặng), có khi trúng nút Chạy sau
  khi lượt đã xong (chạy lại y hệt → khử trùng). Test chỉ khẳng định điều phải luôn đúng: không bao giờ ra 2 lượt; hành vi
  cụ thể ghi annotation. Cần PO xác nhận có muốn chặn bấm đúp không.

## Các bước thực hiện
1. Kỳ 1 năm, bấm đúp "Chạy Backtest".

## Kết quả mong đợi
- [ ] Lịch sử tối đa 1 lượt, máy chủ tối đa 1 lượt; không hộp lỗi.

# [TC_BACKTEST_42] Rời trang khi đang chạy

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** chạy 5 năm × 3 chiến lược để kịp rời trang khi còn đang chạy.

## Các bước thực hiện
1. Chọn 5 năm, 3 chiến lược, bấm Chạy; khi nút Dừng hiện, bấm menu Watchlist.

## Kết quả mong đợi
- [ ] Sang trang Watchlist; sau 5 giây không có lượt nào gửi lưu.

# [TC_BACKTEST_43] Chế độ dữ liệu mẫu `?demo=1`

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** lượt chạy bằng nến giả vẫn được gửi lưu lên lịch sử tài khoản như lượt thật (máy chủ thật sẽ
  giữ một lượt có số liệu không phải giá thật). Cần dev xác nhận có nên chặn lưu khi `demo`.

## Các bước thực hiện
1. Mở `/backtest-chien-luoc?demo=1`, bấm Chạy.

## Kết quả mong đợi
- [ ] Dưới nút Chạy có nhãn "DỮ LIỆU MẪU, KHÔNG PHẢI GIÁ THẬT"; chạy ra kết quả 4 ô số.

# [TC_BACKTEST_44] Lượt đã chạy còn sau khi tải lại trang

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** dấu hiệu "đã có id máy chủ" nay là nút thùng rác (trước là nút ghim).

## Các bước thực hiện
1. Kỳ 1 năm, chạy; chờ lượt có nút xoá (đã nhận id máy chủ); F5.
2. Bấm lượt trong lịch sử.

## Kết quả mong đợi
- [ ] Sau F5: lịch sử còn 1 lượt "Chiến lược KFSP", chưa mở lượt nào (khung chờ).
- [ ] Bấm lượt → mở kết quả 4 thẻ số.

---

## Nhóm: Lịch sử các lần chạy

# [TC_BACKTEST_45] Nội dung thẻ lượt trong lịch sử

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** thẻ làm lại 19/10/2026 — bỏ số lượt + giờ chạy; thêm ô mã, kỳ + độ dài, lưới 4 số; số đếm dạng "n/100".

## Các bước thực hiện
1. Lịch sử có 2 lượt mẫu: MBB 1 chiến lược (Chandelier Exit, 3 năm) và CTD 4 chiến lược (5 năm).

## Kết quả mong đợi
- [ ] Tiêu đề "Lịch sử các lần chạy" có số đếm "2/100".
- [ ] Thẻ MBB: ô mã "MBB", tên "Chandelier Exit", dòng kỳ "15/10/2023 – 15/10/2026 · 3 năm", không ghi "Lượt #";
  4 số Lãi lỗ +38.15% (xanh) · Mua và giữ +113.19% · Lệnh thắng 6/10 · Sụt giảm −16.50% (đỏ); không có dòng "Tốt nhất".
- [ ] Thẻ CTD: ô mã "CTD", tên "4 chiến lược", kỳ "14/10/2021 – 14/10/2026 · 5 năm", dòng "Tốt nhất: RSI quá bán, quá
  mua"; 4 số là của chiến lược tốt nhất: +144.16% · +37.97% · 5/6 · −34.31%.

# [TC_BACKTEST_46] Bấm 1 lượt mở kết quả

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** thẻ đầu kết quả: tiêu đề mã + tên chiến lược, dòng phụ "Lượt #n · kỳ · chạy lúc …".

## Các bước thực hiện
1. Bấm lượt MBB (Lượt #2), rồi lượt CTD, rồi lại MBB.

## Kết quả mong đợi
- [ ] Thẻ được bấm sáng lên; thẻ đầu kết quả "MBB · Chandelier Exit", dòng phụ "Lượt #2 · 15/10/2023 – 15/10/2026 ·
  chạy lúc HH:mm dd/mm/yyyy".
- [ ] Chi tiết mỗi lượt chỉ lấy 1 lần (`GET /run/2`, `GET /run/1`), mở lại không gọi lại.

# [TC_BACKTEST_47] Đang lấy chi tiết lượt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho `GET /run/:id` chậm 3 giây, bấm 1 lượt.

## Kết quả mong đợi
- [ ] Hiện dải "Đang lấy chi tiết lượt chạy…" + "Các con số tóm tắt đã có, chi tiết từng lệnh và đường vốn đang được
  tải."; chi tiết về thì dải biến mất, bảng deal hiện.

# [TC_BACKTEST_48] Lấy chi tiết lượt lỗi 500

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho `GET /run/:id` trả 500, bấm 1 lượt.

## Kết quả mong đợi
- [ ] Toast "Chưa lấy được chi tiết lượt chạy (mã 500)"; dải "Đang lấy chi tiết…" không kẹt lại.

# [TC_BACKTEST_49] Lấy danh sách lịch sử lỗi 500

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho `GET /api/backtest/run` trả 500, vào trang.

## Kết quả mong đợi
- [ ] Toast "Chưa lấy được lịch sử các lần chạy (mã 500)"; lịch sử ghi "Chưa có lượt chạy nào."

> TC_BACKTEST_50/51 (ghim / bỏ ghim lượt) đã xoá: nút ghim không còn trên giao diện preprod.

# [TC_BACKTEST_52] Xoá toàn bộ lịch sử — Huỷ ở hộp hỏi lại

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** hộp hỏi lại của trang (`ConfirmDialog.vue`) thay `window.confirm`.

## Các bước thực hiện
1. Lịch sử 2 lượt, bấm × ở tiêu đề Lịch sử.
2. Bấm "Huỷ"; mở lại rồi nhấn Esc; mở lại rồi bấm nút × "Đóng" của hộp.

## Kết quả mong đợi
- [ ] Hộp "Xoá toàn bộ lịch sử?" với câu "Mọi lần chạy sẽ bị xoá khỏi tài khoản của bạn và không khôi phục lại được.",
  2 nút "Huỷ" / "Xoá toàn bộ"; con trỏ đặt sẵn ở "Huỷ" (Enter theo thói quen không xoá nhầm).
- [ ] Huỷ / Esc / × đều đóng hộp, không xoá gì (không có lệnh DELETE); không còn hộp `window.confirm` của trình duyệt.

# [TC_BACKTEST_53] Xoá toàn bộ lịch sử — đồng ý

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** bấm "Xoá toàn bộ" trong hộp hỏi lại; không còn toast "Đã xoá lịch sử các lần chạy." (app tắt mọi toast thành công từ
  12/10/2026).

## Các bước thực hiện
1. Lịch sử 2 lượt, đang mở 1 lượt; bấm × ở tiêu đề Lịch sử, bấm "Xoá toàn bộ".

## Kết quả mong đợi
- [ ] Gửi DELETE từng lượt (`/run/1`, `/run/2`); lịch sử "Chưa có lượt chạy nào.", hết số đếm và nút ×.
- [ ] Cột kết quả về khung chờ xám.

# [TC_BACKTEST_54] Xoá lịch sử lỗi 500

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho DELETE trả 500; bấm × ở tiêu đề Lịch sử, bấm "Xoá toàn bộ".

## Kết quả mong đợi
- [ ] Toast "Chưa xoá hết được lịch sử (mã 500)"; danh sách nạp lại đúng như máy chủ (vẫn 2 lượt).

> TC_BACKTEST_55 (bấm tiêu đề "Lịch sử các lần chạy" để thu gọn) đã xoá: thẻ Lịch sử luôn mở.

# [TC_BACKTEST_56] 🐞 Lượt đã bị máy chủ dọn chi tiết (chỉ còn tóm tắt)

- **Trạng thái:** ⚠️ Cần xác nhận thêm (bug nghi vấn)
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** dải cảnh báo "Lượt này chỉ còn phần tóm tắt." KHÔNG còn hiện. Chú thích trong code (`combineSummaries`, index.vue)
  vẫn nói trang phải hiện dải này để người dùng không lẫn "đã bị dọn" với "không có lệnh / không có giá", nhưng template
  không còn vẽ nó. Đo được: thẻ "Tỷ lệ thắng" ghi "— · 0/0 lệnh", "Lãi lỗ đậm nhất" ghi "Chưa có lệnh nào đã bán", mục Chi
  tiết giao dịch ghi "Không có dữ liệu giá cho mã MBB trong khoảng thời gian đã chọn." — đúng cái bẫy chú thích cảnh báo.

## Các bước thực hiện
1. Lịch sử có 1 lượt đã bị dọn tầng 2 (`tier2_purged`), bấm mở.

## Kết quả mong đợi
- [ ] Số tóm tắt vẫn đúng (Tổng lãi lỗ +38.15%); mục lục còn 2 mục: Lãi lỗ, Chi tiết giao dịch.
- [ ] (Đúng ra) Có dải "Lượt này chỉ còn phần tóm tắt." giải thích vì sao thiếu chi tiết.
- [ ] (Thực tế đo được) Không có dải; trang hiện các câu "0/0 lệnh", "Chưa có lệnh nào đã bán", "Không có dữ liệu giá
  cho mã MBB…", "Chưa có deal nào trong phạm vi này." như một lượt không có dữ liệu.

---

## Nhóm: Kết quả — tổng quan & mục lục

# [TC_BACKTEST_57] Thẻ đầu kết quả, 4 thẻ số, hàng tab mục lục

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** thẻ đầu trang làm lại 19/10/2026 (mã là tiêu đề, hàng tab nằm trong thẻ); 4 thẻ số rời (21/10), nhãn không còn in hoa.

## Các bước thực hiện
1. Mở lượt mẫu MBB.

## Kết quả mong đợi
- [ ] Thẻ đầu: tiêu đề "MBB", cạnh "Chandelier Exit"; dòng phụ "Lượt #1 · 15/10/2023 – 15/10/2026 · chạy lúc …".
- [ ] 4 thẻ số theo thứ tự: Tổng lãi lỗ "+38.15%" (chip "Mua và nắm giữ x%"), Sụt giảm vốn sâu nhất "−16.50%" (chip "Mua
  và nắm giữ −x%"), Tỷ lệ thắng "60.00%" (chip "6/10 lệnh"), Lãi lỗ đậm nhất 2 số "+x% / −y%".
- [ ] Hàng tab mục lục: 1 Lãi lỗ · 2 Rủi ro · 3 Tỷ lệ thắng · 4 Chi tiết giao dịch; khung chờ xám lùi thành lớp phủ.

# [TC_BACKTEST_58] Màu số lãi/lỗ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở lượt mẫu MBB.

## Kết quả mong đợi
- [ ] Số dương lớp `up` (xanh), số âm lớp `down` (đỏ); phần trăm có dấu, 2 chữ số thập phân, dấu trừ "−".

# [TC_BACKTEST_59] Bấm tab mục lục

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** chip mục lục thành hàng tab `.bt-tab` (có `aria-current`), cuộn mượt.

## Các bước thực hiện
1. Mở lượt MBB, bấm tab "Chi tiết giao dịch", rồi tab "Lãi lỗ".

## Kết quả mong đợi
- [ ] Tab được bấm sáng lên (`aria-current="true"`), cột kết quả cuộn tới mục; bấm lại "Lãi lỗ" thì về mục đầu.

# [TC_BACKTEST_60] 4 thẻ số chỉ để đọc

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** trước 21/10/2026 bấm thẻ số thì cuộn tới mục tương ứng (Enter cũng được); nay 4 thẻ chỉ để đọc — bỏ bấm, bỏ dấu ›,
  bỏ viền khi rê chuột.

## Các bước thực hiện
1. Mở lượt MBB, lần lượt bấm 4 thẻ số.

## Kết quả mong đợi
- [ ] Không cuộn (scrollTop giữ 0), tab "Lãi lỗ" vẫn sáng; thẻ không có dấu ›, không nhận focus bàn phím.

> TC_BACKTEST_61 (bấm số lãi trong thẻ "Lãi lỗ đậm nhất" để mở biểu đồ tới deal) đã xoá: thẻ số chỉ để đọc từ 21/10/2026.

# [TC_BACKTEST_62] Lượt 1 chiến lược

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở lượt MBB (1 chiến lược).

## Kết quả mong đợi
- [ ] Không có ô lọc chiến lược, không có bảng so sánh, không có nút Biểu đồ/Bảng ở tiêu đề mục Lãi lỗ.
- [ ] Mục Lãi lỗ có "Lãi lỗ theo tháng"; thẻ số không có hộp chú thích khi rê chuột.

# [TC_BACKTEST_63] Đổi sang lượt khác

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở lượt CTD, lọc 1 chiến lược, cuộn xuống Chi tiết giao dịch.
2. Mở lượt MBB, rồi mở lại lượt CTD.

## Kết quả mong đợi
- [ ] Đổi lượt → cột kết quả cuộn về đầu; quay lại lượt CTD thì bộ lọc về "Tất cả chiến lược".

---

## Nhóm: Kết quả — lượt nhiều chiến lược

# [TC_BACKTEST_64] Bảng so sánh chiến lược

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở lượt mẫu CTD 4 chiến lược (5 năm).

## Kết quả mong đợi
- [ ] Cột: Chiến lược, Vốn, Tổng lãi lỗ ▼, Mua và nắm giữ, Sụt giảm vốn sâu nhất, Tỷ lệ thắng, Lãi/Lỗ, Deal, Lệnh, Lãi lỗ
  mỗi năm.
- [ ] 4 dòng xếp theo Tổng lãi lỗ giảm dần: 4. RSI…, 2. Đường trung bình nhanh…, 3. Giá cắt…, 1. Mẫu KFSP — tên cũ của "Chiến lược KFSP", lưu trong lượt mẫu chụp 15/10/2026 (số thứ tự
  giữ theo thẻ lúc chạy).
- [ ] Vốn "100.0 tr" (rê chuột hiện số đầy đủ 100,000,000); Tỷ lệ thắng "x.xx%" + "a/b lệnh"; Lãi/Lỗ "x.xx lần".

# [TC_BACKTEST_65] Sắp xếp bảng so sánh

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm tiêu đề "Chiến lược" 2 lần; rồi bấm "Lệnh".

## Kết quả mong đợi
- [ ] "Chiến lược" lần 1 tăng dần ▲ (1→4), lần 2 giảm dần ▼; "Lệnh" xếp giảm dần; chỉ cột đang xếp có mũi tên.

# [TC_BACKTEST_66] Chú thích cột "Lãi/Lỗ"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Rê chuột lên tiêu đề "Lãi/Lỗ", rồi sang "Vốn".

## Kết quả mong đợi
- [ ] Hiện "Lãi trung bình / lỗ trung bình của các lệnh đã bán."; sang cột không có chú thích thì ẩn.

# [TC_BACKTEST_67] Lọc theo chiến lược

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm dòng "RSI quá bán, quá mua". 2. Ở ô "Chiến lược" chọn "Tất cả chiến lược".

## Kết quả mong đợi
- [ ] Ô lọc có: Tất cả chiến lược + 4 chiến lược.
- [ ] Bước 1: ô lọc chọn RSI, tô tím (`on`); bảng so sánh ẩn (còn 1 chiến lược); ô Tổng lãi lỗ "+144.16%".
- [ ] Bước 2: bỏ lọc, ô số về như ban đầu, bảng 4 dòng.

# [TC_BACKTEST_68] Nút Biểu đồ / Bảng của bảng so sánh

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** nút nằm ở mép phải tiêu đề mục Lãi lỗ, dùng `.segment` chung (`aria-pressed`); mặc định "Bảng".

## Các bước thực hiện
1. Mở lượt CTD; bấm "Biểu đồ"; F5, mở lại lượt; bấm "Bảng".

## Kết quả mong đợi
- [ ] Mặc định "Bảng" đang chọn; bấm "Biểu đồ" thì bảng ẩn, hiện biểu đồ "Tổng lãi lỗ và Mua và nắm giữ".
- [ ] `localStorage.bt_chart_view["bang-ket-qua"] = "chart"`; sau F5 vẫn là biểu đồ; bấm "Bảng" thì bảng 4 dòng trở lại.

# [TC_BACKTEST_69] Thẻ số khi nhiều chiến lược — hộp chú thích khi rê chuột

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** tên chiến lược của con số không còn ghi dưới thẻ, mà hiện trong hộp chú thích khi rê chuột (21/10/2026).

## Các bước thực hiện
1. Mở lượt CTD (4 chiến lược), rê chuột lên thẻ "Sụt giảm vốn sâu nhất" rồi thẻ "Lãi lỗ đậm nhất".

## Kết quả mong đợi
- [ ] Thẻ Tỷ lệ thắng có chip "x/y lệnh".
- [ ] Hộp "Sụt giảm vốn sâu nhất": 1 dòng "<số>. <chiến lược> −x%". Hộp "Lãi lỗ đậm nhất": dòng lãi "<số>. <chiến lược>
  +x%" và dòng lỗ "<số>. <chiến lược> −y%". Hộp chỉ hiện khi rê chuột.

# [TC_BACKTEST_70] Cột "Lãi lỗ mỗi năm" chỉ có khi kỳ > 1 năm

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Kỳ 1 năm, 2 chiến lược (Chiến lược KFSP, Kênh SSL), chạy.

## Kết quả mong đợi
- [ ] Bảng 2 dòng, 9 cột, không có "Lãi lỗ mỗi năm".

---

## Nhóm: Chi tiết giao dịch

# [TC_BACKTEST_71] Replay / Biểu đồ ở mục Chi tiết giao dịch

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** nhóm nút dùng `.segment` chung, trạng thái chọn qua `aria-pressed`.

## Các bước thực hiện
1. Mở lượt MBB, xem mục Chi tiết giao dịch; bấm "Biểu đồ".

## Kết quả mong đợi
- [ ] Mặc định "Replay" đang chọn, thanh Replay hiện, đầu khung ghi "MBB", chưa có nút Thiết lập biểu đồ.
- [ ] Bấm "Biểu đồ": Replay ẩn, hiện nút "Thiết lập biểu đồ"; chưa có nút "Xem hết kỳ".

# [TC_BACKTEST_72] Thiết lập biểu đồ

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** 2 ô chỉ báo chỉ hiện khi chiến lược có đường chỉ báo vẽ được trên TradingView (Mẫu KFSP có; Chandelier
  Exit thì không) — test dùng lượt CTD lọc về Mẫu KFSP.

## Các bước thực hiện
1. Mở lượt CTD, lọc chiến lược "Mẫu KFSP", ở chế độ Biểu đồ, bấm bánh răng; bỏ/tích "Đường chỉ báo của chiến lược"; chọn "Biểu đồ nến"; bấm ra ngoài.

## Kết quả mong đợi
- [ ] Mặc định TradingView; tích sẵn "Điểm mua bán", "Đường nối lệnh, màu theo lãi lỗ", "Đường chỉ báo của chiến lược";
  "Chỉ báo dưới khung giá" chưa tích.
- [ ] Bỏ "Đường chỉ báo…" thì "Chỉ báo dưới khung giá" bị khoá; tích lại thì mở.
- [ ] Biểu đồ nến: không còn 2 ô Điểm mua bán / Đường nối lệnh. Bấm ra ngoài thì bảng đóng.

# [TC_BACKTEST_73] Thanh Replay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở Replay: xem tốc độ, bấm ▶ 2 lần, bấm Tập trung, Biểu đồ nến, bánh răng.

## Kết quả mong đợi
- [ ] Tốc độ: 1 giây = 1 ngày / tuần / tháng (mặc định) / quý / năm; ô ngày dd/mm/yyyy.
- [ ] ▶ (title "Chiếu lại") ↔ ❚❚ (title "Dừng").
- [ ] Tập trung, Biểu đồ nến sáng khi chọn; bảng "Thiết lập chiếu lại": "Tốc độ đều" (chọn sẵn), "Chậm lại khi có deal
  (chậm 4 lần)".

# [TC_BACKTEST_74] Thanh kéo Replay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Kéo thanh trượt về phiên thứ 10; bấm ↻ "Chiếu lại từ đầu".

## Kết quả mong đợi
- [ ] Ngày hiển thị đổi theo phiên; ↻ về đầu kỳ, ngày vẫn đúng dạng dd/mm/yyyy.

# [TC_BACKTEST_75] Bảng deal — đếm, sắp xếp, mở deal

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** bỏ cột Ghi chú (16/10/2026); deal đang mở có nhãn "Đang mở", dòng deal mở có lớp `is-open`.

## Các bước thực hiện
1. Mở lượt MBB; đổi sắp xếp Cũ nhất / Mới nhất; bấm 1 deal; bấm "Mở tất cả" rồi "Thu gọn tất cả".

## Kết quả mong đợi
- [ ] Đếm "n deal, 10 lệnh", đúng n dòng deal; cột: Deal, Ngày, Giá, KL, Lãi lỗ, Số phiên (không còn Ghi chú).
- [ ] Mặc định "Mới nhất"; "Cũ nhất" đưa Deal 1 lên đầu.
- [ ] Bấm deal → xổ dòng con; Mở tất cả → mọi deal xổ; Thu gọn tất cả → hết dòng con.

# [TC_BACKTEST_76] Bảng deal — Lãi nhất, Hiện cảnh báo bán, nhãn Đang mở

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** biểu tượng Ghi chú (rê chuột hiện lý do mua/bán) bỏ cùng cột Ghi chú; thay bằng kiểm nhãn "Đang mở".

## Các bước thực hiện
1. Mở lượt MBB, sắp "Lãi nhất", Mở tất cả, tích "Hiện cảnh báo bán".

## Kết quả mong đợi
- [ ] Deal xếp theo lãi lỗ giảm dần; tích ô thì số dòng con không giảm (thêm dòng Cảnh báo bán / Huỷ cảnh báo nếu có).
- [ ] Deal chưa bán mang nhãn "Đang mở", khoảng ngày "… tới nay".

# [TC_BACKTEST_77] Bảng deal của lượt nhiều chiến lược

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở lượt CTD; ở ô chọn của bảng deal chọn "RSI quá bán, quá mua".

## Kết quả mong đợi
- [ ] Ô chọn có "Tất cả chiến lược (n deal)"; cột: Deal, Chiến lược, Ngày, Giá, KL, Lãi lỗ, Số phiên.
- [ ] Chọn RSI → "6 deal, 6 lệnh"; đầu khung biểu đồ "CTD · …".

---

## Nhóm: Thu gọn cột thiết lập

# [TC_BACKTEST_78] Thu gọn cột thiết lập

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** nút biểu tượng "Quy mô một deal" đổi tên "Số tiền mỗi lần mua".

## Các bước thực hiện
1. Bấm "Thu gọn thiết lập"; F5; bấm "Mở thiết lập".

## Kết quả mong đợi
- [ ] Còn cột 6 nút (Mở thiết lập + Mã, Chiến lược chạy, Thời gian chạy, Số tiền mỗi lần mua, Lịch sử các lần chạy — rê
  chuột hiện tên); `bt_sidebar_collapsed = "1"`, giữ sau F5; mở lại thì về "0".

# [TC_BACKTEST_79] Nút biểu tượng mở đúng ô thiết lập

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đang thu gọn, bấm nút "Số tiền mỗi lần mua".

## Kết quả mong đợi
- [ ] Cột thiết lập mở, ô "Số tiền mỗi lần mua" nháy viền (`bt-tl-flash`) khoảng 1,2 giây rồi tắt.

# [TC_BACKTEST_80] Nút "Lịch sử các lần chạy" ở cột thu gọn

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** thẻ Lịch sử luôn mở (không còn thu gọn được), nên nút này mở cột thiết lập và nháy viền tiêu đề thẻ Lịch sử.

## Các bước thực hiện
1. Lịch sử có 1 lượt, cột đang thu gọn; bấm nút "Lịch sử các lần chạy".

## Kết quả mong đợi
- [ ] Cột thiết lập mở, tiêu đề "Lịch sử các lần chạy" nháy viền rồi tắt; thẻ lượt hiện.

---

## Nhóm: Chung

# [TC_BACKTEST_81] Đọc lịch sử thật của tài khoản (chỉ đọc)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào trang với API lịch sử thật (chặn mọi lệnh ghi), mở lượt mới nhất.

## Kết quả mong đợi
- [ ] Số đếm "n/100" khớp số thẻ; mở được kết quả 4 thẻ số; không có lệnh ghi nào bị gửi.

# [TC_BACKTEST_82] Màn hình 1280px

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cửa sổ 1280×800, mở lượt CTD.

## Kết quả mong đợi
- [ ] Nút Chạy nằm trong màn hình, trang không tràn ngang.

# [TC_BACKTEST_83] Máy chủ lưu lượt trả lời ngay → lượt vừa chạy vẫn được mở

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** bug cũ ĐÃ SỬA trên preprod — `adoptServerId` nay đổi luôn `viewedRunId`/`renderRunId` khi máy chủ cấp id. (Trước:
  `openRun("tmp-1")` chờ 2 khung hình rồi mới đặt `viewedRunId`, POST xong trước đó thì kết quả không mở — gặp khi
  chuyển tab lúc đang chạy.)

## Các bước thực hiện
1. Cho `POST /api/backtest/run` trả lời ngay (0ms), kỳ 1 năm, bấm Chạy.

## Kết quả mong đợi
- [ ] Chạy xong tự mở kết quả "Lượt #1", thẻ lượt sáng lên, 4 thẻ số.

# [TC_BACKTEST_84] Ngày sai định dạng → báo lỗi khoảng thời gian

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tuỳ chỉnh, Từ ngày "01/13/2025" (tháng 13), Tới ngày hôm nay, bấm Chạy.

## Kết quả mong đợi
- [ ] Ô viền đỏ; hộp lỗi 3 dòng: Chuyện gì "Khoảng thời gian chưa dùng được." · Vì sao "Ngày phải ghi theo dạng
  ngày/tháng/năm, và ngày đầu phải trước ngày cuối." · Làm gì tiếp "Sửa lại hai ô Từ ngày và Tới ngày."
- [ ] Không chạy, không gửi lưu lượt nào.

# [TC_BACKTEST_85] Xoá 1 lượt bằng nút thùng rác

- **Trạng thái:** 🆕 Testcase mới (tính năng thêm 15/10/2026)

## Các bước thực hiện
1. Lịch sử 2 lượt, đang mở lượt MBB; rê chuột lên thẻ MBB, bấm thùng rác "Xoá lượt chạy này".
2. Rê chuột lên thẻ còn lại, bấm thùng rác.

## Kết quả mong đợi
- [ ] Nút thùng rác chỉ hiện khi rê chuột; bấm là xoá ngay, KHÔNG hỏi lại (khác Xoá toàn bộ).
- [ ] Gửi `DELETE /api/backtest/run/2`; lịch sử còn 1 lượt, số đếm "1/100".
- [ ] Đang xem đúng lượt bị xoá → tự mở lượt kế bên (CTD), thẻ đó sáng.
- [ ] Xoá nốt lượt cuối → "Chưa có lượt chạy nào.", cột kết quả về khung chờ.

# [TC_BACKTEST_86] Xoá 1 lượt lỗi 500

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho DELETE trả 500; bấm thùng rác ở thẻ MBB.

## Kết quả mong đợi
- [ ] Toast "Chưa xoá được lượt chạy (mã 500)"; thẻ MBB trở về đúng chỗ cũ (đầu danh sách), lịch sử vẫn 2 lượt.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 75 |
| ⚠️ Cần xác nhận thêm | 6 (TC_05, TC_21, TC_25, TC_41, TC_43, TC_56) |
| **Tổng** | **81** |

Cập nhật 09/11/2026: 84 → 81 TC (xoá TC_31, 50, 51, 55, 61; thêm TC_85, 86; TC_83 chuyển từ ⚠️ bug sang 🆕 vì đã sửa;
TC_56 thành ⚠️ bug nghi vấn). Không có `test.fixme` — cả 81 case chạy tự động trên kfsp.vn. Case ⚠️ assert đúng hành vi
đo được, nên khi dev sửa thì test sẽ fail — lúc đó đổi assert về hành vi đúng.

## Phát hiện đáng chú ý

1. **🐞 Lượt đã bị dọn chi tiết trông như lượt không có dữ liệu** (TC_56, mới 09/11/2026) — dải "Lượt này chỉ còn phần
   tóm tắt." không còn được vẽ; trang hiện "0/0 lệnh", "Chưa có lệnh nào đã bán", "Không có dữ liệu giá cho mã …". Chính
   chú thích trong `combineSummaries` cảnh báo không được để hai trường hợp này lẫn nhau.
2. **🐞 Bảng chọn chiến lược ném lỗi JS mỗi lần mở** (TC_21, vẫn còn) — `this.applySearch.cancel is not a function`
   (debounce khai trong `methods` bị Vue bind mất `.cancel`). Mở lại bảng còn chữ tìm cũ, ô tìm không tự focus.
3. **🐞 Ngày gõ dở vẫn chạy được** (TC_25, vẫn còn) — ô "01/02" viền đỏ nhưng bấm Chạy lại chạy kỳ 01/02/<năm nay>: ô
   kiểm strict, `checkRunInput` kiểm không strict.
4. **Đã sửa:** lượt vừa chạy không được mở khi máy chủ trả lời quá nhanh (TC_83) — `adoptServerId` nay đổi cả
   `viewedRunId`.
5. **Double-click nút Chạy** (TC_41) — nút Dừng thế chỗ nút Chạy; không đẻ 2 lượt, nhưng hành vi cụ thể phụ thuộc
   tốc độ chạy.
6. **Tài khoản Free dùng được toàn bộ** (TC_05) — không có gate theo gói. Cần PO xác nhận.
7. **Chế độ `?demo=1` vẫn lưu lượt lên lịch sử tài khoản** (TC_43).
8. **Không còn toast nào báo thành công** (TC_38, TC_53) — app tắt mọi `$toast.success` từ 12/10/2026; chạy trùng và
   xoá toàn bộ không còn câu báo.
9. Lỗi chính tả nhỏ: "Không có chiến lược nào khớp chữ **Bạn** tìm." (TC_19).
