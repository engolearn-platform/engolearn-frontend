import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { grammarLearning } from "@features/grammar/services/grammar-learning.service";

export function useGrammarRoadmap() {
  return useFetch(grammarLearning.getRoadmap);
}

export function useGrammarTopic(topicId: string) {
  const request = useCallback((signal: AbortSignal) => grammarLearning.getTopic(topicId, signal), [topicId]);
  return useFetch(request);
}

export function useGrammarTheory(topicId: string, lessonId: string) {
  const request = useCallback((signal: AbortSignal) => grammarLearning.getTheory(topicId, lessonId, signal), [topicId, lessonId]);
  return useFetch(request);
}

export function useGrammarSummary(topicId: string) {
  const request = useCallback((signal: AbortSignal) => grammarLearning.getSummary(topicId, signal), [topicId]);
  return useFetch(request);
}

export function useGrammarPracticeSession(sessionId: string) {
  const request = useCallback((signal: AbortSignal) => grammarLearning.getPractice(sessionId, signal), [sessionId]);
  return useFetch(request);
}
