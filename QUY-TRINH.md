# Quy trình cập nhật auto test khi web thay đổi

Áp dụng cho dự án test Playwright của web `stocks` (kfsp.vn). Dùng khi có **màn mới**, **tính năng mới** trên màn
đã có, hoặc **màn bị sửa giao diện**.

> Quy trình chi tiết cho người/AI thực hiện nằm ở skill [`.claude/skills/gen-web-testcase/SKILL.md`](.claude/skills/gen-web-testcase/SKILL.md).
> File này là bản tóm tắt + các quy ước đã chốt (cập nhật 10/11/2026).

---

## 1. Chuẩn bị

| Việc | Cách làm |
|---|---|
| Node 20 | Máy mặc định Node 14 (không chạy được Playwright). Git Bash: `export PATH="/c/Users/tranv/AppData/Local/nvm/v20.19.4:$PATH"` |
| Route dạng `/xxx` trên Git Bash | `export MSYS_NO_PATHCONV=1` (không thì `/login` bị đổi thành đường dẫn Windows) |
| Web cần test | `BASE_URL` trong `.env` (hiện `http://localhost:8080` — dev server repo `stocks`, nhánh `preprod`). 26 spec mới chạy theo `PREV2_BASE_URL` (hiện `https://kfsp.vn`) |
| Tài khoản | `.env`: `TEST_USER_*` (trả phí), `FREE_USER_*` (miễn phí — **chỉ giữ 1 phiên**, đừng đăng nhập chỗ khác khi đang chạy test) |
| Source web | Chỉ **đọc** repo `stocks` (`git -C ../stocks show origin/preprod:<file>`). Không sửa, không `npm install` vào repo `stocks` |

---

## 2. Ba trường hợp

### A. Màn mới (chưa có test)

1. Tìm route + component trong `stocks/src/router/index.js`, đọc file `.vue`.
2. Kiểm kê từ **source + giao diện thật** (`npx tsx scripts/inspect-dom.ts <route> --name <slug> --login`, xem ảnh và
   `.aria.txt` trong `.dom-inspect/`). **Không cần đọc Google Sheet** — viết theo văn phong các file trong `testcases/`.
3. Độ dài:
   - Màn **chủ yếu hiển thị dữ liệu** → gọn **~10–15 case**: tải trang, khối/bảng/biểu đồ chính, cột + định dạng dữ liệu
     (số, %, ngày), mỗi thao tác chính 1 case (đổi tab/lọc/sắp xếp/bấm mã), 1 case lỗi API (mock 500), 1 case Free.
   - Màn **nhiều chức năng** (form, tạo/sửa/xoá) → viết kỹ hơn: validate, luồng thành công/thất bại, lỗi mạng, bấm đúp.
4. Tạo 3 file:
   - `testcases/<slug>.md` — ID `TC_<MÀN>_01`, `_02`… liên tục.
   - `pages/<Ten>Page.ts` — page object.
   - `tests/<slug>.spec.ts` — tên test bắt đầu bằng đúng ID trong `.md`.

### B. Màn đã có test — thêm tính năng mới

- Giữ nguyên case cũ, thêm case mới vào **cuối dãy số** của màn.
- Tính năng lớn → tách **bộ test riêng** (ví dụ `canh-bao-gia`, `bang-gia-ghim`, `cong-dong-media-cot-phai`).

### C. Màn đã có test — sửa giao diện

1. Xem code đổi gì từ ngày viết test:
   `git -C ../stocks log --since=<ngày> --oneline origin/preprod -- <thư mục component>`
2. Chạy bộ test **1 lần** để biết case nào vỡ.
3. **Chỉ sửa case vỡ** — không kiểm kê lại toàn màn, không thêm case hàng loạt.
   - Locator/text đổi → sửa page object + spec.
   - Tính năng bị bỏ → **xoá hẳn** case khỏi `.md` + spec (không giữ dạng N/A).
   - Nghi là bug → **không sửa test cho khớp**; đánh dấu `test.fixme` + 1 dòng lý do, báo lại.
4. Thêm 1 dòng `**Cập nhật <ngày>:** …` ở case đã sửa và block đầu file `.md`.

---

## 3. Quy tắc bắt buộc (mọi trường hợp)

1. **Không ghi dữ liệu thật lên production.** Web gọi backend production (`api2.kfsp.vn`…):
   - Đăng nhập qua [`pages/Prev2Session.ts`](pages/Prev2Session.ts) — tự chặn `updateusersettings`/`delusersettings`.
   - Gắn **lưới an toàn**: chặn mọi request không phải GET tới `*.kfsp.vn`, `*.vietpointer.vn`, `*.kungfustockspro.live`;
     `afterEach` kiểm tra không request ghi nào lọt. Dùng sẵn: `useFaSafetyNet` ([pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts)),
     [`pages/ReadOnlySafetyNet.ts`](pages/ReadOnlySafetyNet.ts), [`pages/LegacySafetyNet.ts`](pages/LegacySafetyNet.ts).
   - Thao tác tạo/sửa/xoá (đăng bài, thêm watchlist, đặt lệnh, tạo cảnh báo…) → **giả lập** bằng `page.route()`.
   - POST chỉ đọc (tìm kiếm, phân trang) cho qua bằng danh sách trắng, ghi rõ lý do.
2. **Pass 1 lần là đủ.** Case sửa 2 lần vẫn không pass → `test.fixme` + lý do, làm tiếp.
3. **Cập nhật [TRACKER.md](TRACKER.md)** mỗi khi thêm/gỡ `test.fixme` (bảng của màn + dòng "Tổng hiện tại").
4. **Validate lỏng hơn app mobile không phải bug** (SĐT, email, mật khẩu, họ tên…) — không viết test cho phần này.
5. Các lưu ý kỹ thuật đã gặp:
   - App đã tắt toast thành công (`$toast.success`) → đừng chờ toast thành công.
   - Robot AI (`.ai-logo-wrapper`) có thể che nút → kiểm tra trước khi bấm.
   - Danh sách mã (`list_mack`) tải muộn → chờ xong mới gõ mã.
   - Tài khoản Free bị khoá: kiểm tra đúng `.blurred-image` hoặc `.free-user-img-wrapper` (tránh test "pass sai").

---

## 4. Chạy test

```bash
# 1 màn
npx playwright test tests/<slug>.spec.ts --project=chromium --reporter=list

# chỉ chạy lại case fail lần trước
npx playwright test --last-failed --project=chromium

# kiểm tra spec còn đọc được (không chạy thật)
npx playwright test --list --project=chromium

# toàn bộ (~1354 test, ~1,5–2 tiếng với 3 luồng)
npx playwright test --project=chromium
```

Kết quả chạy (`test-results/`, `playwright-report/`, `.auth/`, `.env`…) đã nằm trong `.gitignore` — không lên git.

---

## 5. Hoàn tất

1. Báo lại: số case trước → sau, kết quả chạy, case `fixme` mới, bug nghi vấn (nếu có).
2. Kiểm tra `TRACKER.md` khớp số `test.fixme` thật trong spec.
3. Commit + push khi được duyệt (message hiện dùng: `update code test`).

**Thời gian tham khảo:** sửa 1 màn đổi giao diện ~15–30 phút · viết mới 1 màn ~20–40 phút. Nhiều màn cùng lúc có thể
chia tối đa 3 người/agent chạy song song (mỗi bên `--workers=2`, tránh quá tải máy và đá phiên tài khoản Free).
