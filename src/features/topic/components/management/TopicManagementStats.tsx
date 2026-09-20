import { RefreshCw } from "lucide-react";
import type { TopicManagementStats as Stats } from "../../types/topic.types";

interface TopicManagementStatsProps {
  stats: Stats;
}

export default function TopicManagementStats({ stats }: TopicManagementStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <span className="flex items-center gap-2.5 rounded-full bg-surface-container-lowest px-3.5 py-1.5 shadow-sm">
        <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
        <span className="text-label-sm text-on-surface-variant">Tất cả:</span>
        <span className="text-label-lg font-bold text-primary">{stats.total}</span>
      </span>
      <span className="flex items-center gap-2.5 rounded-full bg-surface-container-lowest px-3.5 py-1.5 shadow-sm">
        <span className="size-2 rounded-full bg-primary-container" aria-hidden="true" />
        <span className="text-label-sm text-on-surface-variant">Đã xuất bản:</span>
        <span className="text-label-lg font-bold text-primary-container">
          {stats.published}
        </span>
      </span>
      <span className="flex items-center gap-2.5 rounded-full bg-surface-container-lowest px-3.5 py-1.5 shadow-sm">
        <span className="size-2 rounded-full bg-secondary-container" aria-hidden="true" />
        <span className="text-label-sm text-on-surface-variant">Bản nháp:</span>
        <span className="text-label-lg font-bold text-on-secondary-container">{stats.draft}</span>
      </span>
      <span className="flex items-center gap-2.5 rounded-full bg-surface-container-lowest px-3.5 py-1.5 shadow-sm">
        <span className="size-2 rounded-full bg-tertiary" aria-hidden="true" />
        <span className="text-label-sm text-on-surface-variant">
          Đang hoàn thiện nội dung:
        </span>
        <span className="text-label-lg font-bold text-tertiary">{stats.inProgress}</span>
      </span>
      <span className="ml-auto hidden items-center gap-2 text-on-surface-variant sm:flex">
        <RefreshCw className="size-4" aria-hidden="true" />
        <span className="text-label-sm">Đồng bộ tự động 2 phút trước</span>
      </span>
    </div>
  );
}
