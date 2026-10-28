interface JournalOptions<T> {
  scope: string;
  run: (idempotencyKey: string) => Promise<T>;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  newKey?: () => string;
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

export function saveTopicPendingAction(scope: string, request: unknown): void {
  try {
    window.sessionStorage.setItem("engolearn.topic.action." + encodeURIComponent(scope), JSON.stringify(request));
  } catch {
    throw Object.assign(new Error("Cannot persist pending action"), { code: "LOCAL_STORAGE_UNAVAILABLE" });
  }
}

export function clearTopicPendingAction(scope: string): void {
  try { window.sessionStorage.removeItem("engolearn.topic.action." + encodeURIComponent(scope)); } catch { /* A saved request can safely be replayed. */ }
}

export async function runTopicMutation<T>({ scope, run, storage, newKey = () => crypto.randomUUID() }: JournalOptions<T>): Promise<T> {
  const key = "engolearn.topic.pending." + encodeURIComponent(scope);
  let store: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  let identity: string;
  try {
    store = storage ?? window.sessionStorage;
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
