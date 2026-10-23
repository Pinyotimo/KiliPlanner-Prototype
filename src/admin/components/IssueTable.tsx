import { ArrowRight } from "lucide-react";
import { navigateToPlanner } from "../lib/plannerAccess";
import type { Issue } from "../../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../types/issue";
import { CategoryIcon } from "../../components/CategoryIcon";
import StatusBadge from "./StatusBadge";

type IssueTableProps = {
  issues: Issue[];
};

export default function IssueTable({ issues }: IssueTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="hidden min-w-full divide-y divide-border text-left text-sm md:table">
          <thead className="bg-muted/60">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Report
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Location
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Reported
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {issues.map((issue) => (
              <tr
                key={issue.id}
                className="transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-3">
                  <div className="max-w-xs font-medium text-foreground">
                    {issue.description}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {issue.id}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                    <span
                      className="inline-flex items-center"
                      style={{ color: CATEGORY_COLORS[issue.category] }}
                      aria-hidden="true"
                    >
                      <CategoryIcon
                        category={issue.category}
                        className="h-3.5 w-3.5"
                      />
                    </span>
                    {CATEGORY_LABELS[issue.category]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={issue.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {issue.address ||
                    `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {new Date(issue.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    onClick={() =>
                      navigateToPlanner(`/planner/issues/${issue.id}`)
                    }
                  >
                    View
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card list on small screens */}
      <div className="space-y-3 p-3 md:hidden">
        {issues.map((issue) => (
          <button
            key={issue.id}
            type="button"
            onClick={() => navigateToPlanner(`/planner/issues/${issue.id}`)}
            className="block w-full cursor-pointer rounded-lg border border-border bg-surface-raised/40 p-4 text-left transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium text-foreground">
                {issue.description}
              </span>
              <StatusBadge status={issue.status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {issue.id} · {CATEGORY_LABELS[issue.category]}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {issue.address ||
                `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
