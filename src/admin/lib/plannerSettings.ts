export type PlannerSettings = {
  defaultMapView: "dashboard" | "map";
  defaultIssueFilter: "all" | "open" | "resolved";
  refreshBehavior: "realtime" | "manual";
  compactTables: boolean;
  newReportNotifications: boolean;
  criticalIssueNotifications: boolean;
};

const STORAGE_KEY = "kiliplanner-planner-settings";

export const defaultPlannerSettings: PlannerSettings = {
  defaultMapView: "dashboard",
  defaultIssueFilter: "open",
  refreshBehavior: "realtime",
  compactTables: false,
  newReportNotifications: true,
  criticalIssueNotifications: false,
};

export function getPlannerSettings(): PlannerSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<PlannerSettings> | null;
    return { ...defaultPlannerSettings, ...stored };
  } catch {
    return defaultPlannerSettings;
  }
}

export function savePlannerSettings(settings: PlannerSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}