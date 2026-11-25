import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import type { PassageListItem } from "@features/learning-path/types/passage-management.types";
import type { HttpError } from "@shared/services/http.service";

export default function PassageDeleteDialog({ item, onClose, onDeleted }: {
  item: PassageListItem; onClose: () => void; onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const remove = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try { await passageManagementService.delete(item.passageId, item.revision); onDeleted(); }
    catch (reason) {
      const failure = reason as HttpError;
      setBlocked(failure.status === 409 || failure.status === 404);
      setError(failure.status === 409
        ? "Không thể xóa: passage đã thay đổi trạng thái, được cập nhật hoặc đã có câu hỏi tham chiếu. Hãy đóng và tải lại danh sách."
        : failure.status === 404 ? "Passage không còn tồn tại. Hãy đóng và tải lại danh sách." : failure.message || "Không xóa được passage. Vui lòng thử lại.");
    } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent showCloseButton={!busy} className="bg-surface-container-lowest">
      <DialogHeader><DialogTitle>Xóa passage bản nháp?</DialogTitle>
        <DialogDescription>Passage “{item.title}” sẽ bị xóa. Chỉ xóa được khi chưa có câu hỏi tham chiếu.</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-body-md text-error">{error}</p>}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>Hủy</Button>
        <Button className="bg-error text-on-error hover:bg-error/90" disabled={busy || blocked} onClick={() => void remove()}>{busy ? "Đang xóa..." : "Xóa passage"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
