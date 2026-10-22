import { supabase } from "../../lib/supabaseClient";
import type { Issue } from "../../types/issue";

export type HealthStatus = "pass" | "warn" | "fail";

export type HealthCategory = "Data" | "Platform" | "Client";

export interface HealthCheck {
  id: string;
  name: string;
  category: HealthCategory;
  status: HealthStatus;
  detail: string;
  durationMs: number;
}

const GEOCODING_STATUS_URL = "https://overpass-api.de/api/status";

async function timed<T>(run: () => Promise<T>): Promise<{
  value: T;
  durationMs: number;
}> {
  const started = performance.now();
  const value = await run();
  return { value, durationMs: Math.round(performance.now() - started) };
}

async function checkDatabase(): Promise<HealthCheck> {
  const started = performance.now();
  try {
    const { count, error } = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true });
    const durationMs = Math.round(performance.now() - started);
    if (error) {
      return {
        id: "database",
        name: "Database",
        category: "Data",
        status: "fail",
        detail: error.message,
        durationMs,
      };
    }
    return {
      id: "database",
      name: "Database",
      category: "Data",
      status: "pass",
      detail: `Reports table reachable, ${count ?? 0} rows indexed.`,
      durationMs,
    };
  } catch (error) {
    return {
      id: "database",
      name: "Database",
      category: "Data",
      status: "fail",
      detail: error instanceof Error ? error.message : "Request failed",
      durationMs: Math.round(performance.now() - started),
    };
  }
}

async function checkRealtime(): Promise<HealthCheck> {
  const started = performance.now();
  const channel = supabase.channel(`health-probe-${Date.now()}`);
  const outcome = await new Promise<"connected" | "timeout">((resolve) => {
    const timer = setTimeout(() => resolve("timeout"), 6000);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve("connected");
      }
    });
  });
  await supabase.removeChannel(channel);
  const durationMs = Math.round(performance.now() - started);
  return {
    id: "realtime",
    name: "Realtime channel",
    category: "Data",
    status: outcome === "connected" ? "pass" : "fail",
    detail:
      outcome === "connected"
        ? "Subscribed to the live issue stream."
        : "No subscription confirmed within 6 seconds.",
    durationMs,
  };
}

async function checkAuthentication(): Promise<HealthCheck> {
  const { value, durationMs } = await timed(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  });
  if (!value) {
    return {
      id: "authentication",
      name: "Authentication",
      category: "Platform",
      status: "warn",
      detail: "No active session - the console is running signed out.",
      durationMs,
    };
  }
  const expiresAt = value.expires_at
    ? new Date(value.expires_at * 1000).toLocaleString("en-KE")
    : "unknown";
  return {
    id: "authentication",
    name: "Authentication",
    category: "Platform",
    status: "pass",
    detail: `Session active for ${value.user?.email ?? "this account"}, expires ${expiresAt}.`,
    durationMs,
  };
}

async function checkConfiguration(): Promise<HealthCheck> {
  const started = performance.now();
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!key) missing.push("VITE_SUPABASE_ANON_KEY");
  return {
    id: "configuration",
    name: "Configuration",
    category: "Platform",
    status: missing.length === 0 ? "pass" : "fail",
    detail:
      missing.length === 0
        ? `Supabase endpoint ${url}`
        : `Missing environment variables: ${missing.join(", ")}`,
    durationMs: Math.round(performance.now() - started),
  };
}

async function checkAuditAccess(): Promise<HealthCheck> {
  const { value, durationMs } = await timed(async () => {
    const { error } = await supabase
      .from("report_state_transitions")
      .select("id", { count: "exact", head: true });
    return error;
  });
  if (value) {
    return {
      id: "audit-access",
      name: "Audit trail read",
      category: "Data",
      status: "warn",
      detail: `Audit rows are not readable for this role (${value.message}). The audit page will show the source as restricted.`,
      durationMs,
    };
  }
  return {
    id: "audit-access",
    name: "Audit trail read",
    category: "Data",
    status: "pass",
    detail: "Audit sources are readable for this role.",
    durationMs,
  };
}

