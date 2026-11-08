# 03 — Guest Auth Gate (nhận kết quả sau khi nộp)

> Màn **P03-GUEST-AUTH-GATE** — trạm trung chuyển sau khi nộp bài.
> Route: `/placement/attempts/:attemptId/submitted` (`PLACEMENT_ROUTES.ATTEMPT_SUBMITTED`).
> Shell: `PlacementPublicLayout` (header Guest/User theo AuthContext).

## 1. Nguồn Stitch

Project `projects/16234151544679864766`.

| Screen ID | Shell | Heading / copy chính | CTA | Khác biệt | Vai trò |
|-----------|-------|----------------------|-----|-----------|---------|
| `screens/12370710457801364077` | Guest marketing header (Trang chủ / Giới thiệu / Từ vựng / Ngữ pháp / Đánh giá đầu vào + Đăng nhập / Đăng ký) | Card 520px căn giữa: icon `task_alt`; H1 "Bạn đã hoàn thành bài kiểm tra"; mô tả "Đăng nhập hoặc tạo tài khoản để xem trình độ được đề xuất và xem lại bài làm."; banner "Kết quả của bạn được giữ trong 2 giờ kể từ khi bài thi kết thúc." | Primary "Đăng nhập để xem kết quả"; secondary "Tạo tài khoản"; link "Về trang chủ" | Có banner 2 giờ; không có breadcrumb | **Visual source chính** |
| `screens/16190849862638951630` | Dashboard đã đăng nhập (aside 60 + greeting + search) | Breadcrumb "Trang chủ / Kiểm tra trình độ / Nhận kết quả"; H1 "Nhận kết quả kiểm tra"; card H2 "Bạn đã hoàn thành bài kiểm tra" | Primary "Đăng nhập để xem kết quả"; secondary "Tạo tài khoản"; link "Về trang chủ" | Sai bản chất Guest; **không** có banner 2 giờ | Biến thể — loại |
| `screens/15570108032365409571` | Dashboard đã đăng nhập | Giống hệt screen trên | Giống hệt screen trên | Trùng lặp 100% với biến thể trên | Biến thể — loại |

Chỉ screen `12370710457801364077` được dùng làm nguồn thị giác. Không có
biến thể Stitch cho các trạng thái lỗi/hết hạn — các trạng thái đó dựng theo
design system (`docs/design-system/*`).

## 2. Route & trigger

- P02 nộp bài (thủ công hoặc auto-submit) → `navigate(PLACEMENT_ROUTES.attemptSubmitted(attemptId))`.
- URL **giữ nguyên** `/placement/attempts/:attemptId/submitted`; đây là
  post-submit dispatcher cho nhiều trạng thái (claim gate, result, no-result,
  already claimed, lỗi), không chỉ riêng claim.
- View fetch Guest state theo `attemptId` (không phụ thuộc router state). CTA
  đi `/login` hoặc `/register` với `location.state.from` trỏ về P03. Khi AuthProvider trả
  role USER, P03 tự GET claim-gate với cookie Auth + Guest session;
  `ALREADY_CLAIMED` hoặc `USER_HAS_RESULT` có `resultAttemptId` → P04.
- Sau khi Guest state `CLAIMABLE` tải xong, hai CTA Login/Register phải enabled.
  Busy `claiming` chỉ áp dụng cho authenticated learner đang auto-claim; state
  khởi tạo của nhánh này không được khóa CTA của Guest chưa xác thực.

## 3. Bản đồ component

```text
PlacementClaimGateView            views/learning/PlacementClaimGateView.tsx
├─ Loading / EmptyState           @shared/components
├─ PlacementClaimCard             components/learning/claim/PlacementClaimCard.tsx      (CLAIMABLE)
│  └─ PlacementClaimAuthActions   components/learning/claim/PlacementClaimAuthActions.tsx
├─ PlacementActiveAttemptConflictCard components/learning/claim/PlacementActiveAttemptConflictCard.tsx (409)
└─ PlacementClaimStatusCard       components/learning/claim/PlacementClaimStatusCard.tsx (mọi state khác)
```

## 4. State matrix

`PlacementClaimStatus` là **state chuẩn hoá phía FE**; service đọc enum
backend trực tiếp với các trạng thái trùng tên. Backend trả 404 khi sai quyền
hoặc mất phiên: P03 hiển thị EmptyState, không suy diễn `SESSION_MISMATCH`/
`OWNED_BY_OTHER` từ 404. View không tự suy luận rule.

