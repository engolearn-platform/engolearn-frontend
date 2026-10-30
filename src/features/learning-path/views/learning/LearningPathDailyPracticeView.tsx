import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock3 } from "lucide-react";
import { EmptyState, Loading } from "@shared/components";
import { ROUTES, learningPathDayPath } from "@shared/constants";
import { useLearningPathDayPractice } from "@features/learning-path/hooks/useLearningPathDayPractice";
import { useLearningPathDetail } from "@features/learning-path/hooks/useLearningPathDetail";
import { learningPathService } from "@features/learning-path/services/learningPath.service";
import { formatLearningPathDate } from "@features/learning-path/utils/formatLearningPathDate";
import type { DailyAnswers, DailyQuestion, PracticeDayDto } from "@features/learning-path/types/learning-path-day.types";
import DailyQuestionCard from "@features/learning-path/components/learning/daily/DailyQuestionCard";
import DailyQuestionNavigator from "@features/learning-path/components/learning/daily/DailyQuestionNavigator";
import DailyPracticeActionBar from "@features/learning-path/components/learning/daily/DailyPracticeActionBar";

interface SessionProps {
  day: PracticeDayDto;
  questions: DailyQuestion[];
  initialAnswers: DailyAnswers;
  detailUrl: string;
  description: string;
}

function PracticeSession({ day, questions, initialAnswers, detailUrl, description }: SessionProps) {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(initialAnswers);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failedQuestions, setFailedQuestions] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(() => Date.parse(day.autoCloseAt) <= Date.now());
  const savingRef = useRef(false);
  const pageQuestions = questions.slice((page - 1) * 3, page * 3);
  const answeredCount = pageQuestions.filter((question) => answers[question.number] !== undefined).length;

  useEffect(() => {
    const remaining = Date.parse(day.autoCloseAt) - Date.now();
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setClosed(true), remaining);
    return () => window.clearTimeout(timer);
  }, [day.autoCloseAt]);

  const chooseAnswer = async (questionNumber: number, optionIndex: number) => {
    if (savingRef.current || closed || Date.now() >= Date.parse(day.autoCloseAt)) return;
    const question = day.questions.find((item) => item.order === questionNumber);
    const option = question?.options[optionIndex];
    if (!question || !option) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await learningPathService.saveDraft(day.pathId, String(day.weekNo), String(day.dayNo), question.questionId, option.optionId);
      setAnswers((current) => ({ ...current, [questionNumber]: optionIndex }));
      setFailedQuestions((current) => current.filter((number) => number !== questionNumber));
    } catch (cause) {
      setFailedQuestions((current) => current.includes(questionNumber) ? current : [...current, questionNumber]);
      setError(`${cause instanceof Error ? cause.message : "Không lưu được đáp án."} Vui lòng chọn lại đáp án câu ${questionNumber}.`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const submitDay = async () => {
    if (savingRef.current || failedQuestions.length > 0 || closed || Date.now() >= Date.parse(day.autoCloseAt)) return;
    savingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      await learningPathService.submitDay(day.pathId, day.weekNo, day.dayNo);
      navigate(learningPathDayPath(day.pathId, day.weekNo, day.dayNo, "result"), { replace: true });
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "Không xác nhận được kết quả nộp bài."} Vui lòng kiểm tra lại lộ trình nếu bài đã được đóng.`);
    } finally {
      savingRef.current = false;
      setSubmitting(false);
    }
  };

  const closeTime = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(day.autoCloseAt));

  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-5 pb-24 lg:px-8 lg:py-8 xl:px-10">
      <Link to={detailUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" aria-hidden="true" />Thoát luyện tập</Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-on-surface">Luyện tập Ngày {day.dayNo}</h1><p className="mt-1 text-sm text-on-surface-variant">{description}</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary-container bg-secondary-container/30 px-3 py-1.5 text-xs font-medium text-on-secondary-container"><Clock3 className="size-3.5" aria-hidden="true" />Tự đóng lúc {closeTime}</span>
      </header>
      {error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}
      {failedQuestions.length > 0 && <p className="mt-4 text-sm text-error">Vui lòng lưu lại đáp án câu {failedQuestions.join(", ")} trước khi nộp.</p>}
      {closed && <p role="alert" className="mt-4 text-sm text-error">Ngày luyện tập đã đến giờ đóng. Vui lòng quay lại lộ trình.</p>}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <p className="mb-3 text-sm font-medium text-on-surface-variant">Câu {pageQuestions[0].number}{pageQuestions.length > 1 ? ` – ${pageQuestions[pageQuestions.length - 1].number}` : ""} trên 10</p>
          <div className="space-y-4">{pageQuestions.map((question) => <DailyQuestionCard key={question.number} question={question} mode="practice" selectedIndex={answers[question.number]} disabled={saving || submitting || closed} onSelect={(index) => void chooseAnswer(question.number, index)} />)}</div>
          <div className="mt-4"><DailyPracticeActionBar page={page} firstQuestion={pageQuestions[0].number} lastQuestion={pageQuestions[pageQuestions.length - 1].number} questionCount={pageQuestions.length} answeredCount={answeredCount} disabled={saving || submitting || closed || (page === 4 && failedQuestions.length > 0)} submitting={submitting} onContinue={() => page === 4 ? void submitDay() : setPage((current) => current + 1)} /></div>
        </section>
        <DailyQuestionNavigator mode="practice" currentPage={page} questions={questions} answers={{}} draftAnswers={answers} onSelectPage={setPage} />
      </div>
    </div>
  );
}

function PracticeView({ pathId, weekNo, dayNo }: { pathId: string; weekNo: string; dayNo: string }) {
  const { data, loading, error } = useLearningPathDayPractice(pathId, weekNo, dayNo);
  const { data: detail } = useLearningPathDetail(pathId);
  const detailUrl = ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(pathId));
  if (loading) return <div className="mx-auto w-full max-w-[1300px] px-5 py-5"><Loading size="lg" /></div>;
  if (error || !data) return <div className="mx-auto w-full max-w-[1300px] px-5 py-5"><Link to={detailUrl} className="text-primary hover:underline">Trở về lộ trình</Link><EmptyState title="Không mở được bài luyện tập" description={error?.message ?? "Vui lòng thử lại."} /></div>;
  const description = detail ? `Lộ trình ngày ${formatLearningPathDate(detail.createdDate)} · Tuần ${weekNo} · Level ${detail.level}` : `Tuần ${weekNo}`;
  return <PracticeSession day={data.day} questions={data.questions} initialAnswers={data.answers} detailUrl={detailUrl} description={description} />;
}

export default function LearningPathDailyPracticeView() {
  const { pathId = "", weekNo = "", dayNo = "" } = useParams();
  return <PracticeView key={`${pathId}:${weekNo}:${dayNo}`} pathId={pathId} weekNo={weekNo} dayNo={dayNo} />;
}
