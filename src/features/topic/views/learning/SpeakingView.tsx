import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Check, CircleAlert, Lightbulb, Mic, Play, Square, Trash2, UserRound } from "lucide-react";
import { ROUTES } from "@shared/constants";
import { speakingDemoEnabled, speakingService } from "@features/topic/services/speaking.service";
import { useSpeakingStream } from "@features/topic/hooks/useSpeakingStream";
import type { SpeakingAssessment, SpeakingEndReason, SpeakingGoal, SpeakingItemConfig, SpeakingSession, SpeakingTurn } from "@features/topic/types/speaking.types";

const statusLabels = {
  ACTIVE: "Đang luyện",
  INTERRUPTED: "Gián đoạn",
  COMPLETED: "Hoàn thành",
  INCOMPLETE: "Chưa hoàn thành",
} as const;

const endReasonLabels: Record<SpeakingEndReason, string> = {
  GOALS_REACHED: "Đạt tất cả mục tiêu",
  LEARNER_ENDED: "Bạn kết thúc phiên",
  SESSION_AGE: "Hết thời gian phiên",
  TURN_LIMIT: "Đạt giới hạn lượt nói",
  DAILY_QUOTA: "Hết hạn mức ngày",
  RECOVERY_EXPIRED: "Hết thời gian phục hồi",
  EVALUATION_FAILURES: "Lỗi đánh giá liên tiếp",
  SERVICE_RESTART: "Sự cố hệ thống",
  REPLACED: "Phiên được thay thế",
  SOFT_DELETED: "Phiên đã xóa",
};

function feedbackItems(assessment: SpeakingAssessment | null, goals: SpeakingGoal[]) {
  if (!assessment) return [];
  const items = [
    ...assessment.goalEvidence.map(evidence => {
      const goal = goals.find(item => item.id === evidence.goalId);
      return goal ? `Đạt mục tiêu: ${goal.title}` : "";
    }),
    ...assessment.corrections.map(item => `Sửa lỗi: ${item.original} → ${item.corrected}${item.explanation ? `. ${item.explanation}` : ""}`),
    ...assessment.resourceEvidence.map(item => `Củng cố: ${item.explanation}`),
  ].filter(Boolean).slice(0, 3);
  if (assessment.hint && items.length < 3) {
    items.push(`Gợi ý: ${assessment.hint}`);
  }
  return items.length ? items : assessment.feedback.filter(Boolean).slice(0, 3);
}

