# Màn hình: Phân tích cơ bản — Tab "Thông tin chung" — Khung/Shell + Sub-tab mặc định "Thông tin tài chính"

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=thong-tin-chung` (đây là tab MẶC ĐỊNH của màn "Phân tích cơ bản",
  không cần `?tab=` cũng vào được nhưng dùng tường minh cho rõ ràng).
- **Component:** [stocks/src/views/faAnalysis/Common/index.vue](../../stocks/src/views/faAnalysis/Common/index.vue)
  (`name: "Common"`) — shell 2 cột: cột trái
  [Left.vue](../../stocks/src/views/faAnalysis/Common/Left.vue) (biểu đồ nến + bảng "Thông tin chung" công ty,
  LUÔN hiển thị bất kể sub-tab nào đang active) + cột phải
  [Right.vue](../../stocks/src/views/faAnalysis/Common/Right.vue) (thanh 7 sub-tab + nội dung tương ứng).
- **⚠️ Tài liệu này là 1/4 tài liệu con của tab "Thông tin chung"** (tab này quá lớn nên chia làm 4 lượt sinh
  testcase). Tài liệu này CHỈ phủ **khung/shell** (cột trái Left.vue + 7 sub-tab switcher của Right.vue, chỉ xác
  nhận tồn tại + chuyển được, KHÔNG đi sâu nội dung 6 sub-tab kia) và **sub-tab MẶC ĐỊNH "Thông tin tài chính"**
  (bảng snapshot BS/KQKD/Chỉ số tài chính theo quý + 3 biểu đồ bên phải). 3 tài liệu còn lại (sẽ sinh ở các lượt
  sau) phủ nội dung chi tiết của 6 sub-tab còn lại:
  - `phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md` — sub-tab "Hồ sơ" + "Cổ đông".
  - `phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md` — sub-tab "Thông tin giao dịch" + "Sự kiện".
  - `phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md` — sub-tab "Nước ngoài" + "Tự doanh".
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Đối chiếu với Sheet "Phân Tích FA(Cổ Phiếu)" (đã dump sẵn, 305 dòng) — **KHÔNG
  có mục nào khớp trực tiếp** với bảng snapshot "Thông tin tài chính" (bảng gộp Tài sản/KQKD/Chỉ số tài chính
  theo quý) hay layout 2 cột tổng thể này. App có tab riêng "Báo cáo TC"/"Chỉ tiêu TC" tách biệt (đã map sang
  tab "Tài chính doanh nghiệp" của web, xem `phan-tich-co-ban-tai-chinh-doanh-nghiep.md`), KHÔNG có khái niệm
  bảng snapshot gộp 3 nhóm dữ liệu này. Toàn bộ testcase trong tài liệu này vì vậy đều là 🆕 **Testcase mới**,
  không gắn "Tham chiếu App".
- **Quy ước trạng thái:** giống `phan-tich-co-ban.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng web) ·
  ⚠️ Cần xác nhận thêm.
- **⚠️ AN TOÀN DỮ LIỆU:** `Left.vue` có 2 icon mở modal có khả năng MUTATE dữ liệu thật của tài khoản test dùng
  chung: icon "star" (`AddWatchListDropdown`, `POST/DELETE /api/watchlist`) và icon "Tạo cảnh báo"/"Thêm giao
  dịch" (modal TOÀN SITE khai báo trong `TheContainer.vue`). Testcase trong tài liệu này CHỈ verify modal/dropdown
  MỞ ĐƯỢC (đúng UI), KHÔNG thao tác tiếp bên trong (không "Thêm", không "Lưu") — không có request mutate nào lọt
  ra production trong toàn bộ file spec này. Mọi API còn lại của phạm vi này (`/api/stocks/economic-info`,
  `/api/stocks/common-info`, socket `getlive`/`getdataanalysis`) đều CHỈ ĐỌC.
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Các test đổi mã CK trong file này (`?mack=`, không dùng path param)
  đều dùng mã trung tính (VNM/VCB) và không mutate dữ liệu server-side nào khác ngoài `final_mack`.

## Phát hiện đáng chú ý — đọc trước khi viết/chạy test

**#0. [XÁC NHẬN AN TOÀN] Không có bug race condition "trống vĩnh viễn" giống tab "So sánh"/"Biểu đồ" — nhưng CÓ
1 trạng thái trống TẠM THỜI tự phục hồi.** Đề bài gốc yêu cầu kiểm tra kỹ vì nghi ngờ `Left.vue` (biểu đồ nến +
bảng công ty) cũng phụ thuộc `list_mack_company` (nạp bất đồng bộ qua socket `TheContainer.getAllMack()`, cùng
state gây bug ở 2 tab kia). Đo thật bằng automation (deep-link thẳng `?mack=VCB&tab=thong-tin-chung`, 1 lượt
`page.goto()`, theo dõi tại 3 mốc thời gian 0.5s/1s/5s):

- `company_name`/`board` (`Left.vue computed`) đọc `store.state.list_mack_company[stockcode]` — **CÓ** trống
  tạm thời (~500ms-1s đầu, header hiển thị rỗng), nhưng vì đây là **`computed` REACTIVE** (khác `Compare.getAll()`
  tính `type_mack` MỘT LẦN không phản ứng), tự động cập nhật đúng ngay khi `list_mack_company` nạp xong — đo
  được hiển thị đúng "Ngân hàng TMCP Ngoại thương Việt Nam (VCB) - HOSE" sau ~5s, KHÔNG cần thao tác gì thêm
  (khác hẳn cách phục hồi thủ công bắt buộc ở bug tab So Sánh). Xem TC_PTCB_TTC_12.
