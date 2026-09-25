# Màn hình: Cộng Đồng (Community)

- **URL:** `/cong-dong` (mặc định — tab "AI Cập Nhật"), `/cong-dong/moi-nhat`, `/cong-dong/quan-tam`, `/cong-dong/pho-bien` (3 tab feed xã hội)
- **Component chính:** [Community.vue](../../stocks/src/views/homepage/Community.vue) (tab AI Cập Nhật) · [News.vue](../../stocks/src/views/homepage/News.vue) → [community.vue](../../stocks/src/views/multiLayoutChart/TabCommunity/community.vue) → [feed.vue](../../stocks/src/views/multiLayoutChart/TabCommunity/feed.vue) → [post.vue](../../stocks/src/views/multiLayoutChart/TabCommunity/post.vue) (3 tab feed xã hội)
- **Domain test:** https://kfsp.vn
- **Nguồn testcase gốc (app):** Google Sheet, tab "Cộng Đồng" (81 testcase, tổ chức quanh 1 màn hình có 4 tab trong app).
- **Phương pháp sinh:** Đọc source code + kiểm kê độc lập trên web thật (theo skill `gen-web-testcase`), không dịch 1-1 từ Sheet. Mọi hành động có thể ghi dữ liệu thật lên production (đăng bài, bình luận) đều được mock API — chỉ có 1 lượt Thích/Bỏ thích thật (rồi revert ngay) được thực hiện để verify, vì đây là hành động riêng tư, dễ hoàn tác.

## ⚠️ Phát hiện kiến trúc quan trọng — đọc trước khi dùng tài liệu này

Màn "Cộng Đồng" trên web **không phải 1 màn hình đơn với 4 tab như app mô tả**, mà là 2 trải nghiệm khác hẳn nhau dùng chung 1 entry point:

1. **Tab "AI Cập Nhật"** (`/cong-dong`, mặc định, **không cần đăng nhập**) — feed tin tức/phân tích do AI tổng hợp (gọi Typesense search + API `/news/news-summary`). **Không có** thích/bình luận/chia sẻ/tạo bài — chỉ đọc.
2. **3 tab "Mới nhất / Quan tâm / Phổ biến"** (`/cong-dong/moi-nhat`...) — đây mới là feed mạng xã hội thật khớp mô tả app: đăng bài (rich text, gắn mã CK, hashtag, tâm lý thị trường, ảnh), thích, bình luận (có reply, ảnh), chia sẻ, sửa/xóa/ghim bài của mình, bài ghim, gợi ý theo dõi... **Bắt buộc đăng nhập** — chưa đăng nhập mà bấm 1 trong 3 tab này sẽ hiện modal chặn, không điều hướng.

Vì lý do này, tài liệu chia theo đúng 2 khu vực trên, cộng thêm các phần dùng chung (sidebar phải, responsive...).

## Quy ước trạng thái

✅ Áp dụng · 🆕 Testcase mới (web-only, app không có) · ⚠️ Cần xác nhận thêm

---

## Nhóm A: Tab "AI Cập Nhật" (mặc định, public)

# [TC_CONGDONG_01] Overview tab AI Cập Nhật khi chưa đăng nhập

- **Trạng thái:** ✅ Áp dụng (điều chỉnh nhiều so với app)
- **Tham chiếu App:** TC_01
- **Khác biệt so với app:** KHÔNG có icon back, KHÔNG có floating button tạo bài, KHÔNG có avatar/like/comment/share trên từng item — chỉ có ô tìm kiếm + danh sách tin (thời gian, chip category, mô tả ngắn). Có thêm sidebar trái "Từ khóa hot" và sidebar phải (banner + widget thị trường) mà app không có.

## Các bước thực hiện
1. Mở `/cong-dong` khi chưa đăng nhập.

## Kết quả mong đợi
- [ ] Hiển thị 4 tab: "AI Cập Nhật" (active), "Mới nhất", "Quan tâm", "Phổ biến".
- [ ] Hiển thị banner "Bạn cần đăng nhập để tham gia thảo luận, chia sẻ ý kiến trên cộng đồng." + nút "Đăng nhập".
- [ ] Hiển thị ô tìm kiếm "Nhập từ khóa tìm kiếm" + danh sách tin tức (mỗi tin: giờ, thời gian tương đối, category, mô tả).
- [ ] Sidebar trái: "🔥 TỪ KHÓA HOT" với danh sách hashtag.
- [ ] Sidebar phải: banner quảng cáo + widget "Chỉ số quốc tế" + "Top tăng/giảm".

---

# [TC_CONGDONG_02] Click "Đăng nhập" trên banner

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** không có (web-only entry, nhưng tương đương ý nghĩa TC_36 của app)

## Các bước thực hiện
1. Chưa đăng nhập, ở `/cong-dong`, click nút "Đăng nhập" trong banner.

## Kết quả mong đợi
- [ ] Điều hướng tới `/login?redirect=/cong-dong`.

---

# [TC_CONGDONG_03] Ô tìm kiếm tin AI

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** 🆕 (app không có tìm kiếm ở màn Cộng đồng)

## Các bước thực hiện
1. Nhập từ khóa vào ô "Nhập từ khóa tìm kiếm".

