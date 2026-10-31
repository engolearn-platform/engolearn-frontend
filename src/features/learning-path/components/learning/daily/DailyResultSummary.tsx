import { Info } from "lucide-react";
import type { SubmitDayResult } from "@features/learning-path/types/learning-path-day.types";
import PracticeResultMetrics from "./PracticeResultMetrics";

interface DailyResultSummaryProps {
  result: SubmitDayResult;
}

export default function DailyResultSummary({ result }: DailyResultSummaryProps) {
  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-on-surface">Tổng kết ngày</h2>
      <PracticeResultMetrics {...result} className="xl:grid-cols-6" />
      <div className="mt-4 flex gap-2 rounded-xl border-l-4 border-l-primary bg-primary/5 p-3 text-xs leading-5 text-on-surface">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>Practice Score chỉ tính trên các câu bạn đã làm và dùng để theo dõi tiến bộ trong lộ trình.</p>
      </div>
    </section>
  );
}