function AiMessage({ text, assessment, goals = [], turn, playing = false, onPlay }: {
  text: string;
  assessment?: SpeakingAssessment | null;
  goals?: SpeakingGoal[];
  turn?: SpeakingTurn;
  playing?: boolean;
  onPlay?: (turn: SpeakingTurn) => void;
}) {
  const feedback = feedbackItems(assessment ?? null, goals);
  return <div className="flex items-start gap-2.5 sm:gap-3">
    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800">✦</span>
    <div className="min-w-0 max-w-[85%] sm:max-w-[75%]">
      <p className="mb-1 ml-1 text-xs font-semibold text-teal-900">AI</p>
      <div className="rounded-2xl rounded-tl-sm border border-teal-100 bg-teal-50 px-4 py-3 shadow-sm sm:px-5">
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900 sm:text-base">{text}</p>
        {turn?.aiAudioAvailable && <div className="mt-3 border-t border-teal-200 pt-3">
          <button type="button" onClick={() => onPlay?.(turn)} disabled={playing}
            aria-label={`Nghe phản hồi AI của lượt ${turn.sequence}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60">
            <Play aria-hidden="true" size={14} />{playing ? "Đang phát…" : "Nghe phản hồi AI"}
          </button>
        </div>}
        {feedback.length > 0 && <div className="mt-3 border-t border-teal-200 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-900">Nhận xét lượt này</p>
          <ul className="space-y-1.5">{feedback.map((item, index) => <li key={`${index}-${item}`}
            className="flex gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm leading-5 text-slate-700">
            {item.toLowerCase().includes("gợi ý") ? <Lightbulb aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-sky-700" />
              : <Check aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-teal-700" />}
            <span>{item}</span>
          </li>)}</ul>
        </div>}
      </div>
    </div>
  </div>;
}

function LearnerMessage({ turn, playingTurn, onPlay }: {
  turn: SpeakingTurn;
  playingTurn: string | null;
  onPlay: (turn: SpeakingTurn) => void;
}) {
  const expired = Date.now() - new Date(turn.committedAt).getTime() >= 30 * 24 * 60 * 60 * 1000;
  return <div className="flex justify-end gap-2.5 sm:gap-3">
    <div className="min-w-0 max-w-[85%] sm:max-w-[70%]">
      <p className="mb-1 mr-1 text-right text-xs font-semibold text-sky-900">Bạn</p>
      <div className="rounded-2xl rounded-tr-sm border border-sky-100 bg-sky-50 px-4 py-3 shadow-sm sm:px-5">
        <p className="mb-1 text-xs font-medium text-sky-800">Lời bạn nói</p>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900 sm:text-base">{turn.transcript || "Không có lời nói được ghi nhận."}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {turn.recordingAvailable ? <button type="button" disabled={playingTurn === turn.id}
            onClick={() => onPlay(turn)} aria-label={`Nghe lại lời bạn nói ở lượt ${turn.sequence}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:opacity-60">
            <Play aria-hidden="true" size={14} />{playingTurn === turn.id ? "Đang tải/phát…" : "Nghe lại"}
          </button> : <span className="text-xs text-sky-800/80">{expired ? "Bản ghi âm đã hết hạn phát lại" : "Không có bản ghi âm để phát lại"}</span>}
          {!turn.valid && turn.evaluationState === "INVALID" && <span className="text-xs text-amber-800">Lượt nói chưa hợp lệ</span>}
        </div>
      </div>
    </div>
    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800"><UserRound size={18} /></span>
  </div>;
}

export default function SpeakingView() {
  const { topicId: itemId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SpeakingSession | null>(null);
  const [config, setConfig] = useState<SpeakingItemConfig | null>(null);
  const [history, setHistory] = useState<SpeakingSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(!itemId);
  const [playingTurn, setPlayingTurn] = useState<string | null>(null);
  const [playingAiTurn, setPlayingAiTurn] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTokenRef = useRef(0);
  const acceptSnapshot = useCallback((next: SpeakingSession) => {
    setSession(previous => previous?.id === next.id && previous.revision > next.revision
      ? previous : next);
  }, []);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const historyOpenRef = useRef(showHistory);
  historyOpenRef.current = showHistory;
  const { connection, recording, interim, startRecording, finishRecording } =
    useSpeakingStream(session, acceptSnapshot, setError, turnId => {
      const current = sessionRef.current;
      if (!current || current.status !== "ACTIVE" || historyOpenRef.current) return;
      if (itemId && current.content.topicItemId !== itemId) return;
      void playAudio(current.id, turnId, "AI_REPLY", true);
    });

  const refresh = useCallback(async () => {
    try {
      const [current, entries] = await Promise.all([
        speakingService.current(), speakingService.history(itemId),
      ]);
      setSession(current);
      setHistory(entries);
      if (itemId) setConfig(await speakingService.config(itemId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được Speaking.");
    }
  }, [itemId]);

  useEffect(() => { if (speakingDemoEnabled) void refresh(); }, [refresh]);
  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null; }, []);

  async function run(action: () => Promise<SpeakingSession | number>, clearSession = false) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (clearSession || typeof result === "number") setSession(null);
      else setSession(result);
      setHistory(await speakingService.history(itemId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Thao tác không thành công.");
    } finally { setBusy(false); }
  }

  async function create(replace: boolean) {
    if (!itemId) return;
    await run(async () => {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach(track => track.stop());
      return replace ? speakingService.replace(itemId) : speakingService.create(itemId);
    });
  }

  async function playAudio(sessionId: string, turnId: string,
    kind: "LEARNER_RECORDING" | "AI_REPLY", silent = false) {
    const token = ++playTokenRef.current;
    audioRef.current?.pause();
    audioRef.current = null;
    if (kind === "AI_REPLY") { setPlayingAiTurn(turnId); setPlayingTurn(null); }
    else { setPlayingTurn(turnId); setPlayingAiTurn(null); }
    const stop = () => {
      if (token !== playTokenRef.current) return;
      setPlayingTurn(null);
      setPlayingAiTurn(null);
    };
    try {
      const { url } = await speakingService.audio(sessionId, turnId, kind);
      if (token !== playTokenRef.current) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = stop;
      audio.onerror = () => {
        stop();
        if (!silent) setError(kind === "AI_REPLY" ? "Không phát được phản hồi AI." : "Không phát được bản ghi âm.");
      };
      await audio.play();
    } catch (cause) {
      stop();
      if (silent) return;
      setError(cause instanceof Error ? cause.message : "Không phát được âm thanh.");
    }
  }

  const open = session?.status === "ACTIVE" || session?.status === "INTERRUPTED";
  const currentIsThisItem = session?.content.topicItemId === itemId;
  const visibleSession = session && (currentIsThisItem || !itemId) ? session : null;
  const requiredGoals = visibleSession?.content.goals.filter(goal => goal.priority === "REQUIRED") ?? [];
  const requiredAchieved = requiredGoals.filter(goal =>
    visibleSession?.achievedGoalIds.includes(goal.id)).length;
  const legacySession = visibleSession?.content.completionPolicyVersion !== "REQUIRED_GOALS_V2";

  if (!speakingDemoEnabled) return <main className="mx-auto max-w-3xl p-6">
    <h1 className="text-2xl font-semibold">Luyện nói với AI</h1>
    <p className="mt-3">Tính năng đang chỉ mở ở môi trường thử nghiệm.</p>
  </main>;

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 text-on-surface sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Thực hành hội thoại</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Luyện nói với AI</h1>
          <p className="text-sm text-on-surface-variant">Luyện thêm ngoài tiến độ bài học.</p>
        </div>
        {itemId && <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium" onClick={() =>
          navigate(ROUTES.TOPIC_CONTEXT.replace(":topicId", itemId))}>Nội dung item</button>}
      </div>

      <nav aria-label="Speaking" className="flex gap-6 border-b border-slate-200 text-sm">
        <button className={`border-b-2 pb-3 font-medium ${!showHistory ? "border-primary text-primary" : "border-transparent text-on-surface-variant"}`}
          aria-current={!showHistory ? "page" : undefined} onClick={() => setShowHistory(false)}>Phiên luyện</button>
        <button className={`border-b-2 pb-3 font-medium ${showHistory ? "border-primary text-primary" : "border-transparent text-on-surface-variant"}`}
          aria-current={showHistory ? "page" : undefined}
          onClick={() => { setShowHistory(true);
            void speakingService.history(itemId).then(setHistory).catch(() => {}); }}>Lịch sử</button>
      </nav>

      {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><CircleAlert size={18} className="shrink-0" />{error}</p>}

      {!showHistory ? <>
        {config && !visibleSession && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tình huống</p>
          <h2 className="mt-1 text-lg font-semibold">{config.title}</h2>
          <p className="mt-1 text-sm">Cần đạt mọi mục tiêu Bắt buộc
            và ít nhất {config.minimumValidTurns} lượt nói hợp lệ.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {config.goals.map(goal => <li key={goal.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">{goal.title} · {goal.priority === "REQUIRED" ? "Bắt buộc" : "Tùy chọn"}</li>)}
          </ul>
        </section>}

        {open && session && !currentIsThisItem && itemId && <div className="rounded-xl border p-5">
          <p>Bạn đang có phiên ở item “{session.content.title}”. Kết thúc hoặc thay thế phiên để luyện item này.</p>
          <div className="mt-3 flex gap-2">
            <button disabled={busy} className="rounded-lg border px-4 py-2"
              onClick={() => void run(() => speakingService.end(session))}>Kết thúc phiên cũ</button>
            <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-white"
              onClick={() => void create(true)}>Thay thế và bắt đầu</button>
          </div>
        </div>}

        {!open && itemId && <button disabled={busy || !config}
          className="rounded-lg bg-primary px-5 py-3 text-white disabled:opacity-50"
          onClick={() => void create(false)}>Bắt đầu phiên mới</button>}

        {visibleSession && <section aria-label="Cuộc hội thoại" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Tình huống</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${visibleSession.status === "ACTIVE" ? "bg-emerald-100 text-emerald-900" : visibleSession.status === "INTERRUPTED" ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-800"}`}>{statusLabels[visibleSession.status]}</span>
                </div>
                <h2 className="mt-1 text-lg font-semibold sm:text-xl">{visibleSession.content.title}</h2>
                {visibleSession.content.description && <p className="mt-1 text-sm text-on-surface-variant">{visibleSession.content.description}</p>}
              </div>
              {open && <button disabled={busy} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                onClick={() => void run(() => speakingService.end(visibleSession))}>Kết thúc phiên</button>}
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">{legacySession
              ? <strong className="text-on-surface">{visibleSession.requiredGoalsMet ? "Đã đạt" : "Chưa đạt"} điều kiện mục tiêu của phiên cũ</strong>
              : <strong className="text-on-surface">{requiredAchieved}/{requiredGoals.length} mục tiêu Bắt buộc</strong>}
              {" · "}<strong className="text-on-surface">{visibleSession.validTurnCount}/{visibleSession.content.minimumValidTurns}</strong> lượt hợp lệ tối thiểu</p>
            {open && visibleSession.requiredGoalsMet && <p role="status" className="mt-2 text-sm font-medium text-emerald-800">Đã đạt mục tiêu bắt buộc{visibleSession.completionEligible ? ". Bạn có thể kết thúc hoặc luyện thêm mục tiêu tùy chọn." : ". Hãy tiếp tục đến khi đủ lượt nói hợp lệ."}</p>}
            <ul aria-label="Mục tiêu tình huống" className="mt-4 flex flex-wrap gap-2">{visibleSession.content.goals.map(goal => {
              const achieved = visibleSession.achievedGoalIds.includes(goal.id);
              return <li key={goal.id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${achieved ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700"}`}>
                {achieved && <Check size={14} aria-hidden="true" />}{goal.title} · {goal.priority === "REQUIRED" ? "Bắt buộc" : "Tùy chọn"}
              </li>;
            })}</ul>
            {!open && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4" role="status">
              <h3 className="font-semibold">{visibleSession.endReason === "GOALS_REACHED" ? "Đã hoàn thành tất cả mục tiêu" : statusLabels[visibleSession.status]}</h3>
              <p className="mt-1 text-sm">{visibleSession.validTurnCount} lượt nói hợp lệ · {visibleSession.endReason ? endReasonLabels[visibleSession.endReason] : "Phiên đã kết thúc"}</p>
              <ul className="mt-3 space-y-2 text-sm">{visibleSession.goalResults.map(result => {
                const goal = visibleSession.content.goals.find(item => item.id === result.goalId);
                return <li key={result.goalId}>{result.achieved ? "Đạt" : "Chưa đạt"} · {goal?.title ?? result.goalId}
                  {result.evidenceQuote && <span className="block text-on-surface-variant">“{result.evidenceQuote}”</span>}</li>;
              })}</ul>
            </div>}
          </div>

          <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
            {[...visibleSession.turns].sort((a, b) => b.sequence - a.sequence).map(turn => <div key={turn.id} className="space-y-4 sm:space-y-5">
              {(turn.aiReply || turn.assessment || turn.evaluationState !== "SUCCEEDED") && <AiMessage
                text={turn.aiReply || (turn.evaluationState === "PENDING" ? "Đang xử lý lượt nói…" : turn.evaluationState === "FAILED" ? "Chưa đánh giá được lượt này. Bạn có thể nói lại." : turn.evaluationState === "INVALID" ? "Chưa nghe rõ nội dung. Bạn hãy thử nói lại." : "Không có phản hồi AI.")}
                assessment={turn.assessment} goals={visibleSession.content.goals}
                turn={turn} playing={playingAiTurn === turn.id}
                onPlay={item => void playAudio(visibleSession.id, item.id, "AI_REPLY")} />}
              <LearnerMessage turn={turn} playingTurn={playingTurn}
                onPlay={item => void playAudio(visibleSession.id, item.id, "LEARNER_RECORDING")} />
            </div>)}
            {visibleSession.openingReply && <AiMessage text={visibleSession.openingReply} />}
            {!visibleSession.openingReply && visibleSession.turns.length === 0 && <p className="py-8 text-center text-sm text-on-surface-variant">Phiên chưa có lượt hội thoại nào.</p>}
          </div>

          {open && <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:px-6">
            {interim && <div aria-live="polite" className="mb-3 rounded-xl border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm">
              <span className="font-semibold text-sky-900">Đang nghe · Chữ tạm thời</span><p className="mt-1 italic">{interim}</p>
            </div>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{recording === "recording" ? "Đang nghe bạn nói" : recording === "processing" ? "Đang đánh giá lượt nói" : visibleSession.status === "INTERRUPTED" ? "Phiên bị gián đoạn" : "Sẵn sàng cho lượt tiếp theo"}</p>
                <p role="status" className="mt-0.5 text-xs text-on-surface-variant">{connection === "reconnecting" ? "Đang kết nối lại…" : connection === "connecting" ? "Đang kết nối…" : connection === "disconnected" ? "Chưa kết nối" : recording === "processing" ? "Vui lòng đợi phản hồi trước khi nói tiếp" : "Micro đã sẵn sàng"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {connection === "connected" && recording === "idle" && visibleSession.status === "ACTIVE" && <button
                  disabled={!visibleSession.canStartTurn} onClick={() => void startRecording()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Mic size={18} /> Nhấn để nói</button>}
                {recording === "recording" && <button onClick={() => void finishRecording()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"><Square size={16} /> Chốt câu</button>}
                {recording === "processing" && <span className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Đang xử lý…</span>}
                {visibleSession.status === "INTERRUPTED" && <button disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={() => void run(() => speakingService.resume(visibleSession))}>Tiếp tục phiên</button>}
              </div>
            </div>
          </div>}
        </section>}
      </> : <section className="space-y-3">
        <div className="flex justify-end gap-2">
          {itemId && <button className="rounded-lg border px-3 py-2" onClick={() =>
            navigate(ROUTES.SPEAKING_HISTORY)}>Xem mọi item</button>}
          {history.length > 0 && <button disabled={busy} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2"
            onClick={() => { if (window.confirm("Xóa toàn bộ dữ liệu Speaking của bạn?"))
              void run(() => speakingService.removeAll(), true); }}><Trash2 size={16} /> Xóa toàn bộ</button>}
        </div>
        {history.length === 0 && <p>Chưa có phiên luyện nói.</p>}
        {history.map(entry => <div key={entry.id} className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <button className="text-left font-semibold" onClick={() => { setSession(entry); setShowHistory(false); }}>
              {entry.content.title}</button>
            <button aria-label="Xóa phiên" disabled={busy} onClick={() => {
              if (window.confirm("Xóa phiên luyện nói này?"))
                void run(() => speakingService.remove(entry.id), session?.id === entry.id);
            }}><Trash2 size={18} /></button>
          </div>
          <p className="text-sm text-on-surface-variant">{new Date(entry.startedAt).toLocaleString("vi-VN")}
            · {entry.status} · {entry.validTurnCount} lượt hợp lệ</p>
        </div>)}
      </section>}
    </main>
  );
}
