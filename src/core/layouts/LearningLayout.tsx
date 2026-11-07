import * as React from "react";
import { Outlet, useLocation } from "react-router";
import { useAuth } from "@shared/hooks";
import LearningBottomNav from "./components/LearningBottomNav";
import LearningSidebar from "./components/LearningSidebar";
import LearningTopBar from "./components/LearningTopBar";
import TopicCefrProvider from "./components/TopicCefrProvider";
import { useTopicCefrBridge } from "./components/topicCefrBridge";

function LearningContent() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const mainRef = React.useRef<HTMLElement>(null);
  const { level } = useTopicCefrBridge();

  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-on-surface">
      <LearningSidebar isAuthenticated={auth.isAuthenticated} />
      <div className="flex min-w-0 flex-1 flex-col">
        <LearningTopBar
          cefr={level}
          onMenuOpen={() => setMobileMenuOpen(true)}
          menuButtonRef={menuButtonRef}
        />
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        >
          <Outlet />
        </main>
      </div>
      <LearningBottomNav
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        triggerRef={menuButtonRef}
        isAuthenticated={auth.isAuthenticated}
      />
    </div>
  );
}

export default function LearningLayout() {
  const { identityGeneration } = useAuth();

  return (
    <TopicCefrProvider identityGeneration={identityGeneration}>
      <LearningContent />
    </TopicCefrProvider>
  );
}
