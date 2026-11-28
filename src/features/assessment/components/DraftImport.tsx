import { useMemo, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { DraftPreview } from "@features/assessment/components/DraftPreview";
import { draftImportService, type CheckedWav, type DraftImportPreview } from "@features/assessment/services/draft-import.service";
import { draftService } from "@features/assessment/services/draft.service";
import type { AssessmentDraft } from "@features/assessment/types/draft";

import { StudioFilePicker } from "@features/assessment/components/StudioFilePicker";
import { studioAudioError } from "@features/assessment/utils/studio-audio-errors";

interface ReadyImport {
  workbook: File;
  manifest: CheckedWav[];
  result: DraftImportPreview;
}

export function DraftImport({ onCreated }: { onCreated: (draft: AssessmentDraft) => void }) {
  const [workbook, setWorkbook] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [ready, setReady] = useState<ReadyImport | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const filesByName = useMemo(() => new Map(files.map(file => [file.name.toLowerCase(), file])), [files]);
  const filesByUnit = useMemo(() => new Map(Object.entries(ready?.result.audioFiles ?? {}).flatMap(([index, name]) => {
    const file = filesByName.get(name.toLowerCase());
    return file ? [[Number(index), file] as const] : [];
  })), [filesByName, ready]);

  async function download() {
    setError("");
    try {
      setTemplateMessage("");
      const {blob, exampleSeries} = await draftImportService.template();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exampleSeries ? `Mau_${exampleSeries}.xlsx` : "Mau_De_Danh_Gia_Dinh_Ky.xlsx";
      if (!exampleSeries) setTemplateMessage("Đã tải khung Excel. Môi trường này chưa cấu hình đề demo đã xuất bản.");
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError((failure as Error).message); }
  }

  function clearPreview() {
    setReady(null);
    setError("");
  }

  async function preview() {
    if (!workbook) return;
    clearPreview();
    setBusy(true);
    try {
      if (!workbook.name.toLowerCase().endsWith(".xlsx")) throw new Error("Chọn workbook .xlsx.");
      if (files.length < 12 || files.length > 13) throw new Error("Chọn 12 WAV của đề và tối đa một WAV âm thử riêng.");
      if (filesByName.size !== files.length) throw new Error("Có tệp WAV trùng tên.");
      const manifest = [];
      for (const file of files) {
        setProgress("Đang kiểm " + file.name);
        try {
          manifest.push(await draftImportService.inspect(file));
        } catch (failure) {
          throw new Error(studioAudioError(failure, "Kiểm tra " + file.name));
        }
      }
      setProgress("Đang kiểm ma trận và dữ liệu Excel");
      const result = await draftImportService.preview(workbook, manifest);
      setReady({ workbook, manifest, result });
    } catch (failure) { setError((failure as Error).message); }
    finally { setProgress(""); setBusy(false); }
  }

  async function create() {
    if (!ready) return;
    setError("");
    setBusy(true);
    try {
      for (const checked of ready.manifest) {
        const file = filesByName.get(checked.name.toLowerCase());
        if (!file) throw new Error("Thiếu WAV " + checked.name + ". Hãy kiểm lại.");
        setProgress("Đang lưu qua Media · " + checked.name);
        try {
          await draftService.upload(file, checked.sha256);
        } catch (failure) {
          throw new Error(studioAudioError(failure, "Lưu " + checked.name + " khi nhập đề"));
        }
      }
      setProgress("Đang tạo bản nháp");
      onCreated(await draftImportService.create(ready.workbook, ready.manifest, ready.result.token));
    } catch (failure) { setError((failure as Error).message); }
    finally { setProgress(""); setBusy(false); }
  }

  return <section className="space-y-4 rounded-2xl border p-5">
    <h2 className="text-xl font-semibold">Nhập đề bằng Excel và WAV</h2>
    <Button type="button" variant="outline" onClick={() => void download()}>Tải mẫu Excel</Button>
    {templateMessage && <p role="status" className="text-sm text-muted-foreground">{templateMessage}</p>}
    <div className="grid gap-3 md:grid-cols-2">
      <StudioFilePicker label="Chọn tệp Excel (.xlsx)" selection={workbook?.name} accept=".xlsx"
        disabled={busy} onSelect={selected => { setWorkbook(selected[0]); clearPreview(); }} />
      <StudioFilePicker label="Chọn các tệp WAV" selection={`${files.length} tệp đã chọn`}
        accept=".wav,audio/wav" multiple disabled={busy} onSelect={selected => { setFiles(selected); clearPreview(); }} />
    </div>
    <p className="text-sm text-muted-foreground">Chọn 12 WAV của đề. Nếu ô AmThuWav trong Excel có tên tệp, chọn thêm WAV đó cùng bộ đề.</p>
    <Button type="button" disabled={busy || !workbook || !files.length} onClick={() => void preview()}>Kiểm tra và xem thử</Button>
    {progress && <p role="status">{progress}</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {ready && <fieldset className="space-y-4" disabled={busy}>
      {ready.result.soundCheckFile && <p className="text-sm">
        WAV âm thử riêng {ready.result.soundCheckFile}. Để đưa vào luồng học viên, dùng mục Âm thử dùng chung.
      </p>}
      <DraftPreview draft={ready.result.draft} filesByUnit={filesByUnit} onClose={() => setReady(null)} />
      <Button type="button" disabled={busy} onClick={() => void create()}>Xác nhận tạo nháp từ Excel</Button>
    </fieldset>}
  </section>;
}
