import { useEffect, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
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
import { TOPIC_EXPRESSION_TYPE_OPTIONS } from "@features/topic/types/topic-create.types";
import type {
  ExpressionPurposeOption,
  ExpressionVocabOption,
  ExpressionExampleUpsert,
} from "@features/topic/hooks/useTopicItemExpressionsForm";
import type { ExpressionExampleType } from "@features/topic/types/topic-create.types";

export interface ExpressionDialogInitial {
  purposeEn: string;
  purposeVi: string;
  type: ExpressionExampleType;
  textEn: string;
  textVi: string;
  usageNote: string;
  audioFile: string | null;
  linkedVocabIds: string[];
}

interface ExpressionUpsertDialogProps {
  open: boolean;
  mode: "add" | "edit";
  purposeOptions: ExpressionPurposeOption[];
  vocabOptions: ExpressionVocabOption[];
  lookupPurposeVi: (purposeEn: string) => string | null;
  initial?: ExpressionDialogInitial;
  onClose: () => void;
  onSubmit: (draft: ExpressionExampleUpsert) => void;
}

const FIELD_CLASS =
  "w-full rounded-lg bg-surface-container-low px-3 py-2 text-body-md text-on-surface shadow-xs transition-all outline-none placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary";

function RequiredMark() {
  return (
    <span className="text-error" aria-hidden="true">
      *
    </span>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
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

export default function ExpressionUpsertDialog({
  open,
  mode,
  purposeOptions,
  vocabOptions,
  lookupPurposeVi,
  initial,
  onClose,
  onSubmit,
}: ExpressionUpsertDialogProps) {
  const [purposeEn, setPurposeEn] = useState("");
  const [purposeVi, setPurposeVi] = useState("");
  const [lastAutoVi, setLastAutoVi] = useState("");
  const [type, setType] = useState<ExpressionExampleType>("BASIC_SUGGESTION");
  const [textEn, setTextEn] = useState("");
  const [textVi, setTextVi] = useState("");
  const [usageNote, setUsageNote] = useState("");
  const [audioName, setAudioName] = useState<string | null>(null);
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPurposeEn(initial?.purposeEn ?? "");
    setPurposeVi(initial?.purposeVi ?? "");
    setLastAutoVi("");
    setType(initial?.type ?? "BASIC_SUGGESTION");
    setTextEn(initial?.textEn ?? "");
    setTextVi(initial?.textVi ?? "");
    setUsageNote(initial?.usageNote ?? "");
    setAudioName(initial?.audioFile ?? null);
    setLinkedIds(initial?.linkedVocabIds ?? []);
    setSubmitted(false);
  }, [open, initial]);

  const handlePurposeEnChange = (value: string) => {
    setPurposeEn(value);
    const mapped = lookupPurposeVi(value);
    if (mapped && (purposeVi.trim().length === 0 || purposeVi === lastAutoVi)) {
      setPurposeVi(mapped);
      setLastAutoVi(mapped);
    }
  };

  const toggleLinkedId = (id: string) =>
    setLinkedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );

  const purposeEnError = submitted && purposeEn.trim().length === 0;
  const purposeViError = submitted && purposeVi.trim().length === 0;
  const textEnError = submitted && textEn.trim().length === 0;
  const textViError = submitted && textVi.trim().length === 0;

  const handleSubmit = () => {
    setSubmitted(true);
    if (
      purposeEn.trim().length === 0 ||
      purposeVi.trim().length === 0 ||
      textEn.trim().length === 0 ||
      textVi.trim().length === 0
    ) {
      return;
    }
    onSubmit({
      purposeEn: purposeEn.trim(),
      purposeVi: purposeVi.trim(),
      type,
      textEn: textEn.trim(),
      textVi: textVi.trim(),
      usageNote: usageNote.trim(),
      audioFile: audioName,
      linkedVocabIds: linkedIds,
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
              {mode === "add" ? "Thêm mẫu câu mới" : "Chỉnh sửa mẫu câu"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ThinScroll className="flex-1 space-y-6 pr-2">
          <section className="space-y-4">
            <SectionTitle
              title="1. Nhóm mục đích (local)"
              hint="Nhập mới hoặc chọn nhóm đã thêm"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="expr-purpose-en"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Purpose EN <RequiredMark />
                </label>
                <input
                  id="expr-purpose-en"
                  type="text"
                  list="expr-purpose-en-options"
                  value={purposeEn}
                  onChange={(event) =>
                    handlePurposeEnChange(event.target.value)
                  }
                  placeholder="Asking for recommendations"
                  aria-invalid={purposeEnError}
                  className={cn(
                    FIELD_CLASS,
                    purposeEnError && "ring-2 ring-error",
                  )}
                />
                <datalist id="expr-purpose-en-options">
                  {purposeOptions.map((option) => (
                    <option key={option.en} value={option.en}>
                      {option.vi}
                    </option>
                  ))}
                </datalist>
                {purposeEnError ? (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập mục đích tiếng Anh.
                  </p>
                ) : (
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    Gõ để tìm nhóm đã thêm; trùng EN sẽ tự điền VI.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="expr-purpose-vi"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Purpose VI <RequiredMark />
                </label>
                <input
                  id="expr-purpose-vi"
                  type="text"
                  value={purposeVi}
                  onChange={(event) => {
                    setPurposeVi(event.target.value);
                    setLastAutoVi("");
                  }}
                  placeholder="Hỏi gợi ý món ăn"
                  aria-invalid={purposeViError}
                  className={cn(
                    FIELD_CLASS,
                    purposeViError && "ring-2 ring-error",
                  )}
                />
                {purposeViError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập mục đích tiếng Việt.
                  </p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="expr-type"
                className="mb-1 block text-label-sm font-semibold text-on-surface"
              >
                Loại mẫu câu <RequiredMark />
              </label>
              <select
                id="expr-type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as ExpressionExampleType)
                }
                className={cn(FIELD_CLASS, "cursor-pointer")}
              >
                {TOPIC_EXPRESSION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle title="2. Nội dung mẫu câu" />
            <div>
              <label
                htmlFor="expr-text-en"
                className="mb-1 block text-label-sm font-semibold text-on-surface"
              >
                Mẫu câu tiếng Anh <RequiredMark />
              </label>
              <input
                id="expr-text-en"
                type="text"
                value={textEn}
                onChange={(event) => setTextEn(event.target.value)}
                placeholder='Ví dụ: "I will go with [món ăn]"'
                aria-invalid={textEnError}
                className={cn(FIELD_CLASS, textEnError && "ring-2 ring-error")}
              />
              {textEnError ? (
                <p className="mt-1 text-label-sm text-error">
                  Vui lòng nhập mẫu câu tiếng Anh.
                </p>
              ) : (
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  Dùng dấu ngoặc vuông [...] để tạo chỗ trống linh hoạt.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="expr-text-vi"
                className="mb-1 block text-label-sm font-semibold text-on-surface"
              >
                Bản dịch tiếng Việt <RequiredMark />
              </label>
              <input
                id="expr-text-vi"
                type="text"
                value={textVi}
                onChange={(event) => setTextVi(event.target.value)}
                placeholder="Ví dụ: Tôi sẽ chọn món..."
                aria-invalid={textViError}
                className={cn(FIELD_CLASS, textViError && "ring-2 ring-error")}
              />
              {textViError && (
                <p className="mt-1 text-label-sm text-error">
                  Vui lòng nhập bản dịch tiếng Việt.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="expr-usage"
                className="mb-1 block text-label-sm font-semibold text-on-surface"
              >
                Hướng dẫn ngữ cảnh (usage note)
              </label>
              <textarea
                id="expr-usage"
                rows={2}
                value={usageNote}
                onChange={(event) => setUsageNote(event.target.value)}
                placeholder="Ghi chú hoàn cảnh dùng câu này..."
                className={cn(FIELD_CLASS, "resize-none")}
              />
            </div>
          </section>

          <section className="space-y-2">
            <SectionTitle title="3. Audio phát âm" hint="UI-only · để trống vẫn lưu" />
            <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="expr-audio"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-container-highest px-3 py-2 text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <Upload className="size-4" aria-hidden="true" />
                  Chọn file audio
                </label>
                <input
                  id="expr-audio"
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(event) =>
                    setAudioName(event.target.files?.[0]?.name ?? null)
                  }
                />
                <span className="min-w-0 flex-1 truncate text-label-sm text-on-surface-variant">
                  {audioName ?? "Chưa gắn audio — vẫn lưu nháp được"}
                </span>
                {audioName && (
                  <button
                    type="button"
                    onClick={() => setAudioName(null)}
                    aria-label="Xóa file audio đã chọn"
                    className="flex items-center rounded-full p-1 text-on-surface-variant transition-colors hover:text-error"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <SectionTitle
              title="4. Từ vựng liên kết"
              hint={`${linkedIds.length} đã chọn · từ step vocabulary`}
            />
            {vocabOptions.length === 0 ? (
              <p className="rounded-lg bg-surface-container-low p-3 text-label-sm text-on-surface-variant">
                Chưa có từ vựng ở step trước để liên kết.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 rounded-lg bg-surface-container-low p-3">
                {vocabOptions.map((option) => {
                  const checked = linkedIds.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-label-sm font-medium transition-colors",
                        checked
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLinkedId(option.id)}
                        className="sr-only"
                      />
                      {option.word}
                    </label>
                  );
                })}
              </div>
            )}
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
              {mode === "add" ? "Lưu vào bản nháp" : "Lưu thay đổi"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
