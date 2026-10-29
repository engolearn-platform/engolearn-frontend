import { Link } from "react-router";
import { ROUTES } from "@shared/constants";
import { Button } from "@/core/components/shadcn/button";
import { useTopicCatalog } from "@features/topic/hooks/useTopicCatalog";
import { TopicCard } from "@features/topic/components/TopicCard";
import { topicErrorMessage } from "@features/topic/utils/topic-catalog";
import { TopicState } from "./TopicState";
import type { TopicBrowseQuery } from "@features/topic/services/topic-api.service";

export function TopicGrid({ query, origin, learner, status, filtered = false }: {
  query: TopicBrowseQuery; origin: string; learner: boolean; status?: "IN_PROGRESS" | "COMPLETED"; filtered?: boolean;
}) {
  const result = useTopicCatalog(query, status);
  return <TopicGridResults result={result} origin={origin} learner={learner} status={status} filtered={filtered} />;
}

export function TopicGridResults({ result, origin, learner, status, filtered = false }: {
  result: ReturnType<typeof useTopicCatalog>; origin: string; learner: boolean; status?: "IN_PROGRESS" | "COMPLETED"; filtered?: boolean;
}) {
  const { page, loading, error, refetch } = result;
  if (!page) return <TopicState title={error ? "Không tải được chủ đề" : "Đang tải chủ đề…"} description={error ? topicErrorMessage(error) : undefined} loading={loading && !error} error={!!error} onRetry={error ? refetch : undefined} />;
  return <div className="space-y-6" aria-busy={loading}>
    <p role="status" className="text-label-lg text-on-surface-variant">{page.total} chủ đề{status ? "" : " phù hợp"} · Đã tải {page.items.length}</p>
    {page.items.length > 0 ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">{page.items.map(topic => <TopicCard key={topic.topicId} topic={topic} origin={origin} learner={learner} mine={!!status} />)}</div> :
      <TopicState title={page.hasMore ? "Chưa có chủ đề ở trang này" : status ? (status === "COMPLETED" ? "Chưa có chủ đề hoàn thành" : "Chưa có chủ đề đang học") : filtered ? "Không có kết quả phù hợp" : "Chưa có chủ đề mới để khám phá"}
        description={status ? "Các chủ đề của bạn sẽ xuất hiện tại đây khi có tiến trình tương ứng." : filtered ? "Thử đổi từ khóa hoặc trình độ để tìm chủ đề khác." : learner ? "Bạn có thể quay lại các chủ đề đã bắt đầu trong Chủ đề của tôi." : "Hiện chưa có chủ đề nào được xuất bản. Vui lòng quay lại sau."}>
        {!status && !filtered && learner && <Button asChild variant="outline" className="mt-5 min-h-12 rounded-xl"><Link to={ROUTES.MY_TOPICS}>Chủ đề của tôi</Link></Button>}
      </TopicState>}
    {error && <TopicState error title="Không tải thêm được chủ đề" description={topicErrorMessage(error)} onRetry={refetch} />}
    {page.hasMore && !error && <div className="flex justify-center"><Button type="button" variant="outline" disabled={loading} onClick={result.loadMore} className="min-h-12 rounded-xl px-8">{loading ? "Đang tải…" : "Tải thêm chủ đề"}</Button></div>}
  </div>;
}
