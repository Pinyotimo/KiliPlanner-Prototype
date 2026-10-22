import type { Issue } from "../../types/issue";
import { useState } from "react";
import type { IssueCategory, IssueStatus } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";
import { Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import { recordConsoleActivity } from "../lib/auditLog";

type AdminReportsProps = {
  issues: Issue[];
};

export default function AdminReports({ issues }: AdminReportsProps) {
  const [category, setCategory] = useState<IssueCategory | "all">("all");
  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [dateRange, setDateRange] = useState("all");
  const filteredIssues = issues.filter((issue) => {
    const age = Date.now() - new Date(issue.created_at).getTime();
    return (
      (category === "all" || issue.category === category) &&
      (status === "all" || issue.status === status) &&
      (dateRange === "all" || age <= Number(dateRange) * 86400000)
    );
  });

  function downloadCsv() {
    const headers = [
      "Issue ID",
      "Category",
      "Status",
      "Description",
      "Latitude",
      "Longitude",
      "Location",
      "Reported Date",
    ];
    const rows = filteredIssues.map((issue) =>
      [
        issue.id,
        CATEGORY_LABELS[issue.category],
        issue.status,
        issue.description,
        issue.lat,
        issue.lng,
        issue.address ?? "",
        issue.created_at,
      ]
        .map((value) => JSON.stringify(value))
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kiliplanner-issues.csv";
    link.click();
    URL.revokeObjectURL(url);
    recordConsoleActivity({
      type: "export",
      summary: "Exported the issue records",
      detail: `${filteredIssues.length} rows, filter ${category} / ${status}`,
    });
  }

  const selectClass =
    "mt-1.5 block w-full cursor-pointer rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Reports / Export
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Export the currently loaded issue records using the existing
            database fields.
          </p>
        </div>
        <Button onClick={downloadCsv}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download CSV
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Date
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className={selectClass}
          >
            <option value="all">All time</option>
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </label>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Category
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as IssueCategory | "all")
            }
            className={selectClass}
          >
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Status
          <select
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
        </label>
      </div>

      <p className="mt-6 text-sm text-foreground">
        {filteredIssues.length} matching issue records available. Severity and
        updated date are not exported because they are not stored.
      </p>
    </section>
  );
}
