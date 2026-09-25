# Màn hình: Nhật ký giao dịch — Khung/Shell (4 tab)

- **URL:** `/nhat-ky-giao-dich` (route con của `/`, yêu cầu đăng nhập — `meta.requiresUser: true`, xác nhận qua
  `stocks/src/router/index.js` dòng ~876).
- **Component:** [src/views/tradingLog/index.vue](../../stocks/src/views/tradingLog/index.vue) (`name: "TradingLog"`)
  — dùng `<CTabs>` (CoreUI) với 4 `<CTab>`: "Tài sản" · "Nhật ký giao dịch" · "Quản lý danh mục" · "Phân bổ vốn".
- **Domain test:** https://kfsp.vn/nhat-ky-giao-dich
- **Nguồn testcase gốc (app):** Google Sheet, tab **"Nhật Kí giao dịch"** (144 dòng). App (mobile) có cấu trúc
  tương tự nhưng **thứ tự 4 tab khác web**: app là "Tài sản → Nhật ký GD → Phân bổ vốn → Danh mục" (TC 1, 5-9
  trong Sheet), còn web là "Tài sản → Nhật ký giao dịch → Quản lý danh mục → Phân bổ vốn" (đọc trực tiếp từ
  `<CTab>` trong `index.vue`, đã xác nhận qua DOM thật). Phần overview/chuyển tab trong Sheet chỉ dùng để tham
  khảo văn phong — độ phủ testcase khung/shell dưới đây do tự kiểm kê source code + DOM thật quyết định.
- **Phạm vi:** Tài liệu này CHỈ kiểm thử **khung/shell** của trang (layout tổng thể, 4 tab chính, hành vi chuyển
  tab, deep-link, F5/back, giới hạn theo gói hội viên ở cấp tab). Nội dung **bên trong** từng tab có tài liệu
  riêng:
  - [nhat-ky-giao-dich-tai-san.md](nhat-ky-giao-dich-tai-san.md) — tab "Tài sản".
  - [nhat-ky-giao-dich-nhat-ky.md](nhat-ky-giao-dich-nhat-ky.md) — tab "Nhật ký giao dịch" (bảng lịch sử GD +
    toàn bộ modal Thêm/Sửa/Xem/Xóa giao dịch, modal cổ tức, modal chọn tags).
  - [nhat-ky-giao-dich-danh-muc.md](nhat-ky-giao-dich-danh-muc.md) — tab "Quản lý danh mục".
  - [nhat-ky-giao-dich-phan-bo-von.md](nhat-ky-giao-dich-phan-bo-von.md) — tab "Phân bổ vốn".
- **Phương pháp sinh:** Đọc source code (`index.vue` toàn bộ 3553 dòng — template + script: `data()`, `computed`,
  `watch`, `mounted()`) + kiểm thử trực tiếp trên môi trường thật bằng Playwright (chuyển tab, deep-link qua
  query, F5, xóa `localStorage` để test redirect khi chưa đăng nhập).
- **⚠️ An toàn dữ liệu:** Tài khoản test hiện có **dữ liệu giao dịch thật** (~50+ tỷ đồng giá trị danh mục, hàng
  chục danh mục, hàng trăm giao dịch thật) — mọi API mutate (POST/PUT/DELETE tạo/sửa/xóa giao dịch, danh mục,
  cổ tức, phân bổ vốn) trong spec đều bị `page.route()` chặn/mock mặc định, không có ngoại lệ nào ở tài liệu
  khung này (không cần thao tác mutate để test shell).
- **Quy ước trạng thái:**
  - ✅ Áp dụng — testcase adapt từ app, có thể/đã tự động hoá bằng Playwright.
  - 🆕 Testcase mới — phát sinh riêng cho web, app không có (hoặc khác kiến trúc không map được).
  - ⚠️ Cần xác nhận thêm — chưa đủ điều kiện kiểm chứng thực tế (VD cần tài khoản gói Free/thiếu quyền).

---

## Nhóm: Truy cập & Tổng quan

# [TC_NKGD_01] Overview màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC 1 (Sheet "Nhật Kí giao dịch")
- **Khác biệt so với app:** App có icon back + title "Nhật ký giao dịch" căn giữa header riêng của màn hình
  (kiến trúc mobile). Web dùng chung header/menu ngang toàn site (không có icon back riêng, không có title
  page riêng) — chỉ verify đúng phần nội dung đặc thù của trang.

