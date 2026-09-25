# Màn hình: Phân tích cơ bản — Tab "Tài chính doanh nghiệp"

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=tai-chinh-doanh-nghiep`.
- **Component:** [stocks/src/views/faAnalysis/BusinessFinance/index.vue](../../stocks/src/views/faAnalysis/BusinessFinance/index.vue)
  (`name: "BusinessFinance"`) — shell 5 sub-report con, mỗi sub-report 1 component riêng:
  [BS.vue](../../stocks/src/views/faAnalysis/BusinessFinance/BS.vue) ("Bảng cân đối kế toán"),
  [IS.vue](../../stocks/src/views/faAnalysis/BusinessFinance/IS.vue) ("Kết quả kinh doanh"),
  [CF.vue](../../stocks/src/views/faAnalysis/BusinessFinance/CF.vue) ("Lưu chuyển tiền tệ"),
  [TM.vue](../../stocks/src/views/faAnalysis/BusinessFinance/TM.vue) ("Thuyết minh"),
  [FinancialRatios.vue](../../stocks/src/views/faAnalysis/BusinessFinance/FinancialRatios.vue) ("Chỉ tiêu tài
  chính").
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Google Sheet, tab "Phân Tích FA(Cổ Phiếu)", 2 nhóm TC ID 91-120 ("Tab Báo cáo
  TC") + TC ID 121-144 ("Tab Chỉ tiêu TC") — app (mobile) tách 2 tab RIÊNG, web GỘP cả 2 vào 1 tab "Tài chính
  doanh nghiệp" duy nhất (đã ghi chú ở đầu `phan-tich-co-ban.md`). Sheet chỉ dùng tham khảo văn phong — độ phủ
  thật sự do tự kiểm kê source code (6 file `.vue` đầy đủ) + DOM thật (`inspect-dom.ts` + script Playwright tạm
  thời đo network/`localStorage`) quyết định. Đây là tab LỚN NHẤT đã sinh testcase tới nay (5 sub-report, mỗi
  sub-report có `data()`/`computed`/API riêng), web có nhiều khía cạnh app hoàn toàn không có (VD 5 loại báo
  cáo tách riêng thay vì gộp chung, sub-tab "Thuyết minh" chỉ dành cho tài khoản nội bộ).
- **Quy ước trạng thái:** giống `phan-tich-co-ban.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng web) ·
  ⚠️ Cần xác nhận thêm.
- **An toàn dữ liệu:** Toàn bộ API của tab này CHỈ ĐỌC — `GET /api/stocks?type=bs|is|cf|tm&mack=...` (BS/IS/CF/
  TM) và `GET /api/stocks/financial-ratios?mack=...` (Chỉ tiêu tài chính). KHÔNG có tính năng xuất Excel/lưu
  tuỳ chỉnh nào trong 5 sub-report (đã grep xác nhận không có `Excel`/`export` trong cả 6 file) — an toàn gọi
  API thật cho mọi testcase, không cần mock để tránh mutate dữ liệu.
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Các test đổi mã CK trong file này (`?mack=`, không dùng path
  param) đều reset lại đúng `VNM` sau khi xong để giảm nhiễu cho test khác chạy song song.

## Phát hiện đáng chú ý — đọc trước khi dùng lại giả định ban đầu (đề bài gốc)

**#0. [XÁC NHẬN] KHÔNG có race condition `nhom_stockcode` như tab "Biểu đồ"/"So sánh".** Đề bài gốc yêu cầu
kiểm tra kỹ vì nghi ngờ tab này (do phân biệt nonbank/bank/stock/insurance) có thể mắc cùng bug race condition
đã ghi nhận ở 2 tab kia. Đọc kỹ cả 5 component con: nhóm mã (`"nonbank"`/`"bank"`/`"stock"`/`"insurance"`)
KHÔNG đọc từ `store.state.list_mack_company` (state nạp bất đồng bộ qua socket `TheContainer.getAllMack()`) ở
BẤT KỲ ĐÂU — mà đọc trực tiếp từ **phần tử đầu tiên của chính response API** (`response.data[0]`) do SERVER trả
về cùng lúc với dữ liệu báo cáo. Vì vậy component không cần biết trước nhóm mã để quyết định gọi API nào (khác
tab "Biểu đồ" phải chọn `ChartByNonBank`/`ChartByBank` TRƯỚC khi gọi API) — deep-link thẳng vào mã ngân hàng
(VCB) hiển thị đúng cấu trúc bảng ngân hàng ngay lần render đầu tiên, không có request nào gọi sai/trả lỗi, xác
nhận 100% qua automation (TC_PTCB_TCDN_20).

