# Màn hình: Vĩ mô

- **URL:** `/vi-mo` (menu **Phân tích cơ bản › Vĩ mô**; link "Vĩ mô" trên Dashboard cũng dẫn tới đây).
- **Phạm vi:** trang **Tổng quan** (infographic 9 khối + 6 chỉ số nổi bật) và trang **chi tiết** 12 nhóm chỉ tiêu (thanh tab,
  ô chọn loại / kỳ báo cáo / kiểu dữ liệu, khung mô tả, biểu đồ, bảng số liệu), phân quyền Free.
- **Component** (nhánh `preprod` của `stocks`, đọc 10/11/2026): `src/views/macro/index.vue` (khung, thanh tab, ô chọn, gọi
  API chi tiết), `tongQuan.vue`, `detail_table.vue`, `*_description.vue`.
- **API (chỉ GET, host `api2.kfsp.vn`):** `GET /api/stocks/get-data-macro` (Tổng quan),
  `GET /api/stocks/get-data-macro-by-type?type&kieu_baocao&kieu_dulieu&typeTab` (chi tiết — mảng 2 chiều, hàng đầu là
  `["Chỉ tiêu","Đơn vị", kỳ…]`).
- **Code test:** [tests/vi-mo.spec.ts](../tests/vi-mo.spec.ts), Page Object [pages/ViMoPage.ts](../pages/ViMoPage.ts).
  Chạy: `npx playwright test tests/vi-mo.spec.ts --project=chromium --workers=2` (localhost:8080, viewport 1600×900).
- **Phương pháp sinh:** màn chưa từng có test; viết nhanh theo kiểm kê source preprod + DOM thật (không đọc Google Sheet).
  Case dữ liệu thật kiểm cấu trúc/định dạng; case định dạng/lỗi dùng API giả lập (`page.route`).

**AN TOÀN DỮ LIỆU:** màn chỉ đọc. Đăng nhập bằng `Prev2Session` (chặn ghi setting); `useReadOnlySafetyNet`
(`pages/ReadOnlySafetyNet.ts`) huỷ mọi request không phải GET/HEAD/OPTIONS tới `*.kfsp.vn` / `*.vietpointer.vn` /
`*.kungfustockspro.live` và `afterEach` assert không có request nào bị huỷ.

| Trạng thái | Ý nghĩa |
|---|---|
| 🆕 Testcase mới | Đã tự động hoá |
| ⚠️ Cần xác nhận thêm | Hành vi đo được cần dev xác nhận (giữ `test.fixme`) |

**Ghi chú hành vi:** vào trang luôn ở Tổng quan, **không có thanh tab** — chỉ sang chi tiết qua "Xem chi tiết" (→ GDP). Đổi
tab không đổi URL nên F5 luôn về Tổng quan. Mỗi lần đổi tab app gọi API chi tiết 2–3 lần trùng nhau (3 watcher) — không
ảnh hưởng hiển thị, chỉ ghi nhận.

---

## Nhóm: Điều hướng & Tổng quan

# [TC_VIMO_01] Vào trang từ menu "Phân tích cơ bản › Vĩ mô"
- **Trạng thái:** 🆕 Testcase mới
## Các bước thực hiện
1. Đăng nhập, vào `/dashboard`, rê chuột vào "Phân tích cơ bản", bấm "Vĩ mô".
## Kết quả mong đợi
- [ ] Chuyển sang `/vi-mo`, trang Tổng quan hiển thị.

# [TC_VIMO_02] Giao diện Tổng quan
- **Trạng thái:** 🆕 Testcase mới
## Các bước thực hiện
1. Vào `/vi-mo`.
## Kết quả mong đợi
- [ ] Tiêu đề "TỔNG QUAN TÌNH HÌNH KINH TẾ <n> THÁNG ĐẦU NĂM <năm>", link "Xem chi tiết".
- [ ] 6 bong bóng chỉ số (GDP, IIP, Bán lẻ và dịch vụ, Cán cân thương mại, FDI thực hiện, CPI): 5 cái dạng `±x%`, cán cân
  thương mại dạng `±x tỷ USD`.
- [ ] Không có thanh tab / ô chọn; cuối trang có "Tuyên bố trách nhiệm/Disclaimer".

# [TC_VIMO_03] Tổng quan có đủ 9 khối
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Theo thứ tự: Tổng thu nhập GDP · Sản xuất công nghiệp IIP · Bán lẻ và dịch vụ · Cán cân thương mại · Đầu tư ·
  Khách quốc tế · Vận tải · Doanh nghiệp · Chỉ số giá.
