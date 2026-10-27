# Topic Learning — bàn giao từ FE sang BE

Ngày: 2026-10-27. Chặng 1: contract + client, chờ review.
Đây là contract đích được xây theo scope người dùng duyệt, không phải mô tả BE đã làm xong.
Schema và tên trường chuẩn ở [api.openapi.yaml](api.openapi.yaml). File đó dùng cú pháp JSON, là một tập con hợp lệ của YAML 1.2, để sinh TypeScript và kiểm tra bằng Node mà không cài thêm thư viện.

## Phạm vi và nguồn

- Source nghiệp vụ: [module](../../../../engolearn-business-docs-and-tools/docs/usecase_spec/topic-learning/00-module.md), [F01](../../../../engolearn-business-docs-and-tools/docs/usecase_spec/topic-learning/f01-kham-pha-topic/rules.md), [F02](../../../../engolearn-business-docs-and-tools/docs/usecase_spec/topic-learning/f02-hoc-topic-item/rules.md), [F03](../../../../engolearn-business-docs-and-tools/docs/usecase_spec/topic-learning/f03-lam-quiz/rules.md), [F04](../../../../engolearn-business-docs-and-tools/docs/usecase_spec/topic-learning/f04-hoan-thanh-hoc-lai/rules.md).
- Baseline BE: [contract ngắn](../../../../engolearn-backend/docs/topic/api_contract_short.md), [contract đầy đủ](../../../../engolearn-backend/docs/topic/api_contract.md).
- Quyết định mới thay mô tả cũ: Khám phá chỉ có topic chưa từng bắt đầu; bắt đầu được ghi nhận khi bấm “Bắt đầu học” và BE lưu thành công tại CONTEXT/0. Không đợi Tiếp tục khỏi Bối cảnh.
- Scope: F01, học nội dung/audio, hai quiz FILL_BLANK rồi SITUATIONAL_CHOICE, tổng kết, xem lại và làm lại item/topic.
- Không thêm auth/user collection trong task này; không WORD_ORDER, MATCHING, DICTATION, XP, lưu từ hay báo lỗi.
- Chặng 1 không đổi routes/views/hooks cũ; các màn hiện vẫn dùng mock. Chỉ các chặng sau mới chuyển sang client mới.

## Thuật ngữ trong contract

- Item: tình huống ổn định, định danh topicItemId; không dùng topicId thay itemId.
- Version: snapshot nội dung của item. LEARN/RETRY chốt version tại thao tác bắt đầu; MINOR sửa tại chỗ, MAJOR tạo version mới.
- Attempt: lượt học một item (LEARN hoặc RETRY), có attemptId, revision, frontier và kết quả riêng.
- Frontier/position: đơn vị kế tiếp cần học hoặc quiz đầu tiên chưa đúng. Vị trí đang xem trên UI có thể ở phía trước frontier, không kéo frontier lùi.
- Retry session: lượt làm lại một item hoặc cả topic. Có tập item/version cố định và danh sách completedItemIds riêng; không dùng trạng thái COMPLETED cũ để suy ra đã làm lại xong.
- Review: đọc kết quả hiện hành đã hoàn thành, không tạo attempt, không ghi vị trí hoặc đổi kết quả.

## Danh tính trước khi có auth

GET /topic-learning/viewer lấy cùng provider BE dùng cho mọi API learning. Provider hiện tại có thể tiếp tục trả learner cố định C2; không bắt tạo collection user.
FE không gửi userId/level giả, không sáng chế token, và không coi lỗi mạng/404 viewer là guest.
Viewer GUEST trả các trường cá nhân null. Viewer LEARNER có learnerId, displayName, cefrLevel.
Lỗi code SIGN_IN_REQUIRED ở learner-only route trả401; đây là thay đổi so với422 hiện tại. Các lỗi điều kiện học khác vẫn422.
Test nhiều user/level ở FE dùng fetch được tiêm trong test; không tuyên bố đã xác minh auth hay cách ly user ở BE.
Khi có auth thật sau này, BE tiếp tục giữ hình dạng viewer; session/CSRF/refresh nằm ngoài contract lần này.

