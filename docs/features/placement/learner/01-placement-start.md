# Learner — Giới thiệu bài kiểm tra (P01 Guest / User)

> Tài liệu workflow cho màn giới thiệu Placement Test — điểm vào của luồng
> đánh giá đầu vào cho Guest (Stitch: "P01-GUEST") và User dashboard.
> Trạng thái mock ↔ API toàn package: `00-mock-api-status.md`.

## 1. Nguồn thiết kế (Stitch)

- Project: `Remix of EngoLearn English Learning App`
  (`projects/16234151544679864766`).
- Guest screen: `projects/16234151544679864766/screens/12765962694469204796`
  ("P01-GUEST", `shell-type = web_standard`).
- HTML: `projects/16234151544679864766/files/11862819986987797223`.
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*`.
- User reference: `P01-USER-RESUME`,
  `projects/16234151544679864766/screens/2871998539068848889`.
  Sidebar 240px, top bar 64px, breadcrumb, card thông tin bài kiểm tra;
  Resume card chỉ khi có nguồn dữ liệu thật hợp lệ.

## 2. Route & trigger point

- Route: `/placement` (`PLACEMENT_ROUTES.ROOT` trong
  `src/features/placement/constants.ts`), khai báo trong
  `src/features/placement/routes.ts` dưới `PlacementEntryLayout`:
  Guest → `PlacementPublicLayout`, User → `PlacementUserLayout`.
- Trigger: nav item "Đánh giá đầu vào" trên header public (màn này) và các
  lối vào giới thiệu sau này. Chưa có lối vào từ `/topics` hay `/grammar`.
- CTA "Bắt đầu bài kiểm tra" → `POST /api/v1/placement/attempts`:
  `IN_PROGRESS` → `/placement/attempts/:attemptId`; Guest đã có kết quả
  chưa claim (`SUBMITTED`/`AUTO_SUBMITTED`, `claimRequired`) → `/submitted`.
  User đã có kết quả (`SUBMITTED`/`AUTO_SUBMITTED`, `claimRequired=false`)
  → P04 bằng `attemptId` backend trả, không tạo Attempt mới.
- Ưu tiên resume (BR-F1.16): nếu User còn Attempt User `IN_PROGRESS` và cùng
  trình duyệt còn Guest Result claimable, Start trả Attempt User. Guest Attempt
  đang `IN_PROGRESS` khi đăng nhập giữa bài vẫn được ưu tiên theo BR-F1.15.
  User đã có kết quả hợp lệ luôn được trả về trước Guest Result claimable
  (BR-F1.1).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| L0 | `PlacementPublicLayout` | `components/learning/PlacementPublicLayout.tsx` | Shell public: header + `<main>` + `Outlet`. Dùng cho Guest P01 và trang `/submitted`. |
| C0 | `PlacementPublicHeader` | `components/learning/PlacementPublicHeader.tsx` | Header sticky; Guest dùng Login/Register chung với return-to; User hiển thị email + logout; hamburger mobile. Active item suy từ `useLocation`. |
| V0 | `PlacementStartView` | `views/learning/PlacementStartView.tsx` | Guest giữ container/card hiện tại; User render `PlacementUserStartContent` trong dashboard. Cùng `usePlacementStart`. |
| C1 | `PlacementOverviewCard` | `components/learning/PlacementOverviewCard.tsx` | Card `rounded-2xl p-5 sm:p-8` + border + `shadow-sm`. |
| C2 | `PlacementInfoGrid` | `components/learning/PlacementInfoGrid.tsx` | 4 tile (`grid-cols-2 md:grid-cols-4`): 20 câu / 15 phút / Reading & Listening / A1–B2. |
| C3 | `PlacementChecklist` | `components/learning/PlacementChecklist.tsx` | 4 rule với icon `Check` trong vòng tròn primary. |
| C4 | `PlacementGuestNotice` | `components/learning/PlacementGuestNotice.tsx` | Callout `Info` — "chưa cần đăng nhập, làm bài trước rồi đăng nhập để xem kết quả". |
| C5 | `PlacementStartCta` | `components/learning/PlacementStartCta.tsx` | shadcn `Button size="lg"` `rounded-xl h-12`, loading `Loader2`, `error` `role="alert"`, footnote. |
| H1 | `usePlacementStart` | `hooks/usePlacementStart.ts` | `{ start, starting, error }`; `start()` trả `PlacementStartResult \| null`; bọc lỗi thành message tiếng Việt. |
| L1 | `PlacementEntryLayout` | `components/learning/PlacementEntryLayout.tsx` | Auth loading trước khi chọn Guest public/User dashboard shell. |
| L2 | `PlacementUserLayout` + `PlacementUserSidebar` + `PlacementUserTopBar` | `components/learning/user/` | User shell có branding/nav Placement active, email/avatar initial từ Auth, logout chung; menu mobile. |
| C6 | `PlacementUserStartContent` | `components/learning/user/PlacementUserStartContent.tsx` | Dashboard introduction riêng User; reuse C2/C3/C5 và constants; không render Guest notice. |
| S1 | `placement.service.ts` | `services/placement.service.ts` | `startPlacementAttempt()` gọi backend thật, nhận `attemptId`, `status`, `deadlineAt`, `claimRequired`. |
| T0 | types | `types/placement.types.ts` | `PlacementAttemptStatus`, `PlacementStartResult`, `PlacementInfoItem`, `PlacementIntroRule`, `PlacementNavItem` (string union, không enum). |

## 4. State hiện tại

- `PlacementPublicHeader.mobileOpen` — UI state local duy nhất.
- `usePlacementStart` giữ `starting` / `error`; `attemptId` trả về chỉ dùng
  để điều hướng, **không lưu** ở đâu (không localStorage, không session).
- `useAuth()` là nguồn Guest/User; FE không tự tính ownership hoặc deadline.
- P01 User chỉ có Start presentation; không có `attemptId` trước khi bấm CTA.
  `POST start` không được gọi khi mount để dò attempt. `GET attempt` cần id,
  nên không thể hiện tiến độ/answered/time hoặc Resume card tự động từ contract
  hiện có. Khi bấm CTA, backend trả attempt cũ hoặc result theo precedence hiện tại.

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Bắt đầu attempt:** backend tạo/resume, trả 201 hoặc 200; FE không tự cấp
   deadline. Shared `httpService` gọi `/api/v1/placement/attempts` cùng origin,
   Vite proxy tới backend; cookie Guest và Auth do browser quản lý.
2. **Nav:** Login/Register dùng route Auth chung; `/about` vẫn disabled.
3. **Guest session:** backend sở hữu one-active-attempt, claim window, deadline;
   browser giữ cookie. BE hiện dùng in-memory sample; restart BE mất attempt.
4. **User:** Login/Register chung cấp cookie HttpOnly; shared AuthProvider gọi
   `/api/v1/auth/me` và phục hồi session qua refresh cookie sau F5. P01/P02
   dùng AuthContext, không dùng navigation state. Logout dùng Auth chung. Nếu cùng cookie còn
   Guest Attempt `IN_PROGRESS`, backend vẫn ưu tiên resume Guest (BR-F1.15);
   User active + Guest finalized claimable → resume User (BR-F1.16).

## 6. Khác biệt có chủ ý so với HTML Stitch

| Stitch | Triển khai | Lý do |
|--------|-----------|-------|
| Nav "Giới thiệu", "Đăng nhập", "Đăng ký" là link thật | Login/Register chung hoạt động; Giới thiệu disabled | Chưa có route `/about` |
| Mobile chỉ có logo + hamburger | Thêm nút "Đăng ký" cạnh hamburger | Giữ CTA chính hiện diện, dùng Auth chung |
| Header chưa có active state rõ | `aria-current="page"` + `text-primary font-semibold` cho `/placement` | A11y + nhận diện vị trí |
| Divider mảnh | `border-t border-outline-variant/60` | Khớp token, không dùng màu tuỳ ý |
| CTA mô tả "Bắt đầu bài kiểm tra" | Giữ nguyên + footnote thời gian tính từ lúc vào làm | Copy từ Stitch |
| P01-USER-RESUME có tiến độ, đồng hồ, lúc lưu, mã phiên và nút Continue | User P01 hiện Start dashboard, không dựng Resume tự động | Chưa có lookup non-mutating lấy attemptId trước CTA; không giả dữ liệu hoặc POST khi mount |
| Stitch có tên Hoàng, tìm kiếm và thông báo | Top bar hiển thị email thật + supporting text; không có search/notification giả | Auth chỉ có email/role, chưa có chức năng tìm kiếm/thông báo reusable |

## 7. Responsive

- Container `max-w-4xl`, padding ngang `px-5` (20px — chuẩn mobile-first).
- Info tiles: 2 cột < `md`, 4 cột ≥ `md`.
- Header: nav + auth ẩn < `lg`; hamburger mở panel absolute dưới header,
  panel chứa nav dọc + auth, đóng khi chọn link.
- CTA full-width trên mobile, auto trên `sm+`.
- User desktop: sidebar 240px + header 64px, nội dung max-width; dưới `lg`
  sidebar chuyển thành menu mở từ top bar, cards/tiles không tràn màn hình.

## 8. Checklist refactor khi gắn backend

- [x] Thay `startPlacementAttempt` bằng HTTP thật (P01 không dùng AbortSignal).
- [x] Đọc ProblemDetail `code`/`detail` trong helper feature-local.
- [ ] Xoá `aria-disabled` khi `/about` có route.
- [x] Chốt shell P02: `PlacementAttemptLayout` (shell trung tính của feature,
      guest và user dùng chung) — xem `02-placement-attempt.md`.
- [x] Cập nhật bảng `00-mock-api-status.md` + doc này cùng lúc.

## Public navigation update — 2026-11-08

Guest shells use the same shared PublicNavigation as home, including the submitted claim gate. This overrides the historical P01/Stitch marketing-header order above. The old PlacementPublicHeader remains for authenticated public-shell states. Attempt timer/header and signed-in learner shell stay unchanged. Public main has id=main-content and tabIndex=-1.
