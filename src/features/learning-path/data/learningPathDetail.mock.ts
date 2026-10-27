import type {
  LearningPathDetail,
  LearningPathWeek,
} from "@features/learning-path/types/learning-path-detail.types";

const microSkills = [
  { name: "Listening for Gist", skill: "LISTENING" as const, initialScore: 30 },
  {
    name: "Listening for Specific Information",
    skill: "LISTENING" as const,
    initialScore: 40,
  },
  { name: "Reading for Gist", skill: "READING" as const, initialScore: 25 },
];

const firstWeek: LearningPathWeek = {
  number: 1,
  status: "CLOSED",
  startDate: "09/10/2026",
  endDate: "15/10/2026",
  closeDate: "16/10/2026",
  answered: 28,
  assigned: 30,
  correct: 21,
  days: [
    { number: 1, status: "COMPLETED", answered: 10, assigned: 10, correct: 8 },
    { number: 2, status: "COMPLETED", answered: 10, assigned: 10, correct: 7 },
    { number: 3, status: "CLOSED", answered: 8, assigned: 10, correct: 6 },
  ],
  microSkillResults: [
    { name: microSkills[0].name, answered: 10, assigned: 10, correct: 8, comparisonScore: 30 },
    { name: microSkills[1].name, answered: 9, assigned: 10, correct: 6, comparisonScore: 40 },
    { name: microSkills[2].name, answered: 9, assigned: 10, correct: 7, comparisonScore: 25 },
  ],
};

const openSecondWeek: LearningPathWeek = {
  number: 2,
  status: "OPEN",
  startDate: "16/10/2026",
  endDate: "22/10/2026",
  closeDate: "23/10/2026",
  remainingDays: 6,
  answered: 9,
  assigned: 30,
  correct: 6,
  days: [
    { number: 1, status: "IN_PROGRESS", answered: 9, assigned: 10, correct: 6 },
    { number: 2, status: "NOT_STARTED", answered: 0, assigned: 10, correct: null },
    { number: 3, status: "NOT_STARTED", answered: 0, assigned: 10, correct: null },
  ],
  microSkillResults: [],
};

const completedSecondWeek: LearningPathWeek = {
  ...openSecondWeek,
  status: "CLOSED",
  remainingDays: undefined,
  answered: 30,
  correct: 23,
  days: [
    { number: 1, status: "COMPLETED", answered: 10, assigned: 10, correct: 8 },
    { number: 2, status: "COMPLETED", answered: 10, assigned: 10, correct: 8 },
    { number: 3, status: "COMPLETED", answered: 10, assigned: 10, correct: 7 },
  ],
  microSkillResults: [
    { name: microSkills[0].name, answered: 10, assigned: 10, correct: 8, comparisonScore: 80 },
    { name: microSkills[1].name, answered: 10, assigned: 10, correct: 8, comparisonScore: 67 },
    { name: microSkills[2].name, answered: 10, assigned: 10, correct: 7, comparisonScore: 78 },
  ],
};

const lockedThirdWeek: LearningPathWeek = {
  number: 3,
  status: "LOCKED",
  startDate: "23/10/2026",
  endDate: "29/10/2026",
  closeDate: "30/10/2026",
  answered: 0,
  assigned: 30,
  correct: 0,
  days: [],
  microSkillResults: [],
};

const completedThirdWeek: LearningPathWeek = {
  ...lockedThirdWeek,
  status: "CLOSED",
  answered: 26,
  correct: 18,
  days: [
    { number: 1, status: "COMPLETED", answered: 10, assigned: 10, correct: 7 },
    { number: 2, status: "COMPLETED", answered: 10, assigned: 10, correct: 7 },
    { number: 3, status: "CLOSED", answered: 6, assigned: 10, correct: 4 },
  ],
  microSkillResults: [
    { name: microSkills[0].name, answered: 9, assigned: 10, correct: 6, comparisonScore: 80 },
    { name: microSkills[1].name, answered: 8, assigned: 10, correct: 5, comparisonScore: 80 },
    { name: microSkills[2].name, answered: 9, assigned: 10, correct: 7, comparisonScore: 70 },
  ],
};

const base = {
  createdDate: "2026-10-09",
  level: "A1",
  assigned: 90,
  microSkills,
};

export const activeLearningPathPreview: LearningPathDetail = {
  ...base,
  id: "demo-active",
  completedDate: null,
  status: "IN_PROGRESS",
  currentWeekNo: 2,
  answered: 37,
  weeks: [firstWeek, openSecondWeek, lockedThirdWeek],
  finalResults: [],
};

export const completedLearningPathPreview: LearningPathDetail = {
  ...base,
  id: "demo-completed",
  completedDate: "2026-10-29",
  status: "COMPLETED",
  currentWeekNo: null,
  answered: 84,
  weeks: [firstWeek, completedSecondWeek, completedThirdWeek],
  finalResults: [
    { name: microSkills[0].name, answered: 29, assigned: 30, correct: 22 },
    { name: microSkills[1].name, answered: 27, assigned: 30, correct: 19 },
    { name: microSkills[2].name, answered: 28, assigned: 30, correct: 21 },
  ],
};
