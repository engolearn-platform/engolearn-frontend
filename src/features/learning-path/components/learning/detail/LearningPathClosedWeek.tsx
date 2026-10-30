import { percentage, scoreLabel, changeLabel } from "@features/learning-path/utils/learningPathMetrics";
import PracticeResultMetrics from "@features/learning-path/components/learning/daily/PracticeResultMetrics";
import type { LearningPathWeek } from "@features/learning-path/types/learning-path-detail.types";
import LearningPathDayCard from "./LearningPathDayCard";

interface LearningPathClosedWeekProps {
  week: LearningPathWeek;
}

export default function LearningPathClosedWeek({ week }: LearningPathClosedWeekProps) {
  const completion = week.completionRate !== undefined ? week.completionRate : percentage(week.answered, week.assigned);
  const practice = week.practiceScore !== undefined ? week.practiceScore : percentage(week.correct, week.answered);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-semibold text-on-surface">Tuần {week.number}</h2>
          <span className="text-sm text-on-surface-variant">{week.startDate} – {week.endDate}</span>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Đã kết thúc</span>
      </section>

      <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-on-surface">Thống kê Tuần {week.number}</h2>
        <PracticeResultMetrics assigned={week.assigned} answered={week.answered} correct={week.correct}
          wrong={week.wrong ?? week.answered - week.correct} completionRate={completion} practiceScore={practice}
          className="lg:grid-cols-6" />

        <div className="mt-5 border-t border-outline-variant/40 pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Theo micro-skill</h3>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/50">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-3 py-3 font-semibold">Micro-skill</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">Đã làm / Được giao</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">Completion Rate</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">Practice Score</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">{week.number === 1 ? "Điểm ban đầu" : `Tuần ${week.number - 1}`}</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">Thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {week.microSkillResults.map((result) => {
                  const score = result.practiceScore !== undefined
                    ? result.practiceScore
                    : percentage(result.correct ?? 0, result.answered);
                  const completionRate = result.completionRate !== undefined
                    ? result.completionRate
                    : percentage(result.answered, result.assigned);
                  const improvement = result.improvementPp !== undefined
                    ? result.improvementPp === null
                      ? "Không có dữ liệu"
                      : `${result.improvementPp >= 0 ? "+" : "−"}${Math.abs(result.improvementPp)}%`
                    : changeLabel(score, result.comparisonScore);
                  return (
                    <tr key={result.name} className="border-t border-outline-variant/40">
                      <th scope="row" className="px-3 py-3 font-medium text-on-surface">
                        <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle" />
                        {result.name}
                      </th>
                      <td className="px-3 py-3 text-center">{result.answered}/{result.assigned}</td>
                      <td className="px-3 py-3 text-center">{scoreLabel(completionRate)}</td>
                      <td className="px-3 py-3 text-center font-semibold text-primary">{scoreLabel(score)}</td>
                      <td className="px-3 py-3 text-center text-on-surface-variant">{scoreLabel(result.comparisonScore)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`rounded-full bg-primary/10 py-1 font-medium text-primary ${improvement === "Không có dữ liệu" ? "px-3 text-xs" : "px-2"}`}>
                          {improvement}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-on-surface">Kết quả từng ngày</h2>
          <span className="text-xs text-on-surface-variant">{week.days.length} ngày luyện tập trong tuần</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {week.days.map((day) => <LearningPathDayCard key={day.number} day={day} weekNo={week.number} closedWeek />)}
        </div>
      </section>
    </div>
  );
}
