import type { Issue } from "../../../types/issue";

export function sortFeedIssues(issues: Issue[]) {
  return [...issues].sort((a, b) => {
    const aIsSecurity = a.is_security_alert || a.category === "security";
    const bIsSecurity = b.is_security_alert || b.category === "security";

    if (aIsSecurity && !bIsSecurity) return -1;
    if (!aIsSecurity && bIsSecurity) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
