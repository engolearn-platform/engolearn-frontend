import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ROUTES, topicItemSectionPath } from "@shared/constants";
import { EmptyState } from "@shared/components";
import { Button } from "@/core/components/shadcn/button";
import { useTopicItemContextForm } from "../../hooks/useTopicItemContextForm";
import type { TopicItemStepKey } from "../../types/topic-create.types";
import TopicCreateFooterBar from "../../components/create/TopicCreateFooterBar";
import TopicCreateStepper from "../../components/create/TopicCreateStepper";
import TopicCreateWizardHeader from "../../components/create/TopicCreateWizardHeader";
import TopicItemSectionTabRail from "../../components/create/editor/TopicItemSectionTabRail";
import TopicContextFormCard from "../../components/create/editor/TopicContextFormCard";

function stepDetail(
  steps: { key: string; detail: string }[],
  key: string,
): string {
  const found = steps.find((step) => step.key === key);
  return found ? found.detail.replace(/[()]/g, "") : "";
}

export default function TopicItemContextEditorView() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const {
    item,
    draft,
    patch,
    updateTurn,
    addTurn,
    removeTurn,
    isValid,
  } = useTopicItemContextForm(itemId);
  const [showErrors, setShowErrors] = useState(false);

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
    if (section === "context" || !itemId) return;
    navigate(topicItemSectionPath(itemId, section));
  };

  const handleBack = () => navigate(ROUTES.ADMIN_TOPIC_CREATE_ITEMS);

  const handleContinue = () => {
    if (!isValid || !itemId) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    navigate(topicItemSectionPath(itemId, "vocabulary"));
  };

  const quizStep = item.steps.find((step) => step.key === "quiz");

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicCreateWizardHeader
            title={`Bước 2: Biên soạn Bối cảnh — ${item.titleEn}`}
          />
          <TopicCreateStepper activeStep={1} />
        </div>

        {/* <TopicItemEditorBreadcrumb
          topicTitleEn={TOPIC_CREATE_DEFAULT_DRAFT.titleEn}
          itemOrder={item.order}
          itemTitleEn={item.titleEn}
          onBackToList={handleBackToList}
        /> */}

        <TopicItemSectionTabRail
          activeSection="context"
          vocabNote={stepDetail(item.steps, "vocabulary")}
          expressionsNote={stepDetail(item.steps, "expressions")}
          quizNote={stepDetail(item.steps, "quiz")}
          quizEmpty={!quizStep || quizStep.state === "empty"}
          onSelect={handleSelectSection}
        />

        <form onSubmit={(event) => event.preventDefault()}>
          <TopicContextFormCard
            draft={draft}
            showErrors={showErrors}
            onPatch={patch}
            onUpdateTurn={updateTurn}
            onAddTurn={addTurn}
            onRemoveTurn={removeTurn}
          />
        </form>

        <TopicCreateFooterBar onBack={handleBack} onContinue={handleContinue} />
      </div>
    </div>
  );
}
