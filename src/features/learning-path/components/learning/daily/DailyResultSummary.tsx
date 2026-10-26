import { Info } from "lucide-react";
import { percentage, scoreLabel } from "@features/learning-path/utils/learningPathMetrics";
import type { DailyAnswers, DailyQuestion } from "@features/learning-path/types/learning-path-day.types";

interface DailyResultSummaryProps {
  questions: DailyQuestion[];
  answers: DailyAnswers;
}

export default function DailyResultSummary({ questions, answers }: DailyResultSummaryProps) {
  const assigned = questions.length;
  const answered = questions.filter((question) => answers[question.number] !== undefined).length;
  const correct = questions.filter((question) => answers[question.number] === question.correctIndex).length;
  const metrics = [
    { label: "Câu được giao", value: String(assigned) },
    { label: "Đã làm", value: String(answered) },
    { label: "Đúng", value: String(correct) },
    { label: "Sai", value: String(answered - correct) },
    { label: "Completion Rate", value: scoreLabel(percentage(answered, assigned)) },
    { label: "Practice Score", value: scoreLabel(percentage(correct, answered)) },
  ];

  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-on-surface">Tổng kết ngày</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`rounded-xl border border-outline-variant/50 p-3 text-center ${index >= 4 ? "bg-primary/5" : "bg-surface-container-low"}`}
          >
            <p className={`text-2xl font-bold ${index >= 4 || index === 2 ? "text-primary" : index === 3 ? "text-error" : "text-on-surface"}`}>{metric.value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{metric.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2 rounded-xl border-l-4 border-l-primary bg-primary/5 p-3 text-xs leading-5 text-on-surface">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>Practice Score chỉ tính trên các câu bạn đã làm và dùng để theo dõi tiến bộ trong lộ trình.</p>
      </div>
    </section>
  );
}
