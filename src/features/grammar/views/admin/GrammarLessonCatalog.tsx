import { useCallback, useRef, useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { Link, useParams } from "react-router";
import { useFetch } from "@shared/hooks";
import { cn } from "@shared/utils";
import {
  EntryActions, EntryButton as Button, EntryConfirmation, EntryError, EntryFooter, EntryHeader, EntryStatus, EntrySteps, EntryTable,
  entryActionItem, grammarEntryPage,
} from "@features/grammar/components/admin/GrammarEntryUi";
import { grammarPaths } from "@features/grammar/constants/admin-paths";
import { grammarEntryCard, grammarLessonStatus } from "@features/grammar/constants/admin-entry";
import { grammarEntryError } from "@features/grammar/hooks/useGrammarEntryForm";
import { grammarAdmin } from "@features/grammar/services/grammar-admin.service";
import type { GrammarLesson, GrammarLessonInput } from "@features/grammar/types/grammar-admin.types";

const blockLabels: Record<string, string> = {
  EXPLANATION: "Giải thích",
  FORMULA: "Công thức",
  EXAMPLE: "Ví dụ",
  RULE_QUICK_NOTE: "Quy tắc và ghi chú",
  COMMON_MISTAKE: "Lỗi thường gặp",
};

function LessonList({ topicId }: { topicId: string }) {
  const fetchTopic = useCallback((signal: AbortSignal) => grammarAdmin.getTopic(topicId, signal), [topicId]);
  const { data: topic, loading, error: loadError, refetch } = useFetch(fetchTopic);
  const [mutation, setMutation] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [remove, setRemove] = useState<GrammarLesson>();
  const [removalStale, setRemovalStale] = useState(false);
  const [dropTarget, setDropTarget] = useState<string>();
  const dragging = useRef<GrammarLesson | null>(null);
  const mutating = useRef(false);

  const archived = topic?.status === "ARCHIVED";
  const lessons = [...(topic?.lessons ?? [])].sort((first, second) => (first.order ?? Infinity) - (second.order ?? Infinity));
  const active = lessons.filter((lesson) => lesson.status !== "ARCHIVED");
  const publishedCount = active.filter((lesson) => lesson.status === "PUBLISHED").length;
  const questionCount = active.reduce((sum, lesson) => sum + lesson.questions.length, 0);
  const locking = !topic || archived || loading || mutation;

  async function moveLesson(lesson: GrammarLesson, order: number) {
    if (locking || mutating.current || lesson.order === order || order < 1 || order > active.length) return;
    mutating.current = true;
    setMutation(true);
    setMessage(undefined);
    setError(undefined);
    try {
      const current = await grammarAdmin.getLesson(topicId, lesson.id);
      if (current.version !== lesson.version) {
        setError("Dữ liệu vừa được thay đổi. Danh sách đã được tải lại.");
        refetch();
        return;
      }
      const input: GrammarLessonInput = {
        titleVi: current.titleVi,
        titleEn: current.titleEn,
        objective: current.objective,
        tags: current.tags,
        order,
        blocks: current.blocks,
        questions: current.questions,
        version: current.version,
      };
      await grammarAdmin.saveLesson(topicId, lesson.id, input);
      setMessage(`Đã chuyển “${lesson.titleVi}” đến vị trí ${order}.`);
      refetch();
    } catch (cause) {
      const failure = grammarEntryError(cause, "Không thể đổi vị trí bài học. Vị trí hiện tại được giữ lại.");
      setError(failure.conflict ? "Dữ liệu vừa được thay đổi. Danh sách đang được tải lại." : failure.message);
      if (failure.conflict) refetch();
    } finally {
      mutating.current = false;
      setMutation(false);
    }
  }

  async function removeLesson() {
    if (!remove || locking || mutating.current) return;
    mutating.current = true;
    setMutation(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await grammarAdmin.deleteLesson(topicId, remove.id, remove.version);
      setMessage(remove.status === "PUBLISHED" || remove.firstPublishedAt ? "Đã lưu trữ bài học." : "Đã xóa bài học.");
      setRemove(undefined);
      refetch();
    } catch (cause) {
      const failure = grammarEntryError(cause, "Không thể cập nhật bài học.");
      setError(failure.conflict ? "Dữ liệu vừa được thay đổi. Đóng hộp thoại và chọn lại thao tác." : failure.message);
      setRemovalStale(failure.conflict);
      if (failure.conflict) refetch();
    } finally {
      mutating.current = false;
      setMutation(false);
    }
  }

  const removalArchives = remove?.status === "PUBLISHED" || Boolean(remove?.firstPublishedAt);
  const removalLabel = removalArchives ? "Lưu trữ bài học" : "Xóa bài học";

  return (
    <div className={grammarEntryPage}>
      <EntryHeader title="Danh sách bài học"
        description={archived ? "Chủ đề đã lưu trữ. Khôi phục chủ đề để tiếp tục biên soạn." : "Kéo tay nắm hoặc dùng phím mũi tên lên và xuống để đổi thứ tự bài học."}
        actions={topic && !archived ? (
          active.length < 10 && !locking ? <Button asChild><Link to={grammarPaths.lessonNew(topicId)}><Plus aria-hidden="true" /> Thêm bài học</Link></Button> :
            <Button type="button" disabled><Plus aria-hidden="true" /> Thêm bài học</Button>
        ) : null} />
      {topic ? (
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
          <strong className="text-on-surface">{topic.titleVi}</strong>
          <span>· {topic.code} · {topic.level}</span>
          <EntryStatus status={topic.status} />
        </div>
      ) : null}
      <EntrySteps current={1} steps={[
        { label: "Thông tin chủ đề", href: grammarPaths.topic(topicId) },
        { label: "Bài học" },
        { label: "Kiểm tra & xuất bản", href: topic ? grammarPaths.topicPublish(topicId) : undefined },
      ]} />
      <div className="mb-5 space-y-3">
        {error && !remove ? <EntryError message={error} /> : null}
        {loadError ? <EntryError message={loadError.message} onRetry={refetch} /> : null}
        {loading ? <p className="text-sm" role="status">Đang tải bài học…</p> : null}
        {topic && lessons.length ? (
          <EntryTable label="Bảng bài học" headings={["", "Bài học", "Nội dung", "Luyện tập", "Trạng thái", "Thao tác"]}>
            {lessons.map((lesson) => {
              const order = lesson.order;
              const lessonArchived = archived || lesson.status === "ARCHIVED";
              const moveDisabled = locking || lessonArchived || order === null;
              const lastPublished = topic.status === "PUBLISHED" && lesson.status === "PUBLISHED" && publishedCount === 1;
              const hasPublished = lesson.status === "PUBLISHED" || Boolean(lesson.firstPublishedAt);
              const questionTotal = lesson.questions.length;
              const blockTypes = [...new Set(lesson.blocks.map((block) => blockLabels[block.type] ?? block.type))];
              return (
                <tr key={lesson.id} className={cn(dropTarget === lesson.id && "bg-learning-mint")} onDragOver={(event) => {
                  if (moveDisabled || !dragging.current || dragging.current.id === lesson.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTarget(lesson.id);
                }} onDrop={(event) => {
                  event.preventDefault();
                  const previous = dragging.current;
                  dragging.current = null;
                  setDropTarget(undefined);
                  if (previous && !moveDisabled && order !== null) void moveLesson(previous, order);
                }}>
                  <td className="w-9">
                    {!lessonArchived ? <Button type="button" variant="ghost" size="icon" className="cursor-grab active:cursor-grabbing"
                      disabled={active.length < 2} aria-disabled={moveDisabled || active.length < 2} draggable={!moveDisabled && active.length > 1}
                      aria-label={`Đổi vị trí bài ${lesson.titleVi} bằng mũi tên lên hoặc xuống`}
                      onKeyDown={(event) => {
                        if (order === null || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
                        event.preventDefault();
                        void moveLesson(lesson, order + (event.key === "ArrowUp" ? -1 : 1));
                      }}
                      onDragStart={(event) => {
                        dragging.current = lesson;
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", lesson.id);
                      }}
                      onDragEnd={() => { dragging.current = null; setDropTarget(undefined); }}>
                      <GripVertical aria-hidden="true" />
                    </Button> : null}
                  </td>
                  <td className="min-w-64 max-w-md">
                    <Link className="font-semibold hover:underline" to={grammarPaths.lesson(topicId, lesson.id)}>
                      {order !== null ? `Bài ${String(order).padStart(2, "0")}. ` : ""}{lesson.titleVi}
                    </Link>
                    <p className="mt-0.5 text-xs text-on-surface-variant"><span lang="en">{lesson.titleEn}</span> · {lesson.objective}</p>
                  </td>
                  <td className="min-w-24 max-w-44">
                    <p>{lesson.blocks.length} khối</p>
                    {blockTypes.length ? <p className="mt-0.5 text-xs text-on-surface-variant">{blockTypes.join(", ")}</p> : null}
                  </td>
                  <td>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", questionTotal === 5 ? "bg-learning-mint text-primary" : "bg-learning-note text-learning-note-ink")}>
                      {questionTotal}/5 câu{questionTotal < 5 ? ` · thiếu ${5 - questionTotal}` : ""}
                    </span>
                  </td>
                  <td>
                    <EntryStatus status={grammarLessonStatus(lesson)} />
                    {lessonArchived && lesson.archiveReason && <p className="mt-1 text-xs text-on-surface-variant">
                      {lesson.archiveReason === "INDIVIDUAL" ? "Lưu trữ riêng lẻ" : "Lưu trữ theo chủ đề"}
                    </p>}
                    {lesson.hasDraft ? <p className="mt-1 text-xs text-on-surface-variant">Có thay đổi chưa xuất bản</p> : null}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline"><Link to={grammarPaths.lesson(topicId, lesson.id)} aria-label={`${lessonArchived ? "Xem" : "Sửa"} bài ${lesson.titleVi}`}>{lessonArchived ? "Xem" : "Sửa"}</Link></Button>
                      {!lessonArchived ? <EntryActions label={`Thao tác cho ${lesson.titleVi}`}>
                        <button className={entryActionItem} type="button" disabled={moveDisabled || order === null || order <= 1}
                          onClick={() => { if (order !== null) void moveLesson(lesson, order - 1); }}>Di chuyển lên</button>
                        <button className={entryActionItem} type="button" disabled={moveDisabled || order === null || order >= active.length}
                          onClick={() => { if (order !== null) void moveLesson(lesson, order + 1); }}>Di chuyển xuống</button>
                        {lastPublished ? <p className="px-3 py-2 text-xs text-on-surface-variant">Đây là bài đã xuất bản cuối cùng. Hãy ngừng xuất bản chủ đề nếu cần lưu trữ bài này.</p> :
                          <button className={cn(entryActionItem, "text-error")} type="button" disabled={locking}
                            onClick={() => { setError(undefined); setMessage(undefined); setRemovalStale(false); setRemove(lesson); }}>{hasPublished ? "Lưu trữ bài học" : "Xóa bài học"}</button>}
                      </EntryActions> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </EntryTable>
        ) : null}
        {topic && !loading && !lessons.length ? (
          <section className={cn(grammarEntryCard, "py-10 px-5 text-center")}>
            <h2 className="font-bold">Chưa có bài học</h2>
            {!archived ? <p className="mt-1 text-sm text-on-surface-variant">Thêm bài học đầu tiên cho chủ đề này.</p> : null}
          </section>
        ) : null}
        {topic ? (
          <p className="text-xs text-on-surface-variant">
            {active.length}/10 bài đang hoạt động · {topic.readyCount} bài sẵn sàng · Luyện tập {questionCount}/{active.length * 5} câu
          </p>
        ) : null}
      </div>
      <EntryFooter back={grammarPaths.root} backLabel="Danh sách chủ đề" status={mutation ? "Đang lưu thay đổi…" : message}
        next={topic ? <Button asChild><Link to={grammarPaths.topicPublish(topicId)}>Tiếp tục: Kiểm tra & xuất bản</Link></Button> : null} />
      {remove ? <EntryConfirmation
        title={`${removalLabel} “${remove.titleVi}”?`}
        description={removalArchives ? "Bài học sẽ được ẩn khỏi lộ trình. Tiến độ đã ghi nhận được giữ lại." : "Bài học, nội dung và câu hỏi luyện tập sẽ bị xóa vĩnh viễn."}
        confirmLabel={removalLabel} destructive={!removalArchives} pending={mutation} retryDisabled={removalStale} error={error}
        onClose={() => { setRemove(undefined); setError(undefined); }} onConfirm={() => void removeLesson()} /> : null}
    </div>
  );
}

export function GrammarLessonListView() {
  const { topicId } = useParams();
  return topicId ? <LessonList key={topicId} topicId={topicId} /> : null;
}
