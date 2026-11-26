import { useCallback } from "react";
import { ArrowLeft, BookOpen, CircleAlert } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { EmptyState, Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import {
  adminTopicReadItemsPath,
  adminTopicReadPath,
  adminTopicReadSectionPath,
  topicItemSectionPath,
} from "@shared/constants";
import { ForbiddenView } from "@features/auth/components/ForbiddenView";
import { HasRole } from "@features/auth/components/HasRole";
import TopicItemEditorBreadcrumb from "@features/topic/components/management/upsert/editor/TopicItemEditorBreadcrumb";
import TopicItemSectionTabRail from "@features/topic/components/management/upsert/editor/TopicItemSectionTabRail";
import TopicContextResourceView from "@features/topic/components/management/read/TopicContextResourceView";
import { hasContextContent } from "@features/topic/utils/topic-context-presentation";
import PurposeGroupSection from "@features/topic/components/management/upsert/editor/expressions/PurposeGroupSection";
import QuizGroupSection from "@features/topic/components/management/upsert/editor/quiz/QuizGroupSection";
import TopicItemsHeader from "@features/topic/components/management/upsert/items/TopicItemsHeader";
import VocabularyCard from "@features/topic/components/management/upsert/editor/vocabulary/VocabularyCard";
import TopicUpsertStepper from "@features/topic/components/management/upsert/basic-info/TopicUpsertStepper";
import TopicUpsertWizardHeader from "@features/topic/components/management/upsert/basic-info/TopicUpsertWizardHeader";
import { topicManagementService } from "@features/topic/services/topic-management.service";
import { isTopicItemSectionKey } from "@features/topic/types/topic-create.types";
import type { TopicItemStepKey } from "@features/topic/types/topic-create.types";
import type {
  TopicExpressionResource,
  TopicItemManagementDetail,
  TopicItemManagementSummary,
  TopicManagementResponse,
  TopicVocabularyResource,
} from "@features/topic/types/topic-management.types";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";
import { toQuizPresentations } from "@features/topic/utils/topic-quiz-presentation";
import { expressionSentenceCount } from "@features/topic/utils/topic-expression-presentation";

const READ_STEPS = [
  { index: 0, title: "1. Thông tin chủ đề", note: "Xem chi tiết" },
  { index: 1, title: "2. Danh sách Topic Items", note: "Xem nội dung đã lưu" },
];

const FIELD_LABELS: Record<string, string> = {
  prompt: "Câu hỏi gợi mở",
  scenarioDescription: "Mô tả tình huống",
  dialogue: "Hội thoại",
  speaker: "Người nói",
  textEn: "Tiếng Anh",
  textVi: "Tiếng Việt",
  audioUrl: "Âm thanh",
  vocabId: "Từ vựng liên kết",
  senseId: "Nghĩa liên kết",
  snapshot: "Từ vựng",
  word: "Từ",
  pos: "Từ loại",
  sense: "Nghĩa",
  describeVi: "Mô tả cách dùng",
  phonetic: "Phiên âm",
  samples: "Ví dụ",
  collocations: "Cụm từ kết hợp",
  quickCheck: "Kiểm tra nhanh",
  orderIndex: "Thứ tự",
  tips: "Ghi chú",
  purposes: "Nhóm mẫu câu",
  purposeEn: "Tên nhóm tiếng Anh",
  purposeVi: "Tên nhóm tiếng Việt",
  groupType: "Loại nhóm",
  examples: "Mẫu câu",
  type: "Nhãn",
  usageNote: "Cách dùng",
  linkedVocabIds: "Từ vựng liên kết",
  quizId: "Quiz ID",
  quizType: "Dạng quiz",
  instructions: "Hướng dẫn",
  questions: "Câu hỏi",
  options: "Lựa chọn",
  label: "Nhãn lựa chọn",
  isCorrect: "Đáp án đúng",
  correct: "Đáp án đúng",
  explanation: "Giải thích",
  explanationOk: "Giải thích khi đúng",
  explanationNg: "Giải thích khi sai",
  sentence: "Câu",
  meaningVi: "Nghĩa tiếng Việt",
  quizData: "Nội dung quiz",
  answerData: "Đáp án",
  text: "Nội dung",
  descriptionVi: "Mô tả tiếng Việt",
  example: "Ví dụ",
  en: "Tiếng Anh",
  vi: "Tiếng Việt",
};

function labelFor(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function ResourceValue({ value, field }: { value: unknown; field?: string }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-on-surface-variant">Chưa có dữ liệu</span>;
  }
  if (typeof value === "boolean") return <span>{value ? "Có" : "Không"}</span>;
  if (typeof value === "number" || typeof value === "string") {
    const source = typeof value === "string" ? playableManagementMediaUrl(value) : null;
    if (source && /audio/i.test(field ?? "")) {
      return <audio controls preload="none" src={source} className="max-w-full" />;
    }
    if (source && /image|cover/i.test(field ?? "")) {
      return <img src={source} alt="Media của tài nguyên" loading="lazy" className="max-h-64 max-w-full rounded-lg object-contain" />;
    }
    return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-on-surface-variant">Chưa có dữ liệu</span>;
    return <ol className="flex flex-col gap-3">{value.map((entry, index) => <li key={index} className="rounded-lg bg-surface-container-low p-3"><ResourceValue value={entry} /></li>)}</ol>;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-on-surface-variant">Chưa có dữ liệu</span>;
    return <dl className="grid gap-3">{entries.map(([key, entry]) => <div key={key} className="grid gap-1 sm:grid-cols-[180px_1fr]"><dt className="text-label-sm font-medium text-on-surface-variant">{labelFor(key)}</dt><dd className="min-w-0 text-body-md text-on-surface"><ResourceValue value={entry} field={key} /></dd></div>)}</dl>;
  }
  return <span className="text-on-surface-variant">Chưa có dữ liệu</span>;
}

function RequestState({ loading, error, title }: { loading: boolean; error: { status?: number; message: string } | null; title: string }) {
  if (loading) return <div className="py-12"><Loading size="lg" /></div>;
  if (!error) return null;
  const message = error.status === 401
    ? "Bạn cần đăng nhập để xem nội dung quản trị."
    : error.status === 403
      ? "Tài khoản của bạn không có quyền xem nội dung quản trị."
      : error.status === 404
        ? "Không tìm thấy dữ liệu được yêu cầu."
        : error.message || "Không thể tải dữ liệu. Vui lòng thử lại.";
  return <div className="mx-auto max-w-3xl py-12"><EmptyState title={title} description={message} /></div>;
}

function VocabularyResource({ resource }: { resource: TopicVocabularyResource }) {
  return <VocabularyCard resource={resource} />;
}

function ExpressionBlock({ group, blockIndex, vocabWordById }: {
  group: TopicExpressionResource;
  blockIndex: number;
  vocabWordById: Map<string, string>;
}) {
  const purposeCount = group.purposes.length;
  const sentenceCount = expressionSentenceCount([group]);

  return (
    <article className="space-y-5 rounded-xl border border-outline-variant/50 p-4 sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-outline-variant/50 pb-3">
        <h3 className="text-title-md font-semibold text-on-surface">Khối mẫu câu {blockIndex + 1}</h3>
        <p className="text-label-sm text-on-surface-variant">{purposeCount} nhóm · {sentenceCount} mẫu câu</p>
      </header>
      {group.purposes.map((purpose, purposeIndex) => <PurposeGroupSection key={purposeIndex} purpose={purpose} groupIndex={purposeIndex} vocabWordById={vocabWordById} />)}
      {group.tips?.trim() && (
        <aside className="rounded-lg bg-surface-container-low p-4">
          <p className="mb-1 text-label-sm font-semibold text-on-surface-variant">Ghi chú</p>
          <p className="whitespace-pre-wrap break-words text-body-md text-on-surface">{group.tips}</p>
        </aside>
      )}
    </article>
  );
}

function QuizResources({ quizzes }: { quizzes: TopicItemManagementDetail["quizzes"] }) {
  const presentation = toQuizPresentations(quizzes);
  return <div className="space-y-6">
    <p className="text-label-sm text-on-surface-variant" aria-label={`Tổng số câu hỏi: ${presentation.totalQuestions}`}>Tổng số câu hỏi: {presentation.totalQuestions} · {presentation.modules.length} module</p>
    {presentation.modules.map((group) => <QuizGroupSection key={group.id} group={group} onAdd={() => undefined} onEdit={() => undefined} onDelete={() => undefined} onPreviewAudio={() => undefined} readOnly />)}
  </div>;
}

function ResourceTab({ item, section }: { item: TopicItemManagementDetail; section: TopicItemStepKey }) {
  if (section === "context") {
    const empty = !hasContextContent(item.context);
    const emptyAction = empty && item.status === "DRAFT"
      ? <Link to={topicItemSectionPath(item.id, "context", item.topicId)} className="inline-flex rounded-lg border border-outline-variant px-4 py-2 text-label-md font-semibold text-primary hover:bg-surface-container-low">Thêm bối cảnh</Link>
      : undefined;
    return <ResourcePanel title="Bối cảnh tình huống" empty={empty} emptyAction={emptyAction}>
      <TopicContextResourceView value={item.context} />
    </ResourcePanel>;
  }
  if (section === "vocabulary") {
    return <ResourcePanel title="Từ vựng" empty={item.vocabularies.length === 0}>
      <div className="space-y-5">{item.vocabularies.map((resource, index) => <VocabularyResource key={resource.vocabId || index} resource={resource} />)}</div>
    </ResourcePanel>;
  }
  if (section === "expressions") {
    const vocabWordById = new Map(item.vocabularies.flatMap((vocabulary) =>
      vocabulary.vocabId && vocabulary.snapshot?.word ? [[vocabulary.vocabId, vocabulary.snapshot.word] as const] : []));
    return <ResourcePanel title="Mẫu câu" empty={item.expressions.length === 0}>
      <div className="space-y-6">{item.expressions.map((group, blockIndex) => <ExpressionBlock key={blockIndex} group={group} blockIndex={blockIndex} vocabWordById={vocabWordById} />)}</div>
    </ResourcePanel>;
  }
  return <ResourcePanel title="Quiz" empty={item.quizzes.length === 0}>
    <QuizResources quizzes={item.quizzes} />
  </ResourcePanel>;
}

function ResourcePanel({ title, empty, emptyAction, children }: { title: string; empty: boolean; emptyAction?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-7"><h2 className="mb-5 text-title-lg font-semibold text-on-surface">{title}</h2>{empty ? <div className="grid gap-3"><div role="status" className="flex items-center gap-2 rounded-lg bg-surface-container-low p-4 text-body-md text-on-surface-variant"><CircleAlert className="size-5" aria-hidden="true" />Chưa có dữ liệu {title.toLocaleLowerCase("vi-VN")}.</div>{emptyAction && <div className="justify-self-start">{emptyAction}</div>}</div> : children}</section>;
}

function TopicManagementReadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId = "", itemId, sectionKey } = useParams();
  const validSection = !itemId || Boolean(sectionKey && isTopicItemSectionKey(sectionKey));
  const needsItems = !itemId && location.pathname.endsWith("/items");

  const fetchTopic = useCallback((signal: AbortSignal) => topicManagementService.fetchTopicById(topicId, signal), [topicId]);
  const fetchItems = useCallback((signal: AbortSignal) => topicManagementService.fetchTopicItems(topicId, signal), [topicId]);
  const fetchItem = useCallback((signal: AbortSignal) => {
    if (!itemId) return Promise.reject(new Error("Item ID is required"));
    return topicManagementService.fetchTopicItemById(topicId, itemId, signal);
  }, [itemId, topicId]);

  const topicState = useFetch<TopicManagementResponse>(fetchTopic, Boolean(topicId && validSection));
  const itemsState = useFetch<TopicItemManagementSummary[]>(fetchItems, Boolean(topicId && needsItems));
  const itemState = useFetch<TopicItemManagementDetail>(fetchItem, Boolean(topicId && itemId && validSection));

  if (!topicId || !validSection) {
    return <main className="mx-auto max-w-7xl px-5 py-8"><EmptyState title="Không tìm thấy tài nguyên" description="Tab tài nguyên này không tồn tại." /><Link to={adminTopicReadItemsPath(topicId)} className="mx-auto mt-4 block w-fit rounded-lg px-4 py-2 text-label-md font-semibold text-primary hover:bg-surface-container-low">Quay lại danh sách Item</Link></main>;
  }
  if (topicState.error || topicState.loading || !topicState.data) {
    return <main className="mx-auto max-w-7xl px-5"><RequestState loading={topicState.loading} error={topicState.error ?? (!topicState.data ? { message: "Chưa nhận được dữ liệu Topic." } : null)} title="Không tải được Topic" /></main>;
  }
  if (needsItems && (itemsState.error || itemsState.loading || !itemsState.data)) {
    return <main className="mx-auto max-w-7xl px-5"><RequestState loading={itemsState.loading} error={itemsState.error ?? (!itemsState.data ? { message: "Chưa nhận được danh sách Item." } : null)} title="Không tải được danh sách Item" /></main>;
  }
  if (itemId && (itemState.error || itemState.loading || !itemState.data)) {
    return <main className="mx-auto max-w-7xl px-5"><RequestState loading={itemState.loading} error={itemState.error ?? (!itemState.data ? { message: "Chưa nhận được tài nguyên." } : null)} title="Không tải được tài nguyên" /></main>;
  }

  const topic = topicState.data;
  const items = itemsState.data ?? [];
  const selectedItem = itemState.data;
  const activeSection = itemId ? sectionKey as TopicItemStepKey : "context";
  const showItems = needsItems || Boolean(itemId);
  const goToItems = () => navigate(adminTopicReadItemsPath(topic.id));
  const goToParent = () => navigate(itemId ? adminTopicReadItemsPath(topic.id) : showItems ? adminTopicReadPath(topic.id) : adminTopicReadPath());
  const topicFields: [string, unknown, string?][] = [
    ["Tên tiếng Anh", topic.titleEn], ["Tên tiếng Việt", topic.titleVi], ["CEFR", topic.cefr],
    ["Danh mục", topic.category], ["Trạng thái", topic.status], ["Mô tả", topic.description],
    ["Thời lượng (phút)", topic.durationMinutes], ["Số Item", topic.itemCount], ["Ảnh bìa", topic.coverUrl, "coverUrl"],
    ["Tags", topic.tags], ["Thứ tự Topic", topic.orderIndex], ["Ngày tạo", topic.createdAt], ["Cập nhật lần cuối", topic.updatedAt],
    ["Phiên bản đã xuất bản ID", topic.latestPublishedVersion], ["Phiên bản đã xuất bản", topic.publicationVersion],
    ["Phiên bản beta mới nhất", topic.latestBetaVersion],
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="flex flex-col gap-5 py-6">
        <nav aria-label="Điều hướng Topic" className="flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
          <Link to={adminTopicReadPath()} className="hover:text-primary">Danh sách Topic</Link>
          <span aria-hidden="true">/</span>
          <Link to={adminTopicReadPath(topic.id)} className="hover:text-primary">{topic.titleVi || topic.titleEn || "Topic"}</Link>
          {showItems && <><span aria-hidden="true">/</span><Link to={adminTopicReadItemsPath(topic.id)} className="hover:text-primary">Topic Items</Link></>}
          {itemId && <><span aria-hidden="true">/</span><span>{selectedItem?.title || itemId}</span></>}
        </nav>

        <section className="flex flex-col gap-5 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <TopicUpsertWizardHeader title={itemId ? "Xem Topic Item và tài nguyên" : showItems ? "Danh sách Topic Items" : "Thông tin Topic"} readOnly />
          <TopicUpsertStepper steps={READ_STEPS} activeStep={showItems ? 1 : 0} />
        </section>

        {!showItems && <>
          <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-title-lg font-semibold text-on-surface">{topic.titleVi || topic.titleEn || "Topic chưa có tên"}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">{topicFields.map(([label, value, field]) => <div key={label} className="rounded-lg bg-surface-container-low p-4"><dt className="mb-1 text-label-sm text-on-surface-variant">{label}</dt><dd className="break-words text-body-md text-on-surface"><ResourceValue value={value} field={field ?? label} /></dd></div>)}</dl>
          </section>
          <Button type="button" onClick={goToItems} className="self-start"><BookOpen className="mr-2 size-4" />Xem Topic Items</Button>
        </>}

        {needsItems && <section className="space-y-4">
          <TopicItemsHeader titleEn={topic.titleEn ?? ""} cefrBadge={`CEFR ${topic.cefr ?? "Chưa có dữ liệu"}`} draftBadge={topic.status} countNote={`${topic.itemCount} Topic Item`} onAdd={() => undefined} readOnly />
          {items.length === 0 ? <EmptyState title="Chưa có Topic Item" description="API chưa trả Topic Item nào cho chủ đề này." /> : <ol className="flex flex-col gap-3">{items.map((item) => <li key={item.id}><Link to={adminTopicReadSectionPath(topic.id, item.id, "context")} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 hover:bg-surface-container-low"><span className="flex min-w-0 flex-col"><span className="font-semibold text-on-surface">{item.title || "Item chưa có tên"}</span><span className="text-label-sm text-on-surface-variant">#{item.order ?? "Chưa có dữ liệu"} · {item.durationMinutes == null ? "Chưa có thời lượng" : `${item.durationMinutes} phút`} · {item.status ?? "Chưa có trạng thái"}</span></span><span className="text-label-sm text-primary">Xem tài nguyên</span></Link></li>)}</ol>}
        </section>}

        {itemId && selectedItem && <>
          <TopicItemEditorBreadcrumb topicTitleEn={topic.titleEn ?? "Topic"} itemOrder={selectedItem.order} itemTitleEn={selectedItem.title ?? "Item"} onBackToList={goToItems} />
          <section className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-title-lg font-semibold text-on-surface">{selectedItem.title || "Item chưa có tên"}</h2><p className="text-label-sm text-on-surface-variant">#{selectedItem.order ?? "Chưa có dữ liệu"} · {selectedItem.status ?? "Chưa có trạng thái"} · {selectedItem.durationMinutes == null ? "Chưa có thời lượng" : `${selectedItem.durationMinutes} phút`}</p></div><span className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">Version {selectedItem.version ?? "Chưa có dữ liệu"}</span></div>
            <p className="text-body-md text-on-surface-variant"><ResourceValue value={selectedItem.description} /></p>
            <dl className="grid gap-3 rounded-lg bg-surface-container-low p-4 sm:grid-cols-2">{([
              ["Version ID", selectedItem.versionId], ["Topic Version ID", selectedItem.topicVersionId],
              ["Previous Item Version ID", selectedItem.previousItemVersionId], ["Change Type", selectedItem.changeType],
              ["Ngày tạo", selectedItem.createdAt], ["Đã xuất bản lúc", selectedItem.publishedAt], ["Cập nhật lần cuối", selectedItem.updatedAt],
            ] as [string, unknown][]).map(([label, value]) => <div key={label}><dt className="text-label-sm text-on-surface-variant">{label}</dt><dd className="break-all text-body-sm text-on-surface"><ResourceValue value={value} field={label} /></dd></div>)}</dl>
            <TopicItemSectionTabRail activeSection={activeSection} vocabNote="" expressionsNote="" quizNote="" quizEmpty={false} onSelect={(section) => navigate(adminTopicReadSectionPath(topic.id, itemId, section))} />
          </section>
          <ResourceTab item={selectedItem} section={activeSection} />
        </>}
        <Button type="button" variant="outline" onClick={goToParent} className="self-start"><ArrowLeft className="mr-2 size-4" />Quay lại</Button>
      </div>
    </main>
  );
}

export default function TopicManagementReadView() {
  const { topicId, itemId } = useParams();
  const location = useLocation();
  const surface = itemId ? "item" : location.pathname.endsWith("/items") ? "items" : "topic";
  return <HasRole allowedRoles={["CONTENT_MANAGER", "ADMIN"]} fallback={<ForbiddenView />}><TopicManagementReadPage key={`${topicId}:${surface}:${itemId ?? ""}`} /></HasRole>;
}
