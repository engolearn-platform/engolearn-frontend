import { Play, RotateCcw } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useGrammarAction } from "@features/grammar/hooks/useGrammarAction";
import { grammarLearning, grammarPaths } from "@features/grammar/services/grammar-learning.service";

interface StartButtonProps extends PropsWithChildren {
  topicId: string;
  lessonId: string;
  restart?: boolean;
  replace?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}

export default function GrammarPracticeStartButton({
  children, topicId, lessonId, restart = false, replace = false, secondary = false, disabled = false,
}: StartButtonProps) {
  const navigate = useNavigate();
  const { run, pending, error } = useGrammarAction();
  const Icon = restart ? RotateCcw : Play;

  function start() {
    void run(
      (signal) => grammarLearning.startPractice(topicId, lessonId, restart, signal),
      (session) => void navigate(grammarPaths.practice(topicId, lessonId, session.id), { replace }),
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={secondary ? "outline" : "default"}
        className="min-h-12 w-full rounded-xl font-semibold sm:w-auto"
        disabled={pending || disabled}
        onClick={start}
      >
        <Icon aria-hidden="true" />
        {pending ? "Đang mở luyện tập…" : children}
      </Button>
      {error && (
        <p role="alert" className="text-label-lg text-error">
          {error.status === 403
            ? "Bài học này chưa mở khóa."
            : error.status === 404
              ? "Bài học này hiện không còn khả dụng."
              : "Không mở được lượt luyện tập. Hãy thử lại."}
        </p>
      )}
    </div>
  );
}
