import type { IssueCategory, IssueStatus } from '../../types/issue';
import { CATEGORY_LABELS } from '../../types/issue';

type IssueFiltersProps = {
  category: IssueCategory | "all";
  status: IssueStatus | "all";
  dateRange: "all" | "today" | "7d" | "30d";
  sort: "newest" | "oldest";
  onCategoryChange: (value: IssueCategory | "all") => void;
  onStatusChange: (value: IssueStatus | "all") => void;
  onDateRangeChange: (value: IssueFiltersProps["dateRange"]) => void;
  onSortChange: (value: IssueFiltersProps["sort"]) => void;
};

const categories: IssueCategory[] = ["water", "sewage", "waste", "pollution", "road_damage", "encroachment", "other"];

export default function IssueFilters({ category, status, dateRange, sort, onCategoryChange, onStatusChange, onDateRangeChange, onSortChange }: IssueFiltersProps) {
  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category<select value={category} onChange={(event) => onCategoryChange(event.target.value as IssueCategory | "all")} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-700"><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status<select value={status} onChange={(event) => onStatusChange(event.target.value as IssueStatus | "all")} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-700"><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option></select></label>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date<select value={dateRange} onChange={(event) => onDateRangeChange(event.target.value as IssueFiltersProps["dateRange"])} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-700"><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort<select value={sort} onChange={(event) => onSortChange(event.target.value as IssueFiltersProps["sort"])} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-700"><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
    </div>
  );
}
