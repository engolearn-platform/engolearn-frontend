import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import type { HttpError } from "@shared/services/http.service";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import { PASSAGE_LEVELS, PASSAGE_SKILL_LABELS } from "@features/learning-path/types/passage-management.types";
import type { PassageDetail, PassageLevel, PassageSkill } from "@features/learning-path/types/passage-management.types";
import { PassageStatusBadge } from "./PassageManagementTable";

export type PassageWorkspace = { mode: "create" } | { mode: "view" | "edit"; passageId: string };
const fieldClass = "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md focus-visible:outline-2 focus-visible:outline-primary";

function PassageEditor({ detail, onSaved, onCancel, onBusy }: {
  detail?: PassageDetail; onSaved: () => void; onCancel: () => void; onBusy: (value: boolean) => void;
}) {
  const [title, setTitle] = useState(detail?.title ?? "");
  const [skill, setSkill] = useState<PassageSkill>(detail?.skill ?? "READING");
  const [level, setLevel] = useState<PassageLevel>(detail?.level ?? "A1");
  const [text, setText] = useState(detail?.text ?? "");
  const [transcript, setTranscript] = useState(detail?.transcript ?? "");
  const [audio, setAudio] = useState<File>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const hasExistingAudio = !!(detail?.audio?.url || detail?.audioMediaId);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || conflict) return;
    setError("");
    if (!title.trim() || !(skill === "READING" ? text : transcript).trim()) {
      setError("Hãy nhập tiêu đề và nội dung passage."); return;
    }
    if (skill === "LISTENING") {
      if (!audio && !hasExistingAudio) { setError("Hãy chọn file audio MP3 hoặc WAV cho passage Listening."); return; }
      if (audio && (audio.size === 0 || audio.size > 25 * 1024 * 1024 || !/\.(mp3|wav)$/i.test(audio.name))) {
        setError("Audio phải là file MP3 hoặc WAV, không rỗng và tối đa 25 MiB."); return;
      }
    }
    const input = {
      title: title.trim(), skill, level,
      ...(skill === "READING" ? { text: text.trim() } : { transcript: transcript.trim() }),
      ...(detail ? { revision: detail.revision } : {}),
    };
    setBusy(true); onBusy(true);
    try {
      if (detail) await passageManagementService.update(detail.passageId, input, skill === "LISTENING" ? audio : undefined);
      else await passageManagementService.create(input, skill === "LISTENING" ? audio : undefined);
      onSaved();
    } catch (reason) {
      const failure = reason as HttpError;
      if (failure.status === 409) {
        setConflict(true);
        setError("Không lưu được: passage đã thay đổi hoặc kỹ năng/trình độ không khớp các câu hỏi hiện có. Hãy đóng và mở lại để kiểm tra dữ liệu mới nhất.");
      } else if (failure.status === 413) setError("File vượt giới hạn tải lên của máy chủ. Hãy chọn file nhỏ hơn.");
      else setError(failure.message || "Không lưu được passage. Vui lòng thử lại.");
    } finally { setBusy(false); onBusy(false); }
  };
  return <form onSubmit={event => void save(event)} className="space-y-4">
    <fieldset disabled={busy} className="space-y-4">
      <label className="block space-y-2"><span className="text-label-lg font-semibold">Tiêu đề <span aria-hidden="true">*</span></span>
        <input className={fieldClass} required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2"><span className="text-label-lg font-semibold">Kỹ năng</span>
          <select className={fieldClass} value={skill} onChange={event => { setSkill(event.target.value as PassageSkill); setAudio(undefined); }}>
            {Object.entries(PASSAGE_SKILL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block space-y-2"><span className="text-label-lg font-semibold">Trình độ CEFR</span>
          <select className={fieldClass} value={level} onChange={event => setLevel(event.target.value as PassageLevel)}>
            {PASSAGE_LEVELS.map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label className="block space-y-2"><span className="text-label-lg font-semibold">{skill === "READING" ? "Nội dung bài đọc" : "Transcript"} <span aria-hidden="true">*</span></span>
        <textarea className={fieldClass} required maxLength={50000} rows={8} value={skill === "READING" ? text : transcript}
          onChange={event => skill === "READING" ? setText(event.target.value) : setTranscript(event.target.value)} />
      </label>
      {skill === "LISTENING" && <label className="block space-y-2"><span className="text-label-lg font-semibold">Audio {hasExistingAudio ? "thay thế (tùy chọn)" : "*"}</span>
        <input key={skill} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav" required={!hasExistingAudio}
          className={fieldClass} onChange={event => setAudio(event.target.files?.[0])} />
        <span className="block text-label-sm text-on-surface-variant">MP3 hoặc WAV, tối đa 25 MiB.{hasExistingAudio ? " Không chọn file mới sẽ giữ audio hiện tại." : ""}</span>
      </label>}
      {detail?.skill === "LISTENING" && skill === "READING" && <p className="text-label-sm text-on-surface-variant">Chuyển sang Reading sẽ gỡ audio và transcript khỏi passage.</p>}
    </fieldset>
    {error && <p role="alert" className="text-body-md text-error">{error}</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Hủy</Button>
      <Button type="submit" disabled={busy || conflict}>{busy ? "Đang lưu..." : detail ? "Lưu thay đổi" : "Tạo bản nháp"}</Button>
    </DialogFooter>
  </form>;
}

function PassagePreview({ detail, onReload }: { detail: PassageDetail; onReload: () => void }) {
  const [audioError, setAudioError] = useState(false);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 text-label-sm">
      <span>{PASSAGE_SKILL_LABELS[detail.skill]}</span><span>{detail.level}</span><PassageStatusBadge status={detail.status} />
    </div>
    <p className="break-all text-label-sm text-on-surface-variant">{detail.passageId}</p>
    {detail.skill === "LISTENING" && <section className="space-y-3 rounded-xl bg-surface-container-low p-4" aria-label="Nghe audio">
      {detail.audio?.url ? <audio controls preload="none" src={detail.audio.url} onError={() => setAudioError(true)} className="w-full">Trình duyệt không hỗ trợ audio.</audio>
        : <p>Passage chưa có audio.</p>}
      {audioError && <p role="alert" className="text-error">Không phát được audio. Bạn có thể tải lại liên kết nghe.</p>}
      {detail.audio && <Button variant="outline" onClick={onReload}>Tải lại liên kết audio</Button>}
    </section>}
    <section className="space-y-2">
      <h3 className="text-label-lg font-semibold">{detail.skill === "READING" ? "Nội dung bài đọc" : "Transcript"}</h3>
      <p className="whitespace-pre-wrap break-words text-body-md">{(detail.skill === "READING" ? detail.text : detail.transcript) || "Chưa có nội dung."}</p>
    </section>
  </div>;
}

export default function PassageWorkspaceDialog({ workspace, onClose, onSaved }: {
  workspace: PassageWorkspace; onClose: () => void; onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const id = workspace.mode === "create" ? undefined : workspace.passageId;
  const fetchDetail = useCallback((signal: AbortSignal) => passageManagementService.detail(id!, signal), [id]);
  const { data, loading, error, refetch } = useFetch(fetchDetail, !!id);
  const title = workspace.mode === "create" ? "Tạo passage bản nháp" : workspace.mode === "edit" ? "Sửa passage bản nháp" : "Chi tiết passage";
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent showCloseButton={!busy} className="max-h-[90dvh] overflow-y-auto bg-surface-container-lowest sm:max-w-3xl">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>
        {workspace.mode === "view" ? data?.title ?? "Xem nội dung passage." : "Biên soạn bài đọc hoặc bài nghe cho kho passages."}
      </DialogDescription></DialogHeader>
      {workspace.mode === "create" ? <PassageEditor onSaved={onSaved} onCancel={onClose} onBusy={setBusy} />
        : loading ? <Loading /> : error ? <div className="space-y-3"><p role="alert" className="text-error">{error.message}</p><Button variant="outline" onClick={refetch}>Thử lại</Button></div>
        : data && (workspace.mode === "view" ? <PassagePreview key={data.audio?.url ?? data.updatedAt} detail={data} onReload={refetch} />
          : data.status === "DRAFT" ? <PassageEditor detail={data} onSaved={onSaved} onCancel={onClose} onBusy={setBusy} />
            : <p role="alert">Chỉ passage bản nháp được chỉnh sửa. Hãy đóng và tải lại danh sách.</p>)}
    </DialogContent>
  </Dialog>;
}
