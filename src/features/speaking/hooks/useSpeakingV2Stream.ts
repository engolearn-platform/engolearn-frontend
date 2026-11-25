import { useCallback, useEffect, useRef, useState } from "react";
import { speakingV2Service, SpeakingV2ApiError } from "@features/speaking/services/speaking-v2.service";
import { createSpeakingAudioFrame, readSpeakingAudioFrame } from "@features/speaking/utils/speaking-audio-frame";
import type { SpeakingSession, SpeakingSocketMessage, SpeakingTurn } from "@features/speaking/types/speaking-v2.types";

const PCM_BYTES_PER_MS = 32;

export type SpeakingConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";
export type SpeakingRecordingState = "idle" | "requesting" | "recording" | "sealing" | "processing";

export function speakingErrorMessage(code: unknown, fallback?: unknown) {
  switch (code) {
    case "ACTIVE_SESSION_EXISTS": return "Bạn đã có phiên luyện đang mở. Tiếp tục phiên hiện tại hoặc kết thúc phiên đó trước.";
    case "REQUEST_CONFLICT": return "Phiên đã thay đổi ở nơi khác. Hãy đồng bộ để tải trạng thái mới nhất.";
    case "STALE_TURN": return "Lượt nói đã thay đổi. Hãy đồng bộ phiên trước khi tiếp tục.";
    case "EMPTY_AUDIO": return "Không nhận được giọng nói. Hãy kiểm tra micro, nói gần thiết bị hơn rồi thử lại.";
    case "STT_UNAVAILABLE": return "Chưa thể nhận diện lời nói. Kiểm tra kết nối và thử ghi âm lại.";
    case "CONVERSATION_UNAVAILABLE": return "Chưa tạo được phản hồi. Bản chép lời đã lưu; bạn có thể thử tạo lại phản hồi.";
    case "TTS_UNAVAILABLE": return "Không tạo được audio. Phản hồi văn bản vẫn có thể đọc.";
    case "DAILY_QUOTA_REACHED": return "Bạn đã dùng hết lượt luyện nói hôm nay. Hãy quay lại sau.";
    case "CONTROLLER_CHANGED": return "Phiên đang được điều khiển ở nơi khác. Quay lại danh sách phiên để tiếp tục.";
    case "SESSION_CLOSING": case "SESSION_ENDED": return "Phiên đã kết thúc. Mở kết quả để xem phần luyện tập đã lưu.";
    case "TURN_IN_PROGRESS": return "Lượt nói trước vẫn đang xử lý. Chờ phản hồi rồi thử lại.";
    case "AUDIO_LIMIT": return "Bản ghi đã đạt giới hạn thời lượng. Lượt nói được gửi để xử lý.";
    case "INVALID_TICKET": return "Kết nối phiên hết hạn. Hãy đồng bộ để nối lại phiên.";
    default: return typeof fallback === "string" && fallback.trim() && !/^[A-Z][A-Z0-9_]+$/.test(fallback.trim())
      ? fallback : "Speaking gặp sự cố. Hãy đồng bộ phiên rồi thử lại.";
  }
}

function sessionCanAdvance(current: SpeakingSession | null, next: SpeakingSession, orderedSocketState = false) {
  if (!current || current.sessionId !== next.sessionId) return true;
  const states = { INITIALIZING: 0, ACTIVE: 1, CLOSING: 2, ENDED: 3 };
  if (states[next.status] < states[current.status] || next.controllerEpoch < current.controllerEpoch) return false;
  if (next.finalizedTurnCount < current.finalizedTurnCount || next.committedTurnCount < current.committedTurnCount) return false;
  const oldTurn = current.activeTurn; const newTurn = next.activeTurn;
  if (states[next.status] === states[current.status] && oldTurn && !newTurn) {
    const finalized = next.finalizedTurnCount > current.finalizedTurnCount;
    const committed = next.committedTurnCount > current.committedTurnCount;
    const receivingCancelled = orderedSocketState && oldTurn.status.toUpperCase() === "RECEIVING";
    if (!finalized && !committed && !receivingCancelled) return false;
  }
  if (oldTurn && newTurn && newTurn.sequence < oldTurn.sequence) return false;
  return true;
}

