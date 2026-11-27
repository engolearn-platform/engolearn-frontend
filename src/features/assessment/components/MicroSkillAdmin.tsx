import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { useFetch } from "@shared/hooks";
import { DraftSelect, DraftText } from "@features/assessment/components/DraftFields";
import { microSkillService, type SkillSection } from "@features/assessment/services/micro-skill.service";

export function MicroSkillAdmin() {
  const catalog = useFetch(microSkillService.list);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [section, setSection] = useState<SkillSection | "">("");
  const [editing, setEditing] = useState<{code: string; label: string} | null>(null);
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
    <p className="text-sm text-muted-foreground">Mã đã cấp sẽ được giữ trong đề và lịch sử. Mã chưa có mapping được xác nhận sẽ chờ trước khi xuất hiện trong Studio.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {catalog.loading && <p role="status">Đang tải danh mục…</p>}
    {catalog.error && <div role="alert">{catalog.error.message} <Button variant="outline" onClick={catalog.refetch}>Tải lại danh mục</Button></div>}
    <ul className="divide-y">
      {catalog.data?.map(skill => <li key={skill.code} className="space-y-2 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><strong>{skill.code} · {skill.label}</strong>
            <p className="text-sm">{skill.section === "READING" ? "Đọc" : "Nghe"} · {
              skill.active ? "Đang dùng" : skill.legacyName ? "Đã ngừng" : "Chờ mapping"
            }</p></div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy} aria-label={"Đổi tên " + skill.code}
              onClick={() => setEditing({code: skill.code, label: skill.label})}>Đổi tên</Button>
            {skill.active && <Button type="button" variant="outline" disabled={busy} aria-label={"Ngừng sử dụng " + skill.code}
              onClick={() => {
                if (window.confirm("Ngừng chọn " + skill.code + " cho đề mới?")) {
                  void mutate(() => microSkillService.retire(skill.code));
                }
              }}>Ngừng sử dụng</Button>}
          </div>
        </div>
        {editing?.code === skill.code && <form className="space-y-2" onSubmit={event => {
          event.preventDefault();
          void mutate(async () => {
            await microSkillService.rename(editing.code, editing.label.trim());
            setEditing(null);
          });
        }}>
          <DraftText label="Tên hiển thị mới" max={180} value={editing.label} onChange={label => setEditing({code: skill.code, label})} />
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
        await microSkillService.create(code.trim().toUpperCase(), label.trim(), section);
        setCode("");
        setLabel("");
        setSection("");
      });
    }}>
      <div className="grid gap-3 md:grid-cols-3">
        <DraftText label="Mã kỹ năng mới" value={code} max={3} onChange={setCode} />
        <DraftText label="Tên hiển thị" value={label} max={180} onChange={setLabel} />
        <DraftSelect label="Nhóm" value={section} onChange={value => setSection(value as SkillSection | "")}>
          <option value="READING">Đọc</option><option value="LISTENING">Nghe</option>
        </DraftSelect>
      </div>
      <Button disabled={busy || !/^[RL]\d{2}$/i.test(code.trim()) || !label.trim() || !section}>Thêm kỹ năng</Button>
    </form>
  </section>;
}
