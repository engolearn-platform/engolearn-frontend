import { forwardRef, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowLeft, Clock3, Expand, MoreHorizontal, Minus, Minimize, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { AdaptiveComposer } from "./AdaptiveComposer";
import { CompanionHome } from "./CompanionHome";
import { ConversationHistory } from "./ConversationHistory";
import { ConversationView } from "./ConversationView";
import { CompanionMemorySettings, MemoryManagement } from "./MemoryManagement";

export const QuickPanel = forwardRef<HTMLDivElement>(function QuickPanel(_props, ref) {
  const { state, closePanel, minimizePanel, setMode, createConversation } = useCompanion();
  const [isWorkspace, setIsWorkspace] = useState(false);
  const overflowRef = useRef<HTMLDetailsElement>(null);
  const closeDisclosure = () => {
    const disclosure = overflowRef.current;
    if (!disclosure?.open) return;
    disclosure.open = false;
    disclosure.querySelector("summary")?.focus();
  };
  const subtitle = state.mode === "conversation"
    ? state.activeConversation?.title?.trim() || "Cuộc trò chuyện mới"
    : state.mode === "history" ? "Lịch sử trò chuyện"
    : state.mode === "memory" ? "Bộ nhớ"
    : state.mode === "settings" ? "Cài đặt bộ nhớ" : "Bạn đồng hành học tiếng Anh";

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
      if (overflowRef.current?.open) {
        event.stopPropagation();
        closeDisclosure();
        return;
      }
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
          {state.mode !== "home" ? (
            <Button type="button" variant="ghost" size="icon" className="companion-icon-button" aria-label="Về trang chủ" onClick={goHome}>
              <ArrowLeft aria-hidden="true" />
            </Button>
          ) : null}
          <img src="/landing/penguin-hero.webp" alt="" className="companion-title-mark" />
          <div className="companion-title-copy">
            <h2>Engo</h2>
            <span title={subtitle}>{subtitle}</span>
          </div>
        </div>
        <div className="companion-header-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="companion-icon-button companion-header-history"
            aria-label="Xem lịch sử trò chuyện"
            title="Lịch sử trò chuyện"
            onClick={showHistory}
          >
            <Clock3 aria-hidden="true" />
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
            {isWorkspace ? <Minimize aria-hidden="true" /> : <Expand aria-hidden="true" />}
          </Button>
          <details ref={overflowRef} className="companion-overflow">
            <summary className="companion-icon-button" aria-label="Thêm thao tác" title="Thêm thao tác"><MoreHorizontal aria-hidden="true" /></summary>
            <div className="companion-overflow-actions" onClick={(event) => { if (event.target instanceof Element && event.target.closest("button")) closeDisclosure(); }}>
              <Button type="button" variant="ghost" onClick={() => void startNewChat()}>Trò chuyện mới</Button>
              <Button type="button" variant="ghost" onClick={goHome}>Trang chủ</Button>
              <Button type="button" variant="ghost" onClick={() => setMode("memory")}>Bộ nhớ</Button>
              <Button type="button" variant="ghost" onClick={() => setMode("settings")}>Cài đặt bộ nhớ</Button>
              <Button type="button" variant="ghost" onClick={minimizePanel}><Minus aria-hidden="true" /> Thu nhỏ</Button>
            </div>
          </details>
          <Button type="button" variant="ghost" size="icon" className="companion-icon-button" aria-label="Đóng bảng trò chuyện" onClick={closePanel}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className={`companion-workspace ${isWorkspace ? "companion-workspace-expanded" : ""}`}>
        {isWorkspace ? (
          <aside className="companion-workspace-sidebar" aria-label="Điều hướng cuộc trò chuyện">
              <Button type="button" className="companion-sidebar-new-chat" onClick={() => void startNewChat()}>
                <span aria-hidden="true">+</span>
                Trò chuyện mới
              </Button>
            <div className="companion-sidebar-heading">Gần đây</div>
            <ConversationHistory compact conversations={state.recentConversations} />
            <Button type="button" variant="ghost" className="companion-text-action companion-sidebar-history" onClick={showHistory}>
              <Clock3 aria-hidden="true" /> Xem lịch sử
            </Button>
            <div className="companion-sidebar-footer">
              <Button type="button" variant="ghost" className="companion-text-action" onClick={() => setMode("memory")}><SlidersHorizontal aria-hidden="true" /> Những điều Engo nhớ</Button>
            </div>
          </aside>
        ) : null}
        <div className="companion-chat-column">
        <div className="companion-panel-content">
          {state.mode === "home" ? <CompanionHome /> : null}
          {state.mode === "history" ? <ConversationHistory /> : null}
          {state.mode === "conversation" ? <ConversationView /> : null}
          {state.mode === "memory" ? <MemoryManagement /> : null}
          {state.mode === "settings" ? <CompanionMemorySettings /> : null}
        </div>
      <div className="companion-composer-slot" hidden={state.mode === "history" || state.mode === "memory" || state.mode === "settings"}>
        <AdaptiveComposer />
        <p className="companion-composer-caution">Engo có thể mắc sai sót. Hãy kiểm tra thông tin quan trọng.</p>
      </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {state.isSending ? (state.statusCode === "ASSESSMENT_LOOKUP" ? "Đang xem kết quả học tập…" : "Engo đang xử lý…") : ""}
      </span>
    </section>
  );
});
