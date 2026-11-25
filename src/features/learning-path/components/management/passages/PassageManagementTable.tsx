import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
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
  onCheck: (item: PassageListItem) => void;
}

function PassageActions({ item, onView, onEdit, onDelete, onCheck }: Omit<Props, "items"> & { item: PassageListItem }) {
  const publishHintId = useId();
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
    {item.status === "DRAFT" && <>
      <Button variant="outline" className="min-h-12 cursor-pointer whitespace-nowrap text-primary transition-colors hover:border-primary hover:bg-learning-mint hover:text-primary focus-visible:border-primary focus-visible:bg-learning-mint" onClick={() => onCheck(item)}
        aria-label={`Kiểm tra ${item.title}`}>Kiểm tra</Button>
      <span className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-primary" tabIndex={0}
        aria-label={`Xuất bản ${item.title}`} aria-describedby={publishHintId} title="Chức năng xuất bản đang được bổ sung">
        <Button disabled className="min-h-12 whitespace-nowrap" aria-describedby={publishHintId}>Xuất bản</Button>
      </span>
      <span id={publishHintId} className="sr-only">Chức năng xuất bản đang được bổ sung.</span>
    </>}
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
        <tr>{["Passage", "Kỹ năng", "Trình độ", "Trạng thái", "Cập nhật", "Thao tác"].map(label =>
          <th key={label} scope="col" className="px-4 py-4 whitespace-nowrap font-semibold">{label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {items.map(item => <tr key={item.passageId} className="hover:bg-surface-container-low/40">
          <td className="min-w-64 px-4 py-3">
            <button className="block min-h-12 text-left font-semibold text-on-surface hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => actions.onView(item)}>{item.title}</button>
            <span className="block break-all text-label-sm text-on-surface-variant">{item.passageId}</span>
          </td>
          <td className="px-4 py-3">{PASSAGE_SKILL_LABELS[item.skill] ?? item.skill}</td>
          <td className="px-4 py-3"><span className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm">{item.level}</span></td>
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
