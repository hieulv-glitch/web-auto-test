# Màn hình: Watchlist (Danh mục theo dõi)

- **URL:** `/watchlist` (yêu cầu đăng nhập — `meta.requiresUser`, chưa đăng nhập sẽ bị redirect sang `/login`)
- **Component chính:** [WatchListPage.vue](../../stocks/src/views/watchlist/WatchListPage.vue) (layout 2 cột resize) → [WatchListHeader.vue](../../stocks/src/views/watchlist/components/WatchListHeader.vue) (dropdown chọn watchlist + input thêm mã) + [WatchListLeft.vue](../../stocks/src/views/watchlist/components/WatchListLeft.vue) (bảng dữ liệu ~80 cột, 9 tab hiển thị) + [WatchListRight.vue](../../stocks/src/views/watchlist/components/WatchListRight.vue) (panel Ghi chú/Bài viết) → [ManagerWatchListModal.vue](../../stocks/src/views/watchlist/components/ManagerWatchListModal.vue) → [CreateUpdateWatchListModal.vue](../../stocks/src/views/watchlist/components/CreateUpdateWatchListModal.vue)
- **Domain test:** https://kfsp.vn
- **Nguồn testcase gốc (app):** Google Sheet, tab "Watchlist" (80 dòng) — mô tả 1 màn hình mobile đơn giản hơn nhiều (bottom nav, empty state, add/remove mã, hiển thị theo item).
- **Phương pháp sinh:** Đọc source code + kiểm kê độc lập trên web thật (theo skill `gen-web-testcase`). Màn web có độ phức tạp lớn hơn hẳn app: 9 tab hiển thị cột dữ liệu khác nhau, quản lý NHIỀU watchlist (tạo/sửa/xóa/kéo-thả sắp xếp), panel Ghi chú + Bài viết công bố thông tin theo mã, layout resize kéo-thả. Sheet chỉ dùng tham khảo văn phong, không giới hạn phạm vi.

## ⚠️ Phát hiện quan trọng — đọc trước khi dùng tài liệu này

1. Dữ liệu bảng **cập nhật real-time qua socket** (~30s/lần) — test không được assert giá trị số liệu cụ thể (giá, RS, %...), chỉ assert cấu trúc/định dạng hiển thị.
2. Tài khoản test hiện tại có **nhiều watchlist có sẵn** (Kungfu Watchlist, testy, Ngân Hàng v70, done, v70tt, v70Release, hihi, done v70, "wl rỗng", v71, v71 done rl, webWL, testAddWL, v72, hihi Haha, mfrv72, mfrv72iphone, testdone...) — danh sách tên "wl rỗng" **thực tế có 6 mã, không hề rỗng** (tên gây hiểu nhầm) — không dùng danh sách có sẵn nào để giả định trạng thái rỗng, phải mock API nếu cần test trạng thái này.
3. Tài khoản test hiện tại có quyền **moderator** (thấy checkbox "Nhận tất cả thông báo (Dành cho Moderator)" trong modal Quản lý Watchlist) — 1 số control chỉ hiện với quyền này.
4. `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` trong `.env` hiện **không đăng nhập được** (xem `TRACKER.md` — lỗi API `400 "Tài khoản không tồn tại"`) — mọi testcase cần tài khoản Free đều `test.fixme` chờ tài khoản đúng, dùng cùng cơ chế tự-skip đã áp dụng ở màn Cộng Đồng (TC_CONGDONG_55).

## Quy ước trạng thái

✅ Áp dụng · 🆕 Testcase mới (web-only, app không có) · ⚠️ Cần xác nhận thêm

---

## Nhóm A: Truy cập màn hình & layout tổng quan

# [TC_WATCHLIST_01] Chặn truy cập khi chưa đăng nhập

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** ngụ ý từ toàn bộ sheet (app yêu cầu đăng nhập trước khi vào bất kỳ tab nào)

## Các bước thực hiện
1. Chưa đăng nhập, truy cập trực tiếp `/watchlist`.

## Kết quả mong đợi
- [ ] Bị redirect sang `/login` (route guard `requiresUser`).

