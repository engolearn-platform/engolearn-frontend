import { vietnamTime } from "@features/assessment/utils/assessmentFormat";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useAssessmentQuery } from "@features/assessment/hooks/useAssessmentQuery";
import { assessmentApi } from "@features/assessment/services/assessmentApi";
import { AssessmentAudio } from "@features/assessment/components/AssessmentAudio";
import { AssessmentResultSummary } from "@features/assessment/components/AssessmentResultSummary";
import { AssessmentCard, AssessmentError, DevelopmentNotice } from "@features/assessment/components/AssessmentCommon";
import type { ReviewQuestion } from "@features/assessment/types/assessment.types";

function ReviewAudio({attemptId, index}: {attemptId: string; index: number}) {
  const load = useCallback(() => assessmentApi.reviewAudio(attemptId, index), [attemptId, index]);
  const [open, setOpen] = useState(false);
  return open ? <AssessmentAudio load={load} review /> : <Button variant="outline" className="h-12" onClick={() => setOpen(true)}>Nghe lại audio</Button>;
}
const outcome = (q: ReviewQuestion) => q.selected === null ? "BLANK" : q.selected === q.correct ? "CORRECT" : "WRONG";
const outcomeLabel = {BLANK: "Chưa chọn", CORRECT: "Đúng", WRONG: "Sai"};