**#1. "Thuyết minh" là sub-tab NỘI BỘ — gate theo ROLE tài khoản, hoàn toàn KHÁC 2 kiểu gating đã biết
(`features_disabled` cấp shell/widget, `isAccountFree`).** Đọc `BusinessFinance/index.vue` `data()`: sub-tab
"Thuyết minh" (`{ label: "Thuyết minh", value: "tm" }`) CHỈ được thêm vào `option_tab` khi
`localStorage.getItem("roles").indexOf("coworker") >= 0`. Đo thật xác nhận: `TEST_USER_EMAIL` (tài khoản test
chính, có role `coworker`) thấy đủ 5 sub-tab; `FREE_USER_EMAIL` (tài khoản Free, KHÔNG có role `coworker`) chỉ
thấy 4 sub-tab, "Thuyết minh" ẩn hoàn toàn — dù đây là 2 khái niệm hoàn toàn độc lập (role nội bộ vs gói hội
viên), không phải "Thuyết minh chỉ dành cho VIP". Xem TC_PTCB_TCDN_04 (verify hiển thị với role coworker) và
TC_PTCB_TCDN_33 (verify ẩn với tài khoản không có role này).

**#2. Gating theo gói hội viên hoạt động ở CẤP TỪNG SUB-TAB, chi tiết hơn mọi pattern "nhiều cấp" đã ghi nhận
trước đây.** `computed: featureName()` trong `BusinessFinance/index.vue` tính theo `type_tab` HIỆN TẠI: "bs" →
`fa_cdkt`, "is" → `fa_kqkd`, "cf" → `fa_lctt`, "financial_ratios" → `fa_cttc`, "tm" → không có case riêng nên
luôn `null` (không bao giờ bị khoá qua cơ chế này). Đo thật `localStorage.features_disabled` của tài khoản Free
hiện tại: CHỈ có `fa_cttc` (KHÔNG có `fa_cdkt`/`fa_kqkd`/`fa_lctt`) → CHỈ sub-tab "Chỉ tiêu tài chính" bị
`<ProtectedView v-if="disable_featureName">` che (bọc TOÀN BỘ vùng bảng, thanh sub-tab + 2 select VẪN hiển thị
bình thường), 3 sub-tab BS/IS/CF hiển thị dữ liệu đầy đủ bình thường. Xem TC_PTCB_TCDN_28/29.

**#3. Tài khoản Free CÒN bị ép mặc định + khoá đổi đơn vị/kỳ, ĐỘC LẬP với gate #2 (áp dụng cho MỌI sub-tab kể
cả BS/IS/CF không bị khoá).** `watch: "$store.state.isAccountFree"` (`immediate: true`) ép `type_money` về
`"bilion"` (Tỷ đồng) và `type_time_bctc` về `"year"` (Năm) ngay khi mount, đồng thời CẢ 2 `CSelect` (đơn vị +
Quý/Năm) đều `:disabled="isAccountFree"`. Xem TC_PTCB_TCDN_30.

**#4. KHÔNG có caching client-side — mỗi lần chuyển sub-tab đều gọi lại API từ đầu.** 5 component con dùng
`v-if` (không phải `v-show`) để chuyển đổi trong `BusinessFinance/index.vue`, nên mỗi lần chuyển sang 1 sub-tab
(kể cả quay lại đúng sub-tab đã xem trước đó) đều UNMOUNT rồi MOUNT LẠI, `created()` LUÔN gọi lại API — xác
nhận qua đo network (TC_PTCB_TCDN_07).

## Nhóm: Tổng quan & chuyển sub-tab