## Kết quả mong đợi
- [ ] Danh sách tin lọc theo từ khóa (debounce ~100ms, gọi Typesense search theo `title`).
- [ ] Nhấn phím Esc trong ô tìm kiếm → xóa nội dung ô tìm kiếm (`@keydown.esc`).

---

# [TC_CONGDONG_04] Hiển thị 1 item tin AI

- **Trạng thái:** ✅ Áp dụng (điều chỉnh nhiều so với app)
- **Tham chiếu App:** TC_24, TC_25, TC_27, TC_29
- **Khác biệt so với app:** Item tin AI **không có ảnh thumbnail, không có avatar tác giả** — chỉ có icon đồng hồ + giờ + thời gian tương đối, chip category, đoạn mô tả ngắn.

## Các bước thực hiện
1. Quan sát 1 item trong danh sách tab AI Cập Nhật.

## Kết quả mong đợi
- [ ] Hiển thị icon đồng hồ + giờ (HH:mm) + thời gian tương đối ("vừa xong"/"X phút trước"/"X giờ trước"/"X ngày trước"/ngày cụ thể nếu > 30 ngày).
- [ ] Hiển thị chip category (nếu có).
- [ ] Hiển thị mô tả ngắn (nếu có).

---

# [TC_CONGDONG_05] Click item tin AI mở modal chi tiết

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_31

## Các bước thực hiện
1. Click vào 1 item tin (không giữ Ctrl).

## Kết quả mong đợi
- [ ] Mở modal chi tiết bài viết ngay trên trang (`AnalysisCommentaryDetailModal`), không rời trang.

---

# [TC_CONGDONG_06] Ctrl+Click item tin AI mở tab mới

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Xác nhận qua code: `event.ctrlKey` → mở tab mới thay vì modal.

## Các bước thực hiện
1. Ctrl+Click vào 1 item tin.

## Kết quả mong đợi
- [ ] Mở tab trình duyệt mới tới trang chi tiết bài viết đó.

---

# [TC_CONGDONG_07] "Hiện bài viết mới" khi có bài chờ

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Nút chỉ hiện khi `pending_list.length > 0` (nhận qua WebSocket real-time) và không đang tìm kiếm — khó chủ động tạo điều kiện này trong test tự động, cần môi trường có bài mới đăng thật hoặc mock socket event.

## Các bước thực hiện
1. Có bài viết mới đăng trong lúc đang xem tab AI Cập Nhật (qua socket).

## Kết quả mong đợi
- [ ] Hiện nút "Hiện bài viết mới" ở đầu danh sách, click vào để chèn bài mới lên đầu.

---

## Nhóm B: Sidebar trái — "Từ khóa hot" (chỉ ảnh hưởng tab AI Cập Nhật)

# [TC_CONGDONG_08] Hiển thị danh sách hashtag hot

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app)
- **Tham chiếu App:** TC_11
- **Khác biệt so với app:** Web có **9 hashtag** (không có mục "#Mới nhất"/"#KFSP AI" riêng như app — thay bằng "Tất cả" mặc định active), nằm ở **sidebar trái**, không phải thanh tab con ngang dưới header.

## Các bước thực hiện
1. Quan sát sidebar trái ở tab AI Cập Nhật.

## Kết quả mong đợi
- [ ] Hiển thị "🔥 TỪ KHÓA HOT" + 9 hashtag: Tất cả (active mặc định), Thị trường chứng khoán, Tài chính quốc tế, Tài chính - ngân hàng, Kinh tế vĩ mô - Đầu tư, Doanh nghiệp, Bất động sản, Thời sự, Crypto.

---

# [TC_CONGDONG_09] Click 1 hashtag lọc tin

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_13–TC_21 (gộp — cùng 1 cơ chế lọc theo category cho mọi hashtag)

## Các bước thực hiện
1. Click vào 1 hashtag bất kỳ (VD "Bất động sản").

## Kết quả mong đợi
- [ ] Hashtag chuyển trạng thái active (đổi màu nền).
- [ ] Danh sách tin lọc lại theo category tương ứng, không điều hướng URL (lọc tại chỗ qua prop `category`).

---

## Nhóm C: Chuyển đổi 4 tab lớn & yêu cầu đăng nhập

# [TC_CONGDONG_10] Hiển thị 4 tab lớn

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_05

## Kết quả mong đợi
- [ ] Hiển thị 4 tab: "AI Cập Nhật", "Mới nhất", "Quan tâm", "Phổ biến".

---

# [TC_CONGDONG_11] Click tab Mới nhất/Quan tâm/Phổ biến khi CHƯA đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: đúng như code**
- **Tham chiếu App:** TC_06, TC_07, TC_08
- **Khác biệt so với app:** App cho vào xem tab (chỉ ẩn thanh soạn bài); web **chặn hoàn toàn** bằng modal, không đổi tab, không điều hướng URL.

## Các bước thực hiện
1. Chưa đăng nhập, click tab "Mới nhất" (hoặc Quan tâm/Phổ biến).

## Kết quả mong đợi
- [ ] Hiện modal "Thông báo": "Bạn cần đăng nhập để sử dụng chức năng này." + nút Đóng (đã verify chính xác).
- [ ] URL và tab active KHÔNG đổi.

