import type { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
}

export function DashboardStatCard({ icon: Icon, label, value, detail }: DashboardStatCardProps) {
  return (
    <article className="flex min-h-40 flex-col rounded-2xl border border-learning-outline bg-white p-5">
      <div className="flex min-h-12 items-center gap-3 text-on-surface-variant">
        <span className="shrink-0 rounded-xl bg-learning-mint p-2 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <h3 className="text-label-lg font-semibold leading-5">{label}</h3>
      </div>
      <div className="mt-auto">
        <p className="text-headline-lg font-bold leading-9 text-primary">
          {value.toLocaleString("vi-VN")}
        </p>
        <p className="line-clamp-2 min-h-10 text-label-sm leading-5 text-on-surface-variant">
          {detail}
        </p>
      </div>
    </article>
  );
}
