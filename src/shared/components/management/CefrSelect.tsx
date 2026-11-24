import { ChevronDown } from "lucide-react";

export type ManagementCefrLevel = "A1" | "A2" | "B1" | "B2";

export type ManagementCefrValue = "ALL" | ManagementCefrLevel;

export interface ManagementCefrOption {
  value: ManagementCefrLevel;
  label: string;
}

interface CefrSelectProps {
  value: ManagementCefrValue;
  onChange: (value: ManagementCefrValue) => void;
  options?: ManagementCefrOption[];
  allLabel?: string;
  srLabel?: string;
  className?: string;
  chevronClassName?: string;
}

const DEFAULT_CEFR_OPTIONS: ManagementCefrOption[] = [
  { value: "A1", label: "A1 - Mới bắt đầu" },
  { value: "A2", label: "A2 - Sơ cấp" },
  { value: "B1", label: "B1 - Trung cấp" },
  { value: "B2", label: "B2 - Trung cao cấp" },
];

export function CefrSelect({
  value,
  onChange,
  options = DEFAULT_CEFR_OPTIONS,
  allLabel = "Tất cả trình độ (CEFR)",
  srLabel = "Lọc theo trình độ CEFR",
  className = "cursor-pointer appearance-none rounded-xl bg-surface-container-low py-2 pr-8 pl-3 text-label-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none",
  chevronClassName = "pointer-events-none absolute top-1/2 right-2.5 size-[18px] -translate-y-1/2 text-outline-variant",
}: CefrSelectProps) {
  return (
    <label className="relative">
      <span className="sr-only">{srLabel}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ManagementCefrValue)}
        className={className}
      >
        <option value="ALL">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className={chevronClassName} aria-hidden="true" />
    </label>
  );
}
