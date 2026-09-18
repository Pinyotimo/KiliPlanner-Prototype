import { useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Issue, IssueCategory } from "../../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../types/issue";
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

export default function AdminAnalytics({ issues }: { issues: Issue[] }) {
  const [range, setRange] = useState<Range>(30);
  const now = new Date();
  const weekStart = startOfDay(new Date(now.getTime() - 7 * 86400000));
  const monthStart = startOfDay(new Date(now.getTime() - 30 * 86400000));
  const resolved = issues.filter((issue) => issue.status === "RESOLVED").length;
  const open = issues.filter((issue) => ["UNVERIFIED", "UNDER_REVIEW", "CORROBORATED", "VERIFIED"].includes(issue.status)).length;
  const categoryCounts = new Map<IssueCategory, number>();
  issues.forEach((issue) =>
    categoryCounts.set(
      issue.category,
      (categoryCounts.get(issue.category) ?? 0) + 1,
    ),
  );
  const buckets = Array.from(
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
    if (index >= 0 && index < buckets.length) buckets[index].count += 1;
  });
  const concentration = new Map<string, number>();
  issues.forEach((issue) => {
    const key = `${issue.lat.toFixed(3)}, ${issue.lng.toFixed(3)}`;
    concentration.set(key, (concentration.get(key) ?? 0) + 1);
  });
  const hotspots = Array.from(concentration.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);

  const chartStyles = getComputedStyle(document.documentElement);
  const trendData = {
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
        borderColor: chartStyles.getPropertyValue("--chart-primary").trim(),
        backgroundColor: chartStyles
          .getPropertyValue("--chart-primary-soft")
          .trim(),
        fill: true,
        tension: 0.25,
      },
    ],
  };
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  };

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

      <section className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Report Trend
            </h2>
            <p className="text-sm text-muted-foreground">
              Reports submitted per {range === 90 ? "week" : "day"}.
            </p>
          </div>
          <div className="flex rounded-lg bg-background p-1">
            {([7, 30, 90] as Range[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${range === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {value} days
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 h-56">
          <Line data={trendData} options={trendOptions} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-foreground/10">
          <h2 className="text-lg font-semibold text-foreground">
            Category Analytics
          </h2>
          <div className="mt-4 space-y-3">
            {Array.from(categoryCounts.entries()).map(([category, count]) => (
              <div key={category}>
                <div className="flex justify-between text-sm">
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span className="font-medium">
                    {count} ·{" "}
                    {issues.length
                      ? Math.round((count / issues.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-background">
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
        <section className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-foreground/10">
          <h2 className="text-lg font-semibold text-foreground">
            Status Analytics
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between rounded-lg bg-background p-3 text-sm">
              <span>Open</span>
              <strong>{open}</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-background p-3 text-sm">
              <span>Resolved</span>
              <strong>{resolved}</strong>
            </div>
            <p className="pt-2 text-xs leading-5 text-muted-foreground">
              Verified, assigned, in progress, and closed statuses are not
              present in the current schema.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Severity Analytics
          </h2>
          <p className="mt-4 rounded-lg border border-dashed border-input bg-muted p-5 text-sm text-foreground">
            Severity counts will become available once severity is recorded on
            reports.
          </p>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Resolution Analytics
          </h2>
          <p className="mt-4 rounded-lg border border-dashed border-input bg-muted p-5 text-sm text-foreground">
            Resolution-time analytics will become available once sufficient
            resolution history is recorded.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Report concentration
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approximate coordinate clusters, not a measure of infrastructure
          failure rates.
        </p>
        <div className="mt-4 space-y-2">
          {hotspots.map(([location, count]) => (
            <div
              key={location}
              className="flex justify-between rounded-lg bg-muted p-3 text-sm"
            >
              <span className="font-mono text-foreground">{location}</span>
              <strong>{count} reports</strong>
            </div>
          ))}
          {!hotspots.length && (
            <p className="text-sm text-muted-foreground">
              No coordinate data is available.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
