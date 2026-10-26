import { BookOpen, ChevronDown, ChevronUp, Ear, AudioLines } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { formatLearningPathDate } from "@features/learning-path/utils/formatLearningPathDate";
import { percentage } from "@features/learning-path/utils/learningPathMetrics";
import type { LearningPathDetail } from "@features/learning-path/types/learning-path-detail.types";
import LearningPathProgress from "./LearningPathProgress";

interface LearningPathOverviewProps {
  path: LearningPathDetail;
  expanded: boolean;
  onToggle: () => void;
}

export default function LearningPathOverview({
  path,
  expanded,
  onToggle,
}: LearningPathOverviewProps) {
  const progress = percentage(path.answered, path.assigned) ?? 0;
  const status = path.status === "COMPLETED"
    ? "Đã hoàn thành"
    : path.status === "NOT_STARTED"
      ? "Chưa bắt đầu"
      : `Đang học · Tuần ${path.currentWeekNo ?? 1}/3`;

  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold leading-7 text-on-surface lg:text-2xl">
              Lộ trình ngày {formatLearningPathDate(path.createdDate)}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              {status}
            </span>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            Level {path.level} · {path.microSkills.length} micro-skill · 3 tuần · {path.microSkills.length * 10} câu mỗi tuần
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggle}
          aria-expanded={expanded}
          className="border-outline-variant/60 text-on-surface-variant"
        >
          {expanded ? "Thu gọn" : "Mở rộng"}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-5 grid gap-5 border-t border-outline-variant/40 pt-5 lg:grid-cols-[minmax(0,1fr)_215px] lg:gap-6">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Điểm ban đầu
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {path.microSkills.map((microSkill, index) => {
                const Icon = microSkill.skill === "READING" ? BookOpen : index === 0 ? Ear : AudioLines;
                return (
                  <div
                    key={microSkill.name}
                    className="min-w-0 rounded-xl border border-outline-variant/50 bg-surface-container-low p-3"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs leading-4 text-on-surface">{microSkill.name}</span>
                      <Icon className="size-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-lg font-bold text-primary">{microSkill.initialScore}%</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-outline-variant/40 lg:border-l lg:pl-6">
            <div className="flex justify-between gap-2 text-xs text-on-surface-variant">
              <span>Tiến độ lộ trình</span>
              <span className="font-semibold text-on-surface">{path.answered}/{path.assigned} câu đã làm</span>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
              <strong className="mr-1 text-3xl text-primary">{progress}%</strong> hoàn thành
            </p>
            <LearningPathProgress value={progress} label={`Tiến độ lộ trình ${progress}%`} className="mt-2" />
          </div>
        </div>
      )}
    </section>
  );
}
