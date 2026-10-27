export interface DailyAudioStimulus {
  type: "audio";
  label: string;
  duration: string;
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
  stimulus: DailyStimulus;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export type DailyAnswers = Record<number, number>;

export interface DailyResultRouteState {
  answers: DailyAnswers;
  submittedFromPractice: true;
}
