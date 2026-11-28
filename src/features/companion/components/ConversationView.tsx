import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { MessageList } from "./MessageList";

export function ConversationView() {
  const { state, setMode } = useCompanion();
  const isEmptyConversation = !state.firstAdmissionPending && !state.pendingQuestion
    && state.messages.length === 0
    && !state.hasOlderMessages
    && !state.isMessagesLoading
    && !state.partialText
    && !state.isSending
    && state.stream === "idle"
    && !state.error
    && !state.retryAvailable
    && !state.incomplete
    && !state.statusCode;

  return (
    <div className="companion-conversation">
      <div className={`companion-conversation-body${isEmptyConversation ? " companion-conversation-body-empty" : ""}`}>
        {state.memoryOperations.filter((operation) => operation.conversationId === state.activeConversation?.id).map((operation) => <div className="companion-memory-confirmation" role="status" key={operation.operationId}>
          <span>{operation.action === "CREATED" ? "Đã lưu vào bộ nhớ." : operation.action === "UPDATED" ? "Đã cập nhật bộ nhớ." : "Đã quên thông tin này."}</span>
          <Button type="button" variant="ghost" className="companion-text-action" onClick={() => setMode("memory")}>Xem bộ nhớ</Button>
        </div>)}
        <MessageList />
        {isEmptyConversation ? (
          <div className="companion-conversation-empty">
            <div className="companion-conversation-empty-content">
              <img src="/assets/engo/engo-welcome.webp" alt="" />
              <h3>Một cuộc trò chuyện mới</h3>
              <p>Hãy bắt đầu bằng một câu hỏi tiếng Anh.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
