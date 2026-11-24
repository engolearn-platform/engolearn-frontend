import { cn } from "@shared/utils";
import type { ReactNode } from "react";

interface PlacementOverviewCardProps {
  children: ReactNode;
  className?: string;
}

export default function PlacementOverviewCard({
  children,
  className,
}: PlacementOverviewCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}
