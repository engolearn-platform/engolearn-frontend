import type { PlacementInfoItem } from "@features/placement/types/placement.types";

interface PlacementInfoGridProps {
  title: string;
  items: PlacementInfoItem[];
}

export default function PlacementInfoGrid({
  title,
  items,
}: PlacementInfoGridProps) {
  return (
    <div>
      <h2 className="mb-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-center rounded-xl border border-outline-variant/60 bg-surface-container-low p-4"
          >
            <span className="text-headline-sm font-semibold text-on-surface">
              {item.value}
            </span>
            <span className="mt-0.5 text-label-sm text-on-surface-variant">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
