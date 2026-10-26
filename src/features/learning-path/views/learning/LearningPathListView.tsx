import { EmptyState, Loading } from "@shared/components";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import LearningPathCard from "@features/learning-path/components/learning/LearningPathCard";
import LearningPathSection from "@features/learning-path/components/learning/LearningPathSection";
import { useLearningPaths } from "@features/learning-path/hooks/useLearningPaths";
import { useSearchLearningPaths } from "@features/learning-path/hooks/useSearchLearningPaths";
import type { LearningPathListItem } from "@features/learning-path/types/learning-path.types";

const EMPTY_PATHS: LearningPathListItem[] = [];

export default function LearningPathListView() {
  const active = useLearningPaths("ACTIVE");
  const completed = useLearningPaths("COMPLETED", false);
  const cancelled = useLearningPaths("CANCELLED", false);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [cancelledExpanded, setCancelledExpanded] = useState(false);
  const search = useSearchLearningPaths(debouncedQuery);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const activePaths = active.data?.data.items ?? EMPTY_PATHS;
  const completedPaths = completed.data?.data.items ?? EMPTY_PATHS;
  const cancelledPaths = cancelled.data?.data.items ?? [];
  const counts = active.data?.data.counts;

  const isSearching = query.trim().length > 0;
  const searchPending = isSearching &&
    (query.trim() !== debouncedQuery || search.loading);
  const searchItems = search.data?.data.items ?? EMPTY_PATHS;
  const visibleActivePaths = isSearching
    ? searchItems.filter((path) => path.status === "NOT_STARTED" || path.status === "IN_PROGRESS")
    : activePaths;
  const visibleCompletedPaths = isSearching
    ? searchItems.filter((path) => path.status === "COMPLETED")
    : completedPaths;
  const activeCount = isSearching
    ? visibleActivePaths.length
    : counts?.active ?? activePaths.length;
  const completedCount = isSearching
    ? visibleCompletedPaths.length
    : counts?.completed ?? 0;

  if (active.loading) {
    return (
      <div className="mx-auto w-full max-w-[1300px] px-5 py-5 lg:px-8 lg:py-8 xl:px-10">
        <Loading size="lg" />
      </div>
    );
  }

  if (active.error || !active.data) {
    return (
      <div className="mx-auto w-full max-w-[1300px] px-5 py-5 lg:px-8 lg:py-8 xl:px-10">
        <EmptyState
          title="Không tải được lộ trình"
          description={active.error?.message ?? "Đã xảy ra lỗi khi tải Learning Path."}
        />
      </div>
    );
  }

  const toggleCompleted = () => {
    const expanding = !completedExpanded;
    setCompletedExpanded(expanding);
    if (expanding && !completed.data && !completed.loading) {
      completed.refetch();
    }
  };

  const toggleCancelled = () => {
    const expanding = !cancelledExpanded;
    setCancelledExpanded(expanding);
    if (expanding && !cancelled.data && !cancelled.loading) {
      cancelled.refetch();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-4 lg:px-8 lg:py-8 xl:px-10">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-on-surface lg:text-[28px] lg:leading-[42px] lg:tracking-[-0.7px]">
          Luyện tập micro-skill
        </h1>

        <p className="mt-1 text-xs text-on-surface-variant lg:text-[15px] lg:leading-[22.5px]">
          Các lộ trình giúp bạn luyện những micro-skill còn yếu sau bài kiểm tra
          định kì.
        </p>
      </header>

      <label className="relative mt-3 block lg:mt-6">
        <span className="sr-only">Tìm kiếm lộ trình</span>

        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-on-surface-variant lg:left-4 lg:size-[16.5px]"
          aria-hidden="true"
        />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-3 text-xs text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-4 focus:ring-primary/10 lg:h-[54px] lg:rounded-2xl lg:pl-[49px] lg:pr-[17px] lg:text-[14.5px]"
          placeholder="Tìm theo micro-skill hoặc ngày tạo (DD/MM/YYYY)..."
          type="search"
        />
      </label>

      <div className="mt-4 space-y-3 lg:mt-6 lg:space-y-7">
        <LearningPathSection
          title="Lộ trình đang hoạt động"
          count={activeCount}
          icon="active"
        >
          {isSearching && searchPending ? (
            <Loading size="sm" />
          ) : isSearching && search.error ? (
            <EmptyState
              title="Không tìm kiếm được lộ trình"
              description={search.error.message}
            />
          ) : visibleActivePaths.length > 0 ? (
            <div className="grid gap-2.5 xl:grid-cols-2 xl:gap-6">
              {visibleActivePaths.map((path) => (
                <LearningPathCard key={path.id} path={path} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={isSearching ? "Không tìm thấy lộ trình đang hoạt động phù hợp" : "Chưa có lộ trình đang hoạt động"}
              description={isSearching ? "Thử tìm theo micro-skill hoặc ngày tạo dạng DD/MM/YYYY." : "Hãy hoàn thành bài kiểm tra định kì để nhận đề xuất luyện tập."}
            />
          )}
        </LearningPathSection>

        <LearningPathSection
          title="Lộ trình đã hoàn thành"
          count={completedCount}
          icon="completed"
          collapsible={!isSearching}
          expanded={isSearching || completedExpanded}
          onToggle={isSearching ? undefined : toggleCompleted}
        >
          {(isSearching || completedExpanded) &&
            (isSearching ? (
              searchPending ? (
                <Loading size="sm" />
              ) : search.error ? (
                <EmptyState
                  title="Không tìm kiếm được lộ trình"
                  description={search.error.message}
                />
              ) : visibleCompletedPaths.length > 0 ? (
                <div className="grid gap-2.5 xl:grid-cols-2 xl:gap-6">
                  {visibleCompletedPaths.map((path) => (
                    <LearningPathCard key={path.id} path={path} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Không tìm thấy lộ trình đã hoàn thành phù hợp"
                  description="Thử tìm theo micro-skill hoặc ngày tạo dạng DD/MM/YYYY."
                />
              )
            ) : completed.loading ? (
              <Loading size="sm" />
            ) : completed.error ? (
              <EmptyState
                title="Không tải được lộ trình đã hoàn thành"
                description={completed.error.message}
              />
            ) : visibleCompletedPaths.length > 0 ? (
              <div className="grid gap-2.5 xl:grid-cols-2 xl:gap-6">
                {visibleCompletedPaths.map((path) => (
                  <LearningPathCard key={path.id} path={path} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Chưa có lộ trình đã hoàn thành"
                description="Các lộ trình hoàn thành sẽ xuất hiện tại đây."
              />
            ))}
        </LearningPathSection>

        {!isSearching && <LearningPathSection
          title="Lộ trình đã hủy"
          count={counts?.cancelled ?? 0}
          icon="cancelled"
          collapsible
          expanded={cancelledExpanded}
          onToggle={toggleCancelled}
        >
          {cancelledExpanded &&
            (cancelled.loading ? (
              <Loading size="sm" />
            ) : cancelled.error ? (
              <EmptyState
                title="Không tải được lộ trình đã hủy"
                description={cancelled.error.message}
              />
            ) : cancelledPaths.length > 0 ? (
              <div className="grid gap-2.5 xl:grid-cols-2 xl:gap-6">
                {cancelledPaths.map((path) => (
                  <LearningPathCard key={path.id} path={path} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Chưa có lộ trình đã hủy"
                description="Các lộ trình bị hủy sẽ xuất hiện tại đây."
              />
            ))}
        </LearningPathSection>}
      </div>

      <div className="h-20 lg:hidden" aria-hidden="true" />
    </div>
  );
}
