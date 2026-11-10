# Màn hình: Trung tâm thông báo + Chuông thông báo + Bản tin thị trường (tính năng mới)

- **Phạm vi:**
  - Trang **Trung tâm thông báo** (`/trung-tam-thong-bao`): cột "Cài đặt" với công tắc "Nhận" cho 7 loại; các mục Tất
    cả cài đặt, Cơ hội tiềm năng (phạm vi + công tắc AI Mua/Bán, Mẫu hình), Cảnh báo (tab Cảnh báo theo mã / Cảnh báo
    Bộ lọc), Tin tức & Sự kiện, Cộng đồng; mục **Lịch sử thông báo**.
  - **Chuông thông báo** trên header: badge, 7 chip, các dòng theo loại (gồm tín hiệu AI / mẫu hình), đánh dấu đã đọc,
    xoá, liên kết sang Trung tâm thông báo.
  - **Bản tin thị trường**: popup tờ bản tin khi bấm thông báo "📢 Tổng hợp thị trường dd/mm/yyyy", và hình thu nhỏ
    KFSP AI chào phiên mới.
- **Ngoài phạm vi:** hộp "Tạo cảnh báo cho mã" (form nhiều điều kiện) — xem [canh-bao-theo-ma.md](canh-bao-theo-ma.md);
  cảnh báo giá trên biểu đồ — [canh-bao-gia.md](canh-bao-gia.md). "Tạm dừng tất cả" và "Cảnh báo nguy hiểm" đang bị ẩn
  trong code nên không viết.
