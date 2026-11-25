import type { SpeakingScope } from "@features/speaking/types/speaking-v2.types";

export const SPEAKING_HISTORY_PATH = "/speaking/history";
export type SpeakingHistoryTab = "IN_PROGRESS" | "COMPLETED";
export type SpeakingHistoryGroup = "IN_PROGRESS" | "COMPLETED" | "OTHER";
export type SpeakingHistoryIntent =
  | { kind: "account"; tab: SpeakingHistoryTab; group: SpeakingHistoryGroup | null; page: number; topicPage: number; inProgressPage: number; otherPage: number; completedPage: number }
  | { kind: "parent"; topicId: string; page: number; origin: string | null }
  | { kind: "exact"; scope: SpeakingScope; page: number; origin: string | null }
  | { kind: "invalid" };

function one(search: URLSearchParams, key: string): string | null | undefined {
  const values = search.getAll(key);
  return values.length > 1 ? undefined : values[0] ?? null;
}
function pageValue(value: string | null | undefined): number | null {
  if (value === undefined) return null;
  if (value === null) return 0;
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 1_000_000 ? page : null;
}
function isAccountOrExactOrigin(value: string, origin: string): boolean {
  try {
    const target = new URL(value, origin);
    if (target.origin !== new URL(origin).origin || target.pathname !== SPEAKING_HISTORY_PATH) return false;
    if (target.searchParams.has("from") || target.searchParams.has("parentTopicId") || target.searchParams.has("parentPage")) return false;
    const intent = parseSpeakingHistoryIntent(target.searchParams);
    return intent.kind === "account" || intent.kind === "exact";
  } catch { return false; }
}
export function speakingEntryPath(scope: SpeakingScope) {
  return scope.type === "TOPIC_ITEM"
    ? `/topics/${encodeURIComponent(scope.topicId)}/items/${encodeURIComponent(scope.topicItemId ?? "")}/speaking`
    : `/topics/${encodeURIComponent(scope.topicId)}/speaking`;
}
function isExactWorkspaceOrigin(value: string, scope: SpeakingScope, origin: string) {
  try {
    const target = new URL(value, origin);
    return target.origin === new URL(origin).origin && target.pathname === speakingEntryPath(scope) && !target.search && !target.hash;
  } catch { return false; }
}

export function parseSpeakingHistoryIntent(search: URLSearchParams): SpeakingHistoryIntent {
  const allowed = ["tab", "group", "page", "topicPage", "inProgressPage", "otherPage", "completedPage", "scopeType", "topicId", "topicItemId", "parentTopicId", "parentPage", "from"];
  if ([...search.keys()].some(key => !allowed.includes(key))) return { kind: "invalid" };
  const values = Object.fromEntries(allowed.map(key => [key, one(search, key)])) as Record<string, string | null | undefined>;
  if (Object.values(values).some(value => value === undefined)) return { kind: "invalid" };
  const page = pageValue(values.page);
  const parentPage = pageValue(values.parentPage);
  if (page === null || parentPage === null) return { kind: "invalid" };

  if (values.parentTopicId !== null) {
    const extraKeys = ["tab", "group", "page", "topicPage", "inProgressPage", "otherPage", "completedPage", "scopeType", "topicId", "topicItemId"];
    if (!values.parentTopicId || extraKeys.some(key => values[key] !== null) || (values.from !== null && !isAccountOrExactOrigin(values.from!, window.location.origin))) return { kind: "invalid" };
    return { kind: "parent", topicId: values.parentTopicId, page: parentPage, origin: values.from ?? null };
  }
  if (values.parentPage !== null) return { kind: "invalid" };

  if (values.scopeType !== null) {
    const extraKeys = ["tab", "group", "topicPage", "inProgressPage", "otherPage", "completedPage"];
    if (extraKeys.some(key => values[key] !== null) || values.parentPage !== null || values.parentTopicId !== null || !values.topicId || (values.scopeType !== "TOPIC" && values.scopeType !== "TOPIC_ITEM")) return { kind: "invalid" };
    if (values.scopeType === "TOPIC" && values.topicItemId !== null) return { kind: "invalid" };
    if (values.scopeType === "TOPIC_ITEM" && !values.topicItemId) return { kind: "invalid" };
    const scope: SpeakingScope = { type: values.scopeType, topicId: values.topicId, topicItemId: values.scopeType === "TOPIC_ITEM" ? values.topicItemId! : null };
    if (values.from !== null && !isExactWorkspaceOrigin(values.from!, scope, window.location.origin)) return { kind: "invalid" };
    return { kind: "exact", scope, page, origin: values.from ?? null };
  }
  if (values.topicId !== null || values.topicItemId !== null || values.from !== null || values.parentPage !== null || values.parentTopicId !== null) return { kind: "invalid" };

  const tab = values.tab ?? "IN_PROGRESS";
  if (tab !== "IN_PROGRESS" && tab !== "COMPLETED") return { kind: "invalid" };
  const group = values.group === null ? null : values.group;
  if (group !== null && group !== "IN_PROGRESS" && group !== "COMPLETED" && group !== "OTHER") return { kind: "invalid" };
  if ((tab === "COMPLETED" && group !== null && group !== "COMPLETED") || (tab === "IN_PROGRESS" && group === "COMPLETED")) return { kind: "invalid" };
  const topicPage = pageValue(values.topicPage);
  const inProgressPage = pageValue(values.inProgressPage);
  const otherPage = pageValue(values.otherPage);
  const completedPage = pageValue(values.completedPage);
  if (topicPage === null || inProgressPage === null || otherPage === null || completedPage === null) return { kind: "invalid" };
  return { kind: "account", tab, group, page, topicPage, inProgressPage, otherPage, completedPage };
}

