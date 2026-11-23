import { useState } from "react";
import { BadgeCheck, Volume2 } from "lucide-react";
import { cn } from "@shared/utils";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";

interface VocabularyAudioChipProps {
  fileName: string;
  uploaded: boolean;
  onPreview: () => void;
  readOnly?: boolean;
}

export default function VocabularyAudioChip({
  fileName,
  uploaded,
  onPreview,
  readOnly = false,
}: VocabularyAudioChipProps) {
  const [previewing, setPreviewing] = useState(false);

  const handlePreview = () => {
    if (previewing) return;
    setPreviewing(true);
    onPreview();
    window.setTimeout(() => setPreviewing(false), 1200);
  };

  const source = readOnly ? playableManagementMediaUrl(fileName) : null;

  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface">
      {readOnly && source ? (
        <audio controls preload="none" src={source} className="max-w-full" aria-label={`Phát âm ${fileName}`} />
      ) : readOnly ? null : <button
        type="button"
        title="Phát âm thử"
        aria-label={`Phát âm thử ${fileName}`}
        onClick={handlePreview}
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-transform hover:scale-105"
      >
        <Volume2
          className={cn("size-4", previewing && "animate-pulse")}
          aria-hidden="true"
        />
      </button>}
      <span className="min-w-0 truncate font-medium">{fileName}</span>
      {!readOnly && uploaded && (
        <BadgeCheck
          className="size-4 shrink-0 text-primary"
          aria-label="File chuẩn chất lượng cao"
        />
      )}
      {!readOnly && <span className="text-outline-variant" aria-hidden="true">
        ·
      </span>}
      {!readOnly && <span className="shrink-0 text-on-surface-variant">Đã tải lên</span>}
    </div>
  );
}
