import { BookOpen } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components";
import { GrammarBackLink, GrammarLoadError, GrammarName, GrammarLoading, GrammarPage } from "@features/grammar/components/learning/GrammarLearningUi";
import GrammarTheoryBlock from "@features/grammar/components/learning/GrammarTheoryBlock";
import { useGrammarSummary } from "@features/grammar/hooks/useGrammarLearning";
import { grammarPaths } from "@features/grammar/services/grammar-learning.service";

function Summary({ topicId }: { topicId: string }) {
  const { data, loading, error, refetch } = useGrammarSummary(topicId);
  if (data && data.topic.status !== "COMPLETED") return <Navigate replace to={grammarPaths.topic(topicId)} state={{ grammarNotice: "Hoàn thành chủ đề để mở phần tóm tắt." }} />;
  if (error?.status === 403 || error?.status === 404) return <Navigate replace to={grammarPaths.topic(topicId)} state={{ grammarNotice: "Nội dung tóm tắt hiện không còn khả dụng." }} />;
  return <GrammarPage><GrammarBackLink to={grammarPaths.topic(topicId)}>Về chủ đề</GrammarBackLink>
    {loading && <GrammarLoading />}{!loading && !data && <GrammarLoadError message="Không tải được tóm tắt chủ đề." retry={refetch} />}
    {!loading && data && <><header className="space-y-2"><p className="text-label-lg font-semibold text-primary">Tóm tắt chủ đề · {data.topic.level}</p><h1 className="text-headline-lg font-bold"><GrammarName titleEn={data.topic.titleEn} titleVi={data.topic.titleVi} /></h1><p className="text-body-md text-on-surface-variant">Ôn nhanh kiến thức đã học. Trang này không thay đổi tiến độ hoặc điểm của bạn.</p></header>
      {data.lessons.map((lesson) => {
        const blocks = lesson.blocks.filter((block) => ["FORMULA", "RULE_QUICK_NOTE", "COMMON_MISTAKE"].includes(block.type));
        return <section key={`${lesson.id}/${lesson.contentVersion}`} className="space-y-4" aria-labelledby={`summary-${lesson.id}`}><h2 id={`summary-${lesson.id}`} className="text-headline-md font-bold">Bài {lesson.number} · <GrammarName titleEn={lesson.titleEn} titleVi={lesson.titleVi} /></h2>
          {blocks.length ? blocks.map((block) => <GrammarTheoryBlock key={block.id} block={block} />) : <Card className="rounded-2xl border-learning-outline bg-white p-5"><p className="text-body-md">{lesson.objective}</p></Card>}
          <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={grammarPaths.lesson(topicId, lesson.id)}><BookOpen aria-hidden="true" />Ôn lại toàn bộ bài học</Link></Button>
        </section>;
      })}
    </>}
  </GrammarPage>;
}
export default function GrammarTopicSummaryView() { const { topicId } = useParams(); return topicId ? <Summary key={topicId} topicId={topicId} /> : <Navigate replace to={grammarPaths.roadmap} />; }
