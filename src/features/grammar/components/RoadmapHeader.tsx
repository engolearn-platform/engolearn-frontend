import type { CefrLevel } from "../types/grammar.types";
import ProgressBar from "./ProgressBar";

interface RoadmapHeaderProps {
  title: string;
  currentLevel: CefrLevel;
  overallProgress: number;
}

export default function RoadmapHeader({
  title,
  currentLevel,
  overallProgress,
}: RoadmapHeaderProps) {
  return (
    <header>
      <h2 className="mb-2 text-headline-lg font-bold text-on-surface">
        {title}
      </h2>
      <div className="flex items-center gap-4">
        <span className="text-body-md text-on-surface-variant">
          Trình độ hiện tại: <strong>{currentLevel}</strong>
        </span>
        <div className="w-32">
          <ProgressBar value={overallProgress} showLabel size="md" />
        </div>
      </div>
    </header>
  );
}
