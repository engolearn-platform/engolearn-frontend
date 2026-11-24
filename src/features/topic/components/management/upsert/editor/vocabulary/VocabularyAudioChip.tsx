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
  const source = playableManagementMediaUrl(fileName);

  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface">
      {source && <audio controls preload="none" src={source} onPlay={onPreview} className="max-w-full" aria-label="Phát âm" />}
      <span className="min-w-0 truncate font-medium">{fileName}</span>
      {!readOnly && uploaded && fileName.startsWith("topic-media:") && (
        <span className="shrink-0 text-on-surface-variant">Audio đã tải lên</span>
      )}
    </div>
  );
}
