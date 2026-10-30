import { AudioLines, BookOpen, Ear, Info } from "lucide-react";
import { changeLabel, percentage, scoreLabel } from "@features/learning-path/utils/learningPathMetrics";
import { formatLearningPathDate } from "@features/learning-path/utils/formatLearningPathDate";
import type { LearningPathDetail } from "@features/learning-path/types/learning-path-detail.types";
import LearningPathProgress from "./LearningPathProgress";

interface LearningPathSummaryProps {
  path: LearningPathDetail;
}

export default function LearningPathSummary({ path }: LearningPathSummaryProps) {
  const completion = path.completionRate ?? percentage(path.answered, path.assigned) ?? 0;
  const durationWeeks = path.durationWeeks ?? path.weeks.length;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">Tổng kết lộ trình</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {formatLearningPathDate(path.createdDate)} – {path.completedDate ? formatLearningPathDate(path.completedDate) : ""} · {durationWeeks} tuần
          </p>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Đã kết thúc</span>
      </section>

      <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-on-surface">Mức độ hoàn thành</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Lộ trình đã kết thúc. Bạn đã làm {path.answered}/{path.assigned} câu được giao.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-primary/15 bg-primary/5 p-5 text-center">
            <strong className="text-4xl text-primary">{completion}%</strong>
            <span className="mt-1 text-sm font-medium text-on-surface">Completion Rate</span>
          </div>
          <div className="space-y-4 lg:border-l lg:border-outline-variant/40 lg:pl-5">
            {path.weeks.map((week) => {
              const progress = week.completionRate ?? percentage(week.answered, week.assigned) ?? 0;
              return (
                <div key={week.number}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium text-on-surface">Tuần {week.number}</span>
                    <span className="text-on-surface-variant">{week.answered}/{week.assigned} câu ({progress}%)</span>
                  </div>
                  <LearningPathProgress value={progress} label={`Tuần ${week.number}: ${progress}%`} className="mt-2" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-on-surface">Kết quả theo micro-skill</h2>
          <span className="text-xs text-on-surface-variant">Final Practice Score so với điểm ban đầu</span>
        </div>
        <div className="mt-3 flex gap-2 rounded-xl border-l-4 border-l-primary bg-primary/5 p-3 text-sm leading-6 text-on-surface-variant">
          <Info className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>Điểm ban đầu lấy từ bài kiểm tra định kỳ. Mức thay đổi so sánh điểm này với tỷ lệ câu đúng khi luyện tập; kết quả luyện tập không thay đổi điểm bài kiểm tra.</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {path.finalResults.map((result, index) => {
            const microSkill = path.microSkills.find((item) => item.name === result.name);
            const initialScore = microSkill?.initialScore ?? null;
            const finalScore = result.finalPracticeScore !== undefined
              ? result.finalPracticeScore
              : percentage(result.correct, result.answered);
            const improvement = result.improvementPp !== undefined
              ? result.improvementPp === null
                ? "Không có dữ liệu"
                : `${result.improvementPp >= 0 ? "+" : "−"}${Math.abs(result.improvementPp)}%`
              : changeLabel(finalScore, initialScore);
            const change = result.improvementPp !== undefined
              ? result.improvementPp
              : finalScore === null || initialScore === null ? null : finalScore - initialScore;
            const Icon = microSkill?.skill === "READING" ? BookOpen : index === 0 ? Ear : AudioLines;

            return (
              <article key={result.name} className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-4">
                <div className="flex items-start gap-2 text-sm font-semibold text-on-surface">
                  <span className="rounded-full bg-primary/10 p-1.5 text-primary"><Icon className="size-4" aria-hidden="true" /></span>
                  <h3 className="pt-1">{result.name}</h3>
                </div>
                <p className={finalScore === null ? "mt-4 text-base font-semibold text-on-surface-variant" : "mt-4 text-3xl font-bold text-primary"}>{scoreLabel(finalScore)}</p>
                <p className="text-xs text-on-surface-variant">Final Practice Score</p>
                <div className="mt-5 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between gap-2 text-on-surface-variant"><span>Điểm ban đầu</span><span>{scoreLabel(initialScore)}</span></div>
                    {initialScore !== null && <LearningPathProgress value={initialScore} label={`Điểm ban đầu ${result.name}: ${scoreLabel(initialScore)}`} className="mt-1 h-1" fillClassName="bg-on-surface-variant" />}
                  </div>
                  <div>
                    <div className="flex justify-between gap-2 text-on-surface"><span>Kết thúc lộ trình</span><span className="font-semibold text-primary">{scoreLabel(finalScore)}</span></div>
                    {finalScore !== null && <LearningPathProgress value={finalScore} label={`Kết thúc lộ trình ${result.name}: ${scoreLabel(finalScore)}`} className="mt-1 h-1" />}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-outline-variant/40 pt-3 text-xs">
                  <span className="text-on-surface-variant">{result.answered}/{result.assigned} câu đã làm</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-on-surface-variant">Thay đổi</span>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${change === null || change === 0 ? "bg-surface-container text-on-surface-variant" : change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{improvement}</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
