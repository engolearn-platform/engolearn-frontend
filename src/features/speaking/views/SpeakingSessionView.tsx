import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Mic, Square } from "lucide-react";
import ConversationTimeline from "@features/speaking/components/conversation/ConversationTimeline";
import { speakingV2Service } from "@features/speaking/services/speaking-v2.service";
import { useSpeakingV2Stream } from "@features/speaking/hooks/useSpeakingV2Stream";
import type { SpeakingSession, SpeakingTurn } from "@features/speaking/types/speaking-v2.types";
import { speakingEntryPath, speakingHistoryUrl } from "@features/speaking/utils/speaking-history-navigation";

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
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [endChoice, setEndChoice] = useState(false);
  const replayAudio = useRef<HTMLAudioElement | null>(null);
  const replayRequest = useRef(0);
  const refreshRequest = useRef(0); const routeSessionId = useRef(sessionId); routeSessionId.current = sessionId; const mounted = useRef(true);
  const backTo = backPath(session, location.state);
  const historyPath = session ? speakingHistoryUrl({ kind: "exact", scope: session.scope, page: 0, origin: speakingEntryPath(session.scope) }) : "/speaking/history";
  const refresh = useCallback(async () => {
    const request = ++refreshRequest.current;
    const [latest, allTurns] = await Promise.all([speakingV2Service.get(sessionId), speakingV2Service.allTurns(sessionId)]);
    if (mounted.current && request === refreshRequest.current && routeSessionId.current === sessionId) { setSession(latest); setTurns(allTurns); }
    return latest;
  }, [sessionId]);
  const mergeTurns = useCallback((fresh: SpeakingTurn[]) => setTurns(previous => {
    const merged = new Map(previous.map(turn => [turn.turnId, turn])); fresh.forEach(turn => merged.set(turn.turnId, turn));
    return [...merged.values()].sort((a, b) => a.sequence - b.sequence);
  }), []);
  const stream = useSpeakingV2Stream(session, setSession, setError, mergeTurns);
  const stopReplay = useCallback(() => {
    replayRequest.current++;
    const audio = replayAudio.current; replayAudio.current = null;
    if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; }
  }, []);
  const playSavedAudio = useCallback(async (load: () => Promise<{ url: string }>) => {
    stopReplay();
    const request = replayRequest.current;
    try {
      const { url } = await load();
      if (!mounted.current || stream.playing || request !== replayRequest.current) return;
      const audio = new Audio(url); replayAudio.current = audio;
      audio.onended = () => { if (replayAudio.current === audio) replayAudio.current = null; };
      audio.onerror = () => { if (replayAudio.current === audio) replayAudio.current = null; setError("Không phát được audio. Nội dung chữ vẫn khả dụng."); };
      await audio.play();
    } catch (cause) { if (mounted.current && request === replayRequest.current) setError(cause instanceof Error ? cause.message : "Audio không còn khả dụng."); }
  }, [stopReplay, stream.playing]);
  useEffect(() => { if (stream.playing) stopReplay(); }, [stream.playing, stopReplay]);
  useEffect(() => () => stopReplay(), [sessionId, stopReplay]);
  const completedSessionId = session?.status === "ENDED" ? session.sessionId : null;
  const pollSessionId = session?.sessionId;
  const pollStatus = session?.status;
  const pollAssessmentStatus = session?.assessmentStatus;
  const activeSessionId = session?.status === "ACTIVE" ? session.sessionId : null;
  useEffect(() => { mounted.current = true; let current = true; void refresh().catch(cause => { if (current) setError(cause instanceof Error ? cause.message : "Không tải được phiên Speaking."); })
    .finally(() => { if (current) setLoading(false); }); return () => { current = false; mounted.current = false; }; }, [refresh]);
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
        if (stopped) return; setSession(latest); if (!["READY", "PARTIAL", "UNAVAILABLE"].includes(result.status)) { timer = setTimeout(poll, delay); delay = Math.min(delay * 1.5, 12000); }
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

  if (loading) return <div className="grid h-full min-h-0 place-items-center p-5"><p role="status">Đang mở phiên luyện nói…</p></div>;
  if (!session) return <div className="mx-auto max-w-4xl p-5"><div role="alert" className="rounded-xl border border-error/30 p-4">{error || "Không tìm thấy phiên Speaking."}</div><Button variant="outline" className="mt-4 min-h-12" onClick={() => void refresh().catch(cause => setError(String(cause)))}>Tải lại</Button></div>;
  const recordingAllowed = stream.connection === "connected" && session.status === "ACTIVE" && stream.recording === "idle" && !stream.playing && !stream.recoverableTurn;
  const replayAllowed = stream.connection === "connected" && stream.recording === "idle" && !stream.playing;
  const connectionLabel = stream.connection === "connected" ? "Đã kết nối" : stream.connection === "connecting" ? "Đang kết nối" : stream.connection === "reconnecting" ? "Đang nối lại" : "Mất kết nối";
  const activeTurnStatus = session.activeTurn?.status.toUpperCase();
  const controlStatus = session.status === "CLOSING" ? ["Đang kết thúc phiên", "Đang hoàn tất hội thoại và chuẩn bị kết quả."]
    : stream.recording === "recording" ? ["Đang ghi âm", "Nhấn dừng khi bạn đã nói xong."]
      : stream.recording === "requesting" ? ["Đang chuẩn bị lượt nói", "Đang chờ máy chủ cho phép ghi âm."]
        : stream.recording === "sealing" || activeTurnStatus === "TRANSCRIBING" ? ["Đang chuyển lời nói thành văn bản", "Đang xử lý bản ghi của bạn."]
          : activeTurnStatus === "GENERATING" || stream.recording === "processing" ? ["AI đang soạn phản hồi", "Phản hồi sẽ xuất hiện trong hội thoại."]
            : stream.playing ? ["AI đang phát âm thanh", "Bạn có thể dừng phát để tiếp tục."]
              : stream.connection === "connected" && session.status === "ACTIVE" ? ["Sẵn sàng cho lượt tiếp theo", stream.recoverableTurn ? "Bỏ lượt ghi âm chưa hoàn tất để tiếp tục." : "Micro đã sẵn sàng."]
                : session.status === "INITIALIZING" || stream.connection === "connecting" ? ["Đang chuẩn bị hội thoại", "Đang thiết lập kết nối."]
                  : stream.connection === "reconnecting" ? ["Đang kết nối lại", "Hội thoại sẽ tiếp tục khi kết nối được khôi phục."]
                    : ["Mất kết nối", "Đang thử khôi phục kết nối. Bạn chưa thể ghi âm."];
  const retryableTurn = turns.find(turn => turn.turnId === stream.retryableTurnId);
  return <div className="flex h-full min-h-0 flex-col bg-background" aria-busy={loading}>
    <header className="shrink-0 border-b border-outline-variant bg-surface-container-lowest px-5 py-3 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant"><Link className="min-h-10 content-center rounded px-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary" to={backTo}>Quay lại chủ đề</Link>
            <span aria-hidden="true">·</span><Link className="min-h-10 content-center rounded px-1 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary" to={historyPath}>Lịch sử phiên</Link>
            {session.context.topicTitle !== session.context.title && <><span aria-hidden="true">›</span><span className="truncate">{session.context.topicTitle}{session.context.topicItemTitle && session.context.topicItemTitle !== session.context.title ? ` · ${session.context.topicItemTitle}` : ""}</span></>}
          </div>
          <h1 className="mt-1 break-words text-xl font-bold sm:text-headline-md">{session.context.title}</h1>
          {session.context.description && <p className="mt-1 max-w-2xl whitespace-normal text-sm leading-6 text-on-surface-variant">{session.context.description}</p>}
          <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">{session.context.learnerRole} · AI: {session.context.aiRole}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-on-surface-variant sm:text-sm">
            <p role="status" aria-label={`Trạng thái kết nối: ${connectionLabel}`}><span aria-hidden="true" className={`mr-2 inline-block size-2 rounded-full ${stream.connection === "connected" ? "bg-emerald-600" : "bg-amber-500"}`} />{connectionLabel}</p>
            <p>{session.committedTurnCount} lượt hoàn tất</p>
          </div>
          <Button variant="outline" className="min-h-11 border-error/40 text-error hover:bg-error/5" disabled={session.status !== "ACTIVE" || (stream.recording !== "idle" && stream.recording !== "recording") || stream.playing}
            onClick={() => stream.recording === "recording" ? setEndChoice(true) : void stream.endSession()}>Kết thúc phiên</Button>
        </div>
      </div>
    </header>
    {error && <div role="alert" className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-error/30 bg-error/5 px-5 py-2 text-sm"><p>{error}</p><Button variant="outline" className="min-h-10" onClick={() => { setError(""); void stream.sync(); void refresh().catch(cause => setError(String(cause))); }}>Đồng bộ phiên</Button></div>}
    <ConversationTimeline className="min-h-0 flex-1" aiRole={session.context.aiRole} learnerRole="Bạn"
      opening={session.opening} turns={turns} activityKey={`${stream.interim}:${stream.recording}:${turns.map(turn => `${turn.turnId}-${Boolean(turn.reply)}`).join(",")}`}
      onPlayOpening={replayAllowed && session.opening?.audioAvailable ? () => void playSavedAudio(() => speakingV2Service.openingAudio(session.sessionId)) : undefined}
      onPlayLearner={replayAllowed ? turn => turn.learnerAudioAvailable ? void playSavedAudio(() => speakingV2Service.audio(session.sessionId, turn.turnId, "LEARNER_RECORDING")) : undefined : undefined}
      onPlayAssistant={replayAllowed ? turn => turn.assistantAudioAvailable ? void playSavedAudio(() => speakingV2Service.audio(session.sessionId, turn.turnId, "AI_REPLY")) : undefined : undefined}
      liveContent={<>
        {stream.interim && <p aria-live="polite" className="justify-self-end rounded-2xl bg-sky-50 px-4 py-3 text-sm text-on-surface-variant">Đang nhận diện: {stream.interim}</p>}
        {stream.recoverableTurn && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-learning-note p-3 text-sm">
          <p>Lượt nói trước chưa được gửi hết.</p><Button variant="outline" className="min-h-11" disabled={stream.connection !== "connected"} onClick={stream.discardRecoveredTurn}>Bỏ bản ghi chưa hoàn tất</Button>
        </div>}
        {session.assessmentStatus === "UNAVAILABLE" && <p className="rounded-lg bg-surface px-3 py-2 text-sm text-on-surface-variant">Đánh giá chưa khả dụng. Hội thoại đã được lưu.</p>}
        {session.status === "CLOSING" && <p role="status" className="rounded-xl bg-learning-note p-4">Đang hoàn tất phiên và chuẩn bị kết quả…</p>}
      </>} />
    <footer className="sticky bottom-0 z-10 shrink-0 border-t border-outline-variant bg-surface-container-lowest px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div aria-live="polite">
          <p className="font-semibold">{controlStatus[0]}</p><p className="text-sm text-on-surface-variant">{controlStatus[1]}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {retryableTurn && <Button data-speaking-control="primary" className="min-h-12 min-w-44" disabled={session.status !== "ACTIVE" || stream.connection !== "connected" || stream.recording !== "idle"} onClick={() => stream.retryFailedTurn(retryableTurn.turnId)}>Thử tạo phản hồi lại</Button>}
          {retryableTurn && <Button variant="outline" className="min-h-12" disabled={!recordingAllowed} onClick={() => { stopReplay(); stream.startTurn(); }}>Lượt nói mới</Button>}
          {!retryableTurn && (stream.recording === "recording" ? <Button data-speaking-control="primary" className="min-h-12 min-w-44" onClick={stream.finishTurn}><Square className="size-4" />Dừng và gửi lượt nói</Button>
            : <Button data-speaking-control="primary" className="min-h-12 min-w-44" disabled={!recordingAllowed} onClick={() => { stopReplay(); stream.startTurn(); }}>
              <Mic className="size-5" />{stream.recording === "requesting" ? "Đang chuẩn bị…" : stream.recording === "sealing" || stream.recording === "processing" ? "Đang xử lý…" : "Nhấn để nói"}
            </Button>)}
          {stream.recording === "recording" && <Button variant="outline" className="min-h-12" onClick={stream.cancelTurn}>Hủy lượt này</Button>}
          {stream.playing && <Button variant="outline" className="min-h-12" onClick={stream.stopPlayback}>Dừng phát</Button>}
        </div>
      </div>
    </footer>
    <Dialog open={endChoice} onOpenChange={setEndChoice}>
      <DialogContent><DialogHeader><DialogTitle>Bạn đang ghi âm</DialogTitle><DialogDescription>Gửi lượt nói để nhận phản hồi, hoặc hủy lượt chưa hoàn tất trước khi kết thúc.</DialogDescription></DialogHeader>
        <DialogFooter className="flex-col sm:flex-col">
          <Button className="min-h-12" onClick={() => { setEndChoice(false); void stream.endSession("FINALIZE"); }}>Gửi rồi kết thúc</Button>
          <Button variant="outline" className="min-h-12" onClick={() => { setEndChoice(false); void stream.endSession("DISCARD"); }}>Hủy lượt và kết thúc</Button>
          <Button variant="outline" className="min-h-12" onClick={() => setEndChoice(false)}>Tiếp tục nói</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {session.status === "ENDED" && <section role="status" className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-xl bg-learning-note p-4">Đang tải kết quả… <Link className="underline" to={`/speaking/sessions/${encodeURIComponent(session.sessionId)}/result`} state={location.state}>Mở kết quả</Link></section>}
  </div>;
}
