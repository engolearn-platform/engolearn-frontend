import { GripVertical, ListPlus, SquarePen, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils";
import type { TopicItemOverview } from "../../../types/topic-create.types";
import { getTopicItemCompleteness } from "../../../types/topic-create.types";
import TopicItemStatusPill from "./TopicItemStatusPill";
import TopicItemStepPills from "./TopicItemStepPills";

interface TopicItemCardProps {
  item: TopicItemOverview;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onInit: (id: string) => void;
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
  onInit,
}: TopicItemCardProps) {
  const completeness = getTopicItemCompleteness(item.steps);
  const hasAnyContent = item.steps.length > 0;
  const isEmpty = completeness === "empty" && !hasAnyContent;

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
          <button
            type="button"
            title="Kéo thả để đổi thứ tự"
            onClick={(event) => event.stopPropagation()}
            className="cursor-grab rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface active:cursor-grabbing"
          >
            <GripVertical className="size-[22px]" aria-hidden="true" />
          </button>
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
          {hasAnyContent ? (
            <TopicItemStepPills steps={item.steps} />
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary-fixed/30 px-2.5 py-1 text-label-sm text-on-secondary-fixed">
                <TriangleAlert className="size-[15px]" aria-hidden="true" />
                Chưa thiết lập nội dung bài học
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pt-3">
        {item.updatedNote && (
          <span className="text-label-sm text-on-surface-variant italic">
            {item.updatedNote}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {isEmpty ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onInit(item.id);
              }}
              className="font-semibold text-primary hover:bg-primary-fixed/20 hover:text-primary"
            >
              <ListPlus className="size-[18px]" aria-hidden="true" />
              Khởi tạo nội dung
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(item.id);
              }}
              className="text-on-surface hover:bg-surface-container"
            >
              <SquarePen className="size-[18px]" aria-hidden="true" />
              Sửa nội dung
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item.id);
            }}
            className="text-error hover:bg-error-container/40 hover:text-error"
          >
            <Trash2 className="size-[18px]" aria-hidden="true" />
            Xóa
          </Button>
        </div>
      </div>
    </article>
  );
}
