import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";

const MAX_TEXTAREA_HEIGHT = 144;

export function AdaptiveComposer() {
  const { state, setDraft, submitTurn, stopTurn } = useCompanion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${Math.max(24, nextHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    setIsExpanded(nextHeight > 48 || state.draft.includes("\n"));
  }, [state.draft]);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [resizeTextarea]);

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

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  return (
    <form className={`companion-composer ${isExpanded ? "companion-composer-expanded" : ""}`} onSubmit={handleSubmit}>
      {state.isAtCapacity ? <p className="companion-capacity-warning">Đã đạt giới hạn tin nhắn của cuộc trò chuyện này.</p> : null}
      <label className="sr-only" htmlFor="companion-message-input">Tin nhắn</label>
      <textarea
        ref={textareaRef}
        id="companion-message-input"
        className="companion-composer-input"
        rows={1}
        value={state.draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="Nhập câu hỏi của bạn…"
        aria-describedby="companion-composer-hint"
      />
      <div className="companion-composer-actions">
        <span id="companion-composer-hint" className="companion-composer-hint">Enter để gửi · Shift+Enter để xuống dòng</span>
        {state.isSending ? (
          <Button type="button" variant="outline" className="companion-stop-button" onClick={stopTurn}>
            <Square aria-hidden="true" />
            Dừng phản hồi
          </Button>
        ) : (
          <Button type="submit" className="companion-send-button" disabled={!state.canSubmit}>
            <Send aria-hidden="true" />
            Gửi
          </Button>
        )}
      </div>
    </form>
  );
}
