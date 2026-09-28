import { Circle, CircleCheck, ClipboardList, PenLine } from "lucide-react";
import { cn } from "@shared/utils";
import type {
  TopicItemCompleteness,
  TopicItemPublicationStatus,
} from "../../../types/topic-create.types";

interface TopicItemStatusPillProps {
  publicationStatus: TopicItemPublicationStatus;
  completeness: TopicItemCompleteness;
  hasAnyContent: boolean;
}

interface StatusVisual {
  label: string;
  className: string;
  Icon: typeof CircleCheck;
}

/**
 * Mặt hiển thị suy từ 2 trạng thái chính của Topic Item:
 * publication status (DRAFT/PUBLISHED) + content completeness
 * (suy ra từ các thành phần nhỏ bên trong, xem `getTopicItemCompleteness`).
 */
function resolveVisual(
  publicationStatus: TopicItemPublicationStatus,
  completeness: TopicItemCompleteness,
  hasAnyContent: boolean,
): StatusVisual {
  if (publicationStatus === "PUBLISHED" && completeness === "complete") {
    return {
      label: "Hoàn tất",
      className: "bg-primary/10 text-primary",
      Icon: CircleCheck,
    };
  }
  if (completeness === "empty" && !hasAnyContent) {
    return {
      label: "Chưa có dữ liệu",
      className: "bg-surface-container-high text-on-surface-variant",
      Icon: Circle,
    };
  }
  if (completeness === "empty") {
    return {
      label: "Mới khởi tạo (Draft)",
      className: "bg-surface-container-highest text-on-surface-variant",
      Icon: ClipboardList,
    };
  }
  return {
    label: "Đang soạn thảo",
    className: "bg-secondary-fixed text-on-secondary-fixed",
    Icon: PenLine,
  };
}

export default function TopicItemStatusPill({
  publicationStatus,
  completeness,
  hasAnyContent,
}: TopicItemStatusPillProps) {
  const { label, className, Icon } = resolveVisual(
    publicationStatus,
    completeness,
    hasAnyContent,
  );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-semibold",
        className,
      )}
    >
      <Icon className="size-[15px]" aria-hidden="true" />
      {label}
    </span>
  );
}
