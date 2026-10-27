import { useEffect, useRef, useState } from "react";
import { BookOpen, ImageOff, Volume2 } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { MemoryTipCard } from "@features/topic/components/learning/MemoryTipCard";
import { lessonUnits } from "@features/topic/utils/topic-lesson";
import type { LessonContentDto, PositionDto, QuickCheckDto } from "@features/topic/types/topic-api.types";

const card = "space-y-5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm md:p-6";
function mediaUrl(url: string | null | undefined) {
  if (!url) return undefined;
  try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : undefined; } catch { return undefined; }
}
function LessonImage({ url, alt }: { url: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const source = mediaUrl(url);
  if (!source) return null;
  return failed ? <div className="flex aspect-video items-center justify-center rounded-xl bg-surface text-on-surface-variant"><ImageOff className="size-6" aria-hidden="true" /><span className="ml-2">Không tải được ảnh</span></div> :
    <img src={source} alt={alt} onError={() => setFailed(true)} className="aspect-video w-full rounded-xl object-cover" />;
}
function LessonAudio({ url, label }: { url: string | null; label: string }) {
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { const audio = player.current; return () => { audio?.pause(); }; }, [url]);
  const source = mediaUrl(url);
  if (!source) return null;
  const toggle = () => {
    const audio = player.current;
    if (!audio) return;
    if (playing) audio.pause();
    else {
      // Keep only one pronunciation/dialogue playing in this lesson.
      document.querySelectorAll("audio[data-topic-audio]").forEach(other => { if (other !== audio) (other as HTMLAudioElement).pause(); });
      setFailed(false);
      void audio.play().catch(() => setFailed(true));
    }
  };
  return <div>
    <audio ref={player} data-topic-audio src={source} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
    <Button type="button" variant="outline" onClick={toggle} aria-pressed={playing} className="min-h-12 whitespace-normal rounded-xl">
      <Volume2 className="size-4 shrink-0" aria-hidden="true" />{playing ? "Dừng · " : ""}{label}
    </Button>
    {failed && <p role="status" className="mt-1 text-label-sm text-on-surface-variant">Không phát được âm thanh. Bạn vẫn có thể tiếp tục học.</p>}
  </div>;
}
function QuickCheck({ quiz }: { quiz: QuickCheckDto }) {
  const [answer, setAnswer] = useState<string | null>(null);
  return <section className={card} aria-label="Kiểm tra phản xạ nhanh">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-headline-sm font-semibold">Kiểm tra phản xạ nhanh</h2><span className="text-label-sm text-on-surface-variant">Không bắt buộc</span></div>
    <p className="text-body-lg font-semibold">{quiz.question}</p>
    <div className="grid gap-3 sm:grid-cols-2">{quiz.options.map((option, index) =>
      <Button key={index} type="button" variant="outline" aria-pressed={answer === option} onClick={() => setAnswer(option)}
        className={"min-h-12 h-auto whitespace-normal rounded-xl px-4 py-3 text-left " + (answer === option ? "border-primary bg-primary/10" : "")}>
        {String.fromCharCode(65 + index)}. {option}
      </Button>)}</div>
    {answer !== null && <p role="status" className={answer === quiz.correctAnswer ? "font-semibold text-primary" : "text-error"}>
      {answer === quiz.correctAnswer ? "Chính xác!" : "Chưa đúng. Bạn có thể thử lại."}
    </p>}
  </section>;
}
export function TopicLessonContent({ content, position }: { content: LessonContentDto; position: PositionDto | null }) {
  const { vocabulary, purposes } = lessonUnits(content);
  if (!position || position.stage === "FILL_BLANK" || position.stage === "SITUATIONAL_CHOICE") return <section className={card}>
    <BookOpen className="size-10 text-primary" aria-hidden="true" />
    <h1 className="text-headline-lg font-bold">{position ? "Luyện tập & Phản xạ" : "Bài học đã hoàn thành"}</h1>
    <p className="text-body-md text-on-surface-variant">{position ? "Tiến độ đã được lưu ở phần luyện tập. Bạn có thể xem lại nội dung đã học bằng thanh điều hướng." : "Bạn có thể xem lại các phần nội dung đã học bằng thanh điều hướng."}</p>
  </section>;
  if (position.stage === "CONTEXT") {
    const context = content.context;
    return <div className="space-y-6">
      <section className={card}>
        <p className="text-label-lg font-semibold uppercase text-primary">Bối cảnh & Hội thoại</p>
        <h1 className="text-headline-lg font-bold">{content.title}</h1>
        {content.description && <p className="text-body-md text-on-surface-variant">{content.description}</p>}
        <LessonImage url={context.imageUrl} alt="Bối cảnh bài học" />
        <p className="whitespace-pre-line text-body-lg">{context.scenarioDescription}</p>
        {context.promptingQuestion && <p className="rounded-xl bg-primary/5 p-4 font-semibold text-primary">{context.promptingQuestion}</p>}
      </section>
      {context.dialogue.length > 0 && <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-headline-sm font-semibold">Hội thoại mẫu</h2><LessonAudio url={context.dialogueAudioUrl} label="Nghe toàn bộ hội thoại" /></div>
        {context.dialogue.map((line, index) => <div key={index} className="space-y-2 rounded-xl bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-label-lg font-semibold text-primary">{line.speaker}</span><LessonAudio url={line.audioUrl} label={"Nghe câu " + (index + 1)} /></div>
          <p lang="en" className="text-headline-sm font-semibold">{line.textEn}</p><p className="text-body-md text-on-surface-variant">{line.textVi}</p>
        </div>)}
      </section>}
      {context.tips && <MemoryTipCard title="Mẹo ghi nhớ Engo" text={context.tips} />}
    </div>;
  }
  if (position.stage === "VOCAB") {
    const word = vocabulary[position.itemIndex];
    return <div className="space-y-6">
      <section className={card}>
        <div className={"grid gap-6 " + (mediaUrl(word.imageUrl) ? "md:grid-cols-2" : "")}>
          {mediaUrl(word.imageUrl) && <LessonImage url={word.imageUrl} alt={word.word} />}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">{[word.partOfSpeech, word.label].filter(Boolean).map((tag, index) => <span key={index} className="rounded-lg bg-secondary-container/20 px-3 py-1 text-label-sm font-medium">{tag}</span>)}</div>
            <div className="flex flex-wrap items-baseline gap-3"><h1 lang="en" className="text-headline-lg font-bold">{word.word}</h1>{word.pronunciation && <span className="text-body-lg text-primary">{word.pronunciation}</span>}</div>
            <p className="text-headline-sm font-semibold">{word.meaningVi}</p>
            {word.usageDescription && <p className="rounded-xl bg-surface p-4 text-body-md leading-relaxed text-on-surface-variant">{word.usageDescription}</p>}
            <div className="flex flex-wrap gap-2"><LessonAudio url={word.audioEn} label="UK · Phát âm Anh-Anh" /><LessonAudio url={word.audioUs} label="US · Phát âm Anh-Mỹ" />
              {!word.audioEn && !word.audioUs && <LessonAudio url={word.audioUrl} label="Nghe phát âm" />}</div>
          </div>
        </div>
        {word.collocations.length > 0 && <div className="space-y-3"><h2 className="text-label-lg font-semibold uppercase text-on-surface-variant">Cụm từ phối hợp hay gặp</h2>
          <div className="grid gap-3 sm:grid-cols-2">{word.collocations.map((item, index) => <div key={index} className="rounded-xl bg-surface p-4"><p lang="en" className="font-semibold text-primary">{item.textEn}</p><p className="text-body-md text-on-surface-variant">{item.meaningVi}</p></div>)}</div>
        </div>}
      </section>
      {word.examples.length > 0 && <section className={card}><h2 className="text-headline-sm font-semibold">Mẫu câu trong ngữ cảnh</h2>{word.examples.map(example =>
        <div key={example.exampleId} className="space-y-3 rounded-xl bg-surface p-4"><p lang="en" className="text-headline-sm font-semibold">{example.textEn}</p>
          <p className="text-body-md text-on-surface-variant">{example.textVi}</p><LessonAudio url={example.audioUrl} label="Nghe câu mẫu" /></div>)}</section>}
      {word.quickCheck && <QuickCheck quiz={word.quickCheck} />}
      {word.tips && <MemoryTipCard title="Mẹo ghi nhớ Engo" text={word.tips} />}
    </div>;
  }
  const purpose = purposes[position.itemIndex];
  return <div className="space-y-6">
    <section className={card}><p className="text-label-lg font-semibold uppercase text-primary">Mẫu câu thực tế</p>
      {purpose.purposeEn && <h1 lang="en" className="text-headline-lg font-bold">{purpose.purposeEn}</h1>}
      <h2 className={purpose.purposeEn ? "text-headline-sm font-semibold" : "text-headline-lg font-bold"}>{purpose.purposeVi}</h2>
    </section>
    {purpose.examples.length > 0 ? <section className={card} aria-label="Các mẫu câu">
      {purpose.examples.map(example => <article key={example.expressionId} className="space-y-3 rounded-xl bg-surface p-5">
        <span className="text-label-sm font-semibold text-primary">{{ BASIC_SUGGESTION: "Gợi ý cơ bản", POLITE_INQUIRY: "Hỏi lịch sự", SLOT_PATTERN: "Mẫu thế chỗ" }[example.type]}</span>
        <p lang="en" className="text-headline-sm font-semibold">{example.textEn}</p><p className="text-body-md text-on-surface-variant">{example.textVi}</p>
        {example.usageNote && <p className="border-t border-outline-variant/40 pt-3 text-body-md text-on-surface-variant">{example.usageNote}</p>}
        <LessonAudio url={example.audioUrl} label="Nghe mẫu câu" />
      </article>)}
    </section> : <p className="text-body-md text-on-surface-variant">Nhóm này chưa có mẫu câu minh họa.</p>}
    {purpose.tips && <MemoryTipCard title="Mẹo ghi nhớ Engo" text={purpose.tips} />}
  </div>;
}
