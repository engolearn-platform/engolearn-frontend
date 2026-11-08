import { useCallback } from "react";
import { useFetch } from "@shared/hooks/useFetch";
import { useAuth } from "@shared/hooks/useAuth";
export function useAssessmentQuery<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const {user, identityGeneration} = useAuth();
  const request = useCallback(async (signal: AbortSignal) => ({
    value: await fetcher(signal), owner: user?.id, generation: identityGeneration, resource: fetcher,
  }), [fetcher, user?.id, identityGeneration]);
  const state = useFetch(request, !!user);
  const data = state.data?.owner === user?.id && state.data?.generation === identityGeneration && state.data?.resource === fetcher ? state.data.value : null;
  return {...state, data};
}
