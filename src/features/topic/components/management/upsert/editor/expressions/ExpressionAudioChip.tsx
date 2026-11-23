import { useState } from "react";
import { Play, VolumeX } from "lucide-react";
import { cn } from "@shared/utils";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";

interface ExpressionAudioChipProps {
  audioFile: string | null;
  onPreview: () => void;
  readOnly?: boolean;
}

export default function ExpressionAudioChip({
  audioFile,
  onPreview,
  readOnly = false,
}: ExpressionAudioChipProps) {
  const [previewing, setPreviewing] = useState(false);

  const handlePreview = () => {
    if (!audioFile || previewing) return;
    setPreviewing(true);
    onPreview();
    window.setTimeout(() => setPreviewing(false), 1200);
  };

  if (!audioFile) {
    return (
      <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface-variant">
        <VolumeX className="size-4 shrink-0" aria-hidden="true" />
        <span>{readOnly ? "Chưa có audio" : "Chưa gắn audio — vẫn lưu nháp được"}</span>
      </span>
    );
  }

  const source = readOnly ? playableManagementMediaUrl(audioFile) : null;

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface">
      {readOnly && source ? (
        <audio controls preload="none" src={source} className="max-w-full" aria-label={`Phát ${audioFile}`} />
      ) : readOnly ? null : <button
        type="button"
        title="Nghe thử audio"
        aria-label={`Nghe thử ${audioFile}`}
        onClick={handlePreview}
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-transform hover:scale-105"
      >
        <Play
          className={cn("size-3.5", previewing && "animate-pulse")}
          aria-hidden="true"
        />
      </button>}
      <span className="min-w-0 truncate font-mono text-[12px]">{audioFile}</span>
    </span>
  );
}
