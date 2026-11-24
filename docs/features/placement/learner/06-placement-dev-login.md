# 06 — Legacy DEV login redirect (chỉ Vite DEV)

## Route & trigger

`/placement/dev-login?returnTo=...` là route tương thích URL cũ trong
`PlacementRoutes`, chỉ đăng ký trong Vite DEV. P03/header hiện dẫn trực tiếp
đến `/login` hoặc `/register` chung, không gọi route này nữa.

## Component & state

`PlacementDevLoginView` chỉ redirect sang Login chung và truyền
`location.state.from` từ `returnTo` hợp lệ. Nếu đã xác thực, redirect trực tiếp
về `returnTo`. Chỉ chấp nhận `/placement` và path/query/fragment thuộc Placement;
giá trị khác fallback `/placement`. Không gửi DEV header hoặc đặt fake identity.

## UI / responsive / giới hạn

Không có UI/login riêng tại route cũ; Login/Register chung xử lý form và cookie.
AuthProvider `/auth/me` phục hồi User khi F5; backend in-memory restart vẫn làm
mất Placement Attempt. Reload trực tiếp trang Login làm mất return-to ở
`location.state`; user có thể quay lại P03 bằng URL khi Guest cookie còn hạn.

## Checklist

- [x] Route legacy chỉ ở Vite DEV; Login/Register chung xử lý xác thực.
- [x] `returnTo` legacy nội bộ Placement, không open redirect.
