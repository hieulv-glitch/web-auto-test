# Màn hình: Phân tích cơ bản — Tab "Biểu đồ"

- **URL:** `/phan-tich-co-ban?mack=<mack>&tab=bieu-do`.
- **Component:** [stocks/src/views/faAnalysis/index.vue](../../stocks/src/views/faAnalysis/index.vue) dòng
  59-66 chọn 1 trong 2 component KHÁC NHAU tuỳ nhóm mã (`nhom_stockcode`, computed đọc
  `store.state.list_mack_company[stockcode]?.nhom`):
  - [stocks/src/views/pages/ChartByNonBank.vue](../../stocks/src/views/pages/ChartByNonBank.vue)
    (`name: "ChartByNonBank"`) — mã thường/BĐS/bảo hiểm (`nhom_stockcode != 'bank'`).
  - [stocks/src/views/pages/ChartByBank.vue](../../stocks/src/views/pages/ChartByBank.vue)
    (`name: "ChartByBank"`) — CHỈ mã ngân hàng (`nhom_stockcode == 'bank'`).
- **Domain test:** https://kfsp.vn/phan-tich-co-ban
- **Nguồn testcase gốc (app):** Google Sheet, tab "Phân Tích FA(Cổ Phiếu)", các dòng TC ID 145-168 ("Tab Biểu đồ
  - Overview"). **⚠️ KHÁC BIỆT KIẾN TRÚC HOÀN TOÀN so với app** — đã xác nhận qua đọc source + đo DOM thật
  (không chỉ suy đoán từ mô tả ban đầu, xem phát hiện #0 bên dưới): app (mobile) tab "Biểu đồ" là 1 biểu đồ
  DOANH THU/LỢI NHUẬN quý dạng cột duy nhất; web tab "Biểu đồ" là 1 LƯỚI NHIỀU biểu đồ ECharts tài chính (10
  biểu đồ cho mã thường: Doanh thu lợi nhuận quý, Biên lợi nhuận quý, Hiệu suất hoạt động, Khả năng thanh toán,
  Lưu chuyển tiền, Phân rã ROA/ROE, Tài sản quý, Nguồn vốn quý, Định giá; 11 biểu đồ + radar tổng hợp cho mã
  ngân hàng) — HOÀN TOÀN KHÔNG PHẢI biểu đồ giá nến kiểu TradingView. Sheet app chỉ dùng tham khảo văn phong,
  không map được 1-1 — độ phủ testcase dưới đây do tự kiểm kê source code (`ChartByNonBank.vue`/`ChartByBank.vue`
  đầy đủ) + DOM thật + nhiều script Playwright tạm thời đo network/console quyết định.
- **Quy ước trạng thái:** giống `phan-tich-co-ban-so-sanh.md` — ✅ Áp dụng (adapt từ app) · 🆕 Testcase mới (riêng
  web) · ⚠️ Cần xác nhận thêm.
- **An toàn dữ liệu:** Tab này KHÔNG có API mutate nào ghi dữ liệu tài khoản — `GET /api/stocks/chart/nonbank`,
  `GET /api/stocks/chart/bank`, `GET /api/stocks/chart/bank/scatter` đều chỉ ĐỌC. Nút "Lưu" trong modal "Thêm
  mã" (chỉ có ở mã ngân hàng) cũng chỉ gọi lại `GET /chart/bank` với tham số khác (KHÔNG lưu gì lên server) — an
  toàn gọi API thật cho mọi testcase.
- **⚠️ Tài khoản test dùng CHUNG cho nhiều screen khác trong dự án:** xem ghi chú đầy đủ ở đầu
  [phan-tich-co-ban.md](phan-tich-co-ban.md). Test đổi mã CK trong file này luôn reset lại đúng `VNM` sau khi
  xong để giảm nhiễu cho test khác chạy song song.
- **⚠️ Giới hạn kỹ thuật (giống tab 4M & CANSLIM):** mọi biểu đồ dùng ECharts `CanvasRenderer` — nhãn trục,
  tooltip, toolbox (icon xem bảng dữ liệu/đổi loại biểu đồ/khôi phục) đều VẼ TRÊN `<canvas>`, KHÔNG PHẢI text DOM
  thật. Playwright chỉ verify được: canvas tồn tại + kích thước hợp lý, số lượng card, và các hành vi có tác
  dụng phụ quan sát qua DOM/network khác (request params, toast, UpdateRequire...). Không có assertion tự động
  cho đúng nội dung số liệu/nhãn bên trong từng canvas.

## Phát hiện đáng chú ý — đọc trước khi dùng lại giả định ban đầu (đề bài gốc)

**#0. [ĐÍNH CHÍNH] Tab này KHÔNG dùng TradingView candlestick — hoàn toàn là lưới biểu đồ ECharts tài chính.**
Giả định ban đầu (dựa trên tên tab "Biểu đồ" + kinh nghiệm các trang khác dùng TradingView) là SAI. Đọc trực
tiếp `ChartByNonBank.vue`/`ChartByBank.vue` (không có bất kỳ `<iframe>`/`blob:` URL nào, không dùng thư viện
TradingView) + đo DOM thật (ảnh chụp `.dom-inspect/ptcb-bieudo-nonbank.png` và `ptcb-bieudo-bank.png`) xác nhận:
đây là lưới `CustomEChart` (component dùng chung `stocks/src/views/charts/CustomEchart.vue`, cùng công nghệ với
tab 4M & CANSLIM) hiển thị các chỉ số tài chính theo quý (doanh thu, lợi nhuận, ROA/ROE, định giá PE/PB...) —
khá giống tinh thần biểu đồ "Doanh thu lợi nhuận quý" của app (KHÔNG khác hẳn như suy đoán ban đầu), chỉ khác là
web hiển thị NHIỀU biểu đồ cùng lúc thay vì 1. **Bài học:** đề bài/ghi chú trước đó dựa trên suy luận từ tên tab
mà chưa đọc source — luôn ưu tiên đọc source + DOM thật trước khi viết testcase, đúng nguyên tắc đã đúc kết ở
tab 4M & CANSLIM.

**#1. [BUG THẬT] Race condition `nhom_stockcode`: mã ngân hàng luôn mount NHẦM `ChartByNonBank` trước, gọi sai
API (trả 500), rồi mới tự chuyển đúng.** Xác nhận 100% qua automation (xem TC_PTCB_BD_03): deep-link
`/phan-tich-co-ban?mack=VCB&tab=bieu-do` (VCB là mã ngân hàng) khiến CẢ 2 request sau đều được gửi:
`GET /api/stocks/chart/nonbank?mack=VCB` (SAI, trả **500 Internal Server Error**) VÀ
`GET /api/stocks/chart/bank?...mack[]=VCB` (ĐÚNG). Nguyên nhân: `nhom_stockcode` (computed trong `index.vue`)
là `undefined` lúc mount đầu vì đọc `store.state.list_mack_company[stockcode]?.nhom` — state này nạp BẤT ĐỒNG
BỘ qua socket `TheContainer.getAllMack()` (CÙNG CƠ CHẾ đã gây bug race condition ở tab So Sánh, xem
`phan-tich-co-ban-so-sanh.md` TC_PTCB_SS_02). Template dùng `v-if="nhom_stockcode != 'bank'"` cho
`ChartByNonBank` — đây là fallback AN TOÀN cho mã THƯỜNG (`undefined != 'bank'` luôn `true`, hiển thị đúng ngay
từ đầu, xem TC_PTCB_BD_10 xác nhận HPG KHÔNG bị ảnh hưởng) nhưng lại khiến MÃ NGÂN HÀNG luôn mount nhầm component
trước. **Khác bug So Sánh ở điểm quan trọng: `nhom_stockcode` là 1 computed REACTIVE (không phải giá trị tính 1
lần lúc `created()` như `type_mack` của Compare) nên TỰ CHUYỂN ĐÚNG sang `ChartByBank` ngay khi
`list_mack_company` nạp xong, KHÔNG cần người dùng thao tác gì thêm** — vẫn tốn 1 request lãng phí + lỗi 500 mỗi
lần, và (xem #2) trigger luôn bug #2 vì `ChartByBank` phải mount lại.

**#2. [BUG THẬT] `ChartByBank` luôn phát sinh đúng 2 lỗi JS console mỗi lần mount — không phải chỉ khi lỗi
mạng.** Xác nhận 100% qua automation (deep-link LẪN đổi mã CK qua search, xem TC_PTCB_BD_04/05):
`ChartByBank.data()` chỉ khởi tạo 4/11 key của `options_bank` (`hqttm`, `ldrq`, `tnttm`, `tsq`), nhưng template
đọc `options_bank['pe_pb'].series.length > 0` và `options_bank['llr'].series.length > 0` NGAY LẦN RENDER ĐẦU
TIÊN (Vue mount đồng bộ, XẢY RA TRƯỚC khi `axios.get(.../chart/bank)` kịp resolve) → 2 khoá `pe_pb`/`llr` chưa
tồn tại trên object → `undefined.series` → đúng 2 `TypeError: Cannot read properties of undefined (reading
'series')` mỗi lần. Đã xác nhận tái hiện ở CẢ 2 kịch bản: deep-link/F5 trực tiếp VÀ đổi mã CK từ mã thường sang
mã ngân hàng qua ô search (SPA, không reload trang) — hoàn toàn ĐỘC LẬP với bug #1 (dù bug #1 làm tăng tần suất
xảy ra vì buộc `ChartByBank` phải mount thêm 1 lần). Trang vẫn TỰ HỒI PHỤC hiển thị đúng sau khi API resolve
(không trống vĩnh viễn như bug So Sánh — xác nhận qua ảnh chụp DOM thật sau khi tải xong đầy đủ 11 card), nhưng
lỗi console vẫn phát sinh thật, có thể bị hệ thống theo dõi lỗi (Sentry...) ghi nhận nhiễu. **Khuyến nghị báo
dev:** khởi tạo đủ 11 key (bao gồm `pe_pb`, `llr`, `bar`, `radar`, heatmap-related...) với giá trị mặc định
`{series: []}` trong `data()`.

## Nhóm: Tổng quan theo nhóm mã CK

# [TC_PTCB_BD_01] Overview mã thường (non-bank) — lưới 10 biểu đồ tài chính

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Quan sát được với mã HPG (thép): 10 `<CCard>`, mỗi card 1 biểu đồ ECharts với tiêu đề riêng
  (Doanh thu lợi nhuận quý, Biên lợi nhuận quý, Hiệu suất hoạt động - TTM, Khả năng thanh toán - TTM, Lưu chuyển
  tiền quý, Phân rã ROA - TTM, Phân rã ROE - TTM, Tài sản quý, Nguồn vốn quý, Định giá). Số lượng/loại chart cụ
  thể phụ thuộc dữ liệu API trả về theo từng mã/ngành (VD chart "3 lằn ranh đỏ" chỉ xuất hiện với 1 số ngành
  nhất định) — không hard-code giả định danh sách này đúng cho MỌI mã, chỉ xác nhận đúng cấu trúc chung (lưới
  card, mỗi card 1 canvas). KHÔNG có nút "Thêm mã" (khác `ChartByBank`).

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=HPG&tab=bieu-do`.

## Kết quả mong đợi
- [ ] Hiển thị lưới nhiều `<CCard>`, mỗi card có 1 canvas biểu đồ (visible, kích thước hợp lý).
- [ ] KHÔNG có nút "Thêm mã" ở khu vực này.

---

# [TC_PTCB_BD_02] Overview mã ngân hàng (bank) — radar tổng hợp + lưới 10 biểu đồ + nút "Thêm mã"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Quan sát được với mã VCB: 11 `<CCard>` (1 radar tổng hợp CIR/ROA/ROE/NIM/CASA/NPL/CAR... + 10
  biểu đồ: Tài sản quý, LDR quý, 1 biểu đồ cột giá trị đơn, Hiệu quả TTM, Thu nhập TTM, biểu đồ bubble so sánh
  ngân hàng (kèm `CSelect` bộ lọc "HUY ĐỘNG VỐN"/"TỔNG TÀI SẢN"/...), Nợ xấu ngành, Nợ xấu từng ngân hàng (kèm
  `CSelect` bộ lọc "NỢ NHÓM 3"/.../"TỔNG NỢ XẤU"), Định giá PE/PB, Tỷ lệ bao nợ xấu LLR) + nút "Thêm mã" góc
  trên phải (KHÁC `ChartByNonBank` — chỉ mã ngân hàng mới có nút này, mở modal thêm mã ngân hàng khác để so
  sánh trên biểu đồ radar/1 số biểu đồ).

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=VCB&tab=bieu-do`.
2. Chờ trang tải xong hoàn toàn (qua bug #1/#2, xem nhóm riêng bên dưới).

## Kết quả mong đợi
- [ ] Hiển thị 11 `<CCard>` (radar tổng hợp + 10 biểu đồ tài chính ngân hàng), mỗi card có canvas visible.
- [ ] Nút "Thêm mã" hiển thị ở góc trên phải khu vực biểu đồ.
- [ ] 2 `<select>` bộ lọc (biểu đồ bubble + biểu đồ nợ xấu từng ngân hàng) hiển thị đúng danh sách option.

---

## Nhóm: Bug thật — race condition chọn nhầm component & lỗi console khi mount ChartByBank

# [TC_PTCB_BD_03] [BUG] Deep-link mã ngân hàng luôn mount nhầm ChartByNonBank trước, gọi sai API (500), tự chuyển đúng sau

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, PHÁT HIỆN BUG THẬT: Pass (test xác nhận đúng
  hành vi lỗi)**
- **⚠️ Phát hiện đáng chú ý (bug thật):** xem phân tích đầy đủ ở mục #1 đầu tài liệu. Tóm tắt: deep-link vào mã
  ngân hàng (VCB) khiến CẢ 2 request được gửi: `GET /api/stocks/chart/nonbank?mack=VCB` (SAI, đo được trả **500
  Internal Server Error**) VÀ `GET /api/stocks/chart/bank?...mack[]=VCB` (ĐÚNG). Khác bug So Sánh: tự phục hồi
  đúng component KHÔNG CẦN thao tác thủ công (do `nhom_stockcode` là computed reactive), nhưng vẫn tốn 1 request
  lãng phí + lỗi 500 mỗi lần.

## Các bước thực hiện
1. Đăng nhập, điều hướng thẳng `/phan-tich-co-ban?mack=VCB&tab=bieu-do` (1 lượt `page.goto`, theo dõi network).
2. Chờ trang tải xong hoàn toàn.

## Kết quả mong đợi (hành vi THẬT — bug)
- [ ] Request `GET /api/stocks/chart/nonbank?mack=VCB` VẪN được gửi đi (nhầm), dù VCB là mã ngân hàng.
- [ ] Request `GET /api/stocks/chart/bank?...mack[]=VCB` cũng được gửi đi (đúng).
- [ ] Sau khi tải xong, giao diện hiển thị ĐÚNG `ChartByBank` (radar + nút "Thêm mã"), không phải giao diện mã
      thường — tự phục hồi mà KHÔNG cần thao tác gì thêm.

---

# [TC_PTCB_BD_04] [BUG] ChartByBank luôn phát sinh 2 lỗi console TypeError mỗi lần mount qua deep-link

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, PHÁT HIỆN BUG THẬT: Pass (test xác nhận đúng
  hành vi lỗi)**
- **⚠️ Phát hiện đáng chú ý (bug thật):** xem phân tích đầy đủ ở mục #2 đầu tài liệu. `options_bank['pe_pb']`/
  `['llr']` chưa được khởi tạo trong `data()`, template đọc `.series.length` ngay lần render đầu → 2
  `TypeError: Cannot read properties of undefined (reading 'series')` mỗi lần, đo được ỔN ĐỊNH (không ngẫu
  nhiên) qua nhiều lần chạy lại.

## Các bước thực hiện
1. Đăng nhập, gắn listener bắt lỗi console TRƯỚC khi điều hướng.
2. Điều hướng thẳng `/phan-tich-co-ban?mack=VCB&tab=bieu-do`, chờ vài giây.

## Kết quả mong đợi (hành vi THẬT — bug)
- [ ] Có ĐÚNG 2 console error chứa `"Cannot read properties of undefined (reading 'series')"`.
- [ ] Sau khi API resolve, trang vẫn tự hồi phục hiển thị đầy đủ 11 card (không crash vĩnh viễn/trống trắng).

---

# [TC_PTCB_BD_05] [BUG] Lỗi console tương tự TC_PTCB_BD_04 tái hiện khi đổi mã CK qua search (không cần reload)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, PHÁT HIỆN BUG THẬT: Pass**
- **⚠️ Phát hiện đáng chú ý:** Xác nhận bug #2 KHÔNG PHỤ THUỘC deep-link/F5 — mọi lần `ChartByBank` MOUNT MỚI
  (kể cả điều hướng SPA bình thường: đang xem mã thường, đổi qua ô search sang mã ngân hàng) đều phát sinh y hệt
  2 lỗi console này, vì nguyên nhân gốc (thiếu khởi tạo `pe_pb`/`llr` trong `data()`) không liên quan gì tới
  cách vào trang.

## Các bước thực hiện
1. Đăng nhập, điều hướng `/phan-tich-co-ban?mack=HPG&tab=bieu-do` (mã thường), chờ tải xong.
2. Gắn listener bắt lỗi console.
3. Gõ và chọn "VCB" qua ô tìm kiếm "Mã CK".

## Kết quả mong đợi (hành vi THẬT — bug)
- [ ] Có ĐÚNG 2 console error chứa `"Cannot read properties of undefined (reading 'series')"` sau bước 3.
- [ ] Giao diện vẫn chuyển đúng sang `ChartByBank` (11 card) sau khi lỗi phát sinh.

---

## Nhóm: Loading

# [TC_PTCB_BD_06] Loading spinner khi tải chậm (mã thường)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `options_nonbank_is_loading` mặc định `true`, hiện `CElementCover` + `CSpinner` (`role="status"`)
  che toàn bộ vùng biểu đồ cho tới khi `getAllChartNonBank()` resolve/reject.

## Các bước thực hiện
1. Mock `GET .../api/stocks/chart/nonbank` delay 3 giây trước khi trả kết quả thật.
2. Vào tab "Biểu đồ" với mã thường (HPG), quan sát ngay sau khi vào.

## Kết quả mong đợi
- [ ] Trong lúc chờ: spinner loading hiển thị, chưa có card biểu đồ nào.
- [ ] Sau khi response về: loading biến mất, lưới biểu đồ hiện đầy đủ.

---

# [TC_PTCB_BD_07] Loading spinner khi tải chậm (mã ngân hàng)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `options_bank_is_loading` mặc định `true`, hiện `CElementCover` + `CSpinner`; nút "Thêm mã" +
  logo cũng ẩn trong lúc loading (`v-if="!options_bank_is_loading"` cho khối nút, riêng logo `.p-logo-slim` LUÔN
  hiện không phụ thuộc loading).

## Các bước thực hiện
1. Mock `GET .../api/stocks/chart/bank` delay 3 giây trước khi trả kết quả thật.
2. Vào tab "Biểu đồ" với mã ngân hàng (VCB), quan sát ngay sau khi vào.

## Kết quả mong đợi
- [ ] Trong lúc chờ: spinner loading hiển thị, logo vẫn hiện, nút "Thêm mã" CHƯA hiện.
- [ ] Sau khi response về: loading biến mất, nút "Thêm mã" + lưới biểu đồ hiện đầy đủ.

---

## Nhóm: Lỗi mạng

# [TC_PTCB_BD_08] Mất mạng khi tải biểu đồ mã thường không crash thêm, không có chart nào hiển thị

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `getAllChartNonBank().catch()` set `options_nonbank = {}` (object rỗng, không phải mảng) — `v-for`
  trên object rỗng render 0 phần tử, KHÔNG throw lỗi (khác `ChartByBank` — xem bug #2, vốn lỗi xảy ra bất kể
  mạng có lỗi hay không vì đọc trực tiếp key cụ thể chứ không lặp qua object).

## Các bước thực hiện
1. Chặn `GET .../api/stocks/chart/nonbank` (`route.abort()`).
2. Vào tab "Biểu đồ" với mã thường (HPG).

## Kết quả mong đợi
- [ ] Không có card biểu đồ nào hiển thị, loading tắt sau vài giây.
- [ ] Không phát sinh lỗi console MỚI nào ngoài lỗi mạng dự kiến (không có `TypeError` liên quan render).

---

# [TC_PTCB_BD_09] Mất mạng khi tải biểu đồ mã ngân hàng không có chart nào hiển thị (ngoài bug #2 luôn có)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `getAllChartBank().catch()` set `options_bank = {}` — sau đó `options_bank['tsq']`/mọi key khác
  đều `undefined`, nghĩa là CÁC `v-if="options_bank['x'].series.length > 0"` khác (`tsq`, `ldrq`, `hqttm`,
  `tnttm`, `pe_pb`, `llr`) đều throw lỗi tương tự bug #2 khi bị đọc lại — vẫn chỉ dừng ở KHÔNG hiển thị card nào
  (không crash trắng toàn trang), nhất quán với hành vi tự hồi phục ở bug #2.

## Các bước thực hiện
1. Chặn `GET .../api/stocks/chart/bank` (`route.abort()`, KHÔNG chặn `.../chart/bank/scatter`).
2. Vào tab "Biểu đồ" với mã ngân hàng (VCB).

## Kết quả mong đợi
- [ ] Không có card biểu đồ dữ liệu nào (`tsq`/`ldrq`/`hqttm`/`tnttm`/`pe_pb`/`llr`) hiển thị.
- [ ] Trang không trắng hoàn toàn (header/logo/nút "Thêm mã" vẫn còn), loading tắt sau vài giây.

---

## Nhóm: Đổi mã CK

# [TC_PTCB_BD_10] Đổi mã CK cùng nhóm (thường → thường) tải lại đúng dữ liệu, KHÔNG có race condition

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, xác nhận KHÔNG có bug: Pass**
- **Ghi chú:** Deep-link thẳng vào mã THƯỜNG (HPG) không kích hoạt bug #1 (chỉ xảy ra với mã ngân hàng) —
  `ChartByNonBank` hiển thị đúng ngay từ đầu, không cần thao tác gì thêm để "sửa" dữ liệu (khác hẳn tab So
  Sánh).

## Các bước thực hiện
1. Deep-link thẳng `/phan-tich-co-ban?mack=HPG&tab=bieu-do` (1 lượt `page.goto`, không thao tác gì thêm).

## Kết quả mong đợi
- [ ] Ngay sau khi trang tải xong, lưới biểu đồ hiện đúng dữ liệu (canvas visible), không cần đổi mã CK để
      "sửa" như bug tab So Sánh.
- [ ] Request `GET .../chart/bank` KHÔNG được gửi đi (mã thường không gọi nhầm API ngân hàng).

---

# [TC_PTCB_BD_11] Đổi mã CK khác nhóm (thường → ngân hàng) chuyển đúng loại biểu đồ

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** `ChartByNonBank`/`ChartByBank` toggle bằng `v-if` (không phải `v-show`) nên đổi mã khác nhóm sẽ
  UNMOUNT hẳn component cũ và MOUNT MỚI component đúng — đây chính là lý do bug #2 (2 lỗi console) tái hiện ở
  tình huống này (xem TC_PTCB_BD_05).

## Các bước thực hiện
1. Vào tab "Biểu đồ" với mã thường (HPG) — xác nhận không có nút "Thêm mã".
2. Gõ và chọn "VCB" qua ô tìm kiếm "Mã CK".

## Kết quả mong đợi
- [ ] Sau khi đổi mã, giao diện chuyển đúng sang `ChartByBank`: xuất hiện radar tổng hợp + nút "Thêm mã".
- [ ] Request `GET .../chart/bank?...mack[]=VCB` được gửi đi.

---

## Nhóm: Giới hạn theo gói hội viên (Free) — per-widget gating

# [TC_PTCB_BD_12] Free: hầu hết biểu đồ mã thường bị che, TRỪ "Tài sản quý"/"Nguồn vốn quý"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **⚠️ Phát hiện đáng chú ý:** Gate này dùng `$store.state.isAccountFree` + `v-if="... &&
  !['Tài sản quý','Nguồn vốn quý'].includes(item.title.text)"` — HOÀN TOÀN ĐỘC LẬP với gate cấp shell
  `features_disabled['fa_bieu_do_tc_nonbank_stock_insurance']` (đã đo KHÔNG khoá tab "Biểu đồ" cho tài khoản Free
  hiện tại, xem `phan-tich-co-ban.md` TC_PTCB_17). Kết quả đo thật (mã HPG, 10 chart tổng): **8/10 chart bị
  `UpdateRequire` che**, CHỈ 2 chart "Tài sản quý"/"Nguồn vốn quý" hiển thị bình thường — cùng pattern gating
  "nhiều cấp trong 1 trang" đã ghi nhận ở "So sánh" (TC_PTCB_SS_05) và "4M & CANSLIM" (TC_PTCB_16).

## Các bước thực hiện
1. Đăng nhập tài khoản Free (`FREE_USER_EMAIL`/`FREE_USER_PASSWORD`).
2. Vào tab "Biểu đồ" với mã thường (HPG).

## Kết quả mong đợi
- [ ] Đúng 8 khối "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này" hiển thị (8/10 chart bị che).
- [ ] 2 chart còn lại (không bị che) hiển thị canvas bình thường.

---

# [TC_PTCB_BD_13] Free: hầu hết biểu đồ mã ngân hàng bị che, TRỪ "Tài sản quý" (`tsq`)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** Đọc `ChartByBank.vue`, DUY NHẤT chart `tsq` (CCol chứa `options_bank['tsq']`) KHÔNG có
  `UpdateRequire` bao quanh (10 chart còn lại — radar, ldrq, bar, hqttm, tnttm, bubble, no_xau_nganh,
  no_xau_tung_ngan_hang, pe_pb, llr — đều CÓ `UpdateRequire` riêng khi `isAccountFree`). Đo thật (mã VCB, 11 card
  tổng): **10/11 chart bị che**, đúng 1 chart "Tài sản quý" hiển thị bình thường.

## Các bước thực hiện
1. Đăng nhập tài khoản Free.
2. Vào tab "Biểu đồ" với mã ngân hàng (VCB).

## Kết quả mong đợi
- [ ] Đúng 10 khối "Bạn cần nâng cấp gói hội viên để sử dụng chức năng này" hiển thị.
- [ ] Chart "Tài sản quý" hiển thị canvas bình thường, KHÔNG bị che.
- [ ] Nút "Thêm mã" vẫn hiển thị bình thường (không thuộc phạm vi gate per-chart).

---

# [TC_PTCB_BD_14] Click "Nâng cấp ngay" trên 1 card bị gate mở modal nâng cấp gói

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation với tài khoản Free thật: Pass**
- **Ghi chú:** `UpdateRequire` dùng chung component với "So sánh"/"4M & CANSLIM" — click nút "Nâng cấp ngay" mở
  modal nâng cấp gói dùng chung toàn site, ngoài phạm vi POM tab này.

## Các bước thực hiện
1. Đăng nhập tài khoản Free, vào tab "Biểu đồ" (mã bất kỳ).
2. Click nút "Nâng cấp ngay" đầu tiên trên 1 card bị che.

## Kết quả mong đợi
- [ ] 1 modal mới xuất hiện (`role="dialog"`).

---

## Nhóm: Modal "Thêm mã" (CHỈ có ở mã ngân hàng)

# [TC_PTCB_BD_15] Mở modal "Thêm mã" hiển thị đúng cấu trúc

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Modal cùng tiêu đề "Nhập dữ liệu" như modal "Thêm mã" tab So Sánh nhưng cấu trúc khác — thêm 2
  trường "Quý" (`CSelect` giá trị 1-4) và "Năm" (`CInput` text) để chọn kỳ báo cáo khi so sánh nhiều mã ngân
  hàng. Sau lần tải đầu tiên, "Quý"/"Năm" tự điền theo kỳ mới nhất server trả về (VD "2"/"2026" khi header hiện
  "BCTC Mới - Q2 2026").

## Các bước thực hiện
1. Vào tab "Biểu đồ" với mã ngân hàng (VCB), chờ tải xong.
2. Click nút "Thêm mã".

## Kết quả mong đợi
- [ ] Modal "Nhập dữ liệu" hiện ra, gồm: input "Mã CK", select "Quý" (option 1-4, đã chọn đúng quý mới nhất),
      input "Năm" (đã điền đúng năm mới nhất), tiêu đề "Danh sách mã" (dòng đầu = mã đang xem VCB), 2 nút footer
      "Đóng"/"Lưu".

---

# [TC_PTCB_BD_16] Gõ mã hợp lệ hiện gợi ý, chọn thêm vào "Danh sách mã"

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 174 (Sheet, tương tự luồng "thêm mã" ở tab So sánh của app)

## Các bước thực hiện
1. Mở modal "Thêm mã" (mã ngân hàng VCB).
2. Gõ "bid" vào ô "Mã CK" trong modal.
3. Chọn gợi ý "BID".

## Kết quả mong đợi
- [ ] Gợi ý "BID" hiện ra khi gõ.
- [ ] "Danh sách mã" có thêm dòng "BID", ô input tự xoá về rỗng.

---

# [TC_PTCB_BD_17] Gõ mã không tồn tại trong modal không ra gợi ý nào

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Mở modal "Thêm mã".
2. Gõ "ZZZZZZ999" vào ô "Mã CK" trong modal.

## Kết quả mong đợi
- [ ] Không có gợi ý nào hiển thị.

---

# [TC_PTCB_BD_18] Mã đang xem trong "Danh sách mã" không có icon xoá (khác mã đã thêm)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Ghi chú:** Cùng pattern đã ghi nhận ở tab So Sánh (TC_PTCB_SS_12) — dòng mã đang xem nằm NGOÀI
  `<draggable>`, ô cuối rỗng không `@click`; dòng mã đã thêm nằm TRONG `<draggable>`, có icon `cilXCircle`
  `@click="removeAt(index)"`.

## Các bước thực hiện
1. Mở modal "Thêm mã", thêm mã "BID".
2. So sánh số icon `.handle` giữa dòng mã đang xem (VCB) và dòng mã đã thêm (BID).

## Kết quả mong đợi
- [ ] Dòng "BID" (mã đã thêm) có nhiều icon `.handle` hơn dòng "VCB" (mã đang xem) — icon xoá chỉ có ở dòng đã
      thêm.

---

# [TC_PTCB_BD_19] Xoá mã khỏi "Danh sách mã" bằng icon

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC 175 (Sheet)

## Các bước thực hiện
1. Mở modal "Thêm mã", thêm mã "BID".
2. Click icon xoá cạnh "BID".

## Kết quả mong đợi
- [ ] "BID" biến mất khỏi "Danh sách mã".

---

# [TC_PTCB_BD_20] Đổi Quý/Năm rồi "Lưu" gửi đúng tham số trong request

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (đo network thật): Pass**
- **Kết quả đo được:** Chọn lại option thứ 3 trong select "Quý" (giá trị "3") rồi "Lưu" (Năm giữ nguyên "2026"
  tự điền từ trước) → request thật gửi đi: `GET .../chart/bank?quarter=3&year=2026&mack[]=VCB&token=...` — xác
  nhận đúng tham số `quarter`/`year` phản ánh lựa chọn trong modal.

## Các bước thực hiện
1. Mở modal "Thêm mã" (mã ngân hàng VCB, đã tải xong lần đầu).
2. Đổi select "Quý" sang giá trị khác (VD "3").
3. Click "Lưu", theo dõi network.

## Kết quả mong đợi
- [ ] Modal đóng lại, request `GET .../chart/bank` được gửi kèm đúng `quarter` vừa chọn.
- [ ] Biểu đồ refresh theo dữ liệu quý mới (không lỗi console mới ngoài bug #2 đã ghi nhận).

---

# [TC_PTCB_BD_21] Kéo-thả sắp xếp lại thứ tự mã trong "Danh sách mã"

- **Trạng thái:** ⚠️ Cần xác nhận thêm — **`test.fixme`, chưa tự động hoá**
- **Lý do chưa tự động hoá:** Danh sách dùng `vuedraggable` (Sortable.js, không phải chuẩn HTML5 Drag & Drop
  API) — CÙNG hạn chế đã ghi nhận ở tab So Sánh (`TC_PTCB_SS_15`) và Bảng Giá (`TC_BANGGIA_37`). Cần thêm thời
  gian thử nghiệm `mouse.move` nhiều bước nhỏ để trigger đúng sự kiện thư viện này.

## Các bước thực hiện (dự kiến)
1. Mở modal "Thêm mã" với ≥ 2 mã đã thêm.
2. Kéo 1 dòng mã lên trên dòng khác.

## Kết quả mong đợi (dự kiến)
- [ ] Thứ tự trong "Danh sách mã" đổi theo đúng thao tác kéo-thả.

---

## Nhóm: Dark mode

# [TC_PTCB_BD_22] Chuyển dark mode không crash, đổi logo (chỉ mã ngân hàng có logo riêng)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (đo thật `src` ảnh): Pass**
- **Kết quả đo được:** `.p-logo-img-slim` (CHỈ `ChartByBank` có, `ChartByNonBank` không có logo riêng nào) đổi
  `src` từ `/img/logo-stocks-new-dark.png` (light mode mặc định) sang `/img/logo-stocks-new.png` (dark mode) —
  tên file NGƯỢC trực giác (file có hậu tố "-dark" lại dùng cho LIGHT mode), CÙNG PATTERN đã ghi nhận ở tab 4M &
  CANSLIM (`TC_PTCB_4M_18`).

## Các bước thực hiện
1. Vào tab "Biểu đồ" với mã ngân hàng (VCB) ở light mode mặc định, ghi nhận `src` logo.
2. Toggle sang dark mode.

## Kết quả mong đợi
- [ ] `src` logo đổi đúng theo mode (khác giá trị ban đầu).
- [ ] Không có lỗi JS console mới, biểu đồ vẫn hiển thị đầy đủ.

---

## Nhóm: Responsive

# [TC_PTCB_BD_23] Responsive viewport mobile/tablet

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Chuẩn bị tab có dữ liệu (mã thường HPG).
2. Thu nhỏ viewport xuống mobile (375x812) rồi tablet (768x1024).

## Kết quả mong đợi
- [ ] Lưới biểu đồ tự xếp lại (1 cột trên mobile, ít cột hơn trên tablet — CSS `xl="4" lg="6"` của CoreUI),
      không vỡ layout nghiêm trọng.

---

## Tổng hợp trạng thái (23 testcase)

Đã tự động hoá bằng Playwright:
[tests/phan-tich-co-ban-bieu-do.spec.ts](../tests/phan-tich-co-ban-bieu-do.spec.ts) (POM: section "Tab Biểu đồ"
trong [pages/FaAnalysisPage.ts](../pages/FaAnalysisPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 2 | TC_PTCB_BD_16, 19 |
| 🆕 Mới (riêng web) | 20 | TC_PTCB_BD_01-15, 17, 18, 20, 22, 23 |
| ⚠️ Cần xác nhận thêm | 1 | TC_PTCB_BD_21 (`test.fixme` — kéo-thả `vuedraggable`, chưa tìm được cách giả lập ổn định) |

**Phát hiện đáng chú ý cần theo dõi:**
1. **[ĐÍNH CHÍNH] Tab "Biểu đồ" KHÔNG dùng TradingView candlestick** như suy đoán ban đầu trong đề bài — là lưới
   nhiều biểu đồ ECharts tài chính (cùng công nghệ `CustomEChart` với tab 4M & CANSLIM). Xác nhận qua đọc source
   (không có `<iframe>`/`blob:`) + đo DOM thật. Bài học lặp lại: luôn verify qua source/DOM thật, đừng suy luận
   từ tên tab.
2. **[BUG THẬT #1] Race condition `nhom_stockcode`:** mã ngân hàng luôn mount NHẦM `ChartByNonBank` trước (gọi
   sai API, trả 500) rồi mới tự chuyển đúng sang `ChartByBank` — xem TC_PTCB_BD_03. KHÁC bug tab So Sánh ở điểm
   quan trọng: TỰ PHỤC HỒI không cần thao tác thủ công (do `nhom_stockcode` computed reactive, không phải giá
   trị tính 1 lần), nhưng vẫn gây 1 request lãng phí + lỗi 500 mỗi lần deep-link/F5/đổi mã sang mã ngân hàng.
3. **[BUG THẬT #2] `ChartByBank` luôn phát sinh đúng 2 lỗi console `TypeError` mỗi lần mount** (deep-link LẪN
   đổi mã CK qua search) do `options_bank['pe_pb']`/`['llr']` chưa khởi tạo trong `data()` nhưng bị đọc
   `.series.length` ngay lần render đầu — xem TC_PTCB_BD_04/05. Độc lập với bug #1, KHÔNG phải chỉ xảy ra khi
   lỗi mạng. Khuyến nghị báo dev khởi tạo đủ toàn bộ 11 key trong `data()`.
4. **Gating "Biểu đồ" hoạt động ở NHIỀU CẤP khác nhau, per-chart CHỨ KHÔNG PHẢI per-tab:** cấp shell
   (`features_disabled['fa_bieu_do_tc_bank']`/`['fa_bieu_do_tc_nonbank_stock_insurance']`, đã đo KHÔNG khoá tài
   khoản Free hiện tại — TC_PTCB_17) và cấp widget riêng của TỪNG CHART con (`$store.state.isAccountFree`,
   TC_PTCB_BD_12/13) — mã thường có 2/10 chart miễn phí ("Tài sản quý"/"Nguồn vốn quý"), mã ngân hàng chỉ có
   1/11 chart miễn phí ("Tài sản quý"). Cùng pattern gating "nhiều cấp" đã ghi nhận ở "So sánh" và "4M & CANSLIM".
5. **Chỉ mã ngân hàng mới có nút "Thêm mã"** (mở modal so sánh nhiều mã ngân hàng cùng lúc trên biểu đồ radar
   + chọn kỳ báo cáo Quý/Năm) — `ChartByNonBank` (mã thường) hoàn toàn không có tính năng này.
6. **Kéo-thả trong modal "Thêm mã" chưa tự động hoá được** (TC_PTCB_BD_21, `test.fixme`) — cùng hạn chế kỹ
   thuật `vuedraggable` đã ghi nhận ở tab So Sánh và Bảng Giá.
