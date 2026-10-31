import { statusLabel, vietnamTime } from "@features/assessment/utils/assessmentFormat";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useAssessmentQuery } from "@features/assessment/hooks/useAssessmentQuery";
import { assessmentApi } from "@features/assessment/services/assessmentApi";
import { AssessmentCard, AssessmentError } from "@features/assessment/components/AssessmentCommon";

export default function AssessmentHistoryView() {
  const [page, setPage] = useState(0);
  const query = useAssessmentQuery(useCallback((signal: AbortSignal) => assessmentApi.history(page, signal), [page]));
  return <div className="mx-auto max-w-6xl space-y-5 p-5 pb-24"><div className="flex flex-wrap justify-between gap-4"><h1 className="text-[28px] leading-9 font-bold">Lịch sử đánh giá định kỳ</h1><Button asChild variant="outline" className="h-12"><Link to="/assessment">Về chuẩn bị</Link></Button></div>
    {query.loading ? <p role="status">Đang tải lịch sử…</p> : query.error ? <AssessmentError message={query.error.message} retry={query.refetch} /> : !query.data?.length ? <AssessmentCard><h2 className="text-[22px] leading-7 font-semibold">Chưa có bài đánh giá</h2><p className="mt-3">Các bài đã kết thúc sẽ xuất hiện ở đây.</p></AssessmentCard> :
      <AssessmentCard><div className="overflow-x-auto"><table className="w-full text-left"><caption className="mb-4 text-left font-semibold">Các bài đã kết thúc</caption><thead className="border-b border-learning-outline text-sm"><tr>{["Thời điểm kết thúc", "Trạng thái", "Điểm", "Mức của bài", "Thao tác"].map(title => <th key={title} scope="col" className="p-3">{title}</th>)}</tr></thead><tbody>{query.data.map(item => <tr key={item.id} className="border-b border-learning-outline"><td className="p-3 whitespace-nowrap">{vietnamTime(item.finishedAt)}</td><td className="p-3">{statusLabel[item.status] ?? "Đang xử lý"}</td><td className="p-3">{item.score === null ? "—" : `${item.score}/100`}</td><td className="p-3">{item.level ?? "—"}</td><td className="p-3">{item.status === "READY" ? <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="h-12"><Link to={`/assessment/attempts/${item.id}/result`}>Kết quả</Link></Button><Button asChild variant="ghost" className="h-12"><Link to={`/assessment/attempts/${item.id}/review`}>Xem lại</Link></Button></div> : <span className="text-sm text-muted-foreground">Không có nội dung xem lại</span>}</td></tr>)}</tbody></table></div></AssessmentCard>}
    <nav aria-label="Trang lịch sử" className="flex items-center justify-end gap-4"><Button variant="outline" className="h-12" disabled={page === 0 || query.loading} onClick={() => setPage(p => p - 1)}>Trước</Button><span>Trang {page + 1}</span><Button variant="outline" className="h-12" disabled={query.loading || (query.data?.length ?? 0) < 20} onClick={() => setPage(p => p + 1)}>Sau</Button></nav>
  </div>;
}
