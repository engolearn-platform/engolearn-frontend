import { useCallback, useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { useFetch } from "@shared/hooks";
import { learningPathService } from "@features/learning-path/services/learningPath.service";
import type { LearningPathAudioContext } from "@features/learning-path/types/learning-path-day.types";
import { learningPathAudioExpired, safeLearningPathAudioUrl } from "@features/learning-path/utils/learningPathAudio";

interface RestorePlayback { position: number; rate: number; volume: number; muted: boolean; resume: boolean }
function renewalError(status?: number): string {
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để nghe audio.";
  if (status === 403) return "Bạn không có quyền nghe audio này.";
  if (status === 404) return "Không tìm thấy audio hoặc bạn không được phép xem câu hỏi này. Hãy quay lại lộ trình.";
  if (status === 409) return "Ngày luyện tập không còn khả dụng. Hãy quay lại lộ trình để kiểm tra trạng thái.";
  if (status === 400) return "Thông tin câu hỏi không hợp lệ. Hãy quay lại lộ trình và mở lại bài.";
  return "Chưa tải lại được audio. Vui lòng thử lại; đáp án và tiến độ vẫn được giữ nguyên.";
}

export function useLearningPathAudio({ url, expiresAt, contentType, context, disabled }: {
  url?: string; expiresAt?: string | null; contentType?: string | null; context?: LearningPathAudioContext; disabled: boolean;
}) {
  const player = useRef<HTMLAudioElement>(null);
  const mounted = useRef(false);
  const locked = useRef(false);
  const requestId = useRef(0);
  const handled = useRef(0);
  const position = useRef(0);
  const playingIntent = useRef(false);
  const transitioning = useRef(false);
  const restore = useRef<RestorePlayback | null>(null);
  const [delivery, setDelivery] = useState(() => ({ url: safeLearningPathAudioUrl(url), expiresAt, contentType }));
  const [generation, setGeneration] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { pathId = "", weekNo = "", dayNo = "", questionId = "" } = context ?? {};
  const canRenew = !!(pathId && weekNo && dayNo && questionId);
  const load = useCallback(async (signal: AbortSignal) => {
    const id = requestId.current;
    if (disabled || !pathId || !weekNo || !dayNo || !questionId) throw new Error("Audio is unavailable in this context");
    const audio = await learningPathService.questionAudio({ pathId, weekNo, dayNo, questionId }, signal);
    return { id, audio };
  }, [pathId, weekNo, dayNo, questionId, disabled]);
  const renewal = useFetch(load, false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false; restore.current = null;
    };
  }, []);
  useEffect(() => {
    const element = player.current;
    return () => element?.pause();
  }, [generation]);
  useEffect(() => {
    if (!disabled) return;
    requestId.current++; locked.current = false; restore.current = null;
    playingIntent.current = false; transitioning.current = false;
    player.current?.pause(); setRefreshing(false);
  }, [disabled]);
  useEffect(() => {
    const response = renewal.data;
    if (!response || disabled || response.id !== requestId.current || response.id === handled.current) return;
    handled.current = response.id;
    setDelivery({ url: response.audio.url, expiresAt: response.audio.expiresAt, contentType: response.audio.contentType });
    setGeneration(value => value + 1); setRefreshing(false); setError(""); setNotice(""); locked.current = false;
  }, [renewal.data, disabled]);
  useEffect(() => {
    if (!renewal.error || disabled) return;
    locked.current = false; restore.current = null; transitioning.current = false;
    player.current?.pause(); setRefreshing(false);
    setError(renewalError(renewal.error.status));
    if ([400, 401, 403, 404, 409].includes(renewal.error.status ?? 0)) setBlocked(true);
  }, [renewal.error, disabled]);

  const rememberPosition = () => {
    const element = player.current;
    if (element && !element.error && Number.isFinite(element.currentTime)) position.current = element.currentTime;
  };
  const renew = () => {
    if (locked.current || !mounted.current || disabled || blocked || !canRenew) return;
    const pendingRestore = restore.current;
    if (!pendingRestore) rememberPosition();
    const element = player.current;
    restore.current = pendingRestore ?? { position: position.current, rate: element?.playbackRate ?? 1,
      volume: element?.volume ?? 1, muted: element?.muted ?? false,
      resume: playingIntent.current || (!!element && !element.paused && !element.ended) };
    locked.current = true; transitioning.current = true; requestId.current++;
    element?.pause(); setRefreshing(true); setError(""); setNotice("");
    void renewal.refetch();
  };
  const isCurrent = (event: SyntheticEvent<HTMLAudioElement>) => mounted.current && event.currentTarget === player.current;
  const checkPlayback = (event: SyntheticEvent<HTMLAudioElement>) => {
    if (!isCurrent(event)) return;
    if (disabled || blocked || locked.current) { event.currentTarget.pause(); return; }
    rememberPosition();
    if (learningPathAudioExpired(delivery.expiresAt)) {
      transitioning.current = true;
      event.currentTarget.pause();
      setError("Liên kết nghe đã hết hạn. Hãy tải lại audio để tiếp tục.");
    }
  };
  const onPlay = (event: SyntheticEvent<HTMLAudioElement>) => {
    if (!isCurrent(event)) return;
    playingIntent.current = true; checkPlayback(event);
  };
  const onSeeking = (event: SyntheticEvent<HTMLAudioElement>) => {
    if (!isCurrent(event) || transitioning.current) return;
    checkPlayback(event);
  };
  const onPause = (event: SyntheticEvent<HTMLAudioElement>) => {
    if (!isCurrent(event)) return;
    if (!transitioning.current) { rememberPosition(); playingIntent.current = false; }
  };
  const onTimeUpdate = (event: SyntheticEvent<HTMLAudioElement>) => {
    if (isCurrent(event) && !transitioning.current) rememberPosition();
  };
  const onError = (event: SyntheticEvent<HTMLAudioElement>) => {
    if (!isCurrent(event) || disabled || blocked || locked.current) return;
    rememberPosition(); transitioning.current = true; event.currentTarget.pause();
    setError("Không phát được audio. Hãy thử tải lại để tiếp tục nghe.");
  };
  const onLoadedMetadata = (event: SyntheticEvent<HTMLAudioElement>) => {
    if (!isCurrent(event)) return;
    const saved = restore.current; const element = event.currentTarget;
    if (!saved || disabled || blocked || locked.current) return;
    restore.current = null;
    try {
      element.playbackRate = saved.rate; element.volume = saved.volume; element.muted = saved.muted;
      element.currentTime = Math.max(0, Number.isFinite(element.duration) ? Math.min(saved.position, element.duration) : saved.position);
      position.current = element.currentTime;
    } catch {
      transitioning.current = false; playingIntent.current = false;
      setNotice("Audio đã tải lại nhưng chưa khôi phục được vị trí nghe. Bạn có thể tua đến vị trí muốn tiếp tục.");
      return;
    }
    transitioning.current = false; playingIntent.current = false;
    if (saved.resume && !learningPathAudioExpired(delivery.expiresAt)) {
      const id = requestId.current;
      void element.play().catch(() => {
        if (mounted.current && player.current === element && id === requestId.current) {
          setNotice("Audio đã sẵn sàng. Nhấn Phát để tiếp tục nghe.");
        }
      });
    }
  };
  return { player, delivery, generation, refreshing, blocked, error, notice, canRenew, renew,
    onPlay, onPause, onSeeking, onTimeUpdate, onError, onLoadedMetadata };
}
