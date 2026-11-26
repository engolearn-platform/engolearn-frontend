import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { HasRole } from "@features/auth/contract";
import type { SpeakingProfile, SpeakingProfileState, SpeakingProfileViolation } from "@features/speaking/contract";
import { topicSpeakingProfileService } from "@features/topic/services/topic-speaking-profile.service";
import { isSpeakingProfileRevisionConflict, validateSpeakingProfile } from "@features/topic/utils/speaking-profile.validation";
import { clearResourceSelection, filterSpeakingResourceGroups, isSpeakingResourceGroupExpanded, removeResourceSelection, resourceGroupSelection, toggleResourceGroupSelection, toggleResourceSelection } from "@features/topic/utils/speaking-resource-selection";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
const input = "min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:bg-surface-container-low";
const emptyProfile = (): SpeakingProfile => ({ enabled: false, level: null, description: "", aiRole: "", learnerRole: "", suggestedTopics: [], selectedResourceIds: [], fallbackReply: "", fallbackHint: null });
function draftFrom(state: SpeakingProfileState): SpeakingProfile {
  const profile = structuredClone(state.draft ?? state.published ?? state.initialProfile ?? emptyProfile());
  return { ...profile, description: profile.description ?? "", aiRole: profile.aiRole ?? "", learnerRole: profile.learnerRole ?? "", fallbackReply: profile.fallbackReply ?? "" };
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-2 text-label-lg font-medium text-on-surface">{label}{children}</label>;
}
const fieldNames: Record<string, string> = {
  "profile.level": "Trình độ CEFR", "profile.description": "Mô tả tình huống", "profile.aiRole": "Vai trò AI",
  "profile.learnerRole": "Vai trò người học", "profile.fallbackReply": "Câu trả lời dự phòng", "profile.selectedResourceIds": "Tài nguyên được chọn",
  level: "Trình độ CEFR", description: "Mô tả tình huống", aiRole: "Vai trò AI", learnerRole: "Vai trò người học",
  fallbackReply: "Câu trả lời dự phòng", selectedResourceIds: "Tài nguyên được chọn",
};
function formatViolation(violation: SpeakingProfileViolation) {
  const field = fieldNames[violation.path];
  return field ? `${field}: ${violation.message}` : `${violation.path} (${violation.code}): ${violation.message}`;
}

function ResourceRow({ id, text, type, checked, disabled, onToggle, showType = true }: { id: string; text: string; type: string; checked: boolean; disabled: boolean; onToggle: (id: string, checked: boolean) => void; showType?: boolean }) {
  return <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-lg border border-outline-variant px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
    <input type="checkbox" checked={checked} disabled={disabled} onChange={event => onToggle(id, event.target.checked)} className="size-5 shrink-0 accent-primary" />
    <span className="min-w-0 break-words">{text}{showType && <span className="text-sm text-on-surface-variant"> ({type === "VOCABULARY" ? "Từ vựng" : "Cụm diễn đạt"})</span>}</span>
  </label>;
}

