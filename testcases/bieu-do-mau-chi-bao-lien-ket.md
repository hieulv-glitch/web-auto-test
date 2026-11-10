# Màn hình: Biểu đồ — Lưu mẫu chỉ báo + Liên kết thẻ theo kiểu đồng bộ (tính năng mới)

- **Phạm vi:** trang **Biểu đồ** (`/phan-tich-ky-thuat`):
  - **Mẫu chỉ báo:** nút "Mẫu chỉ báo" trên thanh trên cùng của từng biểu đồ — lưu bộ chỉ báo đang có thành mẫu có tên,
    áp mẫu vào biểu đồ (thay toàn bộ chỉ báo), đổi tên, xoá; tối đa 20 mẫu, tên tối đa 40 ký tự.
  - **Liên kết thẻ — kiểu đồng bộ:** mỗi nhóm liên kết tự chọn đồng bộ *Mã cổ phiếu / Khung thời gian / Chỉ báo / Trỏ chuột*
    (chọn khi "Tạo nhóm mới", sửa ở bảng Bố cục); "Trỏ chuột" = kéo / thu phóng một thẻ thì các thẻ cùng nhóm, cùng khung
    thời gian hiện đúng đoạn thời gian đó.
- **Ngoài phạm vi:** tạo / thêm / bỏ thẻ khỏi nhóm, màu nhóm, Replay, chia khung — đã có ở
  [phan-tich-ky-thuat-replay-chia-khung.md](phan-tich-ky-thuat-replay-chia-khung.md) (TC_PTKT_RP_40–49).
