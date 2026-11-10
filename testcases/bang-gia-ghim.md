# Màn hình: Bảng giá — Ẩn/hiện cột kéo + ghim, đồng bộ mã ghim với app

- **URL:** `/bang-gia` (bảng giá thời gian thực — `src/views/ibd/stock/liveBoard/`).
- **Tính năng mới trên `preprod`:**
  - `feat/show-hide-pin-bang-gia` (merge 13/10/2026, commit f5545a114): cột nút kéo đổi vị trí + nút ghim ở đầu dòng
    mặc định **thu gọn**; mũi tên `.price-board-action-toggle` ở góc ô tiêu đề "Mã" mở cột ra, mũi tên chuyển sang ô
    tiêu đề của chính cột đó để thu lại (`headerLiveBoard.js renderActionToggle`, `rowItem.js`, `wrapperLayout.js
    is_edit_rows`, `columnSettings.js getRowMinWidth`).
  - `fix/ghim_banggia` (merge 26/10/2026, commit f4c471b93): mã ghim lưu ở setting `price_board_obj_pinned` **dùng chung
    với app mobile** → web đọc-gộp-ghi thay vì ghi nguyên khối (`setPinnedLocal`, `mergePinnedKey`, `savePinnedToCloud`,
    `refreshPinnedFromCloud`, `onVisibilityChangePinned` trong `wrapperLayout.js`).
- **Domain test:** https://kfsp.vn (production = preprod mới nhất, đo ngày 10/11/2026). Spec: `tests/bang-gia-ghim.spec.ts`,
  Page Object: `pages/BangGiaGhimPage.ts`. Viewport 1600×900 (thanh sàn dạng nút rời `.segment-item`).
- **Quan hệ với bộ cũ:** [bang-gia.md](bang-gia.md) TC_BANGGIA_36 (ghim / bỏ ghim 1 mã) viết trước khi có tính năng thu
  gọn — trên preprod nút ghim mặc định bị ẩn nên case đó cần mở cột trước (chưa sửa bộ cũ, xem mục "Phát hiện").
- **Nguồn:** tính năng chỉ web có, không có tab tương ứng trong Google Sheet của app → toàn bộ là 🆕.

**⚠️ An toàn dữ liệu:** kfsp.vn gọi backend production, tài khoản test dùng chung. `/getusersettings` bị thay response
(trạng thái bảng giá về "Toàn bộ", `price_board_obj_pinned` lấy từ kho ghim GIẢ đóng vai bản trên máy chủ);
`/updateusersettings` khoá `price_board_obj_pinned` → kho giả, khoá khác → huỷ; `/delusersettings` → huỷ; mọi request
không phải GET khác tới `*.kfsp.vn` → huỷ và test fail nếu có (`afterEach`). Không thao tác nào chạm mã ghim thật.

| Trạng thái | Ý nghĩa |
|---|---|
| ✅ Áp dụng | Có tương ứng trong testcase app |
| 🆕 Testcase mới | Chỉ web có |
| ⚠️ Cần xác nhận thêm | Hành vi đo được cần dev/PO xác nhận |

---

## Nhóm: Ẩn/hiện cột kéo + ghim

# [TC_BGGHIM_01] Mặc định cột kéo + ghim thu gọn, mũi tên mở ở góc ô "Mã"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập, mở `/bang-gia` (sàn "Toàn bộ").

## Kết quả mong đợi
- [ ] Hàng tiêu đề và mọi dòng có class `no-action-col`; không có ô `.price-board-col.action` nào.
- [ ] Có đúng 1 mũi tên `›` ở góc trên trái ô tiêu đề "Mã" (`.in-code`), `aria-label="Mở cột sắp xếp, ghim"`,
  `aria-expanded="false"`.
- [ ] Cột Mã dính sát mép trái hàng (không chừa 40px).

---

# [TC_BGGHIM_02] Rê chuột lên mũi tên → chú thích

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Rê chuột lên mũi tên ở ô "Mã".
2. Rời chuột ra chỗ khác.

