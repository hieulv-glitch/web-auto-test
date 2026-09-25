# Màn hình: Đăng Ký (Register)

- **URL:** `/register` (route con của `/`)
- **Component:** [src/views/pages/Register.vue](../../stocks/src/views/pages/Register.vue)
- **Domain test:** https://kfsp.vn/register
- **Nguồn testcase gốc (app):** Google Sheet, tab "Đăng Kí" (83 testcase). Đã lược bỏ 8 case không áp dụng cho
  web (icon back, hình ảnh minh họa, icon con mắt x3, bàn phím ảo, scroll bàn phím ảo) → còn **75 testcase
  adapt từ app + 5 testcase mới** = **80 testcase**.
- **Phương pháp sinh:** Đọc source code (`Register.vue`, `router/index.js`) + kiểm thử trực tiếp trên môi
  trường thật bằng Playwright. **An toàn:** mọi kịch bản có khả năng tạo tài khoản thật đều được mock API
  `/auth/register` (không đụng backend thật, không gửi OTP thật, không tạo dữ liệu rác trên production).
- **Quy ước trạng thái:** ✅ Áp dụng · 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

## ⚠️ Phát hiện lớn cần đọc trước

So với testcase gốc của app, form Đăng Ký trên web **lỏng hơn đáng kể** ở nhiều điểm — không phải suy đoán,
đã verify qua code + chạy thật:

1. **Không có validate định dạng cho Họ tên** — số, ký tự đặc biệt đều được chấp nhận làm tên.
2. **Regex số điện thoại rất lỏng** (`/^(\+?\d{7,15}|0\d{6,14})$/`) — chấp nhận cả số **không bắt đầu bằng 0**,
   **>10 chữ số**, **<10 chữ số** (miễn đủ 7-15 số), **sai đầu số** — tất cả đều KHÁC kỳ vọng của app.
3. **Không có validate độ phức tạp mật khẩu** — chỉ cần ≥ 6 ký tự bất kỳ (chữ thường thuần, chữ hoa thuần, số
   thuần, ký tự đặc biệt thuần đều được chấp nhận) — khác hẳn 8 testcase app yêu cầu đủ hoa/thường/số/ký tự
   đặc biệt.
4. **Regex email không chặn hết các case app mong đợi** — `abc..xyz@gmail.com` (dấu chấm liền nhau) và
   `.abc@gmail.com` (bắt đầu bằng dấu chấm) đều được coi là **hợp lệ** trên web.
5. **Xử lý lỗi khi mất mạng AN TOÀN hơn Login** (dùng `?.` optional chaining đúng chỗ) — không crash JS.
6. **🐞 Nghi vấn bug:** khi server trả lỗi mà response không có field `errors` (không theo đúng format thường
   gặp), code `dataError?.errors.message[0]` sẽ ném lỗi JS `Cannot read properties of undefined` — đã verify
   bằng cách mock response 500 dạng `{ success: false, message: '...' }` (không có `errors`).
7. Đăng ký thành công **không chuyển thẳng về Đăng nhập** như 1 dòng mô tả cũ trong sheet — mà hiện **modal
   xác thực OTP** (Email hoặc Zalo) ngay trên cùng trang, đúng như 1 testcase khác trong sheet đã ghi nhận.

---

## Nhóm: Overview màn hình

# [TC_DANGKY_01] Overview màn hình Đăng ký

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app)
- **Tham chiếu App:** TC_01
- **Khác biệt so với app:** Web KHÔNG có icon back, KHÔNG có hình ảnh minh họa (code có nhưng đang bị comment
  out). Nút submit ghi "Gửi đăng ký" (không phải "ĐĂNG KÝ").

## Các bước thực hiện
1. Mở `/register`.

## Kết quả mong đợi
- [ ] Màn hình hiển thị đầy đủ, không vỡ layout.
- [ ] Logo "KungFuStocksPro" ở giữa, phía trên.
- [ ] Tiêu đề "Đăng ký tài khoản".
- [ ] 5 textbox: Họ tên, Email, Điện thoại, Mật khẩu, Nhập lại mật khẩu.
- [ ] Link "Xem chi tiết các gói tại đây".
- [ ] Button "Gửi đăng ký" và link "Đã có tài khoản".

---

# [TC_DANGKY_02] Hiển thị tiêu đề

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khác app**
- **Tham chiếu App:** TC_02
- **Khác biệt so với app:** App kỳ vọng title "Tạo tài khoản"; web thực tế hiển thị **"Đăng ký tài khoản"**.

## Các bước thực hiện
1. Quan sát tiêu đề màn hình.

## Kết quả mong đợi
- [ ] Hiển thị "Đăng ký tài khoản".

---

## Nhóm: Luồng đăng ký chính

# [TC_DANGKY_03] Đăng ký thành công → hiện modal OTP

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (mock API, không tạo tài khoản thật)**
- **Tham chiếu App:** TC_06
- **Khác biệt so với app:** Không chuyển thẳng về Đăng nhập — hiện **modal "Nhập mã OTP Email/Zalo"** ngay
  trên trang, có ô nhập, đếm ngược gửi lại mã, nút đổi kênh xác thực, link liên hệ hỗ trợ (Zalo/Facebook/
  Telegram/Gmail).

