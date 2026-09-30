# Topic Management — Bản đồ luồng (README)

> Index điều hướng cho toàn bộ luồng quản lý topic (wizard tạo topic + editor từng Topic Item).
> Khi cần sửa / debug / gắn API thật: đọc README này trước, rồi nhảy đúng file con + component.

## 1. Sơ đồ luồng

```
TopicManagementListView ("Tạo topic mới")
  └─► [01] Basic Info Create ──Tiếp tục (valid)──► [02] Items Overview
        /admin/topics/create                           /admin/topics/create/items
                                                       │  ┌─ Quay lại → [01]
                                                       │  ├─ Sửa / Khởi tạo nội dung ─► Editor gộp
                                                       │  └─ Tiếp tục → (step 3 Review, chưa có)
                                                       ▼
                                          /admin/topics/create/items/:itemId/:sectionKey
                                           TopicItemEditorView (dispatcher theo sectionKey)
                                              ├─ context    → [03] Context Editor ─► vocabulary
                                              ├─ vocabulary → [04] Vocabulary Manager ─► expressions
                                              ├─ expressions→ [05] Expressions Editor ─► quiz
                                              └─ quiz       → [06] Quiz Manager ─► [02] (overview)
```

Step 3 (Kiểm tra & Xuất bản) chưa có màn — footer "Tiếp tục" ở [02] đang để trống chờ route này.
Quiz là tab cuối — footer "Tiếp tục" ở [06] quay về [02] (overview) khi hợp lệ.

## 2. Bản đồ tài liệu

| # | File | Màn (Stitch) | Route | Đọc khi nào |
|---|------|--------------|-------|--------------|
| 01 | [`01-basic-info-create.md`](./01-basic-info-create.md) | Admin — 1. Thông tin chủ đề | `/admin/topics/create` | Sửa form EN/VI, CEFR, cover, tags, validate "Tiếp tục", stepper `activeStep=0` |
| 02 | [`02-topic-items-overview.md`](./02-topic-items-overview.md) | Admin — 2. Danh sách Topic Items | `/admin/topics/create/items` | Sửa list item, status pill, step pills, quality sidebar, reorder, xóa, stepper `activeStep=1` |
| 03 | [`03-topic-item-context-editor.md`](./03-topic-item-context-editor.md) | Admin — 3. Biên soạn Bối cảnh | `/admin/topics/create/items/:itemId/:sectionKey` (`context`) | Sửa form bối cảnh, dialogue turns, tab rail, dispatcher `TopicItemEditorView` |
| 04 | [`04-vocabulary-manager.md`](./04-vocabulary-manager.md) | Admin — 4. Quản lý Từ vựng | `.../:itemId/vocabulary` | Sửa vocab cards, dialog thêm/sửa, audio chip, examples/collocations, validate 1..5 từ |
| 05 | [`05-expressions-editor.md`](./05-expressions-editor.md) | Admin — 5. Biên soạn Mẫu câu giao tiếp | `.../:itemId/expressions` | Sửa purpose groups, dialog purpose local + auto-fill, type enum, audio optional, linked vocab multi, validate 3/3 |
| 06 | [`06-quiz-manager.md`](./06-quiz-manager.md) | Admin — 6. Quản lý Quizzes | `.../:itemId/quiz` | Sửa 2 nhóm quiz fix cứng, dialog chung upsert (khóa loại khi edit), card situational/fill-blank, validate min 2 câu/nhóm |

Mỗi file con giữ cấu trúc 8 mục giống nhau: Stitch → Route → Bản đồ component → State → UI-only → Khác biệt Stitch → Responsive → Checklist refactor.

## 3. Route & trigger — nguồn thật duy nhất

| Chuyển hướng | From → To | Code |
|--------------|-----------|------|
| Tạo mới | List header / empty state → [01] | `goToCreate` trong `TopicManagementListView.tsx` → `navigate(ROUTES.ADMIN_TOPIC_CREATE)` |
| [01] → [02] | "Tiếp tục" khi `isValid` | `handleContinue` trong `TopicCreateBasicInfoView` → `ROUTES.ADMIN_TOPIC_CREATE_ITEMS` |
| [02] → [01] | "Quay lại" | `navigate(ROUTES.ADMIN_TOPIC_CREATE)` |
| [02] → Editor | "Sửa / Khởi tạo nội dung" | `onEdit`/`onInit` trong `TopicCreateItemsView` → `topicItemSectionPath(id, "context")` |
| Editor Back | Context → [02]; Vocabulary → context; Expressions → vocabulary | explicit navigate (an toàn deep-link), xem V1 mỗi màn |
| Editor Continue | Context → vocabulary; Vocabulary → expressions; Expressions → quiz; Quiz → [02] overview | valid mới navigate, invalid → `showErrors` |
| Tab rail | Giữa 4 sections | `onSelect(section)` → `topicItemSectionPath(itemId, section)` |

