import { Button } from "@/core/components/shadcn/button";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { useAuth } from "@shared/hooks/useAuth";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router";

export default function PlacementUserTopBar({ email, onOpenMenu }: {
  email: string;
  onOpenMenu: () => void;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const initial = email.trim().charAt(0).toUpperCase();

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-outline-variant/50 bg-surface-container-lowest px-5 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Mở menu học tập" onClick={onOpenMenu} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low lg:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-label-lg font-bold text-on-primary">{initial}</span>
        <div className="min-w-0">
          <p className="truncate text-label-lg font-semibold text-on-surface">{email}</p>
          <p className="hidden text-label-sm text-on-surface-variant sm:block">Tiếp tục hành trình học tiếng Anh của bạn</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => {
        void logout().then(() => navigate(PLACEMENT_ROUTES.ROOT));
      }}>Đăng xuất</Button>
    </header>
  );
}
