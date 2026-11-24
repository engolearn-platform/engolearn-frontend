interface ProgressBarProps {
  label: string;
  value: number;
  description: string;
}

export default function ProgressBar({ label, value, description }: ProgressBarProps) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-label-lg">
        <span className="text-on-surface-variant">{description}</span>
        <span className="font-bold text-primary">{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-learning-mint"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
