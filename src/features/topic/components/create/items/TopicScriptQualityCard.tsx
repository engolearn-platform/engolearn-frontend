import { BarChart3, CircleAlert, CircleCheck } from "lucide-react";
import type { TopicScriptQuality } from "../../../types/topic-create.types";

interface TopicScriptQualityCardProps {
  quality: TopicScriptQuality;
}

export default function TopicScriptQualityCard({
  quality,
}: TopicScriptQualityCardProps) {
  const percent =
    quality.max > 0 ? Math.round((quality.score / quality.max) * 100) : 0;

  return (
    <section className="space-y-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-[22px] text-primary" aria-hidden="true" />
          <h2 className="text-headline-sm font-bold text-on-surface">
            Chất lượng kịch bản
          </h2>
        </div>
        <span className="rounded-md bg-primary-fixed px-2 py-0.5 text-label-sm font-bold text-on-primary-fixed">
          {quality.score} / {quality.max} Điểm
        </span>
      </div>

      <div className="flex items-center gap-5 rounded-xl bg-surface-container-low p-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <path
              className="text-surface-container-highest"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="text-primary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${percent}, 100`}
              strokeLinecap="round"
              strokeWidth="3.5"
            />
          </svg>
          <span className="absolute text-label-lg font-bold text-primary">
            {percent}%
          </span>
        </div>
        <div className="space-y-1">
          <span className="block text-label-sm font-semibold text-on-surface">
            Độ phủ bài giảng
          </span>
          <p className="text-label-sm text-on-surface-variant">
            {quality.coverageNote}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <span className="block text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
          Quy chuẩn bài giảng CEFR A2
        </span>
        <div className="space-y-2.5">
          {quality.checks.map((check) => (
            <div key={check.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-label-sm text-on-surface">
                {check.passed ? (
                  <CircleCheck
                    className="size-[18px] text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleAlert
                    className="size-[18px] text-secondary"
                    aria-hidden="true"
                  />
                )}
                {check.label}
              </span>
              <span
                className={
                  check.passed
                    ? "text-label-sm font-semibold text-primary"
                    : "text-label-sm font-semibold text-secondary"
                }
              >
                {check.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
