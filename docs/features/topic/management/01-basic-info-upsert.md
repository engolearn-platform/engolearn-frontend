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
| C1 | `TopicUpsertWizardHeader` | `components/management/upsert/basic-info/TopicUpsertWizardHeader.tsx` | Eyebrow + H1 + pill trạng thái và lần cập nhật từ API. Props optional có default. |
| C2 | `TopicUpsertStepper` | `components/management/upsert/basic-info/TopicUpsertStepper.tsx` | Stepper 3 bước, `activeStep = 0`. Reuse được cho step 2-3 qua prop `steps`/`activeStep`. |
| C3 | `TopicGeneralInfoCard` | `components/management/upsert/basic-info/TopicGeneralInfoCard.tsx` | Card form chính: EN/VI + CEFR + category + duration + description + counter. Controlled hoàn toàn qua `draft`/`onPatch`. |
| C4 | `CefrLevelSelector` | `components/management/upsert/basic-info/CefrLevelSelector.tsx` | 4 pill A1–B2, single-select, `role="radiogroup"`, icon `Check` của `lucide-react`. |
| C5 | `TopicCoverCard` | `components/management/upsert/basic-info/TopicCoverCard.tsx` | Preview bìa từ tham chiếu đã có và control nhập/xóa URL. Dùng lại shadcn `Button`. |
| C6 | `TopicTagsInput` | `components/management/upsert/basic-info/TopicTagsInput.tsx` | Tag pill closable + input Enter-để-thêm, chuẩn hóa (trim, bỏ `#` đầu, chống trùng/rỗng). |
| C7 | `TopicUpsertTipsCallout` | `components/management/upsert/basic-info/TopicUpsertTipsCallout.tsx` | Callout mẹo, presentational, props có default. |
| C8 | `TopicUpsertFooterBar` | `components/management/upsert/basic-info/TopicUpsertFooterBar.tsx` | "Quay lại" / "Lưu nháp" / "Tiếp tục". Mode update truyền `saveLabel="Lưu thay đổi"`; back create `navigate(-1)`, update về danh sách topic. |
| — | `TopicUpsertBasicInfoView` | `views/management/TopicUpsertBasicInfoView.tsx` | Container dùng chung create/update: `useTopicUpsertContext` (mode + snapshot) làm gate `loading` (`Loading`) / `isMissing` (`EmptyState`); khi snapshot sẵn sàng mới render `TopicBasicInfoForm` với `key={topicId ?? "create"}`. Không fetch. |
| — | `TopicBasicInfoForm` (private, cùng file view) | `views/management/TopicUpsertBasicInfoView.tsx` | Form thật của bước 1: `useTopicBasicInfoForm(snapshot?.basicInfo)` + validate "Tiếp tục" + `POST`/`PATCH`. |
| — | `useTopicUpsertContext` | `hooks/useTopicUpsertContext.ts` | Resolve `mode` (`create`/`update`), `topicId`, `snapshot`, `isMissing` từ route param; snapshot E2 được `useMemo` theo `data` để giữ identity ổn định giữa các render. |
| — | `useTopicBasicInfoForm` | `hooks/useTopicBasicInfoForm.ts` | State `draft`, `patch`, `setCefr`, `addTag`, `removeTag`, `descriptionCount`, `isValid`; nhận `initial` (snapshot ở mode update). |
| — | types & consts | `types/topic-create.types.ts` | `TopicBasicInfoDraft`, option lists, `TOPIC_CREATE_STEPS`, `TOPIC_CREATE_MAX_DESCRIPTION = 250`, default draft Stitch, `TopicUpsertMode`, `TopicUpsertSnapshot`, ``getTopicUpsertSteps`. |

## 4. State và lưu nháp

- Form tạo mới yêu cầu tiêu đề EN và VI. CEFR, category, mô tả, cover và tags có thể để trống.
- Form chỉnh sửa khởi tạo từ GET detail và dùng `topicId` làm React key. Khi API trả lỗi, hiển thị trạng thái lỗi và cho thử lại.
- “Lưu nháp” gọi POST một lần rồi chuyển sang URL chỉnh sửa của Topic đã tạo. “Tiếp tục” lưu trước khi mở danh sách bài học của đúng Topic.
- “Lưu thay đổi” gọi PATCH với revision và các trường đã đổi. Backend kiểm tra revision và trả về bản lưu để form tiếp tục chỉnh sửa.
- HTTP 409 giữ nội dung đang nhập. “Tải lại chủ đề” yêu cầu xác nhận trước khi bỏ thay đổi cục bộ. Form cảnh báo khi tải lại hoặc rời trang, khi dùng link điều hướng hoặc nút Quay lại.
- Thời lượng Topic chỉ đọc. Máy chủ tính theo dữ liệu Item hiện hành.

## 5. Contract và media

- Backend trả `{data, timestamp}`. Tạo trả 201 và Location. PATCH phân biệt trường bỏ qua với `null` để xóa giá trị tùy chọn.
- Form cho nhập đường dẫn bìa đã có hoặc tải JPG, PNG, WebP tối đa 5 MB qua MediaManagement sau khi đã lưu Topic. Sau upload, bấm lưu để gắn tham chiếu vào Topic.
- Xem [ma trận và kiểm chứng](./authoring-verification.md) để đối chiếu phạm vi authoring đã chạy.

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

## 8. Kiểm chứng

- [x] POST nháp tối thiểu, PATCH và tải lại qua Vite → Spring Boot → MongoDB.
- [x] Hai phiên sửa đồng thời trả 409 cho revision cũ và giữ dữ liệu đang nhập.
- [x] Kiểm tra giá trị DB trực tiếp sau PATCH và mở lại chế độ chỉ đọc.
- [x] Có control upload bìa qua MediaManagement. Xem báo cáo kiểm chứng để biết tình trạng kiểm tra với provider.
