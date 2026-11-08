# Speaking với AI — luồng người dùng FE

Nguồn nghiệp vụ: [module](../../../../../docs/engolearn-business-doc/docs/usecase_spec/speaking-with-AI/00-module.md), [F01 phiên luyện nói](../../../../../docs/engolearn-business-doc/docs/usecase_spec/speaking-with-AI/f01-speaking-session/README.md), [F02 lịch sử](../../../../../docs/engolearn-business-doc/docs/usecase_spec/speaking-with-AI/f02-speaking-history/README.md), [F03 cấu hình](../../../../../docs/engolearn-business-doc/docs/usecase_spec/speaking-with-AI/f03-speaking-configuration/README.md). Đối chiếu backend ở [ánh xạ nghiệp vụ BE](../../../../speaking-ai-baseline-backend/docs/features/speaking-with-ai/README.md).

## Màn hình và mã sở hữu

| Điểm vào | Mã và hành vi |
| --- | --- |
| Kết quả bài học → `/topics/:topicId/items/:itemId/speaking` | [TopicItemResultView](../../../src/features/topic/views/learning/TopicItemResultView.tsx) mở tab mới khi cờ FE bật. Route cũ `/topics/:itemId/speaking` vẫn dùng cùng view. |
| Trang luyện nói và `/speaking/history` | [SpeakingView](../../../src/features/topic/views/learning/SpeakingView.tsx) quản lý phiên, lịch sử, audio, chuyển điều khiển và tổng kết. Route lịch sử bắt đầu ở tab **Lịch sử** và dùng phạm vi tài khoản; route item lọc lịch sử theo item. |
| Lượt nói trực tiếp | [useSpeakingStream](../../../src/features/topic/hooks/useSpeakingStream.ts) quản lý kết nối riêng với trạng thái ghi âm, mic/AudioWorklet, các lệnh socket và nguồn snapshot. [speaking.service.ts](../../../src/features/topic/services/speaking.service.ts) gọi REST qua HTTP client dùng chung. |

## F01 — Phiên luyện nói

| Use case | Người học thấy và làm gì | Phần còn thiếu hoặc chưa xác minh |
| --- | --- | --- |
| SPK-UC-001 — Mở phiên | Mở trang chỉ đọc phiên hiện tại, lịch sử và cấu hình item. **Bắt đầu phiên mới** xin mic trước khi gọi tạo phiên. Nếu có phiên ở item khác, vị trí điều khiển có thể kết thúc phiên cũ; nút **Thay thế và bắt đầu** xin mic rồi gọi replace. Nếu có phiên của item này, dùng **Tiếp tục phiên** để phục hồi hoặc lấy quyền điều khiển. | Điểm vào UI hiện ở kết quả item, chưa có tab ở mọi chế độ học như BR-38.7. Cờ hiển thị không kiểm tra cấu hình từng item; BE trả lỗi khi item không khả dụng hoặc thiếu cấu hình. Chưa đo p95 mở phiên và chưa thử đủ trình duyệt. |
| SPK-UC-002 — Thực hiện lượt nói | Xem tình huống, hai vai và mục tiêu đã ghim. Nếu AI mở lời: chờ chuẩn bị, xem câu mở đầu và gợi ý, phát audio nếu có, hoặc thử lại khi tạo câu lỗi. Nếu người học mở lời: màn hình hướng dẫn nói trước. Khi socket sẵn sàng, đúng quyền và BE cho bắt đầu, **Nhấn để nói** mở lượt; chữ tạm xuất hiện trong lúc nói. **Chốt câu** dừng thu và chờ đánh giá. Lời mở đầu và chữ tạm không tính vào lượt. | `PENDING` hiện đang xử lý; `INVALID`/`FAILED` hiện trạng thái tương ứng và không tạo thành tích. Mic bị khóa khi audio đang tải/phát. Chưa kiểm chứng độ trễ, độ chính xác STT, cảnh báo mạng yếu theo ngưỡng nghiệp vụ hoặc chất lượng nhận xét trực tiếp. |
| SPK-UC-003 — Kết thúc | **Kết thúc phiên** gửi epoch điều khiển. UI có trạng thái chờ tổng kết khi gửi End hoặc khi chạm giới hạn quan sát được. Chỉ snapshot `COMPLETED`/`INCOMPLETE` từ BE mở tổng kết; mục tiêu Bắt buộc đã đạt không tự đồng nghĩa đã kết thúc. **Luyện lại** tạo phiên mới theo điều kiện hiện hành. | BE không trả trạng thái công khai `FINALIZING`; FE không tự suy ra lý do hay kết quả. Xem [chi tiết tổng kết](achievement-session-result.md) và các giới hạn của luồng chốt ở BE. |
| SPK-UC-004 — Gián đoạn | Mất socket dừng thu, bỏ phần chưa chốt, báo thử nối lại tối đa ba lần cách khoảng ba giây. Kết nối lại nhận snapshot phiên cũ. Hết lần thử có thể quay lại và dùng **Tiếp tục phiên** nếu còn hạn. Tab cũ mất quyền khi server báo đổi controller. Đóng tab dừng tài nguyên local và không gửi End. | Chưa kiểm chứng mất mạng, mất mic, đăng xuất/thu hồi quyền hoặc khởi động lại qua môi trường thật. Không có luồng luyện offline. |