## Các bước thực hiện
1. Nhập đầy đủ các trường hợp lệ (Họ tên, Email chưa tồn tại, SĐT chưa tồn tại, Mật khẩu ≥ 6 ký tự, Nhập lại
   mật khẩu khớp).
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Gọi API đăng ký thành công.
- [ ] Hiện modal "Nhập mã OTP Email" (hoặc Zalo tùy `otpSendType` server trả về).

---

## Nhóm: Textbox Họ tên

# [TC_DANGKY_04] Hiển thị textbox

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khác app**
- **Tham chiếu App:** TC_07
- **Khác biệt so với app:** Chỉ có placeholder **"Họ tên"**, không có label riêng, không có placeholder dài
  "Nhập họ tên của bạn tại đây" như app.

## Các bước thực hiện
1. Quan sát textbox Họ tên.

## Kết quả mong đợi
- [ ] Icon user bên trái, placeholder "Họ tên".

---

# [TC_DANGKY_05] Họ tên là trường bắt buộc

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_08
- **Khác biệt so với app:** Message thực tế **"Họ tên không được để trống"** (app kỳ vọng "Vui lòng nhập họ và
  tên").

## Các bước thực hiện
1. Để trống Họ tên, nhập các trường khác hợp lệ.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Họ tên không được để trống".

---

# [TC_DANGKY_06] Họ tên chỉ chứa khoảng trắng

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app (giống ghi chú gốc trong sheet)**
- **Tham chiếu App:** TC_09
- **Ghi chú:** Code chỉ check `!this.name` (falsy) — chuỗi toàn khoảng trắng là truthy nên **KHÔNG bị chặn**,
  không có logic trim. App cũng tự ghi nhận cùng vấn đề này ("Nhập các khoảng trông nhấn đăng kí không báo
  lỗi").

## Các bước thực hiện
1. Nhập Họ tên là các khoảng trắng.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Không hiển thị lỗi required cho Họ tên (khác kỳ vọng ban đầu của app) — request có thể được gửi đi với
  tên toàn khoảng trắng.

---

# [TC_DANGKY_07] Họ tên là ký tự số

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app**
- **Tham chiếu App:** TC_10
- **Ghi chú:** Code không có regex kiểm tra định dạng nội dung tên — chỉ check rỗng. Số/ký tự bất kỳ đều được
  chấp nhận.

## Các bước thực hiện
1. Nhập Họ tên là số (VD: `123456`).
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] KHÔNG hiển thị cảnh báo "Họ và tên không hợp lệ" như app — được coi là hợp lệ về mặt client.

---

# [TC_DANGKY_08] Họ tên là ký tự đặc biệt

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_07
- **Tham chiếu App:** TC_11

## Các bước thực hiện
1. Nhập Họ tên là ký tự đặc biệt (VD: `@#$%^&*`).
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] KHÔNG bị chặn ở client (khác app).

---

# [TC_DANGKY_09] Họ tên là chữ (có/không dấu)

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_12, TC_16

## Các bước thực hiện
1. Nhập Họ tên hợp lệ, có dấu tiếng Việt (VD: `Nguyễn Thị Hồng`).
2. Nhập các trường còn lại hợp lệ, click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Đăng ký thành công (hiện modal OTP).

---

# [TC_DANGKY_10] Họ tên có khoảng trắng đầu/cuối

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_13
- **Lý do:** Code không có `.trim()` phía client. Không rõ backend có tự trim hay không — tránh test bằng cách
  hoàn tất 1 đăng ký thật để kiểm chứng (rủi ro tạo tài khoản rác). Cần xác nhận qua môi trường staging riêng
  hoặc hỏi dev.

## Các bước thực hiện
1. Nhập Họ tên hợp lệ có khoảng trắng đầu/cuối.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Cần xác nhận: có tự động cắt khoảng trắng hay giữ nguyên khi lưu.

---

# [TC_DANGKY_11] Giới hạn ký tự tối đa Họ tên

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng code review**
- **Tham chiếu App:** TC_15
- **Ghi chú:** Không có thuộc tính `maxlength` trên textbox Họ tên.

## Các bước thực hiện
1. Nhập Họ tên > 50 ký tự.

## Kết quả mong đợi
- [ ] Client cho nhập không giới hạn (khác kỳ vọng app).

---

## Nhóm: Textbox Email

# [TC_DANGKY_12] Hiển thị textbox

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khác app**
- **Tham chiếu App:** TC_18
- **Khác biệt so với app:** Placeholder thực tế chỉ là **"Email"**.

## Các bước thực hiện
1. Quan sát textbox Email.

## Kết quả mong đợi
- [ ] Icon "@" bên trái, placeholder "Email".

---

# [TC_DANGKY_13] Email là trường bắt buộc

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_19

## Các bước thực hiện
1. Để trống Email, nhập các trường khác hợp lệ.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Email không được để trống".

---

# [TC_DANGKY_14] Email chỉ chứa khoảng trắng

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: message khác app**
- **Tham chiếu App:** TC_20
- **Ghi chú:** Chuỗi khoảng trắng là truthy nên KHÔNG rơi vào nhánh "không được để trống", mà rơi vào nhánh
  kiểm tra định dạng (`isValidEmail()` thất bại vì regex không cho khoảng trắng) → hiển thị **"Email không hợp
  lệ"**, không phải "Vui lòng nhập email" như app kỳ vọng.

## Các bước thực hiện
1. Nhập Email là các khoảng trắng.
2. Click "Gửi đăng ký" (hoặc đợi debounce khi rời khỏi ô).

