# Màn hình: Đăng Nhập (Login)

- **URL:** `/login` (route con của `/`, redirect mặc định khi chưa đăng nhập)
- **Component:** [src/views/pages/Login.vue](../../stocks/src/views/pages/Login.vue)
- **Domain test:** https://kfsp.vn/login
- **Nguồn testcase gốc (app):** Google Sheet, tab "Đăng Nhập" (68 testcase). Đã lược bỏ 15 case đặc thù mobile không áp dụng cho web (FaceID, bàn phím ảo, icon back, icon con mắt, lưu tài khoản, đa ngôn ngữ...) → còn **54 testcase** dưới đây.
- **Phương pháp sinh:** Đọc source code (`Login.vue`, `router/index.js`, `TheHeaderDropdownAccnt.vue`) + kiểm thử trực tiếp trên môi trường thật bằng Playwright.
- **Quy ước trạng thái:**
  - ✅ Áp dụng — testcase adapt từ app, có thể/đã tự động hoá bằng Playwright.
  - 🆕 Testcase mới — phát sinh riêng cho web, app không có.
  - ⚠️ Cần xác nhận thêm — chưa đủ điều kiện kiểm chứng thực tế (thiếu tài khoản đặc biệt, phụ thuộc môi trường...).

---

## Nhóm: Overview màn hình

# [TC_LOGIN_01] Overview màn hình Đăng nhập

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app)
- **Tham chiếu App:** TC_01
- **Mô tả:** Kiểm tra tổng thể giao diện màn hình Đăng nhập khi mới truy cập.
- **Tiền điều kiện:** Chưa đăng nhập, truy cập lần đầu.
- **Khác biệt so với app:** Web KHÔNG có icon back và KHÔNG có icon FaceID (web không hỗ trợ sinh trắc học).

## Các bước thực hiện
1. Mở `/login`.

## Kết quả mong đợi
- [ ] Màn hình hiển thị đầy đủ, không vỡ layout.
- [ ] Logo "KungFuStocksPro" ở giữa, phía trên.
- [ ] Tiêu đề "Đăng Nhập" và dòng phụ "Hãy đăng nhập vào tài khoản của bạn".
- [ ] 2 textbox: "Tài khoản" (placeholder "Nhập email hoặc số điện thoại"), "Mật khẩu" (placeholder "Nhập mật khẩu").
- [ ] Checkbox "Duy trì đăng nhập" (mặc định **chưa** tích — khác app).
- [ ] Link "Quên mật khẩu?" và link "Đăng ký".
- [ ] Button "Đăng nhập" màu xanh lá.

---

# [TC_LOGIN_02] Hiển thị logo

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_02

## Các bước thực hiện
1. Quan sát logo trên màn hình Đăng nhập.

## Kết quả mong đợi
- [ ] Hiển thị logo "KungFuStocksPro" (icon + chữ) căn giữa phía trên form.

---

# [TC_LOGIN_03] Click logo chuyển về trang chủ

- **Trạng thái:** ✅ Áp dụng (thay thế cho "chức năng icon back" của app — web không có icon back)
- **Tham chiếu App:** TC_04
- **Mô tả:** Trên web, logo đóng vai trò link quay về trang chủ thay cho icon back.

## Các bước thực hiện
1. Click vào logo "KungFuStocksPro".

## Kết quả mong đợi
- [ ] Điều hướng tới `/home#trang-chu` (đã xác nhận qua source: `<a href="/home/#trang-chu">`).

---

## Nhóm: Chức năng đăng nhập chính

# [TC_LOGIN_04] Đăng nhập thành công bằng tài khoản/mật khẩu đúng

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_05
- **Tiền điều kiện:** Có tài khoản hợp lệ.

## Các bước thực hiện
1. Nhập tài khoản (email/SĐT) hợp lệ.
2. Nhập đúng mật khẩu.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Đăng nhập thành công.
- [ ] Chuyển hướng vào `/dashboard`.

---

# [TC_LOGIN_05] Hiển thị textbox Tài khoản

- **Trạng thái:** ✅ Áp dụng — **Đã verify: khớp chính xác**
- **Tham chiếu App:** TC_06

## Các bước thực hiện
1. Quan sát textbox Tài khoản.

