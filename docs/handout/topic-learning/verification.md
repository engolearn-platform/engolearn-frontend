# Topic Learning — kiểm chứng và nghiệm thu

Ngày 2026-10-27. Báo cáo tăng dần theo từng chặng; không đánh dấu tích hợp thật trước khi đã chạy.
Contract chuẩn: [api.openapi.yaml](api.openapi.yaml); cách BE thực hiện: [backend-handoff.md](backend-handoff.md).

## Trạng thái chặng1

- Contract/client: PASS chặng 1, sẵn sàng review; 17 operations, 51 schemas. Chặng 2 đã được user duyệt và triển khai.
- Các màn hiện có chưa được chuyển sang API mới trong chặng1.
- Chặng2 đã có FE catalog/detail; xem báo cáo chặng2 phía dưới. Chặng3–5 chưa triển khai.
- BE target contract: chưa triển khai/xác minh; không sửa source BE.
- Auth/ownership nhiều user thật: chưa kiểm chứng; BE hiện fixed learner C2.
- User/level trong FE: chỉ mock fetch ở test, không bật user giả trong ứng dụng thật.

## Lệnh và bằng chứng

| Kiểm tra | Baseline | Sau thay đổi |
| --- | --- | --- |
| npm run build | PASS; cảnh báo chunk >500kB có sẵn | PASS; cảnh báo chunk cũ còn nguyên |
| npm run lint | PASS, 0 errors / 74 warnings có sẵn | PASS, 0 errors / 74 warnings; 0 warnings mới |
| npm run topic:types:check | Chưa có script | PASS; refs, metadata, 51 generated DTOs khớp contract |
| npm run test:topic-api | Chưa có script | PASS, 33 tests (gồm 17 operation subtests), 0 fail/skip |
| git diff --check | PASS trước chặng1 | PASS |

Native Node tests dùng Node22.18+ với TypeScript erasable; không thêm test dependency, CI, coverage hoặc kiểm thử component/browser.
Mock fetch kiểm tra transport, AbortSignal, ProblemDetail, envelope, idempotency, request routing và phản hồi viewer. Đây không phải bằng chứng BE đã chạy các nghiệp vụ.
Kiểm tra contract cục bộ: parse OpenAPI, refs/operation metadata, types không drift; chưa dùng validator OpenAPI bên ngoài.

## Acceptance cho các chặng sau

| Mã | Kịch bản | Kỳ vọng | Trạng thái |
| --- | --- | --- | --- |
| T01 | Guest mở discover/detail/mine | Browse published; không personal progress; mine mời đăng nhập | PASS fixture UI; không gọi mine/progress |
| T02 | Learner A1–C2 với topic thấp/bằng/cao level | Quyền start/retry đúng; vượt level vẫn xem tóm tắt | API tests A1–C2; UI fixture A1/C2 start; retry/BE chưa xác minh |
| T03 | Bấm Bắt đầu rồi thoát Context | IN_PROGRESS tại CONTEXT/0; chuyển discover->mine; completed=0 | PASS fixture đến attempt gateway; chờ content UI+BE |
| T04 | Start lỗi mạng/điều kiện | Không tạo trạng thái giả; cho thử lại cùng key | PASS native mutation-key tests; chưa test lỗi start qua browser/BE |
| T05 | Scope/filter/sort/cursor | Lọc trước phân trang; reset cursor đúng; không lẫn mine/discover | PASS native+fixture search/filter/back/pagination; BE chưa xác minh |
| T06 | Nav dropdown và quay về frontier | Xem bước cũ không kéo vị trí lùi; nhánh tương lai khóa | Chưa chạy UI |
| T07 | Audio/quick check optional | Không tự phát, không chặn Tiếp tục; thiếu media không dựng mock | Chưa chạy UI |
| T08 | Resume sau reload | Đúng item/attempt/version/stage/index; không reset | Chờ BE+UI |
| T09 | Sai quiz rồi reload | Giữ first-try failure, không lộ đáp án | Chờ BE+UI |
| T10 | Đúng quiz rồi thoát trước Continue | Quay lại câu kế/result; không trả lời lại câu đã đúng | Chờ BE+UI |
| T11 | Retry cùng mutation sau mất phản hồi | Chỉ ghi một lần; cùng key khác body bị409 | Chờ BE |
| T12 | Hai tab cùng revision | Một cập nhật thắng, tab kia reconcile409; không mất tiến độ | Chờ BE+UI |
| T13 | Quiz cuối | Hoàn thành/result/progress commit cùng lúc; accuracy chỉ ở cuối | Chờ BE+UI |
| T14 | Review | Đúng completed version; không ghi position/result; recency riêng | Chờ BE+UI |
| T15 | Retry bỏ dở/tiếp tục/restart | Kết quả cũ giữ đến khi item hoàn thành lượt mới; confirm session đúng | Chờ BE+UI |
| T16 | Retry topic | Manifest/version cố định; replace kết quả theo item | Chờ BE+UI |
| T17 | MAJOR/MINOR/thêm/ẩn/unpublish | Badge/nhóm/progress đúng; running attempt không mất đường tiếp tục | Chờ BE+UI |
| T18 | Đổi user trong FE test | Hủy request cũ, clear state; dữ liệu không xuyên viewer | Chưa có UI/provider mới |
| T19 | API lỗi/rỗng/malformed/cancel | Phân biệt state; không biến lỗi thành guest/0%/mock | PASS native transport/shape; fixture viewer/progress/more503, detail404, empty |
| T20 | Màn nhỏ, bàn phím, focus | Nav/quiz thao tác được; không vỡ bố cục | PASS fixture catalog/detail390px không overflow; chưa kiểm tra toàn bộ bàn phím/quiz |

