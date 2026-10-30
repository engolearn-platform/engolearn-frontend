export interface DailyAudioStimulus {
  type: "audio";
  label: string;
  duration: string;
  url?: string;
  transcript?: string | null;
}

export interface DailyPassageStimulus {
  type: "passage";
  label: string;
  text: string;
}

export type DailyStimulus = DailyAudioStimulus | DailyPassageStimulus;

export interface DailyQuestion {
  number: number;
  microSkill: string;
  skill: "LISTENING" | "READING";
  stimulus: DailyStimulus | null;
  prompt: string;
  options: [string, string, string, string];
  optionIds?: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface ReviewQuestion extends DailyQuestion {
  correctIndex: number;
  explanation: string;
}

export interface PracticeQuestionDto {
  order: number;
  questionId: string;
  microSkill: string;
  skill: "LISTENING" | "READING";
  passage: { title: string | null; text: string | null; audio: { url: string; durationSec: number | null; format: string | null } | null } | null;
  prompt: string;
  options: { optionId: string; text: string }[];
  selectedOptionId: string | null;
}

export interface PracticeDayDto {
  pathId: string;
  weekNo: number;
  dayNo: number;
  status: string;
  startedAt: string;
  autoCloseAt: string;
  questions: PracticeQuestionDto[];
}

export type DailyAnswers = Record<number, number>;

export interface SubmitDayResult {
  pathId: string;
  weekNo: number;
  dayNo: number;
  status: "COMPLETED" | "CLOSED";
  closedAt: string;
  assigned: number;
  answered: number;
  correct: number;
  wrong: number;
  completionRate: number | null;
  practiceScore: number | null;
}

export interface DayResultQuestionDto extends PracticeQuestionDto {
  passage: (NonNullable<PracticeQuestionDto["passage"]> & { transcript: string | null }) | null;
  correctOptionId: string;
  explanation: string;
  answerStatus: "CORRECT" | "WRONG" | "UNANSWERED";
}

export interface DayResultDto extends SubmitDayResult {
  questions: DayResultQuestionDto[];
}
