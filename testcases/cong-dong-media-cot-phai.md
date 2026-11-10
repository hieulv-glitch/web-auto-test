# Màn hình: Cộng đồng — Video nhúng / ảnh trong bài + Cột phải mới

- **URL:** `/cong-dong/moi-nhat` (cùng component cho các tab Cộng đồng — `TabCommunity/community.vue`, layout `CommunityLayout`).
- **Tính năng mới trên `preprod`:**
  - `thanh/community-media` (merge 26/10/2026): `TabCommunity/components/VideoEmbed.vue` (link YouTube / Shorts / TikTok /
    Facebook / Instagram / Vimeo phát ngay trong bài — poster trước, bấm mới tải player; tự dừng khi cuộn khỏi màn hoặc ẩn
    tab), `components/PreviewPost.vue` (thẻ xem trước link qua `/api/stocks/community/link-preview`), `gridImage.vue`
    (ảnh không cắt: mỗi ảnh một slide trên nền mờ của chính nó, khung theo tỉ lệ ảnh đầu — cao nhất 4:5, nhiều ảnh có bộ
    đếm + nút ‹ ›, bấm ảnh xem lớn).
  - Cột phải `src/views/homepage/communityRail/` (làm lại 20–21/10/2026): Thị trường hôm nay, Watchlist của bạn, Danh mục
    của bạn, Sự kiện 30 ngày tới, Mã được nhắc nhiều hôm nay; biểu đồ nhỏ `src/components/MiniPriceChart.vue`. Dữ liệu
    gom ở `railData.js` (HTTP + socket `getlive` / `getintradayohlc`).
- **Domain test:** https://kfsp.vn (production = preprod mới nhất, đo ngày 10/11/2026). Spec
  `tests/cong-dong-media-cot-phai.spec.ts`, Page Object `pages/CommunityMediaPage.ts`. Viewport 1600×900.
- **Quan hệ với bộ cũ:** [cong-dong.md](cong-dong.md) (đăng bài, thích, bình luận, tab…) không đụng tới; bộ này chỉ phủ
  phần media trong bài và cột phải mới.
- **Nguồn:** tính năng chỉ web có → toàn bộ là 🆕.

**⚠️ An toàn dữ liệu:** kfsp.vn gọi backend production. Dòng tin (`get-post-by-page`), bài ghim, link-preview, toàn bộ dữ
liệu cột phải (chỉ số, watchlist, nhật ký giao dịch, sự kiện, tin AI, mã của người dùng) và giá socket là dữ liệu GIẢ dựng
trong test; ảnh/poster/player video là tài nguyên giả (không tải YouTube/TikTok thật). Mọi request không phải GET tới
`*.kfsp.vn` (trừ đăng nhập, socket.io) bị huỷ và test fail nếu có (`afterEach`) — không thể đăng/thích/bình luận thật.

| Trạng thái | Ý nghĩa |
|---|---|
| ✅ Áp dụng | Có tương ứng trong testcase app |
| 🆕 Testcase mới | Chỉ web có |
| ⚠️ Cần xác nhận thêm | Hành vi đo được cần dev/PO xác nhận |

---

## Nhóm: Ảnh trong bài

# [TC_CDMEDIA_01] Bài 1 ảnh ngang — khung theo tỉ lệ ảnh, ảnh không cắt

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Dòng tin có bài kèm 1 ảnh 800×400.

## Kết quả mong đợi
- [ ] Đúng 1 slide; không có bộ đếm, không có nút ‹ ›.
- [ ] Khung slide `aspect-ratio` 2 (= tỉ lệ ảnh); ảnh nằm trọn trong khung; nền mờ (`.lb-slide-blur`) dùng chính ảnh đó.

---

# [TC_CDMEDIA_02] Ảnh dọc cao hơn 4:5 — khung chặn ở 4:5

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bài kèm 1 ảnh 400×1000.

## Kết quả mong đợi
- [ ] Khung `aspect-ratio` 0,8 (4:5), không cao theo ảnh.
- [ ] Ảnh vẽ kiểu `object-fit: contain` (không cắt), hai bên lộ nền mờ.

---

# [TC_CDMEDIA_03] Nhiều ảnh — bộ đếm, nút ‹ ›; có ảnh thì không nhúng video

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bài kèm 3 ảnh (ảnh đầu 16:9) và trong nội dung có link YouTube.
2. Bấm ›, ›, rồi ‹.

## Kết quả mong đợi
- [ ] Carousel có class `lb-multi`, khung theo tỉ lệ ảnh đầu (16:9); bộ đếm "1/3", chỉ có nút ›.
- [ ] Bấm › → "2/3", hiện cả ‹; bấm › → "3/3", ẩn ›; bấm ‹ → "2/3".
- [ ] Không có khung video lẫn thẻ xem trước link (bài có ảnh thì bỏ qua link).

