interface TopicItemEditorBreadcrumbProps {
  topicTitleEn: string;
  itemOrder: number;
  itemTitleEn: string;
  onBackToList: () => void;
}

function formatOrder(order: number): string {
  return order.toString().padStart(2, "0");
}

export default function TopicItemEditorBreadcrumb({
  topicTitleEn,
  itemOrder,
  itemTitleEn,
  onBackToList,
}: TopicItemEditorBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant"
    >
      <button
        type="button"
        onClick={onBackToList}
        className="transition-colors hover:text-primary"
      >
        Chủ đề
      </button>
      <span aria-hidden="true">›</span>
      <span className="max-w-[200px] truncate">{topicTitleEn}</span>
      <span aria-hidden="true">›</span>
      <span className="rounded-full bg-primary-fixed/40 px-2 py-0.5 font-semibold text-primary">
        Topic Item {formatOrder(itemOrder)}: {itemTitleEn}
      </span>
    </nav>
  );
}
