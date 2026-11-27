import { useCallback, useEffect, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { questionManagementService } from "@features/learning-path/services/question-management.service";
import { useQuestionManagementMutation, questionErrorMessage } from "@features/learning-path/hooks/useQuestionManagementMutation";
import { isQuestionReviewCheck, validRevision } from "@features/learning-path/types/question-management.types";
import type { QuestionCoverageWarning, QuestionListItem, QuestionReadiness } from "@features/learning-path/types/question-management.types";
import QuestionPreview from "./QuestionPreview";
import { canReviewQuestion } from "@features/learning-path/utils/question-review.utils";
import { QuestionCoverageWarnings, QuestionReviewPanel, questionFieldClass } from "./QuestionReviewPanel";

// Remount the review whenever the replacement changes so confirmations cannot cross questions.
function Review({ source, target, replacement, onClose, onDone, onBusy }: {
  source: QuestionListItem; target: QuestionListItem; replacement: boolean; onClose: () => void; onDone: (warnings: QuestionCoverageWarning[]) => void; onBusy: (busy: boolean) => void;
}) {
  const mutation = useQuestionManagementMutation();
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [override, setOverride] = useState<QuestionReadiness | null>(null);
  const [requiresCheck, setRequiresCheck] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [warnings, setWarnings] = useState<QuestionCoverageWarning[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => onBusy(mutation.busy), [mutation.busy, onBusy]);
  const loadDetail = useCallback((signal: AbortSignal) => questionManagementService.detail(target.questionId, signal), [target.questionId]);
  const loadReadiness = useCallback((signal: AbortSignal) => questionManagementService.readiness(target.questionId, signal), [target.questionId]);
  const detail = useFetch(loadDetail); const check = useFetch(loadReadiness);
  const result = override ?? check.data;
  const fresh = !detail.loading && !detail.error && detail.data?.questionId === target.questionId && detail.data.status === "DRAFT"
    && detail.data.revision === target.revision && !check.loading && !check.error && !requiresCheck
    && !!result && detail.data.passageId === result.passageId
    && (detail.data.passage?.revision ?? null) === result.passageRevision;
  const ready = fresh && canReviewQuestion(result, target.revision, confirmed) && validRevision(source.revision)
    && source.status === (replacement ? "ACTIVE" : "DRAFT") && !blocked;
  const recheck = () => { if (mutation.locked() || blocked) return; setConfirmed(new Set()); setOverride(null); setRequiresCheck(false); setWarnings([]); setAcknowledged(false); mutation.clearError(); detail.refetch(); check.refetch(); };
  const publish = () => {
    if (!ready || !result || mutation.locked() || (warnings.length > 0 && !acknowledged)) return;
    const confirmedReviewChecks = result.requiredReviewChecks.filter(isQuestionReviewCheck);
    onBusy(true);
    void mutation.run(async signal => {
      if (replacement) return (await questionManagementService.replace(source.questionId, { revision: source.revision!, replacementQuestionId: target.questionId,
        replacementRevision: target.revision!, confirmedReviewChecks, confirmCoverageWarning: warnings.length > 0 && acknowledged }, signal)).warnings;
      await questionManagementService.publish(target.questionId, { revision: target.revision!, confirmedReviewChecks }, signal);
      return [];
    }, onDone, error => {
      if (replacement && error.status === 409 && error.coverageWarnings) { setWarnings(error.coverageWarnings); setAcknowledged(false); }
      else if (error.status === 422) { setOverride(error.readiness ?? null); setConfirmed(new Set()); setRequiresCheck(true); setWarnings([]); setAcknowledged(false); }
      else setBlocked(true);
    });
  };
  return <div className="flex min-h-0 flex-1 flex-col gap-4">
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-2">
    {detail.loading || check.loading ? <Loading /> : <>
      {detail.error || check.error ? <p role="alert" className="text-error">Không tải được đầy đủ nội dung và kết quả kiểm tra. Hãy kiểm tra lại.</p> : <>
        {detail.data?.questionId === target.questionId && <QuestionPreview detail={detail.data} onReload={recheck} />}
        {result && <QuestionReviewPanel result={result} revision={target.revision} confirmed={confirmed} setConfirmed={setConfirmed} disabled={mutation.busy || !fresh || blocked} />}
        {!fresh && <p role="alert" className="text-error">Cần kiểm tra lại nội dung. Nếu phiên bản đã thay đổi, hãy đóng và tải lại danh sách.</p>}
      </>}
    </>}
    <QuestionCoverageWarnings warnings={warnings} />
    {warnings.length > 0 && <label className="flex min-h-12 items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" checked={acknowledged} disabled={mutation.busy || blocked} onChange={event => setAcknowledged(event.target.checked)} /><span>Tôi hiểu cảnh báo về số lượng câu hỏi và vẫn xác nhận thay thế.</span></label>}
    {mutation.error && !(mutation.error.coverageWarnings && !blocked) && <p role="alert" className="text-error">{questionErrorMessage(mutation.error)}</p>}
    </div>
    <DialogFooter className="shrink-0 border-t border-outline-variant pt-4">
      <Button variant="outline" disabled={mutation.busy} onClick={onClose}>{blocked ? "Đóng và tải lại" : "Hủy"}</Button>
      <Button variant="outline" disabled={mutation.busy || blocked || detail.loading || check.loading} onClick={recheck}>Kiểm tra lại</Button>
      <Button disabled={!ready || mutation.busy || (warnings.length > 0 && !acknowledged)} onClick={publish}>{mutation.busy ? "Đang xử lý..." : replacement ? "Xác nhận thay thế" : "Xuất bản"}</Button>
    </DialogFooter>
  </div>;
}
function ReplacementPicker({ source, onSelect }: { source: QuestionListItem; onSelect: (item: QuestionListItem) => void }) {
  const [keyword, setKeyword] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(0);
  const load = useCallback((signal: AbortSignal) => questionManagementService.list({ keyword: search, skill: "ALL", microSkill: "", level: "ALL", status: "DRAFT", passageId: "", page, size: 10 }, signal), [search, page]);
  const result = useFetch(load);
  return <div className="space-y-4">
    <p>Chọn bản nháp thay thế cho <strong>{source.prompt || source.questionId}</strong>. Hệ thống sẽ xuất bản bản nháp và ngưng câu hỏi cũ trong cùng thao tác.</p>
    <form className="flex gap-2" onSubmit={event => { event.preventDefault(); setPage(0); setSearch(keyword.trim()); }}><label className="min-w-0 flex-1"><span className="sr-only">Tìm bản nháp thay thế</span><input className={questionFieldClass} value={keyword} maxLength={200} placeholder="Tìm nội dung hoặc mã câu hỏi" onChange={event => setKeyword(event.target.value)} /></label><Button type="submit">Tìm</Button></form>
    {result.loading ? <Loading /> : result.error ? <div><p role="alert" className="text-error">Không tải được các bản nháp.</p><Button variant="outline" onClick={result.refetch}>Thử lại</Button></div> : <>
      <ul className="space-y-2">{result.data?.items.filter(item => item.questionId !== source.questionId).map(item => <li key={item.questionId}><button type="button" disabled={!validRevision(item.revision)} className="w-full rounded-xl border border-outline-variant p-4 text-left hover:bg-learning-mint disabled:opacity-50" onClick={() => onSelect(item)}><span className="block break-words font-semibold">{item.prompt || "Chưa có nội dung"}</span><span className="block break-all text-label-sm text-on-surface-variant">{item.questionId} · {item.skill} · {item.level}</span></button></li>)}</ul>
      {result.data?.items.length === 0 && <p>Không có bản nháp khớp tìm kiếm. Hãy tạo hoặc sao chép câu hỏi trước khi thay thế.</p>}
      <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Trước</Button><span>Trang {page + 1}</span><Button variant="outline" disabled={!result.data || page + 1 >= result.data.totalPages} onClick={() => setPage(value => value + 1)}>Sau</Button></div>
    </>}
  </div>;
}
export default function QuestionPublicationDialog({ item, replacement = false, onClose, onDone }: {
  item: QuestionListItem; replacement?: boolean; onClose: () => void; onDone: (warnings: QuestionCoverageWarning[]) => void;
}) {
  const [target, setTarget] = useState<QuestionListItem | null>(replacement ? null : item);
  const [busy, setBusy] = useState(false);
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent showCloseButton={!busy} className="flex max-h-[90dvh] flex-col overflow-hidden bg-surface-container-lowest sm:max-w-4xl">
    <DialogHeader className="shrink-0 pr-8"><DialogTitle>{replacement ? "Thay thế câu hỏi" : "Kiểm tra và xuất bản"}</DialogTitle><DialogDescription>Xem đầy đủ nội dung và xác nhận từng tiêu chí chuyên môn trước khi xuất bản.</DialogDescription></DialogHeader>
    {target ? <Review key={target.questionId} source={item} target={target} replacement={replacement} onClose={onClose} onDone={onDone} onBusy={setBusy} /> : <><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2"><ReplacementPicker source={item} onSelect={setTarget} /></div><DialogFooter className="shrink-0 border-t border-outline-variant pt-4"><Button variant="outline" onClick={onClose}>Hủy</Button></DialogFooter></>}
  </DialogContent></Dialog>;
}
