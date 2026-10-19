import { useEffect, useState } from "react";
import { Mic, Plus, PlusCircle, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/shadcn/dialog";
import { cn } from "@shared/utils";
import { ThinScroll } from "@shared/components";
import type {
  TopicVocabularyItem,
  VocabularyPos,
} from "@features/topic/types/topic-create.types";
import { TOPIC_VOCAB_POS_OPTIONS } from "@features/topic/types/topic-create.types";
import type { TopicVocabularyUpsert } from "@features/topic/hooks/useTopicItemVocabularyForm";

interface VocabularyUpsertDialogProps {
  open: boolean;
  mode: "add" | "edit";
  nextIndex: number;
  initial?: TopicVocabularyItem;
  onClose: () => void;
  onSubmit: (draft: TopicVocabularyUpsert) => void;
}

interface ExampleDraft {
  en: string;
  vi: string;
}

const FIELD_CLASS =
  "w-full rounded-lg bg-surface-container-low px-3 py-2 text-body-md text-on-surface shadow-xs transition-all outline-none placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary";

const MAX_EXAMPLES = 3;
const MAX_COLLOCATIONS = 5;

function RequiredMark() {
  return (
    <span className="text-error" aria-hidden="true">
      *
    </span>
  );
}

function audioFileFor(word: string, fallback: string): string {
  const slug = word.toLowerCase().trim().replace(/\s+/g, "_");
  if (!slug) return fallback;
  return `${slug}_pronunciation_us.mp3`;
}

function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h3 className="text-label-lg font-semibold text-on-surface">{title}</h3>
      {hint && (
        <span className="shrink-0 text-label-sm text-on-surface-variant">
          {hint}
        </span>
      )}
    </div>
  );
}