- Trường "Sàn niêm yết" trong bảng "Thông tin chung" (đọc CÙNG state nhưng bên trong `.then()` của API
  `common-info`, tính 1 LẦN không reactive) — đo thật KHÔNG phát sinh lỗi vì độ trễ HTTP response tự nhiên (~1-2s)
  đã đủ để `list_mack_company` (nạp qua socket, gần như tức thời) sẵn sàng trước — nhưng đây là sự trùng hợp về
  thời gian mạng, KHÔNG phải cơ chế bảo vệ chủ đích như đã thấy ở tab "Tài chính doanh nghiệp" (đọc thẳng từ
  response API). Không kết luận đây là bug vì chưa đo được trường hợp thật nào bị treo trống.
- 3 biểu đồ bên phải sub-tab "Thông tin tài chính" (`ChartEconomicInfo`/`ChartEconomicByBank`) — `type_bank` đọc
  từ CHÍNH response API `/api/stocks/economic-info` (`getDataChart()` trong `Common/index.vue`), KHÔNG đọc
  `store.state.list_mack_company` ở bất kỳ đâu — AN TOÀN 100%, CÙNG PATTERN đã xác nhận ở tab "Tài chính doanh
  nghiệp" (khác hẳn bug thật đã ghi nhận ở tab "Biểu đồ": `nhom_stockcode` đọc sai `undefined != 'bank'` khiến
  mã ngân hàng luôn mount nhầm `ChartByNonBank` trước, gọi API sai gây lỗi 500). Xem TC_PTCB_TTC_13/21.

**#1. Gate cấp WIDGET riêng của `Right.vue` (`features_disabled`, ĐỘC LẬP với gate cấp shell/tab chính đã ghi
nhận ở `phan-tich-co-ban.md` TC_PTCB_16) — áp dụng cho 6/7 sub-tab, sub-tab mặc định "Thông tin tài chính" và
"Hồ sơ" KHÔNG BAO GIỜ bị khoá qua cơ chế này.** `computed: featureName()` trong `Right.vue` tính theo `type_tab`
hiện tại: `share_holder`→`fa_co_dong`, `transaction_info`→`fa_giao_dich_noi_bo`, `foreign_transaction`→
`fa_nuoc_ngoai`, `proprietary_transaction`→`fa_tu_doanh`, `event`→`fa_su_kien`, `financial_info`→`null`, `profile`
→KHÔNG có case riêng nên luôn `null`. Đo thật `localStorage.features_disabled` của tài khoản Free hiện tại: CÓ
`fa_giao_dich_noi_bo`/`fa_nuoc_ngoai`/`fa_tu_doanh` (→ 3 sub-tab "Thông tin giao dịch"/"Nước ngoài"/"Tự doanh" bị
`<ProtectedView>` che), KHÔNG có `fa_co_dong`/`fa_su_kien` (→ "Cổ đông"/"Sự kiện" hiển thị bình thường dù code hỗ
trợ khoá). `<ProtectedView v-if="disable_featureName">` (trong CHÍNH `Right.vue`) chỉ bọc `CCol xl="9"` (khu vực
bảng/nội dung chính bên trái của Right.vue) — không bọc `CCol xl="3"` bên phải. Xem TC_PTCB_TTC_24/25/26. Chi
tiết nội dung từng sub-tab bị/không bị khoá thuộc phạm vi 3 tài liệu con sau.

