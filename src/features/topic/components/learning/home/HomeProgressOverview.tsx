import { BookOpen, ClipboardCheck, GraduationCap, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@shared/components";
import { Button } from "@/core/components/shadcn/button";
import type { HomeDashboard } from "@features/topic/hooks/useHomeDashboard";

function Stat({ label, value, detail, icon: Icon, loading, failed, retry }: {
  label: string; value: string | number | undefined; detail?: string; icon: LucideIcon;
  loading: boolean; failed: boolean; retry: () => void;
}) {
  return <Card className="min-w-0 rounded-2xl border-learning-outline bg-surface-container-lowest p-5">
    <dl className="flex flex-col gap-3"><dt className="flex items-start justify-between gap-3 text-label-lg text-on-surface-variant"><span>{label}</span>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-learning-mint text-primary"><Icon aria-hidden="true" className="size-5" /></span></dt>
    {loading ? <dd role="status" aria-label={`Đang tải ${label}`} className="h-8 w-16 rounded bg-surface-container-high motion-safe:animate-pulse" />
      : <dd className="text-headline-lg font-bold text-primary">{failed ? "—" : value ?? "Chưa xác định"}</dd>}
    {failed ? <dd className="text-label-sm text-on-surface-variant"><p>Không tải được dữ liệu.</p><Button variant="link" className="min-h-12 p-0 text-label-sm" onClick={retry}>Thử lại</Button></dd>
      : <dd className="text-label-sm text-on-surface-variant">{loading ? "Đang cập nhật…" : detail}</dd>}
    </dl>
  </Card>;
}

export function HomeProgressOverview({ dashboard }: { dashboard: HomeDashboard }) {
  const { topics, grammar, paths, profile } = dashboard;
  return <div role="group" aria-label="Tổng quan tiến độ học tập" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
    <Stat label="Chủ đề đã hoàn thành" icon={ClipboardCheck} value={topics.data?.counts.completed} detail={topics.data ? `${topics.data.counts.inProgress} chủ đề đang học` : undefined} loading={topics.loading} failed={!!topics.error} retry={topics.refetch} />
    <Stat label="Bài ngữ pháp đã hoàn thành" icon={BookOpen} value={grammar.data?.counts.completedLessons} detail={grammar.data ? `${grammar.data.counts.inProgressLessons} bài đang học dở` : undefined} loading={grammar.loading} failed={!!grammar.error} retry={grammar.refetch} />
    <Stat label="Lộ trình đang hoạt động" icon={Target} value={paths.data?.counts.active} detail={paths.data?.currentPath?.currentWeekNo != null && paths.data.currentPath.totalWeeks != null ? `Tuần ${paths.data.currentPath.currentWeekNo}/${paths.data.currentPath.totalWeeks}` : "Luyện tập theo micro-skill"} loading={paths.loading} failed={!!paths.error} retry={paths.refetch} />
    <Stat label="Trình độ hồ sơ" icon={GraduationCap} value={profile.data?.cefrLevel} detail="Khung tham chiếu CEFR" loading={profile.loading} failed={!!profile.error} retry={profile.refetch} />
  </div>;
}
