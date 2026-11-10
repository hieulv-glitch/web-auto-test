# Màn hình: Danh sách mã có BCTC mới

- **URL:** `/bctc-new-list` (menu **Phân tích cơ bản › Cập nhật BCTC mới** — ẩn với Free; cũng mở từ menu tài khoản và nút
  "BCTC Mới" ở Phân tích cơ bản).
- **Phạm vi:** tiêu đề, 5 bộ lọc (Kỳ BCTC · Mã CK · Sàn · Ngành · Watchlist), dòng "Thời gian" + "SL CP có báo cáo", bảng
  (định dạng số, sắp xếp, phân trang 20 dòng), bấm mã mở biểu đồ, lỗi API, menu với Free.
- **Ngoài phạm vi:** route `/update-bctc` ("Cập nhật BCTC", nhập liệu BCTC) yêu cầu quyền `coworker` mà tài khoản test không
  có → bỏ qua.
- **Component** (nhánh `preprod` của `stocks`, đọc 10/11/2026): `src/views/BctcNewList.vue`,
  `src/views/filterCanslim/SearchFilterStrockCode.vue`.
- **API (GET, api2.kfsp.vn):** `/api/stocks/filter-bctc-new?type=bs&thoigian=quarter|year&year&quarter&myWatchListId` →
  `{success, data: {bctc_news, statistical}}`. Gọi lại khi đổi Kỳ BCTC / Watchlist; lọc Mã CK, Sàn, Ngành làm ở trình duyệt.
- **Code test:** [tests/bctc-moi.spec.ts](../tests/bctc-moi.spec.ts), Page Object [pages/BctcMoiPage.ts](../pages/BctcMoiPage.ts).
  Chạy: `npx playwright test tests/bctc-moi.spec.ts --project=chromium --workers=2` (localhost:8080, viewport 1600×900).
- **Phương pháp sinh:** màn chưa từng có test; viết gọn theo source preprod (không đọc Google Sheet). TC_02/03/07 dùng dữ
  liệu thật, còn lại dùng API giả lập (4 mã FPT/VNM/SHS/BSR hoặc 25 mã M01–M25).

**AN TOÀN DỮ LIỆU:** màn chỉ đọc. `Prev2Session` chặn ghi setting; `useReadOnlySafetyNet` huỷ mọi request không phải
GET/HEAD/OPTIONS tới hệ thống KFSP và `afterEach` assert không có request nào bị huỷ.

| Trạng thái | Ý nghĩa |
|---|---|
| 🆕 Testcase mới | Đã tự động hoá |
| ⚠️ Cần xác nhận thêm | Hành vi cần dev xác nhận (giữ `test.fixme`) |

---

## Nhóm: Hiển thị

# [TC_BCTCMOI_01] Vào trang từ menu "Phân tích cơ bản › Cập nhật BCTC mới"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Chuyển sang `/bctc-new-list`, tiêu đề "Danh sách các mã có BCTC mới".

# [TC_BCTCMOI_02] Giao diện ban đầu
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Kỳ BCTC = "Quý" (Quý / Năm); Mã CK trống; Sàn = "Tất cả" (Tất cả / HOSE / HNX / UPCOM); Ngành = "Tất cả" + danh sách
  ngành; có ô Watchlist.
- [ ] "Thời gian: Q<quý trước> <năm>" (đang ở Q1 → Q4 năm trước).
- [ ] API gọi `type=bs&thoigian=quarter&year=<năm>&quarter=Q<n>&myWatchListId=all`.

# [TC_BCTCMOI_03] Bảng dữ liệu thật
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] 10 cột: Mã · Ngành · Sàn · DT thuần - Q (tỷ) · Tăng trưởng DTT - Q (%) · LN sau thuế - Q (tỷ) · Tăng trưởng LN sau
  thuế - Q (%) · EPS - Q (VNĐ) · EPS - TTM (VNĐ) · PE - D (lần).
- [ ] "SL CP có báo cáo: N mã" với N > 0; trang 1 hiện min(N, 20) dòng; mã in hoa, sàn HOSE/HNX/UPCOM, các ô số đúng định dạng.

# [TC_BCTCMOI_04] Định dạng số
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Phân cách nghìn, tối đa 2 số lẻ (`1234.567` → `1,234.57`, `6000.4` → `6,000.4`); cột tăng trưởng thêm `%`.
- [ ] Tăng trưởng > 0 màu tăng, < 0 màu giảm, = 0 màu đứng; giá trị rỗng hiển thị `0`.

---

## Nhóm: Bộ lọc & thao tác

# [TC_BCTCMOI_05] Kỳ "Năm"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Gọi lại API `thoigian=year`; cột đổi sang "- Y", không còn "EPS - TTM (VNĐ)" (9 cột); "Thời gian: <năm − 1>".

# [TC_BCTCMOI_06] Lọc Sàn
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Chọn "HNX" → chỉ còn mã HNX, "SL CP có báo cáo: 1 mã"; về "Tất cả" → đủ 4 mã; không gọi lại API.

# [TC_BCTCMOI_07] Lọc Ngành (dữ liệu thật)
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Chọn ngành của dòng đầu → mọi dòng còn lại cùng ngành; số lượng khớp số dòng (khi < 20).

# [TC_BCTCMOI_08] Lọc Mã CK
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Gõ "VNM", chọn gợi ý → chỉ còn dòng VNM, "SL CP có báo cáo: 1 mã".

# [TC_BCTCMOI_09] Phân trang
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] 25 mã → trang 1 có 20 dòng, "25 mã"; bấm trang 2 → 5 dòng, bắt đầu từ M21.

# [TC_BCTCMOI_10] Sắp xếp theo "PE - D (lần)"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bấm 1 lần → tăng dần (SHS, FPT, VNM, BSR); lần 2 → giảm dần.

# [TC_BCTCMOI_11] Bấm mã
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Mở cửa sổ biểu đồ dùng chung, tiêu đề là mã (FPT).

---

## Nhóm: Lỗi API & phân quyền

# [TC_BCTCMOI_12] API danh sách lỗi 500
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bảng không có dòng, "SL CP có báo cáo: 0 mã"; đổi Kỳ BCTC vẫn gọi lại API.

# [TC_BCTCMOI_13] Tài khoản Free
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Menu "Phân tích cơ bản" có "Vĩ mô" nhưng không có "Cập nhật BCTC mới" (`hideForFree`).
