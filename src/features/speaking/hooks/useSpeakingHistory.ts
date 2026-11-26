import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@shared/hooks";
import { speakingV2Service } from "@features/speaking/services/speaking-v2.service";
import type { SpeakingHistoryGroup, SpeakingHistorySessionSummary, SpeakingHistoryTopic, SpeakingHistoryTotals, SpeakingParentHistoryPage, SpeakingSession } from "@features/speaking/types/speaking-v2.types";
import { parseSpeakingHistoryIntent, speakingHistoryUrl, type SpeakingHistoryIntent } from "@features/speaking/utils/speaking-history-navigation";

interface Loadable<T> { items: T[]; page: number; hasNext: boolean; loading: boolean; error: string }
interface TopicLoadable extends Loadable<SpeakingHistoryTopic> { totals: SpeakingHistoryTotals | null }
interface ParentLoadable extends Loadable<SpeakingHistorySessionSummary> { title: string | null; sessionCount: number }
const emptyLoadable = <T,>(): Loadable<T> => ({ items: [], page: 0, hasNext: false, loading: false, error: "" });
const emptyTopics = (): TopicLoadable => ({ ...emptyLoadable<SpeakingHistoryTopic>(), totals: null });
const emptyParent = (): ParentLoadable => ({ ...emptyLoadable<SpeakingHistorySessionSummary>(), title: null, sessionCount: 0 });
const errorMessage = (cause: unknown, fallback: string) => {
  if (cause instanceof Error && cause.name === "AbortError") return fallback;
  return fallback;
};

function groupTotal(totals: SpeakingHistoryTotals, group: SpeakingHistoryGroup) {
  return group === "IN_PROGRESS" ? totals.inProgress : group === "COMPLETED" ? totals.completed : totals.other;
}
function groupPage(intent: Extract<SpeakingHistoryIntent, { kind: "account" }>, group: SpeakingHistoryGroup) {
  if (intent.group) return intent.topicPage;
  if (group === "IN_PROGRESS") return intent.inProgressPage;
  if (group === "OTHER") return intent.otherPage;
  return intent.completedPage;
}
function withGroupPage(intent: Extract<SpeakingHistoryIntent, { kind: "account" }>, group: SpeakingHistoryGroup, page: number): SpeakingHistoryIntent {
  if (intent.group) return { ...intent, topicPage: page };
  if (group === "IN_PROGRESS") return { ...intent, inProgressPage: page };
  if (group === "OTHER") return { ...intent, otherPage: page };
  return { ...intent, completedPage: page };
}
function searchParamsFor(intent: Exclude<SpeakingHistoryIntent, { kind: "invalid" }>) {
  return new URLSearchParams(speakingHistoryUrl(intent).split("?")[1] ?? "");
}

