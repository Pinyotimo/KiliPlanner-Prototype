import React, { useState, useEffect, useMemo } from "react";
import { Plus, Inbox } from "lucide-react";
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
        document.getElementById(`issue-${issueParam}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [issues]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {isFocusedView ? "Selected Report Details" : "Kilimani Community Feed"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isFocusedView ? "Showing only the report selected from Analytics" : "Real-time safety & infrastructure ward activity feed"}
          </p>
        </div>
        {isFocusedView && onShowAllReports ? (
          <Button onClick={onShowAllReports} variant="outline" className="font-semibold rounded-full">
            Show All Reports
          </Button>
        ) : (
          <Button onClick={onReportClick} className="gap-2 font-semibold rounded-full shadow-md bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 stroke-[3]" /> Report Issue
          </Button>
        )}
      </div>

      {/* Feed Content */}
      {sortedIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-card rounded-2xl border border-dashed border-border/80">
          <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
            <Inbox className="h-8 w-8" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No reports found</h3>
          <p className="text-sm text-muted-foreground">There are no reports matching your current filter parameters.</p>
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