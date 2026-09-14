const RESIDENT_NOTIFICATION_IDS_KEY = "kiliplanner-resident-notification-ids";
const PLANNER_NOTIFICATION_IDS_KEY = "kiliplanner-planner-notification-ids";
const OFFICIAL_NOTIFICATION_IDS_KEY = "kiliplanner-official-notification-ids";

function readIds(key: string): string[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)].slice(0, 20)));
}

export function getResidentNotificationIds() {
  return readIds(RESIDENT_NOTIFICATION_IDS_KEY);
}

export function setResidentNotificationIds(ids: string[]) {
  writeIds(RESIDENT_NOTIFICATION_IDS_KEY, ids);
}

export function getPlannerNotificationIds() {
  return readIds(PLANNER_NOTIFICATION_IDS_KEY);
}

export function setPlannerNotificationIds(ids: string[]) {
  writeIds(PLANNER_NOTIFICATION_IDS_KEY, ids);
}

export function getOfficialNotificationIds() {
  return readIds(OFFICIAL_NOTIFICATION_IDS_KEY);
}

export function setOfficialNotificationIds(ids: string[]) {
  writeIds(OFFICIAL_NOTIFICATION_IDS_KEY, ids);
}
