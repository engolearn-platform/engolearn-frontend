import { ChevronDown, Drama, Lightbulb, PlusCircle, Timer } from "lucide-react";
import { cn } from "@shared/utils";
import type {
  ContextDialogueTurn,
  TopicItemContextDraft,
} from "../../../types/topic-create.types";
import {
  TOPIC_CONTEXT_DESCRIPTION_MAX,
  TOPIC_CONTEXT_DURATION_OPTIONS,
  TOPIC_CONTEXT_TITLE_MAX,
} from "../../../types/topic-create.types";
import ContextDialogueTurnRow from "./ContextDialogueTurnRow";

interface TopicContextFormCardProps {
  draft: TopicItemContextDraft;
  showErrors: boolean;
  onPatch: (patch: Partial<TopicItemContextDraft>) => void;
  onUpdateTurn: (id: string, patch: Partial<ContextDialogueTurn>) => void;
  onAddTurn: () => void;
  onRemoveTurn: (id: string) => void;
}

const FIELD_CLASS =
  "w-full rounded-lg bg-surface-container-low px-4 py-3 text-body-md text-on-surface shadow-xs transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none";

function RequiredMark() {
  return (
    <span className="text-error" aria-hidden="true">
      *
    </span>
  );
}

export default function TopicContextFormCard({
  draft,
  showErrors,
  onPatch,
  onUpdateTurn,
  onAddTurn,
  onRemoveTurn,
}: TopicContextFormCardProps) {
  const titleError = showErrors && draft.title.trim().length === 0;
  const descriptionError = showErrors && draft.description.trim().length === 0;
  const dialogueError =
    showErrors &&
    (draft.turns.length === 0 ||
      draft.turns.some(
        (turn) =>
          turn.speaker.trim().length === 0 || turn.textEn.trim().length === 0,
      ));

  return (
    <section className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between border-b border-surface-container pb-2">
        <div className="flex items-center gap-2.5">
          <Drama className="size-6 text-primary" aria-hidden="true" />
          <h2 className="text-headline-sm font-semibold text-on-surface">
            Bối cảnh tình huống (Context)
          </h2>
        </div>
        <span className="text-label-sm font-medium text-error">* Trường bắt buộc</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="context-title"
            className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
          >
            Tiêu đề bối cảnh (Context Title)
            <RequiredMark />
          </label>
          <span className="text-label-sm text-on-surface-variant">
            {draft.title.length} / {TOPIC_CONTEXT_TITLE_MAX} ký tự
          </span>
        </div>
        <input
          id="context-title"
          type="text"
          value={draft.title}
          maxLength={TOPIC_CONTEXT_TITLE_MAX}
          onChange={(event) => onPatch({ title: event.target.value })}
          placeholder="VD: Gọi món tại bàn tiệc..."
          aria-invalid={titleError}
          className={cn(FIELD_CLASS, titleError && "ring-2 ring-error")}
        />
        {titleError ? (
          <p className="text-label-sm text-error">Vui lòng nhập tiêu đề bối cảnh.</p>
        ) : (
          <p className="text-label-sm text-on-surface-variant">
            Tên ngắn gọn mô tả hành động trực tiếp mà người học sẽ chuẩn bị ứng biến.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="context-prompt"
          className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
        >
          Câu hỏi gợi mở phản xạ (Communication Prompt)
          <span className="rounded bg-secondary-fixed/40 px-2 py-0.5 text-label-sm font-medium text-on-secondary-fixed">
            Gợi ý tư duy
          </span>
        </label>
        <div className="flex items-start gap-2 bg-surface-container-low p-3 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary rounded-lg">
          <Lightbulb
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <textarea
            id="context-prompt"
            rows={2}
            value={draft.prompt}
            onChange={(event) => onPatch({ prompt: event.target.value })}
            placeholder="Đặt câu hỏi kích thích người học tự vấn cách họ sẽ đối thoại..."
            className="w-full resize-none bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="context-desc"
            className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
          >
            Mô tả bối cảnh tình huống (Scenario Description)
            <RequiredMark />
          </label>
          <span className="text-label-sm text-on-surface-variant">
            {draft.description.length} / {TOPIC_CONTEXT_DESCRIPTION_MAX} ký tự
          </span>
        </div>
        <textarea
          id="context-desc"
          rows={4}
          value={draft.description}
          maxLength={TOPIC_CONTEXT_DESCRIPTION_MAX}
          onChange={(event) => onPatch({ description: event.target.value })}
          placeholder="Mô tả không gian, đối tượng xung quanh và áp lực giao tiếp tự nhiên..."
          aria-invalid={descriptionError}
          className={cn(
            FIELD_CLASS,
            "resize-none",
            descriptionError && "ring-2 ring-error",
          )}
        />
        {descriptionError ? (
          <p className="text-label-sm text-error">Vui lòng nhập mô tả bối cảnh.</p>
        ) : (
          <p className="text-label-sm text-on-surface-variant">
            Tạo dựng không gian (nơi chốn, cảm xúc, mục tiêu hành động).
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-label-lg font-semibold text-on-surface">
            Tình huống hội thoại mẫu ngắn (Context Dialogue)
            <RequiredMark />
          </span>
          <button
            type="button"
            onClick={onAddTurn}
            className="inline-flex items-center gap-1 text-label-sm font-medium text-primary hover:underline"
          >
            <PlusCircle className="size-4" aria-hidden="true" />
            Thêm dòng thoại
          </button>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3 sm:p-4">
          {draft.turns.map((turn) => (
            <ContextDialogueTurnRow
              key={turn.id}
              turn={turn}
              onChange={(turnPatch) => onUpdateTurn(turn.id, turnPatch)}
              onRemove={() => onRemoveTurn(turn.id)}
            />
          ))}
        </div>
        {dialogueError && (
          <p className="text-label-sm text-error">
            Mỗi dòng thoại cần có tên người nói và câu tiếng Anh.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="context-duration"
          className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
        >
          Thời lượng tiếp thu dự kiến
        </label>
        <div className="relative">
          <Timer
            className="pointer-events-none absolute top-3.5 left-3.5 size-5 text-tertiary"
            aria-hidden="true"
          />
          <select
            id="context-duration"
            value={draft.duration}
            onChange={(event) => onPatch({ duration: event.target.value })}
            className={cn(FIELD_CLASS, "cursor-pointer appearance-none pr-10 pl-11")}
          >
            {TOPIC_CONTEXT_DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-3.5 right-3.5 size-5 text-on-surface-variant"
            aria-hidden="true"
          />
        </div>
        <p className="text-label-sm text-on-surface-variant">
          Ước lượng thời gian người học đọc và cảm nhận bối cảnh.
        </p>
      </div>
    </section>
  );
}
