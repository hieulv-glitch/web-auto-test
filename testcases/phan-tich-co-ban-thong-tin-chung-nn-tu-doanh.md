# Màn hình: Phân tích cơ bản — Tab "Thông tin chung" — Sub-tab "Nước ngoài" + "Tự doanh"

**Cập nhật 10/11/2026:** chạy lại trên localhost:8080 (nhánh `preprod`, backend PRODUCTION). Đăng nhập chuyển sang
`FaAnalysisPage.login()` (phiên cache `Prev2Session`, chặn ghi setting) + lưới `FaSafetyNet`; bỏ bước reset về VNM
cuối test.

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=thong-tin-chung`, sau đó click sub-tab con "Nước ngoài" hoặc "Tự
  doanh" (bên trong thanh 7 sub-tab của `Right.vue`) — KHÔNG có query param riêng cho sub-tab con (cùng cách xác
  nhận đã dùng ở 2 tài liệu con trước: `Right.vue data(): type_tab` là state cục bộ, không đọc `$route.query`).
- **Component:**
  [stocks/src/views/faAnalysis/Common/Right.vue](../../stocks/src/views/faAnalysis/Common/Right.vue) render:
  - Sub-tab **"Nước ngoài"** (`type_tab == 'foreign_transaction'`): `CCol xl="9"` =
    [TableForeignTransaction.vue](../../stocks/src/views/faAnalysis/Common/TableForeignTransaction.vue) (bảng
    giao dịch khối ngoại theo ngày — Mua/Bán/KLGD ròng/GTGD ròng/Room còn lại/Đang sở hữu) — `CCol xl="3"` =
    [ChartForeignTransaction.vue](../../stocks/src/views/faAnalysis/Common/ChartForeignTransaction.vue) (biểu đồ
    cột "GDNN mua ròng 20 phiên" + donut "Tổng quan", feature key riêng `fa_nuoc_ngoai_bieu_do`).
    **CẢ 2 component KHÔNG tự gọi API** — hoàn toàn nhận dữ liệu qua `props` từ `Common/index.vue` (qua
    `Right.vue` trung chuyển): `list_foreign_transaction`/`count_page_foreign_transaction` (bảng),
    `chartdata_co_cau_so_huu`/`list_value_net_20_day_recent` (biểu đồ).
  - Sub-tab **"Tự doanh"** (`type_tab == 'proprietary_transaction'`): `CCol xl="9"` =
    [TableProprietaryTransaction.vue](../../stocks/src/views/faAnalysis/Common/TableProprietaryTransaction.vue)
    (bảng giao dịch tự doanh — cấu trúc TƯƠNG TỰ "Nước ngoài" nhưng ÍT HƠN 2 cột "Room còn lại"/"Đang sở hữu") —
    `CCol xl="3"` =
    [ChartProprietaryTransaction.vue](../../stocks/src/views/faAnalysis/Common/ChartProprietaryTransaction.vue)
    (1 biểu đồ cột "GDTD mua ròng 20 phiên", feature key riêng `fa_tu_doanh_bieu_do`). **KHÁC HẲN "Nước ngoài" —
    cả 2 component NÀY TỰ GỌI API RIÊNG** (không nhận props từ `Right.vue`/`Common/index.vue`, xem "Component"
    props rỗng `props: []` của cả 2 file): bảng gọi `GET /api/proprietary-trading/paginate` (tự phân trang
    trong chính nó), biểu đồ gọi `GET /api/proprietary-trading` (KHÔNG phân trang, endpoint RIÊNG khác bảng) —
    2 lệnh gọi API riêng biệt cho cùng 1 khái niệm dữ liệu, không chia sẻ cache. Xem phát hiện #1.
  - **⚠️ KHÁC BIỆT KIẾN TRÚC QUAN TRỌNG (xem phát hiện #2/#3):** vì "Nước ngoài" phụ thuộc HOÀN TOÀN vào state
    của `Common/index.vue` (bị gate `isAccountFree` ĐỐI XỨNG ở cả `created()` LẪN `watch: stockcode()`) trong
    khi "Tự doanh" tự chủ hoàn toàn (không có bất kỳ check `isAccountFree` nào), 2 sub-tab này có hành vi RẤT
    KHÁC NHAU với tài khoản Free dù cả 2 đều bị `<ProtectedView>` khoá ở UI.
- **⚠️ Tài liệu này là 4/4 (LƯỢT CUỐI) tài liệu con của tab "Thông tin chung"** (tab này quá lớn nên chia làm 4
  lượt sinh testcase). Đọc trước 3 tài liệu còn lại — ĐẶC BIỆT mục "Phát hiện đáng chú ý" của từng tài liệu vì
  các pattern bug/gate lặp lại xuyên suốt:
  - [phan-tich-co-ban-thong-tin-chung.md](phan-tich-co-ban-thong-tin-chung.md) (1/4 — khung/shell + sub-tab mặc
    định "Thông tin tài chính", phát hiện #1/#1b: 2 cơ chế gate `features_disabled` độc lập cấp `CCol xl="9"` và
    `CCol xl="3"`, đã xác nhận trước "Nước ngoài"/"Tự doanh" là 2 sub-tab DUY NHẤT bị khoá CẢ 2 cấp với tài khoản
    Free hiện tại).
  - [phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md](phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md) (2/4
    — sub-tab "Hồ sơ" + "Cổ đông").
  - [phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md](phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md)
    (3/4 — sub-tab "Thông tin giao dịch" + "Sự kiện").
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Đối chiếu với Sheet "Phân Tích FA(Cổ Phiếu)" (đã dump sẵn, 305 dòng). TC ID
  822-958 ("Tab Giao dịch - Nước ngoài"/"Thống kê GDNN") mô tả 1 WIDGET HOÀN TOÀN KHÁC: biểu đồ đường real-time
  trong phiên (toggle "1 Ngày"/"20 Ngày", cập nhật real-time, legend riêng) — KHÔNG map được testcase nào sang
  `TableForeignTransaction.vue` (web, bảng LỊCH SỬ theo ngày, không real-time, không toggle 1/20 ngày).
  **"Tự doanh" KHÔNG có mục nào trong Sheet** (xác nhận đúng dự đoán ở đề bài — tính năng hoàn toàn mới trên
  web, app không có khái niệm "giao dịch tự doanh"). Toàn bộ 20 testcase trong tài liệu này vì vậy đều là 🆕
  **Testcase mới**, không gắn "Tham chiếu App".
- **Quy ước trạng thái:** giống `phan-tich-co-ban.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng web) ·
  ⚠️ Cần xác nhận thêm.
