import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { grammarEditorGrid as authoringGrid, grammarEditorPanel as panelClass } from "@features/grammar/constants/management-entry";
import { grammarPaths } from "@features/grammar/constants/management-paths";
import type { LessonContext } from "@features/grammar/hooks/useGrammarAuthoring";
import { lessonSteps, useAuthoringAction } from "@features/grammar/hooks/useGrammarAuthoring";
import { grammarManagement } from "@features/grammar/services/grammar-management.service";
import type { GrammarLesson, GrammarTopic } from "@features/grammar/types/grammar-content.types";
import { cn } from "@shared/utils";
import {
  ActionButton, ActionLink, AuthoringFooter, AuthoringPage, Badge, ConfirmAction,
  LessonContext as LessonBreadcrumb, LessonStatus, ReportError, ReviewChecks, TopicStatus,
} from "./AuthoringUi";
import { BlockContent, BlockTypeBadge } from "./GrammarBlocks";
import { QuestionPreview } from "./GrammarQuestions";

type CheckResult = { label: string; passed: boolean; detail?: string | null };

function LessonPreview({ lesson, close }: { lesson: GrammarLesson; close: () => void }) {
  const [showPractice, setShowPractice] = useState(false);
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto bg-surface-container-lowest sm:max-w-3xl" showCloseButton={false}>
      <DialogHeader>
        <DialogTitle id="grammar-lesson-preview-title">{lesson.titleVi}</DialogTitle>
        <DialogDescription>Xem trước bài học · {lesson.hasDraft ? "Bản nháp chỉnh sửa" : lesson.status === "PUBLISHED" ? "Bản xuất bản" : "Nội dung đang soạn"}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-5 text-sm">
        <div>
          <p className="text-base font-semibold">{lesson.titleEn}</p>
          <p className="mt-1 whitespace-pre-wrap">{lesson.objective}</p>
          {lesson.tags.length > 0 && <ul className="mt-2 flex flex-wrap gap-2">
            {lesson.tags.map((tag, index) => <li key={tag + index}><Badge>{tag}</Badge></li>)}
          </ul>}
        </div>
        <section className="grid gap-3">
          <h3 className="text-base font-bold">Nội dung lý thuyết</h3>
          {lesson.blocks.length === 0 && <p className="text-on-surface-variant">Chưa có khối nội dung.</p>}
          {lesson.blocks.map((block) => <article className={panelClass} key={block.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <BlockTypeBadge type={block.type} />
              {block.title && <h4 className="font-semibold">{block.title}</h4>}
            </div>
            <BlockContent block={block} />
          </article>)}
        </section>
        {lesson.questions.length < 5 && <p className="text-on-surface-variant">Mới có {lesson.questions.length}/5 câu luyện tập.</p>}
        {!showPractice && <ActionButton className="justify-self-start" disabled={!lesson.questions.length}
          onClick={() => setShowPractice(true)}>Bắt đầu luyện tập</ActionButton>}
        {showPractice && <section className="grid gap-3" aria-label="Xem trước luyện tập">
          <h3 className="text-base font-bold">Luyện tập</h3>
          {lesson.questions.map((question, index) => <article className={panelClass} key={question.id}>
            <h4 className="mb-2 font-semibold">Câu {index + 1}</h4>
            <QuestionPreview question={question} revealAnswers />
            {question.explanation && <p className="mt-3 whitespace-pre-wrap"><strong>Giải thích:</strong> {question.explanation}</p>}
          </article>)}
        </section>}
      </div>
      <DialogFooter><ActionButton variant="outline" onClick={close}>Đóng xem trước</ActionButton></DialogFooter>
    </DialogContent>
  </Dialog>;
}

type LessonAction = "ready" | "apply" | "discard-draft";

export function GrammarLessonReview({ topic, lesson, checks, refresh, preview = false }: LessonContext & {
  checks: CheckResult[]; refresh: () => void; preview?: boolean;
}) {
  const [openPreview, setOpenPreview] = useState(preview);
  const [confirmation, setConfirmation] = useState<LessonAction>();
  const { run, busy, error, clearError } = useAuthoringAction();
  const steps = lessonSteps(topic.id, lesson.id);
  const archived = lesson.status === "ARCHIVED" || topic.status === "ARCHIVED";
  const published = lesson.status === "PUBLISHED";
  const autoPublish = topic.status === "PUBLISHED" && lesson.status === "DRAFT";
  const ready = lesson.ready && !autoPublish;
  const passed = checks.filter((check) => check.passed).length;
  const passedAll = checks.length === 14 && passed === checks.length;
  const groups = [
    { label: "Thông tin bài học", checks: checks.slice(0, 3), to: steps[0].to },
    { label: "Nội dung lý thuyết", checks: checks.slice(3, 7), to: steps[1].to },
    { label: "Câu luyện tập", checks: checks.slice(7, 13), to: steps[2].to },
    { label: "Kiểm tra tổng hợp", checks: checks.slice(13), to: steps[2].to },
  ];
  const action = published ? "apply" : "ready";
  const actionLabel = published ? "Cập nhật bản xuất bản" : autoPublish ? "Xuất bản bài học" : "Đánh dấu Sẵn sàng";
  const available = !archived && (published ? lesson.hasDraft : !ready);
  const publishedLessons = topic.lessons.filter(({ status }) => status === "PUBLISHED").length;
  const confirmCopy = {
    ready: {
      title: "Xuất bản bài học ngay?",
      description: "Chủ đề đã xuất bản. Sau khi xác nhận, học viên sẽ thấy bài học mới ngay. Học viên từng hoàn thành chủ đề sẽ thấy tiến độ thay đổi từ " +
        publishedLessons + "/" + publishedLessons + " thành " + publishedLessons + "/" + (publishedLessons + 1) + " và chủ đề chuyển về Đang học.",
      label: "Xác nhận xuất bản bài học",
    },
    apply: {
      title: "Cập nhật bản xuất bản?",
      description: "Học viên sẽ thấy nội dung của bản nháp chỉnh sửa. Tiến độ và trạng thái hoàn thành bài học được giữ nguyên.",
      label: "Cập nhật bản xuất bản",
    },
    "discard-draft": {
      title: "Hủy bản nháp chỉnh sửa?",
      description: "Toàn bộ thay đổi chưa xuất bản của bài học sẽ bị xóa.",
      label: "Hủy bản nháp",
    },
  };

  async function change(next: LessonAction, publishConfirmed = false) {
    const result = await run(() => grammarManagement.lessonAction(topic.id, lesson.id, next, lesson.version, publishConfirmed));
    if (result) {
      setConfirmation(undefined);
      refresh();
    }
  }

  return <AuthoringPage title="Kiểm tra bài học" subtitle="Kiểm tra lần cuối trước khi đánh dấu Sẵn sàng."
    badge={<LessonStatus lesson={lesson} />} context={<LessonBreadcrumb topic={topic} lesson={lesson} />}
    current={3} steps={steps} locked={busy}
    action={<div className="flex flex-wrap gap-2">
      <ActionLink to={grammarPaths.lessons(topic.id)} disabled={busy}>Danh sách bài học</ActionLink>
      <ActionButton variant="outline" disabled={busy} onClick={() => setOpenPreview(true)}>Xem trước bài học</ActionButton>
    </div>}
    footer={<AuthoringFooter backTo={grammarPaths.lessons(topic.id)} backLabel="Danh sách bài học" busy={busy}>
      {available && !passedAll && <span className="text-xs font-semibold text-learning-note-ink">Cần đạt đủ 14 tiêu chí.</span>}
      {available && <ActionButton disabled={busy || !passedAll} onClick={() => {
        if (published || autoPublish) { clearError(); setConfirmation(action); }
        else void change(action);
      }}>{actionLabel}</ActionButton>}
      {!archived && !published && ready && <ActionLink primary to={grammarPaths.topicPublish(topic.id)}>Kiểm tra & xuất bản chủ đề</ActionLink>}
    </AuthoringFooter>}>
    <ReportError error={!confirmation ? error : null} retry={refresh} />
    {!archived && !published && ready && <p role="status" className="rounded-xl border border-learning-mint-border bg-learning-mint p-4 text-body-md text-primary">
      Bài học đã được đánh dấu Sẵn sàng. Bạn có thể quay lại danh sách bài học hoặc tiếp tục kiểm tra và xuất bản chủ đề.
    </p>}
    <div className="grid w-full max-w-4xl gap-3">
      <div className={cn("flex items-center gap-2 rounded-lg border px-4 py-3 font-semibold",
        passedAll ? "border-learning-mint-border bg-learning-mint text-primary" : "border-learning-note-ink/30 bg-learning-note text-learning-note-ink")}>
        {passedAll && <Check className="size-4" aria-hidden />}
        <span>{passedAll ? "Bài học đủ điều kiện Sẵn sàng" : "Bài học còn tiêu chí chưa đạt"} · {passed}/{checks.length} tiêu chí đạt</span>
      </div>
      {lesson.hasDraft && <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="warning">Có thay đổi chưa xuất bản</Badge>
        {published && !archived && <ActionButton variant="outline" disabled={busy} onClick={() => {
          clearError();
          setConfirmation("discard-draft");
        }}>Hủy bản nháp</ActionButton>}
      </div>}
      {groups.map((group) => {
        const hasFailed = group.checks.some((check) => !check.passed);
        return <section key={group.label} className={cn(panelClass, "flex flex-wrap items-start gap-3 px-4 py-3")}>
          <details className="group min-w-0 flex-1" open={hasFailed}>
            <summary className="flex min-h-9 cursor-pointer list-none flex-wrap items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
              <Badge tone={hasFailed ? "warning" : "success"}>{hasFailed ? "Chưa đạt" : "Đạt"}</Badge>
              <span className="grow font-bold">{group.label}</span>
              <span className="text-xs tabular-nums text-on-surface-variant">{group.checks.filter((check) => check.passed).length}/{group.checks.length} tiêu chí</span>
              <ChevronDown className="size-4 text-on-surface-variant group-open:rotate-180" aria-hidden />
            </summary>
            <ReviewChecks checks={group.checks} />
          </details>
          <ActionLink to={group.to} disabled={busy}>{archived ? "Xem" : "Chỉnh sửa"}<span className="sr-only"> {group.label}</span></ActionLink>
        </section>;
      })}
    </div>
    {openPreview && <LessonPreview lesson={lesson} close={() => setOpenPreview(false)} />}
    {confirmation && <ConfirmAction open title={confirmCopy[confirmation].title} description={confirmCopy[confirmation].description}
      confirm={confirmCopy[confirmation].label} destructive={confirmation === "discard-draft"} busy={busy} error={error} retry={refresh}
      onClose={() => { setConfirmation(undefined); clearError(); }}
      onConfirm={() => { void change(confirmation, confirmation === "ready" && autoPublish); }} />}
  </AuthoringPage>;
}

type TopicAction = "publish" | "archive" | "restore";

export function GrammarTopicPublish({ topic, checks, refresh }: {
  topic: GrammarTopic; checks: CheckResult[]; refresh: () => void;
}) {
  const [confirmation, setConfirmation] = useState<TopicAction>();
  const { run, busy, error, clearError } = useAuthoringAction();
  const steps = [
    { label: "Thông tin chủ đề", to: grammarPaths.topic(topic.id) },
    { label: "Bài học", to: grammarPaths.lessons(topic.id) },
    { label: "Kiểm tra & xuất bản", to: grammarPaths.topicPublish(topic.id) },
  ];
  const passed = checks.filter((check) => check.passed).length;
  const passedAll = checks.length === 7 && passed === checks.length;
  const archived = topic.status === "ARCHIVED";
  const published = topic.status === "PUBLISHED";
  const canPublish = !published && !archived;
  const activeLessons = topic.lessons.filter((lesson) => lesson.status !== "ARCHIVED");
  const lessons = archived ? topic.lessons : activeLessons;
  const description = {
    publish: "Chủ đề và toàn bộ " + activeLessons.length + " bài học đang hoạt động sẽ hiển thị cho học viên.",
    archive: "Chủ đề và các bài học đang hoạt động sẽ được lưu trữ, ẩn khỏi lộ trình của học viên. Tiến độ học tập được giữ lại.",
    restore: "Chủ đề và các bài học đã lưu trữ cùng chủ đề sẽ trở về Nháp. Chủ đề cần được kiểm tra lại trước khi xuất bản.",
  };
  const labels = { publish: "Xuất bản chủ đề", archive: "Ngừng xuất bản", restore: "Khôi phục về Nháp" };

  async function submit(next: TopicAction) {
    const result = await run(() => grammarManagement.topicAction(topic.id, next, topic.version));
    if (result) {
      setConfirmation(undefined);
      refresh();
    }
  }

  return <AuthoringPage title="Kiểm tra & xuất bản" subtitle="Kiểm tra toàn bộ chủ đề trước khi xuất bản cho học viên."
    badge={<TopicStatus topic={topic} />} current={2} steps={steps} locked={busy}
    footer={<AuthoringFooter backTo={steps[1].to} backLabel="Danh sách bài học" busy={busy}>
      {canPublish && !passedAll && <span className="text-xs font-semibold text-learning-note-ink">Cần đạt đủ 7 mục để xuất bản.</span>}
      <ActionButton variant={published ? "outline" : "default"} disabled={busy || (canPublish && !passedAll)}
        onClick={() => { clearError(); setConfirmation(archived ? "restore" : published ? "archive" : "publish"); }}>
        {archived ? labels.restore : published ? labels.archive : labels.publish}
      </ActionButton>
    </AuthoringFooter>}>
    <ReportError error={!confirmation ? error : null} retry={refresh} />
    <section className={cn(panelClass, "flex flex-wrap items-center justify-between gap-4 py-4")}>
      <div>
        <h2 className="text-base font-bold">
          {archived ? "Chủ đề đang lưu trữ" : published ? "Chủ đề đã xuất bản" : passedAll ? "Đủ điều kiện xuất bản" : "Chưa thể xuất bản"}
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          {archived ? "Khôi phục chủ đề về Nháp để biên soạn và xuất bản lại." :
            published ? "Các bài học đã xuất bản được liệt kê bên dưới." :
              passedAll ? "Có thể xuất bản chủ đề cùng toàn bộ bài học đang hoạt động." : `Còn ${checks.length - passed} mục chưa đạt. Sửa các mục được đánh dấu trong bảng điều kiện.`}
        </p>
      </div>
      {canPublish && <div className="w-full max-w-60">
        <p id="grammar-topic-progress" className="mb-1 font-semibold tabular-nums">{passed} / {checks.length} mục đạt</p>
        <progress aria-labelledby="grammar-topic-progress" max={checks.length || 7} value={passed}
          className="block h-2 w-full overflow-hidden rounded-full bg-surface-container-high accent-primary-container [&::-webkit-progress-bar]:bg-surface-container-high [&::-webkit-progress-value]:bg-primary-container [&::-moz-progress-bar]:bg-primary-container" />
      </div>}
    </section>
    <div className={authoringGrid}>
      <div className="grid min-w-0 gap-4">
        <section className={panelClass}>
          <h2 className="mb-2 text-base font-bold">Bài học</h2>
          {lessons.length === 0 ? <p className="text-on-surface-variant">Chủ đề chưa có bài học.</p> :
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sr-only"><tr><th scope="col">Bài học</th><th scope="col">Trạng thái</th><th scope="col">Mục tiêu</th><th scope="col">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-outline-variant">
                  {lessons.map((lesson) => <tr key={lesson.id}>
                    <td className="py-2.5 pe-2"><strong className="[overflow-wrap:anywhere]">{lesson.order != null && "Bài " + String(lesson.order).padStart(2, "0") + ". "}{lesson.titleVi}</strong></td>
                    <td className="py-2.5 pe-2"><LessonStatus lesson={lesson} /></td>
                    <td className="py-2.5 pe-2 text-xs text-on-surface-variant [overflow-wrap:anywhere]">{lesson.objective}</td>
                    <td className="py-2.5 text-right"><ActionLink to={grammarPaths.lessonReview(topic.id, lesson.id)} disabled={busy}>
                      {lesson.ready || lesson.status !== "DRAFT" ? "Xem" : "Sửa"}<span className="sr-only"> {lesson.titleVi}</span>
                    </ActionLink></td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
        </section>
        <section className={panelClass}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">Thông tin chủ đề</h2>
            {!archived && <ActionLink to={steps[0].to} disabled={busy}>Chỉnh sửa</ActionLink>}
          </div>
          <div className="flex flex-wrap items-center gap-2"><strong>{topic.titleVi}</strong><Badge tone="archived">{topic.level}</Badge></div>
          <p className="mt-2 whitespace-pre-wrap text-on-surface-variant [overflow-wrap:anywhere]">{topic.description}</p>
        </section>
      </div>
      {canPublish && <section className={panelClass}><h2 className="mb-1 text-base font-bold">Điều kiện xuất bản</h2><ReviewChecks checks={checks} /></section>}
    </div>
    {confirmation && <ConfirmAction open title={labels[confirmation] + "?"} description={description[confirmation]}
      confirm={labels[confirmation]} busy={busy} error={error} destructive={confirmation === "archive"} retry={refresh}
      onClose={() => { setConfirmation(undefined); clearError(); }} onConfirm={() => { void submit(confirmation); }} />}
  </AuthoringPage>;
}

