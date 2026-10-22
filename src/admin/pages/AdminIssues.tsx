import { useEffect, useState } from "react";
import type { IssueCategory } from "../../types/issue";
import IssueFilters from "../components/IssueFilters";
import IssueTable from "../components/IssueTable";
import { usePlannerIssues } from "../lib/usePlannerIssues";
import { getPlannerSettings } from "../lib/plannerSettings";
import { replacePlannerRoute } from "../lib/plannerAccess";
import type { PlannerStatusFilter } from "../lib/plannerStatus";

export default function AdminIssues({
  searchTerm = "",
  refreshKey = 0,
  initialStatus,
}: {
  searchTerm?: string;
  refreshKey?: number;
  /** The status the list opens on, taken from the URL. */
  initialStatus?: PlannerStatusFilter;
}) {
  const [category, setCategory] = useState<IssueCategory | "all">("all");
  const [status, setStatus] = useState<PlannerStatusFilter>(() => {
    if (initialStatus) return initialStatus;
    const configured = getPlannerSettings().defaultIssueFilter;
    return configured === "open"
      ? "open"
      : configured === "resolved"
        ? "resolved"
        : "all";
  });
  const [dateRange, setDateRange] = useState<"all" | "today" | "7d" | "30d">(
    "all",
  );
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const {
    issues: visibleIssues,
    total,
    loading,
    error,
  } = usePlannerIssues({
    searchTerm,
    category,
    status,
    dateRange,
    sort,
    page,
    pageSize,
    refreshKey,
  });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(
    () => setPage(1),
    [searchTerm, category, status, dateRange, sort],
  );

  // A status arriving in the URL - from the status board, or from a shared
  // link - opens the list on that status.
  useEffect(() => {
    if (!initialStatus) return;
    setStatus(initialStatus);
  }, [initialStatus]);

  /**
   * The filter lives in the URL as well as in the state, so the view a
   * planner is looking at can be handed to someone else, and so the back
   * button does not fill up with every filter change.
   */
  function handleStatusChange(value: PlannerStatusFilter) {
    setStatus(value);
    const params = new URLSearchParams(window.location.search);
    if (value === "all") params.delete("status");
    else params.set("status", value);
    const query = params.toString();
    replacePlannerRoute(query ? `/planner/issues?${query}` : "/planner/issues");
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Review, filter and coordinate infrastructure reports.
      </p>

      <IssueFilters
        category={category}
        status={status}
        dateRange={dateRange}
        sort={sort}
        onCategoryChange={setCategory}
        onStatusChange={handleStatusChange}
        onDateRangeChange={setDateRange}
        onSortChange={setSort}
      />

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
          Loading reports...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-10 text-center text-sm text-destructive">
          {error}
        </div>
      ) : visibleIssues.length > 0 ? (
        <IssueTable issues={visibleIssues} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium text-foreground">
            {total === 0 &&
            !searchTerm &&
            category === "all" &&
            status === "all" &&
            dateRange === "all"
              ? "No reports have been submitted yet."
              : "No issues match your filters."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try changing the search or filter selections.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              handleStatusChange("all");
              setDateRange("all");
              setSort("newest");
            }}
            className="mt-4 cursor-pointer rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Clear Filters
          </button>
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}{" "}
            of {total} reports
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
              className="cursor-pointer rounded-lg border border-input bg-card px-3 py-2 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page === pageCount}
              onClick={() => setPage((value) => value + 1)}
              className="cursor-pointer rounded-lg border border-input bg-card px-3 py-2 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
