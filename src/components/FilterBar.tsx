import type { IssueCategory, IssueStatus } from "../types/issue";
import { CATEGORY_LABELS } from "../types/issue";

interface FilterBarProps {
  selectedCategory: IssueCategory | "all";
  onCategoryChange: (category: IssueCategory | "all") => void;
  selectedStatus: IssueStatus | "all";
  onStatusChange: (status: IssueStatus | "all") => void;
}

const CATEGORIES: (IssueCategory | "all")[] = [
  "all",
  "water",
  "sewage",
  "waste",
  "pollution",
  "road_damage",
  "encroachment",
  "other",
];

export default function FilterBar({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md flex flex-wrap gap-3 items-center justify-between max-w-xl w-full">
      {/* Category Dropdown */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Category:
        </label>
        <select
          value={selectedCategory}
          onChange={(e) =>
            onCategoryChange(e.target.value as IssueCategory | "all")
          }
          className="w-full border rounded-md px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.filter((c) => c !== "all").map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat as IssueCategory]}
            </option>
          ))}
        </select>
      </div>

      {/* Status Toggle Buttons */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
        {(["open", "resolved", "all"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
              selectedStatus === status
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}