# Danh sách testcase CHƯA tự động hoá (`test.fixme`)

File này liệt kê mọi testcase đang bị đánh dấu `test.fixme` trong các file `tests/*.spec.ts` — tức là đã có
trong tài liệu `testcases/*.md` nhưng **chưa chạy tự động được**, kèm lý do và điều kiện cần để làm tiếp.

**Quy tắc cập nhật:** mỗi khi thêm/gỡ 1 `test.fixme` trong bất kỳ file spec nào (dù do sinh testcase mới hay do
bổ sung sau), phải cập nhật lại bảng tương ứng ở đây trong cùng lượt thay đổi — không để file này lạc hậu so
với code thật.

**Tổng hiện tại:** 47 case (Đăng Nhập: 3 · Đăng Ký: 5 · Cộng Đồng: 13 · Watchlist: 8 · Dashboard: 1 · Bảng Giá: 3 ·
Nhật Ký GD: 5 · Phân tích cơ bản — So sánh: 1 · Phân tích cơ bản — Biểu đồ: 1 · Toàn cảnh thị trường — Ngành: 1 ·
Toàn cảnh thị trường — Bộ lọc cổ phiếu: 2 · Toàn cảnh thị trường — Sức mạnh dòng tiền: 2 · Phân tích kỹ thuật: 2)

---

## Đăng Nhập ([tests/login.spec.ts](tests/login.spec.ts))

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_LOGIN_15 | Email viết hoa vẫn đăng nhập được | Tài khoản test hiện tại là SĐT, không phải email | 1 tài khoản test dạng email |
| TC_LOGIN_32 | Nhập sai mật khẩu liên tiếp ≥ 5 lần (khoá tạm thời) | App ghi nhận "chưa làm chức năng này"; nếu backend có làm thì test sai nhiều lần sẽ khoá luôn tài khoản test chính | 1 tài khoản test phụ, dùng-một-lần |
| TC_LOGIN_48 | Đăng nhập với tài khoản bị khoá | Cần verify modal "Lỗi đăng nhập" hiển thị đúng nội dung | 1 tài khoản test đã ở trạng thái bị khoá |

## Đăng Ký ([tests/dang-ky.spec.ts](tests/dang-ky.spec.ts))

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_DANGKY_10 | Họ tên có khoảng trắng đầu/cuối | Cần hoàn tất 1 đăng ký thật để biết có trim hay không — rủi ro tạo tài khoản rác | Môi trường staging riêng, hoặc xác nhận từ dev |
| TC_DANGKY_24 | Email đã tồn tại | Thử với email support (`kfspteam@kfsp.vn`) không phải tài khoản user nên không kích hoạt được cảnh báo | 1 email đã đăng ký thành tài khoản user thật |
| TC_DANGKY_25 | Email viết hoa vẫn báo đã tồn tại | Cùng lý do TC_DANGKY_24 | Cùng — 1 email user thật |
| TC_DANGKY_78 | Nút "Gửi lại mã" chỉ bật sau khi hết đếm ngược | Chưa viết test (đếm ngược 60s làm test chạy lâu) | Không cần gì thêm, chỉ cần thời gian viết + chấp nhận test chạy chậm |
| TC_DANGKY_80 | Chuyển đổi kênh xác thực Email ↔ Zalo | Chưa viết test | Không cần gì thêm |

## Cộng Đồng ([tests/cong-dong.spec.ts](tests/cong-dong.spec.ts))

### ✅ Đã hoàn tất 2026-08-19 (không còn fixme)
| TC ID | Tên | Cách đã làm |
|---|---|---|
| TC_CONGDONG_14 | Tab Quan tâm khi chưa follow/like ai (empty state) | Unfollow tạm người tài khoản test đang follow → verify empty-state → follow lại NGAY qua trang cá nhân của họ (không dùng sidebar Gợi ý vì danh sách đó xoay vòng ngẫu nhiên, không đảm bảo hiển thị đúng người — đã gặp lỗi thật lúc đầu, đã sửa) |
| TC_CONGDONG_23 | Gắn mã chứng khoán vào bài viết | `stockCodeInput()` trong POM, mock đăng bài |
| TC_CONGDONG_24 | Gắn hashtag vào bài viết | `hashtagInput()` trong POM, mock đăng bài |
| TC_CONGDONG_25 | Chọn tâm lý thị trường khi đăng bài | Click 1 trong 3 nút Tích cực/Trung lập/Tiêu cực, mock đăng bài |
| TC_CONGDONG_26 | Đính kèm ảnh khi đăng bài | `setInputFiles` với ảnh mẫu `tests/fixtures/sample-image.png` (tạo mới), mock đăng bài |
| TC_CONGDONG_27 | Đăng bài khi mất kết nối mạng | `context.setOffline(true)` — xác nhận KHÔNG crash JS (đọc kỹ `addNewPost.vue`, catch dùng optional chaining đầy đủ) |
| TC_CONGDONG_43 | Hiển thị icon "..." trên bài viết của mình | Đăng 1 bài thật (đánh dấu `[TEST-AUTOMATION] <timestamp>`) → verify icon → xóa qua UI, có API-delete dự phòng trong `finally` nếu UI lỗi |
| TC_CONGDONG_44 | Tắt/Bật thông báo cho 1 bài viết | Verify gọi đúng API `update-notify` — **phát hiện bug: nhãn UI không đổi sau click**, đã ghi vào doc + mục "Phát hiện đáng chú ý" |
| TC_CONGDONG_45 | Chỉnh sửa bài viết của mình | Sửa nội dung bài thật vừa tạo, verify hiển thị lại đúng |
| TC_CONGDONG_46 | Xóa bài viết của mình | Xóa qua UI (modal xác nhận), verify biến mất khỏi feed |
| TC_CONGDONG_48/49 | Hiển thị bài ghim đúng dạng (slider ≥3 bài / danh sách 1-2 bài) | Gộp thành 1 test THÍCH ỨNG: đọc trạng thái ghim thật lúc chạy (0 / danh sách / slider) rồi annotate rõ nhánh nào được verify, thay vì hard-code số lượng — số bài ghim đã xác nhận thay đổi theo thời gian thực (có lúc 1, có lúc 0) |

**⚠️ Lưu ý quan trọng cho lần sau chạm vào 5 case TC_43-46:** đã có 1 lần trong lúc phát triển làm sai (dropdown
"..." không tự đóng như giả định, sidebar Gợi ý không đáng tin để follow lại) khiến tài khoản test bị unfollow
+ còn sót bài `[TEST-AUTOMATION]` trên production một thời gian ngắn — đã dọn sạch bằng tay + sửa lại code an
toàn hơn (API-delete dự phòng trong `finally`, follow lại qua trang cá nhân thay vì sidebar ngẫu nhiên). Nếu
sửa lại 2 test này, giữ nguyên cơ chế `finally` dọn dẹp, đừng bỏ.

### ⏳ Đang chờ thông tin từ bạn
| TC ID | Tên | Đang chờ |
|---|---|---|
| TC_CONGDONG_55 | Không hiển thị gợi ý với tài khoản Free | Test đã viết sẵn (đọc `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` từ `.env`, tự `test.skip` nếu đăng nhập lỗi). Tài khoản đầu tiên bạn cung cấp (`levanhieu250204@gmail.com`) bị API từ chối: `400 "Tài khoản không tồn tại"` — cần bạn kiểm tra lại thông tin đăng nhập, không cần sửa code thêm sau khi có tài khoản đúng |

### Nhóm B — Có thể làm bằng tài khoản test hiện tại (chưa triển khai, đã xác nhận với bạn 2026-08-19 là để sau)
| TC ID | Tên | Cách làm khi triển khai |
|---|---|---|
| TC_CONGDONG_37 | Đính kèm ảnh vào bình luận | Tương tự TC_26 — có sẵn `tests/fixtures/sample-image.png`, bình luận thật trên bài của mình rồi xoá |
| TC_CONGDONG_39 | Sửa bình luận của mình | Bình luận thật trên bài của mình → sửa → xoá |
| TC_CONGDONG_40 | Xóa bình luận của mình | Bình luận thật rồi xoá luôn |
| TC_CONGDONG_41 | Thích 1 bình luận | Bình luận thật → thích → bỏ thích → xoá |
| TC_CONGDONG_52 | Click avatar/tên xem trang cá nhân đầy đủ | Chỉ xem, không tạo dữ liệu — viết trực tiếp được |
| TC_CONGDONG_53 | Click Bài đăng/Follower/Following chuyển view | Chỉ xem, viết trực tiếp được |
| TC_CONGDONG_56 | Theo dõi/Bỏ theo dõi 1 user từ sidebar gợi ý | Follow thật rồi unfollow lại ngay |

### Nhóm C — Phụ thuộc dữ liệu/thời điểm, đã quyết định GIỮ NGUYÊN fixme (xác nhận với bạn 2026-08-19)
| TC ID | Tên | Lý do |
|---|---|---|
| TC_CONGDONG_05 | Click item tin AI mở modal chi tiết | Nội dung tin AI đổi theo ngày, chưa có locator ổn định |
| TC_CONGDONG_06 | Ctrl+Click item tin AI mở tab mới | Cùng lý do TC_05 |
| TC_CONGDONG_07 | "Hiện bài viết mới" khi có bài chờ qua socket | Cần mock socket event hoặc có bài mới đăng thật đúng lúc test chạy |
| TC_CONGDONG_38 | Trả lời (reply) 1 bình luận | Cần 1 bình luận có sẵn ổn định để bấm Trả lời |
| TC_CONGDONG_50 | Ghim / Bỏ ghim bài viết | Cần quyền `isCanPin`, chưa rõ tài khoản test có quyền này không |

## Watchlist ([tests/watchlist.spec.ts](tests/watchlist.spec.ts))

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_WATCHLIST_09 | Category "Nhật ký GD"/"Khác" ẩn với tài khoản Free | Cần tài khoản Free hợp lệ | `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` đúng trong `.env` (cùng vướng mắc với TC_CONGDONG_55) |
| TC_WATCHLIST_16 | Cột "Website" — link ngoài | Chưa xác định chắc chắn cột này nằm ở tab hiển thị nào trong 9 tab (không có trong tab "Tổng quát" đã verify) | Xác nhận qua DOM thật ở đúng tab chứa cột, hoặc hỏi lại dev |
| TC_WATCHLIST_19 | Watchlist rỗng (0 mã) không crash | Không có watchlist rỗng thật để test trực tiếp (danh sách "wl rỗng" thực tế có 6 mã) — nghi vấn crash JS từ code không kiểm tra null khi query pagination | Viết test mock `GET .../mack-by-my-watchlist/:id` trả `[]`, verify không crash qua `pageErrors` |
| TC_WATCHLIST_20 | Loading state khi tải dữ liệu bảng | Chưa xác nhận có UI loading rõ ràng hay không (code có flag nhưng không thấy phần tử loading trong template) | Mock API chậm (delay response), quan sát DOM lúc đang chờ |
| TC_WATCHLIST_25 | Ô "Chọn mã CK" validate mã không hợp lệ | Về mặt logic chỉ xảy ra khi `list_mack_all` và `data_eod` (2 danh sách khác nhau ở store) lệch nhau — không gõ tự do được vì `handleEnter` chỉ chọn khi có item khớp trong danh sách gợi ý đã lọc | Cách giả lập ổn định (VD mock store hoặc mock danh sách gợi ý chứa 1 mã không có trong `data_eod`) |
| TC_WATCHLIST_31 | Checkbox "Nhận tất cả thông báo (Dành cho Moderator)" | Chỉ hiện với quyền moderator — tài khoản test hiện có quyền này nhưng chưa xác nhận hành vi ẩn/hiện đúng với tài khoản không có quyền | 1 tài khoản test không có quyền moderator để đối chứng |
| TC_WATCHLIST_46 | Cột điểm/định giá ẩn với tài khoản Free | Cần tài khoản Free hợp lệ | Cùng `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` như TC_09 |
| TC_WATCHLIST_48 | Double-click nút "Lưu" trong modal Tạo/Sửa Watchlist | Chưa viết test đo số request thật (nghi ngờ thiếu guard double-submit qua đọc code) | Không cần gì thêm, chỉ cần thời gian viết + đếm request qua `page.on('request')` |
| TC_WATCHLIST_49 | Giá/dữ liệu tự cập nhật qua socket | Cập nhật ~30s/lần qua socket, không chủ động kích hoạt được, tốn nhiều thời gian chờ nếu test thật | Không cần gì thêm, chỉ cần chấp nhận test chạy chậm (~35s+) hoặc mock socket event |

## Dashboard ([tests/dashboard-tab-thi-truong.spec.ts](tests/dashboard-tab-thi-truong.spec.ts))

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_DASHBOARD_TT_14 | Giới hạn tính năng tab Vĩ mô với tài khoản Free | Cần tài khoản Free hợp lệ | `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` đúng trong `.env` (cùng vướng mắc với TC_CONGDONG_55/TC_WATCHLIST_09) |

