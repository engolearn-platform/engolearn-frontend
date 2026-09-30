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
5. Soi codebase + docs luồng hiện tại (bắt buộc — docs-first theo `AGENTS.md`):
   - Code: `src/router.tsx` + pattern `src/features/*/routes.ts`, component đã có (`src/core/components/shadcn/`, `src/shared/components/`), `useFetch` (`src/shared/hooks`), design tokens (`docs/design-system/tokens.yaml`, `principles.md`, `components.md`, `patterns.md`), constants (`ROUTES`), aliases (`@/`, `@features/`, `@shared/`).
   - Docs luồng (đọc lười — README trước, file con chỉ khi cần): liệt kê `docs/features/*/` để xác định `<domain>/<scope>` chứa màn mới (ví dụ `topic/management`, `topic/learner`). Đọc `README.md` của scope đó TRƯỚC — chừng đó là đủ để xác định vấn đề: vị trí màn mới trong sơ đồ luồng (§1), route & trigger liên quan (§3), component dùng chung phải reuse (§4 — cấm clone mới), state tầng nào (§5), nợ UI-only (§6).
   - Chỉ mở file con `NN-*.md` khi README chỉ ra cần thiết — tối đa 1–2 file kề trước/kề sau (predecessor → màn mới → successor) hoặc file chia sẻ cùng trigger/component/state, tra qua bảng bản đồ tài liệu (§2). **Cấm đọc hết toàn bộ `NN-*.md` trong scope ngay lần đầu.** Mở thêm khi: trigger vào/ra còn mơ hồ, props shared shell chưa rõ (ví dụ `TopicCreateWizardHeader` + `activeStep`, `TopicItemSectionTabRail`, `LearningFooterNav`), rule validate/navigate chưa chốt (`isValid` + `showErrors`, navigate explicit cho deep-link), hoặc khác biệt có chủ ý vs Stitch chưa rõ.
   - Nếu chưa có doc/scope cho feature → dừng lại, tạo skeleton doc tối thiểu (Stitch → route → component → state → UI-only → responsive → checklist) trước rồi mới code.
6. Trả về **implementation plan only**, gồm mục riêng **"Hòa nhập luồng"**: màn mới đứng ở đâu trong sơ đồ, reuse component/state/route nào từ README, trigger vào/ra là gì, và cập nhật doc nào trong cùng change. Kèm câu hỏi: feature home đặt ở `src/features/<tên>/` nào.

## Phase 1 — Plan chi tiết từng component (không viết code)

Sau khi user chốt feature home, cho mỗi component ghi rõ:

- component name
- file path
- responsibility
- component tái sử dụng (đã có) hay component mới
- important props (dùng `import type`, không dùng enum — `verbatimModuleSyntax` + `erasableSyntaxOnly` đang bật)
- responsive behavior
- ràng buộc luồng: reuse component dùng chung nào trong `README.md` §4 (không clone), trigger/route nào trong §3 bị ảnh hưởng, state tầng nào trong §5 được chạm tới

Chờ user duyệt plan rồi mới sang Phase 2.

## Phase 2 — Implement

- Tuân thủ kiến trúc feature-based: mỗi feature có `components/ hooks/ types/ views/ routes.ts`, export `XxxRoutes: RouteObject[]` (layout + `children` với `Component`), đăng ký vào `appRoutes` trong `src/router.tsx`, import router từ `"react-router"`.
- Không import chéo giữa các feature. Code dùng chung để ở `src/shared/`, app shell dùng chung ở `src/core/layouts/`. Component đặc thù của feature **chỉ** nằm trong `src/features/<feature>/components/`.
- Tái sử dụng tối đa: `Button` shadcn, `Loading`, `EmptyState`, `useFetch(fetchFn)` với callback `(signal: AbortSignal) => Promise<T>`, `cn`, `lucide-react` cho icon (không dùng Material Symbols, không thêm UI library mới).
- Token EngoLearn đã map trong `src/core/assets/css/App.css` (`@theme`): chỉ dùng  màu/spacing/radius/typography của design system — `rounded-2xl` cho Learning Card, `rounded-xl` cho button, `rounded-full` cho pill/chip. Không màu/spacing/radius tùy tiện.
- Giữ nguyên chức năng hiện có, không sửa file không liên quan, không để dead code (`noUnusedLocals`/`noUnusedParameters` làm fail build).
- Xong thì chạy `npm run lint` (0 errors) và `npm run build` (`tsc -b && vite build`).
- Ghi tài liệu workflow của màn vừa làm vào `docs/features/<domain>/<scope>/NN-<ten-man-hinh>.md` (Stitch source, bản đồ component, state/validation, điểm UI-only, khác biệt có chủ ý vs Stitch, responsive, checklist refactor) để sau này update/refactor/gắn dữ liệu thật có cơ sở. Đặt tên file đánh số thứ tự trong domain (`01-...`, `02-...`). Trong **cùng change**: cập nhật `README.md` của scope (sơ đồ luồng, bảng bản đồ tài liệu, bảng route & trigger, bảng nợ UI-only) + bảng mock ↔ API nếu có (`00-*.md`). Đổi route/prop/state mà không cập nhật doc là chưa xong.

## Definition of done

- Route mới hiển thị đúng nội dung Stitch trên cả desktop và mobile.
- `npm run lint` 0 errors, `npm run build` thành công.
- Tài liệu màn hình đã ghi vào `docs/features/<domain>/<scope>/` + `README.md` scope đã cập nhật.
- Không file thừa, không TODO, không secret, không commit/push khi chưa được yêu cầu.
