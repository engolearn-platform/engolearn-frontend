import { useCallback, useRef, useState } from "react";
import { useFetch } from "@shared/hooks/useFetch";
import { grammarPaths } from "@features/grammar/constants/management-paths";
import { grammarManagement } from "@features/grammar/services/grammar-management.service";
import type { GrammarLesson, GrammarLessonInput, GrammarTopic } from "@features/grammar/types/grammar-content.types";

export type LessonContext = { topic: GrammarTopic; lesson: GrammarLesson; refresh?: () => void };
export type AuthoringStep = { label: string; to: string };

export function lessonSteps(topicId: string, lessonId: string): AuthoringStep[] {
  return [
    { label: "Thông tin bài học", to: grammarPaths.lesson(topicId, lessonId) },
    { label: "Nội dung", to: grammarPaths.blocks(topicId, lessonId) },
    { label: "Luyện tập", to: grammarPaths.questions(topicId, lessonId) },
    { label: "Kiểm tra & hoàn thiện", to: grammarPaths.lessonReview(topicId, lessonId) },
  ];
}

export function useLessonAuthoring(topicId: string, lessonId: string) {
  return useFetch(useCallback(async (signal: AbortSignal): Promise<LessonContext> => {
    const [topic, lesson] = await Promise.all([
      grammarManagement.getTopic(topicId, signal),
      grammarManagement.getLesson(topicId, lessonId, signal),
    ]);
    return { topic, lesson };
  }, [topicId, lessonId]));
}

export function useAuthoringAction() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState<string | undefined>();

  async function run<T>(submit: () => Promise<T>, message?: () => string): Promise<T | undefined> {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setConflict(false);
    try {
      const result = await submit();
      if (message) setSaved(message());
      return result;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể cập nhật dữ liệu. Vui lòng thử lại.");
      setConflict(failure instanceof Error && "code" in failure && failure.code === "GRAMMAR_VERSION_CONFLICT");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return {
    run, busy, error, conflict, saved: busy ? "Đang lưu…" : error ? undefined : saved,
    clearError: () => { setError(null); setConflict(false); },
  };
}

export function savedAtLabel(auto = false) {
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  return (auto ? "Đã tự động lưu lúc " : "Đã lưu lúc ") + time;
}

export function saveLessonContent(lesson: GrammarLesson, topicId: string, changes: Partial<Pick<GrammarLessonInput, "blocks" | "questions">>) {
  return grammarManagement.saveLesson(topicId, lesson.id, {
    titleVi: lesson.titleVi,
    titleEn: lesson.titleEn,
    objective: lesson.objective,
    tags: lesson.tags,
    ...(lesson.order != null ? { order: lesson.order } : {}),
    version: lesson.version,
    blocks: lesson.blocks,
    questions: lesson.questions,
    ...changes,
  });
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

