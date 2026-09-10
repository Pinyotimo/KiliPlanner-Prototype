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
    <div className="flex flex-wrap items-center gap-3 text-xs w-full max-w-3xl justify-between">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="font-semibold text-muted-foreground shrink-0">
          Category:
        </span>
        <Button
          size="sm"
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => onCategoryChange("all")}
          className="rounded-full h-7 text-xs"
        >
          All
        </Button>
        {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={selectedCategory === key ? "default" : "outline"}
            onClick={() => onCategoryChange(key)}
            className="rounded-full h-7 text-xs whitespace-nowrap"
          >
            {CATEGORY_LABELS[key]}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-semibold text-muted-foreground">Status:</span>
        <Select
          value={selectedStatus}
          onValueChange={(val) => onStatusChange(val as IssueStatus | "all")}
        >
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}