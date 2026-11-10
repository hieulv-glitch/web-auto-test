# Màn hình: Phân tích kỹ thuật — Replay & Chia khung (tính năng mới)

- **URL:** `/phan-tich-ky-thuat` (yêu cầu đăng nhập).
- **Môi trường test:** `PREV2_BASE_URL` — từ 09/11/2026 là **https://kfsp.vn** (production = preprod mới nhất,
  deploy 06/11; prev2 bị deploy đè nhánh khác). Đăng nhập qua `Prev2Session` (`pages/Prev2Session.ts`): `TEST_USER_*`
  (trả phí), `FREE_USER_*` (miễn phí). Tài khoản `PREV2_USER_*` cũ không còn đăng nhập được (prev2 gọi backend
  production từ 11/2026). Spec dùng `test.use({ baseURL })` riêng, không đổi `BASE_URL` chung của dự án.
- **Cập nhật 09/11/2026 (Nhánh B):** (1) 07/10/2026 nút Replay, Bố cục lên thanh đầu trang (sau nút ⓘ Hướng dẫn) cùng
  nút mới "AI" mở/đóng tab AI Chart; cửa sổ hẹp dưới 1130 thì về cột nút tròn mép phải; bỏ nút "Mở rộng/Thu gọn công
  cụ" → xoá TC_02, 03, 04, 56; thêm TC_65, 66. (2) Tên thẻ chỉ còn mã ("VNM", không còn "VNM"). (3) 03–04/11/2026
  liên kết thẻ đồng bộ khung thời gian + chỉ báo thay vì mã, "Tạo nhóm mới" mở hộp chọn kiểu đồng bộ; chú thích "Liên
  kết với …" thay bằng hộp gợi ý khi rê chuột → sửa TC_41, 42, 48. Phần đồng bộ theo kiểu/khoảng thời gian (mới) thuộc
  bộ test riêng của nhóm "Biểu đồ: Liên kết thẻ theo khoảng thời gian".
- **Nguồn:** nhánh `origin/thanh/replay-phan-tich-ky-thuat` của `stocks` (commit ngày 30/09/2026):
  `ChartReplayBar.vue` (thanh Replay), `ChartLayoutPicker.vue` (nút + bảng Bố cục, thanh chọn thẻ),
  `TaOnboarding.vue` (hướng dẫn lần đầu), `tabLinks.js` (liên kết thẻ), `splitterAlign.js` (kéo thanh chia),
  `index.vue` (cột nút mép phải), `reactMultiLayoutChart.js` (`taLayoutApi`, giới hạn tài khoản Free), kèm
  `CHANGELOG_REPLAY.md` của dev.
- **Tài liệu liên quan:** [phan-tich-ky-thuat.md](phan-tich-ky-thuat.md) (khung/shell cũ: thêm/xoá tab, menu dọc
  phải), [phan-tich-ky-thuat-bieu-do.md](phan-tich-ky-thuat-bieu-do.md) (toolbar biểu đồ). Tài liệu này chỉ phủ
  phần **mới**: Replay, Bố cục/chia khung, kéo thanh chia, Liên kết thẻ, cột nút thu gọn, Hướng dẫn lần đầu, giới
  hạn tài khoản Free của các phần đó.
- **Phương pháp sinh:** không có testcase app tương ứng (app không có Replay/chia khung). Toàn bộ testcase do kiểm
  kê độc lập trên source + đo bằng Playwright thật trên prev2 (chạy Replay ở 20x/1x, đổi 21 cách chia, kéo thanh
  chia bằng chuột thật có/không giữ Alt, tạo/sửa/xoá nhóm liên kết, đi hết hướng dẫn, đăng nhập tài khoản Free
  thật, mất mạng khi đang chiếu).
- **Quy ước trạng thái:**
  - 🆕 Testcase mới: tính năng chỉ có trên web, đã/đang tự động hoá.
  - ⚠️ Cần xác nhận thêm: chưa kiểm chứng tự động được (đánh dấu `test.fixme` trong spec).

**⚠️ AN TOÀN DỮ LIỆU — ĐỌC TRƯỚC KHI SỬA TEST:** bố cục (`layout_multi_ta`, gồm cả nhóm liên kết thẻ) và cờ
`ta_onboarding_seen` lưu **theo tài khoản** qua API `/updateusersettings`, `/delusersettings`. `TaReplayLayoutPage.open()`
**chặn (abort)** cả 2 API này ở mọi test, nên chia khung, liên kết thẻ, đóng hướng dẫn… chỉ đổi trên trình duyệt,
không ghi gì lên tài khoản. Đồng thời `open()` sửa response `/getusersettings` để thay bố cục thật của tài khoản
(lúc khảo sát: 5 khung, 16 thẻ) bằng bố cục cố định của từng test. Vì vậy các test **chạy song song được**,
không cần `--workers=1` như các spec PTKT cũ.

---

## Nhóm: Cột nút công cụ (mép phải)

# [TC_PTKT_RP_01] Thanh đầu trang có 3 nút Replay, Bố cục, AI

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** trước 07/10/2026 là cột nút tròn mép phải (Replay, Bố cục, Mở rộng/Thu gọn).

## Các bước thực hiện
1. Cửa sổ 1600×900, vào trang Biểu đồ (`/phan-tich-ky-thuat`).

