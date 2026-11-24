# Placement — Guest / học viên

[Entry bàn giao](../README.md). Mỗi màn giữ route/component/state/responsive trong tài liệu tương ứng; dùng API thật, không mock/fallback từ fixture khi HTTP lỗi.

| Route | Tài liệu / hành vi |
| --- | --- |
| `/placement` | [Bắt đầu](01-placement-start.md); User GET current để Tiếp tục/kết quả, không POST lúc mount |
| `/placement/attempts/:attemptId` | [Làm bài](02-placement-attempt.md), Reading/Listening, lưu đáp án và deadline BE |
| `/placement/attempts/:attemptId/submitted` | [Claim gate](03-placement-claim-gate.md), Guest đăng nhập/đăng ký rồi nhận kết quả |
| `/placement/attempts/:attemptId/result` | [Kết quả](04-placement-result.md), dùng attemptId BE trả |
| `/placement/attempts/:attemptId/review` | [Xem lại](05-placement-review.md), đúng snapshot/version |

Guest P01/P03 dùng public navigation như trang chủ; User entry/result/review dùng LearningLayout chung qua adapter feature. P02 là layout làm bài riêng với timer, không sidebar. AuthProvider chung khôi phục phiên qua cookie; không lưu credential/session vào localStorage hoặc tạo User identity từ query.

User Start/Resume theo kết quả GET `/api/v1/placement/attempts/current`; tiếp tục giữ deadline/đề và hướng tới trang chưa trả lời. Guest làm trước, đăng nhập từ P03 rồi claim; User đã đăng nhập nộp đi thẳng kết quả. Claim dùng resultAttemptId thật, có thể khác attempt cũ nếu tài khoản đã có kết quả. Quy tắc thời hạn, ownership và quyền làm lại ở BE.

[Quyền kế thừa](08-inherited-role-access.md): USER gồm CONTENT_MANAGER/ADMIN theo hierarchy; không bỏ ownership. [Trạng thái đáp án cuối](09-final-answer-states.md): câu bỏ trống tính Sai nhưng không đánh dấu đáp án nào đã chọn. Trong bài vẫn có trạng thái chưa trả lời để điều hướng. Listening chỉ phát một audio cùng lúc, pause audio trước khi phát câu khác.

[Bảng kết nối API](00-mock-api-status.md) và [redirect dev cũ](06-placement-dev-login.md). Route/constants ở feature; không nhân bản navbar/sidebar hoặc thay Assessment entry. Báo cáo prepush và kế hoạch cũ xem Git history/bản lưu local, không dùng làm kết quả kiểm chứng hiện hành.
