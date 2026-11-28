import { DraftSelect, DraftText } from "./DraftFields";
import type { DraftQuestion, DraftSkill } from "@features/assessment/types/draft";

export default function DraftQuestionEditor({question, skills, change, listening}: {
  question: DraftQuestion; skills: DraftSkill[]; change: (question: DraftQuestion) => void; listening: boolean;
}) {
  const set = (patch: Partial<DraftQuestion>) => change({...question, ...patch});
  const codes = [...new Set([...skills.map(s => s.code), question.skillCode].filter((s): s is string => !!s))];
  return <div className="grid gap-3">
    <DraftText label="Nội dung câu hỏi" long max={2000} value={question.prompt} onChange={prompt => set({prompt})}/>
    <div className="grid gap-3 sm:grid-cols-2">
      <DraftSelect label="Mức CEFR" value={question.level} onChange={level => set({level: level || null})}>
        {["A1","A2","B1","B2"].map(v => <option key={v}>{v}</option>)}</DraftSelect>
      <DraftSelect label="Kỹ năng được đo" value={question.skillCode} onChange={skillCode => set({skillCode: skillCode || null})}>
        {codes.map(v => <option key={v}>{v}</option>)}</DraftSelect>
      {["A","B","C","D"].map((label, i) => <DraftText key={label} label={"Lựa chọn " + label} max={600}
        value={question.options[i]} onChange={value => set({options: Array.from({length: 4}, (_, j) => j === i ? value : question.options[j] ?? "")})}/>)}
    </div>
    <DraftSelect label="Đáp án đúng" value={question.correctOption == null ? "" : String(question.correctOption)}
      onChange={value => set({correctOption: value === "" ? null : Number(value)})}>
      {["A","B","C","D"].map((label,i) => <option key={label} value={i}>{label}</option>)}</DraftSelect>
    <DraftText label="Giải thích" long max={2000} value={question.explanation} onChange={explanation => set({explanation})}/>
    {(listening || !!question.transcript) && <DraftText label="Bản chép lời" long max={4000} value={question.transcript}
      onChange={transcript => set({transcript})}/>}
  </div>;
}
