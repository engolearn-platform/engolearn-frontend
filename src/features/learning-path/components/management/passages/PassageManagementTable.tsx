import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { Link } from "react-router";
import { ROUTES } from "@shared/constants";
import { Button } from "@/core/components/shadcn/button";
import { PASSAGE_SKILL_LABELS, PASSAGE_STATUS_LABELS } from "@features/learning-path/types/passage-management.types";
import type { PassageListItem, PassageStatus } from "@features/learning-path/types/passage-management.types";

const statusClass: Record<PassageStatus, string> = {
  DRAFT: "bg-learning-note text-learning-note-ink",
  ACTIVE: "bg-learning-mint text-primary",
  RETIRED: "bg-surface-container-low text-on-surface-variant",
};
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function PassageStatusBadge({ status }: { status: PassageStatus }) {
  return <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-label-sm font-semibold ${statusClass[status] ?? statusClass.RETIRED}`}>
    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{PASSAGE_STATUS_LABELS[status] ?? status}
  </span>;
}

interface Props {
  items: PassageListItem[];
  onView: (item: PassageListItem) => void;
  onEdit: (item: PassageListItem) => void;
  onDelete: (item: PassageListItem) => void;
  onPublish: (item: PassageListItem) => void;
  onRetire: (item: PassageListItem) => void;
}

function PassageActions({ item, onView, onEdit, onDelete, onPublish, onRetire }: Omit<Props, "items"> & { item: PassageListItem }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnMove = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", closeOnMove);
    window.addEventListener("scroll", closeOnMove, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", closeOnMove);
      window.removeEventListener("scroll", closeOnMove, true);
    };
  }, [open]);
  return <div ref={container} className="relative flex items-center justify-end gap-2" onKeyDown={event => {
    if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
  }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget) && !panel.current?.contains(event.relatedTarget)) setOpen(false);
  }}>
    {item.status === "DRAFT" && <Button className="h-12 w-48 cursor-pointer whitespace-nowrap"
      aria-label={`Kiểm tra và xuất bản ${item.title}`} onClick={() => onPublish(item)}>Kiểm tra và xuất bản</Button>}
    {item.status === "ACTIVE" && <Button variant="outline" className="h-12 w-48 cursor-pointer whitespace-nowrap text-on-surface hover:text-on-surface"
      aria-label={`Ngưng sử dụng ${item.title}`} onClick={() => onRetire(item)}>Ngưng sử dụng</Button>}
    <Button ref={trigger} variant="ghost" className="size-12" aria-label={`Thao tác với ${item.title}`} aria-expanded={open}
      onClick={() => {
        const bounds = trigger.current!.getBoundingClientRect();
        setPosition({ top: Math.max(16, Math.min(bounds.bottom, window.innerHeight - 176)), left: Math.max(16, bounds.right - 176) });
        setOpen(previous => !previous);
      }}><MoreVertical aria-hidden="true" className="size-5" /></Button>
    {open && createPortal(<div ref={panel} style={position} className="fixed z-30 w-44 rounded-xl border border-outline-variant bg-surface-container-lowest p-1 shadow-sm">
      <Button className="min-h-12 w-full justify-start" variant="ghost" onClick={() => { setOpen(false); onView(item); }}>Xem chi tiết</Button>
      {item.status === "DRAFT" && <>
        <Button className="min-h-12 w-full justify-start" variant="ghost" onClick={() => { setOpen(false); onEdit(item); }}>Sửa</Button>
        <Button className="min-h-12 w-full justify-start text-error" variant="ghost" onClick={() => { setOpen(false); onDelete(item); }}>Xóa</Button>
      </>}
    </div>, document.body)}
  </div>;
}

export default function PassageManagementTable({ items, ...actions }: Props) {
  return <div className="overflow-x-auto">
    <table className="w-full text-left text-body-md">
      <caption className="sr-only">Danh sách passages</caption>
      <thead className="bg-surface-container-low/50 text-label-sm text-on-surface-variant">
        <tr>{["Passage", "Kỹ năng", "Trình độ", "Số câu hỏi", "Trạng thái", "Cập nhật", "Thao tác"].map(label =>
          <th key={label} scope="col" className="px-4 py-4 whitespace-nowrap font-semibold">{label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {items.map(item => <tr key={item.passageId} className="hover:bg-surface-container-low/40">
          <td className="min-w-64 px-4 py-3">
            <button className="block min-h-12 text-left font-semibold text-on-surface hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => actions.onView(item)}>{item.title}</button>
          </td>
          <td className="px-4 py-3">{PASSAGE_SKILL_LABELS[item.skill] ?? item.skill}</td>
          <td className="px-4 py-3"><span className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm">{item.level}</span></td>
          <td className="px-4 py-3 whitespace-nowrap text-label-sm font-semibold" title="Tổng số câu hỏi tham chiếu ở mọi trạng thái">
            <Link className="inline-flex min-h-12 items-center text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary" to={`${ROUTES.ADMIN_LEARNING_PATH_QUESTIONS}?${new URLSearchParams({ passageId: item.passageId })}`} aria-label={`Xem câu hỏi của passage ${item.title}`}>
              {typeof item.referencingQuestionCount === "number" ? `${item.referencingQuestionCount.toLocaleString("vi-VN")} câu hỏi` : "Xem câu hỏi"}
            </Link>
          </td>
          <td className="px-4 py-3"><PassageStatusBadge status={item.status} /></td>
          <td className="px-4 py-3 whitespace-nowrap text-label-sm text-on-surface-variant">
            {item.updatedAt && !Number.isNaN(Date.parse(item.updatedAt)) ? <time dateTime={item.updatedAt}>{dateFormatter.format(new Date(item.updatedAt))}</time> : "—"}
          </td>
          <td className="px-4 py-3"><PassageActions item={item} {...actions} /></td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
