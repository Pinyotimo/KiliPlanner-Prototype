import type { Issue } from "../../../types/issue";

export const WASTE_SLA_HOURS = 48;

export interface WasteSLAState {
  completed: boolean;
  overdue: boolean;
  label: string;
  progressPercent: number;
}

export function getWasteSlaState(issue: Issue, now: number = Date.now()): WasteSLAState | null {
  const categoryStr = issue.category as unknown as string;
  const isWasteCategory =
    categoryStr === "garbage_waste" ||
    categoryStr === "waste" ||
    categoryStr === "garbage" ||
    categoryStr === "sewage" ||
    categoryStr === "pollution";

  if (!isWasteCategory) {
    return null;
  }

  const statusStr = (issue.status as unknown as string)?.toLowerCase();
  const completed = statusStr === "resolved" || statusStr === "closed" || statusStr === "fixed";

  const createdTime = new Date(issue.created_at).getTime();
  const slaMs = WASTE_SLA_HOURS * 60 * 60 * 1000;
  const targetTime = createdTime + slaMs;

  if (completed) {
    return {
      completed: true,
      overdue: false,
      label: "Resolved within SLA",
      progressPercent: 100,
    };
  }

  const timeRemainingMs = targetTime - now;
  const overdue = timeRemainingMs <= 0;

  if (overdue) {
    const overdueHours = Math.floor(Math.abs(timeRemainingMs) / (1000 * 60 * 60));
    return {
      completed: false,
      overdue: true,
      label: `Overdue by ${overdueHours}h`,
      progressPercent: 100,
    };
  }

  const elapsedTimeMs = Math.max(0, now - createdTime);
  const progressPercent = Math.min(100, (elapsedTimeMs / slaMs) * 100);
  const remainingHours = Math.ceil(timeRemainingMs / (1000 * 60 * 60));

  return {
    completed: false,
    overdue: false,
    label: `${remainingHours}h remaining`,
    progressPercent,
  };
}