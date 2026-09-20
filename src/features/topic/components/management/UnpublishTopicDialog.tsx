import { Button } from "@/core/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/shadcn/dialog";
import { AlertTriangle, EyeOff, Info, Users } from "lucide-react";
import type { Topic } from "../../types/topic.types";

interface UnpublishTopicDialogProps {
  topic: Topic | null;
  onClose: () => void;
  onConfirm: (topic: Topic) => void;
}

export default function UnpublishTopicDialog({
  topic,
  onClose,
  onConfirm,
}: UnpublishTopicDialogProps) {
  return (
    <Dialog open={topic !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl overflow-hidden rounded-xl border-outline-variant bg-surface-container-lowest p-0">
        <DialogHeader className="flex-row items-start gap-4 bg-surface-container-low p-4 text-left">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
            <AlertTriangle className="size-[26px]" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="w-fit rounded-md bg-secondary-fixed px-2 py-0.5 text-label-sm font-semibold tracking-wider text-on-secondary-fixed uppercase">
              Hành động quan trọng
            </span>
            <DialogTitle className="mt-1 text-headline-md font-semibold tracking-tight text-on-surface">
              Xác nhận Hủy xuất bản Chủ đề?
            </DialogTitle>
            <DialogDescription className="sr-only">
              Xác nhận chuyển chủ đề về trạng thái bản nháp
            </DialogDescription>
          </span>
        </DialogHeader>

        {topic && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2 rounded-xl bg-surface-container p-4">
              <div className="flex items-center justify-between">
                <span className="text-label-sm font-semibold tracking-wider text-primary uppercase">
                  Chủ đề chịu tác động
                </span>
                <span className="rounded bg-surface-container-high px-2 py-0.5 text-label-sm text-on-surface-variant">
                  ID: {topic.code}
                </span>
              </div>
              <div className="mt-1 flex items-start gap-3">
                <img
                  src={topic.thumbnail}
                  alt=""
                  loading="lazy"
                  className="size-12 shrink-0 rounded-lg object-cover"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-headline-sm font-semibold text-on-surface">
                    {topic.titleEn}
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    {topic.titleVi}
                  </span>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-surface-container-high pt-2 text-label-sm text-on-surface-variant">
                <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-semibold text-on-surface">
                  Trình độ: {topic.cefr}
                </span>
                <span className="rounded bg-surface-container-lowest px-2 py-0.5">
                  {topic.itemsLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-error-container/30 p-3.5 text-on-error-container">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-label-lg font-semibold">
                  1,240 học viên đang theo học
                </span>
                <span className="text-label-sm text-on-error-container/70">
                  Chủ đề này có lưu lượng truy cập cao trong 7 ngày qua.
                </span>
              </span>
            </div>

            <div className="flex gap-2.5 rounded-xl bg-surface-container-low p-3.5 text-body-md text-on-surface-variant">
              <Info className="mt-0.5 size-5 shrink-0 text-outline" aria-hidden="true" />
              <p className="leading-snug">
                Khi hủy xuất bản, chủ đề sẽ chuyển sang trạng thái{" "}
                <strong className="text-on-surface">Bản nháp (Draft)</strong> và tạm thời
                ẩn khỏi màn hình Khám phá của học viên. Tiến trình và điểm số của những
                người học đã tích lũy sẽ{" "}
                <strong className="text-on-surface">được lưu giữ an toàn</strong> và phục
                hồi nguyên vẹn khi bạn xuất bản lại.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-end gap-2 bg-surface-container-low p-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-outline-variant bg-surface-container-lowest shadow-sm"
            >
              Hủy bỏ / Quay lại
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => topic && onConfirm(topic)}
            className="rounded-xl shadow-sm"
          >
            <EyeOff className="size-[18px]" aria-hidden="true" />
            Xác nhận Hủy xuất bản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
