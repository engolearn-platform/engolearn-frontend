interface JournalOptions<T> {
  scope: string;
  run: (idempotencyKey: string) => Promise<T>;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  newKey?: () => string;
  identity?: TopicMutationIdentity;
}

export interface TopicMutationIdentity { learnerId: string | null; topicId: string; generation: number }
function rememberIdentity(scope: string, identity?: TopicMutationIdentity) {
  if (identity) window.sessionStorage.setItem("engolearn.topic.identity." + encodeURIComponent(scope), JSON.stringify(identity));
}

export function clearTopicAttemptActions(learnerId: string | null, attemptId: string) {
  const storage = window.sessionStorage;
  const remove: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith("engolearn.topic.")) continue;
    try {
      const scope = JSON.parse(decodeURIComponent(key.slice(key.indexOf(".", "engolearn.topic.".length) + 1))) as unknown[];
      if (scope[0] === learnerId && scope[1] === attemptId) remove.push(key);
    } catch { /* Ignore unrelated or damaged keys. */ }
  }
  remove.forEach(key => storage.removeItem(key));
}

export function clearTopicGeneration(identity: TopicMutationIdentity, legacyAttemptIds: string[] = []) {
  const storage = window.sessionStorage;
  const remove: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith("engolearn.topic.")) continue;
    const encoded = key.slice(key.indexOf(".", "engolearn.topic.".length) + 1);
    if (!key.startsWith("engolearn.topic.identity.")) {
      if (!storage.getItem("engolearn.topic.identity." + encoded)) {
        try {
          const scope = JSON.parse(decodeURIComponent(encoded)) as unknown[];
          if (scope[0] === identity.learnerId && (scope[1] === identity.topicId || legacyAttemptIds.includes(String(scope[1])))) remove.push(key);
        } catch { /* Unrelated keys are outside this topic's reset scope. */ }
      }
      continue;
    }
    let saved: TopicMutationIdentity | null;
    try { saved = JSON.parse(storage.getItem(key) ?? "null") as TopicMutationIdentity | null; } catch { continue; }
    if (saved?.learnerId === identity.learnerId && saved.topicId === identity.topicId && (saved.generation ?? 0) <= identity.generation) {
      const scope = key.slice("engolearn.topic.identity.".length);
      remove.push(key, "engolearn.topic.action." + scope, "engolearn.topic.pending." + scope);
    }
  }
  remove.forEach(key => storage.removeItem(key));
}

// Keep the exact request as well as its identity: after reload the frontier may
// already have advanced, so rebuilding an answer from the current quiz is unsafe.
export function readTopicPendingAction(scope: string): unknown {
  try {
    const saved = window.sessionStorage.getItem("engolearn.topic.action." + encodeURIComponent(scope));
    return saved ? JSON.parse(saved) : null;
  } catch {
    throw Object.assign(new Error("Cannot restore pending action"), { code: "LOCAL_STORAGE_UNAVAILABLE" });
  }
}

export function saveTopicPendingAction(scope: string, request: unknown, identity?: TopicMutationIdentity): void {
  try {
    rememberIdentity(scope, identity);
    window.sessionStorage.setItem("engolearn.topic.action." + encodeURIComponent(scope), JSON.stringify(request));
  } catch {
    throw Object.assign(new Error("Cannot persist pending action"), { code: "LOCAL_STORAGE_UNAVAILABLE" });
  }
}

export function clearTopicPendingAction(scope: string): void {
  try { window.sessionStorage.removeItem("engolearn.topic.action." + encodeURIComponent(scope)); } catch { /* A saved request can safely be replayed. */ }
}

export async function runTopicMutation<T>({ scope, run, storage, identity: topicIdentity, newKey = () => crypto.randomUUID() }: JournalOptions<T>): Promise<T> {
  const key = "engolearn.topic.pending." + encodeURIComponent(scope);
  let store: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  let identity: string;
  try {
    store = storage ?? window.sessionStorage;
    if (!storage) rememberIdentity(scope, topicIdentity);
    const saved = store.getItem(key);
    identity = saved && saved.trim() && saved.length <= 128 && !/[\r\n]/.test(saved) ? saved : newKey();
    store.setItem(key, identity);
  } catch {
    throw Object.assign(new Error("Cannot persist pending action"), { code: "LOCAL_STORAGE_UNAVAILABLE" });
  }
  const clear = () => {
    // A successful server result must remain successful even if storage becomes unavailable.
    try { store.removeItem(key); } catch { /* The same identity remains safe to replay. */ }
  };
  try {
    const result = await run(identity);
    clear();
    return result;
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error &&
      typeof error.status === "number" && error.status >= 400 && error.status < 500) clear();
    throw error;
  }
}
