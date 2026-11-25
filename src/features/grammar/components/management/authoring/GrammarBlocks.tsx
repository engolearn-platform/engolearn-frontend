import { useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { grammarEntryInput as fieldClass } from "@features/grammar/components/management/GrammarEntryUi";
import { grammarEditorPanel as panelClass } from "@features/grammar/constants/management-entry";
import { grammarPaths } from "@features/grammar/constants/management-paths";
import type { LessonContext } from "@features/grammar/hooks/useGrammarAuthoring";
import { lessonSteps, moveItem, savedAtLabel, saveLessonContent, useAuthoringAction } from "@features/grammar/hooks/useGrammarAuthoring";
import type { GrammarBlock, GrammarBlockType } from "@features/grammar/types/grammar-content.types";
import { cn } from "@shared/utils";
import {
  ActionButton, ActionLink, ActionMenu, AuthoringFooter, AuthoringPage, Badge, ConfirmAction, LessonContext as LessonBreadcrumb,
  LessonStatus, menuItemClass, ReportError,
} from "./AuthoringUi";

const maxBlocks = 7;
const maxItems = 5;
const blockStyles: Record<GrammarBlockType, { label: string; className: string }> = {
  EXPLANATION: { label: "Giải thích", className: "bg-sky-100 text-sky-900" },
  FORMULA: { label: "Công thức", className: "bg-violet-100 text-violet-900" },
  EXAMPLE: { label: "Ví dụ", className: "bg-learning-mint text-primary" },
  RULE_QUICK_NOTE: { label: "Quy tắc", className: "bg-learning-note text-learning-note-ink" },
  COMMON_MISTAKE: { label: "Lỗi thường gặp", className: "bg-pink-100 text-pink-900" },
};
const blockTypes = Object.keys(blockStyles) as GrammarBlockType[];

function createBlock(type: GrammarBlockType): GrammarBlock {
  return {
    id: crypto.randomUUID(),
    type,
    ...(type === "EXAMPLE" && { examples: [{ english: "", vietnamese: "", analysis: "" }] }),
    ...(type === "RULE_QUICK_NOTE" && { ruleItems: [""] }),
  };
}

export function BlockTypeBadge({ type }: { type: GrammarBlockType }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", blockStyles[type].className)}>
    {blockStyles[type].label}
  </span>;
}

export function BlockContent({ block }: { block: GrammarBlock }) {
  switch (block.type) {
    case "EXPLANATION":
      return <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{block.text}</p>;
    case "FORMULA": {
      const parts = block.formula?.split(/\s+\+\s+/) ?? [];
      return <div className="grid gap-2">
        {parts.length > 0 && <div className="flex flex-wrap items-center justify-center gap-2">
          {parts.map((part, index) => <span className="flex max-w-full items-center gap-2" key={index}>
            {index > 0 && <span>+</span>}
            <span className="rounded-lg bg-violet-100 px-3 py-2 font-bold whitespace-pre-wrap text-violet-900 [overflow-wrap:anywhere]">{part}</span>
          </span>)}
        </div>}
        {block.text && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{block.text}</p>}
      </div>;
    }
    case "EXAMPLE":
      return <ul className="divide-y divide-outline-variant">
        {block.examples?.map((item, index) => <li className="py-2 [overflow-wrap:anywhere]" key={index}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <strong lang="en">{item.english}</strong><span className="text-on-surface-variant">{item.vietnamese}</span>
          </div>
          {item.analysis && <p className="mt-1 text-xs text-on-surface-variant">{item.analysis}</p>}
        </li>)}
      </ul>;
    case "RULE_QUICK_NOTE":
      return <div className="grid gap-2 [overflow-wrap:anywhere]">
        <p className="whitespace-pre-wrap">{block.text}</p>
        <ul className="list-disc space-y-1 ps-5">{block.ruleItems?.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>;
    case "COMMON_MISTAKE":
      return <div className="grid gap-2 [overflow-wrap:anywhere]">
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="rounded-lg bg-error/10 p-3 text-error">
            <strong className="mb-1 flex items-center gap-1"><X className="size-4" aria-hidden />Sai</strong>{block.incorrect}
          </p>
          <p className="rounded-lg bg-learning-mint p-3 text-primary">
            <strong className="mb-1 flex items-center gap-1"><Check className="size-4" aria-hidden />Đúng</strong>{block.correct}
          </p>
        </div>
        {block.explanation && <p className="whitespace-pre-wrap">{block.explanation}</p>}
      </div>;
  }
}

function BlockField({ label, value, onChange, multiline, required }: {
  label: string; value?: string | null; onChange: (value: string) => void; multiline?: boolean; required?: boolean;
}) {
  const props = { className: fieldClass, value: value ?? "", onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), required };
  return <label className="grid gap-1 font-semibold">
    <span>{label}{required && <span aria-hidden="true" className="ml-1 text-error">*</span>}</span>
    {multiline ? <textarea {...props} className={cn(fieldClass, "min-h-24 resize-y font-normal")} /> :
      <input {...props} className={cn(fieldClass, "font-normal")} />}
  </label>;
}

function BlockEditor({ initial, editing, busy, error, retry, onClose, onSave }: {
  initial: GrammarBlock; editing: boolean; busy: boolean; error: string | null;
  retry?: () => void;
  onClose: () => void; onSave: (block: GrammarBlock) => void;
}) {
  const [block, setBlock] = useState(initial);
  const [validation, setValidation] = useState<string | null>(null);
  const { type } = block;
  const examples = block.examples ?? [];
  const rules = block.ruleItems ?? [];
  const setText = (key: "title" | "text" | "formula" | "explanation" | "incorrect" | "correct", value: string) => {
    setBlock((previous) => ({ ...previous, [key]: value }));
    setValidation(null);
  };
  const hasText = (value?: string | null) => Boolean(value?.trim());
  const valid = {
    EXPLANATION: hasText(block.text),
    FORMULA: hasText(block.formula),
    EXAMPLE: examples.length >= 1 && examples.length <= maxItems && examples.every(({ english, vietnamese }) => hasText(english) && hasText(vietnamese)),
    RULE_QUICK_NOTE: hasText(block.title) && hasText(block.text) && rules.length >= 1 && rules.length <= maxItems && rules.every(hasText),
    COMMON_MISTAKE: hasText(block.incorrect) && hasText(block.correct) && hasText(block.explanation),
  }[type];

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto bg-surface-container-lowest sm:max-w-2xl" showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>{editing ? "Sửa khối nội dung" : "Thêm khối nội dung"}</DialogTitle>
        <DialogDescription>{blockStyles[type].label}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSave(block);
        else setValidation("Hãy điền đủ nội dung bắt buộc của khối.");
      }}>
        <fieldset disabled={busy} className="grid gap-4">
          {(type === "EXPLANATION" || type === "RULE_QUICK_NOTE") &&
            <BlockField label="Tiêu đề" value={block.title} required={type === "RULE_QUICK_NOTE"} onChange={(value) => setText("title", value)} />}
          {(type === "EXPLANATION" || type === "RULE_QUICK_NOTE") &&
            <BlockField label={type === "EXPLANATION" ? "Nội dung giải thích" : "Nội dung quy tắc"} value={block.text} multiline required onChange={(value) => setText("text", value)} />}
          {type === "FORMULA" && <>
            <BlockField label="Công thức" value={block.formula} required onChange={(value) => setText("formula", value)} />
            <BlockField label="Giải thích công thức" value={block.text} multiline onChange={(value) => setText("text", value)} />
          </>}
          {type === "EXAMPLE" && <>
            {examples.map((example, index) => {
              function update(key: "english" | "vietnamese" | "analysis", value: string) {
                setBlock({ ...block, examples: examples.map((item, i) => i === index ? { ...item, [key]: value } : item) });
                setValidation(null);
              }
              return <div key={index} className="grid gap-3 rounded-lg border border-outline-variant p-3">
                <div className="flex items-center justify-between gap-2">
                  <strong>Ví dụ {index + 1}</strong>
                  <ActionButton type="button" size="icon" variant="outline" aria-label={"Xóa ví dụ " + (index + 1)} disabled={examples.length <= 1}
                    onClick={() => setBlock({ ...block, examples: examples.filter((_, i) => i !== index) })}><X aria-hidden /></ActionButton>
                </div>
                <BlockField label="Câu tiếng Anh" required value={example.english} onChange={(value) => update("english", value)} />
                <BlockField label="Nghĩa tiếng Việt" required value={example.vietnamese} onChange={(value) => update("vietnamese", value)} />
                <BlockField label="Phân tích" value={example.analysis} onChange={(value) => update("analysis", value)} />
              </div>;
            })}
            <ActionButton className="justify-self-start" type="button" variant="outline" disabled={examples.length >= maxItems}
              onClick={() => setBlock({ ...block, examples: [...examples, { english: "", vietnamese: "", analysis: "" }] })}><Plus aria-hidden />Thêm ví dụ</ActionButton>
          </>}
          {type === "RULE_QUICK_NOTE" && <>
            {rules.map((rule, index) => <div key={index} className="grid grid-cols-[1fr_auto] items-end gap-2">
              <BlockField label={"Mục quy tắc " + (index + 1)} required value={rule} onChange={(value) => {
                setBlock({ ...block, ruleItems: rules.map((entry, i) => i === index ? value : entry) });
                setValidation(null);
              }} />
              <ActionButton type="button" size="icon" variant="outline" aria-label={"Xóa mục quy tắc " + (index + 1)}
                disabled={rules.length <= 1} onClick={() => setBlock({ ...block, ruleItems: rules.filter((_, i) => i !== index) })}><X aria-hidden /></ActionButton>
            </div>)}
            <ActionButton className="justify-self-start" type="button" variant="outline" disabled={rules.length >= maxItems}
              onClick={() => setBlock({ ...block, ruleItems: [...rules, ""] })}><Plus aria-hidden />Thêm mục quy tắc</ActionButton>
          </>}
          {type === "COMMON_MISTAKE" && <>
            <BlockField label="Câu hoặc cấu trúc sai" required value={block.incorrect} onChange={(value) => setText("incorrect", value)} />
            <BlockField label="Câu hoặc cấu trúc đúng" required value={block.correct} onChange={(value) => setText("correct", value)} />
            <BlockField label="Giải thích lý do" required multiline value={block.explanation} onChange={(value) => setText("explanation", value)} />
          </>}
        </fieldset>
        <ReportError error={validation ?? error} retry={validation ? undefined : retry} />
        <DialogFooter>
          <ActionButton type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</ActionButton>
          <ActionButton type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu khối"}</ActionButton>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export function GrammarBlocks({ topic, lesson: initial, refresh }: LessonContext) {
  const [lesson, setLesson] = useState(initial);
  const [editor, setEditor] = useState<GrammarBlock>();
  const [remove, setRemove] = useState<GrammarBlock>();
  const [folded, setFolded] = useState<string[]>([]);
  const { run, busy, error, conflict, saved, clearError } = useAuthoringAction();
  const steps = lessonSteps(topic.id, lesson.id);
  const blocks = lesson.blocks;
  const archived = lesson.status === "ARCHIVED" || topic.status === "ARCHIVED";
  const canAdd = !archived && !busy && blocks.length < maxBlocks;

  async function persist(next: GrammarBlock[]) {
    const result = await run(() => saveLessonContent(lesson, topic.id, { blocks: next }), () => savedAtLabel(true));
    if (result) setLesson(result);
    return Boolean(result);
  }

  function reorder(from: number, to: number) {
    if (!busy && !archived && from >= 0 && from !== to && to >= 0 && to < blocks.length) {
      void persist(moveItem(blocks, from, to));
    }
  }

  function close() {
    setEditor(undefined);
    setRemove(undefined);
    clearError();
  }

  return <AuthoringPage title="Nội dung bài học" subtitle="Biên soạn giải thích, công thức, ví dụ, quy tắc và lỗi thường gặp."
    badge={<LessonStatus lesson={lesson} />} context={<LessonBreadcrumb topic={topic} lesson={lesson} />}
    current={1} steps={steps} locked={busy}
    action={!busy && <ActionLink to={grammarPaths.lessonPreview(topic.id, lesson.id)}>Xem trước bài học</ActionLink>}
    footer={<AuthoringFooter backTo={steps[0].to} backLabel={steps[0].label} nextTo={steps[2].to}
      nextLabel="Tiếp tục: Luyện tập" status={saved} busy={busy} />}>
    {lesson.hasDraft && <span><Badge tone="warning">Có thay đổi chưa xuất bản</Badge></span>}
    <ReportError error={!editor && !remove ? error : null} retry={conflict ? refresh : undefined} />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-body-md text-on-surface-variant">{blocks.length} nội dung · Tối đa {maxBlocks} nội dung mỗi bài</p>
      {!archived && (canAdd ?
        <ActionMenu label="Thêm khối" trigger={<><Plus className="size-4" aria-hidden />Thêm khối<ChevronDown className="size-4" aria-hidden /></>}>
          {blockTypes.map((type) => <button type="button" className={menuItemClass} key={type} onClick={() => {
            clearError();
            setEditor(createBlock(type));
          }}>{blockStyles[type].label}</button>)}
        </ActionMenu> : <ActionButton disabled><Plus aria-hidden />Thêm khối</ActionButton>)}
    </div>
    {blocks.length === 0 && <p className={panelClass}>
      {archived ? "Bài học chưa có khối nội dung." : "Chưa có khối nội dung. Thêm ít nhất một khối lý thuyết để hoàn thiện bài học."}
    </p>}
    <ol className="grid gap-3">
      {blocks.map((block, index) => {
        const collapsed = folded.includes(block.id);
        const title = block.title || blockStyles[block.type].label;
        const bodyId = "grammar-block-" + block.id;
        return <li key={block.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:flex-nowrap">

            <ActionButton variant="ghost" size="icon" className="size-7 min-h-7" aria-expanded={!collapsed}
              aria-controls={bodyId} aria-label={(collapsed ? "Mở khối " : "Thu gọn khối ") + (index + 1)}
              onClick={() => setFolded(collapsed ? folded.filter((id) => id !== block.id) : [...folded, block.id])}>
              <ChevronDown className={cn("size-4", collapsed && "-rotate-90")} aria-hidden />
            </ActionButton>
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <BlockTypeBadge type={block.type} />
            <span className="min-w-20 grow font-semibold [overflow-wrap:anywhere]">{block.title}</span>
            {!archived && <div className="ml-auto flex items-center gap-2">
              <ActionButton variant="outline" disabled={busy} aria-label={"Sửa khối " + (index + 1) + " " + title}
                onClick={() => { clearError(); setEditor(block); }}>Sửa</ActionButton>
              <ActionMenu label={"Thao tác khối " + (index + 1)}>
                <button type="button" className={menuItemClass} disabled={busy || index === 0} onClick={() => reorder(index, index - 1)}>
                  <ArrowUp className="mr-2 inline size-4" aria-hidden />Di chuyển lên
                </button>
                <button type="button" className={menuItemClass} disabled={busy || index === blocks.length - 1} onClick={() => reorder(index, index + 1)}>
                  <ArrowDown className="mr-2 inline size-4" aria-hidden />Di chuyển xuống
                </button>
                <button type="button" className={menuItemClass} disabled={!canAdd} onClick={() => {
                  const next = [...blocks];
                  next.splice(index + 1, 0, { ...block, id: crypto.randomUUID() });
                  void persist(next);
                }}>Nhân bản</button>
                <button type="button" className={cn(menuItemClass, "text-error")} disabled={busy}
                  onClick={() => { clearError(); setRemove(block); }}>Xóa</button>
              </ActionMenu>
            </div>}
          </div>
          <div id={bodyId} hidden={collapsed} className="px-4 pb-4 sm:ps-12"><BlockContent block={block} /></div>
        </li>;
      })}
    </ol>
    {editor && <BlockEditor key={editor.id} initial={editor} editing={blocks.some((block) => block.id === editor.id)} busy={busy} error={error} retry={conflict ? refresh : undefined}
      onClose={close} onSave={(block) => {
        const next = blocks.some(({ id }) => id === block.id) ? blocks.map((entry) => entry.id === block.id ? block : entry) : [...blocks, block];
        void persist(next).then((ok) => { if (ok) close(); });
      }} />}
    {remove && <ConfirmAction open title="Xóa khối nội dung?"
      description="Khối sẽ được xóa khỏi nội dung đang soạn của bài học." confirm="Xóa khối" destructive busy={busy} error={error} retry={conflict ? refresh : undefined}
      onClose={close} onConfirm={() => { void persist(blocks.filter((block) => block.id !== remove.id)).then((ok) => { if (ok) close(); }); }} />}
  </AuthoringPage>;
}

