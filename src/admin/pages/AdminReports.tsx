import type { Issue } from "../../types/issue";
import { useState } from "react";
import type { IssueCategory, IssueStatus } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";

type AdminReportsProps = {
  issues: Issue[];
};

export default function AdminReports({ issues }: AdminReportsProps) {
  const [category, setCategory] = useState<IssueCategory | "all">("all");
  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [dateRange, setDateRange] = useState("all");
  const filteredIssues = issues.filter((issue) => {
    const age = Date.now() - new Date(issue.created_at).getTime();
    return (category === "all" || issue.category === category) && (status === "all" || issue.status === status) && (dateRange === "all" || age <= Number(dateRange) * 86400000);
  });

  function downloadCsv() {
    const headers = ["Issue ID", "Category", "Status", "Description", "Latitude", "Longitude", "Location", "Reported Date"];
    const rows = filteredIssues.map((issue) => [issue.id, CATEGORY_LABELS[issue.category], issue.status, issue.description, issue.lat, issue.lng, issue.address ?? "", issue.created_at].map((value) => JSON.stringify(value)).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kiliplanner-issues.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reports / Export</h2>
          <p className="mt-1 text-sm text-slate-500">Export the currently loaded issue records using the existing database fields.</p>
        </div>
        <button onClick={downloadCsv} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Download CSV
        </button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date<select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-700"><option value="all">All time</option><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category<select value={category} onChange={(event) => setCategory(event.target.value as IssueCategory | "all")} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-700"><option value="all">All categories</option>{Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status<select value={status} onChange={(event) => setStatus(event.target.value as IssueStatus | "all")} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case text-slate-700"><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option></select></label></div>
      <p className="mt-6 text-sm text-slate-600">{filteredIssues.length} matching issue records available. Severity and updated date are not exported because they are not stored.</p>
    </section>
  );
}