import { Check, CircleAlert, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { SpeakingEndReason, SpeakingSession } from "@features/topic/types/speaking.types";
import { AchievementFireworks } from "./AchievementFireworks";
import { toAchievementSnapshot } from "./speakingAchievementAdapter";
import { summarizeAchievements } from "./speakingAchievementLogic";

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

function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return null;
  const seconds = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} phút ${seconds % 60} giây` : `${seconds} giây`;
}

export function SessionResultSummary({ session, celebrate, announce, onReplay, onTranscript, onTopic }: {
  session: SpeakingSession;
  celebrate: boolean;
  announce: boolean;
  onReplay: () => void;
  onTranscript: () => void;
  onTopic?: () => void;
}) {
  const snapshot = toAchievementSnapshot(session);
  const summary = summarizeAchievements(snapshot);
  const completed = session.status === "COMPLETED";
  const heading = completed
    ? summary.allGoalsMet ? "Bạn đã hoàn thành xuất sắc!" : "Bạn đã hoàn thành tình huống!"
    : "Phiên luyện tập đã kết thúc";
  const duration = formatDuration(session.startedAt, session.endedAt);

  return <section aria-label="Tổng kết phiên luyện nói" className={`relative mt-4 overflow-hidden rounded-2xl border p-4 sm:p-5 ${completed ? "border-primary-fixed-dim bg-primary-fixed/20" : "border-secondary-fixed bg-secondary-fixed/25"}`}>
    {celebrate && completed && summary.allGoalsMet && <AchievementFireworks major />}
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full ${completed ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"}`}>
        {completed ? <Sparkles size={20} /> : <CircleAlert size={20} />}
      </span>
      <div className="min-w-0"><h3 className="text-lg font-semibold">{heading}</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{completed ? "Kết quả đã được máy chủ xác nhận." : "Phiên chưa đủ điều kiện hoàn thành; kết quả đã chốt vẫn được lưu để xem lại."}</p>
        {announce && <p className="sr-only" aria-live="polite">{heading}</p>}
      </div>
    </div>
    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
      <p className="rounded-lg bg-white/70 px-3 py-2"><strong>{summary.requiredAchieved}/{summary.requiredTotal}</strong> mục tiêu Bắt buộc</p>
      <p className="rounded-lg bg-white/70 px-3 py-2"><strong>{summary.optionalAchieved}/{summary.optionalTotal}</strong> mục tiêu Tùy chọn</p>
      <p className="rounded-lg bg-white/70 px-3 py-2"><strong>{session.validTurnCount}/{session.content.minimumValidTurns}</strong> lượt nói hợp lệ</p>
      <p className="rounded-lg bg-white/70 px-3 py-2"><strong>{session.committedTurnCount}</strong> lượt đã chốt</p>
    </div>
    <ul className="mt-4 space-y-2 text-sm">{snapshot.goals.map(goal => <li key={goal.id} className="rounded-lg border border-outline-variant/50 bg-white/55 px-3 py-2">
      <p className="flex items-center gap-2 font-medium">{goal.achieved ? <Check aria-hidden="true" size={16} className="text-primary" /> : <span aria-hidden="true" className="size-4 rounded-full border border-outline" />}
        {goal.title} <span className="text-xs font-normal text-on-surface-variant">· {goal.required ? "Bắt buộc" : "Tùy chọn"}</span>
      </p>
      {goal.evidenceQuote && <p className="mt-1 pl-6 text-on-surface-variant">“{goal.evidenceQuote}”{goal.evidenceTurnId ? ` · Lượt ${session.turns.find(turn => turn.id === goal.evidenceTurnId)?.sequence ?? ""}` : ""}</p>}
    </li>)}</ul>
    {(duration || session.endReason) && <p className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant"><Clock3 aria-hidden="true" size={16} />
      {duration && `Thời lượng: ${duration}`}{duration && session.endReason && " · "}{session.endReason && `Lý do kết thúc: ${endReasonLabels[session.endReason]}`}
    </p>}
    <div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={onReplay}>Luyện lại</Button>
      <Button type="button" variant="outline" size="sm" onClick={onTranscript}>Xem hội thoại</Button>
      {onTopic && <Button type="button" size="sm" onClick={onTopic}>Về chủ đề</Button>}
    </div>
  </section>;
}