## Kết quả mong đợi
- [ ] Trên thanh đầu trang, ngay sau nút ⓘ Hướng dẫn, có 3 nút: Replay (aria-label + chú thích "Mở Replay"), Bố cục
  (chú thích "Bố cục"), "AI".
- [ ] Không còn nút "Mở rộng/Thu gọn công cụ".

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí, cửa sổ cao ≥ 800 (1600×900), vào `/phan-tich-ky-thuat`.
2. Rê chuột lên nút tròn Replay.

## Kết quả mong đợi
- [ ] Có 3 nút: "Mở Replay", "Bố cục", "Mở rộng/Thu gọn công cụ" (`aria-expanded="true"`).
- [ ] Chú thích nút Replay là "Mở Replay"; chú thích nút Bố cục là "Bố cục".

> TC_PTKT_RP_02/03/04 (thu gọn / mở rộng cột nút, tự thu gọn khi cửa sổ thấp) đã xoá: nút Mở rộng/Thu gọn công cụ bỏ từ 07/10/2026.

## Các bước thực hiện
1. Bấm "Mở rộng/Thu gọn công cụ".
2. Tải lại trang (F5).

## Kết quả mong đợi
- [ ] Sau bước 1: nút Replay và Bố cục biến mất, nút thu gọn còn lại với `aria-expanded="false"`.
- [ ] `localStorage.ta_tools_collapsed = "1"`.
- [ ] Sau F5 cột nút vẫn ở trạng thái thu gọn.

## Các bước thực hiện
1. Thu gọn cột nút, bấm lại "Mở rộng/Thu gọn công cụ".

## Kết quả mong đợi
- [ ] Nút Replay và Bố cục hiện lại; `aria-expanded="true"`; `localStorage.ta_tools_collapsed = "0"`.

## Các bước thực hiện
1. Cửa sổ 1280×720, chưa có khoá `ta_tools_collapsed`, vào trang.

## Kết quả mong đợi
- [ ] Nút Replay và Bố cục bị ẩn, nút thu gọn có `aria-expanded="false"`.

# [TC_PTKT_RP_05] Nút công cụ chỉ có ở trang Biểu đồ

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** menu "Phân tích kỹ thuật" đổi tên "Biểu đồ" (đường dẫn giữ nguyên).

## Các bước thực hiện
1. Vào trang Biểu đồ, rồi sang Dashboard.

## Kết quả mong đợi
- [ ] Ở Dashboard không có nút Replay, Bố cục, AI; chỗ chờ `#ta-header-tools` trên thanh đầu trang trống.

## Các bước thực hiện
1. Vào `/phan-tich-ky-thuat`, sau đó vào `/dashboard`.

## Kết quả mong đợi
- [ ] Ở Dashboard không có nút "Mở Replay", "Bố cục", "Mở rộng/Thu gọn công cụ".

---

## Nhóm: Replay — thanh điều khiển

# [TC_PTKT_RP_06] Mở thanh Replay bằng nút tròn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm nút tròn "Mở Replay".

## Kết quả mong đợi
- [ ] Thanh Replay hiện ở đáy vùng biểu đồ, thứ tự: tay nắm kéo, ô ngày, Chạy, Tiến 1 nến, Về hiện tại, tốc độ,
      "Biểu đồ: n/m ▾", nút đóng ✕.
- [ ] Nút tròn đổi nhãn thành "Đóng Replay".

# [TC_PTKT_RP_07] Giá trị mặc định của thanh Replay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở thanh Replay (chưa chạy).

## Kết quả mong đợi
- [ ] Ô ngày = hôm nay − 90 ngày (giờ Việt Nam); thuộc tính `max` = hôm qua (không chọn được hôm nay/tương lai).
- [ ] Tốc độ hiển thị "20x" (mặc định cho mọi tài khoản).
- [ ] Bố cục 2 khung, 3 thẻ (khung 1 có 2 thẻ) → nút ghi "Biểu đồ: 2/3" (mặc định "Các thẻ đang hiện").
- [ ] Nút Chạy bật; "Tiến 1 nến" và "Về hiện tại" bị tắt; chưa có ngày đang chiếu.

# [TC_PTKT_RP_08] Danh sách tốc độ: 6 mức kèm mô tả theo khung thời gian

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm nút tốc độ (khung đang chiếu là 1D).

## Kết quả mong đợi
- [ ] Danh sách đúng 6 mức: 1x, 5x, 10x, 20x, 50x, 200x.
- [ ] Mô tả theo nến ngày: "1 ngày/giây", "5 ngày/giây"… "200 ngày/giây".
- [ ] Mức 20x đang được chọn (`aria-selected="true"`).

# [TC_PTKT_RP_09] Chọn tốc độ khác cập nhật nút và đóng danh sách

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở danh sách tốc độ, chọn "5x".

## Kết quả mong đợi
- [ ] Nút tốc độ ghi "5x"; danh sách đóng.

# [TC_PTKT_RP_10] Chạy Replay: hiện ngày đang chiếu, nến tiến dần

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được:** bắt đầu 03/07/2026 ở 20x, sau 2 giây tới 26/08/2026.

## Các bước thực hiện
1. Mở Replay, bấm Chạy, chờ 2 giây.

## Kết quả mong đợi
- [ ] Xuất hiện ô "Nến đang chiếu tới" dạng `dd/mm/yyyy`, lúc đầu bằng ngày bắt đầu hoặc ngay sau đó.
- [ ] Nút Chạy đổi thành "Dừng".
- [ ] Sau 2 giây ngày đang chiếu muộn hơn ngày bắt đầu.

