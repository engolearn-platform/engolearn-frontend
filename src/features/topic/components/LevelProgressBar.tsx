export default function LevelProgressBar({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="my-2 py-1">
      <div className="flex justify-between items-end mb-2">
        <span className="text-label-lg font-semibold text-on-surface">Cấp độ A1</span>
        <span className="text-label-sm text-on-surface-variant font-medium">
          {current}/{total} Chủ đề
        </span>
      </div>
      <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
