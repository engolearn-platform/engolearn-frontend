import { useMemo, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import VocabularyCard from "@features/topic/components/management/upsert/editor/vocabulary/VocabularyCard";
import VocabularyHeaderCard from "@features/topic/components/management/upsert/editor/vocabulary/VocabularyHeaderCard";
import VocabularyQuickAddSlot from "@features/topic/components/management/upsert/editor/vocabulary/VocabularyQuickAddSlot";
import VocabularyUpsertDialog from "@features/topic/components/management/upsert/editor/vocabulary/VocabularyUpsertDialog";
import type { TopicVocabularyResource } from "@features/topic/types/topic-management.types";
import { mergeVocabularyEditorItem, toVocabularyEditorItem, type TopicVocabularyAuthoringDraft } from "@features/topic/utils/topic-vocabulary-authoring.adapter";

interface TopicItemVocabularyEditorViewProps {
  value: TopicVocabularyResource[];
  onChange: (value: TopicVocabularyResource[]) => void;
  disabled?: boolean;
  topicId: string;
}

const MAX_VOCABULARIES = 5;

export default function TopicItemVocabularyEditorView({
  value,
  onChange,
  disabled = false,
  topicId,
}: TopicItemVocabularyEditorViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const items = useMemo(
    () => value.map((resource, index) => toVocabularyEditorItem(resource, `vocab-row-${index}`)),
    [value],
  );
  const handleEdit = (id: string) => {
    const index = items.findIndex((entry) => entry.id === id);
    if (index < 0 || disabled) return;
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (disabled) return;
    const index = items.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    const word = items[index]?.word || "mục từ này";
    if (!window.confirm(`Bạn có chắc muốn xóa ${word}?`)) return;
    onChange(value.filter((_, current) => current !== index));
  };

  const handleSubmit = (draft: TopicVocabularyAuthoringDraft) => {
    if (disabled) return;
    if (editingIndex === null) {
      onChange([...value, mergeVocabularyEditorItem(undefined, draft, value.length)]);
    } else {
      onChange(value.map((resource, index) => index === editingIndex
        ? mergeVocabularyEditorItem(resource, draft, index)
        : resource));
    }
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingIndex(null);
  };

  function reorder(index: number, direction: -1 | 1) {
    const ordered = [...value];
    const [entry] = ordered.splice(index, 1);
    ordered.splice(index + direction, 0, entry);
    onChange(ordered.map((resource, orderIndex) => ({ ...resource, orderIndex })));
  }

  return (
    <section className="mx-auto flex w-full max-w-[940px] flex-col gap-6">
      <VocabularyHeaderCard count={value.length} max={MAX_VOCABULARIES} onAdd={() => {
        if (disabled) return;
        setEditingIndex(null);
        setDialogOpen(true);
      }} />
      <div className="flex flex-col gap-4">
        {items.map((entry, index) => (
          <div key={entry.id} className="space-y-2">
          <VocabularyCard
            resource={value[index]}
            onEdit={() => handleEdit(entry.id)}
            onDelete={() => handleDelete(entry.id)}
            readOnly={disabled}
          />
          {!disabled && value.length > 1 && <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => reorder(index, -1)}>Đưa từ lên</Button>
            <Button type="button" size="sm" variant="outline" disabled={index === items.length - 1} onClick={() => reorder(index, 1)}>Đưa từ xuống</Button>
          </div>}
          </div>
        ))}
      </div>
      <VocabularyQuickAddSlot visible={!disabled} nextIndex={value.length + 1} max={MAX_VOCABULARIES} onAdd={() => {
        setEditingIndex(null);
        setDialogOpen(true);
      }} />
      <VocabularyUpsertDialog
        topicId={topicId}
        open={dialogOpen}
        mode={editingIndex === null ? "add" : "edit"}
        nextIndex={value.length + 1}
        initial={editingIndex === null ? undefined : items[editingIndex]}
        initialResource={editingIndex === null ? undefined : value[editingIndex]}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