# [TC_PTCB_TCDN_01] Overview mặc định (sub-tab "Bảng cân đối kế toán" active)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `type_tab` mặc định `"bs"`. Hiển thị đủ 5 sub-tab (4 nếu tài khoản không có role `coworker`,
  xem phát hiện #1), 2 select "Triệu đồng"/"Quý" (mặc định), bảng BS đầy đủ dữ liệu.

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=tai-chinh-doanh-nghiep`.

## Kết quả mong đợi
- [ ] Sub-tab "Bảng cân đối kế toán" active mặc định.
- [ ] Hiển thị đủ các sub-tab: "Bảng cân đối kế toán", "Kết quả kinh doanh", "Lưu chuyển tiền tệ", "Chỉ tiêu
      tài chính" (+ "Thuyết minh" nếu tài khoản có role `coworker`).
- [ ] 2 select "Triệu đồng"/"Tỷ đồng" và "Quý"/"Năm" hiển thị, mặc định "Triệu đồng"/"Quý".
- [ ] Bảng có dữ liệu thật (cột đầu "Thông tin", các cột tiếp theo là quý/năm).

---

# [TC_PTCB_TCDN_02] Click "Kết quả kinh doanh" chuyển đúng bảng IS

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 93 (Sheet, "Check click BC thu nhập")

## Các bước thực hiện
1. Từ sub-tab mặc định, click "Kết quả kinh doanh".

## Kết quả mong đợi
- [ ] Sub-tab "Kết quả kinh doanh" active, bảng cập nhật đúng dữ liệu Kết quả kinh doanh (Doanh thu, Lợi nhuận
      gộp, LNST...).

---

# [TC_PTCB_TCDN_03] Click "Lưu chuyển tiền tệ" chuyển đúng bảng CF

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 94 (Sheet, "Check click BC dòng tiền")

## Các bước thực hiện
1. Click "Lưu chuyển tiền tệ".

## Kết quả mong đợi
- [ ] Sub-tab "Lưu chuyển tiền tệ" active, bảng cập nhật đúng dữ liệu lưu chuyển tiền tệ.

---

# [TC_PTCB_TCDN_04] Click "Thuyết minh" chuyển đúng bảng TM (tài khoản có role coworker)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass** (tự `test.skip` nếu tài khoản test
  không có role `coworker`)
- **Ghi chú:** Xem phát hiện #1 — sub-tab này chỉ tồn tại với tài khoản có `localStorage.roles` chứa
  `"coworker"`.

## Các bước thực hiện
1. Nếu sub-tab "Thuyết minh" hiển thị, click vào.

## Kết quả mong đợi
- [ ] Sub-tab "Thuyết minh" active, bảng cập nhật đúng dữ liệu thuyết minh BCTC.

---

# [TC_PTCB_TCDN_05] Click "Chỉ tiêu tài chính" chuyển đúng bảng khác cấu trúc (có cột "Đơn vị", chỉ 1 select)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 121 (Sheet, "Check overview tab Chỉ tiêu TC")
- **Khác biệt so với app/các sub-tab khác:** Header bảng có thêm cột "Đơn vị" (VD "VNĐ", "tỷ VNĐ", "lần", "%").
  KHÔNG có select "Triệu đồng"/"Tỷ đồng" (`v-if="type_tab != 'financial_ratios'"` ẩn nó), thay vào đó chỉ 1
  select riêng "Quý"/"Năm"/"TTM" (`type_time_financial_ratios`, ĐỘC LẬP với select Quý/Năm của 4 sub-tab kia —
  xem TC_PTCB_TCDN_15).

## Các bước thực hiện
1. Click "Chỉ tiêu tài chính".

## Kết quả mong đợi
- [ ] Sub-tab "Chỉ tiêu tài chính" active, header bảng có cột thứ 2 là "Đơn vị".
- [ ] Select "Triệu đồng"/"Tỷ đồng" KHÔNG hiển thị.
- [ ] Select "Quý"/"Năm"/"TTM" hiển thị.

---

# [TC_PTCB_TCDN_06] Chuyển sub-tab nhanh liên tục không lỗi console

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 12 (Sheet, tương tự "Check click tab nhanh liên tục" của khung/shell)

## Các bước thực hiện
1. Click nhanh qua lại các sub-tab "Kết quả kinh doanh" → "Lưu chuyển tiền tệ" → "Chỉ tiêu tài chính" → "Bảng
   cân đối kế toán", lặp lại 2 vòng liên tiếp.

## Kết quả mong đợi
- [ ] Sub-tab cuối cùng được click hiển thị đúng, không có lỗi JS (`pageerror`) phát sinh.

---

# [TC_PTCB_TCDN_07] Mỗi lần chuyển sub-tab luôn gọi lại API mới (không cache)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (đo network thật): Pass**
- **Ghi chú:** Xem phát hiện #4 — 5 component con dùng `v-if` (unmount/remount thật sự), không phải `v-show`.

## Các bước thực hiện
1. Từ "Bảng cân đối kế toán", chuyển sang "Kết quả kinh doanh" rồi quay lại "Bảng cân đối kế toán", theo dõi
   network.

## Kết quả mong đợi
- [ ] Có thêm ÍT NHẤT 1 request `GET /api/stocks?type=bs...` mới khi quay lại (không dùng lại dữ liệu đã tải
      trước đó).

---

## Nhóm: Toggle Triệu đồng / Tỷ đồng

# [TC_PTCB_TCDN_08] Đổi "Tỷ đồng" chia giá trị hiển thị cho 1000

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (đo số liệu thật): Pass**
- **Tham chiếu App:** TC 102 (Sheet, "Check click Triệu" — ngược hướng nhưng cùng cơ chế)

## Các bước thực hiện
1. Ghi nhận giá trị dòng "TỔNG CỘNG TÀI SẢN" cột đầu tiên (đơn vị Triệu đồng mặc định).
2. Đổi select sang "Tỷ đồng".

## Kết quả mong đợi
- [ ] Giá trị sau khi đổi xấp xỉ giá trị ban đầu chia 1000 (làm tròn theo `formatMoney`).

---

# [TC_PTCB_TCDN_09] Chọn "Tỷ đồng" ở BS rồi qua "Kết quả kinh doanh" vẫn giữ "Tỷ đồng"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `type_money` là state của `BusinessFinance/index.vue` (cấp CHA), dùng CHUNG cho BS/IS/CF/TM qua
  props — đổi 1 lần áp dụng cho mọi sub-tab, không reset khi chuyển sub-tab.

## Các bước thực hiện
1. Ở "Bảng cân đối kế toán", đổi select sang "Tỷ đồng".
2. Chuyển sang "Kết quả kinh doanh".

## Kết quả mong đợi
- [ ] Select đơn vị ở "Kết quả kinh doanh" vẫn là "Tỷ đồng" (không tự reset về "Triệu đồng").

---

# [TC_PTCB_TCDN_10] Select Triệu/Tỷ KHÔNG hiển thị ở sub-tab "Chỉ tiêu tài chính"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuyển sang "Chỉ tiêu tài chính".

## Kết quả mong đợi
- [ ] Không có select "Triệu đồng"/"Tỷ đồng" nào trên trang.

---

## Nhóm: Toggle Quý/Năm (BS/IS/CF/TM)

# [TC_PTCB_TCDN_11] Chuyển "Năm" đổi cột + gọi lại API đúng tham số `thoigian=year`

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (đo network thật): Pass**
- **Tham chiếu App:** TC 105 (Sheet, "Check click Quý" — cùng cơ chế đảo chiều)

## Các bước thực hiện
1. Ở "Bảng cân đối kế toán", đổi select "Quý" sang "Năm", theo dõi network.

## Kết quả mong đợi
- [ ] Request `GET /api/stocks?type=bs...` mới được gửi với `thoigian=year`.

---

# [TC_PTCB_TCDN_12] Chuyển lại "Quý" gọi lại API đúng tham số `thoigian=quarter` (không cache)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 105 (Sheet)

## Các bước thực hiện
1. Đang ở "Năm", đổi lại select sang "Quý", theo dõi network.

## Kết quả mong đợi
- [ ] Request `GET /api/stocks?type=bs...` mới được gửi với `thoigian=quarter` (không dùng lại dữ liệu Quý đã
      tải trước đó khi đang ở "Năm").

---

# [TC_PTCB_TCDN_13] Toggle Quý/Năm dùng chung state cho BS/IS/CF/TM

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `type_time_bctc` cùng cấp CHA với `type_money` (xem TC_PTCB_TCDN_09), dùng chung cho 4 sub-tab
  BS/IS/CF/TM.

## Các bước thực hiện
1. Đổi select "Quý"/"Năm" sang "Năm" ở "Bảng cân đối kế toán".
2. Chuyển sang "Lưu chuyển tiền tệ".

## Kết quả mong đợi
- [ ] Select "Quý"/"Năm" ở "Lưu chuyển tiền tệ" vẫn là "Năm".

---

## Nhóm: Toggle Quý/Năm/TTM riêng "Chỉ tiêu tài chính"

# [TC_PTCB_TCDN_14] Chọn "TTM" gọi API đúng tham số `thoigian=ttm`

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (đo network thật): Pass**
- **Ghi chú:** Sheet app có nhắc TTM ở TC 124 ("Check click TTM") nhưng KHÔNG đề cập tới việc web có select
  Quý/Năm/TTM RIÊNG cho sub-tab này (xem TC_PTCB_TCDN_15) — coi là 🆕 vì cơ chế state độc lập là đặc thù web.

## Các bước thực hiện
1. Ở "Chỉ tiêu tài chính", đổi select sang "TTM", theo dõi network.

## Kết quả mong đợi
- [ ] Request `GET /api/stocks/financial-ratios...` mới được gửi với `thoigian=ttm`.

---

# [TC_PTCB_TCDN_15] State Quý/Năm/TTM của "Chỉ tiêu tài chính" ĐỘC LẬP với Quý/Năm của BS/IS/CF/TM

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `type_time_financial_ratios` và `type_time_bctc` là 2 data property RIÊNG BIỆT trong
  `BusinessFinance/index.vue` — đổi 1 bên không ảnh hưởng bên còn lại.

## Các bước thực hiện
1. Đổi select "Quý"/"Năm" ở "Bảng cân đối kế toán" sang "Năm".
2. Chuyển sang "Chỉ tiêu tài chính".

## Kết quả mong đợi
- [ ] Select Quý/Năm/TTM ở "Chỉ tiêu tài chính" vẫn giữ mặc định "Quý" (không bị đổi theo BS).

---

## Nhóm: Thu gọn/Mở rộng dòng phân cấp (BS/IS/CF/TM)

# [TC_PTCB_TCDN_16] Click dòng cha ẩn/hiện các dòng con

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (đếm số dòng thật): Pass**
- **Tham chiếu App:** TC 111 (Sheet, "Check click expand dòng" — đảo chiều: web mặc định mở rộng, click để thu
  gọn, giống hành vi TC 112 "Check click collapse dòng")

## Các bước thực hiện
1. Đếm tổng số dòng trong bảng "Bảng cân đối kế toán".
2. Click vào dòng "A. Tài sản lưu động và đầu tư ngắn hạn" (đang mở rộng mặc định).
3. Đếm lại số dòng, sau đó click lại để mở rộng.

## Kết quả mong đợi
- [ ] Sau bước 2: số dòng giảm (các dòng con `I.`, `II.`... bị ẩn).
- [ ] Sau bước 3: số dòng khôi phục đúng bằng số dòng ban đầu.

---

# [TC_PTCB_TCDN_17] Icon caret đổi hướng đúng theo trạng thái thu gọn/mở rộng

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (đo `data-icon` SVG thật): Pass**
- **Tham chiếu App:** TC 110 (Sheet, "Check icon expand/collapse các dòng")

## Các bước thực hiện
1. Quan sát icon caret của dòng "A. Tài sản lưu động và đầu tư ngắn hạn" (mặc định mở rộng).
2. Click để thu gọn, quan sát lại icon.

## Kết quả mong đợi
- [ ] Mặc định: icon `caret-down` (▼).
- [ ] Sau khi thu gọn: icon đổi thành `caret-right` (▶).

---

# [TC_PTCB_TCDN_18] "Chỉ tiêu tài chính" không có cấu trúc cây thu gọn/mở rộng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **⚠️ Khác biệt quan trọng so với app:** Sheet app (TC 126, 127, 136) mô tả "Chỉ tiêu TC" của app có 7 NHÓM chỉ
  tiêu thu gọn/mở rộng được (Định giá, Doanh thu và lợi nhuận...). Đọc `FinancialRatios.vue` template: hiển thị
  PHẲNG toàn bộ `financial_ratios_items`, KHÔNG có `is_parent`/`checkHideShow`/icon caret nào — các "nhóm"
  (Định giá, Doanh thu và Lợi nhuận...) chỉ là dòng tiêu đề màu đỏ để phân tách trực quan, KHÔNG thể click thu
  gọn như app.

## Các bước thực hiện
1. Ở "Chỉ tiêu tài chính", đếm số icon caret trong bảng.
2. Click vào 1 dòng tiêu đề nhóm (VD "Định giá").

## Kết quả mong đợi
- [ ] Không có icon caret nào trong bảng.
- [ ] Click vào dòng không có tác dụng ẩn/hiện gì (số dòng không đổi).

---

## Nhóm: Nhóm mã CK khác nhau & KHÔNG có race condition

# [TC_PTCB_TCDN_19] Mã ngân hàng (VCB) hiển thị đúng cấu trúc bảng riêng cho ngân hàng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** BS ngân hàng có cấu trúc khác hẳn BS thường — VD dòng "Cho vay khách hàng" (đặc thù ngân hàng),
  không có ở BS mã thường ("Tài sản lưu động và đầu tư ngắn hạn"...).

## Các bước thực hiện
1. Điều hướng `/phan-tich-co-ban?mack=VCB&tab=tai-chinh-doanh-nghiep`.

## Kết quả mong đợi
- [ ] Bảng "Bảng cân đối kế toán" hiển thị đúng cấu trúc ngân hàng, có dòng "VII. Cho vay khách hàng".

---

# [TC_PTCB_TCDN_20] Deep-link thẳng vào mã ngân hàng KHÔNG có race condition, hiển thị đúng ngay lập tức

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, XÁC NHẬN KHÔNG có bug: Pass**
- **Ghi chú:** Xem phát hiện #0 — khác hẳn tab "Biểu đồ"/"So sánh" (đều có bug race condition đã ghi nhận),
  tab này an toàn 100% vì nhóm mã đọc từ chính response API, không đọc `store.state.list_mack_company`.

## Các bước thực hiện
1. Deep-link thẳng `/phan-tich-co-ban?mack=VCB&tab=tai-chinh-doanh-nghiep` (1 lượt `page.goto`), theo dõi
   network.

## Kết quả mong đợi
- [ ] KHÔNG có request `GET /api/stocks?type=bs...` nào trả lỗi (status >= 400).
- [ ] Bảng hiển thị đúng cấu trúc ngân hàng ngay từ lần render đầu tiên.

---

# [TC_PTCB_TCDN_21] Đổi mã CK từ thường sang ngân hàng qua search cập nhật đúng, không lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Vào tab với mã thường (HPG), chờ tải xong.
2. Gõ và chọn "VCB" qua ô tìm kiếm "Mã CK".

## Kết quả mong đợi
- [ ] Bảng chuyển đúng sang cấu trúc ngân hàng (có dòng "Cho vay khách hàng").
- [ ] Không có lỗi JS console (`pageerror`) phát sinh.

---

## Nhóm: Đổi mã CK giữ nguyên sub-tab

# [TC_PTCB_TCDN_22] Đổi mã CK không làm mất sub-tab đang xem

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `watch: "$store.state.mack"` trong `BusinessFinance/index.vue` chỉ gọi `deactiveTab()` (giữ
  nguyên `type_tab` hiện tại) — cùng pattern đã ghi nhận ở cấp khung/shell (TC_PTCB_07).

## Các bước thực hiện
1. Chuyển sang sub-tab "Lưu chuyển tiền tệ".
2. Đổi mã CK qua ô tìm kiếm sang mã khác (HPG).

## Kết quả mong đợi
- [ ] Sau khi đổi mã, vẫn đang ở sub-tab "Lưu chuyển tiền tệ" (không tự động quay về "Bảng cân đối kế toán").

---

## Nhóm: Loading

# [TC_PTCB_TCDN_23] Loading spinner khi API chậm

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `is_loading` (mỗi component con tự quản lý) set `true` ngay trong `created()` trước khi gọi API
  — hiện `<Loading />` thay thế toàn bộ bảng cho tới khi response về.

## Các bước thực hiện
1. Mock `GET /api/stocks?type=bs...` delay 3 giây.
2. Vào tab, quan sát ngay sau khi vào.

## Kết quả mong đợi
- [ ] Trong lúc chờ: loading indicator hiển thị, chưa có dòng dữ liệu nào.
- [ ] Sau khi response về: loading biến mất, bảng hiện đầy đủ.

---

# [TC_PTCB_TCDN_24] Loading khi chuyển sub-tab lần đầu (mount lại)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Vì mỗi sub-tab là 1 component MOUNT MỚI (xem phát hiện #4), loading spinner xuất hiện lại MỖI
  LẦN chuyển sang sub-tab đó, không chỉ lần đầu tiên vào trang.

## Các bước thực hiện
1. Vào tab, chờ "Bảng cân đối kế toán" tải xong.
2. Mock `GET /api/stocks?type=is...` delay 3 giây, chuyển sang "Kết quả kinh doanh".

## Kết quả mong đợi
- [ ] Loading indicator hiển thị khi chuyển sub-tab, biến mất sau khi có dữ liệu.

---

## Nhóm: Lỗi mạng / dữ liệu rỗng

# [TC_PTCB_TCDN_25] Mất mạng khi tải BS không crash, chỉ còn header "Thông tin"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `bs_update().catch()` set `data_bctc = []` — `bs_fields` computed trả về CHỈ cột mặc định
  ("Thông tin") khi `data_bctc` rỗng, `bs_items` trả về `[]` (0 dòng) — không throw lỗi, không toast.

## Các bước thực hiện
1. Chặn `GET /api/stocks?type=bs...` (`route.abort()`).
2. Vào tab.

## Kết quả mong đợi
- [ ] Bảng chỉ còn 1 cột header "Thông tin", 0 dòng dữ liệu.
- [ ] Không phát sinh lỗi JS console (`pageerror`) nào.

---

# [TC_PTCB_TCDN_26] API trả mảng rỗng — bảng trống, không lỗi

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `if (response.data.length == 0) { this.data_bctc = []; return; }` — cùng kết quả với lỗi mạng ở
  TC_PTCB_TCDN_25 (mã CK mới niêm yết/chưa có BCTC sẽ rơi vào trường hợp này, liên quan TC 117 Sheet "Check khi
  không có dữ liệu").

## Các bước thực hiện
1. Mock `GET /api/stocks?type=bs...` trả về `[]`.
2. Vào tab.

## Kết quả mong đợi
- [ ] Bảng trống (0 dòng), không lỗi console.

---

# [TC_PTCB_TCDN_27] Lỗi 500 — nuốt lỗi im lặng, không toast, không crash

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý (UX gap, không phải crash):** `.catch((error) => { this.data_bctc = []; ... })`
  KHÔNG gọi `this.$toast.error(...)` — người dùng gặp lỗi 500 khi tải BS/IS/CF/TM/Chỉ tiêu tài chính sẽ chỉ
  thấy bảng trống, KHÔNG có bất kỳ thông báo nào giải thích lý do. CÙNG PATTERN đã ghi nhận ở `getAll()` tab So
  sánh (TC_PTCB_SS_23) — nhưng ở đây hành vi NHẤT QUÁN trên cả 5 sub-report (không có sub-report nào toast lỗi
  khác biệt).

## Các bước thực hiện
1. Mock `GET /api/stocks?type=bs...` trả lỗi 500.
2. Vào tab.

## Kết quả mong đợi
- [ ] Bảng trống (0 dòng), không có toast/thông báo lỗi nào hiển thị cho người dùng.
- [ ] Không phát sinh lỗi JS console (`pageerror`) nào.

---

## Nhóm: Giới hạn theo gói hội viên (Free)

# [TC_PTCB_TCDN_28] Free — "Bảng cân đối kế toán"/"Kết quả kinh doanh"/"Lưu chuyển tiền tệ" KHÔNG bị khoá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #2 — `features_disabled` của tài khoản Free hiện tại không có `fa_cdkt`/
  `fa_kqkd`/`fa_lctt`.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click lần lượt "Bảng cân đối kế toán", "Kết quả kinh doanh", "Lưu chuyển tiền tệ".

## Kết quả mong đợi
- [ ] Cả 3 sub-tab hiển thị dữ liệu đầy đủ, KHÔNG có `ProtectedView` (ảnh mờ) nào che nội dung.

---

# [TC_PTCB_TCDN_29] Free — "Chỉ tiêu tài chính" BỊ khoá (ProtectedView ảnh mờ tĩnh)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #2 — `features_disabled` CÓ `fa_cttc`. `ProtectedView` bọc TOÀN BỘ vùng bảng,
  thanh sub-tab + select Quý/Năm/TTM VẪN hiển thị bình thường bên trên.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click "Chỉ tiêu tài chính".

## Kết quả mong đợi
- [ ] Vùng bảng bị thay bằng `ProtectedView` (ảnh mờ tĩnh).
- [ ] Sub-tab "Chỉ tiêu tài chính" vẫn active, select Quý/Năm/TTM vẫn hiển thị.

---

# [TC_PTCB_TCDN_30] Free — mặc định "Tỷ đồng"/"Năm", 2 select bị disable

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #3.

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào tab (sub-tab "Bảng cân đối kế toán").

## Kết quả mong đợi
- [ ] Select đơn vị = "Tỷ đồng", bị disable (không click đổi được).
- [ ] Select Quý/Năm = "Năm", bị disable.

---

# [TC_PTCB_TCDN_31] Free — click "Đăng ký ngay" trên ProtectedView mở modal nâng cấp gói

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `ProtectedView.vue` chỉ hiện nút "Đăng ký ngay" + text "Bạn cần nâng cấp gói hội viên để sử dụng
  chức năng này." khi HOVER vào ảnh mờ (`isButtonVisible`, ẩn mặc định) — click nút gọi
  `store.state.isShowModalPackage = true`, mở modal nâng cấp gói DÙNG CHUNG toàn site.

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào "Chỉ tiêu tài chính" (đã bị khoá).
2. Hover vào ảnh mờ, click nút "Đăng ký ngay".

## Kết quả mong đợi
- [ ] Hover hiện text "Bạn cần nâng cấp gói hội viên..." + nút "Đăng ký ngay".
- [ ] Click nút mở 1 modal mới (`role="dialog"`).

---

# [TC_PTCB_TCDN_32] Free — chuyển từ "Chỉ tiêu tài chính" (bị khoá) quay lại "Bảng cân đối kế toán" phục hồi bình thường

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `disable_featureName` tính LẠI theo `type_tab` mỗi lần đổi sub-tab (không phải cờ cố định) — xác
  nhận không bị "kẹt" trạng thái khoá khi quay về sub-tab không bị gate.

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào "Chỉ tiêu tài chính" (xác nhận bị khoá).
2. Quay lại "Bảng cân đối kế toán".

## Kết quả mong đợi
- [ ] `ProtectedView` biến mất, bảng "Bảng cân đối kế toán" hiển thị dữ liệu bình thường.

---

# [TC_PTCB_TCDN_33] Free (không role coworker) — "Thuyết minh" ẩn hoàn toàn (khác gate theo gói hội viên)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #1 — đây KHÔNG phải kết quả của gói hội viên Free, mà vì tài khoản
  Free hiện tại tình cờ cũng không có role `coworker`. Về mặt kỹ thuật, 1 tài khoản VIP không có role
  `coworker` cũng sẽ KHÔNG thấy "Thuyết minh" (2 khái niệm độc lập).

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào tab.

## Kết quả mong đợi
- [ ] Chỉ hiển thị 4 sub-tab (không có "Thuyết minh").

---

## Nhóm: Deep-link & URL

# [TC_PTCB_TCDN_34] Deep-link `?tab=tai-chinh-doanh-nghiep` mở đúng tab, mặc định sub-tab BS

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** liên quan TC 1 (Sheet, overview)

## Các bước thực hiện
1. Điều hướng `/phan-tich-co-ban?mack=VNM&tab=tai-chinh-doanh-nghiep`.

## Kết quả mong đợi
- [ ] Tab chính "Tài chính doanh nghiệp" active.
- [ ] Sub-tab "Bảng cân đối kế toán" active mặc định.

---

# [TC_PTCB_TCDN_35] Chuyển sub-tab KHÔNG đổi URL, F5 quay về sub-tab mặc định BS

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, cùng pattern đã ghi nhận ở khung/shell: Pass**
- **Ghi chú:** Click sub-tab chỉ set `type_tab` (data cục bộ) — không `router.push`/đổi query — CÙNG PATTERN
  TC_PTCB_13 (chuyển 6 tab chính) và TC_NKGD_06 (Nhật ký GD).

## Các bước thực hiện
1. Chuyển sang sub-tab "Lưu chuyển tiền tệ".
2. Tải lại trang (F5) mà không đổi URL.

## Kết quả mong đợi
- [ ] URL không đổi khi chuyển sub-tab.
- [ ] Sau F5, quay về sub-tab mặc định "Bảng cân đối kế toán" (không giữ "Lưu chuyển tiền tệ").

---

## Nhóm: Hiệu ứng hover cột

# [TC_PTCB_TCDN_36] Hover highlight cột theo quý ở chế độ "Quý", KHÔNG highlight ở "Năm"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `list_column_..._contain_quarter` computed (mỗi sub-report có bản riêng) chỉ trả về danh sách cột
  cần highlight khi `type_time == "quarter"` VÀ nhãn cột bắt đầu bằng "Q" — ở chế độ "Năm" (nhãn cột là số năm,
  không có "Q") danh sách này luôn rỗng nên hover không highlight gì.

## Các bước thực hiện
1. Ở chế độ "Quý" (mặc định), hover vào 1 ô dữ liệu.
2. Đổi sang "Năm", hover vào ô dữ liệu tương ứng.

## Kết quả mong đợi
- [ ] Ở "Quý": cả cột (class `bghover`) được highlight khi hover.
- [ ] Ở "Năm": không có highlight nào khi hover.

---

## Nhóm: Responsive

# [TC_PTCB_TCDN_37] Responsive viewport mobile/tablet

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị tab có dữ liệu.
2. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024).

## Kết quả mong đợi
- [ ] Thanh sub-tab + bảng vẫn hiển thị được (bảng cuộn ngang), không vỡ layout nghiêm trọng.

---

## Tổng hợp trạng thái (37 testcase)

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-tai-chinh-doanh-nghiep.spec.ts](../tests/phan-tich-co-ban-tai-chinh-doanh-nghiep.spec.ts)
(POM: section "Tab Tài chính doanh nghiệp" trong [pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 8 | TC_PTCB_TCDN_02, 03, 08, 11, 12, 16, 17, 34 |
| 🆕 Mới (riêng web) | 29 | TC_PTCB_TCDN_01, 04, 05, 06, 07, 09, 10, 13, 14, 15, 18-33, 35, 36, 37 |
| ⚠️ Cần xác nhận thêm | 0 | — |

Không có `test.fixme` nào trong file spec này — toàn bộ 37 testcase đều tự động hoá và pass được (không có
tính năng kéo-thả/upload/download nào trong tab này, khác các tab "So sánh"/"Biểu đồ" có modal "Thêm mã" dùng
`vuedraggable`).

**Phát hiện đáng chú ý cần theo dõi:**
1. **[XÁC NHẬN AN TOÀN] KHÔNG có race condition `nhom_stockcode`** như tab "Biểu đồ"/"So sánh" — nhóm mã đọc từ
   chính response API, không đọc `store.state.list_mack_company` nạp bất đồng bộ. Xem phát hiện #0,
   TC_PTCB_TCDN_20.
2. **"Thuyết minh" gate theo ROLE tài khoản (`localStorage.roles` chứa `"coworker"`), hoàn toàn độc lập với gói
   hội viên** — kiểu gate thứ 3 chưa từng ghi nhận ở các tab khác (khác `features_disabled` cấp shell/widget và
   `isAccountFree`). Xem phát hiện #1, TC_PTCB_TCDN_04/33.
3. **Gating theo gói hội viên ở cấp TỪNG SUB-TAB** (`fa_cdkt`/`fa_kqkd`/`fa_lctt`/`fa_cttc`) — tài khoản Free
   hiện tại CHỈ bị khoá "Chỉ tiêu tài chính" (`fa_cttc` có trong `features_disabled`), 3 sub-tab BS/IS/CF hiển
   thị bình thường. Xem phát hiện #2, TC_PTCB_TCDN_28/29.
4. **Free còn bị ép mặc định "Tỷ đồng"/"Năm" + khoá đổi đơn vị/kỳ, độc lập với gate #3** (áp dụng cho MỌI
   sub-tab kể cả không bị khoá nội dung). Xem phát hiện #3, TC_PTCB_TCDN_30.
5. **Không có caching client-side** — mỗi lần chuyển sub-tab luôn gọi lại API (unmount/remount thật). Xem phát
   hiện #4, TC_PTCB_TCDN_07.
6. **Lỗi mạng/500 bị nuốt im lặng, không toast** trên cả 5 sub-report — cùng pattern UX gap đã ghi nhận ở
   `getAll()` tab So sánh, nhưng ở đây NHẤT QUÁN trên toàn bộ tab (không có sub-report nào toast khác biệt). Xem
   TC_PTCB_TCDN_27.
7. **"Chỉ tiêu tài chính" KHÔNG có cấu trúc cây thu gọn/mở rộng như app mô tả** (Sheet TC 126/127/136 kỳ vọng 7
   nhóm thu gọn được) — web hiển thị PHẲNG toàn bộ, các "nhóm" chỉ là dòng tiêu đề trực quan không click được.
   Xem TC_PTCB_TCDN_18.
