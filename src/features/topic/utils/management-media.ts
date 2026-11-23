export function playableManagementMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}
