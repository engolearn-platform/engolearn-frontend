export function formatLearningPathDate(createdDate: string): string {
  const [year, month, day] = createdDate.split("-");

  if (!year || !month || !day) {
    return createdDate;
  }

  return `${day}/${month}/${year}`;
}
