import { useCallback, useContext, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { ArrowDown, RotateCw } from "lucide-react";
import { getEngoActivity } from "@features/companion/utils/engoActivity";
import { useCompanion } from "../state/CompanionProvider";
import { CompanionScrollContext } from "@features/companion/hooks/useCompanionShellPresentation";
import type { CompanionScrollAnchor } from "@features/companion/hooks/useCompanionShellPresentation";
import { MessageItem } from "./MessageItem";

const BOTTOM_THRESHOLD = 120;

function readAnchor(list: HTMLDivElement, conversationId: string): CompanionScrollAnchor {
  const top = list.getBoundingClientRect().top;
  const item = Array.from(list.querySelectorAll<HTMLElement>("[data-companion-message-id]"))
    .find((entry) => entry.getBoundingClientRect().bottom > top);
  return {
    conversationId,
    messageId: item?.dataset.companionMessageId ?? null,
    offset: item ? item.getBoundingClientRect().top - top : 0,
    nearBottom: list.scrollHeight - list.scrollTop - list.clientHeight < BOTTOM_THRESHOLD,
  };
}

export function MessageList() {
  const { state, loadOlderMessages, retryTurn } = useCompanion();
  const hostAnchor = useContext(CompanionScrollContext);
  const fallbackAnchor = useRef<CompanionScrollAnchor | null>(null);
  const anchorRef = hostAnchor ?? fallbackAnchor;
  const listRef = useRef<HTMLDivElement>(null);
  const conversationId = state.activeConversation?.id ?? null;
  const hasPartial = Boolean(state.partialText);
  const lastMessage = state.messages[state.messages.length - 1];
  const pending = state.pendingQuestion;
  const lastSubmittedTurn = useRef(pending?.turnId ?? null);
  const busy = state.stream !== "idle";
  const activity = getEngoActivity(state);
  const activeReply = !pending && (lastMessage?.role === "USER" || hasPartial);
  const isStopped = state.stream === "idle" && state.statusCode === "STOPPED";
  const isInterrupted = state.stream === "idle" && state.statusCode === "INTERRUPTED";
  const replyStatus = activeReply
    ? state.retryAvailable && !busy
      ? <>Chưa thể hoàn tất phản hồi. <Button type="button" variant="ghost" className="companion-reply-retry" disabled={state.isSending} onClick={() => void retryTurn()}><RotateCw aria-hidden="true" />Thử lại</Button></>
      : isStopped ? "Đã dừng phản hồi · Chưa hoàn tất"
      : isInterrupted ? "Kết nối bị gián đoạn · Chưa xác nhận kết quả"
      : state.error && !busy ? "Chưa thể hoàn tất phản hồi. Hãy kiểm tra lại cuộc trò chuyện."
      : activity?.label
    : undefined;
  const previousFirst = useRef<{ conversationId: string; messageId: string } | null>(null);
  const loadingOlder = useRef<{ conversationId: string } | null>(null);
  const [awayFromBottom, setAwayFromBottom] = useState(false);

  const capture = useCallback(() => {
    const list = listRef.current;
    if (!list || !conversationId || !list.clientHeight) return;
    // A temporarily empty/loading transcript must not overwrite a valid saved anchor.
    if (!list.querySelector("[data-companion-message-id]") && anchorRef.current?.conversationId === conversationId) return;
    const anchor = readAnchor(list, conversationId);
    anchorRef.current = anchor;
    setAwayFromBottom(!anchor.nearBottom);
  }, [anchorRef, conversationId]);

  const restore = useCallback((prepend = false) => {
    const list = listRef.current;
    if (!list || !conversationId || !list.clientHeight) return;
    const entries = Array.from(list.querySelectorAll<HTMLElement>("[data-companion-message-id]"));
    if (!entries.length) return;
    const saved = anchorRef.current?.conversationId === conversationId ? anchorRef.current : null;
    if (!saved || (saved.nearBottom && !prepend)) {
      list.scrollTop = list.scrollHeight;
    } else if (saved.messageId) {
      const item = entries.find((entry) => entry.dataset.companionMessageId === saved.messageId);
      if (item) list.scrollTop += item.getBoundingClientRect().top - list.getBoundingClientRect().top - saved.offset;
    }
    capture();
  }, [anchorRef, capture, conversationId]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlder.current?.conversationId === conversationId) return;
    const operation = { conversationId };
    loadingOlder.current = operation;
    capture();
    try {
      await loadOlderMessages();
    } finally {
      if (loadingOlder.current === operation) loadingOlder.current = null;
    }
  }, [capture, conversationId, loadOlderMessages]);

  useLayoutEffect(() => {
    const first = state.messages[0]?.id;
    const old = previousFirst.current;
    const prepend = Boolean(old && old.conversationId === conversationId
      && first && first !== old.messageId && state.messages.some((message, index) => index > 0 && message.id === old.messageId));
    // Explicitly sending a new turn follows that question once. Streaming, resize
    // and remount still respect the saved reading position.
    if (pending && pending.turnId !== lastSubmittedTurn.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      capture();
    } else {
      restore(prepend);
    }
    lastSubmittedTurn.current = pending?.turnId ?? null;
    previousFirst.current = conversationId && first ? { conversationId, messageId: first } : null;
  }, [conversationId, restore, capture, state.messages, state.partialText, state.isMessagesLoading, pending, state.stream, state.statusCode, state.retryAvailable, state.error]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => restore());
    observer.observe(list);
    list.querySelectorAll("[data-companion-message-id]").forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }, [restore, state.messages, hasPartial, pending, state.stream, state.retryAvailable, state.error]);

  return (
    <>
      <div className="companion-message-list" ref={listRef} tabIndex={-1} aria-label="Lịch sử tin nhắn" onScroll={capture}>
        {state.hasOlderMessages ? (
          <Button type="button" variant="ghost" className="companion-load-older" disabled={state.isMessagesLoading} onClick={() => void loadOlder()}>
            {state.isMessagesLoading ? "Đang tải…" : "Tải tin nhắn trước"}
          </Button>
        ) : null}
        {state.isMessagesLoading && state.messages.length === 0 ? <p className="companion-muted" role="status">Đang tải tin nhắn…</p> : null}
        {state.messages.map((message) => (
          <div className="companion-message-entry" data-companion-message-id={message.id} key={message.id}>
            <MessageItem message={message} />
          </div>
        ))}
        {pending ? (
          <div className="companion-message-entry companion-pending-entry" data-companion-message-id={"submission-" + pending.turnId}>
            <MessageItem message={{ id: pending.turnId, role: "USER", content: pending.content }}
              pending contextLabel={pending.contextLabel}
              status={busy ? "Đang gửi câu hỏi…" : "Chưa xác nhận được yêu cầu gửi."}
              statusBusy={busy} />
          </div>
        ) : null}
        {hasPartial || replyStatus ? (
          <div className="companion-message-entry" data-companion-message-id="companion-partial">
            <MessageItem message={{ id: "companion-partial", role: "ASSISTANT", content: state.partialText }}
              incomplete={state.incomplete} streaming={busy} status={replyStatus} thinking={activity?.thinking}
              statusBusy={busy} statusError={Boolean(state.retryAvailable || (state.error && !busy))} />
          </div>
        ) : null}
        {state.error && !replyStatus && !pending ? (
          <p className="companion-inline-error" role="alert">{state.quota?.remaining === 0
            ? "Bạn đã dùng hết hạn mức hôm nay."
            : "Không thể hoàn tất yêu cầu. Vui lòng kiểm tra lại và thử lại khi thích hợp."}</p>
        ) : null}
      </div>
      {awayFromBottom && (state.messages.length > 0 || state.partialText) ? (
        <Button type="button" variant="outline" size="icon" className="companion-return-latest"
          aria-label="Về tin nhắn mới nhất" title="Về tin nhắn mới nhất" onClick={() => {
          const list = listRef.current;
          if (!list) return;
          list.scrollTop = list.scrollHeight;
          list.focus({ preventScroll: true });
          capture();
        }}><ArrowDown aria-hidden="true" /></Button>
      ) : null}
    </>
  );
}
