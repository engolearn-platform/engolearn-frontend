import { cn } from "@shared/utils";
import { scoreLabel } from "@features/learning-path/utils/learningPathMetrics";
import styles from "./dailyResult.module.css";

interface PracticeResultMetricsProps {
  assigned: number;
  answered: number;
  correct: number;
  wrong: number;
  completionRate: number | null;
  practiceScore: number | null;
  className?: string;
}

function rateTone(score: number | null) {
  if (score === null) return "neutral";
  if (score < 50) return "wrong";
  if (score < 75) return "caution";
  return "correct";
}

export default function PracticeResultMetrics({
  assigned, answered, correct, wrong, completionRate, practiceScore, className,
}: PracticeResultMetricsProps) {
  const completion = completionRate === null ? null : Math.round(completionRate);
  const practice = practiceScore === null ? null : Math.round(practiceScore);
  const highlightWrong = answered > 0 && wrong / answered >= 0.5;
  const metrics = [
    { label: "Câu được giao", value: String(assigned), tone: "neutral", emphasis: false },
    { label: "Đã làm", value: String(answered), tone: "neutral", emphasis: false },
    { label: "Đúng", value: String(correct), tone: "correct", emphasis: true },
    { label: "Sai", value: String(wrong), tone: answered === 0 ? "neutral" : highlightWrong ? "wrong" : "correct", emphasis: answered > 0 },
    { label: "Completion Rate", value: scoreLabel(completion), tone: rateTone(completion), emphasis: completion !== null },
    { label: "Practice Score", value: scoreLabel(practice), tone: rateTone(practice), emphasis: practice !== null },
  ];

  return (
    <div className={cn("mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
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
          <p className={cn(
            "flex min-h-8 items-center justify-center font-bold",
            metric.value === "Không có dữ liệu" ? "whitespace-nowrap text-sm" : "text-2xl",
            metric.tone === "neutral" ? "text-on-surface" : styles.metricValue,
          )}>{metric.value}</p>
          <p className={cn("mt-1 text-xs", metric.emphasis ? styles.metricValue : "text-on-surface-variant")}>{metric.label}</p>
        </div>
      ))}
    </div>
  );
}
