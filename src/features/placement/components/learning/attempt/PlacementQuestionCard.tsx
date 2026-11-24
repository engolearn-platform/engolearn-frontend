import PlacementAudioPlayer from "./PlacementAudioPlayer";
import PlacementOptionList from "./PlacementOptionList";
import type { PlacementQuestion } from "@features/placement/types/placement-attempt.types";

interface PlacementQuestionCardProps {
  question: PlacementQuestion;
  selectedOptionId: string | null;
  disabled?: boolean;
  onSelect: (optionId: string) => void;
}

const SECTION_FALLBACK_LABEL = {
  READING: "Reading",
  LISTENING: "Listening",
} as const;

export default function PlacementQuestionCard({
  question,
  selectedOptionId,
  disabled = false,
  onSelect,
}: PlacementQuestionCardProps) {
  const skillLabel = question.label ?? SECTION_FALLBACK_LABEL[question.section];

  return (
    <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <header className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm font-semibold text-primary">
          Câu {String(question.order).padStart(2, "0")}
        </span>
        <span className="text-label-sm text-on-surface-variant">{skillLabel}</span>
      </header>

      {question.audio ? (
        <div className="mt-4">
          <PlacementAudioPlayer audio={question.audio} questionId={question.id} />
        </div>
      ) : null}

      {question.passage ? (
        <blockquote className="mt-4 rounded-xl border-l-4 border-primary/40 bg-surface-container-low px-4 py-3 text-body-md leading-relaxed text-on-surface-variant">
          {question.passage}
        </blockquote>
      ) : null}

      <p
        id={`${question.id}-prompt`}
        className="mt-4 text-body-md font-medium leading-relaxed text-on-surface"
      >
        {question.prompt}
      </p>

      <div className="mt-4">
        <PlacementOptionList
          questionId={question.id}
          options={question.options}
          selectedOptionId={selectedOptionId}
          disabled={disabled}
          onSelect={onSelect}
        />
      </div>
    </article>
  );
}