## Kết quả mong đợi
- [ ] Hiển thị "Email không hợp lệ".

---

# [TC_DANGKY_15] Email thiếu domain

- **Trạng thái:** ✅ Áp dụng — **Đã verify: message đúng "Email không hợp lệ"**
- **Tham chiếu App:** TC_21

## Các bước thực hiện
1. Nhập Email thiếu domain (VD: `abc@`).

## Kết quả mong đợi
- [ ] Hiển thị "Email không hợp lệ" (kiểm tra real-time khi gõ, có debounce ~1s).

---

# [TC_DANGKY_16] Email thiếu @

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_22

## Các bước thực hiện
1. Nhập Email thiếu @ (VD: `abcgmail.com`).

## Kết quả mong đợi
- [ ] Hiển thị "Email không hợp lệ".

---

# [TC_DANGKY_17] Email thiếu dấu chấm

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_23

## Các bước thực hiện
1. Nhập Email thiếu dấu chấm (VD: `abc@gmail`).

## Kết quả mong đợi
- [ ] Hiển thị "Email không hợp lệ".

---

# [TC_DANGKY_18] Email thiếu phần trước @

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_24

## Các bước thực hiện
1. Nhập Email thiếu phần local (VD: `@gmail.com`).

## Kết quả mong đợi
- [ ] Hiển thị "Email không hợp lệ".

---

# [TC_DANGKY_19] Email có khoảng trắng ở giữa

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_26

## Các bước thực hiện
1. Nhập Email có khoảng trắng giữa (VD: `abc 123@gmail.com`).

## Kết quả mong đợi
- [ ] Hiển thị "Email không hợp lệ".

---

# [TC_DANGKY_20] Email có 2 dấu @

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_27

## Các bước thực hiện
1. Nhập Email có 2 dấu @ (VD: `abc@@gmail.com`).

## Kết quả mong đợi
- [ ] Hiển thị "Email không hợp lệ".

---

# [TC_DANGKY_21] Email có dấu chấm liền nhau

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app**
- **Tham chiếu App:** TC_28
- **Ghi chú:** Regex web (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) không cấm dấu chấm liền nhau ở phần local.

## Các bước thực hiện
1. Nhập Email có dấu chấm liền nhau (VD: `abc..xyz@gmail.com`).

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi (khác kỳ vọng app "Email không hợp lệ") — web coi là hợp lệ.

---

# [TC_DANGKY_22] Email bắt đầu bằng dấu chấm

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app**
- **Tham chiếu App:** TC_29
- **Ghi chú:** Cùng lý do TC_DANGKY_21 — regex không cấm dấu chấm ở đầu phần local.

## Các bước thực hiện
1. Nhập Email bắt đầu bằng dấu chấm (VD: `.abc@gmail.com`).

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi (khác kỳ vọng app) — web coi là hợp lệ.

---

# [TC_DANGKY_23] Email hợp lệ

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_30

## Các bước thực hiện
1. Nhập email hợp lệ (VD: `dung@gmail.com`), các trường khác hợp lệ.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Đăng ký thành công (hiện modal OTP).

---

# [TC_DANGKY_24] Email đã tồn tại

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_31
- **Lý do:** Đã thử với `kfspteam@kfsp.vn` (email support, không phải tài khoản user) → không thấy cảnh báo.
  Cơ chế check giống hệt `checkExistPhone` (đã verify hoạt động đúng ở TC_DANGKY_39) nên nhiều khả năng logic
  đúng, nhưng cần 1 email user thật đã đăng ký để verify dứt điểm.

## Các bước thực hiện
1. Nhập Email đã đăng ký làm tài khoản (cần email test thật).

## Kết quả mong đợi
- [ ] Hiển thị "Email đã tồn tại" (real-time, có debounce).

---

# [TC_DANGKY_25] Email viết hoa

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_32
- **Lý do:** Phụ thuộc cùng điều kiện cần email test thật như TC_DANGKY_24.

## Các bước thực hiện
1. Nhập Email đã đăng ký nhưng viết hoa (VD: `ABC@Gmail.Com`).

## Kết quả mong đợi
- [ ] Dự kiến vẫn báo "Email đã tồn tại" (không phân biệt hoa/thường ở hầu hết backend) — cần verify.

---

## Nhóm: Textbox Điện thoại

# [TC_DANGKY_26] Hiển thị textbox

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khác app**
- **Tham chiếu App:** TC_34
- **Khác biệt so với app:** Placeholder thực tế chỉ là **"Điện thoại"**.

## Các bước thực hiện
1. Quan sát textbox Điện thoại.

## Kết quả mong đợi
- [ ] Icon bên trái, placeholder "Điện thoại".

---

# [TC_DANGKY_27] Điện thoại là trường bắt buộc

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_35

## Các bước thực hiện
1. Để trống Điện thoại, các trường khác hợp lệ.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Số điện thoại không được để trống".

---

# [TC_DANGKY_28] Điện thoại chỉ chứa khoảng trắng

- **Trạng thái:** ✅ Áp dụng — message khác app, cùng lý do TC_DANGKY_14
- **Tham chiếu App:** TC_36

## Các bước thực hiện
1. Nhập Điện thoại là các khoảng trắng.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Số điện thoại không hợp lệ" (không phải "không được để trống").

---

# [TC_DANGKY_29] Điện thoại là ký tự chữ

