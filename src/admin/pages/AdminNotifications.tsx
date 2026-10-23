import NotificationList from "../../components/NotificationList";
import type { Issue } from "../../types/issue";
import { navigateToPlanner } from "../lib/plannerAccess";

interface AdminNotificationsProps {
  issues: Issue[];
  unreadIssues: Issue[];
  onMarkAllRead: () => void;
  onMarkRead: (issueId: string) => void;
}

export default function AdminNotifications({
  issues,
  unreadIssues,
  onMarkAllRead,
  onMarkRead,
}: AdminNotificationsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <NotificationList
        issues={issues}
        unreadIssueIds={unreadIssues.map((issue) => issue.id)}
        onIssueSelect={(issueId) => {
          onMarkRead(issueId);
          navigateToPlanner(`/planner/issues/${issueId}`);
        }}
        onMarkAllRead={onMarkAllRead}
        emptyMessage="No infrastructure reports have been submitted yet."
      />
    </div>
  );
}