## Các bước thực hiện
1. Đăng nhập thành công, điều hướng tới `/nhat-ky-giao-dich`.

## Kết quả mong đợi
- [ ] Hiển thị đủ 4 tab chính theo đúng thứ tự: "Tài sản", "Nhật ký giao dịch", "Quản lý danh mục", "Phân bổ
      vốn".
- [ ] Tab "Tài sản" active mặc định (`active_tab = 0`), hiển thị đúng nội dung tab Tài sản.
- [ ] Không tràn/vỡ layout ở viewport desktop chuẩn (1280x800+).

---

# [TC_NKGD_02] Chặn truy cập khi chưa đăng nhập

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Xóa `localStorage`/cookie phiên đăng nhập rồi truy cập thẳng `/nhat-ky-giao-dich` → router
  guard (`meta.requiresUser`) redirect sang `/login` (kèm `redirect` query), không render nội dung trang.

## Các bước thực hiện
1. Đảm bảo chưa đăng nhập.
2. Truy cập trực tiếp URL `/nhat-ky-giao-dich`.

## Kết quả mong đợi
- [ ] Tự động chuyển hướng sang `/login`, không hiển thị nội dung trang Nhật ký giao dịch.

---

## Nhóm: Chuyển tab chính

# [TC_NKGD_03] Chuyển qua lại 4 tab chính

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 6-9 (Sheet)
- **Kết quả đo được:** Click lần lượt "Nhật ký giao dịch" → "Quản lý danh mục" → "Phân bổ vốn" → "Tài sản":
  mỗi lần click, tab được chọn chuyển active (`clickTab` set `active_tab` đúng index 0-3), nội dung tương ứng
  hiển thị đúng, các tab khác không active. Component tab cũ bị unmount hoàn toàn (`v-else-if`, không phải
  `v-show`) — chuyển tab reset lại toàn bộ state cục bộ của tab đó (VD filter/sort đang áp dụng).

## Các bước thực hiện
1. Từ tab "Tài sản" mặc định, click lần lượt "Nhật ký giao dịch", "Quản lý danh mục", "Phân bổ vốn", rồi quay
   lại "Tài sản".

## Kết quả mong đợi
- [ ] Mỗi lần click, đúng 1 tab active, nội dung đổi đúng loại dữ liệu tương ứng.
- [ ] Không có lỗi console/crash khi chuyển tab liên tục.

---

# [TC_NKGD_04] Click tab nhanh liên tục không lag/duplicate

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC 10 (Sheet)

## Các bước thực hiện
1. Click nhanh qua lại 4 tab nhiều lần liên tiếp (không chờ animation).

## Kết quả mong đợi
- [ ] Tab cuối cùng được click hiển thị đúng nội dung, không bị kẹt ở trạng thái loading/nội dung tab cũ,
      không có request API bị gọi trùng lặp bất thường.

---

# [TC_NKGD_05] Deep-link `?tab=nhat-ky-giao-dich` mở thẳng tab "Nhật ký giao dịch"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Truy cập thẳng `/nhat-ky-giao-dich?tab=nhat-ky-giao-dich` → `mounted()` đọc
  `this.$route.query.tab === 'nhat-ky-giao-dich'` và set `active_tab = 1` ngay khi trang tải xong, tab "Nhật ký
  giao dịch" active mặc định thay vì "Tài sản". Đây là cơ chế duy nhất để các trang khác (VD panel Ghi chú ở
  Dashboard) trỏ thẳng vào đúng tab này.
- **Ghi chú:** Chỉ đúng giá trị `nhat-ky-giao-dich` được xử lý — không có query tương ứng cho 3 tab còn lại
  (đọc từ code, `mounted()` chỉ có 1 nhánh `if` duy nhất).

## Các bước thực hiện
1. Truy cập thẳng URL `/nhat-ky-giao-dich?tab=nhat-ky-giao-dich` (đã đăng nhập).

## Kết quả mong đợi
- [ ] Tab "Nhật ký giao dịch" active ngay từ đầu, không phải "Tài sản".

---

