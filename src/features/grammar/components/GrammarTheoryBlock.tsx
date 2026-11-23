import { BookOpen, Braces, ChevronDown, Lightbulb, MessagesSquare, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { Card } from "@shared/components";
import type { GrammarBlock } from "@features/grammar/types/grammar-admin.types";

const labels = {
  EXPLANATION: { label: "Giải thích", Icon: BookOpen }, FORMULA: { label: "Công thức", Icon: Braces },
  EXAMPLE: { label: "Ví dụ", Icon: MessagesSquare }, RULE_QUICK_NOTE: { label: "Quy tắc và ghi chú", Icon: Lightbulb },
  COMMON_MISTAKE: { label: "Lỗi thường gặp", Icon: TriangleAlert },
};
function Example({ example }: { example: NonNullable<GrammarBlock["examples"]>[number] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <li className="wrap-break-word rounded-xl border border-learning-outline bg-surface-container-low p-4">
    <button type="button" className="min-h-12 w-full space-y-2 text-left focus-visible:outline-2 focus-visible:outline-primary" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <span lang="en" className="block whitespace-pre-wrap text-body-lg font-semibold">{example.english}</span>
      <span className="block text-label-sm font-semibold text-primary">{open ? "Ẩn nghĩa và phân tích" : "Bấm để xem nghĩa"}</span>
    </button>
    <div id={id} hidden={!open} className="space-y-2 pt-2"><p className="whitespace-pre-wrap text-body-md text-on-surface-variant">{example.vietnamese}</p>{example.analysis && <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">{example.analysis}</p>}</div>
  </li>;
}
export default function GrammarTheoryBlock({ block, collapsible = false, initialOpen = false }: { block: GrammarBlock; collapsible?: boolean; initialOpen?: boolean }) {
  const { label, Icon } = labels[block.type];
  const heading = <span className="flex min-w-0 items-start gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span className="wrap-break-word">{block.title || label}</span></span>;
  const formula = block.formula && <p lang="en" className="wrap-break-word whitespace-pre-wrap rounded-xl bg-learning-mint p-4 text-body-lg font-bold text-primary">{block.formula}</p>;
  const content = <div className="space-y-4">
    {block.text && <p className="wrap-break-word whitespace-pre-wrap text-body-md text-on-surface-variant">{block.text}</p>}
    {!collapsible && formula}
    {block.examples?.length ? <ul className="space-y-3">{block.examples.map((example, index) => <Example key={index} example={example} />)}</ul> : null}
    {block.ruleItems?.length ? <ul className="list-disc space-y-2 rounded-xl bg-learning-note py-4 pr-4 pl-8 text-body-md text-learning-note-ink">{block.ruleItems.map((item, index) => <li key={index} className="wrap-break-word whitespace-pre-wrap">{item}</li>)}</ul> : null}
    {block.type === "COMMON_MISTAKE" && <>
      <dl className="grid gap-3 sm:grid-cols-2"><div className="min-w-0 space-y-1 rounded-xl bg-learning-note p-4 text-learning-note-ink"><dt className="text-label-lg font-semibold">✕ Cách dùng sai</dt><dd lang="en" className="wrap-break-word whitespace-pre-wrap text-body-lg">{block.incorrect}</dd></div><div className="min-w-0 space-y-1 rounded-xl bg-learning-mint p-4 text-primary"><dt className="text-label-lg font-semibold">✓ Cách dùng đúng</dt><dd lang="en" className="wrap-break-word whitespace-pre-wrap text-body-lg">{block.correct}</dd></div></dl>
      {block.explanation && <p className="wrap-break-word whitespace-pre-wrap text-body-md text-on-surface-variant">{block.explanation}</p>}
    </>}
  </div>;
  if (collapsible) return <details open={initialOpen} className="group rounded-2xl border border-learning-outline bg-white">
    <summary className="cursor-pointer list-none space-y-3 p-5 text-headline-sm font-bold focus-visible:rounded-2xl focus-visible:outline-2 focus-visible:outline-primary">
      <span className="flex items-start justify-between gap-3">{heading}<ChevronDown className="mt-1 size-5 shrink-0 text-primary group-open:rotate-180" aria-hidden="true" /></span>{formula}
    </summary><div className="px-5 pb-5">{content}</div>
  </details>;
  return <Card className="space-y-4 rounded-2xl border-learning-outline bg-white p-5"><h2 className="text-headline-sm font-bold">{heading}</h2>{content}</Card>;
}
