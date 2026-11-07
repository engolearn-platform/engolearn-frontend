import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { AssessmentCard, AssessmentError, Confirmation } from "./AssessmentCommon";
import { AssessmentAudio } from "./AssessmentAudio";
import { assessmentApi } from "@features/assessment/services/assessmentApi";
import type { useLiveAssessment } from "@features/assessment/hooks/useLiveAssessment";
import type { AssessmentState, Question } from "@features/assessment/types/assessment.types";

function Countdown({state}: {state: AssessmentState}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const at = performance.now();
    const remaining = Date.parse(state.deadline ?? state.serverNow) - Date.parse(state.serverNow);
    const tick = () => setSeconds(Math.max(0, Math.ceil((remaining - performance.now() + at) / 1000)));
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [state.deadline, state.serverNow]);
  const label = state.section === "READING" ? "Phần Đọc" : state.questions.length > 1 ? "Nhóm nghe" : "Câu nghe";
  return <span role="timer" className="rounded-xl border border-learning-outline px-4 py-3 font-semibold tabular-nums">{label}: {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span>;
}

function OfficialAudio({state, binding}: {state: AssessmentState; binding: string}) {
  const issue = useRef(crypto.randomUUID());
  const [startAt] = useState(() => performance.now() + Math.max(0, Date.parse(state.audioStartsAt ?? state.serverNow) - Date.parse(state.serverNow)));
  const load = useCallback(() => assessmentApi.audio(state.id, binding, state.unitIndex, issue.current), [state.id, binding, state.unitIndex]);
  const onFailure = useCallback((reason: "LOAD_FAILED" | "PLAYBACK_FAILED" | "AUTOPLAY_BLOCKED") => {
    void assessmentApi.audioFailure(state.id, binding, state.unitIndex, reason).catch(() => undefined);
  }, [state.id, binding, state.unitIndex]);
  return <AssessmentAudio load={load} onFailure={onFailure} startAt={startAt} />;
}

