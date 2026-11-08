# Learner — Bảng trạng thái mock ↔ API (Placement)

> Một bảng duy nhất để biết package Placement còn bao nhiêu việc khi backend
> xong. Cập nhật bảng này (và doc tương ứng) mỗi khi đấu nối API thật.
> Legend: ✅ dữ liệu tĩnh · 🔵 HTTP backend thật · 🟡 mock/fixture (chờ API thật).

| Màn (doc) | Dữ liệu | Attempt / Session | Kết quả | Ghi chú |
|-----------|---------|-------------------|---------|---------|
| Giới thiệu (`01`) | ✅ tĩnh (copy + info tiles trong `constants.ts`) | 🔵 `POST /api/v1/placement/attempts` (start/resume) | — | Guest Public, User dashboard Start; Guest `IN_PROGRESS` → P02, finalized → P03; User result → P04, User active → P02. Không có lookup active attempt không tạo mới: P01 chưa thể tự hiển thị Resume trước CTA. |
| Làm bài (`02`) | 🔵 20 câu từ BE sample Test Set (14 Reading + 6 Listening) | 🔵 GET attempt / PATCH answers / POST submit | — | Cookie Auth chung; F5 khôi phục User qua `/auth/me`; User kết thúc → P04, Guest → P03 |
| Nộp bài → Guest gate (`03`) | 🔵 GET claim-gate | 🔵 `claimStatus`, `claimExpiresAt`, `serverNow`, `resultAttemptId` từ BE | Không lộ điểm | Guest → `/login` hoặc `/register` với `location.state.from` → P03 tự claim; `resultAttemptId` → P04; 409 `PLACEMENT_ACTIVE_ATTEMPT_EXISTS` giữ conflict card |
| Kết quả (`04`) | 🔵 `getPlacementResult(attemptId)` | 🔵 GET result bằng User đã xác thực | 🔵 score/20 + level + summary từ BE | User dashboard shell theo Stitch; chỉ role USER; cookie Auth chung |
| Xem lại (`05`) | 🔵 snapshot 20 câu từ BE | 🔵 `getPlacementReview(attemptId)` | 🔵 điểm, level và đáp án đúng từ BE | User dashboard shell theo Stitch; chỉ role USER; P04 → P05 bằng result.attemptId; production chờ Auth |

## Ranh giới trách nhiệm (quan trọng)

Quy tắc "mỗi học viên chỉ có một attempt đang hoạt động", quyền sở hữu
attempt, cửa sổ claim attempt của guest, tính `deadlineAt`, chấm điểm và
xếp trình độ **đều thuộc backend**. FE chỉ hiển thị dữ liệu trả về — không
suy luận lại các rule này, không lưu credential/session vào localStorage.

## FE-I1–I2: môi trường và giới hạn

- Placement gọi `/api/v1/placement/attempts` cùng origin qua shared `httpService`;
  Vite proxy chuyển `/api` tới BE trong DEV. Browser tự gửi cookie HttpOnly
  `placement_guest_session` và `ACCESS_TOKEN` theo path, FE không lưu token/session ID.
- BE vẫn chạy sample Test Set / in-memory attempts: reload trang FE giữ cùng attempt
  và deadline miễn là BE còn chạy và browser còn cookie; restart BE sẽ mất attempts.
- P01–P05 không gọi mock trong flow thường; các fixture cũ có thể còn trong
  source, không dùng làm fallback khi HTTP lỗi.
- AuthProvider chung (mount tại `main.tsx`) gọi `/api/v1/auth/me`, phục hồi
  session bằng refresh cookie và cung cấp `login/register/logout` cho app.
- Login/Register chung dùng `location.state.from` để trở lại P03; logout thu hồi
  session qua Auth chung. Không dùng `X-Dev-User-Id` hay key trong sessionStorage.
  Navigation sau claim dùng `resultAttemptId` nguyên từ BE; đặc biệt
  `USER_HAS_RESULT` có thể trỏ tới attempt khác.
- P01/P02/P04/P05 dùng identity hiện hành từ `useAuth()`; không dùng URL query
  hoặc navigation marker. Route DEV login cũ chỉ redirect sang Login chung.