Định nghĩa route: `ROUTES.*` + `topicItemSectionPath` trong `src/shared/constants/app.constants.ts`; khai báo trong `src/features/topic/routes.ts` dưới `ManagementLayout`. Dispatcher: `views/management/TopicItemEditorView.tsx` (4 view thật theo sectionKey; key lạ → `<Navigate>` về context; placeholder V2 đã xóa khi [06] xong).

## 4. Component dùng chung (đừng clone mới)

| Component | File | Dùng ở |
|-----------|------|--------|
| `TopicCreateWizardHeader` | `components/create/TopicCreateWizardHeader.tsx` | [01] default title B1; [02]/[03]/[04] truyền `title` override |
| `TopicCreateStepper` | `components/create/TopicCreateStepper.tsx` | [01] `activeStep=0`; [02]/[03]/[04] `activeStep=1`; dùng chung `TOPIC_CREATE_STEPS` |
| `TopicCreateFooterBar` | `components/create/TopicCreateFooterBar.tsx` | Mọi màn; `onSaveDraft` hiện **chưa truyền ở đâu** (chờ endpoint) |
| `TopicItemSectionTabRail` | `components/create/editor/TopicItemSectionTabRail.tsx` | [03]/[04]/[05]/[06]; 4 tabs `context/vocabulary/expressions/quiz` |
| `TopicItemEditorBreadcrumb` | `components/create/editor/TopicItemEditorBreadcrumb.tsx` | [03]/[04] |
| `ExpressionAudioChip` | `components/create/editor/expressions/ExpressionAudioChip.tsx` | [05] + [06] (quiz reuse cross-folder, chỉ render khi có audio) |
| `EmptyState` / `Loading` (shared) | `src/shared/components/` | Lookup `itemId` lạ + pattern `useFetch` khi gắn API |

Quy ước đã chốt: shell dùng `ManagementLayout` (không clone header/sidebar Stitch); nút `rounded-xl`; icon `lucide-react` (bảng map Material Symbols → lucide nằm ở §6 mỗi file).

## 5. Mô hình state (3 tầng rời nhau — chưa nâng lên store)

| Tầng | Hook | Source hiện tại | `isValid` |
|------|------|-----------------|-----------|
| Topic draft | `useTopicBasicInfoForm` | `TOPIC_CREATE_DEFAULT_DRAFT` | EN/VI + CEFR + … non-empty |
| Items list | `useTopicItemsOverview` | `TOPIC_ITEMS_OVERVIEW_MOCK` + `TOPIC_SCRIPT_QUALITY_MOCK` | — (chỉ `selectedId`, `removeItem` local) |
| Context draft | `useTopicItemContextForm` | `TOPIC_ITEM_CONTEXT_DEFAULT_DRAFT` (chung mọi item!) | title + desc + ≥1 turn có `speaker` + `textEn` |
| Vocabulary list | `useTopicItemVocabularyForm` | `TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD` (chung mọi item!) | 1..5 items, mỗi item có `word` + `meaningVi` + ≥1 example EN |
| Expressions purposes | `useTopicItemExpressionsForm` | `TOPIC_EXPRESSIONS_MOCK_CHOOSING_FOOD` (chung mọi item!) | 1..3 purposes, mỗi purpose có EN/VI + 1..3 examples có EN/VI; audio null vẫn valid |
| Quiz groups | `useTopicItemQuizForm` | `TOPIC_QUIZ_MOCK_CHOOSING_FOOD` (chung mọi item!) | Mọi nhóm ≥2 câu valid — situational: prompt + ≥2 options + đúng 1 `correct` + explanationOk/Ng; fill-blank: EN/VI + `___` + bank ≥2 + correct ∈ bank + tips ≤250 |

Lưu ý quan trọng:

- Status item chỉ có **2 giá trị lưu trữ**: `publicationStatus: "DRAFT" | "PUBLISHED"` + completeness suy ra (`getTopicItemCompleteness`). 4 nhãn Stitch chỉ là mapping hiển thị trong `TopicItemStatusPill` — chi tiết xem [02] §4.
- Context `speaker` là tên edit được (`maxLength=16`), `ContextDialogueRole` chỉ để neo styling — xem [03] §4.
- Vocab dialog validate riêng (word + VI + ≥1 example EN), `audioFile` mới chỉ là **tên file** — xem [04] §4–§5.
- Kiểu chữ hoa/thường đang lệch: topic dùng `"published" | "draft"`, item dùng `"DRAFT" | "PUBLISHED"` — hợp nhất khi gắn API ([02] §5.6).
- Expressions `purposeOptions` chỉ sống trong session (dedupe từ `purposes` local, không load global/DB); `purpose_en` trùng → auto-fill `purpose_vi` — xem [05] §4.
- Quiz fix cứng 2 nhóm (không CRUD nhóm); dialog chung route câu vào đúng nhóm theo loại, khóa loại khi edit; `explanation` fill-blank nullable, `audioUrl` là URL string (khác `audioFile` tên file của expressions) — xem [06] §4.

