import { ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

export interface LearningFooterNavProps {
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
}

export function LearningFooterNav({
  onBack,
  onSkip,
  onContinue,
}: LearningFooterNavProps) {
  return (
    <footer className="sticky bottom-20 z-30 h-20 bg-surface-container-lowest/95 shadow-[0_-1px_8px_rgb(0,0,0,0.04)] backdrop-blur-xl md:bottom-0">
      <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between px-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <ChevronLeft className="size-[18px]" />
          <span>Quay lại</span>
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg px-4 py-2 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            Bỏ qua
          </button>
          <Button
            type="button"
            onClick={onContinue}
            className="h-auto rounded-lg px-6 py-2.5 text-label-lg shadow-sm"
          >
            <span>Tiếp tục</span>
            <ArrowRight className="size-[18px]" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
