# Màn hình: Toàn cảnh thị trường > Bộ lọc cổ phiếu

- **URL:** `/bo-loc` (route con của `/`, `TheContainer`, yêu cầu đăng nhập — `meta.requiresUser`). Là 1 trong 3
  màn con của menu header "Toàn cảnh thị trường" (cùng `/nganh` — "Ngành", `/suc-manh-dong-tien` — "Sức mạnh
  dòng tiền"; 2 màn kia có file testcase riêng, không thuộc phạm vi tài liệu này).
- **Component:** [src/views/ibd/index.vue](../../stocks/src/views/ibd/index.vue) (`props.type = "stock"`) →
  [src/views/ibd/reactLayoutIBD.js](../../stocks/src/views/ibd/reactLayoutIBD.js) (React, `flexlayout-react`,
  giống khung layout dùng chung với `/bang-gia`/`/nganh`) →
  [src/views/ibd/wrapperLayout.vue](../../stocks/src/views/ibd/wrapperLayout.vue) dòng 30 (
  `<FilterCanslim v-if="type == 'stock'" .../>`) →
  **[src/views/filterCanslim/index.vue](../../stocks/src/views/filterCanslim/index.vue)** (3571 dòng, tên nội bộ
  `FilerCanslimV2`) — đây mới là component thật sự của "Bộ lọc cổ phiếu", cùng
  [src/views/filterCanslim/DataTable.vue](../../stocks/src/views/filterCanslim/DataTable.vue) (bảng kết quả,
  1949 dòng) và các file cấu hình JSON `inputConfig.json`/`defaultConfig.json`/`disableCriterias.json`/
  `droplistOptions.json`.
  - **Lưu ý quan trọng đã loại trừ khi điều tra:** thư mục `src/views/ibd/stock/liveBoard/` (chartIndex.js,
    listBoard.js, headerLiveBoard.js...) **KHÔNG** thuộc màn này — đó là màn "Bảng giá" (`type == 'price-board'`,
    đã test ở [bang-gia.md](bang-gia.md)). Cũng có 1 bản "Bộ lọc cổ phiếu" legacy khác tại
    `src/views/pages/FilterCanslim.vue` (style CoreUI cũ) chỉ dùng trong nhánh `type=='ibd'` (không phải route
    `/bo-loc` trực tiếp) — không thuộc phạm vi tài liệu này.
  - Vùng tabset giữa chỉ có 1 tab "Bộ lọc cổ phiếu" (giống cơ chế `tabSetEnableTabStrip: false` đã ghi nhận ở
    Bảng giá), vùng border phải hiển thị panel "IBD KungfuStocksPro" — quan sát thực tế chỉ có **6 tab dọc**
    (IBD, Thông tin, Watchlist, Cảnh báo, Ghi chú, Cộng đồng), **không có** "Bài viết"/"Chatbot" như ở `/bang-gia`
    (8 tab) — khác biệt đáng ghi nhận, không rõ chủ đích hay do cấu hình border layout khác nhau giữa 2 route.
- **Domain test:** https://kfsp.vn/bo-loc
- **Nguồn testcase gốc (app):** Google Sheet, tab "Bộ Lọc" (68 dòng). App là màn hình mobile hoàn toàn khác kiến
  trúc: icon back, thanh mẫu KFSP cuộn ngang, tab tiêu chí ngang (Biến động giá/Phạm vi giá/Thanh khoản/Chỉ báo
  KT/KFSP), bảng kết quả + bottom action, màn "Sửa bộ lọc" riêng (nhóm collapse + badge số tiêu chí) và màn "Chọn
  tiêu chí lọc" riêng (modal full-screen). Web dùng **đúng 1 màn hình duy nhất** (`filterCanslim/index.vue`) gộp
  cả 3 khái niệm trên app (Bộ lọc + Sửa bộ lọc + Chọn tiêu chí) thành 1 trang desktop: toàn bộ tiêu chí luôn hiển
  thị trực tiếp trên trang (không cần vào màn "Sửa bộ lọc" riêng để thấy), việc "thêm/bớt tiêu chí" là 1 modal
  overlay ("Tùy chỉnh tiêu chí") thay vì 1 màn hình full-screen riêng. Nhiều case tương ứng ý tưởng (chọn mẫu
  KFSP, sort bảng, xoá/thêm tiêu chí, badge số tiêu chí, khoá tiêu chí Pro cho tài khoản Free, click mã CK) gắn
  được `Tham chiếu App`; phần lớn còn lại là 🆕 vì web có kiến trúc/luồng khác hẳn (modal tiêu chí kéo-thả, danh
  sách mẫu lọc **cá nhân đã lưu** riêng biệt với thanh mẫu KFSP công khai, xuất Excel, polling tự động trong giờ
  giao dịch...).
- **Phương pháp sinh:** Đọc source code (router, `index.vue`/`reactLayoutIBD.js`/`wrapperLayout.vue`, toàn bộ
  `src/views/filterCanslim/` — `index.vue`, `DataTable.vue`, `inputConfig.json`, `defaultConfig.json`,
  `disableCriterias.json`, các component con `FilterTemplate.vue`/`SaveChanges.vue`/`WarningFrequencyOptions.vue`
  /`CrownIcon.vue`) + kiểm kê độc lập trên DOM thật (`scripts/inspect-dom.ts`, nhiều lượt `--click`/`--fill` để
  khảo sát modal "Tùy chỉnh tiêu chí", "Tạo bản sao", dropdown mẫu đã lưu, áp dụng mẫu KFSP, autocomplete mã CK,
  trạng thái rỗng thật) + đọc chính xác điều kiện khoá tài khoản Free trong `handleApplyFilter` (dòng 1401-1406)
  và `button_active_status` (dòng 1826-1832) để viết đúng hành vi, không đoán.
- **Quy ước trạng thái:**
  - ✅ Áp dụng — testcase adapt từ app, đã/có thể tự động hoá bằng Playwright.
  - 🆕 Testcase mới — phát sinh riêng cho web.
  - ⚠️ Cần xác nhận thêm — chưa đủ điều kiện kiểm chứng thực tế qua automation.

---

## Nhóm A: Truy cập & tổng quan

# [TC_BOLOC_01] Truy cập `/bo-loc` khi chưa đăng nhập

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Router guard (`meta.requiresUser`) redirect đúng tới
  `https://kfsp.vn/login?redirect=%2Fbo-loc`, giống cơ chế đã verify ở TC_DASHBOARD_02/TC_BANGGIA_01.

## Các bước thực hiện
1. Đảm bảo chưa đăng nhập (xoá `localStorage`/cookie).
2. Truy cập trực tiếp URL `/bo-loc`.

## Kết quả mong đợi
- [ ] Tự động chuyển hướng tới `/login?redirect=%2Fbo-loc`, không hiển thị nội dung Bộ lọc.

---

# [TC_BOLOC_02] Đăng nhập từ redirect quay lại đúng `/bo-loc`

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Từ trạng thái chưa đăng nhập, truy cập `/bo-loc` (bị redirect sang `/login?redirect=%2Fbo-loc`).
2. Đăng nhập thành công.

## Kết quả mong đợi
- [ ] Sau đăng nhập, quay lại đúng `/bo-loc` (không phải `/dashboard` mặc định).

---

# [TC_BOLOC_03] Overview màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_1 (Overview màn Bộ lọc — chỉ tương ứng ý tưởng, layout hoàn toàn khác: web không có icon
  back, gộp thẳng "tiêu chí + kết quả" trên cùng 1 màn thay vì tách "Bộ lọc"/"Sửa bộ lọc" như app)

