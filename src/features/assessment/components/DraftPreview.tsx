import { useCallback, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { AssessmentAudio } from "@features/assessment/components/AssessmentAudio";
import { draftService } from "@features/assessment/services/draft.service";
import { unitLabels, type AssessmentDraft } from "@features/assessment/types/draft";

export function DraftPreview({ draft, onReview, onClose }: {
  draft: AssessmentDraft;
  onReview: () => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(false);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [visited, setVisited] = useState(new Set([0]));
  const unit = draft.units[index];
  const loadAudio = useCallback(() => draftService.previewAudio(draft, index), [draft, index]);

  function move(next: number) {
    setAnswers(false);
    setIndex(next);
    setVisited(previous => new Set(previous).add(next));
  }

  return <section className="space-y-4 rounded-xl border p-4">
    <h2 className="text-xl font-semibold">Xem thử {draft.name}</h2>
    <p>Phần {index + 1}/{draft.units.length} · {unit.kind ? unitLabels[unit.kind] : ""}</p>
    {unit.passage && <p className="whitespace-pre-wrap">{unit.passage}</p>}
    {unit.kind?.startsWith("LISTENING") && <AssessmentAudio key={index} load={loadAudio} review />}
    {unit.questions.map((question, questionIndex) => <div key={questionIndex} className="space-y-2 border-t pt-3">
      <p className="font-semibold">{question.prompt}</p>
      <fieldset className="space-y-2">
        <legend className="sr-only">Chọn đáp án cho câu {questionIndex + 1}</legend>
        {question.options.map((option, optionIndex) => {
          const key = index + ":" + questionIndex;
          return <label key={optionIndex} className="flex items-start gap-2 rounded border p-2">
            <input type="radio" name={"preview-" + key} checked={selections[key] === optionIndex}
              onChange={() => setSelections(previous => ({...previous, [key]: optionIndex}))} />
            <span>{String.fromCharCode(65 + optionIndex)}. {option}</span>
          </label>;
        })}
      </fieldset>
      {answers && <div>
        <p>Đáp án {question.correctOption == null ? "" : String.fromCharCode(65 + question.correctOption)} · {question.level} · {question.skillCode}</p>
        <p>{question.explanation}</p>
        {question.transcript && <p className="whitespace-pre-wrap">{question.transcript}</p>}
      </div>}
    </div>)}
    <p className="text-sm">Đã mở {visited.size}/{draft.units.length} phần.</p>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={index === 0} onClick={() => move(index - 1)}>Phần trước</Button>
      <Button variant="outline" disabled={index + 1 >= draft.units.length} onClick={() => move(index + 1)}>Phần sau</Button>
      <Button variant="outline" onClick={() => setAnswers(!answers)}>{answers ? "Ẩn đáp án" : "Hiện đáp án và giải thích"}</Button>
      <Button variant="outline" onClick={onClose}>Đóng xem thử</Button>
      <Button disabled={visited.size !== draft.units.length} onClick={onReview}>Xác nhận đã kiểm tra</Button>
    </div>
  </section>;
}
