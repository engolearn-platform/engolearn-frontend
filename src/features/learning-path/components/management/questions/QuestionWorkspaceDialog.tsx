import { useMicroSkillCatalog } from "@features/learning-path/hooks/useMicroSkillCatalog";
import { microSkillLabel } from "@features/learning-path/utils/microSkillCatalog";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { questionManagementService } from "@features/learning-path/services/question-management.service";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import { useQuestionManagementMutation, questionErrorMessage } from "@features/learning-path/hooks/useQuestionManagementMutation";
import { OPTION_IDS, validRevision } from "@features/learning-path/types/question-management.types";
import type { OptionId, QuestionDetail, QuestionInput } from "@features/learning-path/types/question-management.types";
import { PASSAGE_LEVELS, PASSAGE_SKILL_LABELS } from "@features/learning-path/types/passage-management.types";
import type { PassageDetail, PassageLevel, PassageSkill } from "@features/learning-path/types/passage-management.types";
import QuestionPassagePicker from "./QuestionPassagePicker";
import QuestionPreview from "./QuestionPreview";
import { questionFieldClass } from "./QuestionReviewPanel";

export type QuestionWorkspace = { mode: "create"; passageId?: string } | { mode: "edit" | "view"; questionId: string };
function QuestionEditor({ detail, initialPassage, onSaved, onClose, onBusy }: {
  detail?: QuestionDetail; initialPassage?: PassageDetail; onSaved: (id: string) => void; onClose: () => void; onBusy: (busy: boolean) => void;
}) {
  const mutation = useQuestionManagementMutation();
  const catalog = useMicroSkillCatalog();
  const [skill, setSkill] = useState<PassageSkill | "">(detail ? detail.skill ?? "" : initialPassage?.skill ?? "READING");
  const [level, setLevel] = useState<PassageLevel | "">(detail ? detail.level ?? "" : initialPassage?.level ?? "A1");
  const [microSkill, setMicroSkill] = useState(detail?.microSkill ?? "");
  const [passageId, setPassageId] = useState(detail?.passageId ?? initialPassage?.passageId ?? "");
  const [passageValid, setPassageValid] = useState(false);
  const [prompt, setPrompt] = useState(detail?.prompt ?? "");
  const [options, setOptions] = useState(() => OPTION_IDS.map(optionId => ({ optionId, text: detail?.options?.find(option => option?.optionId === optionId)?.text ?? "" })));
  const [correct, setCorrect] = useState(detail?.correctOptionId ?? "");
  const [explanation, setExplanation] = useState(detail?.explanation ?? "");
  const [validation, setValidation] = useState(""); const [blocked, setBlocked] = useState(false);
  useEffect(() => onBusy(mutation.busy), [mutation.busy, onBusy]);
  const availableSkills = (catalog.data ?? []).filter(item => item.active && item.skill === skill);
  const save = (event: FormEvent) => {
    event.preventDefault(); if (mutation.locked() || blocked) return;
    if (catalog.loading || catalog.error || !catalog.data) { setValidation("Cần tải được danh mục kỹ năng trước khi lưu câu hỏi."); return; }
    if (!skill || !level || !availableSkills.some(item => item.canonicalName === microSkill)
      || !prompt.trim() || options.some(option => !option.text.trim()) || !OPTION_IDS.includes(correct as OptionId) || !explanation.trim()
      || (skill === "LISTENING" && !passageId.trim())) { setValidation("Hãy chọn đúng phân loại, passage nếu là Listening, nhập nội dung, bốn lựa chọn, đáp án và giải thích."); return; }
    if (detail && !validRevision(detail.revision)) { setValidation("Câu hỏi chưa có phiên bản hợp lệ để lưu. Hãy tải lại dữ liệu."); return; }
    if (passageId.trim() && !passageValid) { setValidation("Cần tải được passage cùng kỹ năng và trình độ trước khi lưu. Hãy kiểm tra lại passage đã chọn."); return; }
    if (new Set(options.map(option => option.text.trim().replace(/\s+/g, " ").toLowerCase())).size !== 4) { setValidation("Bốn lựa chọn phải có nội dung khác nhau."); return; }
    const input: QuestionInput = { skill, level, microSkill, passageId: passageId.trim(), prompt: prompt.trim(),
      options: options.map(option => ({ ...option, text: option.text.trim() })), correctOptionId: correct as OptionId, explanation: explanation.trim() };
    setValidation(""); onBusy(true);
    void mutation.run(signal => detail ? questionManagementService.update(detail.questionId, { ...input, revision: detail.revision! }, signal)
      : questionManagementService.create(input, signal), receipt => onSaved(receipt.questionId), error => { if (error.status !== 400) setBlocked(true); });
  };
  return <form onSubmit={save} className="space-y-5">
    <fieldset disabled={mutation.busy} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="block font-semibold">Kỹ năng *</span>
        <select className={questionFieldClass} required value={skill} onChange={event => { setSkill(event.target.value as PassageSkill); setMicroSkill(""); setPassageId(""); }}>
          <option value="" disabled>Chọn kỹ năng</option>{Object.entries(PASSAGE_SKILL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label className="space-y-2"><span className="block font-semibold">Trình độ CEFR *</span><select className={questionFieldClass} required value={level}
          onChange={event => { setLevel(event.target.value as PassageLevel); setPassageId(""); }}><option value="" disabled>Chọn trình độ</option>{PASSAGE_LEVELS.map(value => <option key={value}>{value}</option>)}</select></label>
      </div>
      <label className="block space-y-2"><span className="block font-semibold">Kỹ năng nhỏ *</span><select className={questionFieldClass} required disabled={catalog.loading || !!catalog.error} value={microSkill} onChange={event => setMicroSkill(event.target.value)}>
        <option value="" disabled>Chọn kỹ năng nhỏ</option>{availableSkills.map(item => <option key={item.id} value={item.canonicalName}>{microSkillLabel(item.canonicalName, catalog.data ?? [])}</option>)}
        {microSkill && !availableSkills.some(item => item.canonicalName === microSkill) && <option value={microSkill} disabled>{microSkillLabel(microSkill, catalog.data ?? [])} · Không còn khả dụng</option>}
      </select></label>
      {catalog.loading && <p role="status" className="text-body-md text-on-surface-variant">Đang tải danh mục kỹ năng...</p>}
      {catalog.error && <p role="alert" className="text-error">{catalog.error.message}</p>}
      <Button type="button" variant="outline" className="min-h-12" disabled={catalog.loading} onClick={catalog.refetch}>
        {catalog.error ? "Thử tải lại danh mục kỹ năng" : "Tải lại danh mục kỹ năng"}
      </Button>
      {!catalog.loading && !catalog.error && availableSkills.length === 0 && <p role="status" className="text-on-surface-variant">Chưa có kỹ năng đang sử dụng thuộc nhóm này.</p>}
      {skill && level && <QuestionPassagePicker key={`${skill}-${level}`} skill={skill} level={level} value={passageId} onChange={setPassageId} onValidityChange={setPassageValid} disabled={mutation.busy} />}
      <label className="block space-y-2"><span className="block font-semibold">Nội dung câu hỏi *</span><textarea className={questionFieldClass} rows={4} required maxLength={50000} value={prompt} onChange={event => setPrompt(event.target.value)} /></label>
      <fieldset className="space-y-3 rounded-xl bg-surface-container-low p-4"><legend className="sr-only">Bốn lựa chọn và đáp án đúng</legend>
        <h3 className="font-semibold">Bốn lựa chọn · Chọn một đáp án đúng</h3>
        {options.map((option, index) => <div key={option.optionId} className="flex items-start gap-3">
          <label className="flex min-h-12 shrink-0 items-center gap-2"><input type="radio" name="question-correct-option" required className="size-5 accent-primary" checked={correct === option.optionId} onChange={() => setCorrect(option.optionId)} aria-label={`Đáp án đúng là ${option.optionId}`} /><span className="font-semibold">{option.optionId}</span></label>
          <label className="min-w-0 flex-1"><span className="sr-only">Nội dung lựa chọn {option.optionId}</span><textarea required rows={2} maxLength={10000} className={questionFieldClass} value={option.text}
            onChange={event => setOptions(previous => previous.map((value, itemIndex) => itemIndex === index ? { ...value, text: event.target.value } : value))} /></label>
        </div>)}
      </fieldset>
      <label className="block space-y-2"><span className="block font-semibold">Giải thích đáp án *</span><textarea rows={4} required maxLength={50000} className={questionFieldClass} value={explanation} onChange={event => setExplanation(event.target.value)} /></label>
    </fieldset>
    {(validation || mutation.error) && <p role="alert" className="text-error">{validation || (mutation.error ? questionErrorMessage(mutation.error) : "")}</p>}
    {blocked && <p className="text-on-surface-variant">Hãy đóng và tải lại trạng thái trước khi lưu tiếp. Nội dung trên form chưa được tự gửi lại.</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={mutation.busy} onClick={onClose}>Hủy</Button>
      <Button type="submit" disabled={mutation.busy || catalog.loading || !!catalog.error || !catalog.data || availableSkills.length === 0 || blocked || (!!detail && !validRevision(detail.revision))}>{mutation.busy ? "Đang lưu..." : detail ? "Lưu thay đổi" : "Tạo bản nháp"}</Button></DialogFooter>
  </form>;
}
export default function QuestionWorkspaceDialog({ workspace, onClose, onSaved }: { workspace: QuestionWorkspace; onClose: () => void; onSaved: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const id = workspace.mode === "create" ? "" : workspace.questionId;
  const passageId = workspace.mode === "create" ? workspace.passageId ?? "" : "";
  const load = useCallback((signal: AbortSignal) => questionManagementService.detail(id, signal), [id]);
  const result = useFetch(load, !!id);
  const loadPassage = useCallback((signal: AbortSignal) => passageManagementService.detail(passageId, signal), [passageId]);
  const initial = useFetch(loadPassage, !!passageId);
  const error = result.error ?? initial.error;
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent showCloseButton={!busy} className="flex max-h-[90dvh] flex-col overflow-hidden bg-surface-container-lowest sm:max-w-4xl">
      <DialogHeader className="shrink-0 pr-8"><DialogTitle>{workspace.mode === "create" ? "Tạo câu hỏi bản nháp" : workspace.mode === "edit" ? "Chỉnh sửa câu hỏi bản nháp" : "Chi tiết câu hỏi"}</DialogTitle>
        <DialogDescription>{workspace.mode === "view" ? "Xem nội dung, passage và thông tin duyệt dành cho quản trị." : "Biên soạn câu hỏi cho kho Learning Path. Nội dung đã giao cho người học được giữ nguyên."}</DialogDescription></DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
      {(id && result.loading) || (passageId && initial.loading) ? <Loading /> : error ? <div className="space-y-3"><p role="alert" className="text-error">{error.message}</p><Button variant="outline" onClick={() => { if (id) result.refetch(); if (passageId) initial.refetch(); }}>Thử lại</Button></div>
        : workspace.mode === "create" ? <QuestionEditor initialPassage={initial.data ?? undefined} onSaved={onSaved} onClose={onClose} onBusy={setBusy} />
          : result.data?.questionId === id && (workspace.mode === "view" ? <QuestionPreview detail={result.data} onReload={result.refetch} />
            : result.data.status === "DRAFT" ? <QuestionEditor detail={result.data} onSaved={onSaved} onClose={onClose} onBusy={setBusy} /> : <p role="alert">Câu hỏi đã không còn là bản nháp. Hãy đóng và tải lại danh sách.</p>)}
      </div>
      {workspace.mode === "view" && <DialogFooter className="shrink-0 border-t border-outline-variant pt-4"><Button variant="outline" onClick={onClose}>Đóng</Button></DialogFooter>}
    </DialogContent>
  </Dialog>;
}
