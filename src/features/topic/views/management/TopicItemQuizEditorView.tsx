import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ROUTES, topicItemSectionPath } from "@shared/constants";
import { EmptyState } from "@shared/components";
import { Button } from "@/core/components/shadcn/button";
import {
  toQuestionUpsert,
  useTopicItemQuizForm,
  type QuizQuestionUpsert,
} from "@features/topic/hooks/useTopicItemQuizForm";
import type {
  QuizType,
  TopicItemStepKey,
} from "@features/topic/types/topic-create.types";
import TopicCreateFooterBar from "@features/topic/components/create/TopicCreateFooterBar";
import TopicCreateStepper from "@features/topic/components/create/TopicCreateStepper";
import TopicCreateWizardHeader from "@features/topic/components/create/TopicCreateWizardHeader";
import TopicItemSectionTabRail from "@features/topic/components/create/editor/TopicItemSectionTabRail";
import QuizGroupSection from "@features/topic/components/create/editor/quiz/QuizGroupSection";
import QuizHeaderCard from "@features/topic/components/create/editor/quiz/QuizHeaderCard";
import QuestionUpsertDialog from "@features/topic/components/create/editor/quiz/QuestionUpsertDialog";

function stepDetail(
  steps: { key: string; detail: string }[],
  key: string,
): string {
  const found = steps.find((step) => step.key === key);
  return found ? found.detail.replace(/[()]/g, "") : "";
}

export default function TopicItemQuizEditorView() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const {
    item,
    groups,
    totalQuestions,
    addQuestionOfType,
    patchQuestion,
    removeQuestion,
    findQuestion,
    isValid,
  } = useTopicItemQuizForm(itemId);
  const [showErrors, setShowErrors] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [presetType, setPresetType] =
    useState<QuizType>("SITUATIONAL_CHOICE");
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
    if (section === "quiz" || !itemId) return;
    navigate(topicItemSectionPath(itemId, section));
  };

  const handleBack = () =>
    navigate(topicItemSectionPath(itemId ?? "", "expressions"));

  const handleContinue = () => {
    if (!isValid || !itemId) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    navigate(ROUTES.ADMIN_TOPIC_CREATE_ITEMS);
  };

  const handleQuickAdd = () => {
    setDialogMode("add");
    setPresetType("SITUATIONAL_CHOICE");
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleAddToGroup = (groupId: string) => {
    const group = groups.find((entry) => entry.id === groupId);
    setDialogMode("add");
    setPresetType(group?.quizType ?? "SITUATIONAL_CHOICE");
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    const found = findQuestion(id);
    if (!found) return;
    setDialogMode("edit");
    setPresetType(found.group.quizType);
    setEditingId(id);
    setDialogOpen(true);
  };

  const handlePreviewAudio = () => undefined;

  const handleSubmitDialog = (draft: QuizQuestionUpsert) => {
    if (dialogMode === "add") {
      addQuestionOfType(draft.kind, draft);
    } else if (editingId) {
      patchQuestion(editingId, draft);
    }
    setDialogOpen(false);
    setEditingId(null);
  };

  const editingInitial: QuizQuestionUpsert | undefined =
    dialogMode === "edit" && editingId
      ? (() => {
          const found = findQuestion(editingId);
          if (!found) return undefined;
          return toQuestionUpsert(found.question);
        })()
      : undefined;

  const quizStep = item.steps.find((step) => step.key === "quiz");

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicCreateWizardHeader
            title={`Bước 2: Biên soạn Bài tập & Quiz — ${item.titleEn}`}
          />
          <TopicCreateStepper activeStep={1} />
        </div>

        <TopicItemSectionTabRail
          activeSection="quiz"
          vocabNote={stepDetail(item.steps, "vocabulary")}
          expressionsNote={stepDetail(item.steps, "expressions")}
          quizNote={stepDetail(item.steps, "quiz")}
          quizEmpty={!quizStep || quizStep.state === "empty"}
          onSelect={handleSelectSection}
        />

        <QuizHeaderCard
          itemTitleEn={item.titleEn}
          totalQuestions={totalQuestions}
          groupCount={groups.length}
          onQuickAdd={handleQuickAdd}
        />

        <div className="flex flex-col gap-8">
          {groups.map((group, index) => (
            <QuizGroupSection
              key={group.id}
              group={group}
              groupIndex={index}
              onAdd={handleAddToGroup}
              onEdit={handleEdit}
              onDelete={removeQuestion}
              onPreviewAudio={handlePreviewAudio}
            />
          ))}
        </div>

        {showErrors && !isValid && (
          <p className="text-label-sm text-error">
            Mỗi nhóm quiz cần tối thiểu 2 câu hỏi với câu hỏi, đáp án đúng và
            giải thích đầy đủ.
          </p>
        )}

        <QuestionUpsertDialog
          open={dialogOpen}
          mode={dialogMode}
          presetType={presetType}
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
