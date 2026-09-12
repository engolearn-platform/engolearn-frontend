import { useFetch } from "@shared/hooks";
import { useCallback } from "react";
import type { CefrTab, GrammarRoadmap } from "../types/grammar.types";

export const CEFR_TABS: CefrTab[] = [
  { level: "A1", label: "A1 Sơ cấp" },
  { level: "A2", label: "A2 Tiền trung cấp" },
  { level: "B1", label: "B1 Trung cấp", disabled: true },
];

const MOCK_ROADMAP: GrammarRoadmap = {
  currentLevel: "A1",
  overallProgress: 30,
  units: [
    {
      id: "unit-1",
      title: "Unit 1: Đại từ nhân xưng & Động từ To Be",
      status: "completed",
      progress: 100,
    },
    {
      id: "unit-2",
      title: "Unit 2: Thì Hiện tại đơn",
      description: "Cách diễn tả thói quen, sự thật hiển nhiên.",
      status: "active",
      progress: 50,
      topicLink: { label: "Thói quen hằng ngày", to: "/topics/daily-routines" },
    },
    {
      id: "unit-3",
      title: "Unit 3: Thì Hiện tại tiếp diễn",
      description: "Hành động đang diễn ra tại thời điểm nói.",
      status: "locked",
      progress: 0,
    },
    {
      id: "unit-4",
      title: "Unit 4: Tính từ sở hữu & Đại từ sở hữu",
      description: "Sở hữu cách trong tiếng Anh.",
      status: "locked",
      progress: 0,
    },
  ],
  goal: { completed: 2, total: 4 },
  suggestion: {
    title: "Cấu trúc: Trạng từ chỉ tần suất",
    description: "Thường đi kèm với Thì Hiện tại đơn.",
  },
};

export function useGrammarRoadmap() {
  const fetchRoadmap = useCallback(
    async (signal: AbortSignal): Promise<GrammarRoadmap> => {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return MOCK_ROADMAP;
    },
    []
  );

  const { data, loading, error, refetch } =
    useFetch<GrammarRoadmap>(fetchRoadmap);

  return { roadmap: data, loading, error, refetch };
}
