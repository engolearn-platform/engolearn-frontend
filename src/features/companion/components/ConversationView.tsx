import { RotateCw } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { MessageList } from "./MessageList";

export function ConversationView() {
  const { state, retryTurn, setMode } = useCompanion();
  const isEmptyConversation = Boolean(state.activeConversation)
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
      {state.error ? <p className="companion-inline-error" role="alert">{state.error}</p> : null}
      {state.retryAvailable ? (
        <div className="companion-retry-row">
          <p>Câu trả lời chưa hoàn tất. Bạn có thể thử lại một lần.</p>
          <Button type="button" variant="outline" disabled={state.isSending} onClick={() => void retryTurn()}>
            <RotateCw aria-hidden="true" />
            Thử lại
          </Button>
        </div>
      ) : null}
      {state.stream === "idle" && state.statusCode === "STOPPED" ? (
        <p className="companion-processing" role="status">Đã dừng phản hồi.</p>
      ) : null}
      {state.stream === "idle" && state.statusCode === "INTERRUPTED" ? (
        <p className="companion-processing" role="status">Kết nối bị gián đoạn. Lịch sử đã được kiểm tra.</p>
      ) : null}
      <div className={`companion-conversation-body${isEmptyConversation ? " companion-conversation-body-empty" : ""}`}>
        {state.memoryOperations.filter((operation) => operation.conversationId === state.activeConversation?.id).map((operation) => <div className="companion-memory-confirmation" role="status" key={operation.operationId}>
          <span>{operation.action === "CREATED" ? "Đã lưu vào bộ nhớ." : operation.action === "UPDATED" ? "Đã cập nhật bộ nhớ." : "Đã quên thông tin này."}</span>
          <Button type="button" variant="ghost" className="companion-text-action" onClick={() => setMode("memory")}>Xem bộ nhớ</Button>
        </div>)}
        <MessageList />
        {isEmptyConversation ? (
          <div className="companion-conversation-empty">
            <div className="companion-conversation-empty-content">
              <img src="/landing/penguin-hero.webp" alt="" />
              <h3>Một cuộc trò chuyện mới</h3>
              <p>Hãy bắt đầu bằng một câu hỏi tiếng Anh.</p>
            </div>
          </div>
        ) : null}
        {state.stream === "connecting" ? <p className="companion-processing" aria-hidden="true">Engo đang xử lý…</p> : null}
        {state.stream === "streaming" && !state.partialText ? (
          <p className="companion-processing" aria-hidden="true">
            {state.statusCode === "ASSESSMENT_LOOKUP" ? "Đang xem kết quả học tập…" : "Engo đang xử lý…"}
          </p>
        ) : null}
        {state.stream === "reconciling" ? <p className="companion-processing" aria-hidden="true">Đang đồng bộ tin nhắn…</p> : null}
      </div>
    </div>
  );
}
