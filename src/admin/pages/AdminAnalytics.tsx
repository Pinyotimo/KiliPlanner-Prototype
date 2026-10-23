import { useMemo, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Issue, IssueCategory } from "../../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../types/issue";
import { useChartTokens, withAlpha } from "../../lib/chartTheme";
import { oklchToHex } from "../../theme/themes";
import StatCard from "../components/StatCard";

type Range = 7 | 30 | 90;

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Tooltip,
);

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Canvas-safe colour helpers.
 *
 * Chart.js paints onto a canvas, where `var()`, `calc()` and `color-mix()`
 * are not dependable, so a token is resolved to a literal colour first and
 * an oklch token is converted to hex before it reaches the canvas.
 */
const VAR_PATTERN = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g;
const CALC_PATTERN = /calc\(([^()]*)\)/g;

/** Evaluates the tiny arithmetic the token layer uses: `a * b` and `a + b`. */
function evalNumber(expression: string): number | null {
  const cleaned = expression.trim();
  const multiply = cleaned.split("*");
  if (multiply.length === 2) {
    const left = Number(multiply[0]);
    const right = Number(multiply[1]);
    if (!Number.isNaN(left) && !Number.isNaN(right)) return left * right;
  }
  const add = cleaned.split("+");
  if (add.length === 2) {
    const left = Number(add[0]);
    const right = Number(add[1]);
    if (!Number.isNaN(left) && !Number.isNaN(right)) return left + right;
  }
  const value = Number(cleaned);
  return Number.isNaN(value) ? null : value;
}

/** Substitutes any `var(--token)` reference with its resolved value. */
function resolveVars(value: string, depth = 0): string {
  if (depth > 4 || !value.includes("var(")) return value;
  if (typeof document === "undefined") return value;
  const styles = getComputedStyle(document.documentElement);
  return value.replace(
    VAR_PATTERN,
    (_match, name: string, fallback?: string) => {
      const resolved = styles.getPropertyValue(name).trim();
      if (resolved) return resolveVars(resolved, depth + 1);
      return (fallback ?? "").trim();
    },
  );
}

/** Evaluates any `calc(...)` left in the token. */
function resolveCalcs(value: string): string {
  if (!value.includes("calc(")) return value;
  return value.replace(CALC_PATTERN, (_match, expression: string) => {
    const result = evalNumber(expression);
    return result === null ? "0" : String(result);
  });
}

/** Reads an `oklch(L C H)` colour, ignoring any alpha component. */
function parseOklch(value: string) {
  const match = value.match(/^oklch\((.*)\)$/);
  if (!match) return null;
  const body = match[1].split("/")[0].trim();
  const parts = body.split(/\s+/);
  if (parts.length < 3) return null;
  const numbers = parts.slice(0, 3).map((part) => evalNumber(part));
  if (numbers.some((value) => value === null)) return null;
  const [lightness, chroma, hue] = numbers as number[];
  return { lightness, chroma, hue };
}

/** A token as a literal colour the canvas can paint. */
function toCanvasColor(value: string): string {
  const resolved = resolveCalcs(resolveVars(value.trim()));
  const oklch = parseOklch(resolved);
  if (!oklch) return resolved;
  return oklchToHex(oklch.lightness, oklch.chroma, oklch.hue);
}

