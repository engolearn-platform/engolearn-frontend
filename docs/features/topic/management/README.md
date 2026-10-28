# Topic Management — Bản đồ luồng (README)

> Index điều hướng cho toàn bộ luồng quản lý topic (wizard upsert topic — tạo mới & cập nhật — + editor từng Topic Item).
> Component layer dùng chung nằm dưới `components/management/upsert/`; view/route cũng dùng chung 2 mode:
> `TopicUpsertBasicInfoView`/`TopicUpsertItemsView` phục vụ cả `/admin/topics/create...` và
> `/admin/topics/:topicId/edit...`. Chỉ const/type còn giữ tên `Create` (xem §4.2).
> Khi cần sửa / debug / gắn API thật: đọc README này trước, rồi nhảy đúng file con + component.

## 1. Sơ đồ luồng

```
TopicManagementListView ("Tạo topic mới")
  └─► [01] Basic Info Upsert ──Tiếp tục (valid)──► [02] Items Overview
        Tạo:  /admin/topics/create                    Tạo:  /admin/topics/create/items
        Sửa:  /admin/topics/:topicId/edit             Sửa:  /admin/topics/:topicId/edit/items
                                                       │  ┌─ Quay lại → [01]
                                                       │  ├─ Sửa / Khởi tạo nội dung ─► Editor gộp
                                                       │  └─ Tiếp tục → (step 3 Review, chưa có)
                                                       ▼
                             Editor gộp (dispatcher theo sectionKey, giữ mode qua topicId)
                                Tạo: /admin/topics/create/items/:itemId/:sectionKey
                                Sửa: /admin/topics/:topicId/edit/items/:itemId/:sectionKey
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
| 01 | [`01-basic-info-upsert.md`](./01-basic-info-upsert.md) | Admin — 1. Thông tin chủ đề | `/admin/topics/create` + `/admin/topics/:topicId/edit` | Bước 1 của upsert (tạo mới & cập nhật): form EN/VI, CEFR, cover, tags, validate "Tiếp tục", stepper `activeStep=0`, nạp snapshot theo `topicId` |
| 02 | [`02-topic-items-overview.md`](./02-topic-items-overview.md) | Admin — 2. Danh sách Topic Items | `/admin/topics/create/items` + `/admin/topics/:topicId/edit/items` | Sửa list item, status pill, step pills, quality sidebar, reorder, xóa, stepper `activeStep=1` |
| 03 | [`03-topic-item-context-editor.md`](./03-topic-item-context-editor.md) | Admin — 3. Biên soạn Bối cảnh | `.../items/:itemId/:sectionKey` (`context`) | Sửa form bối cảnh, dialogue turns, tab rail, dispatcher `TopicItemEditorView` |
| 04 | [`04-vocabulary-manager.md`](./04-vocabulary-manager.md) | Admin — 4. Quản lý Từ vựng | `.../:itemId/vocabulary` | Sửa vocab cards, dialog thêm/sửa, audio chip, examples/collocations, validate 1..5 từ |
| 05 | [`05-expressions-editor.md`](./05-expressions-editor.md) | Admin — 5. Biên soạn Mẫu câu giao tiếp | `.../:itemId/expressions` | Sửa purpose groups, dialog purpose local + auto-fill, type enum, audio optional, linked vocab multi, validate 3/3 |
| 06 | [`06-quiz-manager.md`](./06-quiz-manager.md) | Admin — 6. Quản lý Quizzes | `.../:itemId/quiz` | Sửa 2 nhóm quiz fix cứng, dialog chung upsert (khóa loại khi edit), card situational/fill-blank, validate min 2 câu/nhóm |

Mỗi file con giữ cấu trúc 8 mục giống nhau: Stitch → Route → Bản đồ component → State → UI-only → Khác biệt Stitch → Responsive → Checklist refactor.

Route editor áp dụng cho cả 2 mode: `/admin/topics/create/items/:itemId/:sectionKey` (tạo mới) và
`/admin/topics/:topicId/edit/items/:itemId/:sectionKey` (cập nhật). Các view editor dùng
`adminTopicItemsPath(topicId)` / `topicItemSectionPath(itemId, section, topicId?)` để giữ mode khi back/continue/tab.

## 3. Route & trigger — nguồn thật duy nhất

| Chuyển hướng | From → To | Code |
|--------------|-----------|------|
| Tạo mới | List header / empty state → [01] | `goToCreate` trong `TopicManagementListView.tsx` → `navigate(ROUTES.ADMIN_TOPIC_CREATE)` |
| Cập nhật | URL trực tiếp → [01] | `useTopicUpsertContext` đọc `:topicId`; nạp E2 `GET /api/management/topics/{id}` qua service + `useFetch` |
| Cập nhật từ danh sách | Row click trên mục / "Mở chỉnh sửa (Bước 2)" → [01] update | `onEdit` trong `TopicManagementTable` → `navigate(adminTopicBasicInfoPath(topic.id))` (AC-17) |
| [01] → [02] | "Tiếp tục" khi `isValid` | `handleContinue` trong `TopicUpsertBasicInfoView` → `adminTopicItemsPath(topicId)` |
| [02] → [01] | "Quay lại" | `navigate(adminTopicBasicInfoPath(topicId))` |
| [02] → Editor | "Sửa / Khởi tạo nội dung" | `onEdit`/`onInit` trong `TopicUpsertItemsView` → `topicItemSectionPath(id, "context", topicId)` |
| Editor Back | Context → [02]; Vocabulary → context; Expressions → vocabulary | explicit navigate (an toàn deep-link), xem V1 mỗi màn |
| Editor Continue | Context → vocabulary; Vocabulary → expressions; Expressions → quiz; Quiz → [02] overview | valid mới navigate, invalid → `showErrors` |
| Tab rail | Giữa 4 sections | `onSelect(section)` → `topicItemSectionPath(itemId, section, topicId)` |

Định nghĩa route: `ROUTES.*` + `adminTopicBasicInfoPath`/`adminTopicItemsPath`/`topicItemSectionPath` trong `src/shared/constants/app.constants.ts`; khai báo trong `src/features/topic/routes.ts` dưới `ManagementLayout`. Dispatcher: `views/management/TopicItemEditorView.tsx` (4 view thật theo sectionKey; key lạ → `<Navigate>` về context; placeholder V2 đã xóa khi [06] xong).

## 4. Component dùng chung (đừng clone mới)

| Component | File | Dùng ở |
|-----------|------|--------|
| `TopicUpsertWizardHeader` | `components/management/upsert/basic-info/TopicUpsertWizardHeader.tsx` | [01] default title B1; [02]/[03]/[04] truyền `title` override; mode update truyền `title`/`draftLabel` |
| `TopicUpsertStepper` | `components/management/upsert/basic-info/TopicUpsertStepper.tsx` | [01] `activeStep=0`; [02]/[03]/[04] `activeStep=1`; dùng chung `TOPIC_CREATE_STEPS` |
| `TopicUpsertFooterBar` | `components/management/upsert/basic-info/TopicUpsertFooterBar.tsx` | Mọi màn; `onSaveDraft` hiện **chưa truyền ở đâu** (chờ endpoint); mode update truyền `saveLabel`/`continueLabel` |
| `TopicItemSectionTabRail` | `components/management/upsert/editor/TopicItemSectionTabRail.tsx` | [03]/[04]/[05]/[06]; 4 tabs `context/vocabulary/expressions/quiz` |
| `TopicItemEditorBreadcrumb` | `components/management/upsert/editor/TopicItemEditorBreadcrumb.tsx` | [03]/[04] |
| `ExpressionAudioChip` | `components/management/upsert/editor/expressions/ExpressionAudioChip.tsx` | [05] + [06] (quiz reuse cross-folder, chỉ render khi có audio) |
| `EmptyState` / `Loading` (shared) | `src/shared/components/` | Lookup `itemId` lạ + pattern `useFetch` khi gắn API |

Quy ước đã chốt: shell dùng `ManagementLayout` (không clone header/sidebar Stitch); nút `rounded-xl`; icon `lucide-react` (bảng map Material Symbols → lucide nằm ở §6 mỗi file).

### 4.1. Cây thư mục canonical của management surface

Toàn bộ component management nằm dưới `components/management/`, chia 2 slice theo màn: `list/` (danh sách topic) và `upsert/` (wizard tạo mới & cập nhật + editor) — khớp `docs/architecture/project-structure.md` §4.1. Thư mục `create/` cũ trong `management/` đã đổi tên thành `upsert/`; thư mục `components/create/` (nằm thẳng dưới `components/`) **đã bị xóa**. Mọi import dùng alias `@features/topic/components/management/<slice>/...`:

```
components/management/
├── list/                (7 file: TopicManagementEmptyState, TopicManagementFilterBar,
│                         TopicManagementPageHeader, TopicManagementPagination,
│                         TopicManagementStats, TopicManagementTable, UnpublishTopicDialog)
└── upsert/
    ├── basic-info/      (8 file: CefrLevelSelector, TopicCoverCard, TopicUpsertFooterBar,
    │                     TopicUpsertStepper, TopicUpsertTipsCallout, TopicUpsertWizardHeader,
    │                     TopicGeneralInfoCard, TopicTagsInput)
    ├── items/           (6 file: TopicItemCard, TopicItemsHeader, TopicItemsList,
    │                     TopicItemStatusPill, TopicItemStepPills, TopicScriptQualityCard)
    └── editor/
        ├── TopicItemEditorBreadcrumb.tsx
        ├── TopicItemSectionTabRail.tsx
        ├── context/     (2 file: TopicContextFormCard, ContextDialogueTurnRow)
        ├── vocabulary/  (7 file: VocabularyAudioChip, VocabularyCard, VocabularyCollocationsBox,
        │                 VocabularyExamplesBlock, VocabularyHeaderCard, VocabularyQuickAddSlot,
        │                 VocabularyUpsertDialog)
        ├── expressions/ (6 file: ExpressionAudioChip, ExpressionCard, ExpressionsHeaderCard,
        │                 ExpressionsQuickAddSlot, ExpressionUpsertDialog, PurposeGroupSection)
        └── quiz/        (5 file: FillBlankQuestionCard, QuestionUpsertDialog, QuizGroupSection,
                          QuizHeaderCard, SituationalQuestionCard)
