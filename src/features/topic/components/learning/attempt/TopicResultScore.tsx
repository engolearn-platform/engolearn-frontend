import { CheckCircle2 } from "lucide-react";

export function TopicResultScore({ title, correct, total, percent }: { title: string; correct: number; total: number; percent: number }) {
  return <section className="space-y-5 rounded-2xl border border-primary/20 bg-surface-container-lowest p-5 md:p-6">
    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-label-lg font-semibold text-primary"><CheckCircle2 className="size-5" aria-hidden="true" />Đã hoàn thành</span>
    <h1 className="text-headline-lg font-bold">{title}</h1>
    <div className="space-y-2 border-t border-outline-variant/50 pt-5">
      <p className="text-body-md text-on-surface-variant">Độ chính xác ngay lần đầu</p>
      <div className="flex flex-wrap items-baseline gap-4"><strong className="text-headline-lg text-primary">{correct}/{total} câu</strong><span className="text-headline-lg font-semibold">{percent}%</span></div>
      <p className="text-body-md text-on-surface-variant">Bạn đã trả lời đúng toàn bộ câu hỏi để hoàn thành bài học.</p>
    </div>
  </section>;
}
