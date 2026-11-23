# Grammar User v4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task, sequentially in the current D checkouts.

**Goal:** Hoàn thiện luồng User Grammar theo UI v4 đã điều chỉnh, chạy bằng EngolearnApplication và npm run dev.

**Architecture:** Giữ module Grammar hiện có, layout nhóm và API learner. Bổ sung DTO phản hồi câu đã nộp; tóm tắt lấy nội dung xuất bản qua API. Không sửa persistence hoặc module khác.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind/shadcn hiện có; Java 21 Spring Boot/MongoDB hiện có.

**Spec:** `docs/features/grammar/01-user-v4-design.md` và use cases GRM-UC-001..004 trong repo business docs.

## Global Constraints

- Chỉ thay Grammar + tài liệu liên quan; giữ shell của nhóm, imports alias, useFetch/HTTP chung.
- Không lưu vị trí đọc, không thẻ Tiếp tục học, không luyện riêng câu sai; đúng 5 câu, đạt 3/5; BE chấm.
- Không dùng mock/fixture verification; integration qua proxy thật. Không push/merge main.
- Giữ thay đổi có sẵn, không reset/clean/stash toàn repo. Làm ở D trên nhánh hiện tại theo preference của chủ dự án.

## Review Focus

1. Reload result không mất nội dung câu hoặc lấy nhầm revision mới; Task 2/5 kiểm tra bằng session thật.
2. Lượt làm lại 2/5 sau lượt 3/5 không hạ COMPLETED/bestScore; Task 5 đọc API tiến độ.
3. Nội dung 4/5/7 khối, Topic 2/3 bài, Level trống/khóa không lệ thuộc số demo; Task 3/4.
4. Lỗi mạng gửi lại requestId, FIB Enter/nháy cong, session hết hạn; Task 5 kiểm tra contract và thao tác.
5. Summary không gọi seen/startPractice, không đọc DRAFT hay vượt Lesson khóa; Task 4 kiểm tra API/DB.

### Task 1: Baseline và kế hoạch
- [x] Đọc ZIP, tài liệu UI, model/DTO/service và use case; chốt hướng trong hội thoại.
- [x] Kiểm tra nhánh và fetch main chỉ để đối chiếu. FE baseline build đạt.
- [x] Sao lưu chính xác các file sắp thay và hash vào artifact; giữ baseline khác nguyên vẹn.

### Task 2: Feedback dùng lại sau reload
Files BE: grammar/dto/GrammarLearnerResponses.java, grammar/mapper/GrammarPracticeMapper.java. Files FE: grammar/types/grammar.types.ts.
- [x] Kiểm tra thật trước sửa: feedback thiếu prompt/type, không thể render review câu đầy đủ sau reload.
- [x] Thêm type/prompt vào FeedbackResponse từ question trong pinned revision; giữ các trường cũ và ràng buộc trả đáp án.
- [x] Compile và kiểm tra cùng session thật sau sửa: feedback có đúng prompt/type, không lộ câu chưa nộp.

### Task 3: Roadmap, Topic, Theory
Files: GrammarRoadmapView.tsx, CefrTabs.tsx, GrammarTopicView.tsx, GrammarTheoryView.tsx, GrammarTheoryBlock.tsx trong module hiện có.
- [x] Roadmap level cards/nhóm hoàn thành; mọi số lượng và khóa lấy API.
- [x] Topic rows/progress/sidebar mục tiêu; giữ hasUpdate/bestScore và Practice nhanh cho bài completed.
- [x] Theory accordion tự do, reveal ví dụ, formula preview; giữ seen và nút Practice đúng điều kiện.
- [x] Build/lint và rà trạng thái lỗi/rỗng/khóa, mobile.

### Task 4: Practice, Result, Summary
Files: GrammarPracticeView.tsx, GrammarPracticeQuestion.tsx, GrammarPracticeResultCard.tsx; thêm GrammarPracticeSteps.tsx, GrammarTopicSummaryView.tsx; sửa grammar/routes.ts, services/grammar-learning.service.ts và hooks/useGrammarLearning.ts.
- [x] Practice progress ký hiệu, MCQ/FIB inline, phản hồi + Dialog lời giải, giữ retry/requestId.
- [x] Result dùng feedback BE; câu sai mở, đúng thu gọn, đủ nút theo nghiệp vụ.
- [x] Thêm Summary đọc nội dung thật của Topic completed; không tạo collection/API học liệu mới, không ghi seen.
- [x] Thêm link Summary ở Topic completed; cập nhật docs route/state/API ngay trong cùng lượt.

### Task 5: Tích hợp và bàn giao
- [x] Build và lint FE; compile BE; chạy FE + BE tại đúng D project.
- [x] Kiểm tra thật dữ liệu xuất bản, session/feedback/result/reload/threshold/bestScore/summary và quyền.
- [x] Review diff cuối với reviewer độc lập nếu công cụ sẵn; sửa lỗi quan trọng, kiểm tra lại phần ảnh hưởng.
- [x] Ghi báo cáo file/thay đổi/kết quả/giới hạn. Không commit/push; giữ dữ liệu Nháp không liên quan nguyên vẹn.

## Progress / rulings

- Ruling: reuse D checkouts/branches — chủ dự án yêu cầu tích hợp đúng nơi đang chạy; không tạo worktree mới.
- Ruling: giữ shell nhóm ở tất cả màn — yêu cầu đồng bộ điều hướng ưu tiên focus-mode demo; không đụng layout của thành viên khác.
- Ruling: thêm prompt/type vào feedback đã nộp — cần review sau reload, không thêm collection hoặc thay model.
- Ruling: không test UI bằng fixture/mock — build/lint và integration thật; không thêm dependency test frontend.

Task 1–5: complete. Ruling: explicit publication approval received for sample A1 only; 31 other topics unchanged. Independent review clean; final build/Grammar lint/real HTTP checks passed. No source change outside Grammar. Report: docs/features/grammar/02-user-v4-result.md.
