import { useState } from "react";
import { useNavigate } from "react-router";
import { Palette } from "lucide-react";
import { useTopicBasicInfoForm } from "../../hooks/useTopicBasicInfoForm";
import {
  TOPIC_CREATE_CATEGORY_OPTIONS,
  TOPIC_CREATE_MAX_DESCRIPTION,
} from "../../types/topic-create.types";
import TopicCoverCard from "../../components/create/TopicCoverCard";
import TopicCreateFooterBar from "../../components/create/TopicCreateFooterBar";
import TopicCreateStepper from "../../components/create/TopicCreateStepper";
import TopicCreateTipsCallout from "../../components/create/TopicCreateTipsCallout";
import TopicCreateWizardHeader from "../../components/create/TopicCreateWizardHeader";
import TopicGeneralInfoCard from "../../components/create/TopicGeneralInfoCard";
import TopicTagsInput from "../../components/create/TopicTagsInput";

export default function TopicCreateBasicInfoView() {
  const navigate = useNavigate();
  const { draft, patch, setCefr, addTag, removeTag, isValid } = useTopicBasicInfoForm();
  const [showErrors, setShowErrors] = useState(false);

  const handleBack = () => navigate(-1);

  const handleContinue = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 pb-12 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicCreateWizardHeader />
          <TopicCreateStepper />
        </div>

        <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
          <TopicGeneralInfoCard
            draft={draft}
            categories={TOPIC_CREATE_CATEGORY_OPTIONS}
            maxDescription={TOPIC_CREATE_MAX_DESCRIPTION}
            showErrors={showErrors}
            onPatch={patch}
            onCefrChange={setCefr}
          />

          <section className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
            <div className="flex items-center gap-2.5 border-b border-surface-container pb-2">
              <Palette className="size-6 text-primary" aria-hidden="true" />
              <h2 className="text-headline-sm font-semibold text-on-surface">
                Hình ảnh & Nhãn phân loại
              </h2>
            </div>
            <TopicCoverCard coverName={draft.coverName} coverMeta={draft.coverMeta} />
            <TopicTagsInput tags={draft.tags} onAdd={addTag} onRemove={removeTag} />
          </section>

          <TopicCreateTipsCallout />
        </form>

        <TopicCreateFooterBar onBack={handleBack} onContinue={handleContinue} />
      </div>
    </div>
  );
}
