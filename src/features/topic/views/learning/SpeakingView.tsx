import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Mic, Square, Trash2, Volume2 } from "lucide-react";
import { ROUTES } from "@shared/constants";
import { speakingService } from "@features/topic/services/speaking.service";
import { useSpeakingStream } from "@features/topic/hooks/useSpeakingStream";
import type { SpeakingItemConfig, SpeakingSession } from "@features/topic/types/speaking.types";

export default function SpeakingView() {
  const { topicId: itemId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SpeakingSession | null>(null);
  const [config, setConfig] = useState<SpeakingItemConfig | null>(null);
  const [history, setHistory] = useState<SpeakingSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(!itemId);
  const { connection, recording, interim, startRecording, finishRecording } =
    useSpeakingStream(session, setSession, setError);

  const refresh = useCallback(async () => {
    try {
      const [current, entries] = await Promise.all([
        speakingService.current(), speakingService.history(itemId),
      ]);
      setSession(current);
      setHistory(entries);
      if (itemId) setConfig(await speakingService.config(itemId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được Speaking.");
    }
  }, [itemId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function run(action: () => Promise<SpeakingSession | number>, clearSession = false) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (clearSession || typeof result === "number") setSession(null);
      else setSession(result);
      setHistory(await speakingService.history(itemId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Thao tác không thành công.");
    } finally { setBusy(false); }
  }

  async function create(replace: boolean) {
    if (!itemId) return;
    await run(async () => {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach(track => track.stop());
      return replace ? speakingService.replace(itemId) : speakingService.create(itemId);
    });
  }

  async function play(sessionId: string, turnId: string,
                      kind: "LEARNER_RECORDING" | "AI_REPLY") {
    try {
      const { url } = await speakingService.audio(sessionId, turnId, kind);
      await new Audio(url).play();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không phát được audio.");
    }
  }

  const open = session?.status === "ACTIVE" || session?.status === "INTERRUPTED";
  const currentIsThisItem = session?.content.topicItemId === itemId;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-6 text-on-surface">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Luyện nói với AI</h1>
          <p className="text-sm text-on-surface-variant">Luyện thêm ngoài tiến độ bài học.</p>
        </div>
        {itemId && <button className="rounded-lg border px-4 py-2" onClick={() =>
          navigate(ROUTES.TOPIC_CONTEXT.replace(":topicId", itemId))}>Nội dung item</button>}
      </div>

      <div className="flex gap-2 border-b pb-2">
        <button className={!showHistory ? "font-semibold text-primary" : ""}
          onClick={() => setShowHistory(false)}>Phiên luyện</button>
        <button className={showHistory ? "font-semibold text-primary" : ""}
          onClick={() => { setShowHistory(true);
            void speakingService.history(itemId).then(setHistory).catch(() => {}); }}>Lịch sử</button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      {!showHistory ? <>
        {config && <section className="rounded-xl border p-5">
          <h2 className="font-semibold">{config.title}</h2>
          <p className="mt-1 text-sm">Cần đạt {config.requiredGoalCount}/{config.goals.length} mục tiêu
            và ít nhất {config.minimumValidTurns} lượt nói hợp lệ.</p>
          <ul className="mt-3 list-inside list-disc text-sm">
            {config.goals.map(goal => <li key={goal.id}>{goal.title}</li>)}
          </ul>
        </section>}

        {open && session && !currentIsThisItem && itemId && <div className="rounded-xl border p-5">
          <p>Bạn đang có phiên ở item “{session.content.title}”. Kết thúc hoặc thay thế phiên để luyện item này.</p>
          <div className="mt-3 flex gap-2">
            <button disabled={busy} className="rounded-lg border px-4 py-2"
              onClick={() => void run(() => speakingService.end(session))}>Kết thúc phiên cũ</button>
            <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-white"
              onClick={() => void create(true)}>Thay thế và bắt đầu</button>
          </div>
        </div>}

        {!open && itemId && <button disabled={busy || !config}
          className="rounded-lg bg-primary px-5 py-3 text-white disabled:opacity-50"
          onClick={() => void create(false)}>Bắt đầu phiên mới</button>}

        {session && (currentIsThisItem || !itemId) && <section className="space-y-4 rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">{session.content.title}</h2>
              <p className="text-sm text-on-surface-variant">{session.status} · {session.validTurnCount} lượt hợp lệ ·
                {session.achievedGoalIds.length}/{Math.ceil(session.content.goals.length *
                  session.content.goalPercentage / 100)} mục tiêu</p>
            </div>
            {open && <button disabled={busy} className="rounded-lg border px-3 py-2"
              onClick={() => void run(() => speakingService.end(session))}>Kết thúc phiên</button>}
          </div>

          <p className="rounded-lg bg-surface-container-low p-3">AI: {session.openingReply}</p>
          {session.turns.map(turn => <div key={turn.id} className="space-y-2 border-t pt-3">
            <p><strong>Bạn:</strong> {turn.transcript}</p>
            <p><strong>AI:</strong> {turn.aiReply || (turn.evaluationState === "PENDING"
              ? "Đang xử lý…" : turn.evaluationState === "FAILED"
                ? "Đánh giá không khả dụng. Hãy thử lượt nói mới."
                : "Không có phản hồi AI.")}</p>
            {turn.assessment && <div className="text-sm text-on-surface-variant">
              {turn.assessment.feedback?.slice(0, 3).map((line, index) => <p key={index}>{line}</p>)}
              {turn.assessment.hint && <p>Gợi ý: {turn.assessment.hint}</p>}
            </div>}
            <div className="flex gap-2 text-sm">
              {turn.recordingAvailable && <button onClick={() => void play(session.id, turn.id, "LEARNER_RECORDING")}
                className="inline-flex items-center gap-1"><Volume2 size={16} /> Nghe câu của tôi</button>}
              {turn.aiAudioAvailable && <button onClick={() => void play(session.id, turn.id, "AI_REPLY")}
                className="inline-flex items-center gap-1"><Volume2 size={16} /> Nghe AI</button>}
            </div>
          </div>)}

          {interim && <p aria-live="polite" className="italic">Đang nghe: {interim}</p>}
          {open && <div className="flex flex-wrap items-center gap-3">
            {connection !== "connected" && <p className="text-sm">Kết nối: {connection}</p>}
            {connection === "connected" && recording === "idle" && <button
              disabled={!session.canStartTurn || session.status !== "ACTIVE"}
              onClick={() => void startRecording()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">
              <Mic size={18} /> Nói</button>}
            {recording === "recording" && <button onClick={() => void finishRecording()}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2"><Square size={18} /> Chốt câu</button>}
            {recording === "processing" && <span>Đang đánh giá…</span>}
            {session.status === "INTERRUPTED" && <button disabled={busy} className="rounded-lg border px-4 py-2"
              onClick={() => void run(() => speakingService.resume(session))}>Tiếp tục phiên</button>}
          </div>}
        </section>}
      </> : <section className="space-y-3">
        <div className="flex justify-end gap-2">
          {itemId && <button className="rounded-lg border px-3 py-2" onClick={() =>
            navigate(ROUTES.SPEAKING_HISTORY)}>Xem mọi item</button>}
          {history.length > 0 && <button disabled={busy} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2"
            onClick={() => { if (window.confirm("Xóa toàn bộ dữ liệu Speaking của bạn?"))
              void run(() => speakingService.removeAll(), true); }}><Trash2 size={16} /> Xóa toàn bộ</button>}
        </div>
        {history.length === 0 && <p>Chưa có phiên luyện nói.</p>}
        {history.map(entry => <div key={entry.id} className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <button className="text-left font-semibold" onClick={() => { setSession(entry); setShowHistory(false); }}>
              {entry.content.title}</button>
            <button aria-label="Xóa phiên" disabled={busy} onClick={() => {
              if (window.confirm("Xóa phiên luyện nói này?"))
                void run(() => speakingService.remove(entry.id), session?.id === entry.id);
            }}><Trash2 size={18} /></button>
          </div>
          <p className="text-sm text-on-surface-variant">{new Date(entry.startedAt).toLocaleString("vi-VN")}
            · {entry.status} · {entry.validTurnCount} lượt hợp lệ</p>
        </div>)}
      </section>}
    </div>
  );
}