## Kết quả mong đợi
- [ ] Hiện chú thích `role="tooltip"` "Mở cột sắp xếp, ghim", ngay dưới mũi tên (cách ≤ 10px), mép trái thẳng mép trái mũi tên.
- [ ] Rời chuột → chú thích biến mất.

---

# [TC_BGGHIM_03] Bấm mũi tên → mở cột kéo + ghim

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có sẵn 1 mã ghim (FPT). Rê chuột lên mũi tên rồi bấm.
2. Rê chuột lên mũi tên ở vị trí mới.

## Kết quả mong đợi
- [ ] Chú thích ẩn ngay khi bấm.
- [ ] Hàng tiêu đề có ô cột action; mũi tên nằm trong ô đó, class `on`, `aria-label="Thu cột sắp xếp, ghim"`,
  `aria-expanded="true"`.
- [ ] Dòng thường có icon "Kéo để thay đổi vị trí" + "Nhấn để ghim lên đầu"; dòng trong khu ghim chỉ có "Nhấn để bỏ ghim".
- [ ] Chú thích ở vị trí mới là "Thu cột sắp xếp, ghim".

---

# [TC_BGGHIM_04] Bấm mũi tên lần nữa → thu cột

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở cột (TC_03), bấm mũi tên một lần nữa.

## Kết quả mong đợi
- [ ] Về đúng trạng thái mặc định của TC_01 (mũi tên về góc ô "Mã", `aria-expanded="false"`, không còn ô action).

---

# [TC_BGGHIM_05] Bấm mũi tên không sắp xếp theo Mã

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** mũi tên nằm trong ô "Mã" (ô bấm là sắp xếp) — code chặn cú bấm lan lên ô (`stopPropagation`).

## Các bước thực hiện
1. Ghi lại 5 mã đầu bảng. Bấm mũi tên 2 lần (mở rồi thu).
2. Bấm vào giữa ô "Mã" (không trúng mũi tên).

## Kết quả mong đợi
- [ ] Bước 1: thứ tự 5 mã đầu không đổi.
- [ ] Bước 2: bảng đảo thứ tự sắp xếp theo mã (mã đầu bảng đổi).

---

# [TC_BGGHIM_06] Thu cột thì hàng hẹp đi đúng 40px

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đọc `min-width` của hàng tiêu đề và dòng đầu khi cột đang thu; mở cột rồi đọc lại.

## Kết quả mong đợi
- [ ] Tiêu đề và dòng dữ liệu cùng `min-width`; mở cột thì cả hai tăng đúng 40px (đo được 1523px → 1563px với bộ cột mặc định).

---

# [TC_BGGHIM_07] Trạng thái mở cột không được nhớ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở cột, chờ 2,5 giây; tải lại trang.

## Kết quả mong đợi
- [ ] Không có setting nào được ghi cho trạng thái mở/thu.
- [ ] Sau khi tải lại, cột thu gọn như mặc định.

---

# [TC_BGGHIM_08] Cột thu gọn — khu ghim vẫn hiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản đã ghim FPT, VNM (sàn Toàn bộ). Mở bảng giá, không mở cột.

## Kết quả mong đợi
- [ ] Khu ghim (`#priceboard-pinned`) ở trên danh sách thường, hiện FPT, VNM đúng thứ tự; 2 mã không có trong danh sách thường.
- [ ] Dòng ghim cũng thu cột (không có nút bỏ ghim).

---

# [TC_BGGHIM_09] Bảng Phái sinh

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "Phái sinh"; bấm mũi tên.

## Kết quả mong đợi
- [ ] Mũi tên nằm ở ô "Mã" của bảng Phái sinh (`code_ps`), mặc định đang thu.
- [ ] Bấm → mở cột, dòng có nút ghim.

---

## Nhóm: Ghim / bỏ ghim — lưu đọc-gộp-ghi

# [TC_BGGHIM_10] Ghim 1 mã → lưu sau ~2 giây, đã gộp với bản máy chủ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ có ghim FPT, VNM. Mở cột, bấm ghim mã đầu danh sách thường (vd A32).

