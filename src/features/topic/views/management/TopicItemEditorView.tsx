import { useCallback, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { EmptyState, Loading } from "@shared/components";
import { adminTopicItemsPath, adminTopicReadSectionPath, topicItemSectionPath } from "@shared/constants";
import { useFetch } from "@shared/hooks";
import { useTopicUnsavedChanges } from "@features/topic/hooks/useTopicUnsavedChanges";
import { TopicApiError, topicManagementService } from "@features/topic/services/topic-management.service";
import type { TopicItemResourceMutationResult } from "@features/topic/types/topic-management.types";
import { isTopicItemSectionKey } from "@features/topic/types/topic-create.types";
import type { TopicItemStepKey } from "@features/topic/types/topic-create.types";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicItemSectionTabRail from "@features/topic/components/management/upsert/editor/TopicItemSectionTabRail";
import TopicItemContextEditorView from "./TopicItemContextEditorView";
import TopicItemVocabularyEditorView from "./TopicItemVocabularyEditorView";
import TopicItemExpressionsEditorView from "./TopicItemExpressionsEditorView";
import TopicItemQuizEditorView from "./TopicItemQuizEditorView";
import { toQuizPresentations } from "@features/topic/utils/topic-quiz-presentation";

type EditableSection = TopicItemStepKey;

async function fetchItemDraft(topicId: string, itemId: string, signal?: AbortSignal): Promise<TopicItemResourceMutationResult> {
  const topic = await topicManagementService.fetchTopicById(topicId, signal);
  const item = await topicManagementService.fetchTopicItemById(topicId, itemId, signal);
  return { revision: topic.revision, item };
}

function SectionEditor({ initial, section }: { initial: TopicItemResourceMutationResult; section: EditableSection }) {
  const navigate = useNavigate();
  const { id: itemId, topicId } = initial.item;
  const [saved, setSaved] = useState(initial);
  const [context, setContext] = useState(initial.item.context);
  const [vocabularies, setVocabularies] = useState(initial.item.vocabularies);
  const [expressions, setExpressions] = useState(initial.item.expressions);
  const [quizzes, setQuizzes] = useState(initial.item.quizzes);
  const [pending, setPending] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [fieldErrors, setFieldErrors] = useState<TopicApiError["fieldErrors"]>([]);
  const inFlight = useRef(false);

  const current = { context, vocabulary: vocabularies, expressions, quiz: quizzes }[section];
  const committed = { context: saved.item.context, vocabulary: saved.item.vocabularies, expressions: saved.item.expressions, quiz: saved.item.quizzes }[section];
  const savedQuizQuestionCount = toQuizPresentations(saved.item.quizzes).totalQuestions;
  const dirty = JSON.stringify(current) !== JSON.stringify(committed);
  useTopicUnsavedChanges(dirty, pending);

  function leave(path: string) {
    if (inFlight.current || (dirty && !window.confirm("Rời khỏi mục này và bỏ thay đổi chưa lưu?"))) return;
    navigate(path);
  }

  function openSection(target: TopicItemStepKey) {
    if (target !== section) leave(topicItemSectionPath(itemId, target, topicId));
  }

  function accept(result: TopicItemResourceMutationResult) {
    setSaved(result);
    setContext(result.item.context);
    setVocabularies(result.item.vocabularies);
    setExpressions(result.item.expressions);
    setQuizzes(result.item.quizzes);
    setConflict(false);
    setFieldErrors([]);
  }

  async function save() {
    if (inFlight.current || conflict || !dirty) return;
    inFlight.current = true;
    setPending(true);
    setFeedback("");
    setFieldErrors([]);
    try {
      const { revision } = saved;
      const result = await {
        context: () => topicManagementService.saveItemContext(topicId, itemId, revision, context),
        vocabulary: () => topicManagementService.saveItemVocabulary(topicId, itemId, revision, vocabularies),
        expressions: () => topicManagementService.saveItemExpressions(topicId, itemId, revision, expressions),
        quiz: () => topicManagementService.saveItemQuizzes(topicId, itemId, revision, quizzes),
      }[section]();
      accept(result);
      setFeedback("Đã lưu nháp.");
    } catch (error) {
      if (error instanceof TopicApiError && error.status === 409 && error.code === "CONFLICT") {
        setConflict(true);
        setFeedback("Bản nháp đã thay đổi ở phiên khác. Tải lại trước khi lưu tiếp.");
      } else {
        setFeedback(error instanceof TopicApiError ? error.message : "Không thể lưu nháp. Vui lòng thử lại.");
        if (error instanceof TopicApiError) setFieldErrors(error.fieldErrors);
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  async function reload() {
    if (inFlight.current || (dirty && !window.confirm("Bỏ thay đổi chưa lưu và tải bản mới nhất?"))) return;
    inFlight.current = true;
    setPending(true);
    try {
      const result = await fetchItemDraft(topicId, itemId);
      if (result.item.status !== "DRAFT") {
        navigate(adminTopicReadSectionPath(topicId, itemId, section), { replace: true });
        return;
      }
      accept(result);
      setFeedback("Đã tải lại bản nháp.");
    } catch {
      setFeedback("Không thể tải lại bản nháp. Nội dung đang nhập vẫn còn.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
    <div className="mx-auto flex w-full max-w-[940px] flex-col gap-6 pt-6 lg:pt-8">
      <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <TopicUpsertWizardHeader title={saved.item.title ?? "Biên soạn bài học"} />
        <TopicUpsertStepper activeStep={1} />
      </div>
      <TopicItemSectionTabRail activeSection={section} vocabNote={String(saved.item.vocabularies.length)}
        expressionsNote={String(saved.item.expressions.length)} quizNote={String(savedQuizQuestionCount)}
        quizEmpty={!savedQuizQuestionCount} onSelect={openSection} />
      {section === "context" && <TopicItemContextEditorView key={saved.revision} value={context} onChange={setContext} topicId={topicId} disabled={pending} />}
      {section === "vocabulary" && <TopicItemVocabularyEditorView topicId={topicId} key={saved.revision} value={vocabularies} onChange={setVocabularies} disabled={pending} />}
      {section === "expressions" && <TopicItemExpressionsEditorView topicId={topicId} key={saved.revision} value={expressions} onChange={setExpressions}
        vocabulary={saved.item.vocabularies} itemTitle={saved.item.title ?? ""} disabled={pending} />}
      {section === "quiz" && <TopicItemQuizEditorView topicId={topicId} key={saved.revision} value={quizzes} onChange={setQuizzes} disabled={pending} />}
      {feedback && <div role="status" className="rounded-xl bg-surface-container-lowest p-3 text-label-sm">
        <p>{feedback}</p>
        {fieldErrors?.map(({ field, message }) => <p key={field} className="text-error">{field} — {message}</p>)}
        {conflict && <Button type="button" variant="outline" onClick={reload} disabled={pending}>Tải lại bản nháp</Button>}
      </div>}
      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <Button type="button" variant="outline" onClick={() => leave(adminTopicItemsPath(topicId))} disabled={pending}>Quay lại danh sách</Button>
        <div className="flex flex-wrap items-center gap-3">
          {!pending && <Link to={`/admin/topics/${encodeURIComponent(topicId)}/items/${encodeURIComponent(itemId)}/speaking-profile`} className="text-label-sm text-primary underline-offset-4 hover:underline">Hồ sơ Speaking</Link>}
          {!pending && <Link to={adminTopicReadSectionPath(topicId, itemId, section)} className="text-label-sm text-primary">Xem bản đã lưu</Link>}
          <Button type="button" disabled={pending || conflict || !dirty} onClick={save}>Lưu nháp</Button>
        </div>
      </div>
    </div>
  </div>;
}

function ItemDraftRequest({ topicId, itemId, section }: { topicId: string; itemId: string; section: EditableSection }) {
  const fetchDraft = useCallback((signal: AbortSignal) => fetchItemDraft(topicId, itemId, signal), [topicId, itemId]);
  const { data, loading, error, refetch } = useFetch(fetchDraft);
  if (loading) return <div className="py-12"><Loading size="lg" /></div>;
  if (!data || error) return <div className="mx-auto max-w-3xl py-12">
    <EmptyState title="Không thể tải bản nháp bài học" description={error?.message ?? "Vui lòng thử lại."} />
    <Button type="button" variant="outline" onClick={refetch}>Thử lại</Button>
  </div>;
  if (data.item.status !== "DRAFT") return <Navigate replace to={adminTopicReadSectionPath(topicId, itemId, section)} />;
  return <SectionEditor initial={data} section={section} />;
}

export default function TopicItemEditorView() {
  const { itemId, sectionKey, topicId } = useParams();
  if (!topicId || !itemId) return <Navigate replace to={adminTopicItemsPath(topicId)} />;
  const section = sectionKey && isTopicItemSectionKey(sectionKey) ? sectionKey : "context";
  return <ItemDraftRequest key={`${topicId}/${itemId}/${section}`} topicId={topicId} itemId={itemId} section={section} />;
}
