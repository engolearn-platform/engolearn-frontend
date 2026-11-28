import { forwardRef, useEffect, useRef, useState } from "react";
import { useFloatingGeometry } from "@features/companion/hooks/useFloatingGeometry";
import type { CSSProperties, KeyboardEvent } from "react";
import { ArrowLeft, Clock3, Expand, GripVertical, MoreHorizontal, Minus, Minimize, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { AdaptiveComposer } from "./AdaptiveComposer";
import { getEngoActivity } from "@features/companion/utils/engoActivity";
import { CompanionHome } from "./CompanionHome";
import { ConversationHistory } from "./ConversationHistory";
import { ConversationView } from "./ConversationView";
import { CompanionMemorySettings, MemoryManagement } from "./MemoryManagement";
import { EngoMotionSettings } from "./EngoMotionSettings";
import type { EngoMotionSettings as MotionSettings } from "@features/companion/hooks/useEngoMotionPreference";

interface QuickPanelProps {
  isWorkspace: boolean;
  mobile: boolean;
  onToggleWorkspace: () => void;
  onBack: () => void;
  motion: MotionSettings;
  onSourcePeek: () => void;
}

export const QuickPanel = forwardRef<HTMLDivElement, QuickPanelProps>(function QuickPanel({ isWorkspace, mobile, onToggleWorkspace, onBack, motion, onSourcePeek }, ref) {
  const { state, closePanel, minimizePanel, setMode, startNewConversation } = useCompanion();

  const activity = getEngoActivity(state);
  const geometry = useFloatingGeometry(isWorkspace ? "expanded" : "compact", !mobile);
  const [toolsOpen, setToolsOpen] = useState(false);
  const gripRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!toolsOpen) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest(".companion-placement-tools,.companion-move-control")) setToolsOpen(false);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, [toolsOpen]);
  const sidebar = isWorkspace && !mobile && geometry.rect.w >= 750;
  const gestureHandlers = {
    onPointerMove: geometry.move,
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => geometry.end(event),
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => geometry.end(event, true),
    onLostPointerCapture: (event: React.PointerEvent<HTMLElement>) => geometry.end(event, true),
  };
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
    : state.mode === "settings" ? "Cài đặt Engo" : "Bạn đồng hành học tiếng Anh";

  const goHome = () => {
    setMode("home");
  };

  const showHistory = () => {
    setMode("history");
  };



  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      !mobile && event.key === "Escape"
      && !(target instanceof HTMLElement && target.closest('[role="dialog"]'))
    ) {
      event.preventDefault();
      if (toolsOpen) {
        event.stopPropagation();
        setToolsOpen(false);
        gripRef.current?.focus();
        return;
      }
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
      style={geometry.style ? { ...geometry.style, "--companion-panel-height": `${geometry.rect.h}px` } as CSSProperties : undefined}
      data-sidebar={sidebar}
      data-dragging={geometry.dragging}
      role={mobile ? undefined : "region"}
      aria-label={mobile ? undefined : "AI Companion"}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <header className="companion-header" {...gestureHandlers}
        onPointerDown={event => {
          if (mobile || (event.target instanceof Element && event.target.closest("button,summary,.companion-overflow"))) return;
          geometry.start(event);
        }}>
        {!mobile && <Button ref={gripRef} type="button" variant="ghost" size="icon" className="companion-icon-button companion-move-control"
          aria-label="Di chuyển khung chat" aria-expanded={toolsOpen && !geometry.dragging}
          title="Kéo hoặc dùng phím mũi tên; Home đặt lại"
          onPointerDown={event => { event.stopPropagation(); geometry.start(event); }}
          {...gestureHandlers}
          onKeyDown={event => geometry.keyboard(event)}
          onClick={event => { if (event.detail !== 0 && geometry.suppressClick.current) { geometry.suppressClick.current = false; setToolsOpen(false); return; } setToolsOpen(open => !open); }}>
          <GripVertical aria-hidden="true" />
        </Button>}
        <div className="companion-header-title">
          {state.mode !== "home" ? (
            <Button type="button" variant="ghost" size="icon" className="companion-icon-button" aria-label={state.mode === "conversation" ? "Về trang chủ" : "Quay lại"} onClick={onBack}>
              <ArrowLeft aria-hidden="true" />
            </Button>
          ) : null}
          <img src={activity?.thinking ? "/assets/engo/engo-thinking.webp" : "/assets/engo/engo-avatar.webp"} alt="" className="companion-title-mark" />
          <div className="companion-title-copy">
            <h2>Engo</h2>
            <span className={activity ? "companion-active-subtitle" : undefined} title={activity ? `${activity.label} · ${subtitle}` : subtitle}>{activity?.label ?? subtitle}</span>
          </div>
        </div>
        <div className="companion-header-actions">
          {mobile && (state.mode === "home" || state.mode === "conversation") && <Button type="button" variant="ghost" className="companion-source-peek" onClick={onSourcePeek}>Xem bài</Button>}
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
            onClick={() => { setToolsOpen(false); onToggleWorkspace(); }}
          >
            {isWorkspace ? <Minimize aria-hidden="true" /> : <Expand aria-hidden="true" />}
          </Button>
          <details ref={overflowRef} className="companion-overflow">
            <summary className="companion-icon-button" aria-label="Thêm thao tác" title="Thêm thao tác"><MoreHorizontal aria-hidden="true" /></summary>
            <div className="companion-overflow-actions" onClick={(event) => { if (event.target instanceof Element && event.target.closest("button")) closeDisclosure(); }}>
              {mobile && <Button type="button" variant="ghost" className="companion-overflow-history" onClick={showHistory}>Lịch sử trò chuyện</Button>}
              <Button type="button" variant="ghost" disabled={state.isSending || state.firstAdmissionPending} onClick={startNewConversation}>Trò chuyện mới</Button>
              <Button type="button" variant="ghost" onClick={goHome}>Trang chủ</Button>
              <Button type="button" variant="ghost" onClick={() => setMode("memory")}>Bộ nhớ</Button>
              <Button type="button" variant="ghost" onClick={() => setMode("settings")}>Cài đặt Engo</Button>
              <Button type="button" variant="ghost" onClick={minimizePanel}><Minus aria-hidden="true" /> Thu nhỏ</Button>
            </div>
          </details>
          <Button type="button" variant="ghost" size="icon" className="companion-icon-button" aria-label="Đóng bảng trò chuyện" onClick={closePanel}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </header>

      {!mobile && toolsOpen && !geometry.dragging && <div className="companion-placement-tools" aria-label="Vị trí khung chat">
        <p>Kéo thanh đầu hoặc dùng phím mũi tên để di chuyển.</p>
        <div className="companion-placement-grid">
          <span /><Button variant="outline" onClick={() => geometry.step(0,-60)} aria-label="Di chuyển lên">↑</Button><span />
          <Button variant="outline" onClick={() => geometry.step(-60,0)} aria-label="Di chuyển trái">←</Button>
          <Button variant="outline" onClick={geometry.reset} aria-label="Đặt lại vị trí và kích thước">↺</Button>
          <Button variant="outline" onClick={() => geometry.step(60,0)} aria-label="Di chuyển phải">→</Button>
          <span /><Button variant="outline" onClick={() => geometry.step(0,60)} aria-label="Di chuyển xuống">↓</Button><span />
        </div>
        <div className="companion-placement-actions">
          <Button variant="outline" onClick={() => geometry.step(-60,-60,true)}>− Khung</Button>
          <Button variant="outline" onClick={() => geometry.step(60,60,true)}>+ Khung</Button>
          <Button variant="ghost" onClick={() => { setToolsOpen(false); gripRef.current?.focus(); }}>Xong</Button>
        </div>
      </div>}
      <div className={`companion-workspace ${isWorkspace ? "companion-workspace-expanded" : ""}`}>
        {sidebar ? (
          <aside className="companion-workspace-sidebar" aria-label="Điều hướng cuộc trò chuyện">
              <Button type="button" className="companion-sidebar-new-chat" disabled={state.isSending || state.firstAdmissionPending} onClick={startNewConversation}>
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
          {state.mode === "settings" ? <div className="companion-settings-view"><EngoMotionSettings key={motion.preference} motion={motion} /><CompanionMemorySettings /></div> : null}
        </div>
      <div className="companion-composer-slot" hidden={state.mode === "history" || state.mode === "memory" || state.mode === "settings"}>
        <AdaptiveComposer />
        <p className="companion-composer-caution">Engo có thể mắc sai sót. Hãy kiểm tra thông tin quan trọng.</p>
      </div>
        </div>
      </div>
      {!mobile && <Button variant="ghost" className="companion-resize-control" aria-label="Đổi kích thước khung chat"
        title="Kéo hoặc dùng phím mũi tên"
        onPointerDown={event => geometry.start(event, true)} {...gestureHandlers}
        onKeyDown={event => geometry.keyboard(event, true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 19L19 7M13 19l6-6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      </Button>}
      <span className="sr-only" aria-live="polite">
        {state.mode !== "conversation" ? activity?.label ?? "" : ""}
      </span>
    </section>
  );
});