# [TC_NKGD_06] Chuyển tab KHÔNG cập nhật URL — F5 luôn quay về tab mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý**
- **⚠️ Phát hiện đáng chú ý:** `clickTab()` chỉ set `this.active_tab` (data cục bộ), KHÔNG gọi `router.push`/cập
  nhật query string. Do đó: (1) URL luôn giữ nguyên `/nhat-ky-giao-dich` dù đang ở tab nào; (2) nếu người dùng
  đang xem tab "Quản lý danh mục" (hoặc bất kỳ tab nào khác "Tài sản") rồi F5 reload, trang **luôn quay về tab
  mặc định "Tài sản"** — trừ trường hợp đã vào bằng URL có sẵn `?tab=nhat-ky-giao-dich` (TC_NKGD_05) thì F5 vẫn
  giữ được tab "Nhật ký giao dịch" vì query đó nằm trong URL. Đây là hành vi thật của code (không phải bug), cần
  ghi nhận rõ vì có thể gây khó chịu cho người dùng khi F5 giữa lúc đang thao tác ở tab Quản lý danh mục/Phân bổ
  vốn.

## Các bước thực hiện
1. Từ tab "Tài sản", click sang tab "Quản lý danh mục".
2. Tải lại trang (F5) mà không đổi URL.

## Kết quả mong đợi
- [ ] Sau F5, trang quay về tab mặc định "Tài sản" (không giữ tab "Quản lý danh mục" đã chọn trước đó), vì URL
      không mang theo thông tin tab đang chọn.

---

# [TC_NKGD_07] Nút Back trình duyệt điều hướng rời khỏi trang

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Vì chuyển tab không đổi URL/lịch sử trình duyệt (xem TC_NKGD_06), nút Back **không** có khái
  niệm "quay lại tab trước" trong phạm vi trang này — nó luôn điều hướng khỏi hẳn `/nhat-ky-giao-dich` về trang
  trước đó trong lịch sử duyệt web.

## Các bước thực hiện
1. Từ trang khác (VD Dashboard), điều hướng sang `/nhat-ky-giao-dich`.
2. Chuyển qua vài tab bất kỳ.
3. Bấm nút Back của trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng trang trước đó (Dashboard), không phải quay lại tab đã xem trước trong cùng trang Nhật ký
      giao dịch.

---

## Nhóm: Giới hạn theo gói hội viên (feature gating theo tab)

# [TC_NKGD_08] Tab "Nhật ký giao dịch" không bị khóa theo gói hội viên (ở cấp tab)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify qua đọc code, xác nhận DOM thật tài khoản hiện có: Pass**
- **Ghi chú:** `computed: featureName()` trong `index.vue` trả về `'nkgd_tai_san'` (tab 0), `null` (tab 1 — Nhật
  ký giao dịch), `'nkgd_quan_ly_danh_muc'` (tab 2), `'nkgd_phan_bo_von'` (tab 3). Vì tab 1 có `featureName =
  null`, `disable_featureName` (`store.state.features_disabled.hasOwnProperty(null)`) luôn `false` → tab "Nhật
  ký giao dịch" ở CẤP TAB CHÍNH không bao giờ bị `<ProtectedView>` che, bất kể gói hội viên. Lưu ý: 2 sub-tab
  BÊN TRONG nó ("Lịch sử giao dịch"/"Thống kê phân tích") lại có feature-flag RIÊNG
  (`nkgd_lich_su_giao_dich`/`nkgd_thong_ke_giao_dich`) — xem
  [nhat-ky-giao-dich-nhat-ky.md](nhat-ky-giao-dich-nhat-ky.md).

## Các bước thực hiện
1. Với tài khoản test hiện có (gói đầy đủ), click tab "Nhật ký giao dịch".

## Kết quả mong đợi
- [ ] Hiển thị đúng nội dung (2 sub-tab Lịch sử GD/Thống kê phân tích), không hiển thị màn hình mờ "Bạn cần
      nâng cấp gói hội viên...".

---

