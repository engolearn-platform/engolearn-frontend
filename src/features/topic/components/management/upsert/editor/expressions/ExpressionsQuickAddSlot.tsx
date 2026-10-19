import { Plus } from "lucide-react";

interface ExpressionsQuickAddSlotProps {
  visible: boolean;
  onAdd: () => void;
}

export default function ExpressionsQuickAddSlot({
  visible,
  onAdd,
}: ExpressionsQuickAddSlotProps) {
  if (!visible) return null;
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onAdd}
        className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest px-4 py-6 shadow-sm transition-all hover:bg-surface-container-low"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
          <Plus className="size-6" aria-hidden="true" />
        </span>
        <span className="text-center text-label-lg font-semibold text-primary group-hover:text-primary-container">
          + Thêm mẫu câu mới (tối đa 3 nhóm, mỗi nhóm 3 mẫu câu)
        </span>
        <span className="text-center text-label-sm text-on-surface-variant">
          Bấm để mở biểu mẫu thêm mẫu câu giao tiếp
        </span>
      </button>
    </div>
  );
}
