# Màn hình: Hộp "Tạo cảnh báo cho mã" / "Cập nhật cảnh báo cho mã" (form cảnh báo nhiều điều kiện)

- **Phạm vi:** hộp cảnh báo nhiều điều kiện cho 1 mã — 4 nhóm điều kiện (Mức giá, Biến động, Khối lượng, Đường trung
  bình giá), cột Chọn / Giá trị / Tần suất, ô "Mã CK" có gợi ý, nút Đóng / Lưu. Hộp mở từ **Trung tâm thông báo ›
  Cảnh báo › Cảnh báo theo mã** ("Thêm cảnh báo", nút Sửa từng điều kiện, Sửa theo mã khi "Xem gộp theo mã") và từ
  đường dẫn `/trung-tam-thong-bao?muc=alert&ma=<mã>` mà các màn khác dẫn sang (`moTrungTamThongBao`).
- **Ngoài phạm vi:** hộp nhỏ "Tạo cảnh báo giá" trên biểu đồ (đã có ở [canh-bao-gia.md](canh-bao-gia.md)); bảng danh
  sách cảnh báo của Trung tâm thông báo ([trung-tam-thong-bao.md](trung-tam-thong-bao.md), TC_TB_20–28).
- **Môi trường test:** https://prev2.vietpointer.vn — bản build `origin/preprod` mới nhất. ⚠️ prev2 gọi **backend
  production** → tài khoản `TEST_USER_*`, mọi API cảnh báo đi qua máy chủ giả (xem dưới).
- **Component:** `src/views/multiLayoutChart/TabAlert/alertPerStock.vue` (+ `alertPer.json` — mẫu 17 điều kiện), dựng
  trong modal của `src/containers/TheContainer.vue` (tiêu đề đổi theo `checkEditAlert`). Merge vào preprod qua
  `thanh/price-alert-screens` (16–20/10/2026): bỏ nút "+ / xoá mức", sửa từ 1 hàng chỉ nạp đúng điều kiện đó
  (`alertEditItem`), lưu xong báo các màn đọc lại qua `alertSavedAt`.
- **Code test:** [tests/canh-bao-theo-ma.spec.ts](../tests/canh-bao-theo-ma.spec.ts), Page Object `AlertPerStockBox` +
  `NotificationCenterPage` trong [pages/NotificationCenterPage.ts](../pages/NotificationCenterPage.ts). Chạy:
  `npx playwright test tests/canh-bao-theo-ma.spec.ts --project=chromium --workers=2` (~1 phút).
- **Phương pháp sinh:** tính năng web mới, không đọc Google Sheet (văn phong theo [canh-bao-gia.md](canh-bao-gia.md)).
  Testcase do kiểm kê độc lập trên source preprod + đo bằng Playwright trên prev2.
- **Quy ước trạng thái:** 🆕 Testcase mới (chỉ web có, đã tự động hoá) · ⚠️ Cần xác nhận thêm (hành vi nghi vấn — test
  ghi lại hành vi đo được).

**⚠️ AN TOÀN DỮ LIỆU:** cảnh báo lưu trên máy chủ production theo tài khoản thật. `NotificationCenterPage.open()` thay
mọi `/api/stocks/user-alert/*` (get-all, get-by-stockcode/v2, update/v2, delete-by-stockcode/v2) bằng máy chủ giả trong
bộ nhớ (`FakeNotifyServer`): mỗi test tự chọn cảnh báo ban đầu, mọi lần lưu chỉ được ghi lại để assert. Lưới an toàn
chặn mọi request ghi khác chưa giả lập. Giá live vẫn lấy thật qua socket (`getlive`) nên test so với giá trong store
chứ không viết cứng.

---

## Nhóm: Hộp tạo cảnh báo

# [TC_CBM_01] Giao diện hộp tạo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí, vào `/trung-tam-thong-bao?view=alert`.
2. Bấm "Thêm cảnh báo".

## Kết quả mong đợi
- [ ] Tiêu đề "Tạo cảnh báo cho mã"; nhãn "Mã chứng khoán:", ô "Mã CK" trống, nhập được.
- [ ] 4 nhóm theo thứ tự Mức giá, Biến động, Khối lượng, Đường trung bình giá; dòng tiêu đề mỗi nhóm: "Chọn", tên nhóm,
  "Giá trị" (nhóm Đường trung bình giá để trống), "Tần suất".
- [ ] Đủ 17 dòng điều kiện đúng nhãn (2 mức giá, 2 biến động, 3 khối lượng, 10 SMA lên/xuống 10–200), tất cả bỏ chọn,
  mờ đi (`off`), ô giá trị + tần suất bị khoá.
