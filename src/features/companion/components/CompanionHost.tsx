import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { useEngoMotionPreference } from "@features/companion/hooks/useEngoMotionPreference";
import { Dialog, DialogContent, DialogTitle } from "@/core/components/shadcn/dialog";
import { CompanionScrollContext } from "@features/companion/hooks/useCompanionShellPresentation";
import type { CompanionScrollAnchor } from "@features/companion/hooks/useCompanionShellPresentation";
import { useLocation } from "react-router";
import { HasRole } from "@features/auth/contract";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks/useAuth";
import { useCompanion } from "../state/CompanionProvider";
import { MascotButton } from "./MascotButton";
import { QuickPanel } from "./QuickPanel";
import "./companion.css";

const learnerRoutePatterns = [
  ROUTES.HOME,
  ROUTES.TOPICS,
  ROUTES.MY_TOPICS,
  ROUTES.TOPIC_DETAIL,
  ROUTES.TOPIC_ATTEMPT,
  ROUTES.TOPIC_ITEM_RESULT,
  ROUTES.TOPIC_RESULT,
  ROUTES.TOPIC_CONTEXT,
  ROUTES.TOPIC_VOCAB,
  ROUTES.TOPIC_EXPRESSIONS,
  ROUTES.TOPIC_PRACTICE,
  ROUTES.TOPIC_ITEM_SPEAKING,
  ROUTES.TOPIC_SPEAKING,
  ROUTES.SPEAKING_HISTORY,
  ROUTES.GRAMMAR,
  ROUTES.LEARNING_PATHS,
  ROUTES.SUBSCRIPTION,
  "/assessment",
];

function routePatternMatches(pattern: string, pathname: string) {
  const expression = new RegExp(
    `^${pattern
      .split("/")
      .map((part) => (part.startsWith(":") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("/")}/?$`
  );
  return expression.test(pathname);
}

function isEligibleLearnerRoute(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/assessment/taking" || path.startsWith("/admin/")) return false;
  if (path === ROUTES.GRAMMAR || path.startsWith(`${ROUTES.GRAMMAR}/`)) return true;
  if (path === ROUTES.LEARNING_PATHS || path.startsWith(`${ROUTES.LEARNING_PATHS}/`)) return true;
  if (path === ROUTES.SUBSCRIPTION || path.startsWith(`${ROUTES.SUBSCRIPTION}/`)) return true;
  if (path === "/assessment" || path.startsWith("/assessment/")) return true;
  return learnerRoutePatterns.some((pattern) => routePatternMatches(pattern, path));
}

const narrowViewportQuery = "(max-width: 600px)";

type FocusSnapshot = { selector: string; index: number; selection?: [number, number] };

const focusSelectors = [
  "#companion-message-input", ".companion-header-title button", ".companion-header-actions button",
  ".companion-overflow summary", ".companion-overflow-actions button", ".companion-context-add",
  ".companion-context-remove", ".companion-composer-actions button",
  ".companion-panel-content button", ".companion-panel-content select",
];

function capturePanelFocus(panel: HTMLElement | null): FocusSnapshot | null {
  const active = document.activeElement;
  if (!panel || !(active instanceof HTMLElement) || !panel.contains(active)) return null;
  for (const selector of focusSelectors) {
    const index = Array.from(panel.querySelectorAll(selector)).indexOf(active);
    if (index < 0) continue;
    return {
      selector, index,
      ...(active instanceof HTMLTextAreaElement ? { selection: [active.selectionStart, active.selectionEnd] as [number, number] } : {}),
    };
  }
  return { selector: "", index: 0 };
}

function restorePanelFocus(panel: HTMLElement | null, snapshot: FocusSnapshot | null) {
  if (!panel) return;
  const target = snapshot?.selector ? panel.querySelectorAll<HTMLElement>(snapshot.selector)[snapshot.index] : null;
  if (target && target.getClientRects().length && !target.matches(":disabled")) {
    target.focus({ preventScroll: true });
    if (snapshot?.selection && target instanceof HTMLTextAreaElement) {
      target.setSelectionRange(...snapshot.selection);
    }
  } else panel.focus({ preventScroll: true });
}

export function CompanionHost() {
  const { pathname } = useLocation();
  const { user, identityGeneration } = useAuth();

  if (!isEligibleLearnerRoute(pathname)) return null;

  return (
    <HasRole allowedRoles={["USER"]}>
      <EligibleCompanionHost key={`${identityGeneration}:${user?.id ?? "guest"}`} />
    </HasRole>
  );
}

