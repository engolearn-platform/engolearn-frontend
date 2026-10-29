import { Play } from "lucide-react";

interface DailyAudioPlayerProps {
  label: string;
  duration: string;
  url?: string;
}

export default function DailyAudioPlayer({ label, duration, url }: DailyAudioPlayerProps) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
      <p className="mb-3 text-xs text-on-surface-variant">{label}</p>
      {url ? <audio controls src={url} aria-label={label} className="w-full" /> : <div className="flex items-center gap-3">
        <button
          type="button"
          disabled
          title="Chưa có tệp audio cho bản giao diện mẫu."
          aria-label={`Phát ${label.toLowerCase()}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:cursor-not-allowed"
        >
          <Play className="size-4 fill-current" aria-hidden="true" />
        </button>
        <div className="h-1.5 flex-1 rounded-full bg-surface-container-high" aria-hidden="true" />
        <span className="whitespace-nowrap text-xs text-on-surface-variant">0:00 / {duration}</span>
        <span className="rounded border border-outline-variant/50 bg-surface-container-lowest px-1.5 py-0.5 text-xs text-on-surface-variant">1x</span>
      </div>}
    </div>
  );
}
