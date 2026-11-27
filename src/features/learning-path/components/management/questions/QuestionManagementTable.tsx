import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { PassageStatusBadge } from "@features/learning-path/components/management/passages/PassageManagementTable";
import { PASSAGE_SKILL_LABELS } from "@features/learning-path/types/passage-management.types";
import { microSkillLabel, validRevision } from "@features/learning-path/types/question-management.types";
import type { QuestionListItem } from "@features/learning-path/types/question-management.types";

export type QuestionAction = "view" | "edit" | "delete" | "copy" | "publish" | "retire" | "replace";
export type QuestionActionHandler = (action: QuestionAction, item: QuestionListItem) => void;
function Actions({ item, onAction }: { item: QuestionListItem; onAction: QuestionActionHandler }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const available = validRevision(item.revision);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) setOpen(false); };
    const move = () => setOpen(false);
    document.addEventListener("pointerdown", close); window.addEventListener("scroll", move, true); window.addEventListener("resize", move);
    return () => { document.removeEventListener("pointerdown", close); window.removeEventListener("scroll", move, true); window.removeEventListener("resize", move); };
  }, [open]);
  const entries: { action: QuestionAction; label: string; disabled?: boolean }[] = [
    { action: "view", label: "Xem chi tiết" }, { action: "copy", label: "Sao chép thành bản nháp", disabled: !available },
    ...(item.status === "DRAFT" ? [{ action: "edit" as const, label: "Chỉnh sửa", disabled: !available }, { action: "delete" as const, label: "Xóa bản nháp", disabled: !available }] : []),
    ...(item.status === "ACTIVE" ? [{ action: "replace" as const, label: "Thay thế câu hỏi", disabled: !available }] : []),
  ];
  return <div className="flex items-center justify-end gap-2">
    {item.status === "DRAFT" && <Button className="h-12 w-48 whitespace-nowrap" disabled={!available} onClick={() => onAction("publish", item)}>Kiểm tra và xuất bản</Button>}
    {item.status === "ACTIVE" && <Button variant="outline" className="h-12 w-48 whitespace-nowrap text-on-surface hover:text-on-surface" disabled={!available} onClick={() => onAction("retire", item)}>Ngưng sử dụng</Button>}
    <Button ref={trigger} variant="ghost" className="size-12 shrink-0" aria-label={`Thao tác câu hỏi ${item.questionId}`} aria-haspopup="menu" aria-expanded={open}
      onClick={() => { const rect = trigger.current!.getBoundingClientRect(); const height = entries.length * 48 + 16;
        setPosition({ top: Math.max(16, Math.min(rect.bottom, window.innerHeight - height)), left: Math.max(16, rect.right - 240) }); setOpen(value => !value); }}>
      <MoreVertical aria-hidden="true" className="size-5" />
    </Button>
    {open && createPortal(<div ref={panel} role="menu" aria-label="Thao tác câu hỏi" style={position}
      className="fixed z-30 w-60 rounded-xl border border-outline-variant bg-surface-container-lowest p-1 shadow-sm"
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) setOpen(false); }}
      onKeyDown={event => {
        if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault(); const buttons = Array.from(panel.current!.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }
      }}>
      {entries.map(entry => <Button key={entry.action} role="menuitem" variant="ghost" disabled={entry.disabled} className="min-h-12 w-full justify-start"
        onClick={() => { setOpen(false); trigger.current?.focus(); onAction(entry.action, item); }}>{entry.label}</Button>)}
    </div>, document.body)}
  </div>;
}
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
export default function QuestionManagementTable({ items, onAction }: { items: QuestionListItem[]; onAction: QuestionActionHandler }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-body-md">
    <caption className="sr-only">Kho câu hỏi Learning Path</caption>
    <thead className="bg-surface-container-low/50 text-label-sm text-on-surface-variant"><tr>
      {["Câu hỏi", "Kỹ năng", "Kỹ năng nhỏ", "Trình độ", "Trạng thái", "Cập nhật", "Thao tác"].map(label => <th key={label} scope="col" className="whitespace-nowrap px-4 py-4 font-semibold">{label}</th>)}
    </tr></thead>
    <tbody className="divide-y divide-outline-variant/30">{items.map(item => <tr key={item.questionId} className="hover:bg-surface-container-low/40">
      <td className="min-w-64 px-4 py-3"><button className="min-h-12 max-w-96 text-left font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => onAction("view", item)}><span className="line-clamp-2 break-words">{item.prompt || "Câu hỏi chưa có nội dung"}</span></button>
      </td>
      <td className="px-4 py-3">{item.skill ? PASSAGE_SKILL_LABELS[item.skill] : "—"}</td>
      <td className="min-w-48 px-4 py-3" title={item.microSkill ?? undefined}>{microSkillLabel(item.microSkill)}</td>
      <td className="px-4 py-3"><span className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm">{item.level ?? "—"}</span></td>
      <td className="px-4 py-3">{item.status ? <PassageStatusBadge status={item.status} /> : "Chưa xác định"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-label-sm text-on-surface-variant">{item.updatedAt && !Number.isNaN(Date.parse(item.updatedAt))
        ? <time dateTime={item.updatedAt}>{dateFormat.format(new Date(item.updatedAt))}</time> : "—"}</td>
      <td className="px-4 py-3"><Actions item={item} onAction={onAction} /></td>
    </tr>)}</tbody>
  </table></div>;
}
