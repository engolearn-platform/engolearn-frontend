import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/shadcn/dialog";
import GrammarPracticeSteps from "@features/grammar/components/learning/GrammarPracticeSteps";
import { GrammarBackLink, GrammarLoadError, GrammarLoading, GrammarPage } from "@features/grammar/components/learning/GrammarLearningUi";
import { GrammarPracticeAnswerFeedback, GrammarPracticeQuestionForm } from "@features/grammar/components/learning/GrammarPracticeQuestion";
import GrammarPracticeResultCard from "@features/grammar/components/learning/GrammarPracticeResultCard";
import GrammarPracticeStartButton from "@features/grammar/components/learning/GrammarPracticeStartButton";
import { useGrammarPracticeSession } from "@features/grammar/hooks/useGrammarLearning";
import { grammarPaths } from "@features/grammar/services/grammar-learning.service";
import type {
  GrammarPracticeFeedback,
  GrammarPracticeQuestion,
  GrammarPracticeSession,
} from "@features/grammar/types/grammar.types";

interface PracticeRoute {
  topicId: string;
  lessonId: string;
}

function RestartPractice({ topicId, lessonId }: PracticeRoute) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-12 w-full rounded-xl font-semibold sm:w-auto">
          <RotateCcw aria-hidden="true" />
          Làm lại từ đầu
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Làm lại từ đầu?</DialogTitle>
          <DialogDescription>Các câu đã trả lời trong lượt đang làm sẽ bị bỏ.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="min-h-12 rounded-xl font-semibold">Quay lại</Button>
          </DialogClose>
          <GrammarPracticeStartButton topicId={topicId} lessonId={lessonId} restart replace>
            Bắt đầu lại
          </GrammarPracticeStartButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpiredPractice({ topicId, lessonId }: PracticeRoute) {
  return (
    <Navigate
      replace
      to={grammarPaths.lesson(topicId, lessonId)}
      state={{ grammarNotice: "Phiên luyện tập đã hết hiệu lực. Bạn có thể bắt đầu lượt mới tại đây." }}
    />
  );
}

function PracticeSession({ initialSession, reload }: { initialSession: GrammarPracticeSession; reload: () => void }) {
  const [session, setSession] = useState(initialSession);
  const [review, setReview] = useState<{
    question: GrammarPracticeQuestion;
    feedback: GrammarPracticeFeedback;
  } | null>(null);
  const [expired, setExpired] = useState(false);
  const { id, topicId, lessonId, question, answeredCount, totalQuestions, status, result } = session;

  if (expired) return <ExpiredPractice topicId={topicId} lessonId={lessonId} />;
  if (!review && status === "SUBMITTED" && result) {
    return <GrammarPracticeResultCard topicId={topicId} lessonId={lessonId} result={result} feedback={session.feedback} />;
  }

  return (
    <>
      <GrammarBackLink to={grammarPaths.lesson(topicId, lessonId)}>Về bài học</GrammarBackLink>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-headline-lg font-bold">Luyện tập ngữ pháp</h1>
        {status === "IN_PROGRESS" && <RestartPractice topicId={topicId} lessonId={lessonId} />}
      </header>
      <GrammarPracticeSteps total={totalQuestions} feedback={session.feedback} current={review?.feedback.number ?? question?.number} />
      <p className="text-label-lg text-on-surface-variant">{answeredCount}/{totalQuestions} câu đã nộp. Phiên luyện tập được giữ trong 30 phút kể từ hoạt động gần nhất.</p>
      {review ? (
        <GrammarPracticeAnswerFeedback
          key={review.question.id}
          question={review.question}
          feedback={review.feedback}
          total={totalQuestions}
          final={status === "SUBMITTED"}
          topicId={topicId}
          lessonId={lessonId}
          onContinue={() => setReview(null)}
        />
      ) : question ? (
        <GrammarPracticeQuestionForm
          key={question.id}
          sessionId={id}
          question={question}
          total={totalQuestions}
          onAnswer={(response) => {
            setReview({ question, feedback: response.feedback });
            setSession(response.session);
          }}
          onExpired={() => setExpired(true)}
        />
      ) : (
        <GrammarLoadError message="Không tải được câu hỏi của lượt luyện tập." retry={reload} />
      )}
    </>
  );
}

function PracticePage({ topicId, lessonId, sessionId }: PracticeRoute & { sessionId: string }) {
  const { data, loading, error, refetch } = useGrammarPracticeSession(sessionId);
  if (error?.code === "SESSION_EXPIRED") return <ExpiredPractice topicId={topicId} lessonId={lessonId} />;
  const unavailable = error?.status === 403 || error?.status === 404 ||
    (data && (data.topicId !== topicId || data.lessonId !== lessonId));
  if (unavailable) {
    return (
      <Navigate replace to={grammarPaths.lesson(topicId, lessonId)} state={{ grammarNotice: "Không tìm thấy lượt luyện tập này." }} />
    );
  }

  return (
    <GrammarPage>
      {!data && <GrammarBackLink to={grammarPaths.lesson(topicId, lessonId)}>Về bài học</GrammarBackLink>}
      {loading && <GrammarLoading />}
      {!loading && !data && <GrammarLoadError message="Không tải được lượt luyện tập." retry={refetch} />}
      {!loading && data && <PracticeSession initialSession={data} reload={refetch} />}
    </GrammarPage>
  );
}

export default function GrammarPracticeView() {
  const { topicId, lessonId } = useParams();
  const [search] = useSearchParams();
  const sessionId = search.get("session");
  if (!topicId || !lessonId) return <Navigate to={grammarPaths.roadmap} replace />;
  if (!sessionId) return <Navigate to={grammarPaths.lesson(topicId, lessonId)} replace />;
  return <PracticePage key={`${topicId}/${lessonId}/${sessionId}`} topicId={topicId} lessonId={lessonId} sessionId={sessionId} />;
}
