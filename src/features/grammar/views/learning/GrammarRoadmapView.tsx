import { ArrowRight, BookOpen, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Card, EmptyState } from "@shared/components";
import CefrTabs from "@features/grammar/components/learning/CefrTabs";
import { GrammarLoadError, GrammarName, GrammarLoading, GrammarPage, GrammarRouteNotice } from "@features/grammar/components/learning/GrammarLearningUi";
import ProgressBar from "@features/grammar/components/learning/ProgressBar";
import StatusBadge from "@features/grammar/components/learning/StatusBadge";
import { useGrammarRoadmap } from "@features/grammar/hooks/useGrammarLearning";
import { grammarPaths } from "@features/grammar/services/grammar-learning.service";
import type { GrammarLevel } from "@features/grammar/types/grammar-content.types";
import type { GrammarRoadmapLevel, LearnerGrammarTopic } from "@features/grammar/types/grammar.types";

function TopicCard({ topic, unlocked }: { topic: LearnerGrammarTopic; unlocked: boolean }) {
  const actionLabel = topic.status === "COMPLETED" ? "Ôn lại chủ đề" : topic.status === "IN_PROGRESS" ? "Tiếp tục học" : "Xem chủ đề";
  const content = <>
    <StatusBadge status={unlocked ? topic.status : "LOCKED"} />
    <div className="space-y-1"><h3 className="wrap-break-word text-headline-md font-bold"><GrammarName titleEn={topic.titleEn} titleVi={topic.titleVi} /></h3></div>
    <div className="mt-auto space-y-3 pt-2">
      <ProgressBar label={`Tiến độ ${topic.titleVi}`} value={topic.percent} description={`${topic.completedLessons}/${topic.totalLessons} bài hoàn thành`} />
      {unlocked && <span className="flex items-center justify-between font-semibold text-primary">{actionLabel}<ArrowRight className="size-5" aria-hidden="true" /></span>}
    </div>
  </>;
  const classes = "flex h-full min-h-52 flex-col gap-4 rounded-2xl border border-learning-outline bg-white p-5";
  return <li className="min-w-0">{unlocked && topic.status !== "LOCKED"
    ? <Link to={grammarPaths.topic(topic.id)} className={`${classes} hover:border-primary focus-visible:outline-2 focus-visible:outline-primary`} aria-label={`${actionLabel}: ${topic.titleVi}`}>{content}</Link>
    : <div className={classes}>{content}</div>}</li>;
}
function LevelContent({ group }: { group: GrammarRoadmapLevel }) {
  const pending = group.topics.filter((topic) => topic.status !== "COMPLETED");
  const completed = group.topics.filter((topic) => topic.status === "COMPLETED");
  const list = (topics: LearnerGrammarTopic[]) => <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} unlocked={group.unlocked} />)}</ul>;
  return <div className="space-y-6">
    <Card className="space-y-3 rounded-2xl border-learning-nav-border bg-learning-nav-active p-5">
      <h2 className="flex items-center gap-2 text-headline-sm font-bold"><BookOpen className="size-5 text-primary" aria-hidden="true" />Tiến độ {group.level}</h2>
      <ProgressBar label={`Tiến độ ${group.level}`} value={group.percent} description={`${group.completedTopics}/${group.totalTopics} chủ đề hoàn thành`} />
    </Card>
    {!group.unlocked && group.lockHint && <p className="flex items-start gap-2 rounded-xl bg-learning-note px-4 py-3 text-body-md text-learning-note-ink"><LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden="true" />{group.lockHint}</p>}
    {!group.totalTopics && <EmptyState className="rounded-2xl border border-learning-outline bg-white" title="Sắp ra mắt" description="Trình độ này chưa có bài học đã xuất bản." />}
    {pending.length > 0 && <section className="space-y-4" aria-label={`Chủ đề ${group.level}`}><h2 className="text-headline-md font-bold">Chủ đề của bạn</h2>{list(pending)}</section>}
    {completed.length > 0 && <details className="space-y-4"><summary className="min-h-12 cursor-pointer py-3 text-label-lg font-semibold text-primary">{completed.length} chủ đề đã hoàn thành</summary>{list(completed)}</details>}
  </div>;
}
export default function GrammarRoadmapView() {
  const { data, loading, error, refetch } = useGrammarRoadmap();
  const [selectedLevel, setSelectedLevel] = useState<GrammarLevel | null>(null);
  const active = selectedLevel ?? data?.currentLevel;
  return <GrammarPage wide>
    <header className="space-y-2"><h1 className="text-headline-lg font-bold">Học ngữ pháp từng bước</h1><p className="text-body-md text-on-surface-variant">Đọc một bài ngắn, luyện 5 câu và theo dõi tiến bộ của bạn.</p></header>
    <GrammarRouteNotice />{loading && <GrammarLoading />}
    {!loading && (error || !data || !active) && <GrammarLoadError message="Không tải được lộ trình ngữ pháp." retry={refetch} />}
    {!loading && data && active && <>
      {data.newlyUnlockedLevels.length > 0 && <p role="status" className="flex items-center gap-2 rounded-xl bg-learning-mint px-4 py-3 text-body-md font-semibold text-primary"><UnlockKeyhole className="size-5" aria-hidden="true" />Đã mở khóa trình độ {data.newlyUnlockedLevels.join(", ")}</p>}
      <CefrTabs levels={data.levels} active={active} onSelect={setSelectedLevel} />
      {data.levels.map((level) => <section key={level.level} id={`grammar-level-panel-${level.level}`} role="tabpanel" aria-labelledby={`grammar-level-${level.level}`} tabIndex={0} hidden={active !== level.level}>{active === level.level && <LevelContent group={level} />}</section>)}
    </>}
  </GrammarPage>;
}
