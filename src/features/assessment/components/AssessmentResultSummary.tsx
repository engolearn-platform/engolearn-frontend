import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { AssessmentCard } from "./AssessmentCommon";
import type { AssessmentResult } from "@features/assessment/types/assessment.types";

export function AssessmentResultSummary({data, detail = false}: {data: AssessmentResult; detail?: boolean}) {
  return <AssessmentCard>
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-learning-outline pb-4">
      <div><h2 className="text-lg font-semibold">Tổng kết bài đánh giá</h2><p className="mt-1 text-sm text-muted-foreground">{data.series} · Phiên bản {data.paperVersion}</p></div>
      <div className="flex flex-wrap items-center gap-3"><span className="rounded-lg bg-learning-mint px-3 py-2 text-sm font-semibold text-primary">Mức của bài: {data.level}</span>{!detail && <Button asChild variant="outline" className="h-12"><Link to={`/assessment/attempts/${data.id}/review`}>Xem chi tiết</Link></Button>}</div>
    </div>
    <div className="mt-5 grid gap-5 md:grid-cols-[1fr_2fr]">
      <div className="flex flex-col items-center justify-center rounded-xl border border-learning-mint-border bg-learning-mint p-5 text-primary"><p className="text-sm font-medium">Điểm bài đánh giá</p><p className="mt-2 text-4xl font-bold tabular-nums">{data.score}<span className="text-lg font-medium"> / 100</span></p><p className="mt-2 text-sm">Đúng {data.correct}/50 câu</p></div>
      <div className="flex flex-col justify-center gap-5">{[{name: "Listening", label: "Nghe", correct: data.listeningCorrect, total: 20}, {name: "Reading", label: "Đọc", correct: data.readingCorrect, total: 30}].map(item => <div key={item.name}><div className="mb-2 flex flex-wrap justify-between gap-2"><span className="font-semibold">{item.name} <span className="text-sm font-normal text-muted-foreground">· {item.label}</span></span><span className="text-sm tabular-nums">{item.correct}/{item.total} câu · {Math.round(item.correct * 100 / item.total)}%</span></div><progress aria-label={`Kết quả ${item.label}`} value={item.correct} max={item.total} className="block h-2 w-full accent-primary" /></div>)}</div>
    </div>
    <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-learning-outline pt-4 text-sm"><div className="flex flex-wrap gap-4"><span>Đầu vào <strong>{data.initialLevel}</strong></span><span>Hiện tại <strong>{data.currentLevel}</strong></span><span>Cao nhất <strong>{data.highestLevel}</strong></span></div><p className="text-muted-foreground">Mức học tham khảo trong EngoLearn.</p></div>
  </AssessmentCard>;
}
