import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { AlertCircle, ArrowRight, Check, RefreshCw } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components/Card";
import { useAuth } from "@shared/hooks/useAuth";
import type { NormalizedError } from "@shared/hooks/useFetch";
import type { PlanBenefit } from "@features/subscription/types/subscription.types";

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={`rounded-2xl border-border bg-card p-5 shadow-none ${className}`}>{children}</Card>;
}
export function SubscriptionPage({ usage = false, title, description, children }: { usage?: boolean; title?: string; description?: string; children: ReactNode }) {
  return <div className="mx-auto max-w-7xl space-y-8 p-5 pb-28 md:space-y-10 md:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl space-y-3"><p className="text-label-sm font-semibold uppercase tracking-wide text-primary">Tài khoản & dịch vụ</p><h1 className="text-headline-lg font-bold">{title ?? (usage ? "Hạn mức sử dụng" : "Gói học")}</h1><p className="text-body-md leading-relaxed text-on-surface-variant">{description ?? (usage ? "Theo dõi lượng đã dùng và kỳ hạn mức tiếp theo." : "Chọn gói phù hợp với bạn.")}</p></div>
    </header>
    {children}
  </div>;
}
export function LoadingState({ label = "Đang tải dữ liệu…" }: { label?: string }) {
  return <Surface><p role="status" className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="size-5 animate-spin" aria-hidden="true" />{label}</p></Surface>;
}
export function Unavailable({ error, retry }: { error: NormalizedError; retry: () => void }) {
  const auth = useAuth();
  const denied = error.status === 401 || error.status === 403;
  const description = error.code ? error.message : denied ? "Vui lòng kiểm tra lại phiên đăng nhập để tiếp tục." : "Chưa thể nhận dữ liệu hợp lệ từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.";
  return <Surface><div role="alert" className="space-y-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><AlertCircle className="size-5 text-destructive" aria-hidden="true" />{denied ? "Không thể truy cập thông tin tài khoản" : "Chưa thể tải dữ liệu"}</h2><p className="break-words leading-6 text-muted-foreground">{description}</p>{error.code && <p className="text-sm text-muted-foreground">Mã: {error.code}</p>}<Button variant="outline" className="min-h-12 rounded-xl" onClick={denied ? auth.refetch : retry}><RefreshCw aria-hidden="true" />Thử lại</Button></div></Surface>;
}
export function PrivateAccount({ children }: { children: (userId: string) => ReactNode }) {
  const auth = useAuth();
  if (auth.isLoading) return <LoadingState label="Đang xác định tài khoản…" />;
  if (auth.error) return <Unavailable error={{ message: auth.error }} retry={auth.refetch} />;
  if (!auth.user) return <Surface><h2 className="text-lg font-semibold">Đăng nhập để xem thông tin của bạn</h2><p className="mt-2 leading-6 text-muted-foreground">Cần đăng nhập để kiểm tra quyền lợi, điều kiện dùng thử và hạn mức cá nhân.</p><Button variant="outline" className="mt-4 min-h-12 rounded-xl" onClick={auth.refetch}>Kiểm tra lại đăng nhập</Button></Surface>;
  return <div key={`${auth.identityGeneration}:${auth.user.id}`}>{children(auth.user.id)}</div>;
}
export function Benefits({ items }: { items: PlanBenefit[] }) {
  if (items.length === 0) return <p className="text-muted-foreground">Chưa có quyền lợi được công bố.</p>;
  return <ul className="space-y-5">{[...items].sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code)).map(b => <li key={b.code} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" /><p className="min-w-0 break-words leading-relaxed">{b.title}{b.displayValue && <span className="ml-2 font-semibold text-primary">{b.displayValue}</span>}</p></li>)}</ul>;
}
export function DateTime({ value }: { value: string }) {
  return <time dateTime={value}>{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value))}</time>;
}
export function UsageLink() {
  return <Button asChild variant="outline" className="min-h-12 rounded-xl text-primary"><NavLink to="/subscription/usage">Xem hạn mức<ArrowRight aria-hidden="true" /></NavLink></Button>;
}
