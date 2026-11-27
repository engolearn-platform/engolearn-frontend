import { useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { EmptyState, Loading } from "@shared/components";
import { ListPagination, ManagementPageHeader } from "@shared/components/management";
import { useQuestionManagementList } from "@features/learning-path/hooks/useQuestionManagementList";
import type { QuestionCoverageWarning, QuestionListItem } from "@features/learning-path/types/question-management.types";
import QuestionManagementFilters from "@features/learning-path/components/management/questions/QuestionManagementFilters";
import QuestionManagementTable from "@features/learning-path/components/management/questions/QuestionManagementTable";
import type { QuestionAction } from "@features/learning-path/components/management/questions/QuestionManagementTable";
import QuestionWorkspaceDialog from "@features/learning-path/components/management/questions/QuestionWorkspaceDialog";
import type { QuestionWorkspace } from "@features/learning-path/components/management/questions/QuestionWorkspaceDialog";
import QuestionActionDialog from "@features/learning-path/components/management/questions/QuestionActionDialog";
import QuestionPublicationDialog from "@features/learning-path/components/management/questions/QuestionPublicationDialog";
import { QuestionCoverageWarnings } from "@features/learning-path/components/management/questions/QuestionReviewPanel";

export default function QuestionManagementListView() {
  const { data, loading, error, params, filter, setFilter, clearFilters, setPage, setSize, refetch } = useQuestionManagementList();
  const [workspace, setWorkspace] = useState<QuestionWorkspace | null>(null);
  const [action, setAction] = useState<{ mode: Exclude<QuestionAction, "view" | "edit">; item: QuestionListItem } | null>(null);
  const [notice, setNotice] = useState("");
  const [warnings, setWarnings] = useState<QuestionCoverageWarning[]>([]);
  const create = () => { setNotice(""); setWarnings([]); setWorkspace({ mode: "create", passageId: params.passageId || undefined }); };
  const close = () => { setAction(null); setWorkspace(null); refetch(); };
  const done = (message: string, coverageWarnings: QuestionCoverageWarning[] = []) => { setAction(null); setWorkspace(null); setNotice(message); setWarnings(coverageWarnings); refetch(); };
  const onAction = (mode: QuestionAction, item: QuestionListItem) => {
    setNotice(""); setWarnings([]);
    if (mode === "view" || mode === "edit") setWorkspace({ mode, questionId: item.questionId });
    else setAction({ mode, item });
  };
  return <div className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
    <ManagementPageHeader title="Quản lý câu hỏi Learning Path" badge="Content Studio"
      description="Biên soạn và duyệt câu hỏi đọc, nghe cho lộ trình học tập."
      createLabel="Tạo câu hỏi mới" onCreate={create} showExport={false} />
    <QuestionManagementFilters filter={filter} onChange={setFilter} onClear={clearFilters} />
    {notice && <p role="status" className="mt-4 rounded-xl bg-learning-mint p-4 text-primary">{notice}</p>}
    {warnings.length > 0 && <div className="mt-4"><QuestionCoverageWarnings warnings={warnings} /></div>}
    <div aria-busy={loading} className="mt-4 overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      {error ? <div className="space-y-4 p-5 text-center"><EmptyState title={error.status === 403 ? "Bạn không có quyền xem kho câu hỏi" : error.status === 401 ? "Phiên đăng nhập đã hết hạn" : "Không tải được danh sách câu hỏi"} description={error.message} /><Button variant="outline" onClick={refetch}>Thử lại</Button></div>
        : loading ? <div role="status" className="p-8"><Loading /><span className="sr-only">Đang tải danh sách câu hỏi</span></div>
          : data && (data.items.length > 0 ? <>
            <QuestionManagementTable items={data.items} onAction={onAction} />
            <ListPagination compact total={data.totalElements} from={data.page * data.size + 1} to={Math.min((data.page + 1) * data.size, data.totalElements)} itemNoun="câu hỏi"
              page={data.page + 1} pageCount={data.totalPages} pageSize={params.size} pageSizeOptions={[10, 20, 50, 100]} onPageChange={page => setPage(page - 1)} onPageSizeChange={setSize} />
            <p className="px-4 pb-4 text-label-sm text-on-surface-variant">{data.totalElements.toLocaleString("vi-VN")} câu hỏi khớp bộ lọc</p>
          </> : <div className="space-y-4 p-8 text-center"><EmptyState title="Chưa có câu hỏi khớp bộ lọc" description="Thay đổi bộ lọc hoặc tạo bản nháp để bổ sung câu hỏi cho kho Learning Path." /><Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button><Button onClick={create}>Tạo câu hỏi mới</Button></div>)}
    </div>
    {workspace && <QuestionWorkspaceDialog key={workspace.mode === "create" ? "create" : `${workspace.mode}-${workspace.questionId}`} workspace={workspace} onClose={close}
      onSaved={() => done(workspace.mode === "create" ? "Đã tạo câu hỏi bản nháp." : "Đã cập nhật câu hỏi.")} />}
    {action && (action.mode === "publish" || action.mode === "replace" ? <QuestionPublicationDialog key={`${action.mode}-${action.item.questionId}`} item={action.item} replacement={action.mode === "replace"} onClose={close}
      onDone={coverageWarnings => done(action.mode === "replace" ? "Đã xuất bản câu hỏi mới và ngưng sử dụng câu hỏi cũ." : "Đã xuất bản câu hỏi.", coverageWarnings)} />
      : <QuestionActionDialog key={`${action.mode}-${action.item.questionId}`} mode={action.mode} item={action.item} onClose={close} onDone={(copiedId, coverageWarnings) => {
        done(action.mode === "copy" ? "Đã sao chép câu hỏi thành bản nháp." : action.mode === "delete" ? "Đã xóa câu hỏi bản nháp." : "Đã ngưng sử dụng câu hỏi.", coverageWarnings);
        if (copiedId) setWorkspace({ mode: "edit", questionId: copiedId });
      }} />)}
  </div>;
}