- **Trạng thái:** ✅ Áp dụng — **Đã verify: cho nhập tự do, chỉ chặn khi submit/check**
- **Tham chiếu App:** TC_37
- **Ghi chú:** Input không chặn gõ chữ (đã verify giá trị giữ nguyên `"abcdefghij"`), nhưng debounce
  `checkExistPhone`/submit sẽ báo lỗi định dạng.

## Các bước thực hiện
1. Nhập Điện thoại là chữ (VD: `abcdefghij`).

## Kết quả mong đợi
- [ ] Hiển thị "Số điện thoại không hợp lệ".

---

# [TC_DANGKY_30] Điện thoại là ký tự đặc biệt

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_38

## Các bước thực hiện
1. Nhập Điện thoại là ký tự đặc biệt (VD: `@#$%^&*`).

## Kết quả mong đợi
- [ ] Hiển thị "Số điện thoại không hợp lệ".

---

# [TC_DANGKY_31] Điện thoại có chữ và số

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_39

## Các bước thực hiện
1. Nhập Điện thoại có chữ và số (VD: `0987abc123`).

## Kết quả mong đợi
- [ ] Hiển thị "Số điện thoại không hợp lệ".

---

# [TC_DANGKY_32] Điện thoại có khoảng trắng ở giữa

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_40

## Các bước thực hiện
1. Nhập Điện thoại có khoảng trắng (VD: `0987 123 456`).

## Kết quả mong đợi
- [ ] Hiển thị "Số điện thoại không hợp lệ".

---

# [TC_DANGKY_33] Điện thoại > 10 ký tự

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN QUAN TRỌNG: khác app**
- **Tham chiếu App:** TC_41
- **Ghi chú:** Regex `0\d{6,14}` cho phép tới 15 chữ số sau số 0. `09871234567` (11 số) vẫn khớp regex.

## Các bước thực hiện
1. Nhập Điện thoại 11 chữ số bắt đầu bằng 0 (VD: `09871234567`).

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi (khác kỳ vọng app "Số điện thoại không hợp lệ") — được coi là hợp lệ.

---

# [TC_DANGKY_34] Điện thoại < 10 ký tự

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app**
- **Tham chiếu App:** TC_42
- **Ghi chú:** Regex chỉ yêu cầu tối thiểu 7 số tổng cộng (0 + 6 số). `098712345` (9 số) vẫn khớp.

## Các bước thực hiện
1. Nhập Điện thoại 9 chữ số (VD: `098712345`).

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi (khác kỳ vọng app) — được coi là hợp lệ.

---

# [TC_DANGKY_35] Điện thoại không bắt đầu bằng 0

- **Trạng thái:** ✅ Áp dụng — **Đã verify trực tiếp: KHÁC app**
- **Tham chiếu App:** TC_43
- **Ghi chú:** Nhánh regex `\+?\d{7,15}` không yêu cầu bắt đầu bằng 0 — đã verify live, không có cảnh báo nào
  xuất hiện.

## Các bước thực hiện
1. Nhập Điện thoại không bắt đầu bằng 0 (VD: `1987123456`).

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi (khác kỳ vọng app "Số điện thoại không hợp lệ") — đã verify là hợp lệ trên web.

---

# [TC_DANGKY_36] Điện thoại có đầu số không hợp lệ

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app**
- **Tham chiếu App:** TC_44
- **Ghi chú:** Regex không kiểm tra đầu số nhà mạng hợp lệ của Việt Nam, chỉ kiểm tra định dạng số học.

## Các bước thực hiện
1. Nhập Điện thoại đầu số không hợp lệ (VD: `0123456789`).

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi (khác kỳ vọng app) — được coi là hợp lệ.

---

# [TC_DANGKY_37] Điện thoại hợp lệ

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_45

## Các bước thực hiện
1. Nhập Điện thoại hợp lệ 10 số bắt đầu bằng 0 (VD: `0987123456`), các trường khác hợp lệ.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Đăng ký thành công (hiện modal OTP).

---

# [TC_DANGKY_38] Điện thoại đã tồn tại

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass** (dùng SĐT tài khoản test thật)
- **Tham chiếu App:** TC_46

## Các bước thực hiện
1. Nhập Điện thoại đã đăng ký (dùng SĐT tài khoản test).

## Kết quả mong đợi
- [ ] Hiển thị "Số điện thoại đã tồn tại" (real-time, có debounce ~1s) — đã verify khớp chính xác.

---

## Nhóm: Textbox Mật khẩu

# [TC_DANGKY_39] Hiển thị textbox

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app)
- **Tham chiếu App:** TC_49
- **Khác biệt so với app:** Web không có icon con mắt để hiện/ẩn mật khẩu.

## Các bước thực hiện
1. Quan sát textbox Mật khẩu.

## Kết quả mong đợi
- [ ] Icon khóa bên trái, placeholder "Mật khẩu". Không có icon con mắt.

---

# [TC_DANGKY_40] Mật khẩu mặc định ẩn

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_50

## Các bước thực hiện
1. Nhập mật khẩu vào textbox.

## Kết quả mong đợi
- [ ] Input `type="password"`, hiển thị dạng che kín.

---

# [TC_DANGKY_41] Mật khẩu là trường bắt buộc

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_53

## Các bước thực hiện
1. Để trống Mật khẩu, các trường khác hợp lệ.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Vui lòng nhập mật khẩu".

---

