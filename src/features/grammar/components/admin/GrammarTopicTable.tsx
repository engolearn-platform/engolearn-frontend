import { EllipsisVertical } from "lucide-react";
import type { GrammarTopic } from "@features/grammar/types/grammar-topic-management.types";
import { GrammarTopicCefrBadge } from "./GrammarTopicCefrBadge";
import { GrammarTopicProgressCell } from "./GrammarTopicProgressCell";
import { GrammarTopicStatusPill } from "./GrammarTopicStatusPill";

const HEAD_CLASS = "px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant";

interface GrammarTopicTableProps {
  topics: GrammarTopic[];
}

export function GrammarTopicTable({ topics }: GrammarTopicTableProps) {
  return (
    <>
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-3">
        <h2 className="text-title-small font-semibold text-on-surface">
          Danh sách chủ đề ngữ pháp
        </h2>
        <span className="text-label-sm text-on-surface-variant">{topics.length} chủ đề</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-container-low">
            <tr>
              <th className={HEAD_CLASS}>Mã chủ đề</th>
              <th className={HEAD_CLASS}>Tên chủ đề</th>
              <th className={HEAD_CLASS}>Mô tả</th>
              <th className={HEAD_CLASS}>Trình độ</th>
              <th className={HEAD_CLASS}>Bài học</th>
              <th className={HEAD_CLASS}>Trạng thái</th>
              <th className={HEAD_CLASS}>Cập nhật</th>
              <th className={HEAD_CLASS}>
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr
                key={topic.id}
                className="border-t border-outline-variant/40 transition-colors hover:bg-surface-container-low/50"
              >
                <td className="px-4 py-4 align-middle text-label-sm font-medium text-on-surface">
                  {topic.code}
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-body-md font-semibold text-on-surface">
                      {topic.titleVi}
                    </span>
                    <span className="text-label-sm text-on-surface-variant">{topic.titleEn}</span>
                  </div>
                </td>
                <td className="max-w-[280px] px-4 py-4 align-middle text-label-sm text-on-surface-variant">
                  {topic.description}
                </td>
                <td className="px-4 py-4 align-middle">
                  <GrammarTopicCefrBadge level={topic.cefr} />
                </td>
                <td className="px-4 py-4 align-middle">
                  <GrammarTopicProgressCell done={topic.lessonDone} total={topic.lessonTotal} />
                </td>
                <td className="px-4 py-4 align-middle">
                  <GrammarTopicStatusPill status={topic.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-middle text-label-sm text-on-surface-variant">
                  {topic.updatedLabel}
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-label-sm font-semibold text-on-surface transition-colors hover:bg-primary-container hover:text-on-primary"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      aria-label={`Thao tác khác cho ${topic.titleVi}`}
                      className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
                    >
                      <EllipsisVertical className="size-[18px]" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
