import type { Issue, IssueCategory as IssueCategoryValue, IssueStatus as IssueStatusValue } from "../../types/issue";

export type AdminIssue = Issue;
export type IssueStatus = IssueStatusValue;
export type IssueCategory = IssueCategoryValue;

/** No severity values are valid until the database stores a severity field. */
export type IssueSeverity = never;

export interface AdminStats {
  total: number;
  open: number;
  resolved: number;
}

export interface IssueFilters {
  searchTerm: string;
  category: IssueCategory | "all";
  status: IssueStatus | "all";
  dateRange: "all" | "today" | "7d" | "30d";
  sort: "newest" | "oldest";
}

export interface AnalyticsData {
  totalReports: number;
  openReports: number;
  resolvedReports: number;
  resolutionRate: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  categoryCounts: Partial<Record<IssueCategory, number>>;
  statusCounts: Partial<Record<IssueStatus, number>>;
}

/** Reserved for a future activity table; current reports only expose created_at. */
export interface PlannerActivity {
  id: string;
  issueId: string;
  type: "reported";
  createdAt: string;
}
