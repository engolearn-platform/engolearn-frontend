# Tích hợp nhóm — Grammar / Placement

Giữ cấu trúc [feature-based](../../architecture/project-structure.md), LearningLayout/ManagementLayout, router và hệ thống Auth của nhóm. Import ProtectedRoute/HasRole từ `@features/auth/contract`. USER học viên, CONTENT_MANAGER quản trị Grammar, ADMIN quản trị Placement và kế thừa quyền thấp hơn; không bỏ ownership.

BE runtime và seed xem `engolearn-backend/docs/technical/placement/README.md` và `docs/technical/grammar/README.md`. Chỉ profile dev/prod; prod yêu cầu HTTPS/secure cookies và media bền vững. Không có Cloudinary secret ở FE.

Listening dùng catalog/upload WAV thật qua BE → Media. Upload chỉ ADMIN; request dùng cookie và refresh chung trước một lần retry. PlacementQuestionFields.onChange nhận Dispatch<SetStateAction<ManagementQuestionDraft>>; cập nhật từ draft hiện tại để phản hồi upload trễ không ghi đè nội dung đang sửa. Audio hiển thị lỗi thực, không giả thời gian phát; phát audio khác thì pause audio trước và giữ vị trí.

## Kiểm tra

`npm run build`, `npm run lint`, `npm run test:auth`. Test Auth supplement chính sách FE, không thay chứng cứ API/DB. Các test `tests/placement-*.integration.test.mjs` dùng FE proxy/BE thật; cấp TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD và PLACEMENT_REAL_AUDIO_FILE theo nhu cầu test qua process environment riêng. Không commit credential. Test catalog xác minh tải trực tiếp/reload vẫn đối chiếu tên đúng version và không tải cả ngân hàng câu hỏi.

Lỗi/skips cần báo rõ; không lấy số kiểm tra trong báo cáo cũ làm kết quả của cây code hiện tại. Các mẫu dữ liệu compatibility và bài test đang sử dụng chúng vẫn giữ, không xóa chỉ vì tên có legacy.
