import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { speakingV2Service } from "@features/speaking/services/speaking-v2.service";
import { useSpeakingV2Stream } from "@features/speaking/hooks/useSpeakingV2Stream";
import type { SpeakingAssessment, SpeakingSession, SpeakingTurn } from "@features/speaking/types/speaking-v2.types";

function backPath(session: SpeakingSession | null, locationState: unknown) {
  const state = locationState as { returnTo?: unknown } | null;
  if (typeof state?.returnTo === "string" && state.returnTo.startsWith("/") && !state.returnTo.startsWith("//")) return state.returnTo;
  if (!session) return "/topics";
  return session.scope.type === "TOPIC_ITEM"
    ? `/topics/${encodeURIComponent(session.scope.topicId)}/items/${encodeURIComponent(session.scope.topicItemId ?? "")}/speaking`
    : `/topics/${encodeURIComponent(session.scope.topicId)}/speaking`;
}

export default function SpeakingSessionView() {
  const { sessionId = "" } = useParams();
  const location = useLocation(); const navigate = useNavigate();
  const [session, setSession] = useState<SpeakingSession | null>(null);
  const [turns, setTurns] = useState<SpeakingTurn[]>([]);
  const [assessment, setAssessment] = useState<SpeakingAssessment | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [endChoice, setEndChoice] = useState(false);
  const refreshRequest = useRef(0); const routeSessionId = useRef(sessionId); routeSessionId.current = sessionId; const mounted = useRef(true);
  const backTo = backPath(session, location.state);
  const refresh = useCallback(async () => {
    const request = ++refreshRequest.current;
    const [latest, allTurns, nextAssessment] = await Promise.all([
      speakingV2Service.get(sessionId), speakingV2Service.allTurns(sessionId), speakingV2Service.assessment(sessionId).catch(() => null),
    ]);
    if (mounted.current && request === refreshRequest.current && routeSessionId.current === sessionId) { setSession(latest); setTurns(allTurns); setAssessment(nextAssessment); }
    return latest;
  }, [sessionId]);
  const mergeTurns = useCallback((fresh: SpeakingTurn[]) => setTurns(previous => {
    const merged = new Map(previous.map(turn => [turn.turnId, turn])); fresh.forEach(turn => merged.set(turn.turnId, turn));
    return [...merged.values()].sort((a, b) => a.sequence - b.sequence);
  }), []);
  const stream = useSpeakingV2Stream(session, setSession, setError, mergeTurns);
  const completedSessionId = session?.status === "ENDED" ? session.sessionId : null;
  const pollSessionId = session?.sessionId;
  const pollStatus = session?.status;
  const pollAssessmentStatus = session?.assessmentStatus;
  const activeSessionId = session?.status === "ACTIVE" ? session.sessionId : null;
  useEffect(() => { mounted.current = true; let current = true; void refresh().catch(cause => { if (current) setError(cause instanceof Error ? cause.message : "Không tải được phiên Speaking."); })
    .finally(() => { if (current) setLoading(false); }); return () => { current = false; }; }, [refresh]);
  useEffect(() => {
    if (pollStatus !== "INITIALIZING" || !pollSessionId) return;
    let stopped = false; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try { const latest = await speakingV2Service.get(pollSessionId); if (stopped) return; setSession(latest);
        if (latest.status === "INITIALIZING") timer = setTimeout(poll, 1200);
      } catch { if (!stopped) timer = setTimeout(poll, 2000); }
    };
    timer = setTimeout(poll, 500); return () => { stopped = true; clearTimeout(timer); };
  }, [pollSessionId, pollStatus]);
  useEffect(() => { if (completedSessionId) navigate(`/speaking/sessions/${encodeURIComponent(completedSessionId)}/result`, { replace: true, state: location.state }); }, [completedSessionId, navigate, location.state]);
  useEffect(() => {
    if (!pollSessionId || (pollStatus !== "CLOSING" && pollStatus !== "ENDED") || pollAssessmentStatus === "READY" || pollAssessmentStatus === "PARTIAL" || pollAssessmentStatus === "UNAVAILABLE") return;
    let stopped = false; let delay = 2500; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try { const [latest, result] = await Promise.all([speakingV2Service.get(pollSessionId), speakingV2Service.assessment(pollSessionId)]);
        if (stopped) return; setSession(latest); setAssessment(result); if (!["READY", "PARTIAL", "UNAVAILABLE"].includes(result.status)) { timer = setTimeout(poll, delay); delay = Math.min(delay * 1.5, 12000); }
      } catch { if (!stopped) timer = setTimeout(poll, delay); }
    };
    timer = setTimeout(poll, delay); return () => { stopped = true; clearTimeout(timer); };
  }, [pollSessionId, pollStatus, pollAssessmentStatus]);
  useEffect(() => {
    if (!activeSessionId) return;
    let stopped = false; let request = 0;
    const timer = setInterval(() => { const current = ++request; void speakingV2Service.allTurns(activeSessionId).then(fresh => {
      if (stopped || current !== request) return;
      setTurns(previous => {
      const merged = new Map(previous.map(turn => [turn.turnId, turn])); fresh.forEach(turn => merged.set(turn.turnId, turn));
      return [...merged.values()].sort((a, b) => a.sequence - b.sequence);
      });
    }).catch(() => {}); }, 4000);
    return () => { stopped = true; clearInterval(timer); };
  }, [activeSessionId]);

  if (loading) return <main className="mx-auto max-w-4xl p-5"><p role="status">Đang mở phiên luyện nói…</p></main>;
  if (!session) return <main className="mx-auto max-w-4xl p-5"><div role="alert" className="rounded-xl border border-error/30 p-4">{error || "Không tìm thấy phiên Speaking."}</div><Button variant="outline" className="mt-4 min-h-12" onClick={() => void refresh().catch(cause => setError(String(cause)))}>Tải lại</Button></main>;
  const busy = stream.recording !== "idle" || stream.playing;
  return <main className="mx-auto grid w-full max-w-4xl gap-5 px-5 py-6 sm:py-10" aria-busy={loading}>
    <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <div><p className="text-sm font-semibold text-primary">{session.context.topicTitle}</p><h1 className="mt-1 text-headline-lg font-bold">{session.context.title}</h1>
        <p className="mt-2 leading-6 text-on-surface-variant">{session.context.description}</p><p className="mt-2 text-sm">Bạn: {session.context.learnerRole} · AI: {session.context.aiRole}</p>
      </div><div className="grid gap-1 text-sm text-on-surface-variant"><span role="status">{stream.connection === "connected" ? "Đã kết nối" : stream.connection === "connecting" ? "Đang kết nối…" : stream.connection === "reconnecting" ? "Đang nối lại…" : "Mất kết nối"}</span><span>{session.committedTurnCount} lượt hoàn tất</span></div>
    </header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-4"><p>{error}</p><Button variant="outline" className="min-h-12" onClick={() => { setError(""); void stream.sync(); void refresh().catch(cause => setError(String(cause))); }}>Đồng bộ phiên</Button></div>}
    <section aria-label="Hội thoại" className="grid gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
      {session.opening && <article className="rounded-xl bg-learning-mint p-4"><p className="text-sm font-semibold text-primary">{session.context.aiRole}</p><p className="mt-2 text-base leading-7">{session.opening.reply}</p>
        {session.opening.hint && <aside className="mt-3 rounded-lg bg-learning-note p-3 text-learning-note-ink"><p className="font-medium">Gợi ý · {session.opening.hint.exampleEn}</p><p className="mt-1 text-sm">{session.opening.hint.explanationVi}</p></aside>}
        {session.opening.audioStatus === "AUDIO_FAILED" && <p className="mt-2 text-sm text-on-surface-variant">Audio chưa sẵn sàng; bạn vẫn có thể đọc lời thoại.</p>}
      </article>}
      {turns.map(turn => <div key={turn.turnId} className="grid gap-3">
        <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm font-semibold text-primary">Bạn · Lượt {turn.sequence}</p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7">{turn.transcript ?? (turn.reason ? "Không nhận diện được lời nói." : "Bản ghi lời nói chưa khả dụng.")}</p>
          {turn.correction && <details className="mt-3 rounded-lg border border-outline-variant p-3"><summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-primary">Gợi ý sửa câu</summary>
            <p className="mt-2 text-sm"><span className="line-through">{turn.correction.original}</span> → <strong>{turn.correction.suggested}</strong></p><p className="mt-1 text-sm text-on-surface-variant">{turn.correction.explanationVi}</p></details>}
          {stream.retryableTurnId === turn.turnId && <Button className="mt-3 min-h-12" disabled={session.status !== "ACTIVE" || stream.connection !== "connected" || stream.recording !== "idle"}
            onClick={() => stream.retryFailedTurn(turn.turnId)}>Thử tạo phản hồi lại</Button>}
        </article>
        {(turn.reply || turn.hint) && <article className="rounded-xl bg-learning-mint p-4"><p className="text-sm font-semibold text-primary">{session.context.aiRole}</p>
          {turn.reply && <p className="mt-2 text-base leading-7">{turn.reply}</p>}
          {turn.hint && <aside className="mt-3 rounded-lg bg-learning-note p-3 text-learning-note-ink"><p className="font-medium">Gợi ý · {turn.hint.exampleEn}</p><p className="mt-1 text-sm">{turn.hint.explanationVi}</p></aside>}
          {!turn.assistantAudioAvailable && <p className="mt-2 text-sm text-on-surface-variant">Audio chưa sẵn sàng; bạn vẫn có thể đọc phản hồi.</p>}
        </article>}
      </div>)}
      {stream.interim && <p aria-live="polite" className="rounded-lg border border-dashed border-primary/40 p-3 text-on-surface-variant">Đang nhận diện: {stream.interim}</p>}
      {session.status === "CLOSING" && <p role="status" className="rounded-xl bg-learning-note p-4">Đang hoàn tất phiên và chuẩn bị kết quả…</p>}
    </section>
    {stream.recoverableTurn && <section role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-learning-note p-4">
      <p>Lượt nói trước chưa được gửi hết. Bạn có thể bỏ lượt ghi âm còn dở để tiếp tục.</p>
      <Button variant="outline" className="min-h-12" disabled={stream.connection !== "connected"} onClick={stream.discardRecoveredTurn}>Bỏ bản ghi chưa hoàn tất</Button>
    </section>}
    <section className="flex flex-wrap items-center gap-3">
      {stream.recording === "recording" ? <><Button className="min-h-12" onClick={stream.finishTurn}>Dừng và gửi lượt nói</Button>
        <Button variant="outline" className="min-h-12" onClick={stream.cancelTurn}>Hủy lượt này</Button></> :
        <Button className="min-h-12" disabled={busy || stream.connection !== "connected" || session.status !== "ACTIVE"} onClick={stream.startTurn}>
          {stream.recording === "requesting" ? "Đang chờ máy chủ…" : stream.recording === "sealing" ? "Đang gửi lượt nói…" : stream.recording === "processing" ? "Đang xử lý…" : "Nhấn để nói"}
        </Button>}
      {stream.playing && <Button variant="outline" className="min-h-12" onClick={stream.stopPlayback}>Dừng phát audio</Button>}
      <Button variant="outline" className="min-h-12" disabled={session.status !== "ACTIVE" || (stream.recording !== "idle" && stream.recording !== "recording")} onClick={() => stream.recording === "recording" ? setEndChoice(true) : void stream.endSession()}>
        Kết thúc phiên
      </Button>
      <Link className="min-h-12 px-3 py-3 text-primary underline-offset-4 hover:underline" to={backTo}>Quay lại chủ đề</Link>
    </section>
    {endChoice && <section role="dialog" aria-labelledby="end-title" className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <h2 id="end-title" className="text-headline-md font-semibold">Bạn đang ghi âm</h2><p className="leading-6 text-on-surface-variant">Gửi lượt nói để nhận phản hồi, hoặc hủy lượt chưa hoàn tất trước khi kết thúc.</p>
      <div className="flex flex-wrap gap-3"><Button className="min-h-12" onClick={() => { setEndChoice(false); void stream.endSession("FINALIZE"); }}>Gửi rồi kết thúc</Button>
        <Button variant="outline" className="min-h-12" onClick={() => { setEndChoice(false); void stream.endSession("DISCARD"); }}>Hủy lượt và kết thúc</Button>
        <Button variant="outline" className="min-h-12" onClick={() => setEndChoice(false)}>Tiếp tục nói</Button></div>
    </section>}
    {session.status === "ENDED" && <section role="status" className="rounded-xl bg-learning-note p-4">Đang tải kết quả… <Link className="underline" to={`/speaking/sessions/${encodeURIComponent(session.sessionId)}/result`} state={location.state}>Mở kết quả</Link></section>}
    {assessment?.status === "UNAVAILABLE" && <p className="text-sm text-on-surface-variant">Đánh giá chưa khả dụng. Lịch sử hội thoại vẫn được lưu.</p>}
  </main>;
}
