import { vietnamTime } from "@features/assessment/utils/assessmentFormat";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useAuth } from "@shared/hooks/useAuth";
import { assessmentApi, mediaUrl, abandonOnLeave, leaveHeaders } from "@features/assessment/services/assessmentApi";
import { pendingSession, currentSession } from "@features/assessment/services/assessmentSession";
import { useAssessmentQuery } from "@features/assessment/hooks/useAssessmentQuery";
import { AssessmentCard, AssessmentError, Confirmation, DevelopmentNotice } from "@features/assessment/components/AssessmentCommon";

export default function AssessmentPreparationView() {
  const {user} = useAuth();
  const navigate = useNavigate();
  const query = useAssessmentQuery(useCallback((signal: AbortSignal) => assessmentApi.preparation(signal), []));
  const [rules, setRules] = useState(false), [heard, setHeard] = useState(false);
  const [sound, setSound] = useState<string | null>(null), [played, setPlayed] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const [abandon, setAbandon] = useState(false);
  const mounted = useRef(true);
  const soundElement = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {mounted.current = true; return () => {mounted.current = false;};}, []);
  useEffect(() => {const audio = soundElement.current; return () => {audio?.pause();if (sound) URL.revokeObjectURL(sound);};}, [sound]);
  const prepareSound = async () => {
    setBusy(true); setError(null);
    try { const media = await assessmentApi.sound(); if (mounted.current) setSound(mediaUrl(media)); }
    catch (e) {if (mounted.current) setError((e as Error).message);}
    finally {if (mounted.current) setBusy(false);}
  };
  const start = async () => {
    if (!user) return;
    setBusy(true); setError(null);
    const session = pendingSession(user.id);
    const identity = leaveHeaders();
    try {
      const state = await assessmentApi.start(session.requestId, session.binding);
      if (!mounted.current) {session.state = state;session.live = false;if (state.status === "ACTIVE") abandonOnLeave(state.id, identity);return;}
      session.state = state; session.live = state.status === "ACTIVE";
      if (mounted.current) navigate(state.status === "ACTIVE" ? "/assessment/taking" : "/assessment/history");
    } catch (e) {if (mounted.current) {setError((e as Error).message); query.refetch();}}
    finally {if (mounted.current) setBusy(false);}
  };
  const data = query.data;
  if (query.loading && !data) return <p className="p-5" role="status">Đang kiểm tra điều kiện làm bài…</p>;
  if (!data) return <div className="p-5"><AssessmentError message={query.error?.message ?? "Không tải được thông tin."} retry={query.refetch} /></div>;
  const eligible = data.baselineValid && data.cooldownSatisfied && data.paperAvailable && !!data.quota && data.quota.remaining > 0;
  return <div className="mx-auto max-w-5xl space-y-5 p-5 pb-24">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[28px] leading-9 font-bold">Đánh giá định kỳ</h1><p className="mt-2">Kiểm tra kỹ năng đọc và nghe để biết phần cần luyện thêm.</p></div><Button asChild variant="outline" className="h-12"><Link to="/assessment/history">Lịch sử đánh giá</Link></Button></div>
    <DevelopmentNotice show={data.developmentData} />
    {error && <AssessmentError message={error} />}
    {data.activeAttemptId ? <AssessmentCard><h2 className="text-[22px] leading-7 font-semibold">Bạn đang có một bài chưa kết thúc</h2><p className="my-4">Hãy quay về trang đã bắt đầu bài. Trang mới không khôi phục tiến trình. Nếu bỏ bài cũ, lượt đã dùng không được hoàn.</p><Button className="h-12" variant="outline" onClick={() => setAbandon(true)}>Bỏ bài cũ</Button>{rules && heard && currentSession()?.owner === user?.id && currentSession()?.state === null && <Button className="ml-3 h-12" disabled={busy} onClick={() => void start()}>Thử lại yêu cầu bắt đầu</Button>}</AssessmentCard> : null}
    <AssessmentCard><h2 className="text-[22px] leading-7 font-semibold">Cấu trúc bài đánh giá</h2><p className="mt-3">50 câu · Đọc 30 · Nghe 20 · Tối đa 60 phút</p><p className="mt-2 text-sm text-muted-foreground">Làm phần Đọc trước, phần Nghe sau. Thời gian thừa không cộng sang câu hoặc nhóm tiếp theo.</p></AssessmentCard>
    <div className="grid gap-5 md:grid-cols-2">
      <AssessmentCard><h2 className="text-[22px] leading-7 font-semibold">Điều kiện làm bài</h2><ul className="mt-4 space-y-3"><li>{data.baselineValid ? "✓ Có kết quả đầu vào hoặc định kỳ hợp lệ" : "Cần hoàn thành đánh giá đầu vào trước"}</li><li>{data.cooldownSatisfied ? "✓ Đã đủ thời gian chờ" : `Có thể làm từ ${data.eligibleAt ? vietnamTime(data.eligibleAt) : "ngày đủ điều kiện"}`}</li><li>{data.quota ? `Còn ${data.quota.remaining}/${data.quota.limit} lượt tháng này` : "Xử lý bài đang mở trước khi xét lượt mới"}</li><li>{data.paperAvailable ? "✓ Có bộ đề đang sử dụng" : "Chưa có bộ đề đang sử dụng"}</li></ul></AssessmentCard>
      <AssessmentCard><h2 className="text-[22px] leading-7 font-semibold">Thử âm thanh</h2><p className="my-3">Kiểm tra loa hoặc tai nghe trước khi vào bài. Chưa tính lượt.</p>{sound ? <audio ref={soundElement} controls src={sound} onPlay={() => setPlayed(true)} onError={() => {setHeard(false);setPlayed(false);setError("Không phát được âm thanh mẫu.");}} className="w-full" /> : <Button className="h-12" variant="outline" disabled={busy} onClick={() => void prepareSound()}>Nghe thử</Button>}<label className="mt-4 flex min-h-12 items-center gap-3"><input type="checkbox" checked={heard} disabled={!played} onChange={e => setHeard(e.target.checked)} />Tôi nghe rõ âm thanh mẫu</label></AssessmentCard>
    </div>
    <AssessmentCard><h2 className="text-[22px] leading-7 font-semibold">Quy tắc làm bài</h2><ul className="my-4 list-inside list-disc space-y-2"><li>Làm theo thứ tự, không quay lại.</li><li>Mỗi audio chỉ nghe một lần.</li><li>Bỏ dở vẫn tính lượt; tải lại trang không tiếp tục bài.</li></ul><label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={rules} onChange={e => setRules(e.target.checked)} />Tôi đã hiểu quy tắc làm bài.</label><Button className="mt-4 h-12 rounded-xl" disabled={!eligible || !rules || !heard || busy || !!data.activeAttemptId} onClick={() => void start()}>{busy ? "Đang xử lý…" : "Bắt đầu bài đánh giá"}</Button><p className="mt-3 text-sm text-muted-foreground">Chỉ tính lượt khi tạo bài thành công.</p></AssessmentCard>
    <Confirmation open={abandon} title="Bỏ bài đang mở?" description="Bài sẽ không có điểm, không được làm tiếp và không hoàn lượt. Bạn sẽ trở về chuẩn bị, không tự bắt đầu bài mới." busy={busy} onCancel={() => setAbandon(false)} onConfirm={() => {setBusy(true); void assessmentApi.abandon(data.activeAttemptId!).then(() => {setAbandon(false); query.refetch();}).catch(e => setError((e as Error).message)).finally(() => setBusy(false));}} />
  </div>;
}
