import { useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, GripVertical, Plus } from "lucide-react";
import { Link, useLocation } from "react-router";
import { grammarEntryInput as fieldClass } from "@features/grammar/components/admin/GrammarEntryUi";
import { grammarPaths } from "@features/grammar/constants/admin-paths";
import type { LessonContext } from "@features/grammar/hooks/useGrammarAuthoring";
import { lessonSteps, moveItem, savedAtLabel, saveLessonContent, useAuthoringAction } from "@features/grammar/hooks/useGrammarAuthoring";
import type { GrammarQuestion, GrammarQuestionType } from "@features/grammar/types/grammar-admin.types";
import { cn } from "@shared/utils";
import {
  ActionButton, ActionLink, ActionMenu, AuthoringFooter, AuthoringPage, Badge, ConfirmAction, LessonContext as LessonBreadcrumb,
  menuItemClass, optionClass, ReportError,
} from "./AuthoringUi";
import { acceptedAnswers, maxQuestions, optionLetters, questionChecks, questionLabels } from "./question-fields";

const questionTypes = Object.keys(questionLabels) as GrammarQuestionType[];
const questionDragType = "application/x-engolearn-grammar-question";

export function QuestionPreview({ question, revealAnswers = false }: { question: GrammarQuestion; revealAnswers?: boolean }) {
  return <div className="grid gap-2">
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{question.prompt || "Chưa có nội dung câu hỏi."}</p>
    {question.type === "MULTIPLE_CHOICE" ? <div className={cn("grid gap-1.5", revealAnswers && "sm:grid-cols-2")}>
      {optionLetters.map((letter, index) => {
        const correct = revealAnswers && question.correctIndex === index;
        return <div key={letter} className={cn(optionClass, correct && "border-primary bg-learning-mint font-semibold text-primary")}>
          {letter}. {question.options[index] || "—"} {correct && <><Check className="inline size-4" aria-hidden /><span className="sr-only"> Đáp án đúng</span></>}
        </div>;
      })}
    </div> : revealAnswers ? <p className="text-xs text-on-surface-variant">Đáp án chấp nhận <strong className="ms-1">{acceptedAnswers(question, true).join(", ") || "—"}</strong></p> :
      <div className={cn(fieldClass, "w-fit min-w-40 text-on-surface-variant")}>Nhập đáp án…</div>}
  </div>;
}

function CreateQuestionMenu({ topicId, lessonId, label, disabled }: {
  topicId: string; lessonId: string; label: string; disabled?: boolean;
}) {
  const formPath = grammarPaths.question(topicId, lessonId, "new");
  return disabled ? <ActionButton disabled><Plus aria-hidden />{label}</ActionButton> :
    <ActionMenu label={label} trigger={<><Plus className="size-4" aria-hidden />{label}<ChevronDown className="size-4" aria-hidden /></>}>
      {questionTypes.map((type) => <Link key={type} className={menuItemClass} to={formPath + "?type=" + type}>{questionLabels[type]}</Link>)}
    </ActionMenu>;
}

