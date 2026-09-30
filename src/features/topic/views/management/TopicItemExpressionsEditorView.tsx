import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ROUTES, topicItemSectionPath } from "@shared/constants";
import { EmptyState } from "@shared/components";
import { Button } from "@/core/components/shadcn/button";
import {
  useTopicItemExpressionsForm,
  type ExpressionExampleUpsert,
} from "@features/topic/hooks/useTopicItemExpressionsForm";
import type { TopicItemStepKey } from "@features/topic/types/topic-create.types";
import TopicCreateFooterBar from "@features/topic/components/create/TopicCreateFooterBar";
import TopicCreateStepper from "@features/topic/components/create/TopicCreateStepper";
import TopicCreateWizardHeader from "@features/topic/components/create/TopicCreateWizardHeader";
import TopicItemSectionTabRail from "@features/topic/components/create/editor/TopicItemSectionTabRail";
import ExpressionsHeaderCard from "@features/topic/components/create/editor/expressions/ExpressionsHeaderCard";
import ExpressionsQuickAddSlot from "@features/topic/components/create/editor/expressions/ExpressionsQuickAddSlot";
import ExpressionUpsertDialog, {
  type ExpressionDialogInitial,
} from "@features/topic/components/create/editor/expressions/ExpressionUpsertDialog";
import PurposeGroupSection from "@features/topic/components/create/editor/expressions/PurposeGroupSection";

function stepDetail(
  steps: { key: string; detail: string }[],
  key: string,
): string {
  const found = steps.find((step) => step.key === key);
  return found ? found.detail.replace(/[()]/g, "") : "";
}

export default function TopicItemExpressionsEditorView() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const {
    item,
    purposes,
    purposeOptions,
    vocabOptions,
    vocabWordById,
    totalExamples,
    maxPurposes,
    maxExamples,
    canAddPurpose,
    addExampleToPurpose,
    patchExample,
    removeExample,
    duplicateExample,
    findExample,
    lookupPurposeVi,
    isValid,
  } = useTopicItemExpressionsForm(itemId);
  const [showErrors, setShowErrors] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleBackToList = () => navigate(ROUTES.ADMIN_TOPIC_CREATE_ITEMS);

  const hasFreeSlot =
    canAddPurpose ||
    purposes.some((purpose) => purpose.examples.length < maxExamples);

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
    if (section === "expressions" || !itemId) return;
    navigate(topicItemSectionPath(itemId, section));
  };

  const handleBack = () => navigate(topicItemSectionPath(itemId ?? "", "vocabulary"));

  const handleContinue = () => {
    if (!isValid || !itemId) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    navigate(topicItemSectionPath(itemId, "quiz"));
  };

  const handleAdd = () => {
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

  const handleSubmitDialog = (draft: ExpressionExampleUpsert) => {
    if (dialogMode === "add") {
      addExampleToPurpose(draft);
    } else if (editingId) {
      patchExample(editingId, {
        purposeEn: draft.purposeEn,
        purposeVi: draft.purposeVi,
        type: draft.type,
        textEn: draft.textEn,
        textVi: draft.textVi,
        usageNote: draft.usageNote,
        audioFile: draft.audioFile,
        linkedVocabIds: draft.linkedVocabIds,
      });
    }
    setDialogOpen(false);
    setEditingId(null);
  };

  const editingInitial: ExpressionDialogInitial | undefined =
    dialogMode === "edit" && editingId
      ? (() => {
          const found = findExample(editingId);
          if (!found) return undefined;
          return {
            purposeEn: found.purpose.purposeEn,
            purposeVi: found.purpose.purposeVi,
            type: found.example.type,
            textEn: found.example.textEn,
            textVi: found.example.textVi,
            usageNote: found.example.usageNote,
            audioFile: found.example.audioFile,
            linkedVocabIds: found.example.linkedVocabIds,
          };
        })()
      : undefined;

  const quizStep = item.steps.find((step) => step.key === "quiz");

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicCreateWizardHeader
            title={`Bước 2: Biên soạn Mẫu câu — ${item.titleEn}`}
          />
          <TopicCreateStepper activeStep={1} />
        </div>

        <TopicItemSectionTabRail
          activeSection="expressions"
          vocabNote={stepDetail(item.steps, "vocabulary")}
          expressionsNote={stepDetail(item.steps, "expressions")}
          quizNote={stepDetail(item.steps, "quiz")}
          quizEmpty={!quizStep || quizStep.state === "empty"}
          onSelect={handleSelectSection}
        />

        <ExpressionsHeaderCard
          itemTitleEn={item.titleEn}
          totalExamples={totalExamples}
          purposeCount={purposes.length}
          maxPurposes={maxPurposes}
          onAdd={handleAdd}
        />

        <div className="flex flex-col gap-8">
          {purposes.map((purpose, index) => (
            <PurposeGroupSection
              key={purpose.id}
              purpose={purpose}
              groupIndex={index}
              vocabWordById={vocabWordById}
              onEdit={handleEdit}
              onDelete={removeExample}
              onDuplicate={duplicateExample}
              onPreviewAudio={handlePreviewAudio}
            />
          ))}
        </div>

        {showErrors && !isValid && (
          <p className="text-label-sm text-error">
            Mỗi mẫu câu cần có nhóm mục đích EN/VI và nội dung EN/VI đầy đủ.
          </p>
        )}

        <ExpressionsQuickAddSlot visible={hasFreeSlot} onAdd={handleAdd} />

        <ExpressionUpsertDialog
          open={dialogOpen}
          mode={dialogMode}
          purposeOptions={purposeOptions}
          vocabOptions={vocabOptions}
          lookupPurposeVi={lookupPurposeVi}
          initial={editingInitial}
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
