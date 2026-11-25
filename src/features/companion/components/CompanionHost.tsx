import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { HasRole } from "@features/auth/contract";
import { ROUTES } from "@shared/constants";
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

export function CompanionHost() {
  const { pathname } = useLocation();
  const { state, openPanel } = useCompanion();
  const panelRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLButtonElement>(null);
  const previousPanelState = useRef({
    panelOpen: state.panelOpen,
    panelMinimized: state.panelMinimized,
  });
  const visible = isEligibleLearnerRoute(pathname);

  useEffect(() => {
    const previous = previousPanelState.current;
    const opened = !previous.panelOpen && state.panelOpen && !state.panelMinimized;
    const restored = state.panelOpen && previous.panelMinimized && !state.panelMinimized;
    const minimized = state.panelOpen && !previous.panelMinimized && state.panelMinimized;
    const closed = previous.panelOpen && !state.panelOpen;

    if (visible && (opened || restored)) panelRef.current?.focus();
    else if (visible && (minimized || closed)) mascotRef.current?.focus();

    previousPanelState.current = {
      panelOpen: state.panelOpen,
      panelMinimized: state.panelMinimized,
    };
  }, [state.panelOpen, state.panelMinimized, visible]);

  const handleOpen = () => {
    openPanel();
  };

  if (!visible) return null;

  return (
    <HasRole allowedRoles={["USER"]}>
      <div className="companion-host">
        {state.panelOpen && !state.panelMinimized ? (
          <QuickPanel ref={panelRef} />
        ) : (
          <MascotButton ref={mascotRef} onClick={handleOpen} />
        )}
      </div>
    </HasRole>
  );
}
