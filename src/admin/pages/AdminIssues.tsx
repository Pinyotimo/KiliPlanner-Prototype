import { useEffect, useState } from "react";
import type { IssueCategory, IssueStatus } from '../../types/issue';
import IssueFilters from '../components/IssueFilters';
import IssueTable from '../components/IssueTable';
import { usePlannerIssues } from '../lib/usePlannerIssues';
import { getPlannerSettings } from "../lib/plannerSettings";

export default function AdminIssues({ searchTerm = "", refreshKey = 0 }: { searchTerm?: string; refreshKey?: number }) {
  const [category, setCategory] = useState<IssueCategory | "all">("all");
  const [status, setStatus] = useState<IssueStatus | "all">(() => getPlannerSettings().defaultIssueFilter);
  const [dateRange, setDateRange] = useState<"all" | "today" | "7d" | "30d">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { issues: visibleIssues, total, loading, error } = usePlannerIssues({ searchTerm, category, status, dateRange, sort, page, pageSize, refreshKey });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => setPage(1), [searchTerm, category, status, dateRange, sort]);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Review, filter and coordinate infrastructure reports.</p>
      <IssueFilters category={category} status={status} dateRange={dateRange} sort={sort} onCategoryChange={setCategory} onStatusChange={setStatus} onDateRangeChange={setDateRange} onSortChange={setSort} />
      {loading ? <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading reports...</div> : error ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-10 text-center text-sm text-destructive">{error}</div> : visibleIssues.length > 0 ? <IssueTable issues={visibleIssues} /> : <div className="rounded-xl border border-dashed border-input bg-card p-10 text-center"><p className="font-medium text-foreground">{total === 0 && !searchTerm && category === "all" && status === "all" && dateRange === "all" ? "No reports have been submitted yet." : "No issues match your filters."}</p><p className="mt-2 text-sm text-muted-foreground">Try changing the search or filter selections.</p><button type="button" onClick={() => { setCategory("all"); setStatus("all"); setDateRange("all"); setSort("newest"); }} className="mt-4 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Clear Filters</button></div>}
      {total > 0 && <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} reports</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-input bg-card px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-input bg-card px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
    </div>
  );
}
