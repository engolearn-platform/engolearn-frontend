export function percentage(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : Math.round((numerator / denominator) * 100);
}

export function scoreLabel(score: number | null): string {
  return score === null ? "Không có dữ liệu" : `${score}%`;
}

export function changeLabel(score: number | null, baseline: number | null): string {
  if (score === null || baseline === null) {
    return "Không có dữ liệu";
  }

  const change = score - baseline;
  return `${change >= 0 ? "+" : "−"}${Math.abs(change)}%`;
}
