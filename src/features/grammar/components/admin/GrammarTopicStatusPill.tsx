import { cn } from "@shared/utils";
import type { GrammarTopicStatus } from "@features/grammar/types/grammar-topic-management.types";

const STATUS_STYLES: Record<GrammarTopicStatus, string> = {
  published: "bg-primary/10 text-primary",
  in_progress: "bg-secondary-container/50 text-on-secondary-container",
  draft: "bg-surface-container-high text-on-surface-variant",
};

const STATUS_LABELS: Record<GrammarTopicStatus, string> = {
  published: "Đã xuất bản",
  in_progress: "Đang soạn",
  draft: "Bản nháp",
};

interface GrammarTopicStatusPillProps {
  status: GrammarTopicStatus;
}

export function GrammarTopicStatusPill({ status }: GrammarTopicStatusPillProps) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-1 text-label-sm font-semibold",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
