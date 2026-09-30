# Topic — Bước 2: Biên soạn Mẫu câu giao tiếp (Expressions Editor)

> Tài liệu workflow cho màn editor Mẫu câu của 1 Topic Item trong luồng tạo topic
> (Stitch: "Admin — 5. Biên soạn Mẫu câu giao tiếp (Expressions Editor)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, persist, audio).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/28bc4c4e64f84ec18112b72c2beffc88`
  ("Admin — 5. Biên soạn Mẫu câu giao tiếp (Expressions Editor)", DESKTOP 2560×3702).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).
- HTML đã tải qua `webfetch` từ `htmlCode.downloadUrl` và đối chiếu đầy đủ:
  header fixed + aside `w-72` + tab rail 4 bước + hero card ("Giai đoạn 3" +
  "Thêm mẫu câu mới" `#add-expression-btn`) + 2 nhóm purpose (A: Hỏi gợi ý,
  B: Gọi món) + 4 cards (2 BASIC/POLITE + 1 SLOT + 1 draft) + modal
  `#add-modal` (EN/VI + select nhóm + select vocab đơn + usage) + sticky
  bottom bar + JS inline (open/close modal).

## 2. Route & trigger point

- Reuse route gộp duy nhất: `/admin/topics/create/items/:itemId/:sectionKey`
  (`ROUTES.ADMIN_TOPIC_ITEM_SECTION` + helper
  `topicItemSectionPath(itemId, section)` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` (`path: "create/items/:itemId/:sectionKey"`)
  dưới `ManagementLayout`. Không thêm route, không sửa `ROUTES`.
- Dispatcher `TopicItemEditorView` rẽ nhánh theo `sectionKey`: `"context"` →
  Context view; `"vocabulary"` → Vocabulary view; `"expressions"` → Expressions
  view (mới); còn lại → placeholder; key lạ → `<Navigate>` về context.
- Trigger: tab `3. Mẫu câu giao tiếp` trên `TopicItemSectionTabRail`
  (`src/features/topic/components/create/editor/TopicItemSectionTabRail.tsx`,
  icon `MessagesSquare`) gọi `onSelect("expressions")` →
  `navigate(topicItemSectionPath(itemId, "expressions"))`.
- Back của editor → section `vocabulary` cùng item (explicit, an toàn deep-link).
  Continue (hợp lệ) → section `quiz` (placeholder hiện tại).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicItemEditorView` | `views/management/TopicItemEditorView.tsx` (sửa, +1 nhánh) | Thêm `sectionKey === "expressions"` → view mới; giữ context/vocabulary + fallback placeholder. |
| V1 | `TopicItemExpressionsEditorView` | `views/management/TopicItemExpressionsEditorView.tsx` (mới) | Container editor: `useParams` lấy `itemId`, lookup mock (lạ → `EmptyState` + nút quay lại), compose C0 + C1..C6 + footer, owns `showErrors` + `dialogOpen/dialogMode/editingId`, điều hướng Back/Continue/Tab, submit dialog (add → `addExampleToPurpose`, edit → `patchExample`). |
| V2 | `TopicItemSectionPlaceholderView` | `views/management/TopicItemSectionPlaceholderView.tsx` (sửa, thu hẹp) | Xóa key `expressions` khỏi `SECTION_COPY` (chỉ giữ `quiz`); thêm guard redirect `expressions` về editor thật. |
| C0 | `TopicCreateWizardHeader` / `TopicCreateStepper` / `TopicCreateFooterBar` / `TopicItemSectionTabRail` | `components/create/*` (reuse) | Header `title="Bước 2: Biên soạn Mẫu câu — {titleEn}"`; stepper `activeStep={1}`; rail `activeSection="expressions"` + notes từ `item.steps`; footer `onBack` → vocabulary, `onContinue` → quiz khi `isValid`. |
| C1 | `ExpressionsHeaderCard` | `components/create/editor/expressions/ExpressionsHeaderCard.tsx` (mới) | Hero section Stitch: icon `MessagesSquare` + H1 + mô tả quy tắc 3 nhóm/3 câu + metric `{totalExamples} mẫu câu · {purposeCount}/{max} nhóm` (`hidden sm:flex`) + shadcn `Button` "Thêm mẫu câu mới". Card `rounded-2xl`. |
| C2 | `PurposeGroupSection` | `components/create/editor/expressions/PurposeGroupSection.tsx` (mới) | 1 nhóm purpose: badge A/B/C + `purposeVi` (H2) + `purposeEn` + count pill + grid examples (`grid-1 → lg:2`). |
| C3 | `ExpressionCard` | `components/create/editor/expressions/ExpressionCard.tsx` (mới) | 1 Learning Card `rounded-2xl p-5 hover:shadow-md`: type pill (BASIC → `text-primary`, POLITE → `text-tertiary`, SLOT → `bg-secondary-fixed/60`) + edit/copy/delete (`Pencil/Copy/Trash2`) + EN headline (slot `[...]` highlight `bg-primary/10 font-mono`) + VI + usage box + footer (C4 + vocab chips `bg-tertiary-fixed`). |
| C4 | `ExpressionAudioChip` | `components/create/editor/expressions/ExpressionAudioChip.tsx` (mới) | Chip audio: có file → nút tròn `Play` + filename mono truncate; `null` → `VolumeX` + "Chưa gắn audio — vẫn lưu nháp được". Preview chỉ UI feedback 1.2s. |
| C5 | `ExpressionsQuickAddSlot` | `components/create/editor/expressions/ExpressionsQuickAddSlot.tsx` (mới) | Slot dashed "Thêm mẫu câu mới (tối đa 3 nhóm, mỗi nhóm 3 mẫu câu)", ẩn khi đầy. Trả `null` khi không visible. |
| C6 | `ExpressionUpsertDialog` | `components/create/editor/expressions/ExpressionUpsertDialog.tsx` (mới) | Modal thêm/sửa dùng shadcn `Dialog` (`max-w-2xl`, body shared `ThinScroll` + footer): (1) Purpose local: EN input + `datalist` options trong session + VI input (auto-fill khi EN khớp, vẫn edit được) + type select 3 options; (2) Nội dung: EN* + hint `[...]`, VI*, usage textarea; (3) Audio: file input (`accept="audio/*"`, hiện tên + nút xóa, trống → `null`); (4) Linked vocab: chips checkbox multi từ step vocabulary. Validate EN/VI purpose + EN/VI example (`ring-error` + msg). |
| H1 | `useTopicItemExpressionsForm` | `hooks/useTopicItemExpressionsForm.ts` (mới) | Mirror vocab form: lookup `TOPIC_ITEMS_OVERVIEW_MOCK`, state `purposes` từ mock choosing-food, `purposeOptions` dedupe theo EN (local), `lookupPurposeVi`, `vocabOptions`/`vocabWordById` từ vocab mock, `addExampleToPurpose` (trùng EN → append, mới → tạo purpose nếu `< MAX`, chặn `>= MAX`), `patchExample/removeExample/duplicateExample/removePurpose`, `findExample`, `totalExamples/canAddPurpose/canAddExample`, `isValid`. |
| T0 | types & consts | `types/topic-create.types.ts` (append) | `ExpressionExampleType` (`"BASIC_SUGGESTION" \| "POLITE_INQUIRY" \| "SLOT_PATTERN"`, union string), `TopicExpressionExample` (`type/textEn/textVi/usageNote/audioFile: string \| null/linkedVocabIds`), `TopicExpressionPurpose` (`purposeEn/purposeVi/orderIndex/examples`), `TopicExpressionTypeOption`, `TOPIC_EXPRESSION_MAX_PURPOSES = 3`, `TOPIC_EXPRESSION_MAX_EXAMPLES = 3`, `TOPIC_EXPRESSION_TYPE_OPTIONS`, mock `TOPIC_EXPRESSIONS_MOCK_CHOOSING_FOOD` (2 purposes/3 examples khớp Stitch + JSON). |

## 4. State & validation hiện tại

- `purposes` là UI state local khởi từ `TOPIC_EXPRESSIONS_MOCK_CHOOSING_FOOD`
  (chung mọi item — chưa persist theo item, giống Context/Vocab).
- `purposeOptions` chỉ sống trong session (dedupe từ `purposes`, không load
  global/DB). `lookupPurposeVi` khớp case-insensitive sau trim.
- Dialog auto-fill: khi `purposeEn` đổi và khớp option có sẵn, `purposeVi` tự
  điền nếu đang trống hoặc vẫn giữ giá trị auto trước đó; user sửa tay VI sẽ
  ngắt auto (reset `lastAutoVi`).
- `isValid` = 1..3 purposes + mọi purpose có EN/VI + 1..3 examples + mọi
  example có EN/VI non-empty. `audioFile` null vẫn valid (draft-optional),
  `linkedVocabIds` cho phép rỗng, `usageNote` optional.
- Thêm khi đầy bị chặn trong hook (`>= MAX` return prev, `addExampleToPurpose`
  trả `false`); xóa direct không confirm. Nhân bản chặn khi nhóm đã đủ 3.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong types + lookup `TOPIC_ITEMS_OVERVIEW_MOCK` theo `itemId`.
   Khi có API: service trong `src/shared/services/` + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`, `loading` → `Loading`, `error` → `EmptyState`.
2. **Lưu nháp:** footer có nút "Lưu nháp" nhưng view chưa truyền `onSaveDraft`
   (chờ endpoint, giống view 01/03/04).
3. **Audio:** chip chỉ animation preview; dialog cho chọn file (`accept="audio/*"`,
   hiện tên + nút xóa) nhưng chỉ lưu **tên file / null** (UI-only, chưa
   upload/phát thật).
4. **Xóa:** direct remove không confirm (khớp Stitch) — cân nhắc confirm dialog
   khi gắn API thật.
5. **Draft theo item:** hiện 1 draft chung; khi gắn API, load/save theo `itemId`
   (nâng lên route cha/store khi làm wizard đa bước).

## 6. Khác biệt có chủ ý so với HTML Stitch

- Shell dùng lại `ManagementLayout` + khung `max-w-[940px]` của Context/Vocab;
  không clone header/sidebar `fixed` + `pl-72` + bottom-bar `left-72` của Stitch.
- Không dựng step-bar tròn của Stitch — dùng `TopicCreateStepper` +
  `TopicItemSectionTabRail` đồng nhất view 02/03/04.
- Dialog làm theo JSON spec thay vì modal Stitch: thêm `purpose_en/vi`
  combobox local + auto-fill (Stitch chỉ select nhóm cứng), thêm `type` select
  enum (Stitch chỉ pill hiển thị), thêm audio file input trong dialog (`null`
  hợp lệ), `linked vocab` multi-checkbox thay vì select đơn.
- Radius chuẩn hoá theo repo: card `rounded-2xl`, button/input
  `rounded-xl`/`rounded-lg`, pill/chip `rounded-full`/`rounded-md`.
- Icon toàn bộ `lucide-react` (`record_voice_over→MessagesSquare`,
  `add_circle→PlusCircle`, `edit→Pencil`, `content_copy→Copy`,
  `delete→Trash2`, `play_arrow→Play`, `volume_up→VolumeX`); không
  Material Symbols.

## 7. Responsive

- Page: `px-5 → lg:px-8`; cột nội dung `max-w-[940px]` full-width mọi breakpoint
  (giống view 03/04).
- Header card `flex-col → lg:row`, metric `hidden sm:flex`, button
  `w-full sm:w-auto`.
- Group grid `grid-1 → lg:2`; card footer `flex-wrap justify-between`;
  audio filename `truncate` không vỡ mobile.
- Dialog `max-w-2xl`, purpose grid `1col → sm:2`, footer
  `flex-col → sm:row justify-end`.
- Tab rail `overflow-x-auto scrollbar-hide`, tab `whitespace-nowrap` (reuse).

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1); draft rỗng/nạp theo `itemId` (§5.5).
- [ ] Gắn endpoint lưu nháp → truyền `onSaveDraft` cho footer (§5.2).
- [ ] Audio thật: upload + phát preview + trạng thái uploaded (§5.3; hiện dialog
  chỉ lưu tên file/null, chip chỉ animation).
- [ ] Confirm xóa (shadcn `Dialog`) trước `removeExample/removePurpose` (§5.4).
- [x] Purpose local + auto-fill + giới hạn 3/3 + type enum + linked vocab multi
  trong dialog — đã làm (UI-only, state local).
- [ ] Wizard đa bước: nâng state draft + purposes lên route cha/store.
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
