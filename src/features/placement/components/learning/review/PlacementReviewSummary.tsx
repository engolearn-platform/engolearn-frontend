import type { PlacementReview } from "@features/placement/types/placement-review.types";
import { Check, Minus, X } from "lucide-react";

export default function PlacementReviewSummary({
  review,
}: {
  review: PlacementReview;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-label-lg">
      <strong className="text-headline-sm text-primary">
        {review.score}/{review.totalQuestions}
      </strong>
      <span className="rounded-full bg-primary-fixed px-3 py-1 font-semibold text-on-primary-fixed">
        Trình độ đề xuất {review.placementLevel}
      </span>
      <span className="inline-flex items-center gap-1 text-primary">
        <Check className="size-4" aria-hidden="true" /> Đúng: {review.score}
      </span>
      <span className="inline-flex items-center gap-1 text-error">
        <X className="size-4" aria-hidden="true" /> Sai: {review.incorrectCount}
      </span>
      <span className="inline-flex items-center gap-1 text-on-surface-variant">
        <Minus className="size-4" aria-hidden="true" /> Bỏ trống: {review.unansweredCount}
      </span>
    </div>
  );
}
