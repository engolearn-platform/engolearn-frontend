import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { ConversationHistory } from "./ConversationHistory";

export function CompanionHome() {
  const { state, createConversation, setMode } = useCompanion();

  const startNewChat = async () => {
    const conversation = await createConversation();
    if (conversation) setMode("conversation");
  };

  return (
    <div className="companion-home">
      <div className="companion-welcome">
        <img src="/landing/penguin-hero.webp" alt="" className="companion-welcome-mascot" />
        <h3>Xin chào, mình là Engo!</h3>
        <p>Cùng luyện tiếng Anh theo cách bạn muốn nhé.</p>
        <Button type="button" className="companion-primary-action" onClick={() => void startNewChat()}>
          <Plus aria-hidden="true" />
          Trò chuyện mới
        </Button>
      </div>

      <section className="companion-recent" aria-labelledby="companion-recent-heading">
        <div className="companion-section-heading">
          <h3 id="companion-recent-heading">Trò chuyện gần đây</h3>
          <Button type="button" variant="ghost" className="companion-text-action" onClick={() => setMode("history")}>
            Xem tất cả
          </Button>
        </div>
        {state.isHomeLoading ? (
          <p className="companion-muted" role="status">Đang tải trò chuyện gần đây…</p>
        ) : state.recentConversations.length > 0 ? (
          <ConversationHistory compact conversations={state.recentConversations} />
        ) : (
          <div className="companion-empty-state">
            <MessageCircle aria-hidden="true" />
          <p>Các cuộc trò chuyện của bạn sẽ xuất hiện tại đây.</p>
          </div>
        )}
        {state.error ? <p className="companion-inline-error" role="alert">{state.error}</p> : null}
      </section>
    </div>
  );
}
