import { cn } from "@shared/utils";
import { Languages } from "lucide-react";
import { NavLink } from "react-router";
import { ADMIN_CONTENT_NAV_ITEMS, ADMIN_SYSTEM_NAV_ITEMS } from "./adminNav";

export default function AdminSidebar() {
  return (
    <aside className="z-10 hidden h-full w-72 shrink-0 flex-col justify-between bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
      <div className="flex flex-col">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary">
            <Languages className="size-5 text-on-primary" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-headline-sm font-semibold tracking-tight text-on-surface">
              EngoLearn
            </span>
            <span className="text-label-sm font-semibold tracking-wide text-primary uppercase">
              Content Studio
            </span>
          </span>
        </div>
        <p className="mt-4 px-5 text-label-sm tracking-wider text-on-surface-variant uppercase">
          Nội dung học
        </p>
        <nav aria-label="Quản trị nội dung học" className="mt-2 flex flex-col gap-2 px-5">
          {ADMIN_CONTENT_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-xl px-5 py-2 text-label-lg transition-all",
                  isActive
                    ? "bg-primary-container font-semibold text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                )
              }
            >
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="mt-6 px-5 text-label-sm tracking-wider text-on-surface-variant uppercase">
          Hệ thống
        </p>
        <nav aria-label="Quản trị hệ thống" className="mt-2 flex flex-col gap-2 px-5">
          {ADMIN_SYSTEM_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-xl px-5 py-2 text-label-lg transition-all",
                  isActive
                    ? "bg-primary-container font-semibold text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                )
              }
            >
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
          <span className="flex flex-col">
            <span className="text-label-sm font-semibold text-on-surface">
              Phiên bản Studio
            </span>
            <span className="text-label-sm text-on-surface-variant">
              v2.4.0 • Tiếng Việt
            </span>
          </span>
          <span className="size-2.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}
