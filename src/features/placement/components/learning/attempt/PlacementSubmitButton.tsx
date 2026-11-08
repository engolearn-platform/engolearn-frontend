import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/shadcn/dialog";
import { useState } from "react";

interface PlacementSubmitButtonProps {
  answeredCount: number;
  totalQuestions: number;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  className?: string;
}

export default function PlacementSubmitButton({
  answeredCount,
  totalQuestions,
  submitting,
  submitError,
  onSubmit,
  className,
}: PlacementSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const [emptyError, setEmptyError] = useState(false);
  const unanswered = totalQuestions - answeredCount;

  const handleOpen = () => {
    if (answeredCount === 0) {
      setEmptyError(true);
      return;
    }

    setEmptyError(false);
    setOpen(true);
  };

  const handleConfirm = () => {
    setOpen(false);
    onSubmit();
  };

  return (
    <div className={className}>
      <Button
        type="button"
        size="lg"
        className="w-full rounded-xl"
        onClick={handleOpen}
        disabled={submitting}
      >
        {submitting ? "Đang nộp bài..." : "Nộp bài thi"}
      </Button>

      {emptyError ? (
        <p role="alert" className="mt-2 text-label-sm text-error">
          Bạn chưa trả lời câu hỏi nào.
        </p>
      ) : null}

      {submitError ? (
        <p role="alert" className="mt-2 text-label-sm text-error">
          {submitError}
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nộp bài kiểm tra?</DialogTitle>
            <DialogDescription>
              {unanswered > 0
                ? `Bạn còn ${unanswered} câu chưa trả lời. Sau khi nộp, bạn không thể thay đổi đáp án.`
                : "Bạn đã trả lời tất cả câu hỏi. Sau khi nộp, bạn không thể thay đổi đáp án."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Tiếp tục làm bài
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={submitting}
              onClick={handleConfirm}
            >
              Nộp bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
