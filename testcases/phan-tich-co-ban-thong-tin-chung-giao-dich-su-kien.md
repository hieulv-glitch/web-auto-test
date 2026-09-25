# Màn hình: Phân tích cơ bản — Tab "Thông tin chung" — Sub-tab "Thông tin giao dịch" + "Sự kiện"

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=thong-tin-chung`, sau đó click sub-tab con "Thông tin giao dịch"
  hoặc "Sự kiện" (bên trong thanh 7 sub-tab của `Right.vue`) — KHÔNG có query param riêng cho sub-tab con (cùng
  cách xác nhận đã dùng ở tài liệu 2/4: `Right.vue data(): type_tab` là state cục bộ, không đọc `$route.query`).
- **Component:**
  [stocks/src/views/faAnalysis/Common/Right.vue](../../stocks/src/views/faAnalysis/Common/Right.vue) render:
  - Sub-tab **"Thông tin giao dịch"** (`type_tab == 'transaction_info'`): `CCol xl="9"` =
    [TableInfoTransaction.vue](../../stocks/src/views/faAnalysis/Common/TableInfoTransaction.vue) (bảng giao
    dịch nội bộ — đăng ký/kết quả mua-bán của lãnh đạo/người liên quan) — `CCol xl="3"` =
    [ChartAnalysis.vue](../../stocks/src/views/faAnalysis/Common/ChartAnalysis.vue) — **DÙNG CHUNG y hệt với
    sub-tab "Cổ đông"** (`v-if="type_tab == 'share_holder' || type_tab == 'transaction_info'"` trong
    `Right.vue`) — 2 donut "Tổng quan"/"Cổ đông lớn" hiển thị cơ cấu sở hữu, KHÔNG liên quan gì tới nội dung
    "giao dịch nội bộ" của bảng bên trái (xem phát hiện #1).
  - Sub-tab **"Sự kiện"** (`type_tab == 'event'`): `CCol xl="9"` =
    [Events.vue](../../stocks/src/views/faAnalysis/Common/Events.vue) (3 sub-tab con tự viết tay "Niêm yết"/"Cổ
    tức, thưởng và phát hành thêm"/"Đại hội cổ đông" + bảng `CDataTable` 4 cột, click 1 dòng mở modal "Chi tiết
    sự kiện") — `CCol xl="3"` =
    [ChartEvents.vue](../../stocks/src/views/faAnalysis/Common/ChartEvents.vue) (2 biểu đồ cột "Cổ tức bằng
    tiền"/"Cổ tức bằng cổ phiếu", feature key riêng `fa_bieu_do_co_tuc`).
  - Cả 2 sub-tab đọc dữ liệu từ **CÙNG API** `GET /api/stocks/common-info` cho phần bảng (`cong_ty_giao_dich`,
    KHÔNG đọc `store.state.list_mack_company`) — RIÊNG `list_events` (nguồn của cả bảng "Sự kiện" LẪN 2 biểu đồ
    `ChartEvents`) đến từ API RIÊNG `GET /get-list-event` (`getListEvents()` trong `Common/index.vue`) — xem
    phát hiện #4 (bug mới, khác cơ chế API của "Thông tin giao dịch").
- **⚠️ [ĐÍNH CHÍNH quan trọng so với đề bài gốc] `ChartPriceEvents.vue`/`ChartTradingViewEvents.vue` KHÔNG THUỘC
  PHẠM VI sub-tab "Sự kiện" — 2 file này chỉ được `Left.vue` import/render (biểu đồ nến + khung thời gian đã phủ
  ĐẦY ĐỦ ở tài liệu 1/4, TC_PTCB_TTC_04/05/06/09), hoàn toàn KHÔNG xuất hiện trong `Right.vue` cho
  `type_tab == 'event'`.** Xác nhận qua `grep` toàn bộ `stocks/src`: `ChartPriceEvents` chỉ được import ở đúng 1
  nơi (`Left.vue`), `ChartTradingViewEvents` chỉ được import ở đúng 1 nơi (`ChartPriceEvents.vue`). Modal phóng
  to P/E-P/B (`showPopupChart`, dead code đã ghi nhận ở tài liệu 1/4 phát hiện #3) vì vậy cũng thuộc `Left.vue`,
  không phải sub-tab này. `Right.vue` cho `type_tab == 'event'` CHỈ render `<Events>` (`CCol xl="9"`) +
  `<ChartEvents>` (`CCol xl="3"`) — xem TC_PTCB_TTC_GDSK_15 (testcase xác nhận phạm vi).
- **⚠️ Tài liệu này là 3/4 tài liệu con của tab "Thông tin chung"** (tab này quá lớn nên chia làm 4 lượt sinh
  testcase). Đọc trước
  [phan-tich-co-ban-thong-tin-chung.md](phan-tich-co-ban-thong-tin-chung.md) (1/4 — khung/shell + sub-tab mặc
  định "Thông tin tài chính", ĐẶC BIỆT mục "Phát hiện đáng chú ý" #1/#1b về 2 cơ chế gate độc lập cấp sub-tab) và
  [phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md](phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md) (2/4 —
  sub-tab "Hồ sơ" + "Cổ đông", cùng văn phong/kỹ thuật test canvas + gate 2 cấp áp dụng lại ở tài liệu này). Tài
  liệu còn lại (sẽ sinh ở lượt cuối):
  - `phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md` — sub-tab "Nước ngoài" + "Tự doanh".
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Đối chiếu với Sheet "Phân Tích FA(Cổ Phiếu)" (đã dump sẵn, 305 dòng).
  - TC ID 13-82 ("Tab Giao dịch — Thông tin giá/Bước giá/Khớp lệnh/Phân loại giao dịch/Nước ngoài realtime") —
    **KHÔNG map được testcase nào** sang web. App mô tả 1 màn hình HOÀN TOÀN KHÁC (widget giá realtime + sổ lệnh
    + khớp lệnh + phân loại "Cá voi/Cá mập/Cá cơm" + biểu đồ giao dịch nước ngoài theo thời gian trong phiên) —
    không tồn tại bất kỳ đâu trên web ở phạm vi này. `TableInfoTransaction.vue` (web) thể hiện "giao dịch nội
    bộ" (`fa_giao_dich_noi_bo` — đăng ký/kết quả mua-bán cổ phiếu của lãnh đạo/người liên quan), một khái niệm
    HOÀN TOÀN KHÁC "giao dịch/khớp lệnh" mà Sheet mô tả. Toàn bộ testcase nhóm "Thông tin giao dịch" trong tài
    liệu này vì vậy đều là 🆕 **Testcase mới**, không gắn "Tham chiếu App".
  - TC ID 247-264 ("Tab Sự kiện") — khớp khá sát cấu trúc web: app có 3 sub-tab "Niêm yết"/"Cổ tức"/"Đại hội cổ
    đông" (ĐÚNG THỨ TỰ với web: "Niêm yết"/"Cổ tức, thưởng và phát hành thêm"/"Đại hội cổ đông"), danh sách sự
    kiện, click 1 sự kiện xem chi tiết. **Khác biệt:** app hiển thị dạng timeline (đường dọc + chấm tròn, mỗi
    item 3 dòng Tiêu đề/Nội dung có icon 🎤/Ngày có icon 📅) và click chuyển sang MÀN chi tiết riêng; web hiển
    thị dạng BẢNG (`CDataTable` 4 cột STT/Mã CK/Ngày/Nội dung) và click mở MODAL (không điều hướng màn hình).
- **Quy ước trạng thái:** giống `phan-tich-co-ban.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng web) ·
  ⚠️ Cần xác nhận thêm.
