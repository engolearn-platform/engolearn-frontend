import { ROUTES } from "@shared/constants";

export function authReturnTo(state: unknown): string {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)?.from;
  if (!from || typeof from.pathname !== "string") return ROUTES.HOME;
  const target = from.pathname + (typeof from.search === "string" ? from.search : "")
    + (typeof from.hash === "string" ? from.hash : "");
  if (!target.startsWith("/") || target.startsWith("//") || target.includes("\\")
    || [...target].some(character => character.charCodeAt(0) <= 0x20)) return ROUTES.HOME;
  const path = new URL(target, "https://engolearn.local").pathname;
  return /^\/(login|register)(\/|$)/.test(path) ? ROUTES.HOME : target;
}
