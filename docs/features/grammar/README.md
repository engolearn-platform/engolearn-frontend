# Grammar — bàn giao frontend

| Nội dung | Tài liệu |
| --- | --- |
| Routes, API và trạng thái learner | [Luồng học](00-grammar-learning.md) |
| Quyết định thiết kế User V4 | [Thiết kế](01-user-v4-design.md) |
| Danh sách màn quản trị | [Management](management/README.md) |
| Auth, media và kiểm tra thật | [Tích hợp nhóm](04-team-dev-integration.md) |
| Profile và mở cấp | [Tích hợp level](06-placement-level-integration.md), [ngưỡng70%](09-unlock-70-review.md) |
| Điều hướng lý thuyết/checklist | [Điều hướng](07-learning-management-navigation.md) |

Chạy `npm ci`, `npm run dev`; mở `/grammar` hoặc `/admin/grammar`. BE chạy EngolearnApplication profile dev, Mongo replica set, Auth cookie thật. Cấu hình nhóm và dữ liệu nằm ở repo BE: `docs/technical/grammar/README.md` và `tools/mongo-json-importer/samples/grammar/README.md`.

Không nhập seed từ FE. Seed mặc định Draft/ready=false; nội dung chưa Published sẽ không xuất hiện cho học viên. Tên hiển thị English (Tiếng Việt) từ titleEn/titleVi, không gộp hoặc thay model. Cấu trúc theo [kiến trúc FE](../../architecture/project-structure.md), dùng LearningLayout/ManagementLayout và auth contract của nhóm.

Kiểm tra `npm run build`, `npm run lint`, `npm run test:auth`; integration cần FE proxy/BE/Mongo thật. Các báo cáo kết quả cũ và kế hoạch triển khai không còn nằm trong gói tài liệu hiện hành; xem Git history hoặc bản lưu local của người phụ trách.

Homepage read capability: the module exports its new `loadGrammarHomeSummary` client and summary types through its public contract. Existing APIs and feature flows are unchanged. See [homepage integration](../topic/learner/15-homepage.md).