---

# [TC_WATCHLIST_02] Overview màn hình khi đã đăng nhập

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC tổng quan đầu sheet

## Các bước thực hiện
1. Đăng nhập, vào `/watchlist`.

## Kết quả mong đợi
- [ ] Hiển thị layout 2 cột: trái là dropdown chọn watchlist + ô "Chọn mã CK" + 9 tab hiển thị + bảng dữ liệu; phải là panel Ghi chú/Bài viết.
- [ ] Tên watchlist hiện tại hiển thị ở góc trên trái (mặc định "Kungfu Watchlist" hoặc watchlist được chọn lần trước).

---

# [TC_WATCHLIST_03] Thanh resize giữa 2 cột (desktop)

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Chỉ hiện ở desktop (`isDesktop = window.innerWidth >= 768`), kéo vượt giới hạn `minLeft`(50%)/`minRight`(28%) thì không đổi (early return trong code).

## Kết quả mong đợi
- [ ] Kéo thanh `.resize` đổi tỷ lệ 2 cột trong giới hạn cho phép, kéo vượt giới hạn thì dừng lại đúng ngưỡng.

---

# [TC_WATCHLIST_04] Tỷ lệ layout KHÔNG lưu lại sau khi rời trang

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `initResize()` luôn reset về 70/30 khi mount lại — không có localStorage/persist nào cho tỷ lệ resize.

## Các bước thực hiện
1. Kéo resize đổi tỷ lệ, điều hướng sang trang khác rồi quay lại `/watchlist`.

## Kết quả mong đợi
- [ ] Tỷ lệ trở về mặc định 70/30, không giữ tỷ lệ đã kéo trước đó.

---

# [TC_WATCHLIST_05] Nút "Đặt lại bố cục mặc định"

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Icon tròn góc dưới phải panel, có `title="Đặt lại bố cục mặc định"` (không có accessible name khác, dùng `getByTitle`).

## Các bước thực hiện
1. Kéo resize lệch tỷ lệ mặc định, click nút reset.

## Kết quả mong đợi
- [ ] Tỷ lệ 2 cột trở về mặc định.

---

# [TC_WATCHLIST_06] Responsive mobile (< 768px)

- **Trạng thái:** ✅ Áp dụng (thay thế test xoay ngang/notch của app)
- **Tham chiếu App:** TC responsive trong sheet

## Kết quả mong đợi
- [ ] 2 cột xếp dọc (`flex-direction: column`), thanh resize ẩn hoàn toàn, cột trái tối đa 40vh, cột phải tối đa 60vh.

---

# [TC_WATCHLIST_07] Nút Back trình duyệt không tạo lịch sử điều hướng nội bộ

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Mọi thao tác (đổi tab bảng, mở modal) đều là state nội bộ, không đổi URL/hash — Back sẽ điều hướng khỏi `/watchlist` hoàn toàn thay vì đóng modal/quay lại tab trước.

## Các bước thực hiện
1. Mở modal Quản lý Watchlist (hoặc đổi 1 tab bảng), bấm Back trình duyệt.

## Kết quả mong đợi
- [ ] Điều hướng khỏi `/watchlist` (không phải đóng modal tại chỗ) — ghi nhận là điểm UX cần lưu ý, không phải bug chặn dùng.

---

## Nhóm B: Chọn & chuyển đổi Watchlist

# [TC_WATCHLIST_08] Mở dropdown chọn watchlist

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**
- **Ghi chú:** Toggler không có role chuẩn (chỉ là `text` + `img`), dùng `getByText(tên hiện tại)` scoped trong `.dropdown-watchlist-menu`, không dùng `getByRole`.

## Kết quả mong đợi
- [ ] Click vào tên watchlist hiện tại → mở menu: 3 category tab "Watchlist / Nhật ký GD / Khác" + danh sách watchlist thuộc category đang chọn.

---

# [TC_WATCHLIST_09] Category "Nhật ký GD" / "Khác" ẩn với tài khoản Free