- **⚠️ AN TOÀN DỮ LIỆU:** Toàn bộ API trong phạm vi 2 sub-tab này CHỈ ĐỌC (`common-info`, `get-list-event`,
  `get-content-event`). Không có action mutate nào qua UI (không có nút thêm/sửa/xoá giao dịch/sự kiện).
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Test đổi mã CK trong file này dùng `?mack=` (query, không dùng
  path param) và luôn reset về VNM ở cuối test đổi mã.

## Phát hiện đáng chú ý — đọc trước khi viết/chạy test

**#1. Panel bên phải sub-tab "Thông tin giao dịch" tái sử dụng Y HỆT `ChartAnalysis.vue` của sub-tab "Cổ
đông" — nội dung 2 donut ("Tổng quan"/"Cổ đông lớn", cơ cấu sở hữu) HOÀN TOÀN KHÔNG liên quan tới "giao dịch nội
bộ" của bảng bên trái.** Xác nhận qua đọc source (`Right.vue` dòng 71-78: `<ChartAnalysis ... v-if="(type_tab ==
'share_holder' || type_tab == 'transaction_info')" />`, cùng 2 prop `chartdata_co_cau_so_huu`/
`cong_ty_co_dong_items` cho cả 2 sub-tab) + ảnh chụp DOM thật (panel hiện đúng "Tổng quan"/"Cổ đông lớn" khi ở
sub-tab "Thông tin giao dịch", không có biểu đồ nào về mua/bán nội bộ). Đây KHÔNG phải bug (component tái sử
dụng có chủ đích, cùng feature key gate `fa_co_dong_va_gd_co_dong_bieu_do` — xem phát hiện #1b của tài liệu
1/4), nhưng là điểm dễ gây nhầm lẫn khi viết testcase nếu không đọc kỹ source. Xem TC_PTCB_TTC_GDSK_03.

**#2. Cột ngày trong `TableInfoTransaction.vue` hiển thị RAW format `YYYY-MM-DD` từ API — method `formatDate()`
(định dạng lại `DD-MM-YYYY` qua `moment`) tồn tại trong code nhưng KHÔNG được gọi ở bất kỳ đâu trong template
(dead code, template dùng thẳng `{{ item.ngay_bat_dau }}`/`{{ item.ngay_ket_thuc }}`/`{{ item.ngay_thuc_hien
}}`).** Đo thật DOM xác nhận format `2026-07-14` (không phải `14-07-2026`) — KHÁC hẳn quy ước `DD-MM-YYYY` dùng
nhất quán ở các bảng khác trong màn hình này (VD bảng "Sự kiện" cùng tài liệu, cột "Ngày" hiển thị đúng
`DD-MM-YYYY`). Không phải lỗi crash/sai dữ liệu (vẫn đọc được, chỉ khác định dạng ngày mong đợi), nhưng là điểm
không nhất quán UI đáng báo dev. Xem TC_PTCB_TTC_GDSK_02.