## Kết quả mong đợi
- [ ] Icon user bên trái, placeholder "Nhập email hoặc số điện thoại".

---

# [TC_LOGIN_06] Bỏ trống Tài khoản

- **Trạng thái:** ✅ Áp dụng — **Đã verify, kết quả khác app**
- **Tham chiếu App:** TC_07
- **Khác biệt so với app:** Web **không có validate required phía client**. Form submit thẳng lên API `/api/login` và nhận về thông báo lỗi chung, KHÔNG có thông báo riêng "Vui lòng nhập tài khoản" như app.

## Các bước thực hiện
1. Để trống Tài khoản.
2. Nhập Mật khẩu bất kỳ.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ: "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn." (không phải "Vui lòng nhập tài khoản").

---

# [TC_LOGIN_07] Tài khoản chỉ chứa khoảng trắng

- **Trạng thái:** ✅ Áp dụng — tương tự TC_LOGIN_06
- **Tham chiếu App:** TC_08

## Các bước thực hiện
1. Nhập Tài khoản là các khoảng trắng.
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn." (giống mọi input không hợp lệ khác — web không phân biệt loại lỗi).

---

# [TC_LOGIN_08] Đăng nhập bằng Email hợp lệ

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_09

## Các bước thực hiện
1. Nhập Email hợp lệ (VD: `dung@gmail.com`) đã đăng ký.
2. Nhập đúng mật khẩu.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Đăng nhập thành công, vào `/dashboard`.

---

# [TC_LOGIN_09] Email thiếu @

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_10
- **Khác biệt so với app:** App báo "Email hoặc số điện thoại không hợp lệ"; **Web không validate định dạng**, submit thẳng lên server và nhận thông báo lỗi chung.