# [TC_PTKT_RP_11] Dừng giữ nguyên mốc; "Tiến 1 nến" tiến đúng 1 phiên

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được:** dừng ở 28/08/2026 (thứ Sáu), tiến 1 nến → 03/09/2026 (bỏ qua cuối tuần và nghỉ lễ 2/9).

## Các bước thực hiện
1. Đang chạy, bấm "Dừng"; chờ 3 giây.
2. Bấm "Tiến 1 nến".

## Kết quả mong đợi
- [ ] Sau bước 1 ngày đang chiếu không đổi; nút "Tiến 1 nến" bật, nút chính ghi "Chạy".
- [ ] Sau bước 2 ngày đang chiếu sang phiên giao dịch kế tiếp (muộn hơn, không quá 7 ngày lịch).

# [TC_PTKT_RP_12] Tốc độ quyết định số nến mỗi giây

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn 1x, ngày bắt đầu cố định, chạy 3 giây rồi dừng; ghi số ngày đã tiến.
2. Về hiện tại, chọn lại đúng ngày đó, chọn 20x, chạy 3 giây rồi dừng.

## Kết quả mong đợi
- [ ] 1x: tiến khoảng 3–4 phiên (≤ 10 ngày lịch).
- [ ] 20x: tiến nhiều hơn hẳn (≥ 30 ngày lịch).

# [TC_PTKT_RP_13] Chạy tới nến mới nhất thì tự dừng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đặt ngày bắt đầu = hôm qua − 6 ngày, chạy ở 20x, chờ 6 giây.

## Kết quả mong đợi
- [ ] Nút chính có nhãn "Đã tới nến mới nhất" và bị tắt; "Tiến 1 nến" bị tắt.
- [ ] "Về hiện tại" vẫn bật.

# [TC_PTKT_RP_14] Đổi ngày bắt đầu khi đang chiếu

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được:** sau khi đổi ngày, biểu đồ chiếu lại từ đúng ngày mới và ở trạng thái **dừng** (nút ghi "Chạy").

## Các bước thực hiện
1. Đang chiếu, đổi ô ngày sang 04/05/2026.

## Kết quả mong đợi
- [ ] Ngày đang chiếu = 04/05/2026; nút chính ghi "Chạy".

# [TC_PTKT_RP_15] "Về hiện tại" thoát chiếu lại nhưng giữ thanh mở

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đang chiếu, bấm "Về hiện tại".

## Kết quả mong đợi
- [ ] Ô ngày đang chiếu biến mất; thanh Replay vẫn hiện; "Về hiện tại" và "Tiến 1 nến" bị tắt.

# [TC_PTKT_RP_16] Nút ✕ đóng hẳn thanh Replay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đang chiếu, bấm ✕ "Đóng Replay" trên thanh.

## Kết quả mong đợi
- [ ] Thanh Replay biến mất; nút tròn trở về "Mở Replay".

# [TC_PTKT_RP_17] Bấm lại nút tròn để đóng Replay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở Replay, bấm lại nút tròn ("Đóng Replay").

## Kết quả mong đợi
- [ ] Thanh Replay biến mất; nút tròn trở về "Mở Replay".

# [TC_PTKT_RP_18] Kéo thanh Replay bằng tay nắm

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Kéo tay nắm bên trái thanh lên trên và sang trái 300px.

## Kết quả mong đợi
- [ ] Thanh dời theo chuột (toạ độ x, y đều giảm ~300px).

## Nhóm: Replay — chọn biểu đồ chiếu lại

# [TC_PTKT_RP_20] Bảng "Biểu đồ: n/m" hiển thị đúng khung và thẻ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung (khung 1: VNM đang mở + FPT; khung 2: HPG). Mở Replay, bấm "Biểu đồ: 2/3".

## Kết quả mong đợi
- [ ] Mục "Chọn nhanh" có 3 lựa chọn: "Các thẻ đang hiện" (đang chọn), "Tất cả thẻ", "Chỉ ô đang chọn".
- [ ] Danh sách "Khung 1" (VNM nhãn "đang hiện", FPT nhãn "chưa mở"), "Khung 2" (HPG "đang hiện").

# [TC_PTKT_RP_21] Các lựa chọn nhanh đổi số thẻ chiếu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung, 4 thẻ. Lần lượt chọn "Chỉ ô đang chọn", "Tất cả thẻ", "Các thẻ đang hiện".

## Kết quả mong đợi
- [ ] Nút ghi lần lượt "Biểu đồ: 1/4", "Biểu đồ: 4/4", "Biểu đồ: 2/4".

# [TC_PTKT_RP_22] Bỏ tick 1 thẻ chuyển sang "Tự chọn", khung tick một phần

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "Tất cả thẻ", bỏ tick thẻ MBB (khung 2).

## Kết quả mong đợi
- [ ] Nút ghi "Biểu đồ: 3/4"; xuất hiện lựa chọn "Tự chọn".
- [ ] Ô tick "Khung 2" ở trạng thái một phần (`indeterminate`).

# [TC_PTKT_RP_23] Tick khung chọn hết thẻ của khung đó

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "Chỉ ô đang chọn" (1/4), tick ô "Khung 2".

## Kết quả mong đợi
- [ ] Nút ghi "Biểu đồ: 3/4"; cả 2 thẻ của Khung 2 được tick.

