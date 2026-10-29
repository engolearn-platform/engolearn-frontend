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
import type { TopicManagementListItem } from "@features/topic/types/topic-management.types";

interface TopicManagementTableProps {
  topics: TopicManagementListItem[];
  onUnpublish: (topic: TopicManagementListItem) => void;
  onEdit: (topic: TopicManagementListItem) => void;
}

function CefrBadge({ cefr }: { cefr?: TopicManagementListItem["cefr"] }) {
  if (!cefr) return null;
  const styles: Record<NonNullable<TopicManagementListItem["cefr"]>, string> = {
    A1: "bg-tertiary/15 text-tertiary",
    A2: "bg-primary/10 text-primary",
    B1: "bg-tertiary-container/20 text-tertiary",
    B2: "bg-secondary-container text-on-secondary-container",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-semibold ${styles[cefr]}`}
    >
      {cefr}
    </span>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  DINING: "Ẩm thực & Nhà hàng",
  TRAVEL: "Du lịch & Khách sạn",
  BUSINESS: "Công sở & Kinh doanh",
  DAILY: "Đời sống xã hội",
  HEALTH: "Khám bệnh & Y tế",
};

export default function TopicManagementTable({ topics, onUnpublish, onEdit }: TopicManagementTableProps) {
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
            <th className="px-3 py-3.5 text-center">Trạng thái</th>
            <th className="px-3 py-3.5">Cập nhật</th>
            <th className="px-4 py-3.5 text-right"></th>
          </tr>
        </thead>
        <tbody className="text-body-md">
          {topics.map((topic) => {
            const isPublished = topic.status === "published";
            const isMenuOpen = openMenuId === topic.id;
            return (
              <tr
                key={topic.id}
                className="transition-colors hover:bg-surface-container-low/40"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onEdit(topic)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-lg font-semibold text-on-surface hover:underline">
                        {topic.titleEn}
                      </span>
                      <span className="truncate text-label-sm text-on-surface-variant">
                        {topic.titleVi}
                      </span>
                    </div>
                  </button>
                </td>
                <td className="px-3 py-3 text-center">
                  <CefrBadge cefr={topic.cefr} />
                </td>
                <td className="px-3 py-3">
                  {topic.category ? (
                    <span className="rounded-lg bg-surface-container px-2 py-1 text-label-sm text-on-surface">
                      {CATEGORY_LABELS[topic.category] ?? topic.category}
                    </span>
                  ) : (
                    <span className="text-label-sm text-on-surface-variant">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-label-sm font-semibold text-on-surface">
                    {topic.itemCount} bài học
                  </span>
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
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Thao tác cho ${topic.titleEn}`}
                        aria-expanded={isMenuOpen}
                        onClick={() => setOpenMenuId(isMenuOpen ? null : topic.id)}
                        className={`flex size-8 items-center justify-center rounded-lg transition-all ${
                          isMenuOpen
                            ? "bg-primary-container text-on-primary"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
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
                            onClick={() => {
                              setOpenMenuId(null);
                              onEdit(topic);
                            }}
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