- **⚠️ AN TOÀN DỮ LIỆU:** Toàn bộ API trong phạm vi 2 sub-tab này CHỈ ĐỌC (`get-list-foreign-transaction`,
  `get-count-page-foreign-transaction`, `api/foreign-trading`, `api/proprietary-trading`,
  `api/proprietary-trading/paginate`). Không có action mutate nào qua UI (không có nút thêm/sửa/xoá giao dịch).
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Test đổi mã CK trong file này dùng `?mack=` (query, không dùng
  path param) và luôn reset về VNM ở cuối test đổi mã. 5 test dùng tài khoản Free GỘP chung 1
  `test.describe.configure({ mode: 'serial' })` DUY NHẤT (bài học đã rút ra từ tài liệu 2/4 và 3/4: chạy song
  song nhiều describe Free riêng lẻ gây `test.skip` giả do tranh chấp phiên đăng nhập).

## Phát hiện đáng chú ý — đọc trước khi viết/chạy test

**#1. [Kiến trúc] "Tự doanh" tự chủ hoàn toàn — 2 API RIÊNG (`.../proprietary-trading` không phân trang cho
biểu đồ, `.../proprietary-trading/paginate` phân trang cho bảng) cho CÙNG 1 khái niệm dữ liệu, khác hẳn "Nước
ngoài" (bảng + biểu đồ dùng CHUNG state đã fetch sẵn từ `Common/index.vue`, truyền xuống qua props).**
`TableProprietaryTransaction.vue`/`ChartProprietaryTransaction.vue` đều `props: []` (rỗng), tự `axios.get()`
trong `created()` riêng của từng component — không có cơ chế chia sẻ cache giữa 2 lệnh gọi. Cả 2 đều
`watch: "$store.state.mack"` (đọc thẳng store, KHÔNG qua `computed: stockcode` như `Common/index.vue`) — vẫn
phản ứng đúng khi đổi mã CK dù độc lập hoàn toàn với `watch: stockcode()` của component cha. Không phải bug
(dữ liệu vẫn đúng), nhưng là điểm khác biệt kiến trúc đáng chú ý khi đọc source lần đầu. Xem TC_PTCB_TTC_NNTD_08/09.

