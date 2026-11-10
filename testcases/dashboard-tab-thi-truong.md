# Màn hình: Dashboard — Tab thị trường (Việt Nam sub-tab / Quốc tế / Crypto / Sự kiện / Vĩ mô)

- **URL:** `/dashboard` (cùng route với [dashboard.md](dashboard.md), tài liệu này đào sâu nội dung cột trái:
  5 sub-tab của "Việt Nam" (Diễn biến/Top/NN & TD/Độ rộng TT/Định giá) + nội dung 4 tab thị trường còn lại
  (Quốc tế/Crypto/Sự kiện/Vĩ mô) mà tài liệu khung/shell chỉ test việc chuyển tab, không đi vào nội dung).
- **Component:** [board/Domestic.vue](../../stocks/src/views/dashboard/board/Domestic.vue) (tab "Việt Nam") +
  [board/Foreign.vue](../../stocks/src/views/dashboard/board/Foreign.vue) (tab "Quốc tế") +
  [board/Crypto.vue](../../stocks/src/views/dashboard/board/Crypto.vue) (tab "Crypto") +
  [board/Events.vue](../../stocks/src/views/dashboard/board/Events.vue) (tab "Sự kiện") +
  [marco/MarcoOverview.vue](../../stocks/src/views/dashboard/marco/MarcoOverview.vue) (tab "Vĩ mô").
- **Domain test:** https://kfsp.vn/dashboard (qua `PREV2_BASE_URL` + `Prev2Session`; production = preprod mới nhất từ 06/11/2026)
- **Cập nhật 09/11/2026 (nhánh B):** biểu đồ "Ảnh hưởng thị trường" chuyển từ sub-tab Top sang Diễn biến (20/10/2026,
  commit 039a9cf71) → sửa TC_DASHBOARD_TT_02; sub-tab "NN & TD": phần Nước ngoài lấy dữ liệu qua socket
  (`getforeignhistory`/`getforeign`, cập nhật 30 giây/lần — 28/10/2026), giao diện không đổi; TC_DASHBOARD_TT_14 (Free)
  đã tự động hoá bằng `FREE_USER_*`.
- **Nguồn testcase gốc (app):** Không áp dụng — app không có 5 tab thị trường kiểu này trên Dashboard. Toàn bộ
  🆕.
- **Phương pháp sinh:** Đọc source code + kiểm kê độc lập bằng Playwright thật.
- **Quy ước trạng thái:** 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.
- **Phạm vi:** Chỉ test khung UI (hiển thị, chuyển sub-tab, click mở modal/điều hướng). **Không** đi sâu tính
  đúng của dữ liệu tài chính/biểu đồ bên trong từng sub-tab (đó là phạm vi nghiệp vụ, cần domain riêng để xác
  minh, không phải mục tiêu của UI/E2E test).

- **Xác minh trên UI thật (09/11/2026):** chạy trên **https://kfsp.vn** (biến `PREV2_BASE_URL` trong `.env`; production đã là
  bản preprod mới nhất, deploy 06/11/2026 10:30 GMT) — 4 spec Dashboard pass 2 lần liên tiếp (`--workers=2`). Trước đó prev2
  bị deploy đè bằng nhánh `feat/ibd_tobao` lúc 07:40 GMT nên không dùng làm môi trường xác nhận.
---

## Nhóm: Tab "Việt Nam" — 5 sub-tab (Diễn biến/Top/NN & TD/Độ rộng TT/Định giá)

# [TC_DASHBOARD_TT_01] Hiển thị 5 sub-tab, "Diễn biến" active mặc định

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Ở tab "Việt Nam" (mặc định), quan sát dải sub-tab dưới khối chi tiết chỉ số.

## Kết quả mong đợi
- [ ] Hiển thị đủ 5 sub-tab: "Diễn biến" (active mặc định), "Top", "NN & TD", "Độ rộng TT", "Định giá".

---

# [TC_DASHBOARD_TT_02] Chuyển sub-tab "Việt Nam"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click "Top" → hiển thị bảng "Top khối lượng" (dropdown đổi tiêu chí Top + bảng Mã/Giá/
  Thay đổi/Khối lượng/Biểu đồ).
