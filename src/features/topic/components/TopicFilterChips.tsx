import { cn } from "@shared/utils/cn";
import { useState } from "react";

type Level = {
  code: string;
  label: string;
  selected?: boolean;
};

const levels: Level[] = [
  { code: "A1", label: "A1 (Cơ bản)", selected: true },
  { code: "A2", label: "A2 (Sơ trung cấp)" },
  { code: "B1", label: "B1 (Trung cấp)" },
  { code: "B2", label: "B2 (Cao trung cấp)" },
];

export default function TopicFilterChips() {
  const [selected, setSelected] = useState("A1");

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide">
      {levels.map((l) => (
        <button
          key={l.code}
          className={cn(
            "px-4 py-2 rounded-full border text-label-lg font-semibold whitespace-nowrap transition-all shadow-2xs cursor-pointer",
            selected === l.code
              ? "border-primary bg-primary text-white shadow-xs"
              : "border-outline-variant/60 bg-surface text-tertiary hover:bg-surface-variant/50 hover:border-outline-variant"
            )}
            onClick={() => {
              setSelected(l.code);
            }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
