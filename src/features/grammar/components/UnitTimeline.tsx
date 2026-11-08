import type { GrammarUnit } from "../types/grammar.types";
import UnitCard from "./UnitCard";

interface UnitTimelineProps {
  units: GrammarUnit[];
  preview?: boolean;
}

export default function UnitTimeline({ units, preview }: UnitTimelineProps) {
  return (
    <div className="relative space-y-4">
      <div
        aria-hidden="true"
        className="absolute top-6 bottom-6 left-6 z-0 hidden w-0.5 bg-outline-variant sm:block"
      />
      {units.map((unit) => (
        <div key={unit.id} className="relative z-10">
          <UnitCard unit={unit} preview={preview} />
        </div>
      ))}
    </div>
  );
}
