# 02 — Làm bài Placement (`/placement/attempts/:attemptId`)

> Màn **P02-READING / P02-LISTENING** của Placement Test phía người học.
> Nguồn Stitch: `P02-READING` (`screens/8140304849497122394`) và
> `P02-LISTENING` (`screens/906694829005463365`) trong
> `projects/16234151544679864766`.
> Business rules: `f01-placement-taking/rules.md` (BR-F1.4 → BR-F1.13) và
> `f02-placement-result/rules.md` (BR-F2.1, BR-F2.3, BR-F2.4).

## 1. Nguồn Stitch → quyết định shell

Stitch vẽ P02 trong **shell dashboard đã đăng nhập** (sidebar trái 240px,
greeting "Xin chào, Hoàng", search/notification/avatar). Điều này xung đột với
luồng guest: BR-PLT-M.1 cho phép Guest Session sở hữu attempt, và P01 là màn
public.

Quyết định: **shell trung tính riêng của feature**
(`PlacementAttemptLayout`) — logo + "Đánh giá đầu vào" + pill tiến độ + đồng hồ.
Không sidebar, không avatar, không greeting. Guest và user dùng **cùng một
shell và cùng một view**; khi có auth thật, backend trả attempt theo session và
UI không đổi.

Nội dung bám Stitch: breadcrumb, H1, pill "Đã trả lời x/20", đồng hồ
"Còn lại mm:ss", 3 câu/trang, pagination "Câu X–Y / 20", grid 20 câu,
nút "Nộp bài thi".

## 2. Route & trigger

```text
/placement                         P01 (đã có)
  │ POST attempt (backend) → navigate
  ▼
/placement/attempts/:attemptId     P02 — PlacementAttemptLayout + PlacementAttemptView
  │ nộp bài / hết giờ (auto-submit)
  ├─ Guest → /placement/attempts/:attemptId/submitted   P03 — Guest Claim Gate
  └─ User SUBMITTED/AUTO_SUBMITTED → /placement/attempts/:attemptId/result   P04
```

- `PLACEMENT_ROUTES.ATTEMPT_SUBMITTED` + `attemptSubmitted(id)` trong
  `constants.ts` chỉ dành cho Guest; User có kết quả đi P04 theo
  `claimRequired=false` từ backend. User `EXPIRED` không có Result → về P01.
- `/submitted` **tự fetch** trạng thái theo `attemptId`
  (`getPlacementClaimStatus`) → không phụ thuộc router state; reload đọc backend.
- `/submitted` dùng `PlacementPublicLayout` (không dùng layout bài thi để
  tránh vòng redirect khi status ≠ `IN_PROGRESS`).
- Attempt/outcome không tồn tại hoặc không đúng quyền trên backend → service throw → view hiện
  `EmptyState` "Không tìm thấy bài làm"; **không** giả định `SUBMITTED`.

## 3. Bản đồ component

| File | Vai trò |
|------|---------|
| `components/learning/attempt/PlacementAttemptLayout.tsx` | Shell + provider; loading/error; redirect khi status ≠ `IN_PROGRESS`; auto-submit **một lần** khi hết giờ; Guest → `/submitted`, User có Result → P04 |
| `components/learning/attempt/PlacementAttemptTimer.tsx` | Đồng hồ `mm:ss`, đổi màu cảnh báo ở 60s cuối; `aria-live="off"` |
| `views/learning/PlacementAttemptView.tsx` | Breadcrumb, H1, danh sách câu theo trang, aside grid + nộp bài, bar mobile |
| `components/learning/attempt/PlacementQuestionCard.tsx` | Badge "Câu 0X" + nhãn kỹ năng; audio (chỉ Listening); passage (Reading); prompt; đáp án |
| `components/learning/attempt/PlacementOptionList.tsx` | `role="radiogroup"` + `role="radio"`, chọn/bỏ chọn (BR-F1.6) |
| `components/learning/attempt/PlacementAudioPlayer.tsx` | Player: `<audio>` thật nếu có URL, nếu không thì mô phỏng bằng ticker |
| `components/learning/attempt/PlacementQuestionGrid.tsx` | Grid 20 câu **3 cột** (theo Stitch): đã trả lời / trang hiện tại, nhảy câu |
| `components/learning/attempt/PlacementPageNav.tsx` | "Câu X–Y / 20" (trang 1 câu → "Câu X / 20") + Trang trước/Trang tiếp |
| `components/learning/attempt/PlacementSubmitButton.tsx` | Chặn 0 câu (BR-F1.9) + Dialog xác nhận |
| `components/learning/attempt/PlacementMobileQuestionBar.tsx` | Bar cố định dưới `<lg`, grid trong Dialog |
| `views/learning/PlacementClaimGateView.tsx` | `/submitted`: post-submit dispatcher, gate Guest; xem doc `03` |

