import type { ReactNode } from "react";
import { BookOpen, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

export function TopicState({ title, description, loading = false, error = false, onRetry, children }: {
  title: string; description?: string; loading?: boolean; error?: boolean; onRetry?: () => void; children?: ReactNode;
}) {
  const Icon = loading ? LoaderCircle : error ? CircleAlert : BookOpen;
  return (
    <section role={error ? "alert" : "status"} className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-8 text-center">
      <Icon aria-hidden="true" className={"mx-auto mb-4 size-8 text-primary " + (loading ? "animate-spin" : "")} />
      <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-lg text-body-md text-on-surface-variant">{description}</p>}
      {onRetry && <Button type="button" variant="outline" className="mt-5 min-h-12 rounded-xl" onClick={onRetry}>Thử lại</Button>}
      {children}
    </section>
  );
}

export function TopicProgressBar({ percent, label }: { percent: number; label: string }) {
  const value = Math.min(100, Math.max(0, percent));
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-2 overflow-hidden rounded-full bg-surface-container-high">
    <div className="h-full rounded-full bg-primary transition-all" style={{ width: value + "%" }} />
  </div>;
}
