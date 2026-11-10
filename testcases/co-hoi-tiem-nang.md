# Màn hình: Cơ hội tiềm năng

- **URL:** `/co-hoi-tiem-nang` (menu "Cơ hội" → "Cơ hội tiềm năng"). Component `IBD` với `type: "opportunity"`
  (`src/views/ibd/wrapperLayout.vue`) → `src/views/filterCanslim/opportunity/` (`OpportunitySegment.vue`,
  `OpportunityTable.vue`, `OpportunityAiDetail.vue`, `OpportunityPatternDetail.vue`, `rules.js`).
- **Nguồn dữ liệu:** nhóm "AI Mua/Bán" = `GET /api/stocks/bot-opportunity-ranking?sortBy=recent` (mã bot đang nắm và
  đang lãi); các nhóm mẫu hình đáy ("Hai đáy", "Vai đầu vai ngược") = `POST /api/stock-signals/patterns/search` (chỉ
  đọc). VN-INDEX ở chân bảng qua socket `getliveindex`. Sàn + ngành (nhóm mẫu hình) tra danh sách mã của app.
- **Domain test:** localhost:8080 (nhánh `preprod`, backend PRODUCTION), viewport 1600×900. Spec:
  `tests/co-hoi-tiem-nang.spec.ts`, Page Object: `pages/CoHoiTiemNangPage.ts`.
- **Dữ liệu:** phần lớn case dùng dữ liệu giả cố định (`FakeOppApi`): AI = FPT (CÔNG NGHỆ, +8,5%), HPG (THÉP, +2,1%),
  SHS (CHỨNG KHOÁN, +12,3%), VCB (NGÂN HÀNG, +0,5%), ACV (HÀNG KHÔNG, +5,0%) theo đúng thứ tự đó; Hai đáy = MWG (Thành
  công), DGC + GEX (Chờ xác nhận), PVS (Nguy cơ huỷ); Vai đầu vai ngược = VHM; 1 mẫu "Ba đáy" (không có nhóm).
  TC_01, TC_30, TC_31 dùng dữ liệu thật.
- **Nguồn:** màn chỉ web có (không đọc Google Sheet) → toàn bộ là 🆕.

**⚠️ An toàn dữ liệu:** màn không có API ghi. Lưới `OppSafetyNet` huỷ mọi request không phải GET tới `*.kfsp.vn` (trừ
đăng nhập, socket, `patterns/search` chỉ đọc), nhật ký sử dụng `/api/activitylog/create` trả giả; `afterEach` fail nếu
có request ghi bị chặn ngoài dự kiến.

| Trạng thái | Ý nghĩa |
|---|---|
| 🆕 Testcase mới | Chỉ web có |
| ⚠️ Cần xác nhận thêm | Hành vi đo được cần dev/PO xác nhận |

---

## Nhóm: Điều hướng & hiển thị

# [TC_CHTN_01] Vào từ menu "Cơ hội" → "Cơ hội tiềm năng"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập (trả phí), đứng ở `/dashboard`. Rê chuột lên "Cơ hội", bấm "Cơ hội tiềm năng".

## Kết quả mong đợi
- [ ] URL `/co-hoi-tiem-nang`; nhóm "AI Mua/Bán" được chọn; bảng có dòng (dữ liệu thật).
- [ ] Chân bảng "N mã" đúng bằng số dòng; mục menu "Cơ hội" được tô sáng.

---

# [TC_CHTN_02] Đang tải → skeleton "AI đang tìm cơ hội cho bạn…"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cho 2 API phản hồi chậm 4 giây, mở trang.

## Kết quả mong đợi
- [ ] Hiện skeleton `.opp-loading` với dòng "AI đang tìm cơ hội cho bạn…", chưa có thanh công cụ.
- [ ] Khi dữ liệu về: skeleton biến mất, bảng có 5 dòng.

---

# [TC_CHTN_03] Dải nhóm cơ hội

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở trang (tài khoản trả phí). Rê chuột lên từng nhóm.

