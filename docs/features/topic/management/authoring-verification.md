# Kiểm chứng Topic Management F05–F08

## Audit trước thay đổi

Baseline Git là `8a86d4d` ở Backend và `1f96b4f` ở Frontend, cùng nhánh `topic-management`.

| Resource | Create | Read | Update | Delete/Hide | Draft |
| --- | --- | --- | --- | --- | --- |
| Topic | PARTIAL | IMPLEMENTED | PARTIAL | BLOCKED_BY_BUSINESS_RULE | MISSING |
| Topic Item | MISSING | IMPLEMENTED | PARTIAL | PARTIAL | MISSING |
| Context | PARTIAL | IMPLEMENTED | PARTIAL | MISSING | MISSING |
| Dialogue Turns | PARTIAL | IMPLEMENTED | PARTIAL | PARTIAL | MISSING |
| Vocabulary | PARTIAL | IMPLEMENTED | PARTIAL | PARTIAL | MISSING |
| Examples / Collocations | PARTIAL | IMPLEMENTED | PARTIAL | PARTIAL | MISSING |
| Expression Groups | PARTIAL | IMPLEMENTED | PARTIAL | PARTIAL | MISSING |
| Expressions | PARTIAL | IMPLEMENTED | PARTIAL | PARTIAL | MISSING |
| Quiz Modules / Questions | PARTIAL | IMPLEMENTED | PARTIAL | PARTIAL | MISSING |

`PARTIAL` gồm client đã có lời gọi API hoặc màn hình sửa dữ liệu cục bộ. Các endpoint quản trị tại commit gốc chỉ phục vụ GET. API đọc chọn working draft hoặc version thuộc manifest phát hành. Topic Item, Item Version và Topic Version dùng collection riêng. Các bản phát hành và dữ liệu học tập cần giữ nguyên khi soạn nháp.

## Thứ tự triển khai

1. F05 nối form đang có với POST/PATCH, xác minh tạo nháp tối thiểu, cập nhật với revision và đọc lại.
2. F06 kiểm tra trạng thái Item và các tham chiếu lịch sử trước thao tác. Xác minh từng action qua danh sách Item sau lưu.
3. F07 Context và Vocabulary lưu từng section với revision và giữ các trường chưa có control.
4. F07 Expressions và Quizzes áp dụng enum nghiệp vụ riêng cho từng khái niệm và giữ dữ liệu đáp án phía quản trị.
5. F08 kiểm tra vòng đời nháp, lỗi đồng thời, tích hợp media và chạy lại luồng đọc Phase 1.

## F05 và hồi quy Phase 1 đã kiểm chứng

- 4 test tích hợp mutation Backend chạy với MongoDB Testcontainers. Kiểm tra nháp tối thiểu, PATCH bỏ qua/xóa trường, 409, phân quyền, từ chối trường hệ thống và bảo toàn release khi sửa metadata Topic.
- Edge chạy qua Vite proxy, Spring Boot và một replica set MongoDB thử nghiệm. Kiểm tra 401/403, tạo nháp với hai tiêu đề, PATCH CEFR và category, mở hai tab tạo xung đột, giữ nội dung nhập trên tab cũ, tải lại và đọc trực tiếp MongoDB.
- Trình duyệt đi qua danh sách, chi tiết, Item và bốn tab Bối cảnh/Từ vựng/Mẫu câu/Quiz trên dữ liệu Phase 1 đã import vào MongoDB. Tab Quiz còn đúng sau refresh, và Back mở lại tab Mẫu câu.
- Ảnh và JSON kiểm chứng ở `e2e-artifacts/topic-authoring/` tại workspace. Harness ở `engolearn-backend/src/test/python/topic_authoring_acceptance.py` dùng riêng container `engolearn-topic-authoring-test`.
- Frontend build thành công. Lint trả 0 lỗi và 72 cảnh báo. 7 test authoring/management read và 21 test auth qua. Hai test Learner hợp đồng lỗi giống nhau khi chạy từ commit Phase 1 `1f96b4f`: số operation `20 !== 17` và ví dụ response thiếu `entries`.

## F06 đã kiểm chứng trên trình duyệt

- Tạo hai Item nháp trong Topic, đổi thứ tự, sửa mô tả/thời lượng, tải lại, ẩn/hiện, xóa Item nháp đủ điều kiện. `topic_items` và `topic_item_versions` phản ánh đúng thao tác. Các bước chạy tiếp đến kiểm tra Phase 1 và trả exit 0.
- Ảnh `04-item-list-reload.png` ghi kết quả lưu và mở lại danh sách. JSON ghi cả kiểm tra MongoDB sau xóa.