**#3. Mã không có giao dịch nội bộ nào (VD ETF `E1VFVN30`) — bảng "Thông tin giao dịch" trống hoàn toàn, KHÔNG
có thông báo "Không có dữ liệu" — CÙNG PATTERN đã ghi nhận ở `TableShareHolder.vue` (tài liệu 2/4, phát hiện
#2).** `TableInfoTransaction.vue` render `<tbody>` phẳng từ `v-for`, không có `v-if`/slot xử lý mảng rỗng. Đo
thật: `cong_ty_giao_dich_items` trả về mảng rỗng cho `E1VFVN30` → 0 dòng, không có text thông báo nào. Xem
TC_PTCB_TTC_GDSK_04.

**#4. [BUG mới, xác nhận qua automation] Free — đổi mã CK khi đang ở sub-tab "Sự kiện" KHÔNG refresh dữ liệu —
bảng "Sự kiện" giữ NGUYÊN dữ liệu của mã CŨ, không có bất kỳ cảnh báo nào cho người dùng.** Đọc source
`Common/index.vue`: `getListEvents()` (nguồn DUY NHẤT của `list_events`, dùng CHUNG cho cả bảng "Sự kiện" lẫn 2
biểu đồ `ChartEvents`) được gọi KHÔNG ĐIỀU KIỆN trong `created()` (mọi tài khoản, kể cả Free) nhưng trong
`watch: stockcode()` (trigger khi đổi mã CK) lại bị bọc trong `if (!this.$store.state.isAccountFree) { ... }` —
**bất đối xứng có chủ đích cho lần tải ĐẦU vs lần đổi mã SAU, gần như chắc chắn là sai sót logic** (không có lý
do nghiệp vụ nào để cho Free xem sự kiện của mã ban đầu nhưng chặn cập nhật khi đổi mã). Đo network + DOM thật
xác nhận (mã VNM → đổi sang HPG):

- Tài khoản trả phí: đổi mã gọi ĐÚNG 1 request `GET /get-list-event?stockcode=HPG&...`, dòng đầu bảng cập nhật
  đúng "HPG: Thông báo về việc giao dịch chứng khoán thay đổi đăng ký niêm yết".
- Tài khoản Free: đổi mã gọi **0 request** `get-list-event`, dòng đầu bảng "Sự kiện" (sub-tab "Niêm yết") VẪN
  hiển thị dữ liệu CŨ của VNM ("VNM: Thông báo về việc niêm yết và giao dịch cổ phiếu thay đổi niêm yết") dù mã
  đang xem đã là HPG — người dùng Free thấy dữ liệu sự kiện SAI mã mà không có dấu hiệu cảnh báo nào (khác hẳn
  `ProtectedView`/`features_disabled` quen thuộc — sub-tab "Sự kiện" của tài khoản Free hiện tại KHÔNG bị khoá
  gói hội viên nên hoàn toàn truy cập bình thường, càng dễ khiến người dùng tin nhầm dữ liệu đang xem đúng mã).
- Cùng pattern "bug ẩn do gọi API có điều kiện theo `isAccountFree`" đã ghi nhận ở tài liệu 2/4 (donut "Nước
  ngoài" sub-tab "Cổ đông") nhưng ở đây HẬU QUẢ hiển thị SAI RÕ RÀNG qua DOM text thật (không bị giới hạn bởi
  canvas như bug donut), dễ assert bằng automation hơn nhiều. Xem TC_PTCB_TTC_GDSK_20.

**#5. Sub-tab con của `Events.vue` ("Niêm yết"/"Cổ tức, thưởng và phát hành thêm"/"Đại hội cổ đông") KHÔNG bị
reset khi đổi mã CK — CÙNG PATTERN đã ghi nhận ở `Profile.vue` (tài liệu 2/4, phát hiện #3).** `Right.vue` chỉ
`v-if="type_tab == 'event'"` cho `<Events>` — component KHÔNG unmount khi đổi mã CK (chỉ đổi prop
`list_events`), nên `data(): type_tab` cục bộ của `Events.vue` (khác `type_tab` của `Right.vue`) giữ nguyên lựa
chọn đã chọn. Đo thật xác nhận: chọn "Cổ tức, thưởng và phát hành thêm" → đổi mã VNM → HPG → vẫn ở "Cổ tức,
thưởng và phát hành thêm" (không tự quay về "Niêm yết"). Xem TC_PTCB_TTC_GDSK_13.

**#6. Verify ĐẦY ĐỦ 2 cấp gate `features_disabled` cho cả 2 sub-tab theo đúng bài học từ tài liệu 1/4 (phát
hiện #1b).** Đo thật với tài khoản Free hiện tại:

- "Thông tin giao dịch": `features_disabled` CÓ `fa_giao_dich_noi_bo` (khoá `CCol xl="9"`, đúng 1
  `ProtectedView`) nhưng KHÔNG có `fa_co_dong_va_gd_co_dong_bieu_do` (panel `ChartAnalysis` bên phải KHÔNG bị
  khoá) — khớp CHÍNH XÁC với đính chính đã ghi nhận ở TC_PTCB_TTC_26 (tài liệu 1/4, dùng chính sub-tab này làm
  ví dụ minh hoạ "gate không bọc toàn bộ widget"). Xem TC_PTCB_TTC_GDSK_16/17.
- "Sự kiện": `features_disabled` KHÔNG có `fa_su_kien` LẪN KHÔNG có `fa_bieu_do_co_tuc` — CẢ 2 cấp đều KHÔNG bị
  khoá (0 `ProtectedView` trên toàn trang khi ở sub-tab này). Xem TC_PTCB_TTC_GDSK_18/19.

---

## Nhóm: Sub-tab "Thông tin giao dịch" (`TableInfoTransaction.vue` + `ChartAnalysis.vue`)

# [TC_PTCB_TTC_GDSK_01] Overview + cấu trúc bảng khi click sub-tab "Thông tin giao dịch"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Bảng có 2 hàng header (nhóm cột "Người liên quan"/"Đăng ký"/"Kết quả" ở hàng 1, colspan 2/4/3;
  cột con "Tên"/"Chức vụ"/"Mua"/"Bán"/"Ngày bắt đầu"/"Ngày kết thúc"/"Mua"/"Bán"/"Ngày thực hiện" ở hàng 2).

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VNM&tab=thong-tin-chung`.
2. Click sub-tab "Thông tin giao dịch".

## Kết quả mong đợi
- [ ] Sub-tab "Thông tin giao dịch" active.
- [ ] Bên trái (`CCol xl="9"`): bảng 2 hàng header đúng cấu trúc trên, có ít nhất 1 dòng dữ liệu.
- [ ] Bên phải (`CCol xl="3"`): panel "Tổng quan" + "Cổ đông lớn" (xem phát hiện #1 — tái sử dụng từ "Cổ đông").

---

# [TC_PTCB_TTC_GDSK_02] 🆕 [Phát hiện] Dữ liệu bảng đúng định dạng — ngày hiển thị RAW `YYYY-MM-DD` (dead code
  `formatDate()`)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #2 đầu tài liệu.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_GDSK_01, quan sát các cột "Ngày bắt đầu"/"Ngày kết thúc"/"Ngày thực hiện" của dòng đầu.

## Kết quả mong đợi
- [ ] Số lượng cổ phiếu (cột "Mua"/"Bán") có dấu phẩy ngăn cách hàng nghìn khi có giá trị.
- [ ] Các cột ngày hiển thị format `YYYY-MM-DD` (VD `2026-07-14`) — KHÔNG phải `DD-MM-YYYY` như quy ước chung
      của các bảng khác trong màn hình (ghi nhận khác biệt, khuyến nghị báo dev, không coi là lỗi chặn dùng).

---

# [TC_PTCB_TTC_GDSK_03] 🆕 [Phát hiện] Panel bên phải tái sử dụng `ChartAnalysis.vue` — nội dung donut cơ cấu sở
  hữu KHÔNG liên quan giao dịch nội bộ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #1 đầu tài liệu.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_GDSK_01, quan sát nhãn + nội dung panel bên phải.

## Kết quả mong đợi
- [ ] Nhãn "Tổng quan" + "Cổ đông lớn" hiển thị (giống hệt sub-tab "Cổ đông") — KHÔNG có biểu đồ/nhãn nào liên
      quan tới "giao dịch nội bộ"/mua-bán của lãnh đạo.
- [ ] Có đúng 2 `<canvas>`, không lỗi console.

---

# [TC_PTCB_TTC_GDSK_04] 🆕 [Phát hiện] Mã không có giao dịch nội bộ (ETF) — bảng trống hoàn toàn, KHÔNG có thông
  báo

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #3 đầu tài liệu — cùng pattern đã ghi nhận ở `TableShareHolder.vue`
  (tài liệu 2/4).

## Các bước thực hiện
1. Deep-link `/phan-tich-co-ban?mack=E1VFVN30&tab=thong-tin-chung`, click sub-tab "Thông tin giao dịch".

## Kết quả mong đợi
- [ ] `<tbody>` của bảng có 0 dòng.
- [ ] KHÔNG có bất kỳ text "Không có dữ liệu"/thông báo tương đương nào hiển thị.

---

# [TC_PTCB_TTC_GDSK_05] Đổi mã CK — bảng + panel cập nhật đúng theo mã mới, không có race condition

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, XÁC NHẬN KHÔNG có race condition: Pass**
- **Ghi chú:** Dữ liệu bảng đến từ CÙNG API `common-info` với bảng "Thông tin chung" cột trái — KHÔNG đọc
  `store.state.list_mack_company`, an toàn 100% khỏi race condition đã ghi nhận ở tab "So sánh"/"Biểu đồ" (cùng
  kết luận đã xác nhận ở tài liệu 2/4 cho "Cổ đông").

## Các bước thực hiện
1. Từ TC_PTCB_TTC_GDSK_01 (mã VNM), đổi mã CK qua ô tìm kiếm sang "HPG".

## Kết quả mong đợi
- [ ] Bảng cập nhật đúng dữ liệu giao dịch nội bộ của HPG (khác VNM).
- [ ] Panel bên phải vẫn hiển thị đúng 2 `<canvas>`, không lỗi console.

---

## Nhóm: Sub-tab "Sự kiện" — Bảng + 3 sub-tab con (`Events.vue`)

# [TC_PTCB_TTC_GDSK_06] Overview khi click sub-tab "Sự kiện" — 3 sub-tab con, "Niêm yết" active mặc định

- **Trạng thái:** ✅ Áp dụng — **Tham chiếu App:** TC 247, 248 (Sheet) — **Đã verify bằng automation: Pass**
- **Khác biệt so với app:** app hiển thị dạng timeline (đường dọc + chấm tròn); web hiển thị dạng bảng
  `CDataTable`. Thứ tự 3 sub-tab con GIỐNG app (Niêm yết → Cổ tức → Đại hội cổ đông).

## Các bước thực hiện
1. Từ tab "Thông tin chung" (mã VNM), click sub-tab "Sự kiện".

## Kết quả mong đợi
- [ ] Sub-tab "Sự kiện" active.
- [ ] Bên trái (`CCol xl="9"`): 3 sub-tab con "Niêm yết"/"Cổ tức, thưởng và phát hành thêm"/"Đại hội cổ đông",
      "Niêm yết" active mặc định (`type_tab: 2` trong `Events.vue`).
- [ ] Bảng 4 cột "STT"/"Mã CK"/"Ngày"/"Nội dung", có ít nhất 1 dòng dữ liệu, cột "Ngày" format `DD-MM-YYYY`.
- [ ] Bên phải (`CCol xl="3"`): panel "Cổ tức bằng tiền" + "Cổ tức bằng cổ phiếu" (2 biểu đồ cột).

---

# [TC_PTCB_TTC_GDSK_07] Click "Cổ tức, thưởng và phát hành thêm" — list đổi đúng

- **Trạng thái:** ✅ Áp dụng — **Tham chiếu App:** TC 249 (Sheet) — **Đã verify bằng automation: Pass**
- **Ghi chú:** `list_events_filtered` lọc `eventtypeid == 1`, dùng cột `note` thay `title` (khác 2 sub-tab con
  còn lại, xem `computed: list_events_filtered` trong `Events.vue`).

## Các bước thực hiện
1. Click "Cổ tức, thưởng và phát hành thêm".

## Kết quả mong đợi
- [ ] Sub-tab con "Cổ tức, thưởng và phát hành thêm" active, "Niêm yết" không còn active.
- [ ] Nội dung bảng đổi khác — các dòng nội dung có dạng "Trả cổ tức đợt .../Thưởng cổ phiếu..." (khác nội dung
      "Niêm yết" trước đó).

---

# [TC_PTCB_TTC_GDSK_08] Click "Đại hội cổ đông" — list đổi đúng

- **Trạng thái:** ✅ Áp dụng — **Tham chiếu App:** TC 250 (Sheet) — **Đã verify bằng automation: Pass**
- **Ghi chú:** `list_events_filtered` lọc `eventtypeid == 5`.

## Các bước thực hiện
1. Click "Đại hội cổ đông".

## Kết quả mong đợi
- [ ] Sub-tab con "Đại hội cổ đông" active.
- [ ] Nội dung bảng đổi khác — các dòng nội dung liên quan ĐHĐCĐ (VD "Thông báo về ngày đăng ký cuối cùng tổ
      chức ĐHĐCĐ...").

---

# [TC_PTCB_TTC_GDSK_09] Click lại "Niêm yết" — quay về đúng nội dung ban đầu

- **Trạng thái:** ✅ Áp dụng — **Tham chiếu App:** TC 251 (Sheet) — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Từ TC_PTCB_TTC_GDSK_08 (đang ở "Đại hội cổ đông"), click lại "Niêm yết".

## Kết quả mong đợi
- [ ] Sub-tab con "Niêm yết" active trở lại, nội dung bảng quay về danh sách sự kiện niêm yết (giống
      TC_PTCB_TTC_GDSK_06).

---

# [TC_PTCB_TTC_GDSK_10] Click 1 dòng sự kiện — mở modal "Chi tiết sự kiện" hiển thị nội dung HTML

- **Trạng thái:** ✅ Áp dụng — **Tham chiếu App:** TC 256 (Sheet) — **Đã verify bằng automation: Pass**
- **Khác biệt so với app:** app điều hướng sang MÀN chi tiết riêng; web mở MODAL (`isShowModal`,
  `getContentEvents()` gọi `GET /get-content-event`) — không điều hướng URL.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_GDSK_06, click vào dòng đầu tiên trong bảng (sub-tab con "Niêm yết").

## Kết quả mong đợi
- [ ] Modal "Chi tiết sự kiện" (`role="dialog"`) hiện ra, có nút đóng "×".
- [ ] Nội dung modal hiển thị đoạn text chi tiết sự kiện (không rỗng, khớp chủ đề với dòng đã click).

---

# [TC_PTCB_TTC_GDSK_11] Đóng modal "Chi tiết sự kiện" bằng nút "×"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mở modal "Chi tiết sự kiện" (như TC_PTCB_TTC_GDSK_10).
2. Click nút "×".

## Kết quả mong đợi
- [ ] Modal đóng lại (không còn hiển thị).

---

# [TC_PTCB_TTC_GDSK_12] 🆕 Bảng rỗng (mock API) — hiển thị "Không có dữ liệu" đúng `#no-items-view`

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock API `get-list-event` trả về mảng rỗng):
  Pass**
