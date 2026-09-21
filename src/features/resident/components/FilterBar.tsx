import React from "react";
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
import { CategoryIcon } from "../../../components/CategoryIcon";
import { X, SlidersHorizontal, CheckCircle2, Clock3, AlertCircle, XCircle } from "lucide-react";

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
  const hasActiveFilters = selectedCategory !== "all" || selectedStatus !== "all";

  const handleReset = () => {
    onCategoryChange("all");
    onStatusChange("all");
  };

  return (
    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border border-border/80 rounded-2xl p-3.5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-3 text-xs w-full max-w-3xl justify-between transition-all">
      {/* Category Horizontal Scroll Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 max-w-full scrollbar-none relative">
        <div className="flex items-center gap-1.5 shrink-0 pr-1 text-muted-foreground font-medium">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filter:</span>
        </div>

        {/* All Pill */}
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-sm scale-105"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>All Categories</span>
        </button>

        {/* Dynamic Category Pills */}
        {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((key) => {
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onCategoryChange(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <CategoryIcon category={key} className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{CATEGORY_LABELS[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Status Filter & Reset Action */}
      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border/50">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive gap-1 transition-colors cursor-pointer"
            title="Clear all filters"
          >
            <X className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}

        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground">Status:</span>
          <Select
            value={selectedStatus}
            onValueChange={(val) => onStatusChange(val as IssueStatus | "all")}
          >
            <SelectTrigger className="h-8 w-32 text-xs bg-muted/70 border-border text-foreground rounded-lg focus:ring-primary/20 cursor-pointer">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground z-30 rounded-xl shadow-xl">
              <SelectItem value="all" className="cursor-pointer text-xs py-2">
                All Statuses
              </SelectItem>
              <SelectItem value="UNVERIFIED" className="cursor-pointer text-xs py-2">
                <span className="flex items-center gap-2">
                  <Clock3 className="h-3 w-3 text-muted-foreground" /> Under verification
                </span>
              </SelectItem>
              <SelectItem value="UNDER_REVIEW" className="cursor-pointer text-xs py-2">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-amber-500" /> Under review
                </span>
              </SelectItem>
              <SelectItem value="CORROBORATED" className="cursor-pointer text-xs py-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-blue-500" /> Corroborated
                </span>
              </SelectItem>
              <SelectItem value="VERIFIED" className="cursor-pointer text-xs py-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" /> Verified
                </span>
              </SelectItem>
              <SelectItem value="RESOLVED" className="cursor-pointer text-xs py-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Resolved
                </span>
              </SelectItem>
              <SelectItem value="REJECTED" className="cursor-pointer text-xs py-2">
                <span className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-destructive" /> Rejected
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}