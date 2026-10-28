# Topic Management — Danh sách (List wiring, F05)

> Tài liệu thiết kế FE cho màn `TopicManagementListView` (`/admin/topics`) gắn API thật theo
> contract BE F05 (design r7 / FRC v1.2, §4.6 E4). **Đang thiết kế** — chưa implement code;
> xem kế hoạch implement của FE lead. Tuân thủ `docs/engineering/guides/api-integration.md`
> (`useFetch` pattern, feature service, view không gọi `fetch`).

## 1. Nguồn & phạm vi

- Endpoint: `GET /api/management/topics` (E4) → `200` `ApiResponse<TopicManagementListResponse>`.
  FE unwrap `.data` → `{ items, page, size, totalElements, totalPages, counters }`.
- Query params (tất cả tùy chọn): `search`, `cefr`, `category`, `status`, `page` (0-based, mặc định 0),
  `size` (1..100, mặc định 20). Filter kết hợp AND. Giá trị `"ALL"` của bộ lọc **bỏ qua** (không gửi param).
- Sort cố định `updatedAt DESC` (không có param sort).
- `counters = { total, published, draft }` tính trên **toàn bộ managed set**, không theo filter.
- Rỗng vẫn trả `200` với `items: []`; phân biệt "không có kết quả" vs "chưa có topic nào" bằng
  `counters.total === 0`.
- Out of scope: publish (F09), item editing (F06), cover upload (F08), auth.

## 2. Tầng service (`src/features/topic/services/topic-management.service.ts`)

- `fetchTopicList(params, signal): Promise<TopicManagementListResponse>` — xây dựng query string
  (bỏ `"ALL"` / trống), `fetch` qua Vite proxy `/api`, ném `TopicApiError` (`code`/`status`/`fieldErrors`)
  khi `!res.ok`, unwrap `envelope.data`.
- `fetchTopicById(id, signal): Promise<TopicManagementResponse>` — dùng cho E2 (xem [01-basic-info-upsert.md]).
- `createTopic(body, signal)` / `updateTopic(id, body, signal)` — dùng cho upsert (xem [01-basic-info-upsert.md]).
- `TopicApiError` extends `Error` với `status`, `code`, `fieldErrors?`.

## 3. Hook (`src/features/topic/hooks/useTopicList.ts` — mới)

```ts
export function useTopicList() {
  const [params, setParams] = useState<TopicListParams>(DEFAULT_FILTER);
  const fetchList = useCallback(
    (signal: AbortSignal) => topicManagementService.fetchTopicList(params, signal),
    [params],
  );
  const { data, loading, error } = useFetch<TopicManagementListResponse>(fetchList);
  // setFilter: gộp patch + reset page về 0; setPage: đổi page.
  return { data, loading, error, params, setFilter, setPage };
}
```

- `useFetch` refetch khi `params` đổi (filter/trang) — server-side search/filter/paging, **không**
  lọc client-side nữa (`matchesFilter` bị xóa).
- `data.items` dùng trực tiếp cho bảng (đã được BE lọc/sắp xếp/trang).

## 4. Thay đổi component danh sách

| Component | File | Thay đổi |
|---|---|---|
| `TopicManagementListView` | `views/management/TopicManagementListView.tsx` | Dùng `useTopicList()` thay `useTopicManagement()`; `data.items` hiển thị bảng; `data.counters` cho stats; `data.totalPages`/`data.page` cho pagination; `counters.total === 0` → empty state "chưa có topic nào", khác 0 và `items.length === 0` → empty state "không khớp bộ lọc". |
| `TopicManagementTable` | `components/management/list/TopicManagementTable.tsx` | Props `topics: TopicManagementListItem[]`, `onEdit: (id: string) => void`, giữ `onUnpublish`. Thêm `onEdit` cho row click (tên chủ đề) và menu item "Mở chỉnh sửa (Bước 2)" → `navigate(adminTopicBasicInfoPath(topic.id))`. Hiện `itemCount` thay `itemsLabel`; bỏ `thumbnail`/`progress`/`code` (trạng learner/mock); category hiển thị label qua mapping `DINING…`. |
| `TopicManagementStats` | `components/management/list/TopicManagementStats.tsx` | Props `stats: TopicManagementCounters` (`total`/`published`/`draft`); **bỏ** pill `inProgress`. |
| `TopicManagementFilterBar` | `components/management/list/TopicManagementFilterBar.tsx` | Props `categoryOptions: {value, label}[]` (5 giá trị wire `DINING…`, label giữ nguyên) thay `categories: string[]`; `category`/`status`/`cefr` giá trị `"ALL"` = bỏ qua param. |
| `TopicManagementPagination` | `components/management/list/TopicManagementPagination.tsx` | Props `page`, `totalPages`, `totalElements`, `onPageChange` (controlled); hiển thị trang thực từ API. |
| `UnpublishTopicDialog` | `components/management/list/UnpublishTopicDialog.tsx` | Props nhận `TopicManagementListItem` (dùng `id`/`titleEn`/`titleVi`/`cefr`/`itemCount`); bỏ `code`/`thumbnail`/`progress`/`itemsLabel` (F05 không cung cấp). |

## 5. Kiểu dữ liệu (`src/features/topic/types/topic-management.types.ts` — mới)

- `TopicCategory = "DINING" | "TRAVEL" | "BUSINESS" | "DAILY" | "HEALTH"`.
- `TopicManagementListItem { id, titleEn, titleVi, cefr?, category?, status, itemCount, updatedAt }`.
- `TopicManagementResponse { id, titleEn, titleVi, cefr?, category?, description?, coverUrl?, status, durationMinutes, itemCount, createdAt, updatedAt }`.
- `TopicManagementCounters { total, published, draft }`.
- `TopicManagementListResponse { items, page, size, totalElements, totalPages, counters }`.
- `TopicCreateRequest { titleEn, titleVi, cefr?, category?, description?, coverUrl? }`.
- `TopicUpdateRequest { titleEn?, titleVi?, cefr?\|null, category?\|null, description?\|null, coverUrl?\|null }`.
- `TopicManagementFilter { search, cefr: "ALL"\|CefrLevel, category: "ALL"\|TopicCategory, status: "ALL"\|"draft"\|"published" }`.
- `TopicManagementStats { total, published, draft }` (bỏ `inProgress`).

## 6. Áp dụng FR / AC

- `FR-11` (list drafts + published, paged), `FR-12` (7 `BR-F5.8` fields + `id`), `FR-13` (search + 3 filters AND), `FR-14` (counters over managed set), `FR-15` (empty 200).
- `AC-11`…`AC-14` (list, filters, counters), `AC-15`/`AC-16` (empty branches), `AC-17` (mở edit từ bất kỳ mục nào qua row click / menu).

## 7. Checklist

- [x] Tạo `topic-management.types.ts` + cập nhật `topic.types.ts` (`TopicManagementStats` bỏ `inProgress`; `TopicManagementFilter` category enum).
- [x] Tạo `topic-management.service.ts` (`fetchTopicList` unwrap `.data`, ném `TopicApiError`).
- [x] Tạo `useTopicList.ts` (server-side search/filter/page, `useFetch`).
- [x] Cập nhật `TopicManagementListView`, `TopicManagementTable`, `TopicManagementStats`,
      `TopicManagementFilterBar`, `TopicManagementPagination`, `UnpublishTopicDialog`.
- [x] Row click + menu item "Mở chỉnh sửa (Bước 2)" → `adminTopicBasicInfoPath(topic.id)`.
- [ ] `npm run lint` (0 errors) + `npm run build`; kiểm tra manual theo kế hoạch implement.
