---
name: gen-web-testcase
description: Sinh hoặc cập nhật testcase + code Playwright cho 1 màn hình của web stocks (kfsp.vn). Lần đầu cho 1 màn hình thì đọc tab tương ứng trong Google Sheet testcase của app CHỈ để học văn phong/cách viết (không phải checklist quyết định độ phủ) — độ phủ testcase thật sự do tự kiểm kê độc lập trên source code + DOM thật của web quyết định, kể cả khi web có tính năng/luồng mà app hoàn toàn không có. Các lần sau (khi màn đó đã đổi giao diện) KHÔNG đọc lại Google Sheet nữa mà dựa vào chính file testcases/<slug>.md đã có + đọc lại source code + DOM thật để cập nhật. Dùng khi được yêu cầu "gen testcase cho màn X", "sinh testcase màn Y", "màn X đổi giao diện rồi, cập nhật lại", "viết lại testcase cho Z".
---

# Sinh / cập nhật testcase Web + Playwright

Skill này là quy trình đầy đủ (tài liệu `.md` + code `.spec.ts`) cho 1 màn hình của web `stocks`
(https://kfsp.vn), áp dụng lại đúng cách đã làm thành công cho màn Đăng Nhập.

**2 nguyên tắc cốt lõi:**

1. **Google Sheet chỉ là nguồn tham khảo MỘT LẦN cho mỗi màn hình** — dùng để biết app đã test những gì, từ đó
   sinh bộ testcase web tương ứng lần đầu. Sau khi `testcases/<slug>.md` của màn đó đã tồn tại, **không đọc lại
   Google Sheet nữa** — mọi lần cập nhật sau (do UI đổi) đều dựa vào chính file `.md` đã có làm nguồn sự thật,
   cộng với đọc lại source code + DOM thật.

2. **Google Sheet chỉ là ví dụ về VĂN PHONG/CÁCH VIẾT, KHÔNG phải danh sách đủ (checklist) để dịch 1-1.** Sheet
   cho biết: mức độ chi tiết 1 testcase cần có, cách đặt Test View Point, cách viết Kết quả mong đợi cụ thể/
   assert được, các NHÓM/khía cạnh hay kiểm tra (hiển thị UI, required field, format input, luồng thành công/
   thất bại, điều hướng, trạng thái loading/lỗi mạng...). Sheet **KHÔNG** quyết định testcase nào tồn tại trên
   web — vì web là 1 codebase khác, có thể có ít hơn, nhiều hơn, hoặc khác hẳn app (form field khác, luồng khác
   như modal OTP ở Đăng Ký, link/nút chỉ web mới có...). **Việc suy luận màn hình web cần những testcase nào
   phải dựa vào chính source code + DOM thật của web**, không được giới hạn hay lệ thuộc vào số lượng/nội dung
   dòng trong Sheet. Xem chi tiết cách làm ở bước A3 (kiểm kê độc lập) bên dưới — đây là bước bắt buộc, không
   được bỏ qua dù Sheet có vẻ đã "đủ".

## Bước 0 — Xác định slug & nhánh xử lý

1. Xác định `<slug>` cho màn hình: kebab-case, không dấu, ngắn gọn (vd `dang-nhap`, `dang-ky`, `watchlist`,
   `bang-gia`, `phan-tich-fa`). Nếu không chắc slug tương ứng thế nào với tên tab Google Sheet / route web, hỏi
   lại người dùng thay vì đoán.
2. Kiểm tra `testcases/<slug>.md` đã tồn tại chưa (`ls testcases/`):
   - **Chưa có** → đi theo **Nhánh A (Sinh mới)**.
   - **Đã có** → đi theo **Nhánh B (Cập nhật)**.

## Chuẩn bị môi trường (áp dụng mọi lệnh bên dưới)

Máy có nhiều bản Node qua nvm-windows, mặc định là Node 14 (không chạy được Playwright). Trước mọi lệnh
`npm`/`npx` trong skill này:

```bash
export PATH="/c/Users/tranv/AppData/Local/nvm/v20.19.4:$PATH"
```

Khi gọi `scripts/inspect-dom.ts` với route dạng `/xxx` qua Git Bash, **luôn set thêm**
`MSYS_NO_PATHCONV=1`, nếu không Git Bash tự động biến `/login` thành 1 đường dẫn Windows sai:

```bash
export MSYS_NO_PATHCONV=1
```

---

## Nhánh A — Sinh mới testcase cho 1 màn hình lần đầu

### A1. Đọc testcase gốc của app từ Google Sheet — CHỈ để học văn phong, không phải checklist

```bash
npm run sheets:check   # với GOOGLE_SHEETS_TAB_NAME trong .env trỏ đúng tab của màn đang làm
```

Hoặc viết 1 script tạm dùng `utils/google-sheets.ts` → `readTestCases('<Tên tab>')` để dump toàn bộ dòng ra
xem (theo đúng cách đã làm với tab "Đăng Nhập"). Mục tiêu ở bước này CHỈ là học **cách viết** (Test View Point
đặt tên thế nào, Kết quả mong đợi cụ thể ra sao, các nhóm hay kiểm tra) — **không phải để giới hạn số lượng
hay nội dung testcase web theo đúng số dòng trong Sheet.** Không suy nghĩ theo kiểu "map từng dòng app sang 1
dòng web" — số lượng/nội dung testcase cuối cùng do bước A3 (kiểm kê độc lập trên web thật) quyết định, có thể
nhiều hơn, ít hơn, hoặc khác hẳn Sheet.

### A2. Đọc source code màn hình trong dự án `stocks`

1. Tìm route + component: grep `router/index.js` để biết path URL và file `.vue` tương ứng.
2. Đọc kỹ file `.vue` (template + script): các field, nút bấm, validate, gọi API nào, điều hướng đi đâu khi
   thành công/thất bại, các state đặc biệt (loading, disable, checkbox mặc định...), mọi nhánh `if/else`/
   `catch` xử lý lỗi, mọi modal/popup con được điều khiển bởi màn hình này.
3. Đọc thêm các file liên quan nếu cần (router guards ảnh hưởng tới màn này, store, mixin dùng chung).

### A3. Kiểm kê độc lập trên web thật — bước bắt buộc, quyết định độ phủ thật sự

Trước khi đối chiếu với Sheet, tự lập danh sách **mọi phần tử/tính năng/trạng thái có thật trên màn hình web**,
đọc trực tiếp từ source code (A2) + DOM thật (dùng `scripts/inspect-dom.ts`, xem A4 bên dưới) — coi như đang
audit 1 màn hình hoàn toàn xa lạ, chưa từng biết app có sheet nào. Liệt kê theo các nhóm sau, mỗi mục tìm được
đều cần ít nhất 1 testcase tương ứng dù Sheet app **có nhắc tới hay không**:

- **Mọi field nhập liệu**: hiển thị (label/placeholder/icon) → required → format/validate riêng của field đó
  (đọc đúng regex/điều kiện trong code, không đoán) → giá trị biên (rỗng, khoảng trắng, quá dài, ký tự đặc
  biệt/Unicode) → hành vi khi hợp lệ.
- **Mọi button/link/icon có thể tương tác**: hiển thị, kết quả khi click, có bị disable trong điều kiện nào
  không.
- **Mọi luồng thành công lẫn thất bại của mỗi lần gọi API** (đọc kỹ từng nhánh `.then()`/`.catch()`): thành
  công điều hướng đi đâu, lỗi format field, lỗi trùng dữ liệu, lỗi 500/mất mạng — với mỗi nhánh lỗi mất
  mạng/500 nên **tự động hoá thật bằng `page.route()`/`context.setOffline()`** để biết code có an toàn hay
  không (đừng chỉ đọc code rồi đoán), y như cách đã phát hiện 2 bug thật ở Đăng Nhập và Đăng Ký.
- **Mọi modal/popup/state phụ** phát sinh từ màn hình này (vd modal OTP ở Đăng Ký) — dù app hoàn toàn không có
  khái niệm này, vẫn phải viết đủ testcase cho nó vì nó **thật sự tồn tại trên web**.
- **Mọi link điều hướng ra ngoài màn hình** (kể cả link web-only mà app không có, vd "Xem chi tiết các gói tại
  đây").
- **Hành vi chung**: double-submit, loading indicator, responsive nhiều kích thước, thứ tự Tab, nút Back trình
  duyệt, dữ liệu form có bị giữ lại khi rời trang không.

Sau khi có danh sách kiểm kê này, **mới** đối chiếu ngược lại với Sheet ở bước A5 — lúc đó Sheet chỉ dùng để
kiểm tra sót (có khía cạnh nào app từng nghĩ tới mà mình bỏ sót không) và để điền field "Tham chiếu App" cho
những testcase trùng khớp, không dùng để giới hạn phạm vi.

### A4. Đọc DOM thật trên môi trường live

```bash
npx tsx scripts/inspect-dom.ts <route> --name <slug>-initial [--login]
```

Thêm `--login` nếu màn hình yêu cầu đã đăng nhập. Dùng `--click "<text>"` / `--fill "<label>=<value>"` (lặp lại
được) nếu cần thao tác trước khi tới trạng thái muốn chụp (vd mở 1 modal, chuyển tab). Đọc ảnh
(`.dom-inspect/<name>.png`, tool `Read` đọc được ảnh) + file `.dom-inspect/<name>.aria.txt` (accessibility
snapshot — role/name/text thật của từng phần tử, dùng để chọn locator ổn định).

Nếu cần thử các luồng tương tác thật (submit form sai/đúng, xem thông báo lỗi thật, đo số lần gọi API khi
double-click, giả lập offline/500...), viết 1 script Playwright độc lập tạm thời (Chromium, dùng luôn
`pages/*.ts` đã có nếu liên quan) để quan sát — xem cách đã làm ở màn Đăng Nhập/Đăng Ký (thử để trống field,
sai định dạng, tài khoản không tồn tại, double-click, offline, mock 500...). Nếu màn hình có hành động **có thể
tạo dữ liệu thật trên production** (đăng ký tài khoản, gửi OTP thật, thanh toán...), **luôn chặn/mock API mutate
đó** (`page.route(..., route => route.abort())` mặc định, chỉ `route.fulfill()` giả lập thành công khi cần quan
sát UI) — không bao giờ để 1 kịch bản khảo sát vô tình hoàn tất thao tác thật trên production. Xoá script tạm
sau khi dùng xong, không để lại rác trong `scripts/`.

### A5. Đối chiếu danh sách kiểm kê (A3) với testcase app trong Sheet

Với mỗi mục đã kiểm kê độc lập ở A3, tham chiếu ngược lại Sheet (nếu có testcase tương ứng):
- **Có trong Sheet, áp dụng được cho web** → viết testcase, gắn `Tham chiếu App: TC_xx` (kể cả khi hành vi
  thực tế khác app — vẫn viết nhưng ghi rõ khác biệt, không tự bịa hành vi giống app khi DOM/test thật cho
  thấy khác).
- **Có trong Sheet nhưng đặc thù mobile không cách nào áp dụng cho web** (sinh trắc học, bàn phím ảo, nút back
  vật lý thiết bị...) → **xoá hẳn**, KHÔNG giữ lại dưới dạng "N/A" (quy tắc đã chốt với người dùng).
- **Có trong danh sách kiểm kê A3 nhưng KHÔNG có trong Sheet** (vì Sheet không phải checklist đầy đủ, xem
  nguyên tắc cốt lõi #2) → vẫn viết testcase, đánh dấu `🆕 Testcase mới`, không bỏ qua chỉ vì app không kiểm
  tra điều này.
- Testcase nào chưa đủ điều kiện verify ngay (thiếu tài khoản đặc biệt, phụ thuộc môi trường khó giả lập) →
  đánh dấu **`⚠️ Cần xác nhận thêm`** — nhưng vẫn ưu tiên thử tự động hoá bằng Playwright trước khi kết luận
  "chưa verify được" (vd offline/500/loading/double-click đều tự động hoá được, không cần để ⚠️).

### A6. Viết `testcases/<slug>.md`

Đánh số tuần tự **không có khoảng trống**: `TC_<SCREEN>_01`, `TC_<SCREEN>_02`, ... (`<SCREEN>` viết hoa, khớp
tên trong ID Playwright, vd `TC_LOGIN_01`, `TC_DANGKY_01`). Đầu file có block metadata (URL, component, domain
test, nguồn) + bảng quy ước trạng thái. Mỗi testcase theo đúng template:

```markdown
# [TC_<SCREEN>_xx] <Tên ngắn gọn>

- **Trạng thái:** ✅ Áp dụng | ⚠️ Cần xác nhận thêm | 🆕 Testcase mới
- **Tham chiếu App:** TC_xx   (bỏ dòng này nếu là testcase mới không có nguồn từ app)
- (tuỳ chọn) **Khác biệt so với app:** ... / **Kết quả đo được:** ... / **Ghi chú:** ...

## Các bước thực hiện
1. ...

## Kết quả mong đợi
- [ ] ...
```

Cuối file: bảng tổng hợp số lượng theo trạng thái + danh sách "phát hiện đáng chú ý" (bug thật, khác biệt hành
vi so với app) nếu có.

### A7. Viết Page Object + Playwright spec

1. Nếu chưa có, tạo `pages/<Screen>Page.ts` extends `pages/BasePage.ts`, locator ưu tiên theo thứ tự:
   `getByPlaceholder`/`getByLabel`/`getByRole(role, {name})` (ổn định nhất, đúng text/role thật lấy từ
   `.aria.txt`) → id/attribute ổn định (`page.locator('#id-cố-định')`) → css class chỉ khi không còn cách nào
   khác. Tránh `.nth(i)` — nếu bắt buộc, loop theo text/thuộc tính riêng từng phần tử, không loop mù theo số
   thứ tự.
2. Viết `tests/<slug>.spec.ts`, `test.describe` theo từng nhóm chức năng, mỗi test đặt tên bắt đầu bằng đúng
   `TC_<SCREEN>_xx:` để dễ đối chiếu ngược lại file `.md`. Testcase nào rủi ro cho tài khoản test dùng chung
   (dễ gây khoá tài khoản, cần tài khoản đặc biệt) thì dùng `test.fixme(...)` kèm comment lý do, không tự ý bịa
   giả lập nếu không chắc an toàn.
3. Ưu tiên đo hành vi thật bằng Playwright thay vì chỉ đọc code khi nghi vấn (đếm request qua
   `page.on('request')` cho double-submit, `context.setOffline(true)` cho mất mạng, `page.route()` để mock lỗi
   500/loading chậm, so sánh `localStorage` giữa 2 lần chạy cho các case liên quan tới phiên đăng nhập...).

### A8. Chạy test & báo cáo

```bash
npx playwright test tests/<slug>.spec.ts --project=chromium --reporter=list
```

Sửa tới khi pass hết (trừ `fixme`/lý do rõ ràng). Báo lại người dùng: số lượng testcase theo trạng thái, phát
hiện đáng chú ý (đặc biệt là bug thật đo được qua automation), và những gì còn cần thông tin thêm (tài khoản
test đặc biệt...).

**Cập nhật [TRACKER.md](../../../TRACKER.md):** thêm 1 bảng cho màn vừa sinh, liệt kê mọi `test.fixme` kèm lý
do + điều kiện cần để làm tiếp (xem cấu trúc bảng đã có cho Đăng Nhập/Đăng Ký/Cộng Đồng). Đây là nơi duy nhất
người dùng tra cứu "màn này còn thiếu gì" mà không cần đọc lại toàn bộ file `.spec.ts`.

---

## Nhánh B — Cập nhật testcase khi màn hình đã đổi giao diện

Không đọc lại Google Sheet. `testcases/<slug>.md` hiện có chính là nguồn sự thật để biết testcase nào đã tồn
tại và cần giữ độ phủ tương đương.

### B1. Đọc lại trạng thái hiện có

1. Đọc toàn bộ `testcases/<slug>.md` hiện tại.
2. Đọc `tests/<slug>.spec.ts` và `pages/<Screen>Page.ts` liên quan — hiểu code hiện tại đang làm gì, đừng viết
   đè mù quáng.

### B2. Đọc lại source code thật hiện tại

Đọc lại file `.vue` (và route liên quan) của màn hình đó trong dự án `stocks`. Nếu người dùng đã nói rõ đổi gì
(vd "thêm nút X", "đổi validate Y") thì tập trung đọc đúng phần đó trước; nếu không rõ, đọc lại toàn bộ file để
tự tìm khác biệt so với mô tả trong `.md`.

### B3. Đọc lại DOM thật hiện tại để xác nhận

```bash
npx tsx scripts/inspect-dom.ts <route> --name <slug>-recheck [--login]
```

So sánh ảnh + `.aria.txt` mới với mô tả trong từng testcase của `.md` hiện có. Với mỗi khác biệt phát hiện
được, phân loại rõ:
- **UI/hành vi đổi thật** (element mới/mất, text đổi, luồng đổi) → cần cập nhật testcase + code.
- **Nghi ngờ là bug** (không phải chủ đích thay đổi UI mà là lỗi phát sinh) → **không tự ý sửa `.md` để khớp
  code cho "pass"** — ghi rõ là bug nghi vấn trong `.md`, hỏi lại người dùng nếu không chắc.

**Đừng chỉ diff thụ động theo từng testcase cũ** — áp dụng lại đúng tinh thần kiểm kê độc lập ở A3: đọc source
+ DOM mới như thể audit lại toàn màn hình, không chỉ soi từng dòng `.md` cũ xem còn đúng không. Tính năng/field/
luồng hoàn toàn mới (không tồn tại ở lần sinh trước, nên không có testcase cũ nào để "diff" ra) vẫn phải được
phát hiện và viết testcase mới cho — nếu chỉ so khớp từng testcase cũ, loại thay đổi này sẽ bị bỏ sót.

### B4. Cập nhật `testcases/<slug>.md`

- Testcase nào hành vi/element thay đổi → sửa nội dung mô tả, "Các bước thực hiện", "Kết quả mong đợi" cho
  khớp thực tế mới, ghi chú ngắn đã đổi gì (có thể thêm dòng `**Cập nhật:** ...` để lại dấu vết).
- Testcase nào không còn tồn tại trên UI mới → xoá hẳn (không giữ N/A), y như quy tắc ở Nhánh A.
- Testcase mới phát sinh do tính năng mới → thêm vào **cuối** dãy số hiện có của màn đó (không renumber toàn
  bộ file trừ khi thay đổi quá lớn khiến việc renumber giúp dễ đọc hơn hẳn — nếu renumber, phải sửa đồng bộ cả
  `tests/<slug>.spec.ts`).

### B5. Cập nhật `pages/<Screen>Page.ts` + `tests/<slug>.spec.ts`

Sửa locator theo DOM thật mới (ưu tiên thứ tự như mục A7.1). Cập nhật/thêm/xoá test tương ứng, giữ tên test
đồng bộ với ID trong `.md`.

### B6. Chạy lại test & báo cáo

```bash
npx playwright test tests/<slug>.spec.ts --project=chromium --reporter=list
```

Báo lại người dùng: đã đổi những gì trong doc/code, có phát hiện bug nghi vấn nào không (đừng tự ý coi bug là
"đã sửa xong" nếu chỉ là chỉnh test cho khớp — phải phân biệt rõ 2 việc này với người dùng).

**Cập nhật [TRACKER.md](../../../TRACKER.md):** nếu lượt cập nhật này thêm/gỡ bất kỳ `test.fixme` nào (màn cũ
có thêm case mới bị fixme, hoặc 1 case fixme cũ nay đã tự động hoá được), sửa lại đúng bảng của màn đó — không
để tracker lạc hậu so với code thật.

---

## Lỗi thường gặp cần tránh

1. Chạy `npm`/`npx` bằng Node 14 mặc định → lỗi cài đặt/chạy Playwright. Luôn `export PATH=...v20.19.4...`
   trước.
2. Quên `MSYS_NO_PATHCONV=1` khi gọi `inspect-dom.ts` trên Git Bash → route `/xxx` bị biến thành đường dẫn
   Windows sai, lỗi `ERR_NAME_NOT_RESOLVED`.
3. Cài thêm package trực tiếp vào `package.json` của dự án `stocks` (project app gốc) — **KHÔNG BAO GIỜ** làm
   vậy, dự án test này độc lập hoàn toàn (Node 20) với `stocks` (Node 14). Từng gây lỗi ghi đè
   `package-lock.json` của `stocks` một lần, đã revert — không lặp lại.
4. Tự ý sửa testcase `.md` cho khớp với code hiện tại khi phát hiện sai khác, thay vì báo lại đó có thể là bug
   thật cần xác nhận với người dùng.
5. Đọc lại Google Sheet cho 1 màn đã có `testcases/<slug>.md` — không cần thiết, đi ngược lại quy tắc đã chốt.
6. Coi Google Sheet là checklist đủ rồi chỉ dịch từng dòng sang web, bỏ qua bước kiểm kê độc lập (A3) — dẫn tới
   bỏ sót toàn bộ tính năng/luồng chỉ web mới có (vd modal OTP, link riêng của web) vì app không hề nhắc tới.
7. Để lọt 1 kịch bản khảo sát tương tác thật với API mutate (đăng ký, đặt hàng...) mà quên chặn/mock — có nguy
   cơ tạo dữ liệu rác hoặc gửi thông báo thật (OTP/email/SMS) trên production.
