import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@shared/hooks/useAuth";
import { ROUTES } from "@shared/constants";
import { Card } from "@shared/components/Card";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";

export function AssessmentGate() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isLoading) return <p className="p-5" role="status">Đang xác minh tài khoản…</p>;
  if (auth.error) return <div className="p-5"><AssessmentError message={auth.error} retry={auth.refetch} /></div>;
  if (!auth.isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  return <Outlet key={auth.identityGeneration} />;
}
export function AssessmentCard({children, className = ""}: {children: ReactNode; className?: string}) {
  return <Card className={`rounded-2xl border-learning-outline bg-white p-5 ${className}`}>{children}</Card>;
}
export function AssessmentError({message, retry}: {message: string; retry?: () => void}) {
  return <div role="alert" className="rounded-xl border border-error p-4 text-error"><p>{message}</p>{retry && <Button variant="outline" className="mt-3 h-12" onClick={retry}>Thử lại</Button>}</div>;
}
export function DevelopmentNotice({show}: {show: boolean}) {
  return show ? <p className="rounded-xl bg-learning-note p-3 text-sm text-learning-note-ink">Môi trường phát triển: đề, âm thanh và dữ liệu đầu vào đang dùng mẫu để review.</p> : null;
}
export function Confirmation({open, title, description, busy, onCancel, onConfirm}: {
  open: boolean; title: string; description: string; busy: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return <Dialog open={open} onOpenChange={value => {if (!value && !busy) onCancel();}}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><Button className="h-12" variant="outline" disabled={busy} onClick={onCancel}>Quay lại</Button><Button className="h-12" disabled={busy} onClick={onConfirm}>{busy ? "Đang xử lý…" : "Xác nhận"}</Button></DialogFooter></DialogContent></Dialog>;
}