- **Trạng thái:** ⚠️ Cần xác nhận thêm — chờ tài khoản Free hợp lệ (xem TRACKER.md)

## Kết quả mong đợi
- [ ] Tài khoản Free chỉ thấy category "Watchlist", không thấy "Nhật ký GD"/"Khác".

---

# [TC_WATCHLIST_10] Chuyển sang 1 watchlist khác trong danh sách

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** ngụ ý từ luồng chọn watchlist trong sheet

## Kết quả mong đợi
- [ ] Click 1 watchlist khác trong dropdown → tên góc trên trái đổi theo, bảng tải lại dữ liệu đúng danh sách mã của watchlist đó, dropdown đóng lại.

---

# [TC_WATCHLIST_11] Link "Quản lý watchlist" trong dropdown

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Chỉ hiện khi đang chọn category "Watchlist" (không hiện ở "Nhật ký GD"/"Khác"), ẩn với tài khoản Free.

## Kết quả mong đợi
- [ ] Click mở modal "Quản lý Watchlist".

---

## Nhóm C: Bảng dữ liệu chính — 9 tab hiển thị

# [TC_WATCHLIST_12] Hiển thị đủ 9 tab bảng

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**
- **Ghi chú:** Locator phải scope `.menu-nav-tab` — nhiều tên tab ("Thông tin chung", "Định giá", "Bài viết"...) trùng với menu điều hướng ẩn khác trên trang, `getByText` không scope sẽ bắt nhầm.

## Kết quả mong đợi
- [ ] Hiển thị đủ 9 tab: Tổng quát, Thông tin chung, Định giá, Cơ bản, Biến động giá, Phạm vi giá, Thanh khoản, Chỉ báo kỹ thuật, KFSP. Tab "Tổng quát" active mặc định.

---

# [TC_WATCHLIST_13] Chuyển tab đổi bộ cột hiển thị, không reload trang

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**

## Các bước thực hiện
1. Click lần lượt qua vài tab khác (VD "Định giá", "Phạm vi giá").

## Kết quả mong đợi
- [ ] Tab active đổi, bộ cột trong bảng đổi theo đúng nhóm dữ liệu (không điều hướng URL, không mất danh sách mã đang xem).

---

# [TC_WATCHLIST_14] Sắp xếp theo 1 cột (sorter)

- **Trạng thái:** ✅ Áp dụng
- **Ghi chú:** Sort client-side (`CDataTable sorter`), hầu hết cột đều bật sort.

## Kết quả mong đợi
- [ ] Click header 1 cột có sort → thứ tự dòng đổi theo giá trị cột đó (tăng/giảm khi click lần 2).

---

# [TC_WATCHLIST_15] Click mã CK mở modal biểu đồ

- **Trạng thái:** ✅ Áp dụng
- **Ghi chú:** Dùng chung modal biểu đồ toàn app (`store.state.isShowModalTradingChart`), không riêng của màn này.

## Kết quả mong đợi
- [ ] Click tên mã (VD "ACB") → mở modal biểu đồ giao dịch của đúng mã đó.

---

# [TC_WATCHLIST_16] Cột "Website" — link ngoài

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `checkURL()` tự thêm `http://` nếu thiếu `://`; trả `""` nếu giá trị gốc là `"0"`/null → **trường hợp biên: link `href=""` với `target="_blank"` khi mã không có website**, cần verify không crash/không mở tab trắng gây khó chịu.

## Kết quả mong đợi
- [ ] Có website → mở tab mới đúng domain công ty. Không có website → không crash, không mở tab trắng vô nghĩa.

---

# [TC_WATCHLIST_17] Bảng vẫn hiển thị dữ liệu cơ bản khi 1 API enrichment lỗi

- **Trạng thái:** ✅ Áp dụng (mock 500) — **Đã verify bằng automation**
- **Ghi chú:** Nhiều cột (Canslim, 4M, RSS/RSM/RSL...) đến từ các API riêng (`/api/filter`, `/api/stocks/canslim-fourm/...`), mỗi API có `.catch()` riêng — mock 1 API trong số đó trả lỗi để verify bảng không trắng/crash.

