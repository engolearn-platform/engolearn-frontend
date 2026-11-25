import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { speakingV2Service, SpeakingV2ApiError } from "@features/speaking/services/speaking-v2.service";
import type { SpeakingAvailability, SpeakingScope, SpeakingSession } from "@features/speaking/types/speaking-v2.types";
import { speakingEntryPath, speakingHistoryUrl } from "@features/speaking/utils/speaking-history-navigation";

const accessMessages: Record<string, string> = {
  LEVEL_TOO_HIGH: "Chủ đề này yêu cầu trình độ cao hơn cấp độ hiện tại của bạn.",
  ITEM_LOCKED: "Hãy hoàn thành mục học trước đó để mở phần luyện nói này.",
  PROFILE_DISABLED: "Chủ đề chưa có hồ sơ Speaking đang hoạt động.",
  SCOPE_FORBIDDEN: "Bạn chưa thể truy cập phần luyện nói này.",
  DAILY_QUOTA_REACHED: "Bạn đã dùng hết thời lượng luyện nói hôm nay.",
};
function availabilityReason(reason: string | null) {
  return reason ? accessMessages[reason] ?? "Hiện chưa thể bắt đầu phiên luyện nói mới." : "Chủ đề chưa có hồ sơ Speaking được xuất bản.";
}
function operationError(cause: unknown, fallback: string) {
  if (cause instanceof SpeakingV2ApiError && accessMessages[cause.code]) return accessMessages[cause.code];
  return cause instanceof Error ? cause.message : fallback;
}

export function TopicSpeakingEntry() {
  const { topicId = "" } = useParams();
  return <SpeakingEntry scope={{ type: "TOPIC", topicId, topicItemId: null }} />;
}

export function ItemSpeakingEntry() {
  const { topicId = "", itemId = "" } = useParams();
  return <SpeakingEntry scope={{ type: "TOPIC_ITEM", topicId, topicItemId: itemId }} />;
}

