import type { ComponentProps, ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { ArrowLeft, Check, EllipsisVertical, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/shadcn/dialog";
import { cn } from "@shared/utils";
import { grammarEntryCard, statusLabels } from "@features/grammar/constants/management-entry";

export const grammarEntryPage = "flex min-h-full flex-col bg-surface-container-low px-5 text-sm text-on-surface lg:px-7";
export const grammarEntryInput =
  "w-full rounded-lg border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-primary aria-invalid:border-error disabled:cursor-not-allowed disabled:bg-surface-container-low";

const statusColors: Record<string, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant",
  IN_PROGRESS: "bg-learning-note text-learning-note-ink",
  READY: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  PUBLISHED: "bg-learning-mint text-primary",
  ARCHIVED: "border border-outline bg-surface-container-lowest text-on-surface",
};

export function EntryStatus({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", statusColors[status])}>{statusLabels[status] ?? status}</span>;
}

export function EntryButton({ className, variant = "default", ...props }: ComponentProps<typeof Button>) {
  return <Button {...props} variant={variant} className={cn(
    "min-h-9 rounded-lg font-semibold shadow-none",
    variant === "default" && "bg-primary-container text-on-primary hover:bg-primary disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:opacity-100",
    variant === "outline" && "border-outline bg-surface-container-lowest text-on-surface hover:bg-surface-container-low hover:text-on-surface",
    className,
  )} />;
}

export function EntryHeader({ title, description, status, badge, actions }: {
  title: string;
  description?: string;
  status?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-4 pb-4 pt-6 sm:flex-row sm:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
          {badge ?? (status ? <EntryStatus status={status} /> : null)}
        </div>
        {description ? <p className="mt-1 text-sm text-on-surface-variant">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function EntrySteps({ steps, current }: {
  steps: { label: string; href?: string; onClick?: () => void }[];
  current: number;
}) {
  return (
    <nav aria-label="Các bước biên soạn" className="mb-4">
      <ol className="grid grid-cols-2 gap-2 md:flex">
        {steps.map(({ label, href, onClick }, index) => {
          const active = index === current;
          const complete = index < current;
          const className = cn(
            "flex h-full w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary",
            active ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant",
            complete && "bg-learning-nav-active text-primary",
            !active && (href || onClick) && "hover:border-primary",
          );
          const content = <>{complete ? <Check aria-hidden="true" className="size-4 shrink-0" /> : <span aria-hidden="true">{index + 1}</span>} {label}</>;
          return (
            <li key={label} className="flex-1" aria-current={active ? "step" : undefined}>
              {onClick && !active ? <button type="button" className={className} onClick={onClick}>{content}</button> :
                href && !active ? <Link to={href} className={className}>{content}</Link> :
                <span className={className}>{content}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EntryFooter({ back, backLabel, onBack, status, next, busy }: {
  back: string;
  backLabel: string;
  onBack?: () => void;
  status?: ReactNode;
  next?: ReactNode;
  busy?: boolean;
}) {
  return (
    <footer className="sticky bottom-0 z-10 -mx-5 mt-auto grid grid-cols-[auto_1fr] items-center gap-2 border-t border-outline-variant/70 bg-surface-container-lowest px-5 py-3 [&_button]:h-auto [&_button]:min-h-9 [&_button]:whitespace-normal [&_a]:h-auto [&_a]:min-h-9 [&_a]:whitespace-normal md:grid-cols-[1fr_auto_1fr] lg:-mx-7 lg:px-7">
      <div className="justify-self-start">
        {onBack || busy ? <EntryButton type="button" variant="outline" onClick={onBack} disabled={busy}><ArrowLeft aria-hidden="true" /> {backLabel}</EntryButton> :
          <EntryButton asChild variant="outline"><Link to={back}><ArrowLeft aria-hidden="true" /> {backLabel}</Link></EntryButton>}
      </div>
      <div className="col-span-2 row-start-1 text-center text-xs text-on-surface-variant md:col-span-1 md:row-start-auto" role="status">{status}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 justify-self-end">{next}</div>
    </footer>
  );
}

export function EntryField({ label, id, required, count, hint, error, children }: {
  label: string;
  id: string;
  required?: boolean;
  count?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-semibold">{label} {required ? <span className="text-error" aria-hidden="true">*</span> : null}</label>
        {count ? <span className="text-xs tabular-nums text-on-surface-variant">{count}</span> : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-on-surface-variant" id={`${id}-hint`}>{hint}</p> : null}
      {error ? <p className="text-xs font-semibold text-error" id={`${id}-error`}>{error}</p> : null}
    </div>
  );
}

export function EntryChecklist({ title, rows }: { title: string; rows: { label: string; passed: boolean }[] }) {
  return (
    <aside className={cn(grammarEntryCard, "p-5")}>
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      <ul className="divide-y divide-outline-variant/40">
        {rows.map(({ label, passed }) => (
          <li className="flex items-center gap-2 py-2.5 text-sm" key={label}>
            {passed ? <Check className="size-4 shrink-0 text-primary" aria-label="Đạt" /> : <X className="size-4 shrink-0 text-error" aria-label="Chưa đạt" />}
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function EntryError({ message, onRetry, retryLabel = "Tải lại" }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-error/25 bg-error/5 px-3 py-2.5 text-sm text-error">
      <span>{message}</span>
      {onRetry ? <Button type="button" size="sm" variant="outline" onClick={onRetry}>{retryLabel}</Button> : null}
    </div>
  );
}

export function EntryTable({ label, headings, children }: { label: string; headings: string[]; children: ReactNode }) {
  return (
    <div className={cn(grammarEntryCard, "overflow-x-auto px-2 focus-visible:outline-2 focus-visible:outline-primary")} tabIndex={0} role="region" aria-label={label}>
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="border-b border-outline-variant/60 text-xs text-on-surface-variant">
          <tr>{headings.map((heading) => <th scope="col" className="px-3 py-2.5 font-semibold" key={heading}>
            <span>{heading}</span>
          </th>)}</tr>
        </thead>
        <tbody className="[&_td]:px-3 [&_td]:py-3.5 [&_tr+tr]:border-t [&_tr+tr]:border-learning-outline">{children}</tbody>
      </table>
    </div>
  );
}

export function EntryActions({ label, children }: { label: string; children: ReactNode }) {
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);

  function showActions() {
    const panel = menu.current;
    const control = trigger.current;
    if (!panel || !control) return;
    if (panel.matches(":popover-open")) {
      panel.hidePopover();
      return;
    }
    const anchor = control.getBoundingClientRect();
    panel.style.left = `${Math.max(8, anchor.right - 224)}px`;
    panel.style.top = `${anchor.bottom + 4}px`;
    panel.showPopover();
    if (anchor.bottom + panel.offsetHeight > window.innerHeight - 12) {
      panel.style.top = `${Math.max(8, anchor.top - panel.offsetHeight - 4)}px`;
    }
    panel.querySelector<HTMLElement>("a,button:not(:disabled)")?.focus();
  }

  return (
    <>
      <EntryButton ref={trigger} type="button" variant="outline" aria-label={label} aria-expanded={open} aria-controls={id}
        onClick={showActions} onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); showActions(); }
        }}>
        <EllipsisVertical aria-hidden="true" className="size-4" /><span>Khác</span>
      </EntryButton>
      <div id={id} ref={menu} popover="auto" className="fixed inset-auto m-0 w-56 rounded-lg border border-outline-variant bg-surface-container-lowest p-1 text-on-surface shadow-lg"
        onToggle={(event) => setOpen(event.currentTarget.matches(":popover-open"))}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.hidePopover();
            trigger.current?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target instanceof HTMLElement && event.target.closest("a,button")) {
            event.currentTarget.hidePopover();
            trigger.current?.focus();
          }
        }}>
        {children}
      </div>
    </>
  );
}

export const entryActionItem = "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";

export function EntryConfirmation({ title, description, confirmLabel, destructive, pending, retryDisabled, error, onClose, onConfirm }: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending: boolean;
  retryDisabled?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {error ? <EntryError message={error} /> : null}
        <DialogFooter>
          <Button variant="outline" type="button" disabled={pending} onClick={onClose}>Hủy</Button>
          <Button variant={destructive ? "destructive" : "default"} type="button" disabled={pending || retryDisabled} onClick={onConfirm}>{pending ? "Đang xử lý…" : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EntryTextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(grammarEntryInput, className)} {...props} />;
}