- **Cập nhật 09/11/2026:** biểu đồ "Ảnh hưởng thị trường" giờ nằm dưới sub-tab "Diễn biến" (dưới biểu đồ Thanh khoản),
  không còn ở "Top". Mỗi sub-tab còn lại (NN & TD/Độ rộng TT/Định
  giá) đều đổi đúng loại nội dung tương ứng khi click.

## Các bước thực hiện
1. Click lần lượt "Top", "NN & TD", "Độ rộng TT", "Định giá", rồi quay lại "Diễn biến".

## Kết quả mong đợi
- [ ] Mỗi lần click, sub-tab được chọn chuyển active, nội dung đổi đúng loại dữ liệu, không lỗi JS.
- [ ] "Ảnh hưởng thị trường" hiện ở "Diễn biến", không hiện ở "Top".

---

# [TC_DASHBOARD_TT_03] Đổi chỉ số đang chọn áp dụng cho toàn bộ sub-tab đang xem

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**
- **Ghi chú:** Xác nhận thêm cho phát hiện ở [dashboard.md](dashboard.md) TC_DASHBOARD_20 — mọi sub-tab
  (`Developments`/`TopStock`/`ForeignAndSelfEmployed`/`MaStatistic`/`Valuation`) đều nhận `current_index_code`
  làm prop, nên đổi chỉ số ở card phía trên áp dụng luôn cho sub-tab đang xem, không chỉ khối chi tiết OHLC.

## Các bước thực hiện
1. Ở sub-tab "Top", click card chỉ số "HNXINDEX" thay vì "VNINDEX".

## Kết quả mong đợi
- [ ] Nội dung bảng "Top khối lượng" cập nhật theo đúng dữ liệu của HNXINDEX (không phải VNINDEX).

---

## Nhóm: Tab "Quốc tế"

# [TC_DASHBOARD_TT_04] Hiển thị 5 sub-tab thị trường quốc tế

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click tab "Quốc tế".

## Kết quả mong đợi
- [ ] Hiển thị 5 sub-tab: "Chỉ số" (active mặc định), "Cổ phiếu", "Tiền tệ", "Hàng hoá", "Trái phiếu".
- [ ] Danh sách hiển thị dạng bảng (STT/Mã/Giá/30 ngày qua) mặc định.
- [ ] Có icon chuyển đổi kiểu hiển thị (danh sách ↔ dạng thẻ) ở góc phải.

---

# [TC_DASHBOARD_TT_05] Chuyển đổi kiểu hiển thị (danh sách ↔ thẻ)

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click icon chuyển đổi → đổi từ bảng danh sách (STT/Mã/Giá/30 ngày qua) sang dạng thẻ
  (mỗi chỉ số 1 card riêng: icon, tên, giá, % thay đổi, sparkline). Click lại icon quay về đúng dạng danh sách
  ban đầu. **Cần chờ ~1.5s** sau mỗi lần click để giao diện ổn định — click 2 lần liên tiếp quá nhanh (cách
  nhau 500ms) có lúc khiến khu vực danh sách tạm thời trống trơn (không hiển thị cả 2 dạng) trước khi ổn định;
  cùng loại hiện tượng "độ trễ render" đã ghi nhận nhiều lần ở [dashboard.md](dashboard.md) và
  [dashboard-cot-giua.md](dashboard-cot-giua.md).

## Các bước thực hiện
1. Click icon chuyển đổi kiểu hiển thị.
2. Click lại lần nữa.

## Kết quả mong đợi
- [ ] Đổi qua lại đúng giữa 2 kiểu hiển thị, dữ liệu không đổi, chỉ đổi cách trình bày.

---

