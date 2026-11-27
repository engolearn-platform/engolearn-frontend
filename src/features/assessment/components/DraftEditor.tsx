import { useEffect, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { draftService } from "@features/assessment/services/draft.service";
import { unitLabels, type AssessmentDraft, type DraftSkill, type DraftUnit, type DraftQuestion } from "@features/assessment/types/draft";
import { useFetch } from "@shared/hooks/useFetch";
import type { HttpError } from "@shared/services/http.service";
import { DraftSelect, DraftText } from "./DraftFields";
import DraftQuestionEditor from "./DraftQuestionEditor";
import { DraftPreview } from "./DraftPreview";

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
  const [preview, setPreview] = useState<AssessmentDraft | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const dirty = draft !== saved;
  const catalog = useFetch(draftService.skillCatalog);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (patch: Partial<AssessmentDraft>) => { setDraft({...draft, ...patch}); setPreview(null); setReviewed(false); setMessage(""); };
  const changeUnit = (i: number, unit: DraftUnit) => change({units: replacing(draft.units, i, unit)});
  const changeSkill = (i: number, patch: Partial<DraftSkill>) => change({skills: replacing(draft.skills,i,{...draft.skills[i], ...patch})});
  const mayDiscard = () => !dirty || window.confirm("Bỏ các chỉnh sửa chưa lưu?");
  async function persist(reload: boolean) {
    if (reload && !mayDiscard()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = reload ? await draftService.open(draft.series) : await draftService.save(draft);
      setSaved(result); setDraft(result); setPreview(null); setReviewed(false); setConflict(false); setMessage(reload ? "Đã tải bản mới nhất." : "Đã lưu bản nháp.");
    } catch (cause) {
      const failure = cause as HttpError;
      setConflict(failure.code === "STALE_DRAFT" || conflict);
      setError([failure.message, ...(failure.fieldErrors ?? []).map(f => f.field + " — " + f.message)].join("\n"));
    } finally { setBusy(false); }
  }

  async function handle(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try {
      await action();
    } catch (cause) {
      const failure = cause as HttpError;
      if (failure.code === "STALE_DRAFT") {
        setConflict(true); setPreview(null); setReviewed(false);
      }
      setError(failure.message);
    } finally { setBusy(false); }
  }

  function upload(index: number, unit: DraftUnit, file?: File) {
    if (!file) return;
    void handle(async () => {
      const audioSha256 = await draftService.upload(file);
      changeUnit(index, { ...unit, sourceAudioUnit: null, audioSha256 });
      setMessage("Đã tải WAV. Lưu nháp để gắn vào phần này.");
    });
  }

  return <fieldset disabled={busy} className="min-w-0 space-y-5">
    <Button variant="outline" onClick={() => { if (mayDiscard()) close(); }}>Về danh sách</Button>
    <h1 className="text-2xl font-bold">{draft.series} · Nháp v{draft.version}</h1>
    <DraftText label="Tên bộ đề" max={180} value={draft.name} onChange={name => change({name})}/>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Kỹ năng của đề</h2>
      {catalog.loading && <p role="status">Đang tải danh mục kỹ năng…</p>}
      {catalog.error && <div>
        <p role="alert">{catalog.error.message}</p>
        <Button variant="outline" onClick={() => void catalog.refetch()}>Tải lại danh mục kỹ năng</Button>
      </div>}
      {draft.skills.map((s,i) => <fieldset key={i} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <legend>Kỹ năng {i+1}</legend>
        <DraftSelect label="Kỹ năng" value={s.code} onChange={code => {
          const option = catalog.data?.find(item => item.code === code);
          changeSkill(i, {code: option?.code ?? null, name: option?.label ?? null, section: option?.section ?? null});
        }}>
          {s.code && !catalog.data?.some(option => option.code === s.code) &&
            <option value={s.code}>{s.code} · {s.name}</option>}
          {catalog.data?.map(option => <option key={option.code} value={option.code}>
            {option.code} · {option.label}
          </option>)}
        </DraftSelect>
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
        {u.kind?.startsWith("LISTENING") && <div className="space-y-2">
          <label className="block">Tải WAV cho phần {i + 1}
            <input className="block max-w-full" type="file" accept=".wav,audio/wav"
              onChange={e => { upload(i, u, e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} />
          </label>
          {u.audioSha256 && <p className="text-sm">Đã chọn audio tải lên.</p>}
          {(u.audioSha256 || u.sourceAudioUnit != null) && <Button variant="outline"
            onClick={() => changeUnit(i, { ...u, sourceAudioUnit: null, audioSha256: null })}>Bỏ audio khỏi phần này</Button>}
        </div>}
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
    {preview && <DraftPreview key={preview.revision} draft={preview} onClose={() => setPreview(null)}
      onReview={() => void handle(async () => {
        await draftService.review(preview);
        setReviewed(true);
        setPreview(null);
        setMessage("Đã xác nhận kiểm tra phiên bản này.");
      })} />}
    <div className="sticky bottom-0 space-y-2 border-t bg-background py-3">
      {error && <p role="alert" className="whitespace-pre-line text-destructive">{error}</p>}
      <p role="status">{message || (dirty ? "Có thay đổi chưa lưu." : "")}</p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={!dirty || conflict} onClick={() => void persist(false)}>Lưu nháp</Button>
        <Button variant="outline" disabled={dirty || conflict}
          onClick={() => void handle(async () => setPreview(await draftService.preview(saved)))}>Kiểm tra và xem thử</Button>
        <Button disabled={dirty || conflict || !reviewed} onClick={() => {
          if (window.confirm("Xuất bản phiên bản này cho lượt mới?"))
            void handle(async () => { await draftService.publish(saved); close(); });
        }}>Xuất bản</Button>
        <Button variant="outline" disabled={dirty || conflict} onClick={() => {
          if (window.confirm("Xóa bản nháp? Các lượt đã cấp sẽ được giữ nguyên."))
            void handle(async () => { await draftService.remove(saved); close(); });
        }}>Xóa bản nháp</Button>
        {conflict && <Button variant="outline" onClick={() => void persist(true)}>Tải lại bản trên máy chủ</Button>}
      </div>
    </div>
  </fieldset>;
}