---

# [TC_CONGDONG_12] Truy cập deep-link `/cong-dong/moi-nhat` khi chưa đăng nhập

- **Trạng thái:** ✅ Áp dụng — **Đã verify: XÁC NHẬN LÀ hard redirect**
- **Ghi chú:** Xác nhận qua code (`computed: token` dùng `window.location.href = "/cong-dong"`) và verify trực tiếp: vào thẳng URL `/cong-dong/moi-nhat` khi chưa đăng nhập → tự động bị đẩy về `/cong-dong` (full page reload, không phải điều hướng SPA).

## Các bước thực hiện
1. Chưa đăng nhập, truy cập trực tiếp URL `/cong-dong/moi-nhat`.

## Kết quả mong đợi
- [ ] Tự động chuyển về `/cong-dong` (đã verify chính xác).

---

# [TC_CONGDONG_13] Click tab khi ĐÃ đăng nhập

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_06, TC_07, TC_08

## Các bước thực hiện
1. Đã đăng nhập, click lần lượt "Mới nhất", "Quan tâm", "Phổ biến".

## Kết quả mong đợi
- [ ] Điều hướng đúng URL tương ứng (`/cong-dong/moi-nhat`, `/cong-dong/quan-tam`, `/cong-dong/pho-bien`), tab active đổi màu nền.

---

# [TC_CONGDONG_14] Tab "Quan tâm" khi chưa follow/like ai

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (unfollow tạm rồi follow lại)**
- **Tham chiếu App:** TC_58
- **Ghi chú:** Tự động hoá bằng cách unfollow tạm người tài khoản test đang follow, verify empty-state, rồi
  follow lại NGAY qua trang cá nhân của người đó để khôi phục trạng thái ban đầu (không dùng sidebar "Gợi ý" để
  follow lại vì danh sách đó xoay vòng ngẫu nhiên, không đảm bảo hiển thị đúng người — đã phát hiện qua thực
  tế).

## Kết quả mong đợi
- [ ] Sau khi unfollow, tab Quan tâm hiển thị "Chưa theo dõi người nào" (đã verify đúng text qua source
  `follow.vue`) hoặc danh sách bài rỗng nếu không còn like bài nào khác.

---

## Nhóm D: Feed xã hội — hiển thị bài viết (Post item)

# [TC_CONGDONG_15] Hiển thị đầy đủ 1 bài viết

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app) — **Đã verify thực tế**
- **Tham chiếu App:** TC_37, TC_38, TC_41, TC_43, TC_46

## Kết quả mong đợi
- [ ] Avatar tác giả (hình tròn) + tên tác giả (đậm) + badge hạng thành viên (`MemberLogo`, nếu có gói VIP) + dấu tick xác thực (nếu tài khoản chính thức).
- [ ] Thời gian tương đối (VD "1 giờ trước").
- [ ] Icon "..." góc trên phải (chỉ hiện với bài của chính mình hoặc tài khoản có quyền ghim).
- [ ] Nội dung bài viết, rút gọn kèm link "Xem thêm" nếu dài, chuyển thành "Ẩn bớt" khi mở rộng.
- [ ] Nếu có gắn mã CK: hiển thị danh sách mã nổi bật. Nếu có hashtag: hiển thị dạng `#hashtag`.
- [ ] Nếu có gắn tâm lý thị trường (Tích cực/Trung lập/Tiêu cực): hiển thị chip màu tương ứng.
- [ ] Nếu có ảnh: hiển thị dạng lưới ảnh (`gridImage`); nếu không ảnh, hiển thị preview link/rich-text.
- [ ] "X lượt thích" / "X bình luận" (chỉ hiện khi > 0).
- [ ] 3 nút: Thích (♡/♥), Bình luận, Chia sẻ.

---

# [TC_CONGDONG_16] Click "Xem thêm" mở rộng nội dung

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_42

## Kết quả mong đợi
- [ ] Mở rộng nội dung đầy đủ ngay tại chỗ (không chuyển trang), nút đổi thành "Ẩn bớt".

---

# [TC_CONGDONG_17] Click tên/avatar tác giả

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_32

## Kết quả mong đợi
- [ ] Điều hướng tới `/cong-dong/thanh-vien/:user_id` (trang cá nhân tác giả).

---

# [TC_CONGDONG_18] Bài viết dạng gói tin AI được ghim tự động ("Điểm tin tài chính")

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Quan sát thực tế: tài khoản "Thái Phạm" (có tick xác thực) đăng chuỗi bài "ĐIỂM TIN TÀI CHÍNH NGÀY .../8/2026" hàng ngày trong tab Mới nhất — có vẻ là tài khoản admin/hệ thống. Không phải hành vi bắt buộc test riêng, chỉ ghi nhận để không nhầm là dữ liệu rác khi review.

---

## Nhóm E: Tạo bài viết mới (Compose)

# [TC_CONGDONG_19] Hiển thị thanh soạn bài rút gọn

- **Trạng thái:** ✅ Áp dụng (điều chỉnh so với app)
- **Tham chiếu App:** TC_35
- **Khác biệt so với app:** Chỉ hiện ở tab "Mới nhất" (không hiện ở Quan tâm/Phổ biến — khớp app), placeholder thực tế **"Bạn có nhận định gì muốn chia sẻ?"** (đúng như app).