## Kết quả mong đợi
- [ ] Bảng vẫn render các mã + cột cơ bản dù 1 API enrichment lỗi, không crash JS.

---

# [TC_WATCHLIST_18] Lỗi khi tải danh sách mã trong watchlist — **PHÁT HIỆN lỗi chính tả**

- **Trạng thái:** ✅ Áp dụng (mock lỗi) — **Đã verify bằng automation**
- **Ghi chú:** `WatchListHeader.vue` — toast lỗi thực tế là **"Có lỗi xảy ra. Vui loing thử lại sau!"** — lỗi chính tả thật ("Vui loing" thay vì "Vui lòng"), nên báo lại team dev.

## Kết quả mong đợi
- [ ] Mock `GET /api/stocks/ta_watchlist/get-list-category` trả lỗi → hiện đúng toast trên (kể cả lỗi chính tả).

---

# [TC_WATCHLIST_19] Watchlist rỗng (0 mã) không crash

- **Trạng thái:** ⚠️ Cần xác nhận thêm → **ưu tiên tự động hoá bằng mock**
- **Ghi chú:** Nghi vấn từ đọc code: `watch: itemsDataTable` gọi `document.querySelector('nav[aria-label="pagination"]').classList...` **không kiểm tra null** — nếu bảng thực sự 0 dòng, phần tử pagination có thể không tồn tại → crash JS. Không có watchlist rỗng thật để test trực tiếp (danh sách "wl rỗng" thực tế có 6 mã) — mock `GET /api/watchlist/mack-by-my-watchlist/:id` trả `[]` để verify.

## Kết quả mong đợi
- [ ] Mock API trả về mảng rỗng → không crash JS (verify qua `pageErrors`), hiển thị trạng thái rỗng hợp lý (hoặc bảng trống, không lỗi).

---

# [TC_WATCHLIST_20] Loading state khi tải dữ liệu bảng

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Code có flag `isLoadingData` set/clear quanh `getAllItem()` nhưng không tìm thấy phần tử spinner/skeleton rõ ràng trong template — nghi ngờ **thiếu loading UI**, cần verify thực tế qua mock API chậm (delay response) xem có gì hiển thị hay không trong lúc chờ.

---

## Nhóm D: Xóa mã khỏi Watchlist

# [TC_WATCHLIST_21] Click icon Xóa mở modal xác nhận (không xóa ngay)

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật (đã hủy, không xóa thật)**
- **Ghi chú:** Icon xóa không có accessible role/text (tooltip CSS `data-title`), dùng `[data-title="Xóa"]` scope trong `.datatable-watchlist`.

## Kết quả mong đợi
- [ ] Click icon thùng rác trên 1 dòng → mở modal "Xóa dữ liệu", nội dung **"Bạn có chắc chắn không?"**, 2 nút "Đóng"/"Xóa" — verify KHÔNG xóa mã khỏi bảng khi chưa xác nhận.

---

# [TC_WATCHLIST_22] Đóng modal xác nhận xóa (Đóng/hủy)

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**

## Kết quả mong đợi
- [ ] Click "Đóng" → modal đóng, mã vẫn còn nguyên trong bảng.

---

# [TC_WATCHLIST_23] Xác nhận xóa mã khỏi watchlist (dữ liệu thật, tự khôi phục)

- **Trạng thái:** ✅ Áp dụng (mock API) — **verify qua mock, không xóa dữ liệu thật của các watchlist có sẵn**
- **Ghi chú:** Để tránh làm mất mã thật trong các watchlist đang dùng, test xác nhận xóa được verify bằng mock `DELETE /api/watchlist/:id` trả thành công, không thao tác trên watchlist thật — luồng thêm/xóa dữ liệu thật (TC_WATCHLIST_29) được làm riêng trên 1 watchlist tạo mới, có `finally` tự dọn dẹp.

## Kết quả mong đợi
- [ ] Click "Xóa" trong modal xác nhận (mock API thành công) → gọi đúng `DELETE /api/watchlist/:id`, toast thành công, dòng biến mất khỏi bảng.

---

