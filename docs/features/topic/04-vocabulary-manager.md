# Topic — Bước 2: Quản lý Từ vựng (Vocabulary Manager)

> Tài liệu workflow cho màn editor Từ vựng của 1 Topic Item trong luồng tạo topic
> (Stitch: "Admin — 4. Quản lý Từ vựng (Vocabulary Manager)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, persist, audio).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/93692ea759d444d6a26650d85dc82aae`
  ("Admin — 4. Quản lý Từ vựng (Vocabulary Manager)", DESKTOP 2560×3900).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).
- HTML đã tải qua `webfetch` từ `htmlCode.downloadUrl` và đối chiếu đầy đủ:
  header fixed + aside `w-72` + tab rail 4 bước + header card (metric 4/5 +
  "Thêm từ vựng mới") + 4 vocabulary cards (recommend/order/appetizer/specialty)
  + quick-add slot thứ 5 + modal `#quick-add-modal` + bottom bar + JS inline
  (modal open/close, audio preview giả lập, drag visual).

## 2. Route & trigger point

- Reuse route gộp duy nhất: `/admin/topics/create/items/:itemId/:sectionKey`
  (`ROUTES.ADMIN_TOPIC_ITEM_SECTION` + helper
  `topicItemSectionPath(itemId, section)` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` (`path: "create/items/:itemId/:sectionKey"`)
  dưới `ManagementLayout`. Không thêm route, không sửa `ROUTES`.
- Dispatcher `TopicItemEditorView` rẽ nhánh theo `sectionKey`: `"context"` →
  Context view; `"vocabulary"` → Vocabulary view (mới); còn lại → placeholder;
  key lạ → `<Navigate>` về context.
- Trigger: tab `2. Từ vựng` trên `TopicItemSectionTabRail`
  (`src/features/topic/components/create/editor/TopicItemSectionTabRail.tsx`,
  icon `SpellCheck`, note `(4 từ)`) gọi `onSelect("vocabulary")` →
  `navigate(topicItemSectionPath(itemId, "vocabulary"))`.
- Back của editor → section `context` cùng item (explicit, an toàn deep-link).
  Continue (hợp lệ) → section `expressions` (placeholder hiện tại).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicItemEditorView` | `views/management/TopicItemEditorView.tsx` (sửa, +1 nhánh) | Thêm `sectionKey === "vocabulary"` → view mới; giữ nhánh context + fallback placeholder. |
| V1 | `TopicItemVocabularyEditorView` | `views/management/TopicItemVocabularyEditorView.tsx` (mới) | Container editor: `useParams` lấy `itemId`, lookup mock (lạ → `EmptyState` + nút quay lại), compose C0 + C1..C7 + footer, owns `showErrors` + `dialogOpen/dialogMode/editingId`, điều hướng Back/Continue/Tab, submit dialog (add → `addItem`, edit → `patchItem`). |
| V2 | `TopicItemSectionPlaceholderView` | `views/management/TopicItemSectionPlaceholderView.tsx` (sửa, thu hẹp) | Xóa key `vocabulary` khỏi `SECTION_COPY` (chỉ giữ `expressions/quiz`); thêm guard redirect `vocabulary` về editor thật để deep-link cũ không kẹt placeholder. |
| C0 | `TopicCreateWizardHeader` / `TopicCreateStepper` / `TopicCreateFooterBar` / `TopicItemSectionTabRail` | `components/create/*` (reuse) | Header `title="Bước 2: Biên soạn Từ vựng — {titleEn}"`; stepper `activeStep={1}`; rail `activeSection="vocabulary"` + notes từ `item.steps`; footer `onBack` → context, `onContinue` → expressions khi `isValid`. |
| C1 | `VocabularyHeaderCard` | `components/create/editor/vocabulary/VocabularyHeaderCard.tsx` (mới) | Header section Stitch: icon `SpellCheck` + H1 + mô tả quy tắc 5 từ + metric `{count}/{max}` (`hidden sm:flex`) + shadcn `Button` "Thêm từ vựng mới". Card `rounded-2xl`. |
| C2 | `VocabularyCard` | `components/create/editor/vocabulary/VocabularyCard.tsx` (mới) | 1 Learning Card `rounded-2xl p-5 hover:shadow-md`: handle `GripVertical` (visual) + headline (word `headline-md bold` + POS pill + IPA chip + VI italic) + C3 + actions Sửa (`Pencil`) / Xóa (`Trash2 text-error`) + detail grid (`lg:ml-10`, `xl:grid-cols-12`: C4 span-8 + C5 span-4). POS: verb → `bg-secondary-fixed/40`, noun → `bg-tertiary-fixed`. |
| C3 | `VocabularyAudioChip` | `components/create/editor/vocabulary/VocabularyAudioChip.tsx` (mới) | Chip audio: nút tròn `Volume2` + filename truncate + `BadgeCheck` khi uploaded + "Đã tải lên". Preview chỉ UI feedback (`animate-pulse` 1.2s), không phát audio thật. |
| C4 | `VocabularyExamplesBlock` | `components/create/editor/vocabulary/VocabularyExamplesBlock.tsx` (mới) | List ví dụ: icon `Quote`, EN `font-medium` với `<mark class="bg-secondary-fixed/50">` highlight từ (case-insensitive), VI `block sm:inline` — đúng Stitch + EN > VI hierarchy. |
| C5 | `VocabularyCollocationsBox` | `components/create/editor/vocabulary/VocabularyCollocationsBox.tsx` (mới) | Box collocations `rounded-lg shadow-sm`, chips `rounded-md bg-surface-container`. Trả `null` khi rỗng. |
| C6 | `VocabularyQuickAddSlot` | `components/create/editor/vocabulary/VocabularyQuickAddSlot.tsx` (mới) | Slot thứ N: button full `py-6 rounded-2xl` ("+ Thêm từ vựng thứ {nextIndex} (Tối đa {max} từ...)"), ẩn khi `!canAdd`. Trả `null` khi đầy. |
| C7 | `VocabularyUpsertDialog` | `components/create/editor/vocabulary/VocabularyUpsertDialog.tsx` (mới) | Modal thêm/sửa dùng shadcn `Dialog` (`max-w-2xl`, body dùng shared `ThinScroll`
(`src/shared/components/ThinScroll.tsx`, class `scroll-thin` trong `App.css` —
thanh 6px, track trong suốt, thumb `outline` 35% → hover 55%) + footer sticky): 4 section dọc — (1) Thông tin cơ bản: grid word(span-2)+POS select, IPA+VI (`*`); (2) Audio: file input (`accept="audio/*"`, hiện tên file + nút xóa) + note auto-TTS US; (3) Ví dụ: dynamic list (tối đa 3, tối thiểu giữ 1 row, mỗi row EN textarea + VI input + nút xóa) + nút "Thêm ví dụ"; (4) Collocations: chips pill + input Enter-to-add (tối đa 5, chặn trùng case-insensitive). Validate word+VI+≥1 example EN (`ring-error` + msg, pattern Context form); `audioFile` = file đã chọn hoặc suy từ word (`*_pronunciation_us.mp3`). |
| H1 | `useTopicItemVocabularyForm` | `hooks/useTopicItemVocabularyForm.ts` (mới) | Mirror `useTopicItemContextForm`: lookup `TOPIC_ITEMS_OVERVIEW_MOCK`, state `items` từ mock choosing-food, `patchItem/addItem` (chặn `>= MAX`, `audioUploaded: true`) /`removeItem`/`moveItem` (để sẵn, chưa đấu UI), `count/max/canAdd`, `isValid` (1..MAX items, mọi item có word + meaningVi + ≥1 example EN). |
| T0 | types & consts | `types/topic-create.types.ts` (append) | `VocabularyPos` (`"verb" \| "noun" \| "adjective" \| "phrase"`, union string), `TopicVocabularyExample`, `TopicVocabularyItem` (+`audioFile`, `audioUploaded`), `TopicVocabularyPosOption`, `TOPIC_VOCAB_MAX = 5`, `TOPIC_VOCAB_POS_OPTIONS`, mock `TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD` (4 mục Stitch nguyên văn EN/VI/IPA/examples/collocations). |

## 4. State & validation hiện tại

- `items` là UI state local khởi từ `TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD` (chung
  mọi item — chưa persist theo item, giống Context view §7 trong `03-*`).
- `isValid` = 1..5 items + mọi item có `word`, `meaningVi` non-empty + ≥ 1
  example có `en` non-empty. Continue khi invalid → `showErrors` hiện lỗi inline
  dưới list; valid → sang `expressions`.
- Dialog validate riêng: word + nghĩa Việt + ≥1 example EN bắt buộc (đúng dấu `*`
  của Stitch cho word/VI; example bắt buộc để `isValid` list không bị kẹt);
  collocations + audio optional. Lỗi hiện ngay dưới field/row vi phạm, không cần
  nhảy tab vì dialog là 1 panel dọc scroll.
- Thêm khi đầy (`canAdd=false`) bị chặn ở cả header button (vẫn hiện nhưng
  `handleAdd` return) và slot ẩn hẳn; xóa direct không confirm.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong types + lookup `TOPIC_ITEMS_OVERVIEW_MOCK` theo `itemId`.
   Khi có API: service trong `src/shared/services/` + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`, `loading` → `Loading`, `error` → `EmptyState`.
2. **Lưu nháp:** footer có nút "Lưu nháp" nhưng view chưa truyền `onSaveDraft`
   (chờ endpoint, giống view 01/03).
3. **Audio:** chip chỉ animation preview; dialog cho chọn file (`accept="audio/*"`,
   hiện tên + nút xóa) nhưng chỉ lưu **tên file** (UI-only, chưa upload/phát thật;
   để trống → tên suy từ word, note auto-TTS US).
4. **Sắp xếp:** handle `GripVertical` chỉ visual; `moveItem` trong hook để sẵn
   (up/down) nhưng chưa đấu nút — khi làm kéo-thả thật dùng dnd có sẵn của dự
   án (không thêm lib mới), kèm nút lên/xuống cho a11y.
5. **Xóa:** direct remove không confirm (khớp Stitch) — cân nhắc confirm dialog
   khi gắn API thật để tránh mất dữ liệu.
6. **Draft theo item:** hiện 1 draft chung; khi gắn API, load/save theo `itemId`
   (nâng lên route cha/store khi làm wizard đa bước).

## 6. Khác biệt có chủ ý so với HTML Stitch

- Shell dùng lại `ManagementLayout` + khung `max-w-[940px]` của Context view;
  không clone header/sidebar `fixed` + `pl-72` + bottom-bar `left-72` của Stitch
  (sidebar đó không responsive, app đã có shell riêng).
- Không dựng step-bar tròn (1-check/2-active/3/4) của Stitch — dùng
  `TopicCreateStepper` + `TopicItemSectionTabRail` đồng nhất view 02/03.
- Radius chuẩn hoá theo repo: card `rounded-2xl` (thay `rounded-xl` trong config
  Stitch), button/input `rounded-xl`/`rounded-lg`, pill/chip `rounded-full`/
  `rounded-md` — đúng AGENTS.md + `components.md` (Learning Card 16px/padding 20px).
- Icon toàn bộ `lucide-react` (`spellcheck→SpellCheck`, `drag_indicator→GripVertical`,
  `volume_up→Volume2`, `verified→BadgeCheck`, `edit→Pencil`, `delete→Trash2`,
  `add_circle/add→PlusCircle/Plus`, `format_quote→Quote`, `mic→Mic`); không
  Material Symbols.
- Breadcrumb Stitch (Chủ đề > ... > Topic Item 02 + "Chế độ soạn thảo trực tiếp"
  + "Xem trước người học") không dựng lại — view 03 đã chốt bỏ để giữ 1 cột
  `max-w-[940px]`; metric "4/5" giữ lại trong C1.
- Modal dùng shadcn `Dialog` (overlay/animate/a11y sẵn) thay `fixed hidden` +
  JS class-toggle của Stitch; nút Lưu chỉ đóng dialog + cập nhật list (không
  `alert` như JS Stitch).

## 7. Responsive

- Page: `px-5 → lg:px-8`; cột nội dung `max-w-[940px]` full-width mọi breakpoint
  (giống view 03).
- Header card `flex-col → lg:row`, metric `hidden sm:flex`, button
  `w-full sm:w-auto`.
- Card top `flex-col → lg:flex-row`, actions `self-end → lg:self-start`;
  detail `grid-1 → xl:12` (`lg:ml-10` thụt vào thẳng hàng headline như Stitch);
  VI translation `block → sm:inline`.
- Dialog `max-w-2xl`, form `1col → sm:3 / sm:2`, footer
  `flex-col → sm:row justify-between`; audio filename `truncate` không vỡ mobile.
- Tab rail `overflow-x-auto scrollbar-hide`, tab `whitespace-nowrap` (reuse).

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1); draft rỗng/nạp theo `itemId` (§5.6).
- [ ] Gắn endpoint lưu nháp → truyền `onSaveDraft` cho footer (§5.2).
- [ ] Audio thật: upload + phát preview + trạng thái uploaded (§5.3; hiện dialog
  chỉ lưu tên file, chip chỉ animation).
- [ ] Kéo-thả sắp xếp thật + nút lên/xuống a11y, persist thứ tự (§5.4).
- [ ] Confirm xóa (shadcn `Dialog`) trước `removeItem` (§5.5).
- [x] Ví dụ dynamic (tối đa 3) + collocations (tối đa 5) trong dialog — đã làm
  (UI-only, state local).
- [ ] Wizard đa bước: nâng state draft + items lên route cha/store.
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
