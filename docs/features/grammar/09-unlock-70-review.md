# Grammar — quy tắc mở cấp70%

- Bài hoàn thành khi đạt từ3/5. Chủ đề hoàn thành khi đủ mọi bài Published.
- P là số chủ đề Published có ít nhất một bài Published ở cấp trước; C là số đã hoàn thành trong tập này. Mở cấp sau khi P>0 và C >= ceil(70*P/100).
- Dùng số nguyên trong BE, không dùng phần trăm hiển thị đã làm tròn. Ví dụ8 chủ đề cần6:4/8 và5/8 chưa mở,6/8 mở.
- Cấp đã lưu giữ nguyên khi chủ đề được lưu trữ hoặc danh mục thay đổi; không thu hồi unlock cũ. Quyền từ User profile được hợp vào, không làm mất tiến độ.
- Không nâng level hồ sơ do hoàn thành Grammar, không thêm kỳ đánh giá bắt buộc hoặc khóa cứng thứ tự các chủ đề trong cùng cấp.

FE hiển thị unlocked/lockHint từ BE; quy tắc thuộc GrammarLearnerServiceImpl. Kiểm thử thật GrammarLearningUnlockIntegrationTest xác nhận thứ tự bài, hoàn thành chủ đề, mốc5/8–6/8 và giữ unlock sau archive. Xem [luồng học](00-grammar-learning.md), [level](06-placement-level-integration.md). Số liệu/lỗi kiểm thử theo ngày được lưu riêng, không phải đặc tả hiện hành.
