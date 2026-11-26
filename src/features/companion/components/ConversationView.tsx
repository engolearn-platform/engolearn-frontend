import { RotateCw } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { MessageList } from "./MessageList";

export function ConversationView() {
  const { state, retryTurn, setMode } = useCompanion();
  const title = state.activeConversation?.title?.trim() || "Cuộc trò chuyện";

  return (
    <div className="companion-conversation">
      <div className="companion-conversation-title">
        <h3>{title}</h3>
      </div>
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
      <div className="companion-conversation-body">
        {state.memoryOperations.filter((operation) => operation.conversationId === state.activeConversation?.id).map((operation) => <div className="companion-memory-confirmation" role="status" key={operation.operationId}>
          <span>{operation.action === "CREATED" ? "Đã lưu vào bộ nhớ." : operation.action === "UPDATED" ? "Đã cập nhật bộ nhớ." : "Đã quên thông tin này."}</span>
          <Button type="button" variant="ghost" className="companion-text-action" onClick={() => setMode("memory")}>Xem bộ nhớ</Button>
        </div>)}
        <MessageList />
        {state.messages.length === 0 && !state.isMessagesLoading && !state.partialText ? (
          <p className="companion-conversation-empty">Hãy bắt đầu bằng một câu hỏi tiếng Anh.</p>
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
