import { useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/shadcn/button";
import { mediaUrl } from "@features/assessment/services/assessmentApi";
import type { Media } from "@features/assessment/types/assessment.types";

export function AssessmentAudio({load, review = false, onFailure}: {load: () => Promise<Media>; review?: boolean; onFailure?: (reason: "LOAD_FAILED" | "PLAYBACK_FAILED" | "AUTOPLAY_BLOCKED") => void}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null), [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false), [started, setStarted] = useState(false), [ended, setEnded] = useState(false);
  const [position, setPosition] = useState(0), [duration, setDuration] = useState(0);
  const startedRef = useRef(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {const audio = ref.current; return () => {audio?.pause();};}, []);
  useEffect(() => {
    let active = true, objectUrl: string | null = null;
    void load().then(media => {
      objectUrl = mediaUrl(media);
      if (active) setUrl(objectUrl); else URL.revokeObjectURL(objectUrl);
    }).catch(e => {if (active) {setError((e as Error).message);onFailure?.("LOAD_FAILED");}});
    return () => {active = false; if (objectUrl) URL.revokeObjectURL(objectUrl);};
  }, [load, retry, onFailure]);
  const play = () => {
    const audio = ref.current;
    if (!audio || ended || startedRef.current && !review) return;
    audio.playbackRate = 1;
    void audio.play().then(() => {startedRef.current = true; setStarted(true);setBlocked(false);}).catch(() => setBlocked(true));
  };
  useEffect(() => {
    const audio = ref.current;
    if (!url || !audio || review) return;
    audio.playbackRate = 1;
    void audio.play().then(() => {startedRef.current = true;setStarted(true);setBlocked(false);}).catch(() => {setBlocked(true);onFailure?.("AUTOPLAY_BLOCKED");});
    return () => {audio.pause(); audio.removeAttribute("src"); audio.load();};
  }, [url, review, onFailure]);
  return <div className="space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><strong>{review ? "Âm thanh bài đã làm" : "Đoạn nghe"}</strong>{!review && <span className="text-sm text-primary">Chỉ nghe một lần</span>}</div>
    <audio ref={ref} src={url ?? undefined} controls={review} preload="auto" controlsList="nodownload noplaybackrate"
      className={review ? "w-full" : "hidden"} onTimeUpdate={e => setPosition(e.currentTarget.currentTime)}
      onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onEnded={() => setEnded(true)}
      onError={() => {if (url) {setError("Không phát được âm thanh. Giờ vẫn chạy; bạn có thể nộp phần đã làm hoặc thoát.");onFailure?.("PLAYBACK_FAILED");}}} />
    {!review && <><progress className="h-2 w-full accent-primary" aria-label="Tiến độ phát âm thanh" max={duration || 1} value={position} /><div className="flex justify-between text-sm"><span>{Math.floor(position)} giây</span><span>{ended ? "Đã phát xong" : started ? "Đang phát" : url ? "Sẵn sàng" : "Đang tải…"}</span><span>{Math.ceil(duration)} giây</span></div></>}
    {blocked && !started && !error && <div className="rounded-xl bg-learning-note p-3 text-learning-note-ink"><p>Trình duyệt đang chặn phát tự động. Đồng hồ vẫn chạy.</p><Button className="mt-3 h-12" onClick={play}>Kích hoạt âm thanh</Button></div>}
    {error && <p role="alert" className="text-error">{error}</p>}
    {error && !started && <Button className="h-12" variant="outline" onClick={() => {setError(null);setRetry(r => r + 1);}}>Thử tải âm thanh lại</Button>}
  </div>;
}
