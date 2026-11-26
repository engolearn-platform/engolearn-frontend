import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import type {
  TopicExpressionExampleResource,
  TopicExpressionGroupType,
  TopicExpressionPurposeResource,
  TopicExpressionResource,
  TopicVocabularyResource,
} from "@features/topic/types/topic-management.types";
import ExpressionsHeaderCard from "@features/topic/components/management/upsert/editor/expressions/ExpressionsHeaderCard";
import ExpressionUpsertDialog from "@features/topic/components/management/upsert/editor/expressions/ExpressionUpsertDialog";
import ExpressionCard from "@features/topic/components/management/upsert/editor/expressions/ExpressionCard";
import { expressionVocabularyLinks } from "@features/topic/utils/topic-expression-presentation";

const GROUP_TYPES: Record<TopicExpressionGroupType, string> = {
  BASIC: "Cơ bản",
  COMMON: "Phổ biến",
  PLACEHOLDER: "Mẫu thế chỗ",
};

const fieldClass = "w-full rounded-lg bg-surface-container-low px-3 py-2 text-body-md text-on-surface";
type DialogPosition = { block: number; group: number; row?: number };

function move<T>(entries: T[], index: number, direction: -1 | 1) {
  const ordered = [...entries];
  const [entry] = ordered.splice(index, 1);
  ordered.splice(index + direction, 0, entry);
  return ordered;
}

