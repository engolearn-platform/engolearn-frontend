import { VolumeX } from "lucide-react";
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
  if (!audioFile) {
    return (
      <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface-variant">
        <VolumeX className="size-4 shrink-0" aria-hidden="true" />
        <span>{readOnly ? "Chưa có audio" : "Chưa gắn audio — vẫn lưu nháp được"}</span>
      </span>
    );
  }

  const source = playableManagementMediaUrl(audioFile);

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface">
      {source && <audio controls preload="none" src={source} onPlay={onPreview} className="max-w-full" aria-label="Phát audio" />}
      <span className="min-w-0 truncate font-mono text-[12px]">{audioFile}</span>
    </span>
  );
}