```

Tổng 43 file (7 `list/` + 36 `upsert/`) — component giữ nguyên hành vi (ngoại lệ: `TopicUpsertFooterBar` thêm `backLabel`/`saveLabel`/`continueLabel`, backward-compatible; views `TopicCreate*` đổi thành `TopicUpsert*` và nhận thêm mode update). Quiz vẫn `import ExpressionAudioChip` qua alias (`@features/.../editor/expressions/ExpressionAudioChip`) — không nhân bản component.

### 4.2. Tái sử dụng cho upsert (tạo mới & cập nhật)

Kết luận: **toàn bộ 36 component dùng chung được** cho 2 mode; không cần nhân bản frame hiển thị.
Chỉ 4 component từng mang tên `*Create*` được đổi sang `*Upsert*` và thư mục `create/` → `upsert/`.

| Nhóm | Component | Dùng chung? | Cách dùng cho mode cập nhật |
|------|-----------|-------------|------------------------------|
| Shell wizard | `TopicUpsertWizardHeader`, `TopicUpsertStepper`, `TopicUpsertFooterBar`, `TopicUpsertTipsCallout` | Có | Truyền `title`/`draftLabel`/`autosaveText`, `steps`/`activeStep` (từ `getTopicUpsertSteps(mode, itemCount)`), `saveLabel`/`continueLabel`, `title`/`description`; default giữ copy tạo mới. |
| Basic info | `TopicGeneralInfoCard`, `CefrLevelSelector`, `TopicCoverCard`, `TopicTagsInput` | Có | Controlled qua `draft`/`onPatch`; mode update nạp `snapshot.basicInfo` theo `topicId`. |
| Items overview | `TopicItemsHeader`, `TopicItemsList`, `TopicItemCard`, `TopicItemStatusPill`, `TopicItemStepPills`, `TopicScriptQualityCard` | Có | Mode update nạp `snapshot.items`; action Sửa/Khởi tạo/Xóa giữ nguyên, thay mock bằng API sau. |
| Editor | `TopicItemEditorBreadcrumb`, `TopicItemSectionTabRail`, `TopicContextFormCard`, `Vocabulary*`, `Expressions*`, `Quiz*` | Có | Đều presentational/controlled; các dialog `*UpsertDialog` đã hỗ trợ add/edit; `topicId` truyền qua path helper để giữ mode. |

Đã hoàn tất: views `TopicUpsertBasicInfoView`/`TopicUpsertItemsView`, hook `useTopicUpsertContext`,
3 route edit + helpers `adminTopicBasicInfoPath`/`adminTopicItemsPath`/`topicItemSectionPath(..., topicId?)`.
Vẫn giữ tên `Create` cho const/type (`ROUTES.ADMIN_TOPIC_CREATE*`, URL `/admin/topics/create...`,
`topic-create.types.ts`, `TOPIC_CREATE_*`, `TOPIC_ITEMS_*`) vì create là mode hợp lệ — không cần rename.

## 5. Mô hình state (3 tầng rời nhau — chưa nâng lên store)

| Tầng | Hook | Source hiện tại | `isValid` |
|------|------|-----------------|-----------|
| Upsert context | `useTopicUpsertContext` | route param → `mode = create | update`; **update nạp E2 qua `topicManagementService` + `useFetch`** (`loading`/`isMissing`/404); create = draft rỗng đồng bộ (cefr A1, category DINING) | — (chỉ resolve; `isMissing` → `EmptyState`) |
| Topic draft | `useTopicBasicInfoForm` | create: draft rỗng (cefr A1, category DINING, các field khác trống); update: map từ wire `TopicManagementResponse` | **Chỉ `titleEn` + `titleVi`** (luật nháp, FR-01/03) |
| Topic list | `useTopicList` (mới) | **E4 `GET /api/management/topics` server-side** (search/filter/page, `useFetch`); `counters` từ API (không theo filter) | — |
| Items list | `useTopicItemsOverview` | create: mock + quality; update: `snapshot?.items`/`snapshot?.quality` (tùy chọn, F06 sẽ nối thật) | — (chỉ `selectedId`, `removeItem` local) |
| Context draft | `useTopicItemContextForm` | `TOPIC_ITEM_CONTEXT_DEFAULT_DRAFT` (chung mọi item!) | title + desc + ≥1 turn có `speaker` + `textEn` |
| Vocabulary list | `useTopicItemVocabularyForm` | `TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD` (chung mọi item!) | 1..5 items, mỗi item có `word` + `meaningVi` + ≥1 example EN |
| Expressions purposes | `useTopicItemExpressionsForm` | `TOPIC_EXPRESSIONS_MOCK_CHOOSING_FOOD` (chung mọi item!) | 1..3 purposes, mỗi purpose có EN/VI + 1..3 examples có EN/VI; audio null vẫn valid |
| Quiz groups | `useTopicItemQuizForm` | `TOPIC_QUIZ_MOCK_CHOOSING_FOOD` (chung mọi item!) | Mọi nhóm ≥2 câu valid — situational: prompt + ≥2 options + đúng 1 `correct` + explanationOk/Ng; fill-blank: EN/VI + `___` + bank ≥2 + correct ∈ bank + tips ≤250 |

Lưu ý quan trọng:

- Mode upsert suy ra từ route, không lưu state riêng: có `:topicId` → update, không có → create. Update mode nạp E2 qua service + `useFetch` (`loading`/`isMissing`/404); `topicId` lạ (404) → `EmptyState`. Create = draft rỗng đồng bộ (cefr A1, category DINING).
- Status item chỉ có **2 giá trị lưu trữ**: `publicationStatus: "DRAFT" | "PUBLISHED"` + completeness suy ra (`getTopicItemCompleteness`). 4 nhãn Stitch chỉ là mapping hiển thị trong `TopicItemStatusPill` — chi tiết xem [02] §4.
- Context `speaker` là tên edit được (`maxLength=16`), `ContextDialogueRole` chỉ để neo styling — xem [03] §4.
- Vocab dialog validate riêng (word + VI + ≥1 example EN), `audioFile` mới chỉ là **tên file** — xem [04] §4–§5.
- Kiểu chữ hoa/thường đang lệch: topic dùng `"published" | "draft"`, item dùng `"DRAFT" | "PUBLISHED"` — hợp nhất khi gắn API ([02] §5.6).
- Expressions `purposeOptions` chỉ sống trong session (dedupe từ `purposes` local, không load global/DB); `purpose_en` trùng → auto-fill `purpose_vi` — xem [05] §4.
- Quiz fix cứng 2 nhóm (không CRUD nhóm); dialog chung route câu vào đúng nhóm theo loại, khóa loại khi edit; `explanation` fill-blank nullable, `audioUrl` là URL string (khác `audioFile` tên file của expressions) — xem [06] §4.

## 6. Nợ UI-only tổng hợp (gắn API thật thì xử lý)

| Việc | Màn liên quan | Chi tiết ở | Trạng thái |
|------|---------------|------------|------------|
| Thay mock bằng service + `useFetch` | List + upsert | [01] §5.1, [List] management-list-wiring.md §5 | **Đã thực hiện (F05 wiring)** |
| Gắn `onSaveDraft` cho footer | Tất cả | [01] §5.3, [02] §5.4, [03] §5.2, [04] §5.2, [06] §5.2 | **Đã thực hiện (F05 wiring)**: "Lưu thay đổi"/"Lưu nháp" → E1/E3; "Tiếp tục" create → E1 POST → navigate items, update → E3 PATCH → navigate items |
| Upload cover thật (16:9, ≤2MB, preview) | [01] | [01] §5.2 | Chưa làm (F08) |
| Reorder kéo-thả + persist `order` | [02], [04] | [02] §5.2, [04] §5.4 (`moveItem` đã để sẵn, chưa đấu UI) | Chưa làm (F06) |
| Dialog tạo item + confirm xóa | [02], [04] | [02] §5.3/§5.5, [04] §5.5 | Chưa làm (F06) |
| Draft theo `itemId` (hiện 1 draft chung) | [03], [04], [06] | [03] §5.5, [04] §5.6, [06] §5.5 | Chưa làm (F06) |
| Audio upload + phát preview thật | [04], [05], [06] | [04] §5.3, [05] §5.3, [06] §5.3 | Chưa làm (F06/F07) |
| Dựng step 3 Review (quiz đã xong ở [06]) | [02] | [02] §5.4, [01] §5.4 | Chưa làm |
| Nối entry "Mở chỉnh sửa (Bước 2)" từ list vào update mode | [List], [01] | [01] §2/§8 | **Đã thực hiện (F05 wiring)**: row click + menu item → `adminTopicBasicInfoPath(topic.id)` |
| Thêm loại quiz `MATCHING` / `SENTENCE_ORDER` | [06] | [06] §5.6 | Chưa làm |
| Wizard đa bước: nâng state lên route cha/store | Tất cả | mục cuối checklist mỗi file | Chưa làm |
| Gắn API thật cho luồng upsert + list theo contract BE (F05) | [01], [List] | §9 của README này + management-list-wiring.md | **Đã thực hiện (F05 wiring)** |

## 7. Tìm vấn đề nhanh (debug map)

| Triệu chứng | Đọc file | Xem component/hook |
|-------------|----------|--------------------|
| Nút "Tiếp tục" không sang trang | [01] §4 / [03] §4 / [04] §4 / [05] §4 / [06] §4 | `isValid` + `showErrors` trong `useTopicBasicInfoForm` / `useTopicItemContextForm` / `useTopicItemVocabularyForm` / `useTopicItemExpressionsForm` / `useTopicItemQuizForm` |
| Stepper/header sai tiêu đề bước | [02] §3-C0 / [03] §3-C0 | props `title` / `activeStep` truyền vào `TopicUpsertWizardHeader` + `TopicUpsertStepper` |
| Pill trạng thái item hiển thị sai | [02] §4 | `resolveVisual` trong `TopicItemStatusPill.tsx`, không sửa union `publicationStatus` |
| Click card "Sửa" không vào editor | [02] §5.3 → [03] §2 | `onEdit`/`onInit` trong `TopicUpsertItemsView` phải `navigate(topicItemSectionPath(id, "context", topicId))`, dispatcher `TopicItemEditorView` |
| Deep-link `/items/:id/:section` trắng trang | Dispatcher + [03] §3-V1 | guard `isTopicItemSectionKey` trong `TopicItemEditorView` (key lạ → context) + lookup `TOPIC_ITEMS_OVERVIEW_MOCK` → `EmptyState` |
| Mở `/admin/topics/:id/edit` báo "Không tìm thấy chủ đề" | [01] §4 | `getTopicUpsertSnapshot` + `TOPIC_UPSERT_MOCK_SNAPSHOTS` (hiện chỉ `ordering-food`) |
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

## 9. Ghi chú contract BE cho feature này (F05 — đã đóng băng, design r7 / FRC v1.2)

> Ghi ngày **2026-10-23**. Nguồn: `.opencode/workflow/artifacts/topic-management-f05-design.md` r7 + FRC `FRC-topic-management-f05` v1.2 (APPROVED). §4 = contract đã đóng băng.
> **Trạng thái:** FE đang thiết kế wiring (chưa implement code — xem kế hoạch implement của FE lead). Mục đích mục này: FE biết phải bỏ/đổi gì khi gắn API, tránh gửi field không tồn tại (BE trả 400).
> Đây là **ghi chú cross-project, không phải code FE** — task gắn API ở FE là change riêng.

### 9.1 Base path & endpoint

- Base path: **`/api/management/topics`**. Prefix theo **bề mặt quản trị**, không theo vai trò — cả Admin và Content Manager đều quản trị topic nên không dùng `/admin/...`.
- Route **UI** của FE (`/admin/topics/...`, `ROUTES.ADMIN_TOPIC_*`) **không đổi**; tầng service của FE map UI navigation → API path.
- Mọi thành công trả về **đóng gói `ApiResponse<T>{data, timestamp}`**: HTTP body là `{"data": <payload nội dung>, "timestamp": "<ISO>"}`. FE **phải unwrap `.data`** trước khi dùng. E1 POST trả **201** + header `Location` (ngoài body) + body đóng gói. E2/E3/E4 trả **200** + body đóng gói.
- Lỗi **không** được đóng gói: `{ "code", "message", "fieldErrors"? }` — `VALIDATION_ERROR` → 400, `RESOURCE_NOT_FOUND` → 404. `message` tiếng Anh (dành dev) → FE localize theo `code` + `field`, không dịch `message`.

| Màn | Method + path | Kết quả |
|---|---|---|
| Tạo topic | `POST /api/management/topics` | `201` + header `Location` + `ApiResponse<TopicManagementResponse>` |
| Mở topic để sửa | `GET /api/management/topics/{id}` | `200` `ApiResponse<TopicManagementResponse>` |
| Lưu thay đổi | `PATCH /api/management/topics/{id}` | `200` `ApiResponse<TopicManagementResponse>` |
| Danh sách topic | `GET /api/management/topics` | `200` `ApiResponse<TopicManagementListResponse>` |

### 9.2 Field nào **không** có trong API (phải bỏ khỏi payload)

| Field ở FE | Xử lý khi gắn API |
|---|---|
| `tags` (`TopicBasicInfoDraft.tags`) | Không gửi — không có luật nghiệp vụ về tag topic. Có thể giữ là state UI hoặc bỏ hẳn input. |
| `duration` (text "Khoảng 45 phút học…") | Không gửi — thời lượng topic do hệ thống tính, read-only. Render từ `durationMinutes` của response. |
| `coverName` | Đổi thành `coverUrl` (chỉ là **reference** tới ảnh; upload thật thuộc F08). |
| `coverMeta` | Không gửi — chuỗi mô tả hiển thị, không có ý nghĩa nghiệp vụ. |
| `code`, `itemsLabel`, `progress`, `thumbnail` (type `Topic`) | Field mock — format client-side từ `itemCount` / `durationMinutes`. `progress` là tiến độ người học (feature khác). |
| `inProgress` (`TopicManagementStats`) | Bỏ — BE chỉ trả `total` / `published` / `draft`. |

### 9.3 Field & giá trị trên wire

- Request create/update: `titleEn`*, `titleVi`*, `cefr`?, `category`?, `description`?, `coverUrl`?  (`*` = bắt buộc)
- `cefr`: `A1 | A2 | B1 | B2` — gửi `C1`/`C2` sẽ bị **400**.
- `category`: **`DINING | TRAVEL | BUSINESS | DAILY | HEALTH`** → cần **re-key** `TOPIC_CREATE_CATEGORY_OPTIONS` (đang dùng slug `dining-food`, `travel-hospitality`, `business-work`, `daily-social`, `health-emergency`); **label hiển thị giữ nguyên**.
- `status`: `draft | published` (không có `BETA` trong scope này).
- Response có thêm 2 field **tính sẵn**: `durationMinutes` (read-only) và `itemCount`.
- `description` tối đa 250 ký tự (khớp `TOPIC_CREATE_MAX_DESCRIPTION`).
- **Envelope thành công:** mỗi response là `{"data": <payload trên>, "timestamp": "..."}`. FE unwrap `.data` rồi mới dùng các field ở trên. `id` có trong `data` (cần thiết để `AC-17` mở edit từ list).

### 9.4 Hành vi API cần biết

- **PATCH, không PUT.** Ngữ nghĩa gộp: field **vắng** = giữ nguyên · `null` = **xoá** (chỉ field optional) · `titleEn`/`titleVi` rỗng → **400** (tên luôn phải có).
- **Field lạ trong body → 400.** Phải bỏ `tags`/`duration`/`coverMeta` trước khi gửi, nếu không request sẽ bị từ chối.
- **Envelope lỗi**: `{ "code": string, "message": string, "fieldErrors"?: [{ "field": string, "message": string }] }` — `VALIDATION_ERROR` → 400, `RESOURCE_NOT_FOUND` → 404. `message` tiếng Anh (developer-facing) → **FE tự localize theo `code` + `field`**, không dịch `message`. Lỗi thành công thì **đóng gói** `{"data", "timestamp"}` (xem §9.3), lỗi thì **không**.
- **List**: `?search=&cefr=&category=&status=&page=0&size=20` — `page` **0-based**, `size` 1..100, **không có param sort** (thứ tự cố định `updatedAt DESC`). Filter **AND** với nhau. `search` khớp **substring** không phân biệt hoa thường trên `titleEn` **hoặc** `titleVi`. Giá trị `"ALL"` của bộ lọc **bỏ qua** (không gửi param).
- **`counters` tính trên toàn bộ topic quản trị, KHÔNG theo filter** (`total` / `published` / `draft`).
- Item trong list: `id`, `titleEn`, `titleVi`, `cefr`, `category`, `status`, `itemCount`, `updatedAt`.
- Rỗng vẫn trả **200** với `items: []`; phân biệt "không có kết quả" vs "chưa có topic nào" bằng `counters.total === 0`.
- Topic ở trạng thái nháp **không bao giờ** xuất hiện ở bề mặt người học (`/api/topics` — F01, chưa có).

### 9.5 Validate của FE cần nới theo luật nháp

- `useTopicBasicInfoForm.isValid` hiện yêu cầu `titleEn` + `titleVi` + `category` + `duration` + `description`. Theo luật nghiệp vụ, **nháp chỉ cần `titleEn` + `titleVi`**; `category` / `description` / `coverUrl` / `cefr` để trống ở nháp và **bắt buộc khi publish** (F09 — ngoài scope contract này). → Nới `isValid` về 2 field tên.
- Input `duration` trong `TopicGeneralInfoCard` → chuyển thành **hiển thị read-only** lấy từ `durationMinutes`.
- Input `coverName` / `coverMeta` → `coverUrl` (upload thật để F08).

### 9.6 Ngoài scope của contract này

Publish + publish gate (F09), quản lý topic item (F06), tài nguyên học tập — bối cảnh / từ vựng / mẫu câu / quiz (F07), MINOR–MAJOR + gỡ publish (F10), chặn ghi đè khi phiên khác đã sửa (F08), upload ảnh (F08), danh sách topic cho người học (UC01), và **auth / phân quyền** (BE chưa có security; sẽ gắn sau mà không đổi contract này).
