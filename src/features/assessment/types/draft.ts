export interface DraftSkill {
  code: string | null;
  name: string | null;
  example: string | null;
  section: "LISTENING" | "READING" | null;
}
export interface DraftQuestion {
  level: string | null;
  skillCode: string | null;
  prompt: string | null;
  options: string[];
  correctOption: number | null;
  explanation: string | null;
  transcript: string | null;
}
export const unitLabels = {
  LISTENING_SINGLE: "Nghe · câu đơn",
  LISTENING_PASSAGE: "Nghe · theo đoạn",
  READING_SINGLE: "Đọc · câu đơn",
  READING_PASSAGE: "Đọc · theo đoạn",
} as const;
export interface DraftUnit {
  kind: keyof typeof unitLabels | null;
  passage: string | null;
  sourceAudioUnit: number | null;
  audioSha256?: string | null;
  questions: DraftQuestion[];
}
export interface DraftSummary { series: string; name: string; version: number }
export interface AssessmentDraft extends DraftSummary {
  revision: string;
  skills: DraftSkill[];
  units: DraftUnit[];
}

export interface ManagedAssessmentPaper extends DraftSummary {
  id: string;
  published: boolean;
}