## Các nhóm API

Mọi đường dẫn dưới /api/v1. GET là chỉ đọc. Schema, tham số và operationId nằm trong OpenAPI.

| Nhóm | Endpoint |
| --- | --- |
| Người xem | GET /topic-learning/viewer |
| Khám phá | GET /topics?level=&keyword=&sort=&limit=&cursor= |
| Chủ đề của tôi | GET /topics/mine?status=IN_PROGRESS hoặc COMPLETED |
| Chi tiết / tiến độ topic | GET /topics/{topicId}; GET /topics/{topicId}/progress |
| Bắt đầu item | POST /topic-items/{itemId}/attempts |
| Tiếp tục lượt | GET /topic-attempts/{attemptId}; GET .../content |
| Ghi lần truy cập | POST /topic-attempts/{attemptId}/access |
| Đi tiếp nội dung | POST /topic-attempts/{attemptId}/advance |
| Quiz hiện tại / trả lời | GET /topic-attempts/{attemptId}/quiz; POST .../quizzes/{quizId}/answers |
| Kết quả / xem lại item | GET /topic-attempts/{attemptId}/result; GET .../review |
| Tổng kết topic | GET /topics/{topicId}/result |
| Làm lại topic / resume session | POST /topics/{topicId}/retry-sessions; GET /topic-retry-sessions/{retrySessionId} |

BE giữ các route legacy /topic-items/{id}/content và GET/PUT position để không phá consumer cũ. Client mới không dùng chúng. Không cho route legacy bỏ qua tính hợp lệ tuần tự/chấm quiz của attempt mới.

## Phân danh sách, sort và cursor

1. Learner: Khám phá chỉ chứa topic publish chưa từng được bắt đầu bởi learner đó. GET chi tiết không tính là bắt đầu.
2. Topic đã bắt đầu/hoàn thành vào Chủ đề của tôi, không xuất hiện đồng thời ở Khám phá. Không suy từ percent: item đang học tại CONTEXT/0 có0% nhưng đã bắt đầu.
3. Ghi nhận lịch sử đã bắt đầu độc lập với các item hiện đang hiển thị. Ẩn item/cập nhật version không khiến topic “chưa từng học” trở lại.
4. Guest: Khám phá có mọi topic publish; không có progress/status cá nhân, cờ level hay lọc “đúng level”.
5. Áp scope, keyword, level và sort TRƯỚC phân trang. total là tổng khớp đầy đủ, không phải số hàng trang hiện tại.
6. recommended: level của learner trước; level thấp hơn từ gần đến xa; level cao hơn tăng dần; cùng level theo Content Manager order, cuối cùng topicId. Guest xếp level tăng dần.
7. duration: tổng duration item hiển thị tăng dần, hòa thì recommended và topicId.
8. Mine: không search/filter level; tab mặc định IN_PROGRESS; lastAccessedAt giảm dần, hòa topicId tăng dần. counts gồm cả hai tab; total của tab đang chọn.
9. Cursor opaque, gắn viewer, scope/tab, keyword, level, sort; đổi bất kỳ lựa chọn nào phải bỏ cursor. nextCursor khác null khi và chỉ khi hasMore=true.
10. Cập nhật recency bằng start/advance/answer hoặc event access rõ ràng khi mở lại/review item. access không đổi attempt revision, frontier, accuracy hay learning status.
11. Gỡ publish loại topic khỏi cả hai danh sách. Lượt đang chạy vẫn được kết thúc qua attempt endpoints; không dùng GET item legacy để làm mất quyền tiếp tục.

## Bắt đầu và quyền thao tác

