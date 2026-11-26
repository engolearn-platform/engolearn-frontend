import { useState } from "react";
import { Drama, Lightbulb, PlusCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { TopicContextResource } from "@features/topic/types/topic-management.types";
import ContextDialogueTurnRow from "./ContextDialogueTurnRow";

const EMPTY_CONTEXT: TopicContextResource = { prompt: null, scenarioDescription: null, dialogue: [], durationSec: null, tips: null };
const FIELD_CLASS = "w-full rounded-lg bg-surface-container-low px-4 py-3 text-body-md text-on-surface focus:ring-2 focus:ring-primary";
type Dialogue = TopicContextResource["dialogue"][number];

export default function TopicContextFormCard({ value, onChange, topicId, disabled = false }: {
  value: TopicContextResource | null;
  onChange: (value: TopicContextResource | null) => void;
  disabled?: boolean;
  topicId: string;
}) {
  const context = value ?? EMPTY_CONTEXT;
  // Draft list keys belong to the editor, while the ordered array is committed with the Topic revision.
  const [keys, setKeys] = useState(() => context.dialogue.map(() => crypto.randomUUID()));

  function patch(fields: Partial<TopicContextResource>) {
    onChange({ ...context, ...fields });
  }

  function addTurn() {
    setKeys([...keys, crypto.randomUUID()]);
    patch({ dialogue: [...context.dialogue, { speaker: null, textEn: null, textVi: null, audioUrl: null }] });
  }

  function editTurn(index: number, fields: Partial<Dialogue>) {
    patch({ dialogue: context.dialogue.map((turn, position) => position === index ? { ...turn, ...fields } : turn) });
  }

  function removeTurn(index: number) {
    if (!window.confirm("Xóa dòng thoại khỏi bản nháp?")) return;
    setKeys(keys.filter((_, position) => position !== index));
    patch({ dialogue: context.dialogue.filter((_, position) => position !== index) });
  }

  function moveTurn(index: number, direction: number) {
    const destination = index + direction;
    const turns = [...context.dialogue];
    const order = [...keys];
    [turns[index], turns[destination]] = [turns[destination], turns[index]];
    [order[index], order[destination]] = [order[destination], order[index]];
    setKeys(order);
    patch({ dialogue: turns });
  }

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container pb-2">
        <h2 className="flex items-center gap-2 text-headline-sm font-semibold"><Drama className="size-6 text-primary" /> Bối cảnh tình huống (Context)</h2>
        {value && <Button type="button" variant="outline" onClick={() => {
          if (window.confirm("Xóa toàn bộ bối cảnh khỏi bản nháp?")) {
            setKeys([]);
            onChange(null);
          }
        }}>Xóa bối cảnh</Button>}
      </header>

      <label className="grid gap-2">
        <span className="text-label-lg font-semibold">Mô tả bối cảnh tình huống</span>
        <textarea rows={4} value={context.scenarioDescription ?? ""} onChange={(event) => patch({ scenarioDescription: event.target.value || null })} className={FIELD_CLASS} />
      </label>
      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-label-lg font-semibold"><Lightbulb className="size-5 text-primary" /> Câu hỏi gợi mở phản xạ</span>
        <textarea rows={2} value={context.prompt ?? ""} onChange={(event) => patch({ prompt: event.target.value || null })} className={FIELD_CLASS} />
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-label-lg font-semibold">Hội thoại mẫu</h3>
          <Button type="button" variant="ghost" onClick={addTurn}><PlusCircle className="size-4" /> Thêm dòng thoại</Button>
        </div>
        {context.dialogue.length > 0 && <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3 sm:p-4">
          {context.dialogue.map((turn, index) => (
            <ContextDialogueTurnRow key={keys[index]} turn={turn} topicId={topicId}
              onChange={(fields) => editTurn(index, fields)} onRemove={() => removeTurn(index)}
              onUp={index > 0 ? () => moveTurn(index, -1) : undefined}
              onDown={index + 1 < context.dialogue.length ? () => moveTurn(index, 1) : undefined} />
          ))}
        </div>}
      </div>

      <label className="grid gap-2">
        <span className="text-label-lg font-semibold">Mẹo cho người học</span>
        <textarea value={context.tips ?? ""} onChange={(event) => patch({ tips: event.target.value || null })} className={FIELD_CLASS} />
      </label>
      <label className="grid gap-2">
        <span className="text-label-lg font-semibold">Thời lượng bối cảnh (giây)</span>
        <input type="number" min={0} step={1} value={context.durationSec ?? ""}
          onChange={(event) => patch({ durationSec: event.target.value === "" ? null : event.target.valueAsNumber })}
          className={FIELD_CLASS} />
      </label>
    </fieldset>
  );
}
