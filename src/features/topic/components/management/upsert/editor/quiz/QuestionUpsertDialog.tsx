import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
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
import {
  TOPIC_QUIZ_MAX_OPTIONS,
  TOPIC_QUIZ_TIPS_MAX,
  TOPIC_QUIZ_TYPE_OPTIONS,
} from "@features/topic/types/topic-create.types";
import type { QuizType } from "@features/topic/types/topic-create.types";
import type { QuizQuestionUpsert } from "@features/topic/hooks/useTopicItemQuizForm";

interface QuestionUpsertDialogProps {
  open: boolean;
  mode: "add" | "edit";
  presetType: QuizType;
  initial?: QuizQuestionUpsert;
  onClose: () => void;
  onSubmit: (draft: QuizQuestionUpsert) => void;
}

const FIELD_CLASS =
  "w-full rounded-lg bg-surface-container-low px-3 py-2 text-body-md text-on-surface shadow-xs transition-all outline-none placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary";

const OPTION_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

function parseWordBank(value: string): string[] {
  return [...new Set(value.split(",").map((word) => word.trim()))].filter(
    (word) => word.length > 0,
  );
}

export default function QuestionUpsertDialog({
  open,
  mode,
  presetType,
  initial,
  onClose,
  onSubmit,
}: QuestionUpsertDialogProps) {
  const [quizType, setQuizType] = useState<QuizType>(presetType);
  const [prompt, setPrompt] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [optionTexts, setOptionTexts] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanationOk, setExplanationOk] = useState("");
  const [explanationNg, setExplanationNg] = useState("");
  const [textEn, setTextEn] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [sentenceWithBlank, setSentenceWithBlank] = useState("");
  const [wordBankText, setWordBankText] = useState("");
  const [correctOption, setCorrectOption] = useState("");
  const [explanation, setExplanation] = useState("");
  const [tips, setTips] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setQuizType(initial.kind);
    } else {
      setQuizType(presetType);
    }
    if (initial?.kind === "SITUATIONAL_CHOICE") {
      setPrompt(initial.prompt);
      setAudioUrl(initial.audioUrl ?? "");
      setOptionTexts(
        initial.optionTexts.length >= 2 ? initial.optionTexts : ["", ""],
      );
      setCorrectIndex(initial.correctIndex);
      setExplanationOk(initial.explanationOk);
      setExplanationNg(initial.explanationNg);
    } else {
      setPrompt("");
      setAudioUrl("");
      setOptionTexts(["", ""]);
      setCorrectIndex(0);
      setExplanationOk("");
      setExplanationNg("");
    }
    if (initial?.kind === "FILL_BLANK") {
      setTextEn(initial.textEn);
      setMeaningVi(initial.meaningVi);
      setSentenceWithBlank(initial.sentenceWithBlank);
      setWordBankText(initial.wordBank.join(", "));
      setCorrectOption(initial.correctOption);
      setExplanation(initial.explanation ?? "");
      setTips(initial.tips);
    } else {
      setTextEn("");
      setMeaningVi("");
      setSentenceWithBlank("");
      setWordBankText("");
      setCorrectOption("");
      setExplanation("");
      setTips("");
    }
    setSubmitted(false);
  }, [open, initial, presetType]);

  const typeLocked = mode === "edit";
  const wordBank = parseWordBank(wordBankText);

  const promptError = submitted && prompt.trim().length === 0;
  const optionsError =
    submitted &&
    optionTexts.filter((text) => text.trim().length > 0).length < 2;
  const correctRowError =
    submitted &&
    quizType === "SITUATIONAL_CHOICE" &&
    (optionTexts[correctIndex]?.trim().length ?? 0) === 0;
  const explanationOkError = submitted && explanationOk.trim().length === 0;
  const explanationNgError = submitted && explanationNg.trim().length === 0;
  const textEnError = submitted && textEn.trim().length === 0;
  const meaningViError = submitted && meaningVi.trim().length === 0;
  const blankError = submitted && !sentenceWithBlank.includes("___");
  const bankError = submitted && wordBank.length < 2;
  const correctOptionError =
    submitted &&
    (correctOption.trim().length === 0 ||
      !wordBank.includes(correctOption.trim()));
  const tipsError = submitted && tips.trim().length > TOPIC_QUIZ_TIPS_MAX;

  const updateOptionText = (index: number, value: string) =>
    setOptionTexts((prev) => prev.map((text, i) => (i === index ? value : text)));

  const removeOptionRow = (index: number) => {
    if (optionTexts.length <= 2) return;
    setOptionTexts((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) => {
      if (prev === index) return 0;
      return prev > index ? prev - 1 : prev;
    });
  };

  const addOptionRow = () => {
    if (optionTexts.length >= TOPIC_QUIZ_MAX_OPTIONS) return;
    setOptionTexts((prev) => [...prev, ""]);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (quizType === "SITUATIONAL_CHOICE") {
      const entries = optionTexts
        .map((text, index) => ({ text: text.trim(), index }))
        .filter((entry) => entry.text.length > 0);
      const correctPos = entries.findIndex(
        (entry) => entry.index === correctIndex,
      );
      if (
        prompt.trim().length === 0 ||
        entries.length < 2 ||
        correctPos === -1 ||
        explanationOk.trim().length === 0 ||
        explanationNg.trim().length === 0
      ) {
        return;
      }
      onSubmit({
        kind: "SITUATIONAL_CHOICE",
        prompt: prompt.trim(),
        audioUrl: audioUrl.trim() ? audioUrl.trim() : null,
        optionTexts: entries.map((entry) => entry.text),
        correctIndex: correctPos,
        explanationOk: explanationOk.trim(),
        explanationNg: explanationNg.trim(),
      });
      return;
    }
    const bank = parseWordBank(wordBankText);
    const correct = correctOption.trim();
    if (
      textEn.trim().length === 0 ||
      meaningVi.trim().length === 0 ||
      !sentenceWithBlank.includes("___") ||
      bank.length < 2 ||
      correct.length === 0 ||
      !bank.includes(correct) ||
      tips.trim().length > TOPIC_QUIZ_TIPS_MAX
    ) {
      return;
    }
    onSubmit({
      kind: "FILL_BLANK",
      textEn: textEn.trim(),
      meaningVi: meaningVi.trim(),
      audioUrl: audioUrl.trim() ? audioUrl.trim() : null,
      sentenceWithBlank: sentenceWithBlank.trim(),
      wordBank: bank,
      correctOption: correct,
      explanation: explanation.trim() ? explanation.trim() : null,
      tips: tips.trim(),
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
              {mode === "add" ? "Thêm câu hỏi mới" : "Chỉnh sửa câu hỏi"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ThinScroll className="flex-1 space-y-6 pr-2">
          <section className="space-y-2">
            <SectionTitle
              title="1. Loại quiz"
              hint={
                typeLocked
                  ? "Bị khóa khi chỉnh sửa — đổi loại hãy xóa và tạo câu mới"
                  : "Chọn dạng cho câu hỏi này"
              }
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TOPIC_QUIZ_TYPE_OPTIONS.map((option) => {
                const active = quizType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={typeLocked}
                    onClick={() => setQuizType(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-label-lg transition-all",
                      active
                        ? "bg-primary font-semibold text-on-primary"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container-high",
                      typeLocked && !active && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {quizType === "SITUATIONAL_CHOICE" ? (
            <section className="space-y-4">
              <SectionTitle title="2. Tình huống & đáp án" />
              <div>
                <label
                  htmlFor="quiz-prompt"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Tình huống (prompt) <RequiredMark />
                </label>
                <textarea
                  id="quiz-prompt"
                  rows={2}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ví dụ: Bạn muốn nhờ bồi bàn gợi ý món đặc sắc nhất..."
                  aria-invalid={promptError}
                  className={cn(
                    FIELD_CLASS,
                    "resize-none",
                    promptError && "ring-2 ring-error",
                  )}
                />
                {promptError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập tình huống của câu hỏi.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-audio"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Audio URL
                </label>
                <input
                  id="quiz-audio"
                  type="text"
                  value={audioUrl}
                  onChange={(event) => setAudioUrl(event.target.value)}
                  placeholder="https://cdn.engolearn.vn/audio/quiz_sit_01.mp3"
                  className={FIELD_CLASS}
                />
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  UI-only · để trống vẫn lưu nháp được.
                </p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-label-sm font-semibold text-on-surface">
                    Các đáp án <RequiredMark />
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    Tích chọn 1 đáp án đúng
                  </span>
                </div>
                <div className="space-y-2">
                  {optionTexts.map((text, index) => (
                    <div key={`quiz-option-${index}`} className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-label-sm font-bold text-on-surface-variant">
                        {OPTION_LABELS[index] ?? index + 1}
                      </span>
                      <input
                        type="text"
                        value={text}
                        onChange={(event) =>
                          updateOptionText(index, event.target.value)
                        }
                        placeholder={`Đáp án ${OPTION_LABELS[index] ?? index + 1}`}
                        aria-label={`Nội dung đáp án ${OPTION_LABELS[index] ?? index + 1}`}
                        aria-invalid={optionsError}
                        className={cn(
                          FIELD_CLASS,
                          optionsError && "ring-2 ring-error",
                        )}
                      />
                      <label
                        className={cn(
                          "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
                          correctIndex === index
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-outline hover:bg-surface-container-high",
                        )}
                        title="Đặt làm đáp án đúng"
                      >
                        <input
                          type="radio"
                          name="quiz-correct-option"
                          checked={correctIndex === index}
                          onChange={() => setCorrectIndex(index)}
                          className="sr-only"
                        />
                        <span className="text-label-lg font-bold" aria-hidden="true">
                          ✓
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeOptionRow(index)}
                        disabled={optionTexts.length <= 2}
                        title="Xóa đáp án"
                        aria-label={`Xóa đáp án ${index + 1}`}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-outline transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                {optionsError ? (
                  <p className="mt-1 text-label-sm text-error">
                    Cần ít nhất 2 đáp án có nội dung.
                  </p>
                ) : correctRowError ? (
                  <p className="mt-1 text-label-sm text-error">
                    Đáp án được chọn làm đáp án đúng đang trống nội dung.
                  </p>
                ) : (
                  optionTexts.length < TOPIC_QUIZ_MAX_OPTIONS && (
                    <button
                      type="button"
                      onClick={addOptionRow}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1.5 text-label-sm font-semibold text-primary transition-colors hover:bg-surface-container-high"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Thêm đáp án
                    </button>
                  )
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-explanation-ok"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Giải thích khi đúng <RequiredMark />
                </label>
                <textarea
                  id="quiz-explanation-ok"
                  rows={2}
                  value={explanationOk}
                  onChange={(event) => setExplanationOk(event.target.value)}
                  placeholder="Chính xác! ..."
                  aria-invalid={explanationOkError}
                  className={cn(
                    FIELD_CLASS,
                    "resize-none",
                    explanationOkError && "ring-2 ring-error",
                  )}
                />
                {explanationOkError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập giải thích khi học viên trả lời đúng.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-explanation-ng"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Giải thích khi sai <RequiredMark />
                </label>
                <textarea
                  id="quiz-explanation-ng"
                  rows={2}
                  value={explanationNg}
                  onChange={(event) => setExplanationNg(event.target.value)}
                  placeholder="Chưa chính xác. ..."
                  aria-invalid={explanationNgError}
                  className={cn(
                    FIELD_CLASS,
                    "resize-none",
                    explanationNgError && "ring-2 ring-error",
                  )}
                />
                {explanationNgError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập giải thích khi học viên trả lời sai.
                  </p>
                )}
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <SectionTitle title="2. Câu & ngân hàng từ" />
              <div>
                <label
                  htmlFor="quiz-text-en"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Câu tiếng Anh đầy đủ <RequiredMark />
                </label>
                <input
                  id="quiz-text-en"
                  type="text"
                  value={textEn}
                  onChange={(event) => setTextEn(event.target.value)}
                  placeholder="Can you recommend a good local specialty?"
                  aria-invalid={textEnError}
                  className={cn(FIELD_CLASS, textEnError && "ring-2 ring-error")}
                />
                {textEnError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập câu tiếng Anh đầy đủ.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-meaning-vi"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Nghĩa tiếng Việt <RequiredMark />
                </label>
                <input
                  id="quiz-meaning-vi"
                  type="text"
                  value={meaningVi}
                  onChange={(event) => setMeaningVi(event.target.value)}
                  placeholder="Bạn có thể gợi ý một món đặc sản địa phương ngon không?"
                  aria-invalid={meaningViError}
                  className={cn(
                    FIELD_CLASS,
                    meaningViError && "ring-2 ring-error",
                  )}
                />
                {meaningViError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng nhập nghĩa tiếng Việt.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-blank"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Câu đục lỗ <RequiredMark />
                </label>
                <input
                  id="quiz-blank"
                  type="text"
                  value={sentenceWithBlank}
                  onChange={(event) => setSentenceWithBlank(event.target.value)}
                  placeholder="Can you ___ a good local specialty?"
                  aria-invalid={blankError}
                  className={cn(FIELD_CLASS, blankError && "ring-2 ring-error")}
                />
                {blankError ? (
                  <p className="mt-1 text-label-sm text-error">
                    Câu đục lỗ phải chứa ký hiệu ___ cho chỗ trống.
                  </p>
                ) : (
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    Dùng ___ (3 gạch dưới) để đánh dấu chỗ trống.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-wordbank"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Ngân hàng từ (cách nhau bằng dấu phẩy) <RequiredMark />
                </label>
                <input
                  id="quiz-wordbank"
                  type="text"
                  value={wordBankText}
                  onChange={(event) => setWordBankText(event.target.value)}
                  placeholder="order, recommend, bill, starter"
                  aria-invalid={bankError}
                  className={cn(FIELD_CLASS, bankError && "ring-2 ring-error")}
                />
                {bankError && (
                  <p className="mt-1 text-label-sm text-error">
                    Cần ít nhất 2 từ trong ngân hàng từ.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-correct"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Đáp án đúng <RequiredMark />
                </label>
                <select
                  id="quiz-correct"
                  value={correctOption}
                  onChange={(event) => setCorrectOption(event.target.value)}
                  aria-invalid={correctOptionError}
                  className={cn(FIELD_CLASS, "cursor-pointer")}
                >
                  <option value="">— Chọn từ ngân hàng từ —</option>
                  {wordBank.map((word) => (
                    <option key={word} value={word}>
                      {word}
                    </option>
                  ))}
                </select>
                {correctOptionError && (
                  <p className="mt-1 text-label-sm text-error">
                    Vui lòng chọn đáp án đúng trong ngân hàng từ.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="quiz-fb-audio"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Audio URL
                </label>
                <input
                  id="quiz-fb-audio"
                  type="text"
                  value={audioUrl}
                  onChange={(event) => setAudioUrl(event.target.value)}
                  placeholder="https://cdn.engolearn.vn/audio/quiz_fib_01.mp3"
                  className={FIELD_CLASS}
                />
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  UI-only · để trống vẫn lưu nháp được.
                </p>
              </div>
              <div>
                <label
                  htmlFor="quiz-fb-explanation"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Giải thích
                </label>
                <textarea
                  id="quiz-fb-explanation"
                  rows={2}
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                  placeholder="Vì sao đáp án này đúng..."
                  className={cn(FIELD_CLASS, "resize-none")}
                />
              </div>
              <div>
                <label
                  htmlFor="quiz-tips"
                  className="mb-1 block text-label-sm font-semibold text-on-surface"
                >
                  Mẹo dùng (tiếng Việt, tối đa {TOPIC_QUIZ_TIPS_MAX} ký tự)
                </label>
                <textarea
                  id="quiz-tips"
                  rows={2}
                  value={tips}
                  maxLength={TOPIC_QUIZ_TIPS_MAX}
                  onChange={(event) => setTips(event.target.value)}
                  placeholder="Giải thích cách dùng bằng tiếng Việt..."
                  aria-invalid={tipsError}
                  className={cn(
                    FIELD_CLASS,
                    "resize-none",
                    tipsError && "ring-2 ring-error",
                  )}
                />
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  {tips.trim().length}/{TOPIC_QUIZ_TIPS_MAX} ký tự.
                </p>
              </div>
            </section>
          )}
        </ThinScroll>

        <DialogFooter className="flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              <X className="size-4" aria-hidden="true" />
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
