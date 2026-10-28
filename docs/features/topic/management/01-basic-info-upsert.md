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
- Trigger cập nhật: (a) click vào mục trong `TopicManagementTable` (row click trên
  tên chủ đề) và (b) action "Mở chỉnh sửa (Bước 2)" trong menu của `TopicManagementTable`,
  cả hai → `navigate(adminTopicBasicInfoPath(topic.id))` (`AC-17`). Cùng view
  `TopicUpsertBasicInfoView`; mode suy ra từ param `topicId` (`useTopicUpsertContext`).
  `topicId` lạ (E2 404) → `EmptyState`.

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
| — | `TopicUpsertBasicInfoView` | `views/management/TopicUpsertBasicInfoView.tsx` | Container dùng chung create/update: `useTopicUpsertContext` (mode + snapshot) làm gate `loading` (`Loading`) / `isMissing` (`EmptyState`); khi snapshot sẵn sàng mới render `TopicBasicInfoForm` với `key={topicId ?? "create"}`. Không fetch. |
| — | `TopicBasicInfoForm` (private, cùng file view) | `views/management/TopicUpsertBasicInfoView.tsx` | Form thật của bước 1: `useTopicBasicInfoForm(snapshot?.basicInfo)` + validate "Tiếp tục" + `POST`/`PATCH`. |
| — | `useTopicUpsertContext` | `hooks/useTopicUpsertContext.ts` | Resolve `mode` (`create`/`update`), `topicId`, `snapshot`, `isMissing` từ route param; snapshot E2 được `useMemo` theo `data` để giữ identity ổn định giữa các render. |
| — | `useTopicBasicInfoForm` | `hooks/useTopicBasicInfoForm.ts` | State `draft`, `patch`, `setCefr`, `addTag`, `removeTag`, `descriptionCount`, `isValid`; nhận `initial` (snapshot ở mode update). |
| — | types & consts | `types/topic-create.types.ts` | `TopicBasicInfoDraft`, option lists, `TOPIC_CREATE_STEPS`, `TOPIC_CREATE_MAX_DESCRIPTION = 250`, default draft Stitch, `TopicUpsertMode`, `TopicUpsertSnapshot`, `TOPIC_UPSERT_MOCK_SNAPSHOTS`, `getTopicUpsertSteps`. |

## 4. State & validation hiện tại

- View dùng chung cho 2 mode; `useTopicUpsertContext` đọc `topicId` từ route:
  - **create** (không có `topicId`): draft khởi tạo từ `TOPIC_CREATE_DEFAULT_DRAFT`
    (rỗng: `cefr = A1`, `category = DINING`, các field khác trống).
  - **update** (`/admin/topics/:topicId/edit`): draft nạp từ
    `snapshot.basicInfo`; header đổi title "Cập nhật thông tin cơ bản của Chủ đề",
    badge "Đang cập nhật", autosave lấy `snapshot.updatedNote`; footer "Lưu thay đổi".
  - `topicId` không tồn tại (E2 `404`) → `EmptyState` + "Quay lại danh sách".
- Mọi field controlled từ `useTopicBasicInfoForm`, `initial` chỉ được đọc ở lần mount.
  Vì E2 là async, view **không** mount form khi `snapshot` chưa có: `TopicUpsertBasicInfoView`
  gate theo `loading`/`isMissing` rồi render `TopicBasicInfoForm` với `key={topicId ?? "create"}`.
  Nhờ vậy draft được nạp từ `snapshot.basicInfo` ngay sau khi fetch xong, và form remount
  (nạp lại draft) khi mở topic khác. Không đồng bộ `initial` bằng effect trong hook.
- Nút "Tiếp tục" validate UI tại chỗ: nếu `!isValid` → `showErrors = true`
  (hiện viền `ring-error` + câu báo lỗi dưới field trống); hợp lệ → navigate sang
  bước 2 cùng mode (`adminTopicItemsPath(topicId)`).
