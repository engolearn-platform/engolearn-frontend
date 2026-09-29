# Learner — Tracking tiến trình học (Learning Progress)

> Tài liệu workflow + contract cho tracking tiến trình learner
> (`furthest_reached`, PATCH progress) dùng chung mọi màn learner.
> **Màn part mới (mẫu câu, quiz, …) chỉ cần làm theo §6 là tương thích.**

## 1. Data model (mirror backend)

Backend `TopicItemPart`: `CONTEXT | VOCAB | SENTENCES | EXERCISES`.
Document progress (FE chỉ dùng subset):

```json
{
  "topic_item_id": "ObjectId",
  "topic_item_version": 3,
  "is_outdated": false,
  "status": "IN_PROGRESS",
  "furthest_reached": { "stage": "VOCAB", "item_index": 2 }
}
```

Nguyên tắc: **chỉ tiến, không lùi** — PATCH `{ "part", "item_index" }` cập
nhật mốc mới nhất; mọi nội dung trước mốc luôn mở khóa.

## 2. Bản đồ module

| ID | Module | File | Ghi chú |
|----|--------|------|---------|
| T0 | types | `types/topic-progress.types.ts` | `TopicItemPart` (union string, không enum — `verbatimModuleSyntax`), `TopicProgressStatus`, `FurthestReached`, `TopicProgress`, `UpdateProgressPayload`, `PART_ORDER` (thứ tự chuẩn), `STAGE_TO_PART` (sidebar id → part: context→CONTEXT, vocab→VOCAB, expressions→SENTENCES, practice→EXERCISES), `isAhead` (so strictly-ahead), `isUnlocked` (at-or-behind). |
| S0 | `updateTopicProgress` | `services/topic-progress.service.ts` | **Mock** `PATCH /api/topic-items/:id/progress`: `console.info("[topic-progress] PATCH", {...})` + resolve progress mới. Khi API xong thay ruột bằng `httpService.patch` (giữ signature). |
| H1 | `useTopicProgress` | `hooks/useTopicProgress.ts` | State `progress` (mock khởi tạo `furthest {VOCAB, 1}`) + `reportProgress(part, itemIndex): Promise<boolean>` — check `isAhead` qua `progressRef` (StrictMode-safe), advance + gọi S0, trả `true` khi advance. Export `{ progress, furthest, saving, reportProgress }`. |
| C0 | quiz notify | `VocabQuickCheckCard onCorrectAnswer?` | Pattern chuẩn cho interaction "điều kiện hoàn thành": component con gọi callback khi user làm đúng (optional prop, không vỡ callsite cũ). Màn part mới có quiz riêng thì copy pattern này. |
| V0 | completion wiring | `TopicVocabView.tsx` (mẫu tham chiếu) | Sentinel `div.h-px` cuối nội dung + `IntersectionObserver(threshold 0.5)` → `reachedEnd`; `answeredCorrectly` từ C0; effect khi cả hai đủ + `reportedRef !== data.id` → `reportProgress("VOCAB", currentIndex)` 1 lần. Reset `answeredCorrectly/reachedEnd/reportedRef` khi đổi item. **Lưu ý đã fix:** effect observer phải dep theo `data.id` (chạy lúc loading thì sentinel chưa mount). |

## 3. Sidebar states (display-only, không chặn điều hướng)

`TopicStructureState` = `"active" | "locked" | "done" | "available"`:

| State | Icon | Badge | Khi nào |
|-------|------|-------|---------|
| `done` | `CheckCircle2` primary | "Hoàn tất" (text primary) | part trước `furthest` |
| `active` | `CircleDot` primary | "Đang học" (`bg-primary-fixed/40`) | part == `furthest` |
| `available` | `Circle` primary | "Bắt đầu" (`bg-primary/10`) | stage kế tiếp đã mở (VD: vocab ở Context view) |
| `locked` | `Lock` outline | "Chưa mở" | part sau `future` — `disabled`, không `onNavigate` |

`TopicStructureNav` nhận thêm `onNavigate?(id)` (non-breaking — Context view
là nơi đầu tiên truyền). Derive states từ `furthest` bằng
`PART_ORDER` + `STAGE_TO_PART` (mẫu trong Vocab view).

## 4. Hành vi đã verify (Playwright, console thật)

- Vocab ahead (`get-dressed` idx 2 > furthest 1) + đúng quiz + scroll cuối →
  `PATCH {topicItemId, part: VOCAB, item_index: 2}` ✅
- Vocab behind (`wake-up` idx 0) + đúng + scroll → **không** PATCH ✅
- Scroll cuối nhưng chưa trả lời đúng → **không** PATCH ✅

## 5. Các điểm mock (cần gắn thật khi refactor)

1. **Initial progress:** `MOCK_PROGRESS` trong H1 → GET progress theo
   `topicItemId` (qua `useFetch`).
2. **PATCH:** S0 đang log + resolve local → `httpService.patch` endpoint thật.
3. **Hoàn thành CONTEXT:** hiện Context view chưa báo progress (chưa có định
   nghĩa xong cho part này) — khi chốt rule (VD: scroll cuối dialogue) thì
   `reportProgress("CONTEXT", 0)` theo recipe §6.
4. **Gating:** đang display-only theo quyết định hiện tại; nếu sau này cần
   chặn thật thì dùng `isUnlocked` ở route guard + disable nav (hàm đã có sẵn).

## 6. Recipe cho màn part mới (SENTENCES / EXERCISES / …)

1. Thêm part vào `PART_ORDER` (nếu là part mới) + map sidebar id trong
   `STAGE_TO_PART`.
2. Trong view mới: `useTopicProgress(topicItemId)` → `furthest/reportProgress`.
3. Định nghĩa "xong" của part (chuẩn hiện tại: sentinel scroll-cuối **+**
   điều kiện đúng nội dung như quiz) → component con notify qua callback
   optional kiểu `onCorrectAnswer`.
4. Sentinel + effect fire-once theo mẫu V0 (`reportedRef` key theo item id,
   observer dep theo data, reset khi đổi item).
5. Sidebar: derive states từ `furthest` (§3), truyền `onNavigate` rẽ sang
   route part tương ứng.
6. Khi API xong: chỉ sửa H1 (GET initial) + S0 (PATCH thật) — mọi view giữ
   nguyên.

## 7. Checklist refactor (khi gắn dữ liệu thật)

- [ ] GET initial progress theo `topicItemId` (§5.1).
- [ ] PATCH thật trong S0, giữ signature (§5.2, §6.6).
- [ ] Chốt rule hoàn thành CONTEXT + gọi `reportProgress` (§5.3).
- [ ] Áp recipe §6 cho màn SENTENCES, EXERCISES mới.
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
