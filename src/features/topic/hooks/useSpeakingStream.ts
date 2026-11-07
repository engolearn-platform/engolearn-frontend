import { useCallback, useEffect, useRef, useState } from "react";
import { speakingService, SpeakingApiError, SPEAKING_CONTRACT_VERSION } from "@features/topic/services/speaking.service";
import { parseSpeakingDemoDecision } from "@features/topic/hooks/speakingDemoDecision";
import type { SpeakingDemoDecision, SpeakingSession } from "@features/topic/types/speaking.types";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";
export type RecordingState = "idle" | "recording" | "processing";
export type SpeakingSnapshotSource = "HYDRATE" | "TURN_RESULT" | "SESSION_ENDED" | "OPENING_UPDATED";

interface SpeakingSocketMessage {
  type?: string;
  text?: string;
  message?: string;
  turnId?: string;
  controllerEpoch?: number;
  revision?: number;
  snapshot?: SpeakingSession;
  demoDecision?: unknown;
}

export interface SpeakingSnapshotEvent {
  source: SpeakingSnapshotSource;
  turnId?: string;
}

export interface SpeakingStreamLifecycleEvent {
  id: number;
  type: string;
  turnId?: string;
  message?: string;
  occurredAt: string;
}

type SpeakingDemoDecisionHandler = (sessionId: string, turnId: string, decision: SpeakingDemoDecision) => void;