# [TC_DANGKY_42] Mật khẩu chỉ chứa khoảng trắng

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: phụ thuộc độ dài**
- **Tham chiếu App:** TC_54
- **Ghi chú:** Không có regex chặn khoảng trắng thuần. Nếu < 6 dấu cách → báo lỗi độ dài "Mật khẩu cần ít nhất
  6 ký tự."; nếu ≥ 6 dấu cách → KHÔNG có lỗi gì (khác app kỳ vọng "Mật khẩu không hợp lệ" trong mọi trường
  hợp).

## Các bước thực hiện
1. Nhập Mật khẩu là 8 dấu cách.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi mật khẩu (khác app) vì đủ 6 ký tự trở lên, dù toàn khoảng trắng.

---

# [TC_DANGKY_43] Mật khẩu < 6 ký tự

- **Trạng thái:** ✅ Áp dụng — **Đã verify: message khác app**
- **Tham chiếu App:** TC_55
- **Khác biệt so với app:** Message thực tế **"Mật khẩu cần ít nhất 6 ký tự."**

## Các bước thực hiện
1. Nhập Mật khẩu < 6 ký tự.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Mật khẩu cần ít nhất 6 ký tự.".

---

# [TC_DANGKY_44] Mật khẩu > 20 ký tự

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app**
- **Tham chiếu App:** TC_56
- **Ghi chú:** Không có giới hạn trên (`maxlength` hay validate) cho độ dài mật khẩu.

## Các bước thực hiện
1. Nhập Mật khẩu > 20 ký tự.

## Kết quả mong đợi
- [ ] KHÔNG hiển thị cảnh báo giới hạn ký tự (khác app) — vẫn được coi là hợp lệ nếu ≥ 6 ký tự.

---

# [TC_DANGKY_45] Mật khẩu chỉ chữ thường — **PHÁT HIỆN LỚN**

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (mock API): web CHO PHÉP**
- **Tham chiếu App:** TC_57
- **Ghi chú:** KHÔNG có regex kiểm tra độ phức tạp mật khẩu trên web — hoàn toàn khác 8 testcase app (TC57-64)
  yêu cầu đủ hoa/thường/số/ký tự đặc biệt.

## Các bước thực hiện
1. Nhập Mật khẩu chỉ chữ thường, ≥ 6 ký tự (VD: `abcdefgh`).
2. Nhập lại mật khẩu khớp, các trường khác hợp lệ.
3. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Đăng ký thành công, hiện modal OTP (đã verify — KHÔNG bị chặn như app kỳ vọng).

---

# [TC_DANGKY_46] Mật khẩu chỉ chữ hoa

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_45 (không có complexity check)
- **Tham chiếu App:** TC_58

## Các bước thực hiện
1. Nhập Mật khẩu chỉ chữ hoa, ≥ 6 ký tự (VD: `ABCDEFGH`).

## Kết quả mong đợi
- [ ] KHÔNG bị chặn (khác app).

---

# [TC_DANGKY_47] Mật khẩu chỉ số

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_45
- **Tham chiếu App:** TC_59

## Các bước thực hiện
1. Nhập Mật khẩu chỉ số, ≥ 6 ký tự (VD: `12345678`).

## Kết quả mong đợi
- [ ] KHÔNG bị chặn (khác app).

---

# [TC_DANGKY_48] Mật khẩu chỉ ký tự đặc biệt

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_45
- **Tham chiếu App:** TC_60

## Các bước thực hiện
1. Nhập Mật khẩu chỉ ký tự đặc biệt, ≥ 6 ký tự (VD: `@#$%^&*!`).

## Kết quả mong đợi
- [ ] KHÔNG bị chặn (khác app).

---

# [TC_DANGKY_49] Mật khẩu thiếu chữ hoa

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_45
- **Tham chiếu App:** TC_61

## Các bước thực hiện
1. Nhập Mật khẩu thiếu chữ hoa (VD: `abc@1234`).

## Kết quả mong đợi
- [ ] KHÔNG bị chặn (khác app kỳ vọng "phải chứa chữ hoa").

---

# [TC_DANGKY_50] Mật khẩu thiếu chữ thường

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_45
- **Tham chiếu App:** TC_62

## Các bước thực hiện
1. Nhập Mật khẩu thiếu chữ thường (VD: `ABC@1234`).

## Kết quả mong đợi
- [ ] KHÔNG bị chặn (khác app).

---

# [TC_DANGKY_51] Mật khẩu thiếu số

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_45
- **Tham chiếu App:** TC_63

## Các bước thực hiện
1. Nhập Mật khẩu thiếu số (VD: `Abcdefg@`).

## Kết quả mong đợi
- [ ] KHÔNG bị chặn (khác app).

---

# [TC_DANGKY_52] Mật khẩu thiếu ký tự đặc biệt

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_DANGKY_45
- **Tham chiếu App:** TC_64

## Các bước thực hiện
1. Nhập Mật khẩu thiếu ký tự đặc biệt (VD: `Abcd1234`).

## Kết quả mong đợi
- [ ] KHÔNG bị chặn (khác app).

---

# [TC_DANGKY_53] Mật khẩu có ký tự Unicode (tiếng Việt có dấu)

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: khác app**
- **Tham chiếu App:** TC_66
- **Ghi chú:** Không có regex chặn ký tự Unicode trong mật khẩu.

## Các bước thực hiện
1. Nhập Mật khẩu có dấu tiếng Việt, ≥ 6 ký tự (VD: `Mậtkhẩu@1`).