# [TC_WATCHLIST_24] Xóa mã lỗi API

- **Trạng thái:** ✅ Áp dụng (mock lỗi)

## Kết quả mong đợi
- [ ] Mock API xóa trả lỗi → toast lỗi chung, dòng vẫn còn trong bảng.

---

## Nhóm E: Thêm mã CK vào Watchlist

# [TC_WATCHLIST_25] Ô "Chọn mã CK" — validate mã không hợp lệ

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Validate against `store.state.data_eod`, nhưng ô nhập dùng `SingleSelectBase` — phím Enter chỉ
  chọn item đang có trong danh sách gợi ý đã lọc (`filteredOptions[activeIndex]`), không set được giá trị tự do
  không khớp gợi ý nào. Nhánh lỗi "Mã CK không hợp lệ!" chỉ xảy ra khi 1 mã có trong `list_mack_all` (nguồn gợi
  ý) nhưng lại không có trong `data_eod` (nguồn validate) — 2 danh sách khác nhau ở store, khó tái tạo lệch
  nhau ổn định chỉ bằng thao tác UI thật.

## Kết quả mong đợi
- [ ] Nhập mã không tồn tại/không hợp lệ → toast **"Mã CK không hợp lệ!"**, không gọi API thêm.

---

# [TC_WATCHLIST_26] Thêm mã hợp lệ vào watchlist (mock)

- **Trạng thái:** ✅ Áp dụng (mock API) — **Đã verify bằng automation**

## Kết quả mong đợi
- [ ] Nhập 1 mã hợp lệ, xác nhận thêm (mock API thành công) → gọi đúng `POST /api/watchlist`, toast **"Thêm vào watchlist thành công"**.

---

# [TC_WATCHLIST_27] Thêm mã đã tồn tại sẵn trong watchlist

- **Trạng thái:** ✅ Áp dụng (mock lỗi cụ thể) — **Đã verify qua code**
- **Ghi chú:** Backend trả `error_code === 'watch_list_mack_exist'`.

## Kết quả mong đợi
- [ ] Mock API trả lỗi `watch_list_mack_exist` → toast **"Mã CK đã tồn tại trong watchlist"** (khác toast lỗi chung).

---

# [TC_WATCHLIST_28] Thêm mã lỗi API chung

- **Trạng thái:** ✅ Áp dụng (mock lỗi)

## Kết quả mong đợi
- [ ] Mock lỗi không rõ mã lỗi cụ thể → toast lỗi chung.

---

# [TC_WATCHLIST_29] Vòng đời thêm/xóa mã thật trên 1 watchlist test riêng (tự dọn dẹp)

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation trên dữ liệu thật, tự khôi phục**
- **Ghi chú:** Tạo 1 watchlist mới đặt tên `[TEST-AUTOMATION] <timestamp>` (giống pattern đã dùng ở màn Cộng Đồng cho bài viết thật) → thêm 1 mã thật vào đó → verify xuất hiện trong bảng → xóa watchlist test này (kèm mã vừa thêm) trong `finally`, có API-delete dự phòng nếu UI lỗi giữa chừng — không để lại watchlist rác trên tài khoản thật.

## Kết quả mong đợi
- [ ] Toàn bộ luồng thêm/xóa hoạt động đúng trên dữ liệu thật, không để lại rác sau khi test xong (đã verify qua kiểm tra lại danh sách watchlist cuối test).

---

## Nhóm F: Quản lý nhiều Watchlist (modal "Quản lý Watchlist")

# [TC_WATCHLIST_30] Hiển thị modal Quản lý Watchlist

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**

## Kết quả mong đợi
- [ ] Hiển thị tiêu đề "Quản lý Watchlist", nút "Thêm watchlist", nút đóng (×), danh sách đầy đủ watchlist hiện có, mỗi dòng có icon kéo-thả (☰), icon Sửa, icon Xóa.

---

# [TC_WATCHLIST_31] Checkbox "Nhận tất cả thông báo (Dành cho Moderator)"

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Chỉ hiện với tài khoản có quyền moderator — tài khoản test hiện tại có quyền này (đã xác nhận qua DOM thật). Cần xác nhận hành vi ẩn/hiện đúng với tài khoản không có quyền.

