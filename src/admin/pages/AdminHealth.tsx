import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import type { Issue } from "../../types/issue";
import {
  runHealthChecks,
  type HealthCategory,
  type HealthCheck,
  type HealthStatus,
} from "../lib/systemHealth";
import { cn } from "@/lib/utils";

type AdminHealthProps = {
  issues: Issue[];
};

const STATUS_STYLE: Record<
  HealthStatus,
  { label: string; icon: LucideIcon; className: string; chip: string }
> = {
  pass: {
    label: "Pass",
    icon: CheckCircle2,
    className: "text-success",
    chip: "border-success/30 bg-success/10 text-success",
  },
  warn: {
    label: "Warning",
    icon: AlertTriangle,
    className: "text-warning",
    chip: "border-warning/30 bg-warning/10 text-warning",
  },
  fail: {
    label: "Fail",
    icon: XCircle,
    className: "text-destructive",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

const CATEGORY_ORDER: HealthCategory[] = ["Data", "Platform", "Client"];

export default function AdminHealth({ issues }: AdminHealthProps) {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    const result = await runHealthChecks(issues);
    setChecks(result);
    setLastRun(new Date().toISOString());
    setLoading(false);
  }, [issues]);

  useEffect(() => {
    void run();
  }, [run]);

  const counts = useMemo(
    () => ({
      pass: checks.filter((check) => check.status === "pass").length,
      warn: checks.filter((check) => check.status === "warn").length,
      fail: checks.filter((check) => check.status === "fail").length,
    }),
    [checks],
  );

  const overall: HealthStatus =
    counts.fail > 0 ? "fail" : counts.warn > 0 ? "warn" : checks.length ? "pass" : "warn";
  const OverallIcon = STATUS_STYLE[overall].icon;

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        checks: checks.filter((check) => check.category === category),
      })).filter((group) => group.checks.length > 0),
    [checks],
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              STATUS_STYLE[overall].chip,
            )}
            aria-hidden="true"
          >
            <OverallIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {loading
                ? "Running checks..."
                : overall === "pass"
                  ? "All systems operational"
                  : overall === "warn"
                    ? "Degraded - some checks need attention"
                    : "Failure - at least one check is failing"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {lastRun
                ? `Last checked ${new Date(lastRun).toLocaleString("en-KE")}`
                : "Not checked yet"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["pass", "warn", "fail"] as HealthStatus[]).map((status) => (
            <span
              key={status}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums",
                STATUS_STYLE[status].chip,
              )}
            >
              {counts[status]} {STATUS_STYLE[status].label.toLowerCase()}
            </span>
          ))}
          <Button
            onClick={() => void run()}
            disabled={loading}
            className="h-9 cursor-pointer gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run checks
          </Button>
        </div>
      </section>

      {/* Checks, grouped by what they cover */}
      {loading && checks.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {CATEGORY_ORDER.map((category) => (
            <div
              key={category}
              className="h-56 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {grouped.map((group) => (
            <section
              key={group.category}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-soft"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {group.category}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {group.checks.length} check{group.checks.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {group.checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Every check runs against the live platform - the database, the
          realtime channel, the auth session, the audit tables and the
          geocoding endpoint. A check that cannot be reached is reported as a
          failure, not skipped.
        </span>
      </p>
    </div>
  );
}

function CheckRow({ check }: { check: HealthCheck }) {
  const style = STATUS_STYLE[check.status];
  const Icon = style.icon;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", style.className)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <p className="text-sm font-medium text-foreground">{check.name}</p>
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              style.chip,
            )}
          >
            {style.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {check.detail}
        </p>
      </div>
      <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
        {check.durationMs} ms
      </span>
    </li>
  );
}
