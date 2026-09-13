import { History } from "lucide-react";

export default function RecentVocabList({ items }: { items: { word: string; translation: string }[] }) {
  return (
    <div className="mt-4 pt-2">
      <h3 className="text-label-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
        <History className="size-4.5 text-on-surface-variant" />
        Từ vựng mới ôn
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div
            key={i.word}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container-low transition-colors group cursor-pointer"
          >
            <span className="text-body-md font-medium text-on-surface">{i.word}</span>
            <span className="text-label-sm text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
              {i.translation}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
