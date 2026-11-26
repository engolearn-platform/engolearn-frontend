import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { BookOpen, Plus, Send, Square, X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";

const MAX_TEXTAREA_HEIGHT = 144;
const COMPACT_LINE_HEIGHT = 24;

function formatResetTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AdaptiveComposer() {
  const { state, availableContext, attachAvailableContext, removeAttachedContext, setDraft,
    submitTurn, stopTurn, createConversation, setMode } = useCompanion();
  const showContextAction = Boolean(availableContext && !state.attachedContext);
  const contextActionRef = useRef<HTMLButtonElement>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const measureLayout = useCallback(() => {
    const form = formRef.current;
    const textarea = textareaRef.current;
    const action = actionRef.current;
    const sizer = sizerRef.current;
    if (!form || !textarea || !action || !sizer) return;

    const formStyle = window.getComputedStyle(form);
    const inputStyle = window.getComputedStyle(textarea);
    const horizontalPadding = Number.parseFloat(formStyle.paddingLeft) + Number.parseFloat(formStyle.paddingRight);
    const sizerVerticalPadding = Number.parseFloat(window.getComputedStyle(sizer).paddingTop)
      + Number.parseFloat(window.getComputedStyle(sizer).paddingBottom);
    const gap = Number.parseFloat(formStyle.columnGap || formStyle.gap) || 8;
    const contextWidth = showContextAction && contextActionRef.current
      ? contextActionRef.current.getBoundingClientRect().width + gap : 0;
    const compactWidth = Math.max(72, form.clientWidth - horizontalPadding - action.getBoundingClientRect().width - gap - contextWidth);
    sizer.style.width = `${compactWidth}px`;
    sizer.style.font = inputStyle.font;
    sizer.style.letterSpacing = inputStyle.letterSpacing;
    sizer.style.lineHeight = inputStyle.lineHeight;
    sizer.textContent = state.draft || " ";

    const measuredHeight = sizer.scrollHeight;
    const lineHeight = Number.parseFloat(inputStyle.lineHeight) || COMPACT_LINE_HEIGHT;
    const multiline = state.draft.includes("\n") || measuredHeight > lineHeight + sizerVerticalPadding + 1;
    setIsExpanded((current) => current === multiline ? current : multiline);

    textarea.style.height = "auto";
    const nextHeight = Math.min(MAX_TEXTAREA_HEIGHT, Math.max(textarea.scrollHeight, measuredHeight));
    textarea.style.height = `${Math.max(COMPACT_LINE_HEIGHT, nextHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT || measuredHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [state.draft, showContextAction]);

  useLayoutEffect(() => {
    const form = formRef.current;
    if (!form) return;
    measureLayout();
    const observer = new ResizeObserver(measureLayout);
    observer.observe(form);
    return () => observer.disconnect();
  }, [measureLayout]);

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!state.canSubmit || isComposing) return;
    void submitTurn();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter"
      && !event.shiftKey
      && !isComposing
      && !event.nativeEvent.isComposing
      && event.nativeEvent.keyCode !== 229
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const startNewChat = async () => {
    const conversation = await createConversation();
    if (conversation) setMode("conversation");
  };

  const resetAt = state.quota?.remaining === 0 ? formatResetTime(state.quota.windowEndsAt) : "";

  return (
    <form
      ref={formRef}
      className={`companion-composer ${isExpanded ? "companion-composer-expanded" : ""} ${showContextAction ? "companion-composer-has-context" : ""}`}
      onSubmit={handleSubmit}
    >
      {state.isAtCapacity ? (
        <div className="companion-composer-feedback" role="status">
          <span>Cuộc trò chuyện đã đạt giới hạn tin nhắn.</span>
          <Button type="button" variant="ghost" className="companion-feedback-action" onClick={() => void startNewChat()}>
            Trò chuyện mới
          </Button>
        </div>
      ) : state.quota?.remaining === 0 ? (
        <p className="companion-composer-feedback" role="status">
          Đã dùng hết lượt hôm nay{resetAt ? ` · Đặt lại ${resetAt}` : ""}
        </p>
      ) : null}
      {state.attachedContext && (
        <div className="companion-context-chip-row">
          <div className="companion-context-chip" title={state.attachedContext.label}>
            <BookOpen size={16} aria-hidden="true" />
            <span>{state.attachedContext.label}</span>
            <Button type="button" variant="ghost" size="icon" className="companion-context-remove"
              aria-label="G? ng? c?nh" onClick={removeAttachedContext}><X size={14} aria-hidden="true" /></Button>
          </div>
        </div>
      )}
      <label className="sr-only" htmlFor="companion-message-input">Tin nhắn</label>
      <div ref={sizerRef} className="companion-composer-sizer" aria-hidden="true" />
      <textarea
        ref={textareaRef}
        id="companion-message-input"
        className="companion-composer-input"
        rows={1}
        value={state.draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder="Nhắn tin với Engo…"
        aria-describedby="companion-composer-hint"
      />
      <span id="companion-composer-hint" className="sr-only">Enter để gửi, Shift+Enter để xuống dòng</span>
      {showContextAction && availableContext && (
        <div className="companion-context-action" onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setContextMenuOpen(false);
        }} onKeyDown={event => {
          if (event.key === "Escape") { setContextMenuOpen(false); contextActionRef.current?.focus(); }
        }}>
          <Button ref={contextActionRef} type="button" variant="ghost" size="icon"
            className="companion-context-add" aria-label="Th?m ng? c?nh" aria-expanded={contextMenuOpen}
            onClick={() => setContextMenuOpen(open => !open)}><Plus aria-hidden="true" /></Button>
          {contextMenuOpen && (
            <div className="companion-context-menu">
              <p className="text-xs text-on-surface-variant">Ng? c?nh kh? d?ng</p>
              <Button type="button" variant="ghost" className="companion-context-choice" onClick={() => {
                attachAvailableContext(); setContextMenuOpen(false); textareaRef.current?.focus();
              }}>
                <BookOpen size={16} aria-hidden="true" /><span>{availableContext.label}</span>
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="companion-composer-actions">
        {state.isSending ? (
          <Button
            ref={actionRef}
            type="button"
            variant="outline"
            size="icon"
            className="companion-stop-button"
            aria-label="Dừng phản hồi"
            title="Dừng phản hồi"
            onClick={stopTurn}
          >
            <Square aria-hidden="true" />
          </Button>
        ) : (
          <Button
            ref={actionRef}
            type="submit"
            size="icon"
            className="companion-send-button"
            aria-label="Gửi tin nhắn"
            title="Gửi tin nhắn"
            disabled={!state.canSubmit}
          >
            <Send aria-hidden="true" />
          </Button>
        )}
      </div>
    </form>
  );
}
