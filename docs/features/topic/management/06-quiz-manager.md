# Topic — Bước 2: Biên soạn Bài tập & Quiz (Quiz Manager)

> Tài liệu workflow cho màn editor Quiz của 1 Topic Item trong luồng tạo topic
> (Stitch: "Admin — 6. Quản lý Quizzes (Nhóm Quiz & Thẻ câu hỏi)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, persist, audio).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/124aebff8e5949cd865b7987c0053cec`
  ("Admin — 6. Quản lý Quizzes (Nhóm Quiz & Thẻ câu hỏi)", DESKTOP 2560×5976).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).
- HTML đã tải qua `webfetch` từ `htmlCode.downloadUrl` và đối chiếu đầy đủ:
  header fixed + aside `w-72` + breadcrumb/CEFR + tab rail 4 giai đoạn (stage 4
  active "4. Quản lý Quizzes (8 câu)") + banner editorial ("Giai đoạn 4",
  2 CTA, stats 3 Nhóm / 8 Câu / ~6 Phút / +120 XP) + 3 nhóm quiz (1 Situational
  3 câu + 2 Fill-in-the-Blank 3 câu + 3 Sentence Completion 2 câu) + QA bar
  + sticky action strip + bottom bar. HTML **không có markup dialog** (chỉ nút mở).
- JSON backend (user cung cấp, chốt Phase 1): `quizzes[]` với
  `quiz_id/quiz_type ("SITUATIONAL_CHOICE" | "FILL_BLANK" | "MATCHING" |
  "SENTENCE_ORDER")/title/instructions/order_index/questions[]`;
  situational question: `prompt/audio_url/options[{label,text_en,is_correct}]/
  correct/explanation_ok/explanation_ng`; fill-blank question:
  `sentence{text_en,meaning_vi,audio_url,...}/quiz_data{sentence_with_blank,
  word_bank}/answer_data{correct_option}/explanation (null được)/tips
  (≤250 ký tự VI, optional)`. Quy tắc: min 2 questions/type/Item khi type xuất hiện.

## 2. Route & trigger point

