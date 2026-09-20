import { EmptyState, Loading } from "@shared/components";
import { useMemo, useState } from "react";
import { useTopicManagement } from "../../hooks/useTopicManagement";
import type { TopicManagementFilter, Topic } from "../../types/topic.types";
import TopicManagementEmptyState from "../../components/management/TopicManagementEmptyState";
import TopicManagementFilterBar from "../../components/management/TopicManagementFilterBar";
import TopicManagementPageHeader from "../../components/management/TopicManagementPageHeader";
import TopicManagementPagination from "../../components/management/TopicManagementPagination";
import TopicManagementStats from "../../components/management/TopicManagementStats";
import TopicManagementTable from "../../components/management/TopicManagementTable";
import UnpublishTopicDialog from "../../components/management/UnpublishTopicDialog";

const DEFAULT_FILTER: TopicManagementFilter = {
  search: "",
  cefr: "ALL",
  category: "ALL",
  status: "ALL",
};

function matchesFilter(topic: Topic, filter: TopicManagementFilter): boolean {
  const keyword = filter.search.trim().toLowerCase();
  if (keyword) {
    const haystack =
      `${topic.titleEn} ${topic.titleVi} ${topic.code}`.toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }
  if (filter.cefr !== "ALL" && topic.cefr !== filter.cefr) return false;
  if (filter.category !== "ALL" && topic.category !== filter.category) return false;
  if (filter.status !== "ALL" && topic.status !== filter.status) return false;
  return true;
}

export default function TopicManagementListView() {
  const { data, loading, error } = useTopicManagement();
  const [filter, setFilter] = useState<TopicManagementFilter>(DEFAULT_FILTER);
  const [unpublishing, setUnpublishing] = useState<Topic | null>(null);

  const categories = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.topics.map((topic) => topic.category)));
  }, [data]);

  const filteredTopics = useMemo(() => {
    if (!data) return [];
    return data.topics.filter((topic) => matchesFilter(topic, filter));
  }, [data, filter]);

  const patchFilter = (patch: Partial<TopicManagementFilter>) =>
    setFilter((prev) => ({ ...prev, ...patch }));
  const clearFilter = () => setFilter(DEFAULT_FILTER);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <EmptyState
          title="Không tải được danh sách chủ đề"
          description={error?.message ?? "Đã xảy ra lỗi khi tải danh sách chủ đề."}
        />
      </div>
    );
  }

  const isEmpty = filteredTopics.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <TopicManagementPageHeader />
      <TopicManagementStats stats={data.stats} />
      <TopicManagementFilterBar
        filter={filter}
        categories={categories}
        onChange={patchFilter}
        onClear={clearFilter}
      />

      <div className="mt-4 flex min-h-[480px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        {isEmpty ? (
          <TopicManagementEmptyState
            keyword={filter.search.trim()}
            onClear={clearFilter}
            onCreate={() => undefined}
          />
        ) : (
          <>
            <TopicManagementTable topics={filteredTopics} onUnpublish={setUnpublishing} />
            <TopicManagementPagination total={data.stats.total} />
          </>
        )}
      </div>

      <UnpublishTopicDialog
        topic={unpublishing}
        onClose={() => setUnpublishing(null)}
        onConfirm={() => setUnpublishing(null)}
      />
    </div>
  );
}