- [ ] Khối Đầu tư có "Ngân sách nhà nước" + "FDI"; Khách quốc tế có "Châu Á"; Doanh nghiệp có "Đăng ký mới".

# [TC_VIMO_04] Định dạng 6 chỉ số nổi bật
- **Trạng thái:** 🆕 Testcase mới
## Các bước thực hiện
1. Giả lập `tong_quan` = gdp 7.5, iip -1.2, bán lẻ 0, cán cân 23456.789 (triệu USD), fdi 10, cpi 3.21.
## Kết quả mong đợi
- [ ] Hiển thị `+7.5%`, `-1.2%`, `0%`, `+23.46 tỷ USD`, `+10%`, `+3.21%` (số dương có dấu +, cán cân chia 1000, 2 số lẻ).

# [TC_VIMO_05] Tiêu đề lấy từ kỳ mới nhất của Cán cân thương mại
- **Trạng thái:** 🆕 Testcase mới
## Các bước thực hiện
1. Giả lập kỳ đầu tiên của `can_can_thuong_mai.thoigian` = "T7 2031".
## Kết quả mong đợi
- [ ] Tiêu đề "TỔNG QUAN TÌNH HÌNH KINH TẾ 7 THÁNG ĐẦU NĂM 2031".

# [TC_VIMO_06] Khối Vận tải — Hành khách ↔ Hàng hóa
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Mặc định "Hành khách": đơn vị các ô là "… hành khách".
- [ ] Bấm "Hàng hóa": nút được tô (chữ trắng), đơn vị đổi (không còn "hành khách"); bấm lại "Hành khách" → trở lại.

# [TC_VIMO_07] API Tổng quan lỗi 500
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Trang không vỡ (không lỗi JS), vẫn ở `/vi-mo`; tiêu đề còn khung "TỔNG QUAN TÌNH HÌNH KINH TẾ THÁNG ĐẦU NĂM" (thiếu số),
  "Xem chi tiết" và tuyên bố trách nhiệm vẫn hiện.

---

## Nhóm: Chi tiết — thanh tab & ô chọn

# [TC_VIMO_08] "Xem chi tiết" → tab GDP
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] 13 tab đúng thứ tự: Tổng quan · GDP · IIP · Bán lẻ và Dịch vụ · CPI · Xuất - Nhập khẩu · Đầu tư NSNN · FDI · Tín dụng ·
  Chỉ tiêu doanh nghiệp · Vận tải · Du lịch · Dân số - Lao động; "GDP" đang chọn.
- [ ] Mô tả trái "GDP - Gross Domestic Product".
- [ ] 3 ô chọn: GDP danh nghĩa/GDP thực (chọn danh nghĩa) · Quý/Lũy kế (chọn Quý) · Giá trị.
- [ ] API chi tiết gọi `type=gdp&kieu_baocao=quarter&kieu_dulieu=value&typeTab=gdphh`; URL vẫn `/vi-mo`.

# [TC_VIMO_09] Bảng chi tiết (dữ liệu thật)
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Cột đầu "Chỉ tiêu", "Đơn vị", sau đó các kỳ dạng `T<tháng> <năm>`.
- [ ] Dòng đầu "TỔNG SỐ" được tô sáng (đang vẽ trên biểu đồ), biểu đồ có canvas.
- [ ] Dòng ghi chú "Số liệu ước tính tại từng tháng theo GSO".

# [TC_VIMO_10] GDP — đổi "GDP thực" và "Tăng trưởng"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Chọn "GDP thực" → gọi `typeTab=gdpss`, ô dữ liệu có thêm "Tăng trưởng".
- [ ] Chọn "Tăng trưởng" → gọi `kieu_dulieu=growth`; bảng vẫn hiện.

# [TC_VIMO_11] GDP — đổi kỳ "Lũy kế (từ đầu năm)"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Gọi `kieu_baocao=cumulative`, bảng vẫn hiện.

# [TC_VIMO_12] Tab IIP
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Mô tả "IIP - Index of Industrial…"; chỉ 1 ô chọn kỳ (Tháng / Lũy kế), không có ô dữ liệu.
- [ ] Gọi `type=iip&kieu_baocao=month&kieu_dulieu=growth`.

# [TC_VIMO_13] Tab Xuất - Nhập khẩu
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] 3 ô chọn: Xuất khẩu/Nhập khẩu · Tháng/Lũy kế · Giá trị/Tăng trưởng; mặc định gọi `typeTab=xuat_khau`.
- [ ] Chọn "Nhập khẩu" → gọi `typeTab=nhap_khau`.

