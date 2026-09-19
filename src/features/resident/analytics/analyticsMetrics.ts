import type { Issue, IssueCategory } from "../../../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../../types/issue";

export const CATEGORY_ORDER: IssueCategory[] = [
  "water",
  "sewage",
  "waste",
  "pollution",
  "road_damage",
  "construction",
  "land_planning",
  "drainage",
  "encroachment",
  "green_project",
  "other",
];

export interface StatusMetrics {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
  resolutionRate: number;
}

export interface CategoryMetric {
  category: IssueCategory;
  name: string;
  count: number;
  open: number;
  inProgress: number;
  resolved: number;
  resolutionRate: number;
  sharePercentage: number;
  fill: string;
}

export function getStatusMetrics(issues: Issue[]): StatusMetrics {
  const open = issues.filter((issue) => ["UNVERIFIED", "UNDER_REVIEW", "CORROBORATED", "VERIFIED"].includes(issue.status)).length;
  const inProgress = issues.filter(
    (issue) => issue.status === "UNDER_REVIEW" || issue.status === "CORROBORATED",
  ).length;
  const resolved = issues.filter(
    (issue) => issue.status === "RESOLVED",
  ).length;
  const total = issues.length;

  return {
    open,
    inProgress,
    resolved,
    total,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  };
}

export function getCategoryMetrics(issues: Issue[]): CategoryMetric[] {
  const totalIssues = issues.length;

  return CATEGORY_ORDER.map((category) => {
    const categoryIssues = issues.filter(
      (issue) => issue.category === category,
    );
    const count = categoryIssues.length;
    const resolved = categoryIssues.filter(
      (issue) => issue.status === "RESOLVED",
    ).length;

    return {
      category,
      name: CATEGORY_LABELS[category],
      count,
      open: categoryIssues.filter((issue) => ["UNVERIFIED", "UNDER_REVIEW", "CORROBORATED", "VERIFIED"].includes(issue.status)).length,
      inProgress: categoryIssues.filter(
        (issue) => issue.status === "UNDER_REVIEW" || issue.status === "CORROBORATED",
      ).length,
      resolved,
      resolutionRate: count > 0 ? Math.round((resolved / count) * 100) : 0,
      sharePercentage:
        totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0,
      fill: CATEGORY_COLORS[category],
    };
  });
}

export function getRecentIssues(
  issues: Issue[],
  category: IssueCategory | "all",
) {
  return (
    category === "all"
      ? issues
      : issues.filter((issue) => issue.category === category)
  ).slice(0, 8);
}
