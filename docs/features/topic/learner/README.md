# Learner docs — Học theo chủ đề

## Catalog và chi tiết (chặng2)

- /topics: Khám phá các topic chưa từng bắt đầu; query q/level/sort.
- /my-topics: Đang học / Đã hoàn thành; query tab.
- /topics/:topicId: outline + quyền thao tác + progress. Quay lại giữ nguồn/bộ lọc.
- /topics/:topicId/attempts/:attemptId: live lesson/quiz entry; completed attempts redirect to item result. Legacy completion recovery is an explicit action. See slice B below for current implementation and acceptance limits.
- /topics/:topicId/attempts/:attemptId/result and /topics/:topicId/result: server-owned item/topic scores and legal next actions. Review/retry lifecycle remains C.

## Package

| File | Nội dung | Trạng thái |
| --- | --- | --- |
| 00-mock-api-status.md | Bảng nguồn dữ liệu hiện tại | Cập nhật cùng code |
| 01-topic-detail.md | Chi tiết standalone, actions, sidebar progress | Client thật, BE chưa liên thông |
| 02-topic-context.md | Màn Context legacy | Giữ route cũ; entry mới dùng API theo 08 |
| 03-topic-vocab.md | Màn Vocab legacy | Giữ route cũ; entry mới dùng API theo 08 |
| 04-learning-progress.md | Provider tiến độ legacy | Vẫn mock; không áp dụng catalog/detail mới |
| 05-topic-expressions.md | Màn Expressions legacy | Giữ route cũ; entry mới dùng API theo 08 |
| 06-api-foundation.md | Contract + typed client | Chặng1 hoàn thành |
| 07-topic-catalog.md | Catalog/viewer/state/routes chặng2 | Hoàn thành chặng2 |
| 08-attempt-learning.md | Khung attempt, Context/Vocab/Expressions, advance | FE triển khai; BE integration chưa xác minh |
| 09-live-integration.md | Bằng chứng FE proxy → BE thật | Giới hạn theo từng lát đã chạy |
| 10-completion-implementation-plan.md | A/B/C plan and latest scoped exclusions | A/B/C consumers implemented within recorded scope |
| 11-quiz-slice-a.md | Quiz UI, answer journal, frontier/hidden | Implemented; early404 evidence is historical, remaining acceptance tracked with B |
| 12-completion-slice-b.md | Completion recovery, item/topic result and legal next actions | FE consumer implemented; live acceptance recorded separately |
| 14-review-retry-slice-c.md | Read-only review, confirmed retry and frozen session resume | FE implemented; focused parent live acceptance recorded |

## Luồng legacy còn tồn tại

Các route .../context, .../vocab/:vocabId, .../expressions và .../practice giữ nguyên để tránh sửa khung học trước checkpoint3.
Các action ở ba màn mới không dẫn vào chúng. Khung mới đã dùng header progress, dropdown nav lồng cấp và nút quay về frontier theo thiết kế Từ vựng đã duyệt. Xem [08-attempt-learning.md](08-attempt-learning.md).
Reuse learning views cho review/retry ở chặng5, với đúng mode và version của attempt.

## Quy ước

Mỗi thay đổi cập nhật feature doc và bảng00 trong cùng commit.
Kiểm chứng: [verification](../../../handout/topic-learning/verification.md).
