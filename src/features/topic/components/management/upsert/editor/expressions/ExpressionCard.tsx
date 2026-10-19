import { Copy, Pencil, Trash2 } from "lucide-react";
import { cn } from "@shared/utils";
import type { TopicExpressionExample } from "@features/topic/types/topic-create.types";
import ExpressionAudioChip from "./ExpressionAudioChip";

interface ExpressionCardProps {
  example: TopicExpressionExample;
  vocabWords: string[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPreviewAudio: () => void;
}

function typePill(type: TopicExpressionExample["type"]): {
  label: string;
  className: string;
} {
  switch (type) {
    case "BASIC_SUGGESTION":
      return {
        label: "Căn bản • Basic",
        className: "bg-surface-container-low text-primary",
      };
    case "POLITE_INQUIRY":
      return {
        label: "Lịch sự • Polite",
        className: "bg-surface-container-low text-tertiary",
      };
    case "SLOT_PATTERN":
      return {
        label: "Mẫu thế chỗ • Slot",
        className: "bg-secondary-fixed/60 text-on-secondary-fixed",
      };
  }
}

function renderSlotText(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <span
        key={`slot-${index}`}
        className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary"
      >
        {part}
      </span>
    ) : (
      <span key={`text-${index}`}>{part}</span>
    ),
  );
}

export default function ExpressionCard({
  example,
  vocabWords,
  onEdit,
  onDelete,
  onDuplicate,
  onPreviewAudio,
}: ExpressionCardProps) {
  const pill = typePill(example.type);

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="mb-3 flex items-start justify-between gap-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-label-sm font-semibold",
              pill.className,
            )}
          >
            {pill.label}
          </span>
          <div className="flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(example.id)}
              title="Chỉnh sửa"
              aria-label={`Chỉnh sửa mẫu câu ${example.textEn}`}
              className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <Pencil className="size-[18px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(example.id)}
              title="Nhân bản"
              aria-label={`Nhân bản mẫu câu ${example.textEn}`}
              className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <Copy className="size-[18px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(example.id)}
              title="Xóa"
              aria-label={`Xóa mẫu câu ${example.textEn}`}
              className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-outline transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              <Trash2 className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mb-3">
          <h3 className="mb-1 text-headline-sm tracking-tight text-on-surface">
            &ldquo;{renderSlotText(example.textEn)}&rdquo;
          </h3>
          <p className="text-body-md text-on-surface-variant">{example.textVi}</p>
        </div>
        {example.usageNote.trim().length > 0 && (
          <div className="mb-4 rounded-xl bg-surface-container-low p-3 text-[14px] text-on-surface-variant">
            <strong className="mb-0.5 block font-medium text-on-surface">
              Ý nghĩa &amp; Cách dùng:
            </strong>
            {example.usageNote}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3">
        <ExpressionAudioChip
          audioFile={example.audioFile}
          onPreview={onPreviewAudio}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-label-sm text-on-surface-variant">
            {vocabWords.length > 0 ? "Từ khóa:" : "Chưa liên kết từ vựng"}
          </span>
          {vocabWords.map((word) => (
            <span
              key={word}
              className="rounded-md bg-tertiary-fixed px-2 py-0.5 text-label-sm font-semibold text-on-tertiary-fixed"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