Hooks/services:

- `hooks/usePlacementAttempt.ts` — fetch attempt, seed đáp án, autosave có
  queue, đếm câu đã trả lời, flush + submit; GET/PATCH/Submit dùng cookie Auth
  chung, chỉ load sau khi `useAuth()` đã xác định identity.
- `hooks/usePlacementCountdown.ts` — đếm ngược theo `deadlineAt` + `serverNow`.
- `hooks/placement-attempt-context.ts` — context + `usePlacementAttemptContext`.
- `services/placement-attempt.mock.ts` — mock cũ còn trong source, không dùng
  trong P01–P05 HTTP flow.
- `services/placement.service.ts` — `getPlacementAttempt`,
  `savePlacementAnswer`, `submitPlacementAttempt`, `getPlacementClaimStatus`.

## 4. State & luồng dữ liệu

### 4.1 Phân trang

- `buildPlacementPages(questions)` gom **tối đa 3 câu/trang** và **không trộn
  section** (BR-F1.8). Với Test Set sample hiện tại:
  - Reading: `1–3`, `4–6`, `7–9`, `10–12`, `13–14`
  - Listening: `15–17`, `18–20`
- Trang 1 câu (nếu dữ liệu thật chia như vậy) hiển thị "Câu X / 20", không
  phải "Câu X–X / 20".

### 4.2 Đáp án & autosave

- UI: `Record<questionId, optionId | null>`; chọn lại cùng đáp án = bỏ chọn.
  `answeredCount` = số giá trị khác `null` (BR-F1.7).
- `desiredAnswersRef` = giá trị mới nhất trên UI; `savedAnswersRef` = giá trị
  API **đã xác nhận**. Baseline chỉ được cập nhật **sau khi**
  `savePlacementAnswer()` resolve thành công.
- Save được **serialize theo từng câu** qua một promise chain
  (`saveChainRef`); mỗi task đọc lại `desiredAnswersRef` mới nhất trong vòng
  lặp, nên:
  - chọn A → B → C: server cuối cùng nhận C, không bị response cũ ghi đè A;
  - không có 2 request song song cho cùng một câu.
- Save lỗi: giữ nguyên đáp án trên UI, hiện `saveError`, baseline **không**
  tiến → câu đó vẫn "chưa sync" và sẽ được gửi lại ở lần đổi tiếp theo hoặc
  khi submit (retry một lần).

### 4.3 Submit

- `submit()` gọi `flushPendingAnswers()` trước:
  1. `await saveChainRef` (mọi save đang chạy);
  2. nếu còn câu chưa sync → enqueue lại **một lần** rồi await;
  3. vẫn còn lệch → hiện `saveError`, **không** submit (tránh chấm thiếu câu).
- Chỉ khi tất cả đáp án đã sync mới gọi `submitPlacementAttempt()`.
- Chống gọi trùng: `submittingRef` (chặn double click) + `submitting` state +
  guard `submitResult`.
- 0 câu + submit tay → chặn tại chỗ "Bạn chưa trả lời câu hỏi nào."
  (BR-F1.9); backend cũng từ chối khi còn trước deadline.
- Hết giờ: layout gọi submit **đúng một lần** qua `autoSubmitAttemptedRef`;
  backend quyết định `AUTO_SUBMITTED` (≥1 đáp án) hay `EXPIRED` (0 đáp án)
  (BR-F1.10). FE không tự tạo rule mới.

