import { useMemo } from "react";
import { ArrowRight, ListChecks } from "lucide-react";
import type { Issue } from "../../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../types/issue";
import StatusBadge from "../components/StatusBadge";
import { CategoryIcon } from "../../components/CategoryIcon";
import { navigateToPlanner } from "../lib/plannerAccess";
import {
  STATUS_ORDER,
  STATUS_RUNGS,
  canonicalStatusFilter,
  statusFilterLabel,
  type PlannerStatus,
} from "../lib/plannerStatus";

/**
 * The status board.
 *
 * A planner's first question is not "which reports exist" but "where has
 * each one got to". This page answers that twice over: the verification
 * pipeline with a count on every rung, and below it the reports grouped by
 * the state they are actually stored in.
 *
 * It shows the state that is stored, not the state the pipeline would
 * prefer - a report nobody has touched says "Open", not "Under
 * verification", because that is what the row says.
 */
export default function AdminStatus({ issues }: { issues: Issue[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of issues) {
      const list = map.get(issue.status) ?? [];
      list.push(issue);
      map.set(issue.status, list);
    }
    const rank = (status: string) => {
      const index = STATUS_ORDER.indexOf(status as PlannerStatus);
      // A state the console does not know sorts last, not first.
      return index === -1 ? STATUS_ORDER.length : index;
    };
    return [...map.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  }, [issues]);

  /** How many reports sit on a rung of the status ramp. */
  const rungCount = (filters: string[]) =>
    issues.filter((issue) => filters.includes(canonicalStatusFilter(issue.status)))
      .length;

  const rejected = issues.filter((issue) => issue.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Every report, and the state it is in. New reports arrive as{" "}
        <strong className="text-foreground">Open</strong> and move through
        the pipeline once a planner has reviewed them.
      </p>

      {/* The pipeline, with a count on every rung */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Verification pipeline
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {STATUS_RUNGS.map((rung) => {
            const count = rungCount(rung.filters);
            return (
              <li
                key={rung.rung}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft"
              >
                <span
                  className={
                    count === 0
                      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold tabular-nums text-muted-foreground"
                      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums"
                  }
                  style={
                    count === 0
                      ? undefined
                      : {
                          backgroundColor: `var(--status-${rung.rung})`,
                          color: `var(--status-${rung.rung}-ink)`,
                        }
                  }
                  aria-hidden="true"
                >
                  {count}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {rung.label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {count === 1 ? "1 report" : `${count} reports`}
                    {rung.filters.length > 1 && (
                      <>
                        {" · "}
                        {rung.filters.map(statusFilterLabel).join(", ")}
                      </>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
          <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
            <span
              className={
                rejected === 0
                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold tabular-nums text-muted-foreground"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-sm font-bold tabular-nums text-destructive"
              }
              aria-hidden="true"
            >
              {rejected}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                Rejected
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {rejected === 1 ? "1 report" : `${rejected} reports`}
              </span>
            </span>
          </li>
        </ol>
      </section>

      {/* The groups, as the data actually holds them */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Reports by status
        </h2>
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-medium text-foreground">
              No reports have been submitted yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(([status, group]) => (
              <div
                key={status}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">
                      {group.length === 1
                        ? "1 report"
                        : `${group.length} reports`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigateToPlanner(
                        `/planner/issues?status=${canonicalStatusFilter(status)}`,
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Open in issues
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
                <ul className="divide-y divide-border">
                  {group.slice(0, 5).map((issue) => (
                    <li key={issue.id}>
                      <button
                        type="button"
                        onClick={() =>
                          navigateToPlanner(`/planner/issues/${issue.id}`)
                        }
                        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {issue.description}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                            {CATEGORY_LABELS[issue.category]} ·{" "}
                            {issue.address ||
                              `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}{" "}
                            ·{" "}
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                        </span>
                        <span
                          className="mt-0.5 shrink-0"
                          style={{ color: CATEGORY_COLORS[issue.category] }}
                          aria-hidden="true"
                        >
                          <CategoryIcon
                            category={issue.category}
                            className="h-4 w-4"
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                  {group.length > 5 && (
                    <li className="px-4 py-2.5 text-[11px] text-muted-foreground">
                      {group.length - 5} more in this state -{" "}
                      <button
                        type="button"
                        onClick={() =>
                          navigateToPlanner(
                            `/planner/issues?status=${canonicalStatusFilter(status)}`,
                          )
                        }
                        className="cursor-pointer font-semibold text-primary hover:underline"
                      >
                        open the filtered list
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {issues.length > 0 && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          Showing {issues.length} reports in total.
        </p>
      )}
    </div>
  );
}