Item chưa học hiển thị “Bắt đầu học”; chỉ bật khi đến lượt và đủ level. Bài chưa đến lượt có lý do khóa.
BE kiểm tra level, predecessor hiển thị và item khác đang học trong cùng topic. Khác topic được học song song.
LEARN thành công phải atomically tạo/find attempt, chốt release+version, lưu CONTEXT/0, IN_PROGRESS và recency, đánh dấu topic đã bắt đầu.
FE chỉ chuyển màn và cập nhật hai danh sách sau phản hồi thành công; không tự tăng số item hoàn thành.
Ví dụ body LEARN:

~~~json
{ "mode": "LEARN", "retrySessionId": null, "replaceRetrySessionId": null }
~~~

Bấm lặp cùng thao tác không tạo hai attempt. Với LEARN đang chạy trên cùng item, trả attempt đó, không reset.
Level chỉ kiểm tra khi LEARN mới/RETRY mới; continue/review/resume retry không kiểm tra lại.
actions ở từng item là kết quả kiểm tra của BE: start, continue, review, retry, resumeRetry, restartRetry; lý do là mã ổn định. FE không lấy một cờ locked chung để đoán mọi quyền.
Sau khi level giảm vẫn tiếp tục/review được phần đã có quyền. Guest chỉ xem outline.
Topic detail có learningAttempt và retryAttempt tách riêng; item đã hoàn thành đang retry vẫn COMPLETED.
Một topic tối đa một LEARN item dở và một retry session dở. Nếu thêm item mới khi đang retry, kết quả chính thức vẫn theo BR-08.6; đừng lấy retry position thay learning position.

## Nội dung, index, header và nav

- Bốn giai đoạn UI: Bối cảnh, Từ vựng, Mẫu câu, Luyện tập. Luyện tập chứa hai stage lưu riêng.
- CONTEXT có đúng index0. VOCAB đánh index từ0 theo orderIndex, tie theo ID ổn định.
- EXPRESSIONS đánh index từ0 trên purposes đã flatten: thứ tự array expressions, trong mỗi group theo orderIndex và purposeId để phá hòa. Một đơn vị Tiếp tục là một purpose cùng toàn bộ mẫu câu của nó.
- Quiz index từ0 trong từng type, thứ tự Content Manager cố định. Option ID ổn định dù thứ tự hiển thị thay đổi.
- advance nhận revision và vị trí NGUỒN đang ở frontier, không nhận vị trí đích tùy ý:

~~~json
{ "revision": 0, "stage": "CONTEXT", "itemIndex": 0 }
~~~

BE trả attempt mới ở VOCAB/0. Không cho nhảy qua từ/nhóm, advance quiz hoặc ghi vào completed/review.
Không yêu cầu scroll, nghe audio hay trả lời quick check đúng để hoàn thành nội dung.
Các bước đã học được mở xem chỉ đọc; “Quay lại vị trí đang học” dùng frontier từ attempt. Dropdown nav mở nhánh hiện tại, các nhánh khác thu gọn.
GET content phải trả snapshot đúng version đã chốt, kể cả khi bản publish mới có cấu trúc khác.
Các optional media/tips/quickCheck là null; các danh sách rỗng là[], khôngnull. Không dựng dữ liệu minh họa khi thiếu.
Bổ sung stable IDs cho purpose/expression/example để FE render và điều hướng ổn định. Audio là URL HTTP(S) dùng được, không phải tên file không có base; không tự phát.
Audio tình huống (promptAudioUrl) nếu có có thể nghe trước đáp án; audio câu trả lời đúng chỉ có sau chấm đúng.
QuickCheck local được trả correctAnswer, tùy chọn và không ghi accuracy. Formal quiz không lộ đáp án trước khi đúng.

## Quiz, retry mạng và cạnh tranh

