import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import type { SpeakingHistorySessionSummary, SpeakingSession } from "@features/speaking/types/speaking-v2.types";
import { speakingResultUrl } from "@features/speaking/utils/speaking-history-navigation";

type SessionRowItem = SpeakingSession | SpeakingHistorySessionSummary;
const lifecycle: Record<SessionRowItem["status"], string> = {
  INITIALIZING: "Đang chuẩn bị", ACTIVE: "Đang diễn ra", CLOSING: "Đang kết thúc", ENDED: "Đã kết thúc",
};
const assessment: Record<SessionRowItem["assessmentStatus"], string> = {
  PENDING: "Đang chờ đánh giá", FINALIZING: "Đang hoàn tất đánh giá", READY: "Đánh giá đầy đủ", PARTIAL: "Đánh giá một phần", UNAVAILABLE: "Chưa có đánh giá",
};

function durationLabel(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  if (seconds < 60) return `${seconds} giây nói`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} phút ${remainder} giây nói` : `${minutes} phút nói`;
}

export function SpeakingHistorySessionRow({ session, historyOrigin, onDelete }: {
  session: SessionRowItem; historyOrigin: string; onDelete: (session: SessionRowItem) => void;
}) {
  const scopeLabel = session.scope.type === "TOPIC_ITEM" ? "Luyện theo mục học" : "Luyện theo chủ đề";
  return <article className="grid gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-primary">{scopeLabel}{session.scope.type === "TOPIC_ITEM" ? ` · ${session.context.topicTitle}` : ""}</p>
      <h2 className="mt-1 break-words text-lg font-semibold">{session.context.title}</h2>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm leading-6 text-on-surface-variant">
        <time dateTime={session.createdAt}>{new Date(session.createdAt).toLocaleString("vi-VN")}</time>
        <span>{session.committedTurnCount} lượt hội thoại</span>
        <span>{durationLabel(session.speechDurationMs)}</span>
        <span>{lifecycle[session.status]}</span>
        <span>{assessment[session.assessmentStatus]}</span>
      </p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" className="min-h-12"><Link to={speakingResultUrl(session.sessionId, historyOrigin)}>Xem phiên</Link></Button>
      <Button variant="ghost" className="min-h-12" onClick={() => onDelete(session)}>Xóa</Button>
    </div>
  </article>;
}
