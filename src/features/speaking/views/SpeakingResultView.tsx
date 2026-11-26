import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { AudioLines, BookOpen, Gauge, Headphones } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import ConversationTimeline from "@features/speaking/components/conversation/ConversationTimeline";
import { speakingV2Service } from "@features/speaking/services/speaking-v2.service";
import type { SpeakingAssessment, SpeakingSession, SpeakingTurn } from "@features/speaking/types/speaking-v2.types";
import { sanitizeSpeakingHistoryOrigin } from "@features/speaking/utils/speaking-history-navigation";

const criterionNames = { pronunciation: "Phát âm", fluency: "Độ trôi chảy", grammar: "Ngữ pháp", vocabulary: "Từ vựng" } as const;
const criterionIcons = { pronunciation: Headphones, fluency: AudioLines, grammar: BookOpen, vocabulary: Gauge } as const;
const scoreFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
type CriterionKey = keyof typeof criterionNames;

function criterionState(status: string | null | undefined) {
  if (status === "ASSESSED") return "Đã đánh giá";
  if (status === "INSUFFICIENT_DATA") return "Chưa đủ dữ liệu";
  if (status === "UNAVAILABLE") return "Chưa thể đánh giá";
  return "Đang đánh giá";
}

function assessmentStatusLabel(status: string | null | undefined) {
  if (status === "READY") return "Đã hoàn tất";
  if (status === "PARTIAL") return "Kết quả một phần";
  if (status === "UNAVAILABLE") return "Chưa thể đánh giá";
  return "Đang hoàn tất đánh giá";
}

