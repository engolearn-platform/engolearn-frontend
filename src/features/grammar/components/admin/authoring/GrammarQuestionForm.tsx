import { useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router";
import { grammarEntryInput as fieldClass } from "@features/grammar/components/admin/GrammarEntryUi";
import { grammarEditorGrid as authoringGrid, grammarEditorPanel as panelClass } from "@features/grammar/constants/admin-entry";
import type { LessonContext } from "@features/grammar/hooks/useGrammarAuthoring";
import { lessonSteps, savedAtLabel, saveLessonContent, useAuthoringAction } from "@features/grammar/hooks/useGrammarAuthoring";
import type { GrammarQuestion, GrammarQuestionType } from "@features/grammar/types/grammar-admin.types";
import { cn } from "@shared/utils";
import {
  ActionButton, AuthoringFooter, AuthoringPage, Badge, ConfirmAction,
  LessonContext as LessonBreadcrumb, ReportError, ReviewChecks,
} from "./AuthoringUi";
import { QuestionPreview } from "./GrammarQuestions";
import { acceptedAnswers, maxQuestions, optionLetters, questionChecks, questionLabels } from "./question-fields";

function resetAnswers(type: GrammarQuestionType) {
  return {
    type,
    options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : [],
    correctIndex: null,
    correctAnswer: "",
    acceptedAnswers: [],
  };
}

function Required() {
  return <span aria-hidden="true" className="ms-1 text-error">*</span>;
}

export function GrammarQuestionForm({ topic, lesson, refresh, question, initialType }: LessonContext & {
  question?: GrammarQuestion; initialType: GrammarQuestionType;
}) {
  const navigate = useNavigate();
  const { run, busy, error, conflict, clearError } = useAuthoringAction();
  const [draft, setDraft] = useState<GrammarQuestion>(() => question ?? {
    id: crypto.randomUUID(),
    prompt: "",
    explanation: "",
    ...resetAnswers(initialType),
  });
  const [typeConfirmation, setTypeConfirmation] = useState<GrammarQuestionType>();
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const radioGroup = useId();
  const promptId = useId();
  const steps = lessonSteps(topic.id, lesson.id);
  const index = question ? lesson.questions.findIndex(({ id }) => id === question.id) : lesson.questions.length;
  const multipleChoice = draft.type === "MULTIPLE_CHOICE";
  const archived = lesson.status === "ARCHIVED" || topic.status === "ARCHIVED";
  const atLimit = !question && lesson.questions.length >= maxQuestions;
  const checks = questionChecks(draft);
  const complete = checks.every(({ passed }) => passed);
  const answerOptions = optionLetters.map((_, i) => draft.options[i] ?? "");

  function switchType(type: GrammarQuestionType) {
    if (type === draft.type || busy || archived) return;
    const hasAnswers = draft.options.some((option) => option?.trim()) || draft.correctIndex != null ||
      Boolean(draft.correctAnswer?.trim()) || draft.acceptedAnswers.some((answer) => answer.trim());
    if (hasAnswers) setTypeConfirmation(type);
    else setDraft({ ...draft, ...resetAnswers(type) });
  }

  function insertBlank() {
    const input = promptInput.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const current = draft.prompt ?? "";
    const prompt = current.slice(0, start) + "____" + current.slice(end);
    setDraft({ ...draft, prompt });
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + 4, start + 4);
    });
  }

  async function save() {
    if (archived || atLimit) return;
    const next = {
      ...draft,
      options: multipleChoice ? answerOptions : [],
      acceptedAnswers: multipleChoice ? [] : acceptedAnswers(draft, false),
    };
    const questions = question ? lesson.questions.map((item) => item.id === question.id ? next : item) : [...lesson.questions, next];
    const result = await run(() => saveLessonContent(lesson, topic.id, { questions }));
    if (result) await navigate(steps[2].to, { replace: true, state: { questionSaved: savedAtLabel() } });
  }

  return <AuthoringPage title={(archived ? "Xem câu " : "Soạn câu ") + (index + 1)}
    subtitle={multipleChoice ? "Câu trắc nghiệm." : "Câu điền chỗ trống."}
    badge={<Badge tone={complete ? "success" : "neutral"}>{complete ? "Đủ" : "Nháp"}</Badge>}
    context={<LessonBreadcrumb topic={topic} lesson={lesson} />} current={2} steps={steps} locked={busy}
    footer={<AuthoringFooter backTo={steps[2].to} backLabel="Câu luyện tập" busy={busy} status={busy ? "Đang lưu…" : undefined}>
      {!archived && <ActionButton form="grammar-question-editor" type="submit" disabled={busy || atLimit}>
        {busy ? "Đang lưu…" : complete ? "Lưu câu hỏi" : "Lưu nháp câu hỏi"}
      </ActionButton>}
    </AuthoringFooter>}>
    {atLimit && <ReportError error="Bài học đã có 5 câu. Xóa một câu trong phần Luyện tập để thêm câu mới." />}
    <ReportError error={error} retry={conflict ? refresh : undefined} />
    <div className={authoringGrid}>
      <form id="grammar-question-editor" className={panelClass} onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <fieldset disabled={busy || archived || atLimit} className="grid min-w-0 gap-4">
          <fieldset aria-label="Loại câu hỏi" className="grid max-w-sm grid-cols-2 gap-2">
            <legend className="mb-2 font-semibold">Loại câu hỏi</legend>
            {Object.entries(questionLabels).map(([type, label]) => <ActionButton key={type} type="button"
              aria-pressed={draft.type === type} variant={draft.type === type ? "default" : "outline"}
              onClick={() => switchType(type as GrammarQuestionType)} className="h-auto min-h-10 whitespace-normal">{label}</ActionButton>)}
          </fieldset>
          <div className="grid gap-1">
            <label htmlFor={promptId} className="font-semibold">Câu hỏi<Required /></label>
            <textarea ref={promptInput} id={promptId} rows={3} value={draft.prompt ?? ""} aria-describedby={archived ? undefined : promptId + "-hint"}
              className={cn(fieldClass, "resize-y")} onChange={(event) => setDraft({ ...draft, prompt: event.target.value })} />
            {!archived && <div className="flex flex-wrap items-center justify-between gap-2">
              <p id={promptId + "-hint"} className="text-xs text-on-surface-variant">
                {multipleChoice ? "Có thể dùng ____ để đánh dấu chỗ trống." : "Dùng đúng một chỗ trống ____ trong câu hỏi."}
              </p>
              <ActionButton type="button" variant="link" size="sm" className="h-auto min-h-0 px-0 py-0" onClick={insertBlank}>Chèn chỗ trống</ActionButton>
            </div>}
          </div>
          {multipleChoice ? <fieldset className="grid min-w-0 gap-2">
            <legend className="mb-2 w-full">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-semibold">Đáp án<Required /></span>
                <span className="text-xs text-on-surface-variant">Chọn nút tròn bên trái phương án đúng.</span>
              </span>
            </legend>
            {answerOptions.map((option, i) => {
              const correct = draft.correctIndex === i;
              const letter = optionLetters[i];
              return <div key={letter} className={cn("flex min-w-0 items-center gap-2 rounded-lg border border-outline px-3 py-1",
                correct && "border-primary bg-learning-mint")}>
                <input name={radioGroup} type="radio" className="size-5 flex-none accent-primary" aria-label={"Chọn phương án " + letter + " là đúng"}
                  checked={correct} onChange={() => setDraft({ ...draft, correctIndex: i })} />
                <span className="rounded-md bg-surface-container-high px-2 py-1 font-semibold" aria-hidden="true">{letter}</span>
                <input className={cn(fieldClass, "min-w-0 border-transparent bg-transparent py-1")} aria-label={"Phương án " + letter}
                  value={option} onChange={(event) => setDraft({
                    ...draft, options: answerOptions.map((entry, index) => index === i ? event.target.value : entry),
                  })} />
                {correct && <span className="hidden shrink-0 sm:inline"><Badge tone="success">Đáp án đúng</Badge></span>}
              </div>;
            })}
          </fieldset> : <fieldset className="grid gap-2">
            <legend className="mb-1 font-semibold">Đáp án đúng<Required /></legend>
            <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-outline bg-surface-container-lowest p-2">
              <input value={draft.correctAnswer ?? ""} aria-label="Đáp án đúng chính" placeholder="Nhập đáp án chính"
                className="field-sizing-content min-w-16 max-w-full rounded-full bg-learning-mint px-2.5 py-0.5 text-primary focus-visible:outline-2 focus-visible:outline-primary"
                onChange={(event) => setDraft({ ...draft, correctAnswer: event.target.value })} />
              {draft.acceptedAnswers.map((answer, index) => (
                <div key={index} className="flex max-w-full min-w-0 items-center gap-1 rounded-full bg-learning-mint pe-1 text-primary">
                  <input value={answer} aria-label={`Đáp án chấp nhận ${index + 1}`} placeholder="Đáp án khác"
                    className="field-sizing-content min-w-16 max-w-full rounded-full bg-transparent px-2.5 py-0.5 focus-visible:outline-2 focus-visible:outline-primary"
                    onChange={(event) => setDraft({
                      ...draft, acceptedAnswers: draft.acceptedAnswers.map((entry, i) => i === index ? event.target.value : entry),
                    })} />
                  {!archived && <button type="button" className="shrink-0 rounded-full p-1 focus-visible:outline-2 focus-visible:outline-primary"
                    aria-label={`Xóa đáp án chấp nhận ${index + 1}`}
                    onClick={() => setDraft({ ...draft, acceptedAnswers: draft.acceptedAnswers.filter((_, i) => i !== index) })}>
                    <X className="size-3" aria-hidden />
                  </button>}
                </div>
              ))}
              {!archived && <ActionButton type="button" variant="ghost" size="sm" className="h-auto min-h-0 px-1 py-0.5 text-xs text-on-surface-variant"
                onClick={() => setDraft({ ...draft, acceptedAnswers: [...draft.acceptedAnswers, ""] })}><Plus className="size-3" aria-hidden />Thêm đáp án chấp nhận</ActionButton>}
            </div>
            <p className="text-xs text-on-surface-variant">Hệ thống chấp nhận đáp án chính, gộp các cách viết tương đương và bỏ qua khác biệt hoa thường.</p>
          </fieldset>}
          <label className="grid gap-1">
            <span className="font-semibold">Giải thích đáp án<Required /></span>
            <textarea className={cn(fieldClass, "resize-y")} rows={3} value={draft.explanation ?? ""}
              onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} />
            <span className="text-xs text-on-surface-variant">Học viên thấy giải thích sau khi kiểm tra đáp án.</span>
          </label>
        </fieldset>
      </form>
      <aside className="grid gap-4">
        <section className={panelClass}>
          <h2 className="mb-3 text-base font-bold">Học viên sẽ thấy</h2>
          <div className="rounded-lg bg-surface-container-low p-3"><QuestionPreview question={draft} /></div>
          <p className="mt-2 text-xs text-on-surface-variant">Giải thích hiển thị sau khi học viên kiểm tra đáp án.</p>
        </section>
        <section className={panelClass}><h2 className="mb-1 text-base font-bold">Cần hoàn thành</h2><ReviewChecks checks={checks} /></section>
      </aside>
    </div>
    {typeConfirmation && <ConfirmAction open title="Đổi loại câu hỏi?"
      description="Đổi loại sẽ xóa đáp án đã nhập. Nội dung câu hỏi và giải thích vẫn được giữ."
      confirm="Đổi loại và xóa đáp án" busy={false} onClose={() => setTypeConfirmation(undefined)}
      onConfirm={() => {
        clearError();
        setDraft({ ...draft, ...resetAnswers(typeConfirmation) });
        setTypeConfirmation(undefined);
      }} />}
  </AuthoringPage>;
}

