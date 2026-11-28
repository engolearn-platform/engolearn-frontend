import { unitLabels, type DraftUnit } from "@features/assessment/types/draft";

const matrix = [
  {first: 1, last: 10, count: 10, kind: "LISTENING_SINGLE"},
  {first: 11, last: 15, count: 1, kind: "LISTENING_PASSAGE"},
  {first: 16, last: 20, count: 1, kind: "LISTENING_PASSAGE"},
  {first: 21, last: 30, count: 10, kind: "READING_SINGLE"},
  {first: 31, last: 35, count: 1, kind: "READING_PASSAGE"},
  {first: 36, last: 40, count: 1, kind: "READING_PASSAGE"},
  {first: 41, last: 45, count: 1, kind: "READING_PASSAGE"},
  {first: 46, last: 50, count: 1, kind: "READING_PASSAGE"},
] as const;

export function studioGroups(units: DraftUnit[]) {
  let start = 0;
  const groups = matrix.map(group => {
    const entries = units.slice(start, start + group.count)
      .map((unit, offset) => ({unit, index: start + offset, firstQuestion: group.first + offset}));
    start += group.count;
    return {
      label: `Câu ${group.first}–${group.last} · ${unitLabels[group.kind]}`,
      entries,
      matches: entries.length === group.count && entries.every(({unit}) => unit.kind === group.kind),
    };
  });
  if (units.length === start && groups.every(group => group.matches)) return groups;

  // Keep incomplete drafts editable while their units do not match the exam matrix.
  let firstQuestion = 1;
  return units.map((unit, index) => {
    const entry = {unit, index, firstQuestion};
    firstQuestion += unit.questions.length;
    return {label: `Phần ${index + 1} · ${unit.kind ? unitLabels[unit.kind] : "Chưa chọn loại"}`, entries: [entry]};
  });
}