function criterionExplanation(key: CriterionKey, status: string | null | undefined, reason: string | null | undefined) {
  if (status === "INSUFFICIENT_DATA") {
    return key === "pronunciation" || key === "fluency"
      ? "Chưa có đủ dữ liệu lời nói để đánh giá tiêu chí này."
      : "Chưa có đủ dữ liệu ngôn ngữ để đánh giá tiêu chí này.";
  }
  if (status === "UNAVAILABLE") {
    if (reason === "INSUFFICIENT_AUDIO_EVIDENCE") return "Chưa có đủ dữ liệu lời nói để đánh giá.";
    return "Hệ thống chưa thể hoàn tất đánh giá tiêu chí này.";
  }
  return null;
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

function SkillCard({ skill, criterion }: { skill: CriterionKey; criterion: SpeakingAssessment["criteria"][CriterionKey] | null }) {
  const Icon = criterionIcons[skill];
  const state = criterionState(criterion?.status);
  const score = typeof criterion?.score === "number" && Number.isFinite(criterion.score) ? criterion.score : null;
  const hasScore = criterion?.status === "ASSESSED" && score !== null;
  const scoreText = hasScore
    ? `${scoreFormat.format(score)} / ${criterion.maxScore}`
    : criterion?.status ? "Chưa có điểm" : null;
  const explanation = criterionExplanation(skill, criterion?.status, criterion?.reason);
  return <article className="flex min-w-0 flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 sm:p-5">
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg bg-learning-mint text-primary sm:size-9"><Icon className="size-4 sm:size-5" /></span>
      <h3 className="font-semibold">{criterionNames[skill]}</h3>
    </div>
    <p className="mt-2 text-sm text-on-surface-variant">{state}</p>
    {scoreText && <p className="mt-1 break-words text-xl font-bold tabular-nums sm:text-2xl">{scoreText}</p>}
    {hasScore && <div className="mt-3 h-2 overflow-hidden rounded-full bg-learning-outline" role="progressbar" aria-label={`Mức ${criterionNames[skill]}`} aria-valuemin={criterion.maxScore === 5 ? 1 : 0} aria-valuemax={criterion.maxScore} aria-valuenow={score} aria-valuetext={scoreText ?? undefined}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, score / criterion.maxScore * 100))}%` }} />
    </div>}
    {explanation && <p className="mt-auto pt-3 text-sm leading-6 text-on-surface-variant">{explanation}</p>}
  </article>;
}

function friendlyErrorType(errorType: string) {
  const type = errorType.toUpperCase();
  if (type === "MISPRONUNCIATION" || type === "MISPRONUNCIATION_ERROR") return "Cần luyện phát âm";
  if (type === "OMISSION") return "Cần chú ý phát âm đầy đủ";
  if (type === "INSERTION") return "Cần luyện phát âm chính xác";
  return "Cần luyện phát âm";
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
  const backToTopic = session ? backPath(session, location.state) : "/topics";
  const historyOrigin = sanitizeSpeakingHistoryOrigin(new URLSearchParams(location.search).get("from"));
  if (!session) return <div className="mx-auto max-w-6xl px-5 py-8"><p role="status">Đang tải kết quả…</p>{error && <div role="alert" className="mt-3 text-error">{error}<Button variant="outline" className="ml-2 min-h-11" onClick={() => void refresh().catch(() => {})}>Tải lại</Button></div>}</div>;
  const resultStatus = assessment?.status ?? session.assessmentStatus;
  const keys = Object.keys(criterionNames) as CriterionKey[];
  const feedbackGroups = ([
    ["Điểm tốt", assessment?.feedback.strengthsVi ?? []],
    ["Có thể cải thiện", assessment?.feedback.improvementsVi ?? []],
    ["Gợi ý luyện tập", assessment?.feedback.recommendationsVi ?? []],
  ] as const).map(([title, items]) => ({
    title,
    items: items.filter(item => item.trim()),
  })).filter(group => group.items.length > 0);
  const wordsToPractice = assessment?.feedback.wordsToPractice.filter(item => item.word.trim()) ?? [];
  const hasFeedback = feedbackGroups.length > 0 || wordsToPractice.length > 0;
  return <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6 sm:gap-6 sm:py-8">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="font-semibold text-primary">KẾT QUẢ LUYỆN NÓI</p><h1 className="mt-1 text-headline-lg font-bold">{session.context.title}</h1>
        <p className="mt-1 text-on-surface-variant">{session.committedTurnCount} lượt hội thoại · {Math.round(session.speechDurationMs / 1000)} giây nói</p></div>
      <p role="status" className="rounded-full bg-learning-mint px-3 py-2 text-sm font-semibold text-primary">{assessmentStatusLabel(resultStatus)}</p>
    </header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/30 p-3 text-error"><p>{error}</p>
      <Button variant="outline" className="min-h-11" onClick={() => void refreshTimeline().catch(() => {})}>Tải lại hội thoại</Button></div>}
    {resultStatus === "UNAVAILABLE" && <p className="text-sm text-on-surface-variant">Đánh giá chưa khả dụng. Hội thoại đã lưu vẫn có thể xem bên dưới.</p>}
    <section aria-label="Điểm theo kỹ năng" className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
      {keys.map(key => <SkillCard key={key} skill={key} criterion={assessment?.criteria[key] ?? null} />)}
    </section>
    <section aria-labelledby="feedback-title" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
      <h2 id="feedback-title" className="text-headline-md font-semibold">Nhận xét & luyện tập</h2>
      {!hasFeedback ? <p className="mt-3 rounded-xl bg-surface px-4 py-3 text-sm leading-6 text-on-surface-variant">
        {resultStatus === "PENDING" || resultStatus === "FINALIZING"
          ? "Nhận xét sẽ xuất hiện khi đánh giá hoàn tất."
          : "Chưa có nhận xét hoặc từ cần luyện thêm cho phiên này."}
      </p> : <div className="mt-4 grid gap-4">
        {feedbackGroups.map(({ title, items }) => <div key={title}>
          <h3 className="font-semibold">{title}</h3><ul className="mt-1 list-disc space-y-1 pl-5">{items.map((item, index) => <li key={index} className="leading-6">{item}</li>)}</ul>
        </div>)}
        {!!wordsToPractice.length && <div><h3 className="font-semibold">Từ nên luyện thêm</h3>
          <ul className="mt-2 flex flex-wrap gap-2">{wordsToPractice.map((word, index) => <li key={word.word + index} className="rounded-xl border border-learning-outline bg-learning-mint px-3 py-2">
            <span className="font-semibold">{word.word}</span><span className="ml-2 text-sm text-on-surface-variant">{friendlyErrorType(word.errorType)}</span>
          </li>)}</ul>
        </div>}
      </div>}
    </section>
    <section aria-labelledby="saved-conversation-title" className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
      <div className="border-b border-outline-variant px-4 py-3 sm:px-6"><h2 id="saved-conversation-title" className="text-headline-md font-semibold">Hội thoại đã lưu</h2></div>
      {!turns.length && !session.opening ? <p className="p-5 text-on-surface-variant">Phiên chưa có lượt nói đã hoàn tất.</p>
        : <ConversationTimeline className="min-h-0" scrollable={false} aiRole={session.context.aiRole} learnerRole="Bạn" opening={session.opening} turns={turns}
          onPlayOpening={session.opening?.audioAvailable ? () => void play(() => speakingV2Service.openingAudio(session.sessionId)) : undefined}
          onPlayLearner={turn => { if (turn.learnerAudioAvailable) void play(() => speakingV2Service.audio(session.sessionId, turn.turnId, "LEARNER_RECORDING")); }}
          onPlayAssistant={turn => { if (turn.assistantAudioAvailable) void play(() => speakingV2Service.audio(session.sessionId, turn.turnId, "AI_REPLY")); }} />}
    </section>
    <nav aria-label="Thao tác kết quả" className="flex flex-wrap justify-center gap-3 pb-2">
      <Button asChild className="min-h-12"><Link to={practicePath(session)}>Luyện tập lại</Link></Button>
      {historyOrigin && <Button asChild variant="outline" className="min-h-12"><Link to={historyOrigin}>Quay lại lịch sử</Link></Button>}
      <Button variant="outline" className="min-h-12" asChild><Link to={backToTopic}>Quay lại chủ đề</Link></Button>
    </nav>
  </div>;
}
