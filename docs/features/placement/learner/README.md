# Learner docs — Placement Test (Đánh giá đầu vào)

> Package tài liệu cho luồng **Placement Test** phía người học.
> Trạng thái mock ↔ API tập trung: `00-mock-api-status.md`.
> Stitch project: `Remix of EngoLearn English Learning App`
> (`projects/16234151544679864766`).

**Placement Guest flow: LOCKED** — P01 Guest/P02/P03 giữ luồng hiện tại; P01–P05 dùng
backend HTTP thật. Shared `useAuth()` xác nhận User bằng cookie Auth chung.

## Luồng & route

```text
/placement                    01-placement-start.md — Guest Public / User dashboard Start (P01)
  │ CTA "Bắt đầu bài kiểm tra" (POST attempt thật)
  ▼
/placement/attempts/:attemptId 02-placement-attempt.md — Làm bài (P02-READING/P02-LISTENING)
  │ nộp bài / hết giờ (auto-submit)
  ▼
/placement/attempts/:attemptId/submitted  03-placement-claim-gate.md — Guest Auth Gate (P03)
  │ /login hoặc /register → quay về P03 → tự claim → resultAttemptId
  ▼
/placement/attempts/:attemptId/result → 04-placement-result.md
  │ CTA “Xem chi tiết bài làm” dùng result.attemptId từ backend
  ▼
/placement/attempts/:attemptId/review → 05-placement-review.md
```

User P01 → P02 khi Start trả `IN_PROGRESS`, hoặc → P04 khi backend trả result.
User P02 nộp bài → P04; Guest P02 nộp bài → P03. P03 → P04 dùng `resultAttemptId` do backend trả khi claim hoặc tài khoản đã
có kết quả. P04 → P05 dùng `result.attemptId`. Không gọi fixture trong
service thường; claim giữ nguyên ownership và cửa sổ 2 giờ ở backend.

User đăng nhập qua `/login` hoặc `/register`; shared AuthProvider lấy User từ
`/api/v1/auth/me` qua cookie HttpOnly. P01/P02 dùng session chung cho
Start/Get/Save/Submit; nộp User **đi thẳng P04**. Start khi User đã có kết quả
trả `attemptId` hiện có. Guest request không mang identity User.

## Danh sách docs

| # | File | Màn / Route | Trạng thái code |
|---|------|-------------|-----------------|
| 00 | `00-mock-api-status.md` | Bảng mock ↔ API toàn package | — |
| 01 | `01-placement-start.md` | Guest Public / User dashboard Start — `/placement` | Backend HTTP (Guest/User qua AuthContext; auto Resume thiếu lookup) |
| 02 | `02-placement-attempt.md` | Làm bài — `/placement/attempts/:attemptId` | Backend HTTP (Guest/User qua AuthContext) |
| 03 | `03-placement-claim-gate.md` | Guest Auth Gate — `/placement/attempts/:attemptId/submitted` | Backend HTTP (Guest → Login/Register → claim) |
| 04 | `04-placement-result.md` | Kết quả User dashboard — `/placement/attempts/:attemptId/result` | Backend HTTP (AuthContext USER) |
| 05 | `05-placement-review.md` | Xem lại User dashboard — `/placement/attempts/:attemptId/review` | Backend HTTP (AuthContext USER) |
| 06 | `06-placement-dev-login.md` | Legacy DEV login redirect — `/placement/dev-login` | Chỉ Vite DEV; không còn DEV identity |

## Quy ước của package

- Mỗi doc theo khung: nguồn Stitch → route & trigger → bản đồ component →
  state → điểm UI-only → khác biệt vs Stitch → responsive → checklist refactor.
- **Shell tách theo màn:** Guest P01 + P03 dùng `PlacementPublicLayout`;
  User P01 + P04 + P05 dùng `PlacementUserLayout` (sidebar/top bar theo
  `P01-USER-RESUME`, `P04-USER-RESULT`, `P05-USER-REVIEW`).
  P01 dùng `PlacementEntryLayout` chọn shell sau Auth loading; P04/P05 dùng
  `PlacementResultLayout` chọn User shell khi xác thực. P02 dùng
  `PlacementAttemptLayout` trung tính (logo + tiến độ + đồng hồ), không sidebar.
  Guest/User dùng chung test shell; khác biệt vs Stitch ghi ở `02`.
- P01 **không tự dò Resume**: contract hiện chỉ trả attemptId qua POST Start;
  GET detail cần attemptId. Không POST khi mount, không lưu/fake attemptId hoặc
  progress. Khi User bấm Start, backend vẫn ưu tiên resume attempt/result cũ.
- `/submitted` là **post-submit dispatcher** cho nhiều trạng thái (claim gate,
  result, no-result, already claimed, lỗi) — giữ nguyên URL, không đổi tên.
  Sau Login/Register, P03 tự claim và chuyển sang P04 khi backend trả `resultAttemptId`.
- Route/`PLACEMENT_ROUTES` khai báo local trong `src/features/placement/constants.ts`
  (không thêm vào `ROUTES` dùng chung để tránh đụng code nhóm khác).
- Sửa view nào thì cập nhật doc tương ứng + bảng `00` (rule trong `AGENTS.md`).