**#2–#5:** đã xoá 10/11/2026 (tài khoản Free không gọi API "Nước ngoài"/biểu đồ "Tự doanh" vẫn gọi API khi bị khoá;
donut NaN% với mã ETF; 2 bảng rỗng không có thông báo — user chấp nhận, xoá TC_PTCB_TTC_NNTD_06/07/12/15/16).

**#6. Verify ĐẦY ĐỦ 2 cấp gate `features_disabled` cho cả 2 sub-tab — tài khoản Free hiện tại bị khoá CẢ 2 CẤP
CÙNG LÚC cho CẢ 2 sub-tab (khác "Thông tin giao dịch" ở tài liệu 3/4, chỉ bị khoá 1 cấp).** Đo thật: "Nước
ngoài" — `features_disabled` CÓ `fa_nuoc_ngoai` (khoá `CCol xl="9"`) VÀ `fa_nuoc_ngoai_bieu_do` (khoá
`CCol xl="3"`), đúng 2 `ProtectedView`. "Tự doanh" — CÓ `fa_tu_doanh` VÀ `fa_tu_doanh_bieu_do`, đúng 2
`ProtectedView`. Khớp CHÍNH XÁC dự đoán đã ghi ở tài liệu 1/4 (TC_PTCB_TTC_25). Xem TC_PTCB_TTC_NNTD_13/14.

---

## Nhóm: Sub-tab "Nước ngoài" — Bảng (`TableForeignTransaction.vue`, nhận props từ `Common/index.vue`)

# [TC_PTCB_TTC_NNTD_03] Panel bên phải — 2 biểu đồ "Biểu đồ GDNN mua ròng 20 phiên" (cột) + "Tổng quan" (donut)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Donut "Tổng quan" dùng CHUNG prop `chartdata_co_cau_so_huu` với panel "Cổ đông"/"Thông tin giao
  dịch" (`ChartAnalysis.vue`, tài liệu 2/4 + 3/4) nhưng đây là COMPONENT KHÁC (`ChartForeignTransaction.vue`,
  KHÔNG PHẢI tái sử dụng cùng component như "Thông tin giao dịch") — chỉ tái sử dụng CHUNG dữ liệu nguồn. Dùng
  `CanvasRenderer`, không assert được text legend/tooltip qua DOM.

## Các bước thực hiện
1. Mở sub-tab "Nước ngoài", quan sát panel bên phải.

## Kết quả mong đợi
- [ ] Nhãn "Biểu đồ GDNN mua ròng 20 phiên" + "Tổng quan" hiển thị đúng thứ tự.
- [ ] Có đúng 2 `<canvas>`, không lỗi console.

---

## Nhóm: Sub-tab "Tự doanh" — Bảng + biểu đồ tự fetch riêng (`TableProprietaryTransaction.vue` +
  `ChartProprietaryTransaction.vue`)

# [TC_PTCB_TTC_NNTD_08] Overview + cấu trúc bảng khi click sub-tab "Tự doanh" — TỰ gọi API riêng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Xem phát hiện #1 — bảng 2 hàng header giống "Nước ngoài" nhưng ÍT HƠN 2 cột "Room còn lại"/"Đang
  sở hữu" (8 cột đơn: Ngày, Giá, Mua(KL,GT), Bán(KL,GT), KLGD ròng, GTGD ròng). Component tự gọi
  `GET /api/proprietary-trading/paginate` trong `created()` riêng — KHÔNG nhận props từ `Right.vue`.

## Các bước thực hiện
1. Từ tab "Thông tin chung" (mã VNM), theo dõi network, click sub-tab "Tự doanh".

## Kết quả mong đợi
- [ ] Gọi đúng 1 request `GET /api/proprietary-trading/paginate?stockcode=VNM...`.
- [ ] Bảng có 2 hàng header, đủ 8 cột, có ít nhất 1 dòng dữ liệu.

---

# [TC_PTCB_TTC_NNTD_09] Panel bên phải — 1 biểu đồ "Biểu đồ GDTD mua ròng 20 phiên", API riêng khác bảng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Xem phát hiện #1 — CHỈ 1 biểu đồ (khác "Nước ngoài" có 2: bar + donut, vì "Tự doanh" không có
  khái niệm "cơ cấu sở hữu"). Component tự gọi `GET /api/proprietary-trading` (KHÔNG phân trang) — endpoint
  KHÁC bảng dùng.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_NNTD_08, theo dõi network đã ghi nhận + quan sát panel bên phải.