- **Ghi chú:** KHÁC hẳn `TableInfoTransaction.vue`/`TableShareHolder.vue` (không có xử lý rỗng) —
  `Events.vue` dùng `CDataTable` có sẵn slot `#no-items-view` (`<p class="text-center h5">Không có dữ liệu</p>`).
  Không có mã thật nào đo được list_events rỗng trong lúc khảo sát nên dùng `page.route()` mock response — an
  toàn (API `get-list-event` chỉ đọc, mock không ảnh hưởng dữ liệu thật).

## Các bước thực hiện
1. Mock `GET /get-list-event` trả về mảng rỗng `[]`.
2. Vào tab "Thông tin chung", click sub-tab "Sự kiện".

## Kết quả mong đợi
- [ ] Bảng hiển thị text "Không có dữ liệu" (không phải bảng trống trơn chỉ còn header như 2 bảng khác trong
      tài liệu này).

---

# [TC_PTCB_TTC_GDSK_13] 🆕 [Phát hiện] Sub-tab con KHÔNG reset khi đổi mã CK

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, phát hiện đáng chú ý: Pass**
- **⚠️ Phát hiện đáng chú ý:** xem phát hiện #5 đầu tài liệu — cùng pattern đã ghi nhận ở `Profile.vue` (tài
  liệu 2/4, TC_PTCB_TTC_HSCD_05).

