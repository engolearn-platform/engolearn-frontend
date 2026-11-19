import { useFetch } from "@shared/hooks";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import type { ManagementQuestionDraft } from "@features/placement/types/placement-management.types";
import { MANAGEMENT_LEVELS, MANAGEMENT_SKILLS, MANAGEMENT_SKILL_LABEL } from "@features/placement/constants/placement-management";
import { ManagementButton, ManagementCard, ManagementField, managementInputClass } from "@features/placement/components/management/PlacementManagementUi";

import { safeQuestionAudioUrl } from "@features/placement/utils/placement-management";

export function PlacementQuestionFields({ draft, onChange, editing }: { draft: ManagementQuestionDraft; onChange: (draft: ManagementQuestionDraft) => void; editing: boolean }) {
  const update = <K extends keyof ManagementQuestionDraft>(key: K, value: ManagementQuestionDraft[K]) => onChange({ ...draft, [key]: value });
  return <>
    <ManagementCard className="grid gap-4 sm:grid-cols-3">
      <ManagementField label="Mã câu hỏi *"><input className={managementInputClass} required value={draft.code} onChange={(event) => update("code", event.target.value)} autoComplete="off" /></ManagementField>
      <ManagementField label="Kỹ năng" hint={editing ? "Kỹ năng được giữ cố định khi sửa câu." : "Chọn kỹ năng trước khi nhập nội dung."}><select className={managementInputClass} disabled={editing} value={draft.skill} onChange={(event) => update("skill", event.target.value as ManagementQuestionDraft["skill"])}>{MANAGEMENT_SKILLS.map((skill) => <option key={skill} value={skill}>{MANAGEMENT_SKILL_LABEL[skill]}</option>)}</select></ManagementField>
      <ManagementField label="Trình độ CEFR"><select className={managementInputClass} value={draft.level} onChange={(event) => update("level", event.target.value as ManagementQuestionDraft["level"])}>{MANAGEMENT_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></ManagementField>
    </ManagementCard>
    {draft.skill === "LISTENING" && <ManagementCard className="space-y-4"><h2 className="text-title-lg font-semibold">Audio & transcript</h2>
      <QuestionAudioPicker value={draft.audioUrl} onChange={value => update("audioUrl", value)} />
      <ManagementField label="Transcript" hint="Ẩn trong lúc làm bài. Cần có trước khi câu được thêm vào bộ đề."><textarea rows={4} className={managementInputClass} value={draft.transcript} onChange={(event) => update("transcript", event.target.value)} /></ManagementField>
    </ManagementCard>}
    <ManagementCard className="space-y-5">
      <ManagementField label={draft.skill === "READING" ? "Đoạn đọc (tùy chọn)" : "Ngữ cảnh (tùy chọn)"}><textarea rows={4} className={managementInputClass} value={draft.passage} onChange={(event) => update("passage", event.target.value)} /></ManagementField>
      <ManagementField label="Nội dung câu hỏi *"><textarea required rows={3} className={managementInputClass} value={draft.prompt} onChange={(event) => update("prompt", event.target.value)} /></ManagementField>
      <fieldset className="space-y-3"><legend className="mb-3 text-label-lg font-semibold">Bốn phương án * · Chọn một đáp án đúng</legend>
        {draft.options.map((option) => <div key={option.id} className="flex items-center gap-3 rounded-xl border border-outline-variant p-3">
          <label className="flex min-h-12 shrink-0 items-center gap-2 font-semibold"><input type="radio" name="correct-option" required checked={draft.correctOptionId === option.id} onChange={() => update("correctOptionId", option.id)} aria-label={`Đáp án ${option.label} đúng`} />{option.label}</label>
          <input required className={managementInputClass} aria-label={`Phương án ${option.label}`} value={option.text} onChange={(event) => update("options", draft.options.map((current) => current.id === option.id ? { ...current, text: event.target.value } : current))} />
        </div>)}
      </fieldset>
      <ManagementField label="Giải thích (tùy chọn)"><textarea rows={3} className={managementInputClass} value={draft.explanation} onChange={(event) => update("explanation", event.target.value)} /></ManagementField>
    </ManagementCard>
  </>;
}

function QuestionAudioPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { service } = usePlacementManagement();
  const { data, loading, error, refetch } = useFetch(service.listAudio);
  const audioUrl = safeQuestionAudioUrl(value);
  return <>
    <ManagementField label="Audio có sẵn" hint="Chọn đúng audio cho transcript và nghe thử trước khi lưu.">
      <select className={managementInputClass} value={value} onChange={event => onChange(event.target.value)} disabled={loading || !!error}>
        <option value="">Chưa chọn audio</option>
        {value && !data?.some(item => item.audioUrl === value) && <option value={value}>Audio hiện tại</option>}
        {data?.map(item => <option key={item.audioUrl} value={item.audioUrl}>
          {item.title || item.audioUrl.split("/").pop()?.slice(0, 12)} · {item.durationSeconds.toFixed(1)} giây
        </option>)}
      </select>
    </ManagementField>
    {error && <div role="alert"><p className="text-error">{error.message}</p><ManagementButton type="button" variant="outline" onClick={refetch}>Tải lại kho audio</ManagementButton></div>}
    {audioUrl && <audio key={audioUrl} controls preload="none" src={audioUrl} className="w-full" aria-label="Nghe thử audio câu hỏi">Trình duyệt chưa hỗ trợ phát audio.</audio>}
  </>;
}
