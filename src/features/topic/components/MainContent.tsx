import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import TopicFilterChips from "./TopicFilterChips";
import { TopicGrid } from "@features/topic/components/learning/catalog/TopicGrid";
import { readTopicFilters } from "@features/topic/utils/topic-catalog";
import { useTopicViewer } from "@features/topic/hooks/topic-viewer.context";

export default function MainContent() {
  const viewer = useTopicViewer();
  const location = useLocation();
  const [parameters, setParameters] = useSearchParams();
  const filters = readTopicFilters(parameters, viewer.cefrLevel);
  const [draft, setDraft] = useState(filters.keyword);
  useEffect(() => { setDraft(filters.keyword); }, [filters.keyword]);
  useEffect(() => {
    if (draft.trim() === filters.keyword) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(parameters);
      if (draft.trim()) next.set("q", draft.trim()); else next.delete("q");
      setParameters(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, filters.keyword, parameters, setParameters]);
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(parameters);
    if (value === "all" || value === "recommended") next.delete(key); else next.set(key, value);
    setParameters(next);
  };
  const filtered = !!filters.keyword || filters.selectedLevel !== "all" || filters.sort !== "recommended";
  const scope = viewer.kind + ":" + viewer.learnerId + ":" + filters.keyword + ":" + filters.level + ":" + filters.sort;
  return <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-8 md:py-10">
    <div className="space-y-3"><div className="flex flex-wrap items-center gap-3"><h1 className="text-headline-lg font-bold text-on-surface">Khám phá chủ đề học</h1>
      {viewer.cefrLevel && <span className="rounded-full bg-secondary-container px-4 py-2 text-label-lg font-semibold text-on-secondary-container">Level hiện tại: {viewer.cefrLevel}</span>}
    </div><p className="max-w-3xl text-body-md text-on-surface-variant">{viewer.kind === "GUEST" ? "Khám phá các chủ đề đã xuất bản. Đăng nhập để bắt đầu học và lưu tiến độ." : "Khám phá những chủ đề bạn chưa bắt đầu. Bạn có thể xem mọi chủ đề; để học, level chủ đề cần bằng hoặc thấp hơn level hiện tại của bạn."}</p></div>
    <section aria-label="Tìm kiếm và lọc chủ đề" className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl bg-surface px-4 text-on-surface-variant focus-within:ring-2 focus-within:ring-primary"><Search className="size-5 shrink-0" aria-hidden="true" /><span className="sr-only">Tìm theo tên chủ đề</span>
          <input type="search" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Tìm kiếm theo tên chủ đề…" className="min-w-0 flex-1 bg-transparent py-3 text-body-md text-on-surface outline-none" /></label>
        <label className="flex min-h-12 items-center gap-2 rounded-xl bg-surface px-4 text-label-lg focus-within:ring-2 focus-within:ring-primary"><span>Sắp xếp:</span><select aria-label="Sắp xếp chủ đề" value={filters.sort} onChange={event => change("sort", event.target.value)} className="min-h-12 min-w-0 bg-transparent text-on-surface outline-none"><option value="recommended">Gợi ý</option><option value="duration">Thời lượng ngắn nhất</option></select></label>
        <Button type="button" variant="ghost" disabled={!filtered && !draft} onClick={() => { setDraft(""); setParameters({}); }} className="min-h-12 rounded-xl"><RotateCcw className="size-4" aria-hidden="true" />Đặt lại bộ lọc</Button>
      </div>
      <TopicFilterChips selected={filters.selectedLevel} currentLevel={viewer.cefrLevel} onChange={value => change("level", value)} />
    </section>
    <TopicGrid key={scope} query={{ keyword: filters.keyword, level: filters.level, sort: filters.sort }} origin={location.pathname + location.search} learner={viewer.kind === "LEARNER"} filtered={filtered} />
  </div>;
}
