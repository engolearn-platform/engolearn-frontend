import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { useQuestionManagementMutation, questionErrorMessage } from "@features/learning-path/hooks/useQuestionManagementMutation";
import { questionManagementService } from "@features/learning-path/services/question-management.service";
import { validRevision } from "@features/learning-path/types/question-management.types";
import type { QuestionCoverageWarning, QuestionListItem } from "@features/learning-path/types/question-management.types";
import { QuestionCoverageWarnings } from "./QuestionReviewPanel";

export default function QuestionActionDialog({ mode, item, onClose, onDone }: {
  mode: "delete" | "copy" | "retire"; item: QuestionListItem; onClose: () => void;
  onDone: (copiedId?: string, warnings?: QuestionCoverageWarning[]) => void;
}) {
  const mutation = useQuestionManagementMutation();
  const [warnings, setWarnings] = useState<QuestionCoverageWarning[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const title = mode === "delete" ? "Xóa bản nháp" : mode === "copy" ? "Sao chép thành bản nháp" : "Ngưng sử dụng câu hỏi";
  const allowed = validRevision(item.revision) && (mode === "copy" || item.status === (mode === "delete" ? "DRAFT" : "ACTIVE"));
  const execute = () => {
    if (!allowed || blocked || mutation.locked() || (warnings.length > 0 && !acknowledged)) return;
    void mutation.run(async signal => {
      if (mode === "copy") return { id: (await questionManagementService.copy(item.questionId, item.revision!, signal)).questionId, warnings: [] };
      if (mode === "delete") { await questionManagementService.delete(item.questionId, item.revision!, signal); return { id: undefined, warnings: [] }; }
      const receipt = await questionManagementService.retire(item.questionId, item.revision!, warnings.length > 0 && acknowledged, signal);
      return { id: undefined, warnings: receipt.warnings };
    }, value => onDone(value.id, value.warnings), error => {
      if (mode === "retire" && error.status === 409 && error.coverageWarnings) { setWarnings(error.coverageWarnings); setAcknowledged(false); }
      else setBlocked(true);
    });
  };
  return <Dialog open onOpenChange={open => { if (!open && !mutation.locked()) onClose(); }}>
    <DialogContent showCloseButton={!mutation.busy} className="max-h-[90dvh] overflow-y-auto bg-surface-container-lowest">
      <DialogHeader><DialogTitle>{title}?</DialogTitle><DialogDescription>
        {mode === "delete" ? "Bản nháp sẽ bị xóa. Hãy kiểm tra lại câu hỏi trước khi xác nhận." : mode === "copy" ? "Tạo câu hỏi mới ở trạng thái bản nháp để chỉnh sửa độc lập với câu hỏi gốc." : "Câu hỏi sẽ không được chọn cho lộ trình mới. Nội dung và tiến độ trong lộ trình đã giao được giữ nguyên."}
      </DialogDescription></DialogHeader>
      <p className="break-words font-semibold">{item.prompt || item.questionId}</p>
      <p className="break-all text-label-sm text-on-surface-variant">{item.questionId}</p>
      <QuestionCoverageWarnings warnings={warnings} />
      {warnings.length > 0 && <label className="flex min-h-12 items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" disabled={mutation.busy || blocked} checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} /><span>Tôi đã hiểu cảnh báo về số lượng câu hỏi và vẫn muốn ngưng sử dụng câu hỏi này.</span></label>}
      {mutation.error && !(mutation.error.coverageWarnings && !blocked) && <p role="alert" className="text-error">{questionErrorMessage(mutation.error)}</p>}
      {!allowed && <p role="alert">Trạng thái hoặc phiên bản không hợp lệ. Hãy đóng và tải lại danh sách.</p>}
      <DialogFooter><Button variant="outline" disabled={mutation.busy} onClick={onClose}>{blocked ? "Đóng và tải lại" : "Hủy"}</Button>
        <Button disabled={mutation.busy || blocked || !allowed || (warnings.length > 0 && !acknowledged)} onClick={execute}>{mutation.busy ? "Đang xử lý..." : title}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