## Kết quả mong đợi
- [ ] Toggle → gọi `POST /api/update-receive-notify`, toast đổi theo trạng thái bật/tắt.

---

# [TC_WATCHLIST_32] Kéo-thả sắp xếp lại thứ tự watchlist

- **Trạng thái:** ✅ Áp dụng (mock API) — **Đã verify qua code**
- **Ghi chú:** Gọi `POST /api/sort-my-watchlist`, debounce 300ms — kéo-thả nhiều lần liên tiếp trong 300ms chỉ nên gọi API 1 lần.

## Kết quả mong đợi
- [ ] Kéo-thả đổi thứ tự 2 mục → gọi đúng API sort (mock), thứ tự hiển thị đổi theo.
- [ ] Kéo-thả nhiều lần nhanh trong 300ms → chỉ gọi API 1 lần (đo qua đếm request).

---

# [TC_WATCHLIST_33] Sửa tên 1 watchlist từ modal quản lý

- **Trạng thái:** ✅ Áp dụng (mock API)

## Kết quả mong đợi
- [ ] Click icon Sửa 1 dòng → mở modal "Cập nhật Watchlist" với tên hiện tại điền sẵn, sửa tên → Lưu (mock thành công) → toast thành công, tên trong danh sách đổi theo.

---

# [TC_WATCHLIST_34] Xóa 1 watchlist từ modal quản lý (mock)

- **Trạng thái:** ✅ Áp dụng (mock API)

## Kết quả mong đợi
- [ ] Click icon Xóa 1 dòng (mock `DELETE /api/my-watchlist/:id` thành công) → toast **"Đã xóa Watchlist thành công"**, mục biến mất khỏi danh sách.

---

# [TC_WATCHLIST_35] Lỗi khi sửa/xóa watchlist

- **Trạng thái:** ✅ Áp dụng (mock lỗi)

## Kết quả mong đợi
- [ ] Mock lỗi cho sửa hoặc xóa → toast lỗi chung, dữ liệu không đổi.

---

## Nhóm G: Modal Tạo/Sửa Watchlist

# [TC_WATCHLIST_36] Mở modal "Thêm mới Watchlist"

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**
- **Ghi chú:** Ô nhập tên **không có label chuẩn** (`<p>` cạnh `<CInput>`, không phải `<label for>`) — `getByLabel` sẽ không hoạt động, phải scope theo dialog + role textbox.

## Kết quả mong đợi
- [ ] Click "Thêm watchlist" trong modal quản lý → mở modal tiêu đề **"Thêm mới Watchlist"**, có ô nhập tên, checkbox "Nhận tín hiệu Mua/Bán" (mặc định tắt), nút "Hủy"/"Lưu".

---

# [TC_WATCHLIST_37] Submit tên rỗng

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua code**

## Kết quả mong đợi
- [ ] Để trống tên, bấm "Lưu" → toast **"Tên Watchlist không được để trống"**, không gọi API, modal không đóng.

---

# [TC_WATCHLIST_38] Tạo watchlist mới hợp lệ (mock)

- **Trạng thái:** ✅ Áp dụng (mock API) — **Đã verify qua code**
- **Ghi chú:** Lỗi khi tạo → modal **KHÔNG tự đóng** (khác 1 số flow khác) — verify đúng hành vi này.

## Kết quả mong đợi
- [ ] Nhập tên hợp lệ, Lưu (mock thành công) → toast thành công, đóng modal, danh sách reload có mục mới.
- [ ] Mock lỗi khi tạo → toast lỗi chung, modal vẫn mở nguyên trạng.

---

# [TC_WATCHLIST_39] Nút "Hủy" đóng modal không lưu

- **Trạng thái:** ✅ Áp dụng

## Kết quả mong đợi
- [ ] Nhập dở tên, bấm "Hủy" → modal đóng, không gọi API, không tạo watchlist mới.

---

