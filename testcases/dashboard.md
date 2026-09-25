# Màn hình: Dashboard

- **URL:** `/dashboard` (route con của `/`, yêu cầu đăng nhập — `meta.requiresUser`)
- **Component:** [src/views/dashboard/redirectToDashboard.vue](../../stocks/src/views/dashboard/redirectToDashboard.vue) →
  mặc định render [src/views/dashboard/DashboardV3Resize.vue](../../stocks/src/views/dashboard/DashboardV3Resize.vue)
  (`store.state.usingV3` mặc định `true`).
- **Domain test:** https://kfsp.vn/dashboard
- **Nguồn testcase gốc (app):** Google Sheet, tab "Dashboard" (87 dòng). **Hầu như không áp dụng được 1-1** —
  Dashboard app là màn hình mobile hoàn toàn khác kiến trúc: thanh tìm kiếm mã CK, card chỉ số cuộn ngang, 8 icon
  tính năng dạng lưới, section "Bài viết mới"/"Cộng đồng KFSP" dạng feed, bottom navigation. Dashboard web là bố
  cục 3 cột desktop (tab thị trường bên trái, chỉ số tâm lý/rủi ro + bản đồ nhiệt ở giữa, panel IBD/Watchlist/
  Cảnh báo/Ghi chú/Cộng đồng bên phải, có thể kéo giãn/thu gọn) — không có search bar, không có feed bài viết,
  không có bottom nav. → Phần lớn testcase dưới đây là **🆕 testcase mới**, chỉ vài case tương ứng khái niệm
  chung (hiển thị chỉ số, điều hướng khi click) mới gắn được `Tham chiếu App`.
- **Phạm vi:** Theo quyết định của người dùng, tài liệu này chỉ kiểm thử **khung/shell của Dashboard** (layout
  tổng thể, chuyển tab thị trường, mở rộng/thu nhỏ bản đồ nhiệt, chuyển panel phải, kéo giãn/reset bố cục,
  responsive, điều hướng vào/ra). Nội dung **bên trong** từng widget con (bản đồ nhiệt, IBD, Watchlist, Chỉ số
  tâm lý/rủi ro, tab Quốc tế/Crypto/Sự kiện/Vĩ mô...) sẽ được viết testcase riêng cho từng widget đó khi cần,
  không đi sâu ở đây.
- **Phương pháp sinh:** Đọc source code (`DashboardV3Resize.vue`, `redirectToDashboard.vue`, `HeatMap.vue` phần
  liên quan tới toggle full-screen, `router/index.js` đoạn guard `requiresUser`) + kiểm thử trực tiếp trên môi
  trường thật bằng Playwright (bao gồm giả lập kéo-thả chuột để test resize, xoá `localStorage` để test
  redirect khi chưa đăng nhập).
- **Quy ước trạng thái:**
  - ✅ Áp dụng — testcase adapt từ app, có thể/đã tự động hoá bằng Playwright.
  - 🆕 Testcase mới — phát sinh riêng cho web, app không có (hoặc kiến trúc khác hẳn không map được).
  - ⚠️ Cần xác nhận thêm — chưa đủ điều kiện kiểm chứng thực tế.

---

## Nhóm: Truy cập & Tổng quan

# [TC_DASHBOARD_01] Overview màn hình Dashboard

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Tiền điều kiện:** Đã đăng nhập.

## Các bước thực hiện
1. Đăng nhập thành công, mặc định vào `/dashboard`.

## Kết quả mong đợi
- [ ] Hiển thị đầy đủ layout 3 cột: cột trái (tab thị trường + card chỉ số VNINDEX/HNXINDEX/UPCOM/VN30), cột
      giữa (Chỉ số tâm lý, Chỉ số rủi ro, bản đồ nhiệt), cột phải (panel IBD, kèm tab dọc Watchlist/Cảnh báo/
      Ghi chú/Cộng đồng).
- [ ] Không bị tràn/vỡ layout.
- [ ] Tab "Việt Nam" và panel "IBD" active mặc định (tabIndex = 0, rightTabIndex = 0).

---

# [TC_DASHBOARD_02] Truy cập `/dashboard` khi chưa đăng nhập

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Xoá cookie + `localStorage` rồi truy cập thẳng `/dashboard` → router guard
  (`meta.requiresUser`) redirect chính xác tới `https://kfsp.vn/login?redirect=%2Fdashboard`.

## Các bước thực hiện
1. Đảm bảo chưa đăng nhập (không có `roles`/`expires_in` hợp lệ trong `localStorage`).
2. Truy cập trực tiếp URL `/dashboard`.

