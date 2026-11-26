import { useCallback, useEffect, useState } from "react";
import { useFetch } from "@shared/hooks";
import { passageManagementService } from "@features/learning-path/services/passage-management.service";
import type { PassageFilters, PassageListParams } from "@features/learning-path/types/passage-management.types";

const defaults: PassageListParams = { keyword: "", skill: "ALL", level: "ALL", status: "ALL", page: 0, size: 20 };

export function usePassageManagementList() {
  const [params, setParams] = useState(defaults);
  const [keyword, setKeyword] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setParams(previous => previous.keyword === keyword.trim() ? previous : { ...previous, keyword: keyword.trim(), page: 0 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [keyword]);
  const fetchList = useCallback((signal: AbortSignal) => passageManagementService.list(params, signal), [params]);
  const result = useFetch(fetchList);
  const setFilter = (patch: Partial<PassageFilters>) => {
    if (patch.keyword !== undefined) setKeyword(patch.keyword);
    const rest = { ...patch };
    delete rest.keyword;
    if (Object.keys(rest).length) setParams(previous => ({ ...previous, ...rest, page: 0 }));
  };
  const clearFilters = () => { setKeyword(""); setParams(previous => ({ ...defaults, size: previous.size })); };
  const setPage = (page: number) => setParams(previous => ({ ...previous, page }));
  const setSize = (size: number) => setParams(previous => ({ ...previous, size, page: 0 }));
  useEffect(() => {
    if (result.data && result.data.items.length === 0 && params.page > 0 && !result.loading) {
      const page = Math.max(0, result.data.totalPages - 1);
      setParams(previous => previous.page === page ? previous : { ...previous, page });
    }
  }, [result.data, result.loading, params.page]);
  return { ...result, params, filter: { ...params, keyword }, setFilter, clearFilters, setPage, setSize };
}