## Các bước thực hiện
1. Click sub-tab "Sự kiện", click sub-tab con "Cổ tức, thưởng và phát hành thêm" (xác nhận active).
2. Đổi mã CK qua ô tìm kiếm sang "HPG".

## Kết quả mong đợi
- [ ] Sau khi đổi mã, vẫn đang ở sub-tab con "Cổ tức, thưởng và phát hành thêm" (KHÔNG tự động quay về "Niêm
      yết").

---

## Nhóm: Panel biểu đồ "Sự kiện" (`ChartEvents.vue`)

# [TC_PTCB_TTC_GDSK_14] 2 biểu đồ cột "Cổ tức bằng tiền"/"Cổ tức bằng cổ phiếu" hiển thị đúng, không lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `option_chart_tra_co_tuc_bang_tien`/`option_chart_tra_co_tuc_bang_co_phieu` — 2 biểu đồ cột theo
  năm, tính từ parse `note` của các sự kiện `eventtypeid == 1` (regex trên text tiếng Việt). Dùng
  `CanvasRenderer` — không assert được text nhãn cột/tooltip qua DOM, chỉ verify canvas tồn tại.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_GDSK_06, quan sát panel bên phải.

## Kết quả mong đợi
- [ ] Nhãn "Cổ tức bằng tiền" + "Cổ tức bằng cổ phiếu" hiển thị đúng thứ tự.
- [ ] Có đúng 2 `<canvas>`, không lỗi console.

---

## Nhóm: Xác nhận phạm vi (đính chính so với đề bài gốc)

# [TC_PTCB_TTC_GDSK_15] 🆕 [Xác nhận phạm vi] Sub-tab "Sự kiện" KHÔNG chứa biểu đồ nến TradingView/modal phóng
  to P/E-P/B

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, xác nhận phạm vi: Pass**
- **Ghi chú:** Xem mục "Component" đầu tài liệu (đính chính) — `ChartPriceEvents.vue`/`ChartTradingViewEvents.vue`
  chỉ thuộc `Left.vue` (đã phủ đầy đủ tài liệu 1/4), KHÔNG được `Right.vue` render cho `type_tab == 'event'`.

## Các bước thực hiện
1. Từ TC_PTCB_TTC_GDSK_06, đếm số `#tv_chart_container` (biểu đồ nến TradingView) trên trang.

## Kết quả mong đợi
- [ ] Có đúng 1 `#tv_chart_container` trên toàn trang (biểu đồ nến của `Left.vue`, LUÔN hiển thị bất kể sub-tab
      nào — đã phủ tài liệu 1/4) — KHÔNG có `#tv_chart_container` THỨ 2 nào phát sinh khi ở sub-tab "Sự kiện".

---

## Nhóm: Gate cấp widget (`features_disabled`) — verify CẢ 2 CẤP cho từng sub-tab

# [TC_PTCB_TTC_GDSK_16] Free — "Thông tin giao dịch" nội dung chính (`CCol xl="9"`, key `fa_giao_dich_noi_bo`)
  BỊ khoá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #6 — `features_disabled` của tài khoản Free hiện tại CÓ `fa_giao_dich_noi_bo`.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Thông tin giao dịch".

## Kết quả mong đợi
- [ ] Vùng nội dung chính (`CCol xl="9"`) bị `ProtectedView` che.
- [ ] Đúng 1 `ProtectedView` trên toàn trang (xác nhận panel biểu đồ bên phải KHÔNG bị khoá cùng lúc, xem
      TC_PTCB_TTC_GDSK_17).

---

# [TC_PTCB_TTC_GDSK_17] Free — "Thông tin giao dịch" panel biểu đồ (`CCol xl="3"`, key
  `fa_co_dong_va_gd_co_dong_bieu_do`) KHÔNG bị khoá — verify RIÊNG, xác nhận 2 cấp độc lập

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #6 — khớp CHÍNH XÁC với TC_PTCB_TTC_26 (tài liệu 1/4), sub-tab này chính là ví dụ
  đã dùng ở đó để minh hoạ "gate không bọc toàn bộ widget". Key `fa_co_dong_va_gd_co_dong_bieu_do` DÙNG CHUNG với
  panel biểu đồ của sub-tab "Cổ đông" (`ChartAnalysis.vue` dùng chung cho cả 2 sub-tab).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Thông tin giao dịch".

