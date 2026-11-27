import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { SpeakingHistorySessionRow } from "@features/speaking/components/history/SpeakingHistorySessionRow";
import { SpeakingHistoryTopicCard } from "@features/speaking/components/history/SpeakingHistoryTopicCard";
import SpeakingQuotaCard from "@features/speaking/components/SpeakingQuotaCard";
import { useSpeakingHistory } from "@features/speaking/hooks/useSpeakingHistory";
import type { SpeakingHistoryGroup, SpeakingHistorySessionSummary, SpeakingHistoryTopic, SpeakingSession } from "@features/speaking/types/speaking-v2.types";
import { sanitizeSpeakingHistoryOrigin, speakingEntryPath, speakingHistoryUrl, type SpeakingHistoryIntent } from "@features/speaking/utils/speaking-history-navigation";

const groupNames: Record<SpeakingHistoryGroup, string> = { IN_PROGRESS: "Đang học", COMPLETED: "Hoàn thành", OTHER: "Khác" };

function accountIntent(tab: "IN_PROGRESS" | "COMPLETED"): Extract<SpeakingHistoryIntent, { kind: "account" }> {
  return { kind: "account", tab, group: null, page: 0, topicPage: 0, inProgressPage: 0, otherPage: 0, completedPage: 0 };
}
function groupPage(intent: Extract<SpeakingHistoryIntent, { kind: "account" }>, group: SpeakingHistoryGroup) {
  if (intent.group) return intent.topicPage;
  return group === "IN_PROGRESS" ? intent.inProgressPage : group === "OTHER" ? intent.otherPage : intent.completedPage;
}
function setGroupPage(intent: Extract<SpeakingHistoryIntent, { kind: "account" }>, group: SpeakingHistoryGroup, page: number): SpeakingHistoryIntent {
  if (intent.group) return { ...intent, topicPage: page };
  if (group === "IN_PROGRESS") return { ...intent, inProgressPage: page };
  if (group === "OTHER") return { ...intent, otherPage: page };
  return { ...intent, completedPage: page };
}
function blockError(message: string, retry: () => void) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-4 text-on-surface">
    <span>{message}</span><Button variant="outline" className="min-h-12" onClick={retry}>Thử lại</Button>
  </div>;
}
function blockState<T>(items: T[], loading: boolean, error: string, retry: () => void, emptyText: string) {
  if (error) return blockError(error, retry);
  if (loading) return <p role="status" className="text-on-surface-variant">Đang tải…</p>;
  if (!items.length) return <p className="rounded-xl border border-outline-variant p-4 text-on-surface-variant">{emptyText}</p>;
  return null;
}

