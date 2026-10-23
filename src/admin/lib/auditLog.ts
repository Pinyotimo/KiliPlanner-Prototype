import { supabase } from "../../lib/supabaseClient";

/**
 * The audit trail has two halves, and the console shows both.
 *
 * The server half is what the platform itself recorded: report state
 * transitions, pipeline audit events, submission attempts and anomaly
 * flags. Each of those tables has row level security, so a read can be
 * refused - the console reports that refusal per source rather than
 * pretending the source is empty.
 *
 * The device half is what this browser did in the console: sign-ins, status
 * changes, exports and preference changes. It is kept locally because the
 * server has no table for console sessions.
 */

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditSource =
  | "state_transition"
  | "audit_event"
  | "submission_attempt"
  | "anomaly"
  | "console";

export interface AuditEntry {
  id: string;
  source: AuditSource;
  sourceLabel: string;
  title: string;
  detail?: string;
  reportId?: string;
  actor?: string;
  severity: AuditSeverity;
  timestamp: string;
}

export interface AuditSourceResult {
  source: AuditSource;
  sourceLabel: string;
  entries: AuditEntry[];
  /** Set when the source could not be read. */
  error: string | null;
  /** True when the source is readable but has no rows. */
  empty: boolean;
}

// ------------------------------------------------------------- device trail

export type ConsoleActivityType =
  | "sign_in"
  | "sign_in_failed"
  | "sign_out"
  | "status_change"
  | "export"
  | "settings_change";

export interface ConsoleActivity {
  id: string;
  type: ConsoleActivityType;
  summary: string;
  detail?: string;
  reportId?: string;
  at: string;
}

const CONSOLE_ACTIVITY_KEY = "kiliplanner-console-audit";
const CONSOLE_ACTIVITY_LIMIT = 250;

/** Record something this device did in the console. */
export function recordConsoleActivity(activity: {
  type: ConsoleActivityType;
  summary: string;
  detail?: string;
  reportId?: string;
}): void {
  try {
    const stored = getConsoleActivity();
    stored.unshift({
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: activity.type,
      summary: activity.summary,
      detail: activity.detail,
      reportId: activity.reportId,
      at: new Date().toISOString(),
    });
    localStorage.setItem(
      CONSOLE_ACTIVITY_KEY,
      JSON.stringify(stored.slice(0, CONSOLE_ACTIVITY_LIMIT)),
    );
  } catch {
    // A full or unavailable store must never break the action being logged.
  }
}

export function getConsoleActivity(): ConsoleActivity[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(CONSOLE_ACTIVITY_KEY) ?? "[]",
    ) as ConsoleActivity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearConsoleActivity(): void {
  try {
    localStorage.removeItem(CONSOLE_ACTIVITY_KEY);
  } catch {
    // Nothing to clear.
  }
}

function consoleEntries(): AuditEntry[] {
  return getConsoleActivity().map((activity) => ({
    id: activity.id,
    source: "console" as const,
    sourceLabel: "Console activity",
    title: activity.summary,
    detail: activity.detail,
    reportId: activity.reportId,
    severity: activity.type === "sign_in_failed" ? "warning" : "info",
    timestamp: activity.at,
  }));
}

// ------------------------------------------------------------- server trail

const LIMIT = 200;

function readError(error: { message?: string } | null): string | null {
  if (!error) return null;
  const message = error.message ?? "Read refused";
  if (/row-level security|permission denied|not authorized/i.test(message)) {
    return "Row level security refused this read for the signed-in role.";
  }
  return message;
}

async function fetchStateTransitions(): Promise<AuditSourceResult> {
  const label = "Report state transitions";
  const { data, error } = await supabase
    .from("report_state_transitions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  const message = readError(error);
  return {
    source: "state_transition",
    sourceLabel: label,
    entries: message
      ? []
      : ((data ?? []) as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          source: "state_transition" as const,
          sourceLabel: label,
          title: `${String(row.from_state ?? "none")} → ${String(row.to_state)}`,
          detail: row.reason ? String(row.reason) : undefined,
          reportId: row.report_id ? String(row.report_id) : undefined,
          actor: row.actor_id ? String(row.actor_id) : undefined,
          severity: "info" as const,
          timestamp: String(row.created_at),
        })),
    error: message,
    empty: !message && !(data && data.length > 0),
  };
}

async function fetchAuditEvents(): Promise<AuditSourceResult> {
  const label = "Pipeline audit events";
  const { data, error } = await supabase
    .from("report_audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  const message = readError(error);
  return {
    source: "audit_event",
    sourceLabel: label,
    entries: message
      ? []
      : ((data ?? []) as Record<string, unknown>[]).map((row) => {
          const risk = row.risk_score == null ? null : Number(row.risk_score);
          return {
            id: String(row.id),
            source: "audit_event" as const,
            sourceLabel: label,
            title: String(row.event_type ?? "event"),
            detail:
              row.metadata && typeof row.metadata === "object"
                ? JSON.stringify(row.metadata)
                : undefined,
            reportId: row.issue_id ? String(row.issue_id) : undefined,
            severity:
              risk != null && risk >= 70
                ? ("critical" as const)
                : risk != null && risk >= 40
                  ? ("warning" as const)
                  : ("info" as const),
            timestamp: String(row.created_at),
          };
        }),
    error: message,
    empty: !message && !(data && data.length > 0),
  };
}

async function fetchSubmissionAttempts(): Promise<AuditSourceResult> {
  const label = "Submission attempts";
  const { data, error } = await supabase
    .from("report_submission_attempts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  const message = readError(error);
  return {
    source: "submission_attempt",
    sourceLabel: label,
    entries: message
      ? []
      : ((data ?? []) as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          source: "submission_attempt" as const,
          sourceLabel: label,
          title: `Submission ${String(row.outcome ?? "unknown")}`,
          detail: row.reason ? String(row.reason) : undefined,
          severity:
            row.outcome === "rejected" ? ("warning" as const) : ("info" as const),
          timestamp: String(row.created_at),
        })),
    error: message,
    empty: !message && !(data && data.length > 0),
  };
}

async function fetchAnomalies(): Promise<AuditSourceResult> {
  const label = "Anomaly flags";
  const { data, error } = await supabase
    .from("anomaly_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  const message = readError(error);
  return {
    source: "anomaly",
    sourceLabel: label,
    entries: message
      ? []
      : ((data ?? []) as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          source: "anomaly" as const,
          sourceLabel: label,
          title: String(row.anomaly_type ?? "anomaly"),
          detail: row.resolved_at
            ? `Resolved at ${String(row.resolved_at)}`
            : "Unresolved",
          severity: row.resolved_at
            ? ("info" as const)
            : ("critical" as const),
          timestamp: String(row.created_at),
        })),
    error: message,
    empty: !message && !(data && data.length > 0),
  };
}

/** Every readable source, in parallel. A failed source never fails the page. */
export async function getAuditTrail(): Promise<AuditSourceResult[]> {
  const results = await Promise.all([
    fetchStateTransitions(),
    fetchAuditEvents(),
    fetchSubmissionAttempts(),
    fetchAnomalies(),
  ]);
  return results;
}

export function mergeAuditEntries(
  results: AuditSourceResult[],
): AuditEntry[] {
  const entries = [
    ...results.flatMap((result) => result.entries),
    ...consoleEntries(),
  ];
  return entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
