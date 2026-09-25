import { CheckCircle2 } from "lucide-react";

interface TopicCreateWizardHeaderProps {
  draftLabel?: string;
  autosaveText?: string;
}

export default function TopicCreateWizardHeader({
  draftLabel = "Bản nháp (Draft)",
  autosaveText = "Tự động lưu cách đây 1 phút",
}: TopicCreateWizardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <span className="text-label-sm font-semibold tracking-wider text-primary uppercase">
          Quy trình biên soạn giáo trình
        </span>
        <h1 className="mt-0.5 text-headline-md font-semibold text-on-surface">
          Bước 1: Thông tin cơ bản của Chủ đề
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/50 px-3 py-1 text-label-sm font-semibold text-on-secondary-fixed">
          <span className="size-2 rounded-full bg-secondary-container" aria-hidden="true" />
          {draftLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          {autosaveText}
        </span>
      </div>
    </div>
  );
}
