import { useMicroSkillLabels } from "@features/learning-path/hooks/useMicroSkillLabels";
import { isQuestionReviewCheck, QUESTION_REVIEW_LABELS } from "@features/learning-path/types/question-management.types";
import type { QuestionCoverageWarning, QuestionReadiness } from "@features/learning-path/types/question-management.types";

export const questionFieldClass = "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus-visible:outline-2 focus-visible:outline-primary";
export function QuestionReviewPanel({ result, revision, confirmed, setConfirmed, disabled }: {
  result: QuestionReadiness; revision: number | null; confirmed: Set<string>; setConfirmed: (checks: Set<string>) => void; disabled: boolean;
}) {
  const changed = revision !== result.revision;
  return <div className="space-y-4">
    <p role="status" className={`rounded-xl p-4 font-semibold ${result.structurallyValid ? "bg-learning-mint text-primary" : "bg-error-container text-on-error-container"}`}>
      {result.structurallyValid ? "Đạt kiểm tra tự động" : "Chưa đạt điều kiện xuất bản"}
    </p>
    <p className="text-label-sm text-on-surface-variant">Phiên bản câu hỏi: {result.revision ?? "Chưa xác định"}{result.passageRevision != null ? ` · Phiên bản passage: ${result.passageRevision}` : ""}</p>
    {changed && <p role="alert" className="rounded-xl bg-learning-note p-4 text-learning-note-ink">Câu hỏi đã thay đổi. Hãy đóng, tải lại danh sách và xem lại nội dung.</p>}
    {([{ title: "Lỗi cần xử lý", items: result.blockers, style: "bg-error-container text-on-error-container" },
      { title: "Cảnh báo", items: result.warnings, style: "bg-learning-note text-learning-note-ink" }]).map(group => group.items.length > 0 &&
      <section key={group.title} className={`space-y-2 rounded-xl p-4 ${group.style}`}>
        <h3 className="font-semibold">{group.title}</h3><ul className="list-disc space-y-2 pl-5">
          {group.items.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.code === "LEARNER_AUDIO_DELIVERY_UNSUPPORTED"
            ? "Luồng luyện tập của người học chưa hỗ trợ audio Media này. Cần hoàn thiện trước khi xuất bản." : issue.message}</li>)}
        </ul>
      </section>)}
    <fieldset disabled={disabled || changed || !result.structurallyValid || result.status !== "DRAFT"} className="space-y-2 rounded-xl bg-surface-container-low p-4">
      <legend className="sr-only">Xác nhận chuyên môn</legend><h3 className="font-semibold">Xác nhận chuyên môn</h3>
      {result.requiredReviewChecks.map(check => <label key={check} className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
        <input type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" checked={confirmed.has(check)} disabled={!isQuestionReviewCheck(check)}
          onChange={event => { const next = new Set(confirmed); if (event.target.checked) next.add(check); else next.delete(check); setConfirmed(next); }} />
        <span>{isQuestionReviewCheck(check) ? QUESTION_REVIEW_LABELS[check] : "Tiêu chí chưa được giao diện hỗ trợ. Cần cập nhật giao diện trước khi xuất bản."}</span>
      </label>)}
    </fieldset>
    <p className="text-body-md text-on-surface-variant">Chỉ xác nhận sau khi đã xem đầy đủ nội dung và nghe audio nếu có. Kiểm tra tự động không thay thế việc duyệt chuyên môn.</p>
  </div>;
}
export function QuestionCoverageWarnings({ warnings }: { warnings: QuestionCoverageWarning[] }) {
  const { label: microSkillLabel } = useMicroSkillLabels();
  if (!warnings.length) return null;
  return <section aria-label="Cảnh báo số lượng câu hỏi" className="space-y-3 rounded-xl bg-learning-note p-4 text-learning-note-ink">
    <h3 className="font-semibold">Độ phủ câu hỏi</h3>
    {warnings.map((warning, index) => <div key={index} className="space-y-1">
      <p className="font-semibold">{microSkillLabel(warning.coverage.microSkill)} · {warning.coverage.level ?? "Chưa xác định trình độ"}</p>
      <p>{warning.coverage.activeQuestionCountAfter === null ? "Chưa xác định được số câu còn lại do dữ liệu phân loại không hợp lệ."
        : `Sau thao tác còn ${warning.coverage.activeQuestionCountAfter} câu đang sử dụng; cần tối thiểu ${warning.coverage.minimumRequired} câu để đủ điều kiện về số lượng cho lộ trình mới.`}</p>
    </div>)}
    <p>Lộ trình đã tạo, đáp án và tiến độ của người học được giữ nguyên.</p>
  </section>;
}
