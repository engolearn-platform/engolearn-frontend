import { forwardRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowLeft, Clock3, Expand, Home, Minus, PanelRightClose, X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import BrandImage from "@shared/components/BrandImage";
import { useCompanion } from "../state/CompanionProvider";
import { AdaptiveComposer } from "./AdaptiveComposer";
import { CompanionHome } from "./CompanionHome";
import { ConversationHistory } from "./ConversationHistory";
import { ConversationView } from "./ConversationView";

export const QuickPanel = forwardRef<HTMLDivElement>(function QuickPanel(_props, ref) {
  const { state, closePanel, minimizePanel, setMode, createConversation } = useCompanion();
  const [isWorkspace, setIsWorkspace] = useState(false);

  const goHome = () => {
    setMode("home");
  };

  const showHistory = () => {
    setMode("history");
  };

  const startNewChat = async () => {
    const conversation = await createConversation();
    if (conversation) setMode("conversation");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      event.key === "Escape"
      && !(target instanceof HTMLElement && target.closest('[role="dialog"]'))
    ) {
      event.preventDefault();
      minimizePanel();
    }
  };

  return (
    <section
      ref={ref}
      className={`companion-panel ${isWorkspace ? "companion-panel-expanded" : ""}`}
      role="region"
      aria-label="AI Companion"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <header className="companion-header">
        <div className="companion-header-title">
          {state.mode === "conversation" ? (
            <Button type="button" variant="ghost" size="icon" className="companion-icon-button" aria-label="Về trang chủ" onClick={goHome}>
              <ArrowLeft aria-hidden="true" />
            </Button>
          ) : null}
          <BrandImage variant="mark" className="companion-title-mark" />
          <div className="companion-title-copy">
            <h2>Engo</h2>
            <span>Học tiếng Anh cùng bạn</span>
          </div>
        </div>
        <div className="companion-header-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="companion-icon-button"
            aria-label={state.mode === "history" ? "Về trang chủ" : "Xem lịch sử trò chuyện"}
            title={state.mode === "history" ? "Trang chủ" : "Lịch sử trò chuyện"}
            onClick={state.mode === "history" ? goHome : showHistory}
          >
            {state.mode === "history" ? <Home aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="companion-icon-button companion-expand-control"
            aria-label={isWorkspace ? "Thu gọn Companion" : "Mở Full Workspace"}
            title={isWorkspace ? "Thu gọn" : "Mở Full Workspace"}
            onClick={() => setIsWorkspace((current) => !current)}
          >
            {isWorkspace ? <PanelRightClose aria-hidden="true" /> : <Expand aria-hidden="true" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" className="companion-icon-button" aria-label="Thu nhỏ AI Companion" onClick={minimizePanel}>
            <Minus aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="companion-icon-button" aria-label="Đóng AI Companion" onClick={closePanel}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className={`companion-workspace ${isWorkspace ? "companion-workspace-expanded" : ""}`}>
        {isWorkspace ? (
          <aside className="companion-workspace-sidebar" aria-label="Điều hướng cuộc trò chuyện">
            {state.mode !== "home" ? (
              <Button type="button" className="companion-sidebar-new-chat" onClick={() => void startNewChat()}>
                <span aria-hidden="true">+</span>
                Trò chuyện mới
              </Button>
            ) : null}
            <div className="companion-sidebar-heading">Gần đây</div>
            <ConversationHistory compact conversations={state.recentConversations} />
            <Button type="button" variant="ghost" className="companion-text-action companion-sidebar-history" onClick={showHistory}>
              Xem tất cả
            </Button>
          </aside>
        ) : null}
        <div className="companion-panel-content">
          {state.mode === "home" ? <CompanionHome /> : null}
          {state.mode === "history" ? <ConversationHistory /> : null}
          {state.mode === "conversation" ? <ConversationView /> : null}
        </div>
      </div>

      <div className="companion-composer-slot" hidden={state.mode === "history"}>
        <AdaptiveComposer />
      </div>
      <span className="sr-only" aria-live="polite">
        {state.isSending ? (state.statusCode === "ASSESSMENT_LOOKUP" ? "Đang xem kết quả học tập…" : "Engo đang xử lý…") : ""}
      </span>
    </section>
  );
});
