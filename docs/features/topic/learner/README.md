# Learner docs — Luồng học của người học

> Package tài liệu cho các màn **learner** (người học) của Topic.
> Đối tác admin (soạn nội dung): `docs/features/admin/01–04`.
> Trạng thái mock ↔ API tập trung: `00-mock-api-status.md`.

## Luồng học & route

```text
/topics                        TopicPage (danh sách chủ đề)
  │ back / chọn chủ đề
  ▼
/topics/:topicId               01-topic-detail.md — Chi tiết chủ đề
  │ "Tiếp tục học" (sidebar + từng unit)
  ▼
/topics/:topicId/context       02-topic-context.md — Bối cảnh & Hội thoại (CONTEXT)
  │ CTA "Bắt đầu học từ vựng" / footer Tiếp tục / sidebar vocab
  ▼
/topics/:topicId/vocab/:vocabId  03-topic-vocab.md — Từ vựng (VOCAB, paging theo vocabOrder)
  │ hết list → tạm về /topics (sẽ sang Expressions)
  ▼
(phần mẫu câu — SENTENCES, chưa có màn)
/topics/:topicId/expressions    (planned)
  ▼
(phần luyện tập — EXERCISES, chưa có màn)
/topics/:topicId/practice       (planned)
```

Tracking tiến trình xuyên suốt mọi chặng: `04-learning-progress.md`
(`furthest_reached`, PATCH mock, rule hoàn thành, sidebar states).

## Danh sách docs

| # | File | Màn / Route | Trạng thái code |
|---|------|-------------|-----------------|
| 00 | `00-mock-api-status.md` | Bảng mock ↔ API toàn package | — |
| 01 | `01-topic-detail.md` | Chi tiết chủ đề — `/topics/:topicId` | Đã implement (mock) |
| 02 | `02-topic-context.md` | Bối cảnh & hội thoại — `.../context` | Đã implement (mock, audio noop) |
| 03 | `03-topic-vocab.md` | Từ vựng — `.../vocab/:vocabId` | Đã implement (mock, audio simulation) |
| 04 | `04-learning-progress.md` | Contract progress dùng chung | Đã implement (mock PATCH) |

## Quy ước của package

- Mỗi doc theo khung: nguồn Stitch → route & trigger → bản đồ component →
  state → điểm UI-only → khác biệt vs Stitch → responsive → checklist refactor.
- Shell dùng chung (`ContextTopBar`, `LessonProgressCard`,
  `TopicStructureNav`, `MemoryTipCard`, `LearningFooterNav`) không có doc
  riêng — ghi trong mục reuse của từng doc.
- Sửa view learner nào thì cập nhật doc tương ứng + bảng `00` (rule trong
  `AGENTS.md`).
