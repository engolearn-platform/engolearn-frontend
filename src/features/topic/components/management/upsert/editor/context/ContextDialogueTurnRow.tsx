import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import TopicMediaUpload from "@features/topic/components/management/upsert/TopicMediaUpload";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";
import type { TopicContextResource } from "@features/topic/types/topic-management.types";

type Dialogue = TopicContextResource["dialogue"][number];

interface ContextDialogueTurnRowProps {
  turn: Dialogue;
  onChange: (patch: Partial<Dialogue>) => void;
  onRemove: () => void;
  onUp?: () => void;
  onDown?: () => void;
  topicId: string;
}

export default function ContextDialogueTurnRow({ turn, onChange, onRemove, onUp, onDown, topicId }: ContextDialogueTurnRowProps) {
  const speakerLabel = turn.speaker?.trim() || "người nói";
  const fieldClass = "w-full rounded bg-surface-container-lowest px-2 py-1 text-body-md text-on-surface focus:ring-2 focus:ring-primary";
  const audio = playableManagementMediaUrl(turn.audioUrl);
  return (
    <div className="grid gap-3 rounded-lg bg-surface-container-lowest p-3 shadow-sm sm:grid-cols-[6rem_1fr_auto]">
      <input value={turn.speaker ?? ""} onChange={(event) => onChange({ speaker: event.target.value || null })}
        placeholder="Tên…" aria-label="Tên người nói" className={fieldClass} />
      <div className="grid min-w-0 gap-2">
        <input value={turn.textEn ?? ""} onChange={(event) => onChange({ textEn: event.target.value || null })}
          placeholder="Câu thoại tiếng Anh…" aria-label={`Lời thoại của ${speakerLabel} (tiếng Anh)`} className={fieldClass} />
        <input value={turn.textVi ?? ""} onChange={(event) => onChange({ textVi: event.target.value || null })}
          placeholder="Nghĩa tiếng Việt…" aria-label="Nghĩa tiếng Việt của lời thoại" className={fieldClass} />
        <input value={turn.audioUrl ?? ""} onChange={(event) => onChange({ audioUrl: event.target.value || null })}
          placeholder="Đường dẫn audio" aria-label="Đường dẫn audio lời thoại" className={fieldClass} />
        <TopicMediaUpload topicId={topicId} kind="audio" onUploaded={(audioUrl) => onChange({ audioUrl })} />
        {audio && <audio controls preload="none" src={audio} className="max-w-full" />}
      </div>
      <div className="flex items-start gap-1">
        {onUp && <Button type="button" size="sm" variant="ghost" onClick={onUp} aria-label="Đưa dòng thoại lên"><ArrowUp /></Button>}
        {onDown && <Button type="button" size="sm" variant="ghost" onClick={onDown} aria-label="Đưa dòng thoại xuống"><ArrowDown /></Button>}
        <Button type="button" size="sm" variant="ghost" onClick={onRemove} aria-label="Xóa dòng thoại"><Trash2 /></Button>
      </div>
    </div>
  );
}
