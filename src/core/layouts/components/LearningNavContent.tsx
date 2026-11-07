import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, LogIn, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router";
import { ROUTES } from "@shared/constants";
import { cn } from "@shared/utils";
import {
  isLearningLinkActive,
  isLearningLinkCurrent,
  LEARNING_NAV_SECTIONS,
  PROFILE_NAV_ITEM,
  type LearningNavLink,
  type LearningNavSection,
  type LearningNavSubmenu,
  matchLearningRoute,
} from "./learningNav";

interface LearningNavContentProps {
  compact?: boolean;
  isAuthenticated: boolean;
  onNavigate?: () => void;
}

function navClass(active: boolean, compact: boolean) {
  return cn(
    "flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    compact ? "size-11 justify-center px-0" : "gap-3 px-3",
    active
      ? "bg-learning-nav-active font-semibold text-primary ring-1 ring-learning-nav-border"
      : "text-on-surface-variant hover:bg-surface-container-high",
  );
}

function routeBackTo(pathname: string, search: string, hash: string) {
  return { from: { pathname, search, hash } };
}

function CompactTooltip({
  label,
  children,
  enabled = true,
}: {
  label: string;
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const wrapperRef = React.useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ left: 0, top: 0 });
  const tooltipId = React.useId();

  React.useLayoutEffect(() => {
    if (!visible || !enabled) return;
    const updatePosition = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setPosition({ left: rect.right + 6, top: rect.top + rect.height / 2 });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [enabled, visible]);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => { if (enabled) setVisible(true); }}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => { if (enabled) setVisible(true); }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setVisible(false);
      }}
    >
      {children}
      {visible && enabled && createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-md bg-on-surface px-2.5 py-1.5 text-xs font-medium text-surface-container-lowest shadow-md"
          style={{ left: position.left, top: position.top }}
        >
          {label}
        </span>,
        document.body,
      )}
    </div>
  );
}

