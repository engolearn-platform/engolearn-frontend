import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import type { ManagementQuestion, ManagementQuestionDraft } from "@features/placement/types/placement-management.types";
import { MANAGEMENT_PATHS } from "@features/placement/constants/placement-management";
import { getQuestionIssues } from "@features/placement/utils/placement-management";
import { PlacementQuestionFields } from "@features/placement/components/management/questions/PlacementQuestionFields";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementConfirm, ManagementHeader, ManagementMissing } from "@features/placement/components/management/PlacementManagementUi";

function newDraft(): ManagementQuestionDraft {
  return { code: "", skill: "READING", level: "A1", prompt: "", passage: "", options: (["A", "B", "C", "D"] as const).map((label) => ({ id: label, label, text: "" })), correctOptionId: "A", explanation: "", transcript: "", audioUrl: "" };
}

export default function PlacementQuestionFormView() {
  const { questionId } = useParams();
  const { state } = usePlacementManagement();
  const question = state.questions.find((item) => item.id === questionId);
  if (questionId && !question) return <ManagementMissing backTo={MANAGEMENT_PATHS.questions} label="Ngân hàng câu hỏi" />;
  return <QuestionForm key={questionId ?? "new"} question={question} />;
}

function QuestionForm({ question }: { question?: ManagementQuestion }) {
  const { state, service, busy, run } = usePlacementManagement();
  const navigate = useNavigate();
  const [originalQuestion] = useState(question);
  const [draft, setDraft] = useState<ManagementQuestionDraft>(() => {
    if (!question) return newDraft();
    const { code, skill, level, prompt, passage, options, correctOptionId, explanation, transcript, audioUrl } = question;
    return { code, skill, level, prompt, passage, options, correctOptionId, explanation, transcript, audioUrl };
  });
  const [initial] = useState(() => JSON.stringify(draft));
  const [errors, setErrors] = useState<string[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const current = state.questions.find((item) => item.id === question?.id);
  const dirty = JSON.stringify(draft) !== initial;
  const issues = getQuestionIssues(draft);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const cancel = () => { if (dirty) setCancelOpen(true); else navigate(MANAGEMENT_PATHS.questions); };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = getQuestionIssues(draft, false);
    if (state.questions.some((item) => item.id !== question?.id && item.code.trim().toLocaleLowerCase() === draft.code.trim().toLocaleLowerCase())) nextErrors.push("Mã câu hỏi đã tồn tại.");
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const result = await run(() => service.saveQuestion(draft, originalQuestion), "Đã lưu câu hỏi.");
    if (result !== null) navigate(MANAGEMENT_PATHS.questions);
  };
  const changeStatus = async (status: "ACTIVE" | "INACTIVE") => {
    if (!originalQuestion || busy || dirty) return;
    const result = await run(async () => { await service.setQuestionStatus(originalQuestion, status); return true; },
      status === "ACTIVE" ? "Đã kích hoạt câu hỏi." : "Đã ngừng sử dụng câu hỏi.");
    if (result !== null) navigate(MANAGEMENT_PATHS.questions);
  };
  return <div className="space-y-6">
    <ManagementHeader title={question ? `Chỉnh sửa câu hỏi ${question.code}` : "Thêm câu hỏi"} description="Hoàn thiện nội dung tại một nơi. Bộ đề đã xuất bản luôn giữ nguyên phiên bản."><ManagementButton variant="outline" disabled={busy} onClick={cancel}><ArrowLeft className="size-4" />Ngân hàng</ManagementButton></ManagementHeader>
    <div className="grid items-start gap-6 xl:grid-cols-3"><form onSubmit={(event) => { void save(event); }} className="space-y-4 xl:col-span-2">
      {errors.length > 0 && <ManagementCard><div role="alert" className="text-error"><p className="font-semibold">Cần kiểm tra nội dung</p><ul className="mt-2 list-disc pl-5">{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul></div></ManagementCard>}
      <fieldset disabled={busy} className="space-y-4"><PlacementQuestionFields draft={draft} onChange={(value) => { setDraft(value); setErrors([]); }} editing={Boolean(question)} /></fieldset>
      <div className="flex flex-wrap items-center justify-end gap-3"><p className="mr-auto text-label-sm text-on-surface-variant">{dirty ? "Có thay đổi chưa lưu." : "Thay đổi chỉ được lưu khi bấm Lưu câu hỏi."}</p><ManagementButton type="button" variant="outline" disabled={busy} onClick={cancel}>Hủy</ManagementButton><ManagementButton type="submit" disabled={busy}><Save className="size-4" />{busy ? "Đang lưu…" : "Lưu câu hỏi"}</ManagementButton></div>
    </form><ManagementCard className="space-y-4 xl:sticky xl:top-6"><h2 className="text-title-lg font-semibold">Tình trạng câu hỏi</h2>
      <ManagementBadge tone={issues.length ? "warning" : "success"}>{issues.length ? "Cần bổ sung" : "Đủ nội dung"}</ManagementBadge>
      {issues.length > 0 && <ul className="list-disc space-y-2 pl-5 text-body-md text-on-surface-variant">{issues.map((issue, index) => <li key={`${index}-${issue}`}>{issue}</li>)}</ul>}
      <p className="text-body-md text-on-surface-variant">Listening thiếu audio hoặc transcript có thể lưu bản nháp. Chỉ câu đang hoạt động và đủ nội dung mới được chọn vào bộ đề.</p>
      {current && <><div className="border-t border-outline-variant pt-4"><ManagementBadge>{current.status === "ACTIVE" ? "Đang hoạt động" : current.status === "INACTIVE" ? "Ngừng sử dụng" : "Bản nháp"}</ManagementBadge></div>
        {current.status === "ACTIVE" ? <ManagementButton type="button" variant="outline" disabled={busy || dirty} onClick={() => setDeactivateOpen(true)}>Ngừng sử dụng</ManagementButton> : <ManagementButton type="button" variant="outline" disabled={busy || dirty || (current.skill === "LISTENING" && current.mediaReady === false) || getQuestionIssues(current).length > 0} onClick={() => void changeStatus("ACTIVE")}>Kích hoạt câu đã lưu</ManagementButton>}
        <p className="text-label-sm text-on-surface-variant">Lưu nội dung trước khi kích hoạt. Ngừng sử dụng không thay đổi các phiên bản đã xuất bản.</p></>}
    </ManagementCard></div>
    <ManagementConfirm open={cancelOpen} title="Bỏ thay đổi chưa lưu?" description="Những thay đổi trên trang này sẽ không được lưu." busy={busy} onClose={() => setCancelOpen(false)} onConfirm={() => navigate(MANAGEMENT_PATHS.questions)} confirmLabel="Bỏ thay đổi" />
    <ManagementConfirm open={deactivateOpen} title="Ngừng sử dụng câu hỏi?" description="Câu hỏi sẽ không được chọn vào bộ đề mới. Các phiên bản đã xuất bản được giữ nguyên." busy={busy} onClose={() => setDeactivateOpen(false)} onConfirm={() => { void changeStatus("INACTIVE"); }} confirmLabel="Ngừng sử dụng" />
  </div>;
}
