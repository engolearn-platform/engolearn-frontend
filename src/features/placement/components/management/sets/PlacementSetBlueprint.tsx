import type { ManagementQuestion } from "@features/placement/types/placement-management.types";
import { getBlueprint } from "@features/placement/utils/placement-management";
import { MANAGEMENT_SKILLS, MANAGEMENT_SKILL_LABEL } from "@features/placement/constants/placement-management";

export default function PlacementSetBlueprint({ questions }: { questions: ManagementQuestion[] }) {
  const cells = getBlueprint(questions);
  return <div className="space-y-5"><p className="font-semibold">{questions.length}/20 câu đã chọn</p><progress className="h-2 w-full accent-primary" max={20} value={Math.min(questions.length, 20)} aria-label="Số câu đã chọn" />{MANAGEMENT_SKILLS.map(skill => <div key={skill}><h3 className="font-semibold">{MANAGEMENT_SKILL_LABEL[skill]} · {skill === "READING" ? "14" : "6"} câu</h3><div className="mt-3 grid grid-cols-4 gap-2">{cells.filter(cell => cell.skill === skill).map(cell => <div key={cell.level} className="rounded-lg bg-surface-container-low p-2 text-center text-label-sm"><span>{cell.level}</span><strong className={`block text-title-md ${cell.count === cell.required ? "text-primary" : "text-learning-note-ink"}`}>{cell.count}/{cell.required}</strong></div>)}</div></div>)}<p className="text-label-sm text-on-surface-variant">Mỗi mức A1–B2 gồm 5 câu. A1/A2: 4 Reading + 1 Listening; B1/B2: 3 Reading + 2 Listening. Reading ở vị trí 1–14, Listening ở vị trí 15–20.</p></div>;
}