---

# [TC_CDMEDIA_04] Bấm ảnh — xem lớn, chuyển vòng, đóng

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm ảnh đầu của bài 3 ảnh. Nhấn →, ←, ←. Nhấn Esc.
2. Mở lại, bấm nút ×.

## Kết quả mong đợi
- [ ] Mở lớp xem lớn đúng ảnh 1; → sang ảnh 2; ← ← vòng về ảnh 3 (ảnh cuối).
- [ ] Esc đóng; nút × đóng.

---

## Nhóm: Video nhúng trong bài

# [TC_CDMEDIA_05] Link YouTube — poster, nút phát, nhãn, tiêu đề; chưa tải player

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bài không có ảnh, nội dung chứa link `youtube.com/watch?v=…&t=1m30s`; link-preview trả tiêu đề "Video YT giả".

## Kết quả mong đợi
- [ ] Khung video ngang, poster `i.ytimg.com/vi/<id>/maxresdefault.jpg`, nút "Phát video YouTube", nhãn "YouTube".
- [ ] Dòng dưới: tiêu đề từ link-preview + link "Xem trên YouTube" (`href` = link gốc, `target="_blank"`).
- [ ] Chưa có iframe player nào được tải; web có gọi link-preview cho đúng link video.

---

# [TC_CDMEDIA_06] Bấm phát YouTube — player tự phát đúng giây; "Tải lại video"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm "Phát video YouTube". 2. Bấm "Tải lại video".

## Kết quả mong đợi
- [ ] Poster biến mất; iframe `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&playsinline=1&enablejsapi=1&start=90`
  (t=1m30s → 90 giây), `title` = tiêu đề link-preview.
- [ ] "Tải lại video" tải lại khung player (thêm 1 lượt tải), vẫn còn đúng 1 iframe.

---

# [TC_CDMEDIA_07] YouTube không có ảnh maxres → poster hqdefault

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ảnh `maxresdefault.jpg` trả ảnh xám 120×90 (YouTube làm vậy khi video không có bản maxres).

## Kết quả mong đợi
- [ ] Poster tự chuyển sang `hqdefault.jpg`.

---

# [TC_CDMEDIA_08] YouTube Shorts — khung dọc, poster dọc

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bài có link `youtube.com/shorts/<id>`; bấm phát.

## Kết quả mong đợi
- [ ] Khung `ve-vertical`, poster `oar2.jpg`; player youtube-nocookie của đúng id, autoplay.

---

# [TC_CDMEDIA_09] TikTok — poster từ video_poster, player TikTok

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bài có link TikTok và `video_poster`; bấm phát.

## Kết quả mong đợi
- [ ] Khung dọc, poster = `video_poster`, nhãn "TikTok".
- [ ] iframe `https://www.tiktok.com/player/v1/<id>?autoplay=1&description=1&music_info=1&rel=0`.

---

# [TC_CDMEDIA_10] Facebook / Instagram / Vimeo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ba bài lần lượt có link video Facebook, reel Instagram, Vimeo (link-preview không trả ảnh); bấm phát từng bài.

## Kết quả mong đợi
- [ ] Nhãn + "Xem trên …" đúng nền tảng; khung không có poster hiện chữ tên nền tảng; Instagram khung dọc, 2 nền tảng
  còn lại khung ngang.
- [ ] Player: `facebook.com/plugins/video.php?href=<link mã hoá>&show_text=false&autoplay=1`,
  `instagram.com/reel/<id>/embed`, `player.vimeo.com/video/<id>?autoplay=1`.

---

# [TC_CDMEDIA_11] Link thường — thẻ xem trước

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bài có link bài báo; link-preview trả ảnh, tiêu đề, mô tả, tên trang. Bấm vào thẻ.

## Kết quả mong đợi
- [ ] Thẻ hiện ảnh, tiêu đề, mô tả, tên trang.
- [ ] Bấm → `window.open(link, "_blank")`.

---

# [TC_CDMEDIA_12] link-preview không có dữ liệu

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. link-preview trả `success: false` cho mọi link.

## Kết quả mong đợi
- [ ] Bài có link thường: không có thẻ xem trước, không khung video.
- [ ] Bài có link YouTube: vẫn nhúng video với poster của YouTube, không có dòng tiêu đề; không lỗi JS.

---

# [TC_CDMEDIA_13] TikTok đang phát cuộn khỏi màn → gỡ player; cuộn về → phát lại

- **Trạng thái:** 🆕 Testcase mới
- **Ghi chú:** player không nhận lệnh tạm dừng (TikTok/Facebook/Instagram) thì bị gỡ khung, cuộn về là gắn lại và phát từ đầu.

## Các bước thực hiện
1. Phát video TikTok. 2. Cuộn xuống tới hết dòng tin. 3. Cuộn lại tới bài.