async function checkGeocoding(): Promise<HealthCheck> {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    await fetch(GEOCODING_STATUS_URL, {
      mode: "no-cors",
      signal: controller.signal,
    });
    return {
      id: "geocoding",
      name: "Geocoding service",
      category: "Platform",
      status: "pass",
      detail: "Address lookup endpoint answered.",
      durationMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      id: "geocoding",
      name: "Geocoding service",
      category: "Platform",
      status: "fail",
      detail:
        error instanceof Error && error.name === "AbortError"
          ? "No answer from the lookup endpoint within 6 seconds."
          : "The lookup endpoint could not be reached.",
      durationMs: Math.round(performance.now() - started),
    };
  } finally {
    clearTimeout(timer);
  }
}

function checkDataFreshness(issues: Issue[]): HealthCheck {
  const started = performance.now();
  const timestamps = issues
    .map((issue) => new Date(issue.created_at).getTime())
    .filter((value) => !Number.isNaN(value));
  if (timestamps.length === 0) {
    return {
      id: "freshness",
      name: "Data freshness",
      category: "Data",
      status: "warn",
      detail: "No reports loaded, so freshness cannot be judged.",
      durationMs: Math.round(performance.now() - started),
    };
  }
  const newest = Math.max(...timestamps);
  const ageHours = (Date.now() - newest) / 3600000;
  const status: HealthStatus =
    ageHours <= 72 ? "pass" : ageHours <= 168 ? "warn" : "fail";
  return {
    id: "freshness",
    name: "Data freshness",
    category: "Data",
    status,
    detail: `Newest report is ${ageHours < 1 ? "under an hour" : `${Math.round(ageHours)} hours`} old.`,
    durationMs: Math.round(performance.now() - started),
  };
}

function checkClientCapabilities(): HealthCheck[] {
  const started = performance.now();
  const durationMs = Math.round(performance.now() - started);

  let storageOk = false;
  try {
    const probe = "__kili_health__";
    localStorage.setItem(probe, "1");
    storageOk = localStorage.getItem(probe) === "1";
    localStorage.removeItem(probe);
  } catch {
    storageOk = false;
  }

  const location: HealthStatus = "geolocation" in navigator ? "pass" : "warn";
  const notificationPermission =
    typeof Notification === "undefined" ? "unsupported" : Notification.permission;

  return [
    {
      id: "storage",
      name: "Local storage",
      category: "Client",
      status: storageOk ? "pass" : "fail",
      detail: storageOk
        ? "Console preferences and this device's activity trail persist."
        : "Storage is blocked, so console preferences will not persist.",
      durationMs,
    },
    {
      id: "location",
      name: "Device location",
      category: "Client",
      status: location,
      detail:
        location === "pass"
          ? "Geolocation is available for nearby alerts."
          : "Geolocation is unavailable in this browser.",
      durationMs,
    },
    {
      id: "notifications",
      name: "Notifications",
      category: "Client",
      status:
        notificationPermission === "granted"
          ? "pass"
          : notificationPermission === "denied"
            ? "warn"
            : notificationPermission === "unsupported"
              ? "warn"
              : "warn",
      detail:
        notificationPermission === "granted"
          ? "Alerts are permitted for this browser."
          : notificationPermission === "denied"
            ? "Alerts are blocked for this browser."
            : notificationPermission === "unsupported"
              ? "This browser does not support notifications."
              : "Alerts are waiting for permission.",
      durationMs,
    },
  ];
}

/**
 * Every check runs against the live platform. Nothing here is simulated, so
 * a check that cannot be reached is reported as a failure rather than
 * quietly passing.
 */
export async function runHealthChecks(issues: Issue[] = []): Promise<HealthCheck[]> {
  const checks = await Promise.all([
    checkDatabase(),
    checkRealtime(),
    checkAuthentication(),
    checkConfiguration(),
    checkAuditAccess(),
    checkGeocoding(),
  ]);

  return [
    ...checks,
    checkDataFreshness(issues),
    ...checkClientCapabilities(),
  ];
}
