export interface CreateLearningPathRequest {
  assessmentAttemptId: string;
  microSkills: string[];
  level: string;
}

export interface CreateLearningPathResponse {
  pathId: string;
  created: boolean;
}
