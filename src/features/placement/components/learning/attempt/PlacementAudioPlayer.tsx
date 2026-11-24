import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PlacementQuestionAudio } from "@features/placement/types/placement-attempt.types";
import { formatCountdown } from "@features/placement/constants";

interface PlacementAudioPlayerProps {
  audio: PlacementQuestionAudio;
  questionId: string;
}

/**
 * Mock has no audio files yet (`url: null`), so playback is simulated with a
 * ticker. Once the real API returns a URL the native <audio> element drives
 * the same UI. Replaying is always allowed (BR-F1.8).
 */
export default function PlacementAudioPlayer({
  audio,
  questionId,
}: PlacementAudioPlayerProps) {
  const simulated = !audio.url;
  const duration = audio.durationSeconds;
  const mediaRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
  }, [questionId]);

  useEffect(() => {
    if (!simulated || !playing) return;

    const timer = window.setInterval(() => {
      setElapsed((previous) => {
        if (previous + 1 >= duration) {
          setPlaying(false);
          return duration;
        }
        return previous + 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [simulated, playing, duration]);

  useEffect(() => {
    if (simulated || !playing) return;

    const media = mediaRef.current;
    if (!media) return;

    void media.play().catch(() => setPlaying(false));
  }, [simulated, playing]);

  const handleToggle = () => {
    if (playing) {
      mediaRef.current?.pause();
      setPlaying(false);
      return;
    }

    const finished = elapsed >= duration;

    if (finished) {
      setElapsed(0);
      if (!simulated) {
        const media = mediaRef.current;
        if (media) media.currentTime = 0;
      }
    }

    setPlaying(true);
  };

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container px-3 py-2.5">
      {!simulated ? (
        <audio
          ref={mediaRef}
          src={audio.url ?? undefined}
          onTimeUpdate={(event) =>
            setElapsed(Math.floor(event.currentTarget.currentTime))
          }
          onEnded={() => setPlaying(false)}
          preload="none"
          className="hidden"
        />
      ) : null}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={playing ? "Tạm dừng audio" : "Phát audio"}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary/90"
      >
        {playing ? (
          <Pause className="size-4" aria-hidden="true" />
        ) : (
          <Play className="size-4" aria-hidden="true" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1.5">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-label-sm tabular-nums text-on-surface-variant">
          {formatCountdown(elapsed * 1000)} / {formatCountdown(duration * 1000)}
        </span>
      </div>

      <Volume2
        className="size-4 shrink-0 text-on-surface-variant"
        aria-hidden="true"
      />
    </div>
  );
}
