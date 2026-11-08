# Grammar Management — Bản đồ luồng (README)

> Index điều hướng cho toàn bộ luồng quản lý ngữ pháp (Content Studio).
> Hiện chỉ có màn danh sách; khi thêm màn, đọc README này trước rồi nhảy đúng file con.
> Feature này dùng chung `src/features/grammar/` với màn học viên (learner) — **không** tạo feature `grammarAdmin`.

## 1. Sơ đồ luồng

```
Sidebar "Quản lý Ngữ pháp"
  └─► GrammarAdminRoutes  →  /admin/grammar
        └─ ManagementLayout (shell dùng chung, KHÔNG clone Stitch)
             └─ GrammarTopicListView ("Quản lý chủ đề ngữ pháp")  →  [00]
                   ├─ ManagementPageHeader   (shared)
                   │     ├─ "Xuất CSV"        → UI-only, chưa gắn handler
                   │     └─ "Tạo chủ đề ngữ pháp" → disabled (chờ GA-01)
                   ├─ GrammarTopicStatsGrid  (4 ô KPI, mock độc lập)
                   ├─ GrammarTopicFilterBar  (search + CEFR + trạng thái)
                   └─ card: GrammarTopicTable + ListPagination (shared)

Màn học viên (không đổi):  /grammar  →  GrammarRoadmapView  →  GrammarRoutes
```

Chưa có màn sau GA-00: tạo/sửa chủ đề (GA-01, GA-02), chi tiết chủ đề. Không có route giả cho các màn đó.

## 2. Bản đồ tài liệu

| # | File | Màn (Stitch) | Route | Đọc khi nào |
|---|------|--------------|-------|--------------|
| 00 | [`00-grammar-topic-list.md`](./00-grammar-topic-list.md) | GA-00 — Grammar — Danh sách chủ đề ngữ pháp | `/admin/grammar` | Sửa KPI, filter, bảng, pill CEFR/trạng thái, progress, pagination |

File con giữ cấu trúc 8 mục giống luồng topic: Stitch → Route → Bản đồ component → Props → State → UI-only → Responsive → Checklist refactor.

## 3. Route & trigger — nguồn thật duy nhất

| Chuyển hướng | From → To | Code |
|--------------|-----------|------|
| Mở màn từ sidebar | `/admin/*` → `/admin/grammar` | `MANAGEMENT_CONTENT_NAV_ITEMS` trong `src/core/layouts/components/managementNav.ts` → `ROUTES.ADMIN_GRAMMAR` |
| Breadcrumb topbar | pathname có tiền tố `/admin/grammar` | `ManagementTopBar.tsx` → `sectionLabel` |

Định nghĩa route: `ROUTES.ADMIN_GRAMMAR` trong `src/shared/constants/app.constants.ts`.
Khai báo: `GrammarAdminRoutes` trong `src/features/grammar/routes.ts` (dưới `ManagementLayout`, child `path: ""`).
Đăng ký: `appRoutes` trong `src/router.tsx` spread `...GrammarAdminRoutes`.

## 4. Component dùng chung (đừng clone mới)

| Component | File | Dùng ở |
|-----------|------|--------|
| `ManagementPageHeader` | `src/shared/components/management/ManagementPageHeader.tsx` | Grammar [00]; Topic `TopicManagementPageHeader` là wrapper mỏng |
| `CefrSelect` | `src/shared/components/management/CefrSelect.tsx` | Grammar [00] + Topic `TopicManagementFilterBar` |
| `ListPagination` | `src/shared/components/management/ListPagination.tsx` | Grammar [00]; Topic `TopicManagementPagination` là wrapper mỏng |
| `EmptyState` / `Loading` | `src/shared/components/` | Loading + empty/error state của [00] |

Nguyên tắc: chỉ 3 abstraction này được nâng lên `shared`. KPI grid, table, pill CEFR/trạng thái,
progress cell là component **riêng của feature** trong `components/admin/` — không nhân bản sang `shared`.
Icon dùng `lucide-react`; map Material Symbols → lucide nằm ở [00] §6.

