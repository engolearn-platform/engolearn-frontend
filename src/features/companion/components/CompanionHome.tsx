import { BookOpen, ChevronRight, MessageCircle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useCompanion } from "../state/CompanionProvider";
import { ConversationHistory } from "./ConversationHistory";

const starters = [
  { prompt: "Giải thích một điểm ngữ pháp tiếng Anh", Icon: BookOpen },
  { prompt: "Cùng mình luyện từ vựng tiếng Anh", Icon: MessageCircle },
];

export function CompanionHome() {
  const { state, setDraft, setMode } = useCompanion();

  return (
    <div className="companion-home">
      <div className="companion-welcome">
        <img src="/assets/engo/engo-welcome.webp" alt="" className="companion-welcome-mascot" />
        <div>
          <h3>Hôm nay mình học gì?</h3>
          <p>Hỏi Engo bất cứ điều gì về tiếng Anh nhé.</p>
        </div>
      </div>
      <div className="companion-starters">
        <h4>Bắt đầu với một câu hỏi</h4>
        {starters.map(({ prompt, Icon }) => (
          <Button key={prompt} type="button" variant="outline" disabled={state.draft.length > 0} onClick={() => setDraft(prompt)}>
            <Icon aria-hidden="true" /><span>{prompt}</span><ChevronRight aria-hidden="true" />
          </Button>
        ))}
      </div>
      {state.isHomeLoading ? <p className="companion-muted" role="status">Đang tải trò chuyện gần đây…</p> : null}
      {state.error ? <p className="companion-inline-error" role="alert">{state.error}</p> : null}
      <section className="companion-recent" aria-labelledby="companion-recent-heading">
        <div className="companion-section-heading">
          <h3 id="companion-recent-heading">Gần đây</h3>
          <Button type="button" variant="ghost" className="companion-text-action" onClick={() => setMode("history")}>Xem tất cả</Button>
        </div>
        {!state.isHomeLoading && (state.recentConversations.length > 0 ? (
          <ConversationHistory compact conversations={state.recentConversations} />
        ) : (
          <div className="companion-empty-state">
            <MessageCircle aria-hidden="true" />
            <p>Các cuộc trò chuyện của bạn sẽ xuất hiện tại đây.</p>
          </div>
        ))}
      </section>
      <div className="companion-home-tools">
        <Button type="button" variant="ghost" className="companion-text-action" onClick={() => setMode("memory")}><SlidersHorizontal aria-hidden="true" />Những điều Engo nhớ</Button>
      </div>
    </div>
  );
}