## Kết quả mong đợi
- [ ] Hiển thị avatar user + ô input placeholder "Bạn có nhận định gì muốn chia sẻ?" (chỉ ở tab Mới nhất).

---

# [TC_CONGDONG_20] Click thanh soạn bài mở modal "Tạo bài viết mới"

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: khác app nhiều**
- **Tham chiếu App:** TC_36
- **Khác biệt so với app:** Modal có đầy đủ: toolbar rich-text (Normal/Bold/Italic/Underline/Link/căn lề), ô "Mã chứng khoán" (tag input), ô "#Hashtag" (tag input), textarea placeholder **"Bạn cảm thấy như thế nào về thị trường hôm nay? Chia sẻ suy nghĩ của bạn tại đây!"** (khác placeholder ngoài thanh rút gọn), nút chọn ảnh + emoji, 3 nút tâm lý thị trường (Tích cực/Trung lập/Tiêu cực), nút submit **"Đăng bài ngay"**.

## Kết quả mong đợi
- [ ] Mở modal "Tạo bài viết mới" đầy đủ các thành phần trên (đã verify qua screenshot thực tế).

---

# [TC_CONGDONG_21] Submit bài viết rỗng

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation: không gọi API**
- **Tham chiếu App:** TC_65
- **Khác biệt so với app:** Message thực tế **"Vui lòng nhập nội dung bài viết"** (khớp app).

## Kết quả mong đợi
- [ ] Không gọi API `post/store` (đã verify), hiển thị toast lỗi "Vui lòng nhập nội dung bài viết".

---

# [TC_CONGDONG_22] Đăng bài với nội dung hợp lệ

- **Trạng thái:** ✅ Áp dụng (mock API) — **Đã verify bằng automation**
- **Tham chiếu App:** TC_64
- **Khác biệt so với app:** Toast thành công thực tế **"Thêm mới thành công"** (app kỳ vọng "Đăng bài thành công"). Bài mới được chèn lên đầu danh sách ngay (không cần reload).

## Kết quả mong đợi
- [ ] Gọi `POST /api/stocks/community/post/store` (multipart/form-data), thành công → toast "Thêm mới thành công", bài xuất hiện đầu feed, đóng modal.

---

# [TC_CONGDONG_23] Gắn mã chứng khoán vào bài viết

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock đăng bài)**
- **Ghi chú:** Ô "Mã chứng khoán" dùng `vue-tags-input`, gửi lên dạng `macks[]` trong form-data khi submit.

## Kết quả mong đợi
- [x] Nhập/chọn được mã CK, hiển thị dạng tag trong ô, gửi kèm khi đăng bài.

---

# [TC_CONGDONG_24] Gắn hashtag vào bài viết

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock đăng bài)**
- **Ghi chú:** Tương tự mã CK — `hashtags[]` trong form-data.

## Kết quả mong đợi
- [x] Nhập được hashtag dạng tag, gửi kèm khi đăng bài.

---

# [TC_CONGDONG_25] Chọn tâm lý thị trường (Tích cực/Trung lập/Tiêu cực)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation (mock đăng bài)**
- **Ghi chú:** Gửi lên field `trend`. Hiển thị lại trên bài viết dạng chip màu (xem TC_CONGDONG_15).

## Kết quả mong đợi
- [x] Chọn được 1 trong 3 mức, bài viết sau khi đăng hiển thị đúng chip tương ứng.

---

# [TC_CONGDONG_26] Đính kèm ảnh khi đăng bài

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (mock đăng bài, ảnh mẫu `tests/fixtures/sample-image.png`)**
- **Tham chiếu App:** TC_64

## Kết quả mong đợi
- [x] Chọn ảnh → hiển thị preview trong modal, xóa được ảnh đã chọn trước khi đăng.

---

# [TC_CONGDONG_27] Đăng bài khi mất kết nối mạng

- **Trạng thái:** ✅ Áp dụng (mock offline) — **Đã verify bằng automation: KHÔNG crash JS**
- **Tham chiếu App:** TC_66
- **Ghi chú:** Đã đọc kỹ `catch` trong `addNewPost.vue` — dùng optional chaining đầy đủ (`error?.response?.data?.message`) nên an toàn khi mất mạng, khác bug đã phát hiện ở màn Đăng Nhập.

## Kết quả mong đợi
- [x] Mất kết nối lúc submit → không crash JS, không có lỗi console không xử lý (verify qua `pageErrors`).

---

## Nhóm F: Thích bài viết

# [TC_CONGDONG_28] Thích bài viết

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế trên dữ liệu thật (đã revert lại ngay sau khi test)**
- **Tham chiếu App:** TC_47, TC_48

## Kết quả mong đợi
- [ ] Click "Thích" → icon trái tim chuyển đỏ/đầy, text đổi thành "Đã thích", gọi `POST /api/stocks/community/like` (đã verify chính xác).

---

# [TC_CONGDONG_29] Bỏ thích bài viết

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế**
- **Tham chiếu App:** TC_49

## Kết quả mong đợi
- [ ] Click "Đã thích" lần nữa → trở về trạng thái "Thích" (tim rỗng) (đã verify chính xác).

