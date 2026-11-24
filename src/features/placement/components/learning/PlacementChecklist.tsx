import type { PlacementIntroRule } from "@features/placement/types/placement.types";
import { Check } from "lucide-react";

interface PlacementChecklistProps {
  title: string;
  rules: PlacementIntroRule[];
}

export default function PlacementChecklist({
  title,
  rules,
}: PlacementChecklistProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-body-md font-semibold text-on-surface">{title}</h2>
      <ul className="flex flex-col gap-3">
        {rules.map((rule) => (
          <li key={rule.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary">
              <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-body-md text-on-surface-variant">
              {rule.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