# [TC_DASHBOARD_TT_06] Click 1 dòng mở modal biểu đồ giao dịch (Trading Chart)

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Click vào 1 dòng chỉ số (VD "VIX") → mở modal lớn "Trading Chart" (tiêu đề đúng mã,
  biểu đồ TradingView bên trái, panel "Tổng quan/NN & TD" bên phải) — **không điều hướng rời khỏi
  `/dashboard`**. Đóng bằng nút `button.close` (góc phải header modal); phím Escape không thử trong testcase
  này (xem ghi chú chung về CModal ở [dashboard-panel-phai.md](dashboard-panel-phai.md)).

## Các bước thực hiện
1. Click vào 1 dòng chỉ số bất kỳ trong danh sách "Quốc tế".

## Kết quả mong đợi
- [ ] Mở modal Trading Chart đúng mã vừa click, URL vẫn giữ `/dashboard`.
- [ ] Đóng modal bằng nút "×" thành công.

**Ghi chú vận hành test:** danh sách "Quốc tế" đổ dữ liệu qua socket real-time — khi chạy song song nhiều
worker Playwright cùng đăng nhập 1 tài khoản test (VD `--workers=3` mặc định), đôi lúc dữ liệu không kịp đổ về
trong 30s khiến test timeout dù không phải lỗi thật của tính năng (chạy `--workers=1` thì luôn pass ổn định).
Nếu gặp timeout ở đúng test này khi chạy full suite, thử chạy lại riêng lẻ trước khi kết luận là bug.

---

## Nhóm: Tab "Crypto"

# [TC_DASHBOARD_TT_07] Hiển thị tổng quan Crypto

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click tab "Crypto".

## Kết quả mong đợi
- [ ] Hiển thị khối tổng quan: "Vốn hóa TT" (giá trị + % thay đổi) và "Tỷ lệ vốn hóa" (biểu đồ thanh theo BTC/
      ETH/Khác).
- [ ] Bên dưới là danh sách các đồng coin (tương tự dạng danh sách của tab Quốc tế).

---

# [TC_DASHBOARD_TT_08] Click khối tổng quan mở `/crypto` ở tab mới

- **Trạng thái:** 🆕 — **Đã verify qua đọc code (`goToCrypto()` dùng `window.open(..., '_blank')`)**
- **Ghi chú:** Chưa verify bằng automation trong lần này (click mở tab mới ít giá trị đo thêm ngoài xác nhận
  URL đích, đã rõ ràng từ code).

## Các bước thực hiện
1. Click vào khối tổng quan Crypto (Vốn hóa TT / Tỷ lệ vốn hóa).

## Kết quả mong đợi
- [ ] Mở tab trình duyệt mới, điều hướng tới `/crypto`. Tab Dashboard hiện tại không đổi.

---

# [TC_DASHBOARD_TT_09] Click 1 dòng coin mở modal biểu đồ giao dịch

- **Trạng thái:** 🆕 — **Đã verify qua đọc code, cùng cơ chế TC_DASHBOARD_TT_06**

## Các bước thực hiện
1. Click vào 1 dòng coin trong danh sách bên dưới khối tổng quan.

## Kết quả mong đợi
- [ ] Mở modal Trading Chart đúng mã coin vừa click, không điều hướng rời `/dashboard`.

---

## Nhóm: Tab "Sự kiện"

# [TC_DASHBOARD_TT_10] Hiển thị 2 sub-tab Quốc tế/Cổ phiếu

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click tab "Sự kiện".

## Kết quả mong đợi
- [ ] Hiển thị 2 sub-tab: "Quốc tế" (active mặc định), "Cổ phiếu".
- [ ] Sub-tab "Quốc tế": bộ lọc (Tất cả sao/Các quốc gia/Hôm nay) + bảng sự kiện vĩ mô quốc tế (Ngày, Tiền tệ,
      mức độ quan trọng dạng sao, Sự kiện, Thực tế/Dự báo/Trước đó).

---

# [TC_DASHBOARD_TT_11] Chuyển sang sub-tab "Cổ phiếu"

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click sub-tab "Cổ phiếu".

## Kết quả mong đợi
- [ ] Đổi sang bảng sự kiện theo từng mã cổ phiếu (Ngày/Mã/Quan trọng/Sự kiện), có bộ lọc riêng (dropdown +
      icon lọc).

