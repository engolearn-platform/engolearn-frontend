---
description: Triển khai end-to-end 1 màn hình từ Stitch MCP cho EngoLearn frontend — inspect, lập plan, implement đúng thiết kế.
---

# Triển khai màn hình mới từ Stitch (`/stitch-screen`)

Màn hình mục tiêu: **$ARGUMENTS** (tên screen trong Stitch, ví dụ `Web — Lộ trình ngữ pháp`).

Thực hiện đúng 3 phase theo thứ tự. **Dừng lại xin xác nhận của user sau Phase 0 và Phase 1.** Không viết code trước khi plan được duyệt.

## Phase 0 — Inspect Stitch + codebase (không viết code)

1. Nếu Stitch MCP báo lỗi connect/auth (401, `Incompatible auth server`, dynamic client registration, needs authentication) thì load skill `stitch-health` và fix xong mới tiếp tục. Lưu ý: key tốt + server tốt vẫn có thể fail ở tầng MCP bridge của session (header rỗng) — khi đó **dừng mọi thử MCP**, xin user cung cấp `projectId` / `screenId` / `htmlCode.downloadUrl` hoặc HTML/screenshot thay thế (xem `docs/handout/stitch-admin-topic-handoff.md` §4).
2. Load skill `frontend-ui` trước khi làm việc UI.
3. Tìm screen qua Stitch MCP:
   - `stitch_list_projects` → xác định project EngoLearn đúng.
   - `stitch_list_screens` với `projectId` → tìm screen khớp tên trong $ARGUMENTS.
   - `stitch_get_screen` + `stitch_get_project` lấy metadata và design tokens (`designMd`).
   - Dùng `webfetch` tải `htmlCode.downloadUrl` để đọc cấu trúc HTML/CSS chính xác của screen.
4. Phân tích và báo cáo: page structure, layout hierarchy, typography, colors, spacing, responsive behavior (`md:`/`sm:`/`lg:` breakpoints), components, reusable UI patterns, assets (ảnh, icon), interactions.
5. Soi codebase hiện tại: `src/router.tsx` + pattern `src/features/*/routes.ts`, component đã có (`src/core/components/shadcn/`, `src/shared/components/`), `useFetch` (`src/shared/hooks`), design tokens (`docs/design-system/tokens.yaml`, `principles.md`, `components.md`, `patterns.md`), constants (`ROUTES`), aliases (`@/`, `@features/`, `@shared/`).
6. Trả về **implementation plan only**, kèm câu hỏi: feature home đặt ở `src/features/<tên>/` nào.

## Phase 1 — Plan chi tiết từng component (không viết code)

Sau khi user chốt feature home, cho mỗi component ghi rõ:

- component name
- file path
- responsibility
- component tái sử dụng (đã có) hay component mới
- important props (dùng `import type`, không dùng enum — `verbatimModuleSyntax` + `erasableSyntaxOnly` đang bật)
- responsive behavior

Chờ user duyệt plan rồi mới sang Phase 2.

## Phase 2 — Implement

- Tuân thủ kiến trúc feature-based: mỗi feature có `components/ hooks/ types/ views/ routes.ts`, export `XxxRoutes: RouteObject[]` (layout + `children` với `Component`), đăng ký vào `appRoutes` trong `src/router.tsx`, import router từ `"react-router"`.
- Không import chéo giữa các feature. Code dùng chung để ở `src/shared/`, app shell dùng chung ở `src/core/layouts/`. Component đặc thù của feature **chỉ** nằm trong `src/features/<feature>/components/`.
- Tái sử dụng tối đa: `Button` shadcn, `Loading`, `EmptyState`, `useFetch(fetchFn)` với callback `(signal: AbortSignal) => Promise<T>`, `cn`, `lucide-react` cho icon (không dùng Material Symbols, không thêm UI library mới).
- Token EngoLearn đã map trong `src/core/assets/css/App.css` (`@theme`): chỉ dùng màu/spacing/radius/typography của design system — `rounded-2xl` cho Learning Card, `rounded-xl` cho button, `rounded-full` cho pill/chip. Không màu/spacing/radius tùy tiện.
- Giữ nguyên chức năng hiện có, không sửa file không liên quan, không để dead code (`noUnusedLocals`/`noUnusedParameters` làm fail build).
- Xong thì chạy `npm run lint` (0 errors) và `npm run build` (`tsc -b && vite build`).
- Ghi tài liệu workflow của màn vừa làm vào `docs/features/<domain>/NN-<ten-man-hinh>.md` (Stitch source, bản đồ component, state/validation, điểm UI-only, khác biệt có chủ ý vs Stitch, responsive, checklist refactor) để sau này update/refactor/gắn dữ liệu thật có cơ sở. Đặt tên file đánh số thứ tự trong domain (`01-...`, `02-...`).

## Definition of done

- Route mới hiển thị đúng nội dung Stitch trên cả desktop và mobile.
- `npm run lint` 0 errors, `npm run build` thành công.
- Tài liệu màn hình đã ghi vào `docs/features/<domain>/`.
- Không file thừa, không TODO, không secret, không commit/push khi chưa được yêu cầu.
