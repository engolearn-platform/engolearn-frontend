import { cn } from "@shared/utils";
import {
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  PencilLine,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Topic } from "../../types/topic.types";

interface TopicManagementTableProps {
  topics: Topic[];
  onUnpublish: (topic: Topic) => void;
}

function progressPercent(topic: Topic): number {
  if (topic.progress.total === 0) return 0;
  return Math.round((topic.progress.done / topic.progress.total) * 100);
}

function CefrBadge({ cefr }: { cefr: Topic["cefr"] }) {
  const styles: Record<Topic["cefr"], string> = {
    A1: "bg-tertiary/15 text-tertiary",
    A2: "bg-primary/10 text-primary",
    B1: "bg-tertiary-container/20 text-tertiary",
    B2: "bg-secondary-container text-on-secondary-container",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-semibold",
        styles[cefr],
      )}
    >
      {cefr}
    </span>
  );
}

export default function TopicManagementTable({ topics, onUnpublish }: TopicManagementTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-container-low/60 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            <th className="px-4 py-3.5">Chủ đề (Topic)</th>
            <th className="w-24 px-3 py-3.5 text-center">Trình độ</th>
            <th className="px-3 py-3.5">Danh mục</th>
            <th className="px-3 py-3.5 text-center">Số bài học</th>
            <th className="min-w-[210px] px-4 py-3.5">Tiến độ nội dung</th>
            <th className="px-3 py-3.5 text-center">Trạng thái</th>
            <th className="px-3 py-3.5">Cập nhật</th>
            <th className="px-4 py-3.5 text-right"></th>
          </tr>
        </thead>
        <tbody className="text-body-md">
          {topics.map((topic) => {
            const percent = progressPercent(topic);
            const isPublished = topic.status === "published";
            const isMenuOpen = openMenuId === topic.id;
            return (
              <tr
                key={topic.id}
                className="transition-colors hover:bg-surface-container-low/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={topic.thumbnail}
                      alt=""
                      loading="lazy"
                      className="size-10 shrink-0 rounded-lg object-cover shadow-xs"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-lg font-semibold text-on-surface">
                        {topic.titleEn}
                      </span>
                      <span className="truncate text-label-sm text-on-surface-variant">
                        {topic.titleVi}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <CefrBadge cefr={topic.cefr} />
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-lg bg-surface-container px-2 py-1 text-label-sm text-on-surface">
                    {topic.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-label-sm font-semibold text-on-surface">
                    {topic.itemsLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-label-sm">
                      <span
                        className={cn(
                          "font-semibold",
                          isPublished ? "text-primary" : "text-on-secondary-container",
                        )}
                      >
                        {topic.progress.done}/{topic.progress.total} Items ({percent}%)
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {topic.progress.note}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          percent === 100 ? "bg-primary-container" : "bg-secondary-container",
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  {isPublished ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-label-sm font-semibold text-primary">
                      <span className="size-1.5 rounded-full bg-primary-container" aria-hidden="true" />
                      Đã xuất bản
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container/25 px-2.5 py-1 text-label-sm font-semibold text-on-secondary-container">
                      <PencilLine className="size-[13px]" aria-hidden="true" />
                      Bản nháp
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="text-label-sm text-on-surface-variant">
                    {topic.updatedAt}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {/* <button
                      type="button"
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-label-sm font-semibold transition-colors",
                        isPublished
                          ? "bg-surface-container text-on-surface hover:bg-primary-container hover:text-on-primary"
                          : "bg-primary-container text-on-primary hover:bg-primary",
                      )}
                    >
                      {isPublished ? "Chỉnh sửa" : "Tiếp tục soạn"}
                    </button> */}
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Thao tác cho ${topic.titleEn}`}
                        aria-expanded={isMenuOpen}
                        onClick={() => setOpenMenuId(isMenuOpen ? null : topic.id)}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-all",
                          isMenuOpen
                            ? "bg-primary-container text-on-primary"
                            : "text-on-surface-variant hover:bg-surface-container",
                        )}
                      >
                        <MoreVertical className="size-[18px]" aria-hidden="true" />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute top-10 right-0 z-50 flex w-56 flex-col gap-0.5 rounded-xl bg-surface-container-lowest p-1.5 text-left shadow-xl">
                          <p className="px-3 py-1 text-[11px] tracking-wider text-outline uppercase">
                            Thao tác chủ đề
                          </p>
                          <button
                            type="button"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"
                          >
                            <Pencil className="size-[18px] text-primary" aria-hidden="true" />
                            Mở chỉnh sửa (Bước 2)
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"
                          >
                            <Eye className="size-[18px] text-tertiary" aria-hidden="true" />
                            Xem trước (Learner view)
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"
                          >
                            <Copy className="size-[18px] text-on-surface-variant" aria-hidden="true" />
                            Nhân bản chủ đề (Duplicate)
                          </button>
                          <div className="my-1 h-px bg-surface-container" aria-hidden="true" />
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onUnpublish(topic);
                            }}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"
                          >
                            <EyeOff className="size-[18px] text-on-secondary-container" aria-hidden="true" />
                            Gỡ xuất bản (Draft)
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-label-sm font-semibold text-error transition-colors hover:bg-error-container/20"
                          >
                            <Trash2 className="size-[18px] text-error" aria-hidden="true" />
                            Xóa chủ đề
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