## Kết quả mong đợi
- [ ] Tự động chuyển hướng tới `/login?redirect=%2Fdashboard`, không hiển thị nội dung Dashboard.

---

# [TC_DASHBOARD_03] Đăng nhập từ redirect quay lại đúng Dashboard

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Source `Login.vue` dùng `self.$router.push(self.$route.query.redirect || 'dashboard')` sau khi
  đăng nhập thành công — xác nhận qua đọc code, cùng cơ chế đã dùng để verify TC_DASHBOARD_02.

## Các bước thực hiện
1. Từ trạng thái chưa đăng nhập, truy cập `/dashboard` (bị redirect sang `/login?redirect=%2Fdashboard`).
2. Đăng nhập thành công.

## Kết quả mong đợi
- [ ] Sau đăng nhập, quay lại đúng `/dashboard` (không phải trang mặc định khác).

---

## Nhóm: Cột trái — Tab thị trường

# [TC_DASHBOARD_04] Hiển thị 5 tab thị trường

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát tab-wrapper phía trên cùng cột trái.

## Kết quả mong đợi
- [ ] Hiển thị đủ 5 tab theo đúng thứ tự: "Việt Nam", "Quốc tế", "Crypto", "Sự kiện", "Vĩ mô".
- [ ] Tab "Việt Nam" active mặc định (có class `tab-active`).

---

# [TC_DASHBOARD_05] Chuyển tab thị trường

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click tab "Quốc tế" → nội dung đổi từ card chỉ số VNINDEX/HNXINDEX/UPCOM/VN30 + bản đồ
  nhiệt (nhóm ngành trong nước) sang bảng chỉ số quốc tế (VIX, RUT, SPX, DJI, IXIC, UKX, DAX, KQ11, SSEC, ...)
  kèm sub-tab riêng (Chỉ số/Cổ phiếu/Tiền tệ/Hàng hoá/Trái phiếu); tab "Quốc tế" chuyển active, các tab khác
  (giữa/phải) không đổi.

## Các bước thực hiện
1. Click lần lượt từng tab: "Quốc tế", "Crypto", "Sự kiện", "Vĩ mô".

## Kết quả mong đợi
- [ ] Mỗi lần click, tab được chọn chuyển active, nội dung cột trái đổi tương ứng đúng loại dữ liệu, các tab
      còn lại không active.
- [ ] Cột giữa (Chỉ số tâm lý/rủi ro/bản đồ nhiệt) và cột phải không bị ảnh hưởng khi đổi tab trái.

---

## Nhóm: Cột giữa — Chỉ số tâm lý/rủi ro & Bản đồ nhiệt

# [TC_DASHBOARD_06] Hiển thị Chỉ số tâm lý & Chỉ số rủi ro

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát 2 khối "Chỉ số tâm lý" và "Chỉ số rủi ro" phía trên cột giữa.

## Kết quả mong đợi
- [ ] Mỗi khối hiển thị: gauge chart, giá trị hiện tại, nhãn xu hướng (VD "Trung lập"/"Trung tính"), giá trị
      hôm qua, giá trị tuần trước.

---

# [TC_DASHBOARD_07] Hiển thị bản đồ nhiệt (chế độ thu nhỏ)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát khối bản đồ nhiệt phía dưới cột giữa (khi `showFullHeatMap = false`).

## Kết quả mong đợi
- [ ] Hiển thị bản đồ nhiệt dạng treemap theo nhóm ngành (Ngân hàng, Chứng khoán, Bất động sản...), có bộ lọc
      Giá trị/Sàn/Phân loại, nút "Phóng to" (icon zoom góc phải).

---

# [TC_DASHBOARD_08] Mở rộng bản đồ nhiệt toàn màn hình

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện bất thường**
- **Kết quả đo được:** Click nút "Phóng to" (`title="Phóng to"`) → cột trái và khối Chỉ số tâm lý/rủi ro ẩn đi
  (`showFullHeatMap = true`), bản đồ nhiệt chiếm toàn bộ chiều rộng, xuất hiện 4 sub-tab: "Bản đồ nhiệt", "Nhóm
  ảnh hưởng", "Thanh khoản", "Phân loại dòng tiền" + nút "Thu nhỏ" để quay lại. Cột phải (IBD/Watchlist...)
  **vẫn giữ nguyên, không bị ẩn**.
