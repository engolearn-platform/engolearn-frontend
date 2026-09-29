# Note — Chưa chốt URL route màn "Topic Item: 1. Bối cảnh & Hội thoại mẫu"

> Trạng thái: **Phase 2 TẠM DỪNG trước Bước 5** — riêng phần URL route chưa quyết định.
> Ngày ghi: 2026-09-21.
> Liên quan: triển khai Stitch screen `Web — Topic Item: 1. Bối cảnh (Context) & Hội thoại mẫu`
> (`projects/7356093395065438561/screens/64d98e9bc4db4c5cba31b0e772be6c03`).
> Feature home đã chốt: `src/features/topic/` — components mới dưới `components/learning/`,
> view mới dưới `views/learning/`.

## 1. Vì sao URL chưa chốt được

- Route đề xuất trong plan Phase 1 là `/topics/:topicId/context` (standalone, không bọc
  `LearningLayout`/`FullLayout`), nhưng user chưa quyết phương án cuối.
- URL này còn kéo theo các màn Topic Item sau này trong cùng luồng học, nên cần một
  scheme nhất quán ngay từ đầu:
  - `Web — Topic Item: 2. Từ vựng (1/3 - wake up)`
  - `Web — Topic Item: 3. Từ vựng (3/3 - get dressed)`
  - `Web — Topic Item: 4. Mẫu câu giao tiếp (Useful Expressions)`
  - Các màn `Web — Luyện tập (Quiz)` / Sentence Builder / Fill-in-the-Blank.

## 2. Các phương án đang cân nhắc

| # | URL đề xuất | Ưu | Nhược |
|---|-------------|----|-------|
| A | `/topics/:topicId/context` | RESTful, nằm cùng namespace `/topics` sẵn có trong `ROUTES`; mở rộng tự nhiên (`.../vocabulary`, `.../expressions`, `.../quiz`) | Luồng học và trang browse topic dùng chung prefix — về lâu dài có thể muốn tách |
| B | `/learn/:topicId/context` | Tách bạch luồng học (learner flow) khỏi browse/quản lý topic | Thêm namespace mới, khác với mọi route hiện tại (`/topics`, `/grammar`, …) |
| C | `/topics/:topicId/stage-1` (đánh số giai đoạn) | Khớp nhãn "Giai đoạn 1/4" trên UI | Khó đọc, khó mở rộng khi thêm/xóa giai đoạn; không self-descriptive |

## 3. Những điểm bị chặn theo (chờ chốt URL mới làm được)

1. **Bước 5 Phase 2:** thêm hằng số vào `ROUTES` (`src/shared/constants/app.constants.ts`)
   + entry route trong `src/features/topic/routes.ts`.
2. **Điều hướng đi:** nút "Bắt đầu học từ vựng" (`ReadinessCta.onAction`) và nút "Tiếp tục"
   (`LearningFooterNav.onContinue`) trỏ tới màn Từ vựng — URL đích cũng chưa có.
   Tạm thời các handler này để `TODO`-free: nhận callback từ view, view quyết định khi có URL.

## 4. Đề xuất cách làm tiếp (không mất công làm lại)

- Làm trước **Bước 1–4 Phase 2** (types, hook + mock, 13 components, view) — không phụ thuộc URL.
- **Bước 5** chờ chốt URL rồi đăng ký route một lần; URL chỉ nằm trong 1 hằng số `ROUTES`
  nên đổi sau cũng rẻ (không hardcode path trong view/components).
- Khi chốt, đồng thời chốt luôn URL đích cho CTA "Bắt đầu học từ vựng" / "Tiếp tục".

## 5. Checklist khi resume

- [ ] User chốt 1 trong 3 phương án mục 2 (hoặc đưa phương án mới).
- [ ] Cập nhật hằng số `ROUTES` + entry `TopicRoutes` theo URL đã chốt.
- [ ] Nối `onAction`/`onContinue` tới URL màn Từ vựng (nếu đã biết, nếu chưa thì giữ callback rỗng có log).
- [ ] Chạy `npm run lint` + `npm run build`, rồi sang Phase 3.

## 6. URL tạm dùng để test (ghi ngày 2026-09-21, cập nhật: nest vào LearningLayout)

- Đang dùng **phương án A**: `TOPIC_CONTEXT = "/topics/:topicId/context"`
  (`src/shared/constants/app.constants.ts`, có comment `TEMP`).
- Route là **child absolute của `/topics`** trong `TopicRoutes` → render trong
  `LearningLayout`, test tại `http://localhost:3000/topics/morning-routine/context`.
- Để vừa app shell: `ContextTopBar` dùng `sticky top-0`, `LearningFooterNav` dùng
  `sticky bottom-20 md:bottom-0` (mobile nhô lên 80px để né `LearningBottomNav`);
  view bỏ padding bù `pt-20`/`pb-24`.
- Đánh đổi đã chấp nhận: mobile hiện thêm `LearningTopBar` "Xin chào User" của shell
  (lệch Stitch); muốn hết phải sửa `LearningLayout` — chưa làm.
- Điều hướng tạm: "Quay lại" → `navigate(-1)`; "Thoát" (X), "Bỏ qua", "Tiếp tục",
  "Bắt đầu học từ vựng" → về `/topics` (đích màn Từ vựng chưa có).
- Nút audio (phát toàn bộ / từng dòng) là stub có comment, chờ audio API thật.
- Khi chốt URL cuối: đổi 1 hằng số `ROUTES.TOPIC_CONTEXT` + mục đích các nút trên,
  xóa comment `TEMP` và mục này.
