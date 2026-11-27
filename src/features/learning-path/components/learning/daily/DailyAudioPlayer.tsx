import { RotateCw } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useLearningPathAudio } from "@features/learning-path/hooks/useLearningPathAudio";
import type { LearningPathAudioContext } from "@features/learning-path/types/learning-path-day.types";

interface DailyAudioPlayerProps {
  label: string;
  url?: string;
  expiresAt?: string | null;
  contentType?: string | null;
  context?: LearningPathAudioContext;
  disabled?: boolean;
}

export default function DailyAudioPlayer({ label, disabled = false, ...source }: DailyAudioPlayerProps) {
  const audio = useLearningPathAudio({ ...source, disabled });
  return <div className="space-y-3 rounded-xl border border-outline-variant/50 bg-surface-container-low p-3" aria-busy={audio.refreshing}>
    <p className="text-label-sm text-on-surface-variant">{label}</p>
    {audio.delivery.url ? <audio key={audio.generation} ref={audio.player} controls={!disabled && !audio.refreshing && !audio.blocked}
      preload={audio.generation ? "metadata" : "none"} aria-label={label} aria-disabled={disabled || audio.refreshing || audio.blocked} className="w-full"
      onPlay={audio.onPlay} onPause={audio.onPause} onEnded={audio.onPause} onSeeking={audio.onSeeking} onTimeUpdate={audio.onTimeUpdate}
      onError={audio.onError} onLoadedMetadata={audio.onLoadedMetadata}>
      <source src={audio.delivery.url} type={audio.delivery.contentType ?? undefined} />
      Trình duyệt không hỗ trợ phát audio.
    </audio> : <p className="text-body-md text-on-surface-variant">Chưa có audio cho câu hỏi này.</p>}
    {audio.refreshing && <p role="status" className="text-label-sm text-on-surface-variant">Đang tải lại audio…</p>}
    {audio.error && !disabled && <p role="alert" className="text-body-md text-error">{audio.error}</p>}
    {audio.notice && !disabled && <p role="status" className="text-label-sm text-on-surface-variant">{audio.notice}</p>}
    {audio.canRenew && <Button type="button" variant="outline" className="min-h-12 whitespace-normal" disabled={disabled || audio.refreshing || audio.blocked}
      onClick={audio.renew} aria-label={`Tải lại audio: ${label}`}><RotateCw className="size-4 shrink-0" aria-hidden="true" />Tải lại audio</Button>}
    {disabled && <p className="text-label-sm text-on-surface-variant">Audio tạm dừng khi đang nộp bài hoặc ngày luyện tập đã đóng.</p>}
  </div>;
}