export default function TopicSpeakingProfileView() {
  const { topicId = "", itemId } = useParams();
  const scopeKey = JSON.stringify([topicId, itemId ?? null]);
  const generation = useRef(0);
  const [state, setState] = useState<SpeakingProfileState | null>(null); const [profile, setProfile] = useState<SpeakingProfile>(emptyProfile);
  const [loadedScope, setLoadedScope] = useState("");
  const [saved, setSaved] = useState<SpeakingProfile | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [serverErrors, setServerErrors] = useState<SpeakingProfileViolation[]>([]);
  const [errorAction, setErrorAction] = useState<"load" | "save" | "publish" | null>(null);
  const [conflict, setConflict] = useState(false); const [notice, setNotice] = useState(""); const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setBusy(false); setError(""); setErrorAction(null); setState(null); setLoadedScope(""); setSaved(null); setServerErrors([]);
    setConflict(false); setNotice(""); setExpanded(new Set()); setSearch("");
    try {
      const result = await topicSpeakingProfileService.get(topicId, itemId);
      if (request !== generation.current) return;
      const next = draftFrom(result);
      setState(result); setLoadedScope(scopeKey); setProfile(next); setSaved(structuredClone(next)); setConflict(false); setNotice(""); setExpanded(new Set()); setSearch("");
    } catch (cause) {
      if (request === generation.current) { setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ Speaking."); setErrorAction("load"); }
    } finally { if (request === generation.current) setLoading(false); }
  }, [topicId, itemId, scopeKey]);
  const changed = loadedScope === scopeKey && saved !== null && JSON.stringify(profile) !== JSON.stringify(saved);
  useEffect(() => { void load(); return () => { generation.current += 1; }; }, [load, scopeKey]);
  useEffect(() => {
    if (!changed) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [changed]);

  const validationErrors = useMemo(() => validateSpeakingProfile(profile), [profile]);
  const eligibleIds = useMemo(() => new Set(state?.resources.map(resource => resource.id) ?? []), [state]);
  const staleIds = profile.selectedResourceIds.filter(id => !eligibleIds.has(id));
  const groups = useMemo(() => (state?.resourceGroups ?? []).map(group => ({
    ...group,
    resources: group.resourceIds.map(id => state?.resources.find(resource => resource.id === id)).filter((resource): resource is NonNullable<typeof resource> => Boolean(resource)),
  })), [state]);
  const matchingGroups = filterSpeakingResourceGroups(groups, search);

  function patch(patchValue: Partial<SpeakingProfile>) { setProfile(previous => ({ ...previous, ...patchValue })); setNotice(""); setError(""); setErrorAction(null); setServerErrors([]); }
  function toggleResource(id: string, checked: boolean) {
    patch({ selectedResourceIds: toggleResourceSelection(profile.selectedResourceIds, id, checked) });
  }
  function toggleGroup(ids: string[]) {
    patch({ selectedResourceIds: toggleResourceGroupSelection(profile.selectedResourceIds, ids) });
  }

  async function save() {
    if (!state || busy || conflict) return;
    const request = generation.current;
    setBusy(true); setError(""); setErrorAction(null); setServerErrors([]); setNotice("");
    try {
      const next = await topicSpeakingProfileService.save(topicId, itemId, state.revision, profile);
      if (request !== generation.current) return;
      const savedProfile = draftFrom(next);
      setState(next); setProfile(savedProfile); setSaved(structuredClone(savedProfile)); setConflict(false); setNotice("Đã lưu bản nháp Speaking.");
    } catch (cause) {
      if (request !== generation.current) return;
      if (isSpeakingProfileRevisionConflict(cause)) setConflict(true);
      setServerErrors((cause as { violations?: SpeakingProfileViolation[] }).violations ?? []);
      setError(cause instanceof Error ? cause.message : "Không lưu được bản nháp.");
      setErrorAction("save");
    } finally { if (request === generation.current) setBusy(false); }
  }
  async function publish() {
    if (!state || busy || conflict || changed || !state.draft || !state.contentVersion) return;
    const request = generation.current;
    setBusy(true); setError(""); setErrorAction(null); setServerErrors([]); setNotice("");
    try {
      const next = await topicSpeakingProfileService.publish(topicId, itemId, state.revision);
      if (request !== generation.current) return;
      const publishedProfile = structuredClone(next.draft ?? next.published ?? profile);
      setState(next); setProfile(publishedProfile); setSaved(structuredClone(publishedProfile)); setConflict(false); setNotice("Đã phát hành hồ sơ Speaking.");
    } catch (cause) {
      if (request !== generation.current) return;
      if (isSpeakingProfileRevisionConflict(cause)) setConflict(true);
      setServerErrors((cause as { violations?: SpeakingProfileViolation[] }).violations ?? []);
      setError(cause instanceof Error ? cause.message : "Không xuất bản được hồ sơ.");
      setErrorAction("publish");
    } finally { if (request === generation.current) setBusy(false); }
  }
  const backTo = `/admin/topics/${encodeURIComponent(topicId)}/edit`;
  const disabled = busy || conflict || loading || loadedScope !== scopeKey;
  const currentScopeState = loadedScope === scopeKey ? state : null;
  const itemCountWithSelection = groups.filter(group => group.resources.some(resource => profile.selectedResourceIds.includes(resource.id))).length;
  function reloadAfterConflict() {
    if (changed && !window.confirm("Tải bản mới sẽ thay thế các chỉnh sửa chưa lưu. Bạn có muốn tiếp tục?")) return;
    void load();
  }
  return <main className="mx-auto grid w-full max-w-4xl gap-5 px-5 py-8">
    <header><p className="font-semibold text-primary">QUẢN LÝ CHỦ ĐỀ</p><h1 className="mt-1 text-headline-lg font-bold">Hồ sơ Speaking</h1>
      <p className="mt-2 text-on-surface-variant">{currentScopeState?.scopeTitle ?? (itemId ? "Phạm vi mục học" : "Phạm vi chủ đề")}{itemId && currentScopeState?.parentTitle ? ` · ${currentScopeState.parentTitle}` : ""}</p>
      <p className="mt-1 text-on-surface-variant">{itemId ? "Cấu hình hội thoại cho mục học này." : "Cấu hình hội thoại chung cho chủ đề."} Phát hành hồ sơ Speaking không thay đổi nội dung, tiến độ hoặc phiên bản học tập.</p></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-4"><span>{error}</span>{errorAction === "load" && <Button type="button" variant="outline" className="min-h-12" onClick={() => void load()}>Tải lại</Button>}{errorAction === "save" && <Button type="button" variant="outline" className="min-h-12" disabled={!state || disabled} onClick={() => void save()}>Thử lưu lại</Button>}{errorAction === "publish" && <Button type="button" variant="outline" className="min-h-12" disabled={!state || disabled || changed} onClick={() => void publish()}>Thử phát hành lại</Button>}</div>}
    {conflict && <div role="alert" className="rounded-xl border border-learning-note bg-learning-note p-4 text-learning-note-ink"><p>Bản nháp đã thay đổi ở nơi khác. Tải lại để tiếp tục với phiên bản mới.</p>
      <Button type="button" variant="outline" className="mt-3 min-h-12" onClick={reloadAfterConflict}>Tải bản mới</Button></div>}
    {notice && <p role="status" className="rounded-lg bg-learning-mint p-3 text-primary">{notice}</p>}
    {(loading || loadedScope !== scopeKey && !error) && <p role="status">Đang tải hồ sơ Speaking…</p>}
    {state && loadedScope === scopeKey && !loading && <HasRole allowedRoles={["CONTENT_MANAGER"]} fallback={<p role="alert">Bạn không có quyền chỉnh sửa hồ sơ Speaking.</p>}>
      <div className="grid min-w-0 gap-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        {!state.draft && !state.published && state.initialProfile && <p className="rounded-lg bg-learning-mint p-3 text-sm leading-6 text-primary">Đã điền thông tin ban đầu từ chủ đề/mục học. Bạn có thể chỉnh sửa trước khi lưu.</p>}
        <section className="grid gap-2"><label className="flex min-h-12 items-center gap-3 font-semibold"><input type="checkbox" checked={profile.enabled} disabled={disabled} onChange={event => patch({ enabled: event.target.checked })} className="size-5 accent-primary" />Bật Speaking cho phạm vi này</label>
          <p className="text-sm leading-6 text-on-surface-variant">Hồ sơ tắt hoặc để trống vẫn có thể xuất bản. Chỉ hồ sơ bật mới cần các trường bắt buộc.</p></section>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trình độ CEFR"><select className={input} disabled={disabled} value={profile.level ?? ""} onChange={event => patch({ level: event.target.value || null })}><option value="">Chưa chọn</option>{levels.map(level => <option key={level}>{level}</option>)}</select></Field>
          <Field label="Mô tả tình huống"><input className={input} disabled={disabled} value={profile.description} onChange={event => patch({ description: event.target.value })} placeholder="Ví dụ: Order a drink in a cafe." /></Field>
          <Field label="Vai trò AI"><input className={input} disabled={disabled} value={profile.aiRole} onChange={event => patch({ aiRole: event.target.value })} placeholder="Barista" /></Field>
          <Field label="Vai trò người học"><input className={input} disabled={disabled} value={profile.learnerRole} onChange={event => patch({ learnerRole: event.target.value })} placeholder="Customer" /></Field>
        </div>
        <Field label="Chủ đề gợi ý"><textarea className={`${input} min-h-24`} disabled={disabled} value={profile.suggestedTopics.join("\n")} onChange={event => patch({ suggestedTopics: event.target.value.split("\n").map(value => value.trim()).filter(Boolean) })} placeholder="Mỗi dòng là một chủ đề gợi ý" /></Field>
        <section className="grid gap-3" aria-labelledby="resource-heading"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 id="resource-heading" className="text-headline-md font-semibold">Tài nguyên được chọn</h2><p className="mt-1 text-sm leading-6 text-on-surface-variant">Có thể chọn tài nguyên từ nội dung nháp đã lưu. Khi phát hành hồ sơ đang bật, tài nguyên đã chọn phải có trong bản nội dung đang phát hành.</p></div>
          <Button type="button" variant="outline" className="min-h-12" disabled={disabled || profile.selectedResourceIds.length === 0} onClick={() => patch({ selectedResourceIds: clearResourceSelection() })}>Bỏ chọn tất cả</Button></div>
          <p className="text-sm text-on-surface-variant">Đã chọn {profile.selectedResourceIds.filter(id => eligibleIds.has(id)).length}/{state.resources.length} tài nguyên{!itemId && ` · ${itemCountWithSelection}/${groups.length} Item`}{staleIds.length > 0 && ` · ${staleIds.length} tài nguyên không còn khả dụng`}</p>
          {!itemId && <>
            <label className="grid gap-2 text-sm font-medium" htmlFor="resource-search">Tìm kiếm Item hoặc tài nguyên</label><input id="resource-search" className={input} value={search} onChange={event => { const query = event.target.value; setSearch(query); if (query.trim()) setExpanded(previous => new Set([...previous, ...filterSpeakingResourceGroups(groups, query).map(group => group.itemId)])); }} placeholder="Nhập tên Item hoặc tài nguyên" />
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-on-surface-variant">{matchingGroups.length} Item trong chủ đề</span><span className="flex gap-2"><Button type="button" variant="outline" className="min-h-12" disabled={disabled} onClick={() => setExpanded(new Set(matchingGroups.map(group => group.itemId)))}>Mở tất cả</Button><Button type="button" variant="outline" className="min-h-12" disabled={disabled} onClick={() => setExpanded(new Set())}>Thu gọn</Button></span></div>
            <div className="grid gap-3">{matchingGroups.map(group => {
              const ids = group.resources.map(resource => resource.id); const selectedCount = ids.filter(id => profile.selectedResourceIds.includes(id)).length;
              const selection = resourceGroupSelection(ids, profile.selectedResourceIds); const checked = selection === "checked"; const mixed = selection === "mixed";
              const open = isSpeakingResourceGroupExpanded(group.itemId, expanded);
              return <section key={group.itemId} className="overflow-hidden rounded-xl border border-outline-variant">
                <div className="flex flex-wrap items-center gap-2 p-2 sm:p-3">
                  <input aria-label={`Chọn toàn bộ tài nguyên của ${group.itemTitle ?? "Item"}: ${selectedCount} trong ${ids.length}`} aria-checked={mixed ? "mixed" : checked} type="checkbox" checked={checked} disabled={disabled || ids.length === 0} ref={element => { if (element) element.indeterminate = mixed; }} onChange={() => toggleGroup(ids)} className="size-5 shrink-0 accent-primary" />
                  <Button type="button" variant="ghost" className="min-h-12 min-w-0 flex-1 justify-between whitespace-normal text-left" aria-expanded={open} onClick={() => setExpanded(previous => { const next = new Set(previous); if (next.has(group.itemId)) next.delete(group.itemId); else next.add(group.itemId); return next; })}>
                    <span className="break-words">{group.itemTitle ?? "Item"} <span className="text-sm text-on-surface-variant">{selectedCount}/{ids.length}</span></span>{open ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
                  </Button>
                </div>
                {open && <div className="grid gap-3 border-t border-outline-variant p-3">
                  {!ids.length && <p className="text-sm text-on-surface-variant">Chưa có tài nguyên đã lưu trong Item này.</p>}
                  {(["VOCABULARY", "EXPRESSION"] as const).map(type => {
                    const resources = group.resources.filter(resource => resource.type === type);
                    if (!resources.length) return null;
                    return <div key={type} className="grid gap-2">
                      <h3 className="text-sm font-semibold text-on-surface-variant">{type === "VOCABULARY" ? "Từ vựng" : "Cụm diễn đạt"} ({resources.length})</h3>
                      {resources.map(resource => <ResourceRow key={resource.id} id={resource.id} text={resource.textEn} type={type} checked={profile.selectedResourceIds.includes(resource.id)} disabled={disabled} onToggle={toggleResource} showType={false} />)}
                    </div>;
                  })}
                </div>}
              </section>;
            })}</div>
          </>}
          {itemId && <div className="grid gap-2">{state.resources.map(resource => <ResourceRow key={resource.id} id={resource.id} text={resource.textEn} type={resource.type} checked={profile.selectedResourceIds.includes(resource.id)} disabled={disabled} onToggle={toggleResource} />)}</div>}
          {staleIds.map(id => <div key={id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-learning-note bg-learning-note p-3 text-learning-note-ink"><span className="min-w-0 break-all">Tài nguyên đã ẩn hoặc không còn khả dụng: {id}</span><Button type="button" variant="outline" className="min-h-12" disabled={disabled} onClick={() => patch({ selectedResourceIds: removeResourceSelection(profile.selectedResourceIds, id) })}>Bỏ chọn</Button></div>)}
          {!state.resources.length && !staleIds.length && <p className="text-sm text-on-surface-variant">Chưa có tài nguyên đã lưu trong phạm vi này.</p>}
        </section>
        <Field label="Câu trả lời dự phòng · English"><textarea className={`${input} min-h-24`} disabled={disabled} value={profile.fallbackReply} onChange={event => patch({ fallbackReply: event.target.value })} placeholder="I can help with that. What would you like to know?" /></Field>
        <fieldset className="grid gap-4 rounded-xl border border-outline-variant p-4"><legend className="px-1 font-semibold">Gợi ý dự phòng · tùy chọn</legend>
          <Field label="Câu mẫu · English"><input className={input} disabled={disabled} value={profile.fallbackHint?.exampleEn ?? ""} onChange={event => patch({ fallbackHint: event.target.value || profile.fallbackHint?.explanationVi ? { exampleEn: event.target.value, explanationVi: profile.fallbackHint?.explanationVi ?? "" } : null })} /></Field>
          <Field label="Giải thích · Tiếng Việt"><input className={input} disabled={disabled} value={profile.fallbackHint?.explanationVi ?? ""} onChange={event => patch({ fallbackHint: event.target.value || profile.fallbackHint?.exampleEn ? { exampleEn: profile.fallbackHint?.exampleEn ?? "", explanationVi: event.target.value } : null })} /></Field>
        </fieldset>
        {validationErrors.length > 0 && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-error"><p className="font-semibold">Hoàn thiện hồ sơ đang bật trước khi phát hành:</p><ul className="mt-1 list-disc pl-5">{validationErrors.map(message => <li key={message}>{message}</li>)}</ul></div>}
        {state.publishViolations.length > 0 && <div role="alert" className="rounded-lg border border-learning-note bg-learning-note p-4 text-learning-note-ink"><p className="font-semibold">Cần chú ý trước khi phát hành:</p><ul className="mt-1 list-disc pl-5">{state.publishViolations.map((violation, index) => <li key={`${violation.path}-${index}`}>{formatViolation(violation)}</li>)}</ul></div>}
        {state.publishedViolations.length > 0 && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-error"><p className="font-semibold">Hồ sơ đang phát hành có tài nguyên không còn hợp lệ:</p><ul className="mt-1 list-disc pl-5">{state.publishedViolations.map((violation, index) => <li key={`${violation.path}-${index}`}>{formatViolation(violation)}</li>)}</ul></div>}
        {serverErrors.length > 0 && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-error"><ul className="list-disc pl-5">{serverErrors.map((violation, index) => <li key={`${violation.path}-${index}`}>{formatViolation(violation)}</li>)}</ul></div>}
        {!state.contentVersion && <p className="rounded-lg bg-learning-note p-3 text-learning-note-ink">Chưa có bản nội dung đang phát hành. Có thể lưu bản nháp; phát hành hồ sơ sẽ khả dụng khi nội dung đã được phát hành.</p>}
        <div className="flex flex-wrap gap-3"><Button type="button" className="min-h-12" disabled={disabled || !changed && state.draft !== null} onClick={() => void save()}>{busy ? "Đang lưu…" : "Lưu bản nháp"}</Button>
          <Button type="button" variant="outline" className="min-h-12" disabled={disabled || validationErrors.length > 0 || changed || !state.draft || !state.contentVersion} onClick={() => void publish()}>{busy ? "Đang xử lý…" : "Phát hành Speaking"}</Button>
          <Button type="button" variant="outline" className="min-h-12" asChild><Link to={backTo} onClick={event => { if (changed && !window.confirm("Bạn có chỉnh sửa chưa lưu. Rời trang và bỏ các thay đổi này?")) event.preventDefault(); }}>Quay lại quản lý chủ đề</Link></Button>
        </div>
        <p className="text-sm text-on-surface-variant">Bản nháp revision {state.revision}{state.published ? ` · Hồ sơ đã phát hành revision ${state.publishedProfileVersion ?? "—"}` : " · Chưa phát hành hồ sơ"}{state.draftMatchesPublished ? " · Bản nháp trùng với bản phát hành" : state.draft ? " · Có thay đổi chưa phát hành" : ""}</p>
      </div>
    </HasRole>}
  </main>;
}
