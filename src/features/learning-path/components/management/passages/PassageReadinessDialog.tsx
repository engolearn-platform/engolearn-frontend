import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import type { PassagePublicationError } from "@features/learning-path/services/passage-management.service";
import { isPassageReviewCheck, PASSAGE_REVIEW_LABELS } from "@features/learning-path/types/passage-management.types";
import type { PassageListItem, PassageReadiness, PassageReadinessIssue } from "@features/learning-path/types/passage-management.types";

function IssueList({ title, items, warning = false }: { title: string; items: PassageReadinessIssue[]; warning?: boolean }) {
  if (!items.length) return null;
  return <section className={`space-y-2 rounded-xl p-4 ${warning ? "bg-learning-note text-learning-note-ink" : "bg-error-container text-on-error-container"}`}>
    <h3 className="text-label-lg font-semibold">{title} ({items.length})</h3>
    <ul className="list-disc space-y-2 pl-5 text-body-md">
      {items.map((issue, index) => <li key={`${issue.code}-${issue.field}-${index}`}>{issue.message}</li>)}
    </ul>
  </section>;
}

type Props = { item: PassageListItem; onClose: () => void; onEdit: () => void; onView: () => void; onPublished: () => void };

export default function PassageReadinessDialog(props: Props) {
  const { item, onClose, onEdit, onView } = props;
  const fetchReadiness = useCallback((signal: AbortSignal) => passageManagementService.readiness(item.passageId, signal), [item.passageId]);
  const { data, loading, error, refetch } = useFetch(fetchReadiness);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [needsRecheck, setNeedsRecheck] = useState(false);
  const [rejectedReadiness, setRejectedReadiness] = useState<PassageReadiness | null>(null);
  const request = useRef<AbortController | null>(null);
  const lock = useRef(false);
  useEffect(() => () => { request.current?.abort(); }, []);
  const result = rejectedReadiness ?? data;
  const revisionChanged = result?.revision !== item.revision;
  const supportedChecks = !!result?.requiredReviewChecks.length && result.requiredReviewChecks.every(isPassageReviewCheck);
  const canPublish = !loading && !error && !busy && !needsRecheck && !revisionChanged && supportedChecks
    && result?.passageId === item.passageId && result.status === "DRAFT" && result.structurallyValid && result.blockers.length === 0
    && Number.isInteger(result.revision) && result.revision! > 0 && result.requiredReviewChecks.every(check => confirmed.has(check));
  const reload = () => {
    if (lock.current) return;
    setConfirmed(new Set()); setSubmissionError(""); setNeedsRecheck(false); setRejectedReadiness(null); refetch();
  };
  const publish = async () => {
    if (!canPublish || !result || result.revision === null || lock.current) return;
    lock.current = true; setBusy(true); setSubmissionError("");
    const controller = new AbortController(); request.current = controller;
    try {
      await passageManagementService.publish(item.passageId, {
        revision: result.revision, confirmedReviewChecks: result.requiredReviewChecks.filter(isPassageReviewCheck),
      }, controller.signal);
      if (!controller.signal.aborted) props.onPublished();
    } catch (reason) {
      if (controller.signal.aborted) return;
      const failure = reason as PassagePublicationError;
      setConfirmed(new Set()); setNeedsRecheck(true);
      if (failure.readiness) setRejectedReadiness(failure.readiness);
      setSubmissionError(failure.status === 409 ? "Passage đã thay đổi hoặc đã được xuất bản. Hãy đóng, tải lại danh sách và xem lại nội dung."
        : failure.status === 422 ? "Chưa thể xuất bản. Hãy xử lý các lỗi hoặc tiêu chí xác nhận bên dưới rồi kiểm tra lại."
        : failure.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại và tải lại trạng thái passage."
        : failure.status === 403 ? "Bạn không có quyền xuất bản passage này."
        : failure.status === 404 ? "Passage không còn tồn tại. Hãy đóng và tải lại danh sách."
        : "Chưa xác định được kết quả xuất bản. Hãy kiểm tra lại trạng thái trước khi thử lại.");
    } finally {
      lock.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const errorMessage = error?.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để kiểm tra passage."
    : error?.status === 403 ? "Bạn không có quyền kiểm tra passage này."
    : error?.status === 404 ? "Passage không còn tồn tại. Hãy đóng và tải lại danh sách."
    : error?.status === 503 ? "Chưa thể hoàn tất kiểm tra vì dịch vụ tạm thời không khả dụng. Hãy thử lại."
    : error?.message;
  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}>
    <DialogContent showCloseButton={!busy} className="max-h-[90dvh] overflow-y-auto bg-surface-container-lowest sm:max-w-3xl">
      <DialogHeader><DialogTitle>Kiểm tra và xuất bản passage</DialogTitle>
        <DialogDescription>{item.title}</DialogDescription>
      </DialogHeader>
      {loading ? <div role="status" className="space-y-3 py-8 text-center"><Loading /><p>Đang kiểm tra dữ liệu đã lưu...</p></div>
        : error ? <div className="space-y-4"><p role="alert" className="text-error">{errorMessage}</p>
          <Button variant="outline" onClick={reload}>Thử lại</Button></div>
        : result && <div className="space-y-4">
          <div role="status" className={`rounded-xl p-4 text-body-md font-semibold ${result.structurallyValid ? "bg-learning-mint text-primary" : "bg-error-container text-on-error-container"}`}>
            {result.structurallyValid ? "Đạt kiểm tra tự động" : "Chưa đạt điều kiện kiểm tra"}
          </div>
          <p className="text-label-sm text-on-surface-variant">Phiên bản kiểm tra: {result.revision ?? "Chưa xác định"} · {result.referencingQuestionCount} câu hỏi tham chiếu</p>
          {revisionChanged && <p className="rounded-xl bg-learning-note p-4 text-learning-note-ink">Passage đã thay đổi so với danh sách. Hãy đóng, tải lại danh sách và xem lại nội dung trước khi xác nhận xuất bản.</p>}
          <IssueList title="Lỗi cần xử lý" items={result.blockers} />
          <IssueList title="Cảnh báo" items={result.warnings} warning />
          {result.requiredReviewChecks.length > 0 && <section className="space-y-2 rounded-xl bg-surface-container-low p-4">
            <h3 className="text-label-lg font-semibold">Các mục admin cần xác nhận khi xuất bản</h3>
            <fieldset disabled={busy || needsRecheck || revisionChanged || result.status !== "DRAFT" || !result.structurallyValid} className="space-y-3">
              <legend className="sr-only">Xác nhận chuyên môn theo phiên bản passage</legend>
              {result.requiredReviewChecks.map(check => <label key={check} className="flex min-h-12 cursor-pointer items-start gap-3 py-2 text-body-md">
                <input type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" checked={confirmed.has(check)} disabled={!isPassageReviewCheck(check)}
                  onChange={event => { const checked = event.target.checked; setConfirmed(previous => { const next = new Set(previous); if (checked) next.add(check); else next.delete(check); return next; }); }} />
                <span>{isPassageReviewCheck(check) ? PASSAGE_REVIEW_LABELS[check] : "Tiêu chí chưa được giao diện hỗ trợ. Vui lòng cập nhật giao diện trước khi xuất bản."}</span>
              </label>)}
            </fieldset>
          </section>}
          <p className="text-body-md text-on-surface-variant">Kết quả tự động chưa thay thế việc duyệt chuyên môn. Chỉ xác nhận sau khi đã xem lại nội dung và nghe thử audio nếu có. Sau xuất bản, passage sẽ không được sửa hoặc xóa trực tiếp.</p>
          <Button variant="outline" disabled={busy} onClick={reload}>Kiểm tra lại</Button>
        </div>}
      {submissionError && <p role="alert" className="text-error">{submissionError}</p>}
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button>
        {!loading && !error && result && <>
          <Button variant="outline" disabled={busy} onClick={onView}>Xem chi tiết / nghe thử</Button>
          {result.status === "DRAFT" && <Button variant="outline" disabled={busy} onClick={onEdit}>Mở chỉnh sửa</Button>}
        </>}
        <Button disabled={!canPublish} onClick={() => void publish()}>{busy ? "Đang xuất bản..." : "Xuất bản"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