**#1b. [ĐÍNH CHÍNH so với giả định ban đầu] `CCol xl="3"` (biểu đồ phụ trợ) KHÔNG PHẢI "không bao giờ bị gate"
— mỗi component biểu đồ con TỰ CÓ `<ProtectedView>` RIÊNG với feature key RIÊNG, hoàn toàn ĐỘC LẬP với key của
`CCol xl="9"`.** Đọc source xác nhận: `ChartAnalysis.vue` (dùng chung cho "Cổ đông"+"Thông tin giao dịch”) tự
gate theo `fa_co_dong_va_gd_co_dong_bieu_do`, `ChartForeignTransaction.vue` ("Nước ngoài") theo
`fa_nuoc_ngoai_bieu_do`, `ChartProprietaryTransaction.vue` ("Tự doanh") theo `fa_tu_doanh_bieu_do`,
`ChartEvents.vue` ("Sự kiện") theo `fa_bieu_do_co_tuc` — 4 key HOÀN TOÀN KHÁC 4 key của `CCol xl="9"` tương ứng
(`fa_co_dong`/`fa_giao_dich_noi_bo`/`fa_nuoc_ngoai`/`fa_tu_doanh`/`fa_su_kien`). Đo thật `features_disabled` của
tài khoản Free hiện tại (dump `localStorage`) xác nhận CÓ `fa_nuoc_ngoai_bieu_do`/`fa_tu_doanh_bieu_do` (2 key
phụ) NGOÀI 3 key chính đã biết — nghĩa là với tài khoản này, "Nước ngoài"/"Tự doanh" bị khoá CẢ 2 cấp (`CCol
xl="9"` LẪN `CCol xl="3"`, 2 `<ProtectedView>` độc lập cùng hiện), trong khi "Thông tin giao dịch" chỉ bị khoá 1
cấp (`fa_giao_dich_noi_bo` có trong `features_disabled` nhưng `fa_co_dong_va_gd_co_dong_bieu_do` thì KHÔNG) —
đây mới là case minh chứng đúng "gate không bọc toàn bộ widget". `ChartEconomicInfo`/`ChartEconomicByBank` (sub-
tab mặc định "Thông tin tài chính") và `LeaderShip` (sub-tab "Hồ sơ") là 2 component DUY NHẤT trong `CCol
xl="3"` KHÔNG có `<ProtectedView>` riêng nào — luôn hiển thị bất kể `features_disabled`. Xem TC_PTCB_TTC_25/26
(đã viết lại theo phát hiện này).

**#2. Sub-tab tự viết tay, KHÔNG đổi URL khi chuyển — cùng pattern đã ghi nhận ở khung/shell màn cha
(TC_PTCB_13) và tab "Tài chính doanh nghiệp" (TC_PTCB_TCDN_35).** Click sub-tab chỉ set `type_tab` (data cục bộ
của `Right.vue`) — F5 giữa lúc đang ở sub-tab khác "Thông tin tài chính" sẽ mất sub-tab đang xem, quay về mặc
định. Đổi mã CK KHÔNG ảnh hưởng `type_tab` (state của `Right.vue`, độc lập với `watch: stockcode` của
`Common/index.vue` — component cha chỉ reset state riêng của nó, không truyền lệnh reset xuống con).

**#3. Modal `CModal :show.sync="showPopupChart"` trong `ChartPriceEvents.vue` là DEAD CODE — không có nút/sự
kiện nào trong toàn bộ `Left.vue`/`ChartPriceEvents.vue`/`ChartTradingViewEvents.vue` set `showPopupChart =
true`.** Modal (chứa chọn P/E hoặc P/B + khung thời gian + biểu đồ phóng to) tồn tại đầy đủ trong code nhưng
không có cách nào mở qua UI — cùng pattern dead code đã ghi nhận ở sub-tab "Sự kiện" của tab "Bài viết & Phân
tích". Không viết testcase riêng cho modal này vì không thể tự động hoá 1 luồng không có điểm vào.

**#4. 2 icon "Tạo cảnh báo"/"Thêm giao dịch" ở `Left.vue` gate theo `isAccountFree` (cờ boolean), KHÁC HẲN gate
`features_disabled` #1 ở trên — mở modal "Thông báo" (`isShowModalMembership`, text "Chức năng dành riêng cho
hội viên") thay vì modal thật.** Cùng pattern "gating nhiều cấp/nhiều cơ chế trong 1 trang" đã ghi nhận xuyên
suốt màn hình này (xem mục 3 "Phát hiện đáng chú ý" của `phan-tich-co-ban.md`).

---

## Nhóm: Khung/Shell — Cột trái (`Left.vue`, luôn hiển thị bất kể sub-tab)

# [TC_PTCB_TTC_01] Overview cột trái khi vào tab mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Cột trái (`xl="3"`) LUÔN hiển thị bất kể sub-tab nào ở cột phải đang active — gồm header giá +
  biểu đồ nến TradingView + bảng "Thông tin chung".

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=thong-tin-chung`.

## Kết quả mong đợi
- [ ] Header hiển thị "CTCP Sữa Việt Nam (VNM) - HOSE" + giá hiện tại + % thay đổi (màu theo chiều tăng/giảm).
- [ ] 3 icon bên phải giá: watchlist (star), "Tạo cảnh báo" (chuông), "Thêm giao dịch" (chỉ hiện với mã loại cổ
      phiếu — xem TC_PTCB_TTC_09).
- [ ] Biểu đồ nến TradingView hiển thị (`#tv_chart_container`), thanh khung thời gian "1d 1m 3m 6m 1y 3y 5y" bên
      dưới biểu đồ, mặc định "1m" active.
- [ ] Bảng "Thông tin chung" bên dưới biểu đồ hiển thị dữ liệu công ty.

---

# [TC_PTCB_TTC_02] Bảng "Thông tin chung" hiển thị đủ field công ty

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Dữ liệu từ API `/api/stocks/common-info` (`info_update()` trong `Common/index.vue`), field cụ
  thể tuỳ theo `type_bank` (nonbank/bank/stock/insurance) trả về — mã VNM (nonbank) có đủ 14 field.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_01, quan sát bảng "Thông tin chung".

## Kết quả mong đợi
- [ ] Đủ các dòng: Mã, Tên công ty, Trang web (link `target="_blank"`), Sàn niêm yết, Địa chỉ trụ sở, Vốn điều
      lệ, Vốn hóa thị trường, Số lượng nhân sự, Mã ngành ICB, Tên ngành ICB, Cấp ngành ICB, Số lượng cổ phiếu,
      FreeFloat, EPS điều chỉnh, BVPS điều chỉnh — mỗi dòng có giá trị thật (không rỗng).

---

# [TC_PTCB_TTC_03] 3 dòng bổ sung Beta/Mức độ biến động/Lợi nhuận kỳ vọng (CAPM) từ socket riêng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** 3 dòng này KHÔNG thuộc `cong_ty_tong_quan_items` (API `common-info`) mà hardcode trong template
  `Left.vue`, dữ liệu lấy qua socket `getdataanalysis()` (gọi trong `created()`, tự lặp lại mỗi 60 giây qua
  `setInterval`) — độc lập hoàn toàn với luồng tải bảng "Thông tin chung" phía trên.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_01, cuộn xuống cuối bảng "Thông tin chung".

## Kết quả mong đợi
- [ ] 3 dòng cuối bảng: "Beta", "Mức độ biến động" (có hậu tố "%"), "Lợi nhuận kỳ vọng (CAPM)" (có hậu tố "%") —
      đều có giá trị số thật.

---

# [TC_PTCB_TTC_04] Biểu đồ nến — đổi khung thời gian (1d/1m/3m/6m/1y/3y/5y)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `setCustomTimeRange()` gọi `tvWidget.activeChart().setResolution()`/`setVisibleRange()` — thư
  viện TradingView charting_library bên thứ 3, render trên `<canvas>` nên KHÔNG assert được nội dung nến bên
  trong, chỉ verify được class `active` đổi đúng theo khung thời gian được chọn (`timeFrameSeclected`).

## Các bước thực hiện
1. Click lần lượt qua các khung thời gian: "3m", "1y", "5y", "1d".

## Kết quả mong đợi
- [ ] Sau mỗi lần click, đúng 1 khung thời gian có class `active`, không có lỗi JS console (`pageerror`) phát
      sinh trong suốt quá trình.

---

# [TC_PTCB_TTC_05] Icon đổi loại biểu đồ (nến/đường/vùng/cột) chuyển đúng thứ tự

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `handleChangeTypeChart()` xoay vòng đúng thứ tự cố định `[candle → line → area → bar → candle]`
  (mảng `chartType: [1, 2, 3, 0]`) — icon hiển thị (`IconChartType`, ảnh `.png` tĩnh theo `folder`/`icon`) đổi
  đúng theo giá trị hiện tại, verify qua thuộc tính `src` của `<img>`.

## Các bước thực hiện
1. Click icon đổi loại biểu đồ (góc trên-trái biểu đồ nến) 4 lần liên tiếp, ghi nhận `src` của icon sau mỗi lần.

## Kết quả mong đợi
- [ ] Thứ tự `src` đổi đúng: chứa "candle" (ban đầu) → "line" → "area" → "bar" → "candle" (quay lại đầu).

---

# [TC_PTCB_TTC_06] Icon chỉ báo kỹ thuật (fx) mở dropdown danh sách indicator

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `indicatorOptions` cố định 11 mục: RSI, MACD, PE, PB, Bollinger Bands, MA5, MA10, MA20, MA50,
  MA100, MA200. Click 1 mục gọi `selectOption()` → thêm indicator vào chart (`addIndicator()`) + tự đóng dropdown
  (`show = false`).

## Các bước thực hiện
1. Click icon "fx" (cạnh icon đổi loại biểu đồ).
2. Click mục "RSI" trong danh sách xổ xuống.

## Kết quả mong đợi
- [ ] Sau bước 1: dropdown hiện đủ 11 mục chỉ báo.
- [ ] Sau bước 2: dropdown tự đóng, không có lỗi console.

---

# [TC_PTCB_TTC_07] Click icon watchlist (star) mở dropdown "Chọn watchlist"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `AddWatchListDropdown.vue` — test CHỈ verify dropdown mở đúng, KHÔNG click thêm vào watchlist nào
  (tránh mutate dữ liệu thật, xem ghi chú an toàn dữ liệu đầu tài liệu).

## Các bước thực hiện
1. Click icon watchlist (star, cạnh giá) ở header cột trái.

## Kết quả mong đợi
- [ ] Dropdown hiện text "Chọn watchlist để đưa VNM vào theo dõi".

---

# [TC_PTCB_TTC_08] Click icon "Tạo cảnh báo" mở modal "Tạo cảnh báo"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Modal TOÀN SITE khai báo trong `TheContainer.vue` (`isShowModalAlert`), dùng chung cơ chế với
  các màn khác trong dự án — test chỉ verify modal MỞ ĐƯỢC, không đi sâu nội dung form bên trong (ngoài phạm vi
  màn này).

## Các bước thực hiện
1. Click icon "Tạo cảnh báo" (chuông) ở header cột trái.

## Kết quả mong đợi
- [ ] Modal "Tạo cảnh báo" (`role="dialog"`) hiện ra.

---

# [TC_PTCB_TTC_09] Icon "Thêm giao dịch" chỉ hiện với mã loại cổ phiếu, click mở modal "Thêm giao dịch"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `computed: isStock` tra `store.state.list_mack_all` theo `mack`, chỉ `true` khi `loai === 'stock'`
  — VNM thoả điều kiện. Modal TOÀN SITE (`isShowQuickTransactionFormModal`, title "Thêm giao dịch").

## Các bước thực hiện
1. Với mã VNM, quan sát icon thứ 3 (sau star/chuông).
2. Click icon đó.

## Kết quả mong đợi
- [ ] Icon "Thêm giao dịch" hiển thị (vì VNM là mã cổ phiếu).
- [ ] Click mở modal "Thêm giao dịch" (`role="dialog"`).

---

# [TC_PTCB_TTC_10] Free — click icon "Tạo cảnh báo"/"Thêm giao dịch" mở modal nâng cấp gói thay vì modal thật

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #4 — `showFormAdd()`/`openShowQuickTransactionFormModal()` đều check
  `if (this.isAccountFree) { isShowModalMembership = true; return; }` TRƯỚC khi mở modal thật.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click icon "Tạo cảnh báo".
3. Đóng modal, click icon "Thêm giao dịch".

## Kết quả mong đợi
- [ ] Cả 2 lần click đều hiện modal "Thông báo" chứa text "Chức năng dành riêng cho hội viên" — KHÔNG mở modal
      "Tạo cảnh báo"/"Thêm giao dịch" thật.

---

# [TC_PTCB_TTC_11] Đổi mã CK qua search cập nhật đúng candlestick + bảng "Thông tin chung" theo mã mới

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `watch: stockcode` trong cả `Left.vue` (reset Beta/volatility, gọi lại `getDataLive()`/
  `getDataAnalysis()`) và `Common/index.vue` (gọi lại `info_update()`/`getDataChart()`) đều phản ứng đúng.

## Các bước thực hiện
1. Gõ và chọn "HPG" qua ô tìm kiếm "Mã CK".

## Kết quả mong đợi
- [ ] Header đổi thành "... (HPG) - ...", bảng "Thông tin chung" cập nhật đúng dữ liệu HPG (dòng "Mã" = HPG).

---

# [TC_PTCB_TTC_12] 🆕 [Phát hiện] Deep-link mã ngân hàng — header/Sàn niêm yết trống tạm thời rồi tự phục hồi

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #0 đầu tài liệu. Header (`company_name`/`board`, computed reactive)
  hiển thị RỖNG trong ~1 giây đầu sau deep-link, rồi TỰ ĐỘNG cập nhật đúng trong vòng vài giây tiếp theo — KHÔNG
  cần thao tác gì thêm (khác hẳn bug "trống vĩnh viễn" của tab So Sánh). Đây là hành vi vô hại (loading tự
  nhiên của state bất đồng bộ), không phải bug, nhưng cần phân biệt rõ với bug thật đã ghi nhận ở tab khác nếu
  gặp lại pattern "trống lúc đầu" trong các lượt sinh testcase sau.

## Các bước thực hiện
1. Deep-link thẳng `/phan-tich-co-ban?mack=VCB&tab=thong-tin-chung` (1 lượt `page.goto`).
2. Kiểm tra header ngay sau khi trang tải xong DOM (trước 1 giây).
3. Chờ thêm vài giây, kiểm tra lại header.

## Kết quả mong đợi
- [ ] Bước 2: header có thể rỗng hoặc chưa đúng tên công ty VCB.
- [ ] Bước 3: header hiển thị đúng "Ngân hàng TMCP Ngoại thương Việt Nam (VCB) - HOSE" — TỰ PHỤC HỒI, không cần
      đổi mã CK thủ công.

---

# [TC_PTCB_TTC_13] Deep-link mã ngân hàng (VCB) không phát sinh lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, XÁC NHẬN KHÔNG có bug: Pass**
- **Ghi chú:** Khác bug thật đã ghi nhận ở tab "Biểu đồ" (`nhom_stockcode` đọc sai gây gọi nhầm API, lỗi 500) —
  phạm vi này (`Common`/`Left`/`Right`) không có logic tương tự, xác nhận qua đo network/console thật.

## Các bước thực hiện
1. Deep-link thẳng `/phan-tich-co-ban?mack=VCB&tab=thong-tin-chung`, theo dõi console trong 5 giây.

## Kết quả mong đợi
- [ ] Không có lỗi JS console (`pageerror`) nào phát sinh.

---

## Nhóm: Thanh 7 sub-tab (`Right.vue`)

# [TC_PTCB_TTC_14] Hiển thị đủ 7 sub-tab, "Thông tin tài chính" active mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Từ TC_PTCB_TTC_01, quan sát thanh sub-tab cột phải.

## Kết quả mong đợi
- [ ] Đủ 7 sub-tab đúng thứ tự: "Thông tin tài chính", "Hồ sơ", "Cổ đông", "Thông tin giao dịch", "Sự kiện",
      "Nước ngoài", "Tự doanh".
- [ ] "Thông tin tài chính" active mặc định (class `active`).

---

# [TC_PTCB_TTC_15] Click lần lượt qua 6 sub-tab còn lại — chuyển đúng, nội dung tồn tại

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Chỉ xác nhận sub-tab TỒN TẠI và chuyển được — nội dung chi tiết bên trong từng sub-tab thuộc
  phạm vi 3 tài liệu con sẽ sinh sau (xem đầu tài liệu).

## Các bước thực hiện
1. Click lần lượt: "Hồ sơ" → "Cổ đông" → "Thông tin giao dịch" → "Sự kiện" → "Nước ngoài" → "Tự doanh".

## Kết quả mong đợi
- [ ] Mỗi lần click, đúng 1 sub-tab active, vùng nội dung bên dưới thay đổi (không giữ nguyên nội dung sub-tab
      trước).

---

# [TC_PTCB_TTC_16] Click nhanh liên tục qua 7 sub-tab không lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click nhanh qua lại cả 7 sub-tab, lặp lại 2 vòng liên tiếp (không chờ giữa các lần click).

## Kết quả mong đợi
- [ ] Sub-tab cuối cùng được click hiển thị đúng, không có lỗi JS (`pageerror`) phát sinh.

---

# [TC_PTCB_TTC_17] Đổi mã CK giữ nguyên sub-tab đang chọn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Xem phát hiện #2 — `type_tab` là state riêng của `Right.vue`, không bị `watch: stockcode` của
  component cha (`Common/index.vue`) reset — cùng pattern TC_PTCB_07 (khung/shell) và TC_PTCB_TCDN_22.

## Các bước thực hiện
1. Chuyển sang sub-tab "Cổ đông".
2. Đổi mã CK qua ô tìm kiếm sang mã khác (HPG).

## Kết quả mong đợi
- [ ] Sau khi đổi mã, vẫn đang ở sub-tab "Cổ đông" (không tự động quay về "Thông tin tài chính").

---

# [TC_PTCB_TTC_18] Chuyển sub-tab KHÔNG đổi URL — F5 quay về sub-tab mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, cùng pattern đã ghi nhận nhiều lần: Pass**
- **Ghi chú:** Xem phát hiện #2 — cùng pattern TC_PTCB_13 (khung/shell màn cha) và TC_PTCB_TCDN_35 (tab Tài
  chính doanh nghiệp).

