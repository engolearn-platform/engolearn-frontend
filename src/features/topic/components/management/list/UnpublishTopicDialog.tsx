import { AlertTriangle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/shadcn/dialog";
import type { TopicManagementResponse } from "@features/topic/types/topic-management.types";

interface UnpublishTopicDialogProps {
  topic: TopicManagementResponse | null;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function UnpublishTopicDialog({
  topic,
  busy,
  error,
  onClose,
  onConfirm,
}: UnpublishTopicDialogProps) {
  return (
    <Dialog open={topic !== null} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="rounded-2xl border-outline-variant bg-surface-container-lowest sm:max-w-lg" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-headline-md">
            <AlertTriangle className="size-5 text-secondary" aria-hidden="true" />
            Xác nhận gỡ xuất bản
          </DialogTitle>
          <DialogDescription>
            {topic ? `Gỡ xuất bản “${topic.titleEn}” (${topic.titleVi}).` : "Gỡ xuất bản chủ đề này."} Lịch sử bản phát hành, tiến trình và các lượt học đã ghim phiên bản sẽ tiếp tục được lưu.
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="rounded-lg bg-error/5 p-3 text-body-sm text-error">{error}</p>}
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Đóng</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
            {busy ? "Đang gỡ xuất bản…" : "Xác nhận gỡ xuất bản"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