# [TC_PTKT_RP_24] Lựa chọn thẻ chiếu lại được nhớ sau khi tải lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tạo lựa chọn "Tự chọn" 3/4. Tải lại trang, mở Replay.

## Kết quả mong đợi
- [ ] `localStorage.ta_replay_selection` có `"mode":"custom"`.
- [ ] Sau F5 nút vẫn ghi "Biểu đồ: 3/4". (Tốc độ không được nhớ, quay về 20x.)

# [TC_PTKT_RP_25] ⚠️ Nhiều ô chiếu cùng mốc; ô bị che và ô chưa mở vào lượt chiếu

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** mốc của từng ô chỉ thể hiện trên canvas TradingView trong iframe; không có DOM/biến toàn cục nào
  đọc ra được ngày nến cuối của từng ô. Cần kiểm tra thủ công, hoặc dev mở 1 điểm đọc trạng thái cho test.

## Các bước thực hiện
1. Bố cục nhiều khung, chọn "Tất cả thẻ", bắt đầu từ 1 ngày, tiến vài nến.
2. Mở 1 thẻ "chưa mở" trong lúc đang chiếu. Bỏ tick 1 thẻ đang chiếu.

## Kết quả mong đợi
- [ ] Mọi ô đã chọn dừng ở cùng mốc; ô nến tuần chỉ gồm các phiên tới mốc.
- [ ] Thẻ vừa mở vào lượt tại đúng mốc đang chiếu; thẻ bị bỏ tick về dữ liệu hiện tại, các ô khác vẫn chiếu.

## Nhóm: Bố cục — chia khung

# [TC_PTKT_RP_27] Bảng Bố cục hiển thị đủ 21 cách chia

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung cạnh nhau, bấm nút "Bố cục".

