import type { IssueStatus } from "../../types/issue";

/**
 * The status vocabulary the planner console has to speak.
 *
 * Two vocabularies are in the data at once. The verification pipeline is
 * what the console writes: UNVERIFIED, UNDER_REVIEW, CORROBORATED,
 * VERIFIED, RESOLVED, REJECTED. Reports that residents submitted and that
 * no planner has touched still carry the older lowercase states - open,
 * in_progress, resolved.
 *
 * A filter that only knows the pipeline silently hides every report that has
 * not been through it, and a badge that maps an unknown value onto
 * "Under verification" asserts a state the row does not have. So the console
 * knows both vocabularies, labels each one truthfully, and never guesses.
 */

export const PIPELINE_STATUSES: IssueStatus[] = [
  "UNVERIFIED",
  "UNDER_REVIEW",
  "CORROBORATED",
  "VERIFIED",
  "RESOLVED",
  "REJECTED",
];

export const LEGACY_STATUSES = ["open", "in_progress", "resolved"] as const;

export type LegacyStatus = (typeof LEGACY_STATUSES)[number];
export type PlannerStatus = IssueStatus | LegacyStatus;

/**
 * The states a list can be filtered to.
 *
 * "Resolved" is one filter even though it is spelled two ways: a planner
 * asking for resolved reports wants every resolved report, whichever
 * vocabulary the row happens to carry.
 */
export type StatusFilterValue =
  | "all"
  | "open"
  | "in_progress"
  | "UNVERIFIED"
  | "UNDER_REVIEW"
  | "CORROBORATED"
  | "VERIFIED"
  | "resolved"
  | "REJECTED";

export type PlannerStatusFilter = StatusFilterValue;

export const STATUS_FILTER_OPTIONS: {
  value: StatusFilterValue;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "UNVERIFIED", label: "Under verification" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "in_progress", label: "In progress" },
  { value: "CORROBORATED", label: "Corroborated" },
  { value: "VERIFIED", label: "Verified" },
  { value: "resolved", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

export const STATUS_LABELS: Record<PlannerStatus, string> = {
  // The pipeline.
  UNVERIFIED: "Under verification",
  UNDER_REVIEW: "Under review",
  CORROBORATED: "Corroborated",
  VERIFIED: "Verified",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  // The states a report arrives in.
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

/**
 * The order the status board lists groups in: the pipeline from first rung
 * to last, then the states a report arrives in.
 */
export const STATUS_ORDER: PlannerStatus[] = [
  ...PIPELINE_STATUSES,
  ...LEGACY_STATUSES,
];

export function isPlannerStatus(value: string): value is PlannerStatus {
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, value);
}

/** The label for a stored status, with the stored value as the fallback. */
export function statusLabel(status: string): string {
  return isPlannerStatus(status) ? STATUS_LABELS[status] : status;
}

/**
 * The filter a stored status belongs to.
 *
 * Both spellings of resolved collapse into one filter, and anything the
 * console does not know falls back to "all" - a link to a state the data
 * does not have must not quietly filter to a different one.
 */
export function canonicalStatusFilter(value: string): StatusFilterValue {
  if (value === "RESOLVED") return "resolved";
  const match = STATUS_FILTER_OPTIONS.find((option) => option.value === value);
  return match ? match.value : "all";
}

/** The stored states a filter matches, in the form the database holds them. */
export function statusFilterValues(filter: PlannerStatusFilter): string[] {
  if (filter === "all") return [];
  if (filter === "resolved") return ["RESOLVED", "resolved"];
  return [filter];
}

/** The name a filter is offered under. */
export function statusFilterLabel(filter: StatusFilterValue): string {
  return (
    STATUS_FILTER_OPTIONS.find((option) => option.value === filter)?.label ??
    filter
  );
}

/**
 * The rungs of the status ramp, and the filters that sit on each.
 *
 * The rungs are the ordinal scale the badges are drawn from, so the board
 * counts the same way the badges colour: a report nobody has picked up
 * ("open") and a report nobody has verified yet ("UNVERIFIED") are both on
 * the first rung, because both are still at the start of the pipeline.
 *
 * The list is filters rather than stored states, so the names on the board
 * are the names a planner can pick from the filter.
 */
export const STATUS_RUNGS: {
  rung: 1 | 2 | 3 | 4 | 5;
  label: string;
  filters: StatusFilterValue[];
}[] = [
  {
    rung: 1,
    label: "Not yet worked on",
    filters: ["open", "UNVERIFIED"],
  },
  {
    rung: 2,
    label: "Under review",
    filters: ["in_progress", "UNDER_REVIEW"],
  },
  { rung: 3, label: "Corroborated", filters: ["CORROBORATED"] },
  { rung: 4, label: "Verified", filters: ["VERIFIED"] },
  { rung: 5, label: "Resolved", filters: ["resolved"] },
];

/**
 * The rung of the status ramp a stored status sits on.
 *
 * "open" and "in_progress" are the states before the pipeline starts, so
 * they take the first two rungs - the same rungs as "under verification"
 * and "under review".
 */
export function statusRung(status: string): 1 | 2 | 3 | 4 | 5 {
  switch (status) {
    case "UNDER_REVIEW":
    case "in_progress":
      return 2;
    case "CORROBORATED":
      return 3;
    case "VERIFIED":
      return 4;
    case "RESOLVED":
    case "resolved":
      return 5;
    default:
      return 1;
  }
}
