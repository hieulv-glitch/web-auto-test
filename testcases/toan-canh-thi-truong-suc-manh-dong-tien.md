# Màn hình: Toàn cảnh thị trường — Sức mạnh dòng tiền (RRG)

- **URL:** `/suc-manh-dong-tien` (yêu cầu đăng nhập, `meta: { requiresUser: true }`). 1 trong 3 màn con của menu
  header "Toàn cảnh thị trường" (2 màn con còn lại: `/nganh` và `/bo-loc`, có tài liệu riêng).
- **Component thật sự render:** `stocks/src/views/ibd/index.vue` (`props: { type: "rrg" }`) →
  `reactLayoutIBD.js` (React, dùng `flexlayout-react`) → `stocks/src/views/ibd/wrapperLayout.vue`
  (`type == 'rrg'`) → **`stocks/src/views/rrg/RRG.vue`** (2457 dòng) là component chứa toàn bộ UI thật của màn
  này, cùng các con: `TableData.vue` (bảng "Bảng dữ liệu"/"Watchlist"), `TableDataNganh.vue` (bảng "Ngành"),
  `AddMackSearch.vue` (ô tìm mã), `MackReferences.vue` (ô "Tham chiếu"), `echart.vue` (wrapper ECharts).
- **⚠️ ĐÍNH CHÍNH quan trọng — route trùng path trong router:**
  `stocks/src/router/index.js` đăng ký path `suc-manh-dong-tien` **2 LẦN** trong cùng mảng `children` của route
  cha `/`: dòng ~523 (`component: IBD, props: { type: "rrg" }`) và dòng ~682 (`component: RRGChart`, tức
  `@/views/rrg/RRG.vue` import thẳng, không qua `WrapperLayout`). Đã xác nhận bằng DOM live (`inspect-dom.ts`
  + Playwright thật) rằng **route dòng ~523 (IBD) là route thắng** — Vue Router khớp route đăng ký TRƯỚC trong
  mảng khi 2 route trùng path, nên route dòng ~682 (`RRGChart`) là **route chết, không bao giờ được kích hoạt**
  khi vào bằng URL `/suc-manh-dong-tien`. Tài liệu này viết theo đúng route thắng (IBD → `WrapperLayout` →
  `RRG.vue`).
- **Domain test:** https://kfsp.vn/suc-manh-dong-tien — từ 09/11/2026 spec chạy qua `PREV2_BASE_URL` (= kfsp.vn, bản preprod mới
  nhất), đăng nhập bằng `Prev2Session`.
- **⚠️ AN TOÀN DỮ LIỆU (cập nhật 09/11/2026):** backend production, tài khoản test dùng chung. Mọi request không phải GET tới
  `*.kfsp.vn/api/` bị huỷ (`afterEach` kiểm tra không có lệnh ghi nào ngoài dự kiến); riêng `POST /api/watchlist` (thêm mã
  vào watchlist) được giả lập. Trước đó TC_SMDT_15 xoá VNM khỏi watchlist THẬT qua màn /watchlist rồi thêm lại thật — đã bỏ.
- **Nguồn testcase gốc (app):** tab Google Sheet "Toàn Cảnh Thị Trường(Sức Mạnh Dòng Tiền)" — chỉ dùng để học
  văn phong, KHÔNG phải checklist đủ. Sheet viết cho app mobile nên có nhiều mục đặc thù mobile (pinch zoom,
  long-press, vuốt back, xoay ngang, notch...) đã **xoá hẳn**, không áp dụng cho web.
- **Phương pháp sinh:** Đọc source code (`RRG.vue`, `TableData.vue`, `TableDataNganh.vue`, `AddMackSearch.vue`,
  `MackReferences.vue`, `ProtectedView.vue`) + kiểm kê độc lập bằng Playwright thật (bao gồm hover trực tiếp lên
  `<canvas>` ECharts để xác nhận tooltip render RA DOM thật, không phải vẽ trên canvas).
