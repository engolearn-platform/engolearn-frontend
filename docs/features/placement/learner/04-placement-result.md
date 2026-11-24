# 04 — Kết quả đánh giá đầu vào (P04-USER-RESULT)

> Khung triển khai P04 đã duyệt. Chỉ dành cho User có quyền xem kết quả hợp lệ.

## 1. Business source

- `placement-test/00-module.md`: kết quả nằm trong Attempt, không có result ID riêng; BR-PLT-M.1/M.3.
- `f02-placement-result/rules.md`: BR-F2.1–F2.10.
- `PLT-UC-003_xem_ket_qua_placement.md`: score /20, level, Bắt đầu học, review.
- `PLT-UC-004_nhan_ket_qua_guest_sau_xac_thuc.md`: Guest chỉ xem sau auto-claim; tài khoản có kết quả giữ kết quả cũ.
- `PLT-UC-005_xem_lai_chi_tiet_bai_lam_placement.md`: chi tiết đáp án thuộc P05, không thuộc P04.

## 2. Stitch source

`projects/16234151544679864766/screens/10112586182078872640` là nguồn chính:
13/20, B1, 65%, 13 đúng/5 sai/2 bỏ trống; card score và trình độ đề xuất,
copy khởi đầu học, CTA Bắt đầu học / Xem chi tiết bài làm. Dashboard có tên
Hoàng chỉ là hình minh họa, không được giả lập profile.

Biến thể `screens/1208609029272268651` giữ cùng result nhưng bổ sung các ô
edge-case; copy “45 phút” trong ô auto-submit sai business (thời gian 15 phút).

## 3. Route

`/placement/attempts/:attemptId/result`. Deep-link tải qua attemptId, không
dựa vào router state và không invent resultId.

## 4. Result contract

Type riêng: `attemptId`, `status` (`SUBMITTED`/`AUTO_SUBMITTED`), `score`,
`totalQuestions`, `placementLevel`, `completedAt`, tùy chọn `summary` gồm
`incorrectCount` và `unansweredCount`. Score là số đúng; không tính level tại
View. Summary thiếu thì ẩn toàn bộ hàng tổng quan. Không có Reading/Listening
breakdown hoặc chi tiết review.

## 5. Security boundary

Backend xác thực, xác minh quyền sở hữu và claim; service chỉ trả kết quả khi
được phép. Không fallback mock hoặc sinh result từ P02/P03 cache. Guest chưa
claim (401), khác owner (404), EXPIRED không có result.

## 6. Component map

`PlacementResultLayout` (Auth loading → User `PlacementUserLayout`/neutral error shell)
→ `PlacementResultView` → `PlacementResultCard` (score/level, summary tùy chọn,
copy gợi ý trung tính, CTA). User shell dùng sidebar Placement active và
email/avatar initial thật theo Stitch `P04-USER-RESULT`. Dùng Button hiện có, các token
design system; một H1, score có nhãn đọc được, level có nhãn chữ.

## 7. Service / HTTP mapping

`getPlacementResult(attemptId, signal)` → GET
`/api/v1/placement/attempts/{attemptId}/result`, bóc `{ data }`, truyền
AbortSignal qua shared `httpService` cùng origin (cookie Auth + xử lý refresh).
Chỉ khi shared AuthContext xác nhận role USER thì P04 mới fetch.
Score, level, summary và completedAt do BE trả;
không tính lại. Fixture cũ còn trong source nhưng không được service gọi.

## 8. P03 → P04

Sau Login/Register, P03 nhận `ALREADY_CLAIMED`/`USER_HAS_RESULT` và điều hướng bằng
`resultAttemptId` do BE cấp. Với USER_HAS_RESULT đó là attempt của kết quả cũ,
tuyệt đối không dùng Guest Attempt ID để suy đoán.

## 9. P04 → P05

“Xem chi tiết bài làm” đã bật: Link đến
`/placement/attempts/:attemptId/review` theo `result.attemptId`.
P05 tự tải review; P04 không chứa dữ liệu đáp án.

## 10. CTA Bắt đầu học

Hiển thị đúng business/Stitch nhưng disabled + `title="Sắp ra mắt"` đến khi
chức năng học có contract nhận `placementLevel`. Không link `/topics` hay tạo
route/query mới.

## 11. Responsive

Mobile margin 20px; score và level xếp một cột, từ `sm` hai cột; card và
score không overflow. Sidebar 240px desktop `lg+`, nhỏ hơn dùng menu; header
không giả profile, không tạo search/notifications không hoạt động.

## 12. Technical debt

BE sample/in-memory: restart BE mất Attempt; production Auth chưa nối. Summary
BE trả có sai/bỏ trống; chỉ render khi nhận `summary`. Phần trăm hiển thị là tỷ
lệ trình bày từ score/20, không chấm điểm.

## 13. Backend integration checklist

- [x] Thay mock bằng API trả kết quả đã kiểm quyền, map response vào Result type.
- [x] Nối P03 dispatcher đến đúng `resultAttemptId` sau auto-claim.
- [ ] Nối CTA học khi có contract dùng `placementLevel`.
- [x] Đấu API review thật; CTA P04 → P05 dùng `result.attemptId`.
- [ ] Giữ không có result/review cho EXPIRED và Guest chưa claim.

## Placement User shell sync — 2026-11-08

Authenticated Placement entry/result/review now reuse the core LearningLayout (shared sidebar, top bar, compact preference and mobile drawer). PlacementUserLayout is a thin identityGeneration-keyed adapter; legacy PlacementUserSidebar/TopBar are not mounted. The shared practice menu includes a distinct Kiểm tra đầu vào link matching /placement and its descendants. This supersedes the earlier custom Placement sidebar/240px/lg-breakpoint descriptions. Existing periodic-assessment entry remains separate. Guest public navigation and standalone attempt timer/layout are unchanged.

## Start learning / profile level — 2026-11-08

Bắt đầu học posts to the owner-scoped learning command before navigating to /topics; busy/double-click guard and retryable error preserve the result screen on failure. Backend promotes only upward from the persisted owned result; no client-selected level. Shared Topic services read the profile normally. Guest results must be claimed first. Historical results synchronize through this explicit POST, not a read-only result GET.