- **⚠️ Phát hiện đáng chú ý:** Ngay sau khi bấm "Phóng to" lần đầu, biểu đồ treemap của tab "Bản đồ nhiệt" render
  bị vỡ/chồng chữ trong khoảng thời gian ngắn (canvas chưa resize kịp theo kích thước container mới) trước khi
  ổn định lại. Chuyển sang sub-tab khác ("Nhóm ảnh hưởng") thì render đúng ngay từ đầu. Cần theo dõi thêm khi
  viết testcase chi tiết riêng cho widget Bản đồ nhiệt.

## Các bước thực hiện
1. Từ Dashboard, click nút "Phóng to" trên khối bản đồ nhiệt.

## Kết quả mong đợi
- [ ] Bản đồ nhiệt mở rộng toàn chiều rộng (trừ cột phải), hiển thị 4 sub-tab và nút "Thu nhỏ".
- [ ] (Bug tiềm ẩn) Treemap có thể hiển thị lệch/chồng chữ trong chốc lát ngay sau khi mở rộng — nên báo dev
      kiểm tra logic resize canvas khi container đổi kích thước.

---

# [TC_DASHBOARD_09] Chuyển sub-tab khi đang mở rộng bản đồ nhiệt

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Mở rộng bản đồ nhiệt (TC_DASHBOARD_08).
2. Click lần lượt "Nhóm ảnh hưởng", "Thanh khoản", "Phân loại dòng tiền".

## Kết quả mong đợi
- [ ] Mỗi sub-tab hiển thị đúng loại biểu đồ tương ứng, sub-tab được chọn chuyển active.
- [ ] "Nhóm ảnh hưởng" hiển thị thêm dropdown chọn sàn (HSX/HNX/UPCOM/VN30); "Thanh khoản" hiển thị thêm dropdown
      chọn Tổng giá trị/Khớp lệnh.

---

# [TC_DASHBOARD_10] Thu nhỏ bản đồ nhiệt về chế độ mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Từ chế độ mở rộng bản đồ nhiệt (ở bất kỳ sub-tab nào), click nút "Thu nhỏ".

