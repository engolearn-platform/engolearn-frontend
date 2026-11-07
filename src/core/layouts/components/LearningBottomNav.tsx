import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/core/components/shadcn/dialog";
import type { RefObject } from "react";
import LearningNavContent from "./LearningNavContent";

interface LearningBottomNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  isAuthenticated: boolean;
}

export default function LearningBottomNav({
  open,
  onOpenChange,
  triggerRef,
  isAuthenticated,
}: LearningBottomNavProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (triggerRef.current?.offsetParent !== null) triggerRef.current?.focus();
        }}
        className="!fixed !left-0 !top-0 !h-dvh !w-[min(20rem,calc(100vw-2rem))] !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !border-r !p-0 !duration-200 data-[state=open]:!slide-in-from-left data-[state=closed]:!slide-out-to-left"
      >
        <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest pt-5">
          <div className="border-b border-outline-variant px-5 pb-4 pr-14">
            <DialogTitle className="text-lg text-primary">EngoLearn</DialogTitle>
            <DialogDescription className="mt-1 leading-5">Điều hướng học tập</DialogDescription>
          </div>
          <LearningNavContent
            isAuthenticated={isAuthenticated}
            onNavigate={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