Lời mở đầu AI hiển thị một lần trước lượt đầu và có thể phát lại. FE chỉ thử tự phát lời mở đầu khi nhận chuyển đổi sang `READY` trực tiếp từ `OPENING_UPDATED`; mở lại trang hoặc hydrate không tự phát. Phản hồi sau lượt dùng snapshot đã đánh giá để hiển thị lời đáp/nhận xét; nút phát lại chỉ xuất hiện khi có audio. Speaking không ghi tiến độ Topic, không mở khóa bài tiếp theo và không thay thao tác **Làm lại**.

## F02 — Lịch sử luyện nói

| Use case | Người học thấy và làm gì | Phần còn thiếu hoặc chưa xác minh |
| --- | --- | --- |
| SPK-UC-005 — Xem danh sách | Tab **Lịch sử** của item đọc phiên chưa xóa của item; **Xem mọi item** hoặc sidebar mở `/speaking/history`, kể cả phiên ở item đã ẩn. Danh sách hiện tên, thời điểm, trạng thái và số lượt hợp lệ. Không xin mic để đọc lịch sử. | Danh sách hiện chưa có tóm tắt mục tiêu theo từng dòng như BR-F2.1; p95 và tình huống sự cố chưa được đo. |
| SPK-UC-006 — Xem chi tiết | Chọn tên phiên để render snapshot đã có từ lịch sử; phiên kết thúc hiển thị tổng kết, bằng chứng và hội thoại. Phát bản ghi còn hạn hoặc phản hồi AI khả dụng bằng URL do BE cấp. Không tự phát chỉ vì mở lịch sử. | Hạn 30 ngày của bản ghi người học do BE thực thi. Chưa đo p95 tải chi tiết và thời gian bắt đầu phát; chọn dòng hiện không gọi một GET chi tiết riêng. |
| SPK-UC-007 — Xóa dữ liệu | Biểu tượng **Xóa phiên** hoặc **Xóa toàn bộ** yêu cầu xác nhận. Khi BE thành công, FE tải lại danh sách. **Xóa toàn bộ** áp dụng ở cấp tài khoản ngay cả khi bấm từ lịch sử một item. | Hành vi dữ liệu đến muộn và nhiều tab cần kiểm tra tích hợp. Không có thao tác khôi phục phiên đã xóa trong FE. |

## F03 — Cấu hình Speaking

SPK-UC-008/009/010 dành cho Content Manager: **chưa có** màn hình soạn cấu hình nháp, chặn publish theo lỗi Speaking, hoặc sửa cấu hình sau publish theo MINOR/MAJOR. FE chỉ đọc cấu hình đã publish để mở phiên và dùng snapshot đã ghim để xem lại. Seed ở BE phục vụ thử nghiệm, không phải luồng quản trị.

Xem [hợp đồng API](api-contract.md) và [cách chạy thử](README.md#chạy-thử-bằng-dữ-liệu-thật-của-môi-trường-local).
