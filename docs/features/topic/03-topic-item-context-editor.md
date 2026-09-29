# Topic — Bước 2: Biên soạn Bối cảnh (Context Editor)

> Tài liệu workflow cho màn editor Bối cảnh của 1 Topic Item trong luồng tạo topic
> (Stitch: "Admin — 3. Biên soạn Bối cảnh (Context Editor)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, 3 editor còn lại, step 3).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/b0aa0da2ae6c41f884e9e4e4dd663e9c`
  ("Admin — 3. Biên soạn Bối cảnh (Context Editor)", DESKTOP).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).
- HTML Stitch dở dang đã verify: `Image Upload Area` rỗng, label `Audio` rỗng,
  toàn bộ Live Preview card rỗng (JS sync tới `#preview-title/#prompt/#desc`
  nhưng DOM không tồn tại) → cả 3 bị cắt khỏi scope, xem §6.

## 2. Route & trigger point

- Route gộp duy nhất: `/admin/topics/create/items/:itemId/:sectionKey`
  (`ROUTES.ADMIN_TOPIC_ITEM_SECTION` + helper
  `topicItemSectionPath(itemId, section)` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` (`path: "create/items/:itemId/:sectionKey"`)
  dưới `ManagementLayout`. `context` cũng là 1 `sectionKey` nên 4 tab
  (Bối cảnh / Từ vựng / Mẫu câu / Quiz) chung 1 route.
- Dispatcher `TopicItemEditorView` rẽ nhánh theo `sectionKey`: `"context"` →
  editor thật; 3 key còn lại → placeholder; key lạ → `<Navigate>` về context.
- Trigger: nút "Sửa nội dung" / "Khởi tạo nội dung" trên `TopicItemCard`
  (`onEdit`/`onInit`) giờ `navigate(topicItemSectionPath(id, "context"))`
  thay vì `selectItem` như trước (sửa trong `TopicCreateItemsView`).
- Back của editor → `ROUTES.ADMIN_TOPIC_CREATE_ITEMS` (explicit, an toàn deep-link).
  Continue (hợp lệ) → placeholder tab kế (`vocabulary`).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicItemEditorView` | `views/management/TopicItemEditorView.tsx` (mới, ~15 dòng) | Dispatcher duy nhất của route gộp; không chứa UI. |
| V1 | `TopicItemContextEditorView` | `views/management/TopicItemContextEditorView.tsx` (mới) | Container editor: `useParams` lấy `itemId`, lookup mock (lạ → `EmptyState` + nút quay lại), compose C0 + C1 + C2 + C3, owns `showErrors`, điều hướng Back/Continue/Tab. |
| V2 | `TopicItemSectionPlaceholderView` | `views/management/TopicItemSectionPlaceholderView.tsx` (mới) | Đón 3 tab chưa có màn: validate `sectionKey` (lạ → `<Navigate>` context), copy theo section, TabRail vẫn navigate được, Footer chỉ `onBack` → context. |
| C0 | `TopicCreateWizardHeader` / `TopicCreateStepper` / `TopicCreateFooterBar` | `components/create/*` (reuse) | Header truyền `title="Bước 2: Biên soạn Bối cảnh — {titleEn}"`; stepper `activeStep={1}`; footer chỉ truyền `onBack` + `onContinue` (placeholder chỉ `onBack`). |
| C1 | `TopicItemEditorBreadcrumb` | `components/create/editor/TopicItemEditorBreadcrumb.tsx` (mới) | Breadcrumb Stitch: nút "Chủ đề" → `onBackToList`, title truncate `max-w-[200px]`, pill `rounded-full bg-primary-fixed/40 text-primary` "Topic Item XX: …". |
| C2 | `TopicItemSectionTabRail` | `components/create/editor/TopicItemSectionTabRail.tsx` (mới) | Rail 4 tabs: active `bg-primary` + dot `bg-secondary-container-fixed`; inactive card + count pill (quiz rỗng → `bg-error-container`); presentational (`activeSection`, notes, `onSelect`), navigate do view quyết. Icon lucide: `Drama, SpellCheck, MessagesSquare, ListChecks`. |
| C3 | `TopicContextFormCard` | `components/create/editor/TopicContextFormCard.tsx` (mới) | 1 Learning Card chứa toàn bộ form theo khung `TopicGeneralInfoCard`: `FIELD_CLASS`, `RequiredMark`, `showErrors` + `ring-error`. 5 khối: Title (counter n/80) / Prompt (chip "Gợi ý tư duy" + icon `Lightbulb`) / Description (counter n/250, 4 rows) / Dialogue (nút `PlusCircle` + container list) / Duration (select 2/5/10/15 phút, icon `Timer` + `ChevronDown`, theo pattern select Category, optional). |
| C4 | `ContextDialogueTurnRow` | `components/create/editor/ContextDialogueTurnRow.tsx` (mới) | 1 dòng thoại: badge **tên người nói edit được** (input `maxLength={16}`, giữ màu theo role: learner `bg-primary` / còn lại xám; highlight row learner `bg-primary-fixed/20`), input EN (+`font-medium` khi learner) + VI italic, xóa `Trash2 hover:text-error`. |
| H1 | `useTopicItemContextForm` | `hooks/useTopicItemContextForm.ts` (mới) | Mirror `useTopicBasicInfoForm`: `patch`, `updateTurn`, `addTurn` (role xen kẽ waiter/learner, giữ tối thiểu 1 turn khi xóa), `titleCount/descriptionCount`, `isValid`. |
| T0 | types & consts | `types/topic-create.types.ts` (append) | `ContextDialogueRole` (`"waiter" \| "learner"`, union string — neo styling, tên hiển thị nằm ở `speaker` edit được), `ContextDialogueTurn` (+`speaker: string`), `TopicItemContextDraft`, `TOPIC_CONTEXT_TITLE_MAX = 80`, `TOPIC_CONTEXT_DESCRIPTION_MAX = 250`, `TOPIC_ITEM_SECTION_KEYS` + guard `isTopicItemSectionKey`, mock `TOPIC_ITEM_CONTEXT_DEFAULT_DRAFT` (giá trị Stitch của item choosing-food). Reuse `TopicItemStepKey` làm section key, không tạo union mới. |

## 4. State & validation hiện tại

- `draft` là UI state local khởi từ `TOPIC_ITEM_CONTEXT_DEFAULT_DRAFT` (chung mọi
  item — chưa persist theo item, xem §7).
- `isValid` = title & description non-empty + ≥ 1 turn + mọi turn có **tên người
  nói (`speaker`)** và `textEn`.
  `maxLength` chặn 80 (title) / 250 (desc) / 16 (speaker) ngay ở input. Continue
  khi invalid → `showErrors` hiện lỗi inline (pattern `TopicGeneralInfoCard`);
  hiện lỗi inline (pattern `TopicGeneralInfoCard`); valid → sang placeholder Từ vựng.
- `prompt` và `duration` optional (đúng Stitch: không có `*`).

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong types + lookup `TOPIC_ITEMS_OVERVIEW_MOCK` theo `itemId`.
   Khi có API: service trong `src/shared/services/` + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`, `loading` → `Loading`, `error` → `EmptyState`.
2. **Lưu nháp:** `TopicCreateFooterBar` có nút "Lưu nháp" nhưng view chưa truyền
   `onSaveDraft` (chờ endpoint, giống view 02).
3. **Thêm/xóa dòng thoại:** state local, chưa persist; xóa giữ tối thiểu 1 turn.
4. **3 editor còn lại:** V2 placeholder; khi màn thật landing, thêm nhánh trong V0
   mà không cần sửa `routes.ts` hay `ROUTES`.
5. **Draft theo item:** hiện 1 draft chung; khi gắn API, load/save theo `itemId`
   (nâng lên route cha/store khi làm wizard đa bước).

## 6. Khác biệt có chủ ý so với HTML Stitch

- Shell dùng lại `ManagementLayout`; không clone header/sidebar `fixed` + `pl-72`
  của Stitch (sidebar đó không responsive).
- Không dựng step-bar tròn (check/2/3) của Stitch — dùng `TopicCreateStepper`
  đồng nhất view 01/02.
- **Bỏ Live Preview** (theo chốt Phase 0): form 1 cột `max-w-[940px]` như view 01,
  không bento 7/5. JS sync input→preview của Stitch không còn đối tượng.
- **Cắt Upload ảnh + Audio**: HTML Stitch để trống hoàn toàn (không có DOM để đối chiếu).
- Page gutter theo repo (`max-w-7xl px-5 lg:px-8`); card `rounded-xl`, input
  `rounded-lg` theo `TopicGeneralInfoCard`; icon toàn bộ `lucide-react`
  (`theater_comedy→Drama`, `psychology_alt→Lightbulb`, `timer→Timer`,
  `add_circle→PlusCircle`, `delete→Trash2`); không Material Symbols.
- Chi tiết nhỏ: `›` breadcrumb dùng ký tự text thay vì icon (đủ rõ, tránh import thừa).

## 7. Responsive

- Page: `px-5 → lg:px-8`; cột form `max-w-[940px]` full-width mọi breakpoint.
- Card form `p-5 → sm:p-6`; container dialogue `p-3 → sm:p-4`.
- Tab rail `overflow-x-auto scrollbar-hide`, tab `whitespace-nowrap` (giữ 4 tab
  cuộn ngang trên mobile như Stitch).
- Breadcrumb `flex-wrap`, title truncate; turn row `min-w-0 flex-1` không vỡ mobile.
- Footer reuse tự stack mobile (`flex-col-reverse`).

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1); draft rỗng/nạp theo `itemId` (§5.5).
- [ ] Gắn endpoint lưu nháp → truyền `onSaveDraft` cho footer (§5.2).
- [ ] Dựng 3 editor thật (Từ vựng / Mẫu câu / Quiz) + thêm nhánh V0 (§5.4).
- [ ] Persist dialogue turns (thứ tự, role, EN/VI) + validate phía server.
- [ ] Wizard đa bước: nâng state draft + items lên route cha/store.
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
