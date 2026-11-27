import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useFetch } from "@shared/hooks";
import { questionManagementService } from "@features/learning-path/services/question-management.service";
import { PASSAGE_LEVELS } from "@features/learning-path/types/passage-management.types";
import type { QuestionFilters, QuestionListParams } from "@features/learning-path/types/question-management.types";

export function useQuestionManagementList() {
  const [search, setSearch] = useSearchParams();
  const [typedKeyword, setTypedKeyword] = useState<string>();
  const params = useMemo<QuestionListParams>(() => {
    const page = Number(search.get("page") ?? 0);
    const size = Number(search.get("size") ?? 20);
    const skill = search.get("skill"); const level = search.get("level"); const status = search.get("status");
    return { keyword: (search.get("keyword") ?? "").slice(0, 200),
      skill: skill === "READING" || skill === "LISTENING" ? skill : "ALL",
      microSkill: (search.get("microSkill") ?? "").slice(0, 200),
      level: PASSAGE_LEVELS.includes(level as typeof PASSAGE_LEVELS[number]) ? level as typeof PASSAGE_LEVELS[number] : "ALL",
      status: status === "DRAFT" || status === "ACTIVE" || status === "RETIRED" ? status : "ALL",
      passageId: (search.get("passageId") ?? "").slice(0, 100),
      page: Number.isInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
      size: [10, 20, 50, 100].includes(size) ? size : 20 };
  }, [search]);
  const patchParams = useCallback((patch: Record<string, string | number>, resetPage = true) => {
    setSearch(previous => {
      const next = new URLSearchParams(previous);
      if (resetPage) next.delete("page");
      for (const [key, value] of Object.entries(patch)) {
        if (value === "" || value === "ALL") next.delete(key); else next.set(key, String(value));
      }
      return next;
    }, { replace: true });
  }, [setSearch]);
  useEffect(() => {
    if (typedKeyword === undefined) return;
    const timer = window.setTimeout(() => { patchParams({ keyword: typedKeyword.trim() }); setTypedKeyword(undefined); }, 350);
    return () => window.clearTimeout(timer);
  }, [typedKeyword, patchParams]);
  const fetchList = useCallback((signal: AbortSignal) => questionManagementService.list(params, signal), [params]);
  const result = useFetch(fetchList);
  useEffect(() => {
    if (result.data && !result.loading && result.data.items.length === 0 && params.page > 0) {
      const page = Math.max(0, result.data.totalPages - 1);
      if (page !== params.page) patchParams({ page }, false);
    }
  }, [result.data, result.loading, params.page, patchParams]);
  const setFilter = (patch: Partial<QuestionFilters>) => {
    if (patch.keyword !== undefined) setTypedKeyword(patch.keyword);
    const rest = { ...patch }; delete rest.keyword;
    if (Object.keys(rest).length) patchParams(rest);
  };
  return { ...result, params, filter: { ...params, keyword: typedKeyword ?? params.keyword }, setFilter,
    clearFilters: () => { setTypedKeyword(undefined); setSearch({ size: String(params.size) }, { replace: true }); },
    setPage: (page: number) => patchParams({ page }, false), setSize: (size: number) => patchParams({ size }) };
}
