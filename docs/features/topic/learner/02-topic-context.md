# Learner — Bối cảnh & Hội thoại mẫu (Topic Context)

> Tài liệu workflow cho màn learner Bối cảnh của 1 Topic Item, stage đầu của
> luồng học (Stitch: "Web — Topic Item: 1. Bối cảnh (Context) & Hội thoại mẫu").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, audio).
> Trạng thái mock ↔ API toàn package: `00-mock-api-status.md`.

## 1. Nguồn thiết kế (Stitch)

- Project: `Remix of EngoLearn English Learning App`
  (`projects/7356093395065438561`).
- Screen: `projects/7356093395065438561/screens/64d98e9bc4db4c5cba31b0e772be6c03`
  ("Web — Topic Item: 1. Bối cảnh (Context) & Hội thoại mẫu",
  DESKTOP 2560×3374).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).

## 2. Route & trigger point

- Route: `/topics/:topicId/context` (`ROUTES.TOPIC_CONTEXT` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` dưới `LearningLayout` (top-level absolute
  path — không nest dưới `/topics` vì react-router từ chối).
- Trigger: nút "Tiếp tục học" ở `01-topic-detail.md`, sidebar stage "Ngữ cảnh
  & Hội thoại".
- Forward flow (đã nối): `ReadinessCta` ("Bắt đầu học từ vựng") + footer
  **Tiếp tục** + sidebar stage vocab → `/topics/:topicId/vocab/:firstVocabId`
  (`getFirstVocabId()` + `buildTopicVocabPath()` từ
  `hooks/useTopicVocab.ts`, xem `03-topic-vocab.md`). Back → `navigate(-1)`,
  Bỏ qua/đóng → `/topics`.

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicContextView` | `views/learning/TopicContextView.tsx` | Container: `useParams` lấy `topicId`, `useTopicContext`, `loading` → `Loading`, `error`/rỗng → `EmptyState`, layout `max-w-[1240px] flex-col → lg:row` (nội dung `lg:w-[840px]`, aside `lg:w-[320px] lg:sticky`), owns `goBack/goTopics/goVocab/goStructure`, audio handler noop. |
| C0 | `ContextTopBar` | `components/learning/ContextTopBar.tsx` | Header sticky trong-layout: back ("Quay lại Chủ đề"), title truncate, phase pill (`hidden md:flex`, dot `animate-pulse`), close + avatar (`User` trong `bg-primary rounded-full`). Reuse cho Vocab view. |
| C1 | `StageStatusCard` | `components/learning/StageStatusCard.tsx` | Card 124px: badges topic/CEFR + stage text + step chips (`active` → `bg-primary`, `todo` → `bg-surface-container-low`; icon `CheckCircle2`/`MessagesSquare`). |
| C2 | `ContextHeroCard` | `components/learning/ContextHeroCard.tsx` | Hero `rounded-xl` + blur deco (`primary-fixed/40`, `secondary-fixed/30`): stage tag (`Compass`), meta (`Sun`), eyebrow + H1 EN—VI, `C3` banner, grid narrative (span-7) + objectives (span-5). |
| C3 | `ContextBanner` / `ContextNarrative` | `components/learning/ContextBanner.tsx`, `ContextNarrative.tsx` | Banner ảnh + câu hỏi gợi mở; narrative + tip box. |
| C4 | `LessonObjectivesPanel` | `components/learning/LessonObjectivesPanel.tsx` | Panel mục tiêu buổi học (icon theo `LessonObjectiveIcon`: timer/mic/badge). |
| C5 | `DialogueSection` | `components/learning/DialogueSection.tsx` | Hội thoại mẫu: header (`Mic` + audio badge + nút "Phát toàn bộ" `CirclePlay`), list `C6`, props `onPlayAll/onPlayLine(id)`. |
| C6 | `DialogueBubble` | `components/learning/DialogueBubble.tsx` | 1 lượt thoại: speaker pill (learner → `bg-primary`, waiter → `bg-surface-container-highest`), nút `Volume2`, EN (`headline-sm`) + VI (`body-md`, EN > VI). |
| C7 | `ReadinessCta` | `components/learning/ReadinessCta.tsx` | CTA chuyển stage: icon `Brain`, title + mô tả + shadcn `Button` (`onAction={goVocab}`). |
| S0 | `LessonProgressCard` / `TopicStructureNav` / `MemoryTipCard` / `LearningFooterNav` | `components/learning/*` (reuse) | Sidebar + footer dùng chung mọi màn learner (xem `04-learning-progress.md` §3 về sidebar states). Context view là nơi đầu tiên truyền `onNavigate` cho sidebar. |
| H1 | `useTopicContext` | `hooks/useTopicContext.ts` | Mock `MOCK_TOPIC_CONTEXT` (morning-routine), trả `{ data, loading, error, refetch }` qua `useFetch`. Structure mock: context `active`, vocab `available`, còn lại `locked`. |
| T0 | types | `types/topic-context.types.ts` | `DialogueSpeakerRole`, `LearningStep(State)`, `TopicStructureItem(State)`, `TopicContextHero/Dialogue`, `TopicContext`. `TopicStructureState` = `"active" \| "locked" \| "done" \| "available"`. |

## 4. State hiện tại

- Không có UI state local (ngoài data hook): audio handlers là noop chờ API
  phát thật; dialog/quizz không có ở màn này.
- Forward navigation đã nối thật (CTA/footer/sidebar → vocab), không còn
  placeholder về `/topics`.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong hook; khi có API: service + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`.
2. **Audio:** `onPlayAll/onPlayLine` noop — khi có TTS: thay ruột handler,
   giữ nguyên props (pattern đã áp dụng ở Vocab view, `03-topic-vocab.md` §5).
3. **Từ đầu của vocab:** `getFirstVocabId()` đang đọc `VOCAB_ORDER` mock; khi
   có API, suy từ danh sách vocab của item (`vocabOrder[0]`).

## 6. Khác biệt có chủ ý so với HTML Stitch

- Dùng `LearningLayout` thay header/footer `fixed` của Stitch; topbar/footer
  của màn là sticky trong layout (không đè shell).
- Radius chuẩn hoá: card `rounded-2xl` (Learning Card), button `rounded-xl`,
  pill `rounded-full` — đúng AGENTS.md + `components.md`.
- Icon toàn bộ `lucide-react`; không Material Symbols.

## 7. Responsive

- Page: `px-5 py-6`, container `max-w-[1240px]`, `flex-col → lg:row gap-6`;
  aside `lg:sticky lg:top-20`.
- Hero: `p-6 → md:p-8`, grid narrative `1col → md:12`.

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1).
- [ ] Gắn TTS thật cho dialogue (§5.2).
- [ ] `getFirstVocabId()` theo data API (§5.3).
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
