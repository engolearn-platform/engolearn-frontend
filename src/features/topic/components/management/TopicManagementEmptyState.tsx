import { Button } from "@/core/components/shadcn/button";
import { EmptyState } from "@shared/components";
import { CircleHelp, FolderX, Plus, RotateCcw } from "lucide-react";

interface TopicManagementEmptyStateProps {
  keyword: string;
  onClear: () => void;
  onCreate: () => void;
}

export default function TopicManagementEmptyState({
  keyword,
  onClear,
  onCreate,
}: TopicManagementEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="flex size-32 items-center justify-center rounded-full bg-surface-container-low">
          <div className="flex size-24 items-center justify-center rounded-full bg-surface-container">
            <FolderX className="size-11 text-outline-variant" aria-hidden="true" />
          </div>
        </div>
        <div className="absolute -right-1 -bottom-1 flex size-11 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-md">
          <CircleHelp className="size-[22px]" aria-hidden="true" />
        </div>
      </div>
      <EmptyState
        title="Không tìm thấy chủ đề phù hợp"
        description={
          keyword
            ? `Không có chủ đề nào khớp với từ khóa "${keyword}" cùng các tiêu chí lọc đang chọn. Hãy thử nới rộng khoảng tìm kiếm hoặc khởi tạo chủ đề mới.`
            : "Không có chủ đề nào khớp với các tiêu chí lọc đang chọn. Hãy thử nới rộng khoảng tìm kiếm hoặc khởi tạo chủ đề mới."
        }
        className="p-0"
      />
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="rounded-xl border-outline-variant bg-surface-container-high"
        >
          <RotateCcw className="size-[18px]" aria-hidden="true" />
          Xóa tất cả bộ lọc
        </Button>
        <Button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-primary text-on-primary shadow-sm hover:bg-primary-container"
        >
          <Plus className="size-[18px]" aria-hidden="true" />
          {keyword ? `Tạo chủ đề "${keyword}"` : "Tạo chủ đề mới"}
        </Button>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-surface-container pt-6 text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          Kiểm tra lại chính tả hoặc cấu trúc gõ tiếng Việt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-secondary-container" aria-hidden="true" />
          Thử tìm các từ đồng nghĩa như &quot;Thương mại&quot;, &quot;Đàm phán&quot;
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-tertiary" aria-hidden="true" />
          Chuyển trình độ về &quot;Tất cả&quot; để quét rộng hơn
        </span>
      </div>
    </div>
  );
}
