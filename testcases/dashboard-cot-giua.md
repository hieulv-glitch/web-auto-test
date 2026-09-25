# Màn hình: Dashboard — Cột giữa (Bản đồ nhiệt & Chỉ số tâm lý/rủi ro)

- **URL:** `/dashboard` (cùng route với [dashboard.md](dashboard.md), tài liệu này đào sâu nội dung 2 widget
  nằm ở cột giữa mà tài liệu khung/shell đã cố tình bỏ qua).
- **Component:** [board/HeatMap.vue](../../stocks/src/views/dashboard/board/HeatMap.vue) (bản đồ nhiệt, chế độ
  thu nhỏ — chế độ mở rộng toàn màn hình đã có ở [dashboard.md](dashboard.md) TC_DASHBOARD_08-10) +
  [psychoAndRisk/PsychoIndex.vue](../../stocks/src/views/dashboard/psychoAndRisk/PsychoIndex.vue) +
  [psychoAndRisk/RiskIndex.vue](../../stocks/src/views/dashboard/psychoAndRisk/RiskIndex.vue).
- **Domain test:** https://kfsp.vn/dashboard
- **Nguồn testcase gốc (app):** Không áp dụng — Sheet "Dashboard" của app không có khái niệm bản đồ nhiệt hay
  gauge chỉ số tâm lý/rủi ro (đây là tính năng chỉ web mới có). Toàn bộ testcase dưới đây là 🆕.
- **Phương pháp sinh:** Đọc source code + kiểm kê độc lập bằng Playwright thật (click từng dropdown, đổi giá
  trị lọc, mở/đóng modal, reset).
- **Quy ước trạng thái:** 🆕 Testcase mới · ⚠️ Cần xác nhận thêm.

---

## Nhóm: Bản đồ nhiệt — Bộ lọc (chế độ thu nhỏ)

# [TC_DASHBOARD_CG_01] Hiển thị 3 dropdown lọc mặc định

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát header của khối bản đồ nhiệt (chế độ thu nhỏ, mặc định).

## Kết quả mong đợi
- [ ] Hiển thị 3 dropdown: "Giá trị" (mặc định "Khối lượng GD"), "Sàn" (mặc định "Tất cả"), "Phân loại" (mặc
      định "Cổ phiếu").
- [ ] Hiển thị icon Lọc tùy chỉnh, icon Đặt lại bộ lọc, icon Phóng to.

---

# [TC_DASHBOARD_CG_02] Đổi dropdown "Giá trị" sang chỉ tiêu giao dịch NĐT nước ngoài/tự doanh

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Chọn "GDNN" (giao dịch nước ngoài) → treemap đổi hẳn bố cục sang 2 cột "MUA X Tỷ" /
  "BÁN Y Tỷ" theo ngành, kèm chú thích "Dữ liệu được tính tại ngày ..." + đơn vị "Giá x1000 (VND)" / "Giá trị
  x1,000,000,000 (VND)". Dropdown "Phân loại" **tự động chuyển sang "Ngành"** (đúng theo code:
  `handleClickMenu('foreign', ...)` set `viewModeValue = 'industry'` khi chọn 1 trong 4 giá trị GDNN/GDNN
  ròng/GDTD/GDTD ròng).

## Các bước thực hiện
1. Click dropdown "Giá trị".
2. Chọn lần lượt "GDNN", "GDNN ròng", "GDTD", "GDTD ròng".

## Kết quả mong đợi
- [ ] Mỗi lựa chọn đổi đúng nhãn dropdown, treemap chuyển sang bố cục MUA/BÁN theo ngành.
- [ ] Dropdown "Phân loại" tự đổi sang "Ngành" (không cho chọn lại "Cổ phiếu" khi đang ở các chế độ này — theo
      code không có nhánh nào set lại 'stock' khi type='foreign').

---

# [TC_DASHBOARD_CG_03] Đổi dropdown "Giá trị" về chỉ tiêu khối lượng/giá trị/vốn hóa

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Từ trạng thái đang chọn "GDNN" (TC_DASHBOARD_CG_02), mở lại dropdown "Giá trị".
2. Chọn "Giá trị GD" hoặc "Vốn hóa".

