---
description: Chỉnh visual component/view cũ (layout, token, responsive) — cấm đổi behavior, 1 gate duyệt trước khi code.
---

# Polish UI có sẵn (`/polish-ui`)

Target: **$ARGUMENTS** (path/tên view hoặc component cũ + mô tả vấn đề visual, ví dụ `ExpressionSequenceGroup — card liên từ quá cao, số nên center dọc`).

Command này chỉ cho thay đổi visual. Mọi thay đổi behavior/props/state/route/data flow đều nằm ngoài phạm vi — phát hiện thì dừng lại, báo user, chuyển sang `/refactor-logic`.

Thực hiện đúng 2 phase theo thứ tự. **Dừng lại xin xác nhận của user sau Phase 0.** Không viết code trước khi plan được duyệt.

## Phase 0 — Inspect + plan visual (không viết code)

1. Load skill `frontend-ui` trước.
2. Đọc docs-first theo `AGENTS.md` (đọc lười): `docs/design-system/tokens.yaml` + `components.md` (+ `principles.md` khi đụng typography/layout), file component target, và view cha trực tiếp (để hiểu props truyền vào — không mở sâu hơn nếu chưa cần). Chỉ mở `docs/features/*` khi cần biết ngữ cảnh màn (ví dụ khác biệt có chủ ý vs Stitch trong file `NN-*.md` của màn đó).
3. Trả về plan trong một mục: file đổi, đổi gì (trước/sau), map về token nào (`rounded-2xl` cho Learning Card, `rounded-xl` cho button, `rounded-full` cho pill/chip; màu/spacing/typography đã map trong `@theme` của `src/core/assets/css/App.css`), responsive (`sm:`/`md:`/`lg:`) giữ hay đổi gì.
4. Nếu phát hiện bug logic (state/hook/route/data sai) → không sửa, ghi vào mục "Ngoài phạm vi" và đề xuất chạy `/refactor-logic`.

**Dừng xin xác nhận.**

## Phase 1 — Implement

- Chỉ sửa đúng file trong plan đã duyệt. Cấm: đổi props interface, state, hook, handler behavior, route, data flow; thêm UI library mới; dùng Material Symbols (dùng `lucide-react` cho icon); màu/spacing/radius/font tùy tiện ngoài token.
- Giữ nguyên chức năng hiện có, không sửa file không liên quan, không để dead code (`noUnusedLocals`/`noUnusedParameters` làm fail build).
- Xong thì chạy `npm run lint` (0 errors) và `npm run build` (`tsc -b && vite build`).
- Trong **cùng change**: cập nhật file `NN-*.md` của màn chứa component (mục khác biệt có chủ ý / responsive) nếu visual đổi so với doc. Không đổi behavior thì không cần đụng bảng mock↔API.

## Definition of done

- Hiển thị đúng trên desktop và mobile.
- `npm run lint` 0 errors, `npm run build` thành công.
- Doc cập nhật cùng change (nếu visual lệch doc).
- Không file thừa, không TODO, không secret, không commit/push khi chưa được yêu cầu.