// Unmounts on eligibility/authorization loss; identity changes reset local presentation.
function EligibleCompanionHost() {
  const { state, openPanel, closePanel, setMode } = useCompanion();
  const motion = useEngoMotionPreference();
  const { pathname } = useLocation();
  const [workspacePreferred, setWorkspacePreferred] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia(narrowViewportQuery).matches);
  const isWorkspace = workspacePreferred && !mobile;
  const [sourcePeek, setSourcePeek] = useState(false);
  const peeking = sourcePeek && mobile && state.panelOpen && !state.panelMinimized;
  const visiblePanel = state.panelOpen && !state.panelMinimized && !peeking;
  const sourceReturnRef = useRef<HTMLButtonElement>(null);
  const scrollAnchor = useRef<CompanionScrollAnchor | null>(null);
  const activeId = state.activeConversation?.id ?? null;
  const priorConversation = useRef<{ id: string | null } | null>(null);

  useEffect(() => {
    if (state.mode === "conversation") priorConversation.current = { id: activeId };
    else if (state.mode === "home" || priorConversation.current?.id !== activeId) {
      priorConversation.current = null;
    }
  }, [state.mode, activeId]);

  const goBack = () => {
    const returnToConversation = state.mode !== "home" && state.mode !== "conversation"
      && priorConversation.current !== null && priorConversation.current.id === activeId;
    setMode(returnToConversation ? "conversation" : "home");
  };
  const panelRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLButtonElement>(null);
  const focusSnapshot = useRef<FocusSnapshot | null>(null);
  const composing = useRef(false);
  const previousMobile = useRef(mobile);

  // Do not remount a local edit, native IME composition, or nested confirmation
  // merely because a breakpoint was crossed. Apply the pending presentation
  // when the interaction ends; no private edit contents are copied.
  useEffect(() => {
    const media = window.matchMedia(narrowViewportQuery);
    const update = () => {
      const desired = media.matches;
      if (desired === mobile) return;
      const panel = panelRef.current;
      if (visiblePanel && (composing.current
        || panel?.querySelector(".companion-memory-view textarea")
        || document.querySelector(".companion-delete-dialog[data-state=open]"))) return;
      if (panel) focusSnapshot.current = capturePanelFocus(panel);
      setMobile(desired);
    };
    const startComposition = (event: CompositionEvent) => {
      if (event.target instanceof Node && panelRef.current?.contains(event.target)) composing.current = true;
    };
    const endComposition = () => { composing.current = false; update(); };
    const observer = new MutationObserver(update);
    if (visiblePanel) {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
      document.addEventListener("compositionstart", startComposition);
      document.addEventListener("compositionend", endComposition);
    } else composing.current = false;
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("compositionstart", startComposition);
      document.removeEventListener("compositionend", endComposition);
    };
  }, [mobile, visiblePanel]);

  useLayoutEffect(() => {
    if (previousMobile.current !== mobile && visiblePanel && !mobile && focusSnapshot.current) {
      restorePanelFocus(panelRef.current, focusSnapshot.current);
      focusSnapshot.current = null;
    }
    previousMobile.current = mobile;
  }, [mobile, visiblePanel]);

  useLayoutEffect(() => {
    if (scrollAnchor.current && scrollAnchor.current.conversationId !== activeId) scrollAnchor.current = null;
  }, [activeId]);
  const previousPanelState = useRef({
    panelOpen: state.panelOpen,
    panelMinimized: state.panelMinimized,
  });


  useEffect(() => {
    const previous = previousPanelState.current;
    const opened = !previous.panelOpen && state.panelOpen && !state.panelMinimized;
    const restored = state.panelOpen && previous.panelMinimized && !state.panelMinimized;
    const minimized = state.panelOpen && !previous.panelMinimized && state.panelMinimized;
    const closed = previous.panelOpen && !state.panelOpen;

    if ((opened || restored) && !mobile) panelRef.current?.focus();
    else if (minimized || closed) mascotRef.current?.focus();

    previousPanelState.current = {
      panelOpen: state.panelOpen,
      panelMinimized: state.panelMinimized,
    };
  }, [state.panelOpen, state.panelMinimized, mobile]);

  const handleOpen = () => {
    openPanel();
  };

  useLayoutEffect(() => {
    if (peeking) sourceReturnRef.current?.focus({ preventScroll: true });
    if (!mobile || !state.panelOpen || state.panelMinimized) setSourcePeek(false);
  }, [peeking, mobile, state.panelOpen, state.panelMinimized]);

  const panel = (
    <QuickPanel
      ref={panelRef}
      isWorkspace={isWorkspace}
      mobile={mobile}
      onToggleWorkspace={() => setWorkspacePreferred((current) => !current)}
      onBack={goBack}
      motion={motion}
      onSourcePeek={() => {
        focusSnapshot.current = capturePanelFocus(panelRef.current);
        const input = panelRef.current?.querySelector<HTMLTextAreaElement>("#companion-message-input");
        if (input && !input.closest("[hidden]")) {
          focusSnapshot.current = { selector: "#companion-message-input", index: 0, selection: [input.selectionStart, input.selectionEnd] };
        }
        setSourcePeek(true);
      }}
    />
  );

  return (
    <CompanionScrollContext.Provider value={scrollAnchor}>
      <div className="companion-host">
        {peeking ? (
          <Button ref={sourceReturnRef} className="companion-source-return" onClick={() => setSourcePeek(false)}>Trở lại chat</Button>
        ) : !visiblePanel ? (
          <MascotButton ref={mascotRef} onClick={handleOpen} motion={motion}
            processing={state.isSending && (state.stream === "connecting" || state.stream === "streaming")} routeKey={pathname} />
        ) : mobile ? (
          <Dialog open onOpenChange={(open) => { if (!open) closePanel(); }}>
            <DialogContent
              className="companion-mobile-dialog"
              showCloseButton={false}
              aria-describedby={undefined}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                restorePanelFocus(panelRef.current, focusSnapshot.current);
                focusSnapshot.current = null;
              }}
              onCloseAutoFocus={(event) => { event.preventDefault(); }}
              onPointerDownOutside={(event) => { event.preventDefault(); }}
              onEscapeKeyDown={(event) => {
                const disclosure = panelRef.current?.querySelector<HTMLDetailsElement>(".companion-overflow[open]");
                if (disclosure) {
                  event.preventDefault();
                  disclosure.open = false;
                  disclosure.querySelector("summary")?.focus();
                }
              }}
            >
              <DialogTitle className="sr-only">AI Companion — Engo</DialogTitle>
              {panel}
            </DialogContent>
          </Dialog>
        ) : panel}
      </div>
    </CompanionScrollContext.Provider>
  );
}