## Kết quả mong đợi
- [ ] Treemap quay lại bố cục theo ngành/mã bình thường (không còn 2 cột MUA/BÁN).

---

# [TC_DASHBOARD_CG_04] Đổi dropdown "Sàn"

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**

## Các bước thực hiện
1. Click dropdown "Sàn".
2. Chọn lần lượt "HSX", "HNX", "UPCOM", "Tất cả".

## Kết quả mong đợi
- [ ] Mỗi lựa chọn đổi đúng nhãn dropdown và lọc lại dữ liệu treemap theo đúng sàn.

---

# [TC_DASHBOARD_CG_05] Đổi dropdown "Phân loại" (Cổ phiếu ↔ Ngành)

- **Trạng thái:** 🆕 — **Đã verify bằng automation, ghi nhận độ trễ render**
- **Kết quả đo được:** Chọn "Ngành" → treemap chuyển từ hiển thị từng mã cổ phiếu sang hiển thị gộp theo
  ngành. Ngay sau khi chọn (trong khoảng ~500ms-1s), treemap có thể hiển thị tạm thời lệch/thiếu ô trước khi ổn
  định đúng bố cục — đã verify chờ thêm tới ~3s thì luôn ổn định đúng, không phải lỗi vĩnh viễn (cùng loại hiện
  tượng với TC_DASHBOARD_08 ở tài liệu khung Dashboard: canvas/chart cần thời gian resize/redraw).

## Các bước thực hiện
1. Click dropdown "Phân loại".
2. Chọn "Ngành".
3. Đợi ổn định rồi quan sát.
4. Chọn lại "Cổ phiếu".

## Kết quả mong đợi
- [ ] Treemap chuyển đúng giữa 2 chế độ hiển thị (theo mã / theo ngành gộp), ổn định sau tối đa vài giây.

---

# [TC_DASHBOARD_CG_06] Mở modal "Bộ lọc bản đồ nhiệt"

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Click icon "Lọc tùy chỉnh".

## Kết quả mong đợi
- [ ] Mở modal "Bộ lọc bản đồ nhiệt" gồm: hàng nút Sàn (Tất cả/HSX/HNX/UPCOM), dropdown Ngành, dropdown
      Watchlist, dropdown Thời gian, nút "Đóng".
- [ ] Giá trị các control trong modal khớp đúng với trạng thái filter hiện tại ngoài header.

---

# [TC_DASHBOARD_CG_07] Đóng modal bộ lọc

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Mở modal bộ lọc (TC_DASHBOARD_CG_06).
2. Click nút "Đóng".

## Kết quả mong đợi
- [ ] Modal đóng lại, mọi thay đổi filter đã chọn trong modal (nếu có) được áp dụng ra ngoài header.

---

# [TC_DASHBOARD_CG_08] Đặt lại bộ lọc (icon reset)

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Sau khi đổi "Giá trị" sang "GDNN" (khiến "Phân loại" tự đổi "Ngành"), click icon "Đặt
  lại bộ lọc" → cả 2 dropdown quay về đúng mặc định ("Khối lượng GD" / "Cổ phiếu"), "Sàn" về "Tất cả" (khớp
  `restoreAll()`).

## Các bước thực hiện
1. Đổi ít nhất 2 dropdown khỏi giá trị mặc định.
2. Click icon "Đặt lại bộ lọc".

## Kết quả mong đợi
- [ ] Toàn bộ dropdown (Giá trị, Sàn, Phân loại) quay về đúng giá trị mặc định ban đầu.

---

# [TC_DASHBOARD_CG_09] Bộ lọc KHÔNG được lưu lại sau khi tải lại trang

- **Trạng thái:** 🆕 — **Đã verify bằng automation: Pass**
- **Kết quả đo được:** Đổi "Phân loại" sang "Ngành", F5 reload → dropdown "Phân loại" quay về mặc định "Cổ
  phiếu" (khác với bố cục cột kéo giãn ở tài liệu khung — bố cục CÓ lưu `localStorage`, còn bộ lọc bản đồ
  nhiệt ở chế độ thu nhỏ thì KHÔNG lưu gì, mỗi lần vào lại là mặc định).

