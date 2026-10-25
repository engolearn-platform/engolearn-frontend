# Topic — Bước 1: Thông tin cơ bản (Basic Info Upsert)

> Tài liệu workflow cho bước 1 của wizard upsert topic (tạo mới & cập nhật; Stitch: "Admin — 1. Thông tin chủ đề").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, upload ảnh, step 2-3).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/50406265c1db4e358b2bf54c971faa20`
  ("Admin — 1. Thông tin chủ đề (Basic Info)", DESKTOP).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).

## 2. Route & trigger point

- Mode tạo mới: `/admin/topics/create` (`ROUTES.ADMIN_TOPIC_CREATE`).
- Mode cập nhật: `/admin/topics/:topicId/edit` (`ROUTES.ADMIN_TOPIC_EDIT`).
  Cùng một view `TopicUpsertBasicInfoView`; mode suy ra từ param `topicId`
  (`useTopicUpsertContext`).
- Khai báo trong `src/features/topic/routes.ts` dưới `ManagementLayout` (dùng lại
  app shell, không clone header/sidebar Stitch).
- Trigger tạo mới: nút "Tạo topic mới" (`TopicManagementPageHeader`) và nút tạo
  trong `TopicManagementEmptyState` → `navigate(ROUTES.ADMIN_TOPIC_CREATE)`
  (xem `TopicManagementListView.tsx` — `goToCreate`).
- Trigger cập nhật: mở URL trực tiếp (mock hiện có: `/admin/topics/ordering-food/edit`).
  Action "Mở chỉnh sửa (Bước 2)" trong `TopicManagementTable` vẫn UI-only, chưa nối
  navigate — sẽ gắn ở change riêng.

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| C1 | `TopicUpsertWizardHeader` | `components/management/upsert/basic-info/TopicUpsertWizardHeader.tsx` | Eyebrow + H1 + pill Draft + autosave (static). Props optional có default. |
| C2 | `TopicUpsertStepper` | `components/management/upsert/basic-info/TopicUpsertStepper.tsx` | Stepper 3 bước, `activeStep = 0`. Reuse được cho step 2-3 qua prop `steps`/`activeStep`. |
| C3 | `TopicGeneralInfoCard` | `components/management/upsert/basic-info/TopicGeneralInfoCard.tsx` | Card form chính: EN/VI + CEFR + category + duration + description + counter. Controlled hoàn toàn qua `draft`/`onPatch`. |
| C4 | `CefrLevelSelector` | `components/management/upsert/basic-info/CefrLevelSelector.tsx` | 4 pill A1–B2, single-select, `role="radiogroup"`, icon `Check` của `lucide-react`. |
| C5 | `TopicCoverCard` | `components/management/upsert/basic-info/TopicCoverCard.tsx` | Cover 16:9 **placeholder local** (xem §5) + nút "Thay đổi ảnh"/"Xóa" (UI-only). Dùng lại shadcn `Button`. |
| C6 | `TopicTagsInput` | `components/management/upsert/basic-info/TopicTagsInput.tsx` | Tag pill closable + input Enter-để-thêm, chuẩn hóa (trim, bỏ `#` đầu, chống trùng/rỗng). |
| C7 | `TopicUpsertTipsCallout` | `components/management/upsert/basic-info/TopicUpsertTipsCallout.tsx` | Callout mẹo, presentational, props có default. |
| C8 | `TopicUpsertFooterBar` | `components/management/upsert/basic-info/TopicUpsertFooterBar.tsx` | "Quay lại" / "Lưu nháp" / "Tiếp tục". Mode update truyền `saveLabel="Lưu thay đổi"`; back create `navigate(-1)`, update về danh sách topic. |
| — | `TopicUpsertBasicInfoView` | `views/management/TopicUpsertBasicInfoView.tsx` | Container dùng chung create/update: `useTopicUpsertContext` (mode + snapshot) + `useTopicBasicInfoForm(initial)` + validate "Tiếp tục". Không fetch. |
| — | `useTopicUpsertContext` | `hooks/useTopicUpsertContext.ts` | Resolve `mode` (`create`/`update`), `topicId`, `snapshot`, `isMissing` từ route param. |
| — | `useTopicBasicInfoForm` | `hooks/useTopicBasicInfoForm.ts` | State `draft`, `patch`, `setCefr`, `addTag`, `removeTag`, `descriptionCount`, `isValid`; nhận `initial` (snapshot ở mode update). |
| — | types & consts | `types/topic-create.types.ts` | `TopicBasicInfoDraft`, option lists, `TOPIC_CREATE_STEPS`, `TOPIC_CREATE_MAX_DESCRIPTION = 250`, default draft Stitch, `TopicUpsertMode`, `TopicUpsertSnapshot`, `TOPIC_UPSERT_MOCK_SNAPSHOTS`, `getTopicUpsertSteps`. |

## 4. State & validation hiện tại

- View dùng chung cho 2 mode; `useTopicUpsertContext` đọc `topicId` từ route:
  - **create** (không có `topicId`): draft khởi tạo từ `TOPIC_CREATE_DEFAULT_DRAFT`
    (giá trị mẫu Stitch: "Ordering Food at a Restaurant"...).
  - **update** (`/admin/topics/:topicId/edit`): draft nạp từ
    `snapshot.basicInfo`; header đổi title "Cập nhật thông tin cơ bản của Chủ đề",
    badge "Đang cập nhật", autosave lấy `snapshot.updatedNote`; footer "Lưu thay đổi".
  - `topicId` không có trong mock snapshot → `EmptyState` + "Quay lại danh sách".
- Mọi field controlled từ `useTopicBasicInfoForm`, `initial` chỉ dùng ở lần mount
  (route create/update là 2 route khác nhau nên view remount khi đổi mode).
