import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";
import { cn } from "@shared/utils";
import { Check, Lock, Shapes, Star } from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { GrammarUnit } from "../types/grammar.types";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";

interface UnitCardProps {
  unit: GrammarUnit;
  onContinue?: (unitId: string) => void;
}

export default function UnitCard({ unit, onContinue }: UnitCardProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (onContinue) {
      onContinue(unit.id);
      return;
    }
    void navigate(`${ROUTES.GRAMMAR}/${unit.id}`);
  };

  if (unit.status === "completed") {
    return (
      <article className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 opacity-60 shadow-sm sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-variant">
          <Check className="size-6 text-on-surface-variant" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-headline-sm font-semibold text-on-surface line-through">
            {unit.title}
          </h3>
          <div className="mt-2">
            <ProgressBar value={unit.progress} size="sm" />
          </div>
        </div>
        <p className="shrink-0 text-right text-label-sm text-primary">
          Hoàn thành
        </p>
      </article>
    );
  }

  if (unit.status === "locked") {
    return (
      <article className="flex cursor-not-allowed flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-container-highest">
          <Lock
            className="size-6 text-on-surface-variant"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-headline-sm font-semibold text-on-surface">
            {unit.title}
          </h3>
          {unit.description && (
            <p className="text-body-md text-on-surface-variant">
              {unit.description}
            </p>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border-2 border-primary bg-surface-container-lowest p-5 shadow-md transition-transform hover:-translate-y-1 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
        <Star
          className="size-6 text-on-primary"
          fill="currentColor"
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-headline-sm font-semibold text-on-surface">
            {unit.title}
          </h3>
          <StatusBadge label="Đang học" tone="gold" />
        </div>
        {unit.description && (
          <p className="mb-2 text-body-md text-on-surface-variant">
            {unit.description}
          </p>
        )}
        {unit.topicLink && (
          <p className="mb-3 flex items-center gap-2 rounded-md border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-label-sm text-tertiary">
            <Shapes className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Đã luyện trong chủ đề:{" "}
              <Link
                to={unit.topicLink.to}
                className="text-primary hover:underline"
              >
                {unit.topicLink.label}
              </Link>
            </span>
          </p>
        )}
        <ProgressBar value={unit.progress} showLabel animated />
      </div>
      <div className="mt-4 shrink-0 sm:mt-0">
        <Button
          type="button"
          onClick={handleContinue}
          className={cn("w-full rounded-xl sm:w-auto")}
        >
          Tiếp tục học
        </Button>
      </div>
    </article>
  );
}