export default function VocabularyUpsertDialog({
  open,
  mode,
  nextIndex,
  initial,
  onClose,
  onSubmit,
}: VocabularyUpsertDialogProps) {
  const [word, setWord] = useState("");
  const [pos, setPos] = useState<VocabularyPos>("noun");
  const [ipa, setIpa] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [audioName, setAudioName] = useState("");
  const [examples, setExamples] = useState<ExampleDraft[]>([{ en: "", vi: "" }]);
  const [collocations, setCollocations] = useState<string[]>([]);
  const [colloInput, setColloInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWord(initial?.word ?? "");
    setPos(initial?.pos ?? "noun");
    setIpa(initial?.ipa ?? "");
    setMeaningVi(initial?.meaningVi ?? "");
    setAudioName(initial?.audioFile ?? "");
    setExamples(
      initial && initial.examples.length > 0
        ? initial.examples.map((example) => ({ ...example }))
        : [{ en: "", vi: "" }],
    );
    setCollocations(initial?.collocations ?? []);
    setColloInput("");
    setSubmitted(false);
  }, [open, initial]);

  const wordError = submitted && word.trim().length === 0;
  const meaningError = submitted && meaningVi.trim().length === 0;
  const examplesError =
    submitted && !examples.some((example) => example.en.trim().length > 0);

  const updateExample = (
    index: number,
    patch: Partial<ExampleDraft>,
  ) =>
    setExamples((prev) =>
      prev.map((example, i) =>
        i === index ? { ...example, ...patch } : example,
      ),
    );

  const addExample = () =>
    setExamples((prev) =>
      prev.length >= MAX_EXAMPLES ? prev : [...prev, { en: "", vi: "" }],
    );

  const removeExample = (index: number) =>
    setExamples((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );

  const addCollocation = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setCollocations((prev) => {
      if (prev.length >= MAX_COLLOCATIONS) return prev;
      if (prev.some((entry) => entry.toLowerCase() === value.toLowerCase()))
        return prev;
      return [...prev, value];
    });
    setColloInput("");
  };

  const removeCollocation = (value: string) =>
    setCollocations((prev) => prev.filter((entry) => entry !== value));

  const handleSubmit = () => {
    setSubmitted(true);
    const validExamples = examples.filter(
      (example) => example.en.trim().length > 0,
    );
    if (word.trim().length === 0 || meaningVi.trim().length === 0) return;
    if (validExamples.length === 0) return;
    onSubmit({
      word: word.trim(),
      pos,
      ipa: ipa.trim(),
      meaningVi: meaningVi.trim(),
      audioFile:
        audioName.trim().length > 0
          ? audioName.trim()
          : audioFileFor(
              word,
              initial?.audioFile ?? "vocabulary_pronunciation_us.mp3",
            ),
      examples: validExamples.map((example) => ({
        en: example.en.trim(),
        vi: example.vi.trim(),
      })),
      collocations,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col rounded-2xl bg-surface-container-lowest p-6">
        <DialogHeader className="shrink-0 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
              <Plus className="size-5" aria-hidden="true" />
            </span>
            <DialogTitle className="text-headline-sm font-bold text-on-surface">
              {mode === "add"
                ? `Thêm từ vựng mục ${String(nextIndex).padStart(2, "0")}`
                : `Chỉnh sửa từ vựng "${initial?.word ?? ""}"`}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ThinScroll className="flex-1 space-y-6 pr-2">
          <section className="space-y-4">
            <SectionTitle title="1. Thông tin cơ bản" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="vocab-word"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Từ vựng (Vocabulary Word) <RequiredMark />
                </label>
                <input
                  id="vocab-word"
                  type="text"
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                  placeholder="Ví dụ: beverage"
                  aria-invalid={wordError}
                  className={cn(FIELD_CLASS, wordError && "ring-2 ring-error")}
                />
                {wordError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập từ vựng.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="vocab-pos"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Từ loại (Part of Speech)
                </label>
                <select
                  id="vocab-pos"
                  value={pos}
                  onChange={(event) =>
                    setPos(event.target.value as VocabularyPos)
                  }
                  className={cn(FIELD_CLASS, "cursor-pointer")}
                >
                  {TOPIC_VOCAB_POS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="vocab-ipa"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Phiên âm IPA
                </label>
                <input
                  id="vocab-ipa"
                  type="text"
                  value={ipa}
                  onChange={(event) => setIpa(event.target.value)}
                  placeholder="/ˈbev.ər.ɪdʒ/"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label
                  htmlFor="vocab-vi"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Nghĩa tiếng Việt <RequiredMark />
                </label>
                <input
                  id="vocab-vi"
                  type="text"
                  value={meaningVi}
                  onChange={(event) => setMeaningVi(event.target.value)}
                  placeholder="Đồ uống, thức uống"
                  aria-invalid={meaningError}
                  className={cn(
                    FIELD_CLASS,
                    meaningError && "ring-2 ring-error",
                  )}
                />
                {meaningError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập nghĩa tiếng Việt.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <SectionTitle title="2. Audio phát âm (US)" hint="UI-only" />
            <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="vocab-audio"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-container-highest px-3 py-2 text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <Upload className="size-4" aria-hidden="true" />
                  Chọn file audio
                </label>
                <input
                  id="vocab-audio"
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(event) =>
                    setAudioName(event.target.files?.[0]?.name ?? "")
                  }
                />
                <span className="min-w-0 flex-1 truncate text-label-sm text-on-surface-variant">
                  {audioName.trim().length > 0
                    ? audioName
                    : "Chưa chọn file — sẽ dùng audio TTS tự động"}
                </span>
                {audioName.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAudioName("")}
                    aria-label="Xóa file audio đã chọn"
                    className="flex items-center rounded-full p-1 text-on-surface-variant transition-colors hover:text-error"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                <Mic className="size-4 shrink-0" aria-hidden="true" />
                Hệ thống sẽ tự động tổng hợp Audio chuẩn US khi để trống
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle
              title="3. Ví dụ trong ngữ cảnh"
              hint={`${examples.length}/${MAX_EXAMPLES} · tối thiểu 1 câu EN`}
            />
            <div className="space-y-3">
              {examples.map((example, index) => (
                <div
                  key={`vocab-example-${index}`}
                  className="space-y-2 rounded-lg bg-surface-container-low p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-sm font-semibold text-on-surface-variant">
                      Ví dụ {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      disabled={examples.length <= 1}
                      aria-label={`Xóa ví dụ ${index + 1}`}
                      className="flex items-center rounded-full p-1 text-on-surface-variant transition-colors hover:text-error disabled:opacity-40"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <textarea
                    id={`vocab-example-en-${index}`}
                    rows={2}
                    value={example.en}
                    onChange={(event) =>
                      updateExample(index, { en: event.target.value })
                    }
                    placeholder="Would you like to order any beverages before your meal?"
                    aria-invalid={examplesError && index === 0}
                    className={cn(
                      FIELD_CLASS,
                      "resize-none",
                      examplesError && index === 0 && "ring-2 ring-error",
                    )}
                  />
                  <input
                    id={`vocab-example-vi-${index}`}
                    type="text"
                    value={example.vi}
                    onChange={(event) =>
                      updateExample(index, { vi: event.target.value })
                    }
                    placeholder="Quý khách có muốn gọi đồ uống trước bữa ăn không?"
                    className={FIELD_CLASS}
                  />
                </div>
              ))}
            </div>
            {examplesError && (
              <p className="text-label-sm text-error">
                Vui lòng nhập ít nhất một câu ví dụ tiếng Anh.
              </p>
            )}
            <button
              type="button"
              onClick={addExample}
              disabled={examples.length >= MAX_EXAMPLES}
              className="inline-flex items-center gap-1 text-label-sm font-medium text-primary hover:underline disabled:opacity-40"
            >
              <PlusCircle className="size-4" aria-hidden="true" />
              Thêm ví dụ ({examples.length}/{MAX_EXAMPLES})
            </button>
          </section>

          <section className="space-y-2">
            <SectionTitle
              title="4. Cụm từ tự nhiên (Collocations)"
              hint={`${collocations.length}/${MAX_COLLOCATIONS} · Enter để thêm`}
            />
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-container-low p-3 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
              {collocations.map((phrase) => (
                <span
                  key={phrase}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1.5 text-label-sm font-medium text-on-surface"
                >
                  {phrase}
                  <button
                    type="button"
                    onClick={() => removeCollocation(phrase)}
                    aria-label={`Xóa cụm từ ${phrase}`}
                    className="flex items-center transition-colors hover:text-error"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={colloInput}
                onChange={(event) => setColloInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCollocation(colloInput);
                  }
                }}
                placeholder="+ Thêm cụm từ..."
                aria-label="Thêm cụm từ mới"
                disabled={collocations.length >= MAX_COLLOCATIONS}
                className="min-w-[140px] flex-1 border-none bg-transparent px-2 py-1 text-body-md text-on-surface outline-none placeholder:text-outline disabled:opacity-40"
              />
            </div>
          </section>
        </ThinScroll>

        <DialogFooter className="flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-primary font-semibold text-on-primary hover:bg-primary-container"
            >
              {mode === "add" ? "Lưu vào danh sách" : "Lưu thay đổi"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
