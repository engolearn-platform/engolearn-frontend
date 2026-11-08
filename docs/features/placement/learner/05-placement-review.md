# 05 — Xem chi tiết bài làm Placement (P05-USER-REVIEW)

> Review chỉ đọc cho User sở hữu Attempt hợp lệ. Route:
> `/placement/attempts/:attemptId/review`, shell `PlacementResultLayout` →
> `PlacementUserLayout` khi xác thực USER.

## 1. Business source

`placement-test/f02-placement-result/rules.md` (BR-F2.10–F2.13),
`PLT-UC-005_xem_lai_chi_tiet_bai_lam_placement.md` và UC-003/004.
Chỉ User đã xác thực, sở hữu Attempt `SUBMITTED`/`AUTO_SUBMITTED` (Guest đã
claim) mới có review. `IN_PROGRESS`/`EXPIRED` không có review. Không chấm lại.

## 2. Stitch source

Project `16234151544679864766`: frame đối chiếu
`6ce04a1306a54b21a91d62aa6e7fd045` (`P05-USER-REVIEW`), biến thể
`11042505145700021255`. H1 “Chi tiết bài làm”, strip
13/20 · B1 · 13 đúng · 5 sai · 2 bỏ trống; 3 câu/trang, grid 20 câu 3 cột,
prev/next, audio player, đúng/sai/bỏ trống và link về kết quả. Biến thể đặt
CTA “Về kết quả” ở sidebar thay legend. Dashboard tên Hoàng là dữ liệu mẫu.
Stitch gắn audio cho Câu 13–14 nhưng blueprint 1–14 Reading, 15–20 Listening:
MVP chỉ render audio ở Listening 15–20. Stitch có box giải thích, nhưng MVP
chủ động không triển khai explanation dù business hỗ trợ nếu có.

## 3. Route

`PLACEMENT_ROUTES.ATTEMPT_REVIEW` và `attemptReview(attemptId)`;
deep-link fetch bằng attemptId, không dùng router state/reviewId.

## 4. Review contract

`types/placement-review.types.ts` riêng P02: `attemptId`,
`status` (`SUBMITTED`/`AUTO_SUBMITTED`), `totalQuestions`, `score`,
`placementLevel`, `incorrectCount`, `unansweredCount`, `questions[]`.
Mỗi câu: `id`, `order`, `section`, `prompt`, `passage` cho Reading, bốn
`options[]`, `selectedOptionId` (`null` nếu bỏ trống), `correctOptionId`,
`audio` cho Listening.
Không có `explanation`, `transcript`, resultId hoặc metadata admin.

## 5. Security boundary

Backend phải xác thực User, kiểm ownership + Guest claim + Attempt status
trước khi trả review. Correct answer chỉ có trong P05 review payload,
không bao giờ thêm vào P02 `PlacementQuestion`/`PlacementAttemptDetail`.
Unknown/không có quyền → EmptyState; không fallback fixture.

## 6. Correct/Incorrect/Unanswered matrix

| Tình huống | Câu | Phương án |
|---|---|---|
| Chọn đúng | Đúng | Option đã chọn: “Bạn chọn · Đáp án đúng”; còn lại trung tính |
| Chọn sai | Sai | Option đã chọn: “Bạn đã chọn”; option đúng: “Đáp án đúng” |
| Bỏ trống | Chưa trả lời | Thông báo chưa trả lời; option đúng: “Đáp án đúng” |

Chỉ presentation-derive trạng thái từ `selectedOptionId`/`correctOptionId`;
không tính lại score, level hoặc aggregate service đã trả.

## 7. Pagination

3 câu **liên tiếp**/trang: 1–3, 4–6, 7–9, 10–12, 13–15, 16–18,
19–20. Trang 13–15 trộn Reading 13–14 và Listening 15. Không tái dùng
`buildPlacementPages()` P02 (hàm đó cố tình tách section). Grid 20 câu
3 cột chọn vị trí review, không sửa câu trả lời.

## 8. Component map

```text
PlacementResultLayout
└─ PlacementReviewView — breadcrumb/H1, loading/error, về kết quả
   ├─ PlacementReviewSummary — mini-strip dữ liệu service
   ├─ PlacementReviewQuestionCard × tối đa 3 — passage Reading, options read-only, audio Listening
   ├─ PlacementReviewPageNav — trang trước/tiếp + range
   └─ PlacementReviewQuestionGrid — 20 button + link Về kết quả + legend
```

## 9. Service / HTTP

`getPlacementReview(attemptId, signal)` → GET
`/api/v1/placement/attempts/{attemptId}/review`, bóc `{ data }`, truyền
AbortSignal qua shared `httpService` cùng origin (cookie Auth + xử lý refresh).
Chỉ khi shared AuthContext xác nhận role USER thì P05 mới fetch.
Score/level/selectedOptionId/correctOptionId và thứ tự 20 câu lấy từ BE.
Fixture cũ còn trong source nhưng service không gọi hoặc fallback.

## 10. Snapshot semantics

API thật lấy
`placement_attempts.answers[]` và snapshot Test Set Version đã cấp (kể cả
Version Archive); không đọc Question Bank hiện hành.

## 11. Listening audio

Chỉ câu 15–20 có audio, tái dùng `PlacementAudioPlayer` dạng trình bày
không phụ thuộc Attempt hook. Backend sample có `url: null` nên player hiện
tại mô phỏng playback (không có tệp audio thực). Không transcript.

## 12. P04 → P05

CTA “Xem chi tiết bài làm” trong P04 là Link tới
`attemptReview(result.attemptId)`. P05 tự fetch, không nhận review bằng state.
“Bắt đầu học” của P04 vẫn disabled chờ learning contract.

## 13. P05 → P04

“Về kết quả” là Link tới `attemptResult(attemptId)`, kể cả khi P05 mở bằng
deep-link; không phụ thuộc browser Back.

## 14. Responsive/accessibility

Một H1; mobile xếp card/summary/grid một cột, grid 3 cột không tràn;
desktop nội dung + grid sticky. Option dùng markup tĩnh, không radio.
Sidebar user desktop 240px, dưới `lg` menu; grid navigator xuống dưới câu hỏi
trên mobile/tablet. Grid button có label “Câu N — Đúng/Sai/Chưa trả lời”, câu đang xem có
`aria-current`; icon trang trí `aria-hidden`. Nhãn và border ngoài màu sắc;
audio button có aria-label. Nav/CTA là button/Link đúng ngữ nghĩa.

## 15. Backend integration checklist

- [x] Thay review fixture bằng API kiểm auth/ownership/claim/status.
- [x] Giữ 20 câu theo snapshot Version, kể cả khi Question Bank thay đổi.
- [x] Đọc audio URL từ snapshot (sample hiện null); production audio cần URL thật.
- [x] Không đưa correct answer/review fields vào API Attempt đang làm.
- [x] Nối Guest claim sau Login/Register đến đúng `resultAttemptId`.
