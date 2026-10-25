import { useState } from "react";
import { useNavigate } from "react-router";
import { Palette } from "lucide-react";
import { EmptyState } from "@shared/components";
import { ROUTES, adminTopicItemsPath } from "@shared/constants";
import { Button } from "@/core/components/shadcn/button";
import { useTopicBasicInfoForm } from "@features/topic/hooks/useTopicBasicInfoForm";
import { useTopicUpsertContext } from "@features/topic/hooks/useTopicUpsertContext";
import {
  getTopicUpsertSteps,
  TOPIC_CREATE_CATEGORY_OPTIONS,
  TOPIC_CREATE_MAX_DESCRIPTION,
} from "@features/topic/types/topic-create.types";
import TopicCoverCard from "@features/topic/components/management/upsert/basic-info/TopicCoverCard";
import TopicUpsertFooterBar from "@features/topic/components/management/upsert/basic-info/TopicUpsertFooterBar";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicUpsertTipsCallout from "@features/topic/components/management/upsert/basic-info/TopicUpsertTipsCallout";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import TopicGeneralInfoCard from "@features/topic/components/management/upsert/basic-info/TopicGeneralInfoCard";
import TopicTagsInput from "@features/topic/components/management/upsert/basic-info/TopicTagsInput";

export default function TopicUpsertBasicInfoView() {
  const navigate = useNavigate();
  const { mode, topicId, snapshot, isMissing } = useTopicUpsertContext();
  const { draft, patch, setCefr, addTag, removeTag, isValid } =
    useTopicBasicInfoForm(snapshot?.basicInfo);
  const [showErrors, setShowErrors] = useState(false);

  const isUpdate = mode === "update";
  const handleBack = () =>
    isUpdate ? navigate(ROUTES.ADMIN_TOPICS) : navigate(-1);

  if (isMissing) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
          <EmptyState
            title="Không tìm thấy chủ đề"
            description="Chủ đề này không tồn tại trong dữ liệu hiện tại."
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.ADMIN_TOPICS)}
            className="mx-auto w-full rounded-xl sm:w-auto"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    navigate(adminTopicItemsPath(topicId));
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 pb-12 lg:pt-8">
        <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicUpsertWizardHeader
            title={
              isUpdate
                ? "Cập nhật thông tin cơ bản của Chủ đề"
                : "Bước 1: Thông tin cơ bản của Chủ đề"
            }
            draftLabel={isUpdate ? "Đang cập nhật" : undefined}
            autosaveText={
              isUpdate ? (snapshot?.updatedNote ?? "Chế độ cập nhật") : undefined
            }
          />
          <TopicUpsertStepper
            steps={getTopicUpsertSteps(mode, snapshot?.items.length ?? 0)}
          />
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

          <TopicUpsertTipsCallout />
        </form>

        <TopicUpsertFooterBar
          onBack={handleBack}
          saveLabel={isUpdate ? "Lưu thay đổi" : undefined}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
}