## Các bước thực hiện
1. Chuyển sang sub-tab "Sự kiện".
2. Tải lại trang (F5) mà không đổi URL.

## Kết quả mong đợi
- [ ] URL không đổi khi chuyển sub-tab.
- [ ] Sau F5, quay về sub-tab mặc định "Thông tin tài chính" (không giữ "Sự kiện" đã chọn trước đó).

---

## Nhóm: Sub-tab mặc định "Thông tin tài chính" (`FinancialInfo.vue` + `ChartEconomicInfo.vue`)

# [TC_PTCB_TTC_19] Cấu trúc bảng snapshot đúng — cột Thông tin/Đơn vị/4 quý + 3 nhóm dòng tiêu đề màu đỏ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Dữ liệu từ API `/api/stocks/economic-info` (`getDataChart()`), cấu trúc bảng (`financial_portfolio`)
  đổi theo `type_bank` — mã thường (nonbank, VD VNM) có 3 nhóm: "Tài sản", "Kết quả kinh doanh", "Chỉ số tài
  chính" (dòng tiêu đề nhóm màu đỏ, không có giá trị — do `item.color === "red"` khiến `gia_tri_x` luôn rỗng).

## Các bước thực hiện
1. Từ tab mặc định (VNM), quan sát bảng snapshot bên trái cột phải.