## Các bước thực hiện
1. Đổi ít nhất 1 dropdown khỏi mặc định.
2. Tải lại trang (F5).

## Kết quả mong đợi
- [ ] Toàn bộ dropdown quay về đúng giá trị mặc định, không giữ lại lựa chọn trước khi reload.

---

## Nhóm: Bản đồ nhiệt — Hiển thị dữ liệu

# [TC_DASHBOARD_CG_10] Hiển thị treemap mặc định theo ngành/mã

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát treemap ở trạng thái mặc định.

## Kết quả mong đợi
- [ ] Hiển thị các nhóm ngành (Ngân hàng, Chứng khoán, Bất động sản, Thép...), mỗi ô con là 1 mã cổ phiếu kèm %
      thay đổi giá, màu đỏ/xanh/vàng theo chiều tăng giảm.

---

## Nhóm: Chỉ số tâm lý & Chỉ số rủi ro

# [TC_DASHBOARD_CG_11] Hiển thị Chỉ số tâm lý

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát khối "Chỉ số tâm lý".

## Kết quả mong đợi
- [ ] Hiển thị gauge chart (thang 0-100), giá trị hiện tại ở giữa, nhãn trạng thái theo ngưỡng (đọc code
      `getStatusByValue`: `<20` "Sợ hãi tột độ", `20-39` "Sợ hãi", `40-59` "Trung lập", `60-79` "Tham lam",
      `80-99` "Tham lam tột độ"), giá trị + nhãn trạng thái của "Hôm qua" và "Tuần trước".

---

# [TC_DASHBOARD_CG_12] Hiển thị Chỉ số rủi ro

- **Trạng thái:** 🆕 — **Đã verify thực tế: Pass**

## Các bước thực hiện
1. Quan sát khối "Chỉ số rủi ro".

## Kết quả mong đợi
- [ ] Hiển thị gauge chart (thang 0-1), giá trị hiện tại, nhãn trạng thái theo ngưỡng (đọc code
      `getStatusByValue`: `≤0.3` "Rủi ro thấp", `0.3-0.7` "Trung tính", `>0.7` "Rủi ro cao"), giá trị + nhãn
      trạng thái của "Hôm qua" và "Tuần trước".

---

# [TC_DASHBOARD_CG_13] Chỉ số tâm lý/rủi ro không có tương tác click

- **Trạng thái:** 🆕 — **Đã verify qua đọc code**
- **Ghi chú:** `PsychoIndex.vue`/`RiskIndex.vue` không có bất kỳ `@click` nào trên gauge hay số liệu — 2 widget
  này thuần hiển thị, không điều hướng, không mở modal khi click.

## Các bước thực hiện
1. Click vào gauge/số liệu của Chỉ số tâm lý và Chỉ số rủi ro.

## Kết quả mong đợi
- [ ] Không có phản ứng nào (không điều hướng, không mở popup).

---

## Tổng hợp trạng thái (13 testcase)

Đã tự động hoá bằng Playwright: [tests/dashboard-cot-giua.spec.ts](../tests/dashboard-cot-giua.spec.ts)
(mở rộng POM [pages/DashboardPage.ts](../pages/DashboardPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| 🆕 Mới (riêng web) | 13 | App không có tính năng tương ứng |

**Phát hiện đáng chú ý:**
1. Đổi "Giá trị" sang GDNN/GDNN ròng/GDTD/GDTD ròng tự động khoá "Phân loại" về "Ngành" — hành vi đúng theo
   code, không phải bug.
2. Đổi "Phân loại" có độ trễ ổn định render ngắn (~1-2s) — cùng loại hiện tượng đã ghi nhận ở
   [dashboard.md](dashboard.md) khi mở rộng bản đồ nhiệt toàn màn hình lần đầu. Nên báo dev nếu muốn cải thiện
   trải nghiệm chuyển đổi mượt hơn.
3. Bộ lọc bản đồ nhiệt (chế độ thu nhỏ) không lưu trạng thái qua reload — khác với bố cục kéo giãn cột (có
   lưu). Đây có thể là chủ đích thiết kế, không phải bug.
