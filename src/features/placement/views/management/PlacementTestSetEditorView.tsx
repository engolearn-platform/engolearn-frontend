import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import { MANAGEMENT_PATHS, MANAGEMENT_SET_LABEL, MANAGEMENT_SKILLS, MANAGEMENT_SKILL_LABEL } from "@features/placement/constants/placement-management";
import { getSetIssues } from "@features/placement/utils/placement-management";
import type { ManagementTestSet, PlacementSection } from "@features/placement/types/placement-management.types";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementConfirm, ManagementEmpty, ManagementField, ManagementHeader, ManagementMissing, managementInputClass } from "@features/placement/components/management/PlacementManagementUi";
import QuestionContent from "@features/placement/components/management/PlacementManagementQuestionContent";
import PlacementSetBlueprint from "@features/placement/components/management/sets/PlacementSetBlueprint";
import PlacementSetPickerDialog from "@features/placement/components/management/sets/PlacementSetPickerDialog";

export default function PlacementTestSetEditorView() {
  const { setId } = useParams();
  const { state } = usePlacementManagement();
  const set = state.testSets.find(item => item.id === setId);
  if (!set) return <ManagementMissing backTo={MANAGEMENT_PATHS.sets} />;
  return <PlacementSetEditor key={set.id} set={set} />;
}

