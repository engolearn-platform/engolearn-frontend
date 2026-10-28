# Learner docs — Học theo chủ đề

## Catalog và chi tiết (chặng2)

- /topics: Khám phá các topic chưa từng bắt đầu; query q/level/sort.
- /my-topics: Đang học / Đã hoàn thành; query tab.
- /topics/:topicId: outline + quyền thao tác + progress. Quay lại giữ nguồn/bộ lọc.
- /topics/:topicId/attempts/:attemptId: điểm vào lượt thật, không dùng provider/mock cũ. Context/Vocab/Expressions đã nối BE; consumer quiz lát A đã triển khai nhưng endpoint quiz thật còn404. Result/review/retry đầy đủ ở B/C.

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
| 10-completion-implementation-plan.md | Kế hoạch A/B/C | A consumer đã triển khai; B/C chưa làm |
| 11-quiz-slice-a.md | Quiz UI, answer journal, frontier/hidden | FE triển khai; BE quiz còn404, chưa nghiệm thu |

## Luồng legacy còn tồn tại

Các route .../context, .../vocab/:vocabId, .../expressions và .../practice giữ nguyên để tránh sửa khung học trước checkpoint3.
Các action ở ba màn mới không dẫn vào chúng. Khung mới đã dùng header progress, dropdown nav lồng cấp và nút quay về frontier theo thiết kế Từ vựng đã duyệt. Xem [08-attempt-learning.md](08-attempt-learning.md).
Reuse learning views cho review/retry ở chặng5, với đúng mode và version của attempt.

## Quy ước

Mỗi thay đổi cập nhật feature doc và bảng00 trong cùng commit.
Kiểm chứng: [verification](../../../handout/topic-learning/verification.md).
