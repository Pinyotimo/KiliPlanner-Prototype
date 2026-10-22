import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Download,
  ShieldAlert,
  Loader2,
  Lock,
  ScrollText,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  getAuditTrail,
  mergeAuditEntries,
  recordConsoleActivity,
  clearConsoleActivity,
  type AuditEntry,
  type AuditSeverity,
  type AuditSourceResult,
} from "../lib/auditLog";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "all", label: "All time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

type Range = (typeof RANGES)[number]["value"];

const SEVERITY_STYLE: Record<
  AuditSeverity,
  { label: string; className: string }
> = {
  info: { label: "Info", className: "text-muted-foreground" },
  warning: { label: "Warning", className: "text-warning" },
  critical: { label: "Critical", className: "text-destructive" },
};

export default function AdminAuditLog() {
  const [results, setResults] = useState<AuditSourceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"all" | string>("all");
  const [severity, setSeverity] = useState<"all" | AuditSeverity>("all");
  const [range, setRange] = useState<Range>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const trail = await getAuditTrail();
    setResults(trail);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => mergeAuditEntries(results), [results]);

  const filtered = useMemo(() => {
    const cutoff =
      range === "all"
        ? null
        : Date.now() -
          (range === "24h" ? 86400000 : range === "7d" ? 604800000 : 2592000000);
    const term = search.trim().toLowerCase();

    return entries.filter((entry) => {
      if (source !== "all" && entry.source !== source) return false;
      if (severity !== "all" && entry.severity !== severity) return false;
      if (cutoff && new Date(entry.timestamp).getTime() < cutoff) return false;
      if (
        term &&
        !`${entry.title} ${entry.detail ?? ""} ${entry.reportId ?? ""}`
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [entries, source, severity, range, search]);

  function handleExport() {
    const header = ["timestamp", "source", "severity", "event", "detail", "report"];
    const rows = filtered.map((entry) => [
      entry.timestamp,
      entry.sourceLabel,
      entry.severity,
      entry.title,
      entry.detail ?? "",
      entry.reportId ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kiliplanner-audit-log.csv";
    link.click();
    URL.revokeObjectURL(url);
    recordConsoleActivity({
      type: "export",
      summary: "Exported the audit log",
      detail: `${filtered.length} entries`,
    });
  }

  const unreadable = results.filter((result) => result.error);
  const hasDeviceActivity = entries.some((entry) => entry.source === "console");

  return (
    <div className="space-y-6">
      {/* Source status - each source states whether it could be read. */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-border bg-card"
              />
            ))
          : results.map((result) => (
              <SourceCard key={result.source} result={result} />
            ))}
      </section>

      {unreadable.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-xs text-warning">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {unreadable.length} of {results.length} server sources could not be
            read with the signed-in role. The rows stay hidden until the
            database grants a read policy for planners.
          </span>
        </p>
      )}

      {/* Filters */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Search
            <span className="relative mt-1.5 block">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Event, report id"
                className="h-9 w-56 rounded-lg border border-input bg-card pl-8 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </span>
          </label>

          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Source
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="mt-1.5 block h-9 w-48 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm font-normal normal-case text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All sources</option>
              {results.map((result) => (
                <option key={result.source} value={result.source}>
                  {result.sourceLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Severity
            <select
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value as "all" | AuditSeverity)
              }
              className="mt-1.5 block h-9 w-40 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm font-normal normal-case text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Period
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as Range)}
              className="mt-1.5 block h-9 w-40 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm font-normal normal-case text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void load()}
              className="h-9 cursor-pointer gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="h-9 cursor-pointer gap-1.5"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Audit trail
            <span className="ml-2 font-normal text-muted-foreground">
              {filtered.length} of {entries.length} entries
            </span>
          </h2>
          {hasDeviceActivity && (
            <button
              type="button"
              onClick={() => {
                clearConsoleActivity();
                void load();
              }}
              className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              Clear this device's activity
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Reading the audit trail...
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted-foreground">
            No audit entries match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((entry) => (
              <AuditRow key={`${entry.source}-${entry.id}`} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SourceCard({ result }: { result: AuditSourceResult }) {
  const restricted = Boolean(result.error);
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">
          {result.sourceLabel}
        </p>
        {restricted ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
        ) : (
          <ScrollText
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
        {restricted ? "—" : result.entries.length}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[11px]",
          restricted ? "text-warning" : "text-muted-foreground",
        )}
      >
        {restricted
          ? "Read refused by row level security"
          : result.empty
            ? "Readable, no entries yet"
            : "Entries readable"}
      </p>
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const style = SEVERITY_STYLE[entry.severity];
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          entry.severity === "critical"
            ? "bg-destructive"
            : entry.severity === "warning"
              ? "bg-warning"
              : "bg-muted-foreground/50",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium text-foreground">{entry.title}</p>
          <span
            className={cn(
              "rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              style.className,
            )}
          >
            {style.label}
          </span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {entry.sourceLabel}
          </span>
        </div>
        {entry.detail && (
          <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">
            {entry.detail}
          </p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
          <span>{new Date(entry.timestamp).toLocaleString("en-KE")}</span>
          {entry.reportId && (
            <span className="font-mono">report {entry.reportId.slice(0, 8)}</span>
          )}
          {entry.actor && <span className="font-mono">actor {entry.actor.slice(0, 8)}</span>}
        </p>
      </div>
      {entry.severity === "critical" && (
        <ShieldAlert
          className="mt-1 h-4 w-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
      )}
    </li>
  );
}