- Reuse route gộp duy nhất: `/admin/topics/create/items/:itemId/:sectionKey`
  (`ROUTES.ADMIN_TOPIC_ITEM_SECTION` + helper
  `topicItemSectionPath(itemId, section)` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` (`path: "create/items/:itemId/:sectionKey"`)
  dưới `ManagementLayout`. Không thêm route, không sửa `ROUTES`.
- Dispatcher `TopicItemEditorView` rẽ nhánh theo `sectionKey`: `"context"` →
  Context view; `"vocabulary"` → Vocabulary view; `"expressions"` →
  Expressions view; `"quiz"` → Quiz view (mới); key lạ → `<Navigate>` về
  context (guard `isTopicItemSectionKey`, giữ từ placeholder cũ).
  `TopicItemSectionPlaceholderView` đã xóa (dead code sau khi quiz có view thật).
- Trigger: tab `4. Bài tập & Quiz` trên `TopicItemSectionTabRail`
  (`src/features/topic/components/create/editor/TopicItemSectionTabRail.tsx`,
  icon `ListChecks`) gọi `onSelect("quiz")` →
  `navigate(topicItemSectionPath(itemId, "quiz"))`.
- Back của editor → section `expressions` cùng item. Continue (hợp lệ) →
  `ROUTES.ADMIN_TOPIC_CREATE_ITEMS` (quiz là tab cuối — về overview items).
  Footer chưa truyền `onSaveDraft` (chờ endpoint, giống view 01/03/04/05).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicItemEditorView` | `views/management/TopicItemEditorView.tsx` (sửa) | Thêm `sectionKey === "quiz"` → view mới; xóa import + fallback `TopicItemSectionPlaceholderView` (file đã xóa). |
| V1 | `TopicItemQuizEditorView` | `views/management/TopicItemQuizEditorView.tsx` (mới) | Container editor: `useParams` lấy `itemId`, lookup mock (lạ → `EmptyState` + nút quay lại), compose C0 + C1 + C2 + dialog C5 + footer, owns `showErrors` + `dialogOpen/dialogMode/presetType/editingId`, điều hướng Back/Continue/Tab, submit dialog (add → `addQuestionOfType(draft.kind, draft)`, edit → `patchQuestion`). |
| C0 | `TopicCreateWizardHeader` / `TopicCreateStepper` / `TopicCreateFooterBar` / `TopicItemSectionTabRail` | `components/create/*` (reuse) | Header `title="Bước 2: Biên soạn Bài tập & Quiz — {titleEn}"`; stepper `activeStep={1}`; rail `activeSection="quiz"` + notes từ `item.steps`; footer `onBack` → expressions, `onContinue` → overview khi `isValid`. |
| C1 | `QuizHeaderCard` | `components/create/editor/quiz/QuizHeaderCard.tsx` (mới) | Banner Stitch rút gọn theo `ExpressionsHeaderCard`: icon `ListChecks` + H1 + mô tả quy tắc 2 nhóm/tối thiểu 2 câu + metric `{totalQuestions} câu hỏi · {groupCount} nhóm` (`hidden sm:flex`) + shadcn `Button` "Thêm câu hỏi nhanh". Card `rounded-2xl`. |
| C2 | `QuizGroupSection` | `components/create/editor/quiz/QuizGroupSection.tsx` (mới) | 1 nhóm quiz fix cứng: badge số `1/2` + title (H2) + instructions + count pill + `Button` "Thêm câu hỏi" + grid cards 1 cột (rẽ nhánh card theo `question.kind`). |
| C3 | `SituationalQuestionCard` | `components/create/editor/quiz/SituationalQuestionCard.tsx` (mới) | 1 Learning Card `rounded-2xl p-5 hover:shadow-md`: badge `Câu X • Tình huống` + `ExpressionAudioChip` (reuse, chỉ render khi có `audioUrl`) + edit/delete (`Pencil/Trash2`, không duplicate theo Stitch) + `Tình huống:` prompt + grid options (`1col → sm:2`, đúng → `bg-primary/10` + badge `Đáp án đúng ✓`) + box giải thích (ok `Check/text-primary`, ng `X/text-error`). |
| C4 | `FillBlankQuestionCard` | `components/create/editor/quiz/FillBlankQuestionCard.tsx` (mới) | Card điền từ: badge `Câu X • Điền từ` + audio chip (optional) + box câu đục lỗ (`___` render thành chip đáp án `bg-primary`) + `meaningVi` + `Word bank:` chips (đúng → `bg-primary` + `✓`) + box giải thích/mẹo (chỉ render khi có nội dung). |
| C5 | `QuestionUpsertDialog` | `components/create/editor/quiz/QuestionUpsertDialog.tsx` (mới) | **1 dialog chung** dùng shadcn `Dialog` (`max-w-2xl`, body shared `ThinScroll` + footer): (1) Loại quiz — 2 pill chọn (`TOPIC_QUIZ_TYPE_OPTIONS`), **khóa khi edit** (đổi loại = xóa + tạo mới); (2a) Situational: prompt* textarea, audio URL (text input, optional, UI-only), options editor (dòng label A/B… + input + radio đáp án đúng + nút xóa, nút thêm tới `TOPIC_QUIZ_MAX_OPTIONS = 6`), explanationOk*/explanationNg*; (2b) Fill-blank: textEn*, meaningVi*, câu đục lỗ* (phải chứa `___`), wordBank* (input phẩy-phân tách, ≥2), correctOption* (`select` từ bank — luôn thuộc bank), audio URL optional, explanation optional, tips optional (`maxLength 250` + counter). **Không có field title/instructions của quiz** (chốt Phase 1: dialog chỉ biên soạn question). Validate inline (`ring-error` + msg) theo §4. |
| H1 | `useTopicItemQuizForm` + `toQuestionUpsert` + `isQuizQuestionValid` | `hooks/useTopicItemQuizForm.ts` (mới) | Mirror expressions form: lookup `TOPIC_ITEMS_OVERVIEW_MOCK`, state `groups` từ mock choosing-food, `addQuestionOfType` (build + validate, gán label A/B… + `isCorrect` từ `correctIndex`; fill-blank dedupe bank), `patchQuestion` (chỉ patch khi cùng kind — loại bị khóa), `removeQuestion`, `findQuestion`, `totalQuestions`, `isValid` (mọi nhóm ≥ `TOPIC_QUIZ_MIN_QUESTIONS = 2` + mọi câu valid). Export draft `QuizQuestionUpsert` (discriminated union) cho dialog. |
| T0 | types & consts | `types/topic-create.types.ts` (append) | `QuizType` (`"SITUATIONAL_CHOICE" \| "FILL_BLANK"`, union string — `MATCHING`/`SENTENCE_ORDER` để sau), `TopicQuizOption`, `TopicSituationalQuestion` (`kind` discriminant), `TopicFillBlankSentence`, `TopicFillBlankQuestion` (`explanation: string \| null`, `tips: string`), `TopicQuizQuestion` (union), `TopicQuizGroup` (`quizType/title/instructions/orderIndex/questions`), `TopicQuizTypeOption`, `TOPIC_QUIZ_MIN_QUESTIONS = 2`, `TOPIC_QUIZ_MAX_OPTIONS = 6`, `TOPIC_QUIZ_TIPS_MAX = 250`, `TOPIC_QUIZ_TYPE_OPTIONS`, mock `TOPIC_QUIZ_MOCK_CHOOSING_FOOD` (2 nhóm × 3 câu, nội dung bám Stitch + JSON mẫu). Map field JSON snake_case → camelCase (§1). |

## 4. State & validation hiện tại

- `groups` là UI state local khởi từ `TOPIC_QUIZ_MOCK_CHOOSING_FOOD` (chung mọi
  item — chưa persist theo item, giống Context/Vocab/Expressions).
- Nhóm fix cứng 2 loại: dialog add chọn loại → hook route vào đúng nhóm theo
  `quizType` (`addQuestionOfType` từ chối khi `draft.kind` lệch). Không CRUD nhóm.
- Situational valid: prompt non-empty + ≥2 options non-empty + đúng 1 option
  (`isCorrect` khớp `correct`) + explanationOk/Ng non-empty.
- Fill-blank valid: textEn/meaningVi non-empty + `sentenceWithBlank` chứa `___`
  + bank ≥2 từ + `correctOption ∈ bank` + `tips ≤ 250` ký tự. `explanation`
  nullable (trống → `null`, vẫn valid).
- `isValid` = mọi nhóm ≥2 câu + mọi câu valid. Xóa direct không confirm
  (khớp Stitch).

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong types + lookup `TOPIC_ITEMS_OVERVIEW_MOCK` theo `itemId`.
   Khi có API: service trong `src/shared/services/` + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`, `loading` → `Loading`, `error` → `EmptyState`.
   Chú ý map camelCase ↔ snake_case (§1/T0) + `ObjectId` cho `quiz_id`.
2. **Lưu nháp:** footer có nút "Lưu nháp" nhưng view chưa truyền `onSaveDraft`
   (chờ endpoint, giống view 01/03/04/05).
3. **Audio:** chip chỉ animation preview 1.2s (reuse `ExpressionAudioChip`);
   dialog lưu **URL string / null** (UI-only, chưa upload/phát thật). Cân nhắc
   thống nhất audio thành file upload như expressions khi có endpoint.
4. **Xóa:** direct remove không confirm (khớp Stitch) — cân nhắc confirm dialog
   khi gắn API thật.
5. **Draft theo item:** hiện 1 draft chung; khi gắn API, load/save theo `itemId`
   (nâng lên route cha/store khi làm wizard đa bước).
6. **Loại quiz mới:** thêm `MATCHING`/`SENTENCE_ORDER` vào `QuizType` + card +
   section dialog tương ứng (khung `kind` discriminant đã sẵn).

## 6. Khác biệt có chủ ý so với HTML Stitch

- Shell dùng lại `ManagementLayout` + khung `max-w-[940px]` của Context/Vocab/
  Expressions; không clone header/sidebar `fixed` + `pl-72` + bottom-bar của Stitch.
- Chỉ dựng **2/3 nhóm** (bỏ Sentence Completion — chốt scope fix cứng 2 dạng).
- Card có thêm **khối giải thích** (Stitch không hiển thị explanation) theo yêu cầu.
- Bỏ chip độ khó (JSON không có field), bỏ QA insights bar (user duyệt bỏ),
  bỏ `Chỉnh sửa nhóm`/`more_vert`/`Tạo nhóm Quiz mới` (nhóm fix cứng, không CRUD).
- Header rút gọn theo `ExpressionsHeaderCard` (bỏ stats `~phút`/`XP` — chưa có
  công thức chuẩn, chỉ hiện tổng câu hỏi/nhóm).
- Group grid 1 cột (y Stitch) thay vì `lg:2` như expressions (card quiz rộng:
  prompt + options + giải thích).
- Dialog thiết kế mới theo JSON spec (Stitch không có markup dialog): 1 dialog
  chung có chọn loại, khóa loại khi edit, không field title/instructions.
- Radius chuẩn hoá theo repo: card `rounded-2xl`, button/input
  `rounded-xl`/`rounded-lg`, pill/chip `rounded-full`/`rounded-md`.
- Icon toàn bộ `lucide-react` (`quiz→ListChecks`, `add→Plus/PlusCircle`,
  `edit→Pencil`, `delete→Trash2`, `check→Check`, `close→X`); không Material Symbols.
- `ExpressionAudioChip` reuse cross-folder (`quiz/` → `../expressions/`, cùng
  feature, chỉ render khi có audio — khác expressions là luôn render cả trạng
  thái trống).

## 7. Responsive

- Page: `px-5 → lg:px-8`; cột nội dung `max-w-[940px]` full-width mọi breakpoint
  (giống view 03/04/05).
- Header card `flex-col → lg:row`, metric `hidden sm:flex`, button
  `w-full sm:w-auto`.
- Group header `flex-col → md:row`; cards 1 cột; options situational
  `1col → sm:2`; word-bank chips `flex-wrap`; audio filename `truncate`.
- Dialog `max-w-2xl` + `ThinScroll max-h-[85vh]`, type grid `1col → sm:2`,
  footer `flex-col → sm:row justify-end`.
- Tab rail `overflow-x-auto scrollbar-hide`, tab `whitespace-nowrap` (reuse).

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1); draft nạp theo `itemId` (§5.5).
- [ ] Gắn endpoint lưu nháp → truyền `onSaveDraft` cho footer (§5.2).
- [ ] Audio thật: upload + phát preview + trạng thái uploaded (§5.3).
- [ ] Confirm xóa (shadcn `Dialog`) trước `removeQuestion` (§5.4).
- [x] 2 nhóm fix cứng + dialog chung khóa loại khi edit + validation §4 — đã làm
  (UI-only, state local).
- [ ] Thêm `MATCHING`/`SENTENCE_ORDER` (§5.6).
- [ ] Wizard đa bước: nâng state draft + groups lên route cha/store.
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
