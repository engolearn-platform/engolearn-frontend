import {
  EmptyState,
  ListPagination,
  Loading,
  ManagementPageHeader,
} from "@shared/components";
import { useMemo, useState } from "react";
import { GrammarTopicFilterBar } from "@features/grammar/components/admin/GrammarTopicFilterBar";
import { GrammarTopicStatsGrid } from "@features/grammar/components/admin/GrammarTopicStatsGrid";
import { GrammarTopicTable } from "@features/grammar/components/admin/GrammarTopicTable";
import { useGrammarTopicManagement } from "@features/grammar/hooks/useGrammarTopicManagement";
import type {
  GrammarTopic,
  GrammarTopicFilter,
} from "@features/grammar/types/grammar-topic-management.types";

const DEFAULT_FILTER: GrammarTopicFilter = {
  search: "",
  cefr: "ALL",
  status: "ALL",
};

const DEFAULT_PAGE_SIZE = 6;

function matchesFilter(topic: GrammarTopic, filter: GrammarTopicFilter): boolean {
  const keyword = filter.search.trim().toLowerCase();
  if (keyword) {
    const haystack = `${topic.titleVi} ${topic.titleEn} ${topic.code}`.toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }
  if (filter.cefr !== "ALL" && topic.cefr !== filter.cefr) return false;
  if (filter.status !== "ALL" && topic.status !== filter.status) return false;
  return true;
}

export default function GrammarTopicListView() {
  const { data, loading, error } = useGrammarTopicManagement();
  const [filter, setFilter] = useState<GrammarTopicFilter>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredTopics = useMemo(() => {
    if (!data) return [];
    return data.topics.filter((topic) => matchesFilter(topic, filter));
  }, [data, filter]);

  const pageCount = Math.max(1, Math.ceil(filteredTopics.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visibleTopics = filteredTopics.slice(firstIndex, firstIndex + pageSize);

  const patchFilter = (patch: Partial<GrammarTopicFilter>) =>
    setFilter((prev) => ({ ...prev, ...patch }));
  const clearFilter = () => {
    setFilter(DEFAULT_FILTER);
    setPage(1);
  };

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
          title="Không tải được danh sách chủ đề ngữ pháp"
          description={error?.message ?? "Đã xảy ra lỗi khi tải danh sách chủ đề ngữ pháp."}
        />
      </div>
    );
  }

  const isEmpty = filteredTopics.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <ManagementPageHeader
        title="Quản lý chủ đề ngữ pháp"
        description="Tạo và cập nhật các chủ đề ngữ pháp của EngoLearn theo từng cấp độ CEFR."
        exportLabel="Xuất CSV"
        exportButtonClassName="h-10 rounded-xl border-outline-variant bg-surface-container-lowest px-4 text-label-lg shadow-sm has-[>svg]:px-4 hover:bg-surface-container hover:text-on-surface"
        createLabel="Tạo chủ đề ngữ pháp"
        createDisabled
        createButtonClassName="h-10 rounded-xl bg-primary-container px-4 text-label-lg text-on-primary shadow-sm has-[>svg]:px-4 hover:bg-primary active:scale-[0.98]"
      />
      <GrammarTopicStatsGrid stats={data.stats} />
      <GrammarTopicFilterBar filter={filter} onChange={patchFilter} onClear={clearFilter} />

      <div className="mt-4 flex min-h-[480px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        {isEmpty ? (
          <EmptyState
            title="Không có chủ đề ngữ pháp phù hợp"
            description={
              filter.search.trim()
                ? `Không tìm thấy kết quả cho "${filter.search.trim()}". Thử xóa bộ lọc để xem tất cả chủ đề.`
                : "Thử xóa bộ lọc để xem tất cả chủ đề ngữ pháp."
            }
            className="flex-1"
          />
        ) : (
          <>
            <GrammarTopicTable topics={visibleTopics} />
            <ListPagination
              total={filteredTopics.length}
              from={firstIndex + 1}
              to={Math.min(firstIndex + pageSize, filteredTopics.length)}
              itemNoun="chủ đề"
              pageSize={pageSize}
              page={currentPage}
              onPageChange={setPage}
              onPageSizeChange={(nextSize) => {
                setPageSize(nextSize);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
