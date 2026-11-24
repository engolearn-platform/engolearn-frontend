import { Bell, ChevronRight, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";
import { MANAGEMENT_CONTENT_NAV_ITEMS, MANAGEMENT_PLACEMENT_NAV_ITEMS, MANAGEMENT_SYSTEM_NAV_ITEMS } from "./managementNav";

interface ManagementTopBarProps {
  userName?: string;
  userRole?: string;
  title?: string;
  brand?: string;
}

export default function ManagementTopBar({
  userName,
  userRole,
  title,
  brand = "Môi trường biên tập",
}: ManagementTopBarProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sectionLabel = pathname.startsWith(ROUTES.ADMIN_GRAMMAR) ? "Quản lý Ngữ pháp" : "Quản lý chủ đề";
  const navigation = [
    { label: "Nội dung học", items: MANAGEMENT_CONTENT_NAV_ITEMS },
    ...(auth.isAdmin() ? [
      { label: "Placement Test", items: MANAGEMENT_PLACEMENT_NAV_ITEMS },
      { label: "Hệ thống", items: MANAGEMENT_SYSTEM_NAV_ITEMS },
    ] : []),
  ];
  const selected = navigation.flatMap(group => group.items)
    .filter(item => item.to === "/admin" ? pathname === item.to : pathname.startsWith(item.to))
    .sort((left, right) => right.to.length - left.to.length)[0]?.to ?? "";
  async function handleSignOut() {
    await auth.logout();
    await navigate(ROUTES.LOGIN, { replace: true });
  }
  return (
    <header className="sticky top-0 z-20 w-full shrink-0 bg-surface-container-lowest/90 px-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-2 sm:flex-nowrap sm:gap-3 sm:py-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-label-sm text-on-surface-variant">
          Trang quản trị
        </span>
        <ChevronRight className="size-4 shrink-0 text-outline-variant" aria-hidden="true" />
        <span className="truncate text-label-lg font-semibold text-on-surface">
          {title ?? sectionLabel}
        </span>
      </div>
      <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto lg:gap-4">
        <span className="hidden shrink-0 items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 xl:flex">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          <span className="text-label-sm text-on-surface">{brand}</span>
        </span>
        <button
          type="button"
          aria-label="Thông báo"
          className="relative flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
        >
          <Bell className="size-[22px]" aria-hidden="true" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-secondary-container" aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2 pl-2">
          <span className="hidden min-w-0 max-w-56 flex-col text-right md:flex">
            <span className="truncate text-label-lg leading-tight font-semibold text-on-surface">
              {userName ?? auth.user?.email}
            </span>
            <span className="text-label-sm leading-none text-on-surface-variant">
              {userRole ?? (auth.isAdmin() ? "Quản trị viên" : "Quản lý nội dung")}
            </span>
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary">
            <User className="size-[18px] text-on-primary" aria-hidden="true" />
          </span>
        </span>
        <button type="button" onClick={() => { void navigate(ROUTES.PROFILE); }} className="min-h-12 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-primary hover:bg-learning-mint">Profile</button>
        <button type="button" onClick={handleSignOut} className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-primary hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary">Sign out</button>
      </div>
      </div>
      <label className="flex items-center gap-3 border-t border-outline-variant py-2 text-sm lg:hidden">
        <span className="shrink-0 font-semibold">Chuyển mục quản trị</span>
        <select value={selected} aria-label="Chuyển mục quản trị"
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-outline bg-surface-container-lowest px-2"
          onChange={event => { void navigate(event.target.value); }}>
          <option value="" disabled>Chọn mục</option>
          {navigation.map(group => <optgroup key={group.label} label={group.label}>
            {group.items.map(item => <option key={item.to} value={item.to}>{item.label}</option>)}
          </optgroup>)}
        </select>
      </label>
    </header>
  );
}
