export interface LessonProgressCardProps {
  percent: number;
  note: string;
}

export function LessonProgressCard({ percent, note }: LessonProgressCardProps) {
  return (
    <section className="flex min-h-[124px] flex-col justify-between rounded-2xl border border-surface-container-high/60 bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-label-lg font-semibold text-on-surface">
          Tiến độ bài học
        </span>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary">
          {percent}%
        </span>
      </div>
      <div className="mb-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-label-sm leading-relaxed text-on-surface-variant">
        {note}
      </p>
    </section>
  );
}
