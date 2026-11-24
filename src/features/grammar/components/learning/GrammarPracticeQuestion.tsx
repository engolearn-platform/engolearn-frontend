import { ArrowRight, BookOpen, CheckCircle2, CircleX } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/shadcn/dialog";
import { Card } from "@shared/components";
import { cn } from "@shared/utils";
import { useGrammarAction } from "@features/grammar/hooks/useGrammarAction";
import { grammarLearning, grammarPaths } from "@features/grammar/services/grammar-learning.service";
import type { GrammarAnswerResponse, GrammarPracticeAnswer, GrammarPracticeFeedback, GrammarPracticeQuestion } from "@features/grammar/types/grammar.types";

function readablePrompt(prompt: string) {
  // Keep authored text intact; separate only a recognized instruction after its context sentence.
  return prompt.replace(/([.!?])[ \t]+(?=(?:Choose|Select|Complete|Fill in|Rewrite|Correct|Match|Put|Write|Use|Identify)\b)/g, "$1\n\n");
}

interface QuestionFormProps { sessionId: string; question: GrammarPracticeQuestion; total: number; onAnswer: (result: GrammarAnswerResponse) => void; onExpired: () => void }
export function GrammarPracticeQuestionForm({ sessionId, question, total, onAnswer, onExpired }: QuestionFormProps) {
  const [answer, setAnswer] = useState("");
  const request = useRef<GrammarPracticeAnswer | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const { run, pending, error } = useGrammarAction();
  const retrying = error !== null && error.status !== 400 && error.status !== 422;
  useEffect(() => { heading.current?.focus(); }, []);
  function changeAnswer(value: string) { request.current = null; setAnswer(value); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!answer.trim() || pending) return;
    const body = request.current ?? { requestId: crypto.randomUUID(), questionId: question.id, answer };
    request.current = body;
    void run(async (signal) => {
      try { return await grammarLearning.answer(sessionId, body, signal); }
      catch (reason) { if (!signal.aborted && reason instanceof Error && "code" in reason && reason.code === "SESSION_EXPIRED") onExpired(); throw reason; }
    }, onAnswer);
  }
  const parts = readablePrompt(question.prompt).split("____");
  const inline = question.type === "FILL_IN_BLANK" && parts.length === 2;
  const field = <input id="grammar-answer" lang="en" aria-label="Đáp án của bạn" value={answer} onChange={(event) => changeAnswer(event.target.value)}
    autoComplete="off" autoCapitalize="none" spellCheck={false}
    className={cn("min-h-12 min-w-0 border-primary bg-learning-nav-active px-3 font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary",
      inline ? "mx-1 inline-block w-40 max-w-full rounded-t-lg border-b-2 text-headline-md" : "w-full rounded-xl border text-body-md")} />;
  return <Card className="space-y-5 rounded-2xl border-learning-outline bg-white p-5 sm:p-6">
    <h2 ref={heading} tabIndex={-1} className="text-label-lg font-semibold text-on-surface-variant focus:outline-none">Câu {question.number}/{total} · {question.type === "MULTIPLE_CHOICE" ? "Chọn đáp án đúng" : "Điền vào chỗ trống"}</h2>
    <form className="space-y-5" onSubmit={submit}>
      <fieldset className="space-y-4 disabled:opacity-80" disabled={pending || retrying} aria-label={`Câu hỏi ${question.number}`}>
        <div id="grammar-practice-prompt" lang="en" className="wrap-break-word whitespace-pre-wrap text-headline-md font-semibold leading-relaxed">
          {inline ? <>{parts[0]}{field}{parts[1]}</> : readablePrompt(question.prompt)}
        </div>
        {question.type === "MULTIPLE_CHOICE" ? <div role="radiogroup" aria-labelledby="grammar-practice-prompt" className="space-y-3">
          {question.options.map((option, index) => <label key={option.id} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-body-lg focus-within:ring-2 focus-within:ring-primary", answer === option.id ? "border-primary bg-learning-mint" : "border-learning-outline bg-white hover:border-primary")}>
            <input type="radio" name="grammar-answer" value={option.id} checked={answer === option.id} onChange={() => changeAnswer(option.id)} className="size-4 shrink-0 accent-primary" />
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-container-low text-label-lg font-bold text-primary" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
            <span lang="en" className="wrap-break-word min-w-0">{option.text}</span>
          </label>)}
        </div> : <>{!inline && <label className="block space-y-2"><span className="text-label-lg">Đáp án của bạn</span>{field}</label>}<p className="text-label-lg text-on-surface-variant">Nhập đáp án rồi nhấn Enter hoặc bấm Kiểm tra.</p></>}
      </fieldset>
      {error && <p role="alert" className="text-body-md text-error">{retrying ? "Chưa nhận được kết quả. Hãy thử gửi lại câu trả lời." : "Câu trả lời không hợp lệ. Hãy kiểm tra rồi gửi lại."}</p>}
      <div className="sticky bottom-0 -mx-5 border-t border-learning-outline bg-white px-5 py-4 sm:mx-0 sm:px-0">
        <Button type="submit" className="min-h-12 w-full rounded-xl font-semibold sm:w-auto" disabled={pending || !answer.trim()}>{pending ? "Đang kiểm tra…" : retrying ? "Thử gửi lại" : "Kiểm tra"}</Button>
      </div>
    </form>
  </Card>;
}

