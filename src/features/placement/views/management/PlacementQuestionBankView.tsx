import { useCallback, useState } from "react";
import { Link } from "react-router";
import { Plus, Upload } from "lucide-react";
import { ListPagination } from "@shared/components/management/ListPagination";
import { useFetch } from "@shared/hooks";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import { MANAGEMENT_LEVELS, MANAGEMENT_PATHS, MANAGEMENT_SKILLS, MANAGEMENT_SKILL_LABEL } from "@features/placement/constants/placement-management";
import { getQuestionIssues, getQuestionReadiness } from "@features/placement/utils/placement-management";
import type { ManagementQuestion } from "@features/placement/types/placement-management.types";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementConfirm, ManagementEmpty, ManagementField, ManagementHeader, managementInputClass } from "@features/placement/components/management/PlacementManagementUi";

const readinessLabel = { ready: "Sẵn sàng", missing: "Cần bổ sung", inactive: "Ngừng sử dụng" };
const statusLabel = { DRAFT: "Bản nháp", ACTIVE: "Đang hoạt động", INACTIVE: "Ngừng sử dụng" };
const emptyFilters = { search: "", skill: "", level: "", readiness: "", status: "" };

export default function PlacementQuestionBankView() {
  const { state, service, busy, run } = usePlacementManagement();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deactivating, setDeactivating] = useState<ManagementQuestion | null>(null);
  const update = (key: keyof typeof filters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const { search, level, status, skill } = filters;
  const useServerFilter = !!(search.trim() || level || status || skill);
  const query = useCallback((signal: AbortSignal) => service.findQuestions({ search, level, status, skill }, signal),
    [service, search, level, status, skill]);
  const { data, loading, error, refetch } = useFetch(query, useServerFilter);
  const rows = useServerFilter ? (loading ? [] : data ?? []) : state.questions;
  const filtered = rows.filter(question => !filters.readiness || getQuestionReadiness(question) === filters.readiness);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const offset = (activePage - 1) * pageSize;
  const stats = [
    ["Tổng số câu", state.questions.length],
    ["Chọn được vào bộ đề", state.questions.filter((question) => question.status === "ACTIVE" && getQuestionReadiness(question) === "ready").length],
    ["Cần bổ sung nội dung", state.questions.filter((question) => getQuestionReadiness(question) === "missing").length],
  ] as const;
  const deactivate = async () => {
    if (!deactivating || busy) return;
    const result = await run(async () => { await service.setQuestionStatus(deactivating, "INACTIVE"); return true; }, "Đã ngừng sử dụng câu hỏi.");
    if (result !== null) {
      setDeactivating(null);
      if (useServerFilter) void refetch();
    }
  };
  const activate = async (question: ManagementQuestion) => {
    const result = await run(async () => { await service.setQuestionStatus(question, "ACTIVE"); return true; }, "Đã kích hoạt câu hỏi.");
    if (result !== null && useServerFilter) void refetch();
  };
  return <div className="space-y-6">
    <ManagementHeader title="Ngân hàng câu hỏi" description="Chuẩn bị câu hỏi Reading và Listening cho các bộ đề đầu vào.">
      <ManagementButton asChild variant="outline"><Link to={MANAGEMENT_PATHS.importQuestions}><Upload className="size-4" />Nhập câu hỏi</Link></ManagementButton>
      <ManagementButton asChild><Link to={MANAGEMENT_PATHS.newQuestion}><Plus className="size-4" />Thêm câu hỏi</Link></ManagementButton>
    </ManagementHeader>
    <div className="grid gap-4 sm:grid-cols-3">{stats.map(([label, count]) => <ManagementCard key={label}><p className="text-body-md text-on-surface-variant">{label}</p><p className="mt-2 text-headline-lg font-bold text-on-surface">{count}</p></ManagementCard>)}</div>
    <ManagementCard className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <ManagementField label="Tìm câu hỏi"><input className={managementInputClass} value={filters.search} onChange={(event) => update("search", event.target.value)} placeholder="Mã hoặc nội dung…" /></ManagementField>
      <ManagementField label="Kỹ năng"><select className={managementInputClass} value={filters.skill} onChange={(event) => update("skill", event.target.value)}><option value="">Tất cả</option>{MANAGEMENT_SKILLS.map((skill) => <option key={skill} value={skill}>{MANAGEMENT_SKILL_LABEL[skill]}</option>)}</select></ManagementField>
      <ManagementField label="Trình độ"><select className={managementInputClass} value={filters.level} onChange={(event) => update("level", event.target.value)}><option value="">Tất cả</option>{MANAGEMENT_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></ManagementField>
      <ManagementField label="Hoàn thiện"><select className={managementInputClass} value={filters.readiness} onChange={(event) => update("readiness", event.target.value)}><option value="">Tất cả</option>{Object.entries(readinessLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></ManagementField>
      <ManagementField label="Trạng thái"><select className={managementInputClass} value={filters.status} onChange={(event) => update("status", event.target.value)}><option value="">Tất cả</option>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></ManagementField>
      <div className="flex items-end"><ManagementButton variant="outline" onClick={() => { setFilters(emptyFilters); setPage(1); }}>Đặt lại</ManagementButton></div>
    </ManagementCard>
    <ManagementCard className="overflow-hidden p-0">
      <div className="overflow-x-auto"><table className="w-full text-left text-body-md"><thead className="bg-surface-container-low text-label-lg text-on-surface-variant"><tr>{["Mã / Nội dung", "Kỹ năng", "Trình độ", "Dùng trong", "Hoàn thiện", "Thao tác"].map((label) => <th key={label} className="px-5 py-4 font-semibold" scope="col">{label}</th>)}</tr></thead>
        <tbody>{filtered.slice(offset, offset + pageSize).map((question) => {
          const readiness = getQuestionReadiness(question);
          const issues = getQuestionIssues(question);
          if (question.skill === "LISTENING" && question.mediaReady === false && !issues.length) {
            issues.push("Audio không có trong kho.");
          }
          return <tr key={question.id} className="border-t border-outline-variant align-top">
            <td className="max-w-sm px-5 py-4"><p className="font-semibold">{question.code}</p><p className="mt-1 line-clamp-2 break-words text-on-surface-variant">{question.prompt}</p></td>
            <td className="px-5 py-4">{MANAGEMENT_SKILL_LABEL[question.skill]}</td><td className="px-5 py-4"><ManagementBadge>{question.level}</ManagementBadge></td>
            <td className="whitespace-nowrap px-5 py-4">{state.testSets.filter((set) => set.questionIds.includes(question.id) || set.snapshot.some((item) => item.id === question.id)).length} bộ đề</td>
            <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><ManagementBadge tone={readiness === "ready" ? "success" : readiness === "missing" ? "warning" : "neutral"}>{readinessLabel[readiness]}</ManagementBadge><ManagementBadge>{statusLabel[question.status]}</ManagementBadge></div></td>
            <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><ManagementButton asChild variant="outline"><Link to={MANAGEMENT_PATHS.editQuestion(question.id)}>{readiness === "missing" ? "Bổ sung" : "Mở"}</Link></ManagementButton>
              {question.status === "ACTIVE" ? <ManagementButton variant="ghost" disabled={busy} onClick={() => setDeactivating(question)}>Ngừng sử dụng</ManagementButton> : <ManagementButton variant="ghost" disabled={busy || issues.length > 0} title={issues.join(" · ")} onClick={() => void activate(question)}>Kích hoạt</ManagementButton>}
            </div></td>
          </tr>;
        })}</tbody></table></div>
      {useServerFilter && loading && <p role="status" className="p-5">Đang tìm câu hỏi…</p>}
      {useServerFilter && error && <div role="alert" className="space-y-2 p-5"><p>{error.message}</p><ManagementButton variant="outline" onClick={refetch}>Thử lại</ManagementButton></div>}
      {!filtered.length && (!useServerFilter || (!loading && !error)) && <ManagementEmpty title="Chưa có câu hỏi phù hợp" description="Thử xóa bộ lọc hoặc thêm câu hỏi mới." />}
      <ListPagination total={filtered.length} from={filtered.length ? offset + 1 : 0} to={Math.min(offset + pageSize, filtered.length)} itemNoun="câu hỏi" page={activePage} pageCount={pageCount} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
    </ManagementCard>
    <ManagementConfirm open={deactivating !== null} title="Ngừng sử dụng câu hỏi?" description={`Câu ${deactivating?.code ?? ""} sẽ không được chọn vào bộ đề mới. Các phiên bản đã xuất bản được giữ nguyên.`} busy={busy} onClose={() => setDeactivating(null)} onConfirm={() => { void deactivate(); }} confirmLabel="Ngừng sử dụng" />
  </div>;
}
