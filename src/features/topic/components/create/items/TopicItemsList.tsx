import { Plus } from "lucide-react";
import { EmptyState } from "@shared/components";
import type { TopicItemOverview } from "../../../types/topic-create.types";
import TopicItemCard from "./TopicItemCard";

interface TopicItemsListProps {
  items: TopicItemOverview[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onInit: (id: string) => void;
  onAdd: () => void;
}

export default function TopicItemsList({
  items,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onInit,
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
        items.map((item) => (
          <TopicItemCard
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onInit={onInit}
          />
        ))
      )}
      <button
        type="button"
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