| `claimStatus` | Ý nghĩa | UI |
|---|---|---|
| `CLAIMABLE` | Bài đã nộp, còn cửa sổ claim, cần auth để backend auto-claim | Card chính + CTA Đăng nhập/Tạo tài khoản |
| `CLAIM_EXPIRED` | Quá 2 giờ kể từ `endedAt` | Cảnh báo + link về Placement; không tự hiện retake CTA |
| `SESSION_MISMATCH` | Guest Session mất/không khớp | Cảnh báo + link về Placement; không tự hiện retake CTA |
| `OWNED_BY_OTHER` | Attempt đã thuộc **tài khoản khác** | Cảnh báo, không có CTA claim |
| `ALREADY_CLAIMED` | Đã claim bởi **chính authenticated owner** (idempotent) | Điều hướng P04 bằng `resultAttemptId`; status card vẫn giữ trạng thái nếu được render |
| `USER_HAS_RESULT` | Tài khoản đã có result hợp lệ, không ghi đè | Điều hướng P04 bằng `resultAttemptId` của kết quả cũ; status card giữ nguyên nếu được render |
| `NO_RESULT` | Attempt `EXPIRED` (0 câu) — không có gì để claim | "Bài làm không có câu trả lời" + "Làm lại bài kiểm tra" |

`IN_PROGRESS` không thuộc P03 (P02 đã chặn nộp/rời trang); nếu backend trả về
thì coi là lỗi dữ liệu và hiển thị EmptyState.

### Conflict khi User còn Attempt đang làm

Khi claim nhận HTTP `409` với `code = PLACEMENT_ACTIVE_ATTEMPT_EXISTS`
(BR-F2.14), P03 **không** dùng EmptyState "Không tìm thấy bài làm". View hiển
thị `PlacementActiveAttemptConflictCard`:

- Tiêu đề: "Bạn đang có một bài đánh giá đầu vào đang làm dở."
- Mô tả: "Hãy tiếp tục bài đang làm trước khi sử dụng kết quả của bài Guest này."
- Nút "Tiếp tục bài đang làm" → `/placement` để dùng lại
  Start/Resume với AuthContext hiện tại. FE không truyền `activeAttemptId` tự đoán.
- Production: chỉ hiển thị thông tin + link về `/placement`; không giả lập auth.
- Guest Result bị chặn không đổi chủ sở hữu, trạng thái hay `claimExpiresAt`.

`PLACEMENT_ACTIVE_ATTEMPT_EXISTS` là conflict của thao tác claim, **không** thêm
vào `PlacementClaimStatus`.

## 5. HTTP backend (FE-I1–I2)

| Hàm service | Request | Vai trò |
|---|---|---|
| `getPlacementClaimStatus(attemptId, signal)` | GET claim-gate, chỉ Guest cookie | P03 Guest; không lộ score/level |
| `getPlacementClaimStatus(attemptId, signal)` | GET claim-gate, Guest cookie + Auth cookie | Khi AuthContext xác nhận role USER, backend auto-claim; không có POST claim |

Backend tính mốc claim theo **`endedAt`**, không dùng `submittedAt`:

- `SUBMITTED` → `endedAt = thời điểm submit`.
- `AUTO_SUBMITTED` → `endedAt = deadlineAt`.
- `EXPIRED` → `endedAt = deadlineAt`, map `NO_RESULT`, không claim.
- `claimExpiresAt = endedAt + 2 giờ` (BR-F2.4); `null` khi không có result.
- Backend trả `CLAIM_EXPIRED` tại/sau `claimExpiresAt`, không kéo dài hạn.
- Khi User còn Attempt đang làm, claim trả HTTP `409` với
  `PLACEMENT_ACTIVE_ATTEMPT_EXISTS` (xem mục Conflict ở trên).

Payload `PlacementClaimGate` gồm `attemptId`, `attemptStatus`, `claimStatus`,
`claimExpiresAt`, `serverNow`, `resultAttemptId: string | null` — **không** có
điểm/level/đáp án (BR-F2.3). `resultAttemptId` lấy nguyên từ BE (có thể khác
Guest Attempt ID); P03 dùng giá trị này để vào Result sau claim.
Reload P03 fetch BE bằng cookie HttpOnly của browser. DEV Mongo mode đọc Attempt
từ MongoDB; sample mode vẫn dùng repository in-memory và không bảo đảm giữ bài qua restart.