## Kết quả mong đợi
- [ ] Mục "Bố cục trang" có các hàng "1 khung" … "6 khung", tổng 21 nút cách chia, tên đúng (vd "Lưới 2 cột,
      2 hàng", "1 lớn và 5 nhỏ").
- [ ] Cách chia đang dùng "2 khung cạnh nhau" được tô (`.on`), chỉ 1 nút được tô.
- [ ] Có nút "Đặt lại bố cục"; mục "Liên kết thẻ" có nút "Tạo nhóm liên kết". Không nút nào bị tắt (tài khoản
      trả phí tối đa 6 khung).

# [TC_PTKT_RP_28] Đóng bảng Bố cục bằng Esc, bấm lại nút, bấm ra ngoài

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở bảng, bấm Esc. 2. Mở bảng, bấm lại nút Bố cục. 3. Mở bảng, bấm vào panel "Thông tin".

## Kết quả mong đợi
- [ ] Cả 3 lần bảng đều đóng.

# [TC_PTKT_RP_29] Chọn "3 cột": giữ mọi thẻ, thêm thẻ cho khung mới, chia đều

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung (VNM, FPT | HPG), chọn "3 cột".

## Kết quả mong đợi
- [ ] Có 3 khung, rộng bằng nhau (lệch ≤ 2px), cùng toạ độ y.
- [ ] Thẻ cũ VNM, FPT, HPG còn đủ; khung mới có thêm 1 thẻ "VNM" (mã thẻ đang chọn, nến 1D).
- [ ] Bảng Bố cục tự đóng.

# [TC_PTKT_RP_30] Chọn "1 khung": thẻ của các khung dồn vào 1 khung

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung, 3 thẻ, chọn "1 khung".

## Kết quả mong đợi
- [ ] Còn 1 khung, đủ 3 thẻ VNM, FPT, HPG.

# [TC_PTKT_RP_31] "2 khung trên dưới" xếp dọc

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung cạnh nhau, chọn "2 khung trên dưới".

## Kết quả mong đợi
- [ ] 2 khung cùng toạ độ x, khung thứ hai nằm dưới khung thứ nhất.
- [ ] Mở lại bảng: "2 khung trên dưới" được tô.

# [TC_PTKT_RP_32] Đủ 21 cách chia đều cho đúng số khung

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** thẻ không bao giờ bị xoá khi đổi cách chia, nên đổi qua lại nhiều lần thì số thẻ bằng số khung lớn
  nhất từng dùng (đi từ 1 tới 6 khung → tối đa 6 thẻ, dưới giới hạn 15 thẻ).

## Các bước thực hiện
1. Lần lượt chọn từng cách chia trong 21 cách (theo thứ tự trong bảng).

## Kết quả mong đợi
- [ ] Mỗi lần số khung đúng bằng số khung của hàng chứa cách chia đó; cách chia vừa chọn được tô.

# [TC_PTKT_RP_33] "Đặt lại bố cục" chia đều cỡ các khung

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục "3 cột", kéo thanh chia đầu tiên sang phải 150px (các khung lệch cỡ).
2. Mở bảng Bố cục, bấm "Đặt lại bố cục".

## Kết quả mong đợi
- [ ] Sau bước 1 khung đầu rộng hơn khung thứ hai > 100px.
- [ ] Sau bước 2 ba khung rộng bằng nhau (lệch ≤ 2px); số khung và số thẻ giữ nguyên; bảng đóng.

# [TC_PTKT_RP_34] Đổi bố cục khi đang Replay thì thoát Replay

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được:** `pick()` gọi `replayRegistry.bar.exit()` nên thanh Replay **đóng hẳn** (CHANGELOG chỉ ghi
  "các ô về dữ liệu hiện tại trước khi chia lại"). Ghi đúng hành vi đang chạy, cần xác nhận với dev đây là chủ đích.

## Các bước thực hiện
1. Bố cục 1 khung, đang chiếu Replay, mở Bố cục chọn "2 khung cạnh nhau".

## Kết quả mong đợi
- [ ] Bố cục thành 2 khung; thanh Replay đóng; nút tròn về "Mở Replay".

# [TC_PTKT_RP_35] Đổi bố cục gửi lệnh lưu bố cục theo tài khoản

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** lệnh ghi bị test chặn, không lưu thật lên tài khoản.

## Các bước thực hiện
1. Chọn "3 cột", chờ 4 giây (debounce lưu 3 giây).

## Kết quả mong đợi
- [ ] Có ít nhất 1 lệnh `/updateusersettings` chứa khoá `layout_multi_ta` mô tả 3 khung.

---

## Nhóm: Kéo thanh chia khung

# [TC_PTKT_RP_36] Kéo thanh chia đổi cỡ 2 khung

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung cạnh nhau, kéo thanh chia dọc sang phải 150px.

## Kết quả mong đợi
- [ ] Khung trái rộng thêm ~150px, khung phải hẹp đi tương ứng.

# [TC_PTKT_RP_37] Thanh chung: rê chuột hiện vạch dài, kéo thì các đoạn cùng dời

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được:** lưới 2×2 (1600×900): 2 thanh ngang riêng ở y = 477 (x 10–605 và 609–1204); rê chuột hiện
  1 vạch `.ta-split-line` dài 1194px; kéo xuống 60px thì cả 4 khung đổi cỡ.

## Các bước thực hiện
1. Chọn "Lưới 2 cột, 2 hàng". Rê chuột lên thanh ngang của cột trái.
2. Kéo thanh đó xuống 60px.

## Kết quả mong đợi
- [ ] Bước 1: vạch `.ta-split-line` dài hết 2 cột.
- [ ] Bước 2: khung trên của cả 2 cột cao thêm ~60px, chiều cao 2 cột bằng nhau.

# [TC_PTKT_RP_38] Giữ Alt kéo riêng một đoạn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Lưới 2×2, giữ Alt, kéo thanh ngang cột trái xuống 40px.

## Kết quả mong đợi
- [ ] Chỉ khung trên cột trái cao thêm ~40px; cột phải giữ nguyên.

# [TC_PTKT_RP_39] Hút thẳng hàng khi thả gần thanh khác (≤ 8px)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Sau TC_38 (cột trái lệch 40px), giữ Alt kéo thanh cột trái lên 35px (còn cách thanh cột phải 5px).

## Kết quả mong đợi
- [ ] Thanh cột trái hút về đúng toạ độ thanh cột phải: khung trên 2 cột cao bằng nhau.

---

## Nhóm: Liên kết thẻ

# [TC_PTKT_RP_40] Giữ Ctrl bấm 1 thẻ: bật thanh chọn thẻ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung (VNM, FPT | HPG), không thẻ nào liên kết. Giữ Ctrl bấm thẻ "VNM".

## Kết quả mong đợi
- [ ] Thẻ VNM có viền chọn (`.ta-tab-picked`), thẻ không bị mở/kéo.
- [ ] Thanh chọn thẻ hiện: "Đã chọn 1 thẻ", gợi ý "Chọn thêm 1 thẻ để tạo nhóm liên kết", nút "Huỷ".

# [TC_PTKT_RP_41] Tạo nhóm liên kết từ 2 thẻ

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** "Tạo nhóm mới" mở hộp "Đồng bộ giữa các thẻ" (mặc định tích 2 ô: khung thời gian + chỉ báo), bấm "Tạo nhóm" mới
  tạo; thẻ đã liên kết không còn chú thích "Liên kết với …" mà có hộp gợi ý khi rê chuột (không ghi tên nhóm).

## Các bước thực hiện
1. Ctrl bấm "VNM" và "FPT", bấm "Tạo nhóm mới", bấm "Tạo nhóm".
2. Rê chuột lên thẻ VNM.

## Kết quả mong đợi
- [ ] Thanh chọn thẻ ghi "Đã chọn 2 thẻ"; hộp "Đồng bộ giữa các thẻ" có 2 ô tích sẵn.
- [ ] Tạo xong: thanh chọn thẻ đóng; VNM, FPT cùng nhóm `link-1` (chấm màu nhóm), HPG không liên kết.
- [ ] Rê chuột lên VNM: hộp gợi ý không có tiêu đề nhóm, chỉ dòng "Giữ Ctrl hoặc Shift …".

## Các bước thực hiện
1. Ctrl bấm "VNM" và "FPT", bấm "Tạo nhóm mới".

## Kết quả mong đợi
- [ ] Trước khi bấm, thanh ghi "Đã chọn 2 thẻ" và có nút "Tạo nhóm mới".
- [ ] Sau khi bấm: thanh chọn đóng; 2 thẻ có chấm màu nhóm Cam (`link-1`); chú thích lần lượt "Liên kết với
      FPT", "Liên kết với VNM"; thẻ HPG không có chấm.

# [TC_PTKT_RP_42] Thẻ cùng nhóm KHÔNG đổi mã theo nhau

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** hành vi đổi theo yêu cầu 03/11/2026 — nhóm liên kết đồng bộ khung thời gian + chỉ báo, mã từng thẻ giữ nguyên (trước
  đó đổi mã theo nhau). Đồng bộ khung thời gian/chỉ báo/trỏ chuột/khoảng thời gian kiểm ở bộ test nhóm 6.

## Các bước thực hiện
1. Bố cục 2 khung VNM | HPG cùng nhóm `link-1` (nhóm cũ, chưa có `link_sync`). Đổi mã khung 1 thành FPT.

## Kết quả mong đợi
- [ ] Khung 1 thành "FPT", khung 2 vẫn "HPG".

## Các bước thực hiện
1. Bố cục: khung 1 VNM, khung 2 HPG, cùng nhóm Cam. Đổi mã khung 1 sang FPT qua ô tìm kiếm TradingView.

## Kết quả mong đợi
- [ ] Cả 2 thẻ thành "FPT".

# [TC_PTKT_RP_43] Thẻ không liên kết không đổi mã theo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục: khung 1 VNM, khung 2 HPG, không liên kết. Đổi mã khung 1 sang FPT.

## Kết quả mong đợi
- [ ] Khung 1 thành "FPT", khung 2 vẫn "HPG".

# [TC_PTKT_RP_44] Huỷ hoặc Esc bỏ chọn thẻ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ctrl bấm 1 thẻ, bấm "Huỷ". 2. Ctrl bấm 1 thẻ, bấm Esc.

## Kết quả mong đợi
- [ ] Cả 2 lần thanh chọn thẻ đóng, không còn thẻ nào có viền chọn, không nhóm nào được tạo.

# [TC_PTKT_RP_45] Bảng Bố cục liệt kê nhóm; ✕ xoá 1 thẻ khỏi nhóm, nhóm còn 1 thẻ vẫn giữ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục có 2 nhóm: Cam (VNM, FPT), Xanh ngọc (HPG, MBB). Mở bảng Bố cục.
2. Bấm ✕ "Xoá FPT khỏi nhóm".

## Kết quả mong đợi
- [ ] Bước 1: mục "Liên kết thẻ" có 2 dòng nhóm, mỗi dòng liệt kê đúng thẻ + ô "Thêm thẻ".
- [ ] Bước 2: nhóm Cam chỉ còn VNM và vẫn tồn tại; thẻ FPT hết liên kết (`link-6`).

# [TC_PTKT_RP_46] Xoá nhóm liên kết

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bảng Bố cục có 2 nhóm, bấm thùng rác "Xoá nhóm liên kết" ở nhóm thứ hai.

## Kết quả mong đợi
- [ ] Còn 1 dòng nhóm; thẻ HPG, MBB không còn chấm màu.

# [TC_PTKT_RP_47] "+ Thêm thẻ" vào một nhóm có sẵn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhóm Cam (VNM, FPT). Trong bảng Bố cục bấm "Thêm thẻ" của nhóm Cam.
2. Bấm thường (không giữ phím) vào thẻ "HPG", bấm "Thêm".

## Kết quả mong đợi
- [ ] Bước 1: bảng đóng; mọi thẻ hiện ô tick; thanh ghi "Chọn thẻ để thêm vào nhóm ● Cam".
- [ ] Bước 2: trước khi bấm Thêm thanh ghi "Đã chọn 1 thẻ" và có nút "Thêm"; sau khi bấm HPG có `link-1`.

# [TC_PTKT_RP_48] "Tạo nhóm liên kết" bật chế độ chọn thẻ không cần giữ phím

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật 09/11/2026 (preprod, chạy trên kfsp.vn):** bước tạo nhóm qua hộp "Đồng bộ giữa các thẻ" → "Tạo nhóm".

## Các bước thực hiện
1. Mở bảng Bố cục, bấm "Tạo nhóm liên kết".
2. Bấm thường vào thẻ FPT và HPG, bấm "Tạo nhóm mới" → "Tạo nhóm".

## Kết quả mong đợi
- [ ] Bảng Bố cục đóng; mỗi thẻ hiện ô tick (3 ô); thanh "Đã chọn 0 thẻ".
- [ ] FPT, HPG cùng nhóm `link-1`, VNM không liên kết.

## Các bước thực hiện
1. Mở bảng Bố cục, bấm "Tạo nhóm liên kết". 2. Bấm thường 2 thẻ, bấm "Tạo nhóm mới".

## Kết quả mong đợi
- [ ] Bảng đóng; mọi thẻ biểu đồ hiện ô tick (`.ta-tab-check`); thanh ghi "Đã chọn 0 thẻ".
- [ ] Sau bước 2 hai thẻ vào cùng 1 nhóm.

# [TC_PTKT_RP_49] Thanh chọn thẻ: "Thêm vào nhóm ▾" và "Xoá khỏi nhóm"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhóm Cam (VNM, HPG); FPT, MBB chưa liên kết. Ctrl bấm VNM và MBB.
2. Bấm "Thêm vào nhóm", chọn "Nhóm Cam".
3. Ctrl bấm VNM, bấm "Xoá khỏi nhóm".

## Kết quả mong đợi
- [ ] Bước 1: thanh có đủ "Tạo nhóm mới", "Thêm vào nhóm", "Xoá khỏi nhóm", "Huỷ".
- [ ] Bước 2: menu liệt kê "Nhóm Cam" kèm "VNM, HPG"; sau khi chọn MBB vào `link-1`.
- [ ] Bước 3: chỉ có nút "Xoá khỏi nhóm" (không có Tạo/Thêm); sau khi bấm VNM về `link-6`.

# [TC_PTKT_RP_50] Đã dùng đủ 5 màu nhóm thì không tạo được nhóm mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục có đủ 5 nhóm (link-1 … link-5, mỗi nhóm 2 thẻ) và 2 thẻ chưa liên kết.
2. Ctrl bấm 2 thẻ chưa liên kết.

## Kết quả mong đợi
- [ ] Thanh chọn **không** có "Tạo nhóm mới", vẫn có "Thêm vào nhóm".

---

## Nhóm: Hướng dẫn lần đầu

# [TC_PTKT_RP_51] Hướng dẫn tự hiện khi tài khoản chưa xem

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** giả lập người dùng mới bằng cách bỏ khoá `ta_onboarding_seen` khỏi response `/getusersettings`.

## Các bước thực hiện
1. Vào trang với tài khoản chưa có `ta_onboarding_seen`.

## Kết quả mong đợi
- [ ] Sau khi khung biểu đồ dựng xong, thẻ hướng dẫn hiện "Bước 1/6", tiêu đề "Chọn bố cục".
- [ ] Nút "Quay lại" bị tắt; có "Bỏ qua" và "Tiếp".

# [TC_PTKT_RP_52] Đi hết 6 bước; bước 4–6 tự mở thanh Replay; "Xong" đóng cả hai

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Tiếp" qua từng bước tới bước cuối, bấm "Xong".

## Kết quả mong đợi
- [ ] Tiêu đề lần lượt: "Chọn bố cục", "Liên kết thẻ", "Replay", "Ngày bắt đầu", "Chạy, tiến 1 nến, Về hiện
      tại", "Biểu đồ chiếu lại".
- [ ] Bước 1–3 thanh Replay đóng; bước 4–6 thanh Replay mở; bước 6 nút chính ghi "Xong".
- [ ] Sau "Xong": hướng dẫn và thanh Replay đều đóng; `localStorage.ta_onboarding_seen = "1"`.

# [TC_PTKT_RP_53] "Quay lại" và phím mũi tên chuyển bước

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Tiếp" (bước 2), bấm "Quay lại". 2. Bấm phím →, rồi phím ←.

## Kết quả mong đợi
- [ ] Bước hiển thị lần lượt 2/6 → 1/6 → 2/6 → 1/6.

# [TC_PTKT_RP_54] "Bỏ qua" hoặc Esc tắt hướng dẫn và ghi đã xem

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Lần 1 bấm "Bỏ qua". 2. Lần 2 (phiên mới) bấm Esc.

## Kết quả mong đợi
- [ ] Hướng dẫn đóng; `localStorage.ta_onboarding_seen = "1"`.

# [TC_PTKT_RP_55] Đã xem hướng dẫn thì không tự hiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản có `ta_onboarding_seen = 1`, vào trang, chờ 8 giây.

## Kết quả mong đợi
- [ ] Không có thẻ hướng dẫn.

> TC_PTKT_RP_56 (hướng dẫn tự mở cột nút đang thu gọn) đã xoá: nút Mở rộng/Thu gọn công cụ bỏ từ 07/10/2026.

## Các bước thực hiện
1. `ta_tools_collapsed = "1"`, tài khoản chưa xem hướng dẫn, vào trang.

## Kết quả mong đợi
- [ ] Khi hướng dẫn hiện, cột nút đang mở (`aria-expanded="true"`, có nút Bố cục).

---

## Nhóm: Tài khoản miễn phí (Free)

# [TC_PTKT_RP_57] Bố cục đã lưu nhiều khung bị thu về 1 khung, có nút mời nâng cấp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản Free có bố cục đã lưu 2 khung (VNM, FPT | HPG).
2. Bấm nút "Nâng cấp gói để mở bố cục và thẻ đã lưu.".

## Kết quả mong đợi
- [ ] Chỉ còn 1 khung, 1 thẻ "VNM" (thẻ đang mở của khung đang chọn).
- [ ] Nút tím "Nâng cấp gói để mở bố cục và thẻ đã lưu." ở cuối thanh thẻ; bấm thì hiện popup "Chọn dịch vụ".

# [TC_PTKT_RP_58] Free với bố cục 1 khung không có nút mời nâng cấp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản Free, bố cục đã lưu 1 khung.

## Kết quả mong đợi
- [ ] Không có nút "Nâng cấp gói để mở bố cục và thẻ đã lưu.".

# [TC_PTKT_RP_59] Dấu + thêm thẻ: chú thích Pro, bấm mở popup, không thêm thẻ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản Free, rê chuột lên dấu +, sau đó bấm.

## Kết quả mong đợi
- [ ] Chú thích có nhãn "Pro" và chữ "Thêm thẻ đồ thị mới. Nâng cấp gói để mở lên tới 15 thẻ đồ thị".
- [ ] Bấm thì hiện popup "Chọn dịch vụ"; số thẻ vẫn là 1.

# [TC_PTKT_RP_60] Bảng Bố cục khoá cách chia từ 2 khung, Đặt lại bố cục, Tạo nhóm liên kết

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản Free, mở bảng Bố cục.
2. Bấm "3 cột"; đóng popup. Bấm "Đặt lại bố cục"; đóng popup. Bấm "Tạo nhóm liên kết".

## Kết quả mong đợi
- [ ] Có đủ 21 cách chia, 20 ô bị khoá (`.locked`) và tổng 22 biểu tượng khoá; ô "1 khung" không khoá; không ô
      nào bị `disabled`.
- [ ] Mỗi lần bấm ở bước 2 đều hiện popup "Chọn dịch vụ"; bố cục vẫn 1 khung; không bật chế độ chọn thẻ.

# [TC_PTKT_RP_61] Free: giữ Ctrl bấm thẻ không chọn thẻ để liên kết

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản Free, Ctrl bấm thẻ "VNM".

## Kết quả mong đợi
- [ ] Không có viền chọn, không có thanh chọn thẻ.

# [TC_PTKT_RP_62] Free: thanh Replay không có nút "Biểu đồ", ô ngày có chú thích mời nâng cấp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản Free, mở Replay.

## Kết quả mong đợi
- [ ] Không có nút "Biểu đồ: n/m"; tốc độ mặc định 20x.
- [ ] Chú thích ô ngày: "Nâng cấp để mở rộng thời điểm bắt đầu.".

# [TC_PTKT_RP_63] Free: chọn ngày cũ hơn 1 năm bị kéo về ngày sớm nhất và mở popup

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được (01/10/2026):** đặt 02/01/2020 → ô về 01/10/2025 + popup; đặt 02/03/2026 → nhận, không popup.

## Các bước thực hiện
1. Đặt ngày 02/01/2020. 2. Đóng popup, đặt ngày 02/03/2026.

## Kết quả mong đợi
- [ ] Bước 1: ô ngày = hôm nay − 365 ngày; hiện popup "Chọn dịch vụ".
- [ ] Bước 2: ô ngày = 2026-03-02; không có popup.

# [TC_PTKT_RP_64] Free: hướng dẫn lần đầu chỉ có 4 bước

- **Trạng thái:** 🆕 Testcase mới

# [TC_PTKT_RP_65] Nút "AI" trên thanh đầu trang mở / đóng tab AI Chart

- **Trạng thái:** 🆕 Testcase mới (thêm 07/10/2026)

## Các bước thực hiện
1. Vào trang Biểu đồ (cửa sổ ≥ 1130), bấm nút "AI", bấm lần nữa.

## Kết quả mong đợi
- [ ] Ban đầu aria-label "Mở AI Chart", `aria-pressed="false"`.
- [ ] Bấm: tab AI Chart ở thanh tab dọc bên phải mở; nút thành "Đóng AI Chart", `aria-pressed="true"`.
- [ ] Bấm lần nữa: tab AI Chart đóng, nút về trạng thái ban đầu.

# [TC_PTKT_RP_66] Cửa sổ hẹp dưới 1130 → nút về cột tròn mép phải

- **Trạng thái:** 🆕 Testcase mới (thêm 07/10/2026)

## Các bước thực hiện
1. Cửa sổ 1100×800, vào trang Biểu đồ; bấm nút Replay.

## Kết quả mong đợi
- [ ] Nút Replay, Bố cục ở cột nút tròn mép phải (không nằm trên thanh đầu trang); không có nút "AI" (cột này đã có nút
  trợ lý AI riêng).
- [ ] Bấm Replay vẫn mở thanh Replay.

## Các bước thực hiện
1. Tài khoản Free chưa xem hướng dẫn, đi qua hết các bước.

## Kết quả mong đợi
- [ ] "Bước 1/4" … "Bước 4/4": "Chọn bố cục", "Replay", "Ngày bắt đầu", "Chạy, tiến 1 nến, Về hiện tại" (không
      có "Liên kết thẻ", "Biểu đồ chiếu lại").

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 59 |
| ⚠️ Cần xác nhận thêm | 1 (TC_PTKT_RP_25) |
| **Tổng** | **60** |

Cập nhật 09/11/2026: 64 → 62 TC (xoá TC_02, 03, 04, 56; thêm TC_65, 66; sửa TC_01, 05, 41, 42, 48 + tên thẻ toàn bộ). Chạy trên kfsp.vn.

**Cập nhật 10/11/2026:** xoá TC_PTKT_RP_19, TC_PTKT_RP_26 và ghi chú bug "bấm Chạy khi biểu đồ chưa nạp xong" (bug được user chấp nhận). 62 → 60 TC.

## Phát hiện đáng chú ý

4. **Đổi bố cục khi đang chiếu thì đóng hẳn thanh Replay** (TC_34), CHANGELOG chỉ ghi "các ô về dữ liệu hiện
   tại". Ghi theo hành vi thật, cần dev xác nhận là chủ đích.
5. **Đổi ngày khi đang chạy thì chiếu lại từ ngày mới nhưng chuyển sang dừng** (TC_14). Có thể là chủ đích.
6. ~~Cửa sổ thấp hơn 800px tự thu gọn cột nút~~ — không còn: nút Mở rộng/Thu gọn công cụ bỏ từ 07/10/2026; cửa sổ hẹp
   dưới 1130 thì nút về cột tròn mép phải (TC_66).
7. **Liên kết thẻ không còn đổi mã theo nhau** (TC_42, từ 03/11/2026): nhóm đồng bộ khung thời gian + chỉ báo; người
   quen cách cũ có thể bất ngờ. Đúng yêu cầu dev (commit 768f7af99).