## Các bước thực hiện
1. Đăng nhập, vào `/bo-loc`.

## Kết quả mong đợi
- [ ] Thanh mẫu KFSP cuộn ngang ở đầu trang (VD "Bậc thầy xu hướng +3.15%", "SEPA...").
- [ ] Dropdown chọn mẫu lọc cá nhân đã lưu (VD "vippro") + 4 nút hành động: "Lưu", "Tạo bản sao", "Tùy chỉnh tiêu
      chí", "Reset giá trị".
- [ ] Các nhóm tiêu chí hiển thị trực tiếp (không cần mở màn riêng): "Thông tin chung", "Cơ bản", "Kỹ thuật",
      "KFSP" — mỗi nhóm có badge số tiêu chí đang hiển thị.
- [ ] Dòng "Kết quả lọc: N mã" + nút refresh + nút "Xuất File Excel".
- [ ] 9 tab nhóm cột: Tiêu chí đã chọn, Thông tin chung, Định giá, Cơ bản, Biến động giá, Phạm vi giá, Thanh
      khoản, Chỉ báo kỹ thuật, KFSP.
- [ ] Bảng kết quả có phân trang (không phải infinite scroll), dòng chú thích "Dữ liệu được cập nhật 1 phút/lần".
- [ ] Panel border phải "IBD KungfuStocksPro" hiển thị 6 tab dọc: IBD, Thông tin, Watchlist, Cảnh báo, Ghi chú,
      Cộng đồng (tab "IBD" active mặc định, nội dung "Tổng quan thị trường chung").

---

# [TC_BOLOC_04] Panel phải "IBD" — chỉ xác nhận hiển thị (đã test sâu ở file khác)

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Nội dung tab "IBD" (Tổng quan thị trường chung, Ngày phân phối...) giống hệt tab IBD đã test kỹ ở
  [dashboard-panel-phai.md](dashboard-panel-phai.md) và [bang-gia.md](bang-gia.md) TC_BANGGIA_40 — chỉ xác nhận
  hiển thị đúng ở đây, không lặp lại chi tiết từng sub-tab ("Nhịp đập TT"/"Nỗ lực - Kết quả"/"Sức khỏe TT"). Khác
  biệt đáng chú ý: panel này ở `/bo-loc` chỉ có 6 tab dọc (không có "Bài viết"/"Chatbot" như `/bang-gia`).

## Các bước thực hiện
1. Quan sát panel border phải.

## Kết quả mong đợi
- [ ] Đủ 6 tab dọc đúng thứ tự: IBD, Thông tin, Watchlist, Cảnh báo, Ghi chú, Cộng đồng.
- [ ] Không có tab "Bài viết"/"Chatbot".

---

## Nhóm B: Mẫu lọc KFSP (thanh mẫu công khai)

# [TC_BOLOC_05] Hiển thị & cuộn ngang thanh mẫu KFSP

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_6, TC_7 (thanh mẫu KFSP cuộn ngang — cùng ý tưởng, app còn có nút "Khám phá thêm >" độc
  lập trong khi web gộp vào cuối thanh cuộn)

## Các bước thực hiện
1. Quan sát thanh mẫu ở đầu trang.
2. Cuộn ngang thanh mẫu.

## Kết quả mong đợi
- [ ] Mỗi mẫu hiển thị tên + hiệu suất 1 tháng (VD "+3.15%"), mẫu Pro có icon khoá/crown.
- [ ] Cuộn được hết toàn bộ 25 mẫu, dòng cuối có text "Khám phá hơn N kết quả bộ lọc khác".
- [ ] Sau khi cuộn, xuất hiện icon mũi tên cuộn lùi ở đầu thanh.

---

# [TC_BOLOC_06] Click mẫu Free áp dụng đúng tiêu chí

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC_3 (chọn mẫu Free — cùng ý tưởng)
- **Kết quả đo được:** Click mẫu "Golden Cross" (`isFree: true`, `defaultConfig.json`) → dropdown mẫu đang chọn
  đổi tên thành "Golden Cross", nhóm tiêu chí đổi đúng theo cấu hình mẫu (VD "Thông tin chung" còn Vốn hoá TT >
  1,000; "Kỹ thuật" hiện SMA50 vs SMA200 = "Cắt lên gần đây", KLTB 20D > 100,000), 9 tab cột cũng đổi theo tiêu
  chí mới, "Kết quả lọc" cập nhật ngay không cần bấm thêm nút nào.

## Các bước thực hiện
1. Click mẫu Free bất kỳ trên thanh mẫu (VD "Golden Cross").

## Kết quả mong đợi
- [ ] Tên mẫu đang áp dụng (dropdown bên trái nút "Lưu") đổi đúng theo mẫu vừa chọn.
- [ ] Toàn bộ nhóm tiêu chí + badge số tiêu chí đổi đúng theo cấu hình mẫu.
- [ ] "Kết quả lọc: N mã" cập nhật theo tiêu chí mới.

---

# [TC_BOLOC_07] Mẫu áp dụng có thể trả về 0 kết quả — trạng thái rỗng

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC_18 (khi không có mã thoả tiêu chí)
- **Cập nhật:** Đổi cách tạo trạng thái rỗng — không dùng mẫu Free "Golden Cross" nữa (phụ thuộc dữ liệu thị
  trường tại thời điểm chạy, không chủ động lặp lại được), mà tự đặt "Vốn hoá TT" > 999.999.999 tỷ VNĐ (ngưỡng
  không thể có thật) để chủ động tạo "0 mã" mọi lúc chạy.