export default function AdminAnalytics({ issues }: { issues: Issue[] }) {
  const [range, setRange] = useState<Range>(30);
  // Re-reads the resolved chart colours whenever the theme changes, so the
  // chart follows the mode and accent instead of freezing at first paint.
  const tokens = useChartTokens();

  // The tokens are CSS values; a canvas needs literals, so each one is
  // resolved to a paintable colour.
  const palette = useMemo(
    () => ({
      surface: toCanvasColor(tokens.surface),
      grid: toCanvasColor(tokens.grid),
      axis: toCanvasColor(tokens.axis),
      ink: toCanvasColor(tokens.ink),
      inkMuted: toCanvasColor(tokens.inkMuted),
      border: toCanvasColor(tokens.border),
      primary: toCanvasColor(tokens.primary),
    }),
    [tokens],
  );

  // Day-granular anchor. It only changes when the calendar day rolls over,
  // which keeps the memoised buckets stable between renders.
  const todayKey = new Date().toDateString();

  const weekStart = useMemo(
    () => startOfDay(new Date(Date.now() - 7 * 86400000)),
    [todayKey],
  );
  const monthStart = useMemo(
    () => startOfDay(new Date(Date.now() - 30 * 86400000)),
    [todayKey],
  );
  const resolved = issues.filter(
    (issue) => issue.status === "RESOLVED",
  ).length;
  const open = issues.filter((issue) =>
    ["UNVERIFIED", "UNDER_REVIEW", "CORROBORATED", "VERIFIED"].includes(
      issue.status,
    ),
  ).length;

  const categoryCounts = useMemo(() => {
    const counts = new Map<IssueCategory, number>();
    issues.forEach((issue) =>
      counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1),
    );
    return counts;
  }, [issues]);

  const buckets = useMemo(() => {
    const now = new Date();
    const list = Array.from(
      { length: range === 90 ? 13 : range },
      (_, index) => {
        const date = new Date(now);
        if (range === 90) date.setDate(now.getDate() - (12 - index) * 7);
        else date.setDate(now.getDate() - (range - 1 - index));
        return { date: startOfDay(date), count: 0 };
      },
    );
    issues.forEach((issue) => {
      const created = new Date(issue.created_at).getTime();
      const bucket =
        range === 90
          ? Math.floor(
              (startOfDay(now).getTime() -
                startOfDay(new Date(created)).getTime()) /
                86400000 /
                7,
            )
          : Math.floor(
              (startOfDay(now).getTime() -
                startOfDay(new Date(created)).getTime()) /
                86400000,
            );
      const index = range === 90 ? 12 - bucket : range - 1 - bucket;
      if (index >= 0 && index < list.length) list[index].count += 1;
    });
    return list;
  }, [issues, range, todayKey]);

  const concentration = useMemo(() => {
    const counts = new Map<string, number>();
    issues.forEach((issue) => {
      const key = `${issue.lat.toFixed(3)}, ${issue.lng.toFixed(3)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [issues]);

  // One series, one y-axis: the report volume line. Both objects are
  // memoised on the palette so the chart repaints on a theme change and stays
  // still otherwise.
  const trendData: ChartData<"line"> = useMemo(
    () => ({
      labels: buckets.map((bucket) =>
        bucket.date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      ),
      datasets: [
        {
          label: "Reports",
          data: buckets.map((bucket) => bucket.count),
          borderColor: palette.primary,
          backgroundColor: withAlpha(palette.primary, 0.16),
          pointBackgroundColor: palette.primary,
          pointBorderColor: palette.surface,
          pointHoverBackgroundColor: palette.primary,
          pointHoverBorderColor: palette.surface,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.3,
        },
      ],
    }),
    [buckets, palette],
  );

  const trendOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.surface,
          titleColor: palette.ink,
          bodyColor: palette.inkMuted,
          borderColor: palette.border,
          borderWidth: 1,
          titleFont: { size: 12, weight: 600 },
          bodyFont: { size: 12 },
          padding: 10,
          displayColors: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: palette.grid, drawTicks: false },
          border: { display: false },
          ticks: {
            color: palette.axis,
            precision: 0,
            font: { size: 11 },
            padding: 8,
          },
        },
        x: {
          grid: { display: false },
          border: { color: palette.grid },
          ticks: {
            color: palette.axis,
            font: { size: 11 },
            maxRotation: 0,
            autoSkipPadding: 16,
          },
        },
      },
    }),
    [palette],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Reports"
          value={String(issues.length)}
          description="All reports returned from Supabase."
          icon="▦"
        />
        <StatCard
          label="Open Reports"
          value={String(open)}
          description="Reports with the existing open status."
          icon="○"
          tone="warning"
        />
        <StatCard
          label="Resolved Reports"
          value={String(resolved)}
          description="Reports with the existing resolved status."
          icon="✓"
          tone="success"
        />
        <StatCard
          label="Resolution Rate"
          value={
            issues.length
              ? `${Math.round((resolved / issues.length) * 100)}%`
              : "0%"
          }
          description="Resolved reports as a share of all reports."
          icon="%"
          tone="success"
        />
        <StatCard
          label="High/Critical Reports"
          value="—"
          description="Severity is not stored in the current database."
          icon="!"
          tone="danger"
        />
        <StatCard
          label="Reports This Week"
          value={String(
            issues.filter((issue) => new Date(issue.created_at) >= weekStart)
              .length,
          )}
          description="Created during the last 7 days."
          icon="7"
        />
        <StatCard
          label="Reports This Month"
          value={String(
            issues.filter((issue) => new Date(issue.created_at) >= monthStart)
              .length,
          )}
          description="Created during the last 30 days."
          icon="30"
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Report Trend
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Reports submitted per {range === 90 ? "week" : "day"}.
            </p>
          </div>
          <div
            className="flex rounded-lg bg-muted p-1"
            role="group"
            aria-label="Trend range"
          >
            {([7, 30, 90] as Range[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                aria-pressed={range === value}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === value
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value} days
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 h-56">
          {/* The key changes with the resolved palette, so Chart.js rebuilds
              the canvas with the new colours instead of keeping the old
              configuration on the instance. */}
          <Line
            key={`${palette.primary}|${palette.surface}|${palette.grid}|${palette.axis}|${palette.ink}`}
            data={trendData}
            options={trendOptions}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">
            Category Analytics
          </h2>
          <div className="mt-4 space-y-3">
            {Array.from(categoryCounts.entries()).map(([category, count]) => (
              <div key={category}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {count} ·{" "}
                    {issues.length
                      ? Math.round((count / issues.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${issues.length ? (count / issues.length) * 100 : 0}%`,
                      backgroundColor: CATEGORY_COLORS[category],
                    }}
                  />
                </div>
              </div>
            ))}
            {!categoryCounts.size && (
              <p className="text-sm text-muted-foreground">
                No reports have been submitted yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">
            Status Analytics
          </h2>
          <div className="mt-4 space-y-3">
            {/* The pipeline is an ordered scale, so it takes one hue in
                stepped lightness. Each row names its state, so the ramp is
                a supporting cue rather than the only signal. */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--status-2)" }}
                  aria-hidden="true"
                />
                Open
              </span>
              <strong className="tabular-nums">{open}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--status-5)" }}
                  aria-hidden="true"
                />
                Resolved
              </span>
              <strong className="tabular-nums">{resolved}</strong>
            </div>
            <p className="pt-2 text-xs leading-5 text-muted-foreground">
              Verified, assigned, in progress, and closed statuses are not
              present in the current schema.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">
            Severity Analytics
          </h2>
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/50 p-5 text-sm text-muted-foreground">
            Severity counts will become available once severity is recorded on
            reports.
          </p>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">
            Resolution Analytics
          </h2>
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/50 p-5 text-sm text-muted-foreground">
            Resolution-time analytics will become available once sufficient
            resolution history is recorded.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground">
          Report concentration
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Approximate coordinate clusters, not a measure of infrastructure
          failure rates.
        </p>
        <div className="mt-4 space-y-2">
          {concentration.map(([location, count]) => (
            <div
              key={location}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3 text-sm"
            >
              <span className="font-mono text-foreground">{location}</span>
              <strong className="tabular-nums">{count} reports</strong>
            </div>
          ))}
          {!concentration.length && (
            <p className="text-sm text-muted-foreground">
              No coordinate data is available.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
