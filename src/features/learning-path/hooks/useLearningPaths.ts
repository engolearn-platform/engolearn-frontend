import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { learningPathService } from "../services/learningPath.service";

export function useLearningPaths() {
  const fetchLearningPaths = useCallback(() => learningPathService.list(), []);

  return useFetch(fetchLearningPaths);
}
