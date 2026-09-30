import { Check, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@shared/utils";
import type { TopicSituationalQuestion } from "@features/topic/types/topic-create.types";
import ExpressionAudioChip from "../expressions/ExpressionAudioChip";

interface SituationalQuestionCardProps {
  question: TopicSituationalQuestion;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreviewAudio: () => void;
}

export default function SituationalQuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  onPreviewAudio,
}: SituationalQuestionCardProps) {
  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-container-low px-2.5 py-1 text-label-sm font-semibold text-primary">
              Câu {index + 1} • Tình huống
            </span>
            {question.audioUrl && (
              <ExpressionAudioChip
                audioFile={question.audioUrl}
                onPreview={onPreviewAudio}
              />
            )}
          </div>
          <div className="flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(question.id)}
              title="Chỉnh sửa"
              aria-label={`Chỉnh sửa câu hỏi ${index + 1}`}
              className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <Pencil className="size-[18px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(question.id)}
              title="Xóa"
              aria-label={`Xóa câu hỏi ${index + 1}`}
              className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-outline transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              <Trash2 className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="mb-3 text-body-md text-on-surface">
          <strong className="text-on-surface">Tình huống: </strong>
          {question.prompt}
        </p>
        <div className="mb-4 grid grid-cols-1 gap-2 text-label-lg sm:grid-cols-2">
          {question.options.map((option) => {
            const isCorrect =
              option.isCorrect && option.label === question.correct;
            return (
              <div
                key={option.label}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg p-2.5",
                  isCorrect
                    ? "border border-primary/20 bg-primary/10 text-primary"
                    : "bg-surface-container-low text-on-surface-variant",
                )}
              >
                <span>
                  {option.label}. {option.textEn}
                </span>
                {isCorrect && (
                  <span className="shrink-0 rounded bg-primary px-2 py-0.5 text-label-sm font-semibold text-on-primary">
                    Đáp án đúng ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mb-1 rounded-xl bg-surface-container-low p-3 text-[14px] text-on-surface-variant">
          <strong className="mb-1.5 block font-medium text-on-surface">
            Giải thích đáp án:
          </strong>
          <p className="mb-1 flex items-start gap-1.5">
            <Check
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{question.explanationOk}</span>
          </p>
          <p className="flex items-start gap-1.5">
            <X
              className="mt-0.5 size-4 shrink-0 text-error"
              aria-hidden="true"
            />
            <span>{question.explanationNg}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