## Kết quả mong đợi
- [ ] KHÔNG hiển thị lỗi (khác app kỳ vọng "Mật khẩu không hợp lệ").

---

# [TC_DANGKY_54] Mật khẩu hợp lệ đủ mạnh

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_67

## Các bước thực hiện
1. Nhập Mật khẩu 8-20 ký tự đủ hoa/thường/số/ký tự đặc biệt (VD: `Abc@1234`), Nhập lại khớp.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Đăng ký thành công (dĩ nhiên vẫn hợp lệ, dù web không bắt buộc mức độ phức tạp này).

---

## Nhóm: Textbox Nhập lại mật khẩu

# [TC_DANGKY_55] Hiển thị textbox

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app)
- **Tham chiếu App:** TC_68
- **Khác biệt so với app:** Không có icon con mắt.

## Các bước thực hiện
1. Quan sát textbox Nhập lại mật khẩu.

## Kết quả mong đợi
- [ ] Icon khóa bên trái, placeholder "Nhập lại mật khẩu".

---

# [TC_DANGKY_56] Mặc định dạng ẩn

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_69

## Các bước thực hiện
1. Nhập vào textbox Nhập lại mật khẩu.

## Kết quả mong đợi
- [ ] Input `type="password"`, hiển thị dạng che kín.

---

# [TC_DANGKY_57] Là trường bắt buộc

- **Trạng thái:** ✅ Áp dụng — **Đã verify: message khác app**
- **Tham chiếu App:** TC_71
- **Khác biệt so với app:** Message thực tế cũng là **"Vui lòng nhập mật khẩu"** (giống hệt message của ô Mật
  khẩu, không phải "Vui lòng nhập lại mật khẩu" riêng biệt như app).

## Các bước thực hiện
1. Để trống Nhập lại mật khẩu, các trường khác hợp lệ.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Vui lòng nhập mật khẩu" ở ô Nhập lại mật khẩu.

---

# [TC_DANGKY_58] Chỉ chứa khoảng trắng

- **Trạng thái:** ✅ Áp dụng — cùng cơ chế TC_DANGKY_42
- **Tham chiếu App:** TC_72

## Các bước thực hiện
1. Nhập Nhập lại mật khẩu là khoảng trắng (số lượng khác Mật khẩu để đảm bảo mismatch, hoặc bằng Mật khẩu nếu
   muốn test riêng độ dài).

## Kết quả mong đợi
- [ ] Nếu < 6 ký tự → báo lỗi độ dài; nếu ≥ 6 ký tự và khác Mật khẩu → báo "Xác nhận mật khẩu không khớp.".

---

# [TC_DANGKY_59] Không khớp với Mật khẩu

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: message khác app**
- **Tham chiếu App:** TC_73
- **Khác biệt so với app:** Message thực tế **"Xác nhận mật khẩu không khớp."** (app kỳ vọng "Mật khẩu nhập
  lại không khớp").

## Các bước thực hiện
1. Nhập Mật khẩu: `Abc@1234`.
2. Nhập lại mật khẩu: `Abc@5678`.
3. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Xác nhận mật khẩu không khớp." (đã verify chính xác).

---

# [TC_DANGKY_60] Khớp với Mật khẩu

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_74

## Các bước thực hiện
1. Nhập Mật khẩu và Nhập lại mật khẩu giống hệt nhau.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Đăng ký thành công.

---

# [TC_DANGKY_61] Phân biệt chữ hoa/thường khi so khớp

- **Trạng thái:** ✅ Áp dụng — khớp đúng kỳ vọng app
- **Tham chiếu App:** TC_75

## Các bước thực hiện
1. Nhập Mật khẩu: `Abc@1234`.
2. Nhập lại mật khẩu: `ABC@1234`.
3. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị "Xác nhận mật khẩu không khớp." (so sánh chuỗi phân biệt hoa/thường, đúng kỳ vọng).

---

## Nhóm: Button "Gửi đăng ký"

# [TC_DANGKY_62] Hiển thị button

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khác app**
- **Tham chiếu App:** TC_76
- **Khác biệt so với app:** Text thực tế **"Gửi đăng ký"** (không phải "ĐĂNG KÝ"), viền trắng nền trong suốt
  khi chưa submit — không phải "màu tím, chữ trắng" như app mô tả.

## Các bước thực hiện
1. Quan sát button submit.

## Kết quả mong đợi
- [ ] Hiển thị "Gửi đăng ký".

---

# [TC_DANGKY_63] Click khi để trống tất cả trường

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_77

## Các bước thực hiện
1. Để trống tất cả các trường.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiển thị đủ 4 cảnh báo: "Họ tên không được để trống", "Email không được để trống", "Số điện thoại không
  được để trống", "Vui lòng nhập mật khẩu" (x2 cho cả 2 ô mật khẩu) — đã verify khớp chính xác qua screenshot.

---

# [TC_DANGKY_64] Click khi dữ liệu hợp lệ

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khác app**
- **Tham chiếu App:** TC_78
- **Khác biệt so với app:** Chuyển sang **modal OTP**, không phải "màn hình Trang chủ"/"màn hình Đăng nhập"
  trực tiếp.

## Các bước thực hiện
1. Nhập đầy đủ, hợp lệ tất cả các trường.
2. Click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Hiện modal "Nhập mã OTP Email/Zalo".

---

# [TC_DANGKY_65] Click liên tục nhiều lần

- **Trạng thái:** ✅ Áp dụng — cần đo bằng automation (mock API để không tạo tài khoản thật)
- **Tham chiếu App:** TC_79

## Các bước thực hiện
1. Nhập dữ liệu hợp lệ.
2. Click "Gửi đăng ký" nhiều lần liên tục thật nhanh.

## Kết quả mong đợi
- [ ] Đo số lần gọi API `/auth/register` — kỳ vọng lý tưởng chỉ 1 lần; code không có state
  `loading`/`:disabled` trên button nên nhiều khả năng giống Login (gọi API nhiều lần).

---

# [TC_DANGKY_66] Loading khi đăng ký

- **Trạng thái:** ✅ Áp dụng — cần đo bằng automation
- **Tham chiếu App:** TC_80

## Các bước thực hiện
1. Giả lập API trễ, nhập dữ liệu hợp lệ, click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] Kiểm tra button có disable trong lúc chờ hay không — theo code review không có state `loading`, dự kiến
  KHÔNG disable (giống Login).

