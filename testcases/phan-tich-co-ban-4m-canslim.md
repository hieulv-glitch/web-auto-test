# Màn hình: Phân tích cơ bản — Tab "4M & CANSLIM"

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=4m-canslim`.
- **Component:** [stocks/src/views/pages/FourmAndCanslim.vue](../../stocks/src/views/pages/FourmAndCanslim.vue)
  (`name: "FourmAndCanslim"`), nhận prop `:mack="stockcode"` từ shell
  [faAnalysis/index.vue](../../stocks/src/views/faAnalysis/index.vue), mount khi `active_tab['4m_canslim']` bật
  (`v-if`, chỉ mount 1 lần, sau đó chỉ toggle `v-show`).
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Google Sheet, tab "Phân Tích FA(Cổ Phiếu)", các dòng TC ID 195-221 ("Tab 4M &
  Canslim - Overview"). Sheet chỉ dùng tham khảo văn phong/không bỏ sót khía cạnh — độ phủ thật sự do tự kiểm kê
  source code (`FourmAndCanslim.vue` đầy đủ) + DOM thật (`inspect-dom.ts` + nhiều script Playwright tạm thời đo
  network/DOM) quyết định. **Khác biệt kiến trúc quan trọng so với app:** app có "toggle 2 view" (icon @ = radar,
  icon biểu đồ = lịch sử) cho phép chuyển qua lại giữa 2 dạng xem CHO TỪNG PHẦN (4M/Canslim) — web KHÔNG có
  toggle này, hiển thị ĐỒNG THỜI cả biểu đồ lịch sử (bên trái) VÀ biểu đồ radar (bên phải) cạnh nhau, luôn luôn
  cả 2 cùng lúc.
- **Quy ước trạng thái:** giống `phan-tich-co-ban-so-sanh.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng
  web) · ⚠️ Cần xác nhận thêm.
- **An toàn dữ liệu:** Tab này KHÔNG có API mutate nào (chỉ đọc điểm số — `GET
  /api/stocks/chart/fourm-canslim-point-chart` và `GET .../fourm-canslim-point-chart-by-time`) — an toàn gọi
  API thật cho mọi testcase, không cần mock trừ các case cố ý giả lập lỗi/trạng thái N/A/cảnh báo (dùng
  `page.route()` chỉ để KIỂM SOÁT response trả về, không phải để chặn ghi dữ liệu).
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Test nào đổi mã CK (TC_PTCB_4M_10) chỉ là thao tác XEM (không
  mutate), nhưng có thể ảnh hưởng `final_mack` mà test khác đang kỳ vọng nếu chạy song song — file spec chọn lại
  đúng VNM sau khi test xong.

## ⚠️ ĐÍNH CHÍNH quan trọng — đọc trước khi dùng lại ghi chú cũ ở `phan-tich-co-ban.md`/`phan-tich-co-ban.spec.ts`

Ghi chú **TC_PTCB_16** (trong `testcases/phan-tich-co-ban.md`) và comment tại **TC_PTCB_17**
(`tests/phan-tich-co-ban.spec.ts`) mô tả gating của tab này như sau: *"tab '4M & CANSLIM' CÓ 1 `ProtectedView`
RIÊNG ở cấp WIDGET CON (2 biểu đồ radar bị mờ, phần thang điểm 4M/CANSLIM + biểu đồ đường lịch sử vẫn hiển thị
bình thường)"*. **Đã đo lại bằng automation thật (tài khoản Free) ở lượt sinh testcase này và xác nhận mô tả
trên SAI** — nguyên nhân nhiều khả năng do lần đo trước chỉ nhìn ảnh chụp màn hình bề ngoài (ảnh mockup tĩnh
trông giống layout thật) mà chưa kiểm tra DOM/network thật. Hành vi ĐÚNG (đọc từ `FourmAndCanslim.vue` dòng 1-2
+ xác nhận qua automation):

```html
<ProtectedView featureName="fa_4m_cansslim" v-if="disable_featureName" />
<div v-else class="card-header p-0 pt-4">...toàn bộ nội dung thật (2 khối điểm + radar + lịch sử)...</div>
```

