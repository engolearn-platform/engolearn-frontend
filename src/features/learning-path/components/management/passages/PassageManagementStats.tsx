import type { PassageCounters } from "@features/learning-path/types/passage-management.types";

export default function PassageManagementStats({ counters }: { counters: PassageCounters }) {
  const items = [
    { label: "Tất cả", value: counters.total, dot: "bg-primary" },
    { label: "Bản nháp", value: counters.draft, dot: "bg-secondary-container" },
    { label: "Đang sử dụng", value: counters.active, dot: "bg-primary-container" },
    { label: "Ngừng sử dụng", value: counters.retired, dot: "bg-outline" },
  ];
  return <div aria-label="Thống kê toàn kho passages" className="flex flex-wrap items-center gap-3 py-2">
    {items.map(item => <span key={item.label} className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-label-sm shadow-sm">
      <span aria-hidden="true" className={`size-2 rounded-full ${item.dot}`} />
      <span className="text-on-surface-variant">{item.label}:</span>
      <span className="font-bold text-primary">{item.value.toLocaleString("vi-VN")}</span>
    </span>)}
  </div>;
}
