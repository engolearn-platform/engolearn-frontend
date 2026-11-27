import { useEffect, useState } from "react";
import { Copy, Pencil, Trash2, VolumeX } from "lucide-react";
import { cn } from "@shared/utils";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";
import {
  expressionLabel,
  expressionTypeLabel,
} from "@features/topic/utils/topic-expression-presentation";

export interface ExpressionCardExample {
  type: string | null;
  label?: string | null;
  textEn: string;
  textVi: string;
  usageNote: string;
  audioFile: string | null;
  linkedVocabIds: string[];
}

interface ExpressionCardProps {
  example: ExpressionCardExample;
  vocabLinks: { id: string; word: string }[];
  unresolvedVocabIds?: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPreviewAudio: () => void;
  readOnly?: boolean;
  minorMode?: boolean;
}

function classificationClass(type: string | null) {
  if (type === "SLOT_PATTERN") return "bg-secondary-fixed/60 text-on-secondary-fixed";
  if (type === "POLITE_INQUIRY") return "bg-surface-container-low text-tertiary";
  if (type === "BASIC_SUGGESTION") return "bg-surface-container-low text-primary";
  return "bg-surface-container-low text-on-surface-variant";
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

function ExpressionAudio({ audioFile, onPreview }: { audioFile: string | null; onPreview: () => void }) {
  const [failed, setFailed] = useState(false);
  const source = playableManagementMediaUrl(audioFile);

  useEffect(() => setFailed(false), [source]);

  if (!audioFile?.trim()) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface-variant">
        <VolumeX className="size-4 shrink-0" aria-hidden="true" />
        Chưa có audio
      </span>
    );
  }

  return (
    <div className="grid min-w-0 gap-1">
      {source ? (
        <audio controls preload="none" src={source} onPlay={onPreview} onError={() => setFailed(true)} onCanPlay={() => setFailed(false)} className="max-w-full" aria-label="Phát audio mẫu câu" />
      ) : (
        <span className="text-label-sm text-error">Nguồn âm thanh không hợp lệ.</span>
      )}
      {failed && <p role="alert" aria-live="assertive" className="break-words text-label-sm text-error">Không thể tải hoặc phát âm thanh này.</p>}
    </div>
  );
}

export default function ExpressionCard({
  example,
  vocabLinks,
  unresolvedVocabIds = [],
  onEdit,
  onDelete,
  onDuplicate,
  onPreviewAudio,
  readOnly = false,
  minorMode = false,
}: ExpressionCardProps) {
  const knownType = expressionTypeLabel(example.type);
  const knownLabel = expressionLabel(example.label);
  const unknownType = example.type && !knownType ? example.type : null;
  const unknownLabel = example.label && !knownLabel ? example.label : null;

  return (
    <article className="group flex min-w-0 flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-label-sm font-semibold", classificationClass(example.type))}>
              {knownType ?? (example.type ? "Loại mẫu câu chưa hỗ trợ" : "Chưa có phân loại")}
            </span>
            {knownLabel && <span className="rounded-md bg-surface-container-low px-2.5 py-1 text-label-sm font-semibold text-on-surface-variant">Nhãn: {knownLabel}</span>}
            {unknownLabel && <span className="rounded-md bg-surface-container-low px-2.5 py-1 text-label-sm text-on-surface-variant">Nhãn chưa hỗ trợ</span>}
          </div>
          {!readOnly && <div className="flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={onEdit} title="Chỉnh sửa" aria-label={`Chỉnh sửa mẫu câu ${example.textEn}`} className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container">
              <Pencil className="size-[18px]" aria-hidden="true" />
            </button>
            {!minorMode && <button type="button" onClick={onDuplicate} title="Nhân bản" aria-label={`Nhân bản mẫu câu ${example.textEn}`} className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container">
              <Copy className="size-[18px]" aria-hidden="true" />
            </button>}
            {!minorMode && <button type="button" onClick={onDelete} title="Xóa" aria-label={`Xóa mẫu câu ${example.textEn}`} className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-outline transition-colors hover:bg-error-container hover:text-on-error-container">
              <Trash2 className="size-[18px]" aria-hidden="true" />
            </button>}
          </div>}
        </div>
        <div className="mb-3 min-w-0">
          <h3 className="mb-1 break-words whitespace-pre-wrap text-headline-sm tracking-tight text-on-surface">{renderSlotText(example.textEn)}</h3>
          {example.textVi.trim() && <p className="break-words whitespace-pre-wrap text-body-md text-on-surface-variant">{renderSlotText(example.textVi)}</p>}
        </div>
        {example.usageNote.trim() && (
          <div className="mb-4 rounded-xl bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
            <strong className="mb-0.5 block font-medium text-on-surface">Ý nghĩa &amp; Cách dùng:</strong>
            <span className="whitespace-pre-wrap break-words">{example.usageNote}</span>
          </div>
        )}
        {unknownType && <details className="mb-3 text-label-sm text-on-surface-variant"><summary className="cursor-pointer">Chi tiết loại mẫu câu chưa hỗ trợ</summary><code className="break-all">{unknownType}</code></details>}
        {unknownLabel && <details className="mb-3 text-label-sm text-on-surface-variant"><summary className="cursor-pointer">Chi tiết nhãn chưa hỗ trợ</summary><code className="break-all">{unknownLabel}</code></details>}
      </div>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-2.5 pt-3">
        <ExpressionAudio audioFile={example.audioFile} onPreview={onPreviewAudio} />
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {vocabLinks.length > 0 && <span className="text-label-sm text-on-surface-variant">Từ vựng:</span>}
          {vocabLinks.map(({ id, word }, index) => <span key={`${id}-${index}`} className="rounded-md bg-tertiary-fixed px-2 py-0.5 text-label-sm font-semibold text-on-tertiary-fixed">{word}</span>)}
          {vocabLinks.length === 0 && unresolvedVocabIds.length === 0 && <span className="text-label-sm text-on-surface-variant">Chưa liên kết từ vựng</span>}
          {unresolvedVocabIds.length > 0 && <span className="text-label-sm text-on-surface-variant">{unresolvedVocabIds.length} liên kết từ vựng chưa phân giải</span>}
        </div>
      </div>
      {unresolvedVocabIds.length > 0 && <details className="mt-2 text-label-sm text-on-surface-variant"><summary className="cursor-pointer">Xem mã liên kết chưa phân giải</summary><ul className="mt-1 list-inside list-disc break-all">{unresolvedVocabIds.map((id, index) => <li key={`${id}-${index}`}><code>{id}</code></li>)}</ul></details>}
    </article>
  );
}
