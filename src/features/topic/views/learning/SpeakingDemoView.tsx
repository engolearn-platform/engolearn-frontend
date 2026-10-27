import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, LogOut } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components";
import { SpeakingApiError, speakingDemoService } from "@features/topic/services/speaking-demo.service";
import type {
  DemoSpeakingItem,
  SpeakingSession,
} from "@features/topic/types/speaking-demo.types";

const LAST_SESSION_KEY = "speaking-demo-last-session";

function isFinished(session: SpeakingSession) {
  return session.status === "COMPLETED" || session.status === "INCOMPLETE";
}

export default function SpeakingDemoView() {
  const [item, setItem] = useState<DemoSpeakingItem | null>(null);
  const [session, setSession] = useState<SpeakingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hasControl, setHasControl] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function load() {
      try {
        const [demoItem, current] = await Promise.all([
          speakingDemoService.demoItem(),
          speakingDemoService.current(),
        ]);
        if (!mountedRef.current) return;
        setItem(demoItem);
        if (current) {
          setSession(current);
          sessionStorage.setItem(LAST_SESSION_KEY, current.id);
        } else {
          const lastId = sessionStorage.getItem(LAST_SESSION_KEY);
          if (lastId) {
            const last = await speakingDemoService.get(lastId).catch(() => null);
            if (mountedRef.current) setSession(last);
          }
        }
      } catch (cause) {
        if (mountedRef.current) setError(message(cause));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }
    void load();
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function create() {
    if (!item) return;
    setBusy(true);
    setError("");
    try {
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach((track) => track.stop());
      const next = await speakingDemoService.create(item.itemId);
      setSession(next);
      setHasControl(true);
      sessionStorage.setItem(LAST_SESSION_KEY, next.id);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      setSession(await speakingDemoService.resume(session.id));
      setHasControl(true);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    if (!session || !session.canStartTurn || !hasControl) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!mountedRef.current) return;
        setRecording(false);
        const audio = new Blob(chunks, { type: recorder.mimeType });
        if (audio.size > 0) void submitTurn(session.id, session.controllerEpoch, audio);
        else setError("Chưa có âm thanh. Hãy thử nói lại.");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      timeoutRef.current = setTimeout(() => recorder.state === "recording" && recorder.stop(), 120_000);
    } catch (cause) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setError(message(cause));
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function submitTurn(id: string, epoch: number, audio: Blob) {
    setBusy(true);
    try {
      const result = await speakingDemoService.turn(id, epoch, audio);
      setSession(result.session);
    } catch (cause) {
      setError(message(cause));
      if (cause instanceof SpeakingApiError && cause.code === "CONTROL_REVOKED") setHasControl(false);
      const latest = await speakingDemoService.get(id).catch(() => null);
      if (latest) setSession(latest);
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      setSession(await speakingDemoService.end(session.id, session.controllerEpoch));
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  const achieved = new Set(session?.achievedGoalIds ?? []);
  const finished = session ? isFinished(session) : false;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8 text-on-surface">
      <header className="mb-6 space-y-2">
        <p className="text-sm font-semibold text-primary">Speaking with AI · Dev route</p>
        <h1 className="text-3xl font-bold">Luyện nói: {item?.title ?? "Đang tải item"}</h1>
        <p className="text-base text-muted-foreground">
          Item và người học được giả lập để kiểm tra phiên nói. Kết quả lượt và phiên do backend quyết định.
        </p>
      </header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-destructive p-4 text-destructive">{error}</div>}
      {loading && <p>Đang tải dữ liệu Speaking…</p>}

      {!loading && item && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="space-y-5">
            <Card className="rounded-2xl border-border bg-card p-5">
              <h2 className="mb-3 text-xl font-semibold">Mục tiêu tình huống</h2>
              <ul className="space-y-3">
                {item.goals.map((goal) => (
                  <li key={goal.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{goal.title}</strong>
                      <span className="text-sm text-primary">{achieved.has(goal.id) ? "Đã đạt" : "Chưa đạt"}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm">
                Cần {item.requiredGoalCount}/{item.goals.length} mục tiêu và {item.minimumValidTurns} lượt hợp lệ.
              </p>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-5">
              <h2 className="mb-3 text-xl font-semibold">Phiên luyện nói</h2>
              {!session && <Button disabled={busy} onClick={() => void create()}>Bắt đầu phiên</Button>}
              {session && (
                <div className="space-y-3">
                  <p>Trạng thái: <strong>{session.status}</strong></p>
                  <p>Tiến độ: {session.achievedGoalIds.length}/{session.requiredGoalCount} mục tiêu · {session.validTurnCount}/{session.minimumValidTurns} lượt hợp lệ</p>
                  {finished ? (
                    <>
                      <p>Kết quả: <strong>{session.status === "COMPLETED" ? "Hoàn thành" : "Chưa hoàn thành"}</strong></p>
                      <p className="text-sm text-muted-foreground">Lý do kết thúc: {session.endReason}</p>
                      <Button disabled={busy} onClick={() => void create()}>Luyện thêm với phiên mới</Button>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {!hasControl || session.status === "INTERRUPTED" ? (
                        <Button disabled={busy} onClick={() => void resume()}><RotateCcw /> Tiếp tục</Button>
                      ) : recording ? (
                        <Button onClick={stopRecording}><Square /> Dừng lượt nói</Button>
                      ) : (
                        <Button disabled={busy || !session.canStartTurn} onClick={() => void startRecording()}><Mic /> Bắt đầu nói</Button>
                      )}
                      <Button variant="outline" disabled={busy || recording || !hasControl} onClick={() => void end()}><LogOut /> Kết thúc phiên</Button>
                    </div>
                  )}
                  {recording && <p role="status" className="text-sm text-primary">Đang ghi âm, tối đa 120 giây…</p>}
                  {busy && <p role="status" className="text-sm text-muted-foreground">Đang xử lý…</p>}
                </div>
              )}
            </Card>
          </div>

          <Card className="rounded-2xl border-border bg-card p-5">
            <h2 className="mb-4 text-xl font-semibold">Các lượt nói</h2>
            {!session?.turns.length && <p className="text-muted-foreground">Chưa có lượt nói nào.</p>}
            <ol className="space-y-4">
              {session?.turns.map((turn) => (
                <li key={turn.id} className="rounded-xl border border-border p-4">
                  <p className="mb-2 text-sm font-semibold text-primary">Lượt {turn.number} · {turn.valid ? "Hợp lệ" : "Chưa hợp lệ"}</p>
                  <p><strong>Bạn:</strong> {turn.transcript}</p>
                  {turn.aiReply && <p className="mt-2"><strong>AI:</strong> {turn.aiReply}</p>}
                  {turn.goalEvidence.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-primary">
                      {turn.goalEvidence.map((evidence) => <li key={`${turn.id}-${evidence.goalId}`}>
                        Mục tiêu {evidence.goalId}: “{evidence.quote}”
                      </li>)}
                    </ul>
                  )}
                  {turn.feedback.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {turn.feedback.map((entry, index) => <li key={`${turn.id}-${index}`}>• {entry.message}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </main>
  );
}

function message(cause: unknown) {
  return cause instanceof Error ? cause.message : "Có lỗi xảy ra. Vui lòng thử lại.";
}
