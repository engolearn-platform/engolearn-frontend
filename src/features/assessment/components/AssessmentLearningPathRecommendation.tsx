import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { AssessmentCard, AssessmentError, Confirmation } from "@features/assessment/components/AssessmentCommon";
import { useCreateLearningPath } from "@features/assessment/hooks/useCreateLearningPath";
import type { LearningPathRecommendation } from "@features/assessment/types/learning-path-recommendation.types";

interface Props {
  assessmentAttemptId: string;
  data: LearningPathRecommendation | null;
  error: string | undefined;
  refreshing: boolean;
  retry: () => void;
}

export function AssessmentLearningPathRecommendation({ assessmentAttemptId, data, error, refreshing, retry }: Props) {
  const navigate = useNavigate();
  const creation = useCreateLearningPath();
  const [confirmation, setConfirmation] = useState<LearningPathRecommendation | null>(null);
  const confirmCreation = async () => {
    if (!confirmation) return;
    const result = await creation.create({
      assessmentAttemptId, microSkills: confirmation.microSkills.map(skill => skill.name),
    });
    if (result?.kind === "busy") return;
    if (result?.kind === "created") {
      void navigate(`/learning-paths/${encodeURIComponent(result.pathId)}?week=1`);
      return;
    }
    setConfirmation(null);
    if (result?.kind === "conflict") retry();
  };
  if (data?.state === "NO_WEAK_SKILLS") return null;

  return <AssessmentCard>
    <h2 className="text-[22px] leading-7 font-semibold">Lộ trình học tập đề xuất</h2>
    {!data && (error
      ? <div className="mt-4"><AssessmentError message={error} retry={retry} /></div>
      : <p className="mt-4 text-muted-foreground" role="status">Đang tải đề xuất lộ trình…</p>)}
    {data?.state === "NO_ELIGIBLE_SKILLS" && <p className="mt-4 text-muted-foreground" role="status">{data.message}</p>}
    {data?.state === "ALREADY_CREATED" && <div className="mt-4 space-y-4"><p className="text-muted-foreground" role="status">Bạn đã có lộ trình học tập từ bài đánh giá này.</p>{data.existingPathId && <Button asChild className="h-12"><Link to={`/learning-paths/${encodeURIComponent(data.existingPathId)}?week=1`}>Xem lộ trình học tập</Link></Button>}</div>}
    {creation.error && <div className="mt-4"><AssessmentError message={creation.error} /></div>}
    {data?.state === "AVAILABLE" && <>
      <p className="mt-3 text-muted-foreground">Dựa trên kết quả bài đánh giá, bạn có thể tập trung luyện thêm các kỹ năng sau.</p>
      <ol className="mt-5 space-y-4">{data.microSkills.map((skill, index) => <li key={skill.name} className="rounded-xl border border-learning-outline bg-background p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 break-words font-semibold">{index + 1}. {skill.name}</h3>
          <span className="rounded-lg bg-learning-mint px-3 py-2 text-sm text-primary">{skill.skill === "LISTENING" ? "Nghe" : skill.skill === "READING" ? "Đọc" : skill.skill}</span>
        </div>
        <p className="mt-3 text-sm">{skill.correct}/{skill.total} câu ({skill.percent}%) · Cần luyện thêm</p>
      </li>)}</ol>
      <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-learning-mint p-4">
        <div><dt className="text-sm text-muted-foreground">Trình độ</dt><dd className="mt-1 font-semibold text-primary">{data.level}</dd></div>
        <div><dt className="text-sm text-muted-foreground">Thời gian</dt><dd className="mt-1 font-semibold text-primary">{data.durationWeeks} tuần</dd></div>
        <div><dt className="text-sm text-muted-foreground">Lịch luyện tập</dt><dd className="mt-1 font-semibold text-primary">{data.daysPerWeek} ngày/tuần</dd></div>
        <div><dt className="text-sm text-muted-foreground">Mỗi ngày</dt><dd className="mt-1 font-semibold text-primary">{data.questionsPerDay} câu hỏi</dd></div>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">Tổng cộng {data.durationWeeks * data.daysPerWeek * data.questionsPerDay} câu hỏi luyện tập.</p>
      <Button type="button" disabled={creation.pending || refreshing} className="mt-5 h-12 w-full" onClick={() => {
        creation.clearError();
        setConfirmation(data);
      }}>Tạo lộ trình học tập</Button>
    </>}
    <Confirmation open={confirmation !== null} title="Tạo lộ trình học tập?"
      description={confirmation ? `Bạn xác nhận tạo lộ trình ${confirmation.durationWeeks} tuần cho ${confirmation.microSkills.map(skill => skill.name).join(", ")}, với ${confirmation.daysPerWeek} ngày mỗi tuần và ${confirmation.questionsPerDay} câu hỏi mỗi ngày? Sau khi tạo, bạn sẽ được chuyển đến thông tin lộ trình ở tuần 1.` : ""}
      busy={creation.pending} onCancel={() => setConfirmation(null)} onConfirm={() => { void confirmCreation(); }} />
  </AssessmentCard>;
}