## Kết quả mong đợi
- [ ] Panel bên phải (2 donut, `CCol xl="3"`) hiển thị bình thường, KHÔNG có `ProtectedView` che vùng này —
      verify BẰNG locator scope RIÊNG trong panel này (không dùng số đếm `ProtectedView` toàn trang).
- [ ] Panel render đúng 2 `<canvas>`.

---

# [TC_PTCB_TTC_GDSK_18] Free — "Sự kiện" nội dung chính (`CCol xl="9"`, key `fa_su_kien`) KHÔNG bị khoá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #6 — `features_disabled` của tài khoản Free hiện tại KHÔNG chứa `fa_su_kien`.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Sự kiện".

## Kết quả mong đợi
- [ ] Bảng sự kiện + 3 sub-tab con hiển thị bình thường, KHÔNG có `ProtectedView` che.

---

# [TC_PTCB_TTC_GDSK_19] Free — "Sự kiện" panel biểu đồ (`CCol xl="3"`, key `fa_bieu_do_co_tuc`) KHÔNG bị khoá —
  verify RIÊNG, xác nhận CẢ 2 cấp cùng không khoá

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Xem phát hiện #6 — khác "Thông tin giao dịch" (chỉ 1 cấp không khoá), sub-tab "Sự kiện" tài khoản
  Free hiện tại KHÔNG bị khoá ở CẢ 2 cấp cùng lúc (0 `ProtectedView` trên toàn trang).

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Sự kiện".