- **Môi trường test:** https://prev2.vietpointer.vn — bản build `origin/preprod` mới nhất. ⚠️ prev2 gọi **backend
  production** (`api2.kfsp.vn`) → tài khoản `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí). Spec dùng
  `test.use({ baseURL: PREV2_BASE_URL })`, đăng nhập qua `Prev2Session` (cache `.auth/prev2-session-*.json`).
- **Component** (`origin/preprod` của `stocks`, merge `thanh/price-alert-screens` 16–20/10, `fix/link_thongbao` 19/10,
  `feat/pattern-signals` + `thanh/market-bulletin-popup` 26/10/2026): `src/views/notificationCenter/index.vue`,
  `notificationCenter/NotificationHistory.vue`, `src/utils/notificationHistory.js`, `src/containers/TheHeaderDropdownNotify.vue`,
  `src/views/ItemNotifications.vue`, `src/store.js` (`fetchNotifySettings`, `updateNotifyTypes`, `notify_muted_types`),
  `src/function_global.js` (`moTrungTamThongBao`, các hàm `*BanTin*`), `public/bulletin-preview/market_summary_bulletin.html`,
  `src/containers/TheContainer.vue` + `views/dashboard/chatbot/NewAINews.vue` (hình thu nhỏ). Tài liệu trong repo:
  `TRUNG_TAM_THONG_BAO_BACKEND.md`, `docs/ban-tin-viec-con-lai.md`.
- **Code test:** [tests/trung-tam-thong-bao.spec.ts](../tests/trung-tam-thong-bao.spec.ts), Page Object
  [pages/NotificationCenterPage.ts](../pages/NotificationCenterPage.ts). Chạy:
  `npx playwright test tests/trung-tam-thong-bao.spec.ts --project=chromium --workers=2` (~6 phút).
- **Phương pháp sinh:** tính năng web mới, không đọc Google Sheet (văn phong theo [canh-bao-gia.md](canh-bao-gia.md)).
  Testcase do kiểm kê độc lập trên source preprod + đo bằng Playwright thật trên prev2 (dữ liệu thật của tài khoản chỉ
  dùng để lấy đúng khuôn dữ liệu, test chạy trên dữ liệu giả).
- **Quy ước trạng thái:** 🆕 Testcase mới (chỉ web có, đã tự động hoá) · ⚠️ Cần xác nhận thêm (bug / hành vi nghi vấn —
  test ghi lại hành vi đo được).

**⚠️ AN TOÀN DỮ LIỆU — ĐỌC TRƯỚC KHI SỬA TEST:** mọi API của khu thông báo được thay bằng **máy chủ giả trong bộ nhớ**
(`FakeNotifyServer`), cả đọc lẫn ghi:
- `/api/notification-settings/*` (loại, phạm vi, công tắc), `/api/watchlist/update-receive-signal/:id`
- `/api/stocks/user-alert/*`, `/api/filter/save_filter_group|notification|update-frequency`, `/api/news-event-alerts`
- `/api/stocks/community/muted-posts|update-notify|post/list-social-history|post/social-history`
- `/notification/*` (danh sách, `unread-counts`, `signal`, `signal/read`, `updateReadNotify`, `update-read-news-events-notify`,
  `delete-notifications`), `/api/notifications/updateReadNotify`
- `/api/market-bulletin/:date|latest`, `/api/stock-signals/*`, `/get-content-event`

Mọi lệnh ghi chỉ được ghi lại (`writes`) để assert. Thêm một **lưới an toàn**: request không phải GET tới host ngoài
prev2 mà máy chủ giả không xử lý thì bị chặn, và GET có tác dụng ghi (`updateReadNotify`, `update-read-*`) cũng bị chặn.
Riêng `save-user-dashboard-preference` được trả "thành công" giả để web khỏi bật toast lỗi riêng. Setting người dùng ghi
lên (`/updateusersettings`) bị chặn như mọi spec prev2; setting "Xem gộp theo mã" luôn được ép về `false` khi mở trang (tài
khoản thật đang lưu `true`). Fixture bản tin [tests/fixtures/notification/market-bulletin-2026-11-06.json](../tests/fixtures/notification/market-bulletin-2026-11-06.json)
là payload thật của `GET /api/market-bulletin/latest` ngày 06/11/2026.

---

## Nhóm: Trang Trung tâm thông báo — khung & điều hướng

# [TC_TB_01] Mở thẳng trang — khung, 7 chủ đề, mặc định "Tất cả cài đặt"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí, mở thẳng `/trung-tam-thong-bao`.

## Kết quả mong đợi
- [ ] Tiêu đề "Trung tâm thông báo"; cột trái "Cài đặt", dòng "Chủ đề thông báo" / "Nhận".
- [ ] Thứ tự: Chung, Cơ hội tiềm năng, IBD, BCTC, Cảnh báo, Cộng đồng, Sự kiện, rồi "Tất cả cài đặt", "Lịch sử thông báo".
- [ ] Bánh răng chỉ ở Cơ hội tiềm năng, Cảnh báo, Cộng đồng, Sự kiện (có màn cài đặt riêng).
- [ ] Mục đang mở là "Tất cả cài đặt" (`aria-current`), cột phải "Tất cả cài đặt thông báo".
- [ ] Không có nút "Quay lại" (mở thẳng link thì không có chỗ để về).

# [TC_TB_02] Dẫn sang từ màn khác → có nút Quay lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Vào `/watchlist`, mở chuông, bấm "Cài đặt trung tâm thông báo".
2. Bấm nút "Quay lại".

## Kết quả mong đợi
- [ ] Sang `/trung-tam-thong-bao`, panel chuông đóng, có nút "Quay lại".
- [ ] Bấm "Quay lại" về đúng `/watchlist`.

# [TC_TB_03] Đường dẫn ?view / ?muc / ?tab mở đúng mục

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Lần lượt mở `?view=signal`, `?view=alert`, `?muc=news`, `?muc=Social`, `?muc=all`, `?muc=alert&tab=filter`, `?muc=khong-co`.

## Kết quả mong đợi
- [ ] Mỗi đường dẫn mở đúng mục (Cơ hội tiềm năng, Cảnh báo, Tin tức & Sự kiện, Cộng đồng, Tất cả cài đặt).
- [ ] `?muc=alert&tab=filter` mở tab "Cảnh báo Bộ lọc".
- [ ] `?muc` lạ giữ "Tất cả cài đặt" (không để cột phải trống).

# [TC_TB_04] ?muc=alert&ma=<mã> mở sẵn hộp tạo cảnh báo cho mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `/trung-tam-thong-bao?muc=alert&tab=stock&ma=fpt&tu=phan-tich-co-ban`.
2. Đóng hộp, nhấn F5.

## Kết quả mong đợi
- [ ] Hộp "Tạo cảnh báo cho mã" mở với mã FPT (viết hoa); tab "Cảnh báo theo mã" đang chọn.
- [ ] URL bỏ `ma` và `tu` (còn `?muc=alert&tab=stock`); F5 không bật lại hộp.

# [TC_TB_05] Chung / IBD / BCTC hiện mô tả của loại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm tên "Chung", "IBD", "BCTC" ở cột trái.

## Kết quả mong đợi
- [ ] Chung: "Thông báo chung" — "Gia hạn tài khoản, ưu đãi, thông báo vận hành từ KFSP."
- [ ] IBD: "Thông báo IBD" — "Thông báo bản tin IBD (Investor's Business Daily)".
- [ ] BCTC: "Thông báo BCTC" — "Báo khi doanh nghiệp trong watchlist công bố báo cáo tài chính mới."

---

## Nhóm: Công tắc "Nhận" theo loại

# [TC_TB_06] Công tắc theo setting máy chủ; chip chuông bị khoá khi tắt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả IBD và Cộng đồng đang tắt. Mở trang, mở chuông.

## Kết quả mong đợi
- [ ] Công tắc IBD, Cộng đồng bỏ tick; 5 loại còn lại tick.
- [ ] Trong chuông, chip IBD + Cộng đồng bị khoá (`disabled`, mờ), title "Đã tắt ở Trung tâm thông báo"; chip Chung bấm được.

# [TC_TB_07] Tắt / bật 1 loại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tắt công tắc BCTC, mở chuông. 2. Bật lại BCTC.

## Kết quả mong đợi
- [ ] Gửi `PUT /api/notification-settings/types` `{types:[{type:"bctc", is_active:false}]}`; chip BCTC trong chuông khoá ngay.
- [ ] Bật lại gửi `is_active:true`; bấm công tắc không đổi mục ở cột phải.

# [TC_TB_08] Lưu bật/tắt loại lỗi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho `PUT …/types` trả 500, tắt "Sự kiện".

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại"; công tắc trở lại trạng thái bật.

# [TC_TB_09] Badge chuông trừ phần của loại đang tắt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. `unread-counts` = SIGNAL 2, IBD 3, news_events 1. Mở trang.
2. Tắt IBD; rồi tắt Cơ hội tiềm năng và Sự kiện.

## Kết quả mong đợi
- [ ] Badge "6", `aria-label` "Thông báo (6 chưa đọc)".
- [ ] Tắt IBD → badge "3"; tắt hết loại có số → không còn badge, `aria-label` "Thông báo".

---

## Nhóm: Tất cả cài đặt

# [TC_TB_10] Bảng ghép 4 nguồn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Dữ liệu: watchlist "Kungfu Watchlist" đang nhận tín hiệu; cảnh báo VNM (giá tăng 70,000 Luôn luôn; SMA20 1 lần), FPT
   (giá giảm 95,000), HPG (giảm 3 phiên; giá tăng 30,000 đã tắt), ACB (cảnh báo sự kiện BCTC lẫn trong get-all); bộ lọc
   "Lọc tăng trưởng" bật, "Tích lũy" tắt, 1 bộ lọc không có content; tin tức MWG bật BCTC + Cổ tức tiền.

## Kết quả mong đợi
- [ ] 8 dòng theo thứ tự: Cơ hội tiềm năng (Kungfu Watchlist · "Có tín hiệu AI hoặc mẫu hình" · Tức thời); Cảnh báo mã
  FPT "Giá giảm xuống mức giá 95,000", HPG "Giá giảm liên tục 3 phiên", VNM "Giá tăng lên chạm mức giá 70,000", VNM "Giá
  cắt lên đường SMA20" (1 lần); Bộ lọc "Lọc tăng trưởng" (1 giờ/lần); Tin tức MWG "BCTC", MWG "Cổ tức tiền" (Khi công bố).
- [ ] Không có điều kiện đã tắt, cảnh báo sự kiện ACB, bộ lọc tắt / không content. Badge đếm "8".

# [TC_TB_11] Tìm + lọc theo loại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "vnm"; gõ "tăng trưởng"; xoá, chọn loại "Tin tức & Sự kiện"; gõ "zzz".

## Kết quả mong đợi
- [ ] Ô lọc loại có: Tất cả loại, Cơ hội tiềm năng, Cảnh báo mã, Bộ lọc, Tin tức & Sự kiện.
- [ ] "vnm" → 2 dòng (badge 2); "tăng trưởng" → dòng bộ lọc; loại Tin tức → 2 dòng.
- [ ] Không còn dòng → "Chưa có quy tắc nào", badge "0" màu xám.

# [TC_TB_12] Nút Sửa dẫn tới đúng chỗ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm Sửa ở dòng VNM SMA20; đóng hộp. 2. Về Tất cả cài đặt, Sửa dòng bộ lọc. 3. Sửa dòng Cơ hội tiềm năng. 4. Sửa dòng tin tức.

## Kết quả mong đợi
- [ ] Bước 1: sang Cảnh báo › Cảnh báo theo mã và mở "Cập nhật cảnh báo cho mã" VNM (ô mã khoá), chỉ SMA20 được chọn.
- [ ] Bước 2: tab "Cảnh báo Bộ lọc". Bước 3: mục "Cơ hội tiềm năng". Bước 4: mục "Tin tức & Sự kiện".

# [TC_TB_13] Bấm mã sang Phân tích cơ bản

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm mã FPT ở bảng.

## Kết quả mong đợi
- [ ] Sang `/phan-tich-co-ban/FPT`.

# [TC_TB_14] Phạm vi "Tất cả cổ phiếu" / tài khoản không được nhận

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Phạm vi `all_stocks`. 2. Tài khoản `can_receive=false`.

## Kết quả mong đợi
- [ ] 1 dòng "Tất cả cổ phiếu" (phụ đề "Phạm vi").
- [ ] `can_receive=false` → không có dòng Cơ hội tiềm năng; bảng trống "Chưa có quy tắc nào".

---

## Nhóm: Cơ hội tiềm năng

# [TC_TB_15] Giao diện mục Cơ hội tiềm năng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Công tắc máy chủ: ai_buy bật, ai_danger bật, ai_sell tắt, pattern_detect bật, pattern_close tắt. Mở `?view=signal`.

## Kết quả mong đợi
- [ ] Link "Mở Cơ hội tiềm năng" → `/co-hoi-tiem-nang`. Khối: Phạm vi cảnh báo, AI Mua/Bán, Mẫu hình.
- [ ] Công tắc: Mua, Bán, Phát hiện mẫu hình, Đóng mẫu hình — đúng trạng thái máy chủ. "Cảnh báo nguy hiểm" không hiện (đang ẩn).
- [ ] Phạm vi "Watchlist" đang chọn, nút chọn ghi "Kungfu Watchlist"; không có khung khoá.

# [TC_TB_16] Bật/tắt công tắc tín hiệu, lỗi 500 / 403

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tắt "Bán". 2. Cho máy chủ trả 500, bấm "Đóng mẫu hình". 3. Cho trả 403, bấm "Mua".

## Kết quả mong đợi
- [ ] `PUT /api/notification-settings/signal/switches` `{key:"ai_sell", is_active:false}`.
- [ ] 500 → toast lỗi, công tắc trả lại. 403 → mở popup "Chọn dịch vụ", khối bị khoá, công tắc bị vô hiệu.

# [TC_TB_17] Chọn phạm vi "Tất cả cổ phiếu"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn "Tất cả cổ phiếu", rồi chọn lại "Watchlist".

## Kết quả mong đợi
- [ ] `PUT …/signal/scope` `{scope:"all_stocks"}`, ô chọn watchlist ẩn; chọn lại → `{scope:"watchlists"}`, ô hiện lại.
- [ ] Không gửi request tick watchlist.

# [TC_TB_18] Ô chọn watchlist

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở ô chọn (đang nhận: Kungfu Watchlist). Tick "Ngân Hàng", tick "Công nghệ". 2. Bỏ "Tất cả watchlist". 3. Bấm ra ngoài.

## Kết quả mong đợi
- [ ] Có link "Quản lý watchlist" → `/watchlist`.
- [ ] Tick "Ngân Hàng" → `PATCH /api/watchlist/update-receive-signal/2` `{receive_signal:true}`, nút ghi "2 watchlist".
- [ ] Tick đủ cả 3 → `PUT …/scope` `{scope:"all_watchlists"}`, nút "Tất cả watchlist", ô "Tất cả watchlist" được tick.
- [ ] Bỏ "Tất cả watchlist" → scope "watchlists", mọi watchlist bỏ nhận, nút "Chưa chọn watchlist".
- [ ] Bấm ra ngoài đóng menu.

# [TC_TB_19] Tài khoản không được nhận

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. `can_receive=false`, mở `?view=signal`, bấm "Nâng cấp".

## Kết quả mong đợi
- [ ] Khung "Nâng cấp để nhận thông báo cơ hội tiềm năng"; khối mờ (`is-locked`), mọi công tắc + radio bị vô hiệu.
- [ ] "Nâng cấp" mở popup "Chọn dịch vụ".

---

## Nhóm: Cảnh báo — Cảnh báo theo mã

# [TC_TB_20] Bảng cảnh báo theo mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Dữ liệu như TC_TB_10, mở `?view=alert`.

## Kết quả mong đợi
- [ ] Tab "Cảnh báo theo mã" (đang chọn) đứng trước "Cảnh báo Bộ lọc". Cột: Mã, Doanh nghiệp, Giá, Điều kiện, Tần suất.
- [ ] 4 hàng xếp theo mã: FPT, HPG, VNM (giá tăng), VNM (SMA20); không có điều kiện đã tắt, không có ACB (sự kiện).
- [ ] Cột Giá lấy giá live (dạng `95.30`) kèm % thay đổi.

# [TC_TB_21] "Xem gộp theo mã"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tick "Xem gộp theo mã".

## Kết quả mong đợi
- [ ] Cột "Số điều kiện" thay cột "Tần suất"; 3 hàng; VNM ghi "2", ô Điều kiện liệt kê "… · Luôn luôn", "… · 1 lần".
- [ ] localStorage `notification_center_gop_theo_ma = "true"` và ghi setting cùng khoá lên máy chủ.

# [TC_TB_22] Setting gộp theo mã trên máy chủ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Setting `notification_center_gop_theo_ma = "true"`, mở `?view=alert`.

## Kết quả mong đợi
- [ ] Ô "Xem gộp theo mã" đã tick, bảng 3 hàng.

# [TC_TB_23] Tìm mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "vn"; gõ "XYZ".

## Kết quả mong đợi
- [ ] "vn" → 2 hàng VNM; "XYZ" → "Chưa có cảnh báo theo mã".

# [TC_TB_24] Xoá 1 điều kiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm thùng rác ở hàng VNM SMA20, bấm Huỷ. 2. Bấm lại, bấm Xoá.

## Kết quả mong đợi
- [ ] Hộp "Xoá quy tắc": "Xoá điều kiện “Giá cắt lên đường SMA20” của mã VNM? Việc này không hoàn tác được."
- [ ] Huỷ không gọi API. Xoá → `POST …/user-alert/update/v2` `{user_alerts:[], old_user_alerts:[điều kiện đó (id 102)]}`;
  hàng biến mất.

# [TC_TB_25] Xoá mọi cảnh báo của mã (chế độ gộp)

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bật gộp theo mã, bấm thùng rác hàng VNM, bấm Xoá.

## Kết quả mong đợi
- [ ] Hộp: "Xoá mọi cảnh báo kỹ thuật của mã VNM? …"; `POST …/delete-by-stockcode/v2` `{stockcodes:["VNM"]}`; còn 2 hàng.

# [TC_TB_26] Xoá lỗi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho `update/v2` trả 500, xoá hàng FPT.

## Kết quả mong đợi
- [ ] Toast "Có lỗi xảy ra, vui lòng thử lại"; vẫn đủ 4 hàng.

# [TC_TB_27] "Thêm cảnh báo" và Sửa theo mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Thêm cảnh báo", đóng. 2. Bật gộp theo mã, bấm "Sửa điều kiện của mã" hàng VNM.

## Kết quả mong đợi
- [ ] Bước 1: "Tạo cảnh báo cho mã", ô mã trống, nhập được.
- [ ] Bước 2: "Cập nhật cảnh báo cho mã", chọn sẵn giá tăng (70000) + SMA20.

# [TC_TB_28] Lưu ở hộp xong thì bảng tự đọc lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Sửa hàng SMA20, bỏ chọn, Lưu.

## Kết quả mong đợi
- [ ] Hộp đóng, bảng gọi lại `user-alert/get-all` (qua `alertSavedAt`), còn 3 hàng.

---

## Nhóm: Cảnh báo — Bộ lọc

# [TC_TB_29] Bảng bộ lọc đã lưu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `?muc=alert&tab=filter` (bộ lọc như TC_TB_10, cùng tần suất 60 phút).

## Kết quả mong đợi
- [ ] Cột "Bộ lọc" / "Báo khi có mã mới"; 2 dòng (bỏ bộ lọc không có content); công tắc theo `is_active`.
- [ ] "Tần suất (cho mọi bộ lọc)" = "1 giờ/lần"; lựa chọn: 5 phút/lần, 1 giờ/lần, 1 ngày/lần. Link "Mở bộ lọc" → `/bo-loc`.

# [TC_TB_30] Bật/tắt báo của bộ lọc

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bật "Tích lũy". 2. Cho máy chủ trả 500, tắt "Lọc tăng trưởng".

## Kết quả mong đợi
- [ ] `PUT /api/filter/notification` `{id:12, is_active:true, frequency:60, my_watchlist_id:"all"}`.
- [ ] Lỗi → toast, công tắc trả lại.

# [TC_TB_32] Tài khoản Free chỉ bật được bộ lọc đầu tiên

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập Free, mở tab Bộ lọc, bật bộ lọc thứ 2.

## Kết quả mong đợi
- [ ] Toast "Tài khoản miễn phí chỉ bật được bộ lọc đầu tiên."; công tắc bỏ tick; không gọi API.
- [ ] Nếu tài khoản Free bị khoá cả tab (ProtectedView `canh_bao_bo_loc`) thì test tự bỏ qua.

---

## Nhóm: Tin tức & Sự kiện

# [TC_TB_33] Bảng mã × 5 loại sự kiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `?muc=news` (MWG bật BCTC + Cổ tức tiền).

## Kết quả mong đợi
- [ ] Cột: Mã, Doanh nghiệp, BCTC, Cổ tức tiền, Cổ tức CP, Phát hành thêm, Tin doanh nghiệp. Ô tích theo cài đặt.

# [TC_TB_34] Bỏ tích 1 loại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bỏ tích "MWG BCTC". 2. Cho máy chủ trả 500, tích "MWG Cổ tức CP".

## Kết quả mong đợi
- [ ] `POST /api/news-event-alerts` gửi đủ 5 loại với trạng thái mới.
- [ ] Lỗi → toast, ô tích trả lại.

# [TC_TB_35] Thêm mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "fpt", bấm "Thêm mã". 2. Gõ "VNM", nhấn Enter.

## Kết quả mong đợi
- [ ] POST với FPT, cả 5 loại bật; bảng xếp FPT, MWG; ô nhập xoá trắng. Enter cũng thêm (VNM).

# [TC_TB_36] Thêm mã sai / trùng / trống / bấm liền 2 lần

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Thêm mã" khi ô trống. 2. Gõ "ZZZ9". 3. Gõ "MWG". 4. (Máy chủ chậm 1,5 giây) gõ "HPG", nhấn Enter rồi bấm "Thêm mã" ngay.

## Kết quả mong đợi
- [ ] Ô trống: không làm gì. "ZZZ9": toast "Mã CK không hợp lệ!". "MWG": "Mã MWG đã có trong danh sách". Không gọi API.
- [ ] Enter + bấm nút liền nhau chỉ gửi 1 request.

# [TC_TB_37] Xoá mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Xoá mã" ở MWG, bấm Xoá.

## Kết quả mong đợi
- [ ] Hộp "Xoá mọi thông báo tin tức, sự kiện của mã MWG? …"; `DELETE /api/news-event-alerts` `{stockcodes:["MWG"]}`.
- [ ] Bảng trống "Chưa có mã nào bật tin tức, sự kiện".

---

## Nhóm: Cộng đồng — bài đã tắt thông báo

# [TC_TB_38] Bật lại thông báo bài viết

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có 2 bài đã tắt. Mở `?muc=Social`, bấm "Bật lại thông báo" ở bài 1.
2. Máy chủ trả HTTP 200 `{success:false}`, bấm ở bài 2.

## Kết quả mong đợi
- [ ] Mô tả "Bài viết của bạn đã tắt thông báo thích, bình luận"; link "Mở Cộng đồng" → `/cong-dong`; ngày đăng `DD/MM/YYYY`.
- [ ] `POST /api/stocks/community/update-notify` `{postId:501, status:false}`, dòng biến mất.
- [ ] `success:false` → toast lỗi, dòng còn.

# [TC_TB_39] Không có bài nào đang tắt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Danh sách rỗng, mở `?muc=Social`.

## Kết quả mong đợi
- [ ] "Không có bài nào đang tắt thông báo".

---

## Nhóm: Lịch sử thông báo

# [TC_TB_40] Chip và dòng "Chung"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `?view=history`; lần lượt bấm các chip.

## Kết quả mong đợi
- [ ] 7 chip: Chung, Cơ hội tiềm năng, IBD, BCTC, Cảnh báo, Cộng đồng, Sự kiện; mặc định Chung.
- [ ] Dòng Chung: tiêu đề + "Thông báo · 15:01 06/11/2026"; tin chưa đọc in đậm (`is-unread`).
- [ ] Ô "Tìm kiếm thông báo" chỉ có ở Cơ hội tiềm năng và Cảnh báo.

# [TC_TB_41] Chip "Cơ hội tiềm năng"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có các tín hiệu: HPG mua mới (chưa đọc), SSI bán, FPT phát hiện "Hai đáy", VNM vượt vùng break "Vai đầu vai ngược", MWG
   mẫu bị huỷ, ACB `near_break` (sự kiện máy chủ đã bỏ). Mở `?view=history&type=SIGNAL`.

## Kết quả mong đợi
- [ ] Bảng Mã / Loại / Tín hiệu / Thời gian; 5 dòng: "HPG | AI Mua/Bán | AI mua mới 25.50 | 14:53 04/11/2026", "SSI | AI
  Mua/Bán | AI bán 18.80", "FPT | Mẫu hình Hai đáy | AI phát hiện mẫu hình", "VNM | Mẫu hình Vai đầu vai ngược | Vượt vùng break
  63.50", "MWG | Mẫu hình Hai đáy | Đóng mẫu hình: bị huỷ 51.00". Không có dòng ACB.
- [ ] Chấm chưa đọc chỉ ở HPG; màu: mua xanh, bán đỏ, vượt break tím.

# [TC_TB_42] Tìm kiếm thông báo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "huy", "hủy", "mau hinh", "không có đâu"; nhấn Esc. 2. Gõ "vnm", sang chip Cảnh báo, bấm nút xoá chữ.

## Kết quả mong đợi
- [ ] Gõ không dấu tìm ra chữ có dấu ("huy" → dòng "bị huỷ"); "hủy" và "huỷ" như nhau; "mau hinh" → 3 dòng.
- [ ] Không có → `Chưa có thông báo nào có chữ "không có đâu"`; Esc xoá chữ, hiện lại 5 dòng.
- [ ] Chữ tìm giữ nguyên khi sang chip Cảnh báo (1 dòng VNM); nút "Xoá chữ" hiện lại 3 dòng.

# [TC_TB_43] Chip "Cảnh báo"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `?view=history&type=ALERT` (1 thông báo bộ lọc 5 mã, 1 cảnh báo giá VNM, 1 cảnh báo CTR giảm 3 phiên). Bấm dòng bộ lọc.

## Kết quả mong đợi
- [ ] "Bộ lọc Tích lũy có 5 mã mới" + "HUT, VND, SBT và 2 mã khác".
- [ ] "VNM tăng lên chạm 70.00" + giá khớp "70.20" + "Mức bạn đặt: 70.00"; "CTR giảm 3 phiên liên tiếp".
- [ ] Bấm dòng bộ lọc → `/bo-loc`.

# [TC_TB_44] Chip BCTC / IBD / Sự kiện / Cộng đồng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở `?view=history&type=bctc`; lần lượt sang IBD, Sự kiện, Cộng đồng.

## Kết quả mong đợi
- [ ] BCTC gộp theo đợt: "Đã có báo cáo tài chính quý 3 năm 2026 của 2 mã" + mã của đợt; đợt chưa đọc in đậm.
- [ ] IBD: "Nhật báo IBD ngày 9/11/2026". Sự kiện: "PRC: Phát hành thêm" + "Ngày GDKHQ: 30/10/2026".
  Cộng đồng: chữ thuần của nội dung ("Ngọc Bích đã bình luận bài viết của bạn: hay").

# [TC_TB_45] Mở chip không đánh dấu đọc; "Đánh dấu tất cả đã đọc"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm qua cả 7 chip. 2. Ở Chung bấm "Đánh dấu tất cả đã đọc". 3. Ở Cơ hội tiềm năng bấm lại.

## Kết quả mong đợi
- [ ] Bước 1 không gửi request đánh dấu đọc nào.
- [ ] Bước 2: `GET /notification/updateReadNotify?id=&type=notifications`, hết dòng in đậm. Không có toast (thành công
  bị tắt toàn app — `main.js`).
- [ ] Bước 3: `POST /notification/signal/read` (không id), hết chấm chưa đọc.

# [TC_TB_46] Lỗi đánh dấu đọc / lỗi tải

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho `updateReadNotify` trả 500, bấm "Đánh dấu tất cả đã đọc". 2. Cho danh sách trả 500, mở chip IBD.

## Kết quả mong đợi
- [ ] Toast lỗi, 2 dòng vẫn in đậm. Chip IBD: toast lỗi + "Chưa có thông báo nào".

# [TC_TB_47] Nạp thêm khi cuộn / Tải lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có 55 thông báo Chung. Cuộn xuống cuối danh sách đến khi đủ. 2. Bấm "Tải lại".

## Kết quả mong đợi
- [ ] Ban đầu 20 dòng, cuộn tới cuối tự nạp tiếp đến đủ 55 (trang 40 dòng, trang 2 gửi `last_id` = id nhỏ nhất trang 1); hết
  thì không còn nút "Xem thêm".
- [ ] "Tải lại" đọc lại từ trang đầu (`last_id` rỗng).

# [TC_TB_48] Bấm dòng mở biểu đồ / bài viết

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở chip Cơ hội tiềm năng bấm dòng HPG. 2. Ở chip Cộng đồng bấm dòng bình luận.

## Kết quả mong đợi
- [ ] Mở popup biểu đồ HPG (`isShowModalTradingChart`, `mackTradingChart = HPG`), gọi `POST /api/stock-signals/sell-signals` để vẽ lệnh AI.
- [ ] Dòng Cộng đồng → `/cong-dong/moi-nhat/bai-viet/321`.

---

## Nhóm: Chuông thông báo trên header

# [TC_TB_49] Badge chuông

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. `unread-counts` tổng 7, localStorage `number_notify_alert = 3`. 2. Tài khoản có 150 tin chưa đọc.

## Kết quả mong đợi
- [ ] Badge "10", `aria-label` "Thông báo (10 chưa đọc)". 150 → "99+".

# [TC_TB_50] Mở chuông

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở chuông ở `/watchlist`.

## Kết quả mong đợi
- [ ] Tiêu đề "Thông báo"; chip: Chung (không số), Cơ hội tiềm năng 1, IBD 2, BCTC 1, Cảnh báo (không số), Cộng đồng (chấm), Sự kiện 1.
- [ ] Chip Chung đang chọn, 3 dòng; dòng phụ "2 thông báo chưa đọc". Mở chuông không đánh dấu đọc.

# [TC_TB_51] Bấm thông báo Chung

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Ưu đãi tháng 11", bấm Đóng. 2. Bấm thông báo gia hạn (RENEWAL), bấm "Gia hạn phần mềm".

## Kết quả mong đợi
- [ ] Modal hiện nội dung HTML; `GET /notification/updateReadNotify?id=17680&type=MANUAL`; không có nút gia hạn.
- [ ] Đóng modal không đóng panel chuông. RENEWAL có "Gia hạn phần mềm" → `/renewal-account`.

# [TC_TB_52] Chip Cơ hội tiềm năng trong chuông

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở chip Cơ hội tiềm năng; bấm dòng HPG (chưa đọc). 2. Mở lại, bấm dòng SSI (đã đọc).

## Kết quả mong đợi
- [ ] Dòng "HPG: AI mua mới" + giá "25.50" + chip "AI Mua/Bán"; dòng FPT có mô tả "Vùng break 99.00 · Vùng huỷ 90.00 · Mục tiêu 110.00".
- [ ] Bấm HPG: panel đóng, mở biểu đồ HPG, `POST /notification/signal/read` `{id:801}`. Bấm SSI (đã đọc) không gửi request.

# [TC_TB_53] Đánh dấu đã đọc mọi tab

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm ✓✓ "Đánh dấu tất cả thông báo ở mọi tab đã đọc".

## Kết quả mong đợi
- [ ] `updateReadNotify` cho notifications, IBD, bctc, news_events, Social + `POST signal/read`.
- [ ] Mất badge và số trên chip; "Bạn đã đọc hết thông báo"; localStorage `number_notify_alert = "0"`.

# [TC_TB_54] Xoá 1 thông báo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm × ở "Ưu đãi tháng 11". 2. Sang chip IBD, cho máy chủ trả 500, bấm × ở dòng IBD.

## Kết quả mong đợi
- [ ] `DELETE /notification/delete-notifications` `{type:"notifications", ids:[17680]}`, còn 2 dòng.
- [ ] IBD gửi `type:"IBDV3"`; lỗi → toast "Không xóa được thông báo", dòng còn.

# [TC_TB_55] Chip Cảnh báo trong chuông

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** câu "Tìm thấy … mã mới" là link sang `/bo-loc` và chiếm gần hết dòng — chỉ bấm vào dòng giờ / vùng trống mới
  mở danh sách mã.

## Các bước thực hiện
1. Mở chip Cảnh báo; bấm vùng giờ của dòng bộ lọc; bấm câu chữ.

## Kết quả mong đợi
- [ ] "Tìm thấy 5 mã mới đáp ứng mẫu lọc Tích lũy của bạn: HUT, VND, SBT, FTS, DPM"; dòng giá "VNM tăng lên chạm 70.00".
- [ ] Bấm vùng giờ mở danh sách 5 mã; bấm câu chữ → `/bo-loc`, panel đóng.

# [TC_TB_56] "Xem toàn bộ lịch sử thông báo"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở chip Cơ hội tiềm năng bấm "Xem toàn bộ lịch sử thông báo". 2. Mở chuông, chip BCTC, bấm lại.

## Kết quả mong đợi
- [ ] Sang `/trung-tam-thong-bao?view=history&type=SIGNAL`, chip Cơ hội tiềm năng đang chọn.
- [ ] Đang ở trang lịch sử mà dẫn lại (chỉ đổi query) → chip BCTC được chọn.

# [TC_TB_57] Chip Sự kiện

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở chip Sự kiện, bấm dòng PRC (tin mới).

## Kết quả mong đợi
- [ ] Dòng "PRC: Phát hành thêm", "Ngày GDKHQ: 30/10/2026", chấm tin mới.
- [ ] Modal nội dung sự kiện (`/get-content-event`); `PATCH /notification/update-read-news-events-notify` `{ids:["e1"]}`.

# [TC_TB_58] Chip Cộng đồng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở chip Cộng đồng; bấm × ở 1 dòng (máy chủ trả `count:0`); bấm dòng bình luận.

## Kết quả mong đợi
- [ ] Nội dung HTML (tên in đậm) + chấm chưa đọc.
- [ ] × → `DELETE …/post/social-history` `{ids:[999]}`; `count:0` → toast "Không xóa được thông báo", dòng còn.
- [ ] Bấm dòng → `GET /api/notifications/updateReadNotify` (post_id 321, type Social, type_social comment) + sang bài viết.

# [TC_TB_59] Loại đang xem bị tắt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tắt Chung + Cơ hội tiềm năng, mở chuông. 2. Tắt cả 7 loại, mở chuông.

## Kết quả mong đợi
- [ ] Chuông tự sang chip bật đầu tiên (IBD) và hiện dòng IBD.
- [ ] Tắt cả 7: không chip nào được chọn, 7 chip bị khoá, panel trống.

# [TC_TB_61] Bấm ra ngoài panel (kể cả vào biểu đồ) thì đóng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở `/phan-tich-ky-thuat` mở chuông, bấm vào vùng biểu đồ TradingView.

## Kết quả mong đợi
- [ ] Panel đóng (click trong iframe cũng được bắt — `bindOutsideClose`).

---

## Nhóm: Bản tin thị trường

# [TC_TB_62] Popup tờ bản tin từ chuông

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở chuông, bấm "📢 Tổng hợp thị trường 06/11/2026".

## Kết quả mong đợi
- [ ] Gọi `GET /api/market-bulletin/2026-11-06`; lớp "Đang tải bản tin…" biến mất.
- [ ] Iframe vẽ tờ "BẢN TIN THỊ TRƯỜNG", "Thứ sáu, 06/11/2026", VNINDEX "−15.37", "Đóng cửa 1,725.36", "khối ngoại mua ròng trên HOSE".
- [ ] Không hiện khung nội dung HTML cũ.

# [TC_TB_63] Đổi giao diện A/B

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm chấm "Giao diện B"; bấm lại "Giao diện A".

## Kết quả mong đợi
- [ ] Ban đầu chỉ 1 iframe (A). Bấm B → nạp iframe B, chấm B sáng và iframe B hiện khi đã vẽ xong. Bấm A đổi ngay.

# [TC_TB_64] Đóng popup bản tin

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm × của tờ bản tin.

## Kết quả mong đợi
- [ ] Popup đóng, panel chuông vẫn mở.

# [TC_TB_65] Phiên chưa có bản tin

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. API bản tin trả 404, bấm thông báo "Tổng hợp thị trường".

## Kết quả mong đợi
- [ ] Popup hiện nội dung HTML cũ của thông báo + nút Đóng; không có tờ bản tin.

# [TC_TB_66] Số liệu hỏng thì lùi về nội dung cũ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. API trả bản tin có `vnindex.close = null`, bấm thông báo.

## Kết quả mong đợi
- [ ] Iframe báo vẽ hỏng (`ok:false`) → popup lùi về nội dung HTML cũ.

# [TC_TB_67] Chữ từ máy chủ được escape

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. API trả mã khối ngoại mua là `<img src=x onerror="window.__xss=1">`, mở bản tin.

## Kết quả mong đợi
- [ ] Tờ bản tin hiện nguyên chuỗi đó dạng chữ; không có thẻ `<img src="x">`, không frame nào có `window.__xss`.

# [TC_TB_68] Hình thu nhỏ KFSP AI chào phiên mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Trình duyệt chưa chào phiên nào (xoá `kfsp_market_bulletin_seen`), API `latest` trả phiên 06/11. Vào `/watchlist`.
2. Chờ hơn 10 giây; bấm vào hình.

## Kết quả mong đợi
- [ ] Gọi `GET /api/market-bulletin/latest` 1 lần; hình thu nhỏ (iframe tờ bản tin) hiện góc phải dưới; localStorage
  `kfsp_market_bulletin_seen = "2026-11-06"`.
- [ ] Sau 10 giây hình vẫn còn (tin thường tự ẩn sau 10 giây, hình bản tin thì không).
- [ ] Bấm hình → hình đóng, popup bản tin mở đúng phiên 06/11 mà không gọi lại API theo ngày.

# [TC_TB_69] Đóng hình thu nhỏ, tải lại không chào lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Như TC_TB_68, bấm nút đóng của hình. 2. Tải lại trang.

## Kết quả mong đợi
- [ ] Hình đóng, không mở popup. Tải lại không hiện lại hình (phiên đã chào).

# [TC_TB_70] Đã chào hôm nay / chưa có bản tin

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. `kfsp_market_bulletin_seen` = hôm nay (giờ VN), vào trang. 2. Tab khác: chưa chào, API `latest` trả 404.

## Kết quả mong đợi
- [ ] Bước 1 không gọi `latest`, không hiện hình. Bước 2 gọi `latest` 1 lần, 404 → không hiện hình.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 68 |
| **Tổng** | **68** |

**Cập nhật 10/11/2026:** xoá TC_TB_31, TC_TB_60 và ghi chú bug "chip Chung không có số" (bug được user chấp nhận). 70 → 68 TC.

## Phát hiện đáng chú ý

3. **Toast thành công bị tắt toàn app** (`main.js`, yêu cầu 12/10/2026): "Đã đánh dấu tất cả đã đọc", "Lưu cảnh báo
   thành công"… không bao giờ hiện. Đây là chủ đích; test assert "không có toast".
5. **Dòng bộ lọc trong chuông khó mở danh sách mã** (TC_TB_55): câu chữ là link sang `/bo-loc` và chiếm gần hết dòng.
6. **prev2 đang gọi API bản tin production thật** (`/api/market-bulletin/latest` trả 200 ngày 09/11/2026), khác ghi chú
   "API chưa merge" trong `docs/ban-tin-viec-con-lai.md` — tính năng bản tin đã chạy thật.
7. Khi thao tác trước khi danh sách mã của app nạp xong (vài giây đầu), hộp sửa cảnh báo mở trống và "Thêm mã" ở Tin tức
   báo "Mã CK không hợp lệ!". Test chờ danh sách nạp (`waitStockList`); chưa xếp vào bug.