Wrapper ở Topic (`TopicManagementPageHeader`, `TopicManagementPagination`) giữ nguyên tên file, props và
UI cũ; chỉ gọi xuống shared. Vì vậy khi sửa 3 abstraction này phải kiểm tra lại `src/features/topic/`
để chắc chắn UI/behavior Topic không đổi.

## 5. Mô hình state

| Tầng | Hook | Source | Ghi chú |
|------|------|--------|---------|
| Danh sách + KPI | `useGrammarTopicManagement` | `MOCK_TOPICS` (7 dòng) + `MOCK_STATS` | Dùng `useFetch` của `@shared/hooks`, callback nhận `AbortSignal` |
| Filter | `useState` trong view | `GrammarTopicFilter` | `search` + `cefr` + `status`, lọc client-side |
| Phân trang | `useState` trong view | `page` + `pageSize` (mặc định 6) | Truyền xuống `ListPagination` ở chế độ controlled |

**Quan trọng — KPI không suy ra từ danh sách.** `MOCK_STATS` (`total 24`, `published 17`,
`inProgress 3`, `draft 4`) là số liệu toàn thư viện, cố ý tách khỏi `MOCK_TOPICS` (7 dòng mẫu).
Không dùng `reduce` để tính KPI — sẽ ra số liệu sai (7/4/2/1) và lệch Stitch.

## 6. Nợ UI-only tổng hợp

| Việc | Màn | Chi tiết ở |
|------|-----|------------|
| Thay mock bằng service + `useFetch` thật | [00] | [00] §5 |
| Nút "Tạo chủ đề ngữ pháp" + route `create` | [00] | [00] §6 |
| Nút "Xuất CSV" (chưa có handler) | [00] | [00] §6 |
| Row action "Chỉnh sửa" / "…" (chưa có handler) | [00] | [00] §6 |
| API `/admin/*` còn thiếu (nhiều route đã khai báo trong `ROUTES` chưa có view) | toàn repo | ngoài phạm vi docs này |

## 7. Tìm vấn đề nhanh (debug map)

| Triệu chứng | Đọc file | Xem component/hook |
|-------------|----------|--------------------|
| Sidebar bấm "Quản lý Ngữ pháp" trắng trang | [00] §2 | `GrammarAdminRoutes` trong `src/features/grammar/routes.ts` + spread ở `src/router.tsx` |
| Breadcrumb vẫn ghi "Quản lý chủ đề" | [00] §2 | `sectionLabel` trong `ManagementTopBar.tsx` |
| KPI hiện 7/4/2/1 thay vì 24/17/3/4 | [00] §5 | `MOCK_STATS` — cố ý độc lập `MOCK_TOPICS` |
| Filter không lọc | [00] §5 | `matchesFilter` + `patchFilter` trong `GrammarTopicListView` |
| Bảng tràn ngang / vỡ mobile | [00] §7 | `overflow-x-auto` trong `GrammarTopicTable` |
| Trang > số trang sau khi lọc | [00] §5 | `currentPage = Math.min(page, pageCount)` |
| Topic list vỡ sau khi đổi shared component | — | so với `git diff` 3 file topic đã sửa |

## 8. Checklist chung sau mỗi thay đổi

- [ ] `npm run lint` (0 errors) + `npm run build` — `noUnusedLocals`/`noUnusedParameters` bật nên build fail nếu thừa code.
- [ ] Không import xuyên feature; dùng alias `@features/grammar/...`, `@shared/...` (relative 2+ cấp bị warn).
- [ ] Không màu/font/spacing/radius tuỳ tiện — đối chiếu `docs/design-system/*`.
- [ ] Đổi route/prop/state → cập nhật doc file con tương ứng **trong cùng change** (quy tắc docs-first trong `AGENTS.md`).
- [ ] Không sửa màn học viên của Grammar (`GrammarRoadmapView`, `useGrammarRoadmap`, `types/grammar.types.ts`, `components/*` gốc) khi làm việc ở luồng management.