- **⚠️ Giới hạn kỹ thuật:** biểu đồ RRG/RS dùng ECharts `CanvasRenderer` — 4 label vùng (PHỤC HỒI/DẪN DẮT/ĐỘI
  SỔ/SUY YẾU), tên trục (SỨC MẠNH/ĐÀ), watermark, đường quỹ đạo... đều VẼ TRÊN `<canvas>`, không phải text DOM,
  nên Playwright chỉ verify được canvas tồn tại + hiển thị, không assert được nội dung/vị trí chi tiết bên
  trong. **Ngoại lệ: tooltip khi hover 1 điểm dữ liệu render RA DOM thật** (đã verify bằng automation — tìm
  thấy `.tooltip-title` + text "Ngày:"/"Đà:"/"Sức mạnh:" qua `page.getByText()` bình thường), nên các testcase
  tooltip verify được đầy đủ bằng automation.
- **Quy ước trạng thái:** 🆕 Testcase mới (web-only hoặc viết lại theo văn phong sheet) · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Điều hướng & tổng quan

# [TC_SMDT_01] Điều hướng vào màn từ menu "Thị Trường"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Cập nhật 09/11/2026:** menu header "Toàn cảnh thị trường" đổi tên "Thị Trường", gồm Bảng giá chứng khoán, Bảng giá
  crypto, Ngành, Sức mạnh dòng tiền, Thông tin và Sự Kiện (Bộ lọc cổ phiếu chuyển sang menu "Cơ hội").
- **Kết quả đo được:** Hover/click menu header "Toàn cảnh thị trường" mở dropdown 3 mục: "Ngành" (`/nganh`),
  "Bộ lọc cổ phiếu" (`/bo-loc`), "Sức mạnh dòng tiền" (`/suc-manh-dong-tien`). Click "Sức mạnh dòng tiền" vào
  đúng URL `/suc-manh-dong-tien`.

## Các bước thực hiện
1. Đăng nhập, rê chuột vào menu "Thị Trường" trên header.
2. Click mục "Sức mạnh dòng tiền".

## Kết quả mong đợi
- [ ] Dropdown có mục "Sức mạnh dòng tiền", click điều hướng đúng `/suc-manh-dong-tien`.

---

# [TC_SMDT_02] Tổng quan layout mặc định

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Layout chia 2 panel `#left_panel` (~40%, 3 tab "Bảng dữ liệu"/"Watchlist"/"Ngành", tab
  "Bảng dữ liệu" active mặc định) và `#right_panel` (~60%, 2 tab "Biểu đồ RRG"/"Biểu đồ RS", tab "Biểu đồ RRG"
  active mặc định). Panel phải hiển thị đủ: "Tham chiếu" (mặc định VNINDEX), "Khung hiển thị" (slider, mặc định
  20 Ngày), đồng hồ giờ thực (`hh:mm:ss (UTC+7)`), biểu đồ RRG với lưới toạ độ 90-110 mặc định (chưa chọn mã
  nào).

## Các bước thực hiện
1. Vào `/suc-manh-dong-tien` (đã đăng nhập).

## Kết quả mong đợi
- [ ] Tab trái "Bảng dữ liệu" active mặc định, tab phải "Biểu đồ RRG" active mặc định.
- [ ] Panel phải hiển thị đủ "Tham chiếu"=VNINDEX, "Khung hiển thị"=20 Ngày, đồng hồ giờ, canvas biểu đồ RRG.

---

## Nhóm: Panel trái — Tab "Bảng dữ liệu"

# [TC_SMDT_03] Header bảng "Bảng dữ liệu" đủ cột

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Ở tab "Bảng dữ liệu" (mặc định), quan sát header bảng.

## Kết quả mong đợi
- [ ] Hiển thị đủ cột: checkbox chọn tất cả, Mã CK, Trạng thái, Ngành, Giá, RSs, RSm, RSl, "Biến động giá
      (Tuần)", "Biến động giá (Tháng)", Khối lượng.

---

# [TC_SMDT_04] Tìm kiếm mã hiện gợi ý

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Gõ "VCB" vào ô "Nhập tên mã cổ phiếu để thêm vào danh sách" hiện đúng 1 gợi ý "VCB —
  Ngân hàng TMCP Ngoại thương...". So khớp không phân biệt hoa/thường (input tự uppercase trong logic tìm),
  tối đa 5 gợi ý theo code (`limit = 5`).