# [TC_VIMO_14] Tab Vận tải
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Ô đầu Hành khách/Hàng hóa; chọn "Hàng hóa" → gọi `typeTab=hang_hoa`, bảng vẫn hiện.

# [TC_VIMO_15] Tab Tín dụng
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Ô kỳ Tháng/Năm, ô dữ liệu Giá trị/Tăng trưởng; chọn "Năm" → gọi `kieu_baocao=year`.
- [ ] Không có dòng ghi chú GSO.

# [TC_VIMO_16] Tab FDI và Dân số - Lao động
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Không có ô chọn nào; FDI gọi `kieu_baocao=cumulative`, Dân số - Lao động gọi `kieu_baocao=year` và cột kỳ là năm.

# [TC_VIMO_17] Các tab còn lại
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bán lẻ và Dịch vụ / CPI / Đầu tư NSNN / Chỉ tiêu doanh nghiệp / Du lịch: tab được chọn, mô tả đúng tiêu đề, gọi đúng
  `type` (`ban_le`, `cpi`, `von_dau_tu`, `chi_tieu_doanh_nghiep`, `du_lich`), bảng có dữ liệu.

# [TC_VIMO_18] Quay lại Tổng quan
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bấm tab "Tổng quan" → trang tổng quan hiện lại, thanh tab và bảng biến mất.

# [TC_VIMO_19] F5 khi đang ở tab chi tiết
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Tải lại trang → về Tổng quan (tab không lưu trên URL).

---

## Nhóm: Chi tiết — bảng & biểu đồ (dữ liệu giả lập)

# [TC_VIMO_20] Định dạng bảng
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Kỳ "T01 2026" hiển thị "T1 2026".
- [ ] Số có phân cách nghìn, tối đa 2 số lẻ (`1,234,567.89`); giá trị 0/null để trống.
- [ ] Đơn vị "%" hiển thị giá trị − 100 (`105.5` → `5.5`, `98.25` → `-1.75`, `100` → trống).
- [ ] Dòng không có đơn vị (tiêu đề nhóm) không hiện giá trị.

# [TC_VIMO_21] Tab Tín dụng — "%" không trừ 100
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] `12.5`, `13`, `14.25` giữ nguyên.

# [TC_VIMO_22] Tab FDI — sắp lại dòng
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] "Vốn thực hiện" lên đầu, dòng "Tổng" đổi tên "Vốn đăng ký" đứng thứ hai, các dòng khác theo sau; "Vốn thực hiện" được
  chọn sẵn lên biểu đồ.

# [TC_VIMO_23] Chọn / bỏ chỉ tiêu trên biểu đồ
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Mặc định chọn dòng đầu tiên có đơn vị (bỏ qua dòng tiêu đề nhóm).
- [ ] Bấm dòng chưa chọn → tô sáng (thêm vào biểu đồ); bấm dòng đã chọn → bỏ tô.
- [ ] Dòng không có đơn vị bấm không có tác dụng; khi chỉ còn 1 chỉ tiêu thì bấm không bỏ được.

# [TC_VIMO_24] Thu gọn / mở khung "Biểu đồ"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bấm "Biểu đồ" → biểu đồ ẩn, bảng vẫn hiện; bấm lại → biểu đồ hiện.

# [TC_VIMO_25] Phóng to biểu đồ
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bấm icon góc phải biểu đồ → cửa sổ lớn (`modal-xl`) chứa biểu đồ; bấm nền → đóng.

---

## Nhóm: Lỗi API & dữ liệu rỗng

# [TC_VIMO_26] API chi tiết lỗi 500
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Không có bảng; thanh tab, ô chọn vẫn hiện và đổi tab vẫn được.

# [TC_VIMO_27] API chi tiết không có chỉ tiêu
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Chỉ có hàng tiêu đề → không hiển thị bảng.

## Nhóm: Phân quyền

# [TC_VIMO_29] Tài khoản Free
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Cả trang thay bằng ảnh mờ `.blurred-image` (ảnh `vi_mo`); rê chuột → "Bạn cần nâng cấp gói hội viên để sử dụng chức
  năng này." + nút "Đăng ký ngay".
- [ ] Không gọi `/api/stocks/get-data-macro`.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| 🆕 Testcase mới | 28 |
| **Tổng** | **28** |

**Cập nhật 10/11/2026:** xoá TC_VIMO_28 (`test.fixme`) (bug được user chấp nhận). 29 → 28 TC.
