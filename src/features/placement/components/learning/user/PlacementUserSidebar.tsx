import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { ROUTES } from "@shared/constants";
import { cn } from "@shared/utils";
import { BookOpenText, ClipboardCheck, GraduationCap, Home, LayoutGrid, RotateCcw, UserRound } from "lucide-react";
import { Link } from "react-router";

const items = [
  { label: "Trang chủ", to: ROUTES.HOME, icon: Home },
  { label: "Chủ đề", to: ROUTES.TOPICS, icon: LayoutGrid },
  { label: "Ngữ pháp", to: ROUTES.GRAMMAR, icon: BookOpenText },
  { label: "Ôn tập", icon: RotateCcw },
] as const;

export default function PlacementUserSidebar({ mobile, onNavigate }: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <aside className={cn(
      "flex w-60 shrink-0 flex-col border-r border-outline-variant/50 bg-surface-container-low",
      mobile ? "h-full" : "hidden min-h-screen lg:flex",
    )}>
      <Link to={PLACEMENT_ROUTES.ROOT} onClick={onNavigate} className="flex h-16 items-center gap-3 border-b border-outline-variant/50 px-5" aria-label="EngoLearn — Kiểm tra trình độ">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-container text-on-primary">
          <GraduationCap className="size-5" aria-hidden="true" />
        </span>
        <span className="text-headline-sm font-bold tracking-tight text-primary">EngoLearn</span>
      </Link>
      <nav aria-label="Điều hướng học tập" className="flex flex-1 flex-col gap-1.5 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          return "to" in item ? (
            <Link key={item.label} to={item.to} onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-lg text-on-surface-variant hover:bg-surface-container-high">
              <Icon className="size-5" aria-hidden="true" />{item.label}
            </Link>
          ) : (
            <span key={item.label} aria-disabled="true" title="Sắp ra mắt" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-label-lg text-on-surface-variant/60">
              <Icon className="size-5" aria-hidden="true" />{item.label}
            </span>
          );
        })}
        <Link to={PLACEMENT_ROUTES.ROOT} onClick={onNavigate} aria-current="page" className="flex items-center gap-3 rounded-xl bg-primary-container px-3 py-2.5 text-label-lg font-semibold text-on-primary shadow-sm">
          <ClipboardCheck className="size-5" aria-hidden="true" />Kiểm tra trình độ
        </Link>
      </nav>
      <div className="border-t border-outline-variant/50 p-3">
        <Link to={ROUTES.PROFILE} onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-lg text-on-surface-variant hover:bg-surface-container-high">
          <UserRound className="size-5" aria-hidden="true" />Cá nhân
        </Link>
      </div>
    </aside>
  );
}
