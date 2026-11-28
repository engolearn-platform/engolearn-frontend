import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { ArrowUp, BookOpen, Plus, Square, X } from "lucide-react";
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
    submitTurn, stopTurn, startNewConversation, checkFirstAdmission } = useCompanion();
  // Keep the actual draft until admission, but render it as a pending transcript entry.
  const showingPendingDraft = Boolean(state.pendingQuestion && state.pendingQuestion.content === state.draft);
  const composerDraft = showingPendingDraft ? "" : state.draft;
  const showContextAction = Boolean(availableContext && !state.attachedContext);
  const contextActionRef = useRef<HTMLButtonElement>(null);
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
    sizer.textContent = composerDraft || " ";

    const measuredHeight = sizer.scrollHeight;
    const lineHeight = Number.parseFloat(inputStyle.lineHeight) || COMPACT_LINE_HEIGHT;
    const multiline = composerDraft.includes("\n") || measuredHeight > lineHeight + sizerVerticalPadding + 1;
    setIsExpanded((current) => current === multiline ? current : multiline);

    textarea.style.height = "auto";
    const nextHeight = Math.min(MAX_TEXTAREA_HEIGHT, Math.max(textarea.scrollHeight, measuredHeight));
    textarea.style.height = `${Math.max(COMPACT_LINE_HEIGHT, nextHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT || measuredHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [composerDraft, showContextAction]);

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
    textareaRef.current?.focus();
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



  const resetAt = state.quota?.remaining === 0 ? formatResetTime(state.quota.windowEndsAt) : "";

  return (
    <form
      ref={formRef}
      className={`companion-composer ${isExpanded ? "companion-composer-expanded" : ""} ${showContextAction ? "companion-composer-has-context" : ""}`}
      onSubmit={handleSubmit}
    >
      {state.firstAdmissionPending && !state.isSending ? (
        <div className="companion-composer-feedback" role="status">
          <span>Đang xác minh yêu cầu đầu tiên.</span>
          <Button type="button" variant="ghost" disabled={state.stream === "reconciling"} onClick={() => void checkFirstAdmission(false)}>Kiểm tra lại</Button>
          <Button type="button" variant="ghost" disabled={state.stream === "reconciling"} onClick={() => void checkFirstAdmission(true)}>Hủy nếu chưa nhận</Button>
        </div>
      ) : null}
      {state.isAtCapacity ? (
        <div className="companion-composer-feedback" role="status">
          <span>Cuộc trò chuyện đã đạt giới hạn tin nhắn.</span>
          <Button type="button" variant="ghost" className="companion-feedback-action" disabled={state.isSending || state.firstAdmissionPending} onClick={startNewConversation}>
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
              aria-label="Gỡ ngữ cảnh" onClick={removeAttachedContext}><X size={14} aria-hidden="true" /></Button>
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
        value={composerDraft}
        readOnly={showingPendingDraft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder="Hỏi Engo điều gì đó…"
        aria-describedby="companion-composer-hint"
      />
      <span id="companion-composer-hint" className="sr-only">Enter để gửi, Shift+Enter để xuống dòng</span>
      {showContextAction && availableContext && (
        <Button ref={contextActionRef} type="button" variant="ghost"
          className="companion-context-add" aria-label="Thêm ngữ cảnh"
          title={availableContext.label} onClick={() => {
            attachAvailableContext();
            textareaRef.current?.focus();
          }}><Plus aria-hidden="true" /> Ngữ cảnh</Button>
      )}
      <div className="companion-composer-actions">
        {state.isSending ? (
          <Button
            ref={actionRef}
            type="button"
            variant="ghost"
            size="icon"
            className="companion-stop-button"
            aria-label="Dừng phản hồi"
            title="Dừng phản hồi"
            onClick={() => { stopTurn(); textareaRef.current?.focus(); }}
          >
            <span className="companion-send-glyph"><Square aria-hidden="true" fill="currentColor" /></span>
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
            <span className="companion-send-glyph"><ArrowUp aria-hidden="true" /></span>
          </Button>
        )}
      </div>
    </form>
  );
}
