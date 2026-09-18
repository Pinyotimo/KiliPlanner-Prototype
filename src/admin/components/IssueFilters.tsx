import type { IssueCategory, IssueStatus } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";

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

<<<<<<< HEAD
const categories: IssueCategory[] = ["water", "sewage", "waste", "pollution", "road_damage", "construction", "land_planning", "drainage", "encroachment", "other"];
=======
const categories: IssueCategory[] = [
  "security",
  "water",
  "sewage",
  "waste",
  "pollution",
  "road_damage",
  "encroachment",
  "green_project",
  "other",
];
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37

export default function IssueFilters({
  category,
  status,
  dateRange,
  sort,
  onCategoryChange,
  onStatusChange,
  onDateRangeChange,
  onSortChange,
}: IssueFiltersProps) {
  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
<<<<<<< HEAD
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category<select value={category} onChange={(event) => onCategoryChange(event.target.value as IssueCategory | "all")} className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status<select value={status} onChange={(event) => onStatusChange(event.target.value as IssueStatus | "all")} className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"><option value="all">All statuses</option><option value="UNVERIFIED">Under verification</option><option value="UNDER_REVIEW">Under review</option><option value="CORROBORATED">Corroborated</option><option value="VERIFIED">Verified</option><option value="RESOLVED">Resolved</option><option value="REJECTED">Rejected</option></select></label>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date<select value={dateRange} onChange={(event) => onDateRangeChange(event.target.value as IssueFiltersProps["dateRange"])} className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort<select value={sort} onChange={(event) => onSortChange(event.target.value as IssueFiltersProps["sort"])} className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
=======
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Category
        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value as IssueCategory | "all")
          }
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"
        >
          <option value="all">All categories</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Status
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as IssueStatus | "all")
          }
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Date
        <select
          value={dateRange}
          onChange={(event) =>
            onDateRangeChange(
              event.target.value as IssueFiltersProps["dateRange"],
            )
          }
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"
        >
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sort
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as IssueFiltersProps["sort"])
          }
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </label>
>>>>>>> a0beaf8851eff69b47c4dbf63327487566691e37
    </div>
  );
}
