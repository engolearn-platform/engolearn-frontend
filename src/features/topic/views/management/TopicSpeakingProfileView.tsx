import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { HasRole } from "@features/auth/contract";
import type { SpeakingProfile, SpeakingProfileState } from "@features/speaking/contract";
import { topicSpeakingProfileService } from "@features/topic/services/topic-speaking-profile.service";
import { isSpeakingProfileRevisionConflict, validateSpeakingProfile } from "@features/topic/utils/speaking-profile.validation";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
const input = "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:bg-surface-container-low";
const emptyProfile = (): SpeakingProfile => ({ enabled: false, level: null, description: "", aiRole: "", learnerRole: "", suggestedTopics: [], selectedResourceIds: [], fallbackReply: "", fallbackHint: null });
function draftFrom(state: SpeakingProfileState): SpeakingProfile { return structuredClone(state.draft ?? state.published ?? emptyProfile()); }
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-2 text-label-lg font-medium text-on-surface">{label}{children}</label>;
}

export default function TopicSpeakingProfileView() {
  const { topicId = "", itemId } = useParams();
  const [state, setState] = useState<SpeakingProfileState | null>(null); const [profile, setProfile] = useState<SpeakingProfile>(emptyProfile);
  const [saved, setSaved] = useState<SpeakingProfile | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [conflict, setConflict] = useState(false); const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await topicSpeakingProfileService.get(topicId, itemId); const next = draftFrom(result);
      setState(result); setProfile(next); setSaved(structuredClone(next)); setConflict(false); setNotice(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ Speaking."); }
    finally { setLoading(false); }
  }, [topicId, itemId]);
  useEffect(() => { void load(); }, [load]);
  const validationErrors = useMemo(() => validateSpeakingProfile(profile), [profile]);
  const changed = JSON.stringify(profile) !== JSON.stringify(saved);
  function patch(patchValue: Partial<SpeakingProfile>) { setProfile(previous => ({ ...previous, ...patchValue })); setNotice(""); }
  async function save() {
    if (!state || validationErrors.length || conflict) return;
    setBusy(true); setError(""); setNotice("");
    try { const next = await topicSpeakingProfileService.save(topicId, itemId, state.revision, profile); const savedProfile = draftFrom(next);
      setState(next); setProfile(savedProfile); setSaved(structuredClone(savedProfile)); setConflict(false); setNotice("Đã lưu bản nháp Speaking."); }
    catch (cause) { if (isSpeakingProfileRevisionConflict(cause)) setConflict(true);
      setError(cause instanceof Error ? cause.message : "Không lưu được bản nháp."); }
    finally { setBusy(false); }
  }
  async function publish() {
    if (!state || validationErrors.length || conflict || !state.contentVersion) return;
    setBusy(true); setError(""); setNotice("");
    try { const next = await topicSpeakingProfileService.publish(topicId, itemId, state.revision); const publishedProfile = draftFrom(next);
      setState(next); setProfile(publishedProfile); setSaved(structuredClone(publishedProfile)); setConflict(false); setNotice("Đã xuất bản hồ sơ cho bản nội dung đang phát hành."); }
    catch (cause) { if (isSpeakingProfileRevisionConflict(cause)) setConflict(true);
      setError(cause instanceof Error ? cause.message : "Không xuất bản được hồ sơ."); }
    finally { setBusy(false); }
  }
  const backTo = `/admin/topics/${encodeURIComponent(topicId)}/edit`;
  return <main className="mx-auto grid w-full max-w-4xl gap-5 px-5 py-8">
    <header><p className="font-semibold text-primary">QUẢN LÝ CHỦ ĐỀ</p><h1 className="mt-1 text-headline-lg font-bold">Hồ sơ Speaking</h1>
      <p className="mt-2 text-on-surface-variant">{itemId ? "Cấu hình hội thoại cho mục học này." : "Cấu hình hội thoại chung cho chủ đề."} Hồ sơ không thay đổi tiến độ học tập.</p></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-4"><span>{error}</span><Button variant="outline" className="min-h-12" onClick={() => void load()}>Tải lại</Button></div>}
    {conflict && <div role="alert" className="rounded-xl border border-learning-note bg-learning-note p-4 text-learning-note-ink"><p>Bản nháp đã thay đổi ở nơi khác. Tải lại để tiếp tục với phiên bản mới.</p>
      <Button variant="outline" className="mt-3 min-h-12" onClick={() => void load()}>Tải bản mới</Button></div>}
    {notice && <p role="status" className="rounded-lg bg-learning-mint p-3 text-primary">{notice}</p>}
    {loading && <p role="status">Đang tải hồ sơ Speaking…</p>}
    {state && !loading && <HasRole allowedRoles={["CONTENT_MANAGER"]} fallback={<p role="alert">Bạn không có quyền chỉnh sửa hồ sơ Speaking.</p>}>
      <div className="grid gap-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <section className="grid gap-2"><label className="flex min-h-12 items-center gap-3 font-semibold"><input type="checkbox" checked={profile.enabled} disabled={busy || conflict} onChange={event => patch({ enabled: event.target.checked })} className="size-5 accent-primary" />Bật Speaking cho phạm vi này</label>
          <p className="text-sm leading-6 text-on-surface-variant">Hồ sơ tắt hoặc để trống vẫn có thể xuất bản. Chỉ hồ sơ bật mới cần các trường bắt buộc.</p></section>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trình độ CEFR"><select className={input} disabled={busy || conflict} value={profile.level ?? ""} onChange={event => patch({ level: event.target.value || null })}><option value="">Chưa chọn</option>{levels.map(level => <option key={level}>{level}</option>)}</select></Field>
          <Field label="Mô tả tình huống"><input className={input} disabled={busy || conflict} value={profile.description} onChange={event => patch({ description: event.target.value })} placeholder="Ví dụ: Order a drink in a cafe." /></Field>
          <Field label="Vai trò AI"><input className={input} disabled={busy || conflict} value={profile.aiRole} onChange={event => patch({ aiRole: event.target.value })} placeholder="Barista" /></Field>
          <Field label="Vai trò người học"><input className={input} disabled={busy || conflict} value={profile.learnerRole} onChange={event => patch({ learnerRole: event.target.value })} placeholder="Customer" /></Field>
        </div>
        <Field label="Chủ đề gợi ý"><textarea className={`${input} min-h-24`} disabled={busy || conflict} value={profile.suggestedTopics.join("\n")} onChange={event => patch({ suggestedTopics: event.target.value.split("\n").map(value => value.trim()).filter(Boolean) })} placeholder="Mỗi dòng là một chủ đề gợi ý" /></Field>
        <section className="grid gap-3"><h2 className="text-headline-md font-semibold">Tài nguyên được chọn</h2>
          <p className="text-sm leading-6 text-on-surface-variant">Chỉ chọn tài nguyên đã phát hành trong phạm vi hồ sơ này.</p>
          {state.resources.map(resource => <label key={resource.id} className="flex min-h-12 items-center gap-3 rounded-lg border border-outline-variant p-3"><input type="checkbox" checked={profile.selectedResourceIds.includes(resource.id)} disabled={busy || conflict} onChange={event => patch({ selectedResourceIds: event.target.checked ? [...profile.selectedResourceIds, resource.id] : profile.selectedResourceIds.filter(id => id !== resource.id) })} className="size-5 accent-primary" />
            <span>{resource.textEn} <span className="text-sm text-on-surface-variant">({resource.type === "VOCABULARY" ? "Từ vựng" : "Cụm diễn đạt"})</span></span></label>)}
          {profile.selectedResourceIds.filter(id => !state.resources.some(resource => resource.id === id)).map(id => <div key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-learning-note bg-learning-note p-3 text-learning-note-ink"><span>Tài nguyên đã ẩn hoặc không còn khả dụng: {id}</span><Button type="button" variant="outline" className="min-h-12" disabled={busy || conflict} onClick={() => patch({ selectedResourceIds: profile.selectedResourceIds.filter(value => value !== id) })}>Bỏ chọn</Button></div>)}
          {!state.resources.length && !profile.selectedResourceIds.length && <p className="text-sm text-on-surface-variant">Chưa có tài nguyên được phát hành.</p>}
        </section>
        <Field label="Câu trả lời dự phòng · English"><textarea className={`${input} min-h-24`} disabled={busy || conflict} value={profile.fallbackReply} onChange={event => patch({ fallbackReply: event.target.value })} placeholder="I can help with that. What would you like to know?" /></Field>
        <fieldset className="grid gap-4 rounded-xl border border-outline-variant p-4"><legend className="px-1 font-semibold">Gợi ý dự phòng · tùy chọn</legend>
          <Field label="Câu mẫu · English"><input className={input} disabled={busy || conflict} value={profile.fallbackHint?.exampleEn ?? ""} onChange={event => patch({ fallbackHint: event.target.value || profile.fallbackHint?.explanationVi ? { exampleEn: event.target.value, explanationVi: profile.fallbackHint?.explanationVi ?? "" } : null })} /></Field>
          <Field label="Giải thích · Tiếng Việt"><input className={input} disabled={busy || conflict} value={profile.fallbackHint?.explanationVi ?? ""} onChange={event => patch({ fallbackHint: event.target.value || profile.fallbackHint?.exampleEn ? { exampleEn: profile.fallbackHint?.exampleEn ?? "", explanationVi: event.target.value } : null })} /></Field>
        </fieldset>
        {validationErrors.length > 0 && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-error"><p className="font-semibold">Hoàn thiện hồ sơ đang bật:</p><ul className="mt-1 list-disc pl-5">{validationErrors.map(error => <li key={error}>{error}</li>)}</ul></div>}
        {!state.contentVersion && <p className="rounded-lg bg-learning-note p-3 text-learning-note-ink">Chưa có bản nội dung đang phát hành. Có thể lưu bản nháp; xuất bản hồ sơ sẽ khả dụng khi nội dung đã được phát hành.</p>}
        <div className="flex flex-wrap gap-3"><Button className="min-h-12" disabled={busy || conflict || validationErrors.length > 0 || !changed} onClick={() => void save()}>{busy ? "Đang lưu…" : "Lưu bản nháp"}</Button>
          <Button variant="outline" className="min-h-12" disabled={busy || conflict || validationErrors.length > 0 || !state.contentVersion} onClick={() => void publish()}>{busy ? "Đang xử lý…" : "Xuất bản hồ sơ"}</Button>
          <Button variant="outline" className="min-h-12" asChild><Link to={backTo}>Quay lại quản lý chủ đề</Link></Button></div>
        <p className="text-sm text-on-surface-variant">Bản nháp revision {state.revision}{state.published ? " · Đã có hồ sơ xuất bản" : " · Chưa xuất bản hồ sơ"}</p>
      </div>
    </HasRole>}
  </main>;
}