### Scenario id mock cũ (không hoạt động với HTTP thật)

Không dùng các ID này trong service HTTP:

| Attempt id | `claimStatus` |
|---|---|
| `claim-demo-expired` | `CLAIM_EXPIRED` |
| `claim-demo-mismatch` | `SESSION_MISMATCH` |
| `claim-demo-owned` | `OWNED_BY_OTHER` |
| `claim-demo-has-result` | `USER_HAS_RESULT` |
| `claim-demo-already-claimed` | `ALREADY_CLAIMED` |

## 6. Điểm UI-only / deferred

- Login/Register CTA dẫn tới Auth chung; `location.state.from` giữ đường về
  P03 trong cùng browser navigation. AuthProvider giữ session bằng cookie HttpOnly;
  Placement không lưu credential/session. Reload trực tiếp trên màn Login trước
  khi submit sẽ mất navigation state return-to; không giả lập fallback claim.
- Merge integration (2026-11-08): AuthForm giữ pending UI và khóa submit riêng;
  GuestOnlyGuard là nơi duy nhất điều hướng sau auth, dùng return-to đã validate.
  P03 tiếp tục gửi `state.from` và auto-claim bằng cookie thật. Thay đổi xử lý
  nguyên nhân điều hướng cạnh tranh ở code; cần kiểm chứng lại browser E2E với
  backend thật trước khi đánh dấu luồng tự quay lại PASS.
- Không gọi claim API giả (BR-F2.6 là auto-claim phía backend sau auth).
- "Xem kết quả" trong status card vẫn disabled (không đổi visual); P03 sau
  khi AuthContext xác thực sẽ điều hướng theo `resultAttemptId` BE cấp. Không mặc
  định `resultAttemptId` bằng Guest Attempt ID; thiếu ID thì dừng tại EmptyState.
- Banner 2 giờ là text tĩnh theo Stitch; countdown để P04/refactor sau.
- `CLAIM_EXPIRED`/`SESSION_MISMATCH` không tự hiện "Làm lại bài kiểm tra":
  backend tương lai phải quyết định khả năng retake theo result hiện có.
- Conflict `PLACEMENT_ACTIVE_ATTEMPT_EXISTS`: nút resume về `/placement` dùng
  Auth hiện hành; không suy đoán `activeAttemptId` từ FE.

## 7. Khác biệt vs Stitch

- Stitch có 2 biến thể dùng dashboard đã đăng nhập → loại, dùng
  `PlacementPublicLayout` (đúng bản chất Guest).
- Link cuối card ghi "Về trang đánh giá đầu vào" (`/placement`) thay vì
  "Về trang chủ" — giữ nhất quán P01/P02 và tránh phụ thuộc route trang chủ.
- Thứ tự nav header giữ theo P01 (đã duyệt), không đổi theo Stitch.
- Stitch không có state lỗi → bổ sung theo state matrix ở trên.

## 8. Responsive

- Mobile: 1 cột, card full width trong margin 20px (`px-5`), CTA xếp dọc.
- ≥ sm: card `max-w-[520px]`, padding `sm:p-8`, vẫn xếp dọc CTA theo Stitch.
- Nội dung căn giữa dọc theo viewport (`min-h-[calc(100vh-4rem)]`).

## 9. Checklist refactor khi có backend/auth

- [x] Chốt endpoint post-submit và đọc response → `PlacementClaimStatus` trong
       `services/placement.service.ts` (không gọi `readMockClaimGate`).
- [x] Nối Login/Register chung qua `location.state.from`; P03 tự claim
      bằng GET claim-gate sau khi shared AuthContext xác nhận User.
- [x] Claim điều hướng P04 bằng `resultAttemptId` (kể cả USER_HAS_RESULT).
- [x] Xử lý riêng HTTP `409 PLACEMENT_ACTIVE_ATTEMPT_EXISTS` + resume path.
- [ ] Nối status card result CTA khi có yêu cầu UX; Login/Register đã dùng Auth chung.
- [ ] Backend trả capability retake nếu tài khoản đủ điều kiện; không suy từ
      claim error ở FE.
- [ ] (Tuỳ chọn) render countdown từ `claimExpiresAt` + `serverNow`; khi hết hạn
      refetch 1 lần để backend trả `CLAIM_EXPIRED`.
