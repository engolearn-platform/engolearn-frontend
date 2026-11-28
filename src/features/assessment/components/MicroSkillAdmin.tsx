import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { useFetch } from "@shared/hooks";
import { DraftSelect, DraftText } from "@features/assessment/components/DraftFields";
import { microSkillService, type SkillSection, type MicroSkill } from "@features/assessment/services/micro-skill.service";

import { draftService } from "@features/assessment/services/draft.service";

export function MicroSkillAdmin() {
  const catalog = useFetch(microSkillService.list);
  const mappings = useFetch(draftService.skillMappings);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [canonicalName, setCanonicalName] = useState("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [section, setSection] = useState<SkillSection | "">("");
  const [editing, setEditing] = useState<{skill: MicroSkill; label: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{target: string; message: string} | null>(null);

  async function mutate(target: string, action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try { await action(); catalog.refetch(); mappings.refetch(); }
    catch (failure) { setError({target, message: (failure as Error).message}); }
    finally { setBusy(false); }
  }

  return <section className="space-y-4 rounded-2xl border p-5">
    <h2 className="text-xl font-semibold">Danh mục kỹ năng</h2>
    <p className="text-sm text-muted-foreground">Danh mục dùng chung với Lộ trình học. Studio chỉ dùng các kỹ năng đang hoạt động đã có mã tương ứng trong đề.</p>
    {mappings.error && <div role="alert">Chưa kiểm tra được kỹ năng dùng trong đề.
      <Button type="button" variant="outline" onClick={mappings.refetch}>Thử lại</Button>
    </div>}
    {catalog.loading && <p role="status">Đang tải danh mục…</p>}
    {catalog.error && <div role="alert">{catalog.error.message} <Button variant="outline" onClick={catalog.refetch}>Tải lại danh mục</Button></div>}
    <ul className="divide-y">
      {catalog.data?.map(skill => {
        const supported = mappings.data?.some(mapping =>
          mapping.canonicalName === skill.canonicalName && mapping.section === skill.skill);
        return <li key={skill.id} className="space-y-2 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><strong>{skill.code} · {skill.displayNameVi}</strong>
            <p className="text-sm">{skill.skill === "READING" ? "Đọc" : "Nghe"} · {
              supported === false ? "Chưa dùng được trong đề đánh giá định kỳ" :
                skill.status === "INACTIVE" ? "Đã ngừng sử dụng" :
                  supported ? "Đang dùng trong đề" : "Đang hoạt động"
            }</p></div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} aria-label={"Đổi tên " + skill.code}
              onClick={() => setEditing({skill, label: skill.displayNameVi})}>Đổi tên</Button>
            {skill.status === "ACTIVE" && <Button type="button" variant="outline" disabled={busy} aria-label={"Ngừng sử dụng " + skill.code}
              onClick={() => {
                if (window.confirm("Ngừng dùng " + skill.code + " cho đề và lộ trình mới?")) {
                  void mutate(skill.id, () => microSkillService.update(skill, skill.displayNameVi, "INACTIVE"));
                }
              }}>Ngừng sử dụng</Button>}
          </div>
        </div>
        {editing?.skill.id === skill.id && <form className="space-y-2" onSubmit={event => {
          event.preventDefault();
          void mutate(skill.id, async () => {
            await microSkillService.update(editing.skill, editing.label.trim(), editing.skill.status);
            setEditing(null);
          });
        }}>
          <DraftText label="Tên hiển thị mới" max={180} value={editing.label} onChange={label => setEditing({...editing, label})} />
          <div className="flex gap-2">
            <Button disabled={busy || !editing.label.trim()}>Lưu tên</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
          </div>
        </form>}
        {error?.target === skill.id && <p role="alert" className="text-destructive">{error.message}</p>}
        </li>;
      })}
    </ul>
    <form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      if (!section) return;
      void mutate("create", async () => {
        await microSkillService.create({
          code: code.trim().toUpperCase(), canonicalName: canonicalName.trim(), displayNameVi: label.trim(),
          descriptionVi: descriptionVi.trim(), skill: section, status: "INACTIVE",
          displayOrder: Math.max(0, ...(catalog.data ?? []).map(skill => skill.displayOrder)) + 1,
        });
        setCode("");
        setLabel("");
        setSection("");
        setCanonicalName("");
        setDescriptionVi("");
      });
    }}>
      <div className="grid gap-3 md:grid-cols-3">
        <DraftText label="Mã kỹ năng mới" value={code} max={50} onChange={setCode} />
        <DraftText label="Tên tiếng Việt" value={label} max={200} onChange={setLabel} />
        <DraftText label="Tên chuẩn" value={canonicalName} max={200} onChange={setCanonicalName} />
        <DraftSelect label="Nhóm" value={section} onChange={value => setSection(value as SkillSection | "")}>
          <option value="READING">Đọc</option><option value="LISTENING">Nghe</option>
        </DraftSelect>
      </div>
      <DraftText label="Mô tả tiếng Việt" value={descriptionVi} max={4000} long onChange={setDescriptionVi} />
      <Button disabled={busy || !/^[A-Z][A-Z0-9_-]{1,49}$/i.test(code.trim())
        || !label.trim() || !canonicalName.trim() || !descriptionVi.trim() || !section}>Thêm kỹ năng</Button>
      {error?.target === "create" && <p role="alert" className="text-destructive">{error.message}</p>}
    </form>
  </section>;
}