## Kết quả mong đợi
- [ ] Có request `GET /api/proprietary-trading?stockcode=VNM...` (KHÔNG có tham số `page`, khác request của
      bảng).
- [ ] Nhãn "Biểu đồ GDTD mua ròng 20 phiên" hiển thị, đúng 1 `<canvas>`, không lỗi console.

---

# [TC_PTCB_TTC_NNTD_10] Phân trang bảng "Tự doanh" — tự chứa, KHÔNG qua `Right.vue`/`Common/index.vue`

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Khác "Nước ngoài" (pagination emit lên component cha) — `TableProprietaryTransaction.vue` tự
  quản lý `current_page`/`watch` nội bộ, gọi lại `getDataProprietary()` của CHÍNH NÓ.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_NNTD_08, ghi nhận dòng đầu bảng.
2. Click link phân trang "Go to page 2".

## Kết quả mong đợi
- [ ] Gọi lại `GET /api/proprietary-trading/paginate` với `page=2`.
- [ ] Dòng đầu bảng SAU khi chuyển trang khác dòng đầu bảng TRƯỚC đó.

---

# [TC_PTCB_TTC_NNTD_11] Đổi mã CK — bảng + biểu đồ TỰ cập nhật qua `watch: "$store.state.mack"` riêng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, XÁC NHẬN KHÔNG có race condition: Pass**
- **Ghi chú:** Xem phát hiện #1 — cả 2 component `watch` thẳng `$store.state.mack` (không qua `computed:
  stockcode` của `Common/index.vue`), vẫn phản ứng đúng dù độc lập hoàn toàn với component cha.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_NNTD_08 (mã VNM), theo dõi network, đổi mã CK qua ô tìm kiếm sang "HPG".

## Kết quả mong đợi
- [ ] Gọi lại CẢ 2 API: `GET /api/proprietary-trading/paginate?stockcode=HPG...` VÀ
      `GET /api/proprietary-trading?stockcode=HPG...`.
- [ ] Bảng + biểu đồ cập nhật đúng dữ liệu HPG (khác VNM), không lỗi console.

---

## Nhóm: Gate `features_disabled` (Free) — 2 cấp độc lập cho từng sub-tab, chạy tuần tự

# [TC_PTCB_TTC_NNTD_13] Free — "Nước ngoài" bị khoá CẢ 2 cấp (`fa_nuoc_ngoai` + `fa_nuoc_ngoai_bieu_do`)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #6 — khớp đúng dự đoán TC_PTCB_TTC_25 (tài liệu 1/4).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Nước ngoài".

## Kết quả mong đợi
- [ ] Đúng 2 `ProtectedView` trên toàn trang (nội dung chính `CCol xl="9"` LẪN panel biểu đồ `CCol xl="3"` đều
      bị khoá).

---

# [TC_PTCB_TTC_NNTD_14] Free — "Tự doanh" bị khoá CẢ 2 cấp (`fa_tu_doanh` + `fa_tu_doanh_bieu_do`)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #6.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Tự doanh".

## Kết quả mong đợi
- [ ] Đúng 2 `ProtectedView` trên toàn trang.

---

## Nhóm: Tương tác chung + Xác nhận phạm vi

# [TC_PTCB_TTC_NNTD_17] Chuyển qua lại "Nước ngoài" ↔ "Tự doanh" nhiều lần không lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click "Nước ngoài" → "Tự doanh" → "Nước ngoài" → "Tự doanh", lặp lại 2 vòng liên tiếp.

## Kết quả mong đợi
- [ ] Sau vòng cuối, nội dung sub-tab đang active hiển thị đúng, không có lỗi JS console (`pageerror`) phát
      sinh trong suốt quá trình.

---

# [TC_PTCB_TTC_NNTD_18] 🆕 [Xác nhận phạm vi] Không có donut "Tổng quan"/"Cổ đông lớn" (`ChartAnalysis.vue`)
  lọt vào 2 sub-tab này

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, xác nhận phạm vi: Pass**
- **Ghi chú:** Khác "Thông tin giao dịch" (tài liệu 3/4) TÁI SỬ DỤNG NGUYÊN `ChartAnalysis.vue` — "Nước
  ngoài"/"Tự doanh" dùng 2 component RIÊNG (`ChartForeignTransaction.vue`/`ChartProprietaryTransaction.vue`),
  không có label "Cổ đông lớn" nào xuất hiện.

## Các bước thực hiện
1. Click sub-tab "Nước ngoài", kiểm tra panel bên phải.
2. Click sub-tab "Tự doanh", kiểm tra panel bên phải.

## Kết quả mong đợi
- [ ] Cả 2 bước: KHÔNG có label "Cổ đông lớn" nào xuất hiện trong panel bên phải (khác "Cổ đông"/"Thông tin
      giao dịch").

---

## Tổng hợp trạng thái (9 testcase — phạm vi sub-tab "Nước ngoài" + "Tự doanh")

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.spec.ts](../tests/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.spec.ts)
(POM: section "Tab Thông tin chung — Sub-tab Nước ngoài + Tự doanh" ở cuối
[pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 0 | Không có mục nào trong Sheet app khớp trực tiếp (xem lý do ở đầu tài liệu) |
| 🆕 Mới (riêng web) | 9 | TC_PTCB_TTC_NNTD_03, 08, 09, 10, 11, 13, 14, 17, 18 |
| ⚠️ Cần xác nhận thêm | 0 | — |

**Cập nhật 10/11/2026:** xoá TC_PTCB_TTC_NNTD_01, 02, 04, 05, 06, 07, 12, 15, 16, 19 (bug được user chấp nhận; 01/02/04/05/19 là 5 `test.fixme` do backend trả bảng khối ngoại rỗng) → không còn `test.fixme`, 9 testcase còn lại đều tự động hoá.

**Phát hiện đáng chú ý cần theo dõi:**
1. **[Kiến trúc] "Tự doanh" tự chủ 2 API riêng (bảng + biểu đồ, không chia sẻ cache), khác "Nước ngoài" (dùng
   chung state đã fetch sẵn từ `Common/index.vue` qua props).** Cả 2 sub-tab đều phản ứng đúng khi đổi mã CK,
   không có race condition (không đọc `store.state.list_mack_company` ở bất kỳ đâu trong phạm vi này). Xem
   phát hiện #1, TC_PTCB_TTC_NNTD_08/09/11.
2. **Verify đầy đủ 2 cấp gate `features_disabled` — "Nước ngoài" VÀ "Tự doanh" là 2 sub-tab DUY NHẤT trong toàn
   bộ tab "Thông tin chung" bị khoá CẢ 2 CẤP CÙNG LÚC với tài khoản Free hiện tại** (khác "Thông tin giao dịch",
   chỉ khoá 1 cấp — tài liệu 3/4) — khớp đúng dự đoán đã ghi ở tài liệu 1/4 (TC_PTCB_TTC_25). Xem phát hiện #6,
   TC_PTCB_TTC_NNTD_13/14.
3. **Không có API mutate nào trong phạm vi 2 sub-tab này** — toàn bộ chỉ đọc, an toàn tuyệt đối cho tài khoản
   test dùng chung.
4. **Sheet app không có mục nào khớp "Tự doanh"** (xác nhận đúng dự đoán ở đề bài — tính năng hoàn toàn mới
   trên web) và mục "Tab Giao dịch - Nước ngoài"/"Thống kê GDNN" (TC ID 822-958) mô tả 1 widget real-time hoàn
   toàn khác `TableForeignTransaction.vue` (bảng lịch sử theo ngày) — không map được testcase nào.

---

## Tổng kết 4/4 tài liệu con tab "Thông tin chung" (HOÀN TẤT)

Đây là lượt sinh testcase CUỐI CÙNG (4/4) của tab "Thông tin chung" — cũng là lượt cuối theo kế hoạch ban đầu
cho toàn bộ màn hình "Phân tích cơ bản". Đủ 4/4 tài liệu con:

1. [phan-tich-co-ban-thong-tin-chung.md](phan-tich-co-ban-thong-tin-chung.md) — Khung/shell + sub-tab mặc định
   "Thông tin tài chính" (25 testcase).
2. [phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md](phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md) —
   Sub-tab "Hồ sơ" + "Cổ đông" (19 testcase).
3. [phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md](phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md)
   — Sub-tab "Thông tin giao dịch" + "Sự kiện" (18 testcase).
4. phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md (tài liệu này) — Sub-tab "Nước ngoài" + "Tự doanh" (9
   testcase).

Số testcase trên là sau lần xoá ngày 10/11/2026 (bug được user chấp nhận).
