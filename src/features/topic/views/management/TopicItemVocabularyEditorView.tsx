import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ROUTES, topicItemSectionPath } from "@shared/constants";
import { EmptyState } from "@shared/components";
import { Button } from "@/core/components/shadcn/button";
import {
  useTopicItemVocabularyForm,
  type TopicVocabularyUpsert,
} from "@features/topic/hooks/useTopicItemVocabularyForm";
import type { TopicItemStepKey } from "@features/topic/types/topic-create.types";
import TopicCreateFooterBar from "@features/topic/components/create/TopicCreateFooterBar";
import TopicCreateStepper from "@features/topic/components/create/TopicCreateStepper";
import TopicCreateWizardHeader from "@features/topic/components/create/TopicCreateWizardHeader";
import TopicItemSectionTabRail from "@features/topic/components/create/editor/TopicItemSectionTabRail";
import VocabularyCard from "@features/topic/components/create/editor/vocabulary/VocabularyCard";
import VocabularyHeaderCard from "@features/topic/components/create/editor/vocabulary/VocabularyHeaderCard";
import VocabularyQuickAddSlot from "@features/topic/components/create/editor/vocabulary/VocabularyQuickAddSlot";
import VocabularyUpsertDialog from "@features/topic/components/create/editor/vocabulary/VocabularyUpsertDialog";

function stepDetail(
  steps: { key: string; detail: string }[],
  key: string,
): string {
  const found = steps.find((step) => step.key === key);
  return found ? found.detail.replace(/[()]/g, "") : "";
}

export default function TopicItemVocabularyEditorView() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const {
    item,
    items,
    count,
    max,
    canAdd,
    addItem,
    patchItem,
    removeItem,
    isValid,
  } = useTopicItemVocabularyForm(itemId);
  const [showErrors, setShowErrors] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleBackToList = () => navigate(ROUTES.ADMIN_TOPIC_CREATE_ITEMS);

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
          <EmptyState
            title="Không tìm thấy topic item"
            description="Topic item này không tồn tại trong bản nháp hiện tại."
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToList}
            className="mx-auto w-full rounded-xl sm:w-auto"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const handleSelectSection = (section: TopicItemStepKey) => {
    if (section === "vocabulary" || !itemId) return;
    navigate(topicItemSectionPath(itemId, section));
  };

  const handleBack = () => navigate(topicItemSectionPath(itemId ?? "", "context"));

  const handleContinue = () => {
    if (!isValid || !itemId) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    navigate(topicItemSectionPath(itemId, "expressions"));
  };

  const handleAdd = () => {
    if (!canAdd) return;
    setDialogMode("add");
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setDialogMode("edit");
    setEditingId(id);
    setDialogOpen(true);
  };

  const handlePreviewAudio = () => undefined;

  const handleSubmitDialog = (draft: TopicVocabularyUpsert) => {
    if (dialogMode === "add") {
      addItem(draft);
    } else if (editingId) {
      patchItem(editingId, { ...draft, audioUploaded: true });
    }
    setDialogOpen(false);
    setEditingId(null);
  };

  const editingItem =
    dialogMode === "edit"
      ? items.find((entry) => entry.id === editingId)
      : undefined;

  const quizStep = item.steps.find((step) => step.key === "quiz");

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicCreateWizardHeader
            title={`Bước 2: Biên soạn Từ vựng — ${item.titleEn}`}
          />
          <TopicCreateStepper activeStep={1} />
        </div>

        <TopicItemSectionTabRail
          activeSection="vocabulary"
          vocabNote={stepDetail(item.steps, "vocabulary")}
          expressionsNote={stepDetail(item.steps, "expressions")}
          quizNote={stepDetail(item.steps, "quiz")}
          quizEmpty={!quizStep || quizStep.state === "empty"}
          onSelect={handleSelectSection}
        />

        <VocabularyHeaderCard count={count} max={max} onAdd={handleAdd} />

        <div className="flex flex-col gap-4">
          {items.map((entry) => (
            <VocabularyCard
              key={entry.id}
              item={entry}
              onEdit={handleEdit}
              onDelete={removeItem}
              onPreviewAudio={handlePreviewAudio}
            />
          ))}
        </div>

        {showErrors && !isValid && (
          <p className="text-label-sm text-error">
            Mỗi mục từ cần có từ vựng, nghĩa tiếng Việt và ít nhất một câu ví
            dụ tiếng Anh.
          </p>
        )}

        <VocabularyQuickAddSlot
          visible={canAdd}
          nextIndex={count + 1}
          max={max}
          onAdd={handleAdd}
        />

        <VocabularyUpsertDialog
          open={dialogOpen}
          mode={dialogMode}
          nextIndex={count + 1}
          initial={editingItem}
          onClose={() => {
            setDialogOpen(false);
            setEditingId(null);
          }}
          onSubmit={handleSubmitDialog}
        />

        <TopicCreateFooterBar onBack={handleBack} onContinue={handleContinue} />
      </div>
    </div>
  );
}