- **Kết quả đo được:** Với ngưỡng trên, "Kết quả lọc: 0 mã", bảng hiển thị đúng "Không có dữ liệu"
  (slot `#no-items-view` của `CDataTable`), không lỗi JS, không vỡ layout.

## Các bước thực hiện
1. Đổi so sánh "Vốn hoá TT" sang "Lớn hơn", nhập `999999999`.

## Kết quả mong đợi
- [ ] "Kết quả lọc: 0 mã".
- [ ] Bảng hiển thị "Không có dữ liệu", không lỗi JS/console.

---

# [TC_BOLOC_08] Click mẫu Pro với tài khoản Free → popup nâng cấp

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (tài khoản `FREE_USER_EMAIL`): Pass**
- **Tham chiếu App:** TC_4 (chọn mẫu Pro với tài khoản Free — cùng ý tưởng)
- **Ghi chú kỹ thuật:** Logic khoá đọc đúng từ `handleApplyFilter` (`index.vue` dòng 1401-1406):
  `isAccountFree && ((!filterToApply.isFree && typeof id !== 'number') || index !== 0)` → mở
  `store.state.isShowModalMembership = true`. Mẫu KFSP công khai không có `isFree: true` rõ ràng trong
  `defaultConfig.json` (VD "SEPA", "Canslim"...) bị chặn cho tài khoản Free.

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free (`FREE_USER_EMAIL`).
2. Click 1 mẫu không có cờ Free rõ ràng (VD "SEPA (Phương pháp của Mark Minervini)").

## Kết quả mong đợi
- [ ] Hiển thị popup/modal yêu cầu nâng cấp gói Pro/VIP (`isShowModalMembership`), tiêu chí KHÔNG bị áp dụng.

---

# [TC_BOLOC_09] "Khám phá hơn N kết quả bộ lọc khác"

- **Trạng thái:** 🆕 Testcase mới — **⚠️ Cần xác nhận thêm**
- **Ghi chú:** Theo code (`index.vue` dòng 202-333), đây là link mở modal `CModalBase` "Mẫu lọc KFSP" liệt kê đầy
  đủ mọi mẫu (card: tên, mô tả, lượt dùng, hiệu suất, nút "Áp dụng", ô tìm kiếm). Khi khảo sát DOM, click bị chặn
  do phần tử nằm cuối thanh cuộn ngang (bị 1 lớp overlay che khi chưa cuộn hết) — chưa chụp được ảnh xác nhận
  trực tiếp. Cần thử lại với thao tác cuộn ngang trước khi click, hoặc xác nhận lại với người dùng.

## Các bước thực hiện
1. Cuộn thanh mẫu KFSP tới cuối.
2. Click text "Khám phá hơn N kết quả bộ lọc khác".

## Kết quả mong đợi
- [ ] Mở modal "Mẫu lọc KFSP" liệt kê đầy đủ các mẫu dạng card + ô tìm kiếm.

---

## Nhóm C: Bộ lọc đã lưu (mẫu lọc cá nhân)

# [TC_BOLOC_10] Dropdown mẫu đã lưu hiển thị đúng danh sách cá nhân

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Ghi chú:** Đây là 1 khái niệm HOÀN TOÀN KHÁC thanh mẫu KFSP công khai (Nhóm B) — dropdown này chỉ chứa các
  bộ lọc do CHÍNH tài khoản đang đăng nhập tự lưu (tên tự đặt, VD "vippro", "hieu-T", "test-loc"...).

## Các bước thực hiện
1. Click vào dropdown tên mẫu đang chọn (cạnh nút "Lưu").

## Kết quả mong đợi
- [ ] Hiển thị danh sách mẫu lọc cá nhân đã lưu của tài khoản.
- [ ] Có nút "+ Tạo mẫu lọc mới" và "⚙ Quản lý" ở cuối danh sách.

---

