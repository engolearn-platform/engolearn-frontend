import { profileService } from "@features/auth/contract";
import { loadAssessmentHomeSummary } from "@features/assessment/contract";
import { loadGrammarHomeSummary } from "@features/grammar/contract";
import { loadLearningPathHomeSummary, microSkillCatalogService } from "@features/learning-path/contract";
import { loadSpeakingHomeSummary } from "@features/speaking/contract";
import { loadTopicHomeSummary } from "@features/topic/services/home-summary.service";
import { useFetch } from "@shared/hooks";

export function useHomeDashboard() {
  const topics = useFetch(loadTopicHomeSummary);
  const grammar = useFetch(loadGrammarHomeSummary);
  const paths = useFetch(loadLearningPathHomeSummary);
  const assessment = useFetch(loadAssessmentHomeSummary);
  const speaking = useFetch(loadSpeakingHomeSummary);
  const profile = useFetch(profileService.me);
  const skills = useFetch(microSkillCatalogService.list);
  const isNewLearner = topics.data?.counts.completed === 0 && topics.data.counts.inProgress === 0
    && grammar.data?.state === "NOT_STARTED" && paths.data?.state === "ASSESSMENT_REQUIRED"
    && assessment.data?.state === "NO_COMPLETED_ASSESSMENT" && speaking.data?.state === "NOT_STARTED";
  return { topics, grammar, paths, assessment, speaking, profile, skills, isNewLearner };
}

export type HomeDashboard = ReturnType<typeof useHomeDashboard>;
