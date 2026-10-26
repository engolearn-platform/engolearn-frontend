import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils";
import { formatLearningPathDate } from "@features/learning-path/utils/formatLearningPathDate";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { ROUTES } from "@shared/constants";
import type { LearningPathListItem } from "@features/learning-path/types/learning-path.types";

interface LearningPathCardProps {
  path: LearningPathListItem;
}

function getProgress(path: LearningPathListItem): number {
  if (!path.progress || path.progress.assigned === 0) {
    return 0;
  }

  return Math.round((path.progress.answered / path.progress.assigned) * 100);
}

export default function LearningPathCard({ path }: LearningPathCardProps) {
  const progress = getProgress(path);
  const isActive =
    path.status === "IN_PROGRESS" || path.status === "NOT_STARTED";
  const isCompleted = path.status === "COMPLETED";
  const detailUrl = `${ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(path.id))}${isCompleted ? "?preview=completed" : ""}`;

  const statusLabel =
    path.status === "NOT_STARTED"
      ? "Chưa bắt đầu"
      : path.status === "COMPLETED"
        ? "Đã hoàn thành"
        : path.status === "CANCELLED"
          ? "Đã bị hủy"
          : `Đang học · Tuần ${path.currentWeekNo ?? 1}/3`;

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-2.5 transition-all duration-200 hover:border-primary/30 hover:shadow-md lg:p-[25px]",
        isActive
          ? "min-h-[260px] lg:h-[457.25px] lg:min-h-0"
          : "h-auto",
      )}
    >
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold lg:gap-[6px] lg:px-[13px] lg:py-[5px] lg:text-[13px] lg:leading-[19.5px]",
          isActive && "border-primary/10 bg-primary/10 text-primary",
          path.status === "COMPLETED" &&
            "border-green-700/10 bg-green-100 text-green-700",
          path.status === "CANCELLED" &&
            "border-outline-variant/60 bg-surface-container text-on-surface-variant",
        )}
      >
        <span className="size-1.5 rounded-full bg-current lg:size-[6px]" aria-hidden="true" />
        {statusLabel}
      </span>

      <div className="mt-3 lg:mt-4">
        <h2 className="text-base font-bold text-on-surface lg:text-[20px] lg:leading-[30px] lg:tracking-[-0.5px]">
          Lộ trình ngày {formatLearningPathDate(path.createdDate)}
        </h2>
        <p className="mt-0.5 text-xs text-on-surface-variant lg:mt-1 lg:text-[13px] lg:leading-[19.5px]">
          Level {path.level} · {path.k} micro-skill · Kế hoạch 3 tuần
        </p>
      </div>

      <span className="group mt-2.5 inline-flex w-fit max-w-full self-start rounded-md transition-shadow duration-150 hover:shadow-sm lg:mt-4 lg:pt-1">
        <Button
          disabled
          variant="outline"
          size="sm"
          title="Chức năng sẽ được kết nối khi màn hình kết quả bài kiểm tra định kì sẵn sàng."
          className="h-auto w-fit max-w-full whitespace-normal border-primary/30 bg-primary/5 px-2 has-[>svg]:px-2.5 py-1 text-left text-xs text-primary transition-colors duration-150 group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary disabled:cursor-not-allowed disabled:bg-primary/5 disabled:text-primary disabled:opacity-100 lg:px-[13px] lg:has-[>svg]:px-[13px] lg:py-[6px] lg:text-[12px] lg:leading-[18px]"
        >
          <ExternalLink className="size-3.5 shrink-0 lg:size-3" aria-hidden="true" />
          Xem kết quả bài kiểm tra định kỳ tương ứng
        </Button>
      </span>

      <div className="mt-2.5 flex flex-wrap gap-1 lg:mt-4 lg:gap-2 lg:pt-1">
        {path.microSkills.map((microSkill) => (
          <span
            key={microSkill}
            className="rounded-md border border-outline-variant/50 bg-surface px-1.5 py-0.5 text-xs text-on-surface-variant transition-colors duration-150 hover:border-primary/50 hover:bg-primary/10 hover:text-primary lg:rounded-[8px] lg:px-[11px] lg:py-[4px] lg:text-[12.5px] lg:leading-[18.75px]"
          >
            {microSkill}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-3 lg:mt-4 lg:flex lg:flex-1 lg:flex-col">
        <div className="flex items-center justify-between text-xs lg:text-[13.5px] lg:leading-[20.25px]">
          <span className="font-medium text-on-surface-variant">Tiến độ</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>

        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container lg:mt-[7px] lg:h-2"
          aria-label={`Tiến độ ${progress}%`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-1 text-right text-xs text-on-surface-variant lg:mt-[7px] lg:text-[12.5px] lg:leading-[18.75px]">
          {path.progress?.answered ?? 0}/{path.progress?.assigned ?? 0} câu đã
          làm
        </p>

        {(isActive || isCompleted) && (
          <div className="mt-2.5 border-t border-outline-variant/40 pt-2.5 text-right lg:mt-auto lg:pt-[21px]">
            <Button
              asChild
              className="h-8 rounded-lg px-3 py-1.5 text-xs font-semibold lg:h-auto lg:rounded-xl lg:px-5 lg:has-[>svg]:px-5 lg:py-2.5 lg:text-sm"
            >
              <Link to={detailUrl}>
                {isCompleted ? "Xem lộ trình" : "Tiếp tục luyện tập"}
                <ArrowRight className="size-3.5 lg:size-3" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
