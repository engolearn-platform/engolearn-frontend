export type AttemptStatus = "ACTIVE" | "READY" | "NO_RESULT" | "ABANDONED";
export interface Question { number: number; prompt: string; options: string[]; selected: number | null; passage: string | null }
export interface AssessmentState {
  id: string; status: AttemptStatus; revision: number; serverNow: string; startedAt: string; deadline: string | null;
  phase: string; unitIndex: number; section: "READING" | "LISTENING"; series: string; paperVersion: number;
  passage: string | null; current: Question | null; preview: Question[]; audioAvailable: boolean;
  progress: {number: number; status: "ANSWERED" | "BLANK" | "CURRENT" | "FUTURE"}[];
  savedCount: number; developmentData: boolean; rulesVersion: number; audioStartsAt: string | null; questions: Question[];
}
export interface Preparation {
  baselineValid: boolean; eligibleAt: string | null; cooldownSatisfied: boolean;
  quota: {used: number; limit: number; remaining: number; windowEndsAt: string; status: string} | null;
  activeAttemptId: string | null; paperAvailable: boolean; developmentData: boolean;
  initialLevel: string | null; currentLevel: string | null; highestLevel: string | null;
}
export interface Skill {
  code: string; name: string; example: string; section: string; correct: number; total: number;
  percentage: number; band: "NEEDS_PRACTICE" | "MONITOR" | "MEETS_THRESHOLD";
}
export interface AssessmentResult {
  id: string; status: AttemptStatus; submittedAt: string; series: string; paperVersion: number;
  correct: number; score: number; readingCorrect: number; listeningCorrect: number; level: string;
  initialLevel: string; currentLevel: string; highestLevel: string; skills: Skill[];
  measuredSkills: number; fullAnalysis: boolean; developmentData: boolean;
}
export interface HistoryItem {id: string; status: AttemptStatus; finishedAt: string; series: string | null; paperVersion: number | null; score: number | null; level: string | null}
export interface ReviewQuestion extends Question {
  correct: number; explanation: string; transcript: string; section: string;
  passage: string | null; unitIndex: number; audioAvailable: boolean;
}
export interface Review {result: AssessmentResult; questions: ReviewQuestion[]}
export interface Media {mimeType: string; base64: string}
export interface AnswerCommand {question: number; sequence: number; choice: number | null; commandId: string}
export interface FinishStageCommand {unitIndex: number; phase: string; commandId: string}
