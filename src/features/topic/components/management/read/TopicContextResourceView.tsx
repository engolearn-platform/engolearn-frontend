import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import type { TopicContextResource } from "@features/topic/types/topic-management.types";
import { playableManagementMediaUrl } from "@features/topic/utils/management-media";
import { hasContextContent } from "@features/topic/utils/topic-context-presentation";

function ContextDialogueAudio({ source, index }: { source: string; index: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);

  return (
    <div className="grid min-w-0 gap-1">
      <audio controls preload="none" src={source} aria-label={`Âm thanh lời thoại ${index + 1}`}
        onError={() => setFailed(true)} onCanPlay={() => setFailed(false)} className="max-w-full" />
      {failed && <p role="alert" aria-live="assertive" className="break-words text-label-sm text-error">Không thể tải hoặc phát âm thanh này.</p>}
    </div>
  );
}

export default function TopicContextResourceView({ value }: { value: TopicContextResource | null }) {
  if (!hasContextContent(value) || !value) return null;
  const dialogue = value.dialogue
    .map((turn, index) => ({ turn, index }))
    .filter(({ turn }) => turn.speaker?.trim() || turn.textEn?.trim() || turn.textVi?.trim() || turn.audioUrl?.trim());

  return (
    <div className="space-y-5">
      {value.scenarioDescription?.trim() && (
        <article className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 sm:p-6">
          <h3 className="mb-2 text-headline-sm font-semibold text-on-surface">Tình huống</h3>
          <p className="min-w-0 whitespace-pre-wrap break-words text-body-md leading-relaxed text-on-surface">{value.scenarioDescription}</p>
        </article>
      )}

      {value.prompt?.trim() && (
        <aside className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-on-surface sm:p-5">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="mb-1 text-label-lg font-semibold">Câu hỏi gợi mở</h3>
            <p className="min-w-0 whitespace-pre-wrap break-words text-body-md">{value.prompt}</p>
          </div>
        </aside>
      )}

      {dialogue.length > 0 && (
        <section aria-label="Hội thoại" className="space-y-3">
          <h3 className="text-headline-sm font-semibold text-on-surface">Hội thoại</h3>
          <ol className="space-y-3">
            {dialogue.map(({ turn, index }) => {
              const audio = playableManagementMediaUrl(turn.audioUrl);
              return (
                <li key={`${index}-${turn.speaker ?? "speaker"}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 sm:gap-4 sm:p-5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-label-lg font-semibold text-primary" aria-hidden="true">{index + 1}</span>
                  <div className="min-w-0 space-y-2">
                    <p className="min-w-0 break-words text-label-lg font-semibold text-on-surface">{turn.speaker?.trim() || "Người nói chưa xác định"}</p>
                    {turn.textEn?.trim() && <p className="min-w-0 whitespace-pre-wrap break-words text-body-md leading-relaxed text-on-surface">{turn.textEn}</p>}
                    {turn.textVi?.trim() && <p className="min-w-0 whitespace-pre-wrap break-words text-label-lg leading-relaxed text-on-surface-variant">{turn.textVi}</p>}
                    {!turn.audioUrl?.trim()
                      ? <p role="status" aria-live="polite" className="break-words text-label-sm text-on-surface-variant">Chưa có âm thanh cho lời thoại này.</p>
                      : audio
                        ? <ContextDialogueAudio key={audio} source={audio} index={index} />
                        : <p role="status" aria-live="polite" className="break-words text-label-sm text-error">Nguồn âm thanh không hợp lệ.</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {(value.tips?.trim() || value.durationSec != null) && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-surface-container-low p-4">
          {value.tips?.trim() && <div className="min-w-0"><p className="mb-1 text-label-sm font-semibold text-on-surface-variant">Mẹo cho người học</p><p className="min-w-0 whitespace-pre-wrap break-words text-body-md text-on-surface">{value.tips}</p></div>}
          {value.durationSec != null && <p className="shrink-0 text-label-sm text-on-surface-variant">Thời lượng: {value.durationSec} giây</p>}
        </div>
      )}
    </div>
  );
}
