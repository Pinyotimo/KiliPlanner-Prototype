import React, { useState, useEffect, useMemo } from "react";
import { Plus, Inbox, Layers } from "lucide-react";
import type { Issue } from "../../../types/issue";
import { Button } from "../../../components/ui/button";
import { sortFeedIssues } from "../lib/feedUtils";
import { IssueCard } from "./IssueCard";

interface IssueFeedProps {
  issues: Issue[];
  onReportClick: () => void;
  targetIssueId?: string | null;
  isFocusedView?: boolean;
  onShowAllReports?: () => void;
  onUpdateIssue?: (issueId: string, updates: Partial<Issue>) => Promise<void>;
  onDeleteIssue?: (issueId: string) => Promise<void>;
}

export default function IssueFeed({
  issues,
  onReportClick,
  targetIssueId: controlledTargetIssueId,
  isFocusedView = false,
  onShowAllReports,
  onUpdateIssue,
  onDeleteIssue,
}: IssueFeedProps) {
  const [urlTargetIssueId, setUrlTargetIssueId] = useState<string | null>(null);
  const targetIssueId = controlledTargetIssueId ?? urlTargetIssueId;
  const sortedIssues = useMemo(() => sortFeedIssues(issues), [issues]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const issueParam = params.get("issue");
    if (issueParam) {
      setUrlTargetIssueId(issueParam);
      const timer = setTimeout(() => {
        document
          .getElementById(`issue-${issueParam}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [issues]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-24">
      {/* Feed header */}
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isFocusedView
                ? "Selected Report Details"
                : "Kilimani Community Feed"}
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
              {sortedIssues.length}{" "}
              {sortedIssues.length === 1 ? "report" : "reports"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFocusedView
              ? "Showing only the report selected from Analytics"
              : "Real-time safety & infrastructure ward activity feed"}
          </p>
        </div>
        {isFocusedView && onShowAllReports ? (
          <Button
            onClick={onShowAllReports}
            variant="outline"
            className="shrink-0 cursor-pointer gap-1.5 font-semibold"
          >
            <Layers className="h-4 w-4" />
            Show All Reports
          </Button>
        ) : (
          <Button
            onClick={onReportClick}
            className="shrink-0 cursor-pointer gap-2 font-semibold shadow-lifted"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Report Issue
          </Button>
        )}
      </div>

      {/* Feed content */}
      {sortedIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
            <Inbox className="h-8 w-8" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No reports found</h3>
          <p className="text-sm text-muted-foreground">
            There are no reports matching your current filter parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isTargeted={String(issue.id) === targetIssueId}
              onUpdate={onUpdateIssue}
              onDelete={onDeleteIssue}
            />
          ))}
        </div>
      )}
    </div>
  );
}
