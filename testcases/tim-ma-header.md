# Màn hình: Ô "Tìm mã chứng khoán" trên header (tính năng mới)

- **Phạm vi:** ô tìm mã ở cụm nút bên phải header (mọi trang sau đăng nhập): gõ mã/tên công ty, hộp gợi ý tối đa 5 dòng
  kèm giá, phím ↑/↓/Enter/Esc, chọn mã → **modal biểu đồ nhanh** dùng chung của web, ô trống → "Mã gần đây". Nội dung bên
  trong modal (biểu đồ, cảnh báo giá, panel thông tin) thuộc các bộ khác — ở đây chỉ kiểm tra modal mở đúng mã.
- **Môi trường test:** https://kfsp.vn (`PREV2_BASE_URL` trong `.env`) — production đang chạy code `origin/preprod` mới
  nhất (deploy 06/11/2026). Tài khoản `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí), đăng nhập qua `Prev2Session`.
- **Component:** nhánh `origin/preprod` của `stocks`: `src/containers/TheHeaderSearchStock.vue` (commit 03/11 "Header: thêm
  ô tìm mã chứng khoán", 04/11 "chọn mã ở ô tìm kiếm thì mở popup đồ thị thay vì sang phân tích cơ bản"), `timMaCoPhieu`,
  `boDauTiengViet`, `layGiaLive`, `moDoThiMa` trong `src/function_global.js`, modal `isShowModalTradingChart` trong
  `src/containers/TheContainer.vue`.
- **Code test:** [tests/tim-ma-header.spec.ts](../tests/tim-ma-header.spec.ts), Page Object
  [pages/HeaderSearchPage.ts](../pages/HeaderSearchPage.ts). Chạy: `npx playwright test tests/tim-ma-header.spec.ts
  --project=chromium --workers=2` (~3 phút).
- **Phương pháp sinh:** tính năng chỉ web có (app không có tab tương ứng) — kiểm kê độc lập trên source preprod + đo bằng
  Playwright trên kfsp.vn.
- **Quy ước trạng thái:** 🆕 Testcase mới (chỉ web có, đã tự động hoá) · ⚠️ Cần xác nhận thêm (test ghi lại hành vi đo
  được, cần PO/dev xác nhận).

**AN TOÀN DỮ LIỆU:** ô tìm mã không gọi API ghi nào — "Mã gần đây" chỉ lưu ở localStorage `kfsp_header_search_recent` của
trình duyệt. Mở modal biểu đồ thì app tự `POST /api/activitylog/create` (nhật ký "đổi mã") — `HeaderSearchPage` trả thành
công giả, không gửi đi. Lưới an toàn huỷ mọi request không phải GET khác tới `*.kfsp.vn/api/`; `afterEach` kiểm tra không có
lệnh nào bị huỷ. Ghi setting / lựa chọn Dashboard do `Prev2Session` chặn/giả lập.

---

## Nhóm: Hiển thị ô tìm mã

# [TC_TIMMA_01] Ô "Tìm mã chứng khoán" có kính lúp, đứng đầu cụm nút bên phải header, có ở mọi trang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí, vào `/dashboard`.
2. Quan sát cụm nút bên phải header.
3. Lần lượt vào `/phan-tich-co-ban`, `/phan-tich-ky-thuat`.

## Kết quả mong đợi
- [ ] Ô nhập placeholder + `aria-label` "Tìm mã chứng khoán", tắt tự điền (`autocomplete=off`), trống, có kính lúp bên phải.
- [ ] Ô là phần tử đầu tiên của cụm nút bên phải (trước nút đổi giao diện, chuông, tài khoản).
- [ ] Ô có ở cả 3 trang.

# [TC_TIMMA_02] Chưa có mã gần đây → bấm vào ô trống không mở hộp gợi ý

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Xoá localStorage `kfsp_header_search_recent`, mở trang.
2. Bấm vào ô tìm mã.

## Kết quả mong đợi
- [ ] Ô nhận focus.
- [ ] Không có hộp gợi ý nào hiện ra.

# [TC_TIMMA_03] Bấm kính lúp → focus vào ô; ↓ khi hộp đang đóng → mở lại hộp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có sẵn mã gần đây (VNM, FPT).
2. Bấm kính lúp.
3. Nhấn Esc, rồi nhấn ↓.

## Kết quả mong đợi
- [ ] Bấm kính lúp: ô nhận focus, hộp "Mã gần đây" mở.
- [ ] Esc đóng hộp; ↓ mở lại hộp với tiêu đề "Mã gần đây".

## Nhóm: Tìm kiếm

# [TC_TIMMA_04] Gõ 1 ký tự → chỉ dò theo mã, tối đa 5 dòng; mỗi dòng có mã, sàn, tên công ty

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `f`.

## Kết quả mong đợi
- [ ] Hiện đúng 5 dòng, mọi mã đều chứa chữ F (1 ký tự không dò theo tên công ty).
- [ ] Mỗi dòng: mã + nhãn sàn (HOSE/HNX/UPCOM) + tên công ty.
- [ ] Không có tiêu đề "Mã gần đây".

# [TC_TIMMA_05] Không phân biệt hoa thường; mã trùng hẳn đứng đầu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `vnm`, ghi lại danh sách.
2. Gõ `VNM`.

## Kết quả mong đợi
- [ ] Dòng đầu là VNM.
- [ ] Hai lần gõ ra cùng một danh sách.

# [TC_TIMMA_06] Khớp mã xếp trước khớp tên — "fpt": FPT đầu, các dòng sau khớp theo tên

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `fpt`.

## Kết quả mong đợi
- [ ] Dòng đầu là FPT, đủ 5 dòng.
- [ ] Các dòng sau mà mã không chứa "FPT" thì tên công ty chứa "FPT" (vd FOC — Dịch vụ Trực tuyến FPT).

# [TC_TIMMA_07] Tìm theo tên công ty, gõ không dấu hay có dấu đều ra cùng kết quả

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `hoa phat`, ghi lại danh sách.
2. Gõ `Hòa Phát`.

## Kết quả mong đợi
- [ ] Có HPG, tên "CTCP Tập đoàn Hòa Phát".
- [ ] Hai lần gõ ra cùng một danh sách (`boDauTiengViet`).

# [TC_TIMMA_08] Chữ "đ": "dau khi" và "dầu khí" ra cùng kết quả

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `dầu khí`, ghi lại danh sách.
2. Gõ `dau khi`.

## Kết quả mong đợi
- [ ] Có kết quả, dòng đầu có chữ "Dầu khí" trong tên.
- [ ] Hai danh sách giống nhau ("đ" được đổi tay thành "d").

# [TC_TIMMA_09] Khoảng trắng hai đầu bị bỏ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `  hpg  `.

## Kết quả mong đợi
- [ ] Dòng đầu là HPG.

# [TC_TIMMA_10] Không khớp mã nào → "Không tìm thấy mã phù hợp"; Enter không làm gì

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `qqqqq`.
2. Nhấn Enter.

## Kết quả mong đợi
- [ ] Hộp hiện "Không tìm thấy mã phù hợp", không có dòng mã.
- [ ] Enter không mở modal, chữ trong ô giữ nguyên.

# [TC_TIMMA_11] Chỉ gõ khoảng trắng → không mở hộp gợi ý

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Không có mã gần đây. Gõ 3 dấu cách.

## Kết quả mong đợi
- [ ] Không có hộp gợi ý.

# [TC_TIMMA_12] Mỗi dòng có giá: giá 2 số lẻ, thay đổi mang dấu khớp màu tăng/giảm

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `fpt`, chờ giá về (socket `getlive`).

## Kết quả mong đợi
- [ ] Giá dạng `52.20` (nghìn đồng, 2 số lẻ).
- [ ] Thay đổi dạng `+1.20 / +2.35%`.
- [ ] Màu tăng/trần (`text-upchange`/`text-ceilchange`) đi với dấu `+`, giảm/sàn đi với dấu `-`, đứng giá là `0.00 / 0.00%`.
- [ ] Mã chưa có giá (giá 0) thì không hiện phần giá.

## Nhóm: Bàn phím và chuột

# [TC_TIMMA_13] Dòng đầu sáng sẵn; ↓ chuyển xuống, ↑ ở dòng đầu vòng xuống dòng cuối

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `vn` (5 dòng).
2. ↓ ↓, rồi ↑ ↑ ↑, rồi ↓.

## Kết quả mong đợi
- [ ] Ban đầu dòng 1 sáng.
- [ ] Sau ↓ ↓: dòng 3 sáng.
- [ ] Sau ↑ ↑ ↑: vòng về dòng 5.
- [ ] ↓ ở dòng cuối: vòng lên dòng 1.

# [TC_TIMMA_14] Di chuột lên dòng → dòng đó sáng; Enter chọn đúng dòng đang sáng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `fpt`, rê chuột lên dòng 4.
2. Nhấn Enter.

## Kết quả mong đợi
- [ ] Dòng 4 sáng.
- [ ] Modal biểu đồ mở với mã của dòng 4.

# [TC_TIMMA_15] Esc → xoá chữ và đóng hộp, ô vẫn giữ focus

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `hpg`, nhấn Esc.

## Kết quả mong đợi
- [ ] Ô trống, hộp đóng, ô vẫn focus.

# [TC_TIMMA_16] Rời ô → hộp đóng nhưng chữ còn; bấm lại → hộp mở lại kết quả cũ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `ssi`, ghi lại danh sách.
2. Nhấn Tab để rời ô.
3. Bấm lại vào ô.

## Kết quả mong đợi
- [ ] Rời ô: hộp đóng, ô vẫn còn chữ `ssi`.
- [ ] Bấm lại: hộp mở với đúng danh sách cũ.

# [TC_TIMMA_17] Đang ở dòng dưới mà gõ tiếp → dòng sáng quay về dòng đầu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `vn`, nhấn ↓ ↓.
2. Gõ thêm `m`.

## Kết quả mong đợi
- [ ] Danh sách mới có VNM, dòng sáng là dòng đầu.

## Nhóm: Chọn mã → modal biểu đồ nhanh

# [TC_TIMMA_18] Enter → modal biểu đồ của mã; ô xoá chữ, đóng hộp, mất focus; không đổi trang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở `/dashboard`, gõ `hpg`, nhấn Enter.

## Kết quả mong đợi
- [ ] Mở modal: tiêu đề "HPG", nút "Watchlist" + "Thêm giao dịch", biểu đồ TradingView đang mở HPG, panel phải "CTCP Tập đoàn Hòa Phát" + "HOSE: HPG".
- [ ] Ô tìm mã trống, mất focus, hộp gợi ý đóng.
- [ ] Vẫn ở `/dashboard` (khác bản đầu 03/11: chọn mã sang Phân tích cơ bản).

# [TC_TIMMA_19] Bấm chuột vào một dòng (không phải dòng đầu) → modal của đúng mã đó

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `fpt`, bấm dòng 2.

## Kết quả mong đợi
- [ ] Modal mở với mã của dòng 2, biểu đồ cùng mã.

# [TC_TIMMA_20] Chọn mã khi đang ở trang Biểu đồ → vẫn ở trang Biểu đồ, modal mở đè lên

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở `/phan-tich-ky-thuat`, gõ `mbb`, Enter.

## Kết quả mong đợi
- [ ] Modal MBB mở, URL vẫn `/phan-tich-ky-thuat`.

# [TC_TIMMA_21] Đóng modal bằng × hoặc bấm ra nền; Esc không đóng modal

- **Trạng thái:** ⚠️ Cần xác nhận thêm

## Các bước thực hiện
1. Mở modal VNM, nhấn Esc.
2. Bấm ×.
3. Mở modal SSI, bấm vào nền tối ngoài khung.

## Kết quả mong đợi
- [ ] Esc: modal **vẫn mở** (CModal của CoreUI không xử lý Esc) — cần PO xác nhận có cần đóng bằng Esc không.
- [ ] × đóng modal.
- [ ] Bấm nền đóng modal.

## Nhóm: Mã gần đây

# [TC_TIMMA_22] Chọn mã → lưu vào "Mã gần đây"; bấm ô trống hiện mã đó kèm tên + giá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chưa có mã gần đây. Tìm và chọn VNM, đóng modal.
2. Bấm vào ô trống.

## Kết quả mong đợi
- [ ] localStorage `kfsp_header_search_recent` = `["VNM"]`.
- [ ] Hộp có tiêu đề "Mã gần đây", 1 dòng VNM, tên "CTCP Sữa Việt Nam", có giá.

# [TC_TIMMA_23] Chọn lại mã đã có → lên đầu, không lặp; giữ tối đa 5 mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mã gần đây: VNM, FPT, HPG, MBB, SSI.
2. Chọn HPG; rồi chọn VIC.
3. Bấm ô trống.

## Kết quả mong đợi
- [ ] Sau HPG: HPG, VNM, FPT, MBB, SSI.
- [ ] Sau VIC: VIC, HPG, VNM, FPT, MBB (SSI cũ nhất bị bỏ).
- [ ] Hộp hiện đúng 5 mã theo thứ tự đó.

# [TC_TIMMA_24] Mã gần đây không còn tồn tại bị ẩn, nhưng hộp hiện ít hơn 5 mã

- **Trạng thái:** ⚠️ Cần xác nhận thêm

## Các bước thực hiện
1. localStorage có 7 mã: VNM, FPT, XXXX (không tồn tại), HPG, MBB, SSI, VIC.
2. Bấm ô trống.

## Kết quả mong đợi
- [ ] Đo được: hiện VNM, FPT, HPG, MBB (4 mã) — `created()` cắt còn 5 phần tử trước, rồi mới lọc mã không có trong danh sách công ty, nên SSI hợp lệ không được bù vào. Cần dev xác nhận.

# [TC_TIMMA_25] Dữ liệu "Mã gần đây" hỏng / không phải mảng / lẫn phần tử lạ → không lỗi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Lần lượt đặt localStorage: `{hỏng`, `{"a":1}`, `[1, null, "FPT", {"x":1}, "VNM"]`.
2. Mở trang, bấm ô trống.

## Kết quả mong đợi
- [ ] 2 trường hợp đầu: không có hộp gợi ý, không lỗi JS.
- [ ] Trường hợp 3: chỉ hiện FPT, VNM.

## Nhóm: Phân quyền và màn hình

# [TC_TIMMA_26] Tài khoản Free — tìm và mở modal được; modal không có "Watchlist" và "Thêm giao dịch"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập `FREE_USER_*`, tìm FPT, Enter.

## Kết quả mong đợi
- [ ] Modal FPT mở.
- [ ] Không có nút "Watchlist" và "Thêm giao dịch" (`v-if !isAccountFree`).

# [TC_TIMMA_27] Cửa sổ ≤ 1140px ẩn ô tìm mã; độ rộng ô co giãn 200–300px

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đổi cửa sổ lần lượt 1600, 1920, 1141, 1140px.

## Kết quả mong đợi
- [ ] 1600px: ô rộng 272px (17vw).
- [ ] 1920px: 300px (tối đa).
- [ ] 1141px: 200px (tối thiểu), vẫn hiện.
- [ ] 1140px: ô ẩn (`.d-1130-down-none`).

# [TC_TIMMA_28] Hộp gợi ý ngay dưới ô, rộng bằng ô; tên dài xuống dòng, không bị cắt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ `ngan hang`.

## Kết quả mong đợi
- [ ] Hộp rộng đúng bằng ô, cách mép dưới ô dưới 12px.
- [ ] Tên công ty dài xuống dòng, không bị cắt "…".

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 26 |
| ⚠️ Cần xác nhận thêm | 2 (TC_21, TC_24) |
| **Tổng** | **28** |

Cả 28 case chạy tự động, pass trên kfsp.vn ngày 10/11/2026, không có `test.fixme`.

## Phát hiện đáng chú ý

1. **⚠️ Phím Esc không đóng modal biểu đồ nhanh** (TC_21) — chỉ đóng được bằng × hoặc bấm ra nền (CModal của CoreUI không
   xử lý Esc; cùng hiện tượng ở cửa sổ báo cáo màn Thông tin & Sự kiện, TC_TTSK_46).
2. **⚠️ "Mã gần đây" hiện thiếu mã** (TC_24) — danh sách đọc từ localStorage bị cắt còn 5 phần tử **trước** khi lọc mã không
   còn tồn tại, nên có mã không hợp lệ thì hộp hiện ít hơn 5 dù còn mã hợp lệ phía sau.
3. Gõ 1 ký tự chỉ dò theo mã; từ 2 ký tự mới dò thêm tên công ty (cố ý, tránh gần như tên nào cũng khớp).
4. Khác bản đầu (03/11): chọn mã không còn chuyển sang Phân tích cơ bản mà mở modal biểu đồ ngay trên trang đang đứng.
