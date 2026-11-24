# GA-00 — Grammar — Danh sách chủ đề ngữ pháp

> Màn danh sách chủ đề ngữ pháp trong Content Studio.
> Nguồn thiết kế: Stitch `projects/16234151544679864766/screens/98daf5cacfa64556a05ad825a35a41db` (desktop 2560×2412).

## 1. Stitch → Route

| Stitch | Route | View | Layout |
|--------|-------|------|--------|
| GA-00 — Grammar — Danh sách chủ đề ngữ pháp | `/admin/grammar` (`ROUTES.ADMIN_GRAMMAR`) | `views/admin/GrammarTopicListView.tsx` | `ManagementLayout` (shell dùng chung) |

Stitch vẽ nguyên shell Content Studio (sidebar + topbar) — **không clone**. Chỉ dựng phần page content.

## 2. Bản đồ component

```
GrammarTopicListView                 views/admin/GrammarTopicListView.tsx
├─ ManagementPageHeader              @shared/components/management  (title, exportLabel, createDisabled)
├─ GrammarTopicStatsGrid             components/admin/GrammarTopicStatsGrid.tsx
├─ GrammarTopicFilterBar             components/admin/GrammarTopicFilterBar.tsx
│   └─ CefrSelect                    @shared/components/management
├─ EmptyState                        @shared/components  (khi filter rỗng)
├─ Loading                           @shared/components  (khi loading)
└─ card bg-surface-container-lowest
    ├─ GrammarTopicTable             components/admin/GrammarTopicTable.tsx
    │   ├─ GrammarTopicCefrBadge      components/admin/GrammarTopicCefrBadge.tsx
    │   ├─ GrammarTopicProgressCell  components/admin/GrammarTopicProgressCell.tsx
    │   └─ GrammarTopicStatusPill    components/admin/GrammarTopicStatusPill.tsx
    └─ ListPagination                @shared/components/management  (controlled)
```

Data: `hooks/useGrammarTopicManagement.ts` → `useFetch` trong `@shared/hooks`.
Types: `types/grammar-topic-management.types.ts`.

## 3. Bản đồ props

| Component | Props | Ghi chú |
|-----------|-------|---------|
| `ManagementPageHeader` | `title`, `description`, `exportLabel`, `exportButtonClassName`, `createLabel`, `createDisabled`, `createButtonClassName` | Không truyền `onExport`/`onCreate`; không truyền `badge` (Stitch không có) |
| `GrammarTopicStatsGrid` | `stats: GrammarTopicStats` | 4 ô, `grid-cols-2 lg:grid-cols-4` |
| `GrammarTopicFilterBar` | `filter`, `onChange`, `onClear` | Không nhận danh sách category (Grammar không có category) |
| `CefrSelect` | `value`, `onChange`, `options`, `className`, `chevronClassName` | `options` khác Topic: Grammar dùng nhãn `A1 - Sơ cấp … B2 - Trung cao` |
| `GrammarTopicTable` | `topics` | Nhận **slice trang hiện tại**, không tự phân trang |
| `GrammarTopicCefrBadge` | `level: ManagementCefrLevel` | A1→A2→B1→B2 mở dần độ đậm |
| `GrammarTopicProgressCell` | `done`, `total` | 2 segment: đã học + còn lại |
| `GrammarTopicStatusPill` | `status: GrammarTopicStatus` | `published` / `in_progress` / `draft` |
| `ListPagination` | `total`, `from`, `to`, `itemNoun`, `pageSize`, `page`, `onPageChange`, `onPageSizeChange` | Controlled; không truyền `pageCount` → tự tính. Mũi tên trước/sau chỉ hoạt động khi có `onPageChange` (giữ đúng hành vi cũ của Topic ở chế độ uncontrolled) |

## 4. Bản đồ state

| State | Kiểu | Mặc định | Nơi đổi |
|-------|------|----------|----------|
| `filter` | `GrammarTopicFilter` | `{ search: "", cefr: "ALL", status: "ALL" }` | `patchFilter` / `clearFilter` |
| `page` | `number` | `1` | `onPageChange`; reset khi đổi `pageSize` |
| `pageSize` | `number` | `6` | select "Mỗi trang" (6/10/20/50) |
| data | `GrammarTopicManagementData \| null` | — | `useGrammarTopicManagement` |

