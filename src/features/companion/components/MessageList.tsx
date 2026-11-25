import { useCallback, useLayoutEffect, useRef } from "react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { MessageItem } from "./MessageItem";

export function MessageList() {
  const { state, loadOlderMessages } = useCompanion();
  const listRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(state.messages.length);
  const hasInitializedScroll = useRef(false);
  const previousScrollHeight = useRef<number | null>(null);
  const isLoadingOlder = useRef(false);

  const loadOlder = useCallback(async () => {
    const list = listRef.current;
    if (!list || isLoadingOlder.current) return;
    previousScrollHeight.current = list.scrollHeight;
    isLoadingOlder.current = true;
    try {
      await loadOlderMessages();
    } finally {
      isLoadingOlder.current = false;
    }
  }, [loadOlderMessages]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (!hasInitializedScroll.current) {
      list.scrollTop = list.scrollHeight;
      hasInitializedScroll.current = true;
    } else if (previousScrollHeight.current !== null && state.messages.length > previousCount.current) {
      list.scrollTop += list.scrollHeight - previousScrollHeight.current;
      previousScrollHeight.current = null;
    } else if (previousCount.current === 0 || list.scrollHeight - list.scrollTop - list.clientHeight < 120) {
      list.scrollTop = list.scrollHeight;
    }
    previousCount.current = state.messages.length;
  }, [state.messages, state.partialText]);

  return (
    <div className="companion-message-list" ref={listRef} aria-label="Lịch sử tin nhắn">
      {state.hasOlderMessages ? (
        <Button type="button" variant="ghost" className="companion-load-older" disabled={state.isMessagesLoading} onClick={() => void loadOlder()}>
          {state.isMessagesLoading ? "Đang tải…" : "Tải tin nhắn trước"}
        </Button>
      ) : null}
      {state.isMessagesLoading && state.messages.length === 0 ? <p className="companion-muted" role="status">Đang tải tin nhắn…</p> : null}
      {state.messages.map((message) => <MessageItem message={message} key={message.id} />)}
      {state.partialText ? (
        <MessageItem
          message={{ id: "companion-partial", role: "ASSISTANT", content: state.partialText }}
          incomplete={state.incomplete}
        />
      ) : null}
    </div>
  );
}
