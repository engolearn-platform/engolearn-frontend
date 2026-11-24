import TopicMediaUpload from "@features/topic/components/management/upsert/TopicMediaUpload";
import { useEffect, useState } from "react";
import { Plus, PlusCircle, Trash2, X } from "lucide-react";
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
import type { TopicVocabularyItem, VocabularyPos } from "@features/topic/types/topic-create.types";
import { TOPIC_VOCAB_POS_OPTIONS } from "@features/topic/types/topic-create.types";
import type { TopicVocabularyResource } from "@features/topic/types/topic-management.types";
import type { TopicVocabularyAuthoringDraft } from "@features/topic/utils/topic-vocabulary-authoring.adapter";

interface VocabularyUpsertDialogProps {
  open: boolean;
  topicId: string;
  mode: "add" | "edit";
  nextIndex: number;
  initial?: Omit<TopicVocabularyItem, "pos"> & { pos: string };
  initialResource?: TopicVocabularyResource;
  onClose: () => void;
  onSubmit: (draft: TopicVocabularyAuthoringDraft) => void;
}

interface ExampleDraft {
  key: string;
  en: string;
  vi: string;
  audioUrl: string | null;
  isManual: boolean | null;
}

interface CollocationDraft {
  text: string;
  example: { en: string | null; vi: string | null } | null;
  descriptionVi: string | null;
}

const FIELD_CLASS =
  "w-full rounded-lg bg-surface-container-low px-3 py-2 text-body-md text-on-surface shadow-xs transition-all outline-none placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary";

