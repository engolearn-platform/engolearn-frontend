import {
  ChevronDown,
  CircleCheck,
  Clock3,
  ListChecks,
  Lock,
  Play,
} from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils/cn";
import type {
  TopicUnitItem,
  UnitActionLabels,
} from "../../../types/topic-detail.types";

export interface UnitRowCardProps {
  unit: TopicUnitItem;
  expanded: boolean;
  onToggle: () => void;
  actionLabels: UnitActionLabels;
  onStart?: () => void;
}

function CountChip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-label-sm text-on-surface-variant">
      {label}
    </span>
  );
}

function VocabPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-outline-variant bg-surface-bright px-2.5 py-1 text-label-sm text-on-surface-variant">
      {label}
    </span>
  );
}

function getActionLabel(
  unit: TopicUnitItem,
  labels: UnitActionLabels,
): string | null {
  if (unit.state === "current") return labels.resumeLabel;
  if (unit.state === "available") return labels.startLabel;
  if (unit.state === "completed") {
    return unit.hasUpdates ? labels.restartLabel : labels.reviewLabel;
  }
  return null;
}

export function UnitRowCard({
  unit,
  expanded,
  onToggle,
  actionLabels,
  onStart,
}: UnitRowCardProps) {
  const isCurrent = unit.state === "current";
  const isCompleted = unit.state === "completed";
  const isAvailable = unit.state === "available";
  const isLocked = unit.state === "locked";
  const expandable = !isLocked;
  const actionLabel = getActionLabel(unit, actionLabels);

  const vocabPills = unit.preview?.vocab ?? [];
  const hasPreviewBox =
    unit.preview !== undefined &&
    (unit.preview.vocab.length > 0 ||
      unit.preview.expressions.length > 0 ||
      unit.preview.practiceLabel !== "");
  const showPreviewBox = expanded && expandable && hasPreviewBox;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface-container-lowest shadow-sm",
        isCurrent && expanded
          ? "border-2 border-primary shadow-[0_4px_20px_rgb(0,101,101,0.08)]"
          : "border-outline-variant",
        isCompleted && "opacity-85 transition-opacity hover:opacity-100",
        isLocked && "opacity-60",
      )}
    >
      {isCurrent && expanded && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-1 bg-primary"
        />
      )}
      <button
        type="button"
        onClick={onToggle}
        disabled={!expandable}
        aria-expanded={expandable ? expanded : undefined}
        className={cn(
          "flex w-full items-center gap-4 p-5 text-left",
          expandable && "cursor-pointer",
        )}
      >
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            isCompleted && "bg-primary-container text-on-primary-container",
            isCurrent && "bg-tertiary-fixed text-on-tertiary-fixed",
            isAvailable && "bg-primary/10 text-primary",
            isLocked && "bg-surface-variant text-on-surface-variant",
          )}
        >
          {isCompleted && <CircleCheck className="size-6" fill="currentColor" />}
          {(isCurrent || isAvailable) && (
            <Play className="size-6" fill="currentColor" />
          )}
          {isLocked && <Lock className="size-5" />}
        </div>

        <div className="min-w-0 flex-grow">
          <h3
            className={cn(
              "text-headline-sm font-semibold",
              isCurrent ? "text-primary" : "text-on-surface",
            )}
          >
            {unit.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
              <Clock3 className="size-4" />
              {unit.durationLabel}
            </span>
            {unit.stateBadge && (
              <span
                className={cn(
                  "text-label-sm",
                  isCompleted
                    ? "rounded bg-primary/10 px-2 py-0.5 font-medium text-primary"
                    : "text-tertiary-container",
                )}
              >
                {unit.stateBadge}
              </span>
            )}
            {unit.hasUpdates && unit.updatesLabel && (
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-label-sm font-medium text-on-secondary-container">
                {unit.updatesLabel}
              </span>
            )}
          </div>
        </div>

        {expandable && (
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-on-surface-variant transition-transform",
              expanded && "rotate-180",
            )}
          />
        )}
      </button>

      <div className="flex flex-col gap-3 px-5 pb-5">
        <p className="text-body-md text-on-surface-variant">
          {unit.description}
        </p>

        {!showPreviewBox && vocabPills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vocabPills.map((word) => (
              <VocabPill key={word} label={word} />
            ))}
          </div>
        )}

        {showPreviewBox && unit.preview && (
          <div className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <h4 className="text-label-lg font-semibold text-on-surface">
              Nội dung bài học:
            </h4>
            <div className="flex flex-col gap-2 text-body-md text-on-surface-variant">
              {unit.preview.vocab.length > 0 && (
                <div>
                  <span className="mb-1 block text-label-sm font-medium text-on-surface">
                    {unit.vocabCount}–{unit.vocabCount + 1} từ vựng theo ngữ
                    cảnh:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {unit.preview.vocab.map((word) => (
                      <VocabPill key={word} label={word} />
                    ))}
                  </div>
                </div>
              )}
              {unit.preview.expressions.length > 0 && (
                <div>
                  <span className="mb-1 block text-label-sm font-medium text-on-surface">
                    Useful Expressions theo ngữ cảnh:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {unit.preview.expressions.map((expr) => (
                      <VocabPill key={expr} label={`"${expr}"`} />
                    ))}
                  </div>
                </div>
              )}
              {unit.preview.practiceLabel && (
                <div className="flex items-center gap-1 pt-1 text-label-sm text-on-surface-variant">
                  <ListChecks className="size-4 text-primary" />
                  <span>{unit.preview.practiceLabel}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {expanded && expandable ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-label-sm font-medium text-primary">
                {unit.vocabCount} Từ vựng
              </span>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-label-sm font-medium text-primary">
                {unit.expressionCount} Mẫu câu
              </span>
              {unit.practiceCount > 0 && (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-label-sm font-medium text-primary">
                  {unit.practiceCount} Luyện tập
                </span>
              )}
            </div>
            {actionLabel && (
              <Button type="button" onClick={onStart} className="rounded-xl px-5">
                {actionLabel}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <CountChip label={`${unit.vocabCount} Từ vựng`} />
            <CountChip label={`${unit.expressionCount} Mẫu câu`} />
            {unit.practiceCount > 0 && (
              <CountChip label={`${unit.practiceCount} Luyện tập`} />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