## Các bước thực hiện
1. Gõ "vcb" vào ô tìm kiếm mã (tab "Bảng dữ liệu").

## Kết quả mong đợi
- [ ] Hiện dropdown gợi ý chứa mã "VCB" kèm tên công ty, dù gõ chữ thường.

---

# [TC_SMDT_05] Chọn gợi ý thêm mã vào bảng + biểu đồ

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click gợi ý "VCB" → mã VCB xuất hiện ngay trong bảng (đã tick sẵn checkbox) + xuất hiện
  đường quỹ đạo có nhãn "VCB" trên biểu đồ RRG bên phải (biểu đồ tự zoom lại theo `data_min_max` của các mã đã
  chọn). Ô tìm kiếm reset về rỗng sau khi thêm.

## Các bước thực hiện
1. Gõ "VCB" vào ô tìm kiếm, click gợi ý "VCB".

## Kết quả mong đợi
- [ ] Bảng có thêm dòng "VCB", checkbox đã tick sẵn.
- [ ] Biểu đồ RRG hiện đường quỹ đạo + nhãn "VCB".
- [ ] Ô tìm kiếm reset về rỗng.

---

# [TC_SMDT_06] Click mã CK trong bảng mở modal Trading Chart

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Ghi chú:** `showModalTradingChart(mack)` set `store.state.mackTradingChart` + `isShowModalTradingChart =
  true` — modal dùng chung toàn site (đã có tài liệu riêng ở màn khác), ở đây chỉ verify đúng entry point mở
  modal, không đi sâu nội dung modal.

## Các bước thực hiện
1. Đã thêm mã VCB vào bảng (TC_SMDT_05). Click vào chữ "VCB" (link) trong bảng.

## Kết quả mong đợi
- [ ] Mở modal "Trading Chart" đúng mã VCB, không điều hướng rời `/suc-manh-dong-tien`.

---

# [TC_SMDT_07] Dropdown 3-chấm dòng mã — "Thêm vào watchlist"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Ghi chú:** Mở modal `AddWatchListDropdown.vue` — component dùng chung đã có tài liệu chi tiết ở
  [bang-gia.md](bang-gia.md)/[watchlist.md](watchlist.md)/[phan-tich-co-ban-thong-tin-chung.md](phan-tich-co-ban-thong-tin-chung.md);
  ở đây chỉ verify đúng entry point + nội dung modal đúng mã.

## Các bước thực hiện
1. Đã thêm mã VCB vào bảng. Click icon 3-chấm dọc cạnh mã VCB → click "Thêm vào watchlist".

## Kết quả mong đợi
- [ ] Mở modal "Chọn watchlist để đưa VCB vào theo dõi", liệt kê danh sách watchlist của user.

---

# [TC_SMDT_08] Dropdown 3-chấm dòng mã — "Xóa khỏi danh sách"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Đã thêm mã VCB vào bảng. Click icon 3-chấm dọc cạnh mã VCB → click "Xóa khỏi danh sách".

## Kết quả mong đợi
- [ ] Dòng VCB biến mất khỏi bảng ngay lập tức.

---

# [TC_SMDT_09] Icon tuỳ chọn cạnh ô tìm kiếm — "Xóa tất cả"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Đã thêm ít nhất 1 mã vào bảng. Click icon tuỳ chọn (3 chấm) cạnh ô tìm kiếm → click "Xóa tất cả".

## Kết quả mong đợi
- [ ] Toàn bộ mã trong bảng bị xoá, bảng trống.

---

# [TC_SMDT_10] Checkbox "chọn tất cả" ở header bảng

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Đã có ít nhất 2 mã trong bảng, bỏ tick hết. Click checkbox ở header bảng.

## Kết quả mong đợi
- [ ] Tất cả checkbox các dòng được tick theo, biểu đồ RRG hiện đủ đường quỹ đạo các mã.

---

