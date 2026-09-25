# web-auto-test

Bộ test tự động (Playwright) cho web app `stocks`, độc lập với source code app (chạy Node 20 riêng, không phụ thuộc Node 14 mà `stocks` đang dùng).

## Cấu trúc

```
playwright.config.ts     # cấu hình Playwright (baseURL, trình duyệt, report...)
tests/                    # các file test .spec.ts
pages/                    # Page Object Model cho từng màn hình
utils/google-sheets.ts    # đọc testcase từ Google Sheet qua Service Account
scripts/                  # script tiện ích (check kết nối sheet...)
.env.example              # mẫu biến môi trường, copy thành .env
```

## Cài đặt lần đầu

Dự án dùng Node >= 18 (khuyến nghị 20). Nếu máy đang dùng nvm-windows với nhiều bản Node, hãy `nvm use 20.19.4` trước khi chạy các lệnh dưới, hoặc trỏ thẳng tới `node.exe`/`npm.cmd` trong thư mục bản Node đó.

```bash
npm install
npx playwright install chromium   # tải trình duyệt Chromium (chỉ cần 1 lần) — dự án chỉ test Chromium
cp .env.example .env     # rồi điền các giá trị thực tế
```

## Kết nối Google Sheet (Service Account) — hướng dẫn chi tiết

Mục tiêu: cho phép script đọc danh sách testcase từ Google Sheet mà không cần đăng nhập thủ công mỗi lần chạy.

### Bước 1 — Tạo Google Cloud Project (nếu chưa có)
1. Vào https://console.cloud.google.com/
2. Tạo project mới (hoặc dùng project có sẵn).

### Bước 2 — Bật Google Sheets API
1. Vào **APIs & Services → Library**.
2. Tìm "Google Sheets API" → bấm **Enable**.

### Bước 3 — Tạo Service Account
1. Vào **APIs & Services → Credentials → Create Credentials → Service Account**.
2. Đặt tên bất kỳ (ví dụ `playwright-testcase-reader`), bấm **Create and Continue**, có thể bỏ qua phần gán role, bấm **Done**.
3. Vào service account vừa tạo → tab **Keys → Add Key → Create new key → JSON**. File JSON sẽ tự tải về máy — **giữ file này bí mật, không commit lên git**.

File JSON có dạng:
```json
{
  "client_email": "playwright-testcase-reader@<project-id>.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  ...
}
```

### Bước 4 — Share Google Sheet cho Service Account
1. Mở Google Sheet chứa testcase.
2. Bấm **Share**, dán email trong `client_email` ở trên vào, chọn quyền **Viewer** (chỉ đọc là đủ).

### Bước 5 — Điền vào `.env`
```
GOOGLE_SHEETS_SPREADSHEET_ID=<lấy từ URL: docs.google.com/spreadsheets/d/ĐÂY_LÀ_ID/edit>
GOOGLE_SHEETS_TAB_NAME=Testcases          # tên tab chứa testcase
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email ở trên>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<private_key ở trên, giữ nguyên các \n>
```

### Bước 6 — Kiểm tra kết nối
```bash
npm run sheets:check
```
Script sẽ in ra danh sách các tab trong sheet và 3 dòng dữ liệu đầu tiên nếu tìm thấy tab đúng tên — xác nhận kết nối hoạt động.

## Chạy test

```bash
npm test                # chạy toàn bộ test (headless, chỉ Chromium)
npm run test:headed     # chạy có hiển thị trình duyệt
npm run test:ui         # mở Playwright UI mode (debug trực quan)
npm run test:report     # xem báo cáo HTML lần chạy gần nhất
```

## Việc còn lại (chưa làm ở bước này)

- Chưa sinh testcase cụ thể (đang chờ: URL môi trường staging/production, thông tin đăng nhập nếu cần, và chọn module thí điểm).
- Chưa viết Page Object / test case thật cho từng màn hình.
