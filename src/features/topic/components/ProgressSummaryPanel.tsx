import { Activity } from "lucide-react";
import StreakCard from "../components/StreakCard";
import LevelProgressBar from "../components/LevelProgressBar";
import RecentVocabList from "../components/RecentVocabList";

export default function ProgressSummaryPanel() {
  return (
    <div className="w-full shrink-0 border-t border-outline-variant/20 bg-surface p-6 lg:w-80 lg:border-l lg:border-t-0">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-tertiary-container/10 text-tertiary">
          <Activity className="size-5" />
        </div>
        <h2 className="text-headline-sm font-semibold text-on-surface">Tóm tắt tiến độ</h2>
      </div>
      <div className="flex flex-col gap-6">
        <StreakCard count={7} />
        <LevelProgressBar current={3} total={12} />
        <RecentVocabList
          items={[
            { word: "Routine", translation: "Thói quen" },
            { word: "Breakfast", translation: "Bữa sáng" },
          ]}
        />
      </div>
    </div>
  );
}
