import { cn } from "@shared/utils";
import { Flame, UserRound } from "lucide-react";
import { NavLink } from "react-router";
import {
  BRAND_ICON,
  LEARNING_NAV_ITEMS,
  PROFILE_NAV_ITEM,
  type LearningNavItem,
} from "./learningNav";

function NavigationItem({ item }: { item: LearningNavItem }) {
  const content = (
    <>
      <item.icon className="size-5 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </>
  );

  if (item.disabled || !item.to) {
    return (
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3.5 rounded-[12px] px-4 py-3 text-[15px] leading-[22.5px] text-on-surface-variant"
      >
        {content}
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3.5 rounded-[12px] px-4 py-3 text-[15px] leading-[22.5px] font-medium transition-colors duration-150",
          item.to === PROFILE_NAV_ITEM.to && "py-[10.5px]",
          isActive
            ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/10"
            : "text-on-surface-variant hover:bg-surface-container-high",
        )
      }
    >
      {content}
    </NavLink>
  );
}

export default function LearningSidebar({ profile }: { profile?: { name: string; level: string | null } } = {}) {
  const BrandIcon = BRAND_ICON;

  return (
    <aside className="z-10 hidden h-full w-[300px] shrink-0 flex-col border-r border-outline-variant/60 bg-surface-container-lowest lg:flex">
      <div className="flex h-[88px] shrink-0 items-center gap-3 border-b border-outline-variant/60 px-6">
        <span className="flex size-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
          <BrandIcon className="size-5" aria-hidden="true" />
        </span>

        <span className="text-[22px] leading-[33px] font-bold tracking-tight text-primary">
          EngoLearn
        </span>
      </div>

      <nav
        aria-label="Điều hướng chính"
        className="flex flex-1 flex-col gap-[6px] overflow-y-auto px-6 py-2"
      >
        {LEARNING_NAV_ITEMS.map((item) => (
          <NavigationItem key={item.label} item={item} />
        ))}
      </nav>

      <div className="space-y-4 border-t border-outline-variant/60 px-6 pt-[25px] pb-6">
        {profile ? <div className="flex items-center gap-3 rounded-xl bg-surface p-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"><UserRound className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-label-lg font-semibold">{profile.name}</p><p className="text-label-sm text-on-surface-variant">{profile.level ? "Level CEFR" : "Chưa đăng nhập"}</p></div>{profile.level && <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm font-semibold text-on-secondary-container">{profile.level}</span>}</div> : <div className="flex items-center justify-between rounded-[12px] border border-outline-variant/60 bg-surface px-3.5 py-[14px] text-[14px] leading-[21px] font-semibold text-on-surface-variant">
          <span className="flex items-center gap-2.5">
            <Flame
              className="size-[16.5px] text-amber-500"
              fill="currentColor"
              aria-hidden="true"
            />
            Streak
          </span>

          <span className="text-on-surface">7 Ngày</span>
        </div>}

        <NavigationItem item={PROFILE_NAV_ITEM} />
      </div>
    </aside>
  );
}
