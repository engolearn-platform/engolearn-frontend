# Learner — Mẫu câu giao tiếp (Useful Expressions)

> Tài liệu workflow cho màn learner *Mẫu câu giao tiếp* (Stitch: "Web — Topic Item: 4. Mẫu câu giao tiếp (Useful Expressions)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, audio, progress).
> Trạng thái mock ↔ API toàn package: `00-mock-api-status.md`.

## 1. Nguồn thiết kế (Stitch)

- Project: `Remix of EngoLearn English Learning App` (`projects/7356093395065438561`).
- Screen: `projects/7356093395065438561/screens/96154c6ffa2247d1ac85da20ee6e626e` ("Web — Topic Item: 4. Mẫu câu giao tiếp", DESKTOP 2560×3060).
- HTML đã tải qua `webfetch` từ `htmlCode.downloadUrl` và đối chiếu đầy đủ (header, progress header, hero, 3 nhóm mẫu câu, readiness CTA, sidebar widgets, footer).
- Design tokens: EngoLearn Narrative – primary `#006565`, Hanken Grotesk, `rounded-2xl` cho Learning Card, `rounded-xl` cho Button, `rounded-full` cho pill/chip.

## 2. Route & trigger point

- Route: `/topics/:topicId/expressions` (`ROUTES.TOPIC_EXPRESSIONS` trong `src/shared/constants/app.constants.ts`), khai báo trong `src/features/topic/routes.ts` dưới `LearningLayout` (top-level absolute path).
- Trigger: CTA "Tiếp tục" ở Vocab view khi `nextVocabId === null` → `buildTopicExpressionsPath(topicId)`. Sidebar stage "Mẫu câu thực tế" cũng click được khi `state !== locked`.
- Back: `navigate(-1)`. Close/đóng/Skip: `/topics`. Continue (footer + lesson nav) + sidebar Practice → `ROUTES.TOPIC_PRACTICE` (`TopicPracticePlaceholderView`, EmptyState chờ UI Practice thật).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicExpressionsView` | `views/learning/TopicExpressionsView.tsx` | Container: `useParams(topicId)`, `useTopicExpressions` + `useTopicProgressContext` (shared provider — `setCurrentStage("SENTENCES")` khi mount), `Loading`/`EmptyState`, layout `max-w-[1240px]` (nội dung `lg:w-[840px]`, aside `lg:w-[320px] lg:sticky`), owns audio simulation (`playingId`, `playingSequence`), sentinel scroll-cuối → `reportProgress("SENTENCES", 0)` 1 lần, `goBack/goTopics/goVocab/goPractice/goStructure`. |
| C0 | `ContextTopBar` | `components/learning/ContextTopBar.tsx` (reuse) | Header sticky: back + title + phase pill + close + avatar. |
| C1 | `ExpressionsProgressHeader` | `components/learning/expressions/ExpressionsProgressHeader.tsx` (mới) | Card 124px: badges topic/CEFR + pill "Mẫu câu 3 nhóm" (`Sparkles`) + 3 step chips **display-only** (pure label, không state, không click). |
| C2 | `ExpressionsHeroCard` | `components/learning/expressions/ExpressionsHeroCard.tsx` (mới) | Hero section: stage tag (`primary/10` + dot) + badge "USEFUL EXPRESSIONS" (`secondary-fixed/50`) + H1 `headline-lg` + mô tả + meta line (CEFR / 3 nhóm / phản xạ / ~5 phút, icon primary, separator `•`). |
| C3 | `ExpressionGroupCard` | `components/learning/expressions/ExpressionGroupCard.tsx` (mới) | Group 1 & 2: header (số tròn `primary/10` + tiêu đề VI IN HOA + sub EN `hidden sm:inline` + pill) + `grid 1col → md:2 gap-4` render `ExpressionSentenceCard[]`. |
| C4 | `ExpressionSentenceCard` | `components/learning/expressions/ExpressionSentenceCard.tsx` (mới) | 1 mẫu câu: badge tình huống (suy từ `type`) + nút phát `Volume2` tròn (playing → `AudioLines animate-pulse`) + EN `headline-sm bold` (hover primary) + VI `text-sm text-on-surface-variant` + divider + dòng tip (`Lightbulb` secondary hoặc `ArrowLeftRight` primary cho SLOT_PATTERN). |
| C5 | `ExpressionSequenceGroup` | `components/learning/expressions/ExpressionSequenceGroup.tsx` (mới) | Group 3: header như C3 + câu liên kết dài (`sequenceExample`: EN bold + VI + nút phát riêng, **không bọc trong card con**) + 3 chip liên từ `connectingWords[]` (`grid 1col → md:3`, mỗi chip **layout ngang**: số `orderIndex` trong vòng tròn `bg-primary` bên trái + cụm `wordEn` bold / `wordVi` / `usageNote` bên phải, **không có nút phát riêng**). |
| C6 | `ExpressionReadinessCta` | `components/learning/expressions/ExpressionReadinessCta.tsx` (mới) | Card ngang: icon `HelpCircle` + title + mô tả + 2 pill ("5 câu hỏi" neutral, "+50 EXP" primary bold). |
| C7 | `ExpressionLessonNav` | `components/learning/expressions/ExpressionLessonNav.tsx` (mới) | Nav inline: prev link "Ôn lại từ vựng" (`ArrowLeft`) + next CTA primary "Chuyển sang Luyện tập (Quiz)" (`ArrowRight`). |
| S0 | `LessonProgressCard` | `components/learning/LessonProgressCard.tsx` (reuse) | Sidebar widget 1: percent 75% + note. |
| S1 | `TopicStructureNav` | `components/learning/TopicStructureNav.tsx` (reuse) | Sidebar widget 2: 4 stages, states qua `deriveSidebarStates` (`furthest` + `currentStage=SENTENCES`): context/vocab trước furthest → `done`, expressions (đang đứng) → `active`, practice sau furthest → `locked`. `onNavigate` rẽ sang route tương ứng. |
| S2 | `MemoryTipCard` | `components/learning/MemoryTipCard.tsx` (reuse) | Sidebar widget 3: tip duy nhất từ `tips` field. |
| S3 | `LearningFooterNav` | `components/learning/LearningFooterNav.tsx` (reuse) | Footer: back/skip/continue. |
| H1 | `useTopicExpressions` | `hooks/useTopicExpressions.ts` | Mock 3 purposes (ask-routine 2 examples, talk-routine 2 examples, sequence 0 examples + `sequenceExample` + 3 `connectingWords`). `buildTopicExpressionSteps()` trả `[{ id, label }]` (không state). `buildTopicExpressionsPath(topicId)`. |
| T0 | types | `types/topic-expressions.types.ts` | `ExpressionExampleType`, `ExpressionExample` (có `audioUrl`), `ConnectingWord` (không `audioUrl`), `SequenceExample` (có `audioUrl`), `ExpressionPurpose`, `ExpressionGroupStep` (chỉ `id` + `label`, không state), `ExpressionHeroMeta`, `TopicExpressions`. |

## 4. State hiện tại

- V0: `playingId` (string | null) cho câu mẫu, `playingSequence` (boolean) cho câu liên kết dài, timeout 900ms mô phỏng. `reachedEndRef` + `reportedRef` cho completion (sentinel scroll-cuối).
- C1 (ProgressHeader): **không có state** — chips pure display, chỉ render label nhóm, cùng style neutral.
- Sidebar: mock initial `furthest_reached: { stage: "SENTENCES", item_index: 0 }` → expressions `active`, context/vocab `done` (click được), practice `locked`.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong hook; khi có API: service + `useFetch`, nội dung từ backend.
2. **Audio:** simulation 900ms (`playingId`/`playingSequence`); khi có TTS: thay ruột handler, giữ nguyên props.
3. **Badge situation:** suy từ `type` (BASIC_SUGGESTION → "Gợi ý cơ bản", POLITE_INQUIRY → "Hỏi lịch sự", SLOT_PATTERN → "Mẫu thế chỗ").
4. **Connecting words:** `ConnectingWord` không có `audioUrl` (theo data model backend). Không có nút phát trên từng liên từ.
5. **Practice route:** chưa có → `goPractice` tạm về `/topics`.
6. **Progress mock:** initial `SENTENCES` dùng chung cho mọi view (mock phase). Khi API thật, GET theo `topicItemId`.

## 6. Khác biệt có chủ ý so với HTML Stitch

- Dùng `LearningLayout` thay header/footer `fixed` của Stitch; topbar/footer sticky trong layout.
- Card `rounded-2xl`, button `rounded-xl`, pill/chip `rounded-full`; icon toàn bộ `lucide-react` (không Material Symbols).
- Step chips trong ProgressHeader **không có state** (done/active/todo) — pure display label, giảm complexity. Khác Stitch (có icon check/dot theo state).
- `ExpressionSequenceGroup`: câu liên kết dài không bọc trong card con (Stitch cũng không bọc); 3 chip liên từ không có nút phát riêng ( ConnectingWord không có audio).
- Tip cuối Group 3 trong Stitch **bỏ** — chỉ 1 tip duy nhất ở sidebar (`MemoryTipCard`).
- `MemoryTipCard` map amber → `secondary-fixed/30` (đúng token).

## 7. Responsive

- Page `px-5 py-6`, `max-w-[1240px]`, `flex-col → lg:row gap-6`; aside `lg:sticky lg:top-20`.
- Hero `p-6 → md:p-8`, meta `flex-wrap`.
- Group cards `grid 1col → md:2`; sequence chips `grid 1col → md:3`.
- Phase pill trong topbar `hidden md:flex`; sub EN group header `hidden sm:inline`.

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1).
- [ ] Gắn TTS thật (§5.2).
- [ ] Trỏ `goPractice` sang route Practice khi có (§5.5).
- [ ] Thay mock PATCH bằng endpoint progress (xem `04-learning-progress.md`).
- [ ] GET initial progress theo `topicItemId` (§5.6).
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