export function useSpeakingHistory() {
  const [search, setSearch] = useSearchParams();
  const query = search.toString();
  const intent = useMemo(() => parseSpeakingHistoryIntent(new URLSearchParams(query)), [query]);
  const intentRef = useRef(intent);
  intentRef.current = intent;
  const { identityGeneration } = useAuth();
  const [recent, setRecent] = useState<Loadable<SpeakingSession>>(emptyLoadable);
  const [topics, setTopics] = useState<Partial<Record<SpeakingHistoryGroup, TopicLoadable>>>({});
  const [parent, setParent] = useState<ParentLoadable>(emptyParent);
  const [reload, setReload] = useState(0);
  const [dataKey, setDataKey] = useState("");
  const activeKey = `${identityGeneration}:${query}:${reload}`;
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const controllers = useRef(new Map<string, AbortController>());
  const requestIds = useRef(new Map<string, number>());

  const replaceIntent = useCallback((next: SpeakingHistoryIntent, replace = false) => {
    if (next.kind === "invalid") return;
    setSearch(previous => {
      const current = parseSpeakingHistoryIntent(previous);
      const base = intentRef.current;
      if (base.kind === "account" && current.kind === "account" && next.kind === "account") {
        const merged = { ...current };
        const fields = ["tab", "group", "page", "topicPage", "inProgressPage", "otherPage", "completedPage"] as const;
        fields.forEach(field => { if (next[field] !== base[field]) merged[field] = next[field] as never; });
        return searchParamsFor(merged);
      }
      return searchParamsFor(next);
    }, { replace });
  }, [setSearch]);
  const refresh = useCallback(() => setReload(value => value + 1), []);

  const run = useCallback(<T,>(key: string, load: (signal: AbortSignal) => Promise<T>, start: () => void,
    success: (value: T) => void, failure: (error: string) => void, fallback: string) => {
    controllers.current.get(key)?.abort();
    const controller = new AbortController(); controllers.current.set(key, controller);
    const requestId = (requestIds.current.get(key) ?? 0) + 1; requestIds.current.set(key, requestId);
    const contextKey = activeKeyRef.current; start();
    void load(controller.signal).then(value => {
      if (!controller.signal.aborted && requestIds.current.get(key) === requestId && activeKeyRef.current === contextKey) success(value);
    }).catch(cause => {
      if (!controller.signal.aborted && requestIds.current.get(key) === requestId && activeKeyRef.current === contextKey) failure(errorMessage(cause, fallback));
    });
  }, []);

  const loadRecent = useCallback((current: SpeakingHistoryIntent) => {
    if (current.kind !== "account" && current.kind !== "exact") return;
    const scope = current.kind === "exact" ? current.scope : undefined;
    const page = current.page;
    run("recent", signal => speakingV2Service.history(scope, page, 6, signal),
      () => setRecent(value => ({ ...value, loading: true, error: "" })),
      result => {
        setRecent({ ...result, loading: false, error: "" });
        if (!result.items.length && page > 0) replaceIntent({ ...current, page: 0 }, true);
      }, error => setRecent(value => ({ ...value, loading: false, error })), "Không tải được lịch sử Speaking.");
  }, [replaceIntent, run]);

  const loadParent = useCallback((current: SpeakingHistoryIntent) => {
    if (current.kind !== "parent") return;
    run("parent", signal => speakingV2Service.parentHistory(current.topicId, current.page, 20, signal),
      () => setParent(value => ({ ...value, loading: true, error: "" })),
      (result: SpeakingParentHistoryPage) => {
        setParent({ ...result, loading: false, error: "" });
        if (!result.items.length && current.page > 0) replaceIntent({ ...current, page: 0 }, true);
      }, error => setParent(value => ({ ...value, loading: false, error })), "Không tải được lịch sử chủ đề.");
  }, [replaceIntent, run]);

  const loadTopicGroup = useCallback((current: SpeakingHistoryIntent, group: SpeakingHistoryGroup) => {
    if (current.kind !== "account") return;
    const page = groupPage(current, group);
    run(`topic:${group}`, signal => speakingV2Service.historyTopics(group, page, 9, signal),
      () => setTopics(value => ({ ...value, [group]: { ...(value[group] ?? emptyTopics()), loading: true, error: "" } })),
      result => {
        setTopics(value => ({ ...value, [group]: { ...result, loading: false, error: "" } }));
        if (!result.items.length && page > 0) {
          const last = Math.max(0, Math.ceil(groupTotal(result.totals, group) / 9) - 1);
          if (last < page) replaceIntent(withGroupPage(current, group, last), true);
        }
      }, error => setTopics(value => ({ ...value, [group]: { ...(value[group] ?? emptyTopics()), loading: false, error } })), "Không tải được danh sách chủ đề.");
  }, [replaceIntent, run]);

  useEffect(() => {
    const requestControllers = controllers.current;
    setDataKey(activeKey);
    setRecent(emptyLoadable<SpeakingSession>()); setTopics({}); setParent(emptyParent());
    if (intent.kind === "invalid") {
      setRecent({ ...emptyLoadable<SpeakingSession>(), error: "Đường dẫn lịch sử không hợp lệ. Hãy mở lại lịch sử Speaking." });
      return;
    }
    if (intent.kind === "account" || intent.kind === "exact") loadRecent(intent);
    if (intent.kind === "parent") loadParent(intent);
    if (intent.kind === "account") {
      const groups: SpeakingHistoryGroup[] = intent.group ? [intent.group]
        : intent.tab === "COMPLETED" ? ["COMPLETED"] : ["IN_PROGRESS", "OTHER"];
      groups.forEach(group => loadTopicGroup(intent, group));
    }
    return () => { requestControllers.forEach(value => value.abort()); requestControllers.clear(); };
  }, [activeKey, intent, loadParent, loadRecent, loadTopicGroup]);

  const retryRecent = useCallback(() => loadRecent(intent), [intent, loadRecent]);
  const retryParent = useCallback(() => loadParent(intent), [intent, loadParent]);
  const retryTopic = useCallback((group: SpeakingHistoryGroup) => loadTopicGroup(intent, group), [intent, loadTopicGroup]);
  const retry = useCallback((block: "recent" | "parent" | SpeakingHistoryGroup) => {
    if (block === "recent") retryRecent(); else if (block === "parent") retryParent(); else retryTopic(block);
  }, [retryParent, retryRecent, retryTopic]);
  const remove = useCallback(async (sessionId: string) => { await speakingV2Service.remove(sessionId); refresh(); }, [refresh]);
  const removeAll = useCallback(async () => { await speakingV2Service.removeAll(); refresh(); }, [refresh]);
  const groupsToShow: SpeakingHistoryGroup[] = intent.kind !== "account" ? [] : intent.group ? [intent.group]
    : intent.tab === "COMPLETED" ? ["COMPLETED"] : ["IN_PROGRESS", "OTHER"];
  const isCurrent = dataKey === activeKey;
  return { intent, recent, topics, parent, groupsToShow, replaceIntent, refresh, retry, remove, removeAll,
    isCurrent, showLoading: !isCurrent, setSearch };
}
