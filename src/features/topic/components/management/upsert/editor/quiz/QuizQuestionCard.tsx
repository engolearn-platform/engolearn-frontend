import { X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useEffect, useState } from "react";
import type { QuizQuestionPresentation } from "@features/topic/utils/topic-quiz-presentation";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";
import FillBlankQuestionCard from "./FillBlankQuestionCard";
import SituationalQuestionCard from "./SituationalQuestionCard";

function QuizAudio({ value, label, onPreview }: { value: string; label: string; onPreview: () => void }) {
  const [failed, setFailed] = useState(false);
  const source = playableManagementMediaUrl(value);
  useEffect(() => setFailed(false), [source]);
  return <div className="grid min-w-0 gap-1">
    {source ? failed
      ? <span role="status" className="text-label-sm text-error">Không phát được âm thanh</span>
      : <audio key={source} controls preload="none" src={source} onPlay={onPreview} onError={() => setFailed(true)} onCanPlay={() => setFailed(false)} className="max-w-full" aria-label={label} />
      : <span className="text-label-sm text-on-surface-variant">{value ? "Tham chiếu âm thanh không hợp lệ" : "Chưa có âm thanh"}</span>}
  </div>;
}

function detailLabel(key: string) {
  const labels: Record<string, string> = { prompt: "Câu hỏi đã lưu", sentenceWithBlank: "Câu đục lỗ đã lưu", wordBank: "Ngân hàng từ đã lưu", scenarioVi: "Bối cảnh tiếng Việt", scenario_vi: "Bối cảnh tiếng Việt", blank_count: "Số chỗ trống", word_bank: "Ngân hàng từ", audioUrlSlow: "Âm thanh chậm", correct: "Đáp án lưu độc lập", options: "Lựa chọn đã lưu", quizData: "Nội dung quiz bổ trợ", answerData: "Dữ liệu đáp án bổ trợ", explanation: "Giải thích bổ trợ", explanationOk: "Giải thích khi đúng", explanationNg: "Giải thích khi sai", sentence: "Câu gốc", tips: "Mẹo", audioUrl: "Âm thanh" };
  return labels[key] ?? key;
}

function formatDetail(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export default function QuizQuestionCard({ question, onEdit, onDelete, onPreviewAudio, readOnly }: {
  question: QuizQuestionPresentation;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreviewAudio: () => void;
  readOnly: boolean;
}) {
  const label = question.kind === "FILL_BLANK" ? "Điền từ" : question.kind === "SITUATIONAL_CHOICE" ? "Tình huống" : "Chưa hỗ trợ";
  const answerConflict = question.correctness.status === "conflict";
  const details = Object.entries({ prompt: question.prompt, sentenceWithBlank: question.sentenceWithBlank, wordBank: question.wordBank, scenarioVi: question.scenarioVi, audioUrlSlow: question.audioUrlSlow ? "Đã lưu tham chiếu media" : null, ...question.details }).filter(([, value]) => value !== null && value !== undefined && value !== "");
  return <article data-testid="quiz-question" aria-label={`Câu ${question.index + 1}: ${label}`} className="space-y-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="rounded-md bg-surface-container-low px-2.5 py-1 text-label-sm font-semibold text-primary">Câu {question.index + 1} · {label}</h3>
      {(question.audioUrl || question.audioUrlSlow) && <div className="grid gap-2 sm:grid-cols-2">{question.audioUrl && <QuizAudio value={question.audioUrl} label="Phát audio quiz" onPreview={onPreviewAudio} />}{question.audioUrlSlow && <QuizAudio value={question.audioUrlSlow} label="Phát audio quiz chậm" onPreview={onPreviewAudio} />}</div>}
      {!readOnly && question.kind !== "UNSUPPORTED" && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={answerConflict}
            onClick={() => onEdit(question.id)} aria-label={`Chỉnh sửa câu hỏi ${question.index + 1}`}>
            Chỉnh sửa
          </Button>
          <Button type="button" variant="outline" onClick={() => onDelete(question.id)}
            aria-label={`Xóa câu hỏi ${question.index + 1}`}>
            <X className="mr-1 size-4" aria-hidden="true" />Xóa
          </Button>
        </div>
      )}
    </header>
    {!readOnly && answerConflict && <p className="text-body-sm text-on-surface-variant">Tạm khóa chỉnh sửa câu hỏi để giữ các nguồn đáp án đã lưu.</p>}
    {question.kind === "FILL_BLANK" ? <FillBlankQuestionCard question={question} />
      : question.kind === "SITUATIONAL_CHOICE" ? <SituationalQuestionCard question={question} />
        : <div className="space-y-2"><p className="text-body-md text-on-surface-variant">Bản xem trước cho câu hỏi này chưa được hỗ trợ. Dữ liệu gốc được giữ trong chi tiết.</p>{question.prompt && <p className="whitespace-pre-wrap text-body-md text-on-surface">{question.prompt}</p>}{question.scenarioVi && <p className="text-body-sm text-on-surface-variant">{question.scenarioVi}</p>}</div>}
    <details className="rounded-lg border border-outline-variant/50 px-3 py-2 text-label-sm text-on-surface-variant"><summary className="cursor-pointer font-medium text-on-surface">Chi tiết dữ liệu</summary><dl className="mt-3 grid gap-2">
      <div><dt className="font-medium">Trạng thái đáp án</dt><dd>{question.correctness.status === "resolved" ? "Đã xác định" : question.correctness.status === "conflict" ? "Mâu thuẫn" : "Chưa có"}</dd></div>
      {question.correctness.sources.length > 0 && <div><dt className="font-medium">Nguồn xác định</dt><dd>{question.correctness.sources.join(", ")}</dd></div>}
      {details.map(([key, value]) => <div key={key}><dt className="font-medium">{detailLabel(key)}</dt><dd className="break-words">{formatDetail(value)}</dd></div>)}
    </dl></details>
  </article>;
}
