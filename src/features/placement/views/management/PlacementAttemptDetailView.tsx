import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { Link, useParams } from "react-router";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import { MANAGEMENT_ATTEMPT_LABEL, MANAGEMENT_LEVELS, MANAGEMENT_PATHS, MANAGEMENT_SKILLS, MANAGEMENT_SKILL_LABEL } from "@features/placement/constants/placement-management";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementHeader, ManagementMissing } from "@features/placement/components/management/PlacementManagementUi";
import PlacementAttemptReview from "@features/placement/components/management/attempts/PlacementAttemptReview";
import { countAnswers, isFinalAttempt } from "@features/placement/components/management/attempts/attemptReview";
import { formatManagementDate } from "@features/placement/utils/placement-management";

const claimLabels: Record<string, string> = {
  ALREADY_CLAIMED: "Đã nhận kết quả",
  CLAIMABLE: "Chờ nhận kết quả",
  CLAIM_EXPIRED: "Hết hạn nhận kết quả",
  EXPIRED: "Hết hạn nhận kết quả",
  NO_RESULT: "Không có kết quả để nhận",
};

export default function PlacementAttemptDetailView() {
  const { attemptId } = useParams();
  const { service } = usePlacementManagement();
  const fetchAttempt = useCallback((signal: AbortSignal) => service.getAttempt(attemptId!, signal), [service, attemptId]);
  const { data: attempt, loading, error, refetch } = useFetch(fetchAttempt, !!attemptId);
  if (!attemptId || error?.status === 404) return <ManagementMissing backTo={MANAGEMENT_PATHS.attempts} label="Quay lại danh sách lượt làm" />;
  if (error) return <ManagementCard><p role="alert">{error.message}</p><ManagementButton variant="outline" onClick={refetch}>Thử lại</ManagementButton></ManagementCard>;
  if (loading || !attempt || attempt.id !== attemptId) return <ManagementCard><p role="status">Đang tải chi tiết lượt làm…</p></ManagementCard>;
  const final = isFinalAttempt(attempt);
  const total = attempt.totalQuestions ?? attempt.snapshot.length;
  const recorded = attempt.snapshot.flatMap((question, index) => {
    const answerId = attempt.answers[question.id];
    if (!answerId) return [];
    const answer = question.options.find(option => option.id === answerId);
    return [{ id: question.id, label: `Câu ${index + 1}`, answer: answer ? `${answer.label}. ${answer.text}` : answerId }];
  });
  const snapshotIds = new Set(attempt.snapshot.map(question => question.id));
  for (const [id, answer] of Object.entries(attempt.answers)) {
    if (answer && !snapshotIds.has(id)) recorded.push({ id, label: id, answer });
  }
  const counts = countAnswers(attempt.snapshot, attempt.answers);
  const metrics = final ? [
    { label: "Điểm số", value: total ? `${attempt.correctCount}/${total}` : attempt.correctCount, note: "Điểm đã lưu khi chấm bài" },
    { label: "Trình độ xếp loại", value: attempt.level ?? "—", note: "Kết quả của lượt làm" },
    ...MANAGEMENT_SKILLS.map(skill => {
      const questions = attempt.snapshot.filter(question => question.skill === skill);
      return { label: MANAGEMENT_SKILL_LABEL[skill], value: `${countAnswers(questions, attempt.answers).correct}/${questions.length}`, note: "Số câu đúng / tổng số câu" };
    }),
  ] : [];

  return <>
    <ManagementHeader title="Chi tiết lượt làm" description={`${attempt.id} · Chế độ chỉ xem`}><Link to={MANAGEMENT_PATHS.attempts} className="inline-flex min-h-12 items-center rounded-xl border border-outline-variant px-4 font-semibold text-primary hover:bg-learning-nav-active focus-visible:outline-2 focus-visible:outline-primary">← Danh sách lượt làm</Link></ManagementHeader>
    <div className="space-y-6">
      <ManagementCard>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-headline-md font-semibold">{attempt.name}</h2><p className="mt-1 text-body-md text-on-surface-variant">{attempt.kind === "USER" ? "Thành viên" : "Khách"}{attempt.userId ? ` · ${attempt.userId}` : ""}</p></div><ManagementBadge tone={final ? "success" : attempt.status === "IN_PROGRESS" ? "warning" : "neutral"}>{MANAGEMENT_ATTEMPT_LABEL[attempt.status]}</ManagementBadge></div>
        <dl className="my-5 grid gap-4 border-y border-outline-variant py-5 text-body-md sm:grid-cols-2 xl:grid-cols-5"><div><dt className="text-label-sm text-on-surface-variant">Bộ đề được giao</dt><dd className="mt-1 font-semibold">{attempt.testSetCode} · v{attempt.testSetVersion}</dd></div><div><dt className="text-label-sm text-on-surface-variant">Bắt đầu</dt><dd className="mt-1">{formatManagementDate(attempt.startedAt)}</dd></div><div><dt className="text-label-sm text-on-surface-variant">Deadline</dt><dd className="mt-1">{attempt.deadlineAt ? formatManagementDate(attempt.deadlineAt) : "—"}</dd></div><div><dt className="text-label-sm text-on-surface-variant">Kết thúc</dt><dd className="mt-1">{attempt.endedAt ? formatManagementDate(attempt.endedAt) : "—"}</dd></div><div><dt className="text-label-sm text-on-surface-variant">Bản chụp nội dung</dt><dd className="mt-1">{total} câu · Phiên bản cố định</dd></div></dl>
        {final ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => <div key={metric.label} className={`rounded-xl p-4 ${metric.label === "Trình độ xếp loại" ? "bg-learning-mint text-primary" : "bg-surface-container-low"}`}><p className="text-label-lg">{metric.label}</p><p className="my-2 text-headline-lg font-bold">{metric.value}</p><p className="text-label-sm">{metric.note}</p></div>)}</div> : <div role="status" className="rounded-xl bg-learning-note p-4 text-body-md text-learning-note-ink">{attempt.status === "IN_PROGRESS" ? "Lượt làm đang diễn ra. Chưa có kết quả để xem." : "Lượt làm hết hạn. Không có kết quả đã chấm để xem."}</div>}
        {(attempt.kind === "GUEST" || attempt.claimStatus) && <div className="mt-5 rounded-xl border border-outline-variant p-4"><p className="text-label-lg font-semibold">Trạng thái nhận kết quả của khách</p><p className="mt-1 text-body-md">{claimLabels[attempt.claimStatus ?? ""] ?? attempt.claimStatus ?? "Chưa có thông tin nhận kết quả"}</p><p className="mt-1 text-label-sm text-on-surface-variant">Thông tin này tách biệt với trạng thái nộp bài.</p></div>}
      </ManagementCard>
      {!final && <ManagementCard>
        <h2 className="text-title-md font-semibold">Câu trả lời đã ghi nhận</h2>
        {recorded.length ? <ul className="mt-4 space-y-3">{recorded.map(row => <li key={row.id}>
          <span className="font-semibold">{row.label}</span> · {row.answer}
        </li>)}</ul> : <p className="mt-3 text-body-md">Chưa ghi nhận câu trả lời.</p>}
      </ManagementCard>}
      {final && attempt.snapshot.length > 0 && <><ManagementCard><h2 className="text-title-md font-semibold">Kết quả theo trình độ</h2><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">{MANAGEMENT_LEVELS.map(level => {
        const questions = attempt.snapshot.filter(question => question.level === level);
        return <div key={level} className="rounded-xl border border-outline-variant p-4"><p className="text-label-lg text-on-surface-variant">{level}</p><p className="mt-2 text-title-lg font-semibold">{countAnswers(questions, attempt.answers).correct}/{questions.length}</p></div>;
      })}</div><p className="mt-4 text-label-sm text-on-surface-variant">{counts.correct} đúng · {counts.wrong + counts.blank} sai · Tổng {total} câu.</p></ManagementCard><PlacementAttemptReview key={attempt.id} attempt={attempt} /></>}
    </div>
  </>;
}