---

# [TC_DANGKY_67] Đăng ký khi mất kết nối mạng

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: AN TOÀN, khác Login**
- **Tham chiếu App:** TC_81
- **Ghi chú:** Khác với Login (nơi từng phát hiện bug crash JS), code Đăng Ký dùng `err?.response?.data` với
  optional chaining đúng chỗ — đã verify: KHÔNG có lỗi JS khi mất mạng, có hiện toast lỗi.

## Các bước thực hiện
1. Ngắt mạng (`context.setOffline(true)`), nhập dữ liệu hợp lệ, click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] KHÔNG có lỗi JS runtime, hiển thị thông báo lỗi dạng toast (đã verify không crash).

---

# [TC_DANGKY_68] Đăng ký khi server lỗi (500, response thiếu field `errors`)

- **Trạng thái:** ✅ Áp dụng — **🐞 BUG xác nhận qua automation**
- **Tham chiếu App:** TC_82
- **🐞 Phát hiện:** Mock response 500 dạng `{ success: false, message: '...' }` (không có field `errors`) →
  ném lỗi JS **`Cannot read properties of undefined (reading 'message')`** tại dòng
  `dataError?.errors.message[0]` trong `register()`. Nếu backend thực tế luôn trả kèm `errors` thì không phát
  sinh, nhưng code không an toàn với response không đúng format — cần báo dev.

## Các bước thực hiện
1. Mock API `/auth/register` trả 500 với body không có field `errors`.
2. Nhập dữ liệu hợp lệ, click "Gửi đăng ký".

## Kết quả mong đợi
- [ ] **Thực tế (bug):** Lỗi JS `Cannot read properties of undefined (reading 'message')`.
- [ ] **Kỳ vọng đúng:** Nên hiển thị "Có lỗi xảy ra, vui lòng thử lại sau" mà không crash.

---

## Nhóm: Link "Đã có tài khoản" & Link gói dịch vụ

# [TC_DANGKY_69] Hiển thị link "Đã có tài khoản"

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khác app**
- **Tham chiếu App:** TC_83
- **Khác biệt so với app:** Text thực tế **"Đã có tài khoản"** (không có dấu hỏi "?").

## Các bước thực hiện
1. Quan sát link dưới button submit.

## Kết quả mong đợi
- [ ] Hiển thị "Đã có tài khoản".

---

# [TC_DANGKY_70] Click "Đã có tài khoản"

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_84

## Các bước thực hiện
1. Click "Đã có tài khoản".

## Kết quả mong đợi
- [ ] Điều hướng tới `/login`.

---

# [TC_DANGKY_71] Click "Xem chi tiết các gói tại đây"

- **Trạng thái:** 🆕 Testcase mới (app không có)
- **Mô tả:** Link riêng của web, mở trang thông tin gói dịch vụ.

## Các bước thực hiện
1. Click "Xem chi tiết các gói tại đây".

## Kết quả mong đợi
- [ ] Mở tab mới (`target="_blank"`) tới `/home#mua`.

---

# [TC_DANGKY_72] Click logo chuyển về trang chủ

- **Trạng thái:** 🆕 Testcase mới (app test icon back, web dùng logo — khác cả target so với Login)
- **Ghi chú:** Logo ở Đăng Ký trỏ về **`/`** (khác Login trỏ về `/home/#trang-chu`).

## Các bước thực hiện
1. Click logo "KungFuStocksPro".

## Kết quả mong đợi
- [ ] Điều hướng tới `/`.

---

## Nhóm: Focus, Responsive, Điều hướng

# [TC_DANGKY_73] Thứ tự chuyển Focus (Tab)

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_86

## Các bước thực hiện
1. Click vào ô Họ tên.
2. Nhấn Tab lần lượt.

## Kết quả mong đợi
- [ ] Focus chuyển đúng thứ tự: Họ tên → Email → Điện thoại → Mật khẩu → Nhập lại mật khẩu.

---

# [TC_DANGKY_74] Responsive ở nhiều kích thước màn hình

- **Trạng thái:** ✅ Áp dụng (thay thế cho "xoay ngang màn hình" của app)
- **Tham chiếu App:** TC_88

## Các bước thực hiện
1. Kiểm tra layout ở các viewport: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667), Mobile ngang
   (667x375).

## Kết quả mong đợi
- [ ] Layout hiển thị đúng, không vỡ, không tràn ở mọi kích thước.