## Kết quả mong đợi
- [ ] Thứ tự: "AI Mua/Bán" (đang chọn, `aria-pressed=true`) · "Hai đáy" · "Vai đầu vai ngược". Mẫu "Ba đáy" không có nhóm.
- [ ] Rê chuột xem mô tả nhóm (thuộc tính `title`).
- [ ] Không có nhãn Free/Pro, không có dòng "Mở khóa toàn bộ cơ hội".

---

# [TC_CHTN_04] Nhóm mẫu hình rỗng bị ẩn

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. API mẫu hình không trả mẫu "Vai đầu vai ngược" nào. Mở trang.

## Kết quả mong đợi
- [ ] Dải nhóm chỉ còn "AI Mua/Bán" · "Hai đáy".

---

# [TC_CHTN_05] Bảng AI Mua/Bán — cột và định dạng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mở trang, xem bảng nhóm AI Mua/Bán.

## Kết quả mong đợi
- [ ] Cột: STT · Mã CK · Ngành · Giá vốn · Hiện tại · Lãi/lỗ · Lệnh mua · Mua gần nhất.
- [ ] Thứ tự dòng đúng thứ tự backend (FPT, HPG, SHS, VCB, ACV), STT 1–5.
- [ ] Dòng FPT: "FPT HOSE" · CÔNG NGHỆ · 100.00 · 108.50 (suy từ giá vốn + % lãi) · +8.5% · 3 · 20/10/26 (lệnh có NGÀY
  mới nhất, không phải lệnh cuối mảng).
- [ ] Nhãn sàn đúng: SHS HNX, ACV UPCOM.

---

# [TC_CHTN_06] Chân bảng

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] "5 mã" · VN-INDEX giá + thay đổi (số thật từ socket, 2 chữ số thập phân) · "Giá x 1000 VNĐ".

---

# [TC_CHTN_07] Mặc định chọn dòng đầu — panel "Chi tiết vị thế"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Dòng 1 được chọn (`aria-selected=true`, tô sáng).
- [ ] Panel: mã FPT + tên công ty; "Mở 01/10/26 · N ngày · +8.50 /cp"; góc phải "+8.5%".
- [ ] Mục "Điểm mua trên biểu đồ" (có nút "Xem biểu đồ"); "Lịch sử lệnh mua" 3 dòng (Mua #1 01/10/26 95.00 +14.2% …).

---

# [TC_CHTN_08] Bấm 1 dòng → panel đổi theo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm dòng SHS.

## Kết quả mong đợi
- [ ] Dòng SHS được chọn, dòng 1 bỏ chọn; panel hiện SHS, "+12.3%", 2 lệnh mua.

---

# [TC_CHTN_09] Chọn dòng bằng bàn phím

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Focus dòng VCB, nhấn Enter. Focus dòng ACV, nhấn Space.

## Kết quả mong đợi
- [ ] Panel lần lượt hiện VCB, ACV.

---

## Nhóm: Sắp xếp

# [TC_CHTN_10] Sắp theo "Lãi/lỗ", bấm lại để bỏ sắp xếp

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm tiêu đề "Lãi/lỗ". 2. Bấm lại lần nữa.

## Kết quả mong đợi
- [ ] Bước 1: SHS, FPT, ACV, HPG, VCB (lãi cao → thấp), `aria-sort=descending`, STT đánh lại 1–5.
- [ ] Bước 2: về thứ tự mặc định, `aria-sort=none` (mỗi cột chỉ 1 chiều sắp).

---

# [TC_CHTN_11] Sắp theo "Ngành" (A → Z) và "Giá vốn"; cột không sắp được

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Ngành: SHS, FPT, ACV, VCB, HPG (`aria-sort=ascending`). Giá vốn: FPT, ACV, VCB, HPG, SHS; cột Ngành về `none`.
- [ ] STT, Mã CK, Mua gần nhất không có nút sắp xếp.

---

# [TC_CHTN_12] Đổi sắp xếp → panel về mã đầu danh sách mới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn VCB, rồi bấm sắp "Lãi/lỗ".

## Kết quả mong đợi
- [ ] Panel chuyển sang SHS (dòng đầu sau khi sắp).

---

## Nhóm: Lọc

# [TC_CHTN_13] Tìm theo mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Gõ "hp" vào ô "Tìm mã cổ phiếu…". 2. Bấm nút xoá (×).

## Kết quả mong đợi
- [ ] Chỉ còn HPG, STT giữ "2" (lọc không đánh số lại); chân bảng "1 / 5 mã"; panel hiện HPG.
- [ ] Xoá → ô rỗng, đủ 5 dòng, nút × ẩn.

---

# [TC_CHTN_14] Tìm mã không có → thông báo + "Bỏ lọc"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Gõ "ZZZ": "Không có mã nào khớp bộ lọc.", không có bảng/panel, chân bảng "0 / 5 mã".
- [ ] Bấm "Bỏ lọc": đủ 5 dòng, ô tìm rỗng.

---

# [TC_CHTN_15] Lọc theo sàn

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Nút: Tất cả (mặc định) · HOSE · HNX · UPCOM. HNX → SHS; UPCOM → ACV; HOSE → FPT, HPG, VCB; Tất cả → 5 dòng.

---

# [TC_CHTN_16] Lọc theo ngành

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Ô chọn: "Tất cả ngành" + ngành có trong nhóm đang xem, xếp A → Z (CHỨNG KHOÁN, CÔNG NGHỆ, HÀNG KHÔNG, NGÂN HÀNG, THÉP).
- [ ] Chọn NGÂN HÀNG → chỉ VCB, panel VCB; chọn lại "Tất cả ngành" → 5 dòng.

---

# [TC_CHTN_17] Kết hợp nhiều bộ lọc → "Bỏ lọc" đưa tất cả về mặc định

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] HNX + THÉP → thông báo rỗng; "Bỏ lọc" → sàn "Tất cả", ngành "Tất cả ngành", 5 dòng.

