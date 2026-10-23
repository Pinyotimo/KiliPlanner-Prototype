import { useState } from "react";
import type { Issue } from "../../types/issue";
import type { IssueCategory, IssueStatus } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";
import MapView from "../../components/MapView";
import StatusBadge from "../components/StatusBadge";
import { navigateToPlanner } from "../lib/plannerAccess";
import { cn } from "@/lib/utils";

export default function AdminMapPage({ issues }: { issues: Issue[] }) {
  const [category, setCategory] = useState<IssueCategory | "all">("all");
  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string>();
  const filteredIssues = issues.filter(
    (issue) =>
      (category === "all" || issue.category === category) &&
      (status === "all" || issue.status === status),
  );

  const selectClass =
    "cursor-pointer rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
        <label className="sr-only" htmlFor="admin-map-category">
          Filter by category
        </label>
        <select
          id="admin-map-category"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as IssueCategory | "all")
          }
          className={selectClass}
        >
          <option value="all">All categories</option>
          {Object.keys(CATEGORY_LABELS).map((key) => (
            <option key={key} value={key}>
              {CATEGORY_LABELS[key as IssueCategory]}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="admin-map-status">
          Filter by status
        </label>
        <select
          id="admin-map-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as IssueStatus | "all")
          }
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>

        <span className="text-xs text-muted-foreground">
          Severity filtering is unavailable because severity is not stored.
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="h-[calc(100vh-22rem)] min-h-[24rem] lg:h-[calc(100vh-15rem)] lg:min-h-[28rem]">
            <MapView
              issues={filteredIssues}
              selectedIssueId={selectedId}
              onIssueSelect={(issue) => setSelectedId(issue.id)}
              onValidClick={() => undefined}
              mode="monitor"
              framed={false}
              actionLabel="Select this report"
            />
          </div>
          {/* The key has to describe what the map actually draws. Pins are
              coloured by service family, not by status - the only status the
              map shows is a greyed-out pin for an unverified report. */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3 text-xs text-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="mr-1 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "var(--category-security)" }}
                aria-hidden="true"
              />
              Pin colour is the service family - see the legend on the map
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/40"
                aria-hidden="true"
              />
              Greyed out - not yet verified
            </span>
          </div>
        </div>

        <aside className="max-h-[calc(100vh-22rem)] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-soft lg:max-h-[calc(100vh-15rem)]">
          <h2 className="text-sm font-semibold text-foreground">
            Reports on map
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredIssues.length} reports shown
          </p>
          <div className="mt-4 space-y-2">
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => setSelectedId(issue.id)}
                className={cn(
                  "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors",
                  selectedId === issue.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 text-sm font-medium text-foreground">
                    {issue.description}
                  </span>
                  <StatusBadge status={issue.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {CATEGORY_LABELS[issue.category]} ·{" "}
                  {issue.address ||
                    `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                </p>
                <span
                  onClick={(event) => {
                    event.stopPropagation();
                    navigateToPlanner(`/planner/issues/${issue.id}`);
                  }}
                  className="mt-2 inline-block cursor-pointer text-xs font-semibold text-primary hover:underline"
                >
                  View Details
                </span>
              </button>
            ))}
            {filteredIssues.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No reports match these filters.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
