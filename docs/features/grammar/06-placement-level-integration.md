# Level hồ sơ và Grammar

User sở hữu user_profiles.cefr_level, chỉ tăng theo chính sách nhóm. Placement chấm/claim hợp lệ gọi UserLevelPromotion; Grammar gọi UserLevelLookup, không ghi level riêng hoặc trực tiếp đổi User. Không coi level hồ sơ là kết quả bài Placement gần nhất.

Roadmap trả currentLevel giới hạn A1–B2: thiếu level là A1, C1/C2 thành B2. Cấp từ profile và unlock đã lưu được hợp lại, không hạ quyền cũ. Profile cao không tự hoàn thành bài; thứ tự bài trong cùng chủ đề vẫn áp dụng. Deep link vẫn kiểm tra cấp và ownership ở BE.

Đạt3/5 hoàn thành bài, đủ các bài Published hoàn thành chủ đề. Mở cấp bằng tiến độ theo [quy tắc70%](09-unlock-70-review.md), không tự nâng User profile hoặc thêm kỳ đánh giá định kỳ bắt buộc. FE hiển thị contract BE, không tự tính quyền từ phần trăm đã làm tròn.

Tài liệu BE: `docs/technical/grammar/grammar-placement-level-integration.md` và `docs/technical/placement/placement-profile-level-integration.md`. Không sửa schema User, routes hoặc layout để tích hợp level.
