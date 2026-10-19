import { Plus } from "lucide-react";

interface VocabularyQuickAddSlotProps {
  visible: boolean;
  nextIndex: number;
  max: number;
  onAdd: () => void;
}

export default function VocabularyQuickAddSlot({
  visible,
  nextIndex,
  max,
  onAdd,
}: VocabularyQuickAddSlotProps) {
  if (!visible) return null;
  return (
    <div className="mb-8 w-full">
      <button
        type="button"
        onClick={onAdd}
        className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest px-4 py-6 shadow-sm transition-all hover:bg-surface-container-low"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
          <Plus className="size-6" aria-hidden="true" />
        </span>
        <span className="text-center text-label-lg font-semibold text-primary group-hover:text-primary-container">
          + Thêm từ vựng thứ {nextIndex} (Tối đa {max} từ để tối ưu khả năng ghi
          nhớ của người học)
        </span>
        <span className="text-center text-label-sm text-on-surface-variant">
          Bấm để mở biểu mẫu cấu trúc hóa nhanh từ vựng
        </span>
      </button>
    </div>
  );
}
