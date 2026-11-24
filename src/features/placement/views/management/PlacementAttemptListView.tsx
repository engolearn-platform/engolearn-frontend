import { useCallback, useState } from "react";
import { Link } from "react-router";
import { useFetch } from "@shared/hooks";
import { ListPagination } from "@shared/components/management/ListPagination";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import { MANAGEMENT_ATTEMPT_LABEL, MANAGEMENT_LEVELS, MANAGEMENT_PATHS } from "@features/placement/constants/placement-management";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementEmpty, ManagementField, ManagementHeader, managementInputClass } from "@features/placement/components/management/PlacementManagementUi";
import type { ManagementAttemptFilters, ManagementAttemptSummary } from "@features/placement/types/placement-management.types";
import { formatManagementDate } from "@features/placement/utils/placement-management";

const emptyFilters: ManagementAttemptFilters = { search: "", testSetCode: "", version: "", status: "", level: "", from: "", to: "" };
const columns = ["Người làm", "Bộ đề", "Bắt đầu", "Trạng thái", "Điểm", "CEFR", "Chi tiết"];

function AttemptRow({ attempt, testSetName }: { attempt: ManagementAttemptSummary; testSetName?: string }) {
  const graded = (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") && attempt.correctCount !== null;
  return <tr>
    <td className="px-5 py-4">
      <p className="font-semibold">{attempt.name}</p>
      <p className="text-label-sm text-on-surface-variant">{attempt.kind === "USER" ? "Thành viên" : "Khách"} · {attempt.id}</p>
    </td>
    <td className="max-w-sm px-5 py-4"><span className="font-semibold">{testSetName || attempt.testSetCode || "—"}</span>
      <p className="text-label-sm text-on-surface-variant">Phiên bản {attempt.testSetVersion}</p>
    </td>
    <td className="whitespace-nowrap px-5 py-4">{formatManagementDate(attempt.startedAt)}</td>
    <td className="px-5 py-4"><ManagementBadge tone={graded ? "success" : attempt.status === "IN_PROGRESS" ? "warning" : "neutral"}>{MANAGEMENT_ATTEMPT_LABEL[attempt.status]}</ManagementBadge></td>
    <td className="whitespace-nowrap px-5 py-4 font-semibold">{graded ? `${attempt.correctCount}${attempt.totalQuestions ? `/${attempt.totalQuestions}` : ""}` : "—"}</td>
    <td className="px-5 py-4">{graded && attempt.level ? <ManagementBadge>{attempt.level}</ManagementBadge> : "—"}</td>
    <td className="px-5 py-4"><Link to={MANAGEMENT_PATHS.attempt(attempt.id)} aria-label={`Xem lượt làm ${attempt.id}`} className="inline-flex min-h-12 items-center rounded-xl px-3 font-semibold text-primary hover:bg-learning-nav-active focus-visible:outline-2 focus-visible:outline-primary">Xem</Link></td>
  </tr>;
}

export default function PlacementAttemptListView() {
  const { state, service } = usePlacementManagement();
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fetchPage = useCallback((signal: AbortSignal) => service.listAttempts(applied, page - 1, pageSize, signal),
    [service, applied, page, pageSize]);
  const { data, loading, error, refetch } = useFetch(fetchPage);
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);
  const update = (key: keyof ManagementAttemptFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const sets = [...new Set(state.testSets.map(set => set.code))].sort();
  const total = data?.total ?? 0;
  const offset = (page - 1) * pageSize;

  return <>
    <ManagementHeader title="Kết quả Placement" description="Tra cứu lượt làm của thành viên và khách." />
    <ManagementCard className="mb-6">
      <form onSubmit={event => { event.preventDefault(); if (!invalidRange) { setApplied({ ...filters }); setPage(1); } }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementField label="Mã lượt làm hoặc mã User"><input className={managementInputClass} value={filters.search} maxLength={100} onChange={event => update("search", event.target.value)} /></ManagementField>
        <ManagementField label="Mã bộ đề"><input className={managementInputClass} list="placement-set-codes" value={filters.testSetCode} maxLength={100} onChange={event => update("testSetCode", event.target.value)} />
          <datalist id="placement-set-codes">{sets.map(code => <option key={code} value={code} />)}</datalist>
        </ManagementField>
        <ManagementField label="Phiên bản"><input type="number" min="1" max="2147483647" className={managementInputClass} value={filters.version} onChange={event => update("version", event.target.value)} /></ManagementField>
        <ManagementField label="Trạng thái"><select className={managementInputClass} value={filters.status} onChange={event => update("status", event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(MANAGEMENT_ATTEMPT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></ManagementField>
        <ManagementField label="Kết quả CEFR"><select className={managementInputClass} value={filters.level} onChange={event => update("level", event.target.value)}><option value="">Tất cả trình độ</option>{MANAGEMENT_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></ManagementField>
        <ManagementField label="Từ ngày"><input type="date" className={managementInputClass} value={filters.from} onChange={event => update("from", event.target.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? "attempt-date-error" : undefined} /></ManagementField>
        <ManagementField label="Đến ngày"><input type="date" className={managementInputClass} value={filters.to} onChange={event => update("to", event.target.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? "attempt-date-error" : undefined} /></ManagementField>
        <div className="flex flex-wrap items-end gap-2"><ManagementButton type="submit" disabled={invalidRange}>Lọc lượt làm</ManagementButton><ManagementButton type="button" variant="outline" onClick={() => { setFilters(emptyFilters); setApplied(emptyFilters); setPage(1); }}>Đặt lại</ManagementButton></div>
        {invalidRange && <p id="attempt-date-error" role="alert" className="text-body-md text-error sm:col-span-2 xl:col-span-4">Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.</p>}
      </form>
    </ManagementCard>
    <ManagementCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
        <h2 className="text-title-md font-semibold">Danh sách lượt làm</h2>
        <span role="status" className="text-label-lg text-on-surface-variant">{loading ? "Đang tải lượt làm…" : data ? `${total} lượt làm` : ""}</span>
      </div>
      {error && <div className="p-5"><p role="alert">{error.message}</p><ManagementButton variant="outline" onClick={refetch}>Thử lại</ManagementButton></div>}
      {!loading && data && <>
        {data.items.length ? <div className="overflow-x-auto"><table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-low text-label-lg text-on-surface-variant"><tr>{columns.map(label => <th key={label} scope="col" className="whitespace-nowrap px-5 py-4 font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-outline-variant">{data.items.map(attempt => <AttemptRow key={attempt.id} attempt={attempt} testSetName={state.testSets.find(set => set.code === attempt.testSetCode && set.version === attempt.testSetVersion)?.name} />)}</tbody>
        </table></div> : <ManagementEmpty title="Không tìm thấy lượt làm" description="Thử thay đổi bộ lọc hoặc đặt lại để xem tất cả lượt làm." />}
        <ListPagination compact total={total} from={data.items.length ? offset + 1 : 0} to={data.items.length ? offset + data.items.length : 0}
          itemNoun="lượt làm" page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} pageCount={Math.max(1, Math.ceil(total / pageSize))}
          onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </>}
    </ManagementCard>
  </>;
}