const blankExample = (): ExampleDraft => ({ key: crypto.randomUUID(), en: "", vi: "", audioUrl: null, isManual: true });
const MAX_EXAMPLES = 3;
const MAX_COLLOCATIONS = 5;

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
  initialResource,
  topicId,
  onClose,
  onSubmit,
}: VocabularyUpsertDialogProps) {
  const [word, setWord] = useState("");
  const [pos, setPos] = useState<string>("");
  const [ipa, setIpa] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [audioName, setAudioName] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioEnUrl, setAudioEnUrl] = useState<string | null>(null);
  const [vocabId, setVocabId] = useState<string | null>(null);
  const [senseId, setSenseId] = useState<string | null>(null);
  const [sense, setSense] = useState<string | null>(null);
  const [examples, setExamples] = useState<ExampleDraft[]>(() => [blankExample()]);
  const [collocations, setCollocations] = useState<CollocationDraft[]>([]);
  const [colloInput, setColloInput] = useState("");
  const [quickSentence, setQuickSentence] = useState("");
  const [quickMeaning, setQuickMeaning] = useState("");
  const [quickExplanation, setQuickExplanation] = useState("");
  const [tips, setTips] = useState("");

  useEffect(() => {
    if (!open) return;
    setWord(initial?.word ?? "");
    setPos(initial?.pos ?? "");
    setIpa(initial?.ipa ?? "");
    setMeaningVi(initial?.meaningVi ?? "");
    setAudioName(initialResource?.snapshot?.audioUsUrl ?? "");
    setAudioUrl(initialResource?.snapshot?.audioUrl ?? null);
    setAudioEnUrl(initialResource?.snapshot?.audioEnUrl ?? null);
    setVocabId(initialResource?.vocabId ?? null);
    setSenseId(initialResource?.senseId ?? null);
    setSense(initialResource?.snapshot?.sense ?? null);
    setExamples(
      initialResource?.samples.length
        ? initialResource.samples.map((sample) => ({ key: crypto.randomUUID(), en: sample.textEn ?? "", vi: sample.textVi ?? "", audioUrl: sample.audioUrl, isManual: sample.isManual }))
        : [blankExample()],
    );
    setCollocations(initialResource?.collocations.map((entry) => ({ text: entry.text ?? "", example: entry.example ? { ...entry.example } : null, descriptionVi: entry.descriptionVi })) ?? []);
    setQuickSentence(initialResource?.quickCheck?.sentence?.textEn ?? "");
    setQuickMeaning(initialResource?.quickCheck?.sentence?.meaningVi ?? "");
    setQuickExplanation(initialResource?.quickCheck?.explanation ?? "");
    setTips(initialResource?.tips ?? "");
    setColloInput("");
  }, [open, initial, initialResource]);

  const wordError = false;
  const meaningError = false;
  const examplesError = false;

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
      prev.length >= MAX_EXAMPLES ? prev : [...prev, blankExample()],
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
      if (prev.some((entry) => entry.text.toLowerCase() === value.toLowerCase()))
        return prev;
      return [...prev, { text: value, example: null, descriptionVi: null }];
    });
    setColloInput("");
  };

  const removeCollocation = (index: number) =>
    setCollocations((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    onSubmit({
      vocabId,
      senseId,
      word,
      pos: pos as VocabularyPos,
      ipa: ipa.trim(),
      meaningVi: meaningVi.trim(),
      audioUrl,
      audioEnUrl,
      audioUsUrl: audioName.trim() || null,
      sense,
      samples: examples.map((example) => ({ textEn: example.en || null, textVi: example.vi || null, audioUrl: example.audioUrl, isManual: example.isManual })),
      collocations: collocations.map((entry) => ({ text: entry.text || null, example: entry.example ? { ...entry.example } : null, descriptionVi: entry.descriptionVi })),
      audioFile: audioName,
      examples: examples.map((example) => ({ en: example.en, vi: example.vi })),
      quickCheck: initialResource?.quickCheck || quickSentence || quickMeaning || quickExplanation
        ? {
            sentence: {
              textEn: quickSentence || null,
              meaningVi: quickMeaning || null,
              audioUrl: initialResource?.quickCheck?.sentence?.audioUrl ?? null,
              audioUrlSlow: initialResource?.quickCheck?.sentence?.audioUrlSlow ?? null,
              source: initialResource?.quickCheck?.sentence?.source ?? null,
              externalId: initialResource?.quickCheck?.sentence?.externalId ?? null,
            },
            quizData: initialResource?.quickCheck?.quizData ?? null,
            answerData: initialResource?.quickCheck?.answerData ?? null,
            explanation: quickExplanation || null,
          }
        : null,
      tips,
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
              <label className="text-label-sm font-semibold text-on-surface">Vocabulary ID<input aria-label="Vocabulary ID" value={vocabId ?? ""} onChange={(event) => setVocabId(event.target.value || null)} className={FIELD_CLASS} /></label>
              <label className="text-label-sm font-semibold text-on-surface">Sense ID<input aria-label="Sense ID" value={senseId ?? ""} onChange={(event) => setSenseId(event.target.value || null)} className={FIELD_CLASS} /></label>
              <label className="text-label-sm font-semibold text-on-surface">Sense<input aria-label="Sense" value={sense ?? ""} onChange={(event) => setSense(event.target.value || null)} className={FIELD_CLASS} /></label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="vocab-word"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Từ vựng (Vocabulary Word)
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
                  <option value="">Chưa chọn</option>
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
                  Nghĩa tiếng Việt
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
            <SectionTitle title="2. Tham chiếu audio phát âm (US)" />
            <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
              <label htmlFor="vocab-audio" className="text-label-sm font-semibold text-on-surface">URL audio</label>
              <input id="vocab-audio" type="url" value={audioName} onChange={(event) => setAudioName(event.target.value)} placeholder="https://…" className={FIELD_CLASS} />
              <TopicMediaUpload topicId={topicId} kind="audio" onUploaded={setAudioName} />
              <p className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                Giá trị được lưu như tham chiếu; tải lên media chưa được hỗ trợ ở đây.
              </p>
              <label htmlFor="vocab-audio-en" className="text-label-sm font-semibold text-on-surface">URL audio EN</label>
              <input id="vocab-audio-en" type="url" value={audioEnUrl ?? ""} onChange={(event) => setAudioEnUrl(event.target.value || null)} placeholder="https://…" className={FIELD_CLASS} />
              <TopicMediaUpload topicId={topicId} kind="audio" onUploaded={setAudioEnUrl} />
              <label htmlFor="vocab-audio-main" className="text-label-sm font-semibold text-on-surface">URL audio chung</label>
              <input id="vocab-audio-main" type="url" value={audioUrl ?? ""} onChange={(event) => setAudioUrl(event.target.value || null)} placeholder="https://…" className={FIELD_CLASS} />
              <TopicMediaUpload topicId={topicId} kind="audio" onUploaded={setAudioUrl} />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle title="5. Quick Check và ghi chú" />
            <textarea rows={2} value={quickSentence} onChange={(event) => setQuickSentence(event.target.value)} placeholder="Câu kiểm tra nhanh (EN)" className={cn(FIELD_CLASS, "resize-none")} />
            <input type="text" value={quickMeaning} onChange={(event) => setQuickMeaning(event.target.value)} placeholder="Nghĩa tiếng Việt" className={FIELD_CLASS} />
            <textarea rows={2} value={quickExplanation} onChange={(event) => setQuickExplanation(event.target.value)} placeholder="Giải thích" className={cn(FIELD_CLASS, "resize-none")} />
            <textarea rows={2} value={tips} onChange={(event) => setTips(event.target.value)} placeholder="Ghi chú cho người học" className={cn(FIELD_CLASS, "resize-none")} />
          </section>

          <section className="space-y-3">
            <SectionTitle title="3. Ví dụ trong ngữ cảnh" hint={`${examples.length}/${MAX_EXAMPLES}`} />
            <div className="space-y-3">
              {examples.map((example, index) => (
                <div
                  key={example.key}
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
                  <input aria-label={`Audio ví dụ ${index + 1}`} type="url" value={example.audioUrl ?? ""} onChange={(event) => updateExample(index, { audioUrl: event.target.value || null })} placeholder="URL audio ví dụ" className={FIELD_CLASS} />
              <TopicMediaUpload topicId={topicId} kind="audio" onUploaded={(audioUrl) => updateExample(index, { audioUrl })} />
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
              {collocations.map((entry, index) => (
                <span
                  key={`${index}-${entry.text}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-3 py-1.5 text-label-sm font-medium text-on-surface"
                >
                  <input aria-label={`Cụm từ ${index + 1}`} value={entry.text} onChange={(event) => setCollocations((prev) => prev.map((item, i) => i === index ? { ...item, text: event.target.value } : item))} className="w-32 bg-transparent outline-none" />
                  <input aria-label={`Ví dụ EN cụm từ ${index + 1}`} value={entry.example?.en ?? ""} onChange={(event) => setCollocations((prev) => prev.map((item, i) => i === index ? { ...item, example: { ...(item.example ?? { en: null, vi: null }), en: event.target.value || null } } : item))} placeholder="Ví dụ EN" className="w-32 bg-transparent outline-none" />
                  <input aria-label={`Ví dụ VI cụm từ ${index + 1}`} value={entry.example?.vi ?? ""} onChange={(event) => setCollocations((prev) => prev.map((item, i) => i === index ? { ...item, example: { ...(item.example ?? { en: null, vi: null }), vi: event.target.value || null } } : item))} placeholder="Ví dụ VI" className="w-32 bg-transparent outline-none" />
                  <input aria-label={`Mô tả cụm từ ${index + 1}`} value={entry.descriptionVi ?? ""} onChange={(event) => setCollocations((prev) => prev.map((item, i) => i === index ? { ...item, descriptionVi: event.target.value || null } : item))} placeholder="Mô tả" className="w-28 bg-transparent outline-none" />
                  <button
                    type="button"
                    onClick={() => removeCollocation(index)}
                    aria-label={`Xóa cụm từ ${entry.text}`}
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
