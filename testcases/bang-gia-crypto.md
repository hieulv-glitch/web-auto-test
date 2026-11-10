# Màn hình: Bảng giá crypto

- **URL:** `/crypto` (menu **Thị Trường › Bảng giá crypto**; ô Crypto trên Dashboard cũng mở tới đây).
- **Phạm vi:** 3 thẻ đầu trang (Top vốn hóa · Vốn hóa thị trường · Chỉ số tâm lý), bảng coin (20 dòng/trang, sắp xếp,
  phân trang), 4 biểu đồ vốn hoá (Total 1/2/3, Dominance), cửa sổ biểu đồ khi bấm tên coin, lỗi API.
- **Component** (nhánh `preprod` của `stocks`, đọc 10/11/2026): `src/views/pages/Crypto.vue`.
- **Nguồn dữ liệu:** `GET /api/crypto/get-list-coin-paging?page&pagesize=20`, `GET /api/crypto/get-total_coin` (api2.kfsp.vn);
  giá, biến động 1h/24h/7D, KLGD, vốn hoá, biểu đồ 7 ngày, tỷ trọng, chỉ số tâm lý về qua socket `ta.kfsp.vn` (chỉ đọc).
- **Code test:** [tests/bang-gia-crypto.spec.ts](../tests/bang-gia-crypto.spec.ts), Page Object
  [pages/BangGiaCryptoPage.ts](../pages/BangGiaCryptoPage.ts). Chạy: `npx playwright test tests/bang-gia-crypto.spec.ts
  --project=chromium --workers=2` (localhost:8080, viewport 1600×900).
- **Phương pháp sinh:** màn chưa từng có test; viết gọn theo source preprod + DOM thật (không đọc Google Sheet). Dữ liệu
  thật (giá biến động liên tục) → kiểm cấu trúc/định dạng, không kiểm giá trị cụ thể.
- **Phân quyền:** màn không có khoá Free (không có `ProtectedView`) → không có case Free.

**AN TOÀN DỮ LIỆU:** màn chỉ đọc. `Prev2Session` chặn ghi setting; `useReadOnlySafetyNet` huỷ mọi request không phải
GET/HEAD/OPTIONS tới hệ thống KFSP (không chặn GET, websocket, host ngoài) và `afterEach` assert không có request nào bị huỷ.

| Trạng thái | Ý nghĩa |
|---|---|
| 🆕 Testcase mới | Đã tự động hoá |
| ⚠️ Cần xác nhận thêm | Hành vi cần dev xác nhận (giữ `test.fixme`) |

---

## Nhóm: Điều hướng & hiển thị

# [TC_CRYPTO_01] Vào trang từ menu "Thị Trường › Bảng giá crypto"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Chuyển sang `/crypto`, bảng coin hiển thị; tiêu đề "Thị Trường" trên menu được tô sáng.

# [TC_CRYPTO_02] 3 thẻ đầu trang
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] "🚀 Top vốn hóa": 3 coin, coin đầu là Bitcoin (BTC), mỗi dòng có "$ <số><K/M/B/T>".
- [ ] "🔥 Vốn hóa thị trường": tổng vốn hoá, thay đổi, tỷ trọng Bitcoin · Ethereum · Khác cộng lại ≈ 100%.
- [ ] "🙂 Chỉ số tâm lý": 1 trong 5 nhãn Sợ hãi tột độ / Sợ hãi / Trung lập / Tham lam / Tham lam tột độ.

# [TC_CRYPTO_03] Bảng coin mặc định
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] 9 cột: # · Tiền ảo · Giá · 1h · 24h · 7D · KLGD 24h · Vốn hóa TT · 7 ngày qua.
- [ ] 20 dòng, STT 1→20, dòng 1 "Bitcoin BTC"; API gọi `page=1`.

# [TC_CRYPTO_04] Định dạng dữ liệu
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Giá dạng `$x,xxx.xx`; 1h/24h/7D dạng `x.xx%` có màu theo dấu (`text-upchange` / `text-downchange` / `text-nochange`).
- [ ] KLGD 24h và Vốn hóa TT dạng `$x,xxx`; vốn hoá dòng 1 ≥ dòng 2; cột "7 ngày qua" có biểu đồ nhỏ.

# [TC_CRYPTO_05] Sắp xếp theo cột "Giá"
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bấm tiêu đề "Giá" → giá tăng dần; bấm lần 2 → giảm dần (sắp trong trang hiện tại).

# [TC_CRYPTO_06] Phân trang
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bấm trang "2" → gọi API `page=2`, 20 dòng, STT bắt đầu 21, dòng đầu không còn là Bitcoin.

# [TC_CRYPTO_07] Chuyển giữa bảng coin và biểu đồ vốn hoá
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bấm thẻ "Chỉ số tâm lý" → không đổi gì (vẫn bảng).
- [ ] Bấm thẻ "Vốn hóa thị trường" → bảng ẩn, hiện 4 biểu đồ: Total 1 · Total 2 (ngoại trừ Bitcoin) · Total 3 (ngoại trừ
  Bitcoin và Ethereum) · Dominance - Tỷ lệ thống trị.
- [ ] Bấm thẻ "Top vốn hóa" → bảng hiện lại, biểu đồ ẩn.

# [TC_CRYPTO_08] Bấm tên coin
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Mở cửa sổ biểu đồ dùng chung (modal xxxl), tiêu đề chứa mã coin (BTC…).

---

## Nhóm: Lỗi API

# [TC_CRYPTO_09] API danh sách coin lỗi 500
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bảng hiện "Không có dữ liệu"; 3 thẻ vẫn hiện, thẻ Top vốn hóa không có coin; trang không vỡ.

# [TC_CRYPTO_10] API tổng số coin lỗi 500
- **Trạng thái:** 🆕 Testcase mới
## Kết quả mong đợi
- [ ] Bảng trang 1 vẫn đủ 20 dòng; thanh phân trang không có số trang 2.