export function SpeakingEntry({ scope: scopeInput }: { scope: SpeakingScope }) {
  const { type, topicId, topicItemId } = scopeInput;
  const scope = useMemo(() => ({ type, topicId, topicItemId }), [type, topicId, topicItemId]);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [availability, setAvailability] = useState<SpeakingAvailability | null>(null);
  const [active, setActive] = useState<SpeakingSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rawReturnTo = search.get("from");
  const returnTo = rawReturnTo?.startsWith("/") && !rawReturnTo.startsWith("//")
    ? rawReturnTo : `/topics/${encodeURIComponent(scope.topicId)}`;
  const historyLink = speakingHistoryUrl({ kind: "exact", scope, page: 0, origin: speakingEntryPath(scope) });

  const load = useCallback(async () => {
    setError("");
    try {
      const next = await speakingV2Service.availability(scope);
      setAvailability(next);
      if (next.activeSession) setActive(await speakingV2Service.get(next.activeSession.sessionId));
      else setActive(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không kiểm tra được Speaking."); }
  }, [scope]);
  useEffect(() => { void load(); }, [load]);

  async function preflightMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Trình duyệt này không hỗ trợ micro. Hãy dùng trình duyệt khác.");
    const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
    probe.getTracks().forEach(track => track.stop());
  }
  async function create() {
    setBusy(true); setError("");
    try {
      await preflightMicrophone();
      const session = await speakingV2Service.create(scope);
      navigate(`/speaking/sessions/${encodeURIComponent(session.sessionId)}`, { state: { returnTo } });
    } catch (cause) {
      if (cause instanceof SpeakingV2ApiError && cause.code === "ACTIVE_SESSION_EXISTS" && cause.activeSessionId) {
        try {
          setActive(await speakingV2Service.get(cause.activeSessionId));
          setAvailability(previous => previous ? { ...previous, available: true } : previous);
          setError("Bạn đã có phiên luyện đang mở. Hãy tiếp tục phiên đó hoặc kết thúc trước khi tạo phiên mới.");
        } catch { setError("Đã tìm thấy phiên đang mở nhưng không tải được. Hãy kiểm tra lại kết nối rồi thử lại."); }
      } else setError(operationError(cause, "Không bắt đầu được phiên."));
    }
    finally { setBusy(false); }
  }
  async function resume() {
    if (!active) return;
    setBusy(true); setError("");
    try {
      const session = await speakingV2Service.resume(active);
      navigate(`/speaking/sessions/${encodeURIComponent(session.sessionId)}`, { state: { returnTo } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không tiếp tục được phiên."); }
    finally { setBusy(false); }
  }
  async function replace() {
    if (!active || !window.confirm("Kết thúc phiên đang mở và bắt đầu phiên mới?")) return;
    setBusy(true); setError("");
    try {
      await preflightMicrophone();
      const result = await speakingV2Service.replace(scope, active.sessionId, active.controllerEpoch);
      if ("sessionId" in result && result.status === "REPLACING") {
        setError("Phiên cũ đang kết thúc. Tải lại sau ít giây để bắt đầu phiên mới."); return;
      }
      navigate(`/speaking/sessions/${encodeURIComponent(result.sessionId)}`, { state: { returnTo } });
    } catch (cause) {
      setError(cause instanceof SpeakingV2ApiError && cause.activeSessionId
        ? "Bạn đang có một phiên khác. Tiếp tục phiên đó hoặc thử lại sau khi kết thúc." : operationError(cause, "Không thay phiên được."));
    } finally { setBusy(false); }
  }

  const scopeTitle = scope.type === "TOPIC" ? "Luyện nói theo chủ đề" : "Luyện nói theo mục học";
  return <main className="mx-auto grid min-h-[65vh] w-full max-w-3xl content-start gap-5 px-5 py-8 sm:py-12">
    <header className="grid gap-2"><p className="text-label-md font-semibold text-primary">SPEAKING</p>
      <h1 className="text-headline-lg font-bold text-on-surface">{scopeTitle}</h1>
      <p className="text-body-md leading-6 text-on-surface-variant">Luyện hội thoại bằng tiếng Anh. Gợi ý và sửa câu sẽ xuất hiện ngay trong từng lượt nói.</p>
    </header>
    {error && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-on-surface"><p>{error}</p>
      <Button variant="outline" className="mt-3 min-h-12" onClick={() => void load()}>Kiểm tra lại</Button></div>}
    {!availability && !error && <p role="status" className="text-on-surface-variant">Đang kiểm tra điều kiện luyện nói…</p>}
    {availability && !availability.available && <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="text-headline-md font-semibold">Chưa thể bắt đầu</h2><p className="mt-2 leading-6 text-on-surface-variant">{availabilityReason(availability.reason)}</p>
    </section>}
    {availability && active && <section className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="text-headline-md font-semibold">Bạn có một phiên đang mở</h2>
      <p className="leading-6 text-on-surface-variant">{availability.available ? "Tiếp tục phiên hiện tại để giữ nguyên nội dung đã luyện, hoặc xác nhận thay thế phiên đó." : "Không thể mở phiên mới tại thời điểm này, nhưng bạn vẫn có thể tiếp tục phiên đang mở."}</p>
      <div className="flex flex-wrap gap-3"><Button className="min-h-12" disabled={busy} onClick={() => void resume()}>Tiếp tục luyện</Button>
        {availability.available && <Button variant="outline" className="min-h-12" disabled={busy} onClick={() => void replace()}>Thay bằng phiên mới</Button>}</div>
    </section>}
    {availability?.available && !active && <Button className="min-h-12 w-fit" disabled={busy} onClick={() => void create()}>
      {busy ? "Đang chuẩn bị…" : "Bắt đầu luyện nói"}</Button>}
    <Link className="min-h-12 w-fit py-3 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary" to={historyLink}>Lịch sử phiên của {scope.type === "TOPIC_ITEM" ? "mục học này" : "chủ đề này"}</Link>
    <Link className="min-h-12 w-fit py-3 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary" to={returnTo}>Quay lại chủ đề</Link>
  </main>;
}