## Kiểm chứng Context và Vocabulary

- Suite Backend đã qua 22 test. Gồm 9 test kiến trúc, 4 test Topic, 6 test Item và 3 test tài nguyên đã chạy với Testcontainers.
- Edge lưu rồi tải lại bối cảnh và hội thoại đã đổi thứ tự, lưu xóa dòng thoại, nhập và lưu từ vựng cùng ví dụ và collocation. Truy vấn MongoDB xác nhận các trường đã lưu. Cả luồng chỉ đọc Phase 1 chạy lại trong cùng phiên.
- Ảnh `09-context-reloaded.png` và `10-vocabulary-reloaded.png` nằm trong thư mục ảnh kiểm chứng. Nội dung nháp có thể lưu trước khi đạt số lượng cần cho publish.

## Ma trận sau triển khai

| Resource | Create | Read | Update | Delete/Hide | Draft |
| --- | --- | --- | --- | --- | --- |
| Topic | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | BLOCKED_BY_BUSINESS_RULE | IMPLEMENTED |
| Topic Item | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Context | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Dialogue Turns | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Vocabulary | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Examples / Collocations | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Expression Groups | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Expressions | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Quiz Modules / Questions | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |

Hàng Item và tài nguyên phản ánh CRUD trên bản nháp và các thao tác đã được phép trên bản phát hành. Xóa Item bị chặn nếu có dữ liệu học hoặc lịch sử liên quan. Ẩn bản phát hành phải giữ tối thiểu 5 Item hiển thị và có thể bị chặn nếu trạng thái bản phát hành cùng working draft khiến bản đang hiển thị không xác định được. Chỉnh nội dung đã phát hành qua MINOR/MAJOR phụ thuộc F10.

## Quyết định và phụ thuộc nghiệp vụ

| Yêu cầu | Hành vi cần giữ | Bằng chứng và việc còn phụ thuộc |
| --- | --- | --- |
| BR-F5.6, BR-F10.7 | Sửa metadata Topic đã phát hành tại chỗ. | PATCH chỉ ghi metadata trong `topics`. Test kiểm tra release pointer và nội dung release. |
| Xóa Topic | Chưa có điều kiện hard delete trong F05. | Cần quyết định về dữ liệu và lịch sử tham chiếu trước khi bổ sung. |
| BR-F6.6 | Giá trị aggregate của bản đã phát hành được chốt theo lần publish. | Phase 1 tính aggregate quản trị từ phiên bản gần nhất. Hợp đồng đọc này giữ nguyên. Cần thiết kế F09 để quản trị hiển thị rõ aggregate bản nháp và bản phát hành khi hai giá trị khác nhau. |
| BR-F10.1–BR-F10.8, BR-M.5 | MINOR chỉ sửa nội dung cho phép. MAJOR tạo phiên bản mới, phát hành theo đợt và giữ phiên bản học dở. | F10 cần contract phân loại thay đổi, tạo working copy và phát hành có kiểm tra, cùng test learner attempt đã chốt manifest. |
| BR-F8.5, BR-F9.5 | Kiểm tra loại và kích thước file thực tế, lưu nháp được khi upload lỗi. | Upload dùng MediaManagement và lưu tham chiếu do Topic sở hữu. URL được phân giải khi đọc có quyền. Các URL cũ vẫn hiển thị, và thiếu thông tin file để đối chiếu loại hay kích thước. |

## Thiết kế ghi section Draft

Các lệnh F07 cần kiểm tra Topic cha, revision và version đích trước khi ghi đúng section. Tài nguyên có tham chiếu giữ ID hiện hành. Với danh sách nhúng không có ID hay tham chiếu, client gửi thứ tự và nội dung của cả danh sách thuộc một revision, Backend không nhận index làm ID của tài nguyên trong URL. Nếu nội dung đã phát hành hoặc version đích không xác minh được, lệnh không được chỉnh dữ liệu lịch sử.

- Context giữ `prompt`, `scenarioDescription`, `durationSec`, `tips` và các field của từng dòng hội thoại. Form Draft cho phép bỏ trống các field nội dung.
- Vocabulary giữ toàn bộ snapshot, ví dụ, collocation và Quick Check. Các trường `vocabId` / `senseId` liên kết qua Dictionary. Khi xóa phải xét các mẫu câu đang tham chiếu từ vựng.
- Expression group type, expression type và label cần hợp đồng riêng. Legacy `ExpressionType` chỉ có `BASIC_SUGGESTION`, `POLITE_INQUIRY`, `SLOT_PATTERN` và không tự biểu diễn cả ba khái niệm.
- Quiz chỉ author hai dạng trong BR-F7.13. Đáp án lưu theo mô hình mà `TopicQuizMapper` dùng để chấm, và không được đưa vào payload câu hỏi Learner trước bước chấm.

