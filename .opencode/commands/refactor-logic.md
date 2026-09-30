---
description: Refactor logic code cũ (hook/type/service/state/navigation/progress) — docs-first, bản đồ vùng ảnh hưởng, 2 gate duyệt.
---

# Refactor logic có sẵn (`/refactor-logic`)

Target: **$ARGUMENTS** (path/tên hook, type, service, view, route + mô tả vấn đề, ví dụ `TopicProgressContext — sidebar kẹt ở expressions`).

Thực hiện đúng 3 phase theo thứ tự. **Dừng lại xin xác nhận của user sau Phase 0 và Phase 1.** Không viết code trước khi plan được duyệt.

Task lẫn lộn UI + logic (ví dụ vừa sửa state vừa sửa layout): chạy command này trước cho behavior + đi dây, rồi chạy `/polish-ui` sau cho visual.

## Phase 0 — Re-hydrate + inspect (không viết code)

1. Load skill `frontend-ui` nếu sẽ chạm JSX.
2. Locate theo `AGENTS.md`: tìm feature home chứa target (`src/features/*/`), scope docs tương ứng (`docs/features/*/`); đọc `README.md` scope + đúng file `NN-*.md` của (các) màn bị ảnh hưởng (đọc lười — không mở hết package). Chưa có doc → tạo skeleton tối thiểu (Stitch → route → component → state → UI-only → responsive → checklist) trước rồi mới tiếp.
3. Đọc code target + lần ngược import (grep ai đang dùng chung hook/type/service/component này) để lập **bản đồ vùng ảnh hưởng**: file đổi trực tiếp + màn lân cận dùng chung state/component.
4. Trả về: root cause, vùng ảnh hưởng, câu hỏi làm rõ nếu trigger/state còn mơ hồ. **Dừng xin xác nhận.**

## Phase 1 — Plan chi tiết (không viết code)

Cho mỗi file: đổi gì (trước/sau), vì sao, rủi ro regression + cách kiểm (mở lại màn nào, check gì). Ghi rõ mock/type nào đổi và bảng mock↔API (`00-*.md`) nào phải cập nhật theo.

**Chờ user duyệt plan rồi mới sang Phase 2.**

## Phase 2 — Implement

- Tuân thủ `AGENTS.md` (feature-based, alias `@/` `@features/` `@shared/`, `import type`, không enum, không import chéo feature, không dead code).
- Chỉ sửa đúng file trong plan. Chạm JSX thì qua check token design system (skill `frontend-ui`).
- Xong thì chạy `npm run lint` (0 errors) và `npm run build` (`tsc -b && vite build`).
- Trong **cùng change**: cập nhật `NN-*.md` tương ứng + `README.md` scope (sơ đồ luồng, route & trigger, nợ UI-only) + bảng mock↔API nếu đổi state/mock. Đổi route/prop/state mà không cập nhật doc là chưa xong.

## Definition of done

- Behavior đúng trên các màn trong vùng ảnh hưởng, desktop và mobile.
- `npm run lint` 0 errors, `npm run build` thành công.
- Tài liệu cập nhật cùng change (`NN-*.md` + `README` scope + mock↔API nếu liên quan).
- Không file thừa, không TODO, không secret, không commit/push khi chưa được yêu cầu.
