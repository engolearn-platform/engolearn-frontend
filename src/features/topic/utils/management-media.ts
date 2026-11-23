export function playableManagementMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const uploaded = /^topic-media:([\w-]+):([\w-]+)$/.exec(value);
  if (uploaded) return `/api/management/topics/${encodeURIComponent(uploaded[1])}/media/${encodeURIComponent(uploaded[2])}`;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}