## Kết quả mong đợi
- [ ] Bước 2: không còn iframe, poster quay lại. Bước 3: iframe được gắn lại.

---

# [TC_CDMEDIA_14] YouTube đang phát cuộn khỏi màn → gửi pauseVideo, cuộn về → playVideo

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Phát video YouTube. 2. Cuộn khỏi màn. 3. Cuộn lại.

## Kết quả mong đợi
- [ ] Bước 2: player nhận lệnh `pauseVideo` (postMessage), khung player vẫn giữ (giữ vị trí đang xem).
- [ ] Bước 3: player nhận lệnh `playVideo`.

---

## Nhóm: Cột phải

# [TC_CDMEDIA_15] Đủ 5 thẻ theo thứ tự; nhắc "Chỉ bạn xem được"

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Đăng nhập tài khoản trả phí (có watchlist, danh mục còn giữ mã), mở Cộng đồng ở màn 1600px.

## Kết quả mong đợi
- [ ] Cột phải theo thứ tự: Thị trường hôm nay → Watchlist của bạn → Danh mục của bạn → Sự kiện 30 ngày tới → Mã được nhắc nhiều hôm nay.
- [ ] Thẻ Watchlist và Danh mục có dòng "Chỉ bạn xem được"; thẻ Thị trường không có.

---

# [TC_CDMEDIA_16] Thị trường hôm nay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chỉ số giả: VNINDEX 1735.41 (+21.09, +1.23%), HNXINDEX (−1.70, −0.66%), UPCOMINDEX đứng giá; chỉ VNINDEX có giá từng phút.

## Kết quả mong đợi
- [ ] 3 dòng VN-Index/HOSE, HNX-Index/HNX, UPCoM-Index/UPCoM; điểm "1,735.41", thay đổi "+21.09 (+1.23%)", "-1.70 (-0.66%)".
- [ ] Màu: tăng / giảm / tham chiếu đúng dấu.
- [ ] VN-Index có biểu đồ nhỏ; UPCoM không có dữ liệu phút → khung biểu đồ trống.

---

# [TC_CDMEDIA_17] Watchlist của bạn — tóm tắt, 5 dòng, chọn watchlist

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. 2 watchlist (6 mã + 2 mã, trùng FPT → 7 mã khác nhau; 3 tăng, 2 đứng, 2 giảm). Bấm "Xem cả 7 mã", "Thu gọn".
2. Chọn watchlist "WL Hai" ở ô chọn.

## Kết quả mong đợi
- [ ] "Tổng 7 mã", "3 tăng 2 đứng 2 giảm", thanh tỉ lệ phần tăng ≈ 42,86%; 5 dòng; giá FPT "121.00", "+1.00 (+0.83%)".
- [ ] "Xem cả 7 mã" → 7 dòng; "Thu gọn" → 5 dòng. Tiêu đề là link `/watchlist`.
- [ ] Chọn "WL Hai" → "Tổng 2 mã", 2 dòng.

---

# [TC_CDMEDIA_18] Bấm mã ở cột phải → lọc dòng tin theo mã

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Bấm VNM ở thẻ Watchlist; bấm HPG ở thẻ Mã được nhắc nhiều.

## Kết quả mong đợi
- [ ] URL lần lượt `/cong-dong?ma=VNM`, `/cong-dong?ma=HPG`.

---

# [TC_CDMEDIA_19] Không có watchlist

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. API watchlist trả rỗng.

## Kết quả mong đợi
- [ ] "Thêm mã bạn quan tâm để xem bài viết về mã đó." + link "Tạo watchlist" (`/watchlist`); không có ô chọn watchlist.

---

# [TC_CDMEDIA_20] Danh mục của bạn — lãi/lỗ chưa thực hiện theo nhật ký

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Nhật ký giả: DM Chính mua FPT 1.000@100 + 1.000@120 (giá TB 110), mua rồi bán hết VNM; DM Phụ mua HPG 500@30; DM Đã
   bán mua rồi bán hết MBB. Giá hiện tại FPT 121, HPG 27.
2. Bấm mở rồi gập DM Chính.

## Kết quả mong đợi
- [ ] Chỉ 2 thanh danh mục (DM Đã bán bị bỏ), gập sẵn, mỗi thanh "1 mã"; tổng lãi/lỗ chưa thực hiện +8,72% (màu tăng);
  DM Phụ −10,00% (màu giảm).
- [ ] Mở DM Chính → dòng FPT (title "FPT - đang giữ 2,000 cổ phiếu", +10,00%, màu tăng); không có VNM. Gập lại → ẩn dòng.
- [ ] Tiêu đề là link `/nhat-ky-giao-dich`.

---

