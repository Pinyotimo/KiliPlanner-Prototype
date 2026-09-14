import { Bell, CheckCircle2, MapPin } from "lucide-react";
import type { Issue } from "../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types/issue";
import { relativeTime } from "../lib/relativeTime";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface NotificationListProps {
  issues: Issue[];
  unreadIssueIds?: string[];
  emptyMessage?: string;
  onIssueSelect?: (issueId: string) => void;
  onMarkAllRead?: () => void;
}

export default function NotificationList({
  issues,
  unreadIssueIds = [],
  emptyMessage = "No new reported issues yet.",
  onIssueSelect,
  onMarkAllRead,
}: NotificationListProps) {
  const unreadSet = new Set(unreadIssueIds);
  const unreadCount = issues.filter((issue) => unreadSet.has(issue.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">New Report Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread reported issue${unreadCount === 1 ? "" : "s"}`
                : "You're caught up on reported issues."}
            </p>
          </div>
        </div>
        {onMarkAllRead && unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMarkAllRead}
            className="gap-1.5 text-xs font-semibold"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark All Read
          </Button>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const isUnread = unreadSet.has(issue.id);
            const categoryColor = CATEGORY_COLORS[issue.category] || "#64748b";
            const content = (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${categoryColor}15`,
                          borderColor: `${categoryColor}35`,
                          color: categoryColor,
                        }}
                        className="text-[10px] font-bold uppercase tracking-wide"
                      >
                        {CATEGORY_LABELS[issue.category]}
                      </Badge>
                      {isUnread && (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                      New {CATEGORY_LABELS[issue.category]} report submitted
                    </h3>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {issue.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {relativeTime(issue.created_at)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">
                      {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                    </span>
                  </span>
                  <span className="capitalize">{issue.status.replace("_", " ")}</span>
                </div>
              </>
            );

            if (onIssueSelect) {
              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onIssueSelect(issue.id)}
                  className={`block w-full rounded-xl border bg-card p-4 text-left shadow-xs transition-colors hover:border-primary/50 ${
                    isUnread ? "border-primary/50" : "border-border"
                  }`}
                >
                  {content}
                </button>
              );
            }

            return (
              <article
                key={issue.id}
                className={`rounded-xl border bg-card p-4 shadow-xs ${
                  isUnread ? "border-primary/50" : "border-border"
                }`}
              >
                {content}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