export default function SpeakingHistoryView() {
  const location = useLocation();
  const history = useSpeakingHistory();
  const { intent, recent, topics, parent, groupsToShow, isCurrent, showLoading, replaceIntent, retry, remove, removeAll } = history;
  const account = intent.kind === "account" ? intent : null;
  const [deleteTarget, setDeleteTarget] = useState<SpeakingSession | SpeakingHistorySessionSummary | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const historyOrigin = sanitizeSpeakingHistoryOrigin(`${location.pathname}${location.search}`) ?? "/speaking/history";
  const isAccount = account !== null;
  const displayRecent = isCurrent ? recent : { ...recent, items: [], loading: showLoading, error: "" };
  const displayParent = isCurrent ? parent : { ...parent, items: [], loading: showLoading, error: "" };
  const displayTopics = isCurrent ? topics : {};
  const totals = displayTopics.IN_PROGRESS?.totals ?? displayTopics.OTHER?.totals ?? displayTopics.COMPLETED?.totals;
  const inProgressCount = totals?.inProgress;
  const completedCount = totals?.completed;
  const hasAnyHistory = (totals ? totals.inProgress + totals.completed + totals.other > 0 : false) || displayRecent.items.length > 0;
  const canDeleteAll = account ? hasAnyHistory : intent.kind === "parent" ? displayParent.sessionCount > 0
    : intent.kind === "exact" ? displayRecent.items.length > 0 : false;

  async function confirmDelete() {
    if (!deleteTarget) return;
    try { setMutationError(""); await remove(deleteTarget.sessionId); setDeleteTarget(null); }
    catch (cause) { setMutationError(cause instanceof Error ? "Không xóa được phiên. Vui lòng thử lại." : "Không xóa được phiên. Vui lòng thử lại."); }
  }
  async function confirmRemoveAll() {
    try { setMutationError(""); await removeAll(); setConfirmDeleteAll(false); }
    catch { setMutationError("Không xóa được lịch sử. Vui lòng thử lại."); }
  }

  return <div className="mx-auto grid w-full max-w-6xl gap-7 px-5 py-8 sm:py-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0"><p className="text-label-md font-semibold text-primary">SPEAKING</p>
        <h1 className="mt-1 break-words text-headline-lg font-bold">Lịch sử luyện nói</h1>
        <p className="mt-2 leading-6 text-on-surface-variant">Các phiên của bạn, kể cả với nội dung hiện không còn hiển thị.</p></div>
      {intent.kind !== "invalid" && <Button variant="outline" className="min-h-12" disabled={!canDeleteAll} onClick={() => setConfirmDeleteAll(true)}>Xóa toàn bộ lịch sử</Button>}
    </header>

    {mutationError && blockError(mutationError, () => setMutationError(""))}
    {intent.kind === "invalid" && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4">Đường dẫn lịch sử không hợp lệ. Hãy mở lại lịch sử Speaking.</div>}

    {isAccount && <SpeakingQuotaCard />}

    {isAccount && <>
      <nav aria-label="Nhóm lịch sử" className="flex gap-6 border-b border-outline-variant">
        <Link className={`min-h-12 border-b-2 px-1 py-3 font-semibold ${account?.tab === "IN_PROGRESS" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`} to={speakingHistoryUrl(accountIntent("IN_PROGRESS"))} aria-current={account?.tab === "IN_PROGRESS" ? "page" : undefined}>
          Đang học{inProgressCount !== undefined ? ` (${inProgressCount})` : ""}</Link>
        <Link className={`min-h-12 border-b-2 px-1 py-3 font-semibold ${account?.tab === "COMPLETED" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`} to={speakingHistoryUrl(accountIntent("COMPLETED"))} aria-current={account?.tab === "COMPLETED" ? "page" : undefined}>
          Hoàn thành{completedCount !== undefined ? ` (${completedCount})` : ""}</Link>
      </nav>

      {account?.tab === "IN_PROGRESS" && !account.group && <section aria-labelledby="recent-title" className="grid gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3"><div>
          <h2 id="recent-title" className="text-headline-md font-semibold">Phiên luyện nói gần đây</h2>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">Tất cả trạng thái và loại phiên, theo thời gian gần nhất.</p>
        </div></header>
        {blockState(displayRecent.items, displayRecent.loading, displayRecent.error, () => retry("recent"), "Chưa có phiên luyện nói nào.")}
        <div className="grid gap-3">{displayRecent.items.map(session => <SpeakingHistorySessionRow key={session.sessionId} session={session} historyOrigin={historyOrigin} onDelete={item => setDeleteTarget(item as SpeakingSession)} />)}</div>
        {(displayRecent.page > 0 || displayRecent.hasNext) && <nav aria-label="Trang phiên gần đây" className="flex items-center gap-3">
          <Button variant="outline" className="min-h-12" disabled={displayRecent.page === 0 || displayRecent.loading} onClick={() => account && replaceIntent({ ...account, page: account.page - 1 })}>Trước</Button>
          <span>Trang {displayRecent.page + 1}</span>
          <Button variant="outline" className="min-h-12" disabled={!displayRecent.hasNext || displayRecent.loading} onClick={() => account && replaceIntent({ ...account, page: account.page + 1 })}>Tiếp</Button>
        </nav>}
      </section>}

      {groupsToShow.map(group => {
        const data = displayTopics[group] ?? { items: [], page: 0, hasNext: false, loading: isCurrent, error: "", totals: null };
        const page = account ? groupPage(account, group) : 0;
        const total = data.totals ? group === "IN_PROGRESS" ? data.totals.inProgress : group === "COMPLETED" ? data.totals.completed : data.totals.other : null;
        if (group === "OTHER" && total === 0 && !data.items.length && !data.error && !data.loading) return null;
        return <section key={group} aria-labelledby={`topic-group-${group}`} className="grid gap-4">
          <header className="flex flex-wrap items-end justify-between gap-3"><div>
            <h2 id={`topic-group-${group}`} className="text-headline-md font-semibold">{group === "IN_PROGRESS" ? "Chủ đề đang học" : group === "OTHER" ? "Lịch sử khác" : groupNames[group]}{total !== null ? ` · ${total}` : ""}</h2>
            {account && !account.group && account.tab === "IN_PROGRESS" && group === "OTHER" && <p className="mt-1 text-sm leading-6 text-on-surface-variant">Chủ đề chưa bắt đầu hoặc chưa xác định trạng thái hiện tại.</p>}
          </div>
          {account && !account.group && <Button asChild variant="outline" className="min-h-12"><Link to={speakingHistoryUrl({ ...account, group, topicPage: 0 })}>Xem tất cả</Link></Button>}
          </header>
          {blockState(data.items, data.loading, data.error, () => retry(group), "Chưa có chủ đề nào trong nhóm này.")}
          {!!data.items.length && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((topic: SpeakingHistoryTopic) => <SpeakingHistoryTopicCard key={topic.topicId} topic={topic} origin={historyOrigin} />)}
          </div>}
          {total !== null && total > 9 && <nav aria-label={`Trang chủ đề ${groupNames[group]}`} className="flex items-center gap-3">
            <Button variant="outline" className="min-h-12" disabled={page === 0 || data.loading} onClick={() => account && replaceIntent(setGroupPage(account, group, page - 1))}>Trước</Button>
            <span>Trang {page + 1}</span>
            <Button variant="outline" className="min-h-12" disabled={(page + 1) * 9 >= total || data.loading} onClick={() => account && replaceIntent(setGroupPage(account, group, page + 1))}>Tiếp</Button>
          </nav>}
        </section>;
      })}

    </>}

    {intent.kind === "parent" && <section aria-labelledby="parent-history-title" className="grid gap-4">
      <div><p className="text-sm font-semibold text-primary">LỊCH SỬ CHỦ ĐỀ</p>
        <h2 id="parent-history-title" className="mt-1 break-words text-headline-md font-semibold">{displayParent.title ?? (displayParent.loading ? "Đang tải chủ đề…" : "Lịch sử chủ đề")}</h2>
        {!displayParent.loading && <p className="mt-1 text-sm text-on-surface-variant">{displayParent.sessionCount} phiên thuộc chủ đề này.</p>}</div>
      {intent.origin && <Button asChild variant="outline" className="min-h-12 w-fit"><Link to={intent.origin}>Quay lại lịch sử tài khoản</Link></Button>}
      {!intent.origin && <Button asChild variant="outline" className="min-h-12 w-fit"><Link to={speakingHistoryUrl(accountIntent("IN_PROGRESS"))}>Quay lại lịch sử tài khoản</Link></Button>}
      {blockState(displayParent.items, displayParent.loading, displayParent.error, () => retry("parent"), "Chưa có phiên Speaking trong chủ đề này.")}
      <div className="grid gap-3">{displayParent.items.map(item => <SpeakingHistorySessionRow key={item.sessionId} session={item} historyOrigin={historyOrigin} onDelete={setDeleteTarget} />)}</div>
      {(displayParent.page > 0 || displayParent.hasNext) && <nav aria-label="Trang lịch sử chủ đề" className="flex items-center gap-3">
        <Button variant="outline" className="min-h-12" disabled={displayParent.page === 0 || displayParent.loading} onClick={() => replaceIntent({ ...intent, page: intent.page - 1 })}>Trước</Button>
        <span>Trang {displayParent.page + 1}</span>
        <Button variant="outline" className="min-h-12" disabled={!displayParent.hasNext || displayParent.loading} onClick={() => replaceIntent({ ...intent, page: intent.page + 1 })}>Tiếp</Button>
      </nav>}
    </section>}

    {intent.kind === "exact" && <section aria-labelledby="exact-history-title" className="grid gap-4">
      <header><p className="text-sm font-semibold text-primary">LỊCH SỬ CHÍNH XÁC</p>
        <h2 id="exact-history-title" className="mt-1 text-headline-md font-semibold">{intent.scope.type === "TOPIC_ITEM" ? "Phiên trong mục học" : "Phiên theo chủ đề"}</h2></header>
      <Button asChild variant="outline" className="min-h-12 w-fit"><Link to={intent.origin ?? speakingEntryPath(intent.scope)}>{intent.scope.type === "TOPIC_ITEM" ? "Quay lại luyện nói theo mục học" : "Quay lại luyện nói theo chủ đề"}</Link></Button>
      {blockState(displayRecent.items, displayRecent.loading, displayRecent.error, () => retry("recent"), "Chưa có phiên luyện nói nào.")}
      <div className="grid gap-3">{displayRecent.items.map(session => <SpeakingHistorySessionRow key={session.sessionId} session={session} historyOrigin={historyOrigin} onDelete={setDeleteTarget} />)}</div>
      {(displayRecent.page > 0 || displayRecent.hasNext) && <nav aria-label="Trang lịch sử chính xác" className="flex items-center gap-3">
        <Button variant="outline" className="min-h-12" disabled={displayRecent.page === 0 || displayRecent.loading} onClick={() => replaceIntent({ ...intent, page: intent.page - 1 })}>Trước</Button>
        <span>Trang {displayRecent.page + 1}</span>
        <Button variant="outline" className="min-h-12" disabled={!displayRecent.hasNext || displayRecent.loading} onClick={() => replaceIntent({ ...intent, page: intent.page + 1 })}>Tiếp</Button>
      </nav>}
    </section>}

    <Dialog open={deleteTarget !== null || confirmDeleteAll} onOpenChange={open => { if (!open) { setDeleteTarget(null); setConfirmDeleteAll(false); } }}>
      <DialogContent><DialogHeader><DialogTitle>{confirmDeleteAll ? "Xóa toàn bộ lịch sử?" : "Xóa phiên Speaking?"}</DialogTitle>
        <DialogDescription>{confirmDeleteAll ? "Các phiên sẽ biến mất khỏi lịch sử tài khoản. Tiến độ học của bạn không thay đổi." : `Phiên “${deleteTarget?.context.title ?? "này"}” sẽ bị xóa khỏi lịch sử của bạn.`}</DialogDescription></DialogHeader>
        <DialogFooter className="flex-col sm:flex-row"><Button className="min-h-12" onClick={() => void (confirmDeleteAll ? confirmRemoveAll() : confirmDelete())}>{confirmDeleteAll ? "Xóa toàn bộ" : "Xóa phiên"}</Button>
          <Button variant="outline" className="min-h-12" onClick={() => { setDeleteTarget(null); setConfirmDeleteAll(false); }}>Hủy</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