---

## Nhóm: Nhóm mẫu hình

# [TC_CHTN_18] Nhóm "Hai đáy" — cột, bộ lọc trạng thái, thứ tự

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Cột: STT · Mã CK · Ngành · Trạng thái · Giá hiện tại · Tới vùng break · Trên vùng huỷ · LN mục tiêu · LN còn lại · Phát hiện.
- [ ] Có nhóm nút trạng thái: Tất cả · Chờ xác nhận · Nguy cơ huỷ · Thành công (nhóm AI không có).
- [ ] Thứ tự: Thành công → Chờ xác nhận → Nguy cơ huỷ, trong nhóm LN còn lại cao trước: MWG, DGC, GEX, PVS. "4 mã".

---

# [TC_CHTN_19] Số liệu dòng mẫu hình

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] DGC: 97.00 · −3.0% (tới break, in đậm vì đang chờ xác nhận) · +14.1% · +15.0% · +18.6% · 25/10/26.
- [ ] PVS (Nguy cơ huỷ): ô "Trên vùng huỷ" in đậm.

---

# [TC_CHTN_20] Lọc trạng thái

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Nguy cơ huỷ → PVS (STT 4); Thành công → MWG; Chờ xác nhận → DGC, GEX.

---

# [TC_CHTN_21] Panel "Chi tiết mẫu hình"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhóm Hai đáy, bấm DGC.

## Kết quả mong đợi
- [ ] Tiêu đề: DGC + nhãn "Chờ xác nhận"; "Hai đáy · phát hiện N ngày trước"; góc phải LN còn lại +18.6%.
- [ ] Mục "Mẫu hình trên biểu đồ"; bảng 3 mốc: Giá mục tiêu 115.00 (+18.6%), Vùng break 100.00 (+3.1%), Vùng huỷ 85.00 (−12.4%).
- [ ] "Các điểm của mẫu hình": 3 dòng (Đáy 1, Đỉnh giữa 20/09/26 100.00, Đáy 2).

---