- **Môi trường test:** https://kfsp.vn (`PREV2_BASE_URL` trong `.env`) — production đang chạy code `origin/preprod` mới
  nhất (deploy 06/11/2026). Tài khoản `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí), đăng nhập qua `Prev2Session`.
- **Component:** nhánh `origin/preprod` của `stocks`: `src/utils/chartIndicatorTemplates.js` (lưu, chụp, áp mẫu),
  `src/utils/chartIndicatorTemplateMenu.js` (nút + menu trong iframe TradingView),
  `src/views/multiLayoutChart/IndicatorTemplateDialog.vue` (hộp đặt tên / ghi đè / đổi tên / xoá) — merge
  `hieu-update/Bieudo-LuuChibao` (29–30/10/2026); `src/views/multiLayoutChart/tabLinks.js` (`LINK_SYNC_KINDS`,
  `DEFAULT_LINK_SYNC`, `linkSyncOf`), `ChartLayoutPicker.vue` (hộp "Đồng bộ giữa các thẻ", nút "Chọn đồng bộ"),
  `reactMultiLayoutChart.js` (`handleOnSymbolChanged/IntervalChanged/StudiesChanged/RangeChanged`), `ReactChartTA.vue`
  (`watchLinkedStudies`, `watchLinkedRange`, `applyLinkedRange`), `src/utils/chartLinkedRange.js` — commit 03–04/11/2026.
- **Code test:** [tests/bieu-do-mau-chi-bao-lien-ket.spec.ts](../tests/bieu-do-mau-chi-bao-lien-ket.spec.ts), Page Object
  [pages/ChartTemplateLinkPage.ts](../pages/ChartTemplateLinkPage.ts) (kế thừa `TaReplayLayoutPage`). Chạy:
  `npx playwright test tests/bieu-do-mau-chi-bao-lien-ket.spec.ts --project=chromium --workers=2` (~6 phút).
- **Phương pháp sinh:** tính năng chỉ web có — kiểm kê độc lập trên source preprod + đo bằng Playwright trên kfsp.vn. Biểu
  đồ TradingView nằm trong iframe: test đọc chỉ báo / mã / khung / đoạn thời gian qua `tradingViewApi.activeChart()` của
  iframe; đổi khung, đổi mã, thêm chỉ báo bằng cùng API đó (tương đương bấm nút trên thanh biểu đồ); kéo / thu phóng bằng
  chuột thật (đồng bộ "Trỏ chuột" chỉ chạy khi chuột đang ở trong thẻ).
- **Quy ước trạng thái:** 🆕 Testcase mới (chỉ web có, đã tự động hoá) · ⚠️ Cần xác nhận thêm.

**⚠️ AN TOÀN DỮ LIỆU:** mẫu chỉ báo và bố cục (gồm nhóm liên kết, kiểu đồng bộ) lưu ở cài đặt tài khoản **production** qua
`/updateusersettings`. `ChartTemplateLinkPage` thay việc đọc riêng khoá `ta_indicator_templates`
(`/getusersettings?keys=…`) và ghi khoá đó bằng **máy chủ giả trong bộ nhớ** (chọn được ok / chậm 2,5 giây / 500 / mất
mạng); ghi mọi khoá khác (bố cục `layout_multi_ta`, biểu đồ tự lưu `chartTASaved_*`) bị huỷ, body ghi lại để assert.
`/getusersettings` lúc mở trang được sửa: bố cục cố định của test (kèm `link_sync` nếu có), đã xem hướng dẫn Biểu đồ và
thẻ giới thiệu cảnh báo giá, danh sách mẫu ban đầu do test chọn. Lưới an toàn huỷ mọi request không phải GET khác tới
`*.kfsp.vn/api/` (riêng `/api/activitylog/create` trả thành công giả); `afterEach` kiểm tra không có lệnh nào bị huỷ.

---

## Nhóm: Mẫu chỉ báo — menu

# [TC_BDLK_01] Nút "Mẫu chỉ báo" trên thanh biểu đồ; chưa có mẫu → menu chỉ có dòng "Lưu chỉ báo thành mẫu…"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tài khoản trả phí, chưa có mẫu nào. Vào trang Biểu đồ (1 khung VNM).
2. Rê chuột lên nút "Mẫu chỉ báo" trên thanh trên cùng của biểu đồ, rồi bấm.

## Kết quả mong đợi
- [ ] Nút có chú thích "Lưu bộ chỉ báo thành mẫu, áp mẫu vào biểu đồ".
- [ ] Menu chỉ có 1 dòng "Lưu chỉ báo thành mẫu…", không có đường kẻ, không có dòng mẫu.

# [TC_BDLK_02] Có mẫu → mỗi mẫu một dòng xếp theo tên, có "Đổi tên" + "Xoá"; mở menu đọc lại danh sách từ máy chủ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có sẵn 3 mẫu "Bộ MA", "a RSI", "Chỉ báo C". Sau khi trang mở, máy chủ có thêm mẫu "Từ app" (lưu từ tab khác / app).
2. Bấm "Mẫu chỉ báo".

## Kết quả mong đợi
- [ ] Dưới dòng "Lưu chỉ báo thành mẫu…" có 1 đường kẻ rồi 4 dòng: a RSI, Bộ MA, Chỉ báo C, Từ app (xếp theo tên tiếng Việt, không phân biệt hoa thường).
- [ ] Mỗi dòng có biểu tượng bút chì "Đổi tên" và thùng rác "Xoá".
- [ ] Web đọc lại riêng khoá mẫu từ máy chủ khi mở menu, nên mẫu "Từ app" hiện ra.

# [TC_BDLK_03] Bấm ra ngoài menu → menu đóng; bấm nút lần nữa → mở lại

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở menu "Mẫu chỉ báo".
2. Bấm vào biểu đồ.
3. Bấm nút lần nữa.

## Kết quả mong đợi
- [ ] Menu đóng khi bấm ra ngoài.
- [ ] Bấm lại thì menu mở với đúng danh sách mẫu.

# [TC_BDLK_04] Biểu đồ không có chỉ báo → "Lưu chỉ báo thành mẫu…" báo lỗi, không mở hộp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Xoá hết chỉ báo của biểu đồ (kể cả Volume).
2. Mở menu, bấm "Lưu chỉ báo thành mẫu…".

## Kết quả mong đợi
- [ ] Toast lỗi "Biểu đồ này chưa có chỉ báo nào để lưu".
- [ ] Menu đóng, không có hộp đặt tên, không ghi gì.

# [TC_BDLK_05] Tài khoản Free không có nút "Mẫu chỉ báo"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập `FREE_USER_*`, vào trang Biểu đồ.

## Kết quả mong đợi
- [ ] Thanh trên cùng của biểu đồ không có nút "Mẫu chỉ báo" (nút chỉ gắn khi `!isAccountFree`).

## Nhóm: Mẫu chỉ báo — lưu

# [TC_BDLK_06] Hộp "Lưu mẫu chỉ báo": ô "Tên mẫu" focus sẵn, tối đa 40 ký tự; Huỷ đóng hộp, không ghi

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở menu, bấm "Lưu chỉ báo thành mẫu…".
2. Gõ 45 ký tự.
3. Bấm "Huỷ".

## Kết quả mong đợi
- [ ] Hộp tiêu đề "Lưu mẫu chỉ báo", nhãn "Tên mẫu", ô trống và đang focus, nút "Huỷ" + "Lưu".
- [ ] Ô chỉ nhận 40 ký tự.
- [ ] Huỷ đóng hộp, không ghi gì.

# [TC_BDLK_07] Tên trống / chỉ khoảng trắng → "Nhập tên mẫu", không ghi; gõ lại thì lỗi mất

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở hộp lưu, bấm "Lưu" khi ô trống.
2. Gõ 3 dấu cách, nhấn Enter.
3. Gõ thêm 1 chữ.

## Kết quả mong đợi
- [ ] Dưới ô hiện "Nhập tên mẫu", ô viền đỏ; không ghi.
- [ ] Khoảng trắng cũng báo "Nhập tên mẫu".
- [ ] Gõ tiếp thì dòng lỗi mất.

# [TC_BDLK_08] Lưu thành công — tên gọn khoảng trắng, ghi cả danh sách, hộp đóng, menu có mẫu mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có sẵn mẫu "Bộ MA". Biểu đồ đang có Volume.
2. Lưu với tên `  Mẫu   của tôi  `.
3. Mở lại menu.

## Kết quả mong đợi
- [ ] Ghi đúng 1 lần khoá `ta_indicator_templates` gồm "Bộ MA" (giữ nguyên) và "Mẫu của tôi" (khoảng trắng thừa bị gộp, id mới, bộ chỉ báo = [Volume]).
- [ ] Hộp đóng (không có toast thành công — web tắt mọi toast thành công từ 12/10).
- [ ] Menu hiện "Bộ MA", "Mẫu của tôi".

# [TC_BDLK_09] Nội dung mẫu — thứ tự, thông số khác mặc định, chỉ báo trên khung giá, chỉ báo đang ẩn; không ghi ô mã của thẻ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Biểu đồ VNM chỉ có Moving Average (độ dài 21) và RSI (độ dài 7, đang ẩn).
2. Lưu thành mẫu.

## Kết quả mong đợi
- [ ] Bộ chỉ báo của mẫu theo đúng thứ tự: Moving Average `{length: 21}` kèm `chung_khung_gia`, RSI `{length: 7}` kèm `an`.
- [ ] Không ghi ô "symbol" của Moving Average (đang mang mã VNM của thẻ) — áp sang mã khác vẫn tính theo mã đó.

# [TC_BDLK_10] Trùng tên (khác hoa thường, khoảng trắng) → hộp "Ghi đè mẫu chỉ báo"; Ghi đè thay bộ chỉ báo, giữ id

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có sẵn mẫu "Bộ MA". Lưu với tên `  bộ   ma `.
2. Bấm "Ghi đè".

## Kết quả mong đợi
- [ ] Hộp đổi tiêu đề "Ghi đè mẫu chỉ báo", nội dung `Mẫu "bộ   ma" đã có. Ghi đè bằng bộ chỉ báo của biểu đồ này?`, nút "Ghi đè"; chưa ghi gì.
- [ ] Ghi đè: danh sách vẫn 1 mẫu, giữ id cũ, tên thành "bộ ma", bộ chỉ báo là bộ của biểu đồ hiện tại.

# [TC_BDLK_11] Đã đủ 20 mẫu → lưu tên mới báo lỗi, không ghi; trùng tên có sẵn vẫn ghi đè được

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có sẵn 20 mẫu. Lưu tên "Mẫu mới".
2. Đổi tên thành "Mẫu 05" (đã có), Lưu → Ghi đè.

## Kết quả mong đợi
- [ ] Dưới ô hiện "Đã đủ 20 mẫu. Xoá bớt một mẫu hoặc lưu đè lên mẫu có sẵn", hộp vẫn mở, không ghi.
- [ ] Ghi đè thành công, danh sách vẫn 20 mẫu.

# [TC_BDLK_12] Lưu lỗi (máy chủ 500 / mất mạng) → báo lỗi, hộp giữ nguyên, bấm Lưu lại được

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** spec chạy 2 biến thể `TC_BDLK_12a` (500) và `TC_BDLK_12b` (mất mạng).

## Các bước thực hiện
1. Máy chủ trả 500 (lần 2: mất mạng). Lưu tên "Mẫu lỗi".
2. Máy chủ trở lại bình thường, bấm "Lưu" lần nữa.

## Kết quả mong đợi
- [ ] 500: toast "Không lưu được mẫu chỉ báo (lỗi 500)"; mất mạng: "Không lưu được mẫu chỉ báo, kiểm tra kết nối mạng".
- [ ] Hộp vẫn mở, tên giữ nguyên, nút "Lưu" bấm được.
- [ ] Lần sau lưu thành công.

# [TC_BDLK_13] Đang lưu (máy chủ chậm) → nút Lưu khoá; bấm đúp + Enter chỉ ghi 1 lần

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Máy chủ trả lời chậm 2,5 giây. Gõ tên, bấm đúp "Lưu" rồi nhấn Enter.

## Kết quả mong đợi
- [ ] Trong lúc chờ nút "Lưu" bị khoá.
- [ ] Chỉ có 1 lần ghi; hộp đóng khi máy chủ trả lời.

# [TC_BDLK_14] Lưu đọc lại danh sách trên máy chủ trước khi ghi — mẫu vừa thêm ở nơi khác không bị mất

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có sẵn "Bộ MA". Mở hộp lưu.
2. Trong lúc hộp mở, máy chủ có thêm mẫu "Từ app".
3. Lưu tên "Mẫu mới".

## Kết quả mong đợi
- [ ] Danh sách ghi lên gồm "Bộ MA", "Từ app", "Mẫu mới" — không xoá mất mẫu vừa thêm ở tab khác / app.

## Nhóm: Mẫu chỉ báo — áp, đổi tên, xoá

# [TC_BDLK_15] Bấm tên mẫu → THAY toàn bộ chỉ báo của biểu đồ bằng bộ của mẫu, đúng thông số

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Biểu đồ đang có Volume. Có mẫu "MA + RSI" (MA 21 trên khung giá, RSI 7).
2. Mở menu, bấm tên "MA + RSI".

## Kết quả mong đợi
- [ ] Menu đóng.
- [ ] Biểu đồ chỉ còn Moving Average (độ dài 21) và RSI (độ dài 7) — Volume bị xoá.
- [ ] Không ghi gì lên máy chủ.

# [TC_BDLK_16] Mẫu có chỉ báo không dựng được → báo "Không dựng lại được 1/2 chỉ báo…", chỉ báo còn lại vẫn dựng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có mẫu "Hỏng một phần" gồm MA 21 và một chỉ báo tên không tồn tại.
2. Áp mẫu.

## Kết quả mong đợi
- [ ] Toast lỗi `Không dựng lại được 1/2 chỉ báo của mẫu "Hỏng một phần"`.
- [ ] Biểu đồ có Moving Average.

# [TC_BDLK_17] Đổi tên — hộp điền sẵn tên cũ; lưu giữ id + bộ chỉ báo, menu hiện tên mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có mẫu "Bộ MA", "RSI". Bấm bút chì ở "Bộ MA".
2. Đổi thành "Đường MA 21", nhấn Enter.
3. Mở lại menu.

## Kết quả mong đợi
- [ ] Hộp "Đổi tên mẫu chỉ báo", ô điền sẵn "Bộ MA" và đang focus.
- [ ] Ghi 1 lần: mẫu giữ id + bộ chỉ báo, tên mới "Đường MA 21".
- [ ] Menu: "Đường MA 21", "RSI".

# [TC_BDLK_18] Đổi tên trùng mẫu khác → "Đã có mẫu khác trùng tên này"; trùng chính nó (khác hoa thường) thì được

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có "Bộ MA", "RSI". Đổi tên "Bộ MA" thành `rsi`.
2. Đổi thành `BỘ MA`.

## Kết quả mong đợi
- [ ] `rsi`: dưới ô hiện "Đã có mẫu khác trùng tên này", không ghi.
- [ ] `BỘ MA`: lưu được, danh sách "BỘ MA", "RSI".

# [TC_BDLK_19] Xoá — hộp hỏi lại; Huỷ không xoá; Xoá ghi danh sách không còn mẫu đó

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Có "Bộ MA", "RSI". Bấm thùng rác ở "RSI", bấm Huỷ.
2. Bấm thùng rác lần nữa, bấm "Xoá".
3. Mở lại menu.

## Kết quả mong đợi
- [ ] Hộp "Xoá mẫu chỉ báo", nội dung `Xoá mẫu "RSI"?`, không có ô tên, nút "Huỷ" + "Xoá" (màu đỏ).
- [ ] Huỷ: không ghi.
- [ ] Xoá: ghi danh sách chỉ còn "Bộ MA"; menu chỉ còn "Bộ MA".

# [TC_BDLK_20] Dữ liệu mẫu hỏng → menu bỏ qua mẫu hỏng, không lỗi JS

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Danh sách trên máy chủ lẫn mẫu thiếu bộ chỉ báo, bộ chỉ báo rỗng, thiếu id, số, null. Mở menu.
2. Máy chủ trả giá trị không phải JSON. Mở lại menu.

## Kết quả mong đợi
- [ ] Chỉ hiện mẫu hợp lệ "Tốt".
- [ ] Giá trị không phải JSON: menu chỉ có dòng "Lưu chỉ báo thành mẫu…".
- [ ] Không có lỗi JS.

## Nhóm: Liên kết thẻ — chọn kiểu đồng bộ

# [TC_BDLK_21] "Tạo nhóm mới" mở hộp "Đồng bộ giữa các thẻ" 4 ô, mặc định Khung thời gian + Chỉ báo; bỏ hết thì nút khoá

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục 2 khung VNM | HPG chưa liên kết. Giữ Ctrl bấm 2 thẻ.
2. Bấm "Tạo nhóm mới" trên thanh chọn thẻ.
3. Bỏ tích Khung thời gian và Chỉ báo; rồi tích Trỏ chuột.

## Kết quả mong đợi
- [ ] Hộp tiêu đề "Đồng bộ giữa các thẻ", 4 ô: Mã cổ phiếu, Khung thời gian, Chỉ báo, Trỏ chuột.
- [ ] Mặc định tích Khung thời gian + Chỉ báo.
- [ ] Bỏ hết: nút "Tạo nhóm" bị khoá; tích lại 1 ô thì mở.

# [TC_BDLK_22] Tạo nhóm với kiểu đã chọn → kiểu đồng bộ lưu vào mọi thẻ của nhóm

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn 2 thẻ VNM, HPG, "Tạo nhóm mới", tích Mã cổ phiếu + Trỏ chuột, bỏ Chỉ báo, bấm "Tạo nhóm".

## Kết quả mong đợi
- [ ] Thanh chọn thẻ đóng, 2 thẻ cùng nhóm Cam (`link-1`).
- [ ] Bố cục web định ghi: cả 2 thẻ có `link_sync = {symbol: true, interval: true, studies: false, range: true}`.

## Nhóm: Liên kết thẻ — đồng bộ khi dùng

# [TC_BDLK_23] Đồng bộ khung thời gian — đổi khung thẻ VNM sang 1W → thẻ HPG cũng 1W, mã giữ nguyên

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. VNM | HPG cùng nhóm, chỉ bật Khung thời gian. Đổi khung thẻ VNM sang 1W.

## Kết quả mong đợi
- [ ] Thẻ HPG chuyển 1W, vẫn là HPG.
- [ ] Bố cục ghi khung 1W cho cả 2 thẻ.

# [TC_BDLK_24] Đồng bộ chỉ báo — thêm RSI(7) ở thẻ VNM → thẻ HPG có cùng bộ chỉ báo, cùng thông số; xoá cũng đồng bộ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. VNM | HPG cùng nhóm, chỉ bật Chỉ báo. Thêm RSI độ dài 7 ở thẻ VNM.
2. Xoá RSI ở thẻ HPG.

## Kết quả mong đợi
- [ ] Thẻ HPG có Volume + RSI, RSI độ dài 7.
- [ ] Xoá ở HPG thì thẻ VNM cũng mất RSI (đồng bộ hai chiều).

# [TC_BDLK_25] Đồng bộ mã — đổi mã thẻ VNM sang FPT → thẻ HPG cũng thành FPT

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. VNM | HPG cùng nhóm, chỉ bật Mã cổ phiếu. Đổi mã thẻ VNM sang FPT.

## Kết quả mong đợi
- [ ] Thẻ còn lại cũng mở FPT; tên 2 thẻ đều "FPT".

# [TC_BDLK_26] Kiểu không bật thì không đồng bộ — nhóm chỉ bật Mã: đổi khung, thêm chỉ báo không lan sang

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. VNM | HPG cùng nhóm, chỉ bật Mã cổ phiếu. Ở thẻ VNM đổi khung 1W và thêm RSI.

## Kết quả mong đợi
- [ ] Thẻ HPG vẫn 1D, chỉ có Volume, vẫn là HPG.

# [TC_BDLK_27] Trỏ chuột — kéo ngang / thu phóng thẻ VNM → thẻ HPG cùng khung hiện đúng đoạn thời gian đó

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. VNM | HPG cùng nhóm, cùng khung 1D, chỉ bật Trỏ chuột.
2. Kéo ngang biểu đồ VNM sang phải (xem về quá khứ).
3. Lăn chuột để phóng to biểu đồ VNM.

## Kết quả mong đợi
- [ ] Sau khi kéo: cây nến cuối đang hiện của HPG trùng mốc với VNM (lùi về quá khứ so với trước).
- [ ] Sau khi phóng to: đoạn thời gian đang hiện của 2 thẻ trùng nhau.

# [TC_BDLK_28] Trỏ chuột chỉ áp cho thẻ cùng khung — thẻ HPG khung 1W không đổi đoạn khi kéo thẻ VNM khung 1D

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. VNM 1D | HPG 1W cùng nhóm, chỉ bật Trỏ chuột. Kéo ngang biểu đồ VNM.

## Kết quả mong đợi
- [ ] Đoạn thời gian của VNM đổi; của HPG giữ nguyên (khác khung thì số cây nến không so được, bỏ qua).

## Nhóm: Liên kết thẻ — bảng Bố cục

# [TC_BDLK_29] Mỗi nhóm có nút "Chọn đồng bộ"; bấm mở ô chọn đúng kiểu của nhóm, mỗi lần một nhóm, bấm lại thì đóng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bố cục có 2 nhóm: Cam (bật Mã + Trỏ chuột), Xanh ngọc (mặc định). Mở bảng Bố cục.
2. Bấm "Chọn đồng bộ của nhóm Cam".
3. Bấm nút của nhóm Xanh ngọc; bấm lại lần nữa.

## Kết quả mong đợi
- [ ] Ban đầu ô chọn ẩn, nút `aria-expanded=false`.
- [ ] Nhóm Cam: 4 ô, tích Mã cổ phiếu + Trỏ chuột; nút `aria-expanded=true`.
- [ ] Mở nhóm Xanh ngọc thì ô của Cam đóng; bấm lại thì đóng.

# [TC_BDLK_30] Ô đang tích cuối cùng bị khoá — nhóm phải đồng bộ ít nhất một thứ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhóm Cam chỉ bật Khung thời gian. Mở ô chọn đồng bộ.
2. Tích thêm Chỉ báo.

## Kết quả mong đợi
- [ ] Ô Khung thời gian đã tích và bị khoá; 3 ô còn lại bấm được.
- [ ] Có 2 ô tích thì Khung thời gian mở khoá.

# [TC_BDLK_31] Sửa đồng bộ ở bảng Bố cục → áp ngay cho cả nhóm

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. VNM | HPG cùng nhóm (Khung thời gian + Chỉ báo). Ở bảng Bố cục tích thêm Mã cổ phiếu.
2. Đổi mã thẻ VNM sang SSI.

## Kết quả mong đợi
- [ ] Bố cục ghi `link_sync` mới (có `symbol: true`) cho cả 2 thẻ.
- [ ] Thẻ HPG đổi theo thành SSI.

# [TC_BDLK_32] Nhóm tạo trước 04/11 đọc là Khung thời gian + Chỉ báo; khoá cũ "crosshair" đọc là Trỏ chuột

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhóm Cam chưa có `link_sync`; nhóm Xanh ngọc có `link_sync = {crosshair: true}`. Mở ô chọn đồng bộ của từng nhóm.

## Kết quả mong đợi
- [ ] Cam: tích Khung thời gian + Chỉ báo.
- [ ] Xanh ngọc: tích Khung thời gian + Chỉ báo + Trỏ chuột.

# [TC_BDLK_33] Hộp ⓘ "Cách dùng liên kết thẻ" mô tả 4 kiểu đồng bộ và bước chọn kiểu khi tạo nhóm

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở bảng Bố cục, rê chuột lên nút ⓘ cạnh "Liên kết thẻ".

## Kết quả mong đợi
- [ ] Hộp hướng dẫn có: "đồng bộ những gì bạn chọn cho nhóm: mã cổ phiếu, khung thời gian, chỉ báo, trỏ chuột", "kéo hay thu phóng một thẻ thì các thẻ cùng khung thời gian hiện đúng đoạn đó", "chọn những gì cần đồng bộ rồi bấm Tạo nhóm".

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 33 |
| **Tổng** | **33** |

Cả 33 case (34 test — TC_12 chạy 2 biến thể) chạy tự động, pass trên kfsp.vn ngày 10/11/2026, không có `test.fixme`.

**Cập nhật 10/11/2026:** xoá TC_BDLK_34 (bug được user chấp nhận). 34 → 33 TC.

## Phát hiện đáng chú ý

2. Áp mẫu là **thay thế** toàn bộ chỉ báo (kể cả Volume), không cộng thêm (TC_15) — đúng chú thích trong code, nhưng người
   dùng có thể bất ngờ khi mất Volume.
3. Ô "Trỏ chuột" giờ đồng bộ **đoạn thời gian khi kéo / thu phóng**, không còn đồng bộ trỏ chuột như tên gọi (code giữ nhãn
   "Trỏ chuột" theo yêu cầu 04/11/2026); chỉ áp cho thẻ cùng khung thời gian (TC_27, TC_28).
4. Mẫu chỉ báo dùng chung khoá cài đặt với app (`ta_indicator_templates`); web đọc lại danh sách trên máy chủ mỗi lần mở
   menu và trước mỗi lần ghi, nên không xoá mất mẫu lưu ở nơi khác (TC_02, TC_14).
5. Tài khoản Free không có nút "Mẫu chỉ báo" và không dùng được liên kết thẻ (liên kết thẻ Free đã có ở TC_PTKT_RP_61).