---

# [TC_DANGKY_75] Nút Back của trình duyệt

- **Trạng thái:** ✅ Áp dụng (thay thế "nút back vật lý thiết bị" của app)
- **Tham chiếu App:** TC_89

## Các bước thực hiện
1. Từ `/login`, click "Đăng ký" để sang `/register`.
2. Bấm nút Back trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng `/login`.

---

# [TC_DANGKY_76] Dữ liệu bị xóa sau khi rời màn hình

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_90
- **Ghi chú:** Component Vue re-mount lại `data()` mặc định mỗi lần vào route — không có logic lưu tạm
  (localStorage/sessionStorage) cho các trường form.

## Các bước thực hiện
1. Nhập dữ liệu vào các trường.
2. Rời khỏi `/register` (vd sang `/login`), quay lại `/register`.

## Kết quả mong đợi
- [ ] Tất cả các trường đều trống.

---

## Nhóm: Modal xác thực OTP (mới, web-only — app không có)

# [TC_DANGKY_77] Modal OTP hiển thị đúng cấu trúc

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock)**
- **Mô tả:** Modal hiện ngay sau khi đăng ký thành công, trên cùng trang `/register`.

## Các bước thực hiện
1. Đăng ký thành công (xem TC_DANGKY_03).

## Kết quả mong đợi
- [ ] Hiển thị tiêu đề "Nhập mã OTP Email" (hoặc "...Zalo" tùy kênh).
- [ ] Ô nhập 6 số, đếm ngược "Gửi lại mã sau: 00:59s".
- [ ] Link đổi kênh xác thực ("Xác thực bằng zalo"/"...email").
- [ ] 4 icon liên hệ hỗ trợ: Zalo, Facebook, Telegram, Gmail.

---

# [TC_DANGKY_78] Nút "Gửi lại mã" chỉ bật sau khi hết đếm ngược

- **Trạng thái:** 🆕 Testcase mới
- **Mô tả:** Theo code, nút "Gửi lại mã" có `:disabled="countdown > 0"`, ban đầu `countdown = 60`.

## Các bước thực hiện
1. Mở modal OTP.
2. Quan sát nút gửi lại mã trong lúc đếm ngược.

## Kết quả mong đợi
- [ ] Nút "Gửi lại mã" bị disable/ẩn trong lúc đếm ngược; hiện lại và bấm được khi đếm ngược về 0.

---

# [TC_DANGKY_79] Nhập đủ 6 số OTP tự động submit

- **Trạng thái:** 🆕 Testcase mới — **Đã verify qua code (watcher)**
- **Ghi chú:** Có `watch: { otp(newVal) { if (newVal.length === 6) this.verifyOtp() } }` — tự động gọi verify
  ngay khi đủ 6 số, không cần bấm nút riêng.

## Các bước thực hiện
1. Nhập lần lượt đủ 6 chữ số vào các ô OTP.

## Kết quả mong đợi
- [ ] Tự động gọi API xác thực OTP ngay khi ô thứ 6 được điền, không cần thao tác thêm.

---

# [TC_DANGKY_80] Chuyển đổi kênh xác thực Email ↔ Zalo

- **Trạng thái:** 🆕 Testcase mới
- **Tham chiếu:** liên quan gián tiếp app TC_53 (module Đăng Nhập có OTP theo cách khác — không trùng)

## Các bước thực hiện
1. Trong modal OTP, click "Xác thực bằng zalo" (hoặc email, tùy kênh đang hiển thị).

## Kết quả mong đợi
- [ ] Đổi tiêu đề modal sang kênh mới, reset ô OTP, reset đếm ngược gửi lại mã.

---

## Tổng hợp trạng thái (83 testcase gốc → 80 testcase sau khi lược bỏ 8, thêm 5 mới)

Đã tự động hoá bằng Playwright: [tests/dang-ky.spec.ts](../tests/dang-ky.spec.ts) (POM:
[pages/RegisterPage.ts](../pages/RegisterPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 73 | Bao gồm ~15 case phát hiện hành vi khác app (đã verify qua code + automation) |
| 🆕 Mới (riêng web) | 7 | Link gói dịch vụ, logo, và cả nhóm Modal OTP (app không kiểm tra) |
| ⚠️ Cần xác nhận thêm | 3 | Cần email test thật đã đăng ký (check tồn tại email), hoặc môi trường phụ để test trim |

**🐞 Phát hiện đáng chú ý cần báo lại team dev:**
1. Validate Số điện thoại quá lỏng — chấp nhận số không bắt đầu bằng 0, sai độ dài, sai đầu số (TC_DANGKY_33-36).
2. Không có validate độ phức tạp mật khẩu — chỉ cần ≥ 6 ký tự bất kỳ (TC_DANGKY_45-53), khác hẳn 8 case app yêu cầu.
3. Regex email không chặn hết case biên (dấu chấm liền nhau/mở đầu) (TC_DANGKY_21-22).
4. **Bug xác nhận:** response lỗi thiếu field `errors` → crash JS `Cannot read properties of undefined (reading 'message')` (TC_DANGKY_68) — khác Login (Login crash khi mất mạng do thiếu `error.response`; Register lại an toàn ở đúng chỗ đó nhưng lại crash ở chỗ khác khi response không đúng format).
5. Không chống double-submit (tương tự Login) — cần đo cụ thể qua automation (TC_DANGKY_65).