export function useSpeakingStream(
  session: SpeakingSession | null,
  onSnapshot: (session: SpeakingSession, event: SpeakingSnapshotEvent) => void,
  onError: (message: string) => void,
  onAiAudioReady?: (turnId: string) => void,
  onDemoDecision?: SpeakingDemoDecisionHandler,
  diagnosticsActive = true,
  onControlLost?: () => void,
) {
  const [connection, setConnection] = useState<ConnectionState>("disconnected");
  const [recording, setRecording] = useState<RecordingState>("idle");
  const [interim, setInterim] = useState("");
  const [lifecycle, setLifecycle] = useState<SpeakingStreamLifecycleEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const turnRef = useRef<string | null>(null);
  const startedVoiceRef = useRef(false);
  const lastVoiceRef = useRef(0);
  const stopRef = useRef<() => Promise<void>>(async () => {});
  const onSnapshotRef = useRef(onSnapshot);
  const onErrorRef = useRef(onError);
  const onAiAudioReadyRef = useRef(onAiAudioReady);
  const onDemoDecisionRef = useRef(onDemoDecision);
  const onControlLostRef = useRef(onControlLost);
  const diagnosticsActiveRef = useRef(diagnosticsActive);
  const lifecycleIdRef = useRef(0);
  const sessionId = session?.id;
  const sessionEpoch = session?.controllerEpoch;
  const sessionStatus = session?.status;
  onSnapshotRef.current = onSnapshot;
  onErrorRef.current = onError;
  onAiAudioReadyRef.current = onAiAudioReady;
  onDemoDecisionRef.current = onDemoDecision;
  onControlLostRef.current = onControlLost;
  diagnosticsActiveRef.current = diagnosticsActive;

  const recordLifecycle = useCallback((event: Omit<SpeakingStreamLifecycleEvent, "id" | "occurredAt">) => {
    if (!diagnosticsActiveRef.current) return;
    const next = {
      ...event,
      id: ++lifecycleIdRef.current,
      occurredAt: new Date().toISOString(),
    };
    setLifecycle(current => [...current.slice(-19), next]);
  }, []);

  const stopHardware = useCallback(async () => {
    workletRef.current?.disconnect();
    workletRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context) await context.close().catch(() => {});
  }, []);

  const finishRecording = useCallback(async () => {
    if (!turnRef.current) return;
    const turnId = turnRef.current;
    turnRef.current = null;
    await stopHardware();
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && session) {
      socket.send(JSON.stringify({ type: "END_OF_TURN", turnId,
        controllerEpoch: session.controllerEpoch }));
      setRecording("processing");
    } else {
      setRecording("idle");
      onErrorRef.current("Kết nối bị gián đoạn. Phần nói chưa chốt cần nói lại.");
    }
  }, [session, stopHardware]);
  stopRef.current = finishRecording;

  useEffect(() => {
    if (!diagnosticsActive) setLifecycle([]);
  }, [diagnosticsActive]);

  useEffect(() => {
    if (!sessionId || (sessionStatus !== "ACTIVE" && sessionStatus !== "INTERRUPTED")) {
      setLifecycle([]);
      setConnection("disconnected");
      setRecording("idle");
      setInterim("");
      return;
    }
    let canceled = false;
    let retries = 0;
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setLifecycle([]);

    async function connect() {
      if (!sessionId || sessionEpoch === undefined || canceled) return;
      setConnection(retries ? "reconnecting" : "connecting");
      recordLifecycle({ type: retries ? "SOCKET_RECONNECTING" : "SOCKET_CONNECTING" });
      try {
        const { ticket } = await speakingService.ticket({ id: sessionId,
          controllerEpoch: sessionEpoch });
        if (canceled) return;
        const url = new URL(`/ws/speaking/${encodeURIComponent(sessionId)}`, window.location.href);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        url.searchParams.set("ticket", ticket);
        url.searchParams.set("contractVersion", SPEAKING_CONTRACT_VERSION);
        const socket = new WebSocket(url);
        socket.binaryType = "arraybuffer";
        socketRef.current = socket;
        socket.onmessage = event => {
          if (canceled) return;
          try {
            const message = JSON.parse(event.data as string) as SpeakingSocketMessage;
            const type = typeof message.type === "string" ? message.type : "UNKNOWN";
            const turnId = typeof message.turnId === "string" ? message.turnId : undefined;
            recordLifecycle({
              type,
              ...(turnId ? { turnId } : {}),
              ...(typeof message.message === "string" ? { message: message.message } : {}),
            });
            if (type === "CONTROLLER_CHANGED") {
              canceled = true;
              socket.close();
              onControlLostRef.current?.();
              return;
            }
            const demoDecision = parseSpeakingDemoDecision(message.demoDecision);
            if (turnId && demoDecision && diagnosticsActiveRef.current) {
              onDemoDecisionRef.current?.(sessionId, turnId, demoDecision);
            }
            if (type === "CONNECTED") {
              ready = true;
              retries = 0;
              setConnection("connected");
              if (!message.snapshot) void speakingService.get(sessionId).then(snapshot =>
                onSnapshotRef.current(snapshot, { source: "HYDRATE" })).catch(() => {});
            }
            if (message.type === "INTERIM_TRANSCRIPT") setInterim(message.text ?? "");
            if (type === "AI_AUDIO_READY" && message.turnId) {
              void speakingService.get(sessionId).then(snapshot =>
                onSnapshotRef.current(snapshot, { source: "HYDRATE" })).catch(() => {});
              onAiAudioReadyRef.current?.(message.turnId as string);
            }
            if (message.snapshot) {
              const snapshot = message.snapshot as SpeakingSession;
              if (type === "OPENING_UPDATED" && (snapshot.id !== sessionId
                || snapshot.controllerEpoch !== sessionEpoch || message.controllerEpoch !== sessionEpoch
                || message.revision !== snapshot.revision)) return;
              const turn = message.turnId ? snapshot.turns.find(item => item.id === message.turnId) : undefined;
              onSnapshotRef.current(snapshot, {
                source: type === "OPENING_UPDATED" ? "OPENING_UPDATED"
                  : type === "TURN_RESULT" && turn?.evaluationState === "SUCCEEDED"
                  ? "TURN_RESULT"
                  : type === "SESSION_ENDED" ? "SESSION_ENDED" : "HYDRATE",
                ...(type === "TURN_RESULT" && turn?.evaluationState === "SUCCEEDED" && message.turnId
                  ? { turnId: message.turnId as string } : {}),
              });
            }
            if (["TURN_RESULT", "TURN_EMPTY", "TURN_FAILED", "TURN_CANCELED", "PROCESSING_ERROR", "SESSION_ENDED"].includes(type)) {
              setRecording("idle");
              setInterim("");
              if (!message.snapshot) void speakingService.get(sessionId).then(snapshot =>
                onSnapshotRef.current(snapshot, { source: "HYDRATE" })).catch(() => {});
            }
            if (["ERROR", "TURN_FAILED", "PROCESSING_ERROR", "STT_ERROR", "TTS_ERROR"].includes(type)) {
              onErrorRef.current(message.message ?? "Lượt nói gặp lỗi. Hãy thử lại.");
            }
          } catch { onErrorRef.current("Không đọc được phản hồi từ máy chủ."); }
        };
        socket.onclose = () => {
          if (canceled) return;
          recordLifecycle({ type: "SOCKET_CLOSED" });
          const wasReady = ready;
          ready = false;
          socketRef.current = null;
          turnRef.current = null;
          void stopHardware();
          setRecording("idle");
          setInterim("");
          if (retries < 3) {
            retries += 1;
            setConnection("reconnecting");
            onErrorRef.current(`${wasReady ? "Mất kết nối" : "Chưa kết nối được"}. Đang thử nối lại (${retries}/3).`);
            timer = setTimeout(() => void connect(), 3000);
          } else {
            setConnection("disconnected");
            onErrorRef.current("Không nối lại được. Bạn có thể tiếp tục phiên khi có mạng.");
          }
        };
        socket.onerror = () => socket.close();
      } catch (error) {
        if (canceled) return;
        if (error instanceof SpeakingApiError && error.code === "CONTROLLER_CHANGED") {
          onControlLostRef.current?.();
          return;
        }
        if (retries < 3) {
          retries += 1;
          setConnection("reconnecting");
          onErrorRef.current(`Không kết nối được. Đang thử lại (${retries}/3).`);
          timer = setTimeout(() => void connect(), 3000);
        } else {
          setConnection("disconnected");
          onErrorRef.current(error instanceof Error ? error.message : "Không kết nối được.");
        }
      }
    }

    void connect();
    return () => {
      canceled = true;
      if (timer) clearTimeout(timer);
      socketRef.current?.close();
      socketRef.current = null;
      turnRef.current = null;
      void stopHardware();
    };
  }, [recordLifecycle, sessionId, sessionEpoch, sessionStatus, stopHardware]);

  const startRecording = useCallback(async () => {
    if (!session || socketRef.current?.readyState !== WebSocket.OPEN || turnRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1,
        echoCancellation: true, noiseSuppression: true } });
      stream.getTracks().forEach(track => { track.onended = () => {
        const abandoned = turnRef.current;
        turnRef.current = null;
        void stopHardware();
        setRecording("idle");
        if (abandoned && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: "CANCEL_TURN", turnId: abandoned,
            controllerEpoch: session.controllerEpoch }));
        }
        onErrorRef.current("Microphone đã ngắt. Hãy kiểm tra thiết bị rồi thử lại.");
      }; });
      const context = new AudioContext();
      await context.audioWorklet.addModule("/speaking-pcm-worklet.js");
      const source = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, "speaking-pcm");
      const sink = context.createGain();
      sink.gain.value = 0;
      source.connect(worklet).connect(sink).connect(context.destination);
      streamRef.current = stream;
      contextRef.current = context;
      workletRef.current = worklet;
      const turnId = crypto.randomUUID();
      turnRef.current = turnId;
      startedVoiceRef.current = false;
      lastVoiceRef.current = performance.now();
      socketRef.current.send(JSON.stringify({ type: "START_TURN", turnId,
        controllerEpoch: session.controllerEpoch }));
      worklet.port.onmessage = event => {
        if (!turnRef.current) return;
        const { pcm, rms } = event.data as { pcm: ArrayBuffer; rms: number };
        if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(pcm);
        const now = performance.now();
        if (rms > 0.015) {
          startedVoiceRef.current = true;
          lastVoiceRef.current = now;
        } else if (startedVoiceRef.current && now - lastVoiceRef.current > 2500) {
          void stopRef.current();
        }
      };
      setRecording("recording");
      setInterim("");
      setTimeout(() => { if (turnRef.current === turnId) void stopRef.current(); }, 120000);
    } catch (error) {
      await stopHardware();
      turnRef.current = null;
      onErrorRef.current(error instanceof Error ? error.message : "Không dùng được microphone.");
    }
  }, [session, stopHardware]);

  return { connection, recording, interim, lifecycle, startRecording, finishRecording };
}
