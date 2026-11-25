import { useState } from "react";
import { Clock3, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/shadcn/dialog";
import type { CompanionConversation } from "../types/companion.types";
import { useCompanion } from "../state/CompanionProvider";

interface ConversationHistoryProps {
  compact?: boolean;
  conversations?: CompanionConversation[];
}

function displayTitle(conversation: CompanionConversation) {
  return conversation.title?.trim() || "Cuộc trò chuyện mới";
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export function ConversationHistory({ compact = false, conversations }: ConversationHistoryProps) {
  const {
    state,
    openConversation,
    loadMoreHistory,
    deleteConversation,
  } = useCompanion();
  const [pendingDelete, setPendingDelete] = useState<CompanionConversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const items = conversations ?? state.historyConversations;

  const confirmDelete = async () => {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteConversation(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!compact && state.isHistoryLoading && items.length === 0) {
    return <p className="companion-muted" role="status">Đang tải lịch sử trò chuyện…</p>;
  }

  return (
    <>
      <div className={compact ? "companion-history companion-history-compact" : "companion-history"}>
        {items.map((conversation) => (
          <div className="companion-history-row" key={conversation.id}>
            <button
              type="button"
              className="companion-history-open"
              disabled={state.isSending}
              onClick={() => void openConversation(conversation)}
              aria-label={`Mở ${displayTitle(conversation)}`}
            >
              <span className="companion-history-icon" aria-hidden="true"><MessageCircle size={18} /></span>
              <span className="companion-history-copy">
                <span className="companion-history-title">{displayTitle(conversation)}</span>
                <span className="companion-history-meta">
                  <Clock3 size={13} aria-hidden="true" />
                  {formatUpdatedAt(conversation.updatedAt)}
                </span>
              </span>
            </button>
            {!compact ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="companion-icon-button companion-delete-button"
                disabled={state.isSending || isDeleting}
                aria-label={`Xóa ${displayTitle(conversation)}`}
                onClick={() => setPendingDelete(conversation)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ))}
        {!compact && items.length === 0 ? (
          <div className="companion-empty-state">
            <MessageCircle aria-hidden="true" />
            <p>Chưa có cuộc trò chuyện nào.</p>
          </div>
        ) : null}
        {!compact && state.error ? <p className="companion-inline-error" role="alert">{state.error}</p> : null}
        {!compact && state.hasMoreHistory ? (
          <Button
            type="button"
            variant="outline"
            className="companion-load-more"
            disabled={state.isHistoryLoading}
            onClick={() => void loadMoreHistory()}
          >
            {state.isHistoryLoading ? "Đang tải…" : "Tải thêm"}
          </Button>
        ) : null}
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open && !isDeleting) setPendingDelete(null); }}>
        <DialogContent className="companion-delete-dialog">
          <DialogHeader>
            <DialogTitle>Xóa cuộc trò chuyện?</DialogTitle>
            <DialogDescription>
              Cuộc trò chuyện này sẽ bị xóa khỏi lịch sử của bạn. Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {state.error ? <p className="companion-inline-error" role="alert">{state.error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setPendingDelete(null)}>Hủy</Button>
            <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => void confirmDelete()}>
              {isDeleting ? "Đang xóa…" : "Xóa cuộc trò chuyện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
