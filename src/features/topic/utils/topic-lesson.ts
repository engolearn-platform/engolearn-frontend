import type { AttemptDto, LessonContentDto, PositionDto, ContentStageDto } from "@features/topic/types/topic-api.types";

export const LESSON_SECTIONS = [
  { stage: "CONTEXT", label: "Bối cảnh & Hội thoại" },
  { stage: "VOCAB", label: "Từ vựng cốt lõi" },
  { stage: "EXPRESSIONS", label: "Mẫu câu thực tế" },
  { stage: "FILL_BLANK", label: "Luyện tập & Phản xạ" },
] as const;
const STAGES = ["CONTEXT", "VOCAB", "EXPRESSIONS", "FILL_BLANK", "SITUATIONAL_CHOICE"];
const compareId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export function lessonUnits(content: LessonContentDto) {
  const vocabulary = [...content.vocabularies].sort((a, b) => a.orderIndex - b.orderIndex || compareId(a.vocabId, b.vocabId));
  const purposes = content.expressions.flatMap(group =>
    [...group.purposes].sort((a, b) => a.orderIndex - b.orderIndex || compareId(a.purposeId, b.purposeId))
      .map(purpose => ({ ...purpose, tips: group.tips })));
  return { vocabulary, purposes };
}
export function isContentPosition(position: PositionDto): position is PositionDto & { stage: ContentStageDto } {
  return ["CONTEXT", "VOCAB", "EXPRESSIONS"].includes(position.stage);
}
export function samePosition(a: PositionDto | null, b: PositionDto | null) {
  return a !== null && b !== null && a.stage === b.stage && a.itemIndex === b.itemIndex;
}
export function canViewPosition(candidate: PositionDto, attempt: AttemptDto, content: LessonContentDto) {
  if (!Number.isInteger(candidate.itemIndex) || candidate.itemIndex < 0 || !STAGES.includes(candidate.stage)) return false;
  const { vocabulary, purposes } = lessonUnits(content);
  const length = candidate.stage === "CONTEXT" ? 1 : candidate.stage === "VOCAB" ? vocabulary.length :
    candidate.stage === "EXPRESSIONS" ? purposes.length : attempt.progress.totalQuizCount;
  if (candidate.itemIndex >= length) return false;
  if (attempt.status === "COMPLETED") return true;
  const frontier = attempt.position;
  if (!frontier) return false;
  const order = STAGES.indexOf(candidate.stage) - STAGES.indexOf(frontier.stage);
  return order < 0 || (order === 0 && candidate.itemIndex <= frontier.itemIndex);
}
export function viewingPosition(query: URLSearchParams, attempt: AttemptDto, content: LessonContentDto): PositionDto | null {
  const stage = query.get("stage");
  const index = query.get("index");
  const candidate = { stage, itemIndex: index === null || !/^\d+$/.test(index) ? -1 : Number(index) } as PositionDto;
  if (stage && canViewPosition(candidate, attempt, content)) return candidate;
  return attempt.position;
}
export function contentPositions(content: LessonContentDto): Array<PositionDto & { label: string }> {
  const { vocabulary, purposes } = lessonUnits(content);
  return [
    { stage: "CONTEXT", itemIndex: 0, label: "Bối cảnh & Hội thoại" },
    ...vocabulary.map((word, itemIndex) => ({ stage: "VOCAB" as const, itemIndex, label: word.word })),
    ...purposes.map((purpose, itemIndex) => ({ stage: "EXPRESSIONS" as const, itemIndex, label: purpose.purposeVi })),
  ];
}
export function assertLesson(attempt: AttemptDto, content: LessonContentDto, topicId: string, attemptId: string) {
  const mismatch = () => { throw Object.assign(new Error("Invalid lesson snapshot"), { code: "CONTRACT_MISMATCH" }); };
  if (!attempt || !content || attempt.attemptId !== attemptId || attempt.topicId !== topicId ||
    attempt.topicItemId !== content.topicItemId || attempt.topicItemVersionId !== content.topicItemVersionId ||
    attempt.version !== content.version || !Number.isInteger(attempt.revision) || attempt.revision < 0 ||
    !["IN_PROGRESS", "COMPLETED"].includes(attempt.status) || !attempt.progress ||
    !Number.isFinite(attempt.progress.percent) || attempt.progress.percent < 0 || attempt.progress.percent > 100 ||
    !Number.isInteger(attempt.progress.totalQuizCount) || attempt.progress.totalQuizCount < 0 ||
    typeof content.title !== "string" || !content.context || !Array.isArray(content.context.dialogue) ||
    typeof content.context.scenarioDescription !== "string" || !Array.isArray(content.vocabularies) || !Array.isArray(content.expressions)) mismatch();
  if (!content.context.dialogue.every(line => typeof line.speaker === "string" && typeof line.textEn === "string" && typeof line.textVi === "string") ||
    !content.vocabularies.every(word => typeof word.vocabId === "string" && typeof word.word === "string" && typeof word.meaningVi === "string" &&
      Number.isFinite(word.orderIndex) && Array.isArray(word.examples) && Array.isArray(word.collocations)) ||
    !content.expressions.every(group => Array.isArray(group.purposes) && group.purposes.every(purpose =>
      typeof purpose.purposeId === "string" && typeof purpose.purposeVi === "string" && Number.isFinite(purpose.orderIndex) && Array.isArray(purpose.examples)))) mismatch();
  if (attempt.status === "COMPLETED" ? attempt.position !== null :
    !attempt.position || !canViewPosition(attempt.position, attempt, content)) mismatch();
}