function PlacementSetEditor({ set }: { set: ManagementTestSet }) {
  const { state, service, busy, run } = usePlacementManagement();
  const navigate = useNavigate();
  const alive = useRef(true);
  const pending = useRef(false);
  const [name, setName] = useState(set.name);
  const [ids, setIds] = useState([...set.questionIds]);
  const [saved, setSaved] = useState({ name: set.name, ids: [...set.questionIds] });
  const [baseSet, setBaseSet] = useState(set);
  const [skill, setSkill] = useState<PlacementSection>("READING");
  const [picker, setPicker] = useState<PlacementSection | null>(null);
  const [confirm, setConfirm] = useState<"publish" | "leave" | null>(null);
  const leaveTo = useRef<string>(MANAGEMENT_PATHS.sets);
  const dirty = name !== saved.name || ids.join("\u0000") !== saved.ids.join("\u0000");
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const confirmLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.download || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      event.preventDefault();
      if (!busy && !pending.current) {
        leaveTo.current = destination.pathname + destination.search + destination.hash;
        setConfirm("leave");
      }
    };
    window.addEventListener("beforeunload", prevent);
    document.addEventListener("click", confirmLink, true);
    return () => {
      window.removeEventListener("beforeunload", prevent);
      document.removeEventListener("click", confirmLink, true);
    };
  }, [dirty, busy]);
  const readonly = set.status !== "DRAFT" || set.lockedSeed;
  const questions = ids.flatMap(id => { const question = state.questions.find(item => item.id === id); return question ? [question] : []; });
  const issues = getSetIssues(name, ids, state.questions);
  const missingIds = ids.filter(id => !state.questions.some(question => question.id === id));
  const save = async (next: "stay" | "preview" | "publish") => {
    if (busy || pending.current || readonly || (next === "publish" && issues.length > 0) || !name.trim()) return;
    pending.current = true;
    const submitted = { name: name.trim(), ids: [...ids] };
    const result = await run(async () => {
      if (next === "publish") {
        await service.publishSet(baseSet, submitted.name, submitted.ids);
        return true;
      }
      return service.saveSet(baseSet, submitted.name, submitted.ids);
    }, next === "publish" ? "Đã xuất bản bộ đề." : "Đã lưu bản nháp.");
    pending.current = false;
    if (result === null || !alive.current) return;
    if (typeof result !== "boolean") setBaseSet(result);
    setSaved(submitted);
    setName(submitted.name);
    setConfirm(null);
    if (next !== "stay") navigate(MANAGEMENT_PATHS.previewSet(set.id));
  };
  const newVersion = async () => {
    if (busy || pending.current) return;
    pending.current = true;
    const result = await run(() => service.newVersion(set.id), "Đã tạo phiên bản mới.");
    pending.current = false;
    if (result && alive.current) navigate(MANAGEMENT_PATHS.editSet(result.id));
  };
  const move = (id: string, delta: number) => {
    if (busy || readonly) return;
    const sectionIds = ids.filter(questionId => state.questions.find(question => question.id === questionId)?.skill === skill);
    const index = sectionIds.indexOf(id);
    const neighbor = sectionIds[index + delta];
    if (!neighbor) return;
    setIds(current => { const reordered = [...current]; const a = reordered.indexOf(id); const b = reordered.indexOf(neighbor); if (a >= 0 && b >= 0) [reordered[a], reordered[b]] = [reordered[b], reordered[a]]; return reordered; });
  };
  if (readonly) return <><ManagementHeader title={set.name} description={`${set.code} · v${set.version}`}><ManagementButton variant="outline" onClick={() => navigate(MANAGEMENT_PATHS.sets)}>← Bộ đề</ManagementButton><ManagementButton disabled={busy} onClick={() => void newVersion()}>Tạo phiên bản mới</ManagementButton></ManagementHeader><ManagementCard><ManagementBadge>{MANAGEMENT_SET_LABEL[set.status]}</ManagementBadge><p className="my-4">Phiên bản này chỉ được xem. Tạo phiên bản mới để chỉnh sửa nội dung.</p><ManagementButton variant="outline" onClick={() => navigate(MANAGEMENT_PATHS.previewSet(set.id))}>Xem bản chụp phiên bản</ManagementButton></ManagementCard></>;
  const sectionQuestions = questions.filter(question => question.skill === skill);
  return <><ManagementHeader title={set.code} description={`Bản nháp · Phiên bản ${set.version} · 20 câu · 15 phút`}><ManagementButton variant="outline" disabled={busy} onClick={() => { leaveTo.current = MANAGEMENT_PATHS.sets; if (dirty) setConfirm("leave"); else navigate(leaveTo.current); }}>← Bộ đề</ManagementButton><ManagementButton variant="outline" disabled={busy || !name.trim()} onClick={() => void save("preview")}>Lưu và xem trước</ManagementButton></ManagementHeader><div className="grid items-start gap-5 xl:grid-cols-3"><div className="min-w-0 space-y-5 xl:col-span-2"><ManagementCard><div className="grid gap-4 sm:grid-cols-2"><ManagementField label="Tên bộ đề *"><input className={managementInputClass} value={name} maxLength={160} disabled={busy} onChange={event => setName(event.target.value)} /></ManagementField><ManagementField label="Mã bộ đề" hint={`Phiên bản ${set.version} · Chỉ lưu khi bấm Lưu bản nháp.`}><input className={managementInputClass} value={set.code} disabled /></ManagementField></div></ManagementCard><div className="flex flex-wrap gap-2" role="group" aria-label="Kỹ năng">{MANAGEMENT_SKILLS.map(item => <ManagementButton key={item} aria-pressed={skill === item} variant={skill === item ? "default" : "outline"} onClick={() => setSkill(item)}>{MANAGEMENT_SKILL_LABEL[item]} {questions.filter(question => question.skill === item).length}/{item === "READING" ? 14 : 6}</ManagementButton>)}</div>{sectionQuestions.map((question, index) => <ManagementCard key={question.id}><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-label-sm font-semibold text-primary">{skill === "READING" ? "R" : "L"}{String(index + 1).padStart(2, "0")} · {question.code} · {question.level}</p><p className="mt-1 break-words font-semibold">{question.prompt}</p>{question.status !== "ACTIVE" && <p className="mt-1 text-label-sm text-error">Câu hỏi chưa hoạt động; cần thay thế hoặc kích hoạt trước khi xuất bản.</p>}</div><div className="flex gap-1"><ManagementButton variant="ghost" aria-label={`Đưa ${question.code} lên`} disabled={busy || index === 0} onClick={() => move(question.id, -1)}>↑</ManagementButton><ManagementButton variant="ghost" aria-label={`Đưa ${question.code} xuống`} disabled={busy || index === sectionQuestions.length - 1} onClick={() => move(question.id, 1)}>↓</ManagementButton><ManagementButton variant="ghost" disabled={busy} onClick={() => setIds(current => current.filter(id => id !== question.id))}>Bỏ</ManagementButton></div></div><details className="mt-4"><summary className="cursor-pointer font-semibold text-primary">Xem nội dung và đáp án</summary><div className="mt-4"><QuestionContent question={question} /></div><p className="mt-4 text-label-sm text-on-surface-variant">Nội dung hiện tại trong ngân hàng. Bản chụp đã xuất bản được giữ nguyên.</p></details></ManagementCard>)}{sectionQuestions.length === 0 && <ManagementCard><ManagementEmpty title={`Chưa chọn câu ${MANAGEMENT_SKILL_LABEL[skill]}`} description="Chọn câu hỏi sẵn sàng từ ngân hàng để bắt đầu." /></ManagementCard>}{missingIds.map(id => <ManagementCard key={id}><p className="text-error">Câu hỏi không còn tồn tại: {id}</p><ManagementButton variant="outline" disabled={busy} onClick={() => setIds(current => current.filter(item => item !== id))}>Bỏ khỏi bản nháp</ManagementButton></ManagementCard>)}<ManagementButton className="w-full border-dashed" variant="outline" disabled={busy || ids.length >= 20} onClick={() => setPicker(skill)}>+ Chọn câu {MANAGEMENT_SKILL_LABEL[skill]} từ ngân hàng</ManagementButton></div><ManagementCard className="space-y-5 xl:sticky xl:top-5"><h2 className="text-title-lg font-semibold">Cấu trúc bộ đề</h2><PlacementSetBlueprint questions={questions} />{issues.length > 0 ? <div className="rounded-xl bg-learning-note p-4 text-learning-note-ink"><p className="font-semibold">Chưa thể xuất bản</p><ul className="mt-2 list-disc space-y-1 pl-5 text-label-sm">{issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul></div> : <p className="rounded-xl bg-learning-mint p-4 text-primary">Đủ điều kiện để xuất bản.</p>}<div className="space-y-3"><ManagementButton className="w-full" variant="outline" disabled={busy || !name.trim()} onClick={() => void save("stay")}>Lưu bản nháp</ManagementButton><ManagementButton className="w-full" disabled={busy || issues.length > 0} onClick={() => setConfirm("publish")}>Xuất bản bộ đề</ManagementButton></div><p className="text-label-sm text-on-surface-variant" aria-live="polite">{dirty ? "Có thay đổi chưa lưu." : "Bản nháp đã được lưu."} Xuất bản lưu thay đổi hiện tại và tạo bản chụp nội dung cố định.</p></ManagementCard></div>{picker && <PlacementSetPickerDialog key={picker} skill={picker} bank={state.questions} selectedIds={ids} busy={busy} onClose={() => setPicker(null)} onAdd={added => { if (busy) return; const next = [...ids, ...added.filter(id => !ids.includes(id))]; setIds([...next.filter(id => state.questions.find(question => question.id === id)?.skill !== "LISTENING"), ...next.filter(id => state.questions.find(question => question.id === id)?.skill === "LISTENING")]); setPicker(null); }} />}<ManagementConfirm open={confirm !== null} busy={busy} title={confirm === "publish" ? "Xuất bản bộ đề?" : "Rời bản nháp?"} description={confirm === "publish" ? `Phiên bản v${set.version} được cố định với 20 câu. Các thay đổi hiện tại sẽ được lưu trước khi xuất bản. Muốn sửa sau đó, hãy tạo phiên bản mới.` : "Các thay đổi chưa lưu sẽ bị bỏ. Bản nháp đã lưu vẫn được giữ nguyên."} confirmLabel={confirm === "publish" ? "Lưu và xuất bản" : "Bỏ thay đổi và rời"} onClose={() => setConfirm(null)} onConfirm={() => { if (busy) return; if (confirm === "publish") void save("publish"); else navigate(leaveTo.current); }} /></>;
}
