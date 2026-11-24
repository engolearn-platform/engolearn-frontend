import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Palette } from "lucide-react";
import { EmptyState, Loading } from "@shared/components";
import { ROUTES, adminTopicBasicInfoPath, adminTopicItemsPath } from "@shared/constants";
import { Button } from "@/core/components/shadcn/button";
import { useTopicBasicInfoForm } from "@features/topic/hooks/useTopicBasicInfoForm";
import { useTopicUnsavedChanges } from "@features/topic/hooks/useTopicUnsavedChanges";
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
  fetchTopicById,
} from "@features/topic/services/topic-management.service";
import type { TopicManagementResponse } from "@features/topic/types/topic-management.types";
import { topicCreateBody, topicDraftFromResponse, topicUpdateBody } from "@features/topic/utils/topic-basic-info.adapter";

interface TopicBasicInfoFormProps {
  mode: TopicUpsertMode;
  snapshot?: TopicUpsertSnapshot;
  response?: TopicManagementResponse;
}

function TopicBasicInfoForm({ mode, snapshot, response }: TopicBasicInfoFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { draft, setDraft, patch, setCefr, addTag, removeTag, isValid } =
    useTopicBasicInfoForm(snapshot?.basicInfo);
  const [original, setOriginal] = useState(draft);
  const [savedTopic, setSavedTopic] = useState(response);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(location.state?.topicCreated ? "Đã lưu nháp." : null);
  const [conflict, setConflict] = useState(false);
  const requestPending = useRef(false);
  const isUpdate = mode === "update";
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);

  useTopicUnsavedChanges(dirty, submitting);

  const handleBack = () => {
    if (requestPending.current || (dirty && !window.confirm("Bỏ các thay đổi chưa lưu?"))) return;
    if (isUpdate) navigate(ROUTES.ADMIN_TOPICS);
    else navigate(-1);
  };

  function acceptSaved(topic: TopicManagementResponse) {
    const savedDraft = topicDraftFromResponse(topic);
    setDraft(savedDraft);
    setOriginal(savedDraft);
    setSavedTopic(topic);
    setConflict(false);
  }

  async function save(continueToItems: boolean) {
    if (requestPending.current || conflict) return;
    setFieldErrors({});
    setFeedback(null);
    setShowErrors(!isValid);
    if (!isValid) return;

    requestPending.current = true;
    setSubmitting(true);
    try {
      const saved = savedTopic
        ? await updateTopic(savedTopic.id, topicUpdateBody(original, draft, savedTopic.revision))
        : await createTopic(topicCreateBody(draft));
      acceptSaved(saved);
      setFeedback(savedTopic ? "Đã lưu thay đổi." : "Đã lưu nháp.");
      if (continueToItems) {
        navigate(adminTopicItemsPath(saved.id), { replace: !isUpdate });
      } else if (!isUpdate) {
        navigate(adminTopicBasicInfoPath(saved.id), { replace: true, state: { topicCreated: true } });
      }
    } catch (error) {
      if (error instanceof TopicApiError && error.status === 409) {
        setConflict(true);
        setFeedback("Chủ đề đã thay đổi ở phiên khác. Tải lại dữ liệu trước khi lưu tiếp.");
      } else if (error instanceof TopicApiError && error.fieldErrors?.length) {
        setFieldErrors(Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message])));
        setFeedback(error.message);
      } else {
        setFeedback(error instanceof TopicApiError ? error.message : "Không thể lưu chủ đề. Vui lòng thử lại.");
      }
    } finally {
      requestPending.current = false;
      setSubmitting(false);
    }
  }

  async function reload() {
    if (!savedTopic || requestPending.current || (dirty && !window.confirm("Bỏ thay đổi chưa lưu và tải bản mới nhất?"))) return;
    requestPending.current = true;
    setSubmitting(true);
    try {
      acceptSaved(await fetchTopicById(savedTopic.id));
      setFeedback("Đã tải bản mới nhất.");
      setFieldErrors({});
      setShowErrors(false);
    } catch {
      setFeedback("Không thể tải lại chủ đề. Nội dung đang nhập vẫn còn.");
    } finally {
      requestPending.current = false;
      setSubmitting(false);
    }
  }

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
              savedTopic?.updatedAt ? `Cập nhật lần cuối: ${new Date(savedTopic.updatedAt).toLocaleString("vi-VN")}` : undefined
            }
          />
          <TopicUpsertStepper
            steps={getTopicUpsertSteps(mode, savedTopic?.itemCount ?? 0)}
          />
        </div>

        <form onSubmit={(event) => event.preventDefault()}>
          <fieldset disabled={submitting} className="flex flex-col gap-6">
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
              <TopicCoverCard coverName={draft.coverName} topicId={savedTopic?.id} onChange={(coverName) => patch({ coverName })} error={fieldErrors.coverUrl} />
              <TopicTagsInput tags={draft.tags} onAdd={addTag} onRemove={removeTag} />
              {fieldErrors.tags && <p className="text-label-sm text-error">{fieldErrors.tags}</p>}
            </section>

            <TopicUpsertTipsCallout />
          </fieldset>
        </form>

        {feedback ? (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-lowest p-3 text-label-sm text-on-surface">
            {feedback}
            {conflict && <Button type="button" variant="outline" disabled={submitting} onClick={reload}>Tải lại chủ đề</Button>}
          </div>
        ) : null}

        <TopicUpsertFooterBar
          onBack={handleBack}
          saveLabel={isUpdate ? "Lưu thay đổi" : "Lưu nháp"}
          onSaveDraft={() => void save(false)}
          onContinue={() => void save(true)}
          disabled={submitting}
          saveDisabled={conflict}
        />
      </div>
    </div>
  );
}

export default function TopicUpsertBasicInfoView() {
  const navigate = useNavigate();
  const { mode, topicId, snapshot, response, isMissing, loading, error, reload } = useTopicUpsertContext();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (error || isMissing) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
          <EmptyState
            title={isMissing ? "Không tìm thấy chủ đề" : "Không thể tải chủ đề"}
            description={isMissing ? "Chủ đề này không tồn tại trong dữ liệu hiện tại." : error?.message}
          />
          {!isMissing && <Button type="button" variant="outline" onClick={reload}>Thử lại</Button>}
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
      response={response}
      snapshot={snapshot}
    />
  );
}
