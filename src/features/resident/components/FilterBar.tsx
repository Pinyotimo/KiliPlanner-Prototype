import type { IssueCategory, IssueStatus } from "../../../types/issue";
import { CATEGORY_LABELS } from "../../../types/issue";
import { Button } from "../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

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
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl flex flex-wrap items-center gap-3 text-xs w-full max-w-3xl justify-between transition-all">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
        <span className="font-semibold text-muted-foreground shrink-0 mr-1">
          Category:
        </span>
        <Button
          size="sm"
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => onCategoryChange("all")}
          className={`rounded-full h-7 text-xs border-border transition-colors ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground hover:bg-primary border-primary"
              : "bg-muted/80 text-muted-foreground hover:bg-accent hover:text-primary-foreground"
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
              className={`rounded-full h-7 text-xs whitespace-nowrap border-border transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground hover:bg-primary border-primary"
                  : "bg-muted/80 text-muted-foreground hover:bg-accent hover:text-primary-foreground"
              }`}
            >
              {CATEGORY_LABELS[key]}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-muted-foreground">Status:</span>
        <Select
          value={selectedStatus}
          onValueChange={(val) => onStatusChange(val as IssueStatus | "all")}
        >
          <SelectTrigger className="h-7 w-28 text-xs bg-muted border-border text-foreground focus:ring-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border text-foreground z-30">
            <SelectItem value="all">All</SelectItem>
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
