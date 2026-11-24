import TopicMediaUpload from "@features/topic/components/management/upsert/TopicMediaUpload";
import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { TOPIC_EXPRESSION_TYPE_OPTIONS } from "@features/topic/types/topic-create.types";
import type { TopicExpressionExampleResource, TopicExpressionLabel } from "@features/topic/types/topic-management.types";

export const EXPRESSION_LABELS: Record<TopicExpressionLabel, string> = {
  COMMON: "Phổ biến",
  POLITE: "Lịch sự",
  SLOT_HINT: "Câu gợi ý thế chỗ",
};

const empty: TopicExpressionExampleResource = {
  textEn: null, textVi: null, type: null, label: null, usageNote: null, audioUrl: null, linkedVocabIds: null,
};

const fieldClass = "w-full rounded-lg bg-surface-container-low px-3 py-2 text-body-md text-on-surface";

export default function ExpressionUpsertDialog({ initial, vocabulary, onClose, onSubmit, topicId }: {
  initial?: TopicExpressionExampleResource;
  vocabulary: Map<string, string>;
  topicId: string;
  onClose: () => void;
  onSubmit: (draft: TopicExpressionExampleResource) => void;
}) {
  const [draft, setDraft] = useState(initial ?? empty);
  const patch = (update: Partial<TopicExpressionExampleResource>) => setDraft((value) => ({ ...value, ...update }));
  const linked = draft.linkedVocabIds ?? [];
  const close = () => {
    if (draft === (initial ?? empty) || window.confirm("Bỏ nội dung đang nhập?")) onClose();
  };

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{initial ? "Sửa mẫu câu" : "Thêm mẫu câu"}</DialogTitle>
        <DialogDescription>Mẫu câu sẽ được ghi khi bạn bấm Lưu nháp.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span>Mẫu câu tiếng Anh</span>
          <textarea className={fieldClass} value={draft.textEn ?? ""} onChange={(event) => patch({ textEn: event.target.value || null })} />
        </label>
        <label className="grid gap-1">
          <span>Bản dịch tiếng Việt</span>
          <textarea className={fieldClass} value={draft.textVi ?? ""} onChange={(event) => patch({ textVi: event.target.value || null })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span>Loại mẫu câu</span>
            <select className={fieldClass} value={draft.type ?? ""} onChange={(event) => patch({ type: event.target.value || null })}>
              <option value="">Chưa chọn</option>
              {TOPIC_EXPRESSION_TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span>Nhãn mẫu câu</span>
            <select className={fieldClass} value={draft.label ?? ""} onChange={(event) => patch({ label: (event.target.value || null) as TopicExpressionLabel | null })}>
              <option value="">Chưa chọn</option>
              {Object.entries(EXPRESSION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <label className="grid gap-1">
          <span>Ghi chú cách dùng</span>
          <textarea className={fieldClass} value={draft.usageNote ?? ""} onChange={(event) => patch({ usageNote: event.target.value || null })} />
        </label>
        <label className="grid gap-1">
          <span>Đường dẫn audio mẫu câu</span>
          <input className={fieldClass} value={draft.audioUrl ?? ""} onChange={(event) => patch({ audioUrl: event.target.value || null })} />
        </label>
        <TopicMediaUpload topicId={topicId} kind="audio" onUploaded={(audioUrl) => patch({ audioUrl })} />
        {(vocabulary.size > 0 || linked.length > 0) && <fieldset className="grid gap-1">
          <legend>Từ vựng liên kết</legend>
          {Array.from(new Set([...vocabulary.keys(), ...linked])).map((id) => <label key={id} className="flex items-center gap-2">
            <input type="checkbox" checked={linked.includes(id)}
              onChange={(event) => patch({ linkedVocabIds: event.target.checked ? [...linked, id] : linked.filter((value) => value !== id) })} />
            {vocabulary.get(id) ?? id}
          </label>)}
        </fieldset>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>Hủy</Button>
        <Button type="button" onClick={() => onSubmit(draft)}>Áp dụng vào bản nháp</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
