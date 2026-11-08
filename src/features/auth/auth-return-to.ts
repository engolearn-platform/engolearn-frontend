// M3.6.1 - NEW
import { ROUTES } from "@shared/constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasUnsafeCharacters(value: string): boolean {
  return [...value].some((character) => character === "\\"
    || character.charCodeAt(0) < 32 || (character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159));
}

export function getAuthReturnTo(state: unknown, origin = window.location.origin): string {
  if (!isRecord(state) || !isRecord(state.from)) return ROUTES.HOME;
  const { pathname, search = "", hash = "" } = state.from;
  if (typeof pathname !== "string" || typeof search !== "string" || typeof hash !== "string") return ROUTES.HOME;
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("?") || pathname.includes("#")) return ROUTES.HOME;
  if ((search !== "" && !search.startsWith("?")) || (hash !== "" && !hash.startsWith("#"))) return ROUTES.HOME;
  const rawTarget = pathname + search + hash;
  if (hasUnsafeCharacters(rawTarget)) return ROUTES.HOME;

  try {
    if (hasUnsafeCharacters(decodeURIComponent(rawTarget))) return ROUTES.HOME;
    const base = new URL(origin);
    if (base.protocol !== "http:" && base.protocol !== "https:") return ROUTES.HOME;
    const target = new URL(rawTarget, base.origin);
    if (target.origin !== base.origin) return ROUTES.HOME;
    const decodedPath = decodeURIComponent(target.pathname);
    if (decodedPath.startsWith("//") || hasUnsafeCharacters(decodedPath)) return ROUTES.HOME;
    const normalizedPath = new URL(decodedPath, base.origin).pathname.toLowerCase();
    if (normalizedPath.startsWith(ROUTES.LOGIN) || normalizedPath.startsWith(ROUTES.REGISTER)) return ROUTES.HOME;
    return target.pathname + target.search + target.hash;
  } catch {
    return ROUTES.HOME;
  }
}
