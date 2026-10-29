import { useLocation, useSearchParams, Link } from "react-router";
import { Clock3 } from "lucide-react";
import { useTopicViewer } from "@features/topic/hooks/topic-viewer.context";
import { useTopicCatalog } from "@features/topic/hooks/useTopicCatalog";
import { TopicGridResults } from "@features/topic/components/learning/catalog/TopicGrid";
import { TopicState } from "@features/topic/components/learning/catalog/TopicState";
import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";

function MyTopicsList({ status }: { status: "IN_PROGRESS" | "COMPLETED" }) {
  const result = useTopicCatalog({}, status);
  const location = useLocation();
  const [, setParameters] = useSearchParams();
  const counts = result.page && "counts" in result.page ? result.page.counts : null;
  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/60">
      <div className="flex gap-6" role="group" aria-label="Nhóm chủ đề">
        {([{ status: "IN_PROGRESS", label: "Đang học", count: counts?.inProgress }, { status: "COMPLETED", label: "Đã hoàn thành", count: counts?.completed }] as const).map(tab =>
          <button key={tab.status} type="button" aria-pressed={status === tab.status} onClick={() => setParameters(tab.status === "COMPLETED" ? { tab: "completed" } : {})}
            className={"flex min-h-14 items-center gap-2 border-b-2 px-1 text-label-lg font-semibold " + (status === tab.status ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary")}>
            {tab.label}<span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-label-sm">{tab.count ?? "…"}</span>
          </button>)}
      </div>
      <span className="mb-2 inline-flex items-center gap-2 text-label-sm text-on-surface-variant"><Clock3 className="size-4" aria-hidden="true" />Lần truy cập gần nhất</span>
    </div>
    <TopicGridResults result={result} origin={location.pathname + location.search} learner status={status} />
  </div>;
}
export default function MyTopicsView() {
  const viewer = useTopicViewer();
  const [parameters] = useSearchParams();
  const status = parameters.get("tab") === "completed" ? "COMPLETED" : "IN_PROGRESS";
  return <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-8 md:py-10">
    <div className="space-y-3"><h1 className="text-headline-lg font-bold">Chủ đề của tôi</h1><p className="text-body-md text-on-surface-variant">Tiếp tục các chủ đề đang học và xem lại những chủ đề bạn đã hoàn thành.</p></div>
    {viewer.kind === "GUEST" ? <TopicState title="Đăng nhập để xem Chủ đề của tôi" description="Sau khi đăng nhập, bạn có thể bắt đầu học và quay lại tiến độ đã lưu.">
      <Button asChild variant="outline" className="mt-5 min-h-12 rounded-xl"><Link to={ROUTES.TOPICS}>Khám phá chủ đề</Link></Button>
    </TopicState> : <MyTopicsList key={viewer.learnerId + ":" + status} status={status} />}
  </div>;
}
