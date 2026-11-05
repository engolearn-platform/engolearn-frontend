import { vietnamTime } from "@features/assessment/utils/assessmentFormat";
import { useCallback } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useAssessmentQuery } from "@features/assessment/hooks/useAssessmentQuery";
import { assessmentApi } from "@features/assessment/services/assessmentApi";
import { AssessmentCard, AssessmentError, DevelopmentNotice } from "@features/assessment/components/AssessmentCommon";
import { AssessmentResultSummary } from "@features/assessment/components/AssessmentResultSummary";

const band = {NEEDS_PRACTICE: "Cần luyện thêm", MONITOR: "Cần theo dõi", MEETS_THRESHOLD: "Đạt ngưỡng của bài"};
export default function AssessmentResultView() {
  const {attemptId = ""} = useParams();
  const query = useAssessmentQuery(useCallback((signal: AbortSignal) => assessmentApi.result(attemptId, signal), [attemptId]));
  const data = query.data;
  if (query.loading && !data) return <p className="p-5" role="status">Đang tải kết quả…</p>;
  if (!data) return <div className="space-y-5 p-5"><AssessmentError message={query.error?.message ?? "Chưa có kết quả để hiển thị."} retry={query.refetch} /><Button asChild variant="outline" className="h-12"><Link to="/assessment/history">Về lịch sử</Link></Button></div>;
  return <div className="mx-auto max-w-7xl space-y-5 p-5 pb-24"><DevelopmentNotice show={data.developmentData} /><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[28px] leading-9 font-bold">Kết quả đánh giá định kỳ</h1><p className="mt-2 text-sm text-muted-foreground">{data.series} v{data.paperVersion} · {vietnamTime(data.submittedAt)}</p></div><div className="flex flex-wrap gap-3"><Button asChild className="h-12"><Link to="/assessment/history">Lịch sử đánh giá</Link></Button></div></div>
    <AssessmentResultSummary data={data} />
    <div className="grid items-start gap-5 xl:grid-cols-2">
    <AssessmentCard><div className="flex flex-wrap justify-between gap-3"><h2 className="text-[22px] leading-7 font-semibold">Kỹ năng đọc và nghe của bạn</h2><span className="rounded-lg bg-learning-mint px-3 py-2 text-sm text-primary">{data.fullAnalysis ? "Đã mở đủ 5 kỹ năng" : `Đang xem ${data.skills.length}/${data.measuredSkills} kỹ năng`}</span></div><p className="mt-3 text-muted-foreground">Mỗi kỹ năng là một khả năng cụ thể, như tìm ý chính hoặc nghe chi tiết. Bài này chỉ đo 5 kỹ năng được hỏi.</p><p className="mt-2 text-sm text-muted-foreground">{data.fullAnalysis ? "Quyền xem đầy đủ đã được cấp cho bài này." : "Free hiển thị 2 kỹ năng có tỷ lệ đúng thấp nhất."}</p>
      <ol className="mt-5 space-y-4">{data.skills.map((skill, index) => <li key={skill.code} className="grid items-center gap-4 rounded-xl border border-learning-outline bg-background p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><h3 className="font-semibold">{index + 1}. {skill.name}</h3><p className="mt-1 text-sm text-muted-foreground">{skill.example}</p></div><div className="sm:col-span-2"><p className="mb-2 text-sm">{skill.correct}/{skill.total} câu ({skill.percentage}%)</p><progress aria-label={skill.name} max={100} value={skill.percentage} className="h-2 w-full accent-primary" /></div><span className="rounded-lg border border-learning-outline bg-white p-2 text-center text-sm">{band[skill.band]}</span></li>)}</ol>
      {!data.fullAnalysis && <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-learning-outline p-4"><div><h3 className="font-semibold">Còn {data.measuredSkills - data.skills.length} kỹ năng</h3><p className="mt-1 text-sm text-muted-foreground">Xem đủ khi có quyền Premium hoặc dùng thử.</p></div><Button asChild className="h-12"><Link to="/subscription">Xem gói học</Link></Button></div>}
    </AssessmentCard>
    <AssessmentCard className="hidden min-h-80 xl:block"><div aria-label="Khu vực dành cho lộ trình học" /></AssessmentCard>
    </div>
  </div>;
}
