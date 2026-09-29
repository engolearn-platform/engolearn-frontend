import { useState } from "react";
import type {
  TopicUnitItem,
  UnitActionLabels,
} from "../../../types/topic-detail.types";
import { UnitRowCard } from "./UnitRowCard";

export interface UnitListProps {
  units: TopicUnitItem[];
  actionLabels: UnitActionLabels;
  onStartUnit: (unitId: string) => void;
}

export function UnitList({ units, actionLabels, onStartUnit }: UnitListProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const handleToggle = (unit: TopicUnitItem) => {
    if (unit.state === "locked") return;
    setExpandedIds((prev) =>
      prev.includes(unit.id)
        ? prev.filter((id) => id !== unit.id)
        : [...prev, unit.id],
    );
  };

  return (
    <section className="flex flex-col gap-4">
      {units.map((unit) => (
        <UnitRowCard
          key={unit.id}
          unit={unit}
          expanded={expandedIds.includes(unit.id)}
          onToggle={() => handleToggle(unit)}
          actionLabels={actionLabels}
          onStart={() => onStartUnit(unit.id)}
        />
      ))}
    </section>
  );
}