# [TC_WATCHLIST_40] Mở modal ở chế độ Sửa — tiêu đề đổi

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Khi mở từ icon Sửa (có `form.id`), tiêu đề modal là **"Cập nhật Watchlist"** (khác "Thêm mới Watchlist").

---

## Nhóm H: Panel phải — Ghi chú & Bài viết

# [TC_WATCHLIST_41] Click icon "Xem ghi chú" mở panel Ghi chú lọc theo mã

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**
- **Ghi chú:** Panel phải tự mở rộng (nếu đang thu gọn) và chuyển sang tab "Ghi chú", hiện chip lọc theo đúng mã vừa click.

## Kết quả mong đợi
- [ ] Click icon "Xem ghi chú" trên 1 dòng (VD ACB) → panel phải mở tab Ghi chú, hiện chip lọc "ACB", hiện bộ lọc Danh mục/Màu/Thời gian/Giao dịch.

---

# [TC_WATCHLIST_42] Trạng thái không có ghi chú nào

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**

## Kết quả mong đợi
- [ ] Với mã chưa có ghi chú nào → hiển thị đúng heading **"Không có ghi chú nào"**.

---

# [TC_WATCHLIST_43] Tab "Bài viết" — công bố thông tin theo mã trong watchlist

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua DOM thật**
- **Ghi chú:** Danh sách link công bố thông tin (báo cáo tài chính, nghị quyết HĐQT...) của các mã đang có trong watchlist hiện tại, mỗi item là 1 link, kèm ngày giờ.

## Kết quả mong đợi
- [ ] Click tab "Bài viết" → hiển thị danh sách công bố thông tin dạng link, sắp xếp theo thời gian giảm dần.

---

# [TC_WATCHLIST_44] Chuyển đổi qua lại 2 tab Ghi chú / Bài viết

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Locator scope `.tabs-menu .tab-item`, tránh trùng với tab bảng bên trái.

## Kết quả mong đợi
- [ ] Click tab đang active lần nữa → panel thu gọn lại (theo code `handleClickTab`), không giữ nguyên trạng thái mở.

---

# [TC_WATCHLIST_45] Nút "Thêm ghi chú mới"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Hiển thị nút "Thêm ghi chú mới" ở panel Ghi chú — verify hiển thị, không thực hiện thêm ghi chú thật (rủi ro tạo dữ liệu rác dài hạn, không như xóa dễ dàng như bài viết Cộng Đồng).

---

## Nhóm I: Tài khoản Free — hạn chế tính năng

# [TC_WATCHLIST_46] Cột điểm/định giá ẩn với tài khoản Free

- **Trạng thái:** ⚠️ Cần xác nhận thêm — chờ tài khoản Free hợp lệ (xem TRACKER.md)
- **Ghi chú:** Code: cột Điểm Canslim/Điểm 4M/"Tiềm năng giá (KFSP AI)" hiện `--` khi `$store.state.isAccountFree`.

## Kết quả mong đợi
- [ ] Tài khoản Free thấy các cột trên đều là `--`, không thấy giá trị số + thanh strength-bar.

---

# [TC_WATCHLIST_47] Phát hiện: fallback mặc định `isAccountFree` KHÔNG nhất quán giữa 2 component

- **Trạng thái:** 🆕 Testcase mới — **PHÁT HIỆN qua code, chưa quan sát được lỗi thật lúc chạy**
- **Ghi chú:** `WatchListHeader.vue` dùng `store?.state?.isAccountFree || false` (mặc định coi là **trả phí** nếu giá trị chưa xác định) trong khi `WatchListLeft.vue` dùng `|| true` (mặc định coi là **Free**). Nếu `isAccountFree` tạm thời `undefined` lúc mới tải trang, header có thể hiện control trả phí (tab "Nhật ký GD"/"Khác", "Quản lý watchlist") trong khi bảng đồng thời ẩn cột điểm — 2 phần của cùng 1 màn hình mâu thuẫn nhau trong khoảnh khắc load. Khó tái tạo ổn định bằng automation (phụ thuộc race condition lúc tải store) — ghi nhận làm tài liệu tham khảo cho dev, không viết test tự động cho case này.