# [TC_SMDT_11] Giới hạn chọn tối đa 15 mã trong bảng

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Đọc code `TableData.vue` (`checkItem`): khi số mã đang tick (`list_mack_selected_in_table`) đạt
  15, checkbox các dòng còn lại tự động `disabled`, và cố tick thêm hiện toast lỗi "Bạn chỉ được chọn tối đa
  15". Việc thêm đủ 15 mã thật + verify toast đòi hỏi thêm nhiều request tra cứu mã hợp lệ (tốn thời gian chạy
  test đáng kể, dễ bị rate-limit dữ liệu real-time nếu chạy lặp lại) — chưa tự động hoá đầy đủ trong lần này,
  nhưng hành vi đã rõ ràng từ source, rủi ro sai lệch thấp.

## Các bước thực hiện
1. Thêm liên tiếp cho đến khi có 16 mã trong bảng, cố tick mã thứ 16.

## Kết quả mong đợi
- [ ] Từ mã thứ 16 trở đi, checkbox bị disable; nếu cố tick hiện toast lỗi "Bạn chỉ được chọn tối đa 15".

**Ghi chú riêng:** khi THÊM mã mới bằng ô tìm kiếm (`addMackToList`), mã tự động tick sẵn chỉ khi số mã đang
tick hiện tại < 10 (khác ngưỡng 15 của checkbox thủ công trong bảng) — 2 ngưỡng khác nhau (10 khi tự động tick
lúc thêm mới, 15 khi tick tay) là hành vi thật trong code, không phải lỗi đánh máy, cần lưu ý khi test không
nhầm lẫn 2 ngưỡng.

---

# [TC_SMDT_12] Sắp xếp bảng theo cột

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click header cột (VD "RSs") → icon mũi tên hiện cạnh header, đổi chiều theo click lặp
  lại.

## Các bước thực hiện
1. Click header cột "RSs". Click lại lần nữa.

## Kết quả mong đợi
- [ ] Lần click đầu hiện icon sort (asc/desc); click lại đổi chiều mũi tên.

---

## Nhóm: Panel trái — Tab "Watchlist"

# [TC_SMDT_13] Chuyển sang tab "Watchlist"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Nội dung đổi hẳn: dropdown chọn watchlist (`<select>` liệt kê mọi watchlist + nhật ký
  của user) + ô input "Mã CK" + icon "+" thêm mã, bảng dữ liệu đổi theo watchlist đang chọn.

## Các bước thực hiện
1. Click tab "Watchlist".

## Kết quả mong đợi
- [ ] Tab "Watchlist" active, hiển thị dropdown chọn watchlist + ô input "Mã CK" + icon "+" + bảng dữ liệu.

---

# [TC_SMDT_14] Đổi watchlist đang chọn cập nhật đúng bảng

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Ở tab "Watchlist", đổi dropdown sang 1 watchlist khác.

## Kết quả mong đợi
- [ ] Bảng cập nhật đúng danh sách mã của watchlist vừa chọn (không còn dữ liệu watchlist cũ).

---

# [TC_SMDT_15] Thêm mã hợp lệ vào watchlist đang chọn

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Gõ mã hợp lệ vào ô "Mã CK", click gợi ý hoặc Enter, click icon "+" → gọi
  `POST /api/watchlist`, ô input reset trống.
- **Cập nhật 09/11/2026:** không còn toast "Thêm vào watchlist thành công" (app tắt mọi toast thành công từ 12/10/2026).
  Lệnh thêm được giả lập (không ghi thật); test kiểm body `{ mack: "VNM", my_watchlist_id }` và không có toast lỗi.

## Các bước thực hiện
1. Gõ 1 mã hợp lệ chưa có trong watchlist đang chọn, chọn gợi ý, click icon "+".

## Kết quả mong đợi
- [ ] Gửi `POST /api/watchlist` đúng mã + watchlist đang chọn; không có toast lỗi; ô mã trống lại.

---

# [TC_SMDT_16] Thêm mã không hợp lệ vào watchlist

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Gõ chuỗi không phải mã hợp lệ, click icon "+" trực tiếp (không chọn gợi ý) → hiện toast
  lỗi "Mã CK không hợp lệ!", không gọi API.

