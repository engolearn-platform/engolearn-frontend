import { useCallback, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { AssessmentAudio } from "@features/assessment/components/AssessmentAudio";
import { draftService } from "@features/assessment/services/draft.service";
import { unitLabels, type AssessmentDraft } from "@features/assessment/types/draft";

import { studioGroups } from "@features/assessment/utils/studio-groups";
import { studioAudioError } from "@features/assessment/utils/studio-audio-errors";

export function DraftPreview({ draft, onReview, onClose, filesByUnit }: {
  draft: AssessmentDraft;
  onReview?: () => void;
  filesByUnit?: ReadonlyMap<number, File>;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(false);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [visited, setVisited] = useState(new Set([0]));
  const groups = studioGroups(draft.units);
  const groupIndex = groups.findIndex(group => group.entries.some(entry => entry.index === index));
  const group = groups[groupIndex];
  const {unit, firstQuestion} = group.entries.find(entry => entry.index === index)!;
  const loadAudio = useCallback(async () => {
    const file = filesByUnit?.get(index);
    if (file) return {url: URL.createObjectURL(file), mimeType: "audio/wav"};
    try {
      return await draftService.previewAudio(draft, index);
    } catch (failure) {
      throw new Error(studioAudioError(failure, "Tải âm thanh xem thử cho phần " + (index + 1)));
    }
  }, [draft, index, filesByUnit]);

  function move(next: number) {
    setAnswers(false);
    setIndex(next);
    setVisited(previous => new Set(previous).add(next));
  }

  return <section className="space-y-4 rounded-xl border p-4">
    <h2 className="text-xl font-semibold">Xem thử {draft.name}</h2>
    <p className="font-semibold">Nhóm {groupIndex + 1}/{groups.length} · {group.label}</p>
    {group.entries.length > 1 && <div role="group" aria-label="Câu hỏi trong nhóm" className="flex flex-wrap gap-2">
      {group.entries.map(entry => <Button key={entry.index} type="button" size="sm"
        variant={entry.index === index ? "default" : "outline"} aria-pressed={entry.index === index}
        onClick={() => move(entry.index)}>Câu {entry.firstQuestion}</Button>)}
    </div>}
    <p>{unit.kind ? unitLabels[unit.kind] : ""}</p>
    {unit.passage && <p className="whitespace-pre-wrap">{unit.passage}</p>}
    {unit.kind?.startsWith("LISTENING") && <AssessmentAudio key={index} load={loadAudio} review />}
    {unit.questions.map((question, questionIndex) => <div key={questionIndex} className="space-y-2 border-t pt-3">
      <p className="font-semibold">Câu {firstQuestion + questionIndex}. {question.prompt}</p>
      <fieldset className="space-y-2">
        <legend className="sr-only">Chọn đáp án cho câu {firstQuestion + questionIndex}</legend>
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
    <p className="text-sm">Đã mở {draft.units.reduce((total, entry, unitIndex) =>
      total + (visited.has(unitIndex) ? entry.questions.length : 0), 0)} câu.</p>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={groupIndex === 0}
        onClick={() => move(groups[groupIndex - 1].entries[0].index)}>Nhóm trước</Button>
      <Button variant="outline" disabled={groupIndex + 1 >= groups.length}
        onClick={() => move(groups[groupIndex + 1].entries[0].index)}>Nhóm sau</Button>
      <Button variant="outline" onClick={() => setAnswers(!answers)}>{answers ? "Ẩn đáp án" : "Hiện đáp án và giải thích"}</Button>
      <Button variant="outline" onClick={onClose}>Đóng xem thử</Button>
      {onReview && <Button disabled={visited.size !== draft.units.length} onClick={onReview}>Xác nhận đã kiểm tra</Button>}
    </div>
  </section>;
}