function QuestionPanel({question, disabled, onChoice}: {question: Question; disabled: boolean; onChoice: (choice: number) => void}) {
  return <section id={`taking-question-${question.number}`} className="scroll-mt-32">
    <AssessmentCard>
      {question.passage && <div className="mb-5 whitespace-pre-line rounded-xl bg-background p-4 leading-7">{question.passage}</div>}
      <fieldset disabled={disabled}>
        <legend className="text-lg font-semibold">Câu {question.number}: {question.prompt}</legend>
        <div className="mt-4 space-y-3">{question.options.map((option, index) => <label key={index} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-4 ${question.selected === index ? "border-primary bg-learning-mint" : "border-learning-outline"}`}>
          <input type="radio" name={`question-${question.number}`} checked={question.selected === index} onChange={() => onChoice(index)} onClick={() => {if (question.selected === index) onChoice(index);}} />
          <span><strong className="mr-3">{String.fromCharCode(65 + index)}.</strong>{option}</span>
        </label>)}</div>
      </fieldset>
    </AssessmentCard>
  </section>;
}

export function AssessmentTakingV2({live}: {live: ReturnType<typeof useLiveAssessment>}) {
  const [selected, setSelected] = useState(21);
  const [collapsed, setCollapsed] = useState(false);
  const [confirm, setConfirm] = useState<{action: "submit" | "abandon" | "finishStage"; unitIndex: number} | null>(null);
  const state = live.state!;
  const reading = state.section === "READING";
  const waiting = state.phase === "LISTENING_WAIT";
  const group = !reading && state.questions.length === 5;
  const questions = state.questions.map(q => ({...q, selected: live.drafts[q.number]?.choice ?? q.selected}));
  const current = questions.find(q => q.number === selected) ?? questions[0];
  const shown = reading ? (current ? [current] : []) : questions;
  const saving = live.saving === "Đang lưu…";
  const confirmCurrent = confirm && (confirm.action !== "finishStage" || confirm.unitIndex === state.unitIndex);
  const description = confirm?.action === "abandon" ? "Bài sẽ không có điểm, không được làm tiếp và không hoàn lượt."
    : confirm?.action === "finishStage" ? "Các đáp án trong nhóm sẽ được khóa. Bạn không thể quay lại nhóm này. Thời gian còn lại không cộng sang phần sau."
    : `Đã lưu ${state.savedCount}/50 câu. Còn ${50 - state.savedCount} câu trống. Nộp bài sẽ kết thúc cả bài đánh giá; câu trống tính sai.`;
  return <div className="min-h-screen bg-background text-on-surface">
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-learning-outline bg-white p-5">
      <div><strong className="text-primary">EngoLearn</strong><p className="mt-1 text-sm">{reading ? "2. Reading · Câu 21–50" : "1. Listening · Câu 1–20"}</p></div>
      <div className="flex flex-wrap gap-3"><Countdown state={state} /><Button variant="outline" className="h-12" disabled={live.busy} onClick={() => setConfirm({action: "abandon", unitIndex: state.unitIndex})}>Thoát</Button><Button className="h-12" disabled={live.busy || saving} onClick={() => setConfirm({action: "submit", unitIndex: state.unitIndex})}>Nộp bài</Button></div>
    </header>
    <main className={`mx-auto grid max-w-7xl gap-5 p-5 ${collapsed ? "" : "lg:grid-cols-[minmax(0,1fr)_19rem]"}`}>
      <div className="min-w-0 space-y-5">
        {collapsed && <Button variant="outline" className="h-12" onClick={() => setCollapsed(false)}>Mở bảng câu hỏi</Button>}
        {live.error && <AssessmentError message={live.error} />}
        {state.audioAvailable && <AssessmentCard><OfficialAudio key={state.unitIndex} state={state} binding={live.session!.binding} /></AssessmentCard>}
        {waiting && <p role="status" className="rounded-xl bg-learning-note p-4 text-learning-note-ink">Chuẩn bị nghe. Đồng hồ đã bắt đầu tính 2 giây đệm trước khi phát audio.</p>}
        {shown.map(q => <QuestionPanel key={q.number} question={q} disabled={live.busy || waiting} onChoice={choice => live.save(q.number, choice)} />)}
        <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm">{live.saving}</p>
          {reading ? <div className="flex gap-3"><Button variant="outline" className="h-12" disabled={!current || current.number === 21} onClick={() => setSelected(current.number - 1)}>Câu trước</Button><Button variant="outline" className="h-12" disabled={!current || current.number === 50} onClick={() => setSelected(current.number + 1)}>Câu tiếp</Button></div>
            : group ? <Button className="h-12" disabled={waiting || live.busy || saving} onClick={() => setConfirm({action: "finishStage", unitIndex: state.unitIndex})}>{state.unitIndex === 11 ? "Chuyển sang Reading" : "Chuyển nhóm tiếp theo"}</Button>
              : <Button className="h-12" disabled={waiting || live.busy || saving} onClick={() => void live.perform("next", questions[0]?.selected ?? null)}>Câu tiếp →</Button>}
        </div>
      </div>
      {!collapsed && <aside className="order-first lg:order-last"><AssessmentCard className="lg:sticky lg:top-32">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Câu hỏi phần {reading ? "Đọc" : "Nghe"}</h2><Button variant="ghost" className="h-12" aria-label="Thu gọn bảng câu hỏi" onClick={() => setCollapsed(true)}>Thu gọn</Button></div>
        <nav aria-label="Điều hướng câu hỏi" className="mt-4 grid grid-cols-5 gap-2">{state.progress.map(cell => {
          const q = questions.find(item => item.number === cell.number);
          const answered = q ? q.selected !== null : cell.status === "ANSWERED";
          const active = reading && current?.number === cell.number;
          return <Button key={cell.number} disabled={!q} aria-current={active ? "step" : undefined} aria-label={`Câu ${cell.number}${answered ? ": đã chọn" : ": chưa chọn"}`} variant={active ? "default" : "outline"} className={`h-12 p-0 ${answered && !active ? "border-learning-mint-border bg-learning-mint text-primary" : ""}`} onClick={() => {if (reading) setSelected(cell.number); else document.getElementById(`taking-question-${cell.number}`)?.scrollIntoView({behavior: "smooth", block: "start"});}}>{cell.number}{answered ? " ✓" : ""}</Button>;
        })}</nav>
        <p className="mt-4 text-sm text-muted-foreground">{reading ? "Tự do chọn và sửa câu 21–50 trong thời gian phần Đọc." : "Chỉ sửa câu hoặc nhóm đang mở. Đã chuyển tiếp thì không quay lại."}</p>
      </AssessmentCard></aside>}
    </main>
    <Confirmation open={!!confirmCurrent} title={confirm?.action === "abandon" ? "Thoát và bỏ bài?" : confirm?.action === "finishStage" ? "Kết thúc nhóm nghe?" : "Nộp bài đánh giá?"} description={description} busy={live.busy} onCancel={() => setConfirm(null)} onConfirm={() => {if (confirmCurrent && confirm) void live.perform(confirm.action, null).then(ok => {if (ok) setConfirm(null);});}} />
  </div>;
}
