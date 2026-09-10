import type { IssueCategory, IssueStatus } from "../types/issue";
import { CATEGORY_LABELS } from "../types/issue";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface FilterBarProps {
  selectedCategory: IssueCategory | "all";
  onCategoryChange: (cat: IssueCategory | "all") => void;
  selectedStatus: IssueStatus | "all";
  onStatusChange: (status: IssueStatus | "all") => void;
}

export default function FilterBar({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex flex-wrap items-center gap-3 text-xs w-full max-w-3xl justify-between transition-all">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
        <span className="font-semibold text-slate-400 shrink-0 mr-1">
          Category:
        </span>
        <Button
          size="sm"
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => onCategoryChange("all")}
          className={`rounded-full h-7 text-xs border-slate-700 transition-colors ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white hover:bg-blue-500 border-blue-500"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          All
        </Button>
        {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((key) => {
          const isSelected = selectedCategory === key;
          return (
            <Button
              key={key}
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onCategoryChange(key)}
              className={`rounded-full h-7 text-xs whitespace-nowrap border-slate-700 transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white hover:bg-blue-500 border-blue-500"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {CATEGORY_LABELS[key]}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-slate-400">Status:</span>
        <Select
          value={selectedStatus}
          onValueChange={(val) => onStatusChange(val as IssueStatus | "all")}
        >
          <SelectTrigger className="h-7 w-28 text-xs bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 z-30">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}