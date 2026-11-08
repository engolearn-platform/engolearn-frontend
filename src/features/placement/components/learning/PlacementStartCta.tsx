import { Button } from "@/core/components/shadcn/button";
import { ArrowRight, Loader2 } from "lucide-react";

interface PlacementStartCtaProps {
  label: string;
  footnote: string;
  onStart: () => void;
  starting?: boolean;
  error?: string | null;
}

export default function PlacementStartCta({
  label,
  footnote,
  onStart,
  starting = false,
  error,
}: PlacementStartCtaProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 pt-2 text-center">
      <Button
        type="button"
        size="lg"
        onClick={onStart}
        disabled={starting}
        className="h-12 w-full rounded-xl px-8 text-body-md font-semibold sm:w-auto"
      >
        {label}
        {starting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="size-5" aria-hidden="true" />
        )}
      </Button>
      {error ? (
        <p role="alert" className="text-label-sm text-error">
          {error}
        </p>
      ) : null}
      <p className="text-label-sm text-on-surface-variant">{footnote}</p>
    </div>
  );
}
