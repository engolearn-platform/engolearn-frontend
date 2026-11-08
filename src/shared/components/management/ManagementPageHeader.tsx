import { Button } from "@/core/components/shadcn/button";
import { Download, Plus } from "lucide-react";

interface ManagementPageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  exportLabel?: string;
  onExport?: () => void;
  createLabel: string;
  onCreate?: () => void;
  createDisabled?: boolean;
  exportButtonClassName?: string;
  createButtonClassName?: string;
}

export function ManagementPageHeader({
  title,
  description,
  badge,
  exportLabel = "Xuất dữ liệu",
  onExport,
  createLabel,
  onCreate,
  createDisabled = false,
  exportButtonClassName = "rounded-xl border-outline-variant bg-surface-container-lowest shadow-sm",
  createButtonClassName =
    "rounded-xl bg-primary-container text-on-primary shadow-sm hover:bg-primary active:scale-[0.98]",
}: ManagementPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">{title}</h1>
          {badge ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-label-sm font-semibold text-primary">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? <p className="mt-1 text-body-md text-on-surface-variant">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2 self-start lg:self-center">
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className={exportButtonClassName}
        >
          <Download className="size-[18px]" aria-hidden="true" />
          {exportLabel}
        </Button>
        <Button
          type="button"
          onClick={onCreate}
          disabled={createDisabled}
          className={createButtonClassName}
        >
          <Plus className="size-5" aria-hidden="true" />
          {createLabel}
        </Button>
      </div>
    </div>
  );
}
