import { useEffect, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { draftService } from "@features/assessment/services/draft.service";
import { unitLabels, type AssessmentDraft, type DraftSkill, type DraftUnit, type DraftQuestion } from "@features/assessment/types/draft";
import type { HttpError } from "@shared/services/http.service";
import { DraftSelect, DraftText } from "./DraftFields";
import DraftQuestionEditor from "./DraftQuestionEditor";

function replacing<T>(items: T[], at: number, value: T) { return items.map((old,i) => i === at ? value : old); }
function newQuestion(): DraftQuestion {
  return {prompt: "", options: ["","","",""], correctOption: null, skillCode: null, level: null, explanation: "", transcript: ""};
}

export default function DraftEditor({initial, close}: {initial: AssessmentDraft; close: () => void}) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const dirty = draft !== saved;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (patch: Partial<AssessmentDraft>) => { setDraft({...draft, ...patch}); setMessage(""); };
  const changeUnit = (i: number, unit: DraftUnit) => change({units: replacing(draft.units, i, unit)});
  const changeSkill = (i: number, patch: Partial<DraftSkill>) => change({skills: replacing(draft.skills,i,{...draft.skills[i], ...patch})});
  const mayDiscard = () => !dirty || window.confirm("Bỏ các chỉnh sửa chưa lưu?");
  async function persist(reload: boolean) {
    if (reload && !mayDiscard()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = reload ? await draftService.open(draft.series) : await draftService.save(draft);
      setSaved(result); setDraft(result); setConflict(false); setMessage(reload ? "Đã tải bản mới nhất." : "Đã lưu bản nháp.");
    } catch (cause) {
      const failure = cause as HttpError;
      setConflict(failure.code === "STALE_DRAFT" || conflict);
      setError([failure.message, ...(failure.fieldErrors ?? []).map(f => f.field + " — " + f.message)].join("\n"));
    } finally { setBusy(false); }
  }

  return <fieldset disabled={busy} className="min-w-0 space-y-5">
    <Button variant="outline" onClick={() => { if (mayDiscard()) close(); }}>Về danh sách</Button>
    <h1 className="text-2xl font-bold">{draft.series} · Nháp v{draft.version}</h1>
    <DraftText label="Tên bộ đề" max={180} value={draft.name} onChange={name => change({name})}/>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Kỹ năng của đề</h2>
      {draft.skills.map((s,i) => <fieldset key={i} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <legend>Kỹ năng {i+1}</legend>
        <DraftText label="Mã kỹ năng" value={s.code} max={32} onChange={code => changeSkill(i,{code})}/>
        <DraftText label="Tên kỹ năng" value={s.name} max={180} onChange={name => changeSkill(i,{name})}/>
        <DraftSelect label="Phần thi" value={s.section} onChange={v => changeSkill(i,{section: v as DraftSkill["section"] || null})}>
          <option value="LISTENING">Nghe</option><option value="READING">Đọc</option></DraftSelect>
        <DraftText label="Ví dụ" value={s.example} max={1000} onChange={example => changeSkill(i,{example})}/>
        <Button variant="outline" onClick={() => change({skills: draft.skills.filter((_,n) => n !== i)})}>Bỏ kỹ năng {i+1}</Button>
      </fieldset>)}
      <Button variant="outline" disabled={draft.skills.length >= 10}
        onClick={() => change({skills: [...draft.skills,{code:"",name:"",example:"",section:null}]})}>Thêm kỹ năng</Button>
    </section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Nội dung đề</h2>
      {draft.units.map((u,i) => <details key={i} className="space-y-3 rounded-xl border p-4">
        <summary className="cursor-pointer font-semibold">Phần {i+1} · {u.kind ? unitLabels[u.kind] : "Chưa chọn loại"} · {u.questions.length} câu</summary>
        <DraftSelect label="Loại nội dung" value={u.kind} onChange={v => changeUnit(i,{...u,kind: v as DraftUnit["kind"] || null})}>
          {Object.entries(unitLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</DraftSelect>
        <DraftText label="Đoạn dùng chung" long max={12000} value={u.passage} onChange={passage => changeUnit(i,{...u,passage})}/>
        {u.sourceAudioUnit != null && <p>Giữ audio từ phần {u.sourceAudioUnit+1} của đề nguồn.</p>}
        {u.questions.map((q,j) => <fieldset key={j} className="space-y-2 border-t py-3">
          <legend className="font-semibold">Câu {j+1} trong phần {i+1}</legend>
          <DraftQuestionEditor question={q} skills={draft.skills} listening={!!u.kind?.startsWith("LISTENING")}
            change={value => changeUnit(i,{...u,questions: replacing(u.questions,j,value)})}/>
          <Button variant="outline" onClick={() => { if (window.confirm("Bỏ câu này khỏi bản nháp?"))
            changeUnit(i,{...u,questions:u.questions.filter((_,n) => n !== j)}); }}>Bỏ câu {j+1}</Button>
        </fieldset>)}
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={u.questions.length >= 8}
          onClick={() => changeUnit(i,{...u,questions:[...u.questions, newQuestion()]})}>Thêm câu</Button>
          <Button variant="outline" onClick={() => {
            if (!u.questions.length || window.confirm("Xóa phần " + (i+1) + " và toàn bộ " + u.questions.length + " câu trong phần này?"))
              change({units: draft.units.filter((_,n) => n !== i)});
          }}>Bỏ phần {i+1}</Button></div>
      </details>)}
      <Button variant="outline" disabled={draft.units.length >= 30} onClick={() => change({units:[...draft.units,
        {kind:null,passage:"",sourceAudioUnit:null,questions:[]}]})}>Thêm phần</Button>
    </section>
    <div className="sticky bottom-0 space-y-2 border-t bg-background py-3">
      {error && <p role="alert" className="whitespace-pre-line text-destructive">{error}</p>}
      <p role="status">{message || (dirty ? "Có thay đổi chưa lưu." : "")}</p>
      <div className="flex gap-3"><Button disabled={!dirty || conflict} onClick={() => void persist(false)}>Lưu nháp</Button>
      {conflict && <Button variant="outline" onClick={() => void persist(true)}>Tải lại bản trên máy chủ</Button>}</div>
    </div>
  </fieldset>;
}
