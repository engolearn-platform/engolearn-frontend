import { EmptyState, Loading } from "@shared/components";
import { ROUTES, adminTopicBasicInfoPath, adminTopicReadPath } from "@shared/constants";
import { Link, useNavigate } from "react-router";
import { useTopicList } from "@features/topic/hooks/useTopicList";
import type { TopicManagementFilter } from "@features/topic/types/topic.types";
import type { TopicManagementListItem } from "@features/topic/types/topic-management.types";
import TopicManagementEmptyState from "@features/topic/components/management/list/TopicManagementEmptyState";
import TopicManagementFilterBar from "@features/topic/components/management/list/TopicManagementFilterBar";
import TopicManagementPageHeader from "@features/topic/components/management/list/TopicManagementPageHeader";
import TopicManagementPagination from "@features/topic/components/management/list/TopicManagementPagination";
import TopicManagementStats from "@features/topic/components/management/list/TopicManagementStats";
import TopicManagementTable from "@features/topic/components/management/list/TopicManagementTable";

const DEFAULT_FILTER: TopicManagementFilter = {
  search: "",
  cefr: "ALL",
  category: "ALL",
  status: "ALL",
};

export default function TopicManagementListView({ readOnly = false }: { readOnly?: boolean }) {
  const navigate = useNavigate();
  const { data, loading, error, params, setFilter, setPage } = useTopicList();

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
    navigate(readOnly ? adminTopicReadPath(topic.id) : adminTopicBasicInfoPath(topic.id));
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (!data && (error || readOnly)) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <EmptyState
          title={error?.status === 401 ? "Bạn cần đăng nhập" : error?.status === 403 ? "Bạn không có quyền xem nội dung quản trị" : "Không tải được danh sách chủ đề"}
          description={error?.status === 404 ? "Không tìm thấy danh sách chủ đề." : error?.message ?? "Chưa nhận được dữ liệu danh sách chủ đề."}
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
      {readOnly ? (
        <div className="py-5">
          <h1 className="text-headline-md font-semibold text-on-surface">Danh sách chủ đề</h1>
        </div>
      ) : <>
        <TopicManagementPageHeader onCreate={goToCreate} />
        <Link to={adminTopicReadPath()} className="inline-flex rounded-lg px-2 py-2 text-label-sm font-semibold text-primary hover:bg-surface-container-low">Mở danh sách chỉ đọc</Link>
      </>}
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

      <div aria-busy={loading} className="mt-4 flex min-h-[480px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        {loading && readOnly ? <div className="py-12"><Loading size="lg" /></div> : isEmpty ? (
          <TopicManagementEmptyState
            keyword={filter.search.trim()}
            onClear={clearFilter}
            onCreate={goToCreate}
            readOnly={readOnly}
            title={hasAny ? "Không khớp bộ lọc" : "Chưa có topic nào"}
            description={
              hasAny
                ? "Không tìm thấy chủ đề nào phù hợp với bộ lọc hiện tại."
                : readOnly ? "Danh sách Topic quản trị hiện chưa có dữ liệu." : "Hãy tạo topic đầu tiên để bắt đầu quản lý nội dung."
            }
          />
        ) : (
          <>
            <TopicManagementTable topics={items} onEdit={handleEdit} readOnly={readOnly} />
            <TopicManagementPagination
              page={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

    </div>
  );
}
