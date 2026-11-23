import { ArrowRight, CheckCircle2, Flag, UnlockKeyhole } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components";
import { grammarPaths } from "@features/grammar/services/grammar-learning.service";
import type { GrammarPracticeFeedback, GrammarPracticeResult } from "@features/grammar/types/grammar.types";
import GrammarPracticeStartButton from "./GrammarPracticeStartButton";
import GrammarPracticeSteps from "./GrammarPracticeSteps";
interface Props { topicId: string; lessonId: string; result: GrammarPracticeResult; feedback: GrammarPracticeFeedback[] }
function ReviewAnswer({ answer }: { answer: GrammarPracticeFeedback }) {
  return <div className="wrap-break-word space-y-2 border-t border-learning-outline py-4 text-body-md">
    <p lang="en" className="whitespace-pre-wrap font-semibold">{answer.prompt || `Câu ${answer.number}`}</p>
    <p>Bạn trả lời: <span lang="en" className="font-semibold">{answer.submittedAnswer}</span></p>
    <p className="text-primary">✓ Đáp án đúng: <span lang="en" className="font-semibold">{answer.correctAnswer}</span></p>
    <p className="whitespace-pre-wrap text-on-surface-variant">{answer.explanation}</p>
  </div>;
}
export default function GrammarPracticeResultCard({ topicId, lessonId, result, feedback }: Props) {
  const heading = useRef<HTMLHeadingElement>(null); const Icon = result.passed ? CheckCircle2 : Flag;
  const wrong = feedback.filter((answer) => !answer.correct); const correct = feedback.filter((answer) => answer.correct);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="space-y-5">
    <GrammarPracticeSteps total={result.totalQuestions} feedback={feedback} />
    <Card className="space-y-5 rounded-2xl border-learning-outline bg-white p-5 text-center sm:p-6">
      <Icon className="mx-auto size-10 text-primary" aria-hidden="true" />
      <h1 ref={heading} tabIndex={-1} className="text-headline-lg font-bold focus:outline-none">{result.passed ? "Làm tốt lắm!" : "Cùng luyện thêm một lượt nhé!"}</h1>
      <p className="text-headline-lg font-bold text-primary">{result.score}/{result.totalQuestions}</p>
      <p className="text-body-md text-on-surface-variant">Điểm của lượt này · Đúng từ 3/5 câu để hoàn thành bài.</p>
      {result.archived ? <p className="rounded-xl bg-learning-note p-4 text-body-md text-learning-note-ink">Bài học đã ngừng xuất bản. Kết quả được lưu nhưng chưa ảnh hưởng đến tiến độ hiện tại.</p>
        : <div className="space-y-2 rounded-xl bg-learning-mint p-4 text-body-md text-primary">
          <p>{result.passed ? "Bạn đã đạt yêu cầu của lượt luyện tập." : "Bạn chưa đạt yêu cầu ở lượt này. Hãy xem lại câu sai rồi làm lại đủ 5 câu."}</p>
          {result.completed && <p className="font-semibold">✓ Bài học đã hoàn thành. Các lượt ôn lại không làm mất trạng thái hoàn thành và điểm cao nhất.</p>}
          {result.topicCompleted && <p className="font-semibold">✓ Bạn đã hoàn thành chủ đề này!</p>}
        </div>}
      {result.newlyUnlockedLevels.length > 0 && <p role="status" className="flex items-center justify-center gap-2 text-body-md font-semibold text-primary"><UnlockKeyhole className="size-5" aria-hidden="true" />Đã mở khóa {result.newlyUnlockedLevels.join(", ")}</p>}
    </Card>
    <Card className="space-y-3 rounded-2xl border-learning-outline bg-white p-5">
      {wrong.length ? <section><h2 className="text-headline-sm font-bold">Cần xem lại · {wrong.length} câu</h2>{wrong.map((answer) => <ReviewAnswer key={answer.questionId} answer={answer} />)}</section> : <h2 className="text-headline-sm font-bold text-primary">Bạn đã trả lời đúng tất cả!</h2>}
      {correct.length > 0 && <details><summary className="min-h-12 cursor-pointer py-3 text-label-lg font-semibold text-primary">Xem {correct.length} câu đúng</summary>{correct.map((answer) => <ReviewAnswer key={answer.questionId} answer={answer} />)}</details>}
    </Card>
    <div className="flex flex-col gap-3 rounded-2xl border border-learning-outline bg-white p-5 sm:flex-row sm:flex-wrap">
      {!result.archived && !result.passed && <><GrammarPracticeStartButton topicId={topicId} lessonId={lessonId} restart replace>Làm lại 5 câu</GrammarPracticeStartButton><Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={grammarPaths.lesson(topicId, lessonId)}>Xem lại bài học</Link></Button></>}
      {!result.archived && result.nextLessonId && <Button asChild className="min-h-12 rounded-xl"><Link to={grammarPaths.lesson(topicId, result.nextLessonId)}>Bài tiếp theo<ArrowRight aria-hidden="true" /></Link></Button>}
      <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={grammarPaths.topic(topicId)}>Về chủ đề</Link></Button>
    </div>
  </div>;
}
