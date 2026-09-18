import type { Issue } from "../../../types/issue";

export const WASTE_SLA_HOURS = 48;
export const WASTE_SLA_MS = WASTE_SLA_HOURS * 60 * 60 * 1000;

export type WasteSlaState = {
  completed: boolean;
  overdue: boolean;
  progressPercent: number;
  label: string;
};

function formatRelativeAge(milliseconds: number): string {
  const totalMinutes = Math.max(1, Math.ceil(Math.abs(milliseconds) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (hours > 0) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
}

export function getWasteSlaState(
  issue: Issue,
  now = Date.now(),
): WasteSlaState | null {
  if (issue.category !== "waste") return null;

  const completed = issue.status === "resolved" || issue.status === "closed";
  const deadline = new Date(issue.created_at).getTime() + WASTE_SLA_MS;
  if (!Number.isFinite(deadline)) return null;

  if (completed) {
    return {
      completed: true,
      overdue: false,
      progressPercent: 100,
      label: "Resolved within SLA",
    };
  }

  const overdue = now >= deadline;
  const age = now - new Date(issue.created_at).getTime();
  return {
    completed: false,
    overdue,
    progressPercent: Math.min(
      100,
      Math.max(0, ((now - (deadline - WASTE_SLA_MS)) / WASTE_SLA_MS) * 100),
    ),
    label: formatRelativeAge(age),
  };
}
