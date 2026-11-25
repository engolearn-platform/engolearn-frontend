# Placement — trạng thái kết nối API

Tên file được giữ để tương thích liên kết tài liệu hiện có. Các màn P01–P05 dùng BE HTTP thật qua shared httpService và Vite `/api` proxy; không có mock/fallback được dùng trong luồng thường.

| Màn | API / nguồn dữ liệu |
| --- | --- |
| P01 Start / Resume | GET attempts/current cho User; POST attempts khi chủ động bắt đầu |
| P02 Làm bài | GET attempt, PATCH answers, POST submit, deadline BE |
| P03 Guest claim gate | claim-gate → Auth chung → claim → resultAttemptId |
| P04 Kết quả | Kết quả lưu BE, ownership và quyền USER kế thừa |
| P05 Review | Đúng đề/snapshot của lượt đã cấp, không dùng bản mới nhất |

BE persistence là Mongo với transaction, không in-memory. Reload FE giữ cookie/attempt/deadline; không reset lượt khi BE restart bình thường. Guest cookie `placement_guest_session`, Auth cookie theo contract của nhóm. FE không tạo identity bằng X-Dev-User-Id/query/sessionStorage. Login/Register giữ location.state.from; logout qua Auth chung.

Quy tắc thời gian, một lượt đang hoạt động, claim, chấm và xếp level thuộc BE. GET current không tạo lượt nhưng có thể giải quyết deadline đã hết theo nghiệp vụ. Lỗi HTTP có retry và thông báo, không tạo bài/điểm giả. Test thiếu môi trường bị skip không được coi là đã pass. [Entry hiện hành](README.md).
