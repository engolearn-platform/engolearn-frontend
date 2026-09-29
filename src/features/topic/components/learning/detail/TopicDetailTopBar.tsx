import { ArrowLeft } from "lucide-react";

export interface TopicDetailTopBarProps {
  parentLabel: string;
  topicTitle: string;
  onBack: () => void;
}

export function TopicDetailTopBar({
  parentLabel,
  topicTitle,
  onBack,
}: TopicDetailTopBarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-lg p-2 text-primary transition-colors hover:bg-surface-container-low"
        >
          <ArrowLeft className="size-5 shrink-0" />
          <span className="truncate text-headline-sm font-semibold">
            {parentLabel} / {topicTitle}
          </span>
        </button>
      </div>
    </header>
  );
}
