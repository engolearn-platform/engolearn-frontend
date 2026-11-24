import type { TopicExpressionPurposeResource } from "@features/topic/types/topic-management.types";
import ExpressionCard from "./ExpressionCard";
import {
  expressionGroupTypeLabel,
  expressionVocabularyLinks,
} from "@features/topic/utils/topic-expression-presentation";

interface PurposeGroupSectionProps {
  purpose: TopicExpressionPurposeResource;
  groupIndex: number;
  vocabWordById: Map<string, string>;
}

export default function PurposeGroupSection({ purpose, groupIndex, vocabWordById }: PurposeGroupSectionProps) {
  const knownGroupType = expressionGroupTypeLabel(purpose.groupType);
  const unknownGroupType = purpose.groupType && !knownGroupType ? purpose.groupType : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="text-label-sm text-on-surface-variant">Nhóm {groupIndex + 1}</p>
          <h3 className="break-words text-headline-md font-semibold text-on-surface">
            {purpose.purposeEn || purpose.purposeVi || `Nhóm ${groupIndex + 1}`}
          </h3>
          {purpose.purposeEn && purpose.purposeVi && <p className="break-words text-body-md text-on-surface-variant">{purpose.purposeVi}</p>}
        </div>
        {!purpose.groupType && <span className="rounded-md bg-surface-container-low px-2.5 py-1 text-label-sm text-on-surface-variant">Chưa có loại nhóm</span>}
        {knownGroupType && <span className="rounded-md bg-surface-container-low px-2.5 py-1 text-label-sm font-semibold text-on-surface-variant">Loại nhóm: {knownGroupType}</span>}
        {unknownGroupType && <details className="text-label-sm text-on-surface-variant"><summary className="cursor-pointer">Loại nhóm chưa hỗ trợ</summary><code className="break-all">{unknownGroupType}</code></details>}
      </div>
      <p className="px-1 text-label-sm text-on-surface-variant">{purpose.examples.length} mẫu câu</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {purpose.examples.map((source, exampleIndex) => {
          const links = expressionVocabularyLinks(source.linkedVocabIds, vocabWordById);
          return (
            <ExpressionCard
              key={exampleIndex}
              example={{
                type: source.type,
                label: source.label,
                textEn: source.textEn ?? "",
                textVi: source.textVi ?? "",
                usageNote: source.usageNote ?? "",
                audioFile: source.audioUrl,
                linkedVocabIds: source.linkedVocabIds ?? [],
              }}
              vocabLinks={links.resolved}
              unresolvedVocabIds={links.unresolvedIds}
              onPreviewAudio={() => undefined}
              readOnly
            />
          );
        })}
      </div>
    </section>
  );
}
