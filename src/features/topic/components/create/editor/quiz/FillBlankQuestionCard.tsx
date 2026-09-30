import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@shared/utils";
import type { TopicFillBlankQuestion } from "@features/topic/types/topic-create.types";
import ExpressionAudioChip from "../expressions/ExpressionAudioChip";

interface FillBlankQuestionCardProps {
  question: TopicFillBlankQuestion;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreviewAudio: () => void;
}

function renderSentenceWithBlank(sentenceWithBlank: string, answer: string) {
  const parts = sentenceWithBlank.split("___");
  return parts.map((part, partIndex) => (
    <span key={`blank-part-${partIndex}`}>
      {part}
      {partIndex < parts.length - 1 && (
        <span className="mx-1 inline-block rounded bg-primary px-3 py-0.5 font-semibold tracking-wide text-on-primary">
          {answer}
        </span>
      )}
    </span>
  ));
}

export default function FillBlankQuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  onPreviewAudio,
}: FillBlankQuestionCardProps) {
  const explanation = question.explanation?.trim() ?? "";

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-container-low px-2.5 py-1 text-label-sm font-semibold text-tertiary">
              Câu {index + 1} • Điền từ
            </span>
            {question.sentence.audioUrl && (
              <ExpressionAudioChip
                audioFile={question.sentence.audioUrl}
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
        <div className="mb-2 rounded-lg bg-surface-container-low p-3 text-body-lg text-on-surface">
          {renderSentenceWithBlank(
            question.sentenceWithBlank,
            question.correctOption,
          )}
        </div>
        <p className="mb-3 text-body-md text-on-surface-variant">
          {question.sentence.meaningVi}
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-label-sm text-on-surface-variant">
            Word bank:
          </span>
          {question.wordBank.map((word) => {
            const isCorrect = word === question.correctOption;
            return (
              <span
                key={word}
                className={cn(
                  "rounded px-2 py-0.5 text-label-sm",
                  isCorrect
                    ? "bg-primary font-semibold text-on-primary"
                    : "bg-surface-container text-on-surface",
                )}
              >
                {word}
                {isCorrect ? " ✓" : ""}
              </span>
            );
          })}
        </div>
        {(explanation.length > 0 || question.tips.trim().length > 0) && (
          <div className="mb-1 rounded-xl bg-surface-container-low p-3 text-[14px] text-on-surface-variant">
            <strong className="mb-1 block font-medium text-on-surface">
              Giải thích &amp; Mẹo dùng:
            </strong>
            {explanation.length > 0 && (
              <p className="mb-1">{question.explanation}</p>
            )}
            {question.tips.trim().length > 0 && (
              <p className="text-on-surface-variant">
                <strong className="font-medium text-on-surface">Mẹo: </strong>
                {question.tips}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