function ItemLink({
  item,
  compact,
  pathname,
  onNavigate,
}: {
  item: LearningNavLink;
  compact: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const unavailableLabel = `${item.label} — Chưa khả dụng`;
  const active = isLearningLinkActive(item, pathname);
  const current = isLearningLinkCurrent(item, pathname);

  if (item.disabled || !item.to) {
    const disabled = (
      <span
        role="link"
        tabIndex={0}
        aria-label={unavailableLabel}
        aria-disabled="true"
        className={cn(
          "flex min-h-11 cursor-not-allowed items-center rounded-xl text-sm text-on-surface-variant/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          compact ? "size-11 justify-center px-0" : "gap-3 px-3",
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        {!compact && <><span className="min-w-0 flex-1">{item.label}</span><span className="shrink-0 text-xs">Chưa khả dụng</span></>}
      </span>
    );
    return compact ? <CompactTooltip label={unavailableLabel}>{disabled}</CompactTooltip> : disabled;
  }

  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      aria-label={compact ? item.label : undefined}
      className={navClass(active, compact)}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      {!compact && <span className="min-w-0 truncate">{item.label}</span>}
    </Link>
  );
  return compact ? <CompactTooltip label={item.label}>{link}</CompactTooltip> : link;
}

function CompactSubmenu({
  submenu,
  isAuthenticated,
  pathname,
  search,
  hash,
  onNavigate,
}: {
  submenu: LearningNavSubmenu;
  isAuthenticated: boolean;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ left: 0, top: 0, maxHeight: 0 });
  const [positioned, setPositioned] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const openedFromKeyboard = React.useRef(false);
  const panelId = React.useId();
  const Icon = submenu.icon;
  const active = submenu.items.some((item) => isLearningLinkActive(item, pathname));
  const visibleItems = submenu.items.filter((item) => !item.requiresAuth || isAuthenticated);

  React.useLayoutEffect(() => {
    if (!open) {
      setPositioned(false);
      return;
    }
    const updatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const maxHeight = Math.max(1, window.innerHeight - 16);
      const panelHeight = Math.min(panel.scrollHeight, maxHeight);
      const panelWidth = panel.offsetWidth;
      let left = trigger.right + 8;
      if (left + panelWidth > window.innerWidth - 8) left = Math.max(8, trigger.left - panelWidth - 8);
      const top = Math.max(8, Math.min(trigger.top, window.innerHeight - panelHeight - 8));
      setPosition({ left, top, maxHeight });
      setPositioned(true);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, visibleItems.length]);

  React.useLayoutEffect(() => {
    if (!open || !positioned || !openedFromKeyboard.current) return;
    openedFromKeyboard.current = false;
    panelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled]), [tabindex='0']")?.focus();
  }, [open, positioned]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !wrapperRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const moveFocusAfterFlyout = () => {
    const nav = triggerRef.current?.closest("nav");
    const trigger = triggerRef.current;
    if (!nav || !trigger) return;
    const candidates = Array.from(nav.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex='0']"))
      .filter((element) => element.getClientRects().length > 0);
    const index = candidates.indexOf(trigger);
    const next = candidates[index + 1];
    if (next) next.focus();
    else {
      const aside = trigger.closest("aside");
      const next = aside?.querySelector<HTMLElement>("#learning-sidebar-account")
        ?? aside?.querySelector<HTMLElement>("#learning-sidebar-toggle");
      next?.focus();
    }
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex='0']") ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      setOpen(false);
      moveFocusAfterFlyout();
    }
  };

  return (
    <div ref={wrapperRef}>
      <CompactTooltip label={submenu.label} enabled={!open}>
        <button
          ref={triggerRef}
          type="button"
          aria-label={submenu.label}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(navClass(active, true), "w-full")}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && !open) {
              event.preventDefault();
              openedFromKeyboard.current = true;
              setOpen(true);
            } else if (event.key === "Enter" || event.key === " ") {
              openedFromKeyboard.current = !open;
            }
          }}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon className="size-5" aria-hidden="true" />
        </button>
      </CompactTooltip>
      {open && createPortal(
        <div
          id={panelId}
          ref={panelRef}
          aria-label={submenu.label}
          className="fixed z-[90] w-64 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-xl"
          onKeyDown={handlePanelKeyDown}
          style={{
            left: position.left,
            top: position.top,
            maxHeight: position.maxHeight || "calc(100dvh - 1rem)",
            visibility: positioned ? "visible" : "hidden",
          }}
        >
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{submenu.label}</p>
          <div className="space-y-1">
            {visibleItems.map((item) => (
              <ItemLink
                key={item.id}
                item={item}
                compact={false}
                pathname={pathname}
                onNavigate={() => { setOpen(false); onNavigate?.(); }}
              />
            ))}
          </div>
          {!isAuthenticated && submenu.id === "account-benefits" && (
            <Link
              to={ROUTES.LOGIN}
              state={routeBackTo(pathname, search, hash)}
              onClick={() => { setOpen(false); onNavigate?.(); }}
              className="mt-2 flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LogIn className="size-4" aria-hidden="true" />
              Đăng nhập
            </Link>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function SectionContent({
  section,
  compact,
  openSubmenus,
  onToggleSubmenu,
  isAuthenticated,
  pathname,
  search,
  hash,
  onNavigate,
}: {
  section: LearningNavSection;
  compact: boolean;
  openSubmenus: string[];
  onToggleSubmenu: (submenuId: string) => void;
  isAuthenticated: boolean;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}) {
  return (
    <section aria-label={section.label} className={compact ? "space-y-2 border-t border-outline-variant pt-2 first:border-0 first:pt-0" : "space-y-1"}>
      {!compact && <h2 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{section.label}</h2>}
      {section.entries.map((entry) => {
        if (entry.kind === "link") {
          return (
            <ItemLink
              key={entry.item.id}
              item={entry.item}
              compact={compact}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          );
        }

        const submenu = entry.submenu;
        const visibleItems = submenu.items.filter((item) => !item.requiresAuth || isAuthenticated);
        const active = submenu.items.some((item) => isLearningLinkActive(item, pathname));
        const expanded = openSubmenus.includes(submenu.id);
        const Icon = submenu.icon;

        if (compact) {
          return (
            <CompactSubmenu
              key={submenu.id}
              submenu={submenu}
              isAuthenticated={isAuthenticated}
              pathname={pathname}
              search={search}
              hash={hash}
              onNavigate={onNavigate}
            />
          );
        }

        return (
          <div key={submenu.id}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`submenu-${submenu.id}`}
              onClick={() => onToggleSubmenu(submenu.id)}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active ? "text-primary" : "text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{submenu.label}</span>
              {expanded ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
            </button>
            {expanded && (
              <div id={`submenu-${submenu.id}`} className="ml-3 mt-1 space-y-1 border-l border-learning-nav-border pl-3">
                {visibleItems.map((item) => (
                  <ItemLink
                    key={item.id}
                    item={item}
                    compact={false}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
                {!isAuthenticated && submenu.id === "account-benefits" && (
                  <Link
                    to={ROUTES.LOGIN}
                    state={routeBackTo(pathname, search, hash)}
                    onClick={onNavigate}
                    className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <LogIn className="size-5" aria-hidden="true" />
                    Đăng nhập
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default function LearningNavContent({
  compact = false,
  isAuthenticated,
  onNavigate,
}: LearningNavContentProps) {
  const location = useLocation();
  const activeRoute = React.useMemo(() => matchLearningRoute(location.pathname), [location.pathname]);
  const [openSubmenus, setOpenSubmenus] = React.useState<string[]>(() =>
    activeRoute?.submenu ? [activeRoute.submenu.id] : [],
  );

  React.useEffect(() => {
    if (!activeRoute?.submenu) return;
    setOpenSubmenus((current) => current.includes(activeRoute.submenu!.id)
      ? current
      : [...current, activeRoute.submenu!.id]);
  }, [activeRoute]);

  const toggleSubmenu = (submenuId: string) => {
    setOpenSubmenus((current) => current.includes(submenuId)
      ? current.filter((id) => id !== submenuId)
      : [...current, submenuId]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label="Điều hướng chính"
        className={cn("min-h-0 flex-1 overflow-y-auto", compact ? "space-y-2 px-2 py-4" : "space-y-5 px-4 py-4")}
      >
        {LEARNING_NAV_SECTIONS.map((section) => (
          <SectionContent
            key={section.id}
            section={section}
            compact={compact}
            openSubmenus={openSubmenus}
            onToggleSubmenu={toggleSubmenu}
            isAuthenticated={isAuthenticated}
            pathname={location.pathname}
            search={location.search}
            hash={location.hash}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className={cn("border-t border-outline-variant", compact ? "p-2" : "p-4")}>
        {compact ? (
          <CompactTooltip label={isAuthenticated ? "Tài khoản" : "Đăng nhập"}>
            <Link
              to={isAuthenticated ? ROUTES.PROFILE : ROUTES.LOGIN}
              id="learning-sidebar-account"
              state={!isAuthenticated ? routeBackTo(location.pathname, location.search, location.hash) : undefined}
              onClick={onNavigate}
              aria-current={location.pathname === ROUTES.PROFILE ? "page" : undefined}
              aria-label={isAuthenticated ? "Tài khoản" : "Đăng nhập"}
              className={cn(navClass(location.pathname === ROUTES.PROFILE, true), "w-full")}
            >
              {isAuthenticated ? <UserRound className="size-5" aria-hidden="true" /> : <LogIn className="size-5" aria-hidden="true" />}
            </Link>
          </CompactTooltip>
        ) : isAuthenticated ? (
          <Link
            to={PROFILE_NAV_ITEM.to!}
            onClick={onNavigate}
            aria-current={location.pathname === ROUTES.PROFILE ? "page" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary"
          >
            <UserRound className="size-5" aria-hidden="true" />
            {PROFILE_NAV_ITEM.label}
          </Link>
        ) : (
          <div className="rounded-xl border border-outline-variant bg-surface p-3">
            <p className="text-sm font-semibold text-on-surface">Bắt đầu học cùng EngoLearn</p>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">Đăng nhập để theo dõi tiến độ của bạn.</p>
            <Link
              to={ROUTES.LOGIN}
              state={routeBackTo(location.pathname, location.search, location.hash)}
              onClick={onNavigate}
              className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LogIn className="size-4" aria-hidden="true" />
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