## Kết quả mong đợi
- [ ] Mã lên đầu khu ghim ngay (A32, FPT, VNM) và rời danh sách thường.
- [ ] Không ghi ngay; ~2 giây sau web gọi 1 lần `GET /getusersettings?keys=price_board_obj_pinned` rồi 1 lần
  `POST /updateusersettings` với `price_board_obj_pinned = {"all":["A32","FPT","VNM"]}`.
- [ ] Các khoá trạng thái bảng giá khác (sàn, ngành, thứ tự) ghi riêng, không mang khoá ghim; localStorage cập nhật theo.

---

# [TC_BGGHIM_11] Bỏ ghim → về đầu danh sách thường

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ có ghim FPT, VNM. Mở cột, bấm bỏ ghim VNM.

## Kết quả mong đợi
- [ ] Khu ghim còn FPT; VNM đứng đầu danh sách thường.
- [ ] Ghi `{"all":["FPT"]}`.

---

# [TC_BGGHIM_12] Ghim/bỏ ghim liên tiếp trong 2 giây → 1 lượt lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ có ghim FPT. Trong vòng 2 giây: ghim mã A, ghim mã B, bỏ ghim A.

## Kết quả mong đợi
- [ ] Chỉ 1 lần đọc + 1 lần ghi, giá trị cuối `{"all":[B,"FPT"]}`; không có lần ghi thứ 2.

---

# [TC_BGGHIM_13] App vừa ghim thêm mã → web không làm mất

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Web mở với ghim FPT, VNM. Trên máy chủ, app ghim thêm HPG (web chưa đọc lại).
2. Trên web ghim một mã khác (X).

## Kết quả mong đợi
- [ ] Ghi `{"all":[X,"FPT","VNM","HPG"]}` (mã app ghim được giữ, xếp sau các mã web đang thấy).
- [ ] Sau khi lưu, HPG hiện trong khu ghim và rời danh sách thường.

---

# [TC_BGGHIM_14] App vừa bỏ ghim một mã → web không kéo mã đó trở lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Web mở với ghim FPT, VNM. Trên máy chủ, app bỏ ghim VNM.
2. Trên web ghim một mã khác (X).

## Kết quả mong đợi
- [ ] Ghi `{"all":[X,"FPT"]}` — không có VNM.
- [ ] Sau khi lưu, VNM rời khu ghim, đứng đầu danh sách thường.

---

# [TC_BGGHIM_15] Mỗi sàn một khoá ghim

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ có `{"all":["FPT"],"VN30":["MBB"]}`. Chọn sàn HOSE (khu ghim trống), mở cột, ghim một mã (X).

## Kết quả mong đợi
- [ ] Ghi `{"all":["FPT"],"VN30":["MBB"],"HOSE":[X]}` — các khoá khác giữ nguyên.

---

# [TC_BGGHIM_16] Mã ghim không có trên sàn đang xem không bị xoá khỏi máy chủ

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `setPinnedLocal` so sánh danh sách ghim cũ ĐÃ lọc theo các mã đang có trong bảng — chỉ mở bảng thì không
  coi là "đã đổi".

## Các bước thực hiện
1. Máy chủ có `{"all":["FPT","ZZZ9"]}` (ZZZ9 không phải mã đang giao dịch). Mở bảng, chờ 3 giây.
2. Mở cột, ghim một mã (X).

## Kết quả mong đợi
- [ ] Bước 1: khu ghim chỉ hiện FPT; không có lần ghi khoá ghim nào.
- [ ] Bước 2: ghi `{"all":[X,"FPT","ZZZ9"]}` — ZZZ9 vẫn còn.

---

## Nhóm: Lưu lỗi & đồng bộ khi tab hiện lại

# [TC_BGGHIM_17] Không đọc được bản máy chủ → không ghi mù; lưu lại khi tab hiện lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ có ghim FPT; lượt đọc `keys=price_board_obj_pinned` trả 500. Ghim một mã (X).
2. Máy chủ trở lại bình thường; tab trình duyệt hiện lại (`visibilitychange`).

