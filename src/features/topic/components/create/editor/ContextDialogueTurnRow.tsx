import { Trash2 } from "lucide-react";
import { cn } from "@shared/utils";
import type { ContextDialogueTurn } from "../../../types/topic-create.types";

interface ContextDialogueTurnRowProps {
  turn: ContextDialogueTurn;
  onChange: (patch: Partial<ContextDialogueTurn>) => void;
  onRemove: () => void;
}

export default function ContextDialogueTurnRow({
  turn,
  onChange,
  onRemove,
}: ContextDialogueTurnRowProps) {
  const isLearner = turn.role === "learner";

  const speakerLabel = turn.speaker.trim() || "người nói";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 shadow-sm",
        isLearner ? "bg-primary-fixed/20" : "bg-surface-container-lowest",
      )}
    >
      <div className="max-w-24 shrink-0 pt-1.5">
        <input
          type="text"
          value={turn.speaker}
          maxLength={16}
          onChange={(event) => onChange({ speaker: event.target.value })}
          placeholder="Tên…"
          aria-label="Tên người nói"
          className={cn(
            "w-full rounded text-center bg-transparent px-2 py-1 text-label-sm font-semibold uppercase outline-none placeholder:text-outline focus:ring-2 focus:ring-primary",
            isLearner
              ? "bg-primary text-on-primary placeholder:text-on-primary/60"
              : "bg-surface-container text-tertiary",
          )}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <input
          type="text"
          value={turn.textEn}
          onChange={(event) => onChange({ textEn: event.target.value })}
          placeholder="Câu thoại tiếng Anh…"
          aria-label={`Lời thoại của ${speakerLabel} (tiếng Anh)`}
          className={cn(
            "w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline",
            isLearner && "font-medium",
          )}
        />
        <input
          type="text"
          value={turn.textVi}
          onChange={(event) => onChange({ textVi: event.target.value })}
          placeholder="Nghĩa tiếng Việt…"
          aria-label="Nghĩa tiếng Việt của lời thoại"
          className="w-full bg-transparent text-label-sm text-on-surface-variant italic outline-none placeholder:text-outline"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Xóa dòng thoại"
        aria-label="Xóa dòng thoại"
        className="rounded p-1 text-outline transition-colors hover:text-error"
      >
        <Trash2 className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}