- Chọn option là chấm ngay; không có bước Nộp riêng. Đang gửi khóa lựa chọn để không gửi đồng thời.
- Idempotency-Key bắt buộc cho mọi POST,1–128 ký tự. Một key cho một hành động, retry đúng body+URL+key nếu phản hồi chưa rõ; không tự tạo key mới mỗi lần thử lại mạng.
- Key được gắn với viewer+method+path; cùng key khác body trả409 IDEMPOTENCY_KEY_REUSED. BE cần ghi dấu replay cùng transaction với kết quả. Replay cùng key trả nguyên phản hồi đã ghi nhận, kiểm tra TRƯỚC revision.
- Giữ bản ghi idempotency ít nhất suốt vòng đời attempt/session; không gỡ key khi attempt vừa complete. FE cần giữ key/body của mutation chưa rõ kết quả qua reload, và gắn với viewer+attempt. Không dùng cache chung giữa user.
- revision là optimistic version. Sai revision hoặc frontier đã đổi trả409 STATE_CHANGED; FE tải lại trạng thái, không ghi đè bằng snapshot cũ.
- Wrong: lưu firstTry=false của quiz ngay từ lần sai đầu; tăng revision, giữ quiz; feedback=null, không có đáp án/giải thích. Không giới hạn chọn lại, không hiển thị bộ đếm sai.
- Correct: lưu kết quả, tiến frontier sang quiz chưa xong kế tiếp (hoặc complete cuối item) trước khi trả response. Trả feedback cho quiz vừa đúng để UI giữ màn giải thích tới khi người học bấm Tiếp tục.
- Thoát ở màn giải thích: quay lại là câu kế/Result, không quay lại quiz đã đúng. Sai rồi reload vẫn không tính là đúng ngay lần đầu.
- FE không gửi isCorrect, score, firstTryCorrect hoặc completed=true. Server chấm trên version/quiz của attempt.
- Chấm quiz cuối và hoàn thành item phải cùng transaction: result, item/topic progress, retry replacement, session progress và next frontier không được lưu nửa chừng.
- Không dùng advance hoặc legacy position để tự đánh dấu quiz/item hoàn thành.

## Tiến độ, chỉ số và tổng kết

Header học item hiển thị AttemptProgressDto, không gọi nhầm “Tiến độ chủ đề”.
Tổng đơn vị =1 Context + số từ + số purposes sau flatten + số formal quiz. Mỗi Tiếp tục nội dung hoặc quiz đúng hoàn thành1 đơn vị. percent=round(100*completedStepCount/totalStepCount).
Topic percent = số item hoàn thành / số item đang hiển thị. Starting CONTEXT/0 không làm tăng completedItemCount.
Từ đã học = số từ đã đi qua bằng Tiếp tục; mẫu câu đã học = số examples thuộc purposes đã đi qua; quiz hoàn thành = số quiz đã đúng. Không dùng nhãn “nắm vững”.
Sidebar topic metrics dùng effective version cho mỗi item hiển thị: LEARN đang chạy; nếu không có thì completed result hiện hành; nếu chưa học thì latest published. Unfinished RETRY không thay số chính thức. Tổng sidebar có thể khác overview latest khi có MAJOR; FE phải giữ nhãn ngữ cảnh “Theo lượt học hiện tại”, không chia số cũ cho mẫu số version mới.
Hoàn thành item khi mọi quiz đúng, không có ngưỡng accuracy. Accuracy làm tròn số nguyên từ firstTryCorrectCount/totalQuizCount.
Tổng kết topic tính gộp counts trên item hiển thị rồi làm tròn, không trung bình các phần trăm.
Result trả phân số+%, mục tiếp theo/quay về topic, danh sách kết quả item và quyền retry. Không XP/huy hiệu/chứng nhận.
Review dùng completedAttemptId hiện hành, trả content+quizzes đúng version đã hoàn thành, với correct option, giải thích, audio và first-try flag. MINOR áp dụng tại chỗ. Không đổi vị trí/kết quả; recency chỉ cập nhật bằng access event.
Kết quả cũ bị retry mới thay thế: review ID cũ trả409 RESULT_CHANGED để FE lấy completedAttemptId hiện hành.

