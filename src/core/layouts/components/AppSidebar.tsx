import { cn } from "@shared/utils";
import { BookOpenText } from "lucide-react";
import { NavLink } from "react-router";
import { APP_NAV_ITEMS, PROFILE_NAV_ITEM } from "./appNav";

export default function AppSidebar() {
  return (
    <aside className="z-10 hidden h-full w-64 flex-col border-r border-outline-variant bg-surface-container-low md:flex">
      <div className="flex items-center gap-2 border-b border-outline-variant p-5">
        <BookOpenText className="size-7 text-primary" aria-hidden="true" />
        <span className="text-headline-md font-semibold text-primary">
          EngoLearn
        </span>
      </div>
      <nav
        aria-label="Điều hướng chính"
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-6"
      >
        {APP_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-label-lg transition-colors",
                isActive
                  ? "bg-primary-container font-semibold text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )
            }
          >
            <item.icon className="size-5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-outline-variant p-5">
        <NavLink
          to={PROFILE_NAV_ITEM.to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-label-lg transition-colors",
              isActive
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )
          }
        >
          <PROFILE_NAV_ITEM.icon
            className="size-5 shrink-0"
            aria-hidden="true"
          />
          <span>{PROFILE_NAV_ITEM.label}</span>
        </NavLink>
      </div>
    </aside>
  );
}
