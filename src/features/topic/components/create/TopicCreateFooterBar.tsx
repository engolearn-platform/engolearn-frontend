import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface TopicCreateFooterBarProps {
  onBack: () => void;
  onSaveDraft?: () => void;
  onContinue?: () => void;
}

export default function TopicCreateFooterBar({
  onBack,
  onSaveDraft,
  onContinue,
}: TopicCreateFooterBarProps) {
  return (
    <div className="sticky bottom-4 flex flex-col-reverse gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        className="w-full rounded-xl sm:w-auto"
      >
        <ArrowLeft className="size-[18px]" aria-hidden="true" />
        Quay lại
      </Button>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={onSaveDraft}
          className="w-full rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant sm:w-auto"
        >
          Lưu nháp
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-primary text-on-primary hover:bg-primary-container sm:w-auto"
        >
          Tiếp tục
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
