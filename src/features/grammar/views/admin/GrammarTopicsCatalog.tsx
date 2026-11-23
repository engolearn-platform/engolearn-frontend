import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router";
import { useFetch } from "@shared/hooks";
import { cn } from "@shared/utils";
import {
  EntryActions, EntryButton as Button, EntryConfirmation, EntryError, EntryHeader, EntryStatus, EntryTable, EntryTextInput,
  entryActionItem, grammarEntryPage,
} from "@features/grammar/components/admin/GrammarEntryUi";
import { grammarEntryCard, statusLabels } from "@features/grammar/constants/admin-entry";
import { grammarPaths } from "@features/grammar/constants/admin-paths";
import { grammarEntryError } from "@features/grammar/hooks/useGrammarEntryForm";
import { grammarAdmin } from "@features/grammar/services/grammar-admin.service";
import type { GrammarLevel, GrammarTopic, GrammarTopicsQuery } from "@features/grammar/types/grammar-admin.types";

const statuses = [
  { value: "ALL", label: "Tất cả", statsKey: "total" },
  { value: "PUBLISHED", label: "Đã xuất bản", statsKey: "published" },
  { value: "IN_PROGRESS", label: "Đang hoàn thiện", statsKey: "inProgress" },
  { value: "DRAFT", label: "Nháp", statsKey: "draft" },
  { value: "ARCHIVED", label: "Lưu trữ", statsKey: "archived" },
] as const;

const levels = [
  { value: "A1", label: "A1 - Sơ cấp" },
  { value: "A2", label: "A2 - Cơ bản" },
  { value: "B1", label: "B1 - Trung cấp" },
  { value: "B2", label: "B2 - Trung cao" },
] satisfies { value: GrammarLevel; label: string }[];

const topicActions = {
  delete: { label: "Xóa chủ đề", description: "Chủ đề và toàn bộ bài học trong chủ đề sẽ bị xóa vĩnh viễn." },
  archive: { label: "Ngừng xuất bản", description: "Chủ đề và các bài học sẽ được lưu trữ và ẩn khỏi lộ trình của học viên. Tiến độ đã ghi nhận được giữ lại." },
  restore: { label: "Khôi phục về bản nháp", description: "Chủ đề và các bài học được lưu trữ cùng chủ đề sẽ trở về bản nháp và cần được xuất bản lại." },
};

type TopicAction = keyof typeof topicActions;