- `description` giới hạn `maxLength = 250`, counter `x / 250 ký tự` cập nhật theo state.
- Stepper dùng `getTopicUpsertSteps(mode, itemCount)` để đổi note
  (update: bước 1 "Đang cập nhật", bước 2 "`n` bài học hiện có") mà không nhân bản component.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Snapshot mode update:** `getTopicUpsertSnapshot(topicId)` đọc
   `TOPIC_UPSERT_MOCK_SNAPSHOTS` (hiện có `ordering-food`). Khi có API: thay bằng
   `topicManagementService.fetchTopicById` + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`, xử lý `loading` (`Loading`) /
   `isMissing` (E2 404 → `EmptyState`) / `error` theo pattern `TopicManagementListView`.
   Create mode = draft rỗng đồng bộ (cefr `A1`, category `DINING`, các field khác
   trống) — không gọi API.
2. **Cover:** placeholder CSS local (icon + badge "1200 x 675 px") — chưa upload/preview
   ảnh thật, chưa gọi API. Khi làm thật: thêm `<input type="file" accept="image/*">`,
   validate 16:9 / ≤2MB, preview object URL, lưu vào `draft.cover*` hoặc upload sớm.
   `coverName` là FE-local, không gửi lên API; map sang `coverUrl` chỉ khi có giá trị.
3. **Lưu nháp / Tiếp tục:** chưa persist (chưa có endpoint). Khi có API:
   `topicManagementService` trong `src/features/topic/services/` (feature service, **không**
   dùng `httpService` vì `baseUrl` là `""` — xem `api-integration.md` §3) với `fetch`
   trực tiếp qua Vite proxy `/api` → BE. Dùng `POST` cho tạo mới (E1), `PATCH` cho
   cập nhật (E3). `onSaveDraft` của footer được gắn:
   - Tạo mới: "Tiếp tục" → `isValid` → `POST` → thành công → `navigate(adminTopicItemsPath(newId))`;
     "Lưu nháp" → `POST` → stay, thông báo thành công.
   - Cập nhật: "Lưu thay đổi" → `PATCH` → stay, thông báo thành công; "Tiếp tục" → `PATCH`
     thành công → `navigate(adminTopicItemsPath(topicId))`.
   Loading/disabled khi submit; lỗi `400` map `fieldErrors` lên từng field, `404` → `EmptyState`,
   `500` → thông báo chung.
   > **Contract BE đã đóng băng** (F05, design r7 / FRC v1.2): `POST/GET/PATCH /api/management/topics[/{id}]`,
   > thành công đóng gói `{"data", "timestamp"}` → FE **unwrap `.data`**; field & giá trị trên wire,
   > field phải bỏ (`tags`, `duration`, `coverMeta`), envelope lỗi, và phần validate cần nới —
   > xem [README §9](./README.md#9-ghi-chú-contract-be-cho-feature-này-f05--đã-đóng-băng).
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
- [x] Mode update nạp draft từ E2 `GET /api/management/topics/{id}` qua service + `useFetch`;
      `loading` → `Loading`, `404` → `isMissing`/`EmptyState`, `500` → thông báo chung.
- [x] Copy mode update (header/badge/footer) + stepper note theo mode.
- [x] Thay default draft bằng draft rỗng khi tạo mới thật (cefr `A1`, category `DINING`, các field khác trống).
- [x] Thay `TOPIC_UPSERT_MOCK_SNAPSHOTS` bằng service + `useFetch` cho upsert (create/update)/save-draft;
      xử lý `loading` (`Loading`) và `error` (`EmptyState`) theo pattern `TopicManagementListView`.
- [x] Nối entry "Mở chỉnh sửa (Bước 2)" từ `TopicManagementTable` vào `ROUTES.ADMIN_TOPIC_EDIT`
      (row click + menu item → `adminTopicBasicInfoPath(topic.id)`, `AC-17`).
- [ ] Upload cover thật (§5.2); tag gợi ý/autocomplete nếu backend hỗ trợ (F08).
- [ ] Dựng step 3 (Review & Publish) + nâng state wizard lên route cha/store.
- [x] Gắn API theo contract BE F05 (README §9): dùng `POST`/`PATCH`/`GET /api/management/topics`,
      bỏ `tags`/`duration`/`coverMeta` khỏi payload, `coverName` → `coverUrl`, re-key `category`
      sang `DINING|TRAVEL|BUSINESS|DAILY|HEALTH`, và **nới `isValid` về chỉ `titleEn` + `titleVi`**
      (nháp không bắt buộc category/duration/description).
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
