import type { PlacementLevel, PlacementOption, PlacementSection } from "./placement-attempt.types";
import type { PlacementAttemptStatus } from "./placement.types";

export type { PlacementLevel, PlacementSection };
export type ManagementQuestionStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type ManagementSetStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export interface ManagementQuestionDraft {
  code: string; skill: PlacementSection; level: PlacementLevel;
  prompt: string; passage: string; options: PlacementOption[];
  correctOptionId: string; explanation: string; transcript: string; audioUrl: string;
}
export interface ManagementQuestion extends ManagementQuestionDraft {
  id: string; status: ManagementQuestionStatus; revision?: number; mediaReady?: boolean;
}
export interface ManagementTestSet {
  id: string; code: string; name: string; version: number; status: ManagementSetStatus;
  questionIds: string[]; snapshot: ManagementQuestion[]; createdAt: string;
  revision?: number; lockedSeed?: boolean;
}
export interface ManagementAttemptSummary {
  id: string; name: string; kind: "USER" | "GUEST"; userId: string | null;
  testSetId: string; testSetCode: string; testSetVersion: number;
  startedAt: string; deadlineAt?: string | null; endedAt: string | null; status: PlacementAttemptStatus;
  correctCount: number | null; level: PlacementLevel | null; claimStatus: string | null; totalQuestions?: number | null;
}
export interface ManagementAttempt extends ManagementAttemptSummary {
  snapshot: ManagementQuestion[]; answers: Record<string, string | null>;
}
export interface ManagementAttemptFilters {
  search: string; testSetCode: string; version: string; status: string; level: string; from: string; to: string;
}
export interface ManagementPage<T> { items: T[]; total: number; page: number; size: number }
export interface ManagementAudio { audioUrl: string; durationSeconds: number; title?: string }
export interface ManagementQuestionFilters { search: string; skill: string; level: string; status: string }
export interface ManagementState { schemaVersion: 1; questions: ManagementQuestion[]; testSets: ManagementTestSet[]; attempts: ManagementAttempt[] }
export interface CsvQuestionRow { line: number; draft: ManagementQuestionDraft | null; errors: string[] }
export interface BlueprintCell { skill: PlacementSection; level: PlacementLevel; count: number; required: number }
export interface PlacementManagementService {
  getState(signal?: AbortSignal): Promise<ManagementState>;
  listAttempts(filters: ManagementAttemptFilters, page: number, size: number, signal?: AbortSignal): Promise<ManagementPage<ManagementAttemptSummary>>;
  getAttempt(id: string, signal?: AbortSignal): Promise<ManagementAttempt>;
  getSetPreview(id: string, signal?: AbortSignal): Promise<ManagementTestSet>;
  listAudio(signal?: AbortSignal): Promise<ManagementAudio[]>;
  findQuestions(filters: ManagementQuestionFilters, signal?: AbortSignal): Promise<ManagementQuestion[]>;
  saveQuestion(draft: ManagementQuestionDraft, question?: ManagementQuestion): Promise<ManagementQuestion>;
  setQuestionStatus(question: ManagementQuestion, status: ManagementQuestionStatus): Promise<void>;
  importQuestions(drafts: ManagementQuestionDraft[]): Promise<number>;
  createSet(name: string): Promise<ManagementTestSet>;
  saveSet(set: ManagementTestSet, name: string, questionIds: string[]): Promise<ManagementTestSet>;
  publishSet(set: ManagementTestSet, name: string, questionIds: string[]): Promise<void>;
  archiveSet(set: ManagementTestSet): Promise<void>;
  newVersion(id: string): Promise<ManagementTestSet>;
  deleteSet(set: ManagementTestSet): Promise<void>;
}
