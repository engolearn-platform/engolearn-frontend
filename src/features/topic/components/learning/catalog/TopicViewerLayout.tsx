import { useCallback, useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth, useFetch } from "@shared/hooks";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";
import { TopicViewerContext } from "@features/topic/hooks/topic-viewer.context";
import { topicErrorMessage } from "@features/topic/utils/topic-catalog";
import type { ViewerDto } from "@features/topic/types/topic-api.types";
import { TopicState } from "./TopicState";
import { useTopicCefrBridge } from "@/core/layouts/components/topicCefrBridge";

function TopicViewerSession() {
  const auth = useAuth();
  const fetchViewer = useCallback((signal: AbortSignal) => topicCatalogService.viewer(signal), []);
  const { data, loading, error, refetch } = useFetch(fetchViewer, auth.isAuthenticated);
  const { setLevel } = useTopicCefrBridge();

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    window.addEventListener("focus", refetch);
    return () => window.removeEventListener("focus", refetch);
  }, [auth.isAuthenticated, refetch]);

  useEffect(() => {
    setLevel(auth.isAuthenticated && !auth.isLoading && !error ? data?.cefrLevel ?? null : null);
  }, [auth.identityGeneration, auth.isAuthenticated, auth.isLoading, data?.cefrLevel, error, setLevel]);

  if (auth.isLoading) return <div className="min-h-screen bg-surface p-5 md:p-10"><div className="mx-auto max-w-2xl pt-10">
    <TopicState title="Đang kiểm tra phiên đăng nhập…" description="Vui lòng đợi trong giây lát." loading />
  </div></div>;

  if (auth.error) return <div className="min-h-screen bg-surface p-5 md:p-10"><div className="mx-auto max-w-2xl pt-10">
    <TopicState title="Không tải được thông tin người dùng" description="Không kiểm tra được phiên đăng nhập. Vui lòng thử lại." error onRetry={auth.refetch} />
  </div></div>;

  if (!auth.isAuthenticated) {
    const guest: ViewerDto = { kind: "GUEST", learnerId: null, displayName: null, cefrLevel: null };
    return <TopicViewerContext value={guest}><Outlet key={`${auth.identityGeneration}:guest`} /></TopicViewerContext>;
  }

  if (error || !data) return <div className="min-h-screen bg-surface p-5 md:p-10"><div className="mx-auto max-w-2xl pt-10">
    <TopicState title={error ? "Không tải được thông tin người dùng" : "Đang mở chủ đề…"} description={error ? topicErrorMessage(error) : "Vui lòng đợi trong giây lát."} loading={!error && loading} error={!!error} onRetry={error ? refetch : undefined} />
  </div></div>;

  return <TopicViewerContext value={data}><Outlet key={data.kind + ":" + (data.learnerId ?? "guest") + ":" + (data.cefrLevel ?? "")} /></TopicViewerContext>;
}

export default function TopicViewerLayout() {
  const { identityGeneration } = useAuth();
  return <TopicViewerSession key={identityGeneration} />;
}