- `disable_featureName` = `store.state.features_disabled.hasOwnProperty("fa_4m_cansslim")` — **feature này CÓ
  trong `features_disabled` của tài khoản Free hiện tại** (đã xác nhận qua `localStorage`).
- Khi `true`, **TOÀN BỘ** nội dung tab (`.chart-wrapper`, đo được **0 phần tử** khi gated) bị thay thế bởi
  **ĐÚNG 1** `<ProtectedView>` — không có bất kỳ phần nào của thang điểm/biểu đồ lịch sử render thật.
- `ProtectedView` (xem [ProtectedView.vue](../../stocks/src/views/ProtectedView.vue)) chỉ render **1 `<img>`
  DUY NHẤT** — `src` = URL ảnh mockup TĨNH lấy từ `features_disabled['fa_4m_cansslim'].blur_img[0|1]` (VD
  `https://api2.kfsp.vn/public/blur/fa_4m_cansslim.png`). Ảnh này được THIẾT KẾ SẴN trông giống layout thật (có
  số điểm mẫu "68.74"/"88.59", biểu đồ lịch sử mẫu, và tự bản thân ảnh đã "mờ" sẵn 2 vùng radar bên trong nội
  dung ảnh) — **hoàn toàn KHÔNG PHẢI dữ liệu thật** render bằng Vue/echarts.
- `getFourmAndCanslim()` có `if (this.disable_featureName) return;` — **API tính điểm thật KHÔNG được gọi** khi
  bị gate (đã xác nhận: 0 request `fourm-canslim-point-chart` khi tài khoản Free tải tab, kể cả sau F5).
- Hover vào ảnh mockup hiện `v-if="isButtonVisible"` text "Bạn cần nâng cấp gói hội viên để sử dụng chức năng
  này." + nút "Đăng ký ngay" (chỉ xuất hiện trong DOM khi hover, không phải ẩn bằng CSS) — click nút mở 1 modal
  (`store.state.isShowModalPackage = true`).

**Khuyến nghị:** coi TC_PTCB_4M_17/18 bên dưới là mô tả ĐÚNG hiện tại cho gating của tab này; nên cập nhật lại
ghi chú ở `phan-tich-co-ban.md`/`phan-tich-co-ban.spec.ts` (TC_PTCB_16/17) trong 1 lượt riêng để tránh gây hiểu
lầm cho người đọc sau.

---

## Nhóm: Tổng quan & hiển thị tĩnh