# [TC_CDMEDIA_21] 1 danh mục luôn mở; không danh mục nào còn mã → ẩn thẻ

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Chỉ còn DM Phụ (HPG): bấm thanh danh mục.
2. Trang khác: chỉ có DM Đã bán (đã bán hết).

## Kết quả mong đợi
- [ ] Bước 1: thanh luôn mở (`aria-expanded="true"`), bấm vẫn thấy HPG.
- [ ] Bước 2: không có thẻ "Danh mục của bạn"; các thẻ khác vẫn hiện.

---

# [TC_CDMEDIA_22] Sự kiện 30 ngày tới

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Mã của người dùng: FPT, VNM, HPG. Sự kiện giả: FPT 25/11 + 01/12, VNM 15/11, HPG 20/11, ACB 12/11 (không phải mã của
   người dùng). Bấm "Xem tất cả", "Thu gọn"; bấm dòng FPT; bấm "Đóng".

## Kết quả mong đợi
- [ ] 3 dòng sắp theo ngày: VNM 15/11, HPG 20/11, FPT 25/11; không có ACB. "Xem tất cả" → 4 dòng.
- [ ] Popup "Chi tiết sự kiện": tiêu đề, nội dung, link "Xem văn bản gốc" đúng file; "Đóng" đóng popup.

---

# [TC_CDMEDIA_23] Mã được nhắc nhiều hôm nay

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Tin AI hôm nay: FPT 3 tin, VNM 2, HPG/MBB/SSI/TCB mỗi mã 1, một tin gắn 6 mã.

## Kết quả mong đợi
- [ ] Top 5 theo số tin rồi theo mã: FPT, VNM, HPG, MBB, SSI; "3 bài viết" ở FPT kèm giá "121.00"; tin gắn > 5 mã không tính.

---

# [TC_CDMEDIA_24] Biểu đồ nhỏ — mã chưa khớp lệnh

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Ở thẻ Watchlist: TCB khối lượng khớp 0, không có giá phút; FPT có giá phút.

## Kết quả mong đợi
- [ ] TCB: chỉ vẽ đường tham chiếu, không có đường giá. FPT: có đường giá + đường tham chiếu.

---

# [TC_CDMEDIA_25] 🐞 Free vào thẳng Cộng đồng vẫn thấy "Sự kiện 30 ngày tới"

- **Trạng thái:** ⚠️ Cần xác nhận thêm (nghi bug)
- **Kết quả đo được:** thẻ ẩn theo `$store.state.isAccountFree` (UpcomingEvents.vue — chú thích code: "Dashboard khoá phần
  sự kiện với tài khoản miễn phí, ô này theo đúng quy định đó"), nhưng cờ chỉ được `TheContainer.getFeaturesDisabled()`
  bật; trang Cộng đồng dùng `CommunityLayout` không gọi → vào thẳng `/cong-dong` cờ vẫn `false`, Free thấy thẻ sự kiện.
  Đi từ Dashboard rồi bấm menu "Cộng đồng" thì thẻ bị ẩn đúng.

## Các bước thực hiện
1. Đăng nhập `FREE_USER_*`, mở thẳng `/cong-dong/moi-nhat`.
2. Mở `/dashboard`, bấm menu "Cộng đồng".

## Kết quả mong đợi
- [ ] (Theo thiết kế) cả 2 cách đều không có thẻ "Sự kiện 30 ngày tới".
- [ ] Đo được: bước 1 vẫn có thẻ (cờ Free = false); bước 2 không có thẻ, các thẻ khác vẫn hiện.

---

# [TC_CDMEDIA_26] Màn hẹp hơn 1200px — ẩn cột phải

- **Trạng thái:** 🆕 Testcase mới

## Các bước thực hiện
1. Cửa sổ rộng 1150px.

## Kết quả mong đợi
- [ ] Cột phải bị ẩn.

---

## Tổng hợp

| Trạng thái | Số lượng |
|---|---|
| ✅ Áp dụng | 0 |
| 🆕 Testcase mới | 25 |
| ⚠️ Cần xác nhận thêm | 1 (TC_25) |
| **Tổng** | **26** |

Kết quả chạy 10/11/2026 trên kfsp.vn: 26/26 pass, không có `test.fixme`.

## Phát hiện đáng chú ý

1. **🐞 TC_CDMEDIA_25 — Free vào thẳng Cộng đồng thấy thẻ sự kiện bị khoá ở Dashboard:** cờ `isAccountFree` chỉ được
   layout app (`TheContainer`) tính; `CommunityLayout` không tính → hành vi phụ thuộc người dùng vào trang từ đâu.
2. Video không phát sẵn: chỉ tải player (≈1 MB script) khi bấm phát — đúng chủ ý, đã kiểm (TC_05).
3. Link-preview được gọi cho cả bài có link video (để lấy tiêu đề/ảnh dự phòng) — một request cho mỗi bài có link khi
   tải dòng tin.
