# Màn hình: Phân tích cơ bản — Tab "Thông tin chung" — Sub-tab "Nước ngoài" + "Tự doanh"

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
    — sub-tab "Hồ sơ" + "Cổ đông", phát hiện #1/#17: `getListForeignTransaction()`/`getCountPageForeignTransaction()`/
    `getListTransaction()` trong `Common/index.vue` bị bọc `if (!isAccountFree)` khiến donut "Tổng quan" (dùng
    chung `chartdata_co_cau_so_huu`) sai/thiếu vĩnh viễn cho Free — **CHÍNH LÀ đoạn code nằm trong phạm vi tài
    liệu này** (nguồn dữ liệu của bảng "Nước ngoài"), xem phát hiện #2 bên dưới để biết vì sao KHÔNG phải bug
    MỚI dạng bất đối xứng).
  - [phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md](phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md)
    (3/4 — sub-tab "Thông tin giao dịch" + "Sự kiện", phát hiện #4: `getListEvents()` bất đối xứng
    `created()`/`watch` — pattern KHÔNG lặp lại trong tài liệu này, xem phát hiện #2).
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

**#2. [CÂU HỎI QUAN TRỌNG NHẤT — KHÔNG lặp lại pattern "API skip bất đối xứng created()/watch"] Đọc kỹ
`Common/index.vue` (nguồn dữ liệu "Nước ngoài") xác nhận gate `isAccountFree` áp dụng ĐỐI XỨNG, không phải bất
đối xứng như 2 bug đã ghi nhận ở tài liệu 2/4 (donut "Nước ngoài") và 3/4 (bảng "Sự kiện").** Cả `created()`
LẪN `watch: stockcode()` đều bọc CÙNG 3 lệnh gọi (`getCountPageForeignTransaction()`, `getListForeignTransaction(true)`,
`getListTransaction()`) trong CÙNG điều kiện `if (!this.$store.state.isAccountFree) { ... }` — không có sự
khác biệt giữa lần tải đầu và lần đổi mã CK sau đó (khác `getListEvents()` ở tài liệu 3/4, bọc bất đối xứng).
Đo network xác nhận: tài khoản Free gọi **0 request** tới cả 3 API này ở MỌI thời điểm (trang vừa tải, đổi mã
CK, chuyển qua lại sub-tab) — không có "khoảnh khắc dữ liệu đúng rồi sai" như 2 bug trước, vì dữ liệu ĐƠN GIẢN
KHÔNG BAO GIỜ được tải cho Free. Đây CHÍNH LÀ đoạn code gốc của bug đã ghi nhận ĐẦY ĐỦ ở tài liệu 2/4
(TC_PTCB_TTC_HSCD_17, donut "Tổng quan" sai/thiếu "Nước ngoài" vĩnh viễn cho Free) — không phải bug MỚI, nhưng
nằm đúng trong phạm vi tài liệu này nên cần xác nhận lại + cross-reference. Xem TC_PTCB_TTC_NNTD_16.

**#3. [Phát hiện MỚI, khác #2] "Tự doanh" — bảng KHÔNG mount (nên KHÔNG lãng phí request) nhưng biểu đồ VẪN
mount và gọi API lãng phí dù bị `<ProtectedView>` khoá.** `Right.vue` bọc `TableProprietaryTransaction`
(`CCol xl="9"`) trong `<template v-else>` của gate `disable_featureName` (key `fa_tu_doanh`) — Free có key này
trong `features_disabled` nên `v-else` KHÔNG render, component KHÔNG BAO GIỜ mount, `created()` không chạy, 0
request lãng phí. NGƯỢC LẠI, `ChartProprietaryTransaction` (`CCol xl="3"`) chỉ được `Right.vue` bọc
`v-if="type_tab == 'proprietary_transaction'"` (KHÔNG kiểm tra gate ở cấp `Right.vue`) — component LUÔN mount
khi vào sub-tab "Tự doanh" bất kể tài khoản, `created()` chạy bình thường và gọi
`GET /api/proprietary-trading` NGAY LẬP TỨC, chỉ SAU ĐÓ template mới tự che bằng `<ProtectedView>` RIÊNG của
chính nó (`v-if="disable_featureName"` bên trong `ChartProprietaryTransaction.vue`). Đo network xác nhận (tài
khoản Free): request `/api/proprietary-trading?stockcode=VNM...` bắn ra ngay khi click sub-tab "Tự doanh" LẪN
mỗi lần đổi mã CK sau đó (`?stockcode=HPG...`) — dù người dùng Free KHÔNG BAO GIỜ thấy kết quả (bị
`ProtectedView` che). Lãng phí network/tải server, KHÔNG PHẢI bug hiển thị sai dữ liệu (khác 2 bug trước ở tài
liệu 2/4, 3/4) — đáng báo dev nhưng không chặn dùng. Xem TC_PTCB_TTC_NNTD_17.

**#4. Mã ETF (`E1VFVN30`) tái hiện bug NaN% ở donut "Tổng quan" panel "Nước ngoài" — CÙNG root cause đã ghi
nhận ở tài liệu 2/4 (TC_PTCB_TTC_HSCD_16), vì `ChartForeignTransaction.vue` dùng CHUNG prop
`chartdata_co_cau_so_huu` với `ChartAnalysis.vue` (sub-tab "Cổ đông"/"Thông tin giao dịch").** Đo thật (ảnh
chụp): donut hiện "Nhà nước: NaN%"/"Khác: NaN%", chỉ "Nước ngoài: 75.14%" đúng số — giống hệt số liệu đã ghi ở
tài liệu 2/4 (cùng 1 request `common-info` bị lỗi field `so_huu_nha_nuoc` cho mã không phải cổ phiếu thường).
Không assert được qua DOM text (ECharts `CanvasRenderer`), chỉ xác nhận qua ảnh chụp — cùng giới hạn kỹ thuật
đã ghi ở tài liệu 2/4. Xem TC_PTCB_TTC_NNTD_06.

**#5. Cả 2 bảng (`TableForeignTransaction.vue`/`TableProprietaryTransaction.vue`) đều KHÔNG xử lý mảng rỗng —
cùng pattern đã ghi nhận ở `TableShareHolder.vue` (2/4) và `TableInfoTransaction.vue` (3/4).** Không có
`v-if`/slot xử lý rỗng trong `<tbody>`, không có text "Không có dữ liệu" nào. Xác nhận qua mock API rỗng (an
toàn, API chỉ đọc). Xem TC_PTCB_TTC_NNTD_07/12.

**#6. Verify ĐẦY ĐỦ 2 cấp gate `features_disabled` cho cả 2 sub-tab — tài khoản Free hiện tại bị khoá CẢ 2 CẤP
CÙNG LÚC cho CẢ 2 sub-tab (khác "Thông tin giao dịch" ở tài liệu 3/4, chỉ bị khoá 1 cấp).** Đo thật: "Nước
ngoài" — `features_disabled` CÓ `fa_nuoc_ngoai` (khoá `CCol xl="9"`) VÀ `fa_nuoc_ngoai_bieu_do` (khoá
`CCol xl="3"`), đúng 2 `ProtectedView`. "Tự doanh" — CÓ `fa_tu_doanh` VÀ `fa_tu_doanh_bieu_do`, đúng 2
`ProtectedView`. Khớp CHÍNH XÁC dự đoán đã ghi ở tài liệu 1/4 (TC_PTCB_TTC_25). Xem TC_PTCB_TTC_NNTD_14/15.