## Bảng Giá ([tests/bang-gia.spec.ts](tests/bang-gia.spec.ts))

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_BANGGIA_07 | Kéo giãn độ rộng panel border phải | Panel dùng `flexlayout-react` (`.flexlayout__border_sizer`), khác cơ chế `resizer-vertical` đã verify ở Dashboard — chưa xác nhận cách giả lập mouse drag ổn định cho control riêng của thư viện này | Thử nghiệm thêm cách giả lập kéo cho `flexlayout__border_sizer`, đo `size` trong `localStorage.ibd_layout` sau khi kéo |
| TC_BANGGIA_38 | Cuộn ngang đồng bộ header + khu ghim + danh sách chính | Chưa viết test đo `scrollLeft` của 3 vùng — đã xác nhận đúng qua đọc code, ưu tiên thấp | Không cần gì thêm, chỉ cần thời gian viết + so sánh `scrollLeft` sau khi cuộn |
| TC_BANGGIA_53 | Nút "Ẩn/hiện các cột" — nghi vấn bug thật (nhánh UI mới 2026-09-22) | Click nút mở nhầm modal "Chi tiết sự kiện" không liên quan — chưa rõ hành vi ĐÚNG thật sự là gì để viết assertion | Dev xác nhận hành vi mong đợi của nút "Ẩn/hiện các cột", xác nhận bug trên rồi mới viết test mô tả đúng |