# [TC_BOLOC_11] Chọn 1 mẫu đã lưu khác cập nhật tiêu chí & kết quả

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_31, TC_32 (chọn Watchlist trong màn Sửa bộ lọc — chỉ tương ứng ý tưởng "đổi bộ tiêu chí
  đang áp dụng"; đây là đổi cả 1 preset đầy đủ, không chỉ Watchlist)

## Các bước thực hiện
1. Mở dropdown mẫu đã lưu (TC_BOLOC_10).
2. Chọn 1 mẫu khác mẫu đang active.

## Kết quả mong đợi
- [ ] Tên mẫu đang chọn đổi đúng, toàn bộ tiêu chí + "Kết quả lọc" cập nhật theo mẫu vừa chọn.

---

# [TC_BOLOC_12] Nút "Lưu" chỉ active khi có thay đổi chưa lưu trên mẫu cá nhân

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Đọc đúng `button_active_status` (`index.vue` dòng 1826-1832): chỉ `true` khi tiêu
  chí/watchlist hiện tại khác với bản đã lưu **VÀ** mẫu đang chọn có `id` dạng số (tức là mẫu cá nhân, không
  phải mẫu KFSP công khai có `id` dạng chuỗi như `"golden_cross"`). Click "Reset giá trị" khi đang ở 1 mẫu cá
  nhân (VD "vippro") khiến nút "Lưu" chuyển sang trạng thái active (đổi màu nổi bật) ngay lập tức.
- **⚠️ Lưu ý an toàn:** Test **KHÔNG** thực sự click "Lưu" để xác nhận việc ghi API thật — nút này gọi
  `POST/PUT /api/filter/save_filter_group` ghi đè trực tiếp mẫu cá nhân đang chọn của tài khoản test dùng chung
  (`vippro`), có nguy cơ làm hỏng dữ liệu test dùng chung cho các lần chạy sau. Chỉ verify trạng thái active/
  inactive của nút qua class/style, không verify hành vi lưu thật.

## Các bước thực hiện
1. Đang ở 1 mẫu cá nhân đã lưu (VD "vippro"), quan sát nút "Lưu" (chưa active).
2. Thay đổi 1 giá trị tiêu chí (VD click "Reset giá trị").

## Kết quả mong đợi
- [ ] Trước khi đổi: nút "Lưu" ở trạng thái mặc định (không nổi bật).
- [ ] Sau khi đổi: nút "Lưu" chuyển màu nổi bật (active), cho biết có thay đổi chưa lưu.

---

# [TC_BOLOC_13] "Tạo bản sao" — mở modal, Huỷ không tạo gì

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click nút "Tạo bản sao".
2. Quan sát modal "Tạo bản sao mẫu lọc" (input tên mặc định là `"<tên mẫu hiện tại> - bản sao"`).
3. Click "Huỷ".

## Kết quả mong đợi
- [ ] Modal mở đúng, input pre-fill tên gợi ý, có 2 nút "Huỷ"/"Lưu".
- [ ] Click "Huỷ" → modal đóng, dropdown mẫu đã lưu KHÔNG có thêm mục mới.

---

# [TC_BOLOC_14] "Quản lý" mẫu lọc đã lưu

- **Trạng thái:** 🆕 Testcase mới — **⚠️ Cần xác nhận thêm**
- **Ghi chú:** Khi khảo sát DOM tự động, click text "Quản lý" trong dropdown bị nhầm sang 1 mục menu ẩn khác
  cùng tên ("Quản lý liên hệ" — mục quyền moderator không hiển thị với tài khoản test) do cả 2 cùng khớp
  `getByText("Quản lý")`. Cần chọn lại selector scope đúng bên trong dropdown mẫu lọc rồi khảo sát lại hành vi
  thật (có thể mở màn/modal đổi tên, xoá mẫu lọc cá nhân).

## Các bước thực hiện
1. Mở dropdown mẫu đã lưu (TC_BOLOC_10).
2. Click đúng nút "Quản lý" bên trong dropdown (scope theo dropdown, không dùng text chung).

## Kết quả mong đợi
- [ ] Mở màn/modal quản lý mẫu lọc cá nhân (đổi tên, xoá).

---

## Nhóm D: Tiêu chí lọc — nhóm "Thông tin chung"

# [TC_BOLOC_15] Input "Mã CK" — giới hạn ký tự & autocomplete

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** không có (app không có ô nhập mã trực tiếp trong tiêu chí) — 🆕 theo cấu trúc tiêu chí
  "Thông tin chung" của web, nhưng hành vi autocomplete tương tự pattern chung đã thấy ở
  [bang-gia.md](bang-gia.md) TC_BANGGIA_22.
- **Kết quả đo được:** Input giới hạn tối đa **3 ký tự** (`maxlength`, khớp độ dài mã CK Việt Nam); gõ "SH" hiện
  dropdown gợi ý 5 mã khớp (mã + tên công ty đầy đủ, VD "SHB — Ngân hàng TMCP Sài Gòn - Hà Nội").

## Các bước thực hiện
1. Click vào input "Nhập mã chứng khoán".
2. Gõ "SH".
3. Chọn 1 gợi ý trong danh sách.

## Kết quả mong đợi
- [ ] Hiện dropdown gợi ý tối đa 5 mã khớp.
- [ ] Chọn 1 gợi ý → input nhận đúng mã, "Kết quả lọc" cập nhật chỉ còn (tối đa) mã đó.

---

# [TC_BOLOC_16] Dropdown "Watchlist" lọc theo watchlist đã chọn

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_31, TC_32 (chọn Watchlist trong màn Sửa bộ lọc)

## Các bước thực hiện
1. Mở dropdown "Watchlist".
2. Chọn 1 watchlist cụ thể (khác "Tất cả").

## Kết quả mong đợi
- [ ] Dropdown liệt kê đúng các watchlist của tài khoản + tuỳ chọn "Tất cả".
- [ ] Chọn 1 watchlist → "Kết quả lọc" chỉ còn các mã trong watchlist đó (kết hợp với tiêu chí khác đang bật).

---

# [TC_BOLOC_17] Dropdown "Sàn" lọc theo sàn

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_37 (chọn sàn — cùng ý tưởng)

## Các bước thực hiện
1. Mở dropdown "Sàn", chọn "HOSE".

## Kết quả mong đợi
- [ ] Dropdown có các option: Tất cả, HOSE, HNX, UPCOM.
- [ ] Chọn "HOSE" → mọi dòng kết quả có cột "Sàn" = HOSE.

---

# [TC_BOLOC_18] Dropdown "Ngành" lọc theo ngành

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_35 (chọn ngành — cùng ý tưởng)

## Các bước thực hiện
1. Mở dropdown "Ngành", chọn 1 ngành cụ thể (VD "NGÂN HÀNG").

## Kết quả mong đợi
- [ ] Dropdown liệt kê đủ 30 ngành + "Tất cả".
- [ ] Chọn 1 ngành → mọi dòng kết quả có cột "Ngành" đúng ngành đã chọn.

---

# [TC_BOLOC_19] "Vốn hoá TT" — đổi toán tử đổi số lượng input

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_39 (toggle Trên/Dưới/Khoảng — web dùng dropdown "Lớn hơn"/"Bé hơn"/"Khoảng" thay vì
  toggle 3 nút)

## Các bước thực hiện
1. Đổi dropdown toán tử "Vốn hoá TT" từ "Lớn hơn" sang "Khoảng".
2. Đổi lại sang "Bé hơn".

## Kết quả mong đợi
- [ ] "Lớn hơn"/"Bé hơn" → 1 ô input số.
- [ ] "Khoảng" → 2 ô input số (min - max).

---

# [TC_BOLOC_20] "Vốn hoá TT" — nhập giá trị hợp lệ cập nhật kết quả

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_40, TC_41 (nhập giá trị Trên/Khoảng — cùng ý tưởng)

## Các bước thực hiện
1. Chọn "Lớn hơn", nhập 5000.

## Kết quả mong đợi
- [ ] "Kết quả lọc" cập nhật (có debounce ~1s) chỉ còn các mã có Vốn hoá TT > 5000 tỷ VNĐ.

---

# [TC_BOLOC_21] "Vốn hoá TT" — chặn ký tự không phải số

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_42 (nhập số âm/ký tự — app validate hiển thị lỗi)
- **Khác biệt so với app:** Web KHÔNG hiển thị thông báo lỗi — chỉ đơn giản CHẶN việc gõ ký tự nằm ngoài tập
  `0123456789.,-` (`changeInputValue`, `index.vue` dòng 879-898), ký tự không hợp lệ không xuất hiện trong ô.

## Các bước thực hiện
1. Gõ "abc" vào ô "Vốn hoá TT".

## Kết quả mong đợi
- [ ] Ô input vẫn rỗng (ký tự chữ bị chặn ngay khi gõ), không có thông báo lỗi nào hiện ra.

---

# [TC_BOLOC_22] "Vốn hoá TT" ở chế độ "Khoảng" — min > max KHÔNG bị chặn

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế, phát hiện khác biệt so với app**
- **Khác biệt so với app:** App có TC_43 "nhập min > max → hiển thị lỗi 'Giá trị min phải nhỏ hơn max'". Đọc
  toàn bộ `src/views/filterCanslim/` **không tìm thấy bất kỳ đoạn code nào validate min < max** — người dùng có
  thể nhập min=1000, max=100 mà không có cảnh báo, giá trị vẫn được gửi lên API `/api/filter` nguyên trạng
  (hành vi phía server khi nhận range đảo ngược chưa xác định — có thể trả về 0 kết quả hoặc bỏ qua điều kiện).

## Các bước thực hiện
1. Chọn "Khoảng" cho "Vốn hoá TT".
2. Nhập min = 1000, max = 100.

## Kết quả mong đợi
- [ ] Không có thông báo lỗi nào hiển thị trên UI (ghi nhận khác biệt so với app, không phải lỗi test).
- [ ] "Kết quả lọc" vẫn cập nhật (số mã có thể bằng 0 hoặc theo cách server tự xử lý range đảo ngược).

---

## Nhóm E: Tiêu chí lọc — nhóm Cơ bản / Kỹ thuật / KFSP

# [TC_BOLOC_23] Badge số tiêu chí mỗi nhóm hiển thị đúng

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_34 (số tiêu chí đã chọn trên nhóm — cùng ý tưởng)

## Các bước thực hiện
1. Quan sát badge số cạnh tên mỗi nhóm ("Thông tin chung 3", "Cơ bản 2", "Kỹ thuật 8", "KFSP 2").

## Kết quả mong đợi
- [ ] Badge đúng bằng số ô tiêu chí đang hiển thị trong nhóm đó.

---

# [TC_BOLOC_24] Nhóm "Cơ bản" — input range hoạt động đúng

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** phần "Tab Cơ bản" (TC_51, TC_63) — chỉ tương ứng ý tưởng nhập giá trị lọc

## Các bước thực hiện
1. Nhập giá trị vào "Tăng trưởng DTT (%) - TTM (%)" (VD 20).

## Kết quả mong đợi
- [ ] "Kết quả lọc" cập nhật đúng theo điều kiện Tăng trưởng DTT > 20%.

---

# [TC_BOLOC_25] Nhóm "Kỹ thuật" — tiêu chí dạng select hoạt động đúng

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** phần mô hình kỹ thuật (không có testcase tương ứng rõ ràng trong Sheet) — 🆕

## Các bước thực hiện
1. Đổi "SMA20 vs SMA100" từ "Tất cả" sang "Cắt lên gần đây".

## Kết quả mong đợi
- [ ] Dropdown có đủ option: Tất cả, Trên, Dưới, Cắt lên gần đây, Cắt xuống gần đây.
- [ ] "Kết quả lọc" cập nhật theo điều kiện vừa chọn.

---

# [TC_BOLOC_26] Nhóm "KFSP" — input range hoạt động đúng

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Nhập giá trị vào "Điểm 4M" (VD 50).

## Kết quả mong đợi
- [ ] "Kết quả lọc" cập nhật đúng theo điều kiện Điểm 4M > 50.

---

## Nhóm F: Modal "Tùy chỉnh tiêu chí"

# [TC_BOLOC_27] Mở modal — đúng cấu trúc

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_49 (màn "Chọn tiêu chí lọc" — web dùng modal overlay thay vì màn full-screen riêng)

## Các bước thực hiện
1. Click nút "Tùy chỉnh tiêu chí".

## Kết quả mong đợi
- [ ] Modal "Thêm điều kiện vào bộ lọc" mở ra, hàng chip trên đầu liệt kê các tiêu chí đang chọn (mỗi chip có
      icon kéo-thả + icon thùng rác).
- [ ] 4 tab: Thông tin chung, Cơ bản, Kỹ thuật, KFSP.
- [ ] Danh sách checkbox tiêu chí theo từng nhóm con (VD "Thông tin niêm yết", "Thông tin sở hữu"), nút "Bỏ chọn
      tất cả" góc phải trên.
- [ ] 2 nút "Huỷ"/"Lưu" ở cuối modal.

---

# [TC_BOLOC_28] Chuyển tab trong modal

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_50-53 (chuyển tab Thông tin chung/Cơ bản/Kỹ thuật/KFSP — cùng ý tưởng)

## Các bước thực hiện
1. Trong modal, click lần lượt 4 tab.

## Kết quả mong đợi
- [ ] Mỗi tab active hiển thị đúng danh sách nhóm tiêu chí tương ứng (VD "Kỹ thuật" gồm Biến động giá, Phạm vi
      giá, Khối lượng GD, Giá trị GD, SMA, Chỉ báo KT, Mẫu hình).

---

# [TC_BOLOC_29] Tick thêm 1 tiêu chí mới

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_57 (tick checkbox tiêu chí — cùng ý tưởng)

## Các bước thực hiện
1. Trong modal, tick 1 checkbox chưa chọn (VD "SLCP freefloat").

## Kết quả mong đợi
- [ ] Checkbox chuyển active, xuất hiện thêm 1 chip mới ở hàng trên đầu modal.

---

# [TC_BOLOC_30] Bỏ tick 1 tiêu chí đang chọn

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_58 (bỏ tick checkbox — cùng ý tưởng)

## Các bước thực hiện
1. Bỏ tick 1 checkbox đang active (VD "Vốn hoá TT").

## Kết quả mong đợi
- [ ] Checkbox bỏ active, chip tương ứng biến mất khỏi hàng trên đầu modal.

---

# [TC_BOLOC_31] Xoá 1 tiêu chí qua icon thùng rác trên chip

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_36, TC_38, TC_44 (xoá tiêu chí Ngành/Sàn/Vốn hoá TT qua icon X — cùng ý tưởng, web dùng
  icon thùng rác trên chip trong modal thay vì icon X cạnh field trên màn chính)

## Các bước thực hiện
1. Click icon thùng rác trên 1 chip (VD "Ngành") ở hàng trên đầu modal.

## Kết quả mong đợi
- [ ] Chip biến mất, checkbox "Ngành" tương ứng trong danh sách bên dưới cũng bỏ tick.

---

# [TC_BOLOC_32] Nút "Bỏ chọn tất cả"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click "Bỏ chọn tất cả" (ở tab đang active).

## Kết quả mong đợi
- [ ] Toàn bộ checkbox trong tab đang active bỏ tick, chip tương ứng biến mất khỏi hàng trên đầu.

---

# [TC_BOLOC_33] Huỷ modal không áp dụng thay đổi

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_68 (back không áp dụng — cùng ý tưởng, khác cơ chế: web có nút "Huỷ" tường minh thay vì
  chỉ dựa vào nút back)

## Các bước thực hiện
1. Trong modal, tick thêm/bỏ vài tiêu chí.
2. Click "Huỷ".

## Kết quả mong đợi
- [ ] Modal đóng, form tiêu chí chính KHÔNG đổi (giữ nguyên trạng thái trước khi mở modal).

---

# [TC_BOLOC_34] Lưu modal áp dụng đúng tiêu chí mới

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_66 (Áp dụng khi đã chọn tiêu chí — cùng ý tưởng)

## Các bước thực hiện
1. Trong modal, tick thêm 1 tiêu chí mới.
2. Click "Lưu".

## Kết quả mong đợi
- [ ] Modal đóng, form tiêu chí chính hiển thị thêm đúng field vừa tick, badge số tiêu chí của nhóm tương ứng
      tăng lên 1.

---

## Nhóm G: Reset giá trị

# [TC_BOLOC_35] "Reset giá trị" xoá giá trị nhưng giữ nguyên tiêu chí đã chọn

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC_30 (Đặt lại — app có confirm popup + xoá TẤT CẢ tiêu chí đã chọn)
- **Khác biệt so với app:** Web KHÔNG hiện confirm popup, và KHÔNG xoá danh sách tiêu chí đang hiển thị — chỉ
  reset GIÁ TRỊ input về rỗng/mặc định (field vẫn còn đó, chỉ trống giá trị), khác hẳn app (xoá hẳn tiêu chí,
  badge về 0).

## Các bước thực hiện
1. Nhập 1 giá trị bất kỳ vào 1 tiêu chí (VD "Tăng trưởng DTT" = 10).
2. Click "Reset giá trị".

## Kết quả mong đợi
- [ ] Không có confirm popup.
- [ ] Giá trị vừa nhập bị xoá về rỗng, nhưng field "Tăng trưởng DTT" vẫn còn hiển thị (badge nhóm không đổi).
- [ ] "Kết quả lọc" cập nhật lại theo tiêu chí đã reset giá trị.

---

## Nhóm H: Bảng kết quả

# [TC_BOLOC_36] 9 tab nhóm cột hiển thị đúng, đổi tab không load lại từ server

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_8-13 (tab Biến động giá/Phạm vi giá/Thanh khoản/Chỉ báo KT/KFSP — web có thêm 4 tab:
  Tiêu chí đã chọn, Thông tin chung, Định giá, Cơ bản)
- **Kết quả đo được:** Đọc code xác nhận đổi tab chỉ đổi cột hiển thị từ dữ liệu đã fetch sẵn (`itemTable`),
  KHÔNG gọi lại API `/api/filter`.

## Các bước thực hiện
1. Click lần lượt các tab: "Biến động giá", "Phạm vi giá", "Thanh khoản", "Chỉ báo kỹ thuật", "KFSP".

## Kết quả mong đợi
- [ ] Mỗi tab hiển thị đúng bộ cột tương ứng, số dòng kết quả không đổi giữa các tab (cùng 1 tập dữ liệu, chỉ
      khác cột).

---

# [TC_BOLOC_37] Sort theo cột

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_14-16 (sort theo Mã CK/Giá/Biến động giá — web sort được mọi cột có icon sort)

## Các bước thực hiện
1. Click header cột "Mã CK".
2. Click lại header "Mã CK" lần nữa.

## Kết quả mong đợi
- [ ] Lần 1: danh sách sắp xếp theo 1 chiều (icon mũi tên đổi hướng).
- [ ] Lần 2: danh sách đảo chiều ngược lại.

---

# [TC_BOLOC_38] Phân trang

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Ghi chú:** Khác app (không đề cập rõ cơ chế cuộn/phân trang) — web dùng phân trang cố định 20 dòng/trang
  (`CustomPaginationMixin`), KHÔNG phải infinite scroll.

## Các bước thực hiện
1. Click "Go to page 2" ở cuối bảng.

## Kết quả mong đợi
- [ ] Bảng hiển thị đúng 20 dòng tiếp theo, trang hiện tại đổi sang "2".

---

# [TC_BOLOC_39] Checkbox chọn nhiều dòng hiện thanh hành động thêm vào watchlist

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Tick checkbox ở 2-3 dòng trong bảng kết quả.

## Kết quả mong đợi
- [ ] Xuất hiện thanh hành động nổi "Thêm N mã vào watchlist" (N = số dòng đã tick).

---

# [TC_BOLOC_40] Giới hạn chọn tối đa 100 mã

- **Trạng thái:** 🆕 Testcase mới — **Đã verify qua đọc code (`DataTable.vue` dòng 1117: toast "Bạn chỉ được
  thêm tối đa 100 mã")**
- **Ghi chú:** Cần bảng kết quả có ≥ 101 dòng để verify bằng automation thật (tick checkbox header "chọn tất cả"
  của 1 trang không đủ vì phân trang chỉ 20 dòng/trang — cần xác nhận cơ chế "chọn tất cả" có chọn xuyên trang
  hay không trước khi viết assertion số lượng chính xác).

## Các bước thực hiện
1. Chọn (qua cơ chế chọn hàng loạt, nếu có) hơn 100 mã.

## Kết quả mong đợi
- [ ] Hiển thị toast "Bạn chỉ được thêm tối đa 100 mã", không cho chọn vượt quá 100.

---

# [TC_BOLOC_41] Click vào 1 mã mở modal chi tiết tại chỗ, đóng modal

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**
- **Tham chiếu App:** TC_17 (click vào 1 mã → "Chuyển sang màn chi tiết mã")
- **Khác biệt so với app:** App điều hướng sang màn chi tiết riêng; web mở **modal overlay tại chỗ** (biểu đồ +
  panel "Thông tin/Sổ lệnh/Cung cầu/Bài viết" + nút "Watchlist"/"Thêm giao dịch"), URL vẫn giữ nguyên `/bo-loc`,
  KHÔNG điều hướng route — giống hành vi đã ghi nhận ở TC_BANGGIA_34 cho `/bang-gia`.

## Các bước thực hiện
1. Click vào 1 mã CK ở cột "Mã CK" (VD "CNG").
2. Đóng modal bằng icon "×" góc trên bên phải.

## Kết quả mong đợi
- [ ] Mở modal chi tiết đúng mã vừa click (tiêu đề mã, biểu đồ, thông tin giao dịch/hồ sơ/chỉ số tài chính),
      URL vẫn là `/bo-loc`.
- [ ] Đóng modal thành công bằng icon "×", quay lại đúng bảng kết quả.

---

# [TC_BOLOC_42] Màu sắc giá trị % theo chiều tăng/giảm/đứng giá

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_19 (màu giá trị % — cùng quy ước màu chuẩn hệ thống)

## Các bước thực hiện
1. Quan sát cột "Biến động giá 1D" của nhiều dòng khác nhau.

## Kết quả mong đợi
- [ ] Giá trị dương màu xanh lá, âm màu đỏ, bằng 0 màu xám/vàng theo quy ước chung hệ thống.

---

# [TC_BOLOC_43] Nút refresh cạnh "Kết quả lọc"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**
- **Tham chiếu App:** TC_24 (button "X mã" refresh — cùng ý tưởng, web tách riêng icon refresh khỏi số đếm)

## Các bước thực hiện
1. Click icon refresh (⟳) cạnh "Kết quả lọc: N mã".

## Kết quả mong đợi
- [ ] Gọi lại API lấy dữ liệu mới nhất, không đổi tiêu chí đang áp dụng.

---

# [TC_BOLOC_44] Nút "Xuất File Excel"

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click nút "Xuất File Excel".

## Kết quả mong đợi
- [ ] Trình duyệt tải xuống 1 file Excel chứa đúng dữ liệu bảng kết quả đang hiển thị (xuất client-side qua thư
      viện `write-excel-file`, không gọi API riêng).

---

## Nhóm I: Tài khoản Free — giới hạn tính năng

# [TC_BOLOC_45] Tab cột nâng cao bị khoá cho tài khoản Free

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (tài khoản `FREE_USER_EMAIL`)**
- **Ghi chú:** Mỗi tab (trừ "Tiêu chí đã chọn") có thể bị khoá riêng theo `features_disabled` phía server (map
  tên feature: `bo_loc_thong_tin_chung`, `bo_loc_dinh_gia`, `bo_loc_co_ban`, `bo_loc_bien_dong_gia`,
  `bo_loc_pham_vi_gia`, `bo_loc_thanh_khoan`, `bo_loc_ky_thuat`, `bo_loc_kfsp`) — hiển thị `ProtectedView` (ảnh
  mờ + nút "Đăng ký ngay") thay bảng. **Kết quả đo được thực tế phụ thuộc cấu hình gói của tài khoản Free cụ thể
  đang dùng** — giống bài học đã ghi nhận ở TC_BANGGIA_49/50 (đọc code không đủ để khẳng định chắc chắn tính
  năng nào bị khoá, cần đo trực tiếp).

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free.
2. Click lần lượt các tab "Cơ bản", "KFSP".

## Kết quả mong đợi
- [ ] Ghi nhận thực tế: tab nào hiển thị `ProtectedView` (ảnh mờ + nút "Đăng ký ngay") thay vì bảng dữ liệu thật
      với tài khoản Free hiện tại (có thể KHÔNG có tab nào bị khoá tuỳ cấu hình gói — ghi nhận đúng thực tế đo
      được, không giả định trước).

---

# [TC_BOLOC_46] Checkbox Quý/Năm trong tab "Cơ bản" của modal bị khoá cho Free

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (tài khoản `FREE_USER_EMAIL`)**
- **Ghi chú:** Đọc code (`index.vue` dòng 466-470): `quarter`/`year` (và checkbox "Ngày" của PE/PB) bị disable
  nếu `isAccountFree` — chỉ cột "TTM" luôn khả dụng cho Free.

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free.
2. Mở modal "Tùy chỉnh tiêu chí" > tab "Cơ bản".
3. Quan sát các checkbox cột Quý/Năm/TTM/Ngày của từng chỉ tiêu BCTC.

## Kết quả mong đợi
- [ ] Checkbox cột "Quý"/"Năm"/"Ngày" bị disable (mờ, không click được).
- [ ] Checkbox cột "TTM" vẫn hoạt động bình thường.

---

## Nhóm J: Hành vi chung / lỗi mạng / điều hướng

# [TC_BOLOC_47] Lỗi mạng khi gọi API kết quả lọc — bảng không cập nhật, không crash

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock `page.route`): Pass**
- **Phát hiện đáng chú ý:** Đọc code xác nhận `getDataTable().catch()` chỉ gọi `console.error`, **không hiển thị
  toast lỗi cho người dùng** — khi API `/api/filter` lỗi mạng/500, bảng đơn giản không cập nhật (giữ nguyên dữ
  liệu cũ hoặc trống nếu là lần gọi đầu), người dùng không có cách nào biết được là do lỗi mạng hay do tiêu chí
  hiện tại không có mã nào thoả (cả 2 trường hợp đều hiển thị giống hệt "Không có dữ liệu"/giữ nguyên bảng cũ) —
  đây là 1 gap UX thật, đáng báo dev.

## Các bước thực hiện
1. Mock route `**/api/filter` trả về lỗi 500 (hoặc `context.setOffline(true)`).
2. Đổi 1 tiêu chí để kích hoạt gọi lại API.

## Kết quả mong đợi
- [ ] Không có toast lỗi nào hiển thị cho người dùng (ghi nhận gap, không phải yêu cầu hành vi đúng).
- [ ] Trang không crash, không lỗi JS chặn tương tác tiếp theo.

---

# [TC_BOLOC_48] Nút Back trình duyệt

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Từ `/bo-loc`, điều hướng sang 1 màn khác (VD `/dashboard`).
2. Bấm nút Back của trình duyệt.

## Kết quả mong đợi
- [ ] Quay lại đúng `/bo-loc`, hiển thị lại đầy đủ nội dung (tiêu chí + bảng kết quả).

---

## Tổng hợp trạng thái (48 testcase)

Đã tự động hoá bằng Playwright: [tests/toan-canh-thi-truong-bo-loc.spec.ts](../tests/toan-canh-thi-truong-bo-loc.spec.ts)
(POM: [pages/BoLocPage.ts](../pages/BoLocPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng (có tương ứng ý tưởng từ app) | 22 | TC_03, 05, 06, 08, 11, 15-21, 24-30, 33, 34, 36, 37, 42 — cách triển khai/hiển thị đều khác app (modal thay màn riêng, dropdown thay toggle...), chỉ tương ứng ý tưởng |
| 🆕 Mới (riêng web) | 26 | Mẫu lọc cá nhân đã lưu, modal Tùy chỉnh tiêu chí, Reset giá trị (khác hành vi app), phân trang, Xuất Excel, khoá tính năng Free, xử lý lỗi mạng... |
| — trong đó ⚠️ Cần xác nhận thêm (cờ phụ) | 3 | TC_BOLOC_09 (modal đầy đủ mẫu KFSP — click bị che khi khảo sát), TC_BOLOC_14 (nút "Quản lý" — nhầm selector khi khảo sát), TC_BOLOC_40 (giới hạn 100 mã — cần bảng ≥101 dòng để verify chính xác cơ chế chọn xuyên trang) |

**Phát hiện đáng chú ý:**
0. **[BUG THẬT] Dán/autofill giá trị vào ô nhập tiêu chí dạng số KHÔNG kích hoạt lọc lại** — `changeInputValue()`
   (`filterCanslim/index.vue` dòng 879) đọc `event.data` của sự kiện `input` để lọc ký tự hợp lệ:
   `if (!'0123456789.,-'.includes(keyPressed) && keyPressed !== null) { ...; return; }`. Khi giá trị được đặt
   NGUYÊN CỤM trong 1 sự kiện `input` duy nhất (dán/Ctrl+V, autofill trình duyệt, hoặc set value bằng JS/
   automation kiểu `.fill()`), `event.data` là 1 CHUỖI NHIỀU KÝ TỰ (VD `"30"`) — `.includes()` không tìm thấy
   chuỗi 2+ ký tự này trong danh sách ký tự đơn lẻ `'0123456789.,-'`, nên code hiểu NHẦM là ký tự không hợp lệ và
   `return` NGAY, bỏ qua hoàn toàn `getDataTableDebounce()`. Hệ quả: ô nhập vẫn HIỂN THỊ đúng giá trị mới, nhưng
   API `/api/filter` KHÔNG được gọi lại — bảng kết quả lặng lẽ giữ dữ liệu CŨ, người dùng không có cách nào biết.
   Đã đo trực tiếp bằng `page.on('requestfinished')` đọc payload POST thật: gõ nguyên cụm → payload vẫn giữ giá
   trị cũ; gõ từng ký tự (`pressSequentially`, giống gõ tay thật) → payload đúng giá trị mới, kết quả lọc đổi
   thật (VD 563 → 272 mã). Chỉ xảy ra với input số dạng tiêu chí (`changeInputValue`), KHÔNG xảy ra với ô Mã CK
   (`SearchFilterStrockCode.vue` dùng cơ chế khác, xem TC_BOLOC_07). TC_BOLOC_07/20/24/26 đã sửa lại dùng
   `pressSequentially` thay vì `fill` để automation không tự dính bug này.
1. **Kiến trúc component ban đầu bị nhầm lẫn:** route `/bo-loc` với `type="stock"` **không** đi qua
   `src/views/ibd/stock/liveBoard/` (đó là màn Bảng giá) mà qua `src/views/filterCanslim/index.vue`
   (`wrapperLayout.vue` dòng 30, 39) — đã xác nhận lại toàn bộ điều tra theo đúng file này.
2. **Web KHÔNG validate min < max** cho tiêu chí dạng "Khoảng" (TC_BOLOC_22) — khác app (có thông báo lỗi rõ
   ràng "Giá trị min phải nhỏ hơn max"). Không tìm thấy đoạn code nào xử lý trường hợp này trong
   `src/views/filterCanslim/`.
3. **`getDataTable().catch()` chỉ `console.error`, không toast lỗi cho người dùng** (TC_BOLOC_47) — lỗi mạng/500
   và "0 kết quả thật" hiển thị giống hệt nhau với người dùng cuối, đáng báo dev.
4. **"Reset giá trị" trên web chỉ xoá GIÁ TRỊ, không xoá TIÊU CHÍ** (TC_BOLOC_35) — khác hẳn app (Đặt lại xoá
   toàn bộ tiêu chí về "0 tiêu chí đã chọn" kèm confirm popup).
5. **2 khái niệm "mẫu lọc" hoàn toàn tách biệt** trên web: thanh mẫu KFSP công khai (Nhóm B, có Free/Pro) và
   dropdown mẫu lọc cá nhân đã lưu (Nhóm C, do chính người dùng tạo) — trong khi app dường như chỉ có 1 khái
   niệm "mẫu KFSP" (Sheet không đề cập tới mẫu cá nhân tự lưu).
6. **Nút "Lưu" ghi đè trực tiếp dữ liệu thật** của tài khoản test dùng chung nếu click thật (TC_BOLOC_12) — cố
   ý không tự động hoá phần ghi dữ liệu thật để tránh làm hỏng state test dùng chung cho các lần chạy sau.
7. **Panel border phải ở `/bo-loc` chỉ có 6 tab** (thiếu "Bài viết"/"Chatbot" so với 8 tab ở `/bang-gia`) dù
   cùng dùng chung khung `reactLayoutIBD.js` — chưa rõ có phải chủ đích cấu hình khác nhau theo `type` hay
   không, đáng hỏi lại dev nếu cần đồng nhất.
8. **Flicker render vô hại lúc tải trang, chỉ lộ ra qua automation:** danh sách nhóm tiêu chí (`.card-wrapper`,
   render theo preset đã lưu của user) có 1 khoảnh khắc RẤT ngắn (vài chục ms, đo được bằng cách poll liên tục
   ngay sau `domcontentloaded`) render TẠM nhân đôi 1 nhóm trước khi ổn định về đúng số nhóm thật. Mắt thường
   không nhận ra, nhưng `expect(locator).toBeVisible()` (Playwright strict mode — fail ngay khi thấy >1 phần tử
   khớp, không tự retry như assertion đếm số lượng) bắt trúng khoảnh khắc đó và báo lỗi giả ngẫu nhiên
   (flaky). Đã xử lý ở tầng test (`gotoBoLocReady` chờ tổng số card ổn định trước khi trả về), không phải bug
   sản phẩm cần dev sửa.
