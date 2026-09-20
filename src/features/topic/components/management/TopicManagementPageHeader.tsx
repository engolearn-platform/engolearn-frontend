import { Button } from "@/core/components/shadcn/button";
import { Download, Plus } from "lucide-react";

interface TopicManagementPageHeaderProps {
  onExport?: () => void;
  onCreate?: () => void;
}

export default function TopicManagementPageHeader({ onExport, onCreate }: TopicManagementPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">
            Quản lý chủ đề
          </h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-label-sm font-semibold text-primary">
            Studio Narrative
          </span>
        </div>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Quản lý toàn bộ chủ đề và nội dung học tập theo tình huống giao tiếp thực tế của
          EngoLearn.
        </p>
      </div>
      <div className="flex items-center gap-2 self-start lg:self-center">
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="rounded-xl border-outline-variant bg-surface-container-lowest shadow-sm"
        >
          <Download className="size-[18px]" aria-hidden="true" />
          Xuất dữ liệu
        </Button>
        <Button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-primary-container text-on-primary shadow-sm hover:bg-primary active:scale-[0.98]"
        >
          <Plus className="size-5" aria-hidden="true" />
          Tạo topic mới
        </Button>
      </div>
    </div>
  );
}
