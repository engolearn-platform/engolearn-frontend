import { forwardRef } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface MascotButtonProps {
  onClick: () => void;
}

export const MascotButton = forwardRef<HTMLButtonElement, MascotButtonProps>(
  function MascotButton({ onClick }, ref) {
    return (
      <Button
        ref={ref}
        type="button"
        className="companion-mascot"
        aria-label="Mở Engo"
        onClick={onClick}
      >
        <img src="/landing/penguin-hero.webp" alt="" className="companion-mascot-mark" />
        <span className="companion-mascot-bubble" aria-hidden="true">
          <MessageCircle size={18} strokeWidth={2} />
        </span>
      </Button>
    );
  }
);
