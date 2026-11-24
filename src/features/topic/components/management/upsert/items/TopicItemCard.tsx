import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils";
import type { TopicItemOverview } from "@features/topic/types/topic-create.types";
import { getTopicItemCompleteness } from "@features/topic/types/topic-create.types";
import TopicItemStatusPill from "./TopicItemStatusPill";
import TopicItemStepPills from "./TopicItemStepPills";

interface TopicItemCardProps {
  item: TopicItemOverview;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete?: () => void;
  onMetadata?: () => void;
  onVisibility?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disabled?: boolean;
}

function formatOrder(order: number): string {
  return order.toString().padStart(2, "0");
}

export default function TopicItemCard({
  item,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onMetadata,
  onVisibility,
  onMoveUp,
  onMoveDown,
  disabled,
}: TopicItemCardProps) {
  const completeness = getTopicItemCompleteness(item.steps);
  const hasAnyContent = item.steps.length > 0;

  return (
    <article
      onClick={() => onSelect(item.id)}
      className={cn(
        "relative rounded-xl bg-surface-container-lowest p-5 transition-all md:p-6",
        selected ? "shadow-md" : "shadow-sm hover:shadow-md",
      )}
    >
      {selected && (
        <span
          className="absolute top-3 bottom-3 left-0 w-1.5 rounded-r-full bg-secondary-container"
          aria-hidden="true"
        />
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-2 sm:flex-col">
          {onMoveUp && <Button type="button" variant="ghost" size="sm" aria-label={`Đưa ${item.titleEn} lên`} disabled={disabled} onClick={onMoveUp}><ArrowUp aria-hidden="true" /></Button>}
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-headline-sm font-bold",
              selected
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-high text-on-surface",
            )}
            aria-hidden="true"
          >
            {formatOrder(item.order)}
          </div>
          {onMoveDown && <Button type="button" variant="ghost" size="sm" aria-label={`Đưa ${item.titleEn} xuống`} disabled={disabled} onClick={onMoveDown}><ArrowDown aria-hidden="true" /></Button>}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col min-w-0 items-center gap-2.5">
              {/* {selected && (
                <span className="rounded bg-primary-container px-2 py-0.5 text-label-sm font-bold text-on-primary-container uppercase">
                  Đang chọn
                </span>
              )} */}
              <h2 className="truncate text-headline-md font-bold text-on-surface">
                {item.titleEn}
              </h2>
              <p className="hidden self-start text-body-md text-on-surface-variant md:inline">
                {item.titleVi}
              </p>
            </div>
            <TopicItemStatusPill
              publicationStatus={item.publicationStatus}
              completeness={completeness}
              hasAnyContent={hasAnyContent}
            />
          </div>
          <p className="text-body-md text-on-surface-variant">
            {item.description}
          </p>
          {hasAnyContent && <TopicItemStepPills steps={item.steps} />}
          {item.durationMinutes != null && <p className="text-label-sm text-on-surface-variant">{item.durationMinutes} phút</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pt-3">
        {item.updatedNote && (
          <span className="text-label-sm text-on-surface-variant italic">
            {item.updatedNote}
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(item.id)}><Eye aria-hidden="true" /> Nội dung</Button>
          {onMetadata && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onMetadata}><Pencil aria-hidden="true" /> Sửa thông tin</Button>}
          {onVisibility && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onVisibility}>{item.publicationStatus === "HIDDEN" ? "Hiện bài học" : "Ẩn bài học"}</Button>}
          {onDelete && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onDelete} className="text-error"><Trash2 aria-hidden="true" /> Xóa</Button>}
        </div>
      </div>
    </article>
  );
}