- [ ] Nút "Đóng" và "Lưu" (Lưu bấm được).

# [TC_CBM_02] Các tuỳ chọn giá trị và tần suất

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, xem các ô chọn.

## Kết quả mong đợi
- [ ] Tần suất: "1 Lần", "Luôn luôn".
- [ ] Biến động: số phiên, mặc định "2 phiên" (có "3 phiên"…).
- [ ] Khối lượng: phần trăm KLTB, 3 lựa chọn đầu "120%", "130%", "150%".

# [TC_CBM_03] Gợi ý mã khi gõ, chọn bằng bàn phím hoặc chuột

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, gõ "hp" vào ô "Mã CK".
2. Nhấn ↓ rồi Enter.
3. Gõ "HPG", bấm gợi ý "HPG".

## Kết quả mong đợi
- [ ] Hiện tối đa 5 gợi ý, mã nào cũng chứa "HP", kèm tên công ty; gợi ý đầu đang được trỏ.
- [ ] ↓ chuyển sang gợi ý thứ 2; Enter điền đúng mã đó và đóng danh sách.
- [ ] Bấm gợi ý điền mã; tên công ty ("…Hòa Phát") và giá hiện tại (dạng `20.85`) hiện bên phải ô.

# [TC_CBM_04] Có mã thì hai ô "Mức giá" điền sẵn giá hiện tại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, chọn mã HPG.

## Kết quả mong đợi
- [ ] Ô giá trị của "Giá tăng lên chạm…" và "Giá giảm xuống…" bằng giá khớp hiện tại của HPG (đồng, lấy từ `getlive`).

# [TC_CBM_05] Lưu khi chưa nhập mã / chưa chọn điều kiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, chọn 1 điều kiện nhưng không nhập mã, bấm Lưu.
2. Đóng, mở lại, chọn mã VNM nhưng không chọn điều kiện nào, bấm Lưu.

## Kết quả mong đợi
- [ ] Bước 1: toast lỗi "Bạn cần nhập mã chứng khoán", hộp vẫn mở, không gọi API.
- [ ] Bước 2: hộp đóng, không gọi API lưu, bảng Trung tâm thông báo không đọc lại.

# [TC_CBM_06] Tạo nhiều điều kiện cùng lúc

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, chọn HPG.
2. Chọn "Giá tăng lên chạm…", nhập 30000, tần suất "Luôn luôn"; chọn "Giá tăng liên tục nhiều phiên" = 3 phiên; chọn
   "Giá cắt lên đường SMA20". Bấm Lưu.

## Kết quả mong đợi
- [ ] Gửi 1 lần `POST /api/stocks/user-alert/update/v2` với `user_alerts` đúng 3 điều kiện theo thứ tự:
  (HPG, COND_PRICE_UP, 30000, frequency 1), (HPG, COND_PCHANGE_INC, 3, frequency 0), (HPG, COND_SMA_SMA20_UP, null,
  frequency 0), đều `is_active: 1`; `old_user_alerts` rỗng.
- [ ] Hộp đóng; không có toast (thông báo thành công bị tắt toàn app từ 12/10/2026 — `main.js`).
- [ ] Bảng "Cảnh báo theo mã" tự đọc lại và có 3 hàng mới ("Giá tăng lên chạm mức giá 30,000 · Luôn luôn"…).

# [TC_CBM_07] Lưu lỗi 422 / 400 / 500

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, chọn VNM + 1 điều kiện.
2. Lần lượt cho máy chủ trả 422 `{error}`, 400 `{message}`, 500; mỗi lần bấm Lưu. Cuối cùng cho máy chủ trả thành công.

## Kết quả mong đợi
- [ ] 422: toast đúng chữ `error` của máy chủ; 400: toast đúng `message`; 500: "Có lỗi xảy ra, vui lòng thử lại".
- [ ] Sau mỗi lỗi hộp vẫn mở, dữ liệu đã chọn còn nguyên; lần lưu thứ 4 thành công thì hộp đóng.

# [TC_CBM_08] Bấm Lưu liên tiếp chỉ gửi 1 lần

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, chọn VNM + 1 điều kiện, bấm Lưu 3 lần thật nhanh.

## Kết quả mong đợi
- [ ] Chỉ 1 request `update/v2` (hàm lưu có debounce 500 ms), hộp đóng.