export default function AssessmentReviewView() {
  const {attemptId = ""} = useParams();
  const query = useAssessmentQuery(useCallback((signal: AbortSignal) => assessmentApi.review(attemptId, signal), [attemptId]));
  const [section, setSection] = useState("ALL"), [status, setStatus] = useState("ALL");
  const [collapsed, setCollapsed] = useState(false);
  const data = query.data;
  if (query.loading && !data) return <p className="p-5" role="status">Đang tải bài đã làm…</p>;
  if (!data) return <div className="space-y-5 p-5"><AssessmentError message={query.error?.message ?? "Bài này không có nội dung xem lại."} retry={query.refetch} /><Button asChild variant="outline" className="h-12"><Link to="/assessment/history">Lịch sử đánh giá</Link></Button></div>;
  const filtered = data.questions.filter(q => (section === "ALL" || section === q.section) && (status === "ALL" || status === outcome(q)));
  const visible = new Set(filtered.map(q => q.number));
  return <div className="mx-auto max-w-7xl space-y-5 p-5 pb-24">
    <DevelopmentNotice show={data.result.developmentData} />
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[28px] leading-9 font-bold">Chi tiết bài đánh giá</h1><p className="mt-2 text-sm text-muted-foreground">{vietnamTime(data.result.submittedAt)} · Chỉ đọc</p></div><div className="flex flex-wrap gap-3"><Button asChild variant="outline" className="h-12"><Link to={`/assessment/attempts/${attemptId}/result`}>Về kết quả</Link></Button><Button asChild className="h-12"><Link to="/assessment/history">Lịch sử đánh giá</Link></Button></div></div>
    <AssessmentResultSummary data={data.result} detail />
    <div className="flex flex-wrap items-center gap-3" aria-label="Bộ lọc câu hỏi">
      {[["READING", "Đọc"], ["LISTENING", "Nghe"]].map(([value, label]) => <Button key={value} className="h-12" variant={section === value ? "default" : "outline"} aria-pressed={section === value} onClick={() => setSection(previous => previous === value ? "ALL" : value)}>{label}</Button>)}
      {[["CORRECT", "Đúng"], ["WRONG", "Sai"], ["BLANK", "Chưa chọn"]].map(([value, label]) => <Button key={value} className="h-12" variant={status === value ? "default" : "outline"} aria-pressed={status === value} onClick={() => setStatus(previous => previous === value ? "ALL" : value)}>{label}</Button>)}
      <span role="status" className="text-sm text-muted-foreground">{filtered.length}/50 câu</span>
      {(section !== "ALL" || status !== "ALL") && <Button className="h-12" variant="ghost" onClick={() => {setSection("ALL");setStatus("ALL");}}>Bỏ lọc</Button>}
      {collapsed && <Button variant="outline" className="h-12 ml-auto" onClick={() => setCollapsed(false)}>Mở bảng câu hỏi</Button>}
    </div>
    <div className={`grid items-start gap-5 ${collapsed ? "" : "lg:grid-cols-[minmax(0,1fr)_19rem]"}`}>
      <div className="min-w-0 space-y-5">
        {!filtered.length && <AssessmentCard>Không có câu phù hợp với bộ lọc.</AssessmentCard>}
        {filtered.map((question, position) => <section key={question.number} id={`review-question-${question.number}`} tabIndex={-1} aria-label={`Câu ${question.number}`} className="scroll-mt-5 outline-none focus-visible:ring-2 focus-visible:ring-primary"><AssessmentCard><div className="space-y-5">
          {filtered[position - 1]?.unitIndex !== question.unitIndex && <>
            {question.passage && <p className="whitespace-pre-line rounded-xl bg-background p-4 leading-7">{question.passage}</p>}
            {question.audioAvailable && <ReviewAudio attemptId={attemptId} index={question.unitIndex} />}
          </>}
          <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-lg font-semibold">Câu {question.number}: {question.prompt}</h2><span className={`rounded-lg px-3 py-2 text-sm ${outcome(question) === "WRONG" ? "bg-error/5 text-error" : "bg-learning-mint text-primary"}`}>{outcomeLabel[outcome(question)]}</span></div>
          <p className="rounded-xl bg-background p-4 leading-7">{question.selected === null ? "Bạn chưa chọn đáp án." : `Bạn đã chọn: ${String.fromCharCode(65 + question.selected)} — ${question.selected === question.correct ? "Đúng" : "Sai"}.`} <strong className="text-primary">Đáp án đúng: {String.fromCharCode(65 + question.correct)}.</strong></p>
          <ol className="space-y-3">{question.options.map((option, index) => <li key={index} className={`rounded-xl border p-4 ${index === question.correct ? "border-learning-mint-border bg-learning-mint" : index === question.selected ? "border-error bg-error/5 text-error" : "border-learning-outline"}`}><strong>{String.fromCharCode(65 + index)}.</strong> {option}{index === question.selected && <strong className="ml-3 text-sm">{index === question.correct ? "Bạn đã chọn — Đúng" : "Bạn đã chọn — Sai"}</strong>}{index === question.correct && <strong className="ml-3 text-sm text-primary">Đáp án đúng</strong>}</li>)}</ol>
          <div><h3 className="font-semibold">Giải thích</h3><p className="mt-2 leading-7">{question.explanation}</p></div>
          {question.transcript && <details className="rounded-xl border border-learning-outline p-4"><summary className="cursor-pointer font-semibold">Xem lời thoại</summary><p className="mt-3 whitespace-pre-line leading-7">{question.transcript}</p></details>}
        </div></AssessmentCard></section>)}
      </div>
      {!collapsed && <aside className="order-first lg:order-last lg:sticky lg:top-5"><AssessmentCard><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Bảng câu hỏi</h2><Button variant="ghost" className="h-12" onClick={() => setCollapsed(true)}>Thu gọn</Button></div><nav aria-label="Đến câu hỏi" className="mt-4 grid grid-cols-5 gap-2">{data.questions.map(q => <Button key={q.number} variant="outline" disabled={!visible.has(q.number)} className={`h-12 p-0 ${outcome(q) === "CORRECT" ? "border-learning-mint-border bg-learning-mint text-primary" : outcome(q) === "WRONG" ? "border-error/30 text-error" : ""}`} aria-label={`Câu ${q.number}: ${outcomeLabel[outcome(q)]}`} onClick={() => {const target = document.getElementById(`review-question-${q.number}`);target?.focus({preventScroll: true});target?.scrollIntoView({behavior: "smooth", block: "start"});}}>{q.number}{outcome(q) === "CORRECT" ? " ✓" : outcome(q) === "WRONG" ? " ×" : " –"}</Button>)}</nav><p className="mt-4 text-sm text-muted-foreground">✓ Đúng · × Sai · – Chưa chọn</p></AssessmentCard></aside>}
    </div>
  </div>;
}