### 4.4 Đồng hồ

- Offset `serverNow − Date.now()` (một lần theo attempt); tick mỗi giây, tính
  lại khi `focus`/`visibilitychange`; không reset khi quay lại tab.
- `deadlineAt`/`serverNow` không hợp lệ → kẹp về 0 an toàn (không NaN).
- `remaining` được suy ra trong render (không lưu state), nên render đầu tiên
  sau khi load không bị hiểu nhầm là hết giờ.
- `aria-live="off"`: screen reader không đọc mỗi giây.

### 4.5 Không lộ đáp án

`PlacementAttemptDetail` / `PlacementQuestion` khi `IN_PROGRESS` **không** có
`correctOptionId`, `correctAnswer`, `explanation`, `transcript`, `score`,
`placementLevel` (BR-PLT-M.3). Result/Review có type + service riêng;
đáp án đúng chỉ có trong review được cấp quyền.

## 5. Dữ liệu backend sample (FE-I1)

- 20 câu: **14 Reading + 6 Listening**.
- Blueprint độ khó: A1 4R+1L, A2 4R+1L, B1 3R+2L, B2 3R+2L.
- Reading đứng trước Listening; mỗi câu 4 lựa chọn A–D.
- Reading có `passage` (ngữ liệu riêng của câu) và **không** trả
  `explanation`/`transcript`; Listening có `audio.url` nullable + duration thập phân.
- Guest flow dùng GET/PATCH/POST cùng origin qua Vite `/api` proxy.
  Backend sample trả 20 câu, câu trả lời đã lưu;
  `answers[]` có thể thưa, UI hiển thị câu còn lại chưa chọn.
- Browser gửi cookie HttpOnly `placement_guest_session` và (nếu đã đăng nhập)
  `ACCESS_TOKEN` theo path; không đọc hoặc lưu session ID/token trong FE.
- Reload GET cùng Attempt/deadline/serverNow và khôi phục câu đã lưu; backend
  vẫn in-memory nên restart BE mất attempt. Sample audio vẫn `url: null` →
  player hiện tại mô phỏng.

## 6. Điểm UI-only / nợ kỹ thuật

- Backend store **in-memory**: reload FE giữ attempt nếu backend còn chạy và
  cookie còn hiệu lực **đối với Guest**; restart BE sẽ mất attempt.
- F5 P02 chờ AuthProvider `/auth/me` xác nhận role USER (refresh cookie khi cần)
  rồi GET lại đúng Attempt. Backend in-memory restart vẫn mất Attempt.
- Login/Register dùng Auth chung; P02 không lưu token hoặc Guest Session ID.
- Audio mock: không transcript, không volume control thật (icon chỉ trang trí).

## 7. Responsive

- `<lg`: 1 cột; grid + nộp bài nằm trong bar cố định dưới (Dialog); nội dung
  có `pb-24` để không bị che.
- `≥lg`: `grid-cols-12` — 8 cột câu hỏi, 4 cột aside `sticky top-24`.
- Grid câu hỏi: 3 cột (khớp Stitch) ở mọi breakpoint.
- Header: ẩn tiêu đề phụ `<md`, ẩn pill tiến độ `<sm`; đồng hồ luôn hiển thị.

## 8. Checklist refactor khi có API

- [x] Thay ruột `services/placement.service.ts` bằng HTTP thật (giữ chữ ký).
- [ ] Xóa mock cũ khi được duyệt cleanup; service không gọi mock P01–P05.
- [x] Nối `/submitted` (P03 → `03-placement-claim-gate.md`) sang P04 khi
      backend trả `resultAttemptId`; production Auth vẫn chờ.
- [ ] Bật audio thật (`url`) và bỏ nhánh mô phỏng trong `PlacementAudioPlayer`.
- [x] Dùng `/login` + `/register` chung và quay lại P03 để claim.
- [x] Cập nhật bảng `00-mock-api-status.md`.
