export function summarizeIssues(counts: Record<string, number>) {
  return {
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    ...counts,
  };
}
