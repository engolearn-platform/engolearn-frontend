import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface TopicUpsertFooterBarProps {
  onBack: () => void;
  backLabel?: string;
  onSaveDraft?: () => void;
  saveLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
  disabled?: boolean;
}

/**
 * Footer dùng chung cho luồng upsert (tạo mới & cập nhật).
 * Mode update truyền `saveLabel="Lưu thay đổi"` / `continueLabel="Hoàn tất"`;
 * mặc định giữ nguyên copy của luồng tạo mới.
 */
export default function TopicUpsertFooterBar({
  onBack,
  backLabel = "Quay lại",
  onSaveDraft,
  saveLabel = "Lưu nháp",
  onContinue,
  continueLabel = "Tiếp tục",
  disabled = false,
}: TopicUpsertFooterBarProps) {
  return (
    <div className="sticky bottom-4 flex flex-col-reverse gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={disabled}
        className="w-full rounded-xl sm:w-auto"
      >
        <ArrowLeft className="size-[18px]" aria-hidden="true" />
        {backLabel}
      </Button>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        {onSaveDraft ? (
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={disabled}
            className="w-full rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant sm:w-auto"
          >
            {saveLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className="w-full rounded-xl bg-primary text-on-primary hover:bg-primary-container sm:w-auto"
        >
          {continueLabel}
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
