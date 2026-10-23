import React from "react";
import type { IssueCategory, IssueStatus } from "../../../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../types/issue";
import { Button } from "../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { CategoryIcon } from "../../../components/CategoryIcon";
import {
  X,
  SlidersHorizontal,
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  CircleDot,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  selectedCategory: IssueCategory | "all";
  onCategoryChange: (cat: IssueCategory | "all") => void;
  selectedStatus: IssueStatus | "all";
  onStatusChange: (status: IssueStatus | "all") => void;
}

const STATUS_OPTIONS: {
  value: IssueStatus | "all";
  label: string;
  icon: typeof Clock3;
  className?: string;
}[] = [
  { value: "all", label: "All Statuses", icon: CircleDot },
  { value: "UNVERIFIED", label: "Under verification", icon: Clock3 },
  { value: "UNDER_REVIEW", label: "Under review", icon: AlertCircle },
  { value: "CORROBORATED", label: "Corroborated", icon: CheckCircle2 },
  { value: "VERIFIED", label: "Verified", icon: ShieldCheck },
  { value: "RESOLVED", label: "Resolved", icon: CheckCircle2 },
  { value: "REJECTED", label: "Rejected", icon: XCircle },
];

export default function FilterBar({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
}: FilterBarProps) {
  const hasActiveFilters = selectedCategory !== "all" || selectedStatus !== "all";

  const handleReset = () => {
    onCategoryChange("all");
    onStatusChange("all");
  };

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3 rounded-xl border border-border bg-card/85 p-3 shadow-lifted backdrop-blur-md md:flex-row md:items-center md:justify-between">
      {/* Category pills */}
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none">
        <div className="flex shrink-0 items-center gap-1.5 pr-1 text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden text-xs font-medium sm:inline">Filter:</span>
        </div>

        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          aria-pressed={selectedCategory === "all"}
          className={cn(
            "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-soft"
              : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          All Categories
        </button>

        {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((key) => {
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onCategoryChange(key)}
              aria-pressed={isSelected}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <CategoryIcon
                category={key}
                className="h-3.5 w-3.5 shrink-0"
                color={
                  isSelected ? undefined : CATEGORY_COLORS[key]
                }
              />
              <span className="whitespace-nowrap">{CATEGORY_LABELS[key]}</span>
              {isSelected && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[key] }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Status + reset */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border pt-2 md:border-l md:border-t-0 md:pl-3 md:pt-0">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 cursor-pointer gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
            title="Clear all filters"
          >
            <X className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}

        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            Status:
          </span>
          <Select
            value={selectedStatus}
            onValueChange={(val) => onStatusChange(val as IssueStatus | "all")}
          >
            <SelectTrigger className="h-8 w-40 cursor-pointer text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="z-30 rounded-xl">
              {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="cursor-pointer py-2 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