## Các bước thực hiện
1. Gõ 1 chuỗi không phải mã CK hợp lệ (VD "ZZZZZ") vào ô "Mã CK", click icon "+".

## Kết quả mong đợi
- [ ] Hiện toast lỗi "Mã CK không hợp lệ!".

---

# [TC_SMDT_17] Thêm mã đã có sẵn trong watchlist

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Cập nhật 09/11/2026:** đã tự động hoá — máy chủ giả trả lỗi 400 cho `POST /api/watchlist` (giả lập mã trùng), không cần
  mã có sẵn thật. Nhánh `catch` hiện toast "Mã chứng khoán đã có trong Watchlist, vui lòng thử lại" (mọi lỗi đều báo là
  trùng mã, kể cả lỗi mạng/500).

## Các bước thực hiện
1. Thêm 1 mã đã có sẵn trong watchlist đang chọn.

## Kết quả mong đợi
- [ ] Hiện toast lỗi "Mã chứng khoán đã có trong Watchlist, vui lòng thử lại".

---

## Nhóm: Panel trái — Tab "Ngành"

# [TC_SMDT_18] Chuyển sang tab "Ngành"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Hiển thị bảng đơn giản hơn (HTML table thường, không phải virtual-list): cột checkbox,
  Ngành, Trạng thái, Giá, RSs — liệt kê đủ ~34 ngành (Bảo Hiểm, Bất Động Sản, Cao Su, Chứng Khoán... Xây Dựng).
  **Khác biệt so với 2 tab kia:** tên ngành hiển thị dạng chữ thường (`<b>`), KHÔNG phải link — click vào tên
  ngành KHÔNG mở modal Trading Chart (đọc `TableDataNganh.vue` xác nhận không có `CLink`/click-handler nào gắn
  vào ô tên ngành).

## Các bước thực hiện
1. Click tab "Ngành".

## Kết quả mong đợi
- [ ] Hiển thị bảng danh sách toàn bộ ngành, mỗi dòng có checkbox + Ngành + Trạng thái + Giá + RSs.
- [ ] Click vào tên 1 ngành KHÔNG mở modal Trading Chart (khác hành vi mã CK ở 2 tab kia).

---

# [TC_SMDT_19] Chọn checkbox 1 ngành thêm vào biểu đồ

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Ở tab "Ngành", tick checkbox 1 ngành (VD "NGÂN HÀNG").

## Kết quả mong đợi
- [ ] Biểu đồ RRG bên phải hiện thêm đường quỹ đạo có nhãn đúng tên ngành vừa chọn.

---

## Nhóm: Panel phải — Tab "Biểu đồ RRG"

# [TC_SMDT_20] Overview tab "Biểu đồ RRG" (mặc định active)

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Quan sát panel phải khi tab "Biểu đồ RRG" active (mặc định).

## Kết quả mong đợi
- [ ] Hiển thị "Tham chiếu" = VNINDEX, "Khung hiển thị" = "20 Ngày", đồng hồ giờ thực chạy (định dạng
      `DD/MM/YYYY hh:mm:ss (UTC+7)`), canvas biểu đồ RRG.

---

# [TC_SMDT_21] Đổi mã tham chiếu

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Ghi chú:** Ô "Tham chiếu" (`MackReferences.vue`) có autocomplete riêng (không dùng chung `AddMackSearch`),
  sort gợi ý theo độ dài mã tăng dần.

## Các bước thực hiện
1. Gõ "VN30" vào ô "Tham chiếu", chọn gợi ý "VN30".

## Kết quả mong đợi
- [ ] Ô "Tham chiếu" đổi giá trị thành "VN30", biểu đồ tính lại theo mã tham chiếu mới (không lỗi JS).

---

# [TC_SMDT_22] Kéo slider "Khung hiển thị" đổi số ngày

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Ghi chú:** Slider dùng `vue-range-slider`, khoảng giá trị 1-50, mặc định 20. Label hiển thị động
  `"{{slider}} {{Ngày|Tuần|Tháng}}"` (đơn vị theo `data_filter_type_time`, mặc định "Ngày"; UI đổi đơn vị
  Ngày/Tuần/Tháng bị ẩn cứng `v-if="false"` trong code nên KHÔNG hiển thị trên UI — không viết testcase cho
  phần này vì không truy cập được từ UI).

