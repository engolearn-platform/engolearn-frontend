# Learner — Từ vựng (Topic Vocab)

> Tài liệu workflow cho màn learner Từ vựng của 1 Topic Item, stage VOCAB của
> luồng học (Stitch: "Web — Topic Item: 3. Từ vựng (3/3 - get dressed)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, audio, progress).

## 1. Nguồn thiết kế (Stitch)

- Project: `Remix of EngoLearn English Learning App`
  (`projects/7356093395065438561`).
- Screen: `projects/7356093395065438561/screens/8346c26525e6436cb350c3cfad06b2fb`
  ("Web — Topic Item: 3. Từ vựng (3/3 - get dressed)", DESKTOP 2560×2856).
- HTML đã tải qua `webfetch` từ `htmlCode.downloadUrl` và đối chiếu đầy đủ
  (header, progress card, hero card 5+7, sentences, quick-check + JS
  `selectAnswer`/`playAudioSimulation`, lesson nav, sidebar, footer) + verify
  visual bằng Playwright (desktop 1440×900, mobile 390×844).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*`.

## 2. Route & trigger point

- Route: `/topics/:topicId/vocab/:vocabId` (`ROUTES.TOPIC_VOCAB` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` dưới `LearningLayout`.
- `vocabId` là source of truth cho vị trí trong danh sách (F5/share link giữ
  đúng từ). Helper dùng chung: `getFirstVocabId()`, `buildTopicVocabPath()`
  (export từ `hooks/useTopicVocab.ts`, Context view cũng dùng).
- Trigger: CTA/footer/sidebar ở Context view (`02-topic-context.md`), step
  chips trong màn, prev/next lesson nav, sidebar stage vocab.
- Back → `navigate(-1)`, đóng → `/topics`. Hết danh sách (`nextVocabId null`)
  → CTA/footer Continue tạm về `/topics` (sẽ trỏ sang Expressions khi có màn
  đó, thay 1 chỗ `goNext`).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicVocabView` | `views/learning/TopicVocabView.tsx` | Container: `useParams(topicId, vocabId)`, `useTopicVocab` + `useTopicProgress`, `Loading`/`EmptyState`, layout `max-w-[1240px]` (nội dung `lg:w-[840px]`, aside `lg:w-[320px] lg:sticky`), owns audio simulation, quiz/sentinel completion (xem `04-learning-progress.md`), `goStep/goPrev/goNext/goStructure`. |
| C0 | `ContextTopBar` | `components/learning/ContextTopBar.tsx` (reuse) | Header sticky: back + title + phase pill + close + avatar. |
| C1 | `VocabProgressHeader` | `components/learning/vocab/VocabProgressHeader.tsx` (mới) | Card 124px: badges topic/CEFR + `progressText` ("Từ vựng X / N", `BadgeCheck`) + step chips `done/active/todo` (`CheckCircle2`/`CircleDot`, connector `w-4 h-0.5`, `overflow-x-auto`), click chip → `onSelectStep`. |
| C2 | `VocabHeroCard` | `components/learning/vocab/VocabHeroCard.tsx` (mới) | Hero `grid-1 → md:12` (ảnh 5 + nội dung 7): ảnh `aspect-[4/3]` + overlay badge (`Camera`), pronunciation bar (nhãn + `1.0x` + 2 nút UK/US `whitespace-nowrap`, playing → `AudioLines` + `animate-pulse`), POS/frequency tags, H1 + IPA + nghĩa VI, description box, collocations `1col → sm:2`. Props `playingAccent: "uk" \| "us" \| null`. |
| C3 | `VocabSentencesCard` | `components/learning/vocab/VocabSentencesCard.tsx` (mới) | Mẫu câu: header (`Quote` + `countLabel` từ `sentences.length`) + rows (EN highlight `text-primary underline` + VI + nút `Volume2` tròn, playing → `bg-primary`). Props `playingId`, `onPlaySentence(id)`. |
| C4 | `VocabQuickCheckCard` | `components/learning/vocab/VocabQuickCheckCard.tsx` (mới) | Quiz: câu hỏi + blank (`min-w-[120px]`, đúng → `bg-primary-fixed`, sai → `bg-error-container`), options `1col → sm:3` (`aria-pressed`, ký tự A/B/C), feedback `role="status"` (đúng `bg-primary-fixed/40`, sai `bg-error-container/60`). Đúng/sai lấy từ **data** (`isCorrect`), không hardcode đáp án. `key={vocab.id}` ở V0 để reset khi đổi từ. Prop `onCorrectAnswer?` cho progress (xem 04). |
| C5 | `VocabLessonNav` | `components/learning/vocab/VocabLessonNav.tsx` (mới) | Nav inline: prev link (`ArrowLeft`, ẩn khi `!hasPrev`) + next CTA primary (`ArrowRight`). |
| S0 | `LessonProgressCard` / `TopicStructureNav` / `MemoryTipCard` / `LearningFooterNav` | `components/learning/*` (reuse) | Sidebar + footer dùng chung (states sidebar theo `furthest`, xem 04). |
| H1 | `useTopicVocab` | `hooks/useTopicVocab.ts` | Mock 3 từ (`wake-up`, `breakfast`, `get-dressed` — ảnh Stitch cho get-dressed, picsum seed cho 2 từ còn lại), tính `currentIndex/totalCount/prev/next` từ `VOCAB_ORDER`, `progressText`, steps `done/active/todo`. |
| T0 | types | `types/topic-vocab.types.ts` | `VocabStep(State)`, `VocabOrderItem`, `VocabCollocation/Sentence/Option`, `VocabHero`, `VocabQuickCheck`, `TopicVocab` (+`prev/nextVocabId`, `currentIndex/totalCount`). |

## 4. State hiện tại

- V0: `playingAccent`, `playingSentenceId` (timeout 900ms mô phỏng Stitch) +
  `answeredCorrectly`/`reachedEnd`/`reportedRef` cho completion (xem 04).
- C4: `selectedId` nội bộ; `key={data.id}` remount khi đổi từ nên không kẹt
  đáp án cũ.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong hook (cả ảnh 2 từ phụ); khi có API: service +
   `useFetch`, ảnh/IPA/collocations/sentences/options từ backend.
2. **Audio:** simulation 900ms trong V0; khi có TTS: thay ruột 3 handler,
   giữ nguyên props C2/C3.
3. **Admin 3–5 từ:** chỉ thêm phần tử `vocabOrder` — chips cuộn ngang,
   `countLabel`/`progressText` tự suy, không sửa component.
4. **Next CTA cuối list:** đang về `/topics`; khi có Expressions view, trỏ
   `goNext` sang route đó.

## 6. Khác biệt có chủ ý so với HTML Stitch

- Dùng `LearningLayout` thay header/footer `fixed` của Stitch (sticky trong
  layout, không đè shell); tip widget map sang `secondary-fixed/30` thay
  `amber-*` của Stitch để đúng token.
- Card `rounded-2xl`, button `rounded-xl`, pill `rounded-full`; feedback quiz
  render JSX có điều kiện thay `innerHTML` inject của JS Stitch.
- Icon toàn bộ `lucide-react`; không Material Symbols.
- Đã đối chiếu visual 2 vòng Playwright và fix: sidebar "Hoàn tất", nút phát
  âm 1 dòng, chip todo không icon thừa.

## 7. Responsive

- Page `px-5 py-6`, `max-w-[1240px]`, `flex-col → lg:row gap-6`; aside
  `lg:sticky lg:top-20`.
- Hero `1col → md:12`; collocations `1col → sm:2`; options `1col → sm:3`;
  step chips `overflow-x-auto`; phase pill `hidden md:flex`.

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1, ảnh/IPA/sentences/options).
- [ ] Gắn TTS thật (§5.2).
- [ ] Trỏ `goNext` cuối list sang Expressions (§5.4).
- [ ] Thay mock PATCH bằng endpoint progress (xem `04-learning-progress.md`).
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