## Kết quả mong đợi
- [ ] Panel bên phải (`ChartEvents`, `CCol xl="3"`) hiển thị bình thường, đúng 2 `<canvas>`, KHÔNG có
      `ProtectedView` riêng che vùng này.
- [ ] Tổng số `ProtectedView` trên toàn trang = 0 (xác nhận CẢ 2 cấp cùng không bị khoá, khớp
      TC_PTCB_TTC_GDSK_18).

---

## Nhóm: Gate/bug theo tài khoản (Free) — dữ liệu, không phải overlay che

# [TC_PTCB_TTC_GDSK_20] 🆕 [Phát hiện bug] Free — đổi mã CK KHÔNG refresh bảng "Sự kiện" (dữ liệu SAI mã, không
  cảnh báo)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật, phát hiện đáng chú ý:
  Pass**
- **⚠️ Phát hiện đáng chú ý (bug thật):** xem phát hiện #4 đầu tài liệu — đo network xác nhận 0 request
  `get-list-event` sau khi đổi mã (tài khoản trả phí gọi đúng 1 lần), DOM xác nhận dòng đầu bảng vẫn hiển thị dữ
  liệu mã CŨ.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Click sub-tab "Sự kiện" (mã VNM), ghi nhận dòng đầu bảng (sub-tab con "Niêm yết").
3. Theo dõi network, đổi mã CK qua ô tìm kiếm sang "HPG".

## Kết quả mong đợi
- [ ] KHÔNG có request nào tới `/get-list-event` được gửi sau bước 3.
- [ ] Dòng đầu bảng "Sự kiện" SAU khi đổi mã VẪN hiển thị nội dung của VNM (mã CŨ) — KHÔNG cập nhật theo HPG,
      KHÔNG có cảnh báo/loading nào báo dữ liệu đang sai mã.

---

## Nhóm: Tương tác chung

# [TC_PTCB_TTC_GDSK_21] Chuyển qua lại "Thông tin giao dịch" ↔ "Sự kiện" nhiều lần không lỗi console

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click "Thông tin giao dịch" → "Sự kiện" → "Thông tin giao dịch" → "Sự kiện", lặp lại 2 vòng liên tiếp.

## Kết quả mong đợi
- [ ] Sau vòng cuối, nội dung sub-tab đang active hiển thị đúng, không có lỗi JS console (`pageerror`) phát
      sinh trong suốt quá trình.

---

## Nhóm: Responsive

# [TC_PTCB_TTC_GDSK_22] Responsive viewport mobile/tablet cho cả 2 sub-tab

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị sub-tab "Thông tin giao dịch" đã tải xong dữ liệu, thu nhỏ viewport xuống mobile (375x812) rồi
   tablet (768x1024).
2. Lặp lại với sub-tab "Sự kiện".

## Kết quả mong đợi
- [ ] Cả 2 sub-tab vẫn hiển thị được (có thể xếp chồng dọc/cuộn ngang), không vỡ layout nghiêm trọng ở cả 2 kích
      thước.

---