## Các bước thực hiện
1. Kéo knob slider "Khung hiển thị" sang trái (giảm số ngày).
2. Kéo sang phải (tăng số ngày).

## Kết quả mong đợi
- [ ] Label cập nhật đúng số ngày mới sau mỗi lần kéo (VD "10 Ngày", "35 Ngày"), biểu đồ re-zoom lại theo
      khung mới.

---

# [TC_SMDT_23] Biểu đồ RRG hiện đường quỹ đạo khi có mã được chọn

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Sau khi thêm 1 mã (VD VCB) và tick chọn, canvas hiện đường cong quỹ đạo màu riêng, mũi
  tên ở điểm cũ nhất, nhãn tên mã ở gần điểm mới nhất; trục X/Y tự scale lại theo khoảng giá trị thực tế của
  các mã đang chọn (không còn cố định 90-110 như lúc chưa chọn mã nào).

## Các bước thực hiện
1. Thêm và tick chọn 1 mã ở tab "Bảng dữ liệu".
2. Quan sát canvas biểu đồ RRG.

## Kết quả mong đợi
- [ ] Canvas hiển thị (visible, kích thước hợp lý), không lỗi JS console.

---

# [TC_SMDT_24] Hover 1 điểm dữ liệu hiện tooltip đúng nội dung

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Hover đúng toạ độ 1 điểm trên đường quỹ đạo → tooltip render RA DOM thật (không phải
  canvas), gồm: tên mã + tag trạng thái màu (Dẫn dắt/Phục hồi/Đội sổ/Suy yếu), "Ngày: DD-MM-YYYY", "Đà: <số>",
  "Sức mạnh: <số>" (màu số theo `>100` xanh / `<100` đỏ / `=100` trung tính). Đã verify bằng automation thật:
  `page.getByText(/^Đà:/)` và `/^Sức mạnh:/` tìm thấy trong DOM sau khi hover đúng toạ độ điểm.

## Các bước thực hiện
1. Thêm 1 mã (VD VCB), hover chuột vào điểm gần nhất trên đường quỹ đạo.

## Kết quả mong đợi
- [ ] Tooltip hiện đúng: tên mã, tag trạng thái, dòng "Ngày:", "Đà:", "Sức mạnh:".

---

# [TC_SMDT_25] 4 vùng màu quadrant + label + trục (UI, giới hạn kỹ thuật canvas)

- **Trạng thái:** 🆕 — **Đã verify thực tế qua ảnh chụp: Pass**
- **Ghi chú:** Label "PHỤC HỒI"/"DẪN DẮT"/"ĐỘI SỔ"/"SUY YẾU" + tên trục "SỨC MẠNH"/"ĐÀ" đều vẽ trên canvas
  (ECharts `graphic`/`xAxis.name`/`yAxis.name`), không phải DOM text → chỉ verify được bằng quan sát ảnh chụp
  thật (đã chụp, xem `.dom-inspect/toan-canh-thi-truong-suc-manh-dong-tien-initial.png`), KHÔNG viết assertion
  tự động cho nội dung/vị trí label trong `.spec.ts` (chỉ assert canvas visible).

## Các bước thực hiện
1. Quan sát biểu đồ RRG khi chưa chọn mã nào (trạng thái mặc định).

## Kết quả mong đợi
- [ ] 4 góc biểu đồ có màu nền riêng + label: "PHỤC HỒI" (trên-trái, nền tím), "DẪN DẮT" (trên-phải, nền xanh
      lá), "ĐỘI SỔ" (dưới-trái, nền đỏ), "SUY YẾU" (dưới-phải, nền cam).
- [ ] Trục X có tên "SỨC MẠNH", trục Y có tên "ĐÀ"; 2 đường mốc 100 chia biểu đồ thành 4 vùng.

---

## Nhóm: Panel phải — Tab "Biểu đồ RS"

