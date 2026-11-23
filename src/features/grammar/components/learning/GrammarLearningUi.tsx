import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Loading } from "@shared/components";
import { cn } from "@shared/utils";

export function GrammarName({ titleEn, titleVi }: { titleEn: string; titleVi: string }) {
  return <><span lang="en">{titleEn}</span>{" "}<span lang="vi" className="font-normal text-on-surface-variant">({titleVi})</span></>;
}

export function GrammarPage({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("mx-auto space-y-6 px-5 py-6 md:py-10", wide ? "max-w-5xl" : "max-w-3xl")}>
      {children}
    </div>
  );
}

export function GrammarBackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button asChild variant="ghost" className="-ml-3 min-h-12 rounded-xl text-label-lg font-semibold text-primary">
      <Link to={to}><ArrowLeft aria-hidden="true" />{children}</Link>
    </Button>
  );
}

export function GrammarLoading() {
  return (
    <div role="status" aria-busy="true" className="py-6 text-center">
      <Loading className="border-learning-mint border-t-primary" />
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}

export function GrammarLoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-learning-outline bg-white p-5">
      <p role="alert" className="text-body-md text-on-surface-variant">{message}</p>
      <Button onClick={retry} className="min-h-12 rounded-xl font-semibold">Thử lại</Button>
    </div>
  );
}

export function GrammarRouteNotice() {
  const { state } = useLocation();
  const message: unknown = state?.grammarNotice;
  if (typeof message !== "string") return null;
  return (
    <p role="status" className="rounded-2xl border border-learning-outline bg-white p-5 text-body-md text-on-surface-variant">
      {message}
    </p>
  );
}
