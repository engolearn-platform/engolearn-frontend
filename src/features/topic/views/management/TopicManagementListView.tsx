import { EmptyState, Loading } from "@shared/components";
import { ROUTES, adminTopicBasicInfoPath } from "@shared/constants";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTopicList } from "@features/topic/hooks/useTopicList";
import type { TopicManagementFilter } from "@features/topic/types/topic.types";
import type { TopicManagementListItem } from "@features/topic/types/topic-management.types";
import TopicManagementEmptyState from "@features/topic/components/management/list/TopicManagementEmptyState";
import TopicManagementFilterBar from "@features/topic/components/management/list/TopicManagementFilterBar";
import TopicManagementPageHeader from "@features/topic/components/management/list/TopicManagementPageHeader";
import TopicManagementPagination from "@features/topic/components/management/list/TopicManagementPagination";
import TopicManagementStats from "@features/topic/components/management/list/TopicManagementStats";
import TopicManagementTable from "@features/topic/components/management/list/TopicManagementTable";
import UnpublishTopicDialog from "@features/topic/components/management/list/UnpublishTopicDialog";

const DEFAULT_FILTER: TopicManagementFilter = {
  search: "",
  cefr: "ALL",
  category: "ALL",
  status: "ALL",
};

export default function TopicManagementListView() {
  const navigate = useNavigate();
  const { data, loading, error, params, setFilter, setPage } = useTopicList();
  const [unpublishing, setUnpublishing] = useState<TopicManagementListItem | null>(null);

  const filter: TopicManagementFilter = {
    search: params.search ?? "",
    cefr: (params.cefr as TopicManagementFilter["cefr"]) ?? "ALL",
    category: (params.category as TopicManagementFilter["category"]) ?? "ALL",
    status: (params.status as TopicManagementFilter["status"]) ?? "ALL",
  };

  const patchFilter = (patch: Partial<TopicManagementFilter>) => {
    setFilter(patch as Partial<typeof params>);
  };
  const clearFilter = () => setFilter(DEFAULT_FILTER as Partial<typeof params>);
  const goToCreate = () => navigate(ROUTES.ADMIN_TOPIC_CREATE);
  const handleEdit = (topic: TopicManagementListItem) => {
    navigate(adminTopicBasicInfoPath(topic.id));
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <EmptyState
          title="Không tải được danh sách chủ đề"
          description={error?.message ?? "Đã xảy ra lỗi khi tải danh sách chủ đề."}
        />
      </div>
    );
  }

  const items = data?.items ?? [];
  const counters = data?.counters ?? { total: 0, published: 0, draft: 0 };
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const currentPage = data?.page ?? params.page ?? 0;

  const isEmpty = items.length === 0;
  const hasAny = counters.total > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <TopicManagementPageHeader onCreate={goToCreate} />
      <TopicManagementStats stats={counters} />
      <TopicManagementFilterBar
        filter={filter}
        categoryOptions={[
          { value: "ALL", label: "Tất cả danh mục" },
          { value: "DINING", label: "Ẩm thực & Nhà hàng (Dining & Food)" },
          { value: "TRAVEL", label: "Du lịch & Khách sạn (Travel & Hospitality)" },
          { value: "BUSINESS", label: "Công sở & Kinh doanh (Business & Work)" },
          { value: "DAILY", label: "Đời sống xã hội (Daily Social Life)" },
          { value: "HEALTH", label: "Khám bệnh & Y tế (Health & Emergency)" },
        ]}
        onChange={patchFilter}
        onClear={clearFilter}
      />

      <div className="mt-4 flex min-h-[480px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        {isEmpty ? (
          <TopicManagementEmptyState
            keyword={filter.search.trim()}
            onClear={clearFilter}
            onCreate={goToCreate}
            title={hasAny ? "Không khớp bộ lọc" : "Chưa có topic nào"}
            description={
              hasAny
                ? "Không tìm thấy chủ đề nào phù hợp với bộ lọc hiện tại."
                : "Hãy tạo topic đầu tiên để bắt đầu quản lý nội dung."
            }
          />
        ) : (
          <>
            <TopicManagementTable topics={items} onUnpublish={setUnpublishing} onEdit={handleEdit} />
            <TopicManagementPagination
              page={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setPage}
            />
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