Trước mỗi commit: cập nhật feature doc tương ứng + bảng mock/API. Chỉ flip sang “thật” khi view đã dùng endpoint thật và có bằng chứng; client đã có chưa đồng nghĩa view đã nối.

## Git và giới hạn bàn giao chặng 1

FE: branch feat/explore-topics, commit chặng 1 chứa contract/client/tests/docs; chưa push/merge.
Nghiệp vụ: branch docs/topic-learning-rules, commit d01663b (9 file), working tree sạch sau commit.
BE: không sửa; branch và các file untracked có sẵn được giữ nguyên.
Chưa chạy browser vì không thay UI trong chặng này. Chưa chạy integration target BE, server transaction/ownership hoặc full OpenAPI external validator.

## Chặng2 — catalog và chi tiết (2026-10-27)

Status: FE implemented, chuẩn bị review. Contract api.openapi.yaml giữ nguyên so với commit bb4b489.
Scope: discover, mine, detail; viewer; metadata lỗi; filters/cursor; start/continue/review/retry entry và confirmation. Chặng3–5 chưa triển khai khung học/quiz/result/review đầy đủ.
Điểm vào attempt chặng2 lấy trạng thái thật và ghi access; không đưa người học vào content mock cũ.

### Kiểm chứng thực tế

- npm run test:topic: PASS45 (33 API +12 catalog/mutation/filter tests), không fail/skip.
- npm run build: PASS; cảnh báo bundle >500kB đã có từ baseline.
- npm run lint: PASS, 0 errors /70 warnings (baseline74; không thêm warning).
- git diff so với HEAD: api.openapi.yaml không đổi.
- Native state tests không phải React/browser automation; browser dưới đây dùng CUA tương tác với fixture.
- Browser desktop1280x900: discover15items/tải12, C2 filter1 result, topic vượt level mở được và cả5 nút start disabled.
- Search “quán”, filter A1, vào detail/back giữ URL và input. Bài1 enabled, bài2 disabled.
- Bấm Start ở fixture: API trả CONTEXT/0, gateway có0%; quay về discover không còn topic đó; mine có topic mới với0/5 và số tab tăng lên2.
- Mine: đổi tab completed hiển thị badge nội dung mới và5/5,100%; không hiện badge chưa phù hợp level trên thẻ mine.
- Guest: không có current-level chip hoặc progress bars. Mine hiện lời mời đăng nhập; trace xác nhận0 request mine/progress.
- Load-more503: giữ12 thẻ và total15; thử lại thành công append thành15, nút tải thêm biến mất.
- Progress503: outline còn nguyên, không progressbar/0% giả; có nút thử lại.
- Viewer503: báo lỗi, không fallback guest. Detail404 có trạng thái không tìm thấy và đường quay lại discover.
- Mobile390x844: catalog/detail không overflow ngang body; sidebar đổi sang bottom-nav.
- Sửa contrast nút sidebar sau khi kiểm tra computed style; chữ RGB255,255,255.
- Ảnh fixture lưu trong visualizations của chat: discover-stage2.png, my-topics-stage2.png, topic-detail-stage2.png.

### BE thật và cách review

GET localhost:8080/api/v1/topic-learning/viewer và /topics?limit=1 không kết nối được; cause ECONNREFUSED. Không gọi mutation lên BE thật.
Vì vậy chưa có bằng chứng tích hợp thật, auth/ownership/server idempotency/transactions. Không sửa source BE hoặc contract để làm test qua.
Chạy npm run dev:topic-fixtures để preview riêng ở http://127.0.0.1:4318/topics; API fixture4317. Đây là dữ liệu thử tách biệt, không user collection và không runtime fallback.
npm run dev mặc định vẫn dùng proxy BE hiện tại. Stop preview bằng Ctrl+C.
