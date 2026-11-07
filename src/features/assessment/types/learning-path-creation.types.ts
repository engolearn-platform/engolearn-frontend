export interface CreateLearningPathRequest {
  assessmentAttemptId: string;
  microSkills: string[];
}

export interface CreateLearningPathResponse {
  pathId: string;
  created: boolean;
}
