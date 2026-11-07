import { ArrowRight, ChartNoAxesColumn, ClipboardList, GraduationCap, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";
import type { MyTopicPageDto } from "@features/topic/types/topic-api.types";
import { Card } from "@shared/components";
import { ROUTES } from "@shared/constants";
import { useFetch } from "@shared/hooks";
import type { FetchState } from "@shared/hooks/useFetch";

type Query<T> = FetchState<T> & { refetch: () => void };

export interface HomePathSummary {
  id: string;
  title: string;
  currentWeek: number | null;
  totalWeeks: number;
  openDays: { number: number; status: string }[];
  progress: { answered: number; assigned: number } | null;
}

export interface HomeOverviewSources {
  loadActivePath: (signal: AbortSignal) => Promise<HomePathSummary | null>;
  loadMonthlyAssessments: (signal: AbortSignal) => Promise<number>;
}

function OverviewCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <Card className="flex h-full flex-col gap-4 rounded-2xl border-learning-outline bg-surface-container-lowest p-5">
      <h3 className="flex items-center gap-3 text-headline-sm font-semibold">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-learning-mint text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {title}
      </h3>
      {children}
    </Card>
  );
}

function QueryNotice({ query, label }: { query: Query<unknown>; label: string }) {
  if (query.loading) return <p role="status" className="text-label-lg text-on-surface-variant">Đang tải {label}…</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p role="alert" className="text-label-lg text-on-surface-variant">Không tải được {label}.</p>
      <Button type="button" variant="outline" className="min-h-12 rounded-xl" onClick={query.refetch}>Thử lại</Button>
    </div>
  );
}

function OverviewLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline" className="mt-auto min-h-12 w-fit rounded-xl">
      <Link to={to}>{children}<ArrowRight aria-hidden="true" /></Link>
    </Button>
  );
}

const dayLabels: Record<string, string> = {
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Đã hoàn thành",
  SUBMITTED: "Đã nộp",
  CLOSED: "Đã đóng",
};

function PathCard({ loadActivePath }: Pick<HomeOverviewSources, "loadActivePath">) {
  const query = useFetch(loadActivePath);
  const path = query.data;
  return (
    <OverviewCard title="Lộ trình luyện tập" icon={Target}>
      {query.loading || query.error ? <QueryNotice query={query} label="lộ trình" /> : path ? (
        <div className="space-y-3">
          <p className="break-words font-semibold">{path.title}</p>
          {path.currentWeek !== null && (
            <p className="text-label-lg text-on-surface-variant">Tuần {path.currentWeek}/{path.totalWeeks}</p>
          )}
          {path.openDays.length > 0 && (
            <ul aria-label="Các ngày trong tuần đang mở" className="flex flex-wrap gap-2">
              {path.openDays.map(({ number, status }) => (
                <li key={number} className="rounded-lg border border-learning-outline bg-surface px-2 py-1 text-label-sm">
                  Ngày {number} · {dayLabels[status] ?? "Chưa rõ trạng thái"}
                </li>
              ))}
            </ul>
          )}
          {path.progress && <p className="text-label-lg text-on-surface-variant">Đã trả lời {path.progress.answered}/{path.progress.assigned} câu</p>}
        </div>
      ) : <p className="text-body-md text-on-surface-variant">Bạn chưa có lộ trình đang hoạt động.</p>}
      <OverviewLink to={path ? ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(path.id)) : ROUTES.LEARNING_PATHS}>Xem lộ trình</OverviewLink>
    </OverviewCard>
  );
}

function AssessmentCard({ loadMonthlyAssessments }: Pick<HomeOverviewSources, "loadMonthlyAssessments">) {
  const query = useFetch(loadMonthlyAssessments);
  return (
    <OverviewCard title="Đánh giá định kỳ" icon={ClipboardList}>
      {query.data === null ? <QueryNotice query={query} label="lịch sử đánh giá" /> : (
        <p className="text-body-md text-on-surface-variant">
          <strong className="text-headline-lg text-primary">{query.data}</strong> bài có kết quả trong tháng này
        </p>
      )}
      <OverviewLink to="/assessment/history">Lịch sử đánh giá</OverviewLink>
    </OverviewCard>
  );
}

export function HomeProgressOverview({ topics, loadActivePath, loadMonthlyAssessments }: HomeOverviewSources & { topics: Query<MyTopicPageDto> }) {
  const viewer = useFetch(topicCatalogService.viewer);
  const counts = topics.data?.counts;
  return (
    <section aria-labelledby="home-overview-title" className="space-y-3">
      <h2 id="home-overview-title" className="text-headline-md font-semibold">Tổng quan tiến độ</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <OverviewCard title="Tiến độ học tập" icon={ChartNoAxesColumn}>
          {counts ? (
            <dl className="grid grid-cols-2 gap-3">
              <div className="space-y-1 rounded-xl bg-surface p-3">
                <dt className="text-label-lg text-on-surface-variant">Chủ đề đang học</dt>
                <dd className="text-headline-lg font-bold text-primary">{counts.inProgress}</dd>
              </div>
              <div className="space-y-1 rounded-xl bg-surface p-3">
                <dt className="text-label-lg text-on-surface-variant">Chủ đề đã hoàn thành</dt>
                <dd className="text-headline-lg font-bold text-primary">{counts.completed}</dd>
              </div>
            </dl>
          ) : <QueryNotice query={topics} label="tiến độ chủ đề" />}
          <OverviewLink to={ROUTES.MY_TOPICS}>Chủ đề của tôi</OverviewLink>
        </OverviewCard>
        <OverviewCard title="Trình độ hiện tại" icon={GraduationCap}>
          {viewer.data ? (
            <div className="space-y-1">
              <p className="text-headline-lg font-bold text-primary">{viewer.data.cefrLevel ?? "Chưa có mức học"}</p>
              <p className="text-label-lg text-on-surface-variant">Mức học trong hồ sơ</p>
            </div>
          ) : <QueryNotice query={viewer} label="mức học" />}
        </OverviewCard>
        <PathCard loadActivePath={loadActivePath} />
        <AssessmentCard loadMonthlyAssessments={loadMonthlyAssessments} />
      </div>
    </section>
  );
}