interface FeedbackProps { question: GrammarPracticeQuestion; feedback: GrammarPracticeFeedback; total: number; final: boolean; topicId: string; lessonId: string; onContinue: () => void }
export function GrammarPracticeAnswerFeedback({ question, feedback, total, final, topicId, lessonId, onContinue }: FeedbackProps) {
  const heading = useRef<HTMLHeadingElement>(null); const Icon = feedback.correct ? CheckCircle2 : CircleX;
  useEffect(() => { heading.current?.focus(); }, []);
  return <Card className="space-y-5 rounded-2xl border-learning-outline bg-white p-5 sm:p-6">
    <p className="text-label-lg font-semibold text-on-surface-variant">Câu {feedback.number}/{total}</p>
    <p lang="en" className="wrap-break-word whitespace-pre-wrap text-headline-md font-semibold">{readablePrompt(question.prompt)}</p>
    <div className={cn("space-y-3 rounded-xl p-5", feedback.correct ? "bg-learning-mint text-primary" : "bg-learning-note text-learning-note-ink")} role="status">
      <h2 ref={heading} tabIndex={-1} className="flex items-center gap-2 text-headline-sm font-bold focus:outline-none"><Icon className="size-5" aria-hidden="true" />{feedback.correct ? "Chính xác!" : "Chưa đúng, cùng xem lại nhé!"}</h2>
      <dl className="space-y-2 text-body-md"><div><dt className="inline">Bạn trả lời: </dt><dd lang="en" className="wrap-break-word inline font-semibold">{feedback.submittedAnswer}</dd></div><div><dt className="inline">Đáp án đúng: </dt><dd lang="en" className="wrap-break-word inline font-semibold">{feedback.correctAnswer}</dd></div></dl>
      <p className="wrap-break-word whitespace-pre-wrap text-body-md text-on-surface">{feedback.explanation}</p>
      <Dialog><DialogTrigger asChild><Button variant="ghost" className="min-h-12 px-0 text-primary underline underline-offset-4"><BookOpen aria-hidden="true" />Xem lại quy tắc</Button></DialogTrigger>
        <DialogContent className="max-h-dvh overflow-y-auto rounded-2xl"><DialogHeader><DialogTitle>Vì sao đáp án này đúng?</DialogTitle><DialogDescription>Giải thích theo bản câu hỏi của lượt luyện tập này.</DialogDescription></DialogHeader>
          <p className="wrap-break-word whitespace-pre-wrap text-body-md">{feedback.explanation}</p>
          <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={grammarPaths.lesson(topicId, lessonId)}>Đọc lại bài học</Link></Button>
        </DialogContent></Dialog>
    </div>
    <Button type="button" className="min-h-12 w-full rounded-xl font-semibold sm:w-auto" onClick={onContinue}>{final ? "Xem kết quả" : "Câu tiếp theo"}<ArrowRight aria-hidden="true" /></Button>
  </Card>;
}