## Kết quả mong đợi
- [ ] Bảng có 6 cột: "" (thông tin), "Đơn vị", 4 cột quý gần nhất.
- [ ] 3 dòng tiêu đề nhóm màu đỏ: "Tài sản", "Kết quả kinh doanh", "Chỉ số tài chính" — các dòng này KHÔNG có
      giá trị ở 4 cột quý.
- [ ] Các dòng chỉ tiêu con (VD "Tổng cộng tài sản (Q)", "Doanh thu thuần (Q)", "EPS (Q)") có giá trị số thật.

---

# [TC_PTCB_TTC_20] 3 biểu đồ bên phải hiển thị (mã thường): Doanh thu/LN ròng, Tổng tài sản/Tổng nợ, P/B P/E

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `ChartEconomicInfo.vue` render 3 `CustomEChart` khi `type_bank != 'bank'` (chart Doanh thu/LN
  ròng/Tỷ suất LN, chart Tổng tài sản/Tổng nợ/Nợ-Tài sản, chart P/B-P/E) — dùng `CanvasRenderer`, KHÔNG assert
  được text legend/tooltip qua DOM, chỉ verify được 3 `<canvas>` tồn tại.

## Các bước thực hiện
1. Từ tab mặc định (VNM), quan sát cột biểu đồ bên phải (trong khu vực sub-tab).