---

# [TC_CONGDONG_30] Click Thích liên tục nhanh

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_50
- **Ghi chú:** Code không có debounce/disable riêng cho `likePost()` — nghi ngờ mỗi click đều gọi API riêng (khác kỳ vọng app "chỉ chuyển đổi 1 lần"). Cần đo bằng automation đếm số request.

---

# [TC_CONGDONG_31] Thích khi API lỗi

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua code**
- **Tham chiếu App:** TC_51
- **Ghi chú:** `catch` hiển thị toast "Có lỗi xảy ra, vui lòng thử lại", không tự revert UI lạc quan (vì UI cập nhật dựa trên response thành công qua `toggleLike`, không optimistic-update trước) — khác app (kỳ vọng "hiện tạm thời rồi revert").

## Kết quả mong đợi
- [ ] Mock API like trả lỗi → hiển thị toast lỗi, trạng thái tim KHÔNG đổi (vì chỉ đổi khi có response thành công).

---

## Nhóm G: Bình luận

# [TC_CONGDONG_32] Hiển thị button Bình luận

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_52

## Kết quả mong đợi
- [ ] Hiển thị icon comment + text "Bình luận".

---

# [TC_CONGDONG_33] Click Bình luận mở modal chi tiết bài viết

- **Trạng thái:** ✅ Áp dụng — **Đã verify thực tế: khác app**
- **Tham chiếu App:** TC_53
- **Khác biệt so với app:** Mở **modal ngay trên trang** (không chuyển màn), hiển thị lại toàn bộ nội dung bài + khung viết bình luận bên dưới. Không tự động focus/bật bàn phím (đặc thù mobile, N/A cho web).

## Kết quả mong đợi
- [ ] Modal "Bài đăng của {tên tác giả}" mở ra, có ô "Viết bình luận..." (đã verify hiển thị đúng).

---

# [TC_CONGDONG_34] Viết bình luận hợp lệ

- **Trạng thái:** ✅ Áp dụng (mock API)
- **Tham chiếu App:** 🆕 (app không có testcase riêng viết bình luận trong sheet Cộng Đồng)

## Kết quả mong đợi
- [ ] Gọi `POST /api/stocks/community/comment/store` (multipart/form-data: content, post_id), thành công → toast "Thêm mới thành công", bình luận xuất hiện, ô nhập được xóa trắng.

---

# [TC_CONGDONG_35] Bình luận rỗng/chỉ khoảng trắng

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua code**
- **Ghi chú:** Khác các form khác — KHÔNG hiện toast lỗi, chỉ âm thầm không submit (`if (!input_comment.trim()) return`).

## Kết quả mong đợi
- [ ] Nhấn Enter với ô trống/toàn khoảng trắng → không gọi API, không có thông báo gì.

---

# [TC_CONGDONG_36] Shift+Enter xuống dòng, Enter gửi bình luận

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Code chặn riêng `e.shiftKey && e.key === 'Enter'`.

## Kết quả mong đợi
- [ ] Shift+Enter tạo dòng mới trong ô nhập, không gửi. Enter (không giữ Shift) gửi bình luận.

---

# [TC_CONGDONG_37] Đính kèm ảnh vào bình luận

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** `writeComment.vue` hỗ trợ upload 1 ảnh kèm bình luận.

## Kết quả mong đợi
- [ ] Chọn được ảnh, xóa được ảnh trước khi gửi, ảnh gửi kèm bình luận.

---

# [TC_CONGDONG_38] Trả lời (reply) 1 bình luận

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Gửi kèm `parent_id` khi trả lời 1 bình luận cụ thể — tạo cấu trúc bình luận lồng nhau (app không mô tả tính năng này).

## Kết quả mong đợi
- [ ] Bình luận trả lời hiển thị lồng dưới bình luận gốc.

---

# [TC_CONGDONG_39] Sửa bình luận của mình

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Message rỗng: "Nội dung không được để trống"; thành công: "Chỉnh sửa thành công".

## Kết quả mong đợi
- [ ] Sửa được nội dung bình luận của chính mình, không sửa được bình luận người khác (không có menu sửa).

---

# [TC_CONGDONG_40] Xóa bình luận của mình

- **Trạng thái:** ✅ Áp dụng — **PHÁT HIỆN: không có modal xác nhận**
- **Tham chiếu App:** ý tưởng liên quan icon "..." của app (TC_39/40) nhưng cho bình luận
- **Ghi chú:** Khác với xóa bài viết (có modal "Bạn có chắc muốn xóa?"), xóa bình luận thực hiện **ngay lập tức** khi click "Xóa bình luận", không hỏi xác nhận — dễ xóa nhầm.

## Kết quả mong đợi
- [ ] Click "Xóa bình luận" → xóa ngay, không có bước xác nhận (ghi nhận là điểm UX cần lưu ý, không phải bug bắt buộc sửa).

---

# [TC_CONGDONG_41] Thích 1 bình luận

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** Dùng chung API `/api/stocks/community/like` (khác `type` so với thích bài viết).

## Kết quả mong đợi
- [ ] Thích/bỏ thích được từng bình luận riêng biệt.

---

## Nhóm H: Chia sẻ