# [TC_SMDT_26] Tab "Biểu đồ RS" khi chưa chọn mã nào

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Bỏ chọn hết mã (nếu có), click tab "Biểu đồ RS".

## Kết quả mong đợi
- [ ] Hiện placeholder: "Hiện chưa có mã nào, hãy chọn thêm mã ở bên trái để hiển thị biểu đồ".

---

# [TC_SMDT_27] Biểu đồ RS hiện line chart khi có mã được chọn

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Thêm + tick 1 mã (VCB), click tab "Biểu đồ RS" → hiện line chart RSs theo thời gian
  (trục X ngày, trục Y giá trị), nhãn cuối đường = tên mã.

## Các bước thực hiện
1. Thêm và tick chọn mã VCB (tab "Bảng dữ liệu").
2. Click tab "Biểu đồ RS".

## Kết quả mong đợi
- [ ] Canvas biểu đồ RS hiển thị (visible), không còn placeholder "chưa có mã nào".

---

## Nhóm: Chung — Resize & giữ trạng thái

# [TC_SMDT_28] Kéo thanh chia đổi tỉ lệ 2 panel

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Ghi chú:** Đọc code `RRG.vue` (`mounted`): kéo `#resize_bar` đổi width `#left_panel`/`#right_panel`, giới
  hạn 20%-80%.

## Các bước thực hiện
1. Kéo `#resize_bar` sang phải ~100px.

## Kết quả mong đợi
- [ ] Panel trái rộng ra, panel phải hẹp lại tương ứng, không lỗi layout (không tràn/vỡ).

---

# [TC_SMDT_29] Giữ danh sách mã đã thêm qua F5 reload

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** `list_mack_by_table` được lưu `localStorage["list_mack_by_table_rrg"]` mỗi khi đổi
  (`watch` deep) và đọc lại ở `created()` (`getDataFromLocalStorage`) — F5 xong mã vẫn còn trong bảng.

## Các bước thực hiện
1. Thêm mã VCB vào bảng (tab "Bảng dữ liệu").
2. F5 reload trang.

## Kết quả mong đợi
- [ ] Sau reload, mã VCB vẫn còn trong bảng "Bảng dữ liệu" (không bị mất).

---

# [TC_SMDT_30] Giữ mã tham chiếu qua F5 reload

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** `input_reference` lưu `localStorage["input_reference_rrg"]`, đọc lại khi mount.

## Các bước thực hiện
1. Đổi "Tham chiếu" sang VN30.
2. F5 reload trang.

## Kết quả mong đợi
- [ ] Sau reload, ô "Tham chiếu" vẫn giữ giá trị "VN30" (không quay lại VNINDEX mặc định).

---

## Nhóm: Giới hạn theo gói hội viên (tài khoản Free)

# [TC_SMDT_31] Free: cả 3 tab bảng dữ liệu bên trái đều bị khoá

