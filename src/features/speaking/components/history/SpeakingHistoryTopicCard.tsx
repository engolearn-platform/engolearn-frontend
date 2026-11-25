import { BookOpen } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import type { SpeakingHistoryTopic } from "@features/speaking/types/speaking-v2.types";
import { speakingHistoryUrl } from "@features/speaking/utils/speaking-history-navigation";

const statusLabels: Record<SpeakingHistoryTopic["learningStatus"], string> = {
  IN_PROGRESS: "Đang học", COMPLETED: "Hoàn thành", NOT_STARTED: "Chưa bắt đầu", UNKNOWN: "Chưa xác định",
};

export function SpeakingHistoryTopicCard({ topic, origin }: { topic: SpeakingHistoryTopic; origin: string }) {
  const parentUrl = speakingHistoryUrl({ kind: "parent", topicId: topic.topicId, page: 0, origin });
  const unknown = topic.learningStatus === "UNKNOWN";
  return <article className="grid min-w-0 grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
    <div className="flex aspect-[16/7] items-center justify-center overflow-hidden bg-surface-dim/30">
      {topic.coverUrl ? <img src={topic.coverUrl} alt="" className="size-full object-cover" loading="lazy" /> : <BookOpen aria-hidden="true" className="size-8 text-primary" />}
    </div>
    <div className="grid content-start gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary">{statusLabels[topic.learningStatus]}{topic.level ? ` · ${topic.level}` : ""}</p>
        <h3 className="mt-1 break-words text-lg font-semibold">{topic.title ?? "Chủ đề không còn hiển thị"}</h3>
      </div>
      <p className="text-sm leading-6 text-on-surface-variant">
        {topic.sessionCount} phiên · Lần gần nhất {new Date(topic.latestSessionCreatedAt).toLocaleDateString("vi-VN")}
      </p>
      {topic.learningProgress && !unknown && <p className="text-sm text-on-surface-variant">
        {topic.learningProgress.completedItemCount}/{topic.learningProgress.totalItemCount} mục học hoàn thành · {topic.learningProgress.percent}%
      </p>}
      <Button asChild variant="outline" className="min-h-12 w-fit"><Link to={parentUrl} aria-label={`Xem ${topic.title ?? "lịch sử chủ đề"}`}>
        Xem lịch sử phiên
      </Link></Button>
    </div>
  </article>;
}
