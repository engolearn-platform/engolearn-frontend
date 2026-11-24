import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { speakingV2Service } from "@features/speaking/services/speaking-v2.service";
import type { SpeakingScope, SpeakingSession } from "@features/speaking/types/speaking-v2.types";

function filterFrom(search: URLSearchParams): SpeakingScope | undefined {
  const type = search.get("scopeType"); const topicId = search.get("topicId"); const topicItemId = search.get("topicItemId");
  if (!topicId || (type !== "TOPIC" && type !== "TOPIC_ITEM") || (type === "TOPIC_ITEM" && !topicItemId)) return undefined;
  return { type, topicId, topicItemId: type === "TOPIC_ITEM" ? topicItemId : null };
}
function statusText(session: SpeakingSession) {
  if (session.assessmentStatus === "PENDING" || session.assessmentStatus === "FINALIZING") return "Đang chờ kết quả";
  if (session.assessmentStatus === "READY") return "Đánh giá đầy đủ";
  if (session.assessmentStatus === "PARTIAL") return "Đánh giá một phần";
  return "Chưa có đánh giá";
}

export default function SpeakingHistoryView() {
  const [search] = useSearchParams(); const scope = useMemo(() => filterFrom(search), [search]);
  const [items, setItems] = useState<SpeakingSession[]>([]); const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async (nextPage = 0) => {
    setLoading(true); setError("");
    try { const result = await speakingV2Service.history(scope, nextPage, 20); setItems(result.items); setPage(result.page); setHasNext(result.hasNext); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không tải được lịch sử Speaking."); }
    finally { setLoading(false); }
  }, [scope]);
  useEffect(() => { void load(); }, [load]);
  async function remove(session: SpeakingSession) {
    if (!window.confirm(`Xóa bản ghi “${session.context.title}” khỏi lịch sử của bạn?`)) return;
    try { await speakingV2Service.remove(session.sessionId); await load(page); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không xóa được bản ghi."); }
  }
  async function removeAll() {
    if (!window.confirm("Xóa toàn bộ lịch sử Speaking của tài khoản này? Thao tác này không thể hoàn tác.")) return;
    try { await speakingV2Service.removeAll(); setItems([]); setHasNext(false); setPage(0); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không xóa được lịch sử."); }
  }
  return <main className="mx-auto grid w-full max-w-4xl gap-5 px-5 py-8 sm:py-12">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-semibold text-primary">SPEAKING</p><h1 className="mt-1 text-headline-lg font-bold">Lịch sử luyện nói</h1>
      <p className="mt-2 text-on-surface-variant">{scope ? `Đang lọc theo ${scope.type === "TOPIC" ? "chủ đề" : "mục học"}.` : "Các phiên của bạn, kể cả với nội dung hiện không còn hiển thị."}</p></div>
      <Button variant="outline" className="min-h-12" disabled={!items.length} onClick={() => void removeAll()}>Xóa toàn bộ lịch sử</Button></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-4"><span>{error}</span><Button variant="outline" className="min-h-12" onClick={() => void load(page)}>Thử lại</Button></div>}
    {loading && <p role="status">Đang tải lịch sử…</p>}
    {!loading && !items.length && !error && <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6"><h2 className="text-headline-md font-semibold">Chưa có phiên nào</h2><p className="mt-2 leading-6 text-on-surface-variant">Khi bạn luyện nói, các phiên sẽ xuất hiện tại đây.</p></section>}
    <section className="grid gap-3" aria-label="Các phiên Speaking">
      {items.map(session => <article key={session.sessionId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
        <div className="min-w-0"><p className="text-sm font-semibold text-primary">{session.context.topicTitle}{session.context.topicItemTitle ? ` · ${session.context.topicItemTitle}` : ""}</p>
          <h2 className="mt-1 break-words text-lg font-semibold">{session.context.title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{new Date(session.createdAt).toLocaleString("vi-VN")} · {session.committedTurnCount} lượt · {statusText(session)}</p>
        </div>
        <div className="flex gap-2"><Button asChild variant="outline" className="min-h-12"><Link to={`/speaking/sessions/${encodeURIComponent(session.sessionId)}/result`}>Xem phiên</Link></Button>
          <Button variant="outline" className="min-h-12" onClick={() => void remove(session)}>Xóa</Button></div>
      </article>)}
    </section>
    <nav aria-label="Trang lịch sử" className="flex items-center gap-3"><Button variant="outline" className="min-h-12" disabled={page === 0 || loading} onClick={() => void load(page - 1)}>Trước</Button>
      <span>Trang {page + 1}</span><Button variant="outline" className="min-h-12" disabled={!hasNext || loading} onClick={() => void load(page + 1)}>Tiếp</Button></nav>
  </main>;
}
