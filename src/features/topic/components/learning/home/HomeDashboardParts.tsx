import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CircleAlert, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components";
import type { FetchState } from "@shared/hooks/useFetch";
import { TopicProgressBar } from "@features/topic/components/learning/catalog/TopicState";

export type HomeQuery<T> = FetchState<T> & { refetch: () => void };

export function HomeAction({ to, children, primary = false }: { to: string; children: ReactNode; primary?: boolean }) {
  return <Button asChild variant={primary ? "default" : "secondary"} className="min-h-12 w-full shrink-0 rounded-xl px-5 sm:w-auto">
    <Link to={to}>{children}<ArrowRight aria-hidden="true" className="size-4" /></Link>
  </Button>;
}

export function HomeSection({ id, title, link, children }: {
  id: string; title: string; link?: { to: string; label: string }; children: ReactNode;
}) {
  return <section aria-labelledby={id} className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h2 id={id} className="text-headline-md font-semibold">{title}</h2>
      {link && <Link to={link.to} className="inline-flex min-h-12 items-center gap-2 text-label-lg font-semibold text-primary underline-offset-4 hover:underline">
        {link.label}<ArrowRight aria-hidden="true" className="size-4" />
      </Link>}
    </div>
    <Card className="rounded-2xl border-learning-outline bg-surface-container-lowest p-5 sm:p-6">{children}</Card>
  </section>;
}

export function HomeQueryState<T>({ query, label, children }: { query: HomeQuery<T>; label: string; children: (data: T) => ReactNode }) {
  if (query.loading) return <div role="status" aria-label={`Đang tải ${label}`} className="space-y-4 py-1">
    <span className="sr-only">Đang tải {label}…</span>
    <div aria-hidden="true" className="motion-safe:animate-pulse space-y-4">
      <div className="h-5 w-2/5 rounded bg-surface-container-high" />
      <div className="h-4 w-3/5 rounded bg-surface-container-high" />
      <div className="h-2 w-full rounded bg-surface-container-high" />
    </div>
  </div>;
  if (query.error || !query.data) return <div role="alert" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3"><CircleAlert aria-hidden="true" className="size-5 shrink-0 text-error" />
      <p className="text-body-md text-on-surface-variant">Không tải được {label}. Vui lòng thử lại.</p>
    </div>
    <Button variant="outline" className="min-h-12 shrink-0 rounded-xl" onClick={query.refetch}><RefreshCw aria-hidden="true" className="size-4" />Thử lại</Button>
  </div>;
  return children(query.data);
}

export function HomeEmpty({ icon: Icon, title, description, to, action, primary }: {
  icon: LucideIcon; title: string; description: string; to: string; action: string; primary?: boolean;
}) {
  return <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-start gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-learning-mint text-primary"><Icon aria-hidden="true" className="size-5" /></span>
      <div className="min-w-0 space-y-1"><h3 className="text-headline-sm font-semibold">{title}</h3>
        <p className="max-w-2xl text-body-md text-on-surface-variant">{description}</p></div>
    </div>
    <HomeAction to={to} primary={primary}>{action}</HomeAction>
  </div>;
}

export function HomeBadge({ children, mint = false }: { children: ReactNode; mint?: boolean }) {
  return <span className={`inline-flex rounded-lg px-2.5 py-1 text-label-sm font-semibold ${mint ? "bg-learning-mint text-primary" : "bg-surface text-on-surface-variant"}`}>{children}</span>;
}

export function HomeProgress({ label, completed, total, suffix, percent }: {
  label: string; completed: number | null; total: number | null; suffix: string; percent?: number;
}) {
  const valid = completed !== null && total !== null && Number.isFinite(completed) && Number.isFinite(total) && completed >= 0 && total > 0;
  return <div className="space-y-2">
    <div className="flex flex-wrap justify-between gap-2 text-label-lg">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-semibold">{valid ? `${completed}/${total} ${suffix}` : "Chưa có dữ liệu tiến độ"}</span>
    </div>
    {valid && <TopicProgressBar label={label} percent={percent ?? 100 * completed / total} />}
  </div>;
}
