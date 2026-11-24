import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { speakingV2Service } from "@features/speaking/services/speaking-v2.service";
import type { SpeakingAssessment, SpeakingSession, SpeakingTurn } from "@features/speaking/types/speaking-v2.types";

const criterionNames = { pronunciation: "Phát âm", fluency: "Độ trôi chảy", grammar: "Ngữ pháp", vocabulary: "Từ vựng" } as const;
function criterionState(status: string | null) {
  if (status === "ASSESSED") return "Đã đánh giá";
  if (status === "INSUFFICIENT_DATA") return "Chưa đủ dữ liệu";
  if (status === "UNAVAILABLE") return "Không khả dụng";
  return "Đang chờ đánh giá";
}
function practicePath(session: SpeakingSession) {
  return session.scope.type === "TOPIC_ITEM"
    ? `/topics/${encodeURIComponent(session.scope.topicId)}/items/${encodeURIComponent(session.scope.topicItemId ?? "")}/speaking`
    : `/topics/${encodeURIComponent(session.scope.topicId)}/speaking`;
}
function backPath(session: SpeakingSession, state: unknown) {
  const value = (state as { returnTo?: unknown } | null)?.returnTo;
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : practicePath(session);
}

export default function SpeakingResultView() {
  const { sessionId = "" } = useParams(); const location = useLocation();
  const [session, setSession] = useState<SpeakingSession | null>(null); const [turns, setTurns] = useState<SpeakingTurn[]>([]);
  const [assessment, setAssessment] = useState<SpeakingAssessment | null>(null); const [error, setError] = useState("");
  const sessionIdRef = useRef(sessionId); sessionIdRef.current = sessionId;
  const mounted = useRef(true);
  const loadRequest = useRef(0); const audioRef = useRef<HTMLAudioElement | null>(null); const playbackRequest = useRef(0);
  const assessmentStatus = assessment?.status;
  const refreshTimeline = useCallback(async () => {
    const request = ++loadRequest.current;
    try {
      const [sessionResult, turnsResult] = await Promise.allSettled([speakingV2Service.get(sessionId), speakingV2Service.allTurns(sessionId)]);
      if (!mounted.current || request !== loadRequest.current || sessionIdRef.current !== sessionId) return;
      if (sessionResult.status === "fulfilled") setSession(sessionResult.value);
      if (turnsResult.status === "fulfilled") setTurns(turnsResult.value);
      const failure = sessionResult.status === "rejected" ? sessionResult.reason : turnsResult.status === "rejected" ? turnsResult.reason : null;
      if (failure) throw failure;
      setError("");
    } catch (cause) {
      if (mounted.current && request === loadRequest.current && sessionIdRef.current === sessionId) setError(cause instanceof Error ? cause.message : "Không tải được lịch sử hội thoại.");
      throw cause;
    }
  }, [sessionId]);
  const refresh = useCallback(async () => {
    const request = ++loadRequest.current;
    try {
      const [next, allTurns, result] = await Promise.all([speakingV2Service.get(sessionId), speakingV2Service.allTurns(sessionId), speakingV2Service.assessment(sessionId)]);
      if (!mounted.current || request !== loadRequest.current || sessionIdRef.current !== sessionId) return;
      setSession(next); setTurns(allTurns); setAssessment(result); setError("");
    } catch (cause) {
      if (mounted.current && request === loadRequest.current && sessionIdRef.current === sessionId) setError(cause instanceof Error ? cause.message : "Không tải được kết quả.");
      throw cause;
    }
  }, [sessionId]);
  useEffect(() => { mounted.current = true; void refresh().catch(() => {}); return () => { mounted.current = false; }; }, [refresh]);
  useEffect(() => {
    if (!assessmentStatus || !["READY", "PARTIAL", "UNAVAILABLE"].includes(assessmentStatus)) return;
    void refreshTimeline().catch(() => {});
  }, [assessmentStatus, refreshTimeline]);
  useEffect(() => {
    if (!assessmentStatus || !["PENDING", "FINALIZING"].includes(assessmentStatus)) return;
    let stopped = false; let delay = 2500; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => { try { const next = await speakingV2Service.assessment(sessionId); if (stopped) return;
      setAssessment(next); if (["PENDING", "FINALIZING"].includes(next.status)) { timer = setTimeout(poll, delay); delay = Math.min(delay * 1.5, 12000); }
    } catch { if (!stopped) timer = setTimeout(poll, delay); } };
    timer = setTimeout(poll, delay); return () => { stopped = true; clearTimeout(timer); };
  }, [sessionId, assessmentStatus]);
  const stopPlayback = useCallback(() => {
    playbackRequest.current++;
    const audio = audioRef.current; audioRef.current = null;
    if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; }
  }, []);
  useEffect(() => () => { stopPlayback(); loadRequest.current++; }, [sessionId, stopPlayback]);
  async function play(loadAudio: () => Promise<{ url: string }>) {
    stopPlayback(); const request = playbackRequest.current;
    try {
      const { url } = await loadAudio();
      if (!mounted.current || request !== playbackRequest.current || sessionIdRef.current !== sessionId) return;
      const audio = new Audio(url); audioRef.current = audio;
      audio.onended = () => { if (audioRef.current === audio) audioRef.current = null; };
      audio.onerror = () => { if (audioRef.current === audio) audioRef.current = null; setError("Không phát được audio. Nội dung chữ vẫn khả dụng."); };
      await audio.play();
      if (request !== playbackRequest.current) { audio.pause(); return; }
    } catch (cause) {
      if (mounted.current && request === playbackRequest.current) setError(cause instanceof Error ? cause.message : "Audio không còn khả dụng.");
    }
  }
  async function playOpening() {
    if (!session) return;
    await play(() => speakingV2Service.openingAudio(session.sessionId));
  }
  if (!session) return <main className="mx-auto max-w-4xl px-5 py-8"><p role="status">Đang tải kết quả…</p>{error && <div role="alert" className="mt-3 text-error">{error}<Button variant="outline" className="ml-2" onClick={() => void refresh()}>Tải lại</Button></div>}</main>;
  const backTo = backPath(session, location.state);
  const resultStatus = assessment?.status ?? session.assessmentStatus;
  return <main className="mx-auto grid w-full max-w-4xl gap-5 px-5 py-8 sm:py-12">
    <header><p className="font-semibold text-primary">KẾT QUẢ SPEAKING</p><h1 className="mt-1 text-headline-lg font-bold">{session.context.title}</h1>
      <p className="mt-2 text-on-surface-variant">{session.context.topicTitle} · {session.committedTurnCount} lượt hội thoại · {Math.round(session.speechDurationMs / 1000)} giây nói</p></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/30 p-3 text-error"><p>{error}</p>
      <Button variant="outline" onClick={() => void refreshTimeline().catch(() => {})}>Tải lại hội thoại</Button></div>}
    <section className="grid gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="text-headline-md font-semibold">Đánh giá · {resultStatus === "PENDING" || resultStatus === "FINALIZING" ? "Đang hoàn tất…" : resultStatus === "READY" ? "Đầy đủ" : resultStatus === "PARTIAL" ? "Một phần" : "Chưa khả dụng"}</h2>
      {(resultStatus === "PENDING" || resultStatus === "FINALIZING") && <p role="status">Đang xử lý đánh giá. Màn hình tự cập nhật sau vài giây.</p>}
      {resultStatus === "UNAVAILABLE" && <p className="leading-6 text-on-surface-variant">Đánh giá chưa khả dụng, nhưng hội thoại và bản ghi vẫn có thể xem nếu còn trong thời hạn lưu trữ.</p>}
      {assessment && <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(criterionNames) as (keyof typeof criterionNames)[]).map(key => {
          const criterion = assessment.criteria[key];
          return <article key={key} className="rounded-xl border border-outline-variant p-4">
            <h3 className="font-semibold">{criterionNames[key]}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{criterionState(criterion.status)}</p>
            <p className="mt-2 text-2xl font-bold">{criterion.score === null ? "Chưa có điểm" : `${criterion.score} / ${criterion.maxScore}`}</p>
            {criterion.reason && <p className="mt-2 text-sm leading-6">{criterion.reason}</p>}
            {criterion.accuracy && <p className="mt-2 text-sm">Độ chính xác: {criterion.accuracy.level ?? criterion.accuracy.status}{criterion.accuracy.reasonVi ? ` — ${criterion.accuracy.reasonVi}` : ""}</p>}
            {criterion.range && <p className="mt-2 text-sm">Độ đa dạng: {criterion.range.level ?? criterion.range.status}{criterion.range.reasonVi ? ` — ${criterion.range.reasonVi}` : ""}</p>}
          </article>;
        })}
      </div>}
    </section>
    {assessment && <section className="grid gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="text-headline-md font-semibold">Nhận xét</h2>
      {([ ["Điểm tốt", assessment.feedback.strengthsVi], ["Có thể cải thiện", assessment.feedback.improvementsVi], ["Gợi ý luyện tập", assessment.feedback.recommendationsVi] ] as const).map(([title, items]) => <div key={title}>
        <h3 className="font-semibold">{title}</h3>{items.length ? <ul className="mt-1 list-disc space-y-1 pl-5">{items.map((item, index) => <li key={index} className="leading-6">{item}</li>)}</ul> : <p className="mt-1 text-sm text-on-surface-variant">Chưa có nhận xét cho mục này.</p>}
      </div>)}
      {!!assessment.feedback.wordsToPractice.length && <div><h3 className="font-semibold">Từ nên luyện thêm</h3><ul className="mt-2 grid gap-2 sm:grid-cols-2">{assessment.feedback.wordsToPractice.map((word, index) => <li key={word.word + index} className="rounded-lg bg-learning-note p-3">{word.word} · {word.errorType}</li>)}</ul></div>}
    </section>}
    <section className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5"><h2 className="text-headline-md font-semibold">Hội thoại đã lưu</h2>
      {session.opening && <article className="rounded-xl bg-learning-mint p-4"><p className="font-semibold">{session.context.aiRole}</p><p className="mt-2 leading-7">{session.opening.reply}</p>
        {session.opening.hint && <p className="mt-2 text-sm">Gợi ý: {session.opening.hint.exampleEn} — {session.opening.hint.explanationVi}</p>}
        {session.opening.audioAvailable && <Button variant="outline" className="mt-3 min-h-12" onClick={() => void playOpening()}>Phát audio mở đầu</Button>}</article>}
      {turns.map(turn => <div key={turn.turnId} className="grid gap-3"><article className="rounded-xl border border-outline-variant p-4"><p className="font-semibold">Bạn · Lượt {turn.sequence}</p>
        <p className="mt-2 whitespace-pre-wrap leading-7">{turn.transcript ?? "Bản chép lời không khả dụng."}</p>
        {turn.learnerAudioAvailable && <Button variant="outline" className="mt-3 min-h-12" onClick={() => void play(() => speakingV2Service.audio(session.sessionId, turn.turnId, "LEARNER_RECORDING"))}>Nghe bản ghi</Button>}
        {turn.correction && <details className="mt-3"><summary className="cursor-pointer font-medium">Gợi ý sửa câu</summary><p className="mt-2">{turn.correction.original} → {turn.correction.suggested}</p><p className="text-sm text-on-surface-variant">{turn.correction.explanationVi}</p></details>}</article>
        {(turn.reply || turn.hint) && <article className="rounded-xl bg-learning-mint p-4"><p className="font-semibold">{session.context.aiRole}</p>{turn.reply && <p className="mt-2 leading-7">{turn.reply}</p>}
          {turn.hint && <p className="mt-2 text-sm">Gợi ý: {turn.hint.exampleEn} — {turn.hint.explanationVi}</p>}
          {turn.assistantAudioAvailable && <Button variant="outline" className="mt-3 min-h-12" onClick={() => void play(() => speakingV2Service.audio(session.sessionId, turn.turnId, "AI_REPLY"))}>Phát phản hồi</Button>}</article>}</div>)}
      {!turns.length && <p className="text-on-surface-variant">Phiên chưa có lượt nói đã hoàn tất.</p>}
    </section>
    <div className="flex flex-wrap gap-3"><Button asChild className="min-h-12"><Link to={practicePath(session)}>Luyện lại</Link></Button><Button variant="outline" className="min-h-12" asChild><Link to={backTo}>Quay lại chủ đề</Link></Button>
      <Link className="min-h-12 px-3 py-3 text-primary underline-offset-4 hover:underline" to="/speaking/history">Lịch sử Speaking</Link></div>
  </main>;
}
