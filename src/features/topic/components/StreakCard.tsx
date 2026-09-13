import { Flame } from "lucide-react";

export default function StreakCard({ count }: { count: number }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30 flex items-center justify-between shadow-xs my-2">
      <div>
        <p className="text-label-sm text-on-surface-variant mb-1 font-medium">Chuỗi ngày học</p>
        <p className="text-headline-lg font-bold text-secondary-container flex items-center gap-1.5 drop-shadow-xs">
          <Flame className="size-6 text-secondary-container" fill="currentColor" />
          {count}
        </p>
      </div>
      <div className="w-12 h-12 rounded-full border-2 border-outline-variant/30 flex items-center justify-center relative">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-outline-variant/20"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-secondary-container"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeDasharray="100, 100"
            strokeWidth="3"
          />
        </svg>
        <span className="text-label-sm font-bold text-on-surface">T.4</span>
      </div>
    </div>
  );
}
