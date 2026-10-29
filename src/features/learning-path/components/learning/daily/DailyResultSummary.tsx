import { Info } from "lucide-react";
import { cn } from "@shared/utils";
import { scoreLabel } from "@features/learning-path/utils/learningPathMetrics";
import type { SubmitDayResult } from "@features/learning-path/types/learning-path-day.types";
import styles from "./dailyResult.module.css";

interface DailyResultSummaryProps {
  result: SubmitDayResult;
}

function rateTone(score: number | null) {
  if (score === null) return "neutral";
  if (score < 50) return "wrong";
  if (score < 75) return "caution";
  return "correct";
}

export default function DailyResultSummary({ result }: DailyResultSummaryProps) {
  const { assigned, answered, correct, wrong } = result;
  const completionRate = result.completionRate === null ? null : Math.round(result.completionRate);
  const practiceScore = result.practiceScore === null ? null : Math.round(result.practiceScore);
  const metrics = [
    { label: "Câu được giao", value: String(assigned), tone: "neutral", emphasis: false },
    { label: "Đã làm", value: String(answered), tone: "neutral", emphasis: false },
    { label: "Đúng", value: String(correct), tone: "correct", emphasis: true },
    { label: "Sai", value: String(wrong), tone: "wrong", emphasis: true },
    { label: "Completion Rate", value: scoreLabel(completionRate), tone: rateTone(completionRate), emphasis: completionRate !== null },
    { label: "Practice Score", value: scoreLabel(practiceScore), tone: rateTone(practiceScore), emphasis: practiceScore !== null },
  ];

  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-on-surface">Tổng kết ngày</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={cn(
              "rounded-xl border p-3 text-center",
              metric.tone === "correct" && styles.correct,
              metric.tone === "wrong" && styles.wrong,
              metric.tone === "caution" && styles.caution,
              metric.emphasis ? styles.metricTile : "border-outline-variant/50 bg-surface-container-low",
            )}
          >
            <p className={cn("text-2xl font-bold", metric.tone === "neutral" ? "text-on-surface" : styles.metricValue)}>{metric.value}</p>
            <p className={cn("mt-1 text-xs", metric.emphasis ? styles.metricValue : "text-on-surface-variant")}>{metric.label}</p>
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
