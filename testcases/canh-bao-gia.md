# Màn hình: Cảnh báo giá trên biểu đồ (tính năng mới)

- **Phạm vi:** tạo / sửa / xoá cảnh báo giá **ngay trên biểu đồ** — dòng "Tạo cảnh báo <mã> tại <giá>" trong menu chuột
  phải, hộp nhỏ "Tạo cảnh báo giá" / "Sửa cảnh báo giá", đường cảnh báo màu cam trên biểu đồ, tick "Cảnh báo giá" trong
  nút "Biểu đồ", thẻ giới thiệu lần đầu, chuông cạnh Kế hoạch giá ở NKGD. Áp dụng ở mọi biểu đồ có gắn tính năng: trang
  **Biểu đồ** (`/phan-tich-ky-thuat`), **modal biểu đồ nhanh** (mở từ ô "Tìm mã chứng khoán" trên header và nhiều bảng
  khác), biểu đồ giá ở **Phân tích cơ bản**, biểu đồ "Điểm mua trên biểu đồ" ở **Cơ hội tiềm năng**, biểu đồ nhỏ trong
  **chat AI**, chi tiết lệnh ở **NKGD › Tài sản**.
- **Ngoài phạm vi (nhóm sau):** form cảnh báo lớn nhiều điều kiện (`alertPerStock.vue`) và danh sách cảnh báo ở **Trung
  tâm thông báo** — sẽ viết cùng nhóm "Thông báo".