# [TC_NKGD_09] Tab bị khóa theo gói hội viên hiển thị `ProtectedView`

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `ProtectedView.vue` render ảnh nền mờ (`.image-container > .blurred-image`, luôn có trong DOM khi
  bị khóa) + text "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này." (chỉ hiện khi hover, `v-if` theo
  `isButtonVisible`) + nút "Đăng ký ngay" (mở `store.state.isShowModalPackage`). Đã xác nhận thật với tài khoản
  Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD` trong `.env`): CẢ 3 tab "Tài sản"/"Quản lý danh mục"/"Phân bổ
  vốn" đều hiển thị đúng `ProtectedView` khi active.
- **⚠️ Lưu ý kỹ thuật khi tự động hoá (không phải bug):** CoreUI `<CTabs>` giữ CẢ 3 `<CTab>` bị gate (Tài sản/
  Quản lý danh mục/Phân bổ vốn) LUÔN mounted trong DOM cùng lúc (giống pattern `CModal` không unmount đã ghi
  nhận ở nơi khác trong codebase này), và `featureName`/`disable_featureName` là 1 computed DÙNG CHUNG cho cả 3
  `<CTab>` (dựa theo `active_tab` hiện tại) — vì vậy đếm `.blurred-image` KHÔNG lọc `:visible` sẽ đếm nhầm cả
  các pane ẩn (không phải tab đang xem), cho ra số lượng sai (VD đo được 3 thay vì 1 khi đang ở tab bị khóa).
  Phải lọc `:visible` để chỉ đếm đúng pane đang active. Về mặt hành vi NGƯỜI DÙNG THẤY thì không có vấn đề gì
  (vì `featureName` luôn khớp đúng tab đang active tại bất kỳ thời điểm nào).

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`).
2. Click lần lượt 3 tab Tài sản, Quản lý danh mục, Phân bổ vốn.

## Kết quả mong đợi
- [ ] Mỗi tab bị khóa hiển thị đúng 1 `ProtectedView` (`.blurred-image` visible) khi đang active — xác nhận
      đúng cho cả 3 tab với tài khoản Free hiện tại.
- [ ] Tab "Nhật ký giao dịch" (TC_NKGD_08) vẫn dùng được bình thường dù 3 tab kia bị khóa (kiểm chứng gián tiếp
      qua TC_NKGD_LS_03 — 2 sub-tab bên trong lại có gate RIÊNG, không liên quan tới gate cấp tab chính này).

---

## Nhóm: Responsive

# [TC_NKGD_10] Responsive viewport mobile/tablet

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024), quan sát 4 tab chính + nội dung tab "Tài sản"
   mặc định.

## Kết quả mong đợi
- [ ] 4 tab vẫn hiển thị đầy đủ (có thể cuộn ngang thanh tab nếu không đủ chỗ), không vỡ layout nghiêm trọng.
- [ ] Nội dung tab cuộn dọc được, không bị cắt mất thông tin quan trọng.

---

## Tổng hợp trạng thái (10 testcase — chỉ phạm vi khung/shell)

Đã tự động hoá bằng Playwright: [tests/nhat-ky-giao-dich.spec.ts](../tests/nhat-ky-giao-dich.spec.ts)
(POM dùng chung: [pages/TradingLogPage.ts](../pages/TradingLogPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 3 | TC_NKGD_01, 03, 04 |
| 🆕 Mới (riêng web) | 7 | TC_NKGD_02, 05, 06, 07, 08, 09, 10 |
| ⚠️ Cần xác nhận thêm | 0 | |

**Phát hiện đáng chú ý cần theo dõi:**
1. **Chuyển tab không cập nhật URL** — F5 giữa lúc đang ở tab "Nhật ký giao dịch"/"Quản lý danh mục"/"Phân bổ
   vốn" sẽ mất tab đang xem, quay về "Tài sản" (trừ khi vào bằng deep-link `?tab=nhat-ky-giao-dich`). Có thể cân
   nhắc đề xuất dev đồng bộ query string khi đổi tab để trải nghiệm nhất quán hơn (không phải lỗi chức năng,
   chỉ là hạn chế UX).
2. Route được bảo vệ đúng bởi router guard `requiresUser`.
3. Feature-gating hoạt động ở NHIỀU CẤP khác nhau trong cùng 1 trang: cấp tab chính (Tài sản/Quản lý danh mục/
   Phân bổ vốn) VÀ cấp sub-tab bên trong tab Nhật ký giao dịch (Lịch sử GD/Thống kê phân tích) — xem chi tiết ở
   tài liệu con. Đã xác nhận thật với tài khoản Free: cả 2 cấp đều hoạt động đúng (TC_NKGD_09, TC_NKGD_LS_03).
4. **CoreUI `<CTabs>` giữ cả 3 `<CTab>` bị gate luôn mounted đồng thời** (không unmount khi không active), dùng
   chung 1 computed `featureName`/`disable_featureName` — vô hại về hành vi người dùng thấy, nhưng cần lọc
   `:visible` khi tự động hoá đếm phần tử `ProtectedView`, nếu không sẽ đếm sai (xem TC_NKGD_09).

**Ngoài phạm vi lần sinh này:** nội dung chi tiết bên trong từng tab — xem 4 tài liệu con đã liệt kê ở đầu file.
