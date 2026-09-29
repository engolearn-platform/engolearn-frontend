# Learner — Bảng trạng thái mock ↔ API

> Một bảng duy nhất để biết package learner còn bao nhiêu việc khi backend
> xong. Cập nhật bảng này (và doc tương ứng) mỗi khi đấu nối API thật.
> Legend: ✅ thật · 🟡 mock · ⬜ chưa có màn.

| Màn (doc) | Dữ liệu nội dung | Audio/TTS | Progress | Ghi chú |
|-----------|------------------|-----------|----------|---------|
| Detail (`01`) | 🟡 `useTopicDetail` mock 5 units | — (không có audio) | 🟡 `progressPercent`/`stats` mock | CTA `onStartUnit` bỏ qua `unitId`, luôn vào context |
| Context (`02`) | 🟡 `useTopicContext` mock | 🟡 handlers noop | ⬜ chưa báo CONTEXT (chờ chốt rule) | `getFirstVocabId()` đọc mock `VOCAB_ORDER` |
| Vocab (`03`) | 🟡 `useTopicVocab` mock 3 từ (ảnh 2 từ phụ là picsum) | 🟡 simulation 900ms | 🟡 PATCH mock (log console) | Cuối list về `/topics` tạm, chờ Expressions |
| Progress (`04`) | — | — | 🟡 GET initial mock + PATCH mock | Forward-only đã verify Playwright |
| Expressions (SENTENCES) | ⬜ | ⬜ | ⬜ làm theo recipe `04` §6 | Chưa có màn |
| Practice (EXERCISES) | ⬜ | ⬜ | ⬜ làm theo recipe `04` §6 | Chưa có màn |

## Thứ tự đấu nối đề xuất (khi có backend)

1. GET nội dung 3 màn hiện có (giữ khung `Loading`/`EmptyState` đã có sẵn).
2. GET initial progress + PATCH thật (`04` §6.6 — chỉ sửa 2 file, views giữ nguyên).
3. TTS cho Context dialogue + Vocab (thay ruột handler, giữ props).
4. Màn Expressions + Practice mới theo recipe `04` §6.