# [TC_CHTN_22] Đổi nhóm → bỏ sắp xếp; ngành không còn → "Tất cả ngành"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhóm AI: sắp "Lãi/lỗ", lọc ngành HÀNG KHÔNG. 2. Sang "Hai đáy". 3. Về "AI Mua/Bán".

## Kết quả mong đợi
- [ ] Bước 2: ngành về "Tất cả ngành", 4 dòng. Bước 3: thứ tự mặc định, cột Lãi/lỗ `aria-sort=none`.

---

# [TC_CHTN_23] Mở sẵn nhóm qua URL `?g=`

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] `?g=default_pattern_vai_day` → nhóm "Vai đầu vai ngược" được chọn, bảng VHM.
- [ ] `?g=khong_ton_tai` → về nhóm "AI Mua/Bán".

---

# [TC_CHTN_24] Tham số gọi API + không gọi lại khi đổi nhóm

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Body tìm mẫu: `patterns` = Hai đáy, Vai đầu vai ngược; `status` = forming, potential_break, confirmed;
  `endDateFrom` = hôm nay lùi 1 năm, `endDateTo` = hôm nay; `entryGate: true`. API xếp hạng có `sortBy=recent`.
- [ ] Đổi nhóm qua lại: mỗi API chỉ gọi 1 lần (cache trong phiên).

---

## Nhóm: Trạng thái rỗng / lỗi

# [TC_CHTN_25] Nhóm AI rỗng

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] "Chưa có mã nào trong danh mục AI đang lãi.", không có nút "Bỏ lọc", không có panel, không có ô lọc ngành, "0 mã".

---

# [TC_CHTN_26] API xếp hạng lỗi 500 → "Thử lại"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Nhóm AI: "Không tải được bảng xếp hạng. Thử lại sau." + nút "Thử lại"; nhóm Hai đáy vẫn có 4 dòng.
- [ ] API hết lỗi, bấm "Thử lại" → bảng AI 5 dòng (gọi API lần 2).

---

## Nhóm: Điều hướng ra ngoài

# [TC_CHTN_28] "Quản lý thông báo"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Link trỏ `/trung-tam-thong-bao?view=signal`; bấm → chuyển sang Trung tâm thông báo đúng URL.

---

# [TC_CHTN_29] Nút "Xem biểu đồ" ở panel

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chọn HPG, bấm nút "Xem biểu đồ" (góc mục biểu đồ của panel).

## Kết quả mong đợi
- [ ] Mở modal biểu đồ nhanh của HPG.

---

## Nhóm: Dữ liệu thật & phân quyền

# [TC_CHTN_30] Dữ liệu thật

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Có ≥ 1 dòng, mỗi dòng có mã; cột Lãi/lỗ dạng "+x.x%".
- [ ] Nếu có nhóm mẫu hình: trạng thái mỗi dòng ∈ {Thành công, Chờ xác nhận, Nguy cơ huỷ}.

---

# [TC_CHTN_31] Tài khoản Free

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Free KHÔNG bị khoá cả màn (`features_disabled` không có `bo_loc_co_hoi_tiem_nang`) — máy chủ ẩn mã, web làm mờ.

## Các bước thực hiện
1. Đăng nhập Free, mở `/co-hoi-tiem-nang`. Bấm "Mở khoá".

## Kết quả mong đợi
- [ ] Dòng "Mở khóa toàn bộ cơ hội — Nâng cấp để xem đầy đủ thông tin & giá mục tiêu" + nút "Mở khoá"; nhóm có nhãn "Pro".
- [ ] Không có ô tìm mã, không có lọc sàn.
- [ ] Ô mã là chữ giữ chỗ làm mờ "KFS HOSE" (title "Nâng cấp để xem mã"), giá vốn "00.00"; panel không có biểu đồ.
- [ ] "Mở khoá" → mở bảng "Chọn dịch vụ".

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 30 |
| **Tổng** | **30** |

**Cập nhật 10/11/2026:** xoá TC_CHTN_27 (bug được user chấp nhận). 31 → 30 TC.
