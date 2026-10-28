import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { LessonAudio, LessonImage } from "./TopicLessonContent";
import type { QuizDto, QuizFeedbackDto } from "@features/topic/types/topic-api.types";

export function TopicQuiz({ quiz, feedback, selected, busy, pending, wrong, disabled, onAnswer }: {
  quiz: QuizDto; feedback: QuizFeedbackDto | null; selected: string | null; busy: boolean;
  pending: boolean; wrong: boolean; disabled: boolean; onAnswer: (optionId: string) => void;
}) {
  const chosen = quiz.options.find(option => option.optionId === selected);
  const correct = feedback ? quiz.options.find(option => option.optionId === feedback.correctOptionId) : null;
  return <section className="space-y-5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm md:p-6" aria-busy={busy}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-label-lg font-semibold text-primary">{quiz.type === "FILL_BLANK" ? "Điền từ" : "Chọn tình huống"}</p>
      <span className="text-label-sm text-on-surface-variant">Câu {quiz.index + 1}/{quiz.totalInType}</span>
    </div>
    <h1 className="text-headline-sm font-semibold">{quiz.title}</h1>
    <LessonImage url={quiz.imageUrl} alt="Tình huống luyện tập" />
    {quiz.situationVi && <p className="whitespace-pre-line text-body-md text-on-surface-variant">{quiz.situationVi}</p>}
    {quiz.type === "FILL_BLANK" ? <p lang="en" className="whitespace-pre-wrap text-headline-lg font-semibold leading-relaxed">
      {quiz.sentenceBefore}<span className="mx-1 inline-block min-w-20 border-b-2 border-primary px-2 text-center text-primary" aria-label={chosen ? undefined : "Chỗ trống"}>{correct?.text ?? chosen?.text ?? "…"}</span>{quiz.sentenceAfter}
    </p> : <p className="text-body-lg font-semibold">{quiz.questionVi}</p>}
    <LessonAudio url={quiz.promptAudioUrl} label="Nghe tình huống" />
    <fieldset disabled={disabled || busy || pending || !!feedback} className="space-y-3">
      <legend className="mb-3 text-body-md text-on-surface-variant">{quiz.type === "FILL_BLANK" ? "Chọn một từ hoặc cụm từ để điền vào chỗ trống." : "Chọn câu trả lời phù hợp."}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{quiz.options.map((option, index) => {
        const active = option.optionId === selected;
        const isCorrect = option.optionId === feedback?.correctOptionId;
        return <Button key={option.optionId} type="button" variant="outline" aria-pressed={active} onClick={() => onAnswer(option.optionId)}
          className={"h-auto min-h-12 justify-start whitespace-normal break-words rounded-xl px-4 py-3 text-left text-body-md focus-visible:ring-2 focus-visible:ring-primary " +
            (isCorrect ? "border-primary bg-primary/10 text-primary" : active ? "border-primary bg-primary/5" : "")}>
          <span className="shrink-0 text-label-sm">{String.fromCharCode(65 + index)}.</span><span lang="en">{option.text}</span>
          {isCorrect && <CheckCircle2 className="ml-auto size-5 shrink-0" aria-label="Đáp án đúng" />}
        </Button>;
      })}</div>
    </fieldset>
    {busy && <p role="status" className="flex items-center gap-2 text-body-md text-primary"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Đang gửi đáp án…</p>}
    {wrong && !pending && !feedback && <p role="status" className="text-body-md text-error">Chưa đúng. Bạn có thể chọn lại.</p>}
    {feedback && <div role="status" className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <p className="flex items-center gap-2 font-semibold text-primary"><CheckCircle2 className="size-5" aria-hidden="true" />Chính xác!</p>
      {(feedback.completedSentenceEn || correct) && <p lang="en" className="text-headline-sm font-semibold">{feedback.completedSentenceEn ?? correct?.text}</p>}
      {feedback.translationVi && <p className="text-body-md text-on-surface-variant">{feedback.translationVi}</p>}
      <p className="whitespace-pre-line text-body-md">{feedback.explanationVi}</p>
      {feedback.grammarNoteVi && <p className="text-body-md text-on-surface-variant">{feedback.grammarNoteVi}</p>}
      <LessonAudio url={feedback.audioUrl} label="Nghe câu trả lời đúng" />
    </div>}
  </section>;
}