---

## Nhóm: Sub-tab "Nước ngoài" — Bảng (`TableForeignTransaction.vue`, nhận props từ `Common/index.vue`)

# [TC_PTCB_TTC_NNTD_01] Overview + cấu trúc bảng khi click sub-tab "Nước ngoài"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Bảng có 2 hàng header (nhóm cột "Mua"/"Bán" colspan 2 ở hàng 1; cột con "Khối lượng"/"Giá trị"
  cho mỗi nhóm ở hàng 2) — tổng 10 cột đơn: Ngày, Giá, Mua(KL,GT), Bán(KL,GT), KLGD ròng, GTGD ròng, Room còn
  lại, Đang sở hữu.

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=thong-tin-chung`.
2. Click sub-tab "Nước ngoài".

## Kết quả mong đợi
- [ ] Sub-tab "Nước ngoài" active.
- [ ] Bên trái (`CCol xl="9"`): bảng 2 hàng header đúng cấu trúc trên, có ít nhất 1 dòng dữ liệu.
- [ ] Đủ 10 cột: "Ngày", "Giá", "Khối lượng" (x2, Mua/Bán), "Giá trị" (x2, Mua/Bán), "KLGD ròng", "GTGD ròng",
      "Room còn lại", "Đang sở hữu".

---

# [TC_PTCB_TTC_NNTD_02] Định dạng dữ liệu — màu giá theo %, dấu phẩy nghìn, % sở hữu

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Cột "Giá" có class màu theo `getClassColorByPercent(item.perchange)` (xanh/đỏ theo chiều tăng
  giảm). Cột "Đang sở hữu" có hậu tố "%". Các cột số (Khối lượng/Giá trị/KLGD/GTGD ròng) dùng `formatMoney` có
  dấu phẩy ngăn cách hàng nghìn, kể cả giá trị âm (KLGD/GTGD ròng có thể âm khi bán ròng — hiển thị dấu "-",
  KHÔNG có class màu riêng cho giá trị âm này, khác cột "Giá").

## Các bước thực hiện
1. Từ TC_PTCB_TTC_NNTD_01, quan sát dòng đầu tiên của bảng.

## Kết quả mong đợi
- [ ] Cột "Giá" có class màu (xanh tăng/đỏ giảm) đúng theo dấu %.
- [ ] Cột "Đang sở hữu" có hậu tố "%".
- [ ] Các cột số có dấu phẩy ngăn cách hàng nghìn khi giá trị đủ lớn.

---

# [TC_PTCB_TTC_NNTD_03] Panel bên phải — 2 biểu đồ "Biểu đồ GDNN mua ròng 20 phiên" (cột) + "Tổng quan" (donut)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Donut "Tổng quan" dùng CHUNG prop `chartdata_co_cau_so_huu` với panel "Cổ đông"/"Thông tin giao
  dịch" (`ChartAnalysis.vue`, tài liệu 2/4 + 3/4) nhưng đây là COMPONENT KHÁC (`ChartForeignTransaction.vue`,
  KHÔNG PHẢI tái sử dụng cùng component như "Thông tin giao dịch") — chỉ tái sử dụng CHUNG dữ liệu nguồn. Dùng
  `CanvasRenderer`, không assert được text legend/tooltip qua DOM.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_NNTD_01, quan sát panel bên phải.

## Kết quả mong đợi
- [ ] Nhãn "Biểu đồ GDNN mua ròng 20 phiên" + "Tổng quan" hiển thị đúng thứ tự.
- [ ] Có đúng 2 `<canvas>`, không lỗi console.

---

# [TC_PTCB_TTC_NNTD_04] Phân trang bảng — click trang 2 gọi lại API đúng trang, dữ liệu đổi

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Pagination emit `changePageTableForeignTransaction` lên `Right.vue` rồi lên `Common/index.vue`
  (đổi `current_page_foreign_transaction` → `watch` gọi lại `getListForeignTransaction()` KHÔNG kèm
  `first_request`, nên KHÔNG reset `current_percent_foreign`/donut).

## Các bước thực hiện
1. Từ TC_PTCB_TTC_NNTD_01, ghi nhận dòng đầu bảng.
2. Click link phân trang "Go to page 2".

## Kết quả mong đợi
- [ ] Gọi lại `GET /get-list-foreign-transaction` với `page=2`.
- [ ] Dòng đầu bảng SAU khi chuyển trang khác dòng đầu bảng TRƯỚC đó (dữ liệu ngày khác).

---

# [TC_PTCB_TTC_NNTD_05] Đổi mã CK — bảng + panel cập nhật đúng theo mã mới, không có race condition

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, XÁC NHẬN KHÔNG có race condition: Pass**
- **Ghi chú:** Dữ liệu KHÔNG đọc `store.state.list_mack_company` ở bất kỳ đâu trong luồng này — an toàn 100%
  khỏi race condition đã ghi nhận ở tab "So sánh"/"Biểu đồ" (cùng kết luận đã xác nhận ở tài liệu 2/4, 3/4).

## Các bước thực hiện
1. Từ TC_PTCB_TTC_NNTD_01 (mã VNM), đổi mã CK qua ô tìm kiếm sang "HPG".

## Kết quả mong đợi
- [ ] Bảng cập nhật đúng dữ liệu giao dịch nước ngoài của HPG (khác VNM).
- [ ] Panel bên phải vẫn hiển thị đúng 2 `<canvas>`, không lỗi console.

---

# [TC_PTCB_TTC_NNTD_06] 🆕 [Phát hiện, cross-ref] Mã ETF — donut "Tổng quan" tái hiện bug NaN% đã ghi ở tài liệu 2/4

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **Đã verify PHẦN KHÔNG-CRASH bằng automation; phần nội dung NaN% chỉ
  xác nhận qua ảnh chụp thủ công (không assert được qua code, cùng giới hạn kỹ thuật đã ghi ở tài liệu 2/4)**
- **⚠️ Phát hiện đáng chú ý (bug đã biết, cross-ref):** xem phát hiện #4 đầu tài liệu — CÙNG root cause với
  TC_PTCB_TTC_HSCD_16 (tài liệu 2/4), tái hiện ở đây vì dùng chung `chartdata_co_cau_so_huu`.

## Các bước thực hiện
1. Deep-link `/phan-tich-co-ban?mack=E1VFVN30&tab=thong-tin-chung`, click sub-tab "Nước ngoài".

## Kết quả mong đợi
- [ ] Automation xác nhận được: 2 `<canvas>` vẫn render (không crash), không có lỗi JS console (`pageerror`)
      phát sinh dù dữ liệu `NaN`.
- [ ] (Quan sát thủ công qua ảnh chụp, KHÔNG assert bằng code): donut "Tổng quan" hiển thị "Nhà nước: NaN%" và
      "Khác: NaN%" — chỉ "Nước ngoài: %" hiển thị đúng số (KHÁC 0% do mã ETF vẫn có sở hữu nước ngoài).

---

# [TC_PTCB_TTC_NNTD_07] 🆕 [Phát hiện] Bảng rỗng (mock API) — KHÔNG có thông báo "Không có dữ liệu"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock API `get-list-foreign-transaction` trả về
  mảng rỗng): Pass**
- **Ghi chú:** Xem phát hiện #5 — cùng pattern `TableShareHolder.vue`/`TableInfoTransaction.vue`. Mock an toàn
  vì API chỉ đọc.

## Các bước thực hiện
1. Mock `GET /get-list-foreign-transaction` trả về mảng rỗng `[]`.
2. Vào tab "Thông tin chung", click sub-tab "Nước ngoài".

## Kết quả mong đợi
- [ ] `<tbody>` của bảng có 0 dòng.
- [ ] KHÔNG có bất kỳ text "Không có dữ liệu"/thông báo tương đương nào hiển thị.

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

# [TC_PTCB_TTC_NNTD_12] 🆕 [Phát hiện] Bảng rỗng (mock API) — KHÔNG có thông báo "Không có dữ liệu"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock API `proprietary-trading/paginate` trả về
  mảng rỗng): Pass**
- **Ghi chú:** Xem phát hiện #5 — cùng pattern các bảng khác trong màn hình.

## Các bước thực hiện
1. Mock `GET /api/proprietary-trading/paginate` trả về `{ "data": [], "last_page": 1 }`.
2. Vào tab "Thông tin chung", click sub-tab "Tự doanh".

## Kết quả mong đợi
- [ ] `<tbody>` của bảng có 0 dòng.
- [ ] KHÔNG có bất kỳ text "Không có dữ liệu"/thông báo tương đương nào hiển thị.

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

# [TC_PTCB_TTC_NNTD_15] 🆕 [Phát hiện, cross-ref] Free — "Nước ngoài" KHÔNG lãng phí request nào (gate đối xứng)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **⚠️ Phát hiện đáng chú ý (cross-ref, KHÔNG phải bug mới):** xem phát hiện #2 đầu tài liệu — CÂU TRẢ LỜI cho
  câu hỏi "pattern API skip bất đối xứng có lặp lại không": KHÔNG, gate `isAccountFree` cho "Nước ngoài" đối
  xứng ở cả `created()`/`watch`, nên 0 request ở MỌI thời điểm — khác 2 bug bất đối xứng đã ghi ở tài liệu 2/4
  (donut)/3/4 (Sự kiện).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Theo dõi network, click sub-tab "Nước ngoài".
3. Đổi mã CK qua ô tìm kiếm sang "HPG", tiếp tục theo dõi network.

## Kết quả mong đợi
- [ ] KHÔNG có request nào tới `/get-list-foreign-transaction`, `/get-count-page-foreign-transaction`,
      `/api/foreign-trading` ở CẢ bước 2 LẪN bước 3.

---

# [TC_PTCB_TTC_NNTD_16] 🆕 [Phát hiện MỚI] Free — "Tự doanh": biểu đồ VẪN lãng phí gọi API dù bị khoá, bảng thì
  KHÔNG (do khác cấp gate mount component)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật, phát hiện đáng chú ý:
  Pass**
- **⚠️ Phát hiện đáng chú ý (bug lãng phí network, không phải sai dữ liệu):** xem phát hiện #3 đầu tài liệu.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Theo dõi network, click sub-tab "Tự doanh".
3. Đổi mã CK qua ô tìm kiếm sang "HPG", tiếp tục theo dõi network.

## Kết quả mong đợi
- [ ] KHÔNG có request nào tới `/api/proprietary-trading/paginate` (bảng KHÔNG mount, bị chặn bởi gate cấp
      `Right.vue`).
- [ ] CÓ request tới `/api/proprietary-trading` (KHÔNG phân trang, biểu đồ VẪN mount) ở CẢ bước 2 LẪN bước 3 —
      lãng phí dù nội dung bị `ProtectedView` che ngay sau đó.

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

## Nhóm: Responsive

# [TC_PTCB_TTC_NNTD_19] Responsive viewport mobile/tablet cho cả 2 sub-tab

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị sub-tab "Nước ngoài" đã tải xong dữ liệu, thu nhỏ viewport xuống mobile (375x812) rồi tablet
   (768x1024).
2. Lặp lại với sub-tab "Tự doanh".

## Kết quả mong đợi
- [ ] Cả 2 sub-tab vẫn hiển thị được (có thể xếp chồng dọc/cuộn ngang), không vỡ layout nghiêm trọng ở cả 2
      kích thước.

---

## Tổng hợp trạng thái (19 testcase — phạm vi sub-tab "Nước ngoài" + "Tự doanh")

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.spec.ts](../tests/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.spec.ts)
(POM: section "Tab Thông tin chung — Sub-tab Nước ngoài + Tự doanh" ở cuối
[pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 0 | Không có mục nào trong Sheet app khớp trực tiếp (xem lý do ở đầu tài liệu) |
| 🆕 Mới (riêng web) | 18 | Toàn bộ trừ TC_PTCB_TTC_NNTD_06 |
| ⚠️ Cần xác nhận thêm | 1 | TC_PTCB_TTC_NNTD_06 (phần nội dung NaN% chỉ xác nhận qua ảnh chụp, không assert
  bằng code — cùng giới hạn kỹ thuật đã ghi ở tài liệu 2/4) |

Không có `test.fixme` nào trong file spec này — toàn bộ 19 testcase đều tự động hoá và chạy pass được (kể cả
TC_PTCB_TTC_NNTD_07/12, dùng `page.route()` mock response rỗng cho API chỉ-đọc, an toàn 100% cho tài khoản dùng
chung).

**Phát hiện đáng chú ý cần theo dõi:**
1. **[CÂU TRẢ LỜI cho câu hỏi quan trọng nhất lượt này] Pattern "API skip bất đối xứng `created()`/`watch`"
   KHÔNG lặp lại ở "Nước ngoài"/"Tự doanh".** "Nước ngoài": gate `isAccountFree` trong `Common/index.vue` áp
   dụng ĐỐI XỨNG (cả `created()` lẫn `watch: stockcode()` bọc CÙNG 3 API), nên Free luôn nhận 0 request ở MỌI
   thời điểm — không có "khoảnh khắc sai rồi đúng"/"đúng rồi sai" như 2 bug trước. Đoạn code này CHÍNH LÀ
   nguồn gốc bug donut đã ghi nhận ĐẦY ĐỦ ở tài liệu 2/4 (TC_PTCB_TTC_HSCD_17) — không phải bug mới, chỉ
   cross-reference lại vì nằm trong phạm vi tài liệu này. "Tự doanh": KHÔNG có bất kỳ check `isAccountFree`
   nào trong 2 component tự fetch riêng — hoàn toàn đối xứng, không có bug ẩn kiểu dữ liệu sai/thiếu. Xem phát
   hiện #2, TC_PTCB_TTC_NNTD_15.
2. **[Phát hiện MỚI] "Tự doanh" — biểu đồ lãng phí gọi API dù bị khoá gói hội viên, bảng thì không.**
   `ChartProprietaryTransaction.vue` (`CCol xl="3"`) chỉ bị `Right.vue` `v-if` theo `type_tab` (KHÔNG kiểm tra
   gate), nên LUÔN mount và gọi API ngay cả khi tự che bằng `ProtectedView` riêng ngay sau đó — khác
   `TableProprietaryTransaction.vue` (`CCol xl="9"`), bị `Right.vue` chặn mount HOÀN TOÀN qua `<template
   v-else>` của gate, nên không lãng phí. Lãng phí network/tải server cho tài khoản Free, không phải bug hiển
   thị sai dữ liệu. Xem phát hiện #3, TC_PTCB_TTC_NNTD_16.
3. **[Kiến trúc] "Tự doanh" tự chủ 2 API riêng (bảng + biểu đồ, không chia sẻ cache), khác "Nước ngoài" (dùng
   chung state đã fetch sẵn từ `Common/index.vue` qua props).** Cả 2 sub-tab đều phản ứng đúng khi đổi mã CK,
   không có race condition (không đọc `store.state.list_mack_company` ở bất kỳ đâu trong phạm vi này). Xem
   phát hiện #1, TC_PTCB_TTC_NNTD_01/08/09/11.
4. **Mã ETF tái hiện bug NaN% ở donut "Tổng quan" panel "Nước ngoài"** — cùng root cause đã ghi ở tài liệu 2/4
   (dùng chung `chartdata_co_cau_so_huu`), chỉ xác nhận được qua ảnh chụp (ECharts canvas, không assert DOM
   text được). Xem phát hiện #4, TC_PTCB_TTC_NNTD_06.
5. **Cả 2 bảng không xử lý mảng rỗng** — cùng pattern `TableShareHolder.vue` (2/4)/`TableInfoTransaction.vue`
   (3/4), không có thông báo "Không có dữ liệu". Xem phát hiện #5, TC_PTCB_TTC_NNTD_07/12.
6. **Verify đầy đủ 2 cấp gate `features_disabled` — "Nước ngoài" VÀ "Tự doanh" là 2 sub-tab DUY NHẤT trong toàn
   bộ tab "Thông tin chung" bị khoá CẢ 2 CẤP CÙNG LÚC với tài khoản Free hiện tại** (khác "Thông tin giao dịch",
   chỉ khoá 1 cấp — tài liệu 3/4) — khớp đúng dự đoán đã ghi ở tài liệu 1/4 (TC_PTCB_TTC_25). Xem phát hiện #6,
   TC_PTCB_TTC_NNTD_13/14.
7. **Không có API mutate nào trong phạm vi 2 sub-tab này** — toàn bộ chỉ đọc, an toàn tuyệt đối cho tài khoản
   test dùng chung.
8. **Sheet app không có mục nào khớp "Tự doanh"** (xác nhận đúng dự đoán ở đề bài — tính năng hoàn toàn mới
   trên web) và mục "Tab Giao dịch - Nước ngoài"/"Thống kê GDNN" (TC ID 822-958) mô tả 1 widget real-time hoàn
   toàn khác `TableForeignTransaction.vue` (bảng lịch sử theo ngày) — không map được testcase nào.

---

## Tổng kết 4/4 tài liệu con tab "Thông tin chung" (HOÀN TẤT)

Đây là lượt sinh testcase CUỐI CÙNG (4/4) của tab "Thông tin chung" — cũng là lượt cuối theo kế hoạch ban đầu
cho toàn bộ màn hình "Phân tích cơ bản". Đủ 4/4 tài liệu con:

1. [phan-tich-co-ban-thong-tin-chung.md](phan-tich-co-ban-thong-tin-chung.md) — Khung/shell + sub-tab mặc định
   "Thông tin tài chính" (27 testcase).
2. [phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md](phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md) —
   Sub-tab "Hồ sơ" + "Cổ đông" (22 testcase).
3. [phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md](phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md)
   — Sub-tab "Thông tin giao dịch" + "Sự kiện" (22 testcase).
4. phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md (tài liệu này) — Sub-tab "Nước ngoài" + "Tự doanh" (19
   testcase).
