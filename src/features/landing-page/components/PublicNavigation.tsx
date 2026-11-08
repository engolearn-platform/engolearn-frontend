import { ArrowRight, BookOpenText, ChevronDown, Compass, Menu, Route, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, matchPath, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { LANDING_PATHS } from "@features/landing-page/paths";
import BrandImage from "@shared/components/BrandImage";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";
import { cn } from "@shared/utils";

const resources = [
  { label: "Chủ đề", to: ROUTES.TOPICS, icon: Compass },
  { label: "Ngữ pháp", to: ROUTES.GRAMMAR, icon: BookOpenText },
  { label: "Xem trước lộ trình luyện tập", to: LANDING_PATHS.LEARNING_PATH_PREVIEW, icon: Route },
];

const navItemClass = "flex min-h-12 items-center gap-2 rounded-xl px-4 py-3 text-label-lg font-semibold hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary";

export function PublicBrand() {
  return (
    <Link to={ROUTES.HOME} aria-label="EngoLearn — Trang chủ" className="inline-flex min-h-12 min-w-0 items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      <BrandImage className="h-9 w-auto max-w-full object-contain" />
    </Link>
  );
}

function ResourceDisclosure({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const [mode, setMode] = useState<"closed" | "hover" | "pinned">("closed");
  const group = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const open = mode !== "closed";
  const active = resources.find(({ to }) => to === pathname ||
    (to === ROUTES.TOPICS && matchPath(ROUTES.TOPIC_DETAIL, pathname)));
  const featuresLink = pathname === ROUTES.HOME ? "#features" : ROUTES.HOME + "#features";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !group.current?.contains(event.target)) setMode("closed");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const closeOnNavigate = () => {
    setMode("closed");
    onNavigate?.();
  };

  return (
    <div
      ref={group}
      className="relative"
      onPointerEnter={(event) => {
        if (!mobile && event.pointerType === "mouse") setMode((current) => current === "closed" ? "hover" : current);
      }}
      onPointerLeave={() => {
        if (!group.current?.contains(document.activeElement)) setMode((current) => current === "hover" ? "closed" : current);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMode("closed");
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.stopPropagation();
          setMode("closed");
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setMode((current) => current === "pinned" ? "closed" : "pinned")}
        className={cn(navItemClass, "w-full justify-between", active && "bg-learning-mint text-primary")}
      >
        Tính năng <ChevronDown aria-hidden="true" className={cn("size-4", open && "rotate-180")} />
      </button>
      <ul id={panelId} hidden={!open} className={cn(
        "space-y-1 rounded-2xl border border-learning-outline bg-surface-container-lowest p-2",
        mobile ? "mx-2 mb-1" : "absolute left-0 top-full z-30 w-72 shadow-md",
      )}>
        <li><a href={featuresLink} onClick={closeOnNavigate} className={navItemClass}>Tổng quan tính năng</a></li>
        {resources.map(({ label, to, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              onClick={closeOnNavigate}
              aria-current={active?.to === to ? "page" : undefined}
              className={cn(navItemClass, active?.to === to && "bg-learning-mint text-primary")}
            >
              <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PublicNavLinks({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const home = pathname === ROUTES.HOME;
  return (
    <>
      <Link to={ROUTES.HOME} onClick={onNavigate} aria-current={home ? "page" : undefined} className={cn(navItemClass, home && "text-primary")}>Trang chủ</Link>
      <ResourceDisclosure mobile={mobile} onNavigate={onNavigate} />
      <a href={home ? "#journey" : ROUTES.HOME + "#journey"} onClick={onNavigate} className={navItemClass}>Lộ trình học</a>
    </>
  );
}

function PublicNavActions() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Button asChild variant="outline" className="min-h-12 rounded-xl border-learning-mint-border px-5">
        {isAuthenticated ? <Link to={ROUTES.HOME}>Vào trang học</Link> : (
          <Link to={ROUTES.LOGIN} state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}>Đăng nhập</Link>
        )}
      </Button>
      <Button asChild className="min-h-12 rounded-xl px-5">
        <Link to={LANDING_PATHS.PLACEMENT}>Kiểm tra trình độ <ArrowRight aria-hidden="true" /></Link>
      </Button>
    </>
  );
}

export default function PublicNavigation() {
  const { pathname, hash } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const mobileId = useId();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <>
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Bỏ qua điều hướng</a>
      <header
        className="relative z-20 border-b border-learning-outline bg-white/90 backdrop-blur-sm"
        onKeyDown={(event) => {
          if (mobileOpen && event.key === "Escape") {
            setMobileOpen(false);
            mobileButton.current?.focus();
          }
        }}
      >
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5">
          <PublicBrand />
          <nav aria-label="Điều hướng công khai" className="hidden items-center gap-1 lg:flex">
            <PublicNavLinks />
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <PublicNavActions />
          </div>
          <button
            ref={mobileButton}
            type="button"
            aria-label={mobileOpen ? "Đóng điều hướng" : "Mở điều hướng"}
            aria-expanded={mobileOpen}
            aria-controls={mobileId}
            onClick={() => setMobileOpen((open) => !open)}
            className="grid size-12 shrink-0 place-items-center rounded-xl text-primary hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <nav id={mobileId} hidden={!mobileOpen} aria-label="Điều hướng công khai" className="grid gap-1 border-t border-learning-outline bg-white px-5 py-3 lg:hidden">
          <PublicNavLinks mobile onNavigate={() => setMobileOpen(false)} />
          <div className="mt-2 grid gap-2"><PublicNavActions /></div>
        </nav>
      </header>
    </>
  );
}