export default function TopicItemExpressionsEditorView({ value, onChange, vocabulary, itemTitle, topicId, disabled = false, minor = false }: {
  value: TopicExpressionResource[];
  onChange: (value: TopicExpressionResource[]) => void;
  vocabulary: TopicVocabularyResource[];
  itemTitle: string;
  topicId: string;
  disabled?: boolean;
  minor?: boolean;
}) {
  const [dialog, setDialog] = useState<DialogPosition | null>(null);
  const vocabularyNames = new Map(vocabulary.flatMap(({ vocabId, snapshot }) => vocabId ? [[vocabId, snapshot?.word ?? vocabId]] : []));
  const vocabularyWords = new Map(vocabulary.flatMap(({ vocabId, snapshot }) => vocabId && snapshot?.word ? [[vocabId, snapshot.word]] : []));
  const allPurposes = value.flatMap((block) => block.purposes);
  const editGroup = (block: number, group: number, patch: Partial<TopicExpressionPurposeResource>) => {
    onChange(value.map((entry, index) => index === block
      ? { ...entry, purposes: entry.purposes.map((purpose, position) => position === group ? { ...purpose, ...patch } : purpose) }
      : entry));
  };
  const changePurposes = (block: number, purposes: TopicExpressionPurposeResource[]) => {
    onChange(value.map((entry, index) => index === block
      ? { ...entry, purposes: purposes.map((purpose, orderIndex) => ({ ...purpose, orderIndex })) } : entry));
  };

  function addGroup() {
    if (disabled || minor) return;
    const blank: TopicExpressionPurposeResource = { purposeEn: null, purposeVi: null, groupType: null, orderIndex: 0, examples: [] };
    if (!value.length) onChange([{ purposes: [blank], tips: null }]);
    else changePurposes(value.length - 1, [...value[value.length - 1].purposes, blank]);
  }

  function submitExample(example: TopicExpressionExampleResource) {
    if (!dialog || disabled) return;
    const { block, group, row } = dialog;
    const { examples } = value[block].purposes[group];
    editGroup(block, group, { examples: row === undefined ? [...examples, example]
      : examples.map((entry, index) => index === row ? example : entry) });
    setDialog(null);
  }

  return <fieldset disabled={disabled} className="flex flex-col gap-5">
    <ExpressionsHeaderCard itemTitleEn={itemTitle} totalExamples={allPurposes.reduce((count, purpose) => count + purpose.examples.length, 0)}
      purposeCount={allPurposes.length} maxPurposes={3} onAdd={addGroup} showAdd={!minor} addLabel="Thêm nhóm mẫu câu" />
    {value.map((block, blockIndex) => <div key={blockIndex} className="space-y-5">
      {!minor && value.length > 1 && <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={blockIndex === 0} onClick={() => onChange(move(value, blockIndex, -1))}>Đưa khối lên</Button>
        <Button type="button" variant="outline" disabled={blockIndex === value.length - 1} onClick={() => onChange(move(value, blockIndex, 1))}>Đưa khối xuống</Button>
      </div>}
      {block.purposes.map((purpose, groupIndex) => <section key={groupIndex}
        className="space-y-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-headline-sm font-semibold">{purpose.purposeVi || "Nhóm mẫu câu"}</h2>
          {!minor && <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={groupIndex === 0} onClick={() => changePurposes(blockIndex, move(block.purposes, groupIndex, -1))}>Đưa nhóm lên</Button>
            <Button type="button" size="sm" variant="outline" disabled={groupIndex + 1 === block.purposes.length} onClick={() => changePurposes(blockIndex, move(block.purposes, groupIndex, 1))}>Đưa nhóm xuống</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => {
              if (window.confirm("Xóa nhóm và các mẫu câu trong nhóm?")) changePurposes(blockIndex, block.purposes.filter((_, index) => index !== groupIndex));
            }}>Xóa nhóm</Button>
          </div>}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1"><span>Tên nhóm tiếng Anh</span>
            <input disabled={minor} className={fieldClass} value={purpose.purposeEn ?? ""} onChange={(event) => editGroup(blockIndex, groupIndex, { purposeEn: event.target.value || null })} />
          </label>
          <label className="grid gap-1"><span>Tên nhóm tiếng Việt</span>
            <input className={fieldClass} value={purpose.purposeVi ?? ""} onChange={(event) => editGroup(blockIndex, groupIndex, { purposeVi: event.target.value || null })} />
          </label>
          <label className="grid gap-1"><span>Loại nhóm</span>
            <select disabled={minor} className={fieldClass} value={purpose.groupType ?? ""} onChange={(event) => editGroup(blockIndex, groupIndex, { groupType: (event.target.value || null) as TopicExpressionGroupType | null })}>
              <option value="">Chưa chọn</option>
              {Object.entries(GROUP_TYPES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {purpose.examples.map((source, row) => {
            const { examples } = purpose;
            const links = expressionVocabularyLinks(source.linkedVocabIds, vocabularyWords);
            return <div key={row} className="space-y-2">
              <ExpressionCard example={{
                type: source.type, label: source.label,
                textEn: source.textEn ?? "", textVi: source.textVi ?? "", usageNote: source.usageNote ?? "",
                audioFile: source.audioUrl, linkedVocabIds: source.linkedVocabIds ?? [],
              }} vocabLinks={links.resolved} unresolvedVocabIds={links.unresolvedIds}
                onEdit={() => setDialog({ block: blockIndex, group: groupIndex, row })}
                onDelete={!minor ? () => {
                  if (window.confirm("Xóa mẫu câu khỏi bản nháp?")) editGroup(blockIndex, groupIndex, { examples: examples.filter((_, index) => index !== row) });
                } : undefined}
                onDuplicate={!minor ? () => editGroup(blockIndex, groupIndex, { examples: [...examples, { ...source }] }) : undefined}
                minorMode={minor}
                onPreviewAudio={() => undefined} />
              {!minor && <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={row === 0} onClick={() => editGroup(blockIndex, groupIndex, { examples: move(examples, row, -1) })}>Đưa mẫu câu lên</Button>
                <Button type="button" size="sm" variant="outline" disabled={row + 1 === examples.length} onClick={() => editGroup(blockIndex, groupIndex, { examples: move(examples, row, 1) })}>Đưa mẫu câu xuống</Button>
              </div>}
            </div>;
          })}
        </div>
        {!minor && <Button type="button" variant="outline" onClick={() => setDialog({ block: blockIndex, group: groupIndex })}>Thêm mẫu câu</Button>}
      </section>)}
      <label className="grid gap-1"><span>Mẹo sử dụng mẫu câu</span>
        <textarea disabled={minor} className={fieldClass} value={block.tips ?? ""} onChange={(event) => onChange(value.map((entry, index) =>
          index === blockIndex ? { ...entry, tips: event.target.value || null } : entry))} />
      </label>
    </div>)}
    {dialog && <ExpressionUpsertDialog topicId={topicId} minor={minor} initial={dialog.row === undefined ? undefined : value[dialog.block].purposes[dialog.group].examples[dialog.row]}
      vocabulary={vocabularyNames} onClose={() => setDialog(null)} onSubmit={submitExample} />}
  </fieldset>;
}