function csvCell(value: number | string | null) {
  const raw = String(value ?? "");
  const escaped = typeof value === "string" && /^[\t\r\n ]*[=+\-@]|^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${escaped.replace(/"/g, '""')}"`;
}

function downloadTopics(topics: GrammarTopic[]) {
  const rows = [
    ["Mã chủ đề", "Tên tiếng Việt", "Tên tiếng Anh", "Trình độ", "Thứ tự", "Bài sẵn sàng", "Tổng số bài", "Trạng thái", "Cập nhật"],
    ...topics.map((topic) => [topic.code, topic.titleVi, topic.titleEn, topic.level, topic.order, topic.readyCount, topic.lessonCount, statusLabels[topic.status], topic.updatedAt]),
  ];
  const blob = new Blob(["\uFEFF", rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chu-de-ngu-phap.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

const updatedFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
const relativeTime = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });
const selectClass = "min-h-10 rounded-lg border border-outline bg-surface-container-lowest px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary";

function displayUpdatedAt(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return relativeTime.format(-minutes, "minute");
  if (minutes < 1_440) return relativeTime.format(-Math.floor(minutes / 60), "hour");
  if (minutes < 10_080) return relativeTime.format(-Math.floor(minutes / 1_440), "day");
  return updatedFormatter.format(date);
}

export function GrammarTopicListView() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<GrammarLevel | "ALL">("ALL");
  const [status, setStatus] = useState<(typeof statuses)[number]["value"]>("ALL");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(6);
  const [confirmation, setConfirmation] = useState<{ topic: GrammarTopic; action: TopicAction }>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [actionStale, setActionStale] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [exporting, setExporting] = useState(false);
  const query = useMemo<GrammarTopicsQuery>(() => ({
    search: search.trim(),
    ...(level === "ALL" ? {} : { level }),
    ...(status === "ALL" ? {} : { status }),
    page: page - 1,
    size,
  }), [search, level, status, page, size]);
  const fetchTopics = useCallback((signal: AbortSignal) => grammarAdmin.listTopics(query, signal), [query]);
  const { data, loading, error: fetchError, refetch } = useFetch(fetchTopics);

  async function handleExport() {
    setExporting(true);
    setError(undefined);
    const items: GrammarTopic[] = [];
    try {
      const first = await grammarAdmin.listTopics({ ...query, page: 0, size: 50 });
      items.push(...first.items);
      const pageCount = Math.ceil(first.total / 50);
      for (let index = 1; index < pageCount; index++) {
        const next = await grammarAdmin.listTopics({ ...query, page: index, size: 50 });
        items.push(...next.items);
      }
      downloadTopics(items);
    } catch (cause) {
      setError(grammarEntryError(cause, "Không thể xuất dữ liệu. Vui lòng thử lại.").message);
    } finally {
      setExporting(false);
    }
  }

  async function confirmAction() {
    if (!confirmation || pending) return;
    const { action, topic } = confirmation;
    setPending(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (action === "delete") await grammarAdmin.deleteTopic(topic.id, topic.version);
      else await grammarAdmin.topicAction(topic.id, action, topic.version);
      setConfirmation(undefined);
      setNotice(action === "delete" ? "Đã xóa chủ đề." : action === "archive" ? "Đã ngừng xuất bản chủ đề." : "Đã khôi phục chủ đề về bản nháp.");
      if (page > 1 && data?.items.length === 1 && (action === "delete" || status !== "ALL")) setPage(page - 1);
      else refetch();
    } catch (cause) {
      const failure = grammarEntryError(cause, "Không thể cập nhật chủ đề.");
      setError(failure.conflict ? "Dữ liệu vừa được thay đổi. Đóng hộp thoại và chọn lại thao tác." : failure.message);
      setActionStale(failure.conflict);
      if (failure.conflict) refetch();
    } finally {
      setPending(false);
    }
  }

  function requestAction(topic: GrammarTopic, action: TopicAction) {
    setError(undefined);
    setNotice(undefined);
    setActionStale(false);
    setConfirmation({ topic, action });
  }

  return (
    <div className={cn(grammarEntryPage, "pb-8")}>
      <EntryHeader title="Chủ đề ngữ pháp" description="Quản lý các chủ đề và bài học trong lộ trình Ngữ pháp." actions={
        <>
          <Button type="button" variant="outline" disabled={loading || exporting || !data?.total} onClick={() => void handleExport()}>
            {exporting ? "Đang xuất…" : "Xuất dữ liệu"}
          </Button>
          <Button asChild><Link to={grammarPaths.topicNew}><Plus aria-hidden="true" /> Tạo chủ đề</Link></Button>
        </>
      } />
      <div className="mb-3.5 flex flex-wrap gap-2" role="group" aria-label="Lọc trạng thái chủ đề">
        {statuses.map((item) => (
          <Button key={item.value} type="button" size="sm" variant="outline" aria-pressed={status === item.value}
            className={cn("rounded-full border-outline-variant px-3.5", status === item.value && "border-on-surface bg-on-surface text-surface hover:bg-on-surface hover:text-surface")}
            onClick={() => { setStatus(item.value); setPage(1); }}>
            {item.label}{data ? <span className="tabular-nums">{data.stats[item.statsKey]}</span> : null}
          </Button>
        ))}
      </div>
      <div className="mb-3.5 flex flex-wrap items-stretch gap-2.5">
        <label className="basis-full sm:min-w-40 sm:basis-auto sm:flex-1">
          <span className="sr-only">Tìm theo tên hoặc mã chủ đề</span>
          <EntryTextInput type="search" value={search} maxLength={160} placeholder="Tìm theo tên hoặc mã chủ đề"
            onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        </label>
        <select aria-label="Lọc theo trình độ CEFR" value={level} className={cn(selectClass, "lg:w-44")}
          onChange={(event) => { setLevel(event.target.value as GrammarLevel | "ALL"); setPage(1); }}>
          <option value="ALL">Mọi trình độ</option>
          {levels.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Button type="button" variant="outline" className="h-auto" onClick={() => { setSearch(""); setLevel("ALL"); setStatus("ALL"); setPage(1); }}>Xóa bộ lọc</Button>
      </div>
      {notice ? <p className="mb-3 text-sm font-semibold text-primary" role="status">{notice}</p> : null}
      {error && !confirmation ? <div className="mb-3"><EntryError message={error} /></div> : null}
      {loading ? <p role="status" className={cn(grammarEntryCard, "p-8 text-center text-sm")}>Đang tải chủ đề…</p> : null}
      {fetchError ? <EntryError message={fetchError.message} onRetry={refetch} /> : null}
      {data && !loading && (
        <>
          {data.items.length ? (
            <EntryTable label="Bảng chủ đề" headings={["Chủ đề", "Trình độ", "Bài học", "Trạng thái", "Cập nhật", "Thao tác"]}>
              {data.items.map((topic) => (
                <tr key={topic.id}>
                  <td className="w-1/3 min-w-56 max-w-sm">
                    <Link className="font-semibold hover:underline" to={grammarPaths.topic(topic.id)}>{topic.titleVi}</Link>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      <span lang="en">{topic.titleEn}</span> · {topic.code}{topic.order != null && <> · Vị trí {topic.order}</>}
                    </p>
                  </td>
                  <td><span className="rounded-full border border-outline px-2.5 py-0.5 text-xs font-semibold">{topic.level}</span></td>
                  <td>
                    <p className="whitespace-nowrap">{topic.readyCount}/{topic.lessonCount} bài sẵn sàng</p>
                    <progress aria-label={`Bài học sẵn sàng cho ${topic.titleVi}`} className="mt-1 block h-2 w-24 overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-surface-container-high [&::-webkit-progress-value]:bg-primary-container [&::-moz-progress-bar]:bg-primary-container" value={topic.readyCount} max={topic.lessonCount || 1} />
                  </td>
                  <td><EntryStatus status={topic.status} /></td>
                  <td className="whitespace-nowrap text-xs text-on-surface-variant">
                    {topic.updatedAt ? <time dateTime={topic.updatedAt} title={updatedFormatter.format(new Date(topic.updatedAt))}>{displayUpdatedAt(new Date(topic.updatedAt))}</time> : "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline"><Link to={grammarPaths.topic(topic.id)} aria-label={`${topic.status === "ARCHIVED" ? "Xem" : "Sửa"} chủ đề ${topic.titleVi}`}>{topic.status === "ARCHIVED" ? "Xem" : "Sửa"}</Link></Button>
                      <EntryActions label={`Thao tác cho ${topic.titleVi}`}>
                        <Link className={entryActionItem} to={grammarPaths.lessons(topic.id)}>Danh sách bài học</Link>
                        <Link className={entryActionItem} to={grammarPaths.topicPublish(topic.id)}>Kiểm tra và xuất bản</Link>
                        {topic.status === "PUBLISHED" ? <button className={entryActionItem} type="button" onClick={() => requestAction(topic, "archive")}>Ngừng xuất bản</button> : null}
                        {topic.status === "ARCHIVED" ? <button className={entryActionItem} type="button" onClick={() => requestAction(topic, "restore")}>Khôi phục về bản nháp</button> : null}
                        {!(topic.firstPublishedAt || topic.status === "ARCHIVED" || topic.status === "PUBLISHED") ?
                          <button className={cn(entryActionItem, "text-error")} type="button" onClick={() => requestAction(topic, "delete")}>Xóa chủ đề</button> : null}
                      </EntryActions>
                    </div>
                  </td>
                </tr>
              ))}
            </EntryTable>
          ) : (
            <section className={cn(grammarEntryCard, "py-10 px-5 text-center")}>
              <h2 className="font-bold">{search || level !== "ALL" || status !== "ALL" ? "Không tìm thấy chủ đề phù hợp" : "Chưa có chủ đề ngữ pháp"}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{search || level !== "ALL" || status !== "ALL" ? "Thử đổi từ khóa hoặc xóa bộ lọc." : "Tạo chủ đề để bắt đầu thêm bài học."}</p>
            </section>
          )}
          {data.total > 0 && (
            <nav aria-label="Phân trang chủ đề" className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-on-surface-variant">
              <p>Hiển thị {data.items.length ? (page - 1) * size + 1 : 0}–{Math.min(page * size, data.total)} trên {data.total} chủ đề · Trang {page} / {Math.ceil(data.total / size)}</p>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Số dòng mỗi trang" value={size} className={selectClass}
                  onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }}>
                  {[6, 10, 20, 50].map((count) => <option key={count} value={count}>{count} dòng / trang</option>)}
                </select>
                <Button aria-label="Trang trước" variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button aria-label="Trang sau" variant="outline" size="icon" disabled={page * size >= data.total} onClick={() => setPage(page + 1)}>
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
      {confirmation ? (
        <EntryConfirmation
          title={`${topicActions[confirmation.action].label} “${confirmation.topic.titleVi}”?`}
          description={topicActions[confirmation.action].description}
          confirmLabel={topicActions[confirmation.action].label}
          destructive={confirmation.action === "delete"}
          pending={pending}
          retryDisabled={actionStale}
          error={error}
          onClose={() => { setConfirmation(undefined); setError(undefined); }}
          onConfirm={() => void confirmAction()}
        />
      ) : null}
    </div>
  );
}
