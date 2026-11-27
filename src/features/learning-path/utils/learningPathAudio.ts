export function safeLearningPathAudioUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim() || value !== value.trim() || /[\\\s]/.test(value)
    || Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return undefined;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password ? value : undefined;
  } catch { return undefined; }
}

export function learningPathAudioExpired(expiresAt: string | null | undefined): boolean {
  return expiresAt != null && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now());
}
