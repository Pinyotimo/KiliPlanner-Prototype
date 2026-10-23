import type { IssueCategory } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";
import {
  STATUS_FILTER_OPTIONS,
  type PlannerStatusFilter,
} from "../lib/plannerStatus";

type IssueFiltersProps = {
  category: IssueCategory | "all";
  status: PlannerStatusFilter;
  dateRange: "all" | "today" | "7d" | "30d";
  sort: "newest" | "oldest";
  onCategoryChange: (value: IssueCategory | "all") => void;
  onStatusChange: (value: PlannerStatusFilter) => void;
  onDateRangeChange: (value: IssueFiltersProps["dateRange"]) => void;
  onSortChange: (value: IssueFiltersProps["sort"]) => void;
};

const categories: IssueCategory[] = [
  "security",
  "water",
  "sewage",
  "waste",
  "pollution",
  "road_damage",
  "construction",
  "land_planning",
  "drainage",
  "encroachment",
  "green_project",
  "other",
];

/** Shared control styling for the four filter selects. */
const selectClass =
  "mt-1.5 block w-full cursor-pointer rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

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
    <div className="mb-5 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Category
        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value as IssueCategory | "all")
          }
          className={selectClass}
        >
          <option value="all">All categories</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Status
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as PlannerStatusFilter)
          }
          className={selectClass}
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Date
        <select
          value={dateRange}
          onChange={(event) =>
            onDateRangeChange(
              event.target.value as IssueFiltersProps["dateRange"],
            )
          }
          className={selectClass}
        >
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </label>

      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sort
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as IssueFiltersProps["sort"])
          }
          className={selectClass}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </label>
    </div>
  );
}
