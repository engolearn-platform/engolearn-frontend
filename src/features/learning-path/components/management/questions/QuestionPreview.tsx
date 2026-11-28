import { useMicroSkillLabels } from "@features/learning-path/hooks/useMicroSkillLabels";
import { microSkillLabel } from "@features/learning-path/utils/microSkillCatalog";
import { PassagePreview } from "@features/learning-path/components/management/passages/PassageWorkspaceDialog";
import { PassageStatusBadge } from "@features/learning-path/components/management/passages/PassageManagementTable";
import { QUESTION_REVIEW_LABELS, isQuestionReviewCheck } from "@features/learning-path/types/question-management.types";
import type { QuestionDetail } from "@features/learning-path/types/question-management.types";

export default function QuestionPreview({ detail, onReload }: { detail: QuestionDetail; onReload: () => void }) {
  const { catalog } = useMicroSkillLabels();
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3 text-label-sm"><span>{detail.skill ?? "Chưa phân loại"}</span><span>{detail.level ?? "—"}</span>
      {detail.status && <PassageStatusBadge status={detail.status} />}<span>Phiên bản {detail.revision ?? "chưa xác định"}</span></div>
    <p className="break-all text-label-sm text-on-surface-variant">{detail.questionId} · {microSkillLabel(detail.microSkill, catalog)}</p>
    {detail.passageId && <section className="space-y-3 rounded-xl border border-outline-variant p-4">
      <h3 className="font-semibold">Passage liên quan</h3>{detail.passage ? <PassagePreview key={detail.passage.audio?.url ?? detail.passage.updatedAt} detail={detail.passage} onReload={onReload} />
        : <p role="alert" className="text-error">Không tìm thấy passage {detail.passageId}. Cần chọn lại trước khi xuất bản.</p>}
    </section>}
    <section aria-label="Nội dung câu hỏi" className="space-y-4">
      <h3 className="whitespace-pre-wrap break-words text-body-lg font-semibold">{detail.prompt || "Chưa có nội dung câu hỏi."}</h3>
      <ol className="space-y-3">{detail.options?.map((option, index) => <li key={index} className="flex gap-3 rounded-xl border border-outline-variant p-4">
        <span className="font-semibold">{option?.optionId || "?"}.</span><span className="whitespace-pre-wrap break-words">{option?.text || "Chưa có nội dung lựa chọn."}</span>
      </li>)}</ol>
      {!detail.options?.length && <p className="text-on-surface-variant">Chưa có các lựa chọn.</p>}
    </section>
    <section aria-label="Đáp án và giải thích dành cho quản trị" className="space-y-3 rounded-xl bg-learning-note p-4 text-learning-note-ink">
      <h3 className="font-semibold">Đáp án và giải thích · Dành cho quản trị</h3>
      <p>Đáp án đúng: <strong>{detail.correctOptionId ?? "Chưa xác định"}</strong></p>
      <p className="whitespace-pre-wrap break-words">{detail.explanation || "Chưa có giải thích."}</p>
    </section>
    {detail.publicationReview && <details className="rounded-xl bg-surface-container-low p-4"><summary className="min-h-12 cursor-pointer font-semibold">Phiếu duyệt đã lưu</summary>
      <p className="break-all text-label-sm">Người duyệt: {detail.publicationReview.reviewedBy ?? "Chưa xác định"} · Phiên bản {detail.publicationReview.sourceRevision ?? "—"}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">{detail.publicationReview.confirmedChecks?.map(check => <li key={check}>{isQuestionReviewCheck(check) ? QUESTION_REVIEW_LABELS[check] : check}</li>)}</ul>
    </details>}
  </div>;
}
