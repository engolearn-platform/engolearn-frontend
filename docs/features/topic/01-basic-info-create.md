# Topic — Bước 1: Thông tin cơ bản (Basic Info Create)

> Tài liệu workflow cho màn tạo topic mới (Stitch: "Admin — 1. Thông tin chủ đề").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, upload ảnh, step 2-3).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/50406265c1db4e358b2bf54c971faa20`
  ("Admin — 1. Thông tin chủ đề (Basic Info)", DESKTOP).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).

## 2. Route & trigger point

- Route: `/admin/topics/create` (`ROUTES.ADMIN_TOPIC_CREATE` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` dưới `ManagementLayout` (dùng lại app shell,
  không clone header/sidebar Stitch).
- Trigger: nút "Tạo topic mới" (`TopicManagementPageHeader`) và nút tạo trong
  `TopicManagementEmptyState` → `navigate(ROUTES.ADMIN_TOPIC_CREATE)`
  (xem `TopicManagementListView.tsx` — `goToCreate`).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| C1 | `TopicCreateWizardHeader` | `components/create/TopicCreateWizardHeader.tsx` | Eyebrow + H1 + pill Draft + autosave (static). Props optional có default. |
| C2 | `TopicCreateStepper` | `components/create/TopicCreateStepper.tsx` | Stepper 3 bước, `activeStep = 0`. Reuse được cho step 2-3 qua prop `steps`/`activeStep`. |
| C3 | `TopicGeneralInfoCard` | `components/create/TopicGeneralInfoCard.tsx` | Card form chính: EN/VI + CEFR + category + duration + description + counter. Controlled hoàn toàn qua `draft`/`onPatch`. |
| C4 | `CefrLevelSelector` | `components/create/CefrLevelSelector.tsx` | 4 pill A1–B2, single-select, `role="radiogroup"`, icon `Check` của `lucide-react`. |
| C5 | `TopicCoverCard` | `components/create/TopicCoverCard.tsx` | Cover 16:9 **placeholder local** (xem §5) + nút "Thay đổi ảnh"/"Xóa" (UI-only). Dùng lại shadcn `Button`. |
| C6 | `TopicTagsInput` | `components/create/TopicTagsInput.tsx` | Tag pill closable + input Enter-để-thêm, chuẩn hóa (trim, bỏ `#` đầu, chống trùng/rỗng). |
| C7 | `TopicCreateTipsCallout` | `components/create/TopicCreateTipsCallout.tsx` | Callout mẹo, presentational, props có default. |
| C8 | `TopicCreateFooterBar` | `components/create/TopicCreateFooterBar.tsx` | "Quay lại" (`navigate(-1)`) / "Lưu nháp" / "Tiếp tục". Sticky trong content (xem §6). |
| — | `TopicCreateBasicInfoView` | `views/management/TopicCreateBasicInfoView.tsx` | Container duy nhất: composition + `useTopicBasicInfoForm` + validate "Tiếp tục". Không fetch. |
| — | `useTopicBasicInfoForm` | `hooks/useTopicBasicInfoForm.ts` | State `draft`, `patch`, `setCefr`, `addTag`, `removeTag`, `descriptionCount`, `isValid`. |
| — | types & consts | `types/topic-create.types.ts` | `TopicBasicInfoDraft`, option lists, `TOPIC_CREATE_STEPS`, `TOPIC_CREATE_MAX_DESCRIPTION = 250`, default draft Stitch. |

## 4. State & validation hiện tại

- Mọi field controlled từ `useTopicBasicInfoForm`, khởi tạo bằng
  `TOPIC_CREATE_DEFAULT_DRAFT` (giá trị mẫu Stitch: "Ordering Food at a Restaurant"...).
- Nút "Tiếp tục" chỉ validate UI tại chỗ: nếu `!isValid` → `showErrors = true`
  (hiện viền `ring-error` + câu báo lỗi dưới field trống), ngược lại ở yên trang
  (chưa có step 2 nên chưa navigate đi đâu).
- `description` giới hạn `maxLength = 250`, counter `x / 250 ký tự` cập nhật theo state.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Cover:** placeholder CSS local (icon + badge "1200 x 675 px") — chưa upload/preview
   ảnh thật, chưa gọi API. Khi làm thật: thêm `<input type="file" accept="image/*">`,
   validate 16:9 / ≤2MB, preview object URL, lưu vào `draft.cover*` hoặc upload sớm.
2. **Lưu nháp / Tiếp tục:** chưa persist (chưa có endpoint, chưa dùng `useFetch`).
   Khi có API: tạo `topicCreateService` trong `src/shared/services/` (hoặc hook
   `useTopicCreate`) với callback `(signal: AbortSignal) => Promise<T>`.
3. **Step 2-3:** `TopicCreateStepper` đã hỗ trợ `activeStep`; chỉ cần thêm view step 2
   (`Danh sách Topic Items`) + step 3 (`Kiểm tra & Xuất bản`) và nâng state draft lên
   route cha hoặc store khi triển khai wizard đa bước.

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

## 7. Responsive

- `sm:` — CEFR `2 → 4 cột`, card padding `p-5 → sm:p-8`, footer `column → row`.
- `md:` — EN/VI, Category/Duration, cover/meta `1 → 2 cột` (`md:grid-cols-2`,
  cover `md:grid-cols-12` 6/6), stepper `1 → 3 cột`.
- `lg:` — page gutter `px-5 → lg:px-8`.
- Mobile: nút footer full-width stack ("Tiếp tục" trên cùng qua `flex-col-reverse`).

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay default draft bằng draft rỗng khi tạo mới thật (giữ const default cho demo/test).
- [ ] Thêm service + `useFetch` cho create/save-draft; xử lý `loading` (`Loading`) và
      `error` (`EmptyState`) theo pattern `TopicManagementListView`.
- [ ] Upload cover thật (§5.1); tag gợi ý/autocomplete nếu backend hỗ trợ.
- [ ] Wizard đa bước: state chung + route `create/items`, `create/review`.
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
