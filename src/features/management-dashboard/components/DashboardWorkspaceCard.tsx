import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

export function DashboardWorkspaceCard({ icon: Icon, title, description, to }: { icon: LucideIcon; title: string; description: string; to: string }) {
  return <Link to={to} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-learning-outline bg-white p-5 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
    <span className="rounded-xl bg-learning-mint p-3 text-primary"><Icon aria-hidden="true" className="size-5" /></span>
    <span className="min-w-0 flex-1"><span className="block font-semibold text-on-surface">{title}</span><span className="mt-1 block text-body-md text-on-surface-variant">{description}</span></span>
    <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-on-surface-variant group-hover:text-primary" />
  </Link>;
}