# [TC_PTCB_4M_01] Overview tab 4M & CANSLIM (tài khoản đầy đủ quyền, dữ liệu hợp lệ)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 195 (Sheet)
- **Khác biệt so với app:** App có toggle 2 view (radar/lịch sử) cho mỗi phần, mặc định "4M" hiện radar còn
  "CANSLIM" hiện lịch sử (ngược nhau). Web hiển thị **ĐỒNG THỜI cả 2 dạng cho CẢ 2 phần** (không toggle) — mỗi
  khối "Điểm 4M"/"Điểm Canslim" đều có sẵn cả thanh điểm + biểu đồ lịch sử (card trái) VÀ biểu đồ radar (card
  phải).

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=4m-canslim`.

## Kết quả mong đợi
- [ ] Hiện logo "KungFuStocksPro Exclusive" ở đầu trang (luôn hiện, không phụ thuộc trạng thái loading).
- [ ] Khối "Điểm 4M": tiêu đề, thanh điểm (ScoreBar) hiện số điểm hợp lệ, biểu đồ đường lịch sử điểm theo quý
      (card trái) + biểu đồ radar (card phải).
- [ ] Khối "Điểm Canslim": cấu trúc tương tự, ngay dưới khối 4M.
- [ ] Footer disclaimer "Tuyên bố trách nhiệm/Disclaimer: ..." hiển thị cuối trang.

---

# [TC_PTCB_4M_02] Thanh điểm (ScoreBar) hiển thị đúng số điểm cho cả 2 khối

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 196, 197, 206, 217 (Sheet)
- **Ghi chú:** `ScoreBar.vue` render thanh gradient 4 màu (đỏ→cam→xanh nhạt→xanh đậm) + tag số điểm
  (`.score-tooltip`) định vị theo tỉ lệ `score/100`. Web hiện SỐ THẬT (không làm tròn kiểu app "57.18" → có thể
  2 chữ số thập phân, VD "67.55").

## Các bước thực hiện
1. Vào tab 4M & CANSLIM với mã có dữ liệu hợp lệ (VNM).

## Kết quả mong đợi
- [ ] Cả 2 thanh điểm (4M, Canslim) hiện đúng số điểm khớp với giá trị API trả về (`.score-tooltip`).
- [ ] Thanh gradient hiển thị đủ dải màu đỏ→cam→xanh nhạt→xanh đậm.

---

# [TC_PTCB_4M_03] Biểu đồ radar "Điểm 4M" render đúng vị trí (canvas)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation + xác nhận qua ảnh chụp DOM thật: Pass**
- **⚠️ Giới hạn kỹ thuật quan trọng (áp dụng cho MỌI testcase liên quan nội dung bên trong biểu đồ radar/lịch sử
  trong tài liệu này):** `CustomEChart` dùng `CanvasRenderer` của echarts (xem
  `stocks/src/views/charts/CustomEchart.vue`) — TOÀN BỘ nội dung biểu đồ (label chỉ tiêu radar, giá trị từng
  điểm trên biểu đồ lịch sử, trục số...) được VẼ TRÊN `<canvas>` dạng pixel, KHÔNG PHẢI text DOM thật. Đã xác
  nhận qua `ariaSnapshot`: không có bất kỳ label chỉ tiêu radar (VD "ROIC", "Nợ dài hạn") hay giá trị điểm lịch
  sử (VD "64.65") nào xuất hiện trong cây accessibility — Playwright's `getByText()`/locator KHÔNG thể assert
  được nội dung bên trong canvas. Vì vậy các testcase liên quan CHỈ verify được: canvas tồn tại + hiển thị +
  kích thước hợp lý (qua `toBeVisible()`/`boundingBox()`), và các hành vi TƯƠNG TÁC có tác dụng phụ quan sát
  được qua DOM thật khác hoặc qua network request (VD click đổi thời điểm — xem nhóm "Tương tác biểu đồ lịch
  sử"). Nội dung chi tiết bên trong canvas (đúng 11/10 label, đúng giá trị số...) đã được xác nhận ĐÚNG bằng
  mắt qua ảnh chụp DOM thật lúc kiểm kê (`.dom-inspect/ptcb-4m-main.png`), liệt kê lại trong "Ghi chú" các
  testcase 03/04 để tham khảo, nhưng KHÔNG có assertion tự động cho đúng nội dung chữ bên trong canvas.
- **Khác biệt so với app:** App liệt kê 10 chỉ tiêu 4M (TC 201/202: %G DT Hoạt động, %G DT Tài chính, %G EPS,
  %G BVPS, %G OCF, Vòng quay tài sản, Biên lợi nhuận, Chất Lượng lợi nhuận, ROA, ROE, Dự phòng). Web đo được qua
  ảnh chụp DOM thật (không phải assertion tự động, xem giới hạn trên) có **11 chỉ tiêu, tên khác 1 số nhãn**:
  %G Doanh thu, %G EPS, %G BVPS, %G OCF, Nợ dài hạn, Vòng quay tài sản, Biên lợi nhuận, Chất Lượng lợi nhuận,
  ROA, ROE, ROIC.

## Các bước thực hiện
1. Vào tab 4M & CANSLIM với mã có dữ liệu hợp lệ (VNM).
2. Quan sát biểu đồ radar bên phải khối "Điểm 4M".

## Kết quả mong đợi
- [ ] Canvas biểu đồ radar hiển thị (visible), kích thước hợp lý (không co về 0x0).

---

# [TC_PTCB_4M_04] Biểu đồ radar "Điểm Canslim" render đúng vị trí (canvas)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation + xác nhận qua ảnh chụp DOM thật: Pass**
- **Ghi chú:** Xem giới hạn kỹ thuật ở TC_PTCB_4M_03 (nội dung canvas không assert được text tự động). Chỉ tiêu
  Canslim đo được qua ảnh chụp (không phải assertion): "%G Doanh thu Q", "%G Doanh thu Q-1", "%G Doanh thu TTM",
  "%G Doanh thu TTM-1", "%G EPS Q", "%G EPS Q-1", "%G EPS TTM", "%G EPS TTM-1", "ROE TTM", "ROE TTM-1".

## Các bước thực hiện
1. Quan sát biểu đồ radar bên phải khối "Điểm Canslim".

## Kết quả mong đợi
- [ ] Canvas biểu đồ radar hiển thị (visible), kích thước hợp lý.

---

# [TC_PTCB_4M_05] Biểu đồ lịch sử điểm 4M render đúng vị trí (canvas)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation + xác nhận qua ảnh chụp DOM thật: Pass**
- **Tham chiếu App:** TC 210, 211 (Sheet, áp dụng chéo từ mô tả biểu đồ lịch sử CANSLIM của app do web hiện cả
  2 loại biểu đồ lịch sử cho cả 4M lẫn Canslim, không phân biệt như app)
- **Ghi chú:** Xem giới hạn kỹ thuật ở TC_PTCB_4M_03 — trục số/giá trị từng điểm là canvas, không assert text tự
  động được. Qua ảnh chụp DOM thật xác nhận: trục Y hiện mốc 0/20/40/60/80/100, trục X hiện các quý gần nhất
  (VD "Q2.24"..."Q2.26"), mỗi điểm hiện số phía trên (VD "64.65", "64.08"...), điểm mới nhất có bookmark tròn
  nổi bật (xanh nếu ≥ 50, đỏ nếu < 50).

## Các bước thực hiện
1. Quan sát biểu đồ đường bên trái khối "Điểm 4M".

## Kết quả mong đợi
- [ ] Canvas biểu đồ lịch sử hiển thị (visible), kích thước hợp lý.

---

# [TC_PTCB_4M_06] Biểu đồ lịch sử điểm Canslim render đúng vị trí (canvas)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 210, 211 (Sheet)
- **Ghi chú:** Xem giới hạn kỹ thuật ở TC_PTCB_4M_03.

## Các bước thực hiện
1. Quan sát biểu đồ đường bên trái khối "Điểm Canslim".

## Kết quả mong đợi
- [ ] Canvas biểu đồ lịch sử hiển thị (visible), kích thước hợp lý.

---

## Nhóm: Tương tác biểu đồ lịch sử (xem điểm tại thời điểm khác)

# [TC_PTCB_4M_07] Click 1 điểm trên biểu đồ lịch sử "Điểm 4M" tải lại đúng dữ liệu tại thời điểm đó

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `clickChart4MHistory(e)` gọi `GET .../fourm-canslim-point-chart-by-time?mack=...&type=4m&time=...`
  — cập nhật LẠI thang điểm + radar 4M theo đúng thời điểm được chọn, trong khi biểu đồ Canslim (khối dưới)
  KHÔNG bị ảnh hưởng. Loading lúc này chỉ che RADAR chart (`is_loading_4m`), KHÔNG che toàn tab
  (`is_loading` không đổi).

## Các bước thực hiện
1. Click vào 1 điểm dữ liệu (quá khứ) trên biểu đồ lịch sử "Điểm 4M".

## Kết quả mong đợi
- [ ] Request `GET .../fourm-canslim-point-chart-by-time` với `type=4m` được gửi đi, kèm đúng `time` tương ứng
      quý đã click.
- [ ] Sau khi có kết quả: thang điểm + biểu đồ radar "Điểm 4M" cập nhật theo điểm tại thời điểm đã chọn; khối
      "Điểm Canslim" không đổi.

---

# [TC_PTCB_4M_08] Click 1 điểm trên biểu đồ lịch sử "Điểm Canslim" tải lại đúng dữ liệu tại thời điểm đó

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Tương tự TC_PTCB_4M_07 nhưng `clickChartCanslimHistory(e)` gọi API với `type=canslim`, chỉ ảnh
  hưởng khối "Điểm Canslim".

## Các bước thực hiện
1. Click vào 1 điểm dữ liệu (quá khứ) trên biểu đồ lịch sử "Điểm Canslim".

## Kết quả mong đợi
- [ ] Request `GET .../fourm-canslim-point-chart-by-time` với `type=canslim` được gửi đi.
- [ ] Thang điểm + radar "Điểm Canslim" cập nhật theo đúng thời điểm; khối "Điểm 4M" không đổi.

---

## Nhóm: Đổi mã CK / Deep-link

# [TC_PTCB_4M_09] Đổi mã CK qua ô tìm kiếm tự động tải lại dữ liệu 4M & CANSLIM theo mã mới

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `watch: "$store.state.mack"` gọi lại `getFourmAndCanslim()` mỗi khi đổi mã CK ở bất kỳ đâu trên
  trang (kể cả ở tab khác, do component không unmount — `v-show`).

## Các bước thực hiện
1. Đang ở tab 4M & CANSLIM với mã VNM, ghi nhận điểm 4M hiện tại.
2. Gõ và chọn mã khác (HPG) qua ô tìm kiếm "Mã CK".

## Kết quả mong đợi
- [ ] Thang điểm + biểu đồ (cả 4M lẫn Canslim) cập nhật lại theo đúng dữ liệu của mã mới (khác giá trị mã cũ,
      hoặc giữ nguyên nếu trùng — nhưng request mới PHẢI được gửi đi với `mack=HPG`).

---

# [TC_PTCB_4M_10] Deep-link trực tiếp vào tab tải đúng dữ liệu ngay từ đầu — KHÔNG có bug race condition như tab So Sánh

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, xác nhận KHÔNG có bug: Pass**
- **Ghi chú:** Khác tab "So sánh" (`Compare.getAll()` đọc `store.state.list_mack_company` — nạp BẤT ĐỒNG BỘ qua
  socket — gây race condition, xem `phan-tich-co-ban-so-sanh.md` TC_PTCB_SS_02),
  `FourmAndCanslim.created()` chỉ đọc prop `mack` (= `$store.state.mack`, set ĐỒNG BỘ ngay từ đầu bởi
  `$route.query.mack` trong `index.vue`) — không phụ thuộc bất kỳ state nào nạp bất đồng bộ. Đã tự động hoá xác
  nhận: deep-link 1 lượt `page.goto()` đầy đủ (không qua điều hướng SPA) vẫn tải đúng dữ liệu ngay lần đầu,
  không cần thao tác gì thêm để "sửa" dữ liệu như tab So Sánh.

## Các bước thực hiện
1. Deep-link thẳng `/phan-tich-co-ban?mack=VNM&tab=4m-canslim` (1 lượt `page.goto`, không thao tác gì thêm).

## Kết quả mong đợi
- [ ] Ngay sau khi trang tải xong (không cần chờ thêm thao tác), cả 2 khối 4M/Canslim hiện đúng dữ liệu thật
      (thang điểm có số hợp lệ, không phải rỗng/mặc định).

---

## Nhóm: Trạng thái N/A / Cảnh báo (mock API)

# [TC_PTCB_4M_11] Điểm N/A hiện badge đỏ + banner "Không đủ dữ liệu để chấm điểm"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock API): Pass**
- **Ghi chú:** `is_show_explain` chỉ thật sự phụ thuộc `fourm_point == 'N/A'` (nhánh `canslim_point < 'N/A'`
  trong code luôn `false` về mặt logic JS — so sánh number với string 'N/A' luôn ép kiểu NaN — nhiều khả năng là
  dead code/lỗi nhỏ của dev, không phải business rule thật). Mock cả `fourm_point`/`canslim_point = -1` (→
  "N/A") để kiểm tra đủ cả 2 khối.

## Các bước thực hiện
1. Mock `GET .../fourm-canslim-point-chart` trả về `fourm_point: -1, canslim_point: -1`.
2. Vào tab 4M & CANSLIM.

## Kết quả mong đợi
- [ ] Banner đỏ "Không đủ dữ liệu để chấm điểm" hiển thị (thay cho vùng biểu đồ/thanh điểm phía trên).
- [ ] Cả 2 badge đỏ "N/A" hiện thay cho ScoreBar ở cả khối 4M và Canslim.

---

# [TC_PTCB_4M_12] Banner cảnh báo hiện đúng số lượng + tooltip liệt kê chi tiết khi hover

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock API): Pass**
- **⚠️ Phát hiện đáng chú ý:** Banner cảnh báo (`v-else-if="warning.length"`) và banner "Không đủ dữ liệu"
  (`v-if="is_show_explain"`) dùng CHUNG 1 vị trí, LOẠI TRỪ LẪN NHAU — nếu điểm là N/A (TC_PTCB_4M_11), banner
  cảnh báo SẼ KHÔNG hiển thị dù `warning` có dữ liệu (đã xác nhận qua automation: mock cả `fourm_point: -1` LẪN
  `fourm_warning` có 2 phần tử → chỉ banner "Không đủ dữ liệu" hiện, cảnh báo bị ẩn hoàn toàn, không có cách nào
  xem được nội dung cảnh báo trong trường hợp này).

## Các bước thực hiện
1. Mock `GET .../fourm-canslim-point-chart` trả về điểm hợp lệ (VD `fourm_point: 55`) + `fourm_warning: ['Cảnh
   báo test 1', 'Cảnh báo test 2']`.
2. Vào tab 4M & CANSLIM, hover vào icon cảnh báo.

## Kết quả mong đợi
- [ ] Banner "Mã VNM có 2 cảnh báo" hiển thị (kèm icon).
- [ ] Hover vào banner hiện tooltip liệt kê đủ 2 dòng cảnh báo đúng nội dung mock.

---

## Nhóm: Loading / Lỗi mạng

# [TC_PTCB_4M_13] Loading toàn tab khi tải lần đầu chậm

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `is_loading` mặc định `true`, hiện `CElementCover`+`CSpinner` che nội dung; logo "KungFuStocksPro
  Exclusive" vẫn hiện (không thuộc vùng `v-if="!is_loading"`).

## Các bước thực hiện
1. Mock `GET .../fourm-canslim-point-chart` delay 3 giây trước khi trả kết quả thật.
2. Vào tab 4M & CANSLIM, quan sát ngay sau khi vào.

## Kết quả mong đợi
- [ ] Trong lúc chờ: spinner loading hiện, KHÔNG hiển thị thang điểm/biểu đồ (khối "Điểm 4M"/"Điểm Canslim"
      chưa render).
- [ ] Sau khi response về: loading biến mất, đầy đủ nội dung hiện ra bình thường.

---

# [TC_PTCB_4M_14] Lỗi mạng khi tải điểm ban đầu không crash, không toast — về trạng thái N/A mặc định

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý (UX gap, không phải crash):** `.catch()` chỉ `console.error(err)` + reset các
  `options_chart_*` về `{}` + `is_loading = false` — KHÔNG gọi toast lỗi nào, cùng pattern "nuốt lỗi âm thầm" đã
  ghi nhận ở tab So Sánh (`getAll()`, xem TC_PTCB_SS_23). Vì `fourm_point`/`canslim_point` giữ nguyên giá trị
  mặc định `"N/A"` (không được set lại trong catch), badge đỏ "N/A" hiện — NHƯNG banner "Không đủ dữ liệu để
  chấm điểm" KHÔNG hiện (khác TC_PTCB_4M_11) vì `is_show_explain` cũng giữ nguyên giá trị mặc định `false`
  (không được set trong catch) — cùng 1 biểu hiện "N/A" nhưng banner giải thích có/không tùy nguyên nhân (lỗi
  mạng vs. API trả `-1` tường minh), dễ gây khó hiểu cho người dùng.

## Các bước thực hiện
1. Chặn `GET .../fourm-canslim-point-chart` (`route.abort()`).
2. Vào tab 4M & CANSLIM.

## Kết quả mong đợi
- [ ] Không có lỗi JS console (`pageerror`), không có toast lỗi nào hiển thị.
- [ ] Loading tắt sau vài giây, badge "N/A" hiện ở cả 2 khối, KHÔNG có banner "Không đủ dữ liệu để chấm điểm",
      không có biểu đồ radar/lịch sử nào render.

---

# [TC_PTCB_4M_15] Lỗi mạng khi xem điểm tại thời điểm khác (click biểu đồ lịch sử) không crash, giữ nguyên dữ liệu cũ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `clickChart4MHistory().catch()` cũng chỉ `console.error` + tắt `is_loading_4m`, KHÔNG revert hay
  toast — dữ liệu HIỆN TẠI (trước khi click) vẫn giữ nguyên trên UI vì không bị ghi đè bởi giá trị lỗi.

## Các bước thực hiện
1. Chặn `GET .../fourm-canslim-point-chart-by-time` (`route.abort()`).
2. Click vào 1 điểm trên biểu đồ lịch sử "Điểm 4M".

## Kết quả mong đợi
- [ ] Không có lỗi JS console, không có toast lỗi.
- [ ] Thang điểm + radar "Điểm 4M" VẪN hiện đúng dữ liệu cũ (trước khi click), không bị xóa/reset về N/A.

---

## Nhóm: Giới hạn theo gói hội viên (Free) — xem mục "ĐÍNH CHÍNH" đầu tài liệu

# [TC_PTCB_4M_16] Tài khoản Free: toàn bộ tab bị thay bằng 1 ảnh mockup tĩnh (không phải chỉ 2 radar bị mờ)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật, ĐÍNH CHÍNH ghi chú cũ:
  Pass**
- **⚠️ Phát hiện đáng chú ý:** Xem đầy đủ phân tích ở mục "ĐÍNH CHÍNH" đầu tài liệu. Tóm tắt: `disable_featureName`
  (`features_disabled.hasOwnProperty("fa_4m_cansslim")`) đúng `true` với tài khoản Free hiện tại, khiến TOÀN BỘ
  nội dung (`.chart-wrapper`, 0 phần tử) bị thay bởi ĐÚNG 1 `<ProtectedView>` render 1 `<img>` mockup TĨNH —
  không phải CSS blur trên nội dung thật. API tính điểm THẬT hoàn toàn KHÔNG được gọi.

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`).
2. Vào tab "4M & CANSLIM".

## Kết quả mong đợi
- [ ] `.chart-wrapper` (nội dung thật của tab) có **0** phần tử — không render bất kỳ phần nào của thang
      điểm/biểu đồ thật.
- [ ] Đúng 1 `<img>` mockup tĩnh hiển thị (`src` chứa `blur_img`/`fa_4m_cansslim`).
- [ ] KHÔNG có request nào tới `GET .../fourm-canslim-point-chart` được gửi đi (kể cả sau F5).

---

# [TC_PTCB_4M_17] Hover ảnh mockup hiện nút "Đăng ký ngay", click mở modal nâng cấp gói

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `isButtonVisible` (`v-if`, không phải CSS ẩn) chỉ có trong DOM khi hover
  (`@mouseover`/`@mouseleave`). Click "Đăng ký ngay" set `store.state.isShowModalPackage = true`, mở 1 modal
  nâng cấp gói dùng chung toàn site (ngoài phạm vi POM tab này, chỉ verify mở được).

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào tab "4M & CANSLIM".
2. Hover vào vùng ảnh mockup.
3. Click nút "Đăng ký ngay".

## Kết quả mong đợi
- [ ] Sau bước 2: text "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này." + nút "Đăng ký ngay" xuất hiện.
- [ ] Sau bước 3: 1 modal mới mở ra (`role="dialog"`).

---

## Nhóm: Dark mode

# [TC_PTCB_4M_18] Chuyển dark mode không crash, đổi màu theme + logo tương ứng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `watch: "$store.state.darkMode"` gọi lại `getChartOption()` để re-render 2 radar chart theo màu
  chữ mới; logo (`.p-logo278 img`) đổi giữa `logo-stocks-new.png` (dark mode)/`logo-stocks-new-dark.png` (light
  mode) qua `v-if`/`v-else` tĩnh (KHÔNG phải cùng 1 ảnh đổi màu).

## Các bước thực hiện
1. Đang ở tab 4M & CANSLIM (light mode mặc định), toggle sang dark mode.

## Kết quả mong đợi
- [ ] Giao diện chuyển nền tối, không có lỗi JS console.
- [ ] Biểu đồ radar/lịch sử vẫn hiển thị đầy đủ, không vỡ layout, chữ nhãn đổi màu sáng dễ đọc trên nền tối.

---

## Nhóm: Responsive

# [TC_PTCB_4M_19] Responsive viewport mobile/tablet

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị tab có dữ liệu.
2. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024).

## Kết quả mong đợi
- [ ] Logo + 2 khối "Điểm 4M"/"Điểm Canslim" vẫn hiển thị được (2 card trong mỗi khối tự xếp dọc theo CSS
      `@media max-width: 1023px`), không vỡ layout nghiêm trọng.

---

## Tổng hợp trạng thái (19 testcase)

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-4m-canslim.spec.ts](../tests/phan-tich-co-ban-4m-canslim.spec.ts) (POM: section "Tab
4M & CANSLIM" trong [pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 4 | TC_PTCB_4M_01, 02, 05, 06 |
| 🆕 Mới (riêng web) | 15 | TC_PTCB_4M_03, 04, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 |
| ⚠️ Cần xác nhận thêm | 0 | — |

**Phát hiện đáng chú ý cần theo dõi:**
1. **[ĐÍNH CHÍNH] Ghi chú cũ về gating tài khoản Free của tab này SAI** (TC_PTCB_4M_16/17) — không phải "chỉ 2
   radar bị mờ", mà TOÀN BỘ tab (kể cả thang điểm + lịch sử) bị thay bằng 1 ảnh mockup tĩnh duy nhất, API tính
   điểm thật không được gọi. Khuyến nghị cập nhật lại `phan-tich-co-ban.md` (TC_PTCB_16) và
   `tests/phan-tich-co-ban.spec.ts` (comment TC_PTCB_17) trong 1 lượt riêng.
2. **Banner "Không đủ dữ liệu để chấm điểm" và banner cảnh báo loại trừ lẫn nhau** (TC_PTCB_4M_12) — nếu điểm là
   N/A, mọi cảnh báo trong `warning` bị ẩn hoàn toàn dù có dữ liệu, không có cách nào xem lại nội dung cảnh báo
   trong trường hợp đó.
3. **Không nhất quán khi lỗi mạng vs. API trả `-1` tường minh** (TC_PTCB_4M_11 vs. TC_PTCB_4M_14) — cả 2 đều ra
   badge "N/A", nhưng chỉ trường hợp API trả `-1` tường minh mới kèm banner giải thích "Không đủ dữ liệu để chấm
   điểm"; lỗi mạng thì badge "N/A" xuất hiện mà KHÔNG có banner giải thích, dễ gây hiểu lầm cho người dùng cuối.
4. **`.catch()` của cả `getFourmAndCanslim()` lẫn `clickChart4MHistory()`/`clickChartCanslimHistory()` đều nuốt
   lỗi hoàn toàn, không có toast** (TC_PTCB_4M_14/15) — cùng pattern đã ghi nhận nhiều lần ở tab So Sánh
   (`getAll()`, xem `phan-tich-co-ban-so-sanh.md` TC_PTCB_SS_23).
5. **Biểu thức `canslim_point < 'N/A'` trong `getFourmAndCanslim()` là dead code/lỗi nhỏ** — so sánh number với
   string 'N/A' trong JS luôn ép kiểu về `NaN`, khiến điều kiện này luôn `false` — `is_show_explain` trên thực
   tế chỉ phụ thuộc `fourm_point == 'N/A'`, không như tên biến/vị trí code gợi ý là xét cả 2 điểm.
6. **Không có bug race condition deep-link như tab So Sánh** (TC_PTCB_4M_10) — `FourmAndCanslim` chỉ phụ thuộc
   `$store.state.mack` (set đồng bộ), không đọc bất kỳ state nào nạp bất đồng bộ như `list_mack_company`.
