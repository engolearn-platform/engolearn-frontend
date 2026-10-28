import { useState } from "react";
import { useNavigate } from "react-router";
import { Palette } from "lucide-react";
import { EmptyState, Loading } from "@shared/components";
import { ROUTES, adminTopicItemsPath } from "@shared/constants";
import { Button } from "@/core/components/shadcn/button";
import { useTopicBasicInfoForm } from "@features/topic/hooks/useTopicBasicInfoForm";
import { useTopicUpsertContext } from "@features/topic/hooks/useTopicUpsertContext";
import {
  getTopicUpsertSteps,
  TOPIC_CREATE_CATEGORY_OPTIONS,
  TOPIC_CREATE_MAX_DESCRIPTION,
} from "@features/topic/types/topic-create.types";
import type {
  TopicUpsertMode,
  TopicUpsertSnapshot,
} from "@features/topic/types/topic-create.types";
import TopicCoverCard from "@features/topic/components/management/upsert/basic-info/TopicCoverCard";
import TopicUpsertFooterBar from "@features/topic/components/management/upsert/basic-info/TopicUpsertFooterBar";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicUpsertTipsCallout from "@features/topic/components/management/upsert/basic-info/TopicUpsertTipsCallout";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import TopicGeneralInfoCard from "@features/topic/components/management/upsert/basic-info/TopicGeneralInfoCard";
import TopicTagsInput from "@features/topic/components/management/upsert/basic-info/TopicTagsInput";
import {
  TopicApiError,
  createTopic,
  updateTopic,
} from "@features/topic/services/topic-management.service";
import type {
  TopicCreateRequest,
  TopicUpdateRequest,
} from "@features/topic/types/topic-management.types";

interface TopicBasicInfoFormProps {
  mode: TopicUpsertMode;
  topicId?: string;
  snapshot?: TopicUpsertSnapshot;
}

/**
 * Form thật của bước 1. Chỉ được mount khi `snapshot` đã sẵn sàng (xem
 * `TopicUpsertBasicInfoView`) vì `useTopicBasicInfoForm` chỉ đọc `initial`
 * ở lần mount.
 */
function TopicBasicInfoForm({ mode, topicId, snapshot }: TopicBasicInfoFormProps) {
  const navigate = useNavigate();
  const { draft, patch, setCefr, addTag, removeTag, isValid } =
    useTopicBasicInfoForm(snapshot?.basicInfo);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const isUpdate = mode === "update";
  const handleBack = () =>
    isUpdate ? navigate(ROUTES.ADMIN_TOPICS) : navigate(-1);

  const buildCreateBody = (): TopicCreateRequest => {
    const body: TopicCreateRequest = {
      titleEn: draft.titleEn.trim(),
      titleVi: draft.titleVi.trim(),
    };
    if (draft.cefr) body.cefr = draft.cefr;
    if (draft.category) body.category = draft.category as TopicCreateRequest["category"];
    if (draft.description.trim()) body.description = draft.description.trim();
    if (draft.coverName.trim()) body.coverUrl = draft.coverName.trim();
    return body;
  };

  const buildUpdateBody = (): TopicUpdateRequest => {
    const body: TopicUpdateRequest = {
      titleEn: draft.titleEn.trim(),
      titleVi: draft.titleVi.trim(),
    };
    if (draft.cefr) body.cefr = draft.cefr;
    if (draft.category) body.category = draft.category as TopicUpdateRequest["category"];
    if (draft.description.trim()) body.description = draft.description.trim();
    else body.description = null;
    if (draft.coverName.trim()) body.coverUrl = draft.coverName.trim();
    else body.coverUrl = null;
    return body;
  };

  const handleApiError = (err: unknown) => {
    if (err instanceof TopicApiError) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const mapped: Record<string, string> = {};
        for (const fe of err.fieldErrors) {
          if (fe.field) mapped[fe.field] = fe.message;
        }
        setFieldErrors(mapped);
        setShowErrors(true);
        return;
      }
      setFeedback(err.message || "Đã xảy ra lỗi khi lưu chủ đề.");
      return;
    }
    setFeedback("Đã xảy ra lỗi khi lưu chủ đề.");
  };

  const handleContinue = async () => {
    if (!isValid) {
      setShowErrors(true);
      setFieldErrors({});
      return;
    }
    setShowErrors(false);
    setFieldErrors({});
    setFeedback(null);
    setSubmitting(true);
    try {
      if (isUpdate && topicId) {
        await updateTopic(topicId, buildUpdateBody());
        navigate(adminTopicItemsPath(topicId));
        return;
      }
      const created = await createTopic(buildCreateBody());
      navigate(adminTopicItemsPath(created.id));
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!isValid) {
      setShowErrors(true);
      setFieldErrors({});
      return;
    }
    setShowErrors(false);
    setFieldErrors({});
    setFeedback(null);
    setSubmitting(true);
    try {
      if (isUpdate && topicId) {
        await updateTopic(topicId, buildUpdateBody());
        setFeedback("Đã lưu thay đổi.");
        return;
      }
      await createTopic(buildCreateBody());
      setFeedback("Đã lưu nháp.");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
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
            fieldErrors={fieldErrors}
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

        {feedback ? (
          <div className="rounded-xl bg-surface-container-lowest p-3 text-label-sm text-on-surface">
            {feedback}
          </div>
        ) : null}

        <TopicUpsertFooterBar
          onBack={handleBack}
          saveLabel={isUpdate ? "Lưu thay đổi" : "Lưu nháp"}
          onSaveDraft={handleSaveDraft}
          onContinue={handleContinue}
          disabled={submitting}
        />
      </div>
    </div>
  );
}

export default function TopicUpsertBasicInfoView() {
  const navigate = useNavigate();
  const { mode, topicId, snapshot, isMissing, loading } = useTopicUpsertContext();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

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

  return (
    <TopicBasicInfoForm
      // `topicId` là key để form remount (nạp lại draft) khi mở topic khác.
      key={topicId ?? "create"}
      mode={mode}
      topicId={topicId}
      snapshot={snapshot}
    />
  );
}
