import { useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import type { PassageListItem } from "@features/learning-path/types/passage-management.types";
import type { HttpError } from "@shared/services/http.service";

export default function PassageRetireDialog({ item, onClose, onRetired }: {
  item: PassageListItem; onClose: () => void; onRetired: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  const retire = async () => {
    if (lock.current || error || item.status !== "ACTIVE") return;
    lock.current = true;
    setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      await passageManagementService.retire(item.passageId, item.revision, controller.signal);
      if (!controller.signal.aborted) onRetired();
    } catch (reason) {
      if (controller.signal.aborted) return;
      const failure = reason as HttpError;
      const problem = failure.problem;
      const count = problem && typeof problem === "object" && "activeQuestionCount" in problem
        ? problem.activeQuestionCount : undefined;
      setError(failure.status === 409 && failure.code === "PASSAGE_ACTIVE_REFERENCES"
        ? `Không thể ngưng sử dụng: passage còn ${typeof count === "number" && Number.isSafeInteger(count) && count > 0 ? `${count.toLocaleString("vi-VN")} ` : ""}câu hỏi đang sử dụng tham chiếu. Cần xử lý các câu hỏi đó trước.`
        : failure.status === 409 ? "Passage đã thay đổi trạng thái hoặc phiên bản. Hãy đóng và tải lại danh sách."
        : failure.status === 404 ? "Passage không còn tồn tại. Hãy đóng và tải lại danh sách."
        : failure.status === 401 ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại và kiểm tra trạng thái passage."
        : failure.status === 403 ? "Bạn không có quyền ngưng sử dụng passage này."
        : "Chưa xác định được kết quả ngưng sử dụng. Hãy đóng và tải lại trạng thái trước khi thử lại.");
    } finally {
      lock.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}>
    <DialogContent showCloseButton={!busy} className="bg-surface-container-lowest">
      <DialogHeader>
        <DialogTitle>Ngưng sử dụng passage?</DialogTitle>
        <DialogDescription>Passage “{item.title}” sẽ chuyển sang trạng thái ngừng sử dụng. Chỉ thực hiện được khi không còn câu hỏi đang sử dụng tham chiếu. Nội dung, audio và các lộ trình đã giao vẫn được giữ nguyên.</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-body-md text-error">{error}</p>}
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>{error ? "Đóng và tải lại" : "Hủy"}</Button>
        <Button className="bg-error text-on-error hover:bg-error/90" disabled={busy || !!error || item.status !== "ACTIVE"}
          onClick={() => void retire()}>{busy ? "Đang ngưng sử dụng..." : "Ngưng sử dụng"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
