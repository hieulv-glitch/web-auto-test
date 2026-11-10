# Màn hình: Nhật ký giao dịch — Khung/Shell (5 tab)

- **URL:** `/nhat-ky-giao-dich` (route con của `/`, `meta.requiresUser: true`).
- **Component:** `stocks/src/views/tradingLog/index.vue` (`name: "TradingLog"`) — `<CTabs>` (CoreUI) với **5** `<CTab>`:
  "Tài sản" · "Giao dịch" · "Phân tích giao dịch" · "Phân bổ vốn" · "Danh mục".
- **Môi trường test:** https://kfsp.vn (production — đã ngang preprod mới nhất, deploy 06/11/2026 10:30 GMT; spec đọc `PREV2_BASE_URL` trong .env, hiện trỏ kfsp.vn), đăng nhập qua
  `pages/Prev2Session.ts` (tài khoản `TEST_USER_*` trả phí / `FREE_USER_*` miễn phí).
- **Cập nhật 09/11/2026 — viết lại theo giao diện mới (nhánh B):** màn NKGD được làm lại trên `preprod` (commit
  187608c20 03/11/2026 "đổi giao diện cả năm tab theo bản thiết kế", cùng loạt commit 07/10–05/11). Khác biệt lớn so
  với lần sinh 20/08 (4 tab):
  - 4 tab → **5 tab**: "Nhật ký giao dịch" đổi tên thành **"Giao dịch"**; sub-tab "Thống kê phân tích" tách ra thành
    tab chính **"Phân tích giao dịch"**; "Quản lý danh mục" đổi tên **"Danh mục"** và chuyển xuống cuối.
  - **Tab đang chọn được nhớ** trong localStorage `trading_log_view_state` (`tradingLogViewState.js`, khuôn giống app
    Flutter) → F5/vào lại trang mở đúng tab lần trước. Testcase cũ TC_NKGD_06 ("F5 luôn về Tài sản") không còn đúng,
    đã viết lại.
  - Tài khoản Free: cả **5/5** tab đều bị `ProtectedView` (tab "Giao dịch" khoá ở cấp component con
    `tabTradingHistory.vue`, feature `nkgd_lich_su_giao_dich`).
- **⚠️ An toàn dữ liệu:** Môi trường test gọi **backend production**, tài khoản test có nhật ký giao dịch thật. Spec thay toàn bộ
  API NKGD bằng máy chủ giả trong bộ nhớ (`NkgdFakeServer` trong `pages/TradingLogPage.ts`) + lưới an toàn huỷ MỌI
  request ghi không được giả lập; `afterEach` kiểm tra không request ghi nào lọt ra ngoài. Ghi setting bị
  `Prev2Session` chặn.
- **Tài liệu con:** [tai-san](nhat-ky-giao-dich-tai-san.md) · [giao dịch](nhat-ky-giao-dich-nhat-ky.md) ·
  [phân tích giao dịch](nhat-ky-giao-dich-phan-tich.md) · [phân bổ vốn](nhat-ky-giao-dich-phan-bo-von.md) ·
  [danh mục](nhat-ky-giao-dich-danh-muc.md).
- **Quy ước trạng thái:** ✅ Áp dụng (có từ app) · 🆕 Testcase mới (riêng web) · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Truy cập & Tổng quan

# [TC_NKGD_01] Overview màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC 1 (Sheet "Nhật Kí giao dịch")
- **Cập nhật:** 4 tab → 5 tab, đổi tên/thứ tự (xem đầu file).

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí, chưa từng chọn tab (localStorage không có `trading_log_view_state`), mở `/nhat-ky-giao-dich`.

## Kết quả mong đợi
- [ ] Thanh tab có đúng 5 tab theo thứ tự: "Tài sản", "Giao dịch", "Phân tích giao dịch", "Phân bổ vốn", "Danh mục".
- [ ] Tab "Tài sản" active mặc định, hiện thẻ "Tài sản ròng (NAV)".

---

# [TC_NKGD_02] Chặn truy cập khi chưa đăng nhập

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chưa đăng nhập, mở thẳng `/nhat-ky-giao-dich`.

## Kết quả mong đợi
- [ ] Chuyển sang `/login`, không hiện thanh tab NKGD.

---

## Nhóm: Chuyển tab

# [TC_NKGD_03] Chuyển lần lượt qua 5 tab

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC 6-9 (Sheet)
- **Cập nhật:** 5 tab, mỗi tab nhận diện bằng 1 nội dung đặc trưng mới.

## Các bước thực hiện
1. Từ "Tài sản", bấm lần lượt "Giao dịch" → "Phân tích giao dịch" → "Phân bổ vốn" → "Danh mục" → "Tài sản".

## Kết quả mong đợi
- [ ] Mỗi lần bấm, đúng 1 tab active và nội dung đổi đúng: Giao dịch (nút "Lọc giao dịch"), Phân tích giao dịch (nút
      "Phong cách và rủi ro"), Phân bổ vốn (khối "Thiết lập deal tiếp theo"), Danh mục (nút "Thêm danh mục"), Tài sản
      (thẻ "Tài sản ròng (NAV)").
- [ ] Không có lỗi JS (`pageerror`).

---

# [TC_NKGD_04] Bấm tab nhanh liên tục

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC 10 (Sheet)

## Các bước thực hiện
1. Bấm nhanh liên tiếp qua cả 5 tab 2 vòng, không chờ, dừng ở "Danh mục".