## 6. Nợ UI-only tổng hợp (gắn API thật thì xử lý)

| Việc | Màn liên quan | Chi tiết ở |
|------|---------------|------------|
| Thay mock bằng service + `useFetch` | Tất cả | [01] §5.2, [02] §5.1, [03] §5.1, [04] §5.1, [06] §5.1 |
| Gắn `onSaveDraft` cho footer | Tất cả | [01] §5.2, [02] §5.4, [03] §5.2, [04] §5.2, [06] §5.2 |
| Upload cover thật (16:9, ≤2MB, preview) | [01] | [01] §5.1 |
| Reorder kéo-thả + persist `order` | [02], [04] | [02] §5.2, [04] §5.4 (`moveItem` đã để sẵn, chưa đấu UI) |
| Dialog tạo item + confirm xóa | [02], [04] | [02] §5.3/§5.5, [04] §5.5 |
| Draft theo `itemId` (hiện 1 draft chung) | [03], [04], [06] | [03] §5.5, [04] §5.6, [06] §5.5 |
| Audio upload + phát preview thật | [04], [05], [06] | [04] §5.3, [05] §5.3, [06] §5.3 |
| Dựng step 3 Review (quiz đã xong ở [06]) | [02] | [02] §5.3–§5.4 |
| Thêm loại quiz `MATCHING` / `SENTENCE_ORDER` | [06] | [06] §5.6 |
| Wizard đa bước: nâng state lên route cha/store | Tất cả | mục cuối checklist mỗi file |

## 7. Tìm vấn đề nhanh (debug map)

| Triệu chứng | Đọc file | Xem component/hook |
|-------------|----------|--------------------|
| Nút "Tiếp tục" không sang trang | [01] §4 / [03] §4 / [04] §4 / [05] §4 / [06] §4 | `isValid` + `showErrors` trong `useTopicBasicInfoForm` / `useTopicItemContextForm` / `useTopicItemVocabularyForm` / `useTopicItemExpressionsForm` / `useTopicItemQuizForm` |
| Stepper/header sai tiêu đề bước | [02] §3-C0 / [03] §3-C0 | props `title` / `activeStep` truyền vào `TopicCreateWizardHeader` + `TopicCreateStepper` |
| Pill trạng thái item hiển thị sai | [02] §4 | `resolveVisual` trong `TopicItemStatusPill.tsx`, không sửa union `publicationStatus` |
| Click card "Sửa" không vào editor | [02] §5.3 → [03] §2 | `onEdit`/`onInit` trong `TopicCreateItemsView` phải `navigate(topicItemSectionPath(...))`, dispatcher `TopicItemEditorView` |
| Deep-link `/items/:id/:section` trắng trang | Dispatcher + [03] §3-V1 | guard `isTopicItemSectionKey` trong `TopicItemEditorView` (key lạ → context) + lookup `TOPIC_ITEMS_OVERVIEW_MOCK` → `EmptyState` |
| Dialog quiz không lưu / đáp án đúng lệch | [06] §4 | `QuestionUpsertDialog` (normalize options + `correctIndex`) + `addQuestionOfType`/`patchQuestion` (gán label A/B… + `isCorrect`) |
| Layout vỡ mobile | §7 mỗi file | rail `overflow-x-auto`, footer `flex-col-reverse`, bento `xl:grid-cols-12` ([02]), cột `max-w-[940px]` ([03]/[04]/[05]/[06]) |
| Dialog vocab không lưu / validate lạ | [04] §4 | `VocabularyUpsertDialog` + `addItem`/`patchItem` (chặn `>= TOPIC_VOCAB_MAX`) |
| Dialog mẫu câu không lưu / purpose VI không tự điền | [05] §4 | `ExpressionUpsertDialog` + `addExampleToPurpose` (chặn 3/3) + `lookupPurposeVi` |
| Layout vỡ mobile | §7 mỗi file | rail `overflow-x-auto`, footer `flex-col-reverse`, bento `xl:grid-cols-12` ([02]), cột `max-w-[940px]` ([03]/[04]) |

## 8. Checklist chung sau mỗi thay đổi

- [ ] `npm run lint` (0 errors) + `npm run build` — `noUnusedLocals`/`noUnusedParameters` bật nên build fail nếu thừa code.
- [ ] Không import xuyên feature; dùng alias `@features/topic/...`, `@shared/...` (relative 2+ cấp bị warn).
- [ ] Không màu/font/spacing/radius tuỳ tiện — đối chiếu `docs/design-system/*` (primary `#006565`, Hanken Grotesk, Learning Card `rounded-2xl` + padding 20px).
- [ ] Đổi route/prop/state → cập nhật doc file con tương ứng **trong cùng change** (quy tắc docs-first trong `AGENTS.md`).
