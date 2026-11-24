import { Plus } from "lucide-react";
import { EmptyState } from "@shared/components";
import type { TopicItemOverview } from "@features/topic/types/topic-create.types";
import TopicItemCard from "./TopicItemCard";

interface TopicItemsListProps {
  items: TopicItemOverview[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMetadata: (id: string) => void;
  onVisibility: (id: string) => void;
  onMove?: (id: string, direction: -1 | 1) => void;
  disabled?: boolean;
  onAdd: () => void;
}

export default function TopicItemsList({
  items,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onMetadata,
  onVisibility,
  onMove,
  disabled,
  onAdd,
}: TopicItemsListProps) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <EmptyState
            title="Chưa có Topic Item nào"
            description="Nhấn “Thêm Topic Item mới” để bắt đầu biên soạn bài học đầu tiên."
          />
        </div>
      ) : (
        items.map((item, index) => (
          <TopicItemCard
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            onSelect={onSelect}
            onEdit={onEdit}
            disabled={disabled}
            onDelete={() => onDelete(item.id)}
            onMetadata={item.publicationStatus === "DRAFT" ? () => onMetadata(item.id) : undefined}
            onVisibility={() => onVisibility(item.id)}
            onMoveUp={onMove && index > 0 ? () => onMove(item.id, -1) : undefined}
            onMoveDown={onMove && index < items.length - 1 ? () => onMove(item.id, 1) : undefined}
          />
        ))
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onAdd}
        className="group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-low p-6 text-center shadow-sm transition-all hover:bg-surface-container-highest"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed transition-transform group-hover:scale-110">
          <Plus className="size-6" aria-hidden="true" />
        </span>
        <span className="text-headline-sm font-semibold text-primary">
          + Thêm Topic Item tiếp theo
        </span>
      </button>
    </div>
  );
}
