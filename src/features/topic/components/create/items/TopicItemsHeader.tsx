import { Clock, PlusCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface TopicItemsHeaderProps {
  titleEn: string;
  cefrBadge: string;
  draftBadge?: string;
  countNote: string;
  onAdd: () => void;
}

export default function TopicItemsHeader({
  titleEn,
  cefrBadge,
  draftBadge = "Bản nháp",
  countNote,
  onAdd,
}: TopicItemsHeaderProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="max-w-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 text-label-sm font-semibold tracking-wider text-on-primary-fixed uppercase">
            {cefrBadge}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm font-semibold tracking-wide text-on-secondary-fixed">
            <span
              className="size-1.5 rounded-full bg-secondary"
              aria-hidden="true"
            />
            {draftBadge}
          </span>
        </div>
        <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">
          Chủ đề: {titleEn}
        </h1>
        <p className="flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Clock className="size-4" aria-hidden="true" />
          {countNote}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Button
          type="button"
          onClick={onAdd}
          className="w-full rounded-xl bg-primary text-on-primary hover:bg-primary-container sm:w-auto"
        >
          <PlusCircle className="size-5" aria-hidden="true" />
          Thêm Topic Item mới
        </Button>
      </div>
      </div>
    </div>
  );
}
