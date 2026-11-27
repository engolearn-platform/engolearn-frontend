import { useMemo, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import QuizGroupSection from "@features/topic/components/management/upsert/editor/quiz/QuizGroupSection";
import QuizHeaderCard from "@features/topic/components/management/upsert/editor/quiz/QuizHeaderCard";
import QuestionUpsertDialog from "@features/topic/components/management/upsert/editor/quiz/QuestionUpsertDialog";
import type { QuizQuestionUpsert } from "@features/topic/hooks/useTopicItemQuizForm";
import type { QuizType } from "@features/topic/types/topic-create.types";
import type { TopicQuizResource } from "@features/topic/types/topic-management.types";
import { toQuizPresentations, type QuizQuestionPresentation } from "@features/topic/utils/topic-quiz-presentation";

interface Props {
  value: TopicQuizResource[];
  onChange: (value: TopicQuizResource[]) => void;
  disabled?: boolean;
  topicId: string;
  minor?: boolean;
}

function toInitial(question: QuizQuestionPresentation): QuizQuestionUpsert | undefined {
  if (question.kind === "SITUATIONAL_CHOICE") return {
    kind: question.kind, prompt: question.prompt ?? "", audioUrl: question.audioUrl,
    optionTexts: question.options.map((option) => option.textEn ?? ""),
    correctIndex: question.correctness.status === "resolved" ? question.correctness.selectedOptionIndex ?? -1 : -1,
    explanationOk: question.explanationOk ?? "", explanationNg: question.explanationNg ?? "", explanation: question.explanation ?? "",
  };
  if (question.kind !== "FILL_BLANK") return undefined;
  return {
    kind: question.kind, textEn: question.sentenceText ?? "", meaningVi: question.meaningVi ?? "",
    audioUrl: question.audioUrl, sentenceWithBlank: question.sentenceWithBlank ?? "",
    wordBank: question.wordBank,
    correctOption: question.correctness.status === "resolved" ? question.correctness.selectedAnswerText ?? "" : "",
    explanation: question.explanation, tips: question.tips ?? "",
  };
}

function withQuestion(module: TopicQuizResource, draft: QuizQuestionUpsert, index?: number): TopicQuizResource {
  const questions = [...module.questions];
  if (draft.kind === "SITUATIONAL_CHOICE") {
    const old = index == null ? undefined : questions[index];
    const options = draft.optionTexts.map((textEn, optionIndex) => ({ label: old?.options[optionIndex]?.label ?? String.fromCharCode(65 + optionIndex), textEn: textEn.trim() || null, isCorrect: optionIndex === draft.correctIndex }));
    questions[index ?? questions.length] = {
      ...(old ?? { prompt: null, audioUrl: null, options: [], correct: null, explanationOk: null, explanationNg: null, sentence: null, quizData: null, answerData: null, explanation: null, tips: null }),
      prompt: draft.prompt.trim() || null, audioUrl: draft.audioUrl, options,
      correct: options.find((option) => option.isCorrect)?.label ?? null,
      explanationOk: draft.explanationOk.trim() || null, explanationNg: draft.explanationNg.trim() || null,
      explanation: draft.explanation === undefined ? old?.explanation ?? null : draft.explanation.trim() || null,
    };
  } else {
    const answer = draft.correctOption.trim();
    const blank = draft.sentenceWithBlank.trim();
    const blankCount = (blank.match(/___/g) ?? []).length;
    const old = index == null ? undefined : questions[index];
    const textEn = answer && blankCount === 1 ? blank.replace("___", answer) : blank || draft.textEn.trim();
    const options = draft.wordBank.map((word) => word.trim()).map((textEn, optionIndex) => ({ label: old?.options[optionIndex]?.label ?? String.fromCharCode(65 + optionIndex), textEn: textEn || null, isCorrect: Boolean(answer) && textEn === answer }));
    questions[index ?? questions.length] = {
      ...(old ?? { prompt: null, audioUrl: null, options: [], correct: null, explanationOk: null, explanationNg: null, sentence: null, quizData: null, answerData: null, explanation: null, tips: null }),
      prompt: null, audioUrl: old?.audioUrl ?? null, options, correct: options.find((option) => option.isCorrect)?.label ?? null,
      sentence: { ...(old?.sentence ?? { textEn: null, meaningVi: null, audioUrl: null, audioUrlSlow: null, source: null, externalId: null }), textEn: textEn || null, meaningVi: draft.meaningVi.trim() || null, audioUrl: draft.audioUrl },
      explanation: draft.explanation?.trim() || null, tips: draft.tips.trim() || null,
    };
  }
  return { ...module, questions };
}

export default function TopicItemQuizEditorView({ value, onChange, topicId, disabled = false, minor = false }: Props) {
  const [dialog, setDialog] = useState<{ moduleIndex: number; questionIndex?: number; type: QuizType } | null>(null);
  const presentation = useMemo(() => toQuizPresentations(value), [value]);
  const groups = presentation.modules;
  const totalQuestions = presentation.totalQuestions;
  const currentQuestion = dialog?.questionIndex == null || !dialog ? undefined : groups[dialog.moduleIndex]?.questions[dialog.questionIndex];
  const initial = currentQuestion ? toInitial(currentQuestion) : undefined;

  const addModule = (type: QuizType) => onChange([...value, { quizId: null, quizType: type, title: "", instructions: "", orderIndex: Math.max(-1, ...value.map((module) => module.orderIndex ?? -1)) + 1, questions: [] }]);
  const updateModule = (index: number, patch: Partial<Pick<TopicQuizResource, "title" | "instructions">>) => onChange(value.map((module, i) => i === index ? { ...module, ...patch } : module));
  const moveModule = (index: number, delta: number) => {
    const next = [...value]; const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((module, orderIndex) => ({ ...module, orderIndex })));
  };
  const deleteModule = (index: number) => {
    if (!window.confirm("Xóa quiz module và toàn bộ câu hỏi trong module này?")) return;
    onChange(value.filter((_, i) => i !== index).map((module, orderIndex) => ({ ...module, orderIndex })));
  };
  const deleteQuestion = (id: string) => {
    const match = /^module-(\d+)-question-(\d+)$/.exec(id);
    if (!match) return;
    const moduleIndex = Number(match[1]); const questionIndex = Number(match[2]);
    if (!window.confirm("Xóa câu hỏi này?")) return;
    onChange(value.map((module, i) => i === moduleIndex ? { ...module, questions: module.questions.filter((_, q) => q !== questionIndex) } : module));
  };
  const reorderQuestion = (moduleIndex: number, questionIndex: number, delta: number) => {
    const target = questionIndex + delta; const module = value[moduleIndex];
    if (!module || target < 0 || target >= module.questions.length) return;
    const questions = [...module.questions]; [questions[questionIndex], questions[target]] = [questions[target], questions[questionIndex]];
    onChange(value.map((entry, i) => i === moduleIndex ? { ...entry, questions } : entry));
  };

  return <div className="flex flex-col gap-6">
    <QuizHeaderCard itemTitleEn="Quiz" totalQuestions={totalQuestions} groupCount={groups.length} disabled={disabled || minor} onQuickAdd={() => { if (!minor) addModule("SITUATIONAL_CHOICE"); }} />
    {!minor && <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={disabled} variant="outline" onClick={() => addModule("FILL_BLANK")}>Thêm Fill Blank module</Button>
      <Button type="button" disabled={disabled} variant="outline" onClick={() => addModule("SITUATIONAL_CHOICE")}>Thêm Situational Choice module</Button>
    </div>}
    {value.map((module, moduleIndex) => {
      const group = groups[moduleIndex];
      if (!group) return null;
      const supportedModule = group.kind === "supported";
      const titleControl = !minor && <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-label-sm">Tên module<input aria-label={`Quiz module ${moduleIndex + 1} title`} value={module.title ?? ""} disabled={disabled} onChange={(event) => updateModule(moduleIndex, { title: event.target.value })} className="mt-1 w-full rounded-lg bg-surface-container-low px-3 py-2" /></label>
        <label className="text-label-sm">Hướng dẫn<input aria-label={`Quiz module ${moduleIndex + 1} instructions`} value={module.instructions ?? ""} disabled={disabled} onChange={(event) => updateModule(moduleIndex, { instructions: event.target.value })} className="mt-1 w-full rounded-lg bg-surface-container-low px-3 py-2" /></label>
      </div>;
      const moduleActions = !minor && <><Button type="button" variant="outline" disabled={disabled || moduleIndex === 0} onClick={() => moveModule(moduleIndex, -1)}>Lên</Button><Button type="button" variant="outline" disabled={disabled || moduleIndex === value.length - 1} onClick={() => moveModule(moduleIndex, 1)}>Xuống</Button><Button type="button" variant="outline" disabled={disabled} onClick={() => deleteModule(moduleIndex)}>Xóa module</Button></>;
      return <div key={`${module.quizId ?? "draft"}-${moduleIndex}`} className="space-y-3">
        <QuizGroupSection group={group} onAdd={() => { if (!minor && (module.quizType === "FILL_BLANK" || module.quizType === "SITUATIONAL_CHOICE")) setDialog({ moduleIndex, type: module.quizType }); }} onEdit={(id) => { const found = /question-(\d+)$/.exec(id); if (found && (module.quizType === "FILL_BLANK" || module.quizType === "SITUATIONAL_CHOICE")) setDialog({ moduleIndex, questionIndex: Number(found[1]), type: module.quizType }); }} onDelete={deleteQuestion} onPreviewAudio={() => undefined} readOnly={disabled} minorMode={minor} titleControl={supportedModule ? titleControl || undefined : undefined} moduleActions={supportedModule ? moduleActions || undefined : undefined} />
        {!minor && supportedModule && module.questions.map((_, questionIndex) => <div key={`${moduleIndex}-${questionIndex}`} className="flex gap-2"><Button type="button" variant="outline" disabled={disabled || questionIndex === 0} onClick={() => reorderQuestion(moduleIndex, questionIndex, -1)}>Đưa câu lên</Button><Button type="button" variant="outline" disabled={disabled || questionIndex === module.questions.length - 1} onClick={() => reorderQuestion(moduleIndex, questionIndex, 1)}>Đưa câu xuống</Button></div>)}
      </div>;
    })}
    {dialog && <QuestionUpsertDialog topicId={topicId} open mode={dialog.questionIndex == null ? "add" : "edit"} minor={minor} presetType={dialog.type} initial={initial} allowIncomplete onClose={() => setDialog(null)} onSubmit={(draft) => { const module = value[dialog.moduleIndex]; if (!disabled && module && draft.kind === dialog.type && (!minor || dialog.questionIndex != null)) onChange(value.map((entry, index) => index === dialog.moduleIndex ? withQuestion(entry, draft, dialog.questionIndex) : entry)); setDialog(null); }} />}
  </div>;
}