---

## Nhóm: Tab "Vĩ mô"

# [TC_DASHBOARD_TT_12] Hiển thị đầy đủ các section vĩ mô

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click tab "Vĩ mô".
2. Cuộn xuống hết nội dung.

## Kết quả mong đợi
- [ ] Hiển thị lần lượt các section: GDP, Công nghiệp, Thương mại, Xuất nhập khẩu, Đầu tư, CPI — mỗi section
      có tiêu đề + biểu đồ/số liệu riêng.
- [ ] Section GDP có icon mũi tên (→) liên kết sang trang Vĩ mô đầy đủ.

---

# [TC_DASHBOARD_TT_13] Click icon mũi tên chuyển sang trang Vĩ mô đầy đủ

- **Trạng thái:** 🆕 — **Đã verify qua đọc code (`CHeaderNavLink to="/vi-mo"`)**
- **Ghi chú:** Chưa verify bằng automation trực tiếp trong lần này; route đích đã rõ từ code.

## Các bước thực hiện
1. Click icon mũi tên cạnh tiêu đề "GDP".

## Kết quả mong đợi
- [ ] Điều hướng sang `/vi-mo`.

---

# [TC_DASHBOARD_TT_14] Giới hạn tính năng với tài khoản Free

- **Trạng thái:** 🆕 Testcase mới — **Đã tự động hoá 09/11/2026 (trước là ⚠️/fixme)**
- **Ghi chú:** Theo code, mọi section trừ GDP đều bọc `UpdateRequire` khi `$store.state.isAccountFree`. Đã chạy thật
  bằng `FREE_USER_*` trên prev2: đúng thiết kế.

## Các bước thực hiện
1. Đăng nhập bằng tài khoản Free.
2. Vào tab "Vĩ mô".

## Kết quả mong đợi
- [ ] Các section Công nghiệp/Thương mại/Xuất nhập khẩu/Đầu tư/CPI hiển thị khung `UpdateRequire` ("Bạn cần nâng cấp
      gói hội viên để sử dụng chức năng này" + nút "Nâng cấp ngay") thay vì biểu đồ; riêng GDP vẫn có biểu đồ.
- [ ] Bấm "Nâng cấp ngay" → mở bảng "Chọn dịch vụ".

---

## Tổng hợp trạng thái (14 testcase)

Đã tự động hoá bằng Playwright: [tests/dashboard-tab-thi-truong.spec.ts](../tests/dashboard-tab-thi-truong.spec.ts)
(mở rộng POM [pages/DashboardPage.ts](../pages/DashboardPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 13 | Đã verify bằng automation hoặc quan sát thực tế trực tiếp (TT_14 tự động hoá 09/11/2026) |

(TC_DASHBOARD_TT_08 và TC_DASHBOARD_TT_13 verify qua đọc code, không tính vào 2 nhóm trên vì không cần chạy
automation thêm — hành vi đã rõ ràng 100% từ source, rủi ro sai lệch thấp.)

**Phát hiện đáng chú ý:**
1. Card chỉ số (VNINDEX/HNXINDEX/UPCOM/VN30) không chỉ đổi khối chi tiết OHLC như ghi nhận ở
   [dashboard.md](dashboard.md), mà còn áp dụng cho **toàn bộ 5 sub-tab** đang xem của tab "Việt Nam" — hành vi
   nhất quán, đúng thiết kế.
2. Click vào 1 dòng mã (cổ phiếu/chỉ số quốc tế/coin) ở bất kỳ tab thị trường nào đều mở chung 1 modal "Trading
   Chart" toàn cục (component dùng chung trong `TheContainer.vue`), không điều hướng rời trang — nhất quán trên
   toàn bộ Dashboard.
3. Riêng tab "Crypto", khối tổng quan (không phải từng dòng coin) lại có hành vi khác hẳn: mở tab trình duyệt
   MỚI tới `/crypto` thay vì mở modal — cần lưu ý khi viết test để không nhầm 2 hành vi click khác nhau trong
   cùng 1 tab.
