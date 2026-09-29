# Learner — Chi tiết chủ đề (Topic Detail)

> Tài liệu workflow cho màn learner Chi tiết chủ đề, điểm vào của luồng học
> 1 topic (Stitch: "Web — Chi tiết chủ đề").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, progress).

## 1. Nguồn thiết kế (Stitch)

- Project: `Remix of EngoLearn English Learning App`
  (`projects/7356093395065438561`).
- Screen: `projects/7356093395065438561/screens/0e1fa02cbc0848f9a9f29ff287b11c3b`
  ("Web — Chi tiết chủ đề", DESKTOP 2560×2264).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).

## 2. Route & trigger point

- Route: `/topics/:topicId` (`ROUTES.TOPIC_DETAIL` trong
  `src/shared/constants/app.constants.ts`), khai báo trong
  `src/features/topic/routes.ts` dưới `LearningLayout` (top-level absolute
  path — không nest dưới `/topics` vì react-router từ chối).
- Trigger: card chủ đề ở `/topics` (`TopicCard`), nút "Tiếp tục học" các màn
  khác (`navigate(ROUTES.TOPICS)` rồi chọn tiếp), sidebar learner.
- Back của view → `/topics`. Nút "Tiếp tục học" (sidebar + từng unit) →
  `/topics/:topicId/context` (`ROUTES.TOPIC_CONTEXT`, xem `02-topic-context.md`).

## 3. Bản đồ component

| ID | Component | File | Ghi chú |
|----|-----------|------|---------|
| V0 | `TopicDetailView` | `views/learning/TopicDetailView.tsx` | Container: `useParams` lấy `topicId`, `useTopicDetail`, `loading` → `Loading`, `error`/rỗng → `EmptyState`, compose topbar + hero + unit list + sidebar. `goLesson` trỏ mọi CTA vào context. |
| C0 | `TopicDetailTopBar` | `components/learning/detail/TopicDetailTopBar.tsx` | Topbar trong-layout (sticky, pattern `ContextTopBar`): `parentLabel` + title + nút back. |
| C1 | `TopicDetailHero` | `components/learning/detail/TopicDetailHero.tsx` | Hero `rounded-2xl p-6`: H1 `headline-lg bold text-primary` + mô tả + badge CEFR (`border-primary/20 bg-primary/10`) + overview 1 dòng (BookOpen/MessageCircle/CircleHelp + nhãn vocab/expressions/practice, phân cách `•`). |
| C2 | `UnitList` | `components/learning/detail/UnitList.tsx` | List units, owns `expandedIds: string[]` (toggle mở rộng preview từng unit; `locked` không toggle được). Render `C3` cho mỗi unit. |
| C3 | `UnitRowCard` | `components/learning/detail/UnitRowCard.tsx` | 1 row unit: index/title/duration/state badge + preview (vocab, expressions, practice) khi mở rộng + CTA theo state (`UnitActionLabels`: start/resume/review/restart). |
| C4 | `TopicProgressSidebar` | `components/learning/detail/TopicProgressSidebar.tsx` | Sidebar: card `rounded-2xl p-6` (tiêu đề "Tiến độ Chủ đề", `%` lớn `headline-md text-primary`, progress bar `h-3 bg-primary/10`) + stats (icon theo `STAT_ICONS`: vocab→`Brain`, expressions→`MessagesSquare`, practice→`ClipboardList`) + shadcn `Button size="lg" w-full rounded-xl` "Tiếp tục học". |
| H1 | `useTopicDetail` | `hooks/useTopicDetail.ts` | Mirror pattern `useFetch`: mock `MOCK_TOPIC_DETAIL` (5 units morning-routine: completed/current/available/locked×2), trả `{ data, loading, error, refetch }`. |
| T0 | types | `types/topic-detail.types.ts` | `TopicUnitState` (`"completed" \| "current" \| "available" \| "locked"`), `TopicUnitItem` (+`preview`, `stateBadge`, `hasUpdates`), `TopicDetailOverview`, `UnitActionLabels`, `TopicDetail`. |

## 4. State hiện tại

- `UnitList.expandedIds` là UI state local duy nhất (mở rộng xem trước unit).
- Mọi CTA học (`onStartUnit`, sidebar `onContinue`) hiện cùng trỏ vào context —
  chưa rẽ theo trạng thái unit (unit completed → review, current → resume);
  chờ `furthest_reached` thật (xem `04-learning-progress.md`).

## 5. Các điểm UI-only (cần gắn thật khi refactor)

1. **Dữ liệu:** mock trong hook; khi có API: service + `useFetch` với callback
   `(signal: AbortSignal) => Promise<T>`, `loading` → `Loading`,
   `error` → `EmptyState` (khung đã có sẵn trong V0).
2. **Tiến độ:** `progressPercent`/`stats` đang mock; khi có API progress, lấy từ
   `useTopicProgress` / endpoint tổng hợp thay vì mock.
3. **Deep-link unit:** `onStartUnit(unitId)` hiện bỏ qua `unitId` (luôn vào
   context); khi gắn thật, resolve unit → part/item tương ứng qua
   `furthest_reached`.

## 6. Khác biệt có chủ ý so với HTML Stitch

- Dùng `LearningLayout` (sidebar + topbar + bottomnav của app) thay header
  `fixed` full-width của Stitch; topbar của màn là sticky trong layout
  (pattern `TopicContextView`).
- Radius chuẩn hoá: card `rounded-2xl`, button `rounded-xl`, pill `rounded-full`
  — đúng AGENTS.md + `components.md`.
- Icon toàn bộ `lucide-react`; không Material Symbols.

## 7. Responsive

- Layout: cột nội dung `max-w-[1200px]`, `grid-1 → md:12` (nội dung span-8,
  aside span-4 `lg:sticky lg:top-20`).
- Hero: title + badge `flex-wrap`, overview `flex-wrap` không vỡ mobile.

## 8. Checklist refactor (khi gắn dữ liệu thật)

- [ ] Thay mock bằng API + `useFetch` (§5.1).
- [ ] `progressPercent`/`stats` từ API progress (§5.2).
- [ ] `onStartUnit` resolve đúng part/item theo `furthest_reached` (§5.3,
      xem `04-learning-progress.md`).
- [ ] Chạy `npm run lint` (0 errors) + `npm run build` sau mỗi thay đổi.
