import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { draftImportService } from "@features/assessment/services/draft-import.service";
import { draftService } from "@features/assessment/services/draft.service";

export function AssessmentSoundCheckAdmin() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    if (!file) return;
    if (!window.confirm("Đổi âm thử dùng chung cho học viên?")) return;
    setMessage("");
    setError("");
    setBusy(true);
    try {
      const checked = await draftImportService.inspect(file);
      if (checked.seconds > 50) throw new Error(file.name + " vượt 50 giây.");
      await draftService.upload(file, checked.sha256, true);
      setMessage("Đã cập nhật âm thử dùng chung.");
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="space-y-3 rounded-2xl border p-5">
    <h2 className="text-xl font-semibold">Âm thử dùng chung</h2>
    <label className="grid gap-2 text-sm font-medium">WAV âm thử
      <input type="file" accept=".wav,audio/wav" disabled={busy} onChange={event => {
        setFile(event.target.files?.[0] ?? null);
        setMessage("");
        setError("");
      }} />
    </label>
    <Button type="button" variant="outline" disabled={!file || busy}
      onClick={() => void save()}>{busy ? "Đang cập nhật…" : "Cập nhật WAV âm thử"}</Button>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
}