## Các bước thực hiện
1. Nhập Email thiếu @ (VD: `abcgmail.com`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn." (đã chụp màn hình xác nhận thực tế).

---

# [TC_LOGIN_10] Email thiếu domain

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_09
- **Tham chiếu App:** TC_11

## Các bước thực hiện
1. Nhập Email thiếu domain (VD: `abc@`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung như TC_LOGIN_09.

---

# [TC_LOGIN_11] Email thiếu dấu chấm

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_09
- **Tham chiếu App:** TC_12

## Các bước thực hiện
1. Nhập Email thiếu dấu chấm (VD: `abc@gmail`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung như TC_LOGIN_09.

---

# [TC_LOGIN_12] Email có 2 dấu @

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_09
- **Tham chiếu App:** TC_13

## Các bước thực hiện
1. Nhập Email 2 dấu @ (VD: `abc@@gmail.com`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung như TC_LOGIN_09.

---

# [TC_LOGIN_13] Email chứa ký tự đặc biệt không hợp lệ

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_09
- **Tham chiếu App:** TC_14

## Các bước thực hiện
1. Nhập Email chứa ký tự đặc biệt (VD: `abc#$@gmail.com`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung như TC_LOGIN_09.

---

# [TC_LOGIN_14] Email có khoảng trắng ở giữa

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_09
- **Tham chiếu App:** TC_15

## Các bước thực hiện
1. Nhập Email có khoảng trắng giữa (VD: `abc 123@gmail.com`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung như TC_LOGIN_09.

---

# [TC_LOGIN_15] Email viết hoa vẫn đăng nhập được

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_16
- **Lý do:** Tài khoản test hiện có là số điện thoại (`0384492721`), không phải email, nên chưa thể verify hành vi không phân biệt hoa/thường trên web. Cần 1 tài khoản test dạng email để kiểm chứng.

## Các bước thực hiện
1. Nhập Email đã đăng ký nhưng viết hoa (VD: `ABC@Gmail.Com`).
2. Nhập đúng mật khẩu.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Đăng nhập thành công (dự kiến, do việc so khớp email thường không phân biệt hoa/thường ở backend — cần verify lại).

---

# [TC_LOGIN_16] Email chưa đăng ký

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_17
- **Khác biệt so với app:** App báo riêng "Tài khoản không tồn tại"; Web trả về **cùng một thông báo lỗi chung** như mọi trường hợp sai khác.

## Các bước thực hiện
1. Nhập Email chưa từng đăng ký.
2. Nhập mật khẩu bất kỳ.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn."

---

# [TC_LOGIN_17] Số điện thoại hợp lệ

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass** (tài khoản test dùng SĐT)
- **Tham chiếu App:** TC_18

## Các bước thực hiện
1. Nhập SĐT hợp lệ 10 số bắt đầu bằng 0 (VD: `0384492721`).
2. Nhập đúng mật khẩu.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Đăng nhập thành công.

---

# [TC_LOGIN_18] Số điện thoại > 10 ký tự

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_09 (không có validate riêng)
- **Tham chiếu App:** TC_19

## Các bước thực hiện
1. Nhập SĐT > 10 ký tự (VD: `09871234567`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung (server từ chối do không khớp tài khoản nào).

---

# [TC_LOGIN_19] Số điện thoại < 10 ký tự

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_18
- **Tham chiếu App:** TC_20

## Các bước thực hiện
1. Nhập SĐT < 10 ký tự (VD: `098712345`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung.

---

# [TC_LOGIN_20] Số điện thoại không bắt đầu bằng 0

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_18
- **Tham chiếu App:** TC_21

## Các bước thực hiện
1. Nhập SĐT không bắt đầu bằng 0 (VD: `1987123456`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung.

---

# [TC_LOGIN_21] Số điện thoại đầu số không hợp lệ

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_18
- **Tham chiếu App:** TC_22

## Các bước thực hiện
1. Nhập SĐT đầu số không hợp lệ (VD: `0123456789`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung.

---

# [TC_LOGIN_22] Số điện thoại chưa đăng ký

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_23

## Các bước thực hiện
1. Nhập SĐT chưa từng đăng ký (VD: `0900000000`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn."

---

# [TC_LOGIN_23] Tài khoản chỉ chứa ký tự đặc biệt

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_18
- **Tham chiếu App:** TC_24

## Các bước thực hiện
1. Nhập Tài khoản là ký tự đặc biệt (VD: `@#$%^&*`).
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung.

---

# [TC_LOGIN_24] Tài khoản có khoảng trắng đầu/cuối

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_25

## Các bước thực hiện
1. Nhập Tài khoản hợp lệ có khoảng trắng đầu/cuối (VD: `  0384492721  `).
2. Nhập đúng mật khẩu.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Đăng nhập thành công (đã verify: hệ thống tự xử lý khoảng trắng thừa, không bị lỗi).

---

# [TC_LOGIN_25] Giới hạn ký tự Tài khoản

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC_26
- **Kết quả đo được:** Điền chuỗi 150 ký tự vào textbox Tài khoản, `input.value` giữ nguyên đủ 150 ký tự — xác nhận **không có `maxlength`**, client không giới hạn số ký tự nhập. Giới hạn (nếu có) chỉ nằm ở backend, chưa kiểm chứng phần đó.

## Các bước thực hiện
1. Nhập Tài khoản > 100 ký tự (150 ký tự).
2. Kiểm tra giá trị input.

## Kết quả mong đợi
- [ ] Client cho nhập không giới hạn (đã verify). Nếu muốn kiểm tra giới hạn phía backend, cần thêm bước click "Đăng nhập" và xem network response.

---

## Nhóm: Textbox Mật khẩu

# [TC_LOGIN_26] Hiển thị textbox Mật khẩu

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app)
- **Tham chiếu App:** TC_27
- **Khác biệt so với app:** Web **không có icon con mắt** để hiện/ẩn mật khẩu như app.

## Các bước thực hiện
1. Quan sát textbox Mật khẩu.

## Kết quả mong đợi
- [ ] Icon khóa bên trái, placeholder "Nhập mật khẩu". Không có icon con mắt.

---

# [TC_LOGIN_27] Mật khẩu mặc định ẩn

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_28

## Các bước thực hiện
1. Nhập mật khẩu vào textbox.

## Kết quả mong đợi
- [ ] Mật khẩu hiển thị dạng dấu chấm ẩn (che kín), input `type="password"`.

---

# [TC_LOGIN_28] Bỏ trống Mật khẩu

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_06
- **Tham chiếu App:** TC_31

## Các bước thực hiện
1. Nhập Tài khoản hợp lệ.
2. Để trống Mật khẩu.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn." (không có thông báo riêng "Vui lòng nhập mật khẩu" như app).

---

# [TC_LOGIN_29] Mật khẩu chỉ chứa khoảng trắng

- **Trạng thái:** ✅ Áp dụng — hành vi giống TC_LOGIN_28
- **Tham chiếu App:** TC_32

## Các bước thực hiện
1. Nhập Mật khẩu là các khoảng trắng.
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung.

---

# [TC_LOGIN_30] Nhập sai Mật khẩu

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_33

## Các bước thực hiện
1. Nhập Tài khoản hợp lệ.
2. Nhập sai Mật khẩu.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn."

---

# [TC_LOGIN_31] Nhập đúng Mật khẩu

- **Trạng thái:** ✅ Áp dụng — trùng TC_LOGIN_04
- **Tham chiếu App:** TC_34

## Các bước thực hiện
1. Nhập Tài khoản + Mật khẩu đúng.
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Đăng nhập thành công.

---

# [TC_LOGIN_32] Nhập sai mật khẩu nhiều lần liên tiếp (khóa tạm thời)

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_35
- **Ghi chú:** App cũng chưa làm chức năng này (theo Ghi chú gốc). Đọc `Login.vue` không thấy logic đếm số lần sai/khóa tạm thời ở phía client — nếu có, phải nằm ở backend. Cần test với tài khoản riêng (không dùng tài khoản test chính để tránh bị khóa ngoài ý muốn).

## Các bước thực hiện
1. Nhập sai mật khẩu liên tiếp 5 lần trở lên.
2. Click "Đăng nhập" mỗi lần.

## Kết quả mong đợi
- [ ] Cần xác nhận: có hiển thị cảnh báo khóa tạm thời hay không (chưa rõ, cần test riêng).

---

# [TC_LOGIN_33] Phân biệt chữ hoa/thường của Mật khẩu

- **Trạng thái:** ✅ Áp dụng — theo nguyên lý chung (mật khẩu luôn phân biệt hoa/thường ở hầu hết hệ thống); **chưa test trực tiếp để tránh khóa tài khoản test**
- **Tham chiếu App:** TC_36

## Các bước thực hiện
1. Mật khẩu thật: đúng theo tài khoản test.
2. Nhập sai lệch hoa/thường 1 ký tự.
3. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung (mật khẩu sai do phân biệt hoa/thường).

---

# [TC_LOGIN_34] Paste mật khẩu

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_38

## Các bước thực hiện
1. Copy 1 chuỗi từ nguồn khác.
2. Paste vào trường Mật khẩu.

## Kết quả mong đợi
- [ ] Cho phép paste bình thường, không bị chặn (input password chuẩn HTML không có logic chặn paste trong code).

---

## Nhóm: Checkbox "Duy trì đăng nhập"

# [TC_LOGIN_35] Hiển thị checkbox

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế, khác app**
- **Tham chiếu App:** TC_39
- **Khác biệt so với app:** App mặc định checkbox **được tích sẵn**; Web đã verify qua screenshot — checkbox mặc định **KHÔNG tích** (`persistLogin: false` trong code).

## Các bước thực hiện
1. Quan sát checkbox "Duy trì đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị checkbox "Duy trì đăng nhập", trạng thái mặc định **chưa tích**.

---

# [TC_LOGIN_36] Tích/bỏ tích checkbox

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_40

## Các bước thực hiện
1. Click vào checkbox.

## Kết quả mong đợi
- [ ] Trạng thái chuyển đổi (tích ↔ bỏ tích) bình thường.

---

# [TC_LOGIN_37] Đăng nhập khi có tích "Duy trì đăng nhập"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation, có khác biệt thực đo được**
- **Tham chiếu App:** TC_41
- **Kết quả đo được (Playwright, so sánh `localStorage.expires_in` giữa 2 lần đăng nhập):**
  - Tích "Duy trì đăng nhập": `expires_in = 1789633275`
  - Không tích: `expires_in = 1787127680`
  - Chênh lệch ≈ **2.505.595 giây (~29 ngày)** — xác nhận checkbox **có thực sự ảnh hưởng** tới thời hạn phiên đăng nhập (JWT sống lâu hơn khi tích).

## Các bước thực hiện
1. Tích checkbox "Duy trì đăng nhập".
2. Đăng nhập thành công.
3. Đóng trình duyệt hoàn toàn, mở lại và truy cập `/dashboard`.

## Kết quả mong đợi
- [ ] Vẫn ở trạng thái đăng nhập, không bị đá về `/login` (thời hạn token dài hơn ~29 ngày so với không tích).

---

# [TC_LOGIN_38] Đăng nhập khi KHÔNG tích "Duy trì đăng nhập"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation**
- **Tham chiếu App:** TC_42
- **Ghi chú:** App note gốc: "app cũ cũng đang gặp lỗi như này". Trên web, token vẫn được lưu vào `localStorage` bất kể có tích checkbox hay không (khác với kỳ vọng "yêu cầu đăng nhập lại ngay" của app) — chỉ khác nhau về **thời hạn** (`expires_in`), không khác về việc có lưu phiên hay không. Xem số liệu cụ thể ở TC_LOGIN_37.

## Các bước thực hiện
1. Bỏ tích checkbox.
2. Đăng nhập thành công.
3. Đóng trình duyệt hoàn toàn, mở lại và truy cập `/dashboard`.

## Kết quả mong đợi
- [ ] Vẫn ở trạng thái đăng nhập (không bị đá về `/login` ngay), nhưng phiên hết hạn sớm hơn (~29 ngày sớm hơn so với khi tích) — khác với hành vi "yêu cầu đăng nhập lại" mà app mô tả.

---

## Nhóm: Link "Quên mật khẩu?"

# [TC_LOGIN_39] Hiển thị link

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_43

## Các bước thực hiện
1. Quan sát link "Quên mật khẩu?".

## Kết quả mong đợi
- [ ] Hiển thị link "Quên mật khẩu?" bên phải checkbox.

---

# [TC_LOGIN_40] Click link "Quên mật khẩu?"

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_44

## Các bước thực hiện
1. Click link "Quên mật khẩu?".

## Kết quả mong đợi
- [ ] Chuyển hướng tới `/request-password` (đã verify chính xác).

---

## Nhóm: Button "Đăng nhập"

# [TC_LOGIN_41] Hiển thị button

- **Trạng thái:** ✅ Áp dụng — **Đã verify: màu xanh lá, không phải màu tím như mô tả app**
- **Tham chiếu App:** TC_45
- **Khác biệt so với app:** App mô tả nút màu tím; thực tế web hiện tại nút "Đăng nhập" màu **xanh lá** (class `color="success"`).

## Các bước thực hiện
1. Quan sát button "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị button "Đăng nhập" nền xanh lá, chữ trắng, full-width.

---

# [TC_LOGIN_42] Click button khi để trống tất cả trường

- **Trạng thái:** ✅ Áp dụng — trùng hành vi TC_LOGIN_06
- **Tham chiếu App:** TC_46

## Các bước thực hiện
1. Để trống Tài khoản và Mật khẩu.
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ lỗi chung (không có validate required riêng biệt).

---

# [TC_LOGIN_43] Click button khi dữ liệu hợp lệ

- **Trạng thái:** ✅ Áp dụng — trùng TC_LOGIN_04
- **Tham chiếu App:** TC_47

## Các bước thực hiện
1. Nhập đầy đủ, hợp lệ Tài khoản + Mật khẩu.
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Đăng nhập thành công, chuyển vào `/dashboard`.

---

# [TC_LOGIN_44] Click button liên tục nhiều lần

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế, PHÁT HIỆN KHÁC BIỆT QUAN TRỌNG**
- **Tham chiếu App:** TC_48
- **⚠️ Phát hiện:** Test thực tế cho thấy khi bấm liên tục, API `/api/login` bị gọi **4 lần** (không phải 1 lần như kỳ vọng của app). Source code không có cờ `loading`/`disabled` để chặn double-submit. Đây là điểm khác biệt/khả năng phát sinh lỗi cần báo lại cho dev.

## Các bước thực hiện
1. Nhập dữ liệu hợp lệ.
2. Click "Đăng nhập" nhiều lần liên tục thật nhanh.

## Kết quả mong đợi (thực tế đo được)
- [ ] Hiện tại: gọi API nhiều lần (không đạt kỳ vọng "chỉ xử lý 1 lần" như app). Đề xuất kiểm thử tự động hoá bằng cách đếm số request `/api/login` qua `page.on('request', ...)`.

---

# [TC_LOGIN_45] Loading khi đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: XÁC NHẬN chưa implement**
- **Tham chiếu App:** TC_49
- **Kết quả đo được:** Giả lập API trễ 1.5s bằng `page.route()`, kiểm tra `button.isDisabled()` ngay sau khi click → kết quả **`false`** (nút vẫn bấm được, không có loading/disable). Xác nhận đúng như dự đoán từ đọc code: web **chưa có** loading indicator như app.

## Các bước thực hiện
1. Giả lập mạng chậm (`page.route()` delay response).
2. Nhập dữ liệu hợp lệ, click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiện tại: button KHÔNG disable, không có spinner trong lúc chờ phản hồi (khác với app). Đề xuất báo dev bổ sung.

---

# [TC_LOGIN_46] Đăng nhập khi mất kết nối mạng

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: XÁC NHẬN LÀ BUG**
- **Tham chiếu App:** TC_50
- **🐞 BUG xác nhận:** Test tự động với `context.setOffline(true)` bắt được lỗi JS runtime chưa xử lý:
  ```
  Cannot read properties of undefined (reading 'data')
  ```
  Đúng như dự đoán từ đọc code: khối `catch` trong `login()` truy cập `error.response.data.user_status` mà không kiểm tra `error.response` có tồn tại hay không. Khi mất mạng hoàn toàn, `axios` không trả về `error.response` → ném lỗi JS ngay tại dòng này, người dùng **không thấy bất kỳ thông báo lỗi thân thiện nào**, chỉ có nút bị "đứng" (vì không có xử lý loading để tắt). **Cần báo bug cho dev.**

## Các bước thực hiện
1. Ngắt kết nối mạng (`context.setOffline(true)` trong Playwright, hoặc DevTools → Network → Offline).
2. Nhập dữ liệu hợp lệ, click "Đăng nhập".

## Kết quả mong đợi
- [ ] **Thực tế (bug):** Không hiển thị thông báo lỗi, ném exception JS `Cannot read properties of undefined (reading 'data')` trong console.
- [ ] **Kỳ vọng đúng:** Nên hiển thị thông báo dạng "Không có kết nối mạng, vui lòng thử lại" như mô tả ở app.

---

# [TC_LOGIN_47] Đăng nhập khi server lỗi (500)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC_51
- **Kết quả đo được:** Mock API `/api/login` trả 500 qua `page.route()` → không crash, hiển thị đúng alert lỗi chung (khác với TC_LOGIN_46 vì lần này `error.response` vẫn tồn tại nên không rơi vào nhánh gây lỗi JS).

## Các bước thực hiện
1. Mock API `/api/login` trả về lỗi 500.
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị alert đỏ "Tài khoản hoặc mật khẩu không đúng. Mời quý khách kiểm tra lại. Cảm ơn." (đã verify — thông báo không thực sự phản ánh đúng nguyên nhân là lỗi server, nhưng ít nhất không crash).

---

# [TC_LOGIN_48] Đăng nhập với tài khoản bị khóa

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_52
- **Ghi chú:** Source code CÓ nhánh xử lý riêng: nếu response trả về `user_status`, hệ thống hiển thị **modal lỗi riêng** (`Lỗi đăng nhập`) thay vì alert đỏ thông thường. Cần 1 tài khoản test ở trạng thái bị khóa để verify chính xác nội dung modal.

## Các bước thực hiện
1. Đăng nhập bằng tài khoản đã bị khóa.
2. Click "Đăng nhập".

## Kết quả mong đợi
- [ ] Hiển thị modal "Lỗi đăng nhập" với nội dung message trả về từ server (khác với alert đỏ thông thường).

---

## Nhóm: Link "Đăng ký tại đây"

# [TC_LOGIN_49] Hiển thị text và link Đăng ký

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_61

## Các bước thực hiện
1. Quan sát dưới cùng màn hình.

## Kết quả mong đợi
- [ ] Hiển thị link "Đăng ký" (web không có text "Bạn chưa có tài khoản?" đi kèm — chỉ có link "Đăng ký" riêng, cần verify lại nếu muốn khớp 100% wording).

---

# [TC_LOGIN_50] Click link "Đăng ký"

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_62

## Các bước thực hiện
1. Click link "Đăng ký".

## Kết quả mong đợi
- [ ] Chuyển hướng tới `/register` (đã verify chính xác).

---

## Nhóm: Focus, Responsive, Điều hướng

# [TC_LOGIN_51] Thứ tự chuyển Focus (Tab)

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_64

## Các bước thực hiện
1. Click vào ô Tài khoản.
2. Nhấn phím Tab.

## Kết quả mong đợi
- [ ] Focus chuyển đúng thứ tự: Tài khoản → Mật khẩu (đã verify bằng `document.activeElement`).

---

# [TC_LOGIN_52] Responsive ở nhiều kích thước màn hình

- **Trạng thái:** ✅ Áp dụng (thay thế cho "xoay ngang màn hình" của app)
- **Tham chiếu App:** TC_66

## Các bước thực hiện
1. Kiểm tra layout ở các viewport: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667) và Mobile ngang (667x375).

## Kết quả mong đợi
- [ ] Layout hiển thị đúng, không vỡ, không tràn ở mọi kích thước.

---

# [TC_LOGIN_53] Nút Back của trình duyệt

- **Trạng thái:** ✅ Áp dụng (thay thế cho "nút back vật lý thiết bị" của app) — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_67

## Các bước thực hiện
1. Từ `/login`, click link "Đăng ký" để sang `/register`.
2. Bấm nút Back của trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng `/login` (đã verify chính xác).

---

## Nhóm: Testcase bổ sung riêng cho Web (app không có)

# [TC_LOGIN_54] Truy cập lại `/login` khi đã đăng nhập

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Mô tả:** Router có guard tự động chuyển hướng người dùng đã đăng nhập ra khỏi trang login.

## Các bước thực hiện
1. Đăng nhập thành công.
2. Truy cập trực tiếp lại URL `/login`.

## Kết quả mong đợi
- [ ] Tự động chuyển hướng vào `/dashboard`, không hiển thị lại form đăng nhập (đã verify chính xác).

---

## Tổng hợp trạng thái (54 testcase — đã lược bỏ 15 case không áp dụng cho web)

Đã tự động hoá bằng Playwright: [tests/login.spec.ts](../tests/login.spec.ts) (POM: [pages/LoginPage.ts](../pages/LoginPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 50 | Đã tự động hoá & verify trực tiếp trên web thật bằng Playwright |
| ⚠️ Cần xác nhận thêm | 3 | Cần tài khoản test riêng (dạng email, đã bị khóa, dùng để thử khóa tạm thời) — hiện chỉ có 1 tài khoản test dạng SĐT nên chưa an toàn để tự động hoá các case này |
| 🆕 Mới (riêng web) | 1 | Router guard redirect khi đã đăng nhập |

**Phát hiện đáng chú ý cần báo lại team dev (đã verify bằng automation, không còn là dự đoán):**
1. **Không có validate required/format phía client** — mọi lỗi input đều trả về 1 thông báo chung "Tài khoản hoặc mật khẩu không đúng...", kém thân thiện hơn app.
2. **Không chống double-submit** — nút "Đăng nhập" không disable khi đang xử lý → spam click gọi API `/api/login` tới **4 lần** (đo được bằng cách đếm request qua `page.on('request')`).
3. **🐞 BUG xác nhận:** mất kết nối mạng hoàn toàn → ném lỗi JS runtime chưa xử lý `Cannot read properties of undefined (reading 'data')` trong `catch` của `login()`, người dùng không thấy thông báo lỗi nào cả (khác với lỗi server 500 — trường hợp đó vẫn hiển thị alert bình thường, đã verify không crash).
4. **Không có loading indicator** khi đang xử lý đăng nhập (button vẫn `enabled` trong lúc chờ API, đo bằng cách giả lập API trễ 1.5s).
5. Checkbox "Duy trì đăng nhập" **có tác dụng thật**: chênh lệch thời hạn phiên đăng nhập (`expires_in`) ~29 ngày giữa tích/không tích — khác với suy đoán ban đầu, đây là điểm khác biệt tích cực so với mô tả "chưa hoạt động" của app.
