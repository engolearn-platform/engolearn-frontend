import { vietnamTime } from "@features/assessment/utils/assessmentFormat";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useAssessmentQuery } from "@features/assessment/hooks/useAssessmentQuery";
import { assessmentApi } from "@features/assessment/services/assessmentApi";
import { AssessmentAudio } from "@features/assessment/components/AssessmentAudio";
import { AssessmentCard, AssessmentError, DevelopmentNotice } from "@features/assessment/components/AssessmentCommon";
import type { ReviewQuestion } from "@features/assessment/types/assessment.types";

function ReviewAudio({attemptId, index}: {attemptId: string; index: number}) {
  const load = useCallback(() => assessmentApi.reviewAudio(attemptId, index), [attemptId, index]);
  return <AssessmentAudio load={load} review />;
}
const outcome = (q: ReviewQuestion) => q.selected === null ? "BLANK" : q.selected === q.correct ? "CORRECT" : "WRONG";
export default function AssessmentReviewView() {
  const {attemptId = ""} = useParams();
  const query = useAssessmentQuery(useCallback((signal: AbortSignal) => assessmentApi.review(attemptId, signal), [attemptId]));
  const [section, setSection] = useState("ALL"), [status, setStatus] = useState("ALL"), [selected, setSelected] = useState(1);
  const data = query.data;
  if (query.loading && !data) return <p className="p-5" role="status">Đang tải bài đã làm…</p>;
  if (!data) return <div className="space-y-5 p-5"><AssessmentError message={query.error?.message ?? "Bài này không có nội dung xem lại."} retry={query.refetch} /><Button asChild variant="outline" className="h-12"><Link to="/assessment/history">Về lịch sử</Link></Button></div>;
  const filtered = data.questions.filter(q => (section === "ALL" || section === q.section) && (status === "ALL" || status === outcome(q)));
  const question = filtered.find(q => q.number === selected) ?? filtered[0];
  return <div className="mx-auto max-w-6xl space-y-5 p-5 pb-24"><DevelopmentNotice show={data.result.developmentData} /><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[28px] leading-9 font-bold">Xem lại bài đánh giá</h1><p className="mt-2 text-sm text-muted-foreground">{data.result.series} v{data.result.paperVersion} · {vietnamTime(data.result.submittedAt)} · Chỉ đọc</p></div><div className="flex gap-3"><Button asChild variant="outline" className="h-12"><Link to={`/assessment/attempts/${attemptId}/result`}>Về kết quả</Link></Button><Button asChild className="h-12"><Link to="/assessment/history">Lịch sử</Link></Button></div></div>
    <AssessmentCard><p className="text-lg font-semibold">{data.result.score}/100 · Đúng {data.result.correct}/50 · Mức của bài này: {data.result.level}</p><p className="mt-2">Đọc {data.result.readingCorrect}/30 · Nghe {data.result.listeningCorrect}/20</p></AssessmentCard>
    <AssessmentCard><div className="flex flex-wrap gap-4"><label className="flex items-center gap-3">Phần <select className="min-h-12 rounded-xl border border-learning-outline px-3" value={section} onChange={e => setSection(e.target.value)}><option value="ALL">Tất cả</option><option value="READING">Đọc</option><option value="LISTENING">Nghe</option></select></label><label className="flex items-center gap-3">Kết quả <select className="min-h-12 rounded-xl border border-learning-outline px-3" value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">Tất cả</option><option value="CORRECT">Đúng</option><option value="WRONG">Sai</option><option value="BLANK">Chưa trả lời</option></select></label></div><div className="mt-4 flex flex-wrap gap-2" aria-label="Chọn câu để xem lại">{filtered.map(q => <Button key={q.number} className="h-12 min-w-12" variant={question?.number === q.number ? "default" : "outline"} aria-label={`Câu ${q.number}: ${outcome(q) === "CORRECT" ? "Đúng" : outcome(q) === "WRONG" ? "Sai" : "Chưa trả lời"}`} onClick={() => setSelected(q.number)}>{q.number}{outcome(q) === "CORRECT" ? " ✓" : outcome(q) === "BLANK" ? " –" : " ×"}</Button>)}</div></AssessmentCard>
    {question ? <AssessmentCard><div className="space-y-5">{question.passage && <p className="whitespace-pre-line rounded-xl bg-background p-4 leading-7">{question.passage}</p>}{question.audioAvailable && <ReviewAudio key={question.unitIndex} attemptId={attemptId} index={question.unitIndex} />}<h2 className="text-[22px] leading-7 font-semibold">Câu {question.number}: {question.prompt}</h2><p className="rounded-xl bg-background p-4 leading-7">{question.selected === null ? "Bạn chưa trả lời câu này." : `Bạn đã chọn: ${String.fromCharCode(65 + question.selected)} — ${question.selected === question.correct ? "Đúng" : "Sai"}.`} <strong className="text-primary">Đáp án đúng: {String.fromCharCode(65 + question.correct)}.</strong></p><ol className="space-y-3">{question.options.map((option, index) => <li key={index} className={`rounded-xl border p-4 ${index === question.correct ? "border-learning-mint-border bg-learning-mint" : index === question.selected ? "border-error bg-error/5 text-error" : "border-learning-outline"}`}><strong>{String.fromCharCode(65 + index)}.</strong> {option}{index === question.selected && <strong className="ml-3 text-sm">{index === question.correct ? "Bạn đã chọn — Đúng" : "Bạn đã chọn — Sai"}</strong>}{index === question.correct && <strong className="ml-3 text-sm text-primary">Đáp án đúng</strong>}</li>)}</ol><div><h3 className="font-semibold">Giải thích</h3><p className="mt-2 leading-7">{question.explanation}</p></div>{question.transcript && <details className="rounded-xl border border-learning-outline p-4"><summary className="cursor-pointer font-semibold">Xem lời thoại</summary><p className="mt-3 whitespace-pre-line leading-7">{question.transcript}</p></details>}</div></AssessmentCard> : <AssessmentCard>Không có câu phù hợp với bộ lọc.</AssessmentCard>}
  </div>;
}