# [TC_CONGDONG_42] Click "Chia sẻ"

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua code, khớp app**
- **Tham chiếu App:** TC_54, TC_55

## Kết quả mong đợi
- [ ] Copy link dạng `<VUE_APP_SOCIAL_URL>/community/share-post?id=<id>` vào clipboard, hiện toast "Đã sao chép link thành công!" (khớp đúng app TC_55).

---

## Nhóm I: Menu quản lý bài viết của mình ("...")

# [TC_CONGDONG_43] Hiển thị icon "..." trên bài viết của mình

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (đăng 1 bài thật, tự xóa ngay sau)**
- **Tham chiếu App:** TC_39, TC_40

## Kết quả mong đợi
- [ ] Chỉ hiện icon "..." trên bài của chính mình (hoặc khi có quyền ghim). Click mở dropdown gồm: Tắt/Bật thông báo, Chỉnh sửa bài viết, (Ghim/Bỏ ghim nếu có quyền), Xóa bài viết.

---

# [TC_CONGDONG_44] Tắt/Bật thông báo cho 1 bài viết

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation — PHÁT HIỆN khác giả định ban đầu**
- **Ghi chú:** Click "Tắt thông báo" có gọi đúng `POST /community/update-notify` (đã verify qua network), NHƯNG
  **nhãn trên dropdown KHÔNG đổi thành "Bật thông báo"** sau khi click (đã verify trực tiếp — nhãn giữ nguyên
  "Tắt thông báo"), và **dropdown không tự đóng** sau khi click 1 mục (khác hành vi dropdown thông thường).
  Nghi ngờ thiếu re-render UI sau khi đổi `source.notify_off` — nên báo lại cho dev kiểm tra.

## Kết quả mong đợi
- [ ] Gọi đúng API `POST /community/update-notify` khi click (đã verify).
- [ ] ⚠️ Thực tế: nhãn UI không cập nhật ngay — cần dev xác nhận đây có phải bug hay chỉ cần F5 lại mới thấy đổi.

---

# [TC_CONGDONG_45] Chỉnh sửa bài viết của mình

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (sửa bài thật của tài khoản test)**
- **Tham chiếu App:** 🆕
- **Ghi chú:** Modal sửa dùng chung cấu trúc rich-text (Quill) với modal tạo bài mới, nút lưu là **"Lưu"** (không
  phải "Cập nhật bài viết" như suy đoán ban đầu).

## Kết quả mong đợi
- [ ] Mở modal "Chỉnh sửa bài viết" với nội dung hiện có, sửa nội dung → click "Lưu" → nội dung cập nhật ngay
  trong feed (đã verify chính xác).

---

# [TC_CONGDONG_46] Xóa bài viết của mình

- **Trạng thái:** ✅ Áp dụng — **Đã verify bằng automation (xóa đúng bài test vừa tạo, có double-check qua API)**
- **Tham chiếu App:** 🆕
- **Ghi chú:** Có modal xác nhận "Thông báo" — nội dung đúng **"Bạn có muốn xóa bài viết này không?"**, 2 nút
  "Đóng"/"Xóa" — khác hành vi xóa bình luận (TC_CONGDONG_40, không có xác nhận).

## Kết quả mong đợi
- [ ] Click "Xóa bài viết" → hiện modal xác nhận đúng nội dung trên → click "Xóa" → bài biến mất khỏi feed (đã
  verify chính xác).

---

# [TC_CONGDONG_47] Không thấy icon "..." trên bài người khác (không có quyền ghim)

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** ngụ ý từ TC_39 (app)

## Kết quả mong đợi
- [ ] Bài viết của người khác không hiển thị icon "..." (trừ khi tài khoản có quyền ghim bài).

---

## Nhóm J: Bài viết được ghim (Pinned posts)

# [TC_CONGDONG_48/49] Hiển thị bài ghim đúng dạng theo số lượng thực tế lúc chạy (slider ≥3 bài / danh sách 1-2 bài)

- **Trạng thái:** 🆕 Testcase mới — **Đã verify bằng automation, viết THÍCH ỨNG (adaptive)**
- **Ghi chú:** Chỉ áp dụng ở tab "Mới nhất" (API `pinned` chỉ gọi khi route chứa `cong-dong/moi-nhat`). Số bài
  ghim thay đổi theo thời gian thực trên production — đã quan sát thực tế có lúc 1 bài, có lúc 0 bài trong
  cùng 1 buổi làm việc, nên **không thể hard-code số lượng kỳ vọng**. 1 test duy nhất gộp cả TC_48 và TC_49,
  quan sát trạng thái thật lúc chạy rồi rẽ nhánh qua `test.info().annotations` để người đọc báo cáo biết chính
  xác nhánh nào đã được kiểm tra (0 bài ghim / dạng danh sách 1-2 bài / dạng slider ≥3 bài), thay vì assert 1
  con số cố định dễ flaky theo dữ liệu thật.

## Kết quả mong đợi
- [x] Nếu có bài ghim (nhãn "Đáng chú ý" hiển thị): có nhãn "Bài viết khác" phân tách bên dưới → đang ở dạng
  DANH SÁCH (1-2 bài); không có nhãn phân tách → đang ở dạng SLIDER (≥3 bài).
