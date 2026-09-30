import type { TopicExpressionPurpose } from "@features/topic/types/topic-create.types";
import ExpressionCard from "./ExpressionCard";

interface PurposeGroupSectionProps {
  purpose: TopicExpressionPurpose;
  groupIndex: number;
  vocabWordById: Map<string, string>;
  onEdit: (exampleId: string) => void;
  onDelete: (exampleId: string) => void;
  onDuplicate: (exampleId: string) => void;
  onPreviewAudio: () => void;
}

const GROUP_BADGES = ["A", "B", "C"];

export default function PurposeGroupSection({
  purpose,
  groupIndex,
  vocabWordById,
  onEdit,
  onDelete,
  onDuplicate,
  onPreviewAudio,
}: PurposeGroupSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-[12px] font-bold text-on-primary">
            {GROUP_BADGES[groupIndex] ?? String(groupIndex + 1)}
          </div>
          <div>
            <h2 className="text-headline-md font-semibold text-on-surface">
              Nhóm {groupIndex + 1}: {purpose.purposeVi}
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              {purpose.purposeEn} ({purpose.examples.length} mẫu câu)
            </p>
          </div>
        </div>
        <span className="rounded-full bg-surface-container-highest px-3 py-1 text-label-sm text-on-surface-variant">
          {purpose.examples.length} items
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {purpose.examples.map((example) => (
          <ExpressionCard
            key={example.id}
            example={example}
            vocabWords={example.linkedVocabIds
              .map((id) => vocabWordById.get(id))
              .filter((word): word is string => Boolean(word))}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPreviewAudio={onPreviewAudio}
          />
        ))}
      </div>
    </section>
  );
}