Lọc client-side bằng `matchesFilter`: `search` khớp `titleVi`/`titleEn`/`code` (không phân biệt hoa thường),
`cefr` và `status` khớp đúng. `currentPage = Math.min(page, pageCount)` — sau khi lọc còn 1 trang mà
`page = 3` thì tự về trang 1, không cần `useEffect` đồng bộ.

## 5. Data (mock)

`MOCK_TOPICS` — 7 dòng `GRM-01 … GRM-07` (Present Simple, Present Continuous, Past Simple,
Modal Verbs, First Conditional, Relative Clauses, Comparatives/Superlatives), mỗi dòng có
`code`, `titleVi`, `titleEn`, `description`, `cefr`, `lessonDone`/`lessonTotal`, `status`, `updatedLabel`.

`MOCK_STATS` — `{ total: 24, published: 17, inProgress: 3, draft: 4 }`.

**Hai nguồn độc lập, cố ý không liên kết.** KPI trong Stitch mô tả cả thư viện 24 chủ đề, còn bảng chỉ
render 7 dòng mẫu để khớp chiều cao thiết kế. Nếu tính KPI bằng `reduce` trên `MOCK_TOPICS` sẽ ra
`7 / 4 / 2 / 1` — sai. Vì vậy phân trang của bảng dùng `filteredTopics.length` (tối đa 7), còn KPI
giữ 24. Khi gắn API thật, hai con số này sẽ khớp nhau.

## 6. UI-only & khác biệt Stitch

| Việc | Trạng thái |
|------|-----------|
| Nút "Tạo chủ đề ngữ pháp" | **Disabled thật** (`createDisabled`). Chưa có màn GA-01 nên không `onClick`, không `navigate`, không tạo route giả `/admin/grammar/create` |
| Nút "Xuất CSV" | Render đúng Stitch, chưa có handler |
| Row action "Chỉnh sửa" + "…" | Render đúng Stitch, chưa có handler (GA-01/GA-02) |
| Icon | Material Symbols → `lucide-react`: `download`→`Download`, `add`→`Plus`, `search`→`Search`, `expand_more`→`ChevronDown`, `filter_alt_off`→`FilterX`, `book`→`BookOpenText`, `check_circle`→`CircleCheck`, `schedule`→`Clock`, `edit_note`→`NotebookPen`, `more_vert`→`EllipsisVertical` |
| Nút Stitch là `<button>` thuần | Dùng shadcn `Button` (đã có `disabled` + focus ring đúng hệ) với `h-10 rounded-xl px-4 text-label-lg` cho khớp chiều cao ~40px |
| Icon "Xuất CSV" màu `text-tertiary` | Không tái hiện — sẽ tô cả chữ theo màu icon |
| Bảng | 7 cột nội dung (Mã, Tên, Mô tả, Trình độ, Bài học, Trạng thái, Cập nhật) + 1 cột thao tác |
| Số trang | `ListPagination` suy ra từ `filtered.length`; Stitch hard-code `1–6 / 24` |
| Sidebar dưới `lg` | Ẩn — hành vi có sẵn của `ManagementLayout`, không đổi trong màn này |

## 7. Responsive

- KPI: `grid-cols-2` → `lg:grid-cols-4`.
- Filter bar: xếp dọc → `xl:flex-row xl:items-center`; nhóm select `flex-wrap`.
- Bảng: bọc `overflow-x-auto`; cột "Mô tả" `max-w-[280px]` để không giãn hết bảng.
- Pagination: xếp dọc → `sm:flex-row`.
- Page: `max-w-7xl px-5 pb-16 lg:px-8`.

## 8. Checklist refactor

- [ ] `npm run lint` + `npm run build` — 0 error.
- [ ] Import qua alias `@features/grammar/...`, `@shared/...` (relative 2+ cấp bị warn).
- [ ] Chỉ dùng token trong `src/core/assets/css/App.css`; không màu/font/radius tuỳ tiện.
- [ ] KPI không được `reduce` từ `MOCK_TOPICS` (§5).
- [ ] Nút "Tạo chủ đề ngữ pháp" vẫn phải disabled cho tới khi có GA-01.
- [ ] Không tạo feature `grammarAdmin`; mọi file management nằm trong `src/features/grammar/`.
- [ ] Cập nhật file doc này **trong cùng change** mỗi khi đổi route/prop/state.