## Kết quả mong đợi
- [ ] Có đúng 3 `<canvas>` biểu đồ hiển thị (không tràn/chồng lên nhau), không lỗi console.

---

# [TC_PTCB_TTC_21] Mã ngân hàng (VCB) — bảng + 3 biểu đồ khác cấu trúc (`ChartEconomicByBank`)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Mã ngân hàng dùng `financial_portfolio` RIÊNG (VD "Cho vay khách hàng (Q)", "Tiền gửi khách hàng
  (Q)", "NIM (Q)", "CASA (Q)" — không có ở mã thường) + `ChartEconomicByBank.vue` (3 chart riêng: TN/LN từ lãi
  và DV, Tài sản/Cho vay KH/Tiền gửi KH, NIM/CIR/CASA) thay vì `ChartEconomicInfo` mặc định.

## Các bước thực hiện
1. Deep-link `/phan-tich-co-ban?mack=VCB&tab=thong-tin-chung`, chờ tải xong.

## Kết quả mong đợi
- [ ] Bảng snapshot có dòng "Cho vay khách hàng (Q)" (đặc thù ngân hàng, không có ở mã thường).
- [ ] Vẫn có đúng 3 `<canvas>` biểu đồ bên phải, không lỗi console.

---

# [TC_PTCB_TTC_22] Bảng snapshot KHÔNG có cấu trúc cây thu gọn/mở rộng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Template `FinancialInfo.vue` render PHẲNG toàn bộ `financial_portfolio`, không có `is_parent`/
  icon caret nào — cùng pattern đã ghi nhận ở sub-tab "Chỉ tiêu tài chính" của tab "Tài chính doanh nghiệp"
  (TC_PTCB_TCDN_18).

## Các bước thực hiện
1. Đếm số icon caret (mũi tên thu gọn/mở rộng) trong bảng snapshot.
2. Click vào 1 dòng tiêu đề nhóm màu đỏ (VD "Tài sản").

## Kết quả mong đợi
- [ ] Không có icon caret nào trong bảng.
- [ ] Click vào dòng tiêu đề không có tác dụng ẩn/hiện gì (số dòng bảng không đổi).

---

# [TC_PTCB_TTC_23] Free — sub-tab "Thông tin tài chính" KHÔNG bị khoá gói hội viên

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #1 — `featureName` cho `financial_info` LUÔN `null`, không bao giờ bị
  `disable_featureName` che, bất kể `features_disabled` của tài khoản.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Vào tab "Thông tin chung" (sub-tab mặc định).

## Kết quả mong đợi
- [ ] Bảng snapshot + 3 biểu đồ hiển thị bình thường, KHÔNG có `ProtectedView` (ảnh mờ) che nội dung.

---

## Nhóm: Gate cấp widget (`features_disabled`) cho 6 sub-tab còn lại

# [TC_PTCB_TTC_24] Free — "Hồ sơ"/"Cổ đông"/"Sự kiện" KHÔNG bị khoá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #1 — `features_disabled` của tài khoản Free hiện tại KHÔNG có `fa_co_dong`/
  `fa_su_kien`; "Hồ sơ" luôn `featureName = null`.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click lần lượt "Hồ sơ", "Cổ đông", "Sự kiện".

## Kết quả mong đợi
- [ ] Cả 3 sub-tab hiển thị nội dung bình thường, KHÔNG có `ProtectedView` nào che.

---

# [TC_PTCB_TTC_25] Free — "Thông tin giao dịch"/"Nước ngoài"/"Tự doanh" BỊ khoá `ProtectedView` (nội dung
  chính) — "Nước ngoài"/"Tự doanh" còn bị khoá CẢ panel biểu đồ phụ trợ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #1/#1b — `features_disabled` CÓ `fa_giao_dich_noi_bo`/`fa_nuoc_ngoai`/`fa_tu_doanh`
  (key của `CCol xl="9"`) VÀ CÒN CÓ THÊM `fa_nuoc_ngoai_bieu_do`/`fa_tu_doanh_bieu_do` (key riêng của panel biểu
  đồ phụ trợ `CCol xl="3"`, ĐỘC LẬP). Vì vậy "Nước ngoài"/"Tự doanh" bị khoá **2 `ProtectedView` độc lập cùng
  lúc** (nội dung chính + panel biểu đồ), còn "Thông tin giao dịch" chỉ bị khoá **1 `ProtectedView`** (panel
  biểu đồ của nó, `ChartAnalysis` dùng chung với "Cổ đông", key `fa_co_dong_va_gd_co_dong_bieu_do` KHÔNG có
  trong `features_disabled`). Chi tiết nội dung từng sub-tab bị khoá sẽ đo sâu hơn ở 2 tài liệu con sau
  (`-giao-dich-su-kien.md`, `-nn-tu-doanh.md`) — test này chỉ xác nhận CÓ gate xuất hiện đúng vị trí + đúng số
  lượng.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click lần lượt "Thông tin giao dịch", "Nước ngoài", "Tự doanh".

## Kết quả mong đợi
- [ ] "Thông tin giao dịch": đúng 1 `ProtectedView` (che vùng nội dung chính, cột trái bên trong `Right.vue`).
- [ ] "Nước ngoài": đúng 2 `ProtectedView` độc lập (nội dung chính + panel biểu đồ phụ trợ bên phải).
- [ ] "Tự doanh": đúng 2 `ProtectedView` độc lập (nội dung chính + panel biểu đồ phụ trợ bên phải).

---

# [TC_PTCB_TTC_26] Free — [Đính chính] panel biểu đồ phụ trợ có gate RIÊNG, độc lập với nội dung chính — minh
  chứng qua "Thông tin giao dịch"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật, phát hiện đáng chú ý:
  Pass**
- **⚠️ ĐÍNH CHÍNH quan trọng so với giả định ban đầu:** dự kiến gốc mô tả "`CCol xl="3"` không bao giờ bị gate,
  luôn hiển thị bình thường dù nội dung chính bị khoá". Đo thật bằng automation phát hiện SAI: mỗi component
  biểu đồ con trong `CCol xl="3"` (`ChartAnalysis`/`ChartForeignTransaction`/`ChartProprietaryTransaction`/
  `ChartEvents`) TỰ CÓ `<ProtectedView>` riêng với feature key riêng, hoàn toàn ĐỘC LẬP với key của `CCol
  xl="9"` — xem phát hiện #1b. Với tài khoản Free hiện tại, "Nước ngoài"/"Tự doanh" (dùng làm ví dụ ban đầu) lại
  bị khoá CẢ 2 cấp cùng lúc nên KHÔNG minh hoạ được tính độc lập — phải dùng "Thông tin giao dịch" thay thế:
  `fa_giao_dich_noi_bo` (nội dung chính) CÓ trong `features_disabled`, nhưng
  `fa_co_dong_va_gd_co_dong_bieu_do` (panel `ChartAnalysis`, dùng chung cho cả "Cổ đông" lẫn "Thông tin giao
  dịch") thì KHÔNG — đúng pattern "gate không bọc toàn bộ widget" đã ghi nhận ở tab "Tài chính doanh nghiệp"
  (`disable_featureName` chỉ bọc vùng bảng, không bọc thanh sub-tab/select).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Thông tin giao dịch" (đã xác nhận nội dung chính bị khoá ở TC_PTCB_TTC_25).

## Kết quả mong đợi
- [ ] Nội dung chính (cột trái bên trong `Right.vue`) bị `ProtectedView` che — đúng 1 `ProtectedView` trên toàn
      trang (không có `ProtectedView` thứ 2 ở panel biểu đồ).
- [ ] Cột phải nhỏ (`ChartAnalysis`) vẫn hiển thị canvas biểu đồ bình thường, KHÔNG bị `ProtectedView` che — dù
      cột chính bên trái đã bị khoá.

---

## Nhóm: Responsive

# [TC_PTCB_TTC_27] Responsive viewport mobile/tablet

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị tab đã tải xong dữ liệu.
2. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024).

## Kết quả mong đợi
- [ ] Cột trái (biểu đồ nến + bảng) và cột phải (7 sub-tab + bảng snapshot) vẫn hiển thị được (có thể xếp chồng
      dọc hoặc cuộn ngang), không vỡ layout nghiêm trọng.

---

## Tổng hợp trạng thái (27 testcase — phạm vi khung/shell + sub-tab mặc định "Thông tin tài chính")

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-thong-tin-chung.spec.ts](../tests/phan-tich-co-ban-thong-tin-chung.spec.ts) (POM:
section "Tab Thông tin chung — Shell + sub-tab Thông tin tài chính" ở cuối
[pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 0 | Không có testcase nào map trực tiếp từ Sheet app (xem lý do ở đầu tài liệu) |
| 🆕 Mới (riêng web) | 27 | TC_PTCB_TTC_01 → 27 |
| ⚠️ Cần xác nhận thêm | 0 | — |

Không có `test.fixme` nào trong file spec này — toàn bộ 27 testcase đều tự động hoá và pass được (không có
tính năng kéo-thả/upload/download nào trong phạm vi khung/shell + sub-tab mặc định).

**Phát hiện đáng chú ý cần theo dõi:**
1. **[XÁC NHẬN AN TOÀN] KHÔNG có bug race condition "trống vĩnh viễn" như tab "So sánh"/"Biểu đồ"** ở phạm vi
   này — nhưng CÓ 1 trạng thái trống TẠM THỜI (~1 giây) ở header công ty khi deep-link, tự phục hồi đúng nhờ
   `computed` reactive (khác `Compare.getAll()` tính 1 lần không reactive). 3 biểu đồ snapshot (`ChartEconomicInfo`)
   đọc `type_bank` trực tiếp từ response API, không phụ thuộc `list_mack_company` — an toàn 100%, cùng pattern
   đã xác nhận ở tab "Tài chính doanh nghiệp". Xem phát hiện #0, TC_PTCB_TTC_12/13/21.
2. **Gate cấp WIDGET riêng của `Right.vue` (`features_disabled`), độc lập với gate cấp shell/tab chính** — 5/7
   sub-tab có thể bị khoá (`share_holder`/`transaction_info`/`foreign_transaction`/`proprietary_transaction`/
   `event`), "Thông tin tài chính"/"Hồ sơ" KHÔNG BAO GIỜ bị khoá qua cơ chế này. Tài khoản Free hiện tại chỉ
   thực sự bị khoá 3/7 sub-tab (`fa_giao_dich_noi_bo`/`fa_nuoc_ngoai`/`fa_tu_doanh`). Xem phát hiện #1,
   TC_PTCB_TTC_23/24/25.
3. **[ĐÍNH CHÍNH] `CCol xl="3"` (biểu đồ phụ trợ) KHÔNG PHẢI "không bao giờ bị gate" — mỗi component biểu đồ con
   (`ChartAnalysis`/`ChartForeignTransaction`/`ChartProprietaryTransaction`/`ChartEvents`) TỰ CÓ
   `<ProtectedView>` riêng với feature key riêng** (`fa_co_dong_va_gd_co_dong_bieu_do`/`fa_nuoc_ngoai_bieu_do`/
   `fa_tu_doanh_bieu_do`/`fa_bieu_do_co_tuc`), hoàn toàn ĐỘC LẬP với key của `CCol xl="9"` cùng sub-tab. Tài
   khoản Free hiện tại bị khoá CẢ 2 cấp ở "Nước ngoài"/"Tự doanh" (2 `ProtectedView` cùng hiện), nhưng CHỈ 1 cấp
   ở "Thông tin giao dịch" (panel biểu đồ `ChartAnalysis` không bị khoá riêng) — đây mới là ví dụ đúng cho
   pattern "gate không bọc toàn bộ widget" đã ghi nhận ở tab "Tài chính doanh nghiệp" (gate chỉ bọc vùng bảng,
   không bọc thanh sub-tab/select). Xem phát hiện #1b, TC_PTCB_TTC_25/26.
4. **2 icon "Tạo cảnh báo"/"Thêm giao dịch" ở cột trái gate theo `isAccountFree` (khác cơ chế `features_disabled`
   ở trên)** — mở modal nâng cấp gói "Chức năng dành riêng cho hội viên" thay vì modal thật. Xem phát hiện #4,
   TC_PTCB_TTC_10.
5. **Sub-tab tự viết tay, không đổi URL khi chuyển** — F5 giữa lúc đang ở sub-tab khác "Thông tin tài chính" sẽ
   mất sub-tab đang xem, quay về mặc định. Đổi mã CK KHÔNG ảnh hưởng sub-tab đang chọn. Cùng pattern đã ghi nhận
   xuyên suốt màn hình này (khung/shell TC_PTCB_13, tab Tài chính doanh nghiệp TC_PTCB_TCDN_35). Xem phát hiện
   #2, TC_PTCB_TTC_17/18.
6. **Modal phóng to biểu đồ P/E-P/B (`ChartPriceEvents.vue`, `showPopupChart`) là DEAD CODE** — không có điểm
   vào nào trong UI để mở modal này, cùng pattern dead code đã ghi nhận ở sub-tab "Sự kiện" của tab "Bài viết &
   Phân tích". Xem phát hiện #3.
7. **Không có mục nào trong Sheet app khớp trực tiếp với bảng snapshot "Thông tin tài chính"/layout 2 cột tổng
   thể này** — toàn bộ 27 testcase đều là 🆕 mới, không gắn "Tham chiếu App" (app có tab "Báo cáo TC"/"Chỉ tiêu
   TC" tách biệt, kiến trúc khác hẳn).

**Ngoài phạm vi lần sinh này:** nội dung chi tiết bên trong 6 sub-tab "Hồ sơ"/"Cổ đông"/"Thông tin giao dịch"/
"Sự kiện"/"Nước ngoài"/"Tự doanh" — xem 3 tài liệu con liệt kê ở đầu file, sẽ sinh ở các lượt sau.
