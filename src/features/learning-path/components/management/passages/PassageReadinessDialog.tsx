import { useCallback } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import type { PassageListItem, PassageReadinessIssue } from "@features/learning-path/types/passage-management.types";

const reviewLabels: Record<string, string> = {
  LEVEL_APPROPRIATE: "Nội dung phù hợp trình độ đã chọn.",
  CONTENT_SUPPORTS_INTENDED_QUESTIONS: "Passage cung cấp đủ thông tin cho các câu hỏi dự kiến.",
  AUDIO_MATCHES_TRANSCRIPT: "Audio phát được và khớp transcript.",
  AUDIO_QUALITY_REVIEWED: "Đã nghe toàn bộ audio và kiểm tra chất lượng giọng đọc.",
};

function IssueList({ title, items, warning = false }: { title: string; items: PassageReadinessIssue[]; warning?: boolean }) {
  if (!items.length) return null;
  return <section className={`space-y-2 rounded-xl p-4 ${warning ? "bg-learning-note text-learning-note-ink" : "bg-error-container text-on-error-container"}`}>
    <h3 className="text-label-lg font-semibold">{title} ({items.length})</h3>
    <ul className="list-disc space-y-2 pl-5 text-body-md">
      {items.map((issue, index) => <li key={`${issue.code}-${issue.field}-${index}`}>{issue.message}</li>)}
    </ul>
  </section>;
}

export default function PassageReadinessDialog({ item, onClose, onEdit, onView }: {
  item: PassageListItem; onClose: () => void; onEdit: () => void; onView: () => void;
}) {
  const fetchReadiness = useCallback((signal: AbortSignal) => passageManagementService.readiness(item.passageId, signal), [item.passageId]);
  const { data, loading, error, refetch } = useFetch(fetchReadiness);
  const errorMessage = error?.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để kiểm tra passage."
    : error?.status === 403 ? "Bạn không có quyền kiểm tra passage này."
    : error?.status === 404 ? "Passage không còn tồn tại. Hãy đóng và tải lại danh sách."
    : error?.status === 503 ? "Chưa thể hoàn tất kiểm tra vì dịch vụ tạm thời không khả dụng. Hãy thử lại."
    : error?.message;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto bg-surface-container-lowest sm:max-w-3xl">
      <DialogHeader><DialogTitle>Kiểm tra điều kiện passage</DialogTitle>
        <DialogDescription>{item.title}</DialogDescription>
      </DialogHeader>
      {loading ? <div role="status" className="space-y-3 py-8 text-center"><Loading /><p>Đang kiểm tra dữ liệu đã lưu...</p></div>
        : error ? <div className="space-y-4"><p role="alert" className="text-error">{errorMessage}</p>
          <Button variant="outline" onClick={refetch}>Thử lại</Button></div>
        : data && <div className="space-y-4">
          <div role="status" className={`rounded-xl p-4 text-body-md font-semibold ${data.structurallyValid ? "bg-learning-mint text-primary" : "bg-error-container text-on-error-container"}`}>
            {data.structurallyValid ? "Đạt kiểm tra tự động" : "Chưa đạt điều kiện kiểm tra"}
          </div>
          <p className="text-label-sm text-on-surface-variant">Phiên bản kiểm tra: {data.revision ?? "Chưa xác định"} · {data.referencingQuestionCount} câu hỏi tham chiếu</p>
          {data.revision !== item.revision && <p className="rounded-xl bg-learning-note p-4 text-learning-note-ink">Passage đã thay đổi so với danh sách. Kết quả này áp dụng cho phiên bản mới nhất từ máy chủ.</p>}
          <IssueList title="Lỗi cần xử lý" items={data.blockers} />
          <IssueList title="Cảnh báo" items={data.warnings} warning />
          {data.requiredReviewChecks.length > 0 && <section className="space-y-2 rounded-xl bg-surface-container-low p-4">
            <h3 className="text-label-lg font-semibold">Các mục admin cần xác nhận khi xuất bản</h3>
            <ul className="list-disc space-y-2 pl-5 text-body-md">{data.requiredReviewChecks.map(check =>
              <li key={check}>{reviewLabels[check] ?? "Kiểm tra bổ sung theo hướng dẫn chuyên môn."}</li>)}</ul>
          </section>}
          <p className="text-body-md text-on-surface-variant">Kết quả tự động chưa thay thế việc duyệt chuyên môn. Lần kiểm tra này không xuất bản passage hoặc ghi nhận xác nhận của bạn.</p>
          <Button variant="outline" onClick={refetch}>Kiểm tra lại</Button>
        </div>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Đóng</Button>
        {!loading && !error && data && <>
          <Button variant="outline" onClick={onView}>Xem chi tiết / nghe thử</Button>
          {data.status === "DRAFT" && <Button onClick={onEdit}>Mở chỉnh sửa</Button>}
        </>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