# [TC_CBM_09] Đóng rồi mở lại thì hộp trắng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp tạo, chọn VNM + 1 điều kiện, bấm Đóng.
2. Bấm lại "Thêm cảnh báo".

## Kết quả mong đợi
- [ ] Ô mã trống, không điều kiện nào được chọn, không gọi API lưu.

## Nhóm: Hộp cập nhật cảnh báo

# [TC_CBM_11] Sửa 1 điều kiện chỉ nạp đúng điều kiện đó

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ có VNM: giá tăng chạm 70,000 (Luôn luôn), 72,000 (1 lần), 75,000 (Luôn luôn), cắt lên SMA20, giá giảm
   60,000 đã tắt.
2. Ở bảng Cảnh báo theo mã bấm Sửa hàng "Giá tăng lên chạm mức giá 72,000".

## Kết quả mong đợi
- [ ] Tiêu đề "Cập nhật cảnh báo cho mã"; ô mã = VNM, bị khoá, không còn icon kính lúp.
- [ ] Gọi `GET /api/stocks/user-alert/get-by-stockcode/v2?stockcode=VNM`.
- [ ] Chỉ 1 điều kiện được chọn: "Giá tăng lên chạm…" với giá trị 72000, tần suất "1 Lần".

# [TC_CBM_12] Đổi giá trị rồi lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Như TC_CBM_11, đổi 72000 → 73000, bấm Lưu.

## Kết quả mong đợi
- [ ] `user_alerts` = [(COND_PRICE_UP, 73000, frequency 0, VNM)]; `old_user_alerts` = [điều kiện cũ (VNM, COND_PRICE_UP,
  72000)] — bản ghi cũ dựng lại từ mẫu nên **không kèm id**, máy chủ phải khớp theo mã + điều kiện + giá trị.
- [ ] Bảng còn hàng 73,000, mất hàng 72,000.

# [TC_CBM_13] Bỏ chọn điều kiện rồi lưu thì điều kiện bị gỡ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm Sửa hàng "Giá cắt lên đường SMA20", bỏ chọn, bấm Lưu.

## Kết quả mong đợi
- [ ] `user_alerts` rỗng, `old_user_alerts` = [(VNM, COND_SMA_SMA20_UP)]; hàng SMA20 biến mất khỏi bảng.

# [TC_CBM_14] Sửa theo mã nạp mọi điều kiện đang bật, sắp đúng thứ tự

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bật "Xem gộp theo mã", bấm "Sửa điều kiện của mã" ở hàng VNM.

## Kết quả mong đợi
- [ ] 4 điều kiện được chọn (3 mức giá tăng + SMA20); điều kiện đã tắt (giá giảm 60,000) không nạp.
- [ ] Nhóm Mức giá có 3 dòng "giá tăng" (nhãn chỉ ở dòng đầu) theo thứ tự "Luôn luôn" trước rồi giá cao trước:
  75000 (Luôn luôn), 70000 (Luôn luôn), 72000 (1 Lần).

# [TC_CBM_15] Đọc cảnh báo của mã lỗi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho `get-by-stockcode/v2` trả 500, bấm Sửa 1 hàng.

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại"; hộp vẫn mở, không điều kiện nào được chọn.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 14 |
| **Tổng** | **14** |

**Cập nhật 10/11/2026:** xoá TC_CBM_10 (bug được user chấp nhận). 15 → 14 TC.

## Phát hiện đáng chú ý

2. **Thông báo "Lưu cảnh báo thành công" không bao giờ hiện**: code vẫn gọi `$toast.success` nhưng `main.js` tắt mọi
   toast thành công (yêu cầu 12/10/2026). Đây là chủ đích, ghi lại để khỏi viết test chờ toast.
3. **Bấm Sửa quá sớm thì hộp trống**: hộp chỉ nạp cảnh báo khi danh sách mã của app (`list_mack_company`) đã có mã đó.
   Mở trang rồi bấm Sửa ngay trong vài giây đầu thì hộp hiện mà không điều kiện nào được chọn. Test chờ danh sách mã
   nạp xong (`waitStockList`). Người dùng thật hiếm khi nhanh như vậy nên chưa xếp vào bug.
4. **`old_user_alerts` không kèm id** khi lưu từ hộp (TC_CBM_12/13): máy chủ phải tự khớp bản ghi cũ theo mã + điều
   kiện + giá trị. Nếu một mã có 2 cảnh báo cùng điều kiện, cùng giá trị nhưng khác tần suất thì máy chủ có thể gỡ nhầm.
   Chưa đo được vì máy chủ ở đây là máy chủ giả.
