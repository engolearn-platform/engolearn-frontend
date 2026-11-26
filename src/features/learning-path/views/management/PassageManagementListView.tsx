import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { EmptyState, Loading } from "@shared/components";
import { ListPagination } from "@shared/components/management";
import { usePassageManagementList } from "@features/learning-path/hooks/usePassageManagementList";
import type { PassageListItem } from "@features/learning-path/types/passage-management.types";
import PassageManagementPageHeader from "@features/learning-path/components/management/passages/PassageManagementPageHeader";
import PassageManagementStats from "@features/learning-path/components/management/passages/PassageManagementStats";
import PassageManagementFilterBar from "@features/learning-path/components/management/passages/PassageManagementFilterBar";
import PassageManagementTable from "@features/learning-path/components/management/passages/PassageManagementTable";
import PassageDeleteDialog from "@features/learning-path/components/management/passages/PassageDeleteDialog";
import PassageRetireDialog from "@features/learning-path/components/management/passages/PassageRetireDialog";
import PassageReadinessDialog from "@features/learning-path/components/management/passages/PassageReadinessDialog";
import PassageWorkspaceDialog from "@features/learning-path/components/management/passages/PassageWorkspaceDialog";
import type { PassageWorkspace } from "@features/learning-path/components/management/passages/PassageWorkspaceDialog";

export default function PassageManagementListView() {
  const { data, loading, error, filter, params, setFilter, clearFilters, setPage, setSize, refetch } = usePassageManagementList();
  const [workspace, setWorkspace] = useState<PassageWorkspace | null>(null);
  const [deleting, setDeleting] = useState<PassageListItem | null>(null);
  const [checking, setChecking] = useState<PassageListItem | null>(null);
  const [retiring, setRetiring] = useState<PassageListItem | null>(null);
  const [notice, setNotice] = useState("");
  const create = () => { setNotice(""); setWorkspace({ mode: "create" }); };
  const saved = () => {
    setNotice(workspace?.mode === "create" ? "Đã tạo passage bản nháp." : "Đã cập nhật passage.");
    setWorkspace(null); refetch();
  };
  return <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
    <PassageManagementPageHeader onCreate={create} />
    {data && <PassageManagementStats counters={data.counters} />}
    <PassageManagementFilterBar filter={filter} onChange={setFilter} onClear={clearFilters} />
    {notice && <p role="status" className="mt-4 rounded-xl bg-learning-mint p-4 text-primary">{notice}</p>}
    <div aria-busy={loading} className="mt-4 overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      {error ? <div className="space-y-4 p-5 text-center">
        <EmptyState title={error.status === 403 ? "Bạn không có quyền xem kho passages" : error.status === 401 ? "Phiên đăng nhập đã hết hạn" : "Không tải được danh sách passages"}
          description={error.message} />
        <Button variant="outline" onClick={refetch}>Thử lại</Button>
      </div> : loading ? <div role="status" className="p-8"><Loading /><span className="sr-only">Đang tải danh sách passages</span></div>
        : data && (data.items.length ? <>
          <PassageManagementTable items={data.items}
            onPublish={setChecking}
            onRetire={item => { setNotice(""); setRetiring(item); }}
            onView={item => setWorkspace({ mode: "view", passageId: item.passageId })}
            onEdit={item => setWorkspace({ mode: "edit", passageId: item.passageId })} onDelete={setDeleting} />
          <ListPagination compact total={data.totalElements} from={data.page * data.size + 1}
            to={Math.min((data.page + 1) * data.size, data.totalElements)} itemNoun="passage"
            page={data.page + 1} pageCount={data.totalPages} pageSize={params.size} pageSizeOptions={[10, 20, 50, 100]}
            onPageChange={page => setPage(page - 1)} onPageSizeChange={setSize} />
          <p className="px-4 pb-4 text-label-sm text-on-surface-variant">{data.totalElements.toLocaleString("vi-VN")} passage khớp bộ lọc</p>
        </> : <div className="space-y-4 p-8 text-center">
          <EmptyState title={data.counters.total ? "Không khớp bộ lọc" : "Chưa có passage nào"}
            description={data.counters.total ? "Hãy thay đổi từ khóa hoặc bộ lọc để tìm passage." : "Tạo passage đầu tiên để bắt đầu xây dựng kho bài đọc và bài nghe."} />
          <Button variant={data.counters.total ? "outline" : "default"} onClick={data.counters.total ? clearFilters : create}>{data.counters.total ? "Xóa bộ lọc" : "Tạo passage mới"}</Button>
        </div>)}
    </div>
    {workspace && <PassageWorkspaceDialog workspace={workspace} onClose={() => setWorkspace(null)} onSaved={saved} />}
    {checking && <PassageReadinessDialog key={checking.passageId} item={checking}
      onPublished={() => { setChecking(null); setNotice("Đã xuất bản passage."); refetch(); }}
      onClose={() => { setChecking(null); refetch(); }}
      onEdit={() => { setWorkspace({ mode: "edit", passageId: checking.passageId }); setChecking(null); }}
      onView={() => { setWorkspace({ mode: "view", passageId: checking.passageId }); setChecking(null); }} />}
    {deleting && <PassageDeleteDialog item={deleting} onClose={() => { setDeleting(null); refetch(); }}
      onDeleted={() => { setDeleting(null); setNotice("Đã xóa passage bản nháp."); refetch(); }} />}
    {retiring && <PassageRetireDialog key={retiring.passageId} item={retiring}
      onClose={() => { setRetiring(null); refetch(); }}
      onRetired={() => { setRetiring(null); setNotice("Đã ngưng sử dụng passage."); refetch(); }} />}
  </div>;
}
