import { useEffect, useRef, useState } from "react";
import { Sparkles, UserRound, Volume2 } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { SpeakingHint, SpeakingOpening, SpeakingTurn } from "@features/speaking/types/speaking-v2.types";

interface ConversationTimelineProps {
  aiRole: string;
  learnerRole: string;
  opening: SpeakingOpening | null;
  turns: SpeakingTurn[];
  onPlayOpening?: () => void;
  onPlayLearner?: (turn: SpeakingTurn) => void;
  onPlayAssistant?: (turn: SpeakingTurn) => void;
  liveContent?: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  activityKey?: string | number;
}

function Hint({ hint }: { hint: SpeakingHint }) {
  return <details className="mt-3 text-sm">
    <summary className="min-h-11 w-fit cursor-pointer rounded-lg px-3 py-2 font-medium text-primary hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-primary">Gợi ý trả lời</summary>
    <div className="mt-1 rounded-lg border border-learning-mint-border bg-white/70 p-3">
      <p className="font-medium">{hint.exampleEn}</p>
      <p className="mt-1 leading-6 text-on-surface-variant">{hint.explanationVi}</p>
    </div>
  </details>;
}

function Correction({ turn }: { turn: SpeakingTurn }) {
  if (!turn.correction) return null;
  return <details className="mt-3 text-sm">
    <summary className="min-h-11 w-fit cursor-pointer rounded-lg px-3 py-2 font-medium text-primary hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-primary">Gợi ý sửa câu</summary>
    <div className="mt-1 rounded-lg border border-learning-outline bg-white/70 p-3">
      <p><span className="line-through">{turn.correction.original}</span> → <strong>{turn.correction.suggested}</strong></p>
      <p className="mt-1 leading-6 text-on-surface-variant">{turn.correction.explanationVi}</p>
    </div>
  </details>;
}

function Playback({ label, onClick }: { label: string; onClick?: () => void }) {
  if (!onClick) return null;
  return <Button variant="outline" className="mt-3 min-h-11 rounded-full bg-white/80" aria-label={label} onClick={onClick}><Volume2 className="size-4" />{label}</Button>;
}

function AiMessage({ role, children, hint, playLabel, onPlay }: {
  role: string; children: React.ReactNode; hint: SpeakingHint | null; playLabel: string; onPlay?: () => void;
}) {
  return <article className="flex max-w-[82%] items-start gap-3 self-start justify-self-start sm:max-w-[76%]">
    <span aria-hidden="true" className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-learning-mint text-primary"><Sparkles className="size-4" /></span>
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold text-on-surface-variant">{role}</p>
      <div className="rounded-2xl rounded-tl-md bg-learning-mint px-4 py-3">
        <p className="whitespace-pre-wrap break-words text-base leading-7">{children}</p>
        <Playback label={playLabel} onClick={onPlay} />
        {hint && <Hint hint={hint} />}
      </div>
    </div>
  </article>;
}

function LearnerMessage({ role, turn, onPlay }: { role: string; turn: SpeakingTurn; onPlay?: () => void }) {
  return <article className="flex max-w-[82%] items-start gap-3 self-end justify-self-end sm:max-w-[76%]">
    <div className="min-w-0 text-right">
      <p className="mb-1 text-xs font-semibold text-on-surface-variant">{role} · {turn.sequence}</p>
      <div className="rounded-2xl rounded-tr-md border border-sky-100 bg-sky-50 px-4 py-3 text-left">
        <p className="whitespace-pre-wrap break-words text-base leading-7">{turn.transcript ?? (turn.reason ? "Không nhận diện được lời nói." : "Bản ghi lời nói chưa khả dụng.")}</p>
        <div className="flex justify-end"><Playback label="Nghe bản ghi" onClick={onPlay} /></div>
        <Correction turn={turn} />
      </div>
    </div>
    <span aria-hidden="true" className="mt-5 grid size-9 shrink-0 place-items-center rounded-full border border-sky-100 bg-sky-50 text-sky-900"><UserRound className="size-4" /></span>
  </article>;
}

export default function ConversationTimeline({
  aiRole, learnerRole, opening, turns, onPlayOpening, onPlayLearner, onPlayAssistant,
  liveContent, className = "",
  scrollable = true, activityKey,
}: ConversationTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const messageCount = turns.length + turns.filter(turn => turn.reply || turn.hint).length + (opening ? 1 : 0);

  useEffect(() => {
    if (!scrollable) return;
    if (nearBottom.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    else setShowLatest(true);
  }, [messageCount, scrollable, activityKey]);

  useEffect(() => {
    if (!scrollable || typeof ResizeObserver === "undefined") return;
    const content = scrollRef.current?.firstElementChild;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      const element = scrollRef.current;
      if (!element) return;
      if (nearBottom.current) element.scrollTop = element.scrollHeight;
      else setShowLatest(true);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollable]);

  function updateScrollPosition() {
    const element = scrollRef.current;
    if (!element) return;
    nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (nearBottom.current) setShowLatest(false);
  }

  function jumpToLatest() {
    nearBottom.current = true;
    setShowLatest(false);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }

  return <section aria-label="Hội thoại" className={`relative flex min-h-0 flex-col ${className}`}>
    <div ref={scrollRef} onScroll={updateScrollPosition} className={scrollable ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6" : "px-4 py-5 sm:px-6"}>
      <div className="mx-auto grid max-w-4xl gap-6">
        {opening && <AiMessage role={aiRole} hint={opening.hint} playLabel="Nghe phản hồi AI" onPlay={onPlayOpening}>{opening.reply}</AiMessage>}
        {turns.map(turn => <div key={turn.turnId} className="grid gap-5">
          <LearnerMessage role={learnerRole} turn={turn} onPlay={onPlayLearner ? () => onPlayLearner(turn) : undefined} />
          {(turn.reply || turn.hint) && <AiMessage role={aiRole} hint={turn.hint} playLabel="Nghe phản hồi AI" onPlay={onPlayAssistant ? () => onPlayAssistant(turn) : undefined}>{turn.reply ?? ""}</AiMessage>}
        </div>)}
        {liveContent}
      </div>
    </div>
    {scrollable && showLatest && <Button variant="outline" className="absolute bottom-4 left-1/2 min-h-11 -translate-x-1/2 rounded-full bg-white shadow-sm" onClick={jumpToLatest}>Cuộc trò chuyện mới nhất ↓</Button>}
  </section>;
}
