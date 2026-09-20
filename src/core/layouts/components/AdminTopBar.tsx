import { Bell, ChevronRight, User } from "lucide-react";

interface AdminTopBarProps {
  userName?: string;
  userRole?: string;
}

export default function AdminTopBar({
  userName = "Thảo Nguyễn",
  userRole = "Lead Author",
}: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between bg-surface-container-lowest/90 px-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-label-sm text-on-surface-variant">
          Trang quản trị
        </span>
        <ChevronRight className="size-4 shrink-0 text-outline-variant" aria-hidden="true" />
        <span className="truncate text-label-lg font-semibold text-on-surface">
          Quản lý chủ đề
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 sm:flex">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          <span className="text-label-sm text-on-surface">Môi trường biên tập</span>
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
          <span className="hidden flex-col text-right md:flex">
            <span className="text-label-lg leading-tight font-semibold text-on-surface">
              {userName}
            </span>
            <span className="text-label-sm leading-none text-on-surface-variant">
              {userRole}
            </span>
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary">
            <User className="size-[18px] text-on-primary" aria-hidden="true" />
          </span>
        </span>
      </div>
    </header>
  );
}
