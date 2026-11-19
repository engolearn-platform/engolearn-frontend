import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import { useFetch } from "@shared/hooks";
import { MANAGEMENT_PATHS, MANAGEMENT_SET_LABEL, MANAGEMENT_SKILLS, MANAGEMENT_SKILL_LABEL } from "@features/placement/constants/placement-management";
import { getSetIssues } from "@features/placement/utils/placement-management";
import type { PlacementSection } from "@features/placement/types/placement-management.types";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementEmpty, ManagementHeader, ManagementMissing } from "@features/placement/components/management/PlacementManagementUi";
import QuestionContent from "@features/placement/components/management/PlacementManagementQuestionContent";

export default function PlacementTestSetPreviewView() {
  const { setId } = useParams();
  const { state, service, run, busy } = usePlacementManagement();
  const navigate = useNavigate();
  const alive = useRef(true);
  const pending = useRef(false);
  const routeId = useRef(setId);
  routeId.current = setId;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [skill, setSkill] = useState<PlacementSection>("READING");
  const load = useCallback((signal: AbortSignal) => service.getSetPreview(setId!, signal), [service, setId]);
  const { data: set, loading, error, refetch } = useFetch(load, !!setId);
  if (!setId || error?.status === 404) return <ManagementMissing backTo={MANAGEMENT_PATHS.sets} />;
  if (error) return <ManagementCard><p role="alert">{error.message}</p><ManagementButton variant="outline" onClick={refetch}>Thử lại</ManagementButton></ManagementCard>;
  if (loading || !set || set.id !== setId) return <ManagementCard><p role="status">Đang tải bản xem trước…</p></ManagementCard>;
  const questions = set.snapshot;
  const immutable = set.status !== "DRAFT" || set.lockedSeed;
  const createVersion = async () => {
    if (busy || pending.current) return;
    pending.current = true;
    const id = set.id;
    const next = await run(() => service.newVersion(id), "Đã tạo phiên bản nháp mới.");
    pending.current = false;
    if (next && alive.current && routeId.current === id) navigate(MANAGEMENT_PATHS.editSet(next.id));
  };
  return <><ManagementHeader title={set.name} description={`${set.code} · v${set.version} · ${questions.length} câu · 15 phút`}><ManagementButton variant="outline" disabled={busy} onClick={() => navigate(immutable ? MANAGEMENT_PATHS.sets : MANAGEMENT_PATHS.editSet(set.id))}>← {immutable ? "Bộ đề" : "Soạn đề"}</ManagementButton>{immutable && <ManagementButton disabled={busy} onClick={() => void createVersion()}>Tạo phiên bản mới</ManagementButton>}</ManagementHeader><ManagementCard className="mb-5 space-y-3"><ManagementBadge tone={set.status === "PUBLISHED" ? "success" : set.status === "DRAFT" ? "warning" : "neutral"}>{MANAGEMENT_SET_LABEL[set.status]}</ManagementBadge><p className="text-body-md">{immutable ? "Chế độ chỉ xem · Bản chụp phiên bản được giữ nguyên khi ngân hàng câu hỏi thay đổi." : `Xem trước bản nháp đã lưu · ${getSetIssues(set.name, set.questionIds, state.questions).length} mục cần kiểm tra trước khi xuất bản.`}</p><p className="text-label-sm text-on-surface-variant">Xem trước phục vụ quản trị, hiển thị đáp án và không tạo lượt làm bài.</p></ManagementCard><div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Kỹ năng">{MANAGEMENT_SKILLS.map(item => <ManagementButton key={item} variant={skill === item ? "default" : "outline"} aria-pressed={skill === item} onClick={() => setSkill(item)}>{MANAGEMENT_SKILL_LABEL[item]} · {questions.filter(question => question.skill === item).length} câu</ManagementButton>)}</div><div className="space-y-4">{questions.filter(question => question.skill === skill).map((question, index) => <ManagementCard key={`${question.id}-${index}`}><details><summary className="cursor-pointer text-body-md font-semibold">{skill === "READING" ? "R" : "L"}{index + 1} · {question.level} · {question.prompt}</summary><div className="mt-5"><QuestionContent question={question} /></div></details></ManagementCard>)}{!questions.some(question => question.skill === skill) && <ManagementCard><ManagementEmpty title="Chưa có câu hỏi cho kỹ năng này" /></ManagementCard>}</div></>;
}
