import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { AssessmentCard, AssessmentError, Confirmation } from "@features/assessment/components/AssessmentCommon";
import { AssessmentAudio } from "@features/assessment/components/AssessmentAudio";
import { useLiveAssessment } from "@features/assessment/hooks/useLiveAssessment";
import { assessmentApi } from "@features/assessment/services/assessmentApi";
import type { AssessmentState, Question } from "@features/assessment/types/assessment.types";

const labels = {ANSWERED: "Đã trả lời", BLANK: "Đã bỏ trống", CURRENT: "Đang làm", FUTURE: "Chưa đến"};
const cellClasses = {ANSWERED: "border-learning-mint-border bg-learning-mint text-primary", BLANK: "border-learning-outline bg-white text-muted-foreground", CURRENT: "border-primary bg-primary text-white", FUTURE: "border-transparent bg-background text-muted-foreground"};
function Clock({state}: {state: AssessmentState}) {
  const anchor = useRef({at: performance.now(), remaining: Date.parse(state.deadline ?? "") - Date.parse(state.serverNow)});
  const [remaining, setRemaining] = useState(anchor.current.remaining);
  useEffect(() => {
    anchor.current = {at: performance.now(), remaining: Date.parse(state.deadline ?? "") - Date.parse(state.serverNow)};
    const tick = () => setRemaining(Math.max(0, anchor.current.remaining - (performance.now() - anchor.current.at)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state.deadline, state.serverNow]);
  const seconds = Math.max(0, Math.ceil(remaining / 1000));
  return <span role="timer" className="rounded-xl border border-learning-outline bg-white px-4 py-3 font-semibold tabular-nums">{state.phase === "READING_PREVIEW" ? "Thời gian đọc" : state.phase === "LISTENING_LEAD" ? "Thời gian nghe" : state.unitIndex < 10 || state.unitIndex >= 14 && state.unitIndex < 24 ? "Thời gian câu này" : "Thời gian trả lời"}: {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span>;
}
function AnswerPanel({question, disabled, saving, onChoice, onNext}: {question: Question; disabled: boolean; saving: string; onChoice: (value: number) => void; onNext: (choice: number | null) => void}) {
  const [choice, setChoice] = useState<number | null>(question.selected);
  return <AssessmentCard><fieldset disabled={disabled}><legend className="text-lg font-semibold">Câu {question.number}: {question.prompt}</legend><div className="mt-5 space-y-3">{question.options.map((option, index) => <label key={index} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-4 ${choice === index ? "border-primary bg-learning-mint" : "border-learning-outline"}`}><input name={`question-${question.number}`} type="radio" value={index} checked={choice === index} onChange={() => {setChoice(index);onChoice(index);}} /><span><strong className="mr-3">{String.fromCharCode(65 + index)}</strong>{option}</span></label>)}</div></fieldset><div className="mt-5 flex items-center justify-between gap-3"><p role="status" className="text-sm">{saving}</p><Button className="h-12 rounded-xl" disabled={disabled} onClick={() => onNext(choice)}>{question.number === 50 ? "Hoàn thành bài" : "Tiếp →"}</Button></div></AssessmentCard>;
}
function OfficialAudio({state, binding}: {state: AssessmentState; binding: string}) {
  const issue = useRef(crypto.randomUUID());
  const load = useCallback(() => assessmentApi.audio(state.id, binding, state.unitIndex, issue.current), [state.id, binding, state.unitIndex]);
  const onFailure = useCallback((reason: "LOAD_FAILED" | "PLAYBACK_FAILED" | "AUTOPLAY_BLOCKED") => {
    void assessmentApi.audioFailure(state.id, binding, state.unitIndex, reason).catch(() => undefined);
  }, [state.id, binding, state.unitIndex]);
  return <AssessmentAudio load={load} onFailure={onFailure} />;
}
export default function AssessmentTakingView() {
  const live = useLiveAssessment();
  const [confirm, setConfirm] = useState<"submit" | "abandon" | "complete" | null>(null);
  const [finalChoice, setFinalChoice] = useState<number | null>(null);
  const state = live.state;
  if (!state || !live.session) return <div className="p-5"><AssessmentCard><h1 className="text-2xl font-bold">Không có bài đang làm trên trang này</h1><p className="my-4">Bài chỉ được làm tại trang đã bắt đầu, không khôi phục sau khi tải lại.</p><Button asChild className="h-12"><Link to="/assessment">Về chuẩn bị</Link></Button></AssessmentCard></div>;
  if (state.status !== "ACTIVE") return <p className="p-5" role="status">Đang mở kết quả…</p>;
  const completedCount = state.savedCount + (state.current?.selected === null && finalChoice !== null ? 1 : 0);
  const submitDescription = confirm === "complete"
    ? `Sẽ lưu đáp án câu 50 và nộp bài ngay. Đã trả lời ${completedCount}/50 câu; còn ${50 - completedCount} câu trống. Câu trống tính sai.`
    : `Đã lưu ${state.savedCount}/50 câu; còn ${50 - state.savedCount} câu trống. Câu trống tính sai. ${state.savedCount === 0 ? "Không có đáp án thì không có điểm hoặc mức học." : ""}`;
  return <div className="min-h-screen bg-background text-on-surface">
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-learning-outline bg-white p-5"><div className="flex flex-wrap items-center gap-3"><strong className="text-primary">EngoLearn</strong><span className="text-sm">{state.series} v{state.paperVersion}</span><span className="rounded-xl bg-learning-mint px-3 py-2 text-sm text-primary">Phần {state.section === "READING" ? "1: Đọc" : "2: Nghe"}{state.current ? ` · Câu ${state.current.number}/50` : ""}</span></div><div className="flex flex-wrap items-center gap-3"><Clock state={state} /><Button className="h-12" variant="outline" disabled={live.busy} onClick={() => setConfirm("abandon")}>Thoát</Button><Button className="h-12" variant="outline" disabled={live.busy || live.saving === "Đang lưu…"} onClick={() => setConfirm("submit")}>Nộp bài</Button></div></header>
    <main className="mx-auto grid max-w-7xl gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0 space-y-5">
        {live.error && <AssessmentError message={live.error + " Đồng hồ vẫn tiếp tục; bạn có thể chọn lại đáp án hoặc bấm Tiếp để thử lưu lại."} />}
        {state.phase === "READING_PREVIEW" && <p className="rounded-xl bg-learning-note p-4 text-learning-note-ink">Đọc xong, bạn có thể bắt đầu trả lời ngay. Nếu chưa tiếp tục, hệ thống tự chuyển khi hết thời gian đọc.</p>}
        {state.audioAvailable && <AssessmentCard><OfficialAudio key={state.unitIndex} state={state} binding={live.session.binding} /></AssessmentCard>}
        {state.passage && <AssessmentCard><h2 className="mb-4 text-[22px] leading-7 font-semibold">Đoạn đọc</h2><p className="whitespace-pre-line leading-7">{state.passage}</p></AssessmentCard>}
        {state.preview.map(q => <AssessmentCard key={q.number}><h2 className="font-semibold">Câu {q.number}: {q.prompt}</h2><ol className="mt-4 list-inside list-[upper-alpha] space-y-2">{q.options.map((option, index) => <li key={index}>{option}</li>)}</ol></AssessmentCard>)}
        {state.phase === "READING_PREVIEW" && <Button className="h-12 rounded-xl" disabled={live.busy} onClick={() => void live.perform("finishStage", null)}>Bắt đầu trả lời ngay →</Button>}
        {state.current && state.phase !== "READING_PREVIEW" && <AnswerPanel key={state.current.number} question={state.current} saving={live.saving} disabled={live.busy} onChoice={value => live.save(state.current!.number, value)} onNext={choice => {if (state.current?.number === 50) {setFinalChoice(choice);setConfirm("complete");} else void live.perform("next", choice);}} />}
      </div>
      <aside className="order-first lg:order-last"><AssessmentCard className="lg:sticky lg:top-32"><details open><summary className="cursor-pointer text-lg font-semibold">Tiến độ phần {state.section === "READING" ? "Đọc" : "Nghe"}</summary><div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-5">{state.progress.map(cell => <span key={cell.number} title={`Câu ${cell.number}: ${labels[cell.status]}`} aria-label={`Câu ${cell.number}: ${labels[cell.status]}`} className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border text-sm ${cellClasses[cell.status]}`}>{cell.number}{cell.status === "ANSWERED" ? "✓" : cell.status === "BLANK" ? "–" : ""}</span>)}</div><div className="mt-4 grid grid-cols-2 gap-3 text-sm">{(["ANSWERED", "BLANK", "CURRENT", "FUTURE"] as const).map(status => <span key={status} className="flex items-center gap-2"><span className={`h-3 w-3 rounded border ${cellClasses[status]}`} />{labels[status]}</span>)}</div></details><p className="mt-4 border-t border-learning-outline pt-4 text-sm text-muted-foreground">Làm theo thứ tự. Không quay lại câu đã qua.</p></AssessmentCard></aside>
    </main>
    <Confirmation open={confirm !== null} title={confirm !== "abandon" ? "Nộp bài đánh giá?" : "Thoát và bỏ bài?"} description={confirm !== "abandon" ? submitDescription : "Bài sẽ không có điểm, không được làm tiếp và không hoàn lượt. Bạn sẽ trở về chuẩn bị."} busy={live.busy} onCancel={() => setConfirm(null)} onConfirm={() => void live.perform(confirm === "complete" ? "next" : confirm === "submit" ? "submit" : "abandon", confirm === "complete" ? finalChoice : null).then(() => setConfirm(null))} />
  </div>;
}
