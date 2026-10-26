import { Check, LockKeyhole, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils";
import type { DailyAnswers, DailyQuestion } from "@features/learning-path/types/learning-path-day.types";

interface DailyQuestionNavigatorProps {
  mode: "practice" | "review";
  currentPage: number;
  questions: DailyQuestion[];
  answers: DailyAnswers;
  draftAnswers?: DailyAnswers;
  onSelectPage?: (page: number) => void;
  returnTo?: string;
}

export default function DailyQuestionNavigator({
  mode,
  currentPage,
  questions,
  answers,
  draftAnswers = {},
  onSelectPage,
  returnTo,
}: DailyQuestionNavigatorProps) {
  const review = mode === "review";
  const correct = questions.filter((question) => answers[question.number] === question.correctIndex).length;
  const wrong = questions.filter((question) => answers[question.number] !== undefined && answers[question.number] !== question.correctIndex).length;
  const unanswered = questions.length - correct - wrong;

  return (
    <aside className="self-start rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm lg:sticky lg:top-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-on-surface">Danh sách câu hỏi</h2>
        <span className="whitespace-nowrap text-xs text-on-surface-variant">
          {review ? `Đang xem Trang ${currentPage}/4` : `Trang ${currentPage}/4`}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {[1, 2, 3, 4].map((page) => {
          const pageQuestions = questions.slice((page - 1) * 3, page * 3);
          const start = pageQuestions[0]?.number;
          const end = pageQuestions[pageQuestions.length - 1]?.number;
          const saved = !review && pageQuestions.every((question) => answers[question.number] !== undefined);
          const group = (
            <>
              <div className="flex items-center justify-between gap-1 text-xs font-semibold uppercase tracking-wide">
                <span className="inline-flex items-center gap-1">
                  {!review && saved && <LockKeyhole className="size-3" aria-hidden="true" />}
                  Câu {start}{end !== start ? `–${end}` : ""}
                </span>
                {saved && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] normal-case text-primary">Đã lưu</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {pageQuestions.map((question) => {
                  const savedAnswer = answers[question.number];
                  const draftAnswer = draftAnswers[question.number];
                  const isCorrect = savedAnswer === question.correctIndex;
                  const isWrong = savedAnswer !== undefined && !isCorrect;
                  const isSaved = !review && savedAnswer !== undefined;
                  const isSelected = !review && draftAnswer !== undefined;

                  return (
                    <span
                      key={question.number}
                      className={cn(
                        "inline-flex size-8 items-center justify-center gap-0.5 rounded-full border border-outline-variant/60 bg-surface-container-lowest text-xs font-semibold text-on-surface-variant",
                        isSaved && "border-primary/10 bg-primary/10 text-primary",
                        isSelected && "border-primary bg-primary text-on-primary",
                        !review && !isSaved && !isSelected && page === currentPage && "border-primary text-primary",
                        review && isCorrect && "border-primary/20 bg-primary/10 text-primary",
                        review && isWrong && "border-error/20 bg-error-container text-error",
                      )}
                      aria-label={review
                        ? `Câu ${question.number}: ${savedAnswer === undefined ? "chưa làm" : isCorrect ? "đúng" : "sai"}`
                        : `Câu ${question.number}: ${isSaved ? "đã lưu" : isSelected ? "đã trả lời" : page === currentPage ? "cần trả lời" : "chưa mở"}`}
                    >
                      {question.number}
                      {review && isCorrect && <Check className="size-2.5" aria-hidden="true" />}
                      {review && isWrong && <X className="size-2.5" aria-hidden="true" />}
                    </span>
                  );
                })}
              </div>
            </>
          );

          const groupClass = cn(
            "block w-full rounded-xl border border-outline-variant/50 bg-surface-container-low p-3 text-left text-on-surface-variant",
            currentPage === page && "border-primary bg-primary/5 text-primary",
            review && "cursor-pointer transition-colors hover:border-primary/50",
          );

          return review ? (
            <button key={page} type="button" className={groupClass} onClick={() => onSelectPage?.(page)} aria-current={currentPage === page ? "step" : undefined}>
              {group}
            </button>
          ) : (
            <div key={page} className={groupClass}>{group}</div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-outline-variant/40 pt-4 text-xs text-on-surface-variant">
        {review ? (
          <>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />Đúng</span>
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-error" />Sai</span>
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-outline-variant" />Chưa làm</span>
            </div>
            <p className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-center text-on-surface">{correct} đúng · {wrong} sai · {unanswered} chưa làm</p>
            {returnTo && (
              <Button asChild className="mt-3 h-11 w-full rounded-xl text-sm">
                <Link to={returnTo}>Hoàn thành việc xem lại</Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />Đã trả lời</span>
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full border border-primary" />Cần trả lời</span>
              <span className="inline-flex items-center gap-1"><LockKeyhole className="size-3 text-primary" />Đã lưu (đã khóa)</span>
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full border border-outline-variant" />Chưa mở</span>
            </div>
            <p className="mt-4 leading-5">Câu trả lời được lưu khi bạn bấm “Tiếp tục” và không thể sửa lại.</p>
          </>
        )}
      </div>
    </aside>
  );
}
