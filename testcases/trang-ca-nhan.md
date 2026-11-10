# Màn hình: Trang cá nhân + Đổi mật khẩu (giao diện làm lại)

- **URL:** `/profile` (route "Thông tin tài khoản"), `/change_password` (route "Thay đổi mật khẩu"), cả 2 yêu cầu
  đăng nhập (`requiresUser`). Vào từ menu tài khoản trên header ("Thông tin người dùng", "Thay đổi mật khẩu") và mục
  "Đổi mật khẩu" ở cuối trang cá nhân.
- **Component:** nhánh `origin/preprod` của `stocks` (commit "Trang cá nhân và đổi mật khẩu: làm lại giao diện theo
  thiết kế app", "Đổi mật khẩu: nút quay lại về đúng màn vừa rời đi", "Trang cá nhân tài khoản dùng thử chỉ ghi Dùng
  thử", "Đổi api upload ảnh"): `src/views/users/Profile.vue`, `src/views/users/ChangePassword.vue`, khuôn chung
  `src/assets/scss/_trang-ca-nhan.scss`, menu `src/containers/TheHeaderDropdownAccnt.vue`.
  `src/views/users/ChangeUserPassword.vue` là màn **quản trị** (`/users/:id/:name/changepassword`, `requiresModerator`)
  — ngoài phạm vi người dùng web.
- **Môi trường test:** https://prev2.vietpointer.vn — bản build preprod mới nhất, gọi **backend production**. Tài
  khoản `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí), đăng nhập qua `Prev2Session` (cache phiên ở `.auth/`).
- **Code test:** [tests/trang-ca-nhan.spec.ts](../tests/trang-ca-nhan.spec.ts), Page Object
  [pages/ProfilePage.ts](../pages/ProfilePage.ts). Chạy: `npx playwright test tests/trang-ca-nhan.spec.ts
  --project=chromium --workers=2` (~2 phút).
- **Phương pháp sinh:** kiểm kê độc lập trên source preprod + đo bằng Playwright thật trên prev2 (không đọc Google
  Sheet — văn phong theo `canh-bao-gia.md`, `dang-nhap.md`). Thẻ gói được kiểm bằng hồ sơ giả cho đủ 6 trạng thái gói;
  2 testcase (TC_07, TC_15) đọc hồ sơ thật (chỉ đọc) để chắc trang hiển thị đúng dữ liệu backend.
- **Quy ước trạng thái:**
  - 🆕 Testcase mới: kiểm kê từ web, đã tự động hoá.
  - ⚠️ Cần xác nhận thêm: bug / hành vi cần dev hoặc PO xác nhận (test ghi lại hành vi đo được).

**⚠️ AN TOÀN DỮ LIỆU — ĐỌC TRƯỚC KHI SỬA TEST:** tài khoản test là tài khoản production thật, dùng chung. Không test
nào được gửi đổi mật khẩu / cập nhật hồ sơ / đổi ảnh thật. `ProfilePage.open()` cài `FakeProfileServer` chiếm mọi
request tới `api2.kfsp.vn` / `users.kfsp.vn` **trước khi** mở trang:

| Endpoint | Cách xử lý trong test |
|---|---|
| `GET /api/users/{id}/edit` (thông tin tài khoản) | trả hồ sơ giả; TC_07, TC_15 đọc thật (chỉ đọc) |
| `GET /api/user-logs/reference` (nhật ký giới thiệu) | trả nhật ký giả |
| `GET /api/user-logs/alert-reference` (đánh dấu nhật ký đã xem — GET nhưng là lệnh ghi) | giả lập, đếm số lần gọi |
| `POST /api/users/update-info` (lưu thông tin) | giả lập ok / chậm / 422 / 500 / mất mạng, ghi body; mặc định huỷ |
| `POST /api/users/{id}/passwd` (đổi mật khẩu) | như trên |
| `POST /api/users/{id}/chavatar` (đổi ảnh) | như trên |
| `POST /api/user-dashboard-preference/save-user-dashboard-preference` (app tự gửi mỗi lần vào trang) | trả thành công giả |
| Mọi request không phải GET khác tới 2 host trên (trừ `/api/login`), vd `/api/logout` | huỷ, ghi vào `blockedWrites` |
| `/updateusersettings`, `/delusersettings` | huỷ (sẵn trong `Prev2Session`) |

Sau mỗi test, `afterEach` kiểm tra không có lệnh đổi mật khẩu / hồ sơ / ảnh nào lọt ra ngoài máy chủ giả.

---

## Nhóm: Trang cá nhân — hiển thị & điều hướng

# [TC_PROFILE_01] Mở "Thông tin người dùng" từ menu tài khoản trên header

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí, đứng ở một màn bất kỳ (vd Trung tâm thông báo).
2. Bấm avatar góc phải header → bấm "Thông tin người dùng".

## Kết quả mong đợi
- [ ] Chuyển sang `/profile`.
- [ ] Trang có thẻ danh tính, thẻ gói (khối tím), thẻ "Thông tin cá nhân" và mục "Đổi mật khẩu".

# [TC_PROFILE_02] Chưa đăng nhập mở /profile → về trang đăng nhập

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Trình duyệt chưa đăng nhập, mở thẳng `/profile`.

## Kết quả mong đợi
- [ ] Bị chuyển về `/login`.

# [TC_PROFILE_03] Thẻ danh tính — ảnh, tên, huy hiệu gói, email

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `/profile` (hồ sơ giả: tên "Nhà đầu tư Test", gói "Hội viên Bạc").

## Kết quả mong đợi
- [ ] Ảnh đại diện là ảnh đang lưu ở trình duyệt (`localStorage.avatar`), có nút tròn "Đổi ảnh đại diện" (icon máy ảnh).
- [ ] Tên hiển thị đậm, cạnh tên là huy hiệu gói (MemberLogo), dòng dưới là email.

# [TC_PROFILE_04] Chưa có ảnh → chữ cái đầu; chưa đặt tên → "Chưa đặt tên"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản chưa có ảnh đại diện, tên "bình an" → mở `/profile`.
2. Đổi hồ sơ thành tên trống, email "zed@example.com" → tải lại.

## Kết quả mong đợi
- [ ] Bước 1: ô ảnh hiện chữ "B" (chữ cái đầu của tên, viết hoa), không có thẻ `<img>`.
- [ ] Bước 2: tên hiển thị "Chưa đặt tên", ô ảnh hiện "Z" (chữ cái đầu email), dòng Tên ghi "Chưa cập nhật".

# [TC_PROFILE_05] Thẻ "Thông tin cá nhân" ở chế độ xem

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `/profile`.

## Kết quả mong đợi
- [ ] 5 dòng "icon – nhãn – giá trị": Tên, Điện thoại, Email, Địa chỉ, Mã giới thiệu (kèm nút "Sao chép mã giới thiệu").
- [ ] Chưa có ô nhập nào, chưa có nút "Lưu thay đổi"; góc thẻ có nút bút chì "Chỉnh sửa thông tin cá nhân".
- [ ] Mục "Đổi mật khẩu" trỏ tới `/change_password`.

# [TC_PROFILE_06] Trường trống hiện "Chưa cập nhật"; không có mã giới thiệu thì ẩn dòng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Hồ sơ không có SĐT, địa chỉ, mã giới thiệu → mở `/profile`.

## Kết quả mong đợi
- [ ] Điện thoại và Địa chỉ ghi "Chưa cập nhật" (chữ mờ — class `pf-trong`).
- [ ] Không có dòng "Mã giới thiệu".

# [TC_PROFILE_07] Dữ liệu thật của tài khoản trả phí

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** đọc `/edit` thật (chỉ đọc). Tài khoản đăng nhập bằng SĐT nên test chỉ kiểm định dạng, không ghi dữ liệu
  cá nhân vào test.

## Các bước thực hiện
1. Đăng nhập `TEST_USER_*`, mở `/profile`.

## Kết quả mong đợi
- [ ] Email ở thẻ danh tính đúng định dạng email và trùng với dòng Email của thẻ thông tin.
- [ ] Thẻ gói có tên gói, nút "Gia hạn / Nâng cấp", số ngày còn lại (số nguyên), ngày hết hạn dạng `DD/MM/YYYY`, thanh
  "Đã dùng N% thời gian gói".

---

## Nhóm: Trang cá nhân — thẻ gói

Trạng thái gói tính trong `Profile.vue › goi`: vĩnh viễn (`forever == 2`) → có ngày hết hạn (dùng thử / trả phí / đã
hết) → không có hạn (miễn phí). Số ngày đếm theo ngày lịch; thanh chạy theo phần **đã dùng**.

# [TC_PROFILE_08] Gói trả phí còn hạn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Hồ sơ "Hội viên Bạc", kích hoạt 30 ngày trước, hết hạn sau 70 ngày → mở `/profile`.

## Kết quả mong đợi
- [ ] Nhãn gói "Hội viên Bạc", nút "Gia hạn / Nâng cấp".
- [ ] "Thời gian còn lại" — số to "70" + "ngày".
- [ ] Thanh "Đã dùng 30% thời gian gói" (rộng 30%), dưới thanh là ngày kích hoạt và ngày hết hạn (`DD/MM/YYYY`).

# [TC_PROFILE_09] Tài khoản dùng thử

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Hồ sơ `status = Trial`, `plan_name = Hội viên Vàng`, còn 5 ngày → mở `/profile`.

## Kết quả mong đợi
- [ ] Nhãn gói ghi "Dùng thử" (không ghi tên gói), nút "Nâng cấp gói", số ngày "5".

# [TC_PROFILE_10] Gói đã hết hạn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Hồ sơ hết hạn 3 ngày trước → mở `/profile`.

## Kết quả mong đợi
- [ ] Chữ to "Hết hạn", thanh "Đã dùng 100% thời gian gói", nút "Nâng cấp gói", mốc cuối là ngày hết hạn.

# [TC_PROFILE_11] Gói hết hạn trong hôm nay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Hồ sơ hết hạn 23:59 hôm nay → mở `/profile`.

## Kết quả mong đợi
- [ ] Chữ to "Hết hạn hôm nay", nút vẫn là "Gia hạn / Nâng cấp".

# [TC_PROFILE_12] Gói vĩnh viễn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Hồ sơ `forever = 2`, gói "Hội viên Kim Cương" → mở `/profile`.

## Kết quả mong đợi
- [ ] Chữ to "Không giới hạn"; không có nút gia hạn, không có thanh thời gian.

# [TC_PROFILE_13] Tài khoản miễn phí (không có ngày hết hạn)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Hồ sơ không có tên gói, không có ngày kích hoạt / hết hạn → mở `/profile`.

## Kết quả mong đợi
- [ ] Nhãn gói "Hội viên Miễn phí", "Gói hiện tại" — chữ to "Miễn phí", nút "Nâng cấp gói".
- [ ] Không có thanh thời gian, cạnh tên không có huy hiệu gói.

# [TC_PROFILE_14] Bấm nút trên thẻ gói → popup "Chọn dịch vụ"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `/profile`, bấm "Gia hạn / Nâng cấp".

## Kết quả mong đợi
- [ ] Hiện popup "Chọn dịch vụ" dùng chung của app.

# [TC_PROFILE_15] Tài khoản Free thật

- **Trạng thái:** 🆕 Testcase mới
- **Kết quả đo được (09/11/2026):** tài khoản `FREE_USER_*` là gói dùng thử đã hết → thẻ ghi "Hội viên Miễn phí" nhưng
  phần giữa là "Thời gian còn lại · Hết hạn" kèm 2 mốc ngày cũ (đúng code: có ngày hết hạn thì xét theo hạn trước).

## Các bước thực hiện
1. Đăng nhập `FREE_USER_*`, mở `/profile` (đọc hồ sơ thật).

## Kết quả mong đợi
- [ ] Email đúng định dạng; nhãn gói "Hội viên Miễn phí" hoặc "Dùng thử"; nút "Nâng cấp gói" (không có "Gia hạn").

---

## Nhóm: Trang cá nhân — sửa thông tin

# [TC_PROFILE_16] Bấm bút chì → chế độ sửa

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `/profile`, bấm nút bút chì.

## Kết quả mong đợi
- [ ] Tên, Điện thoại, Địa chỉ thành ô nhập có sẵn giá trị cũ, placeholder lần lượt "Nhập tên hiển thị", "Nhập số điện
  thoại" (`type=tel`), "Nhập địa chỉ"; con trỏ đặt sẵn ở ô Tên.
- [ ] Email và Mã giới thiệu vẫn chỉ đọc.
- [ ] Nút bút chì và mục "Đổi mật khẩu" ẩn đi (rời trang lúc đang sửa là mất phần chưa lưu).
- [ ] Chân thẻ có "Huỷ" và "Lưu thay đổi" (đang tắt vì chưa đổi gì).

# [TC_PROFILE_17] "Lưu thay đổi" chỉ bật khi có thay đổi thật

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở chế độ sửa, thêm khoảng trắng đầu/cuối vào Tên.
2. Đổi SĐT, rồi gõ lại đúng SĐT cũ.
3. Đổi Địa chỉ.

## Kết quả mong đợi
- [ ] Bước 1: nút vẫn tắt (so sánh sau khi bỏ khoảng trắng đầu/cuối).
- [ ] Bước 2: bật khi khác, tắt lại khi trả về như cũ.
- [ ] Bước 3: nút bật.

# [TC_PROFILE_18] Lưu thành công

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Sửa Tên "  Tên Mới  ", SĐT " 0911222333 ", Địa chỉ "TP. Hồ Chí Minh " → bấm "Lưu thay đổi" (máy chủ giả trả ok).
2. Mở menu tài khoản trên header.

## Kết quả mong đợi
- [ ] Gửi đúng 1 request `update-info` với `name`, `phone`, `address` đã bỏ khoảng trắng đầu/cuối, kèm
  `telegram_username` giữ nguyên giá trị backend trả (trang không còn hiện Telegram nhưng gửi lại để khỏi bị xoá).
- [ ] Về chế độ xem với giá trị mới; mục "Đổi mật khẩu" hiện lại; không hiện toast nào.
- [ ] Tên trong menu tài khoản trên header cập nhật thành "Tên Mới".

# [TC_PROFILE_19] Nhấn Enter trong ô nhập → lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở chế độ sửa, đổi Địa chỉ rồi nhấn Enter.

## Kết quả mong đợi
- [ ] Lưu như bấm "Lưu thay đổi", về chế độ xem.

# [TC_PROFILE_20] "Huỷ" → trả lại giá trị cũ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở chế độ sửa, đổi Tên, xoá SĐT → bấm "Huỷ". Bấm bút chì lại.

## Kết quả mong đợi
- [ ] Về chế độ xem với giá trị cũ, không gọi API; mở sửa lại thì ô có giá trị cũ.

# [TC_PROFILE_21] Lỗi 422 theo trường

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả 422 `errors: { phone: [...], name: [...] }`. Sửa SĐT → Lưu.
2. Gõ thêm vào ô SĐT.
3. Bấm Huỷ rồi bấm bút chì lại.

## Kết quả mong đợi
- [ ] Toast đỏ "Chưa lưu được thông tin, kiểm tra lại các ô báo lỗi."; dòng lỗi đỏ dưới ô SĐT và ô Tên đúng nội dung
  máy chủ trả, viền ô đỏ; ô Địa chỉ không lỗi; giữ giá trị đã nhập.
- [ ] Bước 2: lỗi ô SĐT tắt, lỗi ô Tên vẫn còn.
- [ ] Bước 3: không còn lỗi nào.

# [TC_PROFILE_22] Lỗi máy chủ (500) / mất mạng khi lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả 500 (lần 2: huỷ kết nối). Sửa Tên → Lưu.

## Kết quả mong đợi
- [ ] Toast đỏ "Chưa lưu được thông tin, vui lòng thử lại."; vẫn ở chế độ sửa, giữ giá trị đã nhập, nút "Lưu thay đổi"
  bật lại.

# [TC_PROFILE_23] Đang lưu (máy chủ chậm) + bấm đúp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả chậm 2,5 giây. Sửa Tên → bấm đúp "Lưu thay đổi", rồi nhấn Enter trong ô.

## Kết quả mong đợi
- [ ] Nút đổi thành "Đang lưu…" và bị khoá, nút "Huỷ" cũng khoá.
- [ ] Chỉ 1 request được gửi; xong thì về chế độ xem.

# [TC_PROFILE_24] Không kiểm tra dữ liệu ở trình duyệt

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** trình duyệt không chặn tên rỗng / chỉ có khoảng trắng hay SĐT có chữ — vẫn gửi `name: ''`,
  `phone: 'abc-xyz'`; nếu máy chủ nhận thì tên hiển thị thành "Chưa đặt tên". Cần dev xác nhận backend có kiểm tra
  (không thử thật được vì sẽ ghi vào tài khoản production).

## Các bước thực hiện
1. Ở chế độ sửa, Tên nhập "   ", SĐT "abc-xyz" → Lưu (máy chủ giả trả ok).

## Kết quả mong đợi
- [ ] (Hành vi hiện tại) nút Lưu bật, request gửi `name: ''`, `phone: 'abc-xyz'`, tên hiển thị "Chưa đặt tên".

---

## Nhóm: Trang cá nhân — ảnh đại diện & mã giới thiệu

# [TC_PROFILE_25] Đổi ảnh đại diện thành công

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Đổi ảnh đại diện", chọn ảnh PNG 1200×800 (máy chủ giả trả `storedPath`).

## Kết quả mong đợi
- [ ] Ô chọn file chỉ nhận ảnh (`accept="image/*"`).
- [ ] Gửi đúng 1 request multipart, trường `file` là ảnh JPEG đã thu nhỏ về rộng 600px (600×400).
- [ ] `localStorage.avatar` = đường dẫn mới; ảnh ở trang cá nhân và avatar trên header đổi theo; không có toast lỗi.

# [TC_PROFILE_26] Đổi ảnh lỗi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả 500, chọn 1 ảnh.

## Kết quả mong đợi
- [ ] Toast đỏ "Không tải được ảnh đại diện, vui lòng thử lại."; ảnh cũ giữ nguyên; nút đổi ảnh bật lại.

# [TC_PROFILE_27] Đang tải ảnh

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả chậm, chọn 1 ảnh.

## Kết quả mong đợi
- [ ] Trong lúc tải: nút đổi ảnh bị khoá, ô ảnh ở trạng thái đang tải (`pf-anh-dang-tai`); xong thì trở lại bình thường.

# [TC_PROFILE_28] Sao chép mã giới thiệu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm nút sao chép cạnh mã giới thiệu.

## Kết quả mong đợi
- [ ] Clipboard có đúng mã; nút đổi thành dấu tích ("Đã chép mã giới thiệu", tooltip "Đã chép"), khoảng 1,5 giây sau tự
  trở lại "Sao chép mã giới thiệu".

# [TC_PROFILE_29] Trình duyệt chặn clipboard

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Trình duyệt từ chối ghi clipboard, bấm nút sao chép.

## Kết quả mong đợi
- [ ] Toast đỏ "Không sao chép được, hãy bôi đen mã và chép thủ công."; nút giữ nguyên trạng thái chưa chép.

---

## Nhóm: Trang cá nhân — popup nhật ký giới thiệu

Lúc mở trang, web đọc `/api/user-logs/reference`, lọc dòng `status = New`, hiện popup "Thông báo" rồi gọi
`/api/user-logs/alert-reference` để đánh dấu đã xem.

# [TC_PROFILE_30] Có nhật ký giới thiệu mới → popup "Thông báo"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhật ký giả: 1 dòng `reference_success` (1 tháng), 1 dòng `active_reference_success` (2 tháng), 1 dòng ưu đãi 100
   tháng, 1 dòng đã xem → mở `/profile`.
2. Bấm "Đóng".

## Kết quả mong đợi
- [ ] Popup tiêu đề "Thông báo", đúng 2 dòng:
  "01/11/2026: Bạn đã giới thiệu thành công thành viên Bạn A tham gia KungFuStocksPro và nhận thêm 1 tháng sử dụng" và
  "02/11/2026: Bạn đã tham gia KungFuStocksPro cùng thành viên Bạn B và nhận thêm 2 tháng sử dụng" (bỏ dòng ưu đãi ≥ 100
  và dòng đã xem); không có "Xem thêm".
- [ ] Gọi đánh dấu đã xem đúng 1 lần. Bấm "Đóng" → popup tắt.

# [TC_PROFILE_31] Hơn 3 dòng → "Xem thêm" / "Thu gọn"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhật ký giả 5 dòng mới → mở `/profile`. Bấm "Xem thêm", rồi "Thu gọn".

## Kết quả mong đợi
- [ ] Ban đầu 3 dòng + "Xem thêm"; bấm → 5 dòng + "Thu gọn"; bấm lại → 3 dòng.

# [TC_PROFILE_32] Không có nhật ký mới → không popup

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhật ký chỉ có dòng đã xem → mở `/profile`.

## Kết quả mong đợi
- [ ] Không hiện popup, không gọi đánh dấu đã xem.

# [TC_PROFILE_33] 🐞 API nhật ký giới thiệu lỗi → bị đẩy khỏi trang cá nhân

- **Trạng thái:** ⚠️ Cần xác nhận thêm (bug)
- **Kết quả đo được:** `showReferenceLog().catch` → `$router.push('/login')`; đang đăng nhập nên router đưa tiếp về
  `/dashboard`. Người dùng không xem được trang cá nhân, không có thông báo gì. Đây là API **phụ** (chỉ để hiện popup
  giới thiệu) nhưng lỗi của nó làm mất cả trang. `disableReferenceLog().catch` cũng có cùng cách xử lý.
- **Mong đợi đúng (đề xuất):** ở lại `/profile`, bỏ qua popup.

## Các bước thực hiện
1. `/api/user-logs/reference` trả 500, mở `/profile`.

## Kết quả mong đợi
- [ ] (Hành vi hiện tại) URL chuyển sang `/dashboard`, phiên đăng nhập còn nguyên, không có toast lỗi.

# [TC_PROFILE_34] API thông tin tài khoản lỗi → rời trang

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** `showInfo().catch` → `/login` → `/dashboard`, không báo lỗi. Ý đồ là xử lý token hết hạn, nhưng
  mọi lỗi (500, mất mạng) đều bị coi như hết phiên mà không đăng xuất.

## Các bước thực hiện
1. `/api/users/{id}/edit` trả 500, mở `/profile`.

## Kết quả mong đợi
- [ ] (Hành vi hiện tại) URL chuyển sang `/dashboard`, phiên còn nguyên.

---

## Nhóm: Đổi mật khẩu

# [TC_PROFILE_35] Giao diện trang Đổi mật khẩu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở `/profile` bấm mục "Đổi mật khẩu".

## Kết quả mong đợi
- [ ] Chuyển sang `/change_password`: nút "Quay lại", tiêu đề "Đổi mật khẩu".
- [ ] 3 ô mật khẩu (ẩn ký tự) có nhãn/placeholder: "Mật khẩu hiện tại"/"Nhập mật khẩu hiện tại" (`autocomplete=current-password`),
  "Mật khẩu mới"/"Nhập mật khẩu mới", "Xác nhận mật khẩu mới"/"Nhập lại mật khẩu mới" (`new-password`); mỗi ô có nút mắt
  "Hiện …".
- [ ] Con trỏ đặt sẵn ở ô mật khẩu hiện tại; "Huỷ" bật, "Đổi mật khẩu" tắt.

# [TC_PROFILE_36] Mở từ menu tài khoản ở màn khác → quay lại đúng màn đó

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở `/trung-tam-thong-bao`, mở menu tài khoản → "Thay đổi mật khẩu" → bấm "Quay lại".
2. Lặp lại, lần này bấm "Huỷ".

## Kết quả mong đợi
- [ ] Cả 2 lần đều về `/trung-tam-thong-bao`.

# [TC_PROFILE_37] Mở thẳng link /change_password → quay lại trang cá nhân

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở thẳng `/change_password` (gõ URL / F5), bấm "Quay lại". Mở lại thẳng link, bấm "Huỷ".

## Kết quả mong đợi
- [ ] Cả 2 lần đều về `/profile`.

# [TC_PROFILE_38] Nút "Đổi mật khẩu" chỉ bật khi đủ 3 ô

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Lần lượt điền ô hiện tại, ô mới, ô xác nhận; rồi xoá ô hiện tại.

## Kết quả mong đợi
- [ ] Nút tắt khi còn ô trống, bật khi đủ cả 3, tắt lại khi xoá 1 ô.

# [TC_PROFILE_39] Nút mắt hiện/ẩn mật khẩu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm mắt ở ô mật khẩu mới, bấm lại; bấm mắt ở 2 ô còn lại.

## Kết quả mong đợi
- [ ] Mỗi ô chuyển hiện/ẩn độc lập; nhãn nút đổi "Hiện mật khẩu mới" ↔ "Ẩn mật khẩu mới".

# [TC_PROFILE_40] Xác nhận mật khẩu không khớp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Điền mật khẩu mới và xác nhận khác nhau → bấm "Đổi mật khẩu".
2. Sửa ô mật khẩu mới. Sau đó sửa ô xác nhận.

## Kết quả mong đợi
- [ ] Lỗi đỏ "Mật khẩu xác nhận không khớp" dưới ô xác nhận (viền đỏ); không gọi API; ở lại trang.
- [ ] Sửa ô mật khẩu mới: lỗi vẫn còn. Sửa ô xác nhận: lỗi tắt.

# [TC_PROFILE_41] Đổi mật khẩu thành công (giả lập)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Từ `/profile` vào Đổi mật khẩu, điền đủ và khớp → bấm "Đổi mật khẩu" (máy chủ giả trả ok).

## Kết quả mong đợi
- [ ] Gửi 1 request `{ old_password, new_password }` đúng giá trị đã nhập.
- [ ] Về màn trước (`/profile`), không có toast (app chỉ báo khi lỗi).

# [TC_PROFILE_42] Máy chủ trả lỗi kèm message

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả 422 `{ message: "Mật khẩu hiện tại không đúng" }`, gửi form.

## Kết quả mong đợi
- [ ] Toast đỏ đúng message máy chủ; ở lại trang, giữ các ô đã nhập, nút bật lại.

# [TC_PROFILE_43] Lỗi không kèm message (500) / mất mạng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả 500 không có message (lần 2: huỷ kết nối), gửi form.

## Kết quả mong đợi
- [ ] Toast đỏ mặc định "Chưa đổi được mật khẩu, kiểm tra lại mật khẩu hiện tại."; ở lại trang.

# [TC_PROFILE_44] Đang đổi (máy chủ chậm) + bấm đúp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ giả trả chậm 2,5 giây. Bấm đúp "Đổi mật khẩu", rồi nhấn Enter ở ô xác nhận.

## Kết quả mong đợi
- [ ] Nút đổi thành "Đang đổi…" và khoá, "Huỷ" cũng khoá; chỉ 1 request được gửi; xong thì về màn trước.

# [TC_PROFILE_45] Nhấn Enter ở ô xác nhận → gửi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Điền đủ 3 ô, nhấn Enter ở ô xác nhận.

## Kết quả mong đợi
- [ ] Form được gửi (1 request).

# [TC_PROFILE_46] Không kiểm tra độ dài/độ mạnh, mật khẩu mới trùng mật khẩu cũ

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Kết quả đo được:** trình duyệt chỉ kiểm "đủ 3 ô" và "xác nhận khớp" — mật khẩu "1", mật khẩu mới trùng mật khẩu
  cũ vẫn gửi lên máy chủ. Cần dev xác nhận backend có kiểm tra (không thử thật được).

## Các bước thực hiện
1. Điền "1" / "1" / "1" → bấm "Đổi mật khẩu".

## Kết quả mong đợi
- [ ] (Hành vi hiện tại) nút bật và request gửi `old_password: "1"`, `new_password: "1"`.

# [TC_PROFILE_47] Chưa đăng nhập mở /change_password → về trang đăng nhập

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Trình duyệt chưa đăng nhập, mở thẳng `/change_password`.

## Kết quả mong đợi
- [ ] Bị chuyển về `/login`.

---

## Nhóm: Màn hình hẹp

# [TC_PROFILE_48] 375px — không cuộn ngang, nhãn nằm trên giá trị, 2 nút chia đều

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cửa sổ 375×800, mở `/profile`, bấm bút chì. Huỷ, vào Đổi mật khẩu.

## Kết quả mong đợi
- [ ] Không có thanh cuộn ngang ở cả 2 trang.
- [ ] Ở trang cá nhân, nhãn ("Tên") nằm phía trên giá trị thay vì đứng cạnh.
- [ ] Hai nút chân form ("Huỷ" / "Lưu thay đổi", "Huỷ" / "Đổi mật khẩu") rộng bằng nhau.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 44 |
| ⚠️ Cần xác nhận thêm | 4 (TC_24, TC_33, TC_34, TC_46) |
| **Tổng** | **48** (50 test Playwright — TC_22, TC_43 chạy 2 biến thể) |

## Phát hiện đáng chú ý

1. **🐞 TC_33 — API phụ lỗi làm mất cả trang cá nhân:** `/api/user-logs/reference` (chỉ để hiện popup nhật ký giới
   thiệu) lỗi → `Profile.vue` đẩy sang `/login` → router đưa về `/dashboard`, không báo gì. Tương tự TC_34 với API
   thông tin tài khoản.
2. **⚠️ Không kiểm tra dữ liệu ở trình duyệt (TC_24, TC_46):** tên rỗng, SĐT có chữ, mật khẩu 1 ký tự / trùng mật khẩu
   cũ đều được gửi lên máy chủ — cần backend xác nhận có chặn.
3. **App tự ghi dữ liệu mỗi lần vào trang:** `userDashboardPreference.mixin.js` gửi `POST
   save-user-dashboard-preference` ở mọi màn; nếu request lỗi, app bật toast "Lỗi cập nhật người dùng version dashboard"
   ở bất kỳ màn nào. Test giả lập thành công để toast này không che các toast cần kiểm tra.
4. Tài khoản Free thật (gói dùng thử đã hết) hiện "Hội viên Miễn phí" nhưng phần giữa là "Thời gian còn lại · Hết
   hạn" (TC_15) — đúng code, có thể PO muốn hiện "Miễn phí".