- Nút "Tiếp tục" validate UI tại chỗ: nếu `!isValid` → `showErrors = true`
  (hiện viền `ring-error` + câu báo lỗi dưới field trống); hợp lệ → navigate sang
  bước 2 cùng mode (`adminTopicItemsPath(topicId)`).
- `description` giới hạn `maxLength = 250`, counter `x / 250 ký tự` cập nhật theo state.
- Stepper dùng `getTopicUpsertSteps(mode, itemCount)` để đổi note
  (update: bước 1 "Đang cập nhật", bước 2 "`n` bài học hiện có") mà không nhân bản component.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Snapshot mode update:** `getTopicUpsertSnapshot(topicId)` đọc
   `TOPIC_UPSERT_MOCK_SNAPSHOTS` (hiện có `ordering-food`). Khi có API: thay bằng
   service + `useFetch` với callback `(signal: AbortSignal) => Promise<T>`, xử lý
   `loading` (`Loading`) / `error` (`EmptyState`) theo pattern `TopicManagementListView`.
2. **Cover:** placeholder CSS local (icon + badge "1200 x 675 px") — chưa upload/preview
   ảnh thật, chưa gọi API. Khi làm thật: thêm `<input type="file" accept="image/*">`,
   validate 16:9 / ≤2MB, preview object URL, lưu vào `draft.cover*` hoặc upload sớm.
3. **Lưu nháp / Tiếp tục:** chưa persist (chưa có endpoint, chưa dùng `useFetch`).
   Khi có API: `topicUpsertService` trong `src/shared/services/` (hoặc hook
   `useTopicUpsert`) với callback `(signal: AbortSignal) => Promise<T>`; dùng
   POST cho tạo mới, PATCH cho cập nhật. `onSaveDraft` hiện chưa truyền.
   > **Contract BE đã đóng băng** (F05, 2026-10-20): `POST/GET/PATCH /api/management/topics[/{id}]`,
   > field & giá trị trên wire, field phải bỏ (`tags`, `duration`, `coverMeta`), envelope lỗi, và
   > phần validate cần nới — xem [README §9](./README.md#9-ghi-chú-contract-be-cho-feature-này-f05--đã-đóng-băng).
4. **Step 2-3:** `TopicUpsertStepper` đã hỗ trợ `activeStep`/`steps`; step 3
   (`Kiểm tra & Xuất bản`) chưa có view. Khi triển khai wizard đa bước: nâng state
   draft lên route cha hoặc store.

## 6. Khác biệt có chủ ý so với HTML Stitch

- Shell (header/sidebar/topbar) dùng lại `ManagementLayout` + `ManagementSidebar` +
  `ManagementTopBar`; không dựng header/sidebar/footer `fixed left-72` của Stitch.
- Footer actions là `sticky bottom-4` trong content thay vì fixed full-width.
- Page gutter theo codebase list view (`px-5 lg:px-8`, container `max-w-7xl`, form
  `max-w-[940px]`) thay vì `px-6` của Stitch để đồng nhất.
- Nút dùng `rounded-xl` theo quy ước repo (Stitch dùng `rounded-lg`).
- Icon toàn bộ `lucide-react` (Stitch dùng Material Symbols) — xem bảng map trong
  Phase 0 (`translate→Languages`, `schedule→Clock`, `photo_camera→Camera`,
  `delete→Trash2`, `recommend→Lightbulb`, ...).
- Ảnh cover Stitch (hotlink `aida-public`) không dùng lại — thay bằng placeholder local.
- Copy mode update khác create ở title/badge/save label; layout và component giữ nguyên.

## 7. Responsive

- `sm:` — CEFR `2 → 4 cột`, card padding `p-5 → sm:p-8`, footer `column → row`.
- `md:` — EN/VI, Category/Duration, cover/meta `1 → 2 cột` (`md:grid-cols-2`,
  cover `md:grid-cols-12` 6/6), stepper `1 → 3 cột`.
- `lg:` — page gutter `px-5 → lg:px-8`.
- Mobile: nút footer full-width stack ("Tiếp tục" trên cùng qua `flex-col-reverse`).

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [x] View dùng chung create/update (`TopicUpsertBasicInfoView`) + route edit.
- [x] Mode update nạp draft từ snapshot mock theo `topicId`; thiếu snapshot → `EmptyState`.
- [x] Copy mode update (header/badge/footer) + stepper note theo mode.
- [ ] Thay default draft bằng draft rỗng khi tạo mới thật (giữ const default cho demo/test).
- [ ] Thay `TOPIC_UPSERT_MOCK_SNAPSHOTS` bằng service + `useFetch` cho upsert (create/update)/save-draft;
      xử lý `loading` (`Loading`) và `error` (`EmptyState`) theo pattern `TopicManagementListView`.
- [ ] Nối entry "Mở chỉnh sửa (Bước 2)" từ `TopicManagementTable` vào `ROUTES.ADMIN_TOPIC_EDIT`.
- [ ] Upload cover thật (§5.2); tag gợi ý/autocomplete nếu backend hỗ trợ.
- [ ] Dựng step 3 (Review & Publish) + nâng state wizard lên route cha/store.
- [ ] Gắn API theo contract BE F05 (README §9): dùng `POST`/`PATCH`/`GET /api/management/topics`,
      bỏ `tags`/`duration`/`coverMeta` khỏi payload, `coverName` → `coverUrl`, re-key `category`
      sang `DINING|TRAVEL|BUSINESS|DAILY|HEALTH`, và **nới `isValid` về chỉ `titleEn` + `titleVi`**
      (nháp không bắt buộc category/duration/description).
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
