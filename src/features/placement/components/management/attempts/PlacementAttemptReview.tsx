import { useState } from "react";
import type { ManagementAttempt } from "@features/placement/types/placement-management.types";
import { MANAGEMENT_SKILL_LABEL, MANAGEMENT_SKILLS } from "@features/placement/constants/placement-management";
import PlacementManagementQuestionContent from "@features/placement/components/management/PlacementManagementQuestionContent";
import { ManagementBadge, ManagementCard, ManagementEmpty, ManagementField, managementInputClass } from "@features/placement/components/management/PlacementManagementUi";
import { ANSWER_RESULT_LABEL, answerResult, countAnswers } from "./attemptReview";
import type { AnswerResult } from "./attemptReview";

export default function PlacementAttemptReview({ attempt }: { attempt: ManagementAttempt }) {
  const [resultFilter, setResultFilter] = useState<Exclude<AnswerResult, "blank"> | "">("");
  const [skillFilter, setSkillFilter] = useState("");
  const counts = countAnswers(attempt.snapshot, attempt.answers);
  const visible = attempt.snapshot.map((question, index) => ({ question, index, result: answerResult(question, attempt.answers) }))
    .filter(item => (!resultFilter || (resultFilter === "wrong" ? item.result !== "correct" : item.result === resultFilter)) && (!skillFilter || item.question.skill === skillFilter));
  const questionAnchor = (index: number) => `attempt-question-${index + 1}`;
  const jumpToQuestion = (index: number) => {
    setResultFilter("");
    setSkillFilter("");
    requestAnimationFrame(() => {
      const target = document.getElementById(questionAnchor(index));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      target?.focus({ preventScroll: true });
    });
  };

  return <div className="space-y-6">
    <ManagementCard>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><h2 className="text-title-lg font-semibold">Chi tiết {attempt.snapshot.length} câu</h2><p className="mt-1 text-body-md text-on-surface-variant">{counts.correct} đúng · {counts.wrong + counts.blank} sai</p></div><div className="grid gap-3 sm:grid-cols-2"><ManagementField label="Kết quả câu"><select className={managementInputClass} value={resultFilter} onChange={event => setResultFilter(event.target.value as Exclude<AnswerResult, "blank"> | "")}><option value="">Tất cả kết quả</option>{Object.entries(ANSWER_RESULT_LABEL).filter(([value]) => value !== "blank").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></ManagementField><ManagementField label="Kỹ năng"><select className={managementInputClass} value={skillFilter} onChange={event => setSkillFilter(event.target.value)}><option value="">Tất cả kỹ năng</option>{MANAGEMENT_SKILLS.map(skill => <option key={skill} value={skill}>{MANAGEMENT_SKILL_LABEL[skill]}</option>)}</select></ManagementField></div></div>
      <nav aria-label="Đi đến câu hỏi trong bản chụp" className="mt-5 flex flex-wrap gap-2">{attempt.snapshot.map((question, index) => {
        const result = answerResult(question, attempt.answers);
        return <button key={question.id} type="button" onClick={() => jumpToQuestion(index)} aria-label={`Đến câu ${index + 1}: ${ANSWER_RESULT_LABEL[result]}`} className={`flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-3 font-semibold focus-visible:outline-2 focus-visible:outline-primary ${result === "correct" ? "border-learning-mint-border bg-learning-mint text-primary" : "border-error/30 bg-error/10 text-error"}`}>{index + 1}</button>;
      })}</nav>
      <p className="mt-4 text-label-sm text-on-surface-variant">Nội dung thuộc bản chụp của lượt làm · {attempt.testSetCode} v{attempt.testSetVersion}. Chọn số câu sẽ đặt lại bộ lọc để hiển thị câu đó.</p>
      <p className="mt-2 text-label-sm text-on-surface-variant" aria-live="polite">Đang hiển thị {visible.length}/{attempt.snapshot.length} câu.</p>
    </ManagementCard>
    {visible.length ? visible.map(({ question, index, result }) => <article key={question.id} id={questionAnchor(index)} tabIndex={-1} className="scroll-mt-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 focus-visible:outline-2 focus-visible:outline-primary"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h3 className="text-title-md font-semibold">Câu {String(index + 1).padStart(2, "0")}</h3><ManagementBadge tone={result === "correct" ? "success" : "error"}>{ANSWER_RESULT_LABEL[result]}</ManagementBadge></div><PlacementManagementQuestionContent question={question} selectedOptionId={attempt.answers[question.id] ?? null} /><p className="mt-4 text-label-sm text-on-surface-variant">{result === "blank" ? "Người làm không chọn đáp án cho câu này." : `Đáp án đã chọn: ${question.options.find(option => option.id === attempt.answers[question.id])?.label ?? "Không có trong bản chụp"}`}</p></article>) : <ManagementCard><ManagementEmpty title="Không có câu hỏi phù hợp" description="Thay đổi bộ lọc hoặc chọn số câu phía trên để xem lại nội dung." /></ManagementCard>}
  </div>;
}
