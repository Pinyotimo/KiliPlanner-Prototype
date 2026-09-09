import type { Issue } from "../types/issue";
import { Button } from "@/components/ui/button";
import IssueCard from "./IssueCard";

interface IssueFeedProps {
  issues: Issue[];
  onReportClick: () => void;
}

export default function IssueFeed({ issues, onReportClick }: IssueFeedProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-card rounded-xl border border-dashed border-border max-w-md mx-auto my-6">
        <p className="text-muted-foreground text-sm">
          No issues found matching your filters.
        </p>
        <Button
          variant="link"
          onClick={onReportClick}
          className="mt-2 text-xs font-semibold"
        >
          + Report a new issue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}