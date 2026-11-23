import { Check, Circle, LockKeyhole, Pencil } from "lucide-react";
import { cn } from "@shared/utils";
import type { GrammarStudyStatus } from "@features/grammar/types/grammar.types";

const statuses = {
  NOT_STARTED: { label: "Chưa học", Icon: Circle, tone: "bg-surface-container-low text-on-surface-variant" },
  IN_PROGRESS: { label: "Đang học", Icon: Pencil, tone: "bg-learning-note text-learning-note-ink" },
  COMPLETED: { label: "Hoàn thành", Icon: Check, tone: "bg-learning-mint text-primary" },
  LOCKED: { label: "Chưa mở khóa", Icon: LockKeyhole, tone: "bg-surface-container-low text-on-surface-variant" },
} as const;

export default function StatusBadge({ status }: { status: GrammarStudyStatus | "LOCKED" }) {
  const { label, Icon, tone } = statuses[status];
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-label-lg font-semibold", tone)}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  );
}
