import * as React from "react";
import { LogOut, Menu, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";
import { matchLearningRoute } from "./learningNav";

function getGreetingName(email?: string): string {
  if (!email) return "bạn";
  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return name || "bạn";
}

function getInitials(value: string): string {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

interface LearningTopBarProps {
  cefr?: string | null;
  onMenuOpen: () => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export default function LearningTopBar({ cefr, onMenuOpen, menuButtonRef }: LearningTopBarProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountRef = React.useRef<HTMLDivElement>(null);
  const accountButtonRef = React.useRef<HTMLButtonElement>(null);
  const greeting = getGreetingName(auth.user?.email);
  const activeRoute = matchLearningRoute(location.pathname);

  React.useEffect(() => {
    if (!accountOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [accountOpen]);

  const openSignIn = () => {
    setAccountOpen(false);
    void navigate(ROUTES.LOGIN, {
      state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } },
    });
  };

  const handleSignOut = async () => {
    setAccountOpen(false);
    await auth.logout();
    await navigate(ROUTES.LOGIN, { replace: true });
  };

  const accountActionClass = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-on-surface hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <header className="z-20 w-full shrink-0 border-b border-outline-variant bg-surface-container-lowest">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:gap-6 md:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Mở điều hướng"
            onClick={onMenuOpen}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary md:text-on-surface">Xin chào, {greeting}</p>
            {activeRoute && (
              <nav aria-label="Đường dẫn" className="mt-0.5 min-w-0">
                <ol className="flex min-w-0 items-center gap-1.5 truncate text-xs text-on-surface-variant">
                  <li className="hidden shrink-0 md:list-item">{activeRoute.section.label}</li>
                  {activeRoute.submenu && <li aria-hidden="true" className="hidden md:list-item">/</li>}
                  {activeRoute.submenu && <li className="shrink-0">{activeRoute.submenu.label}</li>}
                  {activeRoute.submenu && <li aria-hidden="true">/</li>}
                  <li aria-current="page" className="truncate">{activeRoute.item.label}</li>
                </ol>
              </nav>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          {cefr && (
            <span className="inline-flex min-h-9 items-center rounded-full bg-learning-mint px-2.5 text-xs font-semibold text-primary md:gap-2 md:border md:border-outline-variant md:bg-surface md:px-3 md:text-sm md:text-on-surface">
              <span className="hidden size-2 rounded-full bg-primary md:block" aria-hidden="true" />
              CEFR {cefr}
            </span>
          )}
          <div ref={accountRef} className="relative">
            <button
              ref={accountButtonRef}
              type="button"
              aria-label={auth.isAuthenticated ? `Tài khoản ${auth.user?.email}` : auth.isLoading ? "Tài khoản đang tải" : "Đăng nhập"}
              aria-expanded={accountOpen}
              aria-controls="learner-account-actions"
              onClick={() => setAccountOpen((current) => !current)}
              className="flex size-11 items-center justify-center gap-2 rounded-full p-1 text-left text-sm font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary md:w-auto md:pr-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary" aria-hidden="true">
                {auth.isAuthenticated ? getInitials(auth.user?.email ?? "") : <UserRound className="size-4" />}
              </span>
              <span className="hidden max-w-44 truncate md:inline">{auth.isAuthenticated ? auth.user?.email : auth.isLoading ? "Đang tải tài khoản" : "Tài khoản"}</span>
            </button>
            {accountOpen && (
              <div id="learner-account-actions" className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-lg">
                {auth.isAuthenticated ? (
                  <>
                    <p className="truncate px-3 py-2 text-xs text-on-surface-variant">{auth.user?.email}</p>
                    <Link to={ROUTES.PROFILE} onClick={() => setAccountOpen(false)} className={accountActionClass}>
                      <UserRound className="size-4" aria-hidden="true" />
                      Hồ sơ cá nhân
                    </Link>
                    <button type="button" onClick={() => { void handleSignOut(); }} className={accountActionClass}>
                      <LogOut className="size-4" aria-hidden="true" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={openSignIn} className={accountActionClass}>
                    <UserRound className="size-4" aria-hidden="true" />
                    Đăng nhập
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