## Kết quả kiểm thử tổng hợp

| Kiểm tra | Kết quả |
| --- | --- |
| Backend `verify` có chọn suite Topic Management, readiness, media và ArchitectureTest | 54 test qua, 0 lỗi, 0 bỏ qua. MongoDB Testcontainers chạy thật. |
| Backend `verify` toàn repo | 893 test, 7 failures, 61 errors, 29 skipped. Các nhóm lỗi gồm cấu hình boot, quyền MongoDB của Placement, Subscription và một số test Learner Topic. |
| Backend đối chiếu bản gốc `8a86d4d` | Tái hiện 5 lỗi trong TopicBrowseServiceImplTest, TopicQuizReadTest và TopicQuizAnswerTest từ Git archive của commit Phase 1. |
| Frontend | Build và lint chế độ lỗi qua. 8 test adapter/management-read và 21 test auth qua. Hai lỗi Learner API đã tái hiện trên commit gốc. |
| Browser E2E | Edge → Vite → Spring Boot → MongoDB replica set. Harness trả exit 0 với 22 kiểm tra, bao gồm lưu và tải lại hai loại Quiz, lỗi revision 409 từ hai tab, hồi quy Phase 1, ảnh giả bị từ chối và mở trình sửa ở viewport 390 px. |

Các hạng mục cần xác minh thêm gồm upload thành công lên Cloudinary thực, phản hồi chưa đến client sau một POST tạo mới và các quy tắc F09/F10 khi phát hành. Lưu nhiều lần từ URL chỉnh sửa dùng PATCH/PUT trên ID đã lưu. API chưa có khóa idempotency để gửi lại POST sau khi mất phản hồi.

Kết quả đầy đủ ở `e2e-artifacts/topic-authoring/verification.json`. Ảnh `12-quizzes-reloaded.png` ghi lại hai dạng câu hỏi sau tải lại. Ảnh `14-media-rejected-draft-saved.png` ghi lại khả năng lưu nháp sau lỗi upload. Ảnh `15-mobile-topic-editor.png` ghi lại trình sửa Topic ở 390 px.

## Phân công và tích hợp

| Hạng mục | Phân công |
| --- | --- |
| Audit Phase 1 và mô hình dữ liệu | `context_reader` khảo sát, Orchestrator đối chiếu tài liệu nghiệp vụ và xác định thứ tự triển khai. |
| F05–F06 | `f05_backend` phụ trách mutation Backend F05. Orchestrator tích hợp frontend, triển khai và xác minh các thao tác Item. |
| F07 | `f07_context_vocabulary_backend`, `f07_vocabulary_frontend` và `expressions_quizzes_backend` phụ trách các phần theo tên. Orchestrator tích hợp các màn hình, kiểm thử và xử lý kết quả review. |
| F08 | `publish_readiness` và `topic_media_backend` triển khai Backend. Orchestrator tích hợp luồng lưu nháp, media, revision và kiểm thử end-to-end. |
| Rà soát cuối | `final_review` rà quyền đọc media và điều kiện xóa Item. Orchestrator kiểm tra bộ xác thực file của MediaManagement, xác nhận ảnh giả trả 400 và chạy lại các suite nêu trên. |

### Chạy lại browser harness

Harness `engolearn-backend/src/test/python/topic_authoring_acceptance.py` dùng Python Playwright với Edge, frontend qua proxy và Backend profile dev. Chạy từ workspace root. Dùng MongoDB replica set thử nghiệm mang tên container `engolearn-topic-authoring-test` và database `engolearn_db`. Harness tự đăng ký tài khoản thử nghiệm và gán vai trò trong container này. Seed Phase 1 gồm bốn collection Topic, TopicVersion, Item và ItemVersion.

Đặt `TOPIC_AUTHORING_FE` bằng origin của frontend đã được Backend cho phép. Giá trị `1` ở các biến `TOPIC_AUTHORING_ITEMS`, `TOPIC_AUTHORING_CONTEXT`, `TOPIC_AUTHORING_VOCABULARY`, `TOPIC_AUTHORING_EXPRESSIONS`, `TOPIC_AUTHORING_QUIZZES`, `TOPIC_AUTHORING_READ_FIXTURE`, `TOPIC_AUTHORING_READINESS`, `TOPIC_AUTHORING_MEDIA` và `TOPIC_AUTHORING_MOBILE` chạy các phần tương ứng. Kết quả thực tế được ghi ở `e2e-artifacts/topic-authoring/verification.json` cùng ảnh chụp.
