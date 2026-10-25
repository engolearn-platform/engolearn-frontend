# Topic — Bước 2: Danh sách Topic Items (Overview)

> Tài liệu workflow cho màn overview các Topic Item trong luồng tạo topic
> (Stitch: "Admin — 2. Danh sách Topic Items (Overview)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, editor từng item, step 3).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/a38c484e70054522ac0e4a14ae60fa2e`
  ("Admin — 2. Danh sách Topic Items (Overview)", DESKTOP).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).

## 2. Route & trigger point

- Mode tạo mới: `/admin/topics/create/items`
  (`ROUTES.ADMIN_TOPIC_CREATE_ITEMS`).
- Mode cập nhật: `/admin/topics/:topicId/edit/items`
  (`ROUTES.ADMIN_TOPIC_EDIT_ITEMS`). Cùng một view `TopicUpsertItemsView`;
  mode suy ra từ param `topicId` (`useTopicUpsertContext`).
- Khai báo trong `src/features/topic/routes.ts` dưới `ManagementLayout`.
- Trigger: nút "Tiếp tục" trong `TopicUpsertBasicInfoView` (`handleContinue`):
  khi `isValid` → `navigate(adminTopicItemsPath(topicId))` (giữ nguyên mode).
- Nút "Quay lại" của màn này → `navigate(adminTopicBasicInfoPath(topicId))`
  (create → `/admin/topics/create`, update → `/admin/topics/:topicId/edit`).
- `topicId` không có trong mock snapshot → `EmptyState` + "Quay lại danh sách".

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| C0 | `TopicUpsertWizardHeader` | `components/management/upsert/basic-info/TopicUpsertWizardHeader.tsx` (reuse, mở rộng `title?`) | Màn này truyền `title="Bước 2: Danh sách Topic Items"`. Default giữ chuỗi Bước 1 nên view 01 không đổi. |
| C0 | `TopicUpsertStepper` | `components/management/upsert/basic-info/TopicUpsertStepper.tsx` (reuse) | `activeStep={1}`, dùng chung `TOPIC_CREATE_STEPS`. |
| C0 | `TopicUpsertFooterBar` | `components/management/upsert/basic-info/TopicUpsertFooterBar.tsx` (reuse nguyên bản) | Chỉ truyền `onBack` (+ `saveLabel="Lưu thay đổi"` ở mode update); `onSaveDraft`/`onContinue` để trống (UI-only, xem §5). |
| C1 | `TopicItemsHeader` | `components/management/upsert/items/TopicItemsHeader.tsx` | Badges CEFR/Bản nháp/count + H1 + CTA "Thêm Topic Item mới" (shadcn `Button`). |
| C2 | `TopicItemStatusPill` | `components/management/upsert/items/TopicItemStatusPill.tsx` | Pill trạng thái duy nhất mỗi item, map từ 2 trạng thái gốc (§4). `rounded-full`, icon `lucide-react`. |
| C3 | `TopicItemStepPills` | `components/management/upsert/items/TopicItemStepPills.tsx` | 4 pill Bối cảnh/Từ vựng/Mẫu câu/Luyện tập, icon theo `done/partial/empty`. Presentational thuần. |
| C4 | `TopicItemCard` | `components/management/upsert/items/TopicItemCard.tsx` | Learning Card 1 item: rail drag + badge order, H2 EN + VI phụ, C2 + C3, action row. Compose C2 + C3, nút shadcn `ghost`. |
| C5 | `TopicItemsList` | `components/management/upsert/items/TopicItemsList.tsx` | Cột list + dashed Add card; rỗng → reuse shared `EmptyState`. Pass-through props xuống C4. |
| C6 | `TopicScriptQualityCard` | `components/management/upsert/items/TopicScriptQualityCard.tsx` | Sidebar "Chất lượng kịch bản": ring SVG + coverage note + checklist CEFR. Không thêm chart lib. |
| V1 | `TopicUpsertItemsView` | `views/management/TopicUpsertItemsView.tsx` | Container dùng chung create/update: `useTopicUpsertContext` (mode + snapshot) + `useTopicItemsOverview` + navigate. Không fetch. |
| H1 | `useTopicItemsOverview` | `hooks/useTopicItemsOverview.ts` | State `items`, `selectedId` (mặc định `choosing-food` như Stitch nếu tồn tại), `quality`, `selectItem`, `removeItem`; nhận `items`/`quality`/`selectedItemId` từ snapshot ở mode update. |
| H2 | `useTopicUpsertContext` | `hooks/useTopicUpsertContext.ts` | Resolve `mode`, `topicId`, `snapshot`, `isMissing` từ route param. |
| T0 | types & consts | `types/topic-create.types.ts` (append) | `TopicItemPublicationStatus`, `TopicItemStepKey/State/Summary`, `TopicItemCompleteness` + `getTopicItemCompleteness`, `TopicItemOverview`, `TopicScriptQuality`, mock Stitch, `TOPIC_ITEMS_RECOMMENDED_MAX`, `TOPIC_ITEMS_DEFAULT_SELECTED_ID`, `getTopicUpsertSteps`. |

