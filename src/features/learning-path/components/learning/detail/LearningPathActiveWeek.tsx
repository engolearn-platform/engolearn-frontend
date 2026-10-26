import { Clock3, Info } from "lucide-react";
import { percentage } from "@features/learning-path/utils/learningPathMetrics";
import type { LearningPathWeek } from "@features/learning-path/types/learning-path-detail.types";
import LearningPathDayCard from "./LearningPathDayCard";
import LearningPathProgress from "./LearningPathProgress";

interface LearningPathActiveWeekProps {
  week: LearningPathWeek;
  questionsPerDay: number;
}

export default function LearningPathActiveWeek({ week, questionsPerDay }: LearningPathActiveWeekProps) {
  const progress = week.completionRate ?? percentage(week.answered, week.assigned) ?? 0;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">Tuần {week.number}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {week.startDate} – {week.endDate} · Đóng lúc 00:00 ngày {week.closeDate}
          </p>
        </div>
        <div className="flex min-w-[220px] flex-wrap items-center gap-3">
          {week.remainingDays !== undefined && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Clock3 className="size-3.5" aria-hidden="true" />
              Còn {week.remainingDays} ngày
            </span>
          )}
          <div className="flex min-w-[150px] flex-1 items-center gap-2">
            <LearningPathProgress value={progress} label={`Tiến độ tuần ${week.number}: ${progress}%`} className="flex-1" />
            <span className="whitespace-nowrap text-xs font-semibold text-on-surface">{week.answered}/{week.assigned} câu đã làm</span>
          </div>
        </div>
      </section>

      <div className="flex gap-3 rounded-xl border border-primary/15 border-l-4 border-l-primary bg-primary/5 p-4 text-sm leading-6 text-on-surface">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>Mỗi ngày gồm {questionsPerDay} câu. Bạn có thể làm các ngày theo thứ tự bất kỳ. Ngày đã bắt đầu sẽ tự đóng lúc 00:00 cùng ngày.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-on-surface">Lịch luyện tập</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {week.days.map((day) => <LearningPathDayCard key={day.number} day={day} weekNo={week.number} closedWeek={false} />)}
        </div>
      </section>
    </div>
  );
}
