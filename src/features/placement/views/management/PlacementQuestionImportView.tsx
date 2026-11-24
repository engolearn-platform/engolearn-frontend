import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft, CheckCircle2, Download, Upload } from "lucide-react";
import { MANAGEMENT_PATHS } from "@features/placement/constants/placement-management";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import { parseQuestionCsv } from "@features/placement/utils/placement-management";
import type { CsvQuestionRow, ManagementQuestionDraft } from "@features/placement/types/placement-management.types";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementConfirm, ManagementHeader, managementInputClass } from "@features/placement/components/management/PlacementManagementUi";

const csvHeader = "code,skill,level,prompt,passage,option_a,option_b,option_c,option_d,correct_option,explanation,transcript";
function downloadText(name: string, text: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PlacementQuestionImportView() {
  const { state, service, busy, run } = usePlacementManagement();
  const [rows, setRows] = useState<CsvQuestionRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [filename, setFilename] = useState("");
  const [reading, setReading] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const generation = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const valid = rows.length > 0 && rows.length <= 500 && !errors.length && rows.every((row) => row.draft !== null && !row.errors.length);
  const step = count !== null ? 3 : filename && !reading ? 2 : 1;
  const reset = () => { generation.current += 1; setRows([]); setErrors([]); setFilename(""); setReading(false); setCount(null); setConfirmOpen(false); if (fileInput.current) fileInput.current.value = ""; };
  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const request = ++generation.current;
    setRows([]); setErrors([]); setCount(null); setConfirmOpen(false); setReading(false); setFilename("");
    if (!file) return;
    setFilename(file.name);
    if (!file.name.toLowerCase().endsWith(".csv")) { setErrors(["Chọn file CSV UTF-8 có đuôi .csv."]); return; }
    if (file.size > 2 * 1024 * 1024) { setErrors(["File vượt quá 2 MB."]); return; }
    setReading(true);
    try {
      const text = await file.text();
      if (request !== generation.current) return;
      const parsed = parseQuestionCsv(text, state.questions.map((question) => question.code));
      const nextErrors = parsed.flatMap((row) => row.errors.map((error) => `Dòng ${row.line}: ${error}`));
      if (!parsed.length) nextErrors.push("File chưa có câu hỏi.");
      if (parsed.length > 500) nextErrors.push("Tối đa 500 câu mỗi lần nhập.");
      if (parsed.some((row) => !row.draft && !row.errors.length)) nextErrors.push("Không thể đọc một số dòng dữ liệu. Kiểm tra lại file mẫu.");
      setRows(parsed); setErrors(nextErrors);
    } catch (error) {
      if (request === generation.current) { setRows([]); setErrors([error instanceof Error ? error.message : "Không đọc được file CSV."]); }
    } finally { if (request === generation.current) setReading(false); }
  };
  const importFile = async () => {
    if (!valid || busy || reading) return;
    const drafts = rows.map((row) => row.draft).filter((draft): draft is ManagementQuestionDraft => draft !== null);
    const result = await run(() => service.importQuestions(drafts));
    if (result === null) return;
    setConfirmOpen(false);
    if (result !== drafts.length) { setErrors(["Số câu được lưu không khớp file đã xác nhận. Kiểm tra ngân hàng trước khi nhập lại."]); return; }
    setCount(result);
  };
  return <div className="space-y-6">
    <ManagementHeader title="Nhập câu hỏi" description="Nhập phần chữ trước, bổ sung audio sau trong ngân hàng câu hỏi."><ManagementButton asChild variant="outline"><Link to={MANAGEMENT_PATHS.questions}><ArrowLeft className="size-4" />Ngân hàng</Link></ManagementButton></ManagementHeader>
    <ol aria-label="Tiến trình nhập" className="grid gap-3 sm:grid-cols-3">{["Chọn file", "Kiểm tra dữ liệu", "Kết quả nhập"].map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined} className={`rounded-xl border p-4 font-semibold ${step === index + 1 ? "border-primary bg-learning-mint text-primary" : "border-outline-variant text-on-surface-variant"}`}>{index + 1}. {label}</li>)}</ol>
    {count !== null ? <ManagementCard className="space-y-4 py-12 text-center"><CheckCircle2 className="mx-auto size-12 text-primary" /><h2 className="text-headline-md font-semibold" role="status">Đã nhập {count} câu hỏi</h2><p className="text-body-md text-on-surface-variant">Câu hỏi đã có trong ngân hàng. Hoàn thiện audio và transcript trước khi thêm Listening vào đề.</p><div className="flex flex-wrap justify-center gap-3"><ManagementButton asChild><Link to={MANAGEMENT_PATHS.questions}>Mở ngân hàng câu hỏi</Link></ManagementButton><ManagementButton variant="outline" onClick={reset}>Nhập file khác</ManagementButton></div></ManagementCard> : <>
      <div className="grid items-start gap-6 xl:grid-cols-3"><div className="space-y-4 xl:col-span-2"><ManagementCard className="space-y-4"><h2 className="text-title-lg font-semibold">1. Chuẩn bị file theo mẫu</h2><p>File chỉ chứa nội dung chữ. Không đính kèm audio hay file nén.</p><ManagementButton variant="outline" onClick={() => downloadText("placement_questions_template.csv", `${csvHeader}\r\nIMP-R001,READING,A1,They ____ students.,,am,is,are,be,C,They đi với are.,\r\nIMP-L001,LISTENING,A2,What time does the shop close?,,5 PM,6 PM,7 PM,8 PM,B,The shop closes at six.,The shop closes at six in the evening.`, "text/csv;charset=utf-8")}><Download className="size-4" />Tải file CSV mẫu</ManagementButton><p className="break-words text-label-sm text-on-surface-variant">Giữ nguyên tên và thứ tự 12 cột trong mẫu. Kỹ năng: READING / LISTENING. Đáp án đúng: A / B / C / D.</p></ManagementCard>
        <ManagementCard className="space-y-4"><label className="flex flex-col gap-3 rounded-xl border border-dashed border-outline-variant p-6"><Upload className="size-6 text-primary" /><span className="text-title-md font-semibold">Chọn file câu hỏi</span><span className="text-body-md text-on-surface-variant">CSV UTF-8 · Tối đa 2 MB · Tối đa 500 câu mỗi lần</span><input ref={fileInput} type="file" accept=".csv,text/csv" disabled={busy} className={managementInputClass} aria-label="Chọn file CSV" onChange={(event) => { void choose(event); }} /></label><p role="status" className="text-label-sm text-on-surface-variant">{reading ? "Đang đọc và kiểm tra file…" : "File được đọc trên máy để kiểm tra trước khi xác nhận nhập."}</p></ManagementCard></div>
        <ManagementCard className="space-y-4"><h2 className="text-title-lg font-semibold">Cần có trong file</h2><p>Mã câu · Kỹ năng · A1–B2<br />Nội dung · Bốn phương án A–D<br />Một đáp án đúng A/B/C/D</p><p className="text-on-surface-variant">Đoạn đọc, giải thích và transcript là văn bản thuần.</p><div className="rounded-xl bg-learning-note p-4 text-learning-note-ink"><p className="font-semibold">Listening chưa có audio?</p><p className="mt-2">Vẫn nhập được dưới dạng nháp. Bổ sung audio và transcript trong ngân hàng trước khi sử dụng.</p></div><p className="text-label-sm text-on-surface-variant">Mã trùng hoặc lỗi cấu trúc phải được sửa trước khi nhập. Nếu có lỗi, toàn bộ file sẽ không được nhập.</p></ManagementCard>
      </div>
      {!!filename && !reading && <>
        <ManagementCard><h2 className="text-title-lg font-semibold">2. Kiểm tra dữ liệu · {filename}</h2><p className="mt-2 text-on-surface-variant">{rows.length} dòng dữ liệu · {errors.length} lỗi cần sửa</p></ManagementCard>
        {errors.length > 0 ? <ManagementCard><div role="alert" className="space-y-3 text-error"><p className="font-semibold">Chưa thể nhập · Cần sửa các lỗi sau</p><ul className="list-disc pl-5">{errors.slice(0, 15).map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>{errors.length > 15 && <p>Còn {errors.length - 15} lỗi. Tải danh sách để xem đầy đủ.</p>}<ManagementButton variant="outline" onClick={() => downloadText("placement_import_errors.txt", errors.join("\r\n"))}>Tải danh sách lỗi</ManagementButton></div></ManagementCard> : valid && <ManagementCard><p role="status" className="font-semibold text-primary">Dữ liệu hợp lệ để nhập</p><p className="mt-2 text-on-surface-variant">{rows.filter((row) => row.draft?.skill === "LISTENING").length} câu Listening cần bổ sung audio. Các câu chưa được thêm vào ngân hàng cho đến khi bạn xác nhận.</p></ManagementCard>}
        {rows.length > 0 && <ManagementCard className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-left text-body-md"><thead className="bg-surface-container-low"><tr>{["Dòng / Mã", "Nội dung", "Kỹ năng / Level", "Sau khi nhập"].map((label) => <th scope="col" key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody>{rows.slice(0, 30).map((row, index) => <tr key={`${row.line}-${index}`} className="border-t border-outline-variant align-top"><td className="px-5 py-4">{row.line}<p className="font-semibold">{row.draft?.code ?? "—"}</p></td><td className="max-w-sm break-words px-5 py-4">{row.draft?.prompt ?? "Không đọc được dòng"}</td><td className="px-5 py-4">{row.draft ? `${row.draft.skill === "READING" ? "Reading" : "Listening"} · ${row.draft.level}` : "—"}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2">{row.errors.length || !row.draft ? <ManagementBadge tone="error">Cần sửa lỗi</ManagementBadge> : row.draft.skill === "LISTENING" ? <><ManagementBadge tone="warning">Thiếu audio</ManagementBadge>{!row.draft.transcript.trim() && <ManagementBadge tone="warning">Thiếu transcript</ManagementBadge>}</> : <ManagementBadge tone="success">Đủ nội dung</ManagementBadge>}</div></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant p-5"><p className="text-label-sm text-on-surface-variant">Xem trước {Math.min(rows.length, 30)}/{rows.length} dòng</p><ManagementButton disabled={!valid || busy || reading} onClick={() => setConfirmOpen(true)}>Xác nhận nhập {rows.length} câu</ManagementButton></div></ManagementCard>}
      </>}
    </>}
    <ManagementConfirm open={confirmOpen} title={`Nhập ${rows.length} câu hỏi?`} description="Chỉ nhập khi toàn bộ file hợp lệ. Listening cần được bổ sung audio trước khi sử dụng trong bộ đề." busy={busy} onClose={() => setConfirmOpen(false)} onConfirm={() => { void importFile(); }} confirmLabel="Nhập câu hỏi" />
  </div>;
}