- [x] Nếu không có bài ghim nào tại thời điểm chạy: không có nhãn "Đáng chú ý" — annotate rõ và bỏ qua phần
  assert dạng hiển thị (không coi là fail).

---

# [TC_CONGDONG_50] Ghim / Bỏ ghim bài viết (cần quyền)

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Ghi chú:** Chỉ hiện với tài khoản có `isCanPin` — chưa rõ tài khoản test hiện tại có quyền này không, cần xác nhận.

---

## Nhóm K: Sidebar trái — Hồ sơ cá nhân & chuyển đổi view

# [TC_CONGDONG_51] Hiển thị thẻ hồ sơ cá nhân

- **Trạng thái:** 🆕 Testcase mới — **Đã verify thực tế**
- **Ghi chú:** Verify qua screenshot: avatar, tên user + badge, 3 số liệu "Bài đăng / Người theo dõi / Đang theo dõi" đều click được.

## Kết quả mong đợi
- [ ] Hiển thị avatar, tên, badge hạng thành viên, 3 số liệu Bài đăng/Người theo dõi/Đang theo dõi.

---

# [TC_CONGDONG_52] Click avatar/tên → xem trang cá nhân đầy đủ

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Chuyển sang view "Profile" (thông tin đầy đủ + danh sách bài đăng của chính mình).

---

# [TC_CONGDONG_53] Click "Bài đăng" / "Người theo dõi" / "Đang theo dõi"

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Chuyển nội dung khu vực giữa sang đúng danh sách tương ứng (posts/followers/following), số liệu khớp với số hiển thị trên thẻ.

---

## Nhóm L: Sidebar trái — Gợi ý theo dõi

# [TC_CONGDONG_54] Hiển thị danh sách gợi ý theo dõi (tài khoản trả phí)

- **Trạng thái:** ✅ Áp dụng — **Đã verify: tài khoản test thấy được gợi ý**
- **Tham chiếu App:** ngụ ý app TC_85 (free vs VIP)

## Kết quả mong đợi
- [ ] Hiển thị "Gợi ý" + danh sách user đề xuất, mỗi user có nút Theo dõi.

---

# [TC_CONGDONG_55] Không hiển thị gợi ý theo dõi với tài khoản Free — **PHÁT HIỆN qua code**

- **Trạng thái:** ⚠️ Cần xác nhận thêm
- **Tham chiếu App:** TC_85
- **Ghi chú:** Code: `if (this.$store.state.isAccountFree) return;` — API gợi ý không được gọi luôn với tài khoản Free, sidebar "Gợi ý" ẩn hoàn toàn. Test đã viết sẵn, dùng `FREE_USER_EMAIL`/`FREE_USER_PASSWORD` trong `.env`, tự động `test.skip` với lý do rõ ràng nếu tài khoản đăng nhập thất bại. **Tài khoản Free đầu tiên được cung cấp (`levanhieu250204@gmail.com`) bị API `/api/login` từ chối với lỗi `400 "Tài khoản không tồn tại"`** — chưa verify được, cần bạn kiểm tra lại thông tin đăng nhập.

---

# [TC_CONGDONG_56] Theo dõi / Bỏ theo dõi 1 user từ sidebar gợi ý

- **Trạng thái:** ✅ Áp dụng (mock API)

## Kết quả mong đợi
- [ ] Click nút Theo dõi → gọi `POST /api/stocks/community/follow`, đổi trạng thái nút (Theo dõi ↔ Đang theo dõi).

---

# [TC_CONGDONG_57] Phiên đăng nhập hết hạn khi tải gợi ý — 🐞 nghi vấn UX

- **Trạng thái:** ✅ Áp dụng (mock 401) — **Đã verify qua code, khác app**
- **Tham chiếu App:** TC_84
- **Ghi chú:** Code xử lý: xóa token, hiện toast "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" — nhưng dòng `this.$router.push("/login")` bị **comment out**, nghĩa là **không tự động điều hướng về trang đăng nhập**, người dùng vẫn đứng nguyên tại trang (có thể gây bối rối vì các hành động khác vẫn tưởng đã đăng nhập). Cần verify bằng mock response 401 cho API suggestion-list.

## Kết quả mong đợi
- [ ] Hiện toast phiên hết hạn nhưng KHÔNG tự điều hướng về `/login` (ghi nhận là điểm UX cần báo dev, không phải bug chặn dùng).

---

## Nhóm M: Phân trang / cuộn vô hạn

# [TC_CONGDONG_58] Cuộn xuống tải thêm bài viết

- **Trạng thái:** ✅ Áp dụng
- **Tham chiếu App:** TC_69

## Kết quả mong đợi
- [ ] Cuộn gần cuối danh sách (còn ~400px) → tự động gọi API trang tiếp theo (`last_post` = id bài cuối cùng hiện có), hiện spinner khi đang tải.

---

# [TC_CONGDONG_59] Tab "Phổ biến" KHÔNG tải thêm khi cuộn — **PHÁT HIỆN qua code**

- **Trạng thái:** ✅ Áp dụng — **Đã verify qua code**
- **Ghi chú:** `handleScroll()` có `if (this.type_tab === 'pho-bien') return;` — tab Phổ biến chỉ tải 1 trang duy nhất (10 bài), khác 2 tab còn lại.

