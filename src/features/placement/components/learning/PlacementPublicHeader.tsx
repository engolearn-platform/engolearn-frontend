import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils";
import { useAuth } from "@shared/hooks/useAuth";
import { ROUTES } from "@shared/constants";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { PLACEMENT_PUBLIC_NAV_ITEMS, PLACEMENT_ROUTES } from "@features/placement/constants";
import type { PlacementNavItem } from "@features/placement/types/placement.types";

function isActiveItem(item: PlacementNavItem, pathname: string): boolean {
  if (!item.enabled) return false;
  return item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
}

function NavItems({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {PLACEMENT_PUBLIC_NAV_ITEMS.map((item) => {
        if (!item.enabled) {
          return (
            <span
              key={item.id}
              aria-disabled="true"
              title="Sắp ra mắt"
              className="cursor-not-allowed text-on-surface-variant/50"
            >
              {item.label}
            </span>
          );
        }

        const active = isActiveItem(item, pathname);

        return (
          <Link
            key={item.id}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-primary",
              active ? "font-semibold text-primary" : "text-on-surface-variant",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function AuthActions() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-label-lg">
        <span className="font-semibold text-on-surface">{user?.email}</span>
          <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => {
            void logout().then(() => {
              navigate(PLACEMENT_ROUTES.ROOT);
            });
          }}>
            Đăng xuất
          </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link to={ROUTES.LOGIN} state={{ from: location }}
        className="text-label-lg font-semibold text-primary hover:underline">
        Đăng nhập
      </Link>
      <Button asChild type="button" size="sm" className="rounded-xl px-5">
        <Link to={ROUTES.REGISTER} state={{ from: location }}>Đăng ký</Link>
      </Button>
    </div>
  );
}

export default function PlacementPublicHeader() {
  const location = useLocation();
  const { pathname } = location;
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5">
        <Link
          to="/"
          aria-label="EngoLearn — Trang chủ"
          className="flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <span className="text-headline-sm font-bold tracking-tight text-on-surface">
            Engo<span className="text-primary">Learn</span>
          </span>
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-6 text-label-lg lg:flex"
        >
          <NavItems pathname={pathname} />
        </nav>

        <div className="hidden lg:block">
          <AuthActions />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isAuthenticated ? (
            <span className="max-w-24 truncate text-label-sm font-semibold text-on-surface">{user?.email}</span>
          ) : !isLoading ? (
            <Button asChild size="sm" className="rounded-xl px-4">
              <Link to={ROUTES.REGISTER} state={{ from: location }}>Đăng ký</Link>
            </Button>
          ) : null}
          <button
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex size-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="absolute inset-x-0 top-16 border-b border-outline-variant bg-surface-container-lowest px-5 py-4 shadow-sm lg:hidden">
          <nav
            aria-label="Điều hướng chính"
            className="flex flex-col gap-3 text-label-lg"
          >
            <NavItems pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </nav>
          <div className="mt-4 flex justify-end border-t border-outline-variant pt-4">
            <AuthActions />
          </div>
        </div>
      ) : null}
    </header>
  );
}
