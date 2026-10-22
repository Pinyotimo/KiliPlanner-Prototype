import type { Issue, IssueCategory, IssueStatus } from "../../../types/issue";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
} from "../../../types/issue";

/**
 * Display order for the issue categories.
 *
 * The order decides which category colours end up side by side in the charts,
 * so it is fixed to a sequence whose neighbouring pairs stay distinguishable
 * for colour-blind and full-colour readers alike in both light and dark mode.
 */
export const CATEGORY_ORDER: IssueCategory[] = [
  "security",
  "water",
  "drainage",
  "road_damage",
  "construction",
  "green_project",
  "sewage",
  "waste",
  "land_planning",
  "encroachment",
  "pollution",
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
  shortName: string;
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
      shortName: CATEGORY_SHORT_LABELS[category],
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

// ------------------------------------------------------------ status pipeline

/**
 * The report lifecycle is an *ordered* scale, not a set of unrelated states,
 * so it is charted with a single hue in stepped lightness rather than
 * categorical colours.
 */
export const STATUS_PIPELINE: {
  status: IssueStatus;
  label: string;
  step: number;
}[] = [
  { status: "UNVERIFIED", label: "Under verification", step: 1 },
  { status: "UNDER_REVIEW", label: "Under review", step: 2 },
  { status: "CORROBORATED", label: "Corroborated", step: 3 },
  { status: "VERIFIED", label: "Verified", step: 4 },
  { status: "RESOLVED", label: "Resolved", step: 5 },
];

export interface StatusStage {
  status: IssueStatus;
  label: string;
  step: number;
  count: number;
  sharePercentage: number;
  /** CSS token for this rung of the ordinal ramp. */
  fill: string;
}

export function getStatusPipeline(issues: Issue[]): StatusStage[] {
  const total = issues.length;

  return STATUS_PIPELINE.map((stage) => {
    const count = issues.filter((issue) => issue.status === stage.status).length;
    return {
      ...stage,
      count,
      sharePercentage: total > 0 ? Math.round((count / total) * 100) : 0,
      fill: `var(--status-${stage.step})`,
    };
  });
}

export function getRejectedCount(issues: Issue[]): number {
  return issues.filter((issue) => issue.status === "REJECTED").length;
}

// -------------------------------------------------------------- category groups

/**
 * The categories collapse into five service families for the part-to-whole
 * chart, and for every other place a category colour is used.
 *
 * Two things force the fold. The map is an all-pairs form, so the family
 * colours have to stay distinguishable from every other family, not just from
 * their neighbours - nine per-category hues could not clear that bar. And a
 * part-to-whole chart reads at a glance only to about six segments.
 *
 * The residual "Other" is not a sixth identity - it takes a neutral rather
 * than a hue, and the neutral is pitched clear of the family band so it
 * stays separable from every colour beside it. It is the same token the map
 * pin and the legend use, so the chart and the map agree.
 */
export const CATEGORY_GROUPS: {
  key: string;
  label: string;
  categories: IssueCategory[];
  fill: string;
}[] = [
  { key: "security", label: "Security", categories: ["security"], fill: "var(--category-security)" },
  { key: "water", label: "Water & sewerage", categories: ["water", "drainage", "sewage"], fill: "var(--category-water)" },
  { key: "works", label: "Roads, works & land", categories: ["road_damage", "construction", "land_planning", "encroachment"], fill: "var(--category-works)" },
  { key: "environment", label: "Waste & green space", categories: ["waste", "green_project"], fill: "var(--category-environment)" },
  { key: "pollution", label: "Pollution", categories: ["pollution"], fill: "var(--category-pollution)" },
  { key: "other", label: "Other", categories: ["other"], fill: "var(--category-other)" },
];

export interface CategoryGroupMetric {
  key: string;
  label: string;
  count: number;
  sharePercentage: number;
  fill: string;
  categories: IssueCategory[];
}

export function getCategoryGroups(issues: Issue[]): CategoryGroupMetric[] {
  const total = issues.length;

  return CATEGORY_GROUPS.map((group) => {
    const count = issues.filter((issue) =>
      group.categories.includes(issue.category),
    ).length;

    return {
      key: group.key,
      label: group.label,
      categories: group.categories,
      count,
      sharePercentage: total > 0 ? Math.round((count / total) * 100) : 0,
      fill: group.fill,
    };
  });
}

// ------------------------------------------------------------------- trends

export interface TrendPoint {
  date: Date;
  label: string;
  count: number;
  resolved: number;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Daily report volume over a trailing window, split into reports raised and
 * reports resolved on each day.
 */
export function getDailyTrend(issues: Issue[], days: number): TrendPoint[] {
  const now = new Date();
  const today = startOfDay(now);
  const points: TrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    points.push({
      date,
      label: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count: 0,
      resolved: 0,
    });
  }

  const first = points[0].date.getTime();
  const dayMs = 86400000;

  for (const issue of issues) {
    const created = new Date(issue.created_at).getTime();
    if (Number.isNaN(created)) continue;
    const index = Math.floor((startOfDay(new Date(created)).getTime() - first) / dayMs);
    if (index >= 0 && index < points.length) {
      points[index].count += 1;
      if (issue.status === "RESOLVED" && issue.updated_at) {
        const updated = new Date(issue.updated_at).getTime();
        if (!Number.isNaN(updated)) {
          const resolvedIndex = Math.floor(
            (startOfDay(new Date(updated)).getTime() - first) / dayMs,
          );
          if (resolvedIndex >= 0 && resolvedIndex < points.length) {
            points[resolvedIndex].resolved += 1;
          }
        }
      }
    }
  }

  return points;
}
