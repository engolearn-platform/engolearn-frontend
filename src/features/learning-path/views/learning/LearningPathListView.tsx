import { EmptyState, Loading } from "@shared/components";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LearningPathCard from "@features/learning-path/components/learning/LearningPathCard";
import LearningPathSection from "@features/learning-path/components/learning/LearningPathSection";
import { useLearningPaths } from "@features/learning-path/hooks/useLearningPaths";
import type { LearningPathListItem } from "@features/learning-path/types/learning-path.types";
import { formatLearningPathDate } from "@features/learning-path/utils/formatLearningPathDate";

const EMPTY_PATHS: LearningPathListItem[] = [];

function filterPaths(paths: LearningPathListItem[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");

  if (!normalizedQuery) {
    return paths;
  }

  return paths.filter((path) => {
    const dates = `${path.createdDate} ${formatLearningPathDate(path.createdDate)}`;
    return (
      dates.toLocaleLowerCase("vi").includes(normalizedQuery) ||
      path.microSkills.some((microSkill) =>
        microSkill.toLocaleLowerCase("vi").includes(normalizedQuery),
      )
    );
  });
}

export default function LearningPathListView() {
  const active = useLearningPaths("ACTIVE");
  const completed = useLearningPaths("COMPLETED", false);
  const cancelled = useLearningPaths("CANCELLED", false);

  const [query, setQuery] = useState("");
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [cancelledExpanded, setCancelledExpanded] = useState(false);

  const activePaths = active.data?.data.items ?? EMPTY_PATHS;
  const completedPaths = completed.data?.data.items ?? EMPTY_PATHS;
  const cancelledPaths = cancelled.data?.data.items ?? [];
  const counts = active.data?.data.counts;

  const filteredActivePaths = useMemo(
    () => filterPaths(activePaths, query),
    [activePaths, query],
  );
  const filteredCompletedPaths = useMemo(
    () => filterPaths(completedPaths, query),
    [completedPaths, query],
  );

  const completedData = completed.data;
  const completedLoading = completed.loading;
  const completedError = completed.error;
  const refetchCompleted = completed.refetch;

  useEffect(() => {
    if (query.trim() && !completedData && !completedLoading && !completedError) {
      refetchCompleted();
    }
  }, [completedData, completedError, completedLoading, query, refetchCompleted]);

  if (active.loading) {
    return (
      <div className="mx-auto w-full max-w-[1160px] px-5 py-5 lg:px-10 lg:py-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (active.error || !active.data) {
    return (
      <div className="mx-auto w-full max-w-[1160px] px-5 py-5 lg:px-10 lg:py-8">
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
    <div className="mx-auto w-full max-w-[1160px] px-5 py-4 lg:px-10 lg:py-8">
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
          placeholder="Tìm kiếm lộ trình theo micro-skill hoặc ngày tạo..."
          type="search"
        />
      </label>

      <div className="mt-4 space-y-3 lg:mt-6 lg:space-y-7">
        <LearningPathSection
          title="Lộ trình đang hoạt động"
          count={counts?.active ?? activePaths.length}
          icon="active"
        >
          {filteredActivePaths.length > 0 ? (
            <div className="grid gap-2.5 xl:grid-cols-2 xl:gap-6">
              {filteredActivePaths.map((path) => (
                <LearningPathCard key={path.id} path={path} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={query.trim() ? "Không tìm thấy lộ trình phù hợp" : "Chưa có lộ trình đang hoạt động"}
              description={query.trim() ? "Thử tìm theo micro-skill hoặc ngày tạo." : "Hãy hoàn thành bài kiểm tra định kì để nhận đề xuất luyện tập."}
            />
          )}
        </LearningPathSection>

        <LearningPathSection
          title="Lộ trình đã hoàn thành"
          count={counts?.completed ?? 0}
          icon="completed"
          collapsible
          expanded={completedExpanded}
          onToggle={toggleCompleted}
        >
          {completedExpanded &&
            (completed.loading ? (
              <Loading size="sm" />
            ) : completed.error ? (
              <EmptyState
                title="Không tải được lộ trình đã hoàn thành"
                description={completed.error.message}
              />
            ) : filteredCompletedPaths.length > 0 ? (
              <div className="grid gap-2.5 xl:grid-cols-2 xl:gap-6">
                {filteredCompletedPaths.map((path) => (
                  <LearningPathCard key={path.id} path={path} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={query.trim() ? "Không tìm thấy lộ trình phù hợp" : "Chưa có lộ trình đã hoàn thành"}
                description={query.trim() ? "Thử tìm theo micro-skill hoặc ngày tạo." : "Các lộ trình hoàn thành sẽ xuất hiện tại đây."}
              />
            ))}
        </LearningPathSection>

        <LearningPathSection
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
        </LearningPathSection>
      </div>

      <div className="h-20 lg:hidden" aria-hidden="true" />
    </div>
  );
}
