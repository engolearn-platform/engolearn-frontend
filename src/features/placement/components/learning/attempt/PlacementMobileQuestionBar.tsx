import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/shadcn/dialog";
import { ListChecks } from "lucide-react";
import { useState } from "react";
import PlacementQuestionGrid from "./PlacementQuestionGrid";
import PlacementSubmitButton from "./PlacementSubmitButton";
import type { PlacementQuestion } from "@features/placement/types/placement-attempt.types";

interface PlacementMobileQuestionBarProps {
  questions: PlacementQuestion[];
  answers: Record<string, string | null>;
  firstOrder: number;
  lastOrder: number;
  totalQuestions: number;
  answeredCount: number;
  submitting: boolean;
  submitError: string | null;
  onJump: (order: number) => void;
  onSubmit: () => void;
}

export default function PlacementMobileQuestionBar({
  questions,
  answers,
  firstOrder,
  lastOrder,
  totalQuestions,
  answeredCount,
  submitting,
  submitError,
  onJump,
  onSubmit,
}: PlacementMobileQuestionBarProps) {
  const [open, setOpen] = useState(false);

  const handleJump = (order: number) => {
    setOpen(false);
    onJump(order);
  };

  const rangeLabel =
    firstOrder === lastOrder
      ? `Câu ${firstOrder}/${totalQuestions}`
      : `Câu ${firstOrder}–${lastOrder}/${totalQuestions}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface-container-lowest px-5 py-3 lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <span className="shrink-0 text-label-sm font-semibold text-on-surface-variant">
          {rangeLabel}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Danh sách câu hỏi"
                className="rounded-xl"
              >
                <ListChecks className="size-4" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Danh sách câu hỏi</DialogTitle>
                <DialogDescription>
                  Đã trả lời {answeredCount}/{totalQuestions} câu. Câu đã trả
                  lời được tô màu.
                </DialogDescription>
              </DialogHeader>

              <PlacementQuestionGrid
                questions={questions}
                answers={answers}
                activeFirstOrder={firstOrder}
                activeLastOrder={lastOrder}
                onJump={handleJump}
              />
            </DialogContent>
          </Dialog>

          <PlacementSubmitButton
            className="w-36"
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
            submitting={submitting}
            submitError={submitError}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