## 4. State & validation hiện tại

- Mode lấy từ `useTopicUpsertContext`:
  - **create:** `items`/`quality` mặc định từ `TOPIC_ITEMS_OVERVIEW_MOCK` +
    `TOPIC_SCRIPT_QUALITY_MOCK`; header badge "Bản nháp".
  - **update:** `items`/`quality`/`selectedItemId` nạp từ snapshot (hiện có
    `ordering-food`); header badge "Đang cập nhật", title "Cập nhật danh sách Topic Items".
- Count note header tính từ state: `{items.length}/{TOPIC_ITEMS_RECOMMENDED_MAX} Bài học tối ưu`
  (thay vì hard-code "4/5").
- Mỗi Topic Item chỉ có **2 trạng thái chính**: `publicationStatus: "DRAFT" |
  "PUBLISHED"` (union string, không enum) và **content completeness** suy ra từ
  các thành phần nhỏ qua `getTopicItemCompleteness(steps)`: `complete` (mọi step
  `done`), `empty` (rỗng hoặc mọi step `empty`), còn lại `partial`.
- 4 mặt hiển thị của Stitch (Hoàn tất / Đang soạn thảo / Mới khởi tạo (Draft) /
  Chưa có dữ liệu) chỉ là **mapping trình bày** trong `TopicItemStatusPill`
  (`resolveVisual`), không phải state lưu trữ:
  `(PUBLISHED, complete)` → "Hoàn tất"; `(DRAFT, partial)` → "Đang soạn thảo";
  `(DRAFT, empty)` có step → "Mới khởi tạo (Draft)"; `(DRAFT, empty)` không step
  nào → "Chưa có dữ liệu".
