interface JournalOptions<T> {
  scope: string;
  run: (idempotencyKey: string) => Promise<T>;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  newKey?: () => string;
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
