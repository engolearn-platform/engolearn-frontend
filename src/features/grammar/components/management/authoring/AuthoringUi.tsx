import type { ComponentProps, ReactNode } from "react";
import { ArrowRight, Check, EllipsisVertical, X } from "lucide-react";
import { Link } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { cn } from "@shared/utils";
import { EntryButton, EntryFooter, EntryHeader, EntryStatus, EntrySteps, grammarEntryPage } from "@features/grammar/components/management/GrammarEntryUi";
import type { AuthoringStep } from "@features/grammar/hooks/useGrammarAuthoring";
import type { GrammarLesson, GrammarTopic } from "@features/grammar/types/grammar-content.types";

export const optionClass = "rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm [overflow-wrap:anywhere]";
export { EntryButton as ActionButton };

export function ActionLink({ to, children, disabled, primary = false, size }: {
  to: string; children: ReactNode; disabled?: boolean; primary?: boolean;
  size?: ComponentProps<typeof EntryButton>["size"];
}) {
  const variant = primary ? "default" : "outline";
  return disabled ? <EntryButton variant={variant} size={size} disabled>{children}</EntryButton> :
    <EntryButton variant={variant} size={size} asChild><Link to={to}>{children}</Link></EntryButton>;
}

export function ActionMenu({ trigger, label, align = "right", children }: {
  trigger?: ReactNode; label: string; align?: "left" | "right"; children: ReactNode;
}) {
  return <details className="relative shrink-0" onBlur={(event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }} onKeyDown={(event) => {
    if (event.key !== "Escape" || !event.currentTarget.open) return;
    event.currentTarget.open = false;
    event.currentTarget.querySelector("summary")?.focus();
    event.stopPropagation();
  }}>
    <summary aria-label={label} className={cn(
      "flex min-h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-lg px-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden",
      trigger ? "bg-primary-container text-on-primary hover:bg-primary" : "border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low",
    )}>{trigger ?? <><EllipsisVertical className="size-4" aria-hidden /><span>Khác</span></>}</summary>
    <div className={cn("absolute top-full z-20 mt-1 grid min-w-44 gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest p-1 shadow-sm",
      align === "right" ? "right-0" : "left-0")}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("button:not(:disabled),a")) {
          const menu = event.currentTarget.closest("details");
          if (menu) menu.open = false;
        }
      }}>
      {children}
    </div>
  </details>;
}

export const menuItemClass = "block w-full whitespace-nowrap rounded-md px-3 py-2 text-left hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary disabled:text-outline disabled:hover:bg-transparent";

export function Badge({ tone = "neutral", children }: {
  tone?: "neutral" | "success" | "warning" | "archived"; children: ReactNode;
}) {
  const colors = {
    neutral: "bg-surface-container-high text-on-surface-variant",
    success: "bg-learning-mint text-primary",
    warning: "bg-learning-note text-learning-note-ink",
    archived: "border border-outline-variant bg-surface-container-lowest text-on-surface-variant",
  };
  return <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", colors[tone])}>{children}</span>;
}

export function LessonStatus({ lesson }: { lesson: GrammarLesson }) {
  return <EntryStatus status={lesson.status === "DRAFT" && lesson.ready ? "READY" : lesson.status} />;
}

export function TopicStatus({ topic }: { topic: GrammarTopic }) {
  return <EntryStatus status={topic.status} />;
}

export function ReportError({ error, retry }: { error?: string | null; retry?: () => void }) {
  return error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-error">
    <span>{error}</span>
    {retry && <EntryButton type="button" variant="outline" onClick={retry}>Tải lại dữ liệu</EntryButton>}
  </div>;
}

export function LoadingView({ loading, error, retry }: { loading: boolean; error?: string | null; retry: () => void }) {
  return <div className="p-5 md:p-7">
    {loading ? <p role="status" className="text-on-surface-variant">Đang tải…</p> :
      <ReportError error={error ?? "Không tìm thấy dữ liệu."} retry={retry} />}
  </div>;
}

export function AuthoringPage({ title, subtitle, badge, action, context, current, steps, locked, children, footer }: {
  title: string; subtitle: string; badge: ReactNode; action?: ReactNode; context?: ReactNode;
  current: number; locked?: boolean; steps: AuthoringStep[]; children: ReactNode; footer: ReactNode;
}) {
  return <div className={grammarEntryPage}>
    <div className="flex-1 pb-8">
      <EntryHeader title={title} description={subtitle} badge={badge} actions={action} />
      {context && <div className="mb-3 text-xs text-on-surface-variant">{context}</div>}
      <EntrySteps current={current} steps={steps.map(({ label, to }) => ({ label, href: locked ? undefined : to }))} />
      <div className="grid gap-4">{children}</div>
    </div>
    {footer}
  </div>;
}

export function LessonContext({ topic, lesson }: { topic: GrammarTopic; lesson: GrammarLesson }) {
  return <>{topic.titleVi} <span aria-hidden="true">›</span> {lesson.order != null && "Bài " + String(lesson.order).padStart(2, "0") + " — "}{lesson.titleVi}</>;
}

export function AuthoringFooter({ backTo, backLabel, nextTo, nextLabel, busy, status, children }: {
  backTo: string; backLabel: string; nextTo?: string; nextLabel?: string; busy?: boolean; status?: string; children?: ReactNode;
}) {
  return <EntryFooter back={backTo} backLabel={backLabel} busy={busy} status={status} next={<>
      {nextTo && nextLabel && <ActionLink to={nextTo} disabled={busy} primary>{nextLabel}<ArrowRight aria-hidden /></ActionLink>}
      {children}
  </>} />;
}

export function ReviewChecks({ checks }: { checks: { label: string; passed: boolean; detail?: string | null }[] }) {
  return <ul className="divide-y divide-outline-variant">
    {checks.map(({ label, passed, detail }, index) => <li key={label + index} className="flex gap-2 py-2.5">
      {passed ? <Check aria-hidden className="mt-0.5 size-4 flex-none text-primary" /> :
        <X aria-hidden className="mt-0.5 size-4 flex-none text-error" />}
      <div className="min-w-0 break-words">
        <span className="sr-only">{passed ? "Đạt. " : "Chưa đạt. "}</span>{label}
        {detail && <p className={cn("mt-0.5 text-xs", passed ? "text-on-surface-variant" : "text-error")}>{detail}</p>}
      </div>
    </li>)}
  </ul>;
}

export function ConfirmAction({ open, title, description, confirm, busy, error, destructive, onClose, onConfirm, retry }: {
  open: boolean; title: string; description: string; confirm: string; busy: boolean; error?: string | null;
  destructive?: boolean; onClose: () => void; onConfirm: () => void; retry?: () => void;
}) {
  return <Dialog open={open} onOpenChange={(value) => { if (!value && !busy) onClose(); }}>
    <DialogContent className="bg-surface-container-lowest" showCloseButton={false}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <ReportError error={error} retry={retry} />
      <DialogFooter>
        <EntryButton variant="outline" disabled={busy} onClick={onClose}>Hủy</EntryButton>
        <EntryButton variant={destructive ? "destructive" : "default"} disabled={busy} onClick={onConfirm}>{busy ? "Đang xử lý…" : confirm}</EntryButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

