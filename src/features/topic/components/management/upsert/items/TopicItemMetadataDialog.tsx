import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { TopicApiError } from "@features/topic/services/topic-management.service";
import type { TopicItemManagementSummary, TopicItemMetadataInput } from "@features/topic/types/topic-management.types";

const inputClass = "w-full rounded-lg bg-surface-container-low px-4 py-3 text-body-md text-on-surface";

export default function TopicItemMetadataDialog({ item, onClose, onSave }: {
  item?: TopicItemManagementSummary;
  onClose: () => void;
  onSave: (input: TopicItemMetadataInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [duration, setDuration] = useState(item?.durationMinutes?.toString() ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const dirty = title !== (item?.title ?? "") || description !== (item?.description ?? "") || duration !== (item?.durationMinutes?.toString() ?? "");

  const close = () => {
    if (!pending && (!dirty || window.confirm("Bỏ các thay đổi chưa lưu của bài học?"))) onClose();
  };

  async function submit() {
    if (pending) return;
    setPending(true);
    setError("");
    setFields({});
    try {
      await onSave({ title: title.trim(), description: description.trim() || null, durationMinutes: duration === "" ? null : Number(duration) });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu bài học.");
      if (reason instanceof TopicApiError && reason.fieldErrors) {
        setFields(Object.fromEntries(reason.fieldErrors.map(({ field, message }) => [field, message])));
      }
    } finally {
      setPending(false);
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent showCloseButton={!pending}>
      <DialogHeader>
        <DialogTitle>{item ? "Sửa thông tin bài học" : "Thêm Topic Item"}</DialogTitle>
        <DialogDescription>Chỉ cần tên bài học để lưu nháp.</DialogDescription>
      </DialogHeader>
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <fieldset disabled={pending} className="space-y-4">
          <label className="block space-y-1">
            <span>Tên bài học</span>
            <input required className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={!!fields.title} />
            {fields.title && <span className="text-label-sm text-error">{fields.title}</span>}
          </label>
          <label className="block space-y-1">
            <span>Mô tả</span>
            <textarea className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={!!fields.description} />
            {fields.description && <span className="text-label-sm text-error">{fields.description}</span>}
          </label>
          <label className="block space-y-1">
            <span>Thời lượng (phút)</span>
            <input type="number" className={inputClass} value={duration} onChange={(event) => setDuration(event.target.value)} aria-invalid={!!fields.durationMinutes} />
            {fields.durationMinutes && <span className="text-label-sm text-error">{fields.durationMinutes}</span>}
          </label>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-label-sm text-error">{error}</p>}
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>Hủy</Button>
          <Button type="submit" disabled={pending || !title.trim()}>Lưu nháp bài học</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