export function speakingHistoryUrl(intent: Exclude<SpeakingHistoryIntent, { kind: "invalid" }>): string {
  const params = new URLSearchParams();
  if (intent.kind === "account") {
    if (intent.tab !== "IN_PROGRESS") params.set("tab", intent.tab);
    if (intent.group) params.set("group", intent.group);
    if (intent.page) params.set("page", String(intent.page));
    if (intent.topicPage) params.set("topicPage", String(intent.topicPage));
    if (intent.inProgressPage) params.set("inProgressPage", String(intent.inProgressPage));
    if (intent.otherPage) params.set("otherPage", String(intent.otherPage));
    if (intent.completedPage) params.set("completedPage", String(intent.completedPage));
  } else if (intent.kind === "parent") {
    params.set("parentTopicId", intent.topicId);
    if (intent.page) params.set("parentPage", String(intent.page));
    if (intent.origin) params.set("from", intent.origin);
  } else {
    params.set("scopeType", intent.scope.type);
    params.set("topicId", intent.scope.topicId);
    if (intent.scope.type === "TOPIC_ITEM" && intent.scope.topicItemId) params.set("topicItemId", intent.scope.topicItemId);
    if (intent.page) params.set("page", String(intent.page));
    if (intent.origin) params.set("from", intent.origin);
  }
  const query = params.toString();
  return `${SPEAKING_HISTORY_PATH}${query ? `?${query}` : ""}`;
}

export function sanitizeSpeakingHistoryOrigin(value: string | null | undefined, origin = window.location.origin): string | null {
  if (!value || value.includes("\\") || [...value].some(character => character.charCodeAt(0) < 32)) return null;
  try {
    const target = new URL(value, origin);
    if (target.origin !== new URL(origin).origin || target.pathname !== SPEAKING_HISTORY_PATH || target.hash) return null;
    const intent = parseSpeakingHistoryIntent(target.searchParams);
    if (intent.kind === "invalid") return null;
    return speakingHistoryUrl(intent);
  } catch { return null; }
}

export function speakingResultUrl(sessionId: string, origin: string | null | undefined): string {
  const path = `/speaking/sessions/${encodeURIComponent(sessionId)}/result`;
  const safeOrigin = sanitizeSpeakingHistoryOrigin(origin);
  if (!safeOrigin) return path;
  return `${path}?from=${encodeURIComponent(safeOrigin)}`;
}
