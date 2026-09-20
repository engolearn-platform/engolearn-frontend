# Handoff — Triển khai UI "Admin — Quản lý chủ đề" từ Stitch

> Trạng thái: **TẠM DỪNG ở Phase 0** — chưa viết code.
> Lý do: Stitch MCP không xác thực được từ session agent, chưa lấy được thiết kế 2 màn hình.
> Ngày ghi: 2026-09-20.

## 1. Mục tiêu

Triển khai 2 màn hình Stitch vào app:

1. `Admin — Quản lý chủ đề (Topic Management)` — trạng thái **có dữ liệu**.
2. `Admin — Quản lý chủ đề (Rỗng)` — trạng thái **rỗng (không có dữ liệu)**.

Thực chất đây là **một route với 2 trạng thái** (chờ xác nhận lại khi có HTML Stitch).

Quy trình 4 phase (`/stitch-screen`): Phase 0 inspect → dừng xin duyệt →
Phase 1 plan component → dừng xin duyệt → Phase 2 implement →
Phase 3 chạy app + so sánh visual lặp đến khi khớp.

## 2. Quyết định đã chốt với user (không đổi)

| # | Nội dung | Chốt |
|---|----------|------|
| 1 | Feature home | `src/features/topic/` — component admin vào `components/admin/`, view admin vào `views/admin/`. `hooks/` + `types/` giữ phẳng, role-agnostic (đúng `docs/architecture/project-structure.md` §4: split by domain, role split chỉ bên trong feature). |
| 2 | Route | `/admin/topics`, khai báo trong `TopicRoutes` (`src/features/topic/routes.ts`). Shell tạm dùng `EngoAppLayout` cho tới khi có thiết kế sidebar admin riêng từ Stitch. |

## 3. Trạng thái Phase 0

### Đã xong (không cần làm lại)

- Load skill `frontend-ui`; đã đọc `docs/design-system/` đầy đủ:
  - `tokens.yaml` — primary `#006565`, `Hanken Grotesk`, radii/spacing scale.
  - `principles.md` — Modern Minimalism, mobile-first margin 20px, EN > VI hierarchy.
  - `components.md` — Button, Learning Card (`rounded-2xl`, padding 20px).
  - `patterns.md` — Admin Page (`PageHeader` + `PageContent`), List Page (`PageHeader` + `FilterBar` + `ContentCard` > `DataTable`).
- Đã soi codebase:
  - `src/router.tsx` aggregate `XxxRoutes` từ `src/features/*/routes.ts`, import từ `"react-router"`.
  - `src/features/topic/` hiện là trang **learner** (`TopicPage`, route `/topics`) — chưa có code admin.
  - `src/features/grammar/` là reference tốt nhất (đủ `components/ hooks/ types/ views/ routes.ts`, dùng `EmptyState` + `Loading`, `useFetch`, margin `mx-auto max-w-7xl p-5 lg:p-8`, spacer bottom-nav `h-20 md:hidden`).
  - Tái sử dụng được: shadcn `Button` + `Dialog`, shared `EmptyState`/`Loading`/`Card`, `useFetch(fetchFn)` với `(signal: AbortSignal) => Promise<T>`, `cn`, `lucide-react` cho icon.
  - Tokens đã map trong `src/core/assets/css/App.css` (`@theme`).
  - `ROUTES` (`src/shared/constants/app.constants.ts`) chưa có route admin — cần thêm `ADMIN_TOPICS`.

### Chưa làm được (bị chặn)

- Toàn bộ phía Stitch: xác định project, tìm 2 screen, `stitch_get_screen` + `stitch_get_project`,
  tải `htmlCode.downloadUrl` qua `webfetch`, phân tích structure/layout/typography/colors/spacing/breakpoints/components/assets/interactions.

## 4. Lỗi Stitch MCP — nhật ký chẩn đoán đầy đủ

Triệu chứng ban đầu: `stitch_list_projects` lỗi
`Incompatible auth server: does not support dynamic client registration`.
Sau khi user cập nhật API key mới, lỗi đổi thành:

```text
Streamable HTTP error ... "Request is missing required authentication credential.
Expected OAuth 2 access token, login cookie or other valid authentication credential."
```

