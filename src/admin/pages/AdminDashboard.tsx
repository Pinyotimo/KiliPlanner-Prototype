import type { Issue, IssueCategory } from "../../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../types/issue";
import { CategoryIcon } from "../../components/CategoryIcon";
import StatCard from "../components/StatCard";
import IssueTable from "../components/IssueTable";
import IssueMap from "../components/IssueMap";
import ActivityTimeline from "../components/ActivityTimeline";

type AdminDashboardProps = { issues: Issue[] };

export default function AdminDashboard({ issues }: AdminDashboardProps) {
  const openCount = issues.filter((issue) =>
    ["UNVERIFIED", "UNDER_REVIEW", "CORROBORATED", "VERIFIED"].includes(
      issue.status,
    ),
  ).length;
  const resolvedCount = issues.filter(
    (issue) => issue.status === "RESOLVED",
  ).length;
  const todayCount = issues.filter(
    (issue) =>
      new Date(issue.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const categoryCounts = new Map<IssueCategory, number>();
  issues.forEach((issue) =>
    categoryCounts.set(
      issue.category,
      (categoryCounts.get(issue.category) ?? 0) + 1,
    ),
  );

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Reports"
          value={String(issues.length)}
          description="All infrastructure reports currently loaded."
          icon="▦"
          tone="neutral"
        />
        <StatCard
          label="New Reports"
          value={String(openCount)}
          description="Open reports requiring planner attention."
          icon="✦"
          tone="warning"
        />
        <StatCard
          label="Verified"
          value="—"
          description="Verification is not represented in the current schema."
          icon="✓"
          tone="neutral"
        />
        <StatCard
          label="In Progress"
          value="—"
          description="Work-in-progress status is not represented in the current schema."
          icon="↗"
          tone="neutral"
        />
        <StatCard
          label="Resolved"
          value={String(resolvedCount)}
          description="Reports with the existing resolved status."
          icon="✓"
          tone="success"
        />
        <StatCard
          label="High Priority"
          value="—"
          description="Severity and priority are not represented in the current schema."
          icon="!"
          tone="danger"
        />
      </div>

      <div className="mt-6">
        <IssueMap issues={issues} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">
            Reports by Category
          </h2>
          <div className="mt-5 space-y-4">
            {Array.from(categoryCounts.entries()).map(([category, count]) => (
              <div key={category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span
                      className="inline-flex items-center"
                      style={{ color: CATEGORY_COLORS[category] }}
                      aria-hidden="true"
                    >
                      <CategoryIcon category={category} className="h-3.5 w-3.5" />
                    </span>
                    {CATEGORY_LABELS[category]}
                  </span>
                  <strong className="tabular-nums">{count}</strong>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${
                        issues.length ? (count / issues.length) * 100 : 0
                      }%`,
                      backgroundColor: CATEGORY_COLORS[category],
                    }}
                  />
                </div>
              </div>
            ))}
            {categoryCounts.size === 0 && (
              <p className="text-sm text-muted-foreground">
                No reports have been submitted yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">
            Reports by Status
          </h2>
          <div className="mt-5 space-y-3">
            {(
              [
                ["open", openCount, "var(--status-2)"],
                ["resolved", resolvedCount, "var(--status-5)"],
              ] as const
            ).map(([status, count, fill]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg bg-muted/60 p-3 text-sm"
              >
                <span className="flex items-center gap-2 capitalize text-foreground">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: fill }}
                    aria-hidden="true"
                  />
                  {status}
                </span>
                <strong className="tabular-nums">{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">
            Priority Attention
          </h2>
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/50 p-5 text-sm text-muted-foreground">
            No critical infrastructure issues require immediate attention.
            Severity is not tracked in the current database schema.
          </p>
        </section>
        <ActivityTimeline />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Recent Reports
            </h2>
            <p className="text-xs text-muted-foreground">
              {todayCount} submitted today.
            </p>
          </div>
        </div>
        <IssueTable issues={issues.slice(0, 10)} />
      </div>
    </div>
  );
}
