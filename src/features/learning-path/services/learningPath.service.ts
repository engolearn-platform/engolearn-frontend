import type { LearningPathListItem } from "../types/learning-path.types";

const MOCK_LEARNING_PATHS: LearningPathListItem[] = [
  {
    id: "learning-path-1",
    createdDate: "09/10/2026",
    level: "A1",
    k: 3,
    microSkills: [
      { microSkill: "Listening for Gist", skill: "LISTENING", baselinePercent: 40 },
      { microSkill: "Listening for Detail & Relationship", skill: "LISTENING", baselinePercent: 45 },
      { microSkill: "Reading for Gist", skill: "READING", baselinePercent: 35 },
    ],
    status: "IN_PROGRESS",
    currentWeekNo: 2,
    progress: { assigned: 90, answered: 37, correct: 23 },
    cancelReason: null,
  },
  {
    id: "learning-path-2",
    createdDate: "28/09/2026",
    level: "A1",
    k: 2,
    microSkills: [
      { microSkill: "Reading for Detail & Relationship", skill: "READING", baselinePercent: 42 },
      { microSkill: "Vocabulary in Context", skill: "READING", baselinePercent: 40 },
    ],
    status: "IN_PROGRESS",
    currentWeekNo: 3,
    progress: { assigned: 60, answered: 43, correct: 29 },
    cancelReason: null,
  },
  {
    id: "learning-path-3",
    createdDate: "18/08/2026",
    level: "A2",
    k: 2,
    microSkills: [
      { microSkill: "Listening for Specific Information", skill: "LISTENING", baselinePercent: 45 },
      { microSkill: "Inference & Author's View", skill: "READING", baselinePercent: 40 },
    ],
    status: "COMPLETED",
    currentWeekNo: 3,
    progress: { assigned: 60, answered: 60, correct: 42 },
    cancelReason: null,
  },
  {
    id: "learning-path-4",
    createdDate: "12/07/2026",
    level: "A1",
    k: 1,
    microSkills: [
      { microSkill: "Listening for Attitude / Purpose", skill: "LISTENING", baselinePercent: 30 },
    ],
    status: "CANCELLED",
    currentWeekNo: 1,
    progress: { assigned: 30, answered: 3, correct: 1 },
    cancelReason: "INACTIVITY",
  },
];

export const learningPathService = {
  list(): Promise<LearningPathListItem[]> {
    return Promise.resolve(MOCK_LEARNING_PATHS);
  },
};