Các bước đã thử (theo skill `stitch-health`):

1. `opencode mcp list` → `✓ stitch connected` (`https://stitch.googleapis.com/mcp`). ĐẠT.
2. `opencode mcp debug stitch` → OAuth disabled đúng cấu hình. ĐẠT.
3. `npx -y @_davideast/stitch-mcp doctor --verbose` → `API Key: Detected` + `Stitch API: Healthy (200)`. ĐẠT — **key hợp lệ, REST API hoạt động**.
4. Kiểm tra `.opencode/opencode.json` → đúng chuẩn (`oauth: false`, header `X-Goog-Api-Key: {env:STITCH_API_KEY}`). ĐẠT.
5. Phát hiện gốc rễ: `STITCH_API_KEY` **không có trong env của session** dù `.env` có key → header gửi đi rỗng.
6. Đã `setx` key vào Windows User env (verify lưu thành công) + user **restart session 2 lần** → shell mới của session **vẫn không thấy** biến env → sandbox không thừa hưởng env của máy, MCP bridge cũng vậy.

**Kết luận:** key tốt, server tốt, config tốt; đường MCP từ session agent bị chặn ở tầng bridge (header luôn rỗng). Restart thêm không có tác dụng. **Dừng mọi thử MCP.**

## 5. Điều kiện để tiếp tục (cần user cung cấp 1 trong 3)

- **A.** Trên máy user chạy (nơi key hoạt động):
  ```powershell
  $env:STITCH_API_KEY = (Select-String -Path .env -Pattern '^STITCH_API_KEY=' | Select-Object -First 1 -ExpandProperty Line).Substring(15).Trim()
  npx -y @_davideast/stitch-mcp list-projects
  ```
  rồi list screens / get screen, paste `projectId`, `screenId`, `htmlCode.downloadUrl` hoặc HTML vào chat.
- **B.** Screenshot 2 màn hình Stitch (desktop + mobile) hoặc copy HTML từ browser.
- **C.** `projectId` + tên chính xác 2 screen (hoặc share link) kèm mô tả text các khối trên màn hình.

## 6. Kế hoạch triển khai dự kiến (chốt lại khi có dữ liệu Stitch)

Dựa trên pattern List Page + Admin Page của design system:

1. Thêm `ADMIN_TOPICS: "/admin/topics"` vào `ROUTES`.
2. Trong `src/features/topic/`:
   - `types/topic.types.ts` — entity `Topic` dùng chung learner + admin (không định nghĩa 2 lần).
   - `hooks/useAdminTopics.ts` (tên file theo chốt Phase 1) — dùng `useFetch`, không `fetch` trực tiếp trong view.
   - `components/admin/` — PageHeader (Title + Description + Actions), FilterBar/Search, TopicTable (hoặc TopicAdminCard), Dialog tạo/sửa, confirm xóa. `learner/` và `admin/` không import lẫn nhau; đều được import từ `../shared/`, `../../hooks/`, `../../types/`.
   - `views/admin/AdminTopicListView.tsx` — render 3 trạng thái: `Loading` / `EmptyState` + CTA tạo mới (trạng thái Rỗng) / table + FilterBar (trạng thái có dữ liệu).
3. Mở rộng `TopicRoutes` với `{ path: "/admin/topics", Component: EngoAppLayout, children: [...] }`, giữ nguyên route learner `/topics`.
4. Phase 2: `npm run lint` (0 errors) + `npm run build` (`tsc -b && vite build`) — chú ý `import type`, không enum, không dead code (`noUnusedLocals`/`noUnusedParameters`).
5. Phase 3: dev server port 3000, chụp Playwright desktop 1440×900 + mobile 390×844, đối chiếu HTML Stitch, lặp fix đến khi khớp, chạy lại lint + build, tắt server.

## 7. Checklist khi resume

- [ ] Nhận dữ liệu Stitch theo mục 5.
- [ ] Hoàn tất Phase 0: phân tích HTML 2 screen → trình implementation plan → **dừng xin duyệt**.
- [ ] Phase 1: plan chi tiết từng component (name, path, responsibility, reuse/mới, props, responsive) → **dừng xin duyệt**.
- [ ] Phase 2 + Phase 3 theo mục 6.
