import { cn } from "@shared/utils";

type BadgeTone = "gold" | "teal" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  gold: "bg-secondary-container text-on-secondary-container",
  teal: "bg-primary-container text-on-primary-container",
  neutral: "bg-surface-container text-primary",
};

export default function StatusBadge({
  label,
  tone = "gold",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