## Kết quả mong đợi
- [ ] Bước 1: có 1 lượt đọc lỗi, KHÔNG có lượt ghi nào; trên web khu ghim vẫn là X, FPT; không lỗi JS.
- [ ] Bước 2: web lưu lại, ghi `{"all":[X,"FPT"]}`.

---

# [TC_BGGHIM_18] Ghi lỗi (500 / mất mạng) → giữ thao tác, ghi lại khi tab hiện lại

- **Trạng thái:** 🆕 Testcase mới (chạy 2 biến thể: máy chủ 500, mất mạng)

## Các bước thực hiện
1. Máy chủ có ghim FPT; lượt ghi lỗi. Ghim một mã (X).
2. Máy chủ trở lại bình thường; tab hiện lại.

## Kết quả mong đợi
- [ ] Bước 1: 1 lượt ghi thất bại, máy chủ vẫn `{"all":["FPT"]}`, web vẫn hiện X, FPT.
- [ ] Bước 2: web ghi lại `{"all":[X,"FPT"]}` thành công.

---

# [TC_BGGHIM_19] Tab hiện lại → đọc lại mã ghim từ máy chủ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Web mở với ghim FPT, VNM. Trên máy chủ, app đổi thành FPT, HPG.
2. Tab trình duyệt hiện lại.

## Kết quả mong đợi
- [ ] 1 lượt đọc; khu ghim thành FPT, HPG; VNM đứng đầu danh sách thường; localStorage cập nhật.
- [ ] Không ghi gì.

---

# [TC_BGGHIM_20] Điều hướng trong app quay lại Bảng giá → đọc lại mã ghim

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở bảng giá (ghim FPT), bấm menu "Watchlist"; trong lúc đó app ghim thêm HPG trên máy chủ.
2. Bấm menu "Thị Trường" quay lại bảng giá.

## Kết quả mong đợi
- [ ] Web đọc lại `price_board_obj_pinned`; khu ghim hiện FPT, HPG.

---

## Nhóm: Tài khoản Free

# [TC_BGGHIM_21] Free — mở cột, ghim và lưu như tài khoản trả phí

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập `FREE_USER_*`, mở bảng giá, mở cột, ghim mã đầu bảng.

## Kết quả mong đợi
- [ ] Có mũi tên (đang thu); ghim được; lưu `{"all":[X]}` như tài khoản trả phí.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| ✅ Áp dụng | 0 |
| 🆕 Testcase mới | 21 |
| ⚠️ Cần xác nhận thêm | 0 |
| **Tổng** | **21** (22 test — TC_18 chạy 2 biến thể) |

Kết quả chạy 10/11/2026 trên kfsp.vn: 22/22 pass, không có `test.fixme`.

## Phát hiện đáng chú ý

1. **Bộ cũ TC_BANGGIA_36 lỗi thời trên preprod:** nút ghim mặc định bị ẩn (cột thu gọn), test cũ bấm thẳng icon ghim sẽ
   không tìm thấy — cần thêm bước mở cột (bấm mũi tên ở ô "Mã") khi cập nhật bộ [bang-gia.md](bang-gia.md).
2. **Tải trang đầy đủ (F5) không gọi `refreshPinnedFromCloud`** dù code có gọi sau khi nạp danh sách watchlist — mã ghim
   lúc đó đã lấy từ lượt tải toàn bộ setting nên không sai dữ liệu; điều hướng trong app (TC_20) thì có đọc lại đúng.
   Chỉ ghi nhận, không phải bug.
3. Mọi request bị lỗi mạng (ở đây là các lượt `/updateusersettings` test huỷ) làm console báo
   `TypeError: Cannot read properties of undefined (reading 'status')` — interceptor axios dùng chung trong
   `src/App.vue` (`let status_code = error.response.status`) không kiểm tra `error.response` khi không có phản hồi.
   Người dùng chỉ gặp khi mất mạng; ngoài phạm vi tính năng ghim.