**Cập nhật 2026-08-20:** TC_BANGGIA_48/49/50 (tài khoản Free) **đã tự động hoá xong, không còn vướng mắc** —
`FREE_USER_EMAIL` trong `.env` được sửa lại thành `levanhieu250204_test@gmail.com` (đúng tài khoản từng lỗi
trước đây, nay password đã đúng), đăng nhập thành công. Cả 3 case đã chạy thật và **pass**, với phát hiện đáng
chú ý: ~~tính năng "Ghi chú" và "Phái sinh > Thống kê HĐTL" **KHÔNG** bị khoá cho tài khoản Free này dù code có
gate theo `features_disabled`~~ → **[ĐÍNH CHÍNH 2026-09-22] KẾT LUẬN NÀY SAI: cả 2 tính năng ĐỀU BỊ KHOÁ đúng
thiết kế.** Test cũ "pass" nhưng pass sai vì assertion không đủ sức phát hiện `ProtectedView` (bắt chữ "Nâng
cấp" — chữ này chỉ hiện khi hover; và bắt tiêu đề tab — tiêu đề nằm ngoài vùng bị gate nên luôn hiện).
TC_BANGGIA_49/50 đã viết lại: kiểm tra ảnh mờ `.image-container .blurred-image` + hover `{ force: true }` để
lộ thông điệp nâng cấp; cả 2 **pass** với kỳ vọng "BỊ KHOÁ". **⚠️ Khuyến nghị rà soát:** các testcase phân
quyền Free ở màn khác nhiều khả năng cũng đang dùng cùng kiểu assertion sai này (xem chi tiết + cách sửa ở
[testcases/bang-gia.md](testcases/bang-gia.md) TC_BANGGIA_49 và "Phát hiện đáng chú ý" #7).
**Lưu ý cho các màn khác** đang chờ cùng
`FREE_USER_EMAIL`/`FREE_USER_PASSWORD` (TC_CONGDONG_55, TC_WATCHLIST_09/46, TC_DASHBOARD_TT_14) — tài khoản
Free giờ đăng nhập được, các case đó có thể thử lại được rồi (chưa đụng tới trong lượt cập nhật này, ngoài
phạm vi Bảng Giá).

**⚠️ Không phải fixme nhưng cần theo dõi — nghi vấn bug thật của app:** TC_BANGGIA_03/42/47 (chưa đánh
`fixme`, có viết code thật và chạy được) đôi khi FAIL không ổn định giữa các lần chạy `npx playwright test`
khác nhau (dù stable trong cùng 1 lần chạy) — tab border "Bài viết" và "Chatbot" đôi khi hoàn toàn không xuất
hiện trong DOM (6/8 thay vì 8/8 tab), không tự phục hồi dù chờ 15 giây. Xem chi tiết + giả thuyết nguyên nhân ở
mục "Phát hiện đáng chú ý" #1 trong [testcases/bang-gia.md](testcases/bang-gia.md). Test đã viết để fail rõ
ràng (không nuốt lỗi/không retry vô hạn) khi gặp lại tình trạng này — nếu thấy 3 case này fail khi chạy CI,
ĐỪNG vội coi là lỗi test, hãy đối chiếu lại ghi chú này trước.

**🔴 Cập nhật 2026-09-22 — UI đã đổi thật, 6 case đang FAIL (KHÔNG phải fixme, cần sửa code/re-verify):**
người dùng báo nghi ngờ lọc mã theo sàn/Phái sinh/Watchlist không hoạt động. Đã điều tra bằng automation thật
(đăng nhập mới, click từng bộ lọc, so sánh danh sách mã trước/sau) — **cả 3 bộ lọc đều lọc đúng dữ liệu**, không
tái hiện được lỗi người dùng báo. Tuy nhiên phát hiện: toolbar sàn/Phái sinh đã đổi hẳn từ Bootstrap nav-tabs
sang "segment control" (`<button class="segment-item">`), và cột **"Ngành"/"Sàn CK" đã bị gỡ khỏi cả header lẫn
từng dòng của bảng**. Đã sửa xong: `BangGiaPage.boardTabs`/`boardTab()`, hàm dùng chung `gotoBangGiaReady()`,
và TC_BANGGIA_11/12/15/19 (giờ assert đúng nội dung danh sách mã thay vì chỉ active class/không lỗi JS) — cả 4
**pass thật với dữ liệu live**. TC_BANGGIA_19 (dropdown "Bộ lọc" cá nhân KFSP) trước đây chỉ mở dropdown kiểm
tra không lỗi JS, chưa từng chọn 1 bộ lọc thật — tài khoản test hiện có sẵn 2 bộ lọc đã lưu, đã verify chọn 1
bộ lọc thật sự lọc đúng bảng theo dữ liệu API trả về. **Còn lại 6 case sau đây hiện đang FAIL do cùng đợt đổi
UI này, CHƯA sửa (ngoài phạm vi lượt sửa lỗi lọc mã)** — xem ghi chú `⚠️ Cần xác nhận thêm` tương ứng trong
`testcases/bang-gia.md` trước khi sửa — **đã sửa xong toàn bộ, xem cập nhật lớn hơn bên dưới.**

**🔴🔴 Cập nhật lớn 2026-09-22 (cùng ngày, sau khi phát hiện) — nhánh UI RIÊNG, sâu hơn nhiều so với bản
production ở trên, đo trên `http://localhost:8080` theo yêu cầu người dùng ("xem lại trên localhost:8080 vì đây
mới là code mới chạy từ nhánh sửa giao diện"):**
- Toolbar đổi tiếp LẦN 2: 7 nút sàn/Phái sinh (segment-item) → gộp chung **1 dropdown "Danh sách sàn"**
  (`.pb-board-toggle`). Ngành/Watchlist/Tín hiệu M/B/Bộ lọc → gộp vào **1 nút "Bộ lọc" overflow**
  (`.pb-overflow-filters-toggle`), mở ra panel 3 dòng.
- **Panel border phải CHỈ CÒN 6 TAB** (không phải 8) — "Bài viết"/"Chatbot" bị gỡ bỏ hoàn toàn. Điều này GIẢI
  ĐÁP nghi vấn flaky TC_BANGGIA_03/42/47 đã ghi ở trên (không phải lỗi render ngẫu nhiên — 2 tab đó không còn
  tồn tại). Đã xoá `TC_BANGGIA_42`/`TC_BANGGIA_47` khỏi bộ testcase (không giữ N/A), sửa `TC_BANGGIA_03` còn
  đúng 6 tab.
- Công tắc dark/light riêng cho bảng giá **bị gỡ bỏ hoàn toàn** → đã xoá `TC_BANGGIA_20`.
- Nút "Mở rộng"/"Thu gọn" đổi Ý NGHĨA (ẩn/hiện cả dải 5 index card thay vì mini-chart riêng từng card) → đã sửa
  lại `TC_BANGGIA_21` đúng hành vi mới.
- Đã sửa toàn bộ locator vỡ do cột "Ngành"/"Sàn CK" bị gỡ: `TC_BANGGIA_27` (header), `TC_BANGGIA_31` (nội dung
  dòng), `TC_BANGGIA_33`/`TC_BANGGIA_41` (đổi từ click `.nganh` sang click cột giá "TC"), `TC_BANGGIA_30` (icon
  ĐTNN đổi từ id `priceboard-foreign-*` sang `data-grp="foreign"`).
- Thêm `TC_BANGGIA_53` (`test.fixme`) — nghi vấn bug thật MỚI: nút "Ẩn/hiện các cột" (tính năng hoàn toàn mới)
  mở nhầm modal "Chi tiết sự kiện" không liên quan, đã loại trừ khả năng do overlay chồng lấp.
- **Toàn bộ cơ chế lọc (sàn/Phái sinh/Ngành/Watchlist/Tín hiệu M/B/Bộ lọc cá nhân) verify lại đúng, hoạt động
  bình thường sau redesign** — chỉ đổi vỏ UI, không đổi logic.
- ⚠️ Phát hiện thêm trong lúc kiểm thử: tài khoản test có thể rơi vào trạng thái "kẹt" (dropdown sàn hiện nhãn
  rỗng, bảng trống hoàn toàn) sau nhiều lần đổi sàn/bộ lọc liên tục trong thời gian ngắn — phục hồi được bằng
  cách chọn lại "Toàn bộ" thủ công, nghi ngờ 1 tổ hợp state server-side bị ghi không nhất quán, CHƯA xác nhận
  với dev. Xem chi tiết đầy đủ ở đầu [testcases/bang-gia.md](testcases/bang-gia.md) và mục "Phát hiện đáng chú
  ý" #10/#11.
- Tổng testcase Bảng Giá: 52 → **46** (−`TC_BANGGIA_16/17/20/37/41/42/47`, +`TC_BANGGIA_53`).
- **Xoá thêm 4 case cuối ngày 2026-09-22 (theo xác nhận của người dùng + đo thực tế):**
  - `TC_BANGGIA_16`/`TC_BANGGIA_17` (modal "Thêm mã CK vào watchlist") — dev đã **gỡ hẳn nút "Thêm mã"** khỏi màn
    Bảng giá từ 2026-09-16, xem comment trong `stocks/src/views/ibd/stock/liveBoard/dropdownWatchlist.js` (~dòng
    153): *"Bỏ nút 'Thêm mã' (popupWatchlist.vue) ... Thêm mã vào watchlist làm ở màn /watchlist"*. Đã kiểm
    chứng bằng automation: chọn watchlist xong, mở panel "Bộ lọc" vẫn không có nút này. Chức năng nay thuộc
    phạm vi màn `/watchlist`.
  - `TC_BANGGIA_37` (kéo-thả đổi vị trí dòng) — người dùng xác nhận **chưa có chức năng này**.
  - `TC_BANGGIA_41` (tab "Thông tin" — sổ lệnh) — người dùng yêu cầu bỏ.
- **Ghi chú cho ai định làm lại TC_16/17 ở màn `/watchlist`:** đọc `popupWatchlist.vue` — `enter()` chỉ gọi
  `addNewWatchlist()` KHI đang có gợi ý, nên gõ 1 chuỗi bậy (VD "ZZZZZ") rồi Enter sẽ **không** ra toast
  "Mã CK không hợp lệ!" như mô tả cũ của TC_17. Toast đó chỉ xảy ra khi mã có trong `store.state.list_mack`
  (nguồn gợi ý) nhưng KHÔNG có trong `store.state.data_eod` — cùng bản chất đã ghi nhận ở TC_WATCHLIST_25.
- **2 lỗi locator tinh tế phát hiện thêm khi chạy full suite (đã sửa):** (1) `boardDropdownToggle` ban đầu trỏ
  cả khối `.pb-board-toggle` — khối này chứa LUÔN cả menu "Danh sách sàn" lồng bên trong (dù đóng vẫn còn trong
  DOM), khiến `toHaveText()` đọc lẫn text của cả 7 mục trong menu — đã sửa scope hẹp lại đúng phần header
  (nhãn + caret). (2) Sau khi hover mở lại dropdown "Ngành" để verify, class `.selected` xuất hiện Ở CẢ toggle
  label LẪN đúng 1 dropdown-item cùng lúc (2 phần tử) → `locator('.selected')` trần bị strict-mode violation —
  đã sửa scope riêng `.dropdown-toggles .selected` (chỉ toggle). **Bài học chung:** với UI dropdown/overflow
  kiểu này, luôn scope locator hẹp nhất có thể, đừng dùng class chung (`.selected`, tên khối bao ngoài) mà
  không kiểm tra nó có bị dùng lặp lại ở nhiều cấp (toggle + item) hay lồng cả nội dung ẩn bên trong không.
- **Kết quả xác nhận cuối cùng (full suite, `--workers=1`, localhost:8080):** **43/43 pass**, 6/50 `test.fixme`
  (đúng chủ đích), 1/50 tự `test.skip` theo dữ liệu runtime (TC_BANGGIA_41 — mã "ACB" không có trong viewport
  lúc chạy lần này, không phải lỗi). **0 lỗi thật còn sót lại** từ 2 đợt đổi UI trong ngày 2026-09-22.

**Cập nhật tiếp 2026-09-22 — TC_BANGGIA_18 đã tự động hoá xong, không còn fixme:** theo yêu cầu người dùng
("các testcase đều lấy dữ liệu thật, không cần mock API, thoải mái dùng tài khoản test cung cấp"), bỏ kế hoạch
mock `GET /api/filter/get-macks-by-filter` — viết test dùng thẳng dữ liệu thị trường thật. Chọn "Tiềm năng mua
hôm nay" → verify MỌI mã hiển thị đều thuộc đúng tập mã API trả về (so khớp trực tiếp response, không chỉ "có
đổi danh sách"). Vì phụ thuộc dữ liệu thật theo ngày, test tự `skip` nếu API trả về 0 mã đúng lúc chạy (không
coi là fail). **Lưu ý áp dụng chủ trương này cho các case fixme khác đang chờ mock:** chỉ áp dụng cho API ĐỌC
dữ liệu (GET, không ghi gì) như case này — CÁC API GHI DỮ LIỆU THẬT (POST/PUT/DELETE, vd TC_BANGGIA_16/17 mock
`POST /api/watchlist`, hay toàn bộ cơ chế chặn mutate ở Nhật Ký GD bảo vệ danh mục ~54 tỷ VNĐ) vẫn PHẢI giữ
nguyên mock/chặn như cũ trừ khi người dùng xác nhận rõ ràng riêng cho từng trường hợp — tránh hiểu nhầm thành
"bỏ mock tất cả".

## Nhật Ký GD (5 file: [tests/nhat-ky-giao-dich.spec.ts](tests/nhat-ky-giao-dich.spec.ts) · [tests/nhat-ky-giao-dich-tai-san.spec.ts](tests/nhat-ky-giao-dich-tai-san.spec.ts) · [tests/nhat-ky-giao-dich-nhat-ky.spec.ts](tests/nhat-ky-giao-dich-nhat-ky.spec.ts) · [tests/nhat-ky-giao-dich-danh-muc.spec.ts](tests/nhat-ky-giao-dich-danh-muc.spec.ts) · [tests/nhat-ky-giao-dich-phan-bo-von.spec.ts](tests/nhat-ky-giao-dich-phan-bo-von.spec.ts))

Testcase doc tương ứng: [testcases/nhat-ky-giao-dich.md](testcases/nhat-ky-giao-dich.md) (shell/tab-switching) +
4 file theo tab: [-tai-san.md](testcases/nhat-ky-giao-dich-tai-san.md) ·
[-nhat-ky.md](testcases/nhat-ky-giao-dich-nhat-ky.md) · [-danh-muc.md](testcases/nhat-ky-giao-dich-danh-muc.md) ·
[-phan-bo-von.md](testcases/nhat-ky-giao-dich-phan-bo-von.md). POM dùng chung:
[pages/TradingLogPage.ts](pages/TradingLogPage.ts).

**⚠️ AN TOÀN DỮ LIỆU:** Tài khoản test dùng chung có danh mục thật trị giá ~54 tỷ VNĐ. Mọi API mutate
(POST/PUT/DELETE liên quan `trading_log`, `category`, `updateusersettings`...) đều bị chặn/mock qua
`page.route()` mặc định trong `beforeEach`/helper `blockMutations()` của từng file — không có request mutate
thật nào lọt ra production trong toàn bộ 118 testcase.

**Cập nhật 2026-08-20:** TC_NKGD_09/TC_NKGD_LS_03 (feature-gating theo gói hội viên) **đã tự động hoá xong,
không còn vướng mắc** — `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` trong `.env` đăng nhập thành công. Cả 2 case đã
chạy thật với tài khoản Free và **pass ổn định**: xác nhận cả 3 tab chính (Tài sản/Quản lý danh mục/Phân bổ
vốn) VÀ cả 2 sub-tab bên trong "Nhật ký giao dịch" (Lịch sử giao dịch/Thống kê phân tích) đều hiển thị đúng
`ProtectedView` với tài khoản Free này. Phát hiện kỹ thuật đáng chú ý khi tự động hoá: CoreUI `<CTabs>` giữ cả
3 `<CTab>` bị gate luôn mounted đồng thời (không unmount khi không active), dùng chung 1 computed
`featureName`/`disable_featureName` — vô hại về hành vi người dùng thấy, nhưng phải lọc `:visible` khi đếm phần
tử `ProtectedView` qua automation, nếu không sẽ đếm sai số lượng (xem chi tiết trong
[testcases/nhat-ky-giao-dich.md](testcases/nhat-ky-giao-dich.md) TC_NKGD_09).

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_NKGD_LS_38 | Mở modal Sửa — giao dịch Cổ tức/Quyền | Cần 1 dòng giao dịch loại "Cổ tức"/"Quyền" ổn định trong lịch sử của tài khoản test để mở modal Sửa đúng nhánh field | Xác nhận 1 giao dịch Cổ tức/Quyền cố định (mã CK + ngày) luôn tồn tại trên tài khoản test |
| TC_NKGD_LS_39 | Đổi Loại giao dịch trong modal Sửa cổ tức — reset field liên quan | Phụ thuộc mở được modal ở TC_NKGD_LS_38 trước | Cùng — hoàn tất TC_NKGD_LS_38 trước |
| TC_NKGD_PBV_02 | Validate "Vốn ban đầu" required + phải > 0 | Đo qua automation nhiều lần cho kết quả TRÁI NGƯỢC nhau (có lần `is-invalid` không bao giờ xuất hiện, có lần xuất hiện đúng) dù cùng 1 kịch bản thao tác — nghi race condition từ 2 directive `v-model.lazy` + `v-model` trùng lặp trên cùng input (`CapitalAllocation.vue` dòng 33+37) | Xác nhận từ dev việc 2 `v-model` trùng lặp có phải lỗi copy-paste hay không; sau khi sửa/xác nhận, chạy lại nhiều lần để kiểm tra độ ổn định |
| TC_NKGD_PBV_04 | "% Cắt lỗ trên deal tiếp theo" — required, > 0 | Cùng pattern không ổn định với TC_NKGD_PBV_02 (cùng input có 2 `v-model` trùng lặp, dòng 106+112) | Cùng điều kiện với TC_NKGD_PBV_02 |
| TC_NKGD_PBV_10 | Đổi giá trị form → auto-save lên server sau ~3.2 giây | Đo qua automation nhiều lần cho kết quả KHÔNG ổn định (có lần không gửi request dù chờ 8s, có lần gửi đúng thiết kế) — nghi `data_save[category] = {...}` gán property mới không qua `Vue.set` nên chỉ reactive nếu danh mục đã từng có dữ liệu lưu trước đó | Xác nhận từ dev cơ chế gán `data_save`; cần 1 danh mục XÁC ĐỊNH chưa từng lưu "Phân bổ vốn" + 1 danh mục XÁC ĐỊNH đã từng lưu để tái tạo ổn định cả 2 nhánh |

**Phát hiện đáng chú ý (bug thật đo được qua automation, ưu tiên báo dev)** — chi tiết đầy đủ nằm trong mục
"Phát hiện đáng chú ý" của từng file `.md` theo tab, tóm tắt các bug nghiêm trọng nhất:
- **`estate.vue` (tab Tài sản) crash thật:** Sửa "Vốn ban đầu" trong modal "Sửa danh mục" có thể crash
  `TypeError` ở `loadDataFromLocalStorage()` do thiếu optional chaining khi đọc `tong_tai_san` (TC_NKGD_TS_16).
- **`ManageCategory.vue` (tab Quản lý danh mục) 2 bug thật:** (1) Thêm/sửa danh mục lúc mất mạng crash
  `TypeError` khi đọc `error.response.status` thiếu optional chaining, không toast lỗi nào cho người dùng
  (TC_NKGD_DM_10); (2) Validate tên danh mục không `.trim()`, chấp nhận tên toàn khoảng trắng (TC_NKGD_DM_07).
- **`index.vue`/`tradingHistory.vue` (tab Nhật ký giao dịch) 2 bug thật:** (1) `deleteTrading()` mất `this`
  trong `.catch` (function thường, không phải arrow function) → crash `TypeError` khi xóa giao dịch lỗi mạng
  (TC_NKGD_LS_44); (2) Xuất File Excel làm hỏng vĩnh viễn computed `fields_table` (Vue 2 computed caching +
  mutate mảng không reactive) → thêm cột "Mã CK" thừa, chỉ lộ ra ở lần re-render TIẾP THEO (TC_NKGD_LS_48).
- **`CapitalAllocation.vue` (tab Phân bổ vốn) — nghi bug nghiêm trọng nhất của cả màn:** 3 field nhập chính
  đều có 2 `v-model` trùng lặp trên cùng input, khiến validate UI (`is-invalid`) và auto-save lên server hoạt
  động KHÔNG ổn định (xem 3 case fixme ở trên) — cần dev xác nhận trước khi tự động hoá lại chắc chắn.

**⚠️ Không phải fixme nhưng cần lưu ý khi chạy CI — flakiness do resource contention khi chạy gộp cả 5 file
liên tục (~12-16 phút, 118 testcase):** đã quan sát thấy các test KHÁC NHAU giữa các lần chạy gộp bị timeout
giả (`TC_NKGD_TS_02/04/09/21`, `TC_NKGD_LS_48`, `TC_NKGD_PBV_06` — không phải cùng 1 nhóm case ở mỗi lần), luôn
PASS lại ngay khi chạy riêng lẻ (1 file hoặc `-g <TC_ID>`) — cùng pattern flakiness đã ghi nhận ở Bảng Giá
(TC_BANGGIA_03/42/47, xem mục Bảng Giá bên dưới). Nếu 1 vài case NKGD fail khi chạy CI gộp cả 5 file, ĐỪNG vội
coi là bug thật — thử chạy lại riêng file/case đó trước khi kết luận. Ngoại lệ: TC_NKGD_TS_21 từng fail ổn định
kể cả chạy riêng lẻ do thiếu 1 bước `waitFor` trước khi ngắt mạng — đã sửa dứt điểm trong `nhat-ky-giao-dich-tai-san.spec.ts` (không còn flaky).

## Phân tích cơ bản — Khung/Shell ([tests/phan-tich-co-ban.spec.ts](tests/phan-tich-co-ban.spec.ts))

18 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass (chạy riêng lẻ `--workers=1`). Testcase doc:
[testcases/phan-tich-co-ban.md](testcases/phan-tich-co-ban.md). POM:
[pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts).

**⚠️ Không phải fixme nhưng cần lưu ý khi chạy CI — cùng pattern flakiness do resource contention đã ghi nhận ở
Bảng Giá/Nhật Ký GD:** khi chạy gộp cả file với 3 worker song song, các test KHÁC NHAU giữa các lần chạy đôi khi
timeout giả (`locator.waitFor`/`Target page... has been closed`) — luôn PASS lại ổn định khi chạy riêng lẻ
(`--workers=1`, đã xác nhận toàn bộ 18/18 pass). Nếu gặp fail khi chạy CI gộp nhiều file, thử chạy lại riêng
file/case đó trước khi kết luận là bug thật.

**⚠️ Lưu ý quan trọng khi viết thêm test cho các tab con của màn này:** tài khoản test dùng CHUNG cho nhiều
file khác trong dự án — "mã CK đang xem" (`final_mack`) là 1 setting lưu **server-side theo tài khoản** (đồng
bộ qua API `getusersettings`/`updateusersettings`), KHÔNG phải state riêng theo browser context. Test nào cần
1 mã CK xác định phải mock API `getusersettings` (xem `TC_PTCB_08` trong `phan-tich-co-ban.spec.ts`) thay vì
dựa vào điều hướng thật — nếu không sẽ bị nhiễu bởi các test khác đổi mã CK song song.

**Phát hiện đáng chú ý (bug thật đo được qua automation):**
- **`TheContainer.vue` — deep-link qua path param bị ghi đè:** truy cập `/phan-tich-co-ban/<mack>` (path param,
  không có `?mack=`) không load đúng mã trong URL nếu tài khoản đã có `final_mack` lưu từ trước — bị ghi đè về
  mã cũ. Nguyên nhân: điều kiện chặn ghi đè ở `TheContainer.vue` dòng ~1382 chỉ kiểm tra `$route.query.mack`,
  không biết tới `:macks*` (path param). `?mack=` (query) hoạt động đúng 100%. Chi tiết: TC_PTCB_08 trong
  [testcases/phan-tich-co-ban.md](testcases/phan-tich-co-ban.md).
- **Feature-gating nhiều cấp trong cùng 1 trang:** cấp shell (`index.vue`, chỉ 3/6 tab: Biểu đồ/So sánh/Bài
  viết & Phân tích) + cấp widget con riêng của từng tab (VD "4M & CANSLIM" có gate RIÊNG ở chính
  `FourmAndCanslim.vue`, độc lập với cấp shell). Dữ liệu `features_disabled` thật của tài khoản Free dùng chung
  hiện CHỈ khóa `fa_tai_lieu` ở cấp shell (không khóa `fa_so_sanh`/`fa_bieu_do_tc_*` dù code hỗ trợ) — chi tiết
  TC_PTCB_16/17. **⚠️ ĐÍNH CHÍNH (2026-08-20):** ghi chú gốc ở đây từng mô tả gate riêng của "4M & CANSLIM" là
  "chỉ 2 biểu đồ radar bị mờ" — đã đo lại bằng automation thật ở lượt sinh testcase riêng cho tab này và xác
  nhận SAI: gate đó thay thế **TOÀN BỘ** nội dung tab (kể cả thang điểm + biểu đồ lịch sử) bằng 1 ảnh mockup
  tĩnh duy nhất, không phải CSS blur trên nội dung thật. Chi tiết đầy đủ + cách đo:
  [testcases/phan-tich-co-ban-4m-canslim.md](testcases/phan-tich-co-ban-4m-canslim.md) mục "ĐÍNH CHÍNH quan
  trọng" (TC_PTCB_4M_16/17).

## Phân tích cơ bản — So sánh ([tests/phan-tich-co-ban-so-sanh.spec.ts](tests/phan-tich-co-ban-so-sanh.spec.ts))

26 testcase, **1 fixme** — 25/26 đã tự động hoá và pass (chạy `--workers=1`). Testcase doc:
[testcases/phan-tich-co-ban-so-sanh.md](testcases/phan-tich-co-ban-so-sanh.md). POM: section "Tab So sánh" ở
cuối [pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts).

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_PTCB_SS_15 | Kéo-thả sắp xếp lại thứ tự mã trong Danh sách mã (modal "Thêm mã") | `vuedraggable`/Sortable.js không dùng chuẩn HTML5 Drag & Drop API — chưa thử nghiệm đủ cách mô phỏng `mouse.down/move/up` nhiều bước để trigger đúng sự kiện thư viện này, cùng pattern đã ghi nhận ở TC_BANGGIA_37 (kéo-thả bảng giá) | Thử nghiệm thêm cách giả lập kéo-thả cho Sortable.js (tham khảo cách làm khi giải quyết được TC_BANGGIA_37, nếu có) |

**⚠️ AN TOÀN DỮ LIỆU:** 3 API mutate của tab này (`POST .../save_compare/store`, `PUT .../save_compare/update`,
`DELETE .../save_compare/destroy`) đều bị chặn/mock qua `page.route()` mặc định trong `beforeEach` của toàn bộ
file — không có request mutate thật nào lọt ra production trong 26 testcase.

**Phát hiện đáng chú ý (bug thật đo được qua automation, ưu tiên báo dev):**
- **[BUG NGHIÊM TRỌNG] Race condition khiến bảng dữ liệu so sánh TRỐNG VĨNH VIỄN khi deep-link/F5** (TC_PTCB_SS_02) —
  `Compare.getAll()` (trong `created()`) đọc ĐỒNG BỘ `store.state.list_mack_company` để tính `type_mack`, nhưng
  giá trị này chỉ được `TheContainer.getAllMack()` (socket `"getallstockcode"`) nạp BẤT ĐỒNG BỘ. Khi vào trang
  bằng 1 lượt tải đầy đủ (`page.goto`/F5/link chia sẻ), `list_mack_company` luôn rỗng lúc đọc → `type_mack` bị
  set cứng `""` → `items_table` computed trả `[]` MÃI MÃI (đã đo xác nhận chờ 30s+ không tự phục hồi). Cách
  DUY NHẤT phục hồi: đổi mã CK qua ô search (xem TC_PTCB_SS_03, helper
  `FaAnalysisPage.waitForCompareDataReady()`). Ảnh hưởng thật: người dùng bấm F5 hoặc mở link trực tiếp
  `?tab=so-sanh` sẽ luôn thấy bảng trống, không có gợi ý nào trên UI giải thích vì sao.
- **Gating "So sánh" ở 2 cấp độc lập:** cấp shell (`features_disabled['fa_so_sanh']`, đã đo KHÔNG khoá tài
  khoản Free hiện tại — xem `phan-tich-co-ban.md` TC_PTCB_17) và cấp widget riêng của chính
  `Compare/index.vue` (`$store.state.isAccountFree`, LUÔN giới hạn 6 dòng + hiện `UpdateRequire` bất kể
  `features_disabled`) — TC_PTCB_SS_05. Cùng pattern đã ghi nhận ở "4M & CANSLIM" (TC_PTCB_16).
- **Nút "Đóng" trong modal "Thêm mã" không huỷ thay đổi đã thao tác** (TC_PTCB_SS_14) — thêm/xoá mã rồi "Đóng"
  (không "Lưu") vẫn giữ nguyên state khi mở lại modal.
- **Không nhất quán xử lý lỗi mạng giữa các API trong cùng component:** `getAll()` (bảng chính) nuốt lỗi hoàn
  toàn không toast (TC_PTCB_SS_23), trong khi `getList()`/`deleteRowItem()`/`saveRowItem()`/`addNewRow()` đều
  có toast lỗi rõ ràng (TC_PTCB_SS_24).

## Phân tích cơ bản — 4M & CANSLIM ([tests/phan-tich-co-ban-4m-canslim.spec.ts](tests/phan-tich-co-ban-4m-canslim.spec.ts))

19 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass. Testcase doc:
[testcases/phan-tich-co-ban-4m-canslim.md](testcases/phan-tich-co-ban-4m-canslim.md). POM: section "Tab 4M &
CANSLIM" ở cuối [pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts).

**⚠️ Giới hạn kỹ thuật cần biết khi sửa/thêm test cho tab này:** `CustomEChart` dùng `CanvasRenderer` — mọi nội
dung biểu đồ (label radar, giá trị điểm trên biểu đồ lịch sử) là pixel vẽ trên `<canvas>`, KHÔNG phải text DOM
(xác nhận qua `ariaSnapshot` không hề chứa các label/giá trị này). Test chỉ verify được canvas tồn tại/hiển
thị, KHÔNG assert được nội dung chữ bên trong — xem ghi chú đầy đủ ở TC_PTCB_4M_03 trong file `.md`. Click vào 1
điểm dữ liệu trên biểu đồ lịch sử (`clickHistoryChartPoint()` trong POM) phải `scrollIntoViewIfNeeded()` TRƯỚC
khi đo `boundingBox()` — khối "Điểm Canslim" nằm dưới khối "Điểm 4M" nên thường ở ngoài viewport mặc định
(720px cao), `page.mouse.click()` gửi toạ độ viewport thô nên click "trúng" toạ độ ngoài vùng nhìn thấy sẽ luôn
thất bại âm thầm (đã từng gặp lỗi này lúc viết test, đã sửa).

**⚠️ ĐÍNH CHÍNH quan trọng (2026-08-20):** ghi chú cũ ở mục "Phân tích cơ bản — Khung/Shell" phía trên
(TC_PTCB_16) và comment tại TC_PTCB_17 trong `tests/phan-tich-co-ban.spec.ts` mô tả gate riêng của tab này là
"chỉ 2 biểu đồ radar bị mờ, phần thang điểm + lịch sử vẫn hiển thị bình thường" — **đã đo lại bằng automation
thật (tài khoản Free) và xác nhận SAI**. Hành vi đúng: `disable_featureName` (kiểm tra
`features_disabled.hasOwnProperty("fa_4m_cansslim")`) gate **TOÀN BỘ** component (`<ProtectedView
v-if="disable_featureName" />` bọc ở CẤP NGOÀI CÙNG template, `.chart-wrapper` đo được 0 phần tử khi gated).
`ProtectedView` chỉ render 1 `<img>` DUY NHẤT — ảnh mockup TĨNH (`blur_img` URL) được thiết kế sẵn trông giống
layout thật (có số điểm mẫu + biểu đồ mẫu, tự ảnh đã "mờ" sẵn 2 vùng radar bên trong nội dung ảnh), không phải
dữ liệu thật render bằng Vue/echarts — API tính điểm thật hoàn toàn KHÔNG được gọi khi bị gate. Nhiều khả năng
ghi chú cũ chỉ nhìn ảnh chụp màn hình bề ngoài (mockup trông giống thật) mà chưa kiểm tra DOM/network thật.
Chi tiết đầy đủ: [testcases/phan-tich-co-ban-4m-canslim.md](testcases/phan-tich-co-ban-4m-canslim.md) mục "ĐÍNH
CHÍNH quan trọng" (TC_PTCB_4M_16/17) — khuyến nghị coi đây là mô tả đúng, ghi chú cũ ở TC_PTCB_16/17 nên được
cập nhật lại trong 1 lượt riêng.

**Phát hiện đáng chú ý khác đo được qua automation:**
- Banner "Không đủ dữ liệu để chấm điểm" và banner cảnh báo (`warning`) loại trừ lẫn nhau (`v-if`/`v-else-if`
  chung 1 vị trí) — nếu điểm là N/A, mọi cảnh báo bị ẩn hoàn toàn dù có dữ liệu (TC_PTCB_4M_12).
- Lỗi mạng (silent catch, không toast) và API trả `-1` tường minh đều ra badge "N/A" nhưng KHÔNG nhất quán về
  banner giải thích đi kèm (TC_PTCB_4M_11 vs. 14) — cùng pattern "nuốt lỗi âm thầm" đã ghi nhận ở tab So Sánh.
- KHÔNG có bug race condition deep-link như tab So Sánh (TC_PTCB_4M_10) — `FourmAndCanslim` chỉ phụ thuộc
  `$store.state.mack` (set đồng bộ), không đọc state nào nạp bất đồng bộ.

## Phân tích cơ bản — Biểu đồ ([tests/phan-tich-co-ban-bieu-do.spec.ts](tests/phan-tich-co-ban-bieu-do.spec.ts))

23 testcase, **1 fixme** — 22/23 đã tự động hoá và pass (đã chạy ổn định 2 lần liên tiếp, 3 worker song song).
Testcase doc: [testcases/phan-tich-co-ban-bieu-do.md](testcases/phan-tich-co-ban-bieu-do.md). POM: section "Tab
Biểu đồ" ở cuối [pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts).

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_PTCB_BD_21 | Kéo-thả sắp xếp lại thứ tự mã trong "Danh sách mã" (modal "Thêm mã", mã ngân hàng) | `vuedraggable`/Sortable.js không dùng chuẩn HTML5 Drag & Drop API — cùng hạn chế đã ghi nhận ở TC_PTCB_SS_15 (tab So sánh) và TC_BANGGIA_37 (Bảng Giá) | Thử nghiệm thêm cách giả lập kéo-thả cho Sortable.js (tham khảo cách làm nếu TC_PTCB_SS_15/TC_BANGGIA_37 được giải quyết trước) |

**⚠️ ĐÍNH CHÍNH quan trọng (đọc trước khi dùng lại giả định ban đầu):** tab này KHÔNG dùng TradingView
candlestick như suy đoán ban đầu trong đề bài gốc — là lưới nhiều biểu đồ ECharts tài chính theo quý (cùng công
nghệ `CustomEChart` với tab 4M & CANSLIM), khác component hoàn toàn tuỳ nhóm mã: `ChartByNonBank.vue` (mã
thường/BĐS/bảo hiểm) vs. `ChartByBank.vue` (CHỈ mã ngân hàng). Xác nhận qua đọc source (không có
`<iframe>`/`blob:`) + đo DOM thật — bài học lặp lại (giống 4M & CANSLIM trước đó): luôn verify qua source/DOM
thật, đừng suy luận từ tên tab.

**⚠️ AN TOÀN DỮ LIỆU:** Tab này KHÔNG có API mutate nào ghi dữ liệu tài khoản — mọi request (`GET
/api/stocks/chart/nonbank`, `/chart/bank`, `/chart/bank/scatter`) chỉ đọc, kể cả nút "Lưu" trong modal "Thêm mã"
(chỉ gọi lại GET với tham số khác). Không cần mock để tránh ghi dữ liệu thật.

**Phát hiện đáng chú ý (2 bug thật đo được qua automation, ưu tiên báo dev):**
- **[BUG #1] Race condition `nhom_stockcode`:** mã ngân hàng (VD VCB) luôn mount NHẦM `ChartByNonBank` trước
  (đọc `store.state.list_mack_company[stockcode]?.nhom` — nạp bất đồng bộ qua socket, CÙNG CƠ CHẾ gây bug tab So
  Sánh), gọi sai `GET /api/stocks/chart/nonbank?mack=VCB` (đo được trả **500**), rồi mới tự chuyển đúng sang
  `ChartByBank` khi `list_mack_company` nạp xong (TC_PTCB_BD_03). **Khác bug So Sánh:** TỰ PHỤC HỒI hoàn toàn
  KHÔNG cần thao tác thủ công (do `nhom_stockcode` là computed reactive, không phải giá trị tính 1 lần) — vẫn
  tốn 1 request lãng phí + lỗi 500 mỗi lần deep-link/F5/đổi mã sang mã ngân hàng.
- **[BUG #2] `ChartByBank` luôn phát sinh đúng 2 lỗi console `TypeError: Cannot read properties of undefined
  (reading 'series')` mỗi lần MOUNT MỚI** (TC_PTCB_BD_04/05) — `data()` chỉ khởi tạo 4/11 key của `options_bank`
  nhưng template đọc `options_bank['pe_pb'].series.length`/`['llr']...` ngay lần render đầu (trước khi API
  resolve). Xác nhận tái hiện ổn định ở CẢ deep-link/F5 LẪN đổi mã CK qua search (SPA) — độc lập với bug #1,
  KHÔNG chỉ xảy ra khi lỗi mạng. Trang tự hồi phục hiển thị đúng sau khi API resolve (không trống vĩnh viễn),
  nhưng lỗi console vẫn phát sinh thật mỗi lần, có thể gây nhiễu hệ thống theo dõi lỗi (Sentry...).
- **Gating per-chart (KHÁC gate cấp shell `fa_bieu_do_tc_*`, đã đo KHÔNG khoá tài khoản Free hiện tại ở
  `phan-tich-co-ban.md` TC_PTCB_17):** mã thường có 8/10 chart bị `UpdateRequire` che (trừ "Tài sản
  quý"/"Nguồn vốn quý"); mã ngân hàng có 10/11 chart bị che (trừ "Tài sản quý") — TC_PTCB_BD_12/13. Cùng pattern
  gating "nhiều cấp" đã ghi nhận ở "So sánh"/"4M & CANSLIM".
- Chỉ mã ngân hàng mới có nút "Thêm mã" (mở modal so sánh nhiều mã ngân hàng trên biểu đồ radar + chọn kỳ báo
  cáo Quý/Năm) — `ChartByNonBank` không có tính năng này.

**⚠️ Lưu ý khi chạy CI — nhóm test tài khoản Free (`TC_PTCB_BD_12/13/14`) BẮT BUỘC chạy tuần tự
(`test.describe.configure({ mode: 'serial' })`)** — đã xác nhận qua lỗi thật: chạy song song 3 test Free cùng
lúc (3 worker) khiến phiên đăng nhập của nhau bị vô hiệu hoá giữa chừng (tài khoản Free chỉ hỗ trợ 1 phiên tại 1
thời điểm), gây timeout giả `mainTabList không bao giờ hiện sau login`. Nếu thêm test Free mới vào nhóm này,
giữ nguyên `serial` mode.

## Phân tích cơ bản — Bài viết & Phân tích ([tests/phan-tich-co-ban-bai-viet-phan-tich.spec.ts](tests/phan-tich-co-ban-bai-viet-phan-tich.spec.ts))

21 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass. Testcase doc:
[testcases/phan-tich-co-ban-bai-viet-phan-tich.md](testcases/phan-tich-co-ban-bai-viet-phan-tich.md). POM:
section "Tab Bài viết & Phân tích" ở cuối [pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts).

**⚠️ ĐÍNH CHÍNH kiến trúc quan trọng:** tab này KHÔNG có 3 sub-tab điều hướng như app (Bài viết/BCTC gốc/Phân
tích) — layout CỐ ĐỊNH, hiển thị ĐỒNG THỜI cả 3 loại nội dung trên 1 màn hình: cột trái "Bài viết", cột phải xếp
dọc "Báo cáo phân tích" + "BCTC gốc" (bảng này có 4 sub-tab RIÊNG bên trong nó: "BCTC gốc"/"Bản cáo bạch &
BCTN"/"Nghị quyết"/"Báo cáo quản trị", type=1/3/4/5).

**⚠️ AN TOÀN DỮ LIỆU:** Tab này KHÔNG có API mutate nào — mọi request (`get-list-news`, `get-report`,
`get-document`...) chỉ đọc. Click icon "File" mở PDF thật qua `window.open()` — Chromium xử lý như DOWNLOAD (sự
kiện `download`), test chỉ bắt sự kiện để verify URL `.pdf`, KHÔNG gọi `download.saveAs()` nên không có file nào
thực sự lưu xuống máy chạy test.

**Phát hiện đáng chú ý (đo được qua automation):**
- **Sub-tab "Sự kiện" là dead code:** component `NewsEvent/Events.vue` đầy đủ chức năng (API/list/modal/phân
  trang riêng) tồn tại trong codebase nhưng KHÔNG có cách nào truy cập qua UI — `NewsEvent/index.vue` có sẵn
  `option_tab` chứa cả "Bài viết"/"Sự kiện" nhưng template không loop qua nó, chỉ render tĩnh "Bài viết".
- **"BCTC gốc" dùng 4 tab riêng, không phải dropdown như app** — mỗi tab gọi API `get-document` với `type` khác
  nhau (1/3/4/5, không có `type=2`).
- **Cơ chế lọc theo ngày không nhất quán giữa 3 khu vực:** chỉ "Bài viết" lọc server-side (gọi lại API khi bấm
  "Tìm kiếm"); "Báo cáo phân tích" lọc client-side theo ngày chính xác trên dữ liệu đã tải sẵn; "BCTC gốc" lọc
  client-side nhưng CHỈ theo NĂM (thô hơn nhiều).
- **"BCTC gốc" không có thông báo "Không có dữ liệu" khi trống** — khác 2 khu vực còn lại (có text rõ ràng),
  "BCTC gốc" chỉ hiện 1 dòng bảng trống hoàn toàn không chữ.
- **Không có UI loading (spinner/che màn) nào ở cả 3 khu vực** — biến `is_loading` tồn tại trong cả 3 component
  con nhưng không được dùng trong template, khác hẳn tab "Biểu đồ"/"4M & CANSLIM".
- **Gate cấp shell (`fa_tai_lieu`) khoá đúng toàn bộ tab với tài khoản Free hiện tại** — xác nhận lại đúng hành
  vi đã ghi nhận ở TC_PTCB_17 (`phan-tich-co-ban.md`), không có gate riêng cấp widget nào khác ở tab con này.

## Phân tích cơ bản — Tài chính doanh nghiệp ([tests/phan-tich-co-ban-tai-chinh-doanh-nghiep.spec.ts](tests/phan-tich-co-ban-tai-chinh-doanh-nghiep.spec.ts))

37 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass. Testcase doc:
[testcases/phan-tich-co-ban-tai-chinh-doanh-nghiep.md](testcases/phan-tich-co-ban-tai-chinh-doanh-nghiep.md).
POM: section "Tab Tài chính doanh nghiệp" ở cuối [pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts). Đây là tab
LỚN NHẤT đã sinh testcase tới nay (5 sub-report con: Bảng cân đối kế toán/Kết quả kinh doanh/Lưu chuyển tiền
tệ/Thuyết minh/Chỉ tiêu tài chính), không có tính năng kéo-thả/upload/download nào nên không có case nào cần
`test.fixme`.

**⚠️ AN TOÀN DỮ LIỆU:** Toàn bộ API của tab này chỉ ĐỌC (`GET /api/stocks?type=bs|is|cf|tm...`,
`GET /api/stocks/financial-ratios...`) — không có tính năng xuất Excel/lưu tuỳ chỉnh nào trong cả 5 sub-report
(đã grep xác nhận), an toàn gọi API thật cho mọi testcase.

**Phát hiện đáng chú ý (đo được qua automation):**
- **[XÁC NHẬN AN TOÀN] KHÔNG có race condition `nhom_stockcode`** như tab "Biểu đồ"/"So sánh" — nhóm mã
  (nonbank/bank/stock/insurance) đọc từ chính `response.data[0]` của API báo cáo, KHÔNG đọc
  `store.state.list_mack_company` (nạp bất đồng bộ qua socket). Deep-link thẳng vào mã ngân hàng (VCB) hiển thị
  đúng ngay lập tức, không request nào lỗi (TC_PTCB_TCDN_20).
- **"Thuyết minh" gate theo ROLE tài khoản (`localStorage.roles` chứa `"coworker"`), kiểu gate thứ 3 hoàn toàn
  độc lập với gói hội viên** (khác `features_disabled` cấp shell/widget và `isAccountFree` đã ghi nhận ở các
  tab khác) — tài khoản test chính (có role `coworker`) thấy 5 sub-tab, tài khoản Free (không có role này) chỉ
  thấy 4 sub-tab (TC_PTCB_TCDN_04/33).
- **Gating theo gói hội viên ở cấp TỪNG SUB-TAB** — tài khoản Free hiện tại CHỈ bị khoá "Chỉ tiêu tài chính"
  (`fa_cttc` có trong `features_disabled`), 3 sub-tab BS/IS/CF hiển thị bình thường (TC_PTCB_TCDN_28/29). Free
  còn bị ép mặc định "Tỷ đồng"/"Năm" + khoá đổi đơn vị/kỳ trên MỌI sub-tab, độc lập với gate trên
  (TC_PTCB_TCDN_30).
- **Không có caching client-side** — 5 sub-report dùng `v-if` (không phải `v-show`), mỗi lần chuyển sub-tab đều
  unmount/remount thật và gọi lại API, kể cả quay lại đúng sub-tab đã xem (TC_PTCB_TCDN_07).
- **Lỗi mạng/500 bị nuốt im lặng, không toast, NHẤT QUÁN trên cả 5 sub-report** (TC_PTCB_TCDN_27) — cùng UX gap
  đã ghi nhận ở `getAll()` tab So sánh.
- **"Chỉ tiêu tài chính" KHÔNG có cấu trúc cây thu gọn/mở rộng như app mô tả** (Sheet kỳ vọng 7 nhóm thu gọn
  được) — web hiển thị PHẲNG toàn bộ, các "nhóm" chỉ là dòng tiêu đề trực quan (TC_PTCB_TCDN_18).

## Phân tích cơ bản — Thông tin chung (Shell) ([tests/phan-tich-co-ban-thong-tin-chung.spec.ts](tests/phan-tich-co-ban-thong-tin-chung.spec.ts))

27 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass (chạy `--workers=1`). Testcase doc:
[testcases/phan-tich-co-ban-thong-tin-chung.md](testcases/phan-tich-co-ban-thong-tin-chung.md). POM: section
"Tab Thông tin chung — Shell + Sub-tab Thông tin tài chính" ở cuối
[pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts). Đây là **1/4 tài liệu con** của tab "Thông tin chung" (tab
lớn nhất, mặc định của màn) — tài liệu này CHỈ phủ khung/shell (cột trái `Left.vue` luôn hiển thị + thanh 7
sub-tab của `Right.vue`, chỉ xác nhận tồn tại/chuyển được cho 6 sub-tab kia) và sub-tab MẶC ĐỊNH "Thông tin tài
chính" (bảng snapshot BS/KQKD/Chỉ số tài chính theo quý + 3 biểu đồ). 3 tài liệu con còn lại (nội dung chi tiết
"Hồ sơ"/"Cổ đông", "Thông tin giao dịch"/"Sự kiện", "Nước ngoài"/"Tự doanh") sẽ sinh ở các lượt sau.

**⚠️ AN TOÀN DỮ LIỆU:** 2 icon có khả năng mutate dữ liệu thật (watchlist star, "Tạo cảnh báo"/"Thêm giao dịch")
CHỈ được verify MỞ ĐƯỢC modal/dropdown, không thao tác tiếp bên trong — không có request mutate nào lọt ra
production trong toàn bộ file spec này.

**Phát hiện đáng chú ý (đo được qua automation):**
- **[XÁC NHẬN AN TOÀN] KHÔNG có bug race condition "trống vĩnh viễn" như tab "So sánh"/"Biểu đồ"** — chỉ có 1
  trạng thái trống TẠM THỜI (~1 giây) ở header công ty khi deep-link, tự phục hồi đúng nhờ `computed` reactive.
  3 biểu đồ snapshot đọc `type_bank` trực tiếp từ response API, không phụ thuộc `list_mack_company` — an toàn
  100% (TC_PTCB_TTC_12/13/21).
- **Gate cấp WIDGET riêng của `Right.vue` (`features_disabled`), độc lập với gate cấp shell/tab chính** — 5/7
  sub-tab có thể bị khoá, "Thông tin tài chính"/"Hồ sơ" KHÔNG BAO GIỜ bị khoá qua cơ chế này (TC_PTCB_TTC_23/24).
- **[PHÁT HIỆN MỚI] `CCol xl="3"` (biểu đồ phụ trợ bên phải) KHÔNG PHẢI "không bao giờ bị gate" như dự kiến ban
  đầu — mỗi component biểu đồ con (`ChartAnalysis`/`ChartForeignTransaction`/`ChartProprietaryTransaction`/
  `ChartEvents`) TỰ CÓ `<ProtectedView>` riêng với feature key riêng, độc lập hoàn toàn với key của `CCol
  xl="9"` cùng sub-tab.** Tài khoản Free hiện tại bị khoá CẢ 2 cấp ở "Nước ngoài"/"Tự doanh" (2 `ProtectedView`
  độc lập cùng hiện), nhưng CHỈ 1 cấp ở "Thông tin giao dịch" — ví dụ đúng cho pattern "gate không bọc toàn bộ
  widget" đã ghi nhận ở tab "Tài chính doanh nghiệp" (TC_PTCB_TTC_25/26 — đã viết lại so với bản dở dang ban đầu
  sau khi phát hiện này).
- **2 icon "Tạo cảnh báo"/"Thêm giao dịch" ở cột trái gate theo `isAccountFree`, khác cơ chế `features_disabled`
  ở trên** — mở modal nâng cấp gói thay vì modal thật (TC_PTCB_TTC_10). Modal này dùng class
  `modal-hide-header-footer` (ẩn cả nút đóng "×"), Escape KHÔNG đóng được — test đóng lại bằng cách tải lại
  trang thay vì thao tác UI.
- **Sub-tab tự viết tay, không đổi URL khi chuyển** — F5 giữa lúc đang ở sub-tab khác "Thông tin tài chính" sẽ
  mất sub-tab đang xem, quay về mặc định. Đổi mã CK KHÔNG ảnh hưởng sub-tab đang chọn (TC_PTCB_TTC_17/18).
- **Modal phóng to biểu đồ P/E-P/B (`ChartPriceEvents.vue`, `showPopupChart`) là DEAD CODE** — không có điểm
  vào nào trong UI để mở, cùng pattern dead code đã ghi nhận ở sub-tab "Sự kiện" của tab "Bài viết & Phân tích".

**Ghi chú kỹ thuật khi viết thêm test cho tab này:** trình duyệt CHUẨN HOÁ lại biểu thức CSS `calc()` khi
serialize style (`calc(100vh - 144px)` trong source render ra `calc(-144px + 100vh)` trong DOM thật) — không
dùng attribute selector khớp chuỗi `calc()` y hệt source, dùng 1 phần ổn định hơn (VD `[style*="144px"]`). Biểu
đồ nến TradingView (`ChartTradingViewEvents.vue`) cần chờ `tvWidget.onChartReady()` xong (dùng tín hiệu "1m"
active mặc định làm mốc) TRƯỚC khi thao tác khung thời gian/icon đổi loại biểu đồ/indicator — thao tác quá sớm
khiến `tvWidget.activeChart()` throw âm thầm bên trong handler `@click`, không set được state (xem
`FaAnalysisPage.waitForCandleChartReady()`).

---

## Phân tích cơ bản — Thông tin chung — Hồ sơ + Cổ đông ([tests/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.spec.ts](tests/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.spec.ts))

22 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass. Testcase doc:
[testcases/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md](testcases/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md).
POM: section "Tab Thông tin chung — Sub-tab Hồ sơ + Cổ đông" ở cuối
[pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts). Đây là **2/4 tài liệu con** của tab "Thông tin chung" — phủ
sub-tab "Hồ sơ" (`Profile.vue` + `LeaderShip.vue`) và "Cổ đông" (`TableShareHolder.vue` + `ChartAnalysis.vue`).
2 tài liệu con còn lại ("Thông tin giao dịch"/"Sự kiện", "Nước ngoài"/"Tự doanh") sẽ sinh ở các lượt sau.

**⚠️ Lưu ý khi chạy song song:** 4 test dùng tài khoản Free (TC_10/17/18/19) được gộp vào 1
`test.describe.configure({ mode: 'serial' })` DUY NHẤT trong file — đã đo thật: nếu để rải rác ở nhiều describe
khác nhau, 2+ Playwright worker cùng đăng nhập đồng thời 1 tài khoản Free dùng chung có thể gây `test.skip` giả
(phiên đăng nhập tranh chấp khiến `errorAlert` thoáng hiện) dù bản thân sub-tab hoàn toàn không có vấn đề. Nếu
thêm test Free mới cho file này, PHẢI thêm vào trong cùng describe `serial` đó, không tạo describe Free riêng.

**Phát hiện đáng chú ý (đo được qua automation):**
- **[BUG dữ liệu] Free — donut "Tổng quan" (Cơ cấu sở hữu) ở "Cổ đông" hiển thị SAI/THIẾU phần "Nước ngoài" vĩnh
  viễn** — `getListForeignTransaction()` (nguồn `so_huu_nuoc_ngoai_final`) bị bọc `if (!isAccountFree)`, tài
  khoản Free KHÔNG BAO GIỜ gọi API `/api/foreign-trading` (đo network: trả phí gọi 1 lần, Free gọi 0 lần). Hậu
  quả donut hiện "Nước ngoài: %" rỗng + "Khác" bị cộng sai — CHỈ xác nhận được qua ảnh chụp (legend vẽ bằng
  ECharts `CanvasRenderer`, không phải DOM text). Khác hẳn cơ chế `ProtectedView` quen thuộc — không có overlay
  che, dữ liệu vẫn hiển thị nhưng sai ngầm (TC_PTCB_TTC_HSCD_17).
- **[BUG hiển thị] Mã không phải cổ phiếu thường (ETF, VD `E1VFVN30`) — donut "Tổng quan" hiện "NaN%"** (field
  `so_huu_nha_nuoc` không hợp lệ trong response), đồng thời bảng "Cổ đông lớn" trống hoàn toàn KHÔNG có thông
  báo "Không có dữ liệu" (khác `Events.vue` đã có sẵn `#no-items-view`) — TC_PTCB_TTC_HSCD_14/16.
- **Sub-tab con "Ngành nghề"/"Lịch sử" (`Profile.vue`) không bị reset khi đổi mã CK** — component không unmount
  khi đổi mã (chỉ đổi props), state cục bộ giữ nguyên — TC_PTCB_TTC_HSCD_05.
- **Click 1 dòng cổ đông trong bảng "Cổ đông lớn" không có hành động gì**, khác hẳn click 1 lãnh đạo (mở modal
  "Thông tin chi tiết" với các section động tuỳ dữ liệu) — TC_PTCB_TTC_HSCD_07/08/13.
- **[XÁC NHẬN AN TOÀN] Verify đầy đủ 2 cấp gate `features_disabled` cho "Cổ đông"** (`fa_co_dong` cho nội dung
  chính, `fa_co_dong_va_gd_co_dong_bieu_do` cho panel biểu đồ) — tài khoản Free hiện tại KHÔNG bị khoá ở CẢ 2
  cấp, verify TÁCH RIÊNG từng cấp (đúng bài học từ tài liệu 1/4). "Hồ sơ" về mặt code KHÔNG THỂ bị khoá qua cơ
  chế này ở cả 2 cấp (TC_PTCB_TTC_HSCD_10/18/19).

## Phân tích cơ bản — Thông tin chung — Thông tin giao dịch + Sự kiện ([tests/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.spec.ts](tests/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.spec.ts))

22 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass (`--workers=1`). Testcase doc:
[testcases/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md](testcases/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md).
POM: section "Tab Thông tin chung — Sub-tab Thông tin giao dịch + Sự kiện" ở cuối
[pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts). Đây là **3/4 tài liệu con** của tab "Thông tin chung" — phủ
sub-tab "Thông tin giao dịch" (`TableInfoTransaction.vue` + tái dùng `ChartAnalysis.vue`) và "Sự kiện"
(`Events.vue` + `ChartEvents.vue`). 1 tài liệu con còn lại ("Nước ngoài"/"Tự doanh") sẽ sinh ở lượt cuối.

**⚠️ 2 lỗi đo được lúc sinh ban đầu đã sửa lại trong 1 lượt review riêng (không phải bug thật của web, lỗi ở
chính test):**
1. TC_02 (assert ngày RAW `YYYY-MM-DD`, không phải `DD-MM-YYYY`) ban đầu dùng `allTextContents()` trên CẢ DÒNG
   `<tr>` — 2 ngày ISO liền kề (VD `2024-03-15` + `2024-03-20`) nối liền không dấu phân cách tạo ra substring
   tình cờ khớp NHẦM regex `\d{2}-\d{2}-\d{4}` ở ranh giới 2 ô (`...24-03-1520...`). Sửa: đọc riêng từng `<td>`
   + regex neo `^...$` thay vì tìm substring trong text nguyên dòng.
2. TC_12 (bảng rỗng, mock `get-list-event` trả `[]`) ban đầu assert `eventsRows` (đếm `tbody tr`) phải bằng 0 —
   SAI vì CoreUI `<CDataTable>` render slot `#no-items-view` NHƯ 1 DÒNG `<tr>` (colspan) NẰM TRONG `tbody`, không
   phải phần tử tách biệt ngoài bảng. Sửa: assert còn đúng 1 "dòng" (chính dòng thông báo) chứa text "Không có
   dữ liệu", không phải 0 dòng.

**Phát hiện đáng chú ý (đo được qua automation):**
- **[BUG thật] Free — đổi mã CK KHÔNG refresh bảng "Sự kiện"** — `getListEvents()` gọi KHÔNG điều kiện ở
  `created()` nhưng bị bọc `if (!isAccountFree)` trong `watch: stockcode()` — bất đối xứng, nhiều khả năng là
  sai sót logic (copy-paste thiếu đồng bộ với chỗ khác). Hậu quả: tài khoản Free đổi mã CK xong vẫn thấy dữ
  liệu sự kiện của MÃ CŨ, không có cảnh báo nào. Xác nhận qua DOM text thật (không bị giới hạn canvas như bug
  donut ở tài liệu 2/4) — TC_PTCB_TTC_GDSK_20.
- **Dead code**: cột ngày `TableInfoTransaction.vue` có method `formatDate()` (định dạng `DD-MM-YYYY`) nhưng
  KHÔNG được gọi ở template — hiển thị RAW `YYYY-MM-DD` từ API, khác quy ước ngày ở các bảng khác trong màn
  hình — TC_PTCB_TTC_GDSK_02.
- **Panel bên phải sub-tab "Thông tin giao dịch" tái sử dụng Y HỆT `ChartAnalysis.vue` của "Cổ đông"** — nội
  dung donut cơ cấu sở hữu hoàn toàn không liên quan tới giao dịch nội bộ, dễ gây nhầm khi đọc source lần đầu
  (tái sử dụng có chủ đích, không phải bug) — TC_PTCB_TTC_GDSK_03.
- **Mã ETF không có giao dịch nội bộ** — bảng "Thông tin giao dịch" trống hoàn toàn, KHÔNG có thông báo "Không
  có dữ liệu" (khác `Events.vue` đã xử lý rỗng đúng) — cùng pattern đã ghi nhận ở bảng "Cổ đông lớn" (tài liệu
  2/4) — TC_PTCB_TTC_GDSK_04.
- **[XÁC NHẬN AN TOÀN] Verify đầy đủ 2 cấp gate cho cả 2 sub-tab** — "Thông tin giao dịch" chỉ bị khoá 1 cấp
  (nội dung chính, `fa_giao_dich_noi_bo`), panel biểu đồ phụ trợ (`fa_co_dong_va_gd_co_dong_bieu_do`) KHÔNG bị
  khoá; "Sự kiện" KHÔNG bị khoá ở cả 2 cấp (`fa_su_kien`/`fa_bieu_do_co_tuc`) với tài khoản Free hiện tại —
  TC_PTCB_TTC_GDSK_16-19.
- **[ĐÍNH CHÍNH so với đề bài lúc giao việc] `ChartPriceEvents.vue`/`ChartTradingViewEvents.vue` KHÔNG thuộc
  phạm vi sub-tab "Sự kiện"** — 2 file này chỉ được `Left.vue` (biểu đồ nến chính, đã phủ ở tài liệu 1/4) render
  — TC_PTCB_TTC_GDSK_15.

---

## Phân tích cơ bản — Thông tin chung — Nước ngoài + Tự doanh ([tests/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.spec.ts](tests/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.spec.ts))

19 testcase, **0 fixme** — toàn bộ đã tự động hoá và pass (`--workers=1`, đã chạy lại 2 lần liên tiếp để xác
nhận ổn định). Testcase doc:
[testcases/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md](testcases/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md).
POM: section "Tab Thông tin chung — Sub-tab Nước ngoài + Tự doanh" ở cuối
[pages/FaAnalysisPage.ts](pages/FaAnalysisPage.ts). Đây là **4/4 (LƯỢT CUỐI)** tài liệu con của tab "Thông tin
chung" — phủ sub-tab "Nước ngoài" (`TableForeignTransaction.vue` + `ChartForeignTransaction.vue`, nhận dữ liệu
qua props từ `Common/index.vue`) và "Tự doanh" (`TableProprietaryTransaction.vue` +
`ChartProprietaryTransaction.vue`, mỗi component tự gọi API riêng).

**Phát hiện đáng chú ý (đo được qua automation):**
- **[CÂU TRẢ LỜI cho câu hỏi quan trọng nhất lượt này] Pattern "API skip bất đối xứng `created()`/`watch`" đã
  lặp lại 2 lần liên tiếp ở tài liệu 2/4 và 3/4 KHÔNG lặp lại ở "Nước ngoài"/"Tự doanh".** "Nước ngoài": gate
  `isAccountFree` trong `Common/index.vue` áp dụng ĐỐI XỨNG ở cả `created()` lẫn `watch: stockcode()` (0
  request tới `get-list-foreign-transaction`/`get-count-page-foreign-transaction`/`api/foreign-trading` ở MỌI
  thời điểm cho Free) — đoạn code này CHÍNH LÀ nguồn gốc bug donut "Tổng quan" đã ghi nhận ĐẦY ĐỦ ở tài liệu 2/4
  (TC_PTCB_TTC_HSCD_17), không phải bug mới. "Tự doanh": KHÔNG có bất kỳ check `isAccountFree` nào trong 2
  component tự fetch riêng — hoàn toàn đối xứng. TC_PTCB_TTC_NNTD_15.
- **[BUG lãng phí network, MỚI] Free — biểu đồ "Tự doanh" (`ChartProprietaryTransaction.vue`, `CCol xl="3"`)
  VẪN mount và gọi API `/api/proprietary-trading` dù bị `ProtectedView` khoá ngay sau đó** (Right.vue chỉ
  `v-if` theo `type_tab`, KHÔNG kiểm tra gate ở cấp `CCol xl="3"` — component tự che bằng `ProtectedView` RIÊNG
  BÊN TRONG chính nó, sau khi `created()` đã chạy) — khác bảng "Tự doanh" (`CCol xl="9"`), bị `Right.vue` chặn
  mount HOÀN TOÀN nên không lãng phí. Không phải bug hiển thị sai dữ liệu, chỉ lãng phí network/tải server —
  TC_PTCB_TTC_NNTD_16.
- **[XÁC NHẬN AN TOÀN] "Nước ngoài" VÀ "Tự doanh" là 2 sub-tab DUY NHẤT trong tab "Thông tin chung" bị khoá CẢ 2
  CẤP `features_disabled` CÙNG LÚC** (`CCol xl="9"` + `CCol xl="3"`) với tài khoản Free hiện tại — khớp đúng dự
  đoán đã ghi ở tài liệu 1/4 (TC_PTCB_TTC_25) — TC_PTCB_TTC_NNTD_13/14.
- **Mã ETF (`E1VFVN30`) tái hiện bug NaN% ở donut "Tổng quan" panel "Nước ngoài"** — cùng root cause đã ghi ở
  tài liệu 2/4 (`ChartForeignTransaction.vue` dùng chung prop `chartdata_co_cau_so_huu` với `ChartAnalysis.vue`)
  — chỉ xác nhận được qua ảnh chụp (ECharts `CanvasRenderer`, không assert DOM text được) —
  TC_PTCB_TTC_NNTD_06.
- **Cả 2 bảng (`TableForeignTransaction.vue`/`TableProprietaryTransaction.vue`) không xử lý mảng rỗng** — cùng
  pattern `TableShareHolder.vue` (2/4)/`TableInfoTransaction.vue` (3/4), không có thông báo "Không có dữ liệu"
  — TC_PTCB_TTC_NNTD_07/12.
- **[Kiến trúc] "Tự doanh" tự chủ 2 API riêng** (`/api/proprietary-trading/paginate` cho bảng,
  `/api/proprietary-trading` không phân trang cho biểu đồ, không chia sẻ cache) — khác "Nước ngoài" (dùng chung
  state đã fetch sẵn từ `Common/index.vue` qua props) — TC_PTCB_TTC_NNTD_01/08/09/11.

**Tổng kết 4/4 tài liệu con tab "Thông tin chung" (HOÀN TẤT):**
1. [phan-tich-co-ban-thong-tin-chung.md](testcases/phan-tich-co-ban-thong-tin-chung.md) — Khung/shell + sub-tab
   mặc định "Thông tin tài chính" (27 testcase).
2. [phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md](testcases/phan-tich-co-ban-thong-tin-chung-ho-so-co-dong.md)
   — Sub-tab "Hồ sơ" + "Cổ đông" (22 testcase).
3. [phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md](testcases/phan-tich-co-ban-thong-tin-chung-giao-dich-su-kien.md)
   — Sub-tab "Thông tin giao dịch" + "Sự kiện" (22 testcase).
4. [phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md](testcases/phan-tich-co-ban-thong-tin-chung-nn-tu-doanh.md)
   — Sub-tab "Nước ngoài" + "Tự doanh" (19 testcase).

## Phân tích cơ bản — TỔNG KẾT toàn màn hình (10 file, 234 testcase, HOÀN TẤT)

Toàn bộ màn "Phân tích cơ bản" (`/phan-tich-co-ban`, khung/shell + 6 tab chính, "Thông tin chung" chia 4 tài
liệu con) đã sinh xong: **234 testcase, chỉ 2 `test.fixme`** (TC_PTCB_SS_15 và TC_PTCB_BD_21, cùng lý do —
kéo-thả `vuedraggable`/Sortable.js, giới hạn Playwright đã ghi nhận từ TC_BANGGIA_37). Chạy gộp cả 10 file 1
lần (`npx playwright test tests/phan-tich-co-ban --project=chromium --workers=2`): **228 pass, 4 skip (đúng
thiết kế `test.skip`), 2 fail giả** (TC_PTCB_16, TC_PTCB_4M_16 — cả 2 dùng tài khoản Free, **PASS lại ngay khi
chạy riêng lẻ**).

**⚠️ Lưu ý khi chạy CI gộp NHIỀU FILE `phan-tich-co-ban*.spec.ts` cùng lúc (khác với lưu ý "trong 1 file" đã ghi
ở mục "Hồ sơ + Cổ đông"):** dù mỗi file RIÊNG LẺ đã gộp test Free vào `mode: 'serial'` để tránh tự đụng độ nội
bộ, các FILE KHÁC NHAU vẫn có thể cùng đăng nhập tài khoản Free ĐỒNG THỜI khi chạy song song (`workers` > 1
giữa các file) — gây `test.skip` giả hiếm gặp (đo được 2/234 lần chạy gộp). Nếu gặp fail ở 1 test Free khi chạy
CI gộp nhiều file, thử chạy lại riêng test/file đó trước khi kết luận bug thật — không cần sửa code (không có
cách nào loại bỏ hoàn toàn tranh chấp đăng nhập khi nhiều file thật sự chạy song song trên 1 tài khoản dùng
chung).

**Phát hiện bug thật nổi bật nhất xuyên suốt màn hình (ưu tiên báo dev):**
1. Deep-link qua path param `/phan-tich-co-ban/<mack>` bị ghi đè bởi `final_mack` từ `getusersettings`
   (TC_PTCB_08).
2. Deep-link thẳng `?tab=so-sanh` khiến bảng so sánh trống VĨNH VIỄN trong session do race condition
   (TC_PTCB_SS_02).
3. `ChartByBank.vue` gây đúng 2 `TypeError` console MỖI LẦN mount (100% tái hiện, không phụ thuộc mạng) —
   TC_PTCB_BD_xx (xem chi tiết trong `phan-tich-co-ban-bieu-do.md`).
4. Nhiều bug dữ liệu SAI/THIẾU/CŨ ÂM THẦM cho tài khoản Free do API bị `if (!isAccountFree)` bọc bất đối xứng
   giữa `created()`/`watch` — lặp lại ở CẢ 2 tài liệu con "Hồ sơ + Cổ đông" (donut sở hữu nước ngoài) VÀ "Thông
   tin giao dịch + Sự kiện" (bảng Sự kiện không refresh khi đổi mã CK).

---

## Toàn cảnh thị trường — Ngành ([tests/toan-canh-thi-truong-nganh.spec.ts](tests/toan-canh-thi-truong-nganh.spec.ts))

21 testcase, **1 fixme** — 19/20 test tự động hoá pass (1 testcase còn lại chỉ là ghi chú tham chiếu chéo,
không cần automation). Testcase doc:
[testcases/toan-canh-thi-truong-nganh.md](testcases/toan-canh-thi-truong-nganh.md). POM:
[pages/NganhPage.ts](pages/NganhPage.ts). Route `/nganh` (`type="department"` của component IBD dùng chung với
`/bo-loc`/`/suc-manh-dong-tien`) — 1 trong 3 màn con của menu header "Toàn cảnh thị trường".

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_NGANH_06 | Giới hạn tính năng với tài khoản Free (ProtectedView) | `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` trong `.env` đăng nhập thất bại lúc sinh testcase này | Xác nhận lại tài khoản Free còn hoạt động (đã từng sửa được ở Bảng Giá/Nhật Ký GD 2026-08-20, có thể chỉ cần thử lại) |

**Phát hiện đáng chú ý:**
1. Click badge "Trạng thái" ở tab "Tổng quan" gọi `gotoRRG()` nhưng KHÔNG có hiệu ứng gì trên `/nganh` (chỉ có
   tác dụng ở nhánh UI khác `type=='ibd'`) — badge vẫn có `cursor: pointer` khiến người dùng tưởng bấm được.
2. Ô "Điểm RS" luôn mang class `text-upchange` TĨNH cộng thêm class điều kiện — khi RS < 50 phần tử có ĐỒNG THỜI
   `text-upchange` và `text-downchange`, đo màu thật (`getComputedStyle`) vẫn hiển thị đúng (class sau thắng
   specificity) nên không phải bug hiển thị, chỉ là code lộn xộn.
3. Sort theo cột ngày ở bảng "Luân chuyển dòng tiền ngành" nhóm các dòng theo text trạng thái RRG (qua
   `localeCompare`), riêng 2 dòng tham chiếu ("VNINDEX"/"Thanh khoản VNINDEX", giá trị dạng số %) luôn bị ghim ở
   đầu vì comparator trả `undefined` khi so số với text — chưa rõ có phải chủ đích, đánh dấu ⚠️ cần xác nhận.

## Toàn cảnh thị trường — Bộ lọc cổ phiếu ([tests/toan-canh-thi-truong-bo-loc.spec.ts](tests/toan-canh-thi-truong-bo-loc.spec.ts))

48 testcase, **2 fixme** — 46/48 pass ổn định (`--workers=1`). Testcase doc:
[testcases/toan-canh-thi-truong-bo-loc.md](testcases/toan-canh-thi-truong-bo-loc.md). POM:
[pages/BoLocPage.ts](pages/BoLocPage.ts). Route `/bo-loc` (`type="stock"`) thực chất render
`src/views/filterCanslim/index.vue` (KHÔNG phải `stock/liveBoard/` như Bảng giá — dễ nhầm).

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_BOLOC_09 | "Khám phá hơn N kết quả bộ lọc khác" mở modal đầy đủ mẫu | Link nằm cuối thanh cuộn ngang mẫu KFSP, bị 1 lớp overlay/tooltip che khi chưa cuộn hết | Khảo sát thêm cách cuộn ổn định (`scrollIntoView` + chờ animation) trước khi click |
| TC_BOLOC_40 | Giới hạn chọn tối đa 100 mã | Cần bảng kết quả ≥ 101 dòng + xác nhận trước cơ chế "chọn tất cả" có xuyên trang (phân trang 20 dòng/trang) hay chỉ trang hiện tại | Xác nhận qua khảo sát DOM/hỏi dev cơ chế "chọn tất cả" |

**Phát hiện đáng chú ý (bug thật đo được qua automation, ưu tiên báo dev):**
1. **[BUG THẬT] Dán/autofill giá trị vào ô nhập tiêu chí số KHÔNG kích hoạt lọc lại** — `changeInputValue()`
   (`filterCanslim/index.vue` dòng 879) đọc `event.data` để lọc ký tự hợp lệ; khi giá trị được đặt NGUYÊN CỤM
   trong 1 sự kiện (dán/autofill/`.fill()` tự động hoá), `event.data` là chuỗi nhiều ký tự — không khớp danh
   sách ký tự đơn lẻ hợp lệ `'0123456789.,-'`, code hiểu nhầm là ký tự không hợp lệ và `return` sớm, bỏ qua
   `getDataTableDebounce()`. Ô nhập hiển thị đúng giá trị mới nhưng API lọc không được gọi lại — bảng kết quả
   lặng lẽ giữ dữ liệu cũ. Đo trực tiếp qua `page.on('requestfinished')` đọc payload POST thật: gõ nguyên cụm →
   giá trị cũ; gõ từng ký tự → giá trị đúng, kết quả đổi thật (563→272 mã). Xem chi tiết mục "Phát hiện đáng chú
   ý" #0 trong file `.md`.
2. Web KHÔNG validate min < max cho tiêu chí "Khoảng" (khác app).
3. `getDataTable().catch()` chỉ `console.error`, không toast lỗi — lỗi mạng và "0 kết quả thật" hiển thị giống
   hệt nhau với người dùng.
4. "Reset giá trị" chỉ xoá GIÁ TRỊ, không xoá TIÊU CHÍ (khác app — Đặt lại xoá toàn bộ tiêu chí).
5. Panel border phải chỉ có 6 tab (thiếu "Bài viết"/"Chatbot" so với 8 tab ở `/bang-gia`) dù dùng chung khung.

**⚠️ Lưu ý kỹ thuật khi sửa/thêm test cho màn này:** danh sách nhóm tiêu chí (`.card-wrapper`) có lúc khớp NHẦM
1 phần tử rộng hơn dự kiến khi dùng `filter({ has })` mặc định (chỉ yêu cầu hậu duệ ở bất kỳ độ sâu nào) — đã
sửa `criteriaGroupCard()` trong `BoLocPage.ts` dùng CSS `:has(> .collapse_header:has-text(...))` (bắt buộc quan
hệ CON TRỰC TIẾP theo đúng cấu trúc DOM thật) thay vì API `filter({has})`. Nếu thêm locator mới quét theo nhóm
tiêu chí, áp dụng cùng pattern này, đừng quay lại `filter({has})` mặc định.

## Toàn cảnh thị trường — Sức mạnh dòng tiền ([tests/toan-canh-thi-truong-suc-manh-dong-tien.spec.ts](tests/toan-canh-thi-truong-suc-manh-dong-tien.spec.ts))

32 testcase, **2 fixme** — 30/32 pass ổn định (`--workers=1`). Testcase doc:
[testcases/toan-canh-thi-truong-suc-manh-dong-tien.md](testcases/toan-canh-thi-truong-suc-manh-dong-tien.md).
POM: [pages/SucManhDongTienPage.ts](pages/SucManhDongTienPage.ts).

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_SMDT_11 | Giới hạn chọn tối đa 15 mã trong bảng | Cần dựng đủ 16 mã hợp lệ thật (nhiều request tra cứu dữ liệu real-time, tốn thời gian chạy đáng kể) | Không cần gì thêm, chỉ cần thời gian viết + chấp nhận test chạy chậm |
| TC_SMDT_17 | Thêm mã đã có sẵn trong watchlist (lỗi trùng) | Cần 1 mã CHẮC CHẮN đã có sẵn trong watchlist đang chọn tại thời điểm chạy — phụ thuộc dữ liệu watchlist thật của tài khoản test | Xác định trước 1 mã cố định luôn có trong watchlist test |

**Phát hiện đáng chú ý (bug thật + đính chính, đo được qua automation):**
1. **[BUG ROUTER — dead code, không ảnh hưởng UI]** `stocks/src/router/index.js` đăng ký path
   `suc-manh-dong-tien` 2 lần trong cùng mảng `children` (dòng ~523 `IBD type="rrg"`, dòng ~682 `RRGChart` import
   thẳng). Route dòng ~523 luôn thắng (Vue Router ưu tiên route đăng ký trước khi trùng path) — route dòng ~682
   là dead code. Cả 2 cuối cùng render cùng 1 file `RRG.vue` nên người dùng không bị ảnh hưởng, nhưng vẫn là cấu
   hình router thừa cần dọn.
2. **[ĐÍNH CHÍNH] Cả biểu đồ RRG lẫn RS đều bị khoá với tài khoản Free** — kết luận ban đầu ("RS không bị khoá")
   SAI, chỉ dựa vào ảnh chụp màn hình mà không kiểm tra DOM. RRG dùng CSS blur filter phủ lên chart thật; RS
   dùng 1 ảnh nền đã làm mờ sẵn từ server (`blur/smdt_rs.png`) — nhìn thoáng qua giống dữ liệu thật nên dễ nhầm.
   Luôn kiểm tra `.image-container` trong DOM thay vì chỉ đọc ảnh chụp khi verify paywall.
3. 2 ngưỡng giới hạn số mã khác nhau trong cùng 1 bảng: tự động tick khi thêm mã mới giới hạn 10 mã, tick tay
   qua checkbox giới hạn 15 mã — không phải lỗi hiển thị, là 2 hằng số khác nhau thật trong code.
4. Tab "Ngành" (trong 3 tab bảng trái) dùng bảng HTML thường thay vì `VirtualList`, tên ngành KHÔNG phải link mở
   modal Trading Chart (khác 2 tab còn lại).

**⚠️ Không phải fixme nhưng cần lưu ý khi chạy CI — cùng pattern flakiness đã ghi nhận ở Bảng Giá/Nhật Ký GD:**
chạy gộp cả 3 file `toan-canh-thi-truong-*.spec.ts` (101 test, `--workers=1`) cho **94 pass, 1 fail** —
TC_SMDT_24 (tooltip hover trên biểu đồ RRG) fail 1 phần ("Sức mạnh:" không kịp hiện) dù đã pass ổn định ở các
lần chạy riêng lẻ trước đó. Nghi do timing tooltip ECharts nhạy cảm hơn khi máy đang tải nhiều test liên tục.
Nếu gặp lại khi chạy CI gộp, thử chạy lại riêng `-g "TC_SMDT_24"` trước khi kết luận là bug thật.

---

## Phân tích kỹ thuật (3 file: [tests/phan-tich-ky-thuat.spec.ts](tests/phan-tich-ky-thuat.spec.ts) ·
[tests/phan-tich-ky-thuat-bieu-do.spec.ts](tests/phan-tich-ky-thuat-bieu-do.spec.ts) ·
[tests/phan-tich-ky-thuat-thong-tin.spec.ts](tests/phan-tich-ky-thuat-thong-tin.spec.ts))

56 testcase, **2 fixme** — 54/56 pass ổn định (`--workers=1`; xem cảnh báo bên dưới về chạy song song). Testcase
doc: [testcases/phan-tich-ky-thuat.md](testcases/phan-tich-ky-thuat.md) (khung/shell) ·
[testcases/phan-tich-ky-thuat-bieu-do.md](testcases/phan-tich-ky-thuat-bieu-do.md) (khu vực biểu đồ) ·
[testcases/phan-tich-ky-thuat-thong-tin.md](testcases/phan-tich-ky-thuat-thong-tin.md) (panel "Thông tin"). POM
dùng chung: [pages/TechnicalChartPage.ts](pages/TechnicalChartPage.ts).

| TC ID | Tên | Lý do chưa tự động | Cần gì để làm tiếp |
|---|---|---|---|
| TC_PTKT_11 | Liên kết đồng bộ mã giữa các tab (chấm tròn màu) | Chưa tìm được cách giả lập ổn định sự kiện `mouseenter` để mở popper chọn màu liên kết (`mouseEnterFunction` trong `reactMultiLayoutChart.js` dùng listener DOM thuần gắn thủ công vào phần tử popper tạo động, không phải Vue/React state chuẩn) | Thử nghiệm thêm `dispatchEvent('mouseenter')` với timing khác, hoặc xác nhận cách kích hoạt ổn định |
| TC_PTKT_BD_17 | Cập nhật giá real-time trong giờ giao dịch | Phụ thuộc giờ giao dịch thật + socket cập nhật liên tục, không chủ động kích hoạt được bằng automation trong thời gian ngắn — cùng pattern đã ghi nhận ở Bảng Giá/Watchlist | Không cần gì thêm, chỉ cần chạy đúng giờ giao dịch + chấp nhận test chạy chậm |

**⚠️ AN TOÀN DỮ LIỆU — ĐỌC TRƯỚC KHI CHẠY/SỬA TEST CỦA 3 FILE NÀY:** layout đa biểu đồ (tab nào đang mở, mã/
interval từng tab) là setting lưu **server-side DÙNG CHUNG cho tài khoản test** (`TEST_USER_EMAIL`), không phải
state riêng theo browser context — xem ghi chú đầy đủ ở đầu [pages/TechnicalChartPage.ts](pages/TechnicalChartPage.ts).
Baseline hiện tại của tài khoản: **đúng 5 tab** (`NVL 1D`, `NVL 1D`, `ACB 1D`, `RAL 1D`, `ACB 1D`) — mọi test
thêm/xóa tab phải trả lại đúng số này. Tài khoản Free (`FREE_USER_EMAIL`) baseline: **đúng 1 tab** (`BSR 1D`),
giới hạn tối đa 1 tab/khung nên **KHÔNG** được gọi `addChartTab()` trên tài khoản này (xem TC_PTKT_TT_18/20 bên
dưới) — phải đổi mã tạm trên tab gốc rồi đổi lại đúng mã cũ.

**⚠️ Bắt buộc `--workers=1` khi chạy chung nhiều describe block/nhiều file `phan-tich-ky-thuat*.spec.ts` cùng
lúc** — đây là yêu cầu CHÍNH XÁC (không chỉ giảm flaky như các màn khác), đã đo được qua automation thật: nhiều
test cùng `addChartTab()`/`deleteLastChartTab()` chạy song song (mặc định `fullyParallel: true`, 3 worker) trên
CÙNG 1 layout lưu server-side có thể ghi đè mất tab của nhau (lần "save" debounce cuối cùng thắng) — đã tận mắt
đo được tài khoản dư tới 10 tab sau vài lần chạy song song trước khi xác định + sửa nguyên nhân. CỐ Ý KHÔNG dùng
`test.describe.configure({ mode: 'serial' })` ở cấp FILE để enforce việc này trong code — Playwright tự động
SKIP toàn bộ test còn lại trong nhóm ngay khi 1 test fail (fail-fast của mode 'serial'), che mất kết quả thật
của các test độc lập phía sau; dùng `--workers=1` khi chạy đạt cùng mục tiêu mà không có tác dụng phụ đó.

**⚠️ Rủi ro rò rỉ tab khi 1 test fail giữa chừng:** KHÔNG file nào trong 3 file này dùng `try/finally` để đảm bảo
dọn dẹp — nếu 1 test fail SAU khi `addChartTab()` nhưng TRƯỚC khi `deleteLastChartTab()`, tab thêm sẽ bị rò rỉ
lại vĩnh viễn trên tài khoản dùng chung. Đã gặp thật nhiều lần trong lúc sửa lỗi (mỗi lần 1 test fail giữa chừng
để lại đúng 1 tab rác, cộng dồn qua nhiều lần chạy). Sau MỌI lần 1 test trong 3 file này fail, PHẢI kiểm tra lại
`chartTabCount()` và dọn về đúng baseline (5 tab tài khoản chính, 1 tab tài khoản Free) trước khi chạy lại — viết
1 script tạm nhỏ (login qua `LoginPage` + `TechnicalChartPage`, vòng lặp `while (count > baseline)
deleteLastChartTab(true)`, rồi `waitForLayoutSaved()`) nếu cần, tương tự cách đã làm trong lượt sửa lỗi này. Cải
tiến khuyến nghị cho lượt sau (chưa làm trong lượt này, ngoài phạm vi): bọc `try/finally` quanh phần thêm/xóa tab
ở mọi test để tự phục hồi ngay cả khi assertion giữa bài fail.

**⚠️ Không phải fixme nhưng cần lưu ý khi chạy CI — cùng pattern flakiness do resource contention đã ghi nhận ở
Bảng Giá/Nhật Ký GD/Phân tích cơ bản:** chạy gộp cả 3 file liên tục (~13-14 phút, `--workers=1`) cho **51 pass, 3
fail** — `TC_PTKT_BD_09` (nút "Tải lại Biểu đồ" không kịp hiện), `TC_PTKT_BD_11` (chart nạp quá 45s), `TC_PTKT_13`
(lỗi JS thoáng qua "Cannot set properties of undefined (setting 'totalval')" khi chuyển tab menu dọc phải) — cả
3 **PASS lại ổn định ngay khi chạy riêng lẻ** (đã xác nhận lại bằng automation thật). Nếu gặp lại khi chạy CI gộp
cả 3 file, thử chạy lại riêng file/case đó trước khi kết luận là bug thật.

**Phát hiện đáng chú ý (bug thật/khác biệt hành vi đo được qua automation, không phải lỗi test tự viết sai):**
1. **[Kỹ thuật thao tác quan trọng] Dialog "Các chỉ báo" KHÔNG tự highlight sẵn 1 kết quả để phím Enter chọn** —
   gõ "RSI" rồi bấm Enter KHÔNG thêm được chỉ báo nào (không lỗi, chỉ im lặng không làm gì); phải click trực tiếp
   vào dòng kết quả (`[data-role="list-item"]`). Kết quả ĐẦU TIÊN khi gõ "RSI" hiển thị tên tiếng Việt "Chỉ số
   Sức mạnh tương đối" (không chứa chữ "RSI") nhưng sau khi thêm, legend lại hiển thị đúng tên viết tắt "RSI" — 2
   chuỗi khác nhau, không dùng chung để vừa chọn kết quả vừa verify legend (TC_PTKT_BD_05/06/15).
2. **Tên tab đổi theo mã interval NỘI BỘ của TradingView, không theo nhãn hiển thị trên nút** — khung "1 giờ" có
   nhãn nút "1h" nhưng tab đổi thành "ACB 60" (không phải "ACB 1h") — đính chính so với kỳ vọng ban đầu trong
   testcases/phan-tich-ky-thuat-bieu-do.md (TC_PTKT_BD_03).
3. **[Đính chính, lỗi ở test ban đầu] "Số lượng cổ phiếu tăng/giảm/không đổi" (mã chỉ số) render bằng ECharts
   `CanvasRenderer`, không phải DOM text** — nhãn "Tăng"/"Giảm"/"Không đổi" vẽ pixel trong `<canvas>`, không có
   DOM text tương ứng để assert (cùng giới hạn kỹ thuật đã ghi nhận ở nhiều biểu đồ ECharts khác trong dự án —
   radar 4M&CANSLIM, donut sở hữu nước ngoài...). Đã sửa lại chỉ verify canvas tồn tại/hiển thị đúng vị trí
   (TC_PTKT_TT_15).
4. **`.first()` đơn thuần trên các nút toolbar TradingView "lặp lại 2-3 lần" (responsive `withText`/
   `withoutText`) KHÔNG đáng tin cậy** — bản không hiển thị dùng CSS `visibility: hidden` (KHÔNG phải
   `display:none`), nên `offsetParent !== null` vẫn đúng dù không thấy được; viewport mặc định của Playwright
   project `chromium` (`devices['Desktop Chrome']`, 1280×720) hẹp hơn viewport 1400×900 dùng lúc debug thủ công
   ban đầu, khiến biến thể `.first()` (luôn đứng đầu DOM) bị `visibility:hidden` VĨNH VIỄN ở viewport thật của
   test — không phải vấn đề thời gian chờ, tăng timeout không giải quyết được. Đã sửa toàn bộ locator liên quan
   (`headerIndicatorsBtn`, `headerSymbolSearchBtn`, `intervalButton()`...) dùng pseudo-class `:visible` của
   Playwright để luôn chọn đúng bản đang hiển thị thật.
5. **Tab đầu dãy có thể bị `flexlayout-react` clip ra ngoài vùng nhìn thấy ngay sau khi tab cuối (vừa thêm) trở
   thành active** — thư viện dùng `overflow-x: clip` (không phải scroll container chuẩn) trên
   `.flexlayout__tabset_tabbar_inner`, không phản hồi `scrollIntoViewIfNeeded()`/`scrollLeft`; thư viện lắng nghe
   `mousedown`/`mouseup` để đổi tab active (không phải `click`). Đã thêm `TechnicalChartPage.clickChartTab()`
   (dispatchEvent mousedown+mouseup) dùng ở mọi nơi cần click tab có thể bị clip (TC_PTKT_05, TC_PTKT_TT_21).
6. **Nút "Loại bỏ" chỉ báo trong legend xử lý xóa NGAY khi nhận `mousedown`, không đợi `mouseup`/`click`** —
   `<canvas>` (mặt vẽ biểu đồ) đè lên đúng điểm hover/click, chặn pointer event của `.hover()`/`.click()` chuẩn;
   `dispatchEvent('click')` hoàn toàn không có tác dụng. Phải hover bằng `dispatchEvent('mouseover')`, sau đó bắn
   ĐÚNG 1 sự kiện `dispatchEvent('mousedown')` (không kèm `mouseup`, vì phần tử đã bị xóa khỏi DOM ngay sau đó)
   SCOPED bên trong chính mục legend đang thao tác — không dùng `.first()` toàn trang (TC_PTKT_BD_06).

## Cách xem nhanh trong báo cáo Playwright

Chạy `npm test` rồi `npx playwright show-report` — mọi test `fixme` hiện màu vàng/"skipped" kèm đúng tên
`TC_..._xx` ở trên, đối chiếu ngược lại bảng này để biết lý do cụ thể.
