import { cn } from "@shared/utils";
import { NavLink } from "react-router";
import { LEARNING_NAV_ITEMS, PROFILE_NAV_ITEM } from "./learningNav";

const ITEMS = [...LEARNING_NAV_ITEMS, PROFILE_NAV_ITEM];

export default function LearningBottomNav() {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed bottom-0 z-50 flex w-full items-center justify-around border-t border-outline-variant bg-surface py-2 pb-safe shadow-[0_-4px_20px_rgba(10,25,47,0.05)] md:hidden"
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex w-16 flex-col items-center justify-center rounded-lg p-2 transition-colors",
              isActive
                ? "scale-110 font-bold text-primary"
                : "text-on-surface-variant opacity-40 hover:bg-surface-container-low"
            )
          }
        >
          <item.icon className="mb-1 size-6" aria-hidden="true" />
          <span className="text-label-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
