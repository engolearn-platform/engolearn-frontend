import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/core/components/shadcn/dialog";
import { cn } from "@shared/utils";

export const managementInputClass = "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:bg-surface-container-low disabled:text-on-surface-variant";
export function ManagementButton({ className, variant, ...props }: ComponentProps<typeof Button>) {
  return <Button {...props} variant={variant} className={cn("min-h-12 rounded-xl px-4 font-semibold", !variant || variant === "default" ? "bg-primary text-on-primary hover:bg-primary-container" : "text-primary", className)} />;
}
export function ManagementCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-outline-variant bg-surface-container-lowest p-5", className)}>{children}</section>;
}
export function ManagementHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-start"><div><h1 className="text-headline-lg font-bold text-on-surface">{title}</h1>{description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}</div><div className="flex flex-wrap gap-2">{children}</div></div>;
}
export function ManagementBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "error" }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-label-sm font-semibold", tone === "success" ? "bg-learning-mint text-primary" : tone === "warning" ? "bg-learning-note text-learning-note-ink" : tone === "error" ? "bg-error/10 text-error" : "bg-surface-container-low text-on-surface-variant")}>{children}</span>;
}
export function ManagementField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="flex min-w-0 flex-col gap-2 text-label-lg font-medium text-on-surface">{label}{children}{hint && <span className="text-label-sm font-normal text-on-surface-variant">{hint}</span>}</label>;
}
export function ManagementEmpty({ title, description }: { title: string; description?: string }) {
  return <div className="px-5 py-12 text-center"><h2 className="text-title-md font-semibold">{title}</h2>{description && <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>}</div>;
}
export function ManagementMissing({ backTo, label = "Quay lại" }: { backTo: string; label?: string }) {
  return <ManagementCard><ManagementEmpty title="Không tìm thấy dữ liệu" description="Mục này có thể đã được thay đổi hoặc không còn tồn tại." /><Link to={backTo} className="font-semibold text-primary underline">{label}</Link></ManagementCard>;
}
export function ManagementConfirm({ open, title, description, busy, onClose, onConfirm, confirmLabel = "Xác nhận" }: { open: boolean; title: string; description: string; busy: boolean; onClose: () => void; onConfirm: () => void; confirmLabel?: string }) {
  return <Dialog open={open} onOpenChange={(value) => { if (!value && !busy) onClose(); }}><DialogContent className="bg-surface-container-lowest"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><ManagementButton variant="outline" disabled={busy} onClick={onClose}>Hủy</ManagementButton><ManagementButton disabled={busy} onClick={onConfirm}>{busy ? "Đang xử lý…" : confirmLabel}</ManagementButton></DialogFooter></DialogContent></Dialog>;
}