## Kết quả mong đợi
- [ ] Tab "Danh mục" active, hiện đúng nội dung tab Danh mục; không lỗi JS.
- [ ] Dữ liệu nhật ký tải 1 lần ở `index.vue` rồi truyền xuống các tab; chỉ tải lại (`getAll`) khi RỜI tab "Danh mục"
      (`ManageCategory.beforeDestroy` → `handleChangeCategories` → `getDataTradingLog`, để nhận danh mục vừa thêm/sửa)
      — 2 vòng dừng ở "Danh mục" ⇒ đúng 1 lần tải lại.

---

# [TC_NKGD_05] Deep-link `?tab=nhat-ky-giao-dich` mở tab "Giao dịch" và thắng tab đã nhớ

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** tab đích đổi tên thành "Giao dịch"; deep-link THẮNG bản nhớ và ghi đè bản nhớ (`mounted()` gọi
  `clickTab(1)`).

## Các bước thực hiện
1. Đặt sẵn bản nhớ tab = "Danh mục" (`trading_log_view_state = {"active_tab":4}`).
2. Mở `/nhat-ky-giao-dich?tab=nhat-ky-giao-dich`.

## Kết quả mong đợi
- [ ] Tab "Giao dịch" active (không phải "Danh mục").
- [ ] Bản nhớ được ghi lại thành `{"active_tab":1}`.

---

# [TC_NKGD_06] Nhớ tab đang chọn qua F5

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** thay testcase cũ "F5 luôn quay về Tài sản" — giờ tab được nhớ ngay lúc bấm (`saveTradingLogViewState`).

## Các bước thực hiện
1. Từ "Tài sản", bấm tab "Danh mục".
2. Tải lại trang (F5).

## Kết quả mong đợi
- [ ] Ngay sau khi bấm, localStorage `trading_log_view_state` = `{"active_tab":4}`; URL vẫn là `/nhat-ky-giao-dich`
      (không thêm query).
- [ ] Sau F5, tab "Danh mục" active ngay, không chớp qua tab "Tài sản".

---

# [TC_NKGD_07] Nút Back trình duyệt rời khỏi trang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Từ `/dashboard` vào `/nhat-ky-giao-dich`, chuyển qua vài tab.
2. Bấm Back.

## Kết quả mong đợi
- [ ] Quay về `/dashboard` (chuyển tab không tạo mục lịch sử trình duyệt).

---

# [TC_NKGD_08] Bản nhớ tab hỏng/ngoài khoảng → về "Tài sản"

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `mergeOverDefault()` chặn khoảng 0–4 và nuốt JSON hỏng.

## Các bước thực hiện
1. Lần lượt đặt `trading_log_view_state` = `{"active_tab":9}`, rồi = chuỗi không phải JSON, mở trang.

## Kết quả mong đợi
- [ ] Cả 2 trường hợp: tab "Tài sản" active, trang không trắng, không lỗi JS.

---

## Nhóm: Giới hạn theo gói hội viên

# [TC_NKGD_09] Tài khoản Free — cả 5 tab đều bị khoá

- **Trạng thái:** 🆕 Testcase mới
- **Cập nhật:** trước đây tab "Nhật ký giao dịch" không bị khoá ở cấp tab; giờ tab "Giao dịch" bị khoá ở component con
  (`tabTradingHistory.vue`, `nkgd_lich_su_giao_dich`), "Phân tích giao dịch" khoá theo `nkgd_thong_ke_giao_dich`. Đo
  ngày 09/11/2026 với `FREE_USER_*`: 5/5 tab khoá.
- **Ghi chú:** khoá đúng là ảnh mờ `.blurred-image` (ProtectedView) trong pane đang active.

## Các bước thực hiện
1. Đăng nhập Free, mở trang, bấm lần lượt 5 tab.

## Kết quả mong đợi
- [ ] Mỗi tab hiện `.blurred-image` của ProtectedView, không hiện nội dung thật (không có nút "Lọc giao dịch", "Thêm
      danh mục", thẻ NAV…).

---

# [TC_NKGD_10] Tài khoản trả phí — không tab nào bị khoá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập trả phí, bấm lần lượt 5 tab.

## Kết quả mong đợi
- [ ] Không tab nào có `.blurred-image`.

---

## Nhóm: Responsive

# [TC_NKGD_11] Màn hình hẹp 375px và 768px

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở trang ở viewport 375x812 rồi 768x1024.

## Kết quả mong đợi
- [ ] Cả 5 tab vẫn bấm được (thanh tab cuộn ngang nếu thiếu chỗ), trang không cuộn ngang ngoài thanh tab.
- [ ] Thẻ NAV của tab Tài sản hiện đủ số NAV.

---

## Tổng hợp trạng thái (11 testcase — khung/shell)

Tự động hoá: [tests/nhat-ky-giao-dich.spec.ts](../tests/nhat-ky-giao-dich.spec.ts) · POM:
[pages/TradingLogPage.ts](../pages/TradingLogPage.ts).

| Trạng thái | Số lượng | Testcase |
|---|---|---|
| ✅ Áp dụng | 3 | TC_NKGD_01, 03, 04 |
| 🆕 Mới (riêng web) | 8 | TC_NKGD_02, 05–11 |
| ⚠️ Cần xác nhận thêm | 0 | |

**Đối chiếu với bản 20/08:** giữ 01–05, 07 (sửa theo 5 tab); viết lại 06 (nhớ tab); 08–09 cũ gộp/viết lại thành 09–10
(Free khoá cả 5 tab); 10 cũ → 11; thêm mới 08 (bản nhớ hỏng).

**Phát hiện đáng chú ý:**
1. Hành vi nhớ tab đúng thiết kế (deep-link thắng bản nhớ, bản nhớ hỏng được chặn khoảng).
2. Tài khoản Free bị khoá toàn bộ màn NKGD (5/5 tab) — trước đây tab Nhật ký giao dịch vẫn dùng được.