- **Môi trường test:** https://prev2.vietpointer.vn — bản build đang chạy code `origin/preprod` mới nhất (đối chiếu
  bundle ngày 09/11/2026). ⚠️ prev2 hiện gọi **backend production** (`api2.kfsp.vn`, `users.kfsp.vn`), nên dùng tài
  khoản kfsp.vn: `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí). Tài khoản `PREV2_USER_*_Free` cũ không đăng nhập
  được nữa. Spec dùng `test.use({ baseURL })` riêng (`PREV2_BASE_URL`), không đổi `BASE_URL` chung.
- **Component:** nhánh `origin/preprod` của `stocks` (merge `thanh/price-alert-chart` 16/10, `thanh/price-alert-screens`
  16–20/10/2026): `src/utils/chartPriceAlerts.js`, `src/views/multiLayoutChart/TabAlert/PriceAlertQuick.vue`,
  `TabAlert/PriceAlertBell.vue`, `multiLayoutChart/ChartAlertIntro.vue`, `src/utils/chartDisplayMenu.js`,
  `src/containers/TheContainer.vue` (gắn hộp + thẻ, nhận sự kiện cảnh báo đã bắn), `src/store.js`. Điểm gắn:
  `ReactChartTA.vue` (Biểu đồ), `pages/TradingChart.vue` (modal nhanh), `faAnalysis/Common/ChartTradingViewEvents.vue`
  (PTCB), `filterCanslim/opportunity/OpportunityChart.vue` (Cơ hội tiềm năng, lightweight-charts),
  `ReactSmallChartTA.vue` (chat AI), `tradingLog/components/ChiTietGiaoDich.vue` (NKGD).
- **Code test:** [tests/canh-bao-gia.spec.ts](../tests/canh-bao-gia.spec.ts), Page Object
  [pages/PriceAlertPage.ts](../pages/PriceAlertPage.ts). Chạy: `npx playwright test tests/canh-bao-gia.spec.ts
  --project=chromium --workers=2` (~5 phút).
- **Phương pháp sinh:** tab "Cảnh báo" của Google Sheet chỉ dùng để học văn phong — app có **màn Cảnh báo riêng** (danh
  sách mã, form nhiều điều kiện), còn web làm cảnh báo giá **ngay trên biểu đồ**, khác hẳn. Testcase do kiểm kê độc lập
  trên source preprod + đo bằng Playwright thật trên prev2: chuột phải ở nhiều mức giá, rê/bấm/chuột phải vào đường, lưu
  thành công / 500 / 422 / 400 / mất mạng / máy chủ chậm, bấm đúp, chế độ tối, tài khoản Free, 5 nơi gắn biểu đồ.
- **Cách đọc đường cảnh báo:** đường vẽ trên canvas trong iframe TradingView; test đọc qua `tradingViewApi` của iframe
  (`activeChart().getAllShapes()`, `getShapeById().getProperties()`) và tính toạ độ của 1 mức giá từ khoảng giá đang
  nhìn thấy (`getVisiblePriceRange()`) để rê/bấm đúng vào đường.
- **Quy ước trạng thái:**
  - ✅ Áp dụng: có testcase tương ứng ở app (ghi "Tham chiếu App"), hành vi web đã đo và tự động hoá.
  - 🆕 Testcase mới: chỉ web có, đã tự động hoá.
  - ⚠️ Cần xác nhận thêm: bug / hành vi cần dev xác nhận (test ghi lại hành vi đo được), hoặc chưa tự động hoá được.

**⚠️ AN TOÀN DỮ LIỆU — ĐỌC TRƯỚC KHI SỬA TEST:** cảnh báo giá lưu trên máy chủ **production** theo tài khoản thật.
`PriceAlertPage.open()` thay toàn bộ `/api/stocks/user-alert/*` bằng **máy chủ giả trong bộ nhớ** (`FakeAlertServer`):
tạo / sửa / xoá trong test không chạm cảnh báo thật, mỗi test tự chọn cảnh báo ban đầu, và chọn được kiểu trả lời (ok,
chậm 2,5 giây, 500, 422, 400, mất mạng). `/updateusersettings` + `/delusersettings` bị chặn — tick "Cảnh báo giá", cờ
"đã xem giới thiệu", bố cục Biểu đồ chỉ đổi trên trình duyệt (body bị chặn được ghi lại để assert). `/getusersettings`
được sửa: bố cục Biểu đồ cố định 1 khung VNM, đã xem hướng dẫn Biểu đồ, còn cờ giới thiệu / tick Cảnh báo giá / chế độ
tối do từng test chọn. TC_50 sửa response đọc `/api/tradinglog/getAll` (bơm Giá mục tiêu / cắt lỗ) — không ghi gì.
Giá nến vẫn lấy thật nên các mức giá trong test được tính từ khoảng giá đang nhìn thấy, không viết cứng.

---

## Nhóm: Menu chuột phải — tạo cảnh báo (trang Biểu đồ)

# [TC_CBG_01] Dòng "Tạo cảnh báo <mã> tại <giá>" đứng đầu menu chuột phải

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí, vào `/phan-tich-ky-thuat` (biểu đồ VNM).
2. Chuột phải vào vùng giá của biểu đồ.

## Kết quả mong đợi
- [ ] Dòng đầu tiên của menu là "Tạo cảnh báo VNM tại <giá>" (giá có dấu phẩy hàng nghìn, đơn vị đồng), tiếp theo là
  đường kẻ rồi các dòng gốc của TradingView ("Sao chép giá…", "Dán", …, "Cài đặt…").

# [TC_CBG_02] Giá trong dòng menu được làm tròn theo bước giá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung: VNM (~57.000đ) và HQC (< 10.000đ).
2. Ở mỗi khung chuột phải tại 2 độ cao khác nhau, đọc giá trong dòng "Tạo cảnh báo … tại …".

## Kết quả mong đợi
- [ ] Giá là bội của bước giá: dưới 10.000đ → 10đ, 10.000–49.999đ → 50đ, từ 50.000đ → 100đ (`roundToPriceStep`).

# [TC_CBG_04] Bấm dòng menu ở trên giá hiện tại → hộp tạo cảnh báo, chiều "Giá tăng lên tới"

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_53 (nhập giá TĂNG LÊN)

## Các bước thực hiện
1. Chuột phải ở gần đỉnh khung giá (cao hơn giá hiện tại), bấm dòng "Tạo cảnh báo VNM tại …".

## Kết quả mong đợi
- [ ] Mở hộp "Tạo cảnh báo giá" của VNM, ô giá điền sẵn đúng giá trong dòng menu.
- [ ] Chiều tự chọn "Giá tăng lên tới" (giá ≥ giá hiện tại).

# [TC_CBG_05] Bấm dòng menu ở dưới giá hiện tại → chiều "Giá giảm xuống tới"

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_54 (nhập giá GIẢM XUỐNG)

## Các bước thực hiện
1. Chuột phải ở gần đáy khung giá, bấm dòng "Tạo cảnh báo…".

## Kết quả mong đợi
- [ ] Khi giá hiện tại nạp xong, chiều tự chuyển sang "Giá giảm xuống tới".

# [TC_CBG_06] Biểu đồ chỉ số không có dòng tạo cảnh báo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 1 khung VNINDEX, chuột phải vào biểu đồ.

## Kết quả mong đợi
- [ ] Menu chuột phải không có dòng "Tạo cảnh báo" (chỉ mã 3 ký tự mới có cảnh báo — `canHaveAlert`).
- [ ] Web không đọc cảnh báo của VNINDEX.

---

## Nhóm: Hộp "Tạo cảnh báo giá"

# [TC_CBG_07] Giao diện hộp tạo cảnh báo

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_46, TC_47 (header mã + giá + %, màu theo tăng/giảm)

## Các bước thực hiện
1. Mở hộp từ menu chuột phải.

## Kết quả mong đợi
- [ ] Hộp `role=dialog` tên "Tạo cảnh báo giá"; nút × có tooltip "Đóng (Esc)".
- [ ] Dòng mã: "VNM" + giá hiện tại (nghìn đồng, 2 số lẻ) + % thay đổi; màu xanh khi tăng, đỏ khi giảm.
- [ ] 2 nút chiều "Giá tăng lên tới" / "Giá giảm xuống tới"; ô giá có đơn vị "đ"; công tắc "Lặp lại" đang tắt.
- [ ] 2 nút "Lưu & tạo tiếp" và "Tạo cảnh báo"; không có "Xoá" / "Lưu".
- [ ] Ô giá được focus sẵn.

# [TC_CBG_08] Ô giá chỉ nhận chữ số, tự thêm dấu phẩy hàng nghìn

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_56 (nhập chữ / ký tự đặc biệt)

## Các bước thực hiện
1. Gõ "12a3b4,5.6x7". 2. Xoá, gõ "abc!@#".

## Kết quả mong đợi
- [ ] Lần 1 ô hiện "1,234,567". Lần 2 ô trống.

# [TC_CBG_09] Ô giá dài tối đa 13 ký tự

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ 15 chữ số "123456789012345".

## Kết quả mong đợi
- [ ] `maxlength=13`; ô dừng ở "1,234,567,890" (10 chữ số + 3 dấu phẩy).

# [TC_CBG_10] Ô giá trống hoặc bằng 0 → hai nút lưu bị khoá

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_55 (giá 0 / âm)

## Các bước thực hiện
1. Xoá trống ô giá. 2. Gõ "0", nhấn Enter. 3. Gõ "5".

## Kết quả mong đợi
- [ ] Bước 1–2: "Tạo cảnh báo" và "Lưu & tạo tiếp" bị khoá; gõ "0" thì ô vẫn trống; Enter không gửi gì, hộp vẫn mở.
- [ ] Bước 3: nút mở lại.

# [TC_CBG_11] Chiều đổi theo giá gõ khi chưa chọn bằng tay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ giá cao hơn giá hiện tại 5.000đ. 2. Gõ giá thấp hơn 5.000đ.

## Kết quả mong đợi
- [ ] Bước 1 chiều "Giá tăng lên tới", bước 2 tự chuyển "Giá giảm xuống tới".

# [TC_CBG_12] Đã chọn chiều bằng tay thì gõ giá không đổi chiều

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Giá giảm xuống tới". 2. Gõ giá cao hơn giá hiện tại.

## Kết quả mong đợi
- [ ] Sau khi bấm, ô giá được focus lại; chiều vẫn là "Giá giảm xuống tới".

# [TC_CBG_13] Công tắc "Lặp lại" bật/tắt

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_57 (toggle Lặp lại)

## Các bước thực hiện
1. Bấm công tắc "Lặp lại" 2 lần.

## Kết quả mong đợi
- [ ] `aria-checked` lần lượt "true" rồi "false".

# [TC_CBG_14] Tạo cảnh báo → gửi đúng nội dung, đường mới hiện trên biểu đồ

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_87 (Lưu với 1 cảnh báo)
- **Khác biệt so với app:** web không có toast "Tạo cảnh báo thành công" — dấu hiệu thành công là hộp đóng và đường
  cam xuất hiện ở đúng mức giá.

## Các bước thực hiện
1. Gõ 1 mức giá trong vùng nhìn thấy, chọn "Giá tăng lên tới", bấm "Tạo cảnh báo".

## Kết quả mong đợi
- [ ] Đúng 1 POST `/api/stocks/user-alert/update/v2` với `user_alerts = [{ stockcode: "VNM", condition_key:
  "COND_PRICE_UP", condition_label: "Giá tăng lên chạm một mức giá cố định", type_condition: "COND_PRICE",
  condition_value: <giá>, is_active: 1, frequency: 0 }]`, `old_user_alerts = []`.
- [ ] Hộp đóng; biểu đồ có đúng 1 đường "Cảnh báo: tăng lên tới <giá>" ở đúng mức giá.

# [TC_CBG_15] Bật "Lặp lại" + chiều giảm

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_57, TC_88

## Các bước thực hiện
1. Gõ giá, chọn "Giá giảm xuống tới", bật "Lặp lại", bấm "Tạo cảnh báo".

## Kết quả mong đợi
- [ ] Gửi `condition_key: "COND_PRICE_DOWN"`, nhãn "Giá giảm xuống một mức giá cố định", `frequency: 1`.
- [ ] Đường "Cảnh báo: giảm xuống tới <giá>" hiện ra.

# [TC_CBG_16] Nhấn Enter trong ô giá = "Tạo cảnh báo"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp, nhấn Enter trong ô giá.

## Kết quả mong đợi
- [ ] Gửi 1 yêu cầu lưu, hộp đóng.

# [TC_CBG_17] "Lưu & tạo tiếp"

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_52 (giá mặc định = giá hiện tại)

## Các bước thực hiện
1. Gõ giá thấp, chọn "Giá giảm xuống tới", bật "Lặp lại", bấm "Lưu & tạo tiếp".

## Kết quả mong đợi
- [ ] Lưu xong hộp vẫn mở (tiêu đề "Tạo cảnh báo giá"), ô giá về giá hiện tại, chiều về "Giá tăng lên tới", ô giá
  được focus.
- [ ] "Lặp lại" giữ nguyên trạng thái đã bật.
- [ ] Đường của cảnh báo vừa lưu hiện ngay trên biểu đồ.

# [TC_CBG_18] Bấm đúp "Tạo cảnh báo" chỉ gửi 1 yêu cầu

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_92 (click Lưu liên tục)

## Các bước thực hiện
1. Bấm đúp "Tạo cảnh báo".

## Kết quả mong đợi
- [ ] Chỉ 1 POST lưu; hộp đóng.

# [TC_CBG_19] Đang lưu thì các nút bị khoá

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_93 (loading khi Lưu)
- **Khác biệt so với app:** web không có biểu tượng loading — chỉ khoá nút.

## Các bước thực hiện
1. Máy chủ giả trả lời chậm 2,5 giây; bấm "Lưu & tạo tiếp".

## Kết quả mong đợi
- [ ] Trong lúc chờ, "Lưu & tạo tiếp" và "Tạo cảnh báo" bị khoá; trả lời xong thì mở lại. Chỉ 1 yêu cầu.

# [TC_CBG_20] Máy chủ lỗi 500

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_91 (Lưu khi server lỗi)

## Các bước thực hiện
1. Gõ "77777", máy chủ trả 500, bấm "Tạo cảnh báo".

## Kết quả mong đợi
- [ ] Toast lỗi "Có lỗi xảy ra, vui lòng thử lại"; hộp vẫn mở, ô giữ "77,777", nút mở lại; không vẽ đường nào.

# [TC_CBG_21] Mất mạng khi lưu

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_90 (Lưu khi mất mạng)
- **Khác biệt so với app:** web không có thông báo riêng cho mất mạng — dùng chung "Có lỗi xảy ra, vui lòng thử lại".

## Các bước thực hiện
1. Yêu cầu lưu bị ngắt mạng, bấm "Tạo cảnh báo".

## Kết quả mong đợi
- [ ] Như TC_20.

# [TC_CBG_22] Lỗi 422 có trường `error`

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả 422 `{ error: "<thông báo>" }`, bấm "Tạo cảnh báo".

## Kết quả mong đợi
- [ ] Toast lỗi hiện đúng `<thông báo>` của máy chủ; hộp vẫn mở, giữ giá.

# [TC_CBG_23] Lỗi 400 có trường `message`

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả 400 `{ message: "<thông báo>" }`, bấm "Tạo cảnh báo".

## Kết quả mong đợi
- [ ] Toast lỗi hiện đúng `<thông báo>`; hộp vẫn mở, giữ giá.

# [TC_CBG_24] Đóng hộp không lưu

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_95, TC_96 (rời màn khi có / không có thay đổi)
- **Khác biệt so với app:** web không hỏi "Bạn có thay đổi chưa lưu" — đóng là bỏ.

## Các bước thực hiện
1. Bấm vào trong hộp. 2. Bấm ×. 3. Mở lại, nhấn Esc. 4. Mở lại, bấm vào nền tối bên ngoài.

## Kết quả mong đợi
- [ ] Bấm trong hộp không đóng; ×, Esc, bấm nền tối đều đóng hộp; không gửi yêu cầu lưu nào.

# [TC_CBG_25] Mở lại hộp sau khi đóng → trạng thái mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp, gõ "99999", bật "Lặp lại", đóng. 2. Chuột phải lại đúng chỗ cũ, bấm dòng tạo cảnh báo.

## Kết quả mong đợi
- [ ] Ô giá là giá của dòng menu (không giữ "99,999"); "Lặp lại" tắt.

---

## Nhóm: Đường cảnh báo trên biểu đồ

# [TC_CBG_26] Mỗi cảnh báo giá đang bật = 1 đường cam nét đứt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả có 5 cảnh báo: VNM tăng (bật), VNM giảm lặp lại (bật), VNM tăng (đã tắt), VNM "Giá giảm liên tục nhiều
   phiên" (loại khác), FPT tăng. 2. Tải lại trang Biểu đồ VNM.

## Kết quả mong đợi
- [ ] Đúng 2 đường: "Cảnh báo: tăng lên tới <giá>" và "Cảnh báo: giảm xuống tới <giá>", đúng mức giá.
- [ ] Màu `#F57C00`, nét đứt; chữ ẩn khi chưa rê chuột. Cảnh báo đã tắt, loại khác, mã khác không vẽ.

# [TC_CBG_27] Rê chuột lại gần đường thì hiện điều kiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Rê chuột từ xa tới đúng đường trên. 2. Rê ra xa.

## Kết quả mong đợi
- [ ] Bước 1 chỉ đường đó hiện chữ "Cảnh báo: tăng lên tới <giá>". Bước 2 chữ ẩn lại.

# [TC_CBG_28] Bấm chuột trái vào đường → hộp "Sửa cảnh báo giá"

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_89 (sửa cảnh báo đã có)

## Các bước thực hiện
1. Bấm chuột trái vào đường dưới (giảm, lặp lại).

## Kết quả mong đợi
- [ ] Hộp "Sửa cảnh báo giá": ô giá = giá của đường, chiều "Giá giảm xuống tới", "Lặp lại" bật.
- [ ] Nút "Xoá" + "Lưu"; không có "Tạo cảnh báo" / "Lưu & tạo tiếp".

# [TC_CBG_29] Chuột phải vào đường → mở thẳng hộp sửa

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** code có định nghĩa dòng menu "Sửa cảnh báo giá" khi chuột phải vào đường, nhưng thực tế thư viện chọn
  đường ngay lúc nhấn chuột và code chuyển việc chọn đường thành mở hộp sửa, nên menu không kịp hiện.

## Các bước thực hiện
1. Chuột phải vào đường trên.

## Kết quả mong đợi
- [ ] Mở hộp "Sửa cảnh báo giá" đúng giá, chiều "Giá tăng lên tới"; menu gốc TradingView không hiện.

# [TC_CBG_30] Sửa giá rồi Lưu → đường dời sang giá mới

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_89

## Các bước thực hiện
1. Bấm đường trên, đổi giá +300đ, bấm "Lưu".

## Kết quả mong đợi
- [ ] 1 POST với `user_alerts = [bản mới]`, `old_user_alerts = [bản ghi cũ nguyên vẹn + stockcode]`.
- [ ] Hộp đóng; đường trên dời sang giá mới, đường dưới giữ nguyên.

# [TC_CBG_31] Xoá trong hộp sửa → đường biến mất

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_28 (xác nhận xoá)
- **Khác biệt so với app:** web xoá ngay, không có popup xác nhận, không có toast "Xoá thành công".

## Các bước thực hiện
1. Bấm đường dưới, bấm "Xoá".

## Kết quả mong đợi
- [ ] 1 POST với `user_alerts = []`, `old_user_alerts = [bản ghi]`; hộp đóng; chỉ còn đường trên.

# [TC_CBG_33] Đổi mã trên biểu đồ → đường đổi theo mã mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Biểu đồ VNM có 2 đường; máy chủ giả có thêm 2 cảnh báo FPT. 2. Đổi mã sang FPT bằng ô tìm mã của biểu đồ.

## Kết quả mong đợi
- [ ] Web đọc cảnh báo của FPT; chỉ còn 2 đường của FPT.

# [TC_CBG_34] Đọc cảnh báo bị lỗi → biểu đồ vẫn dùng được

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. API đọc cảnh báo trả 500. Mở Biểu đồ VNM.

## Kết quả mong đợi
- [ ] Không vẽ đường, không lỗi JS liên quan; menu chuột phải + hộp tạo cảnh báo vẫn mở bình thường.

---

## Nhóm: Nút "Biểu đồ" — tick "Cảnh báo giá"

# [TC_CBG_35] Menu "Biểu đồ" có dòng "Cảnh báo giá"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Rê chuột lên nút "Biểu đồ ▾" trên thanh đầu biểu đồ, bấm.

## Kết quả mong đợi
- [ ] Tooltip "Tuỳ chọn hiển thị: sự kiện, cổ đông lớn, cảnh báo giá, nhật ký giao dịch".
- [ ] Thứ tự đầu menu: "GD cổ đông lớn", "Sự kiện", "Cảnh báo giá", đường kẻ. "Cảnh báo giá" đang tick.

# [TC_CBG_36] Bỏ tick / tick lại "Cảnh báo giá"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Biểu đồ có 2 đường. Bỏ tick "Cảnh báo giá". 2. Tick lại.

## Kết quả mong đợi
- [ ] Bước 1: menu vẫn mở; 2 đường biến mất; `localStorage["tradingview.show_price_alerts"] = "false"`; web gửi lưu
  setting `tradingview.show_price_alerts = false` (bị chặn trong test).
- [ ] Bước 2: 2 đường hiện lại; gửi lưu setting `true`.

# [TC_CBG_37] Setting đang tắt → không vẽ đường

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Setting tài khoản `tradingview.show_price_alerts = false`, có 1 cảnh báo VNM. Mở Biểu đồ.
2. Mở menu "Biểu đồ". 3. Tạo 1 cảnh báo mới từ menu chuột phải.

## Kết quả mong đợi
- [ ] Không vẽ đường, web không đọc cảnh báo; "Cảnh báo giá" không tick.
- [ ] Tạo mới vẫn lưu được nhưng không vẽ đường.

---

## Nhóm: Thẻ giới thiệu lần đầu

# [TC_CBG_38] Tài khoản trả phí chưa xem → thẻ hiện, bước 1/4

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản trả phí, setting chưa có cờ `chart_alert_intro_seen`. Mở Biểu đồ.

## Kết quả mong đợi
- [ ] Thẻ `role=dialog` hiện ở góc trên phải biểu đồ (trong khung biểu đồ), không làm tối trang, không có viền khung.
- [ ] Nhãn "Mới", "Cảnh báo giá trên biểu đồ"; bước "Chuột phải để tạo cảnh báo" — "Chuột phải vào mức giá muốn báo, rồi
  bấm chuột trái vào dòng Tạo cảnh báo."; "1/4"; hình minh hoạ có "Tạo cảnh báo VNM tại 128,500".
- [ ] Bước 1 không có nút "Quay lại".

# [TC_CBG_39] Đi qua 4 bước

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Tiếp" 3 lần. 2. Bấm chấm thứ 2. 3. Bấm "Quay lại".

## Kết quả mong đợi
- [ ] 4 bước đúng tiêu đề + mô tả: "Chuột phải để tạo cảnh báo", "Mỗi cảnh báo là một đường cam", "Bấm chuột trái vào
  đường để sửa", "Ẩn hoặc hiện các đường"; bộ đếm 1/4 → 4/4; chấm đang ở có `aria-current="step"`.
- [ ] Bước cuối: không còn "Tiếp" / "Bỏ qua"; có "Xong" + "Tạo cảnh báo VNM".
- [ ] Bấm chấm 2 → 2/4; "Quay lại" → 1/4. Chấm có nhãn "Bước 3: Bấm chuột trái vào đường để sửa".

# [TC_CBG_40] "Bỏ qua" → không hiện lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Bỏ qua". 2. Tải lại trang.

## Kết quả mong đợi
- [ ] Thẻ đóng; `localStorage["chart_alert_intro_seen"] = "1"`; gửi lưu setting `chart_alert_intro_seen = "1"`.
- [ ] Sau khi tải lại, thẻ không hiện.

# [TC_CBG_41] Esc, nút ×, nút "Xong" đều đóng thẻ và tính là đã xem

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. (3 lần, mỗi lần 1 phiên trình duyệt mới) Đóng thẻ bằng Esc / nút × / đi tới bước cuối bấm "Xong".

## Kết quả mong đợi
- [ ] Thẻ đóng; gửi lưu setting `chart_alert_intro_seen = "1"`.

# [TC_CBG_43] Đã xem rồi → thẻ không hiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Setting có `chart_alert_intro_seen = "1"`. Mở Biểu đồ, chờ 5 giây.

## Kết quả mong đợi
- [ ] Không có thẻ.

# [TC_CBG_44] Biểu đồ nhỏ không có nút "Biểu đồ" → thẻ 3 bước, đặt cạnh biểu đồ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản trả phí chưa xem, vào `/co-hoi-tiem-nang` (biểu đồ "Điểm mua trên biểu đồ").

## Kết quả mong đợi
- [ ] Thẻ hiện "1/3", 3 chấm (bỏ bước "Ẩn hoặc hiện các đường").
- [ ] Thẻ đặt bên cạnh biểu đồ, không đè lên biểu đồ; có viền khung tô quanh biểu đồ.
- [ ] Bước 3/3 là "Bấm chuột trái vào đường để sửa", có nút "Xong".

---

## Nhóm: Các biểu đồ khác

# [TC_CBG_45] Modal biểu đồ nhanh

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở `/dashboard`, gõ "FPT" vào ô "Tìm mã chứng khoán" trên header, Enter → modal biểu đồ FPT.
2. Máy chủ giả có 1 cảnh báo FPT trong vùng nhìn thấy. 3. Chuột phải vùng không có đường, bấm dòng tạo cảnh báo.
4. Đóng hộp, mở nút "Biểu đồ" của modal.

## Kết quả mong đợi
- [ ] Modal vẽ đường "Cảnh báo: tăng lên tới <giá>".
- [ ] Dòng "Tạo cảnh báo FPT tại …"; hộp mở nổi trên modal, mã FPT.
- [ ] Menu "Biểu đồ" của modal có "Cảnh báo giá" đang tick.

# [TC_CBG_46] Phân tích cơ bản — biểu đồ giá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào `/phan-tich-co-ban` (biểu đồ nến nhỏ cột trái, mã gần nhất của tài khoản). Máy chủ giả có 2 cảnh báo của mã đó.
2. Chuột phải giữa biểu đồ, bấm dòng trong menu.

## Kết quả mong đợi
- [ ] 2 đường cảnh báo được vẽ.
- [ ] Chuột phải chỉ hiện **menu nhỏ** của web (không phải menu gốc TradingView) với đúng 1 dòng "Tạo cảnh báo <mã> tại
  <giá>" có icon chuông.
- [ ] Bấm dòng → menu đóng, hộp mở với đúng giá đó.

# [TC_CBG_47] Menu nhỏ đóng khi bấm Esc hoặc bấm ra ngoài

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở menu nhỏ ở PTCB, nhấn Esc. 2. Mở lại, bấm ra ngoài.

## Kết quả mong đợi
- [ ] Cả 2 lần menu đóng, không mở hộp.

# [TC_CBG_48] Cơ hội tiềm năng — tạo cảnh báo từ biểu đồ "Điểm mua"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào `/co-hoi-tiem-nang` (dòng đầu được chọn sẵn, biểu đồ lightweight-charts bên phải).
2. Chuột phải vào biểu đồ, bấm dòng trong menu nhỏ.

## Kết quả mong đợi
- [ ] Menu nhỏ 1 dòng "Tạo cảnh báo <mã đang chọn> tại <giá>", giá là bội của bước giá.
- [ ] Hộp mở với đúng giá đó.

# [TC_CBG_49] Cơ hội tiềm năng — chuột phải vào đường → "Sửa cảnh báo giá"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tạo 1 cảnh báo từ menu chuột phải. 2. Chuột phải lại đúng chỗ đó.

## Kết quả mong đợi
- [ ] Menu nhỏ chỉ có "Sửa cảnh báo giá" (không icon chuông); bấm vào → hộp "Sửa cảnh báo giá" đúng giá.

# [TC_CBG_50] NKGD Tài sản — chuông cạnh Kế hoạch giá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. (Bơm Giá mục tiêu 1 = giá mua × 1,2 và Giá cắt lỗ 1 = giá mua × 0,9 vào các lệnh mua đọc về.)
2. Vào `/nhat-ky-giao-dich` tab Tài sản, bấm 1 dòng mã → danh sách lệnh, bấm "Xem chi tiết lệnh" của 1 lệnh mua.
3. Bấm chuông cạnh "Giá mục tiêu 1".

## Kết quả mong đợi
- [ ] Mục "Kế hoạch giá" có 2 chuông "Tạo cảnh báo giá" (mục tiêu, cắt lỗ).
- [ ] Hộp "Tạo cảnh báo giá" mở với giá = Giá mục tiêu (đồng, làm tròn 10đ), chiều "Giá tăng lên tới".

---

## Nhóm: Tài khoản Free

# [TC_CBG_51] Free — không vẽ đường, không có thẻ giới thiệu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản Free, chưa xem giới thiệu, có 1 cảnh báo VNM. Mở Biểu đồ, chờ 5 giây.

## Kết quả mong đợi
- [ ] Không có đường, web không đọc cảnh báo, không có thẻ giới thiệu.

# [TC_CBG_52] Free — bấm dòng tạo cảnh báo → popup "Chọn dịch vụ"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản Free, chuột phải biểu đồ, bấm "Tạo cảnh báo …".

## Kết quả mong đợi
- [ ] Dòng vẫn hiện trong menu; bấm vào mở popup "Chọn dịch vụ", không mở hộp cảnh báo.

---

## Nhóm: Chưa tự động hoá

# [TC_CBG_53] Cảnh báo 1 lần báo xong thì đường tự mất

- **Trạng thái:** ⚠️ Cần xác nhận thêm (`test.fixme`)
- **Tham chiếu App:** TC_94 (nhận thông báo khi đạt điều kiện)

## Các bước thực hiện
1. Có 1 cảnh báo 1 lần (Lặp lại tắt) trên biểu đồ. 2. Giá chạm mức → máy chủ bắn sự kiện socket `updatealert`.

## Kết quả mong đợi
- [ ] Web xác nhận đã bắn (`update-status-active-alert`), biểu đồ đọc lại và đường đó biến mất.

# [TC_CBG_54] Biểu đồ nhỏ trong chat AI

- **Trạng thái:** ⚠️ Cần xác nhận thêm (`test.fixme`)

## Các bước thực hiện
1. Hỏi trợ lý AI để nhận câu trả lời kèm biểu đồ của 1 mã. 2. Chuột phải biểu đồ.

## Kết quả mong đợi
- [ ] Có đường cảnh báo của mã; menu nhỏ 1 dòng "Tạo cảnh báo …".

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| ✅ Áp dụng | 17 |
| 🆕 Testcase mới | 32 |
| ⚠️ Cần xác nhận thêm | 2 (`test.fixme` TC_53, TC_54) |
| **Tổng** | **51** |

49 case chạy tự động, 2 case `test.fixme`.

**Cập nhật 10/11/2026:** xoá TC_CBG_03, TC_CBG_32, TC_CBG_42 và ghi chú ngoài lề về deep-link `/phan-tich-co-ban/VNM` (TC_PTCB_08) (bug được user chấp nhận). 54 → 51 TC.

## Phát hiện đáng chú ý

4. **Chuột phải vào đường không hiện menu "Sửa cảnh báo giá" mà mở thẳng hộp sửa** (TC_29) — dòng menu đó trong code là
   code chết với biểu đồ TradingView (vẫn dùng ở biểu đồ lightweight-charts, TC_49).
5. **prev2 hiện trỏ backend production** — tài khoản prev2 riêng không còn dùng được, mọi lệnh ghi trong test phải giả
   lập/chặn. Spec Replay & Chia khung (`TaReplayLayoutPage`) vẫn đọc `PREV2_USER_*` nên cần xem lại khi chạy lại màn đó.
6. Khác app: web không có toast "Tạo cảnh báo thành công" / "Xoá thành công", không có popup xác nhận xoá, lỗi mất mạng
   dùng chung thông báo "Có lỗi xảy ra, vui lòng thử lại".