---

## Nhóm J: Hành vi chung khác

# [TC_WATCHLIST_48] Double-click nút "Lưu" trong modal Tạo/Sửa Watchlist

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Không thấy flag loading/disable khi đang submit trong code (`handleSave` không có guard) — nghi ngờ double-click gọi API nhiều lần, giống lỗi double-submit đã gặp ở Đăng Nhập/Đăng Ký/Cộng Đồng. Cần đo qua đếm request.

---

# [TC_WATCHLIST_49] Giá/dữ liệu tự cập nhật qua socket, không cần F5

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Không assert giá trị cụ thể (dữ liệu real-time, dễ flaky) — chỉ verify có sự thay đổi DOM (VD key `:key="item.change"` trigger transition) trong khoảng thời gian theo dõi, hoặc verify không có lỗi console khi nhận update.

---

## Tổng hợp trạng thái

Đã tự động hoá bằng Playwright: [tests/watchlist.spec.ts](../tests/watchlist.spec.ts) (POM: [pages/WatchlistPage.ts](../pages/WatchlistPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 31 | Phần lớn qua mock API để tránh làm hỏng dữ liệu thật của nhiều watchlist có sẵn; riêng TC_WATCHLIST_29 verify vòng đời thêm/xóa mã thật trên 1 watchlist test tự tạo, tự dọn dẹp — tất cả đã chạy pass thật (38/38, 9 fixme) |
| 🆕 Mới (riêng web) | 11 | Layout resize, quản lý nhiều watchlist, panel Ghi chú/Bài viết, phát hiện fallback `isAccountFree` không nhất quán — app hoàn toàn không có các khái niệm này |
| ⚠️ Cần xác nhận thêm | 7 | TC_09/46 cần tài khoản Free, TC_31 cần xác nhận quyền moderator, TC_16/19/20/48 cần đo thêm hành vi thật (cột Website, crash rỗng, loading UI, double-submit); TC_25 khó tái tạo ổn định qua UI thật — xem [TRACKER.md](../TRACKER.md) |

**Phạm vi CHƯA làm sâu trong đợt này (có thể bổ sung sau qua Nhánh B của skill):**
- Từng cột trong 9 tab bảng (~80 cột) không được test định dạng số riêng lẻ từng cột — chỉ test đại diện cấu trúc chung, vì đây là dữ liệu hiển thị thuần tuý (không phải logic nghiệp vụ cần verify riêng).
- Nội dung chi tiết modal biểu đồ giao dịch (dùng chung toàn app, không thuộc phạm vi màn Watchlist).
- Bộ lọc chi tiết trong panel Ghi chú (Danh mục/Màu/Thời gian/Giao dịch) — mới xác nhận có hiển thị, chưa test từng giá trị lọc.

**🐞 Phát hiện đáng chú ý cần báo lại team dev:**
1. Lỗi chính tả thật trong toast lỗi: "Vui loing thử lại sau!" (phải là "Vui lòng") — `WatchListHeader.vue`.
2. Nghi vấn crash JS khi watchlist thực sự 0 mã (`document.querySelector('nav[aria-label="pagination"]')` không kiểm tra null trong `watch: itemsDataTable`) — chưa xác nhận được trực tiếp vì không có dữ liệu rỗng thật, khuyến nghị verify bằng mock API trả `[]`.
3. `isAccountFree` có 2 giá trị fallback mặc định khác nhau giữa `WatchListHeader.vue` (`|| false`) và `WatchListLeft.vue` (`|| true`) — có thể gây hiển thị mâu thuẫn giữa header và bảng trong khoảnh khắc tải trang.
4. Nhánh catch của `handleChangeBuySell()` (toggle tín hiệu Mua/Bán) kiểm tra lỗi `"Already name"` — có vẻ copy nhầm từ luồng đổi tên watchlist, không liên quan ngữ nghĩa tới endpoint tín hiệu Mua/Bán.
5. Không thấy guard chống double-submit ở nút "Lưu" trong modal Tạo/Sửa Watchlist.