- `selectedId` là UI state (card "Đang chọn", accent vàng trái). Click card → chỉ
  `selectItem`; nút "Sửa nội dung" / "Khởi tạo nội dung" → navigate editor cùng mode
  (`topicItemSectionPath(id, "context", topicId)`). "Xóa" → `removeItem` (trừ khỏi
  state local, chưa dialog xác nhận, chưa API).

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** `TOPIC_ITEMS_OVERVIEW_MOCK` + `TOPIC_SCRIPT_QUALITY_MOCK` (số liệu
   Stitch: 4 items, 68/100, 8/8 từ, 5/10 câu, 3/4 items) và snapshot update
   `TOPIC_UPSERT_MOCK_SNAPSHOTS` (hiện `ordering-food`). Khi có API: thêm service
   trong `src/shared/services/` + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`, xử lý `loading` (`Loading`) và `error`
   (`EmptyState`) theo pattern `TopicManagementListView`.
2. **Kéo thả đổi thứ tự:** handle `GripVertical` chỉ trang trí (`cursor-grab`,
   `stopPropagation`), chưa có dnd. Khi làm thật: thêm lib dnd + persist `order`.
3. **Thêm item:** `handleAddItem` là no-op có chú thích; `onEdit`/`onInit` đã
   navigate sang editor (giữ `topicId` khi update). Gắn dialog tạo item khi landing.
4. **Footer:** `onSaveDraft`/`onContinue` chưa truyền (chờ endpoint lưu nháp +
   màn 3 Review & Publish). Mode update truyền `saveLabel="Lưu thay đổi"`.
5. **Xóa:** chưa dialog xác nhận — cân nhắc reuse pattern `UnpublishTopicDialog`.
6. **`TopicStatus` vs `TopicItemPublicationStatus`:** `topic.types.ts` đang có
   `"published" | "draft"` (chữ thường) cho quản lý topic; item dùng `"DRAFT" |
   "PUBLISHED"` (chữ hoa) theo spec. Hợp nhất case khi gắn API thật.

## 6. Khác biệt có chủ ý so với HTML Stitch

- Shell (header/sidebar/topbar + bottom bar `fixed`) dùng lại `ManagementLayout`;
  không dựng header/sidebar/footer `fixed left-72` của Stitch.
- **Bỏ cả 2 footer Stitch** (in-content context bar + fixed bottom bar); chỉ dùng
  lại `TopicUpsertFooterBar` (Quay lại / Lưu nháp / Tiếp tục) theo chốt Phase 1.
  Các action "Xem trước toàn bộ" / "Chỉnh sửa Item 02:…" chưa dựng.
- Page gutter theo repo (`max-w-7xl px-5 lg:px-8` như view 01) thay vì
  `max-w-[1240px] px-6` của Stitch; inner **full-width** (không cap `940px` như
  view 01 vì bento 8/4 cần chỗ).
- Nút dùng `rounded-xl` theo quy ước repo (Stitch dùng `rounded-lg`).
- Icon toàn bộ `lucide-react` (Stitch dùng Material Symbols): `drag_indicator→
  GripVertical`, `check_circle→CircleCheck`, `check→Check`, `edit→PenLine`,
  `pending→Clock`, `hourglass_empty→Hourglass`, `pending_actions→ClipboardList`,
  `radio_button_unchecked→Circle`, `warning/error→TriangleAlert/CircleAlert`,
  `add_circle/add→PlusCircle/Plus`, `add_task→ListPlus`, `edit_note→SquarePen`,
  `delete→Trash2`, `analytics→BarChart3`, `schedule→Clock`,
  `arrow_back/forward→ArrowLeft/ArrowRight` (trong FooterBar reuse), `save→Save`.
- Header wizard hiển thị tiêu đề bước 2 + stepper active step 2 thay cho stepper
  tròn (check/2/3) của Stitch — đồng nhất với view 01.

## 7. Responsive

- `sm:` — item row `flex-col → sm:flex-row` (handle + badge xếp ngang trên mobile);
  CTA header `w-full → sm:w-auto`; card padding `p-5 → md:p-6`.
- `md:` — VI phụ `hidden → md:inline`.
- `lg:` — header `flex-col → lg:flex-row lg:items-end`; page gutter `px-5 → lg:px-8`.
- `xl:` — bento `grid-cols-1 → xl:grid-cols-12` (list 8 / sidebar 4, `items-start`);
  sidebar stack dưới list khi `< xl`.
- Footer reuse đã tự stack mobile (`flex-col-reverse`).

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1); draft rỗng khi tạo mới thật.
- [x] Route editor từng item + nối `onEdit`/`onInit` (giữ `topicId` khi update).
- [ ] Dialog tạo item + nối `onAdd` (§5.3).
- [ ] Kéo thả reorder + persist `order` (§5.2).
- [ ] Dialog xác nhận xóa (§5.5); lưu nháp + "Tiếp tục" sang step 3 (§5.4).
- [ ] Hợp nhất `TopicStatus` case (§5.6).
- [ ] Wizard đa bước: nâng state draft + items lên route cha/store.
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