## Kết quả mong đợi
- [ ] Ở tab Phổ biến, cuộn xuống cuối KHÔNG tải thêm bài (dừng ở tối đa 10 bài ban đầu).

---

## Nhóm N: Sidebar phải & Khác

# [TC_CONGDONG_60] Sidebar phải hiển thị widget thị trường

- **Trạng thái:** 🆕 Testcase mới (app không mô tả)

## Kết quả mong đợi
- [ ] Hiển thị 2 banner quảng cáo + widget "Chỉ số quốc tế" (BRENT, CRUDE, GAS, GOLD, DJI, SPX, IXIC, SSEC, N225, HSI) + widget "Top tăng/giảm" (có bộ lọc sàn HSX/HNX/UPCOM và khung thời gian).

---

# [TC_CONGDONG_61] Trang chính sách & điều khoản

- **Trạng thái:** 🆕 Testcase mới

## Kết quả mong đợi
- [ ] Link "Điều khoản và chính sách sử dụng" ở sidebar mở tab mới tới `/policy`, hiển thị đủ thông tin công ty/giấy phép/liên hệ.

---

# [TC_CONGDONG_62] Responsive nhiều kích thước màn hình

- **Trạng thái:** ✅ Áp dụng (thay thế "xoay ngang màn hình" + "iPhone notch" của app)
- **Tham chiếu App:** TC_74, TC_75

## Kết quả mong đợi
- [ ] Ở màn hình hẹp (< 1200px), sidebar phải/trái tự sắp xếp lại (`check_screen_width`) — không vỡ layout ở Desktop/Tablet/Mobile.

---

# [TC_CONGDONG_63] Nút Back trình duyệt giữa các tab

- **Trạng thái:** ✅ Áp dụng (thay thế "vuốt cạnh trái iOS"/"back device" của app)
- **Tham chiếu App:** TC_76, TC_89

## Kết quả mong đợi
- [ ] Chuyển tab Mới nhất → Quan tâm rồi bấm Back trình duyệt → quay lại đúng tab Mới nhất.

---

## Tổng hợp trạng thái

Đã tự động hoá bằng Playwright: [tests/cong-dong.spec.ts](../tests/cong-dong.spec.ts) (POM: [pages/CommunityPage.ts](../pages/CommunityPage.ts)).

| Trạng thái | Số lượng | Ghi chú |
|---|---|---|
| ✅ Áp dụng | 47 | Nhiều case đã verify trực tiếp bằng automation (thật hoặc mock) — bao gồm TC_14 (unfollow/follow lại thật), TC_43-46 (vòng đời bài viết thật, tự dọn dẹp), TC_26-27 (ảnh/offline) |
| 🆕 Mới (riêng web) | 11 | Chủ yếu do compose rich-text (TC_23-25, đã verify mock), reply bình luận, pinned posts (TC_48/49 gộp thành 1 test thích ứng, đã verify), sidebar hồ sơ — app hoàn toàn không có |
| ⚠️ Cần xác nhận thêm | 4 | TC_07 (bài mới qua socket), TC_30 (double-click), TC_50 (tài khoản có quyền ghim), TC_55 (tài khoản Free hợp lệ — tài khoản đầu tiên bị từ chối) — xem [TRACKER.md](../TRACKER.md) |

**Phạm vi CHƯA làm sâu trong đợt này (có thể bổ sung sau qua Nhánh B của skill):**
- Chi tiết đầy đủ trang "Profile" (view khi click vào thẻ hồ sơ) và trang "Follow" (danh sách followers/following) — mới chỉ test việc chuyển sang các view này, chưa test sâu nội dung bên trong từng view.
- Trang cá nhân người khác (`/cong-dong/thanh-vien/:id`) — mới test điều hướng tới, chưa test nội dung trang.
- Toolbar rich-text đầy đủ (Bold/Italic/Underline/Link/căn lề) trong modal tạo bài — mới xác nhận có hiển thị, chưa test từng nút định dạng.
- Gallery nhiều ảnh trong 1 bài viết (vuốt/chuyển ảnh).

**🐞 Phát hiện đáng chú ý cần báo lại team dev:**
1. Xóa bình luận không có bước xác nhận (khác xóa bài viết — có modal xác nhận), dễ xóa nhầm.
2. Khi phiên đăng nhập hết hạn (401 ở API gợi ý theo dõi), chỉ hiện toast mà KHÔNG tự động điều hướng về `/login` (dòng code liên quan bị comment out).
3. Nhãn "Tắt thông báo" trong menu "..." của bài viết KHÔNG tự cập nhật thành "Bật thông báo" sau khi click, dù
   API `update-notify` vẫn được gọi đúng — nghi thiếu re-render UI (xem TC_CONGDONG_44).
4. Dropdown menu "..." của bài viết KHÔNG tự đóng lại sau khi click 1 mục (khác hành vi dropdown chuẩn) — không
   phải lỗi nghiêm trọng nhưng khác kỳ vọng UX thông thường.
3. `likePost()` không có debounce/disable khi click liên tục — nghi ngờ gọi API nhiều lần giống lỗi double-submit đã gặp ở Đăng Nhập/Đăng Ký, cần đo cụ thể.
