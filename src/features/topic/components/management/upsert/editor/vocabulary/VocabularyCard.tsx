import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@shared/utils";
import type { TopicVocabularyItem } from "@features/topic/types/topic-create.types";
import VocabularyAudioChip from "./VocabularyAudioChip";
import VocabularyCollocationsBox from "./VocabularyCollocationsBox";
import VocabularyExamplesBlock from "./VocabularyExamplesBlock";

interface VocabularyCardProps {
  item: TopicVocabularyItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreviewAudio: () => void;
}

function posPillClass(pos: TopicVocabularyItem["pos"]): string {
  switch (pos) {
    case "verb":
      return "bg-secondary-fixed/40 text-on-secondary-fixed";
    case "noun":
      return "bg-tertiary-fixed text-on-tertiary-fixed";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}

export default function VocabularyCard({
  item,
  onEdit,
  onDelete,
  onPreviewAudio,
}: VocabularyCardProps) {
  return (
    <article className="group rounded-2xl bg-surface-container-lowest p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="mt-1 flex cursor-grab items-center justify-center rounded p-1 text-outline-variant transition-colors hover:bg-surface-container hover:text-primary active:cursor-grabbing"
            title="Kéo thả sắp xếp thứ tự"
            aria-hidden="true"
          >
            <GripVertical className="size-6" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-headline-md font-bold tracking-tight text-on-surface">
                {item.word}
              </span>
              <span
                className={cn(
                  "rounded-md px-2.5 py-0.5 text-label-sm font-semibold uppercase",
                  posPillClass(item.pos),
                )}
              >
                {item.pos}
              </span>
              {item.ipa.trim().length > 0 && (
                <span className="rounded bg-surface-container-low px-2 py-0.5 text-sm text-tertiary">
                  {item.ipa}
                </span>
              )}
              <span className="pl-1 text-body-md text-on-surface-variant italic">
                {item.meaningVi}
              </span>
            </div>
            <VocabularyAudioChip
              fileName={item.audioFile}
              uploaded={item.audioUploaded}
              onPreview={onPreviewAudio}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 self-end lg:self-start">
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
          >
            <Pencil className="size-[18px]" aria-hidden="true" />
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={`Xóa từ ${item.word}`}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-label-sm text-error transition-colors hover:bg-error-container/30"
          >
            <Trash2 className="size-[18px]" aria-hidden="true" />
            Xóa
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl bg-surface-container-low/60 p-4 pt-4 lg:ml-10 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <VocabularyExamplesBlock
            examples={item.examples}
            highlight={item.word}
          />
        </div>
        <div className="xl:col-span-4">
          <VocabularyCollocationsBox collocations={item.collocations} />
        </div>
      </div>
    </article>
  );
}
