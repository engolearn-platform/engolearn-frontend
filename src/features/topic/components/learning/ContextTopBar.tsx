import { ArrowLeft, User, X } from "lucide-react";

export interface ContextTopBarProps {
  topicTitle: string;
  stageLabel: string;
  onBack: () => void;
  onClose: () => void;
}

export function ContextTopBar({
  topicTitle,
  stageLabel,
  onBack,
  onClose,
}: ContextTopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-surface-container-lowest/90 shadow-[0_1px_8px_rgb(0,0,0,0.04)] backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <ArrowLeft className="size-5" />
            <span>Quay lại Chủ đề</span>
          </button>
          <div className="hidden h-4 w-px shrink-0 bg-outline-variant/50 sm:block" />
          <div className="min-w-0">
            <div className="truncate text-headline-sm font-semibold text-on-surface">
              {topicTitle}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 md:flex">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            <span className="text-label-sm text-on-surface-variant">
              {stageLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Thoát phiên học"
              className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <X className="size-5" />
            </button>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary">
              <User className="size-[18px] text-on-primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
