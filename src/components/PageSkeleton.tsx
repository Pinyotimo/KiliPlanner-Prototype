import { useState, useEffect } from "react";
import { RefreshCw, MapPin, Filter, Layers } from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

type PageSkeletonProps = {
  variant: "resident" | "planner";
  onRetry?: () => void;
};

const LOADING_STEPS = [
  "Connecting to Kilimani ward database...",
  "Fetching location benchmarks...",
  "Loading spatial reports...",
  "Finalizing dashboard view...",
];

function InteractiveTopBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = ["All Issues", "Open", "In Progress", "Resolved"];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <Filter className="h-4 w-4 text-muted-foreground animate-pulse" />
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 border ${
            activeTab === tab
              ? "bg-primary/10 border-primary text-primary shadow-xs"
              : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function ResidentSkeleton({ onRetry }: { onRetry?: () => void }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Issues");
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    setIsRefreshing(true);
    onRetry?.();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <div
      className="mx-auto w-full max-w-3xl space-y-5 p-4 animate-in fade-in-50 duration-300"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Dynamic Simulated Progress Line */}
      <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden relative">
        <div className="h-full bg-primary/70 animate-pulse rounded-full w-2/3 transition-all duration-500" />
      </div>

      {/* Interactive Header & Dynamic Loading Message */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 rounded-md" />
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-warning animate-ping inline-block" />
            {LOADING_STEPS[statusIdx]}
          </p>
        </div>

        {onRetry && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRefreshing}
            className="transition-transform active:scale-95 cursor-pointer"
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
            {isRefreshing ? "Syncing..." : "Retry"}
          </Button>
        )}
      </div>

      {/* Interactive Pre-filter Category Tabs */}
      <InteractiveTopBar
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
      />

      {/* Responsive Hoverable Skeleton Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((item, index) => (
          <div
            key={item}
            className={`group relative overflow-hidden space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-2xs transition-all duration-300 hover:border-primary/40 hover:shadow-md cursor-wait ${
              index === 0 ? "sm:col-span-2" : ""
            }`}
          >
            {/* Shimmer Overlay */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent group-hover:animate-shimmer" />

            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full ring-2 ring-muted/20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32 rounded-sm" />
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground/50" />
                  <Skeleton className="h-3 w-20 rounded-sm" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-sm" />
              <Skeleton
                className={`h-4 rounded-sm ${
                  index === 0 ? "w-5/6" : index === 1 ? "w-4/5" : "w-2/3"
                }`}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Skeleton className="h-3 w-24 rounded-sm" />
              <div className="h-8 w-20 rounded-md bg-muted/60 hover:bg-muted transition-colors flex items-center justify-center">
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlannerSkeleton() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div
      className="space-y-6 p-4 animate-in fade-in-50 duration-300"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header controls skeleton */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-52 rounded-md" />
          <Skeleton className="h-3 w-36 rounded-sm" />
        </div>
        <div className="flex gap-2">
          {["Overview", "Heatmap", "Reports"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid with Subtle Hover Reactions */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-2xs transition-all hover:border-primary/30 hover:shadow-xs cursor-wait"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-sm" />
              <Layers className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
            </div>
            <Skeleton className="mt-4 h-8 w-16 rounded-md" />
            <div className="mt-3 flex items-center gap-2">
              <Skeleton className="h-3 w-12 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table/List Block */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3 w-60 rounded-sm" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 border-t border-border/50 pt-3 transition-colors hover:bg-muted/30 p-2 rounded-lg"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4 rounded-sm" />
                <Skeleton className="h-2.5 w-1/3 rounded-sm" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PageSkeleton({ variant, onRetry }: PageSkeletonProps) {
  return variant === "planner" ? (
    <PlannerSkeleton />
  ) : (
    <ResidentSkeleton onRetry={onRetry} />
  );
}
