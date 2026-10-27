# Lát 1 — public catalog dùng BE thật

User yêu cầu không dùng mock/fixture nữa. Dừng preview4318, bỏ launcher fixture; dùng FE3000 proxy BE8080.
Phạm vi: guest viewer thực tế khi BE chưa có auth; GET topics/search/filter/cursor và GET detail với metadata/counts từ DB hiện tại. Không gán learner/CEFR/progress giả, không seed/reset DB.
BE mở rộng response hiện hữu cho UI: total, totalItemCount, metadata tổng của detail; progress=null và actions yêu cầu đăng nhập trong public slice. Các route học còn dùng provider giả cũ không được FE mở.
Chưa tuyên bố xong My Topics/start/attempt/quiz/retry; các lát sau cần danh tính thật và endpoint đã xác minh.
Kiểm chứng: compile/package BE không chạy test mock, build/lint FE, đọc API thật qua proxy và browser mở catalog -> detail. Không dùng fixture hoặc injected fetch để chứng minh integration.

## Bằng chứng lát public (2026-10-27)

BE package PASS với -Dmaven.test.skip=true; không chạy test mock. FE build PASS (cảnh báo chunk cũ), lint0 errors/70 warnings.
FE http://localhost:3000 -> BE http://localhost:8080. Viewer200 GUEST, không dùng provider user/level giả.
API trực tiếp và proxy trả cùng3 topic/cùng ID; pagination2+1 không trùng, total3, empty search0, detail404 đúng.
Browser thật: lọcB1 -> detail Phong van xin viec -> back giữfilter; reset/search san bay -> detail O san bay. Metadata detail18 từ vựng bằng tổng6 item; không tiến độ giả.
Preview4317/4318 đã dừng, launcher và serverfixture đã xóa. DB không bị seed/reset/migrate, không gọi learning mutation.
Chỉ public read slice được xác minh; My Topics/start/attempt/quiz/retry chưa được xác minh. User đã chọn dùng hồ sơ học viên thật trong DB qua cấu hình local cho lát kế tiếp, chưa có auth.
