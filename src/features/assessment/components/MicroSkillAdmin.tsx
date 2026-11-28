import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { useFetch } from "@shared/hooks";
import { DraftSelect, DraftText } from "@features/assessment/components/DraftFields";
import { microSkillService, type SkillSection, type MicroSkill } from "@features/assessment/services/micro-skill.service";

export function MicroSkillAdmin() {
  const catalog = useFetch(microSkillService.list);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [canonicalName, setCanonicalName] = useState("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [section, setSection] = useState<SkillSection | "">("");
  const [editing, setEditing] = useState<{skill: MicroSkill; label: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try { await action(); catalog.refetch(); }
    catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="space-y-4 rounded-2xl border p-5">
    <h2 className="text-xl font-semibold">Danh mục kỹ năng</h2>
    <p className="text-sm text-muted-foreground">Danh mục dùng chung với Lộ trình học. Studio chỉ dùng các kỹ năng đang hoạt động đã có mã tương ứng trong đề.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {catalog.loading && <p role="status">Đang tải danh mục…</p>}
    {catalog.error && <div role="alert">{catalog.error.message} <Button variant="outline" onClick={catalog.refetch}>Tải lại danh mục</Button></div>}
    <ul className="divide-y">
      {catalog.data?.map(skill => <li key={skill.id} className="space-y-2 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><strong>{skill.code} · {skill.displayNameVi}</strong>
            <p className="text-sm">{skill.skill === "READING" ? "Đọc" : "Nghe"} · {
              skill.status === "ACTIVE" ? "Đang dùng" : "Không hoạt động"
            }</p></div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} aria-label={"Đổi tên " + skill.code}
              onClick={() => setEditing({skill, label: skill.displayNameVi})}>Đổi tên</Button>
            {skill.status === "ACTIVE" && <Button type="button" variant="outline" disabled={busy} aria-label={"Ngừng sử dụng " + skill.code}
              onClick={() => {
                if (window.confirm("Ngừng dùng " + skill.code + " cho đề và lộ trình mới?")) {
                  void mutate(() => microSkillService.update(skill, skill.displayNameVi, "INACTIVE"));
                }
              }}>Ngừng sử dụng</Button>}
          </div>
        </div>
        {editing?.skill.id === skill.id && <form className="space-y-2" onSubmit={event => {
          event.preventDefault();
          void mutate(async () => {
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
      </li>)}
    </ul>
    <form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      if (!section) return;
      void mutate(async () => {
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
    </form>
  </section>;
}
