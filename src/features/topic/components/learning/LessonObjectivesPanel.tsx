import { BadgeCheck, Mic, Timer } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type {
  LessonObjective,
  LessonObjectiveIcon,
} from "../../types/topic-context.types";

const objectiveIcons: Record<LessonObjectiveIcon, typeof Timer> = {
  timer: Timer,
  mic: Mic,
  badge: BadgeCheck,
};

export interface LessonObjectivesPanelProps {
  heading: string;
  objectives: LessonObjective[];
}

export function LessonObjectivesPanel({
  heading,
  objectives,
}: LessonObjectivesPanelProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container p-4 md:col-span-4">
      <div className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {heading}
      </div>
      {objectives.map((objective) => {
        const ObjectiveIcon = objectiveIcons[objective.icon];
        return (
          <div
            key={objective.id}
            className="flex items-center gap-2.5 text-label-lg text-on-surface"
          >
            <ObjectiveIcon
              className={cn(
                "size-[18px] shrink-0",
                objective.icon === "badge"
                  ? "text-on-secondary-container"
                  : "text-primary",
              )}
            />
            <span>{objective.text}</span>
          </div>
        );
      })}
    </div>
  );
}
