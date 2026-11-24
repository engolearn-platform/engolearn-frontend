import type { BlueprintCell, CsvQuestionRow, ManagementQuestion, ManagementQuestionDraft, ManagementState, ManagementTestSet } from "@features/placement/types/placement-management.types";
import { MANAGEMENT_LEVELS, MANAGEMENT_SKILLS } from "@features/placement/constants/placement-management";

export function safeQuestionAudioUrl(value: string): string {
  const candidate = value.trim();
  if (!candidate || candidate.includes("\\")) return "";
  if (Array.from(candidate).some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return "";
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  if (!/^https?:\/\//i.test(candidate)) return "";
  try {
    const parsed = new URL(candidate);
    return parsed.username || parsed.password ? "" : candidate;
  } catch {
    return "";
  }
}

export function getQuestionIssues(draft: ManagementQuestionDraft, requireMedia = true): string[] {
  const issues: string[] = [];
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(draft.code.trim())) issues.push("Mã câu hỏi gồm chữ, số, gạch ngang/gạch dưới, tối đa 80 ký tự.");
  if (!MANAGEMENT_SKILLS.includes(draft.skill)) issues.push("Kỹ năng không hợp lệ.");
  if (!MANAGEMENT_LEVELS.includes(draft.level)) issues.push("Trình độ phải thuộc A1–B2.");
  if (!draft.prompt.trim() || draft.prompt.length > 10000) issues.push("Nhập nội dung câu hỏi, tối đa 10.000 ký tự.");
  if (draft.options.length !== 4 || new Set(draft.options.map(o => o.id)).size !== 4 || draft.options.some(o => !o.text.trim() || o.text.length > 2000)) issues.push("Cần đúng 4 lựa chọn riêng biệt, không bỏ trống (tối đa 2.000 ký tự/lựa chọn).");
  if (!draft.options.some(o => o.id === draft.correctOptionId)) issues.push("Chọn duy nhất một đáp án đúng trong 4 lựa chọn.");
  if ([draft.passage, draft.explanation, draft.transcript].some(value => value.length > 20000)) issues.push("Ngữ liệu, giải thích và transcript tối đa 20.000 ký tự mỗi trường.");
  const audioUrl = draft.audioUrl.trim();
  const validAudioUrl = safeQuestionAudioUrl(audioUrl);
  if (audioUrl && !validAudioUrl) issues.push("Audio cần đường dẫn bắt đầu bằng / hoặc URL http/https hợp lệ, không chứa thông tin đăng nhập.");
  if (requireMedia && draft.skill === "READING" && !draft.passage.trim()) issues.push("Câu Reading chưa có đoạn đọc.");
  if (requireMedia && draft.skill === "LISTENING") {
    if (!audioUrl) issues.push("Câu Listening chưa có audio.");
    if (!draft.transcript.trim()) issues.push("Câu Listening chưa có transcript.");
  }
  return issues;
}

export function getQuestionReadiness(question: ManagementQuestion): "ready" | "missing" | "inactive" {
  if (question.status === "INACTIVE") return "inactive";
  if (question.skill === "LISTENING" && question.mediaReady === false) return "missing";
  return getQuestionIssues(question).length ? "missing" : "ready";
}
export function getBlueprint(questions: ManagementQuestion[]): BlueprintCell[] {
  return MANAGEMENT_SKILLS.flatMap(skill => MANAGEMENT_LEVELS.map(level => ({
    skill, level, count: questions.filter(q => q.skill === skill && q.level === level).length,
    required: skill === "READING" ? (level === "A1" || level === "A2" ? 4 : 3) : (level === "A1" || level === "A2" ? 1 : 2),
  })));
}
export function getSetQuestions(set: ManagementTestSet, state: ManagementState): ManagementQuestion[] {
  if (set.status !== "DRAFT") return set.snapshot;
  return set.questionIds.map(id => state.questions.find(q => q.id === id)).filter((q): q is ManagementQuestion => !!q);
}
export function getSetIssues(name: string, ids: string[], bank: ManagementQuestion[]): string[] {
  const issues: string[] = [];
  if (!name.trim() || name.trim().length > 160) issues.push("Tên bộ đề phải có từ 1 đến 160 ký tự.");
  if (ids.length !== 20) issues.push(`Đã chọn ${ids.length}/20 câu.`);
  if (new Set(ids).size !== ids.length) issues.push("Bộ đề không được trùng câu hỏi.");
  const questions = ids.map(id => bank.find(q => q.id === id));
  if (questions.some(q => !q)) issues.push("Một số câu hỏi không còn trong ngân hàng.");
  const found = questions.filter((q): q is ManagementQuestion => !!q);
  for (const q of found) if (q.status !== "ACTIVE" || getQuestionReadiness(q) !== "ready") issues.push(`${q.code}: câu hỏi chưa hợp lệ hoặc chưa được kích hoạt.`);
  for (const c of getBlueprint(found)) if (c.count !== c.required) issues.push(`${c.skill === "READING" ? "Reading" : "Listening"} ${c.level}: ${c.count}/${c.required} câu.`);
  if (found.some((q, i) => q.skill !== (i < 14 ? "READING" : "LISTENING"))) issues.push("Reading cần ở vị trí 1–14; Listening ở vị trí 15–20.");
  return issues;
}
export function formatManagementDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

interface CsvRecord { line: number; cells: string[] }
function csvRecords(source: string): CsvRecord[] {
  const text = source.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = [];
  let cells: string[] = [], value = "", quoted = false, closed = false, line = 1, rowLine = 1;
  const finishCell = () => { cells.push(value); value = ""; closed = false; };
  const finishRow = () => { finishCell(); if (cells.some(c => c.trim())) records.push({ line: rowLine, cells }); cells = []; rowLine = line + 1; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else { value += c; if (c === "\n") line++; }
      continue;
    }
    if (c === ',') finishCell();
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; finishRow(); line++; }
    else if (c === '"') { if (value.trim() || closed) throw new Error(`Dòng ${line}: dấu nháy CSV không hợp lệ.`); value = ""; quoted = true; }
    else if (closed && c.trim()) throw new Error(`Dòng ${line}: nội dung thừa sau dấu nháy đóng.`);
    else if (!closed) value += c;
  }
  if (quoted) throw new Error(`Dòng ${rowLine}: thiếu dấu nháy đóng.`);
  finishRow();
  return records;
}
export function parseQuestionCsv(text: string, existingCodes: string[]): CsvQuestionRow[] {
  if (new TextEncoder().encode(text).length > 2 * 1024 * 1024) throw new Error("File CSV tối đa 2 MB.");
  const records = csvRecords(text);
  if (!records.length) throw new Error("File CSV trống.");
  const header = records[0].cells.map(v => v.trim().toLowerCase());
  const required = ["code", "skill", "level", "prompt", "option_a", "option_b", "option_c", "option_d", "correct_option"];
  const allowed = [...required, "passage", "explanation", "transcript"];
  if (new Set(header).size !== header.length || required.some(key => !header.includes(key)) || header.some(key => !allowed.includes(key))) throw new Error(`Header cần ${required.join(", ")}; tùy chọn passage, explanation, transcript. Không hỗ trợ cột audio khi nhập CSV.`);
  if (records.length > 501) throw new Error("Mỗi lần nhập tối đa 500 câu.");
  if (records.length === 1) throw new Error("File chưa có dòng câu hỏi.");
  const used = new Set(existingCodes.map(c => c.trim().toLowerCase()));
  return records.slice(1).map(row => {
    const values = Object.fromEntries(header.map((key, i) => [key, row.cells[i]?.trim() ?? ""]));
    const draft: ManagementQuestionDraft = {
      code: values.code, skill: values.skill.toUpperCase() as ManagementQuestionDraft["skill"], level: values.level.toUpperCase() as ManagementQuestionDraft["level"],
      prompt: values.prompt, passage: values.passage ?? "", explanation: values.explanation ?? "", transcript: values.transcript ?? "", audioUrl: "",
      options: ["A", "B", "C", "D"].map(label => ({ id: label.toLowerCase(), label: label as "A" | "B" | "C" | "D", text: values[`option_${label.toLowerCase()}`] })),
      correctOptionId: values.correct_option.toLowerCase(),
    };
    const errors = getQuestionIssues(draft, false);
    if (row.cells.length !== header.length) errors.push("Số cột không khớp header.");
    const code = draft.code.toLowerCase();
    if (used.has(code)) errors.push("Mã câu hỏi đã tồn tại hoặc bị trùng trong file.");
    used.add(code);
    return { line: row.line, draft, errors };
  });
}