## Kết quả mong đợi
- [ ] Quay lại đúng layout 3 cột ban đầu (`showFullHeatMap = false`, sub-tab bản đồ nhiệt reset về "Bản đồ
      nhiệt" — xác nhận qua code `resizeDetail()` luôn set `tabIndexFull = 0` khi thu nhỏ).
- [ ] Cột trái và khối Chỉ số tâm lý/rủi ro hiển thị lại bình thường.

---

## Nhóm: Cột phải — Panel IBD/Watchlist/Cảnh báo/Ghi chú/Cộng đồng

# [TC_DASHBOARD_11] Hiển thị panel phải mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát cột phải khi mới vào Dashboard.

## Kết quả mong đợi
- [ ] Panel "IBD" hiển thị mặc định (active).
- [ ] Có 5 tab dọc bên rìa phải: "IBD", "Watchlist", "Cảnh báo", "Ghi chú", "Cộng đồng".

---

# [TC_DASHBOARD_12] Chuyển panel phải

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click tab dọc "Watchlist" → panel đổi từ nội dung IBD sang danh sách Watchlist ("Kungfu
  Watchlist", danh sách mã ABB/ACB/CEO...), tab "Watchlist" chuyển active.

## Các bước thực hiện
1. Click lần lượt các tab dọc: "Watchlist", "Cảnh báo", "Ghi chú", "Cộng đồng".

## Kết quả mong đợi
- [ ] Mỗi lần click, panel đổi đúng nội dung tương ứng, tab được chọn chuyển active (`rightTabIndex` đổi đúng
      theo code `changeRightTab`).

---

# [TC_DASHBOARD_13] Thu gọn panel phải (click lại tab đang active)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Từ trạng thái panel "IBD" đang active, click lại đúng tab "IBD" → panel phải thu gọn hoàn
  toàn, chỉ còn dải 5 tab dọc thu nhỏ (`.v3-dashboard-menu-right-container`, `expandMenuRight = false`,
  `rightTabIndex = -1`), nội dung IBD ẩn đi, cột giữa/bản đồ nhiệt giãn rộng ra chiếm phần không gian trống.

## Các bước thực hiện
1. Đảm bảo panel phải đang mở với 1 tab active (VD "IBD").
2. Click lại đúng tab đang active đó.

## Kết quả mong đợi
- [ ] Panel phải thu gọn về dải tab dọc mỏng, không còn hiển thị nội dung panel.

---

# [TC_DASHBOARD_14] Mở lại panel phải từ trạng thái thu gọn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Từ trạng thái đã thu gọn (TC_DASHBOARD_13), click vào 1 tab dọc bất kỳ (VD "IBD").

## Kết quả mong đợi
- [ ] Panel phải mở rộng trở lại, hiển thị đúng nội dung của tab vừa click, tab đó chuyển active.

---

## Nhóm: Kéo giãn & Reset bố cục

# [TC_DASHBOARD_15] Kéo thả thanh chia cột để đổi kích thước

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Giả lập `mouse.down()` trên thanh `.resizer-vertical` giữa cột trái/giữa rồi
  `mouse.move()` kéo sang phải 150px, `mouse.up()` → chiều rộng cột trái (`aWidth`) tăng tương ứng thực tế trên
  màn hình, đồng thời sau debounce 3s, `localStorage.resize` được ghi giá trị mới
  (`{"bTopHeight":150,"aWidth":529,"cWidth":384}` trong lần đo).

## Các bước thực hiện
1. Kéo thanh chia dọc giữa cột trái và cột giữa sang phải.
2. Kéo thanh chia dọc giữa cột giữa và cột phải.
3. Kéo thanh chia ngang giữa khối Chỉ số tâm lý/rủi ro và bản đồ nhiệt.

## Kết quả mong đợi
- [ ] Cột/khối tương ứng đổi kích thước mượt theo thao tác kéo.
- [ ] Sau khoảng 3 giây (debounce), kích thước mới được lưu vào `localStorage` key `resize`.

---

# [TC_DASHBOARD_16] Bố cục đã kéo giãn được giữ nguyên sau khi tải lại trang

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Sau khi kéo giãn (TC_DASHBOARD_15) và F5 reload, layout hiển thị đúng với chiều rộng đã
  lưu trong `localStorage.resize` (đọc lại trong `created()`), không quay về mặc định.

## Các bước thực hiện
1. Kéo giãn cột bất kỳ.
2. Tải lại trang (F5).

## Kết quả mong đợi
- [ ] Bố cục giữ nguyên đúng kích thước đã kéo trước đó, không reset về mặc định.

---

# [TC_DASHBOARD_17] Đặt lại bố cục mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click icon "Đặt lại bố cục mặc định" (title tương ứng) sau khi đã kéo giãn → cột trái/
  phải trở lại đúng 30% chiều rộng màn hình, `bTopHeight` về 150, `expandMenuRight = true`, `rightTabIndex = 0`,
  `showFullHeatMap = false` (khớp code `resetResize()`).

## Các bước thực hiện
1. Kéo giãn hoặc thu gọn bố cục theo ý muốn.
2. Click icon "Đặt lại bố cục mặc định" (hình mũi tên tròn, cạnh dải tab dọc bên phải).

## Kết quả mong đợi
- [ ] Toàn bộ bố cục quay về đúng trạng thái mặc định ban đầu (kích thước cột, panel phải mở với IBD, bản đồ
      nhiệt ở chế độ thu nhỏ).

---

## Nhóm: Responsive & Điều hướng

# [TC_DASHBOARD_18] Responsive ở viewport mobile (≤768px)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện khác với đọc code ban đầu**
- **Kết quả đo được:** Ở viewport 375x812, `db-container` chuyển `flex-direction: column` (theo CSS
  `@media (max-width: 768px)`), 3 cột xếp chồng dọc thay vì cạnh nhau, mỗi cột full width, thanh resize ngang bị
  ẩn. **Riêng nút "Đặt lại bố cục mặc định" VẪN hiển thị** — CSS `.btn-reset-resize { display: none }` chỉ ẩn
  bản nút dùng khi panel phải đang **thu gọn** (`expandMenuRight = false`), còn bản nút dùng khi panel phải
  đang **mở rộng** (class `.btn-reset-resize-expend`, mặc định khi mới vào Dashboard) không nằm trong rule CSS
  đó nên vẫn hiển thị bình thường ở cuối cột phải sau khi cuộn xuống — đã verify qua screenshot thực tế.

## Các bước thực hiện
1. Thu nhỏ viewport xuống mobile (VD 375x812).
2. Cuộn xuống hết cột phải (panel IBD/Watchlist/...).

## Kết quả mong đợi
- [ ] Layout xếp dọc, không vỡ, có thể scroll để xem lần lượt cột trái → giữa → phải.
- [ ] Nút "Đặt lại bố cục mặc định" (`.btn-reset-resize-expend`) vẫn hiển thị ở cuối cột phải (không bị ẩn ở
      trạng thái panel phải đang mở rộng — mặc định).
- [ ] Không hiển thị thanh resize ngang.

---

# [TC_DASHBOARD_19] Responsive ở các viewport khác

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Kiểm tra layout ở các viewport: Desktop lớn (1920x1080), Laptop (1366x768), Tablet (768x1024).

## Kết quả mong đợi
- [ ] Layout 3 cột hiển thị hợp lý ở mọi kích thước desktop/tablet ngang, không tràn/vỡ.

---

# [TC_DASHBOARD_20] Click card chỉ số chỉ đổi chỉ số đang chọn, KHÔNG điều hướng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, khác kỳ vọng app**
- **Khác biệt so với app:** Sheet app mô tả click card chỉ số (VD TC_22-24) sẽ "Chuyển sang màn Thị trường, tab/
  sàn tương ứng active". Trên web, click card **KHÔNG điều hướng đi đâu cả** — chỉ gọi
  `changeIndexCode(item)` (`board/Domestic.vue`) để đổi chỉ số đang chọn trong chính widget đó: card được click
  hiển thị viền/nhấn mạnh, khối chi tiết bên dưới (Khối lượng, Giá trị, Mở cửa/Cao/Thấp, biểu đồ Thanh khoản/
  Nước ngoài) đổi sang đúng dữ liệu của chỉ số vừa chọn. Đã verify bằng automation: click "HNXINDEX" → URL vẫn
  giữ nguyên `https://kfsp.vn/dashboard`, dữ liệu chi tiết đổi đúng sang HNXINDEX.

## Các bước thực hiện
1. Đang ở card "VNINDEX" mặc định, click vào card "HNXINDEX".

## Kết quả mong đợi
- [ ] Không điều hướng rời khỏi `/dashboard`.
- [ ] Card "HNXINDEX" được nhấn mạnh (chọn), khối chi tiết + biểu đồ bên dưới đổi đúng sang dữ liệu HNXINDEX.

---

# [TC_DASHBOARD_21] Điều hướng từ menu header sang màn khác rồi quay lại Dashboard

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Từ Dashboard, click menu "Bảng giá" trên header.
2. Click lại "Dashboard" trên header để quay lại.

## Kết quả mong đợi
- [ ] Điều hướng đúng sang `/bang-gia` rồi quay lại đúng `/dashboard`, layout Dashboard khôi phục đúng trạng
      thái mặc định (không lỗi do component bị huỷ/tạo lại).

---

# [TC_DASHBOARD_22] Nút Back của trình duyệt

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Từ Dashboard, điều hướng sang `/bang-gia`.
2. Bấm nút Back của trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng `/dashboard`, hiển thị lại đầy đủ layout.

---

## Tổng hợp trạng thái (22 testcase — chỉ phạm vi khung/shell của Dashboard)

Đã tự động hoá bằng Playwright: [tests/dashboard.spec.ts](../tests/dashboard.spec.ts)
(POM: [pages/DashboardPage.ts](../pages/DashboardPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 22 | Kiến trúc Dashboard web khác hẳn app, không có testcase nào map trực tiếp 1-1 từ Sheet |

**Phát hiện đáng chú ý cần theo dõi:**
1. **⚠️ Nghi vấn rendering:** Khi bấm "Phóng to" bản đồ nhiệt lần đầu, treemap render vỡ/chồng chữ trong chốc
   lát trước khi ổn định — có thể do canvas chưa nhận kích thước container mới kịp thời. Cần điều tra sâu hơn
   khi viết testcase riêng cho widget Bản đồ nhiệt.
2. Bố cục kéo giãn (`aWidth`/`cWidth`/`bTopHeight`) được lưu vào `localStorage` với debounce 3 giây và khôi phục
   đúng sau reload — hành vi đúng như thiết kế, đã verify bằng automation.
3. Route `/dashboard` được bảo vệ đúng bởi router guard `requiresUser`, redirect về
   `/login?redirect=%2Fdashboard` khi chưa đăng nhập, và `Login.vue` tôn trọng query `redirect` sau khi đăng
   nhập thành công.
4. **Khác biệt hành vi so với app:** Click vào card chỉ số (VNINDEX/HNXINDEX/UPCOM/VN30) trên web **không điều
   hướng** sang màn khác như app mô tả — chỉ đổi chỉ số đang xem trong chính widget Dashboard. Không phải bug,
   nhưng là khác biệt UX đáng lưu ý nếu có yêu cầu đồng bộ hành vi với app.

**Ngoài phạm vi lần sinh này (để lại cho các lần gen riêng theo từng widget):** nội dung chi tiết bên trong
Bản đồ nhiệt, IBD, Watchlist, Cảnh báo, Ghi chú, Cộng đồng (panel phải), Chỉ số tâm lý/Chỉ số rủi ro, và 4 tab
thị trường Quốc tế/Crypto/Sự kiện/Vĩ mô.