- **Trạng thái:** 🆕 — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Kết quả đo được:** Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`), vào
  `/suc-manh-dong-tien`: cả 3 tab "Bảng dữ liệu"/"Watchlist"/"Ngành" đều hiển thị `ProtectedView` (ảnh mờ +
  hover hiện "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này." + nút "Đăng ký ngay") thay vì bảng dữ
  liệu thật — đúng theo code (`tableName` computed trả về `smdt_co_phieu`/`smdt_watchlist`/`smdt_nganh` tương
  ứng từng tab, cả 3 đều có trong `features_disabled` của tài khoản Free hiện tại).

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào `/suc-manh-dong-tien`.
2. Lần lượt click cả 3 tab "Bảng dữ liệu"/"Watchlist"/"Ngành".

## Kết quả mong đợi
- [ ] Cả 3 tab đều hiện `ProtectedView` (ảnh mờ) thay vì bảng dữ liệu thật.

---

# [TC_SMDT_32] Free: cả biểu đồ RRG lẫn biểu đồ RS đều bị khoá

- **Trạng thái:** 🆕 — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Cập nhật:** Kết luận ban đầu ("RS KHÔNG bị khoá") SAI, đã tự kiểm tra lại bằng script Playwright riêng
  (đọc `outerHTML`/bounding box/screenshot thật, không chỉ đếm class) và sửa lại. Cả 2 tab đều render
  `.image-container` với `visible: true`, cùng kích thước full khung chart (~517×779px). Điểm khác biệt DUY
  NHẤT giữa 2 tab: RRG dùng CSS `blur` filter phủ lên chart thật (nhìn rõ artefact lưới/quadrant bị nhoè), còn
  RS dùng 1 ảnh tĩnh đã được làm mờ sẵn từ server (`<img src="https://api2.kfsp.vn/public/blur/smdt_rs.png"
  alt="Blurred Background" class="blurred-image">`) — nhìn thoáng qua giống dữ liệu biểu đồ thật (các đường màu
  lượn sóng) nên dễ nhầm là không bị khoá nếu chỉ nhìn ảnh chụp màn hình mà không kiểm tra DOM, nhưng bản chất
  vẫn là paywall như RRG.

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào `/suc-manh-dong-tien`.
2. Click tab "Biểu đồ RRG", quan sát.
3. Click tab "Biểu đồ RS", quan sát.

## Kết quả mong đợi
- [ ] Tab "Biểu đồ RRG" hiện `ProtectedView` (bị khoá) — có `.image-container` visible trong `#right_panel`.
- [ ] Tab "Biểu đồ RS" CŨNG hiện `ProtectedView` (bị khoá) — có `.image-container` visible trong `#right_panel`,
      dùng ảnh nền mờ tĩnh thay vì CSS blur filter, nhưng vẫn là trạng thái bị khoá.

---

## Tổng hợp trạng thái (32 testcase)

Đã tự động hoá bằng Playwright:
[tests/toan-canh-thi-truong-suc-manh-dong-tien.spec.ts](../tests/toan-canh-thi-truong-suc-manh-dong-tien.spec.ts)
(POM [pages/SucManhDongTienPage.ts](../pages/SucManhDongTienPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (đã verify bằng automation hoặc quan sát thực tế) | 31 | |
| ⚠️ Cần xác nhận thêm | 1 | TC_SMDT_11 (giới hạn 15 mã — tốn thời gian dựng dữ liệu) |

Cập nhật 09/11/2026: chạy trên kfsp.vn; TC_SMDT_17 đã tự động hoá (giả lập mã trùng); TC_01, TC_15 sửa theo giao diện mới.

**Cập nhật 10/11/2026:** xoá ghi chú bug "route `suc-manh-dong-tien` đăng ký 2 lần" (bug được user chấp nhận); không xoá testcase nào.

**Phát hiện đáng chú ý:**

2. **Cả RRG và RS đều bị khoá với tài khoản Free, nhưng bằng 2 cơ chế khác nhau** — xem TC_SMDT_32 (đã đính
   chính, kết luận ban đầu "RS không bị khoá" là SAI do chỉ nhìn ảnh chụp màn hình mà không kiểm tra DOM): RRG
   dùng CSS blur filter phủ lên chart thật, RS dùng 1 ảnh nền đã làm mờ sẵn từ server
   (`blur/smdt_rs.png`) — nhìn thoáng qua giống dữ liệu thật nên dễ nhầm, cần luôn kiểm tra `.image-container`
   trong DOM thay vì chỉ đọc ảnh chụp màn hình khi verify paywall.
3. **2 ngưỡng giới hạn số mã khác nhau trong cùng 1 bảng** — xem TC_SMDT_11: tự động tick khi thêm mã mới giới
   hạn ở 10 mã đang tick, nhưng tick tay qua checkbox lại giới hạn ở 15 — không phải lỗi hiển thị, là 2 hằng số
   khác nhau thật trong code (`addMackToList` so `countIsChecked < 10` vs `checkItem` so
   `list_mack_selected_in_table.length >= 15`).
4. Tab "Ngành" (trong 3 tab bảng trái) có UI/hành vi khác 2 tab còn lại: dùng bảng HTML thường thay vì
   `VirtualList`, và tên ngành KHÔNG phải link mở modal Trading Chart (khác mã CK ở tab "Bảng dữ liệu"/
   "Watchlist" — xem TC_SMDT_18).