## Làm lại và nội dung mới

- Single retry: body mode RETRY, retrySessionId:null. Nếu có session dở cần xác nhận thay thế bằng replaceRetrySessionId chính xác; không dùng cờ replace=true không gắn phiên.
- Continue TOPIC retry: gửi retrySessionId đang chạy và item kế đúng thứ tự; BE dùng manifest/version đã chốt. Không tạo ITEM session mới.
- Restart retry: người học xác nhận; gửi replaceRetrySessionId của session đang thấy, retrySessionId:null. BE atomically kết thúc phiên cũ và tạo phiên mới. Nếu session đã đổi trả409 RETRY_SESSION_CHANGED.
- Retry toàn topic chỉ khi topic đã hoàn thành. Chốt item IDs/version cùng lúc xác nhận, bắt đầu CONTEXT/0 của item đầu. itemIds và completedItemIds thuộc session, không đọc từ trạng thái hoàn thành cũ.
- Item retry dở vẫn COMPLETED với kết quả cũ. Chỉ khi hoàn thành retry item mới thay kết quả hiện hành ngay, không giữ kết quả tốt nhất. Các item còn lại giữ kết quả cũ.
- currentAttemptId có thể null giữa hai item; item tiếp theo được bắt đầu bằng thao tác rõ ràng, không tự tạo bởi GET.
- MAJOR mới không đổi lượt đang chạy; badge chỉ hết khi hoàn thành version mới nhất. Nếu có MAJOR mới hơn lượt vừa xong thì vẫn giữ badge.
- Thêm item mới vào topic đã hoàn thành làm topic quay IN_PROGRESS và có nội dung mới, không xóa kết quả cũ. Topic không quay về Khám phá.
- Hidden item không tính vào danh sách/counts/topic progress; owned running attempt vẫn có thể kết thúc. Frozen retry sequence phải giữ quy tắc version/tập item đã chốt theo BR-09.7; không ghép thêm nội dung publish giữa lượt.

## Error codes và envelope

Success luôn {data,timestamp}; lỗi ProblemDetail không bọc data.
Các code cần hỗ trợ: INVALID_REQUEST (400), SIGN_IN_REQUIRED (401), CONTENT_UNAVAILABLE (404);
STATE_CHANGED, IDEMPOTENCY_KEY_REUSED, RETRY_CONFIRMATION_REQUIRED, RETRY_SESSION_CHANGED, RESULT_CHANGED, TOPIC_NOT_COMPLETED, ATTEMPT_NOT_COMPLETED, INVALID_STAGE (409);
LEVEL_TOO_LOW, PREDECESSOR_INCOMPLETE, OTHER_ITEM_IN_PROGRESS, ALREADY_COMPLETED, NOT_COMPLETED (422).
Lỗi hạ tầng/503 có thể thử lại; không dùng503 khi một endpoint chưa được triển khai. Route chưa có phải hiện lỗi thật, không FE fallback sang mock.
Chi tiết tiếng Anh phục vụ chẩn đoán, UI ánh xạ code sang thông báo Việt. Không suy code từ chuỗi detail.
GET old progress đang dùng422 khi không có learner cần đổi theo401 và thêm code để FE phân biệt.

## Thứ tự BE và tiêu chí bàn giao

1. Viewer provider + discover/mine/detail/progress: cho chặng2 FE.
2. LEARN attempt start/read/content/advance/access và version/recency/ownership: cho chặng3.
3. Quiz read/answer, idempotency/revision/atomic completion + result: cho chặng4.
4. Review + ITEM/TOPIC retry/session + version mới/hidden/unpublished: cho chặng5.
Không cần seed user collection. Dữ liệu topic/attempt/progress có thể seed cho provider cố định.
Chạy acceptance trong [verification.md](verification.md), bổ sung kiểm thử BE về transaction/concurrency/ownership. FE mock tests không thay các kiểm thử này.
