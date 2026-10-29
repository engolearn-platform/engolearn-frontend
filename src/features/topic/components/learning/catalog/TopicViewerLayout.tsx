import { useCallback, useEffect } from "react";
import { Outlet } from "react-router";
import { useFetch } from "@shared/hooks";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";
import { TopicViewerContext } from "@features/topic/hooks/topic-viewer.context";
import { topicErrorMessage } from "@features/topic/utils/topic-catalog";
import { TopicState } from "./TopicState";

export default function TopicViewerLayout() {
  const fetchViewer = useCallback((signal: AbortSignal) => topicCatalogService.viewer(signal), []);
  const { data, loading, error, refetch } = useFetch(fetchViewer);
  useEffect(() => {
    window.addEventListener("focus", refetch);
    return () => window.removeEventListener("focus", refetch);
  }, [refetch]);
  if (error || !data) return <div className="min-h-screen bg-surface p-5 md:p-10"><div className="mx-auto max-w-2xl pt-10">
    <TopicState title={error ? "Không tải được thông tin người dùng" : "Đang mở chủ đề…"} description={error ? topicErrorMessage(error) : "Vui lòng đợi trong giây lát."} loading={!error && loading} error={!!error} onRetry={error ? refetch : undefined} />
  </div></div>;
  return <TopicViewerContext value={data}><Outlet key={data.kind + ":" + (data.learnerId ?? "guest") + ":" + (data.cefrLevel ?? "")} /></TopicViewerContext>;
}