export function GrammarQuestions({ topic, lesson: initial, refresh }: LessonContext) {
  const { state } = useLocation();
  const [lesson, setLesson] = useState(initial);
  const [remove, setRemove] = useState<GrammarQuestion>();
  const { run, busy, error, conflict, saved, clearError } = useAuthoringAction();
  const steps = lessonSteps(topic.id, lesson.id);
  const questions = lesson.questions;
  const archived = lesson.status === "ARCHIVED" || topic.status === "ARCHIVED";
  const completeCount = questions.filter((question) => questionChecks(question).every((check) => check.passed)).length;
  const remaining = maxQuestions - completeCount;
  const canCreate = !archived && !busy && questions.length < maxQuestions;
  const priorSave = typeof state?.questionSaved === "string" ? state.questionSaved : undefined;

  async function persist(next: GrammarQuestion[]) {
    const result = await run(() => saveLessonContent(lesson, topic.id, { questions: next }), () => savedAtLabel(true));
    if (result) setLesson(result);
    return Boolean(result);
  }

  function reorder(from: number, to: number) {
    if (!busy && !archived && from >= 0 && from !== to && to >= 0 && to < questions.length) {
      void persist(moveItem(questions, from, to));
    }
  }

  return <AuthoringPage title="Câu luyện tập" subtitle="Mỗi bài có đúng 5 câu, gồm trắc nghiệm hoặc điền chỗ trống."
    badge={<Badge tone={remaining === 0 ? "success" : "warning"}>{completeCount} / {maxQuestions} câu</Badge>}
    context={<LessonBreadcrumb topic={topic} lesson={lesson} />} current={2} steps={steps} locked={busy}
    action={!busy && <ActionLink to={grammarPaths.lessonPreview(topic.id, lesson.id)}>Xem trước bài học</ActionLink>}
    footer={<AuthoringFooter backTo={steps[1].to} backLabel={steps[1].label} nextTo={steps[3].to} nextLabel="Tiếp tục: Kiểm tra & hoàn thiện"
      status={saved ?? (error ? undefined : priorSave)} busy={busy} />}>
    {lesson.hasDraft && <span><Badge tone="warning">Có thay đổi chưa xuất bản</Badge></span>}
    <ReportError error={!remove ? error : null} retry={conflict ? refresh : undefined} />
    {remaining > 0 && !archived && <p className="rounded-lg border border-learning-note-ink/30 bg-learning-note px-4 py-3 text-learning-note-ink">
      <strong>Còn {remaining} câu chưa đủ.</strong> Hoàn thành để đánh dấu bài Sẵn sàng.
    </p>}
    {questions.length === 0 && archived && <p className="text-on-surface-variant">Bài học chưa có câu luyện tập.</p>}
    <ol className="grid gap-3">
      {questions.map((question, index) => {
        const complete = questionChecks(question).every((check) => check.passed);
        return <li key={question.id} className={cn("rounded-xl border border-outline-variant bg-surface-container-lowest p-4",
          !complete && "border-s-4 border-s-learning-note-ink/60")}
          onDragOver={(event) => { if (!busy && !archived && event.dataTransfer.types.includes(questionDragType)) event.preventDefault(); }}
          onDrop={(event) => {
            if (!event.dataTransfer.types.includes(questionDragType)) return;
            event.preventDefault();
            reorder(questions.findIndex((item) => item.id === event.dataTransfer.getData(questionDragType)), index);
          }}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {!archived && <span className="cursor-grab text-on-surface-variant active:cursor-grabbing" draggable={!busy}
              aria-hidden="true" onDragStart={(event) => {
                event.dataTransfer.setData(questionDragType, question.id);
                event.dataTransfer.effectAllowed = "move";
              }}><GripVertical className="size-4" /></span>}
            <strong>Câu {index + 1}</strong><Badge tone="archived">{questionLabels[question.type]}</Badge>
            <Badge tone={complete ? "success" : "warning"}>{complete ? "Đủ" : "Chưa đủ"}</Badge>
            {!archived && <div className="ml-auto flex items-center gap-2">
              <ActionLink to={grammarPaths.question(topic.id, lesson.id, question.id)} disabled={busy} primary={!complete}>
                {complete ? <>Sửa<span className="sr-only"> câu {index + 1}</span></> : `Soạn câu ${index + 1}`}
              </ActionLink>
              <ActionMenu label={"Thao tác câu " + (index + 1)}>
                <button type="button" className={menuItemClass} disabled={busy || index === 0} onClick={() => reorder(index, index - 1)}>
                  <ArrowUp className="mr-2 inline size-4" aria-hidden />Di chuyển lên
                </button>
                <button type="button" className={menuItemClass} disabled={busy || index === questions.length - 1} onClick={() => reorder(index, index + 1)}>
                  <ArrowDown className="mr-2 inline size-4" aria-hidden />Di chuyển xuống
                </button>
                <button type="button" className={menuItemClass} disabled={!canCreate} onClick={() => {
                  const next = [...questions];
                  next.splice(index + 1, 0, { ...question, id: crypto.randomUUID() });
                  void persist(next);
                }}>Nhân bản</button>
                <button type="button" className={cn(menuItemClass, "text-error")} disabled={busy}
                  onClick={() => { clearError(); setRemove(question); }}>Xóa</button>
              </ActionMenu>
            </div>}
          </div>
          <QuestionPreview question={question} revealAnswers />
        </li>;
      })}
      {!archived && Array.from({ length: Math.max(0, maxQuestions - questions.length) }, (_, offset) => {
        const number = questions.length + offset + 1;
        return <li key={"missing-" + number} className="rounded-xl border border-s-4 border-outline-variant border-s-learning-note-ink/60 bg-surface-container-lowest p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <strong>Câu {number}</strong><Badge tone="warning">Chưa đủ</Badge>
            <div className="ml-auto">
              {offset === 0
                ? <CreateQuestionMenu topicId={topic.id} lessonId={lesson.id} label={"Soạn câu " + number} disabled={busy} />
                : <ActionButton disabled title="Soạn các câu theo thứ tự">Soạn câu {number}</ActionButton>}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">Chưa có nội dung câu hỏi và đáp án.</p>
        </li>;
      })}
    </ol>
    {remove && <ConfirmAction open title="Xóa câu hỏi?"
      description="Câu hỏi sẽ được xóa khỏi phần luyện tập đang soạn." confirm="Xóa câu hỏi" destructive busy={busy} error={error} retry={conflict ? refresh : undefined}
      onClose={() => { setRemove(undefined); clearError(); }}
      onConfirm={() => { void persist(questions.filter((question) => question.id !== remove.id)).then((ok) => { if (ok) setRemove(undefined); }); }} />}
  </AuthoringPage>;
}