## Tổng hợp trạng thái (22 testcase — phạm vi sub-tab "Thông tin giao dịch" + "Sự kiện")

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.spec.ts](../tests/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.spec.ts)
(POM: section "Tab Thông tin chung — Sub-tab Thông tin giao dịch + Sự kiện" ở cuối
[pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 6 | TC_PTCB_TTC_GDSK_06, 07, 08, 09, 10, 11 (nhóm "Sự kiện" map được với TC 247-256 Sheet) |
| 🆕 Mới (riêng web) | 16 | TC_PTCB_TTC_GDSK_01, 02, 03, 04, 05, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22 |
| ⚠️ Cần xác nhận thêm | 0 | — |

Không có `test.fixme` nào trong file spec này — toàn bộ 22 testcase đều tự động hoá và pass được (kể cả
TC_PTCB_TTC_GDSK_12, dùng `page.route()` mock response rỗng cho API chỉ-đọc, an toàn 100% cho tài khoản dùng
chung).

**Phát hiện đáng chú ý cần theo dõi:**
1. **[BUG mới] Free — đổi mã CK KHÔNG refresh bảng "Sự kiện"** — `getListEvents()` gọi KHÔNG điều kiện ở
   `created()` nhưng bị bọc `if (!isAccountFree)` ở `watch: stockcode()`, bất đối xứng có vẻ là sai sót logic.
   Hậu quả: tài khoản Free thấy dữ liệu sự kiện của mã CŨ sau khi đổi mã, không có cảnh báo. Dễ assert bằng
   automation hơn hẳn bug donut "Nước ngoài" (tài liệu 2/4) vì hậu quả hiển thị qua DOM text thật, không bị giới
   hạn canvas. Xem phát hiện #4, TC_PTCB_TTC_GDSK_20.
2. **[ĐÍNH CHÍNH so với đề bài gốc] `ChartPriceEvents.vue`/`ChartTradingViewEvents.vue` KHÔNG thuộc sub-tab "Sự
   kiện"** — 2 file này chỉ được `Left.vue` render (biểu đồ nến chính, đã phủ đầy đủ tài liệu 1/4). `Right.vue`
   cho `type_tab == 'event'` CHỈ render `Events.vue` + `ChartEvents.vue`. Modal phóng to P/E-P/B (dead code đã
   ghi nhận tài liệu 1/4) cũng thuộc `Left.vue`, không phải phạm vi tài liệu này. Xem mục "Component" đầu tài
   liệu, TC_PTCB_TTC_GDSK_15.
3. **Panel bên phải sub-tab "Thông tin giao dịch" tái sử dụng Y HỆT `ChartAnalysis.vue` của "Cổ đông"** — nội
   dung donut cơ cấu sở hữu không liên quan gì tới giao dịch nội bộ. Không phải bug (tái sử dụng có chủ đích,
   cùng feature key gate), nhưng dễ gây nhầm lẫn khi đọc source lần đầu. Xem phát hiện #1, TC_PTCB_TTC_GDSK_03.
4. **Cột ngày `TableInfoTransaction.vue` hiển thị RAW `YYYY-MM-DD`** do method `formatDate()` (định dạng lại
   `DD-MM-YYYY`) tồn tại trong code nhưng không được gọi ở template — dead code, khác quy ước ngày dùng nhất
   quán ở các bảng khác trong màn hình. Xem phát hiện #2, TC_PTCB_TTC_GDSK_02.
5. **Mã không có giao dịch nội bộ (ETF) — bảng "Thông tin giao dịch" trống hoàn toàn, không thông báo** — cùng
   pattern đã ghi nhận ở `TableShareHolder.vue` (tài liệu 2/4). Xem phát hiện #3, TC_PTCB_TTC_GDSK_04.
6. **Sub-tab con của `Events.vue` không bị reset khi đổi mã CK** — cùng pattern `Profile.vue` (tài liệu 2/4).
   Xem phát hiện #5, TC_PTCB_TTC_GDSK_13.
7. **Verify đầy đủ 2 cấp gate `features_disabled` cho cả 2 sub-tab** — "Thông tin giao dịch" chỉ bị khoá 1 cấp
   (nội dung chính, khớp đúng ví dụ minh hoạ đã dùng ở tài liệu 1/4), "Sự kiện" không bị khoá cấp nào với tài
   khoản Free hiện tại. Xem phát hiện #6, TC_PTCB_TTC_GDSK_16/17/18/19.
8. **Không có API mutate nào trong phạm vi 2 sub-tab này** — toàn bộ chỉ đọc (`common-info`, `get-list-event`,
   `get-content-event`), an toàn tuyệt đối cho tài khoản test dùng chung.
9. **TC ID 13-82 của Sheet app ("Tab Giao dịch") mô tả 1 màn hình HOÀN TOÀN KHÁC** (widget giá realtime/sổ
   lệnh/khớp lệnh/phân loại giao dịch) — không tồn tại trên web ở phạm vi tab "Thông tin chung" này, không map
   được testcase nào. `TableInfoTransaction.vue` thể hiện khái niệm "giao dịch nội bộ" hoàn toàn khác.

**Ngoài phạm vi lần sinh này:** nội dung chi tiết sub-tab "Nước ngoài"/"Tự doanh" — xem tài liệu con còn lại,
sẽ sinh ở lượt cuối (4/4).
