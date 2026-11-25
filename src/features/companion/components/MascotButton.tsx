import { forwardRef } from "react";
import { MessageCircle } from "lucide-react";
import BrandImage from "@shared/components/BrandImage";

interface MascotButtonProps {
  onClick: () => void;
}

export const MascotButton = forwardRef<HTMLButtonElement, MascotButtonProps>(
  function MascotButton({ onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className="companion-mascot"
        aria-label="Open AI Companion"
        onClick={onClick}
      >
        <BrandImage variant="mark" className="companion-mascot-mark" />
        <span className="companion-mascot-bubble" aria-hidden="true">
          <MessageCircle size={18} strokeWidth={2} />
        </span>
      </button>
    );
  }
);
