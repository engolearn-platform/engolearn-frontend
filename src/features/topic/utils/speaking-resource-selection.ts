export type ResourceGroupSelection = "unchecked" | "mixed" | "checked";
export interface SearchableSpeakingResourceGroup {
  itemId: string;
  itemTitle: string | null;
  resources: { textEn: string }[];
}

export function resourceGroupSelection(resourceIds: readonly string[], selectedIds: readonly string[]): ResourceGroupSelection {
  const selected = new Set(selectedIds);
  const count = resourceIds.filter(id => selected.has(id)).length;
  if (count === 0) return "unchecked";
  return count === resourceIds.length ? "checked" : "mixed";
}

export function toggleResourceSelection(selectedIds: readonly string[], resourceId: string, checked: boolean): string[] {
  const selected = new Set(selectedIds);
  if (checked) selected.add(resourceId);
  else selected.delete(resourceId);
  return [...selected];
}

export function toggleResourceGroupSelection(selectedIds: readonly string[], resourceIds: readonly string[]): string[] {
  if (!resourceIds.length) return [...selectedIds];
  const selected = new Set(selectedIds);
  const clearGroup = resourceIds.every(id => selected.has(id));
  resourceIds.forEach(id => clearGroup ? selected.delete(id) : selected.add(id));
  return [...selected];
}

export function clearResourceSelection(): string[] { return []; }

export function removeResourceSelection(selectedIds: readonly string[], resourceId: string): string[] {
  return selectedIds.filter(id => id !== resourceId);
}

export function filterSpeakingResourceGroups<Group extends SearchableSpeakingResourceGroup>(groups: readonly Group[], query: string): Group[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [...groups];
  return groups.filter(group => (group.itemTitle ?? "").toLocaleLowerCase().includes(term)
    || group.resources.some(resource => resource.textEn.toLocaleLowerCase().includes(term)));
}

export function isSpeakingResourceGroupExpanded(itemId: string, expandedIds: ReadonlySet<string>): boolean {
  return expandedIds.has(itemId);
}