export function useSpeakingV2Stream(session: SpeakingSession | null, onSession: (value: SpeakingSession) => void, onError: (message: string) => void,
  onTurns?: (value: SpeakingTurn[]) => void) {
  const [connection, setConnection] = useState<SpeakingConnectionState>("disconnected");
  const [recording, setRecording] = useState<SpeakingRecordingState>("idle");
  const [interim, setInterim] = useState("");
  const [playing, setPlaying] = useState(false);
  const [recoverableTurn, setRecoverableTurn] = useState<SpeakingSession["activeTurn"]>(null);
  const [retryableTurnId, setRetryableTurnId] = useState<string | null>(null);
  const recordingRef = useRef(recording); recordingRef.current = recording;
  const socketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef(session); const sessionFn = useRef(onSession); const errorFn = useRef(onError);
  const streamRef = useRef<MediaStream | null>(null); const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null); const workletRef = useRef<AudioWorkletNode | null>(null);
  const turnRef = useRef<string | null>(null); const pendingClientId = useRef<string | null>(null);
  const pendingStartRequestId = useRef<string | null>(null);
  const chunkIndex = useRef(0); const voiceSeen = useRef(false); const quietSince = useRef<number | null>(null);
  const finishRef = useRef<() => void>(() => {}); const audioParts = useRef<Uint8Array[]>([]);
  const endAfterAck = useRef(false);
  const syncRequestRef = useRef(0);
  const serverTurnRef = useRef<SpeakingSession["activeTurn"]>(null);
  const pendingRetryTurnRef = useRef<string | null>(null);
  const pendingRetryRequestIdRef = useRef<string | null>(null);
  const retryableFailureRef = useRef<{ turnId: string; retryable: boolean } | null>(null);
  const audioIndex = useRef(0); const audioTurn = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); const audioUrl = useRef<string | null>(null);
  if (session && sessionCanAdvance(sessionRef.current, session)) sessionRef.current = session;
  else if (!session) sessionRef.current = null;
  sessionFn.current = onSession; errorFn.current = onError;
  const applySession = useCallback((next: SpeakingSession, orderedSocketState = false) => {
    if (!sessionCanAdvance(sessionRef.current, next, orderedSocketState)) return false;
    sessionRef.current = next; sessionFn.current(next); return true;
  }, []);

  const stopCapture = useCallback(() => {
    workletRef.current?.disconnect(); workletRef.current = null; sourceRef.current?.disconnect(); sourceRef.current = null;
    streamRef.current?.getTracks().forEach(track => { track.onended = null; track.stop(); }); streamRef.current = null;
    const context = contextRef.current; contextRef.current = null; if (context && context.state !== "closed") void context.close();
  }, []);
  const stopPlayback = useCallback(() => {
    audioRef.current?.pause(); audioRef.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = null; setPlaying(false);
  }, []);
  const send = useCallback((type: string, payload: object, turnId?: string, requestId = crypto.randomUUID()) => {
    const current = sessionRef.current; const socket = socketRef.current;
    if (!current || socket?.readyState !== WebSocket.OPEN) return false;
    const message: SpeakingSocketMessage = { type, sessionId: current.sessionId, requestId, payload: payload as Record<string, unknown>, ...(turnId ? { turnId } : {}) };
    socket.send(JSON.stringify(message)); return true;
  }, []);
  const finishTurn = useCallback(() => {
    const turnId = turnRef.current; if (!turnId) return;
    turnRef.current = null; stopCapture();
    if (send("END_TURN", {}, turnId)) setRecording("sealing"); else { setRecording("idle"); errorFn.current("Kết nối bị gián đoạn. Hãy đồng bộ phiên để xem nội dung đã lưu."); }
  }, [send, stopCapture]);
  finishRef.current = finishTurn;
  const cancelTurn = useCallback(() => {
    const turnId = turnRef.current;
    if (!turnId) {
      if (recordingRef.current === "requesting") {
        pendingClientId.current = null; pendingStartRequestId.current = null; setRecording("idle");
      }
      return;
    }
    pendingClientId.current = null; pendingStartRequestId.current = null;
    turnRef.current = null; stopCapture(); setRecording("sealing"); send("CANCEL_TURN", {}, turnId);
  }, [send, stopCapture]);
  const endSession = useCallback(async (recordingChoice?: "FINALIZE" | "DISCARD") => {
    const current = sessionRef.current; if (!current) return;
    if (recordingChoice && turnRef.current) { endAfterAck.current = true;
      if (recordingChoice === "FINALIZE") finishRef.current(); else cancelTurn(); return; }
    try { applySession(await speakingV2Service.end(current)); }
    catch (cause) { errorFn.current(cause instanceof Error ? cause.message : "Không kết thúc được phiên."); }
  }, [applySession, cancelTurn]);
  const startTurn = useCallback(() => {
    if (!sessionRef.current || connection !== "connected" || recording !== "idle" || playing) return;
    const clientTurnId = crypto.randomUUID(); const requestId = crypto.randomUUID();
    pendingClientId.current = clientTurnId; pendingStartRequestId.current = requestId;
    if (send("START_TURN", { clientTurnId }, undefined, requestId)) setRecording("requesting");
    else { pendingClientId.current = null; pendingStartRequestId.current = null; }
  }, [connection, playing, recording, send]);

  const captureAcceptedTurn = useCallback(async (turnId: string) => {
    const current = sessionRef.current;
    if (!current) return;
    let remainingBytes = current.limits.maxTurnAudioMs * PCM_BYTES_PER_MS;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      if (turnRef.current !== turnId) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream; const context = new AudioContext(); await context.audioWorklet.addModule("/speaking-pcm-worklet.js");
      if (turnRef.current !== turnId) { stream.getTracks().forEach(track => track.stop()); await context.close(); return; }
      const source = context.createMediaStreamSource(stream); const worklet = new AudioWorkletNode(context, "speaking-pcm");
      const sink = context.createGain(); sink.gain.value = 0; source.connect(worklet).connect(sink).connect(context.destination);
      contextRef.current = context; sourceRef.current = source; workletRef.current = worklet;
      chunkIndex.current = 0; voiceSeen.current = false; quietSince.current = null;
      stream.getTracks().forEach(track => track.onended = () => {
        if (turnRef.current !== turnId) return; turnRef.current = null; stopCapture(); setRecording("idle"); send("CANCEL_TURN", {}, turnId);
        errorFn.current("Microphone đã ngắt. Kiểm tra thiết bị rồi thử lại.");
      });
      worklet.port.onmessage = event => {
        const socket = socketRef.current;
        if (turnRef.current !== turnId || socket?.readyState !== WebSocket.OPEN) return;
        const { pcm, rms } = event.data as { pcm: ArrayBuffer; rms: number };
        if (rms > 0.018) { voiceSeen.current = true; quietSince.current = null; }
        else if (voiceSeen.current) { quietSince.current ??= performance.now(); if (performance.now() - quietSince.current > 2600) { finishRef.current(); return; } }
        const chunk = pcm.byteLength > remainingBytes ? pcm.slice(0, remainingBytes) : pcm;
        socket.send(createSpeakingAudioFrame(turnId, chunkIndex.current++, chunk));
        remainingBytes -= chunk.byteLength;
        if (remainingBytes === 0) finishRef.current();
      };
      setRecording("recording");
    } catch (cause) {
      turnRef.current = null; stopCapture(); setRecording("idle"); send("CANCEL_TURN", {}, turnId);
      errorFn.current(cause instanceof Error && cause.name === "NotAllowedError"
        ? "Microphone chưa được cấp quyền. Cho phép truy cập micro trong trình duyệt rồi thử lại."
        : "Không mở được micro. Kiểm tra thiết bị và quyền truy cập rồi thử lại.");
    }
  }, [send, stopCapture]);

  const reconcileActiveTurn = useCallback((activeTurn: SpeakingSession["activeTurn"]) => {
    serverTurnRef.current = activeTurn;
    if (!activeTurn) { setRecoverableTurn(null); if (recordingRef.current === "processing") setRecording("idle"); return; }
    if (activeTurn.status.toUpperCase() === "RECEIVING") { setRecoverableTurn(activeTurn); setRecording("idle"); }
    else { setRecoverableTurn(null); setRecording("processing"); }
  }, []);
  const syncNow = useCallback(async () => {
    const current = sessionRef.current; if (!current) return;
    const request = ++syncRequestRef.current;
    try {
      const [latest, turns] = await Promise.all([speakingV2Service.get(current.sessionId), speakingV2Service.allTurns(current.sessionId)]);
      if (request !== syncRequestRef.current || sessionRef.current?.sessionId !== current.sessionId) return;
      if (applySession(latest)) reconcileActiveTurn(latest.activeTurn);
      onTurns?.(turns);
    } catch (cause) { errorFn.current(cause instanceof Error ? cause.message : "Không đồng bộ được phiên."); }
  }, [applySession, onTurns, reconcileActiveTurn]);

  const activeSessionId = session?.sessionId;
  const activeControllerEpoch = session?.controllerEpoch;
  const activeWsPath = session?.wsPath;
  useEffect(() => {
    if (!activeSessionId || !activeWsPath || sessionRef.current?.status === "ENDED") { setConnection("disconnected"); return; }
    let stopped = false; let retries = 0; let timer: ReturnType<typeof setTimeout> | undefined;
    const sessionId = activeSessionId; const controllerEpoch = activeControllerEpoch!;
    const sync = async () => {
      const request = ++syncRequestRef.current;
      try {
        const [latest, turns] = await Promise.all([speakingV2Service.get(sessionId), speakingV2Service.allTurns(sessionId)]);
        if (stopped || request !== syncRequestRef.current || sessionRef.current?.sessionId !== sessionId) return [];
        if (applySession(latest)) reconcileActiveTurn(latest.activeTurn);
        if (onTurns) onTurns(turns);
        const failed = retryableFailureRef.current;
        if (failed && failed.retryable && !latest.activeTurn && latest.status === "ACTIVE" && turns.some(turn => turn.turnId === failed.turnId && Boolean(turn.transcript?.trim()))) {
          setRetryableTurnId(failed.turnId);
        }
        if (pendingRetryTurnRef.current && !latest.activeTurn) {
          const persisted = turns.find(turn => turn.turnId === pendingRetryTurnRef.current);
          if (persisted?.status === "FAILED" && failed?.turnId === persisted.turnId && failed.retryable) {
            setRetryableTurnId(persisted.turnId); pendingRetryTurnRef.current = null; setRecording("idle");
          }
        }
        return turns;
      } catch { return []; /* the visible Sync action can retry */ }
    };
    const connect = async () => {
      if (stopped) return; setConnection(retries ? "reconnecting" : "connecting");
      try {
        const { ticket } = await speakingV2Service.ticket({ sessionId, controllerEpoch }); if (stopped) return;
        const url = new URL(activeWsPath, window.location.href); url.protocol = url.protocol === "https:" ? "wss:" : "ws:"; url.searchParams.set("ticket", ticket);
        const socket = new WebSocket(url); socket.binaryType = "arraybuffer"; socketRef.current = socket;
        socket.onopen = () => { if (stopped || socketRef.current !== socket) return; retries = 0; setConnection("connected"); void sync();
          socket.send(JSON.stringify({ type: "SYNC_SESSION", sessionId, requestId: crypto.randomUUID(), payload: {} })); };
        socket.onmessage = event => {
          if (stopped || socketRef.current !== socket) return;
          if (event.data instanceof ArrayBuffer) {
            const id = audioTurn.current ?? "00000000-0000-0000-0000-000000000000";
            try { audioParts.current.push(readSpeakingAudioFrame(event.data, id, audioIndex.current++)); } catch { audioParts.current = []; }
            return;
          }
          let message: SpeakingSocketMessage;
          try { message = JSON.parse(String(event.data)) as SpeakingSocketMessage; } catch { errorFn.current("Không đọc được phản hồi. Hãy đồng bộ lại phiên."); return; }
          if (message.sessionId !== sessionId) return;
          const payload = message.payload as Record<string, unknown>;
          if (message.type === "SESSION_STATE" && payload.sessionId === sessionId) {
            const next = payload as unknown as SpeakingSession; if (applySession(next, true)) reconcileActiveTurn(next.activeTurn);
          }
          if (message.type === "OPENING_RESULT") { const current = sessionRef.current; if (current) applySession({ ...current, opening: payload as unknown as SpeakingSession["opening"] }); }
          if (message.type === "TURN_ACCEPTED" && typeof message.turnId === "string"
            && message.requestId === pendingStartRequestId.current && payload.clientTurnId === pendingClientId.current) {
            pendingClientId.current = null; pendingStartRequestId.current = null;
            turnRef.current = message.turnId; serverTurnRef.current = { turnId: message.turnId, sequence: message.sequence ?? 0, clientTurnId: String(payload.clientTurnId), status: "RECEIVING" };
            setRecoverableTurn(null); void captureAcceptedTurn(message.turnId);
          }
          if (message.type === "TRANSCRIPT_PARTIAL" || message.type === "TRANSCRIPT_FINAL") setInterim(String(payload.transcript ?? ""));
          if (message.type === "TURN_PROCESSING") { if (pendingRetryTurnRef.current === message.turnId && (!message.requestId || message.requestId === pendingRetryRequestIdRef.current)) {
              pendingRetryTurnRef.current = null; pendingRetryRequestIdRef.current = null; retryableFailureRef.current = null; setRetryableTurnId(null);
            }
            const activeTurn = serverTurnRef.current;
            if (activeTurn && activeTurn.turnId === message.turnId) serverTurnRef.current = { ...activeTurn, status: "GENERATING" };
            setRecording("processing"); if (endAfterAck.current) { endAfterAck.current = false;
            void speakingV2Service.end({ sessionId, controllerEpoch }).then(applySession).catch(cause => errorFn.current(cause instanceof Error ? cause.message : "Không kết thúc được phiên.")); } }
          if (message.type === "TURN_RESULT") { if (serverTurnRef.current?.turnId === message.turnId) serverTurnRef.current = null;
            if (pendingRetryTurnRef.current === message.turnId) { pendingRetryTurnRef.current = null; pendingRetryRequestIdRef.current = null; }
            setRecording("idle"); setInterim(""); void sync(); }
          if (message.type === "TURN_SKIPPED" || message.type === "TURN_FAILED") {
            if (pendingRetryTurnRef.current === message.turnId) { pendingRetryTurnRef.current = null; pendingRetryRequestIdRef.current = null; }
            if (serverTurnRef.current?.turnId === message.turnId) serverTurnRef.current = null;
            setRecoverableTurn(null); setRecording("idle"); setInterim("");
            void sync().then(turns => {
              const turn = turns.find(item => item.turnId === message.turnId);
              const retryable = message.type === "TURN_FAILED" && payload.retryable === true && Boolean(turn?.transcript?.trim()) && sessionRef.current?.status === "ACTIVE";
              retryableFailureRef.current = typeof message.turnId === "string" ? { turnId: message.turnId, retryable } : null;
              setRetryableTurnId(retryable ? message.turnId! : null);
              const code = String(payload.code ?? "");
              errorFn.current(speakingErrorMessage(code, code === "STT_UNAVAILABLE" || code === "EMPTY_AUDIO"
                ? "Không nhận được bản chép lời. Kiểm tra micro, nói gần thiết bị hơn rồi thử lại." : payload.message));
            });
            if (message.type === "TURN_SKIPPED" && endAfterAck.current) { endAfterAck.current = false;
              void speakingV2Service.end({ sessionId, controllerEpoch }).then(applySession).catch(cause => errorFn.current(cause instanceof Error ? cause.message : "Không kết thúc được phiên.")); }
          }
          if (message.type === "TTS_STARTED") { audioTurn.current = message.turnId ?? null; audioParts.current = []; audioIndex.current = 0; }
          if (message.type === "TTS_COMPLETED") {
            const blob = new Blob(audioParts.current.map(part => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength)), { type: "audio/wav" });
            if (blob.size && (!Number.isFinite(payload.byteLength) || blob.size === Number(payload.byteLength))) {
              stopPlayback(); const objectUrl = URL.createObjectURL(blob); audioUrl.current = objectUrl;
              const audio = new Audio(objectUrl); audioRef.current = audio; audio.onended = stopPlayback;
              audio.onerror = () => { stopPlayback(); errorFn.current("Audio chưa phát được; nội dung văn bản vẫn có thể xem."); };
              void audio.play().then(() => setPlaying(true)).catch(() => errorFn.current("Trình duyệt chặn phát audio. Bạn vẫn có thể đọc phản hồi."));
            } else errorFn.current("Audio bị thiếu dữ liệu; hãy dùng nội dung văn bản.");
            audioTurn.current = null; audioParts.current = [];
          }
          if (message.type === "TTS_FAILED") { audioTurn.current = null; audioParts.current = []; errorFn.current("Không tạo được audio. Phản hồi văn bản vẫn khả dụng."); }
          if (message.type === "SESSION_ENDED") { applySession(payload as unknown as SpeakingSession); setRecording("idle"); }
          if (message.type === "ERROR") {
            if (pendingStartRequestId.current && message.requestId === pendingStartRequestId.current) {
              pendingClientId.current = null; pendingStartRequestId.current = null;
              if (recordingRef.current === "requesting") setRecording("idle");
            }
            if ((pendingRetryTurnRef.current === message.turnId || pendingRetryRequestIdRef.current === message.requestId)
              && (!message.turnId || message.turnId === pendingRetryTurnRef.current)) {
              pendingRetryTurnRef.current = null; pendingRetryRequestIdRef.current = null; setRecording("idle");
              if (payload.retryable !== true) { retryableFailureRef.current = null; setRetryableTurnId(null); }
            }
            const code = String(payload.code ?? ""); errorFn.current(speakingErrorMessage(code, payload.message));
          }
        };
        socket.onclose = () => {
          if (stopped || socketRef.current !== socket) return; socketRef.current = null; turnRef.current = null; pendingClientId.current = null; pendingStartRequestId.current = null;
          stopCapture(); if (recordingRef.current !== "processing") setRecording("idle"); setInterim("");
          if (retries < 5 && ["ACTIVE", "INITIALIZING", "CLOSING"].includes(sessionRef.current?.status ?? "")) { retries++; setConnection("reconnecting");
            errorFn.current(`Mất kết nối. Đang nối lại (${retries}/5).`); timer = setTimeout(() => void connect(), Math.min(1000 * 2 ** retries, 12000)); }
          else { setConnection("disconnected"); errorFn.current("Không nối lại được. Nhấn đồng bộ để tải nội dung đã lưu."); }
        };
        socket.onerror = () => socket.close();
      } catch (cause) {
        if (stopped) return;
        if (cause instanceof SpeakingV2ApiError && cause.code === "CONTROLLER_CHANGED") { setConnection("disconnected"); errorFn.current(speakingErrorMessage(cause.code)); return; }
        retries++; setConnection("reconnecting"); if (retries <= 5) timer = setTimeout(() => void connect(), Math.min(1000 * 2 ** retries, 12000));
        else { setConnection("disconnected"); errorFn.current("Không kết nối được. Kiểm tra mạng rồi thử đồng bộ."); }
      }
    };
    void connect();
    return () => { stopped = true; if (timer) clearTimeout(timer); pendingClientId.current = null; pendingStartRequestId.current = null; socketRef.current?.close(); socketRef.current = null; stopCapture(); stopPlayback(); };
  }, [activeSessionId, activeControllerEpoch, activeWsPath, captureAcceptedTurn, stopCapture, stopPlayback, onTurns, applySession, reconcileActiveTurn]);

  const retryFailedTurn = useCallback((turnId: string) => {
    const current = sessionRef.current;
    if (!current || current.status !== "ACTIVE" || connection !== "connected" || retryableTurnId !== turnId || pendingRetryTurnRef.current) return;
    const requestId = crypto.randomUUID();
    if (send("RETRY_TURN", {}, turnId, requestId)) { pendingRetryTurnRef.current = turnId; pendingRetryRequestIdRef.current = requestId; setRecording("processing"); }
  }, [connection, retryableTurnId, send]);
  const discardRecoveredTurn = useCallback(() => {
    const turn = recoverableTurn; const current = sessionRef.current;
    if (!turn || turn.status.toUpperCase() !== "RECEIVING" || current?.status !== "ACTIVE" || connection !== "connected") return;
    send("CANCEL_TURN", {}, turn.turnId);
  }, [connection, recoverableTurn, send]);
  return { connection, recording, interim, playing, recoverableTurn, retryableTurnId, retryFailedTurn, discardRecoveredTurn, startTurn, finishTurn, cancelTurn, endSession, stopPlayback,
    sync: syncNow };
}
