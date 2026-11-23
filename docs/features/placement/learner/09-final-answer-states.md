# Placement — kết quả Đúng/Sai và chọn đề ngẫu nhiên

Chủ dự án chốt: sau khi nộp chỉ có hai trạng thái hiển thị Đúng/Sai. Sai tổng = incorrectCount + unansweredCount theo API; không đổi score/level, JSON contract hoặc chọn đáp án thay người dùng. selectedOptionId=null giữ nguyên, chi tiết ghi Bạn không trả lời câu này, chỉ tô đáp án đúng. Lưới/nội dung review dùng màu Sai cho bỏ trống. Khi đang làm vẫn giữ Chưa trả lời để điều hướng. Review quản trị cuối bài thống nhất cách hiển thị, raw blank vẫn được giữ để giải thích.

Mỗi lượt mới chọn ngẫu nhiên một bộ Published đủ điều kiện, bản mới nhất theo code; tiếp tục/reload giữ snapshot của lượt hiện có. Không trộn câu/đáp án hay bỏ ma trận 14Reading/6Listening.

Chủ dự án cho phép hoàn thiện các bộ đề từ ngân hàng hiện có, mục tiêu7Published/3Draft để demo; ba seed phiên bản cũ khóa giữ nguyên ngoài10 bộ biên tập. Không tạo thêm câu hỏi giả hoặc sửa lịch sử đề đã Published. Kiểm tra ma trận/ACTIVE/audio qua API quản trị trước xuất bản. DB local hiện một bộPublished và một bộbiên tậpDraft chưa đủ; sẽ soạn8 bộ mới và hoàn thiện bộDraft hiện có, giữ cả20 câu của đềPublished cũ.

Trình tự: regression UI qua FEproxy/BE/cookie thật trước sửa; sửa presentation và docs; soạn/validate/publish đúng ngân hàng; kiểm tra random/resume trên DB test riêng; build/lint/auth và kiểm tra BE. Sau đó đồng bộdev/táchcommit/push hai nhánh gộp theo plan đã duyệt, không main/dev